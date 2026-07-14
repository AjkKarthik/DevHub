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
  templateUrl: './container-queries-respond-to-container-width-not-viewport.html',
  styleUrl: './container-queries-respond-to-container-width-not-viewport.scss'
})
export class ContainerQueriesRespondToContainerWidthNotViewportSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The SAME component, with the SAME @container rule, can render two different layouts side by side — at the exact same viewport width',
      points: [
        'A <code>@media (min-width: ...)</code> query only ever has ONE answer at any given moment — the entire page shares one viewport width. <code>@container (min-width: ...)</code> has as many independent answers as there are container instances on the page, each measured against its OWN parent\'s width.',
        'This is the entire point of container queries: the same card component can be dropped into a narrow sidebar and a wide main content area on the SAME page, and render genuinely differently in each — something a media query, which only sees the viewport, can never do.',
      ]
    },
    {
      heading: 'This is directly, deterministically measurable: two instances of the identical component, different container widths, different actual computed styles',
      points: [
        'With <code>container-type: inline-size</code> on each wrapper and a shared <code>@container (min-width: 400px)</code> rule inside the card, reading <code>getComputedStyle()</code> on a card in a 300px wrapper vs. one in a 500px wrapper — at the SAME window size — shows genuinely different computed values, proving the query responded to the container, not the shared viewport.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>Container queries respond to container width</title>
    <style>
      .wrapper { container-type: inline-size; }
      #narrowWrapper { width: 300px; }
      #wideWrapper { width: 500px; }
      .card { display: flex; flex-direction: column; }
      @container (min-width: 400px) {
        .card { flex-direction: row; }
      }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div class="wrapper" id="narrowWrapper"><div class="card" id="cardInNarrow">card</div></div>
    <div class="wrapper" id="wideWrapper"><div class="card" id="cardInWide">card</div></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const cardInNarrow = document.querySelector<HTMLElement>('#cardInNarrow')!;
const cardInWide = document.querySelector<HTMLElement>('#cardInWide')!;

console.log('window.innerWidth (SAME for both cards):', window.innerWidth);
console.log('card in a 300px-wide container -> flex-direction:', getComputedStyle(cardInNarrow).flexDirection);
console.log('card in a 500px-wide container -> flex-direction:', getComputedStyle(cardInWide).flexDirection);
console.log('the identical @container rule produced two different results, despite an identical viewport:',
  getComputedStyle(cardInNarrow).flexDirection !== getComputedStyle(cardInWide).flexDirection);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The exact same <code>.card</code> component with a shared <code>@container (min-width: 400px) { .card { ... } }</code> rule is placed inside a 250px-wide sidebar and a 600px-wide main content area, on the same page, at the same time. Does it look the same in both places?',
    hint: 'Ask what the query is actually measuring against in each case — is it the same value for both instances, or a different one?',
    solution: 'No — it renders differently in each, since @container measures each instance against its OWN container\'s width (250px vs 600px), not a single shared viewport value. This is exactly what a @media query could never do, since every element on the page shares the same viewport width.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '@container queries are just @media queries with a different name — same mechanism, just described differently in docs.',
      reality: 'They measure fundamentally different things — @media measures the single, page-wide viewport; @container measures each container instance\'s OWN width independently, allowing genuinely different results for identical components on the same page.'
    },
    {
      thought: 'Since container queries need container-type: inline-size declared explicitly, they\'re a more complicated, less "automatic" version of media queries.',
      reality: 'That explicit opt-in is precisely what makes per-instance responses possible — a media query has no equivalent concept, since the viewport is implicitly shared by everything on the page with nothing to individually opt into.'
    },
    {
      thought: 'A component using container queries will always look the same as it did in isolation, regardless of where it\'s placed on a real page.',
      reality: 'That\'s the OPPOSITE of the intended behavior — the whole point is that dropping the same component into differently-sized containers (a sidebar vs. a full-width section) SHOULD produce genuinely different, context-appropriate layouts.'
    }
  ];
}
