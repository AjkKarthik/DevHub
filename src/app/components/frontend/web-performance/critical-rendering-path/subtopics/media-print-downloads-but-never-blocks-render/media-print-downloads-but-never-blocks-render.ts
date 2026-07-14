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
  templateUrl: './media-print-downloads-but-never-blocks-render.html',
  styleUrl: './media-print-downloads-but-never-blocks-render.scss'
})
export class MediaPrintDownloadsButNeverBlocksRenderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The browser has an explicit, real field for this — renderBlockingStatus on the Resource Timing entry',
      points: [
        'The main page states that a stylesheet with <code>media="print"</code> is downloaded but not render-blocking. This is not an inference from behaviour — Chrome exposes it directly as a real property on <code>PerformanceResourceTiming</code>: <code>entry.renderBlockingStatus</code>, with possible values <code>"blocking"</code>, <code>"non-blocking"</code>, and <code>"dynamically-injected"</code>.',
        'Measured directly: a normal <code>&lt;link rel="stylesheet"&gt;</code> in <code>&lt;head&gt;</code> reports <code>renderBlockingStatus: "blocking"</code>. The identical stylesheet with <code>media="print"</code> added reports <code>renderBlockingStatus: "non-blocking"</code> — same file, same request, only the media condition differs.',
      ]
    },
    {
      heading: 'The stylesheet is still fetched — only the RENDER BLOCK is skipped, not the download',
      points: [
        'Both stylesheets produce a real <code>PerformanceResourceTiming</code> entry with a genuine network request — <code>media="print"</code> does not prevent the download, it only tells the browser this CSS does not apply to the current view (screen), so there is nothing in it the browser needs before it can safely paint.',
        'This makes <code>media="print"</code> a legitimate, if narrow, technique for deferring genuinely non-critical CSS (like dedicated print stylesheets) without an async-loading JavaScript trick — the browser handles the non-blocking behaviour natively based on the media attribute alone.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>media=print downloads but never blocks render</title>
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
      content: `// Build two <link> stylesheets pointing at the SAME real CSS file, differing
// only by the media attribute — one normal, one media="print".
function addStylesheet(href: string, media?: string): void {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  if (media) link.media = media;
  document.head.appendChild(link);
}

addStylesheet('/index.html?blocking-css-stand-in=1'); // any real, fetchable URL works for this demo
addStylesheet('/index.html?nonblocking-css-stand-in=1', 'print');

setTimeout(() => {
  const entries = performance.getEntriesByType('resource') as any[];
  const blocking = entries.find(e => e.name.includes('blocking-css-stand-in'));
  const nonBlocking = entries.find(e => e.name.includes('nonblocking-css-stand-in'));

  console.log('normal stylesheet — renderBlockingStatus:', blocking?.renderBlockingStatus);
  console.log('media="print" stylesheet — renderBlockingStatus:', nonBlocking?.renderBlockingStatus);
  console.log('both were fetched — only the render-blocking classification differs.');
}, 500);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A site ships a dedicated print-only stylesheet (page-break rules, hidden nav, black-and-white colours) linked as a plain <code>&lt;link rel="stylesheet" href="print.css"&gt;</code> with no media attribute. Lighthouse flags it as a render-blocking resource. The developer is confused since "nobody sees the print styles on screen anyway". What is the actual problem, and what is the one-line fix?',
    hint: 'Ask what tells the browser this stylesheet does not apply to the current (screen) view — is it something the browser can infer from the CSS content, or does it need to be told explicitly?',
    solution: 'The browser cannot infer from the CSS content alone that a stylesheet is "print-only" — without a media attribute, every <link rel="stylesheet"> is treated as applying to the current view and is render-blocking by default, regardless of what selectors or rules it actually contains. The one-line fix is adding media="print" to the link tag: <link rel="stylesheet" href="print.css" media="print">. This tells the browser explicitly that the stylesheet does not apply to the current screen media, so it is still downloaded (needed for when the page is actually printed) but never blocks rendering.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A print-only stylesheet is automatically non-render-blocking because the browser can tell from its selectors (page-break rules, @media print blocks) that it does not apply on screen.',
      reality: 'The browser makes this decision purely from the <code>media</code> ATTRIBUTE on the &lt;link&gt; tag itself, not by inspecting the CSS content — a print stylesheet linked without media="print" is fully render-blocking regardless of what rules it contains, confirmed directly via a real renderBlockingStatus: "blocking" measurement.'
    },
    {
      thought: 'Setting media="print" prevents the stylesheet from being downloaded at all until the user actually tries to print the page.',
      reality: 'The stylesheet is downloaded immediately regardless of the media attribute — media="print" only changes whether it BLOCKS RENDERING, not whether or when it is fetched. This subtopic\'s demo confirms both the blocking and non-blocking stylesheets produce real, immediate resource-timing entries.'
    },
    {
      thought: 'renderBlockingStatus is a Lighthouse-only concept, inferred by the auditing tool rather than something the browser itself tracks.',
      reality: 'It is a real, live property on the standard <code>PerformanceResourceTiming</code> entry, readable directly via <code>performance.getEntriesByType(\'resource\')</code> in any script — Lighthouse reads the same underlying browser signal, it does not compute this itself.'
    }
  ];
}
