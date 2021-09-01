import { Inject, Injectable } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { ActivatedRoute, ActivatedRouteSnapshot, Router } from '@angular/router';
import { HttpEvent, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class SmsAuthInterceptor {

  constructor(
    @Inject(APP_BASE_HREF) private baseHref: string,
    private router: Router,
    private route: ActivatedRoute,
  ) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.startsWith('/api')) {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      catchError((err: any) => {
        if (err.status === 401 || err.status === 403) {
          let redirectPath = window.location.pathname;
          if (window.location.pathname.substr(0, this.baseHref.length) === this.baseHref) {
            redirectPath = '/' + window.location.pathname.substr(this.baseHref.length);
          }

          let snapshot: ActivatedRouteSnapshot = this.route.snapshot;

          while (snapshot && snapshot.firstChild) {
            snapshot = snapshot.firstChild;
          }

          if (snapshot) {
            this.router.navigate(
              ['/', 'simple-vote', 'auth'],
              {queryParams: {returnUrl: redirectPath}},
            ).then();
            return of(null);
          }
        }
        const errResult = err.error && err.error.error && err.error.error ? err.error.error : err;
        console.error('backend err', errResult);
        return throwError(errResult);
      }),
    );
  }
}
