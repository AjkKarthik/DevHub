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
  templateUrl: './delta-xds-isolates-a-nackd-resource-sotw-blocks-the-whole-type.html',
  styleUrl: './delta-xds-isolates-a-nackd-resource-sotw-blocks-the-whole-type.scss'
})
export class DeltaXdsIsolatesANackdResourceSotwBlocksTheWholeTypeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions Delta xDS\'s efficiency win and NACK behavior separately, without connecting the two',
      points: [
        'The main page states two facts in different theory bullets: "Delta xDS vs state-of-the-world (SotW): ... Istio defaults to Delta xDS for efficiency in large clusters," and separately, "NACK (Negative ACK): if Envoy rejects a pushed resource... Istiod logs the NACK and retries." Read independently, these read as two unrelated facts — efficiency, and a retry mechanism — rather than a single, connected story about failure blast radius.',
      ]
    },
    {
      heading: 'The connection: Delta xDS also isolates a NACK to just the one bad resource, not the whole type',
      points: [
        'Under SotW (state-of-the-world), a push for a given resource type (say, CDS) bundles ALL resources of that type into one message. If even ONE cluster definition in that bundle is invalid, Envoy NACKs the ENTIRE push — meaning every OTHER, perfectly valid cluster in that same bundle also fails to update, since they were all sent together as one unit.',
        'Under Delta xDS, resources are tracked and acknowledged individually — a NACK on one specific resource does not block the other, valid resources of the same type from being accepted and applied. The control plane can keep pushing updates to everything else while only the specific bad resource remains stuck.',
      ]
    },
    {
      heading: 'Why this matters beyond the bandwidth-efficiency framing the main page emphasizes',
      points: [
        'This means Delta xDS is not just "the same correctness with less network traffic" — it is a genuinely different FAILURE MODE. A single misconfigured resource under SotW can silently freeze updates to an entire resource type mesh-wide (every cluster, every route) until that one bad resource is fixed, while under Delta xDS the blast radius is contained to just the one resource that failed.',
        'This directly sharpens the main page\'s own advice to "check istioctl proxy-status for STALE proxies" — under Delta xDS, a STALE status is much more likely to be scoped to a specific, identifiable resource (helpful for fast triage) rather than an entire resource type\'s worth of pending, unrelated changes all stuck behind one unrelated mistake.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SotW: one bad cluster blocks the whole CDS push',
      language: 'bash',
      code: `# Under SotW, Istiod bundles ALL cluster definitions into one
# CDS push message. Suppose 50 clusters are being updated, and
# cluster #37 has an invalid config (e.g. a malformed TLS setting):

# Istiod sends: [cluster1, cluster2, ..., cluster37(BAD), ..., cluster50]

# Envoy validates the WHOLE bundle -- cluster37 fails validation
# -> Envoy NACKs the ENTIRE push, all 50 clusters included

# Result: clusters 1-36 and 38-50 (all perfectly valid) also
# fail to update on this proxy, purely because they were bundled
# together with the one bad one. Istiod retries the SAME bundle,
# which fails the SAME way, until cluster37 is fixed.

istioctl proxy-status | grep -v SYNCED
# Shows this proxy as STALE for CDS -- but the actual scope of
# what's stuck (49 fine clusters + 1 broken one) isn't obvious
# from this output alone.`,
    },
    {
      label: 'Delta xDS: the bad resource is isolated',
      language: 'bash',
      code: `# Under Delta xDS, resources are tracked individually.
# The same scenario: cluster37 has an invalid config.

# Istiod sends a DELTA push containing only what CHANGED --
# potentially just cluster37 alone, or a small changed subset.

# Envoy validates each resource's acceptance individually and
# reports back per-resource -- cluster37 is NACK'd specifically,
# while any other resources in the same delta push that ARE
# valid are accepted and applied normally.

# Result: cluster37 stays stuck (correctly -- it IS broken),
# but clusters 1-36 and 38-50 continue receiving updates on
# their own independent schedule, completely unaffected.

# Confirm Delta xDS is active for this proxy:
istioctl proxy-config all deploy/myapp -o json | \\
  grep -i "incremental\\|delta"

# The STALE/NACK signal, when it appears, is now much more
# likely to point at a SPECIFIC resource rather than an entire
# type's worth of unrelated changes stuck behind one mistake.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'On a mesh still running SotW xDS (an older Istio/Envoy combination), an engineer pushes a DestinationRule change that happens to have one invalid TLS setting. They expect only the cluster tied to that one DestinationRule to fail updating, since "only one resource is actually wrong." Instead, dozens of unrelated clusters across the mesh stop receiving ANY updates at all, all showing STALE. Why does a single invalid resource have such a wide blast radius here, and would Delta xDS have behaved differently?',
    hint: 'Under SotW, are resources of the same type (like all Cluster definitions) pushed and acknowledged individually, or bundled together as one message?',
    solution: 'Under SotW, all resources of a given type (here, Clusters) are bundled into a single push message — when Envoy validates that bundle and finds even one invalid resource, it NACKs the ENTIRE push, not just the specific bad one. This means every other, perfectly valid cluster bundled in that same message also fails to update, purely because of proximity in the same push — explaining why dozens of unrelated clusters went STALE from one bad DestinationRule. Delta xDS would have behaved differently: it tracks and acknowledges resources individually, so a NACK on the one genuinely broken resource would not block the other valid resources in the same update cycle from being accepted — the blast radius would have stayed contained to just the one broken resource, letting everything else continue updating normally.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Delta xDS is purely a bandwidth/network-efficiency optimization over SotW — the correctness and failure behavior of a config push are otherwise identical between the two protocols.',
      reality: 'Per this subtopic\'s theory, Delta xDS also changes the FAILURE MODE — a NACK on one resource is isolated to that resource under Delta xDS, while under SotW an entire type\'s worth of resources bundled in the same push can be blocked by one bad resource among them.'
    },
    {
      thought: 'Under SotW, if one specific resource (like one cluster) has an invalid configuration, only that specific resource fails to update — the same isolation behavior Delta xDS provides.',
      reality: 'Per this subtopic\'s theory, SotW bundles ALL resources of a type into one push message and NACKs the entire bundle on any single invalid resource — the isolation-to-one-resource behavior is specifically a Delta xDS property, not something SotW also provides.'
    },
    {
      thought: 'A proxy showing STALE in istioctl proxy-status always indicates the same scope of problem, regardless of whether the mesh is running SotW or Delta xDS.',
      reality: 'Per this subtopic\'s theory, the practical scope behind a STALE status differs meaningfully between the two protocols — under SotW it can mean an entire resource type\'s worth of unrelated, valid changes stuck behind one bad resource, while under Delta xDS it more precisely points at the specific resource that actually failed.'
    }
  ];
}
