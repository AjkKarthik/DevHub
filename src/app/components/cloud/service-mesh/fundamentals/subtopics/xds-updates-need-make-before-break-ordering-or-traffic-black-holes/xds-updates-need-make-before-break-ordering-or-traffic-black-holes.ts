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
  templateUrl: './xds-updates-need-make-before-break-ordering-or-traffic-black-holes.html',
  styleUrl: './xds-updates-need-make-before-break-ordering-or-traffic-black-holes.scss'
})
export class XdsUpdatesNeedMakeBeforeBreakOrderingOrTrafficBlackHolesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents xDS propagation as instantaneous and safe, without the ordering constraint that makes it actually work',
      points: [
        'The main page\'s own QnA on the xDS API says: "Proxies subscribe to changes; Istiod pushes updates within seconds... configuration changes... propagate to the mesh without pod restarts." True, but this framing implies updates simply arrive and apply cleanly — it never addresses what happens if the four resource types (LDS, RDS, CDS, EDS) arrive in an inconvenient order relative to each other.',
      ]
    },
    {
      heading: 'The real risk: xDS is eventually consistent, and updates can genuinely arrive out of order',
      points: [
        'A concrete failure case: a RouteConfiguration (RDS) is updated to point at a new cluster Y, while the corresponding CDS/EDS update that actually defines cluster Y and its healthy endpoints has not yet arrived at that specific proxy. If the RDS update lands FIRST, requests routed to Y have no known cluster to reach — Envoy "black-holes" that traffic (drops it) until the CDS/EDS update catches up.',
        'This is not a bug in a specific implementation — it is an inherent property of eventually-consistent, independently-pushed xDS resource types being updated as separate messages rather than one atomic transaction.',
      ]
    },
    {
      heading: 'The mitigation: a specific ordering discipline, "make before break"',
      points: [
        'The documented-safe ordering is: LDS updates must arrive AFTER their corresponding CDS/EDS updates; RDS updates referencing newly-added listeners/clusters must arrive LAST; only once traffic is safely routed to new resources should stale CDS clusters and their EDS endpoints be removed.',
        'This is the "make before break" pattern by name: add the NEW cluster (via CDS/EDS) while the OLD one still exists and is still being routed to, THEN switch RDS to point at the new cluster, and ONLY THEN remove the old cluster — never remove first and add second, and never point routes at something before it exists.',
        'Istiod\'s own xDS push implementation is written to respect this ordering automatically for changes it generates — the practical takeaway for anyone operating a mesh is understanding WHY a transient black-hole can occur during a fast sequence of changes (helpful when debugging a brief spike in 503s that coincides exactly with a config change), not something you need to manually order yourself under normal Istio usage.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The failure case: RDS ahead of CDS/EDS',
      language: 'bash',
      code: `# Scenario: migrating routing from cluster "checkout-v1" to
# a newly-created "checkout-v2" cluster

# If a proxy receives the RDS update FIRST...
# RouteConfiguration now says: route "/checkout" -> cluster checkout-v2

# ...but the CDS/EDS update defining checkout-v2's endpoints has
# not yet arrived at THIS specific proxy (eventually consistent --
# different proxies converge at different times):

# Envoy access log during this window:
# [2026-07-28T10:15:03.421Z] "POST /checkout HTTP/1.1" 503 UH
#   response_flags: "UH"  (No Healthy Upstream)
#   -- Envoy knows to route here, but has no known healthy
#      endpoints for checkout-v2 yet -- traffic is black-holed.

# This self-resolves within seconds once CDS/EDS catches up --
# but during that window, real requests fail.`,
    },
    {
      label: 'The safe sequence: make before break',
      language: 'bash',
      code: `# Correct ordering for a manual/scripted migration
# (what Istiod's own generated pushes already respect):

# 1. MAKE: add the new cluster while the old one still exists
#    and is still receiving traffic (CDS/EDS: checkout-v2 added,
#    checkout-v1 still present and still routed to)

# 2. SWITCH: only once checkout-v2's endpoints are confirmed
#    healthy, update RDS to route to checkout-v2 instead

# 3. BREAK: only after traffic is confirmed flowing correctly to
#    checkout-v2, remove the now-unused checkout-v1 cluster
#    (CDS/EDS: checkout-v1 removed)

# Never do this in reverse -- removing checkout-v1 before
# checkout-v2 is confirmed reachable creates the exact black-hole
# window shown in the failure case, even briefly.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'During a routine service migration, an SRE team observes a brief spike of 503 errors with response_flags UH (No Healthy Upstream) lasting about 4 seconds, exactly coinciding with an Istio config change that repointed a route to a newly-created cluster. No pods crashed, and the new cluster\'s endpoints were healthy moments later. What actually happened, and is this evidence of a bug in Istio or Envoy?',
    hint: 'Are all four xDS resource types (LDS, RDS, CDS, EDS) guaranteed to arrive at a given proxy in the same instant, or can updates land in a different order at different proxies?',
    solution: 'This is very likely a transient xDS ordering race, not a bug: xDS is eventually consistent, and it\'s possible for the RDS update (pointing the route at the new cluster) to reach a given proxy before that same proxy has received the corresponding CDS/EDS update defining the new cluster\'s healthy endpoints. During that brief window, the proxy correctly knows to route to the new cluster but has no known healthy endpoint for it yet, producing a "No Healthy Upstream" (UH) response and a 503 — exactly the black-hole scenario the "make before break" ordering discipline exists to minimize. The fact that it self-resolved within seconds, with no pod crashes and healthy endpoints shortly after, is consistent with this explanation rather than an actual defect — this is a known, inherent characteristic of eventually-consistent xDS propagation during rapid config changes, not a sign anything is broken.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page describes Istiod pushing xDS updates "within seconds" with configuration propagating "without pod restarts," all four update types (LDS, RDS, CDS, EDS) are delivered to every proxy as one atomic, ordered transaction.',
      reality: 'Per this subtopic\'s theory, xDS updates are eventually consistent and pushed as independent messages — different proxies can receive the same set of updates in different relative order and at different times, not as a single atomic delivery.'
    },
    {
      thought: 'A brief spike of 503 "No Healthy Upstream" errors immediately following an Istio configuration change always indicates a misconfiguration or a genuine service outage that needs investigating as a real problem.',
      reality: 'Per this subtopic\'s theory, a short-lived UH spike exactly coinciding with a config change can be the expected, self-resolving consequence of xDS\'s eventual consistency (an RDS update outracing its corresponding CDS/EDS update) — not necessarily evidence of a real underlying fault.'
    },
    {
      thought: 'The "make before break" ordering discipline is something a mesh operator must manually script and enforce themselves when making routing changes.',
      reality: 'Per this subtopic\'s theory, Istiod\'s own xDS push implementation already respects this ordering automatically for the changes it generates — understanding the pattern is mainly useful for correctly diagnosing a transient black-hole window, not for manually sequencing routine Istio config changes.'
    }
  ];
}
