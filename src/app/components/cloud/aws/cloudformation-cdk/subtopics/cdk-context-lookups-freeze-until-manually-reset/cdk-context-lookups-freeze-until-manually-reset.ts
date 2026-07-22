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
  templateUrl: './cdk-context-lookups-freeze-until-manually-reset.html',
  styleUrl: './cdk-context-lookups-freeze-until-manually-reset.scss'
})
export class CdkContextLookupsFreezeUntilManuallyResetSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page recommends context lookups — without ever explaining the caching behavior behind them',
      points: [
        'The main page\'s own best-practices bullet states: "Use CDK context lookups for existing VPCs/subnets — avoids hardcoding IDs that differ per environment." The theory section adds: "CDK context: key-value pairs stored in cdk.context.json after lookups (VPC ID, AZ list); commit to version control."',
        'This is framed purely as a portability convenience — nothing on the main page explains WHY cdk.context.json must be committed to version control, or what happens to a deployment if the real-world VPC referenced by a lookup changes after the value is first cached.',
      ]
    },
    {
      heading: 'Context values are deliberately frozen to prevent unexpected infrastructure drift — only a manual reset picks up new reality',
      points: [
        'Per AWS\'s own documentation: "The CDK Toolkit uses context to cache values retrieved from your AWS account during synthesis... Because these values are provided by your AWS account, they can change between runs of your CDK application. This makes them a potential source of unintended change. The CDK Toolkit\'s caching behavior \'freezes\' these values for your CDK app until you decide to accept the new values."',
        'AWS\'s own worked example, using AMI lookups, makes the reasoning concrete: "Imagine the following scenario without context caching. Let\'s say you specified \'latest Amazon Linux\' as the AMI... and a new version of this AMI was released. Then, the next time you deployed your CDK stack, your already-deployed instances would be using the outdated (\'wrong\') AMI and would need to be upgraded. Upgrading would result in replacing all your existing instances with new ones, which would probably be unexpected and undesired." The exact same mechanism and reasoning governs ec2.Vpc.fromLookup — the main page\'s own named example.',
        'The practical consequence: if the real VPC a Vpc.fromLookup call references changes after the first synth (a subnet added, a CIDR range modified, the VPC recreated with the same name), the CDK app keeps using the STALE values already written to cdk.context.json — cdk synth and cdk diff will not reflect the real, current state until someone explicitly discards the cached entry.',
        'AWS documents the exact commands for this: cdk context (list cached values with their index numbers), cdk context --reset KEY_OR_NUMBER (discard one specific cached value — "it will be refreshed on the next cdk synth"), and cdk context --clear (discard everything cached). AWS also gives an explicit, direct warning against a natural-seeming shortcut: "Do not add or change cached context values by manually editing files."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the staleness — a VPC change that CDK never notices',
      language: 'bash',
      code: `# Matching the main page's own best-practices bullet:
# const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { vpcName: 'my-vpc' });

cdk synth MyStack   # first run -- performs a REAL lookup against AWS,
                     # writes the result into cdk.context.json

cat cdk.context.json
# {
#   "vpc-provider:account=123456789012:filter.vpc-id=vpc-0abc...:region=us-east-1": {
#     "vpcId": "vpc-0abc...",
#     "availabilityZones": ["us-east-1a", "us-east-1b"],
#     "publicSubnetIds": ["subnet-111", "subnet-222"],
#     ...
#   }
# }

# Now a new public subnet is added to the SAME VPC, entirely
# outside of this CDK app (console, a different team's IaC, etc.):
aws ec2 create-subnet --vpc-id vpc-0abc... --cidr-block 10.0.3.0/24 \\
  --availability-zone us-east-1c

# Re-run the CDK app -- per AWS's own docs, the cached value is
# used as-is:
cdk synth MyStack
cdk diff MyStack
# -- no change detected relating to the new subnet. Any construct in
# this stack selecting "all public subnets" still only sees
# subnet-111 and subnet-222 -- the CDK app has no idea the third
# subnet exists, because the cached lookup was never invalidated.`,
    },
    {
      label: 'The fix — explicitly reset the stale entry, then re-synth',
      language: 'bash',
      code: `# List cached context values with their index numbers:
cdk context
# ┌───┬──────────────────────────────────────────────┬─────────────┐
# │ # │ Key                                            │ Value       │
# ├───┼──────────────────────────────────────────────┼─────────────┤
# │ 1 │ vpc-provider:account=123456789012:filter...   │ { ... }     │
# └───┴──────────────────────────────────────────────┴─────────────┘

# Reset just the stale VPC lookup entry (per AWS's own docs, this
# is the same pattern used to pick up a newly-released AMI):
cdk context --reset 1
# Context value
# vpc-provider:account=123456789012:filter.vpc-id=vpc-0abc...
# reset. It will be refreshed on the next SDK synthesis run.

# Re-synthesize -- THIS run performs a fresh, real lookup:
cdk synth MyStack
cat cdk.context.json
# -- publicSubnetIds now includes the new subnet-333, matching
# the real, current state of the VPC.

# Never do this instead -- AWS explicitly warns against it:
# vim cdk.context.json   # <- manually hand-editing the cached
#                             value directly is explicitly called
#                             out as something NOT to do.

# To discard EVERY cached context value at once (broader reset):
cdk context --clear`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own recommended pattern, a team uses ec2.Vpc.fromLookup to reference their shared VPC in a CDK app. A platform team adds a new subnet to that VPC via a separate Terraform-managed process for an unrelated project. The CDK team, expecting their infrastructure-as-code tooling to "just know" about the new subnet, runs cdk deploy on a construct that selects subnets by type, expecting the new subnet to be included automatically. It isn\'t, and no error or warning appears anywhere in the deploy output. Using this subtopic\'s theory, explain why, and the exact steps to fix it.',
    hint: 'What does AWS\'s own documentation say happens to a context value retrieved from your AWS account once it\'s first cached — does it refresh automatically on a later synth, or stay frozen?',
    solution: 'Per this subtopic\'s theory, this is expected behavior, not a bug — AWS\'s own documentation states directly that context values retrieved from an AWS account are deliberately "frozen" once cached: "The CDK Toolkit\'s caching behavior \'freezes\' these values for your CDK app until you decide to accept the new values." Since the VPC lookup was already performed and cached in cdk.context.json during an earlier synth, the CDK app has no built-in mechanism to notice the Terraform-created subnet — it simply reuses the stored value, silently, with no error, exactly matching AWS\'s own stated design goal of preventing "a potential source of unintended change" like an infrastructure config drifting under the app without anyone reviewing it first. The fix is the documented manual reset workflow: run cdk context to find the specific cached VPC lookup entry\'s index number, run cdk context --reset <number> to discard just that entry, and then run cdk synth again — this performs a fresh, real lookup against the actual current VPC state, which will now include the new subnet, and the change becomes visible in the next cdk diff before being deployed intentionally.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ec2.Vpc.fromLookup (and similar context-based lookups) query the live AWS account fresh on every cdk synth or cdk deploy, so infrastructure changes are always picked up automatically.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states the opposite by design — the first lookup\'s result is cached in cdk.context.json and reused on every subsequent synth until explicitly reset, specifically to prevent unexpected changes from an account\'s own drifting state.'
    },
    {
      thought: 'cdk.context.json is just a convenience cache that can be safely deleted or hand-edited at any time without consequence.',
      reality: 'Per this subtopic\'s theory, AWS explicitly warns "Do not add or change cached context values by manually editing files" — the documented way to update a stale value is cdk context --reset (or --clear), which triggers a proper fresh lookup on the next synth, not a manual file edit.'
    },
    {
      thought: 'Since the main page\'s own theory describes cdk.context.json as something to "commit to version control," it must be expected to change frequently, similar to a package lock file that updates with every dependency bump.',
      reality: 'Per this subtopic\'s theory, the opposite is intended — committing it is specifically meant to KEEP these values stable and identical across every environment and CI run, changing only on a deliberate, reviewed reset, not as routine churn.'
    }
  ];
}
