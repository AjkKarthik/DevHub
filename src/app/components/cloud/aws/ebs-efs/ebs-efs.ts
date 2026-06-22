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
  selector: 'app-aws-ebs-efs',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './ebs-efs.html',
  styleUrl: './ebs-efs.scss'
})
export class AwsEbsEfs {

  quickRef: QuickRefItem[] = [
    { name: 'EBS gp3', type: 'class', desc: 'General purpose SSD: 3,000 IOPS + 125 MiB/s baseline, independently scalable. Cheaper than gp2.' },
    { name: 'EBS io2 Block Express', type: 'class', desc: 'High-performance SSD: up to 256,000 IOPS, sub-millisecond latency — for mission-critical databases.' },
    { name: 'EFS', type: 'class', desc: 'Managed NFS file system: elastic, multi-AZ, thousands of concurrent connections, pay-per-use.' },
    { name: 'EFS Access Point', type: 'class', desc: 'Application-specific entry to EFS with enforced POSIX identity and root directory — simplifies multi-tenant access.' },
    { name: 'FSx for Windows', type: 'class', desc: 'Managed Windows-native file system (SMB/NTFS, Active Directory integration, DFS namespaces).' },
    { name: 'FSx for Lustre', type: 'class', desc: 'High-performance parallel file system for HPC, ML training — integrates with S3 for data repository.' },
    { name: 'AWS Backup', type: 'class', desc: 'Centralised backup service for EBS, EFS, RDS, DynamoDB, FSx — policy-driven schedules and retention.' },
    { name: 'EBS Multi-Attach', type: 'keyword', desc: 'Attach one io1/io2 volume to up to 16 Nitro instances in the same AZ — requires cluster-aware filesystem.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'EBS Volume Types',
      points: [
        'gp3 (General Purpose SSD): baseline 3,000 IOPS and 125 MiB/s throughput regardless of size. IOPS (up to 16,000) and throughput (up to 1,000 MiB/s) are independently configurable. ~20% cheaper than gp2.',
        'gp2 (legacy): IOPS tied to size at 3 IOPS/GB (min 100, max 16,000). I/O credits burst to 3,000 IOPS for small volumes. Still common in older accounts — migrate to gp3 for cost savings.',
        'io2 Block Express: highest EBS performance — up to 256,000 IOPS, 4,000 MiB/s throughput, sub-ms latency. 99.999% durability. Required for largest Oracle and SQL Server deployments.',
        'st1 (Throughput Optimised HDD): sequential read/write optimised, up to 500 MiB/s. Best for log processing, big data, data warehouses. Cannot be boot volume. Min 125 GiB.',
        'sc1 (Cold HDD): lowest cost EBS, up to 250 MiB/s. For infrequently accessed cold data. Cannot be boot volume. Min 125 GiB.',
      ]
    },
    {
      heading: 'EBS Operations',
      points: [
        'EBS volumes are AZ-specific — a volume in eu-west-1a cannot be attached to an instance in eu-west-1b. To move: create a snapshot, then create a new volume from the snapshot in the target AZ.',
        'ModifyVolume allows online resizing and type changes — no downtime for most volume types on Nitro-based instances. After modification, extend the filesystem inside the OS (resize2fs for ext4, xfs_growfs for XFS).',
        'EBS snapshots are incremental and stored in S3 (managed by AWS). The first snapshot is a full copy; subsequent snapshots only store changed blocks.',
        'EBS Multi-Attach (io1/io2 only, same AZ, up to 16 Nitro instances): requires a cluster-aware filesystem (GFS2, OCFS2) — standard filesystems (ext4, XFS) will corrupt data under concurrent multi-attach writes.',
        'Amazon Data Lifecycle Manager (DLM): automates EBS snapshot creation and retention — define policies with schedules and retention counts. Cheaper and simpler than custom Lambda-based snapshot scripts.',
      ]
    },
    {
      heading: 'Amazon EFS',
      points: [
        'EFS is a managed NFS (NFSv4.1/4.2) file system — elastic (auto-grows/shrinks), multi-AZ via mount targets, supports thousands of concurrent NFS connections.',
        'Performance modes: General Purpose (latency-optimised, default) and Max I/O (higher throughput, higher latency — for highly parallel workloads like big data). Cannot change after creation.',
        'Throughput modes: Elastic Throughput (auto-scales, pay-per-use — default for new file systems), Bursting (throughput tied to storage size), Provisioned (fixed MiB/s regardless of storage).',
        'Storage tiers: Standard, Standard-IA, One Zone, One Zone-IA. Lifecycle policy automatically moves files not accessed for 7/14/30/60/90 days to IA tier. EFS Intelligent-Tiering automates this.',
        'EFS Access Points enforce a specific POSIX user/group and root directory per application — each ECS task or Lambda can have its own access point for isolation within the same EFS filesystem.',
      ]
    },
    {
      heading: 'Amazon FSx',
      points: [
        'FSx for Windows File Server: managed Windows-native SMB file system, integrates with Active Directory, supports DFS namespaces, shadow copies, and Windows ACLs. For lift-and-shift Windows workloads.',
        'FSx for Lustre: high-performance parallel file system — sub-millisecond latency, millions of IOPS, hundreds of GiB/s throughput. Integrates natively with S3 as a data repository.',
        'FSx for NetApp ONTAP: managed NetApp — iSCSI, NFS, SMB, multi-protocol. For workloads already using NetApp features (SnapMirror, clones, deduplication).',
        'FSx for OpenZFS: managed OpenZFS — NFS, low latency, snapshots, clones. For workloads migrating from on-prem ZFS systems.',
        'Choose FSx for Windows for enterprise Windows file shares and AD integration. Choose FSx for Lustre for ML training, HPC, and video processing requiring peak throughput.',
      ]
    },
    {
      heading: 'AWS Backup',
      points: [
        'AWS Backup is a centralised backup service supporting EBS snapshots, EFS backups, RDS/Aurora, DynamoDB, FSx, EC2 AMI backups, and Storage Gateway volumes.',
        'Backup plans define: schedule (cron), retention period, lifecycle (move to cold storage after N days), and copy jobs to replicate backups to another region.',
        'Backup vaults store backup recovery points. Vault Lock (WORM) prevents deletion of recovery points — useful for compliance mandating immutable backups.',
        'EFS backups via AWS Backup are incremental and stored in a managed S3 bucket (not visible in your account). Restores can go to the original EFS or a new EFS filesystem.',
        'Cross-account backup: copy backup to a separate "backup account" for protection against accidental or malicious deletion in the production account.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'EBS Volume Management',
      language: 'bash',
      code: `# Create a gp3 volume with custom IOPS and throughput
aws ec2 create-volume \\
  --availability-zone eu-west-1a \\
  --volume-type gp3 \\
  --size 200 \\
  --iops 6000 \\
  --throughput 250 \\
  --encrypted \\
  --kms-key-id arn:aws:kms:eu-west-1:123:key/abc \\
  --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=app-data}]'

# Attach to an instance
aws ec2 attach-volume \\
  --volume-id vol-0abc123 \\
  --instance-id i-0def456 \\
  --device /dev/xvdf

# Format and mount (run inside the instance)
# sudo mkfs.xfs /dev/nvme1n1        # Nitro instances use nvme devices
# sudo mkdir -p /data
# sudo mount /dev/nvme1n1 /data
# echo "/dev/nvme1n1 /data xfs defaults,nofail 0 2" | sudo tee -a /etc/fstab

# Online resize (no downtime on Nitro instances)
aws ec2 modify-volume --volume-id vol-0abc123 --size 400 --iops 10000

# After AWS modifies: extend filesystem inside OS
# sudo xfs_growfs /data              # for XFS
# sudo resize2fs /dev/nvme1n1        # for ext4

# Create snapshot for backup
aws ec2 create-snapshot \\
  --volume-id vol-0abc123 \\
  --description "Pre-upgrade backup $(date +%Y-%m-%d)"

# Automate snapshots with DLM
aws dlm create-lifecycle-policy \\
  --description "Daily EBS snapshots" \\
  --state ENABLED \\
  --execution-role-arn arn:aws:iam::123:role/AWSDataLifecycleManagerDefaultRole \\
  --policy-details '{
    "PolicyType": "EBS_SNAPSHOT_MANAGEMENT",
    "ResourceTypes": ["VOLUME"],
    "TargetTags": [{"Key": "Backup", "Value": "true"}],
    "Schedules": [{
      "Name": "Daily",
      "CreateRule": { "Interval": 24, "IntervalUnit": "HOURS", "Times": ["02:00"] },
      "RetainRule": { "Count": 7 },
      "CopyTags": true
    }]
  }'`,
    },
    {
      label: 'EFS Setup & Mount',
      language: 'bash',
      code: `# Create EFS filesystem with Elastic Throughput
EFS_ID=$(aws efs create-file-system \\
  --performance-mode generalPurpose \\
  --throughput-mode elastic \\
  --encrypted \\
  --kms-key-id arn:aws:kms:eu-west-1:123:key/abc \\
  --tags Key=Name,Value=shared-fs \\
  --query 'FileSystemId' --output text)

# Create mount targets in each AZ (one per subnet)
aws efs create-mount-target \\
  --file-system-id $EFS_ID \\
  --subnet-id subnet-private-1a \\
  --security-groups sg-efs-0abc123

aws efs create-mount-target \\
  --file-system-id $EFS_ID \\
  --subnet-id subnet-private-1b \\
  --security-groups sg-efs-0abc123

# Mount EFS on EC2 (using amazon-efs-utils)
# sudo apt-get install -y amazon-efs-utils
# sudo mkdir /mnt/efs
# sudo mount -t efs -o tls $EFS_ID:/ /mnt/efs
# echo "$EFS_ID:/ /mnt/efs efs _netdev,tls 0 0" | sudo tee -a /etc/fstab

# Create Access Point (isolate per application)
aws efs create-access-point \\
  --file-system-id $EFS_ID \\
  --posix-user Uid=1000,Gid=1000 \\
  --root-directory 'Path=/app1,CreationInfo={OwnerUid=1000,OwnerGid=1000,Permissions=755}'

# Enable EFS Intelligent-Tiering (moves cold files to IA automatically)
aws efs put-lifecycle-configuration \\
  --file-system-id $EFS_ID \\
  --lifecycle-policies '[
    {"TransitionToIA": "AFTER_30_DAYS"},
    {"TransitionToPrimaryStorageClass": "AFTER_1_ACCESS"}
  ]'`,
    },
    {
      label: 'EFS with ECS Fargate',
      language: 'bash',
      code: `# Register task definition with EFS volume mount
aws ecs register-task-definition \\
  --family app-with-efs \\
  --network-mode awsvpc \\
  --requires-compatibilities FARGATE \\
  --cpu "512" --memory "1024" \\
  --execution-role-arn arn:aws:iam::123:role/ecsTaskExecutionRole \\
  --volumes '[{
    "name": "shared-data",
    "efsVolumeConfiguration": {
      "fileSystemId": "fs-0abc12345",
      "rootDirectory": "/",
      "transitEncryption": "ENABLED",
      "authorizationConfig": {
        "accessPointId": "fsap-0abc123",
        "iam": "ENABLED"
      }
    }
  }]' \\
  --container-definitions '[{
    "name": "app",
    "image": "123456789012.dkr.ecr.eu-west-1.amazonaws.com/app:latest",
    "mountPoints": [{
      "sourceVolume": "shared-data",
      "containerPath": "/app/data",
      "readOnly": false
    }]
  }]'

# Security group for EFS mount targets must allow NFS (port 2049)
# from the ECS task security group
aws ec2 authorize-security-group-ingress \\
  --group-id sg-efs-0abc123 \\
  --protocol tcp \\
  --port 2049 \\
  --source-group sg-ecs-tasks`,
    },
    {
      label: 'AWS Backup',
      language: 'bash',
      code: `# Create a backup vault
aws backup create-backup-vault \\
  --backup-vault-name prod-vault \\
  --encryption-key-arn arn:aws:kms:eu-west-1:123:key/abc

# Create a backup plan (daily + weekly)
aws backup create-backup-plan \\
  --backup-plan '{
    "BackupPlanName": "prod-backup-plan",
    "Rules": [
      {
        "RuleName": "daily-backups",
        "TargetBackupVaultName": "prod-vault",
        "ScheduleExpression": "cron(0 2 ? * * *)",
        "StartWindowMinutes": 60,
        "CompletionWindowMinutes": 180,
        "Lifecycle": {
          "MoveToColdStorageAfterDays": 30,
          "DeleteAfterDays": 90
        }
      },
      {
        "RuleName": "weekly-cross-region",
        "TargetBackupVaultName": "prod-vault",
        "ScheduleExpression": "cron(0 3 ? * 1 *)",
        "CopyActions": [{
          "DestinationBackupVaultArn": "arn:aws:backup:us-east-1:123:backup-vault:dr-vault",
          "Lifecycle": { "DeleteAfterDays": 365 }
        }]
      }
    ]
  }'

# Assign resources by tag
aws backup create-backup-selection \\
  --backup-plan-id PLAN_ID \\
  --backup-selection '{
    "SelectionName": "tagged-resources",
    "IamRoleArn": "arn:aws:iam::123:role/AWSBackupDefaultServiceRole",
    "ListOfTags": [{
      "ConditionType": "STRINGEQUALS",
      "ConditionKey": "Backup",
      "ConditionValue": "true"
    }]
  }'`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using gp2 instead of gp3 for new volumes',
      wrong: `--volume-type gp2 --size 100
# 100 GiB gp2 = 300 IOPS (3×100), max burst 3,000
# Cost: $10/month
# To get 6,000 IOPS you need 2,000 GiB = $200/month`,
      right: `--volume-type gp3 --size 100 --iops 6000 --throughput 250
# 100 GiB gp3 = 6,000 IOPS regardless of size
# Cost: $8/month + $0.40 IOPS premium = ~$10.40/month total
# 20% cheaper than equivalent gp2 configuration`,
      explanation: 'gp3 decouples IOPS from size and costs 20% less than gp2 per GB. There is essentially no reason to choose gp2 for new volumes. Existing gp2 volumes can be migrated online with ModifyVolume (no downtime) — a significant cost saving at scale.'
    },
    {
      title: 'EBS Multi-Attach with a non-cluster-aware filesystem',
      wrong: `# Attached vol-0abc123 to instances i-001 and i-002
# Both mounted ext4 simultaneously
# Result: filesystem corruption — data loss`,
      right: `# EBS Multi-Attach is only safe with cluster-aware filesystems
# Use GFS2 or OCFS2 for concurrent write access
# OR: use EFS instead for a simpler shared-file-system solution`,
      explanation: 'EBS Multi-Attach allows simultaneous attachment but does NOT coordinate filesystem access. Standard filesystems (ext4, XFS) do not handle concurrent writes from multiple hosts and will corrupt data. Use a cluster-aware filesystem or switch to EFS for simpler shared-access scenarios.'
    },
    {
      title: 'EFS security group not allowing NFS port from ECS task SG',
      wrong: `# EFS mount target SG: only allows 443 (HTTPS)
# ECS tasks try to mount EFS via NFS
# Error: Connection timed out — port 2049 blocked`,
      right: `# EFS mount target SG must allow TCP 2049 from the ECS task SG
aws ec2 authorize-security-group-ingress \\
  --group-id sg-efs \\
  --protocol tcp --port 2049 \\
  --source-group sg-ecs-tasks`,
      explanation: 'NFS uses port 2049. The EFS mount target security group must explicitly allow inbound TCP 2049 from the security group of the mounting resource (EC2, ECS tasks, Lambda). Missing this rule is the most common reason EFS mounts fail.'
    },
    {
      title: 'Not extending the OS filesystem after EBS volume resize',
      wrong: `# Extended volume from 100 GiB to 200 GiB in AWS console
aws ec2 modify-volume --volume-id vol-abc --size 200
# df -h still shows 100 GiB — AWS resized the block device
# but the OS filesystem was not extended`,
      right: `# After AWS modifies the volume, extend the filesystem
# For XFS:
sudo xfs_growfs /data
# For ext4:
sudo resize2fs /dev/nvme1n1
# For partition-based volumes, also grow the partition first:
sudo growpart /dev/nvme1n1 1`,
      explanation: 'AWS ModifyVolume resizes the underlying block device but does not touch the filesystem. The OS filesystem must be manually extended. XFS uses xfs_growfs (mount-point path), ext4 uses resize2fs (device path). Both can be done online without unmounting.'
    },
    {
      title: 'Using EFS Bursting mode for consistently high-throughput workloads',
      wrong: `# EFS Bursting mode throughput = 50 MiB/s per TiB stored
# 100 GiB EFS = ~5 MiB/s baseline, 100 MiB/s burst
# CI/CD artifact store hitting 50 MiB/s constantly
# Bursts deplete; throughput drops to 5 MiB/s — pipeline slowdowns`,
      right: `# Use Elastic Throughput (auto-scales) or Provisioned Throughput
aws efs create-file-system --throughput-mode elastic
# OR for predictable needs:
aws efs create-file-system --throughput-mode provisioned \\
  --provisioned-throughput-in-mibps 100`,
      explanation: 'EFS Bursting mode works well for intermittent access but poorly for sustained high throughput on small file systems. Elastic Throughput (default for new EFS) auto-scales without burst credits. Provisioned Throughput gives a fixed MiB/s for predictable high-demand workloads.'
    },
  ];

  challenge: Challenge = {
    title: 'EFS Access Point for Multi-Tenant ECS',
    language: 'typescript',
    description: `Write the AWS CLI commands to set up an EFS file system with two access points — one for 'service-a' (POSIX UID/GID 1001, root /service-a) and one for 'service-b' (POSIX UID/GID 1002, root /service-b). Both access points should enforce their POSIX identity and create their root directory with 755 permissions if it doesn't exist.`,
    hints: [
      'Create the EFS file system first, then the access points.',
      'Each access point needs posix-user (Uid, Gid) and root-directory (Path + CreationInfo).',
      'CreationInfo needs OwnerUid, OwnerGid, and Permissions (octal string like "755").',
      'The EFS security group must allow port 2049 from the ECS task security group.',
    ],
    starterCode: `// Output the CLI commands as template strings
const EFS_ID = "fs-0abc12345";

const createEfs = \`aws efs create-file-system \\
  --performance-mode generalPurpose \\
  --throughput-mode elastic \\
  --encrypted\`;

const accessPointA = \`aws efs create-access-point \\
  --file-system-id \${EFS_ID} \\
  // TODO: posix-user for service-a (uid 1001, gid 1001)
  // TODO: root-directory /service-a with 755 permissions
\`;

const accessPointB = \`aws efs create-access-point \\
  // TODO: service-b (uid 1002, gid 1002, /service-b)
\`;

console.log(createEfs, accessPointA, accessPointB);`,
    solution: `const EFS_ID = "fs-0abc12345";

const createEfs = \`
aws efs create-file-system \\
  --performance-mode generalPurpose \\
  --throughput-mode elastic \\
  --encrypted \\
  --tags Key=Name,Value=shared-fs
\`;

const accessPointA = \`
aws efs create-access-point \\
  --file-system-id \${EFS_ID} \\
  --posix-user 'Uid=1001,Gid=1001' \\
  --root-directory 'Path=/service-a,CreationInfo={OwnerUid=1001,OwnerGid=1001,Permissions=755}' \\
  --tags Key=Name,Value=service-a-ap
\`;

const accessPointB = \`
aws efs create-access-point \\
  --file-system-id \${EFS_ID} \\
  --posix-user 'Uid=1002,Gid=1002' \\
  --root-directory 'Path=/service-b,CreationInfo={OwnerUid=1002,OwnerGid=1002,Permissions=755}' \\
  --tags Key=Name,Value=service-b-ap
\`;

const sgRule = \`
# Allow NFS from ECS task security group to EFS mount target SG
aws ec2 authorize-security-group-ingress \\
  --group-id sg-efs \\
  --protocol tcp --port 2049 \\
  --source-group sg-ecs-tasks
\`;

console.log(createEfs, accessPointA, accessPointB, sgRule);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which EBS volume type provides the highest IOPS for mission-critical databases?',
      options: ['gp3', 'gp2', 'io2 Block Express', 'st1'],
      answer: 2,
      explanation: 'io2 Block Express supports up to 256,000 IOPS per volume with sub-millisecond latency and 99.999% durability. It is designed for the largest Oracle and SQL Server deployments where gp3\'s maximum of 16,000 IOPS is insufficient.'
    },
    {
      q: 'What is the maximum number of EC2 instances an io2 EBS volume can be attached to simultaneously (EBS Multi-Attach)?',
      options: ['2', '8', '16', '64'],
      answer: 2,
      explanation: 'EBS Multi-Attach supports up to 16 Nitro-based EC2 instances in the same AZ simultaneously. This requires a cluster-aware filesystem (GFS2, OCFS2) — standard filesystems like ext4 or XFS will corrupt data under concurrent writes.'
    },
    {
      q: 'Which EFS throughput mode automatically scales throughput based on workload without burst credits?',
      options: ['Bursting', 'Provisioned', 'Elastic', 'Max I/O'],
      answer: 2,
      explanation: 'Elastic Throughput (new default for EFS) automatically scales throughput up and down based on workload — no burst credits, no pre-provisioning. You pay only for what you use. Bursting requires accumulated burst credits; Provisioned requires you to specify a fixed MiB/s.'
    },
    {
      q: 'After using AWS ModifyVolume to resize an EBS volume online, what else must you do?',
      options: [
        'Reboot the instance to apply the change',
        'Detach and reattach the volume',
        'Extend the filesystem inside the OS (xfs_growfs or resize2fs)',
        'Nothing — the filesystem expands automatically'
      ],
      answer: 2,
      explanation: 'ModifyVolume resizes the block device but does not touch the filesystem. You must run xfs_growfs (for XFS), resize2fs (for ext4), or extend the partition first (growpart) if needed. Both commands work online without unmounting.'
    },
    {
      q: 'Which NFS port must the EFS mount target security group allow inbound?',
      options: ['443', '2049', '111', '8080'],
      answer: 1,
      explanation: 'NFS uses TCP port 2049. The EFS mount target security group must allow inbound TCP 2049 from the security group of the mounting resource (EC2 instance, ECS task, Lambda). Missing this rule is the most frequent cause of EFS mount timeouts.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use EFS vs EBS?',
      a: 'EBS: single-instance block storage — OS boot volumes, database data files, high-performance SSD workloads, snapshots. AZ-local, low latency. EFS: shared file storage — content shared across multiple EC2 instances, ECS tasks, or Lambda functions simultaneously; DevOps artifact stores; CMS media libraries. Multi-AZ, elastic, NFS protocol. Choose EFS when multiple compute resources need concurrent read/write access to the same files. Choose EBS when a single instance needs high IOPS block storage.'
    },
    {
      q: 'What is the difference between EFS and FSx for Windows?',
      a: 'EFS is a Linux NFS file system — it uses NFSv4.1/4.2 and is accessed natively by Linux instances. FSx for Windows File Server is a Windows-native SMB file system — it integrates with Active Directory, supports Windows ACLs, DFS namespaces, shadow copies, and is accessed by Windows EC2 instances or applications requiring SMB/CIFS. FSx for Windows is the right choice for lift-and-shift Windows workloads; EFS for Linux-native containerised applications.'
    },
    {
      q: 'How does FSx for Lustre integrate with S3?',
      a: 'FSx for Lustre can use an S3 bucket as a data repository. Files in S3 are lazily loaded to Lustre on first access — the first read copies the file from S3 to Lustre, subsequent reads hit the cache. After processing, you can export modified files back to S3 using the hsm_archive command or automatic export policy. This makes FSx for Lustre ideal for ML training jobs: datasets live in S3, Lustre provides the high-throughput POSIX interface, and outputs go back to S3.'
    },
    {
      q: 'What are the benefits of using AWS Backup instead of manual snapshot scripts?',
      a: 'AWS Backup provides: (1) centralised management across EBS, EFS, RDS, DynamoDB, FSx in one place vs separate scripts per service; (2) policy-driven schedules with lifecycle management (move to cold storage, delete after N days); (3) cross-region and cross-account backup copies; (4) Vault Lock for immutable WORM compliance; (5) compliance reporting and audit trail via CloudTrail; (6) restore points tested via restore testing plans. Custom Lambda scripts can achieve similar results but require maintenance, monitoring, and error handling that AWS Backup handles natively.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'EBS provides AZ-local block storage (gp3 for most, io2 for databases); EFS provides elastic multi-AZ NFS shared storage; FSx offers managed Windows/Lustre/NetApp filesystems.',
    mustKnow: [
      'gp3: 3,000 IOPS baseline, independently scalable, 20% cheaper than gp2 — use for all new volumes',
      'io2 Block Express: 256,000 IOPS max, sub-ms latency, 99.999% durability for mission-critical DBs',
      'EBS Multi-Attach: up to 16 Nitro instances, same AZ, REQUIRES cluster-aware filesystem (not ext4/XFS)',
      'EFS: managed NFS, multi-AZ, elastic, thousands of concurrent mounts, port 2049',
      'EFS throughput: Elastic (auto-scales) > Bursting (burst credits) > Provisioned (fixed)',
      'EFS Access Points: enforce POSIX UID/GID and root directory per application',
      'After ModifyVolume: must extend OS filesystem (xfs_growfs or resize2fs) — AWS only resizes block device',
    ],
    interviewFocus: [
      'EBS gp3 vs gp2 — decoupled IOPS, cost advantage, migration path',
      'EBS vs EFS decision — single instance block vs shared multi-instance NFS',
      'EFS Multi-Attach vs EFS — when to use each for shared access',
      'FSx for Windows vs FSx for Lustre — use cases for each',
      'AWS Backup benefits over custom snapshot automation',
    ],
  };
}
