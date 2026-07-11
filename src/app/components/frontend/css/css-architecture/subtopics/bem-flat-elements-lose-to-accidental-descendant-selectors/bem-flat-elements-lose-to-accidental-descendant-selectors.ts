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
  templateUrl: './bem-flat-elements-lose-to-accidental-descendant-selectors.html',
  styleUrl: './bem-flat-elements-lose-to-accidental-descendant-selectors.scss'
})
export class BemFlatElementsLoseToAccidentalDescendantSelectorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'BEM\'s "flat specificity" guarantee (every rule at 0,1,0) only holds if EVERY selector actually follows the convention — one stray descendant selector breaks it',
      points: [
        'A properly-written BEM element like <code>.card__title { }</code> has specificity 0,1,0 — one class, nothing more.',
        'If ANY other rule in the codebase accidentally targets the same element with a descendant selector — <code>.card .title { }</code> — that rule has specificity 0,2,0, genuinely HIGHER than the flat BEM rule, regardless of which one is declared first or last in the source.',
      ]
    },
    {
      heading: 'This is directly measurable: an element carrying both a flat BEM class and a class matched by a descendant selector is styled by the HIGHER-specificity descendant rule, even when the BEM rule is declared afterward',
      points: [
        'An element has both <code>card__title</code> (matched by the flat BEM rule) and <code>title</code> (matched by the descendant rule <code>.card .title</code>) in its class list.',
        'Reading <code>getComputedStyle().color</code> shows the DESCENDANT rule\'s color wins — confirming that specificity, not BEM convention or declaration order, is what the browser actually uses to resolve the conflict.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>BEM flat elements lose to accidental descendant selectors</title>
    <style>
      /* Correct, flat BEM element rule -- declared FIRST */
      .card__title { color: rgb(0, 0, 0); }

      /* An accidental descendant selector elsewhere in the codebase,
         perhaps from an older, non-BEM stylesheet -- declared SECOND */
      .card .title { color: rgb(255, 0, 0); }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div class="card">
      <div class="card__title title" id="titleEl">Card Title</div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const el = document.querySelector<HTMLElement>('#titleEl')!;
const color = getComputedStyle(el).color;

console.log('final computed color:', color);
console.log('the higher-specificity descendant selector won, not the flat BEM class:', color === 'rgb(255, 0, 0)');
console.log('this happened even though the flat BEM rule was declared FIRST in the stylesheet.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team migrates a legacy stylesheet to BEM. They add <code>.card__title { color: navy; }</code> as the new, correct rule. An old, not-yet-removed rule <code>.card .title { color: red; }</code> still exists elsewhere and happens to target the same element (which still carries the old "title" class for backward compatibility). Which color renders?',
    hint: 'Ask which selector has higher specificity — not which one was written more recently or follows the "correct" convention.',
    solution: 'Red — the old descendant selector wins, because 0,2,0 genuinely beats 0,1,0 regardless of which rule is "correct" by convention or which was declared more recently. BEM\'s flat-specificity promise is only as strong as the codebase\'s actual discipline — a single leftover descendant selector can silently defeat it. The fix is removing the old selector entirely, not just adding the new BEM one.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'BEM class selectors have some kind of built-in priority over descendant selectors, since BEM is specifically designed to avoid specificity problems.',
      reality: 'BEM is a NAMING CONVENTION, not a browser-enforced priority system. A .card__title class selector and a .card .title descendant selector are compared using the exact same, ordinary CSS specificity rules as any other selectors — BEM just encourages writing selectors that naturally stay flat.'
    },
    {
      thought: 'As long as new code follows BEM correctly, any old non-BEM CSS elsewhere in the codebase can safely coexist without causing problems.',
      reality: 'Old descendant selectors can silently override new, correctly-written BEM rules if they happen to target overlapping elements — BEM discipline only delivers its "predictable, flat specificity" benefit when it is the ONLY selector pattern acting on a given element, not merely present alongside legacy patterns.'
    },
    {
      thought: 'This kind of conflict would be obvious and easy to spot during code review, since the two conflicting rules are visually very different (one uses BEM, one doesn\'t).',
      reality: 'In a large, multi-file codebase the two rules may be hundreds of lines or several files apart, making the conflict genuinely hard to spot by inspection — the browser\'s DevTools computed-style panel (or an approach like this subtopic\'s getComputedStyle() check) is the reliable way to confirm which rule actually won.'
    }
  ];
}
