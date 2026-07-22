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
  templateUrl: './local-zones-run-a-subset-of-services-not-a-full-region.html',
  styleUrl: './local-zones-run-a-subset-of-services-not-a-full-region.scss'
})
export class LocalZonesRunASubsetOfServicesNotAFullRegionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page explains Regions and Availability Zones, but never mentions Local Zones at all',
      points: [
        'The main page\'s own "Global Infrastructure" theory section covers the standard two-level hierarchy — Regions, each containing multiple isolated Availability Zones — and treats that as the complete picture of where AWS resources can run. It never mentions AWS Local Zones or Wavelength Zones, both of which extend a parent Region\'s own infrastructure to a location physically closer to end users or 5G networks, but are neither a full Region nor a standard Availability Zone.',
        'This matters because a reader who only knows "Regions contain AZs" might assume a Local Zone behaves like just another AZ within its parent Region — fully interchangeable, with every service available identically. It is not.',
      ]
    },
    {
      heading: 'Local Zones and Wavelength Zones offer only a curated SUBSET of services locally, not the full regional catalog',
      points: [
        'Per AWS\'s own documentation, a Local Zone runs a deliberately limited set of services locally — typically EC2 (a subset of instance types), EBS, certain ELB configurations, and VPC — chosen specifically for low-latency, compute-heavy workloads (video rendering, real-time gaming, machine learning inference at the edge). Services like Lambda, DynamoDB, and standard S3 buckets are, per AWS\'s current documentation, typically NOT available directly inside a Local Zone.',
        'Despite that local subset, an application running in a Local Zone is not cut off from the rest of AWS: every Local Zone is attached to a specific parent Region and connected to it over AWS\'s own private, high-bandwidth backbone network — so the SAME application can call any AWS service that IS only available in the parent Region (Lambda, DynamoDB, full S3, etc.) over that private backbone, without traversing the public internet at all.',
        'Practically, this makes choosing a Local Zone a "yes, and" decision rather than an all-or-nothing one: the latency-sensitive compute/storage portion of a workload runs physically closer to users in the Local Zone, while everything else the application needs keeps running normally in the parent Region — the two are meant to be used together, not as a complete standalone replacement for the Region.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Listing available Local Zones and opting in',
      language: 'bash',
      code: `# Local Zones are OPT-IN per account/region -- listing them first:
aws ec2 describe-availability-zones \\
  --all-availability-zones \\
  --filters "Name=zone-type,Values=local-zone" \\
  --query "AvailabilityZones[].{Zone:ZoneName,Group:GroupName,Status:OptInStatus}"

# [
#   { "Zone": "us-west-2-lax-1a", "Group": "us-west-2-lax-1", "Status": "not-opted-in" },
#   { "Zone": "us-west-2-lax-1b", "Group": "us-west-2-lax-1", "Status": "not-opted-in" }
# ]
# -- "us-west-2-lax-1" -- a Los Angeles Local Zone whose PARENT
#    Region is us-west-2 (Oregon) -- confirmed by the zone name's
#    own prefix, even though LA and Oregon are physically distant.

aws ec2 modify-availability-zone-group \\
  --group-name us-west-2-lax-1 \\
  --opt-in-status opted-in
# -- opting in is required before EC2 instances (or subnets) can be
#    launched into this Local Zone at all -- it does not happen by
#    default just because the parent Region is already in use.`,
    },
    {
      label: 'A Local Zone instance can still reach parent-Region-only services',
      language: 'bash',
      code: `# Launch an EC2 instance INSIDE the Local Zone (subset of instance
# types available -- not every type offered in us-west-2 itself):
aws ec2 run-instances \\
  --image-id ami-0abcdef1234567890 \\
  --instance-type t3.medium \\
  --subnet-id subnet-0localzoneexample \\
  --placement AvailabilityZone=us-west-2-lax-1a

# From INSIDE that Local Zone instance, calling a service that has
# NO local presence there at all -- e.g. Lambda, which per AWS's
# own documentation typically doesn't run directly in Local Zones:
aws lambda invoke --function-name my-processing-fn out.json \\
  --region us-west-2
# {
#   "StatusCode": 200,
#   "ExecutedVersion": "$LATEST"
# }
# -- this SUCCEEDS -- the call is routed over AWS's own private
#    backbone network to the PARENT Region (us-west-2), where
#    Lambda actually runs -- the Local Zone instance is never
#    isolated from services outside its own local subset, it just
#    doesn't RUN those services physically inside the Local Zone
#    itself.

# Similarly, DynamoDB and standard S3 calls from this same instance
# transparently reach us-west-2's own DynamoDB/S3 endpoints over
# that same private backbone -- no special configuration needed
# beyond the normal --region setting.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants to run a real-time video-rendering application with the lowest possible latency for users in a city that has an AWS Local Zone. The rendering compute needs to be as close to users as possible, but the application also relies heavily on DynamoDB for session state and Lambda for background processing. A team member argues "Local Zones don\'t have DynamoDB or Lambda, so we can\'t use a Local Zone for this app at all — it\'s all or nothing." Is that argument correct?',
    hint: 'Does using a Local Zone for the latency-sensitive compute portion of a workload require every other service the application uses to also run inside that same Local Zone?',
    solution: 'No, the team member\'s "all or nothing" framing is incorrect. Per this subtopic\'s theory, a Local Zone is meant to be used together with its parent Region, not as a standalone replacement for it — the latency-sensitive rendering compute (EC2/EBS) can run physically inside the Local Zone for the lowest possible latency to local users, while the application\'s DynamoDB and Lambda calls transparently reach the parent Region over AWS\'s own private backbone network, exactly as they would from any other EC2 instance in that Region. The architecture doesn\'t need to choose between "everything in the Local Zone" and "nothing in the Local Zone" — it\'s designed as a hybrid: put only the services that genuinely benefit from local physical proximity (compute, for this rendering workload) in the Local Zone, and let everything else keep running normally in the parent Region.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Local Zone is just another Availability Zone within its parent Region, with the same full catalog of services available.',
      reality: 'Per this subtopic\'s theory, a Local Zone runs only a deliberately curated SUBSET of services (typically EC2, EBS, certain ELB configurations, VPC) — it is not a standard AZ and does not carry the parent Region\'s full service catalog locally.'
    },
    {
      thought: 'Because Lambda and DynamoDB aren\'t available inside a Local Zone, an application running there can\'t use those services at all.',
      reality: 'Per this subtopic\'s theory, the application CAN still use them — calls are routed over AWS\'s own private backbone network to the parent Region, where those services actually run; the Local Zone\'s limited local service set doesn\'t cut the instance off from the rest of AWS.'
    },
    {
      thought: 'Every Local Zone becomes available automatically the moment its parent Region is in use, since it\'s conceptually part of that Region.',
      reality: 'Per this subtopic\'s code example, Local Zones are opt-in per account and Region — `describe-availability-zones` shows them as "not-opted-in" by default, and `modify-availability-zone-group` must be called explicitly before resources can be launched into one.'
    }
  ];
}
