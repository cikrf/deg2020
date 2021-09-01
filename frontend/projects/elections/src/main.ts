import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

function isBadBrowser(): boolean {
  return navigator.userAgent.indexOf('MSIE ') > -1 || navigator.userAgent.indexOf('Trident/') > -1;
}

if (!isBadBrowser()) {
  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch((err: any) => console.error(err));
}
