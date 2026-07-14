import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-clonenode-required-appendchild-consumes-the-template',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './clonenode-required-appendchild-consumes-the-template.html',
  styleUrl: './clonenode-required-appendchild-consumes-the-template.scss'
})
export class CloneNodeRequiredAppendChildConsumesTheTemplateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'template.content is a DocumentFragment — appendChild MOVES its nodes, it never copies them',
      points: [
        'The main page\'s Common Mistake is explicit: "<code>template.content</code> is a <code>DocumentFragment</code> — appending it moves the nodes (they are consumed). The second time you create an instance of the element the template is empty."',
        'This is a fundamental behavior of every <code>DocumentFragment</code>, not something specific to custom elements: appending a fragment (or any of its contents) to a new parent physically relocates those nodes, leaving the original fragment empty afterward — there is no implicit copy anywhere in that operation.',
      ]
    },
    {
      heading: 'One shared template + multiple element instances makes the bug concrete',
      points: [
        'A real component definition typically creates ONE <code>&lt;template&gt;</code> at module scope and reuses it for every instance of the custom element. If the constructor does <code>appendChild(template.content)</code> directly, the FIRST instance created empties the shared template completely — every instance created after that gets nothing.',
        '<code>template.content.cloneNode(true)</code> produces a brand new, independent <code>DocumentFragment</code> each time, leaving the original template\'s content untouched and ready to be cloned again for the next instance — this is why the fix is "clone, don\'t move."',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>cloneNode vs appendChild on template.content</title></head>
  <body>
    <p>Two custom elements, each built from ONE shared template — one clones it correctly, one appends it directly.</p>

    <h3>correct-card (uses cloneNode(true)):</h3>
    <correct-card></correct-card>
    <correct-card></correct-card>

    <h3>broken-card (uses appendChild(template.content) directly):</h3>
    <broken-card></broken-card>
    <broken-card></broken-card>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

// ── The CORRECT version: template.content.cloneNode(true) ──
const correctTemplate = document.createElement('template');
correctTemplate.innerHTML = '<p>I am a correct-card instance.</p>';

class CorrectCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    // A fresh, independent copy every time — the original template is untouched.
    this.shadowRoot!.appendChild(correctTemplate.content.cloneNode(true));
  }
}
customElements.define('correct-card', CorrectCard);

// ── The BROKEN version: appendChild(template.content) directly ──
const brokenTemplate = document.createElement('template');
brokenTemplate.innerHTML = '<p>I am a broken-card instance.</p>';

class BrokenCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    // This MOVES the nodes out of brokenTemplate.content — it will be empty
    // after the FIRST instance is created.
    this.shadowRoot!.appendChild(brokenTemplate.content);
  }
}
customElements.define('broken-card', BrokenCard);

window.addEventListener('load', () => {
  setTimeout(() => {
    const correctCards = Array.from(document.querySelectorAll('correct-card'));
    const brokenCards = Array.from(document.querySelectorAll('broken-card'));

    const report = (label: string, cards: Element[]) =>
      cards.map((c, i) => \`  \${label} #\${i}: shadowRoot innerHTML = "\${(c as any).shadowRoot.innerHTML.trim()}"\`).join('\\n');

    output.textContent =
      report('correct-card', correctCards) + '\\n\\n' +
      report('broken-card', brokenCards) + '\\n\\n' +
      'Both correct-card instances render content — cloneNode(true) never runs out.\\n' +
      'The SECOND broken-card instance is empty — appendChild already consumed the\\n' +
      'shared template\\'s content when the FIRST broken-card instance was created.';
  }, 300);
});
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Both broken-card elements share the exact same <code>brokenTemplate</code> object at module scope. Predict: does the FIRST broken-card instance render correctly, the SECOND one, both, or neither?',
    hint: 'appendChild(template.content) moves the fragment\'s nodes into whichever shadow root calls it FIRST — there is nothing left in the template for any instance created afterward.',
    solution: `Only the FIRST broken-card instance renders correctly. Its constructor runs appendChild(brokenTemplate.content),
which moves the paragraph node out of the shared template and into that first instance's shadow root —
brokenTemplate.content is now an empty DocumentFragment. When the SECOND broken-card's constructor runs
the exact same line, there is nothing left to move, so its shadow root ends up empty. This is exactly
why a shared template must always be cloned, never appended directly — the mistake is invisible with
only one instance on the page and only surfaces once a second instance is created.`
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>appendChild(template.content)</code> copies the template\'s markup into the new parent, the same way <code>innerHTML</code> assignment would.',
      reality: 'It MOVES the actual nodes — <code>template.content</code> is a live <code>DocumentFragment</code>, and appending it (or any of its children) relocates those nodes rather than duplicating them.'
    },
    {
      thought: 'This bug would only matter if you were sharing ONE template object across MULTIPLE custom element classes — a single class with its own template is safe either way.',
      reality: 'It breaks with a SINGLE class too, as soon as more than one instance of that element exists on the page — the shared template at module scope is emptied by whichever instance\'s constructor runs first.'
    },
    {
      thought: 'The fix, <code>cloneNode(true)</code>, is only necessary for complex templates with many child elements — a template with a single simple element is safe to append directly.',
      reality: 'The move-vs-copy distinction applies regardless of how simple or complex the template\'s content is — even a template containing a single text node is fully consumed by a direct <code>appendChild</code>.'
    },
  ];
}
