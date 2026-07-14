import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-service-workers-genuinely-have-no-dom-access',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './service-workers-genuinely-have-no-dom-access.html',
  styleUrl: './service-workers-genuinely-have-no-dom-access.scss'
})
export class ServiceWorkersGenuinelyHaveNoDomAccessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A different global scope entirely, not just a restricted one',
      points: [
        'The main page states it plainly: "Service workers run in a separate thread and cannot access the DOM directly." This is not a permissions restriction the way a sandboxed iframe is — it is architectural: a service worker executes in a completely different global context (<code>ServiceWorkerGlobalScope</code>), which never had <code>document</code>, <code>window</code>, or any DOM object defined on it in the first place.',
        'This is precisely why service workers communicate with the pages they control via message-passing (<code>postMessage</code>/<code>client.postMessage</code>) or the Clients API, rather than ever manipulating page content directly — there is no direct object to manipulate from inside the worker.',
      ]
    },
    {
      heading: 'This is directly checkable from inside the worker\'s own script',
      points: [
        'A service worker\'s own script can check <code>typeof document</code> and <code>typeof window</code> from its own global scope — both report <code>\'undefined\'</code>, since the identifiers simply do not exist there at all, not because access to them has been blocked or thrown as an error.',
        'The worker can report this self-check back to the page that registered it via <code>postMessage()</code> — turning "the worker has no DOM access" from documentation into a live, observable fact reported directly from inside the restricted context itself.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>service worker has no DOM access</title></head>
  <body>
    <p>A service worker checks its own global scope for document/window and reports back.</p>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'self-check-sw.js',
      content: `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', async (event) => {
  if (event.data !== 'CHECK_DOM_ACCESS') return;

  const report = {
    hasDocument: typeof document !== 'undefined',
    hasWindow: typeof window !== 'undefined',
    globalScopeName: self.constructor.name, // "ServiceWorkerGlobalScope"
  };

  const client = await self.clients.get(event.source.id);
  client?.postMessage(report);
});
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;

async function run() {
  if (!('serviceWorker' in navigator)) {
    output.textContent = 'Service workers are not supported in this environment.';
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/self-check-sw.js');
    await navigator.serviceWorker.ready;

    navigator.serviceWorker.addEventListener('message', (event) => {
      const { hasDocument, hasWindow, globalScopeName } = event.data;
      output.textContent =
        \`Self-check report FROM INSIDE the service worker's own script:\\n\\n\` +
        \`  typeof document !== 'undefined'  →  \${hasDocument}\\n\` +
        \`  typeof window !== 'undefined'    →  \${hasWindow}\\n\` +
        \`  self.constructor.name             →  "\${globalScopeName}"\\n\\n\` +
        'Both are false — document and window are not merely inaccessible, they are\\n' +
        'simply never defined in a service worker\\'s own global execution context.';
    });

    const controller = registration.active || navigator.serviceWorker.controller;
    controller?.postMessage('CHECK_DOM_ACCESS');
  } catch (err) {
    output.textContent = \`Registration failed in this sandbox: \${(err as Error).message}\`;
  }
}

run();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The service worker script checks <code>typeof document</code> from ITS OWN global scope, not from the page\'s scope. Predict: does this throw a SecurityError (access blocked), or does it evaluate cleanly to <code>\'undefined\'</code> (the identifier never existed)?',
    hint: 'A restricted-but-present object usually throws when you try to touch it (like a closed shadow root). A genuinely NON-EXISTENT global identifier just evaluates via typeof with no error at all.',
    solution: `It evaluates cleanly to 'undefined' — no error is thrown. typeof is specifically designed to be
safe against undeclared identifiers for exactly this reason; it never throws a ReferenceError even
when checking a name that was never declared anywhere in scope. This confirms the architectural
point: document isn't a restricted resource the service worker is blocked FROM reaching — it is an
identifier that was simply never defined in ServiceWorkerGlobalScope in the first place, the same
as checking typeof someRandomUndeclaredName in any other JavaScript context.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A service worker CAN access document and window, but doing so is discouraged or requires special permission.',
      reality: 'It genuinely cannot — document and window are undefined identifiers in ServiceWorkerGlobalScope, not restricted-but-present objects behind a permission check.'
    },
    {
      thought: 'Since service workers can\'t touch the DOM, they have no way to communicate with or affect the pages they control at all.',
      reality: 'They communicate through message-passing (postMessage/onmessage) and the Clients API (self.clients) — a real, two-way communication channel that just never involves directly manipulating DOM nodes.'
    },
    {
      thought: 'Attempting to access document from inside a service worker throws a runtime error you would need to catch.',
      reality: 'typeof document safely evaluates to \'undefined\' with no exception at all — the same behavior you would get checking typeof on any undeclared variable name in ordinary JavaScript.'
    },
  ];
}
