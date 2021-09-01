import { Inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  catchError,
  map,
  mergeMap,
  pluck,
  shareReplay,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { ModalContent, ModalService } from '@shared/modal-service/modal.service';
import { IconsSizes } from '@shared/enums/icons-sizes.enum';
import { IconsCollection } from '@shared/enums/icons-collection.enum';
import { TranslateService } from '@ngx-translate/core';
import { ApiResponseElectionDto, ElectionDto, ElectionsApiResponse } from '@shared/models/portal.models';
import { EnvService } from '@shared/modules/env/env.service';
import { APP_BASE_HREF } from '@angular/common';

@Injectable()
export class ElectionsService {

  hardCodedElections$: Observable<Array<string>> = this.http.get<{ hardElections: Array<string> }>(
    this.baseHref + 'assets/media/hard-elections.json',
  ).pipe(
    pluck('hardElections'),
    catchError((err) => {
      console.warn(err);
      return of([]);
    }),
    shareReplay(),
  );

  constructor(
    private http: HttpClient,
    private modalService: ModalService,
    private ts: TranslateService,
    private env: EnvService<{ RUN_TEST_VOTER: boolean }>,
    @Inject(APP_BASE_HREF) public baseHref: string,
  ) {
  }

  getElectionPreview(id: string): Observable<ArrayBuffer> {
    return this.http.get('/api/public/ballot/' + id + '/preview', {
      responseType: 'arraybuffer',
    });
  }

  getHardcodedElectionByExternalId(id: string): Observable<Partial<ElectionDto>> {
    return this.http.get(`${this.baseHref}assets/media/elections-${id}.json`).pipe(
      map((e: Partial<ElectionDto & {isHardcoded: boolean}>) => {
        e.candidates.sort((a, b) => a.number - b.number);
        e.isHardcoded = true;
        e.candidates = e.candidates.map((c) => {
          return {
            ... c,
            isHardcoded: true,
          };
        });
        return e;
      }),
      catchError(err => {
        console.warn(err);
        return of({});
      }),
    );
  }

  getElections(status: string): Observable<ElectionDto[]> {
    return this.addTest().pipe(
      mergeMap(() => this.http.get<ElectionsApiResponse>('/api/public/elections', {})),
      // map((t: any) => t.data),
      tap((res) => {
        if (!res.is18YearOld) {
          const is18 = new ModalContent(
            this.ts.instant('IS18.TITLE'),
            this.ts.instant('IS18.MESSAGE'),
            {
              size: IconsSizes.lg,
              name: IconsCollection.attention,
            },
            this.ts.instant('IS18.BUTTON'),
            (): void => {
            },
          );
          this.modalService.open(is18);
        }
      }),
      pluck('data'),
      withLatestFrom(this.hardCodedElections$),
      switchMap(([elections, hardCoded]) => {
        const replacers = elections
          .filter(e => hardCoded.includes(e.externalId))
          .map(e => this.getHardcodedElectionByExternalId(e.externalId));
        if (!replacers.length) {
          return of(elections);
        }
        return forkJoin(replacers).pipe(
          map((models: ElectionDto[]) => {
            const modelsByEid = models.reduce((obj, next) => {
              return {
                ...obj,
                [next.externalId]: next,
              };
            }, {});
            return elections.map((e) => {
              if (modelsByEid[e.externalId]) {
                return {
                  ...e,
                  ...modelsByEid[e.externalId],
                  isHardcoded: true,
                  candidates: e.candidates.map(c => {
                    return {
                      ...c,
                      ...modelsByEid[e.externalId].candidates.find(r => c.externalId === r.externalId),
                      isHardcoded: true,
                    };
                  }),
                };
              } else {
                return e;
              }
            });
          }),
        );
      }),
      map((elections: ElectionDto[]) => {
        return elections.filter((i: ElectionDto) => {
          if (status === 'active') {
            return i.status === 'IN_PROCESS';
          }
          if (status === 'passed') {
            return i.status === 'COMPLETED' || i.status === 'RESULT_COMPLETED';
          }
        });
      }),
      map((elections: ElectionDto[]) => elections.map(e => {
        if (e.candidates[0].number) {
          e.candidates.sort((a, b) => a.number - b.number);
        }
        return e;
      })),
    );
  }

  // TODO: потом убрать Коля сказал
  addTest(): Observable<object> {
    return this.env.get('RUN_TEST_VOTER') ? this.http.post('/api/public/elections/test-voter', {})
      .pipe(catchError(() => of(null))) : of(null);
  }

  getVerfTypes(): Observable<any> {
    return this.http.get('/api/public/elections/verification-types');
  }

  getElection(id: string): Observable<ElectionDto> {
    return this.http.get<ApiResponseElectionDto>('/api/public/elections/' + id + '/model').pipe(
      pluck('data'),
    );
  }

}
