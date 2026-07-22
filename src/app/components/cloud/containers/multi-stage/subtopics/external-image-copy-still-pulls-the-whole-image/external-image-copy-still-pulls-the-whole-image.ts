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
  templateUrl: './external-image-copy-still-pulls-the-whole-image.html',
  styleUrl: './external-image-copy-still-pulls-the-whole-image.scss'
})
export class ExternalImageCopyStillPullsTheWholeImageSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA frames external-image COPY as a way to avoid overhead — without naming the overhead it doesn\'t avoid',
      points: [
        'The main page\'s own QnA answer for external-image COPY says: "COPY --from=golang:1.22 /usr/local/go /usr/local/go pulls the golang image and copies /usr/local/go into the current stage. This is useful for copying tools... without defining a dedicated FROM stage for them."',
        'The phrase "without defining a dedicated FROM stage" reads as the main benefit being avoided boilerplate — one line instead of a small extra stage. Framed that way, it sounds like a lighter-weight alternative to a full stage.',
        'It is lighter-weight in terms of Dockerfile LINES, but not in terms of what actually gets downloaded. Per Docker\'s own documented behavior, `COPY --from=<external image>` requires the Docker client to pull that image if it is not already present locally — and that pull fetches every layer of the referenced image, not just the specific file or directory path named in the COPY instruction.',
      ]
    },
    {
      heading: 'What "pulls the entire image" actually costs, and when it doesn\'t matter',
      points: [
        'There is no mechanism in current Docker/BuildKit for a sparse, partial fetch of just one path from a remote image\'s layers — the underlying registry protocol and image format do not support extracting a single file without first having the full layer stack available locally to read from.',
        'On a build host that ALREADY has the referenced image cached locally (e.g. `golang:1.22` was already pulled for an earlier, separate purpose, or a previous build already used it), this cost is invisible — Docker only pulls layers not already present, so a fully-cached external image adds no extra network time at all.',
        'On a fresh host with no cache — a new CI runner, a freshly-provisioned build machine, an ephemeral build container — pulling `golang:1.22` (hundreds of MB, including the full Go toolchain) just to copy out `/usr/local/go` costs the FULL image download, every single time, even though the final Dockerfile only ever uses a small fraction of what was downloaded.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own example, and what it actually downloads on a fresh host',
      language: 'bash',
      code: `# The main page's own QnA example:
COPY --from=golang:1.22 /usr/local/go /usr/local/go

# On a build host with NO local cache of golang:1.22:
#
# 1. Docker client sees this references an external image, not a
#    named stage in the current Dockerfile.
# 2. It pulls golang:1.22 -- ALL of it. Every layer. This image
#    bundles the entire Go toolchain: compiler, standard library
#    source, docs, and more -- typically several hundred MB.
# 3. Only AFTER the full pull completes does Docker read
#    /usr/local/go out of the now-locally-available image and
#    copy just that directory into the current build stage.
#
# The final built image only ever contains /usr/local/go -- but
# getting there required downloading the WHOLE golang:1.22 image
# to the build host first, even though 95%+ of what was downloaded
# (everything except /usr/local/go) is discarded immediately after.

docker images golang
# REPOSITORY   TAG    SIZE
# golang       1.22   819MB    <- all of this was pulled to the
#                                  build host, not just the ~200MB
#                                  /usr/local/go directory itself`,
    },
    {
      label: 'When this cost disappears, and the actual trade-off vs. a dedicated stage',
      language: 'bash',
      code: `# If golang:1.22 is ALREADY cached locally (e.g. because the SAME
# Dockerfile also has "FROM golang:1.22-alpine AS builder" earlier,
# or a previous unrelated build pulled it), the external-image COPY
# costs nothing extra -- Docker skips layers already present,
# exactly like any other pull.

# The genuine trade-off, stated precisely:
#
# COPY --from=<external image>:
#   + One line, no extra FROM/AS boilerplate
#   - Pulls the FULL external image on a cache-miss (fresh host)
#
# A dedicated FROM ... AS toolstage:
#   FROM golang:1.22 AS goruntime
#   (then COPY --from=goruntime /usr/local/go /usr/local/go later)
#   + Same actual pull cost on a cache miss (still needs the full
#     image to exist locally before COPY --from can read from it)
#   + But makes the dependency EXPLICIT and named, easier to spot
#     in a Dockerfile review or when auditing what external images
#     a build actually depends on
#
# The pull cost is IDENTICAL either way -- the main page's own
# "without defining a dedicated FROM stage" framing is accurate
# about saving Dockerfile lines, but doesn't address (and could be
# misread as addressing) the actual network/storage cost, which a
# named stage doesn't reduce either.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team switches their CI runners from persistent, long-lived machines to fresh, ephemeral containers spun up per build (a common cost-saving or security move). After the switch, a Dockerfile using the main page\'s own COPY --from=golang:1.22 /usr/local/go /usr/local/go pattern to grab the Go toolchain starts taking noticeably longer to build, even though nothing in the Dockerfile itself changed. Using this subtopic\'s theory, explain why.',
    hint: 'Per this subtopic\'s theory, does the cost of COPY --from=<external image> depend on whether that image is already cached locally — and does switching to fresh, ephemeral CI runners change how often that\'s true?',
    solution: 'Per this subtopic\'s theory, this is exactly the expected consequence of the infrastructure change, not a Dockerfile regression. On the old, persistent CI machines, golang:1.22 was very likely already cached locally from a previous build, so COPY --from=golang:1.22 cost nothing extra — Docker would skip every layer it already had. On fresh, ephemeral runners, EVERY build starts with an empty local image cache, meaning golang:1.22 has to be pulled in full on every single build — the several-hundred-megabyte download that was previously a one-time, amortized cost now happens repeatedly, once per build. Nothing about the Dockerfile\'s own correctness changed; the team is now paying, on every build, the full external-image-pull cost this subtopic\'s theory identifies as always being there, just previously hidden by the persistent runners\' warm cache. The fix isn\'t necessarily to abandon the technique — it\'s recognizing that on ephemeral infrastructure, either a registry mirror/pull-through cache for golang:1.22, or restructuring to a named stage the Dockerfile can share a build cache for across steps, becomes worth the extra setup in a way it wasn\'t on the old persistent runners.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'COPY --from=<external image> is a lightweight way to grab a single file or directory from another image, since it only needs to read that one path, not the whole thing.',
      reality: 'Per this subtopic\'s theory, Docker has no mechanism for a sparse, partial fetch from a remote image — COPY --from on an external image requires pulling every layer of that image locally first, then reading the requested path out of the now-fully-present image; only the FINAL COPIED OUTPUT is small, not the download that made it possible.'
    },
    {
      thought: 'Using COPY --from=<external image> instead of a dedicated FROM ... AS stage avoids the cost of pulling that external image, since there\'s no separate stage building it.',
      reality: 'Per this subtopic\'s theory, both approaches require the exact same full image pull on a cache miss — a dedicated stage doesn\'t add extra pull cost, and skipping the dedicated stage doesn\'t reduce it. The only real difference is Dockerfile line count and whether the dependency is named explicitly.'
    },
    {
      thought: 'The cost of COPY --from=<external image> is a fixed, predictable overhead that doesn\'t depend on the build environment.',
      reality: 'Per this subtopic\'s exercise, the cost is entirely conditional on whether the external image is already cached locally — on a persistent build machine with a warm cache it can be effectively free, while on fresh, ephemeral CI runners with no cache, the exact same Dockerfile pays the full image-pull cost on every single build.'
    }
  ];
}
