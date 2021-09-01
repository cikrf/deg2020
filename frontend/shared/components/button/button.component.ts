import {Component, Input, OnInit} from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'gas-button',
    templateUrl: './button.component.html',
    styleUrls: ['./button.component.scss']
})
export class ButtonComponent implements OnInit {
    @Input() type: 'danger' | 'primary' | 'default' | 'success' = 'default';
    @Input() disabled = false;

    constructor() {
    }

    ngOnInit(): void {
    }
}
