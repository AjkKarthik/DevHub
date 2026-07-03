import { Component } from '@angular/core';
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
  selector: 'app-aws-iam',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './iam.html',
  styleUrl: './iam.scss'
})
export class AwsIam {
  quickRef: QuickRefItem[] = [
    { name: 'IAM User', type: 'keyword', desc: 'Long-term identity with access key/secret — use sparingly, prefer roles' },
    { name: 'IAM Role', type: 'keyword', desc: 'Temporary identity assumed by services, users, or CI/CD pipelines' },
    { name: 'IAM Policy', type: 'keyword', desc: 'JSON document: Effect+Action+Resource+Condition defining permissions' },
    { name: 'Permission Boundary', type: 'keyword', desc: 'Maximum permissions cap on a role/user — cannot grant above boundary' },
    { name: 'SCP', type: 'keyword', desc: 'Service Control Policy — restricts max permissions across an entire OU/account in AWS Organizations' },
    { name: 'AssumeRole', type: 'method', desc: 'STS operation to obtain temporary credentials for a role' },
    { name: 'Inline Policy', type: 'keyword', desc: 'Policy embedded in a single user/role — cannot be reused; prefer managed policies' },
    { name: 'aws:PrincipalTag', type: 'keyword', desc: 'ABAC condition key — grant access based on IAM principal tags' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'IAM Identities — Users, Groups, and Roles',
      points: [
        'IAM Users have long-term credentials (access key + secret). Use only when a system cannot use roles (some older CI/CD tools).',
        'IAM Groups are collections of users — attach policies to the group, not individual users, for easier management.',
        'IAM Roles have NO long-term credentials — they issue temporary STS tokens (1h default, up to 12h). Always prefer roles over users.',
        'Principals that can assume roles: AWS services (EC2, Lambda), other AWS accounts (cross-account), OIDC/SAML federated users, and IAM users.',
        'Root account has unrestricted access — enable MFA, delete access keys, and treat it like a break-glass credential.',
      ]
    },
    {
      heading: 'IAM Policy Structure',
      points: [
        'Every IAM policy is a JSON document with Statement array. Each statement has: Effect (Allow/Deny), Action, Resource, and optional Condition.',
        'Policy evaluation: explicit Deny always wins → then check all Allow statements → default implicit Deny.',
        'AWS Managed Policies are maintained by AWS (e.g. AmazonS3ReadOnlyAccess). Customer Managed Policies you create and version. Inline Policies are embedded.',
        'Resource ARN wildcards: arn:aws:s3:::my-bucket/* grants actions on all objects; arn:aws:s3:::my-bucket grants actions on the bucket itself.',
        'Principal in resource-based policies (S3 bucket policy, SQS queue policy) — these work alongside IAM policies.',
      ]
    },
    {
      heading: 'Policy Evaluation Logic',
      points: [
        'IAM evaluation order: (1) explicit Deny in any policy → DENIED; (2) explicit Allow in identity + resource policy → ALLOWED (cross-account requires both); (3) implicit Deny.',
        'Across accounts: BOTH the caller\'s IAM policy AND the resource\'s resource-based policy must allow the action.',
        'Within same account: EITHER the IAM policy OR the resource-based policy can allow the action (union).',
        'Permission Boundaries set the maximum allowed permissions — a policy granting s3:* with a boundary allowing only s3:GetObject results in only s3:GetObject.',
        'Session Policies (passed at AssumeRole) can further restrict but never grant more than the role allows.',
      ]
    },
    {
      heading: 'Permission Boundaries & SCPs',
      points: [
        'Permission Boundary is attached to an IAM user or role to cap their maximum permissions regardless of what policies are attached.',
        'Use case: allow a developer to create IAM roles but limit those roles to only the developer\'s own service — prevents privilege escalation.',
        'Service Control Policies (SCPs) in AWS Organizations restrict what actions accounts or OUs can ever perform, even if IAM allows it.',
        'SCPs do NOT grant permissions — they set guardrails. The combination of SCP + IAM policy determines effective permissions.',
        'SCPs apply to all principals in the account, including root — except the management account itself.',
      ]
    },
    {
      heading: 'ABAC — Attribute-Based Access Control',
      points: [
        'ABAC uses IAM tags on both the principal (role/user) and resource to make dynamic access decisions.',
        'Example: allow engineers to only start/stop EC2 instances tagged with the same team as their IAM principal tag.',
        'ABAC scales better than RBAC for large teams — add new resources with correct tags instead of updating policies.',
        'Condition key aws:PrincipalTag/<tag-key> refers to a tag on the calling IAM principal.',
        'aws:ResourceTag/<tag-key> refers to a tag on the target resource — both must match for access.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Policy JSON',
      language: 'bash',
      code: `# Least-privilege S3 policy — read only from a specific bucket/prefix
cat << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadProjectFiles",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::my-bucket",
        "arn:aws:s3:::my-bucket/uploads/*"
      ]
    },
    {
      "Sid": "DenyDelete",
      "Effect": "Deny",
      "Action": "s3:DeleteObject",
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
EOF

# Permission Boundary example — developer can create roles but only for their service
cat << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "iam:CreateRole",
      "Resource": "arn:aws:iam::*:role/myservice-*"
    },
    {
      "Effect": "Allow",
      "Action": "iam:AttachRolePolicy",
      "Resource": "arn:aws:iam::*:role/myservice-*",
      "Condition": {
        "ArnEquals": {
          "iam:PolicyARN": "arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess"
        }
      }
    }
  ]
}
EOF`,
    },
    {
      label: 'Roles & AssumeRole',
      language: 'bash',
      code: `# Create a role with a trust policy (who can assume it)
aws iam create-role \\
  --role-name MyLambdaRole \\
  --assume-role-policy-document '{
    "Version":"2012-10-17",
    "Statement":[{
      "Effect":"Allow",
      "Principal":{"Service":"lambda.amazonaws.com"},
      "Action":"sts:AssumeRole"
    }]
  }'

# Attach a managed policy to the role
aws iam attach-role-policy \\
  --role-name MyLambdaRole \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Assume a role manually (cross-account)
CREDS=$(aws sts assume-role \\
  --role-arn arn:aws:iam::ACCOUNT_ID:role/CrossAccountRole \\
  --role-session-name deploy-session \\
  --query 'Credentials' --output json)

export AWS_ACCESS_KEY_ID=$(echo $CREDS | jq -r '.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(echo $CREDS | jq -r '.SecretAccessKey')
export AWS_SESSION_TOKEN=$(echo $CREDS | jq -r '.SessionToken')

aws sts get-caller-identity  # Verify assumed role`,
    },
    {
      label: 'ABAC Policy',
      language: 'bash',
      code: `# ABAC: allow engineers to manage EC2 instances with their team tag
cat << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["ec2:StartInstances", "ec2:StopInstances"],
    "Resource": "*",
    "Condition": {
      "StringEquals": {
        "ec2:ResourceTag/Team": "\${aws:PrincipalTag/Team}"
      }
    }
  }]
}
EOF

# Tag the IAM role/user
aws iam tag-role --role-name alice-role --tags Key=Team,Value=payments

# Tag the EC2 instance
aws ec2 create-tags --resources i-1234567890 --tags Key=Team,Value=payments

# Now alice can start/stop the payments instance
# but NOT the billing team's instances

# Check effective permissions
aws iam simulate-principal-policy \\
  --policy-source-arn arn:aws:iam::ACCOUNT:role/alice-role \\
  --action-names ec2:StartInstances \\
  --resource-arns arn:aws:ec2:us-east-1:ACCOUNT:instance/i-1234567890`,
    },
    {
      label: 'SCP Example',
      language: 'bash',
      code: `# SCP: deny creation of resources outside approved regions
cat << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyNonApprovedRegions",
      "Effect": "Deny",
      "NotAction": [
        "iam:*", "sts:*", "support:*",
        "cloudfront:*", "route53:*", "waf:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": ["eu-west-1", "eu-central-1", "us-east-1"]
        }
      }
    }
  ]
}
EOF

# Attach SCP to an OU in AWS Organizations
aws organizations attach-policy \\
  --policy-id p-EXAMPLE \\
  --target-id ou-root-EXAMPLE

# Effective permission = MIN(SCP allowances, IAM policy allowances)
# SCP denies CANNOT be overridden even by admin IAM policies`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Granting s3:* instead of specific S3 actions',
      wrong: `{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*"
}`,
      right: `{
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": "arn:aws:s3:::my-bucket/uploads/*"
}`,
      explanation: 'Wildcard actions violate least privilege and allow unintended operations (s3:DeleteBucket, s3:PutBucketPolicy). Always scope to exact actions and specific resource ARNs.',
    },
    {
      title: 'Confusing identity-based and resource-based policy evaluation cross-account',
      wrong: `// Adding s3:GetObject to the IAM role policy is enough
// to read from a bucket in another account... right?`,
      right: `// Cross-account requires BOTH policies to allow:
// 1. Caller's IAM role policy: allow s3:GetObject on arn:aws:s3:::other-account-bucket/*
// 2. Bucket policy in other account: allow the caller's role ARN`,
      explanation: 'Same-account: either IAM or resource policy suffices. Cross-account: BOTH must allow. This is the most common "Access Denied" confusion in cross-account architectures.',
    },
    {
      title: 'Assuming Deny in SCP prevents all access including admin',
      wrong: `// "I added an SCP deny, so even my AWS admins can't do it now"
// Actually SCPs don't apply to the management account itself`,
      right: `// SCPs restrict member accounts in the org
// Management account is exempt from SCPs
// Use IAM policies to restrict management account admins`,
      explanation: 'SCPs protect member accounts but the organization management account is always exempt. For restricting management account actions, use IAM policies and resource policies.',
    },
    {
      title: 'Using NotAction to allow everything except listed actions',
      wrong: `{
  "Effect": "Allow",
  "NotAction": ["iam:DeleteUser", "iam:DeleteRole"],
  "Resource": "*"
}`,
      right: `{
  "Effect": "Allow",
  "Action": ["ec2:DescribeInstances", "s3:GetObject"],
  "Resource": "*"
}`,
      explanation: 'NotAction with Allow means "allow all actions EXCEPT the listed ones" — this accidentally grants thousands of AWS actions. Only use NotAction with Deny (e.g. SCP region restrictions) or with careful thought.',
    },
    {
      title: 'Forgetting the Resource ARN distinction for S3',
      wrong: `{
  "Action": ["s3:ListBucket", "s3:GetObject"],
  "Resource": "arn:aws:s3:::my-bucket"
}`,
      right: `{
  "Action": "s3:ListBucket",
  "Resource": "arn:aws:s3:::my-bucket"
},
{
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::my-bucket/*"
}`,
      explanation: 's3:ListBucket acts on the bucket (no trailing /*). s3:GetObject/PutObject/DeleteObject act on objects (needs /*). Combining them on the same resource causes an Access Denied on object operations.',
    },
  ];

  challenge: Challenge = {
    title: 'Write a Least-Privilege Lambda IAM Role',
    language: 'typescript',
    description: `A Lambda function needs to:
- Read items from a DynamoDB table named "orders" in us-east-1 (account 123456789012)
- Write to an SQS queue named "order-notifications" in the same account/region
- Write CloudWatch Logs (required for Lambda execution)
- NOT be able to delete DynamoDB items or purge the SQS queue

Write the IAM policy JSON with the minimum required permissions.
Then write the trust policy that lets Lambda assume this role.`,
    hints: [
      'DynamoDB read actions: dynamodb:GetItem, dynamodb:Query, dynamodb:Scan',
      'SQS send action: sqs:SendMessage',
      'Lambda needs logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents',
      'Trust policy Principal should be lambda.amazonaws.com',
      'Use specific ARNs, not wildcards for Resource',
    ],
    starterCode: `// Write two JSON objects:
// 1. The permission policy for the Lambda role
// 2. The trust policy (assume-role-policy-document)

const permissionPolicy = {
  Version: "2012-10-17",
  Statement: [
    // TODO: DynamoDB read
    // TODO: SQS send
    // TODO: CloudWatch Logs write
  ]
};

const trustPolicy = {
  // TODO: allow Lambda service to assume this role
};`,
    solution: `const permissionPolicy = {
  Version: "2012-10-17",
  Statement: [
    {
      Sid: "DynamoDBRead",
      Effect: "Allow",
      Action: ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"],
      Resource: "arn:aws:dynamodb:us-east-1:123456789012:table/orders"
    },
    {
      Sid: "SQSSend",
      Effect: "Allow",
      Action: "sqs:SendMessage",
      Resource: "arn:aws:sqs:us-east-1:123456789012:order-notifications"
    },
    {
      Sid: "CloudWatchLogs",
      Effect: "Allow",
      Action: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      Resource: "arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/*"
    }
  ]
};

const trustPolicy = {
  Version: "2012-10-17",
  Statement: [{
    Effect: "Allow",
    Principal: { Service: "lambda.amazonaws.com" },
    Action: "sts:AssumeRole"
  }]
};
// Note: no s3:DeleteItem or sqs:PurgeQueue — those actions are simply absent (implicit deny)`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What happens when an explicit Deny and an explicit Allow both apply to the same action?',
      options: [
        'Allow wins because it was defined last',
        'The most specific policy wins (Allow on exact resource, Deny on wildcard)',
        'Deny always wins — explicit Deny overrides any Allow',
        'AWS prompts the user to resolve the conflict',
      ],
      answer: 2,
      explanation: 'IAM evaluation rule 1: explicit Deny always wins regardless of any Allow. This is why you can use Deny statements as guardrails — they cannot be overridden by other Allow policies.',
    },
    {
      q: 'A Lambda function needs to read from S3. Where should the credentials come from?',
      options: [
        'Hardcoded in the Lambda environment variables',
        'An IAM execution role attached to the Lambda function',
        'An IAM user whose keys are stored in AWS Secrets Manager',
        'The Lambda function should request credentials via the CLI',
      ],
      answer: 1,
      explanation: 'Lambda execution roles provide temporary credentials via the AWS runtime environment automatically. The SDK picks them up without any configuration. This is the secure, keyless approach.',
    },
    {
      q: 'You want to allow s3:GetObject on all objects but only in a specific bucket. Which Resource ARN is correct?',
      options: [
        'arn:aws:s3:::my-bucket',
        'arn:aws:s3:::*',
        'arn:aws:s3:::my-bucket/*',
        'arn:aws:s3:us-east-1:123456789012:my-bucket/*',
      ],
      answer: 2,
      explanation: 's3:GetObject is an object-level action that requires the /* suffix. The bucket itself (without /*) grants bucket-level actions like s3:ListBucket. S3 ARNs also omit region and account ID.',
    },
    {
      q: 'What is an IAM Permission Boundary?',
      options: [
        'A network boundary that prevents IAM calls from leaving a VPC',
        'A policy that sets the maximum permissions a user or role can have, regardless of other policies',
        'A daily quota on how many IAM API calls can be made',
        'The limit on how many policies can be attached to a single role',
      ],
      answer: 1,
      explanation: 'Permission Boundaries cap the maximum effective permissions. If a policy grants s3:* but the boundary only allows s3:GetObject, the effective permission is only s3:GetObject. Used to safely delegate IAM management.',
    },
    {
      q: 'A Service Control Policy (SCP) denies ec2:RunInstances in a member account. An IAM admin in that account tries to run an instance. What happens?',
      options: [
        'The admin can still run instances because admin IAM policies override SCPs',
        'The admin is denied because SCPs are evaluated before IAM policies',
        'The admin is prompted to escalate to the organization management account',
        'The instance runs but is flagged for compliance review',
      ],
      answer: 1,
      explanation: 'SCPs set the maximum permissions boundary for ALL principals in a member account, including admins. An SCP Deny cannot be overridden by any IAM policy — even AdministratorAccess.',
    },
    {
      q: 'What is the principle of least privilege as applied to IAM policies?',
      options: ['Granting AdministratorAccess to all new users by default for convenience', 'Granting only the specific permissions required to perform a task, nothing more', 'Using only managed policies, never custom policies', 'Disabling all IAM users and using root credentials instead'],
      answer: 1,
      explanation: 'Least privilege means an identity (user, role, service) should have exactly the permissions it needs to perform its function and no more — reducing the blast radius if credentials are ever compromised. AWS provides tools like IAM Access Analyzer to help identify and trim overly permissive policies down to actual usage patterns.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between an IAM Role and an IAM User?',
      a: 'IAM Users have permanent long-term credentials (access key + secret). IAM Roles have no permanent credentials — they issue short-lived STS tokens when assumed. Roles are assumed by services, applications, or users for a session. Best practice: use roles for everything except legacy integrations that require long-term keys.',
    },
    {
      q: 'How do cross-account IAM permissions work?',
      a: 'Two policies must allow the action: (1) the caller\'s IAM identity policy in their account must allow assuming the role in the target account, (2) the target account\'s role trust policy must allow the caller\'s ARN to assume it. For resource-based policies (S3, SQS), the resource policy in the target account must explicitly allow the caller\'s ARN.',
    },
    {
      q: 'When should I use IAM managed policies vs inline policies?',
      a: 'Prefer AWS Managed Policies for standard permissions (AmazonS3ReadOnlyAccess) and Customer Managed Policies for custom permissions — both can be reused, versioned, and audited. Use inline policies only when you need a 1:1 binding between a policy and a specific role (e.g. ensuring the policy is deleted with the role). Avoid inline for shared permissions.',
    },
    {
      q: 'What is the IAM policy evaluation order?',
      a: 'AWS evaluates policies in this order: (1) SCPs from AWS Organizations; (2) Resource-based policies; (3) IAM identity-based policies; (4) IAM Permission Boundaries; (5) Session policies. At each layer, explicit Deny wins. Final effective permissions are the intersection of allows across all applicable layers, with no explicit deny.',
    },
    {
      q: 'What is the difference between an IAM identity-based policy and a resource-based policy?',
      a: 'An identity-based policy is attached to a user, group, or role, defining what that identity can do. A resource-based policy is attached directly to a resource (like an S3 bucket policy or a Lambda resource policy), defining who can access THAT resource regardless of their own identity-based permissions. Both are evaluated together — for cross-account access, a resource-based policy is often required since the calling identity exists in a different account that cannot be granted permissions via an identity-based policy alone.',
    },
    {
      q: 'A user gets AccessDenied on an action even though their own IAM identity-based policy explicitly allows it, and there is no SCP or permission boundary in play. What is the most likely remaining source of an explicit Deny they might have overlooked?',
      a: 'A resource-based policy attached directly to the target resource (an S3 bucket policy, a KMS key policy, a Lambda resource policy, etc.) — these are evaluated as part of the same "does any applicable policy explicitly deny this" check, and are easy to overlook because they live on the resource rather than on the caller\'s identity, so someone debugging only by reading the user\'s own IAM policies can miss them entirely. A common real-world case: an S3 bucket policy with a Deny statement enforcing "require aws:SecureTransport" or restricting access to a specific VPC endpoint — a user\'s identity policy can grant s3:GetObject cleanly, but the request still gets denied if it doesn\'t satisfy the bucket policy\'s own explicit Deny condition.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'IAM: roles over users, least-privilege JSON policies, explicit Deny wins, cross-account requires both sides, SCPs cap org accounts.',
    mustKnow: [
      'IAM policy structure: Effect + Action + Resource + optional Condition',
      'Explicit Deny always overrides any Allow — no exceptions',
      'S3 bucket ARN (ListBucket) vs object ARN/* (GetObject/PutObject) distinction',
      'Cross-account: BOTH caller IAM policy AND resource-based policy must allow',
      'Permission Boundary = maximum cap on role/user permissions',
      'SCP = organizational guardrail; applies to member accounts including root, not management account',
      'IAM roles issue temporary STS credentials — always prefer over long-term user keys',
    ],
    interviewFocus: [
      'Explain IAM policy evaluation order — mention SCPs, Permission Boundaries, resource-based policies',
      'How do cross-account S3 permissions differ from same-account? (need bucket policy + IAM)',
      's3:ListBucket vs s3:GetObject ARN formats — classic interview trap',
      'What happens when Deny and Allow conflict? (Deny wins)',
      'ABAC vs RBAC in IAM — when to use tags vs separate roles',
    ],
  };
}
