import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SmsAuthComponent } from './sms-auth.component';

describe('SmsAuthComponent', () => {
  let component: SmsAuthComponent;
  let fixture: ComponentFixture<SmsAuthComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SmsAuthComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SmsAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
