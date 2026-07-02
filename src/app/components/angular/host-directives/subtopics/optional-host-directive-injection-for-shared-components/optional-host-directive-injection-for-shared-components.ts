import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-optional-host-directive-injection-for-shared-components-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './optional-host-directive-injection-for-shared-components.html',
  styleUrl: './optional-host-directive-injection-for-shared-components.scss',
})
export class OptionalHostDirectiveInjectionForSharedComponentsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The scenario: a shared directive that adapts its behavior IF a specific host directive is present',
      points: [
        'Unlike a component\'s own <code>hostDirectives</code> array (which is fixed at compile time for THAT component), a shared, reusable DIRECTIVE meant to be applied broadly across a codebase cannot know in advance whether the host element it lands on ALSO happens to have some OTHER specific directive applied via that consuming component\'s own <code>hostDirectives</code>. This is exactly the case the main topic\'s brief mention of <code>inject(CdkDrag, { optional: true })</code> is built for.',
        'Concrete example: a generic <code>AnalyticsTrackerDirective</code> that logs interaction events — if the host ALSO happens to have <code>CdkDrag</code> applied (by whatever component composed it), the tracker should log drag distance; if not, it just logs clicks. The tracker directive cannot assume <code>CdkDrag</code> is there.',
      ],
    },
    {
      heading: 'inject(Dir, { optional: true }) returns null instead of throwing',
      points: [
        'The default behavior of <code>inject(SomeDirective)</code>, when that directive is genuinely not present on the host, is to THROW an error at runtime (a <code>NullInjectorError</code>-style failure) — appropriate when the directive is a REQUIRED dependency, but wrong for an optional integration. Passing <code>{ optional: true }</code> changes the return type to <code>SomeDirective | null</code> and the call returns <code>null</code> instead of throwing.',
        'Always follow an optional injection with an explicit null check before using the instance: <code>const drag = inject(CdkDrag, { optional: true }); if (drag) { /* use drag safely, TypeScript now narrows it to non-null */ }</code> — skipping the check reintroduces the exact crash the optional injection was meant to avoid, just deferred to whenever the code first touches a property on <code>null</code>.',
      ],
    },
    {
      heading: 'Combining optional injection with a signal-based conditional effect',
      points: [
        'For a directive that needs to REACT to the optional dependency\'s state (not just read it once), guard the entire <code>effect()</code> registration behind the null check performed ONCE at construction — since the PRESENCE of a directive on a host element cannot change after the component is built (unlike the directive\'s own internal state, which can), there is no need to re-check for presence on every effect run: <code>const drag = inject(CdkDrag, { optional: true }); if (drag) { effect(() =&gt; { const pos = drag.position; /* react to drag position changes */ }); }</code>.',
        'This pattern makes a directive genuinely reusable across BOTH plain elements and drag-enabled ones — the SAME directive class works in both contexts, with its behavior adapting based on what else happens to be composed onto the same host, without the consuming component needing to configure anything explicitly.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/drag.directive.ts',
      content: `import { Directive, signal } from '@angular/core';

@Directive({
  selector: '[appDrag]',
  standalone: true,
  host: { '(mousemove)': 'track($event)' },
})
export class DragDirective {
  distanceTraveled = signal(0);
  private lastX: number | null = null;

  track(event: MouseEvent) {
    if (this.lastX !== null) {
      this.distanceTraveled.update(d => d + Math.abs(event.clientX - this.lastX!));
    }
    this.lastX = event.clientX;
  }
}
`,
    },
    {
      path: 'src/app/analytics-tracker.directive.ts',
      content: `import { Directive, inject, effect, ElementRef } from '@angular/core';
import { DragDirective } from './drag.directive';

// A generic, reusable directive — applied broadly, with NO guarantee
// that DragDirective is also present on the same host.
@Directive({
  selector: '[appAnalyticsTracker]',
  standalone: true,
  host: { '(click)': 'logClick()' },
})
export class AnalyticsTrackerDirective {
  private el = inject(ElementRef);

  // Optional — returns null if DragDirective is not applied to this host
  private drag = inject(DragDirective, { optional: true });

  constructor() {
    if (this.drag) {
      // Only registered when DragDirective IS present — safe, one-time check
      effect(() => {
        console.log(\`[analytics] drag distance so far: \${this.drag!.distanceTraveled()}px\`);
      });
    }
  }

  logClick() {
    console.log('[analytics] click on', this.el.nativeElement.tagName);
    if (this.drag) {
      console.log('[analytics] this element also supports drag tracking');
    }
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { AnalyticsTrackerDirective } from './analytics-tracker.directive';
import { DragDirective } from './drag.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AnalyticsTrackerDirective, DragDirective],
  template: \`
    <h3>Optional host directive injection</h3>
    <p>Open the console. The plain button has ONLY analytics tracking — clicking logs a
    click with no drag mention. The draggable box has BOTH directives — moving the mouse
    over it also logs drag distance, since AnalyticsTrackerDirective detects DragDirective
    is present via optional injection.</p>

    <button appAnalyticsTracker>Plain tracked button (no drag)</button>

    <div appAnalyticsTracker appDrag style="margin-top:1rem; padding:2rem; border:1px solid #ccc;">
      Move your mouse here (tracked + draggable)
    </div>
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
  <head><title>Optional host directive injection for shared components</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Remove the { optional: true } option from the DragDirective injection and observe the runtime error on the plain button (which has no DragDirective applied).',
    hint: 'Change `inject(DragDirective, { optional: true })` to `inject(DragDirective)` — the plain button element does not have DragDirective applied, so the required injection throws when AnalyticsTrackerDirective is constructed there.',
    solution: `// analytics-tracker.directive.ts
private drag = inject(DragDirective); // REQUIRED — throws on the plain button

// Result: NullInjectorError when Angular constructs AnalyticsTrackerDirective
// on the plain <button appAnalyticsTracker> element, since DragDirective was
// never applied there.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'inject(SomeDirective, { optional: true }) is only useful when injecting from a completely unrelated, uncomposed part of the app.',
      reality: 'it is specifically the correct tool for a REUSABLE directive that needs to adapt its behavior based on whatever OTHER directives happen to be composed on the same host by different consuming components — it cannot know that in advance.',
    },
    {
      thought: 'an optional injection that returns null still needs a null check only in code paths where the value is actually used, not immediately after injecting.',
      reality: 'checking immediately (or at least before first use, guarded once) is the safe pattern — skipping the check just defers the crash to whenever the code first touches a property on null, making the bug harder to trace back to the missing check.',
    },
    {
      thought: 'a directive reacting to an optionally-injected dependency\'s state needs to re-check for the dependency\'s presence on every reactive run.',
      reality: 'presence/absence of a directive on a host element is fixed at construction time and cannot change afterward — checking once and conditionally registering the effect() is sufficient; no repeated presence checks are needed inside the effect itself.',
    },
  ];
}
