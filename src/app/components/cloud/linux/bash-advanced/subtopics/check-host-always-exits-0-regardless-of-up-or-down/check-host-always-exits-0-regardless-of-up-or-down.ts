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
  templateUrl: './check-host-always-exits-0-regardless-of-up-or-down.html',
  styleUrl: './check-host-always-exits-0-regardless-of-up-or-down.scss'
})
export class CheckHostAlwaysExits0RegardlessOfUpOrDownSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine bug hiding in the main page\'s own check_host example',
      points: [
        'The main page\'s own Parallel & Advanced code tab defines: <code>check_host() { local host="$1"; if ping -c1 -W1 "$host" &>/dev/null; then echo "$host: UP"; else echo "$host: DOWN"; fi }</code>. It looks like a function that reports UP or DOWN — but look closely at what its own EXIT CODE actually is, independent of what it prints.',
        'A bash function\'s exit status, unless an explicit <code>return</code> overrides it, is always the exit status of the LAST command it executed. In BOTH branches of this function\'s if/else, the last command executed is <code>echo</code> — and <code>echo</code> essentially always succeeds. This means <code>check_host</code> returns exit code 0 (success) whether the host is UP or DOWN — the function\'s exit status carries NO information about which branch actually ran.',
      ]
    },
    {
      heading: 'Why this matters: the main page\'s own theory elsewhere explicitly relies on exit codes for control flow',
      points: [
        'This wouldn\'t matter if <code>check_host</code>\'s output were only ever meant to be read by a human watching the terminal. But the main page\'s own broader theory ("wait $PID waits for a specific PID... check each job\'s exit status") and its own quiz explanation ("wait with no args waits for all background jobs... capture PIDs with $! and wait individually if you need exit codes") both frame exit-code checking as the whole POINT of the parallel pattern being demonstrated.',
        'A reader who adapts this exact function into a monitoring script — say, <code>check_host "$host" || send_alert "$host is down"</code> — would find that <code>send_alert</code> NEVER runs, no matter how many hosts are actually down, because <code>check_host</code>\'s exit code is always 0 regardless of its printed content. The function looks correct when watched running (the right text prints), which makes this bug especially easy to ship unnoticed.',
      ]
    },
    {
      heading: 'The fix: an explicit return that actually reflects the check\'s result',
      points: [
        'The fix is small and direct: add an explicit <code>return</code> in each branch that reflects the actual result, rather than letting the function\'s exit status fall through to whatever <code>echo</code> happens to return. <code>if ping -c1 -W1 "$host" &>/dev/null; then echo "$host: UP"; return 0; else echo "$host: DOWN"; return 1; fi</code> — now the function\'s exit code genuinely distinguishes UP from DOWN, and <code>check_host "$host" || send_alert ...</code> works exactly as a reader would expect.',
        'The general lesson extends well past this one function: any bash function whose LAST line is a plain <code>echo</code>/<code>printf</code> for reporting purposes will have that command\'s (near-universal) success silently become the function\'s own exit status — always explicitly <code>return</code> a meaningful value from any function whose caller might ever check its exit code, rather than relying on whatever the final command happens to report.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the bug — an alert that never fires',
      language: 'bash',
      code: `#!/usr/bin/env bash

# EXACTLY the main page's own function, unmodified:
check_host() {
    local host="$1"
    if ping -c1 -W1 "$host" &>/dev/null; then
        echo "$host: UP"
    else
        echo "$host: DOWN"
    fi
}

# A monitoring script adapting this exact pattern:
send_alert() { echo "ALERT: $1 appears to be down!" >&2; }

DOWN_HOST="10.0.0.99"     # deliberately unreachable for this demo

check_host "$DOWN_HOST" || send_alert "$DOWN_HOST"

# Actual output:
#   10.0.0.99: DOWN
#
# "ALERT: 10.0.0.99 appears to be down!" NEVER PRINTS -- even
# though the host is genuinely down and the function correctly
# PRINTED that fact. The || never triggers because check_host's
# own exit code is 0 (from echo succeeding), not 1.

echo "check_host's own exit code was: $?"
# check_host's own exit code was: 0     <-- always 0, either branch`,
    },
    {
      label: 'The fix: an explicit return in each branch',
      language: 'bash',
      code: `#!/usr/bin/env bash

# FIXED -- explicit return reflecting the actual check result:
check_host() {
    local host="$1"
    if ping -c1 -W1 "$host" &>/dev/null; then
        echo "$host: UP"
        return 0
    else
        echo "$host: DOWN"
        return 1
    fi
}

send_alert() { echo "ALERT: $1 appears to be down!" >&2; }

DOWN_HOST="10.0.0.99"

check_host "$DOWN_HOST" || send_alert "$DOWN_HOST"

# Actual output now:
#   10.0.0.99: DOWN
#   ALERT: 10.0.0.99 appears to be down!     <-- correctly fires

echo "check_host's own exit code was: $?"
# check_host's own exit code was: 1          <-- correctly non-zero

# General rule: any function whose last command is echo/printf
# for reporting will inherit THAT command's exit status by
# default -- always add an explicit return when a caller might
# ever check the function's exit code.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team copies the main page\'s own `check_host` function verbatim into a monitoring script that runs it against 50 servers in parallel (following the main page\'s own parallel pattern), then does `check_host "$host" || failures+=("$host")` for each one to build a list of down hosts. After a real outage where 12 of the 50 hosts were genuinely down, the `failures` array is completely empty, even though the script\'s own terminal output correctly showed "DOWN" next to all 12 affected hosts. What is the root cause, and what is the minimal one-line-per-branch fix?',
    hint: 'A bash function\'s exit status, unless overridden, is the exit status of the LAST command it ran — check what the very last command in EACH branch of check_host actually is, and whether that command can ever fail on its own.',
    solution: 'The root cause is that `check_host`\'s last command in BOTH its if and else branches is `echo`, which virtually always succeeds — so the function\'s own exit status is 0 (success) regardless of whether the host was actually UP or DOWN. The function correctly PRINTS "DOWN" for the affected hosts (which is why the terminal output looked right), but its exit code never reflects that result at all, so `check_host "$host" || failures+=("$host")` never appends anything, no matter how many hosts are genuinely down — the `||` branch can only trigger on a non-zero exit code, which this function never produces. The minimal fix is adding an explicit `return 0` after the UP branch\'s echo and `return 1` after the DOWN branch\'s echo — this makes the function\'s exit status genuinely reflect which branch ran, so the `||` construct (and any other exit-code-based logic built on top of this function) starts working correctly.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A bash function that echoes different messages depending on a condition ("UP" vs "DOWN") is also signaling that difference through its exit code, since the messages are clearly different.',
      reality: 'Per this subtopic\'s theory, printing different text has nothing to do with the function\'s exit STATUS — without an explicit return, the exit status is simply whatever the last command executed (here, echo) returns, which is success in both branches regardless of which message was printed.'
    },
    {
      thought: 'If a function\'s printed output correctly reflects reality (e.g. correctly shows "DOWN" for a down host), any code built on top of that function\'s exit code will also behave correctly.',
      reality: 'Per this subtopic\'s theory, correct printed output and a correct exit code are two entirely independent things — the main page\'s own check_host function proves this exactly: it prints the right thing every time while its exit code stays 0 (success) regardless, silently breaking any `||`/`&&`/if-based logic built on top of it.'
    },
    {
      thought: 'Testing a function by watching its printed output during a normal run is sufficient to confirm it behaves correctly.',
      reality: 'Per this subtopic\'s theory, this exact bug is easy to miss precisely because watching the function run shows exactly the expected text — the exit-code bug only becomes visible once something downstream actually branches on the function\'s exit status, which a simple visual check of printed output will never reveal.'
    }
  ];
}
