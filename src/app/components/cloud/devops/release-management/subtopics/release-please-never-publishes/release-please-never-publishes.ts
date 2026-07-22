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
  templateUrl: './release-please-never-publishes.html',
  styleUrl: './release-please-never-publishes.scss'
})
export class ReleasePleaseNeverPublishesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own release-please workflow has exactly one step — and that step never publishes anything',
      points: [
        'The main page\'s theory says release-please "creates a \'Release PR\' after each merged commit... Merge the PR to trigger a release." The word "release" there is doing a lot of work — it sounds like merging the PR is the final action that ships the package.',
        'The main page\'s own workflow example backs this up visually: a single job, a single step (google-github-actions/release-please-action@v4), no `npm publish` anywhere in the file. For a reader assuming "trigger a release" means "publish the package," that single-step workflow looks complete.',
        'It is not. release-please\'s own documentation is explicit about its scope: it automates "CHANGELOG generation, the creation of GitHub releases, and version bumps for your projects." Publishing to npm (or any registry) is not on that list — it is a completely separate concern the action never touches.',
      ]
    },
    {
      heading: 'What merging the Release PR actually does, and the missing conditional step that makes publishing happen',
      points: [
        'Merging the Release PR causes release-please-action, on its NEXT run (triggered by that merge, since the workflow is `on: push: branches: [main]`), to detect the merge, create a git tag, and create a GitHub Release. That is the full extent of "triggering a release" as release-please defines it — version bumped, changelog updated, tag cut, release published on GitHub. The npm registry is untouched.',
        'To actually publish, the workflow needs a second job or step that runs conditionally on the action\'s own `release_created` output (or `releases_created` for monorepo setups) — e.g. `if: ${{ steps.release.outputs.release_created }}` — and only then runs `npm publish`. Without that conditional step, the exact one-step workflow shown on the main page can merge Release PR after Release PR, correctly bumping versions and tagging releases, while the npm registry never receives a single new version.',
        'This is easy to miss because nothing FAILS — the workflow succeeds every time, the GitHub Release page fills up with correctly-versioned entries, and the CHANGELOG.md updates exactly as expected. The only symptom is that `npm view my-app version` never matches the latest GitHub Release tag, because the one step that would have closed that gap was never added.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own workflow -- releases created, npm never touched',
      language: 'bash',
      code: `# .github/workflows/release-please.yml (the main page's own example)
# on:
#   push:
#     branches: [main]
# jobs:
#   release-please:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: google-github-actions/release-please-action@v4
#         with:
#           release-type: node
#           package-name: my-app

# Every merge to main after a Release PR is merged:
# 1. Version bumped in package.json (in the Release PR itself)          -- YES
# 2. CHANGELOG.md updated                                               -- YES
# 3. Git tag created (e.g. v2.5.0)                                      -- YES
# 4. GitHub Release created with notes                                  -- YES
# 5. npm registry updated with the new version                         -- NO
#
# Running "npm view my-app version" after this workflow finishes still
# shows the OLD published version -- nothing in this file ever runs
# "npm publish". The workflow succeeds; nothing looks broken.`,
    },
    {
      label: 'Adding the missing publish step -- gated on release_created',
      language: 'bash',
      code: `# .github/workflows/release-please.yml -- with the missing piece added

# jobs:
#   release-please:
#     runs-on: ubuntu-latest
#     outputs:
#       release_created: \${{ steps.release.outputs.release_created }}
#     steps:
#       - uses: google-github-actions/release-please-action@v4
#         id: release
#         with:
#           release-type: node
#           package-name: my-app
#
#   publish:
#     needs: release-please
#     if: \${{ needs.release-please.outputs.release_created }}
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#       - uses: actions/setup-node@v4
#         with:
#           node-version: 22
#           registry-url: 'https://registry.npmjs.org'
#       - run: npm ci
#       - run: npm publish --access public
#         env:
#           NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}

# The "if:" condition is the entire fix -- without it, this publish
# job would run (and fail, or worse, republish unchanged code) on
# EVERY push to main, not just the ones where release-please actually
# cut a new release.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs the main page\'s own single-step release-please workflow for six months. Every Release PR merges cleanly, GitHub Releases show correctly incrementing version tags (v2.1.0, v2.2.0, v2.3.0...), and CHANGELOG.md is always up to date. A new engineer runs `npm install my-app@latest` and gets v1.4.0 — many versions behind the newest GitHub Release. Using this subtopic\'s theory, explain what is happening, and why nothing in CI ever reported a failure.',
    hint: 'Per this subtopic\'s theory, does release-please-action itself publish to npm as part of creating a release, or does that require a separate, explicitly-gated step the main page\'s own workflow never includes?',
    solution: 'Per this subtopic\'s theory, release-please-action only ever manages versioning, changelog generation, git tagging, and GitHub Release creation — it never publishes to npm, and the main page\'s own workflow (a single step, no publish job) never adds that separately-required piece. Every one of those six months of Release PRs correctly bumped the version and created a real GitHub Release, exactly as the successful CI runs show — but since no step in the workflow ever ran `npm publish`, the npm registry was never updated past whatever version was last published before this workflow was adopted (v1.4.0). Nothing failed because nothing was ever asked to publish; the workflow does exactly what it was configured to do, and what it was configured to do never included the registry. The fix is adding a second job gated on the action\'s own `release_created` output that runs `npm publish` — without it, GitHub Releases and the actual published package silently diverge forever, with every CI run staying green the entire time.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Merging a release-please Release PR is the action that ships the package to npm — that\'s what "trigger a release" means.',
      reality: 'Per this subtopic\'s theory, merging the Release PR only causes release-please-action to bump the version, update the changelog, tag the commit, and create a GitHub Release on its next run — publishing to npm (or any registry) is a completely separate action the tool never performs, regardless of how "release" sounds like it should include it.'
    },
    {
      thought: 'If a release-please workflow has been running successfully for months with no CI failures, the package is definitely being published correctly.',
      reality: 'Per this subtopic\'s exercise, a green CI run only proves release-please did what it was configured to do — version bump, changelog, tag, GitHub Release. If the workflow never included a conditional npm publish step, every one of those runs can succeed indefinitely while the npm registry silently falls further behind.'
    },
    {
      thought: 'Adding a publish step to a release-please workflow is straightforward — just run npm publish as the next step after the release-please-action step.',
      reality: 'Per this subtopic\'s theory, an unconditional publish step would run on EVERY push to main, not just the ones where a release was actually cut — it needs to be gated on the action\'s own release_created output (typically as a separate job with `if:`), otherwise it republishes on ordinary, non-release commits too.'
    }
  ];
}
