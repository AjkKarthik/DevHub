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
  { name: 'SHA-256',    type: 'keyword', desc: 'General-purpose hash — 256-bit output, collision-resistant, deterministic.' },
  { name: 'SHA-3',      type: 'keyword', desc: 'NIST standard (2015) — different construction from SHA-2; quantum-resistant candidate.' },
  { name: 'HMAC',       type: 'keyword', desc: 'Hash-based Message Authentication Code — SHA-256 + secret key → MAC for integrity + auth.' },
  { name: 'Collision',  type: 'keyword', desc: 'Two different inputs producing the same hash output — good hash functions make this computationally infeasible.' },
  { name: 'Pre-image',  type: 'keyword', desc: 'Given H(x), finding x — cryptographic hashes must make this computationally infeasible.' },
  { name: 'Length Extension', type: 'keyword', desc: 'SHA-2 vulnerability: extend hash(key||msg) to forge hash of a longer message — HMAC prevents this.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Hash Function Properties',
    points: [
      'A cryptographic hash maps arbitrary input to a fixed-length output deterministically. Same input → always same hash.',
      'Pre-image resistance: given H(x), computationally infeasible to find x. You cannot reverse a hash.',
      'Second pre-image resistance: given x and H(x), infeasible to find y ≠ x where H(y) = H(x).',
      'Collision resistance: infeasible to find any two inputs x ≠ y where H(x) = H(y).',
      'Avalanche effect: changing a single bit in the input completely changes the output hash — useful for detecting tampering.',
    ],
  },
  {
    heading: 'SHA-2 Family',
    points: [
      'SHA-256 (256-bit output): the workhorse — used in TLS certificates, JWT signatures, HMAC, git commit hashes, code signing, file integrity checks.',
      'SHA-384 / SHA-512: larger outputs for higher-security applications. SHA-512 is faster than SHA-256 on 64-bit CPUs due to larger internal word size.',
      'SHA-1: broken for collision resistance (Google\'s SHAttered in 2017). Do NOT use for new applications. Legacy only.',
      'MD5: broken — trivial collision attacks. Use only for non-security purposes (e.g., cache busting, file deduplication where collision is not a security concern).',
    ],
  },
  {
    heading: 'HMAC — Authenticated Hashing',
    points: [
      'HMAC(key, message) = H(key XOR opad || H(key XOR ipad || message)) — a keyed hash that provides both integrity and authentication.',
      'Without a key, a hash only proves integrity (was the data modified?). With HMAC, you also prove authenticity (was it produced by someone who knows the secret key?).',
      'Length extension attack: SHA-2 is vulnerable — given H(key||msg), an attacker can compute H(key||msg||extra) without knowing key. HMAC\'s construction prevents this.',
      'Uses: webhook signature verification (GitHub, Stripe sign payloads with HMAC-SHA256), cookie signing, API request signing, token validation.',
    ],
  },
  {
    heading: 'Practical Hash Use Cases',
    points: [
      'File integrity: hash files with SHA-256; compare hashes to detect corruption or tampering. Checksums distributed alongside downloads.',
      'Data deduplication: same content → same hash → deduplicate. Git uses SHA-1 (legacy) / SHA-256 for content-addressable storage.',
      'Deterministic IDs: hash a canonical representation of an entity to get a stable ID. `SHA256(email.toLowerCase())` for a pseudonymous user ID.',
      'Password hashing: DO NOT use SHA-256 directly — it is too fast. Use Argon2id or bcrypt. See the Password Security page.',
    ],
  },
  {
    heading: 'Password Hashing vs General-Purpose Hashing',
    points: [
      'General-purpose hash functions (SHA-256, SHA-3) are designed to be FAST — ideal for verifying file integrity or generating checksums, but this exact speed makes them a poor choice for password storage, since an attacker with a stolen hash database can attempt billions of guesses per second.',
      'Password hashing algorithms (bcrypt, scrypt, Argon2) are deliberately SLOW and configurable (via a cost/work factor), making brute-force guessing computationally expensive even with specialized hardware — this is the core design goal distinguishing them from general-purpose hashes.',
      'Argon2 (winner of the Password Hashing Competition) is the current best-practice recommendation — it is memory-hard, meaning it also resists GPU and ASIC-based cracking attempts that can parallelize computation-only algorithms far more easily than memory-bound ones.',
      'Salting (a unique random value per password, stored alongside the hash) prevents precomputed rainbow-table attacks and ensures two users with the identical password produce different stored hashes — all modern password hashing libraries (bcrypt, Argon2) handle salting automatically and should never be implemented manually.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'SHA-256 & HMAC',
    language: 'typescript',
    code: `import crypto from 'crypto';

// ── SHA-256 hash ──────────────────────────────────────────────────────────────
function sha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// File integrity check
const fileContent = Buffer.from('important document content');
const checksum    = sha256(fileContent);
console.log('SHA-256:', checksum); // e3b0c44298fc1c149...

// ── HMAC-SHA256 — keyed integrity + authenticity ──────────────────────────────
function hmacSha256(secret: string, data: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

// Webhook signature verification (GitHub / Stripe pattern)
function verifyWebhookSignature(
  payload: string,
  receivedSig: string,
  secret: string
): boolean {
  const expected = \`sha256=\${hmacSha256(secret, payload)}\`;
  // Timing-safe comparison — prevents timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(receivedSig)
  );
}

// Express middleware for GitHub webhooks
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const valid     = verifyWebhookSignature(req.body.toString(), signature, process.env['WEBHOOK_SECRET']!);

  if (!valid) return res.status(401).send('Invalid signature');
  processWebhook(req.body);
  res.status(200).send('OK');
});`,
  },
  {
    label: 'Timing-Safe Comparison & Hash Uses',
    language: 'typescript',
    code: `import crypto from 'crypto';

// ── Timing-safe comparison — ALWAYS use for security-sensitive comparisons ────
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do the comparison to prevent length-based timing leaks
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ── Pseudonymous user ID from email ───────────────────────────────────────────
function pseudonymousId(email: string): string {
  return crypto.createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex');
}

// ── API key storage (SHA-256 hash in DB) ──────────────────────────────────────
function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

// ── File deduplication ────────────────────────────────────────────────────────
async function getFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash   = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end',  ()    => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// ── Content-addressable storage ───────────────────────────────────────────────
const contentStore = new Map<string, Buffer>();

function storeContent(data: Buffer): string {
  const key = sha256(data);
  contentStore.set(key, data); // same content = same key = automatic dedup
  return key;
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using MD5 or SHA-1 for security-sensitive hashing',
    wrong: `const hash = crypto.createHash('md5').update(data).digest('hex');    // broken
const hash = crypto.createHash('sha1').update(data).digest('hex');   // broken`,
    right: `const hash = crypto.createHash('sha256').update(data).digest('hex'); // minimum
const hash = crypto.createHash('sha512').update(data).digest('hex'); // stronger`,
    explanation: 'MD5 has trivial collision attacks — two different inputs with the same MD5 can be generated in seconds. SHA-1 was broken by Google\'s SHAttered attack. Both are unsuitable for any security use. Use SHA-256 minimum for new applications.',
  },
  {
    title: 'Using plain string equality for hash comparison (timing attack)',
    wrong: `if (computedHash === receivedHash) { /* proceed */ } // string comparison leaks timing`,
    right: `if (crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(receivedHash))) { /* proceed */ }`,
    explanation: 'Regular string comparison (`===`) returns false as soon as the first mismatched character is found — the comparison time reveals how many characters matched. An attacker measuring response times can reconstruct the expected hash one character at a time. `timingSafeEqual` always compares all bytes.',
  },
  {
    title: 'Naive keyed hash instead of HMAC (length extension attack)',
    wrong: `const mac = sha256(secret + message); // vulnerable to length extension`,
    right: `const mac = crypto.createHmac('sha256', secret).update(message).digest('hex');`,
    explanation: 'SHA-256 is vulnerable to length extension: given H(secret||msg), an attacker can compute H(secret||msg||extra) without knowing secret. This breaks naive keyed hashes. HMAC\'s nested construction (inner hash + outer hash) prevents this.',
  },
  {
    title: 'Using SHA-256 directly to hash passwords',
    wrong: `const hash = crypto.createHash('sha256').update(password).digest('hex'); // way too fast`,
    right: `const hash = await bcrypt.hash(password, 12); // or argon2.hash(password)`,
    explanation: 'SHA-256 computes ~500 million hashes per second on a GPU. A 8-character password can be brute-forced in minutes against a SHA-256 hash. Use bcrypt or Argon2id — they are designed to be slow and memory-hard. See the Password Security page.',
  },
];

const challenge: Challenge = {
  title: 'File Checksum Verifier',
  language: 'typescript',
  description: `Implement verifyChecksum(data: string, expectedHash: string): boolean that:
1. Computes SHA-256 of data (as hex string)
2. Compares it to expectedHash using timing-safe comparison
3. Returns true only if they match (same length and same content)`,
  hints: [
    'crypto.createHash("sha256").update(data).digest("hex")',
    'Buffer.from(a) for timingSafeEqual — both buffers must have the same length',
    'Return false immediately if lengths differ (but still run timingSafeEqual to prevent timing leaks)',
  ],
  starterCode: `import crypto from 'crypto';

function verifyChecksum(data: string, expectedHash: string): boolean {
  // TODO
  return false;
}`,
  solution: `import crypto from 'crypto';

function verifyChecksum(data: string, expectedHash: string): boolean {
  const computed = crypto.createHash('sha256').update(data).digest('hex');
  if (computed.length !== expectedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedHash));
}

const data = 'Hello, World!';
const hash = crypto.createHash('sha256').update(data).digest('hex');
console.log(verifyChecksum(data, hash));          // true
console.log(verifyChecksum('tampered', hash));    // false
console.log(verifyChecksum(data, 'wronghash' + '0'.repeat(55))); // false`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the length extension attack on SHA-2 hashes?',
    options: [
      'Extending the hash output to make it look longer',
      'Given H(key||msg), computing H(key||msg||extra) without knowing key — exploits SHA-2\'s Merkle-Damgård construction',
      'Iterating SHA-256 multiple times to strengthen a password hash',
      'Adding padding bytes to the plaintext before hashing',
    ],
    answer: 1,
    explanation: 'SHA-2 uses the Merkle-Damgård construction — the internal state after processing H(key||msg) can be used as a starting state to extend the hash. Given only the output H(key||msg) and the message length, an attacker computes H(key||msg||padding||extra) without the key. HMAC prevents this via its nested construction.',
  },
  {
    q: 'Why must timing-safe comparison be used when verifying HMACs or hashes?',
    options: [
      'Regular comparison is slower for long strings',
      'String equality returns early on first mismatch — timing reveals how many characters matched, allowing byte-by-byte forgery',
      'Buffers cannot be compared with === in JavaScript',
      'HMAC values contain non-printable characters that break string comparison',
    ],
    answer: 1,
    explanation: 'Standard string comparison short-circuits on the first mismatched character. An attacker submitting many slightly different HMACs can measure response times to determine how many leading characters matched their guess — reconstructing the expected HMAC one character at a time. `crypto.timingSafeEqual` always runs in constant time.',
  },
  { q: 'What is a rainbow table attack and how does password salting prevent it?', options: ['A GPU-based brute force attack; salting slows down GPU hashing', 'A precomputed lookup table mapping common passwords to their hashes; salting adds a unique random value to each password before hashing so precomputed tables are ineffective', 'A social engineering technique; salting adds complexity to passwords before the user types them', 'A timing attack on hash functions; salting randomizes the computation time'], answer: 1, explanation: 'Rainbow table: an attacker precomputes hashes of millions of common passwords. During a database breach, they look up leaked hashes in the table to instantly recover the plain-text password. Salting defeats rainbow tables: a unique random salt is generated per user. The stored hash is H(salt + password). A precomputed table for passwords without this specific salt is useless. The attacker must rehash every candidate password with the user-specific salt, making precomputation impractical. Bcrypt, scrypt, and Argon2 all incorporate salting automatically — you do not need to manage salts separately.' },
  { q: 'What are work factors in password hashing and how do you choose an appropriate value?', options: ['The number of rounds of salt generation before hashing', 'A configurable parameter that controls computational cost; higher values make hashing slower and more expensive for attackers to brute-force', 'The complexity factor that determines the minimum password length requirement', 'A bcrypt-specific value that controls the key length of the derived hash'], answer: 1, explanation: 'Work factor (cost factor): controls how computationally expensive the hash function is. Bcrypt cost factor 12: 2^12 = 4096 internal iterations. Doubling the cost factor doubles the time. Argon2 has memory, iteration, and parallelism parameters. Choosing the right value: benchmark on production hardware. Choose a value where one hash takes 100-300ms on current hardware. This makes brute-forcing thousands of passwords per second infeasible for attackers. Upgrade the cost factor when hardware gets faster (rehash on next login). OWASP currently recommends bcrypt cost factor of at least 10; Argon2id with memory=19456 KiB, iterations=2, parallelism=1.' },
  { q: 'What is HMAC and how does it differ from a plain hash of a message?', options: ['HMAC hashes the message twice for additional security over a single hash', 'HMAC (Hash-based Message Authentication Code) uses a secret key combined with a hash function; unlike a plain hash, it proves the message came from someone who knows the key', 'HMAC is a slower variant of SHA-256 designed for password hashing', 'HMAC stands for High-Memory Adaptive Computation, referring to its memory-hard design'], answer: 1, explanation: 'Plain hash: H(message) — anyone can compute this. If an attacker intercepts the message, they can replace it and recompute the hash. HMAC: HMAC-SHA256(key, message) — requires knowledge of the shared secret key to compute. Use cases: message authentication (verify a message was not tampered with and came from someone with the key). API request signing. JWT HS256 signatures. Webhook signatures (Stripe, GitHub use HMAC-SHA256). Unlike digital signatures (asymmetric), HMAC requires both parties to share the same secret key. HMAC is faster than asymmetric signing, suitable for high-throughput scenarios.' },
  { q: 'Why does SHA-3\'s "sponge" construction resist length extension attacks when SHA-2\'s Merkle-Damgard construction does not?', options: ['SHA-3 simply uses a longer output length, making brute force infeasible', 'In Merkle-Damgard, the final hash output IS the complete internal state, so anyone who knows the hash can resume computation from exactly that state; in a sponge construction, only PART of the internal state is exposed as output (the "rate"), while a hidden portion (the "capacity") is never revealed, making it impossible to reconstruct the full internal state needed to continue hashing', 'SHA-3 does not use padding, which is what enables the attack in SHA-2', 'SHA-3 requires a secret key for every hash operation, unlike SHA-2'], answer: 1, explanation: 'The length extension vulnerability exists because Merkle-Damgard hash functions output their ENTIRE internal state as the final hash — anyone holding H(message) effectively holds everything needed to resume the compression function and process additional blocks as if they were part of the original message. A sponge construction (SHA-3/Keccak) deliberately keeps part of its internal state (the "capacity") hidden and never outputs it, only exposing a smaller "rate" portion as the hash digest — without the hidden capacity bits, an attacker cannot reconstruct the exact internal state needed to append valid additional data, structurally closing off the attack rather than requiring a workaround like HMAC.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between a hash and a checksum?',
    a: '<strong>Checksum</strong>: detects accidental errors — CRC32, Adler-32. Fast but not cryptographically secure; trivially collided intentionally. Used for: network packet integrity, file transfer error detection. <strong>Cryptographic hash</strong>: resistant to intentional collision and pre-image attacks. SHA-256, SHA-512, SHA-3. Used for: data integrity verification, digital signatures, HMAC. Always use a cryptographic hash when security matters — a checksum cannot detect intentional tampering.',
  },
  {
    q: 'What is SHA-3 and when should you use it over SHA-2?',
    a: 'SHA-3 (Keccak, standardised by NIST in 2015) uses a sponge construction — fundamentally different from SHA-2\'s Merkle-Damgård. Benefits: <ul><li>Immune to length extension attacks natively (no need for HMAC)</li><li>Designed as a backup in case SHA-2 is broken</li><li>Quantum-resistant in the 256-bit variant (security halves against Grover\'s algorithm, 256 → 128 bits)</li></ul>When to prefer SHA-3: post-quantum migration, systems that need length-extension immunity without HMAC, new protocol design. SHA-256 is still secure and faster in hardware — prefer it for performance-sensitive applications unless you specifically need SHA-3 properties.',
  },
  { q: 'How do you verify data integrity with hashes in a file download system?', a: 'Content delivery with integrity: the publisher computes a hash of the release binary: sha256sum release.tar.gz produces a hash digest. The publisher publishes the hash in a signed checksums file or in the release notes. The user downloads the binary and independently computes the hash: sha256sum release.tar.gz. Comparing both hashes: if they match, the download was not corrupted or tampered with in transit. For stronger guarantees, sign the checksum file with a PGP key or use an authenticated channel to distribute the hash. Used by Linux distributions, Docker Hub, npm, and Maven for artifact integrity. The Go module proxy uses module hashes stored in a transparency log (sumdb) for auditable integrity.' },
  { q: 'What is the difference between Argon2d, Argon2i, and Argon2id?', a: 'Argon2 won the Password Hashing Competition in 2015. Three variants: Argon2d: optimized against GPU cracking (uses data-dependent memory access patterns). Vulnerable to side-channel attacks (timing attacks can leak information through memory access patterns). Not suitable for password hashing in shared environments. Argon2i: optimized against side-channel attacks (data-independent memory access). Better for password hashing in potentially hostile environments. Slightly less resistant to GPU attacks. Argon2id: hybrid of Argon2d and Argon2i. The first half uses Argon2i (side-channel resistance); the second half uses Argon2d (GPU resistance). Recommended for most password hashing use cases (OWASP recommendation). Use Argon2id with sufficient memory parameter (at least 64 MB for security-sensitive applications).' },
  { q: 'How should you handle hash algorithm upgrades in a live system without invalidating existing accounts?', a: 'Hash algorithm migration (e.g., MD5 to bcrypt) in a live system: lazy migration is the only viable approach for a system without raw password access. When a user logs in with their password: verify against the old hash. If valid: re-hash with the new algorithm. Update the stored hash. The algorithm field in the database row indicates which algorithm was used. Users who never log in retain the old hash (may trigger mandatory password resets after a deadline). Double-hashing migration path: some teams wrap old hashes: bcrypt(base64(md5(password))). This is immediately deployable without waiting for logins, but old hash exposure is still a risk. Track migration progress in a dashboard to know when all active users have been migrated.' },
  { q: 'What is the practical security difference between SHA-256 and bcrypt for password storage?', a: 'SHA-256 is a cryptographic hash designed for speed. It can perform billions of hashes per second on modern GPU hardware. At one billion hashes per second, an 8-character password space is exhausted in hours. SHA-256 with a salt requires an attacker to compute one SHA-256 per candidate per salt, but at billion-per-second speed, this is still feasible for short passwords. Bcrypt is designed to be slow. With a cost factor of 12, it performs about 100 hashes per second on typical hardware. At 100 hashes per second, an 8-character password space takes centuries. Bcrypt is specifically calibrated for the threat model of offline brute-force after a database breach. Never use SHA-256, SHA-512, MD5, or any general-purpose hash for password storage. Use bcrypt, scrypt, or Argon2id.' },
];

const revision: RevisionSummary = {
  oneLiner: 'SHA-256 for integrity; HMAC-SHA256 for authenticity; timing-safe comparisons always; never MD5/SHA-1 for security; never SHA-256 directly for passwords.',
  mustKnow: [
    'SHA-256: pre-image resistant, collision resistant, deterministic — general purpose',
    'MD5 and SHA-1: broken for security use — collisions are trivial/practical',
    'HMAC: keyed hash — provides both integrity AND authenticity; prevents length extension',
    'Length extension: SHA-2 vulnerable to hash(key||msg||extra) without key — HMAC immune',
    'timingSafeEqual: always use for security-sensitive hash comparisons',
    'Passwords: NEVER SHA-256 directly — too fast; use bcrypt/Argon2id',
  ],
  interviewFocus: [
    'What is the length extension attack and why does HMAC prevent it?',
    'Why use timing-safe comparison for HMAC verification?',
    'When would you use SHA-3 instead of SHA-2?',
  ],
};

@Component({
  selector: 'app-sec-hashing',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './hashing.html',
  styleUrl: './hashing.scss',
})
export class SecHashing {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
