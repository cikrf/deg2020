import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService } from '@shared/modules/notifications/notifications.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [NotificationsService]
})
export class NotificationsModule { }
