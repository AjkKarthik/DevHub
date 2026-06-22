import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-linux-disk-storage',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './disk-storage.html',
  styleUrl: './disk-storage.scss'
})
export class LinuxDiskStorage {

  quickRef: QuickRefItem[] = [
    { name: 'lsblk', type: 'syntax', desc: 'Show block devices in tree format' },
    { name: 'fdisk -l /dev/sdb', type: 'syntax', desc: 'List partition table of a disk' },
    { name: 'mkfs.ext4 /dev/sdb1', type: 'syntax', desc: 'Format partition with ext4 filesystem' },
    { name: 'mount /dev/sdb1 /mnt/data', type: 'syntax', desc: 'Mount partition to /mnt/data' },
    { name: 'blkid /dev/sdb1', type: 'syntax', desc: 'Show UUID and filesystem type of partition' },
    { name: 'df -h', type: 'syntax', desc: 'Disk space usage of all mounted filesystems' },
    { name: 'du -sh /var/log/', type: 'syntax', desc: 'Total size of /var/log directory' },
    { name: 'fsck -f /dev/sdb1', type: 'syntax', desc: 'Filesystem check (unmounted only)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Disk and Partition Layout',
      points: [
        'lsblk shows block devices in a tree. /dev/sda is the first SCSI disk. /dev/sda1, sda2 are its partitions. NVMe: /dev/nvme0n1, /dev/nvme0n1p1.',
        'Partition tables: MBR (legacy, max 2TB, max 4 primary partitions) and GPT (modern, >2TB, 128 partitions). Use gdisk for GPT, fdisk for both.',
        'fdisk -l lists partition tables. parted is an alternative with scripting support. lsblk -f shows filesystem types and UUIDs.',
        'blkid returns the UUID and filesystem type — use UUID in /etc/fstab (not device names which can change after reboot).',
      ],
    },
    {
      heading: 'Filesystems',
      points: [
        'Common filesystems: ext4 (stable, default on Debian/Ubuntu), xfs (high performance, RHEL default), btrfs (CoW, snapshots), vfat/FAT32 (cross-platform, USB).',
        'mkfs.ext4 /dev/sdb1 formats with ext4. mkfs.xfs, mkfs.btrfs, mkfs.vfat for other types. Use -L label to set a label.',
        'tune2fs -l /dev/sda1 shows ext4 filesystem parameters. resize2fs /dev/sda1 resizes an ext2/3/4 filesystem (after resizing the partition).',
        'XFS filesystems can only be grown (not shrunk). Btrfs supports subvolumes, snapshots, and RAID modes.',
      ],
    },
    {
      heading: 'Mounting and /etc/fstab',
      points: [
        'mount /dev/sdb1 /mnt/data mounts a filesystem. umount /mnt/data unmounts it (must not be busy — use fuser /mnt/data to find who is using it).',
        '/etc/fstab defines persistent mounts. Format: UUID=xxxx /mount/point fstype options dump pass.',
        'mount -a reads /etc/fstab and mounts all entries — test fstab without rebooting.',
        'Common options: defaults (rw,suid,dev,exec,auto,nouser,async), noexec (no execution), nosuid (ignore setuid), ro (read-only).',
        'tmpfs is an in-memory filesystem: mount -t tmpfs -o size=512m tmpfs /mnt/ramdisk.',
      ],
    },
    {
      heading: 'LVM — Logical Volume Manager',
      points: [
        'LVM adds a layer: Physical Volumes (PVs) → Volume Groups (VGs) → Logical Volumes (LVs). LVs can be resized online.',
        'Workflow: pvcreate /dev/sdb → vgcreate myvg /dev/sdb → lvcreate -L 10G -n mydata myvg → mkfs.ext4 /dev/myvg/mydata → mount.',
        'Extend: lvextend -L +5G /dev/myvg/mydata then resize2fs /dev/myvg/mydata (for ext4) or xfs_growfs /mnt/point (for xfs).',
        'vgdisplay shows VG size/free. lvdisplay shows LV details. pvs, vgs, lvs for compact summaries.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Disk Inspection',
      language: 'bash',
      code: `# Block devices
lsblk                              # tree view
lsblk -f                           # with filesystem info
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT # custom columns

# Disk details
sudo fdisk -l /dev/sda             # partition table
sudo parted /dev/sda print         # alternative
blkid                              # UUIDs and fstype
blkid /dev/sda1

# Filesystem stats
df -h                              # usage by mount point
df -i                              # inode usage
tune2fs -l /dev/sda1               # ext4 info
xfs_info /dev/sda1                 # xfs info

# Largest files/dirs
du -sh /var/log/*                  # size of each in /var/log
du -ah / | sort -rh | head -20    # 20 largest items

# Disk health
sudo smartctl -a /dev/sda          # SMART data (apt install smartmontools)`,
    },
    {
      label: 'Partition & Format',
      language: 'bash',
      code: `# Create GPT partition table + partition
sudo parted /dev/sdb mklabel gpt
sudo parted /dev/sdb mkpart primary ext4 0% 100%

# Or with fdisk (interactive)
sudo fdisk /dev/sdb
# n = new partition, p = primary, 1 = first, defaults for size, w = write

# Format
sudo mkfs.ext4 -L mydata /dev/sdb1
sudo mkfs.xfs -L mydata /dev/sdb1
sudo mkfs.vfat -n USB /dev/sdb1

# Mount
sudo mkdir -p /mnt/data
sudo mount /dev/sdb1 /mnt/data
df -h /mnt/data                    # verify

# Get UUID for fstab
blkid /dev/sdb1
# UUID="a1b2c3d4-..." TYPE="ext4"

# Add to /etc/fstab for persistence
# UUID=a1b2c3d4-... /mnt/data ext4 defaults 0 2

sudo mount -a                      # test fstab without reboot`,
    },
    {
      label: 'LVM',
      language: 'bash',
      code: `# Create LVM stack
sudo pvcreate /dev/sdb /dev/sdc           # physical volumes
sudo vgcreate datavg /dev/sdb /dev/sdc    # volume group (pools both disks)
sudo lvcreate -L 20G -n appdata datavg    # 20 GB logical volume
sudo mkfs.ext4 /dev/datavg/appdata        # format
sudo mount /dev/datavg/appdata /opt/app   # mount

# Status
sudo pvs                                  # physical volumes
sudo vgs                                  # volume groups
sudo lvs                                  # logical volumes
sudo lvdisplay /dev/datavg/appdata

# Extend a logical volume (online)
sudo lvextend -L +10G /dev/datavg/appdata
# For ext4: resize the filesystem too
sudo resize2fs /dev/datavg/appdata
# For xfs (can't shrink):
sudo xfs_growfs /opt/app

# Snapshot (before risky operation)
sudo lvcreate -L 5G -s -n appdata-snap /dev/datavg/appdata
# To restore from snapshot:
sudo lvconvert --merge /dev/datavg/appdata-snap`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using device name instead of UUID in /etc/fstab',
      wrong: '/dev/sdb1 /mnt/data ext4 defaults 0 2',
      right: 'UUID=a1b2c3d4-e5f6-... /mnt/data ext4 defaults 0 2',
      explanation: 'Device names like /dev/sdb1 can change between reboots if you add or remove disks. UUIDs are stable identifiers tied to the filesystem itself. Always use UUID= in fstab.',
    },
    {
      title: 'Running fsck on a mounted filesystem',
      wrong: 'fsck /dev/sda1 (while mounted)',
      right: 'Unmount first (umount /mnt/data), then fsck /dev/sda1',
      explanation: 'Running fsck on a mounted filesystem corrupts it. The filesystem must be unmounted or the system booted to a rescue mode. fsck -n (no changes) is safe for read-only inspection.',
    },
    {
      title: 'Forgetting to run resize2fs after lvextend',
      wrong: 'lvextend -L +10G /dev/vg/lv (filesystem still the old size)',
      right: 'lvextend -L +10G /dev/vg/lv && resize2fs /dev/vg/lv (or lvextend -r to do both)',
      explanation: 'lvextend grows the logical volume block device but not the filesystem inside it. resize2fs (ext4) or xfs_growfs (xfs) grows the filesystem to fill the new space. Use -r flag on lvextend to do both at once.',
    },
    {
      title: 'Not using the pass field correctly in /etc/fstab',
      wrong: 'UUID=... /boot ext4 defaults 0 0 (no fsck on boot)',
      right: 'UUID=... /boot ext4 defaults 0 1 (root), 0 2 (other partitions)',
      explanation: 'The 6th field in fstab is the fsck pass order: 0=no check, 1=check first (root), 2=check after root. Setting it to 0 for non-root partitions means filesystem corruption is not detected at boot.',
    },
  ];

  challenge: Challenge = {
    title: 'fstab Parser',
    language: 'typescript',
    description: 'Write a function that parses /etc/fstab content and returns an array of mount entries. Each entry should have: device (UUID or device path), mountPoint, fsType, options, and dumpFreq/passNum fields.',
    hints: [
      'Split each line on whitespace; skip comment lines (starting with #) and blank lines',
      'Fields: device, mountPoint, fsType, options, dump, pass',
      'options is a comma-separated string',
    ],
    starterCode: `interface FstabEntry { device: string; mountPoint: string; fsType: string; options: string[]; dumpFreq: number; passNum: number; }

function parseFstab(content: string): FstabEntry[] {
  // Return parsed mount entries
}

const sample = \`# /etc/fstab
UUID=abc123 / ext4 errors=remount-ro 0 1
UUID=def456 /boot ext4 defaults 0 2
tmpfs /tmp tmpfs defaults,noatime 0 0\`;

console.log(parseFstab(sample));`,
    solution: `interface FstabEntry { device: string; mountPoint: string; fsType: string; options: string[]; dumpFreq: number; passNum: number; }

function parseFstab(content: string): FstabEntry[] {
  return content.split('\\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const [device, mountPoint, fsType, optStr, dump, pass] = l.split(/\\s+/);
      return {
        device, mountPoint, fsType,
        options: (optStr ?? 'defaults').split(','),
        dumpFreq: parseInt(dump ?? '0', 10),
        passNum: parseInt(pass ?? '0', 10),
      };
    });
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which command shows block devices and their mount points in a tree?',
      options: ['fdisk -l', 'lsblk', 'df -h', 'blkid'],
      answer: 1,
      explanation: 'lsblk lists block devices in a tree showing parent-child relationships (disk → partition → LVM). -f adds filesystem type and UUID. -o lets you choose columns.',
    },
    {
      q: 'After running lvextend on an ext4 logical volume, what must you also run?',
      options: ['xfs_growfs', 'resize2fs', 'e2fsck', 'partprobe'],
      answer: 1,
      explanation: 'lvextend grows the block device but not the ext4 filesystem inside it. resize2fs /dev/vg/lv grows the filesystem to fill the new space. For xfs use xfs_growfs instead. Use lvextend -r to do both at once.',
    },
    {
      q: 'Why should you use UUID instead of /dev/sdb1 in /etc/fstab?',
      options: [
        'UUID is shorter to type',
        'Device names can change between reboots; UUIDs are stable',
        'UUID allows faster mounting',
        'Device names only work for SSD',
      ],
      answer: 1,
      explanation: 'Device names are assigned at boot time based on detection order. Adding or removing disks can change /dev/sdb to /dev/sdc. UUIDs are tied to the filesystem and never change.',
    },
    {
      q: 'What is the purpose of tmpfs in /etc/fstab?',
      options: [
        'A network filesystem mount',
        'An in-memory filesystem that uses RAM/swap',
        'A temporary local disk partition',
        'An alias for the swap partition',
      ],
      answer: 1,
      explanation: 'tmpfs is a virtual filesystem stored in RAM (and swap if needed). Very fast for temp files. Contents are lost on reboot. Commonly mounted on /tmp and /run/shm.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I extend a running disk on a cloud VM (e.g. AWS EBS)?',
      a: 'Resize the EBS volume in AWS console. On the VM: (1) growpart /dev/nvme0n1 1 (grows the partition) — from cloud-utils-growpart package. (2) resize2fs /dev/nvme0n1p1 (ext4) or xfs_growfs / (xfs). The filesystem is extended online without unmounting. Verify with df -h.',
    },
    {
      q: 'How do I find and reclaim disk space quickly?',
      a: 'Run: du -ah / --exclude=/proc --exclude=/sys | sort -rh | head -30 to find largest consumers. Common culprits: /var/log (journalctl --vacuum-size=500M), /var/lib/docker (docker system prune), old kernel images (apt autoremove on Ubuntu), /tmp. Also check df -i for inode exhaustion.',
    },
    {
      q: 'What is the difference between ext4 and xfs?',
      a: 'ext4 is the default on Ubuntu/Debian. xfs is the default on RHEL/CentOS. Both are journaling filesystems. Key differences: xfs handles large files and parallel I/O better (good for databases and NAS). ext4 has better small-file performance. xfs cannot be shrunk (only grown). ext4 can be resized with resize2fs. For most uses, performance difference is negligible.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'lsblk shows devices; mkfs.ext4 formats; UUID in fstab for stability; mount -a tests fstab; lvextend + resize2fs to grow LVM volumes.',
    mustKnow: [
      'lsblk, lsblk -f, blkid — inspect disks and UUIDs',
      'Always use UUID= (not /dev/sdX) in /etc/fstab',
      'mount -a tests /etc/fstab without rebooting',
      'fsck only on unmounted filesystem — running on mounted = corruption',
      'LVM: pvcreate → vgcreate → lvcreate → mkfs → mount',
      'lvextend -r or lvextend + resize2fs/xfs_growfs to grow filesystem',
    ],
    interviewFocus: [
      'How do you extend a disk volume on a production Linux server without downtime?',
      'Why are UUIDs preferred over device names in /etc/fstab?',
      'What is LVM and why would you use it over raw partitions?',
      'A server\'s disk is full but df -h shows free space — what do you check?',
    ],
  };
}
