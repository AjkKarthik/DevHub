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
  templateUrl: './unlayered-styles-always-beat-every-layer-regardless-of-specificity.html',
  styleUrl: './unlayered-styles-always-beat-every-layer-regardless-of-specificity.scss'
})
export class UnlayeredStylesAlwaysBeatEveryLayerRegardlessOfSpecificitySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A one-element-selector unlayered rule beats a triple-ID-and-class selector inside a layer — specificity simply doesn\'t get compared',
      points: [
        'Cascade layers add a priority level ABOVE specificity. When comparing a layered rule to an unlayered rule, the browser never even reaches the specificity-comparison step — the unlayered/layered distinction alone decides the winner.',
        'This means a stray, low-specificity unlayered rule (e.g. leftover legacy CSS, or an accidentally un-wrapped style block) can silently override even the most carefully specificity-boosted rule inside your highest-priority layer.',
      ]
    },
    {
      heading: 'This is directly measurable: an extremely low-specificity unlayered selector wins over a deliberately over-specific layered selector targeting the same element',
      points: [
        'A layered rule using <code>#id.class.class</code> (very high specificity) sets one color; a plain unlayered <code>p.class</code> rule (much lower specificity) sets a different color on the exact same element.',
        'Reading <code>getComputedStyle().color</code> shows the LOW-specificity unlayered rule\'s color, not the high-specificity layered rule\'s — directly confirming the layer/unlayered priority level overrides specificity entirely, not just usually or in most cases.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>unlayered styles always beat every layer</title>
    <style>
      /* Deliberately over-specific rule, placed inside a layer */
      @layer utilities {
        #target.target.target { color: rgb(255, 0, 0); }
      }

      /* Deliberately low-specificity rule, NOT inside any layer */
      p.target { color: rgb(0, 0, 255); }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <p id="target" class="target">This text's color is determined by the layer system, not specificity.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const el = document.querySelector<HTMLElement>('#target')!;
const color = getComputedStyle(el).color;

console.log('final computed color:', color);
console.log('the LOW-specificity unlayered rule (blue) won over the HIGH-specificity layered rule (red):', color === 'rgb(0, 0, 255)');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adopts @layer for all new components, wrapping everything in @layer components, utilities. Six months later, a developer notices one old, unlayered CSS file (never migrated) is overriding a carefully layered utility class, even though the utility selector has much higher specificity. Why?',
    hint: 'Ask which comparison happens first — layer priority, or specificity — when one rule is layered and the other isn\'t.',
    solution: 'Unlayered styles always win over ANY layered style, no matter how high that layered style\'s specificity is. The old unlayered file, left un-migrated, automatically outranks every layer in the new system. The fix is to either move that legacy file into a (low-priority) layer, or accept its authority and use it intentionally as a final-override safety net.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a layered rule has much higher specificity than an unlayered rule targeting the same property, the layered rule should still win because specificity is specificity.',
      reality: 'The layer/unlayered priority level is checked BEFORE specificity is ever compared. An unlayered rule beats a layered rule regardless of how specific either selector is — specificity only matters for breaking ties WITHIN the same layer (or both unlayered).'
    },
    {
      thought: 'Adopting cascade layers for a codebase is risky because it might immediately change how a lot of existing CSS behaves.',
      reality: 'It\'s actually the opposite — leaving existing CSS unlayered means it automatically keeps winning over anything newly added inside layers, which is exactly why layers are considered safe to adopt incrementally: old code keeps its current (highest) priority by default.'
    },
    {
      thought: 'A CSS reset or utility framework wrapped in the highest-priority layer should be able to override literally anything else on the page.',
      reality: 'Not if any of the "anything else" is unlayered — an unlayered rule, even an old, low-specificity, accidental one, always outranks the entire layer system. A layer-based override strategy only works if ALL the CSS you want to control participates in the layer system.'
    }
  ];
}
