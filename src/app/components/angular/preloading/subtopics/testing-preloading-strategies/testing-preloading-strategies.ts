import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-preloading-strategies-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-preloading-strategies.html',
  styleUrl: './testing-preloading-strategies.scss',
})
export class TestingPreloadingStrategiesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A PreloadingStrategy is just a class with one method — test it directly',
      points: [
        'There is no router or navigation involved in unit-testing a <code>PreloadingStrategy</code> — <code>preload(route, load)</code> is a plain method that takes a <code>Route</code> object and a <code>load</code> function and returns an <code>Observable</code>. You can call it directly in a spec file with a hand-built mock <code>Route</code> and a Jasmine/Jest spy standing in for <code>load</code>.',
        'This means these tests need NO <code>TestBed</code> router setup, NO real lazy-loaded module, and NO actual navigation — just <code>new TieredPreloadStrategy().preload(mockRoute, loadSpy).subscribe(...)</code>, making the strategy trivially fast to test in isolation.',
      ],
    },
    {
      heading: 'Asserting whether load() was called — and WHEN',
      points: [
        'For a route that should be skipped, assert the spy was never called: <code>expect(loadSpy).not.toHaveBeenCalled()</code> after subscribing and letting the returned <code>of(null)</code> emit synchronously.',
        'For a route with a DELAY (like the tiered strategy from the previous subtopic), the assertion needs fake timers — <code>fakeAsync</code> + <code>tick(2000)</code> (or Jest\'s <code>jest.advanceTimersByTime(2000)</code>) to advance past the <code>timer()</code> delay before asserting <code>loadSpy</code> was called, and asserting it was NOT yet called at <code>tick(1999)</code> to prove the delay is real and not accidentally zero.',
      ],
    },
    {
      heading: 'Testing that load() actually forwards its result',
      points: [
        'Beyond "was <code>load</code> called," assert the strategy\'s returned observable actually EMITS whatever <code>load()</code> emits — set the spy to <code>loadSpy.and.returnValue(of(\'loaded-module\'))</code> and assert the subscription receives <code>\'loaded-module\'</code>, not just that a call happened. This catches a real class of bugs where a strategy accidentally swallows or transforms the load result instead of passing it through.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/tiered-preload.strategy.ts',
      content: `import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

type Tier = 'high' | 'medium' | 'low';
const TIER_DELAYS: Record<Tier, number> = { high: 0, medium: 2000, low: 5000 };

@Injectable({ providedIn: 'root' })
export class TieredPreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    const tier = route.data?.['preload'] as Tier | undefined;
    if (!tier) {
      return of(null);
    }

    const delayMs = TIER_DELAYS[tier];
    return timer(delayMs).pipe(switchMap(() => load()));
  }
}
`,
    },
    {
      path: 'src/app/tiered-preload.strategy.spec.ts',
      content: `import { fakeAsync, tick } from '@angular/core/testing';
import { Route } from '@angular/router';
import { of } from 'rxjs';
import { TieredPreloadStrategy } from './tiered-preload.strategy';

describe('TieredPreloadStrategy', () => {
  let strategy: TieredPreloadStrategy;

  beforeEach(() => {
    strategy = new TieredPreloadStrategy();
  });

  it('never calls load() for an unflagged route', () => {
    const route: Route = { path: 'rarely-visited' };
    const loadSpy = jasmine.createSpy('load').and.returnValue(of('module'));

    strategy.preload(route, loadSpy).subscribe();

    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('calls load() immediately for a high-tier route', () => {
    const route: Route = { path: 'dashboard', data: { preload: 'high' } };
    const loadSpy = jasmine.createSpy('load').and.returnValue(of('module'));

    strategy.preload(route, loadSpy).subscribe();

    expect(loadSpy).toHaveBeenCalled();
  });

  it('delays load() by 2000ms for a medium-tier route', fakeAsync(() => {
    const route: Route = { path: 'reports', data: { preload: 'medium' } };
    const loadSpy = jasmine.createSpy('load').and.returnValue(of('module'));

    strategy.preload(route, loadSpy).subscribe();

    tick(1999);
    expect(loadSpy).not.toHaveBeenCalled();

    tick(1);
    expect(loadSpy).toHaveBeenCalled();
  }));

  it('forwards the resolved value from load()', fakeAsync(() => {
    const route: Route = { path: 'dashboard', data: { preload: 'high' } };
    const loadSpy = jasmine.createSpy('load').and.returnValue(of('DashboardModule'));
    let result: unknown;

    strategy.preload(route, loadSpy).subscribe(value => (result = value));
    tick();

    expect(result).toBe('DashboardModule');
  }));
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Testing PreloadingStrategy in isolation</h3>
    <p>Open tiered-preload.strategy.spec.ts — these tests call .preload() directly with a
    mock Route and a spy load function, no TestBed router setup required.</p>
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
  <head><title>Testing preloading strategies</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test asserting that a "low"-tier route\'s load() is NOT called before 4999ms but IS called at 5000ms.',
    hint: 'Use fakeAsync + tick(4999) to assert not-called, then tick(1) more (total 5000) to assert called — mirroring the existing medium-tier test at the 2000ms boundary.',
    solution: `it('delays load() by 5000ms for a low-tier route', fakeAsync(() => {
  const route: Route = { path: 'admin', data: { preload: 'low' } };
  const loadSpy = jasmine.createSpy('load').and.returnValue(of('module'));

  strategy.preload(route, loadSpy).subscribe();

  tick(4999);
  expect(loadSpy).not.toHaveBeenCalled();

  tick(1);
  expect(loadSpy).toHaveBeenCalled();
}));`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a PreloadingStrategy requires TestBed and a real router configuration.',
      reality: 'a strategy is a plain class with a preload(route, load) method — it can be instantiated directly with <code>new</code> and called with a hand-built mock Route and a spy, no TestBed router setup needed.',
    },
    {
      thought: 'asserting loadSpy was eventually called is enough to prove a delay-based strategy works correctly.',
      reality: 'without asserting the spy was NOT called just before the expected delay boundary (e.g. at 1999ms for a 2000ms delay), a bug that makes the delay accidentally zero — or removes it entirely — would still pass the test.',
    },
    {
      thought: 'a PreloadingStrategy test only needs to check whether load() was called, not what it returns.',
      reality: 'a strategy can call load() correctly but still swallow or transform its result before returning it — asserting the emitted value matches what load() produced catches that class of bug.',
    },
  ];
}
