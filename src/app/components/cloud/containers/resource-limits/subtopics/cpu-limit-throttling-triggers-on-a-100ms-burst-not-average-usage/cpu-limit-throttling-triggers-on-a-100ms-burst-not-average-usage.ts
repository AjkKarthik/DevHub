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
  templateUrl: './cpu-limit-throttling-triggers-on-a-100ms-burst-not-average-usage.html',
  styleUrl: './cpu-limit-throttling-triggers-on-a-100ms-burst-not-average-usage.scss'
})
export class CpuLimitThrottlingTriggersOnA100msBurstNotAverageUsageSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry points at kubectl top and Prometheus metrics as the way to "check" throttling',
      points: [
        'The main page\'s own "Treating CPU limit exceeded as a crash" mistake entry says to check `container_cpu_cfs_throttled_seconds_total` and mentions `kubectl top pods shows actual CPU` — both framed as tools for confirming throttling is happening, without ever explaining WHY a pod\'s AVERAGE CPU usage looking well under its limit doesn\'t rule out throttling at all.',
        'The main page\'s own theory bullet states plainly: "CPU limit: exceeded CPU is throttled (CFS scheduler) — the process slows down but is never killed." Read together with the sizing advice elsewhere on the page ("set limits to 2-4× p99 usage"), a reader could reasonably conclude that as long as observed average/p99 usage stays under the limit, throttling won\'t happen — which is not how the underlying mechanism actually works.',
      ]
    },
    {
      heading: 'What actually triggers throttling: bursting the quota within a single 100ms period, not average usage',
      points: [
        'Per the documented behavior of the Linux CFS (Completely Fair Scheduler) bandwidth controller that enforces Kubernetes CPU limits, a limit is allocated as a QUOTA per fixed PERIOD — 100ms by default. The container gets `limit × period` of CPU time to spend within each 100ms window; once that quota is exhausted, EVERY thread in the container is paused (throttled) for the remainder of that same 100ms window, regardless of how little CPU time was used in the periods before or after it.',
        'This is why a multi-threaded or multi-process application can be throttled even when its AVERAGE usage over a full second (or a 15-30s Prometheus scrape interval) looks nowhere near the limit: a burst of activity across several threads running concurrently on different cores consumes the ENTIRE 100ms quota in a small fraction of that window — e.g. 4 threads bursting simultaneously on a 1-CPU-limit container can exhaust the whole 100ms quota in about 25ms, leaving the remaining ~75ms of that period fully throttled — a pattern completely invisible to any metric averaged over a longer window.',
        'This is a genuinely different failure mode from what the main page\'s own sizing advice (p50 for requests, 2-4× p99 for limits) is designed to catch — that advice targets sustained overuse relative to a longer observation window, while CFS throttling can strike a process whose longer-window average usage is comfortably low, purely because of how concentrated its CPU demand is within any single 100ms slice.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Low average usage, real throttling — the metric gap',
      language: 'bash',
      code: `# A container with the main page's own sizing pattern applied
# ("limits to 2-4x p99 usage") -- limits.cpu: "1" (1 vCPU), average
# usage per a 30s Prometheus scrape looks comfortably low:
kubectl top pods -n production
# NAME          CPU(cores)   MEMORY(bytes)
# api-7d9f8     180m         210Mi
# -- 180m average, well under the 1000m (1 vCPU) limit -- by the main
#    page's own advice, this looks correctly, even generously, sized.

# But the SAME container, checked for actual CFS throttling over the
# same window:
kubectl exec api-7d9f8 -- cat /sys/fs/cgroup/cpu.stat
# nr_periods 300          # 300 x 100ms periods in the last 30s
# nr_throttled 47         # 47 of those periods hit the quota wall
# throttled_usec 1820000  # ~1.82s of total throttled time

# 47/300 = ~15.7% of all 100ms periods were throttled -- a real,
# user-visible latency-spike rate -- despite "180m average" looking
# nowhere close to the "1000m" limit on any dashboard averaging over
# 30s. The Node.js/Go/Java worker pool inside this container bursts
# across multiple threads for a few milliseconds at a time, exhausts
# the 100ms quota almost instantly, then sits idle -- the low AVERAGE
# is the sum of many short, sharp spikes and long idle gaps, not a
# smooth, low, continuous usage pattern.`,
    },
    {
      label: 'The fix: right-size against burst behavior, not just averages',
      language: 'bash',
      code: `# Two complementary fixes, neither of which the main page's own
# p50/p99 sizing formula alone captures:

# 1. Alert directly on the throttling ratio, not just usage %:
#    (a real, commonly-used PromQL alert threshold)
# rate(container_cpu_cfs_throttled_periods_total[5m])
#   / rate(container_cpu_cfs_periods_total[5m]) > 0.25
# -- >25% of periods throttled is a common "this pod needs a higher
#    CPU limit, or fewer concurrent worker threads" trigger,
#    independent of what the AVERAGE usage metric shows.

# 2. Raise the limit specifically to cover burst concurrency, not
#    just steady-state average -- e.g. if the app runs a worker pool
#    sized to the NODE's core count (common default in many runtimes'
#    auto-detected thread-pool sizing, which can misdetect the HOST's
#    core count rather than the container's own CPU limit):
# resources:
#   requests:
#     cpu: "300m"     # steady-state, matches the main page's own p50 advice
#   limits:
#     cpu: "2"         # raised specifically to cover multi-thread bursts,
#                       # not derived from p99 average alone
# -- combined with explicitly capping the app's own thread/worker
#    pool size to match the CPU limit (not the host's full core
#    count), rather than relying on the limit increase alone.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own sizing advice exactly, a team sets a container\'s CPU limit to roughly 3x its observed p99 usage from a week of Prometheus data. In production, users still report intermittent latency spikes, and <code>kubectl top pods</code> shows average CPU usage comfortably under the limit the whole time. A teammate says "the limit must be miscalculated — raise it further." Using this subtopic\'s theory, is raising the limit further guaranteed to fix this, and what should be checked first?',
    hint: 'p99 and average usage are computed over a window far longer than the CFS enforcement period. What should be checked to confirm whether the latency spikes actually correlate with CFS throttling, before assuming the limit itself is wrong?',
    solution: 'Per this subtopic\'s theory, raising the limit further is not guaranteed to fix this, and the right first step is checking the container\'s own CFS throttling counters (cpu.stat\'s nr_throttled/throttled_usec, or the container_cpu_cfs_throttled_seconds_total metric the main page\'s own mistake entry already names) directly, rather than assuming the p99-based sizing calculation itself must be wrong. p99 and average usage metrics are computed over windows (Prometheus scrape intervals, dashboard averaging periods) far longer than the 100ms CFS enforcement period — a container can have low average/p99 usage while still bursting hard enough within individual 100ms windows to exhaust its quota and get throttled repeatedly, which is exactly consistent with "average usage comfortably under the limit" plus "intermittent latency spikes." If the throttling counters confirm a meaningful throttled-period ratio, the fix might indeed be raising the limit — but it might also be capping the application\'s own internal thread/worker pool size (which may be auto-detecting the host\'s full core count rather than the container\'s CPU limit), addressing the burst concentration directly rather than just giving it more quota to burst into.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a container\'s average or p99 CPU usage (as shown by kubectl top or a Prometheus dashboard) stays comfortably below its CPU limit, that container cannot be experiencing CFS throttling.',
      reality: 'Per this subtopic\'s theory, throttling is enforced per 100ms period, a window far shorter than any typical averaging window — a container can have low average usage while still bursting hard enough within individual 100ms slices to exhaust its quota repeatedly, completely invisible to average/p99 metrics.'
    },
    {
      thought: 'The main page\'s own sizing advice (limits at 2-4x p99 usage) is sufficient on its own to prevent CPU throttling for any workload.',
      reality: 'Per this subtopic\'s exercise, that advice targets sustained overuse relative to a longer observation window — it does not account for burst concentration within a single 100ms period, which is a genuinely different failure mode that the same p99-based formula does not directly address.'
    },
    {
      thought: 'CPU throttling is primarily a single-threaded-application problem, since a single thread can only use one core\'s worth of time at once.',
      reality: 'Per this subtopic\'s theory, the opposite is true — multi-threaded and multi-process applications are MORE prone to bursty CFS throttling, since multiple threads running concurrently across several cores consume the shared 100ms quota proportionally faster than a single-threaded process ever could.'
    }
  ];
}
