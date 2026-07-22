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
  templateUrl: './service-bus-max-delivery-count-defaults-to-10-not-5.html',
  styleUrl: './service-bus-max-delivery-count-defaults-to-10-not-5.scss'
})
export class ServiceBusMaxDeliveryCountDefaultsTo10Not5Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry gives Storage Queue\'s exact default but only gestures at Service Bus\'s equivalent',
      points: [
        'The main page\'s own mistake entry #4 states: "Azure Queue Storage automatically moves a message to a poison queue after maxDequeueCount failed attempts (default 5). Service Bus uses dead-letter queues." The Storage Queue number is precise; the Service Bus sentence never gives ITS OWN default number, or explains that it is a genuinely different value.',
        'This gap matters because a team reasoning by analogy ("Service Bus probably also defaults to 5 retries, since it\'s the same general pattern") would be off by a real, meaningful margin — and the main page never corrects that assumption.',
      ]
    },
    {
      heading: 'Service Bus\'s MaxDeliveryCount defaults to 10 (double Storage Queue\'s 5), and dead-lettering has more distinct trigger reasons and a genuinely separate "transfer" variant',
      points: [
        'Per Microsoft\'s own Service Bus documentation: "There\'s a limit on the number of attempts to deliver messages for Service Bus queues and subscriptions. The default value is 10. Whenever a message is delivered under a peek-lock, but is either explicitly abandoned or the lock has expired, the delivery count on the message is incremented. When the delivery count exceeds the limit, the message is moved to the DLQ." A Service Bus message survives twice as many failed attempts by default as a Storage Queue message before being set aside.',
        'Storage Queue has essentially one dead-lettering trigger (exceeding maxDequeueCount), but Service Bus documents several DISTINCT reasons a message can be dead-lettered, each with its own reason code: "HeaderSizeExceeded... TTLExpiredException... Session ID is null... MaxTransferHopCountExceeded... MaxDeliveryCountExceeded." A message expiring (TTL) is dead-lettered for a completely different, independently-diagnosable reason than one that simply failed processing too many times — inspecting the DeadLetterReason property (not just "it\'s in the DLQ") is necessary to know which situation actually occurred.',
        'Service Bus also has an entirely separate sub-queue the main page never mentions: "When a message can\'t be forwarded to its destination in auto forward or send via scenarios, the message is placed in the transfer dead-letter queue (TDLQ) of the SOURCE entity that did the forwarding, not on the destination entity." A team monitoring only the regular DLQ of a chained/auto-forwarding topology could miss failures that are actually landing in a completely different sub-queue on a different entity.',
        'The MaxDeliveryCountExceeded behavior is deliberately non-optional but tunable: "This behavior can\'t be disabled, but you can set the max delivery count to a large number" — unlike some retry mechanisms that can be turned off entirely, Service Bus always eventually dead-letters a message that keeps failing; the only lever is how many attempts it gets first.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking and setting MaxDeliveryCount explicitly',
      language: 'bash',
      code: `# Check the current default (10 unless previously overridden)
az servicebus queue show \\
  --resource-group my-rg --namespace-name my-sb-ns --name orders \\
  --query maxDeliveryCount

# Raise it for a queue where transient downstream failures are
# common and more retries genuinely help before giving up
az servicebus queue update \\
  --resource-group my-rg --namespace-name my-sb-ns --name orders \\
  --max-delivery-count 20

# Per Microsoft's own docs, this can never be disabled entirely --
# "This behavior can't be disabled, but you can set the max
# delivery count to a large number" -- there is always SOME ceiling,
# even if set very high.`,
    },
    {
      label: 'Inspecting WHY a message was dead-lettered, and checking the transfer DLQ',
      language: 'bash',
      code: `# In function code (C#), inspect the specific dead-letter reason --
# don't assume every DLQ message failed for the same cause:
# ServiceBusReceiver dlqReceiver = client.CreateReceiver(queueName,
#   new ServiceBusReceiverOptions { SubQueue = SubQueue.DeadLetter });
# var msg = await dlqReceiver.ReceiveMessageAsync();
# string reason = msg.DeadLetterReason;
# // "MaxDeliveryCountExceeded" -- processing kept failing
# // "TTLExpiredException"      -- message simply expired, unrelated
# //                               to any processing failure at all

# Check the SEPARATE transfer dead-letter queue on a topology using
# auto-forwarding -- failures here don't show up in the normal DLQ:
az servicebus queue show \\
  --resource-group my-rg --namespace-name my-sb-ns --name orders \\
  --query countDetails.transferDeadLetterMessageCount
# Per Microsoft's own docs: "the message is placed in the transfer
# dead-letter queue (TDLQ) of the SOURCE entity that did the
# forwarding, not on the destination entity" -- monitor the SOURCE
# queue's TDLQ, not just the destination's own regular DLQ.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team migrates a Storage Queue-based function to Service Bus, keeping their existing alerting threshold of "investigate after 5 failed attempts" copied over from the Storage Queue setup. Using this subtopic\'s theory, what mismatch does this create, and what else should they check before assuming their dead-letter monitoring is complete?',
    hint: 'Per Microsoft\'s own documentation, does Service Bus dead-letter a message at the same delivery-attempt count as Storage Queue by default — and are there dead-letter causes that have nothing to do with delivery attempts at all?',
    solution: 'Per this subtopic\'s theory, the mismatch is real: Microsoft\'s own documentation confirms Service Bus\'s default MaxDeliveryCount is 10, double Storage Queue\'s default of 5 — so an alert threshold tuned for "5 attempts" will fire well before Service Bus has actually given up on the message, or won\'t align with when the message is genuinely dead-lettered. Beyond just adjusting the number, the team should also check the DeadLetterReason on any message they do find in the DLQ, since Service Bus dead-letters for several genuinely distinct reasons — MaxDeliveryCountExceeded (their original concern), but also TTLExpiredException (a message simply expired, unrelated to processing failures), HeaderSizeExceeded, and others — treating every DLQ arrival as "failed processing 5 times" would misdiagnose a TTL-expired message as a processing bug. Finally, if their topology uses auto-forwarding between queues/topics, they should also monitor the separate transfer dead-letter queue on the SOURCE entity, since forwarding failures land there instead of the destination\'s regular DLQ and would otherwise go completely unmonitored.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Service Bus and Storage Queue both dead-letter/poison a message after the same number of failed attempts by default, since they follow the same general retry-then-set-aside pattern.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms genuinely different defaults — Storage Queue moves a message to its poison queue after 5 failed dequeue attempts, while Service Bus\'s default MaxDeliveryCount is 10.'
    },
    {
      thought: 'Every message that ends up in a Service Bus dead-letter queue got there because it failed processing repeatedly.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation lists several distinct dead-letter reasons unrelated to processing failures — including TTLExpiredException (the message simply expired) and HeaderSizeExceeded — checking the DeadLetterReason property is necessary to know the actual cause.'
    },
    {
      thought: 'Monitoring a Service Bus queue\'s regular dead-letter queue is sufficient to catch every kind of message delivery failure in the system.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation describes a separate transfer dead-letter queue (TDLQ) that holds messages that failed during auto-forwarding between entities — these land on the SOURCE entity\'s own TDLQ, not the destination\'s regular DLQ, and need to be monitored independently.'
    }
  ];
}
