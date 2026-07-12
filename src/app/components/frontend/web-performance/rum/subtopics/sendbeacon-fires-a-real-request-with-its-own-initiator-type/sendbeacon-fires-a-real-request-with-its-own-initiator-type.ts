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
  templateUrl: './sendbeacon-fires-a-real-request-with-its-own-initiator-type.html',
  styleUrl: './sendbeacon-fires-a-real-request-with-its-own-initiator-type.scss'
})
export class SendbeaconFiresARealRequestWithItsOwnInitiatorTypeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'sendBeacon() is not a thin wrapper around fetch() — the browser treats it as a genuinely distinct kind of request',
      points: [
        'The main page\'s explanation is that <code>sendBeacon()</code> is guaranteed to complete even after the page is hidden, unlike <code>fetch()</code>, which browsers are free to cancel on unload. This is a real, browser-level guarantee, not a convention or a JavaScript-level trick.',
        'Confirmed directly: a call to <code>navigator.sendBeacon()</code> returns <code>true</code> (the browser accepted and queued it) and produces a genuine <code>PerformanceResourceTiming</code> entry — but with <code>initiatorType: "beacon"</code>, a value distinct from <code>"fetch"</code> or <code>"xmlhttprequest"</code>. The browser tracks it as its own dedicated request category.',
      ]
    },
    {
      heading: 'This distinct handling is exactly why it survives page unload when fetch() does not',
      points: [
        'Because the browser recognises beacon requests as a first-class category with a survival guarantee, it can specifically protect them during page teardown — deprioritising or cancelling ordinary in-flight fetches while still letting a queued beacon complete.',
        'This is the concrete mechanism behind the main page\'s "Sending metrics on beforeunload instead of visibilitychange" mistake: a plain <code>fetch()</code> call, even inside a <code>visibilitychange</code> handler, has no such protection — <code>sendBeacon()</code> is the API specifically designed and recognised by the browser for this exact use case.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>sendBeacon() fires a real request with its own initiator type</title>
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
      content: `const url = '/index.html?rumBeaconDemo=' + Date.now();
const payload = JSON.stringify({ metric: 'LCP', value: 1234 });

const queued = navigator.sendBeacon(url, payload);
console.log('navigator.sendBeacon() returned:', queued, '(true = the browser accepted and queued the request)');

setTimeout(() => {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const beaconEntry = entries.find((e) => e.name.includes('rumBeaconDemo'));

  if (beaconEntry) {
    console.log('a real network request was recorded for the beacon.');
    console.log('initiatorType:', JSON.stringify(beaconEntry.initiatorType), '— distinct from "fetch" or "xmlhttprequest".');
    console.log('transferSize:', beaconEntry.transferSize, 'bytes');
  } else {
    console.log('no resource-timing entry found — try re-running.');
  }
}, 500);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer argues that fetch(url, { keepalive: true }) is functionally identical to navigator.sendBeacon(url, data), so the codebase should standardise on fetch for consistency with the rest of the app\'s networking code. Is there a meaningful difference the main page\'s RUM guidance depends on?',
    hint: 'Ask whether the browser recognises fetch(..., { keepalive: true }) as the SAME dedicated, unload-survival-guaranteed request category sendBeacon() gets, confirmed by its own distinct initiatorType.',
    solution: 'keepalive: true on fetch() does provide some unload-survival behavior and is explicitly documented as the correct FALLBACK when sendBeacon() is unavailable — the main page\'s own code samples use exactly this fallback pattern. However, sendBeacon() remains the primary, purpose-built API: it is simpler (no need to configure keepalive or handle a Promise you cannot meaningfully await during unload), is the API browsers and analytics vendors document as the standard for this use case, and — confirmed in this subtopic\'s demo — produces a real, dedicated initiatorType: "beacon" resource-timing entry, showing the browser tracks it as a genuinely separate category from ordinary fetch requests. Standardising on sendBeacon() with a fetch(keepalive) fallback (as the main page\'s own examples do) is the more defensible choice, not purely a style preference.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'sendBeacon() is just a convenience wrapper that internally calls fetch() with some special unload-safe flag — functionally the same request under the hood.',
      reality: 'The browser treats it as a genuinely distinct request category — confirmed directly in this subtopic\'s demo via the real resource-timing entry\'s initiatorType being "beacon", not "fetch".'
    },
    {
      thought: 'A true return value from navigator.sendBeacon() means the analytics server successfully received the data.',
      reality: 'true only means the browser accepted the request into its queue for delivery — it says nothing about whether the request actually reached the server or whether the server processed it successfully, exactly like fire-and-forget UDP-style semantics.'
    },
    {
      thought: 'Since sendBeacon() is specifically designed for page-unload scenarios, it should ONLY be used in visibilitychange/pagehide handlers — using it at other times would be misusing the API.',
      reality: 'sendBeacon() works as a general-purpose, non-blocking POST mechanism at any point in a page\'s lifecycle, not only during unload — its unload-survival guarantee is simply the property that makes it the RIGHT choice for that specific scenario, not a restriction on when it can be called.'
    }
  ];
}
