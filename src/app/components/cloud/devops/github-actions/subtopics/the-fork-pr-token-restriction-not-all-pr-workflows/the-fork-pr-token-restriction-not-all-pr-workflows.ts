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
  templateUrl: './the-fork-pr-token-restriction-not-all-pr-workflows.html',
  styleUrl: './the-fork-pr-token-restriction-not-all-pr-workflows.scss'
})
export class TheForkPrTokenRestrictionNotAllPrWorkflowsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry says "PR workflows run with a read-only token" — the restriction is specifically for FORK pull requests',
      points: [
        'The main page\'s own "Deploying directly from a PR workflow" mistake entry states, as its lead claim: "PR workflows run with a read-only GITHUB_TOKEN and restricted secrets access (by design, for security against fork PRs)." Read at face value, "PR workflows" is the subject — the sentence reads as describing ALL pull_request-triggered workflows uniformly, with the fork mention explaining WHY the restriction exists rather than WHO it applies to.',
        'GitHub\'s own documentation states the restriction with fork pull requests as the specific, narrower subject: "The GITHUB_TOKEN has read-only permissions in pull requests from forked repositories." Separately: "With the exception of GITHUB_TOKEN, secrets are not passed to the runner when a workflow is triggered from a forked repository."',
        'This means a pull_request workflow triggered by a branch WITHIN the same repository (a normal, internal feature-branch PR — no fork involved) does NOT get this restriction at all — it runs with the repository\'s normally-configured GITHUB_TOKEN permissions and has full access to all repository and environment secrets, exactly like a push-triggered workflow would.',
      ]
    },
    {
      heading: 'Why the fork-specific framing matters for how a team actually writes workflow conditions',
      points: [
        'A team that internalizes the main page\'s own "PR workflows run with a read-only token" as a blanket rule might conclude that NO pull_request-triggered job can ever meaningfully use secrets — leading them to either avoid pull_request triggers for legitimate internal-PR use cases (like a staging preview deploy for a same-repo feature branch, which genuinely needs secrets and DOES have them available) or to build unnecessary workarounds.',
        'Conversely, a team that correctly understands the restriction is fork-specific, but forgets forks exist at all for public/open-source repositories, can make the OPPOSITE mistake: writing a pull_request workflow that assumes secrets are always available, which works perfectly in testing (using only internal branches) and then silently breaks — or worse, silently NO-OPs on a step that was supposed to use a missing secret — the first time an external contributor opens a fork PR.',
        'The precise, useful mental model per GitHub\'s own documentation: the restriction is about the PR\'s ORIGIN (same-repo branch vs. external fork), not about the pull_request EVENT TYPE itself — the exact same on: pull_request trigger behaves completely differently depending on where the incoming branch actually lives.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The SAME workflow, two different PR origins, two different outcomes',
      language: 'bash',
      code: `# .github/workflows/preview.yml -- a single pull_request-triggered
# workflow, unchanged, run against two different kinds of PR:

# on:
#   pull_request:
#     branches: [main]
# jobs:
#   preview-deploy:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#       - name: Deploy preview
#         env:
#           DEPLOY_TOKEN: \${{ secrets.PREVIEW_DEPLOY_TOKEN }}
#         run: ./scripts/deploy-preview.sh

# --- Case 1: PR from a branch WITHIN this same repository ---
# (e.g. a teammate's "feat/new-checkout" branch, same repo)
#
# Per GitHub's own docs, this is NOT a "fork pull request" at all --
# the workflow gets the repo's normally-configured GITHUB_TOKEN
# permissions AND full access to secrets.PREVIEW_DEPLOY_TOKEN.
# The preview deploy step runs successfully.

# --- Case 2: PR from an EXTERNAL FORK ---
# (e.g. an outside contributor's fork on an open-source repo)
#
# Per GitHub's own docs: "secrets are not passed to the runner when
# a workflow is triggered from a forked repository" (with the sole
# exception of GITHUB_TOKEN itself, which is also read-only here).
# secrets.PREVIEW_DEPLOY_TOKEN resolves to an EMPTY STRING -- the
# deploy script runs with DEPLOY_TOKEN="" and fails (or, worse,
# silently no-ops depending on how the script handles a missing
# token) -- not because of anything specific to THIS PR, but purely
# because of where the branch physically lives.`,
    },
    {
      label: 'What this means for the main page\'s own "deploy only from push to main" advice',
      language: 'bash',
      code: `# The main page's own "right" fix for this mistake entry is:
#
# on:
#   push:
#     branches: [main]
# jobs:
#   deploy:
#     environment: production

# This sidesteps the fork-PR problem entirely by never running
# deploy logic from ANY pull_request trigger -- correct, and still
# the right call for production deploys specifically.

# But per this subtopic's theory, a narrower, same-repo-only PR
# preview deploy (Case 1 above) is a LEGITIMATE, secrets-available
# use case that the main page's own blanket "PR workflows run with
# a read-only token" framing could discourage unnecessarily. The
# precise, safer condition -- when a PREVIEW deploy specifically
# from same-repo PRs is genuinely wanted -- is to explicitly check
# the PR's origin rather than avoiding pull_request entirely:

# jobs:
#   preview-deploy:
#     if: github.event.pull_request.head.repo.full_name == github.repository
#     # true only when the PR's head repo IS this repo (not a fork)
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#       - env:
#           DEPLOY_TOKEN: \${{ secrets.PREVIEW_DEPLOY_TOKEN }}
#         run: ./scripts/deploy-preview.sh
#     # Fork PRs are explicitly skipped here, rather than silently
#     # running with an empty secret and a confusing failure.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An open-source project has a pull_request-triggered workflow that runs ./scripts/deploy-preview.sh using secrets.PREVIEW_DEPLOY_TOKEN, exactly following the pattern in this subtopic\'s first code example. It has worked reliably for months — every PR so far has come from maintainers\' own branches within the same repository. The first time an external contributor opens a PR from their own fork, the preview deploy step silently produces a broken preview (the script runs, but does nothing useful) instead of erroring loudly. Using this subtopic\'s theory, explain precisely why this specific PR behaved differently from every prior one, despite using the identical workflow file.',
    hint: 'Per this subtopic\'s theory, does GitHub\'s own read-only-token-and-no-secrets restriction depend on anything about the CONTENT of a specific PR, or purely on WHERE the PR\'s branch physically lives (same repository vs. an external fork)? Were any of the prior PRs from a fork?',
    solution: 'This PR behaved differently purely because of its ORIGIN, not anything about its content — per this subtopic\'s theory, GitHub\'s own restriction ("secrets are not passed to the runner when a workflow is triggered from a forked repository") applies specifically to pull requests from external forks, and every prior PR in this project\'s history happened to come from maintainers\' own branches within the same repository, which never triggers this restriction at all. The external contributor\'s fork PR is the first one to actually exercise the fork-specific code path: secrets.PREVIEW_DEPLOY_TOKEN silently resolves to an empty string (rather than the workflow failing to even start, or throwing an obvious "secret not found" error), so the deploy script runs with an empty token and produces a broken-but-not-obviously-erroring preview — exactly the "silently no-ops" failure mode this subtopic\'s theory warns about. The identical workflow file was never actually tested against the fork code path before this, since the team\'s own testing (using only internal branches) never happened to exercise it — the workflow "worked" for months purely by accident of who happened to be opening PRs, not because it correctly handled both cases.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Any workflow triggered by the pull_request event gets a read-only GITHUB_TOKEN and no access to secrets, regardless of where the PR\'s branch comes from.',
      reality: 'This subtopic\'s theory quotes GitHub\'s own documentation directly: "The GITHUB_TOKEN has read-only permissions in pull requests from forked repositories" — the restriction is specific to FORK pull requests. A pull_request workflow triggered by a branch within the same repository gets the repository\'s normal, fully-configured token permissions and full secrets access.'
    },
    {
      thought: 'Since a team\'s own testing shows a pull_request-triggered workflow using secrets works reliably, it is safe to assume it will continue working the same way for any future pull request, from any contributor.',
      reality: 'This subtopic\'s exercise shows a workflow can appear to work reliably for months purely because every PR tested so far happened to come from the same-repository code path — the fork-specific restriction only manifests the first time an actual fork PR is opened, which internal testing (using only maintainers\' own branches) never exercises.'
    },
    {
      thought: 'The safest way to handle the fork-PR secrets restriction is to avoid the pull_request trigger entirely for anything that might need secrets, using push-to-main triggers instead even for use cases like PR preview deploys.',
      reality: 'This subtopic\'s second code example shows a more precise alternative: explicitly checking the PR\'s origin (github.event.pull_request.head.repo.full_name == github.repository) lets a team keep a genuinely useful same-repo PR preview deploy working with secrets, while explicitly and visibly skipping the job for fork PRs — rather than either avoiding pull_request triggers altogether or accidentally exposing broken, silent failures to fork contributors.'
    }
  ];
}
