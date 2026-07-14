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
  templateUrl: './margin-inline-start-flips-with-direction-not-writing-mode.html',
  styleUrl: './margin-inline-start-flips-with-direction-not-writing-mode.scss'
})
export class MarginInlineStartFlipsWithDirectionNotWritingModeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'margin-inline-start: 20px silently becomes a LEFT margin in LTR and a RIGHT margin in RTL — with zero extra CSS written for either case',
      points: [
        'The inline axis follows the text-flow direction, which is controlled by the CSS <code>direction</code> property (<code>ltr</code> or <code>rtl</code>) — not by anything you have to configure separately for logical properties to work.',
        'A single declaration, <code>margin-inline-start: 20px</code>, produces genuinely different physical CSS depending purely on which <code>direction</code> value is active on that element (or an ancestor) — no media query, no [dir="rtl"] override selector, no duplicate rule needed.',
      ]
    },
    {
      heading: 'This is directly measurable via getComputedStyle() — reading the PHYSICAL margin-left and margin-right values reveals which side actually received the spacing, confirming the automatic flip',
      points: [
        'On an element with <code>direction: ltr</code>, <code>getComputedStyle().marginLeft</code> reports the 20px value and <code>marginRight</code> reports 0 — the browser resolved inline-start to the physical left side.',
        'The exact same <code>margin-inline-start: 20px</code> declaration on an element with <code>direction: rtl</code> instead reports 0 for <code>marginLeft</code> and 20px for <code>marginRight</code> — the browser resolved inline-start to the physical right side instead.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>margin-inline-start flips with direction</title>
    <style>
      #ltrBox { direction: ltr; margin-inline-start: 20px; width: 80px; height: 40px; background: crimson; }
      #rtlBox { direction: rtl; margin-inline-start: 20px; width: 80px; height: 40px; background: royalblue; }
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

console.log('LTR -- margin-left:', getComputedStyle(ltrBox).marginLeft, ' margin-right:', getComputedStyle(ltrBox).marginRight);
console.log('RTL -- margin-left:', getComputedStyle(rtlBox).marginLeft, ' margin-right:', getComputedStyle(rtlBox).marginRight);

console.log('same margin-inline-start declaration, opposite physical sides:',
  getComputedStyle(ltrBox).marginLeft !== getComputedStyle(rtlBox).marginLeft);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A sidebar uses <code>margin-inline-start: 1rem;</code> to space itself from the page edge. The app later adds Arabic language support by setting <code>direction: rtl</code> on <code>&lt;html&gt;</code>. Does the sidebar\'s CSS need updating?',
    hint: 'Ask whether margin-inline-start resolves to a fixed physical side, or whether it re-resolves whenever direction changes.',
    solution: 'No update needed — margin-inline-start re-resolves automatically based on the ambient direction value. It was margin-left under LTR and becomes margin-right under RTL with no code changes, which is exactly the internationalization benefit logical properties are designed for.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'margin-inline-start is basically just a fancier name for margin-left that happens to also work for RTL somehow under the hood.',
      reality: 'It genuinely resolves to a DIFFERENT physical property depending on direction — margin-left in LTR, margin-right in RTL. It is not margin-left with special RTL handling; it is direction-relative from the start.'
    },
    {
      thought: 'To get RTL-correct spacing, you still need a [dir="rtl"] override selector somewhere, even if you use logical properties as the base.',
      reality: 'That is precisely what logical properties eliminate. A single margin-inline-start declaration handles both directions automatically — no override selector, no duplicate rule, no JavaScript direction detection needed.'
    },
    {
      thought: 'The flip only matters for text-heavy content (headlines, paragraphs) — layout spacing like margins is usually direction-independent in practice.',
      reality: 'Layout spacing is exactly where the flip matters most for a properly mirrored RTL interface — a sidebar, an icon offset, or a card\'s accent spacing all need to visually mirror, not just the reading direction of the text itself.'
    }
  ];
}
