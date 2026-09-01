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
  { name: 'Secret',         type: 'keyword', desc: 'Any sensitive value: API key, DB password, private key, signing secret, token.' },
  { name: 'Vault',          type: 'keyword', desc: 'HashiCorp Vault — centralised secrets store with dynamic secrets, leasing, and audit.' },
  { name: 'AWS Secrets Mgr', type: 'keyword', desc: 'AWS managed secrets store — rotation, versioning, IAM-controlled access.' },
  { name: 'Dynamic Secret', type: 'keyword', desc: 'Vault generates credentials on demand with a TTL — credentials revoked when TTL expires.' },
  { name: 'Secret Scanning', type: 'keyword', desc: 'Tool that detects secrets accidentally committed to git (GitGuardian, GitHub secret scanning).' },
  { name: 'Rotation',       type: 'keyword', desc: 'Replacing a secret on a schedule or after compromise — limits exposure window.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The Secrets Problem',
    points: [
      'Secrets are credentials that grant access: database passwords, API keys, TLS private keys, JWT signing secrets, OAuth client secrets.',
      'The most common secrets mismanagement: committing secrets to git. A public repo with a database password is an immediate breach. Even private repos accumulate risk — every contributor, CI system, and fork has access.',
      'GitHub automatically scans for common secret patterns (AWS keys, Stripe keys, GitHub tokens) and alerts maintainers. Attacker scanners do the same in seconds after a push.',
      'Rotation after a leak is necessary but insufficient — assume the secret was copied immediately. Rotate AND audit all access since the first possible exposure.',
    ],
  },
  {
    heading: 'Secret Storage Tiers',
    points: [
      'Development: `.env` files (never committed). Use `.gitignore` and `.env.example` (placeholder values only). `dotenv` loads them at runtime.',
      'CI/CD: environment variables in the platform\'s secret store (GitHub Actions Secrets, GitLab CI Variables). These are masked in logs and not exposed to fork PRs.',
      'Production: dedicated secrets manager — AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, or HashiCorp Vault. Fine-grained IAM access control and audit logging.',
      'Dynamic secrets (Vault): instead of storing a static DB password, Vault generates short-lived credentials on demand. When the lease expires, Vault revokes them. No static credential to steal.',
    ],
  },
  {
    heading: 'Secret Rotation',
    points: [
      'Rotate secrets on a schedule (90 days for low-value, 30 days for high-value, immediately on suspected compromise).',
      'AWS Secrets Manager and Vault can automate rotation with Lambda functions that update both the secret store and the target system (e.g., rotate an RDS password and update it in the DB simultaneously).',
      'Zero-downtime rotation: support two active versions simultaneously — old and new. After all services have reloaded the new version, revoke the old one.',
      'Rotation tracking: log every rotation with a timestamp. Alert if rotation has not occurred within the expected window.',
    ],
  },
  {
    heading: 'Secret Detection and Prevention',
    points: [
      'Pre-commit hooks: `git-secrets`, `detect-secrets`, `gitleaks` — scan staged changes for secret patterns before commit.',
      'CI pipeline scanning: run secret scanning on every PR. Block merge if secrets found. Use GitGuardian or GitHub Advanced Security.',
      'If a secret is found in git history: rotate it immediately (treat as compromised), then remove from history (`git filter-repo`). Purging history does not un-expose it to anyone who cloned the repo.',
      'Audit logs: every secret access should be logged with who, what, and when. Vault and cloud secret managers provide this natively.',
    ],
  },
  {
    heading: 'Secret Rotation and Lifecycle Management',
    points: [
      'Secrets should have a defined lifecycle, not exist indefinitely — regular rotation (changing a secret\'s value on a schedule, even without a known compromise) limits the window of exposure if a secret was leaked without anyone noticing.',
      'Automated rotation (supported by AWS Secrets Manager, HashiCorp Vault, Azure Key Vault) updates the secret value and notifies or directly reconfigures dependent services, avoiding the operational burden and error-proneness of manual rotation procedures.',
      'Short-lived, dynamically generated credentials (a database credential issued for a single hour, tied to a specific application instance) are a stronger pattern than long-lived static secrets — even if leaked, a short-lived credential is only useful to an attacker for a brief window.',
      'A secrets manager provides an audit trail of every access — critical for incident response, since knowing exactly which service or person accessed a specific secret and when is essential for scoping the blast radius of a suspected compromise.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'AWS Secrets Manager',
    language: 'typescript',
    code: `import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

// ── Fetch a secret at startup — cache in memory ──────────────────────────────
interface DbConfig { host: string; port: number; username: string; password: string; }

let cachedConfig: DbConfig | null = null;

async function getDbConfig(): Promise<DbConfig> {
  if (cachedConfig) return cachedConfig;

  const response = await client.send(new GetSecretValueCommand({
    SecretId: 'prod/myapp/database',
  }));

  cachedConfig = JSON.parse(response.SecretString!) as DbConfig;
  return cachedConfig;
}

// ── App startup ───────────────────────────────────────────────────────────────
// pool is declared at module scope (not inside main()) specifically
// because queryWithRetry() below needs to both READ and REASSIGN it --
// a local const inside main() would be out of scope entirely there.
let pool: Pool;

async function main() {
  const config = await getDbConfig();
  pool = new Pool({ ...config }); // DB connection with fetched credentials
  // ...
}

// ── Rotation support: re-fetch on auth failure ────────────────────────────────
async function queryWithRetry(sql: string, params: unknown[]) {
  try {
    return await pool.query(sql, params);
  } catch (err: any) {
    if (err.code === 'ECONNREFUSED' || err.message?.includes('password authentication failed')) {
      cachedConfig = null; // clear cache
      const newConfig = await getDbConfig(); // fetch new (rotated) credentials
      await pool.end();
      pool = new Pool({ ...newConfig });
      return pool.query(sql, params);
    }
    throw err;
  }
}`,
  },
  {
    label: 'Pre-commit Secret Detection',
    language: 'typescript',
    code: `// ── .gitignore — never commit these ─────────────────────────────────────────
// .env
// .env.local
// .env.production
// *.pem
// *.key
// secrets.json

// ── .env.example — commit this as documentation ──────────────────────────────
// DATABASE_URL=postgresql://user:password@localhost:5432/mydb
// JWT_SECRET=your-256-bit-secret-here
// AWS_ACCESS_KEY_ID=your-aws-key
// STRIPE_SECRET_KEY=sk_test_...

// ── Runtime: load env vars safely ────────────────────────────────────────────
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL:      z.string().url(),
  JWT_SECRET:        z.string().min(32),
  AWS_REGION:        z.string().default('us-east-1'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  NODE_ENV:          z.enum(['development', 'test', 'production']),
});

// Validates all required env vars at startup — fails fast with clear errors
const env = EnvSchema.parse(process.env);

export { env };

// ── Pre-commit hook setup (package.json) ──────────────────────────────────────
// "scripts": {
//   "prepare": "husky install"
// }
// .husky/pre-commit:
// #!/bin/sh
// npx detect-secrets-hook --baseline .secrets.baseline
// or: gitleaks protect --staged --redact`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Hardcoding secrets in source code',
    wrong: `const stripe = new Stripe('sk_live_abc123real_key_here'); // committed to git`,
    right: `const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!);
// .env file (not committed): STRIPE_SECRET_KEY=sk_live_abc123...`,
    explanation: 'Any secret in source code is exposed to everyone with repo access: developers, CI systems, code review tools, forks. It also persists in git history forever even after deletion. Always load secrets from environment variables or a secrets manager.',
  },
  {
    title: 'Using the same secret across all environments',
    wrong: `// Same JWT_SECRET in dev, staging, and production
JWT_SECRET=super-secret-key-shared-everywhere`,
    right: `# dev/.env
JWT_SECRET=dev-only-secret-not-important
# Production: stored in AWS Secrets Manager / Vault with a different, stronger value`,
    explanation: 'Sharing secrets across environments means a development machine compromise exposes production. Each environment (dev, staging, prod) must have independent, separately managed secrets. Dev secrets can be weak; prod secrets must be cryptographically strong and tightly controlled.',
  },
  {
    title: 'Logging secret values',
    wrong: `console.log('Connecting with config:', dbConfig); // logs password
logger.debug(req.body); // logs any submitted passwords or API keys`,
    right: `console.log('Connecting to DB:', { host: dbConfig.host, port: dbConfig.port }); // no password
logger.debug({ method: req.method, path: req.path }); // never log body`,
    explanation: 'Logs are often forwarded to log aggregation services (Datadog, Splunk, CloudWatch) with weaker access controls than production systems. Secrets in logs are available to anyone with log read access and are often retained for months.',
  },
  {
    title: 'Not scanning git history after a secret leak',
    wrong: `# Delete the file and commit — secret is still in git history
git rm secrets.json && git commit -m "remove secrets"`,
    right: `# 1. Rotate the secret IMMEDIATELY (it's already compromised)
# 2. Remove from history:
git filter-repo --path secrets.json --invert-paths
# 3. Force-push all branches (coordinate with team)
# 4. GitHub: contact support to clear cached views`,
    explanation: 'Deleting a file does not remove it from git history — `git log --all -- secrets.json` still shows the content. Everyone who cloned before the push has a copy. Rotate the secret immediately, then clean history with `git filter-repo`. Force-push all branches.',
  },
];

const challenge: Challenge = {
  title: 'Env Validator',
  language: 'typescript',
  description: `Implement validateEnv(env: Record<string, string | undefined>): { valid: boolean; missing: string[]; weak: string[] } that:
1. Checks required: DATABASE_URL, JWT_SECRET, NODE_ENV are present and non-empty
2. JWT_SECRET must be at least 32 characters (weak if shorter)
3. Returns missing: list of absent keys, weak: list of too-short secrets`,
  hints: [
    'Check presence and non-empty separately from length',
    'missing = absent or empty; weak = present but too short',
  ],
  starterCode: `function validateEnv(env: Record<string, string | undefined>): { valid: boolean; missing: string[]; weak: string[] } {
  const missing: string[] = [];
  const weak: string[] = [];
  // TODO
  return { valid: missing.length === 0 && weak.length === 0, missing, weak };
}`,
  solution: `function validateEnv(env: Record<string, string | undefined>): { valid: boolean; missing: string[]; weak: string[] } {
  const missing: string[] = [];
  const weak: string[] = [];
  const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'];
  for (const key of REQUIRED) {
    if (!env[key]) { missing.push(key); continue; }
    if (key === 'JWT_SECRET' && env[key]!.length < 32) weak.push(key);
  }
  return { valid: missing.length === 0 && weak.length === 0, missing, weak };
}
console.log(validateEnv({ DATABASE_URL: 'postgres://...', JWT_SECRET: 'short', NODE_ENV: 'production' }));
// { valid: false, missing: [], weak: ['JWT_SECRET'] }
console.log(validateEnv({ DATABASE_URL: 'postgres://...', JWT_SECRET: 'a'.repeat(32), NODE_ENV: 'production' }));
// { valid: true, missing: [], weak: [] }`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is a dynamic secret and why is it more secure than a static one?',
    options: [
      'A secret that changes based on the time of day',
      'A credential generated on-demand with a short TTL — automatically revoked when it expires; no static credential to steal',
      'A secret encrypted with a different key each time',
      'A randomly generated secret stored in environment variables',
    ],
    answer: 1,
    explanation: 'Vault dynamic secrets generate credentials on demand (e.g., a PostgreSQL username/password) with a lease TTL (e.g., 1 hour). When the TTL expires, Vault revokes the credentials at the database. There is no long-lived static password that could be stolen and reused indefinitely.',
  },
  {
    q: 'What must you do FIRST when you discover a secret has been committed to a public git repository?',
    options: [
      'Remove the file and push a fix commit',
      'Open a private issue to track the cleanup',
      'Rotate (invalidate) the secret immediately — treat it as compromised from the moment of first push',
      'Run git filter-repo to remove it from history',
    ],
    answer: 2,
    explanation: 'Rotation comes first. The moment a secret was committed to a public repo, scanners and bots may have already copied it. Rotation invalidates the old secret immediately. History cleanup is important but secondary — it does not un-expose to anyone who already cloned.',
  },
  { q: 'What happens to an application\'s active database connections if Vault revokes its dynamic credential\'s TTL while a long-running query is still in progress?', options: ['The query is automatically transferred to a new credential seamlessly', 'Behavior depends on the backend: revoking the database USER can terminate its existing sessions immediately (killing in-flight queries), so applications using dynamic secrets must handle credential renewal proactively (renewing the lease before expiry) rather than waiting for an active connection to fail', 'Vault always waits for all active queries to complete before revoking any credential', 'TTL expiry only prevents NEW connections; existing ones are permanently unaffected regardless of backend'], answer: 1, explanation: 'Because dynamic secrets have a real, finite TTL, an application must actively manage credential lifecycle — the standard pattern is to renew the lease well before expiry (Vault\'s renewal API extends the TTL without issuing a new credential) rather than letting a credential expire and reactively handling a failed connection. Some database backends terminate a revoked user\'s existing sessions immediately, which can abruptly kill in-flight queries if renewal was not handled proactively — this operational responsibility (renew-before-expiry, not renew-after-failure) is the main practical complexity dynamic secrets introduce compared to a static, never-expiring credential.' },
  { q: 'What is secret sprawl and what problems does it create?', options: ['A configuration management problem where secrets files grow too large to manage', 'The uncontrolled proliferation of secrets across many systems: environment variables, config files, git repos, CI systems, creating an unknown attack surface', 'When secrets are stored in too many encryption layers, making decryption slow', 'A CI/CD issue where secrets are passed through too many pipeline stages'], answer: 1, explanation: 'Secret sprawl: secrets proliferate across: git repositories (hardcoded API keys in config files, accidentally committed .env files). CI/CD systems (secrets stored in build system environment variables with loose access controls). Container images (secrets baked in during build). Developer laptops (local .env files with production credentials). Log files (secrets accidentally logged). Cloud metadata services. Problems: unknown blast radius when a secret is compromised (where is it used?). Difficulty rotating (do not know all places to update). Audit impossibility (no way to know who accessed or used a secret). Prevention: centralize secrets in a secrets manager. Scan for secrets in git history. Implement secrets scanning in CI. Never store secrets in container images.' },
  { q: 'How does Kubernetes handle secrets and what are its security limitations?', options: ['Kubernetes secrets are fully encrypted by default and cannot be accessed without the master key', 'Kubernetes secrets are base64-encoded (not encrypted) by default in etcd; they require etcd encryption-at-rest and strict RBAC to be secure', 'Kubernetes secrets are automatically rotated every 24 hours', 'Kubernetes secrets are only accessible to pods in the same namespace without additional configuration'], answer: 1, explanation: 'Kubernetes Secrets: stored as base64-encoded values in etcd. Base64 is encoding, NOT encryption. Anyone with etcd access can decode all secrets. Security requirements for Kubernetes secrets: etcd encryption at rest (configure the Kubernetes API server with an EncryptionConfiguration to use AES or KMS). Strict RBAC: limit get, list, watch permissions on secrets to only pods that need them. Audit logging on secret access. External secrets (preferred for production): use the External Secrets Operator to sync secrets from AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault into Kubernetes secrets. The secret values exist in the cluster only transiently, with the source of truth in the external vault.' },
  { q: 'What is a Vault transit engine and how does it implement encryption-as-a-service?', options: ['A Vault plugin that manages TLS certificates for transit (in-flight) data', 'A Vault service that performs encryption and decryption operations without exposing keys; applications submit data to encrypt and receive ciphertext without ever handling the encryption key', 'A feature that automatically rotates secrets as they transit between services', 'An HSM-based key storage solution built into Vault for high-security environments'], answer: 1, explanation: 'Vault Transit Engine: provides encryption-as-a-service. The application submits plaintext to Vault: POST /transit/encrypt/my-key with plaintext data. Vault returns a ciphertext. The application stores the ciphertext. The application submits ciphertext to Vault to decrypt when needed. The encryption keys never leave Vault. Benefits: application does not handle encryption keys (it just calls an API). Key rotation is built in: Vault maintains multiple key versions; old ciphertext can be decrypted with the older key version. Rewrap operation: re-encrypts data with the latest key version without the application ever seeing plaintext. Audit trail: Vault logs every encrypt/decrypt operation. Key policy: limit which applications can use which transit keys.' },
];

const qna: QnaItem[] = [
  {
    q: 'How should you store secrets for local development vs CI/CD vs production?',
    a: '<strong>Local development</strong>: <code>.env</code> file (listed in <code>.gitignore</code>). Use placeholder values where possible; use real dev-tier credentials (not production). <strong>CI/CD</strong>: platform secret stores (GitHub Actions Secrets, GitLab Variables) — masked in logs, not exposed to fork PRs. Inject as env vars at runtime. <strong>Production</strong>: secrets manager (AWS Secrets Manager, GCP Secret Manager, Vault). App fetches at startup or on demand. IAM-controlled access with audit logs. Never pass production secrets as CI env vars.',
  },
  {
    q: 'What is the difference between encryption at rest and secrets management?',
    a: '<strong>Encryption at rest</strong>: the data (DB rows, file system, backups) is encrypted when stored — protects against physical theft of storage. The encryption key is managed separately. <strong>Secrets management</strong>: managing the lifecycle of credentials (API keys, passwords, certs) — storage, access control, rotation, audit, revocation. A secrets manager stores secrets encrypted at rest AND provides access control and audit. Encryption at rest is a feature of the secrets manager\'s storage; secrets management is the broader practice of the credential lifecycle.',
  },
  { q: 'How should you rotate secrets without downtime?', a: 'Zero-downtime secret rotation requires the application to support reading the new secret before the old one is revoked. Rotation procedure: generate and store the new secret in the secrets manager alongside the old one (dual-secret period). Applications that reload secrets on interval or on request pick up the new secret automatically. Verify the new secret is working by checking application health after deployment or after the secret refresh interval. Revoke the old secret after all application instances have picked up the new one. For database credentials: create a new database user with the new password. Update the secrets manager with the new credentials. Wait for rolling deployment or secret refresh. Drop the old database user. Automation: tools like Vault and AWS Secrets Manager support automatic rotation with Lambda functions that rotate secrets and notify dependent systems. Application support: applications should reload secrets from the secrets manager on TTL expiry, not cache them indefinitely.' },
  { q: 'What are the security risks of environment variables for secrets and when are they acceptable?', a: 'Environment variables are a common but imperfect secrets transport mechanism. Risks: child processes inherit environment variables unless explicitly sanitized. Environment variables may be logged in crash dumps, error reports, or container inspection output (docker inspect shows environment). In serverless or orchestrated environments, environment variables may be logged or accessible to the orchestration system. Cloud providers may store environment variables in their control plane. Process listing: environment variables are visible in /proc/PID/environ on Linux to processes with sufficient privileges. Acceptable use: for non-sensitive configuration (database host, port, environment name). As a final delivery mechanism from a secrets manager (the runtime injects secrets from Vault/ASM into environment variables at startup, the secrets are not in source code or config files). Not acceptable for long-lived secrets that change infrequently and should be centrally managed.' },
  { q: 'What is the builder pattern for secrets injection in containerized applications?', a: 'Secrets injection patterns for containers: environment injection: secrets manager injects secrets as environment variables at container startup (acceptable for short-lived containers). Volume mount: secrets are written to a file in a mounted tmpfs volume. Application reads from the file path. The file is only in memory, not on disk. Init container pattern: an init container authenticates to the secrets manager, fetches secrets, and writes them to a shared emptyDir volume. The main container reads from that volume without needing secrets manager access itself. Sidecar pattern: a sidecar container (Vault Agent) authenticates continuously, keeps secrets fresh in a shared volume, and handles token renewal. The application reads secrets from the shared filesystem. Agent-based injection (Vault Agent Injector): Kubernetes mutating webhook automatically injects Vault Agent sidecar and the required annotations into pods.' },
  { q: 'What is secrets scanning and what tools detect secrets in code repositories?', a: 'Secrets scanning: automated detection of credentials, API keys, tokens, and other secrets accidentally committed to version control. Pre-commit scanning: run locally before a commit lands. Tools: git-secrets, detect-secrets, Gitleaks. Prevent secrets from ever entering the repository. CI pipeline scanning: scan all commits in CI. Block pull request merges if secrets are detected. Historical scanning: scan the full git history to find secrets committed in the past (they may still be in git history even if removed from the current branch). Cloud native scanning: GitHub Secret Scanning, GitLab Secret Detection, AWS CodeGuru. Common patterns detected: AWS access keys (AKIA prefix). API keys with known formats (Stripe sk_live_). Private keys (BEGIN RSA PRIVATE KEY). Connection strings with passwords. High-entropy strings (configurable). Response to detected secrets: rotate immediately (the git history is effectively public even in private repos if access is compromised).' },
];

const revision: RevisionSummary = {
  oneLiner: 'Never commit secrets — load from env vars or a secrets manager; rotate on schedule and immediately on compromise; scan git for leaks before they happen.',
  mustKnow: [
    'Secrets in git = immediate breach — even private repos have broad access',
    'Environment hierarchy: .env (dev) → platform secrets (CI) → secrets manager (prod)',
    'Dynamic secrets (Vault): generated on demand, auto-revoked on TTL expiry — no static credential',
    'Rotation: schedule + immediate on suspected compromise; support two-version overlap for zero downtime',
    'Pre-commit hooks (gitleaks/detect-secrets) prevent secrets from entering history',
    'On leak: rotate FIRST, then clean history — cleaning alone is insufficient',
  ],
  interviewFocus: [
    'How would you handle a secret accidentally committed to a public repo?',
    'What are dynamic secrets and how do they improve security?',
    'How do you manage secrets across dev/CI/production environments?',
  ],
};

@Component({
  selector: 'app-sec-secrets-management',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './secrets-management.html',
  styleUrl: './secrets-management.scss',
})
export class SecSecretsManagement {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
