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
  templateUrl: './evaluatetargethealth-no-op-for-cloudfront-s3-alias-targets.html',
  styleUrl: './evaluatetargethealth-no-op-for-cloudfront-s3-alias-targets.scss'
})
export class EvaluatetargethealthNoOpForCloudfrontS3AliasTargetsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page uses EvaluateTargetHealth: true everywhere, treating it as a universal health signal',
      points: [
        'The main page\'s own "Route 53 Records" code tab sets "EvaluateTargetHealth": true on an Alias record pointing to an ALB, and every weighted/failover alias example in its own code tabs follows the same pattern — always true, with no discussion of what this setting actually does or when it matters.',
        'The natural reading is that EvaluateTargetHealth is a general-purpose "make sure the target is healthy" switch that\'s always worth enabling — but AWS\'s own documentation draws a sharp line between which alias targets this setting actually does something for.',
      ]
    },
    {
      heading: 'EvaluateTargetHealth only provides real benefit for load-balancer-style targets — it\'s a documented no-op for CloudFront, S3, and other highly-available services',
      points: [
        'Per AWS\'s own documentation, EvaluateTargetHealth provides genuine operational benefit specifically "for load balancers (ELB) and AWS Elastic Beanstalk environments with load balancers" — setting it to true there lets Route 53 route traffic away from the ALB if its own target group health checks report the ALB\'s targets are unhealthy.',
        'For a separate category of targets — Amazon S3 buckets, VPC interface endpoints, API Gateway, AWS Global Accelerator, Amazon OpenSearch Service, and Amazon VPC Lattice — AWS\'s own documentation states plainly: "Evaluate target health provides no operational benefit because these services are designed for high availability." CloudFront distributions fall into this same highly-available category.',
        'This means the main page\'s own CloudFront + S3 OAC code tab — which sets up a CloudFront distribution as an alias target — gets no actual failover behavior from EvaluateTargetHealth even if it were explicitly enabled on that alias, because CloudFront itself is treated as inherently highly-available at the DNS-alias level; there is no per-request "is CloudFront currently healthy" signal for Route 53 to evaluate the way there is for an ALB\'s target group.',
        'AWS\'s own guidance for these highly-available service types is explicit about the alternative: "For failover scenarios with these services, use Route 53 health checks instead" — meaning a genuine failover setup involving CloudFront, S3, or similar needs a STANDALONE Route 53 health check (monitoring an actual HTTP/HTTPS/TCP endpoint, exactly like the main page\'s own separate "Health Checks & Failover" code tab shows for the ALB scenario) rather than relying on EvaluateTargetHealth to do anything meaningful.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'EvaluateTargetHealth actually working — an ALB alias target',
      language: 'bash',
      code: `# Matching the main page's own pattern: Alias record to an ALB
# with EvaluateTargetHealth true -- THIS is a case where it does
# something real:
aws route53 change-resource-record-sets \\
  --hosted-zone-id Z1234567890ABC \\
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.example.com", "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z32O12XQLNTSW2",
          "DNSName": "my-alb-123456.eu-west-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'

# If EVERY target registered with the ALB's target group becomes
# unhealthy, Route 53 genuinely stops answering with this record's
# value (in a Failover/Weighted/Multivalue setup, it fails over to
# whatever alternative record exists) -- EvaluateTargetHealth is
# reading the ALB's own target-group health state directly.`,
    },
    {
      label: 'EvaluateTargetHealth on a CloudFront alias — no operational effect',
      language: 'bash',
      code: `# The exact same setting, on an alias pointing at a CloudFront
# distribution -- matching the main page's own static-site pattern:
aws route53 change-resource-record-sets \\
  --hosted-zone-id Z1234567890ABC \\
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "example.com", "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d111111abcdef8.cloudfront.net",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
# -- EvaluateTargetHealth being true here does NOT give Route 53 any
# per-request signal about whether CloudFront (or its origin) is
# actually serving successfully -- CloudFront is one of the service
# types AWS's own documentation explicitly states gets no
# operational benefit from this setting. If the origin behind this
# distribution goes down, this alias record keeps resolving to
# CloudFront's own edge IPs regardless -- CloudFront itself is still
# "up" even if it's returning 5xx errors from a broken origin.

# The documented alternative for real failover involving CloudFront/
# S3: a STANDALONE health check monitoring an actual endpoint,
# exactly like the main page's own separate ALB failover example:
aws route53 create-health-check \\
  --caller-reference "$(date +%s)" \\
  --health-check-config '{
    "Type": "HTTPS",
    "FullyQualifiedDomainName": "example.com",
    "Port": 443,
    "ResourcePath": "/health",
    "RequestInterval": 30,
    "FailureThreshold": 3
  }'
# -- THIS health check, attached via a standalone HealthCheckId (not
# EvaluateTargetHealth) on a Failover-policy record, is what actually
# gives a CloudFront/S3-fronted setup real automatic failover.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets up a CloudFront distribution in front of an origin, with a Route 53 Alias record pointing to the distribution and EvaluateTargetHealth set to true, following the exact pattern the main page\'s own ALB example uses. They configure a SECOND CloudFront distribution as a failover target, expecting Route 53 to automatically switch to it if the origin behind the first distribution goes down. During a test, they take the origin offline — CloudFront starts returning 5xx errors to users, but Route 53 never fails over to the second distribution. Using this subtopic\'s theory, explain why, and what they need to add instead.',
    hint: 'Does EvaluateTargetHealth on a CloudFront alias target actually monitor whether the ORIGIN behind that distribution is healthy — or does it check something else entirely, if anything at all?',
    solution: 'Per this subtopic\'s theory, the failover never triggers because EvaluateTargetHealth provides no operational benefit for CloudFront alias targets — AWS\'s own documentation places CloudFront in the same highly-available category as S3, VPC endpoints, and API Gateway, where this setting is a documented no-op. Setting EvaluateTargetHealth: true on the alias does not give Route 53 any signal about whether the distribution\'s ORIGIN is healthy — CloudFront itself remains reachable and "up" from Route 53\'s perspective even while it\'s actively returning 5xx errors to every viewer, because CloudFront the SERVICE is still functioning; it\'s only the origin behind it that failed. Since there is no per-request health signal being evaluated at all in this configuration, Route 53 has no reason to ever consider the first alias record unhealthy, so it never fails over to the second distribution, exactly matching what the team observed. The fix, per this subtopic\'s theory, is to stop relying on EvaluateTargetHealth for this scenario entirely and instead create a STANDALONE Route 53 health check that actively monitors an actual HTTP/HTTPS endpoint (e.g., a health-check path served through the first distribution) — attached via a HealthCheckId on a Failover-policy record, not via EvaluateTargetHealth — which is the documented, functioning mechanism for CloudFront/S3-fronted failover scenarios.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'EvaluateTargetHealth: true is a general-purpose health signal that provides some operational benefit on any alias record, regardless of what AWS resource it targets.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation explicitly states it provides no operational benefit for a specific category of highly-available targets — including CloudFront, S3, VPC interface endpoints, API Gateway, Global Accelerator, OpenSearch Service, and VPC Lattice — where it is a documented no-op.'
    },
    {
      thought: 'Setting EvaluateTargetHealth: true on a CloudFront alias record will detect and fail over away from a CloudFront distribution whose origin has gone down.',
      reality: 'Per this subtopic\'s exercise, EvaluateTargetHealth on a CloudFront alias gives no signal about the health of the distribution\'s origin — CloudFront itself remains "healthy" from Route 53\'s perspective regardless of origin failures, so failover configured this way never triggers.'
    },
    {
      thought: 'Since EvaluateTargetHealth doesn\'t work meaningfully for CloudFront or S3, there is no way to achieve automatic Route 53 failover for those services at all.',
      reality: 'Per this subtopic\'s theory, AWS\'s own guidance is explicit that a genuine failover setup for these highly-available service types should use a standalone Route 53 health check monitoring an actual endpoint instead, attached via HealthCheckId rather than EvaluateTargetHealth.'
    }
  ];
}
