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
  templateUrl: './important-reverses-layer-priority-lower-layers-win.html',
  styleUrl: './important-reverses-layer-priority-lower-layers-win.scss'
})
export class ImportantReversesLayerPriorityLowerLayersWinSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: '!important inside a cascade layer flips the layer order upside down — the LOWEST-priority layer\'s !important rule wins',
      points: [
        'Without <code>!important</code>, later-declared layers beat earlier ones (a "utilities" layer declared last beats a "base" layer declared first).',
        'With <code>!important</code> on BOTH competing declarations, the relationship reverses: the EARLIEST-declared layer\'s <code>!important</code> rule now wins over the latest-declared layer\'s <code>!important</code> rule — the exact opposite of the normal, non-important layer order.',
      ]
    },
    {
      heading: 'This is directly measurable — swapping which layer has !important flips which color wins, with no other change to the CSS at all',
      points: [
        'With <code>@layer base, utilities;</code> declared, an <code>!important</code> rule in <code>base</code> (declared first, normally LOWEST priority) and an <code>!important</code> rule in <code>utilities</code> (declared last, normally HIGHEST priority) both target the same property.',
        'Reading <code>getComputedStyle()</code> shows <code>base</code>\'s color wins — directly confirming the reversal, since without <code>!important</code> this exact same setup would show <code>utilities</code> winning instead.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>important reverses layer priority</title>
    <style>
      @layer base, utilities;

      /* utilities is declared LAST -- normally the highest-priority layer */
      @layer utilities {
        .target { color: rgb(0, 0, 255) !important; }
      }

      /* base is declared FIRST -- normally the lowest-priority layer */
      @layer base {
        .target { color: rgb(0, 0, 0) !important; }
      }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div class="target" id="target">text</div>
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
console.log('base (normally LOWEST priority) won because both rules use !important:', color === 'rgb(0, 0, 0)');
console.log('without !important, utilities (declared last) would have won instead — the opposite result.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A "reset" layer (declared first, lowest normal priority) sets <code>[hidden] { display: none !important; }</code>. A "utilities" layer (declared last, highest normal priority) later sets <code>.always-show { display: block !important; }</code> on the same element. Which one actually applies?',
    hint: 'Ask which layer !important favors — the one declared first, or the one declared last.',
    solution: 'The reset layer\'s rule wins, since it was declared FIRST and both rules use !important — !important flips normal layer priority, favoring the earliest-declared layer. This is exactly why !important is recommended for "must never be overridden" reset patterns placed in an early layer, not for typical utility overrides that expect to win normally.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '!important should behave the same inside a layer as it always does — it just forces a rule to win over non-important rules, regardless of layer.',
      reality: '!important does force a win over non-important rules across layers, but among rules that ALL use !important, it additionally reverses which layer wins — the earliest-declared layer\'s !important rule beats the latest-declared layer\'s !important rule.'
    },
    {
      thought: 'Putting !important on a utility class in the highest-priority layer is a safe way to guarantee it always wins over everything else in the layer system.',
      reality: 'It only guarantees a win over non-important rules and lower layers\' non-important rules. If any EARLIER-declared layer also uses !important on the same property, that earlier layer\'s !important rule wins instead — the utilities layer\'s usual "declared last = highest priority" advantage is inverted for !important.'
    },
    {
      thought: 'This reversal behavior is an obscure edge case unlikely to matter in real projects.',
      reality: 'It\'s specifically useful and intentional for reset-style rules that must never be overridden (like [hidden] { display: none !important; } in an early "reset" layer) — understanding it prevents genuinely confusing bugs when !important is used more casually in a later utilities layer and unexpectedly loses.'
    }
  ];
}
