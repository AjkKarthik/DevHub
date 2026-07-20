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
  templateUrl: './group-wait-interval-repeat-interval-are-different-timers.html',
  styleUrl: './group-wait-interval-repeat-interval-are-different-timers.scss'
})
export class GroupWaitIntervalRepeatIntervalAreDifferentTimersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own AlertManager config sets three timing fields with specific values, but never explains what each one individually governs',
      points: [
        'The main page\'s own "AlertManager routing" code tab sets `group_wait: 30s`, `group_interval: 5m`, and `repeat_interval: 12h` — three separate values presented as one block of "route" configuration, with no comment distinguishing what happens at each of the three moments they each control.',
        'It would be reasonable to guess these are three variations on the same idea ("how often to notify"), or even redundant with each other. Prometheus\'s own AlertManager documentation instead defines each one as governing a genuinely different point in an alert group\'s notification lifecycle.',
      ]
    },
    {
      heading: 'Three different moments, three different timers',
      points: [
        'Per AlertManager\'s own docs, `group_wait` — "How long to wait before sending the first notification for a new group of alerts" — is the batching delay right when alerts first start firing. The main page\'s own `group_wait: 30s` means: if `HighErrorRate` and `SlowLatency` both start firing within 30 seconds of each other (both matching `group_by: [\'alertname\', \'job\']`... wait, actually different alertnames means different groups — the more realistic case is two INSTANCES of the same alert firing close together), AlertManager waits up to 30 seconds to bundle them into ONE notification rather than sending two separate pages seconds apart.',
        '`group_interval` — per AlertManager\'s own docs, "How long to wait before sending subsequent notifications for an existing group of alerts after group_wait" — governs a DIFFERENT case: a NEW alert joining a group that has ALREADY sent its first notification. The main page\'s own `group_interval: 5m` means once a group has already notified, any additional alerts joining that same group wait up to 5 minutes before triggering an updated notification, rather than re-notifying instantly for every single new alert.',
        '`repeat_interval` — per AlertManager\'s own docs, "How long to wait before repeating the last notification. Notifications are not repeated if any new alerts have fired or any firing alerts have resolved" — governs the case where NOTHING has changed at all: the same alert is still firing, unmodified, and the main page\'s own `repeat_interval: 12h` means the on-call channel gets reminded every 12 hours that this is still ongoing, rather than either going silent forever after the first notification or re-notifying on every evaluation cycle.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Three different scenarios, three different timers firing',
      language: 'bash',
      code: `# The main page's own exact values:
# route:
#   group_wait: 30s
#   group_interval: 5m
#   repeat_interval: 12h

# SCENARIO 1 -- brand new alerts, batching (group_wait)
# T+0:00  HighErrorRate starts firing on instance-1
# T+0:05  HighErrorRate ALSO starts firing on instance-2
#         (same alertname+job -- same group, per group_by)
# T+0:30  group_wait elapses -- ONE notification sent, covering
#         BOTH instances together, not two separate pages

# SCENARIO 2 -- a new alert joins an ALREADY-notified group
#         (group_interval)
# T+0:30  First notification already sent (from scenario 1)
# T+2:00  HighErrorRate ALSO starts firing on instance-3
# T+5:30  group_interval (5m after the last notification) elapses
#         -- an UPDATED notification is sent, now covering all 3
#         instances. Not instant -- there's a 5-minute batching
#         window even for a genuinely new addition to the group.

# SCENARIO 3 -- nothing has changed, alert just keeps firing
#         (repeat_interval)
# T+5:30  Group still firing, unchanged, since the last notification
# T+17:30 12 hours (repeat_interval) later -- a REMINDER notification
#         fires, purely because the alert is STILL ongoing, even
#         though nothing about it has actually changed since T+5:30`,
    },
    {
      label: 'Why these are genuinely independent, not redundant, settings',
      language: 'bash',
      code: `# Per AlertManager's own docs, repeat_interval's own definition
# includes an explicit exception: "Notifications are not repeated
# if any new alerts have fired or any firing alerts have resolved
# since the last group_interval."
#
# This is the key connection between all three settings: repeat_interval
# is specifically the FALLBACK reminder timer for the "nothing new
# happened" case -- the moment ANYTHING changes in the group (a new
# alert joins, or one resolves), that change is handled by
# group_interval instead, and the repeat_interval clock effectively
# resets.

# Changing ONLY repeat_interval to something short (say, 5m instead
# of 12h) would NOT make new alerts notify faster -- that's
# group_wait's and group_interval's job. It would only make the
# "still ongoing, nothing new" reminder fire more often -- useful
# for a page-worthy P1 you want to keep surfacing, potentially
# noisy for a lower-priority warning-level alert.

# Changing ONLY group_wait to something longer (say, 5m instead of
# 30s) would NOT change how often ongoing-unchanged alerts remind
# you -- that's still governed by repeat_interval. It would only
# widen the initial batching window before the FIRST notification
# for a brand new group goes out.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An on-call engineer complains that after the FIRST page for a firing alert, they get no further updates for hours even as more instances of the same underlying problem start failing one by one — but they also get an unwanted "still firing" reminder every 12 hours even when nothing has changed. They propose reducing `repeat_interval` to fix the first problem. Using this subtopic\'s theory, explain whether this fixes their actual complaint.',
    hint: 'Per this subtopic\'s theory, does a NEW alert joining an already-notified group get surfaced via repeat_interval, or via a different setting entirely?',
    solution: 'Reducing `repeat_interval` would not fix the engineer\'s first complaint (no updates as new instances fail) — per this subtopic\'s theory, a new alert joining an already-notified group is specifically governed by `group_interval`, not `repeat_interval`; AlertManager\'s own docs describe `repeat_interval` as only re-sending "the last notification" when nothing new has happened, explicitly NOT firing when new alerts have joined the group (that case is handled separately). The engineer\'s actual problem — new instances failing without triggering an updated notification — points at `group_interval` being set too long (the main page\'s own value is 5 minutes, but if it were much longer, new instances could pile up for a long time before the next update fires). Reducing `repeat_interval` would only address the SECOND, unrelated complaint (unwanted reminders for an unchanged, still-firing alert) — it happens to be the setting the engineer already dislikes for being too frequent, not too infrequent, so tuning it down would actually make that second complaint worse, not better, while doing nothing for the first complaint at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'group_wait, group_interval, and repeat_interval are three ways of expressing the same idea (how often AlertManager sends notifications), and adjusting any one of them has roughly the same effect.',
      reality: 'Per this subtopic\'s theory, AlertManager\'s own docs define each as governing a genuinely distinct moment in an alert group\'s lifecycle — the FIRST notification for a new group (group_wait), an UPDATE when new alerts join an already-notified group (group_interval), and a REMINDER when nothing has changed at all (repeat_interval). They don\'t substitute for each other.'
    },
    {
      thought: 'If new alerts join an already-firing, already-notified group, AlertManager waits until the next repeat_interval to mention them.',
      reality: 'This subtopic\'s exercise shows this is incorrect — per AlertManager\'s own docs, repeat_interval explicitly does NOT fire when new alerts have joined the group; that case is handled by group_interval instead, which is typically a much shorter window (the main page\'s own value is 5 minutes vs. repeat_interval\'s 12 hours).'
    },
    {
      thought: 'A shorter repeat_interval makes AlertManager generally more responsive across the board — faster initial notifications, faster updates on new alerts, and more frequent reminders.',
      reality: 'Per this subtopic\'s theory, repeat_interval only controls the reminder cadence for an unchanged, still-firing alert — it has no effect on how quickly the FIRST notification goes out (group_wait\'s job) or how quickly new alerts joining the group get surfaced (group_interval\'s job).'
    }
  ];
}
