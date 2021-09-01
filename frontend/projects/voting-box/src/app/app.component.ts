import { AfterViewInit, Component, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';
import { APP_IS_PLATFORM_BROWSER } from '@shared/providers/is-platform';
import { EnvService } from '@shared/modules/env/env.service';
import { of } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

  title = 'ПТК ДЭГ';

  sha$ = this.env.get('SHOW_SHA') ? this.http.get(this.baseHref + 'assets/sha', {
    responseType: 'text',
  }): of(null);

  constructor(
    private translate: TranslateService,
    private http: HttpClient,
    @Inject(APP_BASE_HREF) private baseHref: string,
    @Inject(APP_IS_PLATFORM_BROWSER) private isBrowser: boolean,
    private env: EnvService<{
      SHOW_SHA: boolean,
    }>,
  ) {
    translate.use('ru');
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      document.body.classList.add('done');
    }
  }

}
