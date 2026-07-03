import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-signal-store-vs-ngrx-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './signal-store-vs-ngrx.html',
  styleUrl: './signal-store-vs-ngrx.scss',
})
export class SignalStoreVsNgrxSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Plain signal store — the default for most apps',
      points: [
        'Reach for a plain hand-rolled signal store (a service with private signals + public readonly/computed + methods) for: small-to-medium apps, team-local feature state, straightforward CRUD, component-scoped state, and any scenario where minimizing boilerplate matters more than tooling. This is what every prior subtopic in this site has actually been demonstrating.',
      ],
    },
    {
      heading: '@ngrx/signals (signalStore()) — structured features on top of signals',
      points: [
        'Reach for <code>&#64;ngrx/signals</code>\'s <code>signalStore()</code> when you want STRUCTURED, REUSABLE store features — <code>withEntities()</code> for typed entity-collection CRUD (add/update/remove/select by id, with less hand-written boilerplate than a plain <code>Map</code>/array), <code>withMethods()</code> for composable, reusable method groups, or when your team already has NgRx ecosystem familiarity/tooling in place.',
      ],
    },
    {
      heading: '@ngrx/store (classic) — when you need the DevTools',
      points: [
        'Reach for classic <code>&#64;ngrx/store</code> when you specifically need NgRx DevTools TIME-TRAVEL DEBUGGING, full action replay, or a large team that benefits from the strict, enforced unidirectional-data-flow convention that reducers/actions provide. This is a genuinely different value proposition from "less boilerplate" — it is about debuggability and process at scale.',
      ],
    },
    {
      heading: 'No built-in DevTools for plain signal stores — and that\'s the actual tradeoff',
      points: [
        'A plain signal store has NO built-in DevTools support — no time-travel debugging, no action log. If debugging complex, hard-to-reproduce state transitions genuinely matters more to your team than minimal boilerplate, that missing tooling is the real cost of choosing the simpler pattern, not a hypothetical one.',
      ],
    },
    {
      heading: 'These approaches coexist — this is not a one-app-one-choice decision',
      points: [
        'A single application can use a plain signal store for local, low-stakes UI state (a form wizard\'s current step, a sidebar\'s collapsed state) AND classic <code>&#64;ngrx/store</code> for globally shared, debug-critical state (the current user, cart, order history) at the SAME TIME. Picking one does not lock you out of the other for different slices of state.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/cart.store.ts',
      content: `import { Injectable, computed, signal } from '@angular/core';

interface CartItem { id: number; name: string; qty: number; }

// PLAIN SIGNAL STORE — this is the version actually running below.
// Compare against the @ngrx/signals shape in the comment underneath.
@Injectable({ providedIn: 'root' })
export class CartStore {
  private _items = signal<CartItem[]>([]);

  readonly items = this._items.asReadonly();
  readonly total = computed(() => this._items().reduce((n, i) => n + i.qty, 0));

  add(item: CartItem) {
    this._items.update(list => [...list, item]);
  }
  remove(id: number) {
    this._items.update(list => list.filter(i => i.id !== id));
  }
}

/*
 * The equivalent shape using @ngrx/signals' signalStore() would look like:
 *
 * export const CartStore = signalStore(
 *   { providedIn: 'root' },
 *   withEntities<CartItem>(),          // typed entity CRUD — addEntity, removeEntity, etc.
 *   withComputed(({ entities }) => ({
 *     total: computed(() => entities().reduce((n, i) => n + i.qty, 0)),
 *   })),
 *   withMethods((store) => ({
 *     add: (item: CartItem) => patchState(store, addEntity(item)),
 *     remove: (id: number) => patchState(store, removeEntity(id)),
 *   })),
 * );
 *
 * Same overall shape (state + computed + methods) — @ngrx/signals adds
 * structured entity helpers (withEntities) and a consistent patchState()
 * update mechanism, at the cost of an extra dependency and a bit more
 * ceremony than the plain version above.
 */
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { CartStore } from './cart.store';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Cart total: {{ store.total() }}</h3>
    <ul>
      @for (item of store.items(); track item.id) {
        <li>{{ item.name }} × {{ item.qty }} <button (click)="store.remove(item.id)">Remove</button></li>
      }
    </ul>
    <button (click)="addSample()">Add sample item</button>
  \`,
})
export class App {
  store = inject(CartStore);

  addSample() {
    this.store.add({ id: Date.now(), name: 'Widget', qty: 1 });
  }
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
  <head><title>Signal store vs NgRx</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add an itemCount computed (distinct from total quantity) that counts the number of DISTINCT items in the cart, not the sum of quantities.',
    hint: 'readonly itemCount = computed(() => this._items().length); — this.total() sums qty across all items, while itemCount counts the array length (number of distinct line items), a genuinely different number.',
    solution: `readonly itemCount = computed(() => this._items().length);

// Template:
// <p>{{ store.itemCount() }} distinct items, {{ store.total() }} total quantity</p>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a "real" enterprise Angular app should always use classic NgRx for state management — it is the proper/professional choice.',
      reality: 'a plain signal store handles most apps\' actual state needs with far less boilerplate. Classic NgRx earns its cost specifically when DevTools time-travel debugging or a large team\'s enforced unidirectional-flow convention are genuine requirements — not as a default "proper" choice.',
    },
    {
      thought: 'choosing a plain signal store versus NgRx is an all-or-nothing decision for the entire application.',
      reality: 'the two approaches coexist perfectly well in the same app — a plain signal store for local, low-stakes UI state alongside classic NgRx for globally shared, debug-critical state, chosen per slice of state, not per application.',
    },
    {
      thought: 'plain signal stores have the same debugging tooling as NgRx, just with a different API surface.',
      reality: 'plain signal stores have NO built-in DevTools support at all — no time-travel debugging, no action log. This is the genuine tradeoff for the reduced boilerplate, not a minor cosmetic difference.',
    },
  ];
}
