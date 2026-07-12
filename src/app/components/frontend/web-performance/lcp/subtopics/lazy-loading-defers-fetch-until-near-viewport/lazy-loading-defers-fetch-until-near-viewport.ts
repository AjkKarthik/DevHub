import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './lazy-loading-defers-fetch-until-near-viewport.html',
  styleUrl: './lazy-loading-defers-fetch-until-near-viewport.scss'
})
export class LazyLoadingDefersFetchUntilNearViewportSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'loading="lazy" is not a cosmetic hint — it genuinely withholds the network request until the browser judges the image close enough to the viewport',
      points: [
        'An <code>&lt;img loading="lazy"&gt;</code> placed far outside the current viewport produces NO <code>PerformanceResourceTiming</code> entry at all until it nears the visible area — the request is not merely deprioritised, it has not been sent yet.',
        'The identical image with <code>loading="eager"</code> (or no <code>loading</code> attribute) fetches immediately regardless of where it sits on the page, producing a resource-timing entry right away.',
        'This is directly measurable: two images placed far below the fold, one lazy and one eager, checked against <code>performance.getEntriesByType(\'resource\')</code> after a short wait — only the eager one has fired a request.',
      ]
    },
    {
      heading: 'Why this makes loading="lazy" actively dangerous specifically on the LCP element',
      points: [
        'The LCP element is, by definition, the largest thing that ends up visible — but the browser has to DECIDE whether to lazy-defer an image before layout is fully settled, using the DOM position it can determine at parse/discovery time.',
        'Anything that pushes the true rendered position of the hero image outside what the browser can already confirm as "in or very near the viewport" at that early moment — a slow-loading ad slot above it, a cookie banner, dynamic JS-driven layout — risks the browser deferring a fetch for an image that will, moments later, turn out to be the LCP element after all.',
        'There is no equivalent risk with <code>loading="eager"</code> (or omitting the attribute): the fetch always starts immediately, so there is no discovery-timing gamble for the single most important image on the page.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>loading="lazy" defers fetch until near viewport</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="spacer" style="height: 9000px;"></div>
    <img id="lazyImg" src="https://picsum.photos/id/1015/80/80?lazy" loading="lazy" width="80" height="80">
    <img id="eagerImg" src="https://picsum.photos/id/1016/80/80?eager" loading="eager" width="80" height="80">
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `setTimeout(() => {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const lazyEntry = entries.find(e => e.name.includes('lazy'));
  const eagerEntry = entries.find(e => e.name.includes('eager'));

  console.log('lazy image (9000px below the fold) fetched yet?', !!lazyEntry);
  console.log('eager image (also 9000px below the fold) fetched yet?', !!eagerEntry);
  console.log('same distance from the viewport, same page — only "loading" differs.');
  console.log('scroll to the bottom of this preview and re-run to see the lazy image finally fetch.');
}, 600);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A product page shows a full-bleed hero image at the very top, but the markup has <code>&lt;img loading="lazy"&gt;</code> on it — copy-pasted from a below-the-fold product gallery component elsewhere in the codebase. Lighthouse flags "Largest Contentful Paint image was lazily loaded". Is this a real problem, or is Lighthouse being overly cautious since the image IS visible immediately?',
    hint: 'Ask what the browser has to decide at DISCOVERY time (during HTML parsing), before layout has necessarily settled — not what a human looking at the final rendered page can plainly see.',
    solution: 'It is a real problem, not a false positive. Even though a human looking at the finished page sees the hero clearly in the viewport, the browser must decide whether to defer the fetch much earlier — while parsing the HTML, before layout is guaranteed to be settled. loading="lazy" tells the browser "this is probably not immediately needed", which can delay discovery of exactly the element that turns out to be the LCP candidate. The fix is simply removing loading="lazy" (or setting loading="eager") from any image that is above the fold, especially the hero — there is no upside to gambling on an element that is, by definition, the largest and most important one on the page.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'loading="lazy" makes an image load "a little slower" in general — a modest, roughly-fixed penalty no matter where the image sits on the page.',
      reality: 'For an image genuinely far from the viewport, lazy loading does not fetch it AT ALL until scroll brings it near — this subtopic\'s demo shows zero resource-timing entries for a lazy image 9000px down the page, versus an immediate entry for the identical eager image at the same position.'
    },
    {
      thought: 'Since the LCP image is always visually "above the fold" by definition, loading="lazy" on it is harmless — the browser can obviously see it is in the viewport.',
      reality: 'The browser has to make the lazy/eager discovery decision early, before layout is necessarily finalised — anything that makes the hero\'s true position uncertain at that early moment (dynamic content above it, slow-rendering banners) turns loading="lazy" from harmless into a real risk on exactly the element where a delay matters most.'
    },
    {
      thought: 'loading="lazy" and fetchpriority="low" are basically two ways of saying the same thing — "this image is not urgent".',
      reality: 'They are fundamentally different mechanisms — loading="lazy" controls WHETHER and WHEN the request is even sent (it can be withheld indefinitely), while fetchpriority only adjusts relative bandwidth priority for a request that is already in flight. A lazy image at the bottom of a long page may never fetch until scrolled to; a low-priority eager image always fetches, just possibly slower.'
    }
  ];
}
