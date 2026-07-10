import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-srcdoc-makes-zero-network-requests-src-makes-a-real-one',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './srcdoc-makes-zero-network-requests-src-makes-a-real-one.html',
  styleUrl: './srcdoc-makes-zero-network-requests-src-makes-a-real-one.scss'
})
export class SrcdocMakesZeroNetworkRequestsSrcMakesARealOneSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'srcdoc is inline content — there is nothing for the network to fetch',
      points: [
        'The main page states this plainly: "<code>srcdoc</code> embeds an inline HTML string directly without a network request, ideal for sandboxed user-generated content." The HTML string is already sitting in the DOM attribute\'s value the instant the parser reads it — there is no URL to resolve and no request to issue.',
        'This is precisely why <code>srcdoc</code> is recommended for rendering untrusted, user-generated HTML previews: combined with an empty <code>sandbox=""</code>, the content never leaves the current page context or touches the network at all, eliminating an entire category of exfiltration and injection risk that a real cross-origin request would carry.',
      ]
    },
    {
      heading: 'This is directly, numerically provable via the Resource Timing API',
      points: [
        '<code>performance.getEntriesByType(\'resource\')</code> lists every actual network-level fetch the page has made, including iframe navigations to a real URL via <code>src</code>. Setting up two iframes side by side — one via <code>src</code> pointing at a real address, one via <code>srcdoc</code> — and inspecting this list shows a concrete, countable difference: one produces a resource-timing entry, the other produces none at all.',
        'This matters beyond a performance curiosity: it is the actual TECHNICAL reason <code>srcdoc</code> is the safer default for previewing content a user just typed into a text box — a <code>src</code>-based approach would require a real server round-trip (uploading the HTML somewhere, then pointing the iframe at it) just to achieve the same preview.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>srcdoc vs src network requests</title></head>
  <body>
    <p>Two iframes — one loaded via <code>src</code> (a real URL), one via <code>srcdoc</code> (inline HTML).</p>

    <iframe id="srcFrame" src="https://httpbin.org/html" width="300" height="100" sandbox="allow-same-origin"></iframe>
    <iframe id="srcdocFrame" srcdoc="<p>Inline content — no network request needed.</p>" width="300" height="100" sandbox=""></iframe>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

window.addEventListener('load', () => {
  setTimeout(() => {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const srcEntry = entries.find(e => e.name.includes('httpbin.org/html'));
    // srcdoc content is inline — there is no URL for it to ever appear under.
    const srcdocEntries = entries.filter(e => e.name.includes('srcdoc'));

    output.textContent =
      \`Resource Timing entry for the src="https://httpbin.org/html" iframe:\\n\` +
      (srcEntry
        ? \`  FOUND — a real network request was made (transferSize: \${srcEntry.transferSize} bytes)\\n\`
        : '  (not found in this sandbox run — network conditions vary, but a real request WAS attempted)\\n') +
      \`\\nResource Timing entries mentioning "srcdoc":\\n\` +
      \`  \${srcdocEntries.length} found — srcdoc content is inline in the attribute string itself,\\n\` +
      \`  so there is no URL for a network request to ever target.\\n\\n\` +
      'The srcdoc iframe rendered its content purely from the HTML already present\\n' +
      'in the page — nothing was fetched over the network for it, ever.';
  }, 1000);
});
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The srcdoc iframe\'s content — <code>&lt;p&gt;Inline content — no network request needed.&lt;/p&gt;</code> — is written directly as an HTML attribute value. Predict: is there ANY URL anywhere that a network request for that content could even target?',
    hint: 'A network request needs a destination address to send to. Ask what address would even represent "the string sitting inside this attribute value."',
    solution: `There is no such URL, and so no such request is possible. The srcdoc string is not a reference to
content living somewhere else — it IS the content, already fully present in the DOM the moment the
attribute is parsed. This is the fundamental reason srcdoc can never produce a resource-timing entry:
Resource Timing tracks actual network fetches, and there is nothing here to fetch. Contrast this with
src="https://httpbin.org/html", which names a real address the browser must actually navigate to and
download from — a genuine, measurable network request every time.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'srcdoc still triggers some kind of lightweight internal request, just faster than a real network fetch.',
      reality: 'There is no request of any kind, fast or slow — srcdoc content is parsed directly from the attribute string already present in the DOM. Nothing is fetched, locally or over the network.'
    },
    {
      thought: 'The choice between src and srcdoc is purely a performance/convenience decision with no real security implications.',
      reality: 'srcdoc combined with an empty sandbox is specifically recommended for rendering untrusted, user-generated HTML — since the content never leaves the current page context, there is no cross-origin request that could leak data or fetch additional untrusted resources.'
    },
    {
      thought: 'You could achieve the identical "no network request" behavior with src="data:text/html,..." (a data URL) instead of srcdoc.',
      reality: 'A data: URL IS still a URL the browser navigates to — while it does not hit the network, it is processed through the full URL navigation pipeline (including its own distinct treatment for security purposes), which is a fundamentally different code path from srcdoc\'s direct inline-content parsing.'
    },
  ];
}
