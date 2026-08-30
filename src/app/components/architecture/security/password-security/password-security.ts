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
  { name: 'Argon2id',    type: 'keyword', desc: 'Recommended password hashing algorithm — memory-hard, resistant to GPU/ASIC attacks.' },
  { name: 'bcrypt',      type: 'keyword', desc: 'Widely supported adaptive hash — cost factor N means 2^N rounds; increase as hardware improves.' },
  { name: 'Salt',        type: 'keyword', desc: 'Random unique value added before hashing — prevents rainbow table attacks and identical-password detection.' },
  { name: 'PBKDF2',      type: 'keyword', desc: 'NIST-approved key derivation — acceptable but weaker than Argon2id against GPU attacks.' },
  { name: 'Credential Stuffing', type: 'keyword', desc: 'Using breach-dumped username/password pairs against other services — stopped by MFA + rate limiting.' },
  { name: 'HaveIBeenPwned', type: 'keyword', desc: 'Free API to check if a password appears in known breach databases — use at registration.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Why Passwords Must Be Hashed (Not Encrypted)',
    points: [
      'Encryption is reversible — if the key is compromised, all passwords are decrypted. Hashing is one-way.',
      'Storing passwords encrypted means every database breach also exposes the decryption key (usually co-located).',
      'Hashing + salt allows verification (hash the attempt, compare) without ever storing the plaintext.',
      'Historical disasters: LinkedIn (2012) stored 117M passwords as unsalted SHA-1 — all cracked within days of the breach being published.',
    ],
  },
  {
    heading: 'Choosing the Right Algorithm',
    points: [
      'Argon2id: 2015 Password Hashing Competition winner — the current recommendation. Memory-hard by design, resistant to GPU and ASIC parallel attacks.',
      'bcrypt: widely supported, battle-tested since 1999. Cost factor should be at least 12 in 2024 (target 250–500ms on server). Auto-generates a unique salt.',
      'PBKDF2: NIST FIPS 140-2 approved — required in some compliance contexts. Use PBKDF2-SHA256 with 600,000+ iterations. Weaker than Argon2id against GPUs.',
      'NEVER use: MD5, SHA-1, SHA-256 (unsalted or low-iteration) — these are fast hashes designed for data integrity, not password storage. Cracked in milliseconds.',
    ],
  },
  {
    heading: 'Salting',
    points: [
      'A salt is a random unique value generated per password and stored alongside the hash.',
      'Prevents rainbow table attacks: pre-computed hash tables become useless because each password has a unique salt.',
      'Prevents revealing identical passwords: two users with "password123" produce different hashes.',
      'bcrypt and Argon2id generate and embed the salt automatically — you do not manage it separately.',
      'Salt is NOT a secret — it is stored in plaintext alongside the hash. Its randomness is what makes it effective.',
    ],
  },
  {
    heading: 'Credential Stuffing & Brute Force Defence',
    points: [
      'Credential stuffing: attackers use breach-dumped username/password pairs from other sites against yours. Defences: MFA (most effective), rate limiting, CAPTCHA, IP blocking.',
      'Brute force: systematically trying all password combinations. Defences: rate limiting (max N attempts/minute), account lockout (temporary, not permanent), CAPTCHA.',
      'Temporary lockout (15–30 min after 5 failures) is better than permanent lockout — permanent lockout is a DoS vector.',
      'Notify users of failed login attempts from new devices/IPs — this surfaces credential stuffing attacks to victims.',
    ],
  },
  {
    heading: 'Password Policy Best Practices',
    points: [
      'NIST SP 800-63B (2024) guidance: minimum 8 characters; allow up to 64; check against breach databases; no mandatory complexity rules or rotation.',
      'Mandatory complexity ("must contain uppercase, number, symbol") reduces usable password space and leads to predictable patterns (Password1!).',
      'Mandatory rotation encourages weak incremental changes (Password1 → Password2). Require changes only when breach is suspected.',
      'Support paste in password fields — users with password managers create stronger, unique passwords.',
      'Check passwords against HaveIBeenPwned at registration and on next login after a breach — reject known-compromised passwords.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Hashing with bcrypt',
    language: 'typescript',
    code: `import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12; // ~250ms on modern hardware; adjust as hardware improves

// ── Hash password on registration ────────────────────────────────────────────
async function hashPassword(plaintext: string): Promise<string> {
  // bcrypt auto-generates a unique salt per call
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

// ── Verify on login ──────────────────────────────────────────────────────────
async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  // bcrypt.compare is timing-safe — prevents timing attacks
  return bcrypt.compare(plaintext, hash);
}

// ── Login endpoint ───────────────────────────────────────────────────────────
app.post('/auth/login', rateLimiter, async (req, res) => {
  const { email, password } = req.body;

  const user = await db.users.findByEmail(email);

  // Always run bcrypt.compare even if user not found — prevents timing-based enumeration
  const dummyHash = '$2b$12$abcdefghijklmnopqrstuuWrongHashForTimingSafety';
  const valid = user
    ? await verifyPassword(password, user.passwordHash)
    : await bcrypt.compare(password, dummyHash); // constant time even for non-existent users

  if (!user || !valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = issueJwt(user.id);
  res.json({ token });
});`,
  },
  {
    label: 'HaveIBeenPwned Check',
    language: 'typescript',
    code: `import crypto from 'crypto';

// k-anonymity model: send only first 5 chars of SHA-1 hash, not the full password
async function isPasswordPwned(password: string): Promise<boolean> {
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  const response = await fetch(\`https://api.pwnedpasswords.com/range/\${prefix}\`);
  const text = await response.text();

  // Response: "SUFFIX:COUNT\\nSUFFIX:COUNT\\n..."
  return text.split('\\n').some(line => line.startsWith(suffix));
}

// Use at registration
app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  if (await isPasswordPwned(password)) {
    return res.status(400).json({
      error: 'This password has appeared in a data breach. Please choose a different password.',
    });
  }

  const hash = await hashPassword(password);
  await db.users.create({ email, passwordHash: hash });
  res.status(201).json({ message: 'Account created' });
});`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using a fast hash (MD5, SHA-256) for passwords',
    wrong: `const hash = crypto.createHash('md5').update(password).digest('hex');`,
    right: `const hash = await bcrypt.hash(password, 12); // or argon2.hash(password)`,
    explanation: 'MD5 and SHA-256 are designed to be fast — a GPU can compute billions per second. bcrypt with cost 12 takes ~250ms by design. Fast hashes make brute force attacks trivially fast; adaptive hashes make them computationally infeasible.',
  },
  {
    title: 'Not using timing-safe comparison for password verification',
    wrong: `const valid = storedHash === computedHash; // string comparison leaks timing info`,
    right: `const valid = await bcrypt.compare(password, storedHash); // timing-safe`,
    explanation: 'String comparison short-circuits on the first mismatched character. An attacker measuring response times can infer how many characters matched. bcrypt.compare uses a constant-time algorithm regardless of where the strings differ.',
  },
  {
    title: 'Locking accounts permanently after failed attempts',
    wrong: `// After 5 failures: set account.locked = true — requires support to unlock`,
    right: `// Temporary lockout: locked_until = now + 15min; clear after timeout`,
    explanation: 'Permanent lockout is a DoS vector — attackers can lock every account by intentionally failing logins. Use temporary lockout (15–30 minutes) that clears automatically, rate limiting, and CAPTCHA instead.',
  },
  {
    title: 'Revealing which field failed on login',
    wrong: `if (!user) return res.json({ error: 'Email not found' });
if (!valid) return res.json({ error: 'Wrong password' });`,
    right: `if (!user || !valid) return res.json({ error: 'Invalid email or password' });`,
    explanation: 'Separate messages allow attackers to enumerate valid email addresses by testing which error they get. A combined message reveals nothing about whether the email exists in the system.',
  },
];

const challenge: Challenge = {
  title: 'Password Strength Checker',
  language: 'typescript',
  description: `Implement checkPasswordStrength(password: string): { score: number; feedback: string[] } that:
- score 0: less than 8 chars → feedback: ['Too short — minimum 8 characters']
- score 1: 8+ chars but only one char class (lower/upper/digit/special)
- score 2: 8+ chars, 2 char classes
- score 3: 12+ chars, 3+ char classes
- score 4: 16+ chars, all 4 char classes
- feedback: list of missing improvements`,
  hints: [
    'Check each character class with separate regex tests',
    'Count how many classes are present',
    'Build feedback array for missing classes',
  ],
  starterCode: `function checkPasswordStrength(password: string): { score: number; feedback: string[] } {
  // TODO
  return { score: 0, feedback: [] };
}`,
  solution: `function checkPasswordStrength(password: string): { score: number; feedback: string[] } {
  const feedback: string[] = [];
  if (password.length < 8) return { score: 0, feedback: ['Too short — minimum 8 characters'] };

  const classes = {
    lower:   /[a-z]/.test(password),
    upper:   /[A-Z]/.test(password),
    digit:   /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };
  const count = Object.values(classes).filter(Boolean).length;

  if (!classes.upper)   feedback.push('Add uppercase letters');
  if (!classes.digit)   feedback.push('Add numbers');
  if (!classes.special) feedback.push('Add special characters');

  let score = Math.min(count, 2);
  if (password.length >= 12 && count >= 3) score = 3;
  if (password.length >= 16 && count === 4) score = 4;

  return { score, feedback };
}

console.log(checkPasswordStrength('abc'));           // { score: 0, feedback: [...] }
console.log(checkPasswordStrength('password'));      // { score: 1, feedback: [...] }
console.log(checkPasswordStrength('P@ssw0rd123!')); // { score: 3, feedback: [] } -- 12 chars, all 4 classes, but under 16 chars so score 4 is out of reach`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which password hashing algorithm is recommended by the 2015 Password Hashing Competition?',
    options: ['bcrypt', 'SHA-256 with 10,000 iterations', 'Argon2id', 'PBKDF2-SHA512'],
    answer: 2,
    explanation: 'Argon2id won the 2015 Password Hashing Competition and is the current recommendation. It is memory-hard (requires significant RAM per attempt), making parallel GPU/ASIC attacks far more expensive. Use it for all new implementations.',
  },
  {
    q: 'What does a password salt prevent?',
    options: [
      'Brute force attacks by making hashing slow',
      'Rainbow table attacks and revealing when two users have the same password',
      'Timing attacks during password comparison',
      'SQL injection of password fields',
    ],
    answer: 1,
    explanation: 'A salt is a random value added before hashing, unique per password. It defeats rainbow table attacks (pre-computed hash tables) because the salt makes each hash unique even for identical passwords. It also prevents revealing when two users share the same password.',
  },
  { q: 'What is credential stuffing and how do you detect and prevent it?', options: ['An attack where users stuff credentials into an unsecured form submission', 'Automated use of leaked username-password pairs from data breaches to gain access to accounts on other sites', 'Brute-forcing all common passwords against a single account', 'Embedding multiple credential hashes in a single login request'], answer: 1, explanation: 'Credential stuffing: attackers obtain leaked credential lists (from other site breaches). Many users reuse passwords across sites. Attackers automate login attempts using the leaked credentials against target sites. Success rate 0.1-2% — but millions of credentials make this devastating. Detection: multiple login failures from distributed IPs (botnet distributes requests to evade IP rate limiting). Logins from unusual geographies or device fingerprints. High-volume login attempts correlating with known breach releases. Prevention: MFA (stuffed credentials cannot log in without the second factor). CAPTCHA on login after first failure. Device fingerprinting to flag new device logins. Check credentials against Have I Been Pwned API on password creation.' },
  { q: 'What is the NIST SP 800-63B guidance on password complexity rules?', options: ['Requires uppercase, lowercase, number, and symbol for all passwords', 'Recommends checking passwords against known-breached lists rather than complexity rules; prioritizes length over complexity requirements', 'Mandates periodic password rotation every 90 days', 'Requires passwords to be at least 16 characters with no exceptions'], answer: 1, explanation: 'NIST SP 800-63B (2017, revised 2023) moved away from traditional complexity rules: remove arbitrary complexity requirements (do not require uppercase + number + symbol). Remove periodic rotation mandates (forces users to make predictable changes: Password1! -> Password2!). Instead: require a minimum of 8 characters (support up to at least 64). Check submitted passwords against known-breached passwords (HIBP database). Check for common patterns and dictionary words. Alert users when their password is found in a known breach. Allow all printable ASCII and Unicode characters (spaces are fine). Multi-factor authentication is the most effective password policy improvement.' },
  { q: 'What is a password manager and what security considerations apply to enterprise use?', options: ['A browser extension that autocompletes passwords but has no server component', 'Software that generates, stores, and autofills strong unique credentials; enterprise considerations include master password strength, zero-knowledge architecture, team vaults, and emergency access', 'A system administrator tool for resetting user passwords in bulk', 'A centralized system that enforces password policies by generating new passwords for users'], answer: 1, explanation: 'Password manager security considerations: master password: the single point of failure. Must be strong and memorized. Zero-knowledge architecture: the provider cannot decrypt your vault. Enterprise features: team vaults with access controls (share a credential with a team, revoke access when someone leaves). Emergency access for account recovery. SSO integration. Browser extension security: the extension must only autofill on legitimate sites (not phishing sites). Origin matching by default. Credential exposure risk: if a vault provider is breached, the damage depends on whether the master password can decrypt the vault offline. LastPass 2022 breach: encrypted vaults stolen; weak master passwords can be brute-forced.' },
  { q: 'What is a passkey and how does it differ from a traditional password?', options: ['A passkey is a longer, more complex password generated by the browser', 'A passkey is a FIDO2 credential pair (public/private key) that replaces passwords entirely; authentication is done with biometrics or device PIN, with no secret transmitted to the server', 'A passkey is a temporary single-use login token replacing the password for one session', 'A passkey is a hardware device that generates new passwords on each press'], answer: 1, explanation: 'Passkeys: a FIDO2/WebAuthn credential consisting of a key pair. Registration: device generates a public-private key pair. The public key is stored on the server. The private key stays on the device and never leaves it. Login: the server sends a challenge. The device uses the private key to sign the challenge (user approves with biometric or PIN). The server verifies with the public key. Benefits over passwords: no password to steal from the server (only public keys stored). No password to phish (private key never transmitted, bound to origin). Resilient to credential stuffing (each site has a unique key pair). Passkeys sync across devices via platform sync (iCloud Keychain, Google Password Manager, or hardware key).' },
];

const qna: QnaItem[] = [
  {
    q: 'Why does NIST SP 800-63B specifically call out mandatory complexity rules (requiring uppercase, number, symbol) as counterproductive rather than just unnecessary?',
    a: 'Research NIST cites shows that forcing complexity rules pushes users toward PREDICTABLE patterns that satisfy the rule mechanically rather than genuinely increasing entropy — "Password1!" satisfies every common complexity requirement (uppercase, number, symbol) while being one of the most commonly guessed password patterns, since users reliably capitalize the first letter, append a number, and add "!" at the end when forced to. A long passphrase like "correct horse battery staple" has far more actual entropy and is easier to remember, but would often fail naive complexity rules for lacking a symbol or number — meaning the rule actively steers users away from stronger passwords toward weaker, more guessable ones that merely look complex.',
  },
  {
    q: 'How does credential stuffing differ from brute force, and how do you defend against each?',
    a: '<strong>Brute force</strong>: systematically try all possible passwords for a known account. Defence: rate limiting, account lockout, CAPTCHA. <strong>Credential stuffing</strong>: use breach-dumped username/password pairs (from other sites) against your service — attackers already have real passwords. Defence: MFA (most effective — even correct credentials fail without second factor), anomalous login detection, HaveIBeenPwned integration. Rate limiting alone is insufficient against distributed stuffing attacks.',
  },
  { q: 'How should you implement an account lockout policy without enabling denial-of-service?', a: 'Account lockout: after N failed attempts, temporarily lock the account. Risk: attackers can lock out legitimate users by deliberately failing authentication (DoS against users). Mitigations: progressive delays instead of hard lockouts: failed attempts cause increasing delays (1s, 5s, 30s, 5 min). Soft lockout with CAPTCHA: after 5 failures, require CAPTCHA rather than full lockout. Hard lockout with notification: after 10 failures, lock the account and email the user with an unlock link. Alert the security team. IP-based rate limiting separate from account lockout: limit attempts per IP (bot networks evade this; combine with device fingerprinting). Avoid lockout for low-value accounts. Apply stronger lockout to high-value accounts (admin, payment). Always lock out after the same number of attempts regardless of whether the username exists (timing attack mitigation).' },
  { q: 'What is password spraying and how does it differ from brute force?', a: 'Brute force: try many passwords against a single account (e.g., try all 8-character passwords against admin). Detected by: high failure rate on one account. Triggers account lockout quickly. Password spraying: try one or a few common passwords against many accounts (e.g., try Password1! against 10,000 accounts). Detection evasion: each account has only 1-2 failures, staying under lockout thresholds. Targeting: particularly effective in enterprises where many accounts exist and password policies result in predictable passwords (Season+Year! format is common). Prevention: MFA prevents sprayed credential use. Monitor for distributed low-volume login failures across many accounts from the same IP or IP range. Check new passwords against common password lists. Detect the pattern: if any single IP hits many different accounts with failures in a short window, block and alert.' },
  { q: 'How should you handle the forgot password flow securely?', a: 'Secure forgot password implementation: accept email or username for reset requests. Always return the same response regardless of whether the account exists (prevent email enumeration: do not say account not found). Send a reset link to the registered email containing a securely generated token (cryptographically random, at least 128 bits). The token is single-use and expires after 1 hour. Store the reset token as a hash in the database (not plaintext). On submission: verify the token hash matches and is not expired. Redirect to a set-new-password form. After use: invalidate the token immediately (single-use). Invalidate all existing sessions for the user after a successful password reset (force re-login). Rate-limit reset requests per email address per time window.' },
  { q: 'What is the Have I Been Pwned (HIBP) API and how can you use it safely without exposing passwords?', a: 'HIBP is a breach database containing billions of known-compromised credentials. The API allows checking if a password has appeared in a breach. Checking safely without sending the full hash: the k-anonymity model. Client: hash the password with SHA-1. Send only the first 5 characters of the hash to the HIBP API. The server returns all known hashes that start with those 5 characters (typically hundreds of matches). The client locally checks if the full hash appears in the returned list. If the full hash matches, the password is known-breached. No more than 5 characters of the hash are sent, preventing the server from learning which specific password was checked. Implementation: on password creation and change, call HIBP. If the password is in the breach list, reject it and ask the user to choose a different one. Also check existing passwords proactively when breach databases are updated.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Store passwords with Argon2id or bcrypt (cost≥12) — never fast hashes like MD5/SHA-1 — and defend against credential stuffing with MFA and rate limiting.',
  mustKnow: [
    'Argon2id = current best; bcrypt cost≥12 = widely supported alternative',
    'Salt: random per-password value that prevents rainbow tables and identical-password detection',
    'NEVER: MD5, SHA-1, SHA-256 for passwords — they are too fast (billions/sec on GPU)',
    'Timing-safe comparison: bcrypt.compare() vs plain string equality',
    'Generic error on login: "Invalid email or password" — never reveal which field failed',
    'NIST: no mandatory complexity or rotation — check against breach databases instead',
  ],
  interviewFocus: [
    'Why is bcrypt better than SHA-256 for passwords?',
    'What does a salt protect against?',
    'How does credential stuffing differ from brute force?',
  ],
};

@Component({
  selector: 'app-sec-password-security',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './password-security.html',
  styleUrl: './password-security.scss',
})
export class SecPasswordSecurity {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
