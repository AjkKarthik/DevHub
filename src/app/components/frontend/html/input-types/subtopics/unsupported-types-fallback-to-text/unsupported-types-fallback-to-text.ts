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
  templateUrl: './unsupported-types-fallback-to-text.html',
  styleUrl: './unsupported-types-fallback-to-text.scss'
})
export class UnsupportedTypesFallbackToTextSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Setting input.type to something the browser doesn\'t recognize never throws — it silently falls back to "text"',
      points: [
        'The HTML spec defines a fixed, closed list of valid <code>type</code> keywords. Any string outside that list — a genuine typo, or a newer type an older engine hasn\'t implemented yet — is treated as if <code>type="text"</code> had been set.',
        'There is no console warning, no thrown error, and no visual difference from a real text input; the fallback is completely silent by design, which is what makes it safe to rely on.',
      ]
    },
    {
      heading: 'Reading input.type back after setting it proves the ACTUAL applied type, not the requested one',
      points: [
        'The <code>type</code> property is a "reflected" attribute with normalization — assigning a bogus value doesn\'t store that string verbatim, it re-resolves to whatever the browser actually applied.',
        'This makes <code>el.type</code> a reliable live feature-detection technique: set the type you want, then immediately read it back to confirm the browser actually honored it rather than silently downgrading.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Input type fallback</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <input id="test" />
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const el = document.querySelector<HTMLInputElement>('#test')!;

function tryType(requested: string) {
  el.type = requested;
  console.log(\\\`requested "\\\${requested}" -> el.type is actually "\\\${el.type}"\\\`);
}

// A genuinely bogus, made-up keyword.
tryType('sometotallybogustype');

// A well-supported modern type in any current browser.
tryType('color');

// A real HTML type keyword that older engines may not implement.
tryType('week');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You set <code>el.type = "date7000"</code> (not a real HTML input type keyword) on an input element. What does <code>el.type</code> report immediately afterward?',
    hint: 'The browser validates the assigned string against its fixed list of known type keywords. Anything not on that list resolves to the same fallback every unrecognized type gets.',
    solution: 'el.type === "text" — "date7000" isn\'t a recognized keyword, so the browser silently normalizes it to the same fallback as any other unsupported type, with no error and no console warning.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting <code>type</code> to an unrecognized value throws a JavaScript error or leaves the input rendering nothing at all.',
      reality: 'It does neither — the assignment silently succeeds and the input renders (and behaves) exactly like <code>type="text"</code>, with zero visible or console-logged sign that anything was rejected.'
    },
    {
      thought: 'You need to check browser support tables before using a newer input type like <code>color</code> or <code>week</code>, in case it breaks the page.',
      reality: 'It\'s always safe to use a newer, more specific type without checking support first — worst case in an unsupporting browser is a plain text field, which is exactly what you\'d get by not using the specific type at all.'
    },
    {
      thought: 'Validation attributes like <code>required</code>, <code>pattern</code>, and <code>min</code>/<code>max</code> behave the same as an unsupported <code>type</code> — silently ignored with no trace.',
      reality: 'They degrade the same gracefully-silent way, but the consequence is different and more serious: an unsupported TYPE just changes rendering, while an unenforced VALIDATION attribute means invalid data can reach your server with no client-side gate at all — which is exactly why server-side validation must never be skipped.'
    }
  ];
}
