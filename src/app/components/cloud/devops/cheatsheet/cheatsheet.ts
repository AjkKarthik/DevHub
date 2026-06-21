import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';

@Component({
  selector: 'app-devops-cheatsheet',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, QnaBlockComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss'
})
export class DevopsCheatsheet {

  quickRef: QuickRefItem[] = [
    { name: 'DORA: Deployment Frequency', type: 'keyword', desc: 'Elite: multiple times/day. High: weekly. Medium: monthly. Low: 6+ months' },
    { name: 'DORA: Lead Time for Changes', type: 'keyword', desc: 'Elite: < 1 hour. High: 1 day–1 week. Medium: 1 week–1 month. Low: > 1 month' },
    { name: 'DORA: Change Failure Rate', type: 'keyword', desc: 'Elite/High: 0–15%. Medium: 16–30%. Low: 46–60%' },
    { name: 'DORA: MTTR', type: 'keyword', desc: 'Mean Time To Recover. Elite: < 1 hour. High: < 1 day. Medium: 1–7 days. Low: > 6 months' },
    { name: 'SLO 99.9%', type: 'keyword', desc: '43.8 min/month downtime budget. 99.95% = 21.9 min. 99.99% = 4.4 min. 99.999% = 26 sec' },
    { name: 'Burn rate thresholds', type: 'keyword', desc: '>14.4× in 1h+5m = page (P1). >6× in 6h+30m = ticket. <1× = healthy' },
    { name: 'Git branch strategy', type: 'keyword', desc: 'Trunk-based: main + short-lived feature branches (<2 days). Gitflow: main, develop, feature/*, release/*, hotfix/*' },
    { name: 'SemVer quick rule', type: 'keyword', desc: 'MAJOR.MINOR.PATCH. feat: → MINOR. fix: → PATCH. feat!: / BREAKING CHANGE → MAJOR' },
    { name: 'Docker layer order', type: 'keyword', desc: 'COPY package*.json first → RUN npm install → COPY . . — changes to source do not bust dependency layer' },
    { name: 'Helm rollback', type: 'keyword', desc: 'helm rollback <release> <revision> — rolls back to a previous revision; use helm history to find revision numbers' },
    { name: 'Terraform plan risk', type: 'keyword', desc: 'destroy count 0 = safe. 1–2 = review. 3+ = risky. Any destroy of stateful resources (DB, volume) = manual approval' },
    { name: 'P1 SLA targets', type: 'keyword', desc: 'Typical: acknowledge in 5 min, resolve in 1 hour. Start incident call, assign commander, update status page every 15 min' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'DORA Metrics at a Glance',
      points: [
        'The four DORA metrics measure software delivery performance: Deployment Frequency (how often you ship), Lead Time for Changes (commit to production), Change Failure Rate (% of releases causing incidents), and MTTR (how fast you recover).',
        'Elite performers combine high deployment frequency with low change failure rate — speed and stability reinforce each other when you have good CI/CD practices.',
        'Lead time is the best predictor of team performance. Teams with < 1 hour lead time have better stability than teams with longer lead times, counter-intuitively — small frequent changes are easier to test and easier to roll back.',
        'Track DORA metrics monthly, trend quarterly. Use them to identify investment areas, not as targets to game — gaming DORA metrics (e.g. deploying trivial commits to boost frequency) defeats the purpose.',
      ]
    },
    {
      heading: 'Pipeline Stages Reference',
      points: [
        'Source stage: trigger on push or PR. Checkout code, set up environment, restore dependency cache.',
        'Build stage: compile, transpile, or bundle. Produce a versioned artefact. Fail fast — do not proceed if the build breaks.',
        'Test stage: unit tests (< 5 min), integration tests (< 15 min), code coverage gates (typically ≥ 80%), static analysis (SonarQube, linting).',
        'Scan stage: SAST (Semgrep/CodeQL), SCA/dependency scan (Snyk/Dependabot), secrets scan (gitleaks), container image scan (Trivy) — block on critical CVEs.',
        'Publish stage: push versioned Docker image to registry (GHCR/ACR/ECR), publish NuGet/npm packages. Tag with git SHA + semantic version.',
        'Deploy stage: dev auto-deploy on merge. Staging auto-deploy after dev passes smoke tests. Production requires manual approval gate or SLO-gated progressive rollout.',
      ]
    },
    {
      heading: 'Key Tool Quick Reference',
      points: [
        'GitHub Actions: on: push/pull_request, jobs with steps, matrix strategy for multi-version testing, reusable workflows with workflow_call, environment protection rules for prod approval.',
        'ArgoCD: Application CRD syncs Git repo to cluster. Sync policies: automated (self-healing) or manual. Health checks: Healthy/Progressing/Degraded/Missing. Rollback: sync to previous commit hash.',
        'Helm: helm install, upgrade --atomic (rolls back on failure), rollback, history. Values override: -f values-prod.yml. Dry run: --dry-run --debug.',
        'Terraform: plan → apply → (state in remote backend with locking). Key commands: init, validate, plan -out=tfplan, apply tfplan, destroy, state list, import.',
        'Prometheus: scrapes metrics every 15s by default. PromQL: rate() for per-second rates, increase() for counters over time, histogram_quantile() for percentiles.',
        'kubectl: apply -f, get pods -n namespace, describe pod, logs -f, exec -it, rollout status/history/undo, port-forward.',
      ]
    },
    {
      heading: 'Incident Response Quick Reference',
      points: [
        'Severity: P1 (critical, revenue/data loss, > 50% users affected) → 5 min ack, 1h resolve. P2 (major feature down) → 15 min ack, 4h resolve. P3 → ticket. P4 → backlog.',
        'First 5 minutes: acknowledge, join the incident channel, assign incident commander, post status page update ("Investigating reports of...").',
        'Triage order: (1) Is it real? Check the dashboard. (2) What is the impact? Users, revenue, data. (3) What changed recently? Last deploy, config change, traffic spike. (4) Can we roll back?',
        'Post-mortem within 48 hours: timeline, contributing factors (no blame), lessons learned, action items with owners and due dates. Publish to the team.',
        'MTTD goal: alert within 2–5 minutes of failure. MTTR goal: resolve within SLO window (P1 = 1h, P2 = 4h). Review post-mortem action item completion weekly.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Git Quick Reference',
      language: 'bash',
      code: `# ── Branch strategy (trunk-based) ────────────────────────────────────────
git checkout -b feature/add-dark-mode        # short-lived branch
git commit -m "feat(ui): add dark mode toggle"
git push origin feature/add-dark-mode
# Open PR → CI runs → code review → merge to main
# Delete branch after merge

# ── Conventional commit types ─────────────────────────────────────────────
# feat:     new feature → MINOR bump
# fix:      bug fix → PATCH bump
# feat!:    breaking change → MAJOR bump
# chore:    maintenance (no version bump)
# docs:     documentation only
# ci:       CI/CD changes
# refactor: code restructure (no bug fix, no feature)
# test:     adding or fixing tests
# perf:     performance improvement → PATCH bump

# ── Hotfix process ────────────────────────────────────────────────────────
git checkout v2.4.0                     # branch from production tag
git checkout -b hotfix/null-crash
# ... fix and commit ...
git tag -a v2.4.1 -m "Hotfix: null crash"
git push origin v2.4.1
git checkout main && git merge hotfix/null-crash && git push
git checkout development && git merge hotfix/null-crash && git push

# ── Useful git commands ───────────────────────────────────────────────────
git log --oneline --graph --all          # visualise branches
git bisect start HEAD v1.0              # find commit that introduced a bug
git bisect good / git bisect bad
git stash && git stash pop              # save/restore local changes
git cherry-pick <commit-sha>            # apply a single commit to current branch
git reflog                              # recover from accidental reset/rebase
git revert HEAD                         # safe undo: creates a new reverse commit`,
    },
    {
      label: 'Docker & Kubernetes',
      language: 'bash',
      code: `# ── Dockerfile best practices order ──────────────────────────────────────
# FROM node:22-alpine AS builder
# WORKDIR /app
# COPY package*.json ./          # <- manifests first (cache layer)
# RUN npm ci --only=production   # <- dep install (cached if manifest unchanged)
# COPY . .                       # <- source (only busts cache when code changes)
# RUN npm run build
#
# FROM node:22-alpine
# COPY --from=builder /app/dist ./dist
# USER node                      # <- non-root!
# EXPOSE 3000
# CMD ["node", "dist/server.js"]

# ── Docker CLI quick reference ────────────────────────────────────────────
docker build -t myapp:1.0.0 .
docker run -p 3000:3000 --env-file .env myapp:1.0.0
docker scan myapp:1.0.0                              # scan for CVEs
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:1.0.0 --push .

# ── kubectl quick reference ───────────────────────────────────────────────
kubectl get pods -n production
kubectl describe pod <pod-name> -n production
kubectl logs -f <pod-name> -n production --tail=100
kubectl exec -it <pod-name> -n production -- /bin/sh
kubectl rollout status deployment/api -n production
kubectl rollout history deployment/api -n production
kubectl rollout undo deployment/api -n production     # roll back
kubectl port-forward svc/api 8080:80 -n production   # local debug

# ── Helm quick reference ──────────────────────────────────────────────────
helm install api ./charts/api -f values-prod.yml -n production
helm upgrade api ./charts/api -f values-prod.yml --atomic -n production
helm rollback api 3 -n production                    # roll back to revision 3
helm history api -n production                       # list revisions
helm template api ./charts/api -f values-prod.yml   # render without deploying`,
    },
    {
      label: 'Terraform & IaC',
      language: 'bash',
      code: `# ── Terraform workflow ────────────────────────────────────────────────────
terraform init                    # initialise providers and backend
terraform validate                # check syntax
terraform plan -out=tfplan        # preview changes; always review before apply
terraform apply tfplan            # apply the saved plan
terraform destroy                 # tear down (requires confirmation)

# ── Useful state commands ─────────────────────────────────────────────────
terraform state list              # list all resources in state
terraform state show <resource>   # inspect a specific resource
terraform import <resource> <id>  # bring existing infra under Terraform
terraform taint <resource>        # mark for recreation next apply

# ── Terraform plan risk classification ───────────────────────────────────
# add:     safe — new resources, no existing impact
# change:  review — in-place update; check if it causes downtime
# destroy: RISKY — confirm the resource is truly unused
#   - Database/volume destroy = data loss risk
#   - Security group destroy = connectivity loss risk
#   Require manual approval in CI for any destroy

# ── Remote backend config (prevent state corruption) ─────────────────────
# terraform {
#   backend "azurerm" {
#     resource_group_name  = "tf-state-rg"
#     storage_account_name = "tfstate12345"
#     container_name       = "tfstate"
#     key                  = "prod.terraform.tfstate"
#   }
# }

# ── Bicep quick reference ─────────────────────────────────────────────────
# az bicep build --file main.bicep          # compile to ARM JSON
# az deployment group what-if ...           # preview changes
# az deployment group create \\
#   --template-file main.bicep \\
#   --parameters @params.json`,
    },
    {
      label: 'SLO / Monitoring Quick Reference',
      language: 'bash',
      code: `# ── SLO error budget table ────────────────────────────────────────────────
# SLO     | Downtime/month | Downtime/year
# 99%     | 7h 18m         | 3d 15h
# 99.5%   | 3h 39m         | 1d 19h
# 99.9%   | 43.8 min       | 8h 46m
# 99.95%  | 21.9 min       | 4h 23m
# 99.99%  | 4.4 min        | 52 min
# 99.999% | 26 sec         | 5.25 min

# ── Burn rate alert thresholds (30-day window) ────────────────────────────
# Burn rate | Time to exhaust budget | Alert severity
# 1×        | 30 days               | No alert (on track)
# 2×        | 15 days               | Monitor
# 6×        | 5 days                | Ticket / warning alert
# 14.4×     | ~50 hours             | PAGE immediately (P1)
# 36×       | 20 hours              | Critical P1

# ── PromQL cheat sheet ────────────────────────────────────────────────────
# Rate of HTTP 5xx errors per second (last 5m):
# rate(http_requests_total{status=~"5.."}[5m])

# 99th percentile latency:
# histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Availability SLI (success ratio):
# sum(rate(http_requests_total{status!~"5.."}[5m]))
#   / sum(rate(http_requests_total[5m]))

# Error budget remaining (99.9% SLO, 30d window):
# 1 - (
#   (1 - sum(rate(http_requests_total{status!~"5.."}[30d]))
#          / sum(rate(http_requests_total[30d])))
#   / (1 - 0.999)
# )

# ── Alertmanager routing example ──────────────────────────────────────────
# route:
#   receiver: slack-default
#   routes:
#     - match: { severity: page }
#       receiver: pagerduty
#       continue: false
#     - match: { severity: ticket }
#       receiver: jira
# receivers:
#   - name: pagerduty
#     pagerduty_configs: [{ service_key: '<key>' }]`,
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What are the four DORA metrics and what does each measure?',
      a: '(1) Deployment Frequency — how often you deploy to production. (2) Lead Time for Changes — time from a code commit to running in production. (3) Change Failure Rate — percentage of deployments that cause a production incident. (4) MTTR (Mean Time to Recover) — time to restore service after an incident. Elite performers are high on frequency and low on lead time/failure rate/MTTR simultaneously.'
    },
    {
      q: 'What is the CI/CD pipeline stage order and what happens at each stage?',
      a: 'Source (checkout, cache restore) → Build (compile/bundle, fail fast) → Test (unit, integration, coverage gate) → Scan (SAST, SCA, secrets, container) → Publish (push versioned image/package) → Deploy (dev auto-deploy, staging auto, prod with approval gate or progressive rollout).'
    },
    {
      q: 'How does a blue/green deployment differ from a canary deployment?',
      a: 'Blue/green: run two identical environments (blue = current, green = new). Switch 100% of traffic to green at once when it is validated. Rollback is instant — flip traffic back to blue. Canary: gradually shift a small % of traffic to the new version (e.g. 5% → 25% → 100%) over time. Rollback is partial removal of canary traffic. Canary reduces blast radius but takes longer; blue/green is binary but faster to switch.'
    },
    {
      q: 'What does "shift left on security" mean in DevSecOps?',
      a: 'Run security checks as early as possible in the development process — not as a final gate before release. Specifically: SAST runs on every commit, dependency scanning runs on every PR, secrets scanning runs as a pre-commit hook, container scanning runs in the build stage, and IaC policy gates run in the plan stage. Vulnerabilities found in code review cost 6× less to fix than ones found in production.'
    },
    {
      q: 'What is GitOps and how does it differ from traditional CD?',
      a: 'GitOps uses Git as the single source of truth for both application code AND infrastructure configuration. A GitOps operator (ArgoCD, Flux) continuously compares the desired state in Git with the actual cluster state and reconciles any drift — automatically. Traditional CD pushes changes imperatively (pipeline runs kubectl apply). GitOps is declarative and pull-based — the cluster pulls from Git rather than the pipeline pushing to the cluster. Benefits: audit trail, rollback via git revert, self-healing against manual cluster changes.'
    },
    {
      q: 'What is the difference between a SLI, SLO, SLA, and error budget?',
      a: 'SLI = the metric you measure (e.g. % of requests completing in < 200ms). SLO = your internal target for that metric (e.g. 99.9% of requests complete in < 200ms over 30 days). SLA = the external contractual promise (typically looser than SLO, breach triggers compensation). Error budget = 1 − SLO; the permissible amount of unreliability (0.1% = 43.8 minutes/month at 99.9%). When the budget is exhausted, freeze new feature releases until it replenishes.'
    },
    {
      q: 'What is toil and why does the SRE book say it should be < 50% of time?',
      a: 'Toil is manual, repetitive, automatable work that scales with service load and provides no enduring value — e.g. manually restarting pods, answering the same noisy alert, manually scaling before every traffic event. If toil exceeds 50% of SRE time, the team cannot do the engineering work needed to improve reliability; they become a manual operations team. Keeping toil below 50% preserves capacity for automation, tooling, and system improvements that permanently reduce future toil.'
    },
  ];
}
