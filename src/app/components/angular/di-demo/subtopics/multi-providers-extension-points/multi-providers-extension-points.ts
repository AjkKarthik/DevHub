import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-multi-providers-extension-points-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './multi-providers-extension-points.html',
  styleUrl: './multi-providers-extension-points.scss',
})
export class MultiProvidersExtensionPointsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'multi: true — collecting many values under one token',
      points: [
        '<code>{ provide: TOKEN, useValue: a, multi: true }</code> registered alongside <code>{ provide: TOKEN, useValue: b, multi: true }</code> does NOT overwrite — every <code>multi: true</code> provider for the SAME token contributes an entry, and <code>inject(TOKEN)</code> returns the full array <code>[a, b]</code> instead of a single value.',
        'Angular\'s own <code>HTTP_INTERCEPTORS</code> is built exactly this way — each feature registers its own interceptor with <code>multi: true</code>, and the HTTP client internally injects the whole array and runs them in order. This is the same mechanism you can reuse for your own extension points.',
        'Order is generally registration order — the order providers are listed across the effective providers array (root/environment/component, merged in that resolution sequence). Do not rely on a specific cross-module order unless you control the entire providers list yourself.',
      ],
    },
    {
      heading: 'Building your own extension-point token',
      points: [
        'Declare a token that expects an array: <code>export const APP_WIDGETS = new InjectionToken&lt;Widget[]&gt;(\'app.widgets\')</code>. Each feature registers its own widget: <code>{ provide: APP_WIDGETS, useValue: myWidget, multi: true }</code> in that feature\'s own providers.',
        'A consumer — a dashboard shell component, for example — injects the token once: <code>widgets = inject(APP_WIDGETS)</code>, and renders every registered entry with <code>&#64;for</code>. New features can add themselves to the dashboard purely by registering a provider, without the shell needing to know about them ahead of time.',
        'This is the standard Angular pattern for building plugin-style extension points — validators, interceptors, error handlers, and third-party integrations can all self-register this way instead of the consumer maintaining a hardcoded list.',
      ],
    },
    {
      heading: 'The empty-registrations gotcha — always give multi tokens a default',
      points: [
        'If NO provider registers for a multi token and it has no default factory, <code>inject(TOKEN)</code> throws <code>NullInjectorError</code> — NOT an empty array as you might expect. Multi tokens do not implicitly default to <code>[]</code>.',
        'Fix it by giving the token a root factory that returns an empty array: <code>new InjectionToken&lt;Widget[]&gt;(\'app.widgets\', { providedIn: \'root\', factory: () => [] })</code>. Now the token safely resolves to <code>[]</code> when zero features have registered, and still accumulates correctly when they do.',
      ],
    },
    {
      heading: 'APP_INITIALIZER-style startup hooks',
      points: [
        '<code>provideAppInitializer(() => { ... })</code> (Angular 19+, replacing the older <code>{ provide: APP_INITIALIZER, useFactory: ..., multi: true }</code> pattern) registers a function that runs before the app finishes bootstrapping — commonly used to load remote config or feature flags before the first render.',
        '<code>provideAppInitializer()</code> callbacks run inside a valid injection context, so <code>inject()</code> works directly at the top of the callback — no <code>useFactory</code> + <code>deps</code> array boilerplate needed, unlike the legacy <code>APP_INITIALIZER</code> token.',
        'Multiple calls to <code>provideAppInitializer()</code> are themselves collected via the same underlying multi-provider mechanism — bootstrap waits for ALL registered initializers (if they return a Promise/Observable) before rendering the app.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject, InjectionToken } from '@angular/core';

interface Widget { name: string; render: () => string; }

// Extension-point token — always give it an empty-array default
const APP_WIDGETS = new InjectionToken<Widget[]>('app.widgets', {
  providedIn: 'root',
  factory: () => [],
});

const clockWidget: Widget = { name: 'Clock', render: () => 'It is currently... some time.' };
const weatherWidget: Widget = { name: 'Weather', render: () => 'Sunny with a chance of demos.' };

@Component({
  selector: 'app-root',
  standalone: true,
  // Two features "self-register" onto the same multi-provider token
  providers: [
    { provide: APP_WIDGETS, useValue: clockWidget, multi: true },
    { provide: APP_WIDGETS, useValue: weatherWidget, multi: true },
  ],
  template: \`
    <h3>Dashboard shell — injects the token ONCE, knows nothing about the widgets ahead of time</h3>
    @for (w of widgets; track w.name) {
      <div style="padding: 0.5rem; border: 1px solid #ccc; margin-bottom: 0.5rem;">
        <strong>{{ w.name }}</strong>: {{ w.render() }}
      </div>
    }
    <p>Registered widget count: {{ widgets.length }}</p>
  \`,
})
export class App {
  // inject(APP_WIDGETS) returns the FULL array — both widgets, in registration order
  widgets = inject(APP_WIDGETS);
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
  <head><title>Multi-providers and extension points</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third widget (e.g. a "News" widget) by adding one more { provide: APP_WIDGETS, useValue: ..., multi: true } entry to the providers array — do not touch the template.',
    hint: 'Add a newsWidget: Widget object above the @Component decorator, then add { provide: APP_WIDGETS, useValue: newsWidget, multi: true } as a third entry in the providers array — the shell template already loops over whatever is registered.',
    solution: `const newsWidget: Widget = { name: 'News', render: () => 'Breaking: multi-providers just got clearer.' };

providers: [
  { provide: APP_WIDGETS, useValue: clockWidget, multi: true },
  { provide: APP_WIDGETS, useValue: weatherWidget, multi: true },
  { provide: APP_WIDGETS, useValue: newsWidget, multi: true },
],`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a multi: true token automatically resolves to an empty array when nothing has registered for it.',
      reality: 'without an explicit default factory (e.g. { providedIn: \'root\', factory: () => [] }), inject() throws NullInjectorError when zero providers have registered — multi tokens do not implicitly default to [].',
    },
    {
      thought: 'the second { provide: TOKEN, useValue: b, multi: true } for the same token overwrites the first registration.',
      reality: 'multi: true providers for the same token ACCUMULATE into an array rather than overwriting each other — inject(TOKEN) returns every registered value, not just the last one.',
    },
    {
      thought: 'APP_INITIALIZER / provideAppInitializer() is just a lifecycle hook that runs after the app has already rendered.',
      reality: 'it runs BEFORE bootstrap completes — if the initializer returns a Promise or Observable, Angular waits for it to resolve before the first render, making it the right place to load config that the initial UI depends on.',
    },
  ];
}
