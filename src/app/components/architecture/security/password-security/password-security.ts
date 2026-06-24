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
console.log(checkPasswordStrength('P@ssw0rd123!')); // { score: 3 or 4, feedback: [] }`,
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
];

const qna: QnaItem[] = [
  {
    q: 'What is the NIST guidance on password policy (SP 800-63B)?',
    a: 'NIST SP 800-63B recommends: <ul><li>Minimum 8 characters; support up to 64+</li><li>Check against known-breached password lists (HaveIBeenPwned)</li><li><strong>No mandatory complexity rules</strong> (uppercase/number/symbol requirements produce weak, predictable patterns)</li><li><strong>No mandatory periodic rotation</strong> — only require changes when breach is suspected</li><li>Allow paste into password fields (enables password managers)</li><li>No security questions</li></ul>',
  },
  {
    q: 'How does credential stuffing differ from brute force, and how do you defend against each?',
    a: '<strong>Brute force</strong>: systematically try all possible passwords for a known account. Defence: rate limiting, account lockout, CAPTCHA. <strong>Credential stuffing</strong>: use breach-dumped username/password pairs (from other sites) against your service — attackers already have real passwords. Defence: MFA (most effective — even correct credentials fail without second factor), anomalous login detection, HaveIBeenPwned integration. Rate limiting alone is insufficient against distributed stuffing attacks.',
  },
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
