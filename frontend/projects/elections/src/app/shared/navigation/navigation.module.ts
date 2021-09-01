import { NgModule } from '@angular/core';
import { NavigationComponent } from './navigation.component';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    NavigationComponent,
  ],
  exports: [
    NavigationComponent,
  ],
  imports: [
    TranslateModule,
    RouterModule,
    CommonModule
  ]
})
export class NavigationModule {

}
