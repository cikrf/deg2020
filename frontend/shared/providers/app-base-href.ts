import { APP_BASE_HREF, PlatformLocation } from '@angular/common';

export function extractBaseHref(s: PlatformLocation): string {
  return s.getBaseHrefFromDOM();
}

export const appBaseHrefProvider = {
  provide: APP_BASE_HREF,
  useFactory: extractBaseHref,
  deps: [PlatformLocation],
};
