import { Inject, Injectable, Optional } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { Observable } from 'rxjs';
import { map, mergeMap, switchMap } from 'rxjs/operators';
import { EsiaAuthService } from '@shared/modules/esia-auth/esia-auth.service';
import { EsiaAuthUrlEsiaToken } from '@shared/modules/esia/esia.tokens';
import { TokenResolver } from '../../utils/token-resolver';

@Injectable()
export class EsiaGuard implements CanActivate {
  constructor(
    @Inject(APP_BASE_HREF) private baseHref: string,
    @Inject(EsiaAuthUrlEsiaToken) private authUrl: string,
    private router: Router,
    private auth: EsiaAuthService,
    private tokenResolver: TokenResolver,
  ) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.tokenResolver.resolve(route, state, 'EsiaGuard').pipe(switchMap((token) => {
      return this.auth.token$.pipe(
        map((val: any) => {
          if (val) {
            return true;
          }
          this.router.navigate([this.authUrl], {queryParams: {returnUrl: state.url}});
          return false;
        }));
    }));
  }
}
