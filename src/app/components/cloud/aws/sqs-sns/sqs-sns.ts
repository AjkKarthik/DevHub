import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-aws-sqs-sns',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './sqs-sns.html',
  styleUrl: './sqs-sns.scss'
})
export class AwsSqsSns {

  quickRef: QuickRefItem[] = [
    { name: 'SQS Standard Queue', type: 'keyword', desc: 'At-least-once delivery, best-effort ordering, nearly unlimited throughput — messages may arrive out of order or duplicated.' },
    { name: 'SQS FIFO Queue', type: 'keyword', desc: 'Exactly-once processing, strict ordering per message group ID; 300 TPS (3000 with batching) without high throughput mode.' },
    { name: 'Visibility Timeout', type: 'keyword', desc: 'Period a received message is hidden from other consumers; if not deleted before timeout, message reappears for retry.' },
    { name: 'Dead-Letter Queue (DLQ)', type: 'keyword', desc: 'Separate queue that receives messages after maxReceiveCount failures; use for debugging and alerting.' },
    { name: 'Long Polling', type: 'keyword', desc: 'ReceiveMessage waits up to 20s for messages (WaitTimeSeconds > 0) — reduces empty responses and cost.' },
    { name: 'SNS Topic', type: 'keyword', desc: 'Pub/sub fanout — one publish delivers to all subscribed endpoints (SQS, Lambda, HTTP, email, SMS).' },
    { name: 'Message Filtering', type: 'keyword', desc: 'SNS subscription filter policy — subscribers only receive messages matching JSON attribute conditions.' },
    { name: 'SNS FIFO Topic', type: 'keyword', desc: 'Ordered, deduplicated fanout; only SQS FIFO queues can subscribe; use for ordered event broadcasting.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'SQS Queue Types & Delivery Guarantees',
      points: [
        'Standard queue: at-least-once delivery — a message may be delivered more than once (duplicate possible). Consumers must be idempotent.',
        'FIFO queue: exactly-once processing within a 5-minute deduplication window; strict ordering per MessageGroupId.',
        'FIFO throughput: 300 messages/s (300 batches of 10 = 3,000 msg/s). Enable high-throughput mode for 70,000 msg/s.',
        'Message size: up to 256 KB. For larger payloads, store in S3 and send the S3 key in the message (Extended Client pattern).',
        'Retention: 1 minute to 14 days (default 4 days). Messages not consumed within retention period are deleted automatically.',
        'Long polling (WaitTimeSeconds=20) reduces empty ReceiveMessage responses and lowers API call costs.',
      ]
    },
    {
      heading: 'Visibility Timeout & Dead-Letter Queues',
      points: [
        'When a consumer calls ReceiveMessage, the message is hidden for the visibility timeout (default 30s, max 12 hours).',
        'If the consumer crashes before calling DeleteMessage, the message reappears after the timeout — another consumer retries.',
        'Set visibility timeout > max expected processing time (include Lambda timeout if using event source mapping).',
        'maxReceiveCount: after this many receive attempts, SQS moves the message to the DLQ.',
        'DLQ must be same type as source (Standard DLQ for Standard queue, FIFO DLQ for FIFO queue).',
        'Set a CloudWatch alarm on DLQ ApproximateNumberOfMessagesVisible to alert on processing failures.',
      ]
    },
    {
      heading: 'SNS Topics & Fan-out Pattern',
      points: [
        'SNS is a push-based pub/sub service — publishers send once, SNS delivers to all subscribers simultaneously.',
        'Supported subscription endpoints: SQS, Lambda, HTTP/HTTPS, email, SMS, mobile push, Kinesis Data Firehose.',
        'Fan-out pattern: one SNS topic + multiple SQS subscriptions = parallel processing by independent consumers.',
        'Message filtering: add a filter policy to a subscription so it only receives messages with matching attributes.',
        'SNS FIFO: ordered + deduplicated fanout; only SQS FIFO queues can subscribe; used for ordered event broadcasts.',
        'Message attributes: metadata (string/binary/number) attached to a message; used for filtering and routing.',
      ]
    },
    {
      heading: 'SQS + Lambda Event Source Mapping',
      points: [
        'Lambda polls SQS and processes batches; Standard queues scale to 60 concurrent Lambda instances; FIFO scales per MessageGroupId.',
        'ReportBatchItemFailures: Lambda returns a list of failed messageIds; only those are retried, not the whole batch.',
        'bisect-on-function-error: splits a failing batch in half to isolate the poison-pill message.',
        'Event filter: Lambda event source mapping filters let Lambda skip irrelevant messages before invocation.',
        'Scaling: Lambda adds 60 instances at a time for Standard queues until concurrency or queue is drained.',
        'Lambda DLQ and SQS DLQ are independent — Lambda DLQ handles async invocation failures; SQS DLQ handles message exhaustion.',
      ]
    },
    {
      heading: 'Common Architectures',
      points: [
        'Order processing: API Gateway → SQS (buffer) → Lambda (process) → DynamoDB. SQS absorbs traffic spikes.',
        'Fan-out: S3 event → SNS topic → multiple SQS queues (analytics, email, fulfillment) processed independently.',
        'Priority queues: two SQS queues (high/low); consumer checks high-priority queue first, falls back to low.',
        'Cross-region fan-out: SNS in us-east-1 → SQS queues in eu-west-1 + ap-southeast-1 for global processing.',
        'Outbox pattern: application writes to DB + SQS transactionally via DynamoDB Streams → Lambda → SQS.',
        'FIFO ordering by tenant: use CustomerId as MessageGroupId so each customer\'s messages are strictly ordered.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SQS Operations',
      language: 'bash',
      code: `# Create a Standard SQS queue
aws sqs create-queue \\
  --queue-name order-processing \\
  --attributes VisibilityTimeout=60,MessageRetentionPeriod=86400

# Create a FIFO queue (name must end with .fifo)
aws sqs create-queue \\
  --queue-name payments.fifo \\
  --attributes FifoQueue=true,ContentBasedDeduplication=true,VisibilityTimeout=30

# Send a message
aws sqs send-message \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/order-processing \\
  --message-body '{"orderId":"abc","amount":99.99}' \\
  --message-attributes 'Priority={StringValue=high,DataType=String}'

# Send FIFO message
aws sqs send-message \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/payments.fifo \\
  --message-body '{"customerId":"cust1","amount":50}' \\
  --message-group-id cust1 \\
  --message-deduplication-id "cust1-$(date +%s)"

# Long poll for messages (wait up to 20 seconds)
aws sqs receive-message \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/order-processing \\
  --max-number-of-messages 10 \\
  --wait-time-seconds 20

# Delete a message after processing
aws sqs delete-message \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/order-processing \\
  --receipt-handle "AQEB..."

# Get queue attributes
aws sqs get-queue-attributes \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/order-processing \\
  --attribute-names ApproximateNumberOfMessages,VisibilityTimeout`,
    },
    {
      label: 'DLQ & Visibility',
      language: 'bash',
      code: `# Create a DLQ
aws sqs create-queue \\
  --queue-name order-processing-dlq \\
  --attributes MessageRetentionPeriod=1209600

# Get DLQ ARN
DLQ_ARN=$(aws sqs get-queue-attributes \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/order-processing-dlq \\
  --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)

# Attach DLQ to source queue (maxReceiveCount=3 → after 3 failures, move to DLQ)
aws sqs set-queue-attributes \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/order-processing \\
  --attributes RedrivePolicy="{\"deadLetterTargetArn\":\"$DLQ_ARN\",\"maxReceiveCount\":3}"

# Extend visibility timeout for a message being processed slowly
aws sqs change-message-visibility \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/order-processing \\
  --receipt-handle "AQEB..." \\
  --visibility-timeout 120

# Alarm on DLQ depth
aws cloudwatch put-metric-alarm \\
  --alarm-name orders-dlq-depth \\
  --metric-name ApproximateNumberOfMessagesVisible \\
  --namespace AWS/SQS \\
  --dimensions Name=QueueName,Value=order-processing-dlq \\
  --period 60 --evaluation-periods 1 \\
  --threshold 1 --comparison-operator GreaterThanOrEqualToThreshold \\
  --alarm-actions arn:aws:sns:us-east-1:123:ops-alerts`,
    },
    {
      label: 'SNS Fan-out',
      language: 'bash',
      code: `# Create an SNS topic
aws sns create-topic --name order-events

# Subscribe SQS queues to the topic (fan-out)
aws sns subscribe \\
  --topic-arn arn:aws:sns:us-east-1:123:order-events \\
  --protocol sqs \\
  --notification-endpoint arn:aws:sqs:us-east-1:123:analytics-queue

aws sns subscribe \\
  --topic-arn arn:aws:sns:us-east-1:123:order-events \\
  --protocol sqs \\
  --notification-endpoint arn:aws:sqs:us-east-1:123:fulfillment-queue

# Subscribe Lambda to topic
aws sns subscribe \\
  --topic-arn arn:aws:sns:us-east-1:123:order-events \\
  --protocol lambda \\
  --notification-endpoint arn:aws:lambda:us-east-1:123:function:send-email

# Add subscription filter (only "status":"placed" messages to fulfillment)
aws sns set-subscription-attributes \\
  --subscription-arn arn:aws:sns:us-east-1:123:order-events:abc-sub \\
  --attribute-name FilterPolicy \\
  --attribute-value '{"status":["placed","confirmed"]}'

# Publish a message with attributes
aws sns publish \\
  --topic-arn arn:aws:sns:us-east-1:123:order-events \\
  --message '{"orderId":"xyz","amount":150}' \\
  --message-attributes 'status={DataType=String,StringValue=placed}'`,
    },
    {
      label: 'SQS + Lambda ESM',
      language: 'bash',
      code: `# Create event source mapping: SQS → Lambda
aws lambda create-event-source-mapping \\
  --function-name order-processor \\
  --event-source-arn arn:aws:sqs:us-east-1:123:order-processing \\
  --batch-size 10 \\
  --function-response-types ReportBatchItemFailures

# FIFO queue mapping (one concurrent Lambda per MessageGroupId)
aws lambda create-event-source-mapping \\
  --function-name payment-processor \\
  --event-source-arn arn:aws:sqs:us-east-1:123:payments.fifo \\
  --batch-size 10 \\
  --function-response-types ReportBatchItemFailures

# Add event filter (only process high-priority messages in Lambda)
aws lambda update-event-source-mapping \\
  --uuid esm-uuid-here \\
  --filter-criteria 'Filters=[{Pattern="{\"messageAttributes\":{\"Priority\":{\"stringValue\":[\"high\"]}}}"}]'

# Lambda handler returning partial batch failures (TypeScript pattern)
# export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
#   const failures: SQSBatchItemFailure[] = [];
#   for (const record of event.Records) {
#     try { await processMessage(record); }
#     catch { failures.push({ itemIdentifier: record.messageId }); }
#   }
#   return { batchItemFailures: failures };
# };

# List event source mappings for a function
aws lambda list-event-source-mappings \\
  --function-name order-processor`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using Standard queue where idempotency is required but not implemented',
      wrong: `# Standard SQS queue, no idempotency in consumer
# Consumer charges a credit card for each message received
# A message is delivered twice (at-least-once) → double charge`,
      right: `# Option 1: Use FIFO queue (exactly-once processing)
aws sqs create-queue --queue-name payments.fifo \\
  --attributes FifoQueue=true,ContentBasedDeduplication=true

# Option 2: Standard queue + idempotency check
# Store processed messageId in DynamoDB with TTL=24h
# Before processing: check if messageId already processed
# If yes: skip and delete; if no: process then record messageId`,
      explanation: 'Standard SQS delivers at-least-once — duplicates are possible. Either use FIFO for exactly-once processing, or implement idempotency by recording processed message IDs (DynamoDB with TTL is a common pattern).'
    },
    {
      title: 'Visibility timeout shorter than processing time',
      wrong: `# Lambda timeout = 60 seconds
# SQS visibility timeout = 30 seconds (default)
# Lambda takes 45s to process → message reappears at 30s
# Another Lambda picks it up → duplicate processing`,
      right: `# Set visibility timeout > Lambda timeout + buffer
aws sqs set-queue-attributes \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/my-queue \\
  --attributes VisibilityTimeout=90
# Rule: visibility timeout = Lambda timeout x 6 (AWS recommendation)
# Or use ChangeMessageVisibility mid-processing to extend`,
      explanation: 'If visibility timeout expires before the consumer finishes, the message reappears and is processed again. AWS recommends setting visibility timeout to 6x the Lambda function timeout.'
    },
    {
      title: 'Not granting SQS queue permission to receive from SNS',
      wrong: `# SNS topic subscribes to SQS queue
# aws sns subscribe --protocol sqs ...
# SNS publish fails silently or returns "Access Denied"
# Queue receives no messages`,
      right: `# Queue policy must allow SNS to SendMessage
aws sqs set-queue-attributes \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/my-queue \\
  --attributes Policy='{
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "sns.amazonaws.com"},
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:us-east-1:123:my-queue",
      "Condition": {"ArnEquals": {"aws:SourceArn": "arn:aws:sns:us-east-1:123:my-topic"}}
    }]
  }'`,
      explanation: 'SNS needs explicit SQS queue policy permission to deliver messages. The AWS Console adds this automatically when you subscribe, but CLI/CDK require it explicitly. Scope Condition to the specific topic ARN.'
    },
    {
      title: 'Not setting a DLQ on critical queues',
      wrong: `# No DLQ configured
# A poison-pill message causes Lambda to fail every time
# maxReceiveCount exceeded → SQS deletes the message silently
# Data lost; no alert; incident discovered days later`,
      right: `# Always configure DLQ + CloudWatch alarm
aws sqs set-queue-attributes \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/critical-queue \\
  --attributes RedrivePolicy='{"deadLetterTargetArn":"arn:...:critical-dlq","maxReceiveCount":3}'

# Alarm when DLQ receives any message
aws cloudwatch put-metric-alarm \\
  --alarm-name critical-dlq-depth --threshold 1 \\
  --alarm-actions arn:aws:sns:us-east-1:123:pagerduty`,
      explanation: 'Without a DLQ, messages that repeatedly fail processing are deleted after maxReceiveCount attempts — silent data loss. Always attach a DLQ and a CloudWatch alarm on its depth so failures are visible immediately.'
    },
    {
      title: 'Publishing to SNS and forgetting Raw Message Delivery',
      wrong: `# SQS subscription without raw message delivery
# SNS wraps the message in a JSON envelope:
# {"Type":"Notification","MessageId":"...","Message":"{\"orderId\":\"abc\"}","TopicArn":"..."}
# Consumer expects just the order JSON → parse error`,
      right: `# Enable Raw Message Delivery on the SQS subscription
aws sns set-subscription-attributes \\
  --subscription-arn arn:aws:sns:us-east-1:123:order-events:sub-abc \\
  --attribute-name RawMessageDelivery \\
  --attribute-value true
# Consumer now receives the raw message body directly`,
      explanation: 'By default SNS wraps messages in a JSON envelope with metadata fields. If your SQS consumer expects raw payloads, enable RawMessageDelivery on the subscription. Without it you must parse the outer SNS envelope first.'
    },
  ];

  challenge: Challenge = {
    title: 'Design an Order Processing Fan-out System',
    language: 'typescript',
    description: `Design a fan-out architecture for an e-commerce order system:
1. When an order is placed, publish to an SNS topic "new-orders"
2. Fan out to three SQS queues: analytics-queue, fulfillment-queue, email-queue
3. Fulfillment queue should ONLY receive orders with status="confirmed" (use filter policy)
4. Each SQS queue triggers a separate Lambda function
5. Fulfillment Lambda must process exactly once — choose the right queue type

Provide: SNS topic + subscription setup, filter policy, Lambda ESM configurations, and DLQ strategy.`,
    hints: [
      'Standard queues are fine for analytics and email (idempotent operations)',
      'Fulfillment requires FIFO + exactly-once — but SNS FIFO topic only fans out to SQS FIFO queues',
      'For FIFO + filter, use SNS FIFO topic → SQS FIFO queues',
      'Add DLQs to all three SQS queues with maxReceiveCount=3',
      'ReportBatchItemFailures on ESM lets Lambda retry only failed messages in a batch',
    ],
    starterCode: `// Order Fan-out System Design

// SNS Topic: new-orders
// Subscribers:
//   1. analytics-queue (Standard SQS) — all messages
//   2. fulfillment-queue (FIFO SQS) — only status="confirmed"
//   3. email-queue (Standard SQS) — all messages

// TODO: Create SNS topic
// TODO: Create three SQS queues (with appropriate types)
// TODO: Subscribe queues to topic
// TODO: Add filter policy for fulfillment-queue
// TODO: Create Lambda ESM for each queue
// TODO: Configure DLQs

// Lambda handler for fulfillment (FIFO - idempotent by message)
import { SQSEvent, SQSBatchResponse } from 'aws-lambda';

export const fulfillmentHandler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const failures = [];
  for (const record of event.Records) {
    // TODO: parse order from record.body
    // TODO: call fulfillment service
    // TODO: catch errors and push to failures
  }
  return { batchItemFailures: failures };
};
`,
    solution: `// === SNS FIFO Topic (for ordered fulfillment) ===
// aws sns create-topic --name new-orders.fifo --attributes FifoTopic=true,ContentBasedDeduplication=true

// === SQS Queues ===
// Standard (analytics + email):
// aws sqs create-queue --queue-name analytics-queue
// aws sqs create-queue --queue-name email-queue

// FIFO (fulfillment):
// aws sqs create-queue --queue-name fulfillment-queue.fifo
//   --attributes FifoQueue=true,ContentBasedDeduplication=true

// === SNS Subscriptions ===
// aws sns subscribe --topic-arn arn:...:new-orders.fifo --protocol sqs
//   --notification-endpoint arn:...:analytics-queue
// aws sns subscribe --topic-arn arn:...:new-orders.fifo --protocol sqs
//   --notification-endpoint arn:...:email-queue
// aws sns subscribe --topic-arn arn:...:new-orders.fifo --protocol sqs
//   --notification-endpoint arn:...:fulfillment-queue.fifo

// === Filter Policy (fulfillment only gets confirmed orders) ===
// aws sns set-subscription-attributes
//   --subscription-arn arn:...:fulfillment-sub
//   --attribute-name FilterPolicy
//   --attribute-value '{"status":["confirmed"]}'

// === DLQs (all three queues) ===
// aws sqs create-queue --queue-name analytics-dlq
// aws sqs set-queue-attributes --queue-url analytics-queue-url
//   --attributes RedrivePolicy='{"deadLetterTargetArn":"arn:...:analytics-dlq","maxReceiveCount":3}'
// (same pattern for email-dlq and fulfillment-dlq.fifo)

// === Lambda ESMs ===
// aws lambda create-event-source-mapping --function-name analytics-fn
//   --event-source-arn arn:...:analytics-queue --batch-size 100
//   --function-response-types ReportBatchItemFailures
// (same for email-fn and fulfillment-fn with fulfillment-queue.fifo)

import { SQSEvent, SQSBatchResponse, SQSBatchItemFailure } from 'aws-lambda';

interface Order { orderId: string; status: string; amount: number; customerId: string; }

export const fulfillmentHandler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const failures: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    try {
      // SNS wraps the payload — parse outer envelope if RawMessageDelivery is off
      const body = JSON.parse(record.body);
      const order: Order = JSON.parse(body.Message ?? record.body);

      await fulfillOrder(order);
    } catch (err) {
      console.error('Failed to process', record.messageId, err);
      failures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures: failures };
};

async function fulfillOrder(order: Order): Promise<void> {
  // Call warehouse API, update DynamoDB, etc.
  console.log('Fulfilling order', order.orderId);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'An SQS Standard queue is processing payment events. The same payment is occasionally processed twice. Which is the best fix?',
      options: [
        'Increase the visibility timeout',
        'Switch to FIFO queue for exactly-once processing',
        'Implement idempotency using a processed-message ID store',
        'Both B and C are valid solutions',
      ],
      answer: 3,
      explanation: 'FIFO queues provide exactly-once processing within a deduplication window. Standard queues with idempotency checks (e.g. DynamoDB TTL store) also work. Both are valid — FIFO is simpler but has throughput limits; idempotency on Standard scales higher.',
    },
    {
      q: 'What is the maximum visibility timeout for an SQS message?',
      options: ['30 seconds', '15 minutes', '12 hours', '24 hours'],
      answer: 2,
      explanation: 'The maximum visibility timeout is 12 hours. The default is 30 seconds. Set it to at least the maximum expected processing time to prevent messages reappearing mid-processing.',
    },
    {
      q: 'You subscribe an SQS queue to an SNS topic using the CLI, but no messages arrive in the queue. What is the most likely cause?',
      options: [
        'SQS and SNS are in different regions',
        'The SQS queue is missing a resource policy allowing SNS to send messages',
        'You must use FIFO queues with SNS',
        'SNS only supports HTTP/HTTPS subscriptions via CLI',
      ],
      answer: 1,
      explanation: 'SNS needs an explicit SQS queue resource policy granting sqs:SendMessage to the SNS service. The AWS Console adds this automatically; CLI subscriptions require it to be set separately.',
    },
    {
      q: 'What does enabling Raw Message Delivery on an SNS-to-SQS subscription do?',
      options: [
        'Encrypts the message payload in transit',
        'Removes the SNS JSON envelope so the consumer receives the raw message body',
        'Enables message deduplication for Standard queues',
        'Increases message size limit to 512 KB',
      ],
      answer: 1,
      explanation: 'By default, SNS wraps messages in a JSON envelope containing Type, MessageId, TopicArn, and Message fields. Raw Message Delivery removes this envelope so the consumer receives the original payload directly.',
    },
    {
      q: 'A Lambda function processing SQS messages takes 90 seconds. The visibility timeout is 60 seconds. What will happen?',
      options: [
        'Lambda extends the visibility timeout automatically',
        'The message reappears in the queue after 60 seconds and may be processed twice',
        'Lambda will fail with a timeout error at 60 seconds',
        'SQS deletes the message after 60 seconds',
      ],
      answer: 1,
      explanation: 'When the visibility timeout expires, the message reappears in the queue and another consumer (or another Lambda instance) can pick it up, causing duplicate processing. Set visibility timeout to at least 6x the Lambda timeout (AWS recommendation).',
    },
    {
      q: 'What is the difference between SQS Standard and SQS FIFO queues?',
      options: ['They are functionally identical with different pricing', 'Standard queues offer at-least-once delivery with best-effort ordering and nearly unlimited throughput; FIFO queues guarantee exactly-once processing and strict ordering at lower throughput', 'FIFO queues cannot be used with Lambda', 'Standard queues guarantee message ordering by default'],
      answer: 1,
      explanation: 'Standard queues maximize throughput and scalability at the cost of occasional duplicate delivery and out-of-order messages — suitable when message order does not strictly matter. FIFO queues guarantee messages are processed exactly once, in the exact order sent (within a message group), at significantly lower throughput limits — necessary for use cases like financial transactions where order and exactly-once processing are critical.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use SQS vs SNS vs EventBridge for decoupling?',
      a: 'SQS is a queue — use it when you need durable buffering, rate limiting a consumer, or reliable point-to-point delivery (one consumer per message). SNS is pub/sub fanout — one message delivered to multiple subscribers simultaneously; no storage, no retry after delivery attempt. EventBridge is an event bus — use it for event-driven architectures where routing rules are complex (filter by event source, detail fields), for integrating with AWS services and SaaS partners, or when you need schema registry and event replay.',
    },
    {
      q: 'How does FIFO queue ordering work with multiple consumers?',
      a: 'FIFO queues use MessageGroupId to maintain order. Messages with the same MessageGroupId are processed in order by a single consumer at a time — no two Lambda instances process the same group simultaneously. Different MessageGroupIds are processed in parallel. Use the natural ordering key (customerId, orderId, sessionId) as the MessageGroupId. A single-group FIFO queue behaves like a single-threaded queue; using many distinct group IDs enables parallelism while maintaining per-group ordering.',
    },
    {
      q: 'What is the fan-out pattern and why is it better than point-to-point for multiple consumers?',
      a: 'The fan-out pattern uses SNS + multiple SQS queues: a single SNS publish delivers the message to all subscribed queues simultaneously, each processed independently by their own Lambda. This is better than a single queue with multiple consumers because: (1) each consumer has its own queue with independent retry, DLQ, and scaling; (2) one slow consumer does not block others; (3) you can add new consumers by subscribing a new queue without modifying the publisher; (4) each consumer can have independent filter policies.',
    },
    {
      q: 'How do I handle large messages (>256 KB) in SQS?',
      a: 'SQS has a 256 KB message limit. For larger payloads, use the S3 Extended Client pattern: store the payload in S3, put the S3 bucket + key reference in the SQS message, and have consumers fetch from S3. The AWS Java SDK has an official SQS Extended Client library that handles this automatically. Set S3 object lifecycle rules (e.g. 1-day TTL) to clean up processed payloads. For SNS, use the same pattern — publish S3 reference in the SNS message attribute.',
    },
    {
      q: 'What is a Dead Letter Queue (DLQ) in SQS, and why is configuring one a best practice?',
      a: 'A DLQ is a separate queue that automatically receives messages which have failed processing a configured maximum number of times (maxReceiveCount) — rather than being retried indefinitely or silently lost. Without a DLQ, a malformed or "poison pill" message can be redelivered and fail repeatedly forever, consuming consumer resources without resolution. Configuring a DLQ lets you isolate and inspect these failed messages separately, alerting on DLQ depth to catch processing bugs without blocking the main queue\'s healthy message flow.',
    },
    {
      q: 'How does the SNS-to-SQS fan-out pattern work, and what problem does it solve?',
      a: 'In this pattern, a single SNS topic publishes one message that is automatically delivered to MULTIPLE subscribed SQS queues simultaneously, each consumed independently by a different downstream service. This solves the problem of one event needing to trigger several independent, decoupled processes (e.g., an "order placed" event needing to trigger inventory update, email notification, and analytics tracking) without the publisher needing to know about or directly call each consumer — each consumer just subscribes its own queue to the topic.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'SQS decouples producers from consumers with durable buffering; SNS fans out to multiple subscribers simultaneously — together they enable resilient, scalable event-driven architectures.',
    mustKnow: [
      'Standard queue: at-least-once delivery, best-effort order — consumers must be idempotent',
      'FIFO queue: exactly-once within 5-min deduplication window, ordered per MessageGroupId',
      'Visibility timeout: set to 6x Lambda timeout; message reappears if not deleted in time',
      'DLQ: catches messages after maxReceiveCount failures — always configure + alert on depth',
      'SNS fan-out: one publish → multiple SQS/Lambda/HTTP subscribers simultaneously',
      'Message filtering: SNS subscription filter policy routes by message attribute values',
    ],
    interviewFocus: [
      'SQS vs SNS vs EventBridge: when to use each and their delivery guarantees',
      'Visibility timeout gotcha: why setting it too low causes duplicate processing',
      'Fan-out pattern: SNS + multiple SQS queues for independent parallel consumers',
      'FIFO + MessageGroupId: how per-group ordering enables parallelism without violating order',
    ],
  };
}
