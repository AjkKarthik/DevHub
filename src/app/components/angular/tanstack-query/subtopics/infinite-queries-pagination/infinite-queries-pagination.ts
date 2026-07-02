import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-infinite-queries-pagination-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './infinite-queries-pagination.html',
  styleUrl: './infinite-queries-pagination.scss',
})
export class InfiniteQueriesPaginationSubtopic {

  tsqDeps = { '@tanstack/angular-query-experimental': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'injectInfiniteQuery() — a genuinely different shape from injectQuery()',
      points: [
        'An infinite query stores its result as <code>data().pages</code> — an ARRAY OF PAGES, each page being whatever <code>queryFn</code> returned for that page — plus <code>data().pageParams</code>, the array of params used to fetch each page. This is structurally different from a regular query\'s single <code>data()</code> value, and requires <code>data().pages.flatMap(...)</code> (or similar) to render as one flat list.',
        '<code>initialPageParam</code> sets the param used for the FIRST fetch (commonly <code>0</code> or <code>null</code>). <code>getNextPageParam: (lastPage, allPages) =&gt; lastPage.nextCursor ?? undefined</code> tells TanStack Query how to compute the NEXT page\'s param from the most recently fetched page — returning <code>undefined</code> signals "no more pages."',
      ],
    },
    {
      heading: 'Loading more and the fetchNextPage() lifecycle',
      points: [
        '<code>query.fetchNextPage()</code> triggers fetching the next page using whatever <code>getNextPageParam</code> computed — call it from a "Load more" button click handler, or from an <code>IntersectionObserver</code> callback for true infinite-scroll-on-scroll behavior.',
        '<code>query.hasNextPage()</code> is <code>true</code> only if the last computed <code>getNextPageParam</code> result was NOT <code>undefined</code> — use it to hide the "Load more" button/disable further fetch triggers once the last page has been reached.',
        '<code>query.isFetchingNextPage()</code> is specifically <code>true</code> while a NEXT-page fetch is in flight — distinct from <code>isFetching()</code> (any fetch, including background refetches of already-loaded pages) and <code>isLoading()</code> (the very first page only). Use it to show a small "loading more..." indicator without triggering a full-page loading state.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { injectInfiniteQuery } from '@tanstack/angular-query-experimental';

interface Page { items: string[]; nextCursor: number | undefined; }

function fetchPage(cursor: number): Promise<Page> {
  return new Promise(resolve => {
    setTimeout(() => {
      const items = Array.from({ length: 5 }, (_, i) => \`Item #\${cursor * 5 + i + 1}\`);
      const nextCursor = cursor < 4 ? cursor + 1 : undefined; // 5 pages total
      resolve({ items, nextCursor });
    }, 400);
  });
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Infinite query — 5 items per page, 5 pages total</h3>
    @if (feed.data(); as data) {
      <ul>
        @for (page of data.pages; track $index) {
          @for (item of page.items; track item) {
            <li>{{ item }}</li>
          }
        }
      </ul>
    }

    @if (feed.hasNextPage()) {
      <button (click)="feed.fetchNextPage()" [disabled]="feed.isFetchingNextPage()">
        {{ feed.isFetchingNextPage() ? 'Loading more...' : 'Load more' }}
      </button>
    } @else {
      <p>No more items.</p>
    }
  \`,
})
export class App {
  feed = injectInfiniteQuery(() => ({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: Page) => lastPage.nextCursor,
  }));
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [provideTanStackQuery(new QueryClient())],
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Infinite queries and pagination</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the page size from 5 items to 3 items per page, and the total page count from 5 to 4, then verify "Load more" still correctly stops after the last page.',
    hint: 'Change the items array length from 5 to 3, adjust the cursor multiplier (cursor * 3), and change the nextCursor condition from cursor < 4 to cursor < 3.',
    solution: `function fetchPage(cursor: number): Promise<Page> {
  return new Promise(resolve => {
    setTimeout(() => {
      const items = Array.from({ length: 3 }, (_, i) => \`Item #\${cursor * 3 + i + 1}\`);
      const nextCursor = cursor < 3 ? cursor + 1 : undefined; // 4 pages total
      resolve({ items, nextCursor });
    }, 400);
  });
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'an infinite query\'s data() looks the same as a regular query\'s — a single flat value.',
      reality: 'infinite query data is structurally different: data().pages is an ARRAY of page results, plus data().pageParams — rendering as a flat list requires flattening the pages array yourself.',
    },
    {
      thought: 'hasNextPage() is just a manually-maintained flag you set yourself based on how many pages you\'ve loaded.',
      reality: 'it is computed automatically from whether the last getNextPageParam call returned undefined or a real value — no manual page-counting is needed.',
    },
    {
      thought: 'isFetchingNextPage() and isFetching() mean the same thing.',
      reality: 'isFetchingNextPage() is specifically true only while fetching a NEW next page — isFetching() is true for ANY in-flight fetch, including background refetches of pages already loaded, which is a meaningfully different signal for UI purposes.',
    },
  ];
}
