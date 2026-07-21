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
  templateUrl: './all-tags-push-uploads-shared-layers-once.html',
  styleUrl: './all-tags-push-uploads-shared-layers-once.scss'
})
export class AllTagsPushUploadsSharedLayersOnceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own code tab tags one image three times, then pushes all of them — without connecting this to a rule stated earlier on the SAME page',
      points: [
        'The main page\'s own "Pull / Tag / Push" code tab runs three separate `docker tag` commands against the exact same source image (`myapp:build`), producing three tags — `2.3.1`, `2.3`, and `latest` — then a single `docker push ghcr.io/myorg/myapp --all-tags` line. Nothing in the comment ("# Push all tags at once") addresses what this actually costs in upload time or bandwidth.',
        'The main page\'s own separate theory bullet, a few lines earlier, states the general principle: "docker push uploads only layers not yet present in the remote registry." That bullet is written about pushing a single tag; the reader has to independently notice it also applies once three tags of the identical content are pushed together.',
        'Since all three tags were created from the exact same image ID with plain `docker tag` (which the main page\'s own theory separately confirms "creates a new reference pointing to the same image ID. No data is copied"), the three tags do not represent three different sets of layers — they are three names for the identical stack of layers.',
      ]
    },
    {
      heading: 'What --all-tags actually uploads, and why the second and third tags are nearly free',
      points: [
        'When `docker push --all-tags` runs, the client uploads each tag\'s manifest to the registry, but the underlying LAYER blobs are only ever uploaded once per unique digest — the registry already has every layer after the FIRST tag\'s push completes, so the second and third tag pushes only need to upload a small manifest referencing digests the registry can confirm it already holds.',
        'This is the direct extension of the same content-addressable principle the main page already states for a single push: "before uploading, the Docker client asks the registry which layer digests it already has... skips it" (from the page\'s own QnA). Pushing three tags of one image triggers that same digest-check three times, but the actual upload of image content happens effectively once.',
        'Practically, this means the main page\'s own separate mistake entry — "Tagging with only one tag before pushing," which recommends always pushing BOTH a version tag and `:latest` — costs almost nothing extra in upload bandwidth once the first tag has pushed successfully. The advice to push multiple tags is low-cost specifically BECAUSE of the same layer-deduplication mechanism the page describes elsewhere, a connection the mistake entry itself never makes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tracing what --all-tags actually uploads, tag by tag',
      language: 'bash',
      code: `# The main page's own three tags, all pointing at the identical
# image content (myapp:build), then pushed together:
docker tag myapp:build ghcr.io/myorg/myapp:2.3.1
docker tag myapp:build ghcr.io/myorg/myapp:2.3
docker tag myapp:build ghcr.io/myorg/myapp:latest

docker push ghcr.io/myorg/myapp --all-tags

# What actually happens, per tag, assuming NONE of the layers exist
# in the registry yet:
#
# Pushing tag "2.3.1":
#   - Client checks each layer digest against the registry -> none found
#   - Uploads EVERY layer (say, 180MB across 6 layers)
#   - Uploads the manifest for tag "2.3.1"
#
# Pushing tag "2.3" (SAME image ID as 2.3.1):
#   - Client checks each layer digest -> registry now already HAS
#     all of them (just uploaded seconds ago under tag 2.3.1)
#   - Uploads ZERO layer bytes
#   - Uploads only a small manifest referencing the SAME digests,
#     now pointing at the name "2.3"
#
# Pushing tag "latest" (SAME image ID again):
#   - Identical story -- zero layer bytes uploaded, one small
#     manifest upload

# Net result: ~180MB of actual image content transferred ONCE,
# plus three small manifest uploads -- not 3x180MB.`,
    },
    {
      label: 'Why this makes "always push a version tag AND :latest" cheap advice to follow',
      language: 'bash',
      code: `# The main page's own "Tagging with only one tag before pushing"
# mistake entry recommends this fix:
docker tag myapp:build ghcr.io/org/myapp:2.3.1
docker tag myapp:build ghcr.io/org/myapp:latest
docker push ghcr.io/org/myapp:2.3.1
docker push ghcr.io/org/myapp:latest

# Pushed as two SEPARATE commands (not --all-tags) here -- same
# underlying mechanism still applies, since it's a registry-side
# digest check, not something --all-tags itself does differently:
#
# docker push ...:2.3.1  -> uploads all layers (first time seen)
# docker push ...:latest -> registry already has every digest from
#                            the :2.3.1 push moments earlier ->
#                            near-instant manifest-only upload
#
# The "extra" :latest push the mistake entry recommends costs
# roughly the time to upload one small manifest file, not a second
# full image transfer -- which is exactly why this advice is
# practical to follow on every release, not just an occasional
# nice-to-have.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s CI pipeline currently pushes only a single version tag per release to save on registry bandwidth and pipeline time, reasoning that adding a second :latest push would roughly double the upload time for every release. Using this subtopic\'s theory, is that reasoning accurate, and what would actually happen if they added the second push?',
    hint: 'Per this subtopic\'s theory, when a second tag points at the exact same image content as a tag that was just pushed, does the registry re-receive the full layer data again, or does it recognize the layers it already has?',
    solution: 'The reasoning is not accurate, and adding the second push would not meaningfully double upload time. Per this subtopic\'s theory, both docker tag commands (for the version tag and for :latest) point at the exact same underlying image ID and layer stack — nothing about creating a second tag duplicates any image content. When the second push runs, the Docker client checks each layer\'s digest against what the registry already has; since the first push (moments earlier, same pipeline run) already uploaded every layer under the version tag, the registry reports it already holds all of them, and the second push for :latest uploads only a small manifest file referencing those same digests — not the image content itself. In practice, the added cost is roughly the time for one small manifest upload and API round-trip, not a second multi-hundred-megabyte transfer. The team could add the :latest push (or any additional tag) with negligible added pipeline time, following the main page\'s own recommended fix for its "Tagging with only one tag before pushing" mistake entry at essentially no bandwidth cost.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'docker push --all-tags (or pushing multiple separate tags of the same image) uploads the full image content once per tag, roughly multiplying total upload time by the number of tags.',
      reality: 'Per this subtopic\'s theory, the registry\'s content-addressable layer storage means identical layers are only ever uploaded once — pushing a second or third tag of the SAME image content triggers a digest check that finds every layer already present, resulting in only a small manifest upload rather than a second full transfer.'
    },
    {
      thought: 'The main page\'s "always push a version tag AND :latest" advice is a trade-off between traceability and bandwidth cost — worth it for important releases but too expensive to do on every push.',
      reality: 'Per this subtopic\'s exercise, the actual bandwidth cost of an additional tag pointing at identical content is negligible (one small manifest upload, not a duplicated image transfer) — there is no real trade-off to weigh, and the advice is cheap enough to follow on every release without a bandwidth concern.'
    },
    {
      thought: 'The layer-deduplication behavior that makes multi-tag pushes cheap is something specific to the --all-tags flag, not something that would also apply if the same tags were pushed with separate, individual docker push commands.',
      reality: 'Per this subtopic\'s theory, the deduplication happens registry-side, based purely on which layer digests the registry already has — it applies identically whether multiple tags are pushed together via --all-tags or as separate sequential docker push commands, since the mechanism has nothing to do with how the push command was invoked.'
    }
  ];
}
