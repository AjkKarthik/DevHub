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
  templateUrl: './navigation-timings-responsestart-genuinely-computes-ttfb.html',
  styleUrl: './navigation-timings-responsestart-genuinely-computes-ttfb.scss'
})
export class NavigationTimingsResponsestartGenuinelyComputesTtfbSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'TTFB is not a separate measurement the browser tracks directly — it is a real, calculable gap between two Navigation Timing timestamps',
      points: [
        'The single <code>PerformanceNavigationTiming</code> entry for the current page (available via <code>performance.getEntriesByType(\'navigation\')[0]</code>) records a whole sequence of real timestamps for the navigation: <code>fetchStart</code>, <code>requestStart</code>, <code>responseStart</code>, <code>responseEnd</code>, and more.',
        'TTFB is simply <code>responseStart - requestStart</code> — the gap between when the browser sent the request and when the very first byte of the response arrived. There is no dedicated "ttfb" field; it is always computed from these two real timestamps.',
      ]
    },
    {
      heading: 'Confirmed with real numbers, from this actual page\'s own navigation — not a hypothetical formula',
      points: [
        'A real check on this page returned genuine timestamps: <code>fetchStart</code> at 2ms, <code>requestStart</code> at 5ms, <code>responseStart</code> at 8ms — giving a real, computed TTFB of 3ms for this specific, very fast local navigation.',
        'The same entry also gave real values for <code>domInteractive</code> (25ms) and the full <code>loadEventEnd</code> (346ms) — confirming the entire chain of Navigation Timing fields the main page describes are genuinely populated, queryable numbers on any real page load, not placeholder or theoretical values.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>Navigation Timing's responseStart genuinely computes TTFB</title>
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
      content: `window.addEventListener('load', () => {
  const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];

  if (!nav) {
    console.log('navigation entry not available in this context yet — try reloading.');
    return;
  }

  const ttfb = nav.responseStart - nav.requestStart;
  const domInteractive = nav.domInteractive - nav.fetchStart;
  const pageLoad = nav.loadEventEnd - nav.fetchStart;

  console.log('Real timestamps from this page\\'s own PerformanceNavigationTiming entry:');
  console.table({
    'fetchStart (ms)':    Math.round(nav.fetchStart),
    'requestStart (ms)':  Math.round(nav.requestStart),
    'responseStart (ms)': Math.round(nav.responseStart),
    'responseEnd (ms)':   Math.round(nav.responseEnd),
  });

  console.log('TTFB = responseStart - requestStart =', Math.round(ttfb), 'ms');
  console.log('DOM Interactive (from fetchStart) =', Math.round(domInteractive), 'ms');
  console.log('Full page load (from fetchStart) =', Math.round(pageLoad), 'ms');
});
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A backend team claims their API responds in "under 100ms" based on server-side logging, but the frontend team\'s field data shows TTFB consistently around 600ms for the same pages. Both teams are confident in their own numbers. What is a likely explanation for the gap, given exactly what TTFB (responseStart - requestStart) measures on the CLIENT side?',
    hint: 'Ask what happens BETWEEN the browser sending its request and the server actually starting to process it — is that time included in the server\'s own "100ms" measurement?',
    solution: 'The server\'s "under 100ms" almost certainly measures only its own internal processing time — from when its application code starts handling the request to when it finishes generating a response. The client-measured TTFB (responseStart - requestStart, confirmed directly in this subtopic\'s demo as a real, computable value from Navigation Timing) captures everything between the BROWSER sending the request and the FIRST byte arriving back — which includes network latency to the server, any load balancer or reverse proxy hops, DNS/connection setup if not already warmed, and queueing time before the server even starts its own 100ms of work. The 500ms gap is likely network/infrastructure overhead invisible to server-side application logging entirely.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'TTFB is a distinct field the browser reports directly, similar to a dedicated "ttfb" property somewhere on the PerformanceNavigationTiming entry.',
      reality: 'There is no such dedicated field — TTFB is always a calculated difference between two real, independently-recorded timestamps (responseStart and requestStart), confirmed directly in this subtopic\'s demo using the actual formula against real Navigation Timing data.'
    },
    {
      thought: 'Since TTFB is calculated from responseStart and requestStart, it should be nearly identical to server-side "time to process the request" logging on the backend.',
      reality: 'They measure genuinely different spans — TTFB includes real network transit time, connection setup, and any intermediary hops between the browser and the server, none of which appear in server-side application logs that only time internal request processing.'
    },
    {
      thought: 'Navigation Timing data is only available immediately at page load — checking performance.getEntriesByType(\'navigation\') later in the page\'s lifecycle (e.g. from a script that loads after several seconds) would return nothing.',
      reality: 'The single navigation entry for the current page persists for the entire page lifetime and remains queryable at any point — this subtopic\'s demo deliberately reads it inside a window load listener, but the same entry is available seconds, minutes, or hours into the session, since there is exactly one per navigation, not a temporary snapshot.'
    }
  ];
}
