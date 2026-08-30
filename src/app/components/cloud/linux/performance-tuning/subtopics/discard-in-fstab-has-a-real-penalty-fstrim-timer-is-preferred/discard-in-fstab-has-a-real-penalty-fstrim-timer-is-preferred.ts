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
  templateUrl: './discard-in-fstab-has-a-real-penalty-fstrim-timer-is-preferred.html',
  styleUrl: './discard-in-fstab-has-a-real-penalty-fstrim-timer-is-preferred.scss'
})
export class DiscardInFstabHasARealPenaltyFstrimTimerIsPreferredSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents discard as the primary way to enable TRIM, with fstrim mentioned only as a "manual" alternative',
      points: [
        'The main page\'s own theory states: "discard option in fstab enables TRIM for SSDs (ext4, xfs). fstrim -v manually runs TRIM." The phrasing frames <code>discard</code> as the standard, always-on approach and <code>fstrim</code> as a secondary, manual fallback — this is actually closer to the opposite of current distro guidance.',
      ]
    },
    {
      heading: 'Why continuous discard has a real, documented performance cost',
      points: [
        'The <code>discard</code> mount option triggers a TRIM command SYNCHRONOUSLY, immediately, every single time a block is freed (a file deleted, overwritten, or truncated) — not batched, not deferred, happening inline with the operation that freed the block.',
        'This has a measurable performance penalty specifically on operations like <code>fsync()</code> — multiple major distributions (documented in their own official guidance) explicitly discourage the continuous <code>discard</code> option for exactly this reason, even on SSDs that support queued/asynchronous discard, since the synchronous nature of the mount-option-triggered TRIM still adds latency to the exact operations most sensitive to it.',
      ]
    },
    {
      heading: 'The actually-recommended default: fstrim.timer, batched and scheduled',
      points: [
        'Most modern distributions ship (and enable by default) a systemd timer, <code>fstrim.timer</code>, that runs <code>fstrim</code> automatically on a periodic schedule (weekly, by default) — this BATCHES all the TRIM work for every block freed since the last run into one operation, scheduled for a moment (per systemd\'s own timer randomization) chosen to minimize impact, rather than paying a small latency cost on every single delete throughout the entire week.',
        'The practical guidance, matching what most distro documentation itself states directly: use <code>fstrim.timer</code> (verify it\'s enabled with <code>systemctl status fstrim.timer</code>) as the default for general-purpose systems, and reserve continuous <code>discard</code> for the narrower case of a specific, already-identified workload that benefits from immediate reclamation AND where the fsync-latency tradeoff has actually been tested and found acceptable — not as the default, "just add discard to fstab" approach the main page\'s own phrasing implies.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own pattern, and its real cost',
      language: 'bash',
      code: `# The main page's own example -- presented as the standard way
# to enable TRIM:
# /etc/fstab:
#   UUID=xxx /data ext4 defaults,discard 0 2

# What this actually does: EVERY delete/overwrite/truncate on this
# filesystem now triggers a SYNCHRONOUS TRIM command inline, before
# the freeing operation itself completes -- not batched, not
# deferred, every single time.

# The documented cost: a measurable latency penalty specifically
# on fsync()-heavy workloads (databases, anything doing frequent
# small writes with durability guarantees) -- multiple major
# distributions' own documentation explicitly discourages this
# option for exactly this reason, even on SSDs that support
# queued discard.`,
    },
    {
      label: 'The recommended default: fstrim.timer',
      language: 'bash',
      code: `# Check whether the periodic, batched timer is already enabled
# (most modern distros ship this ON by default):
systemctl status fstrim.timer
# ● fstrim.timer - Discard unused blocks once a week
#      Loaded: loaded (/usr/lib/systemd/system/fstrim.timer; enabled)
#      Active: active (waiting)
#     Trigger: Sat 2026-07-25 00:00:00 UTC; 6 days left

# If it's not enabled, turn it on instead of reaching for the
# discard mount option:
sudo systemctl enable --now fstrim.timer

# fstab entry WITHOUT the continuous discard option -- correct
# for the general case, letting the weekly timer batch the work:
# UUID=xxx /data ext4 defaults 0 2

# Run it manually once to confirm it actually reclaims space
# (matches the main page's own fstrim -v command):
sudo fstrim -v /data
# /data: 12.4 GiB (13291028480 bytes) trimmed

# Continuous discard remains a legitimate CHOICE -- just a
# deliberate one for a specific, already-tested workload, not
# the default:
# UUID=xxx /data ext4 defaults,discard 0 2   # only after testing
#                                              the fsync latency
#                                              tradeoff explicitly`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own theory, a team adds the `discard` mount option to their database server\'s fstab entry to "enable TRIM for the SSD," matching the page\'s own stated pattern. Weeks later, a performance review notices a small but consistent increase in write latency, specifically on database commits (which call fsync heavily), that started right around the time this change was deployed. What is the most likely cause, and what change would keep TRIM working while removing this specific cost?',
    hint: 'Think about WHEN the discard mount option actually triggers a TRIM command relative to a delete/overwrite operation — is it deferred and batched, or does it happen synchronously, inline, every single time?',
    solution: 'The most likely cause is the continuous `discard` mount option itself: it triggers a synchronous TRIM command immediately, inline, every time a block is freed — including blocks freed by the database\'s own write-ahead log recycling and other operations tied to fsync-heavy commit paths. This synchronous TRIM adds real, measurable latency to exactly the operations most sensitive to it (fsync calls), which lines up precisely with the observed regression timing. The fix that keeps TRIM working while removing this specific cost is switching from continuous `discard` to the periodic `fstrim.timer` (removing `discard` from the fstab mount options, and confirming `fstrim.timer` is enabled with `systemctl status fstrim.timer`, enabling it if not) — this batches all the TRIM work into one weekly, scheduled operation instead of paying a small latency cost on every single delete throughout the entire time in between, which is the approach most distro documentation itself recommends as the default for exactly this reason.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Adding the discard option to a filesystem\'s fstab entry is the standard, recommended way to enable TRIM on an SSD.',
      reality: 'Per this subtopic\'s theory, most modern distro documentation actually discourages continuous discard as the default, specifically because of its measurable performance penalty on fsync-heavy workloads — the periodic fstrim.timer (enabled by default on most distros) is the actually-recommended approach.'
    },
    {
      thought: 'fstrim is just a manual, occasional alternative to the "real," always-on discard option — something to run only when discard isn\'t configured.',
      reality: 'Per this subtopic\'s theory, fstrim (run automatically and periodically via fstrim.timer) is the PRIMARY recommended mechanism on most modern distributions — continuous discard is the narrower, opt-in alternative for specific, already-tested workloads, not the other way around.'
    },
    {
      thought: 'The discard mount option and periodic fstrim achieve the exact same TRIM behavior, just on a different schedule, with no meaningful performance difference.',
      reality: 'Per this subtopic\'s theory, they differ in a way that has real performance consequences: discard triggers TRIM synchronously and inline with every block-freeing operation, adding latency to fsync-sensitive workloads specifically, while fstrim.timer batches all the work into one periodic, scheduled operation with no per-operation latency cost.'
    }
  ];
}
