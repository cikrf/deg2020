import { Component, EventEmitter, Output } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, ReplaySubject } from 'rxjs';
import { filter, last, map, scan, shareReplay, switchMap, takeWhile, throttleTime, } from 'rxjs/operators';
import { untilDestroyed } from '@shared/utils/until-destroyed';

@Component({
  templateUrl: './random-numbers.component.html',
  styleUrls: ['./random-numbers.component.scss'],
})
export class RandomNumbersComponent {

  private length = 1024;
  private firstClickPosition = new BehaviorSubject<any>(null);
  @Output() numbers = new EventEmitter();
  smilesCount = 8;
  smilesCountArray = Array(this.smilesCount).fill(0).map((x, i) => i);

  smileHovered$ = new ReplaySubject();
  activeSmile$ = this.smileHovered$.pipe(
    filter((item: any) => 'number' === typeof item),
    map((numb: number) => this.getRandom(numb)),
  );

  moves$ = merge(fromEvent(document, 'mousemove'), fromEvent(document, 'touchmove'), this.firstClickPosition);

  data$ = this.smileHovered$.pipe(
    untilDestroyed(this),
    switchMap(() => this.moves$),
    takeWhile(m => m !== null),
    throttleTime(10),
    map((e: any) => {
      const x = e.clientX || e.pageX || Math.floor(e.changedTouches[0].clientX);
      const y = e.clientY || e.pageY || Math.floor(e.changedTouches[0].clientY);
      // tslint:disable-next-line:no-bitwise
      return new Date().getTime() & 255 ^ (x & 255) ^ (y & 255);
    }),
    scan((inter, curr) => {
      inter.push(curr);
      return inter;
    }, []),
    takeWhile((arr: any[]) => arr.length < this.length),
    shareReplay(),
  );

  progress$ = this.data$.pipe(
    map((arr: any[]) => {
      return Math.ceil(100 * arr.length / this.length);
    }),
  );

  constructor() {
    this.data$.pipe(
      last(),
    ).subscribe((numbers: any) => {
      this.numbers.emit(numbers);
    });
  }

  complete(): void {
    this.firstClickPosition.next(null);
  }

  getRandom(current: number): number {
    const rand = Math.floor(Math.random() * (this.smilesCount - 1)) + 1;
    if (rand === current) {
      return this.getRandom(current);
    }
    return rand;
  }

  start(e: MouseEvent): void {
    this.firstClickPosition.next(e);
    this.smileHovered$.next(0);
  }

  smileHover(index: number, active: boolean): void {
    if (active) {
      this.smileHovered$.next(index);
    }
  }

}
