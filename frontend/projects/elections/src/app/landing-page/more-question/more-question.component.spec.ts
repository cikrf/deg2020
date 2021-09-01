import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MoreQuestionComponent } from './more-question.component';

describe('MoreQuestionComponent', () => {
  let component: MoreQuestionComponent;
  let fixture: ComponentFixture<MoreQuestionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MoreQuestionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MoreQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
