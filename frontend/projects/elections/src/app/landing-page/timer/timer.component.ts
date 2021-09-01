import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { parseISO, differenceInSeconds, intervalToDuration } from 'date-fns';
import { BehaviorSubject, combineLatest, interval, of } from 'rxjs';
import { catchError, map, pluck, startWith, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss']
})
export class TimerComponent implements OnChanges {
  @Input() due: string;
  @Input() link: string;
  @Input() routerLink: string;
  @Input() button: string;

  due$ = new BehaviorSubject(this.due);

  timestamp$ = this.http.get('/api/public/elections/time').pipe(
    pluck('data'),
    catchError((err) => {
      console.warn(err);
      return of(new Date().getTime());
    }),
  );

  intervals = {
    days: 'дни',
    hours: 'часы',
    minutes: 'минуты',
    seconds: 'секунды',
  };

  timer$ = combineLatest([
    this.due$,
    this.timestamp$,
  ]).pipe(
    switchMap(([date, timestamp]: [string, number]) => {
      const start = parseISO(date);
      const diff = differenceInSeconds(start, new Date(timestamp));
      return interval(1000).pipe(
        startWith(0),
        take(diff > 0 ? diff : 0),
        map(val => intervalToDuration({start, end: new Date()})),
      );
    }),
  );

  constructor(
    private http: HttpClient,
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.due) {
      this.due$.next(changes.due.currentValue);
    }
  }



}
