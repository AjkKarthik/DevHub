import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-ngrx-signal-stores-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-ngrx-signal-stores.html',
  styleUrl: './testing-ngrx-signal-stores.scss',
})
export class TestingNgrxSignalStoresSubtopic {

  ngrxDeps = { '@ngrx/signals': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'A signalStore is just an injectable — test it via TestBed.inject()',
      points: [
        'Since <code>signalStore()</code> produces an ordinary INJECTABLE class, testing it needs no special NgRx test harness — <code>TestBed.configureTestingModule({ providers: [CounterStore] }); const store = TestBed.inject(CounterStore);</code> gives you a real store instance, and calling its methods plus reading its signals works exactly like testing any other Angular service.',
        'State signal reads are SYNCHRONOUS, just like any other Angular signal — after calling <code>store.increment()</code>, immediately asserting <code>expect(store.count()).toBe(1)</code> requires no <code>detectChanges()</code>, no <code>tick()</code>, no <code>await</code>.',
      ],
    },
    {
      heading: 'Mocking a service that rxMethod() depends on',
      points: [
        'A store using <code>rxMethod()</code> to call an injected service needs that SERVICE mocked in the test providers, exactly like mocking a dependency for a component — <code>{ provide: ProductService, useValue: { getAll: () =&gt; of(mockProducts) } }</code> in the <code>configureTestingModule</code> providers array, BEFORE injecting the store.',
        'Because <code>rxMethod()</code> subscribes internally and updates state via <code>patchState()</code> as emissions arrive, testing it requires the SAME "wait for the async work to settle" discipline as testing any RxJS-driven code — for a synchronous mock Observable (<code>of(...)</code>), the state updates SYNCHRONOUSLY too since <code>of()</code> emits and completes immediately; for anything with a real delay (<code>delay()</code>, HTTP), you need <code>fakeAsync()</code> + <code>tick()</code> or an async test with <code>await</code>.',
      ],
    },
    {
      heading: 'Testing withHooks(onInit) side effects',
      points: [
        'A store using <code>withHooks({ onInit(store) { store.load(); } })</code> triggers its initial load the MOMENT the store is injected — not on any later action — so a test asserting the loading behavior should inject the store and immediately check that the expected method effects (e.g., a mock service call, or the resulting state) have already happened, without any extra trigger step.',
        'If <code>onInit</code> starts an <code>rxMethod()</code>-driven async operation, the same synchronous-vs-async mock timing rules from above apply — a synchronous mock Observable means the post-injection state is already updated; a delayed one requires waiting.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/counter.store.ts',
      content: `import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject } from '@angular/core';
import { pipe, switchMap, tap } from 'rxjs';
import { ProductService } from './product.service';

export const CounterStore = signalStore(
  withState({ count: 0, products: [] as string[], loading: false }),
  withMethods((store) => ({
    increment() {
      patchState(store, { count: store.count() + 1 });
    },
    loadProducts: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() => inject(ProductService).getAll()),
        tap(products => patchState(store, { products, loading: false })),
      ),
    ),
  })),
  withHooks({
    onInit(store) {
      store.loadProducts();
    },
  }),
);
`,
    },
    {
      path: 'src/app/product.service.ts',
      content: `import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductService {
  getAll(): Observable<string[]> {
    throw new Error('real implementation elsewhere');
  }
}
`,
    },
    {
      path: 'src/app/counter.store.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CounterStore } from './counter.store';
import { ProductService } from './product.service';

describe('CounterStore', () => {
  it('increment() updates count synchronously', () => {
    TestBed.configureTestingModule({ providers: [CounterStore] });
    const store = TestBed.inject(CounterStore);

    store.increment();

    // No detectChanges/tick/await needed — signal reads are synchronous
    expect(store.count()).toBe(1);
  });

  it('loads products via onInit + a mocked service (synchronous mock)', () => {
    TestBed.configureTestingModule({
      providers: [
        CounterStore,
        { provide: ProductService, useValue: { getAll: () => of(['A', 'B']) } },
      ],
    });

    // onInit runs the MOMENT the store is injected — no extra trigger needed
    const store = TestBed.inject(CounterStore);

    // of(...) emits and completes synchronously, so state is already updated
    expect(store.products()).toEqual(['A', 'B']);
    expect(store.loading()).toBe(false);
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { CounterStore } from './counter.store';

@Component({
  selector: 'app-root',
  standalone: true,
  providers: [CounterStore],
  template: \`
    <h3>The store under test — see counter.store.spec.ts for the actual tests</h3>
    <p>Count: {{ store.count() }}</p>
    <button (click)="store.increment()">Increment</button>
    <p>Products: {{ store.products().join(', ') }}</p>
  \`,
})
export class App {
  store = inject(CounterStore);
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
  <head><title>Testing NgRx signal stores</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third test that calls increment() three times and asserts count() is 3, confirming multiple sequential calls accumulate correctly.',
    hint: 'store.increment(); store.increment(); store.increment(); expect(store.count()).toBe(3); — each call reads the current count and patches it, so sequential calls accumulate.',
    solution: `it('accumulates across multiple increment() calls', () => {
  TestBed.configureTestingModule({ providers: [CounterStore] });
  const store = TestBed.inject(CounterStore);

  store.increment();
  store.increment();
  store.increment();

  expect(store.count()).toBe(3);
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a signalStore requires a special NgRx testing harness or utility, different from testing a regular Angular service.',
      reality: 'a signalStore is just an injectable class — TestBed.inject() and calling its methods/reading its signals works exactly like testing any other Angular service, no special harness needed.',
    },
    {
      thought: 'onInit hooks need to be manually triggered in a test after injecting the store.',
      reality: 'onInit runs automatically the MOMENT the store is injected — a test just injects it and immediately checks the resulting effects, with no separate trigger step.',
    },
    {
      thought: 'a mocked Observable dependency for rxMethod() always requires fakeAsync() or an async test to observe the resulting state change.',
      reality: 'a synchronous mock like of(...) emits and completes immediately, so the resulting patchState() call happens synchronously too — fakeAsync()/await is only needed when the mock genuinely introduces a delay (delay(), setTimeout-backed Observables, real HTTP).',
    },
  ];
}
