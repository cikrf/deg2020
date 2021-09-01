import { Inject, Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EbsAuthService } from './ebs.service';
import { EsiaAuthUrlEbsToken } from './ebs.tokens';
import { APP_BASE_HREF } from '@angular/common';

@Injectable()
export class EbsInterceptor implements HttpInterceptor {

  constructor(
    @Inject(EsiaAuthUrlEbsToken) private esiaAuthUrl: string,
    @Inject(APP_BASE_HREF) private baseHref: string,
    private auth: EbsAuthService,
    private router: Router,
  ) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.startsWith('/api')) {
      return next.handle(req);
    }

    if (this.auth.token && !req.headers.has('Authorization')) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${this.auth.token}`,
        },
      });
    }

    return next.handle(req).pipe(
      catchError((err: any) => {
        switch (err.status) {
          case 401:
          case 403: {
            this.auth.clearToken();
            let redirectPath = window.location.pathname;
            if (window.location.pathname.substr(0, this.baseHref.length) === this.baseHref) {
              redirectPath = '/' + window.location.pathname.substr(this.baseHref.length);
            }
            this.router.navigate([this.esiaAuthUrl], {queryParams: {returnUrl: redirectPath}});
            return of(null);
          }
        }
        console.error('backend err', err);
        return throwError(err);
      }),
    );
  }

}
