import { Component, OnInit } from '@angular/core';
import { map, pluck, shareReplay, switchMap } from 'rxjs/operators';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ElectionsService } from '../elections.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-choose-auth',
  templateUrl: './choose-auth.component.html',
  styleUrls: ['./choose-auth.component.scss']
})
export class ChooseAuthComponent {
  verificationTypes$: Observable<[string]> = this.electionsService.getVerfTypes().pipe(
    pluck('data'),
    shareReplay()
  );
  smsAvailable$ = this.verificationTypes$.pipe(map(types => types.includes('SMS')));
  ebsAvailable$ = this.verificationTypes$.pipe(map(types => types.includes('EBS')));
  electionId$ = this.verificationTypes$.pipe(switchMap(() => this.route.paramMap.pipe(
    map((params: ParamMap) => params.get('id')),
    )
  ));

  constructor(
    private route: ActivatedRoute,
    private electionsService: ElectionsService,
  ) {
  }
}
