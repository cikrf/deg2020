import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ElectionComponent } from '../voting/election/election.component';
import { VotingModule } from '../voting/voting.module';

const routes: Routes = [
  {
    path: ':id',
    pathMatch: 'full',
    component: ElectionComponent,
    data: {headerType: 'cipher'},
  },
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes),
    VotingModule
  ],
  providers: []
})

export class UnAuthVotingModule {
}
