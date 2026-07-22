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
  templateUrl: './malformed-batchitemfailures-fails-the-whole-batch.html',
  styleUrl: './malformed-batchitemfailures-fails-the-whole-batch.scss'
})
export class MalformedBatchitemfailuresFailsTheWholeBatchSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page teaches ReportBatchItemFailures as a clean fix — never what happens when the response itself is malformed',
      points: [
        'The main page\'s own theory bullet states: "ReportBatchItemFailures: Lambda returns a list of failed messageIds; only those are retried, not the whole batch." This reads as if simply enabling the feature guarantees partial-failure behavior.',
        'The main page\'s own codeTabs show a correctly-written example handler (per-record try/catch pushing failed IDs into a batchItemFailures array) — a genuinely correct pattern, but the page never shows or warns about what happens when that pattern is implemented slightly wrong.',
      ]
    },
    {
      heading: 'AWS documents an exact, narrow list of success/failure conditions — several easy mistakes silently defeat partial-batch reporting entirely',
      points: [
        'Per AWS\'s own documentation: "Lambda treats a batch as a complete success if your function returns any of the following: An empty batchItemFailures list / A null batchItemFailures list / An empty EventResponse / A null EventResponse." Anything outside that specific list is NOT treated as complete success.',
        'The complete-failure list is just as precise: "Lambda treats a batch as a complete failure if your function returns any of the following: An invalid JSON response / An empty string itemIdentifier / A null itemIdentifier / An itemIdentifier with a bad key name / An itemIdentifier value with a message ID that doesn\'t exist." Most strikingly, and stated separately: "If your function throws an exception, the entire batch is considered a complete failure" — even if every message was individually caught and handled correctly up to that point in the code.',
        'This means several innocent-looking bugs silently regress the whole feature back to "retry everything," even though ReportBatchItemFailures is correctly enabled on the event source mapping: a typo in the response key name (batchItemFailures vs BatchItemFailures, or itemIdentifier vs itemId), accidentally including a stale message ID left over from a retry-loop bug, or letting even ONE unhandled exception escape the handler after the per-record try/catch loop (a logging call, a metrics call, a finally block) rather than inside it.',
        'AWS documents the exact operational signal to catch this class of bug: "To determine whether your function is correctly reporting batch item failures, you can monitor the NumberOfMessagesDeleted and ApproximateAgeOfOldestMessage Amazon SQS metrics... If [NumberOfMessagesDeleted] drops to 0, this is a sign that your function response is not correctly returning failed messages... A sharp increase in [ApproximateAgeOfOldestMessage] can indicate that your function is not correctly returning failed messages."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing a silent regression — a typo in the response key',
      language: 'bash',
      code: `# The main page's own correct pattern, with ONE subtle bug -- the
# nested key is misspelled ("itemId" instead of "itemIdentifier"):
# export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
#   const failures: SQSBatchItemFailure[] = [];
#   for (const record of event.Records) {
#     try { await processMessage(record); }
#     catch { failures.push({ itemId: record.messageId } as any); }  // <- BUG
#   }
#   return { batchItemFailures: failures };
# };

# 8 of 10 messages in the batch process successfully; 2 genuinely fail
# and are correctly caught -- but per AWS's own documented failure
# conditions, "An itemIdentifier with a bad key name" is a COMPLETE
# FAILURE condition, not a partial one:
aws sqs get-queue-attributes \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/order-processing \\
  --attribute-names ApproximateNumberOfMessages
# -- all 10 messages reappear after the visibility timeout, including
# the 8 that were already successfully processed -- the same
# "process the same message multiple times" problem
# ReportBatchItemFailures exists specifically to prevent.

# Confirm via CloudWatch, exactly as AWS's own docs recommend:
aws cloudwatch get-metric-statistics \\
  --namespace AWS/SQS --metric-name NumberOfMessagesDeleted \\
  --dimensions Name=QueueName,Value=order-processing \\
  --start-time 2026-07-21T00:00:00Z --end-time 2026-07-21T01:00:00Z \\
  --period 300 --statistics Sum
# { "Datapoints": [{ "Sum": 0.0 }] }
# -- zero messages deleted, despite 8/10 having processed correctly
# in the Lambda's own application logs -- exactly the signal AWS's
# own docs describe: "a sign that your function response is not
# correctly returning failed messages."`,
    },
    {
      label: 'The fix — correct key names, and an exception escaping the loop',
      language: 'bash',
      code: `# Corrected response shape, matching the main page's own pattern
# exactly (itemIdentifier, not itemId):
# export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
#   const failures: SQSBatchItemFailure[] = [];
#   for (const record of event.Records) {
#     try { await processMessage(record); }
#     catch { failures.push({ itemIdentifier: record.messageId }); }
#   }
#   return { batchItemFailures: failures };
# };

# A SEPARATE, easy-to-introduce bug during a later refactor -- an
# exception thrown AFTER the loop, outside every per-record catch:
# export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
#   const failures: SQSBatchItemFailure[] = [];
#   for (const record of event.Records) {
#     try { await processMessage(record); }
#     catch { failures.push({ itemIdentifier: record.messageId }); }
#   }
#   await emitBatchMetrics(failures.length);  // <- if THIS throws...
#   return { batchItemFailures: failures };
# }
# -- per AWS's own docs: "If your function throws an exception, the
# entire batch is considered a complete failure" -- this is true
# EVEN THOUGH every individual message was correctly processed and
# caught inside the loop; the escaped exception from the metrics
# call alone is enough to fail the whole batch.

# Detecting this class of regression proactively -- extend the main
# page's own DLQ-alarm pattern to also watch oldest-message age:
aws cloudwatch put-metric-alarm \\
  --alarm-name orders-esm-not-partial-failing \\
  --metric-name ApproximateAgeOfOldestMessage \\
  --namespace AWS/SQS \\
  --dimensions Name=QueueName,Value=order-processing \\
  --period 300 --evaluation-periods 2 \\
  --threshold 600 --comparison-operator GreaterThanThreshold \\
  --alarm-actions arn:aws:sns:us-east-1:123:ops-alerts`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own ReportBatchItemFailures pattern exactly, a team enables partial batch reporting on their SQS-to-Lambda event source mapping and deploys a handler that correctly catches and records failures for each message inside a per-record try/catch, matching the main page\'s own code tab. Months later, a refactor adds a single line after the processing loop — an await call to a metrics-emission helper function — that occasionally throws due to an unrelated, intermittent network issue reaching the metrics backend. The team notices message reprocessing rates spike sharply, even though the per-record catch logic in the loop itself is completely unchanged and still correct. Using this subtopic\'s theory, explain why.',
    hint: 'Per AWS\'s own documented failure conditions, does an unhandled exception ANYWHERE in the handler — not just inside the per-record loop — affect how the whole batch is treated?',
    solution: 'Per this subtopic\'s theory, this is exactly the "exception outside the per-record catch" failure mode AWS documents: "If your function throws an exception, the entire batch is considered a complete failure." The per-record try/catch inside the loop is still working exactly as designed — every individual message that fails during processMessage() is still being correctly caught and recorded in the batchItemFailures array. The problem is the NEW line added after the loop: when the metrics-emission call throws (due to the intermittent network issue), that exception propagates all the way out of the handler function itself, unhandled — and per AWS\'s own documented rule, this makes the ENTIRE invocation\'s batch a complete failure, discarding whatever partial-success information the (correctly-built) batchItemFailures array would otherwise have returned. Every message in that batch reappears in the queue after the visibility timeout, including messages that had already processed successfully — exactly the "process the same message multiple times" problem ReportBatchItemFailures exists to prevent, reintroduced by a single unguarded line that has nothing to do with SQS message processing at all. The fix is wrapping the metrics-emission call in its own try/catch (or otherwise ensuring nothing outside the per-record loop can throw unhandled), so a failure in a peripheral concern like metrics reporting can never cascade into treating an otherwise-successful batch as a total failure.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Enabling ReportBatchItemFailures on the event source mapping (FunctionResponseTypes) is sufficient on its own to guarantee only-failed-messages-retry behavior, regardless of exactly what the handler code returns.',
      reality: 'Per this subtopic\'s theory, AWS documents a precise, narrow set of response shapes that count as success or partial failure — anything outside those exact conditions (a malformed key, an invalid message ID, an unhandled exception) is treated as a complete batch failure regardless of the feature being enabled.'
    },
    {
      thought: 'If a Lambda handler correctly catches and records failures for each message inside a per-record try/catch, the overall batch can never be treated as a complete failure.',
      reality: 'Per this subtopic\'s exercise, an unhandled exception ANYWHERE in the handler — even in code entirely unrelated to message processing, positioned after the per-record loop — still causes AWS to treat the whole batch as a complete failure, regardless of how correctly the loop itself is written.'
    },
    {
      thought: 'Referencing a message ID in batchItemFailures that doesn\'t actually belong to the current batch is harmless — Lambda simply ignores the unrecognized ID and processes the rest of the response normally.',
      reality: 'Per this subtopic\'s theory, AWS explicitly lists "An itemIdentifier value with a message ID that doesn\'t exist" as one of the documented conditions that causes the ENTIRE batch to be treated as a complete failure, not merely ignored.'
    }
  ];
}
