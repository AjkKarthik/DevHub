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
  templateUrl: './load-average-has-blind-spots-psi-is-the-modern-replacement.html',
  styleUrl: './load-average-has-blind-spots-psi-is-the-modern-replacement.scss'
})
export class LoadAverageHasBlindSpotsPsiIsTheModernReplacementSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats load average as the primary, sufficient signal for resource pressure',
      points: [
        'The main page\'s own theory and mistakes section both center entirely on load average as the way to answer "is this system under pressure" — "Load average: the 1/5/15-minute averages of runnable + uninterruptible processes... Load / CPU count = per-core load." Its own Common Mistakes entry ("Using load average without considering CPU count") treats correctly interpreting THIS metric as the main skill to master.',
        'Nothing on the main page mentions that load average has well-known, longstanding blind spots — it conflates CPU contention with I/O contention into one number (since it counts BOTH runnable-for-CPU and uninterruptible-I/O-sleep processes together), giving no way to tell from the number alone whether a high load average means "CPU-starved" or "stuck waiting on a slow disk," despite the main page\'s own theory needing a SEPARATE metric (%iowait) elsewhere on the same page to make that exact distinction.',
      ]
    },
    {
      heading: 'Confirmed: PSI is the modern, purpose-built kernel feature that fixes this',
      points: [
        'Per the Linux kernel\'s own documentation, Pressure Stall Information (PSI) "identifies and quantifies the disruptions caused by... resource crunches and the time impact it has on complex workloads or even entire systems" — specifically built to address the gap that "traditional load average metrics don\'t capture the actual productivity losses from resource scarcity."',
        'PSI exposes three SEPARATE files under /proc/pressure/ — cpu, memory, and io — each reporting its own independent pressure, resolving exactly the conflation problem load average has. Each file reports two lines: "\'some\': tracks when at least some tasks stall on a resource" and "\'full\': tracks when all non-idle tasks stall simultaneously (actual CPU cycles wasted)" — with percentages over 10, 60, and 300-second rolling windows, plus cumulative stall time in microseconds.',
        'The "full" line in particular has no load-average equivalent at all — it directly measures time where the ENTIRE system made zero forward progress because of that specific resource, a much more actionable signal than an aggregate count of runnable-or-blocked processes that never distinguishes "the CPU is genuinely busy running useful work" from "everything is stalled waiting on the same bottleneck."',
      ]
    },
    {
      heading: 'Why this matters for the main page\'s own diagnostic workflow',
      points: [
        'The main page\'s own interviewFocus question — "How do you determine if a server is CPU-bound, memory-bound, or I/O-bound?" — is exactly the question PSI is purpose-built to answer directly, in one place, where the main page\'s own documented approach requires cross-referencing load average, %iowait from top, AND iostat\'s own device-level stats to triangulate the same answer indirectly.',
        'A single process stuck in D-state waiting on a hung NFS mount (a scenario the main page itself mentions elsewhere in this hub, in the Process Management topic) inflates the traditional load average number identically to a genuine CPU-bound spike — from load average alone, the two situations are indistinguishable. cat /proc/pressure/io would show high IO pressure with near-zero CPU pressure in the NFS-hang case, immediately pointing at the correct bottleneck.',
        'PSI doesn\'t replace load average\'s usefulness as a simple, familiar, single-number historical trend indicator (still shown in uptime/top output everywhere, still useful for quick "has this gotten worse" checks) — it complements it as the tool to reach for once that quick check says "yes, something\'s wrong" and the next question becomes "wrong with WHAT, specifically."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The blind spot: identical load average, two very different problems',
      language: 'bash',
      code: `# Main page's own theory: "Load average: the 1/5/15-minute averages
# of runnable + uninterruptible processes." Two DIFFERENT scenarios
# that produce the SAME reported load average number:

# Scenario A -- genuinely CPU-bound (a tight compute loop):
uptime
#  load average: 4.02, 3.98, 3.10

# Scenario B -- a process stuck in D-state on a hung NFS mount
# (zero CPU work happening, pure I/O wait):
uptime
#  load average: 4.01, 3.95, 3.05
# -- nearly IDENTICAL numbers, completely different root causes.
# Load average alone cannot distinguish these two situations.

# The main page's own workaround requires a SEPARATE tool
# (top's %wa column) just to start telling them apart:
top -b -n 1 | head -5
# ...
# %Cpu(s): 85.0 us, ...   <-- Scenario A: CPU genuinely busy
# %Cpu(s):  2.0 us, ... 91.0 wa   <-- Scenario B: CPUs idle, I/O wait`,
    },
    {
      label: 'PSI: one command, resource-specific pressure, directly',
      language: 'bash',
      code: `# Per the Linux kernel's own PSI documentation, three SEPARATE
# files under /proc/pressure/ resolve the exact ambiguity above:

cat /proc/pressure/cpu
# some avg10=0.00 avg60=0.00 avg300=0.00 total=182935
# -- (full line omitted for cpu -- a task can always yield the CPU,
#     so "full" CPU stall time is architecturally impossible)

cat /proc/pressure/io
# some avg10=91.23 avg60=88.40 avg300=71.02 total=98234123
# full avg10=85.11 avg60=82.30 avg300=65.44 total=91234567
# -- HIGH io pressure, especially "full" (the whole system stalled
#    waiting on I/O) -- immediately points at Scenario B (the NFS
#    hang) without needing to cross-reference a second tool.

cat /proc/pressure/memory
# some avg10=0.00 avg60=0.00 avg300=0.00 total=0
# -- confirms memory isn't a factor in either scenario here.

# Per the kernel docs: "some" = at least some tasks stalled on this
# resource; "full" = ALL non-idle tasks stalled simultaneously --
# "full" has no load-average equivalent at all, and is the more
# directly actionable of the two numbers for "is the whole system
# stuck because of this resource specifically."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A production server\'s load average climbs to 8.0 on a 4-core box (per the main page\'s own math, a clearly overloaded 200% per-core figure), but top shows CPU usage sitting comfortably under 20% the entire time, and no single process appears to be consuming excessive CPU. The team is confused because "high load average" is supposed to mean the CPUs are overwhelmed, yet the CPUs themselves look nearly idle. What\'s the fastest way to identify the actual bottleneck, and what would you expect it to show?',
    hint: 'Check what load average actually counts, per the main page\'s own definition — is it strictly CPU-runnable processes, or does it also include processes blocked in a specific kind of I/O wait?',
    solution: 'This is exactly the load-average blind spot — the main page\'s own definition already hints at the answer: load average counts "runnable + uninterruptible processes," not just CPU-runnable ones. High load average with low CPU usage is the classic signature of processes stuck in D-state (uninterruptible I/O sleep, most commonly a hung or slow NFS mount, or a struggling disk), not CPU contention at all. The fastest way to confirm this directly, rather than inferring it indirectly from the mismatch, is checking Pressure Stall Information: cat /proc/pressure/io. Per the kernel\'s own PSI documentation, this would be expected to show high "some" and especially high "full" values (indicating the system is frequently or constantly stalled waiting on I/O), while cat /proc/pressure/cpu would show correspondingly low values — directly confirming an I/O bottleneck rather than a CPU one, in one targeted check instead of the main page\'s own cross-referencing approach (load average + top\'s %wa + iostat).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A high load average always means the CPUs are under heavy contention, since the main page describes load / CPU count as a measure of "per-core utilisation."',
      reality: 'Per this subtopic\'s theory, load average also counts processes in uninterruptible I/O sleep (D-state) — a system stuck waiting on a hung disk or NFS mount can show an identically high load average to a genuinely CPU-bound system, with the CPUs themselves sitting nearly idle.'
    },
    {
      thought: 'Distinguishing a CPU bottleneck from an I/O bottleneck requires combining several different tools (load average, top\'s %wa column, iostat) since no single Linux metric reports this directly.',
      reality: 'Per this subtopic\'s theory, the kernel\'s own PSI feature (/proc/pressure/cpu, /proc/pressure/memory, /proc/pressure/io) reports resource-specific stall pressure directly and separately for each resource, purpose-built to answer exactly this question in one place.'
    },
    {
      thought: 'PSI is a niche or experimental feature that replaces load average entirely — checking uptime or top for the traditional load numbers is now outdated practice.',
      reality: 'Per this subtopic\'s theory, PSI complements load average rather than replacing it — load average remains a useful, familiar quick-glance trend indicator; PSI is the more precise tool for the follow-up question of exactly which resource is actually the bottleneck.'
    }
  ];
}
