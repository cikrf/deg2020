import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';

@Injectable()
export class AppInterceptor implements HttpInterceptor {

  constructor(
    @Optional() @Inject(REQUEST) protected request: any,
    @Optional() @Inject('fs') protected fs: any,
    @Optional() @Inject('path') protected path: any,
    @Inject(PLATFORM_ID) private platformId: any,
    private transferState: TransferState,
  ) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): any {
    let serverReq: HttpRequest<any> = req;
    const stateKey = makeStateKey<any>(req.urlWithParams);
    if (isPlatformBrowser(this.platformId) && this.transferState.hasKey(stateKey)) {
      const response = this.transferState.get(stateKey, null);
      this.transferState.remove(stateKey);
      return of(new HttpResponse(response));
    }

    if (isPlatformServer(this.platformId) && this.request) {
      if (req.urlWithParams.startsWith('/api')) {
        const url = (process.env.DEG_PORTAL_URL || `${this.request.protocol}://${this.request.get('host')}`) + req.urlWithParams;
        serverReq = req.clone({url});
        console.log('api request', url);
      } else if (req.urlWithParams.endsWith('.json')) {
        const path = this.path.join(process.env.DIST || this.path.join(process.cwd(), 'dist', 'voting-box'), req.urlWithParams);
        return new Observable((subscriber): void => {
          this.fs.readFile(path, 'utf-8', (err, body) => {
            if (err) {
              console.error(err);
              subscriber.error(err);
            } else {
              const responseJson = new HttpResponse({
                body: JSON.parse(body),
                status: 200,
                url: req.urlWithParams,
              });
              this.transferState.set(stateKey, responseJson);
              subscriber.next(responseJson);
              subscriber.complete();
            }
          });
        });
      }
    }

    return next.handle(serverReq).pipe(
      tap(res => {
          if (isPlatformServer(this.platformId) && res instanceof HttpResponse) {
            this.transferState.set(stateKey, res);
          }
        }
      ));
  }
}
