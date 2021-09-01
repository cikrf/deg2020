import { Component } from '@angular/core';
import { map, switchMap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest } from 'rxjs';

@Component({
  templateUrl: './error.component.html',
})
export class ErrorComponent {

  title$ = combineLatest([
    this.route.paramMap,
    this.route.queryParamMap,
  ]).pipe(
    switchMap(([params, queryParams]) => {
      return this.ts.get(`ERRORS.SECTIONS.${params.get('section').toUpperCase()}.${queryParams.get('code')}`);
    })
  );

  text$ = combineLatest([
    this.route.paramMap,
    this.route.queryParamMap,
  ]).pipe(
    switchMap(([params, queryParams]) => {
      return this.ts.get(`ERRORS.SECTIONS.${params.get('section').toUpperCase()}.${queryParams.get('code')}_TEXT`);
    })
  );

  return$ = this.route.queryParamMap.pipe(map((queryParams) => {
    return !!queryParams.get('return');
  }));

  constructor(
    private route: ActivatedRoute,
    private ts: TranslateService,
  ) {
  }

}
