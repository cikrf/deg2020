import { APP_INITIALIZER, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { LoginComponent } from './login/login.component';
import { DarkmodeModule } from '../../../projects/admin/src/app/darkmode/darkmode.module';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotificationsModule } from '@shared/modules/notifications/notifications.module';
import { AccessDeniedComponent } from './access-denied/access-denied.component';


// tslint:disable-next-line:typedef
export function getUserInfo(auth: AuthService) {
  // tslint:disable-next-line:typedef
  return () => auth.getUserInfo().toPromise();
}

@NgModule({
  declarations: [LoginComponent, AccessDeniedComponent],
  imports: [
    NotificationsModule,
    CommonModule,
    DarkmodeModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      {
        path: 'login',
        component: LoginComponent,
      },
      {
        path: 'access-denied',
        component: AccessDeniedComponent,
      }
    ])
  ],
  providers: [
    AuthService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      // tslint:disable-next-line:typedef
      useFactory: getUserInfo,
      deps: [AuthService],
      multi: true
    },
  ]
})
export class AuthModule {
}
