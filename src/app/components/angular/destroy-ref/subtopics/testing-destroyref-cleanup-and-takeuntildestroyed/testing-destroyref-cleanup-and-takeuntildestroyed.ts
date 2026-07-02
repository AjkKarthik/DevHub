import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-destroyref-cleanup-and-takeuntildestroyed-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-destroyref-cleanup-and-takeuntildestroyed.html',
  styleUrl: './testing-destroyref-cleanup-and-takeuntildestroyed.scss',
})
export class TestingDestroyrefCleanupAndTakeuntildestroyedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'fixture.destroy() triggers real DestroyRef callbacks in tests',
      points: [
        'A component test using <code>TestBed.createComponent</code> can trigger the SAME destruction path Angular uses in a real app by calling <code>fixture.destroy()</code> — this runs every <code>DestroyRef.onDestroy()</code> callback registered by the component, exactly as if the router navigated away or an <code>@if</code> block removed it.',
        'This makes cleanup logic directly testable: spy on whatever the cleanup callback calls (e.g. <code>clearInterval</code>, a service method, a WebSocket <code>.close()</code>), call <code>fixture.destroy()</code>, then assert the spy was called. No need to simulate real component removal via routing or template conditionals.',
      ],
    },
    {
      heading: 'Testing takeUntilDestroyed() unsubscription specifically',
      points: [
        'To prove an RxJS subscription piped through <code>takeUntilDestroyed()</code> actually stops receiving emissions after destruction: subscribe to a test <code>Subject</code>-backed source, call <code>fixture.destroy()</code>, then <code>subject.next(value)</code> again and assert the subscriber callback was NOT called with that new value — proving the internal subscription was torn down, not just that no error was thrown.',
        'A common false-positive is asserting the observable "completed" — <code>takeUntilDestroyed()</code> does complete its source, but a test that only checks for a caught error or absence of a thrown exception can pass even if the underlying subscription silently leaked. Explicitly asserting NO further emissions reach the subscriber is the real proof.',
      ],
    },
    {
      heading: 'Testing the cancel function returned by onDestroy()',
      points: [
        'To verify a conditionally-cancelled cleanup does NOT run: call <code>onDestroy(fn)</code>, immediately call the returned cancel function, THEN call <code>fixture.destroy()</code>, and assert the spy inside <code>fn</code> was never invoked. This distinguishes "cleanup ran late" bugs from "cleanup never ran because it was accidentally cancelled" bugs — two very different failure modes that both look like "nothing happened" without this specific test structure.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/polling.component.ts',
      content: `import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';

// Injectable so a test can supply a controllable Subject instead of a real interval
export const testableSource = new Subject<number>();

@Component({
  selector: 'app-polling',
  standalone: true,
  template: \`<p>Value: {{ value() }}</p>\`,
})
export class PollingComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  value = signal(0);

  ngOnInit() {
    testableSource.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.value.set(v));

    const timerId = setInterval(() => {}, 1000);
    this.destroyRef.onDestroy(() => clearInterval(timerId));
  }
}
`,
    },
    {
      path: 'src/app/polling.component.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { PollingComponent, testableSource } from './polling.component';

describe('PollingComponent cleanup', () => {
  it('stops receiving emissions after fixture.destroy()', () => {
    const fixture = TestBed.createComponent(PollingComponent);
    fixture.detectChanges();

    testableSource.next(1);
    expect(fixture.componentInstance.value()).toBe(1);

    fixture.destroy(); // runs every registered DestroyRef.onDestroy() callback

    testableSource.next(2); // emitted AFTER destruction
    expect(fixture.componentInstance.value()).toBe(1); // unchanged — proves real unsubscription
  });

  it('clears the native timer via a spy on clearInterval', () => {
    spyOn(window, 'clearInterval');
    const fixture = TestBed.createComponent(PollingComponent);
    fixture.detectChanges();

    fixture.destroy();

    expect(window.clearInterval).toHaveBeenCalled();
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { PollingComponent } from './polling.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PollingComponent],
  template: \`
    <h3>Testing DestroyRef cleanup</h3>
    <p>Open polling.component.spec.ts — fixture.destroy() triggers the same cleanup path
    a real navigation or @if removal would trigger.</p>
    <app-polling />
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
  <head><title>Testing DestroyRef cleanup and takeUntilDestroyed</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test proving that calling the cancel function returned by onDestroy() before fixture.destroy() prevents that specific callback from running.',
    hint: 'Register a spy-wrapped callback via destroyRef.onDestroy(spy) in a test-only component variant, call the returned cancel function immediately, then call fixture.destroy() and assert the spy was NOT called.',
    solution: `it('does not run a cancelled onDestroy callback', () => {
  const fixture = TestBed.createComponent(PollingComponent);
  const spy = jasmine.createSpy('cleanup');

  // Assuming PollingComponent exposes destroyRef for the test, or a test-only variant does:
  const cancel = fixture.componentInstance['destroyRef'].onDestroy(spy);
  cancel();

  fixture.destroy();

  expect(spy).not.toHaveBeenCalled();
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing DestroyRef cleanup requires simulating a real route navigation or template removal to trigger destruction.',
      reality: 'fixture.destroy() in a TestBed test triggers the exact same DestroyRef callback path Angular uses in production — no routing or template simulation needed.',
    },
    {
      thought: 'confirming a takeUntilDestroyed()-piped observable "completed" without error is enough to prove cleanup worked.',
      reality: 'the stronger proof is emitting a new value on the source AFTER fixture.destroy() and asserting the subscriber callback was never called with it — that confirms real unsubscription, not just absence of a thrown error.',
    },
    {
      thought: 'a cancelled onDestroy() callback and a callback that simply has not fired yet look and behave the same in tests.',
      reality: 'they are different failure modes — explicitly testing "cancel before destroy → spy never called" catches accidental early cancellation bugs that a simple "does cleanup eventually run" test would miss entirely.',
    },
  ];
}
