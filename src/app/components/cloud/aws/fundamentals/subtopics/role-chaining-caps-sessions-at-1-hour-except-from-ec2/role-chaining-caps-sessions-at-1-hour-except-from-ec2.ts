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
  templateUrl: './role-chaining-caps-sessions-at-1-hour-except-from-ec2.html',
  styleUrl: './role-chaining-caps-sessions-at-1-hour-except-from-ec2.scss'
})
export class RoleChainingCapsSessionsAt1HourExceptFromEc2Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions assuming a role, but never mentions chaining or its session-duration cap',
      points: [
        'The main page\'s own "AWS CLI & SDK" code tab shows a single `aws sts assume-role` call in isolation, and its own theory bullets describe a role\'s `MaxSessionDuration` setting as if it always applies (up to 12 hours) — the main page never discusses what happens when the credentials used to CALL `assume-role` are themselves already temporary, assumed-role credentials rather than long-lived IAM user or root credentials.',
        '"Role chaining" is AWS\'s own term for exactly that scenario: using one assumed role\'s temporary credentials to assume a SECOND role. It is a common real pattern — cross-account access setups, CI/CD pipelines that assume a deploy role and then a target-account role, or federated SSO sessions that chain into a workload-specific role.',
      ]
    },
    {
      heading: 'Role chaining caps the resulting session at exactly 1 hour, regardless of the target role\'s own MaxSessionDuration',
      points: [
        'Per AWS\'s own documented STS behavior, when the credentials passed to `assume-role` are themselves temporary security credentials from an earlier `assume-role` call, the NEW session\'s maximum duration is capped at 1 hour — even if the target role\'s own `MaxSessionDuration` setting allows up to 12 hours. Requesting a longer `DurationSeconds` value on a chained call does not override this; AWS simply truncates the resulting session to 1 hour.',
        'This is a hard STS-level limit, not a role-configuration setting that can be raised — there is no `MaxSessionDuration` value, IAM policy, or CLI flag that extends a chained session past 1 hour. The only way to get a longer session is to avoid chaining: assume the target role directly from a source of LONG-LIVED (non-temporary) credentials instead of from an already-assumed role\'s temporary ones.',
        'There is one documented exception the main page\'s own wording doesn\'t distinguish: assuming a role FROM an EC2 instance profile\'s own credentials is explicitly exempted from the role-chaining limit by AWS — even though EC2 instance profile credentials are themselves technically temporary, AWS does not treat using them to call `assume-role` as "chaining" for this specific 1-hour cap, so the target role\'s own configured `MaxSessionDuration` (up to 12 hours) applies normally in that case.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A direct assume-role from long-lived credentials — full duration honored',
      language: 'bash',
      code: `# Starting from a long-lived IAM user's own access key (NOT a
# temporary/assumed-role credential), assume a role configured with
# MaxSessionDuration = 12 hours:

aws configure list
# ...
#   access_key ****************ABCD  shared-credentials-file
#   -- this is a long-lived IAM user key, not a temporary session

aws sts assume-role \\
  --role-arn arn:aws:iam::123456789012:role/DeployRole \\
  --role-session-name deploy-session \\
  --duration-seconds 43200

# {
#   "Credentials": {
#     "AccessKeyId": "ASIADEPLOYEXAMPLE",
#     "Expiration": "2026-07-22T04:00:00Z"
#   }
# }
# -- issued at 16:00 UTC, expires 04:00 UTC the next day --
#    the full requested 12 hours (43200 seconds) is honored,
#    because the CALLER's own credentials were long-lived, not
#    themselves a temporary assumed-role session.`,
    },
    {
      label: 'Chaining a second assume-role on top — silently truncated to 1 hour',
      language: 'bash',
      code: `# Now use THOSE deploy-session credentials (temporary, from the
# call above) to assume a SECOND role in a different account:

export AWS_ACCESS_KEY_ID=ASIADEPLOYEXAMPLE
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...

aws sts assume-role \\
  --role-arn arn:aws:iam::987654321098:role/TargetAccountRole \\
  --role-session-name chained-session \\
  --duration-seconds 43200
# still requesting 12 hours...

# {
#   "Credentials": {
#     "AccessKeyId": "ASIACHAINEDEXAMPLE",
#     "Expiration": "2026-07-21T17:00:00Z"
#   }
# }
# -- issued at 16:00 UTC, expires 17:00 UTC THE SAME DAY --
#    only 1 hour, NOT the requested 12 -- this is role chaining:
#    the CALLER (deploy-session) was itself a temporary, assumed-role
#    credential, so STS silently caps the new session at 1 hour
#    regardless of --duration-seconds or the target role's own
#    MaxSessionDuration setting. No error or warning is returned --
#    the shorter Expiration is the only signal this happened.

# The documented exception: calling assume-role directly from an
# EC2 instance profile's own credentials is NOT treated as chaining
# -- the target role's full MaxSessionDuration (here, 12 hours)
# would be honored in that specific case, even though instance
# profile credentials are also technically temporary.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A CI/CD pipeline runs as an IAM user with long-lived access keys. Step 1 assumes a "PipelineRole" (MaxSessionDuration: 2 hours) to get temporary credentials. Step 2 then uses THOSE temporary credentials to assume a "DeployRole" in a target account (MaxSessionDuration: 12 hours), requesting the full 12 hours. The pipeline\'s deploy step sometimes takes 3 hours and starts failing partway through with expired-credential errors. Why, and what\'s the fix?',
    hint: 'Is Step 2\'s assume-role call starting from long-lived credentials, or from Step 1\'s already-temporary session?',
    solution: 'Step 2 is a chained assume-role call — it uses Step 1\'s temporary PipelineRole credentials (not the original long-lived IAM user credentials) to assume DeployRole. Per this subtopic\'s theory, role chaining caps the resulting session at exactly 1 hour, regardless of DeployRole\'s own configured 12-hour MaxSessionDuration or the 12-hour --duration-seconds requested in the call — so the deploy session actually expires after 1 hour, well before the pipeline\'s occasional 3-hour runs finish, causing the mid-run expired-credential failures. The fix is to break the chain: have the pipeline\'s IAM user assume DeployRole DIRECTLY (using its own long-lived credentials), rather than going through PipelineRole first, if DeployRole\'s full 12-hour session is actually needed. If PipelineRole\'s own permissions are also required as an intermediate step for a real reason, an alternative is to have PipelineRole\'s own trust policy allow the target account\'s principal directly, restructuring which role assumes which, since there is no way to configure around the 1-hour chained-session cap itself while still going through two assumed-role hops in sequence.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Requesting a longer --duration-seconds value on a chained assume-role call overrides the 1-hour role-chaining limit.',
      reality: 'Per this subtopic\'s theory, it does not — STS silently truncates the session to 1 hour regardless of the requested duration or the target role\'s own MaxSessionDuration setting; there is no flag or configuration that raises this specific cap.'
    },
    {
      thought: 'A role\'s own MaxSessionDuration setting (up to 12 hours) always determines how long a session assuming that role can last.',
      reality: 'Per this subtopic\'s theory, MaxSessionDuration only applies at its full configured value when assumed from LONG-LIVED credentials — if the caller\'s own credentials are themselves a temporary assumed-role session (role chaining), the session is capped at 1 hour instead, overriding the target role\'s own setting.'
    },
    {
      thought: 'Every path that uses temporary credentials to call assume-role counts as role chaining and is capped at 1 hour, with no exceptions.',
      reality: 'Per this subtopic\'s theory, AWS documents one exception: assuming a role directly from an EC2 instance profile\'s own (also technically temporary) credentials is not treated as chaining, so the target role\'s full MaxSessionDuration applies normally in that specific case.'
    }
  ];
}
