import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ElectionsSearchComponent } from './elections-search.component';

describe('ElectionsSearchComponent', () => {
  let component: ElectionsSearchComponent;
  let fixture: ComponentFixture<ElectionsSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ElectionsSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ElectionsSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
