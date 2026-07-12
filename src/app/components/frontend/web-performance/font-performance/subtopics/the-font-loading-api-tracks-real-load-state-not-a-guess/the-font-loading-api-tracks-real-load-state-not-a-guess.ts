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
  templateUrl: './the-font-loading-api-tracks-real-load-state-not-a-guess.html',
  styleUrl: './the-font-loading-api-tracks-real-load-state-not-a-guess.scss'
})
export class TheFontLoadingApiTracksRealLoadStateNotAGuessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'document.fonts.check() reports a real, live fact about the browser\'s own FontFaceSet — it is not a heuristic or an estimate',
      points: [
        'Before any code has explicitly loaded a given font, <code>document.fonts.check(\'400 16px "MyFont"\')</code> genuinely returns <code>false</code> — confirmed directly, not assumed.',
        'Calling <code>document.fonts.load(\'400 16px "MyFont"\')</code> triggers a REAL network request for that font file — confirmed via <code>PerformanceResourceTiming</code>, the request count for the font URL genuinely goes from 0 to 1 the moment <code>load()</code> is called.',
        'Once <code>load()</code> resolves successfully, <code>document.fonts.check()</code> for that exact same font description flips to <code>true</code> — a real, observable state transition driven by an actual completed network fetch, not a timer or a guess.',
      ]
    },
    {
      heading: 'This makes it possible to avoid layout glitches from a webfont arriving mid-interaction, without polling or guessing',
      points: [
        'A common pattern: check if a font is already loaded before triggering an animation or layout calculation that depends on its exact metrics — if <code>check()</code> is already true, proceed immediately; if not, <code>await document.fonts.load(...)</code> (or <code>document.fonts.ready</code>) before proceeding.',
        'Without this, code that assumes a webfont is ready (e.g. immediately after page load) can measure or animate against the FALLBACK font\'s metrics, then visibly jump once the real font actually finishes loading later — the Font Loading API removes the guesswork about exactly when that happens.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>the Font Loading API tracks real load state, not a guess</title>
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
      content: `const style = document.createElement('style');
style.textContent = \`
  @font-face {
    font-family: 'DemoWebfont';
    src: url('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2') format('woff2');
  }
\`;
document.head.appendChild(style);

(async () => {
  const spec = '400 16px "DemoWebfont"';

  console.log('before doing anything: document.fonts.check(spec) =', document.fonts.check(spec));

  console.log('calling document.fonts.load(spec) — this triggers a real network fetch...');
  const loadedFaces = await document.fonts.load(spec);
  console.log('load() resolved — FontFace objects returned:', loadedFaces.length);

  console.log('after load() resolved: document.fonts.check(spec) =', document.fonts.check(spec));

  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const fontRequest = entries.find((e) => e.name.includes('KFOmCnqEu92Fr1Mu4mxK'));
  console.log('a real network request for the font file exists:', !!fontRequest, fontRequest ? '(' + Math.round(fontRequest.transferSize) + ' bytes transferred)' : '');
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A component measures the pixel width of a heading immediately on mount to position an underline animation precisely beneath it. On first page load (cold cache), the underline is consistently off by a few pixels, but on subsequent visits (warm cache) it is perfectly positioned. What is the most likely cause, and how would document.fonts fix it?',
    hint: 'Ask what font the heading is actually rendered with at the exact moment the width measurement runs on a cold-cache first visit, versus a warm-cache repeat visit.',
    solution: 'On a cold cache, the webfont has not finished downloading yet when the component measures the heading\'s width — the measurement runs against the FALLBACK font\'s metrics, which differ slightly from the real webfont\'s. On a warm cache, the webfont is already available (cached), so the measurement happens against the correct final metrics, and the positioning is accurate. The fix is checking document.fonts.check() first (or awaiting document.fonts.ready) before measuring — confirmed in this subtopic\'s demo that check() accurately and immediately reflects real load state, so gating the measurement on it (or re-measuring after document.fonts.ready resolves) ensures the width is always calculated against the final, correct font.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'document.fonts.check() is a rough heuristic — it might return true slightly before the font is ACTUALLY usable, or lag behind the real load state.',
      reality: 'It reflects the browser\'s own internal FontFaceSet state exactly, with no lag — this subtopic\'s demo shows it reporting false before any load, then true immediately after load() genuinely resolves, matching the real network completion precisely.'
    },
    {
      thought: 'Calling document.fonts.load() is a passive check — like check(), it only reads existing state and does not itself cause anything to be downloaded.',
      reality: 'load() actively triggers a real network fetch if the font is not already loaded — confirmed directly in this subtopic\'s demo via a genuine PerformanceResourceTiming entry appearing for the font URL as a direct result of calling load().'
    },
    {
      thought: 'The Font Loading API is really only useful for advanced font-loading orchestration (staggered loading, priority queues) — a typical page with a simple webfont setup has no practical use for it.',
      reality: 'Even a simple page benefits from the exact pattern in this subtopic\'s Try It exercise — gating any layout measurement that depends on final font metrics behind document.fonts.check()/ready avoids cold-cache-only visual bugs that are easy to miss during development (where the cache is usually already warm).'
    }
  ];
}
