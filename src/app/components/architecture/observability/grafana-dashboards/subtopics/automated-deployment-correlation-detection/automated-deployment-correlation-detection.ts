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
    heading: 'From "Eyeball the Timeline" to an Actual Correlation Function',
    points: [
      'The main page’s own "No dashboard annotations for deployments" mistake block describes the VALUE of annotations precisely — "Immediately visible that latency increased 2 mins after deploy" — but the correlation itself is described as something a human does BY EYE, looking at a vertical line on a chart. No codeTab on the page ever turns this into an actual, programmatic check.',
      'A concrete, automatable version of the same idea: given a metric spike’s timestamp and a list of recent deployments, find the MOST RECENT deployment that happened BEFORE the spike, within some correlation window (e.g. 5 minutes) — exactly the kind of check that could run automatically in an alerting pipeline, annotating an alert with "likely caused by deploy v2.3.1" rather than leaving an engineer to work that out by eye during an incident.',
      'The "most recent, not just any" qualifier matters: a service accumulates a HISTORY of deployments over time, and a spike happening hours after one deploy but minutes after a LATER one should be attributed to the more recent, more plausible cause — not simply the first deployment found within some broad window.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Deployment-Correlation Detector, Verified',
    language: 'typescript',
    code: `interface MetricSpike { metric: string; timestamp: number; }
interface Deployment { service: string; version: string; timestamp: number; }
interface CorrelationResult { spike: MetricSpike; correlatedDeploy: Deployment | null; }

function detectDeploymentCorrelation(
  metricSpikes: MetricSpike[],
  deployments: Deployment[],
  correlationWindowMinutes: number,
): CorrelationResult[] {
  const windowMs = correlationWindowMinutes * 60 * 1000;

  return metricSpikes.map(spike => {
    // Only deployments that happened BEFORE the spike, within the window.
    const candidates = deployments.filter(d =>
      spike.timestamp >= d.timestamp && (spike.timestamp - d.timestamp) <= windowMs
    );
    if (candidates.length === 0) return { spike, correlatedDeploy: null };

    // Attribute to the MOST RECENT candidate -- the most plausible cause.
    const mostRecent = candidates.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
    return { spike, correlatedDeploy: mostRecent };
  });
}

const t0 = 1_700_000_000_000;
const deployments: Deployment[] = [
  { service: 'order-service', version: 'v2.3.1', timestamp: t0 },
  { service: 'order-service', version: 'v2.3.2', timestamp: t0 + 3 * 60 * 60 * 1000 }, // 3h later
];

const metricSpikes: MetricSpike[] = [
  { metric: 'p99_latency', timestamp: t0 + 2 * 60 * 1000 },                            // 2 min after v2.3.1
  { metric: 'p99_latency', timestamp: t0 + 45 * 60 * 1000 },                           // 45 min after v2.3.1 -- outside a 5-min window
  { metric: 'error_rate',  timestamp: t0 + 3 * 60 * 60 * 1000 + 90 * 1000 },           // 90s after v2.3.2
];

const results = detectDeploymentCorrelation(metricSpikes, deployments, 5);
results.forEach((r, i) => {
  console.log(\`spike \${i + 1} (\${r.spike.metric}) -> \${r.correlatedDeploy ? r.correlatedDeploy.version : 'no deploy within window'}\`);
});
// -> spike 1 (p99_latency) -> v2.3.1
// -> spike 2 (p99_latency) -> no deploy within window
// -> spike 3 (error_rate) -> v2.3.2`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A THIRD deployment is added: <code>v2.3.1-hotfix</code>, deployed just 30 seconds after <code>v2.3.1</code> itself (a rapid follow-up fix). A metric spike occurs 2 minutes after the ORIGINAL <code>v2.3.1</code> deploy (so 90 seconds after the hotfix). Using <code>detectDeploymentCorrelation()</code>’s own "most recent" rule, which deployment gets blamed?',
  hint: 'Both deployments fall within the 5-minute window before the spike — the function’s own <code>reduce()</code> picks whichever CANDIDATE has the LATER timestamp, not whichever was found first in the array.',
  solution: `// Both v2.3.1 (t0) and v2.3.1-hotfix (t0 + 30s) are BEFORE the spike
// (at t0 + 2min) and within the 5-minute window -- both are valid
// candidates.
//
// The reduce() picks the candidate with the LATER timestamp:
//   v2.3.1-hotfix (t0 + 30s) > v2.3.1 (t0)
//
// So v2.3.1-hotfix gets blamed, not the original v2.3.1 release.
//
// This is the "most plausible cause" logic working as intended: if a
// hotfix shipped shortly before a spike, it's a MORE likely culprit
// than the original release that had already been running without
// incident for those 30 extra seconds -- the most recent change is
// the one that most recently altered the service's behavior, which is
// exactly the reasoning a human investigating the incident would
// apply by eye when looking at deployment annotations on a timeline.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A correlation detector like this one PROVES that a deployment caused a metric spike.',
    reality: 'The function only establishes TEMPORAL correlation (a deploy happened shortly before the spike) — exactly the same limited signal a human eyeballing a dashboard annotation gets. Correlation within a time window is a strong INVESTIGATIVE LEAD, not proof of causation; the deploy and the spike could both be caused by some third factor (a traffic surge, a downstream outage) that happened to coincide.',
  },
  {
    thought: 'Widening the correlation window (e.g. to 60 minutes instead of 5) would always produce MORE accurate deployment attribution, since it catches slower-onset issues too.',
    reality: 'The codeTab’s own second spike (45 minutes after v2.3.1) was deliberately excluded from correlation under a 5-minute window — widening the window to catch it also increases the risk of falsely attributing UNRELATED spikes to a deploy that happened to occur sometime earlier, purely by coincidence. The window is a real tradeoff between catching genuine slow-onset issues and generating false attributions, not a value to simply maximize.',
  },
  {
    thought: 'Picking "the most recent deployment before the spike" is always the same as picking "the first deployment in the array" — the order doesn’t really matter since there’s usually only one deploy to consider anyway.',
    reality: 'The Try It above demonstrates a realistic scenario (a rapid hotfix following the original release) where TWO deployments both qualify as candidates, and the function’s explicit "most recent" rule — not array order — determines the correct answer. A naive implementation that just returned the FIRST matching candidate found during the filter would have blamed the wrong (earlier) deployment in this exact case.',
  },
];

@Component({
  selector: 'app-obs-grafana-deployment-correlation',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './automated-deployment-correlation-detection.html',
  styleUrl: './automated-deployment-correlation-detection.scss',
})
export class AutomatedDeploymentCorrelationDetectionSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
