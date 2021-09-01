import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Inject, Injectable, Optional } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
export const TOKEN_PARAM_NAME = Symbol('TOKEN_PARAM_NAME');

@Injectable()
export class TokenResolver implements Resolve<string> {
  constructor(
    @Inject(TOKEN_SERVICE) private tokenService: { updateToken: (token: string) => void },
    @Optional() @Inject(TOKEN_PARAM_NAME) private tokenParamName: string,
  ) {
    this.tokenParamName = this.tokenParamName || 't';
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot, mes: string = 'nothing'): Observable<string> {
    const token = route.queryParamMap.get(this.tokenParamName);
    this.tokenService.updateToken(token);
    return of(token).pipe(delay(0));
  }
}
