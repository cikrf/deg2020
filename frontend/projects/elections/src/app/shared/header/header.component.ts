import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { map } from 'rxjs/operators';
import { BehaviorSubject, of } from 'rxjs';
import { postWebviewMessage } from '@shared/utils/postWebviewMessage';
import { Router } from '@angular/router';
import { ModalService } from '@shared/modal-service/modal.service';
import { MobileMenuComponent } from './mobile-menu/mobile-menu.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnChanges {

  @Input() public headerType: 'anonymous' | 'validation' | 'menu' | 'cipher' = 'menu';
  header$ = new BehaviorSubject(this.headerType);
  center$ = this.header$.pipe(
    map(headerType => headerType !== 'menu'),
  );
  closable$ = of(false);


  //   this.header$.pipe(
  //   map(headerType => ['anonymous', 'cipher'].includes(headerType)),
  // );

  constructor(
    private router: Router,
    private modalService: ModalService,
  ) {
  }

  mobileMenu(): void {
    this.modalService.open(MobileMenuComponent, {
      closeCross: false,
      outputs: {
        eventClose: {
          emit: (): void => {
            this.modalService.close();
          }
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.headerType) {
      this.header$.next(changes.headerType.currentValue);
    }
  }

  closeEvent(): void {
    if (!postWebviewMessage('close')) {
      this.router.navigateByUrl('/');
    }
  }

}
