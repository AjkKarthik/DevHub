import { TestBed } from '@angular/core/testing';
import { TodoService } from './todo.service';

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TodoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts with 3 seed todos', () => {
    expect(service.count()).toBe(3);
  });

  it('add() increases count', () => {
    service.add('New todo');
    expect(service.count()).toBe(4);
  });

  it('remove() decreases count', () => {
    const id = service.all()[0].id;
    service.remove(id);
    expect(service.count()).toBe(2);
  });

  it('toggle() flips completed state', () => {
    const todo = service.all().find(t => !t.completed)!;
    service.toggle(todo.id);
    const updated = service.all().find(t => t.id === todo.id)!;
    expect(updated.completed).toBeTrue();
  });

  it('pending() only returns incomplete todos', () => {
    service.pending().forEach(t => expect(t.completed).toBeFalse());
  });

  it('completed() only returns done todos', () => {
    service.completed().forEach(t => expect(t.completed).toBeTrue());
  });

  it('pending + completed = total', () => {
    expect(service.pending().length + service.completed().length).toBe(service.count());
  });
});
