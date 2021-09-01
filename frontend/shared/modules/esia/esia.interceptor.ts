import { Inject, Injectable, Optional } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { catchError, first, map } from 'rxjs/operators';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { EsiaAuthUrlEsiaToken } from '@shared/modules/esia/esia.tokens';
import { EsiaAuthService } from '@shared/modules/esia-auth/esia-auth.service';

@Injectable()
export class EsiaInterceptor implements HttpInterceptor {

  constructor(
    @Optional() @Inject(EsiaAuthUrlEsiaToken) private esiaAuthUrl: string,
    private auth: EsiaAuthService,
    private router: Router,
    private route: ActivatedRoute,
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
          case 401: {
            this.auth.clearToken();
            this.route.url.pipe(
              first(),
              map((segments) => segments.map(s => s.path).join('/')),
            ).subscribe((url) => {
              const extras: NavigationExtras = {};
              if (url) {
                extras.queryParams = {returnUrl: url};
              }
              this.router.navigate([this.esiaAuthUrl], extras).then();
            });
            return of(null);
          }
          case 404: {
            const extras: NavigationExtras = {};
            extras.queryParams = {
              code: '404'
            };
            this.router.navigate(['error','NOT_FOUND'], extras).then();
            break;
          }
          case 500: {
            const extras: NavigationExtras = {};
            extras.queryParams = { code: '500' };
            this.router.navigate(['error','SERVER_ERROR'], extras).then();
            break;
          }
        }
        console.error('backend err', err);
        return throwError(err);
      }),
    );
  }

}
