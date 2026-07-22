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
  templateUrl: './security-admin-rules-can-bypass-nsg-evaluation-entirely.html',
  styleUrl: './security-admin-rules-can-bypass-nsg-evaluation-entirely.scss'
})
export class SecurityAdminRulesCanBypassNsgEvaluationEntirelySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats NSGs as the final word on subnet/NIC traffic filtering — a reasonable assumption at the individual-VNet scale it teaches, but not universally true',
      points: [
        'The main page\'s own theory and QnA describe NSG evaluation thoroughly — priority order, subnet vs. NIC scope, default rules — consistently treating "what does the NSG say" as the complete answer to "is this traffic allowed." Nothing on the main page hints that a DIFFERENT rule layer, evaluated BEFORE any NSG, can exist above it.',
        'This is a reasonable simplification for a single-VNet, single-team scenario — but large organizations managing many VNets across many subscriptions have a real, documented mechanism specifically for enforcing rules that individual NSG owners can\'t override, which the main page never introduces at all.',
      ]
    },
    {
      heading: 'Azure Virtual Network Manager\'s "Security Admin Rules" sit above every NSG and can terminate traffic evaluation before any NSG rule is ever consulted',
      points: [
        'Per Microsoft\'s own documentation: "Security admin rules are global network security rules that enforce security policies onto virtual networks. Security admin rules originate from Azure Virtual Network Manager, a management service that enables network administrators to group, configure, deploy, and manage virtual networks globally across subscriptions... Security admin rules always have a higher priority than network security group rules and thus are evaluated first."',
        'The exact evaluation behavior depends on the admin rule\'s own action type, and two of the three types skip NSG evaluation entirely: "\'Allow\' security admin rules continue for evaluation by matching network security group rules. \'Always allow\' and \'Deny\' security admin rules, however, terminate traffic evaluation after the security admin rule is processed. \'Always allow\' security admin rules send traffic directly to the resource, bypassing potentially conflicting network security group rules. \'Deny\' security admin rules block the traffic without delivering it to the destination." A resource owner staring at their own NSG rules, confident they permit some traffic, can be wrong if a "Deny" security admin rule exists upstream — their NSG\'s own ALLOW rule is never even reached.',
        'The reverse surprise is also real and explicitly named: an "Always allow" security admin rule delivers traffic to the resource "bypassing potentially conflicting network security group rules" — meaning a resource owner\'s own explicit DENY rule in their NSG can be silently overridden by an org-level "Always allow" policy they may not even know exists, let alone have permission to see or change.',
        'Microsoft frames the entire feature around exactly this kind of organizational control problem: these rule types exist "for enforcing traffic delivery and preventing conflicting or unintended behavior by downstream network security group rules" — the feature is deliberately designed to let central network/security teams enforce policy that individual subnet or NIC owners cannot accidentally (or deliberately) override with their own NSG configuration.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A resource owner\'s NSG allow rule that never actually gets evaluated',
      language: 'bash',
      code: `# A team's own NSG explicitly allows SSH from their office IP
az network nsg rule create \\
  --nsg-name dev-nsg --resource-group dev-rg \\
  --name AllowOfficeSSH --priority 100 \\
  --source-address-prefixes 203.0.113.10 \\
  --destination-port-ranges 22 \\
  --protocol Tcp --access Allow --direction Inbound

# Team confirms their own NSG rule looks correct:
az network nsg rule list --nsg-name dev-nsg \\
  --resource-group dev-rg --output table
# AllowOfficeSSH  100  Inbound  Allow  <- looks fine in isolation

# But if the organization's network admin has configured a "Deny"
# Security Admin Rule for port 22 across the whole subscription via
# Azure Virtual Network Manager, per Microsoft's own docs: "'Deny'
# security admin rules... terminate traffic evaluation after the
# security admin rule is processed... block the traffic without
# delivering it to the destination." SSH from the office IP still
# fails -- the team's own AllowOfficeSSH rule is NEVER REACHED,
# because evaluation stopped at the admin rule layer above it.
# The team's own NSG tooling gives no visibility into this at all.`,
    },
    {
      label: 'Checking for Virtual Network Manager involvement',
      language: 'bash',
      code: `# If traffic behaves unexpectedly despite a seemingly-correct NSG,
# check whether the VNet is managed by an Azure Virtual Network
# Manager instance with security admin configurations applied
az network manager list --output table

az network manager security-admin-config list \\
  --network-manager-name my-org-avnm \\
  --resource-group network-rg --output table

# List the actual admin rules within a rule collection
az network manager security-admin-config rule-collection rule list \\
  --network-manager-name my-org-avnm \\
  --resource-group network-rg \\
  --configuration-name global-baseline \\
  --rule-collection-name deny-legacy-ports \\
  --output table
# Per Microsoft's own docs, these rules "always have a higher
# priority than network security group rules and thus are
# evaluated first" -- this is the layer to check BEFORE assuming
# an NSG misconfiguration is the cause of unexpected traffic
# behavior in an enterprise environment.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s NSG has an explicit rule denying inbound traffic on port 3389 (RDP), added deliberately for security. Despite this, RDP connections to their VM are succeeding from an IP range they never intended to allow. They\'ve triple-checked their own NSG rule priorities and confirm the deny rule is correctly configured and would normally take effect. Using this subtopic\'s theory, what else should they investigate?',
    hint: 'Per Microsoft\'s own documentation, is a well-configured NSG deny rule guaranteed to be the final word on whether traffic is blocked, or can a different, higher-priority rule layer override it entirely?',
    solution: 'Per this subtopic\'s theory, the team should investigate whether an Azure Virtual Network Manager "Always allow" security admin rule is in effect for their VNet, since this is a documented mechanism that can override their own NSG deny rule entirely. Microsoft\'s own documentation states directly: "\'Always allow\' security admin rules... terminate traffic evaluation after the security admin rule is processed. \'Always allow\' security admin rules send traffic directly to the resource, bypassing potentially conflicting network security group rules." If a network administrator configured an org-wide "Always allow" rule for that IP range or port (for a legitimate reason like a monitoring service or a jump-host range the team may not be aware of), it would explain exactly the symptom described — the team\'s own correctly-configured NSG deny rule is never even reached, because security admin rules "always have a higher priority than network security group rules and thus are evaluated first." The team should check for an Azure Virtual Network Manager instance managing their VNet and review its security admin configurations, since their own NSG-level tooling gives no visibility into this layer at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A resource\'s own NSG rules are always the final, authoritative answer to whether specific traffic is allowed or denied.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation describes Security Admin Rules from Azure Virtual Network Manager as sitting above NSGs entirely — they "always have a higher priority than network security group rules and thus are evaluated first," and can terminate evaluation before any NSG rule is ever consulted.'
    },
    {
      thought: 'If an organization uses Azure Virtual Network Manager, its policies only ever ADD extra restrictions on top of whatever an NSG already allows — never override an NSG\'s own explicit deny rule.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms the opposite is also possible: an "Always allow" security admin rule "send[s] traffic directly to the resource, bypassing potentially conflicting network security group rules" — meaning it can override a resource owner\'s own explicit NSG deny rule, not just add further restrictions.'
    },
    {
      thought: 'Every security admin rule behaves the same way once matched — either it blocks traffic or it doesn\'t, with no further distinction.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation distinguishes three action types with genuinely different evaluation behavior — "Allow" rules let evaluation continue to NSG rules afterward, while "Always allow" and "Deny" rules both terminate evaluation immediately, in opposite directions (force-allow vs. force-block).'
    }
  ];
}
