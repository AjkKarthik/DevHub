import { Component, signal, computed } from '@angular/core';
import { CodeBlockComponent } from '../../shared/code-block/code-block';

type Section = 'signals' | 'router' | 'forms' | 'http' | 'di' | 'template' | 'pipes' | 'rxjs' | 'cli' | 'testing';

interface Entry { name: string; desc: string; tag?: string; }

@Component({
  selector: 'app-cheatsheet',
  standalone: true,
  imports: [CodeBlockComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class CheatsheetComponent {
  active = signal<Section>('signals');
  searchTerm = signal('');

  sections: { key: Section; label: string; icon: string }[] = [
    { key: 'signals',  label: 'Signals',         icon: '⚡' },
    { key: 'router',   label: 'Router',           icon: '🔀' },
    { key: 'forms',    label: 'Forms',            icon: '📝' },
    { key: 'http',     label: 'HTTP',             icon: '🌐' },
    { key: 'di',       label: 'DI & Providers',   icon: '💉' },
    { key: 'template', label: 'Template Syntax',  icon: '🎯' },
    { key: 'pipes',    label: 'Pipes',            icon: '🧩' },
    { key: 'rxjs',     label: 'RxJS',             icon: '🌊' },
    { key: 'cli',      label: 'CLI',              icon: '💻' },
    { key: 'testing',  label: 'Testing',          icon: '🧪' },
  ];

  // ── Entry grids ─────────────────────────────────────────────────────────────

  signalsEntries: Entry[] = [
    { name: 'signal(v)',              desc: 'Create a writable signal with initial value',        tag: 'v16' },
    { name: 'computed(() => ...)',    desc: 'Derived read-only signal, re-computes reactively',   tag: 'v16' },
    { name: 'effect(() => ...)',      desc: 'Side-effect that runs when dependencies change',     tag: 'v16' },
    { name: 'input()',                desc: 'Signal-based @Input() — optional',                   tag: 'v17' },
    { name: 'input.required()',       desc: 'Required signal input, throws if omitted',           tag: 'v17' },
    { name: 'output()',               desc: 'Replaces @Output()/EventEmitter',                    tag: 'v17' },
    { name: 'model()',                desc: 'Two-way bindable signal  [(model)]',                 tag: 'v17' },
    { name: 'viewChild()',            desc: 'Signal-based @ViewChild query',                      tag: 'v17' },
    { name: 'viewChildren()',         desc: 'Signal-based @ViewChildren → signal<T[]>',           tag: 'v17' },
    { name: 'linkedSignal()',         desc: 'Writable derived signal, resets on source change',   tag: 'v19' },
    { name: 'toSignal(obs$)',         desc: 'Wrap Observable in signal (auto-unsubscribes)',      tag: 'v16' },
    { name: 'toObservable(sig)',      desc: 'Convert signal back to Observable',                  tag: 'v16' },
    { name: 'resource()',             desc: 'Async data-fetch signal with loading/error state',   tag: 'v19' },
    { name: '.set(v)',                desc: 'Set signal to a new value',                          tag: 'v16' },
    { name: '.update(fn)',            desc: 'Update signal based on current value',               tag: 'v16' },
  ];

  routerEntries: Entry[] = [
    { name: 'routerLink',                  desc: 'Declarative navigation directive' },
    { name: 'routerLinkActive',            desc: 'Add CSS class when route is active' },
    { name: 'router.navigate()',           desc: 'Programmatic navigation by path array' },
    { name: 'router.navigateByUrl()',      desc: 'Navigate using a full URL string' },
    { name: 'inject(ActivatedRoute)',      desc: 'Access current route params, query params, data' },
    { name: 'inject(Router)',              desc: 'Get Router instance for navigation & events' },
    { name: 'canActivate',                desc: 'Guard — runs before route activates' },
    { name: 'canDeactivate',              desc: 'Guard — runs before leaving a route' },
    { name: 'resolve / ResolveFn',        desc: 'Pre-fetch data before component activates' },
    { name: 'loadComponent',              desc: 'Lazy-load a standalone component' },
    { name: 'loadChildren',               desc: 'Lazy-load a routes array' },
    { name: 'withPreloading()',           desc: 'Configure route preloading strategy',            tag: 'v17' },
    { name: 'withViewTransitions()',      desc: 'Animate route changes with View Transitions',    tag: 'v17' },
    { name: 'withComponentInputBinding()', desc: 'Map route params to component @Input() signals', tag: 'v16' },
  ];

  formsEntries: Entry[] = [
    { name: 'FormControl',              desc: 'Represents a single form field' },
    { name: 'FormGroup',                desc: 'Group of named FormControls' },
    { name: 'FormArray',                desc: 'Dynamic list of FormControls/Groups' },
    { name: 'FormBuilder',              desc: 'Helper service — less boilerplate' },
    { name: 'Validators.required',      desc: 'Field must have a non-empty value' },
    { name: 'Validators.email',         desc: 'Must be a valid email format' },
    { name: 'Validators.minLength(n)',  desc: 'String must be at least N chars' },
    { name: 'Validators.pattern(rx)',   desc: 'Value must match the regex' },
    { name: 'Validators.min(n)',        desc: 'Numeric minimum value' },
    { name: '.valueChanges',            desc: 'Observable of control value changes' },
    { name: '.statusChanges',           desc: 'Observable of VALID / INVALID status' },
    { name: '.patchValue({})',          desc: 'Partial update — only listed keys change' },
    { name: '.reset()',                 desc: 'Reset value and mark as pristine' },
    { name: '.disable()',               desc: 'Disable a control (excluded from value)' },
    { name: 'ControlValueAccessor',     desc: 'Interface for custom form-control components' },
    { name: 'AsyncValidator',           desc: 'Validator that returns Promise or Observable' },
  ];

  httpEntries: Entry[] = [
    { name: 'provideHttpClient()',      desc: 'Register HttpClient in app.config.ts',             tag: 'v15' },
    { name: 'withInterceptors([])',     desc: 'Functional interceptors array',                     tag: 'v15' },
    { name: 'withFetch()',              desc: 'Use Fetch API instead of XHR',                      tag: 'v18' },
    { name: 'inject(HttpClient)',       desc: 'Inject HttpClient into service / component' },
    { name: 'http.get<T>(url)',         desc: 'GET request returning Observable<T>' },
    { name: 'http.post<T>(url, body)',  desc: 'POST request with body' },
    { name: 'http.put<T>(url, body)',   desc: 'PUT (full replace)' },
    { name: 'http.patch<T>(url, body)', desc: 'PATCH (partial update)' },
    { name: 'http.delete<T>(url)',      desc: 'DELETE request' },
    { name: 'HttpInterceptorFn',        desc: 'Functional interceptor signature (req, next) => ...', tag: 'v15' },
    { name: 'HttpErrorResponse',        desc: 'Error type with status code and body' },
    { name: 'catchError()',             desc: 'Handle HTTP errors, return fallback Observable' },
    { name: 'toSignal(obs$)',           desc: 'Auto-subscribe HTTP call, expose as signal' },
  ];

  diEntries: Entry[] = [
    { name: '@Injectable({providedIn:\'root\'})', desc: 'Singleton service, available app-wide' },
    { name: 'inject(Token)',             desc: 'Function-based injection (preferred over constructor)' },
    { name: 'InjectionToken<T>',         desc: 'Typed token for non-class dependencies' },
    { name: 'useClass',                  desc: 'Substitute one class for another' },
    { name: 'useValue',                  desc: 'Provide a static / literal value' },
    { name: 'useFactory',                desc: 'Provide via factory function with deps' },
    { name: 'useExisting',               desc: 'Alias one token to another' },
    { name: '@Component({ providers })', desc: 'Component-scoped providers (new instance)' },
    { name: 'DestroyRef',                desc: 'Register cleanup without ngOnDestroy',   tag: 'v16' },
    { name: 'PLATFORM_ID',               desc: 'Token to differentiate browser vs server' },
    { name: 'isPlatformBrowser(id)',      desc: 'Returns true in browser environment' },
    { name: 'EnvironmentInjector',        desc: 'Run injections outside component tree',  tag: 'v14' },
    { name: 'runInInjectionContext()',     desc: 'Execute code inside an injection context', tag: 'v16' },
  ];

  templateEntries: Entry[] = [
    { name: '@if / @else if / @else',         desc: 'Conditional block — replaces *ngIf',                tag: 'v17' },
    { name: '@for (x of arr; track x.id)',    desc: 'Loop with required track — replaces *ngFor',        tag: 'v17' },
    { name: '@empty',                          desc: 'Shown when @for collection is empty',               tag: 'v17' },
    { name: '@switch / @case / @default',      desc: 'Switch block — replaces ngSwitch',                  tag: 'v17' },
    { name: '@defer',                          desc: 'Lazily load a block of template',                   tag: 'v17' },
    { name: '@placeholder / @loading',         desc: 'Shown before / while @defer loads',                tag: 'v17' },
    { name: '[class.active]',                  desc: 'Toggle a single CSS class' },
    { name: '[ngClass]',                       desc: 'Apply multiple classes conditionally' },
    { name: '[style.color]',                   desc: 'Bind a single CSS property' },
    { name: '[(ngModel)]',                     desc: 'Two-way binding for template-driven forms' },
    { name: 'ng-content',                      desc: 'Content projection slot' },
    { name: 'ng-content select="..."',         desc: 'Named slot — project specific children' },
    { name: 'ng-template #ref',                desc: 'Reusable template block (not rendered)' },
    { name: '*ngTemplateOutlet',               desc: 'Render a ng-template ref' },
    { name: 'ng-container',                    desc: 'Grouping element — no DOM output' },
    { name: '#ref',                            desc: 'Template reference variable for DOM/directive' },
  ];

  pipesEntries: Entry[] = [
    { name: 'date',         desc: "Format date: {{ d | date:'dd/MM/yyyy' }}" },
    { name: 'currency',     desc: "Format currency: {{ 9.99 | currency:'USD' }}" },
    { name: 'number',       desc: "Format number: {{ 3.14 | number:'1.0-2' }}" },
    { name: 'percent',      desc: 'Format as percent: {{ 0.75 | percent }}' },
    { name: 'uppercase',    desc: 'Convert to UPPERCASE' },
    { name: 'lowercase',    desc: 'Convert to lowercase' },
    { name: 'titlecase',    desc: 'Convert To Title Case' },
    { name: 'slice',        desc: 'Slice array/string: {{ arr | slice:1:3 }}' },
    { name: 'json',         desc: 'Pretty-print JSON — useful for debugging' },
    { name: 'async',        desc: 'Unwrap Observable/Promise, auto-unsubscribes' },
    { name: 'keyvalue',     desc: 'Iterate over object properties in template' },
    { name: 'i18nPlural',   desc: 'Select plural form based on number' },
    { name: 'Custom @Pipe', desc: 'implements PipeTransform { transform(v, ...args) }' },
  ];

  rxjsEntries: Entry[] = [
    { name: 'of(...v)',               desc: 'Emit sync values then complete' },
    { name: 'from(iterable)',         desc: 'From array, Promise, or iterable' },
    { name: 'fromEvent(el, event)',   desc: 'DOM event stream as Observable' },
    { name: 'interval(ms)',           desc: 'Emit 0,1,2… every N ms' },
    { name: 'map(fn)',                desc: 'Transform each emitted value' },
    { name: 'switchMap(fn)',          desc: 'Cancel previous inner Observable on new emission' },
    { name: 'mergeMap(fn)',           desc: 'Merge all inner Observables concurrently' },
    { name: 'concatMap(fn)',          desc: 'Queue inner Observables, run one at a time' },
    { name: 'exhaustMap(fn)',         desc: 'Ignore new emissions while inner is active' },
    { name: 'filter(fn)',             desc: 'Only pass emissions matching predicate' },
    { name: 'debounceTime(ms)',       desc: 'Wait N ms after last emission before passing' },
    { name: 'distinctUntilChanged()', desc: 'Skip duplicate consecutive values' },
    { name: 'takeUntil(stop$)',       desc: 'Complete when another Observable emits' },
    { name: 'combineLatest([...])',   desc: 'Latest from each source on any emission' },
    { name: 'forkJoin([...])',        desc: 'Wait for all to complete, return last values' },
    { name: 'catchError(fn)',         desc: 'Handle error, return fallback Observable' },
    { name: 'shareReplay(1)',         desc: 'Multicast + replay last N to late subscribers' },
    { name: 'BehaviorSubject(init)',  desc: 'Subject that holds and replays current value' },
  ];

  cliEntries: Entry[] = [
    { name: 'ng new',                    desc: 'Create new Angular workspace' },
    { name: 'ng generate component',     desc: 'Generate component  (alias: ng g c)' },
    { name: 'ng generate service',       desc: 'Generate service    (alias: ng g s)' },
    { name: 'ng generate directive',     desc: 'Generate directive  (alias: ng g d)' },
    { name: 'ng generate pipe',          desc: 'Generate pipe       (alias: ng g p)' },
    { name: 'ng generate guard',         desc: 'Generate route guard (alias: ng g g)' },
    { name: 'ng generate resolver',      desc: 'Generate route resolver' },
    { name: 'ng serve',                  desc: 'Dev server at localhost:4200' },
    { name: 'ng build',                  desc: 'Production build to dist/' },
    { name: 'ng test',                   desc: 'Unit tests (Karma + Jasmine)' },
    { name: 'ng lint',                   desc: 'Run ESLint across the project' },
    { name: 'ng update',                 desc: 'Update Angular + all compatible deps' },
    { name: 'ng add @angular/ssr',       desc: 'Add Server-Side Rendering' },
    { name: 'ng add @angular/pwa',       desc: 'Add Progressive Web App support' },
    { name: 'ng cache clean',            desc: 'Clear Angular build cache' },
  ];

  testingEntries: Entry[] = [
    { name: 'TestBed.configureTestingModule()', desc: 'Configure the testing module' },
    { name: 'TestBed.createComponent(C)',        desc: 'Create component in test environment' },
    { name: 'fixture.detectChanges()',           desc: 'Trigger change detection' },
    { name: 'fixture.componentInstance',         desc: 'Access the component class instance' },
    { name: 'fixture.nativeElement',             desc: 'Raw DOM element for assertions' },
    { name: 'fixture.debugElement',              desc: 'Angular debug wrapper around DOM' },
    { name: 'expect(x).toBe(y)',                 desc: 'Strict equality (===)' },
    { name: 'expect(x).toEqual(y)',              desc: 'Deep equality (object comparison)' },
    { name: 'spyOn(obj, \'method\')',            desc: 'Spy on and optionally stub a method' },
    { name: 'jasmine.createSpy()',               desc: 'Standalone spy function' },
    { name: 'fakeAsync()',                       desc: 'Run test in fake async zone' },
    { name: 'tick(ms)',                          desc: 'Advance fake timer by N ms' },
    { name: 'flush()',                           desc: 'Flush all pending async tasks' },
    { name: 'HttpClientTestingModule',           desc: 'Module for testing HTTP calls' },
    { name: 'HttpTestingController',             desc: 'Intercept and verify HTTP requests' },
    { name: 'ComponentHarness',                  desc: 'CDK harness for stable UI testing',    tag: 'CDK' },
  ];

  // ── Search ────────────────────────────────────────────────────────────────

  private readonly allEntries: (Entry & { section: Section; sectionLabel: string })[] =
    this.buildAllEntries();

  filteredEntries = computed(() => {
    const q = this.searchTerm().toLowerCase().trim();
    if (q.length < 2) return [];
    return this.allEntries.filter(e =>
      e.name.toLowerCase().includes(q) || e.desc.toLowerCase().includes(q)
    );
  });

  private buildAllEntries() {
    const map: [Section, string, Entry[]][] = [
      ['signals',  '⚡ Signals',        this.signalsEntries],
      ['router',   '🔀 Router',          this.routerEntries],
      ['forms',    '📝 Forms',           this.formsEntries],
      ['http',     '🌐 HTTP',            this.httpEntries],
      ['di',       '💉 DI',              this.diEntries],
      ['template', '🎯 Template',        this.templateEntries],
      ['pipes',    '🧩 Pipes',           this.pipesEntries],
      ['rxjs',     '🌊 RxJS',            this.rxjsEntries],
      ['cli',      '💻 CLI',             this.cliEntries],
      ['testing',  '🧪 Testing',         this.testingEntries],
    ];
    return map.flatMap(([section, sectionLabel, entries]) =>
      entries.map(e => ({ ...e, section, sectionLabel }))
    );
  }

  jumpTo(section: Section) {
    this.active.set(section);
    this.searchTerm.set('');
  }

  // ── Code snippets ─────────────────────────────────────────────────────────

  signalsCode = `// Writable signal
const count = signal(0);
count.set(5);
count.update(v => v + 1);

// Computed (derived, read-only)
const double = computed(() => count() * 2);

// Effect (side-effect on dependency change)
effect(() => console.log('count =', count()));

// input() / input.required() — replaces @Input()
const title = input<string>('');           // optional
const label = input.required<string>();   // required

// output() — replaces @Output() / EventEmitter
const clicked = output<void>();
clicked.emit();

// model() — two-way bindable signal
// parent: <app-child [(qty)]="myQty" />
// child:  qty = model(0);  qty.update(v => v + 1);

// viewChild / viewChildren
const btn = viewChild<ElementRef>('myBtn');
const items = viewChildren(ItemComponent);

// linkedSignal — writable derived, resets on source change
const list   = signal(['a', 'b', 'c']);
const active = linkedSignal(() => list()[0]);

// resource() — async fetch signal
const user = resource({
  request: () => ({ id: userId() }),
  loader: ({ request }) => fetch(\`/api/users/\${request.id}\`).then(r => r.json()),
});
// user.value() | user.isLoading() | user.error()

// Bridge with RxJS
const data = toSignal(this.http.get<Data[]>('/api'), { initialValue: [] });
const obs$ = toObservable(count);`;

  routerCode = `// app.routes.ts
export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      { path: 'users', component: UsersComponent },
      { path: ':id',   component: UserDetailComponent },
    ],
  },
  {
    path: 'lazy',
    loadComponent: () => import('./lazy/lazy').then(m => m.LazyComponent),
  },
  {
    path: 'feature',
    loadChildren: () => import('./feature/routes').then(m => m.featureRoutes),
  },
  { path: '**', redirectTo: '' },
];

// app.config.ts — optional features
provideRouter(routes,
  withViewTransitions(),
  withPreloading(PreloadAllModules),
  withComponentInputBinding(),   // route params → @Input() signals
)

// Component — inject router & route
private router = inject(Router);
private route  = inject(ActivatedRoute);

this.router.navigate(['/user', id]);
this.router.navigate(['/items'], { queryParams: { page: 2 } });

const id    = this.route.snapshot.paramMap.get('id');
const page$ = this.route.queryParamMap.pipe(map(p => p.get('page')));

// Template
// <a routerLink="/counter">Counter</a>
// <a [routerLink]="['/user', userId]" routerLinkActive="active">Profile</a>

// Functional guard
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? true : inject(Router).createUrlTree(['/login']);
};

// Resolver
export const postResolver: ResolveFn<Post> = route =>
  inject(PostService).getById(route.paramMap.get('id')!);`;

  formsCode = `// app/shared setup
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Reactive form — FormBuilder approach
private fb = inject(FormBuilder);

form = this.fb.group({
  name:     ['', [Validators.required, Validators.minLength(2)]],
  email:    ['', [Validators.required, Validators.email]],
  age:      [null, [Validators.min(18)]],
  address: this.fb.group({
    city: ['', Validators.required],
  }),
  phones: this.fb.array([this.fb.control('')]),
});

// Getter shorthand for template
get f() { return this.form.controls; }
get phones() { return this.form.get('phones') as FormArray; }

// React to changes
this.form.get('name')!.valueChanges
  .pipe(debounceTime(300), distinctUntilChanged())
  .subscribe(v => console.log(v));

// Cross-field validator (applied to FormGroup)
function passwordsMatch(g: AbstractControl) {
  const pw  = g.get('password')?.value;
  const cfm = g.get('confirm')?.value;
  return pw === cfm ? null : { mismatch: true };
}

// Async validator
const uniqueEmail: AsyncValidatorFn = ctrl =>
  inject(UserService).emailExists(ctrl.value).pipe(
    map(taken => taken ? { emailTaken: true } : null),
    catchError(() => of(null)),
  );

// Template-driven form
// <form #f="ngForm" (ngSubmit)="save(f)">
//   <input name="title" [(ngModel)]="model.title" required #titleRef="ngModel" />
//   @if (titleRef.invalid && titleRef.touched) { <span>Required</span> }
// </form>`;

  httpCode = `// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor, loggingInterceptor]),
      withFetch(),   // use Fetch API (v18+, works in SSR too)
    ),
  ],
};

// Functional interceptor
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  return next(
    req.clone({ headers: req.headers.set('Authorization', \`Bearer \${token}\`) })
  );
};

// Service
@Injectable({ providedIn: 'root' })
export class TodoService {
  private http = inject(HttpClient);
  private base = '/api/todos';

  getAll()            { return this.http.get<Todo[]>(this.base); }
  getById(id: number) { return this.http.get<Todo>(\`\${this.base}/\${id}\`); }
  create(dto: Dto)    { return this.http.post<Todo>(this.base, dto); }
  update(id, dto)     { return this.http.patch<Todo>(\`\${this.base}/\${id}\`, dto); }
  remove(id)          { return this.http.delete<void>(\`\${this.base}/\${id}\`); }
}

// Component — toSignal for auto-subscribe
private svc = inject(TodoService);
todos = toSignal(this.svc.getAll(), { initialValue: [] });

// Error handling
todos$ = this.svc.getAll().pipe(
  catchError((err: HttpErrorResponse) => {
    console.error(err.status, err.message);
    return of([]);        // fallback value
  }),
);

// POST with loading state
posting = signal(false);
save(dto: Dto) {
  this.posting.set(true);
  this.svc.create(dto).pipe(finalize(() => this.posting.set(false)))
    .subscribe({ next: r => console.log(r), error: e => console.error(e) });
}`;

  diCode = `// Singleton service
@Injectable({ providedIn: 'root' })
export class AppService { }

// inject() — preferred over constructor injection
private svc = inject(AppService);

// InjectionToken for primitives / config
const API_URL   = new InjectionToken<string>('api.url');
const DARK_MODE = new InjectionToken<boolean>('darkMode');

// Provider options
providers: [
  { provide: API_URL,   useValue: 'https://api.example.com' },
  { provide: MyLogger,  useClass: ConsoleLogger },          // swap impl
  { provide: BaseRepo,  useExisting: UserRepo },            // alias
  {
    provide: ConfigService,
    useFactory: (url: string) => new ConfigService(url),
    deps: [API_URL],
  },
]

// Component-level provider (one instance per component)
@Component({ providers: [DataService] })

// Consume token
const apiUrl = inject(API_URL);

// DestroyRef — cleanup without ngOnDestroy
const destroyRef = inject(DestroyRef);
destroyRef.onDestroy(() => this.sub.unsubscribe());

// Equivalent with takeUntilDestroyed()
this.stream$.pipe(takeUntilDestroyed()).subscribe();

// SSR-safe browser checks
const pid = inject(PLATFORM_ID);
if (isPlatformBrowser(pid)) { window.scrollTo(0, 0); }

// Run code needing injection context
const injector = inject(EnvironmentInjector);
injector.runInContext(() => effect(() => console.log(count())));`;

  templateCode = `<!-- @if / @else if / @else (replaces *ngIf) -->
@if (user()) {
  <p>Welcome, {{ user()!.name }}</p>
} @else if (loading()) {
  <app-spinner />
} @else {
  <a routerLink="/login">Log in</a>
}

<!-- @for with required track + @empty (replaces *ngFor) -->
@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <li>No items found.</li>
}

<!-- $index, $first, $last, $even, $odd are implicit locals -->

<!-- @switch (replaces ngSwitch) -->
@switch (role()) {
  @case ('admin')  { <app-admin-panel /> }
  @case ('editor') { <app-editor-panel /> }
  @default         { <app-viewer-panel /> }
}

<!-- @defer — lazy-load heavy components -->
@defer (on viewport; prefetch on idle) {
  <app-heavy-chart />
} @placeholder (minimum 500ms) {
  <div class="skeleton h-40"></div>
} @loading {
  <app-spinner />
}

<!-- Class & style bindings -->
<div [class.active]="isActive" [class.error]="hasError">...</div>
<div [ngClass]="{ active: isActive, 'text-sm': small }">...</div>
<div [style.color]="textColor" [style.font-size.px]="size">...</div>

<!-- Two-way binding -->
<input [(ngModel)]="name" />         <!-- template-driven -->
<app-qty [(value)]="count" />        <!-- model() signal -->

<!-- ng-content — content projection -->
<!-- In parent: <app-card><h2>Title</h2></app-card> -->
<!-- In app-card: <ng-content /> -->
<!-- Named slot: <ng-content select="[slot=header]" /> -->

<!-- Template reference + ng-template -->
<input #searchBox (keyup.enter)="search(searchBox.value)" />
<ng-template #loadingTpl><app-spinner /></ng-template>
<ng-container *ngTemplateOutlet="isLoading ? loadingTpl : null" />`;

  pipesCode = `<!-- Built-in pipes — no imports needed in standalone components -->
{{ today      | date:'dd/MM/yyyy' }}
{{ today      | date:'short' }}         <!-- locale short format -->
{{ 9.99       | currency:'USD' }}
{{ 9.99       | currency:'EUR':'symbol':'1.2-2' }}
{{ 3.14159    | number:'1.0-2' }}       <!-- 3.14 -->
{{ 0.75       | percent }}              <!-- 75% -->
{{ text       | uppercase }}
{{ text       | lowercase }}
{{ text       | titlecase }}
{{ obj        | json }}                 <!-- debug pretty-print -->
{{ arr        | slice:1:4 }}
{{ obs$       | async }}                <!-- auto-subscribe + unsubscribe -->
{{ map        | keyvalue }}             <!-- iterate object keys -->
{{ n          | i18nPlural:mapping }}  <!-- '0 cats', '1 cat', '2 cats' -->
{{ name       | uppercase | slice:0:5 }} <!-- chain pipes -->

// Custom pipe
@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 50, suffix = '…'): string {
    return value.length > limit
      ? value.slice(0, limit) + suffix
      : value;
  }
}
// {{ longText | truncate:30 }}
// {{ longText | truncate:30:'...' }}

// Impure pipe — re-runs on every CD cycle (use sparingly!)
@Pipe({ name: 'myPipe', pure: false, standalone: true })`;

  rxjsCode = `// Creation operators
of(1, 2, 3)               // sync values → completes
from([1, 2, 3])           // iterable, Promise, or Observable
fromEvent(btn, 'click')   // DOM event stream
interval(1000)            // 0, 1, 2… every 1 s
timer(500, 1000)          // delay then interval
EMPTY                     // completes immediately (no values)
NEVER                     // never completes

// Transformation
map(x => x * 2)
switchMap(id => http.get('/api/' + id))   // cancel previous
mergeMap(id => http.get('/api/' + id))    // keep all, parallel
concatMap(id => http.get('/api/' + id))   // queue, one at a time
exhaustMap(ev => http.post('/save'))      // ignore while busy
scan((acc, v) => acc + v, 0)              // running accumulator

// Filtering
filter(x => x > 0)
take(5)
takeUntil(destroy$)
debounceTime(300)          // wait 300 ms after last event
distinctUntilChanged()     // skip consecutive duplicates
throttleTime(500)

// Combination
combineLatest([a$, b$])   // latest from each, on any emission
forkJoin([a$, b$])         // wait for all to complete
merge(a$, b$)              // all emissions from both
zip(a$, b$)                // pair by position

// Error handling
catchError(err => of(fallback))
retry(3)
retryWhen(errors => errors.pipe(delay(1000)))

// Utility
tap(v => console.log(v))   // side-effect, no transformation
delay(1000)
shareReplay(1)             // cache + replay to late subscribers
finalize(() => cleanup())  // always run (like finally)

// Subject types
new Subject<T>()              // no initial value, no replay
new BehaviorSubject<T>(init)  // current value + replay(1)
new ReplaySubject<T>(n)       // replay last n values
new AsyncSubject<T>()         // emit only last value on complete`;

  cliCode = `# Create project
ng new my-app --standalone --routing --style=scss

# Generate artefacts
ng g component my-component --standalone --flat
ng g directive my-directive --standalone
ng g pipe my-pipe --standalone
ng g service my-service
ng g guard my-guard --implements CanActivate
ng g resolver my-resolver
ng g class my-model --type model
ng g interceptor my-interceptor --functional

# Serve & Build
ng serve                         # dev server — localhost:4200
ng serve --port 4300 --open      # custom port + open browser
ng build                         # production build
ng build --configuration development

# Test & Lint
ng test                          # Karma + Jasmine
ng e2e                           # end-to-end
ng lint                          # ESLint

# Add features
ng add @angular/ssr              # Server-Side Rendering
ng add @angular/pwa              # Progressive Web App
ng add @angular/material         # Angular Material

# Maintenance
ng update @angular/core @angular/cli
ng update --all
ng cache clean                   # clear build cache
ng version                       # print all package versions`;

  testingCode = `// Component unit test
describe('CounterComponent', () => {
  let fixture: ComponentFixture<CounterComponent>;
  let component: CounterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent],  // standalone import
    }).compileComponents();

    fixture   = TestBed.createComponent(CounterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('increments the count', () => {
    component.increment();
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.count');
    expect(el.textContent).toContain('1');
  });
});

// Service with HTTP
describe('TodoService', () => {
  let service: TodoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(TodoService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());   // assert no outstanding requests

  it('fetches todos', () => {
    service.getAll().subscribe(todos => expect(todos.length).toBe(2));
    const req = http.expectOne('/api/todos');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1 }, { id: 2 }]);
  });
});

// fakeAsync — test timers
it('debounces search', fakeAsync(() => {
  component.searchQuery.set('ng');
  tick(300);
  fixture.detectChanges();
  expect(component.results().length).toBeGreaterThan(0);
}));

// Spy on injected service
it('calls save on submit', () => {
  const spy = spyOn(service, 'save').and.returnValue(of({ id: 99 }));
  component.submit();
  expect(spy).toHaveBeenCalledWith(component.formValue());
});

// Signal assertions
it('count starts at 0', () => {
  expect(component.count()).toBe(0);
  component.increment();
  expect(component.count()).toBe(1);
});`;
}
