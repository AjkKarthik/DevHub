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
  selector: 'app-linux-system-monitoring',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './system-monitoring.html',
  styleUrl: './system-monitoring.scss'
})
export class LinuxSystemMonitoring {

  quickRef: QuickRefItem[] = [
    { name: 'top / htop', type: 'syntax', desc: 'Real-time CPU, memory, and process view' },
    { name: 'vmstat 1 5', type: 'syntax', desc: 'Memory, swap, CPU stats every 1s, 5 times' },
    { name: 'iostat -xz 1', type: 'syntax', desc: 'Extended I/O stats per device, 1s interval' },
    { name: 'sar -u 1 10', type: 'syntax', desc: 'CPU utilisation every 1s for 10 samples (sysstat)' },
    { name: 'free -h', type: 'syntax', desc: 'RAM and swap usage in human-readable units' },
    { name: 'df -h', type: 'syntax', desc: 'Disk usage per filesystem' },
    { name: 'dmesg -T | tail -20', type: 'syntax', desc: 'Recent kernel messages with human timestamps' },
    { name: 'lsof -n | wc -l', type: 'syntax', desc: 'Count open file descriptors system-wide' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'CPU Monitoring',
      points: [
        'Load average: the 1/5/15-minute averages of runnable + uninterruptible processes. A value equal to CPU count means 100% utilisation.',
        'top key columns: %CPU (per-process), %MEM, TIME+ (cumulative CPU), VIRT/RES/SHR (virtual, resident, shared memory).',
        'us=user, sy=system (kernel), ni=nice, id=idle, wa=iowait, hi=hardware IRQ, si=software IRQ, st=stolen (VM hypervisor).',
        'High iowait (wa) indicates disk or NFS I/O bottleneck — processes are waiting for I/O, not CPU-bound.',
      ],
    },
    {
      heading: 'Memory Monitoring',
      points: [
        'free -h shows total/used/free/buff-cache/available. "available" is the most useful: memory available without swapping (includes reclaimable cache).',
        'Linux aggressively uses free RAM as disk cache (buff/cache). This is normal and good — cached pages are reclaimed instantly under memory pressure.',
        'vmstat shows swap in/out (si/so). Non-zero si (swap in) means the system is memory-constrained and reading from swap.',
        '/proc/meminfo has detailed breakdown: MemTotal, MemFree, MemAvailable, Buffers, Cached, SwapTotal, SwapFree.',
      ],
    },
    {
      heading: 'Disk I/O Monitoring',
      points: [
        'iostat -x shows: r/s and w/s (reads/writes per second), await (average I/O wait ms), %util (device busy percentage).',
        'High %util (>70–80%) on a disk indicates I/O saturation. High await (>10ms for SSD, >20ms for HDD) indicates queueing.',
        'iotop (like top for I/O) shows which processes are consuming I/O. Run: sudo iotop -o (only active processes).',
        'blktrace and iostat together can identify which files are causing high I/O when combined with lsof.',
      ],
    },
    {
      heading: 'System Call and Kernel Monitoring',
      points: [
        'strace -p PID traces system calls made by a running process — invaluable for debugging hangs and permission errors.',
        'dmesg shows kernel ring buffer messages: hardware errors, OOM kills, filesystem errors, driver issues.',
        'lsof (list open files) shows which processes have files open, useful for finding who is writing to a log or holding a lock.',
        '/proc/<PID>/fd/ lists all file descriptors open for a process. /proc/<PID>/net/tcp shows TCP connections.',
      ],
    },
    {
      heading: 'Interpreting Load Average and Resource Metrics Correctly',
      points: [
        'The three load average numbers (1, 5, and 15-minute averages) represent the average number of processes either running or waiting for CPU/uninterruptible I/O — a load average of 4 on a 4-core system means the system is fully utilized but not necessarily overloaded, while the same value on a 2-core system indicates genuine saturation.',
        'top and htop show real-time snapshots, while tools like sar (part of sysstat) collect and retain historical performance data — essential for answering "what was resource usage like at 3am when the incident happened" rather than only being able to observe current state.',
        'Memory metrics require careful interpretation — "used" memory in Linux includes disk cache, which the kernel will readily reclaim under memory pressure; the "available" memory figure (not "free") is the more accurate indicator of genuinely usable memory for new processes.',
        'Setting up proactive alerting (rather than only checking metrics reactively during an incident) on key thresholds — sustained high load, low available memory, high disk usage — catches developing problems before they cause a user-facing outage.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CPU & Memory',
      language: 'bash',
      code: `# CPU overview
top -b -n 1 | head -20    # non-interactive snapshot
htop                       # interactive (install first: apt install htop)
mpstat -P ALL 1 3          # per-CPU stats (sysstat package)
sar -u 1 5                 # CPU utilisation history

# Memory
free -h
cat /proc/meminfo | grep -E "MemTotal|MemAvailable|SwapFree"
vmstat -s                  # summary of memory stats

# Swap usage
swapon --show              # list swap devices
vmstat 1 5                 # columns: si (swap in), so (swap out)

# Top memory consumers
ps aux --sort=-%mem | head -10
ps aux --sort=-%cpu | head -10`,
    },
    {
      label: 'Disk & I/O',
      language: 'bash',
      code: `# Disk usage
df -h                         # all mounted filesystems
df -h /var                    # specific path
du -sh /var/log/*             # size of each item in /var/log
du -ah /var/log | sort -rh | head -20   # largest files first

# I/O stats
iostat -xz 1 3                # extended stats, 1s interval, 3 times
# key: r/s, w/s, await (ms), %util

# Which process is using I/O?
sudo iotop -o                 # only active I/O
sudo lsof +D /var/log/        # who has files open in /var/log

# Inode usage (can fill up separately from disk space)
df -i                         # inode usage per filesystem`,
    },
    {
      label: 'Diagnostics',
      language: 'bash',
      code: `# Kernel messages
dmesg -T | tail -30           # recent with timestamps
dmesg -T | grep -i "error\\|oom\\|killed"

# OOM killer activity
dmesg | grep -i "out of memory"
grep -i "killed process" /var/log/syslog

# Open files
lsof -n | wc -l               # total open file descriptors
lsof -p 1234                  # files open by PID 1234
lsof -u alice                 # files open by alice
lsof -i :80                   # who is listening on port 80

# System call tracing
sudo strace -p 1234           # trace running process
strace -c ls /tmp/            # summary of syscalls made

# Network connections
ss -s                         # socket summary
ss -tp                        # TCP connections + PID
cat /proc/net/tcp             # raw TCP table`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Panicking over high buff/cache memory usage',
      wrong: 'Server is at 90% memory — need to add more RAM',
      right: 'Check "available" column in free -h; buff/cache is reclaimable',
      explanation: 'Linux uses free RAM as disk cache. "used" includes cache. "available" is the real free memory. High cache usage is normal and beneficial — it speeds up disk reads.',
    },
    {
      title: 'Using load average without considering CPU count',
      wrong: 'Load average of 8 — system is fine (has 32 cores)',
      right: 'Load / CPU count = per-core load. Load 8 on 8 cores = 100%. Load 8 on 32 cores = 25%.',
      explanation: 'Load average is not a percentage. It must be compared to the number of CPUs (nproc or /proc/cpuinfo). A load equal to CPU count means full utilisation.',
    },
    {
      title: 'Confusing %iowait with disk being busy',
      wrong: 'High wa% means the disk is at capacity',
      right: 'High wa% means CPUs are idle waiting for I/O — could be slow disk, NFS, or I/O queue depth',
      explanation: 'iowait is CPU time where at least one process is waiting for I/O and the CPU has nothing else to do. Check iostat %util to see actual device saturation.',
    },
    {
      title: 'Not checking dmesg after unexpected behaviour',
      wrong: 'Application crashed — checking only /var/log/syslog',
      right: 'dmesg -T | tail -50 often reveals OOM kills, filesystem errors, or hardware faults',
      explanation: 'The kernel ring buffer captures OOM killer events, disk errors, driver panics, and security events that never appear in application logs.',
    },
  ];

  challenge: Challenge = {
    title: 'Load Average Analyser',
    language: 'typescript',
    description: 'Write a function that takes load averages (1min, 5min, 15min) and CPU count, then returns a severity level: "ok", "warning" (>70% per core), or "critical" (>100% per core on 1min average).',
    hints: [
      'Divide each load average by CPU count to get per-core utilisation',
      'Compare the 1-minute load/cpu to thresholds 0.7 and 1.0',
      'A rising trend (1min > 5min > 15min) is more concerning than a falling one',
    ],
    starterCode: `function analyseLoad(load1: number, load5: number, load15: number, cpuCount: number): string {
  // Return "ok", "warning", or "critical"
}

console.log(analyseLoad(0.5, 0.3, 0.2, 4));  // ok
console.log(analyseLoad(3.2, 2.1, 1.5, 4));  // warning (80% per core)
console.log(analyseLoad(5.0, 3.0, 2.0, 4));  // critical (>100% per core)`,
    solution: `function analyseLoad(load1: number, load5: number, load15: number, cpuCount: number): string {
  const perCore1 = load1 / cpuCount;
  if (perCore1 >= 1.0) return 'critical';
  if (perCore1 >= 0.7) return 'warning';
  return 'ok';
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In the free -h output, which column shows truly available memory?',
      options: ['free', 'used', 'available', 'buff/cache'],
      answer: 2,
      explanation: '"available" includes reclaimable page cache. "free" only shows unused pages. On a healthy Linux system, "free" is often very low because Linux uses RAM as cache.',
    },
    {
      q: 'What does high %iowait in top indicate?',
      options: ['High CPU usage by user processes', 'CPUs waiting for I/O to complete', 'Memory swapping is occurring', 'Network I/O is saturated'],
      answer: 1,
      explanation: 'iowait (%wa in top) is the percentage of time CPUs are idle while at least one process waits for I/O. High iowait suggests disk or network I/O is the bottleneck.',
    },
    {
      q: 'Which command shows per-disk I/O utilisation percentage?',
      options: ['df -i', 'du -sh', 'iostat -x', 'vmstat -d'],
      answer: 2,
      explanation: 'iostat -x shows extended device statistics including %util (percentage of time the device was busy). Values above 70-80% indicate saturation.',
    },
    {
      q: 'How do you identify which process is consuming the most I/O?',
      options: ['top -o %MEM', 'sudo iotop -o', 'ps aux --sort=-%io', 'iostat -p'],
      answer: 1,
      explanation: 'iotop (similar to top but for I/O) shows per-process I/O rates. The -o flag shows only processes currently doing I/O rather than all processes.',
    },
    {
      q: 'What do the three load average numbers in top/uptime represent?',
      options: [
        'CPU, memory, and disk usage percentages',
        'Average number of runnable processes over the last 1, 5, and 15 minutes',
        'System uptime in days, hours, and minutes',
        'Load from user, kernel, and I/O processes',
      ],
      answer: 1,
      explanation: 'Load average represents the average number of processes in the run queue (running or waiting for CPU/disk). Three values: 1-minute, 5-minute, 15-minute averages. A value equal to CPU core count means 100% utilisation.',
    },
    {
      q: 'What does vmstat report?',
      options: [
        'Virtual machine status and hypervisor metrics',
        'Virtual memory statistics including processes, memory, swap, I/O, system calls, and CPU activity',
        'Volume manager (LVM) statistics',
        'Network interface packet statistics',
      ],
      answer: 1,
      explanation: 'vmstat provides a snapshot of system performance: run/block process counts, memory (swpd, free, buff, cache), swap in/out, disk I/O (bi/bo), system calls (in, cs), and CPU percentages (us, sy, id, wa).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I diagnose an OOM (out of memory) kill?',
      a: 'Check dmesg -T | grep -i "out of memory\\|killed process" to see OOM killer events. Also check /var/log/syslog or journalctl -k. The OOM killer selects a process to kill based on its oom_score; you can tune oom_score_adj (-1000 to 1000) in /proc/<PID>/oom_score_adj to protect critical processes.',
    },
    {
      q: 'The disk is not full but writes are failing — what to check?',
      a: 'Check inode exhaustion: df -i. Each file needs one inode; if inodes are exhausted, no new files can be created even with disk space remaining. This is common on mail servers or when many small files accumulate. The only fix is to delete files (to free inodes) or reformat with more inodes.',
    },
    {
      q: 'How do load averages relate to CPU count and scheduling?',
      a: 'Load average counts runnable + uninterruptible-sleep processes averaged over time. A load equal to CPU count = 100% utilisation with no queuing. Load above CPU count means processes queue for CPU. A rising trend (1min > 15min) is more concerning than a falling one. nproc shows CPU count.',
    },
    {
      q: 'How do you monitor disk I/O performance?',
      a: '<strong>iostat -x 1</strong> shows extended I/O stats per device: %util (device busy %), await (average I/O wait ms), r/s, w/s (reads/writes per second). <strong>iotop</strong> shows per-process I/O in real time. <strong>dstat</strong> provides combined CPU, disk, network stats. High await (>20ms for HDD, >1ms for SSD) indicates I/O bottleneck. Check <code>/sys/block/device/queue/scheduler</code> for I/O scheduler.',
    },
    {
      q: 'What historical performance data does sar provide?',
      a: '<strong>sar</strong> (System Activity Reporter from sysstat) records and reports historical performance data. <code>sar -u 1 5</code> CPU usage; <code>sar -r</code> memory; <code>sar -d</code> disk I/O; <code>sar -n DEV</code> network. Historical data in <code>/var/log/sysstat/</code>: <code>sar -f /var/log/sysstat/sa30</code> reads today\'s data. Invaluable for post-incident analysis.',
    },
    {
      q: 'How do you check memory usage breakdown in Linux?',
      a: '<code>free -h</code> shows total/used/free/available RAM and swap. <strong>available</strong> (not free) is what new processes can use — includes reclaimable buffers/cache. <code>/proc/meminfo</code> gives detailed breakdown. <strong>top</strong>/htop show per-process RSS (Resident Set Size). <code>smem</code> shows PSS (Proportional Set Size) — better for shared library accounting.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'top/htop for real-time; vmstat for memory/swap; iostat -x for disk; dmesg for kernel events; available column in free is the real free memory.',
    mustKnow: [
      'Load average / CPU count = per-core utilisation (>1.0 = over capacity)',
      '"available" in free -h is the real free memory (buff/cache is reclaimable)',
      'High %wa (iowait) = CPUs idle waiting for disk/network I/O',
      'iostat -x shows %util (device saturation) and await (I/O latency)',
      'dmesg -T reveals OOM kills, hardware errors, filesystem issues',
      'df -i checks inode usage — disks can be full of inodes even with free space',
    ],
    interviewFocus: [
      'How do you determine if a server is CPU-bound, memory-bound, or I/O-bound?',
      'What does a load average of 4.0 mean on a 4-core server?',
      'How do you find which process is causing disk I/O saturation?',
      'How do you investigate an OOM kill on a production server?',
    ],
  };
}
