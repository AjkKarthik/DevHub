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
  templateUrl: './ilm-min-age-counts-from-rollover-not-creation.html',
  styleUrl: './ilm-min-age-counts-from-rollover-not-creation.scss'
})
export class IlmMinAgeCountsFromRolloverNotCreationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own ILM policy sets min_age values with no explanation of what "age" is actually measured from',
      points: [
        'The main page\'s own Elasticsearch ILM Policy code tab defines: hot phase with `rollover: max_age 1d, max_size 50gb`, warm at `min_age: 7d`, cold at `min_age: 30d`, delete at `min_age: 90d`. The natural, plausible reading is that these ages count from when each index was originally CREATED — "7 days old" reads like a straightforward age-since-birth measurement.',
        'Elastic\'s own documentation states the actual rule directly: "If an index has been rolled over, then the min_age value is relative to the time the index was rolled over, not the index creation time." Since the main page\'s own policy uses a `rollover` action in the hot phase, every later phase\'s `min_age` is counting from the ROLLOVER moment, not the index\'s original creation timestamp.',
      ]
    },
    {
      heading: 'Why this distinction changes the ACTUAL total retention time versus what the numbers alone suggest',
      points: [
        'The main page\'s own hot-phase rollover condition is `max_age: 1d` OR `max_size: 50gb` — whichever comes first. For a lower-traffic service that never hits 50GB in a day, the index rolls over close to the 1-day mark; the index existed for roughly 1 day BEFORE the warm phase\'s own 7-day clock even starts counting. For a high-traffic service that hits 50GB in, say, 2 hours, the index rolls over almost immediately — the warm phase\'s 7-day clock starts counting almost right after creation.',
        'This means two indices from two different services, both configured with the exact SAME ILM policy and the exact same `min_age: 7d` for warm, can spend genuinely different amounts of TOTAL time (from original creation to reaching warm) — 1 day + 7 days ≈ 8 days for the low-traffic service\'s index vs. roughly 7 days for the high-traffic one\'s. The policy\'s numbers alone don\'t predict this; it depends on how quickly each specific index actually rolls over.',
        'The practical, common mistake this enables: a team calculating "when will my logs actually be deleted" by simply adding the `min_age` values together (7d + 30d... wait, these aren\'t even additive in the naive sense either) from the ORIGINAL creation date gets a subtly wrong answer — the correct calculation has to start from the ROLLOVER date specifically, and the rollover date itself varies index-by-index based on actual traffic volume, not a fixed schedule.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two indices, identical policy, genuinely different total ages at each phase',
      language: 'bash',
      code: `# The main page's own exact ILM policy:
# PUT _ilm/policy/logs-policy
# {
#   "policy": {
#     "phases": {
#       "hot":    { "actions": { "rollover": { "max_age": "1d", "max_size": "50gb" } } },
#       "warm":   { "min_age": "7d",  "actions": { ... } },
#       "cold":   { "min_age": "30d", "actions": { "freeze": {} } },
#       "delete": { "min_age": "90d", "actions": { "delete": {} } }
#     }
#   }
# }

# Service A -- low traffic, never hits 50GB in a day:
#   Created:        Day 0
#   Rolls over:      Day 1  (hit max_age: 1d first)
#   Per Elastic's own docs, min_age now counts from Day 1:
#   Reaches warm:   Day 1 + 7  = Day 8
#   Reaches cold:   Day 1 + 30 = Day 31
#   Deleted:        Day 1 + 90 = Day 91
#   TOTAL index lifetime from creation: 91 days

# Service B -- high traffic, hits 50GB in ~2 hours:
#   Created:        Day 0, 00:00
#   Rolls over:      Day 0, ~02:00  (hit max_size: 50gb first)
#   Reaches warm:   ~Day 7 (02:00 + 7d)
#   Reaches cold:   ~Day 30
#   Deleted:        ~Day 90
#   TOTAL index lifetime from creation: ~90 days

# Same policy, same min_age NUMBERS -- genuinely different total
# retention windows, purely because rollover timing differs.`,
    },
    {
      label: 'The wrong way and the right way to calculate "when do my logs actually get deleted"',
      language: 'bash',
      code: `# WRONG -- assuming min_age counts from original index creation:
# "delete min_age is 90d, so logs get deleted 90 days after they
#  were first written" -- treats Day 0 (creation) as the anchor
#  for ALL phase transitions, including delete.

# RIGHT -- per Elastic's own docs ("min_age value is relative to
# the time the index was rolled over, not the index creation
# time"), the anchor for warm/cold/delete is the ROLLOVER date:
#
# 1. Find out when THIS SPECIFIC index actually rolled over
#    (GET the index's own rollover_info, or check ILM explain API:
#    GET logs-2025.01.15/_ilm/explain)
# 2. Add 90 days to THAT date, not the original creation date

# GET logs-2025.01.15-000003/_ilm/explain
# {
#   "indices": {
#     "logs-2025.01.15-000003": {
#       "phase": "hot",
#       "age": "18h",              # <-- age since ROLLOVER,
#                                   #     already reflects the
#                                   #     documented behavior
#       "phase_time": "2025-01-15T14:00:00.000Z"
#     }
#   }
# }
# The "age" field ILM itself reports is already rollover-relative
# -- checking this directly is more reliable than manually
# calculating from an assumed creation timestamp.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A compliance team asks "exactly which date will logs written on 2025-01-15 be permanently deleted?", expecting a precise answer based on the main page\'s own ILM policy (`delete: min_age: 90d`). An engineer answers "2025-04-15" (90 days after the write date) without checking anything else. Using this subtopic\'s theory, explain why this answer could be wrong, and what to check instead.',
    hint: 'Per this subtopic\'s theory, does min_age in a rollover-based ILM policy count from when a LOG LINE was written, or from when its INDEX rolled over — and are those necessarily the same date?',
    solution: 'The engineer\'s answer could be wrong because, per this subtopic\'s theory, `min_age: 90d` for the delete phase counts from when the specific INDEX containing that log line rolled over, not from the date the log line was originally written — per Elastic\'s own docs, "min_age value is relative to the time the index was rolled over, not the index creation time." A log written on 2025-01-15 lives inside an index that started accepting writes around that date but may not roll over until it hits the policy\'s `max_age: 1d` or `max_size: 50gb` threshold, sometime after that log line was actually written — the 90-day delete clock only starts once THAT rollover happens, not the moment the log was ingested. The correct approach is checking the specific index\'s own ILM state directly — via `GET <index>/_ilm/explain`, which reports the index\'s current phase and its rollover-relative age directly — rather than manually calculating 90 days forward from the log\'s own write date, which silently assumes rollover and creation happened at the same instant.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An ILM policy\'s min_age values count from when an index was originally created — "min_age: 7d" for the warm phase means 7 days after the index first came into existence.',
      reality: 'Per this subtopic\'s theory, Elastic\'s own docs state the opposite for any policy using rollover: "min_age value is relative to the time the index was rolled over, not the index creation time." The clock for warm/cold/delete phases starts at rollover, not at the index\'s original creation moment.'
    },
    {
      thought: 'Since the main page\'s own ILM policy uses fixed min_age numbers (7d, 30d, 90d), every index following that policy reaches each phase at the same total age from creation, regardless of traffic volume.',
      reality: 'This subtopic\'s first code example shows this isn\'t true — because rollover timing itself varies based on which threshold (max_age or max_size) is hit first, two indices under the identical policy can have genuinely different TOTAL ages (from original creation) when they reach the same phase, since the min_age clock starts at each index\'s own, different rollover moment.'
    },
    {
      thought: 'To find out exactly when a specific index will move to the next ILM phase, the reliable approach is manually calculating forward from the index\'s known creation date using the policy\'s min_age values.',
      reality: 'Per this subtopic\'s exercise, this calculation silently assumes rollover and creation happened simultaneously, which usually isn\'t true. The reliable approach is querying the index\'s own current ILM state directly via the `_ilm/explain` API, which reports rollover-relative age directly rather than requiring a manual, assumption-laden calculation.'
    }
  ];
}
