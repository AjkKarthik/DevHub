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
  templateUrl: './cross-region-vpc-peering-cant-reference-security-groups-use-cidr.html',
  styleUrl: './cross-region-vpc-peering-cant-reference-security-groups-use-cidr.scss'
})
export class CrossRegionVpcPeeringCantReferenceSecurityGroupsUseCidrSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes SG chaining as a general benefit — it has a real region-shaped limit',
      points: [
        'The main page\'s own "Security Groups vs NACLs" theory bullet describes security group chaining as: "use another SG as the source/destination rather than a CIDR — auto-adjusts as instance IPs change. Ideal for ALB → app tier → database tier." This is presented as a general technique, with no mention of which VPCs it actually works across.',
        'The main page\'s own VPC Peering bullet does separately note that peering keeps traffic on the AWS backbone — but never connects that fact to a hard limit on referencing security groups specifically.',
      ]
    },
    {
      heading: 'Security group references across a peering connection stop working once the peer VPC is in a different Region',
      points: [
        'Per AWS\'s own documentation, you CAN reference a security group in a peer VPC — including a peer VPC in a different AWS account — as long as the VPC peering connection is active and the peer VPC is in the SAME Region.',
        'AWS\'s own documentation states this limit explicitly: "You can\'t reference the security group of a peer VPC that\'s in a different Region. Instead, use the CIDR block of the peer VPC." There is no workaround that preserves the "auto-adjusts as instance IPs change" benefit across an inter-Region peering connection — a cross-Region setup has to fall back to CIDR-based rules, which do NOT automatically track a peer VPC\'s own instances the way an SG reference does.',
        'This means the exact "ALB → app tier → database tier" chaining pattern the main page recommends works cleanly only when all three tiers are in the same Region (whether in one VPC or same-Region peered VPCs) — a multi-Region architecture with, say, an app tier in one Region referencing a database tier\'s security group in another Region cannot use this technique at all, and needs to be redesigned around CIDR blocks or a different connectivity mechanism (Transit Gateway peering attachments carry their own separate considerations here too).',
      ]
    },
    {
      heading: 'A second, related gotcha: deleting a peering connection leaves a "stale" SG rule behind',
      points: [
        'Per AWS\'s own documentation, if a VPC peering connection referenced by a security group rule is deleted (or the referenced security group itself is deleted), the rule becomes "stale" — but it is NOT automatically removed from the security group. It has to be found and deleted manually.',
        'AWS provides a dedicated describe-stale-security-groups (and describe-security-group-references, to see the reverse direction) API specifically because this class of leftover rule is otherwise invisible in a normal security-group-rules listing — the rule still shows a security group ID as its source, giving no visual indication that the underlying peering connection is gone.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same-Region peering — SG reference works exactly as the main page describes',
      language: 'bash',
      code: `# App tier SG in VPC A referencing the database tier's own SG in a
# SAME-REGION peered VPC B -- this is the exact chaining pattern the
# main page's own bullet recommends, and it works:
aws ec2 authorize-security-group-ingress \\
  --group-id sg-db-tier-vpcB \\
  --protocol tcp --port 5432 \\
  --source-group sg-app-tier-vpcA

# Confirm the reference is live:
aws ec2 describe-security-group-references --group-id sg-app-tier-vpcA
# {
#   "SecurityGroupReferenceSet": [
#     { "GroupId": "sg-app-tier-vpcA", "ReferencingVpcId": "vpc-B",
#       "VpcPeeringConnectionId": "pcx-same-region-abc" }
#   ]
# }
# -- as app-tier instances scale up/down or get replaced, this rule
# auto-adjusts with zero changes needed, exactly as the main page
# describes.`,
    },
    {
      label: 'Cross-Region peering — the same call fails; CIDR is the only option',
      language: 'bash',
      code: `# VPC A is in eu-west-1, VPC C is in us-east-1, peered via an
# inter-Region peering connection. Attempting the identical
# SG-reference pattern:
aws ec2 authorize-security-group-ingress \\
  --group-id sg-db-tier-vpcC \\
  --protocol tcp --port 5432 \\
  --source-group sg-app-tier-vpcA
# An error occurred (InvalidParameterValue): Security group
# sg-app-tier-vpcA does not exist in this Region eu-west-1
# -- the SG reference itself is invalid across the Region boundary,
# not just restricted -- it fails outright.

# The only working option: reference the peer VPC's CIDR block
# instead of its security group:
aws ec2 authorize-security-group-ingress \\
  --group-id sg-db-tier-vpcC \\
  --protocol tcp --port 5432 \\
  --cidr 10.0.0.0/16   # VPC A's own CIDR block

# The tradeoff: this CIDR rule does NOT auto-adjust to which
# specific instances exist in VPC A's app tier -- it allows the
# ENTIRE VPC A CIDR range on port 5432, a broader grant than the
# SG-reference version would have been, and it has to be manually
# updated if VPC A's own CIDR ever changes.`,
    },
    {
      label: 'Finding stale SG rules after a peering connection is deleted',
      language: 'bash',
      code: `# A peering connection referenced by an SG rule gets deleted --
# the rule itself is NOT automatically cleaned up:
aws ec2 delete-vpc-peering-connection --vpc-peering-connection-id pcx-same-region-abc

# The rule on sg-db-tier-vpcB (from the first example) still exists,
# still shows sg-app-tier-vpcA as its source -- but is now "stale":
aws ec2 describe-stale-security-groups --vpc-id vpc-B
# {
#   "StaleSecurityGroupSet": [{
#     "GroupId": "sg-db-tier-vpcB",
#     "StaleIpPermissions": [{
#       "FromPort": 5432, "ToPort": 5432, "IpProtocol": "tcp",
#       "UserIdGroupPairs": [{
#         "GroupId": "sg-app-tier-vpcA", "VpcId": "vpc-A",
#         "PeeringStatus": "deleted",
#         "VpcPeeringConnectionId": "pcx-same-region-abc"
#       }]
#     }]
#   }]
# }
# -- a normal "describe-security-groups" listing gives no hint this
# rule is dead; only describe-stale-security-groups surfaces it.
# Manual cleanup is required:
aws ec2 revoke-security-group-ingress \\
  --group-id sg-db-tier-vpcB --protocol tcp --port 5432 \\
  --source-group sg-app-tier-vpcA`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own recommended pattern, a team designs their database tier\'s security group to reference their app tier\'s security group as the source, expecting it to "auto-adjust as instance IPs change" per the main page\'s own description. During a later multi-Region expansion, the app tier is deployed into a second Region (us-east-1) while the database tier stays in the original Region (eu-west-1), connected via an inter-Region VPC peering connection. The team tries to add the same kind of SG-reference rule for the new Region\'s app tier and it fails outright. Using this subtopic\'s theory, explain why, and what they need to do differently.',
    hint: 'Does AWS\'s own documented limit on referencing a peer VPC\'s security group depend on the peering connection simply being active, or does it also depend on which Region the peer VPC is in?',
    solution: 'The rule fails because AWS explicitly does not support referencing a security group in a peer VPC when that peer VPC is in a DIFFERENT Region — per this subtopic\'s theory, this limit applies regardless of whether the peering connection itself is active and correctly configured; being in a different Region alone rules out the SG-reference approach entirely. The team\'s original same-Region setup worked exactly as the main page describes because both tiers were in the same Region at the time — the auto-adjusting benefit of SG references genuinely applied there. Once the app tier expanded into us-east-1 while the database tier stayed in eu-west-1, the new cross-Region app-tier instances can no longer be covered by an SG-reference rule at all; AWS\'s own guidance is explicit that the only supported alternative is to reference the peer VPC\'s CIDR block instead. This means the team has to add a CIDR-based rule for the new Region\'s app tier traffic — accepting a broader, VPC-wide grant that does not automatically track which specific instances exist in that Region\'s app tier, and that has to be manually updated if the peer VPC\'s own CIDR block ever changes — a real, unavoidable tradeoff introduced purely by going multi-Region, not something that can be worked around while keeping the original SG-reference pattern.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Security group chaining (referencing another SG as a rule\'s source) works across any active VPC peering connection, regardless of which Regions the two VPCs are in.',
      reality: 'Per this subtopic\'s theory, AWS explicitly does not support referencing a security group in a peer VPC that\'s in a different Region — the peering connection being active is necessary but not sufficient; same-Region is a hard additional requirement.'
    },
    {
      thought: 'When a security group reference across a peering connection isn\'t possible, there\'s some AWS-provided workaround that preserves the "auto-adjusts as instances change" benefit.',
      reality: 'Per this subtopic\'s theory, the only documented alternative for cross-Region peering is a CIDR-block-based rule — which does not auto-adjust to specific instances, and grants access to the entire peer VPC CIDR rather than just the instances in a specific security group.'
    },
    {
      thought: 'Deleting a VPC peering connection automatically cleans up any security group rules that referenced a security group across that connection.',
      reality: 'Per this subtopic\'s theory, such rules become "stale" but are NOT automatically removed — they remain in the security group, still showing the now-defunct security group ID as their source, and require using describe-stale-security-groups and a manual revoke to actually clean up.'
    }
  ];
}
