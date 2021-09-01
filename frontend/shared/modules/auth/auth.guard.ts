import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '@shared/modules/auth/auth.service';


@Injectable({providedIn: 'root'})
export class AuthGuard implements CanActivate {
  constructor(
    protected router: Router,
    private authService: AuthService,
  ) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.authService.user$.pipe(
      map((val: any) => {
        if (!val) {
          this.router.navigate(['/login'], {queryParams: {returnUrl: state.url}});
          return false;
        }
        if (!this.authService.hasPermissions(route.data.permissions)) {
          // this.authService.accessDenied();
          // return false;
        }
        return true;
      }));
  }
}
