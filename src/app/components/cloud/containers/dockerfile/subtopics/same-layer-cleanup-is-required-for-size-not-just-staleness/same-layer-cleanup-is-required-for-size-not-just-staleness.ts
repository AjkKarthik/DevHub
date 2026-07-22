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
  templateUrl: './same-layer-cleanup-is-required-for-size-not-just-staleness.html',
  styleUrl: './same-layer-cleanup-is-required-for-size-not-just-staleness.scss'
})
export class SameLayerCleanupIsRequiredForSizeNotJustStalenessSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry fixes two problems with one change, but only explains one of them',
      points: [
        'The main page\'s "apt-get update in a separate RUN" mistake entry shows the fix as a single combined instruction: `RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*`. Its own explanation says: "Cached RUN apt-get update layers go stale... apt still uses the stale index and may pull old packages."',
        'That explanation only accounts for the FIRST two parts of the combined command — update and install happening together fixes staleness. It says nothing at all about the THIRD part, `rm -rf /var/lib/apt/lists/*`, which has nothing to do with staleness and everything to do with a completely different concern.',
        'This mirrors a mechanism this hub\'s own Container Fundamentals content already establishes: "deletion in a later layer does not reclaim space from an earlier layer" — the SAME underlying union-filesystem behavior applies here, but the mistake entry never draws the connection.',
      ]
    },
    {
      heading: 'What the cleanup line is actually doing, and why its position matters just as much as its presence',
      points: [
        'Each RUN instruction commits exactly one new layer, capturing the filesystem changes made during that instruction. If `apt-get install` (which downloads and caches package index files into `/var/lib/apt/lists/`) and `rm -rf /var/lib/apt/lists/*` happen in the SAME RUN, those cache files are created and deleted within the SAME layer — they never persist in the image\'s layer history at all, and the layer\'s own final size never includes them.',
        'If the exact same `rm -rf /var/lib/apt/lists/*` command instead ran in a LATER, separate RUN instruction, the outcome would look identical from inside a running container (the files appear gone either way) — but the image\'s actual on-disk size would NOT shrink. The earlier layer, where apt-get install created those cache files, still contains them; the later layer only adds a "whiteout" marker hiding them from view, without reclaiming any of the space the earlier layer already committed.',
        'This means the main page\'s own combined RUN line is doing double duty: `apt-get update && apt-get install` together fixes the staleness problem the mistake entry explains, while `&& rm -rf /var/lib/apt/lists/*` being in that SAME command is what makes the cleanup actually shrink the image — a second, independent reason for combining these three commands into one RUN that the mistake entry\'s own explanation never states.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same cleanup command, two different layer placements, two different image sizes',
      language: 'bash',
      code: `# ── Version A: cleanup in the SAME RUN as install (main page's own fix) ──
# RUN apt-get update \\
#  && apt-get install -y --no-install-recommends curl \\
#  && rm -rf /var/lib/apt/lists/*
#
# One layer. Package index files are created AND deleted within
# this single layer's own filesystem diff -- they never appear in
# the layer's committed content at all.

docker history myimage:version-a
# LAYER SIZE   CREATED BY
# 8.2MB        RUN apt-get update && apt-get install ... && rm -rf ...
# (curl itself + its deps, minus the apt cache -- cache never counted)

# ── Version B: cleanup in a SEPARATE, later RUN ──────────────────────────
# RUN apt-get update && apt-get install -y --no-install-recommends curl
# RUN rm -rf /var/lib/apt/lists/*
#
# TWO layers. The first layer commits the apt cache files as part of
# its own diff. The second layer's diff is just a "this file/dir is
# now absent" whiteout marker -- it does NOT shrink the first layer.

docker history myimage:version-b
# LAYER SIZE   CREATED BY
# 8.2MB        RUN apt-get update && apt-get install...   <- cache STILL here
# 0B           RUN rm -rf /var/lib/apt/lists/*            <- just a marker
#
# Total image size: LARGER than version A, even though "ls
# /var/lib/apt/lists/" inside a running container from EITHER image
# shows the exact same (empty) result.`,
    },
    {
      label: 'Confirming this yourself',
      language: 'bash',
      code: `# Build both versions, compare total image size:
docker build -t myimage:version-a -f Dockerfile.same-run .
docker build -t myimage:version-b -f Dockerfile.separate-run .

docker image ls --format "{{.Repository}}:{{.Tag}}\\t{{.Size}}"
# myimage:version-a   145MB
# myimage:version-b   152MB    <- the apt cache size, still counted

# Confirm what a running container from EACH image actually sees
# (identical -- this is what makes the size difference easy to miss
# without directly comparing docker image ls output):
docker run --rm myimage:version-a ls /var/lib/apt/lists/
# (empty)
docker run --rm myimage:version-b ls /var/lib/apt/lists/
# (empty)
# Both look identical from inside the container. Only the actual
# on-disk image size (docker image ls, or docker history per-layer)
# reveals that version B never reclaimed the space.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer reviewing the main page\'s own Dockerfile mistake entry reasons: "the fix is really about avoiding a stale package index — the rm -rf at the end is just a nice-to-have cleanup step, so it should be fine to move it to its own RUN line at the end of the Dockerfile for readability." Using this subtopic\'s theory, what would actually happen to the image if this reasoning were followed literally?',
    hint: 'Per this subtopic\'s theory, does moving rm -rf /var/lib/apt/lists/* to a separate, later RUN instruction still shrink the image the way it did when combined with the install command?',
    solution: 'Per this subtopic\'s theory, the developer\'s reasoning is only half correct — the staleness fix (combining update and install) is preserved either way, since that part of the reasoning is accurate. But moving the `rm -rf /var/lib/apt/lists/*` to its own separate, later RUN instruction is not a harmless readability improvement — it silently defeats the entire purpose of the cleanup. The apt package index files get committed into the earlier install layer regardless of when the rm -rf runs; only deleting them within that SAME layer (the same RUN instruction) prevents them from ever being committed in the first place. Once separated into a later RUN, the union filesystem\'s layer-diff model means those files\' bytes remain permanently in the earlier, already-committed layer — the later layer only adds a whiteout marker hiding them from a running container\'s view, without reclaiming any actual disk space. The refactored Dockerfile would build successfully, the app would run identically, and `ls /var/lib/apt/lists/` inside the container would show the same empty result either way — but `docker image ls` would reveal the "cleaned up" image is now measurably larger than before, with no error or warning anywhere to catch the regression.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own mistake entry combines apt-get update, install, and rm -rf into one RUN purely to fix the stale-package-index problem its explanation describes — the cleanup command\'s placement is not load-bearing for anything else.',
      reality: 'Per this subtopic\'s theory, the SAME RUN placement is independently required for the cleanup to actually reduce image size at all — a union filesystem only reclaims space when a file is created and deleted within the same layer; the mistake entry\'s own explanation never mentions this second reason for the combined command.'
    },
    {
      thought: 'Running rm -rf /var/lib/apt/lists/* in a separate, later RUN instruction achieves the same result as running it in the same RUN as the install — the files are gone either way, which is what matters.',
      reality: 'Per this subtopic\'s exercise, "gone" from a running container\'s point of view and "reclaimed from the image\'s actual size" are two different outcomes — a later-layer deletion only hides the files with a whiteout marker; the earlier layer that created them still counts their full size in the final image.'
    },
    {
      thought: 'Comparing two Dockerfiles by running commands inside their resulting containers (like ls /var/lib/apt/lists/) is a reliable way to confirm whether a cleanup step actually reduced image size.',
      reality: 'Per this subtopic\'s theory, a running container\'s filesystem view is identical whether cleanup happened in the same layer or a later one — only checking the actual image size directly (docker image ls, or per-layer sizes via docker history) reveals whether the cleanup genuinely shrank anything, since the in-container view cannot distinguish "never existed in this layer" from "hidden by a later whiteout."'
    }
  ];
}
