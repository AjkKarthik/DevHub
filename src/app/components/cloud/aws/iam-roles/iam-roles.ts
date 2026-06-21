import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-aws-iam-roles',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './iam-roles.html',
  styleUrl: './iam-roles.scss'
})
export class AwsIamRoles {

  quickRef: QuickRefItem[] = [
    { name: 'AssumeRole', type: 'method', desc: 'STS API to temporarily assume an IAM role — returns temporary credentials (15 min–12 h).' },
    { name: 'Trust Policy', type: 'syntax', desc: 'JSON policy on the role specifying WHO can assume it (Principal + sts:AssumeRole).' },
    { name: 'OIDC Provider', type: 'token', desc: 'Federated identity source (GitHub, Google, Cognito) registered in IAM — enables keyless auth.' },
    { name: 'IRSA', type: 'keyword', desc: 'IAM Roles for Service Accounts — attaches IAM role to a Kubernetes ServiceAccount via OIDC.' },
    { name: 'IAM Identity Center', type: 'class', desc: 'Centralised SSO for AWS accounts and SAML 2.0 apps — successor to AWS SSO.' },
    { name: 'STS', type: 'class', desc: 'Security Token Service — issues time-limited credentials via AssumeRole, AssumeRoleWithWebIdentity, GetFederationToken.' },
    { name: 'External ID', type: 'keyword', desc: 'Confused-deputy protection — third-party must pass a shared secret when assuming your role.' },
    { name: 'Session Tags', type: 'keyword', desc: 'Key-value pairs passed during AssumeRole — usable in ABAC conditions in the assumed role.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'IAM Role Anatomy',
      points: [
        'An IAM role has two JSON policies: a Trust Policy (who can assume it) and one or more Permission Policies (what they can do once they assume it).',
        'Trust policy Principal can be: an AWS account, a specific IAM user/role, an AWS service (e.g. "Service": "lambda.amazonaws.com"), or a federated web identity.',
        'When a principal assumes a role, STS returns three values: AccessKeyId, SecretAccessKey, and a SessionToken — all expire together.',
        'Duration is configurable: default 1 hour, minimum 15 minutes, maximum 12 hours (or up to 36 h with AssumeRoleWithSAML on some roles).',
        'Session name (RoleSessionName) is logged in CloudTrail — use a meaningful value like the GitHub PR number or user email for auditability.',
      ]
    },
    {
      heading: 'Cross-Account Roles',
      points: [
        'Account A (trusting) creates a role whose trust policy lists Account B as the principal. Account B users/roles can then call sts:AssumeRole.',
        'The caller still needs an identity-based permission (Allow sts:AssumeRole on that role ARN) on their side — both sides must permit the handshake.',
        'External ID prevents confused-deputy attacks: when a third-party SaaS assumes your role it must pass a secret ExternalId you both agreed on.',
        'For organisation-wide access you can use aws:PrincipalOrgID condition — only principals from your AWS Organisation can assume the role.',
        'Cross-account role chaining is limited: you cannot chain more than 5 hops, and each hop resets the maximum session duration to 1 hour.',
      ]
    },
    {
      heading: 'Web Identity Federation & OIDC',
      points: [
        'OIDC federation allows non-AWS principals (GitHub Actions, Google, Cognito users) to exchange a JWT for temporary AWS credentials — no long-lived access keys needed.',
        'Steps: (1) create IAM OIDC provider with the IdP URL + audience; (2) create role with trust policy allowing sts:AssumeRoleWithWebIdentity from that provider; (3) code exchanges JWT at STS.',
        'GitHub Actions: set permissions: id-token: write in the workflow; use aws-actions/configure-aws-credentials with role-to-assume — eliminates all AWS secrets from GitHub.',
        'Condition keys for OIDC: token:sub (e.g. repo:org/repo:ref:refs/heads/main) let you restrict which repo branches can assume the role.',
        'Cognito Identity Pools use web identity federation internally — the pool authenticates the user with a provider then vends temporary AWS credentials.',
      ]
    },
    {
      heading: 'IRSA — IAM Roles for Service Accounts',
      points: [
        'Kubernetes pods on EKS need AWS permissions (S3, DynamoDB, etc.) without baking access keys into the pod spec.',
        'IRSA flow: EKS exposes an OIDC endpoint; IAM trusts that endpoint; a ServiceAccount is annotated with the role ARN; the pod receives a projected token that STS exchanges for credentials.',
        'Trust policy condition: "StringEquals": { "oidc.eks.<region>.amazonaws.com/id/<id>:sub": "system:serviceaccount:<namespace>:<service-account>" }',
        'Each microservice gets its own role with scoped permissions — this is the correct least-privilege pattern for EKS workloads.',
        'EKS Pod Identity (newer) simplifies IRSA by removing the OIDC URL from the trust policy — managed by EKS associations instead.',
      ]
    },
    {
      heading: 'IAM Identity Center (SSO)',
      points: [
        'Single pane for managing human access to multiple AWS accounts and SAML 2.0 business applications — replaces the old AWS SSO console.',
        'Permission Sets are IAM policy bundles that get applied as roles in target accounts. A user is assigned a Permission Set + Account combination.',
        'Works with external IdPs (Azure AD, Okta, Google Workspace) via SAML 2.0 or SCIM for user/group provisioning.',
        'AWS CLI SSO profile: aws configure sso — opens browser, picks role, caches credentials. aws sso login refreshes the session.',
        'Centralised access logs: all console sign-ins and assumed-role events flow to CloudTrail in the management account — one place to audit all human access.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Cross-Account AssumeRole',
      language: 'bash',
      code: `# --- Account A (trusting): create the role ---
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::123456789012:root" },
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": { "sts:ExternalId": "my-secret-external-id" }
    }
  }]
}
EOF

aws iam create-role \\
  --role-name CrossAccountReadRole \\
  --assume-role-policy-document file://trust-policy.json

aws iam attach-role-policy \\
  --role-name CrossAccountReadRole \\
  --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess

# --- Account B (trusted): assume the role ---
CREDS=$(aws sts assume-role \\
  --role-arn "arn:aws:iam::ACCOUNT_A_ID:role/CrossAccountReadRole" \\
  --role-session-name "CrossAccountSession" \\
  --external-id "my-secret-external-id" \\
  --query 'Credentials' --output json)

export AWS_ACCESS_KEY_ID=$(echo $CREDS | jq -r '.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo $CREDS | jq -r '.SecretAccessKey')
export AWS_SESSION_TOKEN=$(echo $CREDS | jq -r '.SessionToken')

aws s3 ls  # now running in Account A context`,
    },
    {
      label: 'GitHub Actions OIDC',
      language: 'bash',
      code: `# 1. Register GitHub as OIDC provider in AWS
aws iam create-open-id-connect-provider \\
  --url https://token.actions.githubusercontent.com \\
  --client-id-list "sts.amazonaws.com" \\
  --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1"

# 2. Trust policy — only main branch of specific repo
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

aws iam create-role --role-name GitHubDeployRole \\
  --assume-role-policy-document file://github-trust.json

# 3. GitHub Actions workflow snippet (no AWS secrets needed!)
# permissions:
#   id-token: write     # required for OIDC token
#   contents: read
# steps:
#   - uses: aws-actions/configure-aws-credentials@v4
#     with:
#       role-to-assume: arn:aws:iam::ACCOUNT_ID:role/GitHubDeployRole
#       aws-region: eu-west-1`,
    },
    {
      label: 'IRSA (EKS)',
      language: 'bash',
      code: `# 1. Get OIDC issuer for the cluster
OIDC=$(aws eks describe-cluster --name my-cluster \\
  --query "cluster.identity.oidc.issuer" --output text | sed 's|https://||')

# 2. Register OIDC provider with IAM
aws iam create-open-id-connect-provider \\
  --url "https://$OIDC" \\
  --client-id-list "sts.amazonaws.com"

# 3. Trust policy scoped to a specific ServiceAccount
cat > irsa-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/OIDC_ISSUER"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "OIDC_ISSUER:sub": "system:serviceaccount:my-namespace:my-service-account",
        "OIDC_ISSUER:aud": "sts.amazonaws.com"
      }
    }
  }]
}
EOF

aws iam create-role --role-name EksPodS3Role \\
  --assume-role-policy-document file://irsa-trust.json
aws iam attach-role-policy --role-name EksPodS3Role \\
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# 4. Annotate the Kubernetes ServiceAccount
kubectl annotate serviceaccount my-service-account \\
  -n my-namespace \\
  eks.amazonaws.com/role-arn=arn:aws:iam::ACCOUNT_ID:role/EksPodS3Role`,
    },
    {
      label: 'IAM Identity Center CLI',
      language: 'bash',
      code: `# Configure SSO profile
aws configure sso
# SSO session name: my-sso
# SSO start URL: https://my-org.awsapps.com/start
# SSO region: eu-west-1
# (browser opens — pick account + role)
# CLI profile name: dev-readonly

# Login / refresh credentials
aws sso login --profile dev-readonly

# Use the SSO profile
aws s3 ls --profile dev-readonly
AWS_PROFILE=dev-readonly aws ec2 describe-instances

# Logout / invalidate all cached SSO sessions
aws sso logout`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Missing trust policy permission in the caller\'s account',
      wrong: `# Role trust policy created in Account A.
# But the Account B user has no policy allowing sts:AssumeRole.
# Error: User is not authorized to perform: sts:AssumeRole`,
      right: `# Add to the caller's identity policy in Account B:
{
  "Effect": "Allow",
  "Action": "sts:AssumeRole",
  "Resource": "arn:aws:iam::ACCOUNT_A_ID:role/CrossAccountReadRole"
}`,
      explanation: 'Both sides must allow the action: the role trust policy grants the right to be assumed, and the caller identity policy grants the right to call sts:AssumeRole on that ARN.'
    },
    {
      title: 'IRSA trust policy using wrong OIDC subject format',
      wrong: `"StringEquals": {
  "oidc.eks.region.amazonaws.com/id/ID:sub": "my-service-account"
}`,
      right: `"StringEquals": {
  "oidc.eks.region.amazonaws.com/id/ID:sub":
    "system:serviceaccount:my-namespace:my-service-account"
}`,
      explanation: 'The Kubernetes OIDC subject is always system:serviceaccount:<namespace>:<service-account-name>. A bare name never matches.'
    },
    {
      title: 'GitHub Actions OIDC missing id-token: write permission',
      wrong: `permissions:
  contents: read
# Error: unable to get OIDC token`,
      right: `permissions:
  id-token: write   # required for OIDC token generation
  contents: read`,
      explanation: 'GitHub only issues an OIDC JWT when the workflow explicitly grants id-token: write. Without it, aws-actions/configure-aws-credentials cannot exchange a token for AWS credentials.'
    },
    {
      title: 'Role session duration exceeds MaxSessionDuration',
      wrong: `aws sts assume-role \\
  --role-arn arn:aws:iam::123:role/MyRole \\
  --duration-seconds 43200
# Error: DurationSeconds exceeds the MaxSessionDuration set for this role`,
      right: `# First raise MaxSessionDuration on the role
aws iam update-role --role-name MyRole --max-session-duration 43200
# Then assume with the longer duration`,
      explanation: 'Every role has a MaxSessionDuration ceiling (default 3600 s). You must raise it on the role before requesting a longer session — the caller cannot override the ceiling.'
    },
    {
      title: 'Role chaining unexpectedly caps session at 1 hour',
      wrong: `# Role A has MaxSessionDuration 12 h, assumed for 12 h.
# Then assume Role B from that session.
# Expected: 12 h remaining — Actual: 1 h max`,
      right: `# Avoid chaining when long sessions are needed.
# Each chaining hop resets the effective max duration to 1 hour.
# Use a direct role with correct permissions instead.`,
      explanation: 'Assuming a role from within an already-assumed role session (chaining) always caps the result at 1 hour. This surprises teams with long-running CI pipelines that chain roles.'
    },
  ];

  challenge: Challenge = {
    title: 'GitHub Actions OIDC Role with Branch Restriction',
    language: 'typescript',
    description: `Write the trust policy and permission policy JSON for an IAM role that GitHub Actions can assume via OIDC — but ONLY from the 'main' branch of 'my-org/my-repo'. The role must allow s3:ListBucket and s3:GetObject on bucket 'my-deploy-bucket'.`,
    hints: [
      'The trust Principal is the OIDC provider ARN, not an IAM user.',
      'Use token.actions.githubusercontent.com:sub with the full repo:org/repo:ref:refs/heads/main value.',
      'The audience (aud) condition must equal sts.amazonaws.com.',
      's3:ListBucket applies to the bucket ARN; s3:GetObject applies to the bucket/* ARN.',
    ],
    starterCode: `const ACCOUNT_ID = "123456789012";
const BUCKET = "my-deploy-bucket";

const trustPolicy = {
  Version: "2012-10-17",
  Statement: [{
    Effect: "Allow",
    Principal: { Federated: "TODO: OIDC provider ARN" },
    Action: "sts:AssumeRoleWithWebIdentity",
    Condition: {
      StringEquals: {
        // TODO: aud condition
        // TODO: sub condition for main branch only
      }
    }
  }]
};

const permissionPolicy = {
  Version: "2012-10-17",
  Statement: [
    // TODO: s3:ListBucket on the bucket
    // TODO: s3:GetObject on the bucket contents
  ]
};

console.log(JSON.stringify(trustPolicy, null, 2));
console.log(JSON.stringify(permissionPolicy, null, 2));`,
    solution: `const ACCOUNT_ID = "123456789012";
const BUCKET = "my-deploy-bucket";
const OIDC = \`arn:aws:iam::\${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com\`;

const trustPolicy = {
  Version: "2012-10-17",
  Statement: [{
    Effect: "Allow",
    Principal: { Federated: OIDC },
    Action: "sts:AssumeRoleWithWebIdentity",
    Condition: {
      StringEquals: {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:ref:refs/heads/main"
      }
    }
  }]
};

const permissionPolicy = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: "s3:ListBucket",
      Resource: \`arn:aws:s3:::\${BUCKET}\`
    },
    {
      Effect: "Allow",
      Action: "s3:GetObject",
      Resource: \`arn:aws:s3:::\${BUCKET}/*\`
    }
  ]
};

console.log(JSON.stringify(trustPolicy, null, 2));
console.log(JSON.stringify(permissionPolicy, null, 2));`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which STS action is used when an OIDC identity provider issues a JWT?',
      options: ['AssumeRole', 'AssumeRoleWithSAML', 'AssumeRoleWithWebIdentity', 'GetFederationToken'],
      answer: 2,
      explanation: 'AssumeRoleWithWebIdentity handles OIDC JWTs (GitHub, Cognito, Google). AssumeRole is for AWS principal-to-principal; AssumeRoleWithSAML is for enterprise SAML 2.0 IdPs.'
    },
    {
      q: 'What is the purpose of External ID in a cross-account trust policy?',
      options: [
        'Increases the session duration',
        'Prevents confused-deputy attacks by requiring a shared secret',
        'Enforces MFA for the assumed role',
        'Tags the session with the caller account ID'
      ],
      answer: 1,
      explanation: 'External ID is a shared secret both parties agree on. Without it, any principal with sts:AssumeRole permission could be tricked into granting another party access to your role.'
    },
    {
      q: 'What is the maximum session duration for an IAM role?',
      options: ['1 hour', '4 hours', '12 hours', '24 hours'],
      answer: 2,
      explanation: '12 hours (43200 seconds) is the maximum IAM role session duration. The default is 1 hour, minimum is 15 minutes. The role\'s MaxSessionDuration must be set accordingly.'
    },
    {
      q: 'An EKS pod needs to write to S3. What is AWS best practice?',
      options: [
        'Store access keys in a Kubernetes Secret',
        'Pass access key as an environment variable in the Deployment',
        'Use IRSA — annotate the ServiceAccount with the role ARN',
        'Mount ~/.aws/credentials from the host node'
      ],
      answer: 2,
      explanation: 'IRSA (IAM Roles for Service Accounts) is AWS best practice: no long-lived credentials, scoped per ServiceAccount, automatically rotated via projected tokens, and auditable via CloudTrail.'
    },
    {
      q: 'You assume Role A (12 h max) for 10 hours, then assume Role B from that session. How long can Role B last?',
      options: ['10 hours remaining', '12 hours (Role B max)', '1 hour (chaining cap)', '15 minutes'],
      answer: 2,
      explanation: 'Role chaining always caps the resulting session at 1 hour — a hard AWS limit. Plan your architecture to avoid role chaining when long sessions are required.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does GitHub Actions authenticate to AWS without storing access keys?',
      a: 'GitHub acts as an OIDC identity provider. The workflow requests a signed JWT from GitHub (requires id-token: write permission), then exchanges it at AWS STS via AssumeRoleWithWebIdentity for temporary credentials. The IAM role trust policy restricts which repos and branches can perform this exchange using the token:sub condition key.'
    },
    {
      q: 'What is the difference between IAM Identity Center Permission Sets and IAM roles?',
      a: 'Permission Sets are the Identity Center concept — policy bundles that get materialised as IAM roles in target accounts when assigned to a user. These roles are named AWSReservedSSO_* and are managed by Identity Center automatically. You manage access via Identity Center assignments, not by manually creating or editing the IAM roles.'
    },
    {
      q: 'When should I use IRSA vs. EKS Pod Identity?',
      a: 'Both give pods scoped IAM credentials. IRSA requires an OIDC provider registration in IAM and a ServiceAccount annotation. EKS Pod Identity (2023) simplifies this — no IAM OIDC provider registration needed; associations are managed on the EKS cluster side. For new clusters, Pod Identity is simpler. For existing IRSA setups, migration is optional but beneficial long-term.'
    },
    {
      q: 'What happens if the trust policy allows AssumeRole but the caller has no identity policy allowing it?',
      a: 'The call fails with "is not authorized to perform: sts:AssumeRole". IAM requires both sides: the target role trust policy must grant sts:AssumeRole to the caller, AND the caller must have an identity-based policy allowing sts:AssumeRole on that role ARN. Missing either half blocks the request.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'IAM roles enable temporary, scoped access via STS — trust policies control who can assume, OIDC federation eliminates long-lived keys for CI/CD and Kubernetes workloads.',
    mustKnow: [
      'Role = Trust Policy (who assumes) + Permission Policies (what they can do)',
      'AssumeRole requires both the trust policy AND the caller identity policy to allow it',
      'OIDC: register IdP in IAM → trust with token conditions → AssumeRoleWithWebIdentity',
      'GitHub Actions: id-token: write + aws-actions/configure-aws-credentials = keyless auth',
      'IRSA: EKS OIDC → role trust scoped to system:serviceaccount:ns:sa → annotate ServiceAccount',
      'Role chaining caps session at 1 hour regardless of MaxSessionDuration',
      'External ID prevents confused-deputy in cross-account scenarios with third parties',
    ],
    interviewFocus: [
      'Two-sided handshake of cross-account AssumeRole (trust policy + caller permission)',
      'OIDC federation flow and why it eliminates long-lived access keys in GitHub Actions',
      'IRSA architecture: OIDC endpoint → projected token → STS → pod credentials',
      'IAM Identity Center vs IAM roles for human users across multiple AWS accounts',
      'Role chaining 1-hour cap and when it matters in production',
    ],
  };
}
