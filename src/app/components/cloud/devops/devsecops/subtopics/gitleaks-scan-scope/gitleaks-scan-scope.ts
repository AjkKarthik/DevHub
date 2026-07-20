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
  templateUrl: './gitleaks-scan-scope.html',
  styleUrl: './gitleaks-scan-scope.scss'
})
export class GitleaksScanScopeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own workflow comment says "scan full history" — that describes what the checkout fetches, not what gitleaks actually scans',
      points: [
        'The main page\'s own gitleaks job includes: `fetch-depth: 0     # scan full history` on the checkout step, right before the gitleaks-action step. Read on its own, the comment implies the ACTION scans the whole repository history every time this workflow runs.',
        'fetch-depth: 0 only controls what actions/checkout downloads locally — the complete commit history instead of the default shallow clone (which fetches just the latest commit). It says nothing about what gitleaks-action then does with that history once it\'s available on disk.',
        'On a normal push-triggered run, gitleaks-action does not walk every commit that clone now contains. It scopes its scan to the commit(s) actually introduced by this specific push, using the triggering commit SHA as its reference point.',
      ]
    },
    {
      heading: 'What fetch-depth: 0 actually buys: the local history a diff-based scan needs to compare against',
      points: [
        'On a pull_request-triggered run (the second, distinct trigger this same workflow file lists — `on: [push, pull_request]`), gitleaks compares the PR\'s base commit against its head commit and scans only the diff between them — new secrets introduced by this PR, not the entire repository.',
        'That diff comparison is exactly why fetch-depth: 0 matters: without it, actions/checkout only fetches the single latest commit, and there is no local base commit available to diff against at all — the PR-triggered scan would have nothing to compare and effectively nothing to check. fetch-depth: 0 makes the comparison POSSIBLE; it does not make the scan itself broader.',
        'The practical result: the main page\'s own two-trigger workflow (`push, pull_request`) never actually scans "full history" on either trigger — it scans this push\'s new commit, or this PR\'s diff. A genuine full-history audit (checking every commit ever made to the repo, not just new ones) needs a deliberately separate, one-off run of the gitleaks CLI directly — `gitleaks detect` against the whole log — not the routine CI trigger shown on the main page.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What each trigger actually scans',
      language: 'bash',
      code: `# The main page's own trigger: on: [push, pull_request]

# --- push event ---
# A developer pushes 3 new commits to a feature branch.
# gitleaks-action scans: those 3 new commits, referenced by
# the triggering $GITHUB_SHA -- NOT the branch's entire history,
# even though fetch-depth: 0 made that entire history available
# locally on disk.

# --- pull_request event ---
# A PR is opened comparing feature-branch against main.
# gitleaks-action scans: the diff between the PR's base commit
# and its head commit -- i.e. exactly the commits this PR
# introduces. Commits already on main before the PR was opened
# are not re-scanned on every PR sync.

# In both cases: "full history" is on disk (thanks to fetch-depth:
# 0), but gitleaks only ever LOOKS AT the commits relevant to the
# triggering event -- new push commits, or the PR's own diff.`,
    },
    {
      label: 'Why the full clone is still required, and how to run a genuine full-history audit',
      language: 'bash',
      code: `# Without fetch-depth: 0, actions/checkout does a SHALLOW clone --
# only the single latest commit, no prior history at all.
#
# For a pull_request scan, gitleaks needs the PR's BASE commit
# locally to diff against the HEAD commit. A shallow clone doesn't
# have that base commit on disk -- the diff comparison has nothing
# to compare against, and the scan is effectively meaningless.
#
# fetch-depth: 0 exists to make that ONE comparison possible.
# It is a prerequisite for the diff scan, not a broader scan mode.

# ─── A genuine full-history audit (separate from this CI workflow) ──

# Run gitleaks directly against every commit ever made, as a
# one-off, manually-triggered job -- not on every push:
gitleaks detect --source . --report-path full-history-report.json

# By default, gitleaks detect walks the ENTIRE git log of the
# current branch -- this is the actual "scan full history" behavior
# the main page's own comment implied the CI workflow already does.
# Run it once when first adopting gitleaks (to catch anything
# already committed), then rely on the push/PR-triggered workflow
# for ongoing, new-commits-only protection afterward.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team adopts the main page\'s own gitleaks CI workflow today, on a repository with 4 years of prior commit history that has never been scanned. A secret was accidentally committed 18 months ago and is still sitting in that history. Using this subtopic\'s theory, will tomorrow\'s first push-triggered CI run catch that old secret? What would actually be needed to catch it?',
    hint: 'Per this subtopic\'s theory, does a push-triggered gitleaks-action run scan the commits already in the repository\'s history, or only the commit(s) introduced by that specific push?',
    solution: 'No, tomorrow\'s push-triggered run will not catch it. Per this subtopic\'s theory, gitleaks-action on a push event scans only the commit(s) introduced by that specific push, referenced by the triggering SHA — the 18-month-old secret is not part of tomorrow\'s push, so it is never examined by that run, regardless of fetch-depth: 0 making the full history available on disk. The same is true for every future PR-triggered run: those scan only the diff between a PR\'s base and head, never commits that already existed on the target branch before the PR was opened. To actually catch the old secret, the team needs a separate, one-off action: running `gitleaks detect` directly against the full git log (as shown in this subtopic\'s second code example) — either manually once, or as a dedicated one-time CI job — which walks every commit in history rather than just the commits relevant to a single push or PR event.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The `fetch-depth: 0     # scan full history` comment on the checkout step means gitleaks-action re-scans the entire repository\'s commit history on every single push and PR.',
      reality: 'Per this subtopic\'s theory, fetch-depth: 0 only controls what actions/checkout downloads locally (full history instead of a shallow, latest-commit-only clone) — gitleaks-action itself still scopes each run to the specific push\'s new commits or the PR\'s own diff, not the entire history now sitting on disk.'
    },
    {
      thought: 'Since the workflow already fetches full history, secrets committed years ago, before gitleaks was ever added to the repo, will eventually get caught by this same routine CI workflow.',
      reality: 'Per this subtopic\'s exercise, they will not — a push/PR-triggered gitleaks scan only ever examines commits relevant to that specific triggering event. Catching pre-existing secrets requires a deliberate, separate `gitleaks detect` run against the full git log, not the ongoing CI workflow.'
    },
    {
      thought: 'fetch-depth: 0 is just a generic "get everything" performance/safety setting with no specific reason for being there — it could be removed without changing what gets scanned.',
      reality: 'Per this subtopic\'s theory, fetch-depth: 0 is specifically required for the pull_request trigger\'s diff comparison to work at all — without the PR\'s base commit available locally, there is nothing for gitleaks to diff the head commit against, and removing it would silently break PR-triggered scanning rather than just make the clone smaller.'
    }
  ];
}
