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
  templateUrl: './first-encountered-layer-block-sets-its-position-not-declaration-order.html',
  styleUrl: './first-encountered-layer-block-sets-its-position-not-declaration-order.scss'
})
export class FirstEncounteredLayerBlockSetsItsPositionNotDeclarationOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A named layer\'s position is fixed the moment the browser FIRST sees it — whichever form comes first, a bare block or the explicit order statement',
      points: [
        'Writing <code>@layer components { ... }</code> as a filled-in block BEFORE an explicit <code>@layer base, components, utilities;</code> order statement doesn\'t wait for that later statement to decide where "components" belongs — the block itself registers "components" the moment it\'s parsed, at the lowest available position.',
        'When the later order statement runs, it only APPENDS the layers it mentions that haven\'t been registered yet — "components" already has a fixed position, so it stays where the block first put it, ending up BELOW "base" and "utilities" even though the order statement lists it in the middle.',
      ]
    },
    {
      heading: 'This is directly measurable: base wins over components in a specific reversed setup, revealing that source order of the FIRST mention — not the explicit list\'s stated order — determined the actual priority',
      points: [
        'A layer block for <code>components</code> is written first (before any order statement), followed by <code>@layer base, components, utilities;</code>, followed by rules in <code>base</code>.',
        'Even though the order statement lists <code>components</code> AFTER <code>base</code>, reading <code>getComputedStyle()</code> shows <code>base</code>\'s rule winning over <code>components</code>\'s — proving components was already locked into the lowest position before the order statement ever ran.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>first encountered layer sets its position</title>
    <style>
      /* "components" is filled in as a block FIRST -- this alone registers its position */
      @layer components {
        .target { color: rgb(0, 0, 0); }
      }

      /* This order statement is too late to move "components" --
         it only appends "base" and "utilities" after the already-registered "components" */
      @layer base, components, utilities;

      @layer base {
        .target { color: rgb(255, 0, 0); }
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
console.log('base won even though the order statement lists components AFTER base:', color === 'rgb(255, 0, 0)');
console.log('components was locked into the lowest position by its first (block) appearance, before the order statement ran.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A CSS file starts with <code>@layer components { .btn { padding: 1rem; } }</code>, then later has <code>@layer reset, base, components, utilities;</code>. A developer expects "components" to rank third (as listed). Where does it actually rank?',
    hint: 'Ask which statement or block the browser processes FIRST in source order — not which one states the "intended" order.',
    solution: 'It ranks LOWEST — first position, below even "reset". The block filling in .btn styles appears before the order statement in source order, so it registers "components" immediately at that point. The later order statement can only append the layers it mentions that are not yet registered, so "reset", "base", and "utilities" get appended after "components" — completely different from the developer\'s intended ranking.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The explicit @layer order statement (e.g. @layer reset, base, components, utilities;) always defines the final layer order, no matter where it appears in the file.',
      reality: 'It only defines the order for layers it mentions that haven\'t already been registered by an earlier block or statement. A layer\'s position is fixed at its FIRST appearance in source order — the explicit order statement is just one way a layer can first appear, not a special override.'
    },
    {
      thought: 'Writing @layer name { ... } to fill in a layer\'s actual styles should be independent from declaring that layer\'s priority — priority only comes from the order statement.',
      reality: 'A filled-in block is just as capable of registering a layer\'s position as the bare order statement is. If the block comes first in the file, IT decides the layer\'s position — the order statement coming later has no power to move it.'
    },
    {
      thought: 'This is a rare mistake that only happens with deliberately unusual code — most real projects wouldn\'t hit it.',
      reality: 'It\'s an easy, realistic mistake: forgetting to put the @layer order statement at the very top of a file (or importing a partial file that defines a layer\'s content before the main stylesheet declares the intended order) silently produces this exact scenario.'
    }
  ];
}
