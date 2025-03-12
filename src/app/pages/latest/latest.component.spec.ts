import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LatestComponent } from './latest.component';

describe('LatestComponent', () => {
  let component: LatestComponent;
  let fixture: ComponentFixture<LatestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LatestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LatestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
