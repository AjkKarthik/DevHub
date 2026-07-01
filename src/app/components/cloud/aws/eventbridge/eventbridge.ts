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
  selector: 'app-aws-eventbridge',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './eventbridge.html',
  styleUrl: './eventbridge.scss'
})
export class AwsEventbridge {

  quickRef: QuickRefItem[] = [
    { name: 'Event Bus', type: 'keyword', desc: 'Pipeline that receives events and routes them to targets based on rules. Default bus = AWS service events; custom buses = your app events.' },
    { name: 'Rule', type: 'keyword', desc: 'Pattern that matches incoming events and routes them to one or more targets (Lambda, SQS, Step Functions, HTTP, etc.).' },
    { name: 'Event Pattern', type: 'keyword', desc: 'JSON filter applied to event fields — supports prefix, suffix, exists, numeric range, anything-but, and $or operators.' },
    { name: 'Schedule Expression', type: 'keyword', desc: 'Cron or rate expression on a rule to trigger targets on a time interval (e.g. rate(5 minutes), cron(0 8 * * ? *)).' },
    { name: 'Schema Registry', type: 'keyword', desc: 'Auto-discovered or manually registered event schemas; generates code bindings in TypeScript, Python, Java.' },
    { name: 'Event Replay', type: 'keyword', desc: 'Archive past events and replay them to a bus — useful for rebuilding downstream state or testing new consumers.' },
    { name: 'Pipes', type: 'keyword', desc: 'Point-to-point integration: source (SQS, Kinesis, DynamoDB Streams) → optional filter/enrich → target, without Lambda glue.' },
    { name: 'Partner Events', type: 'keyword', desc: 'Pre-built integrations with SaaS providers (Stripe, Datadog, Zendesk) that publish events directly to EventBridge.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Event Buses & Event Structure',
      points: [
        'Three bus types: default (AWS service events only), custom (your application events), partner (SaaS integrations).',
        'Every EventBridge event is a JSON object with fixed envelope fields: version, id, source, account, time, region, resources, detail-type, detail.',
        'source identifies the publisher (e.g. "com.myapp.orders"); detail-type describes what happened (e.g. "Order Placed").',
        'detail is a free-form JSON object with event-specific payload — no schema enforced unless you register one.',
        'Events can be up to 256 KB; for larger payloads store in S3 and reference the key in the detail.',
        'Cross-account: event buses can grant PutEvents permission to other accounts; use bus ARN as target for cross-account routing.',
      ]
    },
    {
      heading: 'Rules, Patterns & Targets',
      points: [
        'A rule has either an event pattern (reactive) or a schedule expression (time-based) — not both.',
        'Event patterns match on any combination of envelope fields and detail fields using JSON pattern matching.',
        'Pattern operators: prefix/suffix matching, exists/not-exists, numeric ranges, anything-but, $or for OR logic.',
        'Each rule can have up to 5 targets; targets can be Lambda, SQS, SNS, Step Functions, Kinesis, HTTP endpoint, API Gateway, etc.',
        'Input transformation: transform/reshape the event JSON before delivery to the target using inputPath and inputTemplate.',
        'Retry policy: EventBridge retries failed targets for up to 24 hours with exponential backoff; configure DLQ on the rule.',
      ]
    },
    {
      heading: 'Scheduled Rules & Pipes',
      points: [
        'Rate expression: rate(N minutes/hours/days) — fires every N interval starting from rule creation.',
        'Cron expression: cron(minutes hours day-of-month month day-of-week year) — UTC timezone.',
        'EventBridge Scheduler is a newer service for one-time or recurring schedules with more flexibility (1 million schedules free/month).',
        'EventBridge Pipes: connects source to target with optional filter and enrichment steps — no Lambda plumbing needed.',
        'Pipes sources: SQS, Kinesis Data Streams, DynamoDB Streams, MSK, RabbitMQ.',
        'Pipes enrichment: Lambda, Step Functions Express, API Gateway, API Destinations — transform/enrich between source and target.',
      ]
    },
    {
      heading: 'Schema Registry & Event Replay',
      points: [
        'Schema discovery: EventBridge can auto-discover schemas from events on a bus and store them in the registry.',
        'Schema registry generates type-safe code bindings (TypeScript, Python, Java, Go) downloadable from the console or CLI.',
        'Archives: configure an archive on a bus to store events for a retention period; replay from archive to the bus.',
        'Event replay: re-sends archived events through the bus, triggering existing rules — perfect for bootstrapping a new consumer.',
        'Dead-letter queues on rules: events that fail after retries are sent to an SQS DLQ; inspect and replay manually.',
        'Schema enforcer: use EventBridge Pipes with a Lambda enrichment to validate/transform events against a schema before routing.',
      ]
    },
    {
      heading: 'Common Patterns',
      points: [
        'Microservice decoupling: each service publishes domain events; other services subscribe via rules — no direct service-to-service calls.',
        'Saga pattern: Step Functions orchestrates sagas; EventBridge routes compensation events to undo completed steps on failure.',
        'Audit trail: a catch-all rule routes all events to Kinesis Firehose → S3 for long-term audit storage.',
        'Cross-account event routing: account A grants account B PutEvents; B publishes to A\'s custom bus for centralized processing.',
        'Scheduler for cron jobs: replace EC2 cron scripts with EventBridge Scheduler invoking Lambda — no server needed.',
        'API Destinations: EventBridge can call external HTTP APIs (Stripe, Salesforce) directly from a rule target.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Event Bus & Rules',
      language: 'bash',
      code: `# Create a custom event bus
aws events create-event-bus --name my-app-events

# Put events to the custom bus
aws events put-events --entries '[
  {
    "Source": "com.myapp.orders",
    "DetailType": "Order Placed",
    "Detail": "{\"orderId\":\"abc123\",\"amount\":99.99,\"status\":\"placed\"}",
    "EventBusName": "my-app-events"
  }
]'

# Create a rule matching "Order Placed" events with amount > 100
aws events put-rule \\
  --name high-value-orders \\
  --event-bus-name my-app-events \\
  --event-pattern '{
    "source": ["com.myapp.orders"],
    "detail-type": ["Order Placed"],
    "detail": {
      "amount": [{"numeric": [">", 100]}]
    }
  }'

# Create a scheduled rule (every 5 minutes)
aws events put-rule \\
  --name cleanup-job \\
  --schedule-expression "rate(5 minutes)"

# Create a cron rule (8 AM UTC Mon-Fri)
aws events put-rule \\
  --name daily-report \\
  --schedule-expression "cron(0 8 ? * MON-FRI *)"`,
    },
    {
      label: 'Targets & Permissions',
      language: 'bash',
      code: `# Add Lambda as a target for a rule
aws events put-targets \\
  --rule high-value-orders \\
  --event-bus-name my-app-events \\
  --targets '[{
    "Id": "send-to-lambda",
    "Arn": "arn:aws:lambda:us-east-1:123:function:process-order"
  }]'

# Add SQS as a target with input transformation
aws events put-targets \\
  --rule high-value-orders \\
  --event-bus-name my-app-events \\
  --targets '[{
    "Id": "send-to-sqs",
    "Arn": "arn:aws:sqs:us-east-1:123:fulfillment-queue",
    "InputTransformer": {
      "InputPathsMap": {"orderId": "$.detail.orderId", "amount": "$.detail.amount"},
      "InputTemplate": "{\"order_id\": \"<orderId>\", \"total\": <amount>}"
    }
  }]'

# Grant Lambda invoke permission to EventBridge
aws lambda add-permission \\
  --function-name process-order \\
  --statement-id eventbridge-invoke \\
  --action lambda:InvokeFunction \\
  --principal events.amazonaws.com \\
  --source-arn arn:aws:events:us-east-1:123:rule/my-app-events/high-value-orders

# Add DLQ to a rule for failed deliveries
aws events put-targets \\
  --rule high-value-orders \\
  --event-bus-name my-app-events \\
  --targets '[{
    "Id": "send-to-lambda",
    "Arn": "arn:aws:lambda:us-east-1:123:function:process-order",
    "DeadLetterConfig": {"Arn": "arn:aws:sqs:us-east-1:123:events-dlq"},
    "RetryPolicy": {"MaximumRetryAttempts": 3, "MaximumEventAgeInSeconds": 3600}
  }]'`,
    },
    {
      label: 'Patterns & Cross-account',
      language: 'bash',
      code: `# Prefix match — events from any "com.myapp.*" source
aws events put-rule \\
  --name all-app-events \\
  --event-bus-name my-app-events \\
  --event-pattern '{"source": [{"prefix": "com.myapp."}]}'

# anything-but — exclude "test" environment events
aws events put-rule \\
  --name prod-events-only \\
  --event-bus-name my-app-events \\
  --event-pattern '{"detail": {"environment": [{"anything-but": "test"}]}}'

# exists filter — only events with "userId" field
aws events put-rule \\
  --name authenticated-events \\
  --event-bus-name my-app-events \\
  --event-pattern '{"detail": {"userId": [{"exists": true}]}}'

# Cross-account: grant account 456 permission to put events
aws events put-permission \\
  --event-bus-name my-app-events \\
  --statement-id allow-account-456 \\
  --action events:PutEvents \\
  --principal "456789012345"

# Cross-account: rule in account 123 forwards to account 456 bus
aws events put-targets \\
  --rule forward-to-partner \\
  --event-bus-name my-app-events \\
  --targets '[{
    "Id": "cross-account",
    "Arn": "arn:aws:events:us-east-1:456789012345:event-bus/partner-bus",
    "RoleArn": "arn:aws:iam::123456789012:role/EventBridgeCrossAccountRole"
  }]'`,
    },
    {
      label: 'Archives & Pipes',
      language: 'bash',
      code: `# Create an archive (retain events for 30 days)
aws events create-archive \\
  --archive-name my-app-archive \\
  --event-source-arn arn:aws:events:us-east-1:123:event-bus/my-app-events \\
  --retention-days 30

# Replay archived events (e.g. to test a new consumer)
aws events start-replay \\
  --replay-name test-new-consumer \\
  --event-source-arn arn:aws:events:us-east-1:123:archive/my-app-archive \\
  --event-start-time 2024-01-01T00:00:00Z \\
  --event-end-time 2024-01-31T23:59:59Z \\
  --destination '{"Arn":"arn:aws:events:us-east-1:123:event-bus/my-app-events"}'

# Create an EventBridge Pipe: SQS → Lambda (with filter)
aws pipes create-pipe \\
  --name order-pipe \\
  --source arn:aws:sqs:us-east-1:123:raw-orders \\
  --target arn:aws:lambda:us-east-1:123:function:process-order \\
  --source-parameters '{
    "SqsQueueParameters": {"BatchSize": 10},
    "FilterCriteria": {
      "Filters": [{"Pattern": "{\"body\":{\"status\":[\"placed\"]}}"}]
    }
  }' \\
  --role-arn arn:aws:iam::123:role/EventBridgePipesRole

# Discover schemas from events on a bus
aws schemas create-discoverer \\
  --source-arn arn:aws:events:us-east-1:123:event-bus/my-app-events`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using the default event bus for custom application events',
      wrong: `# Publishing application events to the default bus
aws events put-events --entries '[{
  "Source": "com.myapp.orders",
  "DetailType": "Order Placed",
  "Detail": "{...}"
}]'
# No EventBusName specified — goes to default bus
# Mixes with AWS service events; harder to manage rules`,
      right: `# Create a dedicated custom bus for application events
aws events create-event-bus --name my-app-events

aws events put-events --entries '[{
  "Source": "com.myapp.orders",
  "DetailType": "Order Placed",
  "Detail": "{...}",
  "EventBusName": "my-app-events"
}]'`,
      explanation: 'The default bus is reserved for AWS service events (EC2 state changes, S3 events, etc.). Use a named custom bus for application events — cleaner IAM isolation, separate rules, and easier cross-account sharing.'
    },
    {
      title: 'Forgetting to grant Lambda invoke permission to EventBridge',
      wrong: `# Rule and target created but no resource policy on Lambda
# EventBridge fails to invoke Lambda
# Error in CloudWatch: "The rule's role ARN is not authorized to invoke the target"`,
      right: `aws lambda add-permission \\
  --function-name my-handler \\
  --statement-id eventbridge-invoke \\
  --action lambda:InvokeFunction \\
  --principal events.amazonaws.com \\
  --source-arn arn:aws:events:us-east-1:123:rule/my-app-events/my-rule
# Scope source-arn to specific rule for least privilege`,
      explanation: 'EventBridge needs lambda:InvokeFunction on the target function. The console adds this automatically. CLI/CDK/Terraform require an explicit aws lambda add-permission call scoped to the rule ARN.'
    },
    {
      title: 'No DLQ on rules for critical event processing',
      wrong: `# Rule sends to Lambda with no DLQ configured
# Lambda fails 3 times (network error)
# EventBridge exhausts retries (24h) then drops the event silently
# Data loss — no visibility into what failed`,
      right: `aws events put-targets \\
  --rule critical-rule --event-bus-name my-app-events \\
  --targets '[{
    "Id": "lambda-target",
    "Arn": "arn:aws:lambda:us-east-1:123:function:handler",
    "DeadLetterConfig": {"Arn": "arn:aws:sqs:us-east-1:123:events-dlq"},
    "RetryPolicy": {"MaximumRetryAttempts": 5, "MaximumEventAgeInSeconds": 7200}
  }]'
# Alarm on DLQ depth to detect failures`,
      explanation: 'Without a DLQ, events that exhaust EventBridge retries (up to 24 hours) are silently dropped. Configure a DLQ on the target and a CloudWatch alarm on DLQ depth to catch failures.'
    },
    {
      title: 'Overlapping rules without input transformation causing noisy targets',
      wrong: `# Lambda receives full EventBridge envelope (200+ fields)
# {"version":"0","id":"abc","source":"com.myapp","detail-type":"...","detail":{...}}
# Lambda must extract event.detail on every invocation
# Tightly coupled to EventBridge envelope structure`,
      right: `aws events put-targets \\
  --rule my-rule --event-bus-name my-app-events \\
  --targets '[{
    "Id": "lambda-target",
    "Arn": "arn:aws:lambda:us-east-1:123:function:handler",
    "InputTransformer": {
      "InputPathsMap": {"orderId": "$.detail.orderId"},
      "InputTemplate": "{\"orderId\": \"<orderId>\"}"
    }
  }]'
# Lambda receives only what it needs`,
      explanation: 'Use InputTransformer to strip the EventBridge envelope and deliver only the fields the target needs. This decouples the Lambda from the EventBridge event structure and reduces payload size.'
    },
    {
      title: 'Expecting ordered event delivery from EventBridge',
      wrong: `# Publishing order status transitions: placed → confirmed → shipped
# EventBridge routes each event to Lambda
# Lambda processes: confirmed, placed, shipped (out of order)
# State machine gets confused — invalid transition`,
      right: `# EventBridge does NOT guarantee ordering — use for fire-and-forget routing
# For ordered event processing: use SQS FIFO (per entity) or Kinesis (per partition)
# Combine: EventBridge → SQS FIFO (MessageGroupId = orderId)
# Lambda reads FIFO queue → events processed in order per order`,
      explanation: 'EventBridge delivers events at-least-once with no ordering guarantee. For workflows requiring ordered processing of events per entity, route to SQS FIFO with the entity ID as MessageGroupId.'
    },
  ];

  challenge: Challenge = {
    title: 'Build an Event-Driven Audit System',
    language: 'typescript',
    description: `Design an EventBridge-based audit system that:
1. All services publish domain events to a custom bus "platform-events"
2. A catch-all archive rule stores ALL events for 90 days
3. A security rule matches any event where detail.action is "DELETE" or "ADMIN_ACCESS" and routes to a Lambda "security-auditor"
4. A scheduled rule fires every hour to trigger a "generate-report" Lambda
5. All rule targets have DLQs and retry policies

Provide the event bus, rules, and targets configuration.`,
    hints: [
      'Catch-all pattern: {"source": [{"prefix": ""}]} matches every event on the bus',
      'anything-but is wrong here — use list matching: {"detail":{"action":["DELETE","ADMIN_ACCESS"]}}',
      'Archive requires create-archive pointing at the bus ARN, not a rule',
      'Scheduled rules use schedule-expression, not event-pattern',
      'Each target needs DeadLetterConfig and RetryPolicy separately',
    ],
    starterCode: `// EventBridge Audit System

// Bus: platform-events
// Rules needed:
//   1. catch-all-archive — routes to Kinesis Firehose → S3
//   2. security-events — matches DELETE and ADMIN_ACCESS actions
//   3. hourly-report — cron schedule, triggers generate-report Lambda

// TODO: create event bus
// TODO: create 90-day archive
// TODO: create catch-all rule → Firehose target
// TODO: create security rule → Lambda target with DLQ
// TODO: create scheduled rule → Lambda target with DLQ

// Example event publishers send:
interface AuditEvent {
  source: string;         // e.g. "com.platform.users"
  detailType: string;     // e.g. "User Action"
  detail: {
    userId: string;
    action: string;       // "VIEW" | "EDIT" | "DELETE" | "ADMIN_ACCESS"
    resourceType: string;
    resourceId: string;
    timestamp: string;
  };
}

// Lambda handler for security-auditor
export const securityHandler = async (event: any): Promise<void> => {
  // TODO: extract action and resource from event.detail
  // TODO: log to CloudWatch with severity=HIGH
  // TODO: send PagerDuty alert if action is ADMIN_ACCESS
};
`,
    solution: `// === Event Bus ===
// aws events create-event-bus --name platform-events

// === 90-day Archive ===
// aws events create-archive --archive-name platform-90day
//   --event-source-arn arn:aws:events:us-east-1:123:event-bus/platform-events
//   --retention-days 90

// === Rule 1: Catch-all → Kinesis Firehose (for S3 storage) ===
// aws events put-rule --name catch-all-to-firehose
//   --event-bus-name platform-events
//   --event-pattern '{"source": [{"prefix": ""}]}'
// aws events put-targets --rule catch-all-to-firehose
//   --event-bus-name platform-events
//   --targets '[{"Id":"firehose","Arn":"arn:aws:firehose:us-east-1:123:deliverystream/audit-stream",
//     "RoleArn":"arn:aws:iam::123:role/EventBridgeFirehoseRole",
//     "DeadLetterConfig":{"Arn":"arn:aws:sqs:us-east-1:123:audit-dlq"},
//     "RetryPolicy":{"MaximumRetryAttempts":5}}]'

// === Rule 2: Security Events → Lambda ===
// aws events put-rule --name security-events
//   --event-bus-name platform-events
//   --event-pattern '{"source":[{"prefix":"com.platform."}],"detail":{"action":["DELETE","ADMIN_ACCESS"]}}'
// aws events put-targets --rule security-events
//   --event-bus-name platform-events
//   --targets '[{"Id":"security-lambda",
//     "Arn":"arn:aws:lambda:us-east-1:123:function:security-auditor",
//     "DeadLetterConfig":{"Arn":"arn:aws:sqs:us-east-1:123:security-dlq"},
//     "RetryPolicy":{"MaximumRetryAttempts":3,"MaximumEventAgeInSeconds":3600}}]'

// === Rule 3: Hourly Report ===
// aws events put-rule --name hourly-report
//   --schedule-expression "rate(1 hour)"
// aws events put-targets --rule hourly-report
//   --targets '[{"Id":"report-lambda",
//     "Arn":"arn:aws:lambda:us-east-1:123:function:generate-report",
//     "DeadLetterConfig":{"Arn":"arn:aws:sqs:us-east-1:123:report-dlq"},
//     "RetryPolicy":{"MaximumRetryAttempts":2}}]'

// === Lambda: security-auditor ===
import { EventBridgeEvent } from 'aws-lambda';

interface ActionDetail {
  userId: string;
  action: 'DELETE' | 'ADMIN_ACCESS' | string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
}

export const securityHandler = async (
  event: EventBridgeEvent<'User Action', ActionDetail>
): Promise<void> => {
  const { action, userId, resourceType, resourceId } = event.detail;

  const severity = action === 'ADMIN_ACCESS' ? 'CRITICAL' : 'HIGH';
  console.log(JSON.stringify({ severity, action, userId, resourceType, resourceId, source: event.source }));

  if (action === 'ADMIN_ACCESS') {
    // Send PagerDuty alert via SNS or HTTP API Destination
    console.log('PAGERDUTY ALERT: Admin access detected', { userId, resourceId });
  }
};

// === Permissions ===
// aws lambda add-permission --function-name security-auditor
//   --statement-id eventbridge-security --action lambda:InvokeFunction
//   --principal events.amazonaws.com
//   --source-arn arn:aws:events:us-east-1:123:rule/platform-events/security-events`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the maximum number of targets a single EventBridge rule can have?',
      options: ['1', '5', '10', '20'],
      answer: 1,
      explanation: 'Each EventBridge rule supports up to 5 targets. If you need more consumers, route to an SNS topic or SQS queue and fan out from there.',
    },
    {
      q: 'You want to route events from your application to an external Stripe webhook endpoint. Which EventBridge feature enables this?',
      options: ['Event Archive', 'Schema Registry', 'API Destinations', 'EventBridge Pipes'],
      answer: 2,
      explanation: 'API Destinations let EventBridge call external HTTP/HTTPS endpoints directly as rule targets. You create a Connection (credentials) and an API Destination (URL + method) and use it as a target in your rule.',
    },
    {
      q: 'An EventBridge rule matches an event but the Lambda target returns an error. What happens by default?',
      options: [
        'The event is immediately sent to the DLQ',
        'EventBridge retries for up to 24 hours with exponential backoff',
        'EventBridge retries exactly 3 times then drops the event',
        'The event is replayed from the archive automatically',
      ],
      answer: 1,
      explanation: 'By default, EventBridge retries failed target invocations with exponential backoff for up to 24 hours. You can override the retry count and maximum age. After retries are exhausted, the event is sent to the DLQ if configured.',
    },
    {
      q: 'Which event pattern operator would you use to match events where the "environment" field is NOT equal to "test"?',
      options: ['{"environment": ["!test"]}', '{"environment": [{"anything-but": "test"}]}', '{"environment": [{"not": "test"}]}', '{"environment": [{"ne": "test"}]}'],
      answer: 1,
      explanation: 'The anything-but operator matches values that are not in the provided list: {"environment": [{"anything-but": "test"}]}. This is the correct EventBridge pattern syntax for negation.',
    },
    {
      q: 'What is the purpose of EventBridge Event Replay?',
      options: [
        'Retry failed target invocations automatically',
        'Re-send archived events through the bus to trigger existing rules',
        'Duplicate events to multiple event buses simultaneously',
        'Test event patterns without publishing real events',
      ],
      answer: 1,
      explanation: 'Event Replay re-sends events from an archive back through the event bus, triggering all current matching rules. This is used to bootstrap a new consumer with historical data, reprocess events after a bug fix, or test new rules against real past events.',
    },
    {
      q: 'What is an EventBridge rule\'s "event pattern" used for?',
      options: ['Scheduling cron-based recurring events only', 'Filtering which events on a bus should trigger the rule\'s targets, based on matching fields in the event JSON', 'Encrypting event payloads', 'Defining the IAM permissions for the bus'],
      answer: 1,
      explanation: 'An event pattern is a JSON structure that EventBridge matches against incoming events — only events whose fields match the pattern trigger the rule\'s configured targets (Lambda, SQS, Step Functions, etc.), allowing precise routing of specific event types without writing custom filtering code.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use EventBridge instead of SNS or SQS?',
      a: 'Use EventBridge when: (1) you need content-based routing — route to different targets based on event field values, not just the message type; (2) you want schema discovery and code generation for your event contracts; (3) you need event archiving and replay for new consumers or debugging; (4) you are integrating with AWS services (CodePipeline, GuardDuty, EC2) that publish native events to EventBridge; (5) you need API Destinations to call external HTTP APIs. Use SNS for simple fan-out to many subscribers. Use SQS for durable point-to-point buffering with retries.',
    },
    {
      q: 'What is the difference between EventBridge and EventBridge Pipes?',
      a: 'EventBridge (rules + buses) is a routing layer — events come in, rules match patterns, and targets are invoked in parallel. It is broadcast-style: one event can trigger multiple rules and targets. EventBridge Pipes is point-to-point: a single source (SQS, Kinesis, DynamoDB Streams) connects to a single target with optional filtering and enrichment in between. Pipes replace Lambda glue code that does nothing but poll a source and forward to a target. They are cheaper and simpler for straight-through processing pipelines.',
    },
    {
      q: 'How does EventBridge handle events delivered to Lambda targets under high load?',
      a: 'EventBridge invokes Lambda asynchronously — it does not wait for the Lambda response. Under high event rates, EventBridge can invoke many Lambda instances concurrently up to the account Lambda concurrency limit. If Lambda throttles, EventBridge retries with exponential backoff for up to 24 hours. To handle sustained high throughput, route EventBridge to an SQS queue first, then use SQS as a Lambda event source mapping — this gives you controlled batching, concurrency limits, and a built-in DLQ.',
    },
    {
      q: 'Can EventBridge guarantee ordered delivery of events?',
      a: 'No. EventBridge delivers events at-least-once with no ordering guarantee. Events with the same source and detail-type can arrive out of order at targets. For ordered processing, route events from EventBridge to an SQS FIFO queue (using the entity ID as MessageGroupId), then process from the FIFO queue with Lambda. This combines EventBridge content-based routing with FIFO queue ordering guarantees.',
    },
    {
      q: 'What is the difference between the default EventBridge bus and a custom event bus?',
      a: 'The default bus automatically receives events from AWS services (EC2 state changes, S3 events) and can also receive custom application events. A custom event bus is a dedicated bus you create for your own application or organizational domain events, providing isolation (rules on one bus don\'t see events on another) and clearer ownership boundaries — commonly used in event-driven microservice architectures where each service or domain publishes to its own bus.',
    },
    {
      q: 'How does EventBridge differ from SNS for routing events to multiple consumers?',
      a: 'SNS routes a message to ALL subscribers of a topic (simple pub/sub fan-out) with limited filtering based on message attributes. EventBridge provides much richer content-based routing — rules match on the actual structure/values within the event JSON itself, and EventBridge integrates with 200+ AWS services as both sources and targets plus supports schema discovery/registry. Choose SNS for simple fan-out notifications; choose EventBridge for complex, content-aware event routing across many event sources.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'EventBridge is a serverless event bus that routes events between AWS services, applications, and SaaS providers using content-based rules — enabling loosely coupled, event-driven architectures.',
    mustKnow: [
      'Three bus types: default (AWS service events), custom (app events), partner (SaaS)',
      'Rules: event pattern (content-based) OR schedule expression — not both on same rule',
      'Event patterns: prefix, suffix, exists, numeric range, anything-but, $or operators',
      'Retry: up to 24h exponential backoff; configure DLQ on target for exhausted events',
      'InputTransformer: reshape event JSON before delivery to decouple targets from envelope',
      'EventBridge does NOT guarantee ordering — use SQS FIFO for ordered processing',
    ],
    interviewFocus: [
      'EventBridge vs SNS vs SQS: when to use each based on routing, ordering, and durability needs',
      'Event pattern matching operators: anything-but, exists, numeric, prefix — common exam topics',
      'Retry + DLQ on targets: what happens when retries are exhausted without a DLQ',
      'Event Replay: use case for bootstrapping new consumers from historical events',
    ],
  };
}
