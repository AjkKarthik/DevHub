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
  templateUrl: './backdrop-filter-has-zero-effect-without-a-transparent-background.html',
  styleUrl: './backdrop-filter-has-zero-effect-without-a-transparent-background.scss'
})
export class BackdropFilterHasZeroEffectWithoutATransparentBackgroundSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'backdrop-filter blurs what shows THROUGH an element\'s own background — a fully opaque background leaves nothing to show through, so the filter has zero visible effect',
      points: [
        '<code>backdrop-filter</code> operates on the rendered content BEHIND the element, then that blurred result is composited underneath the element\'s own background. If the background is <code>white</code> (fully opaque), it paints completely over the blurred backdrop, hiding it entirely.',
        'This is easy to get wrong because the <code>backdrop-filter</code> declaration itself is perfectly valid CSS with no opaque background — it is applied and doing real work, it is simply invisible, since nothing can be seen through an opaque cover.',
      ]
    },
    {
      heading: 'This is directly measurable by rasterizing the actual rendered pixels — a red backdrop is fully hidden behind an opaque foreground, but clearly shows through (blended) a semi-transparent one',
      points: [
        'Two identical scenes — a red rectangle behind a blurred, positioned front panel — differ only in the front panel\'s own background: <code>white</code> (opaque) versus <code>rgba(255,255,255,0.2)</code> (20% opaque).',
        'Sampling the actual rendered pixel color at the panel\'s center shows PURE WHITE for the opaque case (the red backdrop is completely hidden) and a light red/pink tint for the semi-transparent case — direct pixel-level proof, not just an assumption from the spec text.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>backdrop-filter has zero effect without a transparent background</title>
    <style>
      #opaqueScene, #transparentScene { width: 100px; height: 100px; position: relative; display: inline-block; margin-right: 20px; }
      #opaqueScene .backdrop, #transparentScene .backdrop { position: absolute; inset: 0; background: red; }
      #opaquePanel { position: absolute; inset: 20px; background: white; backdrop-filter: blur(8px); }
      #transparentPanel { position: absolute; inset: 20px; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="opaqueScene"><div class="backdrop"></div><div id="opaquePanel"></div></div>
    <div id="transparentScene"><div class="backdrop"></div><div id="transparentPanel"></div></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `// Rasterize a DOM subtree via SVG foreignObject + canvas so we can read the ACTUAL
// rendered pixel color, not just infer it from the CSS declarations.
async function rasterize(html: string, width: number, height: number): Promise<CanvasRenderingContext2D> {
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
  const opaqueScene = \`<div style="width:100px;height:100px;position:relative;">
    <div style="position:absolute;inset:0;background:red;"></div>
    <div style="position:absolute;inset:20px;background:white;backdrop-filter:blur(8px);"></div>
  </div>\`;
  const transparentScene = \`<div style="width:100px;height:100px;position:relative;">
    <div style="position:absolute;inset:0;background:red;"></div>
    <div style="position:absolute;inset:20px;background:rgba(255,255,255,0.2);backdrop-filter:blur(8px);"></div>
  </div>\`;

  const ctxOpaque = await rasterize(opaqueScene, 100, 100);
  const ctxTransparent = await rasterize(transparentScene, 100, 100);
  const pixelOpaque = ctxOpaque.getImageData(50, 50, 1, 1).data;
  const pixelTransparent = ctxTransparent.getImageData(50, 50, 1, 1).data;

  console.log('opaque background (white) -- rendered pixel:', Array.from(pixelOpaque));
  console.log('transparent background (20% white) -- rendered pixel:', Array.from(pixelTransparent));
  console.log('opaque panel is pure white, hiding the red backdrop entirely:', pixelOpaque[0] === 255 && pixelOpaque[1] === 255 && pixelOpaque[2] === 255);
  console.log('transparent panel shows a red-tinted color -- the backdrop clearly shows through:', pixelTransparent[1] < 200);
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A navbar is styled with <code>background: #ffffff; backdrop-filter: blur(16px);</code> intending a frosted-glass effect over the page content as the user scrolls. Does the frosted-glass effect appear?',
    hint: 'Ask whether #ffffff (opaque white) leaves anything visible behind the navbar for the blur to show.',
    solution: 'No visible frosted-glass effect appears — #ffffff is fully opaque, so it completely covers whatever the backdrop-filter blurred behind it. The fix is using a semi-transparent background instead, e.g. background: rgba(255, 255, 255, 0.7);, so the blurred page content shows through the navbar\'s own translucent white tint.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If backdrop-filter: blur() has no visible effect, the declaration itself must be wrong, unsupported, or missing a vendor prefix.',
      reality: 'The declaration can be completely correct and fully supported, yet still produce zero visible result — because the element\'s OWN background is opaque and paints over the blurred backdrop entirely. This is the single most common reason backdrop-filter "doesn\'t work."'
    },
    {
      thought: 'A background color needs to be completely absent (no background property at all) for backdrop-filter to be visible — adding any background defeats the effect.',
      reality: 'Any DEGREE of transparency works, not just a fully absent background — background: rgba(255,255,255,0.2) shows the backdrop clearly, since the more opaque the background, the more it obscures the backdrop, and the more transparent, the more it shows through. A background is not the enemy — an OPAQUE one is.'
    },
    {
      thought: 'Since backdrop-filter and filter sound like the same feature (just targeting different things), an opaque-background limitation on backdrop-filter probably also applies to plain filter.',
      reality: 'filter has no such limitation — it applies directly to the element\'s own content (which is already visible), not to something hidden behind an opaque layer. This opacity requirement is specific to backdrop-filter\'s "see-through" mechanism.'
    }
  ];
}
