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
  { name: 'Input Validation',    type: 'keyword', desc: 'Validate all input at trust boundaries — allowlist preferred over denylist.' },
  { name: 'Output Encoding',     type: 'keyword', desc: 'Encode output for the target context (HTML, URL, JS) to prevent injection.' },
  { name: 'Fail Secure',         type: 'keyword', desc: 'On error, default to the secure state — deny access rather than allow it.' },
  { name: 'Parameterised Queries', type: 'keyword', desc: 'Never concatenate user input into SQL — always use prepared statements.' },
  { name: 'Secure Defaults',     type: 'keyword', desc: 'Ship with security enabled by default — users should opt out, not opt in.' },
  { name: 'Defence in Depth',    type: 'keyword', desc: 'Validate at multiple layers — do not rely on a single control catching everything.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Input Validation — Never Trust Input',
    points: [
      'Every piece of data entering the system from outside (user input, query params, headers, files, external APIs) must be validated.',
      'Allowlist (whitelist) validation: define exactly what is acceptable — reject everything else. Safer than denylist.',
      'Denylist (blacklist) validation: define what is forbidden — attackers find ways around it. Use as a supplement, not the primary control.',
      'Validate type, length, format, range, and character set. A postcode field should only accept letters, numbers, and spaces up to 10 chars.',
      'Validate at every trust boundary — even internal service calls if the calling service could be compromised.',
    ],
  },
  {
    heading: 'Output Encoding',
    points: [
      'Data displayed to users must be encoded for the output context to prevent injection into the browser.',
      'HTML context: encode `<` as `&lt;`, `>` as `&gt;`, `"` as `&quot;`, `&` as `&amp;`.',
      'JavaScript context: escape characters that break out of JS strings — `"`, `\'`, `\\`, newlines.',
      'URL context: percent-encode non-safe characters — `encodeURIComponent()` in JavaScript.',
      'Modern frameworks (React, Angular, Vue) auto-escape template bindings — the risk is bypassing this (dangerouslySetInnerHTML, innerHTML binding, [innerHTML]).',
    ],
  },
  {
    heading: 'Fail Secure',
    points: [
      'When an error occurs, the system should default to the safe state — typically deny access or show nothing sensitive.',
      'Never catch an exception and silently continue with a partially authorised state.',
      'Exception in authorisation check? Deny, log, and return 500 — do not grant access because the check failed.',
      'Missing configuration value? Fail with an error — do not fall back to an insecure default mode.',
      'Fail-open is the opposite: if authentication breaks, all users are let through. This is almost always wrong.',
    ],
  },
  {
    heading: 'Secure Error Handling',
    points: [
      'Never return stack traces, database errors, or file paths to clients — these reveal internal architecture.',
      'Return generic error messages with a correlation ID: "An error occurred. Reference: abc-123".',
      'Log full error details server-side with context (user ID, request ID, stack trace) for debugging.',
      'Distinguish between 4xx (client error, user can act) and 5xx (server error, user should retry or contact support).',
      'Error messages in login forms: "Invalid email or password" — not "Email not found" (reveals valid emails to attackers).',
    ],
  },
  {
    heading: 'Secure Dependencies & Supply Chain',
    points: [
      'Third-party dependencies are the most common attack vector in modern supply chain attacks.',
      'Pin dependency versions (lock files); never use `*` or `latest` in production.',
      'Run `npm audit`, `dotnet list package --vulnerable`, or Snyk/Dependabot in CI to catch known CVEs.',
      'Prefer well-maintained, widely used libraries over obscure ones. Check last commit date and open security issues.',
      'Generate an SBOM (Software Bill of Materials) for production builds — required for compliance and incident response.',
    ],
  },
  {
    heading: 'Code Review for Security',
    points: [
      'Security code review focuses on: data flow from input to output, authorisation checks, cryptography usage, error handling, and logging.',
      'Look for: string concatenation into queries or shell commands, hardcoded credentials, disabled SSL certificate validation, use of eval().',
      'Static analysis tools (Semgrep, CodeQL) automate pattern detection in CI — catch issues before code review.',
      'Security review checklist per PR: Are all inputs validated? Are queries parameterised? Are errors handled without leaking info? Are secrets from environment, not code?',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Validation & Encoding',
    language: 'typescript',
    code: `import { z } from 'zod';
import he from 'he'; // HTML encoding library

// ── Input Validation ─────────────────────────────────────────────────────────
// Allowlist validation schema
const ProductSchema = z.object({
  name:     z.string().trim().min(1).max(200).regex(/^[a-zA-Z0-9 \\-_,.']+$/), // allowlist chars
  price:    z.number().positive().max(999_999),
  category: z.enum(['electronics', 'books', 'clothing', 'home']), // strict enum
  quantity: z.number().int().min(0).max(10_000),
});

function createProduct(input: unknown) {
  const result = ProductSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(result.error.flatten());
  }
  return result.data; // fully typed and validated
}

// ── Output Encoding ──────────────────────────────────────────────────────────
// For contexts where you MUST render HTML (rare — avoid if possible)
function renderUserComment(userInput: string): string {
  // he.encode() converts all special chars to HTML entities
  return \`<p>\${he.encode(userInput)}</p>\`;
}

// Angular: {{ value }} is auto-escaped — use [innerHTML] ONLY with sanitization
// React: {value} is auto-escaped — dangerouslySetInnerHTML requires DOMPurify

// ── Fail Secure ──────────────────────────────────────────────────────────────
async function getSecureResource(userId: string, resourceId: string) {
  let authorized = false;
  try {
    authorized = await checkAuthorization(userId, resourceId);
  } catch (err) {
    // Authorization check failed — DENY by default, do not allow access
    logger.error({ event: 'auth_check_failed', userId, resourceId, err });
    throw new ForbiddenError('Access check failed'); // not ForbiddenError(err.message)!
  }
  if (!authorized) throw new ForbiddenError('Not authorized');
  return getResource(resourceId);
}`,
  },
  {
    label: 'Secure Error Handling',
    language: 'typescript',
    code: `import { randomUUID } from 'crypto';

// ── WRONG: leaking internals ─────────────────────────────────────────────────
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    error: err.message,  // "Cannot read property 'id' of null at /app/services/user.ts:42"
    stack: err.stack,    // NEVER send stack traces to clients
  });
});

// ── GOOD: generic client message + server-side detail ────────────────────────
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const correlationId = randomUUID();

  // Log full details server-side
  logger.error({
    correlationId,
    error: err.message,
    stack: err.stack,
    url: req.url,
    userId: req.user?.id,
  });

  // Return generic message to client
  const status = err instanceof AppError ? err.statusCode : 500;
  res.status(status).json({
    error:  status < 500 ? err.message : 'An unexpected error occurred',
    ref:    correlationId, // user can report this to support
  });
});

// ── Authentication errors: don't reveal which part failed ────────────────────
// BAD
if (!user) return res.status(401).json({ error: 'Email not found' });
if (!valid) return res.status(401).json({ error: 'Wrong password' });

// GOOD — attacker cannot enumerate valid emails
if (!user || !valid) return res.status(401).json({ error: 'Invalid email or password' });`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using denylist instead of allowlist for validation',
    wrong: `// Block known bad chars — attacker finds encoding bypass
if (input.includes('<') || input.includes('>')) reject();`,
    right: `// Only allow known good chars — robust against encoding tricks
if (!/^[a-zA-Z0-9 ,.'-]{1,100}$/.test(input)) reject();`,
    explanation: 'Denylists enumerate the bad; attackers find what you missed. Allowlists define exactly what is accepted — everything else is rejected. Allowlist validation is almost always the right choice.',
  },
  {
    title: 'Catching exceptions and silently continuing (fail-open)',
    wrong: `try {
  await authorise(user, resource);
} catch (e) {
  // Auth service is down — just let them through
  console.log('Auth failed:', e);
}`,
    right: `try {
  await authorise(user, resource);
} catch (e) {
  logger.error({ event: 'auth_error', e });
  throw new ForbiddenError('Could not verify authorisation');
}`,
    explanation: 'Fail-open means errors grant access instead of denying it. This is exactly backwards. If the authorisation check fails for any reason, deny access and surface an error. The safe default is always deny.',
  },
  {
    title: 'Hardcoding secrets in source code',
    wrong: `const apiKey = 'sk-prod-a1b2c3d4e5f6...';  // checked into git!`,
    right: `const apiKey = process.env.API_KEY; // from environment variables or secrets manager
if (!apiKey) throw new Error('API_KEY environment variable is required');`,
    explanation: 'Secrets in source code are permanently exposed — even if removed later, git history retains them. Every developer, CI system, and fork has access. Use environment variables, secrets managers (Vault, AWS Secrets Manager, Azure Key Vault), or .env files excluded from version control.',
  },
  {
    title: 'Logging sensitive data for debugging',
    wrong: `logger.debug('Login request:', req.body);
// Logs: { username: 'alice', password: 'P@ssw0rd!' }`,
    right: `logger.debug('Login attempt for user:', req.body.username);
// Never log passwords, tokens, card numbers, SSNs`,
    explanation: 'Logs are shipped to aggregators (Datadog, Splunk), stored for months, and accessed by many people. A single debug log line with a password creates a data breach. Log event names and safe identifiers — never sensitive values.',
  },
];

const challenge: Challenge = {
  title: 'Input Sanitiser',
  language: 'typescript',
  description: `Implement sanitiseInput(input: string, maxLength: number): string that:
1. Trims whitespace
2. Truncates to maxLength characters
3. Removes HTML special characters (replace <, >, ", ', & with safe equivalents: &lt; &gt; &quot; &#39; &amp;)
4. Returns the sanitised string`,
  hints: [
    'Chain .trim() first, then .substring()',
    'Use .replace() with a regex for special chars',
    'Map each char to its HTML entity equivalent',
  ],
  starterCode: `function sanitiseInput(input: string, maxLength: number): string {
  // TODO: trim, truncate, encode HTML special chars
  return input;
}`,
  solution: `function sanitiseInput(input: string, maxLength: number): string {
  const HTML_ENTITIES: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[&<>"']/g, ch => HTML_ENTITIES[ch]);
}

console.log(sanitiseInput('<script>alert("xss")</script>', 50));
// &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;

console.log(sanitiseInput('  Hello World  ', 5));
// Hello`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which validation approach is more secure: allowlist or denylist?',
    options: [
      'Denylist — it explicitly blocks known malicious input',
      'Allowlist — it only permits known good input and rejects everything else',
      'They are equally secure when implemented correctly',
      'Denylist — it is easier to maintain',
    ],
    answer: 1,
    explanation: 'Allowlists (permit known good) are stronger than denylists (block known bad). Attackers find encoding tricks and bypass methods to evade denylists. An allowlist rejects everything not explicitly allowed — a much smaller, well-defined set.',
  },
  {
    q: 'An authentication service throws an exception. The application catches it and grants access anyway. This violates which principle?',
    options: ['Least privilege', 'Fail secure', 'Defence-in-depth', 'Non-repudiation'],
    answer: 1,
    explanation: '"Fail secure" means the system defaults to the safe (denied) state when errors occur. Catching an auth exception and granting access is "fail-open" — the opposite and extremely dangerous. Always deny on error.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between input validation and output encoding?',
    a: '<strong>Input validation</strong> happens at the boundary where data enters the system — reject data that does not meet your schema (wrong type, too long, bad characters). <strong>Output encoding</strong> happens when displaying data — convert special characters to their safe representation for the output context (HTML entity encoding for HTML, percent-encoding for URLs). Both are required: validation limits what enters, encoding prevents injection when data is displayed.',
  },
  {
    q: 'What does "secure by default" mean in practice?',
    a: 'Features and configurations that could expose risk are disabled by default. Users must explicitly opt into less-secure settings (if allowed at all). Examples: HTTPS enforced by default, debug mode OFF, admin accounts disabled until configured, MFA required unless explicitly disabled, API rate limiting on by default. The opposite ("insecure by default, secure by configuration") means security depends on every deployer getting the configuration right — a fragile model.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Secure coding practice: validate all input at trust boundaries with allowlists, encode all output for its context, fail securely (deny on error), and never hardcode secrets.',
  mustKnow: [
    'Allowlist > denylist: only permit known good input; reject everything else',
    'Output encoding: HTML-encode, URL-encode, JS-escape — context determines the method',
    'Fail secure: on error, default to deny — never fail-open',
    'Generic error messages to clients; detailed logging server-side',
    'Never hardcode secrets: use environment variables or secrets managers',
    'Log events (what happened), not values (what the data contained)',
  ],
  interviewFocus: [
    'Why is allowlist validation stronger than denylist?',
    'What is fail-secure vs fail-open with an example?',
    'How should authentication errors be communicated to prevent user enumeration?',
  ],
};

@Component({
  selector: 'app-sec-secure-coding',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './secure-coding.html',
  styleUrl: './secure-coding.scss',
})
export class SecSecureCoding {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
