import { Component, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subject, fromEvent } from 'rxjs';
import { map, scan } from 'rxjs/operators';
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
  selector: 'app-destroy-ref',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './destroy-ref.html',
  styleUrl: './destroy-ref.scss',
})
export class DestroyRefDemo implements OnInit {
  private destroyRef = inject(DestroyRef);

  qna: QnaItem[] = [
    { q: 'What is DestroyRef?', a: 'An injectable token that lets you register cleanup callbacks: <code>inject(DestroyRef).onDestroy(() => cleanup())</code>. Fires when the host component/service/directive is destroyed. Replaces <code>ngOnDestroy</code> for cleanup logic.' },
    { q: 'What is takeUntilDestroyed() and how does it differ from takeUntil(destroy$)?', a: '<code>takeUntilDestroyed()</code> automatically uses the current injection context\'s <code>DestroyRef</code> — no Subject, no <code>ngOnDestroy</code>, no manual complete(). <code>takeUntil(destroy$)</code> requires a Subject and manual <code>destroy$.next(); destroy$.complete()</code> in <code>ngOnDestroy</code>.' },
    { q: 'Can takeUntilDestroyed() be used inside a method?', a: 'Yes — but you must inject <code>DestroyRef</code> first and pass it explicitly: <code>takeUntilDestroyed(this.destroyRef)</code>. Without the argument, <code>takeUntilDestroyed()</code> must be called during construction (field init or constructor).' },
    { q: 'Can multiple onDestroy callbacks be registered?', a: 'Yes — each call to <code>destroyRef.onDestroy(fn)</code> adds another callback. All registered callbacks run when the host is destroyed, in the order they were registered.' },
    { q: 'Does DestroyRef work in services?', a: 'Yes — inject <code>DestroyRef</code> in any service. The callbacks fire when the service scope is destroyed: for root services, on app shutdown; for component-scoped services, when the component is destroyed.' },
    { q: 'What is the return value of DestroyRef.onDestroy()?', a: 'It returns a cleanup function: calling it removes the registered callback. Store it if you need to cancel the cleanup registration before the component is destroyed: <code>const cancel = destroyRef.onDestroy(() => cleanup()); cancel();</code>' },
  ];

  timerCount   = signal(0);
  eventCount   = signal(0);
  cleanupLog   = signal<string[]>([]);
  timerRunning = signal(false);

  private timerSub: ReturnType<typeof interval.prototype.subscribe> | null = null;

  ngOnInit() {
    this.destroyRef.onDestroy(() => {
      this.cleanupLog.update(l => [...l, 'DestroyRef.onDestroy() fired — component destroyed']);
    });
  }

  startTimer() {
    if (this.timerRunning()) return;
    this.timerRunning.set(true);
    interval(1000)
      .pipe(
        map(n => n + 1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(n => this.timerCount.set(n));
  }

  theory: TheoryPoint[] = [
    {
      heading: 'DestroyRef',
      points: [
        'DestroyRef is an injectable that lets you register cleanup callbacks without implementing ngOnDestroy.',
        'inject(DestroyRef).onDestroy(() => cleanup()) — works in any injection context (service, directive, function).',
        'Multiple onDestroy callbacks can be registered — all run when the host component/service is destroyed.',
        'DestroyRef replaces the need for a Subject + takeUntil(destroy$) pattern for cleanup.',
      ],
    },
    {
      heading: 'takeUntilDestroyed()',
      points: [
        'takeUntilDestroyed() is a RxJS operator that auto-completes an observable when the current injection context is destroyed.',
        'Pass destroyRef explicitly: takeUntilDestroyed(destroyRef) — works outside constructor/field initialiser.',
        'Without argument: takeUntilDestroyed() — must be called in an injection context (constructor, field init).',
        'Replaces the manual Subject destroy$ + takeUntil(this.destroy$) + ngOnDestroy pattern completely.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'takeUntilDestroyed() without argument MUST be used during construction (field initialisers, constructor).',
        'For use inside methods, inject DestroyRef first, then pass it: takeUntilDestroyed(this.destroyRef).',
        'DestroyRef.onDestroy() is additive — each call adds another callback; none override the others.',
        'Works in directives, services, and functional guards — anywhere inject() is valid.',
      ],
    },
  ];

  tabs: CodeTab[] = [
    {
      label: 'takeUntilDestroyed',
      language: 'typescript',
      code: `import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { inject, DestroyRef } from '@angular/core';

// ① In field initialiser — no argument needed
export class MyComponent {
  count = signal(0);

  // Works here because field init is part of construction
  private sub = interval(1000).pipe(
    takeUntilDestroyed(),  // ← auto-injects DestroyRef
  ).subscribe(n => this.count.set(n));
}

// ② In method — pass DestroyRef explicitly
export class MyComponent {
  private destroyRef = inject(DestroyRef);

  startPolling() {
    interval(5000).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.reload());
  }
}`,
    },
    {
      label: 'DestroyRef.onDestroy',
      language: 'typescript',
      code: `import { inject, DestroyRef } from '@angular/core';

// In a component
export class MyComponent {
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    const timer = setInterval(() => this.tick(), 1000);

    // Register cleanup — fires when component is destroyed
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }
}

// In a standalone function (utility / composable)
export function usePolling(url: string) {
  const destroyRef = inject(DestroyRef);
  const data = signal<unknown>(null);

  const id = setInterval(() => fetch(url).then(r => r.json()).then(d => data.set(d)), 5000);
  destroyRef.onDestroy(() => clearInterval(id));

  return data;
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What is the primary advantage of using DestroyRef.onDestroy() over implementing ngOnDestroy?', options: ['It runs cleanup callbacks before the component\'s view is destroyed', 'It allows registering cleanup logic in any injection context without adding ngOnDestroy to the class', 'It automatically unsubscribes all RxJS observables in the component', 'It prevents memory leaks caused by Angular\'s change detection'], answer: 1, explanation: 'DestroyRef.onDestroy() works in any injection context (services, directives, standalone functions), so you do not need to implement the ngOnDestroy lifecycle hook on the class itself. This makes cleanup logic composable and reusable.' },
    { q: 'When can takeUntilDestroyed() be called WITHOUT passing a DestroyRef argument?', options: ['Only inside ngOnDestroy()', 'Only inside class methods that are called after ngOnInit', 'During construction — in field initializers or the constructor body', 'Anywhere inside the class, as Angular infers context automatically'], answer: 2, explanation: 'takeUntilDestroyed() without an argument relies on the active injection context. That context is only available during construction (field initializers and the constructor). Calling it inside a method like ngOnInit or a custom method will throw an error unless you pass destroyRef explicitly.' },
    { q: 'What does DestroyRef.onDestroy() return, and how is it useful?', options: ['A Promise that resolves when the component is destroyed', 'An Observable that emits once on component destruction', 'A cleanup function that, when called, cancels the registered destroy callback', 'A boolean indicating whether the callback was successfully registered'], answer: 2, explanation: 'onDestroy() returns a function. Calling that returned function removes the registered callback before the component is destroyed. This lets you cancel a cleanup registration if it becomes unnecessary — for example: const cancel = destroyRef.onDestroy(fn); cancel();' },
    { q: 'You have an interval subscription started inside a method called after construction. Which approach correctly prevents a memory leak?', options: ['Use takeUntilDestroyed() with no argument inside the method', 'Inject DestroyRef as a field and pass it: takeUntilDestroyed(this.destroyRef)', 'Implement ngOnDestroy and call this.destroyRef.unsubscribe()', 'Use a Subject and call destroy$.complete() in a setTimeout'], answer: 1, explanation: 'When takeUntilDestroyed() is called outside the injection context (inside a method), it throws. You must inject DestroyRef as a class field and pass it explicitly: takeUntilDestroyed(this.destroyRef). This is exactly the pattern shown in the component.' },
    { q: 'If you call destroyRef.onDestroy() three times with three different callbacks, what happens when the component is destroyed?', options: ['Only the last registered callback runs; earlier ones are overridden', 'Only the first registered callback runs', 'Angular throws an error — only one onDestroy callback is allowed per DestroyRef', 'All three callbacks run, in the order they were registered'], answer: 3, explanation: 'DestroyRef.onDestroy() is additive. Each call registers an additional callback without removing previous ones. When the host is destroyed, all registered callbacks execute in registration order.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'DestroyRef', type: 'class', desc: 'An injectable token that lets you register cleanup callbacks which fire when the host component, directive, or service is destroyed.' , since: '16'},
    { name: 'DestroyRef.onDestroy()', type: 'function', desc: 'Registers a callback to run on destruction; returns a cancel function that removes the callback if called before destruction.' , since: '16'},
    { name: 'takeUntilDestroyed()', type: 'operator', desc: 'RxJS pipeable operator from @angular/core/rxjs-interop that auto-completes an observable when the injection context is destroyed.' , since: '16'},
    { name: 'inject(DestroyRef)', type: 'function', desc: 'Retrieves the DestroyRef token for the current injection context without implementing any lifecycle interface.' , since: '14'},
    { name: 'ngOnDestroy', type: 'hook', desc: 'Lifecycle hook interface that DestroyRef and takeUntilDestroyed() are designed to replace for most cleanup scenarios.' },
    { name: 'takeUntilDestroyed(destroyRef)', type: 'operator', desc: 'Overload that accepts an explicit DestroyRef, allowing use inside methods or any code outside the construction phase.' , since: '16'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Unsubscribing from RxJS: Subject + takeUntil vs takeUntilDestroyed()', before: `private destroy$ = new Subject<void>();

ngOnInit() {
  interval(1000).pipe(takeUntil(this.destroy$)).subscribe(...);
}
ngOnDestroy() {
  this.destroy$.next(); this.destroy$.complete();
}`, after: `private destroyRef = inject(DestroyRef);

startPolling() {
  interval(1000)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(...);
}`,
      note: 'No Subject, no ngOnDestroy, no manual complete() — DestroyRef handles teardown automatically.' },
    { title: 'Cleanup callbacks: ngOnDestroy vs DestroyRef.onDestroy()', before: `private timerId: any;

ngOnInit() {
  this.timerId = setInterval(() => this.tick(), 1000);
}
ngOnDestroy() {
  clearInterval(this.timerId);
}`, after: `private destroyRef = inject(DestroyRef);

ngOnInit() {
  const id = setInterval(() => this.tick(), 1000);
  this.destroyRef.onDestroy(() => clearInterval(id));
}`,
      note: 'Cleanup is co-located with setup; no lifecycle interface needed on the class.' },
    { title: 'Composable utilities: lifecycle inside a helper function', before: `// Old: caller must manage destroy$ and pass it in
function startPolling(url: string, destroy$: Observable<void>) {
  interval(5000).pipe(takeUntil(destroy$)).subscribe(...);
}`, after: `// New: function injects its own DestroyRef
function startPolling(url: string) {
  const destroyRef = inject(DestroyRef);
  interval(5000).pipe(takeUntilDestroyed(destroyRef)).subscribe(...);
}`,
      note: 'Standalone utility functions can self-manage cleanup — no boilerplate leaked to callers.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Calling takeUntilDestroyed() without argument inside a method', wrong: `startPolling() {
  // Throws: NG0203 — no injection context
  interval(1000).pipe(takeUntilDestroyed()).subscribe(...);
}`, right: `private destroyRef = inject(DestroyRef);
startPolling() {
  interval(1000)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(...);
}`, explanation: 'takeUntilDestroyed() without an argument requires an active injection context, which only exists during construction. Inside any method, pass DestroyRef explicitly.'  },
    { title: 'Injecting DestroyRef inside a method instead of at field level', wrong: `startPolling() {
  // Throws: inject() called outside injection context
  const dr = inject(DestroyRef);
  interval(1000).pipe(takeUntilDestroyed(dr)).subscribe(...);
}`, right: `private destroyRef = inject(DestroyRef); // field init = ok
startPolling() {
  interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...);
}`, explanation: 'inject() is only valid during construction. Always inject DestroyRef as a class field so it is available for use in methods.'  },
    { title: 'Assuming only one onDestroy callback can be registered', wrong: `// Mistakenly overwriting earlier cleanup:
this.destroyRef.onDestroy(() => clearInterval(timerId));
// ... later, believing this replaces the first:
this.destroyRef.onDestroy(() => this.log('done'));`, right: `// Both callbacks run on destroy — in registration order
this.destroyRef.onDestroy(() => clearInterval(timerId));
this.destroyRef.onDestroy(() => this.log('done'));
// No conflict — additive, not overriding`, explanation: 'onDestroy() is additive. Every registered callback fires on destruction in order — no callback overrides a previous one.'  },
    { title: 'Ignoring the cancel function returned by onDestroy()', wrong: `this.destroyRef.onDestroy(() => this.heavyCleanup());
// Later the cleanup is no longer needed, but it will still run`, right: `const cancel = this.destroyRef.onDestroy(() => this.heavyCleanup());
// If cleanup becomes unnecessary before destroy:
cancel(); // deregisters the callback`, explanation: 'onDestroy() returns a function that removes the callback. Store it when you may need to conditionally cancel a registered cleanup.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '16', label: 'Angular 16', features: ['DestroyRef introduced as a stable injectable token for registering destroy callbacks', 'takeUntilDestroyed() operator released in @angular/core/rxjs-interop', 'Works in components, directives, services, and standalone inject() utility functions'] },
    { version: '17', label: 'Angular 17+', features: ['DestroyRef and takeUntilDestroyed() fully stable and recommended as the standard replacement for ngOnDestroy cleanup patterns', 'Commonly paired with the new @if / @for control flow and signals for fully reactive, self-cleaning components'] },
  ];

  challenge: Challenge = {
    title: 'Build a self-cleaning polling service',
    description: 'Create a component that polls a counter every 2 seconds using setInterval and registers cleanup via DestroyRef.onDestroy() — no ngOnDestroy allowed. Also add a second subscription using takeUntilDestroyed(this.destroyRef) on an interval() observable that increments a separate signal. Display both counts and a cleanup status message that appears only after the component is destroyed (simulate with a button).',
    language: 'typescript',
    hints: [
      'Inject DestroyRef with: private destroyRef = inject(DestroyRef);',
      'Register setInterval cleanup in ngOnInit: this.destroyRef.onDestroy(() => clearInterval(id));',
      'For the RxJS interval in a method, pass destroyRef: interval(2000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...);',
      'Use a signal<string> for the cleanup message and update it inside the onDestroy callback to surface it in the template',
    ],
    starterCode: `import { Component, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({
  selector: 'app-polling-demo',
  standalone: true,
  template: \`
    <h2>Self-cleaning Poller</h2>
    <p>Native counter (setInterval): {{ nativeCount() }}</p>
    <p>RxJS counter (interval): {{ rxCount() }}</p>
    <p *ngIf="cleanupMessage()">{{ cleanupMessage() }}</p>
    <button (click)="simulateDestroy()">Simulate Destroy</button>
  \`,
})
export class PollingDemoComponent implements OnInit {
  // TODO: inject DestroyRef

  nativeCount = signal(0);
  rxCount     = signal(0);
  cleanupMessage = signal('');

  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    // TODO: start setInterval, register clearInterval via destroyRef.onDestroy()
    // TODO: register a second onDestroy callback that sets cleanupMessage
  }

  startRxPoller() {
    // TODO: use interval(2000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...)
  }

  simulateDestroy() {
    // For demo purposes — in real apps Angular calls this automatically
    // Clear the native timer and update the message manually
    if (this.timerId) clearInterval(this.timerId);
    this.cleanupMessage.set('Cleanup ran — no more leaks!');
  }
}
`,
    solution: `import { Component, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({
  selector: 'app-polling-demo',
  standalone: true,
  template: \`
    <h2>Self-cleaning Poller</h2>
    <p>Native counter (setInterval): {{ nativeCount() }}</p>
    <p>RxJS counter (interval): {{ rxCount() }}</p>
    @if (cleanupMessage()) {
      <p>{{ cleanupMessage() }}</p>
    }
    <button (click)="startRxPoller()">Start RxJS Poller</button>
    <button (click)="simulateDestroy()">Simulate Destroy</button>
  \`,
})
export class PollingDemoComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  nativeCount    = signal(0);
  rxCount        = signal(0);
  cleanupMessage = signal('');

  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    // Native timer — cleaned up via DestroyRef, no ngOnDestroy needed
    this.timerId = setInterval(() => {
      this.nativeCount.update(n => n + 1);
    }, 2000);

    this.destroyRef.onDestroy(() => {
      if (this.timerId) clearInterval(this.timerId);
    });

    // Second onDestroy callback — all callbacks run, order preserved
    this.destroyRef.onDestroy(() => {
      this.cleanupMessage.set('Cleanup ran — no more leaks!');
    });
  }

  startRxPoller() {
    // Called from a method, so DestroyRef must be passed explicitly
    interval(2000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.rxCount.update(n => n + 1));
  }

  simulateDestroy() {
    // Manually trigger what Angular does on component destruction
    if (this.timerId) clearInterval(this.timerId);
    this.cleanupMessage.set('Cleanup ran — no more leaks!');
  }
}
`,
  };
}
