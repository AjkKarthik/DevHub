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
  templateUrl: './scheduled-events-five-event-types.html',
  styleUrl: './scheduled-events-five-event-types.scss'
})
export class ScheduledEventsFiveEventTypesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s only mention of the Scheduled Events API is scoped entirely to Spot eviction',
      points: [
        'The main page\'s own QnA states: "What happens when an Azure Spot VM is evicted? Azure gives 30 seconds notice via the Azure Scheduled Events API and then either deallocates (default) or deletes the VM." This is the ONLY place the Scheduled Events API is named at all — framed purely as a Spot-eviction mechanism.',
        'Nothing on the main page hints that the exact same API also covers regular (non-Spot) VMs, or that it reports several DIFFERENT kinds of upcoming disruption, each with its own notice period.',
      ]
    },
    {
      heading: 'Scheduled Events actually reports five distinct event types, and only one of them is Spot-specific',
      points: [
        'Per Microsoft\'s own documentation, the full set is: "EventType: Freeze | Reboot | Redeploy | Preempt | Terminate" — with Preempt being the ONLY type tied to Spot eviction ("The Spot Virtual Machine is being deleted... This event is made available on a best effort basis"). The other four cover regular platform and user-initiated maintenance that any VM — Spot or not — can receive: Freeze ("scheduled to pause for a few seconds... no impact on memory or open files"), Reboot ("scheduled for reboot, non-persistent memory is lost"), Redeploy ("scheduled to move to another node, ephemeral disks are lost"), and Terminate ("scheduled to be deleted").',
        'Each event type carries a documented MINIMUM notice period, and they are not all the same: "Freeze: 15 minutes. Reboot: 15 minutes. Redeploy: 10 minutes. Preempt: 30 seconds. Terminate: User Configurable, 5 to 15 minutes." The main page\'s own "30 seconds" figure is accurate only for Preempt — an application built to expect just 30 seconds of warning for every disruption type is actually LEAVING minutes of available lead time unused for Freeze, Reboot, and Redeploy events.',
        'The API also surfaces events for user-initiated actions on ordinary VMs, not just platform maintenance: "If you restart a VM, an event with the type Reboot is scheduled. If you redeploy a VM, an event with the type Redeploy is scheduled." Even a routine "az vm restart" run by a teammate generates a Scheduled Event that a properly-integrated application could observe and prepare for — something the main page\'s Spot-only framing gives no hint of.',
        'Approval also works identically across all five types: an event can be proactively approved via a POST call to shorten its lead time, but per Microsoft\'s own documentation, "the event may not start immediately upon approval. In some cases Azure requires the approval of all the VMs hosted on the node before proceeding" — a detail that applies equally whether the event is a Spot Preempt or an ordinary platform Reboot.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Polling Scheduled Events on a REGULAR (non-Spot) VM',
      language: 'bash',
      code: `# Query the IMDS Scheduled Events endpoint from inside any VM --
# Spot or regular -- the endpoint and format are identical
curl -H Metadata:true \\
  "http://169.254.169.254/metadata/scheduledevents?api-version=2020-07-01"

# Example response on an ordinary (non-Spot) production VM ahead of
# routine host maintenance:
# {
#   "DocumentIncarnation": 2,
#   "Events": [{
#     "EventId": "c7061bac-afdc-4513-b24b-aa5f13a16123",
#     "EventType": "Freeze",
#     "ResourceType": "VirtualMachine",
#     "Resources": ["my-vm"],
#     "EventStatus": "Scheduled",
#     "NotBefore": "Mon, 11 Apr 2026 22:26:58 GMT",
#     "Description": "Virtual machine is being paused because of a memory-preserving Live Migration operation.",
#     "EventSource": "Platform",
#     "DurationInSeconds": 5
#   }]
# }
# -- Freeze gets a documented MINIMUM of 15 minutes notice, not the
# 30-second figure the main page's own QnA cites (that number is
# specific to Preempt/Spot eviction only).`,
    },
    {
      label: 'Differentiated handling by event type and source',
      language: 'bash',
      code: `# A monitoring script that treats every event the same way, per the
# main page's own "30 seconds" framing, wastes the extra lead time
# most event types actually provide. Per Microsoft's own docs, the
# five types and their minimum notice are:
#   Freeze     -> 15 minutes
#   Reboot     -> 15 minutes
#   Redeploy   -> 10 minutes
#   Preempt    -> 30 seconds   (Spot eviction only)
#   Terminate  -> 5-15 minutes (user configurable)

# User-initiated events (EventSource: "User") should generally be
# approved immediately to avoid delaying an admin's own action:
curl -H Metadata:true -X POST \\
  -d '{"StartRequests": [{"EventId": "f020ba2e-3bc0-4c40-a10b-86575a9eabd5"}]}' \\
  "http://169.254.169.254/metadata/scheduledevents?api-version=2020-07-01"
# Per Microsoft's own docs: "Typically events with a user event
# source can be immediately approved to avoid a delay on
# user-initiated actions" -- e.g. a teammate running az vm restart
# generates exactly this kind of event.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own QnA, a team builds their Scheduled Events integration around a single assumption: "we get 30 seconds of warning before any disruption, so our graceful-shutdown logic just needs to run fast." They deploy this on their REGULAR (non-Spot) production fleet. Using this subtopic\'s theory, what is wrong with this assumption, and what is the team actually leaving on the table?',
    hint: 'Per Microsoft\'s own documentation, is 30 seconds the minimum notice period for every Scheduled Event type, or only for one specific type that doesn\'t even apply to a non-Spot fleet?',
    solution: 'Per this subtopic\'s theory, the team\'s assumption is based on the wrong number for their situation. Microsoft\'s own documentation confirms 30 seconds is the minimum notice specifically for the Preempt event type, which only applies to Spot VM eviction — the team\'s fleet is regular (non-Spot), so Preempt events will never occur on it at all. The event types that CAN actually occur on their fleet — Freeze, Reboot, Redeploy, and Terminate — carry documented minimum notice periods of 10 to 15 minutes (Terminate is configurable 5-15 minutes). By designing graceful-shutdown logic around a 30-second budget, the team is needlessly rushing work that could actually take advantage of 10-15 minutes of genuine lead time — for example, more thorough connection draining, a full state checkpoint, or a coordinated failover to a secondary VM, rather than a hurried best-effort shutdown. The fix is recognizing which event types are actually relevant to a non-Spot fleet and designing the response logic around THEIR documented notice periods, not reusing the Spot-specific 30-second figure by default.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The Scheduled Events API is a Spot-VM-specific feature — a regular, non-Spot VM has no reason to poll it.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms Scheduled Events covers "all Azure Virtual Machines types" — only one of its five event types (Preempt) is Spot-specific; Freeze, Reboot, Redeploy, and Terminate apply to regular VMs from both platform maintenance and user-initiated actions.'
    },
    {
      thought: 'Every Scheduled Event gives the same amount of advance warning, since the main page cites "30 seconds" as the notice period.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation lists five different minimum notice periods per event type — 30 seconds applies only to Preempt (Spot eviction); Freeze and Reboot get 15 minutes, Redeploy gets 10 minutes, and Terminate is configurable between 5 and 15 minutes.'
    },
    {
      thought: 'Scheduled Events only fire for platform-initiated maintenance — a teammate manually restarting a VM through the portal or CLI would not generate one.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states directly that user-initiated actions also generate events: "If you restart a VM, an event with the type Reboot is scheduled. If you redeploy a VM, an event with the type Redeploy is scheduled" — with EventSource marked "User" rather than "Platform."'
    }
  ];
}
