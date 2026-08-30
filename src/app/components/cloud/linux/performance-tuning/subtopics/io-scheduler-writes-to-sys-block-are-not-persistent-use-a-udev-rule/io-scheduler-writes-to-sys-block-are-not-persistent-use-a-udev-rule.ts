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
  templateUrl: './io-scheduler-writes-to-sys-block-are-not-persistent-use-a-udev-rule.html',
  styleUrl: './io-scheduler-writes-to-sys-block-are-not-persistent-use-a-udev-rule.scss'
})
export class IoSchedulerWritesToSysBlockAreNotPersistentUseAUdevRuleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page teaches the persistence distinction for sysctl, but never applies the same lesson to the I/O scheduler',
      points: [
        'The main page\'s own FIRST mistake entry is entirely about this exact class of problem for sysctl: "sysctl -w modifies the running kernel only... Write to /etc/sysctl.d/*.conf and run sysctl --system to apply and persist." But its own I/O scheduler example — <code>echo mq-deadline | sudo tee /sys/block/sda/queue/scheduler</code> — is shown with no such caveat at all, presented as if it were a complete, one-time configuration step.',
      ]
    },
    {
      heading: 'Why the I/O scheduler setting has exactly the same non-persistence problem, for the same underlying reason',
      points: [
        '<code>/sys/block/sda/queue/scheduler</code> is a sysfs entry — a live, in-kernel-memory representation of a runtime setting, conceptually identical to <code>/proc/sys/</code> (which backs sysctl). Writing to it with <code>echo ... | tee</code> changes the running kernel\'s current behavior for that device immediately, but nothing about that write is saved to disk anywhere — on the next reboot, the device gets whatever scheduler the kernel/udev defaults to assigning it, silently discarding the earlier change.',
        'Unlike sysctl, there is no equivalent <code>/etc/something.d/*.conf</code> directory that logrotate-style tools automatically read for I/O scheduler settings — this is the part that makes the gap easy to miss even for someone who already correctly internalized the main page\'s own sysctl persistence lesson.',
      ]
    },
    {
      heading: 'The actual persistence mechanism: a udev rule, not a config file',
      points: [
        'The documented, correct way to make an I/O scheduler setting survive a reboot is a udev rule placed in <code>/etc/udev/rules.d/</code> — udev re-applies these rules automatically every time a matching block device is detected (at boot, and on hotplug), which is functionally equivalent to "persisting" the setting, just through a completely different mechanism than sysctl\'s config-file-based approach.',
        'A typical rule matches devices by kernel name pattern or by a device attribute (like <code>queue/rotational</code>, distinguishing spinning disks from SSDs) and sets <code>ATTR{queue/scheduler}</code> directly — <code>udevadm test /sys/block/sda</code> is the standard way to validate a new rule\'s logic before relying on it, without needing an actual reboot to find out whether it worked.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the silent reset after reboot',
      language: 'bash',
      code: `# Following the main page's own exact command:
echo mq-deadline | sudo tee /sys/block/sda/queue/scheduler

# Confirm it applied immediately:
cat /sys/block/sda/queue/scheduler
# [mq-deadline] kyber bfq none

# ...but nothing here was ever written to disk. After a reboot:
cat /sys/block/sda/queue/scheduler
# [none] mq-deadline kyber bfq        <-- back to the kernel's own
#                                          default for this device,
#                                          the earlier change is gone
#                                          with no error or warning`,
    },
    {
      label: 'The fix: a udev rule, not a config file',
      language: 'bash',
      code: `# /etc/udev/rules.d/60-io-scheduler.rules
#
# Set mq-deadline for rotational (spinning) disks, none for NVMe --
# udev re-applies this on every boot and every hotplug event
ACTION=="add|change", KERNEL=="sd[a-z]*", ATTR{queue/rotational}=="1", ATTR{queue/scheduler}="mq-deadline"
ACTION=="add|change", KERNEL=="nvme[0-9]n[0-9]", ATTR{queue/scheduler}="none"

# Validate the rule's logic WITHOUT rebooting:
sudo udevadm test /sys/block/sda 2>&1 | grep scheduler
# ... ATTR{queue/scheduler}="mq-deadline" ...

# Apply immediately to already-present devices (new devices/reboots
# pick it up automatically going forward):
sudo udevadm control --reload
sudo udevadm trigger --attr-match=queue/rotational

cat /sys/block/sda/queue/scheduler
# [mq-deadline] kyber bfq none

# Reboot and confirm it actually persisted this time:
sudo reboot
# (after reboot) cat /sys/block/sda/queue/scheduler
# [mq-deadline] kyber bfq none        <-- correctly survived`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own I/O scheduler example, an engineer sets `echo none | sudo tee /sys/block/nvme0n1/queue/scheduler` on a database server to optimize for the NVMe drive, confirms the change with `cat`, and closes the ticket as complete. Three weeks later during a routine kernel-update reboot, database performance degrades noticeably, and investigation shows the scheduler is back to the kernel default. Why did the earlier "fix" not actually persist, and what specific mechanism (not a config file) would have made it survive the reboot?',
    hint: 'Think about what kind of filesystem /sys/block/.../queue/scheduler actually lives on, and whether writes to that location are ever saved to persistent disk storage the way a config file write is.',
    solution: '`/sys/block/nvme0n1/queue/scheduler` is a sysfs entry — a live, in-kernel-memory representation of the device\'s current scheduler setting, not a file backed by persistent disk storage. Writing to it with `echo ... | tee` changes the RUNNING kernel\'s behavior immediately (which is why `cat` correctly showed the change), but nothing about that write is saved anywhere that survives a reboot — this is exactly the same underlying issue the main page\'s own sysctl mistake entry describes for `/proc/sys/`, just applied to a different sysfs tree the main page never draws that connection to. The fix that would have made it persist isn\'t a config file at all (there is no sysctl.d-style directory for scheduler settings) — it\'s a udev rule in `/etc/udev/rules.d/`, which udev automatically re-applies every time a matching block device is detected, including at every boot. A rule like `ACTION=="add|change", KERNEL=="nvme[0-9]n[0-9]", ATTR{queue/scheduler}="none"` achieves the persistence the original one-off `tee` command never provided.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting an I/O scheduler with echo scheduler-name | tee /sys/block/.../queue/scheduler is a one-time, permanent configuration step, the same as editing a config file.',
      reality: 'Per this subtopic\'s theory, this writes to a sysfs entry — a live, in-memory kernel setting with no backing on disk — exactly analogous to the main page\'s own sysctl -w warning, just applied to a different part of the sysfs tree the page never connects it to.'
    },
    {
      thought: 'Persisting an I/O scheduler setting across reboots works the same way as persisting a sysctl setting — write it to a config file in a *.d directory.',
      reality: 'Per this subtopic\'s theory, there is no equivalent config-file-based persistence mechanism for I/O scheduler settings — the correct, documented approach is a udev rule in /etc/udev/rules.d/, which re-applies the setting automatically whenever a matching block device is detected, a completely different mechanism from sysctl.d.'
    },
    {
      thought: 'If cat /sys/block/.../queue/scheduler confirms a change immediately after setting it, that confirms the setting is correctly and permanently configured.',
      reality: 'Per this subtopic\'s theory, cat only confirms the CURRENT, in-memory kernel state — it says nothing about whether the setting will survive a reboot, which depends entirely on whether a udev rule (not the sysfs write itself) has been separately configured.'
    }
  ];
}
