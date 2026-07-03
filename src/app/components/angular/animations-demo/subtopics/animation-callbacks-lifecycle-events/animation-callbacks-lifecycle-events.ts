import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-animation-callbacks-lifecycle-events-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './animation-callbacks-lifecycle-events.html',
  styleUrl: './animation-callbacks-lifecycle-events.scss',
})
export class AnimationCallbacksLifecycleEventsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '(@trigger.start) and (@trigger.done) — template output events',
      points: [
        'Every animation trigger automatically exposes TWO output events on the SAME binding: <code>(&#64;myTrigger.start)="onStart($event)"</code> fires the instant the animation begins, and <code>(&#64;myTrigger.done)="onDone($event)"</code> fires when it finishes — no separate directive or service needed.',
        'The event handler receives an <code>AnimationEvent</code> object with useful properties: <code>fromState</code> and <code>toState</code> (the state names involved), <code>totalTime</code> (the animation\'s configured duration in ms), and <code>phaseName</code> (<code>\'start\'</code> or <code>\'done\'</code>) — enough to know exactly which transition just ran without inferring it from component state.',
        'A common real use: disabling a button while its own animation is in flight — set a flag true in <code>.start</code> and false in <code>.done</code> — preventing a user from re-triggering an animation mid-flight, which can otherwise cause visually jarring interruptions.',
      ],
    },
    {
      heading: '@.disabled — turning off animations conditionally',
      points: [
        'The SPECIAL binding <code>[&#64;.disabled]="skipAnimations"</code> on a host element disables ALL animation triggers within that element\'s subtree — not just one specific trigger. This is the standard way to skip animations for a specific part of the UI (e.g., a data table with hundreds of rows where per-row animations would tank performance) while keeping them elsewhere.',
        'Combine <code>&#64;.disabled</code> with <code>window.matchMedia(\'(prefers-reduced-motion: reduce)\').matches</code> read once at startup to respect the user\'s OS-level reduced-motion preference for a SPECIFIC subtree, as an alternative or complement to disabling animations app-wide via <code>provideNoopAnimations()</code>.',
        'When <code>&#64;.disabled</code> is true, elements still transition between states INSTANTLY (no animation, but the end state is still applied correctly) — it is not the same as the trigger never running at all; the DOM ends up in the same final state either way.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { trigger, state, style, transition, animate, AnimationEvent } from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  animations: [
    trigger('boxState', [
      state('closed', style({ height: '0px', overflow: 'hidden' })),
      state('open', style({ height: '100px', overflow: 'hidden' })),
      transition('closed <=> open', animate('400ms ease-in-out')),
    ]),
  ],
  template: \`
    <h3>Animation callbacks — (@boxState.start) / (@boxState.done)</h3>
    <button (click)="toggle()" [disabled]="isAnimating()">
      {{ isAnimating() ? 'Animating...' : 'Toggle box' }}
    </button>
    <div
      [@boxState]="state()"
      (@boxState.start)="onStart($event)"
      (@boxState.done)="onDone($event)"
      style="background: #6366f1; color: white; padding: 0.5rem;">
      Content inside the box
    </div>
    <p>Last event: {{ lastEvent() }}</p>

    <h3>[@.disabled] — turning off animations for this subtree</h3>
    <label>
      <input type="checkbox" [checked]="disabled()" (change)="disabled.set(!disabled())" />
      Disable animations below
    </label>
    <div [@.disabled]="disabled()">
      <div
        [@boxState]="state2()"
        style="background: #22c55e; color: white; padding: 0.5rem; margin-top: 0.5rem;">
        This box respects the disabled toggle
      </div>
      <button (click)="state2.set(state2() === 'open' ? 'closed' : 'open')">Toggle second box</button>
    </div>
  \`,
})
export class App {
  state = signal<'open' | 'closed'>('closed');
  state2 = signal<'open' | 'closed'>('closed');
  isAnimating = signal(false);
  disabled = signal(false);
  lastEvent = signal('(none yet)');

  toggle() {
    this.state.set(this.state() === 'open' ? 'closed' : 'open');
  }

  onStart(event: AnimationEvent) {
    this.isAnimating.set(true);
    this.lastEvent.set(\`start: \${event.fromState} -> \${event.toState} (\${event.totalTime}ms)\`);
  }

  onDone(event: AnimationEvent) {
    this.isAnimating.set(false);
    this.lastEvent.set(\`done: \${event.fromState} -> \${event.toState}\`);
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { App } from './app/app';

bootstrapApplication(App, { providers: [provideAnimationsAsync()] });
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Animation callbacks and lifecycle events</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a click counter that increments every time (@boxState.done) fires, displayed below the "Last event" line.',
    hint: 'Add doneCount = signal(0); to the class, call this.doneCount.update(n => n + 1); inside onDone(), and add a <p>Done count: {{ doneCount() }}</p> to the template.',
    solution: `doneCount = signal(0);

onDone(event: AnimationEvent) {
  this.isAnimating.set(false);
  this.lastEvent.set(\`done: \${event.fromState} -> \${event.toState}\`);
  this.doneCount.update(n => n + 1);
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'listening for animation completion requires AnimationBuilder or a separate service — template bindings can only trigger animations, not observe them.',
      reality: '(@trigger.start) and (@trigger.done) are output events available directly on the SAME trigger binding used to start the animation — no separate service or builder is needed to observe lifecycle events declaratively.',
    },
    {
      thought: '[@.disabled] only disables the ONE trigger it is bound near.',
      reality: 'it disables ALL animation triggers within that element\'s entire subtree, not just a single named trigger — a broader effect than its placement might suggest.',
    },
    {
      thought: 'when animations are disabled via @.disabled, elements just stay frozen in their current state, ignoring state changes.',
      reality: 'elements still transition between states — just INSTANTLY, with no animation — the end state is applied correctly either way, only the animated transition itself is skipped.',
    },
  ];
}
