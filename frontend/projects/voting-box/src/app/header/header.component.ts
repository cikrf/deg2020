import { Component, Inject, Input } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {

  @Input() timer: number | string;

  constructor(@Inject(APP_BASE_HREF) public baseHref: string) {
  }

}
