import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-signal-store-devtools-and-hooks-cleanup-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './signal-store-devtools-and-hooks-cleanup.html',
  styleUrl: './signal-store-devtools-and-hooks-cleanup.scss',
})
export class SignalStoreDevtoolsAndHooksCleanupSubtopic {

  ngrxDeps = { '@ngrx/signals': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'onDestroy — cleanup for resources a store opens itself',
      points: [
        '<code>withHooks({ onDestroy(store) { ... } })</code> runs when the store is destroyed — for a ROOT-provided store (<code>{ providedIn: \'root\' }</code>) this is effectively never during normal app usage, but for a COMPONENT-SCOPED store (added to a component\'s <code>providers:[]</code>), it runs whenever that component is destroyed, making it the correct place to clean up anything the store itself opened: a <code>setInterval</code>, a manual WebSocket connection, or a subscription NOT already managed by <code>rxMethod()</code>.',
        '<code>rxMethod()</code> subscriptions are ALREADY automatically cleaned up when the store is destroyed — <code>onDestroy</code> is specifically for resources the store opened OUTSIDE that mechanism, such as a raw <code>setInterval</code> started directly in <code>withHooks({ onInit })</code> or a method.',
      ],
    },
    {
      heading: 'Component-scoped stores and the destroy timing that matters',
      points: [
        'A store WITHOUT <code>{ providedIn: \'root\' }</code>, added instead to a specific component\'s <code>providers: [MyStore]</code>, gets a FRESH instance per component mount and is destroyed when that component is destroyed — this is the correct scope for "wizard state," "per-modal state," or any state that should not leak between multiple instances of the same feature.',
        'Forgetting <code>onDestroy</code> cleanup on a component-scoped store that opened a timer or interval is a genuine, repeatable leak: every time the component mounts and unmounts, a new interval starts, and without cleanup the OLD interval keeps running indefinitely in the background, each one still calling into a now-destroyed store\'s methods.',
      ],
    },
    {
      heading: 'Redux DevTools integration for debugging',
      points: [
        'Signal stores can be connected to the browser\'s Redux DevTools extension for time-travel debugging and state inspection — the same tool classic NgRx Store users rely on — via a devtools-connecting feature composed into <code>signalStore()</code>, giving visibility into every <code>patchState()</code> call as a labeled action in the DevTools panel.',
        'This is genuinely valuable for a large app with several stores: instead of scattering <code>console.log</code> calls through methods, the DevTools extension shows every state transition, its triggering action name, and lets you inspect the exact state snapshot at any point in the session — the debugging workflow NgRx classic users already expect, now available for signal stores.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/timer.store.ts',
      content: `import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';

export const TimerStore = signalStore(
  // No { providedIn: 'root' } — this store is component-scoped
  withState({ seconds: 0 }),
  withMethods((store) => ({
    tick() {
      patchState(store, { seconds: store.seconds() + 1 });
    },
  })),
  withHooks({
    onInit(store) {
      console.log('TimerStore created — starting interval');
      const intervalId = setInterval(() => store.tick(), 1000);

      // Store the id so onDestroy can clean it up
      (store as any)._intervalId = intervalId;
    },
    onDestroy(store) {
      console.log('TimerStore destroyed — clearing interval');
      clearInterval((store as any)._intervalId);
    },
  }),
);
`,
    },
    {
      path: 'src/app/timer-widget.ts',
      content: `import { Component, inject } from '@angular/core';
import { TimerStore } from './timer.store';

@Component({
  selector: 'app-timer-widget',
  standalone: true,
  providers: [TimerStore], // component-scoped — a FRESH store per mount
  template: \`<p>Seconds elapsed: {{ store.seconds() }}</p>\`,
})
export class TimerWidgetComponent {
  store = inject(TimerStore);
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { TimerWidgetComponent } from './timer-widget';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TimerWidgetComponent],
  template: \`
    <h3>Component-scoped store — mount/unmount to see onInit/onDestroy in the console</h3>
    <button (click)="show.set(!show())">{{ show() ? 'Unmount' : 'Mount' }} timer widget</button>
    @if (show()) {
      <app-timer-widget />
    }
  \`,
})
export class App {
  show = signal(true);
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
  <head><title>Signal store devtools and hooks cleanup</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Unmount" then "Mount" a few times, and check the console — confirm each unmount logs "clearing interval" BEFORE the next mount logs "starting interval", proving no interval leaks accumulate.',
    hint: 'This confirms the existing onDestroy hook correctly clears each interval on unmount — if you removed the onDestroy hook, you would see multiple "TimerStore created" logs without matching "destroyed" logs, and the seconds count would climb faster than expected as leaked intervals stack up.',
    solution: `// No code change needed — this confirms the existing onDestroy hook
// (clearInterval) correctly pairs with each onInit (setInterval),
// so mounting/unmounting repeatedly never leaks intervals.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'rxMethod() subscriptions and manually-started resources like setInterval both need explicit onDestroy cleanup.',
      reality: 'rxMethod() subscriptions are ALREADY automatically cleaned up when the store is destroyed — onDestroy is specifically needed for resources the store opened OUTSIDE that mechanism, like a raw setInterval.',
    },
    {
      thought: 'a component-scoped signalStore (without providedIn: root) behaves the same as a root store, just with a different provider location.',
      reality: 'a component-scoped store gets a FRESH instance per component mount and is destroyed when that component is destroyed — genuinely different lifetime semantics than a root singleton, which is why per-modal or per-wizard state should use this scope.',
    },
    {
      thought: 'forgetting onDestroy cleanup on a component-scoped store with a timer is a minor, rarely-triggered edge case.',
      reality: 'it is a genuine, REPEATABLE leak — every mount/unmount cycle of the component starts a new interval, and without cleanup each old one keeps running indefinitely, compounding with every remount.',
    },
  ];
}
