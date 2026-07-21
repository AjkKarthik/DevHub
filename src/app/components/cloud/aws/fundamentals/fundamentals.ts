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
  selector: 'app-aws-fundamentals',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss'
})
export class AwsFundamentals {
  quickRef: QuickRefItem[] = [
    { name: 'Region', type: 'keyword', desc: 'Geographic area with 2+ AZs — e.g. us-east-1, eu-west-1' },
    { name: 'AZ', type: 'keyword', desc: 'Availability Zone — isolated data center(s) within a region' },
    { name: 'Edge Location', type: 'keyword', desc: 'CloudFront CDN PoP — not an AZ; used for caching only' },
    { name: 'Shared Responsibility', type: 'keyword', desc: 'AWS manages security OF the cloud; you manage IN the cloud' },
    { name: 'AWS CLI', type: 'syntax', desc: 'aws configure → sets access key, secret, region, output format' },
    { name: 'IAM Root', type: 'keyword', desc: 'Account root — never use for daily tasks; enable MFA immediately' },
    { name: 'Well-Architected', type: 'keyword', desc: '6 pillars: OpEx, Security, Reliability, Perf, Cost, Sustainability' },
    { name: 'aws sts get-caller-identity', type: 'syntax', desc: 'Verify which IAM identity you are currently using' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Global Infrastructure',
      points: [
        'AWS spans 30+ geographic Regions, each containing 2–6 Availability Zones (AZs).',
        'AZs are physically separate data centers with independent power, cooling, and networking — connected via low-latency private links.',
        'Edge Locations (400+) are used by CloudFront, Route 53, and Global Accelerator for caching/routing — they are NOT AZs.',
        'Local Zones extend compute to major metro areas for single-digit-ms latency; Wavelength embeds AWS compute in 5G networks.',
        'Choose your region based on: latency to users, data residency requirements, service availability, and pricing differences.',
      ]
    },
    {
      heading: 'Shared Responsibility Model',
      points: [
        'AWS is responsible for security OF the cloud: physical hardware, network, hypervisor, managed service software.',
        'YOU are responsible for security IN the cloud: OS patching (EC2), application code, IAM configuration, data encryption, network controls.',
        'For managed services (RDS, Lambda), AWS takes more responsibility — you only manage the data and access.',
        'For IaaS (EC2), you own the OS upward — patching, firewall rules, app security are all your responsibility.',
        'The "shared" boundary shifts by service type — always check what AWS manages for each service you use.',
      ]
    },
    {
      heading: 'AWS Account & Access',
      points: [
        'The root account has unrestricted access — enable MFA immediately and never use it for daily operations.',
        'IAM users get long-term credentials (access key + secret key) — prefer IAM roles over long-lived keys.',
        'IAM roles provide temporary credentials via STS — use for EC2 instance profiles, Lambda execution roles, CI/CD pipelines.',
        'AWS Organizations lets you group accounts under a management account — apply SCPs at the OU level.',
        'AWS IAM Identity Center (SSO) is the modern way to grant humans access to multiple accounts without per-account IAM users.',
      ]
    },
    {
      heading: 'AWS CLI & SDK',
      points: [
        'aws configure stores credentials in ~/.aws/credentials and region in ~/.aws/config.',
        'Named profiles: aws configure --profile prod lets you switch with --profile flag or AWS_PROFILE env var.',
        'The CLI reads credentials in order: env vars → ~/.aws/credentials → ~/.aws/config → ECS task role (container credentials) → EC2 instance profile — container credentials are checked before the EC2 instance profile, not after.',
        'SDKs (Boto3, AWS SDK for JS/Java/.NET) follow the same credential chain — no hardcoding keys in code.',
        'aws sts get-caller-identity returns your current Account ID, UserId, and ARN — essential for debugging auth.',
      ]
    },
    {
      heading: 'AWS Well-Architected Framework',
      points: [
        'Operational Excellence: automate operations, make small reversible changes, anticipate failure.',
        'Security: implement a strong identity foundation, enable traceability, protect data in transit and at rest.',
        'Reliability: automatically recover from failure, test recovery, scale horizontally, stop guessing capacity.',
        'Performance Efficiency: use advanced technologies as a service, go global in minutes, use serverless first.',
        'Cost Optimization: adopt a consumption model, measure overall efficiency, analyse and attribute expenditure.',
        'Sustainability (6th pillar, 2021): understand your impact, establish sustainability goals, maximize utilization.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CLI Setup',
      language: 'bash',
      code: `# Install AWS CLI v2 (macOS/Linux)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip
unzip awscliv2.zip && sudo ./aws/install

# Configure default profile
aws configure
# AWS Access Key ID [None]: AKIA...
# AWS Secret Access Key [None]: ...
# Default region name [None]: us-east-1
# Default output format [None]: json

# Configure a named profile
aws configure --profile prod

# Check current identity
aws sts get-caller-identity
# {
#   "UserId": "AIDAEXAMPLE",
#   "Account": "123456789012",
#   "Arn": "arn:aws:iam::123456789012:user/alice"
# }

# Switch profile per command
aws s3 ls --profile prod

# Use env vars (CI/CD)
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=us-east-1`,
    },
    {
      label: 'Account Setup',
      language: 'bash',
      code: `# List all AWS regions
aws ec2 describe-regions --query 'Regions[].RegionName' --output text

# Check account info
aws organizations describe-account --account-id $(aws sts get-caller-identity --query Account --output text)

# List IAM users (as admin)
aws iam list-users --query 'Users[].{Name:UserName,Created:CreateDate}'

# Check MFA status for a user
aws iam list-mfa-devices --user-name alice

# List attached policies for a user
aws iam list-attached-user-policies --user-name alice

# Assume a role (cross-account)
aws sts assume-role \\
  --role-arn arn:aws:iam::ACCOUNT_ID:role/MyRole \\
  --role-session-name my-session

# Get EC2 instance metadata (from inside EC2)
curl http://169.254.169.254/latest/meta-data/instance-id
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/`,
    },
    {
      label: 'Well-Architected',
      language: 'typescript',
      code: `// AWS Well-Architected Framework — 6 pillars summary
const wellArchitected = {
  operationalExcellence: {
    principles: ['Run operations as code', 'Make frequent small reversible changes', 'Anticipate failure'],
    keyServices: ['CloudFormation', 'AWS Config', 'CloudWatch', 'Systems Manager'],
  },
  security: {
    principles: ['Strong identity foundation', 'Enable traceability', 'Apply security at all layers', 'Protect data'],
    keyServices: ['IAM', 'GuardDuty', 'Security Hub', 'KMS', 'WAF'],
  },
  reliability: {
    principles: ['Automatically recover from failure', 'Test recovery', 'Scale horizontally'],
    keyServices: ['Auto Scaling', 'ELB', 'Route 53', 'RDS Multi-AZ', 'CloudWatch Alarms'],
  },
  performanceEfficiency: {
    principles: ['Democratize advanced tech', 'Go global in minutes', 'Use serverless architectures'],
    keyServices: ['Lambda', 'CloudFront', 'ElastiCache', 'Aurora', 'SQS'],
  },
  costOptimization: {
    principles: ['Adopt consumption model', 'Measure overall efficiency', 'Stop spending on undifferentiated heavy lifting'],
    keyServices: ['Cost Explorer', 'Budgets', 'Savings Plans', 'Trusted Advisor', 'Compute Optimizer'],
  },
  sustainability: {
    principles: ['Understand your impact', 'Maximize utilization', 'Anticipate and adopt more efficient offerings'],
    keyServices: ['Graviton instances', 'Spot Instances', 'S3 Intelligent-Tiering'],
  },
};

// Shared responsibility by service type
const sharedResponsibility = {
  'EC2 (IaaS)': {
    aws: 'Physical hardware, hypervisor, network infrastructure',
    customer: 'OS patching, app security, firewall rules, data encryption',
  },
  'RDS (PaaS)': {
    aws: 'OS patching, DB engine patching, hardware, backups',
    customer: 'DB configuration, user access, data, network access control',
  },
  'Lambda (Serverless)': {
    aws: 'Runtime patching, execution environment, scaling',
    customer: 'Function code, IAM permissions, data, configuration',
  },
};`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using root account credentials for daily work',
      wrong: `# Storing root access keys in ~/.aws/credentials
[default]
aws_access_key_id = AKIA_ROOT_KEY
aws_secret_access_key = rootsecret`,
      right: `# Create an IAM user or role with least privilege
# Enable MFA on root, then lock it away
[default]
aws_access_key_id = AKIA_IAM_USER_KEY
aws_secret_access_key = iamuser_secret`,
      explanation: 'Root credentials bypass all IAM policies and cannot be restricted. Create IAM users/roles for all programmatic access and enable MFA on root immediately.',
    },
    {
      title: 'Hardcoding credentials in application code',
      wrong: `const client = new S3Client({
  credentials: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'hardcoded-secret-key',
  },
});`,
      right: `// Use instance profile, ECS task role, or Lambda execution role
// SDK automatically picks up credentials from the environment
const client = new S3Client({ region: 'us-east-1' });
// No credentials needed — resolved from role automatically`,
      explanation: 'Hardcoded keys end up in version control and are rotated manually. Use IAM roles that grant temporary credentials automatically via the metadata service.',
    },
    {
      title: 'Confusing regions and availability zones',
      wrong: `// "I deployed in us-east-1a for high availability"
// One AZ is a single point of failure`,
      right: `// Deploy across multiple AZs in the same region
// ALB + Auto Scaling Group spans 3 AZs
// RDS Multi-AZ uses a standby in a different AZ`,
      explanation: 'High availability requires resources across multiple AZs. A single AZ failure (hardware, power) takes down everything in that zone. Use multi-AZ by default for production.',
    },
    {
      title: 'Skipping the --region flag and relying on defaults',
      wrong: `# Creates resource in whatever region aws configure set
aws ec2 describe-instances
# Where are my instances?! Wrong region!`,
      right: `# Always explicit about region
aws ec2 describe-instances --region us-east-1
# Or set per command
AWS_DEFAULT_REGION=eu-west-1 aws s3 ls`,
      explanation: 'AWS resources are regional. Forgetting to specify the region causes "resource not found" errors when the CLI defaults to a different region than where you created resources.',
    },
    {
      title: 'Treating Edge Locations as Availability Zones',
      wrong: `// "I chose us-east-1 because it has 400+ locations"
// Edge locations are NOT compute AZs
// You cannot launch EC2 into an edge location`,
      right: `// Edge locations = CloudFront/Route53 PoPs (caching/DNS)
// AZs = isolated data centers where you run compute
// us-east-1 has 6 AZs: us-east-1a through us-east-1f`,
      explanation: 'Edge locations (400+) are CloudFront CDN points of presence. They cache content and handle DNS. You cannot launch compute into them. Confusing them with AZs leads to architecture misunderstandings.',
    },
  ];

  challenge: Challenge = {
    title: 'Configure Multi-Profile AWS CLI Setup',
    language: 'typescript',
    description: `You need to set up AWS CLI profiles for three environments: dev, staging, and prod.
Each uses a different AWS account and region.

Requirements:
1. Write the correct aws configure commands for each profile
2. Show how to list S3 buckets in each environment
3. Show how to use an env var to temporarily switch the active profile
4. Write a TypeScript function that builds an S3Client for a given environment`,
    hints: [
      'aws configure --profile <name> sets credentials for a named profile',
      'Use --profile flag on CLI commands to target a specific profile',
      'AWS_PROFILE env var sets the active profile without --profile flag',
      'The SDK reads AWS_PROFILE or AWS_DEFAULT_REGION from environment',
    ],
    starterCode: `// Challenge: Multi-environment AWS setup

// 1. CLI commands (write as comments)
// dev profile (us-east-1, account 111111111111)
// staging profile (us-west-2, account 222222222222)
// prod profile (eu-west-1, account 333333333333)

// 2. Listing S3 buckets per environment

// 3. Temporary profile switch via env var

// 4. TypeScript S3Client factory
import { S3Client } from '@aws-sdk/client-s3';

function createS3Client(env: 'dev' | 'staging' | 'prod'): S3Client {
  // TODO: return client configured for the right region
}`,
    solution: `// 1. Configure profiles
// aws configure --profile dev
//   Region: us-east-1
// aws configure --profile staging
//   Region: us-west-2
// aws configure --profile prod
//   Region: eu-west-1

// 2. List S3 buckets per profile
// aws s3 ls --profile dev
// aws s3 ls --profile staging
// aws s3 ls --profile prod

// 3. Temporary switch via env var
// export AWS_PROFILE=prod
// aws s3 ls   # uses prod profile
// unset AWS_PROFILE

// 4. TypeScript S3Client factory
import { S3Client } from '@aws-sdk/client-s3';

const REGION_MAP: Record<string, string> = {
  dev: 'us-east-1',
  staging: 'us-west-2',
  prod: 'eu-west-1',
};

function createS3Client(env: 'dev' | 'staging' | 'prod'): S3Client {
  return new S3Client({ region: REGION_MAP[env] });
  // In CI/CD: set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
  // On EC2/ECS/Lambda: IAM role provides credentials automatically — no keys needed
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the shared responsibility model boundary for Amazon RDS?',
      options: [
        'AWS manages everything including your database queries and application logic',
        'AWS manages the DB engine patching and hardware; you manage data, access, and configuration',
        'You manage everything including hardware, OS, and DB engine patching',
        'AWS manages data encryption but you manage OS patching',
      ],
      answer: 1,
      explanation: 'For managed services like RDS, AWS handles the undifferentiated heavy lifting: hardware, OS patching, DB engine updates, and backups. You own the data, schema, user access, and network configuration.',
    },
    {
      q: 'You deploy your app to a single Availability Zone. What is the risk?',
      options: [
        'Higher latency because traffic must traverse region boundaries',
        'Increased cost because single-AZ pricing is higher',
        'Single point of failure — an AZ outage takes down your entire app',
        'No risk — one AZ has multiple redundant data centers',
      ],
      answer: 2,
      explanation: 'Each AZ has its own power, cooling, and networking. An AZ-level failure (rare but possible) takes down all resources in that AZ. Multi-AZ deployments survive a single AZ failure.',
    },
    {
      q: 'Which credential type does AWS recommend for EC2 applications accessing S3?',
      options: [
        'Root account access keys stored in /etc/aws/credentials',
        'IAM user long-term access keys hardcoded in the application',
        'IAM instance profile attached to the EC2 — temporary credentials via metadata service',
        'Environment variables set at launch time with permanent credentials',
      ],
      answer: 2,
      explanation: 'IAM instance profiles attach a role to EC2 instances. The SDK retrieves short-lived credentials from the instance metadata service (169.254.169.254) automatically — no keys to store or rotate.',
    },
    {
      q: 'How many Well-Architected pillars are there, and which was added in 2021?',
      options: [
        '5 pillars — Cost Optimization was added in 2021',
        '6 pillars — Sustainability was added in 2021',
        '5 pillars — Security was added in 2021',
        '7 pillars — Resiliency was added in 2021',
      ],
      answer: 1,
      explanation: 'The original 5 pillars are: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization. Sustainability was added as the 6th pillar in November 2021 at re:Invent.',
    },
    {
      q: 'What command verifies your current AWS identity and account number?',
      options: [
        'aws iam whoami',
        'aws configure list',
        'aws sts get-caller-identity',
        'aws account describe',
      ],
      answer: 2,
      explanation: 'aws sts get-caller-identity returns the UserId, Account (12-digit account number), and ARN of the calling entity. Essential for debugging "wrong account" or "wrong role" issues.',
    },
    {
      q: 'What does the AWS Well-Architected Framework\'s "Operational Excellence" pillar focus on?',
      options: ['Minimizing infrastructure cost', 'Running and monitoring systems to deliver business value, and continuously improving processes', 'Maximizing compute performance', 'Encrypting all data at rest'],
      answer: 1,
      explanation: 'Operational Excellence focuses on running workloads effectively, gaining insight into operations, and continuously improving supporting processes and procedures — including infrastructure as code, frequent small changes, and learning from failures.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I create IAM users or use IAM Identity Center (SSO)?',
      a: 'For humans, prefer IAM Identity Center (SSO) — it provides centralized access across multiple accounts without creating per-account IAM users. For machines/applications, use IAM roles with instance profiles or OIDC federation. Only use long-term IAM user keys when integrating with tools that cannot use temporary credentials.',
    },
    {
      q: 'What is the difference between a Region and an Edge Location?',
      a: 'A Region is a geographic cluster of 2–6 Availability Zones where you run compute, storage, and database workloads. An Edge Location is a CloudFront or Route 53 point-of-presence (400+) used only for caching content and resolving DNS — you cannot run EC2, RDS, or Lambda there.',
    },
    {
      q: 'How do I pick the right AWS Region?',
      a: 'Four factors: (1) Latency — choose the region closest to your users; (2) Data residency — regulatory requirements may mandate data stays in a specific country; (3) Service availability — not all services exist in all regions; (4) Pricing — same instance type can cost 10–20% more in some regions. For most European users, eu-west-1 (Ireland) or eu-central-1 (Frankfurt) are common choices.',
    },
    {
      q: 'Is the AWS Free Tier actually free?',
      a: 'Free Tier has three types: (1) Always free — Lambda 1M requests/month, DynamoDB 25GB, forever; (2) 12-month free — 750 hours/month t2.micro/t3.micro EC2, 5GB S3; (3) Short-term trials — specific service trials. Always set billing alerts (AWS Budgets) even in free tier — accidental usage outside limits incurs charges.',
    },
    {
      q: 'What is the ARN format and why does it matter?',
      a: 'ARN (Amazon Resource Name) uniquely identifies every AWS resource: arn:partition:service:region:account-id:resource. Example: arn:aws:s3:::my-bucket or arn:aws:iam::123456789012:role/MyRole. ARNs are used in IAM policies to specify exact resources. Understanding ARN format helps write precise least-privilege policies and debug "access denied" errors.',
    },
    {
      q: 'What is the difference between an AWS account and an AWS Organization?',
      a: 'An AWS account is a single billing and resource isolation boundary. An AWS Organization lets you centrally manage multiple AWS accounts — consolidated billing, Service Control Policies (SCPs) to restrict what member accounts can do, and centralized logging/security tooling. Most real-world setups use multiple accounts (one per environment or team) under one Organization rather than one giant shared account.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'AWS fundamentals: regions/AZs, shared responsibility, IAM roles over keys, Well-Architected pillars.',
    mustKnow: [
      'Region = geographic area with 2+ AZs; AZ = isolated data center(s)',
      'Edge Locations are for CDN/DNS caching — not compute AZs',
      'Shared responsibility: AWS manages OF the cloud; you manage IN the cloud',
      'Never use root credentials daily; use IAM roles for applications',
      'aws sts get-caller-identity verifies your current identity',
      '6 Well-Architected pillars: OpEx, Security, Reliability, Perf, Cost, Sustainability',
      'Credential chain: env vars → profile → instance role → ECS/Lambda role',
    ],
    interviewFocus: [
      'Explain the shared responsibility model with concrete examples per service type (EC2 vs RDS vs Lambda)',
      'How does an EC2 application get credentials to call S3? (Instance profile / metadata service)',
      'What is the Well-Architected Framework and name the 6 pillars',
      'Region vs AZ vs Edge Location — common interview confusion point',
      'Why should you never use root account credentials programmatically?',
    ],
  };
}
