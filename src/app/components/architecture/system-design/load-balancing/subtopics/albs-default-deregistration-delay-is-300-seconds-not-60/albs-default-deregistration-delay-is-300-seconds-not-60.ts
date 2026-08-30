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
  templateUrl: './albs-default-deregistration-delay-is-300-seconds-not-60.html',
  styleUrl: './albs-default-deregistration-delay-is-300-seconds-not-60.scss'
})
export class AlbsDefaultDeregistrationDelayIs300SecondsNot60Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "typically" claim that was off by 5-10x for the vendor it named',
      points: [
        'The main page\'s QnA on connection draining stated the drain timeout is "typically 30-60 seconds," in a paragraph that explicitly names AWS ALB as an example. AWS ALB\'s own actual default is significantly longer. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: AWS ALB defaults to a 300-second (5-minute) deregistration delay',
      points: [
        'Per AWS\'s own documentation, an Application Load Balancer target group\'s deregistration delay (the official name for connection draining in AWS\'s terminology) defaults to 300 seconds, and is configurable anywhere from 0 to 3600 seconds.',
        'The 30-60 second range isn\'t fabricated — it\'s a common, reasonable value teams TUNE the delay DOWN to for faster deployments — but stating it as the "typical" default is backwards: AWS starts you at 300 seconds, and shortening it is a deliberate configuration change, not the out-of-the-box behavior.',
        'Self-managed load balancers like NGINX have no fixed vendor default at all (drain behavior is whatever you configure), so citing "30-60 seconds" as if it were a shared, typical default across BOTH AWS ALB and self-managed NGINX conflates a specific vendor\'s actual default with a value that\'s really just a common manual tuning choice.',
      ]
    },
    {
      heading: 'Why the specific number matters for a deployment timeline',
      points: [
        'A team assuming the "typical" 30-60 second figure while actually running on ALB\'s untouched 300-second default would be surprised that a rolling deployment takes 5x longer to fully cycle through instances than expected — each instance drains for up to 5 minutes before the deployment can proceed to the next one, unless the deployment tooling is specifically configured to not wait for draining to complete.',
        'Knowing the REAL default (300s) — and that it\'s a deliberate choice to shorten it — is what lets you correctly reason about "how long will this deployment actually take" rather than assuming a shorter, more convenient number that doesn\'t match the vendor\'s actual out-of-the-box behavior.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking and configuring the real default',
      language: 'bash',
      code: `# Check an ALB target group's current deregistration delay:
aws elbv2 describe-target-group-attributes \\
  --target-group-arn <arn> \\
  --query "Attributes[?Key=='deregistration_delay.timeout_seconds']"
# Default output if never touched: 300 (seconds)

# Explicitly shorten it for faster deployments (a deliberate
# choice, not the out-of-the-box behavior):
aws elbv2 modify-target-group-attributes \\
  --target-group-arn <arn> \\
  --attributes Key=deregistration_delay.timeout_seconds,Value=45

# Valid range: 0 - 3600 seconds`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team plans a rolling deployment across 10 ALB-fronted instances, budgeting 60 seconds of drain time per instance (10 minutes total) based on the main page\'s original (now-corrected) "typically 30-60 seconds" claim. They never touched the target group\'s deregistration delay setting. How long will the deployment actually take to drain all 10 instances, and why?',
    hint: 'What is AWS ALB\'s actual DEFAULT deregistration delay, if the team never explicitly configured it?',
    solution: 'Since the team never configured the deregistration delay, it remains at AWS\'s actual default of 300 seconds (5 minutes) per instance — not the 60 seconds they budgeted. Draining all 10 instances sequentially would take up to 50 minutes, not the 10 minutes they planned for — a 5x underestimate directly traceable to assuming the wrong "typical" default. To hit their original 10-minute target, they would need to EXPLICITLY set `deregistration_delay.timeout_seconds` to something like 60, since that is not what AWS starts you with.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'AWS ALB\'s connection-draining (deregistration delay) default is around 30-60 seconds.',
      reality: 'Per this subtopic\'s theory (a figure corrected on the main page during this batch), AWS ALB\'s actual default deregistration delay is 300 seconds (5 minutes) — 30-60 seconds is a common value teams manually configure it DOWN to, not the out-of-the-box default.'
    },
    {
      thought: 'Since both AWS ALB and self-managed NGINX "typically" use similar drain timeouts, it\'s reasonable to cite one shared number for both.',
      reality: 'Per this subtopic\'s theory, AWS ALB has a specific, documented default (300s) that NGINX has no equivalent of at all — NGINX\'s drain behavior is purely whatever you configure, with no vendor default to compare against.'
    },
    {
      thought: 'The exact deregistration delay value doesn\'t materially affect how long a rolling deployment takes.',
      reality: 'Per this subtopic\'s theory, it directly multiplies the total deployment time across all instances being cycled — assuming 60 seconds when the real default is 300 seconds understates a 10-instance rolling deployment\'s duration by roughly 5x.'
    }
  ];
}
