import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-node-env-config',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './env-config.html',
  styleUrl: './env-config.scss'
})
export class NodeEnvConfig {
  quickRef: QuickRefItem[] = [
    { name: 'process.env', type: 'keyword', desc: 'Object containing all environment variables. Values are always strings.' },
    { name: 'dotenv', type: 'keyword', desc: 'Loads .env file into process.env. Call dotenv.config() as early as possible.' },
    { name: 'NODE_ENV', type: 'keyword', desc: 'Conventional env: "development", "production", "test". Not set by Node itself.' },
    { name: 'z.object()', type: 'function', desc: 'Zod schema for validating env vars at startup — fails fast on misconfiguration.' },
    { name: '--env-file', type: 'keyword', desc: 'Node.js 20.6+ built-in: node --env-file=.env server.js (no dotenv package needed).' },
    { name: '.env.local', type: 'keyword', desc: 'Local overrides (not committed). Load after .env to allow per-dev overrides.' },
    { name: '.env.example', type: 'keyword', desc: 'Template with all required env var names (no values). Always commit this file.' },
    { name: 'process.exit(1)', type: 'function', desc: 'Exit with error code — use in config validation if required vars are missing.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: '12-Factor App Config and dotenv',
      points: [
        'The 12-factor app methodology says: store config in the environment, not in code. This means database URLs, API keys, feature flags, and port numbers all come from environment variables — never hardcoded.',
        'dotenv reads a .env file and merges into process.env. Import it at the very top of your entry file before any other imports. In development you get local values; in production the real env vars come from the platform (Heroku, Railway, ECS, K8s secrets).',
        'Hierarchy (first value wins): actual environment variables → .env.local → .env. This lets CI/CD and cloud platforms override .env without modifying files.',
        'Node.js v20.6+ supports --env-file=.env natively: node --env-file=.env server.js. No package needed. Available in scripts via "start": "node --env-file=.env server.js".',
      ]
    },
    {
      heading: 'Validating Environment Variables at Startup',
      points: [
        'Fail fast: validate all required environment variables when the app starts, not at runtime when a feature is first used. A missing DATABASE_URL should crash immediately with a clear message, not surface as a 500 error hours later.',
        'Use Zod to define a schema for your env. z.string().url() validates DATABASE_URL format. z.coerce.number().min(1024) converts PORT (string) to a number. z.enum(["development","production","test"]) constrains NODE_ENV.',
        'Export a typed config object (not raw process.env) so the rest of the app gets type-safe access. TypeScript will autocomplete valid config keys.',
        'For multi-environment setups (dev/staging/prod), consider a config library like node-config or convict which supports schema documentation, default values, and per-environment override files.',
      ]
    },
    {
      heading: 'Configuration Schema Validation',
      points: [
        'Validating environment variables at application startup (using zod, envalid, or joi) catches missing or malformed configuration immediately with a clear error, rather than letting the app start successfully and crash later deep in a request handler.',
        'Type coercion matters: environment variables are always strings, so a schema should explicitly parse PORT as a number and FEATURE_FLAG as a boolean — comparing an unparsed string "false" to the boolean false always evaluates truthy, a classic Node.js configuration bug.',
        'Fail-fast validation should include sensible constraints beyond just presence: a DATABASE_URL should match a valid connection string format, a PORT should be within the valid range — catching a typo in a deployment pipeline before it reaches a running container.',
        'Document every required environment variable in a .env.example file (with placeholder values, never real secrets) so new developers and deployment pipelines know exactly what configuration is expected without reading through the codebase.',
      ]
    },
    {
      heading: 'Secrets Management Beyond .env Files',
      points: [
        'Local .env files are convenient for development but should never be the source of truth in production — they are typically unencrypted on disk and easy to accidentally commit or leave in a container image layer.',
        'Cloud secrets managers (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault) store secrets encrypted at rest, provide audit logs of every access, and support automatic rotation without requiring a code deployment to pick up a new secret value.',
        'Kubernetes Secrets are base64-encoded (not encrypted) by default — treat them as obfuscated, not secure, unless combined with encryption at rest (etcd encryption) or an external secrets operator pulling from a real secrets manager.',
        'Never log configuration objects wholesale in production — a debug log statement that dumps the entire config object can accidentally leak database passwords or API keys into log aggregation systems that many engineers have access to.',
      ]
    },
    {
      heading: 'Feature Flags as Configuration',
      points: [
        'Feature flags let you deploy code and enable it separately — decoupling deployment (getting code onto servers) from release (making a feature visible to users), reducing the risk of any single deployment.',
        'Simple boolean env-var flags (FEATURE_NEW_CHECKOUT=true) work for binary on/off toggles but do not support gradual rollout (10% of users) or per-user targeting — for that, a dedicated feature flag service (LaunchDarkly, Unleash, or a simple database-backed flag table) is needed.',
        'Flags accumulate technical debt if never removed — a flag that has been fully rolled out to 100% of users for months should be deleted from the codebase along with its now-dead old-code-path, or the codebase fills with permanent conditional branches nobody dares remove.',
        'Kill switches (a specific category of feature flag) let you instantly disable a risky feature in production without a deployment — essential for features touching payment processing or third-party integrations that might need emergency disabling.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'dotenv + Zod validation',
      language: 'typescript',
      code: `// config.js — load and validate env at startup
import 'dotenv/config'; // equivalent to dotenv.config()
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
  PORT:         z.coerce.number().min(1024).max(65535).default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET:   z.string().min(32),
  REDIS_URL:    z.string().url().optional(),
  LOG_LEVEL:    z.enum(['fatal','error','warn','info','debug','trace']).default('info'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid environment variables:');
  console.error(result.error.format());
  process.exit(1);
}

export const config = result.data;
// config.PORT is number (not string), config.DATABASE_URL is string, etc.

// Usage in another file
import { config } from './config.js';
app.listen(config.PORT, () => console.log(\`Running on \${config.PORT}\`));`
    },
    {
      label: '.env files',
      language: 'typescript',
      code: `# .env — committed to git (default values / placeholders)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://localhost:5432/myapp_dev
JWT_SECRET=dev-secret-not-for-production
LOG_LEVEL=debug

# .env.local — NOT committed (personal overrides)
DATABASE_URL=postgresql://localhost:5432/myapp_local
JWT_SECRET=my-local-super-secret-key-32chars

# .env.example — COMMITTED — shows required vars without values
NODE_ENV=
PORT=
DATABASE_URL=
JWT_SECRET=
REDIS_URL=

# Loading order in code:
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true }); // local wins

# Node 20.6+ built-in (no dotenv package):
# node --env-file=.env --env-file=.env.local server.js`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Committing .env to git',
      wrong: '# .gitignore missing .env — secrets in git history forever',
      right: '# .gitignore\n.env\n.env.local\n.env.*.local',
      explanation: 'Once a secret is in git history, it is exposed even after deletion. Add .env to .gitignore immediately. Use .env.example for documentation.'
    },
    {
      title: 'Using process.env directly throughout the app',
      wrong: 'const port = parseInt(process.env.PORT); // string, no validation, repeated everywhere',
      right: 'import { config } from "./config.js"; const port = config.PORT; // typed, validated once',
      explanation: 'Raw process.env.PORT is a string. You parse/coerce it in every file. A typo in the key name gives undefined with no error. Validate once at startup and export a typed config object.'
    },
    {
      title: 'Hardcoding secrets in code',
      wrong: 'const JWT_SECRET = "my-super-secret"; // in source code',
      right: 'const JWT_SECRET = config.JWT_SECRET; // from environment',
      explanation: 'Hardcoded secrets are visible in git history, logs, and error messages. Even private repos get leaked. Secrets must always come from environment variables or a secret manager.'
    },
    {
      title: 'Not validating env vars at startup',
      wrong: '// No validation — app starts, fails at 3am when a route hits missing DATABASE_URL',
      right: 'if (!process.env.DATABASE_URL) { console.error("Missing DATABASE_URL"); process.exit(1); }',
      explanation: 'Missing config discovered at runtime causes confusing errors far from the real cause. Validate all required env vars before starting the server — fail fast with a clear message.'
    },
  ];

  challenge: Challenge = {
    title: 'Type-safe Config Module',
    language: 'typescript',
    description: 'Build a createConfig(schema, env) function that accepts a Zod schema and an env object (defaults to process.env), validates it, and returns a typed config object. If validation fails, throw a ConfigError with a human-readable message listing the invalid fields. Export a singleton config using your function with a real schema for a web app (PORT, DATABASE_URL, JWT_SECRET, NODE_ENV).',
    hints: [
      'Use z.safeParse() so you can format the error yourself.',
      'result.error.issues gives an array of { path, message } objects.',
      'process.env should be the default but allow override for testability.',
    ],
    starterCode: `import { z } from 'zod';

class ConfigError extends Error {
  constructor(issues) {
    super('Invalid environment configuration');
    this.issues = issues;
  }
}

function createConfig(schema, env = process.env) {
  // TODO: parse, validate, return typed config
}

const appSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const config = createConfig(appSchema);`,
    solution: `import { z } from 'zod';

class ConfigError extends Error {
  constructor(issues) {
    super('Invalid environment configuration:\\n' +
      issues.map(i => \`  \${i.path.join('.')}: \${i.message}\`).join('\\n'));
    this.name = 'ConfigError';
    this.issues = issues;
  }
}

function createConfig(schema, env = process.env) {
  const result = schema.safeParse(env);
  if (!result.success) {
    throw new ConfigError(result.error.issues);
  }
  return result.data;
}

const appSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const config = createConfig(appSchema);`
  };

  quiz: QuizQuestion[] = [
    { q: 'What type does process.env.PORT return?', options: ['number', 'string', 'number | undefined', 'string | undefined'], answer: 3, explanation: 'All environment variable values are strings (or undefined if not set). You must parse/coerce numbers: parseInt(process.env.PORT) or Zod z.coerce.number().' },
    { q: 'What is the .env.example file for?', options: ['Running in test mode', 'Documenting required env var names without real values — safe to commit', 'Local developer overrides', 'Production secrets'], answer: 1, explanation: '.env.example shows what variables the app needs (keys, not values). It is committed to git so new developers know what to create in their .env file.' },
    { q: 'When should you validate environment variables?', options: ['On first use of each variable', 'Only in production', 'At application startup before serving requests', 'In middleware on each request'], answer: 2, explanation: 'Fail fast: validate all env vars at startup. A missing DATABASE_URL discovered at runtime on a Monday morning is far worse than crashing immediately with a clear error on deploy.' },
    { q: 'What does dotenv.config({ override: true }) do?', options: ['Loads from .env.override file', 'Allows .env values to override existing process.env values', 'Throws if any .env value is missing', 'Enables strict mode'], answer: 1, explanation: 'By default dotenv skips vars already in process.env. With override: true, .env values replace existing ones. Useful for .env.local to override .env without touching process.env.' },
    { q: 'Why should you never commit .env files to version control?', options: ['They slow down git operations', '.env files contain secrets (API keys, DB passwords) — committing them exposes credentials permanently in git history', '.env files use a non-standard format', 'They conflict with package.json'], answer: 1, explanation: 'Secrets committed to git are permanent — even if deleted in a later commit, they remain in git history. If the repo is public or gets leaked, all those secrets are compromised. Use .gitignore to exclude .env; use .env.example (with dummy values) as a template. Use a secrets manager (AWS Secrets Manager, Vault, 1Password) for production secrets.' },
    { q: 'What is the purpose of the NODE_ENV variable?', options: ['Sets the Node.js version', 'Signals the runtime environment (development, production, test) — used by frameworks and libraries to switch behavior', 'Controls garbage collection frequency', 'Sets the HTTP port'], answer: 1, explanation: 'NODE_ENV=production tells Express to enable view caching, set secure cookie attributes, suppress stack traces in error responses. It tells webpack/bundlers to strip development code and enable tree-shaking. Libraries check NODE_ENV to skip expensive validations in production. Always set NODE_ENV=production in deployed environments.' },
  ];

  qna: QnaItem[] = [
    { q: 'How do I handle different configs for dev, staging, and production?', a: 'Three approaches: (1) Environment-specific .env files (.env.development, .env.production) loaded by tooling like dotenv-flow or node-config. (2) Platform-level env vars — Heroku/Railway/ECS/K8s let you set vars per environment; your code just reads process.env. (3) Infrastructure secrets manager (AWS SSM, HashiCorp Vault) — fetched at startup. Prefer platform-level for simplicity, secrets manager for sensitive values.' },
    { q: 'Should I use a .env file in production?', a: 'No. Production env vars should come from the platform (Heroku config vars, AWS ECS task definitions, K8s secrets, Docker --env-file). Avoid .env files in production containers — if the container image leaks, so do your secrets. dotenv is a development convenience tool.' },
    { q: 'What is the node: prefix for --env-file?', a: 'Node.js 20.6+ supports --env-file natively: node --env-file=.env server.js. Multiple files: node --env-file=.env --env-file=.env.local server.js (later files override earlier). This eliminates the dotenv package dependency for many use cases.' },
    { q: 'A container orchestrator (Kubernetes, ECS) restarts a crashed process automatically. Does that safety net reduce the value of validating env vars at startup instead of lazily?', a: 'No — it can make lazy validation worse, not safer. If validation is eager and fails at startup, the health check never passes and the orchestrator correctly keeps the old (working) version running or blocks the rollout, since a container that never becomes ready is an unambiguous deploy failure. If validation is lazy, the container passes its health check (the process is "up," just missing a config it hasn\'t needed yet), so the orchestrator considers the deploy successful — and the crash only surfaces later when that code path executes, at which point the orchestrator dutifully restarts the crashing container in an infinite loop while healthy traffic is still being routed to it in between crashes. Eager startup validation turns a bad config into a deploy-time rejection instead of a runtime crash loop.' },
    { q: 'You discover a real API key was accidentally committed to .env three commits ago and then deleted in the next commit. Is deleting the file again (or force-pushing to drop the offending commit) enough to fix it?', a: 'No, on its own that is not sufficient — the exposed key must be treated as compromised and rotated/revoked at the provider regardless of what happens to the git history, because anyone who cloned or fetched the repo before the fix already has the secret in their local history, and force-pushing does not retroactively invalidate copies that exist elsewhere (forks, CI caches, other developers\' machines). Cleaning the history (git filter-repo / BFG) is worth doing to stop the leak from being trivially rediscoverable in the current repo, but it is a secondary step — rotating the credential itself is the only action that actually neutralizes the exposure.' },
    { q: 'Why does exporting a single typed config object (built once at startup) matter more for testability than for the "avoid scattering process.env reads" argument alone?', a: 'A module that reads process.env.X directly at the point of use is effectively reading global mutable state at import time or call time, which makes it awkward to test different configurations in the same test run — you end up mutating process.env between tests and hoping module caching does not bite you. A single exported config object built once from a validated schema can instead be constructed explicitly in tests (pass a fake env object into the same createConfig(schema, fakeEnv) function the app uses at startup) and injected wherever config is needed, so tests exercise real validation logic against controlled input instead of mutating global process.env and relying on import order.' },
  ];

  revision: RevisionSummary = {
    oneLiner: '12-factor: config in environment variables, never in code. dotenv loads .env for development; validate with Zod at startup; export a typed config object.',
    mustKnow: [
      'process.env values are always strings or undefined — coerce numbers with Zod.',
      'Add .env to .gitignore; commit .env.example with required keys but no values.',
      'Validate all env vars at startup with Zod — fail fast with a clear message.',
      'Export a typed config object instead of reading process.env throughout the app.',
      'Node.js 20.6+: --env-file=.env flag eliminates the dotenv package.',
      'Production secrets come from the platform — never from .env files in containers.',
    ],
    interviewFocus: [
      'How do you ensure missing env vars are caught immediately on deployment?',
      'What is the 12-factor app principle for configuration?',
      'Why should you never commit .env to git?',
    ]
  };
}
