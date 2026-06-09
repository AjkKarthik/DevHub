import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { DefaultCdComponent } from './default-cd/default-cd';
import { OnpushCdComponent } from './onpush-cd/onpush-cd';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

@Component({
  selector: 'app-change-detection',
  imports: [CodeBlockComponent, TheoryBlockComponent, DefaultCdComponent, OnpushCdComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './change-detection.html',
  styleUrl: './change-detection.scss',
})
export class ChangeDetectionDemo {
  sharedCount = signal(0);
  mutableObj  = { value: 0 };
  renderLog   = signal<string[]>([]);

  private log(msg: string) {
    this.renderLog.update(l => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l].slice(0, 10));
  }

  mutateObject() {
    this.mutableObj.value++;
    this.log('Mutated object (same reference) — OnPush WON\'T re-render');
  }

  replaceObject() {
    this.mutableObj = { value: this.mutableObj.value + 1 };
    this.log('Replaced object (new reference) — OnPush WILL re-render');
  }

  qna: QnaItem[] = [
    { q: 'What is the difference between Default and OnPush change detection?', a: '<strong>Default:</strong> Angular checks the component on every change detection cycle triggered by any event. <strong>OnPush:</strong> Angular only checks when an input reference changes, an event occurs inside the component, or a signal changes.' },
    { q: 'Why does mutating an array not trigger OnPush re-render?', a: 'OnPush compares input references. Pushing to an existing array does not change its reference — Angular sees the same array object and skips the re-render. Always replace: <code>this.items = [...this.items, newItem]</code>.' },
    { q: 'Do signals work with OnPush automatically?', a: 'Yes — signals notify Angular\'s scheduler directly when they change, triggering re-render of only the components that read them, regardless of OnPush or Default strategy. OnPush + signals = zero manual <code>markForCheck()</code>.' },
    { q: 'What is markForCheck() and when do you need it?', a: '<code>inject(ChangeDetectorRef).markForCheck()</code> tells Angular to check an OnPush component on the next cycle. Use it when state changes come from outside Angular\'s zone (third-party library callbacks, WebSocket messages not using signals).' },
    { q: 'Can you mix Default and OnPush components in the same tree?', a: 'Yes — and it\'s common. OnPush components act as barriers: they skip re-checking unless their inputs change or an event fires. Parent Default components still re-render normally; the OnPush children skip.' },
    { q: 'What is detachChangeDetector() used for?', a: '<code>cdRef.detach()</code> completely removes a component from the change detection tree. Use for extremely performance-sensitive components (e.g. canvas animation) where you manage rendering manually via <code>cdRef.detectChanges()</code>.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'How change detection works',
      points: [
        'Angular\'s change detection (CD) is a tree walk that checks if any component\'s bound values changed.',
        '<strong>Default strategy</strong>: Angular checks every component on every async event (click, HTTP, timer, promise).',
        '<strong>OnPush strategy</strong>: Angular skips a component unless one of its specific triggers fires.',
        'The CD tree starts at the root and propagates downward — a detached subtree is never checked.',
      ],
    },
    {
      heading: 'OnPush re-render triggers',
      points: [
        'An <code>input()</code> receives a new object/array reference (mutation of the same object does NOT trigger it).',
        'An event (click, keydown, etc.) originates from inside the component or its children.',
        'An <code>Observable</code> piped through the <code>async</code> pipe emits a new value.',
        '<code>markForCheck()</code> or <code>detectChanges()</code> is called manually.',
        'A <code>signal()</code> the template reads changes — the most granular trigger in Angular 17+.',
      ],
    },
    {
      heading: 'Signals + OnPush — the recommended pattern',
      points: [
        'Signals are deeply integrated: Angular tracks which template reads which signals and only re-renders that component.',
        'No <code>markForCheck()</code> needed when state is in <code>signal()</code> — Angular handles it automatically.',
        'Use <code>input()</code> (signal input) instead of <code>@Input()</code>: it is reference-aware and works perfectly with OnPush.',
        'Migration: add <code>changeDetection: ChangeDetectionStrategy.OnPush</code> + convert state to signals. That\'s it.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Object <strong>mutation</strong> (push to array, set a property) is invisible to OnPush — always create new references.',
        '<code>ChangeDetectorRef.detach()</code> fully removes a component from the CD tree — use only for performance-critical cases.',
        'OnPush does not affect child components — each child must declare its own strategy.',
        'In production builds, zone.js is still present unless you opt into zoneless with <code>provideExperimentalZonelessChangeDetection()</code>.',
      ],
    },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Default vs OnPush',
      language: 'typescript',
      code: `// Default: checks EVERY component on EVERY event (click, timer, HTTP...)
@Component({ changeDetection: ChangeDetectionStrategy.Default })
export class DefaultComponent { }

// OnPush: only re-renders when:
//  1. An @Input() reference changes (new object/array, not mutation)
//  2. An event fires INSIDE this component
//  3. An Observable via async pipe emits
//  4. markForCheck() / detectChanges() called manually
//  5. A signal() it reads changes  ← Angular 17+, best approach
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class FastComponent { }

// Rule: use OnPush on every component + signals for state
// → Angular only re-renders the exact components that need it`,
    },
    {
      label: 'ChangeDetectorRef',
      language: 'typescript',
      code: `import { ChangeDetectorRef, inject } from '@angular/core';

@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class MyComponent {
  private cdr = inject(ChangeDetectorRef);
  data: string[] = [];

  // Called outside Angular zone (WebSocket, setInterval, etc.)
  onSocketMessage(msg: string) {
    this.data.push(msg);
    this.cdr.markForCheck();   // schedule re-check on next CD cycle
  }

  // Synchronously re-render this component subtree right now
  forceNow() { this.cdr.detectChanges(); }

  // Pause / resume CD entirely (rare — advanced optimisation)
  freeze()   { this.cdr.detach(); }
  unfreeze() { this.cdr.reattach(); }
}`,
    },
    {
      label: 'Signals + OnPush',
      language: 'typescript',
      code: `// Signals + OnPush = maximum granularity with minimum effort.
// No markForCheck() needed when reading signals in the template.

@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class SignalComponent {
  count  = signal(0);
  double = computed(() => this.count() * 2);
  // Template: {{ count() }} {{ double() }}
  // Angular tracks these reads and only re-renders THIS component
  // when count changes. Sibling components are untouched.
}

// Migration path from Default to OnPush:
// 1. Add changeDetection: ChangeDetectionStrategy.OnPush
// 2. Replace mutable state with signal()
// 3. Replace @Input() with input()  ← signal input, auto-tracked
// → Done. Zero manual markForCheck() calls needed.`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'When does an OnPush component re-render?', options: ['On every browser event anywhere', 'Only when input reference changes, an internal event fires, or a signal updates', 'Never automatically', 'Only when markForCheck() is called manually'], answer: 1, explanation: 'OnPush skips most CD cycles. Triggers: (1) @Input/@input() reference changes, (2) events inside the component, (3) signal changes, (4) async pipe emits, (5) explicit markForCheck().' },
    { q: 'Does array.push() trigger re-render in an OnPush component?', options: ['Yes, Angular tracks array contents', 'No — same array reference, OnPush skips the check', 'Only if the array is wrapped in a signal', 'Yes, but with a delay'], answer: 1, explanation: 'OnPush compares references. push() mutates the existing array, so the reference is unchanged — Angular skips the check. Always replace: items = [...items, newItem].' },
    { q: 'Do signals work with OnPush automatically?', options: ['No — you must call markForCheck()', 'Yes — signals notify Angular\'s scheduler directly, no zone needed', 'Only with async pipe', 'Only in Angular 22+'], answer: 1, explanation: 'Signals integrate with Angular\'s reactive graph. When a signal changes, Angular marks only the components that read it for re-check, regardless of strategy.' },
    { q: 'What does cdRef.detach() do?', options: ['Destroys the component', 'Removes the component from the CD tree entirely — no automatic checks', 'Pauses CD for 1 cycle', 'Makes the component OnPush'], answer: 1, explanation: 'detach() completely opts a component out of automatic CD. You must manually call detectChanges() to update it. Used for performance-critical rendering.' },
    { q: 'Why is OnPush + signals the recommended pattern?', options: ['It\'s required in Angular 22', 'Signals skip zoneless re-checks while OnPush prevents parent-triggered CD — zero manual overhead', 'OnPush is faster even without signals', 'It reduces bundle size'], answer: 1, explanation: 'Together: OnPush prevents unnecessary top-down CD passes, and signals pinpoint exactly which components need updating. The result is near-surgical re-rendering.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'ChangeDetectionStrategy.OnPush', type: 'class', desc: 'Tells Angular to skip change detection for a component unless an input reference changes, an internal event fires, or a signal updates.' , since: '2'},
    { name: 'ChangeDetectionStrategy.Default', type: 'class', desc: 'Checks the component on every change detection cycle triggered by any async event anywhere in the app.' , since: '2'},
    { name: 'ChangeDetectorRef', type: 'class', desc: 'Injectable ref that lets you manually control a component\'s place in the change detection tree via markForCheck(), detectChanges(), detach(), and reattach().' , since: '2'},
    { name: 'markForCheck', type: 'function', desc: 'Schedules an OnPush component for re-check on the next change detection cycle; needed when state changes outside Angular\'s zone.' , since: '2'},
    { name: 'detectChanges', type: 'function', desc: 'Synchronously runs change detection for a component and its subtree right now, bypassing the normal scheduler.' , since: '2'},
    { name: 'detach', type: 'function', desc: 'Removes a component from the change detection tree entirely so it is never automatically checked; you must call detectChanges() manually.' , since: '2'},
    { name: 'signal', type: 'function', desc: 'Creates a reactive primitive that notifies Angular\'s scheduler when its value changes, triggering surgical re-renders of only the components that read it.' , since: '16'},
    { name: 'computed', type: 'function', desc: 'Derives a read-only signal whose value is recalculated lazily whenever its signal dependencies change.' , since: '16'},
    { name: 'input', type: 'function', desc: 'Signal-based replacement for @Input() that exposes a read-only signal, works perfectly with OnPush, and eliminates the need for ngOnChanges.' , since: '17'},
    { name: 'provideExperimentalZonelessChangeDetection', type: 'function', desc: 'Removes zone.js entirely and relies solely on signals and explicit scheduler notifications for change detection.' , since: '18'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: '@Input() decorator vs input() signal', before: `import { Component, Input } from '@angular/core';

@Component({ selector: 'app-card' })
export class CardComponent {
  @Input() title: string = '';
  ngOnChanges() { /* react to changes */ }
}`, after: `import { Component, input, effect } from '@angular/core';

@Component({ selector: 'app-card' })
export class CardComponent {
  title = input('');
  constructor() {
    effect(() => { this.title(); /* react */ });
  }
}`,
      note: 'input() returns a read-only signal — no ngOnChanges needed, OnPush-friendly by default.' },
    { title: 'ChangeDetectorRef.markForCheck() vs signals', before: `import { ChangeDetectorRef, inject } from '@angular/core';

export class MyComponent {
  private cdr = inject(ChangeDetectorRef);
  data: string[] = [];

  onSocketMessage(msg: string) {
    this.data.push(msg);
    this.cdr.markForCheck();
  }
}`, after: `import { signal } from '@angular/core';

export class MyComponent {
  data = signal<string[]>([]);

  onSocketMessage(msg: string) {
    this.data.update(prev => [...prev, msg]);
    // no markForCheck() needed — signal notifies Angular
  }
}`,
      note: 'Signals eliminate manual markForCheck() calls by notifying the scheduler automatically.' },
    { title: 'Default strategy vs OnPush + signals', before: `// Every event re-checks ALL components in the tree
@Component({
  selector: 'app-counter',
  // no changeDetection specified = Default
})
export class CounterComponent {
  count = 0;
  increment() { this.count++; }
}`, after: `import { ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent {
  count = signal(0);
  increment() { this.count.update(n => n + 1); }
}`,
      note: 'OnPush + signal means Angular re-renders only this component and only when count actually changes.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Mutating an object/array instead of replacing it', wrong: `// OnPush will NOT re-render — same array reference
this.items.push(newItem);
this.obj.value = 42;`, right: `// OnPush sees a new reference and re-renders
this.items = [...this.items, newItem];
this.obj = { ...this.obj, value: 42 };`, explanation: 'OnPush uses reference equality. Mutating an existing object or array keeps the same reference, so Angular skips the check. Always create new references.'  },
    { title: 'Forgetting markForCheck() when updating from outside Angular\'s zone', wrong: `// WebSocket callback — outside zone, OnPush won't see it
this.ws.onmessage = (e) => {
  this.messages.push(e.data);
};`, right: `// Signal or markForCheck() makes Angular aware
this.ws.onmessage = (e) => {
  this.messages.update(m => [...m, e.data]);
};`, explanation: 'Callbacks from non-Angular async APIs (WebSocket, setTimeout outside NgZone) do not trigger CD. Use signals or explicitly call markForCheck().'  },
    { title: 'Assuming OnPush propagates to child components', wrong: `// Parent is OnPush — does NOT make children OnPush
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class ParentComponent { }
// ChildComponent still uses Default strategy`, right: `// Each component must declare its own strategy
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class ChildComponent { }`, explanation: 'Change detection strategy is per-component, not inherited. Every component in the tree must explicitly opt into OnPush.'  },
    { title: 'Using ngOnChanges with signal inputs (input())', wrong: `export class MyComponent implements OnChanges {
  title = input('');
  ngOnChanges() { /* never called for signal inputs */ }
}`, right: `export class MyComponent {
  title = input('');
  constructor() {
    effect(() => { console.log(this.title()); });
  }
}`, explanation: 'ngOnChanges only fires for @Input() decorator-based inputs. Signal inputs (input()) require effect() or computed() to react to changes.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '16', label: 'Signals introduced', features: ['signal() and computed() available as developer preview', 'Templates can read signals — Angular tracks dependencies automatically', 'OnPush components re-render surgically when a signal they read changes', 'No markForCheck() required for signal-based state'] },
    { version: '17', label: 'Signal inputs and zoneless preview', features: ['input() signal input replaces @Input() decorator', 'Stable signal APIs — signal(), computed(), effect() promoted to stable', 'provideExperimentalZonelessChangeDetection() available for zone-free apps', 'linkedSignal() and resource() added in Angular 19 for async signal patterns'] },
  ];

  challenge: Challenge = {
    title: 'Migrate to OnPush + Signals',
    description: 'Convert this Default component to use OnPush change detection and replace @Input() with input() signal. The render counter should increment only when needed.',
    language: 'typescript',
    hints: [
      'Add changeDetection: ChangeDetectionStrategy.OnPush to @Component',
      'Replace @Input() title: string with title = input(\'\')',
      'Replace ngOnChanges with an effect() if you need to react to changes',
      'No markForCheck() needed — signals handle it'
    ],
    starterCode: `import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  // TODO: add OnPush
  template: \`<div>{{ title }} — rendered {{ renders }} times</div>\`,
})
export class CardComponent implements OnChanges {
  @Input() title: string = '';
  renders = 0;

  ngOnChanges() { this.renders++; }
}`,
    solution: `import { Component, input, effect, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<div>{{ title() }} — rendered {{ renders() }} times</div>\`,
})
export class CardComponent {
  title = input('');
  renders = signal(0);

  constructor() {
    effect(() => {
      this.title(); // track title changes
      this.renders.update(n => n + 1);
    });
  }
}`,
  };
}
