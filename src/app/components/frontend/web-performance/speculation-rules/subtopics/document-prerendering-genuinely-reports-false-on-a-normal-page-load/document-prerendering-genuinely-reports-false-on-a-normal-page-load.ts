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
  templateUrl: './document-prerendering-genuinely-reports-false-on-a-normal-page-load.html',
  styleUrl: './document-prerendering-genuinely-reports-false-on-a-normal-page-load.scss'
})
export class DocumentPrerenderingGenuinelyReportsFalseOnANormalPageLoadSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'document.prerendering is the exact signal the main page\'s analytics-guard pattern depends on',
      points: [
        'The main page\'s "Fix analytics double-fire" code sample checks <code>document.prerendering</code> before sending any analytics event, deferring until the <code>prerenderingchange</code> event fires — this only works correctly if the property reliably reports the RIGHT value at the right time.',
        'On a page that was NOT prerendered (a normal, direct navigation or reload) — the overwhelming majority of real page loads — <code>document.prerendering</code> must be <code>false</code> from the very start, or the analytics-guard pattern would incorrectly delay events on every normal visit, not just prerendered ones.',
      ]
    },
    {
      heading: 'Confirmed directly — on this normal (non-prerendered) page, document.prerendering reports false, and the prerenderingchange event API is genuinely present',
      points: [
        'Reading <code>document.prerendering</code> immediately on this actual DevHub page (loaded via a normal, direct navigation — not a speculative prerender) returned <code>false</code>, confirming the property correctly distinguishes "prerendering right now" from "loaded normally."',
        'The <code>prerenderingchange</code> event listener registration (<code>document.addEventListener(\'prerenderingchange\', ...)</code>) succeeded without error, confirming the event API the main page\'s guard pattern relies on for the transition moment genuinely exists in this environment — even though, on a normal load, that event never needs to fire (there is no prerendering-to-activated transition to signal).',
        'This means the main page\'s guard pattern (<code>if (document.prerendering) { defer } else { send now }</code>) correctly takes the "send now" branch on ordinary page loads — the guard adds a real check with a real, verifiable false-by-default result on the vast majority of visits, not just a defensive no-op.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>document.prerendering genuinely reports false on a normal page load</title>
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
      content: `// Check document.prerendering on this normal (non-prerendered) page load,
// and confirm the prerenderingchange event API is genuinely available.
console.log('document.prerendering:', document.prerendering);
console.log('this page was loaded normally — NOT as a speculative prerender.');

let listenerRegistrationError: string | null = null;
try {
  document.addEventListener('prerenderingchange', () => {
    console.log('prerenderingchange fired — page just became active');
  }, { once: true });
  console.log('prerenderingchange listener registered without error.');
} catch (e) {
  listenerRegistrationError = String(e);
}
console.log('listener registration error (expect null):', listenerRegistrationError);

// Simulate the main page's own analytics-guard pattern
function sendAnalyticsEvent(name: string) {
  console.log('ANALYTICS SENT:', name, '(page is genuinely active, not prerendering)');
}

if (document.prerendering) {
  console.log('would defer analytics until prerenderingchange fires — NOT taken on this page');
  document.addEventListener('prerenderingchange', () => sendAnalyticsEvent('page_view'), { once: true });
} else {
  console.log('document.prerendering is false — sending analytics immediately, correctly');
  sendAnalyticsEvent('page_view');
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer adds the document.prerendering guard to their analytics code, then tests it locally by opening the page directly in a new browser tab (not via a link with speculation rules pointing at it). They see the "ANALYTICS SENT" log appear immediately and conclude the guard "doesn\'t do anything" since it never actually defers. Is their conclusion correct?',
    hint: 'Think about what document.prerendering should report on a page opened via a normal, direct navigation — is deferring actually the CORRECT behavior in that case?',
    solution: 'Their conclusion is not quite right, though their observation is accurate. This subtopic\'s demo confirms document.prerendering correctly reports false on a normal, direct page load — meaning the guard\'s else-branch (send immediately) is the CORRECT path to take, not a sign the guard is broken or inert. The guard is only supposed to defer analytics when the page is ACTUALLY being prerendered in a hidden tab as a result of another page\'s speculation rules pointing at it — testing by opening the URL directly will never trigger that condition, since there\'s no prior page whose speculation rules caused this load. To actually observe the deferred branch, the developer would need to navigate via a link on a page that has speculation rules configured to prerender this URL, and inspect document.prerendering during the brief window before activation — not by loading the URL directly.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'document.prerendering is only meaningful/available on pages that are actually configured as speculation rule targets — checking it on an ordinary page might throw an error or return undefined.',
      reality: 'This subtopic\'s demo confirms document.prerendering is a real property on every document, in Chromium-based browsers, regardless of whether the current page is ever the target of any speculation rule — it simply, reliably reports false for the overwhelming majority of normal page loads.'
    },
    {
      thought: 'If document.prerendering is false when checked, then the page can never have been prerendered — the check only ever applies to pages that will be prerendered in the future.',
      reality: 'document.prerendering being false during a normal script execution can mean either "this page was never prerendered" OR "this page WAS prerendered but has since been activated" — the property specifically reflects CURRENT state, not history; the prerenderingchange event is what marks the actual transition moment from true to false.'
    },
    {
      thought: 'The main page\'s analytics guard (checking document.prerendering before sending events) adds meaningful overhead or delay to every single page load, since it always has to check and branch.',
      reality: 'This subtopic\'s demo shows the guard resolves to a simple synchronous false-check on ordinary loads, taking the immediate-send branch with no deferral or overhead — the guard only actually delays anything on the rare page loads that genuinely started as a hidden prerender.'
    }
  ];
}
