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
  templateUrl: './iostats-percent-util-is-misleading-on-nvme-ssds.html',
  styleUrl: './iostats-percent-util-is-misleading-on-nvme-ssds.scss'
})
export class IostatsPercentUtilIsMisleadingOnNvmeSsdsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states a single %util threshold as if it applies uniformly to all storage',
      points: [
        'The main page\'s own theory states plainly: "High %util (>70–80%) on a disk indicates I/O saturation." Its own Common Mistakes section confirms this is meant as a general rule, not something scoped to a specific device type. No distinction is drawn between spinning disks, SATA SSDs, and NVMe SSDs anywhere on the page.',
        'This matters because the main page\'s own diagnostics workflow leans on iostat -x specifically: "key: r/s, w/s, await (ms), %util" — presented as a small, trustworthy set of numbers to read together, with %util implicitly treated as reliable evidence of saturation regardless of the underlying hardware.',
      ]
    },
    {
      heading: 'Confirmed: %util measures "any request in flight," which is meaningless for a device that queues thousands of requests in parallel',
      points: [
        'Per direct analysis of how iostat computes this metric: "the kernel counts %util as \'any I/O in flight at any moment\', which is fine for a spinning disk that processes one request at a time but meaningless for NVMe devices that handle thousands of requests in parallel across hardware queues." A traditional spinning disk really can only service one request at a time, so "busy some fraction of the time" and "saturated" are nearly the same thing for it — but that equivalence breaks down completely for a device built around deep, parallel queues.',
        'The confirmed, concrete consequence: "an NVMe drive can sit at 100% %util while operating at 5% of its real capacity" — and even more starkly, "disk IO utilization is close to 100% even though there is just one outstanding IO request." A single, lonely request being processed by a device that can handle a thousand at once is enough to report the exact same 100% figure the main page\'s own theory treats as clear evidence of saturation.',
        'The root cause, per the same analysis: "unlike CPUs, Linux does not have direct visibility on how the IO device is designed" — the kernel\'s %util calculation predates NVMe\'s deep-queue architecture and was never updated to distinguish "busy" from "saturated" for a device type that can be simultaneously busy AND nowhere near its actual capacity limit.',
      ]
    },
    {
      heading: 'The metrics that actually indicate NVMe saturation, and why',
      points: [
        'The documented, reliable alternative for NVMe specifically: "on NVMe, trust r_await, w_await, and aqu-sz instead... if r_await stays under 1 ms and the queue depth is comfortably below the device\'s hardware queue depth (often 1024 or higher), the drive isn\'t actually saturated regardless of what %util says." These metrics measure actual request LATENCY and actual QUEUE DEPTH — the real signals of whether the device is keeping up — rather than the binary "was anything happening at all" signal %util reports.',
        'This directly refines, rather than contradicts, the main page\'s own advice — the main page already lists await among its "key" columns to watch, alongside %util. The correction is entirely about WHICH of those two the main page\'s own theory should have emphasized as authoritative for modern storage: await (and its read/write-split cousins r_await/w_await) remain trustworthy across every device type; %util specifically is the one that becomes unreliable once the device supports deep, parallel queuing.',
        'Practically, this means a report of "iostat shows 100% %util, the disk must be the bottleneck" needs a follow-up question before acting on it: what kind of device is this? On a spinning disk or a shallow-queue SATA SSD, the main page\'s own 70–80% threshold remains reasonably trustworthy. On NVMe, that same number needs r_await/aqu-sz to actually confirm or refute what %util alone can\'t reliably tell you.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own %util threshold, applied to an NVMe device that isn\'t actually saturated',
      language: 'bash',
      code: `# Main page's own iostat guidance, applied to an NVMe-backed
# database server:
iostat -xz 1 3
# Device   r/s   w/s   r_await  w_await  aqu-sz  %util
# nvme0n1  850   120   0.42     0.51     3.20    100.00

# Per the main page's own theory: "High %util (>70-80%) on a disk
# indicates I/O saturation." Read at face value, 100.00 looks like
# the clearest possible sign of a maxed-out, bottlenecked disk.

# But per documented analysis of how %util is actually computed:
# "the kernel counts %util as 'any I/O in flight at any moment'...
# meaningless for NVMe devices that handle thousands of requests in
# parallel across hardware queues" -- and confirmed directly:
# "an NVMe drive can sit at 100% %util while operating at 5% of its
# real capacity."

# Check the device's actual hardware queue depth for context:
cat /sys/block/nvme0n1/queue/nr_requests
# 1023
# -- this device can queue over a thousand requests in parallel.
#    An aqu-sz of 3.20 (from the iostat output above) is nowhere
#    close to that capacity.`,
    },
    {
      label: 'The metrics that actually confirm (or rule out) NVMe saturation',
      language: 'bash',
      code: `# Per documented guidance: "on NVMe, trust r_await, w_await, and
# aqu-sz instead. If r_await stays under 1 ms and the queue depth
# is comfortably below the device's hardware queue depth (often
# 1024 or higher), the drive isn't actually saturated regardless of
# what %util says."

# Re-examining the SAME iostat output from the previous example
# with the CORRECT metrics for this device type:
#   r_await = 0.42 ms   <-- well under 1ms -- fast, healthy latency
#   w_await = 0.51 ms   <-- also well under 1ms
#   aqu-sz  = 3.20       <-- vs. a queue depth capacity of 1023 --
#                             using a tiny fraction of available
#                             parallelism

# Conclusion: this device is NOT saturated, despite %util reading
# 100.00 -- the 100% figure reflects "something was in flight
# nearly every sample interval," not "the device is at capacity."

# Compare against a GENUINELY saturated NVMe device for contrast:
iostat -xz 1 3
# Device   r/s    w/s   r_await  w_await  aqu-sz   %util
# nvme0n1  9200   1400  8.90     12.30    980.00   100.00
# -- HERE, r_await/w_await are both in double-digit milliseconds
#    (a real latency problem) AND aqu-sz (980) is right up against
#    the device's own ~1023 queue-depth ceiling -- THIS is what
#    actual NVMe saturation looks like in the numbers, not the
#    %util column alone.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team investigating slow API response times runs iostat -xz 1 5 on their NVMe-backed production database server and sees %util at a steady 100% on the primary data volume. Following the main page\'s own guidance ("High %util (>70–80%)... indicates I/O saturation"), they conclude the disk is the bottleneck and begin planning an expensive storage upgrade. Before approving the purchase, a colleague asks them to also check r_await, w_await, and aqu-sz from the same iostat output. Why would that additional check matter, and what outcome would suggest the storage upgrade isn\'t actually necessary?',
    hint: 'Check what %util actually measures on a device architecture that can service many requests in parallel (like NVMe), versus what it measures on a traditional spinning disk that can only handle one request at a time — is 100% %util the same signal on both?',
    solution: 'The additional check matters because %util is specifically documented as unreliable for NVMe devices — "the kernel counts %util as \'any I/O in flight at any moment\'... meaningless for NVMe devices that handle thousands of requests in parallel," to the point that "an NVMe drive can sit at 100% %util while operating at 5% of its real capacity." A steady 100% reading on NVMe could mean the device is genuinely maxed out, or it could simply mean at least one request was in flight during nearly every sampling interval — which is a very low bar for a device built to handle a thousand-plus requests simultaneously. If r_await and w_await both stay comfortably under roughly 1ms, and aqu-sz sits far below the device\'s actual hardware queue depth (visible via /sys/block/<device>/queue/nr_requests, often 1024 or higher), that combination indicates the drive is fast and has plenty of headroom left — the 100% %util reading was a red herring, not evidence of saturation. In that outcome, the team should look elsewhere for the actual bottleneck (application-level query patterns, network latency, CPU contention) rather than spending on a storage upgrade the data doesn\'t actually support.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own 70-80% %util saturation threshold applies uniformly to any storage device — spinning disk, SATA SSD, or NVMe.',
      reality: 'Per this subtopic\'s theory, %util\'s reliability depends heavily on the device\'s queueing architecture — the threshold remains reasonably trustworthy for a traditional spinning disk (which really can only serve one request at a time), but becomes actively misleading on NVMe devices designed for deep, parallel request queues.'
    },
    {
      thought: '100% %util on an NVMe device always means the storage is the bottleneck and needs more capacity or a hardware upgrade.',
      reality: 'Per this subtopic\'s theory, an NVMe drive "can sit at 100% %util while operating at 5% of its real capacity" — the figure only confirms something was in flight during nearly every sample, not that the device\'s actual parallel-request capacity is exhausted.'
    },
    {
      thought: 'iostat\'s await column and %util column measure roughly the same thing from two different angles, so either one alone is sufficient to judge disk saturation.',
      reality: 'Per this subtopic\'s theory, these measure genuinely different things — await (and r_await/w_await) reflects actual request latency, a reliable signal across every device type, while %util reflects only whether the device was busy at all during a sample, which loses its meaning specifically for deep-queue devices like NVMe.'
    }
  ];
}
