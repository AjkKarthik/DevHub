import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-svg-without-viewbox-ignores-css-resize-of-coordinates',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './svg-without-viewbox-ignores-css-resize-of-coordinates.html',
  styleUrl: './svg-without-viewbox-ignores-css-resize-of-coordinates.scss'
})
export class SvgWithoutViewboxIgnoresCssResizeOfCoordinatesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'viewBox defines the internal coordinate system — width/height alone do not',
      points: [
        'The main page\'s Common Mistake is explicit: "Without viewBox, the coordinate system defaults to user space, which can cause scaling issues when the SVG is resized via CSS." <code>width</code> and <code>height</code> on <code>&lt;svg&gt;</code> set the element\'s OWN box size — they say nothing about how the shapes drawn inside should scale when that box changes size.',
        '<code>viewBox="min-x min-y width height"</code> is what tells the browser "the content inside was authored in THIS coordinate space — stretch or shrink it proportionally to fit whatever the actual rendered box ends up being." Without it, resizing the SVG via CSS just changes the visible viewport onto a fixed-size internal canvas, rather than scaling that canvas\'s content to match.',
      ]
    },
    {
      heading: 'This is directly measurable by comparing a shape\'s rendered position before and after a CSS resize',
      points: [
        'A circle drawn at <code>cx="50" cy="50"</code> inside an SVG WITH a matching <code>viewBox</code> will always appear at the same PROPORTIONAL position (e.g., dead center) no matter how large or small the SVG is stretched via CSS — its rendered pixel coordinates, read via <code>getBoundingClientRect()</code>, scale in lockstep with the SVG\'s own box.',
        'The identical circle inside an SVG WITHOUT a <code>viewBox</code> keeps its literal user-space coordinates fixed — when the box is stretched larger via CSS, the circle does NOT grow or reposition proportionally; only the surrounding empty canvas grows, changing the circle\'s effective position relative to the new, larger box.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>svg viewBox and CSS resize</title>
    <style>
      /* Both SVGs authored at 100×100, both CSS-stretched to 300×300 */
      svg { border: 1px solid #999; width: 300px; height: 300px; display: block; margin-bottom: 1rem; }
    </style>
  </head>
  <body>
    <p>WITH viewBox="0 0 100 100" (CSS-stretched to 300×300):</p>
    <svg id="withViewBox" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="10" fill="#e34c26" />
    </svg>

    <p>WITHOUT viewBox, same width/height="100" (CSS-stretched to 300×300):</p>
    <svg id="withoutViewBox" width="100" height="100">
      <circle cx="50" cy="50" r="10" fill="#264de4" />
    </svg>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

function reportCirclePosition(svgId: string, label: string): string {
  const svg = document.getElementById(svgId) as unknown as SVGSVGElement;
  const circle = svg.querySelector('circle')!;
  const svgRect = svg.getBoundingClientRect();
  const circleRect = circle.getBoundingClientRect();

  // Where the circle's center actually landed, as a fraction of the SVG's own rendered box —
  // 0.5, 0.5 means "dead center," regardless of the SVG's actual pixel size.
  const circleCenterX = circleRect.left + circleRect.width / 2;
  const circleCenterY = circleRect.top + circleRect.height / 2;
  const fractionX = ((circleCenterX - svgRect.left) / svgRect.width).toFixed(3);
  const fractionY = ((circleCenterY - svgRect.top) / svgRect.height).toFixed(3);

  return \`\${label}\\n  SVG rendered box: \${Math.round(svgRect.width)}×\${Math.round(svgRect.height)}px\\n  circle center as a fraction of the box: (\${fractionX}, \${fractionY})\\n\`;
}

output.textContent =
  reportCirclePosition('withViewBox', 'WITH viewBox (authored center at cx=50,cy=50 out of 100):') + '\\n' +
  reportCirclePosition('withoutViewBox', 'WITHOUT viewBox (same authored coordinates):') + '\\n' +
  'Both circles were authored at the exact same (50,50) position inside a 100×100\\n' +
  'coordinate space, and both SVGs are stretched to the identical 300×300 CSS box —\\n' +
  'yet only the viewBox version keeps its circle at the proportional center (0.5, 0.5).';
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Both circles are authored at <code>cx="50" cy="50"</code> inside content meant to be 100×100 — dead center. Both SVGs are CSS-stretched to 300×300. Predict: will the circle in the SVG WITHOUT viewBox still appear at the visual center of its 300×300 box?',
    hint: 'Without viewBox, the SVG has no instruction to scale its internal 100×100 coordinate space to match a larger rendered box — CSS stretching the box and the content inside scaling to fill it are two different things.',
    solution: `No — without viewBox, the circle stays anchored to its literal (50,50) coordinate, which is only
1/6th of the way into a 300×300 box (50/300 ≈ 0.167), not the visual center. The SVG's "canvas"
grew to fill the CSS box, but nothing told the CONTENT to scale up along with it — the circle
simply sits in the top-left portion of a much larger empty area. With viewBox="0 0 100 100" present,
the browser is explicitly told to treat that 100×100 space as the full content area and scale
everything inside it (including the circle's position) proportionally to whatever box size CSS
ultimately produces — keeping it visually centered no matter the actual rendered dimensions.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting width and height on the svg element is enough to make its content scale proportionally when the element is resized via CSS.',
      reality: 'width/height only set the SVG element\'s OWN box size — they say nothing about how content drawn inside should respond when that box later changes. viewBox is the specific attribute that establishes a scalable internal coordinate system.'
    },
    {
      thought: 'An SVG without viewBox simply doesn\'t resize at all when you apply CSS width/height to it.',
      reality: 'The SVG\'s own BOX does resize according to CSS just fine — what fails to scale is the CONTENT inside it. The visible canvas grows or shrinks, but shapes keep their literal, unscaled coordinate positions within it.'
    },
    {
      thought: 'This is purely a visual-polish issue — shapes just end up positioned slightly differently, nothing is fundamentally broken.',
      reality: 'For anything beyond a fixed, never-resized SVG, this can make content vanish off-canvas entirely or become disproportionately tiny/huge relative to its container — a real, functional bug for any responsively-sized icon or illustration, not just a cosmetic nuance.'
    },
  ];
}
