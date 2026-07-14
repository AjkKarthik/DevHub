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
  templateUrl: './container-type-size-collapses-height-without-explicit-sizing.html',
  styleUrl: './container-type-size-collapses-height-without-explicit-sizing.scss'
})
export class ContainerTypeSizeCollapsesHeightWithoutExplicitSizingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'container-type: size applies containment in BOTH axes — including block-size containment, which can collapse an element to zero height',
      points: [
        '<code>container-type: inline-size</code> only measures and contains the inline (width) axis — height still behaves normally, sizing to fit its content as usual.',
        '<code>container-type: size</code> contains BOTH axes. Block-size containment tells the browser the element\'s height should NOT depend on its children\'s height — without an explicit height set some other way, that leaves nothing to size the container to, and it collapses to 0.',
      ]
    },
    {
      heading: 'This is directly measurable with getBoundingClientRect() — identical content, identical width, but a dramatically different rendered height depending only on which container-type value is used',
      points: [
        'A wrapper with real content (padding, text) and <code>container-type: inline-size</code> renders at its natural, content-driven height.',
        'The exact same markup with <code>container-type: size</code> instead — and no explicit height anywhere — measures a rendered height of <code>0</code>, even though the content and its padding are still present in the DOM.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>container-type: size collapses height</title>
    <style>
      .wrap-inline-size { width: 300px; container-type: inline-size; }
      .wrap-size { width: 300px; container-type: size; }
      .content-block { padding: 20px; background: lightblue; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div class="wrap-inline-size" id="wrapInline">
      <div class="content-block">Some content with intrinsic height from padding and text.</div>
    </div>
    <div class="wrap-size" id="wrapSize">
      <div class="content-block">Some content with intrinsic height from padding and text.</div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const wrapInline = document.querySelector<HTMLElement>('#wrapInline')!;
const wrapSize = document.querySelector<HTMLElement>('#wrapSize')!;

const heightInlineSize = wrapInline.getBoundingClientRect().height;
const heightSize = wrapSize.getBoundingClientRect().height;

console.log('container-type: inline-size — rendered height:', heightInlineSize, 'px (sized to content)');
console.log('container-type: size — rendered height:', heightSize, 'px (collapsed, despite identical content)');
console.log('same content, same width, but size containment collapses the box:', heightSize === 0 && heightInlineSize > 0);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A hero banner wrapper sets <code>container-type: size;</code> so it can use both @container width AND height queries. It has no explicit height CSS — height is meant to come from its image and text content. What actually renders?',
    hint: 'Ask what block-size containment does to an element with no explicit height when it can no longer size itself to its children.',
    solution: 'The wrapper collapses to zero height — its image and text are still in the DOM but the container itself has no height, since size containment blocks it from sizing to its content in the block direction. Fixing it requires either giving the wrapper an explicit height (e.g. height: 400px) or switching to container-type: inline-size if height queries genuinely aren\'t needed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'container-type: size is just a "more complete" version of inline-size that adds height query support with no other side effects.',
      reality: 'It fundamentally changes how the element sizes itself — block-size containment means the element can no longer grow to fit its children\'s height, which silently collapses it to zero unless an explicit height is set some other way.'
    },
    {
      thought: 'Since the content and padding are still there in the markup, the wrapper should still visually take up roughly that much space even with container-type: size.',
      reality: 'Containment isn\'t just visual — it changes the actual layout algorithm. The browser treats the container as having no intrinsic height contribution from its children at all, collapsing it to 0 regardless of how much content is inside.'
    },
    {
      thought: 'Most components only need width-based responsiveness, so this only matters in rare, height-query-specific scenarios anyway.',
      reality: 'True in practice, which is exactly why inline-size is the recommended default (per the main page\'s own guidance) — but it\'s worth understanding precisely WHY inline-size avoids this problem, not just that it does, since size is sometimes reached for by habit or misunderstanding.'
    }
  ];
}
