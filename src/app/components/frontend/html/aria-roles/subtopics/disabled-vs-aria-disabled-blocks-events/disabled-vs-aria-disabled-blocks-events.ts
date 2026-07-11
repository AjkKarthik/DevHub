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
  templateUrl: './disabled-vs-aria-disabled-blocks-events.html',
  styleUrl: './disabled-vs-aria-disabled-blocks-events.scss'
})
export class DisabledVsAriaDisabledBlocksEventsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The native disabled attribute is enforced by the BROWSER — it blocks events at the platform level, not just visually',
      points: [
        'A <code>&lt;button disabled&gt;</code> is removed from the tab order, cannot receive focus, and — critically — never fires a <code>click</code> event, even from a programmatic <code>.click()</code> call. This is genuine browser-level event suppression, not something JavaScript needs to opt into.',
        'Screen readers also announce it as "disabled" (or "dimmed"), keeping the announcement and the actual interactive behavior consistent with each other automatically.',
      ]
    },
    {
      heading: 'aria-disabled="true" is purely an announcement — the browser enforces NOTHING about it',
      points: [
        'The element stays fully focusable, stays in the tab order, and keeps firing every event exactly as if the attribute weren\'t there — <code>aria-disabled</code> has zero effect on the DOM event system.',
        'This is intentional and useful: it lets a keyboard user still Tab to a temporarily-unavailable control and be told WHY it\'s disabled (e.g. announced with an <code>aria-describedby</code> reason), which a truly <code>disabled</code> button — invisible to the tab order — can never do.',
        'The tradeoff is that YOUR code must manually check for and respect <code>aria-disabled</code> in every event handler — the browser will not do it for you the way it does for the native attribute.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>disabled vs aria-disabled</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <button id="nativeDisabled" disabled>Native disabled</button>
    <button id="ariaDisabled" aria-disabled="true">aria-disabled</button>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const nativeDisabled = document.querySelector<HTMLButtonElement>('#nativeDisabled')!;
const ariaDisabled = document.querySelector<HTMLButtonElement>('#ariaDisabled')!;

let nativeClicks = 0;
let ariaClicks = 0;
nativeDisabled.addEventListener('click', () => nativeClicks++);
ariaDisabled.addEventListener('click', () => ariaClicks++);

console.log('nativeDisabled.tabIndex:', nativeDisabled.tabIndex);
console.log('ariaDisabled.tabIndex:', ariaDisabled.tabIndex);

// Even a programmatic .click() is suppressed by the real disabled attribute.
nativeDisabled.click();
ariaDisabled.click();

console.log('nativeDisabled click count (blocked by the browser):', nativeClicks);
console.log('ariaDisabled click count (nothing stopped it):', ariaClicks);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two buttons exist: one with the native <code>disabled</code> attribute, one with <code>aria-disabled="true"</code>. Both have a <code>click</code> listener, and <code>.click()</code> is called on each programmatically. How many click listeners actually fire?',
    hint: 'One of these attributes is enforced by the browser\'s own event system; the other is purely informational for assistive technology and changes nothing about how events dispatch.',
    solution: 'Only one — the <code>aria-disabled</code> button\'s listener fires normally. The native <code>disabled</code> attribute suppresses the click event at the browser level, even for a programmatic <code>.click()</code> call, while <code>aria-disabled</code> has no effect on event dispatch whatsoever.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>aria-disabled="true"</code> and the native <code>disabled</code> attribute both prevent a button from being clicked — they\'re just two ways to spell the same thing.',
      reality: 'Only <code>disabled</code> is enforced by the browser\'s event system — it genuinely blocks click events, including programmatic ones. <code>aria-disabled</code> changes nothing about event dispatch; your own code must check for it and bail out manually.'
    },
    {
      thought: 'Since <code>aria-disabled="true"</code> doesn\'t block clicks automatically, it\'s essentially useless compared to the native attribute.',
      reality: 'It has a real, deliberate use: it keeps the control in the tab order (unlike <code>disabled</code>, which removes it entirely), letting keyboard users still discover it and hear WHY it\'s unavailable — something a genuinely disabled button can never communicate since it\'s unreachable.'
    },
    {
      thought: 'A disabled <code>&lt;button&gt;</code> is only visually dimmed by default styling — its actual interactive behavior is unaffected unless you add your own JavaScript checks.',
      reality: 'The opposite is true: the browser enforces the disabled behavior (no focus, no tab order, no click dispatch — even programmatically) with zero JavaScript required. The visual dimming is just CSS on top of genuine platform-level event suppression.'
    }
  ];
}
