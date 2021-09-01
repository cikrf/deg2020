import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener, Inject,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { APP_BASE_HREF } from "@angular/common";

@Component({
  templateUrl: './random-numbers-smile.component.html',
  selector: 'app-smile',
  styleUrls: ['./random-numbers-smile.component.scss'],
})
export class RandomNumbersSmileComponent implements AfterViewInit {

  @Input() top = 0;
  @Input() left = 0;
  @Input() active = false;
  @Output() hover = new EventEmitter();
  @ViewChild('button') button: ElementRef;

  private smilesCount = 9;
  smileId = this.random(0, this.smilesCount);
  marginTop$ = new BehaviorSubject(0);
  marginLeft$ = new BehaviorSubject(0);

  @HostListener('document:touchmove', ['$event'])
  touchMove(e: any): void {
    const top = e.changedTouches[0].clientY || e.changedTouches[0].pageY;
    const left = e.changedTouches[0].clientX || e.changedTouches[0].pageX;
    const buttonRect = this.button.nativeElement.getBoundingClientRect();
    if (left <= buttonRect.x + buttonRect.width
      && left >= buttonRect.x
      && top <= buttonRect.y + buttonRect.height
      && top >= buttonRect.y) {
      this.mouseOver();
    }
  }

  mouseOver(): void {
    this.active = false;
    this.hover.emit();
  }

  constructor(@Inject(APP_BASE_HREF) public baseHref: string, private elementRef: ElementRef) {
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const hostRect = this.elementRef.nativeElement.getBoundingClientRect();
      const buttonRect = this.button.nativeElement.getBoundingClientRect();
      this.marginTop$.next(this.random(0, hostRect.height - buttonRect.height));
      this.marginLeft$.next(this.random(0, hostRect.width - buttonRect.width));
    }, 0);
  }

  private random(from: number, to: number): number {
    return Math.floor(Math.random() * (to - 1)) + from;
  }

}
