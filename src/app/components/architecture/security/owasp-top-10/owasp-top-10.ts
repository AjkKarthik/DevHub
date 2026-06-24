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
  { name: 'A01 Broken Access Control', type: 'keyword', desc: '#1 risk since 2021 — missing authorisation checks on server-side data access.' },
  { name: 'A02 Crypto Failures',       type: 'keyword', desc: 'Sensitive data exposed due to weak/missing encryption or key mismanagement.' },
  { name: 'A03 Injection',             type: 'keyword', desc: 'SQL, OS, LDAP, and command injection via unsanitised user input.' },
  { name: 'A05 Security Misconfiguration', type: 'keyword', desc: 'Default credentials, open cloud storage, unnecessary features enabled.' },
  { name: 'A07 Auth Failures',         type: 'keyword', desc: 'Weak passwords, missing MFA, credential stuffing, session fixation.' },
  { name: 'A09 Logging Failures',      type: 'keyword', desc: 'Insufficient logging and monitoring allows breaches to go undetected.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'A01 — Broken Access Control',
    points: [
      'Most critical OWASP risk since 2021 — found in 94% of tested applications.',
      'Common patterns: IDOR (Insecure Direct Object Reference) — /api/orders/123 returns another user\'s order; missing function-level access control — non-admin calls admin endpoint.',
      'Fix: enforce access control server-side on every request; deny by default; log and alert on failures.',
      'In APIs: always verify the requesting user owns or has permission to access the specific resource, not just that they are logged in.',
    ],
  },
  {
    heading: 'A02 — Cryptographic Failures',
    points: [
      'Previously "Sensitive Data Exposure" — data is exposed because it is not encrypted or encrypted with weak algorithms.',
      'Examples: passwords stored as plain text or MD5; data transmitted over HTTP; private keys hardcoded in source code.',
      'Fix: use TLS 1.2+ for transit; AES-256-GCM for data at rest; Argon2id for passwords; never roll your own crypto.',
      'Classify data by sensitivity: PII, financial, health data must be encrypted at rest and in transit with key management.',
    ],
  },
  {
    heading: 'A03 — Injection',
    points: [
      'User-supplied data is interpreted as code: SQL injection, OS command injection, LDAP injection, template injection.',
      'Classic SQL injection: `SELECT * FROM users WHERE id = \'1\' OR \'1\'=\'1\'` — returns all rows.',
      'Fix: always use parameterised queries or prepared statements; never concatenate user input into SQL strings; use an ORM that handles escaping.',
      'Command injection: `exec("ping " + userInput)` — attacker sends `; rm -rf /`. Fix: use child_process with argument arrays, not shell strings.',
    ],
  },
  {
    heading: 'A05 — Security Misconfiguration',
    points: [
      'Default credentials left on admin interfaces, unnecessary HTTP methods enabled, verbose error messages revealing stack traces and database details.',
      'Cloud misconfiguration: S3 bucket set to public, database port exposed to the internet, no MFA on root account.',
      'Fix: security hardening checklists per technology; automated IaC security scanning (Checkov); CIS benchmarks for OS/container hardening.',
      'Remove default accounts and passwords immediately on installation; disable admin interfaces not needed in production.',
    ],
  },
  {
    heading: 'A07 — Identification & Authentication Failures',
    points: [
      'Previously "Broken Authentication" — weak login mechanisms, missing MFA, poor session management.',
      'Credential stuffing: using breach-dumped username/password pairs against your site — rate limiting and MFA are the defences.',
      'Session fixation: attacker provides a known session ID, user logs in with it — fix by regenerating session ID on login.',
      'Fix: enforce strong passwords, add MFA, rate-limit login, regenerate session IDs on authentication, set short session timeouts.',
    ],
  },
  {
    heading: 'A09 — Security Logging & Monitoring Failures',
    points: [
      'Without logging, attackers operate undetected. Average breach dwell time is 200+ days without active monitoring.',
      'Log: authentication events (success and failure), access control failures, input validation failures, admin actions.',
      'Do NOT log: passwords, tokens, credit card numbers, PII — logs are often shipped to third-party systems.',
      'Alert on: multiple failed logins (credential stuffing), access to sensitive endpoints from new IPs, unusual data volumes being queried.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'IDOR Fix (A01)',
    language: 'typescript',
    code: `// A01: Broken Access Control — IDOR vulnerability and fix
// BAD: returns any order if you know the ID
app.get('/api/orders/:id', authenticate, async (req, res) => {
  const order = await db.findOrder(req.params.id);
  res.json(order); // ANYONE authenticated can get ANY order
});

// GOOD: verify ownership before returning
app.get('/api/orders/:id', authenticate, async (req, res) => {
  const order = await db.findOrder(req.params.id);

  if (!order) return res.status(404).json({ error: 'Not found' });

  // Verify the requesting user owns this order
  if (order.userId !== req.user.id && !req.user.roles.includes('admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(order);
});

// Also apply to PUT/DELETE — check ownership before mutating
app.delete('/api/orders/:id', authenticate, async (req, res) => {
  const order = await db.findOrder(req.params.id);
  if (!order || order.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await db.deleteOrder(req.params.id);
  res.status(204).send();
});`,
  },
  {
    label: 'SQL Injection Fix (A03)',
    language: 'typescript',
    code: `// A03: Injection — SQL injection and parameterised query fix

// BAD: string concatenation → SQL injection
async function getUserBad(username: string) {
  const query = \`SELECT * FROM users WHERE username = '\${username}'\`;
  // Input: ' OR '1'='1 → returns ALL users
  return db.query(query);
}

// GOOD: parameterised query — input is data, not code
async function getUserGood(username: string) {
  return db.query('SELECT * FROM users WHERE username = $1', [username]);
  // Input is treated as a literal value, not SQL
}

// GOOD: ORM with proper parameter binding (TypeORM / Prisma)
// TypeORM
const user = await userRepo.findOne({ where: { username } }); // safe

// Prisma
const user = await prisma.user.findFirst({ where: { username } }); // safe

// DANGEROUS: raw SQL in ORM — still needs parameters
const user = await dataSource.query(
  'SELECT * FROM users WHERE username = $1', // parameterised
  [username]  // NOT \`...WHERE username = '\${username}'\`
);`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Trusting client-supplied IDs for access control (IDOR)',
    wrong: `GET /api/documents/42 → return document 42 if any user is logged in`,
    right: `GET /api/documents/42 → return document 42 ONLY if req.user owns document 42`,
    explanation: 'IDOR (A01) is the #1 OWASP risk. Checking "is the user logged in?" is authentication. Checking "does this user own this specific object?" is authorisation. Always do both.',
  },
  {
    title: 'Concatenating user input into SQL strings',
    wrong: `db.query("SELECT * FROM users WHERE id = " + req.params.id)`,
    right: `db.query('SELECT * FROM users WHERE id = $1', [req.params.id])`,
    explanation: 'String concatenation into SQL allows injection attacks (A03). A parameter (`$1`) is always treated as data — the database never executes it as SQL code.',
  },
  {
    title: 'Returning verbose error messages in production',
    wrong: `res.status(500).json({ error: err.stack })  // leaks file paths, table names, library versions`,
    right: `res.status(500).json({ error: 'Internal server error', id: correlationId })`,
    explanation: 'Stack traces reveal internal architecture — table names, ORM queries, file paths, library versions. Log the full error server-side; return only a correlation ID to the client.',
  },
  {
    title: 'Not logging authentication failures',
    wrong: `// Login fails → just return 401, move on`,
    right: `// Log failure with IP, username attempted, timestamp
logger.warn({ event: 'login_failed', ip: req.ip, username: req.body.username });`,
    explanation: 'Without logging auth failures (A09), credential stuffing attacks are invisible. Log enough to detect patterns (5 failures in 60 seconds from one IP) and trigger alerts.',
  },
];

const challenge: Challenge = {
  title: 'OWASP Vulnerability Detector',
  language: 'typescript',
  description: `Write a function analyseRequest(query: string, userId: string, resourceOwnerId: string) that detects two OWASP risks:
1. SQL Injection (A03): return 'INJECTION' if query contains any of: --, ;, 'OR', UNION, DROP, DELETE, INSERT
2. IDOR (A01): return 'IDOR' if userId !== resourceOwnerId
3. Return 'SAFE' if neither risk is detected.`,
  hints: [
    'Check for SQL injection patterns case-insensitively',
    'IDOR check is a simple string comparison',
    'Check injection first, then IDOR',
  ],
  starterCode: `function analyseRequest(query: string, userId: string, resourceOwnerId: string): string {
  // TODO: check for SQL injection patterns and IDOR
  return 'SAFE';
}`,
  solution: `function analyseRequest(query: string, userId: string, resourceOwnerId: string): string {
  const INJECTION_PATTERNS = ['--', ';', "'or", 'union', 'drop', 'delete', 'insert'];
  const lowerQuery = query.toLowerCase();

  if (INJECTION_PATTERNS.some(p => lowerQuery.includes(p))) {
    return 'INJECTION';
  }

  if (userId !== resourceOwnerId) {
    return 'IDOR';
  }

  return 'SAFE';
}

console.log(analyseRequest("SELECT * FROM users WHERE id = '1' OR '1'='1'", 'u1', 'u1'));  // INJECTION
console.log(analyseRequest('SELECT name FROM users WHERE id = 42', 'u1', 'u2'));           // IDOR
console.log(analyseRequest('SELECT name FROM users WHERE id = 42', 'u1', 'u1'));           // SAFE`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which OWASP Top 10 risk is most commonly found in tested applications (2021 edition)?',
    options: [
      'A03 Injection',
      'A01 Broken Access Control',
      'A02 Cryptographic Failures',
      'A07 Identification & Authentication Failures',
    ],
    answer: 1,
    explanation: 'A01 Broken Access Control moved to #1 in 2021 (previously #5), found in 94% of applications tested. Missing authorisation checks, IDOR, and privilege escalation are the most common manifestations.',
  },
  {
    q: 'A user changes a URL from /api/invoices/100 to /api/invoices/101 and sees another user\'s invoice. Which OWASP risk is this?',
    options: [
      'A03 Injection',
      'A02 Cryptographic Failures',
      'A01 Broken Access Control (IDOR)',
      'A05 Security Misconfiguration',
    ],
    answer: 2,
    explanation: 'This is an IDOR (Insecure Direct Object Reference) vulnerability under A01 Broken Access Control. The application returns data based on the ID in the URL without verifying the requesting user owns that resource.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between A01 Broken Access Control and A07 Authentication Failures?',
    a: 'A07 Authentication Failures are about verifying <strong>who you are</strong> — weak passwords, missing MFA, session fixation. A01 Broken Access Control is about what you are allowed to do <em>after</em> authentication — missing ownership checks, IDOR, privilege escalation. Both must be fixed independently.',
  },
  {
    q: 'Why did Injection drop from #1 to #3 in OWASP 2021?',
    a: 'Modern frameworks (ORMs like Hibernate, Entity Framework, Prisma) use parameterised queries by default, reducing raw SQL injection incidence. However, injection is still common in: raw SQL queries in ORMs, OS command execution, LDAP queries, NoSQL operators, and template engines. The category expanded to include all injection types, not just SQL.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'OWASP Top 10 lists the most critical web application security risks — A01 (access control), A02 (crypto), A03 (injection), and A07 (auth failures) are the must-know four.',
  mustKnow: [
    'A01 Broken Access Control: check ownership on every object read/write, not just login status',
    'A02 Crypto Failures: TLS for transit, AES-256-GCM for rest, Argon2id for passwords',
    'A03 Injection: parameterised queries always — never concatenate user input into SQL',
    'A05 Misconfiguration: remove defaults, disable unused features, scan IaC',
    'A07 Auth Failures: rate-limit logins, add MFA, regenerate session ID on login',
    'A09 Logging Failures: log auth events and access failures; alert on anomalies',
  ],
  interviewFocus: [
    'What is IDOR and how do you prevent it? (A01)',
    'How does a parameterised query prevent SQL injection? (A03)',
    'Name three signs of A05 Security Misconfiguration',
  ],
};

@Component({
  selector: 'app-sec-owasp-top-10',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './owasp-top-10.html',
  styleUrl: './owasp-top-10.scss',
})
export class SecOwaspTop10 {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
