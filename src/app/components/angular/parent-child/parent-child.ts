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
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-parent-child',
  imports: [JsonPipe, ReactiveFormsModule, ChildCardComponent, ModelCounterComponent, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, RevisionCardComponent, PrerequisitesComponent],
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

  prerequisites: Prerequisite[] = [
    { label: 'Signals', route: '/angular/signals' },
    { label: 'Components', route: '/angular/components' },
  ];

  // ── Code Tabs ─────────────────────────────────────────────────────────────
  theory: TheoryPoint[] = [
    {
      heading: 'input() — modern @Input replacement',
      points: [
        '<code>input&lt;T&gt;()</code> declares an optional signal input with an optional default; <code>input.required&lt;T&gt;()</code> enforces that the parent MUST pass a value — TypeScript gives a compile error if the binding is missing.',
        'The value is accessed as a signal: <code>this.title()</code> — no need for <code>ngOnChanges</code> to react to changes, and no risk of stale values.',
        'Inputs are read-only (<code>InputSignal</code> has no <code>.set()</code>). Only the parent can change the value by changing its binding expression.',
        '<code>input()</code> integrates with <code>withComponentInputBinding()</code>: route params (e.g. <code>:id</code>) are automatically mapped to an <code>input()</code> with the same name — no <code>ActivatedRoute.snapshot</code> needed.',
        'Signal inputs support <code>transform</code> option: <code>input(0, { transform: numberAttribute })</code> converts attribute strings to numbers automatically.',
      ],
    },
    {
      heading: 'output() — modern @Output replacement',
      points: [
        '<code>output&lt;T&gt;()</code> creates a type-safe component output without requiring an RxJS <code>Subject</code> or <code>EventEmitter</code> underneath.',
        'Emit with <code>this.myOutput.emit(value)</code> — identical call site to <code>EventEmitter.emit()</code>, so child code reads the same.',
        'Parent binds with <code>(outputName)="handler($event)"</code> — same template syntax as the old <code>@Output()</code>; no migration required on the parent side.',
        '<code>outputFromObservable(observable$)</code> converts an RxJS Observable into an Angular output — useful for bridging existing streams to the new API.',
        '<code>toObservable(outputRef.asObservable())</code> is available if you need to compose the output stream with RxJS operators downstream.',
      ],
    },
    {
      heading: 'model() — two-way binding with ModelSignal',
      points: [
        '<code>model(defaultVal)</code> creates a <code>ModelSignal</code> — a writable signal in the child that the parent can both read from and write to using the <code>[(prop)]</code> two-way syntax.',
        'Under the hood, <code>model()</code> generates an input and an auto-named <code>propChange</code> output. <code>[(count)]="qty"</code> desugars to <code>[count]="qty()" (countChange)="qty.set($event)"</code>.',
        'The child calls <code>this.count.set(n)</code> or <code>this.count.update(n => n + 1)</code> — Angular emits the change event automatically, updating the parent signal.',
        '<code>model.required&lt;T&gt;()</code> marks the model as required — the parent MUST provide a two-way binding or Angular reports a compile error.',
        'Multiple siblings can bind to the same parent signal via <code>model()</code>: changing one child updates the parent signal, which flows into all other bound children reactively.',
      ],
    },
    {
      heading: 'viewChild() and viewChildren()',
      points: [
        '<code>viewChild&lt;T&gt;(\'refName\')</code> queries a single child element or component by template reference variable and returns <code>Signal&lt;T | undefined&gt;</code> — no <code>ngAfterViewInit</code> lifecycle hook needed.',
        '<code>viewChild.required&lt;T&gt;(\'refName\')</code> asserts the element is always present — returns <code>Signal&lt;T&gt;</code> without the <code>undefined</code> case, reducing null-checks.',
        '<code>viewChildren(ComponentType)</code> returns <code>Signal&lt;readonly T[]&gt;</code> containing all instances of that component type in this view — replaces <code>@ViewChildren</code>.',
        'Read inside <code>computed()</code> or <code>effect()</code>. Angular tracks the signal dependency and re-runs when the view changes (e.g. when an <code>@if</code> block adds/removes the child).',
        'You can also query by directive type, template-ref token, or injection token — not just component type — giving flexibility to query structural directive instances.',
      ],
    },
    {
      heading: 'contentChild() and contentChildren()',
      points: [
        '<code>contentChild()</code> queries content projected INTO the component\'s <code>&lt;ng-content&gt;</code> slot by the parent — as opposed to <code>viewChild()</code> which queries the component\'s OWN template.',
        '<code>contentChildren(TokenType)</code> returns <code>Signal&lt;readonly T[]&gt;</code> of all projected children matching the token — replaces <code>@ContentChildren</code>.',
        'Use <code>contentChild()</code> when writing wrapper/container components (tabs, accordions, form groups) that need to read or configure the projected items.',
        '<code>contentChild.required()</code> asserts that at least one matching item is projected — useful for layout containers that MUST receive content.',
        'Both <code>contentChild</code> and <code>viewChild</code> support <code>read</code> option: <code>viewChild(\'ref\', { read: ElementRef })</code> returns the <code>ElementRef</code> of the queried element rather than the component instance.',
      ],
    },
    {
      heading: 'Best practices and migration patterns',
      points: [
        'Migrate <code>@Input() prop!: T</code> → <code>prop = input.required&lt;T&gt;()</code> and update all reads from <code>this.prop</code> to <code>this.prop()</code>. The parent template binding stays the same.',
        'Replace <code>@Output() evt = new EventEmitter&lt;T&gt;()</code> → <code>evt = output&lt;T&gt;()</code>. No other changes needed — <code>emit()</code> call and parent binding are identical.',
        'Signal inputs do NOT trigger <code>ngOnChanges</code>. Replace <code>ngOnChanges(changes)</code> with <code>effect(() => { const v = this.prop(); ... })</code> to react to changes reactively.',
        'Never use <code>input()</code> and <code>@Input()</code> on the same property — pick one API per property consistently. Mixing causes Angular to apply both bindings, leading to confusing behaviour.',
        'For deeply nested components, prefer a shared <code>injectable</code> service or signals over long chains of inputs and outputs — more than two levels of prop-drilling is a signal to refactor.',
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
    { q: 'What is the difference between contentChild() and viewChild()?', a: '<code>viewChild()</code> queries elements in the component\'s OWN template. <code>contentChild()</code> queries elements projected INTO the component via <code>&lt;ng-content&gt;</code> by the parent. Use <code>contentChild()</code> in wrapper components (tabs, accordions) that need to inspect or configure their projected content.' },
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
    { q: 'How do you query ALL instances of a child component type in the parent\'s view?', options: ['viewChild(MyComp) returns an array when multiple match', 'viewChildren(MyComp) returns Signal<readonly MyComp[]>', 'Use @ContentChildren — viewChildren does not support multiple queries', 'Declare multiple viewChild() calls, one per instance'], answer: 1, explanation: 'viewChildren(ComponentType) returns a Signal<readonly T[]> containing every instance of that component type in the parent\'s view. viewChild() only ever returns the FIRST match or a specific #ref. For arrays, always use viewChildren().' },
    { q: 'A routed component has an input() named `id` (bound automatically from the :id route param via withComponentInputBinding()) and its PARENT component template also explicitly passes [id]="someValue" via a router outlet content projection pattern. Which source wins?', options: ['The parent template binding always wins, since explicit template bindings take priority', 'This scenario cannot occur — route-bound components cannot also receive explicit parent bindings', 'The route parameter wins, since withComponentInputBinding() sets the input directly on the routed component instance the same way any input is set, and there is no meaningful "parent template binding" path for a component instantiated by the router outlet rather than by a parent template', 'Both values are merged into an array'], answer: 2, explanation: 'A component rendered via <router-outlet> is instantiated BY the router, not by a parent component\'s template — so there is no competing "parent template passed [id]" binding in the first place for a router-outlet-rendered component; the premise of the question describes an impossible setup for how Angular routing actually works. withComponentInputBinding() sets inputs the same way any input is set (as if a template had bound them), and since the router is the only thing instantiating that component, its route-derived values are the only source, with no separate parent-template path to conflict with.' },
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
    { title: 'Expecting ngOnChanges to fire when using input() signal inputs', wrong: 'title = input.required<string>();\n// ngOnChanges never fires for signal inputs\nngOnChanges(changes: SimpleChanges) {\n  console.log(changes[\'title\']); // always undefined\n}', right: 'title = input.required<string>();\nconstructor() {\n  effect(() => {\n    // reactive — fires whenever title() changes\n    console.log(\'title changed to\', this.title());\n  });\n}', explanation: 'ngOnChanges only tracks properties decorated with @Input(). Signal inputs use a different mechanism — use effect() or computed() to react to input() changes. Mixing ngOnChanges with signal inputs is a common migration pitfall.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'The modern signal-based parent-child API — <code>input()</code>, <code>output()</code>, <code>model()</code>, <code>viewChild()</code> — replaces Angular\'s legacy decorators with reactive signals that are always up-to-date without lifecycle hooks.',
    mustKnow: [
      '<code>input.required&lt;T&gt;()</code> — required signal input; compile error if parent omits it. Read as <code>this.prop()</code>',
      '<code>output&lt;T&gt;()</code> — type-safe emitter; call <code>.emit(value)</code> in child; parent binds with <code>(evt)="handler($event)"</code>',
      '<code>model(defaultVal)</code> — two-way signal: child calls <code>.set()</code>; parent uses <code>[(prop)]</code> syntax',
      '<code>viewChild(\'#ref\')</code> returns <code>Signal&lt;T | undefined&gt;</code>; read inside <code>effect()</code> or <code>computed()</code> — never in constructor directly',
      '<code>viewChildren(ComponentType)</code> returns <code>Signal&lt;readonly T[]&gt;</code> — all instances in this view',
      '<code>contentChild()</code> queries projected <code>&lt;ng-content&gt;</code> elements; <code>viewChild()</code> queries this component\'s own template',
      'Signal inputs do NOT trigger <code>ngOnChanges</code> — use <code>effect(() => { const v = this.prop(); ... })</code> instead',
    ],
    interviewFocus: [
      'What is the difference between <code>input()</code> and <code>@Input()</code>? Why prefer the new API?',
      'What does <code>model()</code> replace, and how does the parent bind to it with <code>[()]</code>?',
      'When would you use <code>contentChild()</code> vs <code>viewChild()</code>?',
      'What happens if you rely on <code>ngOnChanges</code> with signal inputs — and what do you use instead?',
      'How does <code>withComponentInputBinding()</code> eliminate <code>ActivatedRoute</code> usage in routed components?',
    ],
  };
}
