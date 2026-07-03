import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-defer-blocks-with-deferblockfixture-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-defer-blocks-with-deferblockfixture.html',
  styleUrl: './testing-defer-blocks-with-deferblockfixture.scss',
})
export class TestingDeferBlocksWithDeferblockfixtureSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The default test behavior is NOT what you\'d expect from production',
      points: [
        'The main topic covers <code>@defer</code>\'s four states (<code>@placeholder</code>, <code>@loading</code>, the loaded content, <code>@error</code>) purely from a PRODUCTION runtime perspective. In TESTS, Angular\'s default <code>DeferBlockBehavior</code> is <strong>Playthrough</strong> — it automatically progresses a deferred block through ALL its states synchronously the moment the fixture is created, meaning the LOADED content appears immediately in a normal test with NO trigger simulation needed. This surprises developers who expect to see the placeholder first, exactly as it would behave in a real browser.',
        'To test the INTERMEDIATE states specifically (does the placeholder render correctly? does the loading skeleton show the right number of rows?), opt into <strong>Manual</strong> mode: <code>TestBed.configureTestingModule({ deferBlockBehavior: DeferBlockBehavior.Manual })</code> — this disables the automatic playthrough and gives you explicit control over which state renders and when.',
      ],
    },
    {
      heading: 'The DeferBlockFixture API — rendering states on demand',
      points: [
        'After enabling Manual mode, retrieve the deferred block(s) in a component via <code>const deferBlocks = await fixture.getDeferBlocks();</code> — this returns an array of <code>DeferBlockFixture</code> objects (one per <code>@defer</code> block in the component\'s template, in source order). Each one exposes <code>.render(state)</code>, accepting a <code>DeferBlockState</code> value: <code>Placeholder</code>, <code>Loading</code>, or <code>Complete</code>.',
        'Call <code>await deferBlocks[0].render(DeferBlockState.Placeholder)</code> then assert the placeholder content is in the DOM; then <code>await deferBlocks[0].render(DeferBlockState.Loading)</code> to assert the loading skeleton; then <code>await deferBlocks[0].render(DeferBlockState.Complete)</code> to assert the FINAL loaded component actually rendered. This directly tests the progressive-loading UX the main topic describes, rather than trusting it works because the syntax looks right.',
      ],
    },
    {
      heading: 'Testing the @error state without a real failed network request',
      points: [
        'Simulating an actual chunk-download failure in a unit test is impractical — there is no real network layer to fail. Instead, <code>DeferBlockFixture</code> supports rendering the <code>Error</code> state directly: <code>await deferBlocks[0].render(DeferBlockState.Error)</code> — this lets you verify your <code>@error</code> block\'s retry button and error message render correctly WITHOUT needing to construct a real failing dynamic import, which the test runner\'s bundler resolves eagerly anyway (there is no genuinely separate network-fetched chunk in the test environment to fail).',
        'This means the <code>@error</code> UI — arguably the LEAST exercised path in manual QA, since triggering a real chunk-load failure requires network throttling or DevTools request-blocking — becomes just as easily testable as the happy path, closing a real coverage gap.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/analytics-panel.ts',
      content: `import { Component, input } from '@angular/core';

@Component({
  selector: 'app-analytics-panel',
  standalone: true,
  template: \`<p class="loaded-chart">Chart for: {{ dataLabel() }}</p>\`,
})
export class AnalyticsPanelComponent {
  dataLabel = input('sales');
}
`,
    },
    {
      path: 'src/app/dashboard.ts',
      content: `import { Component } from '@angular/core';
import { AnalyticsPanelComponent } from './analytics-panel';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AnalyticsPanelComponent],
  template: \`
    @defer (on viewport) {
      <app-analytics-panel dataLabel="revenue" />
    } @placeholder {
      <div class="chart-placeholder">Scroll to load chart</div>
    } @loading (minimum 200ms) {
      <div class="chart-skeleton">Loading chart...</div>
    } @error {
      <div class="chart-error">Chart failed to load. <button>Retry</button></div>
    }
  \`,
})
export class DashboardComponent {}
`,
    },
    {
      path: 'src/app/dashboard.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { DeferBlockBehavior, DeferBlockState } from '@angular/core/testing';
import { DashboardComponent } from './dashboard';

describe('DashboardComponent @defer block states', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      // Opt out of the default "Playthrough" auto-progression — without
      // this, the loaded content would appear immediately with no way
      // to inspect the placeholder or loading states individually.
      deferBlockBehavior: DeferBlockBehavior.Manual,
    });
  });

  it('renders the placeholder first', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    const deferBlocks = await fixture.getDeferBlocks();
    await deferBlocks[0].render(DeferBlockState.Placeholder);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Scroll to load chart');
  });

  it('renders the loading skeleton', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    const deferBlocks = await fixture.getDeferBlocks();
    await deferBlocks[0].render(DeferBlockState.Loading);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Loading chart...');
  });

  it('renders the actual loaded component on Complete', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    const deferBlocks = await fixture.getDeferBlocks();
    await deferBlocks[0].render(DeferBlockState.Complete);
    fixture.detectChanges();

    const chart = fixture.nativeElement.querySelector('.loaded-chart');
    expect(chart.textContent).toContain('revenue');
  });

  it('renders the error state without a real failed network request', async () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    const deferBlocks = await fixture.getDeferBlocks();
    await deferBlocks[0].render(DeferBlockState.Error);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Chart failed to load');
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { DashboardComponent } from './dashboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardComponent],
  template: \`
    <h3>Testing @defer blocks with DeferBlockFixture</h3>
    <p>Open dashboard.spec.ts — four tests explicitly render each @defer state
    (placeholder, loading, complete, error) using DeferBlockBehavior.Manual, instead of
    relying on the default Playthrough behavior that skips straight to loaded content.</p>
    <app-dashboard />
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
  <head><title>Testing @defer blocks with DeferBlockFixture</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test proving the DEFAULT Playthrough behavior (without configuring Manual mode) renders the loaded chart content immediately, with no explicit .render() call needed.',
    hint: 'Write a separate describe block WITHOUT the deferBlockBehavior: DeferBlockBehavior.Manual configuration, create the fixture, call detectChanges(), and assert the loaded chart content is already present.',
    solution: `describe('DashboardComponent — default Playthrough behavior', () => {
  it('renders the loaded content immediately with no manual triggering', () => {
    // No deferBlockBehavior configured — defaults to Playthrough
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    // The loaded chart appears right away — Playthrough auto-progresses
    // through placeholder -> loading -> complete synchronously in tests.
    const chart = fixture.nativeElement.querySelector('.loaded-chart');
    expect(chart.textContent).toContain('revenue');
  });
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a component test involving a @defer block will show the placeholder first, exactly like it would in a real browser.',
      reality: 'Angular\'s default test behavior (Playthrough) automatically progresses through all defer states synchronously — the loaded content appears immediately unless you explicitly opt into DeferBlockBehavior.Manual to control state transitions yourself.',
    },
    {
      thought: 'testing the @error state of a @defer block requires constructing a real failing dynamic import or simulating a network failure.',
      reality: 'DeferBlockFixture.render(DeferBlockState.Error) lets you render the error state directly, without needing a genuinely failing chunk load — closing a coverage gap that is otherwise hard to exercise even in manual QA.',
    },
    {
      thought: 'DeferBlockBehavior.Manual mode is only useful for testing the placeholder and loading states.',
      reality: 'it applies uniformly to ALL states including Complete — even the final loaded-content assertion needs an explicit .render(DeferBlockState.Complete) call once Manual mode is enabled, since Playthrough is what normally handles that transition automatically.',
    },
  ];
}
