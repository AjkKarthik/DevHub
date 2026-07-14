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
  templateUrl: './negative-delay-starts-the-animation-mid-cycle.html',
  styleUrl: './negative-delay-starts-the-animation-mid-cycle.scss'
})
export class NegativeDelayStartsTheAnimationMidCycleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A negative animation-delay doesn\'t delay anything — it starts the animation as if that much time had already elapsed',
      points: [
        '<code>animation-delay: -1s</code> on a 2s animation means the animation begins its VERY FIRST rendered frame already 1 second into its 2-second timeline — exactly at the 50% mark, not at the 0% starting keyframe.',
        'This is genuinely different from a positive delay (which makes the browser WAIT before starting) — a negative value has the opposite effect: it skips forward, immediately.',
      ]
    },
    {
      heading: 'This is directly measurable: an animation with -1s delay renders its 50%-progress state on the very first frame, provable without waiting for real playback time',
      points: [
        'A <code>growWidth</code> keyframe animation (0px to 200px, over 2s) with no delay starts at exactly 0px. The identical animation with <code>animation-delay: -1s</code> starts at exactly 100px — precisely the midpoint — confirming the negative delay genuinely jumped the starting point forward, not just changed timing cosmetically.',
        'This is exactly why negative delays are the standard technique for staggering list animations without making every item wait through the FULL duration sequentially — each item can start partway through the SAME animation, offset by a small negative delay, creating a cascading effect that finishes faster than sequential positive delays would.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>negative animation-delay starts mid-cycle</title>
    <style>
      @keyframes growWidth { from { width: 0px; } to { width: 200px; } }
      #noDelay { animation: growWidth 2s linear paused; height: 10px; background: #264de4; }
      #negDelay { animation: growWidth 2s linear -1s paused; height: 10px; background: #7c3aed; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="noDelay"></div>
    <div id="negDelay"></div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const noDelayEl = document.querySelector<HTMLElement>('#noDelay')!;
const negDelayEl = document.querySelector<HTMLElement>('#negDelay')!;

// Both animations are declared "paused" in CSS, so reading their state
// right away reflects exactly where each one STARTS.
console.log('no delay -> starting width:', getComputedStyle(noDelayEl).width);
console.log('animation-delay: -1s (on a 2s animation) -> starting width:', getComputedStyle(negDelayEl).width);
console.log('the negative-delay element started exactly at the 50% midpoint, not 0:',
  getComputedStyle(negDelayEl).width === '100px');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A <code>growWidth</code> animation runs from 0px to 400px over 4 seconds. An element has <code>animation-delay: -1s</code>. What width does it start at?',
    hint: '-1s means the animation begins already 1 second into its own 4-second timeline — figure out what fraction of the total duration that represents.',
    solution: '100px — 1 second is 25% of the 4-second duration, so the animation starts 25% of the way through its keyframes, at 25% of 400px.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'animation-delay: -1s is invalid or gets treated the same as animation-delay: 0s, since a "negative wait" doesn\'t make sense.',
      reality: 'It\'s valid and has a precise, well-defined effect — the animation begins already partway through its own timeline, at exactly the point that many seconds of playback would have reached.'
    },
    {
      thought: 'A negative delay reverses the animation direction — playing it backwards from that point.',
      reality: 'It only changes the STARTING POINT within the timeline; the animation still plays forward from there (or follows whatever animation-direction is set) exactly as it normally would.'
    },
    {
      thought: 'Staggering a list of items with negative delays requires each item to have a completely different, custom-calculated keyframe animation.',
      reality: 'The standard technique reuses the SAME keyframe animation for every item, varying only the (often negative) delay value per item — a single shared @keyframes rule handles the whole staggered sequence.'
    }
  ];
}
