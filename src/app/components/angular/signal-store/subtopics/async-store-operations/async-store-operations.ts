import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-async-store-operations-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './async-store-operations.html',
  styleUrl: './async-store-operations.scss',
})
export class AsyncStoreOperationsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'No actions, no effects — just an async method',
      points: [
        'A store method that loads data is just a plain <code>async</code> method: <code>async load() { this.loading.set(true); try { this.data.set(await firstValueFrom(this.http.get(...))); } finally { this.loading.set(false); } }</code>. There is no action to dispatch and no separate effect to write — the loading logic lives in the exact same method that performs the load.',
      ],
    },
    {
      heading: 'Dedicated loading and error signals',
      points: [
        'Track async status with its own dedicated signals: <code>loading = signal(false)</code> and <code>error = signal&lt;string | null&gt;(null)</code>. Components read these exactly like any other store state — no special "async state" concept to learn.',
        'The <code>finally</code> block is not optional boilerplate — it is what GUARANTEES <code>loading</code> resets to <code>false</code> whether the operation succeeds OR throws. Forgetting it is a real, common bug: an error path that skips resetting <code>loading</code> leaves the UI stuck showing a spinner forever.',
      ],
    },
    {
      heading: 'Bridging from Observable-based APIs',
      points: [
        'Angular\'s <code>HttpClient</code> returns Observables, not Promises — inject it into the store and bridge with <code>firstValueFrom(this.http.get(...))</code> to <code>await</code> a single response inside an async store method.',
      ],
    },
    {
      heading: 'For genuinely complex async flows — rxMethod()',
      points: [
        'Polling, retry-with-backoff, or cancellation-on-new-input are all things RxJS operators handle well but a plain <code>async</code>/<code>await</code> method does not. <code>rxMethod()</code> from <code>&#64;ngrx/signals</code> integrates a full RxJS pipeline into a signal store WITHOUT converting the rest of the store — or the rest of the app — to NgRx. Reach for it specifically when the async logic itself needs RxJS operators, not as a default for every async store method.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/todos.store.ts',
      content: `import { Injectable, signal } from '@angular/core';

interface Todo { id: number; title: string; }

// A simulated API call — resolves after a delay, occasionally "fails"
function fakeFetchTodos(shouldFail: boolean): Promise<Todo[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new Error('Network error'));
      else resolve([{ id: 1, title: 'Learn signal stores' }, { id: 2, title: 'Ship it' }]);
    }, 800);
  });
}

@Injectable({ providedIn: 'root' })
export class TodosStore {
  private _todos = signal<Todo[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  readonly todos = this._todos.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async load(simulateFailure = false) {
    this._loading.set(true);
    this._error.set(null);
    try {
      const todos = await fakeFetchTodos(simulateFailure);
      this._todos.set(todos);
    } catch (err) {
      this._error.set(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      // Guaranteed to run whether the try succeeded or threw — loading never gets stuck
      this._loading.set(false);
    }
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { TodosStore } from './todos.store';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <button (click)="store.load(false)">Load (succeeds)</button>
    <button (click)="store.load(true)">Load (simulated failure)</button>

    @if (store.loading()) { <p>⏳ Loading...</p> }
    @if (store.error()) { <p>❌ {{ store.error() }}</p> }

    <ul>
      @for (t of store.todos(); track t.id) {
        <li>{{ t.title }}</li>
      }
    </ul>
  \`,
})
export class App {
  store = inject(TodosStore);
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
  <head><title>Async store operations</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a "refresh()" method to TodosStore that reuses load() internally but also logs "Refreshed at <timestamp>" to the console after a successful load.',
    hint: 'async refresh() { await this.load(); if (!this.error()) console.log(\'Refreshed at\', new Date().toISOString()); } — call the existing load() method and check this.error() afterward to know whether it actually succeeded.',
    solution: `async refresh() {
  await this.load();
  if (!this.error()) {
    console.log('Refreshed at', new Date().toISOString());
  }
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'async store methods need an NgRx action and effect to work, the same as classic NgRx.',
      reality: 'a plain async method on the store class is the entire pattern — set loading, await the operation, set the result, reset loading in a finally block. No action, no effect, no reducer anywhere.',
    },
    {
      thought: 'the finally block in an async store method is just a style preference — try/catch alone is enough.',
      reality: 'without finally, an error path that throws before reaching the code that resets loading leaves it stuck at true forever — finally guarantees the reset runs regardless of whether the try succeeded or threw.',
    },
    {
      thought: 'rxMethod() should be used for every async store method, since it is the "proper" NgRx way to do async.',
      reality: 'rxMethod() earns its complexity specifically for flows that need RxJS operators — polling, retry, cancellation. A simple one-shot load is simpler and just as correct as a plain async/await method; reaching for rxMethod() everywhere adds unnecessary complexity.',
    },
  ];
}
