import { Pipe, PipeTransform } from '@angular/core';
import { parseISO, differenceInSeconds, intervalToDuration } from 'date-fns';
import { interval, Observable } from 'rxjs';
import { map, startWith, take } from 'rxjs/operators';

@Pipe({
  name: 'ballotTimer'
})
export class BallotTimerPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): Observable<Duration> {
    const times = differenceInSeconds(parseISO(value + '+03:00'), new Date()); // TODO костыль для МСК, нет зоны с бека
    return interval(1000).pipe(
      startWith(0),
      take(times > 0 ? times : 0),
      map(() => {
        const data = intervalToDuration({start: parseISO(value + '+03:00'), end: new Date()});
        for (const key in data) {
          if (data.hasOwnProperty(key) && data[key] < 10) {
            data[key] = '0' + data[key];
          }
        }
        return data;
      }),
    );
  }

}
