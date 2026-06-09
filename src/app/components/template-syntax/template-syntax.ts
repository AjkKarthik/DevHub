import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

@Component({
  selector: 'app-template-syntax',
  imports: [FormsModule, AsyncPipe, JsonPipe, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './template-syntax.html',
  styleUrl: './template-syntax.scss',
})
export class TemplateSyntax {
  // Interpolation
  appName  = signal('Angular 22');
  greeting = signal('Hello');
  count    = signal(0);
  expression = computed(() => `${this.greeting()} from ${this.appName()}! Count: ${this.count()}`);

  // Property binding
  isDisabled  = signal(false);
  isChecked   = signal(false);
  imageWidth  = signal(120);
  inputType   = signal<'text' | 'password'>('text');

  // Event binding
  lastEvent   = signal('None');
  keyLog      = signal<string[]>([]);
  mousePos    = signal({ x: 0, y: 0 });

  onMouseMove(e: MouseEvent) {
    this.mousePos.set({ x: e.offsetX, y: e.offsetY });
  }
  onKeyup(e: KeyboardEvent) {
    this.keyLog.update(log => [`"${e.key}" pressed`, ...log].slice(0, 5));
  }

  // Two-way binding
  twoWayText  = '';
  twoWayColor = '#dd0031';

  // Template reference variable
  refOutput   = signal('');

  // Class & style binding
  isActive    = signal(false);
  isHighlight = signal(false);
  fontSize    = signal(16);
  textColor   = signal('#1a1a1a');

  // Safe navigation & nullish coalescing
  user = signal<{ name: string; address?: { city: string } } | null>(null);

  toggleUser() {
    this.user.update(u =>
      u ? null : { name: 'Karthik', address: { city: 'Hyderabad' } }
    );
  }

  // Pipes
  today       = new Date();
  price       = 1984.5;
  ratio       = 0.742;
  sentence    = 'the quick brown fox jumps over the lazy dog';
  profile     = { name: 'Angular', version: 22, features: ['Signals', 'SSR', 'Material'] };
  fruits      = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
  sliceStart  = signal(0);
  sliceEnd    = signal(3);

  // Async pipe — live timer Observable
  timer$      = interval(1000).pipe(map(n => n));

  theory: TheoryPoint[] = [
  {
    heading: 'Interpolation & binding types',
    points: [
      'Interpolation <code>{{ expr }}</code>: evaluates an expression and inserts the string result into the DOM.',
      'Property binding <code>[property]="expr"</code>: sets a DOM property (not attribute) from a TypeScript expression.',
      'Event binding <code>(event)="handler($event)"</code>: listens to a DOM event and calls a method.',
      'Two-way binding <code>[(ngModel)]="prop"</code>: shorthand for <code>[ngModel]="prop" (ngModelChange)="prop=$event"</code>.',
    ],
  },
  {
    heading: 'Template references & safe navigation',
    points: [
      'Template reference <code>#ref</code>: a variable pointing to a DOM element or component instance.',
      'Access via <code>viewChild(\'ref\')</code> in the class or directly in the template for same-template use.',
      'Safe navigation operator <code>user?.address?.city</code>: short-circuits on null/undefined instead of throwing.',
      'Non-null assertion <code>user!.name</code>: tells TypeScript the value is non-null — does not affect runtime.',
    ],
  },
  {
    heading: 'Control flow (@if, @for, @switch)',
    points: [
      '<code>@if (cond) { } @else { }</code>: Angular 17+ built-in block. Faster than <code>*ngIf</code>, no import needed.',
      '<code>@for (item of list; track item.id) { }</code>: <code>track</code> is required and is the key for reconciliation.',
      'Use <code>$index</code>, <code>$first</code>, <code>$last</code>, <code>$even</code>, <code>$odd</code> as implicit variables inside <code>@for</code>.',
      '<code>@switch (val) { @case (x) { } @default { } }</code>: replaces <code>ngSwitch</code> — no import, no extra directive.',
    ],
  },
  {
    heading: 'Key points to remember',
    points: [
      'Property binding sets the DOM <strong>property</strong> — use attribute binding <code>[attr.colspan]</code> for HTML attributes that have no DOM property.',
      'Event bindings do not require <code>this.</code> — Angular template context is the component instance.',
      'Avoid complex logic in templates — extract to computed signals or methods for testability.',
      'The <code>async</code> pipe subscribes to an Observable and unwraps its value — it auto-unsubscribes on destroy.',
    ],
  },
];

  qna: QnaItem[] = [
    { q: 'What is the difference between [property] binding and attribute binding?', a: '<code>[src]="url"</code> sets the DOM <strong>property</strong>. <code>[attr.aria-label]="text"</code> sets the HTML <strong>attribute</strong>. Use attribute binding for aria-*, colspan, and other attributes that have no matching DOM property.' },
    { q: 'Why use the safe navigation operator ?.?', a: 'The <code>?.</code> operator short-circuits to <code>undefined</code> if the left side is null/undefined — preventing "Cannot read property of null" template errors. Useful when data is async and not yet loaded.' },
    { q: 'What does the async pipe do?', a: 'The async pipe subscribes to an Observable or Promise and returns its latest value. It also <strong>auto-unsubscribes</strong> when the component is destroyed, preventing memory leaks. Use it instead of manual subscriptions in templates.' },
    { q: 'Can I use @if and *ngIf in the same template?', a: 'Yes, but avoid mixing them. <code>@if</code> is the new built-in block syntax (Angular 17+). <code>*ngIf</code> is the old structural directive from <code>CommonModule</code>. Prefer <code>@if</code> for new code — no import needed.' },
    { q: 'How does two-way binding [(ngModel)] work?', a: 'It combines <code>[ngModel]="value"</code> (property binding) and <code>(ngModelChange)="value=$event"</code> (event binding) into a single shorthand. Requires <code>FormsModule</code>. Modern equivalent: use <code>model()</code> signal with <code>[(modelProp)]</code>.' },
    { q: 'What is a template reference variable (#ref)?', a: 'A template reference variable gives you a direct handle to a DOM element or component instance in the template. <code>#email</code> on an input lets you use <code>email.value</code> elsewhere. In code, use <code>viewChild(\'email\')</code> to access it.' },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Interpolation {{ }}',
      language: 'html',
      code: `<!-- Evaluates any expression between double curly braces -->
{{ appName }}                        <!-- variable -->
{{ 2 + 2 }}                          <!-- expression -->
{{ user?.name | uppercase }}         <!-- pipe + safe navigation -->
{{ isLoggedIn ? 'Welcome' : 'Sign in' }}  <!-- ternary -->`,
    },
    {
      label: 'Property binding [ ]',
      language: 'html',
      code: `<!-- Binds a TypeScript expression to a DOM property -->
<!-- Note: [] binds to a PROPERTY (JS), not an ATTRIBUTE (HTML) -->

<button [disabled]="isDisabled">Submit</button>
<img [src]="imageUrl" [width]="imageWidth" />
<input [type]="inputType" />

<!-- Class & style binding -->
<div [class.active]="isActive">Toggleable</div>
<p [style.color]="textColor" [style.fontSize.px]="fontSize">Styled</p>

<!-- Attribute binding (use attr. prefix for HTML attributes, not DOM props) -->
<td [attr.colspan]="colSpan">Cell</td>`,
    },
    {
      label: 'Event binding ( )',
      language: 'html',
      code: `<!-- Listens for a DOM event; $event = the native event object -->

<button (click)="count.update(n => n + 1)">Clicked {{ count() }} times</button>

<input (keyup)="onKeyup($event)" />          <!-- keyup event -->
<input (keyup.enter)="onEnter($event)" />    <!-- specific key shortcut -->
<form (ngSubmit)="onSubmit()">...</form>     <!-- form submit -->
<div (mousemove)="onMouseMove($event)">     <!-- mouse tracking -->`,
    },
    {
      label: 'Two-way binding [( )]',
      language: 'html',
      code: `<!-- [(ngModel)] = shorthand for [ngModel] + (ngModelChange) -->
<!-- Needs: FormsModule in component imports -->

<input [(ngModel)]="twoWayText" />
<p>You typed: {{ twoWayText }}</p>

<!-- Under the hood, this is equivalent to: -->
<input [ngModel]="twoWayText" (ngModelChange)="twoWayText = $event" />

<!-- With signals, prefer a getter/setter approach: -->
<input [value]="mySignal()" (input)="mySignal.set($any($event.target).value)" />`,
    },
    {
      label: 'Template ref variables #',
      language: 'html',
      code: `<!-- #ref gives you a direct reference to the DOM element or component -->

<input #myInput type="text" placeholder="Type something" />
<button (click)="output = myInput.value">Read value</button>
<p>Value: {{ output }}</p>

<!-- Reference to a component instance -->
<app-child #childRef />
<button (click)="childRef.someMethod()">Call child method</button>

<!-- Reference to ngForm (template-driven forms) -->
<form #myForm="ngForm" (ngSubmit)="submit(myForm)">
  <button [disabled]="myForm.invalid">Submit</button>
</form>`,
    },
    {
      label: 'Safe navigation & Nullish',
      language: 'html',
      code: `<!-- ?. — safe navigation: stops if null/undefined, no error -->
{{ user?.name }}
{{ user?.address?.city }}

<!-- ?? — nullish coalescing: fallback if null/undefined -->
{{ user?.address?.city ?? 'City not set' }}

<!-- In TypeScript (component class): -->
const city = this.user()?.address?.city ?? 'Unknown';

<!-- @if is cleaner for complex cases: -->
@if (user) {
  <p>{{ user.address?.city ?? 'No city' }}</p>
} @else {
  <p>Not logged in</p>
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What is the syntax for property binding in Angular?', options: ['{{ property }}', '[property]="expression"', '(property)="handler"', '#property="value"'], answer: 1, explanation: '[property]="expression" binds a DOM property to a component expression. Use it for disabled, src, value, href etc.' },
    { q: 'What does #myRef in a template do?', options: ['Marks an element for styling', 'Creates a template reference variable pointing to the element/component', 'Declares a signal', 'Adds a CSS class'], answer: 1, explanation: 'Template reference variables let you reference DOM elements or components directly: <input #nameInput> then (click)="log(nameInput.value)".' },
    { q: 'What is the @if block replacing?', options: ['ngSwitch', '*ngIf structural directive', 'ngFor', '*ngClass'], answer: 1, explanation: '@if is the Angular 17+ built-in control flow replacing *ngIf. It\'s faster (no extra DOM node) and supports @else if / @else branches.' },
    { q: 'Which syntax calls a method on an event?', options: ['[click]="handler()"', '(click)="handler()"', '{{click: handler()}}', '#click="handler"'], answer: 1, explanation: '(event)="expression" is event binding. The $event variable holds the DOM event object: (click)="log($event)".' },
    { q: 'What does [(ngModel)] require?', options: ['ReactiveFormsModule in imports', 'FormsModule in the component\'s imports', 'NgModelModule', 'No extra imports'], answer: 1, explanation: 'Two-way [(ngModel)] binding requires FormsModule. Without it you\'ll get "Can\'t bind to ngModel" errors at compile time.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: '{{ expression }}', type: 'operator', desc: 'Interpolation — evaluates a TypeScript expression and renders its string value into the DOM.', since: '2' },
    { name: '[property]', type: 'operator', desc: 'Property binding — sets a DOM property from a component expression; targets JS properties, not HTML attributes.', since: '2' },
    { name: '(event)', type: 'operator', desc: 'Event binding — listens to a DOM event and invokes an expression; $event holds the native event object.', since: '2' },
    { name: '[(ngModel)]', type: 'directive', desc: 'Two-way binding shorthand combining [ngModel] property binding and (ngModelChange) event binding; requires FormsModule.', since: '2' },
    { name: '@if / @else', type: 'directive', desc: 'Built-in control flow block replacing *ngIf — no import needed, supports @else if and @else branches.', since: '17' },
    { name: '@for / track', type: 'directive', desc: 'Built-in iteration block replacing *ngFor; track expression is required and drives DOM reconciliation.', since: '17' },
    { name: '@switch / @case', type: 'directive', desc: 'Built-in switch block replacing ngSwitch — no import, no extra directive, direct value matching.', since: '17' },
    { name: '#templateRef', type: 'operator', desc: 'Template reference variable — provides a direct handle to a DOM element or component instance within the template.', since: '2' },
    { name: '?.', type: 'operator', desc: 'Safe navigation operator — short-circuits to undefined on null/undefined, preventing \'Cannot read property\' errors in templates.', since: '2' },
    { name: 'async', type: 'pipe', desc: 'Subscribes to an Observable or Promise, renders the latest value, and auto-unsubscribes on component destroy.', since: '2' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: '*ngIf (old) vs @if (new)',
      before: `<!-- Old: structural directive, needs CommonModule -->
<div *ngIf='isLoggedIn; else guest'>
  Welcome back!
</div>
<ng-template #guest>Please sign in</ng-template>`,
      after: `<!-- New: built-in block, no import needed -->
@if (isLoggedIn) {
  <div>Welcome back!</div>
} @else {
  <div>Please sign in</div>
}`,
      note: '@if is available from Angular 17 and requires no imports. It also avoids the extra <ng-template> for else branches.',
    },
    {
      title: '*ngFor (old) vs @for (new)',
      before: `<!-- Old: no track required, easy to forget -->
<li *ngFor='let item of items; let i = index'>
  {{ i }}: {{ item.name }}
</li>`,
      after: `<!-- New: track is mandatory -->
@for (item of items; track item.id) {
  <li>{{ $index }}: {{ item.name }}</li>
}`,
      note: '@for enforces a track expression (like React key), improving reconciliation performance. Built-in variables $index, $first, $last, $even, $odd are always available.',
    },
    {
      title: 'Manual subscription (old) vs async pipe (new)',
      before: `// Old: manual subscribe, must unsubscribe
ngOnInit() {
  this.sub = this.timer$.subscribe(
    v => this.value = v
  );
}
ngOnDestroy() { this.sub.unsubscribe(); }`,
      after: `<!-- New: async pipe handles subscribe + unsubscribe -->
<span>{{ timer$ | async }}</span>`,
      note: 'The async pipe auto-unsubscribes on destroy, eliminating boilerplate and preventing memory leaks.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Binding to an HTML attribute instead of a DOM property',
      wrong: `<!-- colspan is an HTML attribute, not a DOM property -->
<td [colspan]='span'>Cell</td>`,
      right: `<!-- Use the attr. prefix for pure HTML attributes -->
<td [attr.colspan]='span'>Cell</td>`,
      explanation: '[colspan] tries to set a DOM property that does not exist; [attr.colspan] correctly sets the HTML attribute. The same applies to aria-* and other non-property attributes.',
    },
    {
      title: 'Forgetting FormsModule for [(ngModel)]',
      wrong: `// Component without FormsModule
@Component({ imports: [CommonModule] })
export class MyComp {
  name = '';
}`,
      right: `// Add FormsModule to the component imports
@Component({ imports: [FormsModule] })
export class MyComp {
  name = '';
}`,
      explanation: '[(ngModel)] is provided by FormsModule. Omitting it causes a compile-time error: \'Can\'t bind to ngModel since it isn\'t a known property\'.',
    },
    {
      title: 'Omitting track in @for',
      wrong: `<!-- track is required in @for -->
@for (item of items) {
  <li>{{ item.name }}</li>
}`,
      right: `<!-- Always provide a unique track expression -->
@for (item of items; track item.id) {
  <li>{{ item.name }}</li>
}`,
      explanation: '@for requires a track expression (unlike *ngFor where trackBy was optional). Angular uses it to efficiently reconcile DOM nodes when the list changes.',
    },
    {
      title: 'Calling a signal without parentheses in a template',
      wrong: `<!-- Missing () — renders [object Object] -->
<p>{{ mySignal }}</p>
<button [disabled]='isDisabled'>Go</button>`,
      right: `<!-- Signals are functions; call them with () -->
<p>{{ mySignal() }}</p>
<button [disabled]='isDisabled()'>Go</button>`,
      explanation: 'Signals are getter functions. Without the parentheses the template receives the signal object itself instead of its value, producing unexpected output or type errors.',
    },
  ];

  versionItems: VersionInfo[] = [
    {
      version: '17',
      label: 'Built-in control flow blocks',
      features: [
        '@if / @else if / @else replaces *ngIf — no CommonModule import required',
        '@for with mandatory track replaces *ngFor — built-in $index, $first, $last, $even, $odd variables',
        '@switch / @case / @default replaces ngSwitch — no extra directives needed',
        '@defer enables lazy template loading with @placeholder, @loading, and @error blocks',
      ],
    },
    {
      version: '16',
      label: 'Signals in templates',
      features: [
        'signal() creates reactive state; read with signal() call syntax in templates',
        'computed() derives reactive values automatically tracked by Angular\'s change detection',
        'effect() runs side-effects when signal values change',
        'Templates skip zone.js dirty-checking when signal-based; change detection is fine-grained',
      ],
    },
  ];

  challenge: Challenge = {
    title: 'All-Binding Card Component',
    description: 'Write a template snippet demonstrating interpolation, property binding, event binding, and two-way binding together in one card.',
    language: 'html',
    hints: [
      '{{ expr }} for interpolation',
      '[disabled]="condition" for property binding',
      '(click)="handler()" for event binding',
      '[(ngModel)]="field" for two-way binding (needs FormsModule)'
    ],
    starterCode: `<!-- TODO: show username via interpolation -->
<!-- TODO: bind [placeholder] to a signal -->
<!-- TODO: bind (input) to update a signal -->
<!-- TODO: use [(ngModel)] for two-way text binding -->
<!-- TODO: disable a button when input is empty -->`,
    solution: `<div class="card">
  <h3>Hello, {{ username() }}!</h3>

  <!-- Property binding -->
  <input [placeholder]="placeholder()" (input)="onInput($event)" />

  <!-- Two-way binding -->
  <input [(ngModel)]="username" />

  <!-- Event + property binding together -->
  <button [disabled]="!username()" (click)="save()">
    Save
  </button>
</div>`,
  };
}
