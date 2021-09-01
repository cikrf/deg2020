import { InjectionToken, PLATFORM_ID, Provider, Optional } from '@angular/core';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { makeStateKey, TransferState } from '@angular/platform-browser';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';


export const APP_POST_DATA = new InjectionToken('post-data');

export function extractPostDataFactory(
  transferState: TransferState,
  platformId: string,
  request: any,
): string {

  const stateKey = makeStateKey<any>('post-data');
  let data: any;

  if (isPlatformServer(platformId) && request && request.body && Object.keys(request.body).length > 0) {
    transferState.set(stateKey, request.body);
    data = request.body;
  } else if (isPlatformBrowser(platformId) && transferState.hasKey(stateKey)) {
    data = transferState.get(stateKey, undefined);
    transferState.remove(stateKey);
  }
  return data;
}

export const appPostDataProvider: Provider = {
  provide: APP_POST_DATA,
  useFactory: extractPostDataFactory,
  deps: [
    TransferState,
    PLATFORM_ID,
    [new Optional(), REQUEST],
  ],
};
