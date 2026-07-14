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
  templateUrl: './preload-beats-a-blocking-resource-for-lcp.html',
  styleUrl: './preload-beats-a-blocking-resource-for-lcp.scss'
})
export class PreloadBeatsABlockingResourceForLcpSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A <link rel="preload"> discovered at the top of <head> starts the network request before a blocking resource lower down would have let the parser reach the image at all',
      points: [
        'Without a preload hint, the browser only discovers the LCP image when the HTML parser physically reaches the <code>&lt;img&gt;</code> tag — and the parser is BLOCKED from reaching anything past a render-blocking <code>&lt;link rel="stylesheet"&gt;</code> or a non-<code>async</code>/<code>defer</code> <code>&lt;script&gt;</code> until that resource finishes.',
        'A preload link placed before the blocking resource is a request the browser fires immediately, in parallel with — not after — the blocking resource, because preload hints are not render-blocking themselves.',
        'This is directly measurable using the real Resource Timing API (<code>PerformanceResourceTiming.fetchStart</code>): the preloaded resource\'s <code>fetchStart</code> lands right when the preload link is parsed, while an equivalent un-preloaded image\'s <code>fetchStart</code> lands only after the simulated blocking delay clears — a real, reproducible timing gap that matches the blocking delay almost exactly.',
      ]
    },
    {
      heading: 'The size of the win scales directly with how long the blocking resource takes',
      points: [
        'A 50ms blocking stylesheet costs the un-preloaded image roughly 50ms of delayed discovery; a slow, unoptimised 800ms stylesheet costs it roughly 800ms — the preload hint\'s benefit is not a fixed constant, it is exactly "however long the parser would otherwise have been stuck".',
        'This is why preload matters most on pages with heavier CSS/JS before the LCP image in the DOM, and matters far less (or not at all) if the <code>&lt;img&gt;</code> tag already appears very early in the HTML with nothing blocking above it.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>preload beats a blocking resource for LCP</title>
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
      content: `const cacheBust = Date.now();

// Simulate: a <link rel="preload"> discovered immediately at the top of <head>
const preloadLink = document.createElement('link');
preloadLink.rel = 'preload';
preloadLink.as = 'image';
preloadLink.href = \`https://picsum.photos/id/237/60/60?bustA=\${cacheBust}\`;
document.head.appendChild(preloadLink);
console.log('preload link inserted at t=0 — fetch for image A starts now');

// Simulate a 300ms render-blocking stylesheet delaying when the HTML parser
// reaches the <img> tags at all
setTimeout(() => {
  console.log('simulated 300ms render-blocking resource just cleared — parser now reaches both <img> tags');

  const imgPreloaded = document.createElement('img');
  imgPreloaded.src = \`https://picsum.photos/id/237/60/60?bustA=\${cacheBust}\`; // already preloaded above

  const imgControl = document.createElement('img');
  imgControl.src = \`https://picsum.photos/id/1015/60/60?bustB=\${cacheBust}\`; // NOT preloaded — discovered only now

  document.body.appendChild(imgPreloaded);
  document.body.appendChild(imgControl);

  setTimeout(() => {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const preloadEntry = entries.find(e => e.name.includes(\`bustA=\${cacheBust}\`) && e.initiatorType === 'link');
    const controlEntry = entries.find(e => e.name.includes(\`bustB=\${cacheBust}\`));

    console.log('preloaded image fetchStart:', preloadEntry?.fetchStart.toFixed(1), 'ms');
    console.log('un-preloaded image fetchStart:', controlEntry?.fetchStart.toFixed(1), 'ms');
    console.log('gap (should be close to the 300ms simulated block):',
      controlEntry && preloadEntry ? (controlEntry.fetchStart - preloadEntry.fetchStart).toFixed(1) : '?', 'ms');
  }, 400);
}, 300);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A page has 400ms of render-blocking CSS in <code>&lt;head&gt;</code>, followed by the hero <code>&lt;img&gt;</code> tag. Adding <code>&lt;link rel="preload" as="image"&gt;</code> before the stylesheet changes LCP from 1.9s to 1.5s. Why is the improvement close to 400ms and not, say, 50ms or 2 seconds?',
    hint: 'Ask what the preload link actually skips past, and how long that specific thing takes.',
    solution: 'The preload benefit is bounded by exactly how long the blocking resource keeps the parser from reaching the image — here, 400ms of render-blocking CSS. Without preload, image discovery (and thus its fetch start) is delayed by that full 400ms. With preload, the fetch starts immediately, in parallel with the CSS download, so the image is roughly 400ms further along by the time the parser would have reached it anyway. The win cannot exceed the blocking delay, and it will not be much smaller than it either, since that delay is the entire reason discovery was late in the first place.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '<link rel="preload"> just makes the browser fetch things "sooner" in some vague, general sense — a nice-to-have optimisation with a small, roughly-fixed benefit.',
      reality: 'Preload has a precise, mechanical effect: it starts the fetch at parse time instead of at "whenever the parser is unblocked enough to reach the tag" — the size of the benefit is exactly equal to however long the parser was stuck, which the demo in this subtopic shows tracking a simulated 300ms block almost exactly.'
    },
    {
      thought: 'If a page has no blocking CSS or JS above the hero image at all, preload should still meaningfully help since it always front-loads a fetch.',
      reality: 'Preload has nothing to front-load past if the image tag is already the earliest thing the parser reaches — in that case the un-preloaded image\'s fetchStart is already close to the preloaded one\'s, and the win shrinks toward zero rather than staying fixed.'
    },
    {
      thought: 'Preload and fetchpriority="high" do the same job, so using just one of them is fine.',
      reality: 'They solve different problems — preload controls WHEN the fetch starts (discovery timing), fetchpriority controls how much bandwidth/priority it gets once started. A late-discovered but high-priority fetch still starts late; a preloaded but low-priority fetch starts early but can be starved of bandwidth by other requests. The LCP image needs both.'
    }
  ];
}
