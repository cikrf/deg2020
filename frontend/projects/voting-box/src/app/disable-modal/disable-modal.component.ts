import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-disable-modal',
  template: `
      <div class="wrapper">
          <div class="modal_content__title text-h2">{{title | translate}}</div>
          <div *ngIf="text" class="modal_content__text text-body">
              <div style="padding-top: 23px;">{{text | translate}}</div>
              <div style="padding-top: 10px;"><strong>{{ballotName}}</strong></div>
          </div>
          <div class="modal_content__buttons">
              <a class="modal_content__button button button-blue" href="{{url}}">{{'MODALS.BALLOT_FAULT.BUTTON'|translate}}</a>
          </div>
      </div>
  `,
  styleUrls: ['./disable-modal.component.scss'],
})
export class DisableModalComponent {
  @Input() url: string;
  @Input() title = 'MODALS.BALLOT_FAULT.TITLE';
  @Input() text: string;
  @Input() ballotName: string;
}

