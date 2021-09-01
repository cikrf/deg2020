import { Component } from '@angular/core';
import {
  catchError,
  delayWhen,
  filter,
  map, mapTo,
  mergeMap,
  pluck,
  shareReplay,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { VotingService } from '../voting.service';
import { BehaviorSubject, combineLatest, from, iif, of, Subject, throwError } from 'rxjs';
import { WebCryptoService } from '@shared/modules/web-crypto/web-crypto.service';
import { redirectWithPost } from '@shared/utils/redirectWithPost';
import { RandomNumbersService } from '@shared/modules/random-numbers/random-numbers.service';
import { BlindSignatureService } from '@shared/modules/blind-signature/blind-signature.service';
import { BlindSignatureApiService } from '@shared/modules/blind-signature/blind-signature-api.service';
import { GostEcBlindRequester2001 } from '@shared/modules/blind-signature/libs/sign';
import { ProfileService } from '../../profile/profile.service';
import { postWebviewMessage } from '@shared/utils/postWebviewMessage';
import { ModalService } from '@shared/modal-service/modal.service';
import { default as base58 } from '@shared/modules/web-crypto/base58.lib';
import { TranslateService } from '@ngx-translate/core';
import { EnvService } from '@shared/modules/env/env.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-voting',
  templateUrl: './election.component.html',
  styleUrls: ['./election.component.scss']
})
export class ElectionComponent {

  isNewBallot = true; // todo избавиться
  loading$ = new BehaviorSubject(false);
  continue$ = new BehaviorSubject(false);
  continueSubject$ = new Subject();
  error$ = new BehaviorSubject(null);
  electionId$ = this.route.paramMap.pipe(map((params: ParamMap) => params.get('id')));
  isAuth$ = this.electionId$.pipe(
    switchMap((id: string) => this.votingService.checkAuthentication(id).pipe(
      tap(() => this.loading$.next(true)),
      )
    ),
  );
  isBallotIssued$ = this.electionId$.pipe(
    switchMap((id: string) => this.votingService.isBallotIssued(id)),
    shareReplay(),
  );
  passphrase$ = this.electionId$.pipe(switchMap(id => this.votingService.getPassphrase(id)));
  messageFromStorage$ = this.electionId$.pipe(map(id => this.profileService.getVotingPackage(id)));
  ballot$ = combineLatest([
    this.messageFromStorage$,
    this.isBallotIssued$
  ]).pipe(
    switchMap(([message, issued]) => {
      if (issued && message === null) {
        const error = {
          error: {
            error: {
              title: this.ts.instant('ELECTION.OTHER_DEVICE'),
              description: this.doStringEarly(),
            }
          }
        };
        console.warn(error);
        this.loading$.next(false);
        this.error$.next(error);
        return throwError(error);
      }
      return iif(() => message !== null,
        this.passphrase$.pipe(
          switchMap((passphrase: string) => {
            return from(this.webCrypto.gostDecrypt(message, passphrase.substring(0, 36), base58.decode(passphrase.substring(36))));
          }),
          tap((v) => {
            if (!(!!v && typeof v === 'object' && ['seed', 'blindSign', 'contractId'].every(k => Object.keys(v).includes(k)))) {
              const error = {
                error: {
                  error: {
                    title: this.ts.instant('ELECTION.OTHER_DEVICE'),
                    description: this.ts.instant('ELECTION.EARLY'),
                  }
                }
              };
              console.warn(error);
              this.loading$.next(false);
              this.error$.next(error);
              throw new Error(error.error.error.description);
            } else {
              this.isNewBallot = false;
            }
          }),
        ),
        this.allData$,
      );
    }),
  );

  seed$ = from(this.webCrypto.createRandom()).pipe(
    switchMap((numbers: Uint8Array) => {
      if (numbers) {
        return this.webCrypto.createSeed(numbers);
      } else {
        const error = {
          error: {
            error: {
              description: this.ts.instant('ELECTION.INTERRUPTED'),
            }
          }
        };
        postWebviewMessage('close');
        console.warn(error);
        this.loading$.next(false);
        this.error$.next(error);
        return throwError(error);
      }
    }),
    shareReplay(),
  );

  publicKey$ = this.electionId$.pipe(
    switchMap(id => this.blindSignatureApiService.getBlindSignaturePublicKey(id)),
    shareReplay(),
  );

  randomFromPublicKey$ = this.publicKey$.pipe(
    map(({modulus}) => this.blindSignatureService.randomByN(modulus)),
    shareReplay(),
  );

  voteData$ = combineLatest([
    this.publicKey$,
    this.randomFromPublicKey$,
    this.seed$,
  ]).pipe(
    map(([publicKey, random, s]) => {
      if ('publicKey' in s && 'privateKey' in s) {
        return this.blindSignatureService.applyBlindingLayer(publicKey, s.publicKey, random);
      } else {
        return throwError(s);
      }
    }),
    withLatestFrom(this.electionId$),
    switchMap(([message, electionId]) => {
      const pass = this.webCrypto.createPassword();
      const salt = this.webCrypto.createSalt();
      return this.votingService.getVoteData(electionId, message.toString(16), pass + base58.encode(salt)).pipe(map(voteData => {
        return {...voteData, pass, salt};
      }));
    }),
    shareReplay(),
    catchError(e => throwError(e)),
  );

  blindSign$ = combineLatest([
    this.voteData$.pipe(pluck('blindSign')),
    this.publicKey$.pipe(pluck('modulus')),
    this.randomFromPublicKey$,
  ]).pipe(
    map(([blindSign, modulus, random]) => {
      return this.blindSignatureService.extractBlindSign(
        blindSign,
        modulus,
        random,
      );
    }),
  );

  allData$ = combineLatest([
    this.seed$,
    this.blindSign$,
    this.voteData$,
    this.electionId$,
  ]).pipe(switchMap(([seed, blindSign, {contractId, mainKey, pass, salt}, electionId]) => {
    const ballot = {
      seed, blindSign: blindSign.toString(16), contractId, mainKey
    };
    return from(this.webCrypto.gostEncrypt(JSON.stringify(ballot), pass, salt)).pipe(
      tap((v) => this.profileService.setVotingPackage(electionId, v.message)),
      mapTo(ballot),
    );
  }));

  votingBoxUrl$ = environment.production ? this.http.get('/settings/voting-box', {responseType: 'text'}) : of('http://localhost:4201/');

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private webCrypto: WebCryptoService,
    private votingService: VotingService,
    private randomNumbers: RandomNumbersService,
    private blindSignatureService: BlindSignatureService,
    private blindSignatureApiService: BlindSignatureApiService,
    private profileService: ProfileService,
    private modalService: ModalService,
    private ts: TranslateService,
    private http: HttpClient,
  ) {
    this.isAuth$.pipe(
      switchMap(() => this.ballot$),
      switchMap((ballot) => from(this.webCrypto.gostEncrypt(JSON.stringify(ballot)))),
      delayWhen(() => this.showContinue()),
      withLatestFrom(this.electionId$, this.profileService.lang$, this.votingBoxUrl$),
    ).subscribe(([encryptedContent, electionId, lang, url]) => {
      if (!!encryptedContent) {
        redirectWithPost(
          this.getUrl(url, electionId, lang.code, encryptedContent.message),
          'encrypted',
          JSON.stringify({
            password: encryptedContent.password,
            salt: base58.encode(encryptedContent.salt),
          }),
        );
      }
    }, e => {
      console.log(e);
      this.loading$.next(false);
      this.error$.next(e);
    });

  }

  private doStringEarly(): string {
    return `
        <p>${this.ts.instant('ELECTION.OTHER_DEVICE_DESC_1')}</p>
    `;
  }

  showContinue(): Subject<any> {
    this.loading$.next(false);
    this.continue$.next(true);
    return this.continueSubject$;
  }

  routeToRoot(): void {
    this.router.navigate(['/']);
  }

  private getUrl(url: string, id: string, lang: string, message: string): string {
    return `${url}${id}?lang=${lang}&preview=true#${message}`;
  }

}
