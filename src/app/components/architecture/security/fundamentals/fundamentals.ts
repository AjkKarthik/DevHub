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
  { name: 'CIA Triad',          type: 'keyword', desc: 'Confidentiality, Integrity, Availability — the three core security goals every control maps to.' },
  { name: 'Defence-in-Depth',   type: 'keyword', desc: 'Multiple independent security layers so no single failure compromises the system.' },
  { name: 'Least Privilege',    type: 'keyword', desc: 'Every principal gets only the minimum permissions required for their task.' },
  { name: 'Zero Trust',         type: 'keyword', desc: 'Never trust, always verify — even requests from inside the network perimeter must authenticate.' },
  { name: 'Attack Surface',     type: 'keyword', desc: 'All entry points where an attacker could input data or extract information.' },
  { name: 'Threat Actor',       type: 'keyword', desc: 'Entity that performs an attack — insider, script kiddie, nation-state, or organised crime.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The CIA Triad',
    points: [
      'Confidentiality: only authorised parties can read data. Encryption, access controls, and compartmentalisation achieve this.',
      'Integrity: data is accurate and untampered. Hashing (HMAC, digital signatures), checksums, and audit logs protect integrity.',
      'Availability: systems are accessible when needed. Redundancy, backups, DDoS mitigation, and capacity planning protect availability.',
      'Security controls always trade off between the three — encrypting everything improves confidentiality but may hurt availability if keys are lost.',
      'A ransomware attack hits all three: it violates integrity (encrypts data), confidentiality (exfiltrates data), and availability (locks you out).',
    ],
  },
  {
    heading: 'Defence-in-Depth',
    points: [
      'Also called "layered security" — assume every individual control will fail and build multiple independent barriers.',
      'Example layers: network perimeter (firewall) → host (hardened OS) → application (input validation) → data (encryption at rest).',
      'If an attacker bypasses the network layer, they still face the application and data layers — no single bypass gives total access.',
      'Air gaps, segmentation, and zero-trust networking are all expressions of this principle.',
      'The opposite (single-layer "shell with no interior") is called "hard shell, soft interior" — common in legacy enterprise networks.',
    ],
  },
  {
    heading: 'Principle of Least Privilege',
    points: [
      'Every process, user, and service account should operate with only the permissions strictly necessary for its function.',
      'Lateral movement in attacks relies on over-permissioned accounts: compromise one, pivot everywhere.',
      'In cloud: use IAM roles scoped to specific resources; avoid wildcard (*) actions.',
      'In databases: application accounts should SELECT/INSERT/UPDATE only — never DROP, GRANT, or xp_cmdshell.',
      'Temporary elevation (sudo, JIT access) is better than persistent admin rights — auto-expire after the task.',
    ],
  },
  {
    heading: 'Zero Trust Architecture',
    points: [
      'Traditional perimeter security assumes everything inside the network is trustworthy — zero trust rejects this assumption.',
      'Core tenets: verify explicitly (authenticate and authorise every request), use least privilege access, assume breach (limit blast radius).',
      'Applies to users (MFA + device compliance), workloads (mTLS between services), and data (classify and protect at the data layer).',
      'Microsoft, Google, and NIST have published zero trust frameworks — NIST SP 800-207 is the reference architecture.',
      'Implementation: identity provider (Azure AD, Okta) + conditional access + network micro-segmentation + endpoint detection.',
    ],
  },
  {
    heading: 'Attack Surface & Threat Actors',
    points: [
      'Attack surface is everything an attacker can reach: network ports, APIs, file uploads, user inputs, third-party libraries, employee access.',
      'Reduce attack surface by disabling unused features, closing open ports, removing default credentials, and minimising exposed APIs.',
      'Threat actors differ in capability and motivation: script kiddies (tools, no skill), opportunists (scan for known vulns), nation-states (patience + resources).',
      'Understand your threat model: a personal blog and a banking app face different adversaries and need different controls.',
      'Bug bounty programs, penetration testing, and red team exercises help discover surface area you did not know existed.',
    ],
  },
  {
    heading: 'Security as a Development Practice',
    points: [
      'Shift-left security: find and fix vulnerabilities during design and development, not after deployment.',
      'SAST (Static Application Security Testing) — Semgrep, CodeQL — analyses source code for patterns like SQL concatenation.',
      'SCA (Software Composition Analysis) — Snyk, Dependabot — finds known CVEs in third-party dependencies.',
      'DAST (Dynamic Application Security Testing) — OWASP ZAP, Burp Suite — probes a running app like an attacker would.',
      'Threat modelling at design time (STRIDE) is the cheapest way to find architectural flaws before a line of code is written.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Input Validation',
    language: 'typescript',
    code: `// Never trust input — validate at every trust boundary
// BAD: assume client sends valid data
app.post('/user', (req, res) => {
  const { email, age } = req.body; // could be anything!
  db.query(\`INSERT INTO users VALUES ('\${email}', \${age})\`); // SQL injection!
});

// GOOD: validate and sanitise at the boundary
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email().max(254),
  age:   z.number().int().min(0).max(150),
  name:  z.string().trim().min(1).max(100),
});

app.post('/user', async (req, res) => {
  const result = UserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  const { email, age, name } = result.data; // typed and validated

  // Use parameterised queries — never string concat
  await db.query('INSERT INTO users (email, age, name) VALUES ($1, $2, $3)',
    [email, age, name]);
  res.status(201).json({ message: 'Created' });
});`,
  },
  {
    label: 'Least Privilege (IAM)',
    language: 'typescript',
    code: `// AWS IAM — least privilege for a Lambda that reads from S3 and writes to DynamoDB
// BAD: wildcard permissions
const badPolicy = {
  Statement: [{
    Effect: 'Allow',
    Action: '*',         // full access to everything
    Resource: '*',
  }],
};

// GOOD: scoped to exactly what's needed
const goodPolicy = {
  Statement: [
    {
      Effect: 'Allow',
      Action: ['s3:GetObject'],          // read only
      Resource: 'arn:aws:s3:::my-bucket/uploads/*',  // specific prefix
    },
    {
      Effect: 'Allow',
      Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],  // write only
      Resource: 'arn:aws:dynamodb:us-east-1:123:table/Orders',  // one table
    },
  ],
};

// Application service accounts: read-only until write is proven necessary
// Database connection: grant SELECT on specific tables, not db_owner
// API keys: scope to minimum endpoints (read-only token for read operations)`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Confusing authentication with authorisation',
    wrong: `// Check if logged in → grant access
if (req.user) { return res.json(resource); }`,
    right: `// Check identity AND permission for THIS specific resource
if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
if (!req.user.roles.includes('admin')) return res.status(403).json({ error: 'Forbidden' });`,
    explanation: 'Authentication = "who are you?" Authorisation = "what can you do?" A logged-in user is authenticated but may not be authorised to access every resource. Always check both.',
  },
  {
    title: 'Security through obscurity as the primary control',
    wrong: `// Protect route by making the URL unpredictable
app.get('/admin-panel-xyz123', adminHandler); // "no one will guess this"`,
    right: `// Use real authentication — obscurity may supplement but never replace it
app.get('/admin', authenticate, authorise('admin'), adminHandler);`,
    explanation: 'Obscurity can be one layer in defence-in-depth, but it must not be the primary control. Attackers scan for admin routes, leaked URLs appear in logs, and a guessed URL bypasses all "protection".',
  },
  {
    title: 'Logging sensitive data',
    wrong: `console.log('Payment request:', JSON.stringify(req.body));
// Logs: { "cardNumber": "4111111111111111", "cvv": "123" }`,
    right: `console.log('Payment request for user:', req.user.id, 'amount:', req.body.amount);
// Never log PAN, CVV, passwords, tokens, or PII`,
    explanation: 'Logs are often aggregated to external systems (Datadog, Splunk) and retained for years. A single log line with a card number creates a PCI-DSS violation and a permanent breach record.',
  },
  {
    title: 'Using HTTP instead of HTTPS for any production traffic',
    wrong: `// Deploy to http://api.example.com
// "We'll add HTTPS later when it matters"`,
    right: `// Always HTTPS from day one — use Let's Encrypt (free, automated)
// Add HSTS header: Strict-Transport-Security: max-age=31536000; includeSubDomains`,
    explanation: 'HTTP exposes credentials, tokens, and data to anyone on the same network. "Adding HTTPS later" rarely happens before a breach. HTTPS is free with Let\'s Encrypt and takes minutes to set up.',
  },
];

const challenge: Challenge = {
  title: 'Rate Limiter Implementation',
  language: 'typescript',
  description: `Implement a simple in-memory rate limiter that limits a client to maxRequests per windowMs.
RateLimiter class has: isAllowed(clientId: string): boolean.
The limiter allows at most maxRequests within a sliding windowMs millisecond window.
If the limit is exceeded, return false.`,
  hints: [
    'Store timestamps of requests per client',
    'Filter out timestamps older than windowMs from now',
    'Compare remaining count against maxRequests',
  ],
  starterCode: `class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  isAllowed(clientId: string): boolean {
    // TODO: implement sliding window rate limiter
    return true;
  }
}`,
  solution: `class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  isAllowed(clientId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const timestamps = (this.requests.get(clientId) ?? [])
      .filter(t => t > windowStart); // keep only recent requests

    if (timestamps.length >= this.maxRequests) return false;

    timestamps.push(now);
    this.requests.set(clientId, timestamps);
    return true;
  }
}

const limiter = new RateLimiter(3, 1000); // 3 req per second
console.log(limiter.isAllowed('user-1')); // true
console.log(limiter.isAllowed('user-1')); // true
console.log(limiter.isAllowed('user-1')); // true
console.log(limiter.isAllowed('user-1')); // false — limit hit`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does the "I" in the CIA triad stand for, and what does it protect?',
    options: [
      'Isolation — prevents processes from accessing each other\'s memory',
      'Integrity — ensures data is accurate, complete, and untampered',
      'Identity — ensures only authenticated users access resources',
      'Idempotency — ensures operations produce the same result when repeated',
    ],
    answer: 1,
    explanation: 'Integrity ensures data has not been modified in an unauthorised way. HMAC, digital signatures, and checksums protect integrity. Without it, an attacker could modify financial transactions, configuration files, or audit logs without detection.',
  },
  {
    q: 'Which security principle states "every principal gets only the minimum permissions needed"?',
    options: [
      'Defence-in-depth',
      'Zero trust',
      'Least privilege',
      'Separation of duties',
    ],
    answer: 2,
    explanation: 'Least privilege limits the blast radius of a compromised account — an attacker can only do what the compromised principal was allowed to do. Over-permissioned accounts are the primary enabler of lateral movement in breaches.',
  },
  {
    q: 'A web application only has a firewall for security. This violates which principle?',
    options: [
      'Least privilege',
      'Non-repudiation',
      'Defence-in-depth',
      'Separation of duties',
    ],
    answer: 2,
    explanation: 'Defence-in-depth requires multiple independent security layers. A single firewall creates a "hard shell, soft interior" — if the firewall is bypassed (misconfiguration, VPN, insider threat), there are no remaining controls. Add application-level validation, data-layer encryption, and monitoring.',
  },
  { q: 'What is defense in depth and why is it a core security principle?', options: ['Using three layers of firewalls for maximum protection', 'Implementing multiple independent security controls so that the failure of any single control does not result in a complete security breach', 'Defending the network perimeter as the primary security layer', 'Using different vendors for each security control to prevent single-vendor vulnerabilities'], answer: 1, explanation: 'Defense in depth: layer multiple independent security controls. No single control is perfectly reliable; attackers will eventually bypass one layer. With defense in depth, compromising one control still leaves other controls protecting the asset. Example: web application security layers: WAF blocks known attack patterns. Input validation prevents injection. Parameterized queries prevent SQL injection at the database layer. Least privilege database accounts limit damage from SQL injection. Encryption at rest protects data if the database is directly accessed. This layered approach means an attacker must defeat all layers to achieve the worst-case outcome.' },
  { q: 'What is the security CIA triad and how are the three properties related?', options: ['Confidentiality, Integrity, Availability; each property is independent and must be maximized independently', 'Confidentiality (data is kept private), Integrity (data is accurate and untampered), Availability (systems are accessible); security controls often trade off between them', 'Certificate, Identity, Authentication; the three pillars of PKI', 'Compliance, Investigation, Audit; the three phases of security incident response'], answer: 1, explanation: 'CIA triad: Confidentiality — only authorized parties access data (encryption, access controls). Integrity — data is not modified without authorization (hashing, signatures, audit logs). Availability — systems are accessible when needed (redundancy, DDoS protection, backups). Security controls often involve trade-offs: stronger encryption (confidentiality) may reduce performance (availability). Strict access controls (confidentiality) may slow down workflows. Over-restricting access for confidentiality can reduce the ability to quickly respond to incidents (availability). Security design balances all three based on the threat model and business requirements.' },
  { q: 'What is a threat model and what four questions does STRIDE address?', options: ['A risk register of all known vulnerabilities in a system', 'A systematic analysis of what could go wrong in a system; STRIDE identifies Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege threats', 'A penetration testing methodology that covers six attack categories', 'A compliance framework mapping controls to regulatory requirements'], answer: 1, explanation: 'Threat modeling systematically identifies threats before building security controls. STRIDE (Kohnfelder and Garg): Spoofing (impersonating something or someone — mitigate: authentication). Tampering (modifying data — mitigate: integrity controls, signatures). Repudiation (denying an action — mitigate: audit logging, non-repudiation). Information Disclosure (exposing information to unauthorized parties — mitigate: encryption, access control). Denial of Service (making service unavailable — mitigate: rate limiting, redundancy). Elevation of Privilege (gaining capabilities beyond authorization — mitigate: least privilege, authorization checks). Threat modeling is done at design time, not after deployment.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between authentication and authorisation?',
    a: 'Authentication answers "who are you?" — verifying identity (password, biometric, certificate). Authorisation answers "what can you do?" — checking permissions after identity is established. A logged-in user (authenticated) may still be forbidden (not authorised) to access an admin panel. Both must be checked independently.',
  },
  {
    q: 'What is zero trust and why did it replace perimeter security?',
    a: 'Zero trust assumes no request is trustworthy by default — even requests from inside the corporate network. Traditional perimeter security (firewall + VPN = trusted) failed because: insider threats bypass the perimeter, supply chain attacks compromise trusted machines, and cloud/remote work dissolved the network boundary. Zero trust verifies identity, device health, and context for every request.',
  },
  {
    q: 'What is the attack surface and how do you reduce it?',
    a: 'The attack surface is every place an attacker can interact with a system: open ports, APIs, file uploads, user input fields, dependencies, employee accounts. Reduce it by: disabling unused features and ports, removing default credentials, minimising exposed API endpoints, keeping dependencies updated, and applying least privilege so compromised components have limited reach.',
  },
  { q: 'What is zero trust architecture and how does it differ from perimeter security?', a: 'Perimeter security (castle-and-moat model): trust everything inside the network perimeter; protect the perimeter. Once inside, users and systems are trusted. Problem: lateral movement — once an attacker breaches the perimeter, they can move freely inside. Zero trust: never trust, always verify. Assume breach at all times. Every request is authenticated, authorized, and encrypted regardless of whether it comes from inside or outside the corporate network. Verification applies to users, devices, and service-to-service calls. Least privilege: each request grants only the minimum access for the specific operation. Continuous monitoring: log and analyze all access for anomalies. Implemented via: identity-aware proxies, mutual TLS between services, strong device posture checking, and micro-segmentation.' },
  { q: 'What is the principle of fail secure and how does it differ from fail safe?', a: 'Fail safe: when a system fails, it defaults to an open or accessible state to maintain availability. Example: a door lock that defaults to unlocked on power failure for occupant safety. Fail secure: when a system fails, it defaults to a denied or restricted state to protect assets. Example: a firewall that blocks all traffic when its rules fail to load. In security systems: fail secure is the default preference. An authentication system that fails should deny access, not allow everyone in. Authorization middleware that throws an exception should return HTTP 403, not 200. A payment validation service that cannot reach the fraud detection API should halt the transaction, not approve it without fraud check. The choice depends on the threat model: some systems legitimately fail safe (e.g., physical safety exits).' },
  { q: 'What is the attack surface and how do you reduce it?', a: 'Attack surface: all the points where an attacker can try to enter or extract data from a system. Components of the attack surface: network interfaces exposed to untrusted networks. Authentication endpoints (login forms, API key entry points). Third-party dependencies that may have vulnerabilities. Administrative interfaces. Open ports and services. Input fields that accept user data. Attack surface reduction strategies: disable or remove unused features, ports, and services. Use allowlists (explicitly permit known-good inputs) rather than denylists. Run services with minimal permissions. Keep dependencies updated and minimal. Use network segmentation to isolate services. The smaller and more well-defined the attack surface, the easier it is to secure and monitor.' },
  { q: 'What is the concept of security by obscurity and why is it insufficient?', a: 'Security by obscurity: relying on secrecy of the design or implementation as a security control. Examples: using a non-standard port to hide an SSH server (security through obscurity). Keeping the source code secret and relying on attackers not knowing the API structure. Storing the database password in a predictably named file and hoping attackers do not find it. Insufficient because: obscurity is not reliable — source code gets leaked, ports get scanned, file paths get discovered through error messages. The Kerckhoffs principle: a cryptosystem should be secure even if everything about the system, except the key, is public knowledge. Security must hold assuming the attacker knows the system design. Obscurity can be an additional minor layer but never a primary defense.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Security fundamentals — CIA triad, defence-in-depth, least privilege, and zero trust — are the mental models that underpin every security decision.',
  mustKnow: [
    'CIA Triad: Confidentiality (encryption), Integrity (HMAC/signatures), Availability (redundancy)',
    'Defence-in-depth: multiple independent layers — assume each will fail',
    'Least privilege: minimum permissions for the task; limit lateral movement blast radius',
    'Zero trust: never trust, always verify — even internal traffic authenticates',
    'Shift-left: SAST, SCA, and threat modelling during development, not after deployment',
    'Authentication ≠ authorisation — check both independently on every request',
  ],
  interviewFocus: [
    'Explain CIA triad with a concrete ransomware attack example',
    'How does least privilege prevent lateral movement?',
    'What is zero trust and why did perimeter security fail?',
  ],
};

@Component({
  selector: 'app-sec-fundamentals',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss',
})
export class SecFundamentals {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
