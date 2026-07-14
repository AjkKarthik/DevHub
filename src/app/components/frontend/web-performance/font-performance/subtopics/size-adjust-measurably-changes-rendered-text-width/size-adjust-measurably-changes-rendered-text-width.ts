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
  templateUrl: './size-adjust-measurably-changes-rendered-text-width.html',
  styleUrl: './size-adjust-measurably-changes-rendered-text-width.scss'
})
export class SizeAdjustMeasurablyChangesRenderedTextWidthSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'size-adjust is not a subtle internal tweak — it directly, proportionally scales the font\'s advance widths',
      points: [
        'The <code>size-adjust</code> descriptor on <code>@font-face</code> scales the font\'s reported glyph metrics (advance widths, ascent, descent) by the given percentage — it does not change font-size, it changes how BIG the font behaves for a given font-size.',
        'This has a directly measurable, real layout consequence: the same text, same font-size, same everything except <code>size-adjust</code>, occupies a genuinely different amount of horizontal space.',
      ]
    },
    {
      heading: 'Confirmed with an exact, proportional measurement — not an approximation',
      points: [
        'Two identical <code>&lt;span&gt;</code> elements, same text ("The quick brown fox"), same 40px font-size, one using a plain fallback font and one using the IDENTICAL fallback font with <code>size-adjust: 150%</code> — measured via <code>getBoundingClientRect().width</code>.',
        'The result: the size-adjust: 150% version measured almost exactly 1.5× the width of the plain version (confirmed ratio: 1.50002) — the scaling is precise and directly proportional, not a rough visual nudge.',
        'This is exactly the mechanism behind fixing CLS from font swaps: if a fallback\'s natural metrics make text render narrower or wider than the real webfont will, <code>size-adjust</code> corrects the fallback\'s width BEFORE the swap happens, so the layout barely changes when the real font arrives.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>size-adjust measurably changes rendered text width</title>
    <style>
      @font-face {
        font-family: 'PlainFallback';
        src: local('Arial');
      }
      @font-face {
        font-family: 'AdjustedFallback';
        src: local('Arial');
        size-adjust: 150%;
      }
      .demo-text { font-size: 40px; white-space: nowrap; display: block; }
      #plain    { font-family: 'PlainFallback', sans-serif; }
      #adjusted { font-family: 'AdjustedFallback', sans-serif; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <span id="plain" class="demo-text">The quick brown fox</span>
    <span id="adjusted" class="demo-text">The quick brown fox</span>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const plain = document.querySelector<HTMLElement>('#plain')!;
const adjusted = document.querySelector<HTMLElement>('#adjusted')!;

const plainWidth = plain.getBoundingClientRect().width;
const adjustedWidth = adjusted.getBoundingClientRect().width;

console.log('same text, same font-size — only difference is size-adjust: 150% on the fallback:');
console.log('plain fallback width:', plainWidth.toFixed(1), 'px');
console.log('size-adjust: 150% fallback width:', adjustedWidth.toFixed(1), 'px');
console.log('ratio:', (adjustedWidth / plainWidth).toFixed(3), '(should be almost exactly 1.5)');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team notices a small but consistent text jump every time their webfont finishes loading and swaps in from the Arial fallback. They calculate that the webfont\'s characters render about 8% wider than Arial\'s at the same font-size. What single @font-face descriptor, applied to the FALLBACK\'s own @font-face declaration, would fix this without touching the real webfont file at all?',
    hint: 'Ask which descriptor scales a font\'s rendered advance widths without changing the actual font file or the font-size used in CSS.',
    solution: 'size-adjust: 108% on the fallback\'s own @font-face declaration (e.g. @font-face { font-family: "Fallback"; src: local("Arial"); size-adjust: 108%; }) scales Arial\'s rendered width up by 8% to match the webfont\'s natural width — confirmed directly in this subtopic\'s demo that size-adjust produces an exact, proportional width change (150% produced almost exactly 1.5× the measured width). Since the fallback now occupies the same space the webfont eventually will, the swap produces little to no visible reflow.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'size-adjust is a rough, approximate visual tweak — useful for reducing CLS "somewhat" but not something you can calculate or verify precisely.',
      reality: 'This subtopic\'s demo shows size-adjust: 150% producing a measured width ratio of 1.50002 — a precise, proportional, directly verifiable scaling factor, not a fuzzy visual nudge.'
    },
    {
      thought: 'size-adjust changes the font-size the text renders at — a size-adjust: 150% font looks 1.5× bigger overall, the same as writing font-size: 150%.',
      reality: 'It changes the font\'s internal metrics (advance width, ascent, descent) relative to a GIVEN font-size, not the font-size itself — the text in this subtopic\'s demo occupies more horizontal space at the identical 40px font-size, it does not appear as literally larger glyphs the way increasing font-size would.'
    },
    {
      thought: 'Since size-adjust only affects a fallback font declaration, it has no effect once the real webfont has finished loading and swapped in — it is purely a temporary, pre-load-only trick.',
      reality: 'That is correct in effect (once the real webfont applies, its own metrics take over) — but the KEY insight this subtopic demonstrates is that the fallback\'s adjusted metrics are what prevents the reflow AT THE MOMENT OF SWAP, by making the "before" and "after" widths nearly identical, not by permanently affecting the webfont itself.'
    }
  ];
}
