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
  selector: 'app-azure-virtual-machines',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './virtual-machines.html',
  styleUrl: './virtual-machines.scss'
})
export class AzureVirtualMachines {

  quickRef: QuickRefItem[] = [
    { name: 'VM Size', type: 'type', desc: 'Determines vCPU, RAM, disk throughput, and network bandwidth. Choose by workload: B-series (burstable), D-series (general), E-series (memory), N-series (GPU).' },
    { name: 'Managed Disk', type: 'type', desc: 'Azure-managed storage for VM OS and data disks. Types: Standard HDD, Standard SSD, Premium SSD, Ultra Disk.' },
    { name: 'Availability Set', type: 'type', desc: 'Logical group of VMs spread across fault domains (different racks) and update domains to prevent simultaneous downtime.' },
    { name: 'Availability Zone', type: 'type', desc: 'Physically separate datacenter within a region. Spreading VMs across 3 AZs provides the highest HA (99.99% SLA).' },
    { name: 'VMSS', type: 'type', desc: 'VM Scale Set — automatically scales identical VM instances in or out based on metrics or schedules.' },
    { name: 'Custom Script Extension', type: 'type', desc: 'Downloads and runs a script on a VM post-provision — used for software installation and config management.' },
    { name: 'Spot VM', type: 'type', desc: 'Unused Azure capacity at up to 90% discount; can be evicted with 30-second notice when Azure needs the capacity back.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'VM Sizes & Families',
      points: [
        'Azure VM sizes follow a naming convention: [Family][Sub-family][#vCPUs][Additive features]_[Accelerated networking]v[Version]. For example, Standard_D4s_v5 = D-series (general purpose), 4 vCPUs, premium storage (s), version 5.',
        'B-series (Burstable): Accumulate CPU credits when idle, spend them on CPU-intensive bursts. Ideal for dev/test servers, low-traffic web apps, and small databases that rarely need sustained CPU. Cheapest per vCPU.',
        'D-series (General purpose): Balanced CPU/RAM ratio (1:4). Best for most production workloads — web servers, app servers, small-to-medium databases. Dv5/Dsv5 are the latest generation.',
        'E-series (Memory-optimised): High RAM per vCPU (1:8). Ideal for in-memory databases (SAP HANA, Redis), large SQL Server workloads, and analytics that need large result sets in RAM.',
        'N-series (GPU): NVIDIA GPUs for ML training (NCv3/NCasT4), inference (NVsv3), and HPC. GPU VMs are expensive — use only when the workload genuinely needs GPU acceleration.',
        'F-series (Compute-optimised): High vCPU/RAM ratio (1:2). Best for batch processing, game servers, and web front-ends with low memory requirements. Cheaper per vCPU than D-series.',
      ]
    },
    {
      heading: 'Managed Disks & Storage',
      points: [
        'Standard HDD (S): Magnetic disks — lowest cost, high latency. Use for backups, infrequently accessed data, and dev/test environments where IOPS do not matter.',
        'Standard SSD (E): Consistent lower latency than HDD. Use for web servers, lightly used enterprise apps, and dev/test workloads needing predictable performance at moderate cost.',
        'Premium SSD (P): NVMe-backed, high IOPS and low latency (<1ms). Required for production SQL Server, Oracle, and any I/O-sensitive workload. The VM size must support premium storage (s suffix: Ds, Es, Fs).',
        'Ultra Disk: Configurable IOPS and throughput independent of disk size — up to 160,000 IOPS and 2 GB/s throughput. For SAP HANA, top-tier databases, and latency-sensitive trading systems.',
        'Disk caching: ReadOnly caching (default for data disks) improves read performance. ReadWrite caching (used for OS disk) writes through cache. Set cache to None for write-heavy workloads to avoid dirty cache flushing.',
      ]
    },
    {
      heading: 'High Availability: Sets, Zones & VMSS',
      points: [
        'Availability Sets spread VMs across fault domains (separate racks with independent power/network) and update domains (VMs rebooted one domain at a time during maintenance). Guarantees 99.95% SLA with 2+ VMs.',
        'Availability Zones spread VMs across physically separate datacenters within a region. Zone-redundant deployments guarantee 99.99% SLA — the highest single-region VM SLA Azure offers.',
        'VM Scale Sets (VMSS) manage a fleet of identical VMs. Configure min/max/default capacity, and attach autoscale rules based on CPU %, memory, or custom metrics via Azure Monitor.',
        'VMSS supports multiple scaling modes: manual, automatic (metric-based), and scheduled. The Flexible orchestration mode supports heterogeneous VMs and mixes with Availability Zones.',
        'For zero-downtime updates, VMSS rolling upgrade policy updates instances in batches — a configurable percentage at a time — so some instances always remain available during the update.',
      ]
    },
    {
      heading: 'Extensions, Spot VMs & Bastion',
      points: [
        'The Custom Script Extension (CSE) runs a shell or PowerShell script on a VM after provisioning — install packages, configure services, or join a domain. The script is fetched from a storage blob or public URL.',
        'Azure VM extensions are small agents installed inside the VM that integrate with Azure services: Azure Monitor Agent (metrics/logs), Azure Disk Encryption (BitLocker/dm-crypt), Microsoft Antimalware, and more.',
        'Spot VMs use Azure\'s unused capacity at discounts up to 90%. Azure can evict a Spot VM with a 30-second notice (configurable eviction policy: deallocate or delete). Use for fault-tolerant batch jobs, dev/test, and rendering.',
        'Azure Bastion is a managed jump host — connect to VMs via SSH or RDP directly in the browser portal without exposing the VM\'s public IP or opening port 22/3389 to the internet. Eliminates the need for a VPN or public IP on the VM.',
        'JIT VM Access (via Microsoft Defender for Cloud) opens NSG port 22/3389 for a specific source IP and time window (e.g. 3 hours) upon request, then automatically closes it. Better than keeping ports open permanently.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Create & Manage VM',
      language: 'bash',
      code: `# Create a VM (Standard_D2s_v5, Ubuntu 22.04)
az vm create \\
  --resource-group my-rg \\
  --name my-vm \\
  --image Ubuntu2204 \\
  --size Standard_D2s_v5 \\
  --admin-username azureuser \\
  --generate-ssh-keys \\
  --zone 1

# Open port 80
az vm open-port --resource-group my-rg --name my-vm --port 80

# Stop (deallocate) — stops billing for compute
az vm deallocate --resource-group my-rg --name my-vm

# Start
az vm start --resource-group my-rg --name my-vm

# List VM sizes in a region
az vm list-sizes --location eastus --output table

# Resize an existing VM
az vm resize --resource-group my-rg --name my-vm --size Standard_D4s_v5`
    },
    {
      label: 'Managed Disks',
      language: 'bash',
      code: `# Add a Premium SSD data disk (512 GB)
az vm disk attach \\
  --resource-group my-rg \\
  --vm-name my-vm \\
  --name my-data-disk \\
  --new \\
  --size-gb 512 \\
  --sku Premium_LRS \\
  --caching ReadOnly

# List disks attached to a VM
az disk list --resource-group my-rg --output table

# Snapshot a disk (for backup)
az snapshot create \\
  --resource-group my-rg \\
  --name my-disk-snapshot \\
  --source my-data-disk

# Create disk from snapshot (restore)
az disk create \\
  --resource-group my-rg \\
  --name my-restored-disk \\
  --source my-disk-snapshot \\
  --sku Premium_LRS`
    },
    {
      label: 'VMSS Autoscale',
      language: 'bash',
      code: `# Create a VM Scale Set
az vmss create \\
  --resource-group my-rg \\
  --name my-vmss \\
  --image Ubuntu2204 \\
  --vm-sku Standard_D2s_v5 \\
  --instance-count 2 \\
  --zones 1 2 3

# Add autoscale: scale out when CPU > 70%, scale in when < 30%
az monitor autoscale create \\
  --resource-group my-rg \\
  --resource my-vmss \\
  --resource-type Microsoft.Compute/virtualMachineScaleSets \\
  --name my-autoscale \\
  --min-count 2 --max-count 10 --count 2

az monitor autoscale rule create \\
  --resource-group my-rg \\
  --autoscale-name my-autoscale \\
  --scale out 1 \\
  --condition "Percentage CPU > 70 avg 5m"

az monitor autoscale rule create \\
  --resource-group my-rg \\
  --autoscale-name my-autoscale \\
  --scale in 1 \\
  --condition "Percentage CPU < 30 avg 5m"

# Run Custom Script Extension on existing VM
az vm extension set \\
  --resource-group my-rg \\
  --vm-name my-vm \\
  --name CustomScriptExtension \\
  --publisher Microsoft.Azure.Extensions \\
  --settings '{"fileUris":["https://mystorage.blob.core.windows.net/scripts/setup.sh"],"commandToExecute":"./setup.sh"}'`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Stopping a VM with the OS shutdown command instead of az vm deallocate',
      wrong: `ssh azureuser@vm-ip "sudo shutdown now"  # VM still billed!`,
      right: `az vm deallocate --resource-group my-rg --name my-vm`,
      explanation: 'An OS-level shutdown puts the VM in Stopped state but Azure still bills for compute because the capacity is reserved. Only az vm deallocate (or portal Stop) releases the compute — then billing stops.'
    },
    {
      title: 'Using Standard SSD for production SQL Server instead of Premium SSD',
      wrong: `--sku Standard_SSD_LRS  # 500 IOPS max, high latency`,
      right: `--sku Premium_LRS  # 7,500 IOPS on P30, <1ms latency`,
      explanation: 'Standard SSD has a cap of ~500 IOPS per disk and higher latency. Production databases need Premium SSD (or Ultra Disk for extreme workloads). Also ensure the VM size has the "s" suffix (e.g. D4s_v5) to support premium storage.'
    },
    {
      title: 'Leaving SSH/RDP ports open to 0.0.0.0/0 in the NSG',
      wrong: `az network nsg rule create --destination-port-ranges 22 --source-address-prefixes '*'`,
      right: `# Use Azure Bastion, or JIT access, or restrict to your IP`,
      explanation: 'Exposing port 22 or 3389 to the internet invites brute-force attacks. Use Azure Bastion (browser-based SSH/RDP without public IP), JIT VM Access, or at minimum restrict the source IP to your known range.'
    },
    {
      title: 'Deploying VMs in a single Availability Set assuming it gives zone-level HA',
      wrong: `az vm availability-set create --name my-avset  # only protects from rack failures`,
      right: `az vm create --zone 1  # and another VM with --zone 2 for true zone HA`,
      explanation: 'Availability Sets protect against rack/hardware failures within one datacenter — SLA 99.95%. For protection against datacenter failure use Availability Zones across 3 datacenters — SLA 99.99%.'
    },
  ];

  challenge: Challenge = {
    title: 'Calculate VM Cost Estimate',
    language: 'typescript',
    description: 'Write a function estimateMonthlyCost(hours: number, pricePerHour: number, diskGb: number, diskPricePerGb: number): { compute: number; disk: number; total: number } that estimates the monthly cost of a VM.\n\nAssume: 730 hours/month. Round all results to 2 decimal places.',
    hints: [
      'Compute cost = hours * pricePerHour (but cap at 730 hours/month)',
      'Disk cost = diskGb * diskPricePerGb (monthly flat rate, not per hour)',
      'Use Math.round(x * 100) / 100 to round to 2 decimal places',
    ],
    starterCode: `export function estimateMonthlyCost(
  hours: number,
  pricePerHour: number,
  diskGb: number,
  diskPricePerGb: number
): { compute: number; disk: number; total: number } {
  // hours capped at 730 (full month)
  return { compute: 0, disk: 0, total: 0 };
}`,
    solution: `export function estimateMonthlyCost(
  hours: number,
  pricePerHour: number,
  diskGb: number,
  diskPricePerGb: number
): { compute: number; disk: number; total: number } {
  const round = (n: number) => Math.round(n * 100) / 100;
  const compute = round(Math.min(hours, 730) * pricePerHour);
  const disk = round(diskGb * diskPricePerGb);
  return { compute, disk, total: round(compute + disk) };
}

// Test
console.log(estimateMonthlyCost(730, 0.096, 128, 0.0513));
// { compute: 70.08, disk: 6.57, total: 76.65 }
console.log(estimateMonthlyCost(100, 0.096, 64, 0.0513));
// { compute: 9.6, disk: 3.28, total: 12.88 }`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which Azure VM size series is best for a memory-intensive SAP HANA workload?',
      options: ['B-series (Burstable)', 'D-series (General purpose)', 'E-series (Memory optimised)', 'F-series (Compute optimised)'],
      answer: 2,
      explanation: 'E-series VMs have a high RAM-to-vCPU ratio (1:8) making them ideal for in-memory databases like SAP HANA, large SQL Server, and analytics workloads that need lots of RAM. B-series is for bursty low-CPU, D-series is balanced, F-series is compute-heavy.'
    },
    {
      q: 'What is the Azure VM SLA when two VMs are deployed across two Availability Zones?',
      options: ['99.5%', '99.9%', '99.95%', '99.99%'],
      answer: 3,
      explanation: 'Availability Zones (across separate datacenters) guarantee 99.99% SLA for VMs. Availability Sets (within one datacenter, across racks) give 99.95%. A single VM has 99.9% if it uses Premium SSD.'
    },
    {
      q: 'What is the correct way to stop billing for an Azure VM\'s compute cost?',
      options: ['SSH into the VM and run sudo shutdown', 'Set the VM to Stopped state in the portal', 'Run az vm deallocate', 'Delete the OS disk'],
      answer: 2,
      explanation: 'az vm deallocate (or Stop in the portal — which deallocates) releases the compute capacity. A simple OS shutdown leaves the VM in Stopped (not deallocated) state and Azure continues billing for the reserved compute resources.'
    },
    {
      q: 'Which managed disk type is required for production SQL Server with consistent <1ms latency?',
      options: ['Standard HDD (S)', 'Standard SSD (E)', 'Premium SSD (P)', 'Any disk works for SQL Server'],
      answer: 2,
      explanation: 'Premium SSD delivers NVMe-backed storage with <1ms latency and high IOPS (up to 20,000 IOPS on P50). The VM must also have the "s" suffix (e.g. Standard_D4s_v5) to support premium storage. Standard SSD/HDD have too much latency for production OLTP databases.'
    },
    {
      q: 'What is Azure Bastion and why is it used?',
      options: [
        'A load balancer for VMs',
        'A managed jump host enabling SSH/RDP in the browser without exposing the VM\'s public IP',
        'An antivirus extension for VMs',
        'A disk snapshot service'
      ],
      answer: 1,
      explanation: 'Azure Bastion is a PaaS jump host deployed in your VNet. It enables SSH and RDP connections via the Azure portal using TLS — no public IP on the VM, no port 22/3389 in the NSG. This eliminates the attack surface of internet-facing management ports.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Availability Sets and Availability Zones?',
      a: '<strong>Availability Sets</strong> spread VMs across <em>fault domains</em> (separate racks/power within one datacenter) and <em>update domains</em> (batched maintenance reboots). SLA: 99.95% with 2+ VMs. <strong>Availability Zones</strong> spread VMs across physically separate datacenters within the same region. SLA: 99.99%. Use AZs for production; use Availability Sets only in regions without AZ support.'
    },
    {
      q: 'What happens when an Azure Spot VM is evicted?',
      a: 'Azure gives 30 seconds notice via the Azure Scheduled Events API and then either <strong>deallocates</strong> (default) or <strong>deletes</strong> the VM depending on the eviction policy you set. The OS and data disks survive deallocation (you pay for disk storage). Spot VMs are suitable for fault-tolerant batch jobs, rendering, and ML training — not for stateful or customer-facing workloads that cannot tolerate interruption.'
    },
    {
      q: 'How do you install software on a VM automatically at provisioning time without SSH?',
      a: 'Use the <strong>Custom Script Extension</strong>: reference a script URL (storage blob or public URL) in the VM resource\'s extensions section. Azure downloads and executes the script inside the VM after provisioning completes. For config management at scale, use <code>cloud-init</code> (Linux), <code>cloud-config</code>, or integrate with Azure Automation DSC / Ansible / Chef via extensions.'
    },
    {
      q: 'When should you use VMSS instead of individual VMs?',
      a: 'Use <strong>VMSS</strong> whenever you need: (1) horizontal auto-scaling based on load (CPU, memory, HTTP queue depth), (2) identical stateless instances behind a load balancer, or (3) rolling updates to many VMs at once. For unique, stateful VMs (domain controllers, primary databases) or small fixed fleets you manage individually, plain VMs are simpler.'
    },
    {
      q: 'What managed disk type should you use for dev/test vs production?',
      a: '<strong>Dev/test</strong>: Standard HDD or Standard SSD — sufficient performance at lower cost. <strong>Production web/app servers</strong>: Standard SSD (E) or Premium SSD (P) depending on I/O requirements. <strong>Production databases and high-IOPS workloads</strong>: Premium SSD (P) minimum. <strong>Mission-critical, ultra-low-latency</strong>: Ultra Disk (configurable IOPS/throughput, no caching support). The VM size must support premium storage (s suffix) to use Premium SSD or Ultra.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure VMs offer a wide range of compute families (B/D/E/F/N), managed disk tiers (Standard/Premium/Ultra), HA via Availability Zones or Sets, and elastic scaling via VMSS — with Bastion for secure management access.',
    mustKnow: [
      'B-series = burstable (credits), D-series = balanced, E-series = memory, F-series = compute, N-series = GPU',
      'Premium SSD requires VM size with "s" suffix (e.g. D4s_v5); Ultra Disk is configurable IOPS/throughput',
      'Availability Zones → 99.99% SLA; Availability Sets → 99.95% SLA; single VM → 99.9% (Premium SSD)',
      'az vm deallocate = stops compute billing; OS shutdown = Stopped (still billed for compute)',
      'VMSS: autoscale fleet of identical VMs by metric or schedule, rolling upgrade policy for zero-downtime',
      'Azure Bastion: browser SSH/RDP without public IP or open NSG ports — eliminates internet attack surface',
    ],
    interviewFocus: [
      'Explain the difference between Availability Sets and Availability Zones and when to use each',
      'Why does az vm deallocate stop billing but OS shutdown does not?',
      'What disk type would you choose for a production SQL Server and why?',
      'How does VMSS autoscaling work and what orchestration modes exist?',
    ],
  };
}
