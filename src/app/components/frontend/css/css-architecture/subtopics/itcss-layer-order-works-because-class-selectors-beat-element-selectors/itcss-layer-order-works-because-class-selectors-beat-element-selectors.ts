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
  templateUrl: './itcss-layer-order-works-because-class-selectors-beat-element-selectors.html',
  styleUrl: './itcss-layer-order-works-because-class-selectors-beat-element-selectors.scss'
})
export class ItcssLayerOrderWorksBecauseClassSelectorsBeatElementSelectorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'ITCSS\'s "safe to write files in this order" claim works even WITHOUT cascade layers, because each successive layer genuinely uses higher-specificity selector TYPES',
      points: [
        'The Generic layer (resets, normalize) sticks to element and universal selectors (<code>*</code>, <code>body</code>, <code>h1</code>) — specificity 0,0,1 or 0,0,0.',
        'The Components layer (BEM blocks) uses class selectors (<code>.card</code>, <code>.btn</code>) — specificity 0,1,0, genuinely higher than any element selector. This isn\'t a convention the developer has to remember to enforce — it\'s a structural fact of ordinary CSS specificity rules.',
      ]
    },
    {
      heading: 'This is directly measurable: even declaring the Generic-layer rule LAST in the stylesheet (the "wrong" file order) does not let it override the earlier Components-layer rule',
      points: [
        'A Components-layer class selector (<code>.card { color: black; }</code>) is declared FIRST, followed by a Generic-layer element selector (<code>div { color: red; }</code>) declared SECOND, targeting the same element.',
        'Reading <code>getComputedStyle().color</code> shows the class selector still wins — the class selector\'s higher specificity protects it from being overridden by a later, lower-specificity rule, regardless of source order.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>ITCSS layer order works because class beats element selectors</title>
    <style>
      /* "Components" layer -- class selector, declared FIRST (correct ITCSS order) */
      div.card { color: rgb(0, 0, 0); }

      /* "Generic" layer -- element selector, declared LAST (deliberately "wrong" order for this test) */
      div { color: rgb(255, 0, 0); }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div class="card" id="cardEl">Card text</div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const el = document.querySelector<HTMLElement>('#cardEl')!;
const color = getComputedStyle(el).color;

console.log('final computed color:', color);
console.log('the class selector (Components layer) won even though the element selector (Generic layer) was declared LATER:', color === 'rgb(0, 0, 0)');
console.log('this is pure specificity -- class (0,1,0) beats element (0,0,1) regardless of declaration order.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A build tool accidentally concatenates ITCSS files out of order — the Generic reset stylesheet ends up loaded AFTER the Components stylesheet instead of before it. Does the reset accidentally override component styles that share the same element type?',
    hint: 'Ask whether the reset\'s selectors (element/universal) can out-specificity a component\'s class selectors, regardless of which file loaded last.',
    solution: 'No — a typical reset\'s element selectors (body, h1, *) have lower specificity than a component\'s class selectors, so even loaded out of order, the reset cannot override component-level class rules for the SAME property. (It could still affect properties the component never explicitly sets, since inheritance/cascade still applies normally — but it cannot override an explicitly-set component style.) This is exactly the structural insight ITCSS is built on, not just a stylistic convention.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ITCSS\'s layer ordering is purely a stylistic convention for readability — if the files happened to load in a different order, the resulting styles could genuinely break.',
      reality: 'While correct file order is still good practice (and required once you introduce Objects/Utilities using similarly-specific selectors), the Generic-vs-Components boundary specifically is protected by real specificity differences — element selectors structurally cannot override class selectors targeting the same property, load order or not.'
    },
    {
      thought: 'This means file order does not matter at all in ITCSS, since specificity always sorts things out correctly regardless of order.',
      reality: 'Specificity only protects boundaries where the selector TYPES genuinely differ in specificity (Generic vs Components). Within the SAME specificity tier — e.g. two different Components-layer class selectors, or two Utilities-layer class selectors — source order still fully determines the winner, so correct file order still matters there.'
    },
    {
      thought: 'Cascade layers (@layer) are required to make ITCSS actually work correctly — without them, the methodology doesn\'t reliably produce the intended override behavior.',
      reality: '@layer makes ITCSS\'s intent EXPLICIT and protects against same-specificity conflicts across layers (e.g. two class selectors, one in Components and one in Utilities) — but the core Generic-vs-Components boundary already worked correctly before @layer existed, purely from ordinary specificity rules.'
    }
  ];
}
