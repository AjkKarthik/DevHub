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
  templateUrl: './exec-tee-redirect-races-script-exit-truncating-the-log.html',
  styleUrl: './exec-tee-redirect-races-script-exit-truncating-the-log.scss'
})
export class ExecTeeRedirectRacesScriptExitTruncatingTheLogSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents exec > >(tee log) as a self-contained, complete logging pattern',
      points: [
        'The main page\'s own Parallel & Advanced code tab shows: <code>exec > >(tee /tmp/deploy.log) 2>&1</code> followed by the comment "This goes to both terminal and log" — presented as a complete, working technique with no caveats. Nothing on the page mentions that this specific combination has a well-documented, real race condition.',
      ]
    },
    {
      heading: 'Why this specific pattern races: the tee process runs asynchronously',
      points: [
        'Process substitution (<code>>(cmd)</code>) starts <code>cmd</code> — here, <code>tee</code> — as a genuinely separate, asynchronous background process connected to the main script via a FIFO. The main script\'s <code>exec</code> redirect just points its own stdout/stderr at that FIFO; it does NOT wait for or otherwise synchronize with the tee process on the other end.',
        'When the main script reaches its own natural end (or exits for any reason), bash has no built-in mechanism that automatically waits for that asynchronous <code>tee</code> process to finish reading everything still buffered in the FIFO and flush it to disk. The script process can exit while tee is still mid-write.',
        'The practical consequence: the LAST few lines a script writes right before exiting — very often the most important lines, like a final "Deployment complete" or a fatal error message right before <code>exit 1</code> — can be silently missing from the log file, even though the terminal (which the tee process also writes to) may have shown them, since terminal output and file-flush timing don\'t behave identically.',
      ]
    },
    {
      heading: 'The fix: explicitly wait for the tee process, or synchronize with a FIFO',
      points: [
        'The most direct fix: capture the PID of the process substitution\'s tee process immediately with <code>$!</code> right after the <code>exec</code> line, and explicitly <code>wait</code> for it before the script\'s own final exit — this guarantees tee has finished flushing everything it was given before the script process actually terminates.',
        'A more robust pattern used in production scripts that need airtight guarantees is a small FIFO-based synchronization handshake: the tee process signals (by writing to a second, dedicated FIFO) that it has fully drained its input, and the main script explicitly reads from that FIFO as its very last action before exiting — ensuring the script cannot terminate until tee confirms it is done.',
        'For scripts where this level of rigor is not warranted, a much simpler (if less elegant) mitigation is a short, deliberate <code>sleep</code> immediately before the script\'s own exit — not a real fix, but often "good enough" in practice for a low-stakes deployment log, at the cost of relying on an unenforced timing assumption rather than a guarantee.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the race — the last line missing from the log',
      language: 'bash',
      code: `#!/usr/bin/env bash
set -euo pipefail

exec > >(tee /tmp/deploy.log) 2>&1

echo "Starting deployment..."
# ... deployment steps here ...
echo "Deployment complete"
# Script exits immediately after this line -- no wait, no
# synchronization with the tee process on the other end of the FIFO.

# On a fast-exiting script (or under system load, where tee's own
# scheduling gets delayed), this race can genuinely manifest as:
cat /tmp/deploy.log
# Starting deployment...
# ...deployment steps...
#                              <-- "Deployment complete" is MISSING --
#                                  the script process exited before
#                                  tee finished flushing its last write
#
# The terminal itself may have shown "Deployment complete" (terminal
# output and the file write inside tee don't share the exact same
# timing), which makes this bug especially confusing to diagnose --
# it LOOKED like it worked when you watched it run.`,
    },
    {
      label: 'The fix: capture tee\'s PID and explicitly wait for it',
      language: 'bash',
      code: `#!/usr/bin/env bash
set -euo pipefail

exec > >(tee /tmp/deploy.log) 2>&1
TEE_PID=$!                    # capture the PID of the tee process
                               # substitution created, immediately

echo "Starting deployment..."
# ... deployment steps here ...
echo "Deployment complete"

# Close the script's own redirected stdout/stderr so tee sees EOF
# and can finish reading everything that was written to it:
exec 1>&- 2>&-

# NOW explicitly wait for tee to actually finish flushing before
# the script itself exits:
wait "$TEE_PID" 2>/dev/null || true

cat /tmp/deploy.log
# Starting deployment...
# ...deployment steps...
# Deployment complete           <-- now reliably present every time`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A CI pipeline uses `exec > >(tee /tmp/build.log) 2>&1`, following the main page\'s own recommended pattern, to capture build output to both the terminal and a log file uploaded as a build artifact afterward. Occasionally — not every run, but often enough to be a real problem — the uploaded log file is missing the final "BUILD SUCCEEDED" or "BUILD FAILED" line, even though the terminal output (visible in the CI dashboard) clearly showed it. What is the actual cause, and what is the most direct fix?',
    hint: 'Think about what process is actually responsible for writing to the log file, and whether the main script process waits for that process to finish before it exits.',
    solution: 'The cause is a race condition inherent to `exec > >(tee ...)`: the `tee` process created by the process substitution runs asynchronously, connected to the main script via a FIFO, and the main script has no built-in mechanism forcing it to wait for `tee` to finish flushing everything to disk before the script itself exits. On most runs, `tee` happens to finish in time — but occasionally (more likely under system load, where process scheduling timing shifts), the main script\'s own final line (the exit-status message) is still in flight through the FIFO when the script process exits, and that last write to the log file is lost, even though it clearly appeared in the terminal (which doesn\'t share the same flush timing as the file write). The most direct fix is capturing the tee process\'s PID immediately after the exec line with `TEE_PID=$!`, then explicitly closing the script\'s own redirected file descriptors (`exec 1>&- 2>&-`) and running `wait "$TEE_PID"` as the very last action before the script exits — this guarantees the script process cannot terminate until tee has actually finished flushing everything it was given.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '`exec > >(tee logfile) 2>&1` is a complete, self-contained way to log all output — once the command runs, the log file is guaranteed to contain everything the script wrote.',
      reality: 'Per this subtopic\'s theory, the tee process substitution runs asynchronously and is never automatically waited for — the script can exit before tee finishes flushing its last writes, silently dropping the final lines from the log file.'
    },
    {
      thought: 'If a script\'s log file is missing its final line, the bug must be in the logic that produces that final line (a conditional that was skipped, an early return, etc.).',
      reality: 'Per this subtopic\'s theory, a missing final line from an exec > >(tee ...) setup is a strong signal of the async-tee race condition specifically — the line was genuinely produced by the script, it just never finished being written to the file before the process exited.'
    },
    {
      thought: 'Because terminal output showed the expected final line, the log file capturing the same stream must also contain it.',
      reality: 'Per this subtopic\'s theory, terminal display and the tee process\'s file write do not share identical flush timing — a line can visibly appear on screen while the corresponding write to the log file is still in flight and gets lost when the script exits before tee finishes.'
    }
  ];
}
