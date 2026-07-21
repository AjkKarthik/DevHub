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
  templateUrl: './dlq-only-captures-the-event-not-why-it-failed.html',
  styleUrl: './dlq-only-captures-the-event-not-why-it-failed.scss'
})
export class DlqOnlyCapturesTheEventNotWhyItFailedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own async error-handling story stops at "then DLQ" — Destinations never appear anywhere on the page',
      points: [
        'The main page\'s own theory bullet states: "Asynchronous triggers: S3, SNS, EventBridge, IoT — Lambda queues internally, retries 2x on failure, then DLQ." The main page\'s own quickRef entry frames it the same way: "Dead Letter Queue: SQS or SNS target for failed async invocations after 2 built-in retries." Both present the DLQ as the entire failure-handling story.',
        'The main page\'s own "Layers & Observability" code tab includes a --dead-letter-config example — and that\'s the only async failure-handling mechanism shown anywhere on the page. The words "Destination," "OnFailure," and "OnSuccess" never appear in the main page\'s theory, quickRef, code tabs, mistakes, quiz, or QnA.',
        'AWS\'s own documentation frames the relationship the OPPOSITE way from how the main page presents it: "As an alternative to an on-failure destination, you can configure your function with a dead-letter queue" — Destinations are the primary, current feature; a DLQ is explicitly the alternative.',
      ]
    },
    {
      heading: 'A DLQ only ever gets the original event — Destinations get the actual error and response',
      points: [
        'Per AWS\'s own documentation, this is stated directly: "For dead-letter queues, Lambda only sends the content of the event, without details about the response." Destinations, by contrast: "The invocation record contains details about the request and response in JSON format."',
        'AWS\'s own example invocation record for a Destination shows exactly what a DLQ never captures — a requestContext.condition of "RetriesExhausted", an approximateInvokeCount, a responseContext.functionError of "Unhandled", and a responsePayload.errorMessage with the actual exception text ("Process exited before completing request"). A DLQ message, by contrast, only gets three limited attributes: RequestID, ErrorCode (just the HTTP status code), and ErrorMessage — explicitly capped at "the first 1 KB of the error message."',
        'Destinations also cover strictly more ground than a DLQ: five target types (SQS, SNS, S3, Lambda function, EventBridge) versus a DLQ\'s two (SQS or SNS standard queues/topics only), and BOTH an OnSuccess and an OnFailure condition, versus a DLQ which only ever captures failures.',
        'This isn\'t a minor gap for debugging — a team relying only on the main page\'s own DLQ example has to separately correlate a DLQ message\'s RequestID against CloudWatch Logs just to find out WHY an event failed, something a Destination\'s invocation record already answers directly in the same JSON document.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own DLQ example, and exactly what lands in it',
      language: 'bash',
      code: `# The main page's own code tab, unchanged:
aws lambda update-function-configuration \\
  --function-name my-async-fn \\
  --dead-letter-config "TargetArn=arn:aws:sqs:us-east-1:123:failures"

# After an async invocation exhausts its 2 built-in retries, this is
# the ENTIRE content of the message that lands in the DLQ -- per
# AWS's own docs, just the raw event plus three limited attributes:
aws sqs receive-message --queue-url https://sqs.us-east-1.amazonaws.com/123/failures \\
  --attribute-names All --message-attribute-names All
# {
#   "Body": "{\\"orderId\\":\\"order-456\\", ...}",   <- just the original event
#   "MessageAttributes": {
#     "RequestID":    { "StringValue": "e4b46cbf-..." },
#     "ErrorCode":    { "StringValue": "200" },          <- HTTP status only
#     "ErrorMessage": { "StringValue": "RequestId: e4b..." }  <- first 1 KB only
#   }
# }
# -- no functionError type, no full stack trace, no
# "RetriesExhausted" vs some other condition, no distinction between
# "the function itself threw" and "Lambda gave up for another
# reason" -- just the original event and a truncated message.`,
    },
    {
      label: 'Configuring a Destination instead — the same failure, far more detail',
      language: 'bash',
      code: `# Add an on-failure Destination instead of (or alongside) a DLQ:
aws lambda update-function-event-invoke-config \\
  --function-name my-async-fn \\
  --destination-config '{"OnFailure":{"Destination":"arn:aws:sqs:us-east-1:123:failures-destination"}}'

# For the SAME failed invocation, this is AWS's own documented
# invocation record shape landing in the destination queue --
# a complete JSON document, not a truncated attribute:
aws sqs receive-message --queue-url https://sqs.us-east-1.amazonaws.com/123/failures-destination
# {
#   "version": "1.0",
#   "timestamp": "2019-11-14T18:16:05.568Z",
#   "requestContext": {
#     "requestId": "e4b46cbf-...",
#     "functionArn": "arn:aws:lambda:us-east-1:123:function:my-async-fn:$LATEST",
#     "condition": "RetriesExhausted",         <- WHY it stopped retrying
#     "approximateInvokeCount": 3
#   },
#   "requestPayload": { "orderId": "order-456" },      <- the original event
#   "responseContext": {
#     "statusCode": 200,
#     "executedVersion": "$LATEST",
#     "functionError": "Unhandled"             <- the error TYPE
#   },
#   "responsePayload": {
#     "errorMessage": "RequestId: e4b46cbf-... Process exited before completing request"
#   }
# }
# -- the same event as the DLQ example, but now with the exact retry
# condition, the error type, and the FULL response payload -- no
# separate CloudWatch Logs lookup needed just to see why it failed.
# You can also add an OnSuccess destination -- something a DLQ can
# never do, since it only ever captures failures.
aws lambda update-function-event-invoke-config \\
  --function-name my-async-fn \\
  --destination-config '{"OnSuccess":{"Destination":"arn:aws:sns:us-east-1:123:successes"}}'`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own "Layers & Observability" code tab exactly, a team configures a DLQ for their async-triggered function. A production incident happens: several events land in the DLQ. The on-call engineer pulls a DLQ message, sees the original event and a truncated ErrorMessage attribute, but can\'t tell whether the function threw an unhandled exception, timed out, or was throttled repeatedly until retries were exhausted — so they spend 20 minutes cross-referencing the RequestID against CloudWatch Logs to find out. Using this subtopic\'s theory, what configuration change would have made that 20 minutes unnecessary, and why?',
    hint: 'What\'s actually missing from a DLQ message that a Destination\'s invocation record includes directly?',
    solution: 'Per this subtopic\'s theory, adding an on-failure Destination (in addition to or instead of the DLQ) would have surfaced the answer directly in the same message the on-call engineer already had to open — no separate CloudWatch Logs lookup required. A DLQ message only contains the original event plus three limited attributes (RequestID, a bare HTTP status code as ErrorCode, and the first 1 KB of ErrorMessage) — it never states WHY Lambda stopped retrying or what kind of error occurred. A Destination\'s invocation record, by contrast, includes requestContext.condition (e.g. "RetriesExhausted," distinguishing exhausted retries from other stop conditions), responseContext.functionError (the error TYPE — "Unhandled" vs a Lambda-side error), and the full responsePayload with the complete error message, not a 1 KB-truncated fragment. The fix is exactly the code in this subtopic\'s second example: add an OnFailure destination via update-function-event-invoke-config alongside (or instead of) the existing --dead-letter-config, and the next incident\'s root cause is visible in the destination message itself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Dead Letter Queue and an on-failure Destination are just two names for the same feature, so it doesn\'t matter which one the main page shows.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation explicitly frames a DLQ as "an alternative to an on-failure destination" — Destinations are the primary, richer feature (five target types, both success and failure conditions, full request/response detail); a DLQ is the narrower legacy option (two target types, failure only, event-only content).'
    },
    {
      thought: 'Since a DLQ message includes an "ErrorMessage" attribute, that\'s already enough to understand why a function failed without checking anything else.',
      reality: 'Per this subtopic\'s theory, AWS\'s own docs state ErrorMessage on a DLQ is explicitly capped at "the first 1 KB of the error message" with no error type or retry-condition context — a Destination\'s full responsePayload and requestContext.condition give a complete picture in the same message.'
    },
    {
      thought: 'Because the main page only shows a DLQ example and never mentions Destinations, Destinations must be a newer, less-proven, or optional feature not worth using for a production function.',
      reality: 'Per this subtopic\'s theory, it\'s the reverse — AWS\'s own docs describe the DLQ as the alternative to Destinations, not the other way around, and Destinations support strictly more (both success/failure conditions, five target types, full invocation detail) than a DLQ ever can.'
    }
  ];
}
