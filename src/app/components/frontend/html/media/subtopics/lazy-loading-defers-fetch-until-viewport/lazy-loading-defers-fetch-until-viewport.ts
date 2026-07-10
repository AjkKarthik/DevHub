import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-lazy-loading-defers-fetch-until-viewport',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './lazy-loading-defers-fetch-until-viewport.html',
  styleUrl: './lazy-loading-defers-fetch-until-viewport.scss'
})
export class LazyLoadingDefersFetchUntilViewportSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'eager loads the moment the parser sees it — position never matters',
      points: [
        'The default value of <code>loading</code> is <code>"eager"</code>. An eager image starts its network request as soon as the browser\'s HTML parser reaches the <code>&lt;img&gt;</code> tag — completely independent of whether that image is above or below the visible viewport.',
        'This is why the main page warns never to add <code>loading="lazy"</code> to your LCP (Largest Contentful Paint) candidate: even an image 5000px down the page loads immediately if it is eager, so making it eager on purpose is not "wasteful" for a genuinely above-fold hero — it is only wasteful for images the user may never scroll to.',
      ]
    },
    {
      heading: 'lazy genuinely withholds the network request',
      points: [
        'A <code>loading="lazy"</code> image does not just delay rendering — the browser withholds the actual network fetch entirely until the image nears the viewport (roughly a viewport height or two away, exact threshold is browser-defined and not spec-mandated).',
        'You can observe this directly: immediately after page load, a lazy image far below the fold has <code>img.complete === false</code> and <code>img.naturalWidth === 0</code> — there is no image data at all yet, not even a placeholder byte. An eager image at the same distance is already fully loaded.',
      ]
    },
    {
      heading: 'Scrolling is what triggers the deferred fetch',
      points: [
        'Once a lazy image crosses into (or near) the viewport — whether by user scroll or a programmatic <code>scrollIntoView()</code> — the browser starts the fetch exactly as if it had been eager from that point onward. There is no special API call required to "unlock" it; it is entirely automatic, driven by the browser\'s own internal viewport-proximity tracking.',
        'This means the SAME <code>&lt;img&gt;</code> element genuinely transitions from <code>naturalWidth === 0</code> to a real loaded value, entirely as a side effect of scroll position — a mutation your own code never triggers directly.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>lazy vs eager loading</title></head>
  <body>
    <p id="status">Checking image load state on page load…</p>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>

    <!-- A huge spacer guarantees both images start far below the fold -->
    <div style="height: 3000px; background: linear-gradient(#eee, #ccc); display:flex; align-items:center; justify-content:center;">
      scroll down 3000px to reach the images
    </div>

    <img id="eagerImg" src="https://picsum.photos/id/1015/300/200" loading="eager" alt="eager loaded landscape" width="300" height="200">
    <img id="lazyImg" src="https://picsum.photos/id/1016/300/200" loading="lazy" alt="lazily loaded mountain" width="300" height="200">

    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;
const eagerImg = document.getElementById('eagerImg') as HTMLImageElement;
const lazyImg = document.getElementById('lazyImg') as HTMLImageElement;

function snapshot(label: string) {
  const line = \`\${label}
  eager.naturalWidth = \${eagerImg.naturalWidth}  (complete: \${eagerImg.complete})
  lazy.naturalWidth  = \${lazyImg.naturalWidth}  (complete: \${lazyImg.complete})
\`;
  output.textContent += line;
  console.log(line);
}

window.addEventListener('load', () => {
  // Right after page load, before any scrolling: eager has fetched, lazy has not.
  snapshot('Immediately after window load (no scroll yet):');

  setTimeout(() => {
    // Scroll the lazy image into view — this is what actually triggers its fetch.
    lazyImg.scrollIntoView({ behavior: 'instant', block: 'center' });

    lazyImg.addEventListener('load', () => {
      snapshot('After scrollIntoView() + the lazy image finished loading:');
    }, { once: true });
  }, 1000);
});
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The demo above proves <code>eager.naturalWidth</code> is already non-zero on load while <code>lazy.naturalWidth</code> is still <code>0</code>. Before reading the code, predict: if you swapped BOTH images to <code>loading="lazy"</code>, would the very first <code>snapshot()</code> call show <code>0</code> for both, or would the browser still eagerly load whichever one appears first in the HTML?',
    hint: 'The <code>loading</code> attribute is read per-element — the browser does not treat "the first image on the page" specially. There is nothing exempting document order from the lazy behavior.',
    solution: `Both would show naturalWidth === 0 on the first snapshot. "loading" is evaluated independently
per <img> element based on its own attribute value and its own distance from the viewport —
document order plays no role. The only reason "eagerImg" loads immediately in the real demo is
its own loading="eager" attribute, not the fact that it happens to appear first in the HTML.
A common wrong assumption is that the browser somehow prioritizes early elements in the source;
it does not — each img makes its own independent lazy/eager decision.`
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>loading="lazy"</code> just delays when the image becomes <em>visible</em>, like a CSS opacity fade-in.',
      reality: 'It delays the actual network <strong>fetch</strong>. There is no image data downloaded at all until the browser decides the element is near the viewport — this is a real bandwidth and request-count saving, not a visual effect.'
    },
    {
      thought: 'Whether an image loads immediately depends on its position in the HTML document — earlier elements load first.',
      reality: 'It depends entirely on the <code>loading</code> attribute\'s own value on that element, resolved against the current viewport. Document order has no effect on eager-vs-lazy timing.'
    },
    {
      thought: 'Since lazy loading is "better for performance," it is safe to add to every image on the page, including the hero.',
      reality: 'Lazy-loading the LCP candidate <strong>delays</strong> the very metric Core Web Vitals cares about most. The main page is explicit: never lazy-load your LCP image — use <code>fetchpriority="high"</code> there instead.'
    },
  ];
}
