import { Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `
      <div class="waiter">
          <div class="icon icon--lg icon-spinner"></div>
      </div>
  `,
  styles: [`
      .waiter {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 50px;
      }
  `]
})
export class SpinnerComponent {

}
