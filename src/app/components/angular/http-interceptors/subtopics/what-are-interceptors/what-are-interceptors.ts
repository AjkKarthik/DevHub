import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-what-are-interceptors-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './what-are-interceptors.html',
  styleUrl: './what-are-interceptors.scss',
})
export class WhatAreInterceptorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Middleware for HTTP — one function, every request',
      points: [
        'An HTTP interceptor is a function that sits in the request/response pipeline and runs for EVERY <code>HttpClient</code> call in the app — the same mental model as Express middleware, applied to outgoing requests and incoming responses instead of incoming server requests.',
        'Since Angular 15, interceptors are plain functions — <code>HttpInterceptorFn</code> — that use <code>inject()</code> to reach any services they need. No <code>&#64;Injectable</code> class, no <code>implements HttpInterceptor</code> boilerplate.',
      ],
    },
    {
      heading: 'Registration order matters — requests forward, responses reverse',
      points: [
        'Interceptors run for the OUTGOING request in the order they are registered in <code>withInterceptors([...])</code>. For the INCOMING response, they run in REVERSE order. Register <code>[authInterceptor, loggingInterceptor]</code> and: auth sees the outgoing request FIRST, but loggingInterceptor sees the incoming response FIRST — think of it as request order in, response order out, like nested function calls.',
      ],
    },
    {
      heading: 'The functional signature and why cloning is mandatory',
      points: [
        'Signature: <code>(req: HttpRequest&lt;unknown&gt;, next: HttpHandlerFn) =&gt; Observable&lt;HttpEvent&lt;unknown&gt;&gt;</code>. You receive the current request and a <code>next</code> handler; call <code>next(modifiedReq)</code> to forward it down the chain.',
        '<code>HttpRequest</code> (and its <code>headers</code>) is IMMUTABLE by design — <code>req.headers.set(...)</code> returns a NEW <code>HttpHeaders</code> object without touching the original. You must always produce a modified COPY: <code>req.clone({ setHeaders: { Authorization: token } })</code>, then forward the clone, not the original.',
        'Calling <code>next(req)</code> with no modification at all is a completely valid pass-through — the normal shape for a conditional interceptor that only acts in specific cases.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { App } from './app/app';
import { loggingInterceptor } from './app/logging.interceptor';

bootstrapApplication(App, {
  providers: [provideHttpClient(withInterceptors([loggingInterceptor]))],
});
`,
    },
    {
      path: 'src/app/logging.interceptor.ts',
      content: `import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const start = Date.now();
  console.log('→', req.method, req.url);

  // Pass a CLONE if you modify, or the original req if you don't — never mutate req itself
  return next(req).pipe(
    tap({
      next: () => console.log('←', req.method, req.url, (Date.now() - start) + 'ms'),
      error: () => console.log('✗', req.method, req.url, 'failed'),
    }),
  );
};
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <button (click)="load()">Load (check the console for logging output)</button>
    <p>Loaded {{ count() }} items.</p>
  \`,
})
export class App {
  private http = inject(HttpClient);
  count = signal(0);

  load() {
    this.http.get<unknown[]>('https://jsonplaceholder.typicode.com/posts?_limit=3')
      .subscribe(items => this.count.set(items.length));
  }
}
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>What are interceptors</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a second interceptor, addHeaderInterceptor, that clones every outgoing request to add a custom header X-App-Version: "1.0" — register it BEFORE loggingInterceptor so the logged request already shows the header was attempted (note: console.log of req.headers won\'t show the clone\'s new header on the ORIGINAL req reference, only on the clone actually sent).',
    hint: 'export const addHeaderInterceptor: HttpInterceptorFn = (req, next) => next(req.clone({ setHeaders: { \'X-App-Version\': \'1.0\' } })); — then add it to the withInterceptors array before loggingInterceptor: withInterceptors([addHeaderInterceptor, loggingInterceptor]).',
    solution: `export const addHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const cloned = req.clone({ setHeaders: { 'X-App-Version': '1.0' } });
  return next(cloned);
};

// main.ts:
provideHttpClient(withInterceptors([addHeaderInterceptor, loggingInterceptor]))`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'you can modify req.headers directly inside an interceptor, the same way you\'d mutate a plain object.',
      reality: 'HttpRequest and HttpHeaders are IMMUTABLE — req.headers.set(...) returns a brand new HttpHeaders object and does not touch the original. You must call req.clone({...}) to produce a new request and forward THAT, not the original.',
    },
    {
      thought: 'interceptors registered in withInterceptors([a, b]) run in the same order for both the request AND the response.',
      reality: 'the REQUEST pipeline runs in the registered order (a then b); the RESPONSE pipeline runs in REVERSE order (b then a) — like nested function calls, the last one registered is the innermost, closest to the actual network call.',
    },
    {
      thought: 'interceptors require a class implementing HttpInterceptor, same as older Angular versions.',
      reality: 'since Angular 15, interceptors are plain FUNCTIONS (HttpInterceptorFn) registered via withInterceptors([...]) — no class, no &#64;Injectable, no implements HttpInterceptor. inject() reaches any services needed directly inside the function body.',
    },
  ];
}
