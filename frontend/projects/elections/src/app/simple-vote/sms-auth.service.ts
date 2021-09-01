import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { parseISO } from 'date-fns';

@Injectable()
export class SmsAuthService {

  constructor(
    private http: HttpClient,
  ) {
  }

  sendCode(electionId: string): Observable<any> {
    return this.http.post('/api/public/sms', {}, {
      params: {
        electionId,
      }
    }).pipe(
      switchMap((res: any) => {
        return of({
          phoneNumber: res.data.phoneNumber,
          seconds: Math.round((parseISO(res.data.repeatTime + '+0300').getTime() - new Date().getTime()) / 1000),
          verified: res.data.status === 'VERIFIED',
        }).pipe(delay(1000));
      }),
    );
  }

  verify(code: string, electionId: string): Observable<boolean> {
    return this.http.post('/api/public/sms/verify', {
      code,
      electionId,
    }).pipe(
      map((res: any) => {
        return !!res.data && res.data.status === 'VERIFIED';
      })
    );
  }
}
