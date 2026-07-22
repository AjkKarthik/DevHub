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
  templateUrl: './default-outbound-access-retired-march-2026.html',
  styleUrl: './default-outbound-access-retired-march-2026.scss'
})
export class DefaultOutboundAccessRetiredMarch2026Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own SNAT QnA covers exhaustion prevention but never addresses a more basic question: does a VM have outbound internet access at all by default?',
      points: [
        'The main page\'s own QnA states: "SNAT (Source NAT) translates private VM IPs to a public load balancer IP for outbound internet connections... Prevention: (1) add multiple public IPs via outbound rules, (2) use NAT Gateway... (3) reduce outbound connections using Private Endpoints." This assumes an outbound path already exists and needs tuning — it never addresses whether one exists at all for a VM that\'s only behind an INTERNAL load balancer.',
        'This gap matters because the main page\'s own theory covers both public AND internal frontend IP configurations ("Frontend IP configurations: public... or internal... Internal load balancers distribute traffic between VMs within a VNet for multi-tier apps") without ever connecting internal-only backend VMs to the outbound connectivity story at all.',
      ]
    },
    {
      heading: 'Azure ranks five outbound connectivity methods by priority, and the implicit "default outbound access" fallback the main page never mentions was actually retired for new VNets as of March 31, 2026',
      points: [
        'Per Microsoft\'s own documentation, Azure has a strict, documented priority order for which method actually provides outbound connectivity when multiple could apply: "1. Associate a NAT gateway to the subnet... 2. Assign a public IP to the virtual machine... 3. Use the frontend IP address(es) of a load balancer for outbound via outbound rules... 4. ...without outbound rules... 5. Default outbound access" — rated from "Best" (NAT Gateway) down to "Worst" (default outbound access) in Microsoft\'s own table.',
        'A VM behind ONLY an internal Standard Load Balancer (no public frontend anywhere in the picture) gets none of methods 1-3 unless something else is explicitly configured — it has no NAT Gateway association, no instance-level public IP, and no public load balancer frontend to source SNAT from at all. That leaves only the two "worst" fallback methods, and one of them no longer exists for new deployments.',
        'Per Microsoft\'s own documentation: "On March 31, 2026, new virtual networks default to using private subnets... Use one of the explicit forms of connectivity as shown in options 1-3 above." Default outbound access — the implicit, no-configuration-needed fallback that used to quietly give every VM SOME outbound path — is retired for new VNets as of this date, which has already passed. A VM deployed today behind only an internal load balancer, with no NAT Gateway and no other explicit outbound method, now has genuinely ZERO outbound internet connectivity — not a degraded fallback, an outright absence.',
        'Microsoft is explicit that this was never meant to be relied upon even before retirement: "This method of access is not recommended as it\'s insecure and the IP addresses are subject to change." The retirement formalizes what was already bad practice — the main page\'s own SNAT theory jumping straight into exhaustion PREVENTION skips over this more fundamental "do you have a path at all" question entirely.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A VM with genuinely no outbound path (post-retirement)',
      language: 'bash',
      code: `# VM's ONLY network association is an INTERNAL Standard Load
# Balancer -- no public LB frontend, no instance-level public IP,
# no NAT Gateway on the subnet
az network lb create \\
  --name internal-lb --resource-group my-rg \\
  --sku Standard \\
  --frontend-ip-name internal-frontend \\
  --private-ip-address 10.0.1.100 \\
  --vnet-name my-vnet --subnet app-subnet \\
  --backend-pool-name internal-backend

# SSH into the VM and test outbound internet access
curl -m 5 https://www.microsoft.com
# curl: (28) Failed to connect... Connection timed out
# Per Microsoft's own docs: "new virtual networks default to using
# private subnets" as of March 31, 2026 -- there is no more implicit
# fallback. This VM has NONE of the five documented outbound methods
# configured, so it has no outbound internet path at all.`,
    },
    {
      label: 'Adding an explicit outbound method — NAT Gateway (Microsoft\'s own top recommendation)',
      language: 'bash',
      code: `# Per Microsoft's own docs, NAT Gateway is rated "Best": "Using a
# NAT gateway is the best method for outbound connectivity... doesn't
# have the same concerns of SNAT port exhaustion" -- and it takes
# precedence over every other method automatically.
az network public-ip create \\
  --name nat-ip --resource-group my-rg \\
  --sku Standard --allocation-method Static

az network nat gateway create \\
  --name my-nat --resource-group my-rg \\
  --public-ip-addresses nat-ip

az network vnet subnet update \\
  --name app-subnet --vnet-name my-vnet \\
  --resource-group my-rg --nat-gateway my-nat

# Re-test -- now succeeds, routed through the NAT Gateway's own
# public IP, completely independent of the internal load balancer
curl -m 5 https://www.microsoft.com
# <!doctype html>...`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own multi-tier architecture pattern (public-facing web tier + internal-only database tier behind an internal load balancer), a team deploys their database VMs today with no NAT Gateway and no public IPs, reasoning "these VMs never need outbound internet access anyway, they only serve internal queries." A few weeks later, they need those VMs to reach an external API for a one-time data migration script, and the connection times out. Using this subtopic\'s theory, explain why, and what the team needs to add.',
    hint: 'Per Microsoft\'s own documentation, as of March 31, 2026, does a VM with no explicitly configured outbound method have ANY fallback outbound path at all?',
    solution: 'Per this subtopic\'s theory, the connection times out because the VMs genuinely have no outbound internet path configured — and, critically, no fallback exists anymore to quietly provide one. Microsoft\'s own documentation confirms that prior to March 31, 2026, a VM in this exact situation would have silently received "default outbound access" — an implicit, insecure fallback IP that at least worked, even though Microsoft never recommended relying on it. Since that date, "new virtual networks default to using private subnets," meaning this fallback no longer applies to VMs in a newly-created VNet. The database VMs have none of the three legitimate, explicit outbound methods configured (no NAT Gateway on the subnet, no instance-level public IPs, no outbound rules on a public load balancer) — they were never given ANY outbound path, they simply never needed one until now. To fix it, per Microsoft\'s own top recommendation, the team should associate a NAT Gateway with the database subnet — it "takes precedence over other outbound connectivity methods" and requires no changes to the VMs themselves or the existing internal load balancer configuration.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Every Azure VM automatically has some form of outbound internet connectivity by default, even with no explicit configuration.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms this implicit fallback ("default outbound access") was retired for new virtual networks as of March 31, 2026 — a VM with none of the three explicit outbound methods configured now has no outbound path at all, not a degraded one.'
    },
    {
      thought: 'A VM behind an internal (private-frontend) load balancer gets outbound internet access through that same load balancer, the same way a VM behind a public load balancer does.',
      reality: 'Per this subtopic\'s theory, an internal load balancer has no public frontend IP to source SNAT from at all — the outbound-via-load-balancer methods in Microsoft\'s own documentation specifically require a PUBLIC load balancer frontend; an internal-only setup needs a separate, explicit outbound method like NAT Gateway.'
    },
    {
      thought: 'Multiple outbound connectivity methods configured on the same VM combine or add together for more available SNAT capacity.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation describes a strict PRIORITY order, not an additive one — "NAT gateway takes precedence over other outbound connectivity methods, including a load balancer, instance-level public IP addresses" — only the highest-priority configured method is actually used, the others are ignored while it\'s present.'
    }
  ];
}
