import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscriber, TeardownLogic } from 'rxjs';
import { Router } from '@angular/router';
import { ModalService } from '@shared/modal-service/modal.service';
import { RandomNumbersComponent } from '@shared/modules/random-numbers/random-numbers.component';
import { postWebviewMessage } from '@shared/utils/postWebviewMessage';

@Injectable()
export class RandomNumbersService {

  constructor(
    private router: Router,
    private modalService: ModalService,
  ) {
  }

  generate(length: number = 256): Observable<number[]> {
    return new Observable<number[]>((subscriber: Subscriber<number[]>): TeardownLogic => {
      this.modalService.open(RandomNumbersComponent, {
        closeAction: (): void => {
          if(!subscriber.closed) {
            subscriber.next();
            subscriber.complete();
          }
        },
        inputs: {
          length,
        },
        outputs: {
          numbers: {
            emit: (numbers: number[]): void => {
              subscriber.next(numbers);
              subscriber.complete();
              this.modalService.close();
            },
          },
        },
        width: window.innerWidth > 1170 ? '1100px' : window.innerWidth > 767 ? '688px' : 'calc(100% - 40px)',
        mobileSticked: true,
        closeCross: false,
      });
      return (): void => {
        this.modalService.close();
      };
    });
  }

}

export enum RandomNumbersViewType {
  MODAL = 'MODAL',
}
