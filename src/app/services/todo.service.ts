import { Injectable, signal, computed } from '@angular/core';
import { Todo } from '../models/todo.model';

@Injectable({ providedIn: 'root' })
export class TodoService {
  // Signal-based state — the modern Angular way
  private todos = signal<Todo[]>([
    { id: 1, title: 'Learn Angular Signals', completed: true, createdAt: new Date() },
    { id: 2, title: 'Understand Reactive Forms', completed: false, createdAt: new Date() },
    { id: 3, title: 'Build a component', completed: false, createdAt: new Date() },
  ]);

  // Derived state — recomputes automatically when todos change
  readonly all = this.todos.asReadonly();
  readonly pending = computed(() => this.todos().filter(t => !t.completed));
  readonly completed = computed(() => this.todos().filter(t => t.completed));
  readonly count = computed(() => this.todos().length);

  private nextId = 4;

  add(title: string): void {
    this.todos.update(list => [
      ...list,
      { id: this.nextId++, title, completed: false, createdAt: new Date() },
    ]);
  }

  toggle(id: number): void {
    this.todos.update(list =>
      list.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  remove(id: number): void {
    this.todos.update(list => list.filter(t => t.id !== id));
  }
}
