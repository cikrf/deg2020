import { Component, Input, OnInit } from '@angular/core';
import { ModalService } from '@shared/modal-service/modal.service';
import { PopupComponent } from './popup/popup.component';
import { ElectionsService } from 'projects/elections/src/app/elections/elections.service';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss'],
  providers: [
    ElectionsService,
  ],
})
export class LocationComponent implements OnInit {
  @Input() button: string;
  @Input() disabled = false;

  kur$ = this.electionsService.getHardcodedElectionByExternalId('20200913_46');
  yar$ = this.electionsService.getHardcodedElectionByExternalId('20200913_76');

  constructor(
      private modalService: ModalService,
      private electionsService: ElectionsService,
  ) { }

  openModal(location: Location | number): void {

    const obs$ = location === 1 ? this.kur$ : this.yar$;

    obs$.subscribe((election) => {
      this.modalService.open(PopupComponent, {
        width: window.innerWidth > 1199 ? '1120px' : window.innerWidth > 767 ? '672px' : '100%',
        closeCross: false,
        bodyScroll: true,
        inputs: {
          election,
        }
      });
    });


  }

  ngOnInit(): void {
  }

}
