import { Component } from '@angular/core';
import { CodeBlockComponent } from '../shared/code-block/code-block';

interface Release {
  version: string;
  date: string;
  headline: string;
  features: { title: string; description: string; code?: string }[];
}

@Component({
  selector: 'app-whats-new',
  standalone: true,
  imports: [CodeBlockComponent],
  templateUrl: './whats-new.html',
  styleUrl: './whats-new.scss',
})
export class WhatsNewComponent {
  releases: Release[] = [
    {
      version: 'v22',
      date: 'May 2025',
      headline: 'Incremental Hydration GA, Zoneless stable, resource() API GA',
      features: [
        {
          title: 'resource() API (GA)',
          description: 'Declarative async data fetching built on signals. No RxJS required.',
          code: `const user = resource({
  request: () => ({ id: this.userId() }),
  loader: ({ request }) => fetch('/api/user/' + request.id).then(r => r.json()),
});
// user.value()  → data
// user.status() → 'idle' | 'loading' | 'resolved' | 'error'`,
        },
        {
          title: 'Incremental Hydration (GA)',
          description: 'Server-rendered content is hydrated on-demand using @defer triggers.',
          code: `@defer (hydrate on interaction) {
  <app-heavy-widget />
}
@placeholder {
  <div class="skeleton"></div>
}`,
        },
        {
          title: 'Zoneless Change Detection (stable)',
          description: 'Remove zone.js entirely. Angular tracks dirty state via signals.',
          code: `// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection(),
  ],
});`,
        },
      ],
    },
    {
      version: 'v19',
      date: 'November 2024',
      headline: 'Linked signals, effect() stabilised, input/output as functions',
      features: [
        {
          title: 'linkedSignal()',
          description: 'A writable signal whose default tracks another signal — resets when the source changes.',
          code: `const options = signal(['Angular', 'React', 'Vue']);
const selected = linkedSignal(() => options()[0]);

// User picks something
selected.set('React');   // writable override

// Source changes → selected resets to new first item
options.set(['Solid', 'Svelte']);
console.log(selected()); // 'Solid'`,
        },
        {
          title: 'effect() stabilised (no more requireSync)',
          description: 'effect() no longer requires allowSignalWrites or custom schedulers for most use-cases.',
          code: `effect(() => {
  document.title = 'Count: ' + this.count();
  localStorage.setItem('count', String(this.count()));
});`,
        },
        {
          title: 'input() / output() as functions (stable)',
          description: 'Decorator-free signal inputs and outputs are now stable.',
          code: `export class RatingComponent {
  value   = input.required<number>();
  max     = input(5);
  changed = output<number>();

  select(n: number) { this.changed.emit(n); }
}`,
        },
      ],
    },
    {
      version: 'v18',
      date: 'May 2024',
      headline: 'Zoneless preview, @let declarations in templates, stable signals',
      features: [
        {
          title: '@let template declarations',
          description: 'Declare local variables inside templates without workarounds.',
          code: `@let total = items().reduce((s, i) => s + i.price, 0);
@let tax   = total * 0.1;
<p>Subtotal: {{ total | currency }}</p>
<p>Tax:      {{ tax   | currency }}</p>
<p>Grand:    {{ total + tax | currency }}</p>`,
        },
        {
          title: 'Zoneless change detection (developer preview)',
          description: 'First preview of running Angular without zone.js.',
          code: `provideExperimentalZonelessChangeDetection()`,
        },
        {
          title: 'Route redirects as functions',
          description: 'redirectTo can now be a function for dynamic redirects.',
          code: `{
  path: 'old-path',
  redirectTo: route => {
    const id = route.params['id'];
    return '/new-path/' + id;
  },
}`,
        },
      ],
    },
    {
      version: 'v17',
      date: 'November 2023',
      headline: 'New control flow syntax, @defer blocks, signals developer preview',
      features: [
        {
          title: 'Built-in control flow (@if, @for, @switch)',
          description: 'Replace *ngIf / *ngFor directives with ergonomic block syntax.',
          code: `@if (user()) {
  <p>Hello {{ user()!.name }}</p>
} @else {
  <p>Loading…</p>
}

@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <li>No items</li>
}`,
        },
        {
          title: '@defer blocks',
          description: 'Declaratively lazy-load parts of a template with built-in triggers.',
          code: `@defer (on viewport) {
  <app-chart />
} @placeholder {
  <div>Chart coming…</div>
} @loading (minimum 200ms) {
  <app-spinner />
} @error {
  <p>Failed to load chart</p>
}`,
        },
        {
          title: 'Signals (developer preview)',
          description: 'signal(), computed(), effect() introduced as reactive primitives.',
          code: `const count = signal(0);
const double = computed(() => count() * 2);
effect(() => console.log(double()));

count.set(5); // logs 10`,
        },
      ],
    },
    {
      version: 'v16',
      date: 'May 2023',
      headline: 'Required inputs, inject() improvements, DestroyRef, takeUntilDestroyed',
      features: [
        {
          title: 'Required @Input() decorator',
          description: 'Mark component inputs as required at compile time.',
          code: `@Component({ ... })
export class CardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) body!: string;
}`,
        },
        {
          title: 'DestroyRef + takeUntilDestroyed()',
          description: 'Auto-unsubscribe from RxJS observables when a component is destroyed.',
          code: `export class MyComponent {
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(n => console.log(n));
  }
}`,
        },
        {
          title: 'afterRender / afterNextRender',
          description: 'Lifecycle hooks that fire after the view is painted — safe for DOM measurements.',
          code: `export class MyChart {
  private canvasRef = viewChild<ElementRef>('canvas');

  constructor() {
    afterNextRender(() => {
      // DOM is painted — safe to measure
      const w = this.canvasRef()!.nativeElement.offsetWidth;
    });
  }
}`,
        },
      ],
    },
    {
      version: 'v15',
      date: 'November 2022',
      headline: 'Standalone components stable, directive composition API',
      features: [
        {
          title: 'Standalone components (stable)',
          description: 'Components, directives, and pipes no longer need NgModule.',
          code: `@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: \`<router-outlet />\`,
})
export class AppComponent {}

// main.ts
bootstrapApplication(AppComponent, { providers: [...] });`,
        },
        {
          title: 'Directive composition API',
          description: 'Mix in directive behaviour directly on a component via hostDirectives.',
          code: `@Component({
  selector: 'app-btn',
  hostDirectives: [
    { directive: CdkButton },
    { directive: TooltipDirective, inputs: ['tooltip: title'] },
  ],
  template: \`<ng-content />\`,
})
export class ButtonComponent {}`,
        },
      ],
    },
    {
      version: 'v14',
      date: 'June 2022',
      headline: 'Standalone preview, typed Reactive Forms, inject() function',
      features: [
        {
          title: 'Typed Reactive Forms',
          description: 'FormControl, FormGroup, FormArray are now generic and fully typed.',
          code: `interface ProfileForm {
  name: FormControl<string>;
  age:  FormControl<number | null>;
}

const form = fb.group<ProfileForm>({
  name: fb.nonNullable.control(''),
  age:  fb.control(null),
});

// TypeScript knows form.value.name is string
const name: string = form.getRawValue().name;`,
        },
        {
          title: 'inject() function',
          description: 'Inject services anywhere in the injection context without constructor injection.',
          code: `// Field injection (modern pattern)
export class MyComponent {
  private router = inject(Router);
  private store  = inject(Store);
}

// Functional guards
export const authGuard: CanActivateFn = () => {
  return inject(AuthService).isLoggedIn();
};`,
        },
      ],
    },
  ];
}
