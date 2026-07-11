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
  templateUrl: './unitless-line-height-scales-fixed-px-does-not.html',
  styleUrl: './unitless-line-height-scales-fixed-px-does-not.scss'
})
export class UnitlessLineHeightScalesFixedPxDoesNotSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A unitless line-height is a MULTIPLIER of the element\'s own font-size — it recalculates automatically whenever font-size changes',
      points: [
        '<code>line-height: 1.5</code> means "1.5 times whatever this element\'s font-size currently is" — it\'s not a fixed value at all, it\'s a live relationship recomputed on every font-size change.',
        'A fixed <code>line-height: 24px</code>, by contrast, is exactly that — 24 pixels, permanently, completely disconnected from font-size. If the font-size later changes (a responsive breakpoint, a user zoom, a design update), the line-height doesn\'t follow.',
      ]
    },
    {
      heading: 'This is directly measurable by changing font-size and reading the computed line-height before and after',
      points: [
        'Two elements starting with IDENTICAL rendered line spacing (<code>line-height: 1.5</code> vs <code>line-height: 24px</code>, both computing to 24px at <code>font-size: 16px</code>) diverge completely once font-size doubles to 32px — the unitless one recomputes to 48px, the fixed one stays at exactly 24px.',
        'This is precisely why the main page\'s Common Mistakes flags fixed line-height on headings specifically — a heading with a much larger font-size than body text needs its line-height to scale proportionally, or it renders far too tight.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>unitless vs fixed line-height</title>
    <style>
      #container { font-size: 16px; }
      #unitless { line-height: 1.5; }
      #fixedPx { line-height: 24px; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="container">
      <span id="unitless">unitless (1.5)</span>
      <span id="fixedPx">fixed (24px)</span>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const container = document.querySelector<HTMLElement>('#container')!;
const unitless = document.querySelector<HTMLElement>('#unitless')!;
const fixedPx = document.querySelector<HTMLElement>('#fixedPx')!;

console.log('at font-size: 16px:');
console.log('  unitless (1.5) computed line-height:', getComputedStyle(unitless).lineHeight);
console.log('  fixed (24px) computed line-height:', getComputedStyle(fixedPx).lineHeight);

container.style.fontSize = '32px';

console.log('after doubling font-size to 32px:');
console.log('  unitless (1.5) computed line-height:', getComputedStyle(unitless).lineHeight);
console.log('  fixed (24px) computed line-height:', getComputedStyle(fixedPx).lineHeight);
console.log('unitless recalculated, fixed did not:',
  getComputedStyle(unitless).lineHeight === '48px' && getComputedStyle(fixedPx).lineHeight === '24px');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two elements both render with a 24px line-height at font-size: 16px — one via line-height: 1.5, the other via line-height: 24px. The font-size on both is then changed to 32px. Do they still match?',
    hint: 'One of these is a fixed pixel value; the other is a live multiplier of font-size. Think about which one actually depends on font-size for its computed value.',
    solution: 'No — the unitless one recomputes to 48px (1.5 × 32px), while the fixed one stays at exactly 24px, completely unaffected by the font-size change. They only matched by coincidence at the original font-size.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'line-height: 1.5 and line-height: 24px are just two different ways to write the same value, as long as they compute to the same pixels initially.',
      reality: 'They behave completely differently once font-size changes — 1.5 is a live multiplier that recomputes automatically; 24px is permanently fixed regardless of font-size.'
    },
    {
      thought: 'Fixed pixel line-height values are simpler and more predictable since the number never changes.',
      reality: 'That fixed number is exactly the problem — a heading with a much larger font-size than body text needs a PROPORTIONALLY larger line-height, which only a unitless value provides automatically.'
    },
    {
      thought: 'This only matters if you\'re writing responsive CSS with media queries that change font-size at breakpoints.',
      reality: 'It matters any time font-size differs across elements sharing a line-height rule (headings vs body text in the same stylesheet), and also for user-controlled changes like browser zoom or OS-level text scaling — unitless line-height adapts to all of these automatically.'
    }
  ];
}
