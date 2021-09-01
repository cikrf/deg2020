import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from '../profile.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-profile-widget',
  templateUrl: './profile-widget.component.html',
  styleUrls: ['./profile-widget.component.scss'],
})
export class ProfileWidgetComponent {
  @Input() light = false;
  userName$ = this.profileService.user$.pipe(
    map((user: any) => {
      if (!user) {
        return '';
      }
      return `${user.lastName} ${user.firstName.substr(0, 1)}. ${user.middleName ? user.middleName.substr(0, 1) + '.' : ''}`;
    }),
  );

  constructor(
    public profileService: ProfileService,
    private router: Router,
  ) {
  }

  logout(): void {
    this.profileService.logout();
    this.router.navigateByUrl('/').then();
  }

}
