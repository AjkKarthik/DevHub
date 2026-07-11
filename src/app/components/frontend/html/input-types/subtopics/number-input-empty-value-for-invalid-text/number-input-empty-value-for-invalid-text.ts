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
  templateUrl: './number-input-empty-value-for-invalid-text.html',
  styleUrl: './number-input-empty-value-for-invalid-text.scss'
})
export class NumberInputEmptyValueForInvalidTextSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A number input\'s DOM value is an empty string for anything it can\'t parse as a valid number — not the raw characters typed',
      points: [
        'This is a spec-defined "value sanitization algorithm": whenever the underlying string doesn\'t parse as a valid floating-point number, the browser reports <code>.value</code> as <code>""</code>, regardless of what was actually typed or set.',
        'The tricky part is that some characters ARE allowed at the keystroke level because they can appear in a valid number — digits, <code>-</code>, <code>.</code>, and <code>e</code>/<code>E</code> for exponential notation — but the browser only accepts the string once it forms a COMPLETE valid number.',
        'Typing "1e" is a real, common trap: both characters are individually legal in a number input, so nothing is blocked while typing, but <code>.value</code> is <code>""</code> until a valid exponent digit follows (e.g. "1e5").',
      ]
    },
    {
      heading: 'This is fundamentally different from type="text", which always reflects exactly what was typed or set',
      points: [
        'A text input has no sanitization step — <code>el.value</code> is always a literal echo of the string, valid-looking or not.',
        'Reading <code>.value</code> from a number input is therefore not a reliable way to detect "the user typed something invalid" — it looks IDENTICAL to "the user typed nothing at all". Use <code>.validity.badInput</code> to tell those two cases apart.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>Number input sanitization</title></head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <input type="number" id="num" />
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const num = document.querySelector<HTMLInputElement>('#num')!;

function trySetting(raw: string) {
  num.value = raw;
  console.log(\\\`set "\\\${raw}" -> .value is "\\\${num.value}", badInput: \\\${num.validity.badInput}\\\`);
}

// A complete valid number: reflected as-is.
trySetting('42');

// Legal exponential-notation characters, but an INCOMPLETE number.
// Nothing was rejected while "typing" this — yet .value comes back empty.
trySetting('1e');

// Completing the exponent makes it valid again.
trySetting('1e5');

// Not parseable as a number at all.
trySetting('abc');
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A number input has its value set programmatically to <code>"3.5.2"</code> (two decimal points — not a valid number). What does reading <code>el.value</code> back report?',
    hint: 'The value sanitization algorithm only accepts strings that parse as ONE complete valid floating-point number. Two decimal points can never form a valid number, no matter how many digits surround them.',
    solution: 'el.value === "" — "3.5.2" never forms a valid number, so the browser sanitizes it down to an empty string, exactly like "1e" or "abc".'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A <code>type="number"</code> input\'s <code>.value</code> will contain whatever the user actually typed, the same as a text input.',
      reality: 'It only contains a value if that value parses as a COMPLETE valid number. Anything else — including legal-but-incomplete strings like "1e" — sanitizes down to <code>""</code>, silently discarding what was typed.'
    },
    {
      thought: 'Since number inputs block invalid characters at the keystroke level, <code>.value</code> can never be empty unless the field is literally blank.',
      reality: 'Characters that are individually legal in number syntax (digits, <code>-</code>, <code>.</code>, <code>e</code>) are never blocked while typing, even when the string they form together is not yet a complete valid number — that\'s exactly how "1e" slips through and still reports an empty <code>.value</code>.'
    },
    {
      thought: 'Checking <code>if (el.value)</code> is enough to know whether the user entered a number.',
      reality: 'That check can\'t distinguish "field is empty" from "field has invalid input" — both report <code>""</code>. Use <code>el.validity.badInput</code> (true only for the invalid-input case) when that distinction matters, and <code>el.valueAsNumber</code> (which is <code>NaN</code>, not <code>0</code>, for both cases) instead of treating an empty value as zero.'
    }
  ];
}
