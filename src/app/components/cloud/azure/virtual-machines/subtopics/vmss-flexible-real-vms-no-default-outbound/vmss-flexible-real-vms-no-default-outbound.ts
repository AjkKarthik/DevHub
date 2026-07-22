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
  templateUrl: './vmss-flexible-real-vms-no-default-outbound.html',
  styleUrl: './vmss-flexible-real-vms-no-default-outbound.scss'
})
export class VmssFlexibleRealVmsNoDefaultOutboundSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own quiz explains WHAT Flexible mode supports, but not the architectural reason why — or a real networking consequence',
      points: [
        'The main page\'s own quiz answer states: "Flexible orchestration mode supports heterogeneous VM sizes, mix of manual and auto-scaling, and works with Azure availability sets/zones. Uniform mode uses a single VM profile optimised for stateless scale-out scenarios." This correctly lists FEATURES but never explains the underlying architectural difference that causes them, or any operational consequence of that difference.',
        'Nothing on the main page hints that choosing Flexible mode changes how you manage EVERY instance day-to-day (which API commands work) or introduces a real networking requirement that a team could easily miss.',
      ]
    },
    {
      heading: 'Flexible-mode instances are genuine standalone VM resources — and that has a real networking consequence: no free-riding default outbound access',
      points: [
        'Per Microsoft\'s own documentation, the core architectural difference is the resource type itself: "Virtual machine type | Standard Azure IaaS VM (Microsoft.compute/virtualmachines)" for Flexible orchestration, versus "Scale Set specific VMs (Microsoft.compute/virtualmachinescalesets/virtualmachines)" for Uniform. Flexible orchestration "provides orchestration features over standard Azure IaaS VMs, instead of scale set child virtual machines... you can use all of the standard VM APIs when managing Flexible orchestration instances, instead of the Virtual Machine Scale Set VM APIs you use with Uniform orchestration."',
        'This has a direct, practical consequence the main page never mentions: Uniform-mode instances are NOT full standalone resources at all — per Microsoft\'s own docs, "Individual instances are accessible via Virtual Machine Scale Set VM API commands but lack compatibility with standard Azure IaaS VM API commands, Azure Resource Manager tagging, RBAC, Azure Backup, or Azure Site Recovery." A team wanting to use Azure Backup or per-instance RBAC on individual scale set members needs Flexible mode specifically — Uniform mode cannot do this at all, regardless of configuration.',
        'A genuinely surprising, documented networking gotcha specific to Flexible mode: per Microsoft\'s own feature-comparison table, "Default outbound connectivity | No, must have explicit outbound connectivity" for Flexible orchestration — versus "Yes" for both Uniform orchestration and Availability Sets. A Flexible-mode instance deployed WITHOUT an explicit outbound path (a NAT Gateway, a Standard Load Balancer outbound rule, or its own public IP) has NO internet egress at all — unlike an ordinary standalone VM or a Uniform-mode instance, which get a default outbound path automatically.',
        'VM extensions also require a different targeting choice, per Microsoft\'s own docs: "Use extensions targeted for standard virtual machines, instead of extensions targeted for Uniform orchestration mode instances." An extension package written and tested for Uniform-mode scale sets is not automatically the correct one to use on a Flexible-mode instance.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The missing-outbound-connectivity trap',
      language: 'bash',
      code: `# Create a Flexible-orchestration scale set with no explicit
# outbound path configured (no NAT Gateway, no LB outbound rule,
# no per-instance public IP)
az vmss create \\
  --resource-group my-rg \\
  --name my-flex-vmss \\
  --orchestration-mode Flexible \\
  --image Ubuntu2204 \\
  --vm-sku Standard_D2s_v5 \\
  --instance-count 3 \\
  --zones 1 2 3
  # -- no --public-ip-per-vm, no load balancer outbound rule attached

# Instances deploy successfully, but per Microsoft's own docs,
# Flexible orchestration has "Default outbound connectivity: No,
# must have explicit outbound connectivity" -- SSH into an instance
# and outbound internet calls (e.g. apt update, curl to an external
# API) will fail with no route to the internet at all.

# Compare: the SAME missing configuration on Uniform mode or a
# plain standalone VM works fine by default, since both of those
# get "Default outbound connectivity: Yes" automatically.`,
    },
    {
      label: 'Correct fix — attach a NAT Gateway for explicit outbound',
      language: 'bash',
      code: `# Create a NAT Gateway with its own public IP
az network public-ip create --resource-group my-rg --name nat-ip --sku Standard
az network nat gateway create \\
  --resource-group my-rg --name my-nat-gw \\
  --public-ip-addresses nat-ip

# Associate the NAT Gateway with the VMSS's subnet
az network vnet subnet update \\
  --resource-group my-rg --vnet-name my-vnet --name my-subnet \\
  --nat-gateway my-nat-gw

# Now Flexible-mode instances in that subnet have explicit,
# working outbound connectivity -- matching Microsoft's own
# recommended pattern for satisfying the "must have explicit
# outbound connectivity" requirement.

# Managing a single instance uses STANDARD VM commands, per
# Microsoft's own docs ("you can use all of the standard VM APIs"),
# not VMSS-specific ones:
az vm show --resource-group my-rg --name my-flex-vmss_0
az vm extension set --resource-group my-rg --vm-name my-flex-vmss_0 \\
  --name CustomScriptExtension --publisher Microsoft.Azure.Extensions \\
  --settings '{"commandToExecute":"echo hello"}'`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team migrates a stateless web-tier workload from a Uniform-mode scale set to Flexible mode, copying the exact same VNet/subnet configuration with no other changes, reasoning "it\'s the same workload and network, so behavior should be identical." After the migration, instances can serve inbound traffic from the load balancer fine, but application logs show every outbound API call to a third-party payment service failing. Using this subtopic\'s theory, what changed?',
    hint: 'Per Microsoft\'s own feature-comparison table, is default outbound internet connectivity provided identically by Uniform and Flexible orchestration modes?',
    solution: 'Per this subtopic\'s theory, the root cause is the orchestration-mode switch itself, specifically the default-outbound-connectivity difference. Microsoft\'s own documentation states directly that Flexible orchestration has "Default outbound connectivity: No, must have explicit outbound connectivity," while Uniform orchestration (and plain standalone VMs) get "Yes." The team\'s Uniform-mode scale set was relying on Azure\'s automatic default outbound access — the exact same VNet/subnet configuration that worked fine under Uniform mode does NOT automatically provide outbound internet access under Flexible mode, because Flexible mode does not receive that default at all. The fix is adding explicit outbound connectivity — a NAT Gateway attached to the subnet, or outbound rules on a Standard Load Balancer — which was never configured because it was never needed under the previous, Uniform-mode deployment.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'VMSS Uniform and Flexible orchestration modes differ only in which scaling/availability features they support — the underlying VM resources work the same way in both.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms a real architectural difference — Flexible-mode instances are genuine standalone Microsoft.Compute/virtualMachines resources manageable with standard VM APIs, while Uniform-mode instances are scale-set-specific child resources only accessible via separate VMSS VM API commands, with no compatibility with standard VM APIs, RBAC, Azure Backup, or Site Recovery.'
    },
    {
      thought: 'Migrating a scale set from Uniform to Flexible orchestration mode, keeping the same VNet and subnet, preserves identical networking behavior.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own feature-comparison table documents a real networking difference: Flexible orchestration does not provide default outbound internet connectivity the way Uniform orchestration and standalone VMs do — an explicit NAT Gateway or load-balancer outbound rule must be configured.'
    },
    {
      thought: 'A VM extension written for a Uniform-mode scale set can be applied to a Flexible-mode instance without any changes.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation instructs using "extensions targeted for standard virtual machines, instead of extensions targeted for Uniform orchestration mode instances" for Flexible-mode instances — the two modes require differently-targeted extension packages.'
    }
  ];
}
