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
  templateUrl: './codeql-merge-blocking.html',
  styleUrl: './codeql-merge-blocking.scss'
})
export class CodeqlMergeBlockingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own sentence quietly joins two separate systems: "Results appear in the Security tab and can block merges"',
      points: [
        'The main page\'s SAST theory says: "GitHub Advanced Security: CodeQL runs SAST on every PR and posts findings as inline PR comments. Results appear in the Security tab and can block merges." Read quickly, it sounds like one continuous behavior — CodeQL finds something, and the PR is blocked.',
        'They are actually two independent systems that happen to share the same data. The Security tab is populated the instant the codeql-action/upload-sarif step (shown in the main page\'s own workflow) uploads a SARIF file — that always happens, on every run, regardless of any other repository setting. Blocking a merge is a completely separate feature: branch protection.',
        'A repository can run the exact CodeQL workflow shown on the main page, have alerts appear correctly in the Security tab every time, and still let every PR merge freely — because nothing has told the default branch to actually require that check to pass.',
      ]
    },
    {
      heading: 'What "can block merges" actually requires: a named status check added to branch protection, and a severity floor',
      points: [
        'Per GitHub\'s own documentation, the CodeQL workflow publishes a check literally named "Code scanning results" on the PR. To make that check load-bearing, a repository admin must separately go to Settings > Branches, add (or edit) a branch protection rule for the default branch, enable "Require status checks to pass before merging," and explicitly select "Code scanning results" from the list of available checks.',
        'Until that manual step happens, "Code scanning results" is just another status shown on the PR next to the CI checks — informational, not gating. This is the same "opt-in gate" pattern as any other CI check: the check existing and the check being REQUIRED are two different configuration states.',
        'Even once required, per GitHub\'s own documentation the check does not fail on every alert: "Only errors or security issues with a severity level of High or Higher will fail the pull request status check; warnings do not block the PR by default." A Medium or Low severity CodeQL finding shows up in the Security tab and as a PR comment, exactly as the main page describes — but the merge button stays green, because the status check itself only turns red at High/Critical.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The workflow alone -- Security tab populated, merges NOT blocked',
      language: 'bash',
      code: `# The main page's own codeql job (unchanged):
#   codeql:
#     runs-on: ubuntu-latest
#     permissions:
#       security-events: write
#     steps:
#       - uses: actions/checkout@v4
#       - uses: github/codeql-action/init@v3
#         with:
#           languages: csharp,javascript
#       - uses: github/codeql-action/autobuild@v3
#       - uses: github/codeql-action/analyze@v3
#       - uses: github/codeql-action/upload-sarif@v3
#         with:
#           sarif_file: codeql-results.sarif

# Run this workflow on a repo with NO branch protection rule
# referencing "Code scanning results":
#
# 1. PR opened, workflow runs, finds a High-severity SQL injection.
# 2. Alert appears in the Security tab.                    -- YES
# 3. An inline PR review comment is posted on the line.     -- YES
# 4. A "Code scanning results" status shows on the PR.      -- YES
# 5. The merge button is disabled until it's resolved.      -- NO
#
# Nothing in the repo has told GitHub that check is REQUIRED --
# it is purely informational until branch protection says otherwise.`,
    },
    {
      label: 'Adding the missing piece -- branch protection',
      language: 'bash',
      code: `# Settings > Branches > Branch protection rules > <default branch>
#
# [x] Require status checks to pass before merging
#     Search and select:  Code scanning results
#
# This one checkbox is the entire difference between "Security tab
# shows the finding" and "the merge button is actually disabled."
# The workflow file itself never changes.

# What now actually blocks the merge, per GitHub's own docs:
# "Only errors or security issues with a severity level of High
#  or Higher will fail the pull request status check; warnings
#  do not block the PR by default."
#
#   Critical / High severity alert  -> check FAILS -> merge blocked
#   Medium / Low severity alert     -> check still PASSES -> merge allowed
#   (The alert still appears in the Security tab and PR comments
#    either way -- only the pass/fail STATUS depends on severity.)

# Alternative (GitHub, 2024+): repository Rulesets can add a
# dedicated "code scanning" rule that blocks merges directly on a
# chosen severity floor, without going through branch-protection
# status checks at all -- a separate, newer mechanism to the same end.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A repo owner adds the CodeQL workflow from the main page, sees a Critical-severity alert correctly appear in the Security tab on a test PR, and tells the team "great, CodeQL will block anything critical from merging now." Two weeks later, a PR with a High-severity CodeQL finding merges anyway with no warning to anyone. Using this subtopic\'s theory, list the two separate things that would each, independently, explain why the merge wasn\'t blocked.',
    hint: 'Per this subtopic\'s theory, "Code scanning results" appearing on a PR and that same check being able to STOP a merge are gated by two different, independently-configurable things.',
    solution: 'Two separate, independent explanations are possible, and either one alone is sufficient: (1) Per this subtopic\'s theory, the Security tab and the PR check both populate automatically from the workflow\'s own upload-sarif step — seeing the alert there proves nothing about whether that check is required. If the repo\'s branch protection rule was never edited to add "Code scanning results" to its required status checks, the check was purely informational the whole time, and every PR — including this High-severity one — was always mergeable regardless of what it found. (2) Even if the check WAS correctly added as required, per GitHub\'s own documented severity floor, only High-or-above alerts fail the check by default — but "High" is the boundary, not a strict floor with no edge case, and depending on exactly how the specific query\'s severity was classified by CodeQL versus how the team assumed it would be classified, a review of the actual alert\'s recorded severity level (not just its informal description as "high-severity" in conversation) is the concrete first step to distinguish which of these two explanations actually happened here.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If CodeQL is wired up and posting findings to the Security tab, merges are automatically blocked when it finds something serious.',
      reality: 'Per this subtopic\'s theory, the Security tab populating and a merge being blocked are two independently-configured systems. Populating the Security tab only requires the workflow\'s own upload-sarif step, which always runs — blocking a merge additionally requires a branch protection rule (or ruleset) explicitly marking the "Code scanning results" check as required.'
    },
    {
      thought: 'Once "Code scanning results" is a required status check, any CodeQL finding at all — including Low and Medium severity — fails the check and blocks the PR.',
      reality: 'Per this subtopic\'s theory, GitHub\'s own documentation states only High-or-above severity findings fail the status check by default; warnings (lower severities) still appear in the Security tab and as PR comments, but do not turn the required check red.'
    },
    {
      thought: 'The github/codeql-action/upload-sarif step itself has some setting that controls whether findings block merges.',
      reality: 'Per this subtopic\'s theory, upload-sarif only uploads results data — it has no merge-blocking configuration of its own. Whether a finding can block a merge is decided entirely outside the workflow file, in the repository\'s branch protection rules (or rulesets).'
    }
  ];
}
