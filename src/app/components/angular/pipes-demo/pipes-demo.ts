import { Component, signal } from '@angular/core';
import {
  AsyncPipe, DatePipe, CurrencyPipe, DecimalPipe, PercentPipe,
  UpperCasePipe, LowerCasePipe, TitleCasePipe, SlicePipe, JsonPipe
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, map } from 'rxjs';
import { TruncatePipe } from '../../../pipes/truncate.pipe';
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
  selector: 'app-pipes-demo',
  imports: [
    AsyncPipe, DatePipe, CurrencyPipe, DecimalPipe, PercentPipe,
    UpperCasePipe, LowerCasePipe, TitleCasePipe, SlicePipe, JsonPipe,
    FormsModule, TruncatePipe, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent,
    QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
  ],
  templateUrl: './pipes-demo.html',
  styleUrl: './pipes-demo.scss',
})
export class PipesDemo {
  // Date pipe
  now          = new Date();
  customFormat = signal('MMM d, y, h:mm a');

  // Currency / Number / Percent
  amount        = signal(12345.678);
  currencyCode  = signal('USD');
  decimalDigits = signal('2');
  percent       = signal(0.7342);

  // Case pipes
  rawText = signal('the QUICK Brown FOX');

  // Slice
  fruits    = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig'];
  sliceFrom = signal(0);
  sliceTo   = signal(3);

  // JSON
  obj = signal({
    user: { name: 'Karthik', role: 'admin' },
    features: ['signals', 'ssr', 'material'],
    version: 22,
  });

  // Async — live Observable (timer fires every second)
  timer$ = interval(1000).pipe(map(n => n));

  // Truncate (custom)
  longText   = signal('Angular is a platform and framework for building single-page client applications using HTML and TypeScript');
  truncateAt = signal(60);

  theory: TheoryPoint[] = [
    {
      heading: 'What are pipes and how they work',
      points: [
        'Pipes transform data in templates without mutating the source value: <code>{{ value | pipeName:arg1:arg2 }}</code>.',
        'Angular evaluates the pipe expression and passes the left-hand value as the first argument to <code>transform()</code>.',
        'Pipes are pure by default — Angular memoises the result and only re-runs when the input <em>reference</em> changes, not on every CD cycle.',
        'Chain pipes left-to-right: <code>{{ value | date | uppercase }}</code> — the output of each becomes the input of the next.',
        'Pipes are standalone tree-shakeable classes — import only what you use in the component\'s <code>imports</code> array to keep bundle size small.',
      ],
    },
    {
      heading: 'Built-in formatting pipes (date, currency, number, percent)',
      points: [
        '<code>DatePipe</code>: <code>{{ d | date:\'MMM d, y\' }}</code>. Format strings follow Unicode Date Format patterns; locale comes from <code>LOCALE_ID</code>.',
        '<code>CurrencyPipe</code>: <code>{{ 1234.5 | currency:\'EUR\':\'symbol\':\'1.2-2\' }}</code>. Second arg is display (code/symbol/narrow), third is digit-info.',
        '<code>DecimalPipe</code>: <code>{{ n | number:\'1.0-2\' }}</code> — <code>minInt.minFrac-maxFrac</code> digit-info string; omitting gives locale defaults.',
        '<code>PercentPipe</code>: <code>{{ 0.742 | percent:\'1.1-2\' }}</code> — multiplies by 100 and appends %; accepts the same digit-info format.',
        'All four formatting pipes are locale-aware. Register additional locales with <code>registerLocaleData()</code> and set <code>LOCALE_ID</code> in providers.',
      ],
    },
    {
      heading: 'String and collection pipes (case, slice, JSON)',
      points: [
        '<code>UpperCasePipe</code>, <code>LowerCasePipe</code>, <code>TitleCasePipe</code> transform string casing; TitleCase capitalises the first letter of each word.',
        '<code>SlicePipe</code> works on both arrays and strings: <code>{{ fruits | slice:1:3 }}</code> returns <code>[\'Banana\',\'Cherry\']</code>; negative indices count from the end.',
        '<code>JsonPipe</code> converts any value to a pretty-printed JSON string — invaluable for debugging objects in the template during development.',
        'SlicePipe returns a new array reference, making it safe with pure downstream pipes that need a reference change to re-run.',
        'Remove JsonPipe before production — it exposes your full object structure in the DOM and can accidentally leak sensitive data.',
      ],
    },
    {
      heading: 'AsyncPipe — subscribe, unsubscribe, and @let alias',
      points: [
        'AsyncPipe subscribes to an Observable or Promise in the template and returns the latest emitted value automatically.',
        'It unsubscribes when the component is destroyed — no manual <code>subscribe()</code> or <code>unsubscribe()</code> needed, preventing memory leaks.',
        'Each <code>| async</code> expression creates ONE separate subscription; placing it twice on the same source creates two HTTP requests or two subscriptions.',
        'Use <code>@let user = user$ | async</code> (Angular 18+) to give the resolved value an alias and reuse it throughout the template without duplicating the pipe.',
        '<code>null</code> is returned until the first emission, so always guard: <code>@if (user$ | async; as u) { ... }</code> to avoid template errors on null.',
      ],
    },
    {
      heading: 'Custom pipes — PipeTransform, pure vs impure',
      points: [
        'Decorate a class with <code>@Pipe({ name: \'myPipe\', standalone: true })</code> and implement <code>PipeTransform</code> with a <code>transform(value, ...args)</code> method.',
        'Return the transformed value — never mutate the input inside a pure pipe, as Angular will not detect a reference change on the same object.',
        'Pure pipes (default) are efficient: Angular calls <code>transform()</code> only when the reference changes. Use them for stateless transformations like formatting, truncation, or mapping.',
        'Impure pipes (<code>pure: false</code>) re-run on every CD cycle — use only when transformation depends on external mutable state, e.g. a live locale preference.',
        'Pipes can inject services using <code>inject()</code> in the class body, enabling locale-aware formatting, currency lookup from user preferences, and more.',
      ],
    },
    {
      heading: 'Best practices and performance patterns',
      points: [
        'Prefer <code>computed()</code> signals over impure pipes for derived state — computed memoises automatically and integrates with the signal graph.',
        'Import only the pipes you use individually (e.g. <code>DatePipe</code>, not <code>CommonModule</code>) to keep the bundle tree-shakeable.',
        'The <code>async</code> pipe is always preferred over manual <code>subscribe()</code> in templates — it handles teardown and triggers CD automatically.',
        'For heavy operations like filtering or sorting large arrays, derive the result in the component with <code>computed()</code> rather than an impure pipe that fires every cycle.',
        'Chain pipes thoughtfully — each pipe in a chain adds a function call per CD cycle; multiple chained impure pipes can compound performance costs.',
      ],
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is a pure pipe and why does it matter for performance?', a: 'A pure pipe only re-executes when its input <strong>reference</strong> changes (default). Angular memoises the result. An impure pipe (<code>pure: false</code>) runs on every change detection cycle — avoid unless necessary.' },
    { q: 'How do you create a custom pipe?', a: 'Implement <code>PipeTransform</code>: <code>transform(value: string, maxLen: number): string { return value.slice(0, maxLen); }</code>. Decorate with <code>@Pipe({ name: \'truncate\', standalone: true })</code>. Import it where used.' },
    { q: 'Why does the async pipe prevent memory leaks?', a: 'The async pipe subscribes when the component renders and <strong>automatically unsubscribes</strong> when the component is destroyed — you never need to manage the subscription manually.' },
    { q: 'Can you chain multiple pipes?', a: 'Yes: <code>{{ value | date:\'shortDate\' | uppercase }}</code>. Each pipe receives the output of the previous one. Be careful with order — <code>currency | lowercase</code> would lowercase a currency symbol unintentionally.' },
    { q: 'When would you use the JSON pipe?', a: 'During development to inspect objects in the template: <code>{{ myObject | json }}</code>. It\'s a quick debugging tool. Remove it before production — it exposes your full object structure to the DOM.' },
    { q: 'What is the difference between DatePipe\'s default locale and a custom one?', a: 'DatePipe uses the locale provided to the app via <code>LOCALE_ID</code>. Set it with <code>{ provide: LOCALE_ID, useValue: \'fr-FR\' }</code>. Without it, dates default to <code>en-US</code> format. Call <code>registerLocaleData()</code> first for non-en-US locales.' },
    { q: 'When should you use computed() instead of an impure pipe?', a: 'Use <code>computed()</code> when the derived value depends on signals — it integrates with the signal graph and memoises automatically. An impure pipe runs every CD cycle regardless of whether inputs changed, making it much less efficient for derived state in signal-based components.' },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Built-in pipes',
      language: 'html',
      code: `<!-- Date -->
{{ today | date }}                      <!-- Jan 1, 2025 -->
{{ today | date:'dd/MM/yyyy' }}         <!-- 01/01/2025 -->
{{ today | date:'shortTime' }}          <!-- 10:30 AM -->

<!-- Currency -->
{{ 1234.5 | currency }}                 <!-- $1,234.50 -->
{{ 1234.5 | currency:'EUR':'symbol' }}  <!-- €1,234.50 -->

<!-- Number (minInt.minFrac-maxFrac) -->
{{ 3.14159 | number:'1.2-2' }}          <!-- 3.14 -->
{{ 0.742   | percent:'1.1-1' }}         <!-- 74.2% -->

<!-- Case -->
{{ text | uppercase }}
{{ text | lowercase }}
{{ text | titlecase }}

<!-- Slice (arrays & strings) -->
{{ fruits | slice:1:3 }}                <!-- ['Banana','Cherry'] -->
{{ 'Hello World' | slice:0:5 }}         <!-- Hello -->

<!-- JSON (great for debugging) -->
<pre>{{ myObj | json }}</pre>

<!-- Async — subscribes and auto-unsubscribes -->
{{ timer$ | async }}  <!-- shows current Observable value -->`,
    },
    {
      label: 'Pipe chaining',
      language: 'html',
      code: `<!-- Pipes chain left to right — each receives the previous output -->
{{ user?.name | titlecase | slice:0:10 }}

<!-- Truncate then uppercase -->
{{ longText | truncate:40 | uppercase }}

<!-- Format a date string -->
{{ isoString | date:'longDate' | uppercase }}

<!-- @let alias to avoid multiple subscriptions (Angular 18+) -->
@let user = user$ | async;
@if (user) {
  <p>{{ user.name | titlecase }}</p>
  <p>Joined: {{ user.joinedAt | date:'shortDate' }}</p>
}`,
    },
    {
      label: 'Custom pipe',
      language: 'typescript',
      code: `// src/app/pipes/truncate.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 40, trail = '…'): string {
    return value.length > limit
      ? value.slice(0, limit) + trail
      : value;
  }
}

// Import and use in component:
// imports: [TruncatePipe]
// {{ longText | truncate:50 }}
// {{ longText | truncate:20:'...' }}`,
    },
    {
      label: 'inject() in a pipe',
      language: 'typescript',
      code: `// Pipes can use inject() to access services — great for locale-aware
// or user-preference-driven formatting

@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  private formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  transform(date: Date | string): string {
    const target = typeof date === 'string' ? new Date(date) : date;
    const diffMs = target.getTime() - Date.now();
    const diffMins = Math.round(diffMs / 60_000);
    const diffHours = Math.round(diffMs / 3_600_000);
    const diffDays = Math.round(diffMs / 86_400_000);

    if (Math.abs(diffMins) < 60)  return this.formatter.format(diffMins, 'minute');
    if (Math.abs(diffHours) < 24) return this.formatter.format(diffHours, 'hour');
    return this.formatter.format(diffDays, 'day');
  }
}

// Usage: {{ post.createdAt | relativeTime }}  → "5 minutes ago"

// Injecting a service:
@Pipe({ name: 'userCurrency' })
export class UserCurrencyPipe implements PipeTransform {
  private prefs = inject(UserPreferencesService);
  private currency = inject(CurrencyPipe);

  transform(value: number): string {
    return this.currency.transform(value, this.prefs.currency()) ?? String(value);
  }
}`,
    },
    {
      label: 'Async pipe',
      language: 'typescript',
      code: `// AsyncPipe subscribes to Observables/Promises in the template
// and automatically unsubscribes when the component is destroyed

import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

export class MyComponent {
  // Observable — async pipe subscribes for you
  timer$ = interval(1000).pipe(map(n => \`Tick: \${n}\`));

  // Promise
  data$ = fetch('/api/data').then(r => r.json());
}

// Template:
// {{ timer$ | async }}

// Share a single subscription with @let (Angular 18+):
// @let data = data$ | async;
// @if (data) { {{ data | json }} }

// Key benefit: no manual subscribe/unsubscribe needed
// Key rule: each | async creates ONE subscription — use @let alias
// to avoid multiple subscriptions reading the same source`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What does the async pipe do?', options: ['Runs code asynchronously', 'Subscribes to an Observable/Promise and returns the latest value', 'Delays template rendering', 'Converts callbacks to Promises'], answer: 1, explanation: 'The async pipe subscribes automatically and unsubscribes on component destroy, preventing memory leaks.' },
    { q: 'Which pipe formats 0.75 as "75%"?', options: ['DecimalPipe', 'CurrencyPipe', 'PercentPipe', 'SlicePipe'], answer: 2, explanation: 'PercentPipe multiplies by 100 and appends %. Usage: {{ 0.75 | percent }} → "75%".' },
    { q: 'A template passes `{ name: \'Alice\' }` (an object literal created fresh in the template expression) to a pure pipe on every render. Does the pure pipe\'s memoization actually save any work here?', options: ['Yes — pure pipes always cache based on deep equality of object contents', 'No — a pure pipe compares the input by REFERENCE, and an object literal written directly in a template expression creates a brand-new object reference on every change detection cycle, so the pipe re-executes every single time despite being "pure," providing zero memoization benefit', 'The pipe throws an error when given an inline object literal', 'Pure pipes automatically convert object literals to primitives for comparison'], answer: 1, explanation: 'Pure pipe memoization is a reference-equality check (like OnPush change detection), not a deep-equality check — so it only actually saves work when the SAME object reference is passed across renders. An inline object literal `{ name: \'Alice\' }` written directly in a template expression is re-created fresh on every change detection pass, giving the pure pipe a new reference to compare against every single time, which means it re-executes every time regardless of "purity." This is a common gotcha: purity only pays off when the input comes from a stable reference (a component property, a signal value) — not from an expression that constructs a new object/array inline in the template.' },
    { q: 'How do you chain multiple pipes?', options: ['pipe1, pipe2', '{{ value | pipe1 | pipe2 }}', '{{ value.pipe1().pipe2() }}', 'Using the pipe() RxJS operator'], answer: 1, explanation: 'Pipes chain left-to-right with | symbols. Each pipe receives the previous output: {{ name | uppercase | slice:0:5 }}.' },
    { q: 'What interface must a custom pipe implement?', options: ['Pipe', 'PipeTransform', 'Transform', 'PipeHandler'], answer: 1, explanation: 'Custom pipes implement PipeTransform and its transform(value, ...args) method, decorated with @Pipe({ name: \'myPipe\' }).' },
    { q: 'How often does an impure pipe re-run?', options: ['Only when inputs change', 'Once per second', 'On every change detection cycle', 'Only on user events'], answer: 2, explanation: 'Impure pipes (pure: false) are called on every change detection cycle, regardless of whether their inputs changed. This can be very costly for large lists.' },
    { q: 'How do you use a standalone pipe in a component?', options: ['Declare it in NgModule declarations', 'Add it to the component\'s imports array', 'Register it in providers', 'Use @Injectable on the pipe class'], answer: 1, explanation: 'Standalone pipes (the default in Angular 19+) are added to the component\'s imports array directly, just like standalone components and directives.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'DatePipe', type: 'pipe', desc: 'Formats a Date value according to locale rules and Unicode date format strings.', since: '2' },
    { name: 'CurrencyPipe', type: 'pipe', desc: 'Transforms a number into a currency string, optionally with symbol and digit-info format.', since: '2' },
    { name: 'DecimalPipe', type: 'pipe', desc: 'Formats a number with a given digit-info string (minInt.minFrac-maxFrac).', since: '2' },
    { name: 'PercentPipe', type: 'pipe', desc: 'Multiplies a number by 100 and formats it as a percentage string.', since: '2' },
    { name: 'AsyncPipe', type: 'pipe', desc: 'Subscribes to an Observable or Promise in the template and auto-unsubscribes on component destroy.', since: '2' },
    { name: 'SlicePipe', type: 'pipe', desc: 'Returns a subset of an array or string using start and end indices.', since: '2' },
    { name: 'PipeTransform', type: 'interface', desc: 'Interface that custom pipe classes implement; requires a transform(value, ...args) method.', since: '2' },
    { name: '@Pipe', type: 'decorator', desc: 'Marks a class as an Angular pipe and specifies its template name and purity.', since: '2' },
    { name: 'JsonPipe', type: 'pipe', desc: 'Converts a value to its JSON string representation — useful for debugging in templates.', since: '2' },
    { name: 'TitleCasePipe', type: 'pipe', desc: 'Capitalises the first letter of each word in a string.', since: '4' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Module-based pipes vs standalone imports',
      before: '// Angular < 14: import entire CommonModule for pipes\n@NgModule({\n  imports: [CommonModule],\n  declarations: [MyComponent]\n})\nexport class AppModule {}',
      after: '// Angular 14+: import only needed pipes directly\n@Component({\n  imports: [DatePipe, CurrencyPipe, AsyncPipe],\n  template: \'{{ today | date }}\'\n})\nexport class MyComponent {}',
      note: 'Tree-shaking removes unused pipes when you import individually instead of importing all of CommonModule.',
    },
    {
      title: 'Manual subscribe vs async pipe',
      before: '// Old pattern — manual subscription, must unsubscribe\nexport class MyComponent implements OnDestroy {\n  value = \'\';\n  sub = this.svc.data$.subscribe(v => this.value = v);\n  ngOnDestroy() { this.sub.unsubscribe(); }\n}',
      after: '// Modern — async pipe handles subscribe and cleanup\nexport class MyComponent {\n  data$ = this.svc.data$;\n}\n// Template: {{ data$ | async }}',
      note: 'The async pipe eliminates boilerplate and prevents memory leaks automatically.',
    },
    {
      title: 'Class-based DI in pipe vs inject()',
      before: '// Older pattern — constructor injection\n@Pipe({ name: \'userCurrency\' })\nexport class UserCurrencyPipe implements PipeTransform {\n  constructor(private prefs: UserPreferencesService) {}\n}',
      after: '// Modern — inject() function\n@Pipe({ name: \'userCurrency\' })\nexport class UserCurrencyPipe implements PipeTransform {\n  private prefs = inject(UserPreferencesService);\n}',
      note: 'inject() works in any injection context and pairs well with standalone pipes.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mutating array input and expecting the pure pipe to update',
      wrong: 'this.fruits.push(\'Grape\');\n// SlicePipe / custom pipe won\'t re-run —\n// same array reference, pure pipe skips it',
      right: 'this.fruits = [...this.fruits, \'Grape\'];\n// New reference triggers pure pipe re-execution',
      explanation: 'Pure pipes (the default) only re-run when the input reference changes. Mutating an array or object in place will not trigger the pipe.',
    },
    {
      title: 'Using multiple async pipes on the same Observable',
      wrong: '<p>Name: {{ user$ | async }}</p>\n<p>Role: {{ user$ | async }}</p>\n<!-- Creates TWO separate subscriptions -->',
      right: '@let user = user$ | async;\n@if (user) {\n  <p>Name: {{ user.name }}</p>\n  <p>Role: {{ user.role }}</p>\n}',
      explanation: 'Each | async pipe creates its own subscription. Use an @let alias (Angular 18+) or *ngIf="user$ | async as user" to share a single subscription across the template.',
    },
    {
      title: 'Using an impure pipe for large list filtering',
      wrong: '@Pipe({ name: \'filterList\', pure: false })\n// Runs on EVERY change-detection cycle —\n// devastating for large arrays',
      right: '// Move the logic to a computed() signal in the component\nfiltered = computed(() =>\n  this.items().filter(i => i.active));',
      explanation: 'Impure pipes re-execute every CD cycle. For derived data from signals or state, use computed() instead — it memoises and only recalculates when dependencies change.',
    },
    {
      title: 'Forgetting to import a pipe in the component\'s imports array',
      wrong: '@Component({\n  template: \'{{ amount | currency }}\'\n  // imports array is missing CurrencyPipe\n})\nexport class MyComponent {}',
      right: '@Component({\n  imports: [CurrencyPipe],\n  template: \'{{ amount | currency }}\'\n})\nexport class MyComponent {}',
      explanation: 'Standalone components require every pipe to be listed in imports. Without it, Angular throws a template parse error at compile time.',
    },
    {
      title: 'Using a pipe where computed() is the better fit',
      wrong: '// Calling a method that returns filtered data in template\n// Angular must call it on every CD cycle\nget filtered() {\n  return this.items.filter(i => i.active);\n}',
      right: '// computed() memoises — only re-runs when items signal changes\nfiltered = computed(() => this.items().filter(i => i.active));',
      explanation: 'Template method calls and impure pipes re-run on every CD cycle. A computed() signal derived from other signals only re-evaluates when one of its reactive dependencies changes, giving you pure pipe semantics without any pipe boilerplate.',
    },
  ];

  challenge: Challenge = {
    title: 'WordCount Pipe',
    description: 'Create a custom pipe wordCount that counts the number of words in a string. Handle empty/null input gracefully.',
    language: 'typescript',
    hints: [
      'Implement PipeTransform with transform(value: string): number',
      'Use .trim().split(/\\s+/) to split on whitespace',
      'Return 0 for empty or null strings',
      'Decorate with @Pipe({ name: \'wordCount\', standalone: true })',
    ],
    starterCode: `import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'wordCount', standalone: true })
export class WordCountPipe implements PipeTransform {
  transform(value: string): number {
    // TODO: return word count
    return 0;
  }
}
// Usage: {{ 'Hello Angular World' | wordCount }} → 3`,
    solution: `import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'wordCount', standalone: true })
export class WordCountPipe implements PipeTransform {
  transform(value: string): number {
    if (!value?.trim()) return 0;
    return value.trim().split(/\\s+/).length;
  }
}
// Usage: {{ 'Hello Angular World' | wordCount }} → 3`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Angular pipes transform template values declaratively — chain built-ins like date/currency/async, or write custom PipeTransform classes for reusable formatting logic.',
    mustKnow: [
      'Pure pipes (default) only re-run when the input reference changes — never mutate the source array or object.',
      'The async pipe subscribes to Observables/Promises and auto-unsubscribes on destroy — always prefer it over manual subscribe().',
      'Each | async creates one subscription — use @let alias or *ngIf "as" to avoid duplicate subscriptions on the same source.',
      'Custom pipes implement PipeTransform and are decorated with @Pipe({ name, standalone: true }); add to component imports array.',
      'Impure pipes (pure: false) re-run every CD cycle — use computed() signals instead for derived state in signal-based components.',
      'Import individual pipes (DatePipe, CurrencyPipe) not CommonModule to keep bundles tree-shakeable.',
    ],
    interviewFocus: [
      'Pure vs impure pipes — when to use each and the performance implications of impure.',
      'Why the async pipe prevents memory leaks and how the subscription lifecycle works.',
      'When to choose computed() over a pipe for derived data in Angular 17+ signal-based components.',
      'How to create a custom pipe: @Pipe decorator, PipeTransform interface, and standalone import.',
    ],
  };
}
