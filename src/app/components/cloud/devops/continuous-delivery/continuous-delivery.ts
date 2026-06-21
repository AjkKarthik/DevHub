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
  selector: 'app-devops-continuous-delivery',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './continuous-delivery.html',
  styleUrl: './continuous-delivery.scss'
})
export class DevopsContinuousDelivery {

  quickRef: QuickRefItem[] = [
    { name: 'Continuous Delivery',    type: 'keyword', desc: 'Every green build CAN be deployed to production — requires manual approval gate' },
    { name: 'Continuous Deployment',  type: 'keyword', desc: 'Every green build IS automatically deployed to production — no human gate' },
    { name: 'Deployment Pipeline',    type: 'keyword', desc: 'Automated path from commit to production: CI → staging deploy → smoke test → prod deploy' },
    { name: 'Blue/Green Deployment',  type: 'keyword', desc: 'Two identical environments; switch traffic from blue (old) to green (new) with instant rollback' },
    { name: 'Canary Release',         type: 'keyword', desc: 'Route a small % of traffic to new version; monitor; ramp up; roll back if metrics degrade' },
    { name: 'Rolling Update',         type: 'keyword', desc: 'Replace old instances with new ones gradually, one batch at a time' },
    { name: 'Smoke Test',             type: 'keyword', desc: 'Fast post-deploy check: are the key endpoints responding? Triggers rollback if they fail' },
    { name: 'Rollback',               type: 'keyword', desc: 'Return to the previous known-good deployment — should be automated and take < 5 minutes' },
    { name: 'Dark Launch',            type: 'keyword', desc: 'Deploy new code path behind a disabled feature flag — in prod but unreachable to users' },
    { name: 'Change Failure Rate',    type: 'keyword', desc: 'DORA metric: percentage of deployments causing a service incident or rollback' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'CD vs CD: Delivery vs Deployment',
      points: [
        'Continuous Delivery: every passing build produces a release candidate that CAN be deployed to production — but a human must press the button.',
        'Continuous Deployment: every passing build IS automatically deployed to production — no human approval step.',
        'Neither is inherently better. Continuous Deployment is ideal for web apps with good observability and automated rollback. Continuous Delivery is appropriate when regulatory approval, customer coordination, or large batch changes require a gate.',
        'Both require: the same CI discipline (all tests passing), a staging environment, smoke tests, and an automated rollback mechanism.',
        'Common misconception: "Continuous Delivery" does NOT mean deploying all the time — it means you COULD deploy at any time. The distinction is intent, not frequency.',
      ]
    },
    {
      heading: 'Deployment Strategies',
      points: [
        '**Blue/Green**: two identical production environments (blue = current, green = new). Switch DNS/load balancer to green. Rollback = switch back to blue. Zero downtime; instant rollback; doubles infrastructure cost.',
        '**Canary Release**: route a small percentage of traffic (1–5%) to the new version. Monitor error rates, latency, business metrics. If healthy, ramp to 100%. If degraded, route back to old version. Catches regressions on real traffic before full rollout.',
        '**Rolling Update**: replace instances one batch at a time. Old and new versions run simultaneously during rollout. No extra infrastructure; slow rollback (must redeploy old version). Kubernetes default for Deployments.',
        '**Recreate**: take down all old instances, then deploy all new. Causes downtime — only for non-critical batch jobs or when schema changes require coordinated cutover.',
        'Choose by blast radius tolerance: Recreate > Rolling > Blue/Green > Canary (risk decreasing, complexity increasing).',
      ]
    },
    {
      heading: 'The Deployment Pipeline',
      points: [
        'A deployment pipeline models the path from commit to production: CI (build/test) → staging deploy → integration tests → approval gate → production deploy → smoke test.',
        'Every stage produces confidence: CI validates correctness; staging validates in a production-like environment; approval adds human judgement; smoke tests validate the actual deployment.',
        'Staging should mirror production as closely as possible: same Docker image, same infrastructure config, production-like data volume (anonymised).',
        'Promotion: the artifact deployed to staging is the exact artifact (same Docker digest) deployed to production. Never rebuild.',
        'Frequency: the DORA metric "Deployment Frequency" measures how often you reach production. Elite performers deploy multiple times per day. This requires the pipeline to be fast, reliable, and automated.',
      ]
    },
    {
      heading: 'Smoke Tests & Health Checks',
      points: [
        'A smoke test runs immediately after deployment: hit key endpoints, check critical user journeys, verify database connectivity.',
        'Smoke tests should complete in under 2 minutes — they are the automated equivalent of "did the service start correctly?"',
        'Health check endpoints (`/health`, `/ready`) are the first smoke test: if the service reports unhealthy, the deployment failed.',
        'Kubernetes: `readinessProbe` prevents traffic from routing to a pod until it reports ready. `livenessProbe` restarts pods that become unhealthy.',
        'Automated rollback trigger: if smoke tests fail OR error rate spikes above threshold within 5 minutes post-deploy, automatically revert to previous version.',
      ]
    },
    {
      heading: 'Rollback Strategies',
      points: [
        'Rollback must be automated and fast — target < 5 minutes from detection to rollback complete.',
        'Image-based rollback: Kubernetes `kubectl rollout undo` reverts to the previous ReplicaSet. Blue/green: switch load balancer back to blue. Both are seconds.',
        'Database migration rollback is harder: forward-only migrations (additive only) make rollback of app code safe even when DB has migrated. Never remove columns in the same deploy that stops using them.',
        'Feature flags as rollback: disable a flag to "roll back" a feature without redeploying. Works only for features behind flags — not for infrastructure changes.',
        'Post-incident: after rollback, the broken version must be fixed (not just bypassed). Root cause analysis leads to either code fix or improved deployment automation.',
      ]
    },
    {
      heading: 'DORA Metrics for CD',
      points: [
        'The four DORA metrics measure CD maturity: Deployment Frequency, Lead Time for Changes, Change Failure Rate, Mean Time to Restore (MTTR).',
        'Deployment Frequency: how often you successfully deploy to production. Elite: multiple per day. High: once per day to weekly. Medium: monthly. Low: every 6+ months.',
        'Lead Time for Changes: time from commit to production. Elite: < 1 hour. High: 1 day to 1 week. This is why slow CI and long staging cycles hurt.',
        'Change Failure Rate: what percentage of deployments cause an incident. Elite: 0–15%. High: 16–30%. Canary deploys reduce this by limiting blast radius.',
        'MTTR: how long to restore after an incident. Elite: < 1 hour. MTTR depends on: alert detection time + rollback speed + smoke test automation.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Blue/Green Deploy (Kubernetes)',
      language: 'bash',
      code: `# Blue/Green deployment with Kubernetes + Service selector

# Current state: blue deployment is live
# blue-deployment.yaml and green-deployment.yaml both exist
# Service selector points to: version: blue

# Step 1: Deploy new version to green (no traffic yet)
kubectl apply -f green-deployment.yaml
# green-deployment.yaml labels: version: green, app: myapp

# Step 2: Wait for green to be ready
kubectl rollout status deployment/myapp-green --timeout=120s

# Step 3: Run smoke tests against green directly
kubectl port-forward svc/myapp-green-internal 8080:80 &
curl -f http://localhost:8080/health
curl -f http://localhost:8080/api/status

# Step 4: Switch traffic to green (instant, atomic)
kubectl patch service myapp -p '{"spec":{"selector":{"version":"green"}}}'
echo "Traffic now routing to green"

# Step 5: Monitor for 5 minutes
sleep 300
ERROR_RATE=$(curl -s http://prometheus:9090/query --data-urlencode \
  'query=rate(http_requests_total{status=~"5.."}[1m])' | jq '.data.result[0].value[1]')

if [ "$ERROR_RATE" -gt "0.05" ]; then
  echo "Error rate high — rolling back to blue"
  kubectl patch service myapp -p '{"spec":{"selector":{"version":"blue"}}}'
else
  echo "Green healthy — retiring blue"
  kubectl delete deployment myapp-blue
fi`,
    },
    {
      label: 'Canary with GitHub Actions',
      language: 'bash',
      code: `# Canary deployment pipeline — GitHub Actions
# .github/workflows/deploy-canary.yml

# name: Canary Deploy
# on:
#   push:
#     branches: [main]
#
# jobs:
#   deploy-canary:
#     runs-on: ubuntu-latest
#     environment: production
#     steps:
#       - uses: actions/checkout@v4
#
#       - name: Deploy canary (10% traffic)
#         run: |
#           # Kubernetes: set canary weight via annotation
#           kubectl set image deployment/myapp-canary \
#             myapp=ghcr.io/myorg/myapp:BUILD_SHA
#           kubectl annotate ingress myapp-ingress \
#             nginx.ingress.kubernetes.io/canary-weight="10"
#
#       - name: Wait and check error rate
#         run: |
#           sleep 300  # monitor for 5 minutes
#
#           # Query Prometheus error rate for canary
#           ERROR_RATE=$(curl -s "http://prom/api/v1/query" \
#             --data-urlencode 'query=rate(errors_total{version="canary"}[5m])' \
#             | jq -r '.data.result[0].value[1] // "0"')
#
#           echo "Canary error rate: $ERROR_RATE"
#           if awk "BEGIN {exit !($ERROR_RATE > 0.05)}"; then
#             echo "ERROR: Canary degraded — rolling back"
#             kubectl annotate ingress myapp-ingress \
#               nginx.ingress.kubernetes.io/canary-weight="0"
#             exit 1
#           fi
#
#       - name: Promote canary to 100%
#         if: success()
#         run: |
#           # Full rollout
#           kubectl set image deployment/myapp myapp=ghcr.io/myorg/myapp:BUILD_SHA
#           kubectl rollout status deployment/myapp
#           # Remove canary
#           kubectl annotate ingress myapp-ingress \
#             nginx.ingress.kubernetes.io/canary-weight-`,
    },
    {
      label: 'Smoke Test & Rollback',
      language: 'bash',
      code: `#!/bin/bash
# smoke-test.sh — run after every deployment

set -e

BASE_URL="\${BASE_URL:-http://localhost:8080}"
MAX_RETRIES=5

check_endpoint() {
  local path="$1"
  local expected_status="$2"
  local retry=0

  while [ $retry -lt $MAX_RETRIES ]; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
    if [ "$status" = "$expected_status" ]; then
      echo "PASS: $path returned $status"
      return 0
    fi
    retry=$((retry + 1))
    echo "Retry $retry/$MAX_RETRIES: $path returned $status (expected $expected_status)"
    sleep 5
  done

  echo "FAIL: $path did not return $expected_status after $MAX_RETRIES retries"
  return 1
}

echo "=== Smoke Tests for $BASE_URL ==="

check_endpoint "/health"  "200"
check_endpoint "/ready"   "200"
check_endpoint "/api/v1/status" "200"
check_endpoint "/api/v1/products" "200"

echo "=== All smoke tests passed ==="

# In CI pipeline — auto-rollback on failure:
# if ! ./smoke-test.sh; then
#   echo "Smoke tests failed — rolling back"
#   kubectl rollout undo deployment/myapp
#   kubectl rollout status deployment/myapp
#   exit 1
# fi`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Confusing Continuous Delivery and Continuous Deployment',
      wrong: `// "We do Continuous Delivery" — means:
// Deploy automatically to production on every commit
// No approval gate, no staging validation
// Actually: this is Continuous DEPLOYMENT
// For regulated industry, this may violate compliance requirements`,
      right: `// Continuous Delivery: build CAN go to prod at any time
//   → staging deploy is automated, prod requires human approval
// Continuous Deployment: build IS automatically deployed to prod
//   → no human gate; requires excellent observability + rollback
// Pick the right model for your risk tolerance and regulations`,
      explanation: 'These terms are often confused. Continuous Delivery requires a deployment to be "ready" at all times but keeps a human approval gate for production. Continuous Deployment removes that gate. Neither is universally correct — regulatory environments (healthcare, finance) often mandate Continuous Delivery over Deployment.',
    },
    {
      title: 'No automated rollback',
      wrong: `# Deploy to production
kubectl set image deployment/myapp myapp=newimage:latest
# No health check, no automatic rollback
# If it breaks: on-call engineer wakes up at 3am
# Manually diagnoses, figures out rollback command, executes
# MTTR: 45 minutes`,
      right: `# Deploy with automatic rollback:
kubectl set image deployment/myapp myapp=newimage:latest
kubectl rollout status deployment/myapp --timeout=120s || {
  echo "Rollout failed — rolling back"
  kubectl rollout undo deployment/myapp
  exit 1
}
# MTTR: < 2 minutes`,
      explanation: 'Manual rollback under pressure at 3am is slow and error-prone. Automated rollback — triggered by failed readiness probes, smoke test failure, or error rate spike — is faster and doesn\'t require waking someone up. Target: detection + rollback complete in under 5 minutes.',
    },
    {
      title: 'Deploying database schema changes in the same release as code changes',
      wrong: `# Release v2.0 deploys:
# 1. Renames 'user_name' column to 'full_name' in DB migration
# 2. Updates app code to use 'full_name'
# During rolling update: old app code sees 'full_name', crashes
# Or: new app code deploys first, tries 'full_name' that doesn't exist yet
# Either way: production downtime`,
      right: `# Expand-contract (3 phases):
# Phase 1: add 'full_name' column (keep 'user_name') + dual-write in app
# Phase 2: backfill 'full_name', switch reads to 'full_name'
# Phase 3: remove 'user_name' column (weeks later, after validation)
# Each phase is a safe, independent deployment`,
      explanation: 'Combining breaking schema changes with code changes in one deployment is a common cause of production incidents. Use the expand-contract pattern: make the schema change backward-compatible first (add new column, keep old one), then migrate app code, then finally remove the old column in a separate later deployment.',
    },
    {
      title: 'Staging environment that doesn\'t mirror production',
      wrong: `# Staging: 1 app instance, SQLite, no Redis, HTTP only, fake email
# Production: 10 instances, PostgreSQL, Redis cluster, HTTPS, real SMTP
# "Works in staging" means nothing — the environments are too different
# Race conditions and resource exhaustion only appear in prod`,
      right: `# Staging: same Docker image as prod, PostgreSQL, Redis, HTTPS
# Anonymised production data dump for realistic volume testing
# Same infrastructure-as-code (Terraform/Bicep) with different sizes
# Staging validates: migrations, performance, config, integrations`,
      explanation: 'Staging is only useful if it catches production issues before they reach production. A staging environment that differs significantly from production in database, infrastructure, or data volume gives false confidence. Use the same IaC templates with different sizing, and the same Docker image — never rebuild.',
    },
    {
      title: 'Deploying to production on Fridays',
      wrong: `# Friday 4:30 PM: "Quick deploy before the weekend"
# Issue discovered Friday 6 PM
# On-call engineer works through weekend
# Monday: "we should have a no-Friday-deploy rule"
# Next Friday: repeat`,
      right: `# Deploy schedule policy:
# Deploy window: Monday–Thursday, 10am–3pm
# No deploys on Fridays, holiday eves, or during business-critical events
# Exception: emergency hotfixes only, with on-call team available
# Automated deploy freeze can be enforced via environment gates`,
      explanation: 'Deploying late Friday gives minimal time to observe and react before everyone goes offline. Issues discovered Friday evening linger through the weekend. Establish a deployment window policy: deployments only during business hours on weekdays, with engineering on-call capacity available for at least 2 hours post-deploy.',
    },
    {
      title: 'Not measuring Change Failure Rate',
      wrong: `# Team deploys 50 times per month
# 8 deployments cause incidents
# No one tracks this — incidents are resolved and forgotten
# The same fragile component is deployed repeatedly
# Same class of failures recurs monthly
# "We deploy a lot" sounds good; 16% change failure rate is a crisis`,
      right: `# Track CFR in your incident management tool:
# - Tag incidents with triggering deployment
# - Calculate monthly: incidents / deployments
# - Target: < 15% (DORA "High" threshold)
# - Post-incident review: categorise root cause
# - Fix systemic issues (missing tests, missing smoke tests, bad IaC)`,
      explanation: 'Without measuring Change Failure Rate, you don\'t know if your CD pipeline is actually safe. High deployment frequency with high CFR is worse than lower frequency with low CFR. Track which deployments cause incidents, identify patterns, and use that data to invest in the right quality improvements.',
    },
  ];

  challenge: Challenge = {
    title: 'Deployment Risk Scorer',
    language: 'typescript',
    description: `Build a function that scores a deployment's risk level based on its characteristics.

Risk factors (each adds to the score):
- changeSize > 500 lines: +30 points
- changeSize > 100 lines: +15 points
- hasDbMigration: +25 points
- isNewService: +20 points
- deploymentTime is Friday after 15:00 or weekend: +40 points
- noSmokeTests: +35 points
- noStagingValidation: +30 points
- dependencyCount > 5 changed deps: +20 points

Risk levels:
- 0–20: LOW (safe to deploy)
- 21–50: MEDIUM (proceed with caution)
- 51–80: HIGH (require approval gate)
- 81+:   CRITICAL (strongly recommend deferring)`,
    hints: [
      'deploymentTime is a Date object — use getDay() (0=Sun, 6=Sat) and getHours()',
      'Add each applicable factor\'s points to a running total',
      'Return both the score and the risk level string',
      'Use a helper to determine the label from the score threshold',
    ],
    starterCode: `interface DeploymentProfile {
  changeSize: number;          // lines changed
  hasDbMigration: boolean;
  isNewService: boolean;
  deploymentTime: Date;
  noSmokeTests: boolean;
  noStagingValidation: boolean;
  dependencyCount: number;     // number of changed dependencies
}

interface RiskScore {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: string[];
}

function scoreDeploymentRisk(profile: DeploymentProfile): RiskScore {
  // TODO: implement
  return { score: 0, level: 'LOW', factors: [] };
}`,
    solution: `function scoreDeploymentRisk(profile: DeploymentProfile): RiskScore {
  let score = 0;
  const factors: string[] = [];

  if (profile.changeSize > 500) {
    score += 30; factors.push('Very large change (>500 lines): +30');
  } else if (profile.changeSize > 100) {
    score += 15; factors.push('Large change (>100 lines): +15');
  }

  if (profile.hasDbMigration) {
    score += 25; factors.push('Database migration included: +25');
  }

  if (profile.isNewService) {
    score += 20; factors.push('New service deployment: +20');
  }

  const day   = profile.deploymentTime.getDay();
  const hour  = profile.deploymentTime.getHours();
  const isFridayAfternoon = day === 5 && hour >= 15;
  const isWeekend = day === 0 || day === 6;
  if (isFridayAfternoon || isWeekend) {
    score += 40; factors.push('Deploying Friday afternoon or weekend: +40');
  }

  if (profile.noSmokeTests) {
    score += 35; factors.push('No smoke tests configured: +35');
  }

  if (profile.noStagingValidation) {
    score += 30; factors.push('No staging validation: +30');
  }

  if (profile.dependencyCount > 5) {
    score += 20; factors.push('Many dependency changes (>5): +20');
  }

  const level = score <= 20 ? 'LOW'
    : score <= 50 ? 'MEDIUM'
    : score <= 80 ? 'HIGH'
    : 'CRITICAL';

  return { score, level, factors };
}

// Test — Friday 4pm deploy with DB migration and no smoke tests:
console.log(scoreDeploymentRisk({
  changeSize: 250,
  hasDbMigration: true,
  isNewService: false,
  deploymentTime: new Date('2025-01-17T16:00:00'),  // Friday
  noSmokeTests: true,
  noStagingValidation: false,
  dependencyCount: 2,
}));
// score: 15 (change) + 25 (db) + 40 (friday) + 35 (no smoke) = 115, level: CRITICAL`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between Continuous Delivery and Continuous Deployment?',
      options: [
        'Continuous Delivery deploys automatically; Continuous Deployment requires manual approval',
        'Continuous Delivery requires a manual approval gate to production; Continuous Deployment deploys automatically',
        'Continuous Delivery is for web apps; Continuous Deployment is for mobile apps',
        'They are different names for the same practice',
      ],
      answer: 1,
      explanation: 'In Continuous Delivery, every green build CAN go to production but a human must approve the production deployment. In Continuous Deployment, every green build automatically IS deployed to production without a human gate. CD (Delivery) gives business control over release timing; CD (Deployment) maximises deployment frequency.',
    },
    {
      q: 'In a blue/green deployment, what happens during a rollback?',
      options: [
        'The green environment is rebuilt with the old code and traffic is re-routed',
        'The load balancer or DNS is switched back to point to the blue (old) environment',
        'The database is restored from backup and both environments are redeployed',
        'Kubernetes performs a rolling update reverting each pod one at a time',
      ],
      answer: 1,
      explanation: 'In blue/green, both environments run simultaneously. Rollback is simply switching the load balancer or DNS back to blue — it takes seconds. There is no rebuild, no redeployment, no data restore needed. This instant rollback capability is the primary advantage of blue/green over rolling updates.',
    },
    {
      q: 'What is the "expand-contract" pattern for database changes?',
      options: [
        'Expanding the database cluster before deployment, then contracting it post-deployment to save costs',
        'Adding new schema elements while keeping old ones, migrating data, then removing old elements in separate deployments',
        'Running schema migrations before deploying code, then rolling back the schema if the code deploy fails',
        'Using database read replicas for staging and the primary for production',
      ],
      answer: 1,
      explanation: 'Expand-contract (also called parallel change): (1) Expand — add new column/table without removing old; (2) Migrate — update app to write to both, backfill new structure; (3) Contract — remove old structure weeks later once no code references it. Each phase is a safe independent deployment. Never remove a column in the same deploy that stops using it.',
    },
    {
      q: 'What is a canary release and what is its primary advantage?',
      options: [
        'A release deployed only to internal (canary) users before going public',
        'A release deployed to a small percentage of production traffic so real-world impact is limited before full rollout',
        'A release that only runs automated tests on canary/staging servers before production',
        'A release with a short TTL that automatically expires after 24 hours if not promoted',
      ],
      answer: 1,
      explanation: 'A canary release routes a small percentage of real production traffic (e.g., 1–5%) to the new version while the rest continues on the old version. If the new version has problems (high error rate, latency regression), only a small fraction of users are affected and traffic can be routed back. This limits blast radius compared to deploying to all users at once.',
    },
    {
      q: 'Which DORA metric directly measures how safe your deployments are?',
      options: [
        'Deployment Frequency — higher frequency means more confidence',
        'Lead Time for Changes — shorter lead time means less risk accumulates',
        'Change Failure Rate — percentage of deployments that cause production incidents',
        'Mean Time to Restore — how quickly you recover from all incidents',
      ],
      answer: 2,
      explanation: 'Change Failure Rate (CFR) directly measures deployment quality: what percentage of your deployments cause a production incident requiring hotfix or rollback. Elite performers achieve 0–15% CFR. A high deployment frequency with a high CFR means you are deploying problems frequently. CFR is the best signal for "are our releases actually safe?"',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do you decide between blue/green, canary, and rolling update strategies?',
      a: 'Choose by risk tolerance and infrastructure cost: **Rolling** — simple, uses existing capacity, but old and new versions co-exist during rollout (risky for breaking API changes). **Blue/Green** — instant rollback, zero downtime, but doubles infrastructure cost during deployment; best for apps where you need instant rollback and can afford the cost. **Canary** — minimises blast radius by testing on a real traffic slice before full rollout; best for high-traffic apps where even 1% of users is enough signal; requires good observability (metrics per version). Most teams start with rolling, graduate to canary when they have observability.',
    },
    {
      q: 'How do you handle zero-downtime database migrations in a continuous deployment pipeline?',
      a: 'The expand-contract pattern: Phase 1 (backward-compatible migration) — add new column with a default, keep old column; deploy new app code that writes to both columns. Phase 2 (backfill) — background job updates existing rows to populate new column. Phase 3 (contract) — in a later deployment, remove old column after confirming no code reads it. Never remove a column in the same release that stops using it — during a rolling update, old pods still need the old column. Additionally: run migrations before code deploy (flyway, liquibase) and make them idempotent and reversible where possible.',
    },
    {
      q: 'What should a smoke test cover and how fast should it run?',
      a: 'Smoke tests should cover: (1) Service health endpoints (`/health`, `/ready`), (2) Critical API endpoints return 200 (products list, user auth, checkout), (3) Database connectivity (health check already verifies this typically), (4) Key downstream service integrations (payment gateway reachable). They should NOT cover business logic or edge cases — that\'s what CI tests do. Target: under 2 minutes. Smoke tests are the difference between "deployment succeeded" and "deployment succeeded and the service actually works." Failed smoke tests must trigger automatic rollback.',
    },
    {
      q: 'How do you deploy to production with zero downtime in Kubernetes?',
      a: 'Kubernetes rolling update with: (1) `strategy: type: RollingUpdate` with `maxSurge: 1` (allow 1 extra pod) and `maxUnavailable: 0` (never take a pod down without a replacement ready). (2) `readinessProbe` on the container — Kubernetes only routes traffic to a pod once it passes the readiness probe. (3) `minReadySeconds: 30` — wait 30 seconds after a pod becomes ready before proceeding to the next. (4) `preStop: sleep 5` hook — gives the load balancer time to stop routing to the pod before it shuts down. Together these ensure traffic is never routed to an unready pod or dropped during termination.',
    },
    {
      q: 'What is a "feature flag" and how does it relate to continuous deployment?',
      a: 'A feature flag (or feature toggle) wraps a code path so it can be enabled/disabled at runtime without redeployment: `if (flags.newCheckout) { newFlow() } else { oldFlow() }`. In continuous deployment, feature flags decouple deployment from release: you deploy the new code to 100% of servers with the flag OFF (dark launch), then gradually enable it for 1% → 10% → 100% of users, monitoring at each step. Flags enable: (1) deploying incomplete features safely (no need for long-lived feature branches), (2) instant rollback (flip the flag instead of redeploying), (3) A/B testing and progressive rollouts. Tools: LaunchDarkly, Unleash, AWS AppConfig.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'CD: Delivery = CAN deploy (manual gate) vs Deployment = IS deployed (auto); deployment strategies: Blue/Green (instant rollback), Canary (blast radius limit), Rolling (simple); always automate rollback and smoke test.',
    mustKnow: [
      'Continuous Delivery: every build ready for prod, human approves; Continuous Deployment: auto-deploys to prod',
      'Blue/Green: instant rollback by switching LB; doubles infra cost during deploy',
      'Canary: route % of traffic to new version; monitor; ramp up or roll back based on metrics',
      'Rolling update: default Kubernetes strategy; old+new co-exist during rollout; rollback via kubectl rollout undo',
      'Expand-contract for DB changes: add new, dual-write, backfill, remove old — in separate deployments',
      'Smoke tests: run post-deploy, under 2 minutes, trigger auto-rollback on failure',
      'DORA Change Failure Rate: % of deploys causing incidents — target < 15%',
    ],
    interviewFocus: [
      'What is the difference between Continuous Delivery and Continuous Deployment?',
      'Compare blue/green vs canary vs rolling update deployment strategies',
      'How do you handle zero-downtime database schema changes?',
      'What DORA metrics do you use to measure CD pipeline health?',
    ],
  };
}
