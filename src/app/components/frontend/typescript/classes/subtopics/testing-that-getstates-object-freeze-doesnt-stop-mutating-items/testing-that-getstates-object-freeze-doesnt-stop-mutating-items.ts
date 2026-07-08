import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-getstate-freeze-mutation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-getstates-object-freeze-doesnt-stop-mutating-items.html',
  styleUrl: './testing-that-getstates-object-freeze-doesnt-stop-mutating-items.scss',
})
export class TestingThatGetstatesObjectFreezeDoesntStopMutatingItemsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Challenge Solution\'s getState',
      points: [
        'The challenge solution implements <code>getState(): Readonly&lt;TState&gt; { return Object.freeze({ ...this.#state }) as Readonly&lt;TState&gt;; }</code>. Unlike a mere TypeScript <code>Readonly&lt;T&gt;</code> ANNOTATION, <code>Object.freeze</code> is a genuine RUNTIME mechanism — it sounds like it should actually protect the returned state from mutation.',
        'This subtopic tests that directly against the challenge\'s own <code>CartState { items: CartItem[]; discount: number; loading: boolean }</code>: does mutating the <code>items</code> array on a value returned by <code>getState()</code> actually get blocked, or does it silently corrupt the store\'s real internal state?',
      ],
    },
    {
      heading: 'Why Object.freeze({ ...state }) Doesn\'t Protect Nested Arrays',
      points: [
        'Two facts combine here. First, <code>Object.freeze</code> is SHALLOW — it only prevents reassigning or deleting the TOP-LEVEL properties of the object it\'s called on; it does nothing to any object or array referenced BY those properties. Second, the spread <code>{ ...this.#state }</code> is also shallow — it copies each top-level property\'s VALUE, but for a reference type like an array, "copying the value" means copying the REFERENCE, not the array\'s contents.',
        'Put together: <code>Object.freeze({ ...this.#state })</code> creates a NEW top-level object (so <code>result.items = []</code> correctly throws/fails), but <code>result.items</code> is the EXACT SAME array object as <code>this.#state.items</code> — freezing the wrapper does nothing to that array, which remains fully mutable.',
        'The consequence is serious: calling <code>.push()</code> on <code>getState().items</code> mutates the store\'s REAL, live internal <code>#state.items</code> array directly — completely bypassing <code>setState()</code>, which means the <code>#listeners</code> subscription system never fires for this mutation. Any UI subscribed to the store silently goes stale.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Object.freeze and nested array mutation</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// The challenge's own Store<TState> and CartStore, unchanged
interface CartItem { id: string; name: string; qty: number; price: number }
interface CartState { items: CartItem[]; discount: number; loading: boolean }

abstract class Store<TState extends object> {
  #state: TState;
  #listeners = new Set<(state: TState) => void>();

  constructor() {
    this.#state = this.initialState();
  }

  abstract initialState(): TState;

  getState(): Readonly<TState> {
    return Object.freeze({ ...this.#state }) as Readonly<TState>;
  }

  protected setState(partial: Partial<TState>): void {
    this.#state = { ...this.#state, ...partial };
    for (const listener of this.#listeners) listener(this.#state);
  }

  subscribe(listener: (state: TState) => void): () => void {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }
}

class CartStore extends Store<CartState> {
  override initialState(): CartState {
    return { items: [], discount: 0, loading: false };
  }
  addItem(item: CartItem): void {
    this.setState({ items: [...this.getState().items, item] });
  }
}

const cart = new CartStore();
let notificationCount = 0;
cart.subscribe(() => { notificationCount++; });
notificationCount = 0; // ignore the initial immediate emit on subscribe

cart.addItem({ id: '1', name: 'Shirt', qty: 1, price: 29.99 });
console.log('after addItem via setState, notifications:', notificationCount); // 1 -- correct path

// Now bypass setState entirely -- mutate the array from getState() directly
const snapshot = cart.getState();
// snapshot.discount = 50;
// Uncomment above -- Object.freeze should correctly block this top-level reassignment

snapshot.items.push({ id: '2', name: 'Hat', qty: 1, price: 15 }); // does THIS throw?
console.log('items.length after direct push:', cart.getState().items.length); // 1 or 2?
console.log('notifications after the direct push:', notificationCount); // did a subscriber get notified?
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Uncomment `snapshot.discount = 50;`. Confirm it throws (or silently fails in non-strict mode). Then explain why `snapshot.items.push(...)` right below it does NOT throw, even though both are "part of the frozen state".',
    hint: 'Object.freeze only locks the top-level property SLOTS of the object it is called on directly — it never recurses into objects or arrays referenced by those slots.',
    solution: `snapshot.discount = 50 throws (in strict mode, which ES modules use
by default) or silently fails: "Cannot assign to read only property
'discount'" -- Object.freeze correctly protects this TOP-LEVEL
property reassignment.

snapshot.items.push(...) does NOT throw, and the log confirms
cart.getState().items.length becomes 2, not 1 -- the push genuinely
mutated the store's real internal #state.items array, completely
outside of setState(). The notification count log confirms this:
no new notification fired, meaning any UI subscribed to this store
is now silently out of sync with its actual data.

The root cause is that Object.freeze is shallow AND the spread that
creates the "snapshot" is also shallow -- items is the same array
reference before and after both operations. A correct fix needs a
DEEP freeze (recursively freezing every nested object and array) or,
more idiomatically for a store, always returning defensively-copied
arrays/objects from getState(), not just a frozen wrapper around
shared references.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'because `getState()` wraps its return value in `Object.freeze`, the entire returned state — including nested arrays like `items` — is genuinely protected from mutation.',
      reality: '`Object.freeze` is shallow — it only locks the top-level property slots of the object it is called on directly; any array or object referenced by those properties (like `items`) remains fully mutable, and is in fact the SAME array the store\'s real internal state uses.',
    },
    {
      thought: 'the spread `{ ...this.#state }` inside `getState()` creates an independent copy of the state, safely decoupled from the store\'s internals.',
      reality: 'the spread only copies the TOP-LEVEL property values — for a reference type like an array, that means copying the reference itself, not the array\'s contents, so the "copy" still shares its `items` array with the live internal state.',
    },
    {
      thought: 'even if a caller does mutate `getState().items` directly, the store\'s `subscribe`/listener system would still eventually notice and notify subscribers.',
      reality: 'mutating the array in place completely bypasses `setState()`, the ONLY code path that calls the registered listeners — subscribers receive no notification at all, and the UI silently goes stale relative to the actual data.',
    },
  ];
}
