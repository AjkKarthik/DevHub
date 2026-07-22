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
  templateUrl: './a-sysctl-change-is-runtime-only-until-persisted-to-a-file.html',
  styleUrl: './a-sysctl-change-is-runtime-only-until-persisted-to-a-file.scss'
})
export class ASysctlChangeIsRuntimeOnlyUntilPersistedToAFileSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own quiz explains WHAT /proc/sys/ is, but not how a change made there actually sticks',
      points: [
        'The main page\'s own quiz question states: "/proc/sys/ is a virtual filesystem that exposes kernel parameters. Writing to files here (e.g. via sysctl) changes kernel behaviour at runtime." That explanation is accurate as far as it goes, but the phrase "at runtime" is doing a lot of unstated work — it never says what happens to that change across a reboot.',
        'This is a real, common trap for exactly the audience this page targets — someone who has just learned /proc/sys/ exists and reaches for it (or the sysctl command) to fix a kernel parameter, reasonably assuming a change that clearly took effect immediately is now simply "set."',
      ]
    },
    {
      heading: 'Confirmed: both a direct /proc/sys/ write and sysctl -w are runtime-only, full stop',
      points: [
        'Writing directly to a file under /proc/sys/ (e.g. echo 1 > /proc/sys/net/ipv4/ip_forward) and running the equivalent sysctl -w net.ipv4.ip_forward=1 do the exact same thing under the hood — both modify the live, in-kernel value immediately, and NEITHER one writes anything to any file on persistent disk storage. The change is real and active the instant it\'s made, and just as instantly forgotten the moment the kernel that holds it in memory is replaced by a fresh boot.',
        'The sysctl command\'s own man page structure reflects this split directly: its everyday flags (-w to write a runtime value, or a bare NAME=value assignment) only ever touch the live kernel state, while making a change survive a reboot requires an entirely separate mechanism — a configuration FILE that gets read and reapplied automatically at every future boot, not a flag on the same command.',
      ]
    },
    {
      heading: 'The actual persistence mechanism, and a genuinely easy mistake within it',
      points: [
        'The standard fix is adding the setting to a config file under one of several recognized locations — historically /etc/sysctl.conf, and on modern systemd systems more commonly a dedicated drop-in file under /etc/sysctl.d/*.conf — then either rebooting or running sysctl -p (or sysctl --system on newer tooling) to apply every configured file\'s settings to the CURRENTLY running kernel immediately, without waiting for the next reboot to prove the fix works.',
        'A subtle trap within the persistence mechanism itself: when multiple sysctl config files set the SAME parameter, the file read LAST wins and silently overrides any earlier file\'s value for that key — with files under /etc/sysctl.d/ typically processed in lexical (alphabetical) filename order, and /etc/sysctl.conf itself read last of all in the traditional ordering. A change added to a new drop-in file can be silently overridden by an existing file that happens to sort after it, or by /etc/sysctl.conf itself if that file still sets the same key.',
        'This means fixing a sysctl parameter that "won\'t stick" is really a two-part check: first, confirm the value was ever written to a persistent config file at all (not just applied live via sysctl -w or a direct /proc/sys/ write); second, if it WAS added to a file, confirm no other config file processed afterward sets the same key to a different value.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The runtime-only change the main page\'s own quiz describes',
      language: 'bash',
      code: `# Main page's own quiz explanation: "Writing to files here (e.g. via
# sysctl) changes kernel behaviour at runtime." -- true, but "at
# runtime" means exactly that and nothing more:

# Method 1: direct /proc/sys/ write
echo 1 > /proc/sys/net/ipv4/ip_forward

# Method 2: the sysctl command's -w flag (does the SAME thing)
sysctl -w net.ipv4.ip_forward=1

# Confirm it's live right now:
cat /proc/sys/net/ipv4/ip_forward
# => 1

# Neither command touched a single file on persistent disk storage.
# Reboot the system and check again:
#   (after reboot)
cat /proc/sys/net/ipv4/ip_forward
# => 0   <-- back to whatever the ORIGINAL boot-time default was,
#            as if the change was never made at all`,
    },
    {
      label: 'Making it persistent — and the "last file wins" trap',
      language: 'bash',
      code: `# The actual persistence mechanism: a CONFIG FILE, not a flag on
# the same command used for the runtime change.

# Modern convention: a dedicated drop-in file under /etc/sysctl.d/
echo "net.ipv4.ip_forward = 1" | sudo tee /etc/sysctl.d/99-ip-forward.conf

# Apply every configured sysctl.d/sysctl.conf file's settings to the
# CURRENTLY running kernel immediately -- proves the fix works now,
# without waiting for a reboot to find out:
sudo sysctl --system
# (or the older equivalent: sudo sysctl -p)

# THE TRAP: config files are processed in order, and the LAST file
# read for a given key wins -- silently. If an older file already
# sets the same key differently:
cat /etc/sysctl.conf
# net.ipv4.ip_forward = 0        <-- this file is read LAST in the
#                                     traditional ordering, so THIS
#                                     value wins over the new
#                                     99-ip-forward.conf drop-in,
#                                     even after a clean reboot.

# Diagnosing exactly which file actually "won" for a given key:
sudo sysctl --system 2>&1 | grep -A1 ip_forward
# sysctl's own --system output lists every file it processed, in
# the order it processed them -- the LAST matching line for a given
# key in that output is the one whose value is actually active.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An engineer runs sysctl -w vm.swappiness=10 to tune memory behavior on a server, confirms with cat /proc/sys/vm/swappiness that it shows 10, and considers the change complete. Three weeks later, after an unrelated kernel security patch requires a reboot, they notice the server is back to its old swappiness value. They\'re confused because they distinctly remember verifying the change took effect. What went wrong, and what should they have done differently?',
    hint: 'Check what sysctl -w actually modifies — is it the same thing as writing to a configuration file, or a separate, entirely runtime-only mechanism?',
    solution: 'sysctl -w only ever modifies the live, in-kernel value — it does not write to any configuration file on disk, regardless of how convincingly cat /proc/sys/vm/swappiness confirmed the change was active at the time. The verification the engineer did was real and correct — the value genuinely was 10 for those three weeks — but it only proved the RUNTIME state, not persistence. When the security-patch reboot restarted the kernel, it started fresh with whatever value the system\'s sysctl config files specified (or the kernel\'s own compiled-in default if no file set it), with no memory of the earlier sysctl -w command at all. The correct approach from the start would have been adding vm.swappiness = 10 to a config file — e.g. /etc/sysctl.d/99-swappiness.conf — and then running sudo sysctl --system (or sysctl -p) to apply it immediately, which both proves the value takes effect right away AND ensures the next reboot reads the same setting from disk instead of reverting to the default.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once sysctl -w (or a direct /proc/sys/ write) shows the new value taking effect immediately, the kernel parameter is now permanently set.',
      reality: 'Per this subtopic\'s theory, both methods only ever change the live, in-memory kernel state — neither one writes to any file on disk, so the change is completely undone the moment the system next reboots, with no warning that this will happen.'
    },
    {
      thought: 'Adding a setting to a new file under /etc/sysctl.d/ guarantees that value will be the one active after the next reboot.',
      reality: 'Per this subtopic\'s theory, sysctl config files are processed in a defined order and the LAST file read for a given key silently wins — a new drop-in file\'s setting can be overridden by another file (including /etc/sysctl.conf itself) that\'s processed after it, with no error or conflict warning shown.'
    },
    {
      thought: 'The only way to verify a sysctl config file change actually took effect is to reboot the system and check the value afterward.',
      reality: 'Per this subtopic\'s theory, sudo sysctl --system (or the older sysctl -p) applies every configured file\'s settings to the currently running kernel immediately — there\'s no need to reboot just to confirm a persisted setting is correctly configured and active.'
    }
  ];
}
