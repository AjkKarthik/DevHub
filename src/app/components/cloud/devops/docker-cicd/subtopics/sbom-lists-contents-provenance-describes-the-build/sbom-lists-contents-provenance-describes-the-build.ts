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
  templateUrl: './sbom-lists-contents-provenance-describes-the-build.html',
  styleUrl: './sbom-lists-contents-provenance-describes-the-build.scss'
})
export class SbomListsContentsProvenanceDescribesTheBuildSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own build command sets --sbom=true and --provenance=true side by side, as if they were one feature',
      points: [
        'The main page\'s own "SBOM & Image Signing" code tab runs `docker buildx build --sbom=true --provenance=true --tag ... --push .` — both flags on the same command, described only by the section heading "SBOM generation with Syft," with no separate mention of what `--provenance` specifically adds beyond the SBOM.',
        'Docker\'s own documentation draws a clean line between the two: "Software Bill of Material (SBOM) is a list of software artifacts that an image contains or that were used to build it, while Provenance describes how an image was built." One attestation answers "what\'s inside this image?"; the other answers "what process, source, and environment produced it?" — genuinely different questions, not two names for the same metadata.',
      ]
    },
    {
      heading: 'A concrete example of when only ONE of the two would actually answer the question being asked',
      points: [
        'An SBOM answers: "does this image contain the vulnerable version of libxml2 that CVE-2024-XXXX affects?" — it is a component inventory, and that\'s exactly the kind of question the main page\'s own supply-chain-security theory section frames it around ("enabling fast triage when a new CVE drops").',
        'Provenance answers a different question entirely: "was this image actually built by our own CI pipeline, from our own main branch, using our own Dockerfile — or could it have been built by someone else and pushed under our tag?" This is the question Cosign signing (covered a few lines later in the same code tab) and admission-controller policies (Kyverno, shown at the end of the same tab) are actually built to answer, using provenance as their evidence.',
        'Per Docker\'s own docs, provenance also has a default-behavior nuance worth knowing: "By default, a minimal provenance attestation will be created for the build result, which will only be attached for images pushed to registries." The main page\'s own command includes `--push .`, so this works correctly as written — but a reader who drops `--push` for a local test build (a very natural thing to try while learning) would get a build that silently has no provenance attestation attached at all, purely because it never reached a registry.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two different questions, two different attestations',
      language: 'bash',
      code: `# The main page's own command:
docker buildx build \\
  --sbom=true \\
  --provenance=true \\
  --tag ghcr.io/org/app:abc1234 \\
  --push .

# SBOM answers: "WHAT is in this image?"
docker buildx imagetools inspect ghcr.io/org/app:abc1234 \\
  --format '{{json .SBOM}}'
# -> a list of every package/library and its version --
#    e.g. "does this image contain openssl 3.0.13, the version
#    CVE-2024-6119 affects?"

# Provenance answers: "HOW was this image built?"
docker buildx imagetools inspect ghcr.io/org/app:abc1234 \\
  --format '{{json .Provenance}}'
# -> build-time metadata: which Dockerfile, which base images,
#    which builder, roughly when -- NOT a list of installed
#    packages at all. Per Docker's own docs: Provenance
#    "describes how an image was built," a categorically
#    different kind of record than the SBOM's component list.`,
    },
    {
      label: 'The --push dependency for provenance -- a real gap when testing locally',
      language: 'bash',
      code: `# A natural thing to try while learning/testing -- drop --push
# for a quick local build:
docker buildx build \\
  --sbom=true \\
  --provenance=true \\
  --tag myapp:test \\
  .
# (no --push)

# Per Docker's own docs: "By default, a minimal provenance
# attestation will be created for the build result, which will
# only be attached for images pushed to registries."
#
# Result: --provenance=true was set, the build succeeded, but NO
# provenance attestation actually got attached -- because it never
# reached a registry. Checking for it locally finds nothing, which
# can easily read as "provenance generation is broken" rather than
# "provenance specifically requires a registry push, by design."

# The main page's own command works correctly specifically BECAUSE
# it already includes --push . -- this isn't something the main
# page's own code tab gets wrong, but the reason it works is never
# stated, making it easy to lose the moment someone adapts the
# command for local testing.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer, learning from the main page\'s own code tab, runs `docker buildx build --sbom=true --provenance=true --tag myapp:test .` locally (no --push) to inspect the attestations before committing to a real CI run. They then run `docker buildx imagetools inspect myapp:test --format \'{{json .Provenance}}\'` and get an empty/null result, while the SBOM inspection works fine. Using this subtopic\'s theory, explain why provenance specifically came back empty when SBOM didn\'t, even though both flags were set identically.',
    hint: 'Per this subtopic\'s theory, does Docker\'s own documented default behavior for provenance attestations depend on whether the image was actually pushed to a registry?',
    solution: 'Provenance came back empty specifically because the build never included `--push`, while SBOM generation has no such dependency — per this subtopic\'s theory, Docker\'s own docs state that "by default, a minimal provenance attestation will be created for the build result, which will only be attached for images pushed to registries." Setting `--provenance=true` genuinely did request provenance generation, but Docker\'s own default behavior withholds attaching it unless the image actually reaches a registry — a local-only build (no `--push`) never satisfies that condition, so the inspect command finds nothing, not because provenance generation failed, but because it was never attached in the first place. SBOM has no equivalent registry-push requirement in its default behavior, which is exactly why it worked fine under the identical local-build conditions that left provenance empty. The fix for local inspection is either pushing to a real (or local test) registry, or, per Docker\'s own docs, explicitly requesting the non-default max-level provenance mode, which is documented separately from this registry-attachment default.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '--sbom=true and --provenance=true are two flags that both attach roughly the same kind of "supply chain" metadata to an image — using one without the other is mostly redundant.',
      reality: 'Per this subtopic\'s theory, Docker\'s own docs describe them as answering genuinely different questions — SBOM is "a list of software artifacts that an image contains," Provenance "describes how an image was built." One is a component inventory; the other is build-process metadata. Neither substitutes for the other.'
    },
    {
      thought: 'SBOM and Provenance attestations are generated and attached identically, so setting --provenance=true on a local-only build (no --push) should attach it just as reliably as the SBOM.',
      reality: 'This subtopic\'s exercise shows a real asymmetry — per Docker\'s own docs, the default provenance attestation "will only be attached for images pushed to registries," while no such registry-push requirement applies to SBOM in the same way. Dropping --push for a local test build can silently leave provenance unattached while SBOM still works.'
    },
    {
      thought: 'If a Docker build with --provenance=true doesn\'t show a provenance attestation when inspected, provenance generation itself must have failed or is misconfigured.',
      reality: 'Per this subtopic\'s theory, an empty provenance result is often expected, documented behavior rather than a failure — specifically when the image was never pushed to a registry, since Docker\'s own default only attaches the minimal provenance attestation to registry-pushed images.'
    }
  ];
}
