import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-rel-noopener-genuinely-nulls-window-opener',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './rel-noopener-genuinely-nulls-window-opener.html',
  styleUrl: './rel-noopener-genuinely-nulls-window-opener.scss'
})
export class RelNoopenerGenuinelyNullsWindowOpenerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Without noopener, the new tab genuinely holds a live reference back',
      points: [
        'The main page is explicit about the mechanism: "The new tab gets a reference to the opener via <code>window.opener</code>," and "a malicious destination can call <code>window.opener.location = \'phishing-site.com\'</code>" — this is not a theoretical risk, it is a real, working JavaScript reference the opened page can use.',
        'This reference works even though the two pages can be on completely different origins — <code>window.opener</code> is one of the few cross-origin object references the platform grants by default, specifically because <code>target="_blank"</code> was never designed with this risk in mind.',
      ]
    },
    {
      heading: 'noopener is not just an <a> attribute — it is a real window-creation flag',
      points: [
        '<code>rel="noopener"</code> on an <code>&lt;a&gt;</code> is the common way to apply it, but the same behavior is available directly from JavaScript: <code>window.open(url, \'_blank\', \'noopener\')</code> — passing <code>noopener</code> as a window feature produces the exact same effect as the HTML attribute.',
        'The severed reference is genuinely null, not just inaccessible — the new window\'s own <code>window.opener</code> property reads back as <code>null</code> from ITS OWN script, not merely blocked from the original page\'s side. This is verifiable directly: the popup itself can check its own <code>window.opener</code> value.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>noopener genuinely nulls window.opener</title></head>
  <body>
    <p>Click each button — a same-origin popup opens and reports its OWN <code>window.opener</code> value back here via postMessage.</p>
    <button id="withoutNoopener">Open WITHOUT noopener</button>
    <button id="withNoopener">Open WITH noopener</button>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

// A tiny same-origin popup document. It checks its OWN window.opener and
// reports the result back to the page that opened it via postMessage —
// this is the popup's own perspective, not something the opener is guessing at.
const popupHtml = \`<!doctype html><html><body>
<script>
  window.opener?.postMessage(
    { hasOpener: window.opener !== null },
    '*'
  );
  document.write(window.opener !== null ? 'opener is SET' : 'opener is NULL');
<\\/script>
</body></html>\`;

function openPopup(features: string, label: string) {
  const blobUrl = URL.createObjectURL(new Blob([popupHtml], { type: 'text/html' }));
  window.open(blobUrl, '_blank', features);
  window.addEventListener('message', function handler(e) {
    if (typeof e.data?.hasOpener === 'boolean') {
      output.textContent += \`\${label}: popup's own window.opener !== null → \${e.data.hasOpener}\\n\`;
      window.removeEventListener('message', handler);
    }
  });
}

document.getElementById('withoutNoopener')!.addEventListener('click', () => {
  openPopup('', 'WITHOUT noopener');
});

document.getElementById('withNoopener')!.addEventListener('click', () => {
  openPopup('noopener', 'WITH noopener  ');
});
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The popup document above checks its OWN <code>window.opener</code> and reports the result back. Predict: when opened WITH the <code>noopener</code> feature, does <code>window.opener</code> inside the popup read as <code>null</code>, as <code>undefined</code>, or does it throw an error when accessed?',
    hint: 'The spec\'s intent is to make the new window behave as if it were opened completely independently — as if nothing had opened it at all.',
    solution: `It reads as null — accessing it never throws. A window opened with noopener behaves exactly as if
a user had typed the URL directly into a fresh tab: there simply is no opener relationship to report,
so the property resolves to the same null value it would have if there had been no window.open() call
involved in the first place. This is what makes noopener a genuine severance rather than merely hiding
an existing reference from one side.`
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>rel="noopener"</code> only prevents the OPENED page from being NAVIGATED by the original tab — the opened page can still read information from the opener.',
      reality: 'It severs the reference entirely. The opened page\'s own <code>window.opener</code> is <code>null</code> — there is no partial access left for it to read anything from the original tab through that channel.'
    },
    {
      thought: 'noopener is an HTML attribute only — you need an actual <code>&lt;a&gt;</code> tag to use it, there is no JavaScript equivalent.',
      reality: '<code>window.open(url, target, \'noopener\')</code> achieves the exact same effect from plain JavaScript, with no anchor element involved at all — noopener is fundamentally a window-creation flag, not an HTML-only concept.'
    },
    {
      thought: 'Modern browsers set noopener automatically for every <code>target="_blank"</code> link, so explicitly adding <code>rel="noopener"</code> is now pointless.',
      reality: 'The main page notes this is true for <em>most</em> modern browsers as a safety default, but explicitly adding it remains best practice for older-browser compatibility and for any non-anchor way of opening a window (like <code>window.open()</code>), which does not get this automatic protection.'
    },
  ];
}
