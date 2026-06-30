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
  { name: 'Chaos Engineering', type: 'keyword', desc: 'Intentionally injecting failures into a system to verify it tolerates them gracefully — discover weaknesses before they cause real outages.' },
  { name: 'Steady state',       type: 'keyword', desc: 'The normal operating behaviour of a system. Chaos experiments must define and measure steady state before and after to detect disruption.' },
  { name: 'Blast radius',       type: 'keyword', desc: 'Scope of impact when a chaos experiment fails or triggers unexpected cascading failures. Always minimise and control blast radius.' },
  { name: 'GameDay',            type: 'keyword', desc: 'Scheduled chaos experiment run as a team exercise — everyone watches dashboards and practices responding to failures in a controlled scenario.' },
  { name: 'Hypothesis',         type: 'keyword', desc: 'The hypothesis of a chaos experiment: "If we kill one database replica, the service remains below 5% error rate." Must be measurable and falsifiable.' },
  { name: 'Litmus / Chaos Mesh', type: 'keyword', desc: 'Open-source Kubernetes chaos engineering platforms. Define and run experiments as YAML CRDs — pod kills, network latency, CPU stress.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The Principles of Chaos Engineering',
    points: [
      'Chaos engineering is not "breaking things randomly" — it is a scientific process: define steady state, form a hypothesis about what should happen under failure, inject the failure in a controlled way, observe whether the hypothesis holds.',
      'The goal is to discover weaknesses before they cause real incidents. Better to learn "our retry logic doesn\'t handle DB connection drops" in a planned experiment than during a 3am incident.',
      'Start in staging, not production. Validate the experiment works and has the expected blast radius before running it in production. Many teams never run chaos in production — staging is sufficient for most failure modes.',
      'Control the blast radius: use feature flags, traffic splitting, or Kubernetes namespace isolation to limit the scope of an experiment. Always have an abort button ready before starting.',
    ],
  },
  {
    heading: 'Types of Chaos Experiments',
    points: [
      'Resource chaos: CPU stress, memory exhaustion, disk fill. Tests whether the service degrades gracefully (shedding load) or fails hard (OOM kill, cascading failures).',
      'Network chaos: latency injection (add 500ms to database calls), packet loss, bandwidth throttling, network partition between services. Tests whether timeouts, retries, and circuit breakers work correctly.',
      'Infrastructure chaos: kill a pod, terminate an EC2 instance, drain a Kubernetes node, force a leader re-election in etcd or ZooKeeper. Tests high-availability and failover mechanisms.',
      'Application-level chaos: return error responses from a dependency, simulate a database returning slow queries, inject corrupt data into a message queue. Tests application-level resilience patterns.',
    ],
  },
  {
    heading: 'Running a Chaos Experiment',
    points: [
      'Step 1 — Define steady state: "Error rate < 1%, p99 latency < 200ms, all health checks passing." Measure and record baseline metrics before injecting.',
      'Step 2 — Form hypothesis: "If we kill one of three database replicas, steady state will be maintained — the ORM connection pool will reconnect to remaining replicas within 5 seconds."',
      'Step 3 — Control variables: inject failure only for the specific component, for a defined duration (e.g., 3 minutes), in the defined environment (staging). Document who is watching and what to look for.',
      'Step 4 — Inject and observe: watch SLI dashboards in real time. Do metrics deviate from steady state? Are there alerts? Are logs showing unexpected errors?',
      'Step 5 — Learn and fix: if the hypothesis held, document it as a verified resilience property. If it failed, you found a real weakness — file a bug and fix it. Either outcome is valuable.',
    ],
  },
  {
    heading: 'Observability During Chaos',
    points: [
      'Chaos experiments require good observability to interpret results. Without dashboards showing error rate, latency, and queue depth in real time, you cannot tell whether steady state was maintained.',
      'Use deployment annotations: mark the start and end of chaos experiments on Grafana dashboards. This makes it easy to identify experiment windows in historical data.',
      'Correlate with traces: during a chaos experiment, trace exemplars show exactly which spans were affected — which calls timed out, which retried successfully, which circuit breakers opened.',
      'The experiment is a form of active testing of your observability: if you cannot detect the failure you injected, your monitoring has gaps. Chaos often reveals both resilience weaknesses and observability gaps simultaneously.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Chaos Mesh Experiment',
    language: 'typescript',
    code: `# Chaos Mesh (Kubernetes) experiment definitions

# ── POD KILL EXPERIMENT ───────────────────────────────────────────
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: kill-payment-pod
  namespace: chaos-testing
spec:
  action: pod-kill
  mode: one             # kill exactly one pod
  duration: 1m          # experiment lasts 1 minute
  selector:
    namespaces:
      - production
    labelSelectors:
      app: payment-service
  # Hypothesis: payment service remains below 2% error rate
  # as K8s reschedules the pod within 30 seconds

---
# ── NETWORK LATENCY EXPERIMENT ────────────────────────────────────
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: db-latency-injection
  namespace: chaos-testing
spec:
  action: delay
  mode: all
  selector:
    namespaces:
      - production
    labelSelectors:
      app: payment-service
  delay:
    latency: 500ms       # add 500ms to all outbound calls
    correlation: '100'
    jitter: 50ms
  direction: egress
  target:
    selector:
      namespaces:
        - production
      labelSelectors:
        app: postgresql
  duration: 3m
  # Hypothesis: payment service uses 2s timeout on DB calls
  # and circuit breaker opens after 3 consecutive 500ms+ calls
  # → users see < 5% error rate during the 3 minutes

---
# ── CPU STRESS EXPERIMENT ─────────────────────────────────────────
apiVersion: chaos-mesh.org/v1alpha1
kind: StressChaos
metadata:
  name: cpu-stress-api
  namespace: chaos-testing
spec:
  mode: one
  selector:
    namespaces:
      - production
    labelSelectors:
      app: api-service
  stressors:
    cpu:
      workers: 4         # 4 CPU cores under stress
      load: 80           # 80% CPU load per worker
  duration: 5m
  # Hypothesis: HPA scales out within 60 seconds
  # and latency does not exceed 2x baseline during scale-out`,
  },
  {
    label: 'Custom Fault Injection',
    language: 'typescript',
    code: `// Application-level fault injection via feature flags
// Safe for production — can toggle per-request via header

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FaultInjectionMiddleware {
  // Enable via env var or LaunchDarkly feature flag
  private static faultConfig = {
    errorRate: parseFloat(process.env['FAULT_ERROR_RATE'] ?? '0'),  // 0-1
    latencyMs: parseInt(process.env['FAULT_LATENCY_MS'] ?? '0'),    // added delay
    enabled: process.env['FAULT_INJECTION_ENABLED'] === 'true',
  };

  static async injectFault(): Promise<void> {
    if (!this.faultConfig.enabled) return;

    // Add artificial latency
    if (this.faultConfig.latencyMs > 0) {
      await new Promise(r => setTimeout(r, this.faultConfig.latencyMs));
    }

    // Return random errors at configured rate
    if (Math.random() < this.faultConfig.errorRate) {
      throw new Error('Injected fault: simulated downstream failure');
    }
  }
}

// Use in service layer:
export class PaymentService {
  async processPayment(amount: number): Promise<{ success: boolean }> {
    // Inject fault before actual processing (non-production or controlled)
    await FaultInjectionMiddleware.injectFault();

    // Real payment logic
    const result = await this.stripeClient.charge(amount);
    return { success: result.status === 'succeeded' };
  }
}

// Chaos experiment: set FAULT_ERROR_RATE=0.1 FAULT_INJECTION_ENABLED=true
// Watch: does the circuit breaker open? Does the retry exhaust budget?
// Does the caller degrade gracefully or propagate the error to the user?

// Safe guards: always check request has chaos-enabled header or flag
// Never enable by default — only via explicit experiment config`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Running chaos in production without staging validation',
    wrong: `# First chaos experiment: let's kill a production database replica
kubectl delete pod postgres-replica-2
# Hypothesis: failover happens in < 5 seconds
# Reality: connection pool doesn't handle the failover — all connections error
# Result: 15-minute outage as team scrambles to manually reconnect
# The chaos experiment CAUSED the outage it was meant to prevent`,
    right: `# Chaos experiment progression:
# 1. Run in staging first — validate blast radius and hypothesis
# 2. Observe: does the experiment behave as expected in staging?
# 3. Fix any weaknesses found in staging
# 4. Only then: run in production with abort mechanism ready
# 5. Production chaos: start with smallest blast radius (1 pod, 30s)`,
    explanation: 'Chaos engineering in production without staging validation is gambling, not engineering. Staging experiments reveal whether your hypothesis is wrong, whether the blast radius is larger than expected, and whether your monitoring can detect the failure you injected. Fix all weaknesses found in staging before running the same experiment in production. For most failure modes, staging experiments alone are sufficient.',
  },
  {
    title: 'No abort mechanism before starting a chaos experiment',
    wrong: `# Chaos experiment started: network partition injected
# After 2 minutes: unexpected cascading failure observed
# 10 services unreachable due to timeout chain
# Team wants to stop the experiment
# But: no abort mechanism — the partition continues for 10 minutes
# All engineers watching helplessly as the blast radius grows`,
    right: `# Before any experiment: verify abort works
kubectl describe networkchaos db-partition  # verify duration is set
kubectl delete networkchaos db-partition     # test abort command
# Set a short duration (2 minutes) for first run
# Keep the abort command in a terminal tab BEFORE starting
# Assign one engineer specifically to watch for abort signal
# Define abort criteria upfront: "if error rate > 10%, abort immediately"`,
    explanation: 'Every chaos experiment must have a tested abort mechanism before it starts. For Chaos Mesh/Litmus: `kubectl delete <experiment-kind> <name>` stops the experiment immediately. For manual experiments: have the rollback command ready in a terminal. Define abort criteria (e.g., error rate > 10%) before starting, and assign someone specifically to monitor and execute the abort. An experiment without an abort is an uncontrolled failure.',
  },
  {
    title: 'Treating a failed hypothesis as a failed experiment',
    wrong: `// Team ran experiment: "kill one replica — service should stay healthy"
// Result: service error rate jumped to 25% for 4 minutes
// Team: "The chaos experiment failed — let's not try chaos again"
// The actual lesson: the connection pool didn't handle replica failover
// This is the most valuable result: a real weakness, discovered safely
// But the team disregarded the finding and learned nothing`,
    right: `// A failed hypothesis = the most valuable outcome of chaos engineering
// Result: service went to 25% error during replica kill
// Correct response:
// 1. Document the finding: connection pool doesn't handle failover gracefully
// 2. File bug: "DB connection pool needs to retry on connection error"
// 3. Fix: add retry-on-connect logic with exponential backoff
// 4. Re-run the experiment after the fix to verify the hypothesis now holds`,
    explanation: 'In chaos engineering, a failed hypothesis is a success — you discovered a real weakness in a controlled experiment rather than during a production incident. The correct response is: document the finding, fix the underlying weakness, and re-run the experiment to verify the fix. Only when the experiment runs and steady state is maintained has the weakness been truly remediated. Never stop chaos engineering because an experiment revealed a problem — that is exactly the goal.',
  },
  {
    title: 'Skipping steady-state definition — cannot interpret results',
    wrong: `// Team runs chaos experiment: CPU stress on API service
// 5 minutes later: "that seemed fine, I guess?"
// No baseline metrics were recorded
// Dashboard shows latency at 350ms during experiment
// But: is that normal? Is that high? Nobody knows
// Experiment produces no actionable finding either way`,
    right: `// Before experiment: record and document steady state
// Steady state definition (measured for 10 minutes before):
//   - Error rate: 0.2%
//   - p99 latency: 180ms
//   - RPS: 1,200/s
//   - Memory: 2.1 GB

// Hypothesis: "Under 80% CPU stress, steady state maintained"
// During experiment: error rate 0.3%, p99 280ms — within tolerance
// Conclusion: hypothesis holds — service gracefully degrades under CPU pressure`,
    explanation: 'Without a defined steady state, you cannot interpret chaos experiment results. You need to know the baseline (what is normal) to determine whether the experiment caused a deviation. Measure and record: error rate, p99 latency, RPS, and any service-specific SLIs for at least 10 minutes before starting. During the experiment, compare against this baseline. "Latency at 350ms" is meaningless without knowing the normal value is 180ms.',
  },
];

const challenge: Challenge = {
  title: 'Chaos experiment scheduler',
  language: 'typescript',
  description: `Implement scheduleExperiment(experiment: ChaosExperiment, durationMs: number): Promise<boolean>
The function starts the experiment, waits durationMs, then stops it.
Return true if no error was thrown during the wait, false if an error occurred.
Use the provided mock: experiment.start(), experiment.stop() (both synchronous), and
simulate failure by throwing if experiment.shouldFail is true.`,
  hints: ['Call start(), then setTimeout in a Promise, then stop()', 'Catch any thrown error and return false'],
  starterCode: `interface ChaosExperiment {
  name: string;
  shouldFail: boolean;
  start(): void;
  stop(): void;
}

async function scheduleExperiment(
  experiment: ChaosExperiment,
  durationMs: number
): Promise<boolean> {
  return false;
}

// Mock experiment
const exp: ChaosExperiment = {
  name: 'pod-kill',
  shouldFail: false,
  start() { console.log(\`Starting \${this.name}\`); if (this.shouldFail) throw new Error('Inject failed'); },
  stop()  { console.log(\`Stopping \${this.name}\`); },
};

scheduleExperiment(exp, 100).then(ok => console.log('Success:', ok)); // true`,
  solution: `interface ChaosExperiment {
  name: string;
  shouldFail: boolean;
  start(): void;
  stop(): void;
}

async function scheduleExperiment(
  experiment: ChaosExperiment,
  durationMs: number
): Promise<boolean> {
  try {
    experiment.start();
    await new Promise<void>(resolve => setTimeout(resolve, durationMs));
    experiment.stop();
    return true;
  } catch {
    experiment.stop();
    return false;
  }
}

const exp: ChaosExperiment = {
  name: 'pod-kill',
  shouldFail: false,
  start() { console.log(\`Starting \${this.name}\`); if (this.shouldFail) throw new Error('Inject failed'); },
  stop()  { console.log(\`Stopping \${this.name}\`); },
};

scheduleExperiment(exp, 100).then(ok => console.log('Success:', ok));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'A chaos experiment hypothesis was: "If we kill one pod, error rate stays below 1%." The experiment resulted in 15% error rate. What is the correct next step?',
    options: [
      'The experiment succeeded — chaos engineering is meant to cause failures, and this failure confirms the experiment worked',
      'Stop chaos engineering — the experiment caused an outage, proving chaos is too risky for this service',
      'Document the weakness found (no pod redundancy or slow failover), fix the underlying issue, and re-run the experiment to verify the fix',
      'Increase the SLO target to 99% so that 15% errors are within budget',
    ],
    answer: 2,
    explanation: 'A failed hypothesis is the most valuable outcome of a chaos experiment — you found a real weakness before it caused a production incident. The correct response is a 3-step cycle: (1) document the specific weakness (e.g., connection pool doesn\'t handle pod loss, insufficient replicas), (2) fix the weakness, (3) re-run the same experiment and verify the hypothesis now holds. Never stop chaos engineering because an experiment revealed a problem — that is exactly what chaos engineering is designed to do.',
  },
  {
    q: 'What is "steady state" in chaos engineering and why must it be defined before an experiment starts?',
    options: [
      'The state of all system components being running and healthy — chaos engineering can only start when there are no existing incidents',
      'The normal operating behaviour of the system, measured as specific metrics (error rate, p99 latency) — needed as a baseline to determine whether the experiment caused a deviation',
      'A stability period of 24 hours after a deployment before chaos experiments are permitted to run',
      'The state the system returns to after a chaos experiment completes — measured only at the end to confirm recovery',
    ],
    answer: 1,
    explanation: 'Steady state is the measurable description of normal system behaviour: for example, error rate < 0.5%, p99 latency < 200ms, all health checks passing. It must be defined AND measured before the experiment because the experiment\'s purpose is to verify the hypothesis "steady state is maintained under failure condition X." Without a recorded baseline, you cannot determine whether the experiment\'s observed metrics represent a deviation from normal behaviour.',
  },
  { q: 'What is the core principle of chaos engineering?', options: ['Deliberately introducing bugs into production code to find defects before users report them', 'Proactively injecting controlled failures into a system to discover weaknesses before they occur naturally and impact users', 'Running maximum load tests on staging environments to find breaking points', 'Randomly terminating production processes to build team awareness of failure scenarios'], answer: 1, explanation: 'Chaos engineering principle (from Netflix Chaos Monkey): experiment on the system in production to build confidence in its ability to withstand turbulent conditions. Controlled injection: introduce a specific known failure (kill a server, add network latency, throttle CPU). Observe behavior. Validate graceful handling. Chaos is hypothesis-driven experimentation not random destruction. Hypothesis: if we terminate one of three web server instances, p99 latency will stay below 300ms. Experiment: terminate one instance. Observation: latency spiked to 800ms. Learning: load balancer health check is too slow. Action: tune failover parameters.' },
  { q: 'What does blast radius mean in the context of chaos engineering?', options: ['The number of Kubernetes pods affected by a given chaos experiment', 'The scope of potential user or system impact from a chaos experiment; experiments start with minimal blast radius and expand cautiously to avoid causing real production incidents', 'A metric used to measure total latency increase caused by a chaos experiment', 'A type of network partition experiment targeting specific cloud availability zones'], answer: 1, explanation: 'Blast radius: how much of the system or how many users could be affected if the chaos experiment goes wrong. Start small: test on one instance before testing on all instances. Test in staging before production. Test on 1% of traffic before 100%. Expand gradually: if one instance failure is handled gracefully, expand to test an entire availability zone failure. Always have a kill switch to immediately stop the experiment and restore normal conditions. Monitor closely during the experiment and abort if cascading failures begin. Controlling blast radius is what distinguishes responsible chaos engineering from reckless system destruction.' },
  { q: 'What makes a good chaos engineering experiment hypothesis?', options: ['A statement listing all possible failures to inject in priority order', 'A specific measurable prediction: given a particular failure, the system will maintain a defined steady-state metric within a defined threshold and recovery time', 'A post-experiment analysis document summarizing what failed and why', 'A random selection of failure scenarios drawn from historical incident postmortems'], answer: 1, explanation: 'Good hypothesis: specific (exact failure to inject), measurable (which metric and what threshold), predictive (what steady state we expect during the failure). Example: if we terminate one of three web server instances in us-east-1, we believe p99 latency will stay below 300ms and error rate below 0.1% within 60 seconds of termination. A hypothesis includes: the failure being injected, the expected steady-state metric and threshold, the recovery time window. Running an experiment without a hypothesis is random destruction. The hypothesis defines success criteria and guides what to measure.' },
  { q: 'What is the difference between a chaos experiment and a GameDay exercise?', options: ['Chaos experiments are automated; GameDays are run manually by engineers', 'A chaos experiment tests if the technical system auto-recovers from a failure; a GameDay tests if the engineering team can respond and recover when the system does not auto-recover', 'GameDays use synthetic traffic while chaos experiments use real production traffic', 'Both terms describe the same practice with different names used by different organizations'], answer: 1, explanation: 'Chaos experiment: injects a specific technical failure and measures automated system response. Success means the system self-heals within the expected time. GameDay: a structured exercise simulating a major scenario (database failure, cloud outage, DDoS). The team responds in real time without advance knowledge of the specific failure. Tests human response, runbooks, communication, and coordination. Finds gaps in: alerting (did the right alerts fire?), observability (could the team diagnose the issue?), runbooks (were recovery steps complete and accurate?), team coordination. Both are complementary: chaos proves the system is resilient; GameDays prove the team can respond when the system is not.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should a team start chaos engineering and where should they begin?',
    a: 'A team should start chaos engineering when their observability is sufficient to detect the failures they plan to inject. If you can\'t see a pod being killed in your dashboards, chaos engineering won\'t teach you anything useful. Prerequisites: <ul><li>Service-level dashboards with error rate, latency, and throughput</li><li>Alerts that fire on SLI degradation (not just infrastructure metrics)</li><li>Distributed tracing set up for the services in scope</li></ul><strong>Where to begin</strong>: Start with the simplest, most controlled experiments in staging: <ol><li><strong>Pod kill</strong> (simplest): kill one pod and verify K8s reschedules it within the expected time without user-visible errors. Tests: deployment health, resource limits, startup time.</li><li><strong>Network latency</strong>: add 500ms to one dependency call and verify timeouts and circuit breakers work. Tests: timeout configuration, retry logic.</li><li><strong>CPU stress</strong>: ramp CPU to 80% and verify HPA scales out within the defined time. Tests: autoscaling configuration, graceful degradation.</li></ol>Run each experiment twice: once to find weaknesses, fix them, and once more to verify the fix. Progress to more complex experiments (DB failover, full zone outages) only after the basics are solid.',
  },
  {
    q: 'What is a "GameDay" and how is it different from automated chaos?',
    a: '<strong>GameDay</strong>: a scheduled, time-boxed exercise where the whole team runs a chaos experiment together. One person injects the failure, the rest watch dashboards and practice the incident response runbook. Often includes a "surprise" component — the team knows a failure will be injected during a 2-hour window but not exactly when.<br><br><strong>Automated chaos</strong>: chaos experiments run continuously or on a schedule without direct human observation — e.g., Chaos Mesh running pod-kill experiments every night at 2am and alerting if error rate exceeds the threshold.<br><br><strong>Key differences</strong>: <ul><li>GameDay is a learning exercise — the team practices detection, communication, and response. Automated chaos is a regression test — it verifies that existing resilience properties still hold.</li><li>GameDay builds team incident response skills. Automated chaos catches regressions when a code change weakens resilience.</li><li>GameDay is appropriate when starting out. Automated chaos is appropriate once the team is confident in the experiments and wants to continuously verify them.</li></ul>Many mature teams do both: automated chaos for regression testing of known-good properties, and GameDay quarterly for learning new failure scenarios.',
  },
  { q: 'How do you run chaos experiments safely in production?', a: 'Safety practices: establish observability first — you cannot safely run chaos without metrics, logs, and tracing in place. Define steady state clearly before experimenting (what does normal look like for key metrics?). Minimize blast radius: start with one component, one region, or 1% of traffic. Have a kill switch: be able to instantly abort and restore normal conditions. Set automatic stop conditions (if error rate exceeds threshold, stop automatically). Communicate: notify the team before running experiments. Schedule during low-traffic hours when blast radius is naturally limited. Track experiments: document what was tested, when, and what was learned. Never run chaos experiments during peak business hours, deployments, or high-traffic events. After each experiment: fix the discovered weakness before running the next experiment.' },
  { q: 'What are the common chaos engineering tools and what failure types do they support?', a: 'Chaos Mesh (CNCF, Kubernetes-native): pod failures, network chaos (latency, packet loss, bandwidth), I/O chaos (disk errors, slow I/O), CPU and memory stress, clock skew, HTTP fault injection at the Kubernetes level. LitmusChaos (CNCF): similar to Chaos Mesh with added cloud provider fault support. Gremlin (commercial): hardware and cloud faults, process kills, state attacks, network attacks. AWS Fault Injection Simulator (FIS): EC2 termination, EKS pod failures, RDS failovers, latency injection, native AWS integration. Chaos Monkey (Netflix, original): randomly terminates EC2 instances in Auto Scaling groups. Failure categories: resource exhaustion (CPU, memory, disk). Network (latency, packet loss, partition, bandwidth throttle). Process (kill, freeze, CPU spike). Infrastructure (VM termination, zone outage).' },
  { q: 'How do you measure the business value of chaos engineering?', a: 'Quantitative metrics: weaknesses found before production incidents (each prevented outage has measurable cost). MTTR improvement: compare average incident resolution time before vs after chaos engineering practice. Incident frequency: are the failure modes exposed in chaos experiments still occurring in production? Mean time between failures: does MTBF increase as chaos experiments find and fix weaknesses? On-call load: fewer pages per engineer per week as reliability improves. SLA compliance: reduction in SLO breaches and customer-impacting incidents. Qualitative metrics: team confidence in the system resilience. Speed of onboarding new engineers (chaos experiments document failure modes). Reduction in postmortem surprises (unknown failure modes discovered during production incidents). ROI framing: preventing one major production incident typically exceeds the cost of months of chaos engineering investment.' },
  { q: 'What is chaos engineering maturity and how do organizations progress through it?', a: 'Chaos maturity model: Level 1 (Starting): manual experiments run occasionally in staging. No automation. Results tracked informally. Level 2 (Developing): experiments in lower production environments with manual execution. Results tracked in a shared document. Some automation of common experiments. Level 3 (Defined): automated experiments run on a schedule in production. Results tracked in a chaos registry. Experiments tied to reliability requirements and SLOs. Level 4 (Optimized): continuous automated chaos in production as part of CI/CD pipeline. Every new service must pass chaos tests before production deployment. Chaos experiments integrated with incident postmortem action items. Getting started: begin by documenting existing failure modes from past incidents. Build experiments that replay those failures to confirm they cannot happen again. Expand from there.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Chaos engineering = scientific failure injection: define steady state → hypothesis → inject → observe → fix. Blast radius controlled. Failed hypothesis = most valuable outcome.',
  mustKnow: [
    'Five steps: define steady state (measure baseline), form hypothesis, inject failure, observe vs. hypothesis, learn and fix.',
    'Types: pod kill, network latency, CPU stress, disk fill, zone partition. Each tests different resilience properties.',
    'Always test abort mechanism BEFORE starting. Short duration for first run. Assign someone to monitor abort criteria.',
    'Run in staging first. Validate blast radius is expected before running in production.',
    'Failed hypothesis = success: real weakness found safely. Fix it, re-run, verify hypothesis now holds.',
    'Good observability is a prerequisite: you cannot interpret chaos results without real-time metrics and traces.',
  ],
  interviewFocus: [
    'What is the correct process for running a chaos experiment?',
    'What does it mean when a chaos experiment hypothesis fails?',
    'What observability prerequisites must be in place before chaos engineering is useful?',
  ],
};

@Component({
  selector: 'app-obs-chaos',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './chaos-engineering.html',
  styleUrl: './chaos-engineering.scss',
})
export class ObsChaosEngineering {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
