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
  templateUrl: './animation-duration-is-ignored-scroll-timeline-progress-is-positional.html',
  styleUrl: './animation-duration-is-ignored-scroll-timeline-progress-is-positional.scss'
})
export class AnimationDurationIsIgnoredScrollTimelineProgressIsPositionalSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Setting animation-duration: 1s (or any value) on a scroll-linked animation has zero effect on how fast it plays — progress is driven purely by scroll position',
      points: [
        'A normal, time-based animation with <code>animation-duration: 1s</code> takes exactly one second of REAL TIME to go from its first keyframe to its last, regardless of anything else happening on the page.',
        'Once <code>animation-timeline: scroll()</code> is applied, the animation stops being time-driven entirely — its "timeline" is now a <code>ScrollTimeline</code> object, and <code>currentTime</code> represents a PERCENTAGE of scroll progress, not elapsed seconds. The duration value becomes vestigial.',
      ]
    },
    {
      heading: 'This is directly measurable: setting the underlying Animation object\'s currentTime to a specific scroll percentage instantly jumps to the correct keyframe-interpolated value, regardless of the declared duration',
      points: [
        'An element has <code>animation: grow 1s linear</code> combined with <code>animation-timeline: scroll(self block)</code> — a real, deliberately long <code>1s</code> duration was declared.',
        'Reading <code>element.getAnimations()[0].timeline</code> confirms it\'s a genuine <code>ScrollTimeline</code>, and setting <code>currentTime</code> directly to <code>50%</code> (as a <code>CSSNumericValue</code> percentage, not a time in milliseconds) instantly produces the exact halfway-interpolated keyframe value — proving the declared 1-second duration was never actually consulted.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>animation-duration is ignored on scroll timelines</title>
    <style>
      #scrollBox { width: 200px; height: 200px; overflow-y: scroll; background: #eee; }
      #spacer { height: 1000px; }
      #bar {
        height: 10px; width: 100%; background: crimson;
        transform-origin: left; transform: scaleX(0);
        /* A deliberately long duration -- it will turn out to be irrelevant */
        animation: growbar 1s linear;
        animation-timeline: scroll(self block);
        animation-fill-mode: both;
      }
      @keyframes growbar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="scrollBox">
      <div id="bar"></div>
      <div id="spacer"></div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const bar = document.querySelector<HTMLElement>('#bar')!;

const anim = bar.getAnimations()[0];
console.log('timeline type:', anim.timeline?.constructor.name);
console.log('declared animation-duration was 1s -- watch it have zero effect below:');

// currentTime for a scroll timeline is a PERCENTAGE, not milliseconds.
anim.currentTime = CSSNumericValue.parse('0%');
console.log('at 0% scroll progress:', getComputedStyle(bar).transform);

anim.currentTime = CSSNumericValue.parse('50%');
console.log('at 50% scroll progress:', getComputedStyle(bar).transform);

anim.currentTime = CSSNumericValue.parse('100%');
console.log('at 100% scroll progress:', getComputedStyle(bar).transform);

console.log('every jump was instant -- no 1-second wait was ever needed, because duration is not consulted at all for a scroll timeline.');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer notices their scroll-linked progress bar has <code>animation-duration: 3s</code> in the CSS and assumes scrolling quickly would make the bar "lag behind" since 3 seconds haven\'t elapsed yet. Is that assumption correct?',
    hint: 'Ask what currentTime actually represents once animation-timeline is a scroll() or view() timeline — elapsed time, or something else entirely.',
    solution: 'No — once animation-timeline is set to a scroll timeline, currentTime is redefined as a percentage of scroll progress, not elapsed real time. The bar tracks scroll position instantly and exactly, with no lag, no matter how fast the user scrolls. The 3s value is simply never consulted; it can be safely removed or left in place with zero visual difference.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'animation-duration still controls playback speed for scroll-driven animations, just relative to scroll distance instead of real time — a longer duration should mean more scrolling is needed to complete it.',
      reality: 'The duration value is not converted into a scroll-distance equivalent — it is simply ignored entirely. The complete scroll range of the timeline (0% to 100%) always maps to the complete keyframe sequence, regardless of what duration is declared.'
    },
    {
      thought: 'Leaving a stale animation-duration value in scroll-timeline CSS is harmless but could theoretically cause subtle timing bugs later.',
      reality: 'It is genuinely inert for scroll and view timelines — not a a latent risk, just dead, ignorable syntax. The main practical downside is reader confusion (a duration value that looks meaningful but does nothing), which is exactly why the main page recommends omitting it or setting it to auto.'
    },
    {
      thought: 'Since duration is ignored, animation-timing-function (like linear or ease-in-out) must also be ignored for scroll timelines.',
      reality: 'animation-timing-function still fully applies — it shapes HOW keyframe values are interpolated across the 0%–100% scroll range, exactly as it would across a time range. Only the DURATION concept (a fixed span of real seconds) is meaningless; the easing curve concept survives intact.'
    }
  ];
}
