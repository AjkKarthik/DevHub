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
  templateUrl: './currentsrc-reveals-which-srcset-candidate-was-picked.html',
  styleUrl: './currentsrc-reveals-which-srcset-candidate-was-picked.scss'
})
export class CurrentsrcRevealsWhichSrcsetCandidateWasPickedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'With srcset, the src attribute is only a fallback — the browser autonomously picks which actual candidate to download and display',
      points: [
        'Once <code>srcset</code> is present, the browser evaluates every listed candidate against the current viewport width, the <code>sizes</code> hint, and the device\'s pixel density — and loads whichever ONE candidate it decides is the best fit, which is not necessarily the one written first, last, or matching the plain <code>src</code> fallback.',
        'This decision genuinely happens inside the browser\'s own resource-selection algorithm — there\'s no way for page JavaScript to observe it in ADVANCE, only to read the result afterward.',
      ]
    },
    {
      heading: 'img.currentSrc is the standard, spec-defined way to read back which candidate the browser actually chose',
      points: [
        'Unlike <code>img.src</code> (which always reflects the literal <code>src</code> ATTRIBUTE, unaffected by srcset), <code>img.currentSrc</code> reflects the actual URL currently being displayed — it updates automatically as the browser makes and revises its selection (e.g. after a viewport resize, if a different candidate becomes the better fit).',
        'Reading <code>currentSrc</code> is the only reliable way to verify from script which candidate was chosen — inspecting the <code>srcset</code> attribute string alone only shows what candidates were OFFERED, not which one WON.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>currentSrc reveals the chosen srcset candidate</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <!-- Three distinct 1x1 data URIs (red/green/blue) stand in for
         differently-sized real image files, each tagged with a width
         descriptor — self-contained, no network request needed. -->
    <img
      id="responsiveImg"
      src="data:image/gif;base64,R0lGODlhAQABAIAAAP8AAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
      srcset="
        data:image/gif;base64,R0lGODlhAQABAIAAAP8AAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw== 100w,
        data:image/gif;base64,R0lGODlhAQABAIAAAP//AAD///8AACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw== 400w,
        data:image/gif;base64,R0lGODlhAQABAIAAAAD/AP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw== 1200w
      "
      sizes="50vw"
      alt="responsive test image"
      width="100"
    />
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const img = document.querySelector<HTMLImageElement>('#responsiveImg')!;

function report() {
  console.log('img.src (the plain fallback attribute, never changes):', img.src);
  console.log('img.currentSrc (the ACTUAL candidate the browser chose):', img.currentSrc);
  console.log('did the browser pick something other than the plain src fallback?', img.currentSrc !== img.src);
}

if (img.complete) {
  report();
} else {
  img.addEventListener('load', report, { once: true });
}
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An <code>&lt;img&gt;</code> has <code>src="small.jpg"</code> and a <code>srcset</code> listing three larger candidates. After the image loads, does <code>img.src</code> still read <code>"small.jpg"</code>, even if the browser actually displayed a larger candidate?',
    hint: 'Ask which of the two properties (src vs currentSrc) reflects the literal HTML attribute, and which one reflects the browser\'s actual runtime decision.',
    solution: 'Yes — img.src always reflects the plain src ATTRIBUTE verbatim, regardless of what srcset selection happened. img.currentSrc is the one that updates to show whichever candidate the browser actually decided to load and display.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'img.src and img.currentSrc are two names for the same thing — reading either tells you what image is actually displayed.',
      reality: 'They can genuinely differ: img.src reflects the literal src attribute (the fallback), while img.currentSrc reflects whichever srcset candidate the browser\'s own algorithm actually chose to load and display.'
    },
    {
      thought: 'Inspecting the srcset attribute string via getAttribute("srcset") tells you which image is actually being shown.',
      reality: 'It only shows the LIST of candidates that were offered — it says nothing about which one WON. Only img.currentSrc reveals the actual, resolved decision.'
    },
    {
      thought: 'The browser\'s srcset selection is a one-time decision made when the page loads and never changes afterward.',
      reality: 'img.currentSrc can update again later — for example after a viewport resize changes which candidate is the best fit under the sizes hint — reflecting the browser\'s current, potentially revised choice.'
    }
  ];
}
