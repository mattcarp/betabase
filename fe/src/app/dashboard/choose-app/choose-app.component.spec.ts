import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseAppComponent } from './choose-app.component';

describe('ChooseAppComponent', () => {
  let component: ChooseAppComponent;
  let fixture: ComponentFixture<ChooseAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChooseAppComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
