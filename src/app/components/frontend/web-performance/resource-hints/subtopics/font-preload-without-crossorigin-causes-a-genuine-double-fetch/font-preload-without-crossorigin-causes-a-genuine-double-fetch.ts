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
  templateUrl: './font-preload-without-crossorigin-causes-a-genuine-double-fetch.html',
  styleUrl: './font-preload-without-crossorigin-causes-a-genuine-double-fetch.scss'
})
export class FontPreloadWithoutCrossoriginCausesAGenuineDoubleFetchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A preload and its consumer are matched by URL AND request mode together — not URL alone',
      points: [
        'The browser caches a preloaded response keyed by more than just the URL: the request MODE (CORS vs no-CORS) is part of the match too. A plain <code>&lt;link rel="preload" as="font"&gt;</code> with no <code>crossorigin</code> attribute fetches in no-CORS mode by default.',
        '<code>@font-face</code> rules ALWAYS fetch their font file in CORS mode, regardless of origin — this is a font-specific browser requirement, not something a developer opts into.',
        'When the preload\'s mode (no-CORS) does not match the @font-face request\'s mode (CORS), the browser cannot reuse the preloaded response — it fetches the exact same URL a second time.',
      ]
    },
    {
      heading: 'This is directly measurable — two real network requests for the identical URL',
      points: [
        'Confirmed directly: a font preload with no <code>crossorigin</code>, consumed by a matching <code>@font-face</code>, produces TWO separate <code>PerformanceResourceTiming</code> entries for the exact same URL — one <code>initiatorType: "link"</code> (the preload) and one <code>initiatorType: "css"</code> (the actual font fetch).',
        'Adding <code>crossorigin</code> to the preload link — even for a SAME-ORIGIN font — makes both requests use CORS mode, and the result collapses to exactly ONE network request, confirmed the same way.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>font preload without crossorigin causes a genuine double-fetch</title>
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
      content: `function testCase(label: string, headHtml: string): Promise<any[]> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:1px;height:1px;';
    iframe.srcdoc = \`<!doctype html><html><head>\${headHtml}</head><body>text</body></html>\`;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        const entries = (iframe.contentWindow as any).performance
          .getEntriesByType('resource')
          .filter((e: any) => e.name.includes('demo-font'))
          .map((e: any) => ({ initiatorType: e.initiatorType }));
        document.body.removeChild(iframe);
        resolve(entries);
      }, 400);
    };
  });
}

(async () => {
  const noCrossorigin = await testCase('no crossorigin', \`
    <link rel="preload" as="font" type="font/woff2" href="/index.html?demo-font=A">
    <style>@font-face { font-family: 'T'; src: url('/index.html?demo-font=A') format('woff2'); } body { font-family: 'T'; }</style>
  \`);

  const withCrossorigin = await testCase('with crossorigin', \`
    <link rel="preload" as="font" type="font/woff2" href="/index.html?demo-font=B" crossorigin>
    <style>@font-face { font-family: 'T'; src: url('/index.html?demo-font=B') format('woff2'); } body { font-family: 'T'; }</style>
  \`);

  console.log('preload with NO crossorigin — real requests for the same URL:', noCrossorigin.length, noCrossorigin);
  console.log('preload WITH crossorigin — real requests for the same URL:', withCrossorigin.length, withCrossorigin);
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adds <code>&lt;link rel="preload" as="font" href="/fonts/brand.woff2"&gt;</code> to speed up their custom font, expecting a faster First Contentful Paint. After shipping, Lighthouse still flags the font as slow, and the Network tab shows the font file requested twice. The team assumes preload does not work for same-origin fonts. What is actually going on?',
    hint: 'Ask what request MODE a font always uses when consumed by @font-face, and whether the preload link is using that same mode.',
    solution: 'Preload works fine for same-origin fonts — the missing piece is the crossorigin attribute. @font-face ALWAYS fetches its font file in CORS mode, regardless of origin, but a preload link with no crossorigin attribute fetches in no-CORS mode by default. Since the two requests use different modes, the browser cannot match them and fetches the font twice — once for the preload (wasted) and once for the real @font-face request. The fix is adding crossorigin to the preload link, even though the font is same-origin: <link rel="preload" as="font" href="/fonts/brand.woff2" crossorigin>.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'crossorigin is only needed on a preload link when the resource is actually hosted on a different origin — for a same-origin font, it should be safe to omit.',
      reality: 'Fonts are a special case — @font-face ALWAYS uses CORS mode regardless of origin, so a same-origin font preload without crossorigin still mismatches and double-fetches, confirmed directly in this subtopic\'s demo.'
    },
    {
      thought: 'A "double-fetch" from a mismatched preload is a minor inefficiency — the browser probably serves the second request from cache anyway, so the real-world cost is negligible.',
      reality: 'The mismatch is exactly what PREVENTS the cache match — that is the entire mechanism causing the double-fetch. The second request is a genuine new network fetch, not a cache hit, fully negating the intended benefit of preloading.'
    },
    {
      thought: 'Only <link rel="preload" as="font"> needs crossorigin — other preload types (images, scripts, styles) never need it.',
      reality: 'crossorigin is needed on ANY preload whose consumer will fetch in CORS mode — this includes cross-origin images consumed with the crossorigin attribute set on the <img> tag, or any resource loaded via fetch()/XHR with CORS. Fonts are simply the most common case where this is easy to forget, since @font-face\'s CORS requirement is not obvious from the syntax.'
    }
  ];
}
