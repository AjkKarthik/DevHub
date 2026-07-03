import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-deep-linking-wizard-steps-with-query-params-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './deep-linking-wizard-steps-with-query-params.html',
  styleUrl: './deep-linking-wizard-steps-with-query-params.scss',
})
export class DeepLinkingWizardStepsWithQueryParamsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic mentions this — this subtopic actually builds it',
      points: [
        'The main Wizard Form page lists "deep-linkable wizards" as a best practice bullet — storing the step index in a query param like <code>/register?step=2</code> — but never demonstrates the wiring. Deep-linking means three things must ALL work together: reading the initial step from the URL on load, writing the step back to the URL on every navigation, and deciding what browser back/forward should do.',
        'Without this, refreshing the page after clicking Next three times silently resets the user to step 0 — a real UX regression for long forms (checkout, registration) where users expect the browser to remember their place, exactly like any other multi-page flow.',
      ],
    },
    {
      heading: 'Reading the initial step — clamp, never trust blindly',
      points: [
        '<code>inject(ActivatedRoute).snapshot.queryParamMap.get(\'step\')</code> returns a string or <code>null</code> — always <code>Number(...)</code> it and clamp with <code>Math.min(Math.max(raw, 0), lastIndex)</code> before seeding the <code>step</code> signal\'s initial value. A hand-edited URL like <code>?step=99</code> or <code>?step=banana</code> must not produce an out-of-bounds index or <code>NaN</code>.',
        'Use <code>.snapshot</code> (not the observable <code>queryParamMap</code>) for the ONE-TIME initial read at construction time — the signal only needs seeding once; ongoing changes are driven by the wizard\'s own <code>next()</code>/<code>back()</code>, not by external navigation into the same component instance.',
      ],
    },
    {
      heading: 'Writing the step back to the URL — an effect(), not a manual call per navigation',
      points: [
        'Register one <code>effect(() => { this.router.navigate([], &#123; queryParams: &#123; step: this.step() &#125;, queryParamsHandling: \'merge\' &#125;) })</code> in the constructor instead of sprinkling <code>router.navigate</code> calls inside <code>next()</code> and <code>back()</code> separately — the effect automatically re-runs on every <code>step()</code> change, from ANY source (Next button, Back button, or a future "jump to step" click), so the URL can never drift out of sync with the signal.',
        '<code>queryParamsHandling: \'merge\'</code> preserves any OTHER query params already on the URL (e.g. <code>?ref=email-campaign&amp;step=2</code>) — using the default (replace) would silently wipe unrelated params every time the wizard step changes.',
      ],
    },
    {
      heading: 'replaceUrl: true — the history-pollution trade-off',
      points: [
        'By default, every <code>router.navigate()</code> call pushes a NEW browser history entry. Without <code>replaceUrl: true</code>, clicking Next four times means the browser back button has to be pressed four times just to leave the wizard — each press replays a previous wizard step instead of leaving the page.',
        'Passing <code>replaceUrl: true</code> makes step changes update the URL bar (so refresh/share/bookmark still work) WITHOUT adding history entries — the back button leaves the wizard entirely after one press, exactly like most production checkout flows behave.',
        'The opposite choice is also valid and sometimes preferred: OMIT <code>replaceUrl</code> so the browser back button doubles as a wizard "Back" button. This is a deliberate product decision, not a default to copy blindly — document whichever one a given wizard uses.',
      ],
    },
    {
      heading: 'Guarding against URL-driven step-skipping',
      points: [
        'A deep-linkable step is also a step a user can jump to directly by typing a URL — <code>?step=3</code> loads the Review step without ever having filled in steps 0–2. If the wizard relies on <code>allValues</code> being populated, an empty Review step is a broken UI, not just a validation nuisance.',
        'Track a <code>furthestValidStep</code> signal (or persist it alongside the form values) and clamp the INITIAL step read from the URL to <code>Math.min(requestedStep, furthestValidStep() )</code> — this lets a legitimate refresh restore the user\'s real position while still blocking someone from URL-hacking straight to the end.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Deep-linkable step: {{ step() + 1 }} of {{ steps.length }}</h3>
    <p>Click Next a few times, then reload the preview — the URL's <code>?step=</code>
    param restores your position instead of resetting to step 1.</p>

    <div class="stepper">
      @for (s of steps; track s; let i = $index) {
        <span [class.active]="step() === i">{{ i + 1 }}. {{ s }}</span>
      }
    </div>

    <div class="nav">
      <button (click)="back()" [disabled]="step() === 0">&larr; Back</button>
      <button (click)="next()" [disabled]="step() === steps.length - 1">Next &rarr;</button>
    </div>
  \`,
})
export class App {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  steps = ['Personal', 'Account', 'Preferences', 'Review'];
  step  = signal(this.readInitialStep());

  constructor() {
    // One effect handles ALL step changes, from any source — Next, Back,
    // or a future "jump to step" click. The URL can never drift out of sync.
    effect(() => {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { step: this.step() },
        queryParamsHandling: 'merge',
        replaceUrl: true, // don't spam browser history on every click
      });
    });
  }

  private readInitialStep(): number {
    const raw = Number(this.route.snapshot.queryParamMap.get('step') ?? '0');
    return Number.isFinite(raw) ? Math.min(Math.max(raw, 0), this.steps.length - 1) : 0;
  }

  next() { this.step.update(s => Math.min(s + 1, this.steps.length - 1)); }
  back() { this.step.update(s => Math.max(s - 1, 0)); }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [provideRouter([])],
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Deep-Linking Wizard Steps with Query Params</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a <code>furthestValidStep</code> signal that only advances past a step when it has actually been visited, then clamp <code>readInitialStep()</code> to it — so hand-editing the URL to <code>?step=3</code> can no longer skip ahead of validated progress.',
    hint: 'Update furthestValidStep inside next() right before advancing the step signal. In readInitialStep(), take the smaller of the URL-requested step and furthestValidStep() — but furthestValidStep starts at 0, so read it AFTER seeding it from the same URL check, or default it to the requested step\'s own clamp on first load.',
    solution: `steps = ['Personal', 'Account', 'Preferences', 'Review'];

// Tracks the deepest step the user has legitimately reached.
furthestValidStep = signal(0);
step = signal(this.readInitialStep());

private readInitialStep(): number {
  const raw = Number(this.route.snapshot.queryParamMap.get('step') ?? '0');
  const requested = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), this.steps.length - 1) : 0;
  // On first load furthestValidStep is still 0, so this legitimately clamps
  // a URL-hacked deep step back to 0 — only next() moves the frontier forward.
  return Math.min(requested, this.furthestValidStep());
}

next() {
  this.step.update(s => {
    const nextStep = Math.min(s + 1, this.steps.length - 1);
    this.furthestValidStep.update(f => Math.max(f, nextStep));
    return nextStep;
  });
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'reading the step from the URL once in the constructor or <code>ngOnInit</code> is enough to make a wizard deep-linkable.',
      reality: 'deep-linking is bidirectional — you also need to WRITE the current step back to the URL on every transition. Without that, refreshing after clicking Next several times sends the user back to whatever step happened to be in the URL when the component first mounted.',
    },
    {
      thought: 'calling <code>router.navigate()</code> to update the query param on every step change will flood the browser history with an entry per click.',
      reality: 'passing <code>replaceUrl: true</code> updates the URL bar in place without adding a history entry — the choice to include or omit it is deliberate: omit it if you WANT the browser back button to double as the wizard\'s own Back button.',
    },
    {
      thought: 'a step index restored from the URL query param can be trusted at face value.',
      reality: 'a user can hand-edit the URL to request any step index, including ones they never validated — production wizards should clamp the requested step against real progress (a <code>furthestValidStep</code> signal or persisted validation state), not just echo the URL value.',
    },
  ];
}
