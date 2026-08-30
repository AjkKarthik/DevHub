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
  templateUrl: './spot-vm-eviction-notice-is-30-seconds-not-2-minutes.html',
  styleUrl: './spot-vm-eviction-notice-is-30-seconds-not-2-minutes.scss'
})
export class SpotVmEvictionNoticeIs30SecondsNot2MinutesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine inaccuracy on the main page, likely borrowed from a different cloud\'s convention',
      points: [
        'The main page\'s own QnA originally stated: "Azure can evict Spot VMs with only a 2-minute eviction notice when it needs the capacity back." Two minutes is a specific, well-known figure — but it\'s the notice window AWS Spot Instances use, not Azure\'s.',
        'Confirmed via Microsoft\'s own Spot VM documentation: "At any point in time when Azure needs the capacity back, the Azure infrastructure will evict Azure Spot Virtual Machines with 30-seconds notice." A quarter of the time the main page implied — a materially different design constraint for anything trying to gracefully shut down or checkpoint before eviction.',
      ]
    },
    {
      heading: 'How that 30 seconds is actually delivered, and what "eviction" means depends on a setting the main page never mentions',
      points: [
        'The notice isn\'t guaranteed background information pushed automatically — it requires opting in: "You can opt in to receive in-VM notifications through Azure Scheduled Events. These are delivered on a best effort basis up to 30 seconds prior to the eviction." Without wiring up Scheduled Events inside the VM, there\'s no in-VM signal at all before eviction happens.',
        'What actually happens to the VM at eviction depends on the Eviction Policy set at creation time — Deallocate (default) or Delete. "The Deallocate policy moves your VM to the stopped-deallocated state, allowing you to redeploy it later... you\'ll be charged storage costs for the underlying disks." Versus Delete: "the evicted VMs are deleted together with their underlying disks, so you\'ll not continue to be charged for the storage." Choosing wrong for a workload\'s needs either leaves disks silently billing after eviction, or discards state a redeploy could have reused.',
        'Eviction isn\'t only about capacity — a Max Price setting controls a second, independent eviction trigger: "Spot VMs can be stopped if Azure needs capacity for other pay-as-you-go workloads or when the price of the spot instance exceeds the maximum price that you have set." Leaving max price at its effective default (equivalent to "never evict for price, only for capacity") is a real, deliberate choice most teams should make explicitly, not stumble into.',
      ]
    },
    {
      heading: 'What this means for designing an interruption-tolerant Spot workload',
      points: [
        '30 seconds is enough time for a well-designed batch job to checkpoint progress or drain an in-flight request, but it is NOT enough time for anything resembling a graceful multi-step shutdown sequence — workloads genuinely need to be designed around "near-immediate loss of the VM," not "a couple minutes to wrap up."',
        'Setting max price to -1 (per Microsoft\'s own docs: "The VM won\'t be evicted for pricing reasons. The max price will be the current price, up to the price for standard VMs. You\'ll never be charged above the standard price") removes price-based eviction as a variable entirely — leaving capacity-based eviction (the 30-second-notice kind) as the only thing to design around, which simplifies reasoning about interruption handling.',
        'Because eviction rates are published per SKU/region ("an eviction rate of 10% means a VM has a 10% chance of being evicted within the next hour, based on historical eviction data of the last 7 days"), checking this data before committing a workload to a specific Spot SKU/region combination is worth doing — some combinations are dramatically more stable than others.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setting up the actual 30-second warning path',
      language: 'bash',
      code: `# Create a Spot VM with an explicit max price and Deallocate policy
az vm create \\
  --name my-spot-vm --resource-group my-rg \\
  --image Ubuntu2204 \\
  --priority Spot \\
  --max-price 0.05 \\
  --eviction-policy Deallocate \\
  --size Standard_D2s_v3

# Inside the VM, poll the Scheduled Events endpoint to actually
# RECEIVE the 30-second warning -- it is opt-in, not automatic:
curl -H Metadata:true --noproxy "*" \\
  "http://169.254.169.254/metadata/scheduledevents?api-version=2020-07-01"

# A "Preempt" event type in the response indicates Spot eviction is
# imminent -- NotBefore field gives the actual deadline, typically
# ~30 seconds out. A polling loop (every few seconds) checking this
# endpoint is the standard pattern for graceful shutdown handling.`,
    },
    {
      label: 'Checking eviction rate history before committing to a SKU/region',
      language: 'bash',
      code: `# Query historical eviction rates for a specific SKU + region
# combination BEFORE committing a workload to it:
az graph query -q "
  SpotResources
  | where type =~ 'microsoft.compute/skuspotevictionrate/location'
  | where sku.name in~ ('standard_d2s_v4', 'standard_d4s_v4')
  | where location in~ ('eastus', 'southcentralus')
  | project skuName = tostring(sku.name), location,
      spotEvictionRate = tostring(properties.evictionRate)
  | order by skuName asc, location asc
"
# Eviction rates vary meaningfully by SKU and region -- some
# combinations are far more stable than others, worth checking
# before designing a workload around a specific choice.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team is designing a batch processing job for Spot VMs, planning a graceful shutdown sequence that flushes an in-memory buffer to disk, closes several open connections, and sends a completion webhook — a sequence they estimate takes about 90 seconds, based on the main page\'s original "2-minute eviction notice" figure giving them what they assumed was comfortable headroom. Does this design hold up, and what should change?',
    hint: 'Check the actual, current eviction notice window Microsoft documents for Azure Spot VMs, and whether that notice is delivered automatically or requires the application to opt in.',
    solution: 'This design does not hold up. Microsoft\'s own documentation states Azure Spot VMs are evicted "with 30-seconds notice" — not the 2 minutes the plan was built around — so a 90-second shutdown sequence would very likely be interrupted mid-sequence by the actual eviction. Additionally, that 30-second notice is not automatic: it requires the application to poll the in-VM Azure Scheduled Events endpoint to receive it at all. The redesign needs both a much shorter shutdown sequence (prioritizing the single most important action — likely just flushing the in-memory buffer — over the full three-step sequence) and explicit Scheduled Events polling wired into the application, since without it there\'s no warning signal to react to in the first place.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Azure Spot VMs give roughly 2 minutes of eviction notice before the VM is actually taken away, similar to how some other cloud providers\' spot/preemptible instances work.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states Azure Spot VMs are evicted "with 30-seconds notice" — a quarter of the 2-minute figure, and a materially different design constraint.'
    },
    {
      thought: 'The eviction warning for a Spot VM is delivered automatically to the running application, with no setup required.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the warning is delivered via Azure Scheduled Events, which the application must actively poll to receive — it is opt-in, not a signal pushed automatically with zero configuration.'
    },
    {
      thought: 'A Spot VM\'s eviction policy (Deallocate vs Delete) only affects whether the VM can be restarted later — it has no bearing on ongoing cost after eviction.',
      reality: 'Per this subtopic\'s theory, the policy directly affects billing after eviction: Deallocate keeps the underlying disks (and their storage cost) intact for a possible redeploy, while Delete removes the VM and its disks together, stopping storage charges — a real cost tradeoff depending on whether the workload benefits from being redeployable.'
    }
  ];
}
