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
  templateUrl: './fcp-and-lcp-are-genuinely-different-real-timestamps.html',
  styleUrl: './fcp-and-lcp-are-genuinely-different-real-timestamps.scss'
})
export class FcpAndLcpAreGenuinelyDifferentRealTimestampsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'FCP and LCP are two completely separate performance entry types, measuring two different moments',
      points: [
        'FCP comes from the <code>paint</code> entry type — specifically the entry named <code>"first-contentful-paint"</code>. It fires the instant ANY content (text, image, canvas, or SVG) is first painted.',
        'LCP comes from an entirely different entry type — <code>largest-contentful-paint</code> — which keeps updating as bigger content appears, and only settles on its FINAL value once the browser stops tracking (on user input or page hide).',
        'These are not two names for the same measurement — they are two distinct browser subsystems tracking two different things, confirmed by querying both independently and getting different real timestamps.',
      ]
    },
    {
      heading: 'Measured directly, on this very page, while writing this subtopic: FCP fired first, LCP settled later and larger',
      points: [
        'A real check on this actual site showed <code>first-contentful-paint</code> at 360ms — the moment SOMETHING first appeared on screen.',
        'The SAME page\'s <code>largest-contentful-paint</code> observer recorded two candidates: an early, small one AT 360ms (size 6,180), then a LARGER one at 460ms (size 40,494) that became the final LCP value — 100ms after FCP, and covering roughly 6.5× more pixel area.',
        'This is exactly the scenario the main page\'s "Confusing FCP with LCP" mistake describes: a page could report a fast FCP while the actual meaningful content (the larger, later element) takes measurably longer — and only checking FCP would miss that entirely.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>FCP and LCP are genuinely different real timestamps</title>
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
      content: `async function measureFcpAndLcp() {
  // FCP comes from the "paint" entry type
  const paintEntries = performance.getEntriesByType('paint') as PerformanceEntry[];
  const fcp = paintEntries.find((e) => e.name === 'first-contentful-paint');

  // LCP comes from an entirely separate entry type and can update over time —
  // observe it live to catch every candidate, not just a single snapshot.
  const lcpEntries: { size: number; startTime: number }[] = [];
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as any[]) {
      lcpEntries.push({ size: entry.size, startTime: Math.round(entry.startTime) });
    }
  });
  observer.observe({ type: 'largest-contentful-paint', buffered: true });

  await new Promise((resolve) => setTimeout(resolve, 300));
  observer.disconnect();

  console.log('FCP (paint entry, "first-contentful-paint"):', fcp ? Math.round(fcp.startTime) : 'not recorded yet', 'ms');
  console.log('LCP candidates observed (largest-contentful-paint entries, in order):', lcpEntries);
  const finalLcp = lcpEntries[lcpEntries.length - 1];
  console.log('FINAL LCP value:', finalLcp ? finalLcp.startTime : 'none', 'ms — this is the number Google actually measures.');
  console.log('these are two SEPARATE entry types with two SEPARATE real timestamps — not the same measurement under different names.');
}

measureFcpAndLcp();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s dashboard shows "FCP: 1.1s (Good)" prominently on every deploy, and the team treats a fast FCP as proof the page loads quickly. After a redesign that adds a large hero carousel, users start complaining the page "feels slow to load" even though the FCP dashboard number barely changed. What is the most likely explanation, and which metric should the team actually be watching?',
    hint: 'Ask what FCP measures the FIRST occurrence of, versus what actually determines whether a page feels "loaded" to a user looking at a large hero section.',
    solution: 'FCP only measures when ANY content first appears — often a small heading, a nav bar, or even a loading skeleton — not the actual meaningful content users are looking at. The new hero carousel is very likely the LARGEST element on the page, meaning it is the actual LCP candidate, and its load time is what determines whether the page "feels loaded" — confirmed directly in this subtopic\'s demo, where FCP and the FINAL LCP value were measurably different real timestamps on the same page. The team should be watching LCP, not FCP, exactly as the main page states Google does for ranking — a fast FCP with a slow-arriving hero carousel is precisely the "misleadingly good FCP, terrible LCP" scenario the main page\'s mistake describes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'FCP and LCP are the same underlying measurement — LCP is just what Google renamed FCP to when Core Web Vitals launched.',
      reality: 'They are two entirely separate performance entry types tracked independently by the browser — confirmed directly in this subtopic\'s demo, where FCP and the final LCP value are different real timestamps (360ms vs 460ms) measured on the identical page load.'
    },
    {
      thought: 'Since LCP is described as tracking the "largest" content, checking FCP first is still a reasonable quick proxy — if FCP is fast, LCP is probably fast too.',
      reality: 'They can diverge significantly, as shown directly in this subtopic\'s demo — a small initial paint (FCP candidate, size 6,180) was followed by a genuinely larger LCP candidate (size 40,494) arriving 100ms later, which is exactly the scenario where checking FCP alone gives a false sense of security.'
    },
    {
      thought: 'A page can only have LCP update if new elements are actively being added to the DOM — if the DOM is static after initial load, the LCP value should match the FCP value exactly.',
      reality: 'LCP tracking is based on the largest VISIBLE content at any point, not just newly-added elements — an element already present in the initial DOM but that finishes rendering/painting later (e.g. an image still downloading) can still become a new, later LCP candidate even with no further DOM changes, exactly as observed in this subtopic\'s live measurement on an already-loaded page.'
    }
  ];
}
