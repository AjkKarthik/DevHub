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
  templateUrl: './regional-ri-size-flexibility-uses-a-normalization-factor.html',
  styleUrl: './regional-ri-size-flexibility-uses-a-normalization-factor.scss'
})
export class RegionalRiSizeFlexibilityUsesANormalizationFactorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes Reserved Instances as locked to "a specific instance type" — but that\'s only true for HALF of them',
      points: [
        'The main page\'s own quickRef states: "Reserved Instances: Standard (72% off) or Convertible (66% off); 1 or 3-year term; applies to specific instance type" — a single, flat description with no mention that RIs come in two genuinely different scopes.',
        'The main page\'s own mistake entry #1 uses exactly this framing to justify recommending Savings Plans over RIs: "RI coverage dropped — paying for idle reservations" after a fleet migrated instance types, implying RIs are rigidly tied to one instance type with no flexibility at all — which understates what a REGIONAL RI can actually do.',
      ]
    },
    {
      heading: 'Regional RIs automatically apply across every size in an instance family via a documented normalization factor — Zonal RIs do not',
      points: [
        'Per AWS\'s own documentation: "A Reserved Instance that is purchased for a Region is called a regional Reserved Instance, and provides Availability Zone and instance size flexibility... The Reserved Instance discount applies to instance usage within the instance family, regardless of size—this is known as instance size flexibility." This directly contradicts the main page\'s implied "locked to one instance type" framing — it is only true for ZONAL RIs, which reserve capacity for one specific size in one specific AZ.',
        'AWS is explicit about the scope limitation: "Instance size flexibility is only supported for Regional Reserved Instances" — and it does NOT apply to RIs purchased for a specific Availability Zone, RIs on several GPU/HPC instance families, RIs for several Windows/RHEL/SUSE OS variants, or RIs with dedicated tenancy.',
        'The mechanism itself is a documented normalization table, scaling from nano (factor 0.25) up through 112xlarge (factor 896) — small = 1, medium = 2, large = 4, xlarge = 8, 2xlarge = 16, and so on. AWS\'s own worked example: "a t2.medium instance has a normalization factor of 2. If you purchase a t2.medium... Reserved Instance... and you have two running t2.small instances... the billing benefit is applied in full to both instances" — because two t2.small instances (factor 1 each) sum to exactly the t2.medium RI\'s own factor of 2, an exact match with no waste.',
        'When the normalized units do NOT divide evenly, AWS applies the discount "from the smallest to the largest instance size within the instance family based on the normalization factor," splitting PARTIALLY across usage — AWS\'s own example: a c4.large RI (factor 4) applied against a running c4.xlarge (factor 8) covers exactly 50% of that instance\'s usage, with the remaining 50% billed at the On-Demand rate.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Zonal RI — locked to one exact size, no flexibility',
      language: 'bash',
      code: `# Purchase a ZONAL RI (specific AZ) — matches the main page's own
# "applies to specific instance type" framing exactly, because this
# is the ONE RI purchase type where that framing is fully accurate
aws ec2 purchase-reserved-instances-offering \\
  --reserved-instances-offering-id offering-zonal-c4xlarge-1a \\
  --instance-count 2
# Per AWS's own docs: "The attributes (tenancy, platform,
# Availability Zone, instance type, and instance size) of the
# running instances must match that of the Reserved Instances."
# If the team later migrates from c4.xlarge to c4.2xlarge, or to a
# different AZ, this RI's discount stops applying entirely — no
# partial credit, no size flexibility at all.`,
    },
    {
      label: 'Regional RI — one purchase automatically covers a range of sizes',
      language: 'bash',
      code: `# Purchase a REGIONAL RI (no specific AZ) at m4.large
aws ec2 purchase-reserved-instances-offering \\
  --reserved-instances-offering-id offering-regional-m4large \\
  --instance-count 4

# Per AWS's own worked example (Scenario 1, apply_ri docs):
# 4x m4.large regional RIs = 16 normalized units/hr (4 x 4)
# Account has 2x m4.xlarge running = 16 normalized units/hr (2 x 8)
# -> full billing benefit applies to BOTH m4.xlarge instances,
#    with zero additional purchase or exchange needed -- the m4.large
#    RI's discount simply follows the account's m4.xlarge usage.

# Contrast: a c4.large regional RI (4 units) applied against a
# running c4.xlarge (8 units) covers only 50% of that instance's
# usage -- the remaining 50% is billed at the On-Demand rate, per
# AWS's own docs: "the c4.large Reserved Instance billing discount
# applies to 50% of c4.xlarge usage."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team purchased 4 regional m4.large Standard RIs (default tenancy, Amazon Linux) in us-east-1. They currently run 2x m4.xlarge instances and no m4.large instances at all. A teammate says "those RIs are wasted since we don\'t run any m4.large instances." Using this subtopic\'s theory, are they right?',
    hint: 'Per AWS\'s own documentation and normalization-factor table, does a regional RI\'s discount require running instances of the EXACT size purchased?',
    solution: 'Per this subtopic\'s theory, the teammate is wrong — the RIs are not wasted. AWS\'s own documentation confirms regional RIs provide "instance size flexibility," applying "within the instance family, regardless of size." Using the normalization factor table, m4.large = 4 normalized units/hour, so 4 purchased RIs total 16 normalized units/hour. An m4.xlarge = 8 normalized units/hour, so the 2 running m4.xlarge instances also total 16 normalized units/hour — an exact match. Per AWS\'s own worked example using this identical scenario, "the four m4.large regional Reserved Instances provide the full billing benefit to the usage of the two m4.xlarge instances" — the discount is applied automatically, with no exchange, modification, or new purchase required, precisely because the RIs are regional (not zonal) and within the same instance family.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'All Reserved Instances are locked to the exact instance type and size purchased — migrating to a different size means the RI discount is lost.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation confirms this is only true for ZONAL Reserved Instances. Regional RIs automatically apply across every size within the same instance family via a documented normalization factor, with no exchange needed.'
    },
    {
      thought: 'Instance size flexibility means a regional RI\'s discount is either fully applied or not applied at all to a given running instance.',
      reality: 'Per this subtopic\'s theory, AWS\'s own worked example shows PARTIAL benefit is possible — a c4.large regional RI (4 normalized units) applied to a running c4.xlarge (8 normalized units) covers exactly 50% of that instance\'s usage, with the rest billed at the On-Demand rate.'
    },
    {
      thought: 'Instance size flexibility applies to every Reserved Instance purchase as long as it is regional, regardless of instance family or OS.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation lists real exclusions even for regional RIs — several GPU/HPC instance families, several Windows/RHEL/SUSE Linux OS variants, and any RI with dedicated tenancy do not get instance size flexibility at all.'
    }
  ];
}
