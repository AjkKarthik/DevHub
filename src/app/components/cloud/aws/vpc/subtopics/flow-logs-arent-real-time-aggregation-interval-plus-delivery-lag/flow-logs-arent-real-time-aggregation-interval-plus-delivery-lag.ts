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
  templateUrl: './flow-logs-arent-real-time-aggregation-interval-plus-delivery-lag.html',
  styleUrl: './flow-logs-arent-real-time-aggregation-interval-plus-delivery-lag.scss'
})
export class FlowLogsArentRealTimeAggregationIntervalPlusDeliveryLagSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own debugging advice reads as if Flow Logs were live',
      points: [
        'The main page\'s own theory bullet says Flow Logs "help debug connectivity issues: filter for REJECT records to see which traffic is being blocked" — and its own QnA answer describes the same workflow (enable flow logs, filter for REJECT, trace back to the blocking rule) without ever mentioning HOW LONG after the actual traffic a REJECT record becomes visible.',
        'For someone debugging a live incident — "why can\'t this instance reach the database right now" — that timing gap is exactly the detail that determines whether Flow Logs are even the right tool to reach for in the moment, versus something to check after the fact.',
      ]
    },
    {
      heading: 'A flow log record is an aggregated summary of a time window, not a live event stream',
      points: [
        'Per AWS\'s own documentation, "flow logs do not capture real-time log streams for your network interfaces." Each record instead represents a network flow aggregated over an "aggregation interval" (also called a capture window) — by default, the maximum aggregation interval is 10 minutes, though a shorter 1-minute interval can be optionally specified when creating the flow log.',
        'On top of the aggregation interval itself, there is additional processing and delivery time after the window closes — AWS\'s own documentation states flow log delivery to CloudWatch Logs typically takes about 5 minutes, and to Amazon S3 about 10 minutes, both on a best-effort basis (meaning actual delivery can be slower still under load).',
        'One partial mitigation the main page\'s own bullets don\'t mention: for a network interface attached to a Nitro-based EC2 instance, the aggregation interval is ALWAYS 1 minute or less, regardless of what maximum aggregation interval was configured on the flow log itself — Nitro instances get finer-grained flow records automatically, without needing the 1-minute option explicitly requested.',
        'Put together, a REJECT record from a NON-Nitro resource with the default 10-minute aggregation interval, published to S3, could take on the order of 10 (aggregation) + 10 (delivery) = roughly 20 minutes to become queryable after the actual rejected packet — a real, material delay for the exact "debug why this connection is failing right now" workflow the main page\'s own advice describes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A REJECT happens now — but the log record isn\'t there yet',
      language: 'bash',
      code: `# A connection attempt fails RIGHT NOW at 14:32:07 -- an engineer
# immediately follows the main page's own advice and queries for
# REJECT records:
aws logs filter-log-events \\
  --log-group-name /vpc/flow-logs \\
  --start-time $(date -d '14:30:00' +%s000) \\
  --filter-pattern "REJECT" \\
  --query 'events[].message'
# []   <- empty. The record for a 14:32:07 rejection isn't
#          published yet -- it's still sitting inside its own
#          aggregation interval (up to 10 minutes by default),
#          and delivery to CloudWatch Logs takes ~5 more minutes
#          on top of that once the window closes.

# Waiting and re-querying a few minutes later:
sleep 600
aws logs filter-log-events \\
  --log-group-name /vpc/flow-logs \\
  --start-time $(date -d '14:30:00' +%s000) \\
  --filter-pattern "REJECT" \\
  --query 'events[].message'
# [
#   "2 123456789012 eni-0abc 10.0.1.5 10.0.20.10 54321 5432 6 5 320 1234567927 1234567931 REJECT OK"
# ]
# -- NOW it appears -- roughly 10-15 minutes after the actual
# rejected connection attempt, not instantly.`,
    },
    {
      label: 'Checking whether a resource is Nitro-based — and configuring a shorter interval',
      language: 'bash',
      code: `# Confirm whether the ENI in question belongs to a Nitro-based
# instance -- if so, its aggregation interval is ALREADY capped at
# 1 minute regardless of the flow log's own configured maximum:
aws ec2 describe-instance-types --instance-types t3.medium \\
  --query 'InstanceTypes[].Hypervisor'
# ["nitro"]
# -- t3, m5, c6g, and most modern instance families are Nitro-based;
# older families (e.g. some m4/c4 instances) may not be.

# For flow logs on non-Nitro resources (or to be explicit rather
# than rely on the Nitro-instance default), request the 1-minute
# aggregation interval directly when creating the flow log:
aws ec2 create-flow-logs \\
  --resource-type VPC \\
  --resource-ids $VPC_ID \\
  --traffic-type REJECT \\
  --max-aggregation-interval 60 \\
  --log-destination-type cloud-watch-logs \\
  --log-group-name /vpc/flow-logs-fast \\
  --deliver-logs-permission-arn arn:aws:iam::123456789012:role/flow-logs-role

# This shortens the AGGREGATION half of the delay to at most 1
# minute -- the ~5-minute CloudWatch Logs delivery time (best
# effort) still applies on top, so this is a real improvement, not
# a full elimination of the lag the main page's own "filter for
# REJECT" advice doesn't account for.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An on-call engineer gets paged for a live connectivity failure. Following the main page\'s own advice, they immediately enable VPC Flow Logs on the affected subnet and start querying for REJECT records to find the blocking rule — but 3 minutes later, the query still returns nothing, even though the connectivity failure is actively ongoing. Using this subtopic\'s theory, is Flow Logs the wrong tool here, or is something else going on — and what would actually help resolve the incident faster in the moment?',
    hint: 'The flow log was just enabled a few minutes ago — combine that with the default aggregation interval and typical delivery time. Is 3 minutes enough time for even the FIRST record to exist yet?',
    solution: 'Flow Logs are not the wrong tool for eventually finding the blocking rule, but per this subtopic\'s theory, 3 minutes is very likely not enough time for a record to exist yet in this scenario — especially since the flow log was JUST enabled, meaning there is no historical data before that point either, and with the default 10-minute aggregation interval plus roughly 5 more minutes of best-effort delivery to CloudWatch Logs, a record covering the ongoing failure could easily take 10-15+ minutes to become queryable. For an ACTIVELY ongoing incident where minutes matter, waiting on Flow Logs alone is the wrong first move — a faster path is checking the security group and NACL rules directly (as the main page\'s own earlier NACL-return-traffic mistake entry already illustrates) to spot an obviously missing allow rule without waiting for any log delivery at all, and only leaning on Flow Logs\' REJECT filtering as a confirmation step or for less time-sensitive investigation once the immediate incident is resolved. If Flow Logs are the only viable diagnostic path, per this subtopic\'s theory, creating the flow log with --max-aggregation-interval 60 (or confirming the affected ENI is already on a Nitro-based instance, which gets 1-minute aggregation automatically) at least minimizes the aggregation-side delay, though the delivery-time component still applies on top regardless.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Filtering VPC Flow Logs for REJECT records, as the main page\'s own advice describes, shows connection failures in near-real-time as they happen.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states flow logs do not capture real-time log streams — a record represents a whole aggregation interval (up to 10 minutes by default) plus additional best-effort delivery time (roughly 5 more minutes to CloudWatch Logs, ~10 to S3) before it becomes visible.'
    },
    {
      thought: 'Every EC2 instance\'s network interface gets the same flow log aggregation interval behavior, governed purely by the flow log\'s own configured setting.',
      reality: 'Per this subtopic\'s theory, a network interface on a Nitro-based instance always gets an aggregation interval of 1 minute or less, regardless of what maximum aggregation interval was configured on the flow log — this is a property of the underlying instance hardware, not just the flow log configuration.'
    },
    {
      thought: 'Enabling VPC Flow Logs for the first time during an active incident gives an engineer immediate visibility into what\'s currently happening on the network.',
      reality: 'Per this subtopic\'s exercise, a newly-created flow log has no historical data before its creation time, and still has to wait out at least one full aggregation interval plus delivery time before its FIRST record for ongoing traffic becomes queryable — it is not an instant, retroactive view into current network activity.'
    }
  ];
}
