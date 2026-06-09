import { Component, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

interface CartItem { id: number; name: string; price: number; qty: number; }
interface CartState { items: CartItem[]; discount: number; }

const CartStore = signalStore(
  { providedIn: 'root' },
  withState<CartState>({ items: [], discount: 0 }),
  withComputed(({ items, discount }) => ({
    itemCount:    computed(() => items().reduce((s, i) => s + i.qty, 0)),
    subtotal:     computed(() => items().reduce((s, i) => s + i.price * i.qty, 0)),
    total:        computed(() => {
      const sub = items().reduce((s, i) => s + i.price * i.qty, 0);
      return sub - sub * (discount() / 100);
    }),
  })),
  withMethods(store => ({
    addItem(item: Omit<CartItem, 'qty'>) {
      const existing = store.items().find(i => i.id === item.id);
      if (existing) {
        patchState(store, { items: store.items().map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) });
      } else {
        patchState(store, { items: [...store.items(), { ...item, qty: 1 }] });
      }
    },
    removeItem(id: number) {
      patchState(store, { items: store.items().filter(i => i.id !== id) });
    },
    setDiscount(pct: number) { patchState(store, { discount: pct }); },
    clear() { patchState(store, { items: [], discount: 0 }); },
  })),
);

const PRODUCTS: Omit<CartItem, 'qty'>[] = [
  { id: 1, name: 'Angular Pro Course', price: 49 },
  { id: 2, name: 'RxJS Mastery', price: 29 },
  { id: 3, name: 'TypeScript Deep Dive', price: 39 },
  { id: 4, name: 'NgRx Signals Guide', price: 19 },
];

@Component({
  selector: 'app-ngrx-signals',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './ngrx-signals.html',
  styleUrl: './ngrx-signals.scss',
  providers: [],
})
export class NgrxSignalsDemo {
  store    = inject(CartStore);
  products = PRODUCTS;

  qna: QnaItem[] = [
    { q: 'What is signalStore() and how is it different from a plain service with signals?', a: '<code>signalStore()</code> composes feature functions (<code>withState</code>, <code>withComputed</code>, <code>withMethods</code>) in a declarative pipeline. A plain service is imperative. signalStore() adds structure, DevTools support, and composable entity management via <code>withEntities()</code>.' },
    { q: 'How does patchState() work?', a: '<code>patchState(store, partialState)</code> merges a partial object into the store\'s current state — like <code>Object.assign</code> but type-safe and reactive. Signals update immediately after the patch, triggering re-renders in any component that reads them.' },
    { q: 'How do you provide a signalStore at component level (not root)?', a: 'Remove <code>{ providedIn: \'root\' }</code> from the store definition. Then add the store class to the component\'s <code>providers: [MyStore]</code>. Each component instance gets its own store that is destroyed with the component.' },
    { q: 'What is withEntities() and when should you use it?', a: '<code>withEntities&lt;T&gt;()</code> adds a normalised entity collection to the store. It provides <code>entities()</code>, <code>entityMap()</code>, and <code>ids()</code> signals plus update functions like <code>addEntity()</code>, <code>removeEntity()</code>, <code>updateEntity()</code>.' },
    { q: 'What is rxMethod() and why would you use it?', a: '<code>rxMethod&lt;T&gt;(pipe(...))</code> creates a store method that accepts a value, signal, or Observable and pipes it through RxJS operators. Used for async operations like API calls with switchMap. Automatically cleans up subscriptions on store destroy.' },
    { q: 'How do you read derived state in a signalStore template?', a: 'Derived signals from <code>withComputed()</code> are accessible directly on the injected store: <code>store.itemCount()</code>, <code>store.total()</code>. They are memoised computed signals — Angular only re-renders when their dependencies change.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is @ngrx/signals?',
      points: [
        '@ngrx/signals is the official NgRx state management library built entirely on Angular signals — no RxJS required.',
        'signalStore() composes features: withState(), withComputed(), withMethods(), withHooks(), withEntities().',
        'Stores are injectable services — provide { providedIn: "root" } for global state or in component providers for local state.',
        'Unlike NgRx Store, there are no actions, reducers, or effects to wire up — just functions that call patchState().',
      ],
    },
    {
      heading: 'Store composition',
      points: [
        'withState<T>(initialState) — defines the shape and initial values. Each key becomes a signal.',
        'withComputed(({ signal }) => ({ derived: computed(() => ...) })) — derived read-only signals.',
        'withMethods(store => ({ action() { patchState(store, partialUpdate) } })) — mutating methods.',
        'withHooks({ onInit(store) { ... } }) — lifecycle hooks for side effects on store init/destroy.',
      ],
    },
    {
      heading: 'patchState + entities',
      points: [
        'patchState(store, partialState) merges a partial state object — like Object.assign but type-safe.',
        'withEntities<Entity>() adds an entity adapter: selectAll(), addEntity(), updateEntity(), removeEntity().',
        'Entity collections are automatically normalised (id-keyed map) for O(1) lookups.',
        'Use setAllEntities(), addEntities() for bulk operations on entity collections.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'State is immutable — never mutate store signals directly; always go through patchState() or store methods.',
        'Computed signals in withComputed() are memoised — they only recompute when their dependencies change.',
        'For async operations use withMethods + async functions; for complex effects use rxMethod() from @ngrx/signals/rxjs-interop.',
        'DevTools support: install @ngrx/signals-devtools (experimental) for Redux DevTools integration.',
      ],
    },
  ];

  tabs: CodeTab[] = [
    {
      label: 'signalStore()',
      language: 'typescript',
      code: `import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

const CounterStore = signalStore(
  { providedIn: 'root' },
  withState({ count: 0, step: 1 }),
  withComputed(({ count, step }) => ({
    doubled:  computed(() => count() * 2),
    canReset: computed(() => count() !== 0),
  })),
  withMethods(store => ({
    increment() { patchState(store, { count: store.count() + store.step() }); },
    decrement() { patchState(store, { count: store.count() - store.step() }); },
    reset()     { patchState(store, { count: 0 }); },
    setStep(s: number) { patchState(store, { step: s }); },
  })),
);

// Usage in component:
// store = inject(CounterStore);
// store.count()     → signal read
// store.increment() → method call`,
    },
    {
      label: 'withEntities()',
      language: 'typescript',
      code: `import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { withEntities, setAllEntities, addEntity, removeEntity, updateEntity } from '@ngrx/signals/entities';

interface Todo { id: number; title: string; done: boolean; }

const TodoStore = signalStore(
  withEntities<Todo>(),
  withMethods(store => ({
    load(todos: Todo[])         { patchState(store, setAllEntities(todos)); },
    add(todo: Todo)             { patchState(store, addEntity(todo)); },
    remove(id: number)         { patchState(store, removeEntity(id)); },
    toggle(id: number)         {
      patchState(store, updateEntity({ id, changes: t => ({ done: !t.done }) }));
    },
  })),
);

// store.entities()   → Todo[]  (all items)
// store.entityMap()  → Record<id, Todo>  (O(1) lookup)
// store.ids()        → number[]`,
    },
    {
      label: 'withHooks + rxMethod',
      language: 'typescript',
      code: `import { withHooks, withMethods } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap } from 'rxjs';

const DataStore = signalStore(
  withState({ data: [] as Item[], loading: false }),
  withMethods(store => ({
    // rxMethod bridges RxJS into the signal store — auto-cleaned on destroy
    loadData: rxMethod<void>(pipe(
      tap(() => patchState(store, { loading: true })),
      switchMap(() => inject(DataService).getAll()),
      tap(data => patchState(store, { data, loading: false })),
    )),
  })),
  withHooks({
    onInit(store) { store.loadData(); },     // call on store creation
    onDestroy(store) { console.log('bye'); },
  }),
);`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What function is used to update state inside a signalStore() method?', options: ['setState(store, partial)', 'patchState(store, partial)', 'updateState(store, partial)', 'store.set(partial)'], answer: 1, explanation: 'patchState(store, partialState) is the correct function. It merges a partial state object into the existing store state in a type-safe, reactive way — similar to Object.assign but designed for NgRx signal stores.' },
    { q: 'Which import path provides withEntities(), addEntity(), and removeEntity()?', options: ['@ngrx/signals', '@ngrx/store/entities', '@ngrx/signals/entities', '@ngrx/signals/rxjs-interop'], answer: 2, explanation: 'Entity adapter helpers like withEntities(), setAllEntities(), addEntity(), removeEntity(), and updateEntity() all come from \'@ngrx/signals/entities\', a separate sub-entry point of the @ngrx/signals package.' },
    { q: 'What signals does withEntities<Todo>() automatically expose on the store?', options: ['todos(), todosMap(), and todosCount()', 'entities(), entityMap(), and ids()', 'all(), byId(), and keys()', 'selectAll(), selectMap(), and selectIds()'], answer: 1, explanation: 'withEntities<T>() adds three signals: entities() which returns T[], entityMap() which returns a Record<id, T> for O(1) lookups, and ids() which returns the array of ids.' },
    { q: 'What is the key advantage of using rxMethod() from @ngrx/signals/rxjs-interop?', options: ['It converts signals into Observables for backward compatibility', 'It creates a store method that accepts a value, signal, or Observable and auto-cleans subscriptions on store destroy', 'It replaces withHooks() for async initialization', 'It enables NgRx Effects to work inside a signalStore'], answer: 1, explanation: 'rxMethod<T>(pipe(...)) creates a method that bridges RxJS into the signal world. It accepts a raw value, a signal reference, or an Observable as input and automatically unsubscribes when the store is destroyed, preventing memory leaks.' },
    { q: 'How do you scope a signalStore to a single component instance instead of providing it globally?', options: ['Pass { providedIn: \'component\' } to signalStore()', 'Use @Injectable({ scope: \'component\' }) on the store class', 'Omit { providedIn: \'root\' } from signalStore() and add the store class to the component\'s providers array', 'Call store.scoped() inside the component constructor'], answer: 2, explanation: 'To scope a store to a component, you omit the { providedIn: \'root\' } option from signalStore() and list the store class in the component decorator\'s providers: [MyStore]. Each component instance then gets its own store that is destroyed alongside the component.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'signalStore()', type: 'function', desc: 'Creates a composable, injectable NgRx signal store by composing feature functions like withState, withComputed, and withMethods.' , since: '17'},
    { name: 'withState()', type: 'function', desc: 'Defines the initial state shape for a signalStore; each key becomes a reactive signal on the store.' , since: '17'},
    { name: 'withComputed()', type: 'function', desc: 'Adds memoised derived signals to a signalStore using Angular computed(); only recomputes when dependencies change.' , since: '17'},
    { name: 'withMethods()', type: 'function', desc: 'Attaches mutating methods to a signalStore; methods call patchState() to update state in a type-safe, reactive way.' , since: '17'},
    { name: 'patchState()', type: 'function', desc: 'Merges a partial state object into the current store state, triggering reactive updates in any component that reads the changed signals.' , since: '17'},
    { name: 'withEntities()', type: 'function', desc: 'Adds a normalised entity collection to a signalStore, exposing entities(), entityMap(), and ids() signals plus CRUD helpers.' , since: '17'},
    { name: 'withHooks()', type: 'function', desc: 'Registers onInit and onDestroy lifecycle hooks on a signalStore for side effects when the store is created or destroyed.' , since: '17'},
    { name: 'rxMethod()', type: 'function', desc: 'Creates a store method (from @ngrx/signals/rxjs-interop) that accepts a value, signal, or Observable and pipes it through RxJS operators with automatic cleanup.' , since: '17'},
    { name: 'addEntity() / removeEntity() / updateEntity()', type: 'function', desc: 'Entity adapter helpers from @ngrx/signals/entities that produce partial state updaters for use with patchState().' , since: '17'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Global state: NgRx Store (actions/reducers) vs signalStore()', before: '// NgRx classic — actions, reducer, effects\nexport const increment = createAction(\'[Counter] Increment\');\nexport const reducer = createReducer(\n  { count: 0 },\n  on(increment, s => ({ ...s, count: s.count + 1 }))\n);', after: '// NgRx Signals — no actions, no reducer\nconst CounterStore = signalStore(\n  { providedIn: \'root\' },\n  withState({ count: 0 }),\n  withMethods(store => ({\n    increment() { patchState(store, { count: store.count() + 1 }); },\n  }))\n);',
      note: 'signalStore() replaces actions + reducers with direct method calls and patchState().' },
    { title: 'Derived state: selector vs withComputed()', before: '// Classic NgRx selector\nexport const selectDoubled = createSelector(\n  selectCount,\n  count => count * 2\n);\n// component: this.doubled$ = store.select(selectDoubled);', after: '// signalStore withComputed\nwithComputed(({ count }) => ({\n  doubled: computed(() => count() * 2),\n}))\n// component: store.doubled()  — plain signal call, no subscribe',
      note: 'withComputed() replaces createSelector(); the result is a memoised signal, not an Observable.' },
    { title: 'Async ops: NgRx Effects vs rxMethod()', before: '// NgRx Effects\nloadData$ = createEffect(() =>\n  this.actions$.pipe(\n    ofType(loadData),\n    switchMap(() => this.api.getAll()),\n    map(data => loadDataSuccess({ data }))\n  )\n);', after: '// signalStore rxMethod\nloadData: rxMethod<void>(pipe(\n  tap(() => patchState(store, { loading: true })),\n  switchMap(() => inject(DataService).getAll()),\n  tap(data => patchState(store, { data, loading: false }))\n))',
      note: 'rxMethod() from @ngrx/signals/rxjs-interop bridges RxJS into signal stores and auto-cleans on destroy.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Mutating state directly instead of using patchState()', wrong: '// WRONG — mutating signal value directly\nwithMethods(store => ({\n  addItem(item: Item) {\n    store.items().push(item); // direct mutation, NOT reactive\n  }\n}))', right: 'withMethods(store => ({\n  addItem(item: Item) {\n    patchState(store, { items: [...store.items(), item] });\n  }\n}))', explanation: 'Store state is immutable. Direct mutation bypasses reactivity; Angular will not detect the change. Always use patchState() to produce a new state reference.'  },
    { title: 'Forgetting to call signal values with () inside computed()', wrong: 'withComputed(({ count }) => ({\n  // WRONG — count is a signal, not a plain value\n  doubled: computed(() => count * 2),\n}))', right: 'withComputed(({ count }) => ({\n  doubled: computed(() => count() * 2),\n}))', explanation: 'Destructured store slices are signals. You must invoke them with () inside computed() to register the dependency and get the current value.'  },
    { title: 'Providing the store globally when component-scoped state is needed', wrong: '// WRONG — all components share the same instance\nconst FormStore = signalStore(\n  { providedIn: \'root\' }, // global singleton\n  withState({ value: \'\' })\n);', right: '// No providedIn — scope via component providers\nconst FormStore = signalStore(withState({ value: \'\' }));\n@Component({ providers: [FormStore] }) // each instance is isolated\nexport class FormComponent { store = inject(FormStore); }', explanation: 'Using providedIn: \'root\' creates a singleton. For per-instance state (e.g. forms, dialogs), omit it and add the store class to the component\'s providers array.'  },
    { title: 'Importing entity helpers from the wrong path', wrong: '// WRONG — these do NOT exist in \'@ngrx/signals\'\nimport { withEntities, addEntity } from \'@ngrx/signals\';', right: 'import { withEntities, addEntity, removeEntity, updateEntity } from \'@ngrx/signals/entities\';', explanation: 'Entity adapter utilities live in the @ngrx/signals/entities sub-entry point. Importing from @ngrx/signals will fail at runtime with a missing export error.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '17', label: '@ngrx/signals initial release', features: ['signalStore() with withState(), withComputed(), withMethods(), withHooks()', 'patchState() for immutable state updates', 'withEntities() entity adapter from @ngrx/signals/entities', 'rxMethod() RxJS bridge from @ngrx/signals/rxjs-interop'] },
    { version: '18', label: 'Stabilisation and custom store features', features: ['signalStoreFeature() for reusable, composable store feature functions', 'type() helper for strongly-typed custom feature input constraints'] },
  ];

  challenge: Challenge = {
    title: 'Build a Todo Signal Store with Entity Adapter',
    description: 'Create a NgRx signal store for a todo list using withEntities(). The store should support adding todos, toggling their completion status, and removing them. Wire it up to a minimal template that renders the list and shows a count of remaining incomplete todos.',
    language: 'typescript',
    hints: [
      'Import withEntities, addEntity, removeEntity, and updateEntity from \'@ngrx/signals/entities\'. Your Todo interface needs an id field for the entity adapter to work.',
      'Use patchState(store, addEntity(todo)) to add an item. The entity adapter automatically normalises it into the internal id-keyed map.',
      'For toggling, use updateEntity({ id, changes: t => ({ done: !t.done }) }) as the second argument to patchState.',
      'In withComputed(), derive a remaining signal with computed(() => store.entities().filter(t => !t.done).length) to count incomplete todos.',
    ],
    starterCode: `import { Component, inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { withEntities, addEntity, removeEntity, updateEntity } from '@ngrx/signals/entities';
import { FormsModule } from '@angular/forms';

interface Todo {
  id: number;
  title: string;
  done: boolean;
}

// TODO: Create TodoStore using signalStore()
// - Use withEntities<Todo>()
// - Add withComputed() that exposes a 'remaining' count (todos where done === false)
// - Add withMethods() with: add(title: string), toggle(id: number), remove(id: number)
const TodoStore = signalStore(
  { providedIn: 'root' },
  // your code here
);

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [FormsModule],
  template: \`
    <h2>Todos ({{ store.remaining() }} remaining)</h2>
    <div>
      <input [(ngModel)]="newTitle" placeholder="New todo" />
      <button (click)="addTodo()">Add</button>
    </div>
    <ul>
      @for (todo of store.entities(); track todo.id) {
        <li>
          <input type="checkbox" [checked]="todo.done" (change)="store.toggle(todo.id)" />
          <span [style.text-decoration]="todo.done ? 'line-through' : 'none'">{{ todo.title }}</span>
          <button (click)="store.remove(todo.id)">Remove</button>
        </li>
      }
    </ul>
  \`,
})
export class TodoComponent {
  store = inject(TodoStore);
  newTitle = '';
  nextId = 1;

  addTodo() {
    if (this.newTitle.trim()) {
      this.store.add(this.newTitle.trim());
      this.newTitle = '';
    }
  }
}`,
    solution: `import { Component, inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { withEntities, addEntity, removeEntity, updateEntity } from '@ngrx/signals/entities';
import { FormsModule } from '@angular/forms';

interface Todo {
  id: number;
  title: string;
  done: boolean;
}

let _nextId = 1;

const TodoStore = signalStore(
  { providedIn: 'root' },
  withEntities<Todo>(),
  withComputed((store) => ({
    remaining: computed(() => store.entities().filter(t => !t.done).length),
  })),
  withMethods((store) => ({
    add(title: string) {
      patchState(store, addEntity({ id: _nextId++, title, done: false }));
    },
    toggle(id: number) {
      patchState(store, updateEntity({ id, changes: t => ({ done: !t.done }) }));
    },
    remove(id: number) {
      patchState(store, removeEntity(id));
    },
  })),
);

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [FormsModule],
  template: \`
    <h2>Todos ({{ store.remaining() }} remaining)</h2>
    <div>
      <input [(ngModel)]="newTitle" placeholder="New todo" />
      <button (click)="addTodo()">Add</button>
    </div>
    <ul>
      @for (todo of store.entities(); track todo.id) {
        <li>
          <input type="checkbox" [checked]="todo.done" (change)="store.toggle(todo.id)" />
          <span [style.text-decoration]="todo.done ? 'line-through' : 'none'">{{ todo.title }}</span>
          <button (click)="store.remove(todo.id)">Remove</button>
        </li>
      }
    </ul>
  \`,
})
export class TodoComponent {
  store = inject(TodoStore);
  newTitle = '';

  addTodo() {
    if (this.newTitle.trim()) {
      this.store.add(this.newTitle.trim());
      this.newTitle = '';
    }
  }
}`,
  };
}
