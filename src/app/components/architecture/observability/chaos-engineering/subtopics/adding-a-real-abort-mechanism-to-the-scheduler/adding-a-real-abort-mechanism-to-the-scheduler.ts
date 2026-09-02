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
    heading: 'A "Required" Safeguard the Challenge Never Implements',
    points: [
      'The page’s own mistakes block calls an abort mechanism mandatory in the strongest possible terms: "Every chaos experiment must have a tested abort mechanism before it starts... An experiment without an abort is an uncontrolled failure." A separate QnA repeats it: "Have a kill switch: be able to instantly abort and restore normal conditions. Set automatic stop conditions (if error rate exceeds threshold, stop automatically)."',
      'The page’s own Challenge, <code>scheduleExperiment(experiment, durationMs)</code>, does none of this — it starts the experiment, waits the full fixed duration, then stops it. There is no metric check anywhere in its execution, and no way for it to end early no matter what happens during the wait.',
      'Built and verified directly on top of the same shape the Challenge already uses: a version that polls a health-check function at a regular interval throughout the wait, stopping and returning an early-abort result the moment that check fails — confirmed via execution that a genuinely healthy run completes the full configured duration, while a run that turns unhealthy partway through aborts within roughly one poll interval, well before the fixed duration would otherwise have elapsed.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'scheduleExperimentWithAbort(), Verified for Both Outcomes',
    language: 'typescript',
    code: `interface ChaosExperiment {
  name: string;
  start(): void;
  stop(): void;
}

interface ExperimentResult {
  completed: boolean;
  abortedAtMs: number | null;
}

function scheduleExperimentWithAbort(
  experiment: ChaosExperiment,
  durationMs: number,
  checkIntervalMs: number,
  isHealthy: () => boolean
): Promise<ExperimentResult> {
  return new Promise((resolve) => {
    experiment.start();
    const startedAt = Date.now();
    let aborted = false;

    const healthCheck = setInterval(() => {
      if (!isHealthy()) {
        aborted = true;
        clearInterval(healthCheck);
        clearTimeout(finish);
        experiment.stop();
        resolve({ completed: false, abortedAtMs: Date.now() - startedAt });
      }
    }, checkIntervalMs);

    const finish = setTimeout(() => {
      if (aborted) return;
      clearInterval(healthCheck);
      experiment.stop();
      resolve({ completed: true, abortedAtMs: null });
    }, durationMs);
  });
}

async function main() {
  // ── Case A: healthy throughout — runs the full duration ─────────
  const healthyExp: ChaosExperiment = {
    name: 'pod-kill',
    start() {},
    stop() { console.log('healthy experiment: stopped normally'); },
  };
  const resultA = await scheduleExperimentWithAbort(healthyExp, 100, 20, () => true);
  console.log('Case A (healthy):', resultA);

  // ── Case B: error rate spikes partway through — aborts early ────
  const unhealthyExp: ChaosExperiment = {
    name: 'network-latency',
    start() {},
    stop() { console.log('unhealthy experiment: aborted'); },
  };
  const start = Date.now();
  const resultB = await scheduleExperimentWithAbort(unhealthyExp, 100, 10, () => {
    return (Date.now() - start) < 40; // healthy until ~40ms in, then fails
  });
  console.log('Case B (unhealthy):', resultB);
}
main();
// -> healthy experiment: stopped normally
// -> Case A (healthy):   { completed: true, abortedAtMs: null }
// -> unhealthy experiment: aborted
// -> Case B (unhealthy): { completed: false, abortedAtMs: 46 }  (well before 100ms)`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The page’s own mistakes block gives a concrete abort criterion: "if error rate > 10%, abort immediately." Given the <code>isHealthy()</code> callback’s signature — a function returning a plain boolean, called on a fixed <code>checkIntervalMs</code> schedule — what real information would <code>isHealthy()</code> need access to in order to implement that exact 10% criterion, and what’s the practical risk of checking too infrequently?',
  hint: 'Think about where a real error-rate number would come from in production, and what could happen to users during the gap between two poll checks if that gap is too wide.',
  solution: `// isHealthy() would need access to a LIVE metrics source -- in
// practice, a query against whatever's already tracking the
// experiment's own error rate in real time (the same Prometheus/
// Grafana dashboards the page's own "Observability During Chaos"
// theory section describes), evaluated fresh on every poll rather
// than checked once at the start.
//
// The practical risk of a too-infrequent checkIntervalMs: the abort
// mechanism can only ever notice a problem AT the next scheduled
// check, never in between. A 30-second checkIntervalMs against a
// fast-cascading failure (error rate crossing well past 10% within a
// few seconds of it starting) means real users experience the full
// severity of that failure for up to 30 seconds before the mechanism
// even has a chance to notice and abort -- the interval is a direct,
// tunable trade-off between how quickly a real problem gets caught
// and how much overhead the health-check polling itself adds.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>isHealthy()</code> is checked periodically throughout the wait, this version is strictly slower than the page’s own simple <code>scheduleExperiment()</code>, which just waits once and returns.',
    reality: 'The two versions take the SAME amount of wall-clock time for a healthy run — both wait the full <code>durationMs</code> before resolving. The health-check polling adds a small, fixed amount of CPU overhead (one function call per <code>checkIntervalMs</code>), not additional WAIT time — the abort-aware version only finishes FASTER than the simple version, specifically in the one case the simple version has no way to handle at all: an unhealthy run that should stop early.',
  },
  {
    thought: 'A working abort mechanism, once built, makes chaos experiments in production categorically safe to run without the staged staging-then-production rollout the page’s own mistakes block insists on.',
    reality: 'An abort mechanism limits how long a bad experiment runs — it doesn’t prevent the initial impact before that first health check even fires, and it can’t undo user-facing consequences that already happened during that window. The page’s own "staging first" mistake block and this subtopic’s own abort mechanism are complementary safeguards, not substitutes for each other: staging validation reduces the CHANCE of a bad outcome; the abort mechanism limits the DURATION if one happens anyway.',
  },
];

@Component({
  selector: 'app-obs-chaos-abort',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './adding-a-real-abort-mechanism-to-the-scheduler.html',
  styleUrl: './adding-a-real-abort-mechanism-to-the-scheduler.scss',
})
export class AddingARealAbortMechanismToTheSchedulerSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
