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
  selector: 'app-azure-event-grid',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './azure-event-grid.html',
  styleUrl: './azure-event-grid.scss'
})
export class AzureEventGrid {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Event Grid', type: 'keyword', desc: 'Serverless event routing; push-based, fan-out, max 1MB per event' },
    { name: 'Event Hubs', type: 'keyword', desc: 'High-throughput streaming platform; Kafka-compatible, retention-based' },
    { name: 'Topic', type: 'keyword', desc: 'Event Grid source; custom or system topic (Azure resource events)' },
    { name: 'Event subscription', type: 'keyword', desc: 'Endpoint (webhook, queue, function) that receives filtered events' },
    { name: 'Consumer group', type: 'keyword', desc: 'Event Hubs: named cursor into the event stream for independent consumers' },
    { name: 'Capture', type: 'keyword', desc: 'Event Hubs feature that auto-archives stream to Blob/Data Lake' },
    { name: 'Partition key', type: 'keyword', desc: 'Event Hubs: routes events with same key to same partition for ordering' },
    { name: 'Dead-letter storage', type: 'keyword', desc: 'Event Grid: Blob container for events that failed delivery after retries' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Event Grid: Reactive Event Routing',
      points: [
        'Event Grid is a serverless event broker designed for reactive architectures — react to state changes in Azure resources or custom apps.',
        'Publishers push events to a topic; Event Grid fans them out to all matching subscriptions immediately.',
        'Subscriptions can filter events by event type, subject prefix, or advanced filters on event data.',
        'Built-in integration with 20+ Azure services (Blob Storage, Resource Groups, IoT Hub) as system topics.',
      ]
    },
    {
      heading: 'Event Hubs: High-Throughput Streaming',
      points: [
        'Event Hubs is a managed streaming platform handling millions of events per second.',
        'Data is retained for 1–90 days (configurable); consumers read at their own pace like Kafka.',
        'Event Hubs is Kafka-compatible — existing Kafka producers/consumers work with minimal config change.',
        'Capture streams events directly to Azure Blob Storage or Data Lake in Avro format for long-term archiving.',
      ]
    },
    {
      heading: 'Choosing Between Event Grid and Event Hubs',
      points: [
        'Event Grid: reactive, low-volume, push-based events (< 1MB). Best for serverless reactions, webhooks, Logic Apps.',
        'Event Hubs: high-volume continuous data streams (telemetry, logs, clickstreams). Best for analytics, ML pipelines.',
        'Service Bus: reliable message queuing with ordering, sessions, DLQ. Best for application integration and workflows.',
        'Rule of thumb: "something happened" → Event Grid; "continuous data stream" → Event Hubs; "workflow/saga" → Service Bus.',
      ]
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Event Grid: Publish Events',
      language: 'typescript',
      code: `import { EventGridPublisherClient, AzureKeyCredential } from '@azure/eventgrid';

const client = new EventGridPublisherClient(
  process.env.EVENT_GRID_TOPIC_ENDPOINT!,
  'EventGrid',
  new AzureKeyCredential(process.env.EVENT_GRID_TOPIC_KEY!)
);

await client.send([
  {
    eventType: 'order.placed',
    subject:   'orders/ORD-001',
    dataVersion: '1.0',
    data: {
      orderId: 'ORD-001',
      userId:  'u123',
      total:   149.99,
    },
  },
  {
    eventType: 'order.placed',
    subject:   'orders/ORD-002',
    dataVersion: '1.0',
    data: { orderId: 'ORD-002', userId: 'u456', total: 89.00 },
  },
]);

console.log('Published 2 events to Event Grid');`,
    },
    {
      label: 'Event Grid: Webhook Receiver (Azure Function)',
      language: 'typescript',
      code: `import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

interface EventGridEvent {
  id:          string;
  eventType:   string;
  subject:     string;
  data:        unknown;
  eventTime:   string;
  dataVersion: string;
}

app.http('eventGridHandler', {
  methods: ['POST'],
  authLevel: 'function',
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const body = await req.json() as EventGridEvent[];

    // Event Grid validation handshake (first-time subscription)
    if (body[0]?.eventType === 'Microsoft.EventGrid.SubscriptionValidationEvent') {
      const validationCode = (body[0].data as any).validationCode;
      return { status: 200, jsonBody: { validationResponse: validationCode } };
    }

    for (const event of body) {
      ctx.log(\`Processing event: \${event.eventType} subject: \${event.subject}\`);
      await handleEvent(event);
    }

    return { status: 200 };
  },
});

async function handleEvent(event: EventGridEvent) {
  switch (event.eventType) {
    case 'order.placed':
      console.log('New order:', event.data);
      break;
  }
}`,
    },
    {
      label: 'Event Hubs: Send & Receive',
      language: 'typescript',
      code: `import { EventHubProducerClient, EventHubConsumerClient } from '@azure/event-hubs';

const CONNECTION_STRING = process.env.EVENT_HUB_CONNECTION_STRING!;
const HUB_NAME          = 'telemetry';

// --- Producer ---
async function sendTelemetry(deviceId: string, readings: number[]) {
  const producer = new EventHubProducerClient(CONNECTION_STRING, HUB_NAME);

  const batch = await producer.createBatch({
    partitionKey: deviceId,  // same device → same partition → ordered
  });

  for (const value of readings) {
    batch.tryAdd({ body: { deviceId, value, ts: new Date().toISOString() } });
  }

  await producer.sendBatch(batch);
  await producer.close();
  console.log(\`Sent \${readings.length} events for device \${deviceId}\`);
}

// --- Consumer ---
async function startConsumer() {
  const consumer = new EventHubConsumerClient(
    '$Default',         // consumer group
    CONNECTION_STRING,
    HUB_NAME
  );

  consumer.subscribe({
    processEvents: async (events, context) => {
      for (const event of events) {
        console.log('Event:', event.body);
      }
      // Checkpoint: remember position in stream
      await context.updateCheckpoint(events[events.length - 1]);
    },
    processError: async (err) => console.error('Consumer error:', err),
  });
}

await sendTelemetry('device-1', [22.5, 22.7, 23.1]);
await startConsumer();`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Not handling the Event Grid subscription validation handshake',
      wrong: `app.http('handler', {
  handler: async (req) => {
    const events = await req.json();
    await processEvents(events);  // fails validation → subscription never activates
    return { status: 200 };
  },
});`,
      right: `handler: async (req) => {
  const events = await req.json();
  if (events[0]?.eventType === 'Microsoft.EventGrid.SubscriptionValidationEvent') {
    return { status: 200, jsonBody: { validationResponse: events[0].data.validationCode } };
  }
  await processEvents(events);
  return { status: 200 };
}`,
      explanation: 'When a new Event Grid subscription is created, Azure sends a validation event. The webhook must echo the validationCode or the subscription will not activate.'
    },
    {
      title: 'Using Event Grid for high-volume streaming data',
      wrong: `// Sending 10,000 IoT sensor readings per second via Event Grid
for (const reading of sensorReadings) {
  await eventGridClient.send([{ data: reading, eventType: 'sensor.reading' }]);
}`,
      right: `// Use Event Hubs for high-volume streaming
const batch = await producer.createBatch({ partitionKey: deviceId });
for (const reading of sensorReadings) batch.tryAdd({ body: reading });
await producer.sendBatch(batch);`,
      explanation: 'Event Grid is designed for reactive, low-volume events (1MB limit, push model). For high-throughput continuous streams, use Event Hubs which is optimised for millions of events per second.'
    },
    {
      title: 'Not checkpointing Event Hubs consumers',
      wrong: `processEvents: async (events) => {
  for (const e of events) await process(e);
  // no checkpoint → on restart, replays from beginning or earliest
}`,
      right: `processEvents: async (events, context) => {
  for (const e of events) await process(e);
  if (events.length > 0) {
    await context.updateCheckpoint(events[events.length - 1]);
  }
}`,
      explanation: 'Without checkpointing, the consumer restarts from the beginning (or earliest retained event) after a restart. Checkpointing saves the last processed offset to Azure Blob Storage.'
    },
    {
      title: 'Not configuring dead-letter storage for Event Grid subscriptions',
      wrong: `// Subscription with no dead-letter destination
// Failed events (after retries) silently dropped`,
      right: `// Configure dead-letter storage account when creating subscription
// Portal: Event Subscription → Dead-lettering → select Blob container
// ARM/CLI:
// --deadletter-endpoint https://<storage>.blob.core.windows.net/<container>`,
      explanation: 'Event Grid retries delivery for up to 24 hours. Without a dead-letter destination, undeliverable events are silently dropped. Always configure a Blob container for dead-lettered events.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Event Hubs Batch Processor',
    language: 'typescript',
    description: 'Write an Event Hubs consumer that batches incoming telemetry events (from "telemetry" hub) by deviceId. Every 10 seconds, flush the batches — log the average reading per device and checkpoint the last processed event. Use EventHubConsumerClient.',
    hints: [
      'Accumulate events in a Map<string, number[]> keyed by deviceId',
      'Use setInterval to flush every 10s',
      'Store the last event for checkpointing after flush',
    ],
    starterCode: `import { EventHubConsumerClient } from '@azure/event-hubs';

const batches = new Map<string, number[]>();

async function startBatchProcessor() {
  const consumer = new EventHubConsumerClient(
    '$Default',
    process.env.EVENT_HUB_CONNECTION_STRING!,
    'telemetry'
  );
  // TODO: accumulate by deviceId, flush every 10s
}`,
    solution: `import { EventHubConsumerClient } from '@azure/event-hubs';

const batches   = new Map<string, number[]>();
let lastEvent: any = null;
let lastContext: any = null;

async function startBatchProcessor() {
  const consumer = new EventHubConsumerClient(
    '$Default',
    process.env.EVENT_HUB_CONNECTION_STRING!,
    'telemetry'
  );

  setInterval(async () => {
    if (!batches.size) return;
    for (const [deviceId, values] of batches.entries()) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      console.log(\`Device \${deviceId}: avg=\${avg.toFixed(2)} (\${values.length} events)\`);
    }
    batches.clear();
    if (lastEvent && lastContext) {
      await lastContext.updateCheckpoint(lastEvent);
      console.log('Checkpointed offset', lastEvent.offset);
    }
  }, 10_000);

  consumer.subscribe({
    processEvents: async (events, context) => {
      for (const event of events) {
        const { deviceId, value } = event.body;
        const arr = batches.get(deviceId) ?? [];
        arr.push(value);
        batches.set(deviceId, arr);
        lastEvent   = event;
        lastContext = context;
      }
    },
    processError: async (err) => console.error(err),
  });
}`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'Which Azure service is best for high-throughput IoT telemetry streaming?', options: ['Azure Service Bus', 'Azure Event Grid', 'Azure Event Hubs', 'Azure Queue Storage'], answer: 2, explanation: 'Event Hubs is designed for millions of events per second with retention and consumer group offsets — ideal for IoT telemetry.' },
    { q: 'What must a webhook return when Event Grid sends a validation event?', options: ['HTTP 204 No Content', 'The validationCode echoed in the response body', 'An empty 200 OK', 'The subscription ID'], answer: 1, explanation: 'Event Grid sends a SubscriptionValidationEvent; the webhook must return { validationResponse: validationCode } or the subscription won\'t activate.' },
    { q: 'What does the Event Hubs Capture feature do?', options: ['Compresses events before storing', 'Archives stream to Blob Storage or Data Lake automatically', 'Filters events by type', 'Replicates to another region'], answer: 1, explanation: 'Capture automatically persists the event stream to Azure Blob Storage or Data Lake in Avro format for long-term storage and batch analytics.' },
    { q: 'What is a consumer group in Event Hubs?', options: ['A set of partitions', 'A named independent cursor into the event stream', 'A topic subscription with filters', 'A DLQ receiver'], answer: 1, explanation: 'Each consumer group maintains its own independent offset into the event stream, enabling multiple applications to read the same data independently.' },
    { q: 'What delivery model does Azure Event Grid use?', options: ['Pull-based queue polling', 'Push-based delivery with retry', 'Exactly-once guaranteed delivery', 'Batch processing only'], answer: 1, explanation: 'Event Grid pushes events to subscriber endpoints (webhooks, Functions, Service Bus) and retries on failure with exponential backoff for up to 24 hours.' },
    { q: 'What is an Event Grid domain?', options: ['A namespace for event routing rules', 'A multi-tenant endpoint managing many topics under one URL', 'An archived event store', 'A retry configuration object'], answer: 1, explanation: 'An Event Grid domain manages many topics (up to 1000) under a single endpoint — ideal for multi-tenant apps where each tenant gets a dedicated topic without separate endpoints.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'Is Event Hubs really Kafka-compatible?', a: 'Yes. Event Hubs has a Kafka endpoint (port 9093) that speaks the Kafka protocol. Existing Kafka producers/consumers can point to Event Hubs by changing only the bootstrap server and adding SASL authentication — no code changes needed.' },
    { q: 'What is the difference between Event Grid and Event Hubs retention?', a: 'Event Grid is a push system — it delivers events to endpoints immediately and does not retain events. Event Hubs retains events for 1–90 days (configurable). Consumers can replay any event within the retention window.' },
    { q: 'When should I use Event Grid over Event Hubs?', a: 'Use Event Grid when you need to react to specific events (Blob uploaded, resource deployed) and push them to serverless functions, webhooks, or Logic Apps. Use Event Hubs when you need to ingest continuous high-volume data streams for analytics, ML, or long-term archival.' },
    { q: 'How does Event Grid handle delivery failures?', a: 'Event Grid retries with exponential backoff (10s → 30s → 1m → 5m → 10m → 30m → 1h) for up to 24 hours. Configure a <strong>dead-letter destination</strong> (Azure Blob Storage) to capture undeliverable events with failure metadata. CloudWatch-equivalent: set up Azure Monitor alerts on the DeliveryFailed metric.' },
    { q: 'What is the difference between Event Grid system topics and custom topics?', a: '<strong>System topics</strong> are built-in topics from Azure services (Storage, App Service, IoT Hub) — created automatically when you subscribe. <strong>Custom topics</strong> are application-defined endpoints you create and publish to via HTTP POST with an event payload. <strong>Partner topics</strong> receive events from SaaS providers (Auth0, SAP).' },
    { q: 'How do you filter events in an Event Grid subscription?', a: 'Three filter types: (1) <strong>Event type filter</strong>: include/exclude by event type name; (2) <strong>Subject filter</strong>: begins/ends with string matching on the subject field; (3) <strong>Advanced filters</strong>: condition operators (NumberGreaterThan, StringContains, BoolEquals) on any event data field. Filters apply before delivery — unmatched events are discarded.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'Event Grid=reactive push routing; Event Hubs=high-throughput streaming with retention; Service Bus=reliable workflows.',
    mustKnow: [
      'Event Grid: push-based, fan-out, <1MB events, built for serverless reactions and webhooks',
      'Event Hubs: Kafka-compatible, millions/sec, configurable retention, consumer group offsets',
      'Always handle SubscriptionValidationEvent handshake in Event Grid webhooks',
      'Checkpoint Event Hubs consumers after processing to resume correctly on restart',
      'Event Hubs Capture: auto-archive to Blob/Data Lake in Avro format',
      'Dead-letter storage on Event Grid subscriptions prevents silent event drops on failure',
    ],
    interviewFocus: [
      'Event Grid vs Event Hubs vs Service Bus: which for which use case',
      'Kafka compatibility in Event Hubs: enables migration with config-only changes',
      'Consumer groups: how multiple apps read the same event stream independently',
      'Event Grid validation handshake: why it exists and how to implement it',
    ],
  };
}
