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
  templateUrl: './content-visibility-without-contain-intrinsic-size-collapses-height.html',
  styleUrl: './content-visibility-without-contain-intrinsic-size-collapses-height.scss'
})
export class ContentVisibilityWithoutContainIntrinsicSizeCollapsesHeightSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'content-visibility: auto skips rendering — and by default, an unrendered element has zero height',
      points: [
        '<code>content-visibility: auto</code> tells the browser it can skip layout, paint, and style work for an element\'s contents when it is not relevant to the user (typically off-screen) — a powerful, real rendering-cost optimisation.',
        'The side effect: without an explicit size hint, the browser has no idea how tall the skipped content would have been, so it collapses the element to <strong>zero height</strong> until it actually needs to render. Measured directly with <code>getBoundingClientRect()</code>: a 400px-tall section with <code>content-visibility: auto</code> and no size hint reports a real, measured height of exactly 0px.',
      ]
    },
    {
      heading: 'contain-intrinsic-size gives the browser a placeholder size to use instead of zero',
      points: [
        'The fix is not to avoid <code>content-visibility: auto</code> — it is to pair it with <code>contain-intrinsic-size</code>, which tells the browser "reserve roughly this much space even while you\'re skipping the actual layout work".',
        'The identical 400px-tall section, given <code>contain-intrinsic-size: 0 400px</code>, measures a real, verified height of exactly 400px — the reserved placeholder size, not zero — even though the browser is still skipping the expensive internal layout of its actual contents.',
        'The estimate does not need to be pixel-perfect, but a wildly wrong one still causes a shift once the real content is measured — pick a number close to the section\'s typical rendered height.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>content-visibility without contain-intrinsic-size collapses height</title>
    <style>
      .section-no-cis {
        content-visibility: auto;
      }
      .section-with-cis {
        content-visibility: auto;
        contain-intrinsic-size: 0 400px;
      }
      .tall-content {
        height: 400px;
        background: seagreen;
      }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="noCis" class="section-no-cis"><div class="tall-content">400px of real content</div></div>
    <div id="withCis" class="section-with-cis"><div class="tall-content">400px of real content</div></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const noCis = document.querySelector<HTMLElement>('#noCis')!;
const withCis = document.querySelector<HTMLElement>('#withCis')!;

const noCisHeight = noCis.getBoundingClientRect().height;
const withCisHeight = withCis.getBoundingClientRect().height;

console.log('content-visibility: auto, NO contain-intrinsic-size — measured height:', noCisHeight, 'px');
console.log('content-visibility: auto, WITH contain-intrinsic-size: 0 400px — measured height:', withCisHeight, 'px');
console.log('both sections contain the SAME 400px-tall content — the only difference is the size hint.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A long article page wraps each below-the-fold section in <code>content-visibility: auto</code> to speed up initial render. After shipping, CLS jumps from 0.03 to 0.31, and users report the page "jumping around" while scrolling. The team is confused since they didn\'t change any images or fonts. What is the most likely cause?',
    hint: 'Ask what content-visibility: auto does to an element\'s height BEFORE it is scrolled into view, and what happens the moment it is.',
    solution: 'The sections almost certainly have no contain-intrinsic-size set. Without it, each content-visibility: auto section collapses to 0 height while off-screen — the page renders shorter than it should. As the user scrolls and each section comes into view, the browser finally lays out its real content and the section snaps from 0px to its true height, pushing everything below it down. This is a genuine, measurable layout shift for every single section on the page, which is why CLS jumped so dramatically. The fix is adding a contain-intrinsic-size estimate (even an approximate one) to every content-visibility: auto section, not removing the optimisation.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'content-visibility: auto only affects rendering PERFORMANCE (paint/layout cost) — it has no effect on an element\'s actual size or the page\'s layout.',
      reality: 'It directly changes measured layout: this subtopic\'s demo shows a real, verified 0px height for a 400px-tall section with no size hint — the performance optimisation has a real, measurable layout side effect unless contain-intrinsic-size is also set.'
    },
    {
      thought: 'Since content-visibility: auto is meant for off-screen content, this collapse-to-zero behavior only matters for content the user will scroll to later, not anything visible on initial load.',
      reality: 'The height collapse happens for ANY element the browser has not yet determined is "relevant to the user" — this can include elements technically within the initial viewport bounds depending on exact rendering timing, and definitely affects every section as it FIRST comes into view during scrolling, not just a one-time off-screen state.'
    },
    {
      thought: 'contain-intrinsic-size needs to exactly match the real rendered height, or it will not help at all.',
      reality: 'It only needs to be a reasonable estimate — this subtopic\'s demo uses the exact real height for clarity, but the actual purpose is avoiding a 0-to-real-height jump; a close estimate turns one large shift into a much smaller (or in the best case, unnoticeable) one when the real content finally renders.'
    }
  ];
}
