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
  templateUrl: './crashloop-backoff-resets-after-10-min-stable-running.html',
  styleUrl: './crashloop-backoff-resets-after-10-min-stable-running.scss'
})
export class CrashloopBackoffResetsAfter10MinStableRunningSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory describes the backoff sequence but never its reset condition',
      points: [
        'The main page\'s own theory states: "Container starts, crashes (non-zero exit), Kubernetes restarts it with exponential back-off (10s, 20s, 40s… up to 5 min)." This describes the climbing sequence in full, but never says whether — or when — that climbing counter ever goes back DOWN.',
        'The main page\'s own quiz reinforces "exponentially increasing backoff between restart attempts is normal expected behavior" without ever addressing what happens to a container that crashes only occasionally, rather than in a tight, continuous loop — leaving a reader to assume the delay simply keeps climbing forever once a crash streak begins.',
      ]
    },
    {
      heading: 'What actually resets it: 10 minutes of continuous stable running, not just "not crashing right now"',
      points: [
        'Per Kubernetes\' own documented kubelet behavior, the exponential backoff counter for a container resets to its base value (10s) ONLY after that container has been Running continuously, without crashing, for 10 minutes. Until that stability threshold is reached, any new crash continues the SAME backoff sequence from wherever it last left off, not from the beginning.',
        'This produces a specific, easily-misread pattern for a container that crashes intermittently but always BEFORE reaching 10 minutes of stability — e.g., one that crashes reliably every ~8 minutes due to a slow memory leak or a periodic background job failure. Because it never accumulates 10 full stable minutes, its backoff NEVER resets — it climbs to the 5-minute cap on the first few crashes and then STAYS capped at 5 minutes indefinitely, for every subsequent crash, no matter how rare or unrelated each individual crash might seem.',
        'This directly explains a genuinely confusing debugging observation the main page\'s own troubleshooting flow doesn\'t address: a pod that has been "fine for hours" between individual crash events can still show a full 5-minute restart delay on each one — not because Kubernetes is treating a rare event as urgent-and-escalating, but because the container never stayed up long enough in a single stretch to earn a reset, even if the TOTAL uptime across all its stretches looks substantial.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A container that crashes every ~8 minutes never resets its backoff',
      language: 'bash',
      code: `# The main page's own api-xyz pod, but crashing due to a slow
# memory leak that triggers OOMKill roughly every 8 minutes --
# never quite reaching the 10-minute stability threshold:

kubectl get pod api-xyz -n production -w
# NAME      READY   STATUS             RESTARTS   AGE
# api-xyz   0/1     CrashLoopBackOff   1          8m    <- 1st crash, ~10s delay
# api-xyz   1/1     Running            2          8m9s
# ...8 minutes pass, memory leak grows again...
# api-xyz   0/1     CrashLoopBackOff   2          16m   <- 2nd crash, ~20s delay
# api-xyz   1/1     Running            3          16m9s
# ...8 minutes pass again, still under the 10-min threshold...
# api-xyz   0/1     CrashLoopBackOff   3          24m   <- 3rd crash, ~40s delay
# ...this pattern continues, backoff climbing each time...

# By the 5th or 6th crash in this pattern, the delay has already
# reached the 5-minute cap -- and because each "stable" stretch is
# only ~8 minutes (never a full 10), it STAYS at 5 minutes forever
# after, even though this could look like an occasional, low-severity
# issue rather than a "the container can't stay up" one:
kubectl describe pod api-xyz -n production | grep -A2 "Last State"
# Last State:  Terminated
#   Reason:    OOMKilled
#   Exit Code: 137
# -- and the NEXT restart is still 5 minutes away, every single time,
#    despite each individual crash being 8 minutes apart.`,
    },
    {
      label: 'The same container, but crashing every 12 minutes -- backoff DOES reset',
      language: 'bash',
      code: `# Contrast: the SAME underlying issue, but the container happens to
# stay up just past the 10-minute threshold each time (e.g. the leak
# is slightly slower, or memory pressure varies):

kubectl get pod api-xyz -n production -w
# api-xyz   0/1     CrashLoopBackOff   1          12m   <- 1st crash, ~10s delay
# api-xyz   1/1     Running            2          12m9s
# ...12 minutes of stable running pass -- PAST the 10-min threshold...
# api-xyz   0/1     CrashLoopBackOff   2          24m   <- 2nd crash, ~10s delay AGAIN
# -- because THIS container stayed up longer than 10 minutes before
#    crashing again, its backoff counter reset to the base 10s delay
#    -- it is treated as a genuinely FRESH first crash, not a
#    continuation of a growing streak.

# Practical diagnostic takeaway: if restart delays are consistently
# capped at 5 minutes even though crashes feel "occasional," check
# how long the container actually stays Running between each crash
# (kubectl get pod -w, or the AGE column deltas in kubectl describe's
# own Events) -- if it's under 10 minutes every time, the backoff
# was never actually resetting, explaining the persistent 5-min delay.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An on-call engineer notices a pod restarting roughly every 8 minutes due to a slow memory leak, always with a full 5-minute delay between restarts — even on the very first few crashes of the day, right after the leak starts recurring. They assume Kubernetes must be treating this pod as unusually severe, escalating the delay faster than normal for some reason. Using this subtopic\'s theory, is that the correct explanation?',
    hint: 'Does the backoff delay reset itself just because some time has passed since the LAST crash, or does it specifically require a full 10 minutes of CONTINUOUS stable running?',
    solution: 'No — per this subtopic\'s theory, Kubernetes isn\'t treating this pod as unusually severe or escalating faster than normal; the 5-minute delay persisting from the start of the day is the DIRECT, expected consequence of the backoff never having reset in the first place. Since this container crashes every ~8 minutes — always short of the 10-minute continuous-stability threshold required for a reset — its backoff counter from whatever previous crash cycle (possibly hours or days earlier) never went back down to the base 10s delay; it stayed capped at 5 minutes and simply continued from there. The "first few crashes of the day" aren\'t actually first at all from the backoff counter\'s own perspective — they\'re a continuation of an ongoing pattern that never accumulated the 10 stable minutes needed to reset. The fix, if faster restarts are genuinely needed while the underlying memory leak is being fixed, isn\'t adjusting any Kubernetes-level backoff setting (there isn\'t a per-Pod override) — it\'s addressing the leak itself so the container can eventually stay up past 10 minutes and earn a real reset, or accepting the 5-minute delay as an expected side effect of a recurring-but-not-fixed root cause.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The exponential backoff delay for a crashing container resets back to its base value simply because some time has passed since the previous crash, similar to how many rate-limiting systems reset after a cooldown period.',
      reality: 'Per this subtopic\'s theory, the reset specifically requires the container to have been Running CONTINUOUSLY for a full 10 minutes without crashing — merely having some gap since the last crash is not sufficient if that gap was under 10 minutes.'
    },
    {
      thought: 'A pod that appears to crash only "occasionally" (with meaningful gaps between crashes) will always show a correspondingly short, proportionate restart delay, since Kubernetes should recognize the crashes aren\'t happening in a tight loop.',
      reality: 'Per this subtopic\'s exercise, "occasional" crashes with gaps consistently under 10 minutes each still produce a maximally-escalated, capped 5-minute delay — the backoff mechanism has no separate notion of "occasional but never quite stable enough," only whether the full 10-minute threshold was actually reached.'
    },
    {
      thought: 'Once a container\'s backoff delay reaches the 5-minute cap, it stays at that cap permanently for the rest of that Pod\'s lifetime, regardless of any later stable running.',
      reality: 'Per this subtopic\'s theory, the cap is not permanent — if the SAME container eventually manages to stay Running continuously for 10 minutes (even after a long history of capped-delay crashes), the very next crash after that stable stretch resets the backoff back to the base 10-second delay.'
    }
  ];
}
