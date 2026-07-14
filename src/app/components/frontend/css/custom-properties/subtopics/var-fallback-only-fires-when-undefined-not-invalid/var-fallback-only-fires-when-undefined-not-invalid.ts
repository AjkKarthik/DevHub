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
  templateUrl: './var-fallback-only-fires-when-undefined-not-invalid.html',
  styleUrl: './var-fallback-only-fires-when-undefined-not-invalid.scss'
})
export class VarFallbackOnlyFiresWhenUndefinedNotInvalidSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'var(--x, fallback) substitutes the fallback ONLY when --x is completely undefined — never when it holds an invalid value',
      points: [
        'The var() fallback mechanism operates purely at the TEXT-SUBSTITUTION step: if <code>--x</code> has no value anywhere in scope, the fallback text is substituted in its place before the browser even tries to parse the resulting property value.',
        'If <code>--x</code> IS defined but its value doesn\'t make sense for the property using it (e.g. <code>--size: red;</code> used for <code>width</code>), the substitution still happens normally — producing <code>width: red</code> — and THAT is what gets rejected as invalid, at a completely separate, later step the fallback never gets a chance to intervene in.',
      ]
    },
    {
      heading: 'When substitution succeeds but the resulting value is invalid, the property falls back to its own initial or inherited value — not the var() fallback',
      points: [
        'This is directly measurable: an element using <code>width: var(--size, 150px)</code> where <code>--size: red</code> computes to whatever <code>width: auto</code> would produce (typically filling its container) — NOT 150px, proving the fallback never activated.',
        'The exact same element using an actually-UNDEFINED variable — <code>width: var(--totally-undefined, 150px)</code> — correctly renders at 150px, confirming the fallback DOES work, just only for the undefined case.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>var() fallback: undefined vs invalid</title>
    <style>
      #container { width: 300px; }
      #invalidVar { --size: red; width: var(--size, 150px); height: 10px; background: #dc2626; }
      #undefinedVar { width: var(--totally-undefined, 150px); height: 10px; background: #2563eb; }
    </style>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <div id="container">
      <div id="invalidVar"></div>
      <div id="undefinedVar"></div>
    </div>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const invalidVar = document.querySelector<HTMLElement>('#invalidVar')!;
const undefinedVar = document.querySelector<HTMLElement>('#undefinedVar')!;

console.log('container width: 300px, both use var(--x, 150px)');
console.log('--size: red (defined but INVALID for width) -> rendered width:', invalidVar.getBoundingClientRect().width);
console.log('--totally-undefined (never defined at all) -> rendered width:', undefinedVar.getBoundingClientRect().width);
console.log('invalid case falls back to auto (fills container), NOT the 150px var() fallback:',
  invalidVar.getBoundingClientRect().width === 300);
console.log('undefined case correctly uses the 150px var() fallback:',
  undefinedVar.getBoundingClientRect().width === 150);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An element inside a 300px-wide container has <code>--size: "large"; width: var(--size, 100px);</code> ("large" is a string, not a valid length). What is the element\'s actual rendered width?',
    hint: 'The fallback only activates when the variable itself is missing — think about what happens to the property once a defined-but-nonsensical value has already been substituted in.',
    solution: '300px (the same as width: auto would produce in this container) — NOT 100px. Since --size IS defined, the var() fallback never activates; the resulting width: "large" is invalid, so the width property falls back to its own initial value (auto), completely bypassing the var() fallback.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'var(--x, fallback) uses the fallback any time the effective value of --x doesn\'t work for the property it\'s used on.',
      reality: 'It only uses the fallback when --x is literally undefined (undeclared and not inherited). A defined-but-invalid value skips the fallback entirely and falls through to the property\'s own initial/inherited value instead.'
    },
    {
      thought: 'This distinction — undefined vs. invalid — is a minor edge case that rarely matters in practice.',
      reality: 'It\'s a well-documented, common source of confusion (per the main page\'s own Common Mistakes) — a typo\'d or wrongly-typed custom property value can silently produce a completely different visual result than expected, since the intended fallback safety net doesn\'t catch it.'
    },
    {
      thought: 'To reliably guard against bad values in a custom property, wrapping it in var(--x, safeDefault) is sufficient protection.',
      reality: 'It only protects against the variable being completely unset — protecting against genuinely INVALID values requires either careful upstream validation or, for typed use cases, @property with a syntax constraint that rejects non-conforming values at a different stage entirely.'
    }
  ];
}
