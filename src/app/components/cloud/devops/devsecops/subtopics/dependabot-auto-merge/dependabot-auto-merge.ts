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
  templateUrl: './dependabot-auto-merge.html',
  styleUrl: './dependabot-auto-merge.scss'
})
export class DependabotAutoMergeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own line "Configure auto-merge for patch updates" names an outcome, not a setting',
      points: [
        'The main page\'s theory says: "Dependabot security advisories auto-open PRs within hours of a CVE disclosure. Configure auto-merge for patch updates with passing tests; require manual review for minor/major bumps." The dependabot.yml example directly above it shows schedule, groups, and labels — but no field anywhere named auto-merge, autoMerge, or similar.',
        'That is not an oversight in the example — per GitHub\'s own documentation, dependabot.yml has no such setting at all. There is no YAML key you can add to the config file shown on the main page that makes Dependabot PRs merge themselves for patch-level bumps.',
        'What actually merges the PR is a completely separate mechanism: a second GitHub Actions workflow, one that inspects each Dependabot PR\'s own metadata and decides whether to approve and merge it. dependabot.yml only controls what PRs get OPENED; a workflow decides what happens to them next.',
      ]
    },
    {
      heading: 'The real mechanism: dependabot/fetch-metadata plus gh pr merge --auto, gated by two separate prerequisites',
      points: [
        'GitHub\'s own docs describe the pattern as: a workflow triggered on pull_request, which uses the dependabot/fetch-metadata action to read the PR\'s update-type (patch/minor/major) and package ecosystem, then conditionally runs gh pr merge --auto based on that metadata.',
        'Two things must ALSO be true, independently of that workflow, or the merge never actually happens: (1) the repository setting "Allow auto-merge" must be enabled — this is what lets `gh pr merge --auto` queue the PR for merge at all; (2) per GitHub\'s own guidance, "if you use status checks to test pull requests, you should enable Require status checks to pass before merging" — auto-merge queues the PR, it does not skip your CI, so a patch bump with a failing test suite never actually merges even once queued.',
        'This means "configure auto-merge for patch updates," as a single sentence on the main page, actually names three separate, independently-configured pieces working together: the dependabot.yml schedule (opens the PR), the repository\'s Allow auto-merge toggle (permits queuing), and a hand-written workflow reading fetch-metadata\'s update-type output (decides WHICH PRs get queued).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The auto-merge workflow -- separate from dependabot.yml',
      language: 'bash',
      code: `# .github/workflows/dependabot-auto-merge.yml
# name: Dependabot auto-merge
# on: pull_request
#
# permissions:
#   contents: write
#   pull-requests: write
#
# jobs:
#   auto-merge:
#     runs-on: ubuntu-latest
#     if: \${{ github.actor == 'dependabot[bot]' }}
#     steps:
#       - name: Fetch Dependabot metadata
#         id: metadata
#         uses: dependabot/fetch-metadata@v2
#         with:
#           github-token: "\${{ secrets.GITHUB_TOKEN }}"
#
#       # Only auto-merge PATCH bumps -- minor/major still need a human
#       - name: Auto-merge patch updates
#         if: steps.metadata.outputs.update-type == 'version-update:semver-patch'
#         run: gh pr merge --auto --squash "$PR_URL"
#         env:
#           PR_URL: \${{ github.event.pull_request.html_url }}
#           GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}

# Nothing in dependabot.yml itself references this workflow -- it is
# a completely separate file that happens to trigger on PRs Dependabot
# opens, filtered by github.actor == 'dependabot[bot]'.`,
    },
    {
      label: 'The two settings this workflow depends on but never configures',
      language: 'bash',
      code: `# 1. Repository setting -- Settings > General > Pull Requests
#    "Allow auto-merge" must be checked.
#    Without it, gh pr merge --auto fails outright:
#    "Pull request Auto-merge is not allowed for this repository"

# 2. Branch protection -- Settings > Branches > <default branch>
#    "Require status checks to pass before merging" should be enabled
#    for whatever CI job runs your test suite.
#
#    Why this matters even though it isn't mentioned anywhere in the
#    auto-merge workflow: --auto QUEUES the merge, it does not force
#    it. A patch bump that breaks a test still sits in the merge
#    queue, unmerged, until either the check passes or someone
#    intervenes -- the workflow's own success just means "queued
#    successfully," not "merged successfully."

# gh pr merge --auto's actual behavior, from GitHub's own docs:
# "Automatically merge the pull request when all required checks
#  have passed. Without required status checks configured, the
#  pull request may be merged immediately."
#
# That last line is the trap: on a repo with NO required status
# checks configured, --auto merges immediately, checks or no checks.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team copies the workflow from this subtopic\'s first code example into their repo, and Dependabot opens a patch-level PR the next day. The workflow run shows green — "Auto-merge patch updates" succeeded. Three hours later, the PR is still open, unmerged, with a failing CI check. The team assumes the workflow is broken. Using this subtopic\'s theory, explain what actually happened and whether the workflow itself did anything wrong.',
    hint: 'Per this subtopic\'s theory, does a successful gh pr merge --auto command mean the PR merged, or that it was queued to merge once its required checks pass?',
    solution: 'The workflow did not do anything wrong — it succeeded at exactly what it does: it called gh pr merge --auto, which queued the PR for merging, and that call returned successfully (hence the green run). Per this subtopic\'s theory, --auto queues a merge conditional on required status checks passing; it does not force an immediate merge. Since the repository has "Require status checks to pass before merging" enabled (as GitHub\'s own guidance recommends whenever auto-merge is used), and this particular patch bump\'s CI check is failing, the PR correctly stays open and unmerged — waiting indefinitely for either the check to go green or a human to intervene. The fix is not to change the auto-merge workflow at all; it is to fix (or investigate) why this specific dependency bump is failing CI. A patch-level version bump that breaks the test suite is exactly the scenario "require status checks to pass" exists to catch, even inside an auto-merge setup.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Dependabot has a built-in "auto-merge patch updates" toggle somewhere in dependabot.yml — you just have to find the right field name.',
      reality: 'Per this subtopic\'s theory, no such field exists. Auto-merging is implemented entirely outside dependabot.yml, via a separate GitHub Actions workflow using the dependabot/fetch-metadata action plus gh pr merge --auto — dependabot.yml only controls what PRs get opened, never what happens to them afterward.'
    },
    {
      thought: 'Once a workflow successfully runs gh pr merge --auto on a Dependabot PR, that PR is merged.',
      reality: 'Per this subtopic\'s exercise, a successful --auto call only means the PR was successfully QUEUED for merge — the actual merge still waits on any required status checks configured in branch protection. A failing test suite leaves the PR open indefinitely even after the auto-merge workflow reports success.'
    },
    {
      thought: 'The dependabot/fetch-metadata action itself decides which PRs are allowed to merge, based on some built-in policy.',
      reality: 'Per this subtopic\'s theory, fetch-metadata only reads and exposes metadata (like update-type: version-update:semver-patch) as a step output — it has no merge policy of its own. The actual patch-vs-minor-vs-major decision is made by the `if:` condition the workflow author writes, checking that output.'
    }
  ];
}
