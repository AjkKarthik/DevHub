import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-css-only-and-view-transitions-alternatives-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './css-only-and-view-transitions-alternatives.html',
  styleUrl: './css-only-and-view-transitions-alternatives.scss',
})
export class CssOnlyAndViewTransitionsAlternativesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'When @angular/animations is genuinely overkill',
      points: [
        'A simple hover effect, a CSS <code>transition: opacity 200ms</code> on a class toggle, or a loading spinner\'s <code>&#64;keyframes</code> rotation needs NO Angular animation package at all — plain CSS handles these perfectly, with zero JavaScript involvement and zero added bundle size from <code>provideAnimationsAsync()</code>.',
        'Reach for <code>@angular/animations</code> specifically when you need something CSS alone genuinely cannot express declaratively: coordinated <code>:enter</code>/<code>:leave</code> animations tied to Angular\'s own insertion/removal of elements (via <code>&#64;if</code>/<code>&#64;for</code>), programmatic control via <code>AnimationBuilder</code>, or JavaScript-driven callback timing via <code>(&#64;trigger.done)</code>.',
      ],
    },
    {
      heading: 'withViewTransitions() — a native browser alternative for ROUTE changes specifically',
      points: [
        'For page-to-page transitions specifically, <code>provideRouter(routes, withViewTransitions())</code> (Angular 17+, covered in the Routing topic\'s View Transitions subtopic) wraps navigation in the NATIVE browser View Transitions API — a genuinely different mechanism from <code>@angular/animations</code>\' route-animation pattern (<code>group([query(\':enter\'...), query(\':leave\'...)])</code>), with zero animation code to write for the default cross-fade.',
        'The tradeoff: <code>withViewTransitions()</code> gives you LESS granular control than <code>@angular/animations</code>\' route-animation pattern — you get a cross-fade (or custom CSS via <code>view-transition-name</code>) rather than arbitrary choreographed sequences with <code>group()</code>/<code>sequence()</code>. Choose View Transitions for a simple, free, native-feeling page crossfade; choose <code>@angular/animations</code> route animations when you need bespoke, precisely choreographed transitions.',
      ],
    },
    {
      heading: 'A practical decision framework',
      points: [
        'Plain CSS <code>transition</code>/<code>&#64;keyframes</code>: simple hover/focus states, loading spinners, anything driven by a CSS class toggle with no coordination to Angular\'s DOM insertion/removal timing.',
        '<code>@angular/animations</code>: anything needing <code>:enter</code>/<code>:leave</code> tied to <code>&#64;if</code>/<code>&#64;for</code>, staggered list animations via <code>query()</code> + <code>stagger()</code>, imperative control via <code>AnimationBuilder</code>, or lifecycle callbacks via <code>(&#64;trigger.done)</code>.',
        '<code>withViewTransitions()</code>: specifically for whole-page route transitions where a simple native cross-fade (or lightly customized via <code>view-transition-name</code>) is good enough — genuinely the lightest-weight of the three options for that one use case.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  styles: \`
    .css-only-box {
      width: 60px; height: 60px; background: #6366f1;
      transition: transform 300ms ease, opacity 300ms ease;
    }
    .css-only-box.shrunk { transform: scale(0.5); opacity: 0.4; }

    .spinner {
      width: 30px; height: 30px; border: 4px solid #ddd; border-top-color: #22c55e;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  \`,
  template: \`
    <h3>Plain CSS transition — no Angular animation package involved</h3>
    <button (click)="toggle()">Toggle</button>
    <div class="css-only-box" [class.shrunk]="isShrunk()"></div>

    <h3>Plain CSS &#64;keyframes — a spinner, also no Angular animation package</h3>
    <div class="spinner"></div>

    <p>
      Neither of these needs provideAnimationsAsync() or an <code>animations: []</code>
      array — they are pure CSS, driven only by a class binding.
    </p>
  \`,
})
export class App {
  isShrunk = signal(false);
  toggle() { this.isShrunk.update(v => !v); }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

// Note: no provideAnimationsAsync() here — this demo is intentionally
// pure CSS, to make the point that it needs no Angular animation setup at all.
bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>CSS-only and View Transitions alternatives</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third element using a CSS transition on background-color (from a class toggle), confirming it works with zero Angular animation setup, same as the existing examples.',
    hint: 'Add a new CSS class pair (e.g. .color-box and .color-box.active with different background-color values and a transition: background-color 300ms), a corresponding div with [class.active] bound to a new signal, and a toggle button — no animations: [] array or provideAnimationsAsync() needed.',
    solution: `// CSS:
.color-box { width: 60px; height: 60px; background: #eab308; transition: background-color 300ms; }
.color-box.active { background-color: #ef4444; }

// Template:
<div class="color-box" [class.active]="isActive()"></div>
<button (click)="isActive.set(!isActive())">Toggle color</button>

// Class:
isActive = signal(false);`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'any element animation in an Angular app should go through the animations: [] metadata array for consistency.',
      reality: 'plain CSS transitions/keyframes driven by a class binding need NO Angular animation package involvement at all — reaching for @angular/animations for a simple hover or spinner adds unnecessary bundle size and complexity.',
    },
    {
      thought: 'withViewTransitions() and @angular/animations\' route-animation pattern are two ways to configure the same underlying mechanism.',
      reality: 'they are genuinely different mechanisms — withViewTransitions() wraps the native browser View Transitions API, while the @angular/animations route pattern uses group()/query() with Angular\'s own animation engine; they have different capabilities and tradeoffs, not just different syntax for the same thing.',
    },
    {
      thought: 'withViewTransitions() gives you the same fine-grained choreography control as @angular/animations.',
      reality: 'it gives LESS granular control by design — a simple cross-fade (customizable via CSS view-transition-name) rather than arbitrary sequences composed with group()/sequence(); choose it specifically when that simpler default is sufficient.',
    },
  ];
}
