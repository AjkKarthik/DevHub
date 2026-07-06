import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-server-gc-heap-count-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './server-gc-heap-count-follows-perceived-not-actual-cpu-limit.html',
  styleUrl: './server-gc-heap-count-follows-perceived-not-actual-cpu-limit.scss',
})
export class ServerGcHeapCountFollowsPerceivedNotActualCpuLimitSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states "Server GC mode uses one heap per logical core" as if "logical core" straightforwardly means whatever a call to Environment.ProcessorCount reports — but inside a container with a CPU LIMIT set (the exact resources.limits.cpu pattern the Deployment & Hosting topic recommends), what the .NET runtime PERCEIVES as the available core count depends on the container runtime correctly surfacing that limit, not the host machine\'s full core count',
      points: [
        'Server GC creates roughly one heap per PERCEIVED logical processor — each heap reserves its own memory segments and maintains independent GC bookkeeping. The runtime is designed to read the container\'s CPU allocation (via cgroup limits on Linux) rather than the host machine\'s total core count, so that a container limited to, say, 2 CPUs on a 64-core host allocates a heap count appropriate to 2 cores, not 64.',
        'This container-awareness is a REAL, deliberate runtime feature — but it depends on the container\'s CPU limit actually being SET and correctly surfaced to the process. A pod with NO <code>resources.limits.cpu</code> set at all (only <code>requests.cpu</code>, which the Deployment topic\'s own example DOES set, but which Kubernetes treats as a soft scheduling hint, not a hard ceiling) leaves the container able to see and use however many cores the underlying NODE actually has — and the GC, perceiving that full node core count as "available," creates a heap for each one.',
      ],
    },
    {
      heading: 'The practical consequence: a pod with requests.cpu: "100m" but NO limits.cpu, scheduled onto a 64-core node, can end up with Server GC creating dozens of heaps — each with its own reserved memory segment — for an application that Kubernetes only intends to give a tiny CPU allocation, producing a memory footprint wildly disproportionate to what the requests.memory value implies the pod should need',
      points: [
        'Each Server GC heap reserves memory upfront (segment size, independent of how much is actually in use) — the MORE heaps created, the higher the baseline memory footprint, even under LIGHT load, before a single request has been served. A pod correctly right-sized for its expected CPU share via <code>requests.cpu</code> alone, but missing <code>limits.cpu</code>, can silently consume several times more memory than a pod on the exact same node WITH a CPU limit set, purely because of how many GC heaps got created at startup.',
        'The fix connects directly to the Deployment & Hosting topic\'s own advice: ALWAYS set <code>resources.limits.cpu</code>, not just <code>requests.cpu</code> — this gives the container runtime a hard ceiling to report to the GC, letting it size the heap count to the INTENDED allocation rather than the host\'s full core count. Where a hard CPU limit is genuinely undesirable (some teams deliberately avoid CPU limits to prevent throttling), an explicit override via <code>DOTNET_GCHeapCount</code> (or the equivalent <code>runtimeconfig.json</code> setting) caps the heap count directly, independent of what the runtime perceives about available cores.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The mismatch, made concrete — requests.cpu without limits.cpu',
      language: 'csharp',
      code: `# Deployment YAML — matches the pattern from the Deployment & Hosting
# topic's own example, EXCEPT limits.cpu is omitted:
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: myapi
          resources:
            requests:
              cpu: "100m"      # scheduling hint — "give me at least this much"
              memory: "128Mi"
            # limits.cpu OMITTED — no hard CPU ceiling for this container
            limits:
              memory: "256Mi"  # memory limit IS set, but CPU is not

# On a 64-core node, this pod can legally BURST to use idle CPU beyond
# its 100m request whenever the node has spare capacity — Kubernetes'
# CPU requests are a scheduling/fairness hint, not an enforced ceiling,
# UNLESS a limits.cpu value is also present.

// What the .NET runtime perceives at startup, absent an enforced
// CPU quota to read:
Console.WriteLine(Environment.ProcessorCount);
// On this 64-core node: prints 64 — the FULL node core count, not
// anything resembling the intended "100m" (0.1 CPU) allocation.

// Server GC, seeing 64 perceived logical processors, creates
// approximately 64 heaps — each reserving its own memory segment —
// for an application Kubernetes intends to give roughly 1/10th of
// ONE core.`,
    },
    {
      label: 'The fix — a hard CPU limit, or an explicit heap count override',
      language: 'csharp',
      code: `# FIX 1 — set limits.cpu, giving the container runtime a real ceiling
# to report (matches the Deployment & Hosting topic's own guidance to
# always set BOTH requests AND limits):
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"      # now a hard ceiling exists for the GC to perceive
    memory: "256Mi"

// Environment.ProcessorCount now reflects the container's OWN CPU
// allocation (rounded up from the fractional limit) rather than the
// host's full core count — Server GC creates a heap count appropriate
// to that much smaller, INTENDED allocation.

# FIX 2 — when a hard CPU limit is deliberately avoided (some teams
# prefer no throttling risk), cap the GC heap count directly via an
# environment variable, independent of perceived processor count:
# In the Deployment YAML:
env:
  - name: DOTNET_GCHeapCount
    value: "0x2"     # hex value — explicitly cap at 2 heaps

// Or in runtimeconfig.json:
// {
//   "configProperties": {
//     "System.GC.HeapCount": 2
//   }
// }

// Verify the ACTUAL heap count and memory the running container is
// using with dotnet-counters — the same tool the main page's own
// theory recommends for live production triage:
// dotnet-counters monitor --process-id <pid> System.Runtime
//   gc-heap-size    should now scale with the INTENDED allocation,
//                   not the host's full core count`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team notices this exact problem (excessive Server GC heaps from a missing CPU limit) but "fixes" it by switching the affected service from Server GC to Workstation GC mode entirely, reasoning "Workstation GC uses one heap regardless of core count, so this whole class of problem goes away." Evaluate this fix against the main page\'s own stated trade-off between Server and Workstation GC.',
    hint: 'The main page states Server GC gives "higher throughput" specifically BECAUSE of its multiple heaps enabling parallel collection work across cores. If the underlying problem is really "this container is scheduled with far more perceived cores than its INTENDED allocation," does switching to Workstation GC fix the root cause, or does it fix the symptom by giving up a capability the container might have genuinely benefited from if configured correctly?',
    solution: `Switching to Workstation GC does eliminate the excessive-heap-count
symptom, but it does so by discarding Server GC's throughput benefit
ENTIRELY, for a problem whose actual root cause is a missing resource
limit, not an inherent flaw in Server GC itself. This is fixing the
wrong layer: the real issue is that the container's CPU allocation
was never correctly communicated to the runtime (no limits.cpu set),
causing Server GC to size itself for 64 perceived cores instead of the
intended fraction of one. Workstation GC "solves" this by using
exactly one heap regardless of perceived core count — but if the pod
is later given MORE CPU (say, a legitimate limits.cpu: "4" for a
genuinely CPU-intensive workload), Workstation GC still only uses one
heap, leaving real throughput on the table that Server GC — correctly
configured — would have captured by parallelizing collection work
across those 4 cores.

The main page's own framing is that Server GC vs Workstation GC is
a trade-off between throughput and memory footprint, made once,
deliberately, based on the actual workload's characteristics — not a
workaround for a configuration bug elsewhere in the deployment. Fixing
the ACTUAL root cause (setting limits.cpu, or explicitly capping
DOTNET_GCHeapCount) preserves Server GC's throughput benefit while
correctly sizing it to the container's real allocation; switching GC
modes entirely is a broader, blunter change that happens to mask this
specific symptom while giving up a capability that may matter for
other reasons (concurrent request handling, parallelizable workloads)
having nothing to do with the original memory-footprint problem.

The general lesson: when a symptom (excessive memory from too many GC
heaps) has an identifiable, fixable root cause (a missing container
resource limit), fixing that root cause directly is almost always
better than reaching for a broader architectural change (switching GC
modes) that resolves the visible symptom while sacrificing an
unrelated capability the team might still want.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Server GC always creates one heap per core on the physical/host machine, regardless of how the application is actually deployed or containerized.',
      reality: 'Server GC creates one heap per PERCEIVED logical processor, and in a container, that perception depends on the container runtime correctly surfacing a CPU allocation limit to the process — without a hard CPU limit set, the runtime can perceive and size itself for the HOST\'s full core count, not the container\'s intended allocation.',
    },
    {
      thought: 'setting requests.cpu in a Kubernetes deployment is sufficient to communicate the intended CPU allocation to the .NET runtime for GC sizing purposes.',
      reality: 'requests.cpu is a Kubernetes SCHEDULING hint (used for bin-packing and fairness), not an enforced ceiling — a pod can legally use far more CPU than its request when the node has spare capacity, and Environment.ProcessorCount (and therefore Server GC\'s heap count) reflects what the container can ACTUALLY see, which requires limits.cpu to be set as a hard ceiling.',
    },
    {
      thought: 'if excessive Server GC heap count is discovered in a containerized deployment, the correct fix is switching to Workstation GC mode to eliminate the multi-heap behavior entirely.',
      reality: 'that discards Server GC\'s throughput benefit for a problem whose actual root cause is a missing or misconfigured CPU limit — setting limits.cpu (or explicitly capping DOTNET_GCHeapCount) fixes the root cause while preserving Server GC\'s parallel-collection benefit for whatever CPU allocation the container is actually and correctly given.',
    },
  ];
}
