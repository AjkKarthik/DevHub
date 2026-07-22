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
  templateUrl: './standard-sku-public-ips-are-now-always-static-not-dynamic.html',
  styleUrl: './standard-sku-public-ips-are-now-always-static-not-dynamic.scss'
})
export class StandardSkuPublicIpsAreNowAlwaysStaticNotDynamicSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry explains what az vm deallocate stops billing for — but says nothing about what happens to the VM\'s public IP address',
      points: [
        'The main page\'s own mistake entry #1 states: "An OS-level shutdown puts the VM in Stopped state but Azure still bills for compute because the capacity is reserved. Only az vm deallocate (or portal Stop) releases the compute — then billing stops." This is entirely accurate about billing, but a team stopping and restarting a VM has a second, unaddressed question: does the VM keep the same public IP address across that stop/start cycle?',
        'This matters directly for two things the main page\'s own theory and mistakes DO cover elsewhere: firewall allowlisting for SSH/RDP access (mistake #3, restricting source IPs) and DNS-based access — both of which silently break if the VM\'s OWN public IP changes unexpectedly after a routine deallocate/start.',
      ]
    },
    {
      heading: 'The classic "dynamic IP changes after restart" gotcha is now largely resolved — because Basic SKU public IPs (the only ones with that behavior) were retired in September 2025',
      points: [
        'Per Microsoft\'s own documentation, the actual mechanism was always about IP allocation METHOD, not VM state directly: "Dynamic - The IP address isn\'t given to the resource at the time of creation when selecting dynamic. The IP is assigned when you associate the public IP address with a resource. The IP address is released when you stop, or delete the resource... a public IP resource is released from a VM upon stop and then start. Any associated IP address is released if the allocation method is dynamic." A Dynamic-allocation public IP genuinely can (and often does) change on every deallocate/start cycle.',
        'The escape hatch has always been Static allocation: "If you don\'t want the IP address to change, set the allocation method to static to ensure the IP address remains the same." A Static-allocation public IP keeps its address across stop/start; it only changes if the IP resource itself is deleted.',
        'The genuinely current, surprising fact: as of Microsoft\'s own documented retirement, "On September 30, 2025, Basic SKU public IPs were retired... If you are currently using Basic SKU public IPs, make sure to upgrade to Standard SKU as soon as possible." Basic SKU was the ONLY SKU that ever supported true Dynamic IPv4 allocation. Per Microsoft\'s own SKU comparison table, Standard SKU\'s allocation method for IPv4 is "Static" — full stop, with no Dynamic option at all. Since Basic SKU is now retired, essentially every current VM\'s public IP is Static by default, and the classic "my VM got a new IP after I stopped and started it" surprise is now a legacy concern for VMs that haven\'t yet been migrated off old Basic-SKU IPs, not a risk facing a newly-created VM today.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Confirming a VM\'s public IP allocation method and SKU',
      language: 'bash',
      code: `# Check the public IP resource attached to a VM's NIC
az network public-ip show \\
  --resource-group my-rg \\
  --name my-vm-ip \\
  --query '{Sku:sku.name, Allocation:publicIPAllocationMethod, Address:ipAddress}' \\
  --output table
# Sku       Allocation   Address
# --------  -----------  --------------
# Standard  Static       20.55.100.42

# Per Microsoft's own docs, since Basic SKU public IPs were retired
# on September 30, 2025, a public IP created today is Standard SKU
# by default -- and Standard SKU's IPv4 allocation method is ALWAYS
# Static, with no Dynamic option available at all.`,
    },
    {
      label: 'Demonstrating the stop/start behavior explicitly',
      language: 'bash',
      code: `# Deallocate and restart -- with a Static-allocation Standard SKU IP
az vm deallocate --resource-group my-rg --name my-vm
az vm start --resource-group my-rg --name my-vm
az vm show -d --resource-group my-rg --name my-vm \\
  --query publicIps --output tsv
# 20.55.100.42  -- SAME address as before the deallocate; per
# Microsoft's own docs, only Dynamic-allocation IPs are released on
# stop -- Static ones are released only "when the resource is
# deleted," never on a stop/start cycle.

# The legacy Basic-SKU Dynamic behavior (now retired for new IPs,
# but worth understanding since it's what the "IP changes on
# restart" advice was originally about):
# "The IP address is released when you stop, or delete the
# resource... a public IP resource is released from a VM upon stop
# and then start. Any associated IP address is released if the
# allocation method is dynamic."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A senior engineer warns a junior teammate: "Be careful — every time you stop and start an Azure VM, its public IP address changes, so don\'t hardcode it anywhere." The junior teammate checks their newly-created VM, deallocates it, restarts it, and finds the public IP is unchanged. Using this subtopic\'s theory, reconcile the senior engineer\'s advice with what the junior teammate actually observed.',
    hint: 'Per Microsoft\'s own documentation, does a VM\'s public IP change on stop/start because of the VM\'s state, or because of a specific property of the public IP resource itself — and has the availability of that property recently changed?',
    solution: 'Per this subtopic\'s theory, both observations are consistent once the underlying mechanism is understood correctly. The senior engineer\'s advice describes genuinely correct behavior for a Dynamic-allocation public IP — Microsoft\'s own documentation confirms "the IP address is released when you stop... a public IP resource is released from a VM upon stop and then start" for Dynamic allocation specifically. However, the junior teammate\'s newly-created VM almost certainly received a Standard SKU public IP, since Microsoft\'s own documentation confirms "On September 30, 2025, Basic SKU public IPs were retired" — and Standard SKU only supports Static allocation for IPv4, never Dynamic. A Static-allocation IP is released only "when the resource is deleted," not on a stop/start cycle, which is exactly what the junior teammate observed. The senior engineer\'s advice was accurate for the Basic-SKU era but is now largely outdated for any VM provisioned with a current, Standard-SKU public IP — though it remains good practice to explicitly confirm the allocation method (az network public-ip show) rather than assume, especially on older resources that may predate the Basic SKU retirement.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Every Azure VM\'s public IP address changes automatically whenever the VM is stopped and started, regardless of any configuration.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation ties this behavior specifically to Dynamic IP allocation, not VM state changes in general — a Static-allocation IP (now the ONLY option under Standard SKU, since Basic SKU was retired September 30, 2025) keeps the same address across a stop/start cycle.'
    },
    {
      thought: 'Since Basic SKU public IPs are retired, the concept of "dynamic" public IP allocation no longer exists in Azure at all.',
      reality: 'Per this subtopic\'s theory, Dynamic allocation as a general Azure concept still exists for IPv6 and for other resource types\' allocation options — what changed specifically is that Standard SKU (now mandatory for new public IPv4 addresses) only offers Static allocation, making the classic "IP changes on restart" surprise unlikely for a newly-created VM\'s public IPv4, not eliminating dynamic allocation as a concept everywhere.'
    },
    {
      thought: 'A VM\'s public IP address is guaranteed to never change as long as the VM itself is never deleted.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation ties IP release to the PUBLIC IP RESOURCE\'S OWN deletion, not the VM\'s — a Static IP survives VM stop/start, but if the IP resource itself is ever unassigned or deleted (e.g. during a NIC reconfiguration), the address is released regardless of the VM\'s own lifecycle.'
    }
  ];
}
