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
  templateUrl: './wcag-contrast-ratio-is-directly-computable-from-rgb.html',
  styleUrl: './wcag-contrast-ratio-is-directly-computable-from-rgb.scss'
})
export class WcagContrastRatioIsDirectlyComputableFromRgbSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'WCAG contrast ratio is not a subjective visual judgment — it\'s a precise, published formula computed from two colors\' relative luminance',
      points: [
        'Relative luminance weighs each RGB channel differently (green contributes the most to perceived brightness, blue the least) and applies a gamma-correction curve — this isn\'t a simple average of R, G, and B.',
        'The final contrast ratio formula, <code>(L1 + 0.05) / (L2 + 0.05)</code> using the lighter (L1) and darker (L2) luminance, produces the exact number tools like Chrome DevTools\' color picker or axe display next to a pass/fail badge — there\'s no ambiguity or approximation involved.',
      ]
    },
    {
      heading: 'This formula is directly implementable and verifiable in plain JavaScript — confirming the main page\'s own specific numeric claims exactly',
      points: [
        'Implementing the WCAG relative-luminance and contrast-ratio formulas directly and running them against <code>#aaaaaa</code> on white produces a ratio of approximately 2.32:1 — genuinely failing the 4.5:1 AA threshold, exactly as documented.',
        'The same formula against <code>#767676</code> on white produces approximately 4.54:1 — just barely passing 4.5:1, confirming that color was deliberately chosen as a real, working example of the minimum acceptable gray, not a rough approximation.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>WCAG contrast ratio computed from RGB</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgb1: number[], rgb2: number[]): number {
  const l1 = relativeLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = relativeLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const white = [255, 255, 255];
const failingGray = [0xaa, 0xaa, 0xaa]; // #aaa
const passingGray = [0x76, 0x76, 0x76]; // #767676

const failingRatio = contrastRatio(failingGray, white);
const passingRatio = contrastRatio(passingGray, white);

console.log('#aaa on white contrast ratio:', failingRatio.toFixed(2), '-> passes 4.5:1 AA?', failingRatio >= 4.5);
console.log('#767676 on white contrast ratio:', passingRatio.toFixed(2), '-> passes 4.5:1 AA?', passingRatio >= 4.5);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The main page claims <code>#aaa</code> on white is approximately 2.3:1 and fails WCAG AA. Is that number a rough visual estimate, or can it be computed exactly?',
    hint: 'Think about whether "contrast ratio" has a precise mathematical definition, the same way a color\'s hex value does.',
    solution: 'It\'s exactly computable — the WCAG relative luminance and contrast ratio formulas are fully specified. Implementing them in plain JavaScript against #aaaaaa and white produces 2.32:1, matching the documented claim precisely, not approximately.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'WCAG contrast ratio numbers like "4.5:1" are rough guidelines meant to be checked by eye, similar to "make sure the text looks readable."',
      reality: 'They\'re the output of a precisely defined mathematical formula (relative luminance, then a specific ratio calculation) — the same formula every contrast-checking tool implements, producing an exact, reproducible number, not a subjective impression.'
    },
    {
      thought: 'Contrast ratio is basically just comparing how far apart two colors\' brightness values are — a simple average or difference of R, G, B.',
      reality: 'It specifically weighs green, red, and blue differently (green contributes far more to perceived brightness) and applies a gamma-correction curve before combining them — a naive RGB average would produce a meaningfully different, incorrect number.'
    },
    {
      thought: 'Verifying that a specific color pair passes WCAG AA always requires a dedicated tool or browser extension.',
      reality: 'The formula is short enough to implement directly in about a dozen lines of JavaScript — useful for programmatically checking contrast in design systems, automated tests, or dynamically-generated color combinations.'
    }
  ];
}
