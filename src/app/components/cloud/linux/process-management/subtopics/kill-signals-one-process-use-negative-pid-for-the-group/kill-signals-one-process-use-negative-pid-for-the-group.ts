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
  templateUrl: './kill-signals-one-process-use-negative-pid-for-the-group.html',
  styleUrl: './kill-signals-one-process-use-negative-pid-for-the-group.scss'
})
export class KillSignalsOneProcessUseNegativePidForTheGroupSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own graceful-shutdown pattern assumes one PID means one process',
      points: [
        'The main page\'s own "Graceful then force pattern" example is written entirely around a single PID: "kill -15 "$PID"... kill -0 "$PID" 2>/dev/null && kill -9 "$PID"." Every command in the pattern operates on exactly one process identifier, with no mention of what happens when the thing being terminated is actually MORE than one process.',
        'Nothing on the main page connects this to something its own Job Control section already covers — a background job like a pipeline (cmd1 | cmd2 &) — or explains that $! (the shell variable holding "the most recently backgrounded PID," used throughout the main page\'s own job-control examples) only ever captures ONE of potentially several processes actually running under that one job.',
      ]
    },
    {
      heading: 'Confirmed: kill with a plain PID signals exactly that process — a negative PID targets the whole group instead',
      points: [
        'Per POSIX\'s own kill specification: "if a PID is negative (but not -1), the signal is sent to all processes whose process group ID is equal to the absolute value of that PID." A positive PID and its negated form are NOT interchangeable shorthand for the same thing — they target fundamentally different scopes, one specific process versus an entire group.',
        'A pipeline like cmd1 | cmd2 & creates MULTIPLE processes that the shell places into a single process group — but $! only ever stores the PID of the LAST command started in that pipeline (or, depending on shell, the group leader), never a list of every process actually involved. kill "$!" after backgrounding a pipeline signals only that one captured PID, leaving any other processes in the same pipeline completely untouched and still running.',
        'To signal the entire group at once, the syntax requires either putting the signal name first or using -- specifically to avoid the negative number being misparsed as a signal number instead of a target: confirmed via documented syntax, "kill -SIGTERM -2500" or "kill -- -2500" — omitting both of these and just writing kill -2500 is genuinely ambiguous to the command and will not do what\'s intended.',
      ]
    },
    {
      heading: 'Why this specifically bites the main page\'s own graceful-shutdown pattern',
      points: [
        'Applying the main page\'s own "kill -15 "$PID"; sleep 5; kill -0 "$PID" ... kill -9" pattern to a backgrounded pipeline sends SIGTERM to only the ONE process $! captured — if an earlier stage of that pipeline is still running (e.g. a slow producer feeding a fast consumer that already exited), it never receives any signal at all and keeps running as an orphaned, undetected leftover process.',
        'The fix is targeting the process GROUP instead of the single captured PID, using the negative-PID syntax: kill -TERM -- -"$PID" (or, more robustly, capturing the actual process group ID separately rather than assuming it always equals $!, since that assumption can vary by shell and pipeline structure).',
        'A special case worth knowing, confirmed via the same POSIX-adjacent documentation: "a \'-1\' process group is special, and the signal to it will fan out the signal to all processes on the system except the PID 1 process" — meaning kill -- -1 is an extremely dangerous, system-wide command, not a normal target for anything short of a deliberate, carefully-considered full-system signal broadcast.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A pipeline job where killing $! leaves part of it running',
      language: 'bash',
      code: `# A backgrounded pipeline -- multiple processes, one job:
tail -f access.log | grep --line-buffered ERROR | mail -s alerts ops@example.com &
PID=$!
echo "Backgrounded PID: $PID"

# Per the shell's own behavior, $PID here captures only ONE of the
# three processes actually running (commonly the LAST command in
# the pipeline, or the group leader depending on shell) --
# confirm with a process-tree view:
ps --forest -o pid,ppid,pgid,cmd

# Main page's own graceful-shutdown pattern, applied naively:
kill -15 "$PID"
sleep 5
kill -0 "$PID" 2>/dev/null && kill -9 "$PID"

# Check what's ACTUALLY still running afterward:
ps --forest -o pid,ppid,pgid,cmd | grep -E "tail|grep|mail"
# tail -f access.log        <-- STILL RUNNING -- kill "$PID" never
#                                touched this earlier pipeline stage
#                                at all, since it was never the one
#                                PID captured in $!`,
    },
    {
      label: 'Signaling the whole process group with a negative PID',
      language: 'bash',
      code: `# Per POSIX's own kill specification: "if a PID is negative (but
# not -1), the signal is sent to all processes whose process group
# ID is equal to the absolute value of that PID."

# Re-run the same pipeline, this time targeting the GROUP:
tail -f access.log | grep --line-buffered ERROR | mail -s alerts ops@example.com &
PID=$!

# Syntax note: the signal must come first, OR use -- before the
# negative number -- confirmed via documented usage: "kill -SIGTERM
# -2500" or "kill -- -2500" -- a bare "kill -2500" is genuinely
# ambiguous (looks like signal number 2500) and will not work:
kill -TERM -- -"$PID"
sleep 5
kill -0 -- -"$PID" 2>/dev/null && kill -9 -- -"$PID"

# Confirm the ENTIRE pipeline is gone this time:
ps --forest -o pid,ppid,pgid,cmd | grep -E "tail|grep|mail"
# (no output -- all three processes terminated together)

# EXTREME CAUTION: "-1" is a special, reserved process group value
# that broadcasts to almost the entire system -- per documented
# behavior, "the signal to it will fan out the signal to all
# processes on the system except the PID 1 process." Never type
# kill -- -1 casually; it is not a normal per-job target.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A backup script starts a compression pipeline in the background — tar cf - /data | gzip > backup.tar.gz & — and stores $! to allow the calling script to cancel it if a timeout is reached. When the timeout fires, the script runs the main page\'s own graceful-then-force pattern against that stored PID: kill -15 "$PID"; sleep 5; kill -9 "$PID" if still running. The gzip process disappears immediately, but a runaway tar process is later found still running, consuming CPU and disk I/O, long after the script exited. Why did stopping "the job" leave part of it running, and how should the kill logic have been written?',
    hint: 'Check how many actual OS processes a pipeline like cmd1 | cmd2 creates, and which one of them $! actually captures — is it guaranteed to be every process in the pipeline, or just one specific one?',
    solution: 'A pipeline like tar cf - /data | gzip > backup.tar.gz creates TWO separate processes (tar and gzip) connected by a pipe, but $! only captures the PID of one of them (commonly the last command started) — it was never a reference to "the whole pipeline" as a single unit, even though the shell job-control commands (jobs, fg, bg) treat it as one job. Sending kill -15/-9 to that single captured PID only ever signaled gzip, leaving tar — an earlier stage in the same pipeline — completely untouched and still running, exactly as observed. The fix is targeting the entire process GROUP rather than the one captured PID, using the negative-PID syntax POSIX documents: kill -TERM -- -"$PID" (with the signal specified first, or -- before the negative number, to avoid the number being misparsed as a signal). This sends the signal to every process sharing that group\'s process group ID — both tar and gzip together — rather than just whichever single process $! happened to capture.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '$! reliably captures the PID of an entire backgrounded job, including every process in a multi-stage pipeline — killing that one PID stops the whole job.',
      reality: 'Per this subtopic\'s theory, a pipeline creates multiple separate OS processes, but $! only ever stores ONE of their PIDs — killing just that PID leaves any other stage of the pipeline running, untouched and undetected.'
    },
    {
      thought: 'A negative PID passed to kill is just an unusual or invalid way of writing a normal positive PID — the sign doesn\'t functionally change what gets targeted.',
      reality: 'Per this subtopic\'s theory, POSIX explicitly defines a negative PID as targeting an entirely different scope — the whole process GROUP sharing that group ID — not the single process the corresponding positive number would identify.'
    },
    {
      thought: 'kill -- -1 is just a way of specifying "process group 1," a normal, narrowly-scoped target like any other process group number.',
      reality: 'Per this subtopic\'s theory, -1 is specifically documented as a reserved, special case that broadcasts the signal to nearly every process on the entire system (except PID 1) — not a normal, safe target to reach for casually.'
    }
  ];
}
