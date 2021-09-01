import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent {
  @Input() sandwich = false;
  sandwichState$ = new BehaviorSubject(false);

  toggleSandwich(): void {
    this.sandwichState$.next(!this.sandwichState$.value);
  }
}
