import {
  AfterViewChecked,
  Component,
  ElementRef,
  HostListener,
  Inject,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  catchError,
  delay,
  filter,
  first,
  flatMap,
  map,
  pluck,
  shareReplay,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { VotingService } from '../voting.service';
import { BehaviorSubject, combineLatest, from, merge, Observable, of, Subject, Subscriber, throwError, } from 'rxjs';
import { ModalService } from '@shared/modal-service/modal.service';
import { WebCryptoService } from '@shared/modules/web-crypto/web-crypto.service';
import { APP_POST_DATA } from '@shared/providers/post-data';
import { APP_IS_PLATFORM_BROWSER } from '@shared/providers/is-platform';
import { BlockchainService } from 'projects/voting-box/src/app/blockchain/blockchain.service';
import { postWebviewMessage } from '@shared/utils/postWebviewMessage';

import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { ConfirmModalComponent } from '../../confirm-modal/confirm-modal.component';
import { ElectionDto } from '@shared/models/portal.models';
import { DisableModalComponent } from '../../disable-modal/disable-modal.component';
import { default as base58 } from '@shared/modules/web-crypto/base58.lib';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DomSanitizer } from '@angular/platform-browser';

declare const jscd: any;

// tslint:disable-next-line:typedef
const debug = (name) => tap((v) => console.log(name, v));

interface SecureData {
  seed: {
    publicKey: string;
    privateKey: string;
  };
  contractId: string;
  blindSign: string;
  mainKey: {
    x: string;
    y: string;
  };
}

@Component({
  selector: 'app-voting',
  templateUrl: './election.component.html',
  styleUrls: ['./election.component.scss']
})
export class ElectionComponent implements AfterViewChecked {

  detectBrowser = this.isBrowser ? jscd : {};

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private service: VotingService,
    private modalService: ModalService,
    private webCryptoService: WebCryptoService,
    @Inject(APP_POST_DATA) private postData: any, // = testData, // todo для тестов можно юзать `postData: any = testData,`
    @Inject(APP_IS_PLATFORM_BROWSER) public isBrowser: boolean,
    private blockChainService: BlockchainService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) {
    if (this.isBrowser) {
      this.zoom$.subscribe();
      this.canVote$.subscribe(() => {
      }, (error) => {
        let text: string;
        if (error === 150) {
          text = 'MODALS.BALLOT_FAULT.ERROR_150';
        } else if (error === 153) {
          text = 'MODALS.BALLOT_FAULT.ERROR_153';
        }
        this.election$.subscribe(election => {
          this.showDisableModal('MODALS.BALLOT_FAULT.TITLE', text, election.name);
        });
        this.disabled$.next(true);
        this.candidatesFormArray.disable();
        this.disablePreview();
      });
    }
  }

  get candidatesFormArray(): FormArray {
    return this.candidatesList.controls.candidates as FormArray;
  }

  @ViewChild('prePreview', {static: false}) prePreview: ElementRef;
  @ViewChild('preview', {static: false}) preview: ElementRef;
  @ViewChild('container', {static: false}) container: ElementRef;
  @ViewChild('previewForeign', {static: false}) previewForeign: ElementRef;
  @ViewChildren('inputs') inputs: QueryList<ElementRef>;

  error$ = new BehaviorSubject(null);
  candidatesList = new FormGroup({
    candidates: new FormArray([])
  });
  redirectUrl$ = of(this.route.snapshot.queryParamMap.get('returnUrl')).pipe(
    switchMap(redirectUrl => {
      if (redirectUrl) {
        return of(redirectUrl);
      } else {
        return environment.production ? this.http.get('/settings/elections-link', {responseType: 'text'}) : of('http://localhost:4200/elections');
      }
    }),
  );
  done$ = new BehaviorSubject(false);
  disabled$ = new BehaviorSubject(false);
  loading$ = new BehaviorSubject(false);
  data$: Observable<SecureData> = of(this.postData).pipe(
    withLatestFrom(this.route.fragment),
    switchMap(([postData, fragment]) => {
      if (!fragment || !(postData && postData.encrypted)) {
        return throwError(1);
      }
      // tslint:disable-next-line:typedef
      const {password, salt} = JSON.parse(postData.encrypted);
      return from(this.webCryptoService.gostDecrypt<SecureData>(fragment, password, base58.decode(salt)));
    }),
    tap(v => {
      if (!(!!v && typeof v === 'object' && ['seed', 'blindSign', 'contractId'].every(k => Object.keys(v).includes(k)))) {
        throw 1;
      }
    }),
    shareReplay(),
  );

  isPreview$ = this.route.queryParams.pipe(
    pluck('preview'),
    map(v => v === 'true'),
    // shareReplay(),
  );

  electionId$: Observable<string> = this.route.paramMap.pipe(
    map((params: ParamMap) => params.get('id')),
    shareReplay(),
  );

  image$ = !this.isBrowser ? of(null) : this.electionId$.pipe(
    filter(i => i !== null),
    switchMap((electionId) => {
        return this.http.get(`/api/public/ballot/${electionId}/preview`, {responseType: 'arraybuffer'}).pipe(
          map((i: any) => this.sanitizer.bypassSecurityTrustUrl('data:image/png;base64,' + btoa(bytesToString(i)))),
        );
      }
    ),
    shareReplay(),
  );

  canVote$ = this.data$.pipe(
    pluck('seed', 'publicKey'),
    withLatestFrom(this.electionId$),
    switchMap(([publicKey, electionId]) => this.service.canVote(electionId, publicKey)),
    map(({data, error}) => {
      if (data === true) {
        return true;
      } else {
        throw error.code;
      }
    }),
  );

  election$: Observable<ElectionDto> = this.electionId$.pipe(
    switchMap((id) => this.service.getElection(id, this.route.snapshot.queryParamMap.get('lang') || '0')),
    tap((election) => {
      this.candidatesFormArray.clear();
      election.candidates.forEach(() => {
        this.candidatesFormArray.push(new FormControl({value: false, disabled: this.disabled$.value}));
      });
    }),
    shareReplay(),
  );

  timer$: Observable<string | number> = !this.isBrowser ? of(0) : this.election$.pipe(
    map((election) => election.endDateTime),
  );

  // todo сложные для чтения конструкции
  transaction$ = this.data$.pipe(
    first(),
    withLatestFrom(this.election$),
    switchMap(([data, election]) => {
      const {seed, contractId, blindSign, mainKey}: SecureData = data;
      const voteArray = this.candidatesFormArray.value.map(v => +!!v);
      return this.blockChainService.createTransaction(
        seed,
        contractId,
        {
          vote: [voteArray],
          blindSignature: blindSign,
        },
        mainKey,
      ).pipe(
        map((t) => {
          return {
            ...t,
            signature: blindSign,
            electionId: election.id,
          };
        }),
      );
    }),
  );

  // todo сложные для чтения конструкции
  vote$ = this.showModal().pipe(
    filter(confirm => !!confirm),
    tap(() => this.loading$.next(true)),
    flatMap(() => this.transaction$),
    filter((transaction) => !postWebviewMessage('vote', {transaction})),
    flatMap((transaction) => this.service.vote(transaction)),
    tap(() => {
      this.loading$.next(false);
      this.done$.next(true);
      this.redirectUrl$.pipe(
        delay(3000),
      ).subscribe((url) => {
        window.location.href = url;
      });
    }),
    catchError(e => {
      this.loading$.next(false);
      this.error$.next(e);
      return throwError(e);
    }),
  );

  disabledButton$ = this.candidatesList.valueChanges.pipe(
    map((value: any) => {
      if (value == null) {
        return of(false);
      }
      return value.candidates.every(elem => elem === false);
    })
  );

  resize$ = new Subject();
  zoomQuery$ = new BehaviorSubject(null);

  needHeight$: Observable<number> = merge(
    this.resize$,
    this.zoomQuery$,
  ).pipe(
    map(() => this.isBrowser ? (window.innerHeight - this.prePreview?.nativeElement.offsetHeight || 1000) : 1000),
  );

  needWidth$: Observable<number> = merge(
    this.resize$,
    this.zoomQuery$,
  ).pipe(
    map(() => this.container?.nativeElement.offsetWidth || 1000),
  );

  previewHeight$: Observable<number> = merge(
    this.resize$,
    this.zoomQuery$,
  ).pipe(
    map(() => document.querySelector('#view')?.scrollHeight),
    filter(ph => ph > 0),
  );

  previewWidth$: Observable<number> = merge(
    this.resize$,
    this.zoomQuery$,
  ).pipe(
    map(() => document.querySelector('#view')?.scrollWidth),
    filter(ph => ph > 0),
  );

  zoom$ = combineLatest([
    this.needHeight$,
    this.needWidth$,
    this.previewHeight$,
    this.previewWidth$,
  ]).pipe(
    map(([nh, nw, ph, pw]) => {
      setTimeout(() => {
        if (!!this.previewForeign) {
          this.previewForeign.nativeElement.style.height = ph;
          this.previewForeign.nativeElement.setAttribute('height', ph);
          this.previewForeign.nativeElement.style.width = pw;
          this.previewForeign.nativeElement.setAttribute('width', pw);
        }
        if (!!this.preview) {
          this.preview.nativeElement.style.width = nw + 'px';
          this.preview.nativeElement.style.height = nh + 'px';
          this.preview.nativeElement.setAttribute('viewBox', `0 0 ${pw} ${ph}`);
        }
      }, 0);
    })
  );

  alreadyTicked = false;

  @HostListener('window:resize')
  private onResize(): void {
    this.zoomQuery$.next(null);
  }

  calculateZoom(): void {
    this.zoomQuery$.next(null);
  }

  enablePreview(): void {
    this.router.navigate([], {
      queryParams: {preview: true},
      queryParamsHandling: 'merge',
      preserveFragment: true,
    });
    setTimeout(() => {
      this.zoomQuery$.next(null);
    }, 0);
  }

  ngAfterViewChecked(): void {
    if (this.isBrowser && document.querySelector('#view') && !this.alreadyTicked) {
      this.zoomQuery$.next(null);
      this.alreadyTicked = true;
    }
  }

  clickEnablePreview(target: any): void {
    if (target.classList.contains('check__box')
      || target.classList.contains('check__input')
      || target.classList.contains('button')) {
      return;
    }
    this.enablePreview();
  }

  disablePreview(): void {
    this.isPreview$.pipe(
      first(),
      filter(p => !!p),
    ).subscribe(() => {
      this.router.navigate([], {
        queryParams: {preview: false},
        queryParamsHandling: 'merge',
        preserveFragment: true,
      }).then();
    });
  }

  vote(): any {
    this.vote$.subscribe();
  }

  showModal(): Observable<boolean> {
    return this.election$.pipe(
      switchMap((election) => {
        const fio = election.candidates[this.candidatesFormArray.value.indexOf(true)]?.fio || '';
        // todo сложная конструкция. и проявляется в двух местах. надо упрощать
        return new Observable<boolean>((subscriber: Subscriber<boolean>): any => {
          this.modalService.open(ConfirmModalComponent, {
            inputs: {
              fio,
            },
            outputs: {
              confirm: {
                emit: (confirm: boolean): void => {
                  subscriber.next(confirm);
                  subscriber.complete();
                },
              },
            },
            height: '100vh',
            closeCross: false,
            stylesCustom: true,
          });
          return (): void => {
            this.modalService.close();
          };
        });

      }),
    );
  }

  showDisableModal(title?: string, text?: string, ballotName?: string): void {
    this.redirectUrl$.subscribe((url) => {
      this.modalService.open(DisableModalComponent, {
        inputs: {
          url,
          title,
          text,
          ballotName,
        },
        closeCross: false,
      });
    });
  }


  checked(index: number): void {
    const inputs = this.inputs.toArray();
    this.candidatesFormArray.controls.forEach((value, i) => {
      if (index !== i) {
        value.setValue(false);
        value.markAsPristine();
      }
    });
    if (!!inputs[index]) {
      setTimeout(()=> inputs[index].nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end'}), 0);
    }
  }
}

function bytesToString(arrayBuffer: ArrayBuffer): any {
  const byteArray = new Uint8Array(arrayBuffer);
  let byteString = '';
  for (let i = 0; i < byteArray.byteLength; i++) {
    byteString += String.fromCharCode(byteArray[i]);
  }
  return byteString;
}
