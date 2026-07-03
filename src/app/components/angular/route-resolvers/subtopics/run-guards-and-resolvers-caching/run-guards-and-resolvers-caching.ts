import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-run-guards-and-resolvers-caching-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './run-guards-and-resolvers-caching.html',
  styleUrl: './run-guards-and-resolvers-caching.scss',
})
export class RunGuardsAndResolversCachingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'runGuardsAndResolvers — controlling WHEN a resolver re-runs',
      points: [
        'By DEFAULT, a resolver only re-runs when navigating to a DIFFERENT route config — navigating from <code>/posts/1</code> to <code>/posts/2</code> (the SAME route config, different param) does NOT automatically re-run the resolver unless you configure <code>runGuardsAndResolvers</code> on the route.',
        '<code>runGuardsAndResolvers: \'paramsChange\'</code> re-runs guards/resolvers when route PARAMS change (covers the <code>/posts/1</code> → <code>/posts/2</code> case). <code>\'pathParamsChange\'</code> is similar but ignores query param changes specifically. <code>\'always\'</code> re-runs on every navigation to the route, even if params are identical — useful for data that can go stale between visits regardless of params.',
        'The DEFAULT (omitting the option) is effectively <code>\'always\'</code> for a genuinely NEW navigation to the route, but resolvers do NOT re-run for param-only changes within the SAME already-activated route instance — this default behavior is a common source of "why isn\'t my resolver refetching" confusion.',
      ],
    },
    {
      heading: 'A cache layer to avoid redundant resolver fetches',
      points: [
        'A resolver by itself has NO caching — <code>runGuardsAndResolvers: \'always\'</code> combined with a resolver that always hits the network means navigating back to a PREVIOUSLY-visited route re-fetches from scratch every time, even if the data hasn\'t changed.',
        'The standard fix: back the resolver with a service using <code>shareReplay({ bufferSize: 1, refCount: true })</code> (from the RxJS multicasting subtopic) keyed by the route param — <code>getById(id): Observable&lt;Post&gt; { return this.cache.has(id) ? this.cache.get(id)! : this.cache.set(id, this.http.get(...).pipe(shareReplay(1))).get(id)!; }</code> — the resolver still runs on every navigation, but the underlying HTTP call is only made ONCE per unique id.',
      ],
    },
    {
      heading: 'Combining with resource()/httpResource() instead of a resolver',
      points: [
        'An alternative to blocking navigation with a resolver: skip the resolver entirely and use <code>httpResource()</code> INSIDE the component with <code>params: () =&gt; this.route.snapshot.paramMap.get(\'id\')</code> — the component activates immediately (no navigation blocking), shows a loading skeleton, and the resource\'s OWN caching-adjacent behavior (each unique param triggers a fresh fetch, but rapid param changes cancel stale in-flight requests) handles the data fetching.',
        'Choose a RESOLVER when you specifically want navigation to WAIT for data (the component should never render without it) — choose <code>httpResource()</code> in-component when a brief loading state is acceptable and you want the URL to change immediately for a snappier perceived navigation.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/post.service.ts',
      content: `import { Injectable } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

interface Post { id: string; title: string; }

let fetchCount = 0;

@Injectable({ providedIn: 'root' })
export class PostService {
  private cache = new Map<string, Observable<Post>>();

  getById(id: string): Observable<Post> {
    if (!this.cache.has(id)) {
      const request$ = of({ id, title: 'Post ' + id }).pipe(
        delay(400),
        tap(() => { fetchCount++; console.log('Fetched from "server":', id, '— total fetches:', fetchCount); }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
      this.cache.set(id, request$);
    }
    return this.cache.get(id)!;
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal, inject } from '@angular/core';
import { PostService } from './post.service';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Cached resolver-style fetch — revisit "1" and "2" and check the console</h3>
    <button (click)="load('1')">Load Post 1</button>
    <button (click)="load('2')">Load Post 2</button>
    <p>{{ currentTitle() }}</p>
    <p>Check the console: revisiting the SAME id only fetches once, thanks to shareReplay caching.</p>
  \`,
})
export class App {
  private postService = inject(PostService);
  currentTitle = signal('(none loaded yet)');

  load(id: string) {
    // Simulates what a resolver does: fetch by id, block until it resolves
    this.postService.getById(id).subscribe(post => this.currentTitle.set(post.title));
  }
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
  <head><title>runGuardsAndResolvers and resolver caching</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Load Post 1" three times in a row, then check the console — confirm "Fetched from server: 1" only appears ONCE despite three calls, proving the shareReplay cache is working.',
    hint: 'Because getById() checks this.cache.has(id) before creating a new request$, and shareReplay({ bufferSize: 1, refCount: true }) caches the single emission, subsequent calls with the same id return the cached Observable without triggering a new "fetch" log.',
    solution: `// No code change needed — this confirms the existing cache Map +
// shareReplay combination correctly deduplicates repeated fetches
// for the same id, regardless of how many times load() is called.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a resolver automatically re-runs whenever route params change, without any extra configuration.',
      reality: 'by default, navigating between params on the SAME route config (e.g. /posts/1 to /posts/2) does NOT automatically re-run the resolver — runGuardsAndResolvers: \'paramsChange\' (or similar) must be explicitly configured for that.',
    },
    {
      thought: 'resolvers have some form of built-in caching to avoid redundant fetches when revisiting the same route.',
      reality: 'a resolver by itself has NO caching whatsoever — every navigation runs the resolver function fresh; deduplication requires an explicit cache layer (like shareReplay keyed by param) in the underlying service.',
    },
    {
      thought: 'a resolver is always the better choice over in-component fetching with httpResource().',
      reality: 'they serve different UX tradeoffs — a resolver blocks navigation until data arrives (component never renders without data), while httpResource() lets the URL change immediately with a brief loading state; choose based on whether blocking navigation is actually desired.',
    },
  ];
}
