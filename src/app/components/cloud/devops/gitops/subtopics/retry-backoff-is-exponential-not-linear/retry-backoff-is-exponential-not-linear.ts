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
  templateUrl: './retry-backoff-is-exponential-not-linear.html',
  styleUrl: './retry-backoff-is-exponential-not-linear.scss'
})
export class RetryBackoffIsExponentialNotLinearSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own ArgoCD Application YAML sets a full retry/backoff block with zero explanation',
      points: [
        'The main page\'s own "ArgoCD Application" code tab includes: `retry: { limit: 3, backoff: { duration: 5s, factor: 2 } }`. Neither the theory sections nor the mistakes/QnA ever mention `retry` or `backoff` again — a reader has no way to know whether three retries happen instantly back-to-back, evenly spaced, or something else entirely.',
        'ArgoCD\'s own documentation defines each field plainly: `limit` — "number of retry attempts. Set to -1 for unlimited retries." `backoff.duration` — "base wait time before the first retry." `backoff.factor` — "multiplier applied after each failed attempt." A fourth field the main page\'s own code tab doesn\'t even include, `backoff.maxDuration`, caps "maximum wait time between retries, regardless of the number of attempts."',
      ]
    },
    {
      heading: 'What "duration: 5s, factor: 2" actually produces, attempt by attempt',
      points: [
        'With `duration: 5s` and `factor: 2`, each retry waits roughly double the previous wait: attempt 1 waits 5s after the initial failure, attempt 2 waits 10s, attempt 3 waits 20s — the wait time compounds multiplicatively (exponential backoff), not by a fixed 5-second increment each time (which would be linear backoff, a genuinely different and much gentler curve).',
        'The main page\'s own `limit: 3` caps this at 3 total retry attempts — after the third retry also fails, ArgoCD gives up and reports the sync as failed rather than continuing to retry indefinitely. Since the main page\'s own code tab never sets `backoff.maxDuration`, there is no ceiling on how long a single retry\'s wait can grow to — with only 3 retries total this rarely matters in practice, but it means the growth is technically unbounded for however many retries ARE configured.',
        'This distinction matters operationally: a struggling cluster (API server under load, a resource genuinely still initializing) benefits from GROWING gaps between attempts — hammering it every fixed 5 seconds can make a transient problem worse, while a doubling gap gives the system progressively more room to recover before the next attempt.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Exponential vs. linear -- the same 3 retries, two very different timelines',
      language: 'bash',
      code: `# The main page's own retry block:
# retry:
#   limit: 3
#   backoff:
#     duration: 5s
#     factor: 2

# EXPONENTIAL (what this actually produces, per ArgoCD's own docs
# on backoff.factor -- "multiplier applied after each failed
# attempt"):
#
# Sync fails at T+0
# Retry 1 at T+5s   (waited 5s  = duration)
# Retry 2 at T+15s  (waited 10s = duration * factor^1)
# Retry 3 at T+35s  (waited 20s = duration * factor^2)
# Give up after retry 3 fails too -- total elapsed: 35s

# LINEAR (what factor: 2 does NOT mean, despite looking like it
# might just add 5s each time):
#
# Sync fails at T+0
# Retry 1 at T+5s   (waited 5s)
# Retry 2 at T+10s  (waited 5s again)
# Retry 3 at T+15s  (waited 5s again)
# Give up after retry 3 fails too -- total elapsed: 15s

# Same limit, same duration -- the exponential version takes more
# than DOUBLE the total wall-clock time to exhaust its retries,
# specifically because each individual wait keeps growing.`,
    },
    {
      label: 'Adding the missing maxDuration cap',
      language: 'bash',
      code: `# ArgoCD's own docs describe a fourth field the main page's own
# code tab never sets: backoff.maxDuration -- "maximum wait time
# between retries, regardless of the number of attempts."

# retry:
#   limit: 8               # more retries than the main page's own 3
#   backoff:
#     duration: 5s
#     factor: 2
#     maxDuration: 3m       # <-- caps individual wait times

# Without maxDuration, 8 retries would grow: 5s, 10s, 20s, 40s,
# 80s, 160s, 320s, 640s -- the LAST wait alone would be over 10
# minutes, purely from repeated doubling.

# With maxDuration: 3m (180s), the growth is capped once it would
# exceed that ceiling:
# 5s, 10s, 20s, 40s, 80s, 160s, 180s, 180s
#                          ^ would have been 320s, capped to 180s
#                                ^ would have been 640s, capped too

# The main page's own limit: 3 never actually reaches a point where
# this matters -- 20s (the third wait) is nowhere near any
# reasonable maxDuration -- but a higher retry limit without a cap
# can produce surprisingly long individual waits very quickly.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate reads the main page\'s own `retry: { limit: 3, backoff: { duration: 5s, factor: 2 } }` block and assumes ArgoCD will attempt the sync 4 times total (1 initial + 3 retries), each one 5 seconds apart, for a total of about 15-20 seconds before giving up. Using this subtopic\'s theory, correct this assumption with the actual timeline.',
    hint: 'Per this subtopic\'s theory, does `factor: 2` mean each retry waits the SAME 5 seconds as the one before it, or something that compounds?',
    solution: 'The "each retry 5 seconds apart" part of the assumption is the error — per this subtopic\'s theory, ArgoCD\'s own docs describe `backoff.factor` as "a multiplier applied after each failed attempt," meaning the wait time compounds exponentially rather than staying fixed. The actual timeline is: retry 1 waits 5s (duration), retry 2 waits 10s (duration × factor¹), retry 3 waits 20s (duration × factor²) — for a total elapsed time of roughly 35 seconds from the initial failure to giving up after the third retry, not the ~15-20 seconds a fixed-5-second-gap assumption would produce. The "4 attempts total, limit: 3 retries" part of the assumption is correct — `limit` does mean 3 retry attempts after the initial failure — it\'s specifically the SPACING between those attempts that grows rather than staying constant.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ArgoCD\'s `backoff.duration: 5s, factor: 2` means each retry waits a fixed 5 seconds, and factor: 2 just describes doubling the retry COUNT somehow.',
      reality: 'Per this subtopic\'s theory, ArgoCD\'s own docs describe `factor` as "a multiplier applied after each failed attempt" to the WAIT TIME itself — the delay between attempts compounds (5s, 10s, 20s...), it does not stay fixed, and it has nothing to do with how many total retries occur (that\'s controlled separately by `limit`).'
    },
    {
      thought: 'Since the main page\'s own retry block doesn\'t set backoff.maxDuration, there must be no limit at all on how many times or how long ArgoCD keeps retrying.',
      reality: 'This subtopic\'s theory clarifies these are two separate, independent caps — `limit: 3` (which the main page\'s own code tab DOES set) caps the total number of retry attempts regardless of `maxDuration`; `maxDuration` only caps how long any INDIVIDUAL wait between attempts can grow to. Omitting `maxDuration` just means the exponential growth has no per-wait ceiling, not that retries continue forever.'
    },
    {
      thought: 'Exponential backoff (factor: 2) and linear backoff (a fixed delay repeated) end up taking roughly the same total time for the same number of retries — the choice is mostly stylistic.',
      reality: 'This subtopic\'s first code example shows a concrete, real gap — with the main page\'s own exact values (limit: 3, duration: 5s, factor: 2), exponential backoff takes more than double the total wall-clock time (35s) that an equivalent fixed 5-second linear backoff would (15s), specifically because each wait keeps growing rather than repeating.'
    }
  ];
}
