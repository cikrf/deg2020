import { Component, Input, OnInit, Inject } from '@angular/core';
import { Candidate } from '../../../shared/mocks/candidate';
import { CANDIDATE } from '../../../shared/mocks/mock-candidate';
import { APP_BASE_HREF } from '@angular/common';
import { ElectionDto } from '@shared/models/portal.models';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent implements OnInit {
  candidates = CANDIDATE;
  toggle: Candidate;
  @Input() election: Partial<ElectionDto & {districtName: string}>;
  @Input() title = 'Список кандидатов';
  public locationCandidates = null;

  constructor(
    @Inject(APP_BASE_HREF) public baseHref: string,
  ) {
  }

  ngOnInit(): void {

    console.log(this.election);

    // this.filterCandidate();
  }

  toogleClass(candidate: Candidate): void {
    this.toggle = candidate;
  }

  filterCandidate(): void {
    // this.locationCandidates = this.candidates.filter(item => item.location === this.location);
  }

}
