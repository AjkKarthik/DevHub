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
  templateUrl: './flex-basis-wins-over-width-when-both-are-set.html',
  styleUrl: './flex-basis-wins-over-width-when-both-are-set.scss'
})
export class FlexBasisWinsOverWidthWhenBothAreSetSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'When both width and flex-basis are set on the same flex item, flex-basis takes priority — width is effectively ignored for main-axis sizing',
      points: [
        'In a row-direction flex container, <code>flex-basis</code> plays the same conceptual role <code>width</code> normally would — it sets the item\'s starting main-axis size, before <code>flex-grow</code>/<code>flex-shrink</code> apply.',
        'When code sets both — e.g. <code>width: 100px; flex: 0 0 300px;</code> — the item renders at the <code>flex-basis</code> value (300px here), not the <code>width</code> value, because <code>flex-basis</code> specifically overrides <code>width</code> for main-axis sizing purposes inside a flex container.',
      ]
    },
    {
      heading: 'This is directly why the main page recommends the flex shorthand over separately declaring width',
      points: [
        'Writing <code>flex: 1 1 200px</code> avoids the conflict entirely, since there\'s only one main-axis sizing declaration for the browser to resolve, rather than two competing ones where a reader has to know the priority rule to predict the outcome.',
        'This priority is specific to the MAIN axis — if the container\'s <code>flex-direction</code> is <code>column</code>, the roles swap: <code>height</code> becomes the axis <code>flex-basis</code> competes with, while <code>width</code> behaves as an ordinary cross-axis size.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>flex-basis wins over width</title>
    <style>
      #container { display: flex; width: 500px; border: 2px solid #264de4; }
      #item { flex: 0 0 300px; width: 100px; background: #dbeafe; height: 40px; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="container">
      <div id="item">item</div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const item = document.querySelector<HTMLElement>('#item')!;

const actualWidth = item.getBoundingClientRect().width;
console.log('declared width: 100px');
console.log('declared flex-basis (via flex: 0 0 300px): 300px');
console.log('actual rendered width:', actualWidth);
console.log('flex-basis won over width:', actualWidth === 300);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A flex item inside a row-direction container has both <code>width: 150px</code> and <code>flex: 0 0 400px</code> declared. What is its actual rendered main-axis size?',
    hint: 'These two properties aren\'t summed or averaged — one specifically takes priority over the other for main-axis sizing in a flex container.',
    solution: '400px — the flex-basis value from the flex shorthand. width is effectively overridden for main-axis sizing whenever flex-basis is also set on the same item.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting both width and flex-basis (via the flex shorthand) on the same item is redundant but harmless — the browser just uses whichever value makes sense.',
      reality: 'It\'s not redundant — flex-basis specifically wins for main-axis sizing, silently overriding whatever width was declared. This can cause a genuinely confusing bug when width was set for a reason and flex-basis quietly overrides it.'
    },
    {
      thought: 'The width property is completely ignored whenever an item is inside any flex container, regardless of flex-direction.',
      reality: 'It\'s only overridden for MAIN-axis sizing. In a column-direction container, width behaves as an ordinary cross-axis size and is not overridden — it\'s height that competes with flex-basis instead.'
    },
    {
      thought: 'To avoid this conflict, you should always set width AND the flex shorthand together to be explicit about the intended size.',
      reality: 'The simpler, main-page-recommended fix is the opposite — use ONLY the flex shorthand\'s basis value (e.g. flex: 1 1 200px) and skip declaring width at all, removing the conflict rather than trying to manage two competing declarations.'
    }
  ];
}
