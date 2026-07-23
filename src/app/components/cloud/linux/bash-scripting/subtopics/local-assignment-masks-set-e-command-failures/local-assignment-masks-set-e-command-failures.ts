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
  templateUrl: './local-assignment-masks-set-e-command-failures.html',
  styleUrl: './local-assignment-masks-set-e-command-failures.scss'
})
export class LocalAssignmentMasksSetECommandFailuresSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states set -e as an unconditional guarantee, with no exceptions mentioned',
      points: [
        'The main page\'s own Error Handling section states plainly: "set -e exits immediately on any command failure." Its own theory repeats this as an absolute: "Without set -e, a script silently continues executing subsequent commands even after an earlier command failed." Nowhere does the page mention that set -e has several well-documented exceptions where it does NOT trigger — one of the most common and dangerous involves the exact <code>local</code> keyword the page\'s own function examples use throughout.',
      ]
    },
    {
      heading: 'The specific gap: local var=$(command) hides the command\'s real exit status',
      points: [
        'When <code>local var=$(command)</code> is written as ONE combined statement, bash treats the entire line\'s exit status as the exit status of the <code>local</code> BUILTIN itself — not the command substitution inside it. Declaring a local variable almost never fails on its own, so this combined statement reports success to <code>set -e</code> regardless of whether the command inside <code>$( )</code> actually succeeded or failed.',
        'This means a failing command, wrapped this way, is completely invisible to <code>set -e</code>: the script keeps running past the failure exactly as if <code>set -e</code> were not enabled at all for that one line, while the variable ends up holding empty or partial output from the failed command — and nothing about the script\'s subsequent behavior indicates anything went wrong.',
        'This is a well-documented pitfall — <code>ShellCheck</code> (the standard bash static analyzer) flags this exact pattern as warning <code>SC2155</code>, "Declare and assign separately to avoid masking return values," specifically because it is common and easy to write without realizing the danger.',
      ]
    },
    {
      heading: 'The fix: split declaration and assignment onto two statements',
      points: [
        'Writing <code>local var; var=$(command)</code> as two separate statements fixes this completely: the plain assignment <code>var=$(command)</code> (with no <code>local</code> keyword on that line) IS the last command executed, so its own exit status — which correctly mirrors the command substitution\'s exit status — is exactly what <code>set -e</code> observes. A failing command now correctly triggers the script to exit.',
        'The main page\'s own <code>check_disk</code> function already happens to use the SAFE two-statement form (<code>local usage; usage=$(df / | awk...)</code>) — but this is not called out anywhere as deliberate or necessary; a reader could easily "simplify" it back to the one-line, unsafe form without realizing they had just disabled set -e protection for that line.',
        'For a broader fix across an entire script rather than line-by-line vigilance, Bash 4.4+ supports <code>shopt -s inherit_errexit</code>, which changes how <code>set -e</code> propagates into command substitutions more generally — though understanding the <code>local</code>-specific masking behavior remains essential, since this shopt option alone does not cover every related edge case.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the silent failure',
      language: 'bash',
      code: `#!/usr/bin/env bash
set -euo pipefail

get_version() {
    # THE TRAP: local + assignment on ONE line
    local version=$(cat /etc/app/version-that-does-not-exist)
    echo "Version detected: $version"
    return 0
}

echo "Before get_version"
get_version
echo "After get_version -- did we get here?"

# Actual output when the cat command fails:
#   Before get_version
#   cat: /etc/app/version-that-does-not-exist: No such file or directory
#   Version detected:                <-- empty, but the script KEPT GOING
#   After get_version -- did we get here?    <-- YES, despite set -e!
#
# The cat command genuinely failed (exit 1), but because it's wrapped
# inside "local version=$(...)", the exit status observed by set -e
# is the LOCAL BUILTIN's own status (0, success), not cat's (1).`,
    },
    {
      label: 'The fix: split local and assignment',
      language: 'bash',
      code: `#!/usr/bin/env bash
set -euo pipefail

get_version() {
    # THE FIX: declare local FIRST, assign as a SEPARATE statement
    local version
    version=$(cat /etc/app/version-that-does-not-exist)
    echo "Version detected: $version"
    return 0
}

echo "Before get_version"
get_version
echo "After get_version -- did we get here?"

# Actual output now:
#   Before get_version
#   cat: /etc/app/version-that-does-not-exist: No such file or directory
# (script exits here -- "After get_version" never prints, exactly the
#  behavior set -e is supposed to guarantee)

# ShellCheck (run this against any script before trusting it) catches
# this exact pattern automatically:
shellcheck get_version.sh
# In get_version.sh line 4:
#     local version=$(cat /etc/app/version-that-does-not-exist)
#     ^-- SC2155: Declare and assign separately to avoid masking
#         return values.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A deployment script uses `set -euo pipefail` at the top, following the main page\'s own recommended defensive baseline. A function contains `local config=$(curl -sf https://config-service/settings)` — if the curl call fails (service down, network error), the team expects `set -e` to immediately stop the deployment. In production, curl DOES fail, but the script continues running with an empty `$config` and eventually corrupts the deployment. Why did set -e not catch this, and what is the minimal fix?',
    hint: 'Check exactly which command\'s exit status is being evaluated on that line — is it the exit status of curl (inside the parentheses), or the exit status of the outer local keyword itself?',
    solution: 'The line `local config=$(curl -sf ...)` combines a `local` declaration with a command substitution assignment in ONE statement — bash reports the exit status of that entire statement as the exit status of the `local` BUILTIN itself, not the curl command running inside `$( )`. Declaring a local variable almost never fails, so `set -e` sees a successful exit status and has no reason to stop the script, even though curl genuinely failed and `$config` ended up empty. This is a well-documented bash pitfall (ShellCheck flags it as SC2155). The minimal fix is splitting the declaration and assignment into two separate statements: `local config` on its own line, then `config=$(curl -sf https://config-service/settings)` as a separate plain assignment — now that assignment line IS the last command executed, so its exit status correctly mirrors curl\'s own exit status, and `set -e` will correctly stop the script the moment curl fails.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'set -e reliably exits the script on ANY command failure, with no meaningful exceptions to keep in mind.',
      reality: 'Per this subtopic\'s theory, set -e has several well-documented exceptions — one of the most common involves `local var=$(command)` written as a single statement, where the exit status observed is the `local` builtin\'s own status, not the command substitution\'s, completely masking a real failure.'
    },
    {
      thought: '`local var=$(command)` and `local var; var=$(command)` are functionally identical — just a stylistic difference in how many lines are used.',
      reality: 'Per this subtopic\'s theory, these behave differently under set -e specifically: the one-line form masks the command\'s real exit status behind the local builtin\'s own success, while the two-line form correctly propagates the command\'s actual exit status to set -e.'
    },
    {
      thought: 'If a script has set -e and still keeps running after an obviously failed command, the failure must not have actually returned a non-zero exit code.',
      reality: 'Per this subtopic\'s theory, a command can genuinely fail with a real non-zero exit code and still not trigger set -e, if it is wrapped inside a `local var=$(...)` combined statement — the command\'s own exit status is present and non-zero, it simply never reaches set -e\'s evaluation.'
    }
  ];
}
