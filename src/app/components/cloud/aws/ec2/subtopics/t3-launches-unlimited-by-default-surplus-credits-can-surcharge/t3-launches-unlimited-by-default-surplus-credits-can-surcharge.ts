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
  templateUrl: './t3-launches-unlimited-by-default-surplus-credits-can-surcharge.html',
  styleUrl: './t3-launches-unlimited-by-default-surplus-credits-can-surcharge.scss'
})
export class T3LaunchesUnlimitedByDefaultSurplusCreditsCanSurchargeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions CPU credits, but never mentions Unlimited mode or its billing implications',
      points: [
        'The main page\'s own "EC2 Instance Families" theory bullet states: "T-series adds burstable CPU credits — t3.micro earns credits when idle, spends them under burst load." This is true as far as it goes, but it never mentions that T3/T3a/T4g instances have TWO distinct credit modes — Standard and Unlimited — with meaningfully different behavior once the credit balance runs out, and never mentions which mode a newly-launched T3 instance actually starts in.',
        'This gap matters because the two modes have very different cost and performance consequences once a workload sustains CPU usage above its baseline for longer than the accumulated credit balance covers.',
      ]
    },
    {
      heading: 'T3/T3a/T4g launch in Unlimited mode BY DEFAULT — unlike T2, which defaults to Standard',
      points: [
        'Per AWS\'s own documentation, T3, T3a, and T4g instances launch in Unlimited mode by default, unless the account-level default credit specification is explicitly changed. This is the opposite of T2, whose instances default to Standard mode.',
        'In Standard mode, once the accumulated CPU credit balance is exhausted, the instance\'s CPU performance is throttled back down to its baseline level — there is no way to exceed the baseline further, and no additional charge is incurred; the instance just gets slower.',
        'In Unlimited mode, an instance can sustain high CPU utilization for any period of time whenever required — the hourly instance price covers all CPU spikes as long as the AVERAGE CPU utilization stays at or below the baseline over a rolling 24-hour period (or the instance\'s lifetime, if shorter). If average utilization over that rolling window exceeds the baseline, the account is charged a flat additional rate per vCPU-hour for the surplus credits used — this is a real, uncapped cost exposure that Standard mode simply does not have.',
        'This has a direct, easy-to-miss consequence for short-lived workloads: launching a Spot Instance in Unlimited mode for a short burst of intense work, with no idle time beforehand to accrue credits, results in surplus-credit charges from essentially the first minute — AWS\'s own documentation specifically recommends Standard mode for this exact scenario to avoid the extra cost.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking and setting the credit specification',
      language: 'bash',
      code: `# Check which mode a running T3 instance is actually using --
# don't assume: the main page's own launch example never sets this
# explicitly, so it's running whatever the account-level default is.
aws ec2 describe-instance-credit-specifications \\
  --instance-ids i-0abc123456789

# {
#   "InstanceCreditSpecifications": [
#     {
#       "InstanceId": "i-0abc123456789",
#       "CpuCredits": "unlimited"
#     }
#   ]
# }
# -- confirms this t3.micro is running in UNLIMITED mode, the T3
#    family's own default, even though nothing in the launch
#    command explicitly requested it.

# Explicitly launch a T3 instance in STANDARD mode instead --
# necessary when the surplus-credit surcharge risk isn't acceptable
# for this workload:
aws ec2 run-instances \\
  --image-id ami-0c02fb55956c7d316 \\
  --instance-type t3.micro \\
  --credit-specification CpuCredits=standard \\
  --count 1

# Switch an EXISTING instance's mode without stopping it:
aws ec2 modify-instance-credit-specification \\
  --instance-credit-specifications 'InstanceId=i-0abc123456789,CpuCredits=standard'`,
    },
    {
      label: 'Monitoring credit balance and surplus-credit charges',
      language: 'bash',
      code: `# CPUCreditBalance shows accumulated (unspent) credits
aws cloudwatch get-metric-statistics \\
  --namespace AWS/EC2 \\
  --metric-name CPUCreditBalance \\
  --dimensions Name=InstanceId,Value=i-0abc123456789 \\
  --start-time 2026-07-21T00:00:00Z \\
  --end-time 2026-07-21T23:59:59Z \\
  --period 3600 \\
  --statistics Average

# CPUSurplusCreditBalance shows credits spent BEYOND the earned
# balance in Unlimited mode -- if this metric is non-zero and
# growing, the account is actively accruing surplus-credit charges:
aws cloudwatch get-metric-statistics \\
  --namespace AWS/EC2 \\
  --metric-name CPUSurplusCreditBalance \\
  --dimensions Name=InstanceId,Value=i-0abc123456789 \\
  --start-time 2026-07-21T00:00:00Z \\
  --end-time 2026-07-21T23:59:59Z \\
  --period 3600 \\
  --statistics Maximum

# A companion metric, CPUSurplusCreditsCharged, shows credits that
# were NOT repaid by later idle time within the 24-hour window and
# were actually billed -- the definitive signal that Unlimited mode
# cost more than the baseline instance price this billing period.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team launches a fleet of t3.large Spot Instances for a 20-minute batch job that runs at 100% CPU for the entire duration, immediately after launch, with no prior idle period on any instance. Nobody explicitly set --credit-specification at launch. The team is surprised to see CPU surplus credit charges on the bill. Using this subtopic\'s theory, explain why this happened and what should have been configured instead.',
    hint: 'What mode do T3 instances launch in by default, and does a brand-new instance have any accumulated CPU credit balance to draw on before that mode starts charging for surplus usage?',
    solution: 'T3 instances launch in Unlimited mode by default unless explicitly configured otherwise, and this team never set --credit-specification, so every instance in the fleet started in Unlimited mode. Because the batch job ran at 100% CPU immediately after launch with no prior idle time, the instances had no accumulated CPU credit balance to draw on — the entire 20 minutes of above-baseline usage was billed as surplus credits from essentially the first minute. This matches AWS\'s own documented guidance for exactly this scenario: launching Spot Instances in Unlimited mode for immediate, short-duration, high-CPU work with no idle time to accrue credits reliably incurs surplus-credit charges. The fix is to explicitly launch these instances with --credit-specification CpuCredits=standard instead — in Standard mode, once any (in this case, nonexistent) credit balance is exhausted, the instance is simply throttled back to its baseline CPU performance rather than incurring an additional charge, trading raw throughput for cost predictability, which is the right tradeoff for a fixed-duration batch job where the team can tolerate baseline-level performance rather than paying a surcharge for sustained above-baseline bursts.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'All T-series instance families (T2, T3, T3a, T4g) launch in the same credit mode by default.',
      reality: 'Per this subtopic\'s theory, T2 defaults to Standard mode, while T3, T3a, and T4g default to Unlimited mode — a real difference in default behavior across the T-series generations, not a uniform default.'
    },
    {
      thought: 'Unlimited mode is strictly better than Standard mode since it never throttles CPU performance, so there\'s no real downside to leaving it as the default.',
      reality: 'Per this subtopic\'s theory, Unlimited mode trades away the throttling behavior for a real, potentially uncapped cost exposure — if average CPU utilization exceeds the baseline over a rolling 24-hour period, the account is charged a flat additional rate per vCPU-hour for the surplus, a cost Standard mode never incurs.'
    },
    {
      thought: 'A newly-launched instance always has enough of an initial CPU credit balance to absorb a short burst of high CPU usage without triggering surplus charges.',
      reality: 'Per this subtopic\'s exercise, a fresh instance launched directly into sustained high-CPU work with no prior idle period has no accumulated balance to draw on — in Unlimited mode, that usage is billed as surplus credits essentially immediately.'
    }
  ];
}
