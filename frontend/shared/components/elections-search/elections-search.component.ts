import { Component, ElementRef, forwardRef, Input, OnInit, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged, filter, finalize, pluck, switchMap, tap } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { untilDestroyed } from '@shared/utils/until-destroyed';
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { CdkPortal } from '@angular/cdk/portal';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'gaz-elections-search',
  templateUrl: './elections-search.component.html',
  styleUrls: ['./elections-search.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ElectionsSearchComponent),
      multi: true,
    },
  ],
})
export class ElectionsSearchComponent implements OnInit, ControlValueAccessor {

  constructor(protected overlay: Overlay,
              private http: HttpClient) {
  }

  @Input() placeholder = '';
  @Input() showLoading = false;

  @ViewChild('dropreference')
  public reference: ElementRef;

  @ViewChild(CdkPortal)
  public contentTemplate: CdkPortal;

  searchElectionQuery$ = new BehaviorSubject('');

  elections = [];

  @Input() valueField: string;
  @Input() readonly: boolean | string;
  @Input() defaultValue = '';

  // tslint:disable-next-line:variable-name
  private _loading = false;

  get isLoading(): boolean {
    return this.showLoading && this._loading;
  }

  get _readonly(): boolean {
    return this.readonly === '' || !!this.readonly;
  }

  // tslint:disable-next-line:variable-name
  _value: any;
  protected overlayRef: OverlayRef;

  showOptions: boolean;
  // tslint:disable-next-line:variable-name
  _search: any;

  ngOnInit(): void {
    this.searchElectionQuery$.pipe(
      untilDestroyed(this),
      filter((query: string) => !!query && query.length >= 3),
      distinctUntilChanged(),
      debounceTime(300),
      switchMap(query => this.searchElectionByName(query)),
      tap(elections => {
        this.elections = elections;
        if (!this.showOptions) {
          this.show();
        }
      })
    ).subscribe();
  }

  searchElectionByName(name: string): Observable<any> {
    this._loading = true;
    return this.http.get<any>(`/api/admin/elections`, {params: {page: '0', pageSize: '50', name}}).pipe(
      pluck('data'),
      finalize(() => this._loading = false)
    );
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
    this._search = obj?.name;
    if (typeof obj === 'string') {
      this._search = obj;
    } else {
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
  }

  onSelectOption(election: any): void {
    this.writeValue(election);

    this.hide();
  }

  public hide(): void {
    this.overlayRef.detach();
    this.showOptions = false;
  }

  protected getOverlayConfig(): OverlayConfig {
    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(this.reference)
      .withPush(false)
      .withPositions([{
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top'
      }, {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom'
      }]);

    return new OverlayConfig({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop'
    });
  }

  show(): void {
    if (!this.elections.length) {
      return;
    }

    this.overlayRef = this.overlay.create(this.getOverlayConfig());
    this.overlayRef.attach(this.contentTemplate);
    this.syncWidth();
    this.overlayRef.backdropClick().subscribe(() => this.hide());
    this.showOptions = true;
  }

  private syncWidth(): void {
    if (!this.overlayRef) {
      return;
    }

    const refRect = this.reference.nativeElement.getBoundingClientRect();
    this.overlayRef.updateSize({width: refRect.width - 4, maxWidth: refRect.width - 4});
  }

  clear() {
    this.writeValue(undefined);
  }
}
