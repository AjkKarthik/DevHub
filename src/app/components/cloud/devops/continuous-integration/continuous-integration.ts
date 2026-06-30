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
  selector: 'app-devops-continuous-integration',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './continuous-integration.html',
  styleUrl: './continuous-integration.scss'
})
export class DevopsContinuousIntegration {

  quickRef: QuickRefItem[] = [
    { name: 'Continuous Integration', type: 'keyword', desc: 'Practice of merging every developer\'s work to a shared branch multiple times a day, verified by automated build + tests' },
    { name: 'Build Pipeline',         type: 'keyword', desc: 'Automated sequence: checkout → install → lint → test → build → publish artifact' },
    { name: 'Fast Feedback',          type: 'keyword', desc: 'Core CI goal: developers know within minutes whether their change broke something' },
    { name: 'Green Build Contract',   type: 'keyword', desc: 'Team agreement: main branch must always be in a deployable state; broken build is top priority to fix' },
    { name: 'Code Coverage Gate',     type: 'keyword', desc: 'CI fails if test coverage drops below a threshold — enforces that new code is tested' },
    { name: 'Static Analysis',        type: 'keyword', desc: 'Tools (ESLint, SonarQube, Roslyn Analyzers) that inspect code without running it' },
    { name: 'SAST',                   type: 'keyword', desc: 'Static Application Security Testing — static analysis focused on security vulnerabilities' },
    { name: 'Artifact',              type: 'keyword', desc: 'Immutable versioned build output (Docker image, npm package, zip) — produced once, promoted across environments' },
    { name: 'Flaky Test',             type: 'keyword', desc: 'Test that passes and fails intermittently without code changes — enemy of CI trust' },
    { name: 'Build Matrix',           type: 'keyword', desc: 'Running the same pipeline across multiple OS/runtime versions simultaneously' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Continuous Integration?',
      points: [
        'Continuous Integration (CI) is the practice of integrating code changes into a shared branch frequently — at least once per day per developer.',
        'Each integration triggers an automated build and test run. The goal: find integration problems within minutes, not days.',
        'Kent Beck and XP popularised CI in the late 1990s. Before CI: "integration hell" — merging weeks of parallel work took days of manual debugging.',
        'The CI principle: if merging is painful, do it more often. Frequent small merges produce trivial conflicts; infrequent large merges produce crisis.',
        'CI is a developer discipline first, a tooling choice second. A team that merges once a week with automated tests is doing CI better than one that has Jenkins but never merges.',
      ]
    },
    {
      heading: 'The CI Pipeline',
      points: [
        'A CI pipeline is the automated verification sequence triggered on every commit: checkout → install → lint → test → build → security scan → publish.',
        'Order matters: put fastest checks first. Lint (seconds) before tests (minutes) before security scan (minutes) — fail fast on the cheapest check.',
        'Pipeline must be idempotent: same inputs always produce same outputs. Builds that depend on external mutable state produce unreliable results.',
        'Build once, promote many: build a single artifact (Docker image, binary, zip) and promote that exact artifact through environments. Never rebuild for staging/prod.',
        'Target build time: under 10 minutes for developer feedback. Under 5 minutes is ideal. Builds over 15 minutes get skipped or run less frequently.',
      ]
    },
    {
      heading: 'Testing Strategy in CI',
      points: [
        'Test pyramid: many unit tests (fast, isolated, no I/O), fewer integration tests (real DB/API), minimal E2E tests (slow, brittle, expensive).',
        'Unit tests should run on every commit — they are the core CI signal. Integration tests may run on PR merge; E2E tests on a schedule or before release.',
        'Code coverage: measure line/branch/function coverage. Set a minimum threshold in CI (e.g., 80%). Coverage gate prevents shipping untested new code.',
        'Test parallelisation: split test suite across multiple runners to hit the 5-minute target. Jest `--shard`, `pytest-xdist`, xUnit parallelism.',
        'Mutation testing (Stryker, PIT): modifies your code and checks that tests catch the change. Identifies tests that pass without actually testing behaviour.',
      ]
    },
    {
      heading: 'Code Quality & Static Analysis',
      points: [
        'Linting (ESLint, Pylint, StyleCop): enforce code style and common errors. Run as first CI step — cheapest catch.',
        'SonarQube/SonarCloud: tracks code smells, duplication, complexity, and security hotspots across time. Quality Gates can fail the PR if metrics degrade.',
        'SAST (Semgrep, CodeQL, Checkmarx): static security analysis — finds SQL injection, XSS, hardcoded secrets, vulnerable patterns without running the code.',
        'Dependency scanning (npm audit, Snyk, Dependabot): identifies known vulnerabilities in third-party packages. Run on every build.',
        'Secret scanning (gitleaks, GitHub Secret Scanning): detects accidentally committed credentials. Should run before code reaches the remote.',
      ]
    },
    {
      heading: 'Artifact Management',
      points: [
        'Build once, never rebuild: a Docker image built in CI is tagged with the commit SHA. The same image bytes are promoted to staging → prod.',
        'Immutability: never overwrite a published tag (`:latest` is mutable and dangerous for CI/CD — use commit SHAs or build IDs for pinning).',
        'Versioning: semantic versioning for libraries; commit SHA + build number for services. Conventional commits + semantic-release automate this.',
        'Artifact registries: Docker images → GHCR/ACR/ECR; npm → npm registry/Artifactory; NuGet → nuget.org/Azure Artifacts; binaries → S3/Blob.',
        'Retention: keep artifacts for recent N builds or N days. Artifact storage costs money — automate cleanup of old artifacts.',
      ]
    },
    {
      heading: 'CI Metrics & Feedback Loops',
      points: [
        'Key CI metrics: build duration (trend toward shorter), build success rate (target >95%), test flakiness rate (target 0%).',
        'DORA "Change Lead Time" starts the clock at commit — CI duration is a direct component. Slow CI = slow lead time = lower DORA score.',
        'Developer experience: CI must feel fast and trustworthy. If developers routinely re-run failing builds or ignore CI results, the process has broken down.',
        'Flaky tests are a first-class problem: a test that intermittently fails destroys CI trust. Quarantine flaky tests, fix within a sprint.',
        'Build notifications: Slack/Teams message on failure (not on success — alert fatigue). Only notify the committer + team channel, not everyone.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CI Pipeline (GitHub Actions)',
      language: 'bash',
      code: `# .github/workflows/ci.yml
# name: CI
# on:
#   push:
#     branches: [main, develop]
#   pull_request:
#     branches: [main]
#
# jobs:
#   ci:
#     name: Build, Lint, Test
#     runs-on: ubuntu-latest
#     strategy:
#       matrix:
#         node: [18, 20, 22]
#       fail-fast: false
#
#     steps:
#       - uses: actions/checkout@v4
#
#       - uses: actions/setup-node@v4
#         with:
#           node-version: node version from matrix
#           cache: 'npm'
#
#       # Step 1: Lint (fastest — fail before running tests)
#       - name: Lint
#         run: npm run lint
#
#       # Step 2: Unit tests with coverage
#       - name: Test
#         run: npm test -- --coverage --watchAll=false
#
#       # Step 3: Coverage gate (fail if below 80%)
#       - name: Check coverage threshold
#         run: |
#           COVERAGE=$(cat coverage/coverage-summary.json | node -e "
#             const d=JSON.parse(require('fs').readFileSync('/dev/stdin'));
#             console.log(d.total.lines.pct)")
#           echo "Line coverage: $COVERAGE%"
#           node -e "if ($COVERAGE < 80) process.exit(1)"
#
#       # Step 4: Production build
#       - name: Build
#         run: npm run build -- --configuration=production
#
#       # Step 5: Publish artifact (only main branch)
#       - name: Publish artifact
#         if: github.ref == 'refs/heads/main'
#         uses: actions/upload-artifact@v4
#         with:
#           name: webapp-build
#           path: dist/
#           retention-days: 14`,
    },
    {
      label: 'SonarQube Quality Gate',
      language: 'bash',
      code: `# SonarQube integration in CI
# Requires: SONAR_TOKEN secret, sonar-project.properties in repo root

# sonar-project.properties:
# sonar.projectKey=my-org_my-project
# sonar.organization=my-org
# sonar.sources=src
# sonar.exclusions=**/*.spec.ts,**/node_modules/**
# sonar.javascript.lcov.reportPaths=coverage/lcov.info
# sonar.testExecutionReportPaths=test-report.xml

# In CI pipeline (after tests produce coverage/lcov.info):
#
# - name: SonarCloud Scan
#   uses: SonarSource/sonarcloud-github-action@master
#   env:
#     GITHUB_TOKEN: secrets.GITHUB_TOKEN
#     SONAR_TOKEN: secrets.SONAR_TOKEN

# Quality Gate rules (configured in SonarQube UI):
# - New code coverage >= 80%
# - New code duplications <= 3%
# - No new blockers / critical issues
# - Security hotspots reviewed
# - Reliability rating A
# Pipeline FAILS if Quality Gate fails

# Local scan (dev):
npx sonarqube-scanner \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.login=YOUR_TOKEN

# Dependency vulnerability scan:
npm audit --audit-level=high   # fails on high/critical vulnerabilities
npx snyk test --severity-threshold=high`,
    },
    {
      label: 'Test Parallelisation',
      language: 'bash',
      code: `# Jest test sharding — split test suite across multiple runners
# In CI with 4 parallel runners:
#
# jobs:
#   test:
#     runs-on: ubuntu-latest
#     strategy:
#       matrix:
#         shard: [1, 2, 3, 4]
#     steps:
#       - uses: actions/checkout@v4
#       - uses: actions/setup-node@v4
#         with: { node-version: '20', cache: 'npm' }
#       - run: npm ci
#       # Each runner handles 1/4 of the test suite
#       - run: npx jest --shard=SHARD_NUM/4 --coverage
#       - uses: actions/upload-artifact@v4
#         with:
#           name: coverage-shard-SHARD_NUM
#           path: coverage/

#   merge-coverage:
#     needs: test
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/download-artifact@v4
#         with: { pattern: 'coverage-shard-*', merge-multiple: true }
#       - run: npx nyc merge . merged-coverage.json
#       - run: npx nyc report --reporter=lcov --temp-dir=.

# Dotnet parallel tests:
# dotnet test --parallel
#   --logger "trx;LogFileName=test-results.trx"
#   --collect:"XPlat Code Coverage"

# Python pytest parallel:
# pip install pytest-xdist
# pytest -n auto --dist=loadfile  # auto-detect CPU count`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Merging to main without passing CI',
      wrong: `# Developer bypasses CI:
# git push --force origin main
# "I'll fix the tests later"
# OR: team has no branch protection — PRs merge without CI check
# Main branch is broken for everyone`,
      right: `# Branch protection: require CI to pass before merge
# GitHub: Settings → Branches → Require status checks to pass
# Zero exceptions: even hotfixes run CI (expedited, not skipped)
# Broken main is a P1 incident — fix or revert immediately`,
      explanation: 'A broken main branch blocks all other developers from integrating. Branch protection rules that require CI to pass are non-negotiable. If a build is slow and someone bypasses it "just this once," you have a culture problem, not a tooling problem.',
    },
    {
      title: 'Slow CI pipeline (>15 minutes)',
      wrong: `# Pipeline: install → test → build → security scan → E2E tests
# Total time: 45 minutes
# Developers stop waiting, context switch, submit more PRs
# Feedback loop is too long to be useful
# CI becomes a bureaucratic formality, not a safety net`,
      right: `# Optimise for speed:
# 1. Lint first (30 sec) — fails before expensive steps
# 2. Cache dependencies (npm ci: 30 sec vs 3 min)
# 3. Parallelise: unit tests on 4 shards simultaneously
# 4. E2E tests: only on merge to main, not PRs
# Target: PR CI under 5 minutes`,
      explanation: 'Developers ignore CI they have to wait 15+ minutes for. Every minute added to CI reduces adoption and increases the chance of integration problems accumulating. Optimise with: lint-first ordering, dependency caching, test sharding, and deferring E2E tests to post-merge.',
    },
    {
      title: 'No coverage threshold enforcement',
      wrong: `# CI runs tests and generates a coverage report
# Report is published as an artifact
# No threshold — 10% coverage is as good as 90% to CI
# New features ship with 0% coverage for months
# Coverage report is "nice to have" information, not a gate`,
      right: `# jest.config.js:
# coverageThreshold: {
#   global: {
#     lines: 80,
#     branches: 75,
#     functions: 80,
#   }
# }
# CI fails if coverage drops below threshold on new code`,
      explanation: 'Generating a coverage report without enforcing a threshold is theater. CI should fail if coverage drops below the agreed minimum on new code. SonarQube\'s Quality Gate or Jest\'s `coverageThreshold` option enforce this automatically — coverage becomes a build blocker, not a vanity metric.',
    },
    {
      title: 'Running E2E tests on every PR',
      wrong: `# Every PR triggers:
# unit tests (3 min) + integration tests (5 min) + E2E tests (25 min)
# = 33 minutes per PR
# E2E tests fail 20% of the time on infrastructure flakiness
# CI is slow AND untrustworthy`,
      right: `# PR pipeline: lint + unit + integration (under 8 min)
# Post-merge pipeline: + E2E tests (separate, slower, on main)
# Nightly: full regression suite including E2E
# E2E flakiness is isolated — doesn't block PR merges`,
      explanation: 'E2E tests are slow and inherently flaky (network, browsers, timeouts). Running them on every PR slows feedback and causes false failures that erode CI trust. Run fast unit and integration tests on PRs; schedule E2E on main post-merge or nightly. PRs need fast feedback.',
    },
    {
      title: 'Rebuilding the artifact for each environment',
      wrong: `# Build pipeline rebuilds app for staging:
# npm run build -- --configuration=staging
# Then rebuilds for production:
# npm run build -- --configuration=production
# The artifact deployed to prod was never tested in staging!
# Environment-specific configs compiled in — no parity`,
      right: `# Build ONCE: docker build → push with commit SHA tag
# Deploy the SAME image to staging, test it, then promote to prod
# Environment config via ENV VARS at runtime, not compile time
# What runs in staging is exactly what runs in production`,
      explanation: 'Building a separate artifact per environment breaks the "build once, deploy many" principle. The artifact tested in staging must be the exact bytes deployed to production. Use runtime configuration (env vars, config maps) instead of compile-time flags, and tag artifacts with commit SHAs for traceability.',
    },
    {
      title: 'Ignoring flaky tests',
      wrong: `# Test fails 15% of the time due to timing issues
# Team re-runs the pipeline when this test fails
# "It's just flaky, re-run it" becomes the norm
# Developers stop trusting CI results — begin ignoring failures
# One day a real bug is hidden by "it's probably just flaky"`,
      right: `# Flaky test protocol:
# 1. Detect: track which tests have the highest re-run rate
# 2. Quarantine: move to a separate job (no-block) while fixing
# 3. Fix within one sprint (timing, mocking, test isolation)
# 4. Restore to blocking CI
# Zero tolerance: flaky tests are bugs, not annoyances`,
      explanation: 'Flaky tests destroy CI trust. Once developers start saying "just re-run it," the pipeline loses its safety function. Track flakiness rates per test, quarantine flaky tests immediately (so they don\'t block PRs), fix them within a sprint, and treat a flaky test as a first-class bug.',
    },
  ];

  challenge: Challenge = {
    title: 'CI Build Time Analyser',
    language: 'typescript',
    description: `Build a function that analyses a CI pipeline run log and calculates statistics about each stage.

Given an array of pipeline step logs, each with a stage name, start time, and end time, compute:
1. Duration of each stage in seconds
2. Which stage took longest
3. Total pipeline duration
4. Which stages ran in parallel (overlapping time ranges)
5. Percentage of total time each stage consumed`,
    hints: [
      'Duration = endTime - startTime (both are Unix timestamps in seconds)',
      'Two stages are parallel if their time ranges overlap: A.start < B.end && B.start < A.end',
      'Total duration = max(all endTimes) - min(all startTimes), not sum of durations (parallel stages)',
      'Percentage = stage duration / total duration * 100, rounded to 1 decimal',
    ],
    starterCode: `interface StepLog {
  stage: string;
  startTime: number;  // Unix timestamp seconds
  endTime: number;
}

interface StepStats {
  stage: string;
  durationSeconds: number;
  percentOfTotal: number;
  parallel: boolean;
}

interface PipelineStats {
  steps: StepStats[];
  totalSeconds: number;
  slowestStage: string;
}

function analysePipeline(logs: StepLog[]): PipelineStats {
  // TODO: implement
  return { steps: [], totalSeconds: 0, slowestStage: '' };
}`,
    solution: `function analysePipeline(logs: StepLog[]): PipelineStats {
  if (logs.length === 0) return { steps: [], totalSeconds: 0, slowestStage: '' };

  const totalStart = Math.min(...logs.map(l => l.startTime));
  const totalEnd   = Math.max(...logs.map(l => l.endTime));
  const totalSeconds = totalEnd - totalStart;

  const isParallel = (a: StepLog, b: StepLog) =>
    a !== b && a.startTime < b.endTime && b.startTime < a.endTime;

  const steps: StepStats[] = logs.map(log => {
    const durationSeconds = log.endTime - log.startTime;
    const parallel = logs.some(other => isParallel(log, other));
    const percentOfTotal = Math.round((durationSeconds / totalSeconds) * 1000) / 10;
    return { stage: log.stage, durationSeconds, percentOfTotal, parallel };
  });

  const slowestStep = steps.reduce((max, s) => s.durationSeconds > max.durationSeconds ? s : max);

  return { steps, totalSeconds, slowestStage: slowestStep.stage };
}

// Test:
const logs: StepLog[] = [
  { stage: 'Lint',    startTime: 0,  endTime: 30  },
  { stage: 'Test-1',  startTime: 30, endTime: 120 },  // parallel
  { stage: 'Test-2',  startTime: 30, endTime: 100 },  // parallel
  { stage: 'Build',   startTime: 120, endTime: 180 },
];
console.log(analysePipeline(logs));
// totalSeconds: 180, slowestStage: "Test-1"
// Test-1 and Test-2 are parallel: true`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the "Green Build Contract" in CI?',
      options: [
        'A contract with your CI vendor guaranteeing uptime for green (successful) builds',
        'A team agreement that the main branch must always be in a passing, deployable state',
        'A setting in CI that auto-deploys to production when all tests pass',
        'A code review rule requiring all reviewers to approve before merging',
      ],
      answer: 1,
      explanation: 'The Green Build Contract is a team agreement: main/trunk is always passing, always deployable. A broken build is treated as a production incident — top priority to fix or revert, no new work until it\'s green. Without this agreement, CI is just a reporting tool, not a safety gate.',
    },
    {
      q: 'Why should you "build once, promote many" rather than rebuilding for each environment?',
      options: [
        'Building is expensive — rebuilding wastes cloud credits',
        'The artifact deployed to production must be the exact bytes tested in staging to guarantee parity',
        'CI tools can only build an artifact once per commit due to SHA constraints',
        'Rebuilding resets the version number which breaks semantic versioning',
      ],
      answer: 1,
      explanation: 'If you rebuild the application for production, you are deploying code that was never tested. The Docker image (or binary) tested in staging must be bit-for-bit identical to what goes to production. Environment differences (DB URLs, feature flags) should come from runtime env vars, not build-time compilation.',
    },
    {
      q: 'What is a flaky test and why is it harmful to CI?',
      options: [
        'A test with poor code style that fails linting — harmful because it blocks merges',
        'A test that intermittently passes and fails without code changes — harmful because it erodes CI trust and masks real failures',
        'A test with insufficient coverage — harmful because it misses bugs',
        'A test that only runs on certain OS versions — harmful because it creates platform gaps',
      ],
      answer: 1,
      explanation: 'A flaky test fails non-deterministically — due to race conditions, network timeouts, or shared state. When developers learn that "it\'s probably just flaky, re-run it," they start ignoring CI failures. Eventually a real bug is dismissed as a flaky test and ships to production. Flaky tests must be quarantined and fixed within a sprint.',
    },
    {
      q: 'What order should CI pipeline steps run in to minimise wasted time?',
      options: [
        'Slowest first, so fast checks can use idle runner time',
        'Fastest checks first (lint, static analysis), then slower ones (tests, build, security scan)',
        'Alphabetical order for predictability',
        'Security scan first, since security failures are the most critical',
      ],
      answer: 1,
      explanation: 'Fail fast on the cheapest check. Lint runs in seconds — if it fails, you haven\'t wasted 5 minutes of test time. Tests run in minutes — if they fail, you haven\'t run a 10-minute security scan. Fast-first ordering minimises wasted compute and gives developers quick feedback on the most common failure types.',
    },
    {
      q: 'What is the test pyramid and how should it influence CI pipeline structure?',
      options: [
        'Unit tests at top (few), E2E at bottom (many) — run E2E on every commit for maximum coverage',
        'Unit tests at bottom (many, fast), E2E at top (few, slow) — run units on every commit; E2E less frequently',
        'All test types should run equally often for balanced coverage',
        'The pyramid is a visual metaphor only — all test types run in the same pipeline step',
      ],
      answer: 1,
      explanation: 'The test pyramid has many fast unit tests at the base, fewer integration tests in the middle, and very few slow E2E tests at the top. In CI: unit tests on every commit (fastest, most reliable signal); integration tests on PR merge; E2E tests on a schedule or post-merge on main. This gives fast PR feedback while keeping the expensive E2E suite from blocking developers.',
    },
    {
      q: 'What is test flakiness in CI and why is it a serious problem?',
      options: [
        'Tests that fail due to slow network connections only',
        'Tests that pass sometimes and fail other times without code changes — erodes trust in the test suite and forces ignoring failures',
        'Tests that take more than 5 minutes to run',
        'Tests that only run on certain operating systems'],
      answer: 1,
      explanation: 'A flaky test fails intermittently without code changes — due to race conditions, time-dependent logic, network calls, or random data. When developers see failures, they assume "probably flaky, rerun" and merge failing code. Once a team ignores CI failures, CI loses all value. Fix: quarantine flaky tests immediately, fix or delete them. Track flakiness metrics to prevent accumulation.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between CI and CD?',
      a: 'CI (Continuous Integration) is the practice of frequently merging code and running automated tests — it ends with a verified, publishable artifact. CD has two meanings: Continuous Delivery means the artifact can be deployed to production at any time with a manual approval step; Continuous Deployment means every green build automatically deploys to production with no human intervention. CI is the prerequisite for both CD variants — you can\'t continuously deliver untested code.',
    },
    {
      q: 'How do you handle database migrations in CI?',
      a: 'Integration tests that need a real database: use Docker Compose in CI to spin up a fresh database instance. Apply migrations at the start of the test run (`dotnet ef database update`, `flyway migrate`, `alembic upgrade head`). Tear down after. Each CI run gets a clean, freshly-migrated database — no shared state between runs. Never run migrations against a shared CI database — concurrent builds corrupt state and cause intermittent failures.',
    },
    {
      q: 'What metrics indicate CI health?',
      a: 'Four key CI health metrics: (1) **Build duration**: trend toward shorter; alert if it grows >10% week-over-week. (2) **Build success rate**: target >95% on main; consistently below 90% means broken build culture. (3) **Flakiness rate**: percentage of failures that pass on re-run without code changes — target 0%, alarm at >5%. (4) **Mean time to green**: average time to fix a broken build — should be under 30 minutes. Most CI platforms expose these in dashboards; SonarQube also tracks code quality trends.',
    },
    {
      q: 'How do you speed up a slow CI build?',
      a: 'Priority order: (1) **Cache dependencies** — `npm ci` with npm cache can go from 3 minutes to 30 seconds. (2) **Parallelise tests** — Jest `--shard`, pytest-xdist, xUnit parallel. (3) **Fail-fast ordering** — lint before tests, unit tests before integration. (4) **Path filtering** — only run affected tests when paths change (Nx, Turborepo, Bazel). (5) **Move slow tests** — defer E2E and security scans to post-merge pipelines. (6) **Self-hosted runners** — more powerful hardware than GitHub\'s 2-core free runners.',
    },
    {
      q: 'What is mutation testing and is it practical for CI?',
      a: 'Mutation testing (Stryker for JS/TS, PIT for Java) modifies your source code in small ways (negate conditions, change operators) and checks that your tests catch each change. A test suite with 90% line coverage but poor assertion quality might catch only 50% of mutations. Mutation testing is too slow to run on every commit (hours for large codebases) — run it weekly, nightly, or gate it only on changed files. Use it as a code quality diagnostic, not a blocking CI check. The mutation score tells you if your tests actually test behaviour or just exercise code paths.',
    },
    {
      q: 'What properties make a good CI pipeline from a developer experience perspective?',
      a: 'A good CI pipeline has: (1) Fast feedback — under 10 minutes ideally, under 5 for small changes. Parallelise tests, cache dependencies, fail fast on the cheapest checks (lint, type check before running tests). (2) Reliable — no flaky tests, no order-dependent tests. Flakiness destroys trust. (3) Clear failure messages — pinpoint the broken test and the line causing failure, not just "build failed". (4) Deterministic — same inputs always produce same outputs. No network calls to unstable services. (5) Comprehensive — catches the bugs that would reach production. 100% unit test pass without integration tests is insufficient. (6) Automated rollback trigger — if a deployment fails its smoke tests, revert automatically.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'CI = merge frequently + automated build/test on every commit — fast feedback, green build contract, build once promote many; slow CI and flaky tests destroy the practice.',
    mustKnow: [
      'CI is a discipline first: merge frequently, treat broken main as a P1 incident',
      'Pipeline order: lint → unit tests → integration tests → build → security scan (fastest first)',
      'Build once, promote many: same artifact from CI to staging to prod; env config via runtime vars',
      'Test pyramid: many unit tests (every commit), fewer integration, few E2E (post-merge or nightly)',
      'Coverage threshold in CI: enforce minimum (e.g. 80%) as a build failure — not a vanity report',
      'Flaky tests must be quarantined and fixed within a sprint — never dismissed with "just re-run"',
      'Target under 10 minutes for PR feedback; under 5 minutes is ideal',
    ],
    interviewFocus: [
      'What is the difference between CI, Continuous Delivery, and Continuous Deployment?',
      'What is the test pyramid and how does it influence CI pipeline design?',
      'How would you reduce a 45-minute CI build to under 10 minutes?',
      'What does "build once, promote many" mean and why does it matter?',
    ],
  };
}
