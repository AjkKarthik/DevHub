import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-components-that-use-web-workers-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-components-that-use-web-workers.html',
  styleUrl: './testing-components-that-use-web-workers.scss',
})
export class TestingComponentsThatUseWebWorkersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic never covers testing — a real gap for a browser-thread API',
      points: [
        'The main Web Workers page shows how to CREATE and USE workers but never how to test a component that depends on one. Test runners (Karma/Jest via jsdom, or Vitest) typically do NOT implement the real <code>Worker</code> API — jsdom in particular has no worker support at all — so a component that unconditionally does <code>new Worker(...)</code> in a constructor or method will throw or hang in a plain unit test.',
        'The fix is NOT to make the test environment support real workers (slow, flaky, thread-scheduling nondeterminism) — it is to make the WORKER a swappable dependency, exactly like you would treat <code>HttpClient</code> or any other side-effecting collaborator.',
      ],
    },
    {
      heading: 'Wrap worker creation behind an injectable factory',
      points: [
        'Instead of calling <code>new Worker(new URL(...))</code> directly inside the component, inject a small factory service: <code>class WorkerFactory &#123; create(url: URL) &#123; return new Worker(url); &#125; &#125;</code>, provided via DI. Production code gets the real factory; tests provide a fake one that returns a mock object shaped like a <code>Worker</code>.',
        'The mock only needs to satisfy the SURFACE the component actually uses: a <code>postMessage()</code> method, an assignable <code>onmessage</code> property, and a <code>terminate()</code> method. It does not need to implement the structured-clone algorithm or actually run any code off-thread — the test is verifying the COMPONENT\'s orchestration logic, not the browser\'s threading model.',
      ],
    },
    {
      heading: 'Simulating a worker response synchronously in a test',
      points: [
        'A mock worker\'s <code>postMessage(data)</code> implementation can immediately invoke <code>this.onmessage?.(&#123; data: fakeResult &#125; as MessageEvent)</code> — this makes the "worker roundtrip" happen synchronously within the test, so no <code>fakeAsync</code>/<code>tick()</code> or real async waiting is needed to assert the component updated its result signal.',
        'To test the LOADING state specifically (the brief window between <code>postMessage()</code> and the response), have the mock NOT respond immediately — store the pending resolution and let the test trigger it manually via a helper like <code>mockWorker.respondWith(data)</code>, asserting the loading UI in between.',
        'To test error handling, invoke <code>this.onerror?.(&#123; message: \'boom\' &#125; as ErrorEvent)</code> from the mock instead of <code>onmessage</code> — this proves the component\'s error-handling path (if it has one) actually runs, a path that\'s otherwise nearly impossible to trigger with a real worker in a deterministic test.',
      ],
    },
    {
      heading: 'Asserting cleanup — the part most tests skip',
      points: [
        'The main topic stresses that <code>worker.terminate()</code> must always be called, calling it a "Common Mistake" to forget. A unit test can directly verify this discipline: spy on the mock worker\'s <code>terminate</code> method and assert it was called exactly once after the component receives its result, AND again if the component is destroyed mid-computation (<code>fixture.destroy()</code> before the mock responds).',
        'This closes a real coverage gap — code review can catch "you forgot terminate()" by reading the diff, but only a test proves it fires on EVERY exit path (success, error, AND early component destruction), not just the happy path a developer manually clicked through.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/worker-factory.ts',
      content: `import { Injectable } from '@angular/core';

// A minimal shape covering only what components actually use —
// easy to satisfy with a fake in tests, without a real Worker.
export interface WorkerLike {
  postMessage(data: unknown): void;
  terminate(): void;
  onmessage: ((ev: MessageEvent) => void) | null;
  onerror: ((ev: ErrorEvent) => void) | null;
}

@Injectable({ providedIn: 'root' })
export class WorkerFactory {
  create(url: URL): WorkerLike {
    return new Worker(url);
  }
}
`,
    },
    {
      path: 'src/app/sum.component.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { WorkerFactory } from './worker-factory';

@Component({
  selector: 'app-sum',
  standalone: true,
  template: \`
    <button (click)="compute()">Compute Sum</button>
    @if (running()) { <p>Computing…</p> }
    @if (result() !== null) { <p>Result: {{ result() }}</p> }
    @if (error()) { <p class="error">{{ error() }}</p> }
  \`,
})
export class SumComponent {
  private factory = inject(WorkerFactory);
  private worker: ReturnType<WorkerFactory['create']> | null = null;

  result  = signal<number | null>(null);
  running = signal(false);
  error   = signal<string | null>(null);

  compute() {
    this.running.set(true);
    this.error.set(null);

    // NOTE: in a real app this URL would point at an actual .worker.ts file —
    // the factory indirection is what makes this swappable in tests.
    this.worker = this.factory.create(new URL('./sum.worker', import.meta.url));
    this.worker.onmessage = (e) => {
      this.result.set(e.data);
      this.running.set(false);
      this.worker?.terminate();
    };
    this.worker.onerror = (e) => {
      this.error.set(e.message);
      this.running.set(false);
      this.worker?.terminate();
    };
    this.worker.postMessage(null);
  }

  ngOnDestroy() {
    this.worker?.terminate();
  }
}
`,
    },
    {
      path: 'src/app/sum.component.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { SumComponent } from './sum.component';
import { WorkerFactory, WorkerLike } from './worker-factory';

class MockWorker implements WorkerLike {
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: ErrorEvent) => void) | null = null;
  terminate = jasmine.createSpy('terminate');

  // Test helper — not part of WorkerLike — lets a spec trigger the
  // "worker responded" moment on demand instead of it happening for real.
  respondWith(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }

  failWith(message: string) {
    this.onerror?.({ message } as ErrorEvent);
  }

  postMessage(): void {
    // Intentionally does nothing automatically — the spec decides when
    // (and whether) to call respondWith()/failWith() to simulate the reply.
  }
}

describe('SumComponent with a mocked worker', () => {
  let mockWorker: MockWorker;

  function createSum() {
    mockWorker = new MockWorker();
    TestBed.configureTestingModule({
      providers: [
        { provide: WorkerFactory, useValue: { create: () => mockWorker } },
      ],
    });
    const fixture = TestBed.createComponent(SumComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('shows the result once the mock worker responds', () => {
    const { component } = createSum();
    component.compute();
    expect(component.running()).toBe(true); // still pending — no response yet

    mockWorker.respondWith(42);

    expect(component.result()).toBe(42);
    expect(component.running()).toBe(false);
  });

  it('terminates the worker after a successful response', () => {
    const { component } = createSum();
    component.compute();
    mockWorker.respondWith(42);

    expect(mockWorker.terminate).toHaveBeenCalledTimes(1);
  });

  it('surfaces a worker error without a real failing worker', () => {
    const { component } = createSum();
    component.compute();
    mockWorker.failWith('out of memory');

    expect(component.error()).toBe('out of memory');
    expect(mockWorker.terminate).toHaveBeenCalledTimes(1);
  });

  it('terminates the worker on component destroy even mid-computation', () => {
    const { fixture, component } = createSum();
    component.compute();
    expect(mockWorker.terminate).not.toHaveBeenCalled();

    fixture.destroy(); // simulate navigating away before the worker replies

    expect(mockWorker.terminate).toHaveBeenCalledTimes(1);
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { SumComponent } from './sum.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SumComponent],
  template: \`
    <h3>Testing components that use Web Workers</h3>
    <p>Open sum.component.spec.ts — a MockWorker satisfies the same surface a real
    Worker exposes (postMessage, onmessage, onerror, terminate), letting tests trigger
    responses and errors synchronously and assert cleanup on every exit path.</p>
    <app-sum />
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
  <head><title>Testing Components That Use Web Workers</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test proving that calling <code>compute()</code> a SECOND time before the first worker has responded creates a new mock worker without leaking the first one — i.e. the first worker\'s <code>terminate()</code> is called before the second <code>postMessage()</code> happens, OR document that this is a real bug if the component does not guard against it.',
    hint: 'SumComponent as written does NOT guard against overlapping compute() calls — calling it twice quickly overwrites this.worker with a new mock, and the FIRST mock\'s terminate() is never called since only the onDestroy/onmessage/onerror paths call it. Write the test to reveal this, then fix compute() to terminate any existing this.worker before creating a new one.',
    solution: `// Revealing test — this FAILS against the component as originally written:
it('terminates a stale worker before starting a new computation', () => {
  const { component } = createSum();
  component.compute();
  const firstWorker = mockWorker;

  component.compute(); // called again before firstWorker responded

  expect(firstWorker.terminate).toHaveBeenCalledTimes(1);
});

// Fix in SumComponent.compute():
compute() {
  this.worker?.terminate(); // clean up any in-flight worker first
  this.running.set(true);
  this.error.set(null);
  this.worker = this.factory.create(new URL('./sum.worker', import.meta.url));
  // ...rest unchanged
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a component that creates a real <code>Worker</code> can be unit tested the same way as any other component, since Karma/Jest run in a browser-like environment.',
      reality: 'jsdom (used by Jest/Vitest) has NO Worker implementation at all, and even Karma\'s real-browser execution makes worker-based tests slow and thread-timing-dependent. Wrapping worker creation behind an injectable factory lets tests substitute a synchronous mock instead.',
    },
    {
      thought: 'a worker mock needs to actually run the worker\'s script logic to be a useful test double.',
      reality: 'the mock only needs to satisfy the SURFACE the component calls (postMessage, onmessage, onerror, terminate) — the test is verifying the component\'s orchestration and cleanup logic, not re-testing the browser\'s own threading implementation.',
    },
    {
      thought: 'if a component correctly calls <code>worker.terminate()</code> in its <code>onmessage</code> handler, that\'s sufficient — cleanup is covered.',
      reality: 'a component can also be destroyed WHILE a worker computation is still in flight (user navigates away). That path needs its own explicit test — calling terminate() only from onmessage misses this case entirely, which is exactly the kind of gap a MockWorker + fixture.destroy() test catches.',
    },
  ];
}
