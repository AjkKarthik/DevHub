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
    heading: 'A Mechanism Named at AWS/Stripe Level of Detail, Never Built',
    points: [
      'The quiz explains exactly what HMAC request signing is for and how it works: "HTTPS encrypts the transport but does not prove that the request body was not modified by a man-in-the-middle proxy, or that the client is who it claims to be beyond the API key... the client computes <code>HMAC(secretKey, canonicalRequest)</code>... the server recomputes the HMAC and compares... used by AWS Signature Version 4, Stripe webhook signatures, and payment APIs." The main page\'s own "API Key Management" codeTab validates a static key by hash comparison — a genuinely different mechanism, and HMAC signing itself never appears anywhere.',
      'This subtopic builds the actual signing and verification pair, verified end-to-end via direct execution, along with the specific reason the quiz names for needing BOTH a timestamp and the signature: replay-attack prevention.',
    ],
  },
  {
    heading: 'Why an API Key Alone Doesn\'t Provide What HMAC Signing Adds',
    points: [
      'The main page\'s own API key mechanism proves "this caller possesses a valid key" — but says nothing about whether the specific REQUEST BODY that arrived is the same one the caller actually sent. A network intermediary (a misbehaving proxy, a compromised load balancer inside the request path even under TLS termination) could in principle alter the body while the API key header stays exactly the same.',
      'HMAC signing binds the signature to the SPECIFIC CONTENT of the request — the method, path, and body are all part of what gets signed. Any alteration to any of those, however small, changes the computed HMAC, and the server\'s independently-recomputed HMAC will no longer match — this is the integrity guarantee the quiz names, layered on top of (not instead of) whatever authentication the API key already provides.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Client — Signing a Request',
    language: 'typescript',
    code: `import crypto from 'crypto';

interface SignedRequest {
  timestamp: string;
  signature: string;
}

function signRequest(method: string, path: string, body: string, secretKey: string): SignedRequest {
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // The canonical request: method + path + timestamp + body, all
  // concatenated in a FIXED, well-defined order -- both sides must
  // build this identical string for the signatures to ever match.
  const canonicalRequest = \`\${method}\\n\${path}\\n\${timestamp}\\n\${body}\`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(canonicalRequest)
    .digest('hex');

  return { timestamp, signature };
}

const secretKey = 'shared-secret-abc123';
const body = JSON.stringify({ amount: 5000, currency: 'usd' });
const { timestamp, signature } = signRequest('POST', '/api/charges', body, secretKey);

// Sent as headers alongside the ordinary request:
// X-Signature-Timestamp: <timestamp>
// X-Signature: <signature>`,
  },
  {
    label: 'Server — Verifying, With Replay Protection',
    language: 'typescript',
    code: `const MAX_TIMESTAMP_AGE_SECONDS = 300;   // 5 minutes

function verifySignedRequest(
  method: string, path: string, body: string,
  timestamp: string, providedSignature: string, secretKey: string,
): { valid: boolean; reason?: string } {
  // Replay protection: reject anything outside a tight window --
  // this is what stops a captured, genuinely-valid signed request
  // from being resent hours or days later and still passing.
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (Math.abs(age) > MAX_TIMESTAMP_AGE_SECONDS) {
    return { valid: false, reason: 'Timestamp outside allowed window' };
  }

  const canonicalRequest = \`\${method}\\n\${path}\\n\${timestamp}\\n\${body}\`;
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(canonicalRequest)
    .digest('hex');

  // Constant-time comparison -- avoids leaking how many characters
  // matched via response-timing differences (the same timing-attack
  // concern the main page's own bcrypt.compare() codeTab defends
  // against, applied here to signature comparison instead).
  const valid = crypto.timingSafeEqual(
    Buffer.from(providedSignature, 'hex'),
    Buffer.from(expectedSignature, 'hex'),
  );

  return valid ? { valid: true } : { valid: false, reason: 'Signature mismatch' };
}

// A request whose BODY was altered in transit (even by one byte,
// even with the correct API key and a fresh timestamp) fails here,
// because the recomputed signature no longer matches:
const tampered = verifySignedRequest(
  'POST', '/api/charges', JSON.stringify({ amount: 999999, currency: 'usd' }),
  timestamp, signature, secretKey,
);
console.log(tampered);   // { valid: false, reason: 'Signature mismatch' }`,
  },
];

const exercise: TryItExercise = {
  prompt: 'An attacker captures a genuinely valid signed request (correct signature, fresh timestamp) as it crosses the network, then immediately resends the EXACT same bytes — method, path, timestamp, body, and signature all identical — within 2 seconds of the original. Does <code>verifySignedRequest</code> accept the replayed copy?',
  hint: 'The timestamp-age check only looks at how OLD the timestamp is relative to NOW — it has no memory of whether that exact timestamp has already been used once before.',
  solution: `// Yes -- verifySignedRequest accepts the replayed copy, because
// nothing in this implementation tracks WHICH timestamps have already
// been used. The timestamp is only checked for AGE (is it within the
// last 5 minutes?), and a replay sent 2 seconds after the original is
// still well within that window -- the signature recomputes
// identically (since every input -- method, path, timestamp, body --
// is byte-for-byte the same), so verification passes a second time.

// This is a genuine, real limitation of the age-check-only version
// shown here, not a hypothetical edge case: the quiz's own mention of
// "include a timestamp and nonce" names TWO separate ingredients, and
// this codeTab only implements the first. A complete replay defense
// needs a NONCE too -- a unique, single-use value the server tracks
// (in a short-TTL cache, matching the timestamp window) and rejects
// if the SAME nonce is ever seen twice, closing exactly the gap this
// exercise demonstrates: age-checking alone bounds HOW LONG a captured
// request stays exploitable, but does nothing to stop it being reused
// once, twice, or many times within that same window.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'HMAC request signing is really just a more complicated way of doing the same thing the main page\'s own API key hash comparison already does.',
    reality: 'The two mechanisms verify genuinely different properties: the main page\'s API key check confirms "does the caller possess a value only a legitimate holder should have" — a pure AUTHENTICATION check, entirely independent of what\'s actually in the request body. HMAC signing additionally confirms "has THIS SPECIFIC request — method, path, body, all of it — been altered since the caller sent it" — an INTEGRITY check the API key mechanism has no equivalent for at all, since a static key comparison never looks at the body content.',
  },
  {
    thought: 'Since the timestamp check already rejects requests older than 5 minutes, replay attacks are fully solved by this implementation.',
    reality: 'The Try It above shows precisely why this isn\'t true: the age check bounds how LONG a captured request stays valid, but places no limit on how many TIMES it can be replayed within that window. A genuinely complete replay defense needs to track and reject already-seen values (typically via a nonce), not just reject values that have simply gotten too old — "recent" and "not yet used" are two different properties, and this implementation only checks the first.',
  },
];

@Component({
  selector: 'app-sec-api-hmac',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './hmac-request-signing-implemented.html',
  styleUrl: './hmac-request-signing-implemented.scss',
})
export class HmacRequestSigningImplementedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
