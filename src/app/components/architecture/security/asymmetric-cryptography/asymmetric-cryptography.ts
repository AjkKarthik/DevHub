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
  {
    heading: 'Key Exchange and Perfect Forward Secrecy',
    points: [
      'Asymmetric cryptography enables secure key exchange over an insecure channel — Diffie-Hellman key exchange lets two parties agree on a shared secret without ever transmitting that secret itself, even if an eavesdropper observes the entire exchange.',
      'Perfect Forward Secrecy (PFS) means that even if a server private key is compromised in the future, previously recorded encrypted traffic remains unreadable — achieved by using ephemeral (temporary, per-session) key exchange rather than reusing a long-term key to derive session keys directly.',
      'Modern TLS configurations mandate ephemeral Diffie-Hellman (DHE) or elliptic-curve Diffie-Hellman (ECDHE) key exchange specifically for this reason — a compromised server certificate alone should not retroactively expose years of previously captured traffic.',
      'Elliptic Curve Cryptography (ECC) achieves equivalent security to RSA with much smaller key sizes (a 256-bit ECC key is roughly as strong as a 3072-bit RSA key), reducing computational cost and making it the preferred choice for modern TLS and mobile/IoT constrained environments.',
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
  { q: 'What is the key difference between RSA and ECDSA for digital signatures?', options: ['RSA uses private keys; ECDSA uses public keys for signing', 'RSA is based on integer factorization; ECDSA is based on elliptic curve discrete logarithm, providing equivalent security with much shorter keys', 'ECDSA is slower than RSA for all key sizes', 'RSA supports larger messages; ECDSA only signs hashes'], answer: 1, explanation: 'RSA security relies on the difficulty of factoring large integers. ECDSA uses elliptic curves where discrete logarithm is hard. ECDSA provides equivalent security with much smaller keys: a 256-bit ECDSA key provides similar security to a 3072-bit RSA key. Smaller keys mean faster key generation, signing, and verification, and smaller TLS handshakes. ECDSA with the P-256 or P-384 curves is preferred for new systems. RSA remains widely supported for compatibility. Both use private keys to sign and public keys to verify.' },
  { q: 'What is key wrapping and why is it used in key management?', options: ['Packaging private keys in a human-readable format for transport', 'Encrypting a cryptographic key with another key (Key Encryption Key) so it can be safely stored or transmitted without exposing it in plaintext', 'Wrapping legacy RSA keys in elliptic curve containers', 'A key rotation technique that wraps old keys around new keys'], answer: 1, explanation: 'Key wrapping uses a Key Encryption Key (KEK) to encrypt (wrap) a data encryption key (DEK). The wrapped DEK can then be stored or transmitted safely. When needed, the KEK decrypts (unwraps) the DEK. This pattern enables: hierarchical key management (root keys in HSMs wrap intermediate keys, intermediate keys wrap data keys). Key material in transit encrypted with the wrapping key. Hardware security modules (HSMs) implement PKCS#11 wrap/unwrap operations. AWS KMS, Google Cloud KMS, and Azure Key Vault use key wrapping as the foundation for their key management services.' },
  { q: 'What is key escrow and when is it used?', options: ['A backup of private keys held by a trusted third party for recovery purposes', 'The process of exporting keys to an escrow format for auditing', 'Storing public keys in a centralized directory for certificate validation', 'An HSM mechanism for enforcing dual control over key usage'], answer: 0, explanation: 'Key escrow: copies of private keys are held by a trusted third party (escrow agent) so they can be recovered if the primary key holder loses access. Used in enterprise environments where employee departure or death should not result in irretrievable data. Government key escrow was controversially proposed in the 1990s (Clipper Chip) to allow law enforcement to decrypt communications. Enterprise key escrow in enterprise DRM or disk encryption (BitLocker Recovery Keys stored in Active Directory). Key escrow introduces risk: the escrow agent becomes a high-value target. Implement with strict dual control and auditing.' },
  { q: 'What is Diffie-Hellman key exchange and how does it enable Perfect Forward Secrecy?', options: ['A certificate exchange protocol where servers share their public certificates before establishing a session key', 'A method for two parties to establish a shared secret over a public channel without transmitting the secret itself, enabling session keys that are independent of long-term private keys', 'An asymmetric encryption algorithm used to encrypt the TLS session key directly', 'A key agreement protocol that requires both parties to have certificates from the same CA'], answer: 1, explanation: 'Diffie-Hellman: Alice and Bob exchange public values derived from their private values. Neither their private values nor the resulting shared secret is transmitted. Both arrive at the same shared secret independently. Perfect Forward Secrecy (PFS): each TLS session generates ephemeral DH parameters (ECDHE). Even if the server long-term private key is later compromised, recorded past traffic cannot be decrypted because each session used a different ephemeral key. PFS is why modern TLS prefers ECDHE cipher suites. Configure web servers to require ECDHE: disable non-PFS cipher suites that directly encrypt the session key with the server certificate.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between RSA and ECC for the same security level?',
    a: 'ECC achieves equivalent security to RSA with much smaller keys: <table><tr><th>RSA</th><th>ECC equivalent</th><th>Security bits</th></tr><tr><td>2048</td><td>P-224 / Ed25519</td><td>112</td></tr><tr><td>3072</td><td>P-256</td><td>128</td></tr><tr><td>7680</td><td>P-384</td><td>192</td></tr></table>Smaller keys mean: faster operations (especially on mobile/embedded), smaller TLS handshakes, less storage. The trade-off: ECC implementation correctness is harder (timing attacks, nonce management in ECDSA). Use Ed25519 for new signing systems — it is simpler to implement correctly.',
  },
  {
    q: 'Why is Diffie-Hellman key exchange vulnerable to a man-in-the-middle attack unless combined with authentication?',
    a: 'Plain Diffie-Hellman only guarantees that whoever holds the OTHER private key computes the same shared secret — it says nothing about WHO that other party actually is. An attacker positioned between Alice and Bob can intercept both public keys and substitute their own: they perform DH with Alice (Alice thinks she shares a secret with Bob) and separately with Bob (Bob thinks he shares a secret with Alice), then relay and decrypt/re-encrypt every message in between, completely undetected by either party, since the math itself never fails — it just successfully creates two different shared secrets with an impostor instead of one shared secret between the real parties. This is exactly why TLS signs the DH parameters with the server\'s certificate (authenticating WHO you are exchanging keys with) rather than relying on DH alone.',
  },
  { q: 'How is asymmetric cryptography used in code signing?', a: 'Code signing uses the publisher private key to sign software packages. Users verify the signature with the publisher public key before installing or executing code. Process: compute a hash of the binary. Sign the hash with the private key. Attach the signature and certificate to the package. At install time: verify the certificate chain to a trusted root. Verify the signature against the binary hash. If valid, the binary has not been modified since signing and comes from the legitimate publisher. Examples: Windows Authenticode signs EXE and MSI files. Apple code signing for macOS and iOS apps. npm package signing. Jar signing in Java. Prevents supply chain attacks where binaries are modified during distribution.' },
  { q: 'What is certificate pinning and what are its risks?', a: 'Certificate pinning: a client hard-codes the expected server certificate (or its public key hash) and refuses to connect if the server presents a different certificate, even if it is signed by a trusted CA. Prevents MITM attacks by rogue CAs or compromised intermediate certificates. Risks: if the pinned certificate expires or the server rotates keys without notice, the client stops working. Pinning is particularly problematic for apps in stores that cannot be quickly updated. Mitigation: pin the public key of the CA certificate (intermediate or root) rather than the leaf certificate, which changes less frequently. Use Public Key Pinning with a backup pin. Keep pin lifetimes shorter than the app update cycle. HPKP (HTTP header-based pinning) was deprecated due to these operational risks.' },
  { q: 'What is an HSM (Hardware Security Module) and when is it required?', a: 'An HSM is a tamper-resistant physical device that generates, stores, and uses cryptographic keys. Keys generated in the HSM never leave the hardware in plaintext. Operations (sign, decrypt, generate) are performed inside the HSM. Tamper-evident seals and active protection circuits destroy keys if physical access is detected. Required for: CA private keys (a compromised CA key invalidates all issued certificates). Payment card industry (PCI DSS requires HSMs for PIN management and cryptographic key storage). FIPS 140-2/140-3 Level 3+ compliance mandates HSM use. Long-term certificate signing keys. Cloud HSM options: AWS CloudHSM, Google Cloud HSM, Azure Dedicated HSM. Managed KMS services use HSMs internally without requiring customers to manage hardware.' },
  { q: 'What is the difference between sign-then-encrypt and encrypt-then-sign, and which is safer?', a: 'Sign-then-encrypt: sign the plaintext, then encrypt the signature+plaintext together. Risk: the recipient decrypts and receives a signed message, but cannot verify who encrypted it. A malicious intermediary could re-encrypt the signed message, making it appear they sent it. Encrypt-then-sign: encrypt the message, then sign the ciphertext. The signature proves who encrypted the message. The recipient verifies the signature on the ciphertext before decrypting. Safer for most use cases because it authenticates the encryption. However, it leaks that the signed ciphertext came from the signer even if the encryption should hide the author. In practice: use authenticated encryption (AES-GCM) for encryption (which includes authentication) and sign the ciphertext if attribution is needed.' },
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
