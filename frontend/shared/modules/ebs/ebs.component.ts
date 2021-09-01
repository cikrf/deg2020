import { Component, Inject, OnInit } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EbsAuthService } from './ebs.service';
import { EbsRedirectUrlToken } from './ebs.tokens';

@Component({
  selector: 'app-ebs',
  templateUrl: './ebs.component.html',
  styleUrls: ['./ebs.component.scss'],
})
export class EbsComponent implements OnInit {

  constructor(
    @Inject(EbsRedirectUrlToken) private resultRedirectUrl: string,
    @Inject(APP_BASE_HREF) private baseHref: string,
    private router: Router,
    private route: ActivatedRoute,
    private authEbsService: EbsAuthService,
  ) {
  }

  ngOnInit(): void {
    if (!this.route.snapshot.queryParamMap.get('code') || !this.route.snapshot.queryParamMap.get('state')) {
      this.authEbsService.clearToken();
      this.router.navigateByUrl('/esia-auth');
    }
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl')
      ? this.route.snapshot.queryParamMap.get('returnUrl') : this.resultRedirectUrl;
    this.authEbsService.getBioToken(
      localStorage.getItem('session_id'),
      this.route.snapshot.queryParamMap.get('code'),
      this.route.snapshot.queryParamMap.get('state'),
      window.location.origin + this.baseHref + returnUrl,
      localStorage.getItem('verify_token'),
    ).subscribe(() => {
      this.router.navigateByUrl(returnUrl);
    });
  }
}
