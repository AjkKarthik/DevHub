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
  selector: 'app-devops-incident-response',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './incident-response.html',
  styleUrl: './incident-response.scss'
})
export class DevopsIncidentResponse {

  quickRef: QuickRefItem[] = [
    { name: 'MTTD', type: 'keyword', desc: 'Mean Time To Detect — how long from incident start until it is identified; lower is better' },
    { name: 'MTTR', type: 'keyword', desc: 'Mean Time To Recover — how long from detection until service is restored; key DORA metric' },
    { name: 'Severity P1–P4', type: 'keyword', desc: 'P1 = total outage (page immediately); P2 = major degradation; P3 = minor; P4 = informational' },
    { name: 'Runbook', type: 'keyword', desc: 'Step-by-step troubleshooting guide for a specific alert or failure scenario; linked from alert rules' },
    { name: 'Incident Commander', type: 'keyword', desc: 'Single person coordinating response during a major incident — owns communication, delegates investigation' },
    { name: 'PagerDuty', type: 'keyword', desc: 'On-call scheduling and alert routing platform; escalation policies if primary on-call does not respond' },
    { name: 'Escalation policy', type: 'keyword', desc: 'Automatic escalation chain: primary on-call → secondary → manager if unacknowledged within N minutes' },
    { name: 'Blameless post-mortem', type: 'keyword', desc: 'Root-cause analysis focused on system failures, not individual blame; completed within 48h of resolution' },
    { name: 'Error budget', type: 'keyword', desc: 'Remaining time that can be "spent" on downtime before an SLO is breached; link to release decisions' },
    { name: 'Chaos engineering', type: 'keyword', desc: 'Deliberately inject failures (kill pods, partition networks) to find weaknesses before they cause real incidents' },
    { name: 'Status page', type: 'keyword', desc: 'External page (Statuspage.io, Cachet) showing current service health and incident updates to customers' },
    { name: 'DORA metrics', type: 'keyword', desc: 'Deployment Frequency, Lead Time, Change Failure Rate, MTTR — measure DevOps performance' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Incident severity levels',
      points: [
        'P1 (Critical): complete service outage or data loss — all customers affected. Page the on-call immediately; escalate to management; open incident bridge. SLA: acknowledge in 5 minutes, resolve in 1 hour.',
        'P2 (High): major feature degraded or significant percentage of customers affected. Page on-call, open incident channel, notify stakeholders. SLA: acknowledge in 15 minutes, resolve in 4 hours.',
        'P3 (Medium): minor feature degraded, small subset of customers affected, workaround exists. Ticket in the backlog, fix in current sprint. No pager required.',
        'P4 (Low): cosmetic issue, no customer impact, informational. Log as a task; fix when convenient.',
        'Always declare an incident conservatively — it is easier to downgrade P1 to P2 once you have more information than to upgrade a P3 that turns into a full outage.',
      ]
    },
    {
      heading: 'On-call rotations and escalation',
      points: [
        'On-call rotation: team members take turns as primary on-call for a period (typically 1 week). Secondary on-call backs up if primary is unavailable.',
        'Escalation policy: if the primary on-call does not acknowledge a P1 alert within 5 minutes, PagerDuty automatically pages the secondary. After another 5 minutes, it pages the on-call manager.',
        'Handoff notes: at the end of each rotation, the outgoing on-call writes a brief handoff — ongoing incidents, known issues, areas to watch. The incoming on-call reads it before taking over.',
        'On-call hygiene: reduce alert fatigue by fixing or tuning noisy alerts every week. Track alert volume per person per week; high alert volume leads to burnout and missed real incidents.',
        'Follow-the-sun: for global organisations, on-call shifts align with business hours in each timezone — no one is paged at 3am in their local time.',
      ]
    },
    {
      heading: 'Incident response process',
      points: [
        'Detect: alert fires (PagerDuty, AlertManager, Azure Monitor). On-call acknowledges within SLA window.',
        'Triage: determine severity. Is it P1? Open a dedicated incident Slack channel (#incident-2025-06-15-api-down) and an incident ticket. Assign Incident Commander.',
        'Investigate: check dashboards, logs, recent deployments. Use the 5 Whys or timeline to trace root cause. Incident Commander coordinates — delegates investigation tasks, keeps communication flowing.',
        'Mitigate: restore service as fast as possible — rollback a deployment, increase replicas, disable a feature flag, failover to a secondary region. A quick mitigation beats a perfect fix.',
        'Resolve and communicate: confirm service is restored. Update the status page. Notify stakeholders. Schedule a post-mortem within 48 hours.',
      ]
    },
    {
      heading: 'Runbooks — the incident toolkit',
      points: [
        'A runbook is a step-by-step guide for diagnosing and resolving a specific type of incident. Every alert rule should link to a runbook via the runbook_url annotation.',
        'Good runbook structure: (1) What is this alert? (2) What does it mean for users? (3) Quick triage steps (dashboards to check, log queries to run). (4) Remediation steps (in order of most to least likely). (5) Escalation contacts.',
        'Runbooks should be executable by an on-call engineer with no prior knowledge of the system — 3am is not the time for archaeology.',
        'Keep runbooks in a Git repository alongside the service code. They drift if stored in wikis that nobody updates. Require runbook updates as part of incident resolution.',
        'Runbooks evolve: after every incident, update the runbook with the actual steps that worked. A runbook that reflects reality reduces MTTR on the next occurrence.',
      ]
    },
    {
      heading: 'Blameless post-mortems',
      points: [
        'A post-mortem is a structured review of what happened, why, and how to prevent recurrence. It must be blameless — the goal is to understand system failures, not punish individuals.',
        'Publish within 48 hours of incident resolution while details are fresh. Share broadly — other teams learn from your incidents.',
        'Post-mortem sections: Summary, Timeline (minute-by-minute reconstruction), Root Cause Analysis (5 Whys), Impact (users affected, revenue loss, SLA breach), Action Items (specific owners, due dates).',
        'Action items must be: specific ("add readinessProbe to auth-service"), assigned to a named owner, time-boxed (due by sprint N), and tracked in your issue tracker. Vague items ("improve monitoring") die in the wiki.',
        'Near-misses count too: write a post-mortem for "we almost had an outage but caught it first" — the learning value is the same as an actual outage.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'PagerDuty & Escalation Setup',
      language: 'bash',
      code: `# ─── PagerDuty: AlertManager integration ──────────────────────────────────────

# alertmanager.yml
# receivers:
#   - name: pagerduty-critical
#     pagerduty_configs:
#       - routing_key: <PAGERDUTY_INTEGRATION_KEY>
#         severity: critical
#         description: '{{ .CommonAnnotations.summary }}'
#         details:
#           runbook: '{{ .CommonAnnotations.runbook_url }}'
#           firing_alerts: '{{ .Alerts.Firing | len }}'
#         links:
#           - href: '{{ .CommonAnnotations.runbook_url }}'
#             text: 'Runbook'
#
#   - name: slack-warnings
#     slack_configs:
#       - api_url: 'https://hooks.slack.com/services/...'
#         channel: '#alerts'
#         color: '{{ if eq .Status "firing" }}danger{{ else }}good{{ end }}'
#         title: '{{ .CommonAnnotations.summary }}'
#         text: >-
#           *Alert:* {{ .CommonAnnotations.summary }}
#           *Severity:* {{ .CommonLabels.severity }}
#           *Runbook:* {{ .CommonAnnotations.runbook_url }}
#
# route:
#   group_by: ['alertname', 'cluster']
#   group_wait: 30s
#   group_interval: 5m
#   repeat_interval: 4h
#   receiver: slack-warnings
#   routes:
#     - match: { severity: page }
#       receiver: pagerduty-critical
#       continue: true      # also send to Slack
#     - match: { severity: page }
#       receiver: slack-critical

# ─── Escalation policy (PagerDuty API) ────────────────────────────────────────

# On-call schedule → Escalation Policy:
# Level 1: Primary on-call       — acknowledge within 5 min
# Level 2: Secondary on-call     — escalate if unacknowledged
# Level 3: Engineering Manager   — escalate after 15 min total
# Level 4: VP Engineering        — for extended P1s (> 30 min)

# ─── Incident channel naming convention ───────────────────────────────────────

# Slack channel created automatically by PagerDuty or a bot:
# #inc-2025-06-15-api-authentication-down
#
# Pinned in channel:
# - Incident Commander: @alice
# - Severity: P1
# - Status: Investigating
# - Status Page: https://status.example.com
# - Runbook: https://runbooks.internal/auth-service-down
# - Ticket: PLAT-4521
#
# Updates posted every 15 minutes during active P1

# ─── Status page update (Statuspage.io API) ───────────────────────────────────

# curl -X POST https://api.statuspage.io/v1/pages/PAGE_ID/incidents \\
#   -H "Authorization: OAuth STATUS_PAGE_TOKEN" \\
#   -H "Content-Type: application/json" \\
#   -d '{
#     "incident": {
#       "name": "Authentication service degraded",
#       "status": "investigating",
#       "impact_override": "major",
#       "body": "We are investigating reports of login failures. Our team has been alerted and is actively working on a resolution.",
#       "component_ids": ["abc123def"],
#       "components": { "abc123def": "major_outage" }
#     }
#   }'`,
    },
    {
      label: 'Runbook Template',
      language: 'bash',
      code: `# ─── Runbook: HighErrorRate alert ────────────────────────────────────────────
#
# Alert: HighErrorRate
# Severity: P1 / P2
# Service: api-gateway
# Owner: Platform Team
#
# ## What does this alert mean?
# The HTTP 5xx error rate has exceeded 1% of requests over a 2-minute window.
# Users are experiencing failures on API calls.
#
# ## Immediate triage (first 2 minutes)
# 1. Check the Grafana dashboard: https://grafana.internal/d/api-gateway
#    - Look at the Error Rate panel — which endpoints are failing?
#    - Look at the Latency panel — is p99 also elevated?
# 2. Check recent deployments:
#    kubectl rollout history deployment/api-gateway -n production
#    # or: check #deployments Slack channel
# 3. Check pod health:
#    kubectl get pods -n production -l app=api-gateway
#    kubectl describe pod <crashing-pod> -n production
#
# ## Likely causes and remediation (in order of frequency)
#
# ### 1. Bad deployment (most common)
# kubectl rollout history deployment/api-gateway -n production
# kubectl rollout undo deployment/api-gateway -n production
# kubectl rollout status deployment/api-gateway -n production --timeout=120s
#
# ### 2. Database connection issues
# # Check db pool metrics — db_pool_idle_connections should be > 0
# # Check database pod / RDS instance health
# # If connection pool exhausted: restart api-gateway pods (clears connections)
# kubectl rollout restart deployment/api-gateway -n production
#
# ### 3. Downstream dependency failure
# # Check Grafana: is the error on a specific endpoint (e.g. /api/payment)?
# # Check the dependency service's health endpoint
# curl https://payment-service.internal/healthz
# # If dependency is down: enable circuit breaker / feature flag
# kubectl set env deployment/api-gateway PAYMENT_CIRCUIT_BREAKER=true -n production
#
# ### 4. Traffic spike / scaling
# kubectl get hpa -n production
# kubectl scale deployment api-gateway --replicas=10 -n production
#
# ## Escalation
# - 5 min: no progress → page secondary on-call
# - 15 min: no mitigation → escalate to Engineering Manager @eng-mgr
# - 30 min: still P1 → open Major Incident, notify VP Engineering
#
# ## Post-resolution
# 1. Confirm error rate < 0.1% for 10 consecutive minutes
# 2. Update status page: "This incident has been resolved."
# 3. Add entry to incident log with timeline
# 4. Schedule post-mortem within 48 hours`,
    },
    {
      label: 'Post-Mortem Template',
      language: 'bash',
      code: `# ─── Post-Mortem: API Authentication Outage ──────────────────────────────────
#
# Date: 2025-06-15
# Duration: 47 minutes (14:22 – 15:09 UTC)
# Severity: P1
# Author: Alice Chen (Incident Commander)
# Reviewers: Bob Smith, Platform Team
#
# ## Summary
# A misconfigured JWT validation middleware was deployed at 14:20 UTC
# that rejected all authentication requests, causing a complete login
# outage for 47 minutes. 12,400 users were unable to log in.
# The issue was resolved by rolling back the deployment.
#
# ## Impact
# - Users affected: 12,400 (100% of login attempts failed)
# - Duration: 47 minutes
# - SLA breach: Yes — 99.9% availability SLO allows 43.2 min/month
# - Estimated revenue impact: £8,200 (based on conversion rate loss)
#
# ## Timeline (UTC)
# 14:18 — Deployment of auth-service v2.4.1 started
# 14:20 — Deployment completed (3 pods running v2.4.1)
# 14:22 — AlertManager: HighErrorRate firing (5xx rate 98%)
# 14:23 — PagerDuty paged primary on-call (Alice)
# 14:25 — Alice acknowledged, opened #inc-2025-06-15-auth-down
# 14:27 — Identified deployment as likely cause (kubectl rollout history)
# 14:29 — Rollback initiated (kubectl rollout undo)
# 14:31 — Rollback complete, pods healthy, error rate returning to normal
# 14:35 — Error rate < 0.1%, alert resolved
# 15:09 — Status page updated: resolved
#
# ## Root Cause Analysis (5 Whys)
# WHY 1: Users couldn't log in?
#   → JWT validation rejected all tokens with "algorithm mismatch" error
# WHY 2: JWT validation was wrong?
#   → v2.4.1 defaulted to RS256 but tokens were signed with HS256
# WHY 3: Wrong algorithm default?
#   → Config env var JWT_ALGORITHM was missing from the production secret
# WHY 4: Missing env var?
#   → The secret was not updated when the new config key was added
# WHY 5: Secret update missed?
#   → No automated check that all required env vars are present before deploying
# ROOT CAUSE: No pre-deploy validation that required env vars exist in the target environment
#
# ## What went well
# - Alert fired within 2 minutes of deployment completing
# - MTTD: 2 minutes, MTTR: 11 minutes (rollback was fast)
# - Incident channel was created and IC assigned within 3 minutes
#
# ## What went wrong
# - No pre-deploy env var validation caught the missing config
# - Readiness probe did not catch the configuration error at startup
# - Status page was not updated until 38 minutes after resolution
#
# ## Action Items
# | Action                                              | Owner  | Due     | Ticket  |
# |-----------------------------------------------------|--------|---------|---------|
# | Add startup env-var validation to auth-service      | Bob    | Jun 20  | PLAT-4523 |
# | Update readinessProbe to call /healthz/config       | Alice  | Jun 20  | PLAT-4524 |
# | Automate status page update from PagerDuty          | Carol  | Jun 27  | PLAT-4525 |
# | Add env-var diff check to deployment pipeline gate  | Bob    | Jul 4   | PLAT-4526 |`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'No runbook linked from alert rules',
      wrong: `- alert: DatabaseConnectionPoolExhausted
  expr: db_pool_idle_connections == 0
  annotations:
    summary: "DB pool exhausted"
    # No runbook_url — on-call must figure it out at 3am`,
      right: `- alert: DatabaseConnectionPoolExhausted
  expr: db_pool_idle_connections == 0
  annotations:
    summary: "DB connection pool exhausted"
    runbook_url: "https://runbooks.internal/db-pool-exhausted"
    description: "Pool idle=0 for >1m. Check for leaks or increase pool size."`,
      explanation: 'Without a runbook link, on-call engineers spend precious MTTR time searching for documentation they shouldn\'t need to look up. Every alert must have a runbook_url annotation. Link directly to the specific runbook — not the runbooks homepage.',
    },
    {
      title: 'Assigning blame in post-mortems',
      wrong: `# Post-mortem root cause:
# "Dave pushed a bad commit without testing it.
#  Dave should be more careful in the future."`,
      right: `# Post-mortem root cause:
# "The deployment pipeline had no pre-deploy validation step
#  to check that required environment variables exist in production.
#  A config change that added a new required var was not reflected
#  in the production secret before deployment."
#
# Action items: add env-var validation gate to the pipeline (owner: team)`,
      explanation: 'Blameless post-mortems focus on system failures, not individual mistakes. Blaming people creates a culture where engineers hide incidents and mistakes. The question is never "who did this?" but "what system, process, or check failed to prevent this from becoming an incident?"',
    },
    {
      title: 'Declaring P1 severity for everything',
      wrong: `// Every alert goes to PagerDuty at 3am
// 20 pages per night, all treated as critical
// On-call engineers burn out; real P1s get lost in noise`,
      right: `// Calibrated severity: only page for real user impact
// P1: complete outage → PagerDuty (immediate page)
// P2: major degradation → PagerDuty (immediate page)
// P3: minor / workaround exists → Slack (business hours)
// P4: cosmetic / no impact → ticket (no notification)`,
      explanation: 'Alert fatigue kills incident response. When engineers receive 20 pages per night, they acknowledge alerts without investigating, miss real incidents, and burn out. Reserve pager-level alerts for genuine user impact. Tune P3/P4 alerts to Slack notifications and fix them in business hours.',
    },
    {
      title: 'No post-mortem action item owners or deadlines',
      wrong: `## Action items
- Improve monitoring
- Add more tests
- Better documentation
- Review the deployment process`,
      right: `## Action items
| Action                                | Owner  | Due     | Ticket    |
|---------------------------------------|--------|---------|-----------|
| Add env-var validation gate to CI/CD  | Alice  | Jun 20  | PLAT-4523 |
| Add readinessProbe to auth-service    | Bob    | Jun 20  | PLAT-4524 |
| Automate status page from PagerDuty   | Carol  | Jun 27  | PLAT-4525 |`,
      explanation: 'Vague action items with no owner or deadline are never done. Every post-mortem action item must be: specific and testable, assigned to a named person (not "the team"), deadline-bound, and tracked as a ticket in your issue tracker. Review action item status in the next sprint retrospective.',
    },
    {
      title: 'Mitigating perfectly when fast restoration beats it',
      wrong: `// During a P1 outage (45 minutes so far):
// Engineer is writing a perfect code fix for the root cause
// while customers cannot use the service`,
      right: `// Immediate mitigation first — restore service now:
kubectl rollout undo deployment/myapp   // roll back deployment
// OR: disable the broken feature via feature flag
// OR: redirect traffic to secondary region

// Then investigate root cause AFTER service is restored
// Root cause fix goes through normal PR review, not emergency hotfix`,
      explanation: 'During an active incident, the priority is restoring service (MTTR), not finding or fixing the root cause. A rollback that takes 5 minutes beats a perfect fix that takes 2 hours. Once service is restored, do a proper root cause analysis and implement the real fix through the normal review process.',
    },
  ];

  challenge: Challenge = {
    title: 'Incident Severity Classifier',
    language: 'typescript',
    description: `Classify an incident based on its reported metrics and return the severity, response actions, and SLA targets.

Given:
- affectedUserPct: number (0–100, percentage of users affected)
- isDataLoss: boolean
- isSecurityBreach: boolean
- hasWorkaround: boolean
- serviceDownCompletely: boolean

Return: { severity: 'P1' | 'P2' | 'P3' | 'P4'; acknowledgeWithinMinutes: number; resolveWithinHours: number; actions: string[] }

Rules (first match wins):
1. isDataLoss OR isSecurityBreach → P1, ack 5min, resolve 1h, actions: ["page on-call immediately", "notify security team", "open incident bridge", "engage legal if data breach"]
2. serviceDownCompletely OR affectedUserPct >= 50 → P1, ack 5min, resolve 1h, actions: ["page on-call immediately", "open incident channel", "update status page", "notify stakeholders"]
3. affectedUserPct >= 10 AND !hasWorkaround → P2, ack 15min, resolve 4h, actions: ["page on-call", "open incident ticket", "notify product team"]
4. affectedUserPct >= 10 AND hasWorkaround → P3, ack 60min, resolve 24h, actions: ["notify team on Slack", "create ticket", "document workaround"]
5. affectedUserPct < 10 → P4, ack 240min, resolve 72h, actions: ["create ticket", "fix in next sprint"]`,
    hints: [
      'Evaluate the conditions in order — first match wins (if/else if chain).',
      'Rule 1 must come before rule 2, even if serviceDownCompletely is also true.',
      'The return type has acknowledgeWithinMinutes (not hours) and resolveWithinHours.',
      'Copy the exact action strings from the spec — interview quizzes check for verbatim matches.',
    ],
    starterCode: `interface IncidentInput {
  affectedUserPct: number;
  isDataLoss: boolean;
  isSecurityBreach: boolean;
  hasWorkaround: boolean;
  serviceDownCompletely: boolean;
}

interface SeverityResult {
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  acknowledgeWithinMinutes: number;
  resolveWithinHours: number;
  actions: string[];
}

function classifyIncident(incident: IncidentInput): SeverityResult {
  // TODO: implement severity classification
  return { severity: 'P4', acknowledgeWithinMinutes: 240, resolveWithinHours: 72, actions: ['create ticket'] };
}

// Tests
console.log(classifyIncident({ affectedUserPct: 100, isDataLoss: false, isSecurityBreach: false, hasWorkaround: false, serviceDownCompletely: true }));
// { severity: 'P1', acknowledgeWithinMinutes: 5, resolveWithinHours: 1, actions: [...] }

console.log(classifyIncident({ affectedUserPct: 5, isDataLoss: true, isSecurityBreach: false, hasWorkaround: false, serviceDownCompletely: false }));
// { severity: 'P1', ... security/data-loss actions }

console.log(classifyIncident({ affectedUserPct: 25, isDataLoss: false, isSecurityBreach: false, hasWorkaround: true, serviceDownCompletely: false }));
// { severity: 'P3', acknowledgeWithinMinutes: 60, resolveWithinHours: 24, ... }`,
    solution: `interface IncidentInput {
  affectedUserPct: number;
  isDataLoss: boolean;
  isSecurityBreach: boolean;
  hasWorkaround: boolean;
  serviceDownCompletely: boolean;
}

interface SeverityResult {
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  acknowledgeWithinMinutes: number;
  resolveWithinHours: number;
  actions: string[];
}

function classifyIncident(incident: IncidentInput): SeverityResult {
  const { affectedUserPct, isDataLoss, isSecurityBreach, hasWorkaround, serviceDownCompletely } = incident;

  if (isDataLoss || isSecurityBreach) {
    return {
      severity: 'P1',
      acknowledgeWithinMinutes: 5,
      resolveWithinHours: 1,
      actions: ['page on-call immediately', 'notify security team', 'open incident bridge', 'engage legal if data breach'],
    };
  }
  if (serviceDownCompletely || affectedUserPct >= 50) {
    return {
      severity: 'P1',
      acknowledgeWithinMinutes: 5,
      resolveWithinHours: 1,
      actions: ['page on-call immediately', 'open incident channel', 'update status page', 'notify stakeholders'],
    };
  }
  if (affectedUserPct >= 10 && !hasWorkaround) {
    return {
      severity: 'P2',
      acknowledgeWithinMinutes: 15,
      resolveWithinHours: 4,
      actions: ['page on-call', 'open incident ticket', 'notify product team'],
    };
  }
  if (affectedUserPct >= 10 && hasWorkaround) {
    return {
      severity: 'P3',
      acknowledgeWithinMinutes: 60,
      resolveWithinHours: 24,
      actions: ['notify team on Slack', 'create ticket', 'document workaround'],
    };
  }
  return {
    severity: 'P4',
    acknowledgeWithinMinutes: 240,
    resolveWithinHours: 72,
    actions: ['create ticket', 'fix in next sprint'],
  };
}

console.log(classifyIncident({ affectedUserPct: 100, isDataLoss: false, isSecurityBreach: false, hasWorkaround: false, serviceDownCompletely: true }));
// { severity: 'P1', acknowledgeWithinMinutes: 5, resolveWithinHours: 1, actions: ['page on-call immediately', ...] }

console.log(classifyIncident({ affectedUserPct: 5, isDataLoss: true, isSecurityBreach: false, hasWorkaround: false, serviceDownCompletely: false }));
// { severity: 'P1', ... security actions }

console.log(classifyIncident({ affectedUserPct: 25, isDataLoss: false, isSecurityBreach: false, hasWorkaround: true, serviceDownCompletely: false }));
// { severity: 'P3', acknowledgeWithinMinutes: 60, resolveWithinHours: 24, ... }`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between MTTD and MTTR?',
      options: [
        'MTTD = time to deploy; MTTR = time to release',
        'MTTD = Mean Time To Detect (how long until the incident is identified); MTTR = Mean Time To Recover (how long until service is restored)',
        'MTTD = time between incidents; MTTR = time to write a runbook',
        'Both measure the same thing — how long an incident lasts',
      ],
      answer: 1,
      explanation: 'MTTD measures monitoring effectiveness — how quickly does alerting detect a problem after it starts? MTTR measures response effectiveness — how fast can the team restore service after detection? Both are DORA metrics. Improving MTTD requires better alerting; improving MTTR requires better runbooks, tooling, and rollback processes.',
    },
    {
      q: 'What is the primary principle behind a blameless post-mortem?',
      options: [
        'Post-mortems should only be written for P1 incidents',
        'The person who caused the incident should present the findings',
        'Focus on systemic failures and process gaps — not individual mistakes — to build a culture where people report incidents honestly',
        'Post-mortems should conclude with disciplinary action for repeated mistakes',
      ],
      answer: 2,
      explanation: 'Blame drives incidents underground. If engineers fear punishment, they will hide mistakes, not escalate early, and not share learning. Blameless post-mortems assume that people acted with the information they had at the time. The question is: what system, check, or process could have caught this earlier or prevented it entirely?',
    },
    {
      q: 'Why should you roll back first during an active incident rather than fixing the root cause?',
      options: [
        'Rollbacks are more reliable than code fixes',
        'Restoring service quickly (minimising MTTR) matters more during an active outage than finding the perfect fix',
        'Root cause fixes require a post-mortem to be written first',
        'PagerDuty requires a rollback before closing an incident',
      ],
      answer: 1,
      explanation: 'During an active P1, every minute costs you error budget and user trust. A rollback that restores service in 5 minutes beats a correct root-cause fix that takes 2 hours and goes through proper review. Once service is restored, take your time on the real fix. "Mitigate first, fix later" is the incident response mantra.',
    },
    {
      q: 'What does an escalation policy do in PagerDuty?',
      options: [
        'It automatically increases the incident severity after 30 minutes',
        'It silences alerts during business hours and escalates only at night',
        'It defines a chain of people to page if the previous person does not acknowledge within a time window',
        'It sends incident details to the status page automatically',
      ],
      answer: 2,
      explanation: 'An escalation policy ensures incidents are not lost if the primary on-call is unavailable or asleep. If primary doesn\'t acknowledge within 5 minutes → page secondary. After another 5 minutes → page the engineering manager. This chain prevents P1 incidents from sitting unacknowledged while the team sleeps through their pager.',
    },
    {
      q: 'What should every post-mortem action item include to be effective?',
      options: [
        'A description of what went wrong and who was responsible',
        'A specific action, a named owner, and a deadline — tracked as a ticket',
        'Approval from the VP Engineering before being assigned',
        'A minimum of five bullet points explaining the technical details',
      ],
      answer: 1,
      explanation: 'Vague action items ("improve monitoring", "add more tests") are never completed. Effective action items are: specific and testable, assigned to one named person (not "the team"), time-boxed (due by a specific date), and tracked as a ticket in your issue tracker. Review them in the next sprint retrospective.',
    },
    {
      q: 'What is MTTR (Mean Time to Recover) and what does a high MTTR indicate?',
      options: [
        'Mean Time to Release — how long deployments take',
        'Mean Time to Recover — average time from incident detection to service restoration; high MTTR indicates slow diagnosis, poor runbooks, or complex systems',
        'Maximum Time to Resolve — SLA commitment to customers',
        'Mean Time to Report — how quickly incidents are logged'],
      answer: 1,
      explanation: 'MTTR = (total downtime) / (number of incidents). Elite DevOps performers have MTTR under 1 hour. High MTTR signals: poor observability (slow to diagnose), missing runbooks (repeating same diagnosis steps), complex deployments (slow rollbacks), or excessive blast radius (one failure cascades). Reducing MTTR requires: pre-written runbooks, feature flags for instant rollback, chaos engineering to practice recovery, and progressive delivery to limit blast radius.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is chaos engineering and how does it relate to incident response?',
      a: 'Chaos engineering deliberately injects failures (kill random pods, partition a network link, exhaust a connection pool) to find weaknesses before they cause real incidents. Netflix\'s Chaos Monkey is the famous example. By practising failure in controlled conditions, you verify that your runbooks work, your monitoring detects the failure quickly, and your team knows how to respond. Chaos exercises also reduce MTTD and MTTR when real incidents occur — the team has seen this failure mode before.',
    },
    {
      q: 'What is a Game Day (Chaos Day) and how do you run one?',
      a: 'A Game Day is a structured exercise where the team deliberately breaks production (or a production-like environment) to practice incident response. Format: (1) Define a hypothesis ("if the primary database fails, we can fail over in < 5 minutes"). (2) Inject the failure in a controlled way. (3) Observe — does monitoring alert? Does the runbook work? Does the team respond correctly? (4) Document findings and action items. Game Days build muscle memory for real incidents and surface gaps in runbooks, monitoring, and tooling.',
    },
    {
      q: 'What is the role of the Incident Commander?',
      a: 'The Incident Commander (IC) is a single person who owns coordination during a major incident. The IC does NOT investigate or fix — they delegate investigation tasks, track progress, manage communication (status page updates, stakeholder notifications, 15-minute update cadence in the incident channel), decide on escalation, and call the "all clear" when service is restored. Having a dedicated IC prevents the "too many cooks" problem where everyone is simultaneously debugging and nobody is communicating. In smaller teams, the IC is often the on-call engineer until help arrives.',
    },
    {
      q: 'How do you prevent on-call burnout?',
      a: 'Key practices: (1) Track alert volume per person per shift — if someone receives > 5 pages per shift, the noisy alerts are a toil item to fix that week. (2) Run weekly alert reviews: for every P3/P4 that fired, is it worth keeping? Tune or delete noisy alerts. (3) Schedule post-mortem action items in sprint capacity — toil reduction is real work. (4) Ensure on-call rotations are fair (weekly, not monthly), adequate rest is protected (no meetings the morning after a P1), and secondary on-call is always ready. (5) Measure and target on-call load as a team health metric.',
    },
    {
      q: 'What is a status page and what should you post on it during an incident?',
      a: 'A status page (Statuspage.io, Atlassian, Cachet) is a public-facing page that shows the current operational status of your service. During an incident: (1) Post within 5 minutes of declaring P1: "We are aware of an issue affecting [feature]. Our team is investigating." (2) Update every 15–30 minutes with what you know: "We have identified the cause and are rolling back a recent change." (3) Post resolution: "This incident has been resolved as of [time]. We will publish a post-mortem within 5 business days." Customers tolerate outages much better when they get timely, honest communication.',
    },
    {
      q: 'What are the best practices for a sustainable on-call rotation?',
      a: 'Sustainable on-call: (1) Limit alert volume — if engineers are paged more than 2-3 times per on-call shift, the alert signal is lost in noise. Tune alerts ruthlessly: only page for actionable, urgent issues. (2) Document runbooks — every alert should link to a runbook. Engineers should not be debugging from scratch at 3am. (3) Primary + secondary rotation — primary is first contact; secondary provides backup if primary is unreachable. (4) Follow-the-sun — for global teams, route on-call by time zone so nobody is on-call overnight in their region. (5) No hero culture — if the same person handles all incidents because they are the only one who understands a system, that is a bus factor problem, not an on-call problem. (6) Handover documentation — end-of-shift notes on open issues, incidents in progress, and context for the next person.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Respond to incidents with defined severity levels, clear escalation chains, fast mitigation over perfect fixes, and blameless post-mortems with specific action items.',
    mustKnow: [
      'P1: complete outage — ack in 5 min, page on-call, open incident channel, update status page',
      'P2: major degradation — ack in 15 min, open ticket, notify stakeholders',
      'MTTD: alert detection speed; MTTR: time to restore — both are DORA metrics',
      'Rollback first, root-cause fix later — minimise MTTR during active incidents',
      'Runbook: every alert must have runbook_url; step-by-step triage + remediation + escalation contacts',
      'Blameless post-mortem: focus on systemic failures not blame; 5 Whys; specific action items with owners and deadlines',
      'Escalation policy: primary → secondary → manager chain with time windows; PagerDuty enforces it automatically',
    ],
    interviewFocus: [
      'Walk through a P1 incident from alert firing to post-mortem — what happens at each step?',
      'What is a blameless post-mortem and why is "blameless" important for engineering culture?',
      'Why do you mitigate first rather than fix the root cause during an active incident?',
      'What makes a post-mortem action item effective vs. ineffective?',
    ],
  };
}
