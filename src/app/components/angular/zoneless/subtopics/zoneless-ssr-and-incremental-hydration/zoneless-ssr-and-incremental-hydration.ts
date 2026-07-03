import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-zoneless-ssr-and-incremental-hydration-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './zoneless-ssr-and-incremental-hydration.html',
  styleUrl: './zoneless-ssr-and-incremental-hydration.scss',
})
export class ZonelessSsrAndIncrementalHydrationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Why "hydrates more predictably" is more than a one-liner',
      points: [
        'The main topic states zoneless apps "hydrate more predictably" without unpacking why. The reason: <code>provideClientHydration()</code> needs to know exactly which parts of the server-rendered DOM need event listeners attached during hydration. In a zone-based app, that determination is implicit — Zone.js patches everything, so hydration has to assume any part of the tree COULD need attaching. In a zoneless app, the signal graph makes this EXPLICIT — Angular can identify precisely which components have reactive dependencies and attach listeners in a more targeted way.',
        'Both <code>provideZonelessChangeDetection()</code> and <code>provideClientHydration()</code> are independent providers that compose in the SAME <code>app.config.ts</code> — enabling zoneless does not require any special hydration configuration beyond what a zone-based SSR app already needs.',
      ],
    },
    {
      heading: 'Incremental hydration + zoneless: deferred blocks stay truly idle until needed',
      points: [
        '<code>@defer (hydrate on viewport)</code> tells Angular to render server HTML for that block immediately (good for SEO and perceived load) but skip attaching event listeners until the block scrolls into view. In a ZONE-based app, Zone.js is still patching globals for the WHOLE page even while a block sits dehydrated — some background monitoring overhead exists regardless of hydration state.',
        'In a ZONELESS app, a dehydrated <code>@defer</code> block has genuinely ZERO reactive machinery running for it until hydration — no zone patches to account for, no signal graph entries for that subtree yet. This is the concrete mechanism behind "hydrates more predictably": the amount of active JavaScript machinery for a not-yet-hydrated block is smaller and more precisely bounded in a zoneless app.',
        'Combine with <code>withEventReplay()</code> exactly as in a zone-based app — a user click on a still-dehydrated deferred block is captured and replayed once that block actually hydrates, regardless of whether the app is zoneless. This part of the mechanism is UNCHANGED by zoneless — only the "what\'s running in the meantime" story differs.',
      ],
    },
    {
      heading: 'Zoneless + SSR gotcha: server-side signal writes must still resolve before the response is sent',
      points: [
        'Angular\'s server-side rendering process waits for the application to reach a "stable" state before serializing HTML — this concept exists in zone-based apps as zone stability detection, but in zoneless apps stability is determined by the signal graph settling (no pending scheduled renders) instead. A <code>resource()</code>-driven signal that has not yet resolved when SSR tries to serialize can produce incomplete server HTML — the same class of bug as an un-awaited async operation in zone-based SSR, just diagnosed differently (check the signal\'s pending state, not zone task counts).',
        'This is why <code>resource()</code> and <code>httpResource()</code> are specifically designed to integrate with Angular\'s rendering lifecycle on the server — they are the SUPPORTED way to fetch data during zoneless SSR, over a raw unmanaged <code>fetch()</code> call inside a constructor that Angular has no way to know about.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.config.ts',
      content: `import { ApplicationConfig } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// Zoneless + hydration compose as independent, unrelated providers —
// no special wiring needed between them.
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideZonelessChangeDetection(),
    provideClientHydration(withEventReplay()),
  ],
};
`,
    },
    {
      path: 'src/app/reviews-section.ts',
      content: `import { Component, resource } from '@angular/core';

async function fetchReviews(): Promise<string[]> {
  await new Promise(r => setTimeout(r, 800));
  return ['Great product!', 'Fast shipping', 'Would buy again'];
}

@Component({
  selector: 'app-reviews-section',
  standalone: true,
  template: \`
    @if (reviewsResource.isLoading()) {
      <p>Loading reviews…</p>
    }
    @for (review of reviewsResource.value() ?? []; track review) {
      <p>{{ review }}</p>
    }
  \`,
})
export class ReviewsSectionComponent {
  // resource() is the SUPPORTED way to fetch during zoneless SSR — Angular's
  // rendering lifecycle knows how to wait for it before serializing HTML.
  reviewsResource = resource({
    loader: () => fetchReviews(),
  });
}
`,
    },
    {
      path: 'src/app/product-page.ts',
      content: `import { Component } from '@angular/core';
import { ReviewsSectionComponent } from './reviews-section';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [ReviewsSectionComponent],
  template: \`
    <h2>Product Details</h2>
    <p>Immediately visible, immediately hydrated content.</p>

    <!-- Rendered on the server for SEO, but stays dehydrated —
         genuinely zero reactive machinery running — until scrolled into view -->
    @defer (hydrate on viewport) {
      <app-reviews-section />
    } @placeholder {
      <p>Reviews section (scroll to load)</p>
    }
  \`,
})
export class ProductPageComponent {}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { ProductPageComponent } from './app/product-page';

bootstrapApplication(ProductPageComponent, appConfig);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Zoneless SSR and incremental hydration</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the @defer trigger from "on viewport" to "on interaction" so the reviews section only hydrates when the user clicks the placeholder.',
    hint: 'Change `@defer (hydrate on viewport)` to `@defer (hydrate on interaction)` — the placeholder must then be clickable to trigger hydration.',
    solution: `@defer (hydrate on interaction) {
  <app-reviews-section />
} @placeholder {
  <button>Click to load reviews</button>
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'enabling zoneless requires special hydration-specific configuration beyond what a zone-based SSR app already needs.',
      reality: 'provideZonelessChangeDetection() and provideClientHydration() are independent providers that simply compose in the same app.config.ts — no special wiring is needed between them.',
    },
    {
      thought: 'a dehydrated @defer block has the same background overhead in a zoneless app as in a zone-based app, since Zone.js patches globals for the whole page regardless.',
      reality: 'in a zoneless app, a dehydrated block genuinely has zero reactive machinery running for it — no zone patches to account for and no signal graph entries yet — versus a zone-based app where Zone.js is still active for the whole page even while a block sits dehydrated.',
    },
    {
      thought: 'a raw fetch() call inside a constructor works the same during zoneless SSR as resource() does.',
      reality: 'Angular\'s SSR process needs to know when async work is pending before it serializes HTML — resource() and httpResource() are specifically integrated with Angular\'s rendering lifecycle for this, while an unmanaged fetch() call is invisible to that mechanism and can produce incomplete server HTML.',
    },
  ];
}
