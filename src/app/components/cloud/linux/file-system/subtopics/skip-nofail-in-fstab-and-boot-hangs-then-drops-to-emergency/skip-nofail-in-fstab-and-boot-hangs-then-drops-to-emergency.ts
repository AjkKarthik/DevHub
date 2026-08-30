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
  templateUrl: './skip-nofail-in-fstab-and-boot-hangs-then-drops-to-emergency.html',
  styleUrl: './skip-nofail-in-fstab-and-boot-hangs-then-drops-to-emergency.scss'
})
export class SkipNofailInFstabAndBootHangsThenDropsToEmergencySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own fstab example already uses nofail — but never says why',
      points: [
        'The main page\'s own "/etc Config Files" code tab includes: "UUID=abc123 /data ext4 defaults,nofail 0 2" — nofail is right there in the example, but the surrounding theory never explains what that option actually does, or what would happen if it were left off.',
        'The main page\'s own theory describes /etc/fstab only in neutral, descriptive terms: "static mount table — filesystems to mount at boot (device, mountpoint, type, options, dump, pass)." Nothing warns that an fstab ENTRY REFERENCING A DEVICE THAT ISN\'T THERE AT BOOT TIME is a real, common failure mode with severe consequences, not just a line that gets silently skipped.',
      ]
    },
    {
      heading: 'Confirmed: a missing device without nofail drops the system to emergency mode',
      points: [
        'Per systemd\'s own documented behavior (and a long-tracked systemd GitHub issue on the topic), when a device listed in /etc/fstab is not present at boot and nofail/noauto isn\'t set, "systemd fails to boot... if a device is specified in fstab and it\'s not present at boot time then systemd will drop to emergency mode." This is intentional design, not a bug — the reasoning cited is that "in case the drive/partition is critical to OS operation, the system won\'t boot if it\'s missing."',
        'This isn\'t instant, either — confirmed via the same tracked behavior: systemd first WAITS for the missing device, roughly 90 seconds by default (the hardware timeout), showing no useful feedback for that entire window, before finally giving up and dropping to an emergency shell. A server with a genuinely unavailable disk (a detached cloud volume, a failed drive, a fstab entry left over from a decommissioned mount) adds a full 90-second stall to every single boot, before the operator even gets a login prompt to fix it.',
        'Emergency mode itself is a minimal, mostly-unusable state — few services are running, and depending on the distro it may require the root password just to log in at all, which is a genuinely bad place to discover a boot problem on a remote or headless server with no physical console access.',
      ]
    },
    {
      heading: 'Why nofail is the fix, and what it actually changes',
      points: [
        'Adding nofail to that fstab line tells systemd this specific mount is NOT required for the system to finish booting — per the documented guidance, "the best prevention is to always run mount -a after editing fstab and to use the nofail option on any filesystem that is not strictly required for the system to boot." With nofail, a missing device is logged as a failed mount but boot proceeds normally past it.',
        'nofail changes what happens on FAILURE, but doesn\'t remove the mount attempt itself — the system will still try to mount the device if present, and will still eventually time out waiting for a genuinely absent one; the difference is that timeout no longer blocks the rest of boot or triggers emergency mode. For a device the system needs to be usable more quickly, pairing nofail with an explicit x-systemd.device-timeout= option shortens that wait, rather than accepting the default ~90 seconds.',
        'An alternative approach for genuinely optional or removable storage (external drives, occasionally-attached network shares) is a systemd automount unit instead of a plain fstab entry — this defers the actual mount attempt until the mountpoint is first accessed, meaning boot never waits on it at all, succeeding or failing only when something actually tries to use that path.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What nofail actually prevents — reproducing the failure mode',
      language: 'bash',
      code: `# Main page's own example, unchanged -- nofail is already there:
cat /etc/fstab
# UUID=abc123  /data  ext4  defaults,nofail  0  2

# Now the SAME line, but WITHOUT nofail -- the version that
# reproduces the failure mode the main page never mentions:
# UUID=abc123  /data  ext4  defaults  0  2

# If the UUID abc123 device is detached (a cloud volume that was
# unmounted, a failed drive, an fstab entry from removed hardware),
# per systemd's own documented behavior, this next boot:
#
#   t+0s     systemd reaches the local-fs.target dependency chain
#            and finds data.mount waiting on a device that isn't
#            present
#   t+0-90s  systemd WAITS for the device (default hardware timeout
#            ~90 seconds) -- no useful console output during this
#            entire window on many systems
#   t+90s    timeout expires, the mount unit fails, and because
#            it's a required dependency (no nofail), systemd drops
#            straight to EMERGENCY MODE
#
# Emergency mode may require the root password to even log in --
# on a remote/headless server with no physical console, this is a
# genuinely bad place to discover a boot problem.`,
    },
    {
      label: 'Two better options: nofail with a shorter timeout, or automount',
      language: 'bash',
      code: `# Fix 1 -- nofail (as the main page's own example already shows),
# PLUS an explicit shorter device timeout so a genuinely-missing
# device doesn't still cost ~90 seconds before boot proceeds:
# UUID=abc123  /data  ext4  defaults,nofail,x-systemd.device-timeout=10s  0  2
#
# Boot now proceeds past this mount after only 10 seconds if the
# device is missing, logging the failure instead of blocking on it,
# and WITHOUT ever reaching emergency mode.

# Fix 2 -- systemd automount, for storage that's genuinely optional
# or only sometimes attached (defers the mount attempt until the
# path is first accessed, so boot never waits on it at all):
# UUID=abc123  /data  ext4  defaults,x-systemd.automount,noauto  0  2
#
# Boot completes immediately, with no wait for this device either
# way. The first process to actually touch /data triggers the real
# mount attempt at that point (which can still succeed or fail then).

# Confirm which mounts on a running system are marked nofail/optional:
systemctl status data.mount
findmnt /data`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A cloud server\'s /etc/fstab has an entry for an attached data volume, written without the nofail option. During a routine maintenance window, an operator detaches that volume from the instance but forgets to remove the corresponding fstab line. On the next reboot, the server takes noticeably longer than usual to come back up, and once it does, SSH access fails entirely — even though the server\'s status in the cloud console shows it as "running." What happened, and what fstab option would have prevented it?',
    hint: 'Check what systemd does by default when a device listed in /etc/fstab isn\'t present at boot, and whether that default behavior still allows the rest of the system (including SSH) to start normally.',
    solution: 'The server dropped into emergency mode, which is why "running" in the cloud console is technically true but SSH still fails — emergency mode is a minimal boot state with most services, including SSH, never started. Per systemd\'s own documented behavior, an fstab entry without nofail or noauto that references a now-missing device causes systemd to wait roughly 90 seconds (the default hardware timeout) — explaining the noticeably longer boot — and then, because the mount is treated as a required dependency, drop the entire boot process to emergency mode rather than continuing past the failed mount. The fix, exactly as the main page\'s own fstab example already demonstrates for a different mount, is adding nofail to that line: it tells systemd this specific filesystem is not required for the system to finish booting, so a missing device gets logged as a failure but the rest of boot — including starting SSH — proceeds normally.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a device listed in /etc/fstab is missing at boot, that mount line is simply skipped and the system boots normally regardless of any options.',
      reality: 'Per this subtopic\'s theory, systemd\'s own documented default behavior is the opposite — a missing device without nofail or noauto is treated as a failed required dependency, causing systemd to drop the ENTIRE boot process to emergency mode rather than skip past it.'
    },
    {
      thought: 'A missing fstab device causes an immediate, fast failure — the system either boots or doesn\'t, with no meaningful delay either way.',
      reality: 'Per this subtopic\'s theory, systemd first waits for the missing device for roughly 90 seconds (the default hardware timeout) before giving up — a real, often-confusing delay that can look like a hung boot rather than an obvious fstab misconfiguration.'
    },
    {
      thought: 'The nofail option in the main page\'s own fstab example is just a stylistic convention or a minor optimization, not something that changes actual boot behavior.',
      reality: 'Per this subtopic\'s theory, nofail is the specific option that prevents a missing device from dropping the system into emergency mode at all — without it, exactly the scenario the main page\'s own example implicitly protects against becomes a real, boot-blocking failure.'
    }
  ];
}
