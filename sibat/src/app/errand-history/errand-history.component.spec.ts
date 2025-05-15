import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrandHistoryComponent } from './errand-history.component';

describe('ErrandHistoryComponent', () => {
  let component: ErrandHistoryComponent;
  let fixture: ComponentFixture<ErrandHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ErrandHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrandHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
