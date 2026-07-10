import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-attributechangedcallback-fires-before-connectedcallback',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './attributechangedcallback-fires-before-connectedcallback.html',
  styleUrl: './attributechangedcallback-fires-before-connectedcallback.scss'
})
export class AttributeChangedCallbackFiresBeforeConnectedCallbackSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The upgrade order is fixed: constructor → attributeChangedCallback → connectedCallback',
      points: [
        'The main page states the exact order: "constructor → attributeChangedCallback (for attributes already in HTML) → connectedCallback — any attributeChangedCallback calls before connectedCallback mean the element is not yet in the document."',
        'This means if your markup is <code>&lt;my-badge status="ok"&gt;</code>, <code>attributeChangedCallback(\'status\', null, \'ok\')</code> fires for that pre-existing attribute BEFORE <code>connectedCallback</code> ever runs — a genuinely easy assumption to get backwards, since it feels natural to expect the element to be "set up" (connected) before anything reacts to its attributes.',
      ]
    },
    {
      heading: 'attributeChangedCallback is silent for anything not in observedAttributes',
      points: [
        'The main page\'s matching Common Mistake is separate but related: "<code>attributeChangedCallback</code> is never called unless you declare which attributes to observe in the static <code>observedAttributes</code> getter. Without it, attribute changes are silently ignored" — no error, no warning, the callback method (even if fully implemented) is simply never invoked at all for unlisted attribute names.',
        'Both rules are provable together with one small demo: log every lifecycle call in order for an element created WITH a pre-existing observed attribute, and separately show that changing an attribute NOT in <code>observedAttributes</code> produces zero additional log lines.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>attributeChangedCallback order</title></head>
  <body>
    <!-- status is pre-existing in the HTML; note-unwatched is deliberately NOT observed -->
    <lifecycle-badge status="ok" note-unwatched="hello"></lifecycle-badge>

    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;
const log: string[] = [];

class LifecycleBadge extends HTMLElement {
  static get observedAttributes() {
    return ['status']; // note-unwatched is intentionally NOT listed here
  }

  constructor() {
    super();
    log.push('1. constructor()');
  }

  attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null) {
    log.push(\`2. attributeChangedCallback('\${name}', \${oldVal}, '\${newVal}')  ← isConnected: \${this.isConnected}\`);
  }

  connectedCallback() {
    log.push(\`3. connectedCallback()  ← isConnected: \${this.isConnected}\`);
  }
}
customElements.define('lifecycle-badge', LifecycleBadge);

window.addEventListener('load', () => {
  setTimeout(() => {
    const badge = document.querySelector('lifecycle-badge')!;

    // Now change the UNWATCHED attribute — observedAttributes never listed it.
    badge.setAttribute('note-unwatched', 'changed');

    setTimeout(() => {
      output.textContent =
        'Lifecycle call order for <lifecycle-badge status="ok" note-unwatched="hello">:\\n\\n' +
        log.join('\\n') +
        \`\\n\\nAfter setAttribute('note-unwatched', 'changed') — total log entries: \${log.length}\\n\` +
        '(unchanged — note-unwatched is not in observedAttributes, so nothing fired for it)';
    }, 50);
  }, 50);
});
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The element in the demo is written as <code>&lt;lifecycle-badge status="ok" ...&gt;</code> — the <code>status</code> attribute is already present in the HTML before the page even finishes parsing. Predict: does <code>attributeChangedCallback</code> fire for that pre-existing <code>status</code> value BEFORE or AFTER <code>connectedCallback</code>?',
    hint: 'The main page\'s exact stated order is constructor → attributeChangedCallback (for pre-existing attributes) → connectedCallback.',
    solution: `It fires BEFORE — attributeChangedCallback('status', null, 'ok') runs as log entry #2, and
connectedCallback() runs as log entry #3, exactly matching the main page's documented upgrade order.
Notice the isConnected value logged alongside each call: at the point attributeChangedCallback fires
for this pre-existing attribute, this.isConnected can genuinely still be false — code inside
attributeChangedCallback that assumes the element is already in the document (e.g. querying a parent,
or relying on layout) can break specifically on this very first, pre-connection call.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'connectedCallback always runs first, since it represents the element becoming "ready" — attributeChangedCallback only fires afterward, in response to later changes.',
      reality: 'For attributes already present in the HTML markup, attributeChangedCallback fires DURING the upgrade process, before connectedCallback — the element is not yet guaranteed to be fully connected at that point.'
    },
    {
      thought: 'Implementing the attributeChangedCallback(name, oldValue, newValue) method is sufficient for it to be called whenever any attribute changes.',
      reality: 'It is only ever invoked for attribute names explicitly listed in the static observedAttributes getter — implementing the method with no matching entry in that array means it is never called for that attribute, with no warning.'
    },
    {
      thought: 'Since attributeChangedCallback and connectedCallback both eventually run for a normal element with pre-existing attributes, the exact order between them rarely matters in practice.',
      reality: 'It matters specifically when attributeChangedCallback logic assumes DOM context that only exists once connected (e.g., reading layout, querying an ancestor, or relying on shadow DOM already being attached in a particular way) — code that works fine on LATER attribute changes can still fail on this very first, pre-connection call.'
    },
  ];
}
