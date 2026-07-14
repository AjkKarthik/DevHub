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
  templateUrl: './is-takes-highest-specificity-where-stays-zero.html',
  styleUrl: './is-takes-highest-specificity-where-stays-zero.scss'
})
export class IsTakesHighestSpecificityWhereStaysZeroSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: ':is(#id) genuinely inherits its argument\'s specificity — it can beat a class selector even when declared LATER shouldn\'t matter',
      points: [
        '<code>:is(#highId) { color: red; }</code> declared AFTER <code>.plainClass { color: blue; }</code> still wins, and it wins for the right reason: <code>:is()</code> takes on the specificity of its most specific argument (an ID, in this case), which genuinely outranks a class selector — not merely because it was declared later.',
        'This distinguishes a real specificity win from a coincidental source-order win — the only reliable way to tell them apart is testing whether the higher-specificity rule ALSO wins when placed EARLIER in source order (it should, if the win is really about specificity).',
      ]
    },
    {
      heading: ':where(#id) contributes exactly zero specificity — full stop, regardless of what\'s inside the parentheses',
      points: [
        'The exact same test with <code>:where(#highId)</code> instead of <code>:is(#highId)</code> produces the OPPOSITE result: the plain <code>.plainClass</code> rule wins, even though <code>:where()</code> was declared LAST (which would normally win a tie).',
        'This proves <code>:where()</code> contributes zero specificity regardless of its argument\'s own specificity — an ID inside <code>:where()</code> carries no more weight than an empty selector, exactly why it\'s recommended for base/reset styles that should be trivially overridable.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>:is() vs :where() specificity</title>
    <style>
      .plainClass { color: rgb(0, 0, 255); }
      :where(#highId) { color: rgb(255, 0, 0); }

      .plainClass2 { color: rgb(0, 0, 255); }
      :is(#highId2) { color: rgb(255, 0, 0); }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="highId" class="plainClass">tested with :where()</div>
    <div id="highId2" class="plainClass2">tested with :is()</div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const whereEl = document.querySelector<HTMLElement>('#highId')!;
const isEl = document.querySelector<HTMLElement>('#highId2')!;

console.log('Both rules use the SAME structure: a plain class rule declared FIRST, an ID-based rule declared LAST.');
console.log(':where(#highId) declared last -> actual color:', getComputedStyle(whereEl).color);
console.log('the plain .plainClass rule wins despite being declared first:',
  getComputedStyle(whereEl).color === 'rgb(0, 0, 255)');

console.log(':is(#highId2) declared last -> actual color:', getComputedStyle(isEl).color);
console.log('this time the ID-based rule wins, because :is() genuinely carries the ID specificity:',
  getComputedStyle(isEl).color === 'rgb(255, 0, 0)');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two rules target the same element: <code>.card { padding: 10px; }</code> declared first, then <code>:where(#uniqueId) { padding: 20px; }</code> declared last. Which padding value actually applies?',
    hint: 'Ask what specificity :where() contributes on its own, independent of what selector is written inside its parentheses.',
    solution: '10px — the .card rule wins. :where() always contributes zero specificity, so even an ID inside it carries no extra weight; the class selector genuinely has higher specificity and wins regardless of declaration order.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since :where() is declared later in a stylesheet, it will usually win ties against earlier rules, the same as any other CSS rule.',
      reality: 'Only when specificity is genuinely tied. :where() contributes ZERO specificity by design, so it loses to almost any other real selector regardless of source order — this is precisely its intended purpose.'
    },
    {
      thought: ':is() and :where() behave identically except for a cosmetic naming difference — pick whichever reads better.',
      reality: 'They differ in a functionally important way: :is() takes on real specificity from its arguments (and can win specificity battles), while :where() never does, regardless of what\'s inside it. Choosing the wrong one can create genuinely different override behavior.'
    },
    {
      thought: 'Testing whether a selector genuinely has higher specificity (versus just winning by source order) requires manually calculating specificity scores by hand.',
      reality: 'It\'s directly testable: declare the SUSPECTED higher-specificity rule LAST. If it still wins, that could be source order OR specificity — but if you ALSO test with the lower-specificity version declared last and it LOSES, that isolates the true specificity relationship.'
    }
  ];
}
