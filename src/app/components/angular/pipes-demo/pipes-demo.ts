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
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

@Component({
  selector: 'app-pipes-demo',
  imports: [
    AsyncPipe, DatePipe, CurrencyPipe, DecimalPipe, PercentPipe,
    UpperCasePipe, LowerCasePipe, TitleCasePipe, SlicePipe, JsonPipe,
    FormsModule, TruncatePipe, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent,
    QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent,
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
  longText  = signal('Angular is a platform and framework for building single-page client applications using HTML and TypeScript');
  truncateAt = signal(60);

  theory: TheoryPoint[] = [
  {
    heading: 'What are pipes?',
    points: [
      'Pipes transform data in templates without changing the source: <code>{{ value | pipeName:arg1:arg2 }}</code>.',
      'They are pure by default: Angular only re-runs a pipe when the input reference changes (not mutation).',
      'Chain pipes: <code>{{ value | date | uppercase }}</code> — output of each feeds into the next.',
      'Pipes are tree-shakeable standalone classes — import only what you use in the component\'s <code>imports</code> array.',
    ],
  },
  {
    heading: 'Key built-in pipes',
    points: [
      '<code>date</code>: <code>{{ d | date:\'MMM d, y\' }}</code>. Format strings follow Unicode Date Format patterns.',
      '<code>currency</code>: <code>{{ amount | currency:\'USD\':\'symbol\':\'1.2-2\' }}</code>. Locale-aware formatting.',
      '<code>number</code>: <code>{{ n | number:\'1.0-2\' }}</code> — min integer digits, min-max decimal digits.',
      '<code>async</code>: subscribes to an Observable/Promise and unwraps the latest value. Auto-unsubscribes on destroy.',
    ],
  },
  {
    heading: 'Custom pipes',
    points: [
      'Decorate a class with <code>@Pipe({ name: \'myPipe\', standalone: true })</code> and implement <code>PipeTransform</code>.',
      'The <code>transform(value, ...args)</code> method is called by Angular — return the transformed value.',
      'Pure pipes (default): Angular only calls <code>transform</code> when the input reference changes — very efficient.',
      'Impure pipes (<code>pure: false</code>): called every CD cycle — use only when the transformation depends on external mutable state.',
    ],
  },
  {
    heading: 'Key points to remember',
    points: [
      'Never mutate the input inside a pure pipe — return a new value instead, or Angular will not re-run the pipe.',
      'The <code>async</code> pipe is preferred over manual <code>subscribe()</code> in templates — it handles cleanup automatically.',
      'For heavy transformations (sorting, filtering large arrays), use <code>computed()</code> in the component instead of an impure pipe.',
      'Pipes cannot inject services in their constructor without being registered in <code>providers</code> or using <code>inject()</code>.',
    ],
  },
];

  qna: QnaItem[] = [
    { q: 'What is a pure pipe and why does it matter for performance?', a: 'A pure pipe only re-executes when its input <strong>reference</strong> changes (default). Angular memoises the result. An impure pipe (<code>pure: false</code>) runs on every change detection cycle — avoid unless necessary.' },
    { q: 'How do you create a custom pipe?', a: 'Implement <code>PipeTransform</code>: <code>transform(value: string, maxLen: number): string { return value.slice(0, maxLen); }</code>. Decorate with <code>@Pipe({ name: \'truncate\', standalone: true })</code>. Import it where used.' },
    { q: 'Why does the async pipe prevent memory leaks?', a: 'The async pipe subscribes when the component renders and <strong>automatically unsubscribes</strong> when the component is destroyed — you never need to manage the subscription manually.' },
    { q: 'Can you chain multiple pipes?', a: 'Yes: <code>{{ value | date:\'shortDate\' | uppercase }}</code>. Each pipe receives the output of the previous one. Be careful with order — <code>currency | lowercase</code> would lowercase a currency symbol unintentionally.' },
    { q: 'When would you use the json pipe?', a: 'During development to inspect objects in the template: <code>{{ myObject | json }}</code>. It\'s a quick debugging tool. Remove it before production — it exposes your full object structure to the DOM.' },
    { q: 'What is the difference between date and DatePipe locale?', a: 'DatePipe uses the locale provided to the app via <code>LOCALE_ID</code>. Set it with <code>{ provide: LOCALE_ID, useValue: \'fr-FR\' }</code>. Without it, dates default to <code>en-US</code> format.' },
  ];

  tabs: CodeTab[] = [
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
      code: `<!-- Pipes can be chained left to right -->
{{ user?.name | titlecase | slice:0:10 }}

<!-- Truncate then uppercase -->
{{ longText | truncate:40 | uppercase }}

<!-- Format a date string -->
{{ isoString | date:'longDate' | uppercase }}

<!-- Conditional display with pipe -->
<p>{{ amount | currency:code }}</p>`,
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
      code: `// Pipes can use inject() to access services — great for formatting
// that depends on locale, currency, or user preferences

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

// Usage:
// {{ post.createdAt | relativeTime }}  → "5 minutes ago", "yesterday", "in 3 days"

// Another example — currency from user preferences service:
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
// <p>{{ timer$ | async }}</p>
// <div *ngIf="data$ | async as data">{{ data | json }}</div>

// Key benefit: no manual subscribe/unsubscribe needed
// Key rule: each | async creates ONE subscription — use 'as' alias
// to avoid multiple subscriptions in one template`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What does the async pipe do?', options: ['Runs code asynchronously', 'Subscribes to an Observable/Promise and returns the latest value', 'Delays template rendering', 'Converts callbacks to Promises'], answer: 1, explanation: 'The async pipe subscribes automatically and unsubscribes on component destroy, preventing memory leaks.' },
    { q: 'Which pipe formats 0.75 as "75%"?', options: ['DecimalPipe', 'CurrencyPipe', 'PercentPipe', 'SlicePipe'], answer: 2, explanation: 'PercentPipe multiplies by 100 and appends %. Usage: {{ 0.75 | percent }} → "75%".' },
    { q: 'What is a "pure" pipe?', options: ['A pipe with no side effects', 'A pipe that only re-runs when input reference changes', 'A pipe that returns a string', 'A pipe that is stateless'], answer: 1, explanation: 'Pure pipes (default) only re-execute when the input reference changes. Impure pipes (pure: false) re-run on every CD cycle.' },
    { q: 'How do you chain multiple pipes?', options: ['pipe1, pipe2', '{{ value | pipe1 | pipe2 }}', '{{ value.pipe1().pipe2() }}', 'Using the pipe() RxJS operator'], answer: 1, explanation: 'Pipes chain left-to-right with | symbols. Each pipe receives the previous output: {{ name | uppercase | slice:0:5 }}.' },
    { q: 'What interface must a custom pipe implement?', options: ['Pipe', 'PipeTransform', 'Transform', 'PipeHandler'], answer: 1, explanation: 'Custom pipes implement PipeTransform and its transform(value, ...args) method, decorated with @Pipe({ name: \'myPipe\' }).' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'DatePipe', type: 'pipe', desc: 'Formats a Date value according to locale rules and Unicode date format strings.' , since: '2'},
    { name: 'CurrencyPipe', type: 'pipe', desc: 'Transforms a number into a currency string, optionally with symbol and digit-info format.' , since: '2'},
    { name: 'DecimalPipe', type: 'pipe', desc: 'Formats a number with a given digit-info string (minInt.minFrac-maxFrac).' , since: '2'},
    { name: 'PercentPipe', type: 'pipe', desc: 'Multiplies a number by 100 and formats it as a percentage string.' , since: '2'},
    { name: 'AsyncPipe', type: 'pipe', desc: 'Subscribes to an Observable or Promise in the template and auto-unsubscribes on component destroy.' , since: '2'},
    { name: 'SlicePipe', type: 'pipe', desc: 'Returns a subset of an array or string using start and end indices.' , since: '2'},
    { name: 'PipeTransform', type: 'interface', desc: 'Interface that custom pipe classes implement; requires a transform(value, ...args) method.' , since: '2'},
    { name: '@Pipe', type: 'decorator', desc: 'Marks a class as an Angular pipe and specifies its template name and purity.' , since: '2'},
    { name: 'JsonPipe', type: 'pipe', desc: 'Converts a value to its JSON string representation — useful for debugging in templates.' , since: '2'},
    { name: 'TitleCasePipe', type: 'pipe', desc: 'Capitalises the first letter of each word in a string.' , since: '4'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Module-based pipes vs standalone imports', before: '// Angular < 14: import entire CommonModule for pipes\n@NgModule({\n  imports: [CommonModule],\n  declarations: [MyComponent]\n})\nexport class AppModule {}', after: '// Angular 14+: import only needed pipes directly\n@Component({\n  imports: [DatePipe, CurrencyPipe, AsyncPipe],\n  template: \'{{ today | date }}\'\n})\nexport class MyComponent {}',
      note: 'Tree-shaking removes unused pipes when you import individually instead of importing all of CommonModule.' },
    { title: 'Manual subscribe vs async pipe', before: '// Old pattern — manual subscription, must unsubscribe\nexport class MyComponent implements OnDestroy {\n  value = \'\';\n  sub = this.svc.data$.subscribe(v => this.value = v);\n  ngOnDestroy() { this.sub.unsubscribe(); }\n}', after: '// Modern — async pipe handles subscribe and cleanup\nexport class MyComponent {\n  data$ = this.svc.data$;\n}\n// Template: {{ data$ | async }}',
      note: 'The async pipe eliminates boilerplate and prevents memory leaks automatically.' },
    { title: 'Class-based DI in pipe vs inject()', before: '// Older pattern — constructor injection\n@Pipe({ name: \'userCurrency\' })\nexport class UserCurrencyPipe implements PipeTransform {\n  constructor(private prefs: UserPreferencesService) {}\n}', after: '// Modern — inject() function\n@Pipe({ name: \'userCurrency\' })\nexport class UserCurrencyPipe implements PipeTransform {\n  private prefs = inject(UserPreferencesService);\n}',
      note: 'inject() works in any injection context and pairs well with standalone pipes.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Mutating array input and expecting the pure pipe to update', wrong: 'this.fruits.push(\'Grape\');\n// SlicePipe / custom pipe won\'t re-run —\n// same array reference, pure pipe skips it', right: 'this.fruits = [...this.fruits, \'Grape\'];\n// New reference triggers pure pipe re-execution', explanation: 'Pure pipes (the default) only re-run when the input reference changes. Mutating an array or object in place will not trigger the pipe.'  },
    { title: 'Using multiple async pipes on the same Observable', wrong: '<p>Name: {{ user$ | async }}</p>\n<p>Role: {{ user$ | async }}</p>\n<!-- Creates TWO separate subscriptions -->', right: '<ng-container *ngIf=\'user$ | async as user\'>\n  <p>Name: {{ user.name }}</p>\n  <p>Role: {{ user.role }}</p>\n</ng-container>', explanation: 'Each | async pipe creates its own subscription. Use an \'as\' alias inside *ngIf or @if to share a single subscription across the template.'  },
    { title: 'Using an impure pipe for large list filtering', wrong: '@Pipe({ name: \'filterList\', pure: false })\n// Runs on EVERY change-detection cycle —\n// devastating for large arrays', right: '// Move the logic to a computed() signal in the component\nfiltered = computed(() =>\n  this.items().filter(i => i.active));', explanation: 'Impure pipes re-execute every CD cycle. For derived data from signals or state, use computed() instead — it memoises and only recalculates when dependencies change.'  },
    { title: 'Forgetting to import a pipe in the component\'s imports array', wrong: '@Component({\n  template: \'{{ amount | currency }}\'\n  // imports array is missing CurrencyPipe\n})\nexport class MyComponent {}', right: '@Component({\n  imports: [CurrencyPipe],\n  template: \'{{ amount | currency }}\'\n})\nexport class MyComponent {}', explanation: 'Standalone components require every pipe to be listed in imports. Without it, Angular throws a template parse error at compile time.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '14', label: 'Standalone pipes', features: ['Pipes can be declared with standalone: true (now the default in v19+) and imported directly into a component\'s imports array', 'Eliminates the need to declare pipes in an NgModule', 'Works with tree-shaking — only imported pipes are bundled'] },
    { version: '16', label: 'inject() in pipes', features: ['The inject() function can be used inside a pipe class body instead of constructor injection', 'Allows pipes to access services, LOCALE_ID, and other tokens with less boilerplate', 'Pairs naturally with standalone pipes that have no NgModule provider context'] },
  ];

  challenge: Challenge = {
    title: 'WordCount Pipe',
    description: 'Create a custom pipe wordCount that counts the number of words in a string. Handle empty/null input gracefully.',
    language: 'typescript',
    hints: [
      'Implement PipeTransform with transform(value: string): number',
      'Use .trim().split(/\\s+/) to split on whitespace',
      'Return 0 for empty or null strings',
      'Decorate with @Pipe({ name: \'wordCount\', standalone: true })'
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
}
