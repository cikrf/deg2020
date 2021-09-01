import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { EnvService } from '@shared/modules/env/env.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnChanges {

  @Input() public footerType: 'anonymous' | 'validation' | 'menu' | 'cipher' = 'menu';
  footerType$ = new BehaviorSubject<'anonymous' | 'validation' | 'menu' | 'cipher'>('menu');
  isAnon$ = this.footerType$.pipe(
    map(t => ['anonymous', 'validation', 'cipher'].includes(t)),
  );

  simpleLanding = this.env.get('SIMPLE_LANDING');

  constructor(
    private env: EnvService<{
      SIMPLE_LANDING: boolean,
    }>,
  ) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.footerType) {
      this.footerType$.next(changes.footerType.currentValue);
    }
  }
}
