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
  templateUrl: './negative-delay-starts-mid-cycle-not-after-a-pause.html',
  styleUrl: './negative-delay-starts-mid-cycle-not-after-a-pause.scss'
})
export class NegativeDelayStartsMidCycleNotAfterAPauseSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A negative transition-delay doesn\'t pause the transition — it starts it already partway through',
      points: [
        '<code>transition-delay</code> normally shifts the WHOLE transition later — a positive delay waits, then plays the full duration. A negative delay does the opposite: the transition begins immediately, but its internal clock is already offset forward, as if that much time had already elapsed.',
        'On a <code>transition: opacity 1s linear</code> with <code>transition-delay: -0.5s</code>, the very first frame already shows the opacity value that would normally appear half a second into the transition — not the starting value.',
      ]
    },
    {
      heading: 'This is directly observable via the Web Animations API — the underlying CSSTransition object reports a negative delay, and its computed value at zero elapsed time already reflects the offset',
      points: [
        'Calling <code>element.getAnimations()</code> after triggering the change returns the actual <code>CSSTransition</code> object driving it, whose <code>effect.getTiming().delay</code> reports the exact negative value in milliseconds.',
        'Setting that animation\'s own <code>currentTime</code> to <code>0</code> (representing zero real time elapsed since the change was triggered) and reading <code>getComputedStyle()</code> immediately shows a value already partway between the start and end — proving the mid-cycle start directly, not just inferring it from timing.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>negative transition-delay starts mid-cycle</title>
    <style>
      #box { width: 80px; height: 80px; background: crimson; opacity: 1; transition: opacity 1s linear; }
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

getComputedStyle(box).opacity; // flush initial style
box.style.transitionDelay = '-0.5s';
box.style.opacity = '0';

setTimeout(() => {
  const anim = box.getAnimations()[0];
  if (!anim) {
    console.log('no transition object found');
    return;
  }

  const timing = anim.effect!.getTiming();
  console.log('transition-delay reported by the Web Animations API:', timing.delay, 'ms');

  // currentTime = 0 represents zero real time elapsed since the change was triggered.
  anim.currentTime = 0;
  console.log('opacity at zero elapsed time:', getComputedStyle(box).opacity);
  console.log('already partway through the fade, not starting at 1:', getComputedStyle(box).opacity !== '1');
}, 30);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A staggered list uses <code>transition-delay: calc(var(--i) * -0.05s);</code> on each item, all sharing the same 0.3s fade-in transition. Does item 3 (with a delay of -0.15s) start its fade at the very beginning, or somewhere already into it?',
    hint: 'Ask what a negative delay value actually represents on the transition\'s internal timeline, not just whether it delays or doesn\'t.',
    solution: 'Item 3 starts already 0.15s into its 0.3s fade — roughly halfway faded in from the very first frame. Negative delays are sometimes used deliberately for this effect (a staggered group that all finishes at the same moment despite starting at different progress points) rather than the more common staggered-START pattern from positive delays.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'transition-delay: -0.5s must be a CSS error, or at best it just gets treated as no delay at all (0s).',
      reality: 'Negative delay values are valid and meaningful — they shift the transition\'s starting point later on its own internal timeline, causing it to begin already partway through, as if that portion had already silently played.'
    },
    {
      thought: 'A negative delay makes the transition finish sooner by shortening its overall duration.',
      reality: 'The duration itself is unchanged. What changes is where playback starts within that duration — a 1s transition with a -0.5s delay still represents a full 1s of motion, just entered at its 50% mark instead of its 0% mark.'
    },
    {
      thought: 'The only way to verify what a negative transition-delay actually does is to watch it happen and judge visually where the animation appears to begin.',
      reality: 'The Web Animations API exposes the exact underlying CSSTransition object, including its precise delay value and interpolated value at any given point — a definitive, numeric check rather than a visual judgment call.'
    }
  ];
}
