import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NglFormElementComponent } from './ngl-form-element.component';

describe('NglFormElementComponent', () => {
  let component: NglFormElementComponent;
  let fixture: ComponentFixture<NglFormElementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NglFormElementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NglFormElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
