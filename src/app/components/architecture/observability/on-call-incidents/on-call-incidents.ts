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
  { name: 'Incident commander', type: 'keyword', desc: 'Single person responsible for coordinating the incident response — assigns tasks, manages communication, calls escalations.' },
  { name: 'MTTD',              type: 'keyword', desc: 'Mean Time To Detect — average time from incident start to first alert fire or detection. Reduced by good SLI alerting.' },
  { name: 'MTTR',              type: 'keyword', desc: 'Mean Time To Resolve — average time from detection to service restoration. Reduced by runbooks and previous postmortem actions.' },
  { name: 'Postmortem',        type: 'keyword', desc: 'Blameless post-incident analysis. Documents timeline, root cause, contributing factors, and action items to prevent recurrence.' },
  { name: 'Rollback',          type: 'keyword', desc: 'Reverting to the last known-good deployment. Usually the fastest mitigation for deploy-caused incidents. Should take < 5 min.' },
  { name: 'Incident severity', type: 'keyword', desc: 'SEV1 (all users impacted, revenue loss), SEV2 (partial/degraded), SEV3 (minor, no SLO breach). Determines response urgency.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Incident Response Lifecycle',
    points: [
      'Detection: alert fires → on-call is paged. The time from incident start to alert fire is MTTD. Good SLI-based alerting with multi-window burn rate reduces this to minutes.',
      'Triage: on-call acknowledges, assesses severity, and declares an incident if needed. Check dashboards: which service, what error rate, what user impact. Pull up exemplar traces.',
      'Mitigation: stop the bleeding first. Rollback if recent deploy is suspected. Increase circuit breaker thresholds. Scale up replicas. The goal is restoring service, not diagnosing root cause.',
      'Resolution: the service is restored. Document the timeline. Schedule postmortem. The time from detection to resolution is MTTR.',
    ],
  },
  {
    heading: 'The Blameless Postmortem',
    points: [
      'The purpose of a postmortem is to learn, not to punish. If the culture punishes people for incidents, engineers hide problems instead of reporting and analysing them.',
      'Required sections: impact (duration × user fraction), timeline (when what happened), root cause (the technical reason the incident occurred), contributing factors (systemic issues that made the incident worse or harder to detect), action items (specific tasks with owners and due dates).',
      'Five Whys: ask "why did this happen?" five times. Each answer becomes the next "why?". The fifth answer is usually a systemic or process failure, not a human error.',
      'Action items must be specific and assigned. "Improve monitoring" is not an action item. "Add SLO alert for payment error rate by 2024-02-15 (owner: @alice)" is. Track completion in the incident tracker.',
    ],
  },
  {
    heading: 'On-Call Best Practices',
    points: [
      'Escalation path: first responder → service owner → senior engineer → CTO. Each level is paged if the previous level doesn\'t respond within N minutes. No single point of failure in escalation.',
      'Rotate on-call fairly: every engineer on the team participates. On-call should not fall to the same 2 people indefinitely. Use PagerDuty/OpsGenie rotation schedules.',
      'On-call handoff: a brief document (5 minutes to write) passed at every rotation: open incidents, known fragile services, upcoming risky deploys, anything the incoming on-call should know.',
      'Post-on-call debrief: after each rotation, the on-call engineer reviews all alerts received. Were they actionable? Should thresholds change? This feedback loop improves alerting quality.',
    ],
  },
  {
    heading: 'Observability During Incidents',
    points: [
      'Start with the symptom dashboard: RED dashboard for the affected service. Note exact start time of degradation — correlate with deployment annotations.',
      'Use exemplar traces: click the ◆ on the p99 latency chart during the incident window. The trace shows exactly which span caused the slowness — in seconds, not minutes.',
      'Correlate across pillars: metric spike → trace for that window → logs with traceId from the trace. Three clicks to root cause if the pillars are well-connected.',
      'Preserve evidence: before rolling back or restarting, take a heap snapshot, cpu profile, or log excerpt. Evidence disappears after restart — and it\'s needed for the postmortem.',
    ],
  },
  {
    heading: 'Blameless Postmortems and Continuous Improvement',
    points: [
      'A blameless postmortem focuses on identifying systemic and process failures that allowed an incident to happen, rather than assigning individual blame — this psychological safety is what actually gets engineers to report near-misses and honestly describe what happened, rather than hiding mistakes out of fear of punishment.',
      'A good postmortem includes a precise timeline (when the issue started, when it was detected, when it was mitigated, when it was fully resolved), root cause analysis, and concrete, assigned action items with owners and deadlines — a postmortem without actionable follow-up items is just a retrospective narrative with no lasting value.',
      'Detection time (time between an incident starting and it being noticed) and time-to-mitigation are both worth tracking as distinct metrics — an incident that took 2 minutes to detect but 2 hours to mitigate reveals a very different improvement opportunity than one that took 2 hours to even notice.',
      'On-call rotations should be sustainable — reasonable shift lengths, adequate rest between rotations, and a genuine effort to reduce the volume of pages over time (via the alerting and toil-reduction practices covered elsewhere) prevent on-call burnout, which is a leading cause of attrition on operationally-heavy teams.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Incident Runbook Template',
    language: 'typescript',
    code: `# Runbook: Payment Service Degradation
# Alert: PaymentErrorRateHigh (error rate > 2%)
# Severity: SEV1 if > 10%, SEV2 if 2-10%
# Owner: payment-team  |  Escalation: @payment-tech-lead → @CTO

## 1. TRIAGE (< 2 minutes)
  # Check dashboards:
  grafana: https://grafana.internal/d/payment-service-red
  # Questions to answer:
  # - Is it all payment providers or one specific provider (Stripe/PayPal)?
  # - Is it affecting all regions or one?
  # - Did a deployment happen in the last 30 minutes?
  kubectl get deployments -n production | grep payment
  kubectl rollout history deployment/payment-service

## 2. IMMEDIATE MITIGATION (< 5 minutes)
  # Option A: Recent deploy suspected → rollback
  kubectl rollout undo deployment/payment-service
  # Verify rollback: kubectl rollout status deployment/payment-service

  # Option B: Single provider failing → enable fallback provider
  kubectl set env deployment/payment-service PAYMENT_FALLBACK=true
  # Monitor: watch -n5 'kubectl logs -l app=payment-service --tail=5'

  # Option C: Database overloaded → scale connection pool
  kubectl set env deployment/payment-service DB_POOL_MAX=30

## 3. DIAGNOSE (after mitigation)
  # Find representative failing traces:
  jaeger: https://jaeger.internal/search?service=payment-service&error=true
  # Query logs for error details:
  LogQL: {service="payment-service"} | json | level="error" | __error__=""

## 4. COMMUNICATE
  # Status page update template:
  "We are investigating increased error rates in payment processing.
   Users may experience failures when completing purchases.
   Our team is actively working to resolve this. [TIME UTC]"

## 5. ESCALATION
  # If not resolved in 15 minutes: page @payment-tech-lead
  # If not resolved in 30 minutes: page @on-call-manager`,
  },
  {
    label: 'Postmortem Template',
    language: 'typescript',
    code: `# Incident Postmortem
# Date: 2024-01-15  |  Duration: 47 minutes  |  Severity: SEV2
# Author: @alice  |  Reviewers: @bob, @charlie

## Summary
Payment service error rate exceeded 5% for 47 minutes (14:23 - 15:10 UTC).
Approximately 2,300 users (0.8% of traffic) experienced payment failures.
Estimated revenue impact: $18,000 in declined transactions.

## Impact
- Duration: 47 minutes
- Users affected: ~2,300 (failed payment attempts)
- Revenue impact: ~$18,000
- SLO: burned 23% of monthly error budget

## Timeline (all times UTC)
14:23  Deployment v2.31.0 shipped to production
14:26  Error rate begins climbing (detectable in metrics, alert not yet fired)
14:31  SLO burn rate alert fires → @alice paged
14:33  @alice acknowledges, opens incident bridge
14:38  Identifies v2.31.0 as suspect (deploy annotation at 14:23)
14:41  Rollback initiated: kubectl rollout undo deployment/payment-service
14:47  Error rate returning to baseline
15:10  Monitoring confirms full recovery — incident resolved

## Root Cause
v2.31.0 introduced a retry loop in the Stripe client that retried on rate-limit
responses (HTTP 429) without honouring the Retry-After header. Under sustained
load, retries amplified Stripe's rate limiting, causing cascading failures.

## Contributing Factors
1. No staging load test for the new Stripe client code path
2. Retry behaviour not covered by unit tests (only tested success path)
3. Stripe 429 responses were not identified as retriable in the original
   design — the bug was introduced by well-intentioned error handling

## What Went Well
- SLO alert fired 5 minutes after error rate began (good MTTD)
- Rollback took < 6 minutes (good rollback tooling)
- Incident bridge communication was clear and efficient

## Action Items
| Action | Owner | Due |
|--------|-------|-----|
| Add Stripe rate limit test in staging load suite | @alice | 2024-01-29 |
| Add retry-with-backoff unit test for all payment clients | @bob | 2024-01-22 |
| Review all retry implementations for missing Retry-After handling | @charlie | 2024-02-05 |
| Add alert for Stripe 429 response rate spike | @alice | 2024-01-22 |`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Diagnosing root cause before mitigating user impact',
    wrong: `// 14:31: Alert fires — users cannot check out
// On-call spends 25 minutes tracing through logs, reading code
// trying to find the EXACT root cause
// Meanwhile: 25 more minutes of all users experiencing failures
// 25 minutes × 1000 failed checkouts/minute = 25,000 failed orders`,
    right: `// Mitigation first, then diagnosis
// 14:31: Alert fires
// 14:33: Rollback the recent deploy (most likely cause) — 2 minutes
// 14:39: Error rate recovered — users can check out again
// THEN: spend time diagnosing what in the deploy caused the issue
// Postmortem: root cause identified, fix shipped separately`,
    explanation: 'During an active incident affecting users, the first priority is restoration, not understanding. Users don\'t care about root cause — they care about being able to use the service. Roll back the recent deploy, scale up replicas, or enable a fallback — whatever stops the bleeding fastest. Root cause diagnosis comes after service is restored, with full access to logs, traces, and profiles taken during the incident.',
  },
  {
    title: 'Writing postmortems with blame instead of systemic analysis',
    wrong: `# Postmortem
# Root cause: Developer @alice pushed untested code
# Solution: @alice needs retraining in testing best practices
# Action: Stronger code review required for @alice's PRs

# This creates a culture where:
# - Engineers hide mistakes to avoid blame
# - Systemic issues (no staging load test) are never fixed
# - The same incident recurs because the system isn't fixed`,
    right: `# Blameless postmortem
# Root cause: Stripe 429 retry loop without Retry-After backoff
# Contributing factor: Staging environment has no load test for this path
# Contributing factor: Code review didn't catch missing backoff
# Action: Add staging load test for all payment code paths (due: 2024-01-29)
# Action: Create review checklist item for retry implementations
# No individual is blamed — the system is improved`,
    explanation: 'Blame-based postmortems prevent learning. Engineers stop reporting incidents, hide mistakes, and fear contributing to code they might break. Blameless postmortems treat incidents as systems problems: what in the system (process, tooling, monitoring, testing) allowed this to happen? Fix the system so the next engineer cannot make the same mistake, regardless of skill level.',
  },
  {
    title: 'No incident commander during complex incidents — too many voices',
    wrong: `// 5 engineers all trying to fix the database incident simultaneously
// Alice: "I'm restarting the connection pool"
// Bob: "Wait I'm testing the indexes don't restart yet"
// Charlie: "I already ran VACUUM on that table 2 minutes ago"
// Dave: "What? That could explain the locks — revert it!"
// 30 minutes of conflicting actions, no coordination, situation worsens`,
    right: `// Declare incident commander at the start
"I'm Alice, I'm taking incident command"
// IC assigns roles: Bob diagnoses, Charlie tests mitigations,
// Dave handles status page communication
// IC approves all production changes: "Bob, proceed with index rebuild"
// One person has authority, everyone else reports to IC
// 12 minutes to resolution with clear coordination`,
    explanation: 'Without an incident commander, multiple engineers take simultaneous actions that conflict with each other, and nobody has a complete picture. The incident commander role (borrowed from emergency services) assigns one person to coordinate. They do NOT fix the problem — they direct others, approve changes, manage communication, and ensure information flows between people. Declare an IC at the start of any SEV1/SEV2 incident.',
  },
  {
    title: 'Restarting services without preserving evidence',
    wrong: `// "Let's just restart the pod, it'll fix it"
kubectl rollout restart deployment/payment-service
// Service restores — incident over!
// Postmortem: "We don't know what caused it — the pod restarted"
// Same incident happens 3 weeks later — still no root cause
// No heap snapshot, no cpu profile, no logs captured`,
    right: `// Before any restart: preserve evidence
kubectl exec -it payment-service-xxx -- /bin/sh -c 'kill -USR2 1'  // heap dump
// Copy logs from the pod before restart:
kubectl logs payment-service-xxx --since=30m > incident-logs.txt
// Take a memory snapshot if possible, note current thread state
// THEN restart, and analyse the evidence in the postmortem`,
    explanation: 'Restarting a service is often the fastest mitigation — but it destroys in-memory state (heap, active connections, local caches) and terminates running processes whose state might reveal the root cause. Before restarting: dump logs to a file, take a heap snapshot if memory is suspected, and note any visible anomalies. Evidence that disappears at restart is evidence that cannot contribute to preventing the next occurrence.',
  },
];

const challenge: Challenge = {
  title: 'Compute MTTD and MTTR',
  language: 'typescript',
  description: `Implement computeIncidentMetrics(incidents: Incident[]): { mttdMinutes: number; mttrMinutes: number }
where Incident has: startTime, detectedTime, resolvedTime (all Unix timestamps in ms)
MTTD = average(detectedTime - startTime) in minutes
MTTR = average(resolvedTime - detectedTime) in minutes
Round to 1 decimal place. Return 0 for empty arrays.`,
  hints: ['Use reduce to sum, then divide by length', 'Convert ms to minutes: / 60_000'],
  starterCode: `interface Incident {
  startTime: number;
  detectedTime: number;
  resolvedTime: number;
}

function computeIncidentMetrics(incidents: Incident[]): { mttdMinutes: number; mttrMinutes: number } {
  return { mttdMinutes: 0, mttrMinutes: 0 };
}

const incidents: Incident[] = [
  { startTime: 0, detectedTime: 5 * 60_000, resolvedTime: 50 * 60_000 },   // detected 5m, resolved 50m
  { startTime: 0, detectedTime: 3 * 60_000, resolvedTime: 30 * 60_000 },   // detected 3m, resolved 30m
];
console.log(computeIncidentMetrics(incidents));
// { mttdMinutes: 4.0, mttrMinutes: 36.0 }`,
  solution: `interface Incident {
  startTime: number;
  detectedTime: number;
  resolvedTime: number;
}

function computeIncidentMetrics(incidents: Incident[]): { mttdMinutes: number; mttrMinutes: number } {
  if (incidents.length === 0) return { mttdMinutes: 0, mttrMinutes: 0 };
  const sumMttd = incidents.reduce((s, i) => s + (i.detectedTime - i.startTime), 0);
  const sumMttr = incidents.reduce((s, i) => s + (i.resolvedTime - i.detectedTime), 0);
  const n = incidents.length;
  return {
    mttdMinutes: Math.round(sumMttd / n / 60_000 * 10) / 10,
    mttrMinutes: Math.round(sumMttr / n / 60_000 * 10) / 10,
  };
}

const incidents: Incident[] = [
  { startTime: 0, detectedTime: 5 * 60_000, resolvedTime: 50 * 60_000 },
  { startTime: 0, detectedTime: 3 * 60_000, resolvedTime: 30 * 60_000 },
];
console.log(computeIncidentMetrics(incidents));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'During an active SEV1 incident where users cannot complete purchases, what should be the first priority?',
    options: [
      'Perform a detailed root cause analysis to understand exactly what caused the failure before making any changes',
      'Mitigate user impact as quickly as possible — rollback recent deploy or enable a fallback — then diagnose root cause after service is restored',
      'Notify all stakeholders and update the status page before taking any technical action',
      'Reproduce the issue in staging to confirm the root cause before applying any fix to production',
    ],
    answer: 1,
    explanation: 'During an active incident, every minute of delay means more users experiencing failures. Mitigation comes first: rollback the recent deploy (if applicable), scale up replicas, enable a fallback, or apply a configuration change that restores service. Root cause diagnosis happens AFTER service is restored, using preserved evidence (logs, traces, heap snapshots taken during the incident). "Fix first, understand later" for critical user impact incidents.',
  },
  {
    q: 'What makes a postmortem "blameless" and why does blamelessness matter?',
    options: [
      'A blameless postmortem has no action items — it just documents what happened without any follow-up tasks',
      'Blameless postmortems focus on systemic issues (process, tooling, monitoring gaps) rather than individual mistakes, creating psychological safety to report and learn from incidents',
      'A blameless postmortem is conducted by an external team who were not involved in the incident, to ensure objectivity',
      'Blameless means all participants are anonymous — names are removed from the timeline and action items',
    ],
    answer: 1,
    explanation: 'Blameless postmortems assume that engineers act with good intentions and best available information. When an incident occurs, the focus is on systemic failures: Why did the testing infrastructure not catch this? Why did the deploy pipeline not gate on this check? Why did the alert not fire sooner? This approach identifies fixable root causes and creates psychological safety — engineers report incidents rather than hiding them to avoid blame. Over time, the system improves instead of the same incidents recurring.',
  },
  { q: 'What are the key phases of incident management and what happens in each phase?', options: ['Report, Diagnose, Fix, Close — the four sequential phases of every incident', 'Detection, Response (triage and communication), Mitigation, Resolution, and Post-incident review — the lifecycle of a production incident with distinct roles and activities in each phase', 'Alert, Escalate, Patch, Deploy — the four technical steps in incident resolution', 'Incident management has no fixed phases; each incident is handled differently based on severity'], answer: 1, explanation: 'Incident lifecycle: Detection: alert fires, or user reports problem. The incident clock starts. Response: acknowledge the alert. Assess severity (how many users affected? Revenue impact?). Open an incident channel (Slack, Teams). Assign roles: incident commander (coordinates), communications lead (updates stakeholders), technical lead (investigates). Mitigation: reduce user impact while the root cause is investigated. Rollback, failover, redirect traffic, increase capacity. Mitigation is not the same as resolution. Resolution: identify and fix the root cause. Verify that metrics return to normal. Declare the incident closed. Post-incident review: within 48-72 hours. Blameless analysis of what happened, why it was not detected sooner, and what prevents recurrence.' },
  { q: 'What is an incident commander role and why is it important?', options: ['A senior engineer who personally fixes the most technically complex incidents', 'A dedicated coordinator who manages communication, tracks investigation progress, makes escalation decisions, and ensures the team does not get tunnel vision — allowing technical engineers to focus on diagnosis', 'An executive who approves communications to customers during major incidents', 'The engineer whose pager received the initial alert and who started the incident response'], answer: 1, explanation: 'Incident commander (IC) role: a dedicated role that focuses entirely on coordination, not technical investigation. Responsibilities: open and manage the incident channel. Keep a timestamped log of actions taken (incident timeline). Assign investigators to specific hypotheses. Make escalation decisions (bring in more people, escalate severity). Drive status updates to stakeholders. Prevent tunnel vision: if the team has been investigating one hypothesis for 30 minutes without progress, the IC redirects. Declare the all-clear when metrics return to normal. Why it matters: without an IC, technical engineers get pulled into both investigation and coordination simultaneously. Communication falls behind. Status updates are forgotten. The IC role allows specialists to focus on the technical work. Rotating the IC role develops incident management skills across the team.' },
  { q: 'What is a blameless postmortem and how does it differ from a traditional incident review?', options: ['A blameless postmortem assigns equal blame to all team members involved', 'A blameless postmortem focuses on understanding systemic causes and process improvements rather than individual mistakes, recognizing that people made reasonable decisions given the information they had', 'A blameless postmortem omits the section on what went wrong to protect team morale', 'Blameless postmortems are informal discussions; traditional reviews are formal documents reviewed by management'], answer: 1, explanation: 'Traditional review: often leads to blame (who made this mistake?). Creates incentives to hide errors and avoid risk. Reduces psychological safety. Blameless postmortem (John Allspaw, Etsy): focus on the system not the person. If someone made a mistake, the system allowed them to make it — and the system must be fixed. Assume positive intent: every engineer was doing their best with the information they had. Find the systemic cause: why did the monitoring not catch this earlier? Why did the deployment process allow a bad config to reach production? Actions should be systemic: improve the alert, fix the deployment check, update the runbook. Not: retrain the engineer. Result: engineers report mistakes openly. The organization learns. The same failure does not repeat.' },
  { q: 'What is the difference between MTTR, MTTD, and MTTF as SRE metrics?', options: ['MTTF is for hardware; MTTR and MTTD are for software incidents only', 'MTTF (Mean Time to Failure) measures how long a system runs before failing; MTTD (Mean Time to Detect) measures how long between failure start and detection; MTTR (Mean Time to Restore) measures how long from detection to service restoration', 'MTTD and MTTR together equal MTTF for any given incident', 'All three metrics are equivalent and used interchangeably in different organizations'], answer: 1, explanation: 'MTTF (Mean Time to Failure): the average time between the start of service and the next failure. A reliability measure. Improving MTTF means making the system more resilient so it fails less often. MTTD (Mean Time to Detect): average time between a failure starting and an alert firing. Improved by: better alerting coverage, lower evaluation intervals, synthetic monitoring. Target: under 5 minutes for critical failures. MTTR (Mean Time to Restore): average time from the alert firing to the service being restored. Improved by: runbooks, automation, observability data quality. MTTD + MTTR = total user impact duration. Reducing MTTD gives engineers earlier warning. Reducing MTTR (with better observability and runbooks) reduces how long each incident lasts. MTTF is improved by reliability engineering. MTTD and MTTR are improved by observability and process.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do you run effective on-call without burning out your engineers?',
    a: 'On-call sustainability requires addressing four dimensions: <ol><li><strong>Alert quality</strong>: fewer than 5 actionable pages per engineer per week. Non-actionable alerts are removed after weekly review. Engineers should never be woken up for alerts they cannot act on.</li><li><strong>Fair rotation</strong>: all team members participate on a regular schedule. No "hero" engineers who are always on-call. Minimum 3-4 engineers in the pool for reasonable rotation frequency.</li><li><strong>Compensated fairly</strong>: on-call time is compensated (time off in lieu, on-call stipend, or reduced sprint commitments during on-call weeks). The cost of being available 24/7 is real and must be acknowledged.</li><li><strong>Handoff documentation</strong>: incoming on-call receives a 5-minute written briefing on current issues, known fragile areas, and upcoming risky events. No knowledge is lost between rotations.</li></ol>Most importantly: measure and track on-call load per engineer per week. If it\'s rising, the solution is fixing the alert quality or growing the on-call pool — not asking individuals to tolerate more.',
  },
  {
    q: 'What information should be in an on-call runbook?',
    a: 'A runbook should enable any on-call engineer (not just the service owner) to respond effectively at 3am without other assistance. Required sections: <ol><li><strong>Alert context</strong>: what does this alert mean? What SLO is at risk?</li><li><strong>Triage dashboard links</strong>: exact Grafana URLs to the relevant panels, pre-filtered by the affected service</li><li><strong>Common causes</strong>: the 3-5 most common root causes for this alert, ranked by frequency</li><li><strong>Diagnostic commands</strong>: exact kubectl, SQL, or CLI commands to diagnose each common cause</li><li><strong>Mitigation steps</strong>: step-by-step actions to restore service for each cause. Rollback command, feature flag to disable, scale command.</li><li><strong>Escalation path</strong>: who to page if the runbook steps don\'t work within 15 minutes</li><li><strong>Status page template</strong>: pre-written user-facing message to copy/edit</li></ol>A runbook that requires expert knowledge to follow is not a runbook — it\'s a note-to-self. Test it by having a junior engineer simulate following it.',
  },
  { q: 'How do you write an effective postmortem document?', a: 'Postmortem structure: summary: 2-3 sentence overview. What failed, how many users were affected, how long it lasted. Timeline: a chronological log with timestamps. Detection, response actions, mitigation, resolution. Use the incident channel log as the raw input. Root cause analysis: a 5 Whys analysis drilling to the systemic root cause. Not just the immediate technical cause. Impact: quantitative impact. Users affected (count and percentage). Revenue impact if calculable. SLO budget consumed. What went well: things that worked during the incident. Good alerts, runbooks, communication. What went poorly: things that slowed detection or resolution. Action items: specific, assigned, time-boxed improvements. Each action item has an owner and a due date. Common mistakes in postmortems: vague action items (improve monitoring vs add a specific alert for X condition). Blame language. Only listing what went wrong without recognizing what worked. Not tracking action item completion. Publish postmortems broadly: the value of a postmortem increases with the number of engineers who read it.' },
  { q: 'What is on-call rotation and how do you design a sustainable one?', a: 'On-call rotation design: rotation schedule: weekly rotations are standard. Two-week rotations reduce context-switching but increase burnout risk. Follow-the-sun: for global teams, rotate on-call across timezones so each region handles incidents during business hours. Primary and secondary: primary on-call gets the first page. Secondary gets paged if primary does not acknowledge within 10-15 minutes. Tertiary: team lead or senior engineer as final escalation. Sustainability: measure on-call load. Track pages per week and time spent on incidents. High on-call load is a signal to invest in reliability or hire more engineers. Healthy target: fewer than 3-5 pages per week that require more than 15 minutes of work. Compensation: pay on-call engineers a stipend or compensatory time. Acknowledge that on-call is real work. Rotation size: at least 4-5 engineers in rotation to allow vacation and avoid burnout. Smaller teams need to limit scope or accept higher toil.' },
  { q: 'What is the danger of a runbook that has not been updated to reflect a system architecture change, and how do teams catch this before an incident?', a: 'A stale runbook is arguably worse than no runbook at all — an on-call engineer under incident pressure who follows outdated steps (checking a metric that no longer exists, restarting a service that has since been split into three separate deployments) wastes precious time following confidently-wrong guidance rather than realizing immediately that they need to improvise, and may actively make things worse (restarting the wrong component, running a diagnostic command against a decommissioned host). The standard defense is treating runbook currency as part of the change-management process itself: any PR that changes an architecture component the runbook references should require a corresponding runbook update as part of the same review, plus periodically running through runbooks during planned GameDay exercises (not just real incidents) specifically to catch drift before it bites during a genuine outage.' },
  { q: 'What are the key observability signals needed during an active incident?', a: 'Incident observability signals: primary: service error rate (is it improving or worsening?). Service request rate (is traffic normal?). Service latency (is p99 acceptable?). These tell you whether the incident is improving. Scope: which regions, clusters, or user segments are affected? Is the blast radius growing or shrinking? Deployment correlation: did a deployment happen at the time the incident started? Check deployment annotations on dashboards. Recent changes: any config changes, feature flag changes, or infrastructure changes in the last 30 minutes? Dependency health: are downstream services or databases healthy? Check their error rates. Resource utilization: CPU, memory, disk, network for the affected services. Logs: ERROR-level logs from the affected service and time window. Recent exception types and messages. Traces: find a failing request trace to see exactly where it fails. What you do NOT need during an active incident: detailed metrics from healthy services. Historical trend data beyond the last 2 hours. Root cause is secondary to mitigation during the first 30 minutes.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Incident lifecycle: detect → triage → mitigate (first!) → resolve → blameless postmortem. MTTD and MTTR are the key metrics. On-call < 5 pages/week.',
  mustKnow: [
    'Mitigate first, diagnose second — every minute of delay = more user failures. Rollback is usually fastest.',
    'MTTD (time to detect) reduced by SLI alerting. MTTR (time to resolve) reduced by runbooks and postmortem actions.',
    'Blameless postmortem: Five Whys, systemic fixes, specific action items with owners and due dates. No blame.',
    'Incident commander: single coordinator for SEV1/SEV2 — approves all changes, manages communication, no conflicting actions.',
    'Preserve evidence before restarting: logs, heap snapshot, traces. Restarts destroy in-memory state needed for root cause.',
    'On-call sustainability: < 5 pages/week, fair rotation, compensated, handoff documentation, weekly alert review.',
  ],
  interviewFocus: [
    'What is the correct order of priorities during an active production incident?',
    'What makes a postmortem "blameless" and why does it matter for engineering culture?',
    'How do you reduce MTTR systematically over time?',
  ],
};

@Component({
  selector: 'app-obs-on-call',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './on-call-incidents.html',
  styleUrl: './on-call-incidents.scss',
})
export class ObsOnCallIncidents {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
