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
  selector: 'app-devops-sdlc-agile',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './sdlc-agile.html',
  styleUrl: './sdlc-agile.scss'
})
export class DevopsSdlcAgile {

  quickRef: QuickRefItem[] = [
    { name: 'Sprint',              type: 'keyword', desc: 'Time-boxed iteration (1–4 weeks) in Scrum delivering a working increment' },
    { name: 'Backlog',             type: 'keyword', desc: 'Prioritised list of work; Product Backlog (all work) vs Sprint Backlog (this sprint)' },
    { name: 'Velocity',            type: 'keyword', desc: 'Story points completed per sprint — used for capacity planning, not cross-team comparison' },
    { name: 'WIP Limit',           type: 'keyword', desc: 'Kanban constraint on items in-progress per column — forces completion before starting new work' },
    { name: 'Definition of Done',  type: 'keyword', desc: 'Team agreement on criteria that must be met before an item is "done"' },
    { name: 'Retrospective',       type: 'keyword', desc: 'Sprint-end ceremony: what went well, what to improve, action items' },
    { name: 'User Story',          type: 'keyword', desc: 'As a [role], I want [feature] so that [benefit] — captures requirements from user perspective' },
    { name: 'Cycle Time',          type: 'keyword', desc: 'Time from work starting to done (in-progress only) — Kanban flow metric' },
    { name: 'Little\'s Law',       type: 'keyword', desc: 'Lead Time = WIP / Throughput — reducing WIP is the fastest way to reduce lead time' },
    { name: 'Epic',                type: 'keyword', desc: 'Large body of work spanning multiple sprints, broken into stories' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'SDLC Overview',
      points: [
        'The Software Development Life Cycle (SDLC) is the structured process of planning, creating, testing, and deploying software.',
        'Phases: Requirements → Design → Implementation → Testing → Deployment → Maintenance.',
        'Waterfall SDLC is sequential — each phase must complete before the next begins. Changes late in the cycle are extremely costly.',
        'Agile SDLC is iterative — short cycles (sprints) deliver working software continuously, feedback drives the next cycle.',
        'DevOps extends Agile by adding Deploy and Operate into the same feedback loop — making the full path Dev→Ops→User continuous.',
      ]
    },
    {
      heading: 'Waterfall vs Agile',
      points: [
        'Waterfall: requirements frozen upfront, single long release, feedback arrives months later. Good for regulated/fixed-spec work.',
        'Agile: requirements evolve, releases are frequent, customer feedback shapes the product continuously.',
        'Agile Manifesto values: Individuals over processes; Working software over docs; Customer collaboration over contracts; Responding to change over following a plan.',
        'Neither is universally better — requirements stability, team structure, and regulatory environment determine the right fit.',
      ]
    },
    {
      heading: 'Scrum Framework',
      points: [
        'Roles: Product Owner (prioritises backlog), Scrum Master (facilitates, removes blockers), Development Team (self-organising, cross-functional).',
        'Ceremonies: Sprint Planning → Daily Standup (15 min) → Sprint Review (demo) → Sprint Retrospective.',
        'Artefacts: Product Backlog, Sprint Backlog, Increment (shippable product each sprint).',
        'Sprint length is fixed (1–4 weeks). Scope is locked once planning completes — new requests enter the next sprint.',
        'Velocity: story points delivered per sprint — used for forecasting only, never compare across teams.',
      ]
    },
    {
      heading: 'Kanban',
      points: [
        'Kanban is a flow-based system (Toyota Production System origin) — work pulls through columns rather than being pushed in batches.',
        'Core practices: visualise work, limit WIP, manage flow, make policies explicit, improve collaboratively.',
        'WIP limits per column force the team to finish work before starting new items — reduces multitasking and context switching.',
        'Key metrics: Cycle Time (in-progress to done), Lead Time (backlog to done), Throughput (items/week), Cumulative Flow Diagram.',
        'Kanban has no sprints or mandatory roles — teams can layer cadences (weekly replenishment, monthly retrospective).',
      ]
    },
    {
      heading: 'Agile + DevOps Integration',
      points: [
        'Agile handles the "build the right thing" problem; DevOps handles the "ship it reliably" problem. Together they close the full loop.',
        'CI turns the Agile sprint increment into a deployable artefact after every commit — not just at sprint end.',
        'Definition of Done in a DevOps context: code merged, tests pass, deployed to staging, monitoring in place.',
        'DevOps metrics (DORA) complement Agile velocity: velocity measures output; lead time measures flow; MTTR measures resilience.',
      ]
    },
    {
      heading: 'Estimation & Planning',
      points: [
        'Story Points: relative complexity/effort/risk, not hours. Teams use Fibonacci (1,2,3,5,8,13) to reflect uncertainty at larger sizes.',
        'Planning Poker: each member privately picks a card, then all reveal simultaneously — drives discussion on divergent estimates.',
        'T-Shirt Sizing (S/M/L/XL): rougher estimation for epics and roadmap planning when detail is not yet known.',
        'No-estimate movement: some teams skip points entirely and track cycle time + throughput for forecasting.',
        'Estimates are forecasts, not commitments — confidence increases with finer breakdown.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Velocity & Forecast',
      language: 'typescript',
      code: `interface Sprint {
  number: number;
  committedPoints: number;
  completedPoints: number;
}

function calculateVelocity(sprints: Sprint[]): {
  average: number;
  trend: 'improving' | 'stable' | 'declining';
  forecast: (remainingPoints: number) => number;
} {
  if (sprints.length === 0) throw new Error('No sprint data');

  const completed = sprints.map(s => s.completedPoints);
  const average = completed.reduce((a, b) => a + b, 0) / completed.length;

  const third = Math.floor(sprints.length / 3);
  const earlyAvg = completed.slice(0, third).reduce((a, b) => a + b, 0) / (third || 1);
  const lateAvg  = completed.slice(-third).reduce((a, b) => a + b, 0) / (third || 1);
  const trend = lateAvg > earlyAvg * 1.1 ? 'improving'
              : lateAvg < earlyAvg * 0.9 ? 'declining'
              : 'stable';

  const forecast = (remainingPoints: number) =>
    Math.ceil(remainingPoints / average);

  return { average: Math.round(average), trend, forecast };
}

const sprints: Sprint[] = [
  { number: 1, committedPoints: 30, completedPoints: 24 },
  { number: 2, committedPoints: 30, completedPoints: 28 },
  { number: 3, committedPoints: 32, completedPoints: 31 },
  { number: 4, committedPoints: 32, completedPoints: 30 },
];

const v = calculateVelocity(sprints);
console.log(\`Average velocity: \${v.average} points/sprint\`);  // 28
console.log(\`Trend: \${v.trend}\`);                              // improving
console.log(\`Sprints to complete 140 points: \${v.forecast(140)}\`); // 5`,
    },
    {
      label: 'Kanban Flow Metrics',
      language: 'typescript',
      code: `interface WorkItem {
  id: string;
  addedToBacklog: Date;
  startedAt: Date;
  completedAt: Date;
}

interface FlowMetrics {
  avgCycleTimeDays: number;    // in-progress to done
  avgLeadTimeDays: number;     // backlog to done
  throughputPerWeek: number;
}

function calculateFlowMetrics(items: WorkItem[]): FlowMetrics {
  const ms = (a: Date, b: Date) => (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);

  const cycleTimes  = items.map(i => ms(i.startedAt, i.completedAt));
  const leadTimes   = items.map(i => ms(i.addedToBacklog, i.completedAt));

  const avgCycleTimeDays = cycleTimes.reduce((a, b) => a + b, 0) / items.length;
  const avgLeadTimeDays  = leadTimes.reduce((a, b) => a + b, 0) / items.length;

  const sorted = [...items].sort((a, b) =>
    a.completedAt.getTime() - b.completedAt.getTime());
  const rangeMs = sorted[sorted.length - 1].completedAt.getTime()
                - sorted[0].completedAt.getTime();
  const rangeWeeks = rangeMs / (1000 * 60 * 60 * 24 * 7) || 1;
  const throughputPerWeek = items.length / rangeWeeks;

  return {
    avgCycleTimeDays: Math.round(avgCycleTimeDays * 10) / 10,
    avgLeadTimeDays:  Math.round(avgLeadTimeDays * 10) / 10,
    throughputPerWeek: Math.round(throughputPerWeek * 10) / 10,
  };
}

// Little's Law: Lead Time = WIP / Throughput
// If throughput = 5 items/week and WIP = 20, lead time ≈ 4 weeks
function littlesLaw(wip: number, throughput: number): number {
  return wip / throughput;
}

console.log(\`Expected lead time: \${littlesLaw(20, 5)} weeks\`); // 4`,
    },
    {
      label: 'Sprint Planning Checklist',
      language: 'bash',
      code: `#!/usr/bin/env bash
# Sprint Planning Checklist

echo "=== Sprint Planning Checklist ==="

# 1. Capacity
TEAM_SIZE=5
SPRINT_DAYS=10
FOCUS_FACTOR=0.7   # 70% focus (meetings, admin subtracted)
capacity=$(echo "$TEAM_SIZE * $SPRINT_DAYS * $FOCUS_FACTOR" | bc)
echo "Team capacity: $capacity person-days this sprint"

# 2. Sprint Goal — must be answered before pulling stories
echo ""
echo "Sprint Goal: What single outcome will this sprint deliver?"
echo ""

# 3. Definition of Done reminder
echo "=== Definition of Done Checklist ==="
echo "  [ ] Code reviewed and merged to main"
echo "  [ ] Unit tests pass (target >80% coverage)"
echo "  [ ] Integration tests pass in CI"
echo "  [ ] Deployed to staging environment"
echo "  [ ] Monitoring / alerting configured"
echo "  [ ] Acceptance criteria verified by Product Owner"

# 4. Daily Standup format
echo ""
echo "=== Daily Standup (15 min max) ==="
echo "  1. What did I complete since yesterday?"
echo "  2. What will I work on today?"
echo "  3. Are there any blockers?"`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Velocity as a cross-team performance metric',
      wrong: `// Team A: 40 pts/sprint — "high performer"
// Team B: 25 pts/sprint — "low performer"
// Used in manager dashboards to rank teams`,
      right: `// Use velocity only to forecast a team's own future sprints
// Cross-team comparison: use cycle time + throughput instead
// Story point scales are not standardised across teams`,
      explanation: 'Story points are calibrated differently per team. Team A\'s 40 points may represent less work than team B\'s 25. Comparing velocities creates perverse incentives to inflate estimates.',
    },
    {
      title: 'Skipping the retrospective',
      wrong: `// "We're too busy to retrospect"
// Sprint ends, new sprint immediately starts
// Same problems repeat every sprint, every quarter`,
      right: `// Retro is the improvement engine — protect it
// Time-box to 45 min. Focus on 1–2 action items max
// Assign each action an owner; check it next sprint`,
      explanation: 'Without retrospectives, the team repeats the same inefficiencies indefinitely. Even a 20-minute retro with one actionable item compounds improvement over time.',
    },
    {
      title: 'No WIP limits on the Kanban board',
      wrong: `// Board: 15 items "In Progress" simultaneously
// Team constantly multitasks and context-switches
// Nothing finishes; everything stays "almost done"`,
      right: `// WIP limit = team members per column (or lower)
// When a column is full, pull nothing new — finish first
// "Stop starting, start finishing"`,
      explanation: 'Without WIP limits, Kanban is just a decorated backlog. WIP limits surface bottlenecks and enforce the flow principle — a backed-up column exposes downstream slowness.',
    },
    {
      title: 'Treating sprint commitment as a contract',
      wrong: `// Manager: "You committed 30 points, why only 25?"
// Team inflates estimates to cover themselves
// Scrum becomes waterfall with 2-week checkpoints`,
      right: `// Sprint goal is a commitment; story list is a forecast
// If scope must change, negotiate openly with the team
// Velocity stabilises naturally over 4–6 sprints`,
      explanation: 'When treated as a contract, teams game estimates, skip tests to hit numbers, and lose psychological safety. Agile is built on empiricism and trust — commitment to the goal, not the exact story list.',
    },
    {
      title: 'Definition of Done not agreed or ignored',
      wrong: `// Dev says "done" = I finished coding
// QA says "done" = I finished testing
// No shared agreement — tech debt accumulates`,
      right: `// DoD agreed by whole team upfront:
// code reviewed, tests pass, deployed to staging,
// monitoring configured, acceptance criteria verified`,
      explanation: 'Without a shared DoD, "developer done" features accumulate untested and undeployed. The DoD makes every increment genuinely shippable, not just feature-complete.',
    },
    {
      title: 'Daily standups become status reports to the manager',
      wrong: `// Manager runs the standup, each person reports to them
// 45 minutes of detailed status updates
// Team members disengage, treat it as a meeting tax`,
      right: `// Team runs standup, Scrum Master facilitates
// 15 min max — three questions only
// Focus: coordinate with each other, not report upward`,
      explanation: 'Standups are for the team to coordinate with each other. When they become status reports, they lose their value. The manager should observe, not conduct.',
    },
  ];

  challenge: Challenge = {
    title: 'Sprint Forecast Tool',
    language: 'typescript',
    description: `Build a sprint forecasting tool that:

1. Takes an array of past sprint velocities
2. Calculates the rolling average (last 3 sprints)
3. Estimates sprints remaining to complete a backlog
4. Returns a confidence range (optimistic = max recent velocity, pessimistic = min)

Use the last 3 sprints for the rolling average by default.`,
    hints: [
      'Rolling average: slice the last N sprints, not all sprints',
      'Optimistic forecast uses max velocity from recent sprints',
      'Pessimistic forecast uses min velocity from recent sprints',
      'Math.ceil ensures partial sprints still count as full sprints',
    ],
    starterCode: `interface SprintForecast {
  rollingAverage: number;
  sprintsRemaining: {
    average: number;
    optimistic: number;
    pessimistic: number;
  };
}

function forecastSprints(
  pastVelocities: number[],
  remainingPoints: number,
  lookback: number = 3
): SprintForecast {
  // TODO: implement
  return {
    rollingAverage: 0,
    sprintsRemaining: { average: 0, optimistic: 0, pessimistic: 0 }
  };
}`,
    solution: `function forecastSprints(
  pastVelocities: number[],
  remainingPoints: number,
  lookback: number = 3
): SprintForecast {
  if (pastVelocities.length === 0) {
    throw new Error('No velocity data — run at least one sprint first');
  }

  const recent = pastVelocities.slice(-lookback);
  const rollingAverage = recent.reduce((a, b) => a + b, 0) / recent.length;
  const maxVelocity = Math.max(...recent);
  const minVelocity = Math.min(...recent);

  return {
    rollingAverage: Math.round(rollingAverage),
    sprintsRemaining: {
      average:     Math.ceil(remainingPoints / rollingAverage),
      optimistic:  Math.ceil(remainingPoints / maxVelocity),
      pessimistic: Math.ceil(remainingPoints / minVelocity),
    },
  };
}

// Test:
const v = [22, 25, 28, 30, 27];
const f = forecastSprints(v, 120);
// rollingAverage = (28+30+27)/3 ≈ 28
// average sprints = ceil(120/28.33) = 5
// optimistic = ceil(120/30) = 4
// pessimistic = ceil(120/27) = 5`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between Scrum and Kanban?',
      options: [
        'Scrum requires more developers; Kanban works with smaller teams',
        'Scrum uses time-boxed sprints with defined roles and ceremonies; Kanban is continuous flow with WIP limits',
        'Kanban is only for operations teams; Scrum is for development',
        'Scrum uses story points; Kanban uses hours',
      ],
      answer: 1,
      explanation: 'Scrum structures work in fixed-length sprints with roles (PO, SM, Dev Team) and ceremonies. Kanban is a continuous flow system with no sprints or mandatory roles — it limits WIP per column to manage flow.',
    },
    {
      q: 'What does the Definition of Done (DoD) represent in Scrum?',
      options: [
        'The acceptance criteria for a specific user story',
        'The team\'s shared checklist of criteria that must be met before any increment is considered complete',
        'The product owner\'s sign-off on a feature',
        'The sprint goal statement agreed in planning',
      ],
      answer: 1,
      explanation: 'The DoD is a team-level agreement covering all work (code reviewed, tests pass, deployed to staging). It differs from acceptance criteria, which are story-specific. The DoD makes the increment genuinely shippable.',
    },
    {
      q: 'Why should velocity NOT be used to compare the productivity of two Scrum teams?',
      options: [
        'Velocity is only valid for teams using two-week sprints',
        'Story point scales differ between teams — team A\'s 5 points may not equal team B\'s 5 points',
        'Velocity can only be compared when using identical planning poker cards',
        'Velocity only measures speed, not quality',
      ],
      answer: 1,
      explanation: 'Story points are calibrated relative to a team\'s own reference stories. There is no universal scale. Team A at 40 pts/sprint vs team B at 25 tells you nothing about relative output — it only reflects internal calibration.',
    },
    {
      q: 'In Kanban, what is the primary purpose of a WIP limit?',
      options: [
        'To limit the total number of items in the backlog',
        'To prevent the team taking on more work than they can complete, improving flow',
        'To cap the number of team members working on a project',
        'To restrict the number of bugs allowed in a release',
      ],
      answer: 1,
      explanation: 'WIP limits constrain how many items can be in a given column at once. When full, no new work enters — forcing the team to finish items first. This reduces multitasking, exposes bottlenecks, and improves cycle time.',
    },
    {
      q: 'Using Little\'s Law, if a team has 20 items in progress (WIP) and completes 4 items per week, what is their expected lead time?',
      options: [
        '2 weeks',
        '4 weeks',
        '5 weeks',
        '80 weeks',
      ],
      answer: 2,
      explanation: 'Little\'s Law: Lead Time = WIP / Throughput = 20 / 4 = 5 weeks. This is why reducing WIP (not working faster) is the fastest lever for reducing lead time in Kanban systems.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should a team use Scrum vs Kanban?',
      a: 'Scrum suits teams building discrete features with clear iterations — product development where sprint goals provide structure. Kanban suits continuous work streams with unpredictable arrival — operations, support, maintenance, or DevOps pipelines. Many teams use Scrumban: Kanban flow with periodic planning cadences.',
    },
    {
      q: 'What is the difference between a user story and an epic?',
      a: 'A user story is a small, deliverable unit of value completable in a sprint: "As a user, I want to reset my password." An epic spans multiple sprints: "User Authentication" might contain stories for login, registration, password reset, OAuth, and MFA. Epics are broken into stories during backlog refinement.',
    },
    {
      q: 'How do you handle a stakeholder who keeps changing requirements mid-sprint?',
      a: 'The sprint backlog is locked once planning completes — new requests go to the Product Backlog for the next sprint. If a change is genuinely urgent, the PO and team can negotiate: descope an existing item of equal size to make room, or in rare cases abort and replan. The Scrum Master shields the team from in-sprint scope creep.',
    },
    {
      q: 'What is Little\'s Law and why does it matter in Kanban?',
      a: 'Little\'s Law: Lead Time = WIP / Throughput. If a team completes 5 items/week and has 20 in progress, average lead time is 4 weeks. Reducing WIP is therefore the fastest way to reduce lead time — even without working faster. This is the mathematical foundation behind WIP limits.',
    },
    {
      q: 'What is the difference between Cycle Time and Lead Time?',
      a: 'Lead Time starts when the item enters the backlog (customer request time). Cycle Time starts when the team begins working on it. Lead Time ≥ Cycle Time — the gap between them is queue/wait time. In Kanban, both metrics are tracked; reducing the gap (wait time) is as important as reducing active work time.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Agile is iterative delivery with fast feedback; Scrum structures it with sprints and roles; Kanban manages it with flow and WIP limits — DevOps extends both into production.',
    mustKnow: [
      'Waterfall: sequential phases; Agile: iterative cycles with continuous feedback',
      'Scrum roles: Product Owner, Scrum Master, Development Team',
      'Scrum ceremonies: Planning, Daily Standup, Review, Retrospective',
      'Velocity = story points/sprint — team-internal, never cross-team comparison',
      'Kanban: visualise, limit WIP, manage flow — no sprints or mandatory roles',
      'WIP limits force finishing over starting — reduces cycle time',
      'Definition of Done: shared team criteria for a "shippable" increment',
      'Little\'s Law: Lead Time = WIP / Throughput',
    ],
    interviewFocus: [
      'Compare Scrum and Kanban — when would you choose each?',
      'Why is velocity unreliable for comparing two teams?',
      'How does WIP limiting improve flow? Apply Little\'s Law with numbers',
      'What makes a good Definition of Done and how does it connect to DevOps CI/CD?',
    ],
  };
}
