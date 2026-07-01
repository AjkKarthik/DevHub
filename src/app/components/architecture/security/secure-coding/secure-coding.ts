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
  { q: 'What is a time-of-check to time-of-use (TOCTOU) race condition vulnerability?', options: ['A performance issue where security checks are done too early', 'A vulnerability where the state of a resource changes between when it is checked and when it is used, allowing an attacker to exploit the gap', 'A timing attack on cryptographic operations that leaks key bits', 'A concurrency issue where multiple threads try to acquire the same lock'], answer: 1, explanation: 'TOCTOU: the application checks a condition (does this file exist? does the user have permission?), and between the check and the use, an attacker changes the state. Classic example: check if /tmp/file exists and is safe -> attacker replaces /tmp/file with a symlink to /etc/passwd -> application reads the attacker-chosen file. Prevention: use atomic operations that combine check and use (O_EXCL flag with file creation). Use advisory locks (flock) that prevent another process from modifying the file during the operation. Validate permissions using the real UID (access()) is vulnerable; use the effective UID with the real file operations. In concurrent code: use database transactions or optimistic locking to prevent race conditions on shared data.' },
  { q: 'What is a path traversal attack and how do you prevent it?', options: ['An attack that traverses the network path between client and server to intercept data', 'An attack where user-controlled input manipulates file path construction to access files outside the intended directory (e.g., ../../etc/passwd)', 'An attack that exploits directory listing to enumerate all files in a web server directory', 'A SQL injection variant targeting file-based databases'], answer: 1, explanation: 'Path traversal: user input controls part of a file path. The application reads files based on user-provided filenames. Input: ../../etc/passwd navigates up the directory tree to access system files. URL-encoded variants: %2e%2e%2f. Double-encoding: %252e%252e%252f. Prevention: validate the resolved path against an allowlist of permitted base directories: resolve Path.GetFullPath(join(baseDir, userInput)). Check that it starts with the expected base directory string. Reject if the normalized path escapes the base directory. Never pass user input directly to file system APIs. Use chroot jails or containers to limit the file system accessible to the application. Prefer serving files from a CDN or object store that does not expose the raw file path.' },
  { q: 'What is improper error handling and what security information can it leak?', options: ['Returning HTTP 500 instead of HTTP 400 for client errors', 'Error messages or exceptions returned to clients that reveal internal implementation details: stack traces, SQL queries, server software versions, or internal network topology', 'Not logging application errors, causing difficulty in debugging', 'Handling only expected errors while letting unexpected exceptions crash the server'], answer: 1, explanation: 'Information disclosure via error handling: stack traces reveal framework, class names, file paths, and line numbers — useful for attackers building exploits. SQL error messages reveal table names, column names, and query structure — enabling SQL injection tuning. Server version headers in error pages reveal software versions (identify known CVEs). Internal IP addresses in connection error messages reveal internal network topology. Remediation: never return detailed error messages to clients in production. Log full details internally (structured logging). Return generic error messages to clients: something went wrong with a correlation ID for support. Hide version information: Server: header, X-Powered-By headers, HTML generator meta tags. Test: ensure development-mode error handling is disabled in production.' },
  { q: 'When is a denylist actually necessary even in a codebase that otherwise follows allowlist-first input validation?', options: ['Never — allowlists should completely replace denylists in all situations', 'When the valid input space is genuinely too broad to enumerate as a pattern (e.g. free-text fields like a bio or comment) — here you cannot allowlist the content itself, so a denylist/blocklist approach (or contextual output encoding) is layered on top to catch known-dangerous patterns like script tags, while still allowlisting structural constraints (length, encoding, character set)', 'Denylists should be used whenever performance matters more than security', 'Denylists are required for numeric fields but never for text fields'], answer: 1, explanation: 'Allowlists work cleanly when the set of valid values has a definable structure (a username matching a character-set pattern, a UUID format, an enum of valid statuses) — but genuinely open-ended content like a user bio or a support ticket description cannot be reduced to a simple accept-pattern without also rejecting huge amounts of legitimate input. For these truly free-form fields, the practical defense shifts to output encoding (never trust the input\'s safety at all; instead ensure it can never execute wherever it\'s rendered) supplemented by narrower denylist-style checks for specific known-dangerous constructs, rather than trying to force an allowlist onto content that has no enumerable "good" shape.' },
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
  { q: 'What is memory safety and how do memory-unsafe languages introduce vulnerabilities?', a: 'Memory safety: a program can only access memory it has allocated and initialized. Memory-unsafe languages (C, C++): buffer overflow: writing beyond the end of an allocated buffer overwrites adjacent memory, potentially overwriting return addresses (code execution) or data structures. Use-after-free: accessing memory after it has been freed; the freed memory may be reallocated for another purpose, leading to type confusion or control flow hijacking. Integer overflow: integer arithmetic wraps around, causing buffer allocation to be smaller than expected. Null pointer dereference: dereferencing a null pointer causes a crash or, in specific configurations, can be exploited. Memory-safe languages (Rust, Go, Java, C#): the language runtime or type system prevents these classes of bugs. Rust uses ownership and borrow checking at compile time; Go and Java use garbage collection. Microsoft and Google report that 70% of their security CVEs are memory safety bugs.' },
  { q: 'What is secure defaults and how does it relate to the principle of fail-secure?', a: 'Secure defaults: the default configuration of a system is secure without additional hardening. Users must explicitly opt into less-secure configurations. Examples: new database accounts have no permissions by default (grant explicitly needed). New API endpoints require authentication by default (opt-out is disabled). File uploads are rejected by default; only explicitly allowed file types pass. HttpOnly and Secure flags are set on cookies by default in the framework. Password fields use bcrypt hashing by default, not MD5. Fail-secure: when the system encounters an unexpected error or edge case, it defaults to the more secure behavior. An authorization check that throws an exception should deny access, not allow it. A parser that encounters malformed input should reject the input, not process partial data. Secure defaults reduce the chance of configuration errors creating vulnerabilities.' },
  { q: 'What is output encoding and how does it prevent injection attacks?', a: 'Output encoding: transform data so that it is rendered as data (not executable code) in the destination context. Context-specific encoding: HTML encoding (data in HTML body): encode <, >, &, quotes. <script> becomes &lt;script&gt;, which renders as text, not HTML. HTML attribute encoding (data in HTML attributes): encode additional characters including spaces and quotes. JavaScript encoding (data in JavaScript strings): encode quotes, backslashes, and non-alphanumeric characters. URL encoding (data in URLs): encode special characters as percent-encoded values. SQL parameterization (not encoding but a similar principle): the database driver handles escaping. Encoding prevents XSS: even if an attacker submits <script>alert(1)</script>, the HTML encoder converts it to displayable text. The key insight: encoding must match the output context. HTML encoding data placed in a JavaScript string context does not prevent XSS.' },
  { q: 'What is secure code review and what automated tools assist with it?', a: 'Secure code review: reviewing source code with a security focus to identify vulnerabilities before deployment. Manual review focus areas: authorization checks on all sensitive operations. Input validation at trust boundaries. Cryptographic implementation correctness. Error handling and information disclosure. Secrets in code. Authentication flows. Automated SAST (Static Application Security Testing) tools: Semgrep (configurable rules, supports many languages). SonarQube (code quality + security rules). Checkmarx, Veracode (commercial). GitHub CodeQL (semantic analysis, finds complex vulnerability patterns). DAST (Dynamic Application Security Testing): OWASP ZAP, Burp Suite (test the running application). SCA (Software Composition Analysis): Snyk, Dependabot (scan dependencies for CVEs). Integrate into CI: SAST runs on every pull request. DAST runs against a staging environment. SCA alerts on dependency CVEs. Manual review for high-risk features (authentication, payment, data export).' },
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
