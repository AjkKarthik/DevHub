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
  templateUrl: './rate-limit-by-key-counts-per-gateway-not-per-instance.html',
  styleUrl: './rate-limit-by-key-counts-per-gateway-not-per-instance.scss'
})
export class RateLimitByKeyCountsPerGatewayNotPerInstanceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry implies rate-limit-by-key gives each subscriber ONE clean, unified quota',
      points: [
        'The main page\'s own Common Mistake, "Using rate-limit instead of rate-limit-by-key for per-subscriber throttling," explains the fix as: "rate-limit-by-key maintains separate counters per key (subscription ID, IP, custom expression) — each subscriber gets their own independent quota." This is accurate as far as it goes, but says nothing about what happens to that "quota" once the API is deployed across more than one gateway.',
        'The main page separately covers Premium tier as "multi-region" and self-hosted gateways as a way to deploy the gateway component "in on-premises environments, other clouds, or Kubernetes clusters" — but never connects either of those deployment topics back to how rate-limit-by-key\'s counters actually behave once more than one gateway is involved.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own policy reference: counters are tracked independently PER GATEWAY',
      points: [
        'Per Microsoft\'s own rate-limit-by-key documentation: "This policy tracks calls independently at each gateway where it is applied, including workspace gateways and regional gateways in a multi-region deployment. It doesn\'t aggregate call data across the entire instance." This directly qualifies the main page\'s "each subscriber gets their own independent quota" claim — that quota is independent per SUBSCRIBER, but also independently duplicated per GATEWAY.',
        'The practical consequence for a multi-region Premium deployment: a subscriber configured for "100 calls per 60 seconds" doesn\'t get 100 calls per 60 seconds total — they get up to 100 calls per 60 seconds AT EACH regional gateway they happen to reach, meaning their effective global rate limit scales with however many regions their traffic is spread across (via geographic routing, DNS, or a load balancer in front of APIM).',
        'The same independence applies to self-hosted gateways: "Rate limit counts in a self-hosted gateway can be configured to synchronize locally (among gateway instances across cluster nodes)... However, rate limit counts don\'t synchronize with other gateway resources configured in the API Management instance, including the managed gateway in the cloud." A self-hosted gateway cluster can share counters among ITS OWN nodes, but never with the cloud-managed gateway running alongside it.',
      ]
    },
    {
      heading: 'This isn\'t a bug to work around — Microsoft frames it as an inherent property of distributed throttling',
      points: [
        'Microsoft\'s own documentation opens the policy reference with a direct caution: "Because of the distributed nature of throttling architecture, rate limiting is never completely accurate. The difference between the configured number of allowed requests and the actual number varies depending on request volume and rate, backend latency, and other factors." Per-gateway counting is a specific, well-documented instance of this general caution, not a corner case.',
        'For teams that need a genuinely global, cross-gateway limit, Microsoft\'s own advanced throttling guidance (referenced from the same policy page) is the documented path forward — the plain rate-limit-by-key policy, used as shown on the main page, was never designed to aggregate across gateways in the first place.',
        'A useful mental model: rate-limit-by-key\'s counter-key scopes WHO is being limited (subscription, IP, custom expression); the gateway itself is an unstated, implicit second dimension of that scope that the policy syntax never surfaces — two requests with the identical counter-key value, arriving at two different gateways, are counted completely independently.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own rate-limit-by-key example — and what "100 calls" really means multi-region',
      language: 'bash',
      code: `<!-- Main page's own example, unchanged: -->
<rate-limit-by-key calls="100" renewal-period="60"
                   counter-key="@(context.Subscription.Id)" />

<!-- Per Microsoft's own docs: "This policy tracks calls
     independently at each gateway where it is applied, including...
     regional gateways in a multi-region deployment. It doesn't
     aggregate call data across the entire instance."

     On a Premium instance deployed to East US + West Europe, with
     traffic routed to whichever region is geographically closest: -->

<!-- Subscriber's calls landing on the East US gateway:
       counted against a counter LOCAL to East US -->
<!-- The SAME subscriber's calls landing on the West Europe gateway
     (e.g. via a VPN, mobile roaming, or a CDN edge in a different
     region):
       counted against a SEPARATE counter LOCAL to West Europe -->

<!-- Configured limit: "100 calls per 60 seconds"
     Actual achievable rate for this subscriber if their traffic
     splits evenly across both regions: up to ~200 calls per 60
     seconds -- 100 at each region's own, independent counter. -->`,
    },
    {
      label: 'Self-hosted gateways: local sync among cluster nodes, never with the cloud gateway',
      language: 'bash',
      code: `# Per Microsoft's own docs: "Rate limit counts in a self-hosted
# gateway can be configured to synchronize locally (among gateway
# instances across cluster nodes)... However, rate limit counts
# don't synchronize with other gateway resources configured in the
# API Management instance, including the managed gateway in the
# cloud."

# A hybrid deployment: cloud-managed gateway (handling most traffic)
# + a self-hosted gateway cluster (3 Kubernetes pods) deployed
# on-premises for a latency-sensitive backend:

#   Self-hosted pod 1 <-\\
#   Self-hosted pod 2 --+-- can be configured to share ONE counter
#   Self-hosted pod 3 <-/    among themselves (via Helm chart config)
#
#   Cloud-managed gateway -- has its OWN, completely separate
#                             counter, even for the identical
#                             counter-key value on the identical API

# Same subscriber calling through BOTH the self-hosted cluster and
# the cloud-managed gateway (e.g. during a migration, or because
# different API paths route to different gateways) effectively gets
# TWO independent quotas, not one -- exactly the same per-gateway
# duplication as the multi-region cloud-only case above.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team configures rate-limit-by-key at 50 calls per 60 seconds per subscription, on a Premium APIM instance deployed to three regions for global low-latency access. During a load test simulating a single misbehaving client whose traffic is deliberately spread evenly across all three regions (via three different source locations), the client achieves roughly 150 successful calls in 60 seconds — three times the configured limit — with zero 429 responses being under-delivered relative to what each region allowed. Is the rate-limit-by-key policy broken?',
    hint: 'Check whether Microsoft\'s own documentation says rate-limit-by-key counters aggregate across regional gateways in a multi-region deployment, or track independently at each one.',
    solution: 'The policy is working exactly as documented — this is not a bug. Per Microsoft\'s own rate-limit-by-key reference, "this policy tracks calls independently at each gateway where it is applied, including... regional gateways in a multi-region deployment. It doesn\'t aggregate call data across the entire instance." With three regions, the client\'s traffic split evenly across all three effectively receives three independent 50-calls-per-60-seconds counters — one per region — for a combined achievable rate of roughly 150 calls per 60 seconds, exactly matching the observed test result. Each individual region correctly enforced its own local 50-call limit; the "violation" only appears when looking at the client\'s GLOBAL call count across all three, which the plain rate-limit-by-key policy was never designed to track. A team that needs a true global limit across all gateways needs a different, application-level or external throttling mechanism — Microsoft\'s own advanced throttling guidance is the documented starting point for that requirement.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A rate-limit-by-key policy configured with a given counter-key gives that key one single, global quota across the entire APIM instance.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms the policy "tracks calls independently at each gateway where it is applied... It doesn\'t aggregate call data across the entire instance" — the same counter-key value gets a separate, independent counter at every regional gateway, workspace gateway, and self-hosted gateway it\'s evaluated on.'
    },
    {
      thought: 'A self-hosted gateway cluster\'s rate-limit-by-key counters automatically stay in sync with the cloud-managed gateway of the same APIM instance.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own docs are explicit that self-hosted gateway rate limit counts "don\'t synchronize with other gateway resources configured in the API Management instance, including the managed gateway in the cloud" — local synchronization only happens among the self-hosted cluster\'s own nodes, if explicitly configured.'
    },
    {
      thought: 'Since rate-limit-by-key is described as giving each subscriber "their own independent quota," a subscriber\'s effective rate limit is exactly the configured calls value, regardless of deployment topology.',
      reality: 'Per this subtopic\'s theory, the "independent quota" is independent per subscriber but ALSO independently duplicated per gateway — a subscriber\'s effective achievable rate scales with the number of distinct gateways (regions, self-hosted clusters, workspace gateways) their traffic happens to reach.'
    }
  ];
}
