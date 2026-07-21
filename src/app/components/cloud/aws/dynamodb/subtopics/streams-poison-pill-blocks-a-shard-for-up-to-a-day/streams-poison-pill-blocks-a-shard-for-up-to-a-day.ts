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
  templateUrl: './streams-poison-pill-blocks-a-shard-for-up-to-a-day.html',
  styleUrl: './streams-poison-pill-blocks-a-shard-for-up-to-a-day.scss'
})
export class StreamsPoisonPillBlocksAShardForUpToADaySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Streams code tab already passes --bisect-batch-on-function-error — without ever explaining what it protects against',
      points: [
        'The main page\'s own theory bullet states: "Lambda event source mapping: Lambda polls the stream, batches records (up to 10,000), and invokes your function. Failures retry the entire batch by default — implement dead-letter handling." This tells you retries happen and that a DLQ is a good idea, but never states how long the default retrying actually continues, or what happens once it stops.',
        'The main page\'s own "Streams & TTL" code tab creates its event source mapping WITH both --bisect-batch-on-function-error and a DestinationConfig DLQ already turned on — presented as ordinary configuration, without ever flagging that the AWS DEFAULT for a brand-new event source mapping has neither of these enabled.',
        'The main page\'s own quiz already states the one fact that turns out to matter most here: "DynamoDB Streams retain records for 24 hours." That number and the Lambda retry behavior are two separate facts on two separate main pages — this subtopic is the missing link between them.',
      ]
    },
    {
      heading: 'By default, a single record that always fails can block every record behind it on that shard for up to a day',
      points: [
        'Per AWS\'s own Lambda API reference, both of the parameters that would normally cap retrying default to unlimited: "MaximumRetryAttempts – ...The default value is -1, which sets the maximum number of retries to infinite. When MaximumRetryAttempts is infinite, Lambda retries failed records until the record expires in the event source" and "MaximumRecordAgeInSeconds – ...The default value is -1, which sets the maximum age to infinite... Lambda never discards old records." BisectBatchOnFunctionError also defaults to false.',
        'AWS\'s own Lambda developer guide states the consequence of these defaults directly: "If the error handling measures fail, Lambda discards the records and continues processing batches from the stream. With the default settings, this means that a bad record can block processing on the affected shard for up to one day." The "one day" ceiling isn\'t a Lambda setting at all — it\'s bounded by the exact 24-hour Streams retention window the main page\'s own quiz already states, since with no retry cap, Lambda simply keeps retrying until the poison-pill record itself falls out of the stream and expires.',
        'This blocks every record BEHIND the poison pill on that specific shard too, not just the poison-pill record itself — DynamoDB Streams processing is ordered per shard, so a batch that can\'t be delivered holds up every subsequent batch from that shard until it\'s resolved, discarded, or expires.',
        'BisectBatchOnFunctionError is the documented way to shrink the blast radius without waiting a full day: per AWS, it "splits a failed batch into two smaller batches, isolating bad records and avoiding timeouts" — and critically, "Splitting batches doesn\'t consume the retry quota," so repeated bisection can isolate a single poison-pill record down to its own one-record batch without burning through MaximumRetryAttempts on the way there. Once isolated to its own batch, MaximumRetryAttempts and MaximumRecordAgeInSeconds (both still worth setting explicitly rather than leaving at their infinite defaults) determine how quickly that one bad record gets discarded and sent to the DLQ configured via OnFailure — after which processing resumes for everything behind it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The AWS default the main page\'s own code tab already avoids, made explicit',
      language: 'bash',
      code: `# Creating a mapping with NEITHER bisect NOR retry limits set --
# this is the actual AWS default, unlike the main page's own tab
# which already sets both:
aws lambda create-event-source-mapping \\
  --event-source-arn arn:aws:dynamodb:eu-west-1:123:table/Orders/stream/2024-01-01 \\
  --function-name OrderStreamProcessor \\
  --starting-position TRIM_HORIZON \\
  --batch-size 100
# (no --bisect-batch-on-function-error, no --maximum-retry-attempts,
# no --maximum-record-age-in-seconds, no --destination-config)

aws lambda get-event-source-mapping --uuid <mapping-uuid> \\
  --query '{Bisect:BisectBatchOnFunctionError,MaxRetries:MaximumRetryAttempts,MaxAge:MaximumRecordAgeInSeconds}'
# {
#   "Bisect": false,
#   "MaxRetries": -1,
#   "MaxAge": -1
# }
# -- per AWS's own API reference, -1 on both retry fields means
# "infinite" -- Lambda will keep retrying a failing record until it
# expires from the stream on its own, which per the main page's own
# quiz answer is bounded by DynamoDB Streams' 24-hour retention.

# If OrderStreamProcessor throws on every invocation containing a
# specific malformed record (say, one with an unexpected NULL where
# the function expects a String), every OTHER record queued behind
# it in that record's shard is now stuck too -- not because they're
# individually failing, but because the shard can't advance past the
# batch containing the poison-pill record.`,
    },
    {
      label: 'Fixing it: the main page\'s own settings, and why each one matters',
      language: 'bash',
      code: `# Update the mapping to match what the main page's own tab already
# configures -- now with the reasoning behind each flag:
aws lambda update-event-source-mapping \\
  --uuid <mapping-uuid> \\
  --bisect-batch-on-function-error \\
  --maximum-retry-attempts 3 \\
  --maximum-record-age-in-seconds 3600 \\
  --destination-config '{"OnFailure":{"Destination":"arn:aws:sqs:eu-west-1:123:dlq"}}'

# --bisect-batch-on-function-error: on a failure, Lambda splits the
# CURRENT batch in two and retries each half -- repeated splitting
# isolates a single bad record into its own batch of one, WITHOUT
# spending retry attempts on the split itself (per AWS: "Splitting
# batches doesn't consume the retry quota"). Every record NOT in the
# bad half keeps moving instead of waiting behind the poison pill.

# --maximum-retry-attempts 3: once the bad record is isolated to its
# own batch, stop retrying it after 3 attempts instead of retrying
# for up to 24 hours by default.

# --maximum-record-age-in-seconds 3600: an independent second cap --
# whichever limit is hit first (age or attempt count) wins.

# --destination-config (OnFailure): where the discarded record goes
# once retries/bisection are exhausted, so "we stopped retrying it"
# doesn't also mean "we lost the record" -- this is exactly the
# "implement dead-letter handling" the main page's own theory bullet
# recommends, now tied to the specific mechanism it protects against.

# Confirming a record actually landed in the DLQ after exhaustion --
# per AWS's own docs, the SQS/SNS destination payload includes a
# "condition": "RetryAttemptsExhausted" field for exactly this case:
aws sqs receive-message --queue-url https://sqs.eu-west-1.amazonaws.com/123/dlq \\
  --query 'Messages[0].Body' --output text | python3 -m json.tool
# { "requestContext": { "condition": "RetryAttemptsExhausted", ... },
#   "DDBStreamBatchInfo": { "shardId": "...", "batchSize": 1, ... } }`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team follows the main page\'s own "Streams & TTL" code tab closely, including --bisect-batch-on-function-error and a DLQ destination — but a teammate later removes --maximum-retry-attempts during a "cleanup," reasoning that "the DLQ already catches failures, so a retry limit is redundant." A month later, a single malformed record starts failing OrderStreamProcessor consistently, and the team notices order-status updates for that shard have completely stopped moving, with nothing showing up in the DLQ yet. Using this subtopic\'s theory, explain what\'s happening and why the DLQ hasn\'t received anything.',
    hint: 'Bisection isolates the bad record into its own small batch — but per AWS\'s own docs, what actually decides WHEN Lambda gives up retrying that isolated batch and sends it to the DLQ?',
    solution: 'Per this subtopic\'s theory, removing --maximum-retry-attempts leaves that setting at AWS\'s own infinite default (-1) — bisection is still isolating the bad record into its own small batch correctly, which is why OTHER shards and other records aren\'t affected, but for the isolated poison-pill record itself, Lambda now retries it until it either succeeds (it won\'t) or the record naturally expires from the stream after the full 24-hour retention window the main page\'s own quiz states. Nothing appears in the DLQ yet because the OnFailure destination is only invoked once Lambda actually GIVES UP on a record — and with MaximumRetryAttempts back at infinite, "giving up" won\'t happen until close to that 24-hour mark, per AWS\'s own documented "up to one day" default-behavior ceiling. The DLQ configuration itself was never wrong; it simply never fires while Lambda is still (per its own configuration) obligated to keep retrying. The fix is restoring an explicit --maximum-retry-attempts (or relying on --maximum-record-age-in-seconds as the cap instead) — the DLQ and the retry limit are not redundant with each other, they are two separate stages: the retry limit decides WHEN Lambda stops trying, and the DLQ is where the record goes ONLY once that decision has been made.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Configuring a DLQ (OnFailure destination) for a DynamoDB Streams event source mapping is sufficient on its own to stop a bad record from blocking a shard, since failed records get routed there automatically.',
      reality: 'Per this subtopic\'s theory, the DLQ only receives a record once Lambda stops retrying it — with MaximumRetryAttempts and MaximumRecordAgeInSeconds left at their infinite defaults, that hand-off can take up to a full day, during which the shard stays blocked with nothing yet in the DLQ.'
    },
    {
      thought: 'The main page\'s own statement that "failures retry the entire batch by default" means only the specific failing record gets retried, so a poison pill can only ever block itself, not other records.',
      reality: 'Per this subtopic\'s theory, without bisection every record in the SAME batch as the poison pill is retried together, and every batch queued behind it on that shard waits its turn — bisection is specifically what narrows the blocked scope down toward just the one bad record.'
    },
    {
      thought: '--bisect-batch-on-function-error alone is enough to fully solve the poison-pill problem, since it isolates the bad record out of larger batches.',
      reality: 'Per this subtopic\'s exercise, bisection only shrinks WHICH records are blocked (isolating the bad one into its own small batch) — it does not, by itself, decide WHEN Lambda gives up on that isolated record. Without an explicit retry/age limit, the isolated poison-pill record can still block just itself for up to a day.'
    }
  ];
}
