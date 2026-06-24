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
async function main() {
  const config = await getDbConfig();
  const pool = new Pool({ ...config }); // DB connection with fetched credentials
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
