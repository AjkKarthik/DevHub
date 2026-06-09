import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { TodoService } from '../../../services/todo.service';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

type Filter = 'all' | 'pending' | 'completed';

@Component({
  selector: 'app-todo',
  imports: [ReactiveFormsModule, TitleCasePipe, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './todo.html',
  styleUrl: './todo.scss',
})
export class TodoComponent {
  private fb = inject(FormBuilder);
  readonly todoService = inject(TodoService);

  filter = signal<Filter>('all');
  readonly filterOptions: Filter[] = ['all', 'pending', 'completed'];

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
  });

  get titleControl() { return this.form.controls.title; }

  get filteredTodos() {
    const f = this.filter();
    if (f === 'pending')   return this.todoService.pending();
    if (f === 'completed') return this.todoService.completed();
    return this.todoService.all();
  }

  setFilter(f: Filter) { this.filter.set(f); }

  submit() {
    if (this.form.invalid) return;
    this.todoService.add(this.titleControl.value!);
    this.form.reset();
  }

  theory: TheoryPoint[] = [
    {
      heading: 'Reactive Forms + inject()',
      points: [
        'inject(FormBuilder) replaces constructor injection — works anywhere in the injection context.',
        'fb.group({ field: [defaultValue, [validators]] }) builds a typed FormGroup with validators.',
        'form.value is typed when using typed FormGroup<{ field: FormControl<string> }>.',
        'form.getRawValue() returns all values including disabled controls — form.value omits them.',
      ],
    },
    {
      heading: 'Route Guards',
      points: [
        'CanActivateFn is a plain function: (route, state) => boolean | UrlTree | Observable<boolean>.',
        'Return a UrlTree (router.parseUrl(\'/login\')) to redirect — cleaner than navigating manually.',
        'Register with canActivate: [myGuard] in the route definition.',
        'CanDeactivateFn guards navigation away from a component — useful for unsaved changes warnings.',
      ],
    },
    {
      heading: 'Signal-based service',
      points: [
        'A @Injectable({ providedIn: \'root\' }) service with signal() state is the simplest state management.',
        'Expose computed() signals for derived state (counts, totals, filtered lists).',
        'Components inject the service and read signals directly — no store selectors or actions needed.',
        'Multiple components sharing the same service instance see the same signal state automatically.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'form.markAllAsTouched() triggers all validation error messages without submitting.',
        'form.reset() clears values and resets touched/dirty state — useful after a successful save.',
        'Async validators show status PENDING while the async check is in flight.',
        'FormGroup.valueChanges is an Observable — pipe it through debounceTime for live search.',
      ],
    },
  ];

  qna: QnaItem[] = [
    { q: 'How does inject() improve over constructor injection?', a: '<code>inject(Service)</code> works in field initialisers, guards, interceptors, and any injection context — not just constructors. It makes code more functional and removes the need for a long constructor parameter list.' },
    { q: 'How do you protect a route with a CanActivateFn?', a: 'Create a function: <code>const authGuard: CanActivateFn = () => inject(AuthService).isLoggedIn() ? true : router.parseUrl(\'/login\')</code>. Register with <code>canActivate: [authGuard]</code> in the route.' },
    { q: 'How do you share a signal-based todo list across components?', a: 'Put it in a <code>providedIn: \'root\'</code> service. Every component that injects the service reads the same signal instance — adding a todo in one component immediately updates lists in all others.' },
    { q: 'What is the difference between form.value and form.getRawValue()?', a: '<code>form.value</code> excludes disabled controls. <code>form.getRawValue()</code> includes all controls regardless of disabled state. Always use <code>getRawValue()</code> when submitting if any fields might be disabled.' },
    { q: 'How do you show validation errors only after a field is touched?', a: 'Check <code>control.touched && control.invalid</code> in the template. <code>touched</code> becomes true after the user focuses and blurs the field. Combine with <code>markAllAsTouched()</code> on submit to show all errors at once.' },
    { q: 'How do you implement a canDeactivate guard to warn on unsaved changes?', a: 'Create <code>const unsavedGuard: CanDeactivateFn&lt;TodoComponent&gt; = (c) => c.isDirty() ? confirm(\'Leave? Changes will be lost.\') : true</code>. Register with <code>canDeactivate: [unsavedGuard]</code> on the route.' },
  ];

  todoTabs: CodeTab[] = [
    {
      label: 'inject() + Reactive Form',
      language: 'typescript',
      code: `
export class TodoComponent {
  // inject() — modern DI, no constructor parameters needed
  private fb          = inject(FormBuilder);
  readonly todoService = inject(TodoService);

  // Type-safe reactive form — defined in the class, not the template
  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
  });

  get titleControl() { return this.form.controls.title; }

  submit() {
    if (this.form.invalid) return;        // guard early
    this.todoService.add(this.titleControl.value!);
    this.form.reset();
  }
}`,
    },
    {
      label: 'Signal-based Service',
      language: 'typescript',
      code: `
@Injectable({ providedIn: 'root' })
export class TodoService {
  // Private mutable signal — only the service mutates it
  private todos = signal<Todo[]>([]);

  // Public read-only computed signals — auto-update on change
  readonly all       = this.todos.asReadonly();
  readonly pending   = computed(() => this.todos().filter(t => !t.completed));
  readonly completed = computed(() => this.todos().filter(t =>  t.completed));
  readonly count     = computed(() => this.todos().length);

  add(title: string) {
    this.todos.update(list => [
      ...list,
      { id: Date.now(), title, completed: false, createdAt: new Date() },
    ]);
  }

  toggle(id: number) {
    this.todos.update(list =>
      list.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  }

  remove(id: number) {
    this.todos.update(list => list.filter(t => t.id !== id));
  }
}`,
    },
    {
      label: 'Form validation template',
      language: 'html',
      code: `
<form [formGroup]="form" (ngSubmit)="submit()">
  <input
    formControlName="title"
    placeholder="What needs to be done?"
    [class.error]="titleControl.invalid && titleControl.touched"
  />
  <button type="submit" [disabled]="form.invalid">Add</button>

  <!-- Validation errors — only shown after user has touched the field -->
  @if (titleControl.touched && titleControl.errors) {
    @if (titleControl.errors['required'])  { <span>Required.</span> }
    @if (titleControl.errors['minlength']) { <span>Min 3 chars.</span> }
  }
</form>`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'In the TodoComponent, what does `inject(FormBuilder)` replace compared to older Angular patterns?', options: ['It replaces the need for ReactiveFormsModule entirely', 'It replaces constructor-based dependency injection, allowing DI in field initializers', 'It replaces the FormGroup API with a simpler signal-based form', 'It replaces template-driven forms with reactive forms automatically'], answer: 1, explanation: 'inject() is the modern functional DI API that works in field initializers, guards, and interceptors — not just constructors. TodoComponent uses `private fb = inject(FormBuilder)` as a field initializer instead of listing it as a constructor parameter.' },
    { q: 'In TodoService, why is `todos` declared as a private signal while `all`, `pending`, and `completed` are public?', options: ['Private signals are faster than public ones at runtime', 'Angular requires signals to be private for change detection to work', 'Encapsulation: only the service mutates state; consumers get read-only or computed views', 'Public signals cannot be used with computed() in Angular'], answer: 2, explanation: 'This is a state encapsulation pattern. The private `todos` signal is the single mutable source of truth. Public surfaces (`all`, `pending`, `completed`) are either `asReadonly()` or `computed()` — preventing external mutation while giving components reactive read access.' },
    { q: 'What will happen in the template when a user types 2 characters into the title input and then clicks away?', options: ['Nothing — validation errors only show on form submit', 'The input gets the \'error\' CSS class and a \'Minimum 3 characters.\' message appears', 'The form auto-submits and resets', 'Angular throws a runtime error because minLength is not satisfied'], answer: 1, explanation: 'The input binding `[class.error]="titleControl.invalid && titleControl.touched"` adds the error class once the field is both invalid AND touched (blurred). The @if block then renders the minlength error span because `titleControl.errors[\'minlength\']` is truthy.' },
    { q: 'In the template\'s filter tabs, what is the purpose of `track f` inside the @for directive?', options: ['It enables two-way data binding on the filter buttons', 'It tells Angular\'s differ to use the filter string value as a stable identity key for DOM reuse', 'It subscribes to the filter signal automatically', 'It is required syntax but has no performance effect in Angular 22'], answer: 1, explanation: '`track` provides a unique identity for each item so Angular\'s reconciler can reuse existing DOM nodes instead of destroying and recreating them. For primitive strings like filter values, tracking by the value itself is the correct and efficient approach.' },
    { q: 'What is the return type of `filteredTodos` getter and why does it not need an explicit `Signal<>` wrapper?', options: ['It returns a plain array; the getter reads signal values eagerly on each call so no Signal wrapper is needed', 'It returns an Observable; Angular\'s async pipe handles unwrapping in the template', 'It returns a WritableSignal so the template can mutate it directly', 'It returns a Promise resolved by the TodoService'], answer: 0, explanation: '`filteredTodos` is a regular getter (not a signal or computed). It calls `this.filter()` and `this.todoService.pending()` etc., which reads signal values. Angular\'s template change detection tracks these signal reads and re-evaluates the getter whenever the signals change, so no explicit Signal wrapper is needed.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'inject()', type: 'function', desc: 'Functional dependency injection API that works in field initializers, guards, and interceptors — replacing constructor parameter injection.' , since: '14'},
    { name: 'signal()', type: 'function', desc: 'Creates a writable reactive signal that notifies consumers when its value changes.' , since: '16'},
    { name: 'computed()', type: 'function', desc: 'Derives a read-only signal whose value is recalculated whenever its signal dependencies change.' , since: '16'},
    { name: 'FormBuilder', type: 'class', desc: 'Service that provides shorthand methods (group, control, array) for constructing typed reactive form models.' , since: '2'},
    { name: 'Validators', type: 'class', desc: 'Collection of built-in validator functions (required, minLength, maxLength, pattern, email) for use with reactive forms.' , since: '2'},
    { name: 'FormGroup', type: 'class', desc: 'Tracks the value and validity state of a group of FormControl instances as a single unit.' , since: '2'},
    { name: 'CanActivateFn', type: 'interface', desc: 'Functional guard type — a plain function returning boolean, UrlTree, or an Observable/Promise thereof — used to protect routes.' , since: '15'},
    { name: 'CanDeactivateFn', type: 'interface', desc: 'Functional guard type that intercepts navigation away from a component, useful for warning about unsaved changes.' , since: '15'},
    { name: 'ReactiveFormsModule', type: 'class', desc: 'NgModule (or standalone import) that provides directives such as formGroup, formControlName, and ngSubmit for reactive forms.' , since: '2'},
    { name: 'signal.asReadonly()', type: 'function', desc: 'Returns a read-only view of a writable signal, preventing external mutation while keeping reactivity.' , since: '16'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Dependency Injection: constructor vs inject()', before: `export class TodoComponent {
  constructor(
    private fb: FormBuilder,
    private todoService: TodoService
  ) {}
}`, after: `export class TodoComponent {
  private fb = inject(FormBuilder);
  readonly todoService = inject(TodoService);
}`,
      note: 'inject() works in field initializers and any injection context, removing the need for constructor parameter lists.' },
    { title: 'Shared state: service with BehaviorSubject vs signal()', before: `@Injectable({ providedIn: 'root' })
export class TodoService {
  private _todos = new BehaviorSubject<Todo[]>([]);
  todos$ = this._todos.asObservable();
  add(t: Todo) { this._todos.next([...this._todos.value, t]); }
}`, after: `@Injectable({ providedIn: 'root' })
export class TodoService {
  private todos = signal<Todo[]>([]);
  readonly all = this.todos.asReadonly();
  readonly pending = computed(() => this.todos().filter(t => !t.completed));
  add(title: string) { this.todos.update(list => [...list, { title }]); }
}`,
      note: 'signal() + computed() replaces BehaviorSubject; no async pipe or subscription management needed.' },
    { title: 'Template control flow: *ngIf vs @if', before: `<span *ngIf="titleControl.touched && titleControl.errors?.['required']">Required.</span>`, after: `@if (titleControl.touched && titleControl.errors?.['required']) {
  <span>Required.</span>
}`,
      note: '@if (Angular 17+) is built-in control flow — no NgIf import needed and no structural directive asterisk syntax.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Reading form.value instead of getRawValue() when controls can be disabled', wrong: `submit() {
  const data = this.form.value; // disabled fields are undefined!
  this.save(data);
}`, right: `submit() {
  const data = this.form.getRawValue(); // includes disabled controls
  this.save(data);
}`, explanation: 'form.value omits disabled controls silently. getRawValue() always returns all values regardless of disabled state.'  },
    { title: 'Mutating a signal array directly instead of using update()', wrong: `add(title: string) {
  this.todos().push({ title }); // mutates in place, no notification
}`, right: `add(title: string) {
  this.todos.update(list => [...list, { title }]);
}`, explanation: 'Signals only notify consumers when a new reference is set. Mutating the existing array bypasses change detection entirely.'  },
    { title: 'Showing validation errors before the user interacts with the field', wrong: `@if (titleControl.invalid) {
  <span>Required.</span>
}`, right: `@if (titleControl.touched && titleControl.invalid) {
  <span>Required.</span>
}`, explanation: 'Without checking touched, errors appear immediately on page load before the user has had a chance to fill in the field.'  },
    { title: 'Forgetting to call form.reset() after a successful submit', wrong: `submit() {
  if (this.form.invalid) return;
  this.todoService.add(this.titleControl.value!);
  // form still shows the old value and touched state
}`, right: `submit() {
  if (this.form.invalid) return;
  this.todoService.add(this.titleControl.value!);
  this.form.reset(); // clears value and resets touched/dirty
}`, explanation: 'Without reset(), the input retains its previous value and the touched state remains true, which keeps validation error messages visible.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '16', label: 'Signals introduced', features: ['signal() creates a writable reactive primitive replacing BehaviorSubject for local/shared state.', 'computed() derives read-only signals that auto-update when dependencies change.', 'signal.asReadonly() exposes a public read-only view preventing external mutation.'] },
    { version: '17', label: 'Built-in control flow (@if / @for / @defer)', features: ['@if replaces *ngIf — no NgIf import, cleaner syntax, and supports @else blocks.', '@for replaces *ngFor with a mandatory track expression for efficient DOM reconciliation.', '@defer enables lazy loading of template blocks with loading/error/placeholder states.'] },
  ];

  challenge: Challenge = {
    title: 'Build a Signal-Based Counter Service with Undo',
    description: 'Create a standalone Angular component that uses a signal-based service to manage a counter with increment, decrement, reset, and a single-step undo feature. The service should expose the current count and whether undo is available as computed signals. The component should display the count and render all four action buttons, disabling Undo when no history exists.',
    language: 'typescript',
    hints: [
      'Store the previous value in a separate `signal<number | null>(null)` so undo knows what to restore.',
      'Use `computed(() => this.previous() !== null)` to derive whether undo is available, then bind `[disabled]="!counterService.canUndo()"` in the template.',
      'Call `this.previous.set(this.count())` BEFORE mutating `count` so the old value is always saved.',
      'For a standalone component, add CommonModule or use the built-in @if / @for control flow — no extra imports needed for signal reads in the template.',
    ],
    starterCode: `import { Component, computed, inject, Injectable, signal } from '@angular/core';

// --- Service ---
@Injectable({ providedIn: 'root' })
export class CounterService {
  // TODO: declare a private writable signal for count (start at 0)
  // TODO: declare a private writable signal for previous value (start at null)

  // TODO: expose count as a readonly signal
  // TODO: expose a computed \`canUndo\` signal (true when previous is not null)

  increment() {
    // TODO: save current count to previous, then increment count
  }

  decrement() {
    // TODO: save current count to previous, then decrement count
  }

  reset() {
    // TODO: save current count to previous, then reset to 0
  }

  undo() {
    // TODO: restore count from previous, then set previous back to null
  }
}

// --- Component ---
@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [],
  template: \`
    <!-- TODO: display the current count -->
    <!-- TODO: add Increment, Decrement, Reset, and Undo buttons -->
    <!-- TODO: disable the Undo button when canUndo() is false -->
  \`,
})
export class CounterComponent {
  // TODO: inject CounterService
}`,
    solution: `import { Component, computed, inject, Injectable, signal } from '@angular/core';

// --- Service ---
@Injectable({ providedIn: 'root' })
export class CounterService {
  private count = signal(0);
  private previous = signal<number | null>(null);

  readonly value = this.count.asReadonly();
  readonly canUndo = computed(() => this.previous() !== null);

  increment() {
    this.previous.set(this.count());
    this.count.update(n => n + 1);
  }

  decrement() {
    this.previous.set(this.count());
    this.count.update(n => n - 1);
  }

  reset() {
    this.previous.set(this.count());
    this.count.set(0);
  }

  undo() {
    const prev = this.previous();
    if (prev !== null) {
      this.count.set(prev);
      this.previous.set(null);
    }
  }
}

// --- Component ---
@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [],
  template: \`
    <div style="font-family: sans-serif; padding: 1rem;">
      <h2>Counter: {{ counterService.value() }}</h2>
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
        <button (click)="counterService.increment()">Increment</button>
        <button (click)="counterService.decrement()">Decrement</button>
        <button (click)="counterService.reset()">Reset</button>
        <button (click)="counterService.undo()" [disabled]="!counterService.canUndo()">Undo</button>
      </div>
    </div>
  \`,
})
export class CounterComponent {
  readonly counterService = inject(CounterService);
}`,
  };
}
