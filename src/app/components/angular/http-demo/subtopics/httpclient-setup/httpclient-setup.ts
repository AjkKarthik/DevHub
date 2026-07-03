import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-httpclient-setup-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './httpclient-setup.html',
  styleUrl: './httpclient-setup.scss',
})
export class HttpclientSetupSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'provideHttpClient() — the standalone-app replacement for HttpClientModule',
      points: [
        '<code>provideHttpClient()</code> in <code>app.config.ts</code>\'s <code>providers</code> array is what makes <code>HttpClient</code> injectable anywhere in a standalone Angular app — the old <code>HttpClientModule</code> import from NgModule-based apps is deprecated. Skip this call and injecting <code>HttpClient</code> throws <code>NullInjectorError</code> at runtime.',
        'Interceptors are added inline at the same call site: <code>provideHttpClient(withInterceptors([authFn, loggingFn]))</code> — there is no separate registration step.',
      ],
    },
    {
      heading: 'Injecting and calling HttpClient',
      points: [
        '<code>private http = inject(HttpClient);</code> — a field initialiser, same pattern as any other injectable. <code>HttpClient</code> is a singleton provided in the root injector once <code>provideHttpClient()</code> is called, so every component/service that injects it shares the same instance.',
        'EVERY <code>HttpClient</code> method (<code>get</code>, <code>post</code>, <code>put</code>, <code>delete</code>, <code>patch</code>) returns a <strong>cold Observable</strong> — nothing happens on the network until something subscribes (<code>.subscribe()</code>, the <code>async</code> pipe, or <code>toSignal()</code>). Calling <code>http.get(url)</code> and never subscribing to the result makes zero network requests; each SEPARATE subscription triggers its own separate request.',
      ],
    },
    {
      heading: 'Always pass the type parameter',
      points: [
        '<code>http.get&lt;User[]&gt;(url)</code> — without the generic, the return type is <code>Observable&lt;Object&gt;</code>, and every downstream consumer of the response loses type safety. Angular does NOT validate that the actual response shape matches the generic at runtime — this is purely a TypeScript-side annotation, so it is still your responsibility to make sure the type you declare actually matches what the API returns.',
      ],
    },
    {
      heading: 'Query strings — HttpParams, never manual string concatenation',
      points: [
        '<code>new HttpParams().set(\'page\', 1).set(\'sort\', \'asc\')</code>, passed as <code>http.get(url, { params })</code> — handles URL encoding correctly and avoids injection-style bugs that manual string concatenation (<code>url + \'?page=\' + page</code>) is prone to, especially with user-supplied values that might contain special characters.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [provideHttpClient()],
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

interface Post { id: number; title: string; }

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <button (click)="load()">Load posts (page {{ page() }})</button>
    <ul>
      @for (p of posts(); track p.id) {
        <li>{{ p.title }}</li>
      }
    </ul>
  \`,
})
export class App {
  private http = inject(HttpClient);

  posts = signal<Post[]>([]);
  page = signal(1);

  load() {
    // Typed generic + HttpParams for the query string — never string-concatenate
    const params = new HttpParams().set('_page', this.page()).set('_limit', 5);
    this.http
      .get<Post[]>('https://jsonplaceholder.typicode.com/posts', { params })
      .subscribe(posts => this.posts.set(posts));
  }
}
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>HttpClient setup</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a "Next page" button that increments the page signal and reloads. Use HttpParams for the updated page number, the same way the initial load() does.',
    hint: 'nextPage() { this.page.update(p => p + 1); this.load(); } — the existing load() method already reads this.page() to build the HttpParams, so incrementing the signal first and then calling load() again is all that\'s needed.',
    solution: `nextPage() {
  this.page.update(p => p + 1);
  this.load();
}

// Template:
// <button (click)="nextPage()">Next page</button>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'calling http.get(url) immediately sends the HTTP request, the same as fetch().',
      reality: 'http.get() returns a COLD Observable — nothing happens on the network until something subscribes to it. Calling http.get(url) with no .subscribe(), async pipe, or toSignal() makes zero network requests.',
    },
    {
      thought: 'subscribing to the same Observable returned by http.get() twice only triggers one network request.',
      reality: 'each separate subscription to a cold Observable triggers its OWN separate HTTP request — subscribing twice means two requests fire, not one shared result.',
    },
    {
      thought: 'skipping the generic type parameter on http.get() is just a minor style choice with no real consequence.',
      reality: 'without a generic, the return type is Observable&lt;Object&gt; — every piece of downstream code loses type checking on the response shape, silently reintroducing the exact class of bugs typed forms (and TypeScript generally) exist to prevent.',
    },
  ];
}
