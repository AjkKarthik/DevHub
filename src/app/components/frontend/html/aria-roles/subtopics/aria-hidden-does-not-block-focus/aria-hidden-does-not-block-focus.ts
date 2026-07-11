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
  templateUrl: './aria-hidden-does-not-block-focus.html',
  styleUrl: './aria-hidden-does-not-block-focus.scss'
})
export class AriaHiddenDoesNotBlockFocusSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'aria-hidden="true" removes an element (and its descendants) from the accessibility tree — and does absolutely nothing else',
      points: [
        'A screen reader skips right over anything inside an <code>aria-hidden="true"</code> subtree, as if it did not exist in the announced content at all.',
        'It has zero effect on rendering, zero effect on click handling, and — the genuinely surprising part — zero effect on keyboard focusability. It is a purely semantic, announcement-only attribute, exactly like <code>role</code>.',
      ]
    },
    {
      heading: 'This creates a real, well-documented accessibility trap: a hidden-from-screen-readers element that a sighted keyboard user can still Tab into',
      points: [
        'If an <code>aria-hidden="true"</code> container has a focusable descendant (a <code>&lt;button&gt;</code>, a link, an input), that descendant can still receive focus via Tab or a programmatic <code>.focus()</code> call — the browser\'s focus system and the accessibility-tree exposure system are entirely separate mechanisms.',
        'The practical result is a genuinely broken interaction: a screen reader user tabs to a control that gets skipped in the announced content, landing on something they were never told exists.',
        'The correct fix is to ALSO make the descendant unfocusable — <code>tabindex="-1"</code>, the <code>inert</code> attribute on the container, or (better) not visually hiding interactive content with <code>aria-hidden</code> at all and using <code>display: none</code>/<code>hidden</code> instead, which removes focusability automatically.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>aria-hidden does not block focus</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div aria-hidden="true">
      <button id="trapped">I'm hidden from screen readers but still focusable</button>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const trapped = document.querySelector<HTMLButtonElement>('#trapped')!;
const container = trapped.closest('[aria-hidden="true"]')!;

console.log('container aria-hidden:', container.getAttribute('aria-hidden'));

// Nothing about aria-hidden prevents this from succeeding.
trapped.focus();
console.log('document.activeElement is the "hidden" button:', document.activeElement === trapped);

// Compare with the actual fix: tabindex="-1" DOES remove it from
// the natural focus order (though .focus() can still force it).
trapped.tabIndex = -1;
console.log('after tabindex=-1, trapped.tabIndex:', trapped.tabIndex);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A <code>&lt;button&gt;</code> sits inside a <code>&lt;div aria-hidden="true"&gt;</code>. A sighted keyboard user presses Tab repeatedly. Can they land focus on that button?',
    hint: 'aria-hidden only controls the accessibility-tree announcement. Ask whether the browser\'s separate focus/tab-order system has any awareness of that attribute at all.',
    solution: 'Yes — Tab can still reach it, and <code>document.activeElement</code> would report that button. aria-hidden has no effect on focusability; only <code>tabindex="-1"</code>, <code>inert</code>, or actually hiding the element (<code>display: none</code>/<code>hidden</code>) removes it from the tab order.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>aria-hidden="true"</code> is essentially a stronger, ARIA-flavored version of <code>display: none</code> — it hides the content in every sense.',
      reality: 'It only affects the accessibility tree. Visually the element still renders exactly as normal, and any focusable descendant remains fully focusable via Tab or <code>.focus()</code> — a genuinely different behavior from actually hiding an element.'
    },
    {
      thought: 'A screen reader user could never actually reach a focusable element inside an <code>aria-hidden="true"</code> container, since the container is "hidden".',
      reality: 'They absolutely can, via Tab navigation — landing on a control that the screen reader never announced existed, which is exactly the broken, disorienting trap this pattern creates in practice.'
    },
    {
      thought: 'Setting <code>tabindex="-1"</code> on a focusable element fully removes it from being focused under any circumstance.',
      reality: 'It only removes the element from the natural Tab-key order — a programmatic <code>.focus()</code> call still succeeds on a <code>tabindex="-1"</code> element. Only <code>disabled</code> (on form controls) or the <code>inert</code> attribute genuinely block focus from every path.'
    }
  ];
}
