import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidateComponent } from './candidate.component';



@NgModule({
  declarations: [CandidateComponent],
  imports: [
    CommonModule
  ],
  exports: [
    CandidateComponent
  ]
})
export class CandidateModule { }
