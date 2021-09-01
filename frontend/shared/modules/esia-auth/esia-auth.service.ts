import { Injectable, Optional } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { distinctUntilChanged, map, pluck, tap } from 'rxjs/operators';
import { LocalStorage } from 'projects/elections/src/app/local-storage';
import { Router } from '@angular/router';

@Injectable()
export class EsiaAuthService {

  private tokenSubj$ = new BehaviorSubject(localStorage.getItem('esiaToken'));
  token$ = this.tokenSubj$.asObservable().pipe(
    distinctUntilChanged(),
  );

  get token(): string {
    return this.tokenSubj$.value;
  }

  localStorage: Storage = this.appLocalStorage || window.localStorage;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Optional() private appLocalStorage: LocalStorage,
  ) {
    this.token$.subscribe((token: string) => {
      if (token) {
        this.localStorage.setItem('esiaToken', token);
      } else {
        this.localStorage.removeItem('esiaToken');
      }
    });

    window.addEventListener('storage', this.storageListener.bind(this));
  }

  updateToken(token: string): void {
    if (token && (!this.tokenSubj$.value || this.tokenSubj$.value !== token)) {
      this.tokenSubj$.next(token);
    }
  }

  clearToken(): void {
    this.tokenSubj$.next(null);
  }

  storageListener(e: StorageEvent): void {
    if (e.key === 'esiaToken') {
      this.updateToken(e.newValue);
    }
  }

  getAuthUrl(redirectUrl: string): Observable<string> {
    return this.http.get(`/api/public/esia/auth-code-url`, {
      params: {
        redirectUrl,
      }
    }).pipe(
      pluck('data', 'url'),
    );
  }

  auth(code: string, state: string, redirectUrl: string): Observable<any> {
    return this.http.post(`/api/public/esia/authenticate`, {
      code,
      state,
      redirectUrl,
    }).pipe(
      map((res: any) => {
        if (!!res.error && res.error.code === 51) {
          this.router.navigateByUrl('/error/auth?code=51');
          return false;
        }
        this.updateToken(res.data.access_token);
        return true;
      }),
    );
  }

}
