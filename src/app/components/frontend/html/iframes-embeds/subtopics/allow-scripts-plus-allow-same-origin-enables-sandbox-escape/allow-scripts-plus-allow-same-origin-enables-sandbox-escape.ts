import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-allow-scripts-plus-allow-same-origin-enables-sandbox-escape',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './allow-scripts-plus-allow-same-origin-enables-sandbox-escape.html',
  styleUrl: './allow-scripts-plus-allow-same-origin-enables-sandbox-escape.scss'
})
export class AllowScriptsPlusAllowSameOriginEnablesSandboxEscapeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The exact mechanism: frameElement plus removeAttribute',
      points: [
        'The main page\'s Q&amp;A spells out the precise attack: "A sandboxed iframe with both tokens can run JavaScript that has same-origin access to the parent DOM. That script can call <code>window.parent.document.querySelector(\'iframe\').removeAttribute(\'sandbox\')</code>, removing the sandbox at runtime and escaping all restrictions."',
        'Inside a same-origin frame, <code>window.frameElement</code> IS that exact <code>&lt;iframe&gt;</code> DOM node as seen from the parent document — <code>allow-same-origin</code> is precisely what makes this reference non-null and usable; without it, the frame has an opaque origin and <code>frameElement</code> access throws.',
      ]
    },
    {
      heading: 'This is a real, reproducible mechanism — not a hypothetical',
      points: [
        'Both tokens are individually reasonable to want: <code>allow-scripts</code> for interactive third-party widgets, <code>allow-same-origin</code> for content that genuinely needs same-origin access. It is specifically the COMBINATION that is dangerous — either token alone does not enable this escape.',
        'You can demonstrate the exact mechanism safely: a sandboxed script calls <code>frameElement.removeAttribute(\'sandbox\')</code> on itself, and the PARENT page can then observe that the <code>sandbox</code> attribute is genuinely gone from the iframe element in its own DOM — proving the restriction was truly removed, not merely bypassed for one action.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>sandbox escape via allow-scripts + allow-same-origin</title></head>
  <body>
    <p>An iframe with <code>sandbox="allow-scripts allow-same-origin"</code> — its own script removes its sandbox attribute.</p>
    <iframe id="escapee" sandbox="allow-scripts allow-same-origin"></iframe>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;
const iframe = document.getElementById('escapee') as HTMLIFrameElement;

output.textContent = \`Before: sandbox attribute present? \${iframe.hasAttribute('sandbox')}   value = "\${iframe.getAttribute('sandbox')}"\\n\`;

// The iframe's own script (running inside it, with allow-same-origin) reaches
// back into the PARENT document via frameElement and removes its own sandbox.
const escapeScript = \`
  <script>
    // window.frameElement only works because allow-same-origin is present —
    // without it, this access would throw a SecurityError instead.
    window.frameElement.removeAttribute('sandbox');
    window.parent.postMessage({ escaped: true }, '*');
  <\\/script>
\`;

window.addEventListener('message', (e) => {
  if (e.data?.escaped) {
    output.textContent +=
      \`\\nAfter (reported by the iframe's own script running inside it):\\n\` +
      \`  sandbox attribute present? \${iframe.hasAttribute('sandbox')}   value = "\${iframe.getAttribute('sandbox')}"\\n\\n\` +
      'The sandbox attribute is genuinely GONE from the parent\\'s own DOM — removed\\n' +
      'by code running inside the frame that was supposed to be restricted by it.\\n' +
      'This is exactly why allow-scripts + allow-same-origin together defeats sandboxing.';
  }
});

iframe.srcdoc = escapeScript;
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The iframe above starts with <code>sandbox="allow-scripts allow-same-origin"</code>. Predict: after its own script runs <code>frameElement.removeAttribute(\'sandbox\')</code>, is the sandbox attribute merely bypassed for that one script, or is it genuinely removed from the iframe element going forward?',
    hint: '<code>removeAttribute()</code> is a real DOM mutation on the actual <code>&lt;iframe&gt;</code> element in the parent\'s own document — it isn\'t a one-time workaround, it changes the element permanently (until something re-adds the attribute).',
    solution: `It is genuinely removed — permanently, until something explicitly re-adds it. frameElement.removeAttribute('sandbox')
is an ordinary DOM mutation performed on the real iframe element that lives in the PARENT document's
own DOM tree. Once removed, any future navigation or reload of that iframe would happen with NO
sandbox restrictions at all, since the attribute the browser checks is simply gone. This is why the
main page's fix is never combining the two tokens in the first place — once combined, the sandbox
is only as strong as "the embedded script chooses not to remove it," which is not a real restriction.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Sandbox restrictions are enforced by the browser at a level scripts inside the iframe cannot possibly reach or modify.',
      reality: 'A script running with allow-scripts and allow-same-origin has a genuine reference back to its own iframe element via window.frameElement — and can call ordinary DOM methods like removeAttribute on it, exactly like any other same-origin script could.'
    },
    {
      thought: 'allow-scripts and allow-same-origin are each individually risky, so using just one of them still carries most of the same danger as using both together.',
      reality: 'Neither token alone enables this specific escape. allow-scripts without allow-same-origin means any script runs in an opaque origin with no frameElement access; allow-same-origin without allow-scripts means no script executes at all. The danger is specifically the COMBINATION.'
    },
    {
      thought: 'This kind of sandbox escape would require some kind of unusual exploit or browser bug — not something achievable with plain, ordinary DOM methods.',
      reality: 'The demo above uses nothing but window.frameElement and Element.removeAttribute — both completely ordinary, well-documented DOM APIs. The vulnerability is a direct, intended consequence of what allow-same-origin grants, not a bug.'
    },
  ];
}
