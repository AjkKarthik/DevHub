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
  templateUrl: './the-oidc-sub-claim-differs-between-push-and-pull-request.html',
  styleUrl: './the-oidc-sub-claim-differs-between-push-and-pull-request.scss'
})
export class TheOidcSubClaimDiffersBetweenPushAndPullRequestSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows OIDC as a clean upgrade over static keys, without covering the trust-policy detail that actually secures it',
      points: [
        'The main page\'s theory correctly frames OIDC as removing the need for stored AWS keys: "OIDC lets GitHub Actions assume an IAM role without storing AWS_SECRET_ACCESS_KEY in CI." True — but the security of that role assumption depends entirely on how the IAM role\'s TRUST POLICY is written, a detail the main page never shows.',
      ]
    },
    {
      heading: 'The token\'s sub (subject) claim is what the trust policy actually restricts on — and its shape depends on the triggering event',
      points: [
        'Every OIDC token GitHub Actions presents carries a <code>sub</code> claim identifying which repository and which context the workflow ran in — but the EXACT VALUE of that claim differs by the event that triggered the workflow. A push to <code>main</code> produces something like <code>repo:org/repo:ref:refs/heads/main</code>; a <code>pull_request</code> event does not carry that same branch-ref shape at all.',
        'AWS\'s own guidance is explicit that a trust policy should evaluate the <code>token.actions.githubusercontent.com:sub</code> condition key specifically, and scope it as narrowly as the workflow actually needs — restricting by exact repository name (never a wildcard), and by exact ref (<code>ref:refs/heads/main</code>) when a workflow is only ever meant to apply from the main branch.',
      ]
    },
    {
      heading: 'The risk this closes: a trust policy scoped only to the repository, not the event or ref',
      points: [
        'A trust policy that only checks the repository name (with no ref or event restriction) grants the SAME role-assumption ability to every workflow run in that repo — including runs triggered by a pull request from a fork, which GitHub treats as a fundamentally different trust boundary than a push to a protected branch.',
        'This is exactly why <code>deny_pull_request</code>-style conditions (or an equivalent explicit <code>sub</code> restriction to the exact ref a workflow is meant to run from) matter in practice: without one, a role intended only for the "apply on merge to main" job (the main page\'s own stated pattern) can potentially be assumed by a plan-only job running against an untrusted PR, unless the trust policy itself draws that line.',
        'The practical takeaway is that OIDC removes the STORED-CREDENTIAL risk the main page focuses on, but it introduces a DIFFERENT risk surface — an under-scoped trust policy — that requires its own deliberate configuration, not something OIDC provides automatically just by being used.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'An under-scoped trust policy',
      language: 'bash',
      code: `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
      }
      # NO restriction on the "sub" claim at all -- this role
      # can be assumed by ANY workflow run in ANY repository
      # trusted by this OIDC provider, from ANY event type,
      # including a pull_request run from a fork.
    }
  }]
}`,
    },
    {
      label: 'Scoped correctly: repository, ref, and event',
      language: 'bash',
      code: `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        # Exact repository -- never a wildcard:
        "token.actions.githubusercontent.com:sub": "repo:my-org/my-infra-repo:ref:refs/heads/main"
        # This sub shape only matches a PUSH to main -- matching
        # the main page's own "apply only on push to main" rule.
        # A pull_request run produces a DIFFERENT sub shape and
        # will NOT match this condition -- correctly denied.
      }
    }
  }]
}

# For a SEPARATE, more limited plan-only role used on PRs,
# scope it to the pull_request shape instead, with a role
# that only has read/plan permissions, never apply:
# "token.actions.githubusercontent.com:sub":
#   "repo:my-org/my-infra-repo:pull_request"`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own OIDC pattern, a team configures aws-actions/configure-aws-credentials with role-to-assume, removing all static AWS keys from CI. The IAM role\'s trust policy checks only the audience claim and the repository name, with no restriction on the sub claim\'s ref or event shape. A security review flags this as still risky, even though no credentials are stored anywhere. What specifically can this trust policy not distinguish between, and what condition closes the gap?',
    hint: 'The sub claim\'s exact shape differs depending on what triggered the workflow — a push to a specific branch versus a pull_request. Does a repository-only condition tell those apart?',
    solution: 'A trust policy restricted only by repository name cannot distinguish between a push to the protected main branch and a pull_request run — including one triggered from a fork, which GitHub treats as a fundamentally different trust boundary. Both produce valid OIDC tokens from the same repository, just with different sub claim shapes (repo:org/repo:ref:refs/heads/main for a push, a different shape for pull_request), and a condition that never checks sub at all lets either through equally. The fix is adding a StringEquals condition on token.actions.githubusercontent.com:sub scoped to the exact ref the apply role is meant to run from (repo:org/repo:ref:refs/heads/main), matching the main page\'s own "apply only on push to main" rule — a pull_request-triggered token simply will not match that condition and is correctly denied. A separate, more narrowly-permissioned role (read/plan only, never apply) can use a pull_request-shaped sub condition for the PR-triggered plan job specifically.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Switching from static AWS keys to OIDC role assumption automatically secures a CI pipeline, since there are no long-lived credentials left to leak.',
      reality: 'Per this subtopic\'s theory, OIDC removes the stored-credential risk but introduces a different one — an under-scoped IAM trust policy can still let unintended workflow runs (like a pull_request from a fork) assume the same role a push-to-main job was meant to use exclusively.'
    },
    {
      thought: 'Restricting an OIDC trust policy to a specific GitHub repository is sufficient scoping, since that already limits which codebase can assume the role.',
      reality: 'Per this subtopic\'s theory, a repository-only restriction does not distinguish between different triggering events (push vs. pull_request) or different refs within that same repository — the sub claim\'s exact shape varies by both, and the trust policy needs to check it specifically to draw that line.'
    },
    {
      thought: 'The sub claim in a GitHub Actions OIDC token always has the same shape regardless of what event triggered the workflow, so any restriction on it is equally simple to write for push and pull_request workflows.',
      reality: 'Per this subtopic\'s theory, the sub claim\'s shape genuinely differs between event types — a push carries a ref:refs/heads/... segment while a pull_request does not follow that same shape — so a trust policy condition written for one does not automatically cover the other.'
    }
  ];
}
