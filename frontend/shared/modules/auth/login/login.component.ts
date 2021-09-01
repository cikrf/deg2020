import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { BehaviorSubject, Subject } from 'rxjs';
import { AuthService } from '@shared/modules/auth/auth.service';
import { DarkmodeService } from '../../../../projects/admin/src/app/darkmode/darkmode.service';
import { APP_BASE_HREF } from '@angular/common';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm: FormGroup;
  loading$ = new BehaviorSubject(false);
  submitted$ = new BehaviorSubject(false);
  error$ = new BehaviorSubject('');
  destroy$ = new Subject();
  // darkMode$ = this.darkmodeService.darkMode$;
  passType$ = new BehaviorSubject('password');

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private darkmodeService: DarkmodeService,
    @Inject(APP_BASE_HREF) public baseHref: string,
  ) {
    // this.authService.user$.pipe(
    //   takeUntil(this.destroy$),
    // ).subscribe((val: any) => {
    //   if (!val) {
    //     this.router.navigate(['/login']);
    //   } else {
    //     this.router.navigate(['/']);
    //   }
    // });
  }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      userName: ['', Validators.required],
      password: ['', Validators.required],
    });

    document.querySelector('body').classList.add('page-login');
  }

  ngOnDestroy(): void {
    document.querySelector('body').classList.remove('page-login');
    this.destroy$.next();
    this.destroy$.complete();
  }

  get f(): any {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.submitted$.next(true);

    if (this.loginForm.invalid) {
      return;
    }

    this.loading$.next(true);
    this.authService.login(this.f.userName.value, this.f.password.value).subscribe(
      () => {
      },
      (error) => {
        this.loading$.next(false);
        this.error$.next('Неверный пользователь или пароль');
      }, () => {
        this.loading$.next(false);
      });
  }

  passTypeToggle(): void {
    this.passType$.next( this.passType$.value === 'password' ? 'text' : 'password' );
  }

}
