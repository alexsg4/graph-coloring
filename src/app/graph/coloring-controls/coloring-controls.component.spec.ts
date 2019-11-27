import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ColoringControlsComponent } from './coloring-controls.component';

describe('ColoringControlsComponent', () => {
  let component: ColoringControlsComponent;
  let fixture: ComponentFixture<ColoringControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ColoringControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ColoringControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
