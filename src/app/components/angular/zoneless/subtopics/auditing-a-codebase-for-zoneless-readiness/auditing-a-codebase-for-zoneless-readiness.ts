import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-auditing-a-codebase-for-zoneless-readiness-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './auditing-a-codebase-for-zoneless-readiness.html',
  styleUrl: './auditing-a-codebase-for-zoneless-readiness.scss',
})
export class AuditingACodebaseForZonelessReadinessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Hoping tests catch it does not scale past a handful of components',
      points: [
        'The main topic\'s migration checklist says "convert all mutable state to signal()" — for a 20-component demo app that is a code review; for a 300-component production app, manually eyeballing every component for a plain-field-mutated-in-an-async-callback bug is unrealistic. A systematic search finds the risk BEFORE flipping the zoneless provider, not after users report a stale view in production.',
        'The dangerous pattern has a recognizable shape: a plain class field (not wrapped in <code>signal()</code>) that is BOTH (a) read in a template binding and (b) mutated inside <code>setTimeout</code>, <code>setInterval</code>, a raw <code>addEventListener</code> callback, or a third-party library callback. Neither half alone is a bug — a plain field mutated only in a synchronous method (like a click handler) works fine even in zoneless apps, because the click handler itself runs inside Angular\'s own event binding, which still schedules CD via <code>markForCheck</code>-equivalent internal machinery.',
      ],
    },
    {
      heading: 'A grep-based first pass — cheap, imperfect, still valuable',
      points: [
        'Before reaching for a custom AST-based codemod, a plain <code>grep</code>/ripgrep sweep narrows the search space dramatically: search for <code>setTimeout(</code>, <code>setInterval(</code>, and <code>addEventListener(</code> across component files, then manually inspect only the matches — this turns "audit 300 files" into "audit the dozen files that actually use raw timers or DOM listeners."',
        'This pass has false positives (a <code>setTimeout</code> that only mutates a local variable, never touched by the template) and false negatives (state mutated via a THIRD-PARTY library\'s own internal timer, invisible to a grep of your own code) — treat it as a triage tool that shrinks the manual review list, not a complete guarantee.',
      ],
    },
    {
      heading: 'A stricter check: instrumenting change detection to catch stale views live',
      points: [
        'A more thorough (and more work) technique: temporarily enable BOTH <code>provideZonelessChangeDetection()</code> and keep zone.js loaded side by side (as the main topic\'s Step 1 describes), then click through the app\'s actual user flows with browser devtools\' Performance panel recording — every CD cycle that Zone.js triggers but that a PURE zoneless run would have missed shows up as "the app worked in this dual-mode test but would silently break once zone.js is actually removed."',
        'A cheaper live-testing variant: temporarily comment out <code>"zone.js"</code> from <code>polyfills</code> in a LOCAL branch (not merged) while keeping <code>provideZonelessChangeDetection()</code>, then manually exercise every screen — visibly stale UI after an async action is the exact signal that a plain-field mutation needs converting, without needing any instrumentation code at all.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/risky-component.ts',
      content: `import { Component, signal } from '@angular/core';

// AUDIT TARGET — has one bug (plain field in setInterval) and one safe pattern
// (signal in setTimeout) side by side, to illustrate what a grep-based audit
// would flag and how to tell the difference on manual inspection.
@Component({
  selector: 'app-risky-component',
  standalone: true,
  template: \`
    <p>Signal-based (safe): {{ safeCount() }}</p>
    <p>Plain field (RISKY — will not update in zoneless mode): {{ riskyCount }}</p>
    <button (click)="start()">Start both timers</button>
  \`,
})
export class RiskyComponent {
  safeCount = signal(0);
  riskyCount = 0; // ← grep for "setInterval(" below finds this component; manual read confirms the bug

  start() {
    setInterval(() => {
      this.safeCount.update(n => n + 1); // signal.update() — notifies scheduler regardless of zone
    }, 1000);

    setInterval(() => {
      this.riskyCount++; // plain field mutation — INVISIBLE to Angular without Zone.js
    }, 1000);
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { RiskyComponent } from './risky-component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RiskyComponent],
  template: \`
    <h3>Auditing for zoneless readiness</h3>
    <p>Click "Start both timers", then watch: the signal-based count updates every
    second, but the plain-field count freezes — exactly the bug a codebase audit is
    meant to catch BEFORE removing zone.js in production.</p>
    <app-risky-component />
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
  <head><title>Auditing a codebase for zoneless readiness</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Fix the audited bug by converting riskyCount to a signal, then confirm both counters now update in lockstep.',
    hint: 'Change `riskyCount = 0` to `riskyCount = signal(0)`, update the setInterval callback to `this.riskyCount.update(n => n + 1)`, and change the template binding from `{{ riskyCount }}` to `{{ riskyCount() }}`.',
    solution: `riskyCount = signal(0); // was: riskyCount = 0;

start() {
  setInterval(() => {
    this.safeCount.update(n => n + 1);
  }, 1000);

  setInterval(() => {
    this.riskyCount.update(n => n + 1); // was: this.riskyCount++;
  }, 1000);
}

// Template: {{ riskyCount() }} — was {{ riskyCount }}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a plain class field mutated inside ANY method is at risk in a zoneless app.',
      reality: 'only mutations inside ASYNC callbacks (setTimeout, setInterval, raw event listeners, third-party callbacks) are at risk — a plain field mutated inside a synchronous click handler works fine, because the handler itself runs inside Angular\'s own event binding.',
    },
    {
      thought: 'a grep sweep for setTimeout/setInterval/addEventListener is a complete, sufficient audit on its own.',
      reality: 'it is a cheap triage step that narrows the manual review list — it has false positives (locals never read by a template) and false negatives (state mutated by a third-party library\'s OWN internal timer, invisible to a grep of your code).',
    },
    {
      thought: 'the only way to verify zoneless readiness is careful code review — there is no way to test it live before removing zone.js.',
      reality: 'temporarily removing the zone.js polyfill on a local branch while keeping the zoneless provider lets you manually exercise every screen and directly SEE which views go stale, without writing any audit tooling at all.',
    },
  ];
}
