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
  templateUrl: './repodigests-is-empty-until-a-registry-round-trip.html',
  styleUrl: './repodigests-is-empty-until-a-registry-round-trip.scss'
})
export class RepodigestsIsEmptyUntilARegistryRoundTripSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own code tab gets the digest AFTER pushing — the ordering isn\'t explained, but it isn\'t arbitrary either',
      points: [
        'The main page\'s own "Docker Image Lifecycle" code tab runs Step 2 (`docker push` for all three tags) BEFORE Step 3 (`docker inspect --format=\'{{index .RepoDigests 0}}\'`). Nothing in the comments explains why the inspect step has to come after the push — a reader could easily assume this ordering is just narrative convenience, and move the inspect step earlier without noticing anything is wrong yet.',
        'This ordering is not arbitrary. A repo digest is only attached to an image once it has been pushed to or pulled from a registry — a freshly built image (right after `docker build`, before any push) has an image ID, but no repo digest at all. The registry, not the local Docker daemon, computes and assigns the manifest digest; without a round trip to a registry, there is nothing for `RepoDigests` to contain.',
      ]
    },
    {
      heading: 'What actually happens if the ordering is reversed',
      points: [
        'Running `docker inspect --format=\'{{index .RepoDigests 0}}\'` on an image that was only just built — before any `docker push` — doesn\'t return a stale or wrong digest, it fails outright: `docker inspect --format \'{{json .RepoDigests}}\'` on a built-but-never-pushed image returns an empty array (`[]`). Indexing into an empty array with `index .RepoDigests 0` produces a template execution error, not a silently wrong value.',
        'This means the main page\'s own Step 3 is quietly load-bearing on Step 2 having already succeeded and completed — if the script were refactored to run Step 3 in parallel with Step 2 (a plausible-looking "optimization" for a script that otherwise looks like independent sequential steps), or if Step 2\'s push failed silently and the script continued anyway, Step 3 would break immediately rather than producing a misleading result.',
        'The underlying reason ties back to what a digest actually IS: a cryptographic hash the REGISTRY computes over the exact manifest it received and stored. A local Docker daemon has no registry-side manifest to hash yet before a push happens — the digest genuinely does not exist anywhere until that round trip completes, it isn\'t merely "not yet looked up."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Running Step 3 before Step 2 -- what actually happens',
      language: 'bash',
      code: `# Reordering the main page's own steps (DON'T do this):

IMAGE="ghcr.io/myorg/myapp"
VERSION="1.2.3"

docker build -t "\${IMAGE}:\${VERSION}" .

# Trying to get the digest BEFORE pushing:
DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' "\${IMAGE}:\${VERSION}")
# template: error calling index: index of untyped nil
# (or similar -- RepoDigests is an empty array [] at this point,
#  since nothing has pushed to or pulled from a registry yet)

echo "\${DIGEST}"   # this line never produces a useful digest --
                    # the command above already failed

docker push "\${IMAGE}:\${VERSION}"   # too late, digest lookup
                                     # already failed above`,
    },
    {
      label: 'The main page\'s own correct ordering, and why it works',
      language: 'bash',
      code: `IMAGE="ghcr.io/myorg/myapp"
VERSION="1.2.3"

docker build -t "\${IMAGE}:\${VERSION}" .
# At this point: RepoDigests is [] -- image exists only locally,
# identified by its local image ID, not a registry-assigned digest.

docker push "\${IMAGE}:\${VERSION}"
# The registry receives the manifest, computes its own SHA256 hash
# over it, and returns that digest. Docker records this locally.

DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' "\${IMAGE}:\${VERSION}")
echo "Immutable reference: \${DIGEST}"
# ghcr.io/myorg/myapp@sha256:abc123...
# NOW this works -- RepoDigests has at least one entry, because the
# push in the line above already completed the registry round trip
# that populates it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate refactors the main page\'s own Docker Image Lifecycle script to run the digest lookup (`docker inspect ... RepoDigests`) in parallel with the three `docker push` commands, reasoning "inspect just reads image metadata, it doesn\'t need to wait for the push to finish." The refactored script now fails intermittently. Using this subtopic\'s theory, explain why "just reads metadata" is the wrong mental model here, and what specifically the digest lookup is actually waiting on.',
    hint: 'Per this subtopic\'s theory, does a Docker image\'s digest exist anywhere — locally or remotely — before a push actually completes?',
    solution: 'The refactor breaks intermittently because "just reads image metadata" assumes the digest already exists somewhere and inspect is merely retrieving it — but per this subtopic\'s theory, the digest genuinely does not exist anywhere until the registry computes it as part of a completed push. RepoDigests is empty on a freshly built, unpushed image, and only gets populated once Docker records the registry\'s own digest response after a push (or pull) completes. Running the digest lookup in parallel with the push means it can execute at any point BEFORE the push has finished registering the digest — sometimes racing ahead successfully if the push happens to complete first by chance, sometimes failing (an empty-array index error) if the lookup runs before the push\'s registry round trip is done. The fix is what the main page\'s own script already does: run the digest lookup strictly AFTER the push completes, not in parallel with it — this isn\'t a performance nicety, it\'s a genuine data dependency.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '`docker inspect --format=\'{{index .RepoDigests 0}}\'` reads a property that\'s always available on any built image — it\'s "just metadata," so it can run at any point after `docker build`.',
      reality: 'Per this subtopic\'s theory, RepoDigests is empty (`[]`) on a freshly built image that has never been pushed to or pulled from a registry — the digest is computed by the REGISTRY, not the local Docker daemon, so there is nothing for this command to return until a push (or pull) actually completes.'
    },
    {
      thought: 'If the digest lookup in the main page\'s own script somehow ran before the push, it would just return an older or slightly wrong digest value, not fail outright.',
      reality: 'This subtopic\'s first code example shows the actual failure mode is a hard error — indexing into RepoDigests\' empty array before any push produces a template execution error, not a stale-but-plausible value. There is no "old digest" to fall back to, since the image was never pushed before, so no digest has ever existed for it at all.'
    },
    {
      thought: 'The main page\'s own step ordering (push before inspect) is just a readable narrative sequence — reordering it for a parallel/optimized script would be a safe refactor as long as both steps still eventually run.',
      reality: 'Per this subtopic\'s theory, the ordering encodes a genuine data dependency, not narrative convenience — the inspect step reads a value the push step is what actually produces (via the registry). Running them in parallel introduces a real race condition, not just a stylistic change.'
    }
  ];
}
