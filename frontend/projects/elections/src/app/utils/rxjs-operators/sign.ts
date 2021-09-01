import { of, OperatorFunction, throwError } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { fromPromise } from 'rxjs/internal-compatibility';

declare const jQuery: any;
declare const LssClient: any;

export function sign(base64Certificate: string): OperatorFunction<string, any> {

  return mergeMap((message: string): any => {
    const client = new LssClient(jQuery);
    const options = {
      base64Data: btoa(unescape(encodeURIComponent(message))),
      isAttached: false,
      base64Certificate,
      disableCertificateVerification: true,
    };

    return fromPromise(
      client.sign(options)
    ).pipe(
      map((res: any): any => {
        return {
          message,
          signature: res.SignedData,
        };
      })
    );

  });

}
