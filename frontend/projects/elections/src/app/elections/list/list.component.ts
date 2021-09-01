import { Component } from '@angular/core';
import { ElectionsService } from '../elections.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { CANDIDATE } from '../../shared/mocks/mock-candidate';
import { ElectionDto } from '@shared/models/portal.models';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent {
  candidatesMock = CANDIDATE;
  activeTab = true;
  status$ = this.route.params.pipe(map(p => p.status || 'active'));
  elections$: Observable<ElectionDto[]> = this.status$.pipe(
    switchMap(status => this.service.getElections(status)),
  );
  error$ = new BehaviorSubject(null);
  statuses = Statuses;

  constructor(
    private route: ActivatedRoute,
    private service: ElectionsService,
  ) {
  }
}

export enum Statuses {
  PREPARING = 'В ожидании',
  READY = 'Готовы',
  IN_PROCESS = 'В процессе',
  COMPLETED = 'Завершены',
}

