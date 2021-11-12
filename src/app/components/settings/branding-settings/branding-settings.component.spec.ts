import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandingSettingsComponent } from './branding-settings.component';

describe('BrandingSettingsComponent', () => {
  let component: BrandingSettingsComponent;
  let fixture: ComponentFixture<BrandingSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BrandingSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BrandingSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
