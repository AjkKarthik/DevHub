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
  templateUrl: './border-start-start-radius-flips-corners-in-rtl.html',
  styleUrl: './border-start-start-radius-flips-corners-in-rtl.scss'
})
export class BorderStartStartRadiusFlipsCornersInRtlSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'border-start-start-radius: 20px rounds the top-LEFT corner in LTR, but the exact same declaration rounds the top-RIGHT corner in RTL',
      points: [
        'Logical border-radius names combine two axes: the first word is the block position (<code>start</code> = block-start = top in horizontal writing), the second is the inline position (<code>start</code> = inline-start = left in LTR, right in RTL).',
        '<code>border-start-start-radius</code> therefore means "the corner at block-start and inline-start" — which corner that physically IS depends entirely on the current <code>direction</code>, exactly like <code>margin-inline-start</code> does for spacing.',
      ]
    },
    {
      heading: 'This is directly measurable via getComputedStyle() — reading the PHYSICAL border-top-left-radius and border-top-right-radius values reveals which corner actually received the rounding',
      points: [
        'On an element with <code>direction: ltr</code>, <code>getComputedStyle().borderTopLeftRadius</code> reports the 20px value and <code>borderTopRightRadius</code> reports 0px.',
        'The identical <code>border-start-start-radius: 20px</code> declaration on an element with <code>direction: rtl</code> instead reports 0px for <code>borderTopLeftRadius</code> and 20px for <code>borderTopRightRadius</code> — the rounded corner genuinely moved to the opposite physical side.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>border-start-start-radius flips corners in RTL</title>
    <style>
      #ltrBox { direction: ltr; width: 100px; height: 100px; background: crimson; border-start-start-radius: 20px; }
      #rtlBox { direction: rtl; width: 100px; height: 100px; background: royalblue; border-start-start-radius: 20px; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="ltrBox"></div>
    <div id="rtlBox"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const ltrBox = document.querySelector<HTMLElement>('#ltrBox')!;
const rtlBox = document.querySelector<HTMLElement>('#rtlBox')!;

const ltrStyle = getComputedStyle(ltrBox);
const rtlStyle = getComputedStyle(rtlBox);

console.log('LTR -- top-left radius:', ltrStyle.borderTopLeftRadius, ' top-right radius:', ltrStyle.borderTopRightRadius);
console.log('RTL -- top-left radius:', rtlStyle.borderTopLeftRadius, ' top-right radius:', rtlStyle.borderTopRightRadius);
console.log('the identical border-start-start-radius rounded opposite physical corners:',
  ltrStyle.borderTopLeftRadius !== rtlStyle.borderTopLeftRadius);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A card component uses <code>border-start-start-radius: 12px; border-end-start-radius: 12px;</code> to round its left edge in an LTR app (like a chat bubble tail). The app adds RTL support. What corners are rounded now?',
    hint: 'Ask what "start" resolves to physically once direction: rtl is active, for both the block-start/block-end corners referenced here.',
    solution: 'The rounding moves to the right edge instead — border-start-start-radius now rounds the top-right corner, and border-end-start-radius now rounds the bottom-right corner. The rounded edge automatically mirrors to match the RTL reading direction, with zero extra CSS.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Logical border-radius property names like border-start-start-radius are confusing shorthand for the same corners as border-top-left-radius — just a different, more complicated way to say the same thing.',
      reality: 'They name the SAME corner only when direction is ltr and writing-mode is horizontal-tb. Change either one, and the physical corner that gets rounded genuinely changes — the logical name is direction/writing-mode-relative, not just an alias.'
    },
    {
      thought: 'For border-radius specifically, it is probably simpler to just keep using the physical top-left/top-right names, since rounding is usually symmetric anyway.',
      reality: 'Rounding is NOT always symmetric — asymmetric shapes (a chat bubble tail, a tag with one rounded end, an accent card) are exactly where logical border-radius matters most, since the main page\'s own guidance is that these properties auto-mirror for RTL without needing a separate override rule.'
    },
    {
      thought: 'Since border-start-start-radius sounds like it only concerns the "start" side, it must correspond to the same physical corner as margin-inline-start.',
      reality: 'They use "start" in different combined senses — margin-inline-start is a single-axis reference (just the inline start), while border-start-start-radius combines TWO axes (block position + inline position) into one corner name, so the two properties aren\'t directly analogous term-for-term.'
    }
  ];
}
