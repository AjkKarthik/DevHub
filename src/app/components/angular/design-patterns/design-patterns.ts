import { Component, signal, computed } from '@angular/core';

interface Pattern {
  name: string;
  category: string;
  intent: string;
  whenToUse: string[];
  whenNotToUse: string[];
  example: string;
  pitfalls: string[];
}

@Component({
  selector: 'app-design-patterns',
  standalone: true,
  imports: [],
  templateUrl: './design-patterns.html',
  styleUrl: './design-patterns.scss',
})
export class DesignPatternsComponent {
  categories = ['All', 'Component', 'State', 'DI', 'Architecture', 'Performance'];
  activeCategory = signal('All');
  expanded = signal<string | null>(null);

  patterns: Pattern[] = [
    {
      name: 'Smart / Presentational Split',
      category: 'Component',
      intent: 'Separate components that know about services and state (smart) from components that only render inputs and emit outputs (presentational).',
      whenToUse: [
        'A UI fragment (card, row, list item) is reused across pages with different data sources',
        'You want components testable with plain inputs — no TestBed providers, no HTTP mocks',
        'A page component is doing both data fetching and detailed rendering and has grown past ~200 lines',
      ],
      whenNotToUse: [
        'Tiny apps or one-off pages where the split doubles the file count for zero reuse',
        'When the "presentational" component would need 10+ inputs — it is really a smart component in denial',
        'Deep trees where you would relay the same inputs through 4 layers — inject a shared service instead of prop-drilling',
      ],
      example: `// Presentational: pure inputs/outputs, no injected services
@Component({
  selector: 'app-user-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <article class="card" [class.inactive]="!user().active">
      <h3>{{ user().name }}</h3>
      <button (click)="selected.emit(user().id)">View</button>
    </article>
  \`,
})
export class UserCardComponent {
  user = input.required<User>();
  selected = output<number>();
}

// Smart: owns data access, passes state down, handles events up
@Component({
  selector: 'app-user-list-page',
  standalone: true,
  imports: [UserCardComponent],
  template: \`
    @for (u of users.value() ?? []; track u.id) {
      <app-user-card [user]="u" (selected)="open($event)" />
    }
  \`,
})
export class UserListPageComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  users = httpResource<User[]>(() => '/api/users');

  open(id: number) { this.router.navigate(['/users', id]); }
}`,
      pitfalls: [
        'Letting a presentational component inject HttpClient "just this once" quietly destroys the boundary',
        'Mutating an input object inside the child breaks OnPush assumptions — treat inputs as read-only',
        'Over-splitting: a component used in exactly one place rarely needs the ceremony',
      ],
    },
    {
      name: 'Content Projection (Slots)',
      category: 'Component',
      intent: 'Let a wrapper component define structure and styling while consumers supply the inner content via ng-content slots.',
      whenToUse: [
        'Reusable shells: cards, modals, panels, page layouts where only the inside varies',
        'When passing content as a string/template input would force HTML through bindings',
        'Multi-slot layouts (header / body / footer) where each consumer fills different regions',
      ],
      whenNotToUse: [
        'When the projected content needs to be instantiated lazily or repeatedly — use ng-template + NgTemplateOutlet instead',
        'Simple text that a plain input() string covers',
        'When the child must imperatively control the projected content lifecycle — projection is render-time, not logic-time',
      ],
      example: `@Component({
  selector: 'app-panel',
  standalone: true,
  template: \`
    <section class="panel">
      <header class="panel-head">
        <ng-content select="[panel-title]" />
        <ng-content select="[panel-actions]" />
      </header>
      <div class="panel-body">
        <ng-content />   <!-- default slot: everything unmatched -->
      </div>
      <footer class="panel-foot">
        <ng-content select="[panel-footer]" />
      </footer>
    </section>
  \`,
})
export class PanelComponent {}

// Consumer fills the slots declaratively:
@Component({
  standalone: true,
  imports: [PanelComponent],
  template: \`
    <app-panel>
      <h2 panel-title>Billing</h2>
      <button panel-actions (click)="refresh()">Refresh</button>
      <p>Invoices for {{ month() }}…</p>
      <small panel-footer>Updated {{ updatedAt() }}</small>
    </app-panel>
  \`,
})
export class BillingComponent { /* ... */ }`,
      pitfalls: [
        'Projected content is instantiated by the parent even if the slot is hidden with @if inside the child — side effects still run',
        'Each ng-content slot can be used once per element; duplicating select selectors silently drops content',
        'Styling projected content from the shell requires ::ng-deep or CSS variables — plan the theming contract up front',
      ],
    },
    {
      name: 'Control Value Accessor as Adapter',
      category: 'Component',
      intent: 'Implement ControlValueAccessor so a custom widget plugs into Angular forms exactly like a native input.',
      whenToUse: [
        'Custom form widgets: star ratings, tag pickers, rich toggles that must work with formControlName / ngModel',
        'Wrapping a third-party widget (date picker, editor) so forms code never sees the vendor API',
        'Composite controls (e.g. country + phone) that should validate and dirty-track as one value',
      ],
      whenNotToUse: [
        'Display-only components that never participate in a form — plain input()/output() is simpler',
        'When a native input plus CSS gets you there — restyle before you re-implement',
        'One-off internal forms where binding value/valueChange manually is honest and shorter',
      ],
      example: `@Component({
  selector: 'app-star-rating',
  standalone: true,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => StarRatingComponent),
    multi: true,
  }],
  template: \`
    @for (star of stars; track star) {
      <button type="button"
              [disabled]="disabled()"
              [class.filled]="star <= value()"
              (click)="set(star)">★</button>
    }
  \`,
})
export class StarRatingComponent implements ControlValueAccessor {
  stars = [1, 2, 3, 4, 5];
  value = signal(0);
  disabled = signal(false);

  private onChange: (v: number) => void = () => {};
  private onTouched: () => void = () => {};

  set(star: number) {
    this.value.set(star);
    this.onChange(star);     // push value into the form
    this.onTouched();
  }

  // Form -> component
  writeValue(v: number): void { this.value.set(v ?? 0); }
  registerOnChange(fn: (v: number) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }
}

// Usage — identical to a native control:
// <app-star-rating formControlName="rating" />`,
      pitfalls: [
        'Forgetting multi: true on the NG_VALUE_ACCESSOR provider clobbers every other accessor in the injector',
        'Calling onChange inside writeValue creates feedback loops with valueChanges subscribers',
        'Not calling onTouched means the control never becomes touched and validation messages never appear',
      ],
    },
    {
      name: 'Signal Store Service',
      category: 'State',
      intent: 'Hold feature state in a service as private writable signals, exposing read-only signals and computed views plus explicit update methods.',
      whenToUse: [
        'State shared by multiple components in a feature (selection, filters, loaded entities)',
        'You want synchronous, glitch-free derived state via computed() instead of combineLatest gymnastics',
        'You want a single place to enforce state invariants instead of scattered .set() calls',
      ],
      whenNotToUse: [
        'State used by exactly one component — keep the signals in the component',
        'Complex async orchestration with cancellation/race rules — RxJS streams or the NgRx SignalStore library handle that better',
        'Server cache state that httpResource / resource already manages for you',
      ],
      example: `@Injectable({ providedIn: 'root' })
export class CartStore {
  // Private writable state — the only place mutation happens
  private readonly _items = signal<CartItem[]>([]);
  private readonly _couponPct = signal(0);

  // Public read-only views
  readonly items = this._items.asReadonly();
  readonly count = computed(() =>
    this._items().reduce((n, i) => n + i.qty, 0));
  readonly subtotal = computed(() =>
    this._items().reduce((s, i) => s + i.price * i.qty, 0));
  readonly total = computed(() =>
    this.subtotal() * (1 - this._couponPct() / 100));

  add(product: Product, qty = 1): void {
    this._items.update(items => {
      const existing = items.find(i => i.id === product.id);
      return existing
        ? items.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i)
        : [...items, { id: product.id, price: product.price, qty }];
    });
  }

  remove(id: number): void {
    this._items.update(items => items.filter(i => i.id !== id));
  }

  applyCoupon(pct: number): void {
    this._couponPct.set(Math.min(Math.max(pct, 0), 100));
  }
}

// Component just reads: total = inject(CartStore).total;`,
      pitfalls: [
        'Exposing the writable signal directly lets any component bypass your invariants — always .asReadonly()',
        'update() must return new arrays/objects; mutating in place defeats signal equality and skips updates',
        'A root-provided store outlives the feature — reset state on feature exit or provide it at the route level',
      ],
    },
    {
      name: 'Facade Service over HTTP',
      category: 'State',
      intent: 'Put one injectable facade between components and the data layer so components express intent (loadOrders) and never touch HttpClient or caching details.',
      whenToUse: [
        'Several components need the same data operations and you want one cached, deduplicated source',
        'You want to swap the transport (REST today, mock in tests, WebSocket later) without touching components',
        'Loading/error/data status should be handled once, not re-implemented per component',
      ],
      whenNotToUse: [
        'A page with one HTTP call used nowhere else — httpResource directly in the component is fine',
        'As a mandatory wrapper over every endpoint "for architecture" — empty pass-through facades are noise',
        'When NgRx (or another store) already provides the facade-shaped API for that feature',
      ],
      example: `@Injectable({ providedIn: 'root' })
export class OrdersFacade {
  private http = inject(HttpClient);

  private readonly _query = signal<{ status: string; page: number }>(
    { status: 'all', page: 1 });

  // Resource re-fetches automatically when the query signal changes
  private readonly ordersResource = httpResource<Order[]>(() => {
    const q = this._query();
    return \`/api/orders?status=\${q.status}&page=\${q.page}\`;
  });

  // What components see: state, not transport
  readonly orders = computed(() => this.ordersResource.value() ?? []);
  readonly loading = computed(() => this.ordersResource.isLoading());
  readonly error = computed(() => this.ordersResource.error());
  readonly openCount = computed(() =>
    this.orders().filter(o => o.status === 'open').length);

  filterByStatus(status: string): void {
    this._query.update(q => ({ ...q, status, page: 1 }));
  }

  nextPage(): void {
    this._query.update(q => ({ ...q, page: q.page + 1 }));
  }

  async cancel(id: number): Promise<void> {
    await firstValueFrom(this.http.post(\`/api/orders/\${id}/cancel\`, {}));
    this.ordersResource.reload();
  }
}`,
      pitfalls: [
        'Leaking HttpErrorResponse or DTO types through the facade re-couples components to the transport',
        'Facades that grow to cover three features become god services — one facade per feature boundary',
        'Mutations must invalidate or reload the resource, or the UI shows stale data after a write',
      ],
    },
    {
      name: 'linkedSignal State Reset',
      category: 'State',
      intent: 'Use linkedSignal for writable local state that automatically resets when an upstream signal changes.',
      whenToUse: [
        'Selection that must reset when the list it points into is replaced (selected shipping option per product)',
        'Form-ish local edits seeded from an input() but locally editable until the input changes',
        'Pagination/index state that must snap back to 0 when the query or dataset changes',
      ],
      whenNotToUse: [
        'Purely derived values that are never written directly — plain computed() is the right tool',
        'State that must survive upstream changes — a regular signal with explicit set() preserves it',
        'Real forms with validation and dirty tracking — use Reactive Forms, not a web of linked signals',
      ],
      example: `@Component({
  selector: 'app-shipping-picker',
  standalone: true,
  template: \`
    @for (opt of options(); track opt.id) {
      <label>
        <input type="radio" name="ship"
               [checked]="selected().id === opt.id"
               (change)="selected.set(opt)" />
        {{ opt.label }} — {{ opt.price | currency }}
      </label>
    }
    <p>Chosen: {{ selected().label }}</p>
  \`,
})
export class ShippingPickerComponent {
  options = input.required<ShippingOption[]>();

  // Writable like a signal, but re-derives whenever options() changes:
  selected = linkedSignal<ShippingOption[], ShippingOption>({
    source: this.options,
    computation: (opts, previous) => {
      // Keep the user's choice if it still exists in the new list
      const kept = previous &&
        opts.find(o => o.id === previous.value.id);
      return kept ?? opts[0];
    },
  });
}
// Without linkedSignal you would need an effect() that watches
// options() and imperatively calls selected.set(...) — more code,
// and a frame where selection points at a removed option.`,
      pitfalls: [
        'The computation must handle an empty source array or it returns undefined into your template',
        'Reaching for linkedSignal when computed() suffices adds writability nobody asked for',
        'The previous parameter is the previous result wrapper ({ value, source }) — forgetting .value is a silent type bug',
      ],
    },
    {
      name: 'InjectionToken Configuration',
      category: 'DI',
      intent: 'Define typed InjectionTokens for configuration values and non-class dependencies so they are injectable, swappable, and test-friendly.',
      whenToUse: [
        'App/library configuration: API base URLs, feature flags, retry limits',
        'Injecting non-class values: window, localStorage wrappers, environment objects',
        'Publishing a reusable library that consumers must configure via provideMyLib({...})',
      ],
      whenNotToUse: [
        'Values that are services anyway — just inject the class',
        'Build-time constants that never vary per environment or test — import them',
        'One component needing one constant — a token adds indirection without benefit',
      ],
      example: `// Token with a default via factory — works without any provider:
export interface ApiConfig {
  baseUrl: string;
  retries: number;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  providedIn: 'root',
  factory: () => ({ baseUrl: '/api', retries: 1 }),
});

// Library-style provide function for overriding it:
export function provideApiConfig(config: Partial<ApiConfig>): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: API_CONFIG,
      useFactory: () => ({ baseUrl: '/api', retries: 1, ...config }),
    },
  ]);
}

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideApiConfig({ baseUrl: 'https://api.example.com', retries: 3 }),
  ],
};

// Consumption — fully typed, trivially faked in tests:
@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private config = inject(API_CONFIG);
  private http = inject(HttpClient);

  list() {
    return this.http.get<Order[]>(\`\${this.config.baseUrl}/orders\`);
  }
}`,
      pitfalls: [
        'Tokens without a factory default throw NullInjectorError the moment someone forgets the provider',
        'Object-typed tokens are matched by reference — exporting two token instances for the "same" config splits your app in two',
        'Mutating the injected config object mutates it for everyone; treat injected config as deeply read-only',
      ],
    },
    {
      name: 'Multi-Provider Plugin Pattern',
      category: 'DI',
      intent: 'Register many implementations under one token with multi: true so a consumer can discover and run all contributed plugins without knowing them.',
      whenToUse: [
        'Extensible pipelines: validators, dashboard widgets, export formats contributed by feature modules',
        'HTTP interceptors and APP_INITIALIZER-style hooks — the framework pattern, applied to your own seams',
        'Letting lazy-loaded features register capabilities the shell iterates over',
      ],
      whenNotToUse: [
        'Exactly one implementation exists and no plugin story is planned — plain provider',
        'Execution order between contributions matters strictly — multi-provider order is registration order, which is fragile',
        'Plugins that must talk to each other — that needs a coordinator, not a flat list',
      ],
      example: `export interface DashboardWidget {
  id: string;
  title: string;
  component: Type<unknown>;
}

export const DASHBOARD_WIDGET =
  new InjectionToken<DashboardWidget>('DASHBOARD_WIDGET');

// Each feature contributes independently — no central registry edit:
export const provideSalesWidget = () => ({
  provide: DASHBOARD_WIDGET,
  multi: true,
  useValue: { id: 'sales', title: 'Sales', component: SalesWidgetComponent },
});

export const provideUptimeWidget = () => ({
  provide: DASHBOARD_WIDGET,
  multi: true,
  useValue: { id: 'uptime', title: 'Uptime', component: UptimeWidgetComponent },
});

// The shell discovers whatever was registered:
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgComponentOutlet],
  template: \`
    @for (w of widgets; track w.id) {
      <section class="widget">
        <h3>{{ w.title }}</h3>
        <ng-container *ngComponentOutlet="w.component" />
      </section>
    }
  \`,
})
export class DashboardComponent {
  widgets = inject(DASHBOARD_WIDGET, { optional: true }) ?? [];
}`,
      pitfalls: [
        'One contributor forgetting multi: true replaces the whole array with a single value — a confusing runtime surprise',
        'inject(TOKEN) on a multi token returns an array; the type system says so, but optional: true returning null still needs the ?? [] guard',
        'Providers added in a lazy route create a child injector — the root shell will not see them unless it injects within that route',
      ],
    },
    {
      name: 'Feature Folders + Lazy Routes',
      category: 'Architecture',
      intent: 'Organize code by business feature, each with its own routes file lazy-loaded via loadChildren, so features stay isolated and the initial bundle stays small.',
      whenToUse: [
        'Any app with more than a couple of pages — lazy boundaries are nearly free with standalone APIs',
        'Teams owning separate features that should not import from each other’s internals',
        'Heavy areas (admin, reporting, charts) that most users never visit',
      ],
      whenNotToUse: [
        'A 3-page app where the lazy plumbing outweighs the bundle saved',
        'Splitting a tightly-coupled flow across two lazy chunks that always load together — merge them',
        'Grouping by technical type (components/, services/, pipes/) at the top level — that is the anti-pattern this replaces',
      ],
      example: `// src/app/app.routes.ts — the shell knows features only by path:
export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'orders',
    loadChildren: () =>
      import('./features/orders/orders.routes').then(m => m.ORDERS_ROUTES),
  },
  {
    path: 'admin',
    canMatch: [adminGuard],     // chunk not even fetched if guard fails
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
];

// src/app/features/orders/orders.routes.ts
export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    providers: [OrdersFacade],          // scoped to this feature
    children: [
      { path: '', component: OrderListComponent },
      {
        path: ':id',
        component: OrderDetailComponent,
        resolve: { order: orderResolver },
      },
    ],
  },
];

// Folder layout mirrors the boundary:
// features/orders/
//   orders.routes.ts        ← public entry point
//   order-list.component.ts
//   order-detail.component.ts
//   data/orders.facade.ts   ← internal; other features must not import`,
      pitfalls: [
        'Feature A importing a component from feature B’s folder silently merges their chunks — enforce boundaries with lint rules (e.g. eslint import restrictions)',
        'Shared code dumped into a giant shared/ folder becomes a new monolith — keep shared libs small and purposeful',
        'Route-level providers create per-feature instances; injecting the same service from root gives you a different object',
      ],
    },
    {
      name: 'Host Directives Composition',
      category: 'Architecture',
      intent: 'Compose reusable behaviors onto a component with hostDirectives instead of inheriting from base classes.',
      whenToUse: [
        'Cross-cutting element behaviors: tooltips, click-outside, drag handles, aria/keyboard wiring',
        'You are about to write an abstract Base*Component just to share behavior — compose instead',
        'A design system where buttons/cards mix and match behaviors per variant',
      ],
      whenNotToUse: [
        'Behavior needed by exactly one component — keep it inline',
        'Behaviors that must coordinate complex shared state — a service models that better than stacked directives',
        'When you need to attach the behavior conditionally at runtime — hostDirectives are static',
      ],
      example: `// A focused, reusable behavior as a standalone directive:
@Directive({ standalone: true, selector: '[appAutofocus]' })
export class AutofocusDirective {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  constructor() {
    afterNextRender(() => this.el.nativeElement.focus());
  }
}

@Directive({ standalone: true, selector: '[appClickOutside]' })
export class ClickOutsideDirective {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  clickedOutside = output<void>();

  @HostListener('document:click', ['$event.target'])
  onClick(target: HTMLElement) {
    if (!this.el.nativeElement.contains(target)) {
      this.clickedOutside.emit();
    }
  }
}

// Compose them onto a component — no inheritance, no wrapper elements:
@Component({
  selector: 'app-dropdown',
  standalone: true,
  hostDirectives: [
    AutofocusDirective,
    {
      directive: ClickOutsideDirective,
      outputs: ['clickedOutside: closed'],   // re-expose, renamed
    },
  ],
  template: \`<ng-content />\`,
})
export class DropdownComponent {}
// Consumers: <app-dropdown (closed)="hide()">…</app-dropdown>`,
      pitfalls: [
        'Host directive inputs/outputs are hidden unless you list them in the inputs/outputs arrays — forgetting this is the #1 confusion',
        'Each host directive instantiates per component instance; heavy directives stack up cost',
        'Host directives must be standalone; you cannot apply NgModule-declared directives this way',
      ],
    },
    {
      name: 'Declarative Templates (@if/@for)',
      category: 'Architecture',
      intent: 'Express UI as a pure function of state with built-in control flow, instead of imperatively poking at the DOM or toggling flags from subscriptions.',
      whenToUse: [
        'Always, by default — conditional regions with @if, lists with @for and a real track expression',
        'Replacing manual Renderer2 / nativeElement DOM manipulation that duplicates what bindings already do',
        'Async data: render from signals/resources rather than subscribing and copying into mutable fields',
      ],
      whenNotToUse: [
        'Genuine low-level DOM work (canvas, measuring, third-party widget mounting) — that belongs in a directive with afterNextRender',
        'Extremely large lists where even @for is too slow — reach for virtual scrolling (CDK), not manual DOM',
        'Animation timelines that the animations API or Web Animations cover better than template flags',
      ],
      example: `// Imperative style (avoid): subscribe, store, manually branch
//   this.sub = this.svc.load().subscribe(d => {
//     this.data = d; this.loading = false;
//     document.querySelector('.spinner')?.remove();  // 😱
//   });

// Declarative: the template IS the state machine
@Component({
  selector: 'app-product-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <input [value]="query()" (input)="query.set($any($event.target).value)"
           placeholder="Filter products" />

    @if (products.isLoading()) {
      <app-spinner />
    } @else if (products.error()) {
      <p class="error">Failed to load. <button (click)="products.reload()">Retry</button></p>
    } @else {
      @for (p of filtered(); track p.id) {
        <app-product-row [product]="p" />
      } @empty {
        <p>No products match “{{ query() }}”.</p>
      }
    }
  \`,
})
export class ProductListComponent {
  query = signal('');
  products = httpResource<Product[]>(() => '/api/products');

  filtered = computed(() => {
    const q = this.query().toLowerCase();
    return (this.products.value() ?? [])
      .filter(p => p.name.toLowerCase().includes(q));
  });
}`,
      pitfalls: [
        'track $index on a list that reorders or filters recycles the wrong DOM — track a stable id',
        'Calling methods that do work in templates re-runs them every change detection cycle — precompute with computed()',
        'Mixing declarative bindings with direct nativeElement writes means change detection will overwrite your DOM edits',
      ],
    },
    {
      name: 'OnPush + Signals Everywhere',
      category: 'Performance',
      intent: 'Combine ChangeDetectionStrategy.OnPush with signal-based state so Angular re-renders only the components whose signals actually changed.',
      whenToUse: [
        'Every new component — with signals there is no downside; make OnPush your schematic default',
        'Large lists and dashboards where Default change detection re-checks everything on each event',
        'Preparing for zoneless Angular — OnPush + signals is exactly the model it requires',
      ],
      whenNotToUse: [
        'Legacy components mutating plain fields from setInterval/third-party callbacks — migrate the state to signals first, or they will stop updating',
        'There is no real "do not use" for new code — the exceptions are migration sequencing, not design',
        'Code relying on markForCheck() sprinkled everywhere is fighting the model — fix the state, not the symptoms',
      ],
      example: `@Component({
  selector: 'app-live-prices',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,  // the default-to-be
  template: \`
    <h2>{{ symbol() }} <span [class.up]="delta() >= 0">{{ delta() }}%</span></h2>
    <p>Last: {{ last() | number: '1.2-2' }}</p>
    <p>Updates: {{ updates() }}</p>
  \`,
})
export class LivePricesComponent {
  symbol = input.required<string>();

  private prices = signal<number[]>([]);

  last = computed(() => this.prices().at(-1) ?? 0);
  delta = computed(() => {
    const p = this.prices();
    if (p.length < 2) return 0;
    return +(((p.at(-1)! - p[0]) / p[0]) * 100).toFixed(2);
  });
  updates = computed(() => this.prices().length);

  constructor() {
    const ws = new WebSocket('wss://example.com/prices');
    ws.onmessage = (e) => {
      // Writing a signal notifies Angular precisely — no Zone.js
      // patching, no markForCheck(), works in zoneless apps:
      this.prices.update(list => [...list.slice(-99), JSON.parse(e.data).price]);
    };
    inject(DestroyRef).onDestroy(() => ws.close());
  }
}`,
      pitfalls: [
        'Mutating an object inside a signal (sig().push(x)) changes nothing Angular can see — always set/update with new references',
        'Mixing OnPush with mutable @Input objects breaks silently; signal inputs (input()) remove the foot-gun',
        'An async callback writing plain class fields under OnPush renders stale UI — the bug appears only sometimes, which is worse',
      ],
    },
  ];

  filtered = computed(() => {
    const cat = this.activeCategory();
    return cat === 'All' ? this.patterns : this.patterns.filter(p => p.category === cat);
  });

  setCategory(cat: string): void {
    this.activeCategory.set(cat);
  }

  toggle(name: string): void {
    this.expanded.update(cur => (cur === name ? null : name));
  }

  isExpanded(name: string): boolean {
    return this.expanded() === name;
  }
}
