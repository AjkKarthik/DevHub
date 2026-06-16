import { Component, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, Subject, fromEvent } from 'rxjs';
import { map, scan } from 'rxjs/operators';
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
  selector: 'app-destroy-ref',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, RevisionCardComponent, PrerequisitesComponent],
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
    { q: 'Can you use inject(DestroyRef) inside a utility function that is NOT a component, directive, or service?', a: 'Yes — <code>inject(DestroyRef)</code> works in any function called during an active injection context, including standalone utility/composable functions called from a component\'s field initializer or constructor. This enables self-cleaning composable helpers: <code>function useTimer() { const dr = inject(DestroyRef); ... }</code>. Calling such a function outside construction (e.g. inside <code>ngOnInit</code>) throws <code>NG0203</code>.' },
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

  prerequisites: Prerequisite[] = [
    { label: 'Components', route: '/angular/components' },
    { label: 'RxJS Demo', route: '/angular/rxjs-demo' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'DestroyRef — the injectable cleanup token',
      points: [
        '<code>DestroyRef</code> is an injectable token (Angular 16+) representing the "this thing is being destroyed" notification for a component, directive, service, or injection context.',
        'Inject it at field level: <code>private destroyRef = inject(DestroyRef)</code> — no interface to implement, no class-level changes required.',
        '<code>destroyRef.onDestroy(fn)</code> registers a cleanup callback that fires when the host is destroyed. Multiple independent callbacks can be registered — all run in registration order.',
        '<code>onDestroy()</code> returns a cancel function. Calling it removes the registered callback BEFORE destruction: <code>const cancel = destroyRef.onDestroy(fn); cancel();</code> — useful when cleanup becomes unnecessary.',
        'Works in components, directives, services, standalone functions, and functional guards — anywhere <code>inject()</code> is valid.',
      ],
    },
    {
      heading: 'takeUntilDestroyed() — auto-cleanup for RxJS observables',
      points: [
        '<code>takeUntilDestroyed()</code> is a pipeable RxJS operator from <code>@angular/core/rxjs-interop</code> that auto-completes an observable when the current injection context is destroyed — no <code>Subject</code>, no <code>ngOnDestroy</code>, no manual <code>complete()</code>.',
        'Called WITHOUT arguments, it auto-injects <code>DestroyRef</code> — valid only during construction (field initializers or constructor body): <code>interval(1000).pipe(takeUntilDestroyed()).subscribe(...)</code>.',
        'Called WITH a <code>DestroyRef</code> argument, it works anywhere: <code>interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...)</code>. Always use this form inside class methods.',
        'The operator behaves exactly like <code>takeUntil(destroy$)</code> but without the boilerplate — it subscribes to an internal destroy notifier wired to <code>DestroyRef</code>.',
        'Place it EARLY in the pipe — before transformation operators like <code>switchMap</code> and <code>mergeMap</code> — so in-flight inner observables are also cancelled when the component is destroyed.',
      ],
    },
    {
      heading: 'Using DestroyRef in services and directives',
      points: [
        'Services with <code>providedIn: \'root\'</code> share one <code>DestroyRef</code> tied to the application lifetime — <code>onDestroy</code> callbacks fire on app shutdown, not per-component destruction.',
        'Component-scoped services (in component <code>providers: []</code>) get a <code>DestroyRef</code> that fires when THAT component is destroyed — ideal for short-lived reactive state.',
        'Inject <code>DestroyRef</code> in a directive the same way as in a component. Use it to clean up DOM event listeners or timers registered in <code>ngAfterViewInit</code>.',
        'This eliminates a common bug: directives that add <code>addEventListener</code> in <code>ngAfterViewInit</code> but have no <code>ngOnDestroy</code> to remove them — a classic memory leak source.',
        'For functional route guards and resolvers, <code>inject(DestroyRef)</code> also works, though short-lived guards rarely need cleanup.',
      ],
    },
    {
      heading: 'Composable self-cleaning utility functions',
      points: [
        'The key benefit of <code>DestroyRef</code> is enabling reusable "composable" helper functions that manage their own cleanup — callers don\'t need to pass cleanup signals or implement <code>ngOnDestroy</code>.',
        'Pattern: <code>function usePolling(url: string) { const dr = inject(DestroyRef); const data = signal(null); const id = setInterval(() => fetch(url).then(r => r.json()).then(d => data.set(d)), 5000); dr.onDestroy(() => clearInterval(id)); return data; }</code>',
        'The caller simply calls <code>const data = usePolling(\'/api/items\')</code> in a constructor or field initializer — all cleanup is self-contained inside the function.',
        'This mirrors React\'s custom hooks for cleanup — injectable functions that compose reactive primitives and manage their own teardown lifecycle.',
        'Composable functions MUST be called during construction (field initializer or constructor) so that <code>inject()</code> runs in the correct injection context.',
      ],
    },
    {
      heading: 'Comparing cleanup strategies',
      points: [
        '<strong><code>ngOnDestroy</code> (old):</strong> requires implementing the interface; lifecycle logic is separated from setup; couples the class to Angular\'s lifecycle API; cannot be extracted to a utility function.',
        '<strong><code>Subject + takeUntil</code> (old):</strong> requires a <code>destroy$ = new Subject&lt;void&gt;()</code> field; manual <code>destroy$.next(); destroy$.complete()</code> in <code>ngOnDestroy</code> — two pieces of boilerplate per component.',
        '<strong><code>DestroyRef.onDestroy(fn)</code> (new):</strong> no interface, no <code>Subject</code>, cleanup co-located with setup; supports multiple independent callbacks; composable into utility functions.',
        '<strong><code>takeUntilDestroyed()</code> (new):</strong> the cleanest option for RxJS subscriptions — one operator, zero teardown code; no arguments needed in field initializers.',
        'Use <code>takeUntilDestroyed()</code> for RxJS cleanup; <code>DestroyRef.onDestroy()</code> for non-RxJS teardown (timers, event listeners, third-party library teardown).',
      ],
    },
    {
      heading: 'Best practices',
      points: [
        'Prefer <code>takeUntilDestroyed()</code> without argument in field initializers — move subscriptions out of <code>ngOnInit</code> into field declarations when possible.',
        'Always inject <code>DestroyRef</code> at field level — never call <code>inject(DestroyRef)</code> inside a method (throws <code>NG0203: inject() called outside injection context</code>).',
        'When migrating from <code>takeUntil(destroy$)</code>, keep the same pipe position — place <code>takeUntilDestroyed()</code> early in the pipe so <code>switchMap</code>/<code>mergeMap</code> inner subscriptions are properly cancelled.',
        'Multiple <code>onDestroy()</code> registrations are fine and encouraged for independent cleanup tasks — don\'t bundle unrelated teardowns into one callback.',
        'Use <code>DestroyRef</code> in Angular libraries and shared utilities to avoid forcing consumers to implement <code>ngOnDestroy</code> — this is the intended use case for the API.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
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
    { q: 'In a service with providedIn: \'root\', when do DestroyRef.onDestroy() callbacks fire?', options: ['When the first component that injects the service is destroyed', 'On application shutdown', 'At the first change detection cycle after the service is created', 'They never fire — DestroyRef is not supported in root-level services'], answer: 1, explanation: 'A providedIn: \'root\' service shares the application\'s lifetime. Its DestroyRef.onDestroy() callbacks fire when the Angular application itself is torn down — typically on page unload. For component-lifetime cleanup, provide the service at the component level (providers: [MyService] on the component).' },
    { q: 'Where should takeUntilDestroyed() be placed in a pipe that includes switchMap — before or after — for correct inner-observable cleanup?', options: ['After all operators, as the last in the pipe', 'After switchMap but before map', 'Early in the pipe, before switchMap and other flattening operators', 'Its position does not matter — it always cancels all subscriptions regardless'], answer: 2, explanation: 'Placing takeUntilDestroyed() before switchMap ensures that on component destruction, the upstream unsubscription stops the outer observable before switchMap creates new inner subscriptions. If placed after switchMap, any in-flight inner observables may still complete and call subscribe callbacks on a destroyed component.' },
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
    { title: 'Placing takeUntilDestroyed() after switchMap — in-flight requests survive component destruction', wrong: `source$.pipe(
  switchMap(id => this.http.get('/api/' + id)),
  map(r => r.data),
  takeUntilDestroyed(this.destroyRef), // too late — after switchMap
).subscribe(...);`, right: `source$.pipe(
  takeUntilDestroyed(this.destroyRef), // early — stops before switchMap fires
  switchMap(id => this.http.get('/api/' + id)),
  map(r => r.data),
).subscribe(...);`, explanation: 'When placed after switchMap, takeUntilDestroyed() stops the outer observable but in-flight inner observables (HTTP requests) may still complete and call subscribe callbacks on a destroyed component. Place it before switchMap to prevent new inner subscriptions from starting after destruction.' },
  ];

  revision: RevisionSummary = {
    oneLiner: '<code>DestroyRef</code> replaces <code>ngOnDestroy</code> for cleanup — inject it anywhere, call <code>onDestroy(fn)</code> to register teardown callbacks, or use <code>takeUntilDestroyed(destroyRef)</code> to auto-complete RxJS observables on component destruction.',
    mustKnow: [
      '<code>inject(DestroyRef).onDestroy(fn)</code> — registers a cleanup callback; no interface needed; multiple registrations run in order',
      '<code>onDestroy(fn)</code> returns a cancel function — call it to remove the callback before destruction',
      '<code>takeUntilDestroyed()</code> without arg — valid only during construction (field init / constructor)',
      '<code>takeUntilDestroyed(this.destroyRef)</code> — use inside class methods; always inject <code>DestroyRef</code> at field level',
      'Place <code>takeUntilDestroyed()</code> EARLY in the pipe — before <code>switchMap</code>/<code>mergeMap</code> to cancel inner subscriptions',
      'Root services: <code>onDestroy</code> fires on app shutdown. Component-scoped services: fires when the component is destroyed',
      'Composable utility functions can call <code>inject(DestroyRef)</code> during construction to manage their own cleanup',
    ],
    interviewFocus: [
      'What is the difference between <code>DestroyRef.onDestroy()</code> and implementing <code>ngOnDestroy</code>?',
      'When can you call <code>takeUntilDestroyed()</code> without an argument, and when must you pass <code>destroyRef</code>?',
      'Where should <code>takeUntilDestroyed()</code> be placed in a pipe that includes <code>switchMap</code>?',
      'What does <code>DestroyRef.onDestroy()</code> return, and how would you use the return value?',
      'How does <code>DestroyRef</code> enable composable utility functions that manage their own cleanup?',
    ],
  };

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
