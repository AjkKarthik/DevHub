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
  templateUrl: './color-mix-in-oklch-preserves-vividness-srgb-doesnt.html',
  styleUrl: './color-mix-in-oklch-preserves-vividness-srgb-doesnt.scss'
})
export class ColorMixInOklchPreservesVividnessSrgbDoesntSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'oklch has an explicit chroma (saturation-like) channel — mixing in oklch keeps that channel high through the midpoint',
      points: [
        '<code>oklch(L C H)</code> separates lightness, chroma (how vivid/saturated), and hue as three independent numbers — mixing two oklch colors interpolates chroma directly, so a mix of two vivid colors stays vivid.',
        'Mixing <code>red</code> and <code>blue</code> in oklch produces a color the browser itself reports with a HIGH chroma value (typically above 0.25) — genuinely, measurably vivid, not just visually "looking" that way.',
      ]
    },
    {
      heading: 'sRGB has no equivalent chroma concept — it linearly averages the raw red/green/blue channels, which can accidentally cancel out saturation',
      points: [
        'Mixing <code>red</code> (255,0,0) and <code>blue</code> (0,0,255) 50/50 in sRGB produces exactly (128,0,128) — a flat, literal average with no concept of preserving how "vivid" either original color was.',
        'This is directly comparable: reading <code>getComputedStyle().backgroundColor</code> after each mix shows the oklch result reported with its own chroma number directly visible in the string, while the sRGB result is reported as a flat, symmetric component triple with no such measure — the underlying color-mixing ALGORITHM genuinely differs, not just the final rendered pixel.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>color-mix in oklch vs sRGB</title>
    <style>
      #oklchMix { background: color-mix(in oklch, red 50%, blue 50%); width: 100px; height: 50px; }
      #srgbMix { background: color-mix(in srgb, red 50%, blue 50%); width: 100px; height: 50px; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="oklchMix"></div>
    <div id="srgbMix"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const oklchEl = document.querySelector<HTMLElement>('#oklchMix')!;
const srgbEl = document.querySelector<HTMLElement>('#srgbMix')!;

console.log('color-mix(in oklch, red 50%, blue 50%) computed as:', getComputedStyle(oklchEl).backgroundColor);
console.log('color-mix(in srgb, red 50%, blue 50%) computed as:', getComputedStyle(srgbEl).backgroundColor);
console.log('the oklch result reports its own chroma value directly in the string — a genuine, separate vividness measure sRGB has no equivalent of.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two rules mix red and blue 50/50 — one <code>in oklch</code>, one <code>in srgb</code>. Both produce a purple. Do they produce the SAME algorithm-level result, just displayed differently?',
    hint: 'Ask whether the two color spaces have the same underlying channels to average — is there a "chroma" number in sRGB the way there is in oklch?',
    solution: 'No — they use genuinely different mixing algorithms. sRGB linearly averages raw red/green/blue channel numbers with no concept of preserving vividness. oklch interpolates a dedicated chroma channel directly, which is exactly why oklch mixes tend to stay visually vivid while sRGB mixes toward opposite hues can look muddier.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'color-mix(in oklch, ...) and color-mix(in srgb, ...) always produce visually identical results — the "in oklch"/"in srgb" part is just a formatting preference.',
      reality: 'They use fundamentally different interpolation algorithms — oklch directly blends a dedicated chroma channel; sRGB linearly averages raw channel numbers with no equivalent concept, producing genuinely different results for the same two input colors.'
    },
    {
      thought: 'The "muddy midpoint" problem with sRGB gradients/mixes is a rendering bug or a rare edge case.',
      reality: 'It\'s a direct, structural consequence of sRGB having no chroma channel — any two colors whose sRGB component averages happen to cancel out saturation will produce a duller-than-expected midpoint, which is common for complementary or near-complementary hue pairs like red and blue.'
    },
    {
      thought: 'Comparing oklch and sRGB color-mix results requires visually eyeballing a rendered swatch to judge which looks more vivid.',
      reality: 'It\'s directly measurable from the computed style string itself — the oklch result reports its own numeric chroma value, letting you compare vividness as a real number rather than a subjective visual impression.'
    }
  ];
}
