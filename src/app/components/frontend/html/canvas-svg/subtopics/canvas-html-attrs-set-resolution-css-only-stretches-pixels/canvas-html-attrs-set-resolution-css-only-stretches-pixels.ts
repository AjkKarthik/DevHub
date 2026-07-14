import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-canvas-html-attrs-set-resolution-css-only-stretches-pixels',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './canvas-html-attrs-set-resolution-css-only-stretches-pixels.html',
  styleUrl: './canvas-html-attrs-set-resolution-css-only-stretches-pixels.scss'
})
export class CanvasHtmlAttrsSetResolutionCssOnlyStretchesPixelsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two completely separate size systems, easy to conflate',
      points: [
        'The main page\'s Common Mistake is direct: "Setting only CSS size scales the pixels, causing blurriness. The HTML width/height attributes define the actual resolution." A <code>&lt;canvas&gt;</code> element has an internal pixel BUFFER (set by its HTML <code>width</code>/<code>height</code> attributes) and a rendered DISPLAY size (set by CSS) — these are two independent numbers that just happen to share attribute names that also exist in CSS.',
        'When they match, one canvas pixel maps to one screen pixel and everything is crisp. When CSS stretches the display size larger than the HTML resolution, the browser has to interpolate — the exact same blur you would get zooming into a small bitmap image.',
      ]
    },
    {
      heading: 'This is directly measurable — no visual judgment required',
      points: [
        '<code>canvas.width</code> and <code>canvas.height</code> (as plain JS properties, not <code>getAttribute</code>) report the ACTUAL internal pixel buffer resolution. <code>canvas.getBoundingClientRect()</code> reports the ACTUAL rendered display size in CSS pixels — comparing the two ratios tells you exactly how much interpolation blur is being applied.',
        'A ratio of 1:1 means crisp rendering. A ratio like 1:2 (display size twice the buffer resolution) means every canvas pixel is being stretched across a 2×2 screen area — objectively, measurably blurry, not just subjectively "looks a bit soft."',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>canvas resolution vs display size</title>
    <style>
      /* Both canvases are CSS-stretched to 600×300 on screen */
      canvas { width: 600px; height: 300px; border: 1px solid #999; display: block; margin-bottom: 1rem; }
    </style>
  </head>
  <body>
    <p>Low-res canvas (HTML attrs 150×75, CSS-stretched to 600×300):</p>
    <canvas id="lowRes" width="150" height="75"></canvas>

    <p>Matched-res canvas (HTML attrs 600×300, CSS also 600×300):</p>
    <canvas id="matchedRes" width="600" height="300"></canvas>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

function drawGrid(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#e34c26';
  for (let x = 0; x < canvas.width; x += 10) {
    ctx.fillRect(x, 0, 2, canvas.height);
  }
}

const lowRes = document.getElementById('lowRes') as HTMLCanvasElement;
const matchedRes = document.getElementById('matchedRes') as HTMLCanvasElement;
drawGrid(lowRes);
drawGrid(matchedRes);

function report(canvas: HTMLCanvasElement, label: string): string {
  const rect = canvas.getBoundingClientRect();
  const bufferPixels = canvas.width * canvas.height;
  const displayPixels = Math.round(rect.width) * Math.round(rect.height);
  const stretchRatio = (displayPixels / bufferPixels).toFixed(2);
  return \`\${label}\\n  internal buffer: \${canvas.width}×\${canvas.height} (\${bufferPixels.toLocaleString()} px)\\n  CSS display size: \${Math.round(rect.width)}×\${Math.round(rect.height)} (\${displayPixels.toLocaleString()} px)\\n  each buffer pixel is stretched across \${stretchRatio}x its own area\\n\`;
}

output.textContent = report(lowRes, 'lowRes canvas:') + '\\n' + report(matchedRes, 'matchedRes canvas:');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Both canvases above are stretched to the same 600×300 CSS display size, but lowRes has an internal buffer of only 150×75. Predict: will the vertical stripes drawn on lowRes look noticeably blurrier or fuzzier than the identical stripes on matchedRes?',
    hint: 'A stretch ratio significantly above 1.0 means each real canvas pixel is being interpolated across multiple screen pixels — this is the same effect as viewing a low-resolution photo blown up to a larger size.',
    solution: `Yes, lowRes will look visibly blurrier. Its stretch ratio is 16.0 (600×300 display over 150×75 buffer =
16x the pixel area) — every actual drawn pixel is smeared across a 4×4 screen-pixel area by the
browser's own image-scaling interpolation. matchedRes has a 1.0 ratio — one buffer pixel maps to
exactly one screen pixel, producing a crisp result. This is exactly why the main page's fix is
setting the HTML width/height attributes to match (or exceed, for HiDPI) the actual CSS display size.`
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>&lt;canvas width="300" style="width: 600px"&gt;</code> is functionally the same as writing <code>&lt;canvas width="600"&gt;</code> with no CSS — the browser just fills in the difference.',
      reality: 'They produce genuinely different internal pixel buffers. The HTML attribute alone controls the buffer resolution; CSS width only controls how that FIXED buffer gets displayed, stretching or shrinking it without changing how many real pixels exist inside it.'
    },
    {
      thought: 'Blurry canvas output is a subjective rendering quality issue that varies by browser or GPU, not something you can precisely measure.',
      reality: 'The blur ratio is a precise, computable number — displayPixelArea ÷ bufferPixelArea — derived directly from canvas.width/height and getBoundingClientRect(), with no ambiguity about whether or how much stretching is happening.'
    },
    {
      thought: 'Making the HTML width/height attributes very large always produces the sharpest possible result, with no downside.',
      reality: 'A larger buffer means more pixels the browser has to fill on every single draw call — oversizing the buffer far beyond the actual display size (accounting for device pixel ratio) wastes real rendering performance for no visible sharpness benefit.'
    },
  ];
}
