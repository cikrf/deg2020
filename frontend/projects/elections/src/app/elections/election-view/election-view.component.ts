import { Component, Input } from '@angular/core';
import { ElectionDto } from '@shared/models/portal.models';

@Component({
  selector: 'app-election-view',
  templateUrl: './election-view.component.html',
  styleUrls: ['./election-view.component.scss'],
})
export class ElectionViewComponent {
  @Input() election: ElectionDto;

}
