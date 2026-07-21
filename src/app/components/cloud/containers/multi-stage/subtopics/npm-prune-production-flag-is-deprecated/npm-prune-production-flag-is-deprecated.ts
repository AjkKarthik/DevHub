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
  templateUrl: './npm-prune-production-flag-is-deprecated.html',
  styleUrl: './npm-prune-production-flag-is-deprecated.scss'
})
export class NpmPruneProductionFlagIsDeprecatedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Node.js code tab and mistake entry both use a flag current npm actively warns against',
      points: [
        'The main page\'s own Node.js multi-stage code tab runs `RUN npm run build && npm prune --production` in the build stage before copying node_modules into the distroless runtime image. Its own separate mistake entry, "Forgetting to prune devDependencies before copying node_modules," recommends the identical `npm prune --production` as the fix.',
        'Neither the code tab nor the mistake entry\'s explanation mentions that `--production` is a deprecated flag on current npm. Running the exact command shown produces a real, visible warning during every build: `npm WARN config production Use \'--omit=dev\' instead`.',
        'This is not a cosmetic or hypothetical concern — npm\'s own CLI actively prints this warning on npm 9 and later whenever `--production` is passed to any command that accepts it, meaning every CI build log using the main page\'s own exact command shows a deprecation warning on every single run.',
      ]
    },
    {
      heading: 'What to use instead, and why the command still technically works today',
      points: [
        'Per npm\'s own current documentation, `--production` still functions — deprecated flags in npm are not immediately removed, only discouraged — but the officially recommended replacement is `--omit=dev`, which produces the identical practical result (removing devDependencies) without the warning.',
        'The deprecation is not unique to `npm prune` — the same underlying flag family affects `npm install`/`npm ci`, meaning `npm ci --only=production` (used in this hub\'s own sibling Dockerfile topic\'s separate deps stage) carries the exact same deprecation status and warning as `npm prune --production` shown here, despite `--only=production` and `--production` being different-looking flag spellings for the same underlying concept across npm\'s history.',
        'Since a deprecation warning does not fail a build (exit code stays 0), this is easy to miss entirely unless someone is actually reading full CI logs rather than just checking for a green checkmark — a real, live cost (noisy logs, using an unsupported-in-the-long-run flag) with no failure signal forcing anyone to notice and fix it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own command, and what actually prints during the build',
      language: 'bash',
      code: `# The main page's own Node.js multi-stage build step, verbatim:
RUN npm run build && npm prune --production

# What this ACTUALLY outputs on npm 9+ (current npm):
#
# > myapp@1.0.0 build
# > tsc
#
# npm WARN config production Use '--omit=dev' instead.
# removed 42 packages, and audited 118 packages in 3s
#
# The build still succeeds -- exit code 0, node_modules is
# correctly pruned down to production dependencies only. The
# warning is easy to scroll past in a long CI log, especially
# since nothing about the pipeline's pass/fail status reflects it.

# The current, warning-free equivalent:
RUN npm run build && npm prune --omit=dev
# Identical practical result (production-only node_modules), no
# deprecation warning printed.`,
    },
    {
      label: 'The same deprecated flag family, in the sibling Dockerfile topic\'s deps stage',
      language: 'bash',
      code: `# This hub's own sibling "Writing Dockerfiles" topic uses a
# DIFFERENT-looking but related flag, in its own separate deps stage:
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production
# --only=production is ALSO deprecated on current npm, printing:
# npm WARN config only Use \`--omit=dev\` to omit dev dependencies from the install.

# The modern, warning-free equivalent for THAT command:
RUN npm ci --omit=dev
# Same practical result (production-only node_modules installed
# fresh), no deprecation warning.

# Both --production (for prune) and --only=production (for
# install/ci) trace back to the same underlying npm CLI decision to
# consolidate around a single --omit=dev flag across all commands
# that accept it -- worth checking any Dockerfile copied from an
# older tutorial or Stack Overflow answer for either spelling.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team copies the main page\'s own exact Node.js multi-stage Dockerfile into a new project. Their CI pipeline has run green for months, and nobody has ever looked closely at the full build logs. A new team member, reviewing logs for an unrelated issue, spots `npm WARN config production Use \'--omit=dev\' instead` on every single build and asks whether this is something to worry about. Using this subtopic\'s theory, how would you answer, and what — if anything — needs to change?',
    hint: 'Per this subtopic\'s theory, does npm\'s deprecation warning for --production cause the build to fail, and does the flag still function correctly today?',
    solution: 'Per this subtopic\'s theory, this is not an urgent problem — the build has been correct the entire time, since `--production` still functions exactly as intended on current npm; deprecated flags print a warning but are not removed outright. Nothing is broken, and the green CI status has been accurate. That said, it is worth fixing, for two reasons this subtopic\'s theory identifies: first, the warning has been silently printing on every single build for months, adding noise that made this exact kind of "is something actually wrong?" question harder to answer at a glance; second, deprecated flags are not guaranteed to work forever — a future npm major version could remove `--production` support entirely, turning a currently-cosmetic warning into a real future build failure with no advance notice beyond this same warning. The fix is a small, low-risk one-line change: replace `npm prune --production` with `npm prune --omit=dev` (and, while reviewing the Dockerfile, checking for the same deprecated-flag pattern anywhere else, like `npm ci --only=production` in a related Dockerfile) — both produce the identical practical result with no warning.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since npm prune --production still works correctly and the build passes, there is no real reason to change it to --omit=dev.',
      reality: 'Per this subtopic\'s theory, --production still functioning today does not guarantee it will keep working in a future npm major version — deprecated flags are candidates for eventual removal, and the warning printing on every build is npm\'s own signal that this is worth updating before it becomes a forced, unplanned fix.'
    },
    {
      thought: 'A deprecation warning printed during a Docker build would show up as a failed CI check, making it impossible to miss.',
      reality: 'Per this subtopic\'s exercise, npm\'s deprecation warnings do not affect the command\'s exit code — the build succeeds and CI shows green regardless, meaning the warning is only visible to someone actually reading through full build logs, not to anyone just checking pass/fail status.'
    },
    {
      thought: '--production (for npm prune) and --only=production (for npm install/ci) are unrelated flags on two different commands, so fixing one has no bearing on whether the other needs the same fix.',
      reality: 'Per this subtopic\'s theory, both flags trace back to the same underlying npm CLI deprecation consolidating around --omit=dev across every command that accepts it — a Dockerfile using either spelling (as this hub\'s own two sibling multi-stage examples each do, one per command) carries the identical deprecation status and warning.'
    }
  ];
}
