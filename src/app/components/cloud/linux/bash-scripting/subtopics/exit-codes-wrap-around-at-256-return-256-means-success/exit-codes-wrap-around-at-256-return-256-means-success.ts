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
  templateUrl: './exit-codes-wrap-around-at-256-return-256-means-success.html',
  styleUrl: './exit-codes-wrap-around-at-256-return-256-means-success.scss'
})
export class ExitCodesWrapAroundAt256Return256MeansSuccessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the 0-255 range as a passing fact, without explaining what happens outside it',
      points: [
        'The main page\'s own QnA states plainly: "Return values: use return N for exit codes (0-255)." The number range is correct, but nothing on the page explains WHY 255 is the ceiling, or — critically — what actually happens if a script computes and returns a value outside that range instead of erroring out.',
      ]
    },
    {
      heading: 'Exit statuses are stored as unsigned 8-bit values — arithmetic wraps, it never errors',
      points: [
        'Bash (and the underlying POSIX exit-status convention it follows) stores an exit status in a single unsigned 8-bit value, giving exactly 256 possible values: 0 through 255. There is no validation step that rejects an out-of-range value — <code>return</code> or <code>exit</code> simply takes the number modulo 256.',
        'The practical consequence: <code>exit 256</code> computes to exactly 0 — the value that conventionally means SUCCESS — even though the script clearly intended to signal something with the number 256. <code>exit 257</code> becomes 1, <code>exit 300</code> becomes 44, and so on, silently, with no warning at any point.',
        'Negative values wrap the same way, from the other direction: <code>exit -1</code> becomes 255 (256 + (-1)), <code>exit -2</code> becomes 254. There is nothing bash-specific here that could special-case this — it is simply what happens when an arbitrary integer is stored in 8 bits.',
      ]
    },
    {
      heading: 'Why this is a real trap: functions that compute a count and return it directly',
      points: [
        'The main page\'s own function examples (<code>check_disk</code>, <code>get_container_id</code>) correctly use <code>return</code> only for pass/fail signaling and <code>echo</code>/command substitution for actual data — but nothing on the page warns against the tempting shortcut of returning a COMPUTED NUMBER directly as the exit code, e.g. a function that counts failed items and does <code>return "$fail_count"</code>.',
        'If that count happens to land on exactly 256 (or any other multiple of 256), the caller\'s <code>if my_func; then echo "all good"; fi</code> sees exit code 0 and treats the run as a complete success — even though the function is trying to report that 256 things failed. This fails completely silently: no error, no warning, just an incorrect success path taken.',
        'The correct pattern, consistent with the main page\'s own better examples: reserve <code>return</code>/<code>exit</code> strictly for pass/fail (0 = success, non-zero = some category of failure), and communicate any actual NUMERIC RESULT — a count, a computed value, anything meaningful beyond simple success/failure — via stdout, captured by the caller with command substitution (<code>result=$(my_func)</code>), exactly as the main page\'s own <code>get_container_id</code> example already does correctly for a different kind of value.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the wraparound',
      language: 'bash',
      code: `# Direct demonstration -- no function needed, exit takes the
# value modulo 256 unconditionally:

bash -c 'exit 256'; echo "Exit code: $?"
# Exit code: 0        <-- looks like SUCCESS, even though 256 was
#                          the literal, intentional value passed in

bash -c 'exit 257'; echo "Exit code: $?"
# Exit code: 1

bash -c 'exit 300'; echo "Exit code: $?"
# Exit code: 44        <-- 300 mod 256 = 44

bash -c 'exit -1'; echo "Exit code: $?"
# Exit code: 255       <-- 256 + (-1) = 255

# Nothing here is an error or a warning -- bash performs this
# wraparound silently, every single time, with no way to detect
# after the fact that the ORIGINAL intended value was out of range.`,
    },
    {
      label: 'The trap in a real function, and the correct fix',
      language: 'bash',
      code: `#!/usr/bin/env bash
set -euo pipefail

# THE TRAP -- a function that computes a count and returns it
# directly as the exit code:
count_failed_items() {
    local fail_count=0
    for item in "$@"; do
        process_item "$item" || ((fail_count++))
    done
    return "$fail_count"          # <-- DANGEROUS if this can reach 256
}

if count_failed_items "\${ITEMS[@]}"; then
    echo "All items processed successfully"
else
    echo "Some items failed"
fi
# If exactly 256 items failed, this silently prints
# "All items processed successfully" -- the worst possible outcome.

# THE FIX -- reserve return for pass/fail only; report the actual
# count via stdout, exactly like the main page's own get_container_id
# pattern already does for a different value:
count_failed_items() {
    local fail_count=0
    for item in "$@"; do
        process_item "$item" || ((fail_count++))
    done
    echo "$fail_count"            # report the real number via stdout
    (( fail_count == 0 ))         # exit status is purely pass/fail
}

failed=$(count_failed_items "\${ITEMS[@]}") || true
echo "Failed count: $failed"      # correct, regardless of how large`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A deployment script has a function `count_unhealthy_hosts` that checks a fleet of servers and does `return "$unhealthy_count"` at the end, following a pattern similar to the main page\'s own function examples. On a fleet of exactly 256 unhealthy hosts (a genuinely bad outage), the calling code\'s `if count_unhealthy_hosts; then echo "Fleet healthy"; fi` prints "Fleet healthy" instead of alerting anyone. What actually happened, and how would you rewrite the function to report the real count safely regardless of its size?',
    hint: 'Check what range of values `return` can actually represent, and what happens to a returned value that lands exactly on a multiple of that range\'s size.',
    solution: 'Exit statuses in bash are stored as unsigned 8-bit values, giving a range of exactly 0-255 — `return N` computes N modulo 256, with no validation or error for an out-of-range value. Since exactly 256 hosts were unhealthy, `return 256` computed to `256 mod 256 = 0`, the value that conventionally means success — so the calling `if` statement saw a "successful" exit code and took the success branch, even though the function was trying to report a genuine, severe outage. The safe rewrite separates the two concerns the main page\'s own better examples already model correctly: use `return`/exit purely for pass/fail (e.g. `(( unhealthy_count == 0 ))` as the function\'s final command, so the exit status is 0 only when the count is genuinely zero), and report the actual COUNT via stdout with `echo "$unhealthy_count"`, captured by the caller through command substitution (`count=$(count_unhealthy_hosts)`) — this correctly represents any count, no matter how large, since stdout has no 256-value ceiling the way an exit code does.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '`return N` (or `exit N`) can represent any integer a script computes, as long as N is a valid number.',
      reality: 'Per this subtopic\'s theory, exit statuses are stored as unsigned 8-bit values — only 0 through 255 are representable. Any value outside that range is silently taken modulo 256, with no error or warning at any point.'
    },
    {
      thought: 'If a function returns exactly 256 to signal a count or an error condition, bash will either preserve that value or raise an error about the invalid range.',
      reality: 'Per this subtopic\'s theory, `return 256` computes to exactly 0 — the value conventionally meaning success — with no error raised. This is one of the most dangerous forms of the wraparound, since it flips a clearly-nonzero intended value into the exact value that signals "everything succeeded."'
    },
    {
      thought: 'It is safe to use return/exit to communicate a computed numeric result (a count, a size, a percentage) as long as the function\'s logic is otherwise correct.',
      reality: 'Per this subtopic\'s theory, any numeric RESULT beyond simple pass/fail should be communicated via stdout (echo/printf, captured with command substitution) rather than the exit code — the exit code\'s 0-255 range makes it fundamentally unsuited to carrying arbitrary computed values, regardless of how correct the surrounding logic is.'
    }
  ];
}
