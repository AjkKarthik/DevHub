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
  templateUrl: './spot-rebalance-vs-2-minute-notice.html',
  styleUrl: './spot-rebalance-vs-2-minute-notice.scss'
})
export class SpotRebalanceVs2MinuteNoticeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats "the 2-minute warning" as the ONLY Spot interruption signal — it never mentions the earlier one',
      points: [
        'The main page\'s own quickRef defines Spot Instances only as: "Up to 90% off for fault-tolerant workloads; 2-minute interruption warning before reclaim" — presenting the 2-minute notice as the sole warning mechanism.',
        'The main page\'s own theory and quiz both repeat the same single number: "Spot interruption handling: poll the instance metadata endpoint every 5 seconds; on interruption notice, drain, checkpoint, and terminate gracefully" and a quiz question whose entire correct answer is "2 minutes" — reinforcing a mental model where 2 minutes is the only lead time an application can ever count on.',
      ]
    },
    {
      heading: 'AWS actually documents TWO distinct signals — a rebalance recommendation can arrive earlier, but is not guaranteed to',
      points: [
        'Per AWS\'s own documentation: "Amazon EC2 emits a rebalance recommendation signal to the Spot Instance when the instance is at an elevated risk of interruption. You can rely on the rebalance recommendation to proactively manage Spot Instance interruptions without having to wait for the two-minute Spot Instance interruption notice." This is a SEPARATE signal from the interruption notice, emitted earlier, before AWS has actually committed to reclaiming the instance.',
        'AWS is explicit that this earlier signal is not a guarantee: "It is not always possible for Amazon EC2 to send the rebalance recommendation signal before the two-minute Spot Instance interruption notice. Therefore, the rebalance recommendation signal can arrive along with the two-minute interruption notice." A workload that only monitors for the rebalance recommendation and assumes it always gets extra lead time can be surprised by a case where both signals fire together, with no head start at all.',
        'Both signals share the same underlying caveat the main page never states for either: AWS\'s own docs describe both as "emitted on a best effort basis" — even the 2-minute interruption notice itself carries no hard guarantee. AWS\'s own guidance is explicit about this: "While we make every effort to provide these warnings as soon as possible, it is possible that your Spot Instance is interrupted before the warnings can be made available... Test your application to ensure that it handles an unexpected instance interruption gracefully, even if you are monitoring for rebalance recommendation signals and interruption notices."',
        'Rebalance recommendations are also only supported for Spot Instances launched after November 5, 2020 — a long-lived instance from an older launch template family could theoretically miss out, though this is now a largely historical edge case.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two separate EventBridge event types',
      language: 'bash',
      code: `# Interruption notice event -- fires exactly 2 minutes before
# Amazon EC2 stops/terminates the instance (best effort)
# {
#   "detail-type": "EC2 Spot Instance Interruption Warning",
#   "source": "aws.ec2",
#   "detail": { "instance-id": "i-1234567890abcdef0", "instance-action": "terminate" }
# }

# Rebalance recommendation event -- can fire EARLIER, while the
# instance is only at "elevated risk," before AWS has committed to
# reclaiming it -- but is not guaranteed to arrive before the
# interruption notice above
# {
#   "detail-type": "EC2 Instance Rebalance Recommendation",
#   "source": "aws.ec2",
#   "detail": { "instance-id": "i-1234567890abcdef0" }
# }

# Poll both from the instance itself (per AWS's own docs, check
# every 5 seconds for each):
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \\
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \\
  http://169.254.169.254/latest/meta-data/spot/instance-action
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \\
  http://169.254.169.254/latest/meta-data/events/recommendations/rebalance`,
    },
    {
      label: 'Rebalancing action — proactively replace before the hard deadline',
      language: 'bash',
      code: `# EventBridge rule matching the rebalance recommendation event, so
# a fleet can start replacing an at-risk instance BEFORE it ever
# receives the 2-minute interruption notice
aws events put-rule \\
  --name spot-rebalance-signal \\
  --event-pattern '{
    "source": ["aws.ec2"],
    "detail-type": ["EC2 Instance Rebalance Recommendation"]
  }'

# Per AWS's own docs, ASG/EC2 Fleet/Spot Fleet Capacity Rebalancing
# uses this exact signal "to make it easy for you to maintain
# workload availability by proactively augmenting your fleet with a
# new Spot Instance before a running instance receives the
# two-minute Spot Instance interruption notice":
aws autoscaling update-auto-scaling-group \\
  --auto-scaling-group-name mixed-fleet \\
  --capacity-rebalance
# -- launches a replacement instance on rebalance recommendation,
# giving the workload time to migrate before the harder 2-minute
# deadline even arrives -- though per AWS's own docs this early
# warning is still "best effort," not a guarantee.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s fleet only listens for the "EC2 Spot Instance Interruption Warning" EventBridge event (the 2-minute notice) and assumes this always gives them the earliest possible signal an instance is at risk. Using this subtopic\'s theory, what are they missing, and is their assumption always wrong?',
    hint: 'Per AWS\'s own documentation, does a rebalance recommendation ALWAYS arrive before the 2-minute interruption notice, or only sometimes?',
    solution: 'Per this subtopic\'s theory, the team is missing the separate "EC2 Instance Rebalance Recommendation" event, which AWS\'s own documentation confirms "can arrive sooner than the two-minute Spot Instance interruption notice, giving you the opportunity to proactively manage the Spot Instance." By only listening for the interruption notice, they lose the chance to proactively replace an at-risk instance before AWS has even committed to reclaiming it. However, their assumption isn\'t always wrong in every individual case — AWS\'s own documentation is explicit that "it is not always possible for Amazon EC2 to send the rebalance recommendation signal before the two-minute Spot Instance interruption notice," so the two signals can arrive together with no extra lead time at all. The correct takeaway is that the rebalance recommendation is a valuable EXTRA opportunity when it does arrive early, not a reliable guarantee that replaces the need to also handle the 2-minute notice — and even that notice itself is emitted only "on a best effort basis," so the application must still tolerate an unexpected interruption with no warning at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The 2-minute Spot Instance interruption notice is the earliest warning AWS provides before reclaiming an instance.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation describes a separate, earlier "rebalance recommendation" signal that fires when an instance is merely at "elevated risk" — before AWS has committed to actually reclaiming it — though this earlier signal is not guaranteed to arrive before the 2-minute notice in every case.'
    },
    {
      thought: 'A rebalance recommendation always gives extra lead time beyond the 2-minute interruption notice, so an application relying on it can skip handling the interruption notice separately.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states the rebalance recommendation "can arrive along with the two-minute interruption notice" — it is not a guaranteed head start, so applications still need to handle the 2-minute notice as the reliable fallback signal.'
    },
    {
      thought: 'Since AWS documents a fixed 2-minute warning, an application can safely assume it will always receive at least 2 minutes of notice before any Spot interruption.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states interruption notices are "emitted on a best effort basis" and explicitly instructs developers to "test your application to ensure that it handles an unexpected instance interruption gracefully" — the 2-minute figure is not a hard guarantee.'
    }
  ];
}
