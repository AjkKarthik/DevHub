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
  templateUrl: './default-snat-port-allocation-is-per-vm-not-per-ip.html',
  styleUrl: './default-snat-port-allocation-is-per-vm-not-per-ip.scss'
})
export class DefaultSnatPortAllocationIsPerVmNotPerIpSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA cites "~64K SNAT ports" per public IP, but that total is shared across every backend instance — never a per-VM number',
      points: [
        'The main page\'s own QnA states: "Each public IP supports ~64K SNAT ports. High outbound connection rates exhaust these ports, causing new connections to fail silently." Read at face value, this could suggest each VM gets roughly 64,000 ports to itself — which is only true for a backend pool of exactly one instance.',
        'The main page never explains HOW that 64K pool gets divided among multiple backend VMs, which is the actual number that determines whether a specific VM will hit exhaustion under load.',
      ]
    },
    {
      heading: 'Default SNAT port allocation is a documented, pool-size-dependent table — and it caps at 1,024 ports per VM no matter how many frontend IPs you add',
      points: [
        'Per Microsoft\'s own documentation, the 64,000 figure is a per-frontend-IP total that gets divided among the backend pool automatically, using a fixed table: "1-50 [VM instances] → 1,024 [default SNAT ports]... 51-100 → 512... 101-200 → 256... 201-400 → 128... 401-800 → 64... 801-1,000 → 32." A 75-VM backend pool gets 512 ports PER VM by default — not 64,000 divided evenly (which would be ~853), and nowhere close to the full 64K.',
        'Adding more frontend IPs does help, but only up to a hard ceiling: "with 100 VMs in a backend pool and only one frontend IP, each VM receives 512 ports. If you add a second frontend IP, each VM receives an extra 512 ports. This allocation means each VM is allocated a total of 1,024 ports. As a result, adding a third frontend IP doesn\'t increase the number of allocated SNAT ports beyond 1,024 ports." No matter how many public IPs a Standard LB has, DEFAULT allocation never gives a single VM more than 1,024 SNAT ports total.',
        'Microsoft states this default mechanism should never be used for production workloads in the first place: "Don\'t use default port allocation for production workloads, as it allocates a minimal number of ports to each backend instance and increases the risk of SNAT port exhaustion. Instead, consider using NAT Gateway or manually allocating ports on your load balancer outbound rules." The main page\'s own SNAT-prevention QnA already recommends outbound rules and NAT Gateway — this subtopic explains WHY those specific recommendations exist: to escape the restrictive, pool-size-shrinking default table entirely.',
        'Manual allocation via outbound rules follows a genuinely different, much more generous formula, per Microsoft\'s own documentation: "Number of frontend IPs * 64K / Number of backend instances" — for that same 100-VM pool with one frontend IP, manual "ports per instance" allocation gives 640 ports per VM (64,000 / 100) rather than being capped by the default table\'s tier boundaries, and adding frontend IPs scales this figure directly rather than hitting the 1,024 ceiling.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking default allocation for an existing backend pool',
      language: 'bash',
      code: `# Backend pool has 120 VM instances, one frontend IP, default
# port allocation (no outbound rule configured)
az network lb address-pool show \\
  --lb-name my-lb --resource-group my-rg \\
  --name lb-backend --query 'loadBalancerBackendAddresses' \\
  --output table | wc -l
# 120

# Per Microsoft's own default port allocation table, a pool of
# 101-200 VMs gets 256 default SNAT ports per VM per frontend IP --
# NOT a share of 64,000, and NOT the 1-50 tier's more generous 1,024.
# Confirm the actual per-VM allocation:
az network lb outbound-rule list \\
  --lb-name my-lb --resource-group my-rg --output table
# (empty) -- no outbound rule exists, confirming default allocation
# (256 ports/VM) is silently in effect for this 120-VM pool.`,
    },
    {
      label: 'Switching to manual allocation for the same pool',
      language: 'bash',
      code: `# Per Microsoft's own docs, manual "ports per instance" allocation
# uses: Number of frontend IPs * 64K / Number of backend instances
# For 120 VMs, 1 frontend IP: 1 * 64000 / 120 = ~533 ports/VM --
# already more than double the 256/VM the default table would give.

az network lb outbound-rule create \\
  --lb-name my-lb --resource-group my-rg \\
  --name manual-outbound \\
  --frontend-ip-configs lb-frontend \\
  --backend-address-pool lb-backend \\
  --protocol All \\
  --allocated-outbound-ports 533

# Per Microsoft's own docs, this is still explicitly discouraged for
# production compared to NAT Gateway: "Using a NAT gateway is the
# best method for outbound connectivity... doesn't have the same
# concerns of SNAT port exhaustion" -- manual allocation is an
# improvement over the default table, but NAT Gateway avoids the
# fixed-port-budget problem entirely.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team reads the main page\'s own QnA ("Each public IP supports ~64K SNAT ports") and assumes their 150-VM backend pool, sharing one frontend IP with no outbound rule configured, gets roughly 64,000 / 150 ≈ 426 ports per VM. Using this subtopic\'s theory, is this assumption correct?',
    hint: 'Per Microsoft\'s own default SNAT port allocation table, is the per-VM port count actually calculated by dividing the 64,000 total evenly across the pool, or does it follow a fixed set of tier boundaries based on pool size?',
    solution: 'Per this subtopic\'s theory, the team\'s even-division assumption is incorrect — default allocation does not divide 64,000 evenly across the pool. Microsoft\'s own documentation defines fixed tiers instead: a pool of "101-200" VM instances receives exactly "256" default SNAT ports per VM, regardless of whether the pool has 101 VMs or 200 VMs within that tier. For a 150-VM pool, the actual default allocation is 256 ports per VM — noticeably LESS than the team\'s calculated estimate of ~426. This matters directly for exhaustion risk: the team\'s workload would run out of available SNAT ports sooner than their own math predicted, since the real per-VM budget is smaller than an even division of the headline 64,000 figure would suggest. The fix, per Microsoft\'s own recommendation, is to move off default allocation entirely — either configure a manually-allocated outbound rule (which would give this pool roughly 64,000 / 150 ≈ 426 ports per VM per frontend IP, matching the team\'s original intuition) or, better, use NAT Gateway to avoid the fixed-port-budget problem altogether.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The "~64K SNAT ports per public IP" figure the main page cites means each backend VM effectively gets roughly that many ports, or an even division of that total across the pool.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation describes a fixed tier table for default allocation, not an even division — a 101-200 VM pool gets exactly 256 ports per VM regardless of exact pool size within that range, which can be significantly less than a naive 64,000-divided-by-pool-size estimate.'
    },
    {
      thought: 'Adding more public frontend IPs to a Standard Load Balancer always proportionally increases the default SNAT ports available to each backend VM.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms a hard cap: "adding a third frontend IP doesn\'t increase the number of allocated SNAT ports beyond 1,024 ports" — additional frontend IPs help only up to this ceiling, after which they provide no further default-allocation benefit.'
    },
    {
      thought: 'Manually configuring an outbound rule with explicit port allocation is functionally equivalent to just using NAT Gateway, since both solve SNAT exhaustion.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation still rates NAT Gateway as strictly better — "Using a NAT gateway is the best method for outbound connectivity... doesn\'t have the same concerns of SNAT port exhaustion" — manual outbound-rule allocation improves on the default table but is still a fixed, calculated port budget, unlike NAT Gateway\'s dynamic allocation.'
    }
  ];
}
