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
  templateUrl: './non-inherited-properties-dont-flow-to-children-without-explicit-inherit.html',
  styleUrl: './non-inherited-properties-dont-flow-to-children-without-explicit-inherit.scss'
})
export class NonInheritedPropertiesDontFlowToChildrenWithoutExplicitInheritSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A parent\'s border and padding never reach its children automatically — only a specific, short list of properties (mostly text-related) inherit by default',
      points: [
        'CSS properties are individually classified as either "inherited" or "not inherited" by the specification. <code>color</code>, <code>font-family</code>, <code>font-size</code>, and <code>line-height</code> are inherited. <code>border</code>, <code>padding</code>, <code>margin</code>, <code>background</code>, and <code>display</code> are NOT.',
        'A child of an element with <code>border: 5px solid red; padding: 20px;</code> does not receive any border or padding at all — it computes those properties from scratch, using each property\'s own INITIAL value (0 / none), completely independent of what the parent declared.',
      ]
    },
    {
      heading: 'This is directly measurable: reading a child\'s own computed border/padding shows the initial value (0px), while its computed color correctly shows the parent\'s inherited value',
      points: [
        'A parent has <code>border: 5px solid red</code>, <code>padding: 20px</code>, and <code>color: blue</code> — one non-inherited layout property, one non-inherited spacing property, and one inherited text property, all declared at once.',
        'A plain, unstyled child inside it reports <code>getComputedStyle().borderTopWidth === "0px"</code> and <code>paddingTop === "0px"</code> (neither inherited — both reset to initial), while <code>color</code> correctly reports <code>"rgb(0, 0, 255)"</code> — matching the parent exactly, since color IS inherited by default.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>non-inherited properties don't flow to children</title>
    <style>
      .parent { border: 5px solid red; padding: 20px; color: blue; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div class="parent">
      <div id="child">Plain child, no CSS of its own</div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const child = document.querySelector<HTMLElement>('#child')!;
const style = getComputedStyle(child);

console.log('child border-top-width:', style.borderTopWidth, '(parent has 5px solid red)');
console.log('child padding-top:', style.paddingTop, '(parent has 20px)');
console.log('child color:', style.color, '(parent has blue)');

console.log('border and padding did NOT inherit -- child shows initial (0):', style.borderTopWidth === '0px' && style.paddingTop === '0px');
console.log('color DID inherit -- child matches the parent:', style.color === 'rgb(0, 0, 255)');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A design system defines a reusable <code>.panel</code> class with <code>border: 1px solid #e2e8f0; border-radius: 8px;</code> intending every nested <code>.panel-section</code> inside it to automatically pick up the same border style. Does it?',
    hint: 'Ask whether border is one of the small set of properties that inherit by default, or one of the majority that don\'t.',
    solution: 'No — border is not an inherited property, so .panel-section elements get NO border at all unless one is explicitly declared on them (or forced with border: inherit;). This is a common surprise for developers assuming visual/layout properties behave like text properties (color, font-family), which DO inherit.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Most CSS properties inherit by default — only a few special ones like margin and padding are exceptions.',
      reality: 'It\'s the opposite: only a relatively SHORT, specific list of mostly text/typography-related properties inherit by default (color, font-*, line-height, text-align, visibility, cursor, and a handful of others). The majority of CSS properties — especially layout and box-model properties — do not inherit.'
    },
    {
      thought: 'A child NOT showing the parent\'s border/padding must mean there\'s a CSS specificity conflict overriding it somewhere, or a reset stylesheet is interfering.',
      reality: 'No conflict or reset needed to explain it — this is simply the default, expected behavior for non-inherited properties. The child was never going to receive the parent\'s border/padding in the first place, regardless of any other CSS in the codebase.'
    },
    {
      thought: 'The fix for wanting a child to share a parent\'s non-inherited property is to duplicate the exact same declaration on the child.',
      reality: 'Duplicating the value works but creates a maintenance burden (two places to update). Using border: inherit; (or the specific property with the inherit keyword) explicitly ties the child\'s value to whatever the parent currently has, staying in sync automatically if the parent changes.'
    }
  ];
}
