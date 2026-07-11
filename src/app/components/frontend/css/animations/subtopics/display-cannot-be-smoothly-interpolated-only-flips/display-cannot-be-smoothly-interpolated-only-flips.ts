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
  templateUrl: './display-cannot-be-smoothly-interpolated-only-flips.html',
  styleUrl: './display-cannot-be-smoothly-interpolated-only-flips.scss'
})
export class DisplayCannotBeSmoothlyInterpolatedOnlyFlipsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'display has no numeric or visual "in-between" state — at any point during a keyframe animation, its computed value is always EXACTLY one of the two declared values',
      points: [
        'Properties like <code>opacity</code> or <code>width</code> have a continuous range of valid values, so the browser can compute a smooth intermediate value at 30% or 70% through an animation. <code>display</code> is fundamentally different — <code>none</code> and <code>block</code> are two discrete, unrelated keywords with no meaningful "60% of the way between them."',
        'CSS handles this by treating <code>display</code> as a "discrete" animatable property — it flips cleanly from one value to the other at some point in the timeline, but it is NEVER observed at some third, blended value in between.',
      ]
    },
    {
      heading: 'This is directly measurable: sampling the computed display value at multiple points through the animation timeline never returns anything other than the two literal keyword values',
      points: [
        'Using <code>element.getAnimations()[0].currentTime</code> to sample a <code>display: none</code> → <code>display: block</code> keyframe animation at several different points in its timeline — 10%, 50%, 90% — always returns either the literal string <code>"none"</code> or the literal string <code>"block"</code>, confirming there is no partial or blended state to observe, unlike a continuous property.',
        'This is exactly why the main page\'s Common Mistakes recommends <code>opacity</code> instead of <code>display</code> for fade animations — opacity genuinely interpolates smoothly across the full 0-to-1 range, giving a real visual transition that <code>display</code> can never produce on its own.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>display cannot be smoothly interpolated</title>
    <style>
      @keyframes showEl { from { display: none; } to { display: block; } }
      #discreteDisplay { animation: showEl 1s linear paused; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="discreteDisplay">x</div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const el = document.querySelector<HTMLElement>('#discreteDisplay')!;
const anim = el.getAnimations()[0];

function sampleAt(percent: number) {
  anim.currentTime = 1000 * percent; // 1000ms total duration
  console.log(\\\`at \\\${percent * 100}% through the animation, computed display:\\\`, getComputedStyle(el).display);
}

sampleAt(0.1);
sampleAt(0.5);
sampleAt(0.9);

console.log('at every sampled point, display was EXACTLY "none" or "block" — never a blended third value.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A keyframe animation runs <code>display: none</code> to <code>display: block</code> over 2 seconds. Sampling the computed <code>display</code> value at the 1-second mark — is it possible to see something like "50% visible" or a blended intermediate value?',
    hint: 'Think about whether "none" and "block" have any meaningful numeric relationship that could be averaged, the way two numbers or two colors could be.',
    solution: 'No — display is a discrete property with no continuous range between its keyword values. At any sampled point, the computed value is always EXACTLY "none" or EXACTLY "block", determined by which side of the flip point that moment falls on — never a blended or partial value.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Animating display between none and block produces a smooth fade or grow effect, similar to animating opacity or width.',
      reality: 'It produces no visual transition at all — the element is either fully absent from layout (none) or fully present (block) at any given moment, flipping cleanly between the two with nothing in between.'
    },
    {
      thought: 'Since browsers technically allow display in a @keyframes rule without throwing an error, it must support some form of real interpolation.',
      reality: 'Not erroring doesn\'t mean it interpolates — CSS defines "discrete" animation specifically for properties like display that have no continuous range: the property is legal to include in keyframes, but it only ever flips between the literal declared values.'
    },
    {
      thought: 'The fix for animating visibility is to find the right easing function or timing that makes display transition more smoothly.',
      reality: 'No easing function changes this — the fix is switching to a genuinely continuous property instead, typically opacity (optionally paired with pointer-events: none while hidden to also block interaction).'
    }
  ];
}
