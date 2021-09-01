import { Component, Input, OnInit } from '@angular/core';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'ngl-form-element',
  templateUrl: './ngl-form-element.component.html',
  styleUrls: ['./ngl-form-element.component.scss']
})
export class NglFormElementComponent implements OnInit {

  @Input('nglLabel') label: string;
  @Input() for: string;
  @Input('nglRequired') isRequired: boolean | string;

  get _isRequired(): boolean {
    return !!this.isRequired || this.isRequired === '';
  }

  constructor() {
  }

  ngOnInit(): void {
  }

}
