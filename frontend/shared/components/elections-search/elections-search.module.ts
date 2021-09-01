import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectionsSearchComponent } from './elections-search.component';
import { NglInputModule, NglSelectModule, NglSpinnersModule } from 'ng-lightning';
import { FormsModule } from '@angular/forms';
import { PortalModule } from '@angular/cdk/portal';

@NgModule({
  declarations: [ElectionsSearchComponent],
  exports: [ElectionsSearchComponent],
  imports: [
    CommonModule,
    NglInputModule,
    FormsModule,
    NglSelectModule,
    PortalModule,
    NglSpinnersModule
  ]
})
export class ElectionsSearchModule { }
