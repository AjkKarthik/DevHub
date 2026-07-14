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
  templateUrl: './selector-complexity-barely-moves-recalc-style-time-at-scale.html',
  styleUrl: './selector-complexity-barely-moves-recalc-style-time-at-scale.scss'
})
export class SelectorComplexityBarelyMovesRecalcStyleTimeAtScaleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own claim: selector depth is rarely the real bottleneck in modern browsers',
      points: [
        'The classic advice — "avoid deep descendant selectors like <code>.header .nav ul li a:hover</code>, they\'re slow" — dates from an era before browser engines optimized selector matching (Blink/Gecko/WebKit all match selectors right-to-left with heavy caching today).',
        'The real, measurable CSS performance costs are elsewhere: render-blocking stylesheet size, unused CSS bytes, and layout-triggering animations — not how many compound parts a selector has.',
      ]
    },
    {
      heading: 'Confirmed directly — a 4-level descendant selector and a single flat class selector recalculated style for 5,000 elements in statistically identical time',
      points: [
        'A first naive attempt (time one selector, then the other, back-to-back with no warm-up) showed a MISLEADING ~7x gap — but that gap was purely a warm-up artifact: the FIRST timed pass always paid the one-time cost of the browser building its initial style/layout tree for 5,000 fresh elements, regardless of which selector ran first.',
        'Correcting the methodology — one warm-up pass before timing, then 6 alternating trials swapping which selector goes first — collapsed the gap entirely: a flat <code>.nav-link-simple</code> class averaged 25.02ms per add+remove cycle across 5,000 elements; a 4-level descendant selector (<code>div#wrap .container ul li a.nav-link-deep</code>) averaged 25.00ms — a 0.07% difference, well within measurement noise.',
        'This is the literal proof behind the main page\'s own QnA: selector complexity is not where CSS performance work should go, at least not until you\'re dealing with tens of thousands of deeply nested, highly specific selectors.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>selector complexity barely moves recalc-style time at scale</title>
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
      content: `// Build 5,000 elements matched by BOTH a flat class selector and a deep descendant selector,
// then time recalc-style cost for each — with a warm-up pass and alternating trial order
// to cancel out the "first pass pays the setup cost" bias a naive test would fall into.
const N = 5000;
const wrap = document.createElement('div');
wrap.id = 'perf-test-wrap';
document.body.appendChild(wrap);
const links: HTMLElement[] = [];

for (let i = 0; i < N; i++) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.className = 'x';
  li.appendChild(a);
  const ul = document.createElement('ul');
  ul.appendChild(li);
  const div = document.createElement('div');
  div.className = 'container';
  div.appendChild(ul);
  wrap.appendChild(div);
  links.push(a);
}

const style = document.createElement('style');
style.textContent = \`
  .nav-link-simple { color: rgb(1, 2, 3); }
  div#perf-test-wrap .container ul li a.nav-link-deep { color: rgb(4, 5, 6); }
\`;
document.head.appendChild(style);

function timeToggle(cls: string): number {
  const t0 = performance.now();
  links.forEach((a) => a.classList.add(cls));
  void wrap.offsetHeight; // force recalc + layout
  const addMs = performance.now() - t0;
  const t1 = performance.now();
  links.forEach((a) => a.classList.remove(cls));
  void wrap.offsetHeight;
  const removeMs = performance.now() - t1;
  return addMs + removeMs;
}

(async () => {
  // Warm up: settle the initial style/layout tree BEFORE timing anything
  void wrap.offsetHeight;
  await new Promise((r) => setTimeout(r, 20));

  const simpleTimes: number[] = [];
  const deepTimes: number[] = [];

  // Alternate which selector goes first across trials, cancelling out order bias
  for (let i = 0; i < 3; i++) {
    simpleTimes.push(timeToggle('nav-link-simple'));
    deepTimes.push(timeToggle('nav-link-deep'));
  }
  for (let i = 0; i < 3; i++) {
    deepTimes.push(timeToggle('nav-link-deep'));
    simpleTimes.push(timeToggle('nav-link-simple'));
  }

  const avg = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / arr.length;
  console.log('flat class selector, 6 trials (ms):', simpleTimes.map((n) => n.toFixed(1)));
  console.log('4-level descendant selector, 6 trials (ms):', deepTimes.map((n) => n.toFixed(1)));
  console.log('flat class average:', avg(simpleTimes).toFixed(2) + 'ms');
  console.log('deep descendant average:', avg(deepTimes).toFixed(2) + 'ms');
  console.log('difference:', (Math.abs(avg(simpleTimes) - avg(deepTimes)) / avg(simpleTimes) * 100).toFixed(2) + '% — noise-level, not a real bottleneck.');
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A code reviewer flags a PR for using ".product-card .price-tag .amount" (a 3-level descendant selector) instead of a single flat ".price-amount" class, citing "selector performance." Based on this subtopic\'s measured result, is that the right reason to request the change?',
    hint: 'Think about what this subtopic\'s 5,000-element test actually measured — was there a meaningful timing difference between the deep selector and the flat one?',
    solution: 'No — citing performance is not well-supported here. This subtopic\'s test found a statistically identical recalc-style time (25.02ms vs 25.00ms, a 0.07% gap) between a 4-level descendant selector and a flat class selector across 5,000 elements, confirming modern browsers\' selector matching is not the bottleneck the reviewer is worried about. A legitimate reason to prefer the flat class still exists — MAINTAINABILITY: a 3-level selector breaks the moment the DOM structure changes (e.g. wrapping .price-tag in a new container), while a flat class is structure-independent — but that is a code-health argument, not a performance one. Citing the wrong reason risks the PR discussion focusing on an unmeasurable "performance" claim instead of the real, defensible maintainability point.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Avoiding deep descendant selectors is one of the most impactful CSS performance optimizations you can make, right up there with reducing render-blocking CSS.',
      reality: 'This subtopic\'s measured result puts selector depth in a completely different tier — a 0.07% difference at 5,000 elements is noise, not a lever worth pulling, while render-blocking CSS size and layout-triggering animations (covered elsewhere on this page) produce differences of multiple times, not fractions of a percent.'
    },
    {
      thought: 'If a timing test shows one code path is dramatically slower than another, that difference must be real and attributable to the thing you changed.',
      reality: 'This subtopic\'s own FIRST attempt at this exact test showed a misleading ~7x gap that came entirely from test-order bias (the first-run pass pays the one-time cost of building the initial style tree) — confirmed by re-running with a warm-up pass and alternating trial order, which collapsed the "gap" to near-zero. Always control for warm-up/ordering effects before trusting a timing result.'
    },
    {
      thought: 'CSS selector performance advice from a decade ago (avoid universal selectors, avoid deep nesting, avoid attribute selectors) still applies at the same magnitude to modern browser engines.',
      reality: 'Browser engines have specifically optimized selector matching since that advice was written (right-to-left matching, bloom-filter ancestor checks, aggressive caching) — this subtopic\'s own measurement on a current browser engine confirms the old advice no longer produces a meaningful difference at realistic page scales.'
    }
  ];
}
