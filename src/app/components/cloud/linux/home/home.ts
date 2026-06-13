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
  { title: 'Linux Fundamentals', route: '/linux', badge: 'Foundations', description: 'Linux distributions, kernel architecture, init systems, and navigating the command line.', keyPoints: ['Kernel + userland architecture', 'Major distros (Ubuntu, RHEL, Alpine)', 'systemd init system', 'Terminal emulators and shells', 'Man pages and --help'], available: false },
  { title: 'File System & Hierarchy', route: '/linux', badge: 'File System', description: 'FHS — /bin, /etc, /var, /home, /proc, /sys — understanding the Linux directory structure.', keyPoints: ['Filesystem Hierarchy Standard', '/proc and /sys virtual fs', '/etc for configuration', '/var for variable data', 'Mount points and fstab'], available: false },
  { title: 'Essential Commands', route: '/linux', badge: 'File System', description: 'ls, cd, cp, mv, rm, find, grep, sed, awk, tar — the tools every Linux user needs fluently.', keyPoints: ['ls, cd, pwd navigation', 'find with -name, -type, -exec', 'grep -r recursive search', 'sed stream editing', 'tar/gzip archiving'], available: false },
  { title: 'File Permissions & Ownership', route: '/linux', badge: 'Users & Permissions', description: 'chmod, chown, umask, sticky bit, setuid, and ACLs — Linux permission model in depth.', keyPoints: ['rwx permission bits', 'Octal notation (755, 644)', 'chown user:group', 'umask default permissions', 'setuid/setgid/sticky bit'], available: false },
  { title: 'Users & Groups', route: '/linux', badge: 'Users & Permissions', description: 'useradd, usermod, passwd, /etc/passwd, /etc/shadow, and sudo configuration.', keyPoints: ['useradd and useradd -m', '/etc/passwd and /etc/shadow', 'groups and groupadd', 'sudo and /etc/sudoers', 'su and runuser'], available: false },
  { title: 'Process Management', route: '/linux', badge: 'Process', description: 'ps, top, htop, kill, nice, jobs, nohup, and systemd service management.', keyPoints: ['ps aux and pgrep', 'kill, killall, pkill signals', 'nice and renice priority', 'jobs, bg, fg, nohup', 'systemctl start/stop/enable'], available: false },
  { title: 'System Monitoring', route: '/linux', badge: 'Process', description: 'CPU, memory, disk I/O, and network monitoring with top, vmstat, iostat, sar, and dmesg.', keyPoints: ['top / htop real-time', 'vmstat memory and swap', 'iostat disk throughput', 'sar historical metrics', 'dmesg kernel messages'], available: false },
  { title: 'Networking Commands', route: '/linux', badge: 'Networking', description: 'ip, ss, netstat, curl, wget, dig, nslookup, traceroute, and firewall management.', keyPoints: ['ip addr show', 'ss -tuln open ports', 'curl -v HTTP debugging', 'dig DNS lookup', 'traceroute path tracing'], available: false },
  { title: 'Firewall & iptables', route: '/linux', badge: 'Networking', description: 'iptables chains, rules, ufw, and nftables — controlling inbound and outbound traffic.', keyPoints: ['INPUT / OUTPUT / FORWARD chains', 'iptables -A rules', 'ufw enable/allow/deny', 'nftables modern replacement', 'Persisting rules across reboots'], available: false },
  { title: 'SSH & Remote Access', route: '/linux', badge: 'Networking', description: 'SSH key generation, config, port forwarding, and tunnelling for secure remote access.', keyPoints: ['ssh-keygen RSA/ED25519', '~/.ssh/config host aliases', 'Local and remote port forwarding', 'SCP and SFTP file transfer', 'SSH agent forwarding'], available: false },
  { title: 'Bash Scripting Basics', route: '/linux', badge: 'Shell Scripting', description: 'Variables, conditionals, loops, functions, exit codes, and writing reliable bash scripts.', keyPoints: ['#!/usr/bin/env bash', 'Variables and quoting', 'if/elif/else and test []', 'for/while loops', 'Functions and $?'], available: false },
  { title: 'Advanced Bash Scripting', route: '/linux', badge: 'Shell Scripting', description: 'Arrays, associative arrays, string manipulation, process substitution, traps, and debug mode.', keyPoints: ['Arrays and associative arrays', 'String slicing and substitution', 'trap for cleanup on exit', 'set -euo pipefail', 'Process substitution <()'], available: false },
  { title: 'Package Management', route: '/linux', badge: 'System Admin', description: 'apt/dpkg on Debian/Ubuntu, yum/dnf/rpm on RHEL, and apk on Alpine — installing, updating, auditing.', keyPoints: ['apt update && apt install', 'dpkg -l list packages', 'yum/dnf on RHEL/CentOS', 'apk add on Alpine', 'pip and npm system packages'], available: false },
  { title: 'systemd & Services', route: '/linux', badge: 'System Admin', description: 'Unit files, service lifecycle, timers, journalctl logging, and dependency ordering in systemd.', keyPoints: ['[Unit] [Service] [Install] sections', 'systemctl enable --now', 'journalctl -f follow logs', 'systemd timers vs cron', 'After= and Requires= ordering'], available: false },
  { title: 'Disk & Storage', route: '/linux', badge: 'System Admin', description: 'df, du, fdisk, lsblk, LVM, and mounting — managing disks and volumes on Linux.', keyPoints: ['df -h disk usage', 'du -sh directory size', 'lsblk block devices', 'fdisk partition table', 'LVM logical volumes'], available: false },
  { title: 'Linux Security Hardening', route: '/linux', badge: 'Reference', description: 'SELinux/AppArmor, fail2ban, auditd, minimal surface area, and CIS benchmark hardening.', keyPoints: ['SELinux enforcing mode', 'AppArmor profiles', 'fail2ban brute-force blocking', 'auditd syscall logging', 'CIS benchmark checks'], available: false },
  { title: 'Cron & Scheduling', route: '/linux', badge: 'Reference', description: 'crontab syntax, anacron, at, and scheduling background tasks reliably on Linux.', keyPoints: ['crontab -e editing', '5-field cron syntax', 'Special strings (@reboot)', 'anacron for daily/weekly', 'at for one-time jobs'], available: false },
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
