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
  selector: 'app-aws-ec2',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './ec2.html',
  styleUrl: './ec2.scss'
})
export class AwsEc2 {

  quickRef: QuickRefItem[] = [
    { name: 'Launch Template', type: 'class', desc: 'Versioned EC2 config: AMI, instance type, key pair, SG, user data — preferred over Launch Configurations.' },
    { name: 'Auto Scaling Group (ASG)', type: 'class', desc: 'Manages a fleet of EC2 instances across AZs; scales with policies or scheduled actions.' },
    { name: 'AMI', type: 'keyword', desc: 'Amazon Machine Image — OS + pre-installed software snapshot used to launch instances.' },
    { name: 'Security Group', type: 'keyword', desc: 'Stateful virtual firewall at the instance level — allow rules only, default deny.' },
    { name: 'User Data', type: 'keyword', desc: 'Shell script (base64) run once at first boot — used to install packages and configure software.' },
    { name: 'Instance Metadata', type: 'keyword', desc: 'HTTP endpoint 169.254.169.254 — exposes AMI ID, instance type, IAM role credentials, etc.' },
    { name: 'Spot Instance', type: 'keyword', desc: 'Unused EC2 capacity at up to 90% discount — can be interrupted with 2-min warning.' },
    { name: 'Placement Group', type: 'class', desc: 'Cluster (low latency), Spread (HA), or Partition (large distributed systems) instance placement.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'EC2 Instance Families',
      points: [
        'General purpose (M, T): balanced CPU/memory. T-series adds burstable CPU credits — t3.micro earns credits when idle, spends them under burst load.',
        'Compute optimised (C): high CPU-to-memory ratio — batch, HPC, gaming servers.',
        'Memory optimised (R, X, z): large in-memory datasets — Redis, SAP HANA, big data in-memory processing.',
        'Storage optimised (I, D, H): high sequential read/write throughput — NoSQL databases, data warehouses.',
        'Accelerated computing (P, G, Inf): GPU/FPGA — ML training, inference, video transcoding.',
        'Naming convention: family + generation + attributes + size — e.g. c7g.2xlarge = Compute, gen 7, Graviton (g), 2× vCPU.',
      ]
    },
    {
      heading: 'AMIs, Key Pairs & Security Groups',
      points: [
        'An AMI captures the root EBS snapshot, launch permissions, and block device mapping. Creating a custom AMI after configuring an instance gives you a "golden image" for fast, reproducible launches.',
        'Key pairs use RSA or ED25519. AWS stores the public key; you download the private key once — losing it means no SSH access unless you replace via EC2 instance connect or SSM Session Manager.',
        'Security groups are stateful: if you allow inbound port 80, the response traffic is automatically allowed — no separate outbound rule needed.',
        'You can have multiple security groups on one instance — effective rules are the union (most permissive wins). You can reference another SG as the source instead of a CIDR block.',
        'EC2 Instance Connect provides temporary SSH keys via the console/CLI — eliminates the need to distribute .pem files for web-based SSH access.',
      ]
    },
    {
      heading: 'EBS Volume Types',
      points: [
        'gp3 (General Purpose SSD): 3,000 IOPS and 125 MiB/s baseline decoupled from size — most workloads, cheaper than gp2.',
        'io2 Block Express: up to 256,000 IOPS per volume — mission-critical databases (Oracle, SQL Server).',
        'st1 (Throughput Optimised HDD): sequential big-data workloads — data warehouses, log processing. Cannot be boot volume.',
        'sc1 (Cold HDD): lowest cost — infrequently accessed cold data. Cannot be boot volume.',
        'EBS Multi-Attach (io1/io2 only): attach one volume to up to 16 Nitro instances in the same AZ — requires a cluster-aware filesystem (GFS2, OCFS2).',
        'EBS snapshots are incremental, stored in S3 (managed by AWS) — use Amazon Data Lifecycle Manager to automate snapshot schedules.',
      ]
    },
    {
      heading: 'Auto Scaling Groups',
      points: [
        'An ASG requires: a Launch Template, min/max/desired capacity, and at least two subnets across different AZs for high availability.',
        'Scaling policies: Target Tracking (e.g. keep CPU at 50%), Step Scaling (add N instances if CPU > 70%), Scheduled (known load patterns).',
        'Cooldown period (default 300 s) prevents rapid launch/terminate churn — the ASG waits before acting on another alarm.',
        'Instance warmup: new instances are excluded from metrics for a configurable period to avoid false scale-in triggers immediately after launch.',
        'Lifecycle hooks let you pause instances entering (launching) or leaving (terminating) the group — run custom scripts, drain connections, copy logs.',
        'ASG health checks can use EC2 status checks (default) or ELB health checks (preferred when behind a load balancer — catches app-level failures).',
      ]
    },
    {
      heading: 'Purchasing Options',
      points: [
        'On-Demand: pay per second (Linux) or per hour (Windows), no commitment — used for unpredictable workloads or baseline capacity.',
        'Reserved Instances / Savings Plans: 1- or 3-year commitment — up to 72% discount (standard RI) or 66% (Compute Savings Plan, flexible across instance families).',
        'Spot Instances: spare capacity, up to 90% discount — 2-minute interruption notice. Best for stateless, fault-tolerant workloads: batch, CI runners, ML training.',
        'Dedicated Hosts: physical server allocated to you — required for bring-your-own-license (BYOL) workloads like Oracle or Windows Server.',
        'Mixed instance ASG: combine On-Demand base capacity with Spot instances for cost-optimised scaling; the ASG automatically diversifies across Spot pools to reduce interruption risk.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Launch & Connect',
      language: 'bash',
      code: `# Create a key pair (save the .pem immediately — AWS does not store the private key)
aws ec2 create-key-pair --key-name my-key --query 'KeyMaterial' --output text > my-key.pem
chmod 400 my-key.pem

# Launch an EC2 instance with User Data
aws ec2 run-instances \\
  --image-id ami-0c02fb55956c7d316 \\   # Amazon Linux 2023
  --instance-type t3.micro \\
  --key-name my-key \\
  --security-group-ids sg-0abc12345 \\
  --subnet-id subnet-0def67890 \\
  --user-data '#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from EC2</h1>" > /var/www/html/index.html' \\
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=web-server}]' \\
  --count 1

# SSH into the instance
ssh -i my-key.pem ec2-user@<public-ip>

# Connect via SSM Session Manager (no key pair needed, no port 22 required)
aws ssm start-session --target i-0abc123456789

# Read instance metadata from inside the instance (IMDSv2)
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \\
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \\
  http://169.254.169.254/latest/meta-data/instance-id
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \\
  http://169.254.169.254/latest/meta-data/iam/security-credentials/`,
    },
    {
      label: 'Security Groups',
      language: 'bash',
      code: `# Create a security group
aws ec2 create-security-group \\
  --group-name web-sg \\
  --description "Web server security group" \\
  --vpc-id vpc-0abc12345

# Allow inbound HTTP and HTTPS from anywhere
aws ec2 authorize-security-group-ingress \\
  --group-id sg-0abc12345 \\
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \\
  --group-id sg-0abc12345 \\
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# Allow SSH only from your IP
aws ec2 authorize-security-group-ingress \\
  --group-id sg-0abc12345 \\
  --protocol tcp --port 22 --cidr $(curl -s ifconfig.me)/32

# Allow inbound from another security group (e.g. ALB SG)
aws ec2 authorize-security-group-ingress \\
  --group-id sg-0abc12345 \\
  --protocol tcp --port 8080 \\
  --source-group sg-alb-0def67890

# Describe security group rules
aws ec2 describe-security-group-rules \\
  --filters "Name=group-id,Values=sg-0abc12345"`,
    },
    {
      label: 'Auto Scaling Group',
      language: 'bash',
      code: `# Create a Launch Template
aws ec2 create-launch-template \\
  --launch-template-name web-lt \\
  --version-description "v1" \\
  --launch-template-data '{
    "ImageId": "ami-0c02fb55956c7d316",
    "InstanceType": "t3.micro",
    "KeyName": "my-key",
    "SecurityGroupIds": ["sg-0abc12345"],
    "UserData": "'"$(base64 -w 0 <<'EOF'
#!/bin/bash
yum install -y httpd
systemctl start httpd
EOF
)"'"
  }'

# Create an Auto Scaling Group across 2 AZs
aws autoscaling create-auto-scaling-group \\
  --auto-scaling-group-name web-asg \\
  --launch-template LaunchTemplateName=web-lt,Version='$Latest' \\
  --min-size 2 \\
  --max-size 6 \\
  --desired-capacity 2 \\
  --vpc-zone-identifier "subnet-0def67890,subnet-1abc23456" \\
  --health-check-type ELB \\
  --health-check-grace-period 60 \\
  --target-group-arns arn:aws:elasticloadbalancing:eu-west-1:123:targetgroup/web-tg/abc

# Attach Target Tracking Scaling Policy (keep avg CPU at 50%)
aws autoscaling put-scaling-policy \\
  --auto-scaling-group-name web-asg \\
  --policy-name cpu-target-tracking \\
  --policy-type TargetTrackingScaling \\
  --target-tracking-configuration '{
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ASGAverageCPUUtilization"
    },
    "TargetValue": 50.0
  }'

# Manually scale
aws autoscaling set-desired-capacity \\
  --auto-scaling-group-name web-asg \\
  --desired-capacity 4`,
    },
    {
      label: 'EBS Volumes',
      language: 'bash',
      code: `# Create a gp3 volume
aws ec2 create-volume \\
  --availability-zone eu-west-1a \\
  --volume-type gp3 \\
  --size 100 \\
  --iops 6000 \\
  --throughput 250 \\
  --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=data-vol}]'

# Attach the volume to an instance
aws ec2 attach-volume \\
  --volume-id vol-0abc12345 \\
  --instance-id i-0def67890 \\
  --device /dev/xvdf

# Format and mount (on the instance)
# sudo mkfs.ext4 /dev/xvdf
# sudo mkdir /data
# sudo mount /dev/xvdf /data
# echo "/dev/xvdf /data ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab

# Create a snapshot
aws ec2 create-snapshot \\
  --volume-id vol-0abc12345 \\
  --description "My data backup $(date +%Y-%m-%d)"

# Modify volume (resize online — no downtime needed for most types)
aws ec2 modify-volume \\
  --volume-id vol-0abc12345 \\
  --size 200 \\
  --iops 10000

# Check modification progress
aws ec2 describe-volumes-modifications \\
  --volume-ids vol-0abc12345`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using gp2 instead of gp3 (paying more for less)',
      wrong: `# gp2 IOPS are tied to volume size: 3 IOPS/GB
# 100 GB gp2 = 300 IOPS; to get 3000 IOPS you need 1 TB
--volume-type gp2 --size 100  # only 300 IOPS`,
      right: `# gp3 gives 3000 IOPS baseline regardless of size
--volume-type gp3 --size 100 --iops 3000 --throughput 125
# 20% cheaper than gp2 for equivalent capacity`,
      explanation: 'gp3 decouples IOPS and throughput from volume size and is 20% cheaper than gp2. There is almost no reason to choose gp2 for new volumes — migrate existing ones with ModifyVolume.'
    },
    {
      title: 'Security group allowing 0.0.0.0/0 on port 22',
      wrong: `aws ec2 authorize-security-group-ingress \\
  --protocol tcp --port 22 --cidr 0.0.0.0/0
# SSH open to the entire internet — brute-force target`,
      right: `# Restrict SSH to your IP, or better: use SSM Session Manager
aws ec2 authorize-security-group-ingress \\
  --protocol tcp --port 22 --cidr $(curl -s ifconfig.me)/32
# Or use SSM: no port 22 needed at all`,
      explanation: 'An internet-exposed port 22 attracts constant brute-force and credential-stuffing bots. Use SSM Session Manager for shell access — it requires no open ports and all commands are logged to CloudTrail and S3.'
    },
    {
      title: 'ASG health check type left as EC2 when behind an ALB',
      wrong: `--health-check-type EC2
# Instance passes EC2 check (kernel is running)
# but app on port 8080 is dead — ASG never replaces it`,
      right: `--health-check-type ELB
--health-check-grace-period 60
# ALB health check fails -> ASG terminates + replaces instance`,
      explanation: 'EC2 health check only verifies the instance is reachable at the hypervisor level. ELB health check validates application-level responses — this is what you actually want when running behind a load balancer.'
    },
    {
      title: 'Not enabling IMDSv2 — leaving metadata endpoint open to SSRF',
      wrong: `# Default: IMDSv1 allows any process on the instance to read
# curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
# — exploited in the Capital One breach via SSRF`,
      right: `# Enforce IMDSv2 at launch template level
aws ec2 modify-instance-metadata-options \\
  --instance-id i-0abc123 \\
  --http-tokens required \\
  --http-endpoint enabled`,
      explanation: 'IMDSv1 does not require a token — any SSRF vulnerability can read IAM credentials from the metadata endpoint. IMDSv2 requires a PUT request to obtain a session token first, which SSRF cannot do.'
    },
    {
      title: 'Placing all ASG instances in one AZ',
      wrong: `# Using a single subnet
--vpc-zone-identifier "subnet-0def67890"
# AZ failure = complete service outage`,
      right: `# Spread across at least 2 AZs
--vpc-zone-identifier "subnet-0def67890,subnet-1abc23456"
# ASG balances instances across both AZs automatically`,
      explanation: 'A single AZ means one AWS facility outage takes down all instances. ASGs with multi-AZ subnets automatically distribute capacity and rebalance when an AZ recovers, providing true high availability.'
    },
  ];

  challenge: Challenge = {
    title: 'Design an Auto Scaling Group Setup',
    language: 'typescript',
    description: `Write the AWS CLI commands to create a Launch Template and an Auto Scaling Group for a stateless web application. Requirements: Amazon Linux 2023 AMI, t3.small instances, port 80 open to the internet (port 22 restricted to 10.0.0.0/8), min 2 / max 8 instances, spread across 2 subnets, ELB health checks, and a Target Tracking policy to keep CPU at 60%.`,
    hints: [
      'Create the security group first, then reference it in the Launch Template.',
      'Launch Template user data must be base64 encoded when passed as a JSON string.',
      'Use --health-check-type ELB and set --health-check-grace-period.',
      'Target Tracking uses PredefinedMetricType ASGAverageCPUUtilization with TargetValue 60.',
      'Use $Latest for the Launch Template version in the ASG.',
    ],
    starterCode: `// Output the CLI commands as strings
const sgCommand = \`aws ec2 create-security-group \\
  --group-name web-sg \\
  --description "Web SG" \\
  --vpc-id vpc-REPLACE\`;

const ltCommand = \`aws ec2 create-launch-template \\
  --launch-template-name web-lt \\
  // TODO: add required params
\`;

const asgCommand = \`aws autoscaling create-auto-scaling-group \\
  --auto-scaling-group-name web-asg \\
  // TODO: add required params
\`;

const policyCommand = \`aws autoscaling put-scaling-policy \\
  // TODO: target tracking at 60% CPU
\`;

console.log(sgCommand, ltCommand, asgCommand, policyCommand);`,
    solution: `const sgCommand = \`
aws ec2 create-security-group \\
  --group-name web-sg \\
  --description "Web server SG" \\
  --vpc-id vpc-REPLACE

aws ec2 authorize-security-group-ingress \\
  --group-id sg-REPLACE --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \\
  --group-id sg-REPLACE --protocol tcp --port 22 --cidr 10.0.0.0/8
\`;

const ltCommand = \`
aws ec2 create-launch-template \\
  --launch-template-name web-lt \\
  --launch-template-data '{
    "ImageId": "ami-0c02fb55956c7d316",
    "InstanceType": "t3.small",
    "SecurityGroupIds": ["sg-REPLACE"],
    "MetadataOptions": { "HttpTokens": "required" },
    "UserData": "IyEvYmluL2Jhc2gKeXVtIGluc3RhbGwgLXkgaHR0cGQKc3lzdGVtY3RsIHN0YXJ0IGh0dHBkCg=="
  }'
\`;

const asgCommand = \`
aws autoscaling create-auto-scaling-group \\
  --auto-scaling-group-name web-asg \\
  --launch-template LaunchTemplateName=web-lt,Version='\\$Latest' \\
  --min-size 2 --max-size 8 --desired-capacity 2 \\
  --vpc-zone-identifier "subnet-AAA,subnet-BBB" \\
  --health-check-type ELB \\
  --health-check-grace-period 60
\`;

const policyCommand = \`
aws autoscaling put-scaling-policy \\
  --auto-scaling-group-name web-asg \\
  --policy-name cpu-tracking \\
  --policy-type TargetTrackingScaling \\
  --target-tracking-configuration '{
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ASGAverageCPUUtilization"
    },
    "TargetValue": 60.0
  }'
\`;

console.log(sgCommand, ltCommand, asgCommand, policyCommand);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which EBS volume type provides 3,000 IOPS baseline regardless of volume size?',
      options: ['gp2', 'gp3', 'io2', 'st1'],
      answer: 1,
      explanation: 'gp3 provides a baseline of 3,000 IOPS and 125 MiB/s throughput regardless of volume size, and these can be independently scaled up. gp2 ties IOPS to size (3 IOPS/GB), making large deployments expensive.'
    },
    {
      q: 'What does the ASG health check type ELB detect that EC2 health check cannot?',
      options: [
        'Whether the instance kernel is running',
        'Whether the instance type matches the launch template',
        'Whether the application is responding correctly on its health check endpoint',
        'Whether the IAM role is correctly attached'
      ],
      answer: 2,
      explanation: 'ELB health check validates application-level responses (HTTP 200 on a configured path). EC2 health check only verifies the instance is reachable at the hypervisor level — it misses app crashes, hung processes, and misconfigured apps.'
    },
    {
      q: 'What is the purpose of the ASG cooldown period?',
      options: [
        'Time to wait for new instances to warm up before sending traffic',
        'Minimum time between consecutive scaling activities to prevent thrashing',
        'Maximum time an instance can be unhealthy before termination',
        'Time after launch before ELB health checks begin'
      ],
      answer: 1,
      explanation: 'The cooldown period (default 300 s) prevents the ASG from initiating another scaling action while the previous one is still taking effect. Without it, CloudWatch alarms could trigger rapid launch/terminate cycles.'
    },
    {
      q: 'Which IMDSv2 requirement protects against SSRF exploitation of the instance metadata endpoint?',
      options: [
        'Disabling the metadata endpoint entirely',
        'Requiring a session token obtained via a PUT request before reading metadata',
        'Restricting metadata to port 443 only',
        'Requiring the instance to be in a private subnet'
      ],
      answer: 1,
      explanation: 'IMDSv2 requires a PUT request to obtain a session token before any GET request for metadata. SSRF attacks can only issue GET requests through the vulnerable application — the PUT requirement blocks them from reading IAM credentials.'
    },
    {
      q: 'Which EC2 instance family is best suited for in-memory databases like Redis or SAP HANA?',
      options: ['C (Compute optimised)', 'T (Burstable)', 'R (Memory optimised)', 'I (Storage optimised)'],
      answer: 2,
      explanation: 'R-series instances have the highest memory-to-vCPU ratio in EC2 — designed for memory-intensive workloads like in-memory databases, big-data analytics, and real-time caches. X-series goes even higher for the largest SAP HANA deployments.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a Launch Configuration and a Launch Template?',
      a: 'Launch Templates are the modern replacement for Launch Configurations. They support versioning, mixed instance types (Spot + On-Demand), T2/T3 unlimited mode, and all the latest instance features. Launch Configurations are immutable (no versioning) and no longer receive feature updates. AWS recommends migrating all ASGs to Launch Templates.'
    },
    {
      q: 'When should I use Spot Instances vs. On-Demand in an ASG?',
      a: 'Spot Instances are ideal for stateless, fault-tolerant workloads that can handle 2-minute interruption notices: batch processing, CI/CD runners, ML training. Use On-Demand for the baseline "must always be running" capacity and Spot for the scaling bursts. Mixed instance type ASGs let you configure On-Demand base capacity with Spot for the remainder, diversified across multiple Spot pools to minimise interruptions.'
    },
    {
      q: 'How does an ASG lifecycle hook work?',
      a: 'A lifecycle hook pauses an instance during the launch or termination process, placing it in a wait state. You configure an SNS notification or EventBridge rule that triggers a Lambda function — this function can drain connections, copy logs, warm up caches, or run tests. When complete, you call CompleteLifecycleAction to allow the instance to proceed. The hook has a configurable heartbeat timeout (default 1 hour) after which it auto-completes.'
    },
    {
      q: 'What happens when an ASG instance fails an ELB health check?',
      a: 'The ALB marks the target as unhealthy. After the ASG\'s health check grace period expires, the ASG detects the failure and terminates the unhealthy instance. It then launches a replacement in the same or another AZ to maintain the desired capacity. The terminated instance is quarantined and its lifecycle hooks fire before actual termination.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'EC2 provides flexible virtual machines; Launch Templates + ASGs enable auto-scaling across AZs; gp3 EBS and IMDSv2 are the current defaults for cost and security.',
    mustKnow: [
      'Instance families: T (burstable), M (general), C (compute), R (memory), I (storage), G/P (GPU)',
      'Security groups are stateful — inbound allow = outbound response automatically allowed',
      'gp3 is cheaper than gp2 and decouples IOPS/throughput from volume size',
      'ASG needs Launch Template + min/max/desired + multi-AZ subnets + health check type',
      'ELB health check detects app failures; EC2 health check only detects hypervisor failures',
      'IMDSv2 requires PUT session token — protects against SSRF exploitation',
      'Spot instances: 90% discount, 2-min interruption notice, use for fault-tolerant workloads',
    ],
    interviewFocus: [
      'gp3 vs gp2: IOPS/throughput decoupling and cost advantage',
      'Why ELB health check type is preferred over EC2 for ASGs behind load balancers',
      'IMDSv2 and how it prevents the Capital One-style SSRF attack vector',
      'Spot vs On-Demand in a mixed instance ASG — balancing cost and availability',
      'ASG lifecycle hooks — use cases for draining connections before termination',
    ],
  };
}
