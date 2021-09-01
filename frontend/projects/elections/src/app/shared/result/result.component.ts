import { Component, Input } from '@angular/core';
import { IconsCollection } from '@shared/enums/icons-collection.enum';

@Component({
  selector: 'app-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.scss']
})
export class ResultComponent {
  @Input() icon: IconsCollection;
  @Input() title: string;
  @Input() text: string;

  constructor() {
  }

}
