import { Component, Inject, OnInit } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EsiaResultRedirectUrlToken } from './esia.tokens';
import { EsiaAuthService } from '@shared/modules/esia-auth/esia-auth.service';
import { getAllUrlParams } from '@shared/functions/get-all-url-params';

@Component({
  selector: 'app-esia',
  template: `
      <article class="card__outer">
          <div class="container wait_container">
              <div class="card wait">
                  <div class="wait__icon icon icon--lg icon-spinner"></div>
                  <h2 class="wait__title">Ждем ответ<br>от сервиса Госуслуги</h2>
                  <div class="wait__text text-body">Это может занять некоторое время</div>
                  <div class="wait__content">
                      <a class="button button-blue" routerLink="/">Отмена</a>
                  </div>
              </div>
          </div>
      </article>`,
  styleUrls: ['./esia.component.scss'],
})
export class EsiaComponent implements OnInit {

  constructor(
    @Inject(EsiaResultRedirectUrlToken) private resultRedirectUrl: string,
    @Inject(APP_BASE_HREF) private baseHref: string,
    private router: Router,
    private route: ActivatedRoute,
    private authEsiaService: EsiaAuthService,
  ) {
  }

  ngOnInit(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl')
      ? '?returnUrl=' + encodeURIComponent(this.route.snapshot.queryParamMap.get('returnUrl')) : '';
    if (!!this.authEsiaService.token) {
      this.router.navigateByUrl(this.resultRedirectUrl + returnUrl);
      return;
    }
    if (!this.route.snapshot.queryParamMap.get('code') || !this.route.snapshot.queryParamMap.get('state')) {
      this.authEsiaService.getAuthUrl(window.location.href).subscribe((url: string) => window.location.href = url);
      return;
    }
    this.authEsiaService.auth(
      this.route.snapshot.queryParamMap.get('code'),
      this.route.snapshot.queryParamMap.get('state'),
      window.location.origin + window.location.pathname + returnUrl,
    ).subscribe((isAuth) => {
      if (isAuth) {
        const urlParams = getAllUrlParams(window.location.origin + window.location.pathname + returnUrl);
        const redirect = decodeURIComponent(urlParams.returnurl || this.resultRedirectUrl);
        this.router.navigateByUrl(redirect).then();
      }
    });
  }

}
