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
  templateUrl: './setproperty-updates-everything-using-the-variable.html',
  styleUrl: './setproperty-updates-everything-using-the-variable.scss'
})
export class SetpropertyUpdatesEverythingUsingTheVariableSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'el.style.setProperty("--x", value) genuinely changes live CSS state — every descendant using var(--x) recomputes automatically',
      points: [
        'Custom properties are real CSSOM state, readable via <code>getComputedStyle(el).getPropertyValue("--x")</code> and writable via <code>el.style.setProperty("--x", value)</code> — no re-render logic, no manual DOM class toggling required for the visual update itself.',
        'Because custom properties cascade and inherit, changing one on a single ancestor element immediately affects every descendant style rule that references it with <code>var(--x)</code> — a single JS call can update an entire subtree\'s styling at once.',
      ]
    },
    {
      heading: 'This is what makes custom properties fundamentally different from Sass variables for JS-driven use cases — and it\'s directly verifiable',
      points: [
        'Reading a child element\'s actually-computed style (e.g. <code>getComputedStyle(child).color</code>) before and after calling <code>setProperty()</code> on an ancestor proves the change propagated through the cascade automatically — no additional code touched the child at all.',
        'This underlies real-world patterns like JS-driven theming, data-visualization color scales, and drag-to-resize UI — all without needing a CSS-in-JS library or manual inline-style updates on every affected element.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>setProperty updates everything using the variable</title>
    <style>
      #ancestor { --accent: #264de4; }
      #child { color: var(--accent); }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="ancestor">
      <span id="child">I use var(--accent)</span>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const ancestor = document.querySelector<HTMLElement>('#ancestor')!;
const child = document.querySelector<HTMLElement>('#child')!;

const varBefore = getComputedStyle(ancestor).getPropertyValue('--accent').trim();
const colorBefore = getComputedStyle(child).color;
console.log('--accent before:', varBefore, '| child color before:', colorBefore);

// No class toggle, no direct style on the child — only the custom property changes.
ancestor.style.setProperty('--accent', '#dc2626');

const varAfter = getComputedStyle(ancestor).getPropertyValue('--accent').trim();
const colorAfter = getComputedStyle(child).color;
console.log('--accent after:', varAfter, '| child color after:', colorAfter);
console.log('the child genuinely recomputed with zero code touching it directly:', colorBefore !== colorAfter);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A parent element has <code>--accent: blue</code>, and a child uses <code>color: var(--accent)</code>. JavaScript calls <code>parent.style.setProperty("--accent", "red")</code> — nothing else changes. Does the child\'s rendered color update?',
    hint: 'Custom properties cascade and inherit like any other CSS property — think about whether the child\'s style RULE needs to be touched at all for the value it references to change.',
    solution: 'Yes — the child\'s color genuinely updates to red, with zero code touching the child directly. Because --accent cascades down and the child\'s color rule references it via var(), the browser automatically recomputes the child\'s style once the ancestor\'s custom property changes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Changing a custom property with JavaScript only updates the CSSOM value — you still need to manually trigger a style recalculation or re-apply classes for the visual change to appear.',
      reality: 'The browser handles the recomputation automatically, exactly like changing any other CSS property via .style — no manual re-render, forced reflow call, or class toggle needed for the visual update itself.'
    },
    {
      thought: 'setProperty() on a custom property only affects the exact element you called it on — descendants need their own separate updates.',
      reality: 'Because custom properties cascade and inherit, a single setProperty() call on an ancestor propagates to every descendant whose style references that variable with var() — no per-element updates required.'
    },
    {
      thought: 'This kind of live, JS-driven custom property update is a niche technique mainly useful for toggling dark mode.',
      reality: 'It\'s the foundation for a much broader set of patterns — data-visualization color scales, drag-to-resize UI, scroll-linked effects — anywhere a value needs to drive many CSS rules at once without a CSS-in-JS library or per-element inline styles.'
    }
  ];
}
