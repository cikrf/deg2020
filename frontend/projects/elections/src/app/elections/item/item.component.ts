import { Component, Inject, Input, OnInit } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { Candidate } from '../../shared/mocks/candidate';
import { ElectionDto } from '@shared/models/portal.models';

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss']
})
export class ItemComponent implements OnInit {
  @Input() election: Election;
  constructor(
    @Inject(APP_BASE_HREF) public baseHref: string,
  ) { }

  ngOnInit(): void {
  }

}
class Election implements ElectionDto {
  [propName: string]: any;
  candidates: Candidate[];
}
