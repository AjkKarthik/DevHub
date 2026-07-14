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
  templateUrl: './missing-image-dimensions-cause-a-real-measurable-layout-shift.html',
  styleUrl: './missing-image-dimensions-cause-a-real-measurable-layout-shift.scss'
})
export class MissingImageDimensionsCauseARealMeasurableLayoutShiftSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'An `<img>` with no width/height renders at 0×0 until it loads — when its real size finally arrives, everything below it is pushed down, and the browser records this as a genuine layout shift',
      points: [
        'Without explicit dimensions (via HTML attributes or CSS), the browser has no way to know how much space an image needs before it finishes downloading — it allocates zero space, then reflows the page once the image\'s intrinsic size becomes known.',
        'Setting <code>width</code> and <code>height</code> attributes lets the browser compute the correct aspect ratio and RESERVE that space immediately, before the image data has even arrived — so when the image does load, nothing around it needs to move.',
      ]
    },
    {
      heading: 'This is directly measurable with the real Layout Instability API — an image with no dimensions produces a genuine layout-shift entry when it loads, while the identical image WITH dimensions produces none',
      points: [
        'Two identical scenes — an image followed by a sibling block of text — are set up identically, except one <code>&lt;img&gt;</code> has explicit <code>width</code>/<code>height</code> attributes and the other does not.',
        'A live <code>PerformanceObserver({ type: \'layout-shift\' })</code> records a real, non-zero shift entry the moment the dimension-less image finishes loading and the sibling text visibly jumps down — the SAME image, with dimensions set, produces zero entries at all, since the space was already reserved.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>missing image dimensions cause a real, measurable layout shift</title>
    <style>
      .scene { width: 300px; margin-bottom: 20px; }
      .sibling { width: 300px; height: 40px; background: orange; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div class="scene" id="noDimsScene">
      <img id="noDimsImg" alt="no dimensions set">
      <div class="sibling">Sibling content (no-dims scene)</div>
    </div>
    <div class="scene" id="withDimsScene">
      <img id="withDimsImg" width="300" height="200" alt="dimensions set">
      <div class="sibling">Sibling content (with-dims scene)</div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const svgDataUrl = 'data:image/svg+xml;base64,' +
  btoa('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="seagreen"/></svg>');

const shiftScores: number[] = [];
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries() as any[]) {
    shiftScores.push(entry.value);
    console.log('real layout-shift entry recorded, score:', entry.value);
  }
});
observer.observe({ type: 'layout-shift', buffered: false });

const noDimsImg = document.querySelector<HTMLImageElement>('#noDimsImg')!;
const withDimsImg = document.querySelector<HTMLImageElement>('#withDimsImg')!;

void document.body.offsetWidth; // force an initial paint before either image loads

setTimeout(() => {
  console.log('loading the NO-dimensions image...');
  noDimsImg.src = svgDataUrl;
  void document.body.offsetWidth;

  setTimeout(() => {
    console.log('loading the WITH-dimensions image...');
    withDimsImg.src = svgDataUrl;
    void document.body.offsetWidth;

    setTimeout(() => {
      observer.disconnect();
      console.log('total real layout-shift entries recorded:', shiftScores.length);
      console.log('check the log above: only the no-dimensions image caused a real, measurable shift.');
    }, 400);
  }, 300);
}, 150);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A blog template loads all article images via <code>&lt;img src="..." alt="..."&gt;</code> with no width/height attributes, relying entirely on CSS <code>max-width: 100%; height: auto;</code> for responsive sizing. Lighthouse flags a poor CLS score. Does adding max-width: 100% fix the underlying problem?',
    hint: 'Ask whether max-width: 100% gives the browser enough information to know the image\'s actual height BEFORE it loads.',
    solution: 'No — max-width: 100% only constrains the maximum width once the image is already rendering; it says nothing about the image\'s aspect ratio or expected height, so the browser still allocates 0 height until the image loads and its intrinsic size becomes known. The fix is adding real width and height attributes (or an explicit aspect-ratio in CSS) — modern browsers use these together with responsive CSS to reserve the correct space immediately, combining fluid sizing with zero layout shift.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting width and height attributes on an <img> forces it to render at that FIXED pixel size, which conflicts with responsive, fluid image layouts.',
      reality: 'Modern browsers use width/height attributes only to compute the image\'s intrinsic ASPECT RATIO for space reservation — combined with CSS like width: 100%; height: auto;, the image still scales fluidly, while the browser can still calculate the correct reserved height at any actual rendered width.'
    },
    {
      thought: 'This CLS-from-images problem is mostly theoretical — in practice, image loads happen fast enough on decent connections that the shift is imperceptible.',
      reality: 'The Layout Instability API measures the shift regardless of how fast it happens, and on real-world connections (especially mobile), image loads are frequently slow enough for users to genuinely see and be disrupted by the jump — this is precisely why CLS is a Core Web Vital based on real CrUX field data, not just a lab curiosity.'
    },
    {
      thought: 'Lazy-loaded images (loading="lazy") are exempt from this problem since they load later, well after the initial page render.',
      reality: 'Lazy-loaded images are equally susceptible — arguably more so, since they typically load while the user is actively scrolling and interacting with the page, making a sudden reflow even more disruptive if dimensions aren\'t reserved upfront.'
    }
  ];
}
