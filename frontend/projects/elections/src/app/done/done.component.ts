import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-elections-done',
  templateUrl: './done.component.html',
  styleUrls: ['./done.component.scss'],
})
export class DoneComponent {

  constructor(private router: Router) {
    setTimeout(() => {
      this.router.navigate(['/']).then();
    }, 4000);
  }

}
