import { Component } from '@angular/core';
import { ProfileService } from '../profile/profile.service';
import { catchError, filter, map, pluck, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { EnvService } from '@shared/modules/env/env.service';
import { yandexMetrika } from '@shared/utils/yandex-metrika';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { untilDestroyed } from '@shared/utils/until-destroyed';

@Component({
  selector: 'app-home',
  template: `      
      <ng-container *ngIf="simpleLanding; else productionLanding">
          <app-welcome></app-welcome>
          <app-how></app-how>
      </ng-container>
      <ng-template #productionLanding>
        <app-header headerType="landing"></app-header>
        <app-banner></app-banner>
        <app-title></app-title>
          
        <ng-container [ngSwitch]="landingState$ | async">
            <ng-container *ngSwitchCase="1">
                <ng-container *ngTemplateOutlet="apply"></ng-container>
            </ng-container>
            <ng-container *ngSwitchCase="2">
                
                <app-informer
                        title="Общественное тестирование"
                        subTitle="31 августа с 10:00 до 15:00"
                        button="Принять участие в публичном тестовом голосовании"
                        link="/elections"
                        [disabled]="disabled$ | async"
                >
                    Участие в общественном тестировании дистанционного электронного голосования могут принять избиратели, имеющие поданое заявление для участия в дистанционном электронном голосовании в Курской и Ярославской областях в статусе «Учтено» на 27 августа (23:59 по московскому времени)
                </app-informer>
                <ng-container *ngTemplateOutlet="apply"></ng-container>
            </ng-container>
            
            <ng-container *ngSwitchCase="3">
                <app-informer
                        *ngIf="false"
                        title="Общественное тестирование"
                        subTitle=""
                        button="Результаты публичного тестового голосования"
                        link="/elections"
                >
                    <strong>31 августа</strong> проходило второе общественное тестирование дистанционного электронного голосования
                </app-informer>
                <ng-container *ngTemplateOutlet="apply"></ng-container>
            </ng-container>
            
            <ng-container *ngSwitchCase="4">
                <app-informer
                        title="Общественное тестирование"
                        subTitle="7 сентября с 10:00 до 15:00"
                        button="Принять участие в публичном тестовом голосовании"
                        link="/elections"
                >
                    Участие в общественном тестировании дистанционного электронного голосования могут принять избиратели, имеющие поданое заявление для участия в дистанционном электронном голосовании в Курской и Ярославской областях в статусе «Учтено» на 27 августа (23:59 по московскому времени)
                </app-informer>
                <ng-container *ngTemplateOutlet="apply"></ng-container>
            </ng-container>

            <ng-container *ngSwitchCase="5">
                <app-informer
                        title="Общественное тестирование"
                        subTitle=""
                        button="Результаты публичного тестового голосования"
                        link="/elections"
                >
                    <strong>7 сентября</strong> проходило второе общественное тестирование дистанционного электронного голосования
                </app-informer>
                <app-timer
                    due="2020-09-11 08:00+03:00"
                >
                    Период подачи заявлений на участие в дистанционном электронном голосовании завершён. До начала дистанционного электронного голосования осталось:
                </app-timer>
            </ng-container>
            
            <ng-container *ngSwitchCase="6">
                <app-timer
                        button="Голосовать"
                        routerLink="/elections"
                        due="2020-09-13 20:00+03:00"
                >
                    До завершения дистанционного электронного голосования осталось
                </app-timer>
            </ng-container>

            <ng-container *ngSwitchCase="7">
                <app-timer
                        button="Результаты голосования"
                        routerLink="/elections"
                >
                    Голосование проходило с&nbsp;11&nbsp;сентября&nbsp;с&nbsp;8:00 до&nbsp;13&nbsp;сентября&nbsp;20:00
                </app-timer>
            </ng-container>
            
        </ng-container>
        
        <app-location
            *ngIf="(landingState$ | async) !== 6"
            [button]="(landingState$ | async) === 2 ? '' : 'Подробнее'" 
            [disabled]="disabled$ | async"
        ></app-location>
        <app-location
              *ngIf="(landingState$ | async) === 6"
            button="Посмотреть ход голосования"
            [disabled]="disabled$ | async"
            link="/elections" #todo на наблюдателя
        ></app-location>
        <app-when></app-when>
        <app-terms></app-terms>
        <app-steps></app-steps>
        <app-question-answer *ngIf="false"></app-question-answer>
        <app-more-question></app-more-question>
      </ng-template>
      
      <ng-template #apply>
          <app-timer
                  button="Подать заявление на участие в ДЭГ"
                  link="https://www.gosuslugi.ru/555061/1"
                  due="2020-09-09 00:00+03:00"
          >
              До завершения периода подачи заявлений на участие в дистанционном электронном голосовании осталось
          </app-timer>
      </ng-template>
      <app-footer footerType="landing"></app-footer>
  `,
})
export class HomeComponent {
  simpleLanding = this.env.get('SIMPLE_LANDING');
  landingState = this.env.get('LANDING_STATE', 1);
  hash$ = this.route.fragment.pipe(
    map((f) => {
      if (!f) {
        return undefined;
      }
      const [state, disabled] = f.split(',');
      if (isNaN(+state)) {
        return undefined;
      }
      return {
        state: +state,
        disabled: disabled ? (disabled === 'true' ? true : false) : undefined,
      };
    }),
  );
  state$ = this.hash$.pipe(
    switchMap(s => s ? of(s) : this.http.get('/media/landing-state.json').pipe(shareReplay())),
  );
  landingState$ = this.state$.pipe(
    pluck('state'),
    startWith(this.landingState),
    map(f => f ? +f : this.landingState),
  );
  disabled$ = this.state$.pipe(
    pluck('disabled'),
    map(dis => typeof dis === 'undefined' ? false : !!dis),
  );

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private env: EnvService<{
      SIMPLE_LANDING: boolean,
      LANDING_STATE: number,
      YMETRIKA_COUNTER: number,
    }>,
  ) {
    yandexMetrika(this.env.get('YMETRIKA_COUNTER'));
    this.router.events.pipe(
      untilDestroyed(this),
      filter(event => event instanceof NavigationStart),
    ).subscribe(({url}) => {
      window.location.href = url;
    });
  }
}
