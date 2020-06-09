import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphSelectorComponent } from './graph-selector.component';

describe('GraphSelectorComponent', () => {
  let component: GraphSelectorComponent;
  let fixture: ComponentFixture<GraphSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GraphSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
