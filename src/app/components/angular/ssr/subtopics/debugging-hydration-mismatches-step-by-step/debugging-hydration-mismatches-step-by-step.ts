import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-debugging-hydration-mismatches-step-by-step-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './debugging-hydration-mismatches-step-by-step.html',
  styleUrl: './debugging-hydration-mismatches-step-by-step.scss',
})
export class DebuggingHydrationMismatchesStepByStepSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic lists causes — this page walks the actual diagnosis',
      points: [
        'The main SSR page\'s Q&A names three common mismatch causes (dates, random values, browser-only CSS classes) in a single paragraph but never shows what the actual FAILURE looks like or how to trace it back to the offending line of template code. In practice, a hydration mismatch produces a SPECIFIC console warning shape that, read carefully, usually points almost directly at the cause.',
      ],
    },
    {
      heading: 'Reading the hydration mismatch warning',
      points: [
        'In development mode, a hydration mismatch logs a console warning naming the specific component and a description of the DOM discrepancy — typically something like a text-content or attribute-value mismatch at a specific node. The warning does NOT halt the app; Angular recovers by re-rendering the affected subtree client-side, which is exactly the flash-of-wrong-content the main topic\'s hydration section describes as the failure mode hydration exists to prevent.',
        'The most efficient FIRST diagnostic step: view the page SOURCE (right-click → View Page Source, or <code>curl</code> the SSR endpoint directly) to see EXACTLY what the server actually rendered, then compare it character-for-character against what the client renders on a normal CSR-only load — the diff between those two is the mismatch, and it is almost always narrower and more specific than the warning message alone suggests.',
      ],
    },
    {
      heading: 'The three concrete root causes, and how each one actually manifests',
      points: [
        '<strong>Non-deterministic time/date</strong>: <code>&#123;&#123; new Date() | date &#125;&#125;</code> rendered directly in a template evaluates ONCE on the server (at request time) and again on the client (at hydration time) — even a few hundred milliseconds apart, this can cross a second/minute boundary and produce different text. The fix is not to remove the timestamp, but to CAPTURE it once (in a resolver, a signal set in the constructor, or a value passed via TransferState) so the exact same value is used in both renders.',
        '<strong>Math.random() / crypto-random IDs generated inline</strong>: <code>&#123;&#123; Math.random() &#125;&#125;</code> or a randomly-generated element ID used directly in a template guarantees a mismatch on EVERY load, since the server and client are two entirely separate random sequences. Generate such values ONCE, store them in a signal set at construction time, and read the signal in the template — this doesn\'t eliminate the randomness, it just ensures server and client compute the SAME random value exactly once instead of independently.',
        '<strong>Platform-conditional classes/content applied in ngOnInit/constructor</strong>: code like <code>if (isPlatformBrowser(this.platformId)) this.hasClass = true;</code> that toggles a CSS class or text used in the TEMPLATE\'S INITIAL RENDER will always differ between server (false) and client (true) — the fix is usually to defer that class/content change to AFTER hydration (via <code>afterNextRender()</code>) instead of trying to make it agree during the initial render, since the platform genuinely IS different at that point and no value can honestly be "the same" on both.',
      ],
    },
    {
      heading: 'ngSkipHydration — the deliberate escape hatch, and its cost',
      points: [
        'For a component that is FUNDAMENTALLY impossible to render deterministically on the server (e.g. it reads <code>window.innerWidth</code> synchronously in its very first render, with no way to defer that), add <code>ngSkipHydration</code> as a static host attribute on that component — Angular then skips hydration for that component\'s subtree entirely and re-renders it client-side, exactly like the pre-hydration behavior, but SCOPED to only that one component instead of a warning-triggered fallback for the whole page.',
        'This is a deliberate trade-off, not a fix: the component still gets the flash/re-render cost hydration exists to avoid, but LOCALIZED to just that component\'s subtree rather than letting an unhandled mismatch degrade unpredictably. Treat <code>ngSkipHydration</code> as a last resort for components that are provably impossible to make deterministic — reach for the three fixes above first.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/broken-timestamp.component.ts',
      content: `import { Component } from '@angular/core';

// BROKEN — new Date() evaluates independently on server and client,
// producing different text and triggering a hydration mismatch warning
// whenever the two evaluations straddle a second/minute boundary.
@Component({
  selector: 'app-broken-timestamp',
  standalone: true,
  template: \`<p>Rendered at: {{ nowLabel }}</p>\`,
})
export class BrokenTimestampComponent {
  get nowLabel(): string {
    return new Date().toLocaleTimeString();
  }
}
`,
    },
    {
      path: 'src/app/fixed-timestamp.component.ts',
      content: `import { Component, signal } from '@angular/core';

// FIXED — the timestamp is captured ONCE at construction time and stored
// in a signal. Both the server render and the client's initial hydration
// read the SAME captured value (it's serialized into the DOM either way,
// since the constructor runs once per environment but the VALUE, once
// set, does not change again before hydration completes).
@Component({
  selector: 'app-fixed-timestamp',
  standalone: true,
  template: \`<p>Rendered at: {{ nowLabel() }}</p>\`,
})
export class FixedTimestampComponent {
  // In a real SSR app, prefer capturing this via a resolver or TransferState
  // so the SERVER's value specifically is what the client reuses, rather
  // than each environment independently calling new Date() once.
  nowLabel = signal(new Date().toLocaleTimeString());
}
`,
    },
    {
      path: 'src/app/deferred-platform-class.component.ts',
      content: `import { Component, signal, afterNextRender } from '@angular/core';

// FIXED pattern for platform-conditional UI: the class is NOT applied
// during the initial (server-matching) render. It's added afterNextRender(),
// which only runs in the browser, AFTER hydration has already reconciled
// the initial DOM — so there's nothing to mismatch against.
@Component({
  selector: 'app-deferred-platform-class',
  standalone: true,
  template: \`
    <div [class.enhanced]="isEnhanced()">
      Enhanced UI features load after hydration, not during the initial render.
    </div>
  \`,
})
export class DeferredPlatformClassComponent {
  isEnhanced = signal(false);

  constructor() {
    afterNextRender(() => {
      // Runs only in the browser, only after the first render/hydration —
      // safe to diverge from the server's output at this point.
      this.isEnhanced.set(true);
    });
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { FixedTimestampComponent } from './fixed-timestamp.component';
import { DeferredPlatformClassComponent } from './deferred-platform-class.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FixedTimestampComponent, DeferredPlatformClassComponent],
  template: \`
    <h3>Debugging hydration mismatches step by step</h3>
    <p>
      broken-timestamp.component.ts shows the BROKEN pattern (kept for reference —
      not rendered here since this playground has no real server pass to mismatch
      against). fixed-timestamp.component.ts and deferred-platform-class.component.ts
      show the two corrected patterns actually running below.
    </p>
    <app-fixed-timestamp />
    <app-deferred-platform-class />
  \`,
})
export class App {}
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
  <head><title>Debugging Hydration Mismatches Step by Step</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add <code>ngSkipHydration</code> as a static host attribute to <code>BrokenTimestampComponent</code> (the deliberately broken one), and add a comment explaining specifically what trade-off this makes versus fixing it with the signal-capture pattern shown in <code>FixedTimestampComponent</code>.',
    hint: 'Add hostDirectives or a static host: { ngSkipHydration: \'true\' } (or the attribute selector form <div ngSkipHydration> at the host template level, depending on API version) to the @Component decorator. In the comment, note that this still pays the flash/re-render cost hydration exists to avoid — just scoped to this one component instead of an unhandled full-page mismatch.',
    solution: `@Component({
  selector: 'app-broken-timestamp',
  standalone: true,
  // ngSkipHydration tells Angular to skip hydration for this component's
  // subtree entirely — it re-renders client-side from scratch, exactly
  // like pre-hydration behavior, but scoped to just this component.
  //
  // TRADE-OFF: this does NOT fix the mismatch — it still causes a flash/
  // re-render for this specific component every load, which is precisely
  // the cost hydration exists to eliminate. The signal-capture pattern in
  // FixedTimestampComponent is strictly better here, since new Date() CAN
  // be made deterministic (captured once, reused). Reserve ngSkipHydration
  // for cases that are provably impossible to make deterministic, not as
  // a shortcut around fixing an avoidable mismatch like this one.
  host: { ngSkipHydration: 'true' },
  template: \`<p>Rendered at: {{ nowLabel }}</p>\`,
})
export class BrokenTimestampComponent {
  get nowLabel(): string {
    return new Date().toLocaleTimeString();
  }
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a hydration mismatch console warning means the app has crashed or is broken.',
      reality: 'Angular recovers automatically by re-rendering the affected subtree client-side — the warning does not halt the app, but it does cause exactly the flash-of-wrong-content and doubled DOM work that hydration exists to prevent, so it should still be fixed.',
    },
    {
      thought: 'the fix for a non-deterministic value like <code>new Date()</code> or <code>Math.random()</code> in a template is to remove it or make it platform-conditional.',
      reality: 'the fix is to CAPTURE the value once (in a signal set at construction time, or via TransferState) so the exact same value is reused in both the server render and the client\'s hydration pass — the value itself can stay, it just needs to stop being independently recomputed twice.',
    },
    {
      thought: '<code>ngSkipHydration</code> is a general-purpose fix for any hydration mismatch.',
      reality: 'it is a deliberate escape hatch that still pays the flash/re-render cost hydration exists to avoid — just localized to one component. Reserve it for content that is provably impossible to render deterministically on the server; reach for the deterministic-value or afterNextRender() fixes first.',
    },
  ];
}
