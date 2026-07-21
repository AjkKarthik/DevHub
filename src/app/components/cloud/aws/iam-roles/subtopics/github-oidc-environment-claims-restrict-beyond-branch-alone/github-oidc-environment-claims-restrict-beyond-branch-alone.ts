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
  templateUrl: './github-oidc-environment-claims-restrict-beyond-branch-alone.html',
  styleUrl: './github-oidc-environment-claims-restrict-beyond-branch-alone.scss'
})
export class GithubOidcEnvironmentClaimsRestrictBeyondBranchAloneSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own GitHub OIDC example only shows the branch-based sub claim',
      points: [
        'The main page\'s own "GitHub Actions OIDC" code tab and its own Challenge both use exactly one form of the token:sub condition: "repo:MyOrg/my-repo:ref:refs/heads/main" — restricting which repo AND branch can assume the role. This is presented as the pattern, with no mention that GitHub\'s OIDC token can express other kinds of scope entirely.',
        'For a production deploy role specifically, branch-only restriction has a real limitation: ANY workflow run on that branch — including one triggered by a compromised dependency, a modified Action, or an unreviewed change that still got merged to main — can assume the role. Nothing in the main page\'s own trust policy condition adds a review gate.',
      ]
    },
    {
      heading: 'An environment-based sub claim lets GitHub\'s own environment protection rules gate the role assumption itself',
      points: [
        'Per GitHub\'s own documentation, the OIDC token\'s sub claim also supports an environment-scoped format: "repo:octo-org/octo-repo:environment:prod" — restricting which GitHub Actions ENVIRONMENT (not just which branch) is allowed to assume a given role, by referencing the environment name a job runs under.',
        'GitHub\'s own guidance recommends going further than just switching the condition\'s format: "when environments are used in workflows or in OIDC policies, we recommend adding protection rules to the environment for additional security" — specifically, "configuring deployment rules on an environment to restrict which branches and tags can deploy to the environment or access environment secrets."',
        'This means an environment-scoped trust policy condition can be backed by GitHub-side controls the main page\'s own branch-only condition has no equivalent for — required reviewers who must approve a deployment before the job (and therefore the OIDC token request) even runs, and a wait timer before deployment proceeds — turning the role-assumption boundary into an actual approval gate, not just a repo/branch string match.',
        'The two forms (branch-ref and environment) aren\'t mutually exclusive — a workflow job can be scoped to both a specific environment AND (via the environment\'s own deployment branch rules) a specific branch, layering GitHub-side environment protections on top of the same kind of trust-policy condition matching the main page\'s own example already demonstrates.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own branch-only trust policy — no review gate',
      language: 'bash',
      code: `# The main page's own exact GitHub OIDC trust policy:
cat > github-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:MyOrg/my-repo:ref:refs/heads/main"
      }
    }
  }]
}
EOF
# -- ANY workflow run triggered on main (a normal push, a merged PR,
# a scheduled run, a re-run of an old commit) can assume this role
# the moment the workflow reaches the relevant step -- there's no
# additional approval step gating the AssumeRoleWithWebIdentity
# call itself.`,
    },
    {
      label: 'Environment-scoped trust policy plus GitHub-side protection rules',
      language: 'bash',
      code: `# Same role, but scoped to a GitHub Actions ENVIRONMENT instead of
# a bare branch ref:
cat > github-env-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:MyOrg/my-repo:environment:prod"
      }
    }
  }]
}
EOF

# The workflow job must explicitly target the "prod" environment
# for its OIDC token's sub claim to match this condition at all:
# jobs:
#   deploy:
#     environment: prod
#     permissions:
#       id-token: write
#     steps:
#       - uses: aws-actions/configure-aws-credentials@v4
#         with:
#           role-to-assume: arn:aws:iam::ACCOUNT_ID:role/GitHubDeployRole
#           aws-region: eu-west-1

# On GitHub's own side, the "prod" environment is configured with
# protection rules -- per GitHub's own recommendation, this is what
# actually adds the approval gate the trust policy alone cannot:
#   Settings -> Environments -> prod -> Required reviewers: [ops-team]
#   Settings -> Environments -> prod -> Deployment branches: main only
#
# Now, a job targeting the "prod" environment PAUSES and waits for
# an ops-team member to approve BEFORE the job (and therefore the
# id-token request and AssumeRoleWithWebIdentity call) ever runs --
# a review gate the main page's own branch-only condition has no
# way to express through the trust policy alone.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security team wants production AWS deploys triggered from GitHub Actions to require a human approval step before any credentials are issued — not just a restriction to the main branch, which the main page\'s own trust policy example already provides. They ask whether this can be enforced purely through the IAM trust policy\'s own condition syntax. Using this subtopic\'s theory, is that possible, and if not, what\'s the actual mechanism that provides it?',
    hint: 'Does an IAM trust policy condition, by itself, have any way to pause or gate on a human decision — or does it only ever match static values already present in the OIDC token by the time AWS evaluates the condition?',
    solution: 'Per this subtopic\'s theory, this cannot be enforced purely through the IAM trust policy\'s own condition syntax — a trust policy condition only ever matches static claim values already present in the OIDC token by the time STS evaluates it; it has no mechanism to pause execution or wait for a human decision. The actual approval gate has to happen on GitHub\'s own side, BEFORE the workflow job (and therefore the OIDC token request) ever runs — by targeting a specific GitHub Actions environment (e.g. "prod") in the deploying job, and configuring that environment with GitHub-side protection rules, specifically required reviewers. Once configured, a job targeting that environment pauses and waits for an approver before it starts, meaning the id-token request and the resulting AssumeRoleWithWebIdentity call never happen at all until a human approves the deployment. The IAM trust policy\'s own role is then to scope the role to ONLY be assumable via that specific environment\'s OIDC sub claim (repo:org/repo:environment:prod), ensuring that even if someone tried to bypass the environment protection by targeting the role from an unprotected branch-only workflow, the trust policy itself would reject the mismatched sub claim. The security team\'s desired approval gate is a GitHub-side environment protection rule, with the IAM trust policy condition providing the second, independent enforcement layer — not something the trust policy can provide on its own.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The GitHub OIDC sub claim only supports the branch-ref format shown in the main page\'s own example (repo:org/repo:ref:refs/heads/branch-name).',
      reality: 'Per this subtopic\'s theory, GitHub\'s own documentation also supports an environment-scoped format (repo:org/repo:environment:name), restricting which GitHub Actions environment — not just which branch — can assume a role.'
    },
    {
      thought: 'Restricting an IAM trust policy\'s sub condition to a specific branch, matching the main page\'s own example, is sufficient to require human review before a production deploy role can be assumed.',
      reality: 'Per this subtopic\'s theory, a branch-ref condition alone allows ANY workflow run on that branch to assume the role — a genuine approval gate requires targeting a GitHub Actions environment with its own configured required-reviewer protection rule, which the trust policy condition cannot express by itself.'
    },
    {
      thought: 'Switching an OIDC trust policy\'s sub condition from a branch-ref format to an environment format automatically adds an approval requirement.',
      reality: 'Per this subtopic\'s theory, the environment-scoped sub claim only changes what the trust policy MATCHES — the actual approval gate comes from separately configuring required-reviewer protection rules on that environment in GitHub\'s own repository settings, which GitHub explicitly recommends as an additional step, not an automatic consequence.'
    }
  ];
}
