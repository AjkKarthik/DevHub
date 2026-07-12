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
  templateUrl: './nexthopprotocol-reveals-the-real-http-version-per-resource.html',
  styleUrl: './nexthopprotocol-reveals-the-real-http-version-per-resource.scss'
})
export class NexthopprotocolRevealsTheRealHttpVersionPerResourceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Every resource-timing entry reports the ACTUAL protocol used for that specific request — different resources on the same page can use different protocols',
      points: [
        '<code>PerformanceResourceTiming.nextHopProtocol</code> reports the real protocol negotiated for that exact request: <code>"h2"</code>, <code>"h3"</code>, or <code>"http/1.1"</code> — not a page-wide setting, a per-resource fact.',
        'This is not a hypothetical — checking it on this very site while writing this page showed the local dev server itself responding over <code>http/1.1</code>, while Google Fonts CSS and font files loaded on the same page reported real <code>h2</code> and <code>h3</code> entries, because they are served by a completely different, separately-configured origin (Google\'s CDN).',
        'A single page can genuinely be a mix of protocol versions — the browser negotiates each origin\'s protocol independently based on what that specific server supports.',
      ]
    },
    {
      heading: 'This is the actual, programmatic version of the DevTools "Protocol" column',
      points: [
        'The main page\'s "Verifying HTTP version" theory mentions enabling the Protocol column in DevTools Network panel — <code>nextHopProtocol</code> is the exact same underlying data, just accessible from JavaScript instead of the UI.',
        'This makes it possible to build real, automated protocol auditing: log every resource whose <code>nextHopProtocol === \'http/1.1\'</code> in production RUM data to find origins that still need an HTTP/2 (or HTTP/3) upgrade, without manually inspecting DevTools on every page.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>nextHopProtocol reveals the real HTTP version per resource</title>
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
      content: `// Fetch a couple of real, publicly-hosted resources and check the
// ACTUAL protocol the browser negotiated for each one.
async function checkProtocol(url: string, label: string) {
  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store' });
  } catch {
    // no-cors fetches can still register a resource-timing entry even if the
    // response itself is opaque to JS
  }
  await new Promise(r => setTimeout(r, 300));
  const entry = performance
    .getEntriesByType('resource')
    .reverse()
    .find((e) => e.name === url) as PerformanceResourceTiming | undefined;
  console.log(label, '→ nextHopProtocol:', entry ? JSON.stringify(entry.nextHopProtocol) : '(no entry yet)');
}

(async () => {
  console.log('Checking the real negotiated protocol for a few different origins...');
  await checkProtocol('https://fonts.googleapis.com/css2?family=Roboto&check=' + Date.now(), 'Google Fonts CSS (fonts.googleapis.com)');
  await checkProtocol('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2?check=' + Date.now(), 'Google Fonts file (fonts.gstatic.com)');
  console.log('Different origins can genuinely use different protocols on the exact same page — this is per-resource, not page-wide.');
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A performance report shows a page\'s overall Lighthouse score is good, but the team wants to know if any THIRD-PARTY resources (ads, analytics, widgets) are still being served over the older HTTP/1.1, since those often lag behind in protocol upgrades compared to the site\'s own CDN. Manually checking the DevTools Protocol column for dozens of pages across a large site is impractical. What is a better approach?',
    hint: 'Ask whether the protocol information used to fill the DevTools column is also available programmatically, and whether it could be logged automatically for every page visit.',
    solution: 'Use PerformanceObserver with type "resource" (or a batch getEntriesByType(\'resource\') call) and check each entry\'s nextHopProtocol field, exactly the same data DevTools displays in its Protocol column. Log any entry with nextHopProtocol === \'http/1.1\' to your analytics/RUM pipeline alongside its hostname. Aggregating this across real user visits reveals exactly which third-party origins have not upgraded, without needing to manually inspect DevTools on every page — the same technique the main page recommends for detecting render-blocking resources applies here.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A page either "is HTTP/2" or "is HTTP/1.1" as a single, page-wide fact — like a version number for the whole site.',
      reality: 'Protocol negotiation happens PER ORIGIN, not per page — this subtopic\'s demo (and a real check on this very site) shows the local server responding over http/1.1 while a Google Fonts resource on the same page reports h2 or h3, since each origin\'s server is configured independently.'
    },
    {
      thought: 'Checking which protocol a resource used requires opening DevTools manually — there is no way to get this information from application code.',
      reality: 'nextHopProtocol on the standard PerformanceResourceTiming entry exposes exactly this, programmatically, in any script — DevTools\' own Protocol column reads the same underlying browser data this API exposes.'
    },
    {
      thought: 'If a request uses mode: "no-cors" (as this subtopic\'s demo does for cross-origin resources), the browser withholds resource-timing information as a privacy measure, the same way it hides response bodies.',
      reality: 'Timing information (including nextHopProtocol) is still exposed for cross-origin no-cors requests as of the Resource Timing spec\'s current visibility rules — only more sensitive body/header details are restricted, not basic timing and protocol data.'
    }
  ];
}
