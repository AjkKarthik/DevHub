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
  selector: 'app-linux-file-system',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './file-system.html',
  styleUrl: './file-system.scss'
})
export class LinuxFileSystem {

  quickRef: QuickRefItem[] = [
    { name: '/etc', type: 'keyword', desc: 'System-wide configuration files (editable text)' },
    { name: '/var', type: 'keyword', desc: 'Variable data: logs, spool, cache, databases' },
    { name: '/proc', type: 'keyword', desc: 'Virtual FS — kernel and process info (read-mostly)' },
    { name: '/sys', type: 'keyword', desc: 'Virtual FS — kernel subsystem and device parameters' },
    { name: '/tmp', type: 'keyword', desc: 'Temporary files; cleared on reboot (often tmpfs in RAM)' },
    { name: '/usr', type: 'keyword', desc: 'User programs and libraries (most executables live here)' },
    { name: '/opt', type: 'keyword', desc: 'Optional/third-party software installed outside the package manager' },
    { name: 'df -h', type: 'syntax', desc: 'Show disk usage of all mounted filesystems (human-readable)' },
    { name: 'mount', type: 'syntax', desc: 'List all currently mounted filesystems' },
    { name: 'findmnt', type: 'syntax', desc: 'Display mount tree in a readable table' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Filesystem Hierarchy Standard (FHS)',
      points: [
        '/ (root) is the top of the single-directory tree. Everything — including other drives — is mounted somewhere under /.',
        '/bin and /sbin: on modern distros these are symlinks to /usr/bin and /usr/sbin (the /usr merge). Essential binaries for all users.',
        '/home: user home directories (/home/alice). Root\'s home is /root, not /home/root.',
        '/boot: kernel image (vmlinuz), initrd/initramfs, and GRUB bootloader config.',
        '/lib and /lib64: shared libraries (.so files) needed by /bin and /sbin binaries.',
      ],
    },
    {
      heading: 'Virtual Filesystems: /proc and /sys',
      points: [
        '/proc is a virtual filesystem exposing kernel and process state as files. /proc/cpuinfo, /proc/meminfo, /proc/<PID>/status.',
        'Every running process has a directory /proc/<PID>/ containing maps, fd (open file descriptors), cmdline, environ.',
        '/sys (sysfs) exposes kernel subsystem objects — block devices, network interfaces, power management. More structured than /proc.',
        'Writing to /proc/sys/ or using sysctl changes kernel parameters at runtime (e.g. sysctl -w vm.swappiness=10).',
      ],
    },
    {
      heading: '/etc — Configuration',
      points: [
        '/etc/passwd: one line per user account. Format: username:x:UID:GID:GECOS:home:shell.',
        '/etc/shadow: hashed passwords, expiry. Only readable by root (or shadow group).',
        '/etc/fstab: static mount table — filesystems to mount at boot (device, mountpoint, type, options, dump, pass).',
        '/etc/hosts: local DNS overrides. /etc/resolv.conf: nameserver addresses. /etc/nsswitch.conf: name resolution order.',
        '/etc/sudoers: sudo rules. Always edit with visudo (syntax-checked). /etc/sudoers.d/ for drop-in files.',
      ],
    },
    {
      heading: 'Inodes and Hard/Soft Links',
      points: [
        'An inode stores metadata (permissions, owner, timestamps, data block pointers) but NOT the filename. Filenames are directory entries pointing to inodes.',
        'Hard link: another directory entry pointing to the same inode. Deleting one does not remove data until all hard links are gone (inode nlink = 0).',
        'Symbolic (soft) link: a file whose content is a path string. Dangling symlinks point to non-existent targets.',
        'ln target link_name creates a hard link; ln -s target link_name creates a symlink.',
        'ls -li shows inode numbers; files with the same inode number are hard links to each other.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Navigation & Inspection',
      language: 'bash',
      code: `# Show mounted filesystems and usage
df -h                          # human-readable sizes
df -hT                         # include filesystem type
findmnt                        # tree view of mounts
mount | grep "^/dev"           # only real block devices

# Explore /proc
cat /proc/cpuinfo              # CPU model, cores, features
cat /proc/meminfo              # RAM and swap details
cat /proc/version              # kernel version string
ls /proc/$$                    # $$ = current shell PID
cat /proc/$$/cmdline | tr '\\0' ' '  # process command line

# Explore /sys
ls /sys/class/net/             # network interfaces
cat /sys/class/net/eth0/speed  # NIC speed in Mbps
ls /sys/block/                 # block devices`,
    },
    {
      label: '/etc Config Files',
      language: 'bash',
      code: `# /etc/passwd — user accounts
# username:x:UID:GID:GECOS:homedir:shell
grep "^www-data" /etc/passwd

# /etc/fstab — auto-mount at boot
cat /etc/fstab
# UUID=abc123  /data  ext4  defaults,nofail  0  2

# Mount a filesystem manually
sudo mount -t ext4 /dev/sdb1 /mnt/data
sudo mount -o remount,ro /mnt/data  # remount read-only
sudo umount /mnt/data

# Create and mount a tmpfs (in-memory filesystem)
sudo mount -t tmpfs -o size=512M tmpfs /tmp/ramdisk

# /etc/resolv.conf
cat /etc/resolv.conf       # nameserver entries
# nameserver 8.8.8.8`,
    },
    {
      label: 'Inodes & Links',
      language: 'bash',
      code: `# View inode information
ls -li /etc/passwd         # inode number is first column
stat /etc/passwd           # full metadata: inode, blocks, times

# Hard link
ln /etc/hosts /tmp/hosts_hardlink
ls -li /etc/hosts /tmp/hosts_hardlink  # same inode number

# Symbolic link
ln -s /var/log /tmp/logs_link
ls -la /tmp/logs_link      # shows -> /var/log
readlink -f /tmp/logs_link # resolve to absolute path

# Find all hard links to an inode
find / -inum 12345 2>/dev/null

# Check filesystem type
stat -f /home              # filesystem type and block size
file -s /dev/sda1          # filesystem superblock info`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Storing application data in /tmp',
      wrong: 'mkdir /tmp/myapp && store persistent data there',
      right: 'Use /var/lib/myapp or /opt/myapp for persistent data',
      explanation: '/tmp is cleared on reboot on most systems (often a tmpfs in RAM). Never put data you need to survive a reboot in /tmp.',
    },
    {
      title: 'Editing /etc/passwd directly for passwords',
      wrong: 'vi /etc/passwd to change a password hash',
      right: 'Use passwd username to change passwords',
      explanation: 'Password hashes are in /etc/shadow, not /etc/passwd (the x placeholder). Use passwd, usermod, or chpasswd — never edit shadow directly.',
    },
    {
      title: 'Confusing hard links and symlinks',
      wrong: 'ln target link (expecting a symlink)',
      right: 'ln -s target link (for symlinks)',
      explanation: 'Without -s, ln creates a hard link (same inode, cannot cross filesystems, cannot link directories). Symlinks are more flexible and are what most people mean.',
    },
    {
      title: 'Writing to /proc or /sys without sysctl',
      wrong: 'echo 10 > /proc/sys/vm/swappiness',
      right: 'sysctl -w vm.swappiness=10 and persist in /etc/sysctl.conf',
      explanation: 'Direct echo to /proc/sys works immediately but the change is lost on reboot. sysctl -w + /etc/sysctl.d/ makes it permanent.',
    },
    {
      title: 'Using /usr/local/ for package manager installs',
      wrong: 'sudo apt install into a custom /usr/local prefix',
      right: '/usr/local is for manually compiled software, not packages',
      explanation: '/usr/local/bin, /usr/local/lib are by convention for software compiled from source. Package manager files go under /usr. Mixing them causes conflicts.',
    },
  ];

  challenge: Challenge = {
    title: 'FHS Path Classifier',
    language: 'typescript',
    description: 'Write a function that takes an absolute Linux path and returns which FHS category it belongs to: "config", "variable", "virtual", "binaries", "user-data", or "other".',
    hints: [
      'Use startsWith to check path prefixes',
      '/proc and /sys are virtual; /etc is config; /var is variable; /home and /root are user-data',
      'Handle /usr/bin, /bin, /sbin, /usr/sbin as binaries',
    ],
    starterCode: `function classifyPath(path: string): string {
  // Return: "config" | "variable" | "virtual" | "binaries" | "user-data" | "other"
}

console.log(classifyPath('/etc/nginx/nginx.conf')); // config
console.log(classifyPath('/var/log/syslog'));        // variable
console.log(classifyPath('/proc/meminfo'));          // virtual
console.log(classifyPath('/usr/bin/python3'));       // binaries
console.log(classifyPath('/home/alice/.bashrc'));    // user-data`,
    solution: `function classifyPath(path: string): string {
  if (path.startsWith('/etc')) return 'config';
  if (path.startsWith('/var')) return 'variable';
  if (path.startsWith('/proc') || path.startsWith('/sys')) return 'virtual';
  if (path.startsWith('/bin') || path.startsWith('/sbin') ||
      path.startsWith('/usr/bin') || path.startsWith('/usr/sbin') ||
      path.startsWith('/usr/local/bin')) return 'binaries';
  if (path.startsWith('/home') || path.startsWith('/root')) return 'user-data';
  return 'other';
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What type of filesystem is /proc?',
      options: ['ext4 partition on disk', 'Virtual filesystem in memory', 'NFS network mount', 'tmpfs swap'],
      answer: 1,
      explanation: '/proc is a virtual filesystem (procfs) maintained by the kernel entirely in memory. There is no disk backing it.',
    },
    {
      q: 'Where should system-wide log files be stored according to FHS?',
      options: ['/tmp/logs', '/etc/logs', '/var/log', '/usr/log'],
      answer: 2,
      explanation: '/var/log is the FHS-specified location for variable log data. Logs are "variable" because they grow over time.',
    },
    {
      q: 'What does a hard link share with its original file?',
      options: ['The filename', 'The inode', 'The directory entry', 'The symlink path'],
      answer: 1,
      explanation: 'Hard links point to the same inode. They share all metadata and data blocks. Deleting one entry leaves the data accessible via other links.',
    },
    {
      q: 'Which file controls which filesystems are auto-mounted at boot?',
      options: ['/etc/mounts', '/etc/fstab', '/proc/mounts', '/sys/fs/mount'],
      answer: 1,
      explanation: '/etc/fstab (filesystem table) defines persistent mounts. /proc/mounts shows currently active mounts (read from the kernel).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the /usr merge and why was it done?',
      a: 'The /usr merge makes /bin, /sbin, /lib symlinks to /usr/bin, /usr/sbin, /usr/lib. This simplifies the hierarchy (one location for all binaries), enables atomic OS updates, and makes read-only /usr mounts practical. Most modern distros (Ubuntu 20.04+, Fedora 17+, Debian 12) have merged.',
    },
    {
      q: 'What is the difference between /var/log and journald logs?',
      a: 'Traditional text logs in /var/log are written by syslog daemons (rsyslog, syslog-ng). journald is systemd\'s binary journal stored in /var/log/journal (or /run/log/journal if not persistent). journald captures all service stdout/stderr; use journalctl to query it. Many systems run both.',
    },
    {
      q: 'How do you make a sysctl change permanent?',
      a: 'Add the setting to /etc/sysctl.conf or a file in /etc/sysctl.d/ (e.g. /etc/sysctl.d/99-custom.conf), then run sysctl --system to apply all drop-in files. The sysctl -w command applies immediately but is not persistent across reboots.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Everything under /: /etc=config, /var=variable data, /proc and /sys=virtual kernel FS, /home=users.',
    mustKnow: [
      '/etc for static configuration; /var for runtime-changing data (logs, spool)',
      '/proc and /sys are virtual in-memory filesystems — not on disk',
      'FHS puts user binaries in /usr/bin; /bin and /sbin are now symlinks on modern distros',
      '/etc/fstab defines filesystems to mount at boot',
      'Inodes store metadata; filenames are directory entries pointing to inodes',
      'Hard links share inodes; symlinks are path references that can dangle',
    ],
    interviewFocus: [
      'What is the difference between /proc and /sys?',
      'Where would you store application logs on a Linux server?',
      'Explain hard links vs symbolic links and when to use each',
      'What is /etc/fstab and what happens if it has an error?',
    ],
  };
}
