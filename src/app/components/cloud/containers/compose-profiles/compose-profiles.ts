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
  { name: 'profiles: [name]', type: 'syntax', desc: 'Assign a service to a profile — only starts when that profile is active' },
  { name: '--profile <name>', type: 'syntax', desc: 'Activate a profile: docker compose --profile debug up' },
  { name: 'COMPOSE_PROFILES=name', type: 'keyword', desc: 'Env var to activate profiles without CLI flag' },
  { name: 'COMPOSE_FILE', type: 'keyword', desc: 'Colon-separated list of compose files to merge' },
  { name: 'docker compose -f a.yml -f b.yml', type: 'method', desc: 'Merge multiple compose files at runtime' },
  { name: 'extends:', type: 'syntax', desc: 'Inherit service config from another file (Compose v2.1+)' },
  { name: 'x-<name>:', type: 'syntax', desc: 'Custom extension fields — use with YAML anchors for DRY config' },
  { name: '&anchor / *alias', type: 'syntax', desc: 'YAML anchor (&) defines reusable block; alias (*) references it' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Profiles — Optional Services',
    points: [
      'A profile groups services that should only run in certain contexts (debug, test, monitoring).',
      'Services without profiles: always start. Services with profiles: only start when that profile is active.',
      'Activate with --profile: docker compose --profile debug up -d.',
      'Multiple profiles can be active at once: docker compose --profile debug --profile monitoring up.',
      'Set COMPOSE_PROFILES=debug,monitoring in .env to activate profiles without the CLI flag.',
    ],
  },
  {
    heading: 'Override Files & File Merging',
    points: [
      'docker-compose.override.yml is automatically merged with compose.yml — no flags needed.',
      'Explicitly merge multiple files: docker compose -f compose.yml -f compose.prod.yml up.',
      'The COMPOSE_FILE env var sets the default list: COMPOSE_FILE=compose.yml:compose.prod.yml.',
      'When merging, lists (ports, volumes, environment) are concatenated; scalar values are overwritten.',
      'Common pattern: compose.yml (base) + compose.override.yml (dev) + compose.prod.yml (prod).',
    ],
  },
  {
    heading: 'YAML Anchors for DRY Config',
    points: [
      'YAML anchors (&name) define a reusable block; aliases (*name) reference it elsewhere.',
      'Use extension fields (x-logging: &logging) to define shared config without affecting Compose.',
      'Example: x-env: &common-env with shared env vars, then environment: [*common-env] on each service.',
      'Merge keys (<<: *anchor) let you override individual properties while inheriting the rest.',
      'YAML anchors are resolved before Compose processes the file — they are a YAML feature, not Compose.',
    ],
  },
  {
    heading: 'extends: — Service Inheritance',
    points: [
      'extends: lets a service inherit configuration from another service or file.',
      'Same file: extends: service: base-worker — inherits all settings from base-worker.',
      'Cross-file: extends: file: common.yml; service: worker — pulls from an external compose file.',
      'Extending service can override or add properties; depends_on and volumes are not inherited.',
      'Use for shared base images, env vars, and resource limits across multiple similar services.',
    ],
  },
  {
    heading: 'Profile-Driven Environment Composition',
    points: [
      'Profiles let a single compose file describe multiple deployment configurations (dev, test, debug tooling) without maintaining separate compose files that would drift out of sync with each other over time.',
      'A service with no profiles assigned always starts by default — only services explicitly tagged with a profile are conditionally included, meaning core services stay running while optional tooling (a debug proxy, a seed-data job) is opt-in.',
      'Combining profiles with COMPOSE_PROFILES environment variable lets CI pipelines and local development activate different service subsets without changing command-line invocation, keeping developer and CI workflows consistent.',
      'Overusing profiles to cram every possible environment variation into one compose file can make the file harder to read than simply maintaining a small number of purpose-specific compose files with override layering.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Profiles',
    language: 'bash',
    code: '# compose.yml — profiles for optional services\n' +
      'services:\n' +
      '  api:\n' +
      '    build: .\n' +
      '    ports: ["3000:3000"]\n' +
      '    # No profiles: — always starts\n' +
      '\n' +
      '  db:\n' +
      '    image: postgres:16-alpine\n' +
      '    # No profiles: — always starts\n' +
      '\n' +
      '  pgadmin:\n' +
      '    image: dpage/pgadmin4\n' +
      '    profiles: [debug]          # only with --profile debug\n' +
      '    ports: ["5050:80"]\n' +
      '    environment:\n' +
      '      PGADMIN_DEFAULT_EMAIL: admin@local.dev\n' +
      '      PGADMIN_DEFAULT_PASSWORD: admin\n' +
      '\n' +
      '  prometheus:\n' +
      '    image: prom/prometheus\n' +
      '    profiles: [monitoring]     # only with --profile monitoring\n' +
      '    ports: ["9090:9090"]\n' +
      '\n' +
      '# Start all core services:\n' +
      '# docker compose up -d\n' +
      '\n' +
      '# Start core + debug tools:\n' +
      '# docker compose --profile debug up -d\n' +
      '\n' +
      '# Activate via env (put in .env):\n' +
      '# COMPOSE_PROFILES=debug,monitoring',
  },
  {
    label: 'Override files',
    language: 'bash',
    code: '# compose.yml — base (committed, used everywhere)\n' +
      'services:\n' +
      '  api:\n' +
      '    image: ghcr.io/org/api:latest\n' +
      '    environment:\n' +
      '      NODE_ENV: production\n' +
      '    restart: unless-stopped\n' +
      '\n' +
      '# -------------------------------------------\n' +
      '# docker-compose.override.yml — dev (auto-merged)\n' +
      'services:\n' +
      '  api:\n' +
      '    build: .                   # override: build instead of pull\n' +
      '    volumes:\n' +
      '      - .:/app                 # hot-reload bind mount\n' +
      '      - /app/node_modules\n' +
      '    environment:\n' +
      '      NODE_ENV: development    # overwrite scalar value\n' +
      '      DEBUG: "api:*"\n' +
      '    command: npm run dev\n' +
      '\n' +
      '# -------------------------------------------\n' +
      '# compose.prod.yml — production (explicit merge)\n' +
      'services:\n' +
      '  api:\n' +
      '    deploy:\n' +
      '      replicas: 3\n' +
      '      resources:\n' +
      '        limits: { cpus: "0.5", memory: 512M }\n' +
      '\n' +
      '# Production start:\n' +
      '# docker compose -f compose.yml -f compose.prod.yml up -d',
  },
  {
    label: 'YAML anchors',
    language: 'bash',
    code: '# Use x- prefix for extension fields (Compose ignores them)\n' +
      'x-logging: &default-logging\n' +
      '  driver: json-file\n' +
      '  options:\n' +
      '    max-size: "10m"\n' +
      '    max-file: "3"\n' +
      '\n' +
      'x-env: &common-env\n' +
      '  DATABASE_URL: ${DATABASE_URL}\n' +
      '  REDIS_URL: redis://redis:6379\n' +
      '  LOG_LEVEL: info\n' +
      '\n' +
      'services:\n' +
      '  api:\n' +
      '    build: ./api\n' +
      '    environment:\n' +
      '      <<: *common-env          # merge all common vars\n' +
      '      SERVICE_NAME: api        # add service-specific var\n' +
      '    logging: *default-logging  # alias: identical reference\n' +
      '\n' +
      '  worker:\n' +
      '    build: ./worker\n' +
      '    environment:\n' +
      '      <<: *common-env\n' +
      '      SERVICE_NAME: worker\n' +
      '      CONCURRENCY: "5"\n' +
      '    logging: *default-logging',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Activating profiles for core services by mistake',
    wrong: 'services:\n  db:\n    image: postgres:16\n    profiles: [dev]   # oops — now only starts with --profile dev',
    right: '# Core services must have NO profiles: field\n# Only optional/supplementary services get profiles:\n  db:\n    image: postgres:16\n    # no profiles: — always starts',
    explanation: 'Any service with a profiles: field will NOT start unless that profile is active. If you accidentally add profiles: to a required service like a database, the entire application breaks in the default (no-profile) startup.',
  },
  {
    title: 'Expecting lists to be replaced instead of merged',
    wrong: '# compose.yml: ports: ["3000:3000"]\n# override: ports: ["3001:3000"]\n# Expected: only 3001:3000\n# Actual: both 3000:3000 AND 3001:3000 are bound',
    right: '# To replace a list, remove the base entry or use a fresh service name\n# Compose MERGES lists — it does not replace them in overrides',
    explanation: 'When merging compose files, list values (ports, volumes, environment as list) are concatenated. Only scalar values (image, command, restart) are overwritten. Plan your base file to only include what every environment needs.',
  },
  {
    title: 'Using YAML anchors across separate files',
    wrong: '# compose.yml defines &my-anchor\n# compose.override.yml tries to use *my-anchor\n# Error: anchor not found',
    right: '# YAML anchors only work within the same file\n# Use environment variables or extends: for cross-file sharing',
    explanation: 'YAML anchors are resolved per-file by the YAML parser before Compose sees the content. An anchor defined in compose.yml cannot be referenced in compose.override.yml. Use extends: file: or shared environment variables instead.',
  },
  {
    title: 'Not using COMPOSE_FILE for consistent CI invocations',
    wrong: '# Some team members run: docker compose up\n# Others run: docker compose -f compose.yml -f compose.prod.yml up\n# Result: different environments without knowing it',
    right: '# Set in .env for local; set in CI env:\nCOMPOSE_FILE=compose.yml:compose.prod.yml',
    explanation: 'Without COMPOSE_FILE, the default is only compose.yml (+ the auto override). Team members using different file combinations get different environments. Set COMPOSE_FILE explicitly in .env and in CI environment variables.',
  },
  {
    title: 'Forgetting that extends: does not inherit depends_on',
    wrong: '# base-service has depends_on: [db]\n# extended-service inherits everything — expecting db dependency\n# But: extended-service starts before db is ready',
    right: '# Re-declare depends_on explicitly in the extending service:\nextends:\n  service: base-service\ndepends_on:\n  db:\n    condition: service_healthy',
    explanation: 'Compose intentionally does not inherit depends_on or volumes_from through extends: to prevent unexpected dependency chains. Always re-declare depends_on in the extending service.',
  },
];

const challenge: Challenge = {
  title: 'Profile Dependency Checker',
  language: 'typescript',
  description: 'Write a function that takes a list of service definitions and returns warnings for: (1) services with depends_on referencing a service that has profiles (the dependency might not be started), (2) core services (no profiles) that depend on profile-gated services.',
  hints: [
    'Build a map of service name → profiles array (empty = always runs)',
    'For each service, iterate its depends_on list',
    'If a dependency has profiles: and the current service has no profiles: — that\'s a problem',
    'Also warn if an always-on service (no profiles) depends on a profiled service',
    'Return an array of warning strings with service and dependency names',
  ],
  starterCode: 'interface ServiceDef {\n  name: string;\n  profiles?: string[];\n  dependsOn?: string[];\n}\n\nfunction checkProfileDeps(services: ServiceDef[]): string[] {\n  const warnings: string[] = [];\n  // TODO: flag core services depending on profiled services\n  return warnings;\n}',
  solution: 'interface ServiceDef {\n  name: string;\n  profiles?: string[];\n  dependsOn?: string[];\n}\n\nfunction checkProfileDeps(services: ServiceDef[]): string[] {\n  const warnings: string[] = [];\n  const profileMap = new Map<string, string[]>();\n  for (const svc of services) {\n    profileMap.set(svc.name, svc.profiles ?? []);\n  }\n\n  for (const svc of services) {\n    const svcProfiles = profileMap.get(svc.name) ?? [];\n    for (const dep of svc.dependsOn ?? []) {\n      const depProfiles = profileMap.get(dep);\n      if (depProfiles === undefined) {\n        warnings.push(`${svc.name}: depends_on unknown service "${dep}"`);\n        continue;\n      }\n      if (depProfiles.length > 0) {\n        if (svcProfiles.length === 0) {\n          warnings.push(`Core service "${svc.name}" depends on profiled service "${dep}" (profiles: ${depProfiles.join(\', \')}) — dep may not be started`);\n        } else {\n          const missingProfiles = depProfiles.filter(p => !svcProfiles.includes(p));\n          if (missingProfiles.length > 0) {\n            warnings.push(`"${svc.name}" depends on "${dep}" but does not share profile(s): ${missingProfiles.join(\', \')}`);\n          }\n        }\n      }\n    }\n  }\n  return warnings;\n}',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What happens to a service with profiles: [debug] when you run docker compose up without any profile flag?',
    options: [
      'It starts normally but is labelled as debug-only',
      'It does not start — it is only started when --profile debug is specified',
      'It starts and then immediately stops',
      'Docker throws an error about the unrecognised profile',
    ],
    answer: 1,
    explanation: 'Services with a profiles: field are only started when the matching profile is active (via --profile or COMPOSE_PROFILES). Without the flag, they are completely ignored. Services without profiles: always start.',
  },
  {
    q: 'When merging two compose files, what happens to list-type values like ports: or volumes:?',
    options: [
      'The override file\'s list replaces the base list entirely',
      'Only the last file\'s list is used',
      'Lists are concatenated — both files\' entries are combined',
      'An error is thrown for duplicate list types',
    ],
    answer: 2,
    explanation: 'Compose merges list fields by concatenation. If compose.yml has ports: ["3000:3000"] and the override has ports: ["3001:3000"], the result has both entries. Only scalar values (image, command) are overwritten.',
  },
  {
    q: 'Which YAML feature lets you define a reusable block and reference it elsewhere in the same file?',
    options: [
      'YAML variables ($variable)',
      'YAML anchors (&name) and aliases (*name)',
      'YAML imports (!include)',
      'YAML templates ({{template}})',
    ],
    answer: 1,
    explanation: 'YAML anchors (&name) define a reusable block and aliases (*name) reference it. The <<: merge key lets you merge an anchored mapping into another. These are YAML features resolved before Compose processes the file — they only work within a single file.',
  },
  {
    q: 'What does the extends: key in a Compose service do?',
    options: [
      'Extends the container\'s lifetime beyond compose down',
      'Inherits configuration from another service or file',
      'Extends the health check timeout',
      'Allows the service to extend its resource limits dynamically',
    ],
    answer: 1,
    explanation: 'extends: lets a service inherit configuration (image, environment, build context, etc.) from another service, either in the same file or in an external compose file. Note: depends_on and volumes_from are intentionally NOT inherited.',
  },
  {
    q: 'How do you activate multiple Compose profiles at once without repeating --profile flags?',
    options: [
      'COMPOSE_FILES=debug,monitoring',
      'profiles: [debug,monitoring] in compose.yml',
      'COMPOSE_PROFILES=debug,monitoring in the environment or .env file',
      'docker compose --all-profiles up',
    ],
    answer: 2,
    explanation: 'Set COMPOSE_PROFILES=debug,monitoring in your shell environment or .env file. Compose reads this variable and activates all listed profiles, equivalent to passing --profile debug --profile monitoring on the command line.',
  },
  { q: 'What is the purpose of Docker Compose profiles?', options: ['To name your project differently per environment', 'To conditionally include services without modifying the compose file', 'To enable GPU access for specific services', 'To share named volumes between projects'], answer: 1, explanation: 'Profiles allow you to group services so only relevant ones start per environment. Assign a profile with profiles: [debug] on a service. Start with docker compose --profile debug up to include those services. Services without a profile always start. Useful for optional tools like DB admin UIs, debuggers, or integration-test services you do not want running in production.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between profiles and override files?',
    a: 'Profiles activate or deactivate individual services within a single compose.yml based on context. Override files merge entire compose files — useful for environment-specific settings (different images, resource limits, ports). They complement each other: profiles for optional services, overrides for env-specific configuration.',
  },
  {
    q: 'Can I use YAML anchors across different compose files?',
    a: 'No. YAML anchors are resolved by the YAML parser before Docker Compose sees the content, and each file is parsed independently. An anchor defined in compose.yml cannot be used in compose.override.yml. Use environment variables or extends: file: for cross-file config sharing.',
  },
  {
    q: 'How do I run only a specific profile\'s services without starting the core services?',
    a: 'You cannot — services without profiles always start. Profiles are designed for additive optional services, not for mutually exclusive startup modes. If you need to start a completely different set of services, use separate compose files and -f flags.',
  },
  {
    q: 'What is the COMPOSE_PROJECT_NAME variable used for?',
    a: 'It sets the project name prefix used for container names, network names, and volume names. Default is the directory name. Setting COMPOSE_PROJECT_NAME=myapp ensures containers are named myapp-api-1, myapp-db-1 regardless of which directory you run compose from — useful in CI where the checkout path may vary.',
  },
  {
    q: 'When should I use extends: vs override files?',
    a: 'Use extends: when you have multiple similar services (e.g. multiple worker types) that share a base configuration within the same project. Use override files when you need environment-specific variants of the entire stack (dev vs prod). extends: is service-level inheritance; overrides are file-level merging.',
  },
  { q: 'How do you merge multiple Docker Compose files for different environments?', a: 'Docker Compose merges files in order: compose.yaml (base) plus compose.override.yaml (auto-loaded if present). For explicit overrides use -f: docker compose -f compose.yaml -f compose.prod.yaml up. Later files take precedence for scalar values; arrays like ports and volumes are merged. A common pattern: base file defines services, compose.dev.yaml adds volume mounts and debug ports, compose.prod.yaml sets production resource limits and removes dev-only services.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Profiles gate optional services; override files layer env-specific config; YAML anchors DRY-up shared settings — all within the Compose ecosystem.',
  mustKnow: [
    'profiles: on a service means it only starts when that profile is active (--profile or COMPOSE_PROFILES)',
    'Core services (always-on) must have NO profiles: field',
    'docker-compose.override.yml auto-merges; explicit merge with -f; COMPOSE_FILE for defaults',
    'List fields (ports, volumes) are concatenated on merge; scalars (image, command) are overwritten',
    'YAML anchors (&/*/<<:) for DRY config — only within the same file',
    'extends: inherits service config but NOT depends_on — re-declare dependencies explicitly',
  ],
  interviewFocus: [
    'What is the difference between Compose profiles and override files?',
    'Why can\'t a YAML anchor in compose.yml be used in compose.override.yml?',
    'What does depends_on NOT inherit when using extends:?',
    'How would you handle prod vs dev compose configuration for a team?',
  ],
};

@Component({
  selector: 'app-k8s-compose-profiles',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent,
    PageCompleteComponent,
  ],
  templateUrl: './compose-profiles.html',
  styleUrl: './compose-profiles.scss',
})
export class K8sComposeProfiles {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
