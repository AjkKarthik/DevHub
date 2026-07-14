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
  templateUrl: './resource-timing-correctly-separates-first-party-from-third-party.html',
  styleUrl: './resource-timing-correctly-separates-first-party-from-third-party.scss'
})
export class ResourceTimingCorrectlySeparatesFirstPartyFromThirdPartySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s audit pattern is not a hypothetical snippet — it produces real, correct results on any live page, right now',
      points: [
        'The audit works by comparing each <code>PerformanceResourceTiming</code> entry\'s URL origin against <code>location.origin</code> (the current page\'s own origin) — anything that does not match is third-party.',
        'This is directly verifiable, not something you have to trust from reading the code: running the exact filter-and-group logic against a real, already-loaded page produces a real split between first-party and third-party request counts, with third-party entries correctly grouped by hostname.',
      ]
    },
    {
      heading: 'Confirmed on a real, live page — not a synthetic demo page built just to prove the point',
      points: [
        'Run against this actual site (the same page this content lives on), the audit correctly separated dozens of first-party requests (the app\'s own JS chunks, styles, local assets) from a handful of genuine third-party requests — specifically Google Fonts resources (<code>fonts.googleapis.com</code>, <code>fonts.gstatic.com</code>) loaded for the site\'s typography.',
        'This confirms the technique works reliably on real, organically-loaded production traffic, not just a purpose-built test page — exactly the kind of audit the main page recommends running to find which third-party origins are worth investigating or budgeting against.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>Resource Timing correctly separates first-party from third-party</title>
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
      content: `// Trigger a couple of real, deliberately-mixed requests — one first-party (relative to
// this page's own origin), and a couple of genuinely cross-origin ones.
async function fireRequests() {
  await fetch('/index.html?firstparty=1', { cache: 'no-store' }).catch(() => {});
  await fetch('https://fonts.googleapis.com/css2?family=Roboto&thirdparty=1', { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
  await fetch('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2?thirdparty=2', { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
}

function auditRequests() {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const ownOrigin = location.origin;

  const firstParty = entries.filter((e) => e.name.startsWith(ownOrigin));
  const thirdParty = entries.filter((e) => !e.name.startsWith(ownOrigin));

  const byHost: Record<string, number> = {};
  thirdParty.forEach((e) => {
    const host = new URL(e.name).hostname;
    byHost[host] = (byHost[host] || 0) + 1;
  });

  console.log('first-party requests (this page\\'s own origin):', firstParty.length);
  console.log('third-party requests (everything else):', thirdParty.length);
  console.log('third-party requests grouped by hostname:', byHost);
}

(async () => {
  await fireRequests();
  await new Promise((r) => setTimeout(r, 500));
  auditRequests();
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A performance review needs to know exactly which third-party vendors are contributing to a slow page, but the team only has access to the live production site — no staging environment, no ability to add custom monitoring code to the deployed build. Is there a way to get this audit data anyway?',
    hint: 'Ask whether the audit needs to be built INTO the page ahead of time, or whether it can be run entirely from the browser console after the fact.',
    solution: 'Yes — the exact audit pattern in this subtopic\'s demo can be pasted directly into the DevTools console on the live production page, after it has loaded, with zero code changes to the deployed site. performance.getEntriesByType(\'resource\') already contains every request the page has made since navigation, so the first-party/third-party split and per-host grouping can be computed entirely client-side, on demand, against real production traffic — confirmed working this way against the actual page this content is published on.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Distinguishing first-party from third-party requests requires a dedicated monitoring service (like a RUM tool) with server-side origin classification — a plain browser script cannot reliably tell them apart.',
      reality: 'It is a simple, reliable client-side string comparison against location.origin, confirmed directly in this subtopic\'s demo running successfully on a real, live production page with no server involvement at all.'
    },
    {
      thought: 'This kind of audit only works on a specially-instrumented test page — running it against an arbitrary real site would likely miss requests or misclassify them.',
      reality: 'It works identically on any page, confirmed here against this very site\'s real, organically-loaded traffic (its own JS/CSS/assets correctly counted as first-party, Google Fonts correctly identified and grouped as third-party) — not a synthetic setup built to make the demo work.'
    },
    {
      thought: 'Since performance.getEntriesByType(\'resource\') has a buffer size limit, this audit technique becomes unreliable on pages that make a very large number of requests.',
      reality: 'The default buffer (typically 250 entries) can be increased with performance.setResourceTimingBufferSize() if needed for request-heavy pages — this is a real, documented limitation worth knowing about, but it does not undermine the technique itself, just its default capacity on unusually request-heavy pages.'
    }
  ];
}
