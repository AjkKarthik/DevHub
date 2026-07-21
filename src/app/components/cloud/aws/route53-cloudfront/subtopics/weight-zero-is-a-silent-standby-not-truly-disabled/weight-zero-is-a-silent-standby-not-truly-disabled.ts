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
  templateUrl: './weight-zero-is-a-silent-standby-not-truly-disabled.html',
  styleUrl: './weight-zero-is-a-silent-standby-not-truly-disabled.scss'
})
export class WeightZeroIsASilentStandbyNotTrulyDisabledSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page calls Weight 0 a way to "disable" a record — that framing is incomplete',
      points: [
        'The main page\'s own "Routing Policies" theory bullet states: "Weight 0 disables without removing the record." Read on its own, this suggests a weight-0 record is inert — present in the hosted zone but never actually used to answer DNS queries, similar to how a Weighted target group in Auto Scaling might sit idle.',
        'AWS\'s own documentation describes a more specific behavior that the main page\'s wording doesn\'t capture: a weight-0 record is excluded from NORMAL answers, but it is not permanently inert — it can automatically start answering queries again under a specific failure condition.',
      ]
    },
    {
      heading: 'A weight-0 record becomes an automatic fallback if every nonzero-weight record is unhealthy',
      points: [
        'Per AWS\'s own documentation, when a weighted record group mixes nonzero-weighted and zero-weighted records with health checks attached, Route 53\'s behavior has two rules: "Route 53 initially considers only the nonzero weighted records, if any" and "If all the records that have a weight greater than 0 are unhealthy, then Route 53 considers the zero-weighted records."',
        'This means a weight-0 record with NO health check attached functions as a genuine standby: it is excluded while at least one nonzero-weight record is healthy, but the moment every nonzero-weight record becomes unhealthy, Route 53 automatically starts answering queries with the weight-0 record instead of returning no answer at all.',
        'This is a real, useful safety net if intended — but it is easy to be surprised by if NOT intended: a weight-0 record left behind after a completed migration (the main page\'s own use case: "distribute traffic by percentage... for gradual migration to a new version") isn\'t just inert leftover configuration — it can silently start serving live production traffic again if the new, fully-weighted version has an outage, sending users back to a version that may be stale, unpatched, or no longer maintained.',
        'If a weight-0 record DOES have its own health check attached and that health check is unhealthy, it is excluded from this fallback too — AWS\'s own documented behavior table shows Route 53 answering with NEITHER record (a query goes unanswered) if the weight-0 record\'s own health check is also unhealthy at the moment every nonzero-weight record fails.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A weight-0 record with no health check — automatic fallback',
      language: 'bash',
      code: `# Migration is "complete": the new version gets all traffic
# (weight 100), the old version is left at weight 0 -- following
# the main page's own "gradual migration" pattern, but now fully
# migrated:
aws route53 change-resource-record-sets \\
  --hosted-zone-id Z1234567890ABC \\
  --change-batch '{
    "Changes": [
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "api.example.com", "Type": "A",
          "SetIdentifier": "new-version", "Weight": 100,
          "HealthCheckId": "hc-new-version",
          "AliasTarget": {
            "HostedZoneId": "Z32O12XQLNTSW2",
            "DNSName": "new-alb.eu-west-1.elb.amazonaws.com",
            "EvaluateTargetHealth": true
          }
        }
      },
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "api.example.com", "Type": "A",
          "SetIdentifier": "old-version", "Weight": 0,
          "AliasTarget": {
            "HostedZoneId": "Z32O12XQLNTSW2",
            "DNSName": "old-alb.eu-west-1.elb.amazonaws.com",
            "EvaluateTargetHealth": true
          }
        }
      }
    ]
  }'
# -- old-version has NO standalone HealthCheckId here, matching a
# common "it's disabled anyway, why bother" assumption.

# Now the new-version ALB has a real outage -- its health check
# (hc-new-version) goes unhealthy. Per AWS's own documented
# behavior, Route 53 now falls back to the ONLY remaining record --
# old-version, weight 0, still fully operational and healthy --
# and starts answering queries with it automatically:
dig api.example.com
# api.example.com. 60 IN A <old-alb's current IP>
# -- production traffic is now silently flowing to a version of the
# app the team believed was fully retired.`,
    },
    {
      label: 'Preventing the surprise: remove or actively health-check the standby',
      language: 'bash',
      code: `# Option 1: if the old version genuinely should NEVER receive
# traffic again, remove the record entirely rather than leaving it
# at weight 0 -- weight 0 is a STANDBY mechanism, not a true
# disable/delete:
aws route53 change-resource-record-sets \\
  --hosted-zone-id Z1234567890ABC \\
  --change-batch '{
    "Changes": [{
      "Action": "DELETE",
      "ResourceRecordSet": {
        "Name": "api.example.com", "Type": "A",
        "SetIdentifier": "old-version", "Weight": 0,
        "AliasTarget": {
          "HostedZoneId": "Z32O12XQLNTSW2",
          "DNSName": "old-alb.eu-west-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'

# Option 2: if keeping the weight-0 record around IS the intended
# safety net (a genuine "old version as emergency fallback" design),
# make that explicit and DOCUMENTED -- and understand that if the
# fallback's own resource were ALSO unhealthy at the same moment,
# Route 53 answers with neither record at all (per AWS's own
# documented behavior table for this exact combination), so the
# fallback isn't a guarantee of availability on its own either.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Six months after finishing a migration, a team notices unexpected traffic on their retired "old-version" ALB\'s access logs — a version they believed had been fully decommissioned in DNS. Investigating, they find the Route 53 weighted record for old-version was never deleted, just set to Weight: 0, exactly matching the main page\'s own migration pattern. Using this subtopic\'s theory, what most likely explains the unexpected traffic, and what should the team have done differently?',
    hint: 'A weight-0 record with no health check of its own isn\'t permanently excluded — under what specific condition does Route 53 start answering queries with it again?',
    solution: 'The most likely explanation, per this subtopic\'s theory, is that the new-version record\'s own health check went unhealthy at some point (even briefly — a deploy issue, a brief outage, a health-check endpoint misconfiguration) and Route 53 automatically fell back to answering queries with the weight-0 old-version record, since it was the only record left once every nonzero-weight record was unhealthy. This isn\'t a bug or a Route 53 malfunction — it is the exact documented behavior for weighted records: "if all the records that have a weight greater than 0 are unhealthy, then Route 53 considers the zero-weighted records." The team\'s mistake was treating Weight: 0 as equivalent to "disabled" or "deleted," when per this subtopic\'s theory it actually functions as a standby that can start serving real traffic again under specific failure conditions. Since the old-version ALB was apparently still running and healthy (it received real traffic, which requires it to have been reachable), Route 53 had a valid, healthy answer to fall back to and used it, exactly as documented. The team should have either fully deleted the old-version record once the migration was confirmed complete and no fallback was wanted, or explicitly kept the ALB running and monitored specifically BECAUSE it was serving as an intentional emergency fallback — the failure here was an undocumented assumption about what Weight: 0 actually does, not a Route 53 defect.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting a weighted record\'s Weight to 0, matching the main page\'s own "disables without removing the record" description, means that record will never answer a DNS query again.',
      reality: 'Per this subtopic\'s theory, a weight-0 record is excluded only while at least one nonzero-weight record remains healthy — if every nonzero-weight record becomes unhealthy, Route 53 automatically falls back to answering with the zero-weighted record instead.'
    },
    {
      thought: 'A weight-0 record left in a hosted zone after a completed migration is harmless, inert leftover configuration with no operational impact.',
      reality: 'Per this subtopic\'s exercise, it can silently begin serving live production traffic again if the currently-active (nonzero-weight) version has a health check failure — a real operational risk, not a no-op, unless the underlying resource has also been decommissioned or is being actively monitored as an intentional fallback.'
    },
    {
      thought: 'If every record in a weighted group — including a weight-0 fallback — is somehow unhealthy at once, Route 53 will still answer with whichever weight-0 record exists, since it\'s the last resort.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documented behavior table shows that if the weight-0 record ALSO has an unhealthy standalone health check at the same time every nonzero-weight record is unhealthy, Route 53 answers with neither record — the fallback is not a guaranteed answer under every failure combination.'
    }
  ];
}
