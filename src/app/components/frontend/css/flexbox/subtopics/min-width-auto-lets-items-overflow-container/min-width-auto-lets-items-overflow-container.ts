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
  templateUrl: './min-width-auto-lets-items-overflow-container.html',
  styleUrl: './min-width-auto-lets-items-overflow-container.scss'
})
export class MinWidthAutoLetsItemsOverflowContainerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Flex items default to min-width: auto — which means "never shrink smaller than my content"',
      points: [
        'Setting <code>flex: 1</code> tells an item to shrink and grow to fill available space, but the item\'s IMPLIED minimum size (from <code>min-width: auto</code>) still wins over that instruction — the item refuses to shrink past the width its content naturally needs.',
        'With unbreakable content like a long word or <code>white-space: nowrap</code> text, this genuinely lets the item render WIDER than the flex container itself, overflowing it — measurably, via <code>getBoundingClientRect().width</code> exceeding the container\'s own width.',
      ]
    },
    {
      heading: 'Setting min-width: 0 explicitly overrides this default and lets flex-shrink actually apply as expected',
      points: [
        'With <code>min-width: 0</code> added, the same item shrinks all the way down to fit exactly within its flex container\'s available space — the overflow disappears completely, and the item\'s measured width matches the container.',
        'This is why <code>min-width: 0</code> is such a common addition on flex children in real layouts — without it, ordinary content like a long filename or an unbroken URL can silently break a layout that looks correct with short placeholder text.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>min-width: auto lets flex items overflow</title>
    <style>
      #container { display: flex; width: 100px; border: 2px solid #264de4; }
      #item { flex: 1; background: #dbeafe; white-space: nowrap; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="container">
      <div id="item">This is some long unbreakable text content</div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const container = document.querySelector<HTMLElement>('#container')!;
const item = document.querySelector<HTMLElement>('#item')!;

const containerWidth = container.getBoundingClientRect().width;
const itemWidthBefore = item.getBoundingClientRect().width;
console.log('container width:', containerWidth);
console.log('item width (default min-width: auto):', itemWidthBefore);
console.log('item overflows its own container:', itemWidthBefore > containerWidth);

item.style.minWidth = '0';
const itemWidthAfter = item.getBoundingClientRect().width;
console.log('item width after min-width: 0:', itemWidthAfter);
console.log('item now fits exactly within the container:', itemWidthAfter === containerWidth);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A flex item has <code>flex: 1</code> and long unbreakable text content, inside a 100px-wide flex container. It has no <code>min-width</code> set. Does the item\'s rendered width stay at or below 100px?',
    hint: 'flex-shrink only shrinks an item down to its minimum size — think about what that minimum size defaults to when nothing overrides it.',
    solution: 'No — it can render WIDER than the 100px container, since the default <code>min-width: auto</code> prevents the item from shrinking below its content\'s natural width, overriding what <code>flex: 1</code>\'s shrink behavior would otherwise do.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>flex: 1</code> (or any flex-shrink value) guarantees an item will shrink to fit within its flex container, no matter what content it holds.',
      reality: 'flex-shrink is capped by the item\'s minimum size, which defaults to <code>min-width: auto</code> — content-based, not zero. Unbreakable content can force the item wider than its container despite flex-shrink being set.'
    },
    {
      thought: 'Flex item overflow bugs like this only happen with genuinely huge content — normal text is safe.',
      reality: 'Anything unbreakable is enough to trigger it — a long filename, an unbroken URL, or any <code>white-space: nowrap</code> text can silently overflow a layout that looked fine with short placeholder text during development.'
    },
    {
      thought: 'The fix for this requires setting a specific pixel min-width value tailored to the content.',
      reality: '<code>min-width: 0</code> is the standard, universal fix — it simply removes the automatic content-based minimum, letting flex-shrink behave exactly as declared without needing to calculate any specific value.'
    }
  ];
}
