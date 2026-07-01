import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  { name: 'docker compose up -d', type: 'method', desc: 'Start all services in detached mode' },
  { name: 'docker compose down', type: 'method', desc: 'Stop and remove containers (add -v for volumes)' },
  { name: 'docker compose logs -f', type: 'method', desc: 'Follow aggregated logs from all services' },
  { name: 'docker compose ps', type: 'method', desc: 'List running services and their ports' },
  { name: 'docker compose exec <svc> sh', type: 'method', desc: 'Open a shell in a running service container' },
  { name: 'depends_on: condition: service_healthy', type: 'syntax', desc: 'Wait for healthcheck before starting dependent service' },
  { name: 'volumes:', type: 'keyword', desc: 'Named volumes persist data across container restarts' },
  { name: 'networks:', type: 'keyword', desc: 'Isolate services — only linked services can communicate' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'compose.yml Structure',
    points: [
      'compose.yml defines services, volumes, and networks as a single declarative file.',
      'Each service maps to one container: image or build context, ports, env vars, volumes, and dependencies.',
      'The file is processed by the Compose CLI (docker compose) which translates it into docker run calls.',
      'Services on the same Compose network can reach each other by service name (DNS resolution built in).',
      'Use docker compose up --build to rebuild images from Dockerfiles before starting.',
    ],
  },
  {
    heading: 'Service Dependencies & Health Checks',
    points: [
      'depends_on: [db] ensures db starts before the app, but does NOT wait for db to be ready.',
      'depends_on: condition: service_healthy waits for the healthcheck to pass — use this for databases.',
      'Define healthcheck: in the dependency service with test, interval, timeout, retries.',
      'restart: unless-stopped automatically restarts a crashed container (not on docker compose stop).',
      'Compose v2 (docker compose) is built into Docker Desktop; the legacy docker-compose v1 Python CLI is deprecated.',
    ],
  },
  {
    heading: 'Volumes and Networks',
    points: [
      'Named volumes (volumes: db-data:) persist data even when containers are removed — not deleted by docker compose down.',
      'Bind mounts (.:/app) mount a host directory into the container — useful for hot-reload in dev.',
      'docker compose down -v removes named volumes too — useful for a clean reset in CI.',
      'By default Compose creates one network per project; all services join it and can communicate by name.',
      'Define multiple networks to isolate frontend from backend — only the app service joins both.',
    ],
  },
  {
    heading: 'Environment Variables',
    points: [
      'environment: key=value inlines values — avoid secrets here as they appear in docker inspect.',
      'env_file: .env loads variables from a file — add .env to .gitignore.',
      'Compose automatically reads .env in the same directory for variable substitution: ${DB_PASSWORD}.',
      'Use secrets: (Compose Swarm mode) or pass secrets at runtime via env_file for local dev.',
      'docker compose config prints the resolved compose.yml with all substitutions expanded — great for debugging.',
    ],
  },
  {
    heading: 'Compose Networking Defaults and Service Discovery',
    points: [
      'Docker Compose automatically creates a dedicated bridge network for each project, and every service can reach every other service by its service NAME as a DNS hostname — no manual network configuration is needed for basic inter-service communication.',
      'This automatic DNS-based service discovery is why compose services reference each other by name (like connecting to "db:5432") rather than by IP address, which would be unstable across container restarts.',
      'Explicitly defined custom networks let you segment services (isolating a database network from a public-facing web network) for defense-in-depth, rather than relying solely on the single default network every service shares.',
      'depends_on controls startup ORDER but does not by itself wait for a dependent service to be actually READY (like a database accepting connections) — healthchecks combined with depends_on\'s condition: service_healthy close this gap.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Full stack compose.yml',
    language: 'bash',
    code: 'services:\n' +
      '  db:\n' +
      '    image: postgres:16-alpine\n' +
      '    environment:\n' +
      '      POSTGRES_DB: myapp\n' +
      '      POSTGRES_USER: user\n' +
      '      POSTGRES_PASSWORD: ${DB_PASSWORD}\n' +
      '    volumes:\n' +
      '      - db-data:/var/lib/postgresql/data\n' +
      '    healthcheck:\n' +
      '      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]\n' +
      '      interval: 10s\n' +
      '      timeout: 5s\n' +
      '      retries: 5\n' +
      '    networks: [backend]\n' +
      '\n' +
      '  api:\n' +
      '    build: ./api\n' +
      '    ports:\n' +
      '      - "3000:3000"\n' +
      '    environment:\n' +
      '      DATABASE_URL: postgres://user:${DB_PASSWORD}@db:5432/myapp\n' +
      '    depends_on:\n' +
      '      db:\n' +
      '        condition: service_healthy\n' +
      '    restart: unless-stopped\n' +
      '    networks: [backend, frontend]\n' +
      '\n' +
      '  web:\n' +
      '    build: ./web\n' +
      '    ports:\n' +
      '      - "80:80"\n' +
      '    depends_on: [api]\n' +
      '    networks: [frontend]\n' +
      '\n' +
      'volumes:\n' +
      '  db-data:\n' +
      '\n' +
      'networks:\n' +
      '  backend:\n' +
      '  frontend:',
  },
  {
    label: 'Dev override pattern',
    language: 'bash',
    code: '# docker-compose.override.yml (auto-merged for local dev)\n' +
      'services:\n' +
      '  api:\n' +
      '    volumes:\n' +
      '      - ./api:/app          # bind mount for hot-reload\n' +
      '      - /app/node_modules   # anonymous vol: keep container node_modules\n' +
      '    environment:\n' +
      '      NODE_ENV: development\n' +
      '      LOG_LEVEL: debug\n' +
      '    command: npm run dev    # override CMD with dev server\n' +
      '\n' +
      '  db:\n' +
      '    ports:\n' +
      '      - "5432:5432"         # expose DB port only in dev\n' +
      '\n' +
      '# --- Useful compose commands ---\n' +
      '# docker compose up -d             start all\n' +
      '# docker compose up -d api         start one service\n' +
      '# docker compose logs -f api       follow api logs\n' +
      '# docker compose exec api sh       shell into api\n' +
      '# docker compose down -v           stop + remove volumes\n' +
      '# docker compose config            print resolved YAML',
  },
  {
    label: 'Redis + worker example',
    language: 'bash',
    code: 'services:\n' +
      '  redis:\n' +
      '    image: redis:7-alpine\n' +
      '    volumes:\n' +
      '      - redis-data:/data\n' +
      '    command: redis-server --appendonly yes\n' +
      '    healthcheck:\n' +
      '      test: ["CMD", "redis-cli", "ping"]\n' +
      '      interval: 5s\n' +
      '      retries: 5\n' +
      '\n' +
      '  worker:\n' +
      '    build: .\n' +
      '    env_file: .env\n' +
      '    environment:\n' +
      '      REDIS_URL: redis://redis:6379\n' +
      '    depends_on:\n' +
      '      redis:\n' +
      '        condition: service_healthy\n' +
      '    deploy:\n' +
      '      replicas: 3          # scale workers\n' +
      '    restart: on-failure\n' +
      '\n' +
      'volumes:\n' +
      '  redis-data:',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using depends_on without a healthcheck condition',
    wrong: 'depends_on: [db]\n# App starts before Postgres is ready → connection refused',
    right: 'depends_on:\n  db:\n    condition: service_healthy\n# Pair with healthcheck: in the db service',
    explanation: 'depends_on only waits for the container to start, not for the service inside to be ready. A database takes seconds to initialise. Use condition: service_healthy combined with a healthcheck on the db service.',
  },
  {
    title: 'Hardcoding secrets in compose.yml',
    wrong: 'environment:\n  DB_PASSWORD: supersecret123',
    right: 'environment:\n  DB_PASSWORD: ${DB_PASSWORD}\n# Put the value in .env (gitignored)',
    explanation: 'Values in environment: appear in docker inspect output and can leak in CI logs. Use ${VAR} substitution and load real values from a .env file that is listed in .gitignore.',
  },
  {
    title: 'Forgetting that docker compose down does NOT remove named volumes',
    wrong: '# Ran "docker compose down" but stale DB data still present\n# Confused why a fresh schema migration fails',
    right: 'docker compose down -v   # removes named volumes too\n# Or: docker volume rm project_db-data',
    explanation: 'Named volumes survive docker compose down intentionally — so you don\'t lose data on restart. In CI or when you need a clean slate, add -v to also remove volumes, or delete the specific volume by name.',
  },
  {
    title: 'Exposing DB ports in production compose',
    wrong: 'db:\n  image: postgres:16\n  ports:\n    - "5432:5432"   # exposed to host in prod',
    right: '# Remove ports: from db in production\n# Only api (on the same network) can reach db:5432\n# Use ports: only in dev override',
    explanation: 'Publishing a database port to the host exposes it to the network. In production, services on the same Compose network reach each other by service name without host port exposure. Use ports: only in docker-compose.override.yml for local dev.',
  },
  {
    title: 'Not using a named volume for database data',
    wrong: 'db:\n  image: postgres:16\n  # No volumes: — data is in the container writable layer',
    right: 'volumes:\n  - db-data:/var/lib/postgresql/data\n\nvolumes:\n  db-data:',
    explanation: 'Without a volume, database files live in the container\'s writable layer and are deleted on docker compose down. Named volumes persist independently of the container lifecycle.',
  },
];

const challenge: Challenge = {
  title: 'Compose Health Check Validator',
  language: 'typescript',
  description: 'Write a function that parses a simplified compose.yml object and returns warnings. Check: (1) any service with depends_on that lists a service name without specifying condition: service_healthy, (2) any service that has environment variables whose keys suggest secrets (PASSWORD, SECRET, TOKEN, KEY) but are hardcoded (not ${VAR} references).',
  hints: [
    'Iterate services; for each, check depends_on entries',
    'If depends_on is an array (simple form), it cannot specify condition — flag it',
    'If depends_on is an object, check each entry for condition: service_healthy',
    'For environment values, check if the value contains ${...} — if not, it may be hardcoded',
    'Use a regex like /PASSWORD|SECRET|TOKEN|KEY/i to detect sensitive key names',
  ],
  starterCode: 'interface ComposeService {\n  dependsOn?: string[] | Record<string, { condition?: string }>;\n  environment?: Record<string, string>;\n}\n\nfunction validateCompose(services: Record<string, ComposeService>): string[] {\n  const warnings: string[] = [];\n  // TODO: check depends_on conditions and hardcoded secrets\n  return warnings;\n}',
  solution: 'interface ComposeService {\n  dependsOn?: string[] | Record<string, { condition?: string }>;\n  environment?: Record<string, string>;\n}\n\nfunction validateCompose(services: Record<string, ComposeService>): string[] {\n  const warnings: string[] = [];\n\n  for (const [name, svc] of Object.entries(services)) {\n    // Check depends_on\n    if (Array.isArray(svc.dependsOn)) {\n      for (const dep of svc.dependsOn) {\n        warnings.push(`${name}: depends_on "${dep}" uses simple form — add condition: service_healthy`);\n      }\n    } else if (svc.dependsOn) {\n      for (const [dep, cfg] of Object.entries(svc.dependsOn)) {\n        if (cfg.condition !== \'service_healthy\') {\n          warnings.push(`${name}: depends_on "${dep}" missing condition: service_healthy`);\n        }\n      }\n    }\n\n    // Check hardcoded secrets\n    if (svc.environment) {\n      for (const [key, val] of Object.entries(svc.environment)) {\n        if (/PASSWORD|SECRET|TOKEN|KEY/i.test(key) && !/^\\$\\{.+\\}$/.test(val)) {\n          warnings.push(`${name}: environment "${key}" appears hardcoded — use \\${${key}} and load from .env`);\n        }\n      }\n    }\n  }\n\n  return warnings;\n}',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does depends_on: [db] guarantee?',
    options: [
      'The db service is fully initialised and accepting connections before api starts',
      'The db container has started — but the database process inside may not be ready yet',
      'Docker retries the api start until db is healthy',
      'It creates a network link between db and api',
    ],
    answer: 1,
    explanation: 'depends_on with a simple list only waits for the container to start, not for the service inside to be ready. Use depends_on: db: condition: service_healthy combined with a healthcheck: on the db service to wait for readiness.',
  },
  {
    q: 'How do services in the same Compose project communicate?',
    options: [
      'Via the host machine\'s localhost',
      'By publishing ports to 0.0.0.0',
      'By service name — Compose creates a shared DNS network automatically',
      'Only through environment variable injection',
    ],
    answer: 2,
    explanation: 'Compose creates a default bridge network for the project. Services on the same network resolve each other by service name. The api service reaches db on db:5432 without any ports: mapping to the host.',
  },
  {
    q: 'What happens to named volumes when you run docker compose down?',
    options: [
      'They are deleted immediately',
      'They are preserved — docker compose down -v is required to delete them',
      'They are archived to a tar file',
      'They are renamed with a timestamp suffix',
    ],
    answer: 1,
    explanation: 'Named volumes persist beyond the container lifecycle by design. docker compose down only removes containers and the default network. Add -v to also remove named volumes, or delete them manually with docker volume rm.',
  },
  {
    q: 'Which file is automatically merged with compose.yml for local development?',
    options: [
      'docker-compose.dev.yml',
      'compose.local.yml',
      'docker-compose.override.yml',
      '.env.compose',
    ],
    answer: 2,
    explanation: 'Docker Compose automatically reads docker-compose.override.yml (or compose.override.yml) and merges it with compose.yml. This is the standard pattern for dev overrides — bind mounts, debug commands, exposed DB ports — without modifying the base compose.yml.',
  },
  {
    q: 'What does docker compose config do?',
    options: [
      'Applies the compose.yml changes to running containers',
      'Opens an interactive configuration editor',
      'Prints the fully merged and substituted compose.yml — useful for debugging',
      'Validates compose.yml syntax and exits 0 if valid',
    ],
    answer: 2,
    explanation: 'docker compose config prints the effective compose.yml after merging override files and expanding all ${VARIABLE} substitutions. Use it to verify that environment variables from .env are being loaded correctly.',
  },
  { q: 'What does depends_on do in Docker Compose and what does it NOT guarantee?', options: ['It sets port bindings between services', 'It ensures a service starts before another but does NOT wait for the service to be ready', 'It shares environment variables between services', 'It links services to an external network'], answer: 1, explanation: 'depends_on controls startup ORDER only. It does NOT wait for a service to be ready (database accepting connections). For readiness, use healthcheck on the dependency and depends_on.condition: service_healthy. Without this, the dependent service may start before the dependency is accepting connections.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between docker compose (v2) and docker-compose (v1)?',
    a: 'docker compose (with a space) is the Compose v2 plugin, written in Go and bundled with Docker Desktop and Docker Engine 20.10+. docker-compose (with a hyphen) was the legacy v1 Python CLI. v2 is faster, supports profiles, and the --project-name flag. The old v1 is deprecated and should not be used.',
  },
  {
    q: 'How do I scale a service to multiple replicas in Compose?',
    a: 'Use docker compose up --scale worker=3 to start 3 replicas of the worker service, or add deploy: replicas: 3 in compose.yml. Note: replicas only work if the service does not have a host port mapping (ports: "8080:8080" conflicts with multiple replicas — all 3 would try to bind the same host port).',
  },
  {
    q: 'What is the difference between a named volume and a bind mount?',
    a: 'A named volume (volumes: db-data:/var/lib/postgresql/data) is managed by Docker and stored in Docker\'s volume store. It persists across container recreations. A bind mount (./app:/app) mounts a specific host directory into the container — changes on the host are immediately visible inside, making it ideal for hot-reloading during development.',
  },
  {
    q: 'How should I pass database passwords to services in Compose?',
    a: 'Use ${VARIABLE} substitution in compose.yml and put real values in a .env file that is listed in .gitignore. For production, use Docker Secrets (Swarm mode) or inject via your CI/CD system\'s secret management (GitHub Actions secrets, Vault, etc.). Never hardcode passwords in compose.yml.',
  },
  {
    q: 'Can I use Docker Compose in production?',
    a: 'For small single-host deployments, yes. Compose lacks built-in clustering, self-healing across multiple nodes, or advanced scheduling. For multi-host or highly available deployments, Kubernetes or Docker Swarm is a better choice. Some teams use Compose on a single cloud VM as a low-ops alternative to Kubernetes for small services.',
  },
  { q: 'How do you scale a service in Docker Compose?', a: 'Use docker compose up --scale web=3 to run 3 replicas of the web service. In compose.yaml you can also set deploy.replicas: 3 (Compose V2 supports Docker Swarm-style deploy config). Each replica gets its own container name with an index suffix. Note: services with fixed host port bindings like ports: 80:80 will fail on replicas > 1 since multiple containers cannot bind the same host port simultaneously.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Docker Compose declares multi-container apps in compose.yml — services, volumes, networks, and dependencies as a single file.',
  mustKnow: [
    'Services communicate by name on the Compose network — no host port exposure needed internally',
    'depends_on: condition: service_healthy + healthcheck: to wait for DB readiness',
    'Named volumes persist beyond docker compose down (use -v to delete them)',
    '${VAR} substitution + .env file for secrets — never hardcode in compose.yml',
    'docker-compose.override.yml auto-merges for local dev (bind mounts, debug ports)',
    'docker compose config prints the resolved YAML after merging and substitution',
  ],
  interviewFocus: [
    'Why doesn\'t depends_on: [db] guarantee the database is ready?',
    'How would you handle secrets in a Docker Compose setup?',
    'What is the override file pattern and when would you use it?',
    'How do named volumes differ from bind mounts?',
  ],
};

@Component({
  selector: 'app-k8s-compose',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './compose.html',
  styleUrl: './compose.scss',
})
export class K8sCompose {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
