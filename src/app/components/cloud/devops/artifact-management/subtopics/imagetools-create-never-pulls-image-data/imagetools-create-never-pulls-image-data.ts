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
  templateUrl: './imagetools-create-never-pulls-image-data.html',
  styleUrl: './imagetools-create-never-pulls-image-data.scss'
})
export class ImagetoolsCreateNeverPullsImageDataSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Docker Image Lifecycle tab uses two different copy/tag tools back to back, with no explanation of why',
      points: [
        'The main page\'s own "Docker Image Lifecycle" code tab does two things in sequence: `skopeo copy` to move the image between registries (Step 4), then `docker buildx imagetools create --tag ... "myacr.azurecr.io/myapp:${VERSION}"` to add a "prod-validated" tag to the image already sitting in the destination registry. Neither line explains why the second step doesn\'t just use another `docker tag` / `docker push`, or why `skopeo copy` itself was chosen for Step 4 instead of a plain `docker pull` + `docker push`.',
        'Docker\'s own documentation describes what `imagetools create` actually does: "Create a new manifest list based on source manifests. The source manifests can be manifest lists or single platform distribution manifests and must already exist in the registry where the new manifest is created." This is a fundamentally different operation from `docker tag`, which requires the image to already exist as a local image on the machine running the command.',
      ]
    },
    {
      heading: 'Why this matters: no image data ever touches the CI runner for either step',
      points: [
        'Both `skopeo copy` and `docker buildx imagetools create` are REGISTRY-SIDE operations — they instruct one registry (or the same registry) to reference existing manifest/layer data, without pulling that data down to the machine running the command first. This is exactly why the main page\'s own comment on `skopeo copy` notes "no Docker daemon required on CI runner" — there is no local image to build a daemon around at all.',
        'A plausible-looking alternative — `docker pull myacr.azurecr.io/myapp:${VERSION}` then `docker tag ... && docker push ...` — would work, but only after downloading the full image (potentially hundreds of megabytes or more) to the CI runner first, then re-uploading it again just to add a tag. For a large image, or a CI runner with limited bandwidth/disk, this is real, avoidable cost that `imagetools create`\'s registry-side manifest operation never incurs.',
        'This is also why `imagetools create` can only reference manifests that "must already exist in the registry" per Docker\'s own docs — it is not creating new image content, only a new pointer (tag) to content the registry already has. Running it against a tag that was never actually pushed to that registry will fail, since there is nothing for the new tag to reference.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The expensive way -- pull, tag, push, all through the CI runner',
      language: 'bash',
      code: `# What the main page's own "docker buildx imagetools create" step
# is deliberately avoiding:

docker pull myacr.azurecr.io/myapp:1.2.3
#    ^ downloads the FULL image (every layer) to the CI runner --
#      could be hundreds of MB to several GB

docker tag myacr.azurecr.io/myapp:1.2.3 myacr.azurecr.io/myapp:prod-1.2.3

docker push myacr.azurecr.io/myapp:prod-1.2.3
#    ^ re-uploads the FULL image again, even though the registry
#      already had every byte of it from the pull a moment ago

# Net effect: one full download + one full upload, purely to attach
# a second tag to content the registry already possessed.`,
    },
    {
      label: 'The main page\'s own actual approach -- registry-side, no data transfer',
      language: 'bash',
      code: `# The main page's own code tab:
docker buildx imagetools create \\
  --tag "myacr.azurecr.io/myapp:prod-\${VERSION}" \\
  "myacr.azurecr.io/myapp:\${VERSION}"

# Per Docker's own docs: "Create a new manifest list based on
# source manifests... must already exist in the registry where the
# new manifest is created."
#
# This tells the REGISTRY ITSELF: "myapp:prod-1.2.3 should point at
# the exact same manifest as myapp:1.2.3" -- no image layers are
# downloaded to the CI runner, and none are re-uploaded. The
# registry does the pointer-update internally.
#
# This is the same underlying reason the main page's own skopeo
# copy step (Step 4, moving the image between DIFFERENT registries)
# works "no Docker daemon required" -- skopeo also operates
# registry-to-registry, without needing a full local pull first.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate is adding a "prod-validated" tag to an image already sitting in a registry, and reaches for `docker pull` + `docker tag` + `docker push` because "that\'s the normal way to tag a Docker image." On a large, multi-gigabyte image, this step alone adds several minutes to the CI pipeline. Using this subtopic\'s theory, explain what specifically is being wasted, and the fix.',
    hint: 'Per this subtopic\'s theory, does the registry already have every byte of the image before the pull even starts — and if so, what is the pull/push round-trip actually accomplishing?',
    solution: 'The pull/push round-trip is wasting a full download AND a full re-upload of image content the registry already has in full — per this subtopic\'s theory, the registry already possesses every layer of `myapp:1.2.3` (it was pushed there earlier in the pipeline), so pulling it down to the CI runner just to immediately push it back up under a new tag transfers the same bytes twice for no functional benefit. The fix is `docker buildx imagetools create --tag myapp:prod-1.2.3 myapp:1.2.3`, exactly as the main page\'s own code tab does — per Docker\'s own docs, this "creates a new manifest list based on source manifests" that "must already exist in the registry," meaning the entire operation happens registry-side: the registry is told to make `prod-1.2.3` point at the same content as `1.2.3`, with zero image data ever touching the CI runner in either direction.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Adding a second tag to an already-pushed Docker image always requires pulling the image locally first, since that\'s how `docker tag` works.',
      reality: 'Per this subtopic\'s theory, `docker tag` does require a local image, but `docker buildx imagetools create` is a different tool specifically for this case — Docker\'s own docs describe it as operating on manifests that "must already exist in the registry," meaning it can add a new tag purely registry-side, with no local pull required at all.'
    },
    {
      thought: 'The main page\'s own use of both `skopeo copy` and `docker buildx imagetools create` in the same code tab is redundant — one full-featured tool should be able to do both jobs.',
      reality: 'This subtopic\'s theory shows they solve genuinely different problems that happen to share the same underlying principle (registry-side operation, no local data transfer): `skopeo copy` moves an image BETWEEN two different registries; `imagetools create` adds a new tag WITHIN a registry the image is already in. Using each for its specific job is deliberate, not redundant.'
    },
    {
      thought: '`docker buildx imagetools create` can be used to add a tag to any image reference, whether or not that image has actually been pushed anywhere yet.',
      reality: 'Per this subtopic\'s theory, Docker\'s own docs are explicit that the source manifest "must already exist in the registry where the new manifest is created" — imagetools create only ever references existing registry content, it cannot conjure a tag for an image that was never pushed.'
    }
  ];
}
