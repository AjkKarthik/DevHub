import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-missing-beginpath-merges-paths-provable-via-pixel-data',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './missing-beginpath-merges-paths-provable-via-pixel-data.html',
  styleUrl: './missing-beginpath-merges-paths-provable-via-pixel-data.scss'
})
export class MissingBeginPathMergesPathsProvableViaPixelDataSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A canvas path is a single, growing list — not automatically reset per shape',
      points: [
        'The main page\'s Common Mistake is explicit: "Without <code>beginPath()</code>, subsequent strokes might connect to previous paths or accumulate styles unexpectedly." Every <code>arc()</code>, <code>moveTo()</code>, and <code>lineTo()</code> call appends to the SAME current path object until you explicitly start a new one — the canvas has no concept of "this shape is done" on its own.',
        'This means calling <code>stroke()</code> or <code>fill()</code> a second time, without a fresh <code>beginPath()</code> in between, re-renders the ENTIRE accumulated path so far — including the first shape — not just whatever new segment you most recently added.',
      ]
    },
    {
      heading: 'This is directly, numerically provable via getImageData()',
      points: [
        'Canvas exposes its actual rendered pixels through <code>ctx.getImageData(x, y, w, h)</code> — a real, per-pixel RGBA snapshot of what was drawn. You can pick a coordinate that should be untouched by the SECOND shape alone, and check whether a pixel actually landed there anyway.',
        'This turns "the paths merged" from a subjective visual observation into an objective one: read the pixel data at a specific coordinate before and after the second draw call, and check whether its alpha channel changed unexpectedly.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>missing beginPath merges paths</title></head>
  <body>
    <p>Broken canvas (no beginPath between shapes):</p>
    <canvas id="brokenCanvas" width="200" height="100" style="border:1px solid #999;"></canvas>

    <p>Correct canvas (beginPath before each shape):</p>
    <canvas id="correctCanvas" width="200" height="100" style="border:1px solid #999;"></canvas>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

// Coordinate that is only inside the FIRST circle's radius, nowhere near the second.
const probeX = 30, probeY = 50;

function drawBroken(ctx: CanvasRenderingContext2D) {
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'red';
  // First circle
  ctx.arc(30, 50, 20, 0, Math.PI * 2);
  ctx.stroke();
  // BUG: no beginPath() here — this arc() call appends to the SAME path.
  ctx.arc(150, 50, 20, 0, Math.PI * 2);
  ctx.stroke(); // strokes BOTH circles' full outlines again, connected by a line between them
}

function drawCorrect(ctx: CanvasRenderingContext2D) {
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'green';
  ctx.beginPath();
  ctx.arc(30, 50, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath(); // starts a genuinely fresh path
  ctx.arc(150, 50, 20, 0, Math.PI * 2);
  ctx.stroke();
}

const brokenCanvas = document.getElementById('brokenCanvas') as HTMLCanvasElement;
const correctCanvas = document.getElementById('correctCanvas') as HTMLCanvasElement;
const brokenCtx = brokenCanvas.getContext('2d')!;
const correctCtx = correctCanvas.getContext('2d')!;

drawBroken(brokenCtx);
drawCorrect(correctCtx);

// Probe a point directly BETWEEN the two circles — a straight connecting line
// only appears there if the paths were never properly separated.
const midX = 90, midY = 50;
const brokenMidPixel = brokenCtx.getImageData(midX, midY, 1, 1).data;
const correctMidPixel = correctCtx.getImageData(midX, midY, 1, 1).data;

output.textContent =
  \`Pixel at (\${midX}, \${midY}) — directly between the two circles, touched by neither shape's own outline:\\n\\n\` +
  \`brokenCanvas:  RGBA(\${Array.from(brokenMidPixel).join(', ')})  ← alpha \${brokenMidPixel[3]} means \${brokenMidPixel[3] > 0 ? 'something WAS drawn here' : 'nothing was drawn here'}\\n\` +
  \`correctCanvas: RGBA(\${Array.from(correctMidPixel).join(', ')})  ← alpha \${correctMidPixel[3]} means \${correctMidPixel[3] > 0 ? 'something WAS drawn here' : 'nothing was drawn here'}\\n\\n\` +
  'The broken canvas has real, non-zero pixel data at a point neither circle\\'s own\\n' +
  'outline should ever touch — proof the two arc() calls were treated as one\\n' +
  'single connected path instead of two independent shapes.';
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The probe coordinate (90, 50) sits directly between the two circles — outside both of their 20px-radius outlines. Predict: in the correct canvas, will that pixel have any color data at all?',
    hint: 'A fresh beginPath() before the second arc() means the second stroke() call only renders that one arc — there is nothing connecting it back to the first circle.',
    solution: `No — the correct canvas's pixel at (90, 50) is fully transparent (alpha 0), because beginPath()
genuinely started a new, empty path before the second circle, so stroke() only rendered that single
arc with nothing linking it to the first. The broken canvas, by contrast, has real non-transparent
pixel data there — moveTo/arc calls without an intervening beginPath() implicitly connect to
wherever the current path last left off, producing a visible connecting line between the two shapes
that was never explicitly drawn.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Calling stroke() or fill() automatically clears the current path, ready for the next shape.',
      reality: 'Neither stroke() nor fill() clears anything — they only RENDER whatever the current path contains. The path itself keeps growing with every subsequent arc()/lineTo()/moveTo() call until beginPath() is called explicitly.'
    },
    {
      thought: 'The "merged paths" bug is a visual artifact that can only really be verified by looking at a screenshot.',
      reality: 'It is directly, numerically provable via ctx.getImageData() — reading the actual pixel RGBA data at a specific coordinate gives an objective yes/no answer about whether unintended pixels were drawn there.'
    },
    {
      thought: 'This mistake only matters for complex, multi-segment paths — two simple, independent shapes drawn back-to-back are safe without beginPath().',
      reality: 'It affects even the simplest two-shape case, as demonstrated above — two plain circles, drawn with nothing more complex than two arc() calls, still connect into one continuous path without an intervening beginPath().'
    },
  ];
}
