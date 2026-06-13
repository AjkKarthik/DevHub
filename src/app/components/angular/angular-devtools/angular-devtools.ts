import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';

@Component({
  selector: 'app-angular-devtools',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent,
  ],
  templateUrl: './angular-devtools.html',
  styleUrl: './angular-devtools.scss',
})
export class AngularDevtoolsDemo {

  quickRef: QuickRefItem[] = [
    { name: 'Component Tree',       type: 'hook',     desc: 'DevTools panel showing the live Angular component hierarchy — click any node to inspect its inputs, outputs, and state', since: 'DevTools v1' },
    { name: 'Profiler',             type: 'hook',     desc: 'Records change detection cycles — shows which components checked, how long each took, and why CD was triggered', since: 'DevTools v1' },
    { name: 'Flame Chart',          type: 'hook',     desc: 'Visual timeline of a profiler recording — each bar is one CD cycle; width = duration; colour = relative cost', since: 'DevTools v1' },
    { name: 'Tree Bar Chart',       type: 'hook',     desc: 'Alternative profiler view — shows all components checked in a single CD cycle as nested bars', since: 'DevTools v1' },
    { name: 'ng.getComponent(el)',  type: 'function', desc: 'Browser console helper — returns the Angular component instance for a given DOM element', since: 'Angular 9' },
    { name: 'ng.applyChanges(cmp)', type: 'function', desc: 'Browser console helper — triggers change detection on a specific component instance', since: 'Angular 9' },
    { name: 'ng.getOwningComponent', type: 'function', desc: 'Returns the component that owns a given DOM element (walks up the tree)', since: 'Angular 9' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What Angular DevTools shows you',
      points: [
        'Angular DevTools is a Chrome/Edge browser extension that adds an "Angular" panel to DevTools. It only activates on pages running Angular in development mode (or production builds that enable DevTools support).',
        'The extension has two main views: the <strong>Component Tree</strong> (inspect the live component hierarchy, read/write component state) and the <strong>Profiler</strong> (record change detection cycles and find performance bottlenecks).',
        'DevTools communicates with Angular\'s debug APIs (<code>ng.*</code> helpers) exposed on the global <code>window.ng</code> object in development mode. These APIs are tree-shaken in production builds by default.',
        'To install: search "Angular DevTools" in the Chrome Web Store or Edge Add-ons. It works with Angular 9+ and only activates when it detects Angular running on the page.',
      ],
    },
    {
      heading: 'Component Tree — inspecting live state',
      points: [
        'The Component Tree panel renders the full Angular component hierarchy in a collapsible tree. Each node shows the component selector. Clicking a node shows its <strong>inputs</strong>, <strong>outputs</strong>, <strong>state</strong> (signal values, properties), and the <strong>injected services</strong> visible from that node.',
        'You can <strong>edit component state inline</strong> from the panel — click a property value to change it. Angular DevTools calls <code>ng.applyChanges()</code> after the edit, so you see the UI update immediately. Useful for testing edge cases without modifying code.',
        'The search bar filters the tree by component name. Hovering a tree node highlights the corresponding DOM element on the page. Clicking the <code>&lt; &gt;</code> icon opens the component\'s source in the Sources panel.',
        'The panel also shows the <strong>change detection strategy</strong> (Default vs OnPush) for each component — a quick way to audit which components in a large tree are using OnPush correctly.',
      ],
    },
    {
      heading: 'Profiler — recording and reading a flame chart',
      points: [
        'Click the Record button, interact with the app (click a button, type in a field, navigate), then stop recording. DevTools shows a <strong>flame chart</strong>: the X axis is time; each row is a change detection cycle; each bar within a row is a component that was checked.',
        'Bar width represents duration. Tall stacks indicate deeply nested component trees being checked. A wide bar at the top of a stack means one expensive component is the bottleneck. Hover any bar to see the exact duration in milliseconds.',
        'The "Why did this component check?" tooltip shows the trigger: an event binding fired, an input changed, an async pipe emitted, or an <code>effect()</code> ran. This is invaluable for diagnosing unnecessary checks on <code>ChangeDetectionStrategy.OnPush</code> components.',
        'The <strong>tree bar chart</strong> view (button next to the flame chart) shows a single selected cycle as nested bars — useful for seeing the full subtree cost of one heavy check. Switch between views based on whether you\'re looking for a timing pattern (flame) or a single-cycle breakdown (tree).',
      ],
    },
    {
      heading: 'Console helpers — ng.* APIs',
      points: [
        'In a development build, Angular exposes debug helpers on <code>window.ng</code>. Open DevTools Console and type <code>ng.</code> to see autocomplete. The most useful: <code>ng.getComponent($0)</code> where <code>$0</code> is the currently selected DOM element in the Elements panel.',
        '<code>ng.getComponent(el)</code> returns the Angular component instance — you can read its signals, call its methods, and inspect its state from the console. Combined with <code>ng.applyChanges(cmp)</code>, you can mutate component state and trigger CD without touching source code.',
        '<code>ng.getContext($0)</code> returns the embedded view context (useful for <code>*ngFor</code> items — gives you the implicit variable, index, etc.).',
        '<code>ng.getListeners($0)</code> returns all event listeners registered on an element via Angular\'s event binding — useful for debugging why a click handler isn\'t firing.',
      ],
    },
    {
      heading: 'Profiling workflow — from symptom to fix',
      points: [
        'Start with a symptom: "the list scrolls jankily" or "typing in this field lags". Record a profiler trace of the problematic interaction. Look for frames that take longer than 16ms (the budget for 60fps).',
        'Find the widest bars in slow frames. Check the component name — is it a component that should not be re-checking on every keystroke? If it uses <code>ChangeDetectionStrategy.Default</code>, consider switching to <code>OnPush</code>.',
        'For <code>OnPush</code> components that are still checking too often: read the "why" tooltip. If it shows "input changed", check whether the input reference is actually changing (object identity, not deep equality). If it shows "async pipe emitted", consider whether the observable emits more often than needed.',
        'After making a change (adding OnPush, memoising a computed, switching to signals), record again and compare. The profiler is the feedback loop — measure, change, measure again.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ng.* console helpers',
      language: 'typescript',
      code: `// In the browser console — only works in development mode

// 1. Select an element in the Elements panel, then in Console:
const cmp = ng.getComponent($0);
// Returns the Angular component instance for the selected DOM element
console.log(cmp.items());           // read a signal value
cmp.title = 'Debug title';          // mutate a property
ng.applyChanges(cmp);               // trigger CD on just this component

// 2. Get the component without using $0
const el = document.querySelector('app-user-list');
const userListCmp = ng.getComponent(el);
userListCmp.filter.set('admin');    // trigger a signal update
ng.applyChanges(userListCmp);

// 3. Get template context for a list item (ngFor / @for)
const itemEl = document.querySelector('[data-id="42"]');
const ctx = ng.getContext(itemEl);
// ctx.$implicit = the item object
// ctx.index    = current index

// 4. See all Angular event listeners on an element
const btn = document.querySelector('.submit-btn');
ng.getListeners(btn);
// Returns: [{ name: 'click', callback: fn, useCapture: false }]

// 5. Walk up the tree to find the owning component
const span = document.querySelector('.product-name');
const owner = ng.getOwningComponent(span);
// Returns the nearest ancestor component instance`,
    },
    {
      label: 'Enabling DevTools in production',
      language: 'typescript',
      code: `// By default, Angular DevTools only works in development mode.
// To enable in a staging/production build for debugging:

// app.config.ts
import { ApplicationConfig, enableProdMode } from '@angular/core';
import { enableDebugTools } from '@angular/platform-browser';

// Option A: enable DevTools support without disabling prod mode optimisations
// Call after bootstrapApplication returns the ApplicationRef
bootstrapApplication(AppComponent, appConfig)
  .then(appRef => {
    // Expose Angular debug APIs — allows DevTools to connect
    // WARNING: remove before shipping to real production
    enableDebugTools(appRef.components[0]);
  });

// Option B: use an environment flag
// src/environments/environment.staging.ts
export const environment = {
  production: true,
  enableDevTools: true,
};

// main.ts
bootstrapApplication(AppComponent, appConfig).then(appRef => {
  if (environment.enableDevTools) {
    const { enableDebugTools } = await import('@angular/platform-browser');
    enableDebugTools(appRef.components[0]);
  }
});`,
    },
    {
      label: 'Reading the profiler — what to look for',
      language: 'typescript',
      code: `// Common profiler findings and their fixes

// FINDING 1: Component with Default CD checks on every keystroke
// Symptom: flat wide bar for 'app-product-list' in every keystroke frame
// Fix: switch to OnPush + signals

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,  // ← add this
  // ...
})
export class ProductListComponent {
  // Use signals — OnPush + signals means Angular only checks this
  // component when its signals change, not on every CD cycle
  products = signal<Product[]>([]);
  filter   = signal('');

  filtered = computed(() =>
    this.products().filter(p => p.name.includes(this.filter()))
  );
}

// FINDING 2: OnPush component still checking — input reference changing
// Symptom: "why?" tooltip shows "input changed" but the data looks the same
// Fix: memoize/stabilize the reference

// Bad — new array reference on every render
@Component({ template: '<app-list [items]="getItems()" />' })
export class ParentComponent {
  getItems() { return [...this.rawItems]; }  // new ref every time!
}

// Good — stable signal reference
export class ParentComponent {
  items = computed(() => [...this.rawItems()]);  // recomputed only when rawItems changes
}

// FINDING 3: async pipe triggering too many checks
// Symptom: "why?" shows async pipe fired for observable that emits on every scroll
// Fix: add debounceTime / distinctUntilChanged
scrollPosition$ = fromEvent(window, 'scroll').pipe(
  debounceTime(100),           // only emit after 100ms of no scroll
  map(e => window.scrollY),
  distinctUntilChanged(),      // only emit when value actually changes
);`,
    },
    {
      label: 'Injector tree inspection',
      language: 'typescript',
      code: `// Angular DevTools also shows the injector hierarchy
// Useful when debugging "NullInjectorError: No provider for XService"

// In the Component Tree panel:
// 1. Click a component node
// 2. In the right panel, look for "Injectors" section
// 3. It shows the DI resolution path: component → parent → module → root

// Common diagnosis: service provided in a lazy-loaded route injector
// not visible to components outside that route

// Example: UserService provided in the lazy route injector
const lazyRoutes: Routes = [{
  path: 'admin',
  providers: [UserService],  // scoped to this route's injector subtree
  loadComponent: () => import('./admin/admin').then(m => m.AdminComponent),
}];

// If a component outside the admin route tries to inject UserService,
// DevTools Injector view will show the gap — UserService only appears
// in the admin subtree, not in root or app injector

// Console: check what injector a component sees
const cmp = ng.getComponent(document.querySelector('app-admin'));
// DevTools shows the injector hierarchy visually`,
    },
    {
      label: 'Performance audit checklist',
      language: 'typescript',
      code: `// Systematic DevTools performance audit

// STEP 1: Record a profiler trace of the slow interaction
// Look for: frames > 16ms, components with many checks

// STEP 2: Check CD strategies in the Component Tree
// Filter tree by components → look at "Change Detection" column
// All OnPush? If some are Default, they check on every event in the app

// STEP 3: For slow OnPush components — read the "why" tooltip
// "Input reference changed"  → stabilise the reference (computed/memo)
// "Async pipe emitted"       → add debounce/distinctUntilChanged to the stream
// "Effect triggered"         → check if the effect reads too many signals
// "Manual markForCheck()"    → find where it's called; may be called too often

// STEP 4: Look for unnecessary deep trees
// A component checking 200 child components even with OnPush
// → consider virtualisation (CDK Virtual Scroll) or @defer for off-screen content

// STEP 5: Baseline → change → re-record
// Save the first trace (DevTools lets you export as JSON)
// Make the change, record again, compare durations
// DevTools shows "saved recordings" so you can switch between them

// Quick wins:
// - trackBy / track in @for — prevents DOM recreation on data reload
// - async pipe (or toSignal) instead of manual subscriptions + markForCheck
// - @defer for components below the fold — defers their CD entirely
// - Signals + OnPush — the combination Angular 17+ is optimised for`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Profiling in production mode and seeing no data',
      wrong: `// Built with ng build --configuration=production
// Angular DevTools shows "No Angular application found" or empty profiler
// because prod mode disables debug APIs by default`,
      right: `// Profile in development mode: ng serve (no --prod flag)
// Or enable debug tools explicitly for staging builds:
bootstrapApplication(AppComponent, appConfig)
  .then(ref => enableDebugTools(ref.components[0]));
// Then Angular DevTools connects and the profiler works`,
      explanation: 'Angular\'s production build tree-shakes the debug APIs that DevTools relies on. Profile in development mode, or explicitly call enableDebugTools() on staging — never enable it in real production.',
    },
    {
      title: 'Ignoring the "why did this check?" tooltip',
      wrong: `// Sees slow performance, switches all components to OnPush blindly
// Some components still check — doesn't investigate why
// Result: broken UI (data not updating) without understanding the root cause`,
      right: `// Read the tooltip for each slow OnPush component:
// "Input changed" → check reference stability
// "Async pipe emitted" → add distinctUntilChanged() to the stream
// "markForCheck() called" → find and audit the call site
// Fix the specific cause, don't just add/remove OnPush randomly`,
      explanation: 'OnPush without understanding why a component checks leads to either broken UIs (missed updates) or wasted effort. The "why" tooltip in the profiler is the most actionable data point — always read it before making changes.',
    },
    {
      title: 'Using ng.getComponent() in production code',
      wrong: `// Developer uses ng.getComponent in a utility function in production code
export function debugComponent(el: Element) {
  return (window as any).ng.getComponent(el);  // breaks in prod builds
}`,
      right: `// ng.* helpers are console-only debug tools — never import or use in source code
// They only exist on window.ng in development mode
// For programmatic access to a component instance, use proper DI:
const service = inject(MyService);
// Or @ViewChild / viewChild() for accessing child components`,
      explanation: 'window.ng is only available in development builds. Calling ng.getComponent in production code throws a runtime error. These helpers are strictly for interactive debugging in the browser console.',
    },
    {
      title: 'Recording a profiler trace that\'s too long',
      wrong: `// Records 30 seconds of general app use
// Flame chart has hundreds of cycles — impossible to find the slow one
// Gives up and says "profiling didn't help"`,
      right: `// Record ONE specific interaction:
// 1. Click Record
// 2. Do exactly the action that feels slow (one button click, one keypress)
// 3. Stop recording immediately
// Short targeted traces are easy to read — find the outlier frame quickly`,
      explanation: 'Long recordings produce hundreds of CD cycles. A 2-3 second targeted trace of the slow interaction produces 5-20 cycles — you can immediately see which frame is slow and which component caused it.',
    },
  ];

  challenge: Challenge = {
    title: 'Diagnose and fix a performance problem using DevTools',
    language: 'typescript',
    description: `You have a ProductListComponent with a search input. Typing in the search field feels slow. Use the Angular DevTools profiler to diagnose and fix the issue. The component below has three performance problems — identify and fix all three using what you see in DevTools:
1. Change detection strategy is suboptimal
2. The filtered list recomputes in a way that creates new references every cycle
3. The search observable emits on every keypress without debouncing`,
    hints: [
      'Open Angular DevTools → Profiler → Record → type in the search field → Stop',
      'Read the flame chart: which component bars are widest? What does the "why" tooltip say?',
      'ChangeDetectionStrategy.OnPush + signals is the target architecture',
      'computed() memoises — the filtered array only recomputes when products or filter changes',
      'debounceTime(300) + distinctUntilChanged() on the search observable',
    ],
    starterCode: `// BEFORE — slow version (3 problems to fix)
@Component({
  // Problem 1: missing OnPush
  template: \`
    <input [formControl]="searchCtrl" placeholder="Search..." />
    <div *ngFor="let p of getFiltered()">{{ p.name }}</div>
  \`,
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  searchCtrl = new FormControl('');

  // Problem 2: creates a new array on every CD cycle
  getFiltered(): Product[] {
    return this.products.filter(p =>
      p.name.includes(this.searchCtrl.value ?? '')
    );
  }

  // Problem 3: no debounce — triggers CD on every keypress
  ngOnInit() {
    this.searchCtrl.valueChanges.subscribe(val => {
      // triggers parent CD which re-checks this component
    });
  }
}`,
    solution: `// AFTER — fixed with DevTools findings
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,  // Fix 1
  standalone: true,
  imports: [ReactiveFormsModule],
  template: \`
    <input [formControl]="searchCtrl" placeholder="Search..." />
    @for (p of filtered(); track p.id) { <div>{{ p.name }}</div> }
  \`,
})
export class ProductListComponent {
  private destroyRef = inject(DestroyRef);

  products = signal<Product[]>([]);
  filter   = signal('');

  searchCtrl = new FormControl('');

  // Fix 2: computed memoises — only recomputes when products or filter changes
  filtered = computed(() =>
    this.products().filter(p =>
      p.name.toLowerCase().includes(this.filter().toLowerCase())
    )
  );

  constructor() {
    // Fix 3: debounce + distinctUntilChanged — CD triggered at most once per 300ms of typing
    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(val => this.filter.set(val ?? ''));
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does the flame chart X axis represent in the Angular DevTools Profiler?',
      options: [
        'The number of components checked in each CD cycle',
        'Time — each column of bars is one change detection cycle, positioned by when it occurred',
        'The component tree depth — deeper components appear further right',
        'Memory usage over the recording period',
      ],
      answer: 1,
      explanation: 'The X axis is time. Each vertical cluster of bars is one CD cycle. Bar width within a cycle represents duration. You read it left-to-right to see cycles over time, and identify which cycle (column) took the longest.',
    },
    {
      q: 'What does the "why did this component check?" tooltip in the profiler tell you?',
      options: [
        'The number of times this component has ever been checked since the app started',
        'The trigger for this specific CD cycle check — input changed, async pipe emitted, markForCheck called, etc.',
        'Whether the component has a memory leak',
        'The time since the component was last rendered to the DOM',
      ],
      answer: 1,
      explanation: 'The "why" tooltip shows the exact trigger for a component being checked in that cycle. This is the most actionable data point — it tells you whether to fix the input reference, debounce an observable, or audit a markForCheck call.',
    },
    {
      q: 'How do you get the Angular component instance for a DOM element from the browser console?',
      options: [
        'document.querySelector("app-foo").angularComponent',
        'ng.getComponent($0) where $0 is the selected element in the Elements panel',
        'Angular.getDebugNode($0).component',
        'window.__ngContext__.find(el)',
      ],
      answer: 1,
      explanation: 'ng.getComponent(element) is one of Angular\'s debug helpers exposed on window.ng in development mode. $0 is a DevTools shorthand for the currently selected element in the Elements panel.',
    },
    {
      q: 'Why does Angular DevTools show "No Angular application found" on a production build?',
      options: [
        'DevTools only supports Angular 14 and below',
        'Production builds tree-shake the debug APIs that DevTools relies on',
        'The extension must be reinstalled for each production URL',
        'CORS blocks the extension from reading production Angular apps',
      ],
      answer: 1,
      explanation: 'Angular\'s production mode removes the debug APIs (window.ng.*) via tree-shaking. DevTools communicates via these APIs. To use DevTools on a staging/production build, call enableDebugTools() explicitly after bootstrapping.',
    },
    {
      q: 'Which profiler finding would suggest switching a component to ChangeDetectionStrategy.OnPush?',
      options: [
        'The component appears once at the very top of every flame chart frame',
        'The component bar is wide in every CD cycle, even when its data hasn\'t changed',
        'The component is listed in the "Injectors" panel with a long chain',
        'The component has more than 10 child components in the tree',
      ],
      answer: 1,
      explanation: 'If a component appears in every CD cycle with a wide bar but its displayed data doesn\'t change, it\'s being checked unnecessarily. OnPush makes Angular skip the check unless an input reference changes, an async pipe emits, or markForCheck is called — eliminating the wasted cycles.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use Angular DevTools with zoneless Angular apps?',
      a: 'Yes — Angular DevTools works with both Zone.js and zoneless (provideExperimentalZonelessChangeDetection()) apps. For zoneless apps, the profiler is especially useful because CD is now triggered by signal changes and events rather than Zone.js patching. The "why" tooltip becomes the primary way to understand what triggered each cycle.',
    },
    {
      q: 'How do I find which component is causing a specific DOM update to be slow?',
      a: 'In the Elements panel, right-click the slow element and "Inspect". Now in Angular DevTools Component Tree, the corresponding component node highlights. Record a profiler trace of the slow interaction and look for that component\'s name in the flame chart. If it appears in every frame with a wide bar, it\'s the bottleneck.',
    },
    {
      q: 'What is the difference between the Flame Chart and Tree Bar Chart views?',
      a: 'Flame Chart shows all CD cycles over time — use it to find which cycle is slow (tall, wide bars) and see patterns across many cycles. Tree Bar Chart shows the component hierarchy for one selected cycle — use it to drill into a single slow cycle and see which subtree is responsible. Start with Flame Chart to find the slow cycle, then switch to Tree Bar Chart for that cycle to find the guilty component.',
    },
    {
      q: 'Is it safe to use ng.applyChanges() to test UI updates in the console?',
      a: 'It is safe for debugging — it triggers CD on the specific component instance. Changes made via the console do not persist (component state resets on next real CD cycle unless the signal/property was permanently mutated). It is a read-eval-play-loop for exploring component behaviour without modifying source. Never use it in production code — it only exists in development builds.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Angular DevTools Chrome extension provides two panels: <strong>Component Tree</strong> (inspect/edit live state) and <strong>Profiler</strong> (record CD cycles, read the flame chart, find the "why" for each check). Use <code>ng.getComponent($0)</code> in the console for interactive debugging.',
    mustKnow: [
      'Component Tree: click any node → see inputs, signals, state, CD strategy, injectors',
      'Profiler: Record → interact → Stop → flame chart shows one column per CD cycle; width = duration',
      '"Why did this check?" tooltip — the most actionable profiling data: input ref changed / async pipe / markForCheck',
      '<code>ng.getComponent($0)</code> — get component instance for selected DOM element; console-only, dev mode only',
      '<code>ng.applyChanges(cmp)</code> — trigger CD on a specific component from the console',
      'DevTools inactive on prod builds — call <code>enableDebugTools()</code> to enable on staging',
    ],
    interviewFocus: [
      '<strong>How to find a slow component?</strong> — Profiler flame chart → widest bar in slowest frame → read "why" tooltip',
      '<strong>ng.getComponent vs ViewChild?</strong> — ng.getComponent is console-only debug; ViewChild is production code',
      '<strong>Why no DevTools on prod?</strong> — debug APIs tree-shaken; use enableDebugTools() for staging',
      '<strong>Flame chart vs tree bar chart?</strong> — flame = all cycles over time; tree = one cycle breakdown',
    ],
  };
}
