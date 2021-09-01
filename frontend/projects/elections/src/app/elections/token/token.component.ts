import { Component, OnInit } from '@angular/core';
import { ProfileService } from 'projects/elections/src/app/profile/profile.service';

@Component({
  template: `Esia ID: {{uid}}`,
})
export class TokenComponent implements OnInit {

  uid = this.profile.getUserId();

  constructor(
    private profile: ProfileService,
  ) { }

  ngOnInit(): void {
  }

}
