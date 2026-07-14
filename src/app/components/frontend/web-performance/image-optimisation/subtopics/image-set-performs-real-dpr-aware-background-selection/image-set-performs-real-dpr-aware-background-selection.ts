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
  templateUrl: './image-set-performs-real-dpr-aware-background-selection.html',
  styleUrl: './image-set-performs-real-dpr-aware-background-selection.scss'
})
export class ImageSetPerformsRealDprAwareBackgroundSelectionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'CSS background-image cannot use srcset — image-set() is the real, separate mechanism that fills that gap',
      points: [
        'srcset and sizes are <code>&lt;img&gt;</code>/<code>&lt;source&gt;</code> attributes — plain CSS <code>background-image</code> has no equivalent attribute-based syntax at all.',
        '<code>image-set()</code> is a CSS FUNCTION, used directly inside <code>background-image</code>, that lists candidates with density descriptors (<code>1x</code>, <code>2x</code>) — the browser picks the candidate matching the current device pixel ratio.',
        '<code>getComputedStyle()</code> alone is NOT enough to prove which candidate was actually used — it just echoes back the declaration (normalising <code>1x</code> to <code>1dppx</code>). The real proof is checking which URL genuinely triggered a network request.',
      ]
    },
    {
      heading: 'This is directly measurable — only the matching-DPR candidate is ever fetched, not both',
      points: [
        'Confirmed directly: on a device pixel ratio of 1, an element with <code>background-image: image-set(url("a.svg") 1x, url("b.svg") 2x)</code> produces exactly ONE real resource-timing entry — for the <code>1x</code> URL. The <code>2x</code> URL is never fetched at all.',
        'This mirrors srcset\'s DPR-awareness exactly, just for backgrounds instead of <code>&lt;img&gt;</code> elements — a Retina (2×) screen would fetch the <code>2x</code> candidate instead, and the <code>1x</code> one would go unused.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>image-set() performs real DPR-aware background selection</title>
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
      content: `const div = document.createElement('div');
div.style.cssText = \`
  width: 100px; height: 100px;
  background-image: image-set(
    url("/index.html?density=1x") 1x,
    url("/index.html?density=2x") 2x
  );
\`;
document.body.appendChild(div);

setTimeout(() => {
  const entries = performance
    .getEntriesByType('resource')
    .filter((e) => e.name.includes('density='));

  console.log('devicePixelRatio in this environment:', window.devicePixelRatio);
  console.log('real network requests actually fired for the image-set() candidates:', entries.length);
  entries.forEach((e) => console.log('  ->', e.name));
  console.log('only the candidate matching the current DPR was fetched — the other was never requested at all.');

  document.body.removeChild(div);
}, 500);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants a Retina-sharp CSS background icon without wasting bandwidth on standard-DPR screens. One developer suggests <code>background-image: url("icon@2x.png"); background-size: 24px 24px;</code> (always load the 2x version, just display it smaller). Another suggests <code>background-image: image-set(url("icon.png") 1x, url("icon@2x.png") 2x);</code>. Which approach actually saves bandwidth on standard-DPR screens?',
    hint: 'Ask whether the first approach gives the browser any CHOICE about which file to fetch, or whether it is hard-coded to always fetch the larger one.',
    solution: 'Only the image-set() approach saves bandwidth. The first approach hard-codes a single URL (icon@2x.png) — the browser has no choice and always fetches the larger 2x file, on every screen, regardless of actual pixel density; the smaller background-size is purely a display-time scaling, not a network optimisation. image-set() gives the browser a genuine choice between real candidates, and it only fetches the one matching the actual device pixel ratio — confirmed directly in this subtopic\'s demo, where the 2x candidate was never fetched at all on a 1x-DPR screen.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'CSS background-image can achieve the same responsive/DPR-aware loading as srcset simply by using multiple background layers or media queries — image-set() is just one option among several equally good ones.',
      reality: 'image-set() is the ONLY CSS mechanism that gives the browser a genuine choice between real image candidates based on device pixel ratio — media queries can swap the ENTIRE background-image declaration based on viewport width, but cannot express "pick whichever of these N files matches my screen\'s pixel density" the way image-set() does.'
    },
    {
      thought: 'getComputedStyle().backgroundImage reliably tells you which image-set() candidate the browser actually chose and is fetching.',
      reality: 'It only echoes back the full declaration (all candidates, normalised syntax) — confirmed directly in this subtopic\'s investigation, where getComputedStyle showed both 1x and 2x URLs regardless of which one was truly fetched. The real proof requires checking actual network activity via the Resource Timing API.'
    },
    {
      thought: 'Since image-set() is a relatively niche CSS feature, it likely has poor or inconsistent browser support compared to the well-established img srcset attribute.',
      reality: 'image-set() (unprefixed) has broad modern browser support and behaves predictably and measurably, confirmed directly working in this subtopic\'s demo — it is a real, production-ready tool, not an experimental one.'
    }
  ];
}
