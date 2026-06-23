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
  { name: 'MFA',      type: 'keyword', desc: 'Multi-Factor Authentication — requires two or more of: something you know, have, or are.' },
  { name: 'TOTP',     type: 'keyword', desc: 'Time-based One-Time Password (RFC 6238) — 6-digit code from authenticator app, valid 30s.' },
  { name: 'HOTP',     type: 'keyword', desc: 'HMAC-based OTP (RFC 4226) — counter-based; precursor to TOTP.' },
  { name: 'WebAuthn', type: 'keyword', desc: 'W3C standard for passkeys/hardware keys — phishing-resistant, no shared secret.' },
  { name: 'Passkey',  type: 'keyword', desc: 'WebAuthn credential — public/private key pair, synced across devices, replaces password.' },
  { name: 'SMS OTP',  type: 'keyword', desc: 'One-time code via SMS — weakest MFA factor; vulnerable to SIM swapping and SS7 attacks.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The Three Authentication Factors',
    points: [
      'Something you KNOW: password, PIN, security question. Weakest category — can be phished, guessed, or reused.',
      'Something you HAVE: TOTP authenticator app, hardware key (YubiKey), passkey, SMS code. Physical possession required.',
      'Something you ARE: biometrics — fingerprint, face, voice. Used locally (never send biometrics to a server).',
      'MFA requires at least two different categories. "Username + password + security question" is not MFA — both are "something you know".',
    ],
  },
  {
    heading: 'TOTP — Time-Based One-Time Passwords',
    points: [
      'TOTP (RFC 6238) generates a 6-digit code using HMAC-SHA1 over (shared_secret + floor(time/30)) — code changes every 30 seconds.',
      'Setup: server generates a shared secret (base32 encoded), user scans a QR code into an authenticator app (Google Authenticator, Authy).',
      'Verification: server independently computes the TOTP for the current time window and compares. Allow ±1 window for clock drift.',
      'The shared secret must be stored securely server-side (encrypted at rest) — it is the permanent credential for generating codes.',
    ],
  },
  {
    heading: 'WebAuthn / Passkeys',
    points: [
      'WebAuthn: W3C standard allowing authentication with public-key cryptography. The browser/OS handles the key pair; only the public key is sent to the server.',
      'Phishing-resistant by design: the credential is bound to the origin (domain). A phishing site on a different domain gets a different credential — cannot be replayed.',
      'Passkeys: WebAuthn credentials synced across devices via iCloud Keychain or Google Password Manager. User experience: fingerprint or face scan.',
      'Registration: server sends a challenge; client signs with private key; server stores public key. Authentication: same challenge-response, verified with stored public key.',
    ],
  },
  {
    heading: 'MFA Factor Strength Ranking',
    points: [
      'Strongest: WebAuthn/passkeys — phishing-resistant, no shared secret, device-bound.',
      'Strong: TOTP app (Google Authenticator, Authy) — requires physical device, short-lived codes.',
      'Moderate: push notification (Duo, Okta Verify) — verify you pressed Approve, not just Yes to any prompt.',
      'Weak: SMS OTP — vulnerable to SIM swapping, SS7 attacks, and social engineering of mobile carriers.',
      'Do not use security questions as a second factor — they are effectively a second password ("something you know").',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'TOTP Setup & Verify',
    language: 'typescript',
    code: `import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

// ── Step 1: Generate secret during MFA setup ────────────────────────────────
async function generateMfaSetup(userId: string, userEmail: string) {
  const secret = speakeasy.generateSecret({
    name: \`DevHub (\${userEmail})\`,
    length: 20,
  });

  // QR code for authenticator app scan
  const otpauthUrl = secret.otpauth_url!;
  const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

  // Store the BASE32 secret securely (encrypted in DB)
  await db.users.updateMfaSecret(userId, encrypt(secret.base32));

  return { qrCodeDataUrl, manualEntryKey: secret.base32 };
}

// ── Step 2: Verify TOTP code during login ───────────────────────────────────
async function verifyTotp(userId: string, code: string): Promise<boolean> {
  const encryptedSecret = await db.users.getMfaSecret(userId);
  const secret = decrypt(encryptedSecret);

  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token:    code,
    window:   1, // ±30s for clock drift
  });
}

// ── Step 3: Login with MFA ──────────────────────────────────────────────────
app.post('/auth/login', async (req, res) => {
  const { email, password, totpCode } = req.body;
  const user = await validateCredentials(email, password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (user.mfaEnabled) {
    const valid = await verifyTotp(user.id, totpCode);
    if (!valid) return res.status(401).json({ error: 'Invalid MFA code' });
  }

  res.json({ token: issueJwt(user.id) });
});`,
  },
  {
    label: 'Backup Codes',
    language: 'typescript',
    code: `import crypto from 'crypto';

// ── Generate one-time backup codes ──────────────────────────────────────────
async function generateBackupCodes(userId: string): Promise<string[]> {
  const codes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase() // e.g. "A1B2C3D4"
  );

  // Store hashed codes (bcrypt) — never store plaintext backup codes
  const hashed = await Promise.all(codes.map(c => bcrypt.hash(c, 10)));
  await db.users.storeBackupCodes(userId, hashed);

  // Return plaintext only once — user must save these
  return codes;
}

// ── Redeem a backup code (each code is single-use) ──────────────────────────
async function redeemBackupCode(userId: string, code: string): Promise<boolean> {
  const storedHashes = await db.users.getBackupCodes(userId);

  for (let i = 0; i < storedHashes.length; i++) {
    const matches = await bcrypt.compare(code.toUpperCase(), storedHashes[i]);
    if (matches) {
      await db.users.deleteBackupCode(userId, i); // single-use
      return true;
    }
  }
  return false;
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Accepting SMS OTP as the only MFA option for high-value accounts',
    wrong: `// Only option: SMS code
// Vulnerable to SIM swapping, SS7 interception`,
    right: `// Offer hierarchy: WebAuthn → TOTP app → push notification → SMS (last resort)
// For admin accounts: require hardware key (WebAuthn)`,
    explanation: 'SMS-based OTP is vulnerable to SIM swapping (attacker convinces carrier to transfer victim\'s number) and SS7 protocol attacks. For sensitive operations (admin, financial), require TOTP or WebAuthn.',
  },
  {
    title: 'Not storing TOTP backup codes with proper hashing',
    wrong: `// Store backup codes in plaintext in DB
await db.users.storeBackupCodes(userId, codes);`,
    right: `// Hash each backup code with bcrypt before storage
const hashed = await Promise.all(codes.map(c => bcrypt.hash(c, 10)));
await db.users.storeBackupCodes(userId, hashed);`,
    explanation: 'Backup codes are high-value credentials — a DB breach exposing plaintext codes would completely bypass MFA. Hash them like passwords.',
  },
  {
    title: 'Accepting a TOTP code more than once (replay attack)',
    wrong: `// No dedup — same code can be used twice in the 30s window`,
    right: `// Store last-used code in cache with 60s TTL
const cacheKey = \`totp:\${userId}:\${code}\`;
if (await cache.exists(cacheKey)) return false; // replay
await cache.set(cacheKey, '1', 60);`,
    explanation: 'A valid TOTP code is good for 30 seconds (or ±1 window = 90 seconds). An attacker who intercepts the code can replay it within that window. Caching used codes prevents reuse.',
  },
  {
    title: 'Making MFA bypassable via "remember this device" forever',
    wrong: `// Remember device for 365 days
res.cookie('device_trusted', deviceId, { maxAge: 365 * 24 * 60 * 60 });`,
    right: `// Trust for 30 days max; re-verify on sensitive operations
res.cookie('device_trusted', signedDeviceToken, { maxAge: 30 * 24 * 60 * 60, httpOnly: true, secure: true });`,
    explanation: '"Remember this device" is a convenience feature that must have a bounded lifetime. Indefinite trust defeats the purpose of MFA — a stolen device or cookie grants permanent bypass.',
  },
];

const challenge: Challenge = {
  title: 'TOTP Code Validator',
  language: 'typescript',
  description: `Implement validateTotp(secret: string, code: string, windowSize = 1): boolean that:
1. Gets the current 30-second time counter: Math.floor(Date.now() / 1000 / 30)
2. For each counter in [current - windowSize, ..., current + windowSize]:
   a. Compute HMAC-SHA1 of the 8-byte big-endian counter using the secret
   b. Take the last nibble of the hash as offset
   c. Take 4 bytes at offset, mask to 31 bits → truncated hash
   d. Code = truncated % 1000000, zero-padded to 6 digits
3. Return true if any window matches the provided code`,
  hints: [
    'Use crypto.createHmac("sha1", secret)',
    'Buffer.from(counter).fill(8 bytes big-endian)',
    'offset = hash[19] & 0x0f',
  ],
  starterCode: `import crypto from 'crypto';

function validateTotp(secret: string, code: string, windowSize = 1): boolean {
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let w = -windowSize; w <= windowSize; w++) {
    // TODO: compute TOTP for counter + w and compare with code
  }
  return false;
}`,
  solution: `import crypto from 'crypto';

function hotp(secret: string, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32')).update(buf).digest();
  const offset = hmac[19] & 0x0f;
  const truncated = ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (truncated % 1_000_000).toString().padStart(6, '0');
}

function validateTotp(secret: string, code: string, windowSize = 1): boolean {
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let w = -windowSize; w <= windowSize; w++) {
    if (hotp(secret, counter + w) === code) return true;
  }
  return false;
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which MFA factor is phishing-resistant by design?',
    options: ['TOTP app codes', 'SMS one-time passwords', 'WebAuthn/passkeys', 'Email magic links'],
    answer: 2,
    explanation: 'WebAuthn/passkeys are phishing-resistant because the credential is cryptographically bound to the origin (domain). A phishing site on a different domain receives a completely different credential that cannot be replayed against the real site.',
  },
  {
    q: 'Why is SMS OTP considered weak MFA?',
    options: [
      'Codes are too long to type accurately',
      'Vulnerable to SIM swapping and SS7 protocol attacks — attacker can redirect texts without the user\'s device',
      'SMS codes are transmitted in plaintext',
      'Limited to 6-digit codes only',
    ],
    answer: 1,
    explanation: 'SIM swapping: attacker social-engineers the carrier into porting the victim\'s number to their SIM. SS7 attacks: nation-state-level interception of the SS7 telephony signalling protocol to intercept SMS. Both allow receiving the victim\'s OTP without physical access to their device.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between TOTP and HOTP?',
    a: '<strong>HOTP (RFC 4226)</strong>: HMAC-based — uses an incrementing counter as the moving factor. Codes are valid until used. Synchronisation problems arise if codes are generated but not used. <strong>TOTP (RFC 6238)</strong>: Time-based — uses floor(unix_time / 30) as the moving factor. Codes expire every 30 seconds, making stolen codes useless almost immediately. TOTP is the modern standard; HOTP is mostly historical.',
  },
  {
    q: 'How does WebAuthn prevent phishing?',
    a: 'During WebAuthn credential creation, the browser records the <strong>Relying Party ID</strong> (the domain, e.g. <code>example.com</code>). During authentication, the browser will only use that credential when the Relying Party ID matches the current origin. A phishing site on <code>evil-example.com</code> cannot request authentication with credentials bound to <code>example.com</code> — the browser refuses to complete the flow. This is fundamentally different from TOTP, where the user can type a code into any site.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'MFA requires two factors from different categories — prefer WebAuthn/passkeys (phishing-resistant) over TOTP over SMS; never accept security questions as a second factor.',
  mustKnow: [
    'Three factors: know (password), have (device/key), are (biometric) — MFA = two different categories',
    'TOTP: HMAC-SHA1 over (secret + time_window), 6-digit code, 30s validity — RFC 6238',
    'WebAuthn/passkeys: phishing-resistant — credential bound to origin domain, no shared secret',
    'SMS OTP: weakest MFA — SIM swapping and SS7 attacks allow interception without device access',
    'Backup codes: hash with bcrypt, single-use, generate 10, show once',
    'Store TOTP shared secret encrypted at rest — it is a permanent authentication credential',
  ],
  interviewFocus: [
    'Why is WebAuthn phishing-resistant while TOTP is not?',
    'What attacks does SMS OTP remain vulnerable to?',
    'How would you implement backup codes securely?',
  ],
};

@Component({
  selector: 'app-sec-mfa',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './mfa.html',
  styleUrl: './mfa.scss',
})
export class SecMfa {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
