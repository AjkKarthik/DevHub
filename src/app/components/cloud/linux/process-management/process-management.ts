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
  selector: 'app-linux-process-management',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './process-management.html',
  styleUrl: './process-management.scss'
})
export class LinuxProcessManagement {

  quickRef: QuickRefItem[] = [
    { name: 'ps aux', type: 'syntax', desc: 'Show all running processes with CPU/memory' },
    { name: 'pgrep -u alice nginx', type: 'syntax', desc: 'Find nginx PIDs owned by alice' },
    { name: 'kill -15 PID', type: 'syntax', desc: 'SIGTERM — graceful shutdown request' },
    { name: 'kill -9 PID', type: 'syntax', desc: 'SIGKILL — force terminate (no cleanup)' },
    { name: 'nice -n 10 cmd', type: 'syntax', desc: 'Start cmd with niceness +10 (lower priority)' },
    { name: 'renice -n 5 -p PID', type: 'syntax', desc: 'Change priority of running process' },
    { name: 'nohup cmd &', type: 'syntax', desc: 'Run cmd immune to hangup, in background' },
    { name: 'jobs / fg / bg', type: 'syntax', desc: 'List, foreground, or background shell jobs' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Process Model',
      points: [
        'Every process has a PID (process ID), PPID (parent PID), UID (owner), and state (R=running, S=sleeping, D=uninterruptible, Z=zombie, T=stopped).',
        'Processes are created by fork() (clone parent) followed by exec() (replace with new program). This is the Unix process model.',
        'Zombie processes have finished but the parent hasn\'t called wait(). They stay in process table until the parent collects the exit status.',
        'Orphan processes whose parent exits are reparented to PID 1 (systemd/init), which reaps them.',
      ],
    },
    {
      heading: 'Signals',
      points: [
        'Signals are asynchronous notifications sent to processes. Common: SIGTERM (15) = terminate gracefully, SIGKILL (9) = force kill, SIGHUP (1) = reload config, SIGINT (2) = Ctrl+C.',
        'kill -l lists all signals. kill sends SIGTERM by default. killall name kills by name. pkill -f pattern kills by regex.',
        'SIGKILL cannot be caught, blocked, or ignored — the kernel forcibly terminates the process. Always try SIGTERM first.',
        'SIGHUP sent to daemons typically causes a config reload without restarting (nginx: kill -HUP $(cat /var/run/nginx.pid)).',
      ],
    },
    {
      heading: 'Priority and Niceness',
      points: [
        'Linux schedules processes using priority. Nice values range from -20 (highest priority) to +19 (lowest). Default is 0.',
        'Only root can lower niceness (raise priority) below 0. Any user can increase niceness (lower their own priority).',
        'nice -n 19 make runs the build at lowest priority without starving other work.',
        'Real-time scheduling (chrt -r 50 cmd) bypasses the normal scheduler for latency-sensitive tasks.',
      ],
    },
    {
      heading: 'Job Control and Background Processes',
      points: [
        'cmd & runs cmd in the background as a shell job. Jobs are tied to the shell session — they die when you log out.',
        'Ctrl+Z suspends the foreground job; bg %1 resumes it in the background; fg %1 brings it to foreground.',
        'nohup cmd & disconnects from the terminal — output goes to nohup.out. The process survives logout.',
        'disown %1 removes a job from the shell\'s job table so it won\'t receive SIGHUP when the shell exits.',
        'screen and tmux are better solutions for persistent sessions — they provide virtual terminals that survive disconnection.',
      ],
    },
    {
      heading: 'Signals and Graceful Process Termination',
      points: [
        'SIGTERM (the default signal sent by kill) requests a process to terminate gracefully, giving it the opportunity to clean up (close file handles, finish in-flight work, flush buffers) before exiting — well-behaved applications catch this signal and shut down cleanly rather than being abruptly killed.',
        'SIGKILL (kill -9) cannot be caught, blocked, or ignored by the target process — it terminates the process immediately and unconditionally at the kernel level, appropriate only as a last resort for a genuinely unresponsive process that is not honoring SIGTERM, since it gives the process no chance to clean up.',
        'SIGHUP historically signaled a terminal hangup, but is commonly repurposed by daemons to mean "reload your configuration without fully restarting" — many services (nginx, systemd itself) interpret SIGHUP this way, letting configuration changes take effect without dropping active connections.',
        'Always attempt SIGTERM first and only escalate to SIGKILL if the process does not respond within a reasonable timeout — jumping straight to kill -9 as a habit risks corrupted data or resource leaks from a process that was killed mid-operation without a chance to clean up.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ps & pgrep',
      language: 'bash',
      code: `# ps — process snapshot
ps aux                         # all processes: user, PID, CPU, MEM, command
ps aux --sort=-%mem | head -10 # top 10 by memory
ps -ef                         # full format: PPID visible
ps -p 1234 -o pid,ppid,cmd     # specific PID, custom columns
ps --forest                    # show parent-child tree

# pgrep / pkill
pgrep nginx                    # list PIDs of nginx processes
pgrep -u www-data              # all PIDs owned by www-data
pgrep -la python               # list PID + name
pkill -f "python manage.py"    # kill by regex on full command
pkill -u alice                 # kill all alice's processes

# Process tree
pstree -p                      # show tree with PIDs
pstree -u alice                # alice's process tree`,
    },
    {
      label: 'Signals & Kill',
      language: 'bash',
      code: `# Sending signals
kill 1234                    # SIGTERM (graceful shutdown)
kill -15 1234                # same (explicit signal number)
kill -HUP 1234               # SIGHUP (reload config for daemons)
kill -9 1234                 # SIGKILL (last resort — no cleanup)
kill -STOP 1234              # pause process (SIGSTOP)
kill -CONT 1234              # resume paused process (SIGCONT)

# killall / pkill
killall nginx                # kill all processes named nginx
killall -s HUP nginx         # send HUP to all nginx
pkill -9 -t pts/0            # kill all on terminal pts/0

# Graceful then force pattern
kill -15 "$PID"
sleep 5
kill -0 "$PID" 2>/dev/null && kill -9 "$PID"
# kill -0 checks if process still exists without killing it`,
    },
    {
      label: 'Background Jobs',
      language: 'bash',
      code: `# Background execution
sleep 100 &          # run in background, prints job [1] PID
jobs                 # list shell jobs: [1]+ Running
fg %1                # bring job 1 to foreground
bg %1                # send suspended job to background
Ctrl+Z               # suspend foreground job (sends SIGSTOP)

# nohup — survive logout
nohup python3 server.py > server.log 2>&1 &
nohup long-task.sh &          # output to nohup.out

# disown — detach from shell
long-task &
disown %1            # job no longer gets SIGHUP on shell exit

# nice / renice
nice -n 19 make -j4                    # compile at low priority
sudo nice -n -5 latency-sensitive-app  # higher priority (needs sudo)
renice -n 10 -p 4567                   # lower running process priority
renice -n -5 -u alice                  # adjust all alice's processes`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using kill -9 as the first signal',
      wrong: 'kill -9 PID',
      right: 'kill PID (SIGTERM); wait a few seconds; then kill -9 if still running',
      explanation: 'SIGKILL prevents the process from cleaning up — closing connections, flushing buffers, removing temp files. Always try SIGTERM first and give the process time to shut down gracefully.',
    },
    {
      title: 'Running long jobs in a plain terminal without nohup',
      wrong: 'python3 train_model.py &',
      right: 'nohup python3 train_model.py > train.log 2>&1 &',
      explanation: 'A bare & job in a shell session receives SIGHUP when you disconnect and is killed. nohup makes it immune to hangup. Better still: use tmux or screen.',
    },
    {
      title: 'Confusing PID with job number',
      wrong: 'fg 1234 (trying to bring a process to foreground by PID)',
      right: 'fg %1 (job number from jobs output)',
      explanation: 'fg and bg take job numbers prefixed with %, not PIDs. Use jobs to list jobs and their %numbers. fg with a bare number may not work or behave unexpectedly.',
    },
    {
      title: 'Using ps with wrong flags for BSD vs GNU',
      wrong: 'ps -aux (adds hyphen — valid on BSD but generates warning on Linux)',
      right: 'ps aux (GNU/Linux syntax — no hyphen for BSD-style options)',
      explanation: 'ps on Linux accepts mixed-style options. ps aux (without -) uses BSD-style options. ps -ef uses Unix-style. They show similar output but the hyphen matters for some flags.',
    },
  ];

  challenge: Challenge = {
    title: 'Process Priority Queue',
    language: 'typescript',
    description: 'Simulate a simplified Linux process scheduler. Given a list of processes with PIDs, nice values, and remaining burst times, return them sorted by effective priority (lower nice = higher priority, ties broken by PID).',
    hints: [
      'Nice range is -20 to +19; lower nice = higher scheduling priority',
      'Sort by nice value ascending, then by PID ascending',
      'Return just the PIDs in scheduling order',
    ],
    starterCode: `interface Process { pid: number; nice: number; burstMs: number; }

function scheduleProcesses(procs: Process[]): number[] {
  // Return PIDs in scheduling order (highest priority first)
  // Lower nice = higher priority; ties broken by PID ascending
}

const processes: Process[] = [
  { pid: 101, nice: 5, burstMs: 200 },
  { pid: 102, nice: 0, burstMs: 150 },
  { pid: 103, nice: -5, burstMs: 300 },
  { pid: 104, nice: 0, burstMs: 100 },
];
console.log(scheduleProcesses(processes)); // [103, 102, 104, 101]`,
    solution: `interface Process { pid: number; nice: number; burstMs: number; }

function scheduleProcesses(procs: Process[]): number[] {
  return [...procs]
    .sort((a, b) => a.nice !== b.nice ? a.nice - b.nice : a.pid - b.pid)
    .map(p => p.pid);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What signal does Ctrl+C send to a running process?',
      options: ['SIGTERM (15)', 'SIGKILL (9)', 'SIGINT (2)', 'SIGHUP (1)'],
      answer: 2,
      explanation: 'Ctrl+C sends SIGINT (signal 2) to the foreground process group. Processes can catch and handle SIGINT. Ctrl+\\ sends SIGQUIT (3).',
    },
    {
      q: 'Which ps flag shows processes in a parent-child tree?',
      options: ['ps -tree', 'ps --forest', 'ps -H', 'pstree only'],
      answer: 1,
      explanation: 'ps --forest (or ps f in BSD style) displays processes in an ASCII art tree showing parent-child relationships. pstree is also available as a separate command.',
    },
    {
      q: 'A process with nice value -10 vs one with +10 — which gets more CPU?',
      options: ['Nice +10 (more friendly)', 'Nice -10 (less friendly, higher priority)', 'They are equal', 'Depends on UID'],
      answer: 1,
      explanation: 'Lower (more negative) nice values mean higher priority. Nice -20 is the highest priority, +19 is the lowest. "Nice" as in "nice to other processes" — higher nice = more giving.',
    },
    {
      q: 'What is a zombie process?',
      options: ['A process consuming 100% CPU', 'A process that has exited but not been reaped by its parent', 'A process in uninterruptible sleep', 'A process running as root with no terminal'],
      answer: 1,
      explanation: 'A zombie (Z state in ps) has terminated but its exit status has not been collected by its parent via wait(). It occupies a PID in the table but uses no CPU or memory.',
    },
    {
      q: 'What is the difference between kill -9 and kill -15 (SIGTERM)?',
      options: [
        'kill -9 sends a graceful shutdown; kill -15 forces termination',
        'kill -15 is SIGTERM (graceful shutdown request); kill -9 is SIGKILL (cannot be caught or ignored, forces immediate termination)',
        'kill -9 only works on root processes',
        'Both signals are identical; only the signal number differs',
      ],
      answer: 1,
      explanation: 'SIGTERM (15) requests a graceful shutdown — the process can catch it, clean up, and exit. SIGKILL (9) cannot be caught, blocked, or ignored — the kernel terminates the process immediately with no cleanup. Always try SIGTERM first.',
    },
    {
      q: 'Can you free up resources by directly killing a zombie process with kill -9?',
      options: [
        'Yes, kill -9 immediately removes any process table entry',
        'No — a zombie has already exited and has no running process to kill; the only fix is getting the PARENT to call wait() (or killing/fixing the parent so it does)',
        'Yes, but only for zombies older than a few minutes',
        'No, zombies can only be removed by rebooting the system',
      ],
      answer: 1,
      explanation: 'This is a common misunderstanding: a zombie is not a "stuck" running process — it has already finished executing and holds essentially no resources beyond its process table entry. kill -9 sends a signal to a running process, but there is no running process left to receive it. The entry only disappears once the PARENT calls wait() to collect the exit status, which is why the actual fix targets the parent (or its replacement, like init/systemd adopting an orphan), never the zombie entry itself.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I find and kill all processes listening on port 8080?',
      a: 'Use: fuser -k 8080/tcp (kills all processes using that port) or: lsof -ti:8080 | xargs kill. For graceful shutdown: kill -15 $(lsof -ti:8080).',
    },
    {
      q: 'What is the difference between kill, killall, and pkill?',
      a: 'kill sends a signal to a specific PID. killall sends a signal to all processes matching an exact name. pkill sends a signal to processes matching a regex pattern against the command name (or full cmdline with -f). pkill is more flexible but also more dangerous as regex may match unintended processes.',
    },
    {
      q: 'Why would a process be in D (uninterruptible sleep) state?',
      a: 'D state means the process is waiting for I/O (typically disk or NFS) and cannot be interrupted — even SIGKILL won\'t terminate it. This is intentional to prevent data corruption during I/O. If it persists, suspect a hung NFS mount, a failing disk, or kernel bug. The only fix is usually a reboot.',
    },
    {
      q: 'How do you run a process that persists after terminal close?',
      a: 'Options: (1) <strong>nohup cmd &</strong> — ignores SIGHUP, stdout goes to nohup.out; (2) <strong>screen</strong> or <strong>tmux</strong> — multiplexers that keep sessions alive; (3) <strong>disown</strong> — removes a background job from the job table; (4) <strong>setsid</strong> — starts a process in a new session; (5) run as a <strong>systemd service</strong> for production workloads. tmux/screen is best for interactive sessions; systemd for services.',
    },
    {
      q: 'What is nohup and when do you use it?',
      a: '<strong>nohup</strong> runs a command immune to SIGHUP (sent when the terminal closes). Usage: <code>nohup long-running-script.sh > output.log 2>&1 &</code>. The & backgrounds it; redirect stdout/stderr explicitly since nohup.out in the current directory may not be where you want logs. For production workloads, systemd services are preferable.',
    },
    {
      q: 'How do you list and sort processes by memory usage?',
      a: '<code>ps aux --sort=-%mem | head -20</code> shows top memory consumers. <code>ps aux --sort=-%cpu | head</code> for CPU. In <strong>top</strong>: press M to sort by memory, P for CPU, N for PID. <code>pgrep -l processname</code> finds PIDs by name. <code>pmap PID</code> shows memory map of a process. /proc/PID/smaps has detailed memory breakdown.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ps aux shows processes; kill -15 (SIGTERM) for graceful shutdown; kill -9 as last resort; nohup for processes that survive logout.',
    mustKnow: [
      'Process states: R=running, S=sleeping, D=uninterruptible, Z=zombie, T=stopped',
      'kill -15 (SIGTERM) = graceful; kill -9 (SIGKILL) = force (unblockable)',
      'SIGHUP (kill -1) = reload config for daemons',
      'Nice range -20 (highest priority) to +19 (lowest); only root can go negative',
      'nohup cmd & survives logout; jobs/fg/bg control shell job table',
      'Zombie: process finished but parent hasn\'t called wait()',
    ],
    interviewFocus: [
      'What is the difference between SIGTERM and SIGKILL?',
      'How do you gracefully restart a daemon without downtime?',
      'What causes zombie processes and how do you clean them up?',
      'How do you run a process at lower priority to avoid impacting a production server?',
    ],
  };
}
