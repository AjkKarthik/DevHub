import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-empty-sandbox-blocks-script-execution',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './empty-sandbox-blocks-script-execution.html',
  styleUrl: './empty-sandbox-blocks-script-execution.scss'
})
export class EmptySandboxBlocksScriptExecutionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'sandbox tokens are additive — nothing is granted unless you name it',
      points: [
        'The main page\'s Q&amp;A is explicit: "An empty sandbox attribute blocks all of: script execution, form submission, pointer lock, popups, top-frame navigation, same-origin access. You re-enable each permission with a token." An empty <code>sandbox=""</code> is the strictest possible state — not a mild default.',
        '<code>allow-scripts</code> and <code>allow-same-origin</code> are two completely independent tokens. Granting one says nothing about the other: a frame can be allowed to run scripts but still be treated as a cross-origin, unreadable black box from the parent\'s perspective, or vice versa.',
      ]
    },
    {
      heading: 'Without allow-scripts, the <script> tag is present in the markup but never runs',
      points: [
        'This is not a silent JavaScript error you can catch — the browser simply never executes the script content at all when the enclosing frame lacks <code>allow-scripts</code>. Any DOM mutation that script would have performed simply never happens.',
        'You can prove this by writing a script that mutates a specific element\'s text content on run — with the token, the mutation happens; without it, the element\'s original markup value is exactly what remains, with zero indication anything was ever attempted.',
      ]
    },
    {
      heading: 'allow-same-origin governs whether the PARENT can read into the frame, not whether the frame\'s own script runs',
      points: [
        'Without <code>allow-same-origin</code>, a sandboxed frame is treated as having an opaque (unique) origin — this means the PARENT page\'s own JavaScript is blocked by the same-origin policy from reading <code>iframe.contentDocument</code>, even for a same-page <code>srcdoc</code> frame that never left same-origin data at all.',
        'This is the mechanism actually used below to prove the point: both demo frames grant <code>allow-same-origin</code> so the parent CAN inspect their contents — isolating <code>allow-scripts</code> as the only variable that changes whether the mutation happened.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>sandbox tokens gate script execution</title></head>
  <body>
    <p>Two identical srcdoc iframes, differing only in their sandbox attribute:</p>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

// The same tiny document — a marker div plus a script that mutates it — loaded
// into two frames with different sandbox permissions.
const frameContent = \`
  <div id="marker">not-run</div>
  <script>document.getElementById('marker').textContent = 'ran';</script>
\`;

function makeSandboxedFrame(sandboxValue: string): HTMLIFrameElement {
  const frame = document.createElement('iframe');
  frame.sandbox.value = sandboxValue;
  frame.srcdoc = frameContent;
  frame.style.display = 'none';
  document.body.appendChild(frame);
  return frame;
}

function readMarker(frame: HTMLIFrameElement): string {
  // allow-same-origin on BOTH frames is what makes this read even possible —
  // without it, contentDocument access throws a SecurityError from the parent.
  try {
    const doc = frame.contentDocument!;
    return doc.getElementById('marker')!.textContent!;
  } catch (e) {
    return \`SecurityError: \${(e as Error).message}\`;
  }
}

// Frame A: allow-same-origin only — script tag present, but NOT allowed to run.
const frameA = makeSandboxedFrame('allow-same-origin');
// Frame B: allow-scripts AND allow-same-origin — script runs, and we can read the result.
const frameB = makeSandboxedFrame('allow-scripts allow-same-origin');

setTimeout(() => {
  output.textContent =
    \`sandbox="allow-same-origin" (no allow-scripts):\\n  marker text = "\${readMarker(frameA)}"\\n\\n\` +
    \`sandbox="allow-scripts allow-same-origin":\\n  marker text = "\${readMarker(frameB)}"\\n\`;
}, 300);
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Both frames above grant <code>allow-same-origin</code>, so the parent can read into both. Predict: if you removed <code>allow-same-origin</code> from Frame B too (leaving only <code>sandbox="allow-scripts"</code>), would the script inside Frame B still run and update its own marker div?',
    hint: 'allow-scripts and allow-same-origin are independent tokens. One controls whether script executes AT ALL inside the frame; the other controls whether outside code can read the frame\'s contents afterward.',
    solution: `Yes — the script still runs and updates its own marker to "ran". allow-scripts alone is fully
sufficient for the frame's OWN script to execute; the frame's internal DOM mutation happens
regardless of allow-same-origin. What changes is that readMarker(frameB) called from the PARENT
would now throw a SecurityError, because without allow-same-origin the frame has an opaque origin
and the parent's contentDocument access is blocked by the same-origin policy — even though the
mutation genuinely happened inside the frame. The two tokens gate two completely different things.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The <code>sandbox</code> attribute mainly exists to stop an iframe from navigating the top-level page — script execution is a separate, secondary concern.',
      reality: 'An empty <code>sandbox=""</code> blocks script execution FIRST, alongside forms, popups, and top navigation, all at once. Scripts are one of the primary things sandboxing restricts by default, not an afterthought.'
    },
    {
      thought: '<code>allow-scripts</code> and <code>allow-same-origin</code> are basically the same permission under two names — you need both or neither.',
      reality: 'They are fully independent. <code>allow-scripts</code> lets code run inside the frame; <code>allow-same-origin</code> lets code OUTSIDE the frame (the parent) read the frame\'s contents. A frame can have either one without the other.'
    },
    {
      thought: 'A script that fails to run inside a sandboxed frame throws a catchable error you could detect with try/catch around the script.',
      reality: 'There is nothing to catch — the browser simply never executes the script\'s contents at all. The only way to detect it happened (or didn\'t) is to check the resulting DOM state afterward, exactly as the demo above does.'
    },
  ];
}
