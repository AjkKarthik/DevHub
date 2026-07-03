import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-defer-triggers-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './defer-triggers.html',
  styleUrl: './defer-triggers.scss',
})
export class DeferTriggersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'on viewport — the classic below-the-fold trigger',
      points: [
        '<code>&#64;defer (on viewport) { ... }</code> fires when the <code>&#64;placeholder</code> element enters the visible browser viewport, detected via <code>IntersectionObserver</code>. This is the most common trigger for content the user has to SCROLL to reach — the download only starts once they get close, not on initial page load.',
      ],
    },
    {
      heading: 'on interaction and on hover — for things users may never open',
      points: [
        '<code>on interaction</code> fires on the first click, keydown, focus, or touch event directed at the placeholder. Ideal for modals, accordions, or expandable panels — the user may never open them, so there is no reason to pay the download cost until they actually try to.',
        '<code>on hover</code> fires when the pointer enters the placeholder area — giving a head-start on the download BEFORE the click actually happens, so the interaction feels instant once the user does click. A natural fit for tooltips and dropdown menus.',
      ],
    },
    {
      heading: 'when expr — the programmatic trigger',
      points: [
        '<code>&#64;defer (when showChart()) { ... }</code> fires the moment a signal or boolean expression evaluates truthy — set a signal to <code>true</code> from a button handler, and the chunk starts downloading that instant. This is the trigger to reach for when NONE of the built-in DOM-based triggers (viewport/interaction/hover) match your actual condition.',
      ],
    },
    {
      heading: 'on timer(Xms) — a fixed delay',
      points: [
        '<code>on timer(2000ms)</code> fires after a fixed delay, measured from when the page becomes stable (or from when a combined trigger condition fires, if one is also specified). Useful for genuinely non-critical UI — content that should load after the main page is interactive, but before the user would explicitly go looking for it.',
      ],
    },
    {
      heading: 'Combining triggers',
      points: [
        'Multiple triggers can be combined with a semicolon: <code>&#64;defer (on viewport; on timer(5s)) { ... }</code> — whichever condition fires FIRST wins. This guarantees content near the bottom of a very long page still eventually loads even if the user never scrolls that far.',
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
  template: \`
    <h3>on interaction</h3>
    @defer (on interaction) {
      <p>✅ Loaded after you clicked/focused the placeholder below.</p>
    } @placeholder {
      <button>Click me to load (on interaction trigger)</button>
    }

    <h3>on hover</h3>
    @defer (on hover) {
      <p>✅ Loaded because you hovered the placeholder.</p>
    } @placeholder {
      <div style="padding:1rem;background:#eee;">Hover over me</div>
    }

    <h3>when expr — programmatic trigger</h3>
    <button (click)="ready.set(true)">Set ready signal to true</button>
    @defer (when ready()) {
      <p>✅ Loaded because the ready() signal became true.</p>
    } @placeholder {
      <p>⬜ Waiting for ready() signal...</p>
    }
  \`,
})
export class App {
  ready = signal(false);
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
  <head><title>@defer triggers</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a fourth @defer block using on timer(3000ms) — a 3-second delayed load with no other trigger — and a @placeholder showing "Waiting 3 seconds...".',
    hint: '@defer (on timer(3000ms)) { <p>✅ Loaded after a 3 second timer.</p> } @placeholder { <p>Waiting 3 seconds...</p> } — the timer starts counting once the page is stable, no interaction needed.',
    solution: `@defer (on timer(3000ms)) {
  <p>✅ Loaded after a 3 second timer.</p>
} @placeholder {
  <p>Waiting 3 seconds...</p>
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'on hover and on interaction are essentially the same trigger with different names.',
      reality: 'on hover fires on pointer ENTRY (before any click), giving a head-start on the download so the eventual click feels instant. on interaction fires only on an actual click/keydown/focus/touch — no head-start, the download starts exactly when the user engages, not before.',
    },
    {
      thought: 'the "when" trigger only works with a plain boolean expression, not a signal.',
      reality: '@defer (when showChart()) reads a SIGNAL directly — calling it like any other signal read — and fires the moment it becomes truthy. This is the standard, idiomatic way to trigger a defer block programmatically from component logic.',
    },
    {
      thought: 'you can only specify one trigger per @defer block.',
      reality: 'multiple triggers can be combined with a semicolon — @defer (on viewport; on timer(5s)) — and whichever condition fires first wins, which is a common pattern for guaranteeing eventual loading even if the primary trigger never fires.',
    },
  ];
}
