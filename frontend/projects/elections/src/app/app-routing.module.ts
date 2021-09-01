import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { EsiaGuard } from '@shared/modules/esia-guard/esia-guard.service';
import { NewsComponent } from './news/news.component';
import { AboutComponent } from './about/about.component';
import { DoneComponent } from './done/done.component';
import { ErrorComponent } from './error/error.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent,
  },
  {
    path: 'news',
    pathMatch: 'full',
    component: NewsComponent,
  },
  {
    path: 'about',
    pathMatch: 'full',
    component: AboutComponent,
  },
  {
    path: 'profile',
    pathMatch: 'full',
    component: ProfileComponent,
    canActivate: [EsiaGuard],
  },
  {
    path: 'elections',
    pathMatch: 'prefix',
    // tslint:disable-next-line:typedef
    loadChildren: () => import('./elections/elections.module').then(mod => mod.ElectionsModule),
  },
  {
    path: 'vote',
    pathMatch: 'prefix',
    // tslint:disable-next-line:typedef
    loadChildren: () => import('./ebs-vote/ebs-vote.module').then(mod => mod.EbsVoteModule),
    canActivate: [EsiaGuard],
    // canDeactivate: [VotePreventGuard],
  },
  {
    path: 'profile-bio',
    pathMatch: 'prefix',
    // tslint:disable-next-line:typedef
    loadChildren: () => import('./profile-bio/profile-bio.module').then(mod => mod.ProfileBioModule),
    canActivate: [EsiaGuard],
    // canDeactivate: [VotePreventGuard],
  },
  {
    path: 'simple-vote',
    pathMatch: 'prefix',
    // tslint:disable-next-line:typedef
    loadChildren: () => import('./simple-vote/simple-vote.module').then(mod => mod.SimpleVoteModule),
    // canDeactivate: [VotePreventGuard],
  },
  {
    path: 'un-auth-vote',
    pathMatch: 'prefix',
    // tslint:disable-next-line:typedef
    loadChildren: () => import('./un-auth-voting/un-auth-voting.module').then(mod => mod.UnAuthVotingModule),
  },
  {
    path: 'done',
    pathMatch: 'full',
    component: DoneComponent,
  },
  {
    path: 'error/:section',
    pathMatch: 'full',
    component: ErrorComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {scrollPositionRestoration: 'enabled'}),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
