import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'RSA',      type: 'keyword', desc: 'RSA-2048/4096 — asymmetric; public key encrypts or verifies; private key decrypts or signs.' },
  { name: 'ECDSA',    type: 'keyword', desc: 'Elliptic Curve Digital Signature Algorithm — smaller keys, faster than RSA for signing.' },
  { name: 'ECDH',     type: 'keyword', desc: 'Elliptic Curve Diffie-Hellman — key exchange protocol; derives shared secret from key pairs.' },
  { name: 'Ed25519',  type: 'keyword', desc: 'Modern EdDSA on Curve25519 — fast, small keys (32 bytes), constant-time operations.' },
  { name: 'OAEP',     type: 'keyword', desc: 'RSA-OAEP — recommended RSA encryption padding; never use PKCS#1 v1.5 for encryption.' },
  { name: 'PSS',      type: 'keyword', desc: 'RSA-PSS — recommended RSA signing padding; never use PKCS#1 v1.5 for signing.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Public Key Cryptography — Core Concepts',
    points: [
      'Asymmetric cryptography uses a mathematically linked key pair: public key (shareable) and private key (secret).',
      'Encryption: anyone encrypts with the public key; only the private key holder can decrypt. Used for: key exchange, encrypting DEKs.',
      'Digital signatures: private key signs (proves authorship); public key verifies. Used for: JWT (RS256), code signing, TLS certificates.',
      'Asymmetric operations are slow — 100–1000× slower than symmetric. Never use RSA to encrypt large data. Use hybrid encryption: RSA/ECDH to exchange a symmetric key; AES-GCM to encrypt the data.',
    ],
  },
  {
    heading: 'RSA Key Sizes and Padding',
    points: [
      'RSA-2048: minimum acceptable for new systems. RSA-4096: for long-term keys (CA certificates). RSA-1024: broken — do not use.',
      'Encryption padding: use RSA-OAEP with SHA-256. Never use PKCS#1 v1.5 for encryption — vulnerable to Bleichenbacher\'s attack (padding oracle).',
      'Signing padding: use RSA-PSS. PKCS#1 v1.5 for signing is still acceptable (no known practical attacks) but PSS is preferred for new systems.',
      'RSA private key operations leak timing information — use a library that implements constant-time RSA (Node.js crypto uses OpenSSL which does).',
    ],
  },
  {
    heading: 'Elliptic Curve Cryptography',
    points: [
      'ECC provides the same security as RSA with much smaller keys: EC-256 ≈ RSA-3072, EC-384 ≈ RSA-7680. Smaller keys = faster operations, less bandwidth.',
      'ECDSA (P-256, P-384): widely supported, used in TLS certificates and JWT (ES256). Each signature must use a fresh random nonce — reusing a nonce exposes the private key (PlayStation 3 hack).',
      'Ed25519 (EdDSA): modern, deterministic (no random nonce needed — avoids ECDSA nonce reuse risk), constant-time, fast. Preferred for new SSH keys and code signing.',
      'ECDH (key exchange): each party generates an ephemeral key pair, exchange public keys, derive the same shared secret. Used in TLS for forward secrecy.',
    ],
  },
  {
    heading: 'Digital Signatures',
    points: [
      'Sign: `signature = sign(privateKey, hash(message))`. Verify: `verify(publicKey, signature, hash(message)) → true/false`.',
      'Signatures provide non-repudiation: only the private key holder could have created a valid signature. Used in JWTs, code signing, TLS certificates, SSH.',
      'Always sign the hash of the message, not the raw message. Use SHA-256 minimum (SHA-256, SHA-384, SHA-512). Never MD5 or SHA-1.',
      'Verify the signature before trusting any data derived from the message — a valid signature proves the message was not tampered with.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'RSA Sign & Verify',
    language: 'typescript',
    code: `import crypto from 'crypto';

// ── Generate RSA-2048 key pair ────────────────────────────────────────────────
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// ── Sign a message ────────────────────────────────────────────────────────────
function signMessage(message: string, privKey: string): string {
  const sign = crypto.createSign('RSA-SHA256'); // SHA-256 hash + RSA-PSS-compatible
  sign.update(message, 'utf8');
  sign.end();
  return sign.sign({
    key: privKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING, // RSA-PSS
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  }, 'base64');
}

// ── Verify a signature ────────────────────────────────────────────────────────
function verifySignature(message: string, signature: string, pubKey: string): boolean {
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(message, 'utf8');
  verify.end();
  return verify.verify({
    key: pubKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  }, signature, 'base64');
}

// ── Example ───────────────────────────────────────────────────────────────────
const message   = 'Release v2.1.0 approved by Alice';
const signature = signMessage(message, privateKey);
const valid     = verifySignature(message, signature, publicKey);
console.log('Signature valid:', valid); // true

const tampered = verifySignature('Release v2.1.0 HACKED', signature, publicKey);
console.log('Tampered valid:', tampered); // false`,
  },
  {
    label: 'Ed25519 + ECDH Key Exchange',
    language: 'typescript',
    code: `import crypto from 'crypto';

// ── Ed25519 — modern signing (deterministic, no nonce risk) ───────────────────
const { privateKey: edPriv, publicKey: edPub } = crypto.generateKeyPairSync('ed25519');

function edSign(message: string, privKey: crypto.KeyObject): Buffer {
  return crypto.sign(null, Buffer.from(message), privKey);
}

function edVerify(message: string, signature: Buffer, pubKey: crypto.KeyObject): boolean {
  return crypto.verify(null, Buffer.from(message), pubKey, signature);
}

const msg = 'Hello, Ed25519!';
const sig = edSign(msg, edPriv);
console.log('Ed25519 valid:', edVerify(msg, sig, edPub)); // true

// ── ECDH — key exchange (Diffie-Hellman) ────────────────────────────────────
// Alice and Bob each generate an ephemeral key pair
const alice = crypto.createECDH('prime256v1');
alice.generateKeys();

const bob = crypto.createECDH('prime256v1');
bob.generateKeys();

// Exchange public keys (over any insecure channel)
const aliceShared = alice.computeSecret(bob.getPublicKey());
const bobShared   = bob.computeSecret(alice.getPublicKey());

// Both arrive at the same shared secret — without ever transmitting it
console.log('Shared secrets match:', aliceShared.equals(bobShared)); // true

// Derive a symmetric key from the shared secret
const symmetricKey = crypto.createHash('sha256').update(aliceShared).digest();
// Now use symmetricKey with AES-256-GCM to encrypt the actual data`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using RSA to encrypt large data directly',
    wrong: `// RSA can only encrypt ~190 bytes (2048-bit key) — breaks on large payloads
const encrypted = crypto.privateEncrypt(privateKey, Buffer.from(largeData));`,
    right: `// Hybrid: generate AES key, encrypt data with AES, encrypt key with RSA
const dataKey = crypto.randomBytes(32);
const encryptedData = aesGcmEncrypt(data, dataKey);   // fast
const encryptedKey  = crypto.publicEncrypt({ key: publicKey, padding: RSA_OAEP }, dataKey);`,
    explanation: 'RSA can only encrypt data smaller than its key size minus padding (~190 bytes for RSA-2048 with OAEP). For real data, use hybrid encryption: AES-GCM for the data, RSA/ECDH to encrypt only the AES key.',
  },
  {
    title: 'Using PKCS#1 v1.5 padding for RSA encryption',
    wrong: `crypto.publicEncrypt(publicKey, data); // default: PKCS#1 v1.5 — vulnerable`,
    right: `crypto.publicEncrypt({ key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, data);`,
    explanation: 'PKCS#1 v1.5 encryption padding is vulnerable to Bleichenbacher\'s oracle attack — an adaptive chosen-ciphertext attack that recovers the plaintext given a decryption oracle. Always use RSA-OAEP for encryption.',
  },
  {
    title: 'ECDSA with a reused nonce',
    wrong: `// Some ECDSA implementations use a fixed or predictable nonce
// NEVER implement ECDSA signing yourself — the nonce MUST be random per signature`,
    right: `// Use Ed25519 instead — deterministic, no nonce management required
// Or use a well-tested library that handles ECDSA nonces correctly`,
    explanation: 'ECDSA signatures require a fresh random nonce per signature. If the same nonce is used twice for different messages (or if it is predictable), the private key can be extracted mathematically. This is how the PS3 private key was recovered. Ed25519 is deterministic and avoids this risk entirely.',
  },
  {
    title: 'Not validating the certificate chain when verifying signatures',
    wrong: `// Trust any public key — no chain validation
const valid = verify(anyPublicKey, signature, data);`,
    right: `// Verify both: signature validity AND that the key belongs to the expected entity
// For TLS: let the TLS library validate the cert chain
// For code signing: verify signature + certificate chain to a trusted root CA`,
    explanation: 'A valid signature proves the message was not tampered with, but only if you trust the public key. Without chain validation, an attacker can create their own key pair, sign a malicious payload, and the signature will verify correctly against their public key.',
  },
];

const challenge: Challenge = {
  title: 'Message Fingerprint Signer',
  language: 'typescript',
  description: `Implement signedMessage(text: string): { message: string; fingerprint: string; signed: boolean } that:
1. fingerprint = first 16 hex chars of SHA-256 hash of the text (simulating a signature)
2. signed = true if text.length >= 10 (simulating a minimum-length validity check)
3. Returns the object with all three fields`,
  hints: [
    'crypto.createHash("sha256").update(text).digest("hex")',
    'slice(0, 16) for first 16 hex chars',
    'text.length >= 10 for signed check',
  ],
  starterCode: `import crypto from 'crypto';

function signedMessage(text: string): { message: string; fingerprint: string; signed: boolean } {
  // TODO
  return { message: '', fingerprint: '', signed: false };
}`,
  solution: `import crypto from 'crypto';

function signedMessage(text: string): { message: string; fingerprint: string; signed: boolean } {
  const fingerprint = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
  const signed = text.length >= 10;
  return { message: text, fingerprint, signed };
}

console.log(signedMessage('Hello World!'));
// { message: 'Hello World!', fingerprint: '7f83b1657ff1fc...', signed: true }
console.log(signedMessage('short'));
// { message: 'short', fingerprint: '...' , signed: false }`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which padding scheme must NEVER be used for RSA encryption?',
    options: ['OAEP (SHA-256)', 'PKCS#1 v1.5', 'PSS', 'MGF1'],
    answer: 1,
    explanation: 'PKCS#1 v1.5 encryption padding is vulnerable to Bleichenbacher\'s adaptive chosen-ciphertext attack. Given a decryption oracle (which TLS servers inadvertently provided before constant-time fixes), an attacker can decrypt any RSA ciphertext. Always use RSA-OAEP for encryption.',
  },
  {
    q: 'Why is Ed25519 considered safer than ECDSA for digital signatures?',
    options: [
      'Ed25519 uses a longer key (512 bits)',
      'Ed25519 is deterministic — no random nonce per signature, eliminating nonce-reuse vulnerability',
      'Ed25519 signatures are larger and harder to forge',
      'Ed25519 uses RSA internally for extra security',
    ],
    answer: 1,
    explanation: 'ECDSA requires a fresh random nonce per signature. If the same nonce is used twice (or is predictable), the private key can be extracted — this is how the PlayStation 3 master key was stolen. Ed25519 derives the nonce deterministically from the private key and message, making nonce-reuse impossible.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between RSA and ECC for the same security level?',
    a: 'ECC achieves equivalent security to RSA with much smaller keys: <table><tr><th>RSA</th><th>ECC equivalent</th><th>Security bits</th></tr><tr><td>2048</td><td>P-224 / Ed25519</td><td>112</td></tr><tr><td>3072</td><td>P-256</td><td>128</td></tr><tr><td>7680</td><td>P-384</td><td>192</td></tr></table>Smaller keys mean: faster operations (especially on mobile/embedded), smaller TLS handshakes, less storage. The trade-off: ECC implementation correctness is harder (timing attacks, nonce management in ECDSA). Use Ed25519 for new signing systems — it is simpler to implement correctly.',
  },
  {
    q: 'How does Diffie-Hellman (ECDH) key exchange work?',
    a: 'ECDH allows two parties to agree on a shared secret over an insecure channel without prior shared knowledge: <ol><li>Alice generates ephemeral key pair (privA, pubA); Bob generates (privB, pubB)</li><li>They exchange public keys (over any channel — intercept is fine)</li><li>Alice computes: sharedSecret = privA × pubB; Bob computes: sharedSecret = privB × pubA</li><li>Due to EC math, both arrive at the same point on the curve</li><li>A symmetric key is derived from sharedSecret (via HKDF or SHA-256)</li></ol>An eavesdropper who sees pubA and pubB cannot compute the shared secret (Elliptic Curve Discrete Log Problem). This is how TLS achieves forward secrecy via ECDHE.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Asymmetric crypto: public key encrypts/verifies; private key decrypts/signs — use RSA-OAEP for encryption, Ed25519/ECDSA for signing, ECDH for key exchange; never direct RSA on large data.',
  mustKnow: [
    'Public key encrypts (or verifies); private key decrypts (or signs)',
    'Hybrid encryption: ECDH/RSA for key exchange; AES-GCM for data — RSA can only encrypt ~190 bytes',
    'RSA encryption: OAEP padding only — PKCS#1 v1.5 is vulnerable to Bleichenbacher\'s attack',
    'ECDSA: each signature needs a fresh random nonce — reuse exposes private key (PS3 hack)',
    'Ed25519: deterministic nonce, constant-time, no nonce reuse risk — preferred for new systems',
    'ECDH: both parties derive the same shared secret without transmitting it — basis of TLS forward secrecy',
  ],
  interviewFocus: [
    'Why is PKCS#1 v1.5 unsafe for RSA encryption?',
    'What happened with ECDSA nonce reuse on the PlayStation 3?',
    'Explain hybrid encryption and why it is necessary',
  ],
};

@Component({
  selector: 'app-sec-asymmetric-cryptography',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './asymmetric-cryptography.html',
  styleUrl: './asymmetric-cryptography.scss',
})
export class SecAsymmetricCryptography {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
