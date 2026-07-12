import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './subresource-integrity-genuinely-blocks-a-mismatched-script.html',
  styleUrl: './subresource-integrity-genuinely-blocks-a-mismatched-script.scss'
})
export class SubresourceIntegrityGenuinelyBlocksAMismatchedScriptSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'SRI is a real, enforced byte-for-byte check — not a warning-only hint the browser might ignore',
      points: [
        'The <code>integrity</code> attribute on a <code>&lt;script&gt;</code> tag contains a cryptographic hash (SHA-256/384/512) of the EXACT expected file content. When the browser downloads the actual file, it computes the same hash and compares it.',
        'If the hashes do not match — whether from a genuine CDN compromise, a caching bug, or simply a typo in the integrity value — the browser refuses to execute the script entirely. The <code>onerror</code> event fires, exactly like a network failure, even though the file downloaded successfully.',
      ]
    },
    {
      heading: 'Confirmed directly with a genuinely matching hash, computed the same way a real deployment pipeline would',
      points: [
        'A script with an intentionally wrong <code>integrity</code> value failed with a real <code>onerror</code> event — the script never executed.',
        'The identical setup with the REAL SHA-384 hash of the script\'s own content — computed live via <code>crypto.subtle.digest()</code>, the same API build tools use to generate SRI hashes — loaded and executed successfully, confirmed by checking that the script\'s own side effect (setting a global marker) actually happened.',
        'This proves SRI is not merely advisory: an attacker who modifies even a single byte of a script served from a compromised CDN produces a hash mismatch, and the browser refuses to run the tampered file — the exact supply-chain protection the main page describes.',
      ]
    }
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>Subresource Integrity genuinely blocks a mismatched script</title>
  </head>
  <body>
    <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `function loadScriptWithIntegrity(src: string, integrity?: string): Promise<string> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    if (integrity) script.integrity = integrity;
    script.onload = () => resolve('loaded');
    script.onerror = () => resolve('blocked by the browser (integrity mismatch or network error)');
    document.head.appendChild(script);
    setTimeout(() => resolve('timeout'), 3000);
  });
}

(async () => {
  // Build a real script with a MARKER side effect, and compute its REAL hash live
  const uniqueMarker = '__sriDemoMarker_' + Date.now();
  const jsContent = \`window.\${uniqueMarker} = true;\`;
  const blob = new Blob([jsContent], { type: 'application/javascript' });
  const blobUrl = URL.createObjectURL(blob);

  const digest = await crypto.subtle.digest('SHA-384', new TextEncoder().encode(jsContent));
  const hashArray = new Uint8Array(digest);
  let binary = '';
  hashArray.forEach((b) => (binary += String.fromCharCode(b)));
  const realHash = 'sha384-' + btoa(binary);

  console.log('--- WRONG integrity hash ---');
  const wrongResult = await loadScriptWithIntegrity(blobUrl, 'sha384-thisHashWillNeverMatchAnything00000000000000000000000000000000');
  console.log('result:', wrongResult);

  console.log('--- CORRECT integrity hash (computed live via crypto.subtle.digest) ---');
  const correctResult = await loadScriptWithIntegrity(blobUrl, realHash);
  console.log('result:', correctResult);
  console.log('did the script actually execute?', (window as any)[uniqueMarker] === true);

  URL.revokeObjectURL(blobUrl);
})();
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adds integrity="sha384-..." to a third-party analytics script for supply-chain protection. Months later, the analytics vendor pushes a routine, legitimate update to the same URL (no version bump in the filename). The next deploy, the site\'s analytics silently stop working with no visible error to end users — only a console error mentioning the integrity check. What happened, and is this expected behaviour?',
    hint: 'Ask what SRI actually verifies — the URL, or the exact byte content at that URL — and what happens when the content changes but the integrity attribute in your own HTML does not.',
    solution: 'This is expected, correct behaviour, not a bug in SRI itself — the vendor changed the file content at the same URL, so it no longer matches the hash your HTML still specifies. Confirmed directly in this subtopic\'s demo: SRI checks the exact byte content, not just that "a file loaded from this URL" — any change at all produces a hash mismatch and the browser blocks execution. This is precisely why SRI is only safe to use with versioned, immutable URLs (a URL that is guaranteed to never change its content) — using it against a mutable "latest" URL from a vendor who updates in place will eventually break the integration the moment they ship a legitimate update.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Subresource Integrity is a soft warning — the browser logs a console message about the mismatch but still runs the script, since blocking a script outright would be too disruptive.',
      reality: 'It is a hard block, confirmed directly in this subtopic\'s demo — a mismatched-hash script never executes at all (onerror fires, not onload), exactly the same as if the network request had failed outright.'
    },
    {
      thought: 'Computing the correct SRI hash requires a specialised build tool or online generator — it cannot be done directly in a browser.',
      reality: 'The Web Crypto API (crypto.subtle.digest()) computes real, standards-compliant hashes directly in any script — this subtopic\'s demo computes a genuine SHA-384 hash live and uses it successfully, the same underlying mechanism real build tools use.'
    },
    {
      thought: 'Since SRI blocks the script entirely on a mismatch, it protects against ALL forms of third-party script risk, including a vendor script that is legitimate but simply behaves maliciously or badly by design.',
      reality: 'SRI only verifies the file has not been TAMPERED WITH since the hash was generated — it says nothing about whether the vendor\'s own, unmodified code is trustworthy or well-behaved. A malicious or poorly-written script that matches its own declared hash passes the SRI check without any issue.'
    }
  ];
}
