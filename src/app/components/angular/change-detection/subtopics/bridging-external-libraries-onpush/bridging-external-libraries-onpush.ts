import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-bridging-external-libraries-onpush-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './bridging-external-libraries-onpush.html',
  styleUrl: './bridging-external-libraries-onpush.scss',
})
export class BridgingExternalLibrariesOnpushSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'NgZone.run() and runOutsideAngular() — the zone boundary',
      points: [
        'A callback registered by a NON-ANGULAR-AWARE library (a vanilla JS widget, a jQuery plugin, a raw <code>WebSocket</code> handler set up before Angular patched it) may execute OUTSIDE Angular\'s zone, meaning state changes inside it never trigger a CD cycle even in zone-based (non-zoneless) apps.',
        '<code>inject(NgZone).run(() =&gt; { this.value = newValue; })</code> re-enters the Angular zone for that callback, ensuring the state change is followed by a CD cycle — the standard fix for "I changed a class field in a third-party callback but the template never updated."',
        'The inverse, <code>ngZone.runOutsideAngular(() =&gt; { ... })</code>, deliberately ESCAPES the zone for expensive, high-frequency work (e.g. a <code>requestAnimationFrame</code> loop or a mousemove-driven drag handler) that doesn\'t need to trigger Angular CD on every tick — preventing thousands of wasted cycles.',
      ],
    },
    {
      heading: 'Signals as the preferred bridge — zone-agnostic by design',
      points: [
        'A <code>signal()</code> updated from ANY callback — inside or outside the zone — notifies Angular\'s reactive graph directly, without depending on zone.js interception at all. This makes signals the most robust bridge for third-party integrations, and the ONLY correct approach in zoneless apps.',
        'For an Observable-based external API, <code>toSignal(source$)</code> converts it into a signal Angular\'s CD understands natively — often simpler and more robust than manually subscribing and calling <code>markForCheck()</code> in the subscribe callback.',
        'The practical rule of thumb: wrap the EDGE of your app where external data enters (a callback, an event listener, an Observable) in a signal update as early as possible, rather than threading plain class-field mutations through several methods before finally calling <code>markForCheck()</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, NgZone, inject, signal, ChangeDetectionStrategy } from '@angular/core';

// Simulates a non-Angular-aware library that fires callbacks
// outside Angular's zone (e.g. via a raw WebSocket or 3rd-party SDK).
function externalLibrarySubscribe(callback: (value: number) => void) {
  let tick = 0;
  setInterval(() => callback(++tick), 1000);
}

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <h3>Bridging a non-Angular-aware callback into OnPush</h3>
    <p>❌ Plain field (may not update visibly under OnPush): {{ plainValue }}</p>
    <p>✅ Signal bridge (always updates correctly): {{ signalValue() }}</p>
  \`,
})
export class App {
  private ngZone = inject(NgZone);

  plainValue = 0;
  signalValue = signal(0);

  constructor() {
    externalLibrarySubscribe(v => {
      // Mutating a plain field here does NOT reliably trigger OnPush re-render
      this.plainValue = v;

      // The signal always notifies Angular's reactive graph directly —
      // this is the robust, zone-agnostic fix
      this.signalValue.set(v);
    });
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
  <head><title>Bridging external libraries to OnPush</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third line that fixes plainValue using inject(NgZone).run() instead of the signal, so all three values stay in sync.',
    hint: 'Wrap the plainValue assignment: this.ngZone.run(() => { this.plainValue = v; }); — this re-enters Angular\'s zone so the mutation is followed by a CD cycle.',
    solution: `externalLibrarySubscribe(v => {
  this.ngZone.run(() => {
    this.plainValue = v;
  });
  this.signalValue.set(v);
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'any state mutation inside a callback will eventually be picked up by Angular, just maybe a cycle late.',
      reality: 'a mutation inside a callback that runs OUTSIDE Angular\'s zone and does not use a signal may never trigger a CD cycle at all under OnPush — it is not "eventually picked up," it is genuinely invisible to Angular until something else independently triggers a check.',
    },
    {
      thought: 'ngZone.runOutsideAngular() is a rarely-needed micro-optimization.',
      reality: 'for high-frequency work like requestAnimationFrame loops or mousemove-driven drag handlers, it prevents genuinely thousands of wasted CD cycles per interaction — a real, measurable performance technique, not a minor tweak.',
    },
    {
      thought: 'signals only help with Angular-authored code — third-party callbacks still need markForCheck().',
      reality: 'signals are zone-agnostic by design — calling .set()/.update() from literally any callback, Angular-aware or not, correctly notifies the reactive graph, making them the most robust and simplest bridge for external library integration.',
    },
  ];
}
