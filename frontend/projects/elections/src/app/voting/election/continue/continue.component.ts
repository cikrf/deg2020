import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-continue',
    template: `
        <div class="modal_content__body">
            <article class="card__outer cipher">
                <div class="container">
                    <app-result
                            class="cipher__done"
                            [icon]="'success'"
                            [title]="title | translate"
                            [text]="text | translate"
                    >
                        <button class="button button-blue"
                                (click)="continue.emit()">{{ 'CIPHER.DONE.OK_BUTTON' | translate }}</button>
                    </app-result>
                </div>
            </article>
        </div>
    `
  }
)
export class ContinueComponent {
  @Output() continue = new EventEmitter();
  @Input() title = 'CIPHER.DONE.TITLE';
  @Input() text = 'CIPHER.DONE.TEXT';
}
