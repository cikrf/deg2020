import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpResponseBase
} from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NotificationsService, NotificationType } from '../notifications/notifications.service';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private auth: AuthService,
    private router: Router,
    private notifications: NotificationsService,
  ) {
  }


  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // if (!req.url.startsWith('/api')) {
    //   return next.handle(req);
    // }

    if (this.auth.token && !req.headers.has('Authorization')) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${this.auth.token}`,
        },
      });
    }

    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        // Придется костылить пока бэк не починили
        if (err.status === 502) {
          return throwError(err);
        }
        if (err.status === 403) {
          // this.auth.accessDenied();
          return throwError(err);
        }
        if (err.error.error_description === 'Invalid user credentials') {
          this.notifications.create(NotificationType.ERROR, 'Ошибка: Неверный логин или пароль');
          return of(null);
        }
        if (err.error.error_description === 'Token verification failed' || err.status === 401) {
          this.notifications.create(NotificationType.ERROR, 'Ошибка: Время сессии истекло');
          this.auth.logout();
          return of(null);
        }
        console.error('backend err', err);
        let errText = err && err.error && err.error.error && err.error.error.description ? err.error.error.description : '';
        errText = errText === '' ? err.error.error_description : errText;
        this.notifications.create(NotificationType.ERROR, 'Ошибка: ' + errText);
        return throwError(err);
      }),
    );
  }

}
