import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-readonly-and-services-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './readonly-and-services.html',
  styleUrl: './readonly-and-services.scss',
})
export class ReadonlyAndServicesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Why state moves into a service: sharing it across unrelated components',
      points: [
        'A signal declared as a component field only lives as long as that component instance, and only that component (plus its children, via <code>@Input</code>) can see it. The moment two components that are NOT parent/child both need the same state — a shopping cart, the logged-in user, a theme preference — a component field cannot be the source of truth.',
        'A service created with <code>&#64;Injectable({ providedIn: \'root\' })</code> is instantiated once by Angular\'s dependency injector and shared by every component that injects it. Put a signal on that service, and every injecting component reads/writes the exact same signal instance — the same mental model as a global store, but wired through DI instead of imports.',
      ],
    },
    {
      heading: 'The pattern: private writable signal + public readonly signal',
      points: [
        '<code>private _count = signal(0); readonly count = this._count.asReadonly();</code> — the service keeps the writable signal private, and exposes a <strong>readonly view</strong> of it publicly. Consuming components can call <code>service.count()</code> to read, but <code>service.count.set(...)</code> does not exist on the type — TypeScript blocks it at compile time.',
        '<code>.asReadonly()</code> does NOT copy the value or create a snapshot — it returns a live, linked view of the same underlying signal. When <code>_count</code> changes, <code>count()</code> reflects it immediately; there is no separate state to keep in sync.',
      ],
    },
    {
      heading: 'Why bother — why not just make the signal public and writable?',
      points: [
        'A public writable signal lets ANY component that injects the service set an arbitrary, potentially invalid value directly, with zero validation and zero way to know who changed it or why. Public readonly + explicit methods (<code>addItem()</code>, <code>clear()</code>, <code>setQuantity(n)</code>) gives the service full control over what values are ever allowed to exist — the same encapsulation reason you would not make a class\'s internal array public and mutable in any other OOP design.',
        'This mirrors a very old, very battle-tested principle (encapsulation) — signals do not change that, they just make the "expose readonly, mutate through methods" pattern nearly free to write.',
      ],
    },
    {
      heading: 'computed() belongs in the service too',
      points: [
        'A derived value like a cart total, an item count, or a "hasUnsavedChanges" flag is exactly as shareable as the state it is derived from — define the <code>computed()</code> once on the service, next to the signal it reads, and every component that injects the service gets the same memoised, always-in-sync derived value for free. There is no reason to recompute the same derivation separately in every component that needs it.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/cart.service.ts',
      content: `import { Injectable, signal, computed } from '@angular/core';

interface CartItem { id: number; name: string; price: number; qty: number; }

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = signal<CartItem[]>([
    { id: 1, name: 'Keyboard', price: 60, qty: 1 },
  ]);

  // Public: read-only view. Consumers CANNOT call items.set(...) — it doesn't exist.
  readonly items = this._items.asReadonly();

  // Derived state lives here too — one source of truth, shared by every consumer.
  readonly total = computed(() =>
    this._items().reduce((sum, i) => sum + i.price * i.qty, 0)
  );

  readonly itemCount = computed(() =>
    this._items().reduce((sum, i) => sum + i.qty, 0)
  );

  // All writes go through methods — the service controls what's ever allowed to happen.
  addQty(id: number, delta: number) {
    this._items.update(items =>
      items.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
    );
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { CartService } from './cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h2>Cart ({{ cart.itemCount() }} items)</h2>
    <ul>
      @for (item of cart.items(); track item.id) {
        <li>
          {{ item.name }} — \${{ item.price }} × {{ item.qty }}
          <button (click)="cart.addQty(item.id, -1)">-</button>
          <button (click)="cart.addQty(item.id, 1)">+</button>
        </li>
      }
    </ul>
    <p><strong>Total: \${{ cart.total() }}</strong></p>
    <p><small>cart.items is read-only here — try cart.items.set([]) in the console, it won't compile.</small></p>
  \`,
})
export class App {
  // inject() gets the SAME singleton instance every component in the app would get
  cart = inject(CartService);
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
  <head><title>Signals in services</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a clear() method to CartService that empties the cart (sets _items to []), and a "Clear cart" button in the template that calls it.',
    hint: 'clear() { this._items.set([]); } on the service — then <button (click)="cart.clear()">Clear cart</button> in the template, same pattern as the existing addQty button.',
    solution: `// In CartService:
clear() {
  this._items.set([]);
}

// In the template:
<button (click)="cart.clear()">Clear cart</button>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'sharing state between two unrelated sibling components requires @Input/@Output through a common parent, same as always.',
      reality: 'a service with <code>providedIn: \'root\'</code> is a single shared instance for the whole app — any two components can inject it and read/write the exact same signal, with no parent-child relationship or @Input/@Output plumbing needed at all.',
    },
    {
      thought: '.asReadonly() creates a snapshot or copy — changes to the private signal after that point won\'t show up in the readonly one.',
      reality: '<code>.asReadonly()</code> returns a live, linked view of the same signal — it always reflects the current value. There is no copy and no risk of the two drifting apart.',
    },
    {
      thought: 'computed() values need to be recalculated separately in every component that uses them, since each component is a separate instance.',
      reality: 'if the <code>computed()</code> lives on a shared service (not inside a component), every injecting component reads the exact same memoised value — it is calculated once per dependency change, not once per component.',
    },
  ];
}
