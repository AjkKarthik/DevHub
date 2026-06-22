import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic { title: string; route: string; badge: string; description: string; keyPoints: string[]; available: boolean; }

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'File System': 'filesystem', 'Process': 'process',
  'Networking': 'networking', 'Users & Permissions': 'users', 'Shell Scripting': 'shell',
  'System Admin': 'sysadmin', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'File System', 'Process', 'Networking', 'Users & Permissions', 'Shell Scripting', 'System Admin', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'Linux Fundamentals', route: '/linux/fundamentals', badge: 'Foundations', description: 'Linux distributions, kernel architecture, init systems, and navigating the command line.', keyPoints: ['Kernel + userland architecture', 'Major distros (Ubuntu, RHEL, Alpine)', 'systemd init system', 'Terminal emulators and shells', 'Man pages and --help'], available: true },
  { title: 'File System & Hierarchy', route: '/linux/file-system', badge: 'File System', description: 'FHS — /bin, /etc, /var, /home, /proc, /sys — understanding the Linux directory structure.', keyPoints: ['Filesystem Hierarchy Standard', '/proc and /sys virtual fs', '/etc for configuration', '/var for variable data', 'Mount points and fstab'], available: true },
  { title: 'Essential Commands', route: '/linux/essential-commands', badge: 'File System', description: 'ls, cd, cp, mv, rm, find, grep, sed, awk, tar — the tools every Linux user needs fluently.', keyPoints: ['ls, cd, pwd navigation', 'find with -name, -type, -exec', 'grep -r recursive search', 'sed stream editing', 'tar/gzip archiving'], available: true },
  { title: 'File Permissions & Ownership', route: '/linux/file-permissions', badge: 'Users & Permissions', description: 'chmod, chown, umask, sticky bit, setuid, and ACLs — Linux permission model in depth.', keyPoints: ['rwx permission bits', 'Octal notation (755, 644)', 'chown user:group', 'umask default permissions', 'setuid/setgid/sticky bit'], available: true },
  { title: 'Users & Groups', route: '/linux/users-groups', badge: 'Users & Permissions', description: 'useradd, usermod, passwd, /etc/passwd, /etc/shadow, and sudo configuration.', keyPoints: ['useradd and useradd -m', '/etc/passwd and /etc/shadow', 'groups and groupadd', 'sudo and /etc/sudoers', 'su and runuser'], available: true },
  { title: 'Process Management', route: '/linux/process-management', badge: 'Process', description: 'ps, top, htop, kill, nice, jobs, nohup, and systemd service management.', keyPoints: ['ps aux and pgrep', 'kill, killall, pkill signals', 'nice and renice priority', 'jobs, bg, fg, nohup', 'systemctl start/stop/enable'], available: true },
  { title: 'System Monitoring', route: '/linux/system-monitoring', badge: 'Process', description: 'CPU, memory, disk I/O, and network monitoring with top, vmstat, iostat, sar, and dmesg.', keyPoints: ['top / htop real-time', 'vmstat memory and swap', 'iostat disk throughput', 'sar historical metrics', 'dmesg kernel messages'], available: true },
  { title: 'Networking Commands', route: '/linux/networking', badge: 'Networking', description: 'ip, ss, netstat, curl, wget, dig, nslookup, traceroute, and firewall management.', keyPoints: ['ip addr show', 'ss -tuln open ports', 'curl -v HTTP debugging', 'dig DNS lookup', 'traceroute path tracing'], available: true },
  { title: 'Firewall & iptables', route: '/linux/firewall', badge: 'Networking', description: 'iptables chains, rules, ufw, and nftables — controlling inbound and outbound traffic.', keyPoints: ['INPUT / OUTPUT / FORWARD chains', 'iptables -A rules', 'ufw enable/allow/deny', 'nftables modern replacement', 'Persisting rules across reboots'], available: true },
  { title: 'SSH & Remote Access', route: '/linux/ssh', badge: 'Networking', description: 'SSH key generation, config, port forwarding, and tunnelling for secure remote access.', keyPoints: ['ssh-keygen RSA/ED25519', '~/.ssh/config host aliases', 'Local and remote port forwarding', 'SCP and SFTP file transfer', 'SSH agent forwarding'], available: true },
  { title: 'Bash Scripting Basics', route: '/linux/bash-scripting', badge: 'Shell Scripting', description: 'Variables, conditionals, loops, functions, exit codes, and writing reliable bash scripts.', keyPoints: ['#!/usr/bin/env bash', 'Variables and quoting', 'if/elif/else and test []', 'for/while loops', 'Functions and $?'], available: true },
  { title: 'Advanced Bash Scripting', route: '/linux/bash-advanced', badge: 'Shell Scripting', description: 'Arrays, associative arrays, string manipulation, process substitution, traps, and debug mode.', keyPoints: ['Arrays and associative arrays', 'String slicing and substitution', 'trap for cleanup on exit', 'set -euo pipefail', 'Process substitution <()'], available: true },
  { title: 'Package Management', route: '/linux/package-management', badge: 'System Admin', description: 'apt/dpkg on Debian/Ubuntu, yum/dnf/rpm on RHEL, and apk on Alpine — installing, updating, auditing.', keyPoints: ['apt update && apt install', 'dpkg -l list packages', 'yum/dnf on RHEL/CentOS', 'apk add on Alpine', 'pip and npm system packages'], available: true },
  { title: 'systemd & Services', route: '/linux/systemd', badge: 'System Admin', description: 'Unit files, service lifecycle, timers, journalctl logging, and dependency ordering in systemd.', keyPoints: ['[Unit] [Service] [Install] sections', 'systemctl enable --now', 'journalctl -f follow logs', 'systemd timers vs cron', 'After= and Requires= ordering'], available: true },
  { title: 'Disk & Storage', route: '/linux/disk-storage', badge: 'System Admin', description: 'df, du, fdisk, lsblk, LVM, and mounting — managing disks and volumes on Linux.', keyPoints: ['df -h disk usage', 'du -sh directory size', 'lsblk block devices', 'fdisk partition table', 'LVM logical volumes'], available: true },
  { title: 'Environment Variables & Shell Config', route: '/linux/environment-variables', badge: 'Shell Scripting', description: 'export, .bashrc, .profile, .bash_profile, /etc/environment, and managing PATH reliably.', keyPoints: ['export VAR=value: available to child processes', '~/.bashrc: interactive shell; ~/.profile: login shell', 'source ~/.bashrc or . ~/.bashrc reload without new shell', '/etc/environment: system-wide, no export needed', 'printenv; env | grep PATTERN'], available: true },
  { title: 'Log Analysis', route: '/linux/log-analysis', badge: 'System Admin', description: 'Analyse logs with journalctl, tail, grep, awk, and logrotate — finding errors and monitoring patterns.', keyPoints: ['journalctl -u nginx -f follow service logs', 'journalctl --since "1 hour ago"', 'grep -E "ERROR|WARN" /var/log/syslog', 'awk "{print $1}" for field extraction', 'logrotate: rotate, compress, and delete old logs'], available: true },
  { title: 'Performance Tuning', route: '/linux/performance-tuning', badge: 'System Admin', description: 'sysctl parameters, file descriptor limits, CPU governor, NUMA, and kernel boot parameters for performance.', keyPoints: ['sysctl vm.swappiness=10 reduce swap use', 'ulimit -n 65536 file descriptor limit', '/proc/sys/net/core/somaxconn: connection queue', 'CPU governor: performance vs powersave', 'numactl for NUMA-aware workloads'], available: true },
  { title: 'Vim & Text Editors', route: '/linux/vim', badge: 'Foundations', description: 'Vim modes, navigation, editing commands, and survival skills for editing config files on any server.', keyPoints: ['Normal/Insert/Visual/Command modes', ':w save; :q quit; :wq save+quit; :q! force quit', 'i insert; a append; dd delete line; yy yank; p paste', '/pattern search; n next; :%s/old/new/g replace all', 'nano: simpler alternative — ctrl+o save, ctrl+x exit'], available: true },
  { title: 'Linux Security Hardening', route: '/linux/security-hardening', badge: 'Reference', description: 'SELinux/AppArmor, fail2ban, auditd, minimal surface area, and CIS benchmark hardening.', keyPoints: ['SELinux enforcing mode', 'AppArmor profiles', 'fail2ban brute-force blocking', 'auditd syscall logging', 'CIS benchmark checks'], available: true },
  { title: 'Cron & Scheduling', route: '/linux/cron', badge: 'Reference', description: 'crontab syntax, anacron, at, and scheduling background tasks reliably on Linux.', keyPoints: ['crontab -e editing', '5-field cron syntax', 'Special strings (@reboot)', 'anacron for daily/weekly', 'at for one-time jobs'], available: true },
];

@Component({ selector: 'app-linux-home', standalone: true, imports: [RouterLink], templateUrl: './home.html', styleUrl: './home.scss' })
export class LinuxHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
