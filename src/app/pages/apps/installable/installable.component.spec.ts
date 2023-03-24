import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstallableComponent } from './installable.component';

describe('InstallableComponent', () => {
  let component: InstallableComponent;
  let fixture: ComponentFixture<InstallableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InstallableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstallableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
