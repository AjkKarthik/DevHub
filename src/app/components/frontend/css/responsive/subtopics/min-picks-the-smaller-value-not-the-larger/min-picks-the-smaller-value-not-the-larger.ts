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
  templateUrl: './min-picks-the-smaller-value-not-the-larger.html',
  styleUrl: './min-picks-the-smaller-value-not-the-larger.scss'
})
export class MinPicksTheSmallerValueNotTheLargerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'width: min(100%, 600px) resolves to whichever argument is CURRENTLY smaller — the winner can switch as the container resizes',
      points: [
        '<code>min()</code> evaluates every argument at layout time and takes the smallest — it is not "prefer the second value" or "cap at the second value only past a threshold," it is a direct, continuous comparison re-evaluated whenever anything the arguments depend on changes.',
        'In a container narrower than 600px, <code>100%</code> is the smaller value, so the element fills the container exactly. Once the container grows past 600px, <code>600px</code> becomes the smaller value, and the element stops growing — this is precisely the common "full width but never more than 600px" pattern.',
      ]
    },
    {
      heading: 'This is directly measurable: the same element\'s rendered width tracks whichever argument is smaller at each container width, not a fixed formula',
      points: [
        'Placing the same <code>min(100%, 600px)</code> element inside containers of different widths (e.g. 400px and 900px) and reading <code>getBoundingClientRect().width</code> on each shows two DIFFERENT winning arguments — 100% wins in the narrow container (400px), 600px wins in the wide one, confirming the comparison is genuinely dynamic, not a compile-time decision.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>min() picks the smaller value</title>
    <style>
      #narrowContainer { width: 400px; }
      #wideContainer { width: 900px; }
      .box { width: min(100%, 600px); height: 20px; background: #264de4; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="narrowContainer"><div class="box" id="boxInNarrow"></div></div>
    <div id="wideContainer"><div class="box" id="boxInWide"></div></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const boxInNarrow = document.querySelector<HTMLElement>('#boxInNarrow')!;
const boxInWide = document.querySelector<HTMLElement>('#boxInWide')!;

const narrowWidth = boxInNarrow.getBoundingClientRect().width;
const wideWidth = boxInWide.getBoundingClientRect().width;

console.log('same rule: width: min(100%, 600px)');
console.log('inside a 400px container -> actual width:', narrowWidth, '(100% won, since 400 < 600)');
console.log('inside a 900px container -> actual width:', wideWidth, '(600px won, since 600 < 900)');
console.log('the winning argument genuinely switched between the two containers:', narrowWidth !== wideWidth);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An element has <code>width: min(100%, 600px)</code>. Its container is exactly 500px wide. What is the element\'s rendered width?',
    hint: 'Compare the two argument values AT that container width — 100% of 500px is 500px. Which of the two candidate values is actually smaller?',
    solution: '500px — since 100% of a 500px container (500px) is smaller than the fixed 600px argument, min() picks 500px. Once the container grows past 600px, the fixed value would take over instead.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'min(100%, 600px) means "600px is the target, but shrink to 100% if the container is smaller" — treating 600px as the primary value.',
      reality: 'Neither argument is primary — min() is a symmetric comparison that always picks whichever is smaller at that moment, with no inherent preference for either argument\'s position.'
    },
    {
      thought: 'The winning argument in a min()/max() expression is decided once, when the CSS is written, based on which value "looks" like it should apply.',
      reality: 'It\'s re-evaluated continuously at layout time — the same rule can resolve differently for the exact same element if its container is resized, with no re-declaration needed.'
    },
    {
      thought: 'min(100%, 600px) and max-width: 600px; width: 100%; always produce identical results.',
      reality: 'They usually produce the same visual outcome, but min() is a single expression usable directly as a value anywhere a length is accepted (inside calc(), as a grid-template-columns track, etc.), while max-width + width requires two separate property declarations only usable together as box-sizing properties.'
    }
  ];
}
