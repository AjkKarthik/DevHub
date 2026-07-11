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
  templateUrl: './color-mix-always-produces-an-opaque-result.html',
  styleUrl: './color-mix-always-produces-an-opaque-result.scss'
})
export class ColorMixAlwaysProducesAnOpaqueResultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'color-mix(in oklch, blue 50%, white) produces a genuinely solid, opaque color — it will look identical on any background',
      points: [
        'Unlike an alpha-transparent color (<code>rgba()</code> or <code>opacity</code>), a <code>color-mix()</code> result has no transparency component at all — it computes a single, final, fully-opaque color value, then bakes that in.',
        'This means a <code>color-mix()</code>-tinted badge or button renders the exact same way regardless of what\'s BEHIND it — no bleed-through from the page background, unlike a semi-transparent color which visually changes depending on what it overlaps.',
      ]
    },
    {
      heading: 'This is directly checkable via the computed style — a color-mix() result never includes an alpha component in its output, while an rgba() color always does',
      points: [
        'Reading <code>getComputedStyle().backgroundColor</code> on a <code>color-mix()</code>-styled element returns a color string with NO separate alpha value — the browser reports it as fully opaque.',
        'The exact same read on an <code>rgba(0, 0, 255, 0.5)</code>-styled element returns the alpha value explicitly (<code>0.5</code>) as part of the string — proving the two really are structurally different kinds of color values, not just visually similar.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>color-mix produces an opaque result</title>
    <style>
      #colorMixTint { background: color-mix(in oklch, blue 50%, white); width: 100px; height: 50px; }
      #rgbaTint { background: rgba(0, 0, 255, 0.5); width: 100px; height: 50px; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="colorMixTint"></div>
    <div id="rgbaTint"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const colorMixEl = document.querySelector<HTMLElement>('#colorMixTint')!;
const rgbaEl = document.querySelector<HTMLElement>('#rgbaTint')!;

const colorMixResult = getComputedStyle(colorMixEl).backgroundColor;
const rgbaResult = getComputedStyle(rgbaEl).backgroundColor;

console.log('color-mix(in oklch, blue 50%, white) computed as:', colorMixResult);
console.log('rgba(0, 0, 255, 0.5) computed as:', rgbaResult);
console.log('the rgba result explicitly reports an alpha value in its string:', rgbaResult.includes('0.5'));
console.log('the color-mix result has no alpha component at all — it is fully opaque:', !colorMixResult.includes('/'));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A badge uses <code>background: color-mix(in oklch, var(--accent) 15%, white);</code> for a light tint. Placed over a bright red section of the page, will the badge visually blend with the red showing through?',
    hint: 'Ask whether color-mix() produces a transparent result the way opacity or rgba alpha would.',
    solution: 'No — color-mix() always produces a fully opaque final color, computed once from its two inputs. Placing it over any background renders the exact same tint every time, with zero bleed-through, unlike a genuinely transparent color.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'color-mix(in oklch, blue 50%, white) is just a more modern syntax for the same thing rgba(0, 0, 255, 0.5) achieves — both "lighten" blue by mixing in transparency.',
      reality: 'They produce structurally different kinds of colors. color-mix() computes one final, fully opaque color. rgba() keeps genuine alpha transparency, letting whatever is behind the element show through and change the visual result depending on context.'
    },
    {
      thought: 'Since color-mix() can mix a color with "white" to lighten it, it must be doing something conceptually similar to reducing opacity.',
      reality: 'It\'s computing a genuinely different, solid color — not simulating transparency at all. Mixing blue with white in a perceptual color space produces an actual light-blue color value, not a see-through blue.'
    },
    {
      thought: 'You can verify whether a color is transparent or opaque just by looking at how it renders visually in the browser.',
      reality: 'The definitive check is reading getComputedStyle() — an rgba() color reports its alpha value explicitly in the returned string; a color-mix() result reports none at all, confirming its opacity status directly from the computed value rather than a visual judgment.'
    }
  ];
}
