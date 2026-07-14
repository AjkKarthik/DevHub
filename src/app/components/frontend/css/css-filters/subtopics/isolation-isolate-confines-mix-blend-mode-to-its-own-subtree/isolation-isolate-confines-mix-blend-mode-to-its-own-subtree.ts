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
  templateUrl: './isolation-isolate-confines-mix-blend-mode-to-its-own-subtree.html',
  styleUrl: './isolation-isolate-confines-mix-blend-mode-to-its-own-subtree.scss'
})
export class IsolationIsolateConfinesMixBlendModeToItsOwnSubtreeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Without isolation: isolate, mix-blend-mode blends with EVERYTHING behind the element in the current stacking context — including a page background it was never meant to touch',
      points: [
        'A <code>mix-blend-mode: multiply</code> element with no isolating ancestor computes its final color by multiplying against whatever happens to be immediately behind it in paint order — which can include the document\'s own background if nothing else is in the way.',
        'Adding <code>isolation: isolate</code> to a wrapping ancestor creates a new stacking context specifically so that everything the blend mode "sees behind it" is limited to siblings inside that same wrapper — the page background and anything outside the wrapper is excluded from the blend calculation entirely.',
      ]
    },
    {
      heading: 'This is directly measurable via actual rendered pixel colors: the same red, multiply-blended element produces mathematically different results depending purely on whether isolation is present',
      points: [
        'A red element with <code>mix-blend-mode: multiply</code> sits over a GREEN page background, with no isolating wrapper — multiplying red (255,0,0) by green (0,128,0) channel-by-channel produces pure BLACK (0,0,0), since each color zeroes out the other\'s missing channel.',
        'The IDENTICAL red, multiply-blended element instead wrapped in a white <code>isolation: isolate</code> container — over the SAME green page background — produces pure RED (255,0,0) instead, since white is the mathematical identity value for multiply (anything × white = itself), proving the blend genuinely only "saw" the isolated wrapper\'s white background, not the green page behind it.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>isolation: isolate confines mix-blend-mode to its own subtree</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="output"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `async function rasterize(html: string, width: number, height: number): Promise<CanvasRenderingContext2D> {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  const fo = document.createElementNS(svgNS, 'foreignObject');
  fo.setAttribute('width', '100%');
  fo.setAttribute('height', '100%');
  const div = document.createElement('div');
  div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  div.innerHTML = html;
  fo.appendChild(div);
  svg.appendChild(fo);
  const svgData = new XMLSerializer().serializeToString(svg);
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
  const img = new Image();
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('rasterize failed')); img.src = svgUrl; });
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  return ctx;
}

(async () => {
  // No isolation: the multiply-blended red box blends directly with the GREEN page background.
  const sceneNoIsolation = \`<div style="width:100px;height:100px;background:green;position:relative;">
    <div style="position:absolute;inset:20px;background:red;mix-blend-mode:multiply;"></div>
  </div>\`;

  // With isolation: the red box is wrapped in a WHITE isolated container -- the blend should
  // only "see" the white wrapper, not the green page behind it.
  const sceneWithIsolation = \`<div style="width:100px;height:100px;background:green;position:relative;">
    <div style="position:absolute;inset:10px;background:white;isolation:isolate;">
      <div style="position:absolute;inset:10px;background:red;mix-blend-mode:multiply;"></div>
    </div>
  </div>\`;

  const ctxNoIsolation = await rasterize(sceneNoIsolation, 100, 100);
  const ctxWithIsolation = await rasterize(sceneWithIsolation, 100, 100);
  const pixelNoIsolation = ctxNoIsolation.getImageData(50, 50, 1, 1).data;
  const pixelWithIsolation = ctxWithIsolation.getImageData(50, 50, 1, 1).data;

  console.log('no isolation -- red multiply-blended against the GREEN page background:', Array.from(pixelNoIsolation));
  console.log('with isolation -- the SAME red element, blended against its own WHITE wrapper instead:', Array.from(pixelWithIsolation));
  console.log('no isolation produced black (red x green = black):', pixelNoIsolation[0] === 0 && pixelNoIsolation[1] === 0 && pixelNoIsolation[2] === 0);
  console.log('isolation produced pure red (red x white = red, the page background never participated):', pixelWithIsolation[0] === 255 && pixelWithIsolation[1] === 0 && pixelWithIsolation[2] === 0);
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A product card has a colored gradient overlay using <code>mix-blend-mode: overlay</code> on its image. The card sits directly on the page\'s own textured background (no isolating wrapper anywhere). What determines the overlay\'s final blended color?',
    hint: 'Ask what mix-blend-mode blends against by default when nothing isolates the element\'s stacking context.',
    solution: 'Without an isolation: isolate wrapper, the overlay blends with EVERYTHING behind it in the current stacking context — which, with no other elements in between, includes the page\'s own textured background showing through any gaps, not just the card\'s own image. This can produce inconsistent-looking cards depending on what happens to be behind each one on the page. Wrapping the card (or at least the image + overlay pair) in an isolation: isolate container confines the blend to just those two elements.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'mix-blend-mode only blends an element with its own direct parent or the elements immediately behind it in the same component — it wouldn\'t reach all the way back to the page background.',
      reality: 'Without isolation, it blends with EVERYTHING behind it in the current stacking context, however far back that goes — including the page\'s own body background if nothing else creates a stacking context in between.'
    },
    {
      thought: 'isolation: isolate needs to be applied directly to the element that HAS mix-blend-mode, not to a wrapping ancestor.',
      reality: 'It belongs on an ANCESTOR that wraps both the blended element and whatever it should be allowed to blend with — putting it on the blended element itself would isolate it from even its intended blend partners.'
    },
    {
      thought: 'This kind of unintended page-background blending is a rare edge case, since most blend-mode use cases already have an opaque container behind them anyway.',
      reality: 'It happens any time a blend-mode element sits over a gap, a transparent PNG, rounded corners, or any area where the immediate container doesn\'t fully opaque-cover the space — common enough that isolation: isolate is considered standard practice whenever mix-blend-mode is used, not just a defensive extra.'
    }
  ];
}
