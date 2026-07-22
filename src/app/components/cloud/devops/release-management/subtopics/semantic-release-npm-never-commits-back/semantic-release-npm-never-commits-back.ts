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
  templateUrl: './semantic-release-npm-never-commits-back.html',
  styleUrl: './semantic-release-npm-never-commits-back.scss'
})
export class SemanticReleaseNpmNeverCommitsBackSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own .releaserc.json lists five plugins — none of them writes back to the git repository',
      points: [
        'The main page\'s theory names semantic-release as one of three release-automation tools that "parse commit history, determine the next version, update package.json/CHANGELOG.md, create a git tag, and publish — fully automated." The phrase "update package.json" reads as a single, unified action: the tool figures out the version and package.json ends up holding it.',
        'The main page\'s own .releaserc.json example lists exactly five plugins: commit-analyzer, release-notes-generator, changelog, npm, github. Every one of those does real work — analysing commits, generating notes, updating CHANGELOG.md, publishing to npm, creating the GitHub Release — but none of them is @semantic-release/git.',
        'That omission matters specifically because @semantic-release/npm\'s own documentation is explicit about the boundary of its own "update package.json" step: its prepare step will "Update the package.json version and create the npm package tarball" — but this update happens on disk, in the CI runner\'s ephemeral working directory, and is never committed or pushed back to the actual git repository.',
      ]
    },
    {
      heading: 'What actually happens to the repository\'s own package.json across repeated releases without @semantic-release/git',
      points: [
        'Every semantic-release run computes the next version from git history + conventional commits (which never requires reading the CURRENT package.json version — it derives the next version from the latest git tag instead), writes that version into package.json ON THE RUNNER, builds and publishes the npm tarball with the new version, creates the GitHub Release and git tag — and then the runner is torn down. The locally-modified package.json is never part of a commit; it simply disappears with the runner.',
        'The repository\'s own package.json, as seen by anyone who clones or views it on GitHub, keeps whatever version number it had before semantic-release last ran — potentially several releases behind what npm actually has published. This does not break FUTURE releases, since semantic-release computes the next version from the git tag history, not from reading package.json — but it does mean `cat package.json` inside the repo is an unreliable way to check "what version are we on."',
        '@semantic-release/git exists specifically to close this gap: added to the plugins array (with its own `assets` config naming package.json and CHANGELOG.md), its prepare step commits and pushes those files back to the repository after the version is computed — the one piece that makes the repo\'s own file match what was actually published.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own .releaserc.json -- npm updated, git never touched',
      language: 'bash',
      code: `# .releaserc.json (the main page's own example)
# {
#   "branches": ["main"],
#   "plugins": [
#     "@semantic-release/commit-analyzer",
#     "@semantic-release/release-notes-generator",
#     "@semantic-release/changelog",
#     "@semantic-release/npm",
#     "@semantic-release/github"
#   ]
# }

# What each plugin actually touches:
#   commit-analyzer        -- reads git log, decides next version (in memory)
#   release-notes-generator -- generates release notes text (in memory)
#   changelog               -- writes CHANGELOG.md               -- COMMITTED?  NO
#   npm                     -- writes package.json version,
#                              builds + PUBLISHES the tarball     -- COMMITTED?  NO
#   github                  -- creates the GitHub Release + tag   -- (its own API call, not a repo commit)

# After this workflow runs and successfully publishes v2.5.0 to npm:
git diff HEAD -- package.json CHANGELOG.md
# (empty -- nothing was ever committed; the runner's modified
#  package.json and CHANGELOG.md were discarded when the job ended)`,
    },
    {
      label: 'Adding @semantic-release/git -- the missing commit-back step',
      language: 'bash',
      code: `# .releaserc.json -- with @semantic-release/git added
# {
#   "branches": ["main"],
#   "plugins": [
#     "@semantic-release/commit-analyzer",
#     "@semantic-release/release-notes-generator",
#     "@semantic-release/changelog",
#     "@semantic-release/npm",
#     ["@semantic-release/git", {
#       "assets": ["package.json", "CHANGELOG.md"],
#       "message": "chore(release): \${nextRelease.version} [skip ci]"
#     }],
#     "@semantic-release/github"
#   ]
# }

# Now, after the SAME v2.5.0 release:
git log -1 --oneline
# a1b2c3d chore(release): 2.5.0 [skip ci]

git diff HEAD~1 -- package.json
# -  "version": "2.4.1",
# +  "version": "2.5.0",

# The [skip ci] tag in the commit message matters: without it, this
# commit would itself trigger the release workflow again, since it's
# a normal push to main -- an infinite-looking (though eventually
# no-op) re-trigger loop.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team uses the main page\'s own exact .releaserc.json (five plugins, no @semantic-release/git) for a year, publishing 20 releases to npm correctly. A new hire opens the repository, reads package.json, sees "version": "1.2.0", and opens a PR bumping it to match `npm view my-app version` (which shows 3.7.0), reasoning "someone forgot to commit this." Using this subtopic\'s theory, is the new hire\'s fix necessary, and will it change what semantic-release publishes as the NEXT version?',
    hint: 'Per this subtopic\'s theory, does semantic-release compute the next version by reading the CURRENT value in package.json, or by reading git tag history?',
    solution: 'The new hire\'s manual fix is unnecessary for semantic-release\'s own purposes, and it will NOT change what gets published next — per this subtopic\'s theory, semantic-release computes the next version from git tag history and conventional commit messages since the last tag, never by reading the current package.json field. All 20 releases published correctly despite package.json sitting at a stale "1.2.0" the entire time, because nothing in the pipeline ever depended on that field being current. The PR is not WRONG exactly — a correct, current package.json is genuinely more useful for anyone reading the repo directly, or for tooling that does read it (an IDE, a dependency-audit script) — but it is solving a cosmetic/informational problem, not a release-correctness one, and it will not prevent or cause any change in what version ships next. The actual, permanent fix for the underlying gap is adding @semantic-release/git (as shown in this subtopic\'s second code example) so every future release commits its own version bump automatically, rather than relying on someone noticing and manually catching up periodically.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When semantic-release\'s npm plugin "updates package.json," that update is automatically part of the release commit — the repository\'s own file reflects the new version once the release finishes.',
      reality: 'Per this subtopic\'s theory, @semantic-release/npm updates package.json only in the CI runner\'s local working directory as part of building the publishable tarball — it never commits or pushes that change back to the repository. Only adding the separate @semantic-release/git plugin makes the repo\'s own file match.'
    },
    {
      thought: 'If package.json in a repo using semantic-release shows a version number behind what npm actually has published, semantic-release is broken or a release failed partway through.',
      reality: 'Per this subtopic\'s exercise, this is the expected, unavoidable state whenever @semantic-release/git is absent from the plugins array — every release can succeed correctly and completely while the repo\'s own package.json simply never gets updated, since nothing in the default plugin set commits it.'
    },
    {
      thought: 'semantic-release needs to read the current version from package.json to know what the next version should be — so an out-of-date package.json would eventually cause it to compute the wrong next version.',
      reality: 'Per this subtopic\'s theory, semantic-release determines the next version from git tag history and commit messages since the last tag, not by reading package.json at all — an arbitrarily stale package.json version has no effect on what version semantic-release computes and publishes next.'
    }
  ];
}
