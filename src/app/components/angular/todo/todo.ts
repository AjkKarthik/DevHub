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
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';

type Filter = 'all' | 'pending' | 'completed';

@Component({
  selector: 'app-todo',
  imports: [
    ReactiveFormsModule, TitleCasePipe, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent,
    CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
  ],
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
      heading: 'inject() — modern dependency injection without constructors',
      points: [
        '<code>inject(Service)</code> works in field initialisers, guards, interceptors, pipes, and any injection context — not just constructors. It eliminates long constructor parameter lists and enables cleaner composable patterns.',
        'Field initialisers using <code>inject()</code> run in the injection context so Angular resolves the dependency correctly: <code>private fb = inject(FormBuilder)</code> and <code>readonly todoService = inject(TodoService)</code> are both valid and idiomatic Angular 14+.',
        '<code>runInInjectionContext(injector, () => inject(...))</code> allows DI in contexts that are not automatically inside the injection context — for example, inside a RxJS operator callback or a setTimeout. Use sparingly.',
        'inject() is type-safe — TypeScript infers the return type from the token. Passing <code>inject(FormBuilder)</code> returns <code>FormBuilder</code> with no manual type annotation needed.',
        'The traditional constructor injection pattern is still valid and sometimes preferred for clarity in large constructors; <code>inject()</code> is not a replacement mandate, just an ergonomic alternative. Both compile to the same DI resolution at runtime.',
      ],
    },
    {
      heading: 'Reactive Forms — FormBuilder, FormGroup, and validators',
      points: [
        '<code>fb.group({ field: [defaultValue, [validators]] })</code> creates a <code>FormGroup</code> with typed controls. The second element of each array is the synchronous validators array; a third element is the async validators array.',
        'FormGroup is typed in Angular 14+ — <code>form.controls.title</code> is <code>FormControl&lt;string | null&gt;</code>. Use <code>fb.nonNullable.group()</code> to get <code>FormControl&lt;string&gt;</code> (no <code>null</code>) for cleaner typings after reset.',
        '<code>form.value</code> returns only enabled field values; <code>form.getRawValue()</code> includes disabled controls. Always use <code>getRawValue()</code> for submit payloads when any control may be disabled.',
        '<code>control.errors</code> is an object <code>{ required: true }</code> or <code>{ minlength: { requiredLength: 3, actualLength: 1 } }</code>. Access individual error keys with <code>control.errors?.[\'required\']</code>.',
        'Reactive forms are <strong>completely decoupled from the template</strong> — the form model lives in the class and is synced to the DOM through <code>[formGroup]</code> and <code>formControlName</code> directives. This makes form logic unit-testable without rendering.',
      ],
    },
    {
      heading: 'Route Guards — CanActivateFn and CanDeactivateFn',
      points: [
        '<code>CanActivateFn</code> is a plain function: <code>(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =&gt; boolean | UrlTree | Observable&lt;boolean&gt;</code>. Return <code>true</code> to allow, a <code>UrlTree</code> to redirect, or <code>false</code> to block navigation.',
        'Returning <code>router.parseUrl(\'/login\')</code> redirects cleanly — Angular handles the navigation, the browser history is updated correctly, and it avoids the double-navigation bug that manual <code>router.navigate()</code> in a guard can cause.',
        'Register with <code>canActivate: [myGuard]</code> in the route definition. In Angular 15+ this can also be an inline function: <code>canActivate: [(route, state) =&gt; inject(AuthService).isLoggedIn()]</code>.',
        '<code>CanDeactivateFn&lt;T&gt;</code> intercepts navigation away from a component — the component instance is passed as the first argument. Use it to prompt "Leave? Changes will be lost." before the user navigates away from an unsaved form.',
        'Guards that return an <code>Observable</code> must complete — Angular awaits the first emission and ignores subsequent ones. If the Observable never completes or emits, navigation hangs indefinitely. Use <code>take(1)</code> to ensure it completes.',
      ],
    },
    {
      heading: 'Signal-based services — the modern state pattern',
      points: [
        'A <code>@Injectable({ providedIn: \'root\' })</code> service with <code>signal()</code> state is the simplest Angular state management approach. All components that inject the service share the same signal instance — state changes propagate automatically.',
        'The canonical pattern: private <code>WritableSignal</code> for mutation + public <code>.asReadonly()</code> for reading + <code>computed()</code> for derived views. This enforces unidirectional data flow at the TypeScript type level.',
        'Services can use <code>effect()</code> to persist state to localStorage automatically: <code>effect(() =&gt; localStorage.setItem(\'todos\', JSON.stringify(this.todos())))</code>. The effect re-runs on every change without explicit calls in each mutation method.',
        'Multiple components sharing the same <code>providedIn: \'root\'</code> service see state changes instantly — no event emitter, no Subject, no store action dispatch. The signal is the single source of truth.',
        'For component-scoped state (state that should reset on component destroy), provide the service in the component\'s <code>providers: [MyService]</code> array. Each component instance gets its own isolated signal store.',
      ],
    },
    {
      heading: 'Custom validators, async validators, and update strategies',
      points: [
        'A synchronous custom validator is a plain function: <code>(control: AbstractControl): ValidationErrors | null =&gt; control.value.includes(\'@\') ? null : { noAt: true }</code>. Return <code>null</code> for valid, an object with an error key for invalid.',
        'An async validator returns <code>Observable&lt;ValidationErrors | null&gt;</code> or <code>Promise&lt;ValidationErrors | null&gt;</code>. While pending, <code>control.status</code> is <code>"PENDING"</code> and the control is considered invalid, preventing premature submit.',
        '<code>Validators.compose([v1, v2])</code> runs all validators and merges their errors. Angular\'s built-in validators are just functions — you can spread them with custom ones in the same array.',
        'By default, form controls validate on every keystroke (<code>updateOn: \'change\'</code>). Change to <code>updateOn: \'blur\'</code> or <code>updateOn: \'submit\'</code> on the group or individual control to reduce validation noise: <code>fb.group({...}, { updateOn: \'blur\' })</code>.',
        'Async validators should always use <code>debounceTime(300)</code> to avoid a network request on every character. Wrap with <code>switchMap</code> to cancel previous in-flight requests when the user types faster than responses arrive.',
      ],
    },
    {
      heading: 'Reactive form state — dirty, touched, status, and lifecycles',
      points: [
        '<code>control.touched</code> becomes <code>true</code> after the user focuses and blurs the field. <code>control.dirty</code> becomes <code>true</code> after the user types (value changes). Show validation errors only when <code>touched</code> to avoid noise on untouched fields.',
        '<code>form.markAllAsTouched()</code> triggers validation error display for all fields at once — call it in the submit handler when you want to show all errors if the user clicks submit without interacting with every field.',
        '<code>form.reset()</code> resets value to initial and clears touched/dirty/errors. <code>form.reset({ title: \'default\' })</code> resets to specific values. <code>form.patchValue()</code> updates only specified fields without touching others; <code>form.setValue()</code> requires all fields.',
        '<code>control.valueChanges</code> is an Observable that emits whenever the control value changes. Pipe it through <code>debounceTime(300)</code> for live search UIs. <code>form.statusChanges</code> emits <code>"VALID"</code> / <code>"INVALID"</code> / <code>"PENDING"</code> on every validation run.',
        '<code>form.disable()</code> and <code>form.enable()</code> change the entire form; <code>control.disable()</code> affects a single control. Disabled controls are excluded from <code>form.value</code> but included in <code>form.getRawValue()</code>. Setting a disabled input via Angular does not trigger browser validation.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'inject() + Reactive Form',
      language: 'typescript',
      code: `export class TodoComponent {
  // inject() — modern DI, no constructor parameters needed
  private fb           = inject(FormBuilder);
  readonly todoService = inject(TodoService);

  // Typed reactive form — fb.nonNullable removes | null from value types
  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
  });

  get titleControl() { return this.form.controls.title; }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // show errors on all fields at once
      return;
    }
    this.todoService.add(this.titleControl.value);
    this.form.reset();
  }
}`,
    },
    {
      label: 'Signal-based Service',
      language: 'typescript',
      code: `@Injectable({ providedIn: 'root' })
export class TodoService {
  // Private mutable signal — only the service mutates it
  private todos = signal<Todo[]>([]);

  // Public read-only computed signals — auto-update on change
  readonly all       = this.todos.asReadonly();
  readonly pending   = computed(() => this.todos().filter(t => !t.completed));
  readonly completed = computed(() => this.todos().filter(t =>  t.completed));
  readonly count     = computed(() => this.todos().length);

  constructor() {
    // Persist to localStorage automatically on every change
    effect(() => localStorage.setItem('todos', JSON.stringify(this.todos())));
  }

  add(title: string) {
    this.todos.update(list => [
      ...list, { id: Date.now(), title, completed: false },
    ]);
  }
  toggle(id: number) {
    this.todos.update(l => l.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }
  remove(id: number) {
    this.todos.update(l => l.filter(t => t.id !== id));
  }
}`,
    },
    {
      label: 'Form validation template',
      language: 'html',
      code: `<form [formGroup]="form" (ngSubmit)="submit()">
  <input
    formControlName="title"
    placeholder="What needs to be done? (min 3 chars)"
    [class.error]="titleControl.invalid && titleControl.touched"
  />
  <button type="submit">Add</button>

  <!-- Errors only shown after user has touched the field -->
  @if (titleControl.touched && titleControl.errors) {
    @if (titleControl.errors['required'])  { <span>Title is required.</span> }
    @if (titleControl.errors['minlength']) { <span>Minimum 3 characters.</span> }
  }
</form>`,
    },
    {
      label: 'Route Guards',
      language: 'typescript',
      code: `// CanActivateFn — a plain function, no class needed
const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  // Return UrlTree to redirect instead of navigating manually
  return auth.isLoggedIn() ? true : router.parseUrl('/login');
};

// CanDeactivateFn — warns before leaving unsaved form
const unsavedGuard: CanDeactivateFn<TodoComponent> =
  (component) => component.form.pristine
    ? true
    : confirm('Leave? Unsaved changes will be lost.');

// Register on routes
const routes: Routes = [
  {
    path: 'todos',
    component: TodoComponent,
    canActivate: [authGuard],
    canDeactivate: [unsavedGuard],
  },
];`,
    },
    {
      label: 'Custom validator',
      language: 'typescript',
      code: `// Synchronous custom validator — return null if valid, object if invalid
function noEmojiValidator(control: AbstractControl): ValidationErrors | null {
  const emojiRegex = /\\p{Emoji}/u;
  return emojiRegex.test(control.value ?? '') ? { noEmoji: true } : null;
}

// Async validator — checks uniqueness via HTTP
function uniqueTitleValidator(svc: TodoService): AsyncValidatorFn {
  return (control) =>
    timer(300).pipe(
      switchMap(() => svc.checkExists(control.value)),
      map(exists => exists ? { titleTaken: true } : null),
    );
}

// Use in FormBuilder
form = this.fb.group({
  title: [
    '',
    [Validators.required, noEmojiValidator],           // sync validators
    [uniqueTitleValidator(this.todoService)],          // async validators
  ],
}, { updateOn: 'blur' });                             // validate on blur`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What does `inject(FormBuilder)` replace compared to older Angular patterns?',
      options: [
        'It replaces the need for ReactiveFormsModule entirely',
        'It replaces constructor-based dependency injection, allowing DI in field initializers',
        'It replaces the FormGroup API with a simpler signal-based form',
        'It replaces template-driven forms with reactive forms automatically',
      ],
      answer: 1,
      explanation: 'inject() is the modern functional DI API that works in field initializers, guards, and interceptors — not just constructors. TodoComponent uses `private fb = inject(FormBuilder)` as a field initializer instead of listing it as a constructor parameter.',
    },
    {
      q: 'In TodoService, why is `todos` private while `all`, `pending`, and `completed` are public?',
      options: [
        'Private signals are faster than public ones at runtime',
        'Angular requires signals to be private for change detection to work',
        'Encapsulation: only the service mutates state; consumers get read-only or computed views',
        'Public signals cannot be used with computed() in Angular',
      ],
      answer: 2,
      explanation: 'The private `todos` signal is the single mutable source of truth. Public surfaces are either `asReadonly()` or `computed()` — preventing external mutation while giving components reactive read access. TypeScript enforces this at compile time.',
    },
    {
      q: 'What happens when the user types 2 characters into the title input and then clicks away?',
      options: [
        'Nothing — validation errors only show on form submit',
        'The input gets the error CSS class and a "Minimum 3 characters." message appears',
        'The form auto-submits and resets',
        'Angular throws a runtime error because minLength is not satisfied',
      ],
      answer: 1,
      explanation: '[class.error]="titleControl.invalid && titleControl.touched" adds the error class once the field is both invalid AND touched (blurred after focus). The @if block then renders the minlength error span because titleControl.errors[\'minlength\'] is truthy.',
    },
    {
      q: 'What is the purpose of `track f` inside @for on the filter tabs?',
      options: [
        'It enables two-way data binding on the filter buttons',
        'It tells Angular\'s differ to use the string value as a stable identity key for DOM reuse',
        'It subscribes to the filter signal automatically',
        'It is required syntax but has no performance effect in Angular 22',
      ],
      answer: 1,
      explanation: 'track provides a unique identity for each item so Angular\'s reconciler can reuse existing DOM nodes instead of destroying and recreating them on every render. For primitive strings like filter values, tracking by the value itself is correct and efficient.',
    },
    {
      q: 'What does `form.getRawValue()` return that `form.value` does not?',
      options: [
        'A Promise resolving to the form\'s current values',
        'The values of disabled controls that form.value omits',
        'A typed object with no null fields',
        'The validation errors for each field',
      ],
      answer: 1,
      explanation: 'form.value silently omits disabled controls — they appear as undefined in the returned object. form.getRawValue() always includes all controls regardless of disabled state. Always use getRawValue() for submit payloads when any control might be disabled.',
    },
    {
      q: 'What is the difference between `control.touched` and `control.dirty`?',
      options: [
        'touched means the user typed something; dirty means the value changed since last reset',
        'touched means the user focused and blurred the field; dirty means the value changed from the initial value',
        'touched and dirty are the same thing — they are both true after any interaction',
        'touched is set by the template; dirty is set programmatically',
      ],
      answer: 1,
      explanation: 'touched becomes true when the user focuses then blurs the field (without necessarily typing). dirty becomes true when the value actually changes from the initial value. Show validation errors when touched (not dirty) to catch the case where the user tabs through fields without typing.',
    },
    {
      q: 'What does returning a UrlTree from a CanActivateFn guard do?',
      options: [
        'It blocks navigation without redirecting — the user stays on the current page',
        'It throws a router error that the ErrorHandler catches',
        'It triggers a redirect to the specified URL, correctly updating browser history',
        'It navigates to the URL and then re-runs the guard on the new route',
      ],
      answer: 2,
      explanation: 'Returning a UrlTree tells the Angular router to navigate to that URL instead of the original destination. Unlike calling router.navigate() manually inside a guard, returning a UrlTree is atomic — Angular handles the navigation cleanly without a double-navigation race condition.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'How does inject() improve over constructor injection?', a: '<code>inject(Service)</code> works in field initialisers, guards, interceptors, and any injection context — not just constructors. It makes code more functional and removes the need for a long constructor parameter list. The resolved dependency is available immediately as a field, including in field initialisers that reference it.' },
    { q: 'How do you protect a route with a CanActivateFn?', a: 'Create a function: <code>const authGuard: CanActivateFn = () =&gt; inject(AuthService).isLoggedIn() ? true : inject(Router).parseUrl(\'/login\')</code>. Register with <code>canActivate: [authGuard]</code> in the route definition. Return a UrlTree to redirect rather than calling router.navigate() directly.' },
    { q: 'How do you share a signal-based todo list across components?', a: 'Put it in a <code>providedIn: \'root\'</code> service. Every component that injects the service reads the same signal instance — adding a todo in one component immediately updates lists in all others. No event emitter, Subject, or global store action needed.' },
    { q: 'What is the difference between form.value and form.getRawValue()?', a: '<code>form.value</code> excludes disabled controls silently — they appear as undefined. <code>form.getRawValue()</code> includes all controls regardless of disabled state. Always use <code>getRawValue()</code> when submitting if any fields might be programmatically disabled.' },
    { q: 'How do you show validation errors only after a field is touched?', a: 'Check <code>control.touched && control.invalid</code> in the template. touched becomes true after the user focuses then blurs the field. Call <code>form.markAllAsTouched()</code> on submit to show all errors at once for fields the user skipped entirely.' },
    { q: 'How do you implement a canDeactivate guard to warn on unsaved changes?', a: 'Create: <code>const guard: CanDeactivateFn&lt;TodoComponent&gt; = (c) =&gt; c.form.pristine ? true : confirm(\'Leave? Changes lost.\')</code>. Register with <code>canDeactivate: [guard]</code>. The component instance is passed as the first argument — you can read any signal or form state from it.' },
    { q: 'How do async validators affect the form status?', a: 'While an async validator is running, <code>control.status</code> is <code>"PENDING"</code> and the overall <code>form.status</code> is also <code>"PENDING"</code>, which means <code>form.valid</code> is <code>false</code>. This naturally blocks premature submission. Always add <code>debounceTime(300)</code> and <code>switchMap</code> to cancel in-flight requests when the user types.' },
    { q: 'When should you use `patchValue()` vs `setValue()` on a reactive form?', a: '<code>form.setValue(obj)</code> requires the object to include every control key — it throws if any key is missing. <code>form.patchValue(partial)</code> updates only the keys provided and silently ignores missing ones. Use <code>patchValue()</code> when pre-filling a form from an API response that may not include all fields.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'inject()', type: 'function', desc: 'Functional DI API — works in field initializers, guards, interceptors, and any injection context. Replaces constructor parameter injection.', since: '14' },
    { name: 'signal()', type: 'function', desc: 'Creates a writable reactive signal that notifies consumers when its value changes.', since: '16' },
    { name: 'computed()', type: 'function', desc: 'Derives a read-only signal that recalculates whenever its signal dependencies change.', since: '16' },
    { name: 'FormBuilder', type: 'class', desc: 'Service with shorthand methods (group, control, array, nonNullable) for constructing typed reactive form models.', since: '2' },
    { name: 'Validators', type: 'class', desc: 'Built-in validator functions: required, minLength, maxLength, pattern, email, min, max. Compose with Validators.compose([]).', since: '2' },
    { name: 'FormGroup', type: 'class', desc: 'Tracks the value and validity of a group of FormControl instances. Typed in Angular 14+ when built with FormBuilder.', since: '2' },
    { name: 'CanActivateFn', type: 'type', desc: 'Functional guard type — a plain function returning boolean, UrlTree, or Observable/Promise thereof. No class or implements needed.', since: '15' },
    { name: 'CanDeactivateFn', type: 'type', desc: 'Functional guard that intercepts navigation away from a component. Receives the component instance as first argument.', since: '15' },
    { name: 'form.markAllAsTouched()', type: 'method', desc: 'Marks all controls as touched so their validation errors become visible — call on submit to show errors for fields the user never touched.', since: '8' },
    { name: 'signal.asReadonly()', type: 'method', desc: 'Returns a read-only Signal<T> view — TypeScript prevents .set()/.update() on it, enforcing unidirectional mutation through service methods.', since: '16' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Dependency Injection: constructor vs inject()',
      before: `export class TodoComponent {
  constructor(
    private fb: FormBuilder,
    private todoService: TodoService,
    private router: Router,
  ) {}
}`,
      after: `export class TodoComponent {
  private fb           = inject(FormBuilder);
  readonly todoService = inject(TodoService);
  private router       = inject(Router);
}`,
      note: 'inject() works in field initializers and any injection context, removing the need for constructor parameter lists. The resolved service is available immediately on the field.',
    },
    {
      title: 'Shared state: BehaviorSubject vs signal()',
      before: `@Injectable({ providedIn: 'root' })
export class TodoService {
  private _todos = new BehaviorSubject<Todo[]>([]);
  todos$  = this._todos.asObservable();
  pending$ = this.todos$.pipe(map(t => t.filter(x => !x.completed)));
  add(t: Todo) { this._todos.next([...this._todos.value, t]); }
}
// Template: {{ (todoService.todos$ | async)?.length }}`,
      after: `@Injectable({ providedIn: 'root' })
export class TodoService {
  private todos = signal<Todo[]>([]);
  readonly all     = this.todos.asReadonly();
  readonly pending = computed(() => this.todos().filter(t => !t.completed));
  add(t: Todo) { this.todos.update(l => [...l, t]); }
}
// Template: {{ todoService.pending().length }}`,
      note: 'signal() + computed() replaces BehaviorSubject — no async pipe, no subscription, no unsubscribe needed in components.',
    },
    {
      title: 'Template control flow: *ngIf vs @if',
      before: `<span
  *ngIf="titleControl.touched && titleControl.errors?.['required']">
  Required.
</span>`,
      after: `@if (titleControl.touched && titleControl.errors?.['required']) {
  <span>Required.</span>
}`,
      note: '@if (Angular 17+) is built-in — no NgIf import needed and the @else / @else if blocks are cleaner than ng-template references.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Reading form.value instead of getRawValue() when controls can be disabled',
      wrong: `submit() {
  const data = this.form.value; // disabled fields are undefined!
  this.api.save(data);
}`,
      right: `submit() {
  const data = this.form.getRawValue(); // includes disabled controls
  this.api.save(data);
}`,
      explanation: 'form.value omits disabled controls silently — they appear as undefined in the returned object. getRawValue() always returns all values regardless of disabled state. This is a common production bug when fields are conditionally disabled.',
    },
    {
      title: 'Mutating a signal array in-place instead of replacing the reference',
      wrong: `add(title: string) {
  this.todos().push({ title }); // mutates in place — no notification!
}`,
      right: `add(title: string) {
  this.todos.update(list => [...list, { title, id: Date.now(), completed: false }]);
}`,
      explanation: 'Signals detect changes by reference equality. Mutating the existing array (push, splice, sort in place) returns the same reference — Angular considers the value unchanged and no re-render occurs. Always return a new array from update().',
    },
    {
      title: 'Showing validation errors before the user interacts with the field',
      wrong: `@if (titleControl.invalid) {
  <span>Required.</span>
}`,
      right: `@if (titleControl.touched && titleControl.invalid) {
  <span>Required.</span>
}`,
      explanation: 'Without checking touched, errors appear immediately on page load before the user has had a chance to fill in the field. touched becomes true only after the user focuses then blurs the control.',
    },
    {
      title: 'Forgetting to call form.reset() after a successful submit',
      wrong: `submit() {
  if (this.form.invalid) return;
  this.todoService.add(this.titleControl.value!);
  // form still shows the old value and touched state
}`,
      right: `submit() {
  if (this.form.invalid) return;
  this.todoService.add(this.titleControl.value!);
  this.form.reset(); // clears value and resets touched/dirty state
}`,
      explanation: 'Without reset(), the input retains its previous value and the touched state remains true, keeping validation error messages visible after a successful add. form.reset() clears value, untouches all controls, and resets dirty state.',
    },
    {
      title: 'Using FormsModule instead of ReactiveFormsModule for reactive forms',
      wrong: `@Component({
  imports: [FormsModule], // wrong — provides ngModel, not formControlName
  template: '<input formControlName="title" />', // runtime error!
})`,
      right: `@Component({
  imports: [ReactiveFormsModule], // provides formGroup, formControlName
  template: '<input formControlName="title" />',
})`,
      explanation: 'FormsModule provides template-driven forms (ngModel, ngForm). ReactiveFormsModule provides reactive forms directives (formGroup, formControlName, formArrayName). Importing the wrong one causes a runtime error: "NG8002: Can\'t bind to formControlName since it isn\'t a known property."',
    },
  ];

  challenge: Challenge = {
    title: 'Signal-Based Counter Service with Undo',
    description: 'Create a standalone Angular component that uses a signal-based service to manage a counter with increment, decrement, reset, and a single-step undo feature. The service should expose the current count and whether undo is available as computed signals. The component should display the count and render all four action buttons, disabling Undo when no history exists.',
    language: 'typescript',
    hints: [
      'Store the previous value in a separate signal<number | null>(null) so undo knows what to restore.',
      'Use computed(() => this.previous() !== null) to derive canUndo, then bind [disabled]="!service.canUndo()" in the template.',
      'Call this.previous.set(this.count()) BEFORE mutating count so the old value is always saved first.',
      'Undo should restore count from previous and then set previous back to null so undo can only be used once.',
    ],
    starterCode: `import { Component, computed, inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CounterService {
  // TODO: declare private signals for count (initial 0) and previous (initial null)
  // TODO: expose count as readonly and canUndo as computed

  increment() { /* TODO: save previous, then increment */ }
  decrement() { /* TODO: save previous, then decrement */ }
  reset()     { /* TODO: save previous, then set to 0  */ }
  undo()      { /* TODO: restore previous, then clear it */ }
}

@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [],
  template: \`
    <!-- TODO: display count and four action buttons -->
    <!-- TODO: disable Undo when canUndo() is false -->
  \`,
})
export class CounterComponent {
  // TODO: inject CounterService
}`,
    solution: `import { Component, computed, inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CounterService {
  private count    = signal(0);
  private previous = signal<number | null>(null);

  readonly value   = this.count.asReadonly();
  readonly canUndo = computed(() => this.previous() !== null);

  increment() { this.previous.set(this.count()); this.count.update(n => n + 1); }
  decrement() { this.previous.set(this.count()); this.count.update(n => n - 1); }
  reset()     { this.previous.set(this.count()); this.count.set(0); }

  undo() {
    const prev = this.previous();
    if (prev !== null) {
      this.count.set(prev);
      this.previous.set(null);
    }
  }
}

@Component({
  selector: 'app-counter',
  standalone: true,
  imports: [],
  template: \`
    <div style="font-family:sans-serif;padding:1rem">
      <h2>Counter: {{ svc.value() }}</h2>
      <div style="display:flex;gap:.5rem;margin-top:1rem">
        <button (click)="svc.increment()">Increment</button>
        <button (click)="svc.decrement()">Decrement</button>
        <button (click)="svc.reset()">Reset</button>
        <button (click)="svc.undo()" [disabled]="!svc.canUndo()">Undo</button>
      </div>
    </div>
  \`,
})
export class CounterComponent {
  readonly svc = inject(CounterService);
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Angular reactive forms (FormBuilder + Validators) live in the class, sync to the template via directives; inject() does functional DI anywhere; a signal-based service with asReadonly() + computed() is the simplest scalable state pattern.',
    mustKnow: [
      '<code>inject(Service)</code> works in field initialisers and any injection context — no constructor parameter list needed',
      '<code>fb.group({ field: [default, [validators]] })</code> creates a typed FormGroup; use <code>fb.nonNullable.group()</code> to remove <code>null</code> from value types',
      '<code>form.value</code> omits disabled controls — always use <code>form.getRawValue()</code> for submit payloads',
      'Show validation errors only when <code>control.touched && control.invalid</code> — call <code>form.markAllAsTouched()</code> on submit for fields the user skipped',
      'Signal-based service pattern: private <code>WritableSignal</code> + public <code>asReadonly()</code> + <code>computed()</code> for derived state; mutation only through service methods',
      '<code>CanActivateFn</code> returns <code>true</code> or a <code>UrlTree</code> (redirect) — never call <code>router.navigate()</code> inside a guard; use <code>router.parseUrl()</code> instead',
      'Always call <code>form.reset()</code> after a successful submit to clear value and touched/dirty state',
    ],
    interviewFocus: [
      'What is the difference between template-driven and reactive forms? When would you choose each?',
      'How do you share reactive signal state across multiple components without a complex store?',
      'Why should you return a UrlTree from a CanActivateFn instead of calling router.navigate()?',
      'What is the difference between form.value and form.getRawValue()?',
      'How does an async validator affect form.status and how do you prevent too many HTTP calls?',
    ],
  };
}
