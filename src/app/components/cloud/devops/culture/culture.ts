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
  selector: 'app-devops-culture',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './culture.html',
  styleUrl: './culture.scss'
})
export class DevopsCulture {

  quickRef: QuickRefItem[] = [
    { name: 'CALMS',         type: 'keyword', desc: 'Culture, Automation, Lean, Measurement, Sharing — the five pillars of DevOps' },
    { name: 'Three Ways',    type: 'keyword', desc: 'Flow (left to right), Feedback (right to left), Continual Learning & Experimentation' },
    { name: 'DORA Metrics',  type: 'keyword', desc: 'Deployment Frequency, Lead Time, MTTR, Change Failure Rate — health of a DevOps pipeline' },
    { name: 'Shifting Left', type: 'keyword', desc: 'Move testing, security, and quality checks earlier in the pipeline' },
    { name: 'Toil',          type: 'keyword', desc: 'Manual, repetitive, automatable work that scales linearly with service growth (SRE term)' },
    { name: 'Blameless',     type: 'keyword', desc: 'Post-mortems focus on system failure, not individual blame — psychological safety key' },
    { name: 'Mean Time to Recover', type: 'keyword', desc: 'MTTR — average time to restore service after an incident; lower is better' },
    { name: 'Lead Time',     type: 'keyword', desc: 'Clock starts at commit, ends at production deploy — measures flow velocity' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is DevOps?',
      points: [
        'DevOps is a set of practices, cultural philosophies, and tools that increase an organisation\'s ability to deliver applications at high velocity.',
        'It breaks down the historical wall between Development (build features) and Operations (keep systems stable) so both share ownership of the full lifecycle.',
        'DevOps is NOT a job title, a tool, or a team — it is a mindset and a way of working that spreads across the whole organisation.',
        'The goal: reduce the time from idea to production value while maintaining quality and reliability.',
      ]
    },
    {
      heading: 'CALMS Framework',
      points: [
        'Culture — people and process first: shared ownership, psychological safety, blameless post-mortems, breaking silos.',
        'Automation — eliminate manual, error-prone work: CI/CD pipelines, IaC, test automation, GitOps.',
        'Lean — limit work-in-progress, eliminate waste, optimise for flow not resource utilisation.',
        'Measurement — you cannot improve what you cannot measure: DORA metrics, SLIs, SLOs, cost of delay.',
        'Sharing — open feedback loops, runbooks, architecture decisions, on-call experience — knowledge must not be siloed.',
      ]
    },
    {
      heading: 'The Three Ways (Gene Kim)',
      points: [
        'First Way — Flow: optimise left-to-right flow of work from Dev through Ops to customer. Reduce batch size, eliminate handoffs, make work visible (Kanban).',
        'Second Way — Feedback: amplify fast feedback loops from right to left. Production monitoring informs Dev; tests catch regressions before deploy.',
        'Third Way — Continual Learning: create a culture of experimentation and learning from failure. Game Days, chaos engineering, blameless post-mortems.',
        'The Three Ways are ordered — you cannot have meaningful feedback (Way 2) until flow (Way 1) is under control.',
      ]
    },
    {
      heading: 'DORA Metrics — The Four Key Metrics',
      points: [
        'Deployment Frequency: how often does the team deploy to production? Elite teams deploy multiple times per day.',
        'Lead Time for Changes: time from commit to production. Elite = less than one hour; low-performers = more than six months.',
        'Change Failure Rate: % of deployments that cause a production incident. Elite < 5%; low-performers 46–60%.',
        'Mean Time to Restore (MTTR): how long to recover from a failure. Elite < one hour; low-performers > six months.',
        'These four metrics predict organisational performance and are backed by seven years of Accelerate research data.',
      ]
    },
    {
      heading: 'Psychological Safety & Blameless Culture',
      points: [
        'Psychological safety (Amy Edmondson) is the belief that you will not be punished for speaking up, making mistakes, or asking questions.',
        'Without it: people hide failures, avoid risk, and avoid raising concerns — exactly the opposite of what DevOps needs.',
        'Blameless post-mortems: when an incident happens, the question is "what in the system allowed this to happen?" — not "who made the mistake?"',
        'Systems thinking: humans follow the procedures, tools, and incentives given to them; fix the system to prevent the error class.',
        'Google\'s Project Aristotle found psychological safety to be the number one predictor of high-performing teams.',
      ]
    },
    {
      heading: 'DevOps vs SRE vs Platform Engineering',
      points: [
        'DevOps is the culture and philosophy — the "what and why".',
        'SRE (Site Reliability Engineering) is Google\'s opinionated implementation of DevOps — "how" with SLOs, error budgets, and toil budgets.',
        'Platform Engineering builds the internal developer platform (IDP) so product teams self-serve infrastructure and don\'t wait for ops tickets.',
        'In practice they overlap: an SRE team can provide the golden path platform that embodies DevOps culture.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'DORA Metrics Dashboard (YAML)',
      language: 'bash',
      code: `# Example: tracking DORA metrics in a CI/CD pipeline
# Each deploy job records these four metrics

deploy_production:
  stage: deploy
  script:
    - echo "Deployment started at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    - ./scripts/deploy.sh
    - echo "Deployment completed"
  after_script:
    # Deployment Frequency — increment counter in your metrics store
    - curl -X POST "$METRICS_URL/deployments" \\
        -d '{"service":"api","env":"production","timestamp":"'$(date -u +%s)'"}'

# Change Failure Rate — tracked separately via incident tagging
# When rolling back or filing an incident, tag the deploy SHA:
#   incident_linked_deploy: abc123
#   This lets you calculate: incidents / total deploys

# Lead Time — timestamp the commit and the deploy
# Lead Time = deploy_timestamp - commit_timestamp

# MTTR — tracked in incident management tool (PagerDuty/OpsGenie)
# MTTR = sum(incident_resolved_at - incident_triggered_at) / incident_count`
    },
    {
      label: 'Blameless Post-Mortem Template',
      language: 'bash',
      code: `# Incident Post-Mortem — [Date] [Service] [Brief Title]

## Summary
One paragraph describing what happened and the customer impact.

## Timeline (UTC)
| Time  | Event |
|-------|-------|
| 14:02 | Alert fired: p99 latency > 2s on /api/orders |
| 14:05 | On-call acknowledged, began investigation |
| 14:18 | Root cause identified: DB connection pool exhausted |
| 14:22 | Mitigation: increased pool size, restarted pods |
| 14:25 | Service recovered, latency returned to baseline |

## Root Cause
The connection pool limit (20) was set during initial launch when traffic was 10×
lower. A marketing campaign caused a traffic spike that exhausted the pool.

## Contributing Factors
- No connection pool alert was configured
- Load test did not simulate marketing spike patterns
- Pool size was not part of capacity review checklist

## Action Items (NO blame — fix the system)
| Action | Owner | Due |
|--------|-------|-----|
| Add connection pool saturation alert | Platform team | 2024-02-10 |
| Add pool size to capacity review checklist | SRE | 2024-02-07 |
| Load test to include 5× traffic spikes | Dev team | 2024-02-14 |

## What went well
- Alert fired within 2 minutes of threshold breach
- Runbook had the mitigation steps — recovery was fast`
    },
    {
      label: 'Team Topology — Value Stream',
      language: 'typescript',
      code: `// Modelling a value stream in code (conceptual)
// A value stream maps how work flows from idea to customer value

interface ValueStreamStep {
  name: string;
  owner: string;
  avgDays: number;    // average time in this step
  waitDays: number;   // average wait before this step starts
}

const apiFeatureStream: ValueStreamStep[] = [
  { name: 'Feature ideation',       owner: 'Product',   avgDays: 2,  waitDays: 0 },
  { name: 'Design & spec',          owner: 'Design',    avgDays: 3,  waitDays: 1 },
  { name: 'Development',            owner: 'Dev',       avgDays: 5,  waitDays: 0 },
  { name: 'Code review',            owner: 'Dev',       avgDays: 1,  waitDays: 2 }, // wait = queue
  { name: 'QA testing',             owner: 'QA',        avgDays: 3,  waitDays: 1 },
  { name: 'Staging deploy approval',owner: 'Ops',       avgDays: 0.5,waitDays: 3 }, // ops bottleneck
  { name: 'Production deploy',      owner: 'Ops',       avgDays: 0.5,waitDays: 1 },
];

function analyseValueStream(steps: ValueStreamStep[]) {
  const totalTime = steps.reduce((s, v) => s + v.avgDays + v.waitDays, 0);
  const workTime  = steps.reduce((s, v) => s + v.avgDays, 0);
  const waitTime  = steps.reduce((s, v) => s + v.waitDays, 0);
  const efficiency = ((workTime / totalTime) * 100).toFixed(1);

  console.log(\`Lead time: \${totalTime} days\`);
  console.log(\`Active work: \${workTime} days (\${efficiency}% efficiency)\`);
  console.log(\`Wait/queue: \${waitTime} days — these are the improvement targets\`);
}

// Output: Lead time: 23 days, Active work: 15 days (65.2% efficiency)
// The 8 days of wait time are where DevOps focuses first`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'DevOps as a team or role',
      wrong: `// Creating a "DevOps team" that owns the pipeline
// while Dev and Ops remain siloed
// This just creates a third silo`,
      right: `// DevOps is a culture applied by ALL teams
// Dev teams own their pipelines end-to-end
// Platform teams provide golden path tooling`,
      explanation: 'A "DevOps team" that becomes a gatekeeper recreates the exact handoff bottleneck DevOps is meant to eliminate. The practice should spread across everyone, not be centralised.',
    },
    {
      title: 'Treating DevOps as tools only',
      wrong: `# "We installed Jenkins + Docker so we do DevOps now"
deploy:
  script: docker build && docker push`,
      right: `# Tools enable DevOps culture, they don't create it
# Ask: do Dev and Ops share on-call? Share post-mortems?
# Do teams own their services in production?`,
      explanation: 'Tools are the implementation, not the goal. A team can have every DevOps tool and still have a blame culture, long lead times, and release fear. Culture comes first.',
    },
    {
      title: 'Skipping measurement (no DORA baseline)',
      wrong: `# "We are doing DevOps" but no metrics
# No deployment frequency count
# No lead time tracking`,
      right: `# Baseline DORA metrics before optimising
# Week 1: count deploys, measure lead time
# Then target: which metric to improve first?`,
      explanation: 'Without measurement you cannot demonstrate improvement or know where to focus. Even a rough spreadsheet-based DORA baseline is better than nothing.',
    },
    {
      title: 'Blameful post-mortems',
      wrong: `# Post-mortem agenda:
# 1. Who deployed the broken change?
# 2. Why did they not test it?
# 3. What disciplinary action?`,
      right: `# Blameless post-mortem agenda:
# 1. Timeline of events
# 2. What systemic gaps allowed this?
# 3. Action items to fix the system`,
      explanation: 'Blame-focused post-mortems cause engineers to hide failures and avoid risk. Systems thinking recognises that errors are predictable outcomes of flawed processes, not individual failures.',
    },
    {
      title: 'Large batch releases ("release trains")',
      wrong: `# Monthly release window
# 40 PRs bundled, deployed together
# Hours of manual testing, high stress`,
      right: `# Deploy small, deploy often
# Each PR merges to main and deploys automatically
# Feature flags decouple deploy from release`,
      explanation: 'Large batches amplify risk — when something fails it is hard to identify which change caused it. Small, frequent deploys reduce blast radius and make rollback trivial.',
    },
    {
      title: 'Ignoring psychological safety',
      wrong: `// "Engineers should just speak up if there's a problem"
// No structured retrospectives
// Senior engineers dismiss junior concerns
// Outages result in public blame`,
      right: `// Build psychological safety deliberately:
// - Anonymous incident surveys
// - Structured blameless retros
// - Leadership visibly learning from mistakes`,
      explanation: 'Psychological safety does not emerge naturally in hierarchical organisations. It must be built deliberately through leadership modelling vulnerability, blameless processes, and structured feedback mechanisms.',
    },
  ];

  challenge: Challenge = {
    title: 'Calculate DORA Metrics from Deployment Log',
    language: 'typescript',
    description: `You have a log of production deployments and incidents. Write a function that calculates all four DORA metrics:

1. **Deployment Frequency** — total deploys per week
2. **Lead Time** — average time (hours) from commit to deploy
3. **Change Failure Rate** — % of deploys that triggered an incident
4. **MTTR** — average incident recovery time in minutes

Use the provided types. The function should return a DORASummary object.`,
    hints: [
      'Deployment Frequency = deployments.length / weeks in range',
      'Lead Time = average of (deployedAt - commitAt) in hours',
      'Change Failure Rate = incidents / total deploys × 100',
      'MTTR = average of (resolvedAt - triggeredAt) in minutes',
    ],
    starterCode: `interface Deployment {
  id: string;
  commitAt: Date;
  deployedAt: Date;
  triggeredIncident: boolean;
}

interface Incident {
  triggeredAt: Date;
  resolvedAt: Date;
}

interface DORASummary {
  deploymentFrequency: number;  // per week
  leadTimeHours: number;
  changeFailureRate: number;    // percentage
  mttrMinutes: number;
}

function calculateDORA(
  deployments: Deployment[],
  incidents: Incident[],
  weeksInRange: number
): DORASummary {
  // TODO: implement
  return { deploymentFrequency: 0, leadTimeHours: 0, changeFailureRate: 0, mttrMinutes: 0 };
}`,
    solution: `function calculateDORA(
  deployments: Deployment[],
  incidents: Incident[],
  weeksInRange: number
): DORASummary {
  const deploymentFrequency = deployments.length / weeksInRange;

  const leadTimeHours = deployments.length === 0 ? 0 :
    deployments.reduce((sum, d) => {
      const ms = d.deployedAt.getTime() - d.commitAt.getTime();
      return sum + ms / (1000 * 60 * 60);
    }, 0) / deployments.length;

  const failedDeploys = deployments.filter(d => d.triggeredIncident).length;
  const changeFailureRate = deployments.length === 0 ? 0 :
    (failedDeploys / deployments.length) * 100;

  const mttrMinutes = incidents.length === 0 ? 0 :
    incidents.reduce((sum, i) => {
      const ms = i.resolvedAt.getTime() - i.triggeredAt.getTime();
      return sum + ms / (1000 * 60);
    }, 0) / incidents.length;

  return { deploymentFrequency, leadTimeHours, changeFailureRate, mttrMinutes };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does CALMS stand for in the context of DevOps?',
      options: [
        'Culture, Automation, Lean, Measurement, Sharing',
        'Continuous, Agile, Lean, Monitoring, Security',
        'Collaboration, Automation, Learning, Metrics, Speed',
        'Culture, Agile, Logging, Measurement, Security',
      ],
      answer: 0,
      explanation: 'CALMS is a framework for assessing DevOps transformation: Culture, Automation, Lean, Measurement, Sharing. It emphasises that people and culture come before tools.',
    },
    {
      q: 'In Gene Kim\'s "Three Ways", what does the First Way represent?',
      options: [
        'Feedback from operations back to development',
        'Continual learning and experimentation',
        'Optimising left-to-right flow of work from Dev through Ops to customer',
        'Measuring system performance with DORA metrics',
      ],
      answer: 2,
      explanation: 'The First Way is about Flow — optimising the left-to-right movement of work through the value stream, reducing batch sizes, eliminating handoff queues, and making work visible.',
    },
    {
      q: 'Which DORA metric measures the percentage of deployments that cause a production incident?',
      options: [
        'Deployment Frequency',
        'Lead Time for Changes',
        'Mean Time to Restore',
        'Change Failure Rate',
      ],
      answer: 3,
      explanation: 'Change Failure Rate = (deployments causing incidents / total deployments) × 100. Elite teams target below 5%. It is a quality signal for the deployment pipeline.',
    },
    {
      q: 'What is the primary purpose of a blameless post-mortem?',
      options: [
        'To identify and discipline the engineer who caused the incident',
        'To document what systemic factors allowed the incident and create action items to fix them',
        'To prove the system is reliable by documenting all near-misses',
        'To satisfy regulatory requirements for incident documentation',
      ],
      answer: 1,
      explanation: 'Blameless post-mortems focus on the system, not the individual. They ask "what allowed this to happen?" and produce action items that fix the process, tooling, or monitoring — not punish people.',
    },
    {
      q: 'Why are large batch releases ("release trains") considered an anti-pattern in DevOps?',
      options: [
        'They reduce deployment frequency below elite DORA thresholds',
        'They require expensive tooling to coordinate',
        'They bundle many changes together, making failures hard to diagnose and rollback risky',
        'They are only problematic for monolithic architectures',
      ],
      answer: 2,
      explanation: 'Large batches increase risk (more changes = harder to find root cause), increase stress around release windows, and make rollback difficult. DevOps favours small, frequent, automated deploys to reduce batch size and blast radius.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Is DevOps just CI/CD and Docker?',
      a: 'No. CI/CD and containers are useful DevOps tools, but DevOps is primarily a cultural and organisational change. A team with perfect CI/CD but a blame culture, release fear, and siloed Dev/Ops ownership is NOT doing DevOps. Tools enable the culture but do not create it.',
    },
    {
      q: 'What is the difference between DevOps and Agile?',
      a: 'Agile focuses on iterative software development practices within a team (sprints, backlogs, retrospectives). DevOps extends that to the full delivery lifecycle — how software gets from code to production and how it runs. They are complementary: Agile without DevOps often means fast development but slow, painful releases.',
    },
    {
      q: 'How do you start a DevOps transformation at an organisation resistant to change?',
      a: 'Start with a willing team and a visible, measurable improvement. Pick one value stream, baseline its DORA metrics, identify the biggest bottleneck (usually manual approvals or long test cycles), and automate it. Demonstrate the improvement. Small wins with data beat big cultural proclamations.',
    },
    {
      q: 'What is the difference between MTTR and MTTF/MTBF?',
      a: 'MTTR (Mean Time to Restore/Recover) measures how quickly you recover from failure — a DevOps reliability metric. MTTF (Mean Time to Failure) measures how long a system runs before failing. MTBF (Mean Time Between Failures) = MTTF + MTTR, used more in hardware/operations. DevOps focuses on MTTR because accepting that failures happen and recovering fast is more realistic than trying to eliminate all failures.',
    },
    {
      q: 'How do you measure psychological safety in a team?',
      a: 'Amy Edmondson\'s seven-question survey is the standard tool. Questions like "If you make a mistake on this team, it is often held against you" (reversed scale). Quantitatively: track incident report rates (low reporting = low safety), retrospective participation, and near-miss disclosures. Qualitatively: 1:1s and anonymous feedback.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'DevOps is a culture of shared ownership, fast flow, and continual learning — measured by DORA metrics and built on psychological safety.',
    mustKnow: [
      'CALMS: Culture, Automation, Lean, Measurement, Sharing — the five pillars',
      'Three Ways: Flow (Dev→Ops), Feedback (Ops→Dev), Continual Learning',
      'Four DORA metrics: Deployment Frequency, Lead Time, Change Failure Rate, MTTR',
      'Blameless post-mortems focus on systemic fixes, not individual blame',
      'DevOps is a culture/mindset, not a role, tool, or team',
      'Small batch sizes reduce risk and make rollback easy',
      'Psychological safety is the foundation — without it DevOps cannot work',
    ],
    interviewFocus: [
      'Explain CALMS and give a real example of each pillar in practice',
      'Walk through the Three Ways and how each improves delivery velocity',
      'Which DORA metric would you focus on first and why? (Deployment Frequency is usually the forcing function)',
      'What makes a post-mortem "blameless" and how do you run one?',
    ],
  };
}
