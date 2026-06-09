import { Component, signal } from '@angular/core';
import { CodeBlockComponent } from '../../shared/code-block/code-block';

interface ErrorEntry {
  code: string;
  title: string;
  cause: string;
  fix: string;
  example: string;
  solution: string;
  tag: 'runtime' | 'di' | 'template' | 'forms' | 'build';
}

@Component({
  selector: 'app-errors-page',
  standalone: true,
  imports: [CodeBlockComponent],
  templateUrl: './errors-page.html',
  styleUrl: './errors-page.scss',
})
export class ErrorsPageComponent {
  activeTag = signal<string>('all');

  tags = ['all', 'runtime', 'di', 'template', 'forms', 'build'];

  errors: ErrorEntry[] = [
    {
      code: 'NG0100',
      title: 'ExpressionChangedAfterItHasBeenCheckedError',
      cause: 'A template expression changes a value during or after change detection.',
      fix: 'Use OnPush + signals, async pipe, or move side-effects out of templates.',
      tag: 'runtime',
      example: `// Bad — setter triggers another CD cycle
get label() {
  this.count++;         // side-effect in getter!
  return 'Item ' + this.count;
}`,
      solution: `// Good — use computed signal
readonly count = signal(0);
readonly label = computed(() => 'Item ' + this.count());`,
    },
    {
      code: 'NG0200',
      title: 'CircularDependencyInDI',
      cause: 'Service A depends on Service B which depends back on Service A.',
      fix: 'Introduce a third mediator service, or use a forwardRef.',
      tag: 'di',
      example: `@Injectable({ providedIn: 'root' })
class ServiceA { constructor(private b: ServiceB) {} }

@Injectable({ providedIn: 'root' })
class ServiceB { constructor(private a: ServiceA) {} }  // circular!`,
      solution: `// Option 1: Mediator
@Injectable({ providedIn: 'root' })
class SharedState { value = signal(0); }

// Option 2: forwardRef
class ServiceA {
  constructor(@Inject(forwardRef(() => ServiceB)) private b: ServiceB) {}
}`,
    },
    {
      code: 'NG0201',
      title: 'NullInjectorError — No provider for X',
      cause: 'The injected token has no matching provider in the current injector tree.',
      fix: 'Add providedIn: \'root\', or add to the component/module providers array.',
      tag: 'di',
      example: `@Injectable()   // <-- missing providedIn!
export class UserService { ... }

// Component tries to inject it → NullInjectorError`,
      solution: `// Fix 1: global
@Injectable({ providedIn: 'root' })
export class UserService { ... }

// Fix 2: component-scoped
@Component({ providers: [UserService] })
export class MyComponent { svc = inject(UserService); }`,
    },
    {
      code: 'NG0203',
      title: 'inject() called outside injection context',
      cause: 'inject() was called in a setTimeout, Promise callback, or outside a constructor.',
      fix: 'Call inject() at the class field level or in the constructor, never inside async callbacks.',
      tag: 'di',
      example: `export class MyComponent {
  ngOnInit() {
    setTimeout(() => {
      const svc = inject(UserService); // NG0203!
    }, 100);
  }
}`,
      solution: `export class MyComponent {
  // Inject at declaration time — always safe
  private svc = inject(UserService);

  ngOnInit() {
    setTimeout(() => {
      this.svc.doSomething(); // use the already-injected ref
    }, 100);
  }
}`,
    },
    {
      code: 'NG0300',
      title: 'Multiple components match the selector',
      cause: 'Two components share the same CSS selector string.',
      fix: 'Use unique, prefixed selectors for every component.',
      tag: 'template',
      example: `// lib-a: @Component({ selector: 'app-button' })
// lib-b: @Component({ selector: 'app-button' })
// Angular can't decide which one to use → NG0300`,
      solution: `// Use a unique prefix per library/feature
@Component({ selector: 'acme-button' })
@Component({ selector: 'dashboard-button' })`,
    },
    {
      code: 'NG0301',
      title: 'Export not found in NgModule',
      cause: 'A component used in a template is not imported (standalone) or exported (module).',
      fix: 'Add the component to the imports array of the standalone component, or the NgModule.',
      tag: 'template',
      example: `// app.component.html
<app-counter />   // NG0301 — CounterComponent not imported!`,
      solution: `// standalone component
@Component({
  imports: [CounterComponent],  // ← add here
  ...
})
export class AppComponent { }`,
    },
    {
      code: 'NG0400',
      title: 'ViewDestroyedError',
      cause: 'Trying to update a signal/reference on a destroyed component (e.g. in a stale subscription).',
      fix: 'Use takeUntilDestroyed() or DestroyRef to clean up subscriptions.',
      tag: 'runtime',
      example: `ngOnInit() {
  interval(1000).subscribe(n => {
    this.count.set(n); // continues after component destroyed!
  });
}`,
      solution: `private destroyRef = inject(DestroyRef);

ngOnInit() {
  interval(1000)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(n => this.count.set(n));
}`,
    },
    {
      code: 'NG05104',
      title: 'Required input not provided',
      cause: 'A required input() was not passed from the parent template.',
      fix: 'Pass the required input in the parent template, or make it optional with a default.',
      tag: 'template',
      example: `// Child:
title = input.required<string>();

// Parent template:
<app-card />   // Error — title not provided!`,
      solution: `// Pass the input
<app-card title="Hello" />

// Or make it optional
title = input('Default Title');`,
    },
    {
      code: 'NG0501',
      title: 'Hydration mismatch (SSR)',
      cause: 'Server-rendered DOM doesn\'t match what the client would render.',
      fix: 'Avoid accessing browser-only APIs (window, document) without isPlatformBrowser guard.',
      tag: 'runtime',
      example: `// Accessing window on the server causes empty output
ngOnInit() {
  this.width = window.innerWidth; // ReferenceError on server
}`,
      solution: `private platform = inject(PLATFORM_ID);

ngOnInit() {
  if (isPlatformBrowser(this.platform)) {
    this.width = window.innerWidth;
  }
}`,
    },
    {
      code: 'FormGroup',
      title: 'Cannot read property \'value\' of undefined (FormControl)',
      cause: 'Accessing a control that doesn\'t exist in the FormGroup.',
      fix: 'Verify control names match exactly — typos cause undefined.',
      tag: 'forms',
      example: `this.form = fb.group({ email: [''] });
// Template uses: formControlName="emial"  // typo!
// Error: Cannot find control with name 'emial'`,
      solution: `// Match names exactly
this.form = fb.group({ email: [''] });
// Template: formControlName="email"

// Or use typed forms
interface LoginForm { email: FormControl<string>; }
this.form = fb.group<LoginForm>({ email: fb.nonNullable.control('') });`,
    },
    {
      code: 'BUILD',
      title: 'TS2345 — Argument of type X is not assignable to Y',
      cause: 'TypeScript strict mode rejects a type mismatch.',
      fix: 'Add proper generics, use type assertions carefully, or fix the actual type.',
      tag: 'build',
      example: `// signal<string | null> passed where string expected
const name = signal<string | null>(null);
const upper = computed(() => name().toUpperCase()); // TS2339!`,
      solution: `const upper = computed(() => name()?.toUpperCase() ?? '');
// or narrow the type
const upper = computed(() => {
  const n = name();
  return n ? n.toUpperCase() : '';
});`,
    },
    {
      code: 'BUILD',
      title: 'Standalone component must import its dependencies',
      cause: 'CommonModule / directives missing from the imports array.',
      fix: 'Import each directive/pipe/component used in the template.',
      tag: 'build',
      example: `@Component({
  standalone: true,
  // imports: [] — NgIf/NgFor not available!
  template: \`<div *ngIf="show">...</div>\`
})`,
      solution: `@Component({
  standalone: true,
  imports: [NgIf, NgFor, AsyncPipe],   // explicit imports
  // Or use modern @if / @for blocks — no imports needed
  template: \`@if (show) { <div>...</div> }\`
})`,
    },
  ];

  get filtered() {
    const t = this.activeTag();
    return t === 'all' ? this.errors : this.errors.filter(e => e.tag === t);
  }

  tagLabel(t: string) {
    const map: Record<string, string> = {
      all: 'All', runtime: 'Runtime', di: 'DI', template: 'Template', forms: 'Forms', build: 'Build',
    };
    return map[t] ?? t;
  }
}
