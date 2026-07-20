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
  templateUrl: './awk-begin-exit-is-how-bash-compares-floats.html',
  styleUrl: './awk-begin-exit-is-how-bash-compares-floats.scss'
})
export class AwkBeginExitIsHowBashComparesFloatsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Canary code tab uses two different numeric-comparison idioms for the same kind of check, with no explanation of either',
      points: [
        'The main page\'s own "Blue/Green Deploy" code tab compares an error rate with plain bash: `if [ "$ERROR_RATE" -gt "0.05" ]; then`. The main page\'s own "Canary with GitHub Actions" code tab compares a similarly-shaped error rate completely differently: `if awk "BEGIN {exit !($ERROR_RATE > 0.05)}"; then`. Neither comment explains why the second one exists, or why it isn\'t written the same simple way as the first.',
        'The reason is a real bash limitation: bash\'s `[ ]`/`-gt` numeric comparison only works on INTEGERS. `-gt` internally expects whole numbers — an error rate like `0.023` (a genuinely realistic value from a Prometheus `rate()` query, as used in the main page\'s own Canary code tab) is not an integer, and bash\'s `-gt` will either error outright or silently misbehave when given a non-integer operand.',
      ]
    },
    {
      heading: 'How the awk idiom works, piece by piece',
      points: [
        '`awk "BEGIN {...}"` runs the code inside `{...}` once, before reading any input — it is a common way to use awk purely as a scripting calculator, with no actual file/stream being processed.',
        'Unlike bash, awk\'s comparison operators (`>`, `<`, etc.) work natively on floating-point numbers — `$ERROR_RATE > 0.05` inside the BEGIN block is a genuine floating-point comparison, exactly what the main page\'s own Canary check actually needs for a decimal error-rate value like `0.023`.',
        'awk\'s own `exit` statement sets the process\'s exit code — `exit 0` (or a bare `exit`) means success, any nonzero value means failure. The expression `exit !($ERROR_RATE > 0.05)` uses awk\'s own logical NOT (`!`) to flip the boolean: when the error rate genuinely IS above 0.05, `($ERROR_RATE > 0.05)` is true (1), `!` flips it to false (0), so `exit 0` — the whole `awk` command exits SUCCESSFULLY. Bash\'s own `if` then treats that as "the condition is true," triggering the rollback branch — even though the underlying awk expression looks, at a glance, like it is checking for the OPPOSITE thing.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why the main page\'s own simpler bash comparison can\'t be reused here',
      language: 'bash',
      code: `# The main page's own Blue/Green code tab does this successfully:
ERROR_RATE=$(curl -s http://prometheus:9090/query --data-urlencode \\
  'query=rate(http_requests_total{status=~"5.."}[1m])' | jq '.data.result[0].value[1]')

if [ "$ERROR_RATE" -gt "0.05" ]; then
  echo "Error rate high — rolling back to blue"
  # ...
fi

# This ONLY works reliably if $ERROR_RATE happens to already be a
# whole number (or the specific shell/jq version tolerates it) --
# bash's own [ ]/-gt comparison is documented to expect INTEGER
# operands. A Prometheus rate() query realistically returns a
# decimal like 0.023 or 0.087 -- feeding that straight into
# [ "$ERROR_RATE" -gt "0.05" ] is exactly the kind of thing that
# can throw "integer expression expected" or silently misbehave,
# depending on the exact bash build and value involved.`,
    },
    {
      label: 'The awk idiom, unpacked -- the main page\'s own actual Canary check',
      language: 'bash',
      code: `# The main page's own Canary code tab:
ERROR_RATE=$(curl -s "http://prom/api/v1/query" \\
  --data-urlencode 'query=rate(errors_total{version="canary"}[5m])' \\
  | jq -r '.data.result[0].value[1] // "0"')

echo "Canary error rate: $ERROR_RATE"
if awk "BEGIN {exit !($ERROR_RATE > 0.05)}"; then
  echo "ERROR: Canary degraded — rolling back"
  # ...
fi

# Unpacked, one piece at a time:
#
# awk "BEGIN { ... }"     -- run this code once, no input file needed
# ($ERROR_RATE > 0.05)    -- awk's own '>' handles decimals natively;
#                            evaluates to 1 (true) or 0 (false)
# !(...)                  -- awk's logical NOT flips that boolean
# exit !(...)             -- sets awk's OWN process exit code:
#                              exit 0  -> the shell 'if' sees SUCCESS
#                              exit 1  -> the shell 'if' sees FAILURE
#
# So: error rate IS above 0.05  -> (...) is 1 -> !(...) is 0
#     -> "exit 0" -> awk process succeeds -> bash's own "if" branch
#     runs -> the ERROR/rollback message prints.
#
# The NOT is there specifically because a shell exit code of 0
# means "success" to bash's own "if", which is the OPPOSITE
# direction from how "(...) > 0.05" reads as a plain true/false
# check on its own -- the ! is what reconciles the two conventions.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate reads the main page\'s own Canary code tab\'s `if awk "BEGIN {exit !($ERROR_RATE > 0.05)}"; then` line and, confused by the extra `!`, "simplifies" it by removing the exclamation mark: `if awk "BEGIN {exit ($ERROR_RATE > 0.05)}"; then`. The next canary deploy with a genuinely HIGH error rate (say, 0.09) silently promotes to 100% instead of rolling back. Using this subtopic\'s theory, explain exactly why removing the `!` inverted the check\'s actual behavior.',
    hint: 'Per this subtopic\'s theory, what does an awk BEGIN block\'s `exit 0` (success) versus `exit 1` (failure) mean to bash\'s own `if` statement — and which one does a TRUE boolean expression naturally produce inside awk?',
    solution: 'Removing the `!` inverted the check because of how awk\'s boolean-to-exit-code convention interacts with bash\'s own success/failure convention, per this subtopic\'s theory: when the error rate genuinely is high (0.09 > 0.05), the bare expression `($ERROR_RATE > 0.05)` evaluates to 1 (true) inside awk — and `exit 1` is a FAILURE exit code to the surrounding shell. Bash\'s `if` treats a failure exit code as the condition being FALSE, so the "high error rate" branch is skipped, and the deploy proceeds to promote instead of rolling back — the exact silent inversion the teammate\'s change introduced. With the original `!` in place, the same true (1) boolean gets flipped to false (0) BEFORE it becomes the exit code, and `exit 0` is a SUCCESS code that bash correctly reads as the condition being true. The `!` isn\'t decorative — it is what reconciles awk\'s "1 means true" convention with bash\'s "0 means success" convention, and removing it silently swaps which branch runs for every single case, not just this one.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s Blue/Green code tab\'s `[ "$ERROR_RATE" -gt "0.05" ]` and the Canary code tab\'s `awk "BEGIN {exit !($ERROR_RATE > 0.05)}"` are just two different styles for writing the identical comparison — either one would work fine in either script.',
      reality: 'Per this subtopic\'s theory, they are not interchangeable — bash\'s own `-gt` operator is documented to expect integer operands and can fail or misbehave on a realistic decimal error rate like 0.023, which is exactly the kind of value the Canary script\'s Prometheus query produces. The awk idiom exists specifically because it handles floating-point comparison natively.'
    },
    {
      thought: 'The `!` in `exit !($ERROR_RATE > 0.05)` is optional stylistic negation — removing it would just flip which message prints, not actually change whether the rollback happens.',
      reality: 'This subtopic\'s exercise shows the `!` is load-bearing for correctness, not style — it reconciles awk\'s boolean convention (true = 1) with bash\'s exit-code convention (success = 0). Removing it silently inverts which branch of the surrounding `if` actually runs, meaning a genuinely high error rate would be treated as healthy and vice versa.'
    },
    {
      thought: 'Since awk is normally used for processing text files line by line, using it with BEGIN and no actual input file is an unusual, hacky misuse of the tool.',
      reality: 'Per this subtopic\'s theory, `awk "BEGIN { ... }"` with no input file is a well-established, ordinary way to use awk purely as an arithmetic/floating-point calculator inside a shell script — it is a standard idiom for exactly this kind of problem (needing float comparison bash itself cannot do natively), not a misuse of the tool.'
    }
  ];
}
