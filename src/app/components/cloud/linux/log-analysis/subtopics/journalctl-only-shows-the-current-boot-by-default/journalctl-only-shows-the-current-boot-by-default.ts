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
  templateUrl: './journalctl-only-shows-the-current-boot-by-default.html',
  styleUrl: './journalctl-only-shows-the-current-boot-by-default.scss'
})
export class JournalctlOnlyShowsTheCurrentBootByDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents plain journalctl -u as if it searches the full log history',
      points: [
        'The main page\'s own QnA answer states: "journalctl -u servicename shows all journal entries for that unit." The word "all" is doing a lot of unstated work here — nothing on the page mentions that this is scoped to the CURRENT boot by default, not the full retained journal history.',
      ]
    },
    {
      heading: 'journalctl\'s actual default scope: the current boot only',
      points: [
        'By default, plain <code>journalctl</code> (with or without <code>-u servicename</code>) shows entries starting from the CURRENT boot — not the full history retained on disk. If the systemd journal is configured to persist across reboots (common, but not universal — depends on <code>/var/log/journal/</code> existing and being writable), entries from PRIOR boots genuinely exist in the journal and are fully queryable, but a plain <code>journalctl -u myapp</code> silently excludes all of them by default.',
        'This produces no error, no warning, no truncation notice — a search that returns zero or very few matches simply LOOKS like "this error never happened" or "this service has always behaved fine," when the real explanation is that the search never looked past the most recent boot at all.',
      ]
    },
    {
      heading: 'How to actually search across boots, and how to know what\'s available',
      points: [
        '<code>journalctl --list-boots</code> lists every boot the journal has retained data for, each with an index (0 = current, -1 = previous, -2 = two boots ago, etc.) and its start/end timestamps — the first thing worth checking before concluding an issue "never happened," since it directly shows how much history is actually available to search.',
        '<code>journalctl -b -1 -u myapp</code> searches specifically within the previous boot\'s logs; <code>journalctl -b all -u myapp</code> (or the main page\'s own suggested <code>--since</code>/<code>--until</code> time-range filters) searches across EVERY retained boot at once, regardless of when the machine was last restarted.',
        'This matters most for exactly the kind of investigation the main page\'s own interviewFocus and QnA sections are built around: "did this error happen before" or "how long has this service been failing" — questions a plain, unscoped <code>journalctl -u myapp | grep ERROR</code> can silently and confidently answer WRONG if the machine has rebooted since the period actually being investigated.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the silent miss across a reboot',
      language: 'bash',
      code: `# A service crashed repeatedly last week, BEFORE a routine
# server reboot that happened since then. Following the main
# page's own recommended pattern to check for it:
journalctl -u myapp | grep -i "crash\\|panic\\|fatal"
# (no output at all)

# This LOOKS like confirmation the crash never happened -- but
# check what's actually being searched first:
journalctl --list-boots
#  -2 a1b2c3d4... Mon 2026-07-14 09:00:00 UTC—Sun 2026-07-20 23:59:00 UTC
#  -1 e5f6a7b8... Mon 2026-07-21 00:05:00 UTC—Wed 2026-07-23 08:00:00 UTC
#   0 c9d0e1f2... Wed 2026-07-23 08:05:00 UTC—Thu 2026-07-24 10:00:00 UTC
# -- THREE separate boots retained, but plain "journalctl -u myapp"
#    only searched boot 0 (the current one) -- the crash, which
#    happened during boot -2 or -1, was never looked at at all.`,
    },
    {
      label: 'The fix: search explicitly across boots',
      language: 'bash',
      code: `# Search a SPECIFIC prior boot directly:
journalctl -b -1 -u myapp | grep -i "crash\\|panic\\|fatal"

# Search EVERY retained boot at once -- the reliable way to answer
# "has this ever happened" rather than "has this happened since
# the last reboot":
journalctl -b all -u myapp | grep -i "crash\\|panic\\|fatal"
# myapp[4821]: FATAL: unhandled exception, restarting
# -- found it, in boot -2's logs -- exactly what the first,
#    unscoped search silently missed

# Equally reliable alternative using an explicit time range
# spanning the actual incident window (the main page's own
# --since/--until pattern, just applied deliberately across
# what would otherwise be a boot boundary):
journalctl -u myapp --since "2026-07-14" --until "2026-07-21"

# Always confirm retention BEFORE concluding an absence of
# evidence means an absence of the actual event:
journalctl --disk-usage
# Archived and active journals take up 1.2G in the file system.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An on-call engineer is asked to confirm whether a specific service crashed at any point during a 3-day period last week. The server has been rebooted twice since then for routine patching. The engineer runs `journalctl -u myapp --since "last week" | grep -i crash` (following the main page\'s own suggested --since pattern) and finds nothing, reporting "confirmed, no crashes occurred." Why might this conclusion be wrong, and what would you check first to be sure?',
    hint: 'journalctl\'s --since/--until filters narrow a search WITHIN whatever it\'s already searching by default — think about what journalctl searches by default before any --since filter is applied, and whether a reboot changes that.',
    solution: 'Even with a `--since` time filter applied, plain `journalctl -u myapp` still defaults to searching only the CURRENT boot\'s journal — the `--since "last week"` filter narrows the time range within that search, but if the server has been rebooted twice since "last week," the entries from that period may live entirely within a PRIOR boot\'s journal, which the current-boot-scoped search never touches at all, regardless of the time filter applied on top of it. The conclusion "confirmed, no crashes occurred" is unreliable here — it should instead read "no crashes found within the current boot\'s journal for that period," a meaningfully weaker claim. The check to run first: `journalctl --list-boots` to see which boot(s) actually cover the period in question, then either `journalctl -b -N -u myapp --since "last week"` targeting the specific prior boot, or `journalctl -b all -u myapp --since "last week"` to search across every retained boot at once — only that broader search can actually support the "no crashes occurred" conclusion.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'journalctl -u servicename searches the full retained journal history by default, the same way grepping a traditional log file searches everything in it.',
      reality: 'Per this subtopic\'s theory, plain journalctl (with or without -u) defaults to showing only the CURRENT boot\'s entries — prior boots\' data can be fully present and queryable in the journal, but is silently excluded unless -b all or a specific -b index is used.'
    },
    {
      thought: 'Adding a --since/--until time filter to a journalctl search is enough to reliably search any historical period, regardless of reboots since then.',
      reality: 'Per this subtopic\'s theory, a --since filter only narrows the time range WITHIN whatever journalctl is already scoped to search — if the target period falls within a prior boot\'s journal and no -b flag is used, the current-boot-only default still silently excludes it, filter or not.'
    },
    {
      thought: 'If a journalctl search for a specific error returns no results, that reliably confirms the error never occurred.',
      reality: 'Per this subtopic\'s theory, an empty result from an unscoped journalctl search only confirms the error didn\'t appear in the CURRENT boot\'s journal — journalctl --list-boots should be checked first to see whether the actual period in question falls within a different, unsearched boot.'
    }
  ];
}
