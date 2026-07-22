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
  templateUrl: './nsg-default-rules-have-exact-priorities-and-can-be-overridden.html',
  styleUrl: './nsg-default-rules-have-exact-priorities-and-can-be-overridden.scss'
})
export class NsgDefaultRulesHaveExactPrioritiesAndCanBeOverriddenSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states default NSG rules can\'t be deleted, but never their actual priority numbers or that a custom rule CAN beat them',
      points: [
        'The main page\'s own theory states: "Default rules allow all inbound traffic within the VNet (VirtualNetwork tag), allow Azure Load Balancer health probes, and deny all other inbound from the internet. You cannot delete default rules." This correctly says they can\'t be deleted, but leaves an open question: if you can\'t delete them, are you stuck with their exact behavior forever?',
        'The main page\'s own codeTab creates a custom "DenyAllInbound" rule at priority 4000 with the comment "already default but visible" — implying the author knows a default deny rule already exists, but never explains WHERE that default rule\'s own priority sits relative to a custom rule like this one.',
      ]
    },
    {
      heading: 'Default rules sit at exactly priority 65000/65001/65500 — deliberately last — so any custom rule effectively always overrides them',
      points: [
        'Per Microsoft\'s own documentation, the exact default rules and priorities are: "AllowVNetInBound — Priority 65000... AllowAzureLoadBalancerInBound — Priority 65001... DenyAllInbound — Priority 65500" (with matching outbound equivalents AllowVnetOutBound, AllowInternetOutBound, and DenyAllOutBound at the same three priority numbers). Since custom rules must use priorities between 100 and 4096, EVERY custom rule you create automatically evaluates before all six default rules, no exceptions.',
        'Microsoft states this design intent directly: "Azure default security rules are given the lowest priority (highest number) to ensure your custom rules are always processed first." This is why the main page\'s own priority-4000 "DenyAllInbound" example works at all — it isn\'t competing with the real default DenyAllInbound rule for evaluation order, it simply always runs first, and Microsoft confirms explicitly: "You can\'t remove the default rules, but you can override them by creating rules with higher priorities [i.e. lower numbers]."',
        'A related, genuinely surprising fact the main page never mentions: certain platform-critical Azure IP addresses bypass NSG evaluation entirely, by default, regardless of any rule you write: "Basic infrastructure services like DHCP, DNS, IMDS, and health monitoring are provided through the virtualized host IP addresses 168.63.129.16 and 169.254.169.254... By default, these services aren\'t subject to the configured network security groups unless targeted by service tags specific to each service." A team writing an aggressive DenyAllInbound-style catch-all rule doesn\'t need to worry about accidentally blocking these — they were never subject to NSG evaluation in the first place, unless the team explicitly targets them using the AzurePlatformDNS/AzurePlatformIMDS/AzurePlatformLKM service tags.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Viewing the real default rules and their priorities',
      language: 'bash',
      code: `# List every rule on an NSG, including the six built-in defaults
az network nsg rule list \\
  --nsg-name web-nsg --resource-group my-rg \\
  --include-default --output table
# Name                          Priority  Direction  Access
# ----------------------------  --------  ---------  ------
# AllowHTTP                     100       Inbound    Allow
# AllowAzureMonitor              200      Outbound   Allow
# DefaultDenyAll (custom, main page's example) 4000  Inbound Deny
# AllowVNetInBound               65000    Inbound    Allow
# AllowAzureLoadBalancerInBound  65001    Inbound    Allow
# DenyAllInbound                 65500    Inbound    Deny
# AllowVnetOutBound              65000    Outbound   Allow
# AllowInternetOutBound          65001    Outbound   Allow
# DenyAllOutBound                65500    Outbound   Deny

# Note: without the --include-default flag, "az network nsg rule
# list" only shows CUSTOM rules -- the six defaults are invisible
# unless you ask for them explicitly.`,
    },
    {
      label: 'Platform IPs bypass NSGs unless explicitly targeted',
      language: 'bash',
      code: `# A broad outbound deny rule, intended to lock down egress
az network nsg rule create \\
  --nsg-name web-nsg --resource-group my-rg \\
  --name DenyAllOutboundExceptWeb \\
  --priority 300 \\
  --destination-address-prefixes '*' \\
  --destination-port-ranges '*' \\
  --protocol '*' --access Deny --direction Outbound

# Per Microsoft's own docs, this does NOT block host-level services
# on 168.63.129.16 / 169.254.169.254 by default: "these services
# aren't subject to the configured network security groups unless
# targeted by service tags specific to each service." DHCP, DNS,
# IMDS, and health monitoring keep working through this rule.

# To explicitly ALSO block them (rarely needed, but documented):
az network nsg rule create \\
  --nsg-name web-nsg --resource-group my-rg \\
  --name DenyPlatformDNS --priority 250 \\
  --destination-address-prefixes AzurePlatformDNS \\
  --destination-port-ranges '*' \\
  --protocol '*' --access Deny --direction Outbound`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own example, a team creates a custom "DenyAllInbound" rule at priority 4000, reasoning "the built-in default deny rule is also inbound-deny, so ours at 4000 is redundant — maybe we should just rely on the platform default instead and delete ours to simplify the NSG." Using this subtopic\'s theory, evaluate this reasoning.',
    hint: 'Per Microsoft\'s own documented priority numbers, is a rule at priority 4000 actually competing with (or redundant with) the built-in DenyAllInbound rule, given where that built-in rule sits in the evaluation order?',
    solution: 'Per this subtopic\'s theory, the team\'s specific reasoning about redundancy is technically correct in OUTCOME (both rules deny all remaining inbound traffic) but the underlying assumption that they are interchangeable is worth double-checking before deleting anything. Microsoft\'s own documentation confirms the built-in DenyAllInbound rule sits at priority 65500 — "the lowest priority (highest number) to ensure your custom rules are always processed first" — while custom rules like the team\'s priority-4000 example must use the 100-4096 range. Because ALL custom rules (100-4096) always evaluate before ALL default rules (65000+), the team\'s explicit priority-4000 rule and the built-in 65500 rule genuinely produce identical final behavior for THIS NSG in isolation — the explicit one is redundant here. However, the explicit custom rule has one practical advantage the built-in default doesn\'t: it\'s visible without passing --include-default to `az network nsg rule list`, and it documents INTENT clearly in the NSG\'s own rule set for anyone reviewing it later — Microsoft\'s own guidance never says to prefer relying on the invisible default over an explicit rule for clarity purposes, only that the two evaluate in the order described. Removing the explicit rule is not unsafe, but keeping it is a reasonable choice for auditability, not something to eliminate purely because it "looks redundant."'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since default NSG rules can\'t be deleted, a resource is always subject to their exact behavior with no way to change the effective outcome.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms default rules sit at the lowest possible priority (65000/65001/65500) specifically so that "you can override them by creating rules with higher priorities" — you can\'t delete them, but any custom rule you add effectively supersedes their behavior for matching traffic.'
    },
    {
      thought: 'A NSG rule denying all outbound traffic blocks every kind of communication leaving a VM, including basic Azure platform services like DNS resolution and instance metadata.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states that traffic to the platform IPs 168.63.129.16 and 169.254.169.254 (DHCP, DNS, IMDS, health monitoring) "aren\'t subject to the configured network security groups unless targeted by service tags specific to each service" — these keep working through a broad deny-all rule unless explicitly targeted.'
    },
    {
      thought: 'Listing NSG rules with a standard CLI command shows the complete, real rule set that\'s actually being evaluated, including the built-in defaults.',
      reality: 'Per this subtopic\'s theory, the default az network nsg rule list command only shows custom rules — the six built-in default rules are hidden from the output unless the --include-default flag is explicitly passed, which can make an NSG appear to have fewer active rules than it really does.'
    }
  ];
}
