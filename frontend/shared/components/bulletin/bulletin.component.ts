import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ElectionDto } from '@shared/models/portal.models';
import { filter, map, tap } from 'rxjs/operators';

@Component({
  selector: 'app-bulletin',
  templateUrl: './bulletin.component.svg',
  styleUrls: ['./bulletin.component.scss']
})
export class BulletinComponent implements OnChanges {

  @Input() election: ElectionDto;
  @Input() sample = false;
  value$ = new Subject();

  election$ = new Subject<ElectionDto>();
  ballotName = [];
  ballotRules = [];

  public widthBulletin = 1120; /* ширина бюллетеня */
  public heightStart = 390; /* начало отсчета для списка */
  public heightBlock = 184; /* высота блока item */
  public marginLeftTitle = 24; /* отступ слева для заголовка */
  public marginTopTitle = 120; /* отступ слева для заголовка */
  public marginTopFirstTitle = 56; /* отступ сверху для заголовка первой строки */
  public marginTopDesc1 = 40; /* отступ сверху для заголовка */
  public marginTopDesc2 = 25; /* отступ сверху для описания */
  public heightInput = 50; /* высота инпута для голосования */
  public widthInput = 50; /* ширина инпута для голосования */
  public coordXInput = 1040; /* координата для инпута по Х */
  public coordXMark1 = 1046; /* координата 1 для метки по Х */
  public coordXMark2 = 1084; /* координата 2 для метки по Х */
  public widthDesc = 900; /* ширина блока с описанием */
  public heightTextLine = 24; /* высота одной строки текста */
  public ballotRulesPath = `M10,200 H${this.widthBulletin - 50} M10,230 H${this.widthBulletin - 50} M10,260 H${this.widthBulletin - 50} M10,290 H${this.widthBulletin - 50}`;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.election) {
      this.ballotName = this.separate(changes.election.currentValue.ballotName, 150);
      this.ballotRules = this.separate(changes.election.currentValue.ballotRules, 150);
      this.election$.next(changes.election.currentValue);
    }
  }

  updateVal(val: number): void {
    this.value$.next(val);
  }

  separate(text: string, length: number = 100): string[] {
    const arrayText = text.split(' ');
    const j = Math.ceil(text.length / length);
    const arrayTextLength = arrayText.length;
    const array = Array(j);
    for (let i = 0; i < j; i++) {
      array[i] = '';
      for (let p = 0; p < arrayTextLength; p++) {
        if (arrayText[0] && (array[i].length + arrayText[0].length) < length) {
          array[i] += arrayText[0] + ' ';
          arrayText.shift();
        }
      }
    }
    return array;
  }

}
