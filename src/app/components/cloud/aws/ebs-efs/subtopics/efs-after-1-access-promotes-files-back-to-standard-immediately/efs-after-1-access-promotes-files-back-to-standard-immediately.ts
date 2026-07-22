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
  templateUrl: './efs-after-1-access-promotes-files-back-to-standard-immediately.html',
  styleUrl: './efs-after-1-access-promotes-files-back-to-standard-immediately.scss'
})
export class EfsAfter1AccessPromotesFilesBackToStandardImmediatelySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own code uses TransitionToPrimaryStorageClass without ever explaining it',
      points: [
        'The main page\'s own "EFS Setup & Mount" code tab includes a lifecycle configuration with two policies: {"TransitionToIA": "AFTER_30_DAYS"} and {"TransitionToPrimaryStorageClass": "AFTER_1_ACCESS"}. Its own "Amazon EFS" theory bullet mentions "Lifecycle policy automatically moves files not accessed for 7/14/30/60/90 days to IA tier" and "EFS Intelligent-Tiering automates this" — but never explains the SECOND half of what its own code configures: moving files back OUT of IA.',
        'AFTER_1_ACCESS is presented as just another lifecycle setting alongside the age-based transitions, with no discussion of what triggers it or what it actually costs to leave enabled.',
      ]
    },
    {
      heading: 'AFTER_1_ACCESS moves a file back to Standard the moment it\'s read even once — and it\'s the only value that setting accepts',
      points: [
        'Per AWS\'s own API documentation, TransitionToPrimaryStorageClass controls "whether to move files back to primary (Standard) storage after they are accessed in IA or Archive storage" — and AFTER_1_ACCESS is the ONLY valid value for this field. There is no "after N accesses" or "after sustained access" option; a single read event promotes the file immediately.',
        'This mirrors the same access-event definition AWS uses for the age-based transitions: "metadata operations such as listing the contents of a directory don\'t count as file access events" — so browsing a directory that CONTAINS an IA-tier file does not trigger the promotion; only actually reading that specific file\'s contents does.',
        'The setting is opt-in — if TransitionToPrimaryStorageClass is omitted from the lifecycle configuration entirely (unlike the main page\'s own example, which explicitly includes it), a file that transitions to IA stays in IA indefinitely regardless of how many times it\'s subsequently read, until age-based transition rules or manual action move it.',
        'This creates a real, easy-to-miss cost pattern for files accessed periodically but not FREQUENTLY: a file accessed once a month, with TransitionToIA: AFTER_30_DAYS and TransitionToPrimaryStorageClass: AFTER_1_ACCESS both enabled (matching the main page\'s own example exactly), gets promoted back to Standard on that single monthly read, then sits in Standard for the NEXT 30 days of inactivity before transitioning back to IA again — meaning the file effectively never actually benefits from IA pricing at all, since it\'s promoted out again almost as soon as it arrives, well before the storage-cost savings from a full IA billing cycle have accrued.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the main page\'s own lifecycle config, then reading an IA file',
      language: 'bash',
      code: `# The main page's own exact lifecycle policy
aws efs put-lifecycle-configuration \\
  --file-system-id fs-0abc12345 \\
  --lifecycle-policies '[
    {"TransitionToIA": "AFTER_30_DAYS"},
    {"TransitionToPrimaryStorageClass": "AFTER_1_ACCESS"}
  ]'

# ...30+ days of inactivity later, confirm a file transitioned:
aws efs describe-file-systems --file-system-id fs-0abc12345 \\
  --query 'FileSystems[0].SizeInBytes.ValueInIA'
# 4831838208   <- non-zero -- some data is now sitting in IA tier.

# A monthly batch job reads one report file that had transitioned:
cat /mnt/efs/reports/monthly-summary.csv > /dev/null

# Check again shortly after -- per AWS's own documented behavior,
# a SINGLE read is enough to trigger the promotion:
aws efs describe-file-systems --file-system-id fs-0abc12345 \\
  --query 'FileSystems[0].SizeInBytes.ValueInIA'
# 4826000000ish  <- decreased -- monthly-summary.csv has already
# moved back to Standard storage, after exactly one read.

# Listing the directory that CONTAINS the file does NOT trigger
# this -- per AWS's own documentation, metadata operations don't
# count as access events:
ls -la /mnt/efs/reports/
# (no promotion triggered by this alone)`,
    },
    {
      label: 'The cost-thrashing pattern for periodically-accessed files',
      language: 'bash',
      code: `# A file accessed roughly once a month, forever, under the main
# page's own exact lifecycle config:
#
# Day 0:   file last read -- starts its 30-day idle countdown
# Day 30:  TransitionToIA fires -- file moves to IA tier
# Day 31:  monthly batch job reads the file (one access)
#          -> TransitionToPrimaryStorageClass: AFTER_1_ACCESS fires
#          -> file moves BACK to Standard immediately
# Day 61:  file has now been idle 30 days again (since day 31)
#          -> TransitionToIA fires again -- back to IA
# Day 62:  next month's batch job reads it -- promoted back again
# ... repeating indefinitely ...
#
# Net effect: the file spends almost NO time actually billed at
# genuine IA rates -- it transitions in, then transitions right back
# out a day later, every cycle -- while STILL potentially accruing
# whatever per-request/transition-related costs the lifecycle
# management itself involves. For a file with this exact access
# pattern, this configuration does not save money the way the main
# page's own bullet ("moves files not accessed for 30 days to IA
# tier") implies -- it churns instead.

# The alternative: omit TransitionToPrimaryStorageClass entirely for
# datasets where "revisit once, but otherwise long-idle" access is
# expected and fine to serve at IA-tier latency/cost:
aws efs put-lifecycle-configuration \\
  --file-system-id fs-0abc12345 \\
  --lifecycle-policies '[{"TransitionToIA": "AFTER_30_DAYS"}]'
# -- files stay in IA once transitioned, regardless of subsequent
# reads, avoiding the churn -- appropriate when occasional reads
# don't need to "reset" the file back to Standard-tier pricing.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team enables the main page\'s own exact EFS lifecycle configuration — TransitionToIA after 30 days, TransitionToPrimaryStorageClass after 1 access — expecting their large archive of rarely-touched compliance reports to mostly sit in cheaper IA storage. Reviewing their bill months later, they find IA storage savings are much smaller than expected, even though EFS metrics confirm files ARE regularly transitioning into the IA tier. They discover a monthly compliance script reads every file in the archive once per month for an audit. Using this subtopic\'s theory, explain what\'s happening to their expected savings, and what change would fix it if the monthly read pattern can\'t change.',
    hint: 'TransitionToPrimaryStorageClass: AFTER_1_ACCESS only accepts that one value — what does a SINGLE read do to a file currently in IA, and how does that interact with a recurring monthly read of every file?',
    solution: 'Per this subtopic\'s theory, the monthly compliance script\'s single read of every file is exactly what defeats the expected savings: TransitionToPrimaryStorageClass: AFTER_1_ACCESS means each of those reads immediately promotes the file back to Standard storage the moment it happens, since that setting only accepts a one-access trigger with no threshold for "just this once is fine." Since every file gets read once a month by the audit script, and the transition-to-IA threshold is also 30 days, the files spend most of each cycle oscillating between briefly reaching IA and then being immediately promoted back out again — they never accrue a meaningful stretch of actual IA-tier billing before the next monthly read bounces them back to Standard. This matches exactly what the team observed: files ARE transitioning into IA (confirmed by EFS metrics), but the promotion-back-out is undoing the savings almost as fast as they\'re created. Since the monthly read pattern can\'t change (it\'s a required audit process), the fix per this subtopic\'s theory is to remove TransitionToPrimaryStorageClass from the lifecycle configuration entirely — leaving only TransitionToIA: AFTER_30_DAYS — so files that transition to IA STAY there even after the monthly audit read touches them, genuinely accruing IA-tier savings for the compliance archive\'s actual access pattern, at the cost of the audit script itself now reading slightly-higher-latency IA-tier files once a month instead of Standard-tier ones.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'TransitionToPrimaryStorageClass: AFTER_1_ACCESS means a file needs to be accessed repeatedly, or accessed frequently over some period, before EFS moves it back to Standard storage.',
      reality: 'Per this subtopic\'s theory, AFTER_1_ACCESS is the ONLY valid value for this setting, and it means exactly what it says — a SINGLE read of a file currently in IA or Archive storage triggers its immediate promotion back to Standard, with no accumulation or threshold involved.'
    },
    {
      thought: 'Enabling both TransitionToIA and TransitionToPrimaryStorageClass together, as the main page\'s own example does, is always a safe, generally cost-saving default for any access pattern.',
      reality: 'Per this subtopic\'s exercise, this combination can actively work AGAINST cost savings for files with recurring periodic access (e.g. a monthly job touching every file) — the file oscillates between transitioning into IA and being promoted right back out, rarely accruing genuine IA-tier billing time.'
    },
    {
      thought: 'Listing a directory that contains files sitting in IA storage will trigger those files to be promoted back to Standard, since the directory was "accessed."',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states metadata operations (like listing a directory\'s contents) don\'t count as file access events for lifecycle purposes — only actually reading a specific file\'s own contents triggers its promotion.'
    }
  ];
}
