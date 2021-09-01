import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-slide-show',
  templateUrl: 'slide-show.component.html',
  styleUrls: ['slide-show.component.scss']
})
export class SlideShowComponent {
  @Input() slideItems: string[];
  @Input() activeItem: number;
  @Output() closeSlider = new EventEmitter();

  constructor() {

  }

  @HostListener('document:keydown.escape') onKeyEscapeHandler(): void {
    this.closeSlider.emit();
  }
  @HostListener('document:keydown.arrowleft') onArrowLeftHandler(): void {
    this.prev();
  }
  @HostListener('document:keydown.arrowright') onArrowRightHandler(): void {
    this.next();
  }

  prevAvailable(): boolean {
    return this.activeItem > 0;
  }

  nextAvailable(): boolean {
    return this.activeItem + 1 < this.slideItems.length;
  }

  prev(): void {
    if (this.prevAvailable()) {
      this.activeItem = this.activeItem - 1;
    }
  }

  next(): void {
    if (this.nextAvailable()) {
      this.activeItem = this.activeItem + 1;
    }
  }
}
