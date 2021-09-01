import { Component, Input, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header-light',
  templateUrl: './header-light.component.html',
  styleUrls: ['./header-light.component.scss']
})
export class HeaderLightComponent implements OnInit {
  @Input() showBack = true;

  constructor(
    private location: Location,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
  }

  back(): void {
    if (this.location.path().includes('/simple-vote/auth')) {
      this.router.navigate(['elections/list']);
    } else {
      this.location.back();
    }
  }

}
