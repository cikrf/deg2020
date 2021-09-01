import { Component, Inject, Input } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss'],
})
export class LogoComponent {
  @Input() public logoType: 'anonymous' | 'validation' | 'menu' | 'cipher' = 'menu';
  @Input() homeLink = '/';

  constructor(@Inject(APP_BASE_HREF) public baseHref: string) {
  }

  getText(logoType: 'anonymous' | 'validation' | 'menu' | 'cipher'): string {
    switch (logoType) {
      case 'anonymous':
        return 'LOGO.ANONYMOUS';
      case 'validation':
        return 'LOGO.VALIDATION';
      case 'menu':
        return 'LOGO.REGULAR';
      case 'cipher':
        return 'LOGO.CIPHER';
      default:
        return 'LOGO.REGULAR';
    }
  }
}
