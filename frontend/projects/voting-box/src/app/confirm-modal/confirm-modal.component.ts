import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  template: `
      <div class="card_outer">
          <div class="container">
              <div class="wrapper card">
                  <div>
                      <div class="modal_content__title">{{'MODALS.CHOICE.TITLE'|translate}}</div>
                      <div class="modal_content__text">
                          {{'MODALS.CHOICE.TEXT'|translate}} <b>{{fio}}</b>
                      </div>
                      <div class="modal_content__buttons">
                          <button class="modal_content__button button"
                                  (click)="confirm.emit(false)">{{'MODALS.CHOICE.CANCEL'|translate}}</button>
                          <button class="modal_content__button button button-blue"
                                  (click)="confirm.emit(true)">{{'MODALS.CHOICE.OK'|translate}}</button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  `,
  styleUrls: ['./confirm-modal.component.scss'],
})
export class ConfirmModalComponent {
  @Input() fio = '';
  @Output() confirm = new EventEmitter();
}

// this.translate.instant('MODALS.CHOICE.TITLE'),
//   `<div class="text-h3">${this.election.candidates[this.voteNumber$.value]?.fio || ''}</div>
//         <div style="padding-top: 23px;">${this.translate.instant('MODALS.CHOICE.TEXT')}</div>`,
//   null,
//   this.translate.instant('MODALS.CHOICE.OK'),
