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
  templateUrl: './missing-as-silently-does-nothing-not-a-double-fetch.html',
  styleUrl: './missing-as-silently-does-nothing-not-a-double-fetch.scss'
})
export class MissingAsSilentlyDoesNothingNotADoubleFetchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Not every broken preload fails the same way — a missing as= is a genuinely DIFFERENT failure mode from the previous two subtopics',
      points: [
        'The previous two subtopics (missing crossorigin, mismatched URL) both produced a real DOUBLE-fetch — two separate network requests for the same resource, because the preload and its consumer used incompatible request signatures.',
        'A preload with NO <code>as=</code> attribute at all behaves differently: without it, the browser cannot determine what kind of resource this is (and therefore cannot even validate the preload as well-formed) — modern Chrome treats it as invalid and simply does not fetch it at all.',
        'Confirmed directly: <code>&lt;link rel="preload" href="..."&gt;</code> with no <code>as=</code>, followed by an <code>&lt;img src="..."&gt;</code> for the same URL, produces exactly ONE resource-timing entry — from the <code>&lt;img&gt;</code> tag alone. The preload link itself never appears as a separate request at all.',
      ]
    },
    {
      heading: 'The practical consequence is the same wasted <link> tag — but understanding the mechanism matters for debugging',
      points: [
        'Either way — double-fetch or silent no-op — the end result is the same wasted effort: you wrote a preload hint and got none of its benefit. But if you are debugging by counting network requests, a missing as= will NOT show up as an obvious "two requests for one resource" red flag the way a URL or crossorigin mismatch does.',
        'The most reliable way to catch a missing as= is Chrome\'s own DevTools Console warning ("The resource ... was preloaded ... but not used") or simply reviewing the HTML for every <code>rel="preload"</code> link and confirming <code>as=</code> is present — not relying on the Network tab request count alone.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>missing as= silently does nothing, not a double-fetch</title>
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
      content: `function testCase(label: string, headHtml: string, bodyHtml: string): Promise<any[]> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:1px;height:1px;';
    iframe.srcdoc = \`<!doctype html><html><head>\${headHtml}</head><body>\${bodyHtml}</body></html>\`;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        const entries = (iframe.contentWindow as any).performance
          .getEntriesByType('resource')
          .filter((e: any) => e.name.includes('demo-noas'))
          .map((e: any) => ({ initiatorType: e.initiatorType }));
        document.body.removeChild(iframe);
        resolve(entries);
      }, 400);
    };
  });
}

(async () => {
  const noAs = await testCase('preload with NO as=',
    '<link rel="preload" href="/index.html?demo-noas=1">',
    '<img src="/index.html?demo-noas=1">');

  console.log('preload with NO as= attribute — real network requests for this URL:', noAs.length, noAs);
  console.log('only the <img> tag\\'s own request exists — the preload itself never fetched anything at all.');
  console.log('(compare this to the previous two subtopics, where a mismatch produced TWO requests, not one)');
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer is debugging a slow LCP image and checks the Network tab, expecting to see two requests (a wasted preload plus the real fetch) if the preload is misconfigured — the same pattern they learned from a URL-mismatch bug last month. They see only ONE request for the hero image and conclude the preload must be working correctly. Is that conclusion safe?',
    hint: 'Ask whether every kind of broken preload produces the same "two requests" signature, or whether some failure modes look identical to "no preload at all".',
    solution: 'The conclusion is not safe — a missing as= attribute produces exactly ONE request too, but for the wrong reason: the preload was never fetched at all, so there is nothing to double up against. The single request seen is just the normal, non-accelerated fetch happening at its default priority, identical to what would happen with no preload hint whatsoever. The developer needs to explicitly check that as= is present on the preload link, or watch for Chrome\'s "was preloaded... but not used" console warning — request COUNT alone cannot distinguish "preload worked" from "preload was silently invalid" in this specific failure mode.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'All broken/misconfigured preloads fail the same observable way — extra network requests you can spot by counting entries in the Network tab.',
      reality: 'A missing as= fails completely differently — confirmed in this subtopic\'s demo, it produces exactly ONE request, identical in count to a correctly working preload, making request-counting alone an unreliable way to catch this specific mistake.'
    },
    {
      thought: 'Since a missing as= does not cause a double-fetch, it is a relatively harmless mistake compared to a crossorigin or URL mismatch.',
      reality: 'It is equally harmful to page performance — the resource still is NOT preloaded, so the LCP/render benefit is fully lost either way. The difference is purely in how the failure PRESENTS during debugging, not in its actual performance impact.'
    },
    {
      thought: 'This subtopic contradicts the general rule "always add as= to preload links" — if it just silently does nothing rather than actively breaking anything, maybe it is optional in practice.',
      reality: 'as= should still always be included — a silently-ignored preload is exactly as bad as a broken one, since the entire point of writing the hint was to get an early, high-priority fetch, which never happens either way. "Fails safely" is not the same as "fine to skip".'
    }
  ];
}
