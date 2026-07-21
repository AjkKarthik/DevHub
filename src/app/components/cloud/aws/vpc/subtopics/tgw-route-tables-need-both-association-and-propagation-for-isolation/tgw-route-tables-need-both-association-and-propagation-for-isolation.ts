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
  templateUrl: './tgw-route-tables-need-both-association-and-propagation-for-isolation.html',
  styleUrl: './tgw-route-tables-need-both-association-and-propagation-for-isolation.scss'
})
export class TgwRouteTablesNeedBothAssociationAndPropagationForIsolationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows one "associate" call and calls it isolation — that\'s only half the mechanism',
      points: [
        'The main page\'s own Transit Gateway code tab creates an "isolated" route table and associates a dev VPC attachment with it, with a comment reading "dev VPCs cannot reach prod VPCs." Association alone does not achieve that isolation — it only determines which route table an attachment\'s OWN outbound traffic is evaluated against.',
        'Whether that dev attachment can actually REACH anything (or whether prod attachments can reach dev) depends on a second, entirely separate mechanism the main page\'s own code never touches: route PROPAGATION.',
      ]
    },
    {
      heading: 'Association picks the lookup table; propagation decides what routes appear in it',
      points: [
        'Per AWS\'s own Transit Gateway documentation, each attachment (VPC, VPN, Direct Connect, etc.) is associated with exactly one Transit Gateway route table — this determines which route table is consulted when THAT attachment sends traffic through the Transit Gateway.',
        'Separately, an attachment\'s own routes can be PROPAGATED into one or more Transit Gateway route tables — propagation is what makes an attachment\'s CIDR reachable by whichever OTHER attachments are associated with that particular route table. An attachment can propagate its routes into multiple route tables even though it is only ever associated with one.',
        'True one-way isolation — dev can never reach prod, but prod CAN still reach dev if needed for shared services — requires configuring association and propagation independently and asymmetrically: the dev VPC attachment is associated with a "dev" route table into which ONLY other dev attachments propagate routes (so dev never even has a route TO prod), while the "prod" route table (associated with prod attachments) can still have dev\'s routes propagated into it if prod genuinely needs to reach dev.',
        'This is why the main page\'s own single "associate" call, by itself, doesn\'t actually isolate anything: if the dev attachment\'s routes are also propagated into the SAME "isolated" route table other VPCs are associated with (or if prod\'s own attachment is also associated with a route table that dev\'s routes get propagated into), the isolation is a coincidence of whatever else happens to be configured, not a guaranteed property of the setup shown.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Recreating the main page\'s own "isolation" — and showing why it isn\'t one yet',
      language: 'bash',
      code: `# The main page's own code creates an isolated route table and
# associates ONLY the dev attachment with it:
DEV_TGW_RT=$(aws ec2 create-transit-gateway-route-table \\
  --transit-gateway-id $TGW_ID \\
  --query 'TransitGatewayRouteTable.TransitGatewayRouteTableId' --output text)

aws ec2 associate-transit-gateway-route-table \\
  --transit-gateway-route-table-id $DEV_TGW_RT \\
  --transit-gateway-attachment-id tgw-attach-dev123

# Association alone does NOT stop prod from reaching dev, or dev
# from reaching prod -- check what's actually propagated into this
# "isolated" table:
aws ec2 get-transit-gateway-route-table-propagations \\
  --transit-gateway-route-table-id $DEV_TGW_RT
# {
#   "TransitGatewayRouteTablePropagations": [
#     { "TransitGatewayAttachmentId": "tgw-attach-dev123", "State": "enabled" },
#     { "TransitGatewayAttachmentId": "tgw-attach-prod456", "State": "enabled" }
#   ]
# }
# -- if DefaultRouteTablePropagation was left "enable" when the TGW
# was created (the main page's own create-transit-gateway example
# does exactly this), EVERY attachment -- including prod -- may have
# already auto-propagated its routes into every route table,
# including this "isolated" one -- dev can see and reach prod
# through it, the opposite of what the comment claims.`,
    },
    {
      label: 'Real one-way isolation: explicit, asymmetric propagation',
      language: 'bash',
      code: `# Start a TGW with automatic association/propagation DISABLED, so
# nothing is wired up implicitly:
TGW_ID=$(aws ec2 create-transit-gateway \\
  --description "Segmented Transit Gateway" \\
  --options 'DefaultRouteTableAssociation=disable,DefaultRouteTablePropagation=disable' \\
  --query 'TransitGateway.TransitGatewayId' --output text)

# Create two SEPARATE route tables
DEV_RT=$(aws ec2 create-transit-gateway-route-table --transit-gateway-id $TGW_ID \\
  --query 'TransitGatewayRouteTable.TransitGatewayRouteTableId' --output text)
PROD_RT=$(aws ec2 create-transit-gateway-route-table --transit-gateway-id $TGW_ID \\
  --query 'TransitGatewayRouteTable.TransitGatewayRouteTableId' --output text)

# Associate each attachment with its OWN route table
aws ec2 associate-transit-gateway-route-table \\
  --transit-gateway-route-table-id $DEV_RT --transit-gateway-attachment-id tgw-attach-dev123
aws ec2 associate-transit-gateway-route-table \\
  --transit-gateway-route-table-id $PROD_RT --transit-gateway-attachment-id tgw-attach-prod456

# Propagate dev's routes ONLY into prod's table (prod can reach dev,
# for a genuinely needed shared service) -- but NEVER propagate
# prod's routes into dev's table:
aws ec2 enable-transit-gateway-route-table-propagation \\
  --transit-gateway-route-table-id $PROD_RT --transit-gateway-attachment-id tgw-attach-dev123

# Deliberately do NOT run the equivalent
# enable-transit-gateway-route-table-propagation for prod's
# attachment into $DEV_RT -- dev's own route table simply never
# learns a route to prod's CIDR, so dev physically cannot reach
# prod, while prod can still reach dev for the one-way shared-
# service case. This asymmetry is the actual isolation mechanism --
# not the single "associate" call the main page's own comment
# implies is sufficient on its own.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team follows the main page\'s own Transit Gateway example closely: they create an isolated route table and associate their dev VPC\'s attachment with it, expecting this alone to stop dev from reaching prod. During a security review, they discover dev instances CAN actually reach prod resources through the Transit Gateway. The TGW was created with DefaultRouteTableAssociation=enable and DefaultRouteTablePropagation=enable (the exact options in the main page\'s own create-transit-gateway example). Using this subtopic\'s theory, explain why the "isolation" didn\'t actually isolate anything.',
    hint: 'Association determines which route table an attachment\'s OWN traffic looks up destinations in — but what determines whether another attachment\'s CIDR actually appears as a reachable route inside that table?',
    solution: 'Per this subtopic\'s theory, associating the dev attachment with an "isolated" route table only controls which route table DEV\'s own outbound traffic is evaluated against — it says nothing about which OTHER attachments\' routes are visible inside that table, which is controlled by propagation, a separate and independent mechanism. Because the Transit Gateway was created with DefaultRouteTablePropagation=enable (matching the main page\'s own create-transit-gateway example exactly), every attachment — including the prod VPC\'s — automatically propagated its own routes into every Transit Gateway route table, including the supposedly "isolated" one the dev attachment was associated with. So even though the dev attachment was correctly associated with its own dedicated route table, that table still contained a route to prod\'s CIDR (via automatic propagation), meaning dev could reach prod through it exactly as the security review found. The fix is to create the Transit Gateway with DefaultRouteTableAssociation=disable and DefaultRouteTablePropagation=disable, then explicitly and asymmetrically control propagation per attachment — propagating dev\'s routes into prod\'s table if a one-way shared-service reachability is actually needed, but never propagating prod\'s routes into dev\'s own table — which is the only way to guarantee dev genuinely has no route to prod at all, rather than relying on association alone.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Associating an attachment with a dedicated Transit Gateway route table, by itself, isolates that attachment from every other VPC on the Transit Gateway — matching the main page\'s own "isolated route table" comment.',
      reality: 'Per this subtopic\'s theory, association only determines which route table an attachment\'s own traffic is evaluated against — actual reachability to or from other VPCs depends entirely on the separate route PROPAGATION mechanism, which the main page\'s own code example never configures explicitly.'
    },
    {
      thought: 'An attachment can only ever appear in one Transit Gateway route table at a time, since it\'s only associated with one.',
      reality: 'Per this subtopic\'s theory, an attachment is associated with exactly one route table (governing its OWN traffic), but its routes can be PROPAGATED into any number of OTHER route tables — the two concepts are independent, and confusing them is exactly what leads to the main page\'s own "isolated" example not actually being isolated.'
    },
    {
      thought: 'Achieving one-way reachability (prod can reach dev, but dev cannot reach prod) on a Transit Gateway requires some kind of firewall or security group configuration on the TGW itself.',
      reality: 'Per this subtopic\'s theory, one-way reachability is achieved purely through asymmetric route propagation — propagating dev\'s routes into prod\'s route table but never propagating prod\'s routes into dev\'s — with no firewall or additional security layer needed at the Transit Gateway level.'
    }
  ];
}
