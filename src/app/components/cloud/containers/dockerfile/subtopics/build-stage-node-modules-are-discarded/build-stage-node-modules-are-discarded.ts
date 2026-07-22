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
  templateUrl: './build-stage-node-modules-are-discarded.html',
  styleUrl: './build-stage-node-modules-are-discarded.scss'
})
export class BuildStageNodeModulesAreDiscardedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Dockerfile runs npm ci twice, with different flags, and never explains why',
      points: [
        'The main page\'s own Node.js Dockerfile has two separate stages that each run their own npm install: the `deps` stage runs `npm ci --only=production`, and the `build` stage runs a plain `npm ci` (installing EVERY dependency, including devDependencies like TypeScript and build tools) before running `npm run build`.',
        'Nothing in the code tab\'s comments, or the surrounding theory, explains why there are two separate installs with two different flag sets instead of one shared install step both stages could reuse.',
        'The answer is only visible by tracing the runtime stage\'s own COPY instructions: `COPY --from=deps /app/node_modules ./node_modules` and `COPY --from=build /app/dist ./dist`. The runtime image\'s node_modules comes from `deps` — never from `build`.',
      ]
    },
    {
      heading: 'What actually happens to the build stage\'s own node_modules: nothing copies it anywhere',
      points: [
        'The `build` stage\'s full `npm ci` (with devDependencies) exists SOLELY to give `npm run build` (the TypeScript compiler, bundler, or whatever the build script invokes) the tools it needs to produce `dist/`. Once that compilation finishes, the build stage\'s own node_modules directory has served its entire purpose.',
        'Per multi-stage build semantics, a COPY --from=<stage> instruction only ever copies exactly the files named — nothing about the runtime stage\'s `COPY --from=build /app/dist ./dist` line touches the build stage\'s node_modules at all. That directory, containing every dev dependency that was ever installed, is discarded in its entirety when the build stage\'s intermediate image is never referenced again.',
        'This is precisely why TWO separate installs are needed at all: the `deps` stage exists specifically to produce a clean, production-only node_modules the runtime image can copy, since the build stage\'s own node_modules is unsuitable for that purpose — it contains build tooling (TypeScript, bundlers, test runners) that has no place in a production runtime and would otherwise bloat the final image if it were copied instead.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tracing what actually reaches the runtime image',
      language: 'bash',
      code: `# The main page's own Dockerfile, annotated by what survives:

# FROM node:20-alpine AS base
# WORKDIR /app

# FROM base AS deps
# COPY package*.json ./
# RUN npm ci --only=production
#   -> produces: /app/node_modules  (PRODUCTION deps only, no devDeps)
#   -> this node_modules IS copied into runtime. It survives.

# FROM base AS build
# COPY package*.json ./
# RUN npm ci
#   -> produces: /app/node_modules  (EVERY dep, including TypeScript,
#      test runners, bundlers -- whatever devDependencies lists)
# COPY . .
# RUN npm run build
#   -> produces: /app/dist  (compiled output)
#   -> the build stage's OWN node_modules is NEVER copied anywhere.
#      It existed purely to make "npm run build" possible, then the
#      entire build-stage filesystem (including that node_modules)
#      is discarded once the build finishes.

# FROM node:20-alpine AS runtime
# COPY --from=deps  /app/node_modules ./node_modules   <- from DEPS
# COPY --from=build /app/dist         ./dist            <- from BUILD
# The runtime image's node_modules and the build stage's node_modules
# are two ENTIRELY DIFFERENT directories that happen to share a name.`,
    },
    {
      label: 'What would go wrong copying node_modules from the WRONG stage',
      language: 'bash',
      code: `# Hypothetical mistake: copying node_modules from build instead
# of deps (an easy typo to make, since both stages have one):

# FROM node:20-alpine AS runtime
# COPY --from=build /app/node_modules ./node_modules   <- WRONG STAGE
# COPY --from=build /app/dist         ./dist

# What this would actually ship in production:
# - Every devDependency: typescript, ts-node, jest, eslint,
#   webpack/esbuild, @types/* packages -- none of which the running
#   app ever imports at runtime.
# - A meaningfully larger node_modules directory (often 2-5x the
#   size of a production-only install), increasing image size,
#   attack surface (more installed packages = more potential CVEs,
#   per this hub's own "minimal base images" security principle),
#   and cold-start time from a larger filesystem to load.

# The correct --from=deps line is small, easy to miss, and the ONLY
# thing preventing this exact mistake -- there is no build error or
# runtime error if the wrong stage is copied; the app still runs
# correctly, just with a bloated, less secure image.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer refactors the main page\'s own multi-stage Dockerfile, reasoning "we already run npm ci in the build stage, so let\'s remove the redundant deps stage and just copy node_modules from build instead — one less stage, simpler Dockerfile." Using this subtopic\'s theory, what breaks (or degrades) as a result of this refactor, even though the build still succeeds and the app still runs correctly?',
    hint: 'Per this subtopic\'s theory, what is actually different about the CONTENTS of node_modules produced by the deps stage versus the build stage?',
    solution: 'Per this subtopic\'s theory, the build still succeeds and the app still runs correctly — nothing breaks in a way that shows up as an error. What degrades is the final image itself: the build stage\'s node_modules was produced by a plain `npm ci` (no --only=production flag), meaning it includes every devDependency — TypeScript, test runners, linters, bundlers, and anything else listed in devDependencies — none of which the running application ever actually needs at runtime. Copying from build instead of deps ships all of that extra tooling into the production image, meaningfully increasing its size, its installed-package count (and therefore its potential CVE surface, per this hub\'s own established minimal-base-image security principle), and its cold-start/pull time — all without any build or runtime failure to signal that something has regressed. The "simpler Dockerfile" trades away exactly the benefit the two-stage npm ci split existed to provide.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s Dockerfile running npm ci twice (once in deps, once in build) is redundant work that could be simplified into a single shared install step.',
      reality: 'Per this subtopic\'s theory, the two installs produce genuinely different results on purpose — deps installs production-only dependencies specifically to be copied into the runtime image, while build installs every dependency (including dev tools) purely to make the build script runnable, and that node_modules is never copied anywhere.'
    },
    {
      thought: 'Since the build stage already has to run npm ci to build the app, copying its node_modules into the runtime image (instead of maintaining a separate deps stage) would work just as well and save a stage.',
      reality: 'Per this subtopic\'s exercise, doing so would silently ship every devDependency into production — TypeScript, test runners, bundlers — none of which the running app needs, bloating the image and expanding its attack surface with no build or runtime error to flag the regression.'
    },
    {
      thought: 'COPY --from=deps and COPY --from=build in the runtime stage are just two ways of referencing the same underlying build output, since both stages ultimately derive from the same base image.',
      reality: 'Per this subtopic\'s theory, deps and build are two completely separate build stages that each produce their OWN independent node_modules directory — deriving from the same base image only means they share a starting point, not that their outputs are interchangeable or identical.'
    }
  ];
}
