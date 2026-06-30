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
  selector: 'app-aws-vpc',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './vpc.html',
  styleUrl: './vpc.scss'
})
export class AwsVpc {

  quickRef: QuickRefItem[] = [
    { name: 'VPC', type: 'class', desc: 'Isolated virtual network in AWS — you define CIDR, subnets, routing, and access controls.' },
    { name: 'Internet Gateway (IGW)', type: 'class', desc: 'Horizontally scaled gateway that enables internet access for resources with a public IP in public subnets.' },
    { name: 'NAT Gateway', type: 'class', desc: 'Managed NAT device in a public subnet — allows private subnet resources to initiate outbound internet traffic.' },
    { name: 'Route Table', type: 'class', desc: 'Rules that determine where network traffic is directed — each subnet is associated with exactly one route table.' },
    { name: 'Network ACL (NACL)', type: 'class', desc: 'Stateless firewall at the subnet level — separate inbound and outbound rules, numbered priority order.' },
    { name: 'VPC Peering', type: 'keyword', desc: 'Private connectivity between two VPCs — traffic stays on AWS backbone, no overlapping CIDRs allowed.' },
    { name: 'Transit Gateway (TGW)', type: 'class', desc: 'Regional hub that connects VPCs and on-prem networks at scale — replaces complex VPC peering meshes.' },
    { name: 'VPC Endpoint', type: 'class', desc: 'Private connection from VPC to AWS services (S3, DynamoDB) without traversing the internet.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'VPC Fundamentals',
      points: [
        'A VPC is a logically isolated section of AWS cloud. You define a CIDR block (e.g. 10.0.0.0/16) and carve subnets from it.',
        'Subnets are AZ-specific — a /16 VPC across 3 AZs typically has 3 public subnets (/24) and 3 private subnets (/24), with room to grow.',
        'Public subnet: route table has a default route (0.0.0.0/0) pointing to an Internet Gateway. Instances need a public IP or Elastic IP to be reachable from the internet.',
        'Private subnet: no IGW route — resources cannot receive inbound traffic from the internet. Outbound traffic can go through a NAT Gateway in a public subnet.',
        'Default VPC: AWS creates one per region with public subnets — convenient for testing, but production workloads should use custom VPCs with private subnets.',
      ]
    },
    {
      heading: 'Internet Gateway & NAT Gateway',
      points: [
        'Internet Gateway (IGW): attached to the VPC (one per VPC), scales horizontally automatically, no bandwidth limits. Resources need a public IP to communicate bidirectionally.',
        'NAT Gateway: sits in a public subnet, has an Elastic IP. Private subnet route table sends 0.0.0.0/0 to the NAT Gateway, which translates source IPs to its EIP for outbound traffic.',
        'NAT Gateway is managed (highly available within an AZ) but costs $0.045/hour + $0.045/GB — for multi-AZ private subnets, deploy one NAT Gateway per AZ to avoid cross-AZ data transfer charges.',
        'NAT Instance (EC2-based) is a legacy alternative — cheaper but single point of failure, requires manual HA setup.',
        'Egress-only Internet Gateway: IPv6 equivalent of NAT Gateway — allows outbound IPv6 traffic from private subnets while blocking inbound.',
      ]
    },
    {
      heading: 'Security Groups vs NACLs',
      points: [
        'Security Groups are stateful: return traffic is automatically allowed. Applied at the ENI (instance/task) level. Rules are Allow-only — no Deny.',
        'NACLs are stateless: you must explicitly allow both inbound and outbound traffic. Applied at the subnet level. Support both Allow and Deny rules. Rules evaluated in ascending number order, first match wins.',
        'Security group chaining: use another SG as the source/destination rather than a CIDR — auto-adjusts as instance IPs change. Ideal for ALB → app tier → database tier.',
        'Default NACL: allows all inbound and outbound. Custom NACL: default deny all — common pitfall when adding rules without configuring return traffic.',
        'Use SGs for most access control (simpler, stateful). Add NACLs only for subnet-level blocking (e.g. block a known-malicious CIDR range).',
      ]
    },
    {
      heading: 'VPC Connectivity',
      points: [
        'VPC Peering: private connectivity between two VPCs. Traffic stays on AWS backbone. Transitive routing is NOT supported — VPC A peers with B and C, but B cannot reach C through A.',
        'Transit Gateway: a regional hub that connects many VPCs (and on-prem via VPN/Direct Connect) with full transitive routing. Supports route tables with segmentation (dev vs prod VPCs).',
        'VPC Endpoints: two types — Interface (powered by PrivateLink, an ENI in your subnet) and Gateway (S3 and DynamoDB only, free, added to route table). Both keep traffic off the public internet.',
        'AWS PrivateLink: exposes your service via an NLB + endpoint service — consumers connect via an interface endpoint. Traffic never leaves the AWS network.',
        'Direct Connect: dedicated physical connection from on-prem to AWS (1/10/100 Gbps). More consistent latency than VPN, higher cost and lead time.',
      ]
    },
    {
      heading: 'VPC Flow Logs',
      points: [
        'Flow Logs capture IP traffic metadata at VPC, subnet, or ENI level — source/dest IP, port, protocol, bytes, action (ACCEPT/REJECT).',
        'Delivered to CloudWatch Logs or S3. S3 is cheaper for long-term storage; CloudWatch enables Log Insights queries.',
        'Flow Logs do NOT capture DNS traffic, DHCP, or metadata (169.254.169.254) requests.',
        'Use Athena to query S3 flow logs at scale — partition by account, region, and date for cost-efficient queries.',
        'Flow Logs help debug connectivity issues: filter for REJECT records to see which traffic is being blocked by security groups or NACLs.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'VPC & Subnets',
      language: 'bash',
      code: `# Create a VPC
VPC_ID=$(aws ec2 create-vpc \\
  --cidr-block 10.0.0.0/16 \\
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=prod-vpc}]' \\
  --query 'Vpc.VpcId' --output text)

# Enable DNS resolution and hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames

# Create public and private subnets in 2 AZs
PUB_1=$(aws ec2 create-subnet --vpc-id $VPC_ID \\
  --cidr-block 10.0.1.0/24 --availability-zone eu-west-1a \\
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-1a}]' \\
  --query 'Subnet.SubnetId' --output text)

PUB_2=$(aws ec2 create-subnet --vpc-id $VPC_ID \\
  --cidr-block 10.0.2.0/24 --availability-zone eu-west-1b \\
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-1b}]' \\
  --query 'Subnet.SubnetId' --output text)

PRIV_1=$(aws ec2 create-subnet --vpc-id $VPC_ID \\
  --cidr-block 10.0.10.0/24 --availability-zone eu-west-1a \\
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-1a}]' \\
  --query 'Subnet.SubnetId' --output text)

PRIV_2=$(aws ec2 create-subnet --vpc-id $VPC_ID \\
  --cidr-block 10.0.11.0/24 --availability-zone eu-west-1b \\
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-1b}]' \\
  --query 'Subnet.SubnetId' --output text)`,
    },
    {
      label: 'IGW & NAT Gateway',
      language: 'bash',
      code: `# Create and attach Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway \\
  --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID

# Create public route table (routes to IGW)
PUB_RT=$(aws ec2 create-route-table --vpc-id $VPC_ID \\
  --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $PUB_RT \\
  --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --route-table-id $PUB_RT --subnet-id $PUB_1
aws ec2 associate-route-table --route-table-id $PUB_RT --subnet-id $PUB_2

# Create NAT Gateway in each public AZ (one per AZ for HA)
EIP_1=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
EIP_2=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)

NAT_1=$(aws ec2 create-nat-gateway --subnet-id $PUB_1 --allocation-id $EIP_1 \\
  --query 'NatGateway.NatGatewayId' --output text)
NAT_2=$(aws ec2 create-nat-gateway --subnet-id $PUB_2 --allocation-id $EIP_2 \\
  --query 'NatGateway.NatGatewayId' --output text)

# Wait for NAT gateways to become available
aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_1 $NAT_2

# Private route tables (one per AZ, routes to local NAT GW)
PRIV_RT_1=$(aws ec2 create-route-table --vpc-id $VPC_ID \\
  --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $PRIV_RT_1 \\
  --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_1
aws ec2 associate-route-table --route-table-id $PRIV_RT_1 --subnet-id $PRIV_1

PRIV_RT_2=$(aws ec2 create-route-table --vpc-id $VPC_ID \\
  --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-route --route-table-id $PRIV_RT_2 \\
  --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_2
aws ec2 associate-route-table --route-table-id $PRIV_RT_2 --subnet-id $PRIV_2`,
    },
    {
      label: 'VPC Peering & Endpoints',
      language: 'bash',
      code: `# Create VPC peering connection
PEER_ID=$(aws ec2 create-vpc-peering-connection \\
  --vpc-id $VPC_ID \\
  --peer-vpc-id vpc-0peer123456 \\
  --peer-region eu-west-1 \\
  --query 'VpcPeeringConnection.VpcPeeringConnectionId' --output text)

# Accept the peering (in the peer account/region)
aws ec2 accept-vpc-peering-connection --vpc-peering-connection-id $PEER_ID

# Add routes on BOTH sides (peering is not transitive)
aws ec2 create-route --route-table-id $PRIV_RT_1 \\
  --destination-cidr-block 10.1.0.0/16 \\  # peer VPC CIDR
  --vpc-peering-connection-id $PEER_ID

# Create a Gateway Endpoint for S3 (free — stays in AWS network)
aws ec2 create-vpc-endpoint \\
  --vpc-id $VPC_ID \\
  --service-name com.amazonaws.eu-west-1.s3 \\
  --route-table-ids $PRIV_RT_1 $PRIV_RT_2

# Create an Interface Endpoint for ECR (pulls images without internet)
aws ec2 create-vpc-endpoint \\
  --vpc-id $VPC_ID \\
  --vpc-endpoint-type Interface \\
  --service-name com.amazonaws.eu-west-1.ecr.dkr \\
  --subnet-ids $PRIV_1 $PRIV_2 \\
  --security-group-ids sg-0endpoint123 \\
  --private-dns-enabled

# Enable VPC Flow Logs to S3
aws ec2 create-flow-logs \\
  --resource-type VPC \\
  --resource-ids $VPC_ID \\
  --traffic-type ALL \\
  --log-destination-type s3 \\
  --log-destination arn:aws:s3:::my-flow-logs-bucket/vpc-logs/`,
    },
    {
      label: 'Transit Gateway',
      language: 'bash',
      code: `# Create Transit Gateway
TGW_ID=$(aws ec2 create-transit-gateway \\
  --description "Prod Transit Gateway" \\
  --options 'AmazonSideAsn=64512,AutoAcceptSharedAttachments=disable,DefaultRouteTableAssociation=enable,DefaultRouteTablePropagation=enable,DnsSupport=enable' \\
  --query 'TransitGateway.TransitGatewayId' --output text)

# Attach a VPC to the Transit Gateway
aws ec2 create-transit-gateway-vpc-attachment \\
  --transit-gateway-id $TGW_ID \\
  --vpc-id $VPC_ID \\
  --subnet-ids $PRIV_1 $PRIV_2

# Add route to private subnet route tables pointing to TGW
# (for traffic that should go through TGW, e.g. to another VPC)
aws ec2 create-route \\
  --route-table-id $PRIV_RT_1 \\
  --destination-cidr-block 10.1.0.0/16 \\
  --transit-gateway-id $TGW_ID

# Create isolated route table (dev VPCs cannot reach prod VPCs)
DEV_TGW_RT=$(aws ec2 create-transit-gateway-route-table \\
  --transit-gateway-id $TGW_ID \\
  --query 'TransitGatewayRouteTable.TransitGatewayRouteTableId' --output text)

# Associate dev VPC attachment with the isolated route table
aws ec2 associate-transit-gateway-route-table \\
  --transit-gateway-route-table-id $DEV_TGW_RT \\
  --transit-gateway-attachment-id tgw-attach-dev123`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Single NAT Gateway for all private subnets across AZs',
      wrong: `# One NAT Gateway in eu-west-1a
# Private subnets in 1a, 1b, 1c all route through it
# AZ failure = complete outbound internet loss for 1b and 1c
# Also: cross-AZ data transfer charges ($0.01/GB) on all traffic`,
      right: `# One NAT Gateway per AZ
NAT_A in public-1a -> route for private-1a
NAT_B in public-1b -> route for private-1b
NAT_C in public-1c -> route for private-1c
# AZ failure isolates only that AZ; no cross-AZ charges`,
      explanation: 'A single NAT Gateway creates a single point of failure and incurs cross-AZ data transfer charges for traffic from other AZs. Deploy one NAT Gateway per AZ to achieve true high availability and minimise data transfer costs.'
    },
    {
      title: 'Custom NACL blocking return traffic (stateless gotcha)',
      wrong: `# Custom NACL: allow inbound port 443
Rule 100: ALLOW TCP 0.0.0.0/0 port 443 INBOUND
# Forgot outbound — response packets are blocked
# Connections succeed but hang or time out`,
      right: `# Must allow ephemeral ports for return traffic
Rule 100: ALLOW TCP 0.0.0.0/0 port 443 INBOUND
Rule 100: ALLOW TCP 0.0.0.0/0 ports 1024-65535 OUTBOUND
# Ephemeral port range: 1024-65535 (Linux) or 49152-65535 (Windows)`,
      explanation: 'NACLs are stateless — return traffic must be explicitly allowed. For web traffic, inbound port 443 requires outbound ephemeral ports (1024-65535) to allow TCP response packets. Security groups handle this automatically (stateful).'
    },
    {
      title: 'Overlapping CIDRs in VPC peering',
      wrong: `# VPC A: 10.0.0.0/16, VPC B: 10.0.0.0/16
aws ec2 create-vpc-peering-connection \\
  --vpc-id vpc-A --peer-vpc-id vpc-B
# Error: overlapping CIDR blocks`,
      right: `# Plan non-overlapping CIDRs across all VPCs upfront
VPC A: 10.0.0.0/16   (10.0.x.x)
VPC B: 10.1.0.0/16   (10.1.x.x)
VPC C: 10.2.0.0/16   (10.2.x.x)`,
      explanation: 'VPC peering requires non-overlapping CIDR blocks between the two VPCs — you cannot peer two VPCs with the same CIDR. Plan your IP addressing scheme upfront (RFC 1918 ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16).'
    },
    {
      title: 'Forgetting routes on both sides of a VPC peering connection',
      wrong: `# Added peering connection and route in VPC A
# Forgot to add route in VPC B
aws ec2 create-route --route-table-id rt-A --destination 10.1.0.0/16 --vpc-peering-connection-id pcx-123
# Traffic from A -> B works; B -> A fails`,
      right: `# Route must exist in BOTH VPCs pointing to the peering connection
aws ec2 create-route --route-table-id rt-A \\
  --destination 10.1.0.0/16 --vpc-peering-connection-id pcx-123
aws ec2 create-route --route-table-id rt-B \\
  --destination 10.0.0.0/16 --vpc-peering-connection-id pcx-123`,
      explanation: 'VPC peering is bidirectional but routing is not automatic. Each side needs a route in its route table pointing to the peering connection — missing one side means traffic flows only one way.'
    },
    {
      title: 'Deploying resources in the default VPC for production',
      wrong: `# Using the default VPC (172.31.0.0/16)
# All subnets are public — no private tier
# Default NACL allows all traffic
# Not following least-privilege networking principles`,
      right: `# Create a custom VPC with public + private subnets
# Place databases, caches, and app tiers in private subnets
# Only ALBs and bastion hosts (or SSM) in public subnets`,
      explanation: 'The default VPC puts all subnets on the internet by default — suitable for development and testing only. Production workloads need a custom VPC with private subnets for databases and application servers, and strict security group rules.'
    },
  ];

  challenge: Challenge = {
    title: 'Design a 3-Tier VPC',
    language: 'typescript',
    description: `Output the CIDR plan and key CLI commands for a production VPC spanning 2 AZs with 3 tiers: public (ALB), private-app (ECS tasks), private-data (RDS). The VPC CIDR is 10.0.0.0/16. Each tier in each AZ should use a /24 subnet. Include internet gateway, NAT gateways, and route table associations.`,
    hints: [
      'Assign /24 blocks: public 10.0.1-2.0/24, app 10.0.10-11.0/24, data 10.0.20-21.0/24.',
      'Only public subnets get a route to the IGW.',
      'Private subnets route 0.0.0.0/0 to their AZ-local NAT Gateway.',
      'Data subnets may have no default route at all — RDS only needs VPC-local connectivity.',
      'NAT Gateways must be in public subnets and need an Elastic IP.',
    ],
    starterCode: `interface SubnetPlan {
  name: string;
  cidr: string;
  az: string;
  tier: 'public' | 'private-app' | 'private-data';
}

const subnets: SubnetPlan[] = [
  // TODO: 6 subnets — 2 public, 2 private-app, 2 private-data
];

const routingPlan = {
  publicRouteTable: "0.0.0.0/0 -> IGW",
  privateAppAZ1: "TODO",
  privateAppAZ2: "TODO",
  privateData: "TODO",
};

console.log("Subnets:", JSON.stringify(subnets, null, 2));
console.log("Routing:", routingPlan);`,
    solution: `interface SubnetPlan {
  name: string;
  cidr: string;
  az: string;
  tier: 'public' | 'private-app' | 'private-data';
}

const subnets: SubnetPlan[] = [
  { name: 'public-1a',      cidr: '10.0.1.0/24',  az: 'eu-west-1a', tier: 'public' },
  { name: 'public-1b',      cidr: '10.0.2.0/24',  az: 'eu-west-1b', tier: 'public' },
  { name: 'private-app-1a', cidr: '10.0.10.0/24', az: 'eu-west-1a', tier: 'private-app' },
  { name: 'private-app-1b', cidr: '10.0.11.0/24', az: 'eu-west-1b', tier: 'private-app' },
  { name: 'private-data-1a',cidr: '10.0.20.0/24', az: 'eu-west-1a', tier: 'private-data' },
  { name: 'private-data-1b',cidr: '10.0.21.0/24', az: 'eu-west-1b', tier: 'private-data' },
];

const routingPlan = {
  publicRouteTable:   "0.0.0.0/0 -> IGW (shared by both public subnets)",
  privateAppAZ1:      "0.0.0.0/0 -> NAT-GW-1a (in public-1a)",
  privateAppAZ2:      "0.0.0.0/0 -> NAT-GW-1b (in public-1b)",
  privateData:        "local only — RDS needs no internet access; no default route",
};

const keyCommands = \`
# VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# IGW
aws ec2 create-internet-gateway
aws ec2 attach-internet-gateway --internet-gateway-id IGW_ID --vpc-id VPC_ID

# NAT GW per AZ (in public subnets)
aws ec2 allocate-address --domain vpc  # -> EIP_1
aws ec2 create-nat-gateway --subnet-id public-1a-id --allocation-id EIP_1

# Public route table: 0.0.0.0/0 -> IGW
# Private-app-1a route table: 0.0.0.0/0 -> NAT-1a
# Private-app-1b route table: 0.0.0.0/0 -> NAT-1b
# Private-data: no default route
\`;

console.log("Subnets:", JSON.stringify(subnets, null, 2));
console.log("Routing:", routingPlan);
console.log(keyCommands);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between a Security Group and a NACL?',
      options: [
        'Security groups apply at the subnet level; NACLs at the instance level',
        'Security groups are stateful (return traffic auto-allowed); NACLs are stateless',
        'NACLs support only Allow rules; Security groups support Allow and Deny',
        'Security groups evaluate rules in number order; NACLs use the most permissive rule'
      ],
      answer: 1,
      explanation: 'Security groups are stateful — if you allow inbound port 443, response traffic is automatically allowed. NACLs are stateless — you must explicitly allow both inbound and outbound. Also, NACLs apply at the subnet level; security groups at the ENI (instance/task) level.'
    },
    {
      q: 'What does a VPC Gateway Endpoint for S3 add to your VPC?',
      options: [
        'An ENI in your subnet with a private IP for S3',
        'A route in your route table for S3 prefixes pointing to the endpoint',
        'A security group rule allowing S3 traffic',
        'A NAT Gateway specifically for S3 traffic'
      ],
      answer: 1,
      explanation: 'Gateway Endpoints (S3 and DynamoDB) add a route entry to your route table that directs traffic for the AWS service prefix to the endpoint — keeping traffic off the internet without any ENI, private IP, or security group rules. They are free.'
    },
    {
      q: 'Why should you deploy one NAT Gateway per Availability Zone?',
      options: [
        'AWS requires it for Fargate deployments',
        'To avoid AZ failure causing cross-AZ NAT traffic and single point of failure',
        'NAT Gateways do not support multiple AZs',
        'To reduce the Elastic IP cost'
      ],
      answer: 1,
      explanation: 'A single NAT Gateway creates a single point of failure — if its AZ has an outage, private subnets in other AZs lose internet access. Cross-AZ traffic also incurs $0.01/GB data transfer charges. One NAT Gateway per AZ ensures HA and keeps traffic local.'
    },
    {
      q: 'Which VPC connectivity option supports transitive routing between multiple VPCs?',
      options: ['VPC Peering', 'Internet Gateway', 'Transit Gateway', 'VPC Endpoint'],
      answer: 2,
      explanation: 'Transit Gateway acts as a regional hub supporting transitive routing — VPC A can reach VPC C through the TGW without a direct peering connection. VPC Peering does NOT support transitivity: A peers with B and C, but B cannot reach C through A.'
    },
    {
      q: 'What does "stateless" mean for Network ACLs?',
      options: [
        'NACLs do not maintain session state between rule evaluations',
        'NACLs must explicitly allow return traffic; inbound allow does not imply outbound allow',
        'NACLs cannot block traffic, only log it',
        'NACLs are applied after security groups are evaluated'
      ],
      answer: 1,
      explanation: 'Stateless means NACLs evaluate each packet independently with no knowledge of prior packets. If you allow inbound TCP port 443, the response packets (outbound on ephemeral ports 1024-65535) are blocked unless you also add an outbound allow rule.'
    },
    {
      q: 'What is the key difference between a VPC Security Group and a Network ACL (NACL)?',
      options: ['They are functionally identical with different names', 'Security Groups are stateful and operate at the instance level; NACLs are stateless and operate at the subnet level', 'NACLs only support allow rules, never deny rules', 'Security Groups can deny specific traffic; NACLs cannot'],
      answer: 1,
      explanation: 'Security Groups are stateful (return traffic is automatically allowed regardless of outbound rules) and attached to individual ENIs/instances, supporting only Allow rules. NACLs are stateless (you must explicitly allow both inbound AND outbound return traffic) and operate at the subnet level as a coarser-grained additional layer of defense, supporting both Allow and explicit Deny rules evaluated in numbered order.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use VPC Peering vs Transit Gateway?',
      a: 'VPC Peering: simpler and cheaper for connecting 2-3 VPCs in the same region — no hub cost, slightly lower latency, no transitive routing. Transit Gateway: essential when connecting many VPCs (3+) or when you need transitive routing, on-prem connectivity, cross-region peering, or route table segmentation (e.g. isolating dev from prod). TGW costs $0.05/hour per attachment + $0.02/GB, so for small setups VPC peering is cheaper.'
    },
    {
      q: 'What is the difference between a VPC Interface Endpoint and a Gateway Endpoint?',
      a: 'Gateway Endpoints (S3, DynamoDB only): free, added as route table entries, no ENI, no security group — traffic stays on AWS backbone. Interface Endpoints (most other services, powered by PrivateLink): create an ENI in your subnet with a private IP, charged per hour + per GB, require a security group, enable private DNS so the service hostname resolves to the private IP. Interface Endpoints work from on-prem via Direct Connect or VPN; Gateway Endpoints do not.'
    },
    {
      q: 'How do VPC Flow Logs help debug connectivity issues?',
      a: 'Flow Logs record the 5-tuple (source IP, destination IP, source port, destination port, protocol) plus bytes transferred and the action (ACCEPT or REJECT). To debug: enable flow logs on the VPC or specific ENI, filter for REJECT records in CloudWatch Log Insights or Athena, identify which security group or NACL is blocking the traffic. The log record shows the ENI ID, which maps back to the specific resource — you can then trace which security group rule is causing the rejection.'
    },
    {
      q: 'What is an Elastic IP, and when do you need one?',
      a: 'An Elastic IP is a static, public IPv4 address allocated to your AWS account that persists independently of any specific instance. You need one when: your EC2 instance must be reachable on a consistent IP after stop/start cycles (public IPs change on restart by default); NAT Gateways require an EIP to perform address translation; or you need a whitelisted IP for external partners. EIPs are free while attached to a running instance, but cost $0.005/hour when allocated but not associated.'
    },
    {
      q: 'What is a VPC endpoint and why does it improve both security and cost for accessing AWS services like S3?',
      a: 'A VPC endpoint lets resources in a private subnet (with no internet gateway or NAT) access AWS services (S3, DynamoDB via Gateway endpoints; most other services via Interface endpoints/PrivateLink) without traffic ever leaving the AWS network or traversing the public internet. This improves security (no exposure to internet-based attacks on that traffic path, traffic stays within AWS\'s backbone) and can reduce cost (avoiding NAT Gateway data processing charges for traffic that would otherwise route through a NAT Gateway to reach the public AWS service endpoint).',
    },
    {
      q: 'Why does deploying resources across multiple Availability Zones within a VPC improve resilience, and what is required to do so correctly?',
      a: 'Each Availability Zone is a physically isolated set of data centers with independent power, cooling, and networking — deploying redundant resources (EC2 instances, RDS standbys) across multiple AZs means a failure affecting one AZ (power outage, network issue) does not take down your entire application, only the portion in that AZ. Correct implementation requires creating a subnet in each AZ you want to use (subnets are AZ-specific, cannot span AZs), then placing resources and configuring load balancers or Multi-AZ database deployments to span those subnets.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'A VPC is your private network in AWS — subnets, route tables, IGW, NAT GW, security groups, NACLs, and VPC endpoints control how traffic flows within and beyond it.',
    mustKnow: [
      'Public subnet = route table has 0.0.0.0/0 → IGW; private subnet routes through NAT GW',
      'Security groups: stateful (allow-only, ENI level); NACLs: stateless (allow+deny, subnet level)',
      'One NAT Gateway per AZ for HA and to avoid cross-AZ data transfer charges',
      'VPC Peering: no transitive routing; Transit Gateway: full transitive routing hub',
      'Gateway Endpoint (S3/DynamoDB): free route entry; Interface Endpoint: ENI + PrivateLink, charged',
      'VPC Flow Logs: ACCEPT/REJECT metadata to CloudWatch or S3 — debug with REJECT filter',
      'Overlapping CIDRs prevent VPC peering — plan IP space upfront across all VPCs',
    ],
    interviewFocus: [
      'Security group (stateful, ENI) vs NACL (stateless, subnet) — when to use each',
      'Why one NAT Gateway per AZ (HA + no cross-AZ data transfer charges)',
      'VPC Peering vs Transit Gateway — when each is appropriate',
      'Gateway vs Interface VPC Endpoint — cost, supported services, on-prem reachability',
      '3-tier VPC design: public (ALB), private-app (ECS), private-data (RDS) — routing and security',
    ],
  };
}
