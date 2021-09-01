import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { distinctUntilChanged, pluck, tap } from 'rxjs/operators';
import { EsiaAuthService } from '@shared/modules/esia-auth/esia-auth.service';

@Injectable()
export class EbsAuthService {

  private tokenSubj$ = new BehaviorSubject(localStorage.getItem('ebsToken'));
  token$ = this.tokenSubj$.asObservable().pipe(
    distinctUntilChanged(),
  );

  get token(): string {
    return this.tokenSubj$.value;
  }

  constructor(
    private http: HttpClient,
    private esia: EsiaAuthService,
  ) {
    this.tokenSubj$.subscribe((token: string) => {
      if (token) {
        localStorage.setItem('ebsToken', token);
      } else {
        localStorage.removeItem('ebsToken');
      }
    });
  }

  updateToken(token: string): void {
    if (token && (!this.tokenSubj$.value || this.tokenSubj$.value !== token)) {
      this.tokenSubj$.next(token);
    }
  }

  clearToken(): void {
    this.tokenSubj$.next(null);
  }

  getEsiaAuthUrl(redirectUrl: string): Observable<string> {
    return this.http.get(`/api/public/esia/auth-code-url-bio`, {
      params: {
        redirectUrl,
      },
      headers: {
        Authorization: `Bearer ${this.esia.token}`,
      },
    }).pipe(
      pluck('data', 'url'),
    );
  }

  getEsiaAuth(code: string, state: string, redirectUrl: string): Observable<any> {
    return this.http.get(`/api/public/ebs/session-id`, {
      params: {
        code,
        state,
        redirectUrl,
      },
      headers: {
        Authorization: `Bearer ${this.esia.token}`,
      },
    }).pipe(
      pluck('data', 'verificationUrl'),
    );
  }

  getPortalVerify(redirectUrl: string, verifyToken: string): Observable<any> {
    return this.http.get(`/api/public/esia/auth-code-url-ext`, {
      params: {
        redirectUrl,
        verifyToken,
      },
      headers: {
        Authorization: `Bearer ${this.esia.token}`,
      },
    }).pipe(
      pluck('data', 'url'),
    );
  }

  getBioToken(sessionId: string, code: string, state: string, redirectUrl: string, verifyToken: string): Observable<any> {
    return this.http.get(`/api/public/ebs/${sessionId}/extended-result`, {
      params: {
        code,
        state,
        redirectUrl,
        verifyToken,
      },
      headers: {
        Authorization: `Bearer ${this.esia.token}`,
      },
    }).pipe(
      pluck('data', 'extended_result'),
      tap((token: string) => {
        this.updateToken(token);
      })
    );
  }

}
