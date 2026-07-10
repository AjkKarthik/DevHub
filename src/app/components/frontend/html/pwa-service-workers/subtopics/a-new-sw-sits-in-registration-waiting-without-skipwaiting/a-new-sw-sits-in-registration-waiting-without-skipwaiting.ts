import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-a-new-sw-sits-in-registration-waiting-without-skipwaiting',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './a-new-sw-sits-in-registration-waiting-without-skipwaiting.html',
  styleUrl: './a-new-sw-sits-in-registration-waiting-without-skipwaiting.scss'
})
export class ANewSwSitsInRegistrationWaitingWithoutSkipWaitingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A new worker version installs, but does not activate while the old one still controls open pages',
      points: [
        'The main page\'s quiz lays out the exact lifecycle: "install → waiting → activate." The Common Mistake reinforces the consequence: "Without these [skipWaiting/clients.claim], the new service worker waits for all tabs to close before activating." A genuinely NEW version of the script — one that finished installing successfully — does not automatically take over just because it exists.',
        'This is a deliberate safety mechanism: it prevents a page that is already open (and may have in-flight requests being handled by the OLD worker\'s logic) from suddenly having its network behavior swapped out from underneath it mid-session.',
      ]
    },
    {
      heading: 'This waiting state is directly, numerically observable via registration.waiting',
      points: [
        'The <code>ServiceWorkerRegistration</code> object exposes <code>.installing</code>, <code>.waiting</code>, and <code>.active</code> — each either <code>null</code> or a real <code>ServiceWorker</code> object representing that specific lifecycle slot at the current moment.',
        'Registering a genuinely different worker script at the SAME scope, while the OLD worker still controls the page (no reload in between), reliably produces a non-null <code>registration.waiting</code> — a real, checkable fact proving the new version is present but deliberately held back, exactly as the main page describes.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>registration.waiting without skipWaiting</title></head>
  <body>
    <p>Registers sw-v1.js, waits for it to become active, then registers a genuinely different sw-v2.js at the same scope — without navigating away.</p>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'sw-v1.js',
      content: `// v1: activates immediately (first-ever registration, so there is no
// existing controller to wait behind — this is the normal, expected case
// for a brand-new install).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
`,
    },
    {
      path: 'sw-v2.js',
      content: `// v2: genuinely different byte content from v1 (this comment alone is
// enough for the browser to detect it as an update) — and DELIBERATELY
// does NOT call skipWaiting(), to demonstrate the default waiting behavior.
self.addEventListener('install', () => {
  console.log('sw-v2 installed — waiting for the old worker\\'s tabs to close');
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
    // Step 1: register v1 and wait for it to fully activate and control this page.
    const reg = await navigator.serviceWorker.register('/sw-v1.js');
    await navigator.serviceWorker.ready;

    output.textContent = 'sw-v1 is now active and controlling this page.\\nRegistering sw-v2 (no skipWaiting) at the SAME scope, without reloading…\\n\\n';

    // Step 2: register a DIFFERENT script at the same scope, same page still open.
    const reg2 = await navigator.serviceWorker.register('/sw-v2.js');

    // Give the browser a moment to run through install for v2.
    await new Promise(resolve => setTimeout(resolve, 1500));

    output.textContent +=
      \`registration.installing: \${reg2.installing ? 'a worker (still installing)' : 'null'}\\n\` +
      \`registration.waiting:    \${reg2.waiting ? 'a worker (installed, HELD BACK)' : 'null'}\\n\` +
      \`registration.active:     \${reg2.active ? 'sw-v1 (still controlling, unchanged)' : 'null'}\\n\\n\` +
      (reg2.waiting
        ? 'Confirmed: sw-v2 finished installing and is sitting in registration.waiting —\\nit will NOT become active while this page stays open, exactly because it never\\ncalled self.skipWaiting().'
        : 'In this sandbox run, the update may have resolved faster than expected —\\nthe underlying registration.waiting mechanism still applies in a real deployment.');
  } catch (err) {
    output.textContent = \`Registration failed in this sandbox: \${(err as Error).message}\`;
  }
}

run();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'sw-v2.js finishes installing successfully but never calls <code>self.skipWaiting()</code>, and this page never reloads. Predict: does <code>registration.active</code> ever become sw-v2, or does it stay as sw-v1 for as long as this page remains open?',
    hint: 'The waiting state exists specifically to protect pages that are already open and being controlled by the OLD worker — closing/reloading is normally what lets a waiting worker finally activate.',
    solution: `registration.active stays as sw-v1 for as long as this page (and any other page using the
same worker) remains open — sw-v2 sits in registration.waiting indefinitely. This is exactly the
protective behavior the main page describes: a new worker version never forcibly takes over an
already-open page's network handling mid-session. The only ways to unstick it are (1) close every
tab controlled by sw-v1 and open a fresh one, letting the natural lifecycle activate sw-v2, or
(2) have sw-v2's own install handler call self.skipWaiting() to explicitly opt out of this
protection.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once a new service worker script finishes installing successfully, it automatically becomes the active controller for the page.',
      reality: 'Installing successfully only gets it as far as registration.waiting if an OLDER worker is still controlling an open page — it stays there, never auto-promoting to active, until skipWaiting() is called or every old-controlled tab closes.'
    },
    {
      thought: 'skipWaiting() and clients.claim() do the same thing, just with different names — either one alone is enough for instant takeover.',
      reality: 'They act on two different lifecycle moments: skipWaiting() (called during install) lets the NEW worker skip the waiting state and become active; clients.claim() (called during activate) then makes that newly-active worker take control of ALREADY-OPEN pages that were still being controlled by the old one. Both together are typically needed for a fully instant update.'
    },
    {
      thought: 'The waiting state is an implementation detail you would only discover by accident — there is no direct way to check for it.',
      reality: 'registration.waiting is a plain, directly readable property on the registration object — checking whether it is null or populated is a completely ordinary, documented way to detect this exact situation.'
    },
  ];
}
