import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { ModalService } from '@shared/modal-service/modal.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class VotePreventGuard implements CanDeactivate<Observable<boolean>> {

  constructor(
    private ms: ModalService,
    private ts: TranslateService,
  ) {}

  canDeactivate(
    component: Observable<boolean>,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot,
  ): Observable<boolean> {
    return nextState && nextState.url === '/done'
      ? of(true)
      : this.ms.openConfirm(
        this.ts.instant('MODALS.CONFIRM.TITLE'),
        this.ts.instant('MODALS.CONFIRM.TEXT'),
        this.ts.instant('MODALS.CONFIRM.OK'),
        this.ts.instant('MODALS.CONFIRM.CANCEL')
      );
  }

}
