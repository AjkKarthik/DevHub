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
    heading: 'The QnA Explains the Attack — the Main Codetab Never Shows It Happening',
    points: [
      'The main page\'s own ECDH codeTab has Alice and Bob compute matching shared secrets directly — no attacker anywhere in the example. The QnA\'s own separate answer explains exactly how an unauthenticated exchange fails when one IS present, but never runs it.',
      'The core problem: plain Diffie-Hellman/ECDH only guarantees that whoever holds the OTHER private key computes the same shared secret — it proves nothing about WHO that other party is.',
      'An attacker positioned between Alice and Bob performs the exchange TWICE — once with Alice (posing as Bob), once with Bob (posing as Alice) — ending up with TWO different shared secrets, one with each real party, and neither Alice nor Bob can tell from the math alone that anything is wrong.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Alice and Bob, With Mallory Actually in the Middle',
    language: 'typescript',
    code: `import crypto from 'crypto';

// Reusing the main page's own ECDH pattern exactly -- just adding a
// THIRD party who intercepts both directions of the exchange.
const alice   = crypto.createECDH('prime256v1');
const bob     = crypto.createECDH('prime256v1');
const mallory = crypto.createECDH('prime256v1'); // the attacker

alice.generateKeys();
bob.generateKeys();
mallory.generateKeys(); // Mallory has her OWN key pair -- not Alice's or Bob's

// ── Alice sends her public key, believing it's going to Bob ──────────
// Mallory intercepts it and never forwards Alice's real public key at
// all -- Bob will receive MALLORY's public key, believing it's Alice's.

// ── Alice computes a "shared secret with Bob" -- actually with Mallory ──
const aliceComputed = alice.computeSecret(mallory.getPublicKey());

// ── Bob computes a "shared secret with Alice" -- actually with Mallory ──
const bobComputed = bob.computeSecret(mallory.getPublicKey());

// ── Mallory computes BOTH shared secrets, matching each real party ───
const malloryWithAlice = mallory.computeSecret(alice.getPublicKey());
const malloryWithBob   = mallory.computeSecret(bob.getPublicKey());

console.log('Alice/Mallory secrets match:', aliceComputed.equals(malloryWithAlice)); // true
console.log('Bob/Mallory secrets match:',   bobComputed.equals(malloryWithBob));     // true
console.log('Alice/Bob secrets match:',     aliceComputed.equals(bobComputed));      // false

// Alice and Bob each successfully completed a valid-looking ECDH
// exchange -- the math never failed for either of them. They just
// each ended up sharing a secret with Mallory instead of each other,
// with no error, warning, or failed computation anywhere in the flow.`,
  },
  {
    label: 'Why This Fully Compromises the "Secure" Channel',
    language: 'typescript',
    code: `// Once each shared secret is derived (matching the main page's own
// pattern), it gets used to key AES-256-GCM for the actual messages.
const aliceKey = crypto.createHash('sha256').update(aliceComputed).digest();
const bobKey   = crypto.createHash('sha256').update(bobComputed).digest();

// Alice encrypts a message with HER key (which is really Mallory's
// shared secret) and sends the ciphertext, believing only Bob can
// read it.
const message = 'Wire $50,000 to account #4471';
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', aliceKey, iv);
const encrypted = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()]);

// Mallory -- who separately derived malloryWithAlice, identical to
// aliceKey's own input -- decrypts it, reads it, can modify it
// freely, then RE-encrypts under bobKey (derived from malloryWithBob)
// before forwarding to Bob. Bob decrypts successfully and has no way
// to detect any of this occurred -- his own decryption SUCCEEDS,
// because it's using the genuinely-correct key for a channel that
// was never actually established with Alice at all.

// This is exactly why real protocols (TLS) never use plain,
// unauthenticated ECDH alone -- the server signs the ephemeral ECDH
// public key with its long-term certificate-backed private key, so
// a client can verify WHO it actually established the shared secret
// with, closing the exact gap this codeTab demonstrates.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Suppose Bob\'s ECDH public key were signed by a certificate Alice already trusts, and Alice verifies that signature BEFORE calling <code>computeSecret()</code> — but Mallory still intercepts and substitutes her own public key in transit, unsigned. Does Alice\'s verification step catch the attack?',
  hint: 'What, specifically, would Alice be verifying a signature OVER — Bob\'s real public key, or whatever key value physically arrives at Alice\'s side of the wire?',
  solution: `// Yes -- assuming Alice verifies the SIGNATURE OVER THE ACTUAL KEY
// VALUE she received, not just "a signature is present somewhere."

// Mallory has no way to produce a valid signature over HER OWN public
// key using Bob's private signing key -- she doesn't have it. If
// Alice's verification step checks that the received public key
// value itself matches what Bob's certificate-backed private key
// signed, Mallory's substituted key fails that check immediately,
// and Alice never proceeds to computeSecret() with it at all.

// This is precisely the mechanism TLS uses: the server doesn't just
// send SOME certificate and SOME ephemeral key separately -- it signs
// the specific ephemeral ECDH public key it's presenting, so the
// client can verify that EXACT value came from the certificate
// holder, not from whoever last touched the network in between.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'If an ECDH exchange is intercepted by an attacker, the <code>computeSecret()</code> calls will fail or produce mismatched results the parties can detect.',
    reality: 'The math never fails — Alice and Bob each successfully compute a shared secret, and each one is genuinely CORRECT relative to the (attacker-substituted) public key they actually received. Nothing in the ECDH protocol itself can detect that the received key belongs to an attacker rather than the intended party.',
  },
  {
    thought: 'ECDH is "insecure" and should be avoided in favor of RSA for key exchange.',
    reality: 'The vulnerability demonstrated here is about UNAUTHENTICATED key exchange specifically — it applies equally to RSA-based key exchange lacking authentication. Real protocols don\'t avoid ECDH; they add authentication (a certificate-backed signature over the exchanged public keys), which is exactly what TLS\'s ECDHE cipher suites do.',
  },
  {
    thought: 'Perfect Forward Secrecy (which ECDHE provides) is a defense against this MITM attack.',
    reality: 'They\'re independent properties. Forward secrecy protects PAST sessions if a long-term key is later compromised; it says nothing about whether THIS session\'s key exchange was authenticated. An attacker performing this exact MITM attack against an ECDHE exchange succeeds regardless of forward secrecy — authentication (the certificate signature) is the separate property that actually closes this specific gap.',
  },
];

@Component({
  selector: 'app-sec-asym-mitm-ecdh',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-mitm-attack-on-unauthenticated-ecdh-demonstrated.html',
  styleUrl: './the-mitm-attack-on-unauthenticated-ecdh-demonstrated.scss',
})
export class TheMitmAttackOnUnauthenticatedEcdhDemonstratedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
