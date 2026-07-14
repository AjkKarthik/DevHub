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
  templateUrl: './container-queries-silently-do-nothing-without-container-type.html',
  styleUrl: './container-queries-silently-do-nothing-without-container-type.scss'
})
export class ContainerQueriesSilentlyDoNothingWithoutContainerTypeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'An @container rule with no container-type ancestor doesn\'t error — it just never fires, silently',
      points: [
        '<code>@container (min-width: 400px) { ... }</code> needs SOME ancestor with <code>container-type</code> set to establish the measurement context it reads from. Without one, there is nothing for the query to measure against.',
        'There is no console warning, no CSS validation error, nothing visibly broken in DevTools\' rule list — the declaration is valid CSS, it simply describes a condition that can never be evaluated, so its styles are permanently inactive.',
      ]
    },
    {
      heading: 'This is directly checkable — the exact same @container rule produces different computed styles depending only on whether an ancestor has container-type set',
      points: [
        'Two identical DOM structures with the identical <code>@container (min-width: 400px)</code> rule targeting a child: one wrapped in a plain <code>&lt;div&gt;</code>, one wrapped in a <code>&lt;div&gt;</code> with <code>container-type: inline-size</code>.',
        'Reading <code>getComputedStyle()</code> on the child in each case shows the query-applied style ONLY in the container-type case — proving the query genuinely never activates without it, rather than just "usually" needing it.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>container queries do nothing without container-type</title>
    <style>
      .wrapper-no-type { width: 500px; }
      .wrapper-with-type { width: 500px; container-type: inline-size; }
      .child { color: rgb(0, 0, 0); }
      @container (min-width: 400px) {
        .child { color: rgb(255, 0, 0); }
      }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div class="wrapper-no-type"><div class="child" id="childNoType">text</div></div>
    <div class="wrapper-with-type"><div class="child" id="childWithType">text</div></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const childNoType = document.querySelector<HTMLElement>('#childNoType')!;
const childWithType = document.querySelector<HTMLElement>('#childWithType')!;

const colorNoType = getComputedStyle(childNoType).color;
const colorWithType = getComputedStyle(childWithType).color;

console.log('child color, ancestor has NO container-type:', colorNoType);
console.log('child color, ancestor HAS container-type: inline-size:', colorWithType);
console.log('the identical @container rule only activates with a container-type ancestor:', colorNoType !== colorWithType);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes a card component with <code>@container (min-width: 400px) { .card { grid-template-columns: 160px 1fr; } }</code> and tests it in a 600px-wide page. The 2-column layout never appears — no console error either. What is the most likely cause?',
    hint: 'Ask whether any ancestor of .card actually has container-type set — the viewport being wide enough is irrelevant to a container query.',
    solution: 'Almost certainly a missing container-type on an ancestor (usually the direct wrapper). Without it, @container has no containment context to measure, so the rule is valid CSS but permanently inactive — no error, it just silently never applies, regardless of how wide the actual page or viewport is.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a @container rule doesn\'t work, there\'s probably a syntax error somewhere — the browser would show something in DevTools if a required setup step were missing.',
      reality: 'A missing container-type produces no warning at all. The @container rule is syntactically valid CSS on its own; it simply has no containment context to evaluate against, so it silently never matches.'
    },
    {
      thought: 'container-type only matters for using cqw/cqh units — a plain min-width/max-width @container query should work off the parent\'s normal CSS width.',
      reality: 'Every form of @container query — size-based, style-based — requires an ancestor with container-type. There is no container-type-free way to use @container at all.'
    },
    {
      thought: 'Any ancestor somewhere up the tree having container-type should be enough, no matter how far up.',
      reality: 'It works with the NEAREST container-type ancestor by default (or a specifically named one via container-name) — but the fundamental requirement is still that SOME such ancestor exists at all. A page with zero container-type declarations anywhere means every @container rule on it is dead code.'
    }
  ];
}
