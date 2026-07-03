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
  { name: 'AES-256-GCM', type: 'keyword', desc: 'Recommended authenticated encryption — 256-bit key, 96-bit IV, 128-bit auth tag.' },
  { name: 'IV / Nonce',  type: 'keyword', desc: 'Initialization Vector — random 12 bytes per encryption; must be unique, never reused.' },
  { name: 'Auth Tag',    type: 'keyword', desc: 'GCM authentication tag — 16 bytes appended to ciphertext; verifies integrity.' },
  { name: 'AEAD',        type: 'keyword', desc: 'Authenticated Encryption with Associated Data — encrypts AND authenticates in one step.' },
  { name: 'ECB Mode',    type: 'keyword', desc: 'Electronic Code Book — NEVER use; identical plaintext blocks produce identical ciphertext.' },
  { name: 'Envelope',    type: 'keyword', desc: 'Envelope encryption: encrypt data with a DEK; encrypt the DEK with a KEK (key hierarchy).' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'AES-256-GCM — The Standard',
    points: [
      'AES (Advanced Encryption Standard) with 256-bit key and GCM (Galois/Counter Mode) is the current recommended symmetric encryption algorithm.',
      'GCM is an AEAD mode — it simultaneously encrypts and authenticates. The authentication tag (16 bytes) ensures the ciphertext has not been tampered with.',
      'If you only encrypt without authentication (AES-CBC without HMAC), an attacker can flip bits in the ciphertext and alter the decrypted plaintext without detection — padding oracle attacks, bit-flipping attacks.',
      'Always use GCM (or another AEAD like ChaCha20-Poly1305). Never use AES-ECB. AES-CBC is only safe with a separate HMAC (Encrypt-then-MAC pattern).',
    ],
  },
  {
    heading: 'IV (Initialization Vector) Rules',
    points: [
      'The IV must be random and unique for every encryption operation. Reusing an IV with the same key breaks GCM security completely — exposes both plaintexts and the authentication key.',
      'For AES-GCM: use a 96-bit (12-byte) random IV. Generate with `crypto.randomBytes(12)` (Node.js) or `crypto.getRandomValues()` (browser).',
      'Store the IV alongside the ciphertext — it is not secret. Format: `IV (12 bytes) + ciphertext + auth tag (16 bytes)` concatenated.',
      'Never use a counter or predictable value as IV — must be cryptographically random. The probability of a collision with a 96-bit random IV is negligible for ≤2^32 messages with the same key.',
    ],
  },
  {
    heading: 'Key Management',
    points: [
      'Key generation: use `crypto.randomBytes(32)` for a 256-bit key. Never derive keys from passwords without a KDF (use PBKDF2 or Argon2 with a salt).',
      'Envelope encryption: encrypt data with a Data Encryption Key (DEK); encrypt the DEK with a Key Encryption Key (KEK). The KEK is stored in a KMS (AWS KMS, Google Cloud KMS). Rotating the KEK does not require re-encrypting all data — only re-encrypt the DEK.',
      'Key rotation: define a rotation schedule. With envelope encryption, rotation is cheap — re-encrypt only the DEK.',
      'Never hardcode keys. Store in a KMS or secrets manager. The encryption key is the most critical secret in the system.',
    ],
  },
  {
    heading: 'When to Use Symmetric vs Asymmetric',
    points: [
      'Symmetric: same key encrypts and decrypts. Fast, suitable for large data (file encryption, DB column encryption, disk encryption). Key exchange is the challenge.',
      'Asymmetric: public key encrypts; private key decrypts. Slow for large data — use for key exchange or small payloads (encrypting a DEK).',
      'Hybrid encryption: RSA or ECDH establishes a shared symmetric key; AES-GCM encrypts the actual data. TLS uses this pattern.',
    ],
  },
  {
    heading: 'AES Modes of Operation',
    points: [
      'AES is a block cipher operating on fixed-size blocks (128 bits) — a mode of operation defines how to apply it repeatedly to encrypt data longer than one block, and the choice of mode has major security implications beyond just the algorithm itself.',
      'ECB (Electronic Codebook) mode encrypts each block independently and identically — this means identical plaintext blocks produce identical ciphertext blocks, leaking structural patterns in the data (famously visualized by encrypting an image in ECB mode and still being able to see the outline). Never use ECB mode.',
      'GCM (Galois/Counter Mode) is the modern recommended mode — it provides both confidentiality (encryption) AND authenticity (a built-in authentication tag detecting any tampering with the ciphertext), combining what used to require two separate mechanisms into one efficient operation.',
      'A unique, unpredictable Initialization Vector (IV) or nonce must be used for every encryption operation with the same key — reusing an IV with GCM mode is catastrophic, potentially allowing an attacker to recover the authentication key entirely, not just decrypt one message.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'AES-256-GCM Encrypt/Decrypt',
    language: 'typescript',
    code: `import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH  = 12; // 96 bits (recommended for GCM)
const TAG_LENGTH = 16; // 128-bit auth tag

// ── Encrypt ──────────────────────────────────────────────────────────────────
function encrypt(plaintext: string, key: Buffer): Buffer {
  const iv         = crypto.randomBytes(IV_LENGTH);       // unique per encryption
  const cipher     = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted  = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag    = cipher.getAuthTag();

  // Layout: IV (12) | ciphertext | authTag (16)
  return Buffer.concat([iv, encrypted, authTag]);
}

// ── Decrypt ──────────────────────────────────────────────────────────────────
function decrypt(encryptedBuf: Buffer, key: Buffer): string {
  const iv         = encryptedBuf.subarray(0, IV_LENGTH);
  const tag        = encryptedBuf.subarray(encryptedBuf.length - TAG_LENGTH);
  const ciphertext = encryptedBuf.subarray(IV_LENGTH, encryptedBuf.length - TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag); // GCM verifies integrity before decryption

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
  // Throws if authTag doesn't match — ciphertext was tampered with
}

// ── Usage ─────────────────────────────────────────────────────────────────────
const key = crypto.randomBytes(KEY_LENGTH); // store this in KMS/secrets manager
const message = 'Sensitive data: SSN 123-45-6789';

const encrypted = encrypt(message, key);
console.log('Encrypted (hex):', encrypted.toString('hex'));

const decrypted = decrypt(encrypted, key);
console.log('Decrypted:', decrypted); // Sensitive data: SSN 123-45-6789`,
  },
  {
    label: 'Envelope Encryption (AWS KMS)',
    language: 'typescript',
    code: `import { KMSClient, GenerateDataKeyCommand, DecryptCommand } from '@aws-sdk/client-kms';
import crypto from 'crypto';

const kms = new KMSClient({ region: 'us-east-1' });
const KEY_ID = 'arn:aws:kms:us-east-1:123456789:key/...';

// ── Encrypt with envelope encryption ────────────────────────────────────────
async function envelopeEncrypt(plaintext: string): Promise<{ ciphertext: string; encryptedKey: string }> {
  // 1. Ask KMS for a data key — returns plaintext DEK + encrypted DEK
  const { Plaintext: dek, CiphertextBlob: encryptedDek } = await kms.send(
    new GenerateDataKeyCommand({ KeyId: KEY_ID, KeySpec: 'AES_256' })
  );

  // 2. Encrypt data with the plaintext DEK
  const iv       = crypto.randomBytes(12);
  const cipher   = crypto.createCipheriv('aes-256-gcm', Buffer.from(dek!), iv);
  const enc      = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag      = cipher.getAuthTag();
  const payload  = Buffer.concat([iv, enc, tag]);

  // 3. Store: encrypted data + encrypted DEK (KMS-wrapped)
  // The plaintext DEK is NOT stored — never persisted
  return {
    ciphertext:   payload.toString('base64'),
    encryptedKey: Buffer.from(encryptedDek!).toString('base64'),
  };
}

// ── Decrypt ──────────────────────────────────────────────────────────────────
async function envelopeDecrypt(ciphertext: string, encryptedKey: string): Promise<string> {
  // 1. Ask KMS to decrypt the DEK
  const { Plaintext: dek } = await kms.send(
    new DecryptCommand({ CiphertextBlob: Buffer.from(encryptedKey, 'base64') })
  );

  // 2. Decrypt data with the recovered plaintext DEK
  const buf  = Buffer.from(ciphertext, 'base64');
  const iv   = buf.subarray(0, 12);
  const tag  = buf.subarray(buf.length - 16);
  const enc  = buf.subarray(12, buf.length - 16);

  const dec  = crypto.createDecipheriv('aes-256-gcm', Buffer.from(dek!), iv);
  dec.setAuthTag(tag);
  return Buffer.concat([dec.update(enc), dec.final()]).toString('utf8');
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Reusing the same IV across encryptions',
    wrong: `const FIXED_IV = Buffer.alloc(12, 0); // reused for every encryption — catastrophic`,
    right: `const iv = crypto.randomBytes(12); // fresh random IV per encryption, stored with ciphertext`,
    explanation: 'Reusing an IV with the same key in GCM mode leaks both plaintexts — an attacker can XOR the two ciphertexts to get the XOR of the two plaintexts. It also exposes the GHASH subkey, breaking authentication for all past messages.',
  },
  {
    title: 'Using AES-ECB mode',
    wrong: `const cipher = crypto.createCipheriv('aes-256-ecb', key, null); // no IV, deterministic`,
    right: `const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); // authenticated, random IV`,
    explanation: 'ECB encrypts each 16-byte block independently with the same key. Identical plaintext blocks produce identical ciphertext blocks — patterns are visible (the famous ECB-encrypted penguin image). ECB is completely broken for anything beyond random data.',
  },
  {
    title: 'Encrypting without authentication (no integrity check)',
    wrong: `const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
// No HMAC — attacker can flip bits in ciphertext, alter decrypted data`,
    right: `const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
// GCM includes authentication tag — decryption fails if ciphertext is tampered`,
    explanation: 'Without authentication, an attacker can modify the ciphertext and the plaintext changes in a predictable way (CBC bit-flipping, padding oracle). Always use an AEAD mode like GCM, which authenticates before decrypting.',
  },
  {
    title: 'Storing the encryption key alongside the encrypted data',
    wrong: `// Key and ciphertext in the same DB table — both stolen in a breach
{ key: 'abc123key', ciphertext: 'xyz...' }`,
    right: `// Store the encrypted DEK (KMS-wrapped) with the ciphertext; plaintext key only in KMS
{ encryptedKey: '<KMS-ciphertext>', ciphertext: 'xyz...' }`,
    explanation: 'Storing the key with the encrypted data negates encryption — if the DB is breached, both are stolen. The key must be in a separate system (KMS) with independent access controls. A DB breach gets ciphertexts; a KMS breach gets keys. Both must be compromised to read data.',
  },
];

const challenge: Challenge = {
  title: 'XOR Cipher (Symmetric Demo)',
  language: 'typescript',
  description: `Implement a simple XOR cipher (NOT production-safe — for teaching only):
1. xorCipher(data: Uint8Array, key: Uint8Array): Uint8Array — XOR each data byte with the key byte (cycling through the key)
2. Works for both encrypt and decrypt (XOR is its own inverse)
3. encryptText(text: string, keyHex: string): string — returns hex of XOR-encrypted text
4. decryptText(cipherHex: string, keyHex: string): string — reverses it`,
  hints: [
    'key[i % key.length] cycles through the key',
    'Buffer.from(text, "utf8") and Buffer.from(hex, "hex")',
    'XOR decrypt = XOR encrypt with same key',
  ],
  starterCode: `function xorCipher(data: Uint8Array, key: Uint8Array): Uint8Array {
  // TODO
  return new Uint8Array(0);
}
function encryptText(text: string, keyHex: string): string {
  // TODO
  return '';
}
function decryptText(cipherHex: string, keyHex: string): string {
  // TODO
  return '';
}`,
  solution: `function xorCipher(data: Uint8Array, key: Uint8Array): Uint8Array {
  return data.map((byte, i) => byte ^ key[i % key.length]);
}
function encryptText(text: string, keyHex: string): string {
  const data = Buffer.from(text, 'utf8');
  const key  = Buffer.from(keyHex, 'hex');
  return Buffer.from(xorCipher(data, key)).toString('hex');
}
function decryptText(cipherHex: string, keyHex: string): string {
  const data = Buffer.from(cipherHex, 'hex');
  const key  = Buffer.from(keyHex, 'hex');
  return Buffer.from(xorCipher(data, key)).toString('utf8');
}
const key = 'deadbeef';
const cipher = encryptText('Hello, World!', key);
console.log('cipher:', cipher);
console.log('decrypted:', decryptText(cipher, key)); // Hello, World!`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why must the IV (Initialization Vector) be unique for every AES-GCM encryption?',
    options: [
      'A repeated IV increases encryption time',
      'Reusing an IV with the same key reveals both plaintexts and breaks authentication',
      'The IV must match the block size for correct padding',
      'The IV is part of the key derivation process',
    ],
    answer: 1,
    explanation: 'In AES-GCM, the keystream is derived from key+IV. Two messages encrypted with the same key+IV produce keystreams that cancel out when XORed — revealing both plaintexts. It also exposes the GHASH authentication subkey, completely breaking GCM\'s integrity guarantees for all messages encrypted with that key+IV pair.',
  },
  {
    q: 'What is envelope encryption and why is it used?',
    options: [
      'Encrypting data twice with two different algorithms',
      'Encrypting data with a DEK, then encrypting the DEK with a KMS-managed KEK — enables cheap key rotation',
      'Wrapping ciphertext in a base64 envelope for transport',
      'A TLS technique for double-encrypting sensitive headers',
    ],
    answer: 1,
    explanation: 'Envelope encryption separates the data encryption key (DEK) from the key encryption key (KEK) managed by a KMS. Benefits: KEK rotation doesn\'t require re-encrypting all data (only re-encrypt the DEK); the plaintext DEK is never stored; access to data is controlled through KMS IAM policies.',
  },
  { q: 'What is the difference between ECB and CBC modes in AES and why is ECB insecure?', options: ['ECB is faster than CBC; CBC is used only for streaming data', 'ECB encrypts each block independently with the same key, producing identical ciphertext for identical plaintext blocks; CBC XORs each block with the previous ciphertext, hiding patterns', 'ECB is the modern mode; CBC is deprecated in favor of ECB for performance', 'ECB uses a different key per block; CBC uses the same key throughout'], answer: 1, explanation: 'AES-ECB: each 16-byte block is encrypted independently. Identical plaintext blocks produce identical ciphertext blocks. The famous ECB penguin: an image of a Linux penguin encrypted with ECB still shows the outline because pixels form repeated patterns that map to repeated ciphertext. AES-CBC: each block is XORed with the previous ciphertext block before encryption. The Initialization Vector (IV) is XORed with the first block. Identical plaintext blocks produce different ciphertext because the preceding ciphertext differs. CBC requires a random IV. Replay attack without IV randomness: if the same IV is reused, patterns leak across messages. Modern preference: AES-GCM over AES-CBC, because GCM also provides authentication.' },
  { q: 'What is authenticated encryption and why is AES-GCM preferred over AES-CBC?', options: ['AES-GCM is preferred because it uses Galois field mathematics rather than cipher-block chaining', 'Authenticated encryption simultaneously provides confidentiality and integrity; AES-GCM produces an authentication tag that verifies the ciphertext was not tampered with, which AES-CBC alone does not', 'AES-GCM is symmetric; AES-CBC is asymmetric, making GCM more efficient', 'AES-GCM uses a 256-bit key by default; AES-CBC uses a 128-bit key'], answer: 1, explanation: 'Authenticated encryption: combines encryption (confidentiality) with a MAC (message authentication). AES-GCM: uses Galois Counter Mode. Produces a 128-bit authentication tag along with the ciphertext. Decryption: verify the tag before decrypting. If the ciphertext was modified, the tag verification fails and decryption is aborted. AES-CBC without a MAC: provides only confidentiality. An attacker can flip bits in the ciphertext and the decryption may succeed, producing subtly modified plaintext (bit-flipping attack). Padding oracle attack: AES-CBC-PKCS7 can be vulnerable to padding oracle attacks if decryption errors are observable. AES-GCM is not vulnerable to padding oracles (no padding). Always prefer authenticated encryption (AES-GCM, ChaCha20-Poly1305).' },
  { q: 'What is key derivation and when do you use PBKDF2, bcrypt, Argon2, or HKDF?', options: ['Key derivation functions are all equivalent; choose based on availability in your language', 'Password-based KDFs (PBKDF2, bcrypt, Argon2) add memory and time hardness for password storage; HKDF is a general-purpose KDF for deriving multiple keys from a shared secret', 'HKDF is for passwords; PBKDF2 is for symmetric key expansion', 'All KDFs are used interchangeably for both password hashing and session key derivation'], answer: 1, explanation: 'Key derivation function (KDF) categories: password-based KDFs: slow by design to resist brute force. PBKDF2: NIST-approved, uses HMAC internally, configurable iteration count. bcrypt: memory-adaptive (though less so than Argon2), widely supported. Argon2id: most modern, memory-hard, time-hard, recommended for new systems. Use for: password storage, deriving keys from passphrases. General-purpose KDFs: HKDF (HMAC-based Key Derivation Function, RFC 5869). Fast. Takes a shared secret and produces multiple derived keys of any length. Not suitable for passwords (no hardness). Use for: deriving encryption keys and MAC keys from a Diffie-Hellman shared secret. Session key derivation in TLS. Deriving multiple keys from one master key.' },
  { q: 'What is counter mode (CTR) and what makes nonce reuse catastrophic?', options: ['CTR mode is a stream cipher mode; nonce reuse causes the keystream to repeat, allowing an attacker to recover plaintext by XORing two ciphertexts encrypted with the same nonce', 'CTR mode counts the number of encryption operations; nonce reuse causes a counter reset that breaks the cipher', 'CTR mode is only used for hardware encryption; nonce reuse causes key leakage in software implementations', 'Nonce reuse in CTR causes padding errors similar to CBC padding oracle vulnerabilities'], answer: 0, explanation: 'AES-CTR: generates a keystream by encrypting a counter (nonce || counter). XORs the keystream with plaintext (like a stream cipher). Nonce reuse catastrophe: if the same (key, nonce) pair is used twice: ciphertext1 = plaintext1 XOR keystream. ciphertext2 = plaintext2 XOR keystream (same keystream!). ciphertext1 XOR ciphertext2 = plaintext1 XOR plaintext2. An attacker who knows or guesses any part of the plaintext can recover the other. This completely breaks confidentiality. AES-GCM also uses CTR mode internally: nonce reuse also destroys the authentication tag integrity AND reveals the authentication key, completely breaking the cipher. Generate a fresh random nonce for every encryption operation. Use a nonce length of at least 96 bits (GCM) to make random nonce collisions infeasible.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should you use AES-256-GCM vs ChaCha20-Poly1305?',
    a: 'Both are secure AEAD algorithms. <strong>AES-256-GCM</strong>: preferred when hardware AES acceleration is available (virtually all modern CPUs via AES-NI). Faster on server hardware. <strong>ChaCha20-Poly1305</strong>: faster in pure software (no hardware acceleration) — preferred for mobile devices and embedded systems where AES-NI may be absent. TLS 1.3 supports both. In practice, either is fine for server-side Node.js (AES-NI is available); ChaCha20-Poly1305 is a good choice for cross-platform libraries targeting IoT or mobile.',
  },
  {
    q: 'How do you encrypt a large file efficiently?',
    a: 'For large files, use streaming encryption: <ol><li>Generate a random 256-bit DEK and 96-bit IV</li><li>Create an AES-256-GCM cipher stream</li><li>Pipe the file through the cipher to the output</li><li>Append the IV + auth tag to the file header</li></ol>For files > ~64GB, split into chunks with independent IVs (GCM counter wraps at 2^32 blocks ≈ 64GB). Node.js crypto streams support this pattern via <code>createCipheriv</code> with pipe(). AWS S3 Server-Side Encryption handles this transparently for cloud storage.',
  },
  { q: 'How should you store encryption keys in production systems?', a: 'Encryption key storage best practices: never hardcode keys in source code or configuration files. Never store keys alongside the encrypted data. Hardware Security Modules (HSMs): keys generated in and never exported from HSMs. Operations (encrypt, decrypt) performed in the HSM. Most secure but expensive and operationally complex. Cloud KMS: AWS KMS, Google Cloud KMS, Azure Key Vault. Keys are HSM-backed in the cloud. Applications request encrypt/decrypt operations via API. IAM policies control which applications can use which keys. Key encryption key (KEK) hierarchy: a master key (in KMS or HSM) encrypts data encryption keys (DEKs). DEKs are stored encrypted near the data. On startup, applications decrypt the DEK using the master key. Key rotation: rotate keys on a schedule or after suspected compromise. Re-encrypt data with the new key. Old key versions retained for decryption of old data.' },
  { q: 'If you need to rotate the master key (CMK) used in an envelope encryption scheme, do you need to re-encrypt all the bulk data that was encrypted under the old master key?', a: 'No — this is one of envelope encryption\'s main operational advantages. Rotating the master (CMK) key only requires decrypting each small wrapped DEK with the OLD master key and re-encrypting (re-wrapping) that same DEK with the NEW master key — a fast, small-data operation regardless of how much bulk data exists. The actual bulk data, still encrypted under its unchanged DEK, never needs to be touched, decrypted, or re-encrypted during a master key rotation, which is exactly why envelope encryption scales to rotating keys protecting terabytes of data without a costly full re-encryption pass.' },
  { q: 'What is ChaCha20-Poly1305 and when is it preferred over AES-GCM?', a: 'ChaCha20-Poly1305: an authenticated encryption algorithm combining ChaCha20 stream cipher with Poly1305 MAC. ChaCha20 is a stream cipher designed by Daniel Bernstein (same author as Curve25519 and Salsa20). When preferred over AES-GCM: devices without AES hardware acceleration (older mobile devices, IoT, embedded systems). AES-GCM with software AES is significantly slower than ChaCha20-Poly1305. ChaCha20-Poly1305 has equal or better security guarantees. Resistant to timing attacks: software implementations of ChaCha20 are naturally constant-time. AES software implementations require care to be constant-time. TLS 1.3 supports both and negotiates based on client and server capabilities. Modern mobile CPUs often have AES hardware acceleration, making the choice less critical. The Go standard library uses ChaCha20-Poly1305 for its secretbox API.' },
  { q: 'How do you implement field-level encryption for sensitive database columns?', a: 'Field-level encryption: specific sensitive columns are encrypted at the application layer before being written to the database. The database stores ciphertext; even a DBA cannot read the plaintext without the key. Implementation: choose the columns to encrypt (SSN, credit card, health data). Generate a DEK for encryption (or use envelope encryption with KMS). Encrypt the value using AES-GCM before the ORM writes it. Decrypt when reading. Challenges: querying: you cannot run WHERE ssn = value on encrypted data. Solutions: deterministic encryption (same plaintext always produces same ciphertext with AES-SIV) allows equality queries but leaks frequency information. Store a hash of the value for lookup. Use homomorphic encryption (computationally expensive but allows operations on encrypted data). Key rotation: requires re-reading and re-encrypting all rows. Performance: encryption/decryption on every read/write adds latency. Use for columns that are rarely queried by value.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Use AES-256-GCM — authenticated encryption with a fresh random 12-byte IV per message; store key separately in KMS; use envelope encryption for large-scale data.',
  mustKnow: [
    'AES-256-GCM: authenticated (AEAD) — encrypts AND verifies integrity in one step',
    'IV: 12 random bytes per encryption; reuse with same key = catastrophic break',
    'Layout: IV (12) + ciphertext + auth tag (16) — IV is not secret, store with ciphertext',
    'Never AES-ECB — identical plaintext blocks produce identical ciphertext blocks',
    'Envelope encryption: DEK encrypts data; KEK (in KMS) encrypts DEK — independent rotation',
    'Key must not be stored alongside the encrypted data — separate access controls',
  ],
  interviewFocus: [
    'Why is IV reuse catastrophic for AES-GCM?',
    'What makes GCM better than CBC for encryption?',
    'Explain envelope encryption and its key rotation advantage',
  ],
};

@Component({
  selector: 'app-sec-symmetric-encryption',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './symmetric-encryption.html',
  styleUrl: './symmetric-encryption.scss',
})
export class SecSymmetricEncryption {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
