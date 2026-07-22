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
  templateUrl: './zonal-vs-zone-redundant-and-per-subscription-zone-mapping.html',
  styleUrl: './zonal-vs-zone-redundant-and-per-subscription-zone-mapping.scss'
})
export class ZonalVsZoneRedundantAndPerSubscriptionZoneMappingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page says "services spread across 3 AZs tolerate a single datacenter failure" — but never says who does the spreading, or whether "Zone 2" means the same datacenter for every account',
      points: [
        'The main page\'s own theory states: "Availability Zones (AZs) are physically separate buildings within a region... Services spread across 3 AZs tolerate a single datacenter failure" and "Zone-redundant services automatically replicate across all AZs in a region." This reads as if every service either automatically spans zones or simply doesn\'t — with no middle option, and no mention of who is responsible for the spreading.',
        'Nothing on the main page distinguishes a service that AUTOMATICALLY replicates across zones from one where YOU choose a single specific zone to deploy into — both get lumped into "spread across 3 AZs" language.',
      ]
    },
    {
      heading: 'Azure actually defines three distinct deployment types, and "Zone 2" can point at a different physical datacenter for every subscription',
      points: [
        'Per Microsoft\'s own documentation, "Zone-redundant resources are replicated or distributed across multiple availability zones by the service... With zone-redundant deployments, Microsoft manages spreading requests across zones and the replication of data across zones. If an outage occurs in an availability zone, Microsoft manages failover to another zone automatically." This is the ONLY deployment type where Microsoft — not you — is the one spreading and failing over.',
        '"Zonal resources" are a genuinely different, second option: "A zonal resource is deployed to a single availability zone that you select yourself... Zonal deployments don\'t automatically provide resiliency to availability zone outages... To make zonal resources resilient to availability zone outages, you need to design an architecture with separate resources in multiple availability zones within the region. Microsoft doesn\'t manage the process for you." A zonal VM pinned to Zone 1 gets NO automatic protection if Zone 1 goes down — the main page\'s "spread across 3 AZs" framing only describes the outcome you get if you deliberately deploy separate zonal resources into all three zones yourself.',
        'A THIRD category exists that the main page never mentions at all: "If a resource isn\'t configured to use availability zones... it\'s called a nonzonal or regional deployment. Azure might place nonzonal resources across any zones in the region. You don\'t choose which resources go into which zones. If any availability zone in the region experiences an outage, nonzonal resources might be in the affected zone and could experience downtime." A nonzonal resource has no zone guarantee in either direction — not pinned, not replicated, just placed somewhere by Azure.',
        'The genuinely surprising detail: zone NUMBERS are not physically consistent across subscriptions. Per Microsoft\'s own documentation: "Each datacenter is assigned to a physical zone. Physical zones are mapped to logical zones in your Azure subscription, and different subscriptions might have a different mapping order... For example, subscription A may have physical zone 1 mapped to logical zone 2, while subscription B has physical zone 1 mapped to logical zone 3." Two teams in two different subscriptions who both deploy zonal resources to "Zone 1" in the same region are very likely landing in two DIFFERENT physical datacenters, not the same one.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Zonal deployment — you pick the zone, no automatic failover',
      language: 'bash',
      code: `# A "zonal" VM: pinned to exactly one Availability Zone, chosen by
# the team, in East US
az vm create --resource-group prod-rg --name web-01 \\
  --image Ubuntu2204 --zone 1

# Per Microsoft's own docs: "Zonal deployments don't automatically
# provide resiliency to availability zone outages... Microsoft
# doesn't manage the process for you." If Zone 1 in East US has an
# outage, web-01 goes down -- there is no automatic failover to
# Zone 2 or Zone 3, because nothing else was deployed there.

# To actually get the "spread across 3 AZs" resilience the main
# page's theory describes, the team must deploy SEPARATE zonal VMs
# into every zone themselves:
az vm create --resource-group prod-rg --name web-02 --image Ubuntu2204 --zone 2
az vm create --resource-group prod-rg --name web-03 --image Ubuntu2204 --zone 3
# -- plus a load balancer distributing traffic across all three --
# this is manually-built zone resiliency, not automatic.`,
    },
    {
      label: 'Zone-redundant vs. nonzonal — who does the replication',
      language: 'bash',
      code: `# Zone-redundant storage: Microsoft handles replication and
# failover across zones automatically -- no --zone parameter needed
az storage account create --resource-group prod-rg \\
  --name proddata --sku Standard_ZRS
# Per Microsoft's own docs: "Microsoft manages spreading requests
# across zones and the replication of data across zones. If an
# outage occurs in an availability zone, Microsoft manages failover
# to another zone automatically." No architecture work required.

# A resource deployed with NEITHER a --zone parameter NOR a
# zone-redundant SKU is "nonzonal" -- Azure places it in some zone
# of its own choosing, with zero guarantee either way:
az storage account create --resource-group prod-rg \\
  --name devdata --sku Standard_LRS
# Per Microsoft's own docs: "Azure might place nonzonal resources
# across any zones in the region. You don't choose which resources
# go into which zones. If any availability zone... experiences an
# outage, nonzonal resources might be in the affected zone."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Two teams, Team A and Team B, work in two different Azure subscriptions in the same organization. Both deploy a "zonal" VM to Zone 1 in East US, reasoning "we\'re both in Zone 1, so if Zone 1 goes down, both our VMs go down together — at least the blast radius is predictable." Using this subtopic\'s theory, is their reasoning sound?',
    hint: 'Per Microsoft\'s own documentation, is the mapping from a logical zone number (like "Zone 1") to a specific physical datacenter the same across every Azure subscription?',
    solution: 'Per this subtopic\'s theory, the teams\' reasoning is likely wrong. Microsoft\'s own documentation states directly: "Physical zones are mapped to logical zones in your Azure subscription, and different subscriptions might have a different mapping order... subscription A may have physical zone 1 mapped to logical zone 2, while subscription B has physical zone 1 mapped to logical zone 3." Because Team A and Team B are in different subscriptions, their respective "Zone 1" almost certainly maps to two DIFFERENT physical datacenters, not the same one. This means an outage affecting Team A\'s physical Zone 1 datacenter has no reason to also affect Team B\'s VM — the two teams do not actually share a blast radius just because they both selected the same logical zone number. Anyone needing to reason about shared physical fault domains across subscriptions (e.g. for compliance or shared-infrastructure planning) needs to query the actual logical-to-physical mapping for each subscription individually, not assume matching zone numbers mean matching datacenters.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Deploying a resource "into an Availability Zone" always means the same thing — the resource automatically gets protection if that zone fails.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation defines two very different outcomes: a ZONAL resource pinned to one zone gets no automatic failover at all, while a ZONE-REDUNDANT resource is automatically replicated and failed over by Microsoft — picking the wrong one silently removes the resilience a team assumes they have.'
    },
    {
      thought: 'A resource that isn\'t explicitly configured for Availability Zones is unaffected by zone outages, since it was never "put into" a zone at all.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation describes this as a "nonzonal" or "regional" deployment — Azure still places the resource in SOME zone of its own choosing, and "if any availability zone in the region experiences an outage, nonzonal resources might be in the affected zone and could experience downtime."'
    },
    {
      thought: '"Zone 1" refers to the same physical datacenter for every Azure subscription in a given region.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms the logical-to-physical zone mapping is assigned per subscription and can differ between subscriptions — two subscriptions\' "Zone 1" can point at two entirely different physical datacenters.'
    }
  ];
}
