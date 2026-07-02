import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-signal-based-services-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './signal-based-services.html',
  styleUrl: './signal-based-services.scss',
})
export class SignalBasedServicesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The pattern: private signal + public readonly + computed',
      points: [
        'A <code>&#64;Injectable({ providedIn: \'root\' })</code> service with a private <code>WritableSignal</code>, a public <code>.asReadonly()</code> view, and <code>computed()</code> for derived state is the simplest state-management approach in a signals-first Angular app — often all a small-to-medium app needs, with zero third-party store library.',
        'Every component that injects the service shares the exact same signal instance — a todo added from one component instantly shows up everywhere else the list is rendered, with no event emitter, no Subject, no store dispatch.',
      ],
    },
    {
      heading: 'providedIn: \'root\' vs component-scoped — a real design decision',
      points: [
        '<code>providedIn: \'root\'</code> creates ONE instance for the entire app\'s lifetime — correct for state that should genuinely be shared and persist across navigation (a todo list, the logged-in user, a shopping cart).',
        'Listing the service in a component\'s own <code>providers: [MyService]</code> array instead creates a NEW, isolated instance scoped to that component (and destroyed when the component is destroyed) — correct for state that should reset each time, like a multi-step wizard\'s in-progress form data that should not leak between separate uses of the wizard.',
        'Getting this wrong in either direction causes real bugs: state that should be shared but is component-scoped appears to "reset" when you did not expect it to; state that should reset but is root-scoped leaks stale data into a fresh use of a component.',
      ],
    },
    {
      heading: 'effect() for automatic persistence',
      points: [
        'A service constructor can use <code>effect()</code> to keep a signal synced to <code>localStorage</code> automatically: <code>effect(() =&gt; localStorage.setItem(\'todos\', JSON.stringify(this.todos())))</code>. It re-runs on every change to <code>todos</code>, with no explicit save call needed inside <code>add()</code>/<code>remove()</code>/<code>toggle()</code> — the persistence logic lives in exactly one place.',
        'Because the service is <code>providedIn: \'root\'</code>, this effect is created once, in the injection context of the service\'s own constructor, and lives for the entire app session — there is no cleanup to worry about, unlike an effect created inside a component that gets destroyed and recreated.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/todo.service.ts',
      content: `import { Injectable, computed, effect, signal } from '@angular/core';

export interface Todo { id: number; title: string; completed: boolean; }

@Injectable({ providedIn: 'root' })
export class TodoService {
  private todos = signal<Todo[]>([
    { id: 1, title: 'Learn signal-based services', completed: false },
  ]);

  readonly all       = this.todos.asReadonly();
  readonly pending   = computed(() => this.todos().filter(t => !t.completed));
  readonly completed = computed(() => this.todos().filter(t =>  t.completed));
  readonly progress  = computed(() => {
    const total = this.todos().length;
    return total === 0 ? 0 : Math.round((this.completed().length / total) * 100);
  });

  constructor() {
    // Runs once immediately, then again on every change to todos — one save path
    effect(() => {
      console.log('persisting', this.todos().length, 'todos to localStorage');
      // localStorage.setItem('todos', JSON.stringify(this.todos()));
    });
  }

  add(title: string) {
    this.todos.update(list => [...list, { id: Date.now(), title, completed: false }]);
  }
  toggle(id: number) {
    this.todos.update(list => list.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { TodoService } from './todo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h2>Todos ({{ svc.progress() }}% done)</h2>
    <ul>
      @for (t of svc.all(); track t.id) {
        <li [class.done]="t.completed" (click)="svc.toggle(t.id)">{{ t.title }}</li>
      }
    </ul>
    <button (click)="svc.add('New task ' + (svc.all().length + 1))">Add task</button>
  \`,
  styles: [\`.done { text-decoration: line-through; opacity: .6; } li { cursor: pointer; }\`],
})
export class App {
  svc = inject(TodoService);
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Signal-based services</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a remove(id: number) method to TodoService that removes a todo by id, and a "Delete" button next to each item in the template that calls it (make sure the click does not also trigger the existing toggle).',
    hint: 'remove(id: number) { this.todos.update(list => list.filter(t => t.id !== id)); } — then a delete button with (click)="$event.stopPropagation(); svc.remove(t.id)" so it does not bubble up to the <li>\'s own toggle click handler.',
    solution: `// In TodoService:
remove(id: number) {
  this.todos.update(list => list.filter(t => t.id !== id));
}

// In the template:
<li [class.done]="t.completed" (click)="svc.toggle(t.id)">
  {{ t.title }}
  <button (click)="$event.stopPropagation(); svc.remove(t.id)">Delete</button>
</li>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a service needs to be listed in a component\'s providers array to be usable — providedIn: \'root\' is just a shortcut for that.',
      reality: 'these are two DIFFERENT scoping decisions, not equivalent shortcuts. <code>providedIn: \'root\'</code> creates ONE app-wide instance. Listing a service in a component\'s own <code>providers</code> array creates a SEPARATE instance scoped to that component, destroyed with it. Choosing the wrong one causes real state-sharing or state-leaking bugs.',
    },
    {
      thought: 'an effect() created inside a root service\'s constructor needs manual cleanup, same as one created inside a component.',
      reality: 'a <code>providedIn: \'root\'</code> service lives for the entire app session, so an effect created in its constructor also lives for the entire session — there is nothing to clean up. Cleanup only becomes relevant for effects tied to something with a shorter lifetime, like a component or a component-scoped service.',
    },
    {
      thought: 'sharing reactive state across components requires a dedicated state-management library like NgRx.',
      reality: 'a plain <code>providedIn: \'root\'</code> service with <code>signal()</code>/<code>computed()</code>/<code>effect()</code> covers the same need for most small-to-medium apps, with far less code and no extra dependency. NgRx and similar libraries earn their cost at a larger scale (complex state graphs, time-travel debugging, strict action auditing) — not as a default starting point.',
    },
  ];
}
