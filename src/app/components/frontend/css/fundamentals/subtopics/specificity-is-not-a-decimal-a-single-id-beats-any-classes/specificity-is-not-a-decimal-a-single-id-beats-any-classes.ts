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
  templateUrl: './specificity-is-not-a-decimal-a-single-id-beats-any-classes.html',
  styleUrl: './specificity-is-not-a-decimal-a-single-id-beats-any-classes.scss'
})
export class SpecificityIsNotADecimalASingleIdBeatsAnyClassesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A selector with TEN chained classes still loses to a selector with just ONE id — specificity is a tuple compared column by column, never added up into a single number',
      points: [
        'Specificity is scored as four separate counts — (inline, ID, class/attribute/pseudo-class, element) — compared LEFT TO RIGHT. The first column where the two selectors differ decides the winner; the remaining columns are never even considered.',
        '<code>.a.b.c.d.e.f.g.h.i.j</code> scores <code>(0,0,10,0)</code> — ten in the class column. <code>#id</code> scores <code>(0,1,0,0)</code> — one in the ID column. Comparing left to right: inline ties (0=0), then the ID column: 1 &gt; 0 — the ID selector wins immediately, and the fact that the other selector has ten classes in the NEXT column never gets checked at all.',
      ]
    },
    {
      heading: 'This is directly measurable: the exact ten-class-vs-one-ID matchup produces the ID rule\'s color, confirmed via getComputedStyle()',
      points: [
        'An element carries both a class list matching a rule with ten chained classes AND an <code>id</code> matching a rule with one ID selector — two rules, targeting the same property, with dramatically different selector complexity.',
        'Reading <code>getComputedStyle().color</code> shows the ID rule\'s color, not the ten-class rule\'s — direct proof that ID specificity is categorically higher, not just "usually higher" or "higher on average."',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>specificity is not a decimal — a single ID beats any number of classes</title>
    <style>
      /* Ten chained classes -- specificity (0,0,10,0) */
      .a.b.c.d.e.f.g.h.i.j { color: rgb(0, 0, 255); }

      /* A single ID -- specificity (0,1,0,0) */
      #myElement { color: rgb(255, 0, 0); }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="myElement" class="a b c d e f g h i j">This text's color settles the matchup.</div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const el = document.querySelector<HTMLElement>('#myElement')!;
const color = getComputedStyle(el).color;

console.log('final computed color:', color);
console.log('the single-ID rule (red) won over the ten-class rule (blue):', color === 'rgb(255, 0, 0)');
console.log('ten classes (0,0,10,0) never got close to beating one ID (0,1,0,0) -- the ID column alone decided it.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer, frustrated that <code>.card .header .title</code> (3 classes) isn\'t winning over a competing rule, adds MORE classes to the selector — eventually reaching 8 chained classes. The competing rule uses a single ID. Will adding more classes eventually win?',
    hint: 'Ask whether specificity works like counting points that add up, or like comparing separate categories where a higher category always wins first.',
    solution: 'No amount of additional classes will ever win — a selector with any number of classes, however large, cannot beat a single ID selector, because the comparison stops at the ID column the moment one selector has an ID and the other doesn\'t. The only ways to win are: use an ID too (not recommended), increase specificity in a way that changes the ID-column comparison, use a later cascade layer, or (as a last resort) !important.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Specificity works like a running point total — 10 classes should add up to enough "points" to eventually outweigh a single ID.',
      reality: 'Specificity is a 4-column TUPLE, never summed into one number. Ten classes only ever affect the class column; they can never spill over to affect or outweigh the ID column, no matter how many there are.'
    },
    {
      thought: 'This mental model mistake mostly matters for extreme, contrived cases (10+ classes) — realistic CSS rarely has enough classes chained together for it to matter.',
      reality: 'It matters at much smaller scales too — even 2 or 3 classes vs. a single ID follows the exact same rule. The "10 classes" example is just an extreme, unambiguous illustration of a rule that applies at any class count.'
    },
    {
      thought: 'Since IDs are so specificity-dominant, using an ID selector is a reliable, simple way to guarantee a style wins.',
      reality: 'It works, but it is exactly the anti-pattern the main page itself warns against — an ID-based rule becomes very hard to override later (only another ID, layers, or !important can beat it), which is why modern CSS guidance is to avoid ID selectors in stylesheets entirely and manage priority with classes and @layer instead.'
    }
  ];
}
