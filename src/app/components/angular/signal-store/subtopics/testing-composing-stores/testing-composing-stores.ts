import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-composing-stores-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-composing-stores.html',
  styleUrl: './testing-composing-stores.scss',
})
export class TestingComposingStoresSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Testing — synchronous, no async ceremony',
      points: [
        'A signal store is just a plain class — instantiate it with <code>TestBed.inject(MyStore)</code> after configuring the TestBed, or <code>new MyStore()</code> directly if it has no DI dependencies to resolve.',
        'Because state lives in signals, you read it SYNCHRONOUSLY in tests: <code>expect(store.total()).toBe(30)</code> — no <code>async</code>/<code>await</code>, no subscriptions, no <code>fixture.detectChanges()</code> needed just to read a value.',
      ],
    },
    {
      heading: 'Testing async store methods',
      points: [
        'For a store method that itself is <code>async</code>, use plain <code>async</code>/<code>await</code> in the test: <code>await store.load(); expect(store.data().length).toBeGreaterThan(0);</code> — or <code>fakeAsync</code>/<code>tick()</code> if you need fine-grained control over simulated time (testing debounce/timeout behavior, for example).',
      ],
    },
    {
      heading: 'Composition — stores injecting stores',
      points: [
        'Stores compose the same way any other injectable does: <code>constructor(private auth: AuthStore) {}</code>. A <code>CartStore</code> can read <code>auth.userId()</code> directly to associate cart items with the current user — no prop drilling through components, no event bus needed to connect two otherwise-unrelated pieces of state.',
      ],
    },
    {
      heading: 'Avoiding circular dependencies between stores',
      points: [
        'If Store A injects Store B, and Store B also needs to inject Store A, Angular\'s dependency injector CANNOT resolve that cycle — this is a real error, not something DI works around automatically. Break the cycle by extracting the state BOTH stores actually need into a third store, C, that both A and B inject independently — neither depends on the other directly anymore.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/auth.store.ts',
      content: `import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private _userId = signal<string | null>('user-42');
  readonly userId = this._userId.asReadonly();

  login(id: string) { this._userId.set(id); }
  logout() { this._userId.set(null); }
}
`,
    },
    {
      path: 'src/app/cart.store.ts',
      content: `import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthStore } from './auth.store';

interface CartItem { id: number; name: string; ownerId: string | null; }

@Injectable({ providedIn: 'root' })
export class CartStore {
  // Composition — CartStore injects AuthStore directly, no prop drilling
  private auth = inject(AuthStore);

  private _items = signal<CartItem[]>([]);
  readonly items = this._items.asReadonly();

  // Derived state that spans BOTH stores
  readonly myItems = computed(() =>
    this._items().filter(i => i.ownerId === this.auth.userId())
  );

  addForCurrentUser(name: string) {
    this._items.update(list => [
      ...list,
      { id: Date.now(), name, ownerId: this.auth.userId() },
    ]);
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { AuthStore } from './auth.store';
import { CartStore } from './cart.store';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <p>Logged in as: {{ auth.userId() ?? 'nobody' }}</p>
    <button (click)="auth.login('user-42')">Log in as user-42</button>
    <button (click)="auth.logout()">Log out</button>

    <button (click)="cart.addForCurrentUser('Widget')">Add item as current user</button>

    <h3>My items (filtered by AuthStore.userId via composition)</h3>
    <ul>
      @for (item of cart.myItems(); track item.id) {
        <li>{{ item.name }}</li>
      }
    </ul>
  \`,
})
export class App {
  auth = inject(AuthStore);
  cart = inject(CartStore);
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
  <head><title>Testing and composing stores</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add an itemCountForUser computed on CartStore that returns the number of items belonging to the currently logged-in user — reusing myItems internally rather than re-filtering.',
    hint: 'readonly itemCountForUser = computed(() => this.myItems().length); — since myItems is already a computed signal filtering by the current user, itemCountForUser can just read its length rather than duplicating the filter logic.',
    solution: `readonly itemCountForUser = computed(() => this.myItems().length);

// Template:
// <p>{{ cart.itemCountForUser() }} items for the current user</p>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a signal store requires the same async/fixture.detectChanges() dance as testing a component.',
      reality: 'a signal store\'s state reads SYNCHRONOUSLY in a test — expect(store.total()).toBe(30) works with no async ceremony at all, since there is no change detection cycle to trigger, just a plain signal read.',
    },
    {
      thought: 'two stores can inject each other (A injects B, B injects A) as long as neither constructor immediately reads from the other.',
      reality: 'Angular\'s dependency injector genuinely cannot resolve a circular dependency between two injectables, regardless of what the constructors do with each other — the fix is extracting the shared state into a third store that both A and B depend on independently.',
    },
    {
      thought: 'store composition (one store injecting another) creates the same kind of tight, hard-to-test coupling that prop-drilling does.',
      reality: 'composition via injection is the OPPOSITE of prop drilling — it removes the need to pass state through every intermediate component, and testing still works normally by injecting/constructing the dependent store the same way any other DI dependency would be provided in a test.',
    },
  ];
}
