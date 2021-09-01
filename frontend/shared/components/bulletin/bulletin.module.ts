import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulletinComponent } from './bulletin.component';



@NgModule({
  declarations: [BulletinComponent],
  exports: [
    BulletinComponent
  ],
  imports: [
    CommonModule
  ]
})
export class BulletinModule { }
