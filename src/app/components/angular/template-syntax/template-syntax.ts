import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';
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

@Component({
  selector: 'app-template-syntax',
  imports: [
    FormsModule, AsyncPipe, JsonPipe,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent,
    CommonMistakesComponent, PageMetaComponent, PageCompleteComponent,
    RevisionCardComponent,
  ],
  templateUrl: './template-syntax.html',
  styleUrl: './template-syntax.scss',
})
export class TemplateSyntax {
  appName    = signal('Angular 22');
  greeting   = signal('Hello');
  count      = signal(0);
  expression = computed(() => `${this.greeting()} from ${this.appName()}! Count: ${this.count()}`);

  isDisabled  = signal(false);
  isChecked   = signal(false);
  imageWidth  = signal(120);
  inputType   = signal<'text' | 'password'>('text');

  lastEvent   = signal('None');
  keyLog      = signal<string[]>([]);
  mousePos    = signal({ x: 0, y: 0 });

  onMouseMove(e: MouseEvent) { this.mousePos.set({ x: e.offsetX, y: e.offsetY }); }
  onKeyup(e: KeyboardEvent) {
    this.keyLog.update(log => [`"${e.key}" pressed`, ...log].slice(0, 5));
  }

  twoWayText  = '';
  twoWayColor = '#dd0031';
  refOutput   = signal('');

  isActive    = signal(false);
  isHighlight = signal(false);
  fontSize    = signal(16);
  textColor   = signal('#1a1a1a');

  user = signal<{ name: string; address?: { city: string } } | null>(null);
  toggleUser() {
    this.user.update(u =>
      u ? null : { name: 'Karthik', address: { city: 'Hyderabad' } }
    );
  }

  today    = new Date();
  price    = 1984.5;
  ratio    = 0.742;
  sentence = 'the quick brown fox jumps over the lazy dog';
  profile  = { name: 'Angular', version: 22, features: ['Signals', 'SSR', 'Material'] };
  fruits   = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
  sliceStart = signal(0);
  sliceEnd   = signal(3);

  timer$ = interval(1000).pipe(map(n => n));

  quickRef: QuickRefItem[] = [
    { name: '{{ expression }}', type: 'operator', desc: 'Interpolation — evaluates a TypeScript expression and renders its string value into the DOM.', since: '2' },
    { name: '[property]', type: 'operator', desc: 'Property binding — sets a DOM property from a component expression; targets JS properties, not HTML attributes.', since: '2' },
    { name: '(event)', type: 'operator', desc: 'Event binding — listens to a DOM event and invokes an expression; $event holds the native event object.', since: '2' },
    { name: '[(ngModel)]', type: 'directive', desc: 'Two-way binding shorthand combining [ngModel] property binding and (ngModelChange) event binding; requires FormsModule.', since: '2' },
    { name: '@if / @else if / @else', type: 'directive', desc: 'Built-in control flow block replacing *ngIf — no import needed, supports chained @else if branches.', since: '17' },
    { name: '@for / track', type: 'directive', desc: 'Built-in iteration block replacing *ngFor; track expression is required and drives efficient DOM reconciliation.', since: '17' },
    { name: '@switch / @case', type: 'directive', desc: 'Built-in switch block replacing ngSwitch — no import, no extra directive, direct value matching.', since: '17' },
    { name: '@defer', type: 'directive', desc: 'Lazy-loads a template block (and its dependencies) on demand with @placeholder, @loading, and @error sub-blocks.', since: '17' },
    { name: '@let', type: 'directive', desc: 'Declares a template-local variable scoped to the current block — useful for aliasing async values or computed expressions.', since: '18' },
    { name: '#templateRef', type: 'operator', desc: 'Template reference variable — provides a direct handle to a DOM element or component instance within the template.', since: '2' },
    { name: '?.', type: 'operator', desc: 'Safe navigation operator — short-circuits to undefined on null/undefined, preventing template null-reference errors.', since: '2' },
    { name: 'async pipe', type: 'pipe', desc: 'Subscribes to an Observable or Promise, renders the latest value, and auto-unsubscribes on component destroy.', since: '2' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Interpolation and expression evaluation',
      points: [
        'Interpolation <code>{{ expr }}</code> evaluates any TypeScript expression between the double curly braces and inserts the string result into the DOM. It supports variables, arithmetic, ternary operators, method calls, and pipe transforms — but not assignments, <code>new</code>, <code>++</code>, or multi-statement expressions.',
        'Angular evaluates template expressions in the context of the <strong>component instance</strong>. There is no need to write <code>this.</code> in the template — <code>{{ count() }}</code> reads the component\'s <code>count</code> signal directly. Expressions are evaluated on every change detection cycle that affects the component.',
        'Signals must be called with <code>()</code> in templates: <code>{{ count() }}</code>, not <code>{{ count }}</code>. Without the parentheses, the expression evaluates to the signal function object itself, producing <code>[object Object]</code> in the DOM — a common beginner mistake.',
        'Template expressions should be <strong>pure and side-effect-free</strong>. Angular may evaluate a template expression multiple times per change detection cycle. Avoid calling methods that mutate state, make HTTP requests, or produce observable side effects — use <code>computed()</code> signals or pre-computed class fields instead.',
        'Pipes transform values for display inside interpolation or binding expressions: <code>{{ today | date:\'shortDate\' }}</code>, <code>{{ price | currency }}</code>. Pipes are lazy by default — they only transform when the input value changes. The <code>async</code> pipe is special: it subscribes to Observables and Promises and unwraps the latest value automatically.',
      ],
    },
    {
      heading: 'Property binding, event binding, and two-way binding',
      points: [
        'Property binding <code>[property]="expression"</code> sets a DOM <strong>property</strong> (the JavaScript object property) from a component expression. This is distinct from HTML attributes — <code>[disabled]="isDisabled()"</code> sets the DOM <code>disabled</code> property; attributes like <code>aria-label</code> and <code>colspan</code> need the <code>[attr.aria-label]</code> prefix because they have no matching DOM property.',
        'Event binding <code>(event)="handler($event)"</code> listens to any DOM event (click, input, keyup, mousemove, etc.) and invokes the handler with the native event object available as <code>$event</code>. Angular provides key-combo shortcuts: <code>(keyup.enter)</code>, <code>(keydown.escape)</code> — no manual key-code checks needed.',
        'Two-way binding <code>[(ngModel)]="field"</code> is syntactic sugar for <code>[ngModel]="field" (ngModelChange)="field=$event"</code>. It requires <code>FormsModule</code> in the component\'s <code>imports</code> array. Without <code>FormsModule</code>, Angular throws "Can\'t bind to ngModel since it isn\'t a known property" at compile time.',
        'For signal-based state, prefer explicit value + input bindings over <code>ngModel</code>: <code>[value]="name()" (input)="name.set($any($event.target).value)"</code>. Angular 17.1+ introduced <code>model()</code> signals which support two-way binding with the <code>[()]</code> syntax on child components without <code>ngModel</code>.',
        'Class binding <code>[class.active]="isActive()"</code> adds/removes a CSS class conditionally. Style binding <code>[style.color]="textColor()"</code> and <code>[style.fontSize.px]="fontSize()"</code> apply inline styles (the <code>.px</code> suffix auto-appends the unit). For multiple classes, use <code>[ngClass]="{ active: isActive(), error: hasError() }"</code>.',
      ],
    },
    {
      heading: 'Template reference variables and @let',
      points: [
        'Template reference variables <code>#ref</code> give you a direct handle to a DOM element or component instance within the template. <code>#myInput</code> on an <code>&lt;input&gt;</code> lets you read <code>myInput.value</code> in event handlers elsewhere in the same template — without any component class involvement.',
        'The type of a template reference depends on what it is placed on: on a DOM element it is <code>HTMLElement</code>, on a component it is the component instance, on a directive it is the directive instance, and on an <code>&lt;ng-template&gt;</code> it is <code>TemplateRef</code>. You can disambiguate with <code>#f="ngForm"</code> to get the <code>NgForm</code> directive instance from a form element.',
        '<code>@let</code> (Angular 18+) declares a template-local variable scoped to the current block: <code>@let user = currentUser(); </code>. It is ideal for aliasing the result of a signal call, an <code>async</code> pipe, or any expression you read multiple times in the same block — avoiding repeated evaluation.',
        '<code>viewChild(\'ref\')</code> (Signal API) and <code>@ViewChild(\'ref\')</code> (decorator API) both access template reference variables from the component class. The signal-based <code>viewChild</code> is available after <code>ngAfterViewInit</code> and returns a <code>Signal&lt;ElementRef&gt;</code> or component instance.',
        'Template reference variables are scoped to their template. In a structural directive (<code>*ngIf</code>/<code>@if</code>) or <code>&lt;ng-template&gt;</code>, a <code>#ref</code> defined inside is not accessible outside that block. <code>@let</code> follows the same scoping rules — it cannot be accessed outside the block where it is defined.',
      ],
    },
    {
      heading: 'Control flow — @if, @for, @switch, @defer',
      points: [
        '<code>@if (condition) { } @else if (other) { } @else { }</code> replaces <code>*ngIf</code>. Unlike the old directive, it requires no <code>CommonModule</code> import, supports <code>@else if</code> chains (not just a single else), and does not create an extra DOM node. The condition is an arbitrary expression including signal calls.',
        '<code>@for (item of list; track item.id) { }</code> replaces <code>*ngFor</code>. The <code>track</code> expression is <strong>required</strong> (not optional as <code>trackBy</code> was). It tells Angular how to identify items during list changes — use a unique ID. Implicit variables <code>$index</code>, <code>$first</code>, <code>$last</code>, <code>$even</code>, <code>$odd</code>, and <code>$count</code> are always available inside the block without any declaration.',
        '<code>@switch (value) { @case (x) { } @default { } }</code> replaces the <code>[ngSwitch]</code>/<code>*ngSwitchCase</code> combination. Cases use <code>===</code> equality. It requires no imports and avoids the verbose three-directive pattern of the old syntax.',
        '<code>@defer</code> lazily loads a template block <em>and all its component/pipe dependencies</em> on demand. Default triggers: <code>@defer (on idle)</code> (browser idle), <code>@defer (on viewport)</code> (enters viewport), <code>@defer (on interaction)</code> (first user interaction). Sub-blocks: <code>@placeholder</code> (shown before load), <code>@loading</code> (while loading), <code>@error</code> (if load fails). Use it to defer heavy third-party chart or editor components off the critical path.',
        'Unlike <code>*ngIf</code>, <code>@defer</code> performs <strong>code splitting at the component level</strong> — the deferred component\'s JavaScript bundle is not included in the initial load. This can dramatically reduce Time to Interactive for pages with complex UI sections that are below the fold or behind a user interaction.',
      ],
    },
    {
      heading: 'Pipes — built-in, async, and custom',
      points: [
        'Pipes transform values for display without mutating the underlying data: <code>{{ value | pipeName:arg1:arg2 }}</code>. Angular ships with <code>DatePipe</code>, <code>CurrencyPipe</code>, <code>DecimalPipe</code>, <code>UpperCasePipe</code>, <code>LowerCasePipe</code>, <code>SlicePipe</code>, <code>JsonPipe</code>, <code>KeyValuePipe</code>, and <code>AsyncPipe</code>. Each must be imported individually in standalone components.',
        'The <code>async</code> pipe is the most important: <code>{{ observable$ | async }}</code> subscribes to an Observable (or Promise), renders each emitted value, and <strong>automatically unsubscribes</strong> when the component is destroyed. This eliminates the leak pattern of manual <code>subscribe()</code> without matching <code>unsubscribe()</code>.',
        'Pipes are <strong>pure by default</strong> — they re-run only when the input reference changes. A pure pipe is highly efficient: if the same array reference is passed repeatedly, the pipe is not re-evaluated even if the array\'s contents mutated. For mutation-aware pipes, mark them <code>pure: false</code> — but use this sparingly as it runs on every CD cycle.',
        'Custom pipes implement <code>PipeTransform</code>: <code>@Pipe({ name: \'truncate\' }) export class TruncatePipe implements PipeTransform { transform(value: string, limit = 100): string { return value.length > limit ? value.slice(0, limit) + \'…\' : value; } }</code>. Import the pipe class in the component\'s <code>imports</code> array to use it.',
        'Chaining pipes is supported: <code>{{ sentence | titlecase | slice:0:20 }}</code>. Evaluation is left-to-right. A common pattern: <code>{{ data$ | async | json }}</code> to inspect Observable payloads during development without a separate subscription.',
      ],
    },
    {
      heading: 'Best practices and gotchas',
      points: [
        'Keep template expressions <strong>simple and pure</strong>. Move logic into <code>computed()</code> signals or component methods that return values (not mutate state). Templates are not the place for conditionals with side effects, state mutations, or complex derivations — those belong in the class.',
        'Attribute binding <code>[attr.X]</code> vs property binding <code>[X]</code>: prefer property binding for standard DOM properties (<code>[disabled]</code>, <code>[value]</code>, <code>[href]</code>). Use attribute binding for non-property attributes: <code>[attr.colspan]</code>, <code>[attr.aria-label]</code>, <code>[attr.data-testid]</code>. Getting this wrong causes silent failures at runtime.',
        'The <code>$event</code> type in event bindings is <code>Event</code> by default. For specific events like <code>(input)</code>, the type is <code>InputEvent</code>. Use <code>$any($event.target).value</code> or cast explicitly: <code>(input)="name.set(($event.target as HTMLInputElement).value)"</code> to avoid TypeScript errors.',
        'Avoid calling methods that return new object/array references in templates (e.g., <code>[items]="filterItems()"</code>). If <code>filterItems()</code> creates a new array on every call, child components with OnPush detect an input change every CD cycle, even if the data is semantically identical. Use <code>computed()</code> to memoize the result.',
        'The <code>track</code> expression in <code>@for</code> is a performance contract — choose a stable, unique identifier (typically <code>item.id</code> or <code>item.uuid</code>). Using <code>track $index</code> is a last resort: it forces full DOM re-creation when list order changes, negating the performance benefit of tracking entirely.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Interpolation {{ }}',
      language: 'html',
      code: `<!-- Evaluates any expression between double curly braces -->
{{ appName }}                        <!-- variable -->
{{ 2 + 2 }}                          <!-- expression -->
{{ user?.name | uppercase }}         <!-- pipe + safe navigation -->
{{ isLoggedIn ? 'Welcome' : 'Sign in' }}  <!-- ternary -->

<!-- Signals must be called with () -->
{{ count() }}              <!-- ✓ reads signal value -->
{{ count }}                <!-- ✗ renders [object Object] -->

<!-- Common pipes in interpolation -->
{{ today | date:'mediumDate' }}
{{ price | currency:'GBP':'symbol':'1.2-2' }}
{{ ratio | percent:'1.1-1' }}
{{ profile | json }}`,
    },
    {
      label: 'Property & event binding',
      language: 'html',
      code: `<!-- Property binding: sets a JS DOM property -->
<button [disabled]="isDisabled()">Submit</button>
<img [src]="imageUrl" [width]="imageWidth()" />
<input [type]="inputType()" />

<!-- Attribute binding: use attr. prefix for pure HTML attributes -->
<td [attr.colspan]="colSpan">Cell</td>
<button [attr.aria-label]="label">Icon btn</button>

<!-- Event binding: $event = native DOM event -->
<button (click)="count.update(n => n + 1)">+</button>
<input (keyup)="onKeyup($event)" />
<input (keyup.enter)="onSubmit()" />       <!-- key combo shortcut -->
<div (mousemove)="onMouseMove($event)">hover area</div>

<!-- Class & style binding -->
<div [class.active]="isActive()"
     [class.error]="hasError()"
     [style.color]="textColor()"
     [style.fontSize.px]="fontSize()">
  Styled element
</div>`,
    },
    {
      label: 'Two-way & @let',
      language: 'html',
      code: `<!-- Two-way: [(ngModel)] requires FormsModule -->
<input [(ngModel)]="twoWayText" />
<p>Live: {{ twoWayText }}</p>

<!-- Equivalent without ngModel (signal-based): -->
<input [value]="name()"
       (input)="name.set($any($event.target).value)" />

<!-- model() signal — Angular 17.1+ (child component) -->
<!-- Parent: <app-child [(value)]="parentValue" /> -->
<!-- Child: value = model(''); -->

<!-- @let — template-local variable (Angular 18+) -->
@let fullName = user()?.firstName + ' ' + user()?.lastName;
<p>Hello, {{ fullName }}</p>

<!-- @let with async pipe — alias to avoid double subscription -->
@let data = data$ | async;
@if (data) {
  <p>{{ data.name }} — {{ data.count }} items</p>
}`,
    },
    {
      label: 'Control flow @if @for @switch',
      language: 'html',
      code: `<!-- @if — no CommonModule import needed -->
@if (isAdmin()) {
  <button>Delete</button>
} @else if (isEditor()) {
  <button>Edit</button>
} @else {
  <p>Read-only</p>
}

<!-- @for — track is REQUIRED -->
@for (item of items(); track item.id) {
  <li [class.first]="$first" [class.last]="$last">
    {{ $index + 1 }}. {{ item.name }}
    <!-- $index  $first  $last  $even  $odd  $count available -->
  </li>
} @empty {
  <li>No items yet</li>
}

<!-- @switch — uses === equality -->
@switch (status()) {
  @case ('loading') { <app-spinner /> }
  @case ('error')   { <app-error-banner /> }
  @default          { <app-content /> }
}`,
    },
    {
      label: '@defer lazy loading',
      language: 'html',
      code: `<!-- @defer splits the component into a separate JS chunk -->
<!-- The ChartComponent bundle is NOT in the initial load -->

@defer (on viewport) {
  <!-- Loaded lazily when the block enters the viewport -->
  <app-heavy-chart [data]="chartData()" />
} @placeholder {
  <!-- Shown synchronously while waiting to trigger load -->
  <div class="chart-placeholder">Chart will appear here</div>
} @loading (minimum 200ms) {
  <!-- Shown while the chunk is downloading -->
  <app-spinner />
} @error {
  <!-- Shown if the lazy chunk fails to load -->
  <p>Chart failed to load.</p>
}

<!-- Other trigger options: -->
<!-- @defer (on idle)        — after browser is idle -->
<!-- @defer (on interaction) — first click/touch/focus -->
<!-- @defer (on timer(2000)) — after 2 seconds -->
<!-- @defer (when isReady()) — when a signal/expr is truthy -->`,
    },
    {
      label: 'Template refs & safe navigation',
      language: 'html',
      code: `<!-- #ref: direct handle to element or component instance -->
<input #myInput type="text" placeholder="Type then click" />
<button (click)="refOutput.set(myInput.value)">Read</button>
<button (click)="myInput.focus()">Focus</button>
<p>Value: {{ refOutput() }}</p>

<!-- #ref on a component: accesses the component instance -->
<app-child #childRef />
<button (click)="childRef.reset()">Reset child</button>

<!-- ngForm reference: access form validity -->
<form #myForm="ngForm" (ngSubmit)="submit(myForm.value)">
  <input name="email" ngModel required type="email" />
  <button [disabled]="myForm.invalid">Send</button>
</form>

<!-- Safe navigation ?. and nullish coalescing ?? -->
{{ user()?.name ?? 'Guest' }}
{{ user()?.address?.city ?? 'No city' }}

<!-- @if is cleaner for complex null guards: -->
@if (user(); as u) {
  <p>{{ u.name }} — {{ u.address?.city ?? 'remote' }}</p>
}`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: '*ngIf + *ngFor (old) vs @if + @for (new)',
      before: `<!-- Old: CommonModule import required, verbose else template -->
<div *ngIf="isLoggedIn; else guest">Welcome back!</div>
<ng-template #guest>Please sign in</ng-template>

<li *ngFor="let item of items; let i = index; trackBy: trackFn">
  {{ i }}: {{ item.name }}
</li>`,
      after: `<!-- New: no import, no extra ng-template for else -->
@if (isLoggedIn) {
  <div>Welcome back!</div>
} @else {
  <div>Please sign in</div>
}

@for (item of items; track item.id) {
  <li>{{ $index }}: {{ item.name }}</li>
}`,
      note: '@if and @for (Angular 17+) require no imports. @for makes track mandatory and provides $index, $first, $last etc. as built-ins.',
    },
    {
      title: 'Manual subscribe vs async pipe',
      before: `// Old: manual subscribe, must unsubscribe or leak
ngOnInit() {
  this.sub = this.timer$.subscribe(v => {
    this.value = v;
  });
}
ngOnDestroy() { this.sub.unsubscribe(); }
// Template: {{ value }}`,
      after: `<!-- New: async pipe handles subscribe + unsubscribe -->
{{ timer$ | async }}
<!-- No ngOnInit, no ngOnDestroy, no leak -->`,
      note: 'The async pipe auto-unsubscribes on destroy, eliminating the subscribe/unsubscribe boilerplate and the risk of memory leaks.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Reading a signal without calling it in the template',
      wrong: `<!-- Missing () — renders [object Object] or [Signal] -->
<p>{{ count }}</p>
<button [disabled]="isDisabled">Go</button>`,
      right: `<!-- Signals are getter functions — always call with () -->
<p>{{ count() }}</p>
<button [disabled]="isDisabled()">Go</button>`,
      explanation: 'Signals are functions. Without parentheses, the template receives the signal object itself rather than its value. The output is "[object Object]" for interpolation, or a truthy function reference for property bindings — always add ().',
    },
    {
      title: 'Binding to an HTML attribute instead of a DOM property',
      wrong: `<!-- colspan is an HTML attribute, not a DOM property -->
<td [colspan]="span">Cell</td>`,
      right: `<!-- Use the attr. prefix for pure HTML attributes -->
<td [attr.colspan]="span">Cell</td>`,
      explanation: '[colspan] tries to set a DOM property that does not exist; [attr.colspan] correctly sets the HTML attribute. The same applies to aria-*, role, data-*, rowspan, and other attributes that have no matching DOM property.',
    },
    {
      title: 'Forgetting FormsModule for [(ngModel)]',
      wrong: `@Component({ imports: [] }) // FormsModule missing
export class MyComp {
  name = '';
}
// Template: <input [(ngModel)]="name" />
// Error: Can't bind to 'ngModel' since it isn't a known property`,
      right: `@Component({ imports: [FormsModule] })
export class MyComp {
  name = '';
}`,
      explanation: '[(ngModel)] is provided by FormsModule. Omitting it causes a compile-time error. In standalone components, add FormsModule to the component\'s own imports array (not AppModule).',
    },
    {
      title: 'Omitting track in @for',
      wrong: `<!-- Compile error — track is required in @for -->
@for (item of items) {
  <li>{{ item.name }}</li>
}`,
      right: `<!-- Provide a stable unique identifier -->
@for (item of items; track item.id) {
  <li>{{ item.name }}</li>
}
<!-- Last resort if no id exists: track $index (poor perf on reorder) -->`,
      explanation: '@for requires a track expression unlike the old *ngFor where trackBy was optional. Angular uses it to match DOM nodes to data items — without it, Angular cannot reuse nodes during list changes.',
    },
    {
      title: 'Calling a method that creates new references in a binding',
      wrong: `<!-- getFilteredItems() creates a new array on every CD cycle -->
<app-list [items]="getFilteredItems()"></app-list>
// If app-list is OnPush, it re-renders EVERY cycle — new reference!`,
      right: `// Use computed() to memoize — only recalculates when dependencies change
filteredItems = computed(() =>
  this.items().filter(i => i.active)
);
// Template:
<app-list [items]="filteredItems()"></app-list>`,
      explanation: 'Methods called in template bindings run on every change detection cycle. If they return new arrays/objects, child OnPush components see a new input reference every cycle and re-render unnecessarily. Use computed() signals to memoize derived collections.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the correct syntax for property binding in Angular?',
      options: ['{{ property }}', '[property]="expression"', '(property)="handler"', '#property="value"'],
      answer: 1,
      explanation: '[property]="expression" binds a DOM property to a component expression. Use it for disabled, src, value, href etc. It differs from attribute binding ([attr.X]) which targets HTML attributes that have no DOM property.',
    },
    {
      q: 'What does a template reference variable (#myRef) give you?',
      options: [
        'A CSS selector for styling the element',
        'A direct reference to the DOM element or component instance, usable in the same template',
        'A shortcut for creating a signal',
        'A link to a ViewChild query in the component class',
      ],
      answer: 1,
      explanation: 'Template reference variables (#myRef) provide a handle to the element or component. Use #input on an <input> to read input.value, or #child on a component to call child.someMethod() — all within the same template without any class involvement.',
    },
    {
      q: 'Why is track required in @for?',
      options: [
        'It is just a style recommendation — Angular works fine without it',
        'It tells Angular how to match DOM nodes to data items during list changes, enabling efficient reuse instead of full re-creation',
        'It ensures the list is sorted in ascending order',
        'It allows the list to use OnPush change detection',
      ],
      answer: 1,
      explanation: '@for enforces a track expression (unlike *ngFor where trackBy was optional). Without tracking, Angular destroys and recreates all DOM nodes on every list change. With tracking, Angular moves or reuses existing nodes — especially important for lists with animations or focused inputs.',
    },
    {
      q: 'Which syntax calls a handler when a button is clicked?',
      options: ['[click]="handler()"', '(click)="handler()"', '{{ click: handler() }}', '#click="handler"'],
      answer: 1,
      explanation: '(event)="expression" is event binding. The $event variable holds the native DOM event object. Key combos are also supported: (keyup.enter)="onSubmit()" or (keydown.escape)="onCancel()".',
    },
    {
      q: 'What does the async pipe do that a manual subscription does not?',
      options: [
        'It runs the Observable on a background thread',
        'It automatically unsubscribes when the component is destroyed, preventing memory leaks',
        'It converts the Observable to a signal',
        'It debounces emissions to prevent excessive re-renders',
      ],
      answer: 1,
      explanation: 'The async pipe subscribes to an Observable or Promise, renders the latest value, and automatically unsubscribes when the component is destroyed. Manual subscriptions require explicit unsubscription (ngOnDestroy + takeUntilDestroyed) to avoid memory leaks.',
    },
    {
      q: 'How does @defer differ from @if for conditionally showing a component?',
      options: [
        '@defer and @if behave identically — they both hide elements in the DOM',
        '@defer is equivalent to display:none; @if removes the element',
        '@defer performs code splitting — the component\'s JavaScript bundle is not loaded until the trigger condition is met; @if always includes the bundle in the initial load',
        '@defer only works with Angular Material components',
      ],
      answer: 2,
      explanation: '@if removes an element from the DOM conditionally but its component\'s bundle is always in the initial JavaScript. @defer actually splits the component into a separate lazy-loaded chunk — its JavaScript is not downloaded until the trigger fires (viewport, idle, interaction, etc.), directly reducing initial bundle size and Time to Interactive.',
    },
    {
      q: 'What is the purpose of the @let directive in Angular 18+ templates?',
      options: [
        'It declares a new signal scoped to the entire component',
        'It creates a template-local variable scoped to the current block, useful for aliasing expressions or async pipe results',
        'It replaces ngFor for local iteration',
        'It declares CSS custom properties in the template',
      ],
      answer: 1,
      explanation: '@let name = expr; declares a template-local variable scoped to the current block. Its most common uses: aliasing an async pipe result (so you can use it without the | async suffix repeatedly) and aliasing a signal call or computed expression to avoid repeated evaluation.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between [property] binding and attribute binding?',
      a: '<code>[src]="url"</code> sets the DOM <strong>property</strong> — the JavaScript object property on the element. <code>[attr.aria-label]="text"</code> sets the HTML <strong>attribute</strong> — the raw string in the HTML tag. Use property binding for standard DOM properties (<code>disabled</code>, <code>value</code>, <code>checked</code>, <code>href</code>). Use attribute binding (<code>[attr.X]</code>) for attributes that have no matching DOM property: <code>aria-*</code>, <code>colspan</code>, <code>rowspan</code>, <code>data-*</code>.',
    },
    {
      q: 'Why use the safe navigation operator (?.) in templates?',
      a: 'The <code>?.</code> operator short-circuits to <code>undefined</code> if the left side is <code>null</code> or <code>undefined</code>, preventing "Cannot read property X of null" template errors. It\'s especially useful for async data that arrives after the component renders: <code>{{ user()?.address?.city ?? \'No city\' }}</code> renders "No city" while the user is loading, then switches to the real city once it arrives. For complex guards, <code>@if (user(); as u)</code> is cleaner.',
    },
    {
      q: 'What does the async pipe do?',
      a: 'The async pipe subscribes to an Observable or Promise and returns its latest emitted value. It also <strong>auto-unsubscribes</strong> when the component is destroyed, preventing memory leaks. This replaces the boilerplate of: <code>ngOnInit() { this.sub = obs$.subscribe(v => this.val = v); }</code> + <code>ngOnDestroy() { this.sub.unsubscribe(); }</code>. In templates: <code>{{ data$ | async }}</code> or <code>@let data = data$ | async; @if (data) { ... }</code>.',
    },
    {
      q: 'Can I mix @if and *ngIf in the same template?',
      a: 'Yes, technically — but avoid mixing them. <code>@if</code> is the Angular 17+ built-in block syntax that requires no imports. <code>*ngIf</code> is the old structural directive from <code>CommonModule</code>. The key practical difference: <code>@if</code> supports <code>@else if</code> chains natively (old syntax needed multiple <code>*ngIf</code> + <code>*ngIf; else</code> with <code>ng-template</code>). Prefer <code>@if</code> for all new code.',
    },
    {
      q: 'How does two-way binding [(ngModel)] work under the hood?',
      a: 'It is syntactic sugar combining two bindings: <code>[ngModel]="value"</code> (property binding — passes data from class to input) and <code>(ngModelChange)="value=$event"</code> (event binding — updates the class field when the input fires a change event). Angular expands <code>[(x)]</code> into <code>[x] (xChange)</code> for any component that emits an <code>xChange</code> event output. Requires <code>FormsModule</code>. Modern alternative: <code>model()</code> signal.',
    },
    {
      q: 'What is a template reference variable (#ref) and how does it differ from ViewChild?',
      a: '<code>#ref</code> is a template-local variable that gives you a handle to an element or component instance <em>within the template</em>. It is useful for direct DOM manipulation inside event handlers (<code>(click)="myInput.focus()"</code>) or accessing child component methods. <code>@ViewChild(\'ref\')</code> / <code>viewChild(\'ref\')</code> exposes the same reference to the <em>component class</em> (TypeScript), where you can call methods from lifecycle hooks or signals. Both refer to the same element — they just differ in where the reference is used.',
    },
    {
      q: 'What is @defer and when should you use it?',
      a: '<code>@defer</code> lazily loads a template block <em>and all its component/pipe/directive dependencies</em> as a separate JavaScript chunk that is not included in the initial bundle. Use it for:<ul><li>Heavy third-party components (charts, code editors, video players) that are below the fold</li><li>Features only some users access (admin panels, settings pages within a route)</li><li>Anything that adds significantly to initial bundle size and is not needed for First Contentful Paint</li></ul>Triggers: <code>on viewport</code> (element enters viewport), <code>on idle</code> (browser idle), <code>on interaction</code> (first click/touch), <code>when signal()</code> (condition becomes truthy). Always provide a <code>@placeholder</code> so layout does not shift.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Angular\'s template language uses interpolation (<code>{{ }}</code>), property binding (<code>[]</code>), event binding (<code>()</code>), and two-way binding (<code>[()]</code>) to connect component state to the DOM; Angular 17+ built-in control flow (@if, @for, @switch, @defer) replaces structural directives with no-import, higher-performance alternatives.',
    mustKnow: [
      'Signals must be called with <code>()</code> in templates — <code>{{ count() }}</code>, not <code>{{ count }}</code>',
      '<code>[property]</code> sets DOM properties; <code>[attr.X]</code> sets HTML attributes — use <code>attr.</code> for <code>aria-*</code>, <code>colspan</code>, <code>data-*</code>',
      '<code>track</code> is required in <code>@for</code>; use a unique stable field like <code>item.id</code> (not <code>$index</code> for reorderable lists)',
      '<code>@defer</code> code-splits its dependencies into a separate lazy chunk — the only template feature that actually reduces initial bundle size',
      'The <code>async</code> pipe auto-subscribes and auto-unsubscribes — eliminates manual subscription boilerplate and memory leak risk',
      '<code>@let</code> (Angular 18+) declares a template-local variable — alias async pipe results and signal calls to avoid repeated evaluation',
      '<code>[(ngModel)]</code> requires <code>FormsModule</code>; for signal-based state prefer <code>[value] + (input)</code> or <code>model()</code> signal',
    ],
    interviewFocus: [
      'What is the difference between [property] binding and [attr.X] attribute binding — and when do you need attr.?',
      'Why is track required in @for and what are the performance consequences of using $index?',
      'How does @defer differ from @if — what does "code splitting" mean in this context?',
      'What does the async pipe do that a manual subscription does not?',
      'What happens if you forget to call a signal with () in a template?',
    ],
  };

  challenge: Challenge = {
    title: 'All-Binding Card Component',
    language: 'html',
    description: 'Write a template that demonstrates all four binding types together: interpolation to show a username signal, property binding to disable a submit button when the input is empty, event binding to update the signal on input, and two-way binding with ngModel for a separate note field. Also add a @for loop to display a list of submitted names, and use @defer to lazy-load a hypothetical HeavyChartComponent.',
    hints: [
      'Use {{ name() }} for interpolation — call the signal with ()',
      '[disabled]="!name()" disables the button when name() is falsy',
      '(input)="name.set($any($event.target).value)" updates the signal on every keystroke',
      '[(ngModel)]="note" needs FormsModule imported in the component',
    ],
    starterCode: `<!-- TODO: Interpolate username signal -->
<!-- TODO: Bind [disabled] to a condition on the signal -->
<!-- TODO: Bind (input) to update the signal -->
<!-- TODO: Use [(ngModel)] for two-way text binding -->
<!-- TODO: @for to show list of names with track -->
<!-- TODO: @defer to lazy-load <app-heavy-chart /> on viewport -->`,
    solution: `<div class="card">
  <h3>Hello, {{ name() || 'Stranger' }}!</h3>

  <!-- Event binding + property binding -->
  <input [placeholder]="placeholder()"
         (input)="name.set($any($event.target).value)" />
  <button [disabled]="!name()" (click)="submit()">Submit</button>

  <!-- Two-way binding (needs FormsModule) -->
  <textarea [(ngModel)]="note" placeholder="Add a note"></textarea>

  <!-- Control flow + tracking -->
  @for (n of submitted(); track n) {
    <p>— {{ n }}</p>
  } @empty {
    <p>No names submitted yet</p>
  }

  <!-- Defer: lazy-loads HeavyChartComponent on viewport -->
  @defer (on viewport) {
    <app-heavy-chart />
  } @placeholder {
    <div class="chart-skeleton">Chart loading soon…</div>
  }
</div>`,
  };
}
