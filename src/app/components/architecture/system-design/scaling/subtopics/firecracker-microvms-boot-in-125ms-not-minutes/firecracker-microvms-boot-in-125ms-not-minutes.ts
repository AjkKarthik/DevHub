import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './firecracker-microvms-boot-in-125ms-not-minutes.html',
  styleUrl: './firecracker-microvms-boot-in-125ms-not-minutes.scss'
})
export class FirecrackerMicrovmsBootIn125msNotMinutesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s autoscaling-delay numbers only cover two of three real options',
      points: [
        'The main page\'s QnA on autoscaling limitations states "a new VM instance takes 2-5 minutes to start; a container starts faster (30-60 seconds) but still has delay" — accurate for those two options, but it stops there, leaving the impression that "seconds to minutes" is simply the unavoidable floor for elastic compute. A third category exists that changes this picture substantially.',
      ]
    },
    {
      heading: 'The missing option: Firecracker microVMs, booting in ~125 milliseconds',
      points: [
        'AWS Lambda runs each function invocation inside its own Firecracker microVM — a lightweight virtualization technology purpose-built for fast-starting, secure, minimal-footprint VMs. A cold-start Firecracker microVM boots in as little as ~125 milliseconds — roughly 240x faster than the main page\'s cited 30-second container figure, and over 1,000x faster than its 2-minute VM figure.',
        'For a warm start restored from a snapshot (AWS Lambda SnapStart), the time drops further still, to roughly ~28 milliseconds — fast enough that, combined with request-level invocation, serverless platforms can react to load essentially per-request rather than needing to pre-provision ahead of a spike.',
        'This doesn\'t make traditional VM/container autoscaling delay irrelevant — the main page\'s 2-5 minute and 30-60 second figures are accurate for THOSE specific technologies — but it means "elastic compute always has a meaningful cold-start delay" is not universally true; it depends heavily on WHICH elastic-compute technology is in play.',
      ]
    },
    {
      heading: 'Why this changes how you\'d design around a flash-crowd spike',
      points: [
        'The main page\'s own mitigation advice for autoscaling\'s provisioning delay is "pre-warming instances before expected spikes, maintaining minimum idle capacity" — necessary advice for VM/container-based autoscaling, but largely UNNECESSARY for a serverless/Firecracker-based architecture, where the ~125ms cold-start is fast enough to absorb most traffic spikes without any pre-warming at all.',
        'This is a genuine architectural trade-off worth naming explicitly in an interview: serverless\'s near-instant elasticity comes at the cost of a different set of constraints (execution time limits, cold-start-sensitive language runtimes for HEAVIER workloads like a JVM-based Spring Boot app, which can still take 3-10 seconds even on Lambda) — it isn\'t a strictly-better replacement for VM/container autoscaling in every case, just a genuinely different point on the same trade-off curve.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Cold-start latency across elastic-compute options',
      language: 'bash',
      code: `# Cold-start times, worst-to-best (per the main page + this
# subtopic's addition):

# Traditional VM instance:         2-5 minutes
# Container (Docker on ECS/K8s):   30-60 seconds
# AWS Lambda (Firecracker microVM, cold):    ~125 milliseconds
# AWS Lambda with SnapStart (warm restore):   ~28 milliseconds

# Caveat: cold-start time also depends heavily on the RUNTIME
# inside the microVM, not just the microVM boot itself:
#   Rust / Go (arm64):      as low as ~16ms
#   Python / Node.js (P50): ~200-400ms
#   JVM (Spring Boot, no SnapStart): 3-10 SECONDS
#     -- the microVM boots fast, but a heavy JVM app still
#        needs its own startup time on top of that`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Using the main page\'s original guidance ("pre-warm instances before expected spikes, maintain minimum idle capacity" to work around 30-second-to-5-minute provisioning delay), a team designs elaborate pre-warming automation for a bursty workload. Given this subtopic\'s content, what question should they ask before building that automation?',
    hint: 'Does the pre-warming problem exist at all for every elastic-compute option, or only for specific ones?',
    solution: 'They should ask: "Could this workload run on Lambda (or a similar Firecracker-based serverless platform) instead of VMs/containers?" If the workload fits serverless\'s constraints (execution time limits, and a fast-starting runtime — not a slow-cold-starting JVM app without SnapStart), the entire pre-warming problem may simply not apply: a ~125ms cold start is fast enough to absorb most traffic spikes without any pre-warming automation at all. Building elaborate pre-warming infrastructure is solving a problem that a different elastic-compute choice might sidestep entirely — worth checking before investing in it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Elastic/auto-scaled compute always has a meaningful cold-start delay measured in tens of seconds to minutes.',
      reality: 'Per this subtopic\'s theory (an option added to the main page during this batch), that\'s true for traditional VMs and containers, but AWS Lambda\'s Firecracker microVMs cold-start in ~125 milliseconds — roughly 1,000x faster, changing what "elastic" can mean architecturally.'
    },
    {
      thought: 'Pre-warming instances and maintaining minimum idle capacity is a universally necessary mitigation for autoscaling\'s provisioning delay.',
      reality: 'Per this subtopic\'s theory, this is necessary for VM/container-based autoscaling specifically — a Firecracker-based serverless architecture\'s cold start is often fast enough to make dedicated pre-warming unnecessary for many workloads.'
    },
    {
      thought: 'Since Lambda\'s microVM itself boots in ~125ms, any application deployed on it will always cold-start that fast.',
      reality: 'Per this subtopic\'s theory, the microVM boot time is only part of the picture — a heavy runtime on top of it (like an un-optimized JVM Spring Boot app) can still take 3-10 seconds to fully initialize, even though the underlying microVM booted in milliseconds.'
    }
  ];
}
