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
  templateUrl: './ch-unit-scales-with-font-size-not-fixed-pixels.html',
  styleUrl: './ch-unit-scales-with-font-size-not-fixed-pixels.scss'
})
export class ChUnitScalesWithFontSizeNotFixedPixelsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '1ch is defined as the width of the "0" (zero) glyph in the element\'s OWN current font and font-size — not a fixed pixel value',
      points: [
        '<code>max-width: 65ch</code> approximates "65 characters wide" by measuring against the actual rendered width of a zero character in whatever font and font-size is active on that element — it\'s a live measurement, not a lookup table or an assumed average character width.',
        'This means the exact same <code>65ch</code> declaration produces a genuinely different pixel width depending on the font-size in effect — there\'s no single "65ch = X pixels" conversion that holds universally.',
      ]
    },
    {
      heading: 'This is directly measurable: doubling font-size on an element sized in ch doubles its rendered pixel width, proportionally',
      points: [
        'A <code>width: 65ch</code> element at <code>font-size: 16px</code> and the SAME element at <code>font-size: 32px</code> render at genuinely different pixel widths — reading <code>getBoundingClientRect().width</code> before and after the font-size change shows the exact 2x scaling.',
        'This is exactly what makes <code>ch</code> useful for readable line lengths: the "optimal 60-75 characters per line" guidance stays true regardless of what font-size a user has zoomed to or which font is loaded, since the unit itself adapts.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>ch unit scales with font-size</title>
    <style>
      #prose { width: 65ch; font-size: 16px; border: 1px solid #264de4; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="prose">65ch wide container</div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const prose = document.querySelector<HTMLElement>('#prose')!;

const widthAt16 = prose.getBoundingClientRect().width;
console.log('width: 65ch at font-size: 16px ->', widthAt16, 'px');

prose.style.fontSize = '32px';
const widthAt32 = prose.getBoundingClientRect().width;
console.log('width: 65ch at font-size: 32px ->', widthAt32, 'px');

console.log('ratio (should be ~2, matching the font-size doubling):', widthAt32 / widthAt16);
console.log('the SAME "65ch" declaration produced two genuinely different pixel widths:', widthAt16 !== widthAt32);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A container has <code>width: 65ch</code>. Its font-size is then doubled from 16px to 32px, with no other change. Does the container\'s rendered pixel width change?',
    hint: 'ch is defined relative to the current font\'s own "0" glyph width — think about what happens to that glyph\'s rendered size when font-size changes.',
    solution: 'Yes — it roughly doubles too. Since 1ch is measured against the "0" glyph at the element\'s CURRENT font-size, doubling font-size roughly doubles the glyph\'s rendered width, and therefore roughly doubles the total 65ch measurement.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ch is a fixed-width unit like px, just calibrated to roughly one character\'s width on average.',
      reality: 'It\'s a live, font-relative measurement against the "0" glyph of the CURRENT font and font-size on that specific element — genuinely recalculated whenever font-size or font-family changes, not a fixed conversion.'
    },
    {
      thought: 'Using ch for line-length control (max-width: 65ch) only works correctly for one specific font — switching fonts breaks the character-count approximation.',
      reality: 'That\'s exactly the point of using it — ch measures against whatever font is ACTUALLY active, so the "roughly 65 characters" approximation stays reasonably accurate across different fonts and font-sizes, unlike a fixed pixel value which would only be correct for one specific combination.'
    },
    {
      thought: 'Since ch is described as "character width," it must count actual rendered characters to determine an element\'s size.',
      reality: 'It has nothing to do with counting actual text content — it\'s purely a unit of measurement (like px, em, or rem) based on the "0" glyph\'s width, usable on ANY property that accepts a length, with or without any text content present at all.'
    }
  ];
}
