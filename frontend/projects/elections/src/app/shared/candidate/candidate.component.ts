import { Component, Inject, Input, OnInit } from '@angular/core';
import { Candidate } from '../mocks/candidate';
import { APP_BASE_HREF } from '@angular/common';

@Component({
  selector: 'app-candidate',
  templateUrl: './candidate.component.html',
  styleUrls: ['./candidate.component.scss']
})
export class CandidateComponent implements OnInit {
  @Input() candidate: Candidate;
  @Input() electionId: string;
  toggle = false;
  fields = Object.entries({
    description: '',
    birthday: 'Дата рождения:',
    birthplace: 'Место рождения:',
    reside: 'Место жительства кандидата:',
    education: 'Сведения о профессиональном образовании:',
    work: 'Основное место работы или службы:',
    post: 'Занимаемая должность (или род занятий):',
    party_hard: 'Принадлежность к партии:',
    maritalStatus: 'Семейное положение:',
    income: 'Сумма и источники доходов за 2019 год:',
    realEstate: 'Недвижимое имущество:',
    auto: 'Транспортные средства:',
    money: 'Денежные средства, находящиеся на счетах (во вкладах) в банках:',
    other: 'Иное имущество:',
  });
  constructor(
    @Inject(APP_BASE_HREF) public baseHref: string,
  ) { }
  ngOnInit(): void {
  }

  replaceForBr(key: string, str: string): string {
    if (key !== 'description') {
      return str;
    }
    return str.replace(/\n/g, '<br/>');
  }
}
