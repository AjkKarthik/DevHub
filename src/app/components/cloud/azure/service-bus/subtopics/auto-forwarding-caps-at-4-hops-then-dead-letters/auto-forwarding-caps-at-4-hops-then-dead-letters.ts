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
  templateUrl: './auto-forwarding-caps-at-4-hops-then-dead-letters.html',
  styleUrl: './auto-forwarding-caps-at-4-hops-then-dead-letters.scss'
})
export class AutoForwardingCapsAt4HopsThenDeadLettersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes forwarding chains as a flexible routing tool with no mention of a length limit',
      points: [
        'The main page\'s own QnA on message forwarding chains describes three genuinely useful scenarios — message routing through an intermediate queue, DLQ consolidation, and fan-out without topics — all of which involve chaining a ForwardTo relationship from one entity to another. Nothing in the description suggests these chains have a maximum length.',
        'A reader following the main page\'s own "message routing" example (route through an intermediate queue for transformation before reaching the final consumer) might reasonably extend the pattern to multiple transformation stages, assuming forwarding chains can be as long as the architecture needs.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own auto-forwarding reference: chains are capped at four hops, and exceeding it dead-letters the message',
      points: [
        'Per Microsoft\'s own documentation: "Don\'t create a chain that exceeds four hops. Messages that exceed four hops are dead-lettered. The hop count of a message is incremented when a message is autoforwarded from one queue or topic to another queue or topic." A fifth hop doesn\'t fail loudly or get rejected at configuration time — the message reaches the limit at runtime and is silently routed to a dead-letter queue instead of its intended final destination.',
        'The hop count isn\'t reset per forwarding relationship — it travels WITH the message across the entire chain, and per Microsoft\'s own docs, "the hop count of a message can also be incremented in the send via scenario in which a message is sent via a transfer queue" — meaning a transactional send-via pattern combined with forwarding can consume hops faster than a design that only counts explicit ForwardTo relationships would suggest.',
        'This directly complicates the main page\'s own "scale out an individual topic" scenario, where a first-level topic forwards to multiple second-level topics for subscription scaling — if any of those second-level topics ALSO forward messages onward (for the DLQ-consolidation or routing patterns the main page separately describes), the combined chain can approach the four-hop ceiling faster than either use case considered in isolation would suggest.',
      ]
    },
    {
      heading: 'Other real forwarding constraints the main page\'s coverage doesn\'t mention',
      points: [
        'Sessions and auto-forwarding cannot coexist on the SOURCE side: "A session-enabled queue or subscription can\'t be the source of autoforwarding... A forwarded message that has no session ID is dead-lettered on the source entity, because a session-enabled entity only accepts messages that have a session ID." A forwarding chain feeding INTO a session-enabled destination works fine — the constraint is specifically about using a session-enabled entity as the thing forwarding messages onward.',
        'A full destination doesn\'t drop forwarded messages — it backs them up at the source instead: "If the destination entity accumulates too many messages and exceeds the quota, or the destination entity is disabled, the source entity adds the messages to its dead-letter queue until there\'s space in the destination." This means a slow or paused downstream consumer in a forwarding chain can quietly fill the SOURCE entity\'s own DLQ, not the destination\'s — worth knowing when the main page\'s own advice to "monitor the DLQ" is applied to a forwarding topology.',
        'Ordering isn\'t automatically preserved across the whole chain: "the destination could be a topic that doesn\'t support ordering. If either the source or destination entity is a partitioned entity, order isn\'t guaranteed" — a forwarding chain built to preserve message sequence needs every hop checked for this, not just the first one.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A forwarding chain that quietly hits the 4-hop limit',
      language: 'bash',
      code: `# Chain: intake-queue -> transform-queue -> enrich-queue ->
#        route-queue -> final-queue
# This is FIVE hops -- one too many.

az servicebus queue create --namespace-name my-sb-ns --resource-group my-rg --name intake-queue
az servicebus queue create --namespace-name my-sb-ns --resource-group my-rg --name transform-queue
az servicebus queue create --namespace-name my-sb-ns --resource-group my-rg --name enrich-queue
az servicebus queue create --namespace-name my-sb-ns --resource-group my-rg --name route-queue
az servicebus queue create --namespace-name my-sb-ns --resource-group my-rg --name final-queue

# Set each hop's ForwardTo (conceptually -- actual property set via
# SDK/ARM, shown here as the logical chain):
# intake-queue.ForwardTo = transform-queue      # hop 1
# transform-queue.ForwardTo = enrich-queue      # hop 2
# enrich-queue.ForwardTo = route-queue          # hop 3
# route-queue.ForwardTo = final-queue           # hop 4
# final-queue.ForwardTo = archive-queue         # hop 5 -- EXCEEDS LIMIT

# Per Microsoft's own docs: "Don't create a chain that exceeds four
# hops. Messages that exceed four hops are dead-lettered." Messages
# reaching hop 5 land in a dead-letter queue along the chain, NOT
# at archive-queue -- with no configuration-time error to flag it.`,
    },
    {
      label: 'Watching the right DLQ when a downstream hop backs up',
      language: 'bash',
      code: `# If a downstream entity in a forwarding chain is disabled or
# full, per Microsoft's own docs: "the source entity adds the
# messages to its dead-letter queue until there's space in the
# destination." Monitor the SOURCE queue's DLQ, not just the final
# destination's, when diagnosing a stalled forwarding chain:

az monitor metrics list \\
  --resource /subscriptions/<subId>/resourceGroups/my-rg/providers/Microsoft.ServiceBus/namespaces/my-sb-ns \\
  --metric "DeadletteredMessages" \\
  --dimension EntityName \\
  --output table
# Check EVERY entity in the chain's own DLQ depth, not just the
# final destination -- a backup can surface at any hop, and it
# surfaces at the SOURCE of that specific hop, not downstream.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team designs a message pipeline using auto-forwarding: an intake queue forwards to a transformation queue, which forwards to an enrichment queue, which forwards to a routing queue, which forwards to one of several final destination queues based on message content. That\'s four ForwardTo relationships in the chain. They plan to add a fifth stage for final archival logging. Should they be concerned, and what would actually happen if they add it?',
    hint: 'Check the exact maximum hop count Microsoft documents for Service Bus auto-forwarding chains, and what specifically happens to a message that exceeds it.',
    solution: 'Yes, they should be concerned — the existing four-stage chain (intake → transform → enrich → route → final) already uses all four permitted hops. Per Microsoft\'s own documentation, "don\'t create a chain that exceeds four hops. Messages that exceed four hops are dead-lettered." Adding a fifth ForwardTo relationship for archival logging would mean any message that traverses the full chain reaches the hop limit at that fifth forward — it would be dead-lettered instead of reaching the archival stage, with no explicit error raised when the chain was configured. The team would need to either drop one of the existing four hops to make room, or have the final stage handle archival logging directly rather than forwarding to a separate queue for it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Azure Service Bus auto-forwarding chains can be as long as an architecture needs — routing a message through many intermediate queues or topics for successive transformation stages.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states plainly: "Don\'t create a chain that exceeds four hops. Messages that exceed four hops are dead-lettered" — a hard, enforced ceiling on chain length.'
    },
    {
      thought: 'If a forwarding chain exceeds the hop limit, Service Bus rejects the configuration at setup time with a clear error, preventing the chain from ever being created.',
      reality: 'Per this subtopic\'s theory, the limit is enforced per-message at runtime, not at configuration time — a chain exceeding four hops can be set up without any setup-time error, and messages traversing it are silently dead-lettered once they hit the fifth hop.'
    },
    {
      thought: 'When a downstream entity in a forwarding chain becomes full or disabled, the messages that can\'t be delivered accumulate in that downstream entity\'s own dead-letter queue.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the opposite: "the source entity adds the messages to its dead-letter queue until there\'s space in the destination" — the backup surfaces at the SOURCE of that specific hop, not at the blocked destination.'
    }
  ];
}
