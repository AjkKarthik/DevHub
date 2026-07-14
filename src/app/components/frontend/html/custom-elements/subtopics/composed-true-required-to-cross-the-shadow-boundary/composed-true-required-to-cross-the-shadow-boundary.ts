import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-composed-true-required-to-cross-the-shadow-boundary',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './composed-true-required-to-cross-the-shadow-boundary.html',
  styleUrl: './composed-true-required-to-cross-the-shadow-boundary.scss'
})
export class ComposedTrueRequiredToCrossTheShadowBoundarySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'bubbles and composed answer two completely different questions',
      points: [
        'The main page\'s Common Mistake is direct: "Events dispatched inside a shadow root do not cross the shadow boundary by default. Without <code>composed:true</code> the event stops at the shadow root and parent document listeners never receive it."',
        '<code>bubbles: true</code> only controls whether the event climbs UP through ancestor elements WITHIN the same DOM tree — it says nothing about crossing from a shadow tree into the light DOM that hosts it. <code>composed: true</code> is the separate, additional flag that lets the event escape the shadow root entirely and continue bubbling into the host document.',
      ]
    },
    {
      heading: 'The failure is completely silent — no error, the event just never arrives',
      points: [
        '<code>dispatchEvent()</code> never throws and never warns when an event fails to reach a listener outside the shadow root due to a missing <code>composed</code> flag — the event fires successfully INSIDE the shadow tree, and the outer listener\'s callback simply never runs.',
        'This is directly, reliably testable: attach a listener on <code>document</code> (fully outside any shadow root) and dispatch two otherwise-identical CustomEvents from inside a component\'s shadow root — one with <code>composed: true</code>, one without — and observe which one the outer listener actually receives.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>composed:true crossing the shadow boundary</title></head>
  <body>
    <event-source></event-source>
    <button id="fireBtn">Dispatch both events from inside the shadow root</button>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

class EventSource extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.innerHTML = '<p>I dispatch events from inside my own shadow root.</p>';
  }

  fireEvents() {
    // bubbles:true on BOTH — the only difference is composed.
    this.shadowRoot!.firstElementChild!.dispatchEvent(new CustomEvent('not-composed-event', {
      bubbles: true, composed: false, detail: { note: 'stays inside the shadow root' }
    }));
    this.shadowRoot!.firstElementChild!.dispatchEvent(new CustomEvent('composed-event', {
      bubbles: true, composed: true, detail: { note: 'crosses into the host document' }
    }));
  }
}
customElements.define('event-source', EventSource);

let notComposedHeard = false;
let composedHeard = false;

// Listeners attached on document — fully OUTSIDE any shadow root.
document.addEventListener('not-composed-event', () => { notComposedHeard = true; });
document.addEventListener('composed-event', () => { composedHeard = true; });

document.getElementById('fireBtn')!.addEventListener('click', () => {
  const source = document.querySelector('event-source') as EventSource & HTMLElement;
  (source as any).fireEvents();

  setTimeout(() => {
    output.textContent =
      \`document heard "not-composed-event" (composed:false)? \${notComposedHeard}\\n\` +
      \`document heard "composed-event" (composed:true)?     \${composedHeard}\\n\\n\` +
      'Both events had bubbles:true and were dispatched identically from inside\\n' +
      'the shadow root — composed is the ONLY difference, and it alone determines\\n' +
      'whether a listener outside the shadow root ever hears the event.';
  }, 50);
});
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Both events above are dispatched with <code>bubbles: true</code> — only <code>composed</code> differs. Predict: does <code>bubbles: true</code> alone get an event from inside a shadow root to a <code>document</code>-level listener?',
    hint: 'The main page draws the line precisely: bubbles controls climbing through ancestors WITHIN a tree; composed controls whether the event can leave that tree at all.',
    solution: `No — bubbles alone is not enough. The "not-composed-event" has bubbles:true but composed:false,
and document never hears it, because it never leaves the shadow root's own DOM tree in the first
place — there's nothing to bubble THROUGH once it's confined there. Only the "composed-event",
with composed:true added on top of bubbles:true, successfully escapes the shadow boundary and then
bubbles the rest of the way up to document. The two flags are independent and both matter.`
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>bubbles: true</code> is the flag that determines whether an event dispatched inside a shadow root reaches listeners outside it.',
      reality: '<code>bubbles</code> only controls climbing through ancestors WITHIN the same DOM tree. Escaping a shadow root into the host document requires the SEPARATE <code>composed: true</code> flag — bubbles alone never crosses that boundary.'
    },
    {
      thought: 'If a custom event fails to reach an outside listener, dispatchEvent() or the browser will report an error or warning.',
      reality: 'There is no error, warning, or any signal at all — the event fires successfully inside the shadow tree, and the outside listener simply never receives it. The only way to notice is that the expected callback never runs.'
    },
    {
      thought: 'composed:true is only relevant for events YOU dispatch manually with CustomEvent — native browser events like click always cross the shadow boundary automatically.',
      reality: 'Most native UI events (click, focus, input, etc.) are already composed by the browser\'s own default event configuration and cross shadow boundaries fine — but any CUSTOM event you dispatch yourself needs composed:true explicitly set, since CustomEvent defaults composed to false.'
    },
  ];
}
