import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketSettingsComponent } from './ticket-settings.component';

describe('TicketSettingsComponent', () => {
  let component: TicketSettingsComponent;
  let fixture: ComponentFixture<TicketSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TicketSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TicketSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
