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
  templateUrl: './a-container-cannot-query-or-style-itself.html',
  styleUrl: './a-container-cannot-query-or-style-itself.scss'
})
export class AContainerCannotQueryOrStyleItselfSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The exact same @container rule, targeting both the container\'s own class and a descendant\'s class, only ever applies to the descendant',
      points: [
        'A container element measures itself and exposes that measurement to its DESCENDANTS via <code>@container</code> — it never reads its own query result to style itself, even if a matching selector is written inside the same <code>@container</code> block.',
        'This isn\'t a specificity or cascade issue — the rule for the container\'s own selector inside <code>@container</code> is simply never evaluated for that container at all, by design.',
      ]
    },
    {
      heading: 'This is directly checkable: writing one @container block with rules for BOTH the container\'s own class and a child\'s class shows the child\'s style apply while the container\'s own stays unchanged',
      points: [
        'Reading <code>getComputedStyle()</code> on the container element itself shows its BASE style, completely unaffected by the matching rule inside <code>@container</code> that targets its own class.',
        'Reading <code>getComputedStyle()</code> on its child, targeted by the SAME <code>@container</code> block with the SAME size condition, correctly shows the query-applied style — proving the restriction is specifically "no self-query", not a general problem with the query itself.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>a container cannot query or style itself</title>
    <style>
      .self-query-container {
        width: 500px;
        container-type: inline-size;
        color: rgb(0, 0, 0);
        background: rgb(255, 255, 255);
      }
      .self-query-child { color: rgb(0, 0, 0); }

      @container (min-width: 400px) {
        .self-query-container { color: rgb(255, 0, 0); }
        .self-query-child { color: rgb(255, 0, 0); }
      }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div class="self-query-container" id="container">
      <div class="self-query-child" id="child">text</div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const container = document.querySelector<HTMLElement>('#container')!;
const child = document.querySelector<HTMLElement>('#child')!;

const containerColor = getComputedStyle(container).color;
const childColor = getComputedStyle(child).color;

console.log('container\\'s own computed color (targeted by the SAME @container rule):', containerColor);
console.log('child\\'s computed color (targeted by the SAME @container rule):', childColor);
console.log('the container ignored the rule that targets itself:', containerColor === 'rgb(0, 0, 0)');
console.log('the child correctly picked up the query-applied style:', childColor === 'rgb(255, 0, 0)');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer sets <code>container-type: inline-size</code> on <code>.sidebar</code>, then writes <code>@container (min-width: 300px) { .sidebar { background: red; } }</code> hoping the sidebar itself turns red once it\'s wide enough. Does it work?',
    hint: 'Ask whether a container is allowed to read its own container-query result to style itself, or only allowed to expose that measurement to its descendants.',
    solution: 'No — a container can never query itself, regardless of how the selector is written. The rule for .sidebar inside its own @container block is simply never evaluated for .sidebar. To achieve this, the container-type has to move up one more level (a wrapping element around .sidebar becomes the container, and .sidebar becomes the thing being styled as a descendant).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A container should be able to query and style itself just like it can be queried by its children — it\'s the same @container block, after all.',
      reality: 'This is a fundamental restriction of the container query specification, not an oversight or a bug to work around with more specific selectors. A container only ever exposes its measurement outward to descendants, never reads it back onto itself.'
    },
    {
      thought: 'If self-styling with @container doesn\'t work, it must be a CSS specificity conflict — the base rule is probably winning over the @container rule.',
      reality: 'It\'s not a specificity fight. The rule targeting the container\'s own class inside @container is never evaluated for that element at all — it isn\'t a case of losing to a competing rule, it\'s a case of the rule never running.'
    },
    {
      thought: 'The workaround for wanting a container to respond to its own size is complicated — probably requires JavaScript with a ResizeObserver.',
      reality: 'The straightforward CSS-only fix is to add one more wrapping element around the element that needs to respond to its own size, move container-type onto that new wrapper, and let the original element become the descendant being styled — no JavaScript needed.'
    }
  ];
}
