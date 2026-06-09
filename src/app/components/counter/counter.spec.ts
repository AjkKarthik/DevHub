import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Counter } from './counter';

describe('Counter component', () => {
  let fixture: ComponentFixture<Counter>;
  let component: Counter;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Counter],
    }).compileComponents();

    fixture = TestBed.createComponent(Counter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts at 0', () => {
    expect(component.count()).toBe(0);
  });

  it('increments by step', () => {
    component.increment();
    expect(component.count()).toBe(1);
  });

  it('decrements by step', () => {
    component.decrement();
    expect(component.count()).toBe(-1);
  });

  it('resets to 0', () => {
    component.increment();
    component.increment();
    component.reset();
    expect(component.count()).toBe(0);
  });

  it('doubled is always count * 2', () => {
    component.increment();
    component.increment();
    expect(component.doubled()).toBe(4);
  });

  it('isNegative is true when count < 0', () => {
    component.decrement();
    expect(component.isNegative()).toBeTrue();
  });

  it('isZero is true at start', () => {
    expect(component.isZero()).toBeTrue();
  });

  it('step change affects increment amount', () => {
    component.step.set(5);
    component.increment();
    expect(component.count()).toBe(5);
  });
});
