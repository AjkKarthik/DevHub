import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-when-ngzone-run-is-actually-unnecessary-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './when-ngzone-run-is-actually-unnecessary.html',
  styleUrl: './when-ngzone-run-is-actually-unnecessary.scss',
})
export class WhenNgzoneRunIsActuallyUnnecessarySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A close read of the main topic\'s own claim',
      points: [
        'The main topic states, verbatim: "<code>signal.set()</code> called inside <code>runOutsideAngular</code> STILL notifies Angular\'s scheduler... Only plain field mutations are affected by zone context." Yet its own NgZone interop code example wraps a signal write in <code>ngZone.run()</code>: <code>this.ngZone.run(() =&gt; { this.result.set(payload.value); });</code>. Putting these two facts together: if <code>signal.set()</code> always notifies the scheduler regardless of zone context, is the <code>ngZone.run()</code> wrapper around it actually doing anything?',
        'The answer is no — for a PURELY zoneless app (no zone.js loaded at all), wrapping a <code>signal.set()</code> call in <code>ngZone.run()</code> is a no-op carried over from zone-based habits. The wrapper is harmless (it does not break anything) but it is not accomplishing what it looks like it is accomplishing.',
      ],
    },
    {
      heading: 'When ngZone.run() DOES still matter, even around a signal write',
      points: [
        'The one legitimate case: a HYBRID app that still has zone.js loaded (mid-migration, running both zone and zoneless providers together as the main topic\'s Step 1 describes) AND has OTHER, non-signal-based logic elsewhere that depends on Zone.js detecting the callback\'s execution — e.g. a legacy component using <code>ChangeDetectorRef.markForCheck()</code> triggered indirectly by zone stability. In that specific transitional state, keeping <code>ngZone.run()</code> around a mixed callback (that touches both a signal AND legacy zone-dependent code) is the safe, conservative choice.',
        'Once <code>zone.js</code> is fully removed from <code>polyfills</code> (the final migration step), <code>ngZone.run()</code> around a signal-only write becomes provably a no-op — there is no Zone.js loaded to re-enter in the first place. At that point it is dead code, not a defensive pattern.',
      ],
    },
    {
      heading: 'The simplification: drop the wrapper for signal-only third-party adapters',
      points: [
        'For a THIRD-PARTY library adapter whose callback does nothing but call <code>signal.set()</code> (the most common case), the cleanest code in a fully zoneless app is the callback calling <code>.set()</code> directly, with no <code>ngZone.run()</code> wrapper at all — fewer lines, same correctness, and it reads as an honest signal that "this app does not depend on zone context anywhere."',
        'This is a genuinely useful signal DURING a migration too: if you search a codebase for <code>ngZone.run(</code> calls and find one whose body is PURELY signal writes, that call site is safe to simplify immediately — it is not blocking anything else in the migration and removing it makes the codebase\'s "we are truly zoneless here" story more honest and greppable.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/chat-widget-adapter.ts',
      content: `import { Component, DestroyRef, NgZone, inject, signal } from '@angular/core';

// A minimal stand-in for a third-party chat widget's callback API.
class FakeChatWidget {
  private handler: ((msg: string) => void) | null = null;
  onMessage(cb: (msg: string) => void) { this.handler = cb; }
  simulateIncomingMessage(msg: string) { this.handler?.(msg); }
}

@Component({
  selector: 'app-chat-widget-adapter',
  standalone: true,
  template: \`
    <p>Latest message (via ngZone.run — unnecessary here): {{ withZoneRun() }}</p>
    <p>Latest message (direct .set — equally correct, zero overhead): {{ direct() }}</p>
    <button (click)="simulate()">Simulate incoming message</button>
  \`,
})
export class ChatWidgetAdapterComponent {
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);

  withZoneRun = signal('');
  direct = signal('');

  private widgetA = new FakeChatWidget();
  private widgetB = new FakeChatWidget();

  constructor() {
    // OLD HABIT — carried over from zone-based code. Harmless, but the
    // ngZone.run() wrapper is a no-op here: signal.set() would notify
    // Angular's scheduler with or without it.
    this.widgetA.onMessage((msg) => {
      this.ngZone.run(() => {
        this.withZoneRun.set(msg);
      });
    });

    // SIMPLIFIED — identical correctness, in a fully zoneless app.
    // signal.set() always notifies the scheduler regardless of zone context.
    this.widgetB.onMessage((msg) => {
      this.direct.set(msg);
    });

    this.destroyRef.onDestroy(() => {
      // cleanup would go here if the widget had a .destroy() method
    });
  }

  simulate() {
    const msg = 'New message at ' + new Date().toLocaleTimeString();
    this.widgetA.simulateIncomingMessage(msg);
    this.widgetB.simulateIncomingMessage(msg);
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { ChatWidgetAdapterComponent } from './chat-widget-adapter';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChatWidgetAdapterComponent],
  template: \`
    <h3>Is ngZone.run() necessary around a signal write?</h3>
    <p>Click "Simulate incoming message" — both counters update identically. In this
    fully zoneless app, the ngZone.run() wrapper around widgetA's callback is not doing
    anything that widgetB's direct .set() call doesn't already do on its own.</p>
    <app-chat-widget-adapter />
  \`,
})
export class App {}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [provideZonelessChangeDetection()],
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>When ngZone.run() is actually unnecessary</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third widget adapter whose callback touches BOTH a signal AND a legacy plain field (simulating a partially-migrated component) — keep ngZone.run() around only that one, and explain in a comment why it still matters there.',
    hint: 'The legacy plain field mutation still needs Zone.js detection during a hybrid migration (if zone.js is still loaded) — signal.set() alone would work with or without the wrapper, but the plain field write inside the same callback needs the zone re-entry.',
    solution: `private widgetC = new FakeChatWidget();
legacyPlainField = ''; // not yet migrated to a signal

constructor() {
  // ... widgetA, widgetB as before ...

  this.widgetC.onMessage((msg) => {
    // ngZone.run() IS still meaningful here — legacyPlainField is a plain
    // field, not a signal, so it needs zone re-entry to trigger CD during
    // a hybrid migration where zone.js is still loaded alongside the
    // zoneless provider. Once legacyPlainField is converted to a signal,
    // this wrapper becomes removable too.
    this.ngZone.run(() => {
      this.direct.set(msg);       // no-op wrapper for this part
      this.legacyPlainField = msg; // this part is why the wrapper still matters
    });
  });
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'wrapping a signal.set() call in ngZone.run() is always necessary for third-party library interop, as the main topic\'s example shows.',
      reality: 'in a fully zoneless app (no zone.js loaded), the wrapper is a no-op for signal-only callbacks — signal.set() notifies Angular\'s scheduler regardless of zone context, so the wrapper is carried-over habit, not a requirement.',
    },
    {
      thought: 'removing an unnecessary ngZone.run() wrapper around a signal write could break something.',
      reality: 'for a callback that does nothing but call .set() on a signal, removing the wrapper is provably safe — the behavior is identical with or without it once zone.js is no longer loaded.',
    },
    {
      thought: 'ngZone.run() is entirely obsolete once an app adopts signals, even during a hybrid zone/zoneless migration.',
      reality: 'it still matters for callbacks that ALSO touch plain (non-signal) fields while zone.js remains loaded during migration — the wrapper is only provably unnecessary once BOTH the callback is signal-only AND zone.js has been fully removed.',
    },
  ];
}
