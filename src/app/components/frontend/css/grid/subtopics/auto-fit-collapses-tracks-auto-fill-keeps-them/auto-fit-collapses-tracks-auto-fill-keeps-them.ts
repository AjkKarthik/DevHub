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
  templateUrl: './auto-fit-collapses-tracks-auto-fill-keeps-them.html',
  styleUrl: './auto-fit-collapses-tracks-auto-fill-keeps-them.scss'
})
export class AutoFitCollapsesTracksAutoFillKeepsThemSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'With too few items to fill every column, auto-fill and auto-fit produce genuinely different rendered widths — not just different visual "feel"',
      points: [
        'Both create as many columns as the container can fit at the given <code>minmax()</code> minimum — that part is identical. The difference is what happens to columns that end up with NO item in them.',
        '<code>auto-fill</code> keeps those empty columns as real, reserved tracks — a lone item stays exactly at its <code>minmax()</code> minimum width, since the leftover space is "occupied" by phantom empty tracks it can\'t grow into.',
        '<code>auto-fit</code> collapses those empty tracks to zero width entirely — the leftover space becomes genuinely available, so the same lone item grows via its <code>1fr</code> maximum to fill the ENTIRE container width.',
      ]
    },
    {
      heading: 'This is directly, precisely measurable — the width difference isn\'t subtle',
      points: [
        'A single item in a 600px-wide container with <code>minmax(150px, 1fr)</code> renders at exactly 150px under <code>auto-fill</code>, but exactly 600px under <code>auto-fit</code> — a 4x difference from one keyword.',
        'This is exactly the bug the main page\'s Common Mistakes section describes: "auto-fill when you want auto-fit" produces phantom empty columns in a card grid\'s last, partially-filled row instead of letting the real cards expand to fill it.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>auto-fit vs auto-fill</title>
    <style>
      #fillContainer { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); width: 600px; }
      #fitContainer { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); width: 600px; }
      #fillContainer div, #fitContainer div { height: 30px; background: #dbeafe; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="fillContainer"><div id="fillItem">item</div></div>
    <div id="fitContainer"><div id="fitItem">item</div></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const fillItem = document.querySelector<HTMLElement>('#fillItem')!;
const fitItem = document.querySelector<HTMLElement>('#fitItem')!;

console.log('container width: 600px, single item, minmax(150px, 1fr)');
console.log('auto-fill item width:', fillItem.getBoundingClientRect().width);
console.log('auto-fit item width:', fitItem.getBoundingClientRect().width);
console.log('auto-fit fills the entire container:', fitItem.getBoundingClientRect().width === 600);
console.log('auto-fill stays at its minmax minimum:', fillItem.getBoundingClientRect().width === 150);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A grid container is 600px wide with <code>grid-template-columns: repeat(auto-fill, minmax(150px, 1fr))</code> and contains exactly ONE item. How wide does that item render?',
    hint: 'auto-fill keeps the empty columns it could have created — think about what "reserved but empty" means for the leftover space an fr unit could otherwise claim.',
    solution: '150px — its minmax() minimum, not the full 600px. auto-fill keeps the phantom empty columns as real tracks, so there\'s no leftover space left for the 1fr maximum to distribute into. Swapping to auto-fit would collapse those empty tracks and let the item grow to fill all 600px.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'auto-fill and auto-fit are just two names for the same behavior — interchangeable syntax.',
      reality: 'They produce genuinely different rendered widths whenever there are fewer items than columns that could fit — auto-fill keeps empty tracks reserved (items stay at their minimum size); auto-fit collapses them (items grow to fill the space).'
    },
    {
      thought: 'The auto-fill vs auto-fit difference only matters for the LAST, partially-filled row of a card grid — earlier full rows are unaffected either way.',
      reality: 'That\'s exactly where the difference IS most visible in practice (a card grid\'s last row), but the underlying mechanism applies any time the container has fewer items than the maximum columns that could fit at the minimum size — not a special case, just the general rule showing up there.'
    },
    {
      thought: 'To make items in a partially-filled row grow and fill the space, you need extra CSS beyond just choosing the right repeat() keyword.',
      reality: 'Switching from auto-fill to auto-fit is the entire fix — no extra rules, media queries, or JavaScript needed. It\'s specifically designed as a one-keyword solution to this exact problem.'
    }
  ];
}
