import { Component } from '@angular/core';
import { ElectionsService } from '../elections.service';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { filter, map, shareReplay, switchMap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { ModalService } from '@shared/modal-service/modal.service';
import { TranslateService } from '@ngx-translate/core';
import { Location } from '@angular/common';
import { ElectionViewComponent } from '../election-view/election-view.component';
import { addDays, differenceInCalendarDays, format, formatDistance, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { EnvService } from '@shared/modules/env/env.service';
import { ElectionDto } from '@shared/models/portal.models';

@Component({
  selector: 'app-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss']
})
export class PreviewComponent {
  spinner$ = new BehaviorSubject(true);
  electionId$ = this.route.paramMap.pipe(
    map((params: ParamMap) => params.get('id')),
    // map((id: string) => id ? parseInt(id, 10) : null),
  );
  election$: Observable<ElectionDto & { distance: string }> = this.electionId$.pipe(
    filter(id => !!id),
    switchMap((id) => this.service.getElection(id)),
    map((election: ElectionDto) => {
      election.startDateTime = election.startDateTime.replace(' ', 'T');
      election.endDateTime = election.endDateTime.replace(' ', 'T');
      // election.startDateTime = '2020-10-30T10:00';
      // election.endDateTime = '2020-10-30T12:00';
      const distance = election.startDateTime ? this.distance(election.startDateTime, election.endDateTime) : null;
      return {
        ...election,
        distance,
      };
    }),
    shareReplay(),
  );
  familiar$ = new BehaviorSubject(false);
  profileUrl = this.env.get('PROFILE_URL');
  // image$ = this.electionId$.pipe(
  //   switchMap((electionId) => {
  //       return this.service.getElectionPreview(electionId).pipe(
  //         map((i: any) => this.sanitizer.bypassSecurityTrustUrl('data:image/png;base64,' + btoa(bytesToString(i)))),
  //       );
  //     }
  //   ),
  //   shareReplay(),
  // );


  constructor(
    private service: ElectionsService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
    public env: EnvService,
  ) {
  }

  distance(start: string, end: string): string {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const dif = differenceInCalendarDays(endDate, startDate);
    const dateString = format(startDate, 'd MMMM', {locale: ru}) + ' - ' + format(endDate, 'd MMMM', {locale: ru});
    switch (dif) {
      case 0:
        return '' + format(startDate, 'd MMMM', {locale: ru});
      case 1:
        return 'Два дня: ' + dateString;
      case 2:
        return 'Три дня: ' + dateString;
      case 3:
        return 'Четыре дня: ' + dateString;
      case 4:
        return 'Пять дней: ' + dateString;
      default:
        return (formatDistance(startDate, addDays(endDate, 1), {locale: ru})) + ': ' + dateString;
    }
  }

  toggleFamiliar(): void {
    this.familiar$.next(!this.familiar$.value);
  }

  goToVoting(electionId: string): void {
    if (this.familiar$.value) {
      // this.router.navigate(['/', 'elections', 'choose-auth', electionId]); #todo deg 1291
      this.router.navigate(['/', 'simple-vote', electionId]).then();
    }
  }

  showPreview(): void {
    this.election$.subscribe((election) => {
      this.modalService.open(ElectionViewComponent, {
        width: window.innerWidth > 1199 ? '1120px' : window.innerWidth > 767 ? '672px' : '100%',
        closeCross: false,
        bodyScroll: true,
        inputs: {
          election,
        }
      });
    });

  }
}
