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
  templateUrl: './sibling-stages-build-in-parallel.html',
  styleUrl: './sibling-stages-build-in-parallel.scss'
})
export class SiblingStagesBuildInParallelSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Dockerfile reads top-to-bottom, implying deps then build then runtime, in that order',
      points: [
        'The main page\'s own Node.js Dockerfile lists its stages in this order: `base`, then `deps`, then `build`, then `runtime`. Reading any file top to bottom naturally suggests sequential execution — deps finishes, then build starts, then runtime starts.',
        'Nothing in the theory or the code tab\'s comments states otherwise. The page\'s own "Layer Caching and Dockerfile Instruction Order" theory bullet even reinforces a sequential mental model: "Order instructions from least-to-most frequently changing" — true within a SINGLE stage\'s own linear instruction list, but easy to over-generalize to stages themselves.',
        'Looking at what `deps` and `build` each actually depend on tells a different story: both stages derive from `FROM base`, and NEITHER one references the other — `build` does not say `FROM deps`, and `deps` does not appear anywhere in `build`\'s own instructions. They are independent siblings, not a sequential chain.',
      ]
    },
    {
      heading: 'What BuildKit actually does with two independent sibling stages',
      points: [
        'BuildKit (Docker\'s modern build engine, enabled by the main page\'s own `# syntax=docker/dockerfile:1` first line) does not execute a Dockerfile\'s stages in the order they are written. It builds a dependency graph (a DAG) from what each stage actually references via FROM and COPY --from, and executes any stage with no unmet dependencies as soon as it can — including running independent stages CONCURRENTLY.',
        'For the main page\'s own Dockerfile, this means once `base` finishes, `deps` and `build` can start running AT THE SAME TIME, on separate CPU cores if available — `deps`\'s `npm ci --only=production` and `build`\'s `npm ci` + `npm run build` are not waiting on each other in any way, so there is no reason for BuildKit to serialize them.',
        'Only `runtime`, which explicitly references both `COPY --from=deps` and `COPY --from=build`, has a real dependency on both finishing first — it is the one stage in this Dockerfile that genuinely must wait. The written top-to-bottom order of `deps` then `build` in the file has no bearing on which one BuildKit actually starts or finishes first.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The dependency graph the main page\'s own Dockerfile actually forms',
      language: 'bash',
      code: `# The main page's own stages, and what each one's FROM/COPY --from
# actually references (not the order they're WRITTEN in):

#   base       -- depends on: nothing (pulls node:20-alpine)
#   deps       -- depends on: base                    (FROM base)
#   build      -- depends on: base                    (FROM base)
#   runtime    -- depends on: deps AND build           (COPY --from=deps, COPY --from=build)
#                 (also independently pulls node:20-alpine fresh)

# As a dependency graph:
#
#        base
#       /    \\
#    deps    build
#       \\    /
#      runtime
#
# deps and build are SIBLINGS under base -- neither one is an
# ancestor of the other. BuildKit is free to run them concurrently
# the moment base is ready, and only needs to wait for BOTH before
# starting runtime.

# Confirm this yourself with BuildKit's own build output (timestamps
# interleave between #deps and #build steps rather than one finishing
# before the other starts):
DOCKER_BUILDKIT=1 docker build --progress=plain -t myapp .`,
    },
    {
      label: 'Why this matters for build time, and how to accidentally lose it',
      language: 'bash',
      code: `# On a multi-core build machine, deps and build running
# concurrently means total build time is closer to
# max(deps_time, build_time) rather than deps_time + build_time --
# a real, measurable speedup on CI runners with more than 1 core.

# ── How to accidentally serialize them (and lose the speedup) ────────────

# Hypothetical "simplification": making build depend on deps
# instead of both independently depending on base:
#
# FROM base AS deps
# COPY package*.json ./
# RUN npm ci --only=production
#
# FROM deps AS build          <- now build waits for deps to finish
# RUN npm ci                  <- installs devDeps ON TOP of deps's
#                                 production-only install
# COPY . .
# RUN npm run build
#
# This FORCES sequential execution -- build cannot start until deps
# fully finishes, even though build's own npm ci doesn't actually
# need anything deps produced. The main page's own version, where
# both stages independently derive from base, is what keeps them
# parallelizable -- a design choice worth preserving deliberately,
# not something to "clean up" by chaining stages together.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer notices the main page\'s own Dockerfile has deps and build both starting with `COPY package*.json ./` and `RUN npm ci` (just with different flags), and "deduplicates" it by changing build to say `FROM deps AS build` instead of `FROM base AS build`, reasoning this avoids installing from package.json twice. Using this subtopic\'s theory, what does this change actually cost, even if the final image ends up functionally identical?',
    hint: 'Per this subtopic\'s theory, does changing build\'s FROM line from base to deps create a new dependency between the two stages that did not exist before — and what does BuildKit do differently once that dependency exists?',
    solution: 'Per this subtopic\'s theory, this change genuinely does eliminate the appearance of duplicate work, but it costs the build\'s parallelism entirely. By changing `FROM base AS build` to `FROM deps AS build`, the developer has created a real dependency: build now cannot start until deps has fully finished, since build\'s own filesystem starts from deps\'s completed state rather than independently from base. Per this subtopic\'s theory, BuildKit\'s DAG-based scheduling only runs stages concurrently when neither depends on the other — once build explicitly depends on deps, BuildKit has no choice but to serialize them, turning what was `max(deps_time, build_time)` back into `deps_time + build_time`. On a multi-core CI runner, this can measurably slow down every build going forward, in exchange for eliminating what looked like redundant work but was actually two independent, deliberately-parallelizable installs.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Docker builds a multi-stage Dockerfile\'s stages in the order they appear in the file, top to bottom — deps finishes before build starts, which finishes before runtime starts.',
      reality: 'Per this subtopic\'s theory, BuildKit builds a dependency graph from each stage\'s actual FROM and COPY --from references, not from the order they\'re written — independent sibling stages like the main page\'s own deps and build can run concurrently, regardless of which one appears first in the file.'
    },
    {
      thought: 'Making one stage explicitly derive from another (FROM deps AS build instead of FROM base AS build) when they already do similar work is a harmless simplification that avoids redundant installs.',
      reality: 'Per this subtopic\'s exercise, doing so creates a real dependency that forces BuildKit to serialize the two stages — eliminating their ability to build concurrently and potentially slowing down every future build, even though the final image may end up functionally unchanged.'
    },
    {
      thought: 'The main page\'s own Dockerfile installing dependencies twice (once in deps, once in build) is simply an inefficiency in how the example was written, not a deliberate structural choice.',
      reality: 'Per this subtopic\'s theory, having deps and build each independently derive from base — rather than chaining one from the other — is exactly what allows BuildKit to run them in parallel; the apparent duplication is the direct, necessary cost of keeping the two stages independent and concurrently buildable.'
    }
  ];
}
