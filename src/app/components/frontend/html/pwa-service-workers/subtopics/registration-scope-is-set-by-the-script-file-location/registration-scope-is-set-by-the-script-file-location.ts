import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-registration-scope-is-set-by-the-script-file-location',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './registration-scope-is-set-by-the-script-file-location.html',
  styleUrl: './registration-scope-is-set-by-the-script-file-location.scss'
})
export class RegistrationScopeIsSetByTheScriptFileLocationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'No config option sets the scope — the URL path IS the scope',
      points: [
        'The main page\'s Common Mistake and Q&amp;A both point at this directly: "The service worker can only control pages within its scope and subdirectories," and the scope itself is determined by "the location of the service worker script file" — nothing else.',
        'There is no separate <code>scope</code> parameter you are required to think about for the common case: <code>navigator.serviceWorker.register(\'/sw.js\')</code> (script at the site root) defaults to controlling the ENTIRE origin, while <code>register(\'/blog/sw.js\')</code> defaults to controlling only <code>/blog/</code> and everything beneath it.',
      ]
    },
    {
      heading: 'This is directly, reliably readable from the registration object itself',
      points: [
        'The <code>ServiceWorkerRegistration</code> object returned by a successful <code>register()</code> call has a <code>.scope</code> property — a real, resolved absolute URL string representing exactly the boundary the browser computed from the script\'s own location.',
        'This makes the rule directly verifiable: register a worker from a subdirectory path and read <code>registration.scope</code> back — it will always match that subdirectory, never the origin root, confirming the location-determines-scope rule with no ambiguity.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head><title>service worker scope from script location</title></head>
  <body>
    <p>Registering a service worker from a subdirectory path — inspect the resulting scope.</p>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'subdir/sw.js',
      content: `// Deliberately empty — this demo only cares about the registration's scope,
// not any actual caching behavior.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
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
    // Registered from a SUBDIRECTORY path, not the site root.
    const registration = await navigator.serviceWorker.register('/subdir/sw.js');

    output.textContent =
      \`Registered: navigator.serviceWorker.register('/subdir/sw.js')\\n\\n\` +
      \`registration.scope = "\${registration.scope}"\\n\\n\` +
      (registration.scope.includes('/subdir/')
        ? 'Confirmed: the scope is limited to /subdir/ — exactly where the script file\\nitself lives, never the full origin, and nothing in the register() call\\nexplicitly requested this narrower scope.'
        : 'Scope reported did not include /subdir/ — check the sandbox\\'s serving path.');
  } catch (err) {
    output.textContent = \`Registration failed in this sandbox: \${(err as Error).message}\\n\\nThe underlying rule still applies in a real deployment: registration.scope\\nis always derived from the script file's own URL path.\`;
  }
}

run();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The demo registers <code>/subdir/sw.js</code> with no other configuration. Predict: will <code>registration.scope</code> report the full site origin (e.g., every page on the domain), or something narrower?',
    hint: 'The main page is explicit that the SCRIPT\'S OWN location determines scope — there is no separate step where a wider scope gets requested or granted by default.',
    solution: `It reports the narrower /subdir/ scope, not the full origin. Because the script was registered
from /subdir/sw.js, the browser computes its default scope as everything at or beneath that same
path — /subdir/, /subdir/anything, /subdir/deeper/whatever — but NOT pages at the site root or in
sibling directories. This is exactly why the main page's fix for "wrong scope" mistakes is simply
moving the script file itself to the root (or the desired common ancestor directory) rather than
trying to configure scope some other way.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'register() has a required or commonly-used scope parameter that developers explicitly set to control which pages a service worker manages.',
      reality: 'The vast majority of registrations pass no scope option at all — the DEFAULT scope, derived entirely from the script file\'s own URL path, is what developers rely on nearly all the time.'
    },
    {
      thought: 'A service worker registered at the site root can be deliberately narrowed to control only a subdirectory by some other configuration step.',
      reality: 'Without an explicit (and rarely used) scope option passed to register(), the DEFAULT is always as wide as the script\'s own location allows — a root-registered worker defaults to controlling the entire origin.'
    },
    {
      thought: 'Checking a service worker\'s actual scope requires reading server logs or the browser\'s DevTools Application panel.',
      reality: 'It is directly readable from plain JavaScript via registration.scope on the object register() resolves with — no DevTools panel or server-side inspection needed.'
    },
  ];
}
