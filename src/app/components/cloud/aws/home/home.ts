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
  { title: 'AWS Fundamentals', route: '/aws', badge: 'Foundations', description: 'Regions, availability zones, the shared responsibility model, and navigating the AWS Console and CLI.', keyPoints: ['Global regions and AZs', 'Shared responsibility model', 'AWS CLI configuration', 'IAM user vs role access', 'AWS Well-Architected Framework'], available: false },
  { title: 'EC2 & Auto Scaling', route: '/aws', badge: 'Compute', description: 'EC2 instance types, AMIs, key pairs, security groups, EBS, and Auto Scaling Groups.', keyPoints: ['Instance family naming', 'AMI selection', 'Security group inbound rules', 'EBS volume types (gp3, io2)', 'ASG launch templates'], available: false },
  { title: 'ECS & EKS', route: '/aws', badge: 'Compute', description: 'Container orchestration on AWS — ECS task definitions, Fargate, and EKS managed node groups.', keyPoints: ['ECS task and service', 'Fargate serverless containers', 'EKS managed node groups', 'ALB with ECS service', 'IRSA for pod IAM roles'], available: false },
  { title: 'VPC & Networking', route: '/aws', badge: 'Networking', description: 'VPC, subnets, route tables, internet/NAT gateways, security groups, NACLs, and VPC peering.', keyPoints: ['Public vs private subnets', 'Route table internet gateway', 'NAT Gateway for private egress', 'Security group vs NACL', 'VPC peering and Transit Gateway'], available: false },
  { title: 'Route 53 & CloudFront', route: '/aws', badge: 'Networking', description: 'DNS management with Route 53 routing policies and CDN acceleration with CloudFront.', keyPoints: ['Route 53 record types', 'Weighted, latency, failover routing', 'CloudFront distributions', 'Origin Access Control', 'HTTPS with ACM certificates'], available: false },
  { title: 'S3', route: '/aws', badge: 'Storage', description: 'Object storage — buckets, storage classes, versioning, lifecycle rules, replication, and presigned URLs.', keyPoints: ['S3 storage classes (Standard, IA, Glacier)', 'Versioning and delete markers', 'Lifecycle transition rules', 'Cross-region replication', 'Presigned URL generation'], available: false },
  { title: 'EBS, EFS & FSx', route: '/aws', badge: 'Storage', description: 'Block (EBS), file (EFS/FSx), and their performance characteristics, mount targets, and use cases.', keyPoints: ['EBS gp3 vs io2', 'EFS multi-AZ NFS', 'FSx for Windows / Lustre', 'EFS mount with ECS', 'Backup with AWS Backup'], available: false },
  { title: 'IAM', route: '/aws', badge: 'IAM', description: 'Users, groups, roles, policies, permission boundaries, SCPs, and the IAM evaluation logic.', keyPoints: ['Principle of least privilege', 'Policy JSON structure', 'IAM role assume role', 'Permission boundaries', 'Service Control Policies (SCP)'], available: false },
  { title: 'IAM Roles & Federation', route: '/aws', badge: 'IAM', description: 'Cross-account roles, OIDC federation, IRSA, AWS SSO, and identity federation patterns.', keyPoints: ['Cross-account AssumeRole', 'OIDC provider (GitHub Actions)', 'IRSA for Kubernetes pods', 'AWS IAM Identity Center (SSO)', 'STS temporary credentials'], available: false },
  { title: 'RDS & Aurora', route: '/aws', badge: 'Databases', description: 'Managed relational databases — RDS Multi-AZ, Aurora Global, read replicas, and Parameter Groups.', keyPoints: ['RDS Multi-AZ failover', 'Aurora vs RDS performance', 'Read replicas', 'Aurora Serverless v2', 'Enhanced monitoring'], available: false },
  { title: 'DynamoDB', route: '/aws', badge: 'Databases', description: 'Managed NoSQL — partition keys, sort keys, GSI, LSI, streams, DAX, and on-demand vs provisioned.', keyPoints: ['Partition + sort key design', 'GSI for alternate access patterns', 'Streams for change data capture', 'DAX caching layer', 'On-demand vs provisioned billing'], available: false },
  { title: 'Lambda', route: '/aws', badge: 'Serverless', description: 'Function-as-a-service — triggers, layers, concurrency, cold starts, and Lambda power tuning.', keyPoints: ['Event source mappings', 'Lambda layers for shared code', 'Provisioned vs reserved concurrency', 'Cold start optimisation', 'Lambda Power Tuning tool'], available: false },
  { title: 'API Gateway', route: '/aws', badge: 'Serverless', description: 'HTTP, REST, and WebSocket APIs — routes, authorisers, throttling, and CORS.', keyPoints: ['REST vs HTTP vs WebSocket API', 'Lambda authoriser', 'API key throttling', 'CORS configuration', 'Usage plans and stages'], available: false },
  { title: 'CloudWatch & X-Ray', route: '/aws', badge: 'Reference', description: 'Metrics, logs, alarms, dashboards with CloudWatch, and distributed tracing with X-Ray.', keyPoints: ['CloudWatch Metrics and Alarms', 'Log Insights query syntax', 'X-Ray service map', 'X-Ray SDK instrumentation', 'Embedded Metric Format'], available: false },
  { title: 'CloudFormation & CDK', route: '/aws', badge: 'Reference', description: 'AWS CloudFormation stacks and CDK to define infrastructure as code in TypeScript/Python.', keyPoints: ['CloudFormation stack lifecycle', 'CDK Constructs (L1/L2/L3)', 'cdk deploy / diff', 'CDK bootstrap', 'Change sets for safe updates'], available: false },
  { title: 'AWS Security Services', route: '/aws', badge: 'Reference', description: 'GuardDuty, Security Hub, Shield, WAF, Macie, and KMS for encryption key management.', keyPoints: ['GuardDuty threat detection', 'Security Hub findings aggregation', 'AWS WAF rules', 'KMS CMK key management', 'Macie for S3 data classification'], available: false },
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
