import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'gaz-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements OnInit, ControlValueAccessor {
  @Input() error: any;
  @Input() id: any;
  @Input() readonly: boolean | string;
  @Input() placeholder: any;
  // tslint:disable-next-line:variable-name
  _value: any;

  get _readonly(): boolean {
    return this.readonly === '' || !!this.readonly;
  }

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
    this._value = obj;
    this.onChange(this._value);
  }
}
