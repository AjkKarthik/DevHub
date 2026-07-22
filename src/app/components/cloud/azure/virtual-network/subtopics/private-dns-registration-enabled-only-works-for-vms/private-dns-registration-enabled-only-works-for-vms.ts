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
  templateUrl: './private-dns-registration-enabled-only-works-for-vms.html',
  styleUrl: './private-dns-registration-enabled-only-works-for-vms.scss'
})
export class PrivateDnsRegistrationEnabledOnlyWorksForVmsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own codeTab sets --registration-enabled false with zero explanation of what the flag does or why false is the right choice here',
      points: [
        'The main page\'s own "VNet Peering & Private Endpoint" codeTab ends with: "az network private-dns link vnet create... --registration-enabled false" — the flag is set explicitly, but nothing in the main page\'s theory, mistakes, or QnA ever defines what registration-enabled actually controls, or why this specific example sets it to false rather than true or simply omitting it.',
        'This leaves a real gap for a reader trying to adapt the example: is false the "safe default," a mistake, or a deliberate choice tied specifically to this being a Storage Account private endpoint rather than some other resource type?',
      ]
    },
    {
      heading: 'registration-enabled (autoregistration) only manages DNS records for VIRTUAL MACHINES — it is genuinely irrelevant to the Storage Account private endpoint scenario the main page\'s own example uses',
      points: [
        'Per Microsoft\'s own documentation: "The Azure DNS private zones autoregistration feature manages DNS records for virtual machines deployed in a virtual network. When you link a virtual network with a private DNS zone with this setting enabled, a DNS record gets created for each virtual machine deployed in the virtual network... When a virtual machine gets deleted or stopped, the autoregistered DNS records associated with this virtual machine are removed." This is entirely automatic A-record management SPECIFICALLY for VMs — it has nothing to do with the private endpoint DNS record the main page\'s own mistake entry #2 is actually about.',
        'Microsoft states the restriction explicitly: "Autoregistration works only for virtual machines. For all other resources like internal load balancers, you can create DNS records manually in the private DNS zone linked to the virtual network." A Storage Account private endpoint is squarely in this "all other resources" category — setting registration-enabled to true would do nothing useful for it; the A record mapping the storage account\'s hostname to its private endpoint IP still has to be created separately (which is exactly what the private endpoint creation process does automatically, independent of this flag).',
        'There is also a real constraint that makes leaving registration-enabled true casually risky: "A specific virtual network can be linked to only one private DNS zone when automatic registration is enabled. You can, however, link multiple virtual networks to a single DNS zone." A VNet hosting private endpoints for several different PaaS services typically needs to link to SEVERAL different privatelink.*.windows.net zones (one per service type) — if autoregistration were turned on for one of those links, it would consume the VNet\'s only autoregistration slot, and no other zone linked to that VNet could use it.',
        'Two further restrictions round out why the main page\'s own example correctly avoids relying on autoregistration for anything: "DNS records are created automatically only for the primary virtual machine NIC" (a moot point for a Storage private endpoint, which has no VM NIC at all) and "Autoregistration doesn\'t support reverse DNS pointer (PTR) records."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why registration-enabled=true would be pointless here',
      language: 'bash',
      code: `# The main page's own example -- correctly sets false, since this
# is a Storage Account private endpoint, not a VM
az network private-dns link vnet create \\
  --resource-group my-rg \\
  --zone-name "privatelink.blob.core.windows.net" \\
  --name dns-link \\
  --virtual-network my-vnet \\
  --registration-enabled false

# Setting this to true would do NOTHING for the storage account's
# own DNS record -- per Microsoft's own docs: "Autoregistration
# works only for virtual machines." The A record mapping
# mystorage.blob.core.windows.net to the private endpoint's IP is
# created by the private endpoint provisioning process itself,
# completely independent of this flag.`,
    },
    {
      label: 'A scenario where registration-enabled=true genuinely helps',
      language: 'bash',
      code: `# A VNet running application VMs that need to resolve each other
# by hostname (e.g. for a clustered app) -- THIS is autoregistration's
# actual use case
az network private-dns zone create \\
  --resource-group my-rg --name "internal.contoso.com"

az network private-dns link vnet create \\
  --resource-group my-rg \\
  --zone-name "internal.contoso.com" \\
  --name vm-autoreg-link \\
  --virtual-network my-vnet \\
  --registration-enabled true

# Per Microsoft's own docs: "a DNS record gets created for each
# virtual machine deployed in the virtual network... DNS records
# for newly deployed virtual machines are also automatically
# created... When a virtual machine gets deleted or stopped, the
# autoregistered DNS records... are removed." New VM "app-01"
# automatically becomes resolvable as app-01.internal.contoso.com
# with zero manual DNS record creation.

# CONSTRAINT: this VNet can now only have autoregistration enabled
# on THIS ONE zone link -- a second privatelink zone linked to the
# same VNet must use --registration-enabled false.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team is setting up private endpoints for three different PaaS services (Storage, Key Vault, SQL Database) in the same VNet, and separately wants VM-to-VM hostname resolution within that same VNet via a custom internal.contoso.com zone. They plan to set --registration-enabled true on all four private DNS zone links "to be thorough and make sure everything resolves automatically." Using this subtopic\'s theory, what will actually happen?',
    hint: 'Per Microsoft\'s own documentation, how many private DNS zone links with autoregistration enabled can a single VNet have at once — and does autoregistration do anything at all for a Storage/Key Vault/SQL private endpoint resource?',
    solution: 'Per this subtopic\'s theory, the team\'s plan will fail outright, not just be redundant. Microsoft\'s own documentation states directly: "A specific virtual network can be linked to only one private DNS zone when automatic registration is enabled." Attempting to set registration-enabled true on all four links (three privatelink.*.windows.net zones plus the custom internal.contoso.com zone) for the same VNet will fail for every link after the first one succeeds. Beyond the hard limit, three of those four settings would also be functionally pointless even if the limit didn\'t exist — Microsoft\'s own documentation confirms "Autoregistration works only for virtual machines," and Storage, Key Vault, and SQL Database private endpoints are not virtual machines, so enabling autoregistration on those three zone links would create no useful DNS records at all. The correct configuration is registration-enabled false on the three PaaS privatelink zone links (their DNS records come from the private endpoint provisioning process itself, unrelated to this flag) and registration-enabled true only on the one zone link that actually needs automatic VM DNS records — the custom internal.contoso.com zone.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The registration-enabled flag on a private DNS zone link controls whether the zone works correctly for ANY resource type, including private endpoints for PaaS services.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms autoregistration is scoped specifically to virtual machines — "Autoregistration works only for virtual machines. For all other resources like internal load balancers, you can create DNS records manually" — a private endpoint\'s own DNS record is created through an entirely separate mechanism, unrelated to this flag.'
    },
    {
      thought: 'Setting registration-enabled to true is always the safer or more complete choice, since it automates DNS record management.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation describes a real constraint that makes this risky to set broadly: a single VNet "can be linked to only one private DNS zone when automatic registration is enabled" — enabling it on the wrong zone link can prevent enabling it on a zone link that actually needs it.'
    },
    {
      thought: 'Autoregistration creates DNS records for every network interface on a multi-NIC virtual machine.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states "DNS records are created automatically only for the primary virtual machine NIC" — records for any additional NICs on the same VM must be created manually.'
    }
  ];
}
