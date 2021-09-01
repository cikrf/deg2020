import { Component, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RouterOutlet } from '@angular/router';
import { BehaviorSubject, fromEvent, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';
import { EnvService } from '@shared/modules/env/env.service';
import { HomeComponent } from 'projects/elections/src/app/home/home.component';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ПТК ДЭГ';
  sha$ = this.env.get('SHOW_SHA') ? this.http.get(this.baseHref + 'assets/sha', {
    responseType: 'text',
  }): of(null);
  ebsDisabled$ = new BehaviorSubject<boolean>(false);
  pageType$ = new BehaviorSubject<'landing' | 'anonymous' | 'validation' | 'menu' | 'cipher'>('menu');

  simpleLanding = this.env.get('SIMPLE_LANDING');
  offlineStatus$: Observable<boolean>;

  constructor(
    private translate: TranslateService,
    private http: HttpClient,
    @Inject(APP_BASE_HREF) private baseHref: string,
    private env: EnvService<{
      SHOW_SHA: boolean,
      SIMPLE_LANDING: boolean,
    }>,
  ) {
    translate.use('ru');
    this.offlineStatus$ = fromEvent(window, 'offline').pipe(map(() => false));
  }

  onActivate(component: any, outlet: RouterOutlet): void {

    if (component instanceof HomeComponent && !this.simpleLanding) {
      this.pageType$.next('landing');
    } else if (outlet && outlet.activatedRouteData) {
      this.pageType$.next(outlet.activatedRouteData.headerType || 'menu');
    }
  }
}

