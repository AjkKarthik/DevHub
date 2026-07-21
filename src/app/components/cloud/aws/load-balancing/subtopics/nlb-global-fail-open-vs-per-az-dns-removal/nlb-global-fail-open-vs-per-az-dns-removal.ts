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
  templateUrl: './nlb-global-fail-open-vs-per-az-dns-removal.html',
  styleUrl: './nlb-global-fail-open-vs-per-az-dns-removal.scss'
})
export class NlbGlobalFailOpenVsPerAzDnsRemovalSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own health-check theory stops at "deregistered" — it never says what happens when a whole AZ, or every AZ, goes unhealthy at once',
      points: [
        'The main page\'s own "Target Groups & Health Checks" theory says only: "A target is deregistered from the LB when it fails health checks." That describes a SINGLE target failing while healthy siblings remain — it says nothing about what the load balancer does when an entire Availability Zone loses every healthy target, or when every AZ does simultaneously.',
        'The main page\'s own health-check-flapping mistake entry is about a single bad /health path causing one target to cycle healthy/unhealthy — again a single-target scenario, not a whole-AZ or whole-service outage.',
      ]
    },
    {
      heading: 'NLB actually has two distinct, differently-scoped unhealthy-target behaviors, not one',
      points: [
        'Per AWS\'s own NLB target-group health-check documentation, the FINE-GRAINED behavior is per-AZ and DNS-based: "If target groups don\'t have a healthy target in an enabled Availability Zone, we remove the IP address for the corresponding subnet from DNS." This means losing all healthy targets in ONE AZ (while other AZs still have healthy targets) simply stops that AZ\'s IP from being handed out to new clients — traffic keeps flowing normally to the AZs that still have healthy targets.',
        'The COARSE-GRAINED behavior only triggers when the situation is total: AWS states the load balancer "fails open," meaning it will "allow traffic to all targets in all enabled Availability Zones, regardless of their health status" — but only once EVERY target in EVERY enabled AZ is simultaneously unhealthy. At that point health checking is effectively ignored and the NLB routes to everything anyway, on the reasoning that traffic reaching a possibly-broken target beats a total DNS blackhole.',
        'These are not the same mechanism scaled up — they are two separate rules with two separate triggers. A single AZ going fully unhealthy while a second AZ stays healthy never reaches fail-open at all; it is handled entirely by the DNS-removal rule, silently, with existing connections to the bad AZ\'s static IP left to fail on their own (NLB has no concept of "deregistration delay" gracefully draining a whole AZ the way ALB drains a single target).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Per-AZ DNS removal — one AZ loses all healthy targets, others keep serving',
      language: 'bash',
      code: `# 3-AZ NLB target group, 2 targets per AZ
aws elbv2 describe-target-health \\
  --target-group-arn $NLB_TG_ARN \\
  --query 'TargetHealthDescriptions[].[Target.Id,Target.AvailabilityZone,TargetHealth.State]' \\
  --output table
# | i-0a...  eu-west-1a  unhealthy |
# | i-0b...  eu-west-1a  unhealthy |   <- BOTH eu-west-1a targets down
# | i-0c...  eu-west-1b  healthy   |
# | i-0d...  eu-west-1b  healthy   |
# | i-0e...  eu-west-1c  healthy   |
# | i-0f...  eu-west-1c  healthy   |

# Per AWS's own docs: "If target groups don't have a healthy target
# in an enabled Availability Zone, we remove the IP address for the
# corresponding subnet from DNS." -- so the NLB's eu-west-1a IP is
# quietly pulled from DNS. New clients resolving the NLB's DNS name
# get only the eu-west-1b / eu-west-1c IPs. Traffic to those two AZs
# continues completely normally -- this is NOT a fail-open event.
dig +short prod-nlb-abc123.elb.eu-west-1.amazonaws.com
# 10.0.2.15   (eu-west-1b)
# 10.0.3.22   (eu-west-1c)
# -- note: only 2 of the 3 AZ IPs are returned`,
    },
    {
      label: 'Global fail-open — ALL AZs unhealthy at once',
      language: 'bash',
      code: `# Now every target in every AZ fails (e.g. a bad app deploy)
aws elbv2 describe-target-health \\
  --target-group-arn $NLB_TG_ARN \\
  --query 'TargetHealthDescriptions[].TargetHealth.State' --output text
# unhealthy  unhealthy  unhealthy  unhealthy  unhealthy  unhealthy

# Per AWS's own docs, the NLB now "fails open" -- it will "allow
# traffic to all targets in all enabled Availability Zones,
# regardless of their health status." All three AZ IPs stay in DNS,
# and traffic is routed to every target anyway, healthy or not --
# the NLB stops trusting health checks entirely rather than return
# a total outage to every client.
dig +short prod-nlb-abc123.elb.eu-west-1.amazonaws.com
# 10.0.1.10   (eu-west-1a) -- still returned, despite being unhealthy
# 10.0.2.15   (eu-west-1b)
# 10.0.3.22   (eu-west-1c)
# -- all 3 AZ IPs remain in DNS; the NLB is now routing blind`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An NLB target group spans 3 AZs with 2 targets each. All targets in eu-west-1a fail health checks, while eu-west-1b and eu-west-1c stay fully healthy. A teammate says "the NLB will fail open and route to eu-west-1a\'s unhealthy targets anyway, since that\'s what NLB does when targets are unhealthy." Using this subtopic\'s theory, is the teammate right?',
    hint: 'Per AWS\'s own documentation, does fail-open trigger per-AZ, or only when every enabled AZ has zero healthy targets simultaneously?',
    solution: 'Per this subtopic\'s theory, the teammate is wrong. Fail-open is a GLOBAL behavior — AWS\'s own documentation states it applies only when the load balancer would otherwise have to route to zero healthy targets across every enabled Availability Zone at once ("allow traffic to all targets in all enabled Availability Zones, regardless of their health status"). Here, eu-west-1b and eu-west-1c still have healthy targets, so the load balancer never reaches that all-AZs-down condition. Instead, the FINE-GRAINED per-AZ rule applies: per AWS\'s own documentation, "If target groups don\'t have a healthy target in an enabled Availability Zone, we remove the IP address for the corresponding subnet from DNS" — meaning eu-west-1a\'s IP is simply pulled from DNS, and new clients only ever resolve to eu-west-1b/eu-west-1c\'s IPs. eu-west-1a\'s unhealthy targets receive no new traffic at all; nothing is routed to them "anyway."'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'NLB\'s "fail open" behavior kicks in as soon as any single Availability Zone loses all its healthy targets.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation scopes fail-open to the load balancer as a whole — it only applies once every target in every enabled AZ is simultaneously unhealthy. A single AZ losing all healthy targets is handled by a separate, narrower rule: that AZ\'s IP is removed from DNS.'
    },
    {
      thought: 'When one AZ\'s targets all go unhealthy, the NLB reroutes that AZ\'s traffic to the other healthy AZs automatically.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation describes DNS removal, not rerouting — the unhealthy AZ\'s own IP address is pulled from DNS so new clients simply never resolve to it. Existing clients already holding that AZ\'s static IP are not automatically redirected to a different AZ\'s IP.'
    },
    {
      thought: 'Fail-open means the NLB starts running health checks less strictly, giving unhealthy targets more chances to pass.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation describes fail-open as routing to targets "regardless of their health status" — health checking is not relaxed or retried more leniently, it is effectively bypassed for routing decisions once the all-AZs-unhealthy condition is reached.'
    }
  ];
}
