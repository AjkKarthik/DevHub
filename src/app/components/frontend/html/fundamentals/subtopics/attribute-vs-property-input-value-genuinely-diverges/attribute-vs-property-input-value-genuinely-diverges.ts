import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-attribute-vs-property-input-value-genuinely-diverges',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './attribute-vs-property-input-value-genuinely-diverges.html',
  styleUrl: './attribute-vs-property-input-value-genuinely-diverges.scss'
})
export class AttributeVsPropertyInputValueGenuinelyDivergesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two genuinely separate values, not two names for the same thing',
      points: [
        'The main page\'s Quiz is direct: "Attributes are the initial values in HTML; properties reflect the current live state in the DOM. Example: <code>&lt;input value="hello"&gt;</code> — the value attribute stays \'hello\' forever; the value property reflects what the user has typed."',
        'This is not a documentation simplification — <code>getAttribute(\'value\')</code> and the <code>.value</code> property are backed by genuinely different storage on the element after the page loads: the attribute keeps whatever was originally written in the HTML source, while the property tracks live, current state.',
      ]
    },
    {
      heading: 'This is directly, side-by-side observable after simulating real user input',
      points: [
        'Reading <code>input.getAttribute(\'value\')</code> and <code>input.value</code> immediately after page load shows them matching, since the property is initialized FROM the attribute at parse time — the divergence only becomes visible once something changes the LIVE value without touching the original markup.',
        'Programmatically setting <code>input.value = \'something new\'</code> (the same effect a real keystroke has) changes the property immediately, while <code>getAttribute(\'value\')</code> — checked again right afterward — still reports the original HTML string, completely unchanged.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>attribute vs property divergence</title></head>
  <body>
    <input id="demoInput" type="text" value="hello">
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;
const input = document.getElementById('demoInput') as HTMLInputElement;

function snapshot(label: string): string {
  return \`\${label}\\n  getAttribute('value') = "\${input.getAttribute('value')}"\\n  .value property       = "\${input.value}"\\n\`;
}

let log = snapshot('Immediately after page load:');

// Simulate a real user typing — this is exactly what a keystroke does to .value.
input.value = 'user typed this';

log += '\\n' + snapshot("After input.value = 'user typed this' (simulating real typing):");

output.textContent =
  log + '\\n' +
  'The attribute never changed — it still reports the ORIGINAL HTML string.\\n' +
  'Only the live .value property reflects what is actually in the field now.';
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The input starts with <code>value="hello"</code> in the HTML. After running <code>input.value = \'user typed this\'</code>, predict: what will <code>input.getAttribute(\'value\')</code> report — the new text, the original "hello", or null?',
    hint: 'The attribute represents what was ORIGINALLY written in the markup. Setting the .value PROPERTY changes the live DOM state, not the underlying HTML source the attribute reflects.',
    solution: `It still reports "hello" — completely unchanged. Setting the .value PROPERTY only updates the
element's live, in-memory current value; it does not reach back and rewrite the original value
ATTRIBUTE the HTML was parsed with. This is exactly the divergence the main page's quiz describes:
the attribute is a fixed snapshot of the initial markup, while the property is the genuinely live,
current state — and after any real user interaction (or any programmatic .value assignment), the
two can permanently disagree with each other, for the rest of that element's lifetime.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'input.getAttribute(\'value\') and input.value are just two different ways of accessing the exact same underlying data.',
      reality: 'They are backed by genuinely separate storage after parse time — the attribute is a fixed snapshot of the original HTML; the property is live, current state that user interaction (or script) can change independently.'
    },
    {
      thought: 'Calling setAttribute(\'value\', ...) on an input after the user has typed something will correctly update what the user currently sees in the field.',
      reality: 'Once a user has interacted with the field, setAttribute(\'value\', ...) only updates the underlying attribute — for a text input, the DISPLAYED, live value is governed by the .value property, which setAttribute does not touch in the same way once the field has been interacted with.'
    },
    {
      thought: 'This attribute/property divergence is a rare edge case that only matters for unusual, contrived situations.',
      reality: 'It happens on EVERY ordinary text input the instant a real user types anything — this is completely everyday behavior, not an edge case, which is exactly why understanding the distinction matters for anyone reading form state via the DOM.'
    },
  ];
}
