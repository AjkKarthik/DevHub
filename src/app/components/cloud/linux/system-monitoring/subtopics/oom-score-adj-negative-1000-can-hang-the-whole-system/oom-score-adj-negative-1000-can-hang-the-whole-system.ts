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
  templateUrl: './oom-score-adj-negative-1000-can-hang-the-whole-system.html',
  styleUrl: './oom-score-adj-negative-1000-can-hang-the-whole-system.scss'
})
export class OomScoreAdjNegative1000CanHangTheWholeSystemSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page frames oom_score_adj purely as a protective tool, with no downside mentioned',
      points: [
        'The main page\'s own QnA states the mechanism in purely positive terms: "you can tune oom_score_adj (-1000 to 1000) in /proc/<PID>/oom_score_adj to protect critical processes." Every word here frames the -1000 direction as an unambiguous win — protection, with nothing about what happens if that protection is used too broadly.',
        'Nothing on the main page connects this back to its own OOM theory elsewhere on the page, which frames the OOM killer entirely as a mechanism that reliably "selects a process to kill based on its oom_score" — implicitly assuming a killable candidate is always available when memory runs out.',
      ]
    },
    {
      heading: 'Confirmed: -1000 doesn\'t just deprioritize a process for killing, it makes it fully immune',
      points: [
        'Per direct analysis of the OOM killer\'s documented scoring behavior: "setting oom_score_adj to -1000 makes a process completely exempt — the kernel will skip it regardless of RSS. The lowest possible value, -1000, is equivalent to disabling OOM-killing entirely for that task, since it will always report a badness score of 0." This isn\'t "very unlikely to be chosen" — it is a hard, absolute exclusion from the OOM killer\'s candidate pool.',
        'The documented danger this creates: "if too many processes are immune, the OOM killer may not be able to free enough memory and the system could hang." A process protected this way "can use 100% memory and still avoid getting terminated by OOM killer" — meaning a genuine memory leak in a -1000-protected process is now UNSTOPPABLE by the very mechanism the main page\'s own theory describes as the system\'s safety net.',
        'The specific failure mode when this happens: "if multiple important processes are set to -1000, and they collectively consume all available memory, the OOM killer has no candidate processes to terminate and cannot reclaim memory" — at that point the system doesn\'t recover via a clean, visible OOM kill (which at least shows up in dmesg, exactly as the main page\'s own diagnostics section describes checking for); it simply hangs, often with no clear log entry pointing at the cause.',
      ]
    },
    {
      heading: 'Why this directly undermines the main page\'s own OOM diagnostic advice',
      points: [
        'The main page\'s own QnA on diagnosing an OOM kill assumes there WILL be an OOM kill to diagnose: "Check dmesg -T | grep -i \'out of memory\\|killed process\' to see OOM killer events." A system that hangs because every plausible candidate was set to -1000 produces NO such kill event at all — the exact diagnostic command the main page recommends comes back empty, not because there was no memory problem, but because the kernel had nothing left it was permitted to kill.',
        'The documented, safer discipline is using -1000 "judiciously for only the most critical processes, not as a blanket protection strategy" — reserving true immunity for something like the OOM killer\'s own daemon or a genuinely irreplaceable init process, while giving everything else (including "important" application processes) a STRONGLY negative but non-absolute value (e.g. -500) that still makes them a last resort without removing them from the candidate pool entirely.',
        'This is a case where the main page\'s own framing ("protect critical processes") is directionally correct but dangerously incomplete on its own — protecting ONE process with -1000 is exactly the intended, safe use case; protecting MANY processes this way, especially ones that are also the most likely to leak memory in the first place, converts a safety mechanism into a way to guarantee the system has no safety mechanism left when it\'s actually needed.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setting -1000 exactly as the main page\'s own QnA describes',
      language: 'bash',
      code: `# Main page's own guidance, followed literally:
echo -1000 | sudo tee /proc/12345/oom_score_adj
# "protect critical processes" -- per the main page's own QnA

# Confirm the effect on the computed score:
cat /proc/12345/oom_score
# 0
# -- per documented OOM killer behavior: "-1000... will always
#    report a badness score of 0" -- this process is now
#    COMPLETELY exempt from consideration, not just deprioritized.

# This process can now consume unbounded memory with zero risk of
# being the one killed to relieve pressure:
# (simulated: this process has a slow memory leak)
ps -o pid,rss,cmd -p 12345
# PID    RSS      CMD
# 12345  8123456  ./leaky-but-protected-service
# (RSS climbing steadily over hours -- but oom_score stays 0)`,
    },
    {
      label: 'The danger: too many -1000 processes leaves the OOM killer with nothing to kill',
      language: 'bash',
      code: `# A team, following the main page's own "protect critical
# processes" guidance literally, sets EVERY service they consider
# important to -1000:
for pid in $(pgrep -f "critical-service"); do
  echo -1000 | sudo tee /proc/$pid/oom_score_adj
done
# Applied to the database, the cache, the API server, the logging
# agent -- "all of them are critical," so all of them get the max
# protection.

# Memory pressure builds (perhaps from one of these SAME "critical"
# processes leaking). Per documented OOM killer behavior: "if
# multiple important processes are set to -1000, and they
# collectively consume all available memory, the OOM killer has no
# candidate processes to terminate and cannot reclaim memory."

# What the main page's own diagnostic advice expects to find:
dmesg -T | grep -i "out of memory\\|killed process"
# (NO OUTPUT -- there was no kill, because nothing was killable)

# What actually happens instead: the system hangs or becomes
# unresponsive, with no clean OOM-kill log entry pointing at the
# cause at all -- the exact diagnostic the main page recommends
# comes back empty precisely because the protection worked too well.

# The safer, documented alternative: reserve TRUE -1000 immunity
# for one or two genuinely irreplaceable processes; give everything
# else a strongly negative but non-absolute value instead:
echo -500 | sudo tee /proc/12345/oom_score_adj
# Still heavily deprioritized as a kill target, but NOT removed
# from the candidate pool entirely if things get bad enough.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team, following the main page\'s own advice to "protect critical processes," sets oom_score_adj to -1000 for their database, cache, and three application services — reasoning that all five are business-critical and none should ever be the OOM killer\'s target. Months later, a memory leak develops in one of the application services. Instead of the OOM killer cleanly terminating the leaking process (which the team expected, assuming SOME process would eventually be killed to free memory), the entire server becomes unresponsive with no OOM-kill entries in dmesg at all. What went wrong, and how should the original oom_score_adj configuration have been designed differently?',
    hint: 'Check what oom_score_adj = -1000 specifically does to a process\'s candidacy for the OOM killer — is it just a strong deprioritization, or a complete, absolute exclusion — and what happens when EVERY plausible candidate on the system has that exact same absolute exclusion applied.',
    solution: 'Setting oom_score_adj to -1000 doesn\'t just make a process unlikely to be chosen — it makes it "completely exempt... the kernel will skip it regardless of RSS," guaranteeing a computed oom_score of exactly 0 no matter how much memory it consumes. Because the team applied this same absolute exemption to all five of their processes, when the leaking application service\'s memory usage grew large enough to exhaust the system, the OOM killer had no eligible candidate left to terminate — every process actually capable of freeing meaningful memory was explicitly excluded from consideration. Per documented OOM killer behavior, this specific configuration ("if multiple important processes are set to -1000, and they collectively consume all available memory, the OOM killer has no candidate processes to terminate and cannot reclaim memory") produces exactly the observed outcome: a full system hang with no clean OOM-kill log entry, since nothing was ever actually killed. The fix is reserving true -1000 immunity for at most one or two genuinely irreplaceable processes (or none at all, in a services-only environment), and giving the rest — including the database and other "critical" services — a strongly negative but non-absolute value like -500, which still heavily deprioritizes them as a kill target without removing them from the candidate pool entirely, preserving a working safety net for exactly this kind of leak scenario.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'oom_score_adj = -1000 is a strong protection setting, similar in kind to a less negative value like -500, just further along the same scale.',
      reality: 'Per this subtopic\'s theory, -1000 specifically is a hard, absolute exemption — the process is guaranteed a badness score of 0 and is completely removed from the OOM killer\'s candidate pool, a qualitatively different outcome from a strongly negative but non-absolute value.'
    },
    {
      thought: 'Protecting every important service on a system with oom_score_adj = -1000 is a reasonable, safe way to ensure none of them are ever mistakenly killed during a memory shortage.',
      reality: 'Per this subtopic\'s theory, protecting too many processes this way can leave the OOM killer with no eligible candidate at all when memory genuinely runs out, causing the entire system to hang rather than cleanly killing one problematic process.'
    },
    {
      thought: 'If a system running -1000-protected processes hangs due to memory exhaustion, dmesg will still show an OOM-kill event, just for a different, non-protected process.',
      reality: 'Per this subtopic\'s theory, if every plausible candidate has been set to -1000, there is no OOM kill at all — the main page\'s own recommended diagnostic (checking dmesg for "killed process" entries) returns nothing, precisely because the protection prevented any kill from happening in the first place.'
    }
  ];
}
