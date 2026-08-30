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
  templateUrl: './xfs-has-no-shrink-command-backup-recreate-restore-is-the-only-path.html',
  styleUrl: './xfs-has-no-shrink-command-backup-recreate-restore-is-the-only-path.scss'
})
export class XfsHasNoShrinkCommandBackupRecreateRestoreIsTheOnlyPathSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the limitation twice, but never says what to actually do about it',
      points: [
        'The main page states, twice, in almost identical wording: "XFS filesystems can only be grown (not shrunk)" and "though it historically had less flexible shrink support than ext4." Both mentions describe the LIMITATION but neither explains what "less flexible" actually means in practice, or what the real, current options are when a genuine need to shrink an XFS filesystem arises.',
      ]
    },
    {
      heading: 'The precise reality: there is no shrink command for XFS at all, not just a "less flexible" one',
      points: [
        'This isn\'t a matter of XFS shrinking being slower, riskier, or more manual than ext4\'s <code>resize2fs</code> — there is currently NO command that shrinks an XFS filesystem in place, full stop. <code>xfs_growfs</code> (the main page\'s own tool for extending XFS) only grows; there is no equivalent <code>xfs_shrink</code> or any flag on any XFS tool that reduces an existing XFS filesystem\'s size.',
        'This is a genuinely different category of limitation than ext4\'s own shrink support (which the main page\'s own <code>resize2fs</code> command handles directly, in place, without needing a full data migration) — XFS\'s design specifically does not support in-place shrinking at the filesystem level at all.',
      ]
    },
    {
      heading: 'The only real path to a smaller XFS filesystem: backup, recreate, restore',
      points: [
        'The documented, only supported route is a full data migration: <code>xfsdump</code> creates a complete backup of the existing XFS filesystem, a new, smaller XFS filesystem is created on a smaller partition or logical volume with <code>mkfs.xfs</code>, and <code>xfsrestore</code> restores the data onto that new, smaller filesystem — genuinely different from ext4\'s <code>resize2fs -M</code> or similar in-place shrink, which never requires moving the data off the filesystem at all.',
        'This has real, practical consequences worth planning for BEFORE choosing XFS for a volume that might ever need to shrink: the backup/recreate/restore cycle requires downtime (or careful use of an LVM snapshot alongside it), needs somewhere to actually put the backup (which, for a large filesystem, can itself be substantial), and takes meaningfully longer than an in-place resize — none of which is obvious from the main page\'s own brief "can only be grown" phrasing.',
        'The practical takeaway for choosing a filesystem, connecting back to the main page\'s own "choosing a filesystem should be driven by actual workload characteristics" theory point: if a volume\'s size requirements are genuinely uncertain and might need to shrink later (not just grow), that uncertainty itself is a real argument for ext4 (or an LVM layer sized conservatively from the start) over XFS, independent of XFS\'s other performance advantages for large-file/high-throughput workloads.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming there is genuinely no shrink command',
      language: 'bash',
      code: `# The main page's own growth tool -- works fine for growing:
sudo xfs_growfs /mnt/data
# data blocks changed from 2621440 to 5242880

# Looking for ANY equivalent to shrink it back down:
xfs_growfs --help 2>&1 | grep -i shrink
# (no output -- xfs_growfs has no shrink option at all)

man xfs_growfs
# NAME
#      xfs_growfs - expand an XFS filesystem
# -- the tool's own name and man page confirm: EXPAND only,
#    by design, not "expand or shrink with more steps"

# Compare directly against ext4's resize2fs, which DOES support
# shrinking in place:
man resize2fs
# resize2fs - ext2/ext3/ext4 file system resizer
# ...can be used to enlarge or shrink an unmounted file system...
# -- ext4 genuinely supports both directions with one tool;
#    XFS genuinely does not, this isn't just "more effort"`,
    },
    {
      label: 'The only real path: backup, recreate smaller, restore',
      language: 'bash',
      code: `# Full XFS shrink workflow -- there is no shortcut around this:

# 1. Back up the existing XFS filesystem completely
sudo xfsdump -f /backup/data.xfsdump /mnt/data

# 2. Unmount, then shrink the underlying block device (e.g. the
#    LVM logical volume) to the desired smaller size
sudo umount /mnt/data
sudo lvreduce -L 20G /dev/datavg/appdata

# 3. Recreate a NEW, smaller XFS filesystem on that device --
#    the old filesystem's own data is gone at this point, which
#    is exactly why the backup in step 1 is not optional
sudo mkfs.xfs -f /dev/datavg/appdata

# 4. Mount the new, smaller filesystem and restore the data
sudo mount /dev/datavg/appdata /mnt/data
sudo xfsrestore -f /backup/data.xfsdump /mnt/data

df -h /mnt/data
# Confirms the new, smaller size -- but this took a full backup/
# restore cycle, not an in-place operation the way ext4's
# resize2fs would have.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team over-provisioned an XFS-formatted data volume at 500GB, but actual usage has stabilized at 50GB, and they want to shrink it to reclaim the unused space for other volumes on the same LVM volume group — following the main page\'s own LVM workflow, which shows lvextend for growing. They search for an "lvreduce + xfs equivalent of resize2fs -M" and can\'t find one. Why can\'t this be done as a simple in-place operation the way it could be for an ext4 volume, and what is the actual required process?',
    hint: 'Check whether XFS has ANY command that reduces an existing filesystem\'s size in place — not whether it\'s harder or riskier than ext4\'s equivalent, but whether one exists at all.',
    solution: 'There is no in-place shrink operation for XFS at all — unlike ext4, where resize2fs directly supports shrinking a filesystem before or after reducing the underlying block device, XFS has no equivalent command (xfs_growfs only grows; there is no xfs_shrink or shrink flag on any XFS tool). This is a genuine, permanent design limitation of XFS, not just a "less convenient" version of what ext4 offers. The actual required process is a full backup-recreate-restore cycle: back up the existing 500GB XFS filesystem completely with xfsdump, unmount it and use lvreduce to shrink the underlying logical volume to the new target size, create a brand-new, smaller XFS filesystem on that now-smaller volume with mkfs.xfs, then restore the data onto it with xfsrestore. This requires real downtime and temporary storage for the backup, unlike ext4\'s in-place resize2fs shrink — worth factoring in before choosing XFS for any volume whose size requirements might need to shrink in the future, not just grow.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'XFS\'s shrink support is just less convenient or more manual than ext4\'s — a shrink command exists, it just takes more steps.',
      reality: 'Per this subtopic\'s theory, there is genuinely NO command that shrinks an XFS filesystem in place at all — this is a permanent design limitation, not merely a more cumbersome process using existing XFS tools.'
    },
    {
      thought: 'lvreduce on the underlying logical volume, followed by some XFS equivalent of resize2fs, can shrink an XFS filesystem the same way it would for ext4.',
      reality: 'Per this subtopic\'s theory, there is no XFS equivalent of resize2fs\'s shrink capability — shrinking an XFS filesystem requires a complete backup (xfsdump), recreating a new smaller filesystem, and restoring the data (xfsrestore), not an in-place resize.'
    },
    {
      thought: 'Filesystem choice (XFS vs ext4) mainly matters for performance characteristics like large-file handling and parallel I/O, not for future flexibility around resizing.',
      reality: 'Per this subtopic\'s theory, the inability to shrink XFS at all (versus ext4\'s full grow-and-shrink support) is a genuine, practical reason to prefer ext4 for any volume whose size requirements are uncertain and might need to decrease later — independent of XFS\'s other performance advantages.'
    }
  ];
}
