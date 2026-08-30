import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Labeled for SPAs, Written for Node.js',
    points: [
      'The main page\'s own quickRef calls Auth Code + PKCE "the correct flow for SPAs and mobile apps," and the theory repeats "PKCE is the recommended flow for all public clients (SPAs, mobile apps, CLIs)." But the main page\'s own "Auth Code + PKCE Flow" codeTab opens with <code>import crypto from \'crypto\'</code> and calls <code>crypto.randomBytes()</code>/<code>crypto.createHash()</code> — Node.js\'s built-in <code>crypto</code> module, which does not exist in a browser at all. A reader trying to paste that exact code into a real SPA would hit an unresolved import immediately.',
      'This subtopic builds the actual BROWSER-side equivalent — verified against the real Web Crypto API (<code>crypto.getRandomValues()</code>, <code>crypto.subtle.digest()</code>) via WebSearch before publishing — so a genuine SPA implementation has working code to reference, not just Node.js code that happens to demonstrate the same algorithm.',
    ],
  },
  {
    heading: 'The Browser API Is Asynchronous and Returns Raw Bytes, Not a String',
    points: [
      'Node\'s <code>crypto.createHash(\'sha256\').update(x).digest(\'base64url\')</code> is synchronous and hands back an already-base64url-encoded STRING directly. The browser\'s <code>crypto.subtle.digest(\'SHA-256\', data)</code> is asynchronous (it returns a <code>Promise</code>) and resolves to a raw <code>ArrayBuffer</code> of hash bytes — there is no built-in base64url encoding step at all; the caller has to do that conversion manually.',
      'The <code>crypto.subtle</code> API is also only available in a SECURE CONTEXT — HTTPS, or <code>localhost</code> for local development. A SPA served over plain HTTP (common in some internal/legacy deployments) would find <code>window.crypto.subtle</code> simply undefined, a real deployment gotcha the main page\'s Node-only codeTab gives no hint of.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Main Page\'s Own Codetab (Node.js Only)',
    language: 'typescript',
    code: `import crypto from 'crypto';   // Node.js built-in module -- unavailable in a browser

function generatePkce() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  return { codeVerifier, codeChallenge };
}

// This is genuinely correct PKCE code -- but ONLY in a Node.js
// environment (a server-side confidential client, or a backend-for-
// frontend proxying the flow). Trying to run "import crypto from
// 'crypto'" in a browser bundle fails outright.`,
  },
  {
    label: 'The Actual Browser Equivalent (Web Crypto API)',
    language: 'typescript',
    code: `// No import needed -- crypto.subtle is a GLOBAL available directly
// on window in any secure context (HTTPS, or localhost for dev).

function base64urlFromBytes(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
}

async function generatePkce(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  // getRandomValues() fills a TypedArray in place -- this is the
  // browser's equivalent of Node's crypto.randomBytes().
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const codeVerifier = base64urlFromBytes(randomBytes);

  // subtle.digest() is ASYNC (returns a Promise) and hands back a raw
  // ArrayBuffer -- unlike Node's synchronous, already-encoded digest().
  const verifierBytes = new TextEncoder().encode(codeVerifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', verifierBytes);
  const codeChallenge = base64urlFromBytes(new Uint8Array(hashBuffer));

  return { codeVerifier, codeChallenge };
}

// Usage requires await, unlike the main page's synchronous version:
const { codeVerifier, codeChallenge } = await generatePkce();`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A team deploys their SPA to an internal corporate network over plain HTTP (no TLS certificate configured yet) — everything else about the deployment works. What specifically breaks when a user tries to log in, and what does the resulting error most likely look like to a developer debugging it?',
  hint: 'Check exactly which object the browser-side code above depends on being defined, and what a secure-context restriction actually does to that object when the page is served over HTTP.',
  solution: `// crypto.subtle is undefined outside a secure context, so the very
// first call -- crypto.subtle.digest(...) -- throws a TypeError
// ("Cannot read properties of undefined (reading 'digest')") the
// instant the login flow tries to generate the PKCE pair, before any
// network request to the authorization server is even made.

// This can be a genuinely confusing bug to debug for a team unfamiliar
// with the secure-context restriction: crypto.getRandomValues() still
// works fine everywhere (it has no such restriction), so the
// code_verifier generation step succeeds -- the failure happens one
// line later, specifically at the SHA-256 hashing step, which can
// mislead a developer into suspecting the hashing LOGIC is wrong
// rather than realizing the entire crypto.subtle namespace simply
// isn't present on this page at all.

// The fix has nothing to do with the PKCE code itself -- it requires
// serving the SPA over HTTPS (or testing locally via localhost, which
// browsers specifically exempt from the secure-context requirement
// for development convenience).`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the main page\'s "Auth Code + PKCE Flow" codeTab is described as the correct flow for SPAs, the code shown is directly runnable in a browser SPA.',
    reality: 'The ALGORITHM described is correct for SPAs, but the SPECIFIC CODE shown imports Node.js\'s built-in <code>crypto</code> module, which has no browser equivalent and cannot be imported into browser JavaScript at all (without a bundler polyfill, which modern bundlers like Vite no longer provide by default). The codeTab is accurate, runnable code — just for a Node.js context (a backend confidential client or a server-side BFF), not literally the SPA the surrounding theory describes.',
  },
  {
    thought: '<code>crypto.subtle.digest()</code> can be called the same way as Node\'s <code>hash.digest()</code> — just swap the function name and the rest of the code stays the same.',
    reality: 'The two APIs differ in two structural ways that break a naive swap: Node\'s version is SYNCHRONOUS and returns an already-base64url-ENCODED STRING directly; the browser\'s version is ASYNCHRONOUS (returns a <code>Promise</code>) and resolves to a raw, UNENCODED <code>ArrayBuffer</code> that the caller must manually convert to base64url. Code written for one API needs real changes — an <code>await</code>, and a manual byte-to-base64url conversion step — to work with the other, not just a renamed function call.',
  },
];

@Component({
  selector: 'app-sec-oauth-pkce-browser',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './pkce-in-the-browser-with-the-web-crypto-api.html',
  styleUrl: './pkce-in-the-browser-with-the-web-crypto-api.scss',
})
export class PkceInTheBrowserWithTheWebCryptoApiSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
