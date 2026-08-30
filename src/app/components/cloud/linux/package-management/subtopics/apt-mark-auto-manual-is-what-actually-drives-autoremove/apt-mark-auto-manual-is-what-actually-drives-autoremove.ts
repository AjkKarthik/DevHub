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
  templateUrl: './apt-mark-auto-manual-is-what-actually-drives-autoremove.html',
  styleUrl: './apt-mark-auto-manual-is-what-actually-drives-autoremove.scss'
})
export class AptMarkAutoManualIsWhatActuallyDrivesAutoremoveSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions autoremove twice, but never explains the mechanism it relies on',
      points: [
        'The main page\'s own code tab includes <code>sudo apt autoremove</code> with the comment "remove unused dependencies," and its quiz answer states autoremove "removes packages that were installed as dependencies but are no longer needed." Both are accurate, but neither explains HOW apt decides a package counts as "installed as a dependency" in the first place — a distinction that is not automatic or inferred at removal time, but a flag apt tracks continuously from the moment each package was installed.',
      ]
    },
    {
      heading: 'Every installed package is tagged either "automatic" or "manual"',
      points: [
        'When you explicitly run <code>apt install X</code>, apt marks X as MANUALLY installed. If X depends on Y and Y isn\'t already present, apt installs Y too, but marks Y as AUTOMATICALLY installed — a dependency pulled in to satisfy something else, not something you asked for directly.',
        'This automatic/manual distinction is tracked explicitly, on an ongoing basis, in <code>/var/lib/apt/extended_states</code> — it is real, persistent state apt maintains for every package, not something inferred or recalculated only when autoremove runs.',
        '<code>apt autoremove</code>\'s actual rule: remove any package marked AUTOMATIC that no longer has ANY manually-installed package depending on it. A package marked MANUAL is never touched by autoremove, regardless of whether anything currently depends on it.',
      ]
    },
    {
      heading: 'The real-world trap: coming to rely on a dependency directly, without ever marking it manual',
      points: [
        'Suppose <code>apt install X</code> pulls in <code>Y</code> as an automatic dependency. Over time, a script or workflow starts calling <code>Y</code> directly, entirely independent of <code>X</code> — but <code>Y</code>\'s flag in extended_states never changed; it is still recorded as AUTOMATIC, because that flag only reflects how the package was ORIGINALLY installed, not how it is currently being used.',
        'Later, <code>X</code> is removed (no longer needed) — and the very next <code>apt autoremove</code> silently removes <code>Y</code> too, since nothing manually-installed depends on it anymore. Whatever now depends on <code>Y</code> directly (the script from the earlier example) breaks, often with a confusing "command not found" that has nothing obviously to do with the unrelated <code>X</code> removal days or weeks earlier.',
        'The fix is proactive, not reactive: run <code>sudo apt-mark manual Y</code> the moment you start depending on a package directly, regardless of how it originally got installed — this permanently protects it from autoremove regardless of what else is later removed. <code>apt-mark showauto</code> and <code>apt-mark showmanual</code> let you audit the current flag on every installed package before running autoremove on an unfamiliar or long-lived system, and <code>apt autoremove --dry-run</code> (or the plain <code>apt-get autoremove -s</code> simulate flag) shows exactly what WOULD be removed without actually removing anything — worth running as routine due diligence before autoremove on any system you didn\'t provision yourself.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the trap — a dependency silently removed',
      language: 'bash',
      code: `# Install X, which pulls in Y as a dependency
sudo apt install -y some-app        # depends on: libhelper-utils

# Check the flag apt recorded for the dependency:
apt-mark showauto | grep libhelper-utils
# libhelper-utils                   <-- marked AUTOMATIC

# Time passes. A deploy script starts calling libhelper-utils
# directly, with no further reference to some-app at all --
# but its flag in /var/lib/apt/extended_states never changes.

# some-app is eventually removed as no longer needed:
sudo apt remove -y some-app

# The next routine cleanup:
sudo apt autoremove -y
# Removing libhelper-utils ...      <-- silently removed too, since
#                                        nothing MANUAL depends on it
#                                        anymore -- regardless of
#                                        the deploy script relying
#                                        on it directly

# The deploy script now fails with a confusing error that has
# no obvious connection to removing some-app days earlier:
./deploy.sh
# ./deploy.sh: line 12: libhelper-utils: command not found`,
    },
    {
      label: 'The fix: mark it manual before it becomes a dependency-only ghost',
      language: 'bash',
      code: `# As soon as you start depending on a package directly, mark it:
sudo apt-mark manual libhelper-utils

# Confirm the flag changed:
apt-mark showmanual | grep libhelper-utils
# libhelper-utils                   <-- now MANUAL, protected

# Now removing some-app and running autoremove leaves it alone:
sudo apt remove -y some-app
sudo apt autoremove -y
# libhelper-utils is untouched -- correctly, since it's marked
# manual regardless of what else gets removed around it.

# Best practice before running autoremove on any unfamiliar or
# long-lived system: simulate first, review the list, THEN commit
sudo apt-get autoremove -s          # -s = simulate, nothing removed
sudo apt autoremove --dry-run       # equivalent, newer apt syntax

# Full audit of every package's current flag:
apt-mark showauto                   # everything considered a dependency
apt-mark showmanual                 # everything explicitly requested`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team removes an old monitoring agent (`apt remove -y old-monitoring-agent`) that was installed months ago, followed by a routine `apt autoremove -y`. The next day, a completely unrelated backup script fails with `rsync: command not found`. Investigation shows rsync had been installed automatically as a dependency of old-monitoring-agent long ago, and the backup script had been quietly relying on that same rsync installation ever since. Why did autoremove remove rsync, and what single command, run BEFORE this incident, would have prevented it?',
    hint: 'Check whether apt tracks a package\'s current USE (what depends on it today) or its ORIGINAL installation reason (how it first got installed) — and think about when that flag would have needed to change to reflect the backup script\'s reliance on rsync.',
    solution: 'apt tracks each package\'s automatic/manual flag based on how it was ORIGINALLY installed, not how it is currently being used — rsync was installed as a dependency of old-monitoring-agent, so it was flagged AUTOMATIC in `/var/lib/apt/extended_states`, and that flag never changed just because the backup script later started relying on rsync directly. Once old-monitoring-agent was removed, rsync had no manually-installed package depending on it anymore, so `apt autoremove` correctly (by its own rules) removed it — the backup script\'s reliance on rsync was invisible to apt, since nothing ever told apt about that dependency. The command that would have prevented this, run at any point BEFORE the removal (ideally as soon as the backup script started depending on rsync directly): `sudo apt-mark manual rsync` — this flags rsync as manually installed regardless of how it originally arrived, permanently protecting it from autoremove no matter what else is later removed around it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'apt autoremove figures out which packages are "unused" by checking what currently depends on them at the moment it runs, based on actual usage.',
      reality: 'Per this subtopic\'s theory, apt tracks a persistent automatic/manual FLAG set at install time (recorded in /var/lib/apt/extended_states), not real-time usage — a package can be actively relied upon by something outside apt\'s dependency graph entirely and still be marked AUTOMATIC, making it eligible for removal.'
    },
    {
      thought: 'If a script or workflow starts using a package that was originally installed as a dependency, apt will notice and treat it as manually needed going forward.',
      reality: 'Per this subtopic\'s theory, apt has no way to observe how a package is actually used after installation — its automatic/manual flag only reflects the ORIGINAL reason it was installed, and stays that way forever unless explicitly changed with apt-mark manual.'
    },
    {
      thought: 'apt autoremove only ever removes packages that are genuinely no longer needed by anything on the system.',
      reality: 'Per this subtopic\'s theory, autoremove only knows about dependencies apt itself is aware of — a package relied on directly by a script, cron job, or manually-run tool outside apt\'s own dependency tracking can be silently removed if it was originally installed as an automatic dependency and its flag was never updated.'
    }
  ];
}
