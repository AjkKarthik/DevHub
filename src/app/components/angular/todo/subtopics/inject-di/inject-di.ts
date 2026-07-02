import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-inject-di-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './inject-di.html',
  styleUrl: './inject-di.scss',
})
export class InjectDiSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What inject() replaces, and why it exists',
      points: [
        'Before Angular 14, the only way to get a dependency into a class was a constructor parameter: <code>constructor(private fb: FormBuilder, private router: Router) {}</code>. That works, but it forces every dependency through one place, and it does not work at all in plain functions — like the functional route guards and interceptors Angular introduced later.',
        '<code>inject(Token)</code> is a function you call directly, wherever you need the dependency: <code>private fb = inject(FormBuilder);</code> as a field initialiser is exactly equivalent to a constructor parameter, just without the constructor boilerplate. TypeScript infers the return type from the token automatically — no manual type annotation needed.',
      ],
    },
    {
      heading: 'Where inject() actually works: the injection context',
      points: [
        'inject() only works inside an <strong>injection context</strong> — the same restriction as <code>effect()</code> and <code>toSignal()</code>. In practice that means: a field initialiser, a constructor body, or a functional guard/interceptor/resolver (Angular sets up the context for you when it calls those).',
        'Calling <code>inject(...)</code> from inside a regular method — a click handler, a method called later after the class is already constructed — throws <code>NG0203: inject() must be called from an injection context</code>. The dependency has to be resolved while Angular is actively constructing the class or running the guard/interceptor function, not afterward.',
        'For the rare case where you genuinely need DI outside a normal injection context (e.g. inside a `setTimeout` callback or a manually-created RxJS operator), <code>runInInjectionContext(injector, () => inject(Token))</code> exists — but reach for it only when there is no other option; it is not a general-purpose escape hatch.',
      ],
    },
    {
      heading: 'inject() is not a mandate — both patterns coexist',
      points: [
        'Constructor injection did not become deprecated or wrong — the two patterns compile down to the exact same dependency resolution at runtime. A large constructor with many typed parameters can still be clearer for some teams; <code>inject()</code> is an ergonomic alternative, most valuable in functional guards/interceptors/resolvers where a constructor is not even available.',
        'Angular\'s own functional APIs (<code>CanActivateFn</code>, <code>HttpInterceptorFn</code>, <code>ResolveFn</code>) are plain functions, not classes — <code>inject()</code> is the ONLY way to get a dependency inside them, since there is no constructor to attach a parameter to.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/greeting.service.ts',
      content: `import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GreetingService {
  private name = signal('World');
  readonly greeting = () => \`Hello, \${this.name()}!\`;

  setName(n: string) {
    this.name.set(n || 'World');
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { GreetingService } from './greeting.service';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h2>{{ greet.greeting() }}</h2>
    <input
      placeholder="Your name"
      (input)="greet.setName($any($event.target).value)" />
  \`,
})
export class App {
  // Field initialiser — this IS an injection context, no constructor needed
  greet = inject(GreetingService);
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
  <head><title>inject() basics</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Rewrite this constructor-based component to use inject() field initialisers instead: `constructor(private greet: GreetingService, private router: Router) {}` — assume Router is also injectable from \'@angular/router\'.',
    hint: 'Two field initialisers replace the constructor entirely: `private greet = inject(GreetingService); private router = inject(Router);` — no constructor method needed at all if there is nothing else to do in it.',
    solution: `import { inject } from '@angular/core';
import { Router } from '@angular/router';

export class MyComponent {
  private greet  = inject(GreetingService);
  private router = inject(Router);
  // constructor is gone entirely — nothing left for it to do
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'inject() only works inside a constructor, just like a constructor parameter would.',
      reality: 'inject() works in ANY injection context — field initialisers (the most common place), the constructor body, and functional guards/interceptors/resolvers. Field initialisers are actually the most idiomatic place to use it, not the constructor.',
    },
    {
      thought: 'inject() is the new mandatory way to do DI — constructor injection is deprecated.',
      reality: 'both patterns are fully supported and compile to the same runtime DI resolution. inject() is necessary for functional guards/interceptors (which have no constructor), but constructor injection remains completely valid for components and services.',
    },
    {
      thought: 'you can call inject() from any method, as long as the class itself was created via DI.',
      reality: 'inject() only works while Angular is actively setting up the injection context — field initialisers, the constructor body, or a functional guard/interceptor at the moment Angular invokes it. Calling it later, from an arbitrary method, throws NG0203.',
    },
  ];
}
