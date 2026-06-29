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
  selector: 'app-aws-sns-eventbridge',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './aws-sns-eventbridge.html',
  styleUrl: './aws-sns-eventbridge.scss'
})
export class AwsSnsEventbridge {
  readonly quickRef: QuickRefItem[] = [
    { name: 'SNS Topic', type: 'keyword', desc: 'Pub/sub; publishes to all subscriptions (SQS, Lambda, HTTP, email, SMS)' },
    { name: 'Subscription', type: 'keyword', desc: 'SNS endpoint receiving messages; supports filter policies' },
    { name: 'Filter policy', type: 'keyword', desc: 'SNS attribute-based filter; subscriptions receive only matching messages' },
    { name: 'Fan-out', type: 'keyword', desc: 'SNS → multiple SQS queues; standard pattern for parallel processing' },
    { name: 'EventBridge bus', type: 'keyword', desc: 'Serverless event bus; routes events by rule patterns across AWS services' },
    { name: 'Event pattern', type: 'keyword', desc: 'JSON pattern that EventBridge rules match against incoming events' },
    { name: 'Event archive', type: 'keyword', desc: 'EventBridge stores events for replay; configurable retention period' },
    { name: 'Schema registry', type: 'keyword', desc: 'EventBridge discovers and registers event schemas for code generation' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'SNS: Simple Notification Service',
      points: [
        'SNS is a managed pub/sub service. Publishers send to a topic; all subscriptions receive a copy.',
        'Subscription types: SQS queue, Lambda function, HTTP/HTTPS endpoint, email, SMS, mobile push.',
        'Filter policies allow subscriptions to receive only messages matching attribute criteria.',
        'FIFO SNS topics (ending in .fifo) support exactly-once delivery and ordered delivery to FIFO SQS subscriptions.',
      ]
    },
    {
      heading: 'Amazon EventBridge',
      points: [
        'EventBridge is a serverless event bus that routes events from AWS services, SaaS partners, and custom apps.',
        'Rules match incoming events against JSON patterns and route to targets (Lambda, SQS, Step Functions, etc.).',
        'Event archives capture all events for replay — great for debugging and reprocessing after consumer bugs.',
        'EventBridge Pipes connect sources (SQS, Kinesis) directly to targets with optional enrichment and filtering, without writing glue code.',
      ]
    },
    {
      heading: 'SNS vs EventBridge vs SQS',
      points: [
        'SQS: reliable point-to-point queuing with retries and DLQ. Best for task workers.',
        'SNS: fast fan-out pub/sub to many subscriber types. Best for notifications and triggering multiple consumers.',
        'EventBridge: rich content-based routing with native AWS service integrations. Best for event-driven architectures across services.',
        'Common pattern: SNS → multiple SQS queues (fan-out) for parallel, reliable processing by independent services.',
      ]
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'SNS Publish & Fan-out',
      language: 'typescript',
      code: `import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns      = new SNSClient({ region: 'us-east-1' });
const TOPIC_ARN = process.env.SNS_TOPIC_ARN!;

// Publish event to SNS — all subscriptions receive it
async function publishOrderEvent(order: { id: string; total: number; type: string }) {
  await sns.send(new PublishCommand({
    TopicArn: TOPIC_ARN,
    Message:  JSON.stringify(order),
    Subject:  'order.placed',
    // Message attributes used for filter policies
    MessageAttributes: {
      orderType: {
        DataType:    'String',
        StringValue: order.type,   // 'premium' | 'standard'
      },
      total: {
        DataType:    'Number',
        StringValue: String(order.total),
      },
    },
  }));
  console.log('Published:', order.id);
}

// Fan-out pattern:
// SNS Topic
//   → SQS queue (analytics service)        [subscription filter: none — all events]
//   → SQS queue (premium orders)           [filter: orderType = 'premium']
//   → Lambda  (email notification)         [filter: total >= 100]
//   → HTTP endpoint (audit log)            [no filter]

await publishOrderEvent({ id: 'ORD-001', total: 250, type: 'premium' });`,
    },
    {
      label: 'EventBridge Rule',
      language: 'typescript',
      code: `import {
  EventBridgeClient,
  PutEventsCommand,
  PutRuleCommand,
  PutTargetsCommand
} from '@aws-sdk/client-eventbridge';

const eb  = new EventBridgeClient({ region: 'us-east-1' });

// Publish a custom event to the default bus
async function publishEvent(source: string, detailType: string, detail: object) {
  await eb.send(new PutEventsCommand({
    Entries: [{
      Source:       source,
      DetailType:   detailType,
      Detail:       JSON.stringify(detail),
      EventBusName: 'default',
    }],
  }));
}

// Create a rule: route 'order.placed' events from 'my-shop' to SQS
async function createOrderRule(sqsArn: string) {
  // 1. Create the rule with an event pattern
  await eb.send(new PutRuleCommand({
    Name:         'order-placed-rule',
    EventBusName: 'default',
    EventPattern: JSON.stringify({
      source:      ['my-shop'],
      'detail-type': ['order.placed'],
      detail: {
        total: [{ numeric: ['>=', 100] }], // only orders >= $100
      },
    }),
    State: 'ENABLED',
  }));

  // 2. Add SQS as a target
  await eb.send(new PutTargetsCommand({
    Rule:         'order-placed-rule',
    EventBusName: 'default',
    Targets: [{ Id: 'sqs-target', Arn: sqsArn }],
  }));
}

await publishEvent('my-shop', 'order.placed', { orderId: 'ORD-001', total: 149.99 });`,
    },
    {
      label: 'EventBridge Archive & Replay',
      language: 'typescript',
      code: `import { EventBridgeClient, CreateArchiveCommand, StartReplayCommand } from '@aws-sdk/client-eventbridge';

const eb = new EventBridgeClient({ region: 'us-east-1' });

// Create an archive: retain all events from 'my-shop' for 30 days
async function createArchive() {
  await eb.send(new CreateArchiveCommand({
    ArchiveName:   'my-shop-archive',
    EventSourceArn: \`arn:aws:events:us-east-1:123456789012:event-bus/default\`,
    Description:   '30-day archive for replay',
    RetentionDays: 30,
    EventPattern:  JSON.stringify({ source: ['my-shop'] }),
  }));
  console.log('Archive created');
}

// Replay events from a specific time window to a target bus
async function replayEvents(startTime: Date, endTime: Date) {
  await eb.send(new StartReplayCommand({
    ReplayName:              'replay-missing-events',
    SourceArn:               \`arn:aws:events:us-east-1:123456789012:archive/my-shop-archive\`,
    EventStartTime:          startTime,
    EventEndTime:            endTime,
    Destination: {
      Arn: \`arn:aws:events:us-east-1:123456789012:event-bus/default\`,
    },
  }));
  console.log('Replay started from', startTime, 'to', endTime);
}

await createArchive();
// Replay last hour of events
await replayEvents(
  new Date(Date.now() - 60 * 60 * 1000),
  new Date()
);`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Subscribing a Lambda directly to SNS for high-throughput fan-out',
      wrong: `// SNS → Lambda directly for every event
// Lambda throttled at burst limit, lost events on sustained high load`,
      right: `// SNS → SQS → Lambda (buffering prevents throttle drops)
// SNS publishes to SQS; Lambda polls SQS with managed concurrency
// Failed messages go to DLQ; no silent drops`,
      explanation: 'Direct SNS→Lambda subscriptions can lose events if Lambda throttles. Fan-out to SQS first; Lambda polls SQS with automatic retry and DLQ support.'
    },
    {
      title: 'Not using a DLQ on SNS subscriptions',
      wrong: `// SNS subscription with no redrive policy
// If SQS target is unavailable, SNS retries then silently drops`,
      right: `// Set a DLQ on the SNS subscription (SQS DLQ for failed deliveries)
// Subscription → SQS with redrive policy → DLQ
// Or use SNS subscription dead-letter queue in the subscription config`,
      explanation: 'SNS retries for up to 23 days then drops undeliverable messages. Configure a DLQ on the subscription to capture dropped events.'
    },
    {
      title: 'Writing overly broad EventBridge event patterns',
      wrong: `// Pattern matches all events — rule fires on everything
{ "source": ["my-shop"] }
// Targets receive unrelated events, wasting Lambda invocations`,
      right: `// Narrow pattern to specific event types and fields
{
  "source": ["my-shop"],
  "detail-type": ["order.placed"],
  "detail": { "total": [{ "numeric": [">=", 100] }] }
}`,
      explanation: 'Broad patterns match too many events, increasing processing costs and complexity. Always narrow EventBridge rules to the exact event types and data conditions your target needs.'
    },
    {
      title: 'Forgetting to grant EventBridge permission to invoke targets',
      wrong: `// Rule created but no resource-based policy on the SQS queue
// EventBridge cannot write to SQS → events silently dropped`,
      right: `// Add a SQS policy allowing EventBridge to send messages
// {
//   "Effect": "Allow",
//   "Principal": { "Service": "events.amazonaws.com" },
//   "Action": "SQS:SendMessage",
//   "Resource": "<queue-arn>",
//   "Condition": { "ArnEquals": { "aws:SourceArn": "<rule-arn>" } }
// }`,
      explanation: 'EventBridge targets require resource-based policies. For SQS targets, the queue policy must allow events.amazonaws.com to SendMessage, or events will be silently dropped.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'SNS Filter Policy Setup',
    language: 'typescript',
    description: 'Using AWS SDK, publish 3 orders to an SNS topic with MessageAttributes: orderType (premium/standard) and region (us/eu). Write code that would configure two SQS subscriptions with filter policies: one receives only premium orders, another receives only eu orders (any type). Show both the subscription configuration and publish calls.',
    hints: [
      'Filter policies go in SubscribeCommand FilterPolicy attribute',
      'MessageAttributes on publish must match FilterPolicy keys',
      'StringValue arrays in filter policies mean "any of these values"',
    ],
    starterCode: `import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({ region: 'us-east-1' });

async function setupAndPublish(topicArn: string) {
  // TODO: publish 3 orders with orderType and region attributes
}`,
    solution: `import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({ region: 'us-east-1' });

// Subscription filter policies (set when subscribing via console/CLI):
// Premium queue filter:   { "orderType": ["premium"] }
// EU queue filter:        { "region": ["eu"] }

async function setupAndPublish(topicArn: string) {
  const orders = [
    { id: 'ORD-1', type: 'premium', region: 'us' },  // → premium queue
    { id: 'ORD-2', type: 'standard', region: 'eu' }, // → eu queue
    { id: 'ORD-3', type: 'premium', region: 'eu' },  // → both queues
  ];

  for (const order of orders) {
    await sns.send(new PublishCommand({
      TopicArn: topicArn,
      Message:  JSON.stringify(order),
      MessageAttributes: {
        orderType: { DataType: 'String', StringValue: order.type },
        region:    { DataType: 'String', StringValue: order.region },
      },
    }));
    console.log(\`Published \${order.id}: type=\${order.type} region=\${order.region}\`);
  }
}

// Expected routing:
// ORD-1 → premium queue (type=premium)
// ORD-2 → eu queue (region=eu)
// ORD-3 → premium queue + eu queue (both filters match)`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'What is the SNS fan-out pattern?', options: ['One SNS topic, one SQS queue', 'One SNS topic routing to multiple SQS queues', 'Multiple SNS topics to one Lambda', 'SQS queue feeding an SNS topic'], answer: 1, explanation: 'Fan-out: one SNS topic has multiple SQS subscriptions. Each SQS queue feeds an independent service, enabling parallel processing of the same event.' },
    { q: 'How do SNS filter policies work?', options: ['Filter events by EventBridge rule', 'Match message attributes to allow only relevant messages through to each subscription', 'Filter by message body content', 'Filter by topic ARN'], answer: 1, explanation: 'Filter policies are set per subscription. Only messages whose MessageAttributes match the policy are delivered to that subscription.' },
    { q: 'What unique EventBridge capability helps debug missed events?', options: ['Schema registry', 'Event Pipes', 'Event archive and replay', 'DLQ'], answer: 2, explanation: 'EventBridge archives retain events for a configurable period. Replays reprocess archived events through rules, enabling re-processing after consumer bugs are fixed.' },
    { q: 'What is a key difference between SNS and EventBridge?', options: ['SNS supports Lambda; EventBridge does not', 'EventBridge supports rich content-based routing with patterns; SNS uses simpler attribute filters', 'SNS has event archives; EventBridge does not', 'EventBridge is a queue; SNS is a stream'], answer: 1, explanation: 'EventBridge supports rich JSON pattern matching on event content. SNS supports simpler attribute-based filter policies.' },
    { q: 'What delivery guarantee does Amazon SNS provide?', options: ['At-most-once', 'At-least-once', 'Exactly-once', 'FIFO guaranteed'], answer: 1, explanation: 'SNS provides at-least-once delivery — messages may be delivered more than once. Subscribers must handle duplicates idempotently.' },
    { q: 'What distinguishes EventBridge from SNS for routing?', options: ['EventBridge uses FIFO queues', 'EventBridge applies JSON content-based rules to route to multiple targets', 'EventBridge guarantees exactly-once delivery', 'EventBridge only supports Lambda'], answer: 1, explanation: 'EventBridge uses JSON event pattern rules for content-based filtering and routing to many targets — SNS fans out to all subscribers without content filtering.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'When should I choose EventBridge over SNS?', a: 'EventBridge when you need rich content-based routing, native AWS service integrations (Salesforce, GitHub, custom SaaS), event archiving/replay, or Pipes for no-code source-to-target connections. SNS when you need fast, simple fan-out to multiple subscriber types (SQS, Lambda, HTTP, email).' },
    { q: 'What are EventBridge Pipes?', a: 'Pipes connect a source (SQS, Kinesis, DynamoDB Streams) to a target (Lambda, SQS, EventBridge bus) with optional filtering and enrichment in between — all without writing glue code. Useful for point-to-point event routing with transformation.' },
    { q: 'Can SNS guarantee ordering?', a: 'Standard SNS topics do not guarantee ordering. FIFO SNS topics (ending in .fifo) support strict ordering and exactly-once delivery, but only work with FIFO SQS subscriptions and Lambda targets. They are limited to 300 messages/second per topic.' },
    { q: 'How do you ensure ordered delivery with SNS?', a: 'Standard SNS topics do not guarantee ordering. For ordered delivery use <strong>SNS FIFO topics</strong> paired with SQS FIFO queues — order is maintained per MessageGroupId. FIFO topics cap at 300 msg/s (vs 100,000/s standard) and support only SQS FIFO and Lambda subscribers.' },
    { q: 'When should you choose EventBridge over SNS?', a: 'Choose EventBridge when you need: (1) content-based routing (filter by event field values); (2) SaaS event source integration; (3) event archive and replay; (4) cross-account routing. Use SNS for simple fan-out to many subscribers with no content filtering required.' },
    { q: 'What is the EventBridge default event bus vs custom bus?', a: 'The <strong>default event bus</strong> receives events from AWS services (EC2, S3, CloudTrail). <strong>Custom buses</strong> receive your application events via PutEvents API. <strong>Partner buses</strong> receive SaaS provider events. Cross-account access is configured via resource-based policies on the bus.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'SNS=pub/sub fan-out with attribute filters; EventBridge=content-based routing with archive/replay across AWS services.',
    mustKnow: [
      'SNS: topic → all subscriptions; filter policies restrict per-subscription delivery',
      'Fan-out pattern: SNS → multiple SQS queues for parallel reliable processing',
      'EventBridge: JSON event patterns route events to targets from AWS services, SaaS, custom apps',
      'EventBridge archive+replay: retain events, re-process after bugs fixed',
      'Grant EventBridge permission (resource policy) on SQS targets or events are silently dropped',
      'SNS→Lambda: use SQS buffer to prevent throttle-related event loss at high volume',
    ],
    interviewFocus: [
      'SNS vs EventBridge vs SQS: choosing the right service for the job',
      'Fan-out: SNS topic + multiple SQS queues pattern',
      'EventBridge event patterns: content-based routing vs SNS attribute filters',
      'Archive and replay: debugging and reprocessing missed events',
    ],
  };
}
