import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-cleanup-destroyref-takeuntildestroyed-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './cleanup-destroyref-takeuntildestroyed.html',
  styleUrl: './cleanup-destroyref-takeuntildestroyed.scss',
})
export class CleanupDestroyrefTakeuntildestroyedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'ngOnDestroy — the last chance to clean up',
      points: [
        '<code>ngOnDestroy</code> fires ONCE, just before Angular removes the component from the DOM — the last chance to cancel pending work: unsubscribe Observables, clear <code>setInterval</code>/<code>setTimeout</code>, detach native event listeners, and abort any in-flight HTTP requests that no longer matter.',
      ],
    },
    {
      heading: 'DestroyRef — cleanup anywhere, not just in a component class',
      points: [
        '<code>DestroyRef</code> (Angular 16+) is an INJECTABLE TOKEN that lets you register cleanup callbacks ANYWHERE in an injection context — not only inside a component implementing <code>OnDestroy</code>. Call <code>inject(DestroyRef).onDestroy(() =&gt; cleanup())</code> from a SERVICE, a composable function, or any other injection context, and Angular calls it when that context is destroyed — no <code>implements OnDestroy</code> class-level ceremony required.',
      ],
    },
    {
      heading: 'takeUntilDestroyed() — the RxJS-native cleanup operator',
      points: [
        '<code>takeUntilDestroyed()</code> from <code>&#64;angular/core/rxjs-interop</code> is a pipeable RxJS operator that AUTO-COMPLETES an Observable the moment the injection context (component/directive) is destroyed: <code>interval(1000).pipe(takeUntilDestroyed()).subscribe()</code> — no manual <code>Subject</code> + <code>takeUntil</code> + <code>.complete()</code> boilerplate to write and remember.',
        'Called OUTSIDE the constructor (e.g. inside <code>ngOnInit</code>), it needs the <code>destroyRef</code> passed explicitly: <code>takeUntilDestroyed(this.destroyRef)</code>, where <code>private destroyRef = inject(DestroyRef);</code> was captured earlier. Angular enforces this because an injection context is only automatically available in the constructor — anywhere else, you have to have captured a reference to it first.',
      ],
    },
    {
      heading: 'Which cleanup mechanism for which situation',
      points: [
        'In practice: use <code>takeUntilDestroyed()</code> for RxJS subscriptions specifically. Use <code>DestroyRef.onDestroy()</code> for native cleanup — <code>ResizeObserver</code>, <code>setInterval</code>, custom event listeners — where there is no Observable involved at all. Fall back to implementing <code>ngOnDestroy</code> only when working with class-based patterns or third-party code that specifically expects that interface. All three can coexist in the same component for different kinds of cleanup.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/polling.service.ts',
      content: `import { Injectable, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PollingService {
  private destroyRef = inject(DestroyRef);
  tick = signal(0);

  startPolling() {
    // Auto-completes when THIS service's injection context is destroyed —
    // for a root service that's effectively "never", but the pattern is identical
    // for a component-scoped service, which genuinely does get destroyed.
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.tick.update(n => n + 1));

    // Native cleanup — no Observable involved
    const id = setInterval(() => console.log('native interval tick'), 3000);
    this.destroyRef.onDestroy(() => {
      clearInterval(id);
      console.log('PollingService destroyed — native interval cleared');
    });
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { PollingService } from './polling.service';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <button (click)="showChild.set(!showChild())">Toggle child (destroys its service scope)</button>
    @if (showChild()) {
      <p>Tick: {{ svc.tick() }}</p>
    }
  \`,
})
export class App {
  svc = inject(PollingService);
  showChild = signal(true);

  constructor() {
    this.svc.startPolling();
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Cleanup — DestroyRef and takeUntilDestroyed</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a second RxJS subscription in startPolling() — an interval every 5 seconds that logs "heartbeat" — also using takeUntilDestroyed(this.destroyRef), demonstrating that multiple independent subscriptions can share the same cleanup mechanism.',
    hint: 'interval(5000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => console.log(\'heartbeat\')); — add this as a second, independent subscription right after the existing one, passing the SAME destroyRef captured earlier.',
    solution: `startPolling() {
  interval(1000)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => this.tick.update(n => n + 1));

  interval(5000)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => console.log('heartbeat'));

  const id = setInterval(() => console.log('native interval tick'), 3000);
  this.destroyRef.onDestroy(() => clearInterval(id));
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'DestroyRef.onDestroy() only works inside a component class, the same restriction as implementing OnDestroy.',
      reality: 'DestroyRef is injectable ANYWHERE with an injection context — a plain service, a composable function, any injectable — not just component classes. This is precisely what makes it more flexible than implementing OnDestroy.',
    },
    {
      thought: 'takeUntilDestroyed() can be called anywhere in a class without any special setup, the same as inside the constructor.',
      reality: 'called outside the constructor, it needs an explicit destroyRef argument — takeUntilDestroyed(this.destroyRef) — because an injection context is only automatically available in the constructor; anywhere else requires a captured reference.',
    },
    {
      thought: 'you should pick exactly ONE cleanup mechanism (ngOnDestroy, DestroyRef, or takeUntilDestroyed) and use it exclusively throughout a component.',
      reality: 'all three coexist naturally for different kinds of cleanup — takeUntilDestroyed() for RxJS subscriptions, DestroyRef.onDestroy() for native browser APIs (ResizeObserver, setInterval), and ngOnDestroy only when a class-based interface is specifically required by other code.',
    },
  ];
}
