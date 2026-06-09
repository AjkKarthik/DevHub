import { Component, signal, computed, NgZone, inject } from '@angular/core';
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
  selector: 'app-zoneless',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './zoneless.html',
  styleUrl: './zoneless.scss',
})
export class ZonelessDemo {
  private ngZone = inject(NgZone);

  qna: QnaItem[] = [
    { q: 'What is Zone.js and why might you want to remove it?', a: 'Zone.js monkey-patches async APIs to notify Angular when to run change detection. It adds ~50 kB to the bundle and has runtime overhead. Removing it (zoneless) shrinks the bundle and eliminates full-tree CD on every event.' },
    { q: 'How do you enable zoneless change detection?', a: 'Add <code>provideExperimentalZonelessChangeDetection()</code> to <code>app.config.ts</code> providers. Remove <code>zone.js</code> from <code>polyfills</code> in <code>angular.json</code>. Signals and <code>async</code> pipe now drive all CD.' },
    { q: 'What happens to setTimeout or setInterval in a zoneless app?', a: 'They no longer trigger change detection. Any state mutations inside them must use signals (<code>signal.set()</code>) or call <code>inject(ChangeDetectorRef).markForCheck()</code> to schedule a re-render.' },
    { q: 'Do all Angular features work in zoneless mode?', a: 'Most do. Signals, async pipe, and HttpClient work correctly. Third-party libraries that mutate variables directly (not via signals) and rely on Zone.js to trigger CD will break — wrap their callbacks with <code>ngZone.run()</code>.' },
    { q: 'What is the status of zoneless in Angular 22?', a: 'Zoneless was experimental in Angular 18, became stable in Angular 20, and is the recommended default for new apps in Angular 22. The <code>ng new</code> schematic offers a zoneless option.' },
    { q: 'Is signals + OnPush + zoneless redundant?', a: 'Partially. OnPush still optimises subtrees that use neither signals nor async pipe. But in a fully signal-driven app, OnPush adds little — Angular already only re-renders components whose signals changed. Use it for consistency and library compatibility.' },
  ];

  count        = signal(0);
  zoneLog      = signal<string[]>([]);
  renderCount  = signal(0);

  double = computed(() => this.count() * 2);

  increment() {
    this.count.update(n => n + 1);
    this.zoneLog.update(l => [`Signal updated → count = ${this.count()}`, ...l].slice(0, 6));
  }

  runOutsideZone() {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zoneLog.update(l => ['setTimeout outside zone — no CD triggered', ...l].slice(0, 6));
      }, 100);
    });
  }

  theory: TheoryPoint[] = [
    {
      heading: 'What is Zone.js?',
      points: [
        'Zone.js monkey-patches browser APIs (setTimeout, Promise, fetch, addEventListener) to notify Angular when async work completes.',
        'Angular uses these notifications to trigger change detection — without Zone.js, Angular would not know when to re-render.',
        'Zone.js adds ~50 kB to the bundle and has a runtime overhead of patching every async call.',
        'Every click, timer, and HTTP response in a default Angular app triggers a full change detection cycle starting from the root.',
      ],
    },
    {
      heading: 'Zoneless Angular',
      points: [
        'Add provideExperimentalZonelessChangeDetection() in app.config.ts — no Zone.js monkey-patching.',
        'Remove zone.js from polyfills in angular.json to reduce bundle size.',
        'Without zones, the ONLY way to trigger re-renders is via signals, async pipe, or manual markForCheck().',
        'Signals + OnPush + Zoneless = maximum performance — Angular only re-renders exactly what changed.',
      ],
    },
    {
      heading: 'Migration path',
      points: [
        'Add provideExperimentalZonelessChangeDetection() alongside existing providers — you can keep Zone.js during transition.',
        'Switch all state to signals — any remaining setTimeout/setInterval mutations will no longer trigger CD.',
        'Use ChangeDetectorRef.markForCheck() for third-party code that mutates state outside Angular.',
        'Eventually remove zone.js from polyfills — the app now runs without it.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Zoneless is "experimental" in Angular 18/19 — stable from Angular 20 onward.',
        'Signals are zoneless-compatible by design — they notify Angular\'s scheduler directly, not through Zone.js.',
        'Third-party libraries that mutate DOM directly may break in zoneless — wrap with ngZone.run().',
        'Zoneless apps load faster (smaller bundle) and render faster (no full-tree CD on every event).',
      ],
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'Which provider must be added to app.config.ts to enable zoneless change detection in Angular?', options: ['provideZonelessChangeDetection()', 'provideExperimentalZonelessChangeDetection()', 'disableZoneJs()', 'provideChangeDetection({ zoneless: true })'], answer: 1, explanation: 'provideExperimentalZonelessChangeDetection() is the correct provider to add to the providers array in app.config.ts. It was experimental in Angular 18 and became stable in Angular 20.' },
    { q: 'In a zoneless Angular app, what happens when you call setTimeout() and mutate a plain class property (not a signal) inside the callback?', options: ['The view updates immediately because setTimeout is still patched', 'Angular throws a runtime error about missing Zone.js', 'The mutation does not trigger change detection and the view will not update', 'The async pipe automatically re-renders the component'], answer: 2, explanation: 'Without Zone.js, setTimeout callbacks are not intercepted. Mutations to plain properties have no mechanism to notify Angular\'s scheduler, so change detection is never triggered and the view stays stale.' },
    { q: 'A third-party library directly mutates the DOM and relies on Zone.js to trigger Angular\'s CD. Your app is now zoneless. What is the correct mitigation?', options: ['Remove the library — it cannot work in zoneless mode at all', 'Wrap the library callback with ngZone.run() to re-enter Angular\'s change detection', 'Switch the component to Default change detection strategy', 'Import zone.js only in that component\'s file'], answer: 1, explanation: 'ngZone.run() re-enters Angular\'s change detection context. Even in a zoneless app, NgZone still exists and its run() method can be used to manually schedule a CD cycle for legacy third-party code.' },
    { q: 'What is the primary reason to remove zone.js from the polyfills array in angular.json after enabling zoneless mode?', options: ['Zone.js causes TypeScript compilation errors in strict mode', 'Angular 22 does not support loading both zone.js and zoneless providers simultaneously', 'Removing it reduces the bundle size by approximately 50 kB and eliminates runtime overhead from monkey-patching async APIs', 'The async pipe stops working if zone.js is still present alongside zoneless providers'], answer: 2, explanation: 'Zone.js adds roughly 50 kB to the bundle. In a fully zoneless app it provides no benefit, so removing it reduces bundle size and eliminates the overhead of monkey-patching every async API (setTimeout, Promise, fetch, addEventListener, etc.).' },
    { q: 'In the ZonelessDemo component, the computed signal `double` is defined as `computed(() => this.count() * 2)`. When will Angular re-render the template expression {{ double() }}?', options: ['On every user interaction, regardless of whether count changed', 'Only when double() is explicitly invalidated by calling double.invalidate()', 'Automatically when the count signal changes, because computed tracks its dependencies', 'Only if the component uses ChangeDetectionStrategy.Default'], answer: 2, explanation: 'Angular\'s computed() automatically tracks which signals are read during its computation. When count changes, computed marks double as stale and Angular\'s scheduler queues a re-render of any template that reads double() — no Zone.js or manual markForCheck() needed.' },
  ];

  challenge: Challenge = {
    title: 'Build a Zoneless Timer with Signal-Driven CD',
    description: 'Create a self-contained Angular component that runs a countdown timer using only signals for state. The timer must work correctly in a zoneless app — no reliance on Zone.js to trigger change detection. Implement: a `timeLeft` signal (starts at 10), a `running` computed that reflects whether the timer is active, a `start()` method that uses setInterval and updates timeLeft via signal.update(), and a `reset()` method. Display the current count and a status badge (\'Running\' / \'Stopped\'). Remember: in zoneless mode, signal.set() / signal.update() inside setInterval callbacks still notifies Angular\'s scheduler directly — no markForCheck() needed.',
    language: 'typescript',
    hints: [
      'Use signal<number>(10) for timeLeft and a separate signal<boolean>(false) for the isRunning flag.',
      'Store the interval ID in a plain private field (not a signal) so clearing it does not trigger CD.',
      'In start(), guard against double-starts by checking isRunning() before calling setInterval.',
      'In reset(), call clearInterval with the stored ID, set isRunning to false, and reset timeLeft to 10.',
    ],
    starterCode: `import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-zoneless-timer',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div class="timer-card">
      <div class="time-display">{{ timeLeft() }}</div>
      <div class="status-badge">{{ running() ? 'Running' : 'Stopped' }}</div>
      <div class="controls">
        <button (click)="start()" [disabled]="running()">Start</button>
        <button (click)="reset()">Reset</button>
      </div>
    </div>
  \`,
})
export class ZonelessTimerComponent {
  // TODO: declare timeLeft as a signal initialized to 10

  // TODO: declare isRunning as a signal initialized to false

  // TODO: declare running as a computed that returns isRunning()

  private intervalId: ReturnType<typeof setInterval> | null = null;

  start() {
    // TODO: guard if already running
    // TODO: set isRunning to true
    // TODO: set up setInterval that calls timeLeft.update() to decrement
    //       When timeLeft reaches 0, clear the interval and set isRunning to false
  }

  reset() {
    // TODO: clear any existing interval
    // TODO: reset isRunning to false
    // TODO: reset timeLeft to 10
  }
}`,
    solution: `import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-zoneless-timer',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div class="timer-card">
      <div class="time-display">{{ timeLeft() }}</div>
      <div class="status-badge">{{ running() ? 'Running' : 'Stopped' }}</div>
      <div class="controls">
        <button (click)="start()" [disabled]="running()">Start</button>
        <button (click)="reset()">Reset</button>
      </div>
    </div>
  \`,
})
export class ZonelessTimerComponent {
  timeLeft = signal<number>(10);
  isRunning = signal<boolean>(false);

  running = computed(() => this.isRunning());

  private intervalId: ReturnType<typeof setInterval> | null = null;

  start() {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.intervalId = setInterval(() => {
      this.timeLeft.update(t => {
        if (t <= 1) {
          clearInterval(this.intervalId!);
          this.intervalId = null;
          this.isRunning.set(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  reset() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning.set(false);
    this.timeLeft.set(10);
  }
}`,
  };

  quickRef: QuickRefItem[] = [
    { name: 'provideExperimentalZonelessChangeDetection', type: 'function', desc: 'Registers Angular\'s zoneless change detection scheduler in app.config.ts, replacing Zone.js-based CD.' , since: '18'},
    { name: 'signal', type: 'function', desc: 'Creates a reactive primitive that notifies Angular\'s scheduler directly when its value changes, no Zone.js required.' , since: '16'},
    { name: 'computed', type: 'function', desc: 'Derives a read-only signal from one or more other signals, automatically re-evaluating when dependencies change.' , since: '16'},
    { name: 'NgZone', type: 'class', desc: 'Service that exposes runOutsideAngular() and run() to control when Angular\'s change detection is triggered.' , since: '2'},
    { name: 'ChangeDetectorRef.markForCheck', type: 'function', desc: 'Manually schedules a re-render for a component when state changes happen outside Angular\'s reactive graph.' , since: '2'},
    { name: 'ChangeDetectionStrategy.OnPush', type: 'token', desc: 'Limits change detection to components whose inputs, signals, or async pipes have new values, complementing zoneless mode.' , since: '2'},
    { name: 'NgZone.runOutsideAngular', type: 'function', desc: 'Executes a callback outside Angular\'s change detection context, useful for high-frequency work like canvas or animation frames.' , since: '2'},
    { name: 'NgZone.run', type: 'function', desc: 'Re-enters Angular\'s change detection context from outside, used to wrap third-party library callbacks in zoneless apps.' , since: '2'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Enabling change detection: Zone.js vs Zoneless', before: `// app.config.ts (zone-based default)
import { provideZoneChangeDetection } from '@angular/core';

export const appConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true })]
};`, after: `// app.config.ts (zoneless)
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

export const appConfig = {
  providers: [provideExperimentalZonelessChangeDetection()]
  // also remove 'zone.js' from polyfills in angular.json
};`,
      note: 'Zone.js is removed from polyfills and the zoneless provider replaces zone-based CD.' },
    { title: 'State mutation: plain property vs signal', before: `// Zone-based: mutating a plain property triggers CD via Zone.js
export class CounterComponent {
  count = 0;
  increment() {
    setTimeout(() => { this.count++; }, 1000); // Zone.js intercepts setTimeout
  }
}`, after: `// Zoneless: signal.update() notifies Angular's scheduler directly
export class CounterComponent {
  count = signal(0);
  increment() {
    setTimeout(() => { this.count.update(n => n + 1); }, 1000); // no Zone.js needed
  }
}`,
      note: 'In zoneless mode, only signal mutations (or markForCheck) schedule re-renders.' },
    { title: 'Third-party library interop: relying on Zone.js vs ngZone.run()', before: `// Zone-based: library callback auto-triggers CD via Zone.js monkey-patch
export class MapComponent {
  onMarkerClick(data: any) {
    this.selectedPlace = data.name; // Zone.js detects this mutation
  }
}`, after: `// Zoneless: wrap library callback with ngZone.run() to schedule CD
export class MapComponent {
  private ngZone = inject(NgZone);
  onMarkerClick(data: any) {
    this.ngZone.run(() => { this.selectedPlace.set(data.name); });
  }
}`,
      note: 'ngZone.run() is the escape hatch for third-party code that does not use signals.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Mutating plain class properties in setTimeout/setInterval', wrong: `// Zoneless app — view never updates!
count = 0;
increment() {
  setTimeout(() => { this.count++; }, 500);
}`, right: `count = signal(0);
increment() {
  setTimeout(() => { this.count.update(n => n + 1); }, 500);
}`, explanation: 'Without Zone.js, plain property mutations inside async callbacks have no mechanism to notify Angular\'s scheduler. All mutable state must be wrapped in signals.'  },
    { title: 'Keeping zone.js in polyfills after enabling zoneless', wrong: `// angular.json — zone.js still loaded, wasting ~50 kB
"polyfills": ["zone.js"]`, right: `// angular.json — remove it after switching to zoneless
"polyfills": []`, explanation: 'Loading Zone.js alongside zoneless providers wastes ~50 kB of bundle size and adds monkey-patching overhead. Remove it once all state is signal-driven.'  },
    { title: 'Assuming signals inside runOutsideAngular won\'t trigger CD', wrong: `this.ngZone.runOutsideAngular(() => {
  // Mistakenly thinking signal.set() is also suppressed
  this.count.set(5); // This WILL still trigger CD!
});`, right: `// Use a plain variable for work that must NOT trigger CD
this.ngZone.runOutsideAngular(() => {
  this.localFrameCount++; // plain field, no CD
  requestAnimationFrame(this.draw);
});`, explanation: 'signal.set() always notifies Angular\'s scheduler regardless of zone context. Use plain fields for high-frequency work like animation frames where you explicitly want to avoid CD.'  },
    { title: 'Forgetting to wrap third-party library callbacks with ngZone.run()', wrong: `// Zoneless app — library callback mutates signal but from wrong context
thirdPartyLib.onEvent((data) => {
  this.result.set(data); // may silently fail to schedule CD in some libs
});`, right: `thirdPartyLib.onEvent((data) => {
  this.ngZone.run(() => this.result.set(data));
});`, explanation: 'Some third-party libraries run callbacks in contexts that bypass Angular entirely. Wrapping with ngZone.run() guarantees Angular\'s scheduler is notified even when the library does not use signals.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '18', label: 'Experimental Zoneless', features: ['provideExperimentalZonelessChangeDetection() introduced as opt-in provider', 'Signals (stable since v17) become the primary CD mechanism without Zone.js', 'Removing zone.js from polyfills officially supported alongside the new provider'] },
    { version: '20', label: 'Zoneless Stable', features: ['Zoneless change detection graduates from experimental to stable', 'Recommended default for new Angular applications', 'ng new schematic offers a --zoneless flag to scaffold without Zone.js'] },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'typescript',
      code: `// app.config.ts
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideExperimentalZonelessChangeDetection(),  // ← add this
    // Remove provideZone() if present
  ],
};

// angular.json — remove zone.js from polyfills:
// "polyfills": ["zone.js"]  →  "polyfills": []`,
    },
    {
      label: 'Why signals work',
      language: 'typescript',
      code: `// Without zones, signals notify Angular's internal scheduler directly
// via a micro-task — Angular schedules a re-render of only the
// components that read the changed signal.

@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
export class MyComponent {
  count = signal(0);  // ← Angular tracks reads of this signal

  // Template: {{ count() }}
  // When count.set(1) is called:
  //   1. Signal marks template as dirty
  //   2. Angular scheduler queues a re-render (micro-task)
  //   3. Only this component re-renders — nothing else

  increment() {
    this.count.update(n => n + 1);
    // No Zone.js needed — signal triggers CD automatically
  }
}`,
    },
    {
      label: 'runOutsideAngular',
      language: 'typescript',
      code: `import { NgZone, inject } from '@angular/core';

// Even in zoneless apps, NgZone.runOutsideAngular still exists
// Use it when you want to prevent CD (e.g. animation frames, canvas updates)

export class CanvasComponent {
  private ngZone = inject(NgZone);

  startAnimation() {
    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        this.draw();  // no Angular CD on each frame
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    });
  }

  // To update a signal from outside zone (triggers CD):
  updateFromOutside() {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        // signal.set() always notifies Angular regardless of zone
        this.count.update(n => n + 1);
      }, 1000);
    });
  }
}`,
    },
  ];
}
