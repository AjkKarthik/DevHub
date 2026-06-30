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
  selector: 'app-azure-virtual-network',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './virtual-network.html',
  styleUrl: './virtual-network.scss'
})
export class AzureVirtualNetwork {

  quickRef: QuickRefItem[] = [
    { name: 'VNet', type: 'type', desc: 'Virtual Network — an isolated private network in Azure with a defined address space (CIDR). Resources in a VNet communicate privately.' },
    { name: 'Subnet', type: 'type', desc: 'A subdivision of a VNet address space. Each subnet can have its own NSG, route table, and service endpoints.' },
    { name: 'NSG', type: 'type', desc: 'Network Security Group — stateful firewall rules (allow/deny) applied to a subnet or NIC. Evaluated by priority (lower number = higher priority).' },
    { name: 'UDR', type: 'type', desc: 'User-Defined Route — overrides Azure\'s default routing to force traffic through a firewall (NVA) or VPN gateway.' },
    { name: 'VNet Peering', type: 'type', desc: 'Low-latency, private connectivity between two VNets (same or different region/subscription). Traffic stays on the Azure backbone.' },
    { name: 'Private Endpoint', type: 'type', desc: 'A private NIC inside your VNet that maps to a PaaS service (Storage, SQL, Key Vault). Eliminates public internet exposure for PaaS.' },
    { name: 'Service Endpoint', type: 'type', desc: 'Extends a VNet subnet\'s identity to a PaaS service over the Azure backbone — simpler than Private Endpoint but traffic still exits VNet.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'VNet & Subnet Design',
      points: [
        'A VNet is defined by an address space — one or more CIDR blocks (e.g. 10.0.0.0/16). All resources in the VNet share this space; subnets carve out smaller ranges within it.',
        'Subnets must not overlap within a VNet or across peered VNets. Plan address spaces before deployment — expanding a VNet requires adding additional CIDR blocks, and changing subnet ranges requires stopping all resources in the subnet.',
        'Azure reserves 5 IP addresses per subnet: the network address, broadcast address, and 3 Azure-internal addresses (.0, .1, .2, .3 are reserved plus the last). A /28 subnet has 16 − 5 = 11 usable IPs.',
        'Dedicated subnets are required for: Azure Bastion (/26 minimum, named AzureBastionSubnet), VPN Gateway (named GatewaySubnet), Azure Firewall (named AzureFirewallSubnet /26), and AKS node pools.',
        'Service Endpoints on a subnet extend the subnet\'s identity to PaaS services (Storage, SQL, Key Vault) over the Azure backbone, allowing firewall rules that restrict access to specific subnets.',
      ]
    },
    {
      heading: 'Network Security Groups (NSG)',
      points: [
        'NSGs contain inbound and outbound security rules. Each rule defines: priority (100–4096, lower wins), source/destination (IP, CIDR, service tag, application security group), port, protocol, and allow/deny action.',
        'Service Tags represent Azure service IP ranges — use AzureLoadBalancer, AzureMonitor, Storage, Sql, VirtualNetwork instead of hardcoding IP ranges that change over time.',
        'NSGs can be attached to subnets (affects all NICs in the subnet) or directly to individual NICs. When both are attached, both are evaluated — the most restrictive combination applies.',
        'Default rules allow all inbound traffic within the VNet (VirtualNetwork tag), allow Azure Load Balancer health probes, and deny all other inbound from the internet. You cannot delete default rules.',
        'Application Security Groups (ASGs) let you group VMs by role (web-tier, db-tier) and reference those groups in NSG rules — readable rules without IP management.',
      ]
    },
    {
      heading: 'Routing & VNet Peering',
      points: [
        'Azure automatically creates system routes for VNet-to-VNet, internet, and Azure backbone traffic. User-Defined Routes (UDRs) in a route table override system routes — use to force traffic through an NVA (firewall) or Azure Firewall.',
        'VNet Peering connects two VNets with low-latency, high-bandwidth private connectivity over the Azure backbone. Peering is non-transitive — if VNet A is peered with B and B with C, A cannot reach C unless A and C are also peered.',
        'Global VNet Peering connects VNets across different Azure regions. Traffic stays on the Microsoft global backbone — no VPN or public internet involved.',
        'Azure Virtual WAN is a managed hub-and-spoke networking service for connecting many VNets, branch offices, and on-premises sites through a central hub — replaces manual hub-and-spoke topology with UDRs.',
        'VPN Gateway and ExpressRoute provide on-premises connectivity. VPN uses IPsec over the internet (lower cost). ExpressRoute is a dedicated private connection via a carrier (higher bandwidth, lower latency, higher cost).',
      ]
    },
    {
      heading: 'Private Endpoints & DNS',
      points: [
        'A Private Endpoint is a NIC inside your VNet with a private IP that maps to a specific PaaS resource (e.g. Storage account, Key Vault, SQL Database). Traffic never leaves the Azure backbone — the public endpoint can be disabled.',
        'When a private endpoint is created, Azure creates a private DNS zone (e.g. privatelink.blob.core.windows.net) and an A record mapping the storage account\'s hostname to the private IP. DNS must be configured to resolve to this zone.',
        'In hub-and-spoke architectures, private DNS zones are typically linked to the hub VNet where a central DNS forwarder resolves all private endpoint names for spoke VNets.',
        'Service Endpoints are simpler: they add the subnet\'s identity to a PaaS firewall rule, but traffic still routes through the Azure backbone (not through a NIC in your VNet). Private Endpoints give you a private IP inside the VNet — stronger isolation.',
        'Azure DNS Private Resolver (2022): a managed inbound/outbound DNS resolver that can conditionally forward queries to on-premises DNS or resolve private DNS zones from on-premises — no VM-based DNS forwarder required.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Create VNet & Subnets',
      language: 'bash',
      code: `# Create VNet with address space
az network vnet create \\
  --name my-vnet \\
  --resource-group my-rg \\
  --address-prefixes 10.0.0.0/16 \\
  --location eastus

# Add subnets
az network vnet subnet create \\
  --name web-subnet \\
  --vnet-name my-vnet \\
  --resource-group my-rg \\
  --address-prefixes 10.0.1.0/24

az network vnet subnet create \\
  --name db-subnet \\
  --vnet-name my-vnet \\
  --resource-group my-rg \\
  --address-prefixes 10.0.2.0/24

# Required subnet for Azure Bastion
az network vnet subnet create \\
  --name AzureBastionSubnet \\
  --vnet-name my-vnet \\
  --resource-group my-rg \\
  --address-prefixes 10.0.3.0/26`
    },
    {
      label: 'NSG Rules',
      language: 'bash',
      code: `# Create NSG and attach to subnet
az network nsg create --name web-nsg --resource-group my-rg

# Allow HTTP/HTTPS from internet
az network nsg rule create \\
  --nsg-name web-nsg \\
  --resource-group my-rg \\
  --name AllowHTTP \\
  --priority 100 \\
  --source-address-prefixes Internet \\
  --destination-port-ranges 80 443 \\
  --protocol Tcp --access Allow --direction Inbound

# Deny all other inbound (explicit — already default but visible)
az network nsg rule create \\
  --nsg-name web-nsg \\
  --resource-group my-rg \\
  --name DenyAllInbound \\
  --priority 4000 \\
  --source-address-prefixes '*' \\
  --destination-port-ranges '*' \\
  --protocol '*' --access Deny --direction Inbound

# Associate NSG with subnet
az network vnet subnet update \\
  --name web-subnet \\
  --vnet-name my-vnet \\
  --resource-group my-rg \\
  --network-security-group web-nsg

# Use service tags to allow Azure Monitor
az network nsg rule create \\
  --nsg-name web-nsg --resource-group my-rg \\
  --name AllowAzureMonitor --priority 200 \\
  --source-address-prefixes AzureMonitor \\
  --destination-port-ranges 443 \\
  --protocol Tcp --access Allow --direction Outbound`
    },
    {
      label: 'VNet Peering & Private Endpoint',
      language: 'bash',
      code: `# Peer two VNets (must peer in both directions)
az network vnet peering create \\
  --name vnet1-to-vnet2 \\
  --vnet-name my-vnet \\
  --resource-group my-rg \\
  --remote-vnet /subscriptions/<subId>/resourceGroups/rg2/providers/Microsoft.Network/virtualNetworks/vnet2 \\
  --allow-vnet-access

az network vnet peering create \\
  --name vnet2-to-vnet1 \\
  --vnet-name vnet2 \\
  --resource-group rg2 \\
  --remote-vnet /subscriptions/<subId>/resourceGroups/my-rg/providers/Microsoft.Network/virtualNetworks/my-vnet \\
  --allow-vnet-access

# Create Private Endpoint for a Storage Account
az network private-endpoint create \\
  --name storage-pe \\
  --resource-group my-rg \\
  --vnet-name my-vnet \\
  --subnet db-subnet \\
  --private-connection-resource-id /subscriptions/<subId>/resourceGroups/my-rg/providers/Microsoft.Storage/storageAccounts/mystorage \\
  --group-id blob \\
  --connection-name storage-conn

# Create private DNS zone and link to VNet
az network private-dns zone create \\
  --resource-group my-rg \\
  --name "privatelink.blob.core.windows.net"

az network private-dns link vnet create \\
  --resource-group my-rg \\
  --zone-name "privatelink.blob.core.windows.net" \\
  --name dns-link \\
  --virtual-network my-vnet \\
  --registration-enabled false`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using overlapping address spaces across peered VNets',
      wrong: `# VNet-A: 10.0.0.0/16, VNet-B: 10.0.0.0/16 — peering fails`,
      right: `# VNet-A: 10.0.0.0/16, VNet-B: 10.1.0.0/16 — non-overlapping`,
      explanation: 'VNet peering requires non-overlapping address spaces. Once VNets are deployed with overlapping CIDRs, you cannot peer them — you must redeploy. Plan your IP address spaces before deployment, accounting for all VNets that may ever be peered (including on-premises ranges via VPN/ExpressRoute).'
    },
    {
      title: 'Not creating a Private DNS Zone when adding a Private Endpoint',
      wrong: `# Private Endpoint created but no DNS zone — hostname still resolves to public IP`,
      right: `# Always create privatelink.<service>.windows.net DNS zone and link to VNet`,
      explanation: 'Without a private DNS zone, the PaaS service\'s hostname resolves to its public IP even from within the VNet. Create a privatelink DNS zone and configure an A record pointing to the private endpoint IP — only then does traffic go privately.'
    },
    {
      title: 'Assuming VNet peering is transitive',
      wrong: `# A↔B and B↔C peered: assuming A can reach C through B`,
      right: `# Must also peer A↔C directly for A to reach C`,
      explanation: 'VNet peering is non-transitive. Traffic does not flow through an intermediary VNet. If A is peered with B and B with C, A cannot reach C unless A and C are also explicitly peered (or you use Azure Virtual WAN / hub-and-spoke with NVA).'
    },
    {
      title: 'Using wildcard source addresses (*) in inbound NSG rules for management ports',
      wrong: `az network nsg rule create --source-address-prefixes '*' --destination-port-ranges 22`,
      right: `# Use Azure Bastion or JIT; restrict SSH to specific IP: --source-address-prefixes 203.0.113.5`,
      explanation: 'Allowing SSH/RDP from any source (0.0.0.0/0) exposes management ports to internet brute-force. Use Azure Bastion (browser SSH/RDP without public IP), JIT VM Access (30-minute windows), or restrict to known IP ranges.'
    },
  ];

  challenge: Challenge = {
    title: 'Calculate usable IPs in an Azure subnet',
    language: 'typescript',
    description: 'Azure reserves 5 IPs per subnet: x.x.x.0 (network), x.x.x.1 (gateway), x.x.x.2 (DNS), x.x.x.3 (DNS), x.x.x.255 (broadcast).\n\nWrite subnetInfo(cidr: string): { totalIPs: number; usableIPs: number; networkAddress: string; firstUsable: string } given a CIDR like "10.0.1.0/24" or "10.0.2.0/28".',
    hints: [
      'Total IPs = 2^(32 - prefix). Parse prefix from the part after "/"',
      'Usable = max(0, totalIPs - 5)',
      'Network address = the IP part of the CIDR as-is',
      'First usable = network address with last octet + 4',
    ],
    starterCode: `export function subnetInfo(cidr: string): {
  totalIPs: number; usableIPs: number;
  networkAddress: string; firstUsable: string;
} {
  const [ip, prefix] = cidr.split('/');
  // calculate based on prefix length
  return { totalIPs: 0, usableIPs: 0, networkAddress: ip, firstUsable: '' };
}`,
    solution: `export function subnetInfo(cidr: string): {
  totalIPs: number; usableIPs: number;
  networkAddress: string; firstUsable: string;
} {
  const [ip, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr);
  const totalIPs = Math.pow(2, 32 - prefix);
  const usableIPs = Math.max(0, totalIPs - 5);
  const octets = ip.split('.').map(Number);
  octets[3] += 4;
  const firstUsable = octets.join('.');
  return { totalIPs, usableIPs, networkAddress: ip, firstUsable };
}

console.log(subnetInfo('10.0.1.0/24'));
// { totalIPs: 256, usableIPs: 251, networkAddress: '10.0.1.0', firstUsable: '10.0.1.4' }
console.log(subnetInfo('10.0.2.0/28'));
// { totalIPs: 16, usableIPs: 11, networkAddress: '10.0.2.0', firstUsable: '10.0.2.4' }`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'How many IP addresses does Azure reserve in every subnet?',
      options: ['2 (network + broadcast)', '3', '5', '8'],
      answer: 2,
      explanation: 'Azure reserves 5 IPs per subnet: .0 (network address), .1 (default gateway), .2 and .3 (Azure DNS), and the last address (broadcast). A /28 subnet has 16 total IPs − 5 reserved = 11 usable IPs.'
    },
    {
      q: 'What is the key difference between a Service Endpoint and a Private Endpoint?',
      options: [
        'Service Endpoints are free; Private Endpoints cost extra',
        'Service Endpoints add subnet identity to a PaaS firewall; Private Endpoints give a private VNet IP to the PaaS service',
        'Private Endpoints only work with Storage accounts',
        'Service Endpoints require a DNS zone; Private Endpoints do not'
      ],
      answer: 1,
      explanation: 'Service Endpoints extend VNet subnet identity to a PaaS service firewall rule — traffic still routes through the Azure backbone but exits the VNet. Private Endpoints create a NIC with a private VNet IP — traffic never leaves the VNet and the PaaS public endpoint can be disabled entirely.'
    },
    {
      q: 'VNet A is peered with VNet B, and VNet B is peered with VNet C. Can VNet A reach VNet C?',
      options: [
        'Yes — traffic flows through VNet B automatically',
        'No — VNet peering is non-transitive; A and C must be peered directly',
        'Yes — but only on port 443',
        'Only if using Global VNet Peering'
      ],
      answer: 1,
      explanation: 'VNet peering is non-transitive. Traffic does not automatically flow A→B→C. For A to reach C, you must create a direct A↔C peering, or use Azure Virtual WAN, or route through a Network Virtual Appliance (NVA/firewall) in B with UDRs.'
    },
    {
      q: 'What does an NSG Service Tag like "AzureLoadBalancer" represent?',
      options: [
        'A specific load balancer IP address',
        'A named set of Azure service IP ranges that Azure manages and updates automatically',
        'A tag on the load balancer resource',
        'An alias for 0.0.0.0/0'
      ],
      answer: 1,
      explanation: 'Service Tags are named groups of IP prefixes for Azure services (AzureLoadBalancer, AzureMonitor, Storage, VirtualNetwork, etc.). Azure manages and updates these ranges automatically. Use them in NSG rules instead of hardcoding IP ranges that can change.'
    },
    {
      q: 'What must be created alongside a Private Endpoint for hostname resolution to work correctly?',
      options: [
        'A Public IP address',
        'A private DNS zone (e.g. privatelink.blob.core.windows.net) linked to the VNet',
        'A VPN Gateway',
        'An Application Gateway'
      ],
      answer: 1,
      explanation: 'Without a private DNS zone, the PaaS hostname resolves to its public IP even from within the VNet. Create a privatelink DNS zone, add an A record pointing to the private endpoint\'s private IP, and link the zone to the VNet — then the hostname resolves privately.'
    },
    {
      q: 'What is the key difference between Azure NSGs and Azure Firewall?',
      options: [
        'NSGs filter traffic at the VNet level; Azure Firewall works at the subnet level',
        'NSGs provide stateful L3/L4 filtering at NIC/subnet level; Azure Firewall is a managed L4/L7 service with FQDN filtering, threat intelligence, and centralised policy',
        'Azure Firewall replaces NSGs and both cannot be used together',
        'NSGs support FQDN-based rules; Azure Firewall only supports IP-based rules',
      ],
      answer: 1,
      explanation: 'NSGs are free, stateful L3/L4 rules on NICs or subnets. Azure Firewall is a managed service with L7 inspection, FQDN filtering, TLS inspection, threat intelligence integration, and centralised management used for hub-spoke or egress control.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between an NSG applied to a subnet vs one applied to a NIC?',
      a: 'An <strong>NSG on a subnet</strong> applies to all traffic entering/leaving any NIC in that subnet — one rule set protects all VMs. An <strong>NSG on a NIC</strong> applies only to that specific VM. When both are present, both are evaluated: inbound traffic passes through the subnet NSG first, then the NIC NSG. Outbound reverses: NIC NSG first, then subnet NSG. The most restrictive combination wins.'
    },
    {
      q: 'When would you use Azure Virtual WAN instead of manually peering VNets?',
      a: 'VNet peering is non-transitive — with many VNets you need O(n²) peerings. <strong>Azure Virtual WAN</strong> provides a managed hub-and-spoke topology where all VNets, branch offices (VPN), and ExpressRoute circuits connect to a central managed hub. The hub handles routing automatically without UDRs per peering. Use Virtual WAN when you have 5+ VNets, branch connectivity requirements, or need a global network managed from one place.'
    },
    {
      q: 'What is the AzureBastionSubnet and why must it be named exactly that?',
      a: 'Azure Bastion requires a dedicated subnet named exactly <strong>AzureBastionSubnet</strong> with a minimum /26 prefix. This is a hard requirement — the Bastion service checks for this exact subnet name at deployment. The subnet must have no NSG or a permissive NSG (Azure provides a recommended NSG rule set). Bastion then provides browser-based SSH/RDP to VMs in the same VNet without public IPs on those VMs.'
    },
    {
      q: 'How do you connect an Azure VNet to an on-premises network?',
      a: '<strong>VPN Gateway</strong>: site-to-site IPsec tunnel over the public internet. Up to ~1.25 Gbps aggregate, lower cost, suitable for moderate traffic. <strong>ExpressRoute</strong>: dedicated private circuit via a carrier partner to the Microsoft backbone. Up to 100 Gbps, lower latency, higher cost — required for compliance workloads that cannot traverse the public internet. Both require a dedicated GatewaySubnet (no other resources in that subnet).'
    },
    {
      q: 'What are User-Defined Routes (UDRs) and when do you need them?',
      a: 'UDRs override Azure\'s default system routes. Use them to: (1) <strong>force internet-bound traffic through Azure Firewall</strong> (next hop = firewall private IP), (2) <strong>route inter-VNet traffic through an NVA</strong> for deep-packet inspection, (3) <strong>prevent spoke-to-spoke traffic</strong> in a hub-and-spoke without going through the hub NVA. Apply UDRs to route tables and associate the route table with a subnet.'
    },
    {
      q: 'What is VNet peering and what are its key constraints?',
      a: 'VNet peering connects two VNets enabling private traffic routing via the Azure backbone. Key constraints: (1) address spaces must not overlap; (2) peering is non-transitive (A-B + B-C does not mean A-C can route without hub or VPN); (3) peering is regional or global (cross-region). Use hub-spoke topology with Azure Firewall or route tables for transitive routing.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure Virtual Networks provide isolated private networking — subnets with NSG firewalls, VNet peering for cross-VNet connectivity, Private Endpoints for PaaS isolation, and UDRs to control traffic routing.',
    mustKnow: [
      'Azure reserves 5 IPs per subnet: .0, .1, .2, .3, and last — plan subnet sizes accordingly',
      'NSG rules evaluated by priority (lower = higher priority); service tags for Azure service IP ranges',
      'VNet peering is non-transitive — A↔B and B↔C does not enable A↔C without explicit A↔C peering',
      'Private Endpoint = private VNet NIC for PaaS service + private DNS zone for hostname resolution',
      'Service Endpoint = subnet identity on PaaS firewall; simpler but traffic still exits VNet',
      'AzureBastionSubnet (/26 min): enables browser SSH/RDP to VMs without public IPs or open NSG ports',
    ],
    interviewFocus: [
      'Explain the difference between Service Endpoints and Private Endpoints',
      'Why is VNet peering non-transitive and how do you work around this at scale?',
      'What DNS configuration is required alongside a Private Endpoint?',
      'When would you use UDRs and what is the typical use case with Azure Firewall?',
    ],
  };
}
