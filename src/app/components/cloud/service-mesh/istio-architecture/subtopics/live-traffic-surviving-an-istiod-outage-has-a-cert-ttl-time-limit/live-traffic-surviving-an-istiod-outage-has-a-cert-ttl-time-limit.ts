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
  templateUrl: './live-traffic-surviving-an-istiod-outage-has-a-cert-ttl-time-limit.html',
  styleUrl: './live-traffic-surviving-an-istiod-outage-has-a-cert-ttl-time-limit.scss'
})
export class LiveTrafficSurvivingAnIstiodOutageHasACertTtlTimeLimitSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page presents Istiod\'s failure impact as a clean, indefinite split: traffic fine, new deployments blocked',
      points: [
        'The main page\'s quiz answer and revision summary both state it plainly: "Proxies continue with their last known configuration" and "Istiod failure: live traffic continues with last cached config; new pods cannot receive config." Read at face value, this describes an indefinite state — live traffic keeps working no matter how long Istiod stays down, only new deployments are blocked.',
      ]
    },
    {
      heading: 'The missing variable: certificate rotation ALSO requires Istiod, and certs are not indefinitely valid',
      points: [
        'The same page\'s own QnA on certificate rotation states the default cert TTL is 24 hours, with rotation attempted at 80% of that (roughly 19 hours in) — and that rotation happens via Istiod\'s embedded Citadel CA issuing new certs through SDS. If Istiod is unreachable, this rotation simply cannot happen, exactly the same way new pod injection cannot happen.',
        'This means "live traffic continues" is only true for a BOUNDED window — specifically, until the first workload certificate in the mesh reaches the end of its TTL without having been able to rotate. Once that happens, mTLS handshakes involving that expired certificate start failing, and THAT traffic breaks too — not just new pod scheduling.',
      ]
    },
    {
      heading: 'The practical consequence: the real safety margin is the cert TTL, not "indefinitely"',
      points: [
        'With the default 24-hour TTL, an Istiod outage has roughly a 24-hour safety window (less, accounting for when each individual workload\'s cert happens to be in its own lifecycle) before live mTLS traffic genuinely starts failing — this is a materially different risk profile than "traffic is fine, just new deployments are blocked," which could be read as an outage with no urgency around live traffic at all.',
        'This directly informs incident response priority: an Istiod outage is not merely a "deployment freeze" incident — it has a live-traffic clock attached to it via certificate expiry, and restoring Istiod (or extending cert TTLs as a stopgap, if that\'s configurable in a specific deployment) becomes genuinely time-sensitive well before the 24-hour mark, not just an inconvenience to fix "eventually."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The full picture: what breaks, and on what timeline',
      language: 'bash',
      code: `# T+0h:    Istiod goes down (crash, resource exhaustion, bad
#          config causing crash-loop, etc.)
#
# T+0h to T+~19h (varies per workload, depending on where each
# cert already was in its own 24h lifecycle):
#   - Live mTLS traffic between EXISTING sidecars: WORKS FINE
#     (cached xDS config + still-valid certs)
#   - New pod scheduling / injection: BLOCKED
#     (no Istiod to issue initial cert or push initial xDS config)
#   - Config changes (new VirtualService, updated AuthorizationPolicy):
#     NOT PROPAGATED (no Istiod to push the update)
#
# T+~19h onward (as individual workload certs individually reach
# their own rotation point, unable to actually rotate):
#   - Those SPECIFIC workloads' mTLS connections begin failing --
#     Envoy access logs show TLS handshake errors as the cert
#     approaches/passes its expiry with no replacement issued
#
# T+24h (worst case, for a workload whose cert happened to be
# freshly issued right when Istiod went down):
#   - That workload's cert has fully expired -- mTLS handshakes
#     to/from it now reliably fail`,
    },
    {
      label: 'Monitoring for this specific risk',
      language: 'bash',
      code: `# Check remaining validity on a live cert (do this proactively,
# not just during an incident, to know your actual safety margin)
istioctl proxy-config secret <pod-name>.<namespace> -o json | \\
  jq '.dynamicActiveSecrets[0].secret.tlsCertificate.certificateChain.inlineBytes' | \\
  base64 -d | openssl x509 -noout -enddate

# During an active Istiod outage, prioritize checking:
kubectl get pods -n istio-system -l app=istiod
kubectl logs -n istio-system -l app=istiod --tail=100

# An alerting rule worth having BEFORE an incident, not during one:
# alert when any workload cert's remaining validity drops below,
# say, 4 hours -- gives real lead time distinct from a generic
# "Istiod is down" alert, which alone doesn't convey urgency.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Istiod has been down for 22 hours due to a persistent crash-loop from a bad upgrade. An on-call engineer, having read that "live traffic continues with cached config," treats this as a low-urgency issue to fix during business hours the next day. Using the default 24-hour cert TTL and 80%-of-TTL rotation trigger, evaluate whether this is the right call.',
    hint: 'Is "live traffic continues" true indefinitely, or does it depend on how long individual workload certificates have left before they need to rotate?',
    solution: 'This is not the right call — at 22 hours into the outage, the mesh is very close to the default 24-hour cert TTL boundary. Any workload whose certificate was freshly issued right around when Istiod went down is now hours (or less) away from actual expiry, since rotation (which requires Istiod) has not been able to occur since the outage began. "Live traffic continues" was only true for the SAFE portion of this window — as individual certs reach their TTL without a completed rotation, mTLS handshakes involving those specific workloads will start failing, which is a genuine live-traffic outage, not merely a blocked-deployments inconvenience. At 22 hours in, this is now a high-urgency incident requiring immediate attention to restore Istiod before the first certificates actually expire, not something to defer to the next business day.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s statement that "live traffic continues with last cached config" during an Istiod outage means live traffic is unaffected for as long as Istiod remains down, with only new deployments blocked.',
      reality: 'Per this subtopic\'s theory, this is only true for a bounded window tied to certificate TTL (24 hours by default) — once individual workload certificates reach expiry without being able to rotate (since rotation also requires Istiod), live mTLS traffic involving those specific workloads starts failing too.'
    },
    {
      thought: 'Certificate rotation and xDS config propagation are two separate concerns, so an Istiod outage affecting one does not necessarily affect the other on the same timeline.',
      reality: 'Per this subtopic\'s theory, both certificate rotation AND xDS propagation require Istiod being reachable — an outage blocks both simultaneously, meaning the certificate-expiry clock and the outage duration are directly linked, not independent risks.'
    },
    {
      thought: 'An Istiod outage should be prioritized primarily based on how long new deployments have been blocked, since that\'s the most immediately visible symptom.',
      reality: 'Per this subtopic\'s theory, the more urgent underlying risk is the approaching certificate-expiry deadline for existing live traffic — an outage nearing the cert TTL boundary (by default, around 19-24 hours) deserves escalated urgency regardless of how blocked-deployments alone might read on its own.'
    }
  ];
}
