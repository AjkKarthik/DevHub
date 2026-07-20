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
  templateUrl: './pipefail-is-not-the-github-actions-shell-default.html',
  styleUrl: './pipefail-is-not-the-github-actions-shell-default.scss'
})
export class PipefailIsNotTheGithubActionsShellDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own drift-detection step pipes terraform plan through tee, then reads $? — a pattern that depends entirely on an unstated shell setting',
      points: [
        'The main page\'s own "Detect drift" step runs `terraform plan -detailed-exitcode -no-color 2>&1 | tee drift.txt` and immediately after, `echo "exitcode=$?" >> $GITHUB_OUTPUT`. The whole drift-alert mechanism depends on `$?` correctly capturing terraform\'s own exit code (2 = drift detected, per the main page\'s own quiz). Nothing in the step declares a `shell:` key at all.',
        'In a plain bash pipeline (`cmd1 | cmd2`), `$?` reflects the exit status of the LAST command in the pipe — here, `tee`, not `terraform plan`. Since `tee` almost always succeeds (its job is just to copy stdin to a file and stdout), `$?` would normally be 0 regardless of what terraform actually reported, unless the shell\'s `pipefail` option is enabled to make the pipeline\'s exit code reflect its rightmost FAILING command instead.',
      ]
    },
    {
      heading: 'Why the main page\'s own step happens to work anyway — and the specific condition that would break it',
      points: [
        'GitHub\'s own documentation on the default shell states the exact command templates: leaving `shell:` unspecified on Linux/macOS runs `bash -e {0}` — no `pipefail`. Explicitly setting `shell: bash` runs the stricter `bash --noprofile --norc -eo pipefail {0}` — WITH `pipefail`. These are genuinely different templates, not two ways of writing the same thing.',
        'The main page\'s own drift-detection step never writes `shell: bash` anywhere in it — per GitHub\'s own documented default, this step runs under the `-e`-only template, missing `pipefail`. That means `$?` after the `tee`-piped command should, per plain bash semantics, capture `tee`\'s exit code (0) rather than terraform\'s (2) — silently defeating the entire point of `-detailed-exitcode`, since the alert-on-drift step later checks `steps.plan.outputs.exitcode == \'2\'`, a condition that would never actually become true this way.',
        'The fix that would make the main page\'s own script behave as intended is adding an explicit `shell: bash` line to the step (bringing in `pipefail`), or restructuring to avoid piping through `tee` at all (e.g. capturing terraform\'s output separately with `2>&1 | tee drift.txt; TF_EXIT=${PIPESTATUS[0]}`, which reads the FIRST command\'s exit code from bash\'s own `PIPESTATUS` array directly, regardless of `pipefail`).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why $? after cmd | tee normally captures tee\'s exit code, not cmd\'s',
      language: 'bash',
      code: `# A minimal reproduction of the main page's own pattern:

false | tee output.txt
echo "\$?"
# Without pipefail: prints 0
#   -- because tee (the LAST command in the pipe) succeeded,
#      even though "false" (standing in for a failing terraform
#      plan) exited non-zero.

set -o pipefail
false | tee output.txt
echo "\$?"
# WITH pipefail: prints 1
#   -- now the pipeline's own exit code reflects "false"'s
#      failure, not just tee's success.

# The main page's own drift step does the equivalent of the FIRST
# example -- it never explicitly turns pipefail on -- so whether
# "$?" actually reflects terraform's exit code depends entirely on
# whether the SURROUNDING SHELL already has pipefail on by default,
# which is exactly what varies based on the shell: setting.`,
    },
    {
      label: 'GitHub Actions\' own two default templates, side by side',
      language: 'bash',
      code: `# The main page's own step, exactly as written -- no shell: key:
# - name: Detect drift
#   id: plan
#   run: |
#     terraform plan -detailed-exitcode -no-color 2>&1 | tee drift.txt
#     echo "exitcode=\$?" >> \$GITHUB_OUTPUT

# Per GitHub's own docs, this runs under the UNSPECIFIED default:
#   bash -e {0}
# -- no pipefail. $? here captures tee's exit code, almost always 0.

# The fix -- add an explicit shell: bash:
# - name: Detect drift
#   id: plan
#   shell: bash
#   run: |
#     terraform plan -detailed-exitcode -no-color 2>&1 | tee drift.txt
#     echo "exitcode=\$?" >> \$GITHUB_OUTPUT

# Per GitHub's own docs, explicit shell: bash runs under:
#   bash --noprofile --norc -eo pipefail {0}
# -- pipefail IS on. $? now correctly captures terraform's own
# exit code (2 for drift), making the later
# "if: steps.plan.outputs.exitcode == '2'" check actually work.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team copies the main page\'s own drift-detection workflow exactly as shown (no `shell:` key on the step) into their own repo. Weeks later, they realize the "Alert on drift" step has never fired once, despite manual `kubectl`/console changes they know happened during that time and that `terraform plan` run locally clearly reports as drift. Using this subtopic\'s theory, explain the most likely root cause.',
    hint: 'Per this subtopic\'s theory, without an explicit shell: bash, does the step\'s $? check actually capture terraform\'s own exit code — or something else entirely?',
    solution: 'The most likely root cause is exactly the gap this subtopic\'s theory describes: without an explicit `shell: bash` line, the step runs under GitHub\'s own documented unspecified-shell default (`bash -e {0}`), which does NOT include `pipefail`. That means `echo "exitcode=$?"` is capturing the exit code of `tee` — the last command in the pipe — not `terraform plan`\'s own `-detailed-exitcode` result. `tee` succeeds virtually every time (its only job is copying output to a file), so `$?` is almost always 0, meaning `steps.plan.outputs.exitcode` is essentially always `\'0\'`, never `\'2\'` — so the `if: steps.plan.outputs.exitcode == \'2\'` condition on the alert step can never become true, regardless of how much real drift actually occurred. The fix is adding `shell: bash` to the step (bringing in GitHub\'s own documented `-eo pipefail` template), or reading `${PIPESTATUS[0]}` immediately after the pipe instead of relying on `$?` at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'In a bash pipeline like `terraform plan | tee drift.txt`, `$?` right after always reflects whether terraform plan itself succeeded or failed, since that\'s the command doing the meaningful work.',
      reality: 'Per this subtopic\'s theory, plain bash semantics say the opposite by default — `$?` reflects the LAST command in the pipe (`tee`), not the first (`terraform plan`), unless the shell\'s `pipefail` option is explicitly enabled to change this.'
    },
    {
      thought: 'Every GitHub Actions `run:` step using bash behaves identically regarding pipefail, whether or not a `shell:` key is written — the platform normalizes this for you.',
      reality: 'Per this subtopic\'s theory, GitHub\'s own docs describe two genuinely different default command templates — leaving `shell:` unspecified runs `bash -e {0}` (no pipefail), while explicitly writing `shell: bash` runs `bash --noprofile --norc -eo pipefail {0}` (pipefail on). The presence or absence of that one line changes pipe-exit-code behavior.'
    },
    {
      thought: 'If the main page\'s own drift-detection script had this pipefail gap, the workflow would visibly fail or throw an obvious error, making the bug easy to catch.',
      reality: 'This subtopic\'s exercise shows the opposite — the workflow runs "successfully" every time, with no error at all. The bug is a silent, permanent false negative: the alert step\'s condition simply never evaluates to true, so real drift goes undetected indefinitely with nothing in the logs pointing at why.'
    }
  ];
}
