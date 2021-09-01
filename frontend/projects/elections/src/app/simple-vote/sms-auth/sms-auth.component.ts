import { Component } from '@angular/core';
import { SmsAuthService } from 'projects/elections/src/app/simple-vote/sms-auth.service';
import {
  catchError,
  filter,
  first,
  map,
  pluck,
  repeatWhen, shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';
import { BehaviorSubject, interval, Observable, of, Subject, timer } from 'rxjs';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { IconsCollection } from '@shared/enums/icons-collection.enum';
import { formatDuration } from 'date-fns';
import { ru } from 'date-fns/locale';

const GOSUSLUGI = 'https://gosuslugi.ru';
const NUMBERS_DIGIT_SELECTOR = '.numbers__digit';

@Component({
  selector: 'app-sms-auth',
  templateUrl: './sms-auth.component.html',
  styleUrls: ['./sms-auth.component.scss']
})
export class SmsAuthComponent {

  phoneNumber$ = new BehaviorSubject<number>(null);
  resend$ = new BehaviorSubject(false);
  resendEvent$ = new Subject<void>();
  result$ = new BehaviorSubject<SmsResultInterface>(null);
  verificationError$ = new BehaviorSubject<string>(null);
  redirectSuccessTimer = null;
  iconsCollection = IconsCollection;
  public mouseAccess: any;
  public mouseWrong: any;

  form = this.fb.group({
    code: ['', [
      Validators.required,
      Validators.pattern(/([0-9])/),
      Validators.min(100000),
      Validators.max(999999),
    ], [
      // this.verify.bind(this),
    ]]
  });

  loading$ = this.form.statusChanges.pipe(
    map(status => status === 'PENDING'),
  );

  valid$ = this.form.statusChanges.pipe(
    map(status => status === 'VALID'),
    filter(v => !!v),
    first(),
  );

  electionId$ = this.route.queryParams.pipe(
    pluck('returnUrl'),
    map((url: string) => {
      const urlArr = url.split('/');
      return urlArr[urlArr.length - 1];
    }),
    // take(1),
    shareReplay(),
  );

  // timer$ = interval(1000).pipe(
  //   repeatWhen(() => this.resendEvent$.pipe(tap((e)=>console.log(e)))),
  //   take(6),
  //   map(val => formatDuration({seconds: 6 - val - 1}, {format: ['seconds'], zero: true, locale: ru})),
  //   tap(left => {
  //     if (left === '0 секунд') {
  //       this.resend$.next(true);
  //     }
  //   }),
  // );

  // timer$ = timer(0, 1000).pipe(
  //   map(val => formatDuration({seconds: 5 - val}, {format: ['seconds'], zero: true, locale: ru})),
  //   tap(left => {
  //     if (left[0] === '0') {
  //       this.resend$.next(true);
  //     }
  //   }),
  // );

  timer$ = this.electionId$.pipe(
    switchMap((id: string) => {
      return this.smsAuth.sendCode(id).pipe(
        // repeatWhen(() => this.resend$.pipe(filter(v => !v))),
        switchMap((res: any) => {
          if (res.verified) {
            this.result$.next(this.getSuccessResult());
            return of(null);
          }
          if (!res.seconds) {
            return of(null);
          }
          res.seconds = res.seconds > 0 ? res.seconds : 1;
          this.phoneNumber$.next(res.phoneNumber);
          return timer(0, 1000).pipe(
            map(val => formatDuration({seconds: res.seconds - val}, {format: ['seconds'], zero: true, locale: ru})),
          );
        }),
        tap(left => {
          if (left[0] === '0') {
            this.resend$.next(true);
          }
        }),
        catchError((err: any) => {
          if (err.code) {
            this.parseResult(err);
          }
          return of(err);
        }),
      );
    }),
  );

  constructor(
    private smsAuth: SmsAuthService,
    private router: Router,
    private route: ActivatedRoute,
    private ts: TranslateService,
    private fb: FormBuilder,
  ) {

    // this.valid$.subscribe(() => {
    //   this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl')).then();
    // });
  }

  private getSuccessResult(): SmsResultInterface {
    return {
      icon: IconsCollection.success,
      title: this.ts.instant('SMS.SUCCESS.TITLE'),
      message: this.ts.instant('SMS.SUCCESS.MESSAGE'),
      buttonText: this.ts.instant('SMS.SUCCESS.BUTTON'),
      routerLink: this.route.snapshot.queryParams.returnUrl,
    };
  }

  verify(control?: AbstractControl): void {
    this.electionId$.pipe(
      switchMap((id: any) => {
        if (this.resend$.value === false && this.form.valid) {
          return this.smsAuth.verify(this.form.controls.code.value, id).pipe(
            map(verified => {
              this.verificationError$.next(null);
              this.form.controls.code.reset();
              if (verified) {
                this.result$.next(this.getSuccessResult());
                return verified;
              }
              return {code: 'verify'};
            }),
            catchError((err: any) => {
              if (err.code) {
                this.parseResult(err);
              }
              this.form.controls.code.reset();
              this.verificationError$.next(this.ts.instant('SMS.ERRORS.WRONG_CODE'));
              return of(err);
            }),
          );
        }
      }),
      catchError((err: any) => {
        console.error(err);
        return of(err);
      }),
      first(),
    ).subscribe();
  }

  onKeydown(e: any): any {
    if (!e.key.match(/\d/)
      && e.key !== 'Backspace'
      && e.key !== 'Delete'
      && e.key !== 'Enter'
      && e.key !== 'ArrowLeft'
      && e.key !== 'ArrowRight'
      || (!((e.key === 'Backspace'
        || e.key === 'Enter'
        || e.key === 'Delete'
        || e.key === 'ArrowLeft'
        || e.key === 'ArrowRight') && Number(this.form.controls.code.value) < 999999)
        && Number(this.form.controls.code.value) > 99999)) { // TODO Сложно читается, можно сократить
      e.preventDefault();
    }
  }

  navigate(url: string): void {
    if (url === 'none') {
      this.form.controls.code.setValue('');
      this.result$.next(null);
    } else {
      this.router.navigateByUrl(url).then();
    }
  }

  private parseResult(err: any): void {
    switch (err.code) {
      case 76:
        this.result$.next({
          icon: IconsCollection.attention,
          title: this.ts.instant('SMS.ERRORS.ERR_76.TITLE'),
          buttonText: this.ts.instant('SMS.RETRY_MAIN'),
          routerLink: this.route.snapshot.queryParams.returnUrl,
        });
        break;
      case 77:
        this.result$.next({
          icon: IconsCollection.attention,
          title: this.ts.instant('SMS.ERRORS.ERR_77.TITLE'),
          buttonText: this.ts.instant('SMS.RETRY_MAIN'),
          routerLink: this.route.snapshot.queryParams.returnUrl,
        });
        break;
      case 78:
        this.result$.next({
          icon: IconsCollection.attention,
          title: this.ts.instant('SMS.ERRORS.ERR_78.TITLE'),
          message: this.ts.instant('SMS.ERRORS.ERR_78.MESSAGE'),
          buttonText: this.ts.instant('SMS.ERRORS.ERR_78.BUTTON'),
          routerLink: this.route.snapshot.queryParams.returnUrl,
        });
        break;
      case 79:
        // this.result$.next({
        //   icon: IconsCollection.attention,
        //   title: this.ts.instant('SMS.ERRORS.ERR_79.TITLE', {number: err.description.match(/\d+/g)[0]}),
        //   buttonText: this.ts.instant('SMS.RETRY_MAIN'),
        //   routerLink: 'none',
        // });
        break;
      case 80:
        this.result$.next({
          icon: IconsCollection.attention,
          title: this.ts.instant('SMS.ERRORS.ERR_80.TITLE'),
          message: this.ts.instant('SMS.ERRORS.ERR_80.MESSAGE'),
          buttonText: this.ts.instant('SMS.FIX_GOSUSLUGI'),
          link: GOSUSLUGI,
        });
        break;
      case 81:
        this.result$.next({
          icon: IconsCollection.attention,
          title: this.ts.instant('SMS.ERRORS.ERR_81.TITLE'),
          message: this.ts.instant('SMS.ERRORS.ERR_81.MESSAGE'),
          buttonText: this.ts.instant('SMS.FIX_GOSUSLUGI'),
          link: GOSUSLUGI,
        });
        break;
      case 82:
        this.result$.next({
          icon: IconsCollection.attention,
          title: this.ts.instant('SMS.ERRORS.ERR_82.TITLE'),
          message: this.ts.instant('SMS.ERRORS.ERR_82.MESSAGE', {number: err.description.match(/\d+/g)[0]}),
          buttonText: this.ts.instant('BUTTONS.RETURN'),
          link: '/',
        });
        break;
      case 83:
        this.result$.next({
          icon: IconsCollection.attention,
          title: this.ts.instant('SMS.ERRORS.ERR_83.TITLE'),
          buttonText: this.ts.instant('SMS.ERRORS.ERR_83.BUTTON'),
          routerLink: '/',
        });
        break;
      case 85:
        this.result$.next({
          icon: IconsCollection.attention,
          title: this.ts.instant('SMS.ERRORS.ERR_85.TITLE'),
          buttonText: this.ts.instant('SMS.FIX_GOSUSLUGI'),
          link: GOSUSLUGI,
        });
        break;
      case 84:
        this.result$.next(this.getSuccessResult());
        break;
      default:
        this.result$.next({
          icon: IconsCollection.attention,
          title: err.description,
          buttonText: this.ts.instant('SMS.RETRY_MAIN'),
          routerLink: this.route.snapshot.queryParams.returnUrl,
        });
        break;
    }
  }
}

export interface SmsResultInterface {
  icon?: string;
  title?: string;
  message?: string;
  buttonText?: string;
  routerLink?: string;
  link?: string;
}
