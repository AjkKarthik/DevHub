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
  templateUrl: './queue-and-service-bus-triggers-default-to-16-concurrent-not-one.html',
  styleUrl: './queue-and-service-bus-triggers-default-to-16-concurrent-not-one.scss'
})
export class QueueAndServiceBusTriggersDefaultTo16ConcurrentNotOneSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory claimed queue and Service Bus functions process one message at a time — this was a genuine inaccuracy, now corrected on the main page itself',
      points: [
        'Before this subtopic was written, the main page\'s own "Cold Starts, Scaling & KEDA" theory stated: "Queue/Service Bus functions default to one message at a time per instance." Checking this claim against Microsoft\'s own documentation for this subtopic revealed it was incorrect — the main page has since been corrected to reflect the real default.',
        'This matters directly for capacity planning and debugging: a team assuming "one message at a time" would badly underestimate how much concurrent load a single function instance can generate against a downstream database or API, and would be confused seeing multiple overlapping executions in their logs when they expected strictly serial processing.',
      ]
    },
    {
      heading: 'Both trigger types actually process many messages concurrently per instance by default — 16 as the base number, in both cases',
      points: [
        'Per Microsoft\'s own Storage Queue trigger documentation: "By default, the batch size is 16. When the number being processed gets down to 8, the runtime gets another batch and starts processing those messages. So the maximum number of concurrent messages being processed per function on one virtual machine (VM) is 24." A single instance can have up to 24 messages in flight simultaneously by default — nowhere close to "one at a time."',
        'Per Microsoft\'s own Service Bus host.json reference: "maxConcurrentCalls | 16 | ...This setting limits the maximum number of concurrent calls to the callback that can be initiated per-scaled-instance. When your hosting plan has more than one core per instance, the maximum number of calls is effectively multiplied by the number of cores. For example, in a plan that runs on hardware with two cores, the default setting of 16 means that the maximum number of concurrent calls per instance is really 32 (or 2 * 16)." Service Bus concurrency can be even higher than Storage Queue\'s, depending on the plan\'s core count.',
        'Both defaults are configurable, and the main page\'s original "one at a time" framing IS achievable — just not by default: setting the Storage Queue trigger\'s batchSize to 1 in host.json, or Service Bus\'s maxConcurrentCalls to 1, genuinely serializes processing per instance. This is a real, sometimes-necessary configuration (e.g. for strict ordering requirements) — but it is an opt-in change from the default, not the out-of-the-box behavior.',
        'Storage Queue and Service Bus concurrency are configured completely differently — batchSize/newBatchThreshold for Storage Queue vs. maxConcurrentCalls/maxConcurrentSessions for Service Bus — and Service Bus additionally splits its behavior by whether sessions are enabled (maxConcurrentCalls applies only when isSessionsEnabled is false; maxConcurrentSessions, defaulting to 8, applies when it\'s true).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Observing the real default concurrency',
      language: 'bash',
      code: `# Enqueue 50 messages to a Storage Queue-triggered function with
# NO host.json overrides -- default batchSize applies
for i in $(seq 1 50); do
  az storage message put --queue-name orders --content "order-$i"
done

# Function logs show UP TO 24 concurrent executions on a single
# instance (16 initial batch, refilled once it drops to 8) -- not
# a strictly serial "1, then 2, then 3" pattern. Per Microsoft's own
# docs: "the maximum number of concurrent messages being processed
# per function on one virtual machine (VM) is 24."

# Service Bus behaves similarly -- 16 concurrent calls by default,
# multiplied by core count:
# "in a plan that runs on hardware with two cores, the default
# setting of 16 means that the maximum number of concurrent calls
# per instance is really 32 (or 2 * 16)"`,
    },
    {
      label: 'Opting into true one-at-a-time processing',
      language: 'bash',
      code: `# host.json -- force Storage Queue to genuinely serialize
{
  "version": "2.0",
  "extensions": {
    "queues": {
      "batchSize": 1,
      "newBatchThreshold": 0
    }
  }
}

# host.json -- force Service Bus to genuinely serialize
{
  "version": "2.0",
  "extensions": {
    "serviceBus": {
      "maxConcurrentCalls": 1
    }
  }
}

# Per Microsoft's own docs on the queue setting: "If you want to
# minimize parallel execution for queue-triggered functions in a
# function app, you can set the batch size to 1. This setting
# eliminates concurrency only so long as your function app runs on
# a single virtual machine (VM)" -- note the caveat: on Consumption
# or Premium, scaling out to MULTIPLE VMs still means concurrent
# processing ACROSS instances, even with batchSize=1 on each one.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team notices their queue-triggered function is making far more simultaneous calls to a downstream rate-limited API than they expected, causing 429 errors. They had assumed (based on common advice they\'d read) that queue functions process one message at a time per instance. Using this subtopic\'s theory, explain what they actually need to check and configure.',
    hint: 'Per Microsoft\'s own documentation, what is the actual default batch size for a Storage Queue trigger, and is a single Azure Function instance the same thing as "one message being processed at a time"?',
    solution: 'Per this subtopic\'s theory, the team\'s assumption was based on a common but inaccurate belief. Microsoft\'s own documentation confirms the Storage Queue trigger defaults to a batch size of 16 with up to 24 concurrent messages per instance, and Service Bus defaults maxConcurrentCalls to 16 (multiplied by core count). If the function also scales out to multiple instances, the TOTAL concurrent load against the downstream API is the per-instance concurrency multiplied by the instance count — easily reaching dozens or hundreds of simultaneous calls, explaining the 429 errors. The fix is to explicitly configure the relevant host.json setting down to a safe value — batchSize (Storage Queue) or maxConcurrentCalls (Service Bus) — rather than relying on an assumed "one at a time" default that was never actually true. For genuinely strict single-instance serialization, the team should also be aware that reducing per-instance concurrency to 1 does not prevent concurrent processing ACROSS multiple scaled-out instances — a rate limit on the downstream API side, or a semaphore/queue-based throttle, may still be needed if the function app can scale beyond one VM.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Azure Functions queue and Service Bus triggers process exactly one message at a time per instance by default — this is the standard, documented behavior.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms the actual defaults are far higher: Storage Queue defaults to a batch size of 16 (up to 24 concurrent), and Service Bus defaults maxConcurrentCalls to 16, multiplied by the instance\'s core count.'
    },
    {
      thought: 'Setting batchSize or maxConcurrentCalls to 1 guarantees a queue/topic is processed in strict order with no concurrent processing anywhere.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation notes this setting "eliminates concurrency only so long as your function app runs on a single virtual machine (VM)" — if the function app scales out to multiple instances, each instance still processes its own message serially, but multiple instances can still run concurrently with each other.'
    },
    {
      thought: 'Storage Queue and Service Bus triggers are configured identically for concurrency, just with different setting names.',
      reality: 'Per this subtopic\'s theory, Service Bus has a genuinely more layered model — maxConcurrentCalls applies only when sessions are disabled, while a separate maxConcurrentSessions setting (defaulting to 8) applies when sessions are enabled — a distinction Storage Queue\'s simpler batchSize/newBatchThreshold model doesn\'t have at all.'
    }
  ];
}
