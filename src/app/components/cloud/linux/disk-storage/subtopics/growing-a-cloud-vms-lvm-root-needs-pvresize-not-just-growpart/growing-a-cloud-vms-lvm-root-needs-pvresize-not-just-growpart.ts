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
  templateUrl: './growing-a-cloud-vms-lvm-root-needs-pvresize-not-just-growpart.html',
  styleUrl: './growing-a-cloud-vms-lvm-root-needs-pvresize-not-just-growpart.scss'
})
export class GrowingACloudVmsLvmRootNeedsPvresizeNotJustGrowpartSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own cloud-resize QnA answer skips a step that many cloud images actually need',
      points: [
        'The main page\'s own QnA answer for extending a cloud VM\'s disk gives exactly two steps: "(1) growpart /dev/nvme0n1 1 (grows the partition)... (2) resize2fs /dev/nvme0n1p1 (ext4) or xfs_growfs / (xfs)." This is presented as the complete procedure — but it silently assumes the root filesystem sits directly on the partition, with no LVM layer in between.',
      ]
    },
    {
      heading: 'Many cloud images put LVM between the partition and the filesystem — and growpart alone doesn\'t reach through it',
      points: [
        'Several common cloud distribution images (notably many RHEL/CentOS/Rocky/AlmaLinux cloud images) default to an LVM layout for the root volume: partition → Physical Volume (PV) → Volume Group (VG) → Logical Volume (LV) → filesystem — exactly the layered structure the main page\'s own LVM section describes for a DATA volume, just also used here for the ROOT volume by default on these distros.',
        'On a layout like this, <code>growpart</code> only grows the PARTITION — the LVM Physical Volume sitting on top of that partition does not automatically notice or use the newly available space. Running only the main page\'s own two-step procedure on an LVM-root cloud image leaves the extra space allocated to the partition but completely unusable — <code>lvextend</code> and <code>resize2fs</code>/<code>xfs_growfs</code> have nothing new to work with, since the LV itself was never told more space exists.',
      ]
    },
    {
      heading: 'The correct, complete sequence for an LVM-root cloud VM',
      points: [
        'The full sequence needed on an LVM-root layout, inserting the missing step directly into the main page\'s own two-step procedure: (1) <code>growpart</code> to grow the partition (same as the main page\'s own step 1), (2) <code>pvresize</code> on that partition to tell LVM the underlying Physical Volume has grown — this is the step the main page\'s own answer omits entirely, (3) <code>lvextend</code> to grow the Logical Volume into the newly-available VG space (exactly the main page\'s own LVM section\'s own <code>lvextend</code> command, just applied to the root LV specifically), (4) <code>resize2fs</code> or <code>xfs_growfs</code> to grow the filesystem, matching the main page\'s own final step.',
        'One additional platform-specific nuance worth checking before assuming the exact same commands apply: on instances using NVMe-based EBS volumes specifically, some cloud environments\' `growpart` step becomes unnecessary or behaves differently — always confirm the disk/partition layout with <code>lsblk</code> first (the main page\'s own first-recommended inspection tool) rather than assuming the main page\'s own generic 2-step or this subtopic\'s own 4-step sequence applies unmodified to every possible cloud image and disk type.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the "resized in the console but nothing changed" symptom',
      language: 'bash',
      code: `# Cloud console: EBS root volume resized from 20GB to 40GB.
# Following the main page's own EXACT two-step QnA procedure:

sudo growpart /dev/nvme0n1 1
# CHANGED: partition=1 start=2048 old: size=41940959 end=41943007
#          new: size=83884031 end=83886079
# -- the PARTITION did grow, confirmed

sudo resize2fs /dev/nvme0n1p1
# resize2fs: Bad magic number in super-block while trying to
# open /dev/nvme0n1p1
# Couldn't find valid filesystem superblock.
# -- FAILS -- because on this image, /dev/nvme0n1p1 isn't the
#    filesystem directly -- it's an LVM Physical Volume, and the
#    actual filesystem lives on a Logical Volume ON TOP of it

# Confirm the actual layout before assuming the main page's
# generic 2-step procedure applies as-is:
lsblk
# nvme0n1       40G
# └─nvme0n1p1   40G  <-- grew correctly, but...
#   └─rootvg-rootlv (LV)  18G  /   <-- ...the LV on top is STILL 18G,
#                                      the extra 20G is stranded on
#                                      the PV, invisible to the LV`,
    },
    {
      label: 'The correct, complete sequence for an LVM-root image',
      language: 'bash',
      code: `# Step 1 (same as the main page's own QnA): grow the partition
sudo growpart /dev/nvme0n1 1

# Step 2 (the step the main page's own answer omits entirely):
# tell LVM the underlying Physical Volume has grown
sudo pvresize /dev/nvme0n1p1
# Physical volume "/dev/nvme0n1p1" changed
# 1 physical volume(s) resized or updated / 0 physical volume(s)
# not resized

# Confirm the VG now sees the extra free space:
sudo vgs
# VG      #PV #LV #SN Attr   VSize  VFree
# rootvg    1   1   0 wz--n- 40.00g 20.00g   <-- 20G now free

# Step 3: extend the Logical Volume into that newly-free space --
# the exact same lvextend command from the main page's own LVM
# section, just targeting the root LV specifically
sudo lvextend -L +20G /dev/rootvg/rootlv

# Step 4 (matches the main page's own final step): grow the
# filesystem to fill the now-larger LV
sudo resize2fs /dev/rootvg/rootlv          # ext4
# sudo xfs_growfs /                        # xfs -- if root is xfs

df -h /
# Filesystem              Size  Used Avail Use% Mounted on
# /dev/mapper/rootvg-rootlv 40G  ...        <-- full 40G now usable`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own QnA answer exactly (`growpart` then `resize2fs`), an engineer resizes a cloud VM\'s root EBS volume from 20GB to 60GB. `growpart` reports success, but `resize2fs` fails with "Bad magic number in super-block." `lsblk` shows the partition itself did grow to 60GB, but a logical volume sitting on top of it is still only 20GB. What layer is missing from the main page\'s own two-step procedure, and what is the exact command that addresses it?',
    hint: 'growpart only operates on the PARTITION. Check what sits directly on top of that partition before the filesystem itself, according to what lsblk actually shows — and whether that layer automatically notices the partition grew.',
    solution: 'The missing layer is LVM — this cloud image places a Physical Volume directly on the partition, with a Volume Group and Logical Volume between it and the actual root filesystem, unlike the main page\'s own QnA answer which assumes the filesystem sits directly on the partition. growpart only grows the partition itself; it has no awareness of or effect on the LVM Physical Volume sitting on top of it, so the newly available space is stranded at the partition level and invisible to the Logical Volume the filesystem actually lives on — which is exactly why resize2fs fails (it\'s being pointed at the raw partition, which is no longer a valid filesystem superblock location once LVM is in play, or the LV itself simply hasn\'t grown). The missing command is `sudo pvresize /dev/nvme0n1p1` (run immediately after growpart, before lvextend) — this tells LVM\'s Physical Volume layer that its underlying block device has grown, making the extra space available to the Volume Group, at which point the existing `lvextend` (from the main page\'s own LVM section) and `resize2fs` steps work correctly.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own two-step cloud VM resize procedure (growpart, then resize2fs/xfs_growfs) works for any cloud instance\'s root volume, regardless of how it\'s partitioned.',
      reality: 'Per this subtopic\'s theory, this two-step procedure assumes the filesystem sits directly on the partition — many common cloud images (particularly RHEL-family distributions) default to an LVM layout for the root volume, which requires an additional pvresize step the main page\'s own answer omits entirely.'
    },
    {
      thought: 'growpart growing the partition automatically means every layer above it (LVM Physical/Volume Groups, the Logical Volume, the filesystem) also sees the new space.',
      reality: 'Per this subtopic\'s theory, growpart only affects the partition itself — an LVM Physical Volume sitting on top of that partition needs its own explicit pvresize command before the Volume Group, Logical Volume, or filesystem can use any of the newly available space.'
    },
    {
      thought: 'If resize2fs fails with a superblock error after resizing a cloud disk, the filesystem itself must be corrupted.',
      reality: 'Per this subtopic\'s theory, this specific error is the classic symptom of pointing resize2fs at the wrong layer entirely — on an LVM-root layout, the actual filesystem lives on a Logical Volume, not directly on the partition, and the fix is targeting the correct device after running pvresize and lvextend, not repairing a filesystem that was never actually damaged.'
    }
  ];
}
