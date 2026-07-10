import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-font-preload-without-crossorigin-fetches-twice',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './font-preload-without-crossorigin-fetches-twice.html',
  styleUrl: './font-preload-without-crossorigin-fetches-twice.scss'
})
export class FontPreloadWithoutCrossoriginFetchesTwiceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'CSS font requests always use CORS mode — preload has to match that exactly',
      points: [
        'The main page\'s Common Mistake and Q&amp;A are explicit: "font preloads require the crossorigin attribute — without it, the browser fetches the font twice (once for the preload, once when CSS uses it)." The reason given is precise: "CSS font requests use CORS mode," so a preload made WITHOUT crossorigin is treated as a fundamentally different, non-matching request.',
        'The browser deduplicates preloaded resources by matching the exact request mode (and a few other properties) against the resource\'s actual later use — a mismatch on ANY of those means the cache entry the preload created is never reused, so the real request goes out separately, over the network, a second time.',
      ]
    },
    {
      heading: 'This is directly measurable via the Resource Timing API — no guessing required',
      points: [
        '<code>performance.getEntriesByName(url)</code> returns every recorded network-timing entry for a given URL. A correctly-deduplicated preload (crossorigin present and matching) produces exactly ONE entry for the font file. A mismatched preload (crossorigin missing) produces TWO — a real, measurable, double download.',
        'This distinction is invisible just by looking at whether the font visually renders — it renders correctly either way. The only visible cost is the wasted second download, which is why the Resource Timing count is the reliable way to catch it, not a visual check.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>font preload crossorigin mismatch</title>
    <!-- WITHOUT crossorigin — request mode mismatches the CSS @font-face fetch below -->
    <link rel="preload" href="/fonts/demo-font.woff2" as="font" type="font/woff2">
    <style>
      @font-face {
        font-family: 'DemoFont';
        src: url('/fonts/demo-font.woff2') format('woff2');
      }
      body { font-family: 'DemoFont', sans-serif; }
    </style>
  </head>
  <body>
    <p>Text styled with the preloaded font (renders fine either way — the bug is invisible visually).</p>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

// Wait for the page to finish loading (and the font to actually be requested
// by the @font-face rule), then inspect the Resource Timing entries.
window.addEventListener('load', () => {
  setTimeout(() => {
    const entries = performance.getEntriesByType('resource')
      .filter(e => e.name.includes('demo-font.woff2'));

    output.textContent =
      \`Resource Timing entries for demo-font.woff2: \${entries.length}\\n\\n\` +
      entries.map((e, i) => \`  [\${i}] initiatorType=\${(e as PerformanceResourceTiming).initiatorType}  transferSize=\${(e as PerformanceResourceTiming).transferSize}\`).join('\\n') +
      \`\\n\\n\${entries.length > 1
        ? '2 entries confirmed — the mismatched preload (no crossorigin) triggered a genuine SECOND download when CSS requested the font in CORS mode.'
        : 'Only 1 entry — in this sandbox the font file itself 404s, so no real double-fetch could occur; the same mismatch logic still applies whenever a real font file is used.'}\`;
  }, 500);
});
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The preload tag above has NO <code>crossorigin</code> attribute, but the <code>@font-face</code> rule requests the exact same URL. Predict: does the browser recognize these as "the same resource" and reuse the preloaded bytes, or does it treat them as two unrelated requests?',
    hint: 'The main page states the reason directly: CSS font requests always use CORS mode. A preload made without crossorigin was never in CORS mode, so it can never match.',
    solution: `The browser treats them as two unrelated requests and fetches the font twice. Resource
deduplication for preload requires the request's mode/credentials to match exactly — since CSS
always fetches fonts in CORS mode, a preload without crossorigin is fetched in "no-cors" mode by
default, a genuine mismatch. The fix is simply always adding crossorigin to font preloads, even
for same-origin fonts, since the requirement comes from font-specific CORS behavior, not from
cross-origin-ness of the URL itself.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'crossorigin on a preload is only needed when the font file is hosted on a different domain than the page.',
      reality: 'It is required for EVERY font preload, same-origin or not — the requirement comes from the fact that <code>@font-face</code> always fetches fonts in CORS mode, not from cross-origin-ness of the actual URL.'
    },
    {
      thought: 'If a preloaded font renders correctly on the page, the preload is working as intended.',
      reality: 'Visual rendering succeeds either way — a mismatched preload still results in the font eventually loading via the separate CSS-triggered request. The bug is a wasted, invisible second network download, only detectable via Resource Timing, not by looking at the page.'
    },
    {
      thought: 'The browser is smart enough to recognize "this is the same URL" and reuse the preloaded bytes regardless of small attribute differences like crossorigin.',
      reality: 'Preload deduplication matches on the exact request characteristics (URL AND request mode, among other properties) — not URL alone. A mode mismatch means the cached preload response is never considered a match for the later request.'
    },
  ];
}
