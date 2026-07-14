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
  templateUrl: './shorter-duration-list-cycles-not-drops-or-inherits-last.html',
  styleUrl: './shorter-duration-list-cycles-not-drops-or-inherits-last.scss'
})
export class ShorterDurationListCyclesNotDropsOrInheritsLastSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'When transition-property lists more properties than transition-duration lists durations, the shorter list REPEATS from the start — it doesn\'t drop the extra properties or reuse only the last value',
      points: [
        'Given <code>transition-property: color, transform, opacity;</code> paired with only <code>transition-duration: 0.2s, 0.5s;</code>, the browser pairs them positionally and CYCLES the shorter list: color gets 0.2s, transform gets 0.5s, and opacity — the third property with no third duration — wraps back around to the FIRST duration in the list, 0.2s.',
        'This is easy to get wrong two different ways: assuming the extra property gets no transition at all (snaps instantly), or assuming it inherits the LAST listed value (0.5s in this example). Neither is correct — it cycles back to the start of the list.',
      ]
    },
    {
      heading: 'This is directly measurable — the cycled-back property\'s own effective duration, read straight from its live CSSTransition object, matches the first list value exactly',
      points: [
        'Triggering the change and reading <code>element.getAnimations()</code> returns one <code>CSSTransition</code> per transitioning property — each with its own <code>effect.getTiming().duration</code>, independent of how the shorthand or longhand was originally written.',
        'For the example above, the transition object driving <code>opacity</code> reports a duration of exactly <code>200</code> (milliseconds) — matching color\'s duration, not transform\'s 500ms and not an instant 0ms — directly confirming the cycling rule rather than inferring it from the CSS spec text alone.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>shorter duration list cycles</title>
    <style>
      #box {
        width: 80px; height: 80px; background: crimson; opacity: 1;
        transition-property: color, transform, opacity;
        transition-duration: 0.2s, 0.5s;
        transition-timing-function: linear;
      }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="box"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const box = document.querySelector<HTMLElement>('#box')!;

console.log('declared transition-property:', getComputedStyle(box).transitionProperty);
console.log('declared transition-duration list (only 2 values for 3 properties):', getComputedStyle(box).transitionDuration);

getComputedStyle(box).opacity; // flush initial style
box.style.opacity = '0';

setTimeout(() => {
  const anims = box.getAnimations();
  const opacityAnim = anims.find(a => (a as any).transitionProperty === 'opacity');

  if (opacityAnim) {
    const durationMs = opacityAnim.effect!.getTiming().duration;
    console.log('opacity transition\\'s own effective duration:', durationMs, 'ms');
    console.log('cycled back to the FIRST listed duration (200ms), not the last (500ms) or 0ms:', durationMs === 200);

    opacityAnim.currentTime = 100;
    console.log('opacity at 100ms into its 200ms cycled duration (should be ~0.5):', getComputedStyle(box).opacity);
  }
}, 30);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A card declares <code>transition-property: box-shadow, transform, border-color;</code> with <code>transition-duration: 0.15s, 0.3s;</code> — three properties, two durations. Which duration does border-color end up using?',
    hint: 'Count positions: box-shadow is 1st, transform is 2nd, border-color is 3rd — but the duration list only has 2 entries. What happens when the duration list runs out?',
    solution: 'The duration list cycles back to its start. border-color (3rd property) wraps around to the 1st duration, 0.15s — the same duration as box-shadow, not transform\'s 0.3s and not an unanimated instant change.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If transition-duration has fewer values than transition-property, the properties without a matching duration just don\'t transition at all.',
      reality: 'Per the CSS spec, when one of the comma-separated transition sub-property lists is shorter than transition-property, that shorter list is repeated (cycled) until every property has a value — none of them are left without a duration.'
    },
    {
      thought: 'The extra properties beyond the duration list\'s length should reasonably inherit the LAST value in the list, similar to how some CSS shorthand fallbacks work.',
      reality: 'It cycles back to the FIRST value, not the last. With durations 0.2s, 0.5s and three properties, the third property gets 0.2s again — not 0.5s.'
    },
    {
      thought: 'This is a rare, contrived edge case not worth worrying about in real code.',
      reality: 'It happens any time a transition shorthand or its longhand equivalents list more properties than explicit durations/easings — easy to trigger accidentally when adding a property to transition-property without also extending transition-duration to match.'
    }
  ];
}
