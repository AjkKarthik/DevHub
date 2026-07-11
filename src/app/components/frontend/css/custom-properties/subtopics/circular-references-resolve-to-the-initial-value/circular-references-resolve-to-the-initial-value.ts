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
  templateUrl: './circular-references-resolve-to-the-initial-value.html',
  styleUrl: './circular-references-resolve-to-the-initial-value.scss'
})
export class CircularReferencesResolveToTheInitialValueSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two custom properties referencing each other never cause an infinite loop or a browser crash — the spec explicitly defines the outcome',
      points: [
        'Given <code>--a: var(--b); --b: var(--a);</code>, neither variable can ever resolve to a concrete value — each one\'s definition depends on the other\'s, indefinitely.',
        'Rather than looping forever or throwing an error, the CSS spec defines this as producing the "guaranteed-invalid value" — both <code>--a</code> and <code>--b</code> become computationally invalid, deterministically, every time.',
      ]
    },
    {
      heading: 'A property using a circularly-referenced variable falls back to ITS OWN initial value — the same rule as any other invalid-at-computed-value-time case',
      points: [
        'This connects directly to the undefined-vs-invalid distinction: a circular reference isn\'t "undefined" (both variables ARE declared), so the var() fallback doesn\'t apply here either — the property instead resolves to its own initial value.',
        'For a property like <code>opacity</code> (initial value <code>1</code>), an element using a circularly-referenced variable for opacity renders at full, ordinary opacity — genuinely provable by reading <code>getComputedStyle(el).opacity</code> and confirming it\'s exactly <code>"1"</code>, not empty or an error.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>Circular custom property references</title>
    <style>
      #circular {
        --a: var(--b);
        --b: var(--a);
        opacity: var(--a, 0.3);
      }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="circular">circularly-referenced opacity</div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const el = document.querySelector<HTMLElement>('#circular')!;
const computedOpacity = getComputedStyle(el).opacity;

console.log('--a and --b circularly reference each other');
console.log('opacity: var(--a, 0.3) actually computes to:', computedOpacity);
console.log('it is NOT the 0.3 var() fallback:', computedOpacity !== '0.3');
console.log('it IS opacity\\'s own initial value (1):', computedOpacity === '1');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two custom properties are declared as <code>--a: var(--b); --b: var(--a);</code>. An element uses <code>opacity: var(--a, 0.5);</code>. What does the element actually render at?',
    hint: 'A circular reference isn\'t the same as an undefined variable — both --a and --b ARE declared, they just can never resolve. Think about which of the two fallback rules applies.',
    solution: 'Full opacity (1) — opacity\'s own initial value. Since --a and --b are both declared (just circularly unresolvable), the var() fallback (0.5) never activates; the property falls back to its own initial value instead, exactly like the invalid-value case.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A circular custom property reference will cause a browser error, an infinite loop, or a page hang.',
      reality: 'It\'s explicitly defined, deterministic spec behavior — both properties become "guaranteed-invalid" instantly, with no performance impact or error of any kind.'
    },
    {
      thought: 'Since --a and --b are technically declared, var(--a, fallback) should use --a\'s (unresolvable) value rather than the fallback or the property\'s initial value.',
      reality: 'Both properties resolve to the guaranteed-invalid value, which triggers the SAME invalid-at-computed-value-time behavior as any other invalid value — falling through to the property\'s own initial value, not the var() fallback and not some special circular-reference value.'
    },
    {
      thought: 'This is a completely separate rule from the earlier "invalid value" case — circular references are their own distinct category with different resolution behavior.',
      reality: 'It\'s the SAME underlying mechanism — a circular reference is simply one specific way to produce an invalid value, and it resolves through the identical fallback-to-initial-value path as any other invalid custom property value.'
    }
  ];
}
