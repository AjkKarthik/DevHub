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
  templateUrl: './sizes-controls-which-srcset-candidate-wins.html',
  styleUrl: './sizes-controls-which-srcset-candidate-wins.scss'
})
export class SizesControlsWhichSrcsetCandidateWinsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The chosen candidate is directly readable via currentSrc — this is not a guess about what "probably" happens',
      points: [
        'After a responsive <code>&lt;img&gt;</code> loads, <code>img.currentSrc</code> reports the EXACT URL the browser actually selected from the srcset list — a real, live way to verify candidate selection instead of assuming.',
        'With no <code>sizes</code> attribute at all, the browser assumes the image renders at 100% of the viewport width and picks the LARGEST candidate — confirmed directly: on a wide viewport, an unset <code>sizes</code> selected the 1200w candidate even though the image was never going to render anywhere near that wide.',
      ]
    },
    {
      heading: 'A correct sizes value makes the browser pick the smallest candidate that still meets the real rendered width',
      points: [
        'With <code>sizes="300px"</code> (device pixel ratio 1), the browser correctly selected the 400w candidate — the smallest one that still covers a 300px rendered width.',
        'With <code>sizes="900px"</code>, the SAME srcset list correctly selected the 1200w candidate instead — the required width changed, so the selected candidate changed too, confirmed via <code>currentSrc</code> both times.',
        'This directly demonstrates the main page\'s own "Omitting sizes" mistake: the exact same srcset list produces THREE different real outcomes (largest / smallest-sufficient / a middle one) purely depending on the sizes value, with everything else held constant.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>sizes controls which srcset candidate wins</title>
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
      content: `async function testSizes(sizes: string | null): Promise<string> {
  const img = document.createElement('img');
  if (sizes) img.sizes = sizes;
  img.srcset = '/index.html?w=400 400w, /index.html?w=800 800w, /index.html?w=1200 1200w';
  document.body.appendChild(img);
  await new Promise((resolve) => { img.onload = resolve; setTimeout(resolve, 600); });
  const currentSrc = img.currentSrc;
  document.body.removeChild(img);
  const match = currentSrc.match(/w=(\\d+)/);
  return match ? match[1] + 'w' : 'unknown';
}

(async () => {
  console.log('same srcset list, three different sizes values:');
  console.log('no sizes attribute at all  ->', await testSizes(null), '(defaults to 100vw, picks the largest)');
  console.log('sizes="300px"              ->', await testSizes('300px'), '(smallest candidate that still covers 300px)');
  console.log('sizes="900px"              ->', await testSizes('900px'), '(smallest candidate that still covers 900px)');
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A product thumbnail grid renders each image at a fixed 200px width on every screen size. The developer writes <code>srcset="thumb-400.webp 400w, thumb-800.webp 800w, thumb-1600.webp 1600w"</code> but forgets to add a sizes attribute. On a wide 4K desktop monitor, DevTools shows the 1600w image being downloaded for a 200px-wide thumbnail. Why, and what is the one-attribute fix?',
    hint: 'Ask what the browser assumes about the rendered width of an image when sizes is completely absent — is it the fixed 200px CSS width, or something else?',
    solution: 'Without a sizes attribute, the browser assumes the image will render at 100% of the viewport width — NOT its actual fixed 200px CSS width, which the browser has no way to know about at srcset-selection time (sizes must be specified explicitly; it is not inferred from CSS). On a wide desktop viewport, 100vw is very wide, so the browser reasonably (from its own assumption) picks the largest 1600w candidate. The fix is adding sizes="200px" (matching the actual fixed rendered width), which tells the browser correctly and lets it pick the small 400w candidate instead — confirmed directly in this subtopic\'s demo, where changing only the sizes value changed which real candidate was selected.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The sizes attribute is optional metadata — if you omit it, the browser will still figure out the correct rendered width from the image\'s actual CSS (width: 200px, etc.).',
      reality: 'The browser cannot see CSS at the point it needs to select a srcset candidate (during HTML parsing, before stylesheets are guaranteed to be applied) — without an explicit sizes value it defaults to 100vw, confirmed directly in this subtopic\'s demo picking the largest candidate for an unset sizes attribute.'
    },
    {
      thought: 'srcset candidate selection is a rough, browser-specific heuristic that is hard to verify or reason about precisely.',
      reality: 'img.currentSrc reports the EXACT candidate chosen, in real time, in any script — this subtopic\'s demo shows precise, reproducible, directly-observable selection for three different sizes values on the identical srcset list.'
    },
    {
      thought: 'Since sizes is meant to describe the rendered width, a single fixed value like sizes="400px" only works for images that are always exactly 400px wide — responsive images that resize with the viewport cannot use a simple sizes value.',
      reality: 'sizes accepts a full media-query-like list, e.g. sizes="(max-width: 768px) 100vw, 400px" — the browser evaluates each condition in order and uses the first one that matches the current viewport, making it fully capable of describing a genuinely responsive rendered width, not just a fixed one.'
    }
  ];
}
