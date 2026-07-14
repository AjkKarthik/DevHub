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
  templateUrl: './percentage-padding-top-resolves-against-the-parents-width-not-height.html',
  styleUrl: './percentage-padding-top-resolves-against-the-parents-width-not-height.scss'
})
export class PercentagePaddingTopResolvesAgainstTheParentsWidthNotHeightSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'padding-top: 56.25% has nothing to do with the container\'s HEIGHT — every percentage-based margin or padding value, on every side, resolves against the parent\'s WIDTH',
      points: [
        'This applies to all four sides equally: <code>padding-top</code>, <code>padding-bottom</code>, <code>margin-top</code>, and <code>margin-bottom</code> all use the containing block\'s INLINE size (width, in normal horizontal writing) as their percentage reference — not the block\'s own height, even though intuitively a "top" or "bottom" value feels like it should relate to vertical space.',
        'This is precisely the mechanism behind the classic aspect-ratio hack: a <code>0</code>-height box with <code>padding-top: 56.25%</code> resolves to a real pixel height equal to 56.25% of its CONTAINER\'s width — producing an exact 16:9 aspect ratio regardless of what the container\'s own height happens to be.',
      ]
    },
    {
      heading: 'This is directly measurable via getBoundingClientRect() — the same 56.25% padding-top produces a rendered height tied purely to container width, completely independent of the container\'s own declared height',
      points: [
        'A container is explicitly sized to <code>400px</code> wide and <code>100px</code> tall — deliberately making width and height very different, so which one the percentage actually tracks is unambiguous.',
        'A child box inside it with <code>height: 0; padding-top: 56.25%;</code> renders at a real height of exactly <code>225px</code> — precisely 56.25% of the container\'s 400px WIDTH, and completely unrelated to the container\'s 100px height.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>percentage padding-top resolves against the parent's width, not height</title>
    <style>
      #container { width: 400px; height: 100px; background: #eee; }
      #box { width: 100%; height: 0; padding-top: 56.25%; background: crimson; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="container">
      <div id="box"></div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const container = document.querySelector<HTMLElement>('#container')!;
const box = document.querySelector<HTMLElement>('#box')!;

const containerRect = container.getBoundingClientRect();
const boxRect = box.getBoundingClientRect();

console.log('container width:', containerRect.width, ' container height:', containerRect.height);
console.log('box rendered height (from padding-top: 56.25%):', boxRect.height);

const expectedFromWidth = containerRect.width * 0.5625;
const expectedFromHeight = containerRect.height * 0.5625;

console.log('expected if percentage used container WIDTH:', expectedFromWidth);
console.log('expected if percentage used container HEIGHT:', expectedFromHeight);
console.log('the box height matches the WIDTH-based calculation:', Math.round(boxRect.height) === Math.round(expectedFromWidth));
console.log('the box height does NOT match the height-based calculation:', Math.round(boxRect.height) !== Math.round(expectedFromHeight));
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer wants a box that\'s always exactly 25% as tall as its container\'s own HEIGHT (not width) and tries <code>padding-top: 25%;</code> on a zero-height box. Does this achieve that?',
    hint: 'Ask what percentage margin/padding values on ANY side actually resolve against, regardless of which side (top, bottom, left, right) is being set.',
    solution: 'No — padding-top: 25% still resolves against the container\'s WIDTH, not its height, exactly like the 56.25% aspect-ratio hack does. This technique can only produce a height that is a percentage of the container\'s WIDTH, never its height. To size something as a percentage of the container\'s own height, use height: 25% directly (assuming the container has a defined height) — padding-based percentages are not the right tool for that.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since padding-top and padding-bottom deal with vertical space, their percentage values should naturally be calculated against the container\'s height.',
      reality: 'ALL padding and margin percentages — regardless of which side they\'re set on — resolve against the containing block\'s WIDTH. This is a specific, intentional CSS spec rule, not an inconsistency or bug.'
    },
    {
      thought: 'This width-based percentage rule for padding-top only applies to the specific "aspect ratio hack" pattern — it\'s a special case tied to that one technique.',
      reality: 'It\'s a general rule that applies to EVERY use of percentage-based vertical padding/margin, whether or not it\'s being used for an aspect-ratio effect. The aspect-ratio hack is simply a clever, deliberate APPLICATION of this general rule, not a special exception to it.'
    },
    {
      thought: 'Modern CSS has replaced the need to understand this quirk, since the aspect-ratio property now exists as a cleaner alternative.',
      reality: 'While aspect-ratio is indeed the modern, preferred way to achieve this specific effect, the underlying percentage-resolves-against-width rule for margin/padding still applies throughout CSS and can cause confusing, unrelated bugs anywhere percentage-based vertical spacing is used without realizing this rule is in effect.'
    }
  ];
}
