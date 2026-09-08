import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'The Escalation Policy the QnA Only Describes',
    points: [
      'The page’s own QnA on on-call routing describes a complete, concrete escalation policy: "if primary on-call does not acknowledge within 15 minutes, escalate to secondary. If secondary does not respond in 10 minutes, escalate to the team lead." No code anywhere on the page shows what actually implements that logic.',
      'The genuinely easy-to-get-wrong part isn’t the escalation ORDER — it’s the TIMING. Each tier’s own timeout is relative to when THAT tier was paged, not relative to when the alert originally fired. A policy with a 15-minute first tier and two 10-minute tiers after it takes up to 35 minutes to fully exhaust, not 15 or 10.',
      'Verified directly with a small state-machine function walking through the exact scenarios the QnA describes: the primary engineer acknowledging in time, the primary missing their window while the secondary catches it, and — the case that actually matters for on-call design — nobody ever acknowledging at all, which the policy needs to surface as a distinct, alarming outcome rather than silently doing nothing.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Escalation Timeline, Verified Against All Three Outcomes',
    language: 'typescript',
    code: `interface EscalationStep {
  target: string;
  timeoutMs: number;
}

interface EscalationEvent {
  atMs: number;
  action: string;
}

function buildEscalationTimeline(
  firedAtMs: number,
  ackAtMs: number | null,
  policy: EscalationStep[]
): EscalationEvent[] {
  const events: EscalationEvent[] = [];
  let elapsed = 0;

  for (const step of policy) {
    events.push({ atMs: firedAtMs + elapsed, action: \`page \${step.target}\` });
    const deadline = elapsed + step.timeoutMs; // relative to when THIS tier started
    if (ackAtMs !== null && ackAtMs <= firedAtMs + deadline) {
      events.push({ atMs: ackAtMs, action: \`acknowledged by \${step.target}\` });
      return events;
    }
    elapsed = deadline;
  }

  events.push({ atMs: firedAtMs + elapsed, action: 'ESCALATION EXHAUSTED — no one acknowledged' });
  return events;
}

const policy: EscalationStep[] = [
  { target: 'primary',     timeoutMs: 15 * 60_000 },
  { target: 'secondary',   timeoutMs: 10 * 60_000 },
  { target: 'team-lead',   timeoutMs: 10 * 60_000 },
];

console.log('Case 1: primary acks within 15 min');
console.log(buildEscalationTimeline(0, 5 * 60_000, policy));

console.log('Case 2: primary never acks, secondary acks at 20 min');
console.log(buildEscalationTimeline(0, 20 * 60_000, policy));

console.log('Case 3: nobody ever acks');
console.log(buildEscalationTimeline(0, null, policy));
// Case 1 -> [ page primary @0, acknowledged by primary @300000 ]
// Case 2 -> [ page primary @0, page secondary @900000, acknowledged by secondary @1200000 ]
// Case 3 -> [ page primary @0, page secondary @900000, page team-lead @1500000,
//             ESCALATION EXHAUSTED — no one acknowledged @2100000 ]`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Case 3’s final timestamp is 2,100,000ms — 35 minutes. Given the policy’s own three timeouts (15, 10, and 10 minutes), why is the total 35 minutes rather than the sum of just the first two tiers (25 minutes), or some other combination?',
  hint: 'Walk through exactly which tier is "currently paged and waiting" during each stretch of time, and how long each of those stretches actually lasts.',
  solution: `// 35 minutes is the sum of ALL THREE tiers' own timeouts (15 + 10 + 10),
// because the loop only advances to the NEXT tier once the CURRENT
// tier's own deadline has fully elapsed with no acknowledgement --
// every tier in the policy has to be given its own full window before
// the escalation can move past it. The specific breakdown:
//
// - t=0 to t=15min: primary is paged and has its full 15-minute window
// - t=15min to t=25min: secondary is paged and has its own full
//   10-minute window (the SECOND tier's timeoutMs, unrelated to the
//   first tier's 15 minutes)
// - t=25min to t=35min: team-lead is paged and has its own full
//   10-minute window
// - t=35min: every tier is now exhausted with no acknowledgement
//
// The general rule this demonstrates: total worst-case escalation time
// for an N-tier policy is the SUM of every tier's own timeout, not the
// longest single tier, and not the first tier alone -- a policy
// designer adding a "just in case" extra tier is implicitly extending
// how long a genuinely urgent incident can go completely unacknowledged.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>ackAtMs</code> is checked against <code>firedAtMs + deadline</code> in every loop iteration, an acknowledgement that arrives DURING the primary’s window but is processed slightly late could incorrectly also trigger the secondary’s page.',
    reality: 'The function returns immediately the moment it finds a matching acknowledgement (<code>return events;</code> inside the loop) — there’s no possibility of a later tier being paged once an earlier one has already been credited with the acknowledgement, regardless of how close to the deadline the acknowledgement itself arrives. The check is exact: as long as <code>ackAtMs</code> is less than or equal to that tier’s own deadline, escalation stops there.',
  },
  {
    thought: 'A real paging system like PagerDuty or Opsgenie implements escalation timing exactly this simply — a flat, linear sequence of timeout windows.',
    reality: 'This subtopic’s state machine captures the CORE timing logic the page’s own QnA describes, but real paging platforms layer significantly more on top: on-call SCHEDULE lookups (who is actually primary this week, accounting for shift handoffs mid-incident), override rules (someone marking themselves unavailable), and multiple simultaneous notification channels per tier (SMS AND push AND phone call, not just one). The linear timeout-and-advance mechanism demonstrated here is the piece those richer systems build on top of, not a complete substitute for them.',
  },
];

@Component({
  selector: 'app-obs-alerting-escalation',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './building-a-real-escalation-policy-state-machine.html',
  styleUrl: './building-a-real-escalation-policy-state-machine.scss',
})
export class BuildingARealEscalationPolicyStateMachineSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
