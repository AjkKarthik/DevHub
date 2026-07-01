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
  selector: 'app-linux-performance-tuning',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './performance-tuning.html',
  styleUrl: './performance-tuning.scss'
})
export class LinuxPerformanceTuning {

  quickRef: QuickRefItem[] = [
    { name: 'sysctl -a | grep tcp', type: 'syntax', desc: 'Show all TCP-related kernel parameters' },
    { name: 'sysctl -w net.core.somaxconn=65535', type: 'syntax', desc: 'Set max socket listen backlog' },
    { name: 'ulimit -n 65536', type: 'syntax', desc: 'Set max open file descriptors for current shell' },
    { name: 'perf top', type: 'syntax', desc: 'CPU performance profiler (like top but per function)' },
    { name: 'vmstat 1', type: 'syntax', desc: 'Memory, swap, and CPU stats every second' },
    { name: 'numactl --hardware', type: 'syntax', desc: 'Show NUMA topology' },
    { name: 'cpupower frequency-info', type: 'syntax', desc: 'Show CPU frequency scaling settings' },
    { name: 'ethtool -G eth0 rx 4096 tx 4096', type: 'syntax', desc: 'Set NIC ring buffer size' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Kernel Tuning with sysctl',
      points: [
        'sysctl reads/writes kernel parameters at runtime. /proc/sys/ is the backing filesystem. Changes with -w are temporary; /etc/sysctl.conf or /etc/sysctl.d/*.conf persist across reboots.',
        'Key network params: net.core.somaxconn (listen backlog), net.ipv4.tcp_max_syn_backlog, net.core.rmem_max / wmem_max (socket buffer sizes).',
        'TCP tuning: net.ipv4.tcp_tw_reuse=1 (reuse TIME_WAIT sockets), net.ipv4.tcp_fin_timeout=15 (FIN wait time), net.ipv4.ip_local_port_range = 1024 65535 (ephemeral ports).',
        'vm.swappiness=10 prefers RAM over swap (good for databases). vm.dirty_ratio / vm.dirty_background_ratio control write-back thresholds.',
      ],
    },
    {
      heading: 'File Descriptor Limits',
      points: [
        'Linux limits open file descriptors per process (default 1024) and system-wide. High-traffic servers need much larger limits.',
        'ulimit -n shows current limit. ulimit -n 65536 sets it for the current shell.',
        'Persistent: edit /etc/security/limits.conf: "nginx soft nofile 65536" and "nginx hard nofile 65536". Or in systemd unit: LimitNOFILE=65536.',
        'System-wide: sysctl fs.file-max = total FDs allowed across all processes. Check current usage: cat /proc/sys/fs/file-nr.',
      ],
    },
    {
      heading: 'CPU Scheduling and NUMA',
      points: [
        'nice / renice and chrt adjust scheduling priority. Real-time scheduling (SCHED_FIFO) prevents latency spikes for time-sensitive tasks.',
        'taskset -c 2,3 cmd pins a process to CPUs 2 and 3 (CPU affinity). Avoids cache thrashing from process migration.',
        'NUMA (Non-Uniform Memory Access): on multi-socket systems, memory access latency varies. numactl --membind=0 --cpunodebind=0 keeps a process on one NUMA node.',
        'turbo boost and frequency scaling: cpupower frequency-set -g performance sets the CPU governor (disables power-saving frequency reduction, good for latency).',
      ],
    },
    {
      heading: 'I/O Scheduling and Memory',
      points: [
        'I/O schedulers: mq-deadline (default SSD), bfq (fairness), none (NVMe/fast SSD). Check: cat /sys/block/sda/queue/scheduler.',
        'Transparent Huge Pages (THP): echo madvise > /sys/kernel/mm/transparent_hugepage/enabled. Databases often prefer THP disabled (always=never).',
        'Huge pages: HugePages_Total in /proc/meminfo. Configure: vm.nr_hugepages=1024 in sysctl.conf. Reduces TLB misses for large memory applications.',
        'RAID / TRIM: discard option in fstab enables TRIM for SSDs (ext4, xfs). fstrim -v / manually runs TRIM.',
      ],
    },
    {
      heading: 'Identifying the Actual Bottleneck Before Tuning',
      points: [
        'Performance tuning without first identifying the actual bottleneck (CPU, memory, disk I/O, or network) risks optimizing a component that was never the constraint — top, vmstat, iostat, and iotop each reveal a different dimension of system resource usage, and checking all of them is necessary before assuming which one is the problem.',
        'High CPU load average does not always mean CPU is the bottleneck — load average on Linux includes processes waiting on uninterruptible I/O, so a high load average with low actual CPU utilization often points to disk I/O contention rather than CPU saturation.',
        'Memory pressure manifesting as swap usage (visible in vmstat or free) is a strong signal that available RAM is insufficient for the current workload — sustained swapping severely degrades performance since disk access is orders of magnitude slower than RAM access.',
        'strace and perf provide deeper, syscall-level and CPU-profiling-level visibility respectively when higher-level tools (top, vmstat) do not reveal the root cause — reserved for genuinely difficult performance investigations where the bottleneck is not obvious from standard system monitoring.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'sysctl Network Tuning',
      language: 'bash',
      code: `# View current values
sysctl net.core.somaxconn
sysctl -a | grep tcp_max_syn

# High-connection server tuning
# /etc/sysctl.d/99-network.conf

cat << 'EOF' | sudo tee /etc/sysctl.d/99-network.conf
# Max socket listen backlog
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535

# TCP TIME_WAIT tuning
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15

# Ephemeral port range
net.ipv4.ip_local_port_range = 1024 65535

# Socket buffer sizes (bytes) — for high-throughput
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728

# Connection tracking for busy servers
net.netfilter.nf_conntrack_max = 1048576
EOF

sudo sysctl --system          # apply all .conf files`,
    },
    {
      label: 'File Descriptors & ulimit',
      language: 'bash',
      code: `# Check current limits
ulimit -n                         # open files (soft limit)
ulimit -Hn                        # hard limit
cat /proc/sys/fs/file-max         # system-wide max
cat /proc/sys/fs/file-nr          # current usage

# Set for current session
ulimit -n 65536

# Permanent in /etc/security/limits.conf
sudo tee -a /etc/security/limits.conf << 'EOF'
# Nginx limits
nginx     soft    nofile  65536
nginx     hard    nofile  65536
# All users
*         soft    nofile  32768
*         hard    nofile  65536
EOF

# In systemd service unit
# [Service]
# LimitNOFILE=65536

# Check process FD limit
cat /proc/$(pgrep nginx | head -1)/limits | grep "open files"

# System-wide file descriptor limit
sysctl fs.file-max
sudo sysctl -w fs.file-max=2097152`,
    },
    {
      label: 'CPU & I/O',
      language: 'bash',
      code: `# CPU governor (performance vs powersave)
cpupower frequency-info              # current governor
sudo cpupower frequency-set -g performance   # disable freq scaling
sudo cpupower frequency-set -g powersave     # re-enable

# Process pinning (CPU affinity)
taskset -c 0,1 nginx              # pin nginx to CPUs 0 and 1
taskset -c 0-3 mydb               # pin to CPUs 0-3
taskset -p -c 2,3 1234            # set affinity of running PID

# I/O scheduler per device
cat /sys/block/sda/queue/scheduler
echo mq-deadline | sudo tee /sys/block/sda/queue/scheduler
echo none | sudo tee /sys/block/nvme0n1/queue/scheduler  # NVMe

# Disable THP (for databases like Redis/MongoDB)
echo never | sudo tee /sys/kernel/mm/transparent_hugepage/enabled
# Persist: add to /etc/rc.local or via tuned profile

# perf profiling
sudo perf top                      # live CPU hotspot view
sudo perf record -g -p 1234 sleep 30  # record 30s profile
sudo perf report                   # analyse

# Tune disk read-ahead
sudo blockdev --setra 256 /dev/sda  # 256 sectors = 128 KB`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Setting sysctl without persisting to sysctl.conf',
      wrong: 'sysctl -w net.core.somaxconn=65535 (lost on reboot)',
      right: 'echo "net.core.somaxconn = 65535" >> /etc/sysctl.d/99-app.conf && sysctl --system',
      explanation: 'sysctl -w modifies the running kernel only. After reboot, values return to defaults. Write to /etc/sysctl.d/*.conf and run sysctl --system to apply and persist.',
    },
    {
      title: 'Increasing ulimit in shell without updating limits.conf',
      wrong: 'ulimit -n 65536 (only for current shell session)',
      right: 'Add to /etc/security/limits.conf or systemd unit LimitNOFILE=65536',
      explanation: 'ulimit changes are per-shell-session. Daemons started by systemd do not inherit shell ulimits. Set LimitNOFILE in the service unit or /etc/security/limits.conf for persistent service limits.',
    },
    {
      title: 'Using performance governor without considering power/thermal',
      wrong: 'Set performance governor on laptop/shared server, causing thermal throttling',
      right: 'Use performance governor on dedicated high-performance servers; powersave on power-sensitive systems',
      explanation: 'The performance governor disables CPU frequency scaling and keeps cores at max frequency. This increases power consumption and heat. On laptops or thermally-constrained servers, thermal throttling can actually reduce performance.',
    },
    {
      title: 'Leaving Transparent Huge Pages enabled for databases',
      wrong: 'Default THP=always for Redis/MongoDB/PostgreSQL',
      right: 'echo never > /sys/kernel/mm/transparent_hugepage/enabled for memory-sensitive databases',
      explanation: 'THP consolidates small memory pages into large ones asynchronously. The consolidation process causes periodic latency spikes unacceptable for databases. Redis, MongoDB, and Oracle explicitly recommend disabling THP.',
    },
  ];

  challenge: Challenge = {
    title: 'sysctl Config Parser',
    language: 'typescript',
    description: 'Write a function that parses a sysctl.conf file (KEY = VALUE format, # comments) and returns a map of parameter names to their values. Parameters can be dotted paths like net.core.somaxconn.',
    hints: [
      'Skip blank lines and lines starting with #',
      'Split on = (trim whitespace around both key and value)',
      'Values can be strings, numbers, or space-separated lists',
    ],
    starterCode: `function parseSysctl(content: string): Map<string, string> {
  // Parse sysctl.conf format: key = value, # comments
}

const conf = \`# Network tuning
net.core.somaxconn = 65535
net.ipv4.tcp_tw_reuse = 1
# vm settings
vm.swappiness = 10
net.ipv4.tcp_rmem = 4096 87380 16777216\`;

const params = parseSysctl(conf);
console.log(params.get('net.core.somaxconn')); // "65535"
console.log(params.get('net.ipv4.tcp_rmem'));  // "4096 87380 16777216"`,
    solution: `function parseSysctl(content: string): Map<string, string> {
  const result = new Map<string, string>();

  for (const line of content.split('\\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();

    if (key) result.set(key, val);
  }

  return result;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does net.core.somaxconn control?',
      options: [
        'Maximum number of TCP connections',
        'Maximum socket listen backlog queue size',
        'Maximum socket receive buffer',
        'Number of network interfaces',
      ],
      answer: 1,
      explanation: 'somaxconn is the maximum size of the listen backlog for accept(). If a server receives more incoming connections than this before accept() processes them, new connections are dropped. Default is 128 — too low for busy servers.',
    },
    {
      q: 'Which file persists sysctl settings across reboots?',
      options: ['/proc/sys/', '/etc/sysctl.conf or /etc/sysctl.d/*.conf', '/etc/network/sysctl', '/var/lib/sysctl.d/'],
      answer: 1,
      explanation: 'sysctl -w modifies /proc/sys/ (in-memory). For persistence, write KEY = VALUE to /etc/sysctl.d/*.conf (or /etc/sysctl.conf). Apply with sysctl --system without rebooting.',
    },
    {
      q: 'Why do databases like Redis recommend disabling Transparent Huge Pages?',
      options: [
        'THP is incompatible with Redis data structures',
        'THP defragmentation causes periodic latency spikes',
        'THP uses too much disk space',
        'THP reduces network throughput',
      ],
      answer: 1,
      explanation: 'The kernel asynchronously defragments memory into huge pages (khugepaged). This background work causes unpredictable latency spikes — milliseconds to tens of milliseconds. Databases require consistent sub-millisecond latency.',
    },
    {
      q: 'What does taskset -c 0,1 nginx do?',
      options: [
        'Sets nginx priority to 0 and 1',
        'Pins nginx processes to CPU cores 0 and 1',
        'Allocates memory from NUMA nodes 0 and 1',
        'Limits nginx to 2 connections',
      ],
      answer: 1,
      explanation: 'taskset -c sets CPU affinity — constrains the process to run only on the specified CPU cores. This prevents the scheduler from migrating the process across cores, which helps CPU cache efficiency.',
    },
    {
      q: 'What does the nice value of a process control?',
      options: [
        'The memory allocation priority',
        'The CPU scheduling priority, ranging from -20 (highest priority) to 19 (lowest)',
        'The I/O priority in cgroups',
        'The process memory protection level',
      ],
      answer: 1,
      explanation: 'nice values range from -20 (most favoured, highest CPU priority) to 19 (least favoured). Regular users can only increase niceness (lower priority). Root can set negative nice values. Use: nice -n 10 cmd, renice -n 5 -p PID.',
    },
    {
      q: 'What does the vm.swappiness kernel parameter control?',
      options: [
        'The maximum swap file size',
        'The kernel tendency to use swap space (0=avoid swap, 100=aggressive swap use)',
        'The swap encryption algorithm',
        'The number of swap partitions allowed',
      ],
      answer: 1,
      explanation: 'vm.swappiness (0-200, default 60) controls how aggressively the kernel moves anonymous memory to swap. Low values keep more in RAM; high values swap more aggressively. Set in /etc/sysctl.conf: vm.swappiness=10 for workloads needing low latency.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I identify the bottleneck: CPU, memory, I/O, or network?',
      a: 'CPU-bound: top shows high %cpu, low %iowait. Memory-bound: vmstat shows non-zero si (swap in), low "available" in free -h. I/O-bound: top shows high %iowait, iostat shows high %util and await. Network-bound: ss -s shows large queues, sar -n DEV shows high rx/tx near interface capacity. Start with top + vmstat + iostat running simultaneously.',
    },
    {
      q: 'What is the difference between soft and hard limits in limits.conf?',
      a: 'Soft limit is the default limit — processes can increase it up to the hard limit without privileges. Hard limit is the ceiling only root can increase. Syntax: "username soft nofile 65536" and "username hard nofile 65536". A process can call setrlimit to raise its own soft limit to the hard limit.',
    },
    {
      q: 'How do I profile a slow application to find the bottleneck?',
      a: 'Start with perf top to see CPU hotspots by function. Use strace -c -p PID to see which syscalls consume time. For I/O: iotop -p PID or lsof -p PID. For memory: valgrind --tool=massif or /usr/bin/time -v. For profiling at the code level, use language-specific tools (perf for C, async_profiler for Java, cProfile for Python).',
    },
    {
      q: 'What do the three load average numbers mean?',
      a: 'Load average shows the average number of processes in the run queue (running + waiting for CPU or uninterruptible I/O) over 1, 5, and 15 minutes. A value equal to the number of CPU cores = 100% utilisation. Above that = overloaded; below = idle headroom. High 1-min with low 15-min = short spike; high 15-min = sustained load.',
    },
    {
      q: 'How do you identify which process is consuming the most I/O?',
      a: '<code>iotop -o</code> shows only processes actively doing I/O in real time (requires root). <code>iostat -x 1</code> shows per-device I/O stats. <code>pidstat -d 1</code> shows per-process disk I/O. For a one-shot: <code>sudo iotop -b -n 1 | head -20</code>. High await in iostat -x indicates storage latency.',
    },
    {
      q: 'What is the OOM killer and how do you protect a process from it?',
      a: 'The OOM (Out-of-Memory) killer terminates processes when the system runs out of memory. It selects victims based on <strong>oom_score</strong> (high score = more likely to be killed). Protect a critical process: <code>echo -17 > /proc/PID/oom_adj</code> or <code>echo -1000 > /proc/PID/oom_score_adj</code>. To completely disable OOM killing (risky): <code>echo 2 > /proc/sys/vm/overcommit_memory</code>.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'sysctl for kernel params (persist to sysctl.d/); ulimit/LimitNOFILE for FD limits; THP off for databases; taskset for CPU affinity.',
    mustKnow: [
      'sysctl -w = temporary; /etc/sysctl.d/99-app.conf = persistent',
      'net.core.somaxconn = listen backlog (default 128 → raise to 65535 for busy servers)',
      'ulimit -n in shell is temporary; LimitNOFILE in systemd unit is service-persistent',
      'Disable THP for databases: echo never > /sys/kernel/mm/transparent_hugepage/enabled',
      'taskset -c cpu-list pins process to specific CPUs',
      'vmstat si/so > 0 = swap activity = memory pressure',
    ],
    interviewFocus: [
      'How do you increase the maximum number of open file descriptors for a service?',
      'A web server is dropping connections under load — what sysctl parameters do you tune?',
      'Why do databases like Redis explicitly disable Transparent Huge Pages?',
      'How do you determine if a server is CPU-bound, memory-bound, or I/O-bound?',
    ],
  };
}
