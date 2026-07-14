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
  templateUrl: './composable-modifiers-merge-by-source-order-not-special-priority.html',
  styleUrl: './composable-modifiers-merge-by-source-order-not-special-priority.scss'
})
export class ComposableModifiersMergeBySourceOrderNotSpecialPrioritySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two independent BEM modifiers on the same element (class="btn btn--primary btn--sm") merge their DIFFERENT properties automatically, and use plain CSS source order for any SHARED property',
      points: [
        'When <code>.btn--primary</code> sets <code>background-color</code> and <code>.btn--sm</code> sets <code>padding</code>, both apply together with zero conflict — each modifier owns a different property, so there is nothing to resolve.',
        'If both modifiers happen to set the SAME property (e.g. both declare <code>font-size</code>), there is no special "BEM modifier priority" rule — it is resolved exactly like any two same-specificity class selectors: whichever is declared LATER in the stylesheet source wins.',
      ]
    },
    {
      heading: 'This is directly measurable — reading the computed styles for each property confirms both modifiers\' non-conflicting properties survive, while their shared property resolves purely to whichever was declared last',
      points: [
        'An element with both <code>.btn--primary</code> (setting background-color AND font-size) and <code>.btn--sm</code> (setting font-size AND padding) applied together shows the background-color from <code>--primary</code> and the padding from <code>--sm</code> — both survive untouched.',
        'For the SHARED <code>font-size</code> property, the computed value matches whichever modifier class was declared LATER in the stylesheet — confirmed directly via <code>getComputedStyle()</code>, with the HTML class attribute\'s own left-to-right order having no effect on the outcome at all.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>composable modifiers merge by source order</title>
    <style>
      .btn--primary { background-color: rgb(38, 77, 228); font-size: 16px; }
      .btn--sm { font-size: 12px; padding: 4px; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <button class="btn--primary btn--sm" id="btnEl">Save</button>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const el = document.querySelector<HTMLElement>('#btnEl')!;
const style = getComputedStyle(el);

console.log('background-color (only set by --primary):', style.backgroundColor);
console.log('padding (only set by --sm):', style.padding);
console.log('font-size (set by BOTH modifiers):', style.fontSize);

console.log('non-conflicting properties both survive:',
  style.backgroundColor === 'rgb(38, 77, 228)' && style.padding === '4px');
console.log('the shared font-size property resolved to --sm\\'s value (12px), since --sm was declared LATER in the stylesheet:',
  style.fontSize === '12px');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A button uses <code>class="btn btn--sm btn--lg"</code> (both size modifiers applied, perhaps by an accidental duplicate class binding in a component). <code>.btn--sm</code> is declared before <code>.btn--lg</code> in the stylesheet. Which size wins?',
    hint: 'Ask whether the HTML class ORDER matters, or the CSS declaration order.',
    solution: '.btn--lg wins, since it is declared LATER in the CSS source — the order the classes appear in the HTML class attribute (sm before lg) has no bearing on the outcome at all. This is a good illustration of why accidentally applying two conflicting same-specificity modifiers is a real bug risk: the result depends on file order, not anything visible in the component\'s own markup.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The order classes are listed in the HTML class attribute (class="btn--primary btn--sm" vs class="btn--sm btn--primary") determines which modifier wins a property conflict.',
      reality: 'The HTML class attribute order has ZERO effect on cascade resolution. Only the CSS declaration (source) order of the matching rules in the stylesheet(s) determines the winner for same-specificity conflicts.'
    },
    {
      thought: 'BEM modifiers are specifically designed so that combining any two of them always merges cleanly with no possible conflicts.',
      reality: 'Clean merging is only guaranteed when modifiers are designed to touch DIFFERENT properties (the BEM best practice). If two modifiers happen to both set the same property, it is an ordinary same-specificity CSS conflict, resolved by source order like any other.'
    },
    {
      thought: 'This kind of same-property modifier conflict is a purely theoretical concern that would never happen in a well-designed BEM system.',
      reality: 'It happens in practice whenever a design system grows two independently-conceived modifiers (e.g. a size scale and a density scale) that both end up touching the same property like font-size or padding — worth checking for explicitly when composing new modifier combinations.'
    }
  ];
}
