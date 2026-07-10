import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-aria-labelledby-concatenates-in-listed-order-skips-missing-ids',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './aria-labelledby-concatenates-in-listed-order-skips-missing-ids.html',
  styleUrl: './aria-labelledby-concatenates-in-listed-order-skips-missing-ids.scss'
})
export class AriaLabelledbyConcatenatesInListedOrderSkipsMissingIdsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The listed order of ids wins, not the order elements appear in the DOM',
      points: [
        'The main page\'s Q&amp;A is explicit: "When aria-labelledby references multiple space-separated ids, the browser concatenates the text content of each referenced element IN THE ORDER LISTED (not DOM order)." This is a genuinely easy thing to get backwards — it feels natural to assume the browser would just read whichever element comes first on the page.',
        'This is also exactly why <code>aria-labelledby</code> can do something <code>aria-label</code> fundamentally cannot: compose a single accessible name out of multiple, visually-separate pieces of the page (e.g. a heading plus a status badge, in whatever order makes sense for the announcement) — not just echo one fixed string.',
      ]
    },
    {
      heading: 'A missing referenced id is silently skipped, not an error',
      points: [
        'If one of the ids in <code>aria-labelledby="title subtitle"</code> does not exist anywhere in the document, that reference is simply left out of the computed name — no console warning, no thrown error, no fallback substitution.',
        'This is a realistic, easy-to-introduce bug: rename an element\'s <code>id</code> during a refactor and forget to update every <code>aria-labelledby</code> that referenced it — the accessible name silently gets shorter and less complete, with nothing in the browser\'s dev tools flagging it.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>aria-labelledby order and missing-id skip</title></head>
  <body>
    <!-- Deliberately out of DOM order relative to the labelledby reference order -->
    <span id="subtitle">— Advanced Settings</span>
    <span id="title">Preferences</span>

    <button id="demoBtn" aria-labelledby="title subtitle missing-id">Gear icon</button>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

// Replicates the spec's aria-labelledby name-computation rule ourselves —
// there is no cross-browser JS API to directly read the REAL computed
// accessible name, so this mirrors the algorithm the browser actually runs:
// walk the space-separated id LIST IN ORDER, skip any id that doesn't resolve.
function computeLabelledByName(el: Element): string {
  const idList = (el.getAttribute('aria-labelledby') || '').split(/\\s+/).filter(Boolean);
  const parts: string[] = [];
  for (const id of idList) {
    const referenced = document.getElementById(id);
    if (referenced) parts.push(referenced.textContent!.trim());
    // a missing id is silently skipped — no error, no placeholder text
  }
  return parts.join(' ');
}

// For comparison: what a naive "just read DOM order" implementation would produce.
function domOrderName(el: Element): string {
  const idList = new Set((el.getAttribute('aria-labelledby') || '').split(/\\s+/).filter(Boolean));
  const inDomOrder = Array.from(document.querySelectorAll('[id]'))
    .filter(node => idList.has(node.id))
    .map(node => node.textContent!.trim());
  return inDomOrder.join(' ');
}

const btn = document.getElementById('demoBtn')!;
output.textContent =
  \`aria-labelledby="title subtitle missing-id"\\n\\n\` +
  \`Correct (listed order, missing id skipped):\\n  "\${computeLabelledByName(btn)}"\\n\\n\` +
  \`Wrong assumption (DOM order instead of listed order):\\n  "\${domOrderName(btn)}"\\n\\n\` +
  'The two differ because #subtitle appears BEFORE #title in the DOM, even though\\n' +
  '"title" is listed first in aria-labelledby — and "missing-id" never resolves at all.';
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The button above has <code>aria-labelledby="title subtitle missing-id"</code>. <code>#subtitle</code> appears BEFORE <code>#title</code> in the actual HTML source. Predict: does the real accessible name start with "Preferences" or "— Advanced Settings"?',
    hint: 'The spec computes the name by walking the space-separated id LIST in the order it is written in the attribute value — not by scanning the document from top to bottom.',
    solution: `It starts with "Preferences" — the order in the aria-labelledby attribute string ("title subtitle
missing-id") is what decides concatenation order, completely independent of where #title and
#subtitle physically sit in the document. "missing-id" contributes nothing since no element with
that id exists — it is skipped silently rather than producing an error or a placeholder.`
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>aria-labelledby="a b"</code> reads whichever of #a or #b appears first in the HTML document, the same way CSS selectors match in document order.',
      reality: 'It reads the ids in the exact order they are LISTED in the attribute string — "a b" always produces "a\'s text" then "b\'s text," regardless of which element is physically first on the page.'
    },
    {
      thought: 'If one id in a multi-id aria-labelledby doesn\'t exist, the whole attribute is invalid and the browser falls back to aria-label or inner text instead.',
      reality: 'Only the missing reference is skipped — every other valid id still contributes its text to the computed name. There is no fallback to a completely different labelling mechanism.'
    },
    {
      thought: 'You can check what a real screen reader would announce by calling some built-in JS API to read the computed accessible name.',
      reality: 'There is no reliable, standard, cross-browser JS API exposed to page scripts for reading a live computed accessible name — verifying this mechanic requires understanding (or replicating) the spec\'s own algorithm, exactly like the audit function used above.'
    },
  ];
}
