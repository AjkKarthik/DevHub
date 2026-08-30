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
  templateUrl: './systemd-targets-map-to-runlevels-but-not-one-to-one.html',
  styleUrl: './systemd-targets-map-to-runlevels-but-not-one-to-one.scss'
})
export class SystemdTargetsMapToRunlevelsButNotOneToOneSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names three targets and stops there',
      points: [
        'The main page\'s own theory states: "Targets replace runlevels: multi-user.target = text mode, graphical.target = desktop, rescue.target = single-user." Three targets, three runlevel-ish labels — but a classic SysV system has SEVEN numbered runlevels (0 through 6, plus S), and the main page never says what happens to the other four.',
        'The Boot Process section adds a fourth mention — "Runlevels (in older SysV init systems) or systemd targets (multi-user.target, graphical.target) define which set of services should be running" — but again only names the same two targets, leaving the reader with no way to answer a very natural follow-up question: what does runlevel 0 or runlevel 6 actually correspond to under systemd?',
      ]
    },
    {
      heading: 'The full mapping — and the genuinely surprising part: it isn\'t one-to-one',
      points: [
        'The complete, standard correspondence: runlevel 0 (halt) → poweroff.target; runlevel 1 (single-user) → rescue.target; runlevel 6 (reboot) → reboot.target; runlevel 5 (graphical) → graphical.target. Each of these legacy runlevelN.target names exists as a real unit file that is, in practice, a symlink to its systemd equivalent — confirmed by systemd\'s own documented behavior that "runlevel3.target is a symbolic link to multi-user.target" and the same pattern holds for runlevel5.target → graphical.target.',
        'The surprising part is runlevels 2, 3, and 4. Under classic SysV init, these were three genuinely DIFFERENT multi-user states (distros historically used them for slightly different purposes — e.g. runlevel 2 without networking on some systems, runlevel 3 as the standard full-multi-user text mode). Under systemd, there is no dedicated target for each — runlevel2.target, runlevel3.target, AND runlevel4.target all point to the exact same unit: multi-user.target. Systemd collapsed three historically distinct numbered states into one target.',
        'This means the mapping isn\'t a clean seven-runlevels-to-seven-targets translation — it\'s seven runlevel NAMES that resolve to only five distinct underlying systemd targets, with 2/3/4 all landing on the identical multi-user.target. A script or habit built around "runlevel 3 vs runlevel 4 behave differently" has no systemd equivalent to preserve that distinction without custom unit work.',
      ]
    },
    {
      heading: 'Why this matters beyond trivia',
      points: [
        'Target dependency ordering explains WHY the main page\'s own three named targets nest the way they do: graphical.target depends on (pulls in) multi-user.target, which itself depends on more basic targets underneath — booting to graphical.target always brings multi-user.target\'s services up first, mirroring the old assumption that a higher runlevel number was a superset of a lower one\'s services.',
        'The practical command surface the main page never mentions: systemctl get-default shows the unit that boot currently targets by default (the modern equivalent of /etc/inittab\'s old default-runlevel line), and systemctl isolate multi-user.target switches to a target live, the modern equivalent of running init 3 — both accept either the target name directly or, for backward compatibility, the legacy runlevelN.target alias.',
        'Legacy scripts or muscle-memory habits that still type init 3 or telinit 5 generally keep working on a systemd system precisely BECAUSE of this symlink-based backward-compatibility layer — but the moment someone tries to distinguish behavior between runlevel 2, 3, and 4 specifically, that distinction has been architecturally erased under systemd, since all three now resolve to the one identical target.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The full runlevel-to-target mapping the main page only partially gives',
      language: 'bash',
      code: `# Main page's own theory names only two targets explicitly:
#   multi-user.target = text mode
#   graphical.target  = desktop
#   rescue.target     = single-user
#
# The COMPLETE standard mapping:
#
#   Runlevel 0  (halt)          -> poweroff.target
#   Runlevel 1  (single-user)   -> rescue.target
#   Runlevel 2  (multi-user)    -> multi-user.target
#   Runlevel 3  (multi-user)    -> multi-user.target   <- SAME target as 2 and 4
#   Runlevel 4  (multi-user)    -> multi-user.target   <- SAME target as 2 and 3
#   Runlevel 5  (graphical)     -> graphical.target
#   Runlevel 6  (reboot)        -> reboot.target
#   Runlevel S  (single-user)   -> rescue.target (roughly)

# Confirm the symlink relationship directly on any systemd system:
ls -l /usr/lib/systemd/system/runlevel3.target
# runlevel3.target -> multi-user.target   (a real symlink, not just
# a documentation convention)

ls -l /usr/lib/systemd/system/runlevel5.target
# runlevel5.target -> graphical.target

# Runlevels 2, 3, and 4 -- three historically distinct SysV states --
# ALL resolve to the identical multi-user.target under systemd:
ls -l /usr/lib/systemd/system/runlevel2.target \\
      /usr/lib/systemd/system/runlevel4.target
# Both also -> multi-user.target`,
    },
    {
      label: 'The modern command surface: get-default and isolate',
      language: 'bash',
      code: `# Modern equivalent of reading /etc/inittab's old
# "id:5:initdefault:" line:
systemctl get-default
# => graphical.target   (or multi-user.target on a headless server)

# Modern equivalent of "init 3" (switch to text-mode multi-user):
systemctl isolate multi-user.target
# Legacy alias also still works, resolving through the symlink:
systemctl isolate runlevel3.target
# -- both commands end up isolating the SAME target.

# Modern equivalent of "init 5" (switch to graphical):
systemctl isolate graphical.target

# Setting the PERMANENT default (survives reboot) -- the systemd
# equivalent of editing /etc/inittab's initdefault line:
systemctl set-default multi-user.target
# For a headless server that should never try to start a display
# manager, this is the actual persistent fix -- not just a one-time
# "isolate" for the current boot.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An old internal runbook, written for a pre-systemd server, instructs an operator to run "init 4" for a specific maintenance mode that\'s supposed to behave differently from the server\'s normal "init 3" state. On the now-systemd server, they run the systemd-era equivalent (systemctl isolate runlevel4.target) expecting some distinct maintenance behavior, but the server behaves EXACTLY the same as its normal state. Why?',
    hint: 'Check what real unit file runlevel4.target actually symlinks to under systemd, and whether it\'s a distinct target from runlevel3.target or the same one.',
    solution: 'The runbook\'s assumption that runlevel 3 and runlevel 4 are distinct, meaningfully different states doesn\'t survive the move to systemd. Both runlevel3.target and runlevel4.target are symlinks to the exact same unit, multi-user.target — systemd collapsed the three historically-distinct SysV multi-user runlevels (2, 3, and 4) into a single target. Running systemctl isolate runlevel4.target is therefore functionally identical to systemctl isolate runlevel3.target (or just multi-user.target directly) — there is no architectural distinction left for systemd to honor, regardless of what runlevel 4 used to mean on the original pre-systemd system. If the runbook\'s "maintenance mode" genuinely needs to behave differently, that behavior has to be built as its own custom systemd target (or achieved some other way, e.g. a dedicated systemd service or a maintenance flag file), not by relying on a runlevel number systemd no longer treats as distinct.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'systemd has seven distinct targets, one for each classic SysV runlevel (0 through 6), preserving a clean one-to-one mapping.',
      reality: 'Per this subtopic\'s theory, runlevels 2, 3, and 4 all resolve to the exact same unit, multi-user.target — there is no dedicated systemd target distinguishing them from each other, even though they were three separate states under classic SysV init.'
    },
    {
      thought: 'The runlevelN.target names (runlevel3.target, runlevel5.target, etc.) are just documentation shorthand — the actual system only understands the real target names like multi-user.target.',
      reality: 'Per this subtopic\'s theory, the runlevelN.target names are REAL unit files installed on the system, implemented as symlinks to their systemd equivalents — confirmed directly via ls -l on a real system — which is exactly what makes legacy commands like init 3 or systemctl isolate runlevel3.target continue to work.'
    },
    {
      thought: 'Running systemctl isolate to switch targets also changes the PERMANENT default target the system boots into next time.',
      reality: 'Per this subtopic\'s theory, systemctl isolate only changes the CURRENT running state — the permanent, reboot-persistent default is a separate setting controlled by systemctl set-default, the modern equivalent of editing /etc/inittab\'s old initdefault line.'
    }
  ];
}
