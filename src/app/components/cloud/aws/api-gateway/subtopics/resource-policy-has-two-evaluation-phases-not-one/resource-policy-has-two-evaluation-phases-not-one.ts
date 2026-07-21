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
  templateUrl: './resource-policy-has-two-evaluation-phases-not-one.html',
  styleUrl: './resource-policy-has-two-evaluation-phases-not-one.scss'
})
export class ResourcePolicyHasTwoEvaluationPhasesNotOneSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "evaluated before authoriser" line implies a single pass — AWS documents two',
      points: [
        'The main page\'s own theory bullet states: "Resource policy: REST API — IP whitelist/blacklist or cross-account access; evaluated before authoriser." This is true, but reads as if the resource policy is checked once, in full, before the authoriser ever runs — as if an explicit Allow would let a request skip the authoriser entirely.',
        'The main page\'s own quickRef and QnA never distinguish WHAT gets checked in that "before authoriser" pass, or what happens to the resource policy AFTER the authoriser runs.',
      ]
    },
    {
      heading: 'AWS documents two distinct evaluation phases — a deny-only gate before the authoriser, then a full combined evaluation after',
      points: [
        'Per AWS\'s own documentation: "The resource policy is evaluated in two phases. Before calling the Lambda authorizer, API Gateway first evaluates the policy and checks for any explicit denials. If found, the caller is denied access immediately. Otherwise, the Lambda authorizer is called, and it returns a policy document, which is evaluated in conjunction with the resource policy."',
        'The critical detail the main page\'s own single line obscures: the PRE-authoriser phase only ever looks for an explicit DENY. An explicit ALLOW in the resource policy does NOT let a request skip the authoriser — the authoriser still runs (and is still invoked, still billed) for any request that isn\'t explicitly denied by the resource policy\'s first pass.',
        'AWS\'s own worked example (a resource policy denying everything except one VPC endpoint) confirms this is a real, deliberate optimization for the DENY case specifically: "During the \'pre-auth\' evaluation, only the calls coming from the VPC endpoint indicated in the example are allowed to move forward and evaluate the Lambda authorizer. All remaining calls are blocked" — before the authoriser Lambda is ever invoked.',
        'AWS\'s own Table A (same AWS account) spells out exactly how the SECOND phase combines the authoriser\'s decision with the resource policy: Allow+Allow → Allow; Allow+Neither → Allow; Allow+Deny → Explicit Deny; Neither+Allow → Allow; Neither+Neither → Implicit Deny; Neither+Deny → Explicit Deny; Deny+Allow → Explicit Deny; Deny+Neither → Explicit Deny; Deny+Deny → Explicit Deny. A Deny from EITHER side always wins in this second phase — it is not "whichever evaluated last."',
        'Cross-account access (Table B) is stricter still: AWS states "cross-account access requires that both the resource policy and the IAM policy or Amazon Cognito user pools authorizer explicitly grant access" — an explicit Allow on one side plus silence ("neither") on the other, which would succeed in the same-account case, results in an Implicit Deny across accounts.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Phase 1 — the pre-auth gate only screens for explicit denials',
      language: 'bash',
      code: `# AWS's own documented example: a resource policy that denies
# everything EXCEPT calls from one specific VPC endpoint:
# {
#   "Effect": "Deny",
#   "Principal": "*",
#   "Action": "execute-api:Invoke",
#   "Resource": ["arn:aws:execute-api:us-east-1:111111111111:api-id/"],
#   "Condition": {
#     "StringNotEquals": { "aws:SourceVpce": "vpce-1a2b3c4d" }
#   }
# }
aws apigateway update-rest-api \\
  --rest-api-id xyz789 \\
  --patch-operations op=replace,path=/policy,value='<policy-above>'

# A call from OUTSIDE vpce-1a2b3c4d -- per AWS's own docs, this is
# blocked in the PRE-AUTH phase, before the Lambda authoriser is
# ever invoked:
curl https://xyz789.execute-api.us-east-1.amazonaws.com/prod/users
# 403 Forbidden

# Confirm the authoriser Lambda was NEVER called for this request --
# CloudWatch Logs for the authoriser function show zero invocations
# correlating with this request's timestamp/RequestID:
aws logs filter-log-events \\
  --log-group-name /aws/lambda/my-auth \\
  --start-time <request-timestamp-ms> \\
  --filter-pattern "<request-id>"
# (empty result) -- the explicit deny short-circuited before the
# authoriser was ever reached, exactly as AWS's own docs describe.`,
    },
    {
      label: 'Phase 2 — an Allow in the resource policy does NOT bypass the authoriser',
      language: 'bash',
      code: `# Now the OPPOSITE case: a resource policy that explicitly ALLOWS a
# specific IP range, combined with a Lambda authoriser that DENIES:
# {
#   "Effect": "Allow",
#   "Principal": "*",
#   "Action": "execute-api:Invoke",
#   "Resource": "arn:aws:execute-api:us-east-1:111111111111:api-id/",
#   "Condition": { "IpAddress": { "aws:SourceIp": ["192.0.2.0/24"] } }
# }

# A call from within 192.0.2.0/24 -- per AWS's own docs, the pre-auth
# phase only screens for DENIALS, so this Allow does NOT skip the
# authoriser -- the Lambda authoriser IS still invoked:
curl -H "Authorization: some-token" https://xyz789.execute-api.us-east-1.amazonaws.com/prod/users
aws logs filter-log-events \\
  --log-group-name /aws/lambda/my-auth \\
  --start-time <request-timestamp-ms>
# -- shows a real invocation, confirming the resource-policy Allow
# never bypassed the authoriser.

# If the authoriser Lambda returns a Deny for this caller, the FINAL
# result -- per AWS's own Table A (Deny + Allow -> Explicit Deny) --
# is still a 403, even though the resource policy itself said Allow:
# 403 Forbidden -- the authoriser's Deny wins over the resource
# policy's Allow in the second, combined evaluation phase.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants to reduce their Lambda authoriser\'s invocation count (and cost) for requests coming from their own known, trusted office IP range. Following the main page\'s own "evaluated before authoriser" framing, they add an explicit Allow to the resource policy for that IP range, expecting those requests to now skip the authoriser Lambda entirely. After deploying, they check CloudWatch metrics and find the authoriser\'s invocation count is completely unchanged. Using this subtopic\'s theory, explain why, and describe what WOULD actually reduce authoriser invocations for a specific set of callers.',
    hint: 'The main page\'s own line says the resource policy is "evaluated before authoriser" — but per AWS\'s own two-phase documentation, what specifically does that FIRST phase check for?',
    solution: 'Per this subtopic\'s theory, the team\'s expectation doesn\'t match AWS\'s own documented behavior: the pre-authoriser phase of resource policy evaluation only ever screens for explicit DENIALS — "API Gateway first evaluates the policy and checks for any explicit denials. If found, the caller is denied access immediately." An explicit Allow does not appear anywhere in that first phase\'s logic; it only becomes relevant in the SECOND phase, which runs after the authoriser Lambda has already been invoked and combines both decisions per AWS\'s own Table A. This is exactly why the authoriser\'s invocation count didn\'t change — the resource-policy Allow never had any chance to bypass anything, since only a Deny short-circuits before the authoriser runs. If the team genuinely wants specific trusted callers to skip the authoriser Lambda entirely (saving its invocation cost), the correct approach is the OPPOSITE structure — a resource policy that explicitly DENIES everyone except the trusted range would let ONLY those denied-by-default callers be blocked before reaching the authoriser; alternatively, and more directly for the team\'s actual goal, they should implement the "skip the authoriser for trusted callers" logic INSIDE the authoriser Lambda itself (an early return for known-trusted IPs, still counted as an invocation but cheap and fast) or accept that the pre-auth phase\'s design is specifically for blocking untrusted traffic cheaply, not for exempting trusted traffic from the authoriser.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An explicit Allow in a resource policy skips the Lambda authoriser entirely, the same way an explicit Deny does.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states the pre-authoriser phase only ever screens for explicit denials — an Allow has no effect in that first phase and never bypasses the authoriser; it only factors in during the second, combined evaluation phase that runs afterward.'
    },
    {
      thought: 'The resource policy is evaluated exactly once — either fully before the authoriser or fully after, not both.',
      reality: 'Per this subtopic\'s theory, AWS explicitly documents two separate phases: a deny-only pre-auth gate, and a full evaluation combined with the authoriser\'s own policy output afterward, governed by a documented combination table.'
    },
    {
      thought: 'When a same-account resource policy and Lambda authoriser disagree, whichever one is evaluated LAST (the authoriser) always wins the final decision.',
      reality: 'Per this subtopic\'s theory, AWS\'s own Table A shows a Deny from EITHER side always produces an Explicit Deny — it is not about evaluation order, it is that Deny outranks Allow and Neither from both directions in the combined phase.'
    }
  ];
}
