import { Component, signal } from '@angular/core';
import { CodeBlockComponent } from '../shared/code-block/code-block';

interface ProjectStep {
  title: string;
  description: string;
  code: string;
  language: 'typescript' | 'html' | 'scss';
}

interface MiniProject {
  id: string;
  title: string;
  description: string;
  icon: string;
  tags: string[];
  steps: ProjectStep[];
}

@Component({
  selector: 'app-mini-projects',
  standalone: true,
  imports: [CodeBlockComponent],
  templateUrl: './mini-projects.html',
  styleUrl: './mini-projects.scss',
})
export class MiniProjectsComponent {
  active = signal<string>('todo');

  projects: MiniProject[] = [
    {
      id: 'todo',
      title: 'Todo App',
      description: 'Full CRUD todo list with signals, filtering, and local storage persistence.',
      icon: '✅',
      tags: ['Signals', 'Computed', 'LocalStorage', 'Forms'],
      steps: [
        {
          title: 'State model',
          language: 'typescript',
          description: 'Define the Todo interface and reactive state using signals.',
          code: `interface Todo {
  id: number;
  text: string;
  done: boolean;
}

type Filter = 'all' | 'active' | 'done';

@Component({ ... })
export class TodoApp {
  private todos  = signal<Todo[]>(this.load());
  filter         = signal<Filter>('all');
  newText        = signal('');

  active   = computed(() => this.todos().filter(t => !t.done));
  done     = computed(() => this.todos().filter(t =>  t.done));
  filtered = computed(() => {
    const f = this.filter();
    if (f === 'active') return this.active();
    if (f === 'done')   return this.done();
    return this.todos();
  });

  constructor() {
    effect(() => localStorage.setItem('todos', JSON.stringify(this.todos())));
  }

  private load(): Todo[] {
    try { return JSON.parse(localStorage.getItem('todos') ?? '[]'); }
    catch { return []; }
  }
}`,
        },
        {
          title: 'CRUD operations',
          language: 'typescript',
          description: 'Add, toggle, and delete todos — all pure signal mutations.',
          code: `add() {
  const text = this.newText().trim();
  if (!text) return;
  this.todos.update(list => [
    ...list,
    { id: Date.now(), text, done: false },
  ]);
  this.newText.set('');
}

toggle(id: number) {
  this.todos.update(list =>
    list.map(t => t.id === id ? { ...t, done: !t.done } : t)
  );
}

delete(id: number) {
  this.todos.update(list => list.filter(t => t.id !== id));
}

clearDone() {
  this.todos.update(list => list.filter(t => !t.done));
}`,
        },
        {
          title: 'Template',
          language: 'html',
          description: 'Reactive template using @if, @for and two-way binding.',
          code: `<div class="todo-app">
  <!-- Input -->
  <form (submit)="add(); $event.preventDefault()">
    <input [(ngModel)]="newText" placeholder="Add a task…" />
    <button type="submit">Add</button>
  </form>

  <!-- Filter tabs -->
  <div class="filters">
    @for (f of ['all','active','done']; track f) {
      <button [class.active]="filter() === f"
              (click)="filter.set(f)">{{ f }}</button>
    }
  </div>

  <!-- List -->
  @for (todo of filtered(); track todo.id) {
    <div class="todo-item" [class.done]="todo.done">
      <input type="checkbox" [checked]="todo.done"
             (change)="toggle(todo.id)" />
      <span>{{ todo.text }}</span>
      <button (click)="delete(todo.id)">✕</button>
    </div>
  } @empty {
    <p class="empty">No tasks here 🎉</p>
  }

  <!-- Footer -->
  @if (done().length) {
    <button class="clear" (click)="clearDone()">
      Clear {{ done().length }} done
    </button>
  }
</div>`,
        },
      ],
    },
    {
      id: 'weather',
      title: 'Weather Dashboard',
      description: 'Fetch and display weather data using resource() API, with city search and error handling.',
      icon: '🌤',
      tags: ['resource() API', 'Signals', 'HTTP', 'Error Handling'],
      steps: [
        {
          title: 'Service with resource()',
          language: 'typescript',
          description: 'Use the new resource() API for declarative async data fetching.',
          code: `@Injectable({ providedIn: 'root' })
export class WeatherService {
  private http = inject(HttpClient);

  fetchWeather(city: string) {
    // OpenWeatherMap API (use your own key)
    const url = \`https://api.openweathermap.org/data/2.5/weather\`
              + \`?q=\${city}&units=metric&appid=YOUR_KEY\`;
    return this.http.get<WeatherResponse>(url);
  }
}

// In component — resource() wires request + loader together
@Component({ ... })
export class WeatherApp {
  city    = signal('London');
  private svc = inject(WeatherService);

  weather = resource({
    request: () => ({ city: this.city() }),
    loader:  ({ request }) => firstValueFrom(
      this.svc.fetchWeather(request.city)
    ),
  });
}`,
        },
        {
          title: 'Status-driven template',
          language: 'html',
          description: 'Render loading, error, and data states declaratively from resource status.',
          code: `<div class="weather-card">
  <!-- City search -->
  <input [value]="city()"
         (change)="city.set($any($event.target).value)"
         placeholder="Enter city…" />

  <!-- States -->
  @switch (weather.status()) {
    @case ('loading') {
      <div class="spinner">Loading…</div>
    }
    @case ('error') {
      <div class="error">
        ⚠ {{ weather.error()?.message ?? 'City not found' }}
      </div>
    }
    @case ('resolved') {
      <div class="weather-data">
        <h2>{{ weather.value()?.name }}</h2>
        <p class="temp">{{ weather.value()?.main.temp | number:'1.0-0' }}°C</p>
        <p class="desc">{{ weather.value()?.weather[0].description | titlecase }}</p>
        <p>Humidity: {{ weather.value()?.main.humidity }}%</p>
        <p>Wind: {{ weather.value()?.wind.speed }} m/s</p>
      </div>
    }
  }
</div>`,
        },
        {
          title: 'Optimistic refresh + polling',
          language: 'typescript',
          description: 'Add manual refresh and auto-poll every 60 seconds.',
          code: `export class WeatherApp {
  // ... previous signals

  // Manual refresh
  refresh() { this.weather.reload(); }

  // Auto-poll every 60s
  private destroy = inject(DestroyRef);

  constructor() {
    const interval = setInterval(() => this.weather.reload(), 60_000);
    this.destroy.onDestroy(() => clearInterval(interval));
  }
}`,
        },
      ],
    },
    {
      id: 'cart',
      title: 'Shopping Cart',
      description: 'Product listing with add-to-cart, quantity controls, and order summary using Signal Store.',
      icon: '🛒',
      tags: ['Signal Store', 'Computed', 'Animations'],
      steps: [
        {
          title: 'Cart Signal Store',
          language: 'typescript',
          description: 'Define state, computed, and actions in a single Signal Store.',
          code: `interface CartItem { id: number; name: string; price: number; qty: number; }
interface CartState { items: CartItem[]; }

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState<CartState>({ items: [] }),
  withComputed(({ items }) => ({
    count:    computed(() => items().reduce((s, i) => s + i.qty, 0)),
    subtotal: computed(() => items().reduce((s, i) => s + i.price * i.qty, 0)),
    tax:      computed(() => items().reduce((s, i) => s + i.price * i.qty, 0) * 0.1),
    total:    computed(() => items().reduce((s, i) => s + i.price * i.qty, 0) * 1.1),
  })),
  withMethods((store) => ({
    add(product: { id: number; name: string; price: number }) {
      patchState(store, state => {
        const existing = state.items.find(i => i.id === product.id);
        if (existing) {
          return { items: state.items.map(i =>
            i.id === product.id ? { ...i, qty: i.qty + 1 } : i
          )};
        }
        return { items: [...state.items, { ...product, qty: 1 }] };
      });
    },
    remove(id: number) {
      patchState(store, state => ({
        items: state.items.filter(i => i.id !== id),
      }));
    },
    updateQty(id: number, qty: number) {
      patchState(store, state => ({
        items: qty <= 0
          ? state.items.filter(i => i.id !== id)
          : state.items.map(i => i.id === id ? { ...i, qty } : i),
      }));
    },
    clear() { patchState(store, { items: [] }); },
  })),
);`,
        },
        {
          title: 'Product Grid',
          language: 'html',
          description: 'Product cards with add-to-cart buttons and in-cart quantity display.',
          code: `<div class="product-grid">
  @for (p of products; track p.id) {
    <div class="product-card">
      <img [src]="p.image" [alt]="p.name" />
      <h3>{{ p.name }}</h3>
      <p class="price">{{ p.price | currency }}</p>

      @if (inCart(p.id)) {
        <div class="qty-ctrl">
          <button (click)="cart.updateQty(p.id, qty(p.id) - 1)">−</button>
          <span>{{ qty(p.id) }}</span>
          <button (click)="cart.updateQty(p.id, qty(p.id) + 1)">+</button>
        </div>
      } @else {
        <button class="add-btn" (click)="cart.add(p)">Add to cart</button>
      }
    </div>
  }
</div>`,
        },
        {
          title: 'Order summary component',
          language: 'typescript',
          description: 'Inject the store anywhere — computed values are always in sync.',
          code: `@Component({
  selector: 'app-order-summary',
  standalone: true,
  template: \`
    <div class="summary">
      <h3>Order Summary ({{ cart.count() }} items)</h3>
      @for (item of cart.items(); track item.id) {
        <div class="row">
          <span>{{ item.name }} ×{{ item.qty }}</span>
          <span>{{ item.price * item.qty | currency }}</span>
        </div>
      }
      <hr />
      <div class="row"><span>Subtotal</span><span>{{ cart.subtotal() | currency }}</span></div>
      <div class="row"><span>Tax (10%)</span><span>{{ cart.tax() | currency }}</span></div>
      <div class="row total"><span>Total</span><span>{{ cart.total() | currency }}</span></div>
      <button (click)="cart.clear()">Clear cart</button>
    </div>
  \`,
})
export class OrderSummaryComponent {
  cart = inject(CartStore);
}`,
        },
      ],
    },
    {
      id: 'crud',
      title: 'REST CRUD Dashboard',
      description: 'Full create / read / update / delete against a REST API using HttpClient + interceptors.',
      icon: '📊',
      tags: ['HTTP', 'Interceptors', 'Reactive Forms', 'Signal Store'],
      steps: [
        {
          title: 'HTTP service',
          language: 'typescript',
          description: 'Typed HTTP service for a posts API.',
          code: `export interface Post { id: number; title: string; body: string; userId: number; }

@Injectable({ providedIn: 'root' })
export class PostsService {
  private http = inject(HttpClient);
  private base  = 'https://jsonplaceholder.typicode.com/posts';

  getAll()                    { return this.http.get<Post[]>(this.base); }
  get(id: number)             { return this.http.get<Post>(\`\${this.base}/\${id}\`); }
  create(p: Omit<Post,'id'>)  { return this.http.post<Post>(this.base, p); }
  update(id: number, p: Post) { return this.http.put<Post>(\`\${this.base}/\${id}\`, p); }
  delete(id: number)          { return this.http.delete(\`\${this.base}/\${id}\`); }
}`,
        },
        {
          title: 'Loading interceptor',
          language: 'typescript',
          description: 'Global loading spinner via a functional HTTP interceptor.',
          code: `export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  loading.start();
  return next(req).pipe(
    finalize(() => loading.stop()),
  );
};

// Register in main.ts providers:
provideHttpClient(withInterceptors([loadingInterceptor]))`,
        },
        {
          title: 'Edit dialog with Reactive Form',
          language: 'typescript',
          description: 'Modal dialog with a typed reactive form for create/edit.',
          code: `@Component({ ... })
export class PostDialogComponent {
  post = input<Post | null>(null);
  saved = output<Post>();

  fb   = inject(FormBuilder);
  svc  = inject(PostsService);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    body:  ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const p = this.post();
      if (p) this.form.patchValue({ title: p.title, body: p.body });
    });
  }

  submit() {
    if (this.form.invalid) return;
    const p = this.post();
    const obs = p
      ? this.svc.update(p.id, { ...p, ...this.form.getRawValue() })
      : this.svc.create({ ...this.form.getRawValue(), userId: 1 });
    obs.subscribe(result => this.saved.emit(result));
  }
}`,
        },
      ],
    },
  ];

  get activeProject() {
    return this.projects.find(p => p.id === this.active()) ?? this.projects[0];
  }
}
