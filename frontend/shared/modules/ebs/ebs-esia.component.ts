import { Component, Inject, OnInit } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EbsAuthService } from './ebs.service';
import { EbsRedirectUrlToken } from './ebs.tokens';
import { getAllUrlParams } from '@shared/functions/get-all-url-params';

@Component({
  selector: 'app-ebs-esia',
  templateUrl: './ebs.component.html',
  styleUrls: ['./ebs.component.scss'],
})
export class EbsEsiaComponent implements OnInit {

  constructor(
    @Inject(EbsRedirectUrlToken) private resultRedirectUrl: string,
    @Inject(APP_BASE_HREF) private baseHref: string,
    private router: Router,
    private route: ActivatedRoute,
    private authEbsService: EbsAuthService,
  ) {
  }

  ngOnInit(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl')
      ? '?returnUrl=' + encodeURIComponent(this.route.snapshot.queryParamMap.get('returnUrl')) : '';
    if (!!this.authEbsService.token) {
      this.router.navigateByUrl(this.resultRedirectUrl + returnUrl);
      return;
    }

    if (this.route.snapshot.queryParamMap.get('error_description')
      && this.route.snapshot.queryParamMap.get('state')
      && this.route.snapshot.queryParamMap.get('error')) {
      console.error(this.route.snapshot.queryParamMap.get('error'), this.route.snapshot.queryParamMap.get('error_description'));
      return;
    }

    if (this.route.snapshot.queryParamMap.get('code') && this.route.snapshot.queryParamMap.get('state')) {
      this.authEbsService.getEsiaAuth(
        this.route.snapshot.queryParamMap.get('code'),
        this.route.snapshot.queryParamMap.get('state'),
        window.location.origin + window.location.pathname + returnUrl,
      ).subscribe((url: string) => {
        localStorage.setItem('session_id', getAllUrlParams(url).session_id.toUpperCase());
        window.location.href = url;
      });
      return;
    }

    if (this.route.snapshot.queryParamMap.get('verify_token') && this.route.snapshot.queryParamMap.get('expired')) {
      this.authEbsService.getPortalVerify(
        window.location.origin + this.baseHref + this.resultRedirectUrl + returnUrl,
        this.route.snapshot.queryParamMap.get('verify_token')
      ).subscribe((url: string) => {
        localStorage.setItem('verify_token', this.route.snapshot.queryParamMap.get('verify_token'));
        window.location.href = url;
      });
      return;
    }

    this.authEbsService.getEsiaAuthUrl(window.location.href).subscribe((url: string) => {
      window.location.href = url;
    });
  }

}
