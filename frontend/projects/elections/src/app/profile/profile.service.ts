import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { EsiaAuthService } from '@shared/modules/esia-auth/esia-auth.service';
import { delay, distinctUntilChanged, pluck, shareReplay, switchMap, tap, } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable()
export class ProfileService {

  user$ = this.esiaAuthService.token$.pipe(
    distinctUntilChanged(),
    switchMap((token: string) => {
      return token ? this.getUserInfo() : of(null);
    }),
    shareReplay(1),
  );
  settings$: Observable<any> = this.http.get('/api/public/settings');
  votingPackageString$ = new BehaviorSubject(localStorage.getItem('votingPackage'));
  lang$: Observable<any> = this.settings$.pipe(
    pluck('data', 'settings', 'language'),
  );

  constructor(
    @Inject(APP_BASE_HREF) private baseHref: string,
    private esiaAuthService: EsiaAuthService,
    private http: HttpClient,
  ) {
    // this.removeOtherUsersVotingPackages();
  }

  getUserInfo(): Observable<any> {
    return this.http.get('/api/public/user/me');
  }

  getUserId(): string {
    const helper = new JwtHelperService();
    const decodedToken = helper.decodeToken(this.esiaAuthService.token);
    return decodedToken['urn:esia:sbj_id'].toString();
  }

  setVotingPackage(electionId: string, data: string): void {
    localStorage.setItem(`${electionId}:${this.getUserId()}`, data);
    this.votingPackageString$.next(data);
  }

  getVotingPackage(electionId: string): string {
    return localStorage.getItem(`${electionId}:${this.getUserId()}`);
  }

  removeOtherUsersVotingPackages(): void {
    Object.entries(localStorage).map((item: [string, any]) => {
      const keyArr = item[0].split(':');
      if (keyArr.length === 3 && keyArr[0] === 'ballot' && keyArr[1] !== this.getUserId()) {
        localStorage.removeItem(item[0]);
      }
    });
  }

  removeAllVotingPackages(): void {
    Object.entries(localStorage).map((item: [string, any]) => {
      const keyArr = item[0].split(':');
      if (keyArr.length === 3 && keyArr[0] === 'ballot') {
        localStorage.removeItem(item[0]);
      }
    });
  }

  logout(): void {
    this.http.get('/api/public/esia/logout-url', {params: {redirectUrl: window.location.origin + this.baseHref}}
    ).pipe(
      tap(() => this.esiaAuthService.clearToken()),
      delay(0),
      pluck('data', 'url'),
    ).subscribe((url: string) => {
      // this.removeAllVotingPackages();
      setTimeout(() => {
        window.location.href = url;
      }, 0);
    });
  }

}
