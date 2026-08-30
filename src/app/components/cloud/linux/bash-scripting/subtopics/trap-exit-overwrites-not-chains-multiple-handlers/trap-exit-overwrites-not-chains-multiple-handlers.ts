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
  templateUrl: './trap-exit-overwrites-not-chains-multiple-handlers.html',
  styleUrl: './trap-exit-overwrites-not-chains-multiple-handlers.scss'
})
export class TrapExitOverwritesNotChainsMultipleHandlersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents trap EXIT as if registering a handler simply adds it to what runs at exit',
      points: [
        'The main page\'s own theory states: "trap "cleanup" EXIT runs a function when the script exits (any exit, including errors)." Its code example does exactly one <code>trap cleanup EXIT</code> call — the page never shows or discusses what happens if a script (or something it sources) calls <code>trap ... EXIT</code> a SECOND time.',
      ]
    },
    {
      heading: 'What actually happens: the second trap call REPLACES the first, it does not add to it',
      points: [
        'bash\'s <code>trap</code> command registers exactly ONE handler per signal at a time. Calling <code>trap</code> again for the same signal (EXIT included) does not append to, chain, or combine with whatever was registered before — it silently OVERWRITES it. Only the most recently registered handler for EXIT will actually run when the script exits.',
        'This fails with zero warning or error of any kind: the earlier <code>trap</code> call succeeds, the later one also succeeds, and nothing in bash\'s own behavior indicates that the first registration was just discarded.',
      ]
    },
    {
      heading: 'Why this is a real risk once a script grows beyond a single file',
      points: [
        'The danger scales directly with how a script is composed. A single, small script with exactly one <code>trap cleanup EXIT</code> call (matching the main page\'s own example) is completely safe. But once a script <code>source</code>s multiple helper library files — a common pattern for larger deployment or automation scripts — and MORE THAN ONE of those sourced files tries to register its own <code>trap ... EXIT</code> for its own cleanup needs (removing ITS OWN temp files, releasing ITS OWN locks), only the LAST one sourced actually wins.',
        'Every earlier library\'s cleanup logic is silently dropped — its temp files are never removed, its locks are never released — and there is no error message anywhere pointing at this, because every individual <code>trap</code> call itself succeeded perfectly. This is the exact combination the main page\'s own defensive-scripting theory warns about elsewhere ("resource leaks from incomplete script runs") without ever connecting it to this specific, silent cause.',
      ]
    },
    {
      heading: 'The fix: a single, combined EXIT trap, or a helper that reads and extends the existing one',
      points: [
        'The simplest fix for a script controlling its own structure is registering ONE combined trap that calls every needed cleanup function in sequence: <code>trap \'cleanup_a; cleanup_b\' EXIT</code> — this is explicit and easy to verify by reading the trap call itself.',
        'For a script composed of independently-sourced library files that each need to register their OWN cleanup without knowing about each other, the safe pattern is a small helper that reads the CURRENTLY registered EXIT trap via <code>trap -p EXIT</code>, and re-registers a new trap that runs the existing command FIRST, followed by the new one — preserving every previously registered handler instead of discarding it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the silent overwrite',
      language: 'bash',
      code: `#!/usr/bin/env bash
set -euo pipefail

# Simulates two sourced library files, each registering its OWN
# cleanup via the exact pattern the main page's own example uses:

# --- lib_a.sh's own cleanup ---
cleanup_a() { echo "Cleaning up lib_a's temp files" >&2; }
trap cleanup_a EXIT

# --- lib_b.sh's own cleanup, sourced AFTER lib_a ---
cleanup_b() { echo "Cleaning up lib_b's lock file" >&2; }
trap cleanup_b EXIT          # <-- silently REPLACES cleanup_a's trap

echo "Doing work..."
# (script ends here)

# Actual output:
#   Doing work...
#   Cleaning up lib_b's lock file
#
# "Cleaning up lib_a's temp files" NEVER PRINTS -- lib_a's own
# cleanup was silently discarded the moment lib_b registered its
# own trap. No error, no warning -- both trap calls succeeded.

# Confirm only ONE handler is actually registered at any time:
trap -p EXIT
# trap -- 'cleanup_b' EXIT      <-- cleanup_a is completely gone`,
    },
    {
      label: 'The fix: combine explicitly, or chain with a helper',
      language: 'bash',
      code: `#!/usr/bin/env bash
set -euo pipefail

# FIX #1 -- for a script that controls its own structure, combine
# explicitly in one trap call:
cleanup_a() { echo "Cleaning up lib_a's temp files" >&2; }
cleanup_b() { echo "Cleaning up lib_b's lock file" >&2; }
trap 'cleanup_a; cleanup_b' EXIT     # both run, in this order

echo "Doing work..."
# Actual output now:
#   Doing work...
#   Cleaning up lib_a's temp files
#   Cleaning up lib_b's lock file

# FIX #2 -- for independently-sourced files that don't know about
# each other, a small helper that APPENDS instead of replacing:
add_trap() {
    local new_cmd="$1"
    local existing
    existing=$(trap -p EXIT | sed -E "s/^trap -- '(.*)' EXIT\$/\\1/")
    if [[ -n "$existing" ]]; then
        trap "\${existing}; \${new_cmd}" EXIT
    else
        trap "$new_cmd" EXIT
    fi
}

# lib_a.sh:
add_trap 'cleanup_a'
# lib_b.sh, sourced later -- APPENDS rather than replacing:
add_trap 'cleanup_b'
# Both cleanup_a and cleanup_b now run at exit, regardless of
# how many files register their own cleanup this way.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A deployment script sources three helper library files: `db-lib.sh` (registers `trap release_db_lock EXIT`), `cache-lib.sh` (registers `trap flush_cache EXIT`), and `log-lib.sh` (registers `trap close_log_handle EXIT`), each following the exact pattern the main page\'s own example demonstrates. After a production incident, the team notices the database lock from `db-lib.sh` was never released, even though the script exited cleanly with no errors. What is the most likely cause, and what would `trap -p EXIT` show if run right before the script exits?',
    hint: 'Think about what happens when trap is called for the SAME signal (EXIT) more than once in the same script — does each call add its handler to a list, or does it replace whatever was registered before?',
    solution: 'The most likely cause is that `trap ... EXIT` was called three separate times (once per sourced library), and each call silently REPLACED the previous registration rather than adding to it — only the LAST one to register, `log-lib.sh`\'s `trap close_log_handle EXIT`, actually ran when the script exited. `db-lib.sh`\'s `release_db_lock` (and `cache-lib.sh`\'s `flush_cache`) were both silently discarded the moment a later library registered its own EXIT trap, with no error or warning at any point since every individual `trap` call succeeded. Running `trap -p EXIT` right before the script exits would show only the LAST registered command — something like `trap -- \'close_log_handle\' EXIT` — with no trace that `release_db_lock` or `flush_cache` were ever registered at all. The fix is either combining all three cleanup calls into one explicit `trap \'release_db_lock; flush_cache; close_log_handle\' EXIT`, or having each library use an "append, don\'t replace" helper that reads the currently registered trap via `trap -p EXIT` and extends it rather than overwriting it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Calling `trap cleanup_function EXIT` multiple times in a script (or across sourced files) registers multiple cleanup handlers that all run at exit.',
      reality: 'Per this subtopic\'s theory, bash allows only ONE handler per signal at a time — each new `trap ... EXIT` call silently REPLACES whatever was registered before, rather than adding to it. Only the most recently registered handler actually runs.'
    },
    {
      thought: 'If a script exits cleanly with no errors, any trap EXIT handlers that were registered anywhere in the script definitely ran.',
      reality: 'Per this subtopic\'s theory, a clean exit only guarantees the LAST registered EXIT handler ran — any earlier handlers that were silently overwritten by a later trap call never execute at all, with no error to indicate this happened.'
    },
    {
      thought: 'Sourcing multiple independent library files that each register their own trap ... EXIT for their own cleanup is a safe, composable pattern.',
      reality: 'Per this subtopic\'s theory, this is one of the most common real-world triggers for this exact bug — each sourced library\'s trap call silently discards whatever cleanup the PREVIOUSLY sourced library had registered, unless the libraries deliberately use an append-rather-than-replace helper.'
    }
  ];
}
