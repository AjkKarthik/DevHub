import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-onpush-components-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-onpush-components.html',
  styleUrl: './testing-onpush-components.scss',
})
export class TestingOnpushComponentsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'fixture.detectChanges() — why tests can hide real OnPush bugs',
      points: [
        'By default, a TestBed <code>ComponentFixture</code> does NOT auto-run change detection — you must call <code>fixture.detectChanges()</code> explicitly. Crucially, calling it MANUALLY runs CD unconditionally for that component, REGARDLESS of its change detection strategy — it bypasses the OnPush gate entirely.',
        'This means a test that mutates a bound object (<code>component.data.value = 42</code>) and then calls <code>fixture.detectChanges()</code> will see the update reflected in the DOM, even though the EXACT SAME mutation in production (without an explicit forced check) would be invisible to OnPush. The test passes; production silently breaks.',
        'To catch this class of bug, avoid calling <code>fixture.detectChanges()</code> immediately after the mutation under test — instead, assert BEFORE the extra detectChanges() call to confirm the DOM has NOT yet updated (proving OnPush actually skipped it), matching what real production behavior would show.',
      ],
    },
    {
      heading: 'ComponentFixtureAutoDetect — closer to production timing',
      points: [
        '<code>TestBed.configureTestingModule({ providers: [{ provide: ComponentFixtureAutoDetect, useValue: true }] })</code> makes the fixture automatically run CD after events, similar to how zone.js drives CD in a real running app — this surfaces OnPush skip-behavior more naturally than manually-called <code>detectChanges()</code> everywhere.',
        'Even WITH auto-detect enabled, a signal-based test still benefits from directly asserting on the signal\'s VALUE (<code>expect(component.count()).toBe(1)</code>) in addition to DOM assertions — verifying the reactive state changed independently of whether the DOM happened to reflect it yet in that test tick.',
      ],
    },
    {
      heading: 'Writing a test that actually proves OnPush works correctly',
      points: [
        'A meaningful OnPush test has three parts: (1) trigger the mutation/signal update, (2) assert the DOM has NOT changed yet (if testing the "before CD" state), (3) call the SAME trigger a real app would use (a signal update, an input Object() with a new reference, or an event) and THEN assert the DOM updated — proving the specific trigger, not just <code>detectChanges()</code>, caused the re-render.',
        'For signal inputs specifically: <code>fixture.componentRef.setInput(\'title\', \'New Title\')</code> is the correct TestBed API for setting a signal <code>input()</code> from a test — it properly simulates what a parent template binding does, unlike directly assigning to the signal (which the parent cannot actually do, since inputs are read-only from the child\'s perspective).',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/counter.ts',
      content: `import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`<p data-testid="count">Count: {{ count() }}</p>\`,
})
export class CounterComponent {
  count = signal(0);
  increment() { this.count.update(n => n + 1); }
}
`,
    },
    {
      path: 'src/app/counter.spec.ts',
      content: `import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CounterComponent } from './counter';

describe('CounterComponent (OnPush)', () => {
  let fixture: ComponentFixture<CounterComponent>;
  let component: CounterComponent;

  beforeEach(() => {
    fixture = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // initial render
  });

  it('reflects the signal value in the DOM after an update + detectChanges', () => {
    component.increment();
    // Directly asserting the signal proves the REACTIVE state changed,
    // independent of whether the DOM has caught up yet in this test tick.
    expect(component.count()).toBe(1);

    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('[data-testid="count"]');
    expect(el.textContent).toContain('Count: 1');
  });

  it('does NOT update the DOM before detectChanges is called again', () => {
    component.increment();
    // Without calling detectChanges() again, the DOM should still show the OLD value —
    // this is what proves the test isn't accidentally masking real OnPush behavior.
    const el: HTMLElement = fixture.nativeElement.querySelector('[data-testid="count"]');
    expect(el.textContent).toContain('Count: 0');
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { CounterComponent } from './counter';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CounterComponent],
  template: \`
    <h3>The component under test — see counter.spec.ts for the actual OnPush tests</h3>
    <app-counter />
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
  <head><title>Testing OnPush components</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third test that calls increment() twice before detectChanges(), then asserts the DOM shows "Count: 2" — confirming multiple signal updates coalesce into the DOM correctly on the next check.',
    hint: 'Call component.increment() twice, then fixture.detectChanges(), then query the element and expect its textContent to contain "Count: 2".',
    solution: `it('coalesces multiple signal updates into the next detectChanges', () => {
  component.increment();
  component.increment();
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement.querySelector('[data-testid="count"]');
  expect(el.textContent).toContain('Count: 2');
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a test passes after calling fixture.detectChanges(), the same behavior is guaranteed in production.',
      reality: 'fixture.detectChanges() runs CD unconditionally, bypassing the OnPush gate entirely — a test can pass by forcing a check that production would never trigger for the same mutation, hiding a real bug.',
    },
    {
      thought: 'ComponentFixtureAutoDetect makes manual detectChanges() calls in tests unnecessary in every case.',
      reality: 'auto-detect makes timing closer to a real app, but directly asserting on signal VALUES (not just DOM text) remains valuable — it verifies the reactive state changed independent of exactly when the DOM happened to reflect it.',
    },
    {
      thought: 'setting a signal input in a test is the same as assigning to the signal directly (component.title.set(...)).',
      reality: 'fixture.componentRef.setInput(\'title\', value) is the correct API — it simulates what a parent binding actually does; a component\'s own input() signal is read-only from the child\'s side and cannot be .set() by the component itself in real usage.',
    },
  ];
}
