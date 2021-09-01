import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseAuthComponent } from './choose-auth.component';

describe('ChooseAuthComponent', () => {
  let component: ChooseAuthComponent;
  let fixture: ComponentFixture<ChooseAuthComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChooseAuthComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
