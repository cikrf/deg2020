import { Component, Inject } from '@angular/core';
import { LangModalComponent } from './lang-modal/lang-modal.component';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, pluck, repeatWhen, take, takeUntil, tap } from 'rxjs/operators';
import { ModalService } from '@shared/modal-service/modal.service';
import { ProfileService } from './profile.service';
import { APP_BASE_HREF } from '@angular/common';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {

  // todo забирать из

  bioRegistered = false;

  updateLang$ = new Subject();
  lang$ = this.profileService.lang$.pipe(
    repeatWhen(() => this.updateLang$),
  );
  user$ = this.profileService.user$;

  passport$ = this.user$.pipe(
    map((info: any) => {
      if (info.documents && info.documents.elements && info.documents.elements.length) {
        const passport = info.documents.elements.filter((el: any) => el.type === 'RF_PASSPORT');
        if (passport.length) {
          return `${passport[0].series} ${passport[0].number}`;
        }
      }
    }),
  );

  constructor(
    private modalService: ModalService,
    public profileService: ProfileService,
    @Inject(APP_BASE_HREF) public baseHref: string,
  ) {
  }

  openLangModal(): void {
    this.lang$.pipe(
      takeUntil(this.updateLang$),
    ).subscribe((lang: any) => {
      this.modalService.open(LangModalComponent, {
        inputs: {
          currentLang: lang.code,
        },
        outputs: {
          langChanged: {
            emit: (): void => {
              this.updateLang$.next();
            }
          }
        },
      });
    });

  }

}
