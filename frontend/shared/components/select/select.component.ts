import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'gaz-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements OnInit, ControlValueAccessor {

  open = false;
  _value: any;
  @Input() placeholder = '';
  @Input() valueField: string;
  @Input() items: any[] = [];

  constructor() {
  }

  ngOnInit(): void {
  }

  onChange: any = () => {
  }

  onTouched: any = () => {
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(obj: any): void {
    if (this.valueField) {
      try {
        this._value = obj[this.valueField];
      } catch (e) {
        this._value = obj;
      }
    } else {
      this._value = obj;
    }
    this.onChange(this._value);
  }

  clear() {
    this.writeValue(undefined);
  }
}
