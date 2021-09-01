import { Component, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject } from 'rxjs';
import { EbsAuthService } from '@shared/modules/ebs/ebs.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';
import { ModalService } from '@shared/modal-service/modal.service';
import { ProfileService } from '../profile/profile.service';
import { map, pluck, repeatWhen, takeUntil } from 'rxjs/operators';
import { LangModalComponent } from '../profile/lang-modal/lang-modal.component';
import { APP_BASE_HREF } from '@angular/common';

@Component({
  selector: 'app-profile-more',
  templateUrl: 'profile-bio.component.html',
  styleUrls: ['./profile-bio.component.scss'],
  styles: [`
      li {
          overflow-wrap: break-word;
      }
  `]
})
export class ProfileBioComponent {

  bioRegistered = true;

  userInfo$ = new BehaviorSubject(null);

  updateLang$ = new Subject();
  lang$ = this.http.get('/api/public/settings').pipe(
    repeatWhen(() => this.updateLang$),
    pluck('data', 'settings', 'language'),
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
    private http: HttpClient,
    private ebsAuthService: EbsAuthService,
    private router: Router,
    private modalService: ModalService,
    public profileService: ProfileService,
    @Inject(APP_BASE_HREF) public baseHref: string,
  ) {
    if (this.ebsAuthService.token) {
      const helper = new JwtHelperService();
      console.log(this.ebsAuthService.token);
      const decodedToken = helper.decodeToken(this.ebsAuthService.token);
      if (!!decodedToken.match) {
        this.userInfo$.next(JSON.parse(decodedToken.match));
      }
    } else {
      let returnUrl = window.location.pathname;
      if (window.location.pathname.substr(0, this.baseHref.length) === this.baseHref) {
        returnUrl = '/' + window.location.pathname.substr(this.baseHref.length);
      }
      this.router.navigateByUrl('/profile-bio/ebs-esia-auth?returnUrl=' + returnUrl);
    }
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
