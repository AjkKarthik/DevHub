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
  templateUrl: './mismatched-preload-url-causes-a-genuine-double-fetch.html',
  styleUrl: './mismatched-preload-url-causes-a-genuine-double-fetch.scss'
})
export class MismatchedPreloadUrlCausesAGenuineDoubleFetchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The preload cache match is an EXACT URL match — not "close enough" or "same resource, different query string"',
      points: [
        'The browser matches a preloaded response to its eventual consumer by comparing the request URL character-for-character (including query strings). Two URLs that point at conceptually "the same image" but differ even slightly — a different query parameter, a trailing slash, a different cache-busting hash — are treated as two completely unrelated resources.',
        'This commonly happens by accident: a preload written against a hand-typed URL that drifts out of sync with a build-tool-generated hashed filename in the actual <code>&lt;img&gt;</code> or <code>&lt;script&gt;</code> tag.',
      ]
    },
    {
      heading: 'This is directly measurable — an exact URL match produces one request; any mismatch produces two',
      points: [
        'Confirmed directly: a preload for <code>/hero.avif?a</code> followed by an <code>&lt;img src="/hero.avif?b"&gt;</code> (differing only in the query string) produces TWO separate resource-timing entries — the preload\'s own request AND the img\'s separate request. The preload was fetched for nothing.',
        'The identical setup with matching URLs (<code>?c</code> on both) produces exactly ONE entry — the img reuses the preloaded response, confirmed via its <code>initiatorType</code> being <code>"link"</code> rather than <code>"img"</code>.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>mismatched preload URL causes a genuine double-fetch</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function testCase(label: string, headHtml: string, bodyHtml: string): Promise<any[]> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:1px;height:1px;';
    iframe.srcdoc = \`<!doctype html><html><head>\${headHtml}</head><body>\${bodyHtml}</body></html>\`;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        const entries = (iframe.contentWindow as any).performance
          .getEntriesByType('resource')
          .filter((e: any) => e.name.includes('demo-img'))
          .map((e: any) => ({ initiatorType: e.initiatorType, urlTail: e.name.split('demo-img=')[1] }));
        document.body.removeChild(iframe);
        resolve(entries);
      }, 400);
    };
  });
}

(async () => {
  const mismatched = await testCase('mismatched URLs',
    '<link rel="preload" as="image" href="/index.html?demo-img=a">',
    '<img src="/index.html?demo-img=b">');

  const matched = await testCase('matching URLs',
    '<link rel="preload" as="image" href="/index.html?demo-img=c">',
    '<img src="/index.html?demo-img=c">');

  console.log('preload href="?a" but img src="?b" — real requests:', mismatched.length, mismatched);
  console.log('preload href="?c" and img src="?c" (exact match) — real requests:', matched.length, matched);
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A build pipeline generates hashed asset filenames like <code>hero.a1b2c3.avif</code> on every deploy. A developer hand-writes <code>&lt;link rel="preload" as="image" href="/hero.avif"&gt;</code> in a static HTML template, assuming the browser will "figure out" it means the current hero image. The site deploys successfully with no errors, but LCP does not improve at all. Why not?',
    hint: 'Ask whether the preload href actually matches the URL the browser will request when it parses the real <img> tag — character for character.',
    solution: 'The preload never matches anything, because the actual image is served from a hashed filename like /hero.a1b2c3.avif, not the hand-written /hero.avif. The browser treats these as two completely different resources — it dutifully fetches /hero.avif (which either 404s or serves a stale unhashed file, wasting bandwidth for nothing) and separately fetches the real, correctly-hashed image at normal (non-preloaded) priority when the parser reaches the <img> tag. The preload link needs to be generated by the SAME build step that produces the hashed filename, so the two URLs always stay in sync.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The browser matches a preload to its consumer based on the resource TYPE and rough intent (e.g. "this is clearly the hero image") — minor URL differences like a query string should not matter.',
      reality: 'The match is a strict, exact URL comparison with no fuzzy logic — this subtopic\'s demo shows that differing by only a single query parameter character is enough to produce two completely separate requests, confirmed via real resource-timing entries.'
    },
    {
      thought: 'A mismatched preload is a wasted download, but at least it does not make anything WORSE than not preloading at all.',
      reality: 'It is measurably worse than not preloading — the page now makes an EXTRA network request (the wasted preload) in addition to the original, unaccelerated request for the real resource, competing for the same limited early-load bandwidth that could have gone to something useful.'
    },
    {
      thought: 'This kind of mismatch is rare in practice — most teams write preload links by hand alongside the resource they reference, so the URLs naturally stay in sync.',
      reality: 'It is a common, real-world failure mode specifically because build tools often hash or version asset filenames automatically while resource hints are frequently hand-written in static templates — the two are easy to let drift out of sync across deploys unless the preload link itself is generated by the same build step.'
    }
  ];
}
