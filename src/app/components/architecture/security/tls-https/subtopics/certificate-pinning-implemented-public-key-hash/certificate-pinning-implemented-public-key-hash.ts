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
    heading: 'The QnA Explains Pinning in Detail — With No Working Code',
    points: [
      'The main page\'s own QnA describes public-key pinning precisely: hard-code the expected public key\'s hash, reject any connection presenting a different one — even if it\'s signed by a trusted CA. No codeTab on the page ever implements this check.',
      'Node.js\'s <code>https.request</code> accepts a custom <code>checkServerIdentity</code> function, called with the hostname and the peer\'s certificate object — this is the hook where a pin check belongs, run AFTER Node\'s own default hostname/chain validation.',
      'A <code>PeerCertificate</code> object exposes <code>pubkey</code> — the certificate\'s raw public key as a Buffer — which is what gets hashed and compared, per the main page\'s own recommendation to pin the PUBLIC KEY rather than the full certificate.',
      'This subtopic pins the INTERMEDIATE CA\'s key specifically, matching the main page\'s own separate QnA on why that\'s safer than pinning the leaf: the intermediate signs many leaf certs over years, so routine leaf renewal (Let\'s Encrypt\'s 90-day cycle) never breaks the pin.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Pinning the Intermediate CA\'s Public Key',
    language: 'typescript',
    code: `import https from 'https';
import crypto from 'crypto';
import tls from 'tls';

// The pinned value: SHA-256 hash of the intermediate CA's public key,
// base64-encoded -- computed once, ahead of time, from a certificate
// you've already verified is the correct one (e.g. via SSL Labs or
// openssl s_client). Rotated only when the CA itself rotates its
// intermediate, not on every routine leaf renewal.
const PINNED_INTERMEDIATE_PUBKEY_HASH =
  'C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M='; // example value

function checkServerIdentity(hostname: string, cert: tls.PeerCertificate): Error | undefined {
  // Run Node's own default hostname/chain validation FIRST -- pinning
  // is an ADDITIONAL check, never a replacement for it.
  const defaultCheckError = tls.checkServerIdentity(hostname, cert);
  if (defaultCheckError) return defaultCheckError;

  // Walk up to the intermediate CA in the chain. Node exposes this
  // via cert.issuerCertificate -- the leaf's issuer is the
  // intermediate (whose own issuer, in turn, is the root).
  const intermediate = cert.issuerCertificate;
  if (!intermediate) {
    return new Error('Certificate chain too short to reach an intermediate CA');
  }

  const actualHash = crypto
    .createHash('sha256')
    .update(intermediate.pubkey)
    .digest('base64');

  if (actualHash !== PINNED_INTERMEDIATE_PUBKEY_HASH) {
    return new Error(
      \`Certificate pinning failure: intermediate CA public key does not match the pinned value\`
    );
  }

  return undefined; // pin matches -- connection is allowed to proceed
}

https.get(
  'https://internal-api.example.com',
  { checkServerIdentity },
  (res) => { /* ... */ }
);`,
  },
  {
    label: 'Computing the Pin Value Ahead of Time',
    language: 'typescript',
    code: `// A one-off script, run once during setup (or whenever the CA
// rotates its intermediate) to produce the value hard-coded above --
// NOT something the running application computes at request time.
import https from 'https';
import crypto from 'crypto';
import tls from 'tls';

https.get('https://internal-api.example.com', (res) => {
  const socket = res.socket as tls.TLSSocket;
  const leaf = socket.getPeerCertificate(true); // true = include full chain
  const intermediate = leaf.issuerCertificate;

  if (intermediate) {
    const hash = crypto
      .createHash('sha256')
      .update(intermediate.pubkey)
      .digest('base64');
    console.log('Pin this value:', hash);
  }
  res.resume(); // drain the response, we only need the cert
});`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The CA rotates its intermediate certificate for routine reasons (its own scheduled renewal) — the leaf certificates it issues stay signed by a DIFFERENT intermediate key going forward, with no change to the server\'s own domain, hostname, or leaf renewal schedule. Does the pinned client above still connect successfully?',
  hint: 'What value does <code>PINNED_INTERMEDIATE_PUBKEY_HASH</code> actually get compared against, and did that specific value change?',
  solution: `// No -- the connection now FAILS with the pinning error, even
// though nothing about the SERVER'S own configuration changed.

// The pin is keyed to the intermediate CA's public key specifically
// -- when the CA itself rotates that key (a rare event, but a real
// one), every client with the OLD hash pinned rejects every server
// whose leaf now chains through the NEW intermediate, regardless of
// how correctly the server itself is configured.

// This is exactly the operational trade-off the main page's own QnA
// names for pinning in general, just at the intermediate level
// instead of the leaf: pinning the intermediate tolerates routine
// LEAF renewal (the common case, matching a 90-day Let's Encrypt
// cycle) but still breaks on the rarer event of the CA's OWN
// intermediate rotating -- there is no pin depth that is immune to
// every possible upstream change, only different frequencies of
// planned update it can absorb.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Certificate pinning replaces the need for the standard CA trust-chain validation that <code>rejectUnauthorized</code> already performs.',
    reality: 'Pinning is an ADDITIONAL check layered on top — the codeTab above calls <code>tls.checkServerIdentity()</code> (Node\'s own default hostname/chain validation) FIRST, and only proceeds to the pin comparison if that already passed. A pin check alone, without the standard validation, would miss basic certificate problems the default check exists to catch.',
  },
  {
    thought: 'Pinning the intermediate CA\'s key means the pin never needs to be updated.',
    reality: 'It tolerates routine LEAF certificate renewal without breaking (the common case) — but it still breaks if the CA itself ever rotates its own intermediate key (a rarer, but real, event), as the Try It traces. No pin depth is permanently maintenance-free.',
  },
  {
    thought: 'The pin value should be computed by the running application at request time, comparing against a value fetched from the same connection.',
    reality: 'That would defeat the entire purpose — an attacker performing a MITM attack controls what certificate the connection presents, so a pin computed FROM that same connection would always "match." The pin value must be a hard-coded constant, computed and verified out-of-band, ahead of time.',
  },
];

@Component({
  selector: 'app-sec-tls-pinning',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './certificate-pinning-implemented-public-key-hash.html',
  styleUrl: './certificate-pinning-implemented-public-key-hash.scss',
})
export class CertificatePinningImplementedPublicKeyHashSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
