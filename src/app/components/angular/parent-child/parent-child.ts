import { Component, signal, computed, viewChild, viewChildren, effect } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { ChildCardComponent } from './child-card/child-card';
import { ModelCounterComponent } from './model-counter/model-counter';
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

@Component({
  selector: 'app-parent-child',
  imports: [JsonPipe, ReactiveFormsModule, ChildCardComponent, ModelCounterComponent, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './parent-child.html',
  styleUrl: './parent-child.scss',
})
export class ParentChildComponent {
  // ── Basic Input / Output demo ──────────────────────────────────────────────
  colorControl = new FormControl('#4f6ef7');
  labelControl = new FormControl('Hello from parent!');
  clickLog = signal<string[]>([]);

  onChildClicked(cardTitle: string) {
    this.clickLog.update(log =>
      [`Child "${cardTitle}" was clicked`, ...log].slice(0, 6)
    );
  }

  cards = [
    { title: 'Card Alpha', description: 'A child component receiving inputs' },
    { title: 'Card Beta',  description: 'Each card is the same component' },
    { title: 'Card Gamma', description: 'Outputs bubble events to the parent' },
  ];

  // ── model() two-way binding demo ───────────────────────────────────────────
  parentQty  = signal(3);
  parentQty2 = signal(3);

  resetQty()   { this.parentQty.set(0); }
  setQty10()   { this.parentQty.set(10); }

  // ── viewChild() demo ───────────────────────────────────────────────────────
  // Query the ModelCounterComponent rendered with #counterRef
  counterRef = viewChild<ModelCounterComponent>('counterRef');
  // Query ALL ModelCounterComponent instances on this page
  allCounters = viewChildren(ModelCounterComponent);

  // Derive a computed to display child count via viewChild
  childCountValue = computed(() => this.counterRef()?.count() ?? '–');
  allCounterValues = computed(() =>
    this.allCounters().map(c => c.count())
  );

  // Effect that logs when counterRef changes
  watchLog = signal<string[]>([]);
  constructor() {
    effect(() => {
      const v = this.counterRef()?.count();
      if (v !== undefined) {
        this.watchLog.update(l =>
          [`counterRef().count() = ${v}`, ...l].slice(0, 5)
        );
      }
    });
  }

  // ── Code Tabs ─────────────────────────────────────────────────────────────
  theory: TheoryPoint[] = [
    {
      heading: 'input() — modern @Input replacement',
      points: [
        'input<T>() declares a required or optional input as a read-only signal inside the child component.',
        'input.required<T>() enforces that the parent MUST pass a value — compile error if missing.',
        'Read the value like any signal: this.name() — no need for ngOnChanges to react to changes.',
        'input() integrates with withComponentInputBinding() to auto-map route params to inputs.',
      ],
    },
    {
      heading: 'output() — modern @Output replacement',
      points: [
        'output<T>() creates an EventEmitter-like output without requiring RxJS Subject underneath.',
        'Emit with outputRef.emit(value) — identical API to the old EventEmitter.emit().',
        'Parent binds with (outputName)="handler($event)" — same template syntax as before.',
        'model() = input() + output() combined — creates a two-way binding shorthand like [(ngModel)].',
      ],
    },
    {
      heading: 'viewChild() — modern @ViewChild replacement',
      points: [
        'viewChild<T>(\'refName\') returns a Signal<T | undefined> — no need for ngAfterViewInit.',
        'viewChild.required<T>(\'refName\') asserts the element is always present — Signal<T> (no undefined).',
        'Read inside effect() or computed() — Angular automatically tracks the DOM reference.',
        'For multiple elements use viewChildren() which returns Signal<readonly T[]>.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'input() is read-only — child cannot .set() it. Use a local signal and sync with effect() if needed.',
        'Prefer output() over EventEmitter for new code — it has better type inference.',
        'model() requires the parent to use [(prop)] two-way binding syntax.',
        'Signal inputs react to changes automatically — no ngOnChanges hook needed for most use cases.',
      ],
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between input() and @Input()?', a: '<code>input()</code> returns a <strong>Signal</strong> — you read it with <code>this.name()</code> and it reacts to changes without <code>ngOnChanges</code>. <code>@Input()</code> is a plain property — no signal, requires <code>ngOnChanges</code> to react. Prefer <code>input()</code> for new code.' },
    { q: 'What is model() and when would you use it?', a: '<code>model()</code> creates a two-way binding shorthand. The parent uses <code>[(childProp)]="value"</code>. The child reads <code>this.childProp()</code> and calls <code>this.childProp.set(newVal)</code> to emit back. Replaces the <code>@Input + @Output(\'propChange\')</code> pattern.' },
    { q: 'How do you emit events from a child to a parent?', a: 'Declare <code>myEvent = output<string>()</code> in the child. Emit with <code>this.myEvent.emit(\'data\')</code>. Parent binds with <code>(myEvent)="handler($event)"</code>. For two-way: use <code>model()</code> instead.' },
    { q: 'Can a parent read child state without an event?', a: 'Yes — via <code>viewChild(MyChildComponent)</code>. The parent gets a Signal of the child instance and can read its public signals/properties. Alternatively, lift state to a shared service.' },
    { q: 'What is withComponentInputBinding() used for?', a: 'It makes Angular automatically map route params, query params, and resolver data to <code>input()</code> signals on the routed component — no <code>ActivatedRoute.snapshot</code> needed. Registered with <code>provideRouter(routes, withComponentInputBinding())</code>.' },
    { q: 'Can input() have a default value?', a: 'Yes: <code>input(\'default\')</code> returns a non-required input with "default" as the initial value. <code>input.required()</code> has no default — the parent must pass a value or TypeScript will error at compile time.' },
  ];

  ioTabs: CodeTab[] = [
    {
      label: 'input() / output() — child',
      language: 'typescript',
      code: `// CHILD COMPONENT
import { Component, input, output } from '@angular/core';

export class ChildCardComponent {
  title       = input.required<string>(); // required — compile error if missing
  description = input.required<string>();
  accentColor = input('#4f6ef7');         // optional with default
  label       = input('Click me');

  cardClicked = output<string>();         // no EventEmitter needed

  onClick() {
    this.cardClicked.emit(this.title());
  }
}`,
    },
    {
      label: 'Parent template binding',
      language: 'html',
      code: `<!-- Bind DOWN with [inputName]="value" -->
<!-- Listen UP  with (outputName)="handler($event)" -->

@for (card of cards; track card.title) {
  <app-child-card
    [title]="card.title"
    [description]="card.description"
    [accentColor]="colorControl.value!"
    [label]="labelControl.value!"
    (cardClicked)="onChildClicked($event)"
  />
}`,
    },
    {
      label: 'vs @Input() / @Output() (old way)',
      language: 'typescript',
      code: `// OLD — decorator-based (still works, avoid for new code)
export class OldChildCard {
  @Input() title!: string;
  @Output() cardClicked = new EventEmitter<string>();
  onClick() { this.cardClicked.emit(this.title); }
}

// NEW — signal-based (Angular 17+, preferred)
export class NewChildCard {
  title       = input.required<string>(); // is a signal → title()
  cardClicked = output<string>();
  onClick() { this.cardClicked.emit(this.title()); }
}`,
    },
  ];

  modelTabs: CodeTab[] = [
    {
      label: 'model() — child component',
      language: 'typescript',
      code: `// CHILD — model() creates a two-way bindable signal
import { Component, model } from '@angular/core';

export class ModelCounterComponent {
  // model() = writable input + built-in "countChange" output
  count = model(0);  // default 0

  increment() { this.count.update(v => v + 1); }
  decrement() { this.count.update(v => Math.max(0, v - 1)); }
}`,
    },
    {
      label: 'model() — parent template',
      language: 'html',
      code: `<!-- PARENT TEMPLATE -->
<!-- [(count)]="parentQty" is short for: -->
<!--   [count]="parentQty()" (countChange)="parentQty.set($event)" -->

<app-model-counter [(count)]="parentQty" />

<p>Parent sees: {{ parentQty() }}</p>
<button (click)="parentQty.set(0)">Reset from Parent</button>
<button (click)="parentQty.set(10)">Set 10 from Parent</button>

<!-- Two components sharing same signal -->
<app-model-counter [(count)]="parentQty" />
<app-model-counter [(count)]="parentQty" />
<!-- Both sync to the same parentQty — changing one updates both -->`,
    },
  ];

  viewChildTabs: CodeTab[] = [
    {
      label: 'viewChild() — parent TS',
      language: 'typescript',
      code: `import { viewChild, viewChildren, computed, effect } from '@angular/core';
import { ModelCounterComponent } from './model-counter';

export class ParentComponent {
  // Query ONE child by template ref variable #counterRef
  counterRef = viewChild<ModelCounterComponent>('counterRef');

  // Query ALL instances of a component type
  allCounters = viewChildren(ModelCounterComponent);

  // Read child's public signal inside computed()
  childValue = computed(() => this.counterRef()?.count() ?? '–');

  constructor() {
    // React to child signal changes inside effect()
    effect(() => {
      console.log('child count =', this.counterRef()?.count());
    });
  }
}`,
    },
    {
      label: 'viewChild() — parent template',
      language: 'html',
      code: `<!-- Add #counterRef to identify which child to query -->
<app-model-counter #counterRef [(count)]="parentQty" />

<!-- Parent can now read child state via the signal -->
<p>Parent reads child via viewChild: {{ childValue() }}</p>

<!-- viewChildren() returns all instances -->
@for (val of allCounterValues(); track $index) {
  <span>Counter {{ $index + 1 }}: {{ val }}</span>
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What is the Angular 22 replacement for @Input()?', options: ['@Prop()', 'input()', 'signal()', '@Bind()'], answer: 1, explanation: 'input() returns a signal-based InputSignal. It\'s readonly and reactive — parent changes are reflected automatically without change detection tricks.' },
    { q: 'What does model() create?', options: ['A read-only computed signal', 'A two-way bindable signal (input + output combined)', 'A writable signal not linked to parent', 'An event emitter'], answer: 1, explanation: 'model() is a ModelSignal that combines an input with an automatic outputChange event. Use [(modelProp)] in the parent for two-way binding.' },
    { q: 'How does output() differ from EventEmitter?', options: ['output() is synchronous only', 'output() is the modern signal-era API — no Observable subscription, just .emit()', 'EventEmitter is deprecated', 'output() requires Zone.js'], answer: 1, explanation: 'output() returns an OutputEmitterRef. You call .emit(value) and Angular delivers it to the parent binding without needing RxJS or zone triggers.' },
    { q: 'What does viewChild(\'#ref\') return?', options: ['The first matching DOM element', 'A Signal<T | undefined> resolving after view init', 'A Promise<T>', 'An Observable<T>'], answer: 1, explanation: 'viewChild() returns a signal. It\'s undefined until ngAfterViewInit, then holds the queried element or component reference.' },
    { q: 'When using input(), when can you read the value?', options: ['In the constructor', 'After ngOnChanges', 'Anywhere — it\'s a signal, always available', 'Only in ngOnInit'], answer: 2, explanation: 'Because input() is a signal, you can call it () anywhere — constructor, computed, template. Angular tracks the dependency automatically.' },
  ];

  challenge: Challenge = {
    title: 'QuantitySelector with model()',
    description: 'Build a QuantitySelector child component that uses model() for two-way binding of a quantity number. The parent should be able to read and set the quantity.',
    language: 'typescript',
    hints: [
      'Use model(1) to create a model signal with initial value 1',
      'In the template: [(quantity)]="parentQty" binds two-way',
      'Call quantity.update(n => n + 1) inside the component to increment',
      'The parent\'s signal updates automatically when the child calls update()'
    ],
    starterCode: `import { Component, model } from '@angular/core';

@Component({
  selector: 'app-qty-selector',
  standalone: true,
  template: \`
    <button (click)="dec()">−</button>
    <span>{{ quantity() }}</span>
    <button (click)="inc()">+</button>
  \`,
})
export class QtySelectorComponent {
  // TODO: define quantity as a model signal
  dec() { /* TODO */ }
  inc() { /* TODO */ }
}`,
    solution: `import { Component, model } from '@angular/core';

@Component({
  selector: 'app-qty-selector',
  standalone: true,
  template: \`
    <button (click)="dec()">−</button>
    <span>{{ quantity() }}</span>
    <button (click)="inc()">+</button>
  \`,
})
export class QtySelectorComponent {
  quantity = model(1);
  dec() { this.quantity.update(n => Math.max(0, n - 1)); }
  inc() { this.quantity.update(n => n + 1); }
}

// Parent usage:
// <app-qty-selector [(quantity)]="parentQty" />`,
  };

  quickRef: QuickRefItem[] = [
    { name: 'input()', type: 'function', desc: 'Declares a signal-based component input; replaces @Input() decorator, returning a read-only InputSignal<T>.' , since: '17'},
    { name: 'input.required()', type: 'function', desc: 'Declares a required signal input — TypeScript compile error if the parent omits it.' , since: '17'},
    { name: 'output()', type: 'function', desc: 'Creates a type-safe component output emitter without needing EventEmitter or RxJS.' , since: '17'},
    { name: 'model()', type: 'function', desc: 'Creates a two-way bindable ModelSignal combining an input signal and an auto-generated change output.' , since: '17'},
    { name: 'viewChild()', type: 'function', desc: 'Queries a single child element or component and returns a Signal<T | undefined>, replacing @ViewChild.' , since: '17'},
    { name: 'viewChildren()', type: 'function', desc: 'Queries all matching child elements or components and returns Signal<readonly T[]>, replacing @ViewChildren.' , since: '17'},
    { name: '@Input()', type: 'decorator', desc: 'Legacy decorator that marks a class property as a component input; works but prefer input() for new code.' },
    { name: '@Output()', type: 'decorator', desc: 'Legacy decorator that exposes an EventEmitter property as a component output; prefer output() for new code.' },
    { name: '@ViewChild()', type: 'decorator', desc: 'Legacy decorator for querying child elements after view initialisation; prefer viewChild() for new code.' },
    { name: 'withComponentInputBinding()', type: 'function', desc: 'Router feature that auto-maps route params and resolver data to input() signals on routed components.' , since: '16'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: '@Input / @Output vs input() / output()', before: '// OLD — decorator-based\n@Input() title!: string;\n@Output() cardClicked = new EventEmitter<string>();\nonClick() { this.cardClicked.emit(this.title); }', after: '// NEW — signal-based (Angular 17+)\ntitle = input.required<string>();\ncardClicked = output<string>();\nonClick() { this.cardClicked.emit(this.title()); }',
      note: 'input() returns a read-only signal; call it as title() to get the value. No ngOnChanges needed.' },
    { title: '@Input + @Output \'Change\' pattern vs model()', before: '// OLD — manual two-way binding pair\n@Input() count = 0;\n@Output() countChange = new EventEmitter<number>();\nincrement() { this.countChange.emit(this.count + 1); }', after: '// NEW — model() does both in one\ncount = model(0);\nincrement() { this.count.update(v => v + 1); }\n// Parent: [(count)]=\'parentQty\'',
      note: 'model() auto-creates the countChange output; the parent uses [(count)] two-way syntax.' },
    { title: '@ViewChild + ngAfterViewInit vs viewChild()', before: '// OLD — lifecycle hook required\n@ViewChild(\'counterRef\') counter!: ModelCounterComponent;\nngAfterViewInit() { console.log(this.counter.count); }', after: '// NEW — signal, no lifecycle hook\ncounterRef = viewChild<ModelCounterComponent>(\'counterRef\');\nchildVal = computed(() => this.counterRef()?.count() ?? 0);',
      note: 'viewChild() returns a signal available from construction; read it inside computed() or effect().' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Trying to set an input() signal directly in the child', wrong: 'title = input.required<string>();\nrename() { this.title.set(\'new\'); } // ERROR: read-only', right: 'title = input.required<string>();\nlocalTitle = signal(\'\');\nconstructor() { effect(() => this.localTitle.set(this.title())); }', explanation: 'input() returns a read-only InputSignal. Only the parent can change it. Use a local writable signal synced via effect() if the child needs to modify it.'  },
    { title: 'Forgetting to call input() signals as functions in the template', wrong: '<!-- Wrong: treats signal as a plain property -->\n<h2>{{ title }}</h2>', right: '<!-- Correct: invoke the signal -->\n<h2>{{ title() }}</h2>', explanation: 'Signal inputs are functions. Omitting () displays \'[object Object]\' or nothing instead of the actual value.'  },
    { title: 'Using [(model)] syntax but not declaring model() in the child', wrong: '// Child uses plain input + output\n@Input() count = 0;\n@Output() countChange = new EventEmitter<number>();\n// Parent template: [(count)]=\'qty\' — partially works but loses signal reactivity', right: '// Child uses model()\ncount = model(0);\n// Parent template: [(count)]=\'qty\' — full signal two-way binding', explanation: '[(prop)] two-way syntax works with both patterns, but model() is required for the child to get a writable signal rather than a plain property.'  },
    { title: 'Reading viewChild() result in the constructor before the view is initialised', wrong: 'constructor() {\n  const c = this.counterRef(); // always undefined here\n  console.log(c?.count());\n}', right: 'constructor() {\n  effect(() => {\n    const c = this.counterRef();\n    if (c) console.log(c.count());\n  });\n}', explanation: 'viewChild() is undefined until the view is rendered. Wrap access in effect() or computed() so Angular re-evaluates once the child is available.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 17', label: 'Signal Inputs, Outputs & model()', features: ['input() and input.required() replace @Input() with reactive signals', 'output() replaces EventEmitter-based @Output() with a cleaner API', 'model() introduces two-way bindable ModelSignal (input + change output in one)', 'viewChild() and viewChildren() replace @ViewChild / @ViewChildren with signals'] },
    { version: 'Angular 16', label: 'withComponentInputBinding()', features: ['provideRouter(routes, withComponentInputBinding()) maps route params to input() signals automatically', 'Eliminates manual ActivatedRoute.snapshot.paramMap access in routed components'] },
  ];
}
