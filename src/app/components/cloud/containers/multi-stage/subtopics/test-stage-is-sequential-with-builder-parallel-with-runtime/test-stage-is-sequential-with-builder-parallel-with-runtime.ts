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
  templateUrl: './test-stage-is-sequential-with-builder-parallel-with-runtime.html',
  styleUrl: './test-stage-is-sequential-with-builder-parallel-with-runtime.scss'
})
export class TestStageIsSequentialWithBuilderParallelWithRuntimeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Go multi-stage example names its test stage\'s relationship to builder precisely',
      points: [
        'The main page\'s own Go code tab defines its test stage as `FROM builder AS test` — deriving directly from the already-built `builder` stage, not independently from a shared earlier point the way this hub\'s own sibling Dockerfile topic\'s `deps` and `build` stages both independently derive `FROM base`.',
        'That single word, `builder`, right after `FROM`, is exactly what determines the dependency relationship. Per BuildKit\'s own DAG-based scheduling — the same mechanism this hub\'s own sibling Dockerfile topic covers in detail — a stage that explicitly derives FROM another stage inherits that stage\'s entire completed filesystem, which means it cannot start until that stage is fully finished.',
        'This makes `test` fundamentally different from a stage like `deps` in the sibling Dockerfile example, which never references `build` at all and can therefore run alongside it. `test` genuinely, unavoidably waits for `builder` to complete first — there is no way to parallelize a stage against the exact stage it explicitly derives from.',
      ]
    },
    {
      heading: 'What test DOES run in parallel with, once it starts',
      points: [
        'The main page\'s own runtime stage is `FROM scratch AS runtime`, then `COPY --from=builder ...` — it also derives its copied artifacts from `builder`, but as an entirely SEPARATE stage that (like test) only references builder, never test itself. runtime and test are siblings of each other, both depending only on builder, with no reference to one another in either direction.',
        'This is the real parallelism BuildKit provides here: once `builder` finishes, `test` and `runtime` can both start immediately and build CONCURRENTLY, since neither one depends on the other. The main page\'s own QnA entry states this accurately: "a test stage and a prod-runtime stage that both derive from the builder stage can run at the same time" — the phrase "at the same time" describes test-and-runtime running together, not test-and-builder.',
        'The practical build-time consequence: adding a test stage this way costs roughly `max(test_time, runtime_time)` beyond builder\'s own completion, not `builder_time + test_time + runtime_time` added up sequentially — the parallelism with runtime is what keeps a full test suite from meaningfully slowing down every build, even though the test stage itself cannot start any earlier than immediately after builder finishes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The actual dependency graph this Dockerfile forms',
      language: 'bash',
      code: `# The main page's own three Go stages, and what each one's FROM
# / COPY --from actually references:
#
#   builder   -- depends on: nothing (pulls golang:1.22-alpine)
#   test      -- depends on: builder          (FROM builder)
#   runtime   -- depends on: builder           (COPY --from=builder, twice)
#
# As a dependency graph:
#
#          builder
#         /       \\
#      test       runtime
#
# test and runtime are SIBLINGS under builder -- neither references
# the other. Both must wait for builder to finish (there's no way
# around that, since test's own filesystem literally starts as a
# copy of builder's completed state), but once builder is done,
# test and runtime start and run CONCURRENTLY.

# Confirm with BuildKit's own build output -- test and runtime steps
# interleave with each other, but both only begin after every
# "builder" step has finished:
DOCKER_BUILDKIT=1 docker build --progress=plain --target runtime -t myapp .`,
    },
    {
      label: 'What it would take to make test genuinely independent of builder',
      language: 'bash',
      code: `# To make a test stage run concurrently WITH builder itself (not
# just with runtime), it would need to be restructured as a
# genuine sibling -- deriving independently from an EARLIER shared
# point, the same pattern the sibling Dockerfile topic's deps/build
# stages use:

# FROM golang:1.22-alpine AS base
# WORKDIR /src
# COPY go.mod go.sum ./
# RUN go mod download
# COPY . .

# FROM base AS builder
# RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/server ./cmd/server

# FROM base AS test              <- now a SIBLING of builder, not a
# RUN go test ./...              #    descendant of it
#
# FROM scratch AS runtime
# COPY --from=builder /bin/server /server

# With this restructuring, test and builder genuinely CAN run
# concurrently, since neither depends on the other -- but this is a
# different Dockerfile shape from the main page's own example, not
# something the main page's existing "FROM builder AS test" line
# already provides.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team profiles their CI pipeline and notices that adding the test stage from the main page\'s own Go Dockerfile added noticeable build time, even though the page\'s own QnA promises stages "can run at the same time." They assume BuildKit is misconfigured or the parallelism claim is simply false. Using this subtopic\'s theory, is there a more likely explanation that doesn\'t require assuming either of those?',
    hint: 'Per this subtopic\'s theory, which specific pair of stages does the main page\'s own QnA claim runs concurrently — test and builder, or test and something else?',
    solution: 'Per this subtopic\'s theory, there is a more likely explanation: the added build time is probably the genuinely unavoidable cost of the test stage having to wait for builder to finish first, since `FROM builder AS test` makes that a hard dependency — no BuildKit configuration changes that. The main page\'s own QnA claim ("a test stage and a prod-runtime stage... can run at the same time") is specifically about test running concurrently WITH runtime, not with builder itself — that part of the pipeline genuinely does parallelize, and is not where the added time is coming from. If the team wants test to also overlap with builder\'s own compile step (not just with runtime), the Dockerfile would need restructuring so test derives independently from an earlier shared stage (as shown in this subtopic\'s second code example) rather than directly from builder — a real, deliberate structural change, not a BuildKit misconfiguration to fix.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A test stage defined as FROM builder AS test runs concurrently with the builder stage itself, since BuildKit parallelizes independent stages.',
      reality: 'Per this subtopic\'s theory, FROM builder AS test creates a direct dependency — test inherits builder\'s entire completed filesystem, so it cannot start until builder is fully finished. The genuine parallelism in this Dockerfile is between test and runtime, both of which independently derive from builder without referencing each other.'
    },
    {
      thought: 'If a Dockerfile\'s own documentation or QnA claims two stages "can run at the same time," that applies to every pair of stages in the file, including a stage and the one it explicitly derives FROM.',
      reality: 'Per this subtopic\'s exercise, a parallelism claim is specific to the exact pair of stages being described — here, test-and-runtime, not test-and-builder. A stage that explicitly derives FROM another stage can never run concurrently with that specific ancestor, regardless of what BuildKit optimizations exist elsewhere in the same file.'
    },
    {
      thought: 'Restructuring a Dockerfile so a test stage derives from an earlier shared point instead of directly from the builder stage is a purely cosmetic difference with no build-time consequence.',
      reality: 'Per this subtopic\'s theory, this restructuring is what actually determines whether the test stage can run concurrently with the compile step itself — deriving from builder forces sequential execution after it; deriving independently from an earlier shared stage (alongside builder, not after it) is what genuinely unlocks that additional parallelism.'
    }
  ];
}
