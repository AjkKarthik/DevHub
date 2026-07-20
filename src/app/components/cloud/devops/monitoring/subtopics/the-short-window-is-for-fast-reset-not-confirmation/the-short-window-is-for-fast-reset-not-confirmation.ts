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
  templateUrl: './the-short-window-is-for-fast-reset-not-confirmation.html',
  styleUrl: './the-short-window-is-for-fast-reset-not-confirmation.scss'
})
export class TheShortWindowIsForFastResetNotConfirmationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own SLO alert combines a long window and a short window with "and", but never says what job the short window is actually doing',
      points: [
        'The main page\'s own `ErrorBudgetBurnHigh` alert requires BOTH `rate(...[1h]) > threshold` AND `rate(...[5m]) > threshold` to fire — two separate PromQL expressions joined with `and`. The comment above it only explains the burn-rate MATH ("14.4× burn depletes budget in 2 hours"), never why two windows, rather than just the 1-hour one, are required together.',
        'A plausible-sounding but incomplete guess is that the short window exists to "confirm" or "double-check" the long window\'s finding — as if it were redundant validation. Google\'s own SRE Workbook describes a more specific, different purpose entirely.',
      ]
    },
    {
      heading: 'The short window\'s real job: making the alert clear quickly once the problem is actually fixed',
      points: [
        'Google\'s own SRE Workbook states the core problem the short window solves directly: "we need to add another parameter: a shorter window to check if the error budget is still being consumed as we trigger the alert." The concrete consequence, per the same source: "The short window average drops below the threshold 5 minutes after the errors stop... The long window average drops below the threshold 60 minutes after the errors stop."',
        'This means a LONG-window-only alert has a genuine, separate problem beyond false positives: even after an incident is fully fixed, the 1-hour window keeps showing an elevated average for up to an hour afterward, since it\'s averaging over the whole hour including the bad period — the alert would stay firing (or take up to an hour to clear) long after the on-call engineer has already resolved the issue, which is its own kind of noise (a stale, misleading "still broken" signal).',
        'Requiring the SHORT window to ALSO still be breaching, per Google\'s own docs, means the alert clears "five minutes later, rather than one hour later" once the actual error rate drops back to normal — the short window\'s job is fast RESET TIME, a genuinely different property from the long window\'s job (avoiding false positives from brief, self-resolving blips).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What a long-window-ONLY alert would do -- stays "firing" long after the fix',
      language: 'bash',
      code: `# Hypothetical: main page's own alert with ONLY the 1h window,
# no "and" with the 5m window at all:

# - alert: ErrorBudgetBurnHigh
#   expr: |
#     rate(http_requests_total{status=~"5.."}[1h])
#     / rate(http_requests_total[1h]) > (14.4 * 0.001)
#   for: 2m

# Timeline:
# T+0:00  Errors spike to 15% (way above the 1.44% threshold)
# T+0:02  Alert fires (after the "for: 2m" confirmation window)
# T+0:10  On-call engineer identifies and deploys a fix
# T+0:11  Errors back to normal (0% again)
#
# But the 1h RATE WINDOW still includes the 10 minutes of bad
# data from earlier in that same rolling hour -- per Google's own
# SRE Workbook, "The long window average drops below the threshold
# 60 minutes after the errors stop." The alert stays FIRING for up
# to another 49 minutes, showing "still broken" to anyone checking,
# even though the actual problem was fixed 49 minutes earlier.`,
    },
    {
      label: 'The main page\'s own two-window version -- clears in minutes, not an hour',
      language: 'bash',
      code: `# The main page's own actual alert (both windows, joined with "and"):

# - alert: ErrorBudgetBurnHigh
#   expr: |
#     (
#       rate(http_requests_total{status=~"5.."}[1h])
#       / rate(http_requests_total[1h])
#     ) > (14.4 * 0.001)
#     and
#     (
#       rate(http_requests_total{status=~"5.."}[5m])
#       / rate(http_requests_total[5m])
#     ) > (14.4 * 0.001)
#   for: 2m

# Same timeline as before -- errors spike, get fixed at T+0:11.
#
# The SHORT (5m) window recovers almost immediately once the real
# error rate drops -- per Google's own SRE Workbook, "The short
# window average drops below the threshold 5 minutes after the
# errors stop." Since the "and" requires BOTH windows to still be
# breaching, the moment the 5m window drops below threshold (around
# T+0:16), the WHOLE "and" condition becomes false and the alert
# clears -- even though the 1h window alone would keep showing
# elevated numbers for another 44+ minutes.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes simplifying the main page\'s own `ErrorBudgetBurnHigh` alert by removing the 5-minute window entirely, keeping only the 1-hour check, reasoning "the 5-minute window is redundant — if the 1-hour rate is already above threshold, that\'s already good enough evidence of a real problem." Using this subtopic\'s theory, explain what specifically would get worse if this simplification were made.',
    hint: 'Per this subtopic\'s theory, is the short window\'s main job about DETECTING the problem (which the teammate\'s argument focuses on), or about something that happens AFTER the problem is already fixed?',
    solution: 'The teammate\'s argument addresses detection, but per this subtopic\'s theory, the short window\'s primary job is about what happens AFTER the incident is resolved, not about initially confirming the problem is real. Removing it would make the alert\'s RESET TIME dramatically worse — per Google\'s own SRE Workbook, a long-window-only alert keeps showing an elevated rate "60 minutes after the errors stop," since the 1-hour rolling average still includes the bad data from earlier in that hour, long after the actual issue was fixed. With the 5-minute window\'s "and" condition removed, the alert would stay firing for up to an hour after every incident is resolved, rather than clearing within about 5 minutes as the current two-window version does — a real, ongoing cost to on-call engineers who have to keep manually checking or acknowledging an alert that\'s technically still "firing" for a problem that\'s already been fixed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The 5-minute window in the main page\'s own SLO alert exists purely to double-check or confirm the 1-hour window\'s finding — essentially redundant validation of the same thing.',
      reality: 'Per this subtopic\'s theory, Google\'s own SRE Workbook describes a genuinely different, separate purpose: the short window is specifically what lets the alert CLEAR quickly once the problem is fixed, not just an extra confirmation step before firing.'
    },
    {
      thought: 'An alert using only a long time window (like 1 hour) is just as good as a multi-window alert, just slightly slower to detect problems — a minor tradeoff.',
      reality: 'This subtopic\'s first code example shows the real cost is on the OTHER end — a long-window-only alert can stay firing for up to an hour AFTER a problem is already fixed, per Google\'s own documented example, which is a genuinely worse experience for on-call engineers than a slightly slower initial detection would be.'
    },
    {
      thought: 'Making the short window\'s time range even shorter (e.g. 1 minute instead of 5) would make the alert both detect problems faster AND clear even faster, with no downside.',
      reality: 'Per this subtopic\'s theory, the short window\'s recommended sizing is a deliberate ratio (Google\'s own guidance suggests roughly 1/12th of the long window) — making it too short risks the opposite problem this subtopic\'s theory doesn\'t cover in depth but the main page\'s own broader alerting-on-symptoms philosophy warns about: an overly sensitive short window can flap on brief, self-resolving noise, undermining the very stability the "and" condition with the long window was meant to provide.'
    }
  ];
}
