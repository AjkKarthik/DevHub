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
  selector: 'app-linux-fundamentals',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss'
})
export class LinuxFundamentals {

  quickRef: QuickRefItem[] = [
    { name: 'uname -r', type: 'syntax', desc: 'Print running kernel version' },
    { name: 'lsb_release -a', type: 'syntax', desc: 'Show Linux distro name and version' },
    { name: 'man <cmd>', type: 'syntax', desc: 'Open the manual page for a command' },
    { name: '<cmd> --help', type: 'syntax', desc: 'Show brief usage info (not all commands support this)' },
    { name: 'echo $SHELL', type: 'syntax', desc: 'Show the current login shell path' },
    { name: 'which <cmd>', type: 'syntax', desc: 'Show the full path of an executable' },
    { name: 'type <cmd>', type: 'syntax', desc: 'Show how a command will be interpreted (alias/builtin/file)' },
    { name: 'history', type: 'syntax', desc: 'List recently executed commands; Ctrl+R to search' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Kernel vs Userland',
      points: [
        'The Linux kernel manages hardware (CPU scheduling, memory, I/O, device drivers). Userland is everything else — the shell, utilities, daemons.',
        'Monolithic kernel: all drivers run in kernel space for performance, but loadable kernel modules (LKMs) can be added/removed at runtime.',
        'The kernel exposes its API via system calls (read, write, mmap, fork). libc wraps these for C programs; every language ultimately uses them.',
        'Processes cannot directly access hardware — they make syscalls and the kernel handles the rest.',
      ],
    },
    {
      heading: 'Major Distributions',
      points: [
        'Debian/Ubuntu family: apt package manager, .deb packages. Ubuntu LTS (2-year support cycle) is the most common cloud/server choice.',
        'RHEL/CentOS/Fedora family: yum/dnf package manager, .rpm packages. RHEL is dominant in enterprise; CentOS Stream is its upstream.',
        'Alpine Linux: extremely small (5 MB), musl libc, apk packages. Default in Docker base images due to tiny footprint.',
        'Arch Linux: rolling release, pacman, bleeding-edge — popular for desktops and learning, not servers.',
      ],
    },
    {
      heading: 'Init Systems — systemd',
      points: [
        'PID 1 is the first process started by the kernel. systemd replaced SysV init and is now the default on almost every major distro.',
        'systemd manages the boot sequence via unit files, starts services in parallel (faster boot), and supervises running services.',
        'Targets replace runlevels: multi-user.target = text mode, graphical.target = desktop, rescue.target = single-user.',
        'journald centralises all log collection; use journalctl to query logs rather than /var/log/messages directly.',
      ],
    },
    {
      heading: 'Shell Environment',
      points: [
        'The shell (bash, zsh, sh) is a command interpreter. Bash is the default on most Linux systems.',
        'Interactive login shells source ~/.bash_profile (or ~/.profile); interactive non-login shells source ~/.bashrc.',
        'Environment variables (PATH, HOME, USER) are inherited by child processes. Shell variables are local to the shell.',
        'Readline shortcuts: Ctrl+A start-of-line, Ctrl+E end-of-line, Ctrl+R reverse history search, Ctrl+C interrupt, Ctrl+D send EOF/exit.',
      ],
    },
    {
      heading: 'The Linux Boot Process',
      points: [
        'The boot sequence proceeds: BIOS/UEFI firmware initializes hardware and locates a bootloader → the bootloader (GRUB) loads the Linux kernel into memory → the kernel initializes hardware drivers and mounts the root filesystem → the kernel starts the init system (systemd) as PID 1.',
        'systemd, as PID 1, is responsible for starting all other system services and processes according to defined units and their dependencies — understanding it as the root of the process tree clarifies why systemctl commands are the primary interface for managing what runs on a modern Linux system.',
        'Runlevels (in older SysV init systems) or systemd targets (multi-user.target, graphical.target) define which set of services should be running for a given system state — useful for understanding why a headless server boots differently than a desktop Linux installation.',
        'Kernel panics and boot failures typically require accessing boot logs (via journalctl -b for the current or previous boot, or a rescue/single-user mode) — understanding the boot sequence helps narrow down whether a failure occurred at the firmware, bootloader, kernel, or init stage.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'System Info',
      language: 'bash',
      code: `# Kernel and OS info
uname -r              # kernel version e.g. 5.15.0-91-generic
uname -a              # all: kernel + hostname + arch + date
lsb_release -a        # distro name, version, codename
cat /etc/os-release   # machine-readable distro info

# Hardware info
lscpu                 # CPU architecture, cores, cache
free -h               # RAM and swap (human-readable)
lsblk                 # block devices (disks, partitions)
lspci                 # PCI devices (GPU, NICs, etc.)

# Uptime and load
uptime                # how long running + load averages
w                     # who is logged in + what they're doing`,
    },
    {
      label: 'Getting Help',
      language: 'bash',
      code: `# Manual pages (most complete reference)
man ls                # full man page for ls
man 5 passwd          # section 5 = file formats (vs section 1 = commands)
man -k "copy file"    # search man pages by keyword (= apropos)

# Quick help
ls --help             # short usage summary (GNU tools)
info coreutils        # Info pages (GNU project, more hyperlinked)

# Shell builtins
help cd               # help for bash builtins (cd, export, etc.)
type cd               # shows: cd is a shell builtin
which python3         # finds executable in PATH

# Command history
history | grep apt    # search history for 'apt' commands
!42                   # re-run command #42 from history
!!                    # re-run last command (e.g. sudo !!)`,
    },
    {
      label: 'Distro Identification',
      language: 'bash',
      code: `# Reliable way to detect distro in a script
if [ -f /etc/os-release ]; then
  . /etc/os-release
  echo "Distro: $NAME"
  echo "Version: $VERSION_ID"
fi

# Package manager detection pattern
if command -v apt &>/dev/null; then
  echo "Debian/Ubuntu"
elif command -v dnf &>/dev/null; then
  echo "RHEL/Fedora"
elif command -v apk &>/dev/null; then
  echo "Alpine"
fi

# systemd check
systemctl --version   # check systemd is present
systemd-detect-virt   # detect if running in a VM/container`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Confusing shell vs terminal emulator',
      wrong: 'I opened "Terminal" — that\'s my shell.',
      right: 'The terminal emulator (gnome-terminal, iTerm2) hosts the shell (bash, zsh). They are separate.',
      explanation: 'The shell is the program interpreting your commands. The terminal is just the window providing a text interface to it.',
    },
    {
      title: 'Assuming root is always needed',
      wrong: 'sudo every command to be safe.',
      right: 'Only use sudo when a command actually needs elevated privileges.',
      explanation: 'Running as root bypasses all permission checks. Mistakes as root can destroy the system. Use the principle of least privilege.',
    },
    {
      title: 'Mixing up /bin and /usr/bin',
      wrong: 'Always look in /bin for commands.',
      right: 'On modern systems with /usr merge, /bin is a symlink to /usr/bin. They are the same directory.',
      explanation: 'The /usr merge (default since Ubuntu 20.04, Fedora 17, Debian 12) means /bin, /sbin, /lib are all symlinks into /usr.',
    },
    {
      title: 'Using cat to check if a command exists',
      wrong: 'cat /path/to/command',
      right: 'command -v myapp || which myapp',
      explanation: 'command -v is POSIX-portable and works for aliases/builtins. which only finds files in PATH, not shell builtins.',
    },
    {
      title: 'Editing /etc/profile directly for user settings',
      wrong: 'echo "export PATH=..." >> /etc/profile',
      right: 'echo "export PATH=..." >> ~/.bashrc  # or ~/.profile for login shells',
      explanation: '/etc/profile and /etc/environment are system-wide and affect all users. User-specific config belongs in ~/.',
    },
  ];

  challenge: Challenge = {
    title: 'System Inventory Script',
    language: 'typescript',
    description: 'Write a function that parses a simulated /etc/os-release file content (key=value lines) into a Record<string,string>, then extracts the NAME and VERSION_ID fields.',
    hints: [
      'Split on newlines, then split each line on the first = sign',
      'Strip surrounding quotes from values',
      'Return only the fields that exist',
    ],
    starterCode: `function parseOsRelease(content: string): Record<string, string> {
  // Parse /etc/os-release content (key=value pairs, values may be quoted)
  // e.g. NAME="Ubuntu" VERSION_ID="22.04"
}

// Test
const sample = \`NAME="Ubuntu"
VERSION_ID="22.04"
ID=ubuntu
ID_LIKE=debian
PRETTY_NAME="Ubuntu 22.04.3 LTS"\`;
const result = parseOsRelease(sample);
console.log(result.NAME);       // Ubuntu
console.log(result.VERSION_ID); // 22.04`,
    solution: `function parseOsRelease(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\\n')) {
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key) result[key] = val;
  }
  return result;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is PID 1 on a modern Linux system?',
      options: ['bash', 'init', 'systemd', 'kernel'],
      answer: 2,
      explanation: 'On systemd-based distros, systemd is PID 1. It is the first user-space process started by the kernel and manages all other processes.',
    },
    {
      q: 'Which command shows the running kernel version?',
      options: ['lsb_release -a', 'uname -r', 'cat /etc/version', 'kernel --version'],
      answer: 1,
      explanation: 'uname -r prints just the kernel release string (e.g. 5.15.0-91-generic). uname -a prints all system info.',
    },
    {
      q: 'What does /proc/sys/ expose?',
      options: ['Installed packages', 'Kernel tunable parameters', 'System logs', 'Network interfaces'],
      answer: 1,
      explanation: '/proc/sys/ is a virtual filesystem that exposes kernel parameters. Writing to files here (e.g. via sysctl) changes kernel behaviour at runtime.',
    },
    {
      q: 'Which shell config file is sourced for interactive non-login bash sessions?',
      options: ['~/.bash_profile', '~/.bashrc', '/etc/profile', '~/.bash_login'],
      answer: 1,
      explanation: '~/.bashrc is sourced for every new interactive non-login shell (e.g. opening a terminal in a desktop). ~/.bash_profile is only for login shells.',
    },
    {
      q: 'Which command shows the Linux kernel version?',
      options: [
        'cat /etc/os-release',
        'uname -r',
        'lsb_release -a',
        'hostnamectl',
      ],
      answer: 1,
      explanation: 'uname -r prints the running kernel release (e.g., 6.8.0-45-generic). uname -a prints all system info. /etc/os-release contains distribution info, not kernel version.',
    },
    {
      q: 'What is the /proc filesystem in Linux?',
      options: [
        'A disk partition for process core dumps',
        'A virtual filesystem exposing kernel and process information as files',
        'The directory where process binaries are stored',
        'A swap partition for process memory overflow',
      ],
      answer: 1,
      explanation: '/proc is a virtual pseudo-filesystem — no disk storage. It exposes kernel state and process info as readable files. /proc/cpuinfo, /proc/meminfo, /proc/PID/status give runtime system and process data.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a distribution and the Linux kernel?',
      a: 'The Linux kernel is just the core OS component (hardware abstraction, process scheduling, memory management). A distribution (distro) bundles the kernel with a package manager, init system, shell, utilities, and optionally a desktop environment to make a complete, installable operating system.',
    },
    {
      q: 'Why does Alpine Linux use musl libc instead of glibc?',
      a: 'musl is a lightweight, standards-compliant C library. For containers, binary size matters hugely — musl produces smaller binaries and the base Alpine image is ~5 MB vs ~30 MB for Debian. The trade-off: some glibc-dependent binaries may not run unmodified on Alpine.',
    },
    {
      q: 'Is bash always available on Linux?',
      a: 'No. Alpine Linux uses ash (busybox sh) by default. Minimal Docker images may not have bash. Always use /bin/sh (POSIX sh) for portable scripts, or explicitly install bash and use #!/usr/bin/env bash.',
    },
    {
      q: 'What are load averages in the uptime output?',
      a: 'The three numbers (e.g. 0.52 1.03 1.25) are the average number of runnable processes over the past 1, 5, and 15 minutes. A value equal to the number of CPU cores means full utilisation. Values above core count indicate queuing/overload.',
    },
    {
      q: 'What is the difference between a process and a thread in Linux?',
      a: 'A <strong>process</strong> has its own address space, file descriptors, and resources. A <strong>thread</strong> (lightweight process) shares the address space with other threads in the same process but has its own stack and registers. Linux implements threads as processes via clone() with shared resources. Multiple threads in a process see the same memory — enabling fast communication but requiring synchronisation.',
    },
    {
      q: 'How does Linux handle hardware via device files?',
      a: 'Linux exposes hardware as files in <strong>/dev</strong>. <strong>Character devices</strong> (c in ls -l) handle streaming data byte-by-byte (serial ports, terminals). <strong>Block devices</strong> (b) handle fixed-size blocks (disks). Device files have major (driver) and minor (instance) numbers. <code>mknod</code> creates them; <strong>udev</strong> creates them dynamically on device attachment.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Linux = kernel + userland; systemd is PID 1; distros differ by package manager (apt/dnf/apk).',
    mustKnow: [
      'Kernel vs userland: kernel manages hardware via syscalls, userland is everything else',
      'Major distros: Debian/Ubuntu (apt), RHEL/Fedora (dnf), Alpine (apk)',
      'systemd is PID 1 on modern Linux — manages boot and services',
      'Login shells source ~/.bash_profile; interactive shells source ~/.bashrc',
      'uname -r = kernel version; lsb_release -a = distro info',
      'man <command> is the authoritative reference for any command',
    ],
    interviewFocus: [
      'What is the role of the Linux kernel vs userland?',
      'How does systemd differ from SysV init?',
      'Why might you choose Alpine over Ubuntu in a container?',
      'Difference between /etc/profile and ~/.bashrc',
    ],
  };
}
