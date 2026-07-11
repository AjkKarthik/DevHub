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
  templateUrl: './fill-mode-both-retains-the-final-keyframe-state.html',
  styleUrl: './fill-mode-both-retains-the-final-keyframe-state.scss'
})
export class FillModeBothRetainsTheFinalKeyframeStateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Without animation-fill-mode, an element genuinely reverts to its OWN declared value once the animation ends — the last keyframe does not "stick"',
      points: [
        'The default fill mode is <code>none</code> — once the animation\'s active duration is over, its effect stops applying entirely, and the element\'s computed style falls back to whatever its own CSS rule (outside the animation) declares.',
        'This means an element with <code>opacity: 0.5</code> declared alongside a <code>fadeIn</code> keyframe animation (from opacity 0 to opacity 1) genuinely ends up back at <code>0.5</code> once the animation finishes — NOT at the keyframe\'s final value of <code>1</code>.',
      ]
    },
    {
      heading: 'animation-fill-mode: both makes the last keyframe\'s values persist past the animation\'s end — directly measurable via the Web Animations API',
      points: [
        'Every running CSS animation is also a real <code>Animation</code> object, retrievable via <code>element.getAnimations()</code> — its <code>currentTime</code> can be set directly to jump to any point in the timeline instantly, without waiting for real time to pass, making the end-state comparison deterministic and immediate.',
        'Jumping BOTH a <code>fill-mode: none</code> element and a <code>fill-mode: both</code> element to the exact end of their identical animation and reading <code>getComputedStyle()</code> shows genuinely different results — proof that the fill mode alone, not the keyframes themselves, decides what happens after the animation ends.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>fill-mode: both retains the final keyframe</title>
    <style>
      @keyframes fadeOpacity { from { opacity: 0; } to { opacity: 1; } }
      #noFill { animation: fadeOpacity 1s ease-out; opacity: 0.5; }
      #withBoth { animation: fadeOpacity 1s ease-out both; opacity: 0.5; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="noFill">no fill-mode (default: none)</div>
    <div id="withBoth">fill-mode: both</div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const noFillEl = document.querySelector<HTMLElement>('#noFill')!;
const withBothEl = document.querySelector<HTMLElement>('#withBoth')!;

const noFillAnim = noFillEl.getAnimations()[0];
const withBothAnim = withBothEl.getAnimations()[0];

// Jump both animations directly to their end (1000ms) — no waiting needed.
noFillAnim.currentTime = 1000;
noFillAnim.pause();
withBothAnim.currentTime = 1000;
withBothAnim.pause();

console.log('no fill-mode -> opacity at animation end:', getComputedStyle(noFillEl).opacity, '(reverted to its own declared 0.5)');
console.log('fill-mode: both -> opacity at animation end:', getComputedStyle(withBothEl).opacity, '(retained the last keyframe value, 1)');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An element has <code>opacity: 0.3</code> declared, plus a keyframe animation fading opacity from 0 to 1, with NO <code>animation-fill-mode</code> set. What is its computed opacity once the animation finishes?',
    hint: 'Ask what happens to the animation\'s effect once its active duration ends, under the default fill mode.',
    solution: '0.3 — its own declared value. Without fill-mode: forwards or both, the animation\'s effect stops applying entirely once it ends, and the element falls back to whatever its own (non-animation) CSS declares — not the keyframe\'s final value.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once a CSS animation finishes, the element naturally stays at whatever the last keyframe specified — that\'s just what "finishing" an animation means.',
      reality: 'That only happens with fill-mode: forwards or both. The default (none) means the animation\'s effect is removed entirely once it ends, and the element reverts to its own declared styles.'
    },
    {
      thought: 'Verifying fill-mode behavior requires waiting for the real animation duration to elapse before checking the computed style.',
      reality: 'The Web Animations API lets you set an animation\'s currentTime directly, jumping instantly to any point in its timeline (including past the end) — making the comparison deterministic and immediate, with no real-time waiting required.'
    },
    {
      thought: 'fill-mode: both and fill-mode: forwards behave identically in every situation.',
      reality: 'They only differ during the DELAY period before an animation starts: backwards (part of both) applies the FIRST keyframe\'s values during that delay; forwards alone leaves the element at its own pre-animation styles until the animation actually begins.'
    }
  ];
}
