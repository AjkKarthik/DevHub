import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic { title: string; route: string; badge: string; description: string; keyPoints: string[]; available: boolean; }

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'Compute': 'compute', 'Networking': 'networking',
  'Storage': 'storage', 'IAM': 'iam', 'Databases': 'databases',
  'Serverless': 'serverless', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'Compute', 'Networking', 'Storage', 'IAM', 'Databases', 'Serverless', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'AWS Fundamentals', route: '/aws/fundamentals', badge: 'Foundations', description: 'Regions, availability zones, the shared responsibility model, and navigating the AWS Console and CLI.', keyPoints: ['Global regions and AZs', 'Shared responsibility model', 'AWS CLI configuration', 'IAM user vs role access', 'AWS Well-Architected Framework'], available: true },
  { title: 'EC2 & Auto Scaling', route: '/aws/ec2', badge: 'Compute', description: 'EC2 instance types, AMIs, key pairs, security groups, EBS, and Auto Scaling Groups.', keyPoints: ['Instance family naming', 'AMI selection', 'Security group inbound rules', 'EBS volume types (gp3, io2)', 'ASG launch templates'], available: true },
  { title: 'ECS & EKS', route: '/aws/ecs-eks', badge: 'Compute', description: 'Container orchestration on AWS — ECS task definitions, Fargate, and EKS managed node groups.', keyPoints: ['ECS task and service', 'Fargate serverless containers', 'EKS managed node groups', 'ALB with ECS service', 'IRSA for pod IAM roles'], available: true },
  { title: 'VPC & Networking', route: '/aws/vpc', badge: 'Networking', description: 'VPC, subnets, route tables, internet/NAT gateways, security groups, NACLs, and VPC peering.', keyPoints: ['Public vs private subnets', 'Route table internet gateway', 'NAT Gateway for private egress', 'Security group vs NACL', 'VPC peering and Transit Gateway'], available: true },
  { title: 'Route 53 & CloudFront', route: '/aws/route53-cloudfront', badge: 'Networking', description: 'DNS management with Route 53 routing policies and CDN acceleration with CloudFront.', keyPoints: ['Route 53 record types', 'Weighted, latency, failover routing', 'CloudFront distributions', 'Origin Access Control', 'HTTPS with ACM certificates'], available: true },
  { title: 'S3', route: '/aws/s3', badge: 'Storage', description: 'Object storage — buckets, storage classes, versioning, lifecycle rules, replication, and presigned URLs.', keyPoints: ['S3 storage classes (Standard, IA, Glacier)', 'Versioning and delete markers', 'Lifecycle transition rules', 'Cross-region replication', 'Presigned URL generation'], available: true },
  { title: 'EBS, EFS & FSx', route: '/aws/ebs-efs', badge: 'Storage', description: 'Block (EBS), file (EFS/FSx), and their performance characteristics, mount targets, and use cases.', keyPoints: ['EBS gp3 vs io2', 'EFS multi-AZ NFS', 'FSx for Windows / Lustre', 'EFS mount with ECS', 'Backup with AWS Backup'], available: true },
  { title: 'IAM', route: '/aws/iam', badge: 'IAM', description: 'Users, groups, roles, policies, permission boundaries, SCPs, and the IAM evaluation logic.', keyPoints: ['Principle of least privilege', 'Policy JSON structure', 'IAM role assume role', 'Permission boundaries', 'Service Control Policies (SCP)'], available: true },
  { title: 'IAM Roles & Federation', route: '/aws/iam-roles', badge: 'IAM', description: 'Cross-account roles, OIDC federation, IRSA, AWS SSO, and identity federation patterns.', keyPoints: ['Cross-account AssumeRole', 'OIDC provider (GitHub Actions)', 'IRSA for Kubernetes pods', 'AWS IAM Identity Center (SSO)', 'STS temporary credentials'], available: true },
  { title: 'RDS & Aurora', route: '/aws/rds-aurora', badge: 'Databases', description: 'Managed relational databases — RDS Multi-AZ, Aurora Global, read replicas, and Parameter Groups.', keyPoints: ['RDS Multi-AZ failover', 'Aurora vs RDS performance', 'Read replicas', 'Aurora Serverless v2', 'Enhanced monitoring'], available: true },
  { title: 'DynamoDB', route: '/aws/dynamodb', badge: 'Databases', description: 'Managed NoSQL — partition keys, sort keys, GSI, LSI, streams, DAX, and on-demand vs provisioned.', keyPoints: ['Partition + sort key design', 'GSI for alternate access patterns', 'Streams for change data capture', 'DAX caching layer', 'On-demand vs provisioned billing'], available: false },
  { title: 'Lambda', route: '/aws/lambda', badge: 'Serverless', description: 'Function-as-a-service — triggers, layers, concurrency, cold starts, and Lambda power tuning.', keyPoints: ['Event source mappings', 'Lambda layers for shared code', 'Provisioned vs reserved concurrency', 'Cold start optimisation', 'Lambda Power Tuning tool'], available: false },
  { title: 'API Gateway', route: '/aws/api-gateway', badge: 'Serverless', description: 'HTTP, REST, and WebSocket APIs — routes, authorisers, throttling, and CORS.', keyPoints: ['REST vs HTTP vs WebSocket API', 'Lambda authoriser', 'API key throttling', 'CORS configuration', 'Usage plans and stages'], available: false },
  { title: 'CloudWatch & X-Ray', route: '/aws/cloudwatch', badge: 'Reference', description: 'Metrics, logs, alarms, dashboards with CloudWatch, and distributed tracing with X-Ray.', keyPoints: ['CloudWatch Metrics and Alarms', 'Log Insights query syntax', 'X-Ray service map', 'X-Ray SDK instrumentation', 'Embedded Metric Format'], available: false },
  { title: 'CloudFormation & CDK', route: '/aws/cloudformation-cdk', badge: 'Reference', description: 'AWS CloudFormation stacks and CDK to define infrastructure as code in TypeScript/Python.', keyPoints: ['CloudFormation stack lifecycle', 'CDK Constructs (L1/L2/L3)', 'cdk deploy / diff', 'CDK bootstrap', 'Change sets for safe updates'], available: false },
  { title: 'AWS Security Services', route: '/aws/security', badge: 'Reference', description: 'GuardDuty, Security Hub, Shield, WAF, Macie, and KMS for encryption key management.', keyPoints: ['GuardDuty threat detection', 'Security Hub findings aggregation', 'AWS WAF rules', 'KMS CMK key management', 'Macie for S3 data classification'], available: false },
  { title: 'SQS & SNS', route: '/aws/sqs-sns', badge: 'Serverless', description: 'Decouple services with SQS queues and SNS fan-out — FIFO, dead-letter queues, and message filtering.', keyPoints: ['SQS Standard vs FIFO queue', 'Visibility timeout prevents double-processing', 'Dead-letter queue for failed messages', 'SNS topic → multiple SQS subscriptions (fan-out)', 'Message filtering by attribute'], available: false },
  { title: 'EventBridge', route: '/aws/eventbridge', badge: 'Serverless', description: 'Event bus for event-driven architectures — rules, targets, schema registry, and cross-account events.', keyPoints: ['Default event bus + custom buses', 'Rules: pattern matching on event JSON', 'Targets: Lambda, SQS, Step Functions, HTTP', 'Schema registry: discover and document events', 'Partner event sources (Stripe, Zendesk)'], available: false },
  { title: 'AWS Step Functions', route: '/aws/step-functions', badge: 'Serverless', description: 'Orchestrate Lambda and AWS services with state machines — Express vs Standard workflows.', keyPoints: ['State machine: JSON definition of states', 'Task state: invoke Lambda or service integration', 'Choice state: branching logic', 'Standard: audit history; Express: high-volume fast', 'Error handling: Catch and Retry fields'], available: false },
  { title: 'Elastic Load Balancing', route: '/aws/load-balancing', badge: 'Networking', description: 'ALB (L7), NLB (L4), and GLB (L7 appliances) — listeners, target groups, health checks, and sticky sessions.', keyPoints: ['ALB: HTTP/HTTPS routing by path/host/header', 'NLB: TCP/UDP ultra-low latency', 'Target groups: EC2, Lambda, IP, Fargate', 'Health check configuration (path, thresholds)', 'Access logs to S3 for debugging'], available: true },
  { title: 'AWS Cost Optimization', route: '/aws/cost-optimization', badge: 'Reference', description: 'Reserved Instances, Savings Plans, Spot instances, Cost Explorer, and Trusted Advisor recommendations.', keyPoints: ['Savings Plans: 1/3-year commitment, 66% discount', 'Spot Instances: 90% discount for fault-tolerant workloads', 'Cost Explorer: 13-month history + forecasting', 'AWS Budgets: alert at % threshold', 'Rightsizing: Compute Optimizer recommendations'], available: false },
  { title: 'AWS Cheat Sheet', route: '/aws/cheatsheet', badge: 'Reference', description: 'AWS CLI commands, service acronyms, IAM patterns, and common architecture quick reference.', keyPoints: ['aws configure; aws sts get-caller-identity', 'Key service acronyms: EC2, ECS, EKS, RDS, S3, IAM, VPC', 'Common patterns: ALB → ECS Fargate → RDS in private subnet'], available: false },
];

@Component({ selector: 'app-aws-home', standalone: true, imports: [RouterLink], templateUrl: './home.html', styleUrl: './home.scss' })
export class AwsHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
