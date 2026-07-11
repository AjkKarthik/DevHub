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
  templateUrl: './nesting-adds-zero-specificity-ties-are-broken-by-source-order.html',
  styleUrl: './nesting-adds-zero-specificity-ties-are-broken-by-source-order.scss'
})
export class NestingAddsZeroSpecificityTiesAreBrokenBySourceOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A nested rule and its flat equivalent have IDENTICAL specificity — nesting is purely an authoring convenience, never a priority boost',
      points: [
        '<code>.card { .title { color: blue; } }</code> and <code>.card .title { color: blue; }</code> both compute to exactly the same specificity value (two classes, 0-2-0) — the nested syntax does not add any extra weight for the act of nesting itself.',
        'This means the usual specificity rules still fully apply to nested code — a more specific flat selector written elsewhere can still override a nested rule, and vice versa, exactly as if neither were nested at all.',
      ]
    },
    {
      heading: 'This is directly measurable by forcing a genuine specificity TIE — when a nested rule and a flat rule have equal specificity, the winner is decided purely by normal source order, proving nesting contributed no hidden extra weight',
      points: [
        'A nested <code>.card { .title { color: black; } }</code> rule is declared FIRST, followed by an equally-specific flat <code>.card .title { color: red; }</code> rule declared SECOND.',
        'Reading <code>getComputedStyle()</code> shows the LATER, flat rule wins — exactly the normal "last rule wins a tie" behavior for two equally-specific selectors, confirming the earlier nested rule carried no extra priority from being nested.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>nesting adds zero specificity</title>
    <style>
      /* Nested rule, declared FIRST */
      .card {
        .title { color: rgb(0, 0, 0); }
      }

      /* Equally-specific FLAT rule, declared SECOND */
      .card .title { color: rgb(255, 0, 0); }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div class="card">
      <div class="title" id="title">text</div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const el = document.querySelector<HTMLElement>('#title')!;
const color = getComputedStyle(el).color;

console.log('final computed color:', color);
console.log('the LATER flat rule won the tie, exactly like two equally-specific flat rules would:', color === 'rgb(255, 0, 0)');
console.log('if nesting added any extra specificity, the EARLIER nested rule (black) would have won instead -- it did not.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A component uses nested CSS: <code>.card { .title { color: navy; } }</code>. A later utility stylesheet adds a flat rule: <code>.card .title { color: green; }</code>. Which color wins, assuming both files load in that order?',
    hint: 'Ask whether the earlier rule being "nested" gives it any specificity advantage over the later flat rule with the identical selector.',
    solution: 'Green wins. Both selectors compute to the exact same specificity (two classes), so this is a genuine tie — and ties are broken by source order, with the LATER declaration winning. Nesting gave the navy rule zero advantage; if anything, being declared first actually put it at a disadvantage in the tie-break.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since nested CSS looks visually "contained" within its parent, it should behave like it has some kind of scoping priority over unrelated flat rules targeting the same elements.',
      reality: 'Nesting has no scoping or priority effect at all beyond what the equivalent flat selector would produce — it computes to the identical specificity value and participates in the cascade exactly like ordinary flat CSS.'
    },
    {
      thought: 'Writing more deeply nested rules should make selectors progressively "more specific" the deeper the nesting goes, similar to how longer selector chains increase specificity.',
      reality: 'Specificity comes from the actual selector components (classes, IDs, pseudo-classes, tag names) that appear in the expanded selector — not from how many levels of source-code nesting were used to write it. A 2-level-deep nested rule and the same rule written flat have identical specificity.'
    },
    {
      thought: 'If a nested rule isn\'t winning over a flat rule targeting the same element, the fix should be to nest it MORE deeply or restructure the nesting.',
      reality: 'Restructuring the nesting depth changes nothing about specificity — the fix for a losing tie is the same as with any flat CSS: increase actual selector specificity, use a layer, reorder source position, or (as a last resort) use !important.'
    }
  ];
}
