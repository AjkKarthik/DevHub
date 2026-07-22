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
  templateUrl: './reserved-concurrency-zero-skips-async-retries-entirely.html',
  styleUrl: './reserved-concurrency-zero-skips-async-retries-entirely.scss'
})
export class ReservedConcurrencyZeroSkipsAsyncRetriesEntirelySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "set to 0 to throttle completely" line never says what actually happens to async invocations hitting that wall',
      points: [
        'The main page\'s own theory bullet states: "Reserved concurrency: hard cap for a function — prevents it starving others; set to 0 to throttle completely." This reads as a simple on/off switch, without distinguishing what "throttled" actually means for a synchronous caller versus an asynchronous trigger like the S3/SNS/EventBridge sources the main page\'s own "Triggers" section lists.',
        'Elsewhere, the main page\'s own theory states async failures get "queues internally, retries 2x on failure, then DLQ" — a reader combining these two bullets would reasonably assume a reserved-concurrency-zero throttle follows that same "retries, then DLQ" path. It does not.',
      ]
    },
    {
      heading: 'Reserved concurrency = 0 for an async-triggered function is a documented BYPASS of the normal retry path — straight to DLQ/destination, immediately',
      points: [
        'Per AWS\'s own documentation: "To prevent a function from triggering, you can set the function\'s reserved concurrency to zero. When you set reserved concurrency to zero for an asynchronously invoked function, Lambda begins sending new events to the configured dead-letter queue or the on-failure event destination, without any retries."',
        'This is a genuinely different failure path from the main page\'s own "retries 2x, then DLQ" framing — reserved concurrency = 0 skips the 2 built-in retries entirely. There is no waiting, no backoff, no attempt at all; every new event sent while concurrency is 0 goes straight to whatever failure-handling target is configured.',
        'AWS\'s own documentation states the practical consequence directly: "To process events that were sent while reserved concurrency was set to zero, you must consume the events from the dead-letter queue or the on-failure event destination." Nothing is automatically replayed once reserved concurrency is restored to a normal value — the events that arrived during the zero-concurrency window are gone from the function\'s own invocation pipeline for good unless someone manually reprocesses them from the DLQ or destination.',
        'This makes reserved-concurrency-zero a genuinely different operational tool than it might appear from the main page\'s own framing: it is not a "pause" button that resumes normal processing once lifted — it is a permanent diversion of every event received during that window, with manual reprocessing as the only way to recover them.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the zero-concurrency bypass on an async trigger',
      language: 'bash',
      code: `# Matching the main page's own "asynchronous triggers" list --
# an SNS-triggered function, with a DLQ already configured per the
# main page's own code tab:
aws lambda update-function-configuration \\
  --function-name order-notifier \\
  --dead-letter-config "TargetArn=arn:aws:sqs:us-east-1:123:failures"

# During an incident, set reserved concurrency to 0 to stop the
# function from running at all:
aws lambda put-function-concurrency \\
  --function-name order-notifier \\
  --reserved-concurrent-executions 0

# Publish a test SNS event while concurrency is still 0:
aws sns publish --topic-arn arn:aws:sns:us-east-1:123:orders \\
  --message '{"orderId":"order-999"}'

# Check the DLQ almost immediately -- per AWS's own docs, there is
# NO retry delay here, unlike a normal function-error failure which
# would retry twice first:
aws sqs receive-message --queue-url https://sqs.us-east-1.amazonaws.com/123/failures
# {
#   "Body": "{\\"orderId\\":\\"order-999\\"}"
# }
# -- the event is in the DLQ within seconds, NOT after the usual
# 2-retry delay -- because reserved concurrency = 0 diverts new
# async events immediately, bypassing the retry mechanism entirely.`,
    },
    {
      label: 'Restoring concurrency does NOT automatically reprocess what was diverted',
      language: 'bash',
      code: `# Once the incident is resolved, restore normal concurrency:
aws lambda put-function-concurrency \\
  --function-name order-notifier \\
  --reserved-concurrent-executions 100

# The function now processes NEW invocations normally again -- but
# order-999 (sent while concurrency was 0) is NOT automatically
# replayed. It's sitting in the DLQ, exactly where it was diverted,
# per AWS's own docs: "To process events that were sent while
# reserved concurrency was set to zero, you must consume the events
# from the dead-letter queue or the on-failure event destination."

# Manual reprocessing -- pull events back out of the DLQ and
# re-invoke the function directly (one documented approach: set the
# DLQ itself as an event source for the function, or drain and
# re-publish manually):
aws sqs receive-message --queue-url https://sqs.us-east-1.amazonaws.com/123/failures \\
  --max-number-of-messages 10
# -- for each message, re-invoke order-notifier with its Body as the
# payload, then delete the message from the DLQ once reprocessed
# successfully. This step is entirely manual -- restoring
# concurrency alone does nothing for events already diverted.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'During an incident, an on-call engineer follows the main page\'s own guidance to "throttle completely" and sets a misbehaving SNS-triggered function\'s reserved concurrency to 0, planning to restore it once the root cause is fixed an hour later. Several SNS events arrive during that hour. Once the engineer restores reserved concurrency to its normal value, they assume processing will simply resume where it left off. Using this subtopic\'s theory, what actually happened to the events that arrived during that hour, and what does the engineer still need to do?',
    hint: 'Per AWS\'s own documented behavior for reserved concurrency = 0 on an async-triggered function — where did those events actually go, and does restoring concurrency reach back and process them?',
    solution: 'Per this subtopic\'s theory, every SNS event sent during that hour was diverted immediately to the function\'s configured DLQ or on-failure destination, with none of the normal 2 built-in retries attempted — reserved concurrency = 0 is a documented bypass of the retry path, not a pause. Restoring reserved concurrency to its normal value only affects NEW invocations going forward; it does nothing for the events that were already diverted during the zero-concurrency window, exactly as AWS\'s own documentation states: "To process events that were sent while reserved concurrency was set to zero, you must consume the events from the dead-letter queue or the on-failure event destination." The engineer still needs to manually pull each diverted event out of the DLQ (or destination) and re-invoke the function with it — for example, receiving each SQS message, re-invoking the function with its body as the payload, and deleting the message only after it\'s been successfully reprocessed. Assuming the incident is fully resolved once concurrency is restored would silently drop every order notification that arrived during that hour.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting reserved concurrency to 0 "pauses" an async-triggered function the same way throttling normally works elsewhere on the main page — events queue up and retry once concurrency is available again.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states the opposite for this specific case: reserved concurrency = 0 sends new events straight to the DLQ or on-failure destination immediately, "without any retries" — it is a bypass, not a queue-and-wait mechanism.'
    },
    {
      thought: 'Once reserved concurrency is restored to a normal value, any events that arrived while it was 0 are automatically retried against the function again.',
      reality: 'Per this subtopic\'s exercise, AWS\'s own documentation is explicit that this requires manual action — the events sitting in the DLQ or destination must be consumed and reprocessed by hand; restoring concurrency has no retroactive effect on them.'
    },
    {
      thought: 'Reserved concurrency = 0 behaves identically for synchronous and asynchronous invocations, since the main page\'s own "set to 0 to throttle completely" line doesn\'t distinguish between them.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation specifically scopes the immediate-diversion-to-DLQ behavior to "an asynchronously invoked function" — the main page\'s own single blanket line obscures a real difference in behavior by invocation type.'
    }
  ];
}
