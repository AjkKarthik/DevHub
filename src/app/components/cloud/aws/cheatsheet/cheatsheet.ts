import { Component, signal } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';

interface ServiceItem { name: string; desc: string; }
interface ServiceGroup { category: string; icon: string; items: ServiceItem[]; }
interface ArchPattern { name: string; flow: string; notes: string[]; }

@Component({
  selector: 'app-aws-cheatsheet',
  standalone: true,
  imports: [PageMetaComponent, CodeBlockComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class AwsCheatsheet {
  activeTab = signal<string>('cli');

  cliTabs: CodeTab[] = [
    {
      label: 'Account & IAM',
      language: 'bash',
      code: `# ── Setup & Identity ──────────────────────────────────────────
aws configure                             # interactive: key, secret, region, format
aws configure --profile prod              # named profile
aws configure list-profiles

export AWS_PROFILE=prod                   # switch profile for the session

aws sts get-caller-identity               # who am I?
aws sts assume-role \\
  --role-arn arn:aws:iam::123456789012:role/DevRole \\
  --role-session-name ci-run             # get temporary credentials

# ── IAM Users & Roles ─────────────────────────────────────────
aws iam list-users \\
  --query 'Users[*].{User:UserName,Created:CreateDate}' --output table

aws iam list-roles \\
  --query 'Roles[*].{Role:RoleName,Arn:Arn}' --output table

aws iam get-role --role-name MyRole
aws iam list-attached-role-policies --role-name MyRole

aws iam create-role \\
  --role-name AppRole \\
  --assume-role-policy-document file://trust-policy.json

aws iam attach-role-policy \\
  --role-name AppRole \\
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess`,
    },
    {
      label: 'EC2 & ECS',
      language: 'bash',
      code: `# ── EC2 ───────────────────────────────────────────────────────
aws ec2 describe-instances \\
  --filters "Name=instance-state-name,Values=running" \\
  --query 'Reservations[*].Instances[*].{ID:InstanceId,Type:InstanceType,IP:PublicIpAddress}' \\
  --output table

aws ec2 start-instances --instance-ids i-0abc1234567890abc
aws ec2 stop-instances  --instance-ids i-0abc1234567890abc
aws ec2 reboot-instances --instance-ids i-0abc1234567890abc

# Describe security groups for an instance
aws ec2 describe-instance-attribute \\
  --instance-id i-0abc1234567890abc \\
  --attribute groupSet

# ── Auto Scaling ──────────────────────────────────────────────
aws autoscaling describe-auto-scaling-groups \\
  --query 'AutoScalingGroups[*].{Name:AutoScalingGroupName,Min:MinSize,Max:MaxSize,Desired:DesiredCapacity}'

aws autoscaling set-desired-capacity \\
  --auto-scaling-group-name my-asg \\
  --desired-capacity 5

# ── ECS ───────────────────────────────────────────────────────
aws ecs list-clusters
aws ecs list-services --cluster my-cluster
aws ecs describe-services --cluster my-cluster --services my-service

# Force rolling redeploy
aws ecs update-service \\
  --cluster my-cluster \\
  --service my-service \\
  --force-new-deployment

aws ecs run-task \\
  --cluster my-cluster \\
  --task-definition my-task:3 \\
  --launch-type FARGATE \\
  --network-configuration 'awsvpcConfiguration={subnets=[subnet-abc],securityGroups=[sg-abc],assignPublicIp=ENABLED}'`,
    },
    {
      label: 'S3 & Lambda',
      language: 'bash',
      code: `# ── S3 ────────────────────────────────────────────────────────
aws s3 ls                                 # list all buckets
aws s3 ls s3://my-bucket/prefix/          # list objects at prefix
aws s3 cp file.txt s3://my-bucket/        # upload file
aws s3 cp s3://my-bucket/file.txt ./      # download file
aws s3 sync ./dist s3://my-bucket/ --delete  # sync directory
aws s3 rm s3://my-bucket/file.txt

# Presigned URL — expires in 1 hour
aws s3 presign s3://my-bucket/report.pdf --expires-in 3600

# Bucket operations
aws s3api list-buckets
aws s3api put-bucket-versioning \\
  --bucket my-bucket \\
  --versioning-configuration Status=Enabled

aws s3api get-bucket-encryption --bucket my-bucket
aws s3api put-public-access-block \\
  --bucket my-bucket \\
  --public-access-block-configuration \\
  'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'

# ── Lambda ────────────────────────────────────────────────────
aws lambda list-functions \\
  --query 'Functions[*].{Name:FunctionName,Runtime:Runtime,Memory:MemorySize}'

aws lambda invoke \\
  --function-name my-function \\
  --payload '{"action":"ping"}' \\
  --cli-binary-format raw-in-base64-out \\
  response.json && cat response.json

aws lambda update-function-code \\
  --function-name my-function \\
  --zip-file fileb://function.zip

aws lambda update-function-configuration \\
  --function-name my-function \\
  --memory-size 512 \\
  --timeout 30

aws lambda list-event-source-mappings \\
  --function-name my-function`,
    },
    {
      label: 'CloudFormation & DynamoDB',
      language: 'bash',
      code: `# ── CloudFormation ────────────────────────────────────────────
aws cloudformation deploy \\
  --template-file template.yaml \\
  --stack-name my-stack \\
  --parameter-overrides Env=prod \\
  --capabilities CAPABILITY_IAM

aws cloudformation describe-stacks --stack-name my-stack
aws cloudformation list-stack-resources --stack-name my-stack

aws cloudformation create-change-set \\
  --stack-name my-stack \\
  --change-set-name my-change \\
  --template-body file://template.yaml \\
  --capabilities CAPABILITY_IAM

aws cloudformation execute-change-set \\
  --stack-name my-stack --change-set-name my-change

aws cloudformation delete-stack --stack-name my-stack

# ── DynamoDB ──────────────────────────────────────────────────
aws dynamodb put-item \\
  --table-name Orders \\
  --item '{"pk":{"S":"order#1001"},"sk":{"S":"meta"},"status":{"S":"PENDING"}}'

aws dynamodb get-item \\
  --table-name Orders \\
  --key '{"pk":{"S":"order#1001"},"sk":{"S":"meta"}}'

aws dynamodb query \\
  --table-name Orders \\
  --key-condition-expression "pk = :pk" \\
  --expression-attribute-values '{":pk":{"S":"order#1001"}}'

aws dynamodb update-item \\
  --table-name Orders \\
  --key '{"pk":{"S":"order#1001"},"sk":{"S":"meta"}}' \\
  --update-expression "SET #s = :s" \\
  --expression-attribute-names '{"#s":"status"}' \\
  --expression-attribute-values '{":s":{"S":"COMPLETE"}}'

aws dynamodb scan --table-name Orders --select COUNT  # row count`,
    },
  ];

  iamTabs: CodeTab[] = [
    {
      label: 'Trust Policies',
      language: 'bash',
      code: `# EC2 instance profile trust policy
cat trust-ec2.json
# {
#   "Version": "2012-10-17",
#   "Statement": [{
#     "Effect": "Allow",
#     "Principal": { "Service": "ec2.amazonaws.com" },
#     "Action": "sts:AssumeRole"
#   }]
# }

# Lambda execution role trust policy
cat trust-lambda.json
# {
#   "Version": "2012-10-17",
#   "Statement": [{
#     "Effect": "Allow",
#     "Principal": { "Service": "lambda.amazonaws.com" },
#     "Action": "sts:AssumeRole"
#   }]
# }

# GitHub Actions OIDC trust policy
cat trust-github.json
# {
#   "Version": "2012-10-17",
#   "Statement": [{
#     "Effect": "Allow",
#     "Principal": { "Federated": "arn:aws:iam::ACCOUNT:oidc-provider/token.actions.githubusercontent.com" },
#     "Action": "sts:AssumeRoleWithWebIdentity",
#     "Condition": {
#       "StringEquals": {
#         "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
#       },
#       "StringLike": {
#         "token.actions.githubusercontent.com:sub": "repo:MyOrg/MyRepo:*"
#       }
#     }
#   }]
# }

# Cross-account AssumeRole trust
cat trust-cross-account.json
# {
#   "Version": "2012-10-17",
#   "Statement": [{
#     "Effect": "Allow",
#     "Principal": { "AWS": "arn:aws:iam::TRUSTING_ACCOUNT:root" },
#     "Action": "sts:AssumeRole",
#     "Condition": { "Bool": { "aws:MultiFactorAuthPresent": "true" } }
#   }]
# }`,
    },
    {
      label: 'Permission Policies',
      language: 'bash',
      code: `# Least-privilege S3 read for specific bucket and prefix
cat policy-s3-read.json
# {
#   "Version": "2012-10-17",
#   "Statement": [{
#     "Effect": "Allow",
#     "Action": ["s3:GetObject", "s3:ListBucket"],
#     "Resource": [
#       "arn:aws:s3:::my-bucket",
#       "arn:aws:s3:::my-bucket/data/*"
#     ]
#   }]
# }

# DynamoDB access scoped to user's own items (ABAC)
cat policy-ddb-abac.json
# {
#   "Version": "2012-10-17",
#   "Statement": [{
#     "Effect": "Allow",
#     "Action": ["dynamodb:GetItem","dynamodb:PutItem","dynamodb:UpdateItem"],
#     "Resource": "arn:aws:dynamodb:*:*:table/Users",
#     "Condition": {
#       "ForAllValues:StringEquals": {
#         "dynamodb:LeadingKeys": ["\${aws:PrincipalTag/UserId}"]
#       }
#     }
#   }]
# }

# Permission boundary — limit max permissions to S3 + DynamoDB only
cat boundary-policy.json
# {
#   "Version": "2012-10-17",
#   "Statement": [{
#     "Effect": "Allow",
#     "Action": ["s3:*","dynamodb:*","logs:*","cloudwatch:*"],
#     "Resource": "*"
#   }]
# }

# SCP — deny all actions outside approved regions
cat scp-region-lock.json
# {
#   "Version": "2012-10-17",
#   "Statement": [{
#     "Effect": "Deny",
#     "NotAction": ["iam:*","sts:*","support:*","trustedadvisor:*"],
#     "Resource": "*",
#     "Condition": {
#       "StringNotEquals": {
#         "aws:RequestedRegion": ["us-east-1","eu-west-1"]
#       }
#     }
#   }]
# }`,
    },
  ];

  serviceGroups: ServiceGroup[] = [
    {
      category: 'Compute', icon: '⚡',
      items: [
        { name: 'EC2', desc: 'Virtual machines; instance families (m, c, r, t, g); On-Demand/Spot/Reserved' },
        { name: 'Lambda', desc: 'FaaS; event-driven; max 15 min; up to 10 GB RAM; cold start ~100ms' },
        { name: 'ECS (Fargate)', desc: 'Container orchestration; Fargate = serverless containers; task definitions' },
        { name: 'EKS', desc: 'Managed Kubernetes; IRSA for pod IAM; managed node groups; Fargate profiles' },
        { name: 'Batch', desc: 'Managed batch compute; job queues/definitions; Spot-backed for cost savings' },
      ],
    },
    {
      category: 'Storage', icon: '🗄️',
      items: [
        { name: 'S3', desc: 'Object storage; 11 9s durability; storage classes: Standard, IA, Glacier, IT' },
        { name: 'EBS', desc: 'Block storage for EC2; gp3 (default), io2 for high IOPS; single-AZ' },
        { name: 'EFS', desc: 'Elastic NFS; multi-AZ; scales automatically; Linux only' },
        { name: 'FSx', desc: 'Managed file systems: Windows (SMB), Lustre (HPC), NetApp, OpenZFS' },
      ],
    },
    {
      category: 'Networking', icon: '🌐',
      items: [
        { name: 'VPC', desc: 'Isolated network; public/private subnets; route tables; CIDR /16 to /28' },
        { name: 'ALB', desc: 'Application Load Balancer; L7; path/host/header routing; target groups' },
        { name: 'NLB', desc: 'Network Load Balancer; L4 TCP/UDP; ultra-low latency; static IP per AZ' },
        { name: 'Route 53', desc: 'DNS; routing policies: simple, weighted, latency, failover, geolocation' },
        { name: 'CloudFront', desc: 'CDN; 400+ edge locations; Origin Access Control; Lambda@Edge; HTTPS via ACM' },
      ],
    },
    {
      category: 'Databases', icon: '🗃️',
      items: [
        { name: 'RDS', desc: 'Managed SQL; Multi-AZ for HA; read replicas for scale; automated backups' },
        { name: 'Aurora', desc: 'MySQL/PostgreSQL compatible; 6-way replication; Aurora Serverless v2' },
        { name: 'DynamoDB', desc: 'NoSQL key-value; single-digit ms; GSI/LSI; Streams; DAX; On-Demand mode' },
        { name: 'ElastiCache', desc: 'Redis / Memcached; in-memory caching; Cluster Mode; backup/restore' },
        { name: 'Redshift', desc: 'Columnar data warehouse; RA3 nodes; Redshift Serverless; Spectrum for S3 queries' },
      ],
    },
    {
      category: 'Messaging & Integration', icon: '📨',
      items: [
        { name: 'SQS', desc: 'Queue; Standard (at-least-once) or FIFO; visibility timeout; DLQ' },
        { name: 'SNS', desc: 'Pub/Sub; fan-out to SQS/Lambda/HTTP; message filtering; FIFO topics' },
        { name: 'EventBridge', desc: 'Event bus; content-based routing; schema registry; cross-account; Pipes' },
        { name: 'Step Functions', desc: 'State machine orchestration; Standard (audit) vs Express (high-volume)' },
        { name: 'Kinesis', desc: 'Real-time streaming; Data Streams (shards), Firehose (S3/Redshift), Analytics' },
      ],
    },
    {
      category: 'Security', icon: '🔐',
      items: [
        { name: 'IAM', desc: 'Users, groups, roles, policies; key policy for KMS; permission boundaries; SCPs' },
        { name: 'KMS', desc: 'Key management; CMKs; envelope encryption; automatic rotation; multi-region keys' },
        { name: 'GuardDuty', desc: 'Threat detection from VPC Flow Logs/CloudTrail/DNS; ML-based; EventBridge alerts' },
        { name: 'WAF', desc: 'Web ACL; managed rules (OWASP); rate-based rules; geo-match; attaches to ALB/CF/APIGW' },
        { name: 'Secrets Manager', desc: 'Store/rotate secrets; RDS auto-rotation; cross-account access; pay per secret' },
      ],
    },
    {
      category: 'Operations & IaC', icon: '🔧',
      items: [
        { name: 'CloudWatch', desc: 'Metrics, alarms, Logs Insights, dashboards; EMF for custom metrics' },
        { name: 'X-Ray', desc: 'Distributed tracing; service map; subsegments; sampling rules; groups' },
        { name: 'CloudFormation', desc: 'IaC YAML/JSON; stacks; Change Sets; DeletionPolicy; nested stacks' },
        { name: 'CDK', desc: 'IaC in TypeScript/Python; L1/L2/L3 constructs; cdk deploy/diff/synth; bootstrap' },
        { name: 'Systems Manager', desc: 'Session Manager (no SSH keys); Parameter Store; Run Command; Patch Manager' },
      ],
    },
  ];

  patterns: ArchPattern[] = [
    {
      name: 'Serverless REST API',
      flow: 'Route 53 → CloudFront → API Gateway (HTTP API) → Lambda → DynamoDB',
      notes: [
        'Use JWT authoriser on API Gateway for auth — no Lambda needed for token validation',
        'CloudFront caches GET responses at edge; set Cache-Control on Lambda responses',
        'DynamoDB on-demand mode for variable traffic; provision for predictable high-volume',
        'Lambda Powertools for structured logging, tracing, and input validation',
      ],
    },
    {
      name: 'Container Microservices (Fargate)',
      flow: 'Route 53 → ALB → ECS Fargate (private subnet) → RDS Aurora (private subnet)',
      notes: [
        'ALB listener rules route by path (/api/users → users-service, /api/orders → orders-service)',
        'Services use task roles (IAM) — no credentials in environment variables',
        'RDS in a dedicated private subnet group; security group allows only ECS task SG',
        'ECR for container images; ECS pulls with VPC endpoint to avoid NAT charges',
      ],
    },
    {
      name: 'Event-Driven Data Pipeline',
      flow: 'S3 (raw) → S3 Event Notification → SQS → Lambda → S3 (processed) + DynamoDB',
      notes: [
        'S3 → SNS → SQS fan-out allows multiple consumers without re-reading S3',
        'SQS visibility timeout > Lambda max duration to prevent double-processing',
        'DLQ on the SQS queue; Lambda retries twice then sends to DLQ for investigation',
        'EventBridge Pipes simplifies the SQS → Lambda wiring with built-in filtering',
      ],
    },
    {
      name: 'Three-Tier Web App',
      flow: 'Route 53 → ALB (public subnet) → EC2 ASG (private subnet) → RDS Multi-AZ (private subnet)',
      notes: [
        'ALB in public subnet; EC2 in private subnet — outbound via NAT Gateway',
        'ASG with target tracking policy: scale on ALBRequestCountPerTarget',
        'RDS Multi-AZ for synchronous replication; read replicas for read-heavy loads',
        'ElastiCache Redis in front of RDS for session storage and hot data caching',
      ],
    },
    {
      name: 'Static Site + CDN',
      flow: 'S3 (static assets) → CloudFront → Route 53 (custom domain)',
      notes: [
        'Origin Access Control (OAC) on CloudFront; S3 bucket policy allows only CloudFront',
        'ACM certificate in us-east-1 (required for CloudFront, regardless of origin region)',
        'CloudFront function for URL rewrites (SPA routing: /path → /index.html)',
        'Enable CloudFront access logs to S3; use Athena for query-based log analysis',
      ],
    },
    {
      name: 'Multi-Account Organization',
      flow: 'Management Account → OU structure → SCPs → Member Accounts (workload/sandbox/security)',
      notes: [
        'Workload accounts per environment (prod, staging, dev) or per team for isolation',
        'Security account receives CloudTrail, Config, and Security Hub findings from all accounts',
        'SCPs at OU level: deny regions outside approved list, deny root user actions, enforce tagging',
        'IAM Identity Center (SSO) for single-sign-on across all accounts; no long-lived IAM users',
      ],
    },
  ];
}
