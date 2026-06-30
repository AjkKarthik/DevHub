import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';

@Component({
  selector: 'app-monitoring-messaging',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, QuizBlockComponent, QnaBlockComponent],
  templateUrl: './monitoring.html',
  styleUrl: './monitoring.scss'
})
export class MonitoringMessaging {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Consumer lag', type: 'keyword', desc: 'Latest produced offset minus last committed consumer offset' },
    { name: 'DLQ depth', type: 'keyword', desc: 'Number of messages in dead-letter queue; should alert at > 0' },
    { name: 'Throughput', type: 'keyword', desc: 'Messages/second produced and consumed; indicates system load' },
    { name: 'P99 latency', type: 'keyword', desc: '99th percentile message processing latency end-to-end' },
    { name: 'Rebalance rate', type: 'keyword', desc: 'Frequent Kafka rebalances indicate unstable consumers' },
    { name: 'ISR shrink', type: 'keyword', desc: 'Partition losing in-sync replicas; indicates broker or network issues' },
    { name: 'Kafka Exporter', type: 'keyword', desc: 'Prometheus exporter exposing Kafka broker and consumer group metrics' },
    { name: 'Burrow', type: 'keyword', desc: 'LinkedIn open-source Kafka consumer lag monitor with trend analysis' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Key Metrics to Monitor',
      points: [
        'Consumer lag: the most important Kafka metric — how far behind consumers are from producers. Alert when lag grows consistently.',
        'DLQ depth: any messages in the dead-letter queue indicate processing failures. Alert at DLQ depth > 0 and investigate immediately.',
        'Producer/consumer throughput (msg/s and bytes/s): baseline normal rate; alert on sudden drops (consumer down) or spikes (traffic surge).',
        'End-to-end latency: time from publish to processing complete. Track P50, P95, P99; set SLA-based alerts.',
        'Broker metrics: under-replicated partitions, ISR shrinks, leader election rate — all signal broker health issues.',
      ]
    },
    {
      heading: 'Kafka Monitoring Stack',
      points: [
        'JMX metrics are the primary source — Kafka brokers expose hundreds of metrics via JMX.',
        'Kafka Exporter (Prometheus) scrapes JMX and exposes consumer group lag, topic offsets, and partition state.',
        'Grafana dashboards visualise lag trends, throughput, and broker health using Prometheus data sources.',
        'Confluent Control Center (enterprise) provides built-in dashboards, lag alerts, and schema management.',
        'Burrow provides smarter lag alerting: it detects lag trends (growing vs stable) rather than static thresholds.',
      ]
    },
    {
      heading: 'RabbitMQ and Cloud Monitoring',
      points: [
        'RabbitMQ Management Plugin provides REST API and web UI for queue depth, consumer count, message rates, and node health.',
        'prometheus_rabbitmq_exporter exposes metrics for Grafana; key metrics: queue depth, consumer utilisation, deliver/ack rates.',
        'AWS SQS: ApproximateNumberOfMessagesNotVisible (in-flight), ApproximateNumberOfMessagesVisible (queue depth), NumberOfMessagesSent.',
        'Azure Service Bus: ActiveMessages, DeadLetteredMessages, IncomingMessages — available in Azure Monitor metrics.',
        'Set CloudWatch/Azure Monitor alarms on DLQ depth > 0 and queue depth > threshold for all production queues.',
      ]
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Kafka Lag via Admin API',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';

const kafka = new Kafka({ brokers: ['localhost:9092'] });
const admin = kafka.admin();
await admin.connect();

async function getConsumerLag(groupId: string, topic: string) {
  // Latest offsets for each partition
  const latest = await admin.fetchTopicOffsets(topic);

  // Consumer group committed offsets
  const committed = await admin.fetchOffsets({ groupId, topics: [topic] });

  const report: { partition: number; lag: number }[] = [];

  for (const topicOffsets of committed) {
    for (const p of topicOffsets.partitions) {
      const latestOffset = latest.find(l => l.partition === p.partition);
      const lag = latestOffset
        ? Number(latestOffset.offset) - Number(p.offset)
        : 0;
      report.push({ partition: p.partition, lag });
    }
  }

  const totalLag = report.reduce((sum, r) => sum + r.lag, 0);
  console.log(\`Group: \${groupId} | Topic: \${topic} | Total lag: \${totalLag}\`);
  for (const r of report) {
    if (r.lag > 0) console.log(\`  Partition \${r.partition}: lag=\${r.lag}\`);
  }
  return totalLag;
}

// Alert if lag exceeds threshold
const lag = await getConsumerLag('order-processor', 'orders');
if (lag > 10_000) console.error('[ALERT] Consumer lag critical:', lag);

await admin.disconnect();`,
    },
    {
      label: 'RabbitMQ REST API Monitor',
      language: 'typescript',
      code: `// RabbitMQ Management Plugin REST API monitoring

const RABBIT_API = 'http://localhost:15672/api';
const AUTH       = 'Basic ' + Buffer.from('guest:guest').toString('base64');

async function getRabbitStats() {
  const headers = { Authorization: AUTH };

  // Queue depths and consumer counts
  const queues = await fetch(\`\${RABBIT_API}/queues\`, { headers }).then(r => r.json());

  for (const q of queues) {
    const depth     = q.messages ?? 0;
    const consumers = q.consumers ?? 0;
    const dlq       = q.arguments?.['x-dead-letter-routing-key'];

    console.log(\`Queue: \${q.name}\`);
    console.log(\`  Depth: \${depth} | Consumers: \${consumers} | Unacked: \${q.messages_unacknowledged ?? 0}\`);
    console.log(\`  Publish rate: \${q.message_stats?.publish_details?.rate?.toFixed(1) ?? 0}/s\`);
    console.log(\`  Deliver rate: \${q.message_stats?.deliver_details?.rate?.toFixed(1) ?? 0}/s\`);

    if (depth > 10_000) console.error(\`[ALERT] \${q.name} depth critical: \${depth}\`);
    if (consumers === 0 && depth > 0) console.error(\`[ALERT] \${q.name} has no consumers!\`);
  }

  // DLQ depths — alert immediately
  const dlqs = queues.filter((q: any) => q.name.endsWith('.dlq') || q.name.endsWith('-dlq'));
  for (const dlq of dlqs) {
    if ((dlq.messages ?? 0) > 0) {
      console.error(\`[DLQ ALERT] \${dlq.name}: \${dlq.messages} dead-lettered messages!\`);
    }
  }
}

// Run monitoring every 30 seconds
setInterval(getRabbitStats, 30_000);
getRabbitStats();`,
    },
    {
      label: 'SQS / Azure Monitor Alerts',
      language: 'typescript',
      code: `import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: 'us-east-1' });

// SQS queue depth monitoring
async function getSQSMetrics(queueUrl: string) {
  const response = await sqs.send(new GetQueueAttributesCommand({
    QueueUrl:       queueUrl,
    AttributeNames: [
      'ApproximateNumberOfMessages',
      'ApproximateNumberOfMessagesNotVisible',
      'ApproximateNumberOfMessagesDelayed',
    ],
  }));

  const attrs        = response.Attributes!;
  const visible      = parseInt(attrs.ApproximateNumberOfMessages ?? '0');
  const inFlight     = parseInt(attrs.ApproximateNumberOfMessagesNotVisible ?? '0');
  const delayed      = parseInt(attrs.ApproximateNumberOfMessagesDelayed ?? '0');

  console.log(\`Queue: \${queueUrl.split('/').pop()}\`);
  console.log(\`  Visible (waiting): \${visible}\`);
  console.log(\`  In-flight (processing): \${inFlight}\`);
  console.log(\`  Delayed: \${delayed}\`);

  if (visible > 10_000) console.error('[ALERT] SQS queue depth critical:', visible);
  return { visible, inFlight, delayed };
}

// Recommended CloudWatch alarms to create via CDK/Terraform:
// 1. ApproximateNumberOfMessagesVisible > 10000 (queue depth)
// 2. ApproximateNumberOfMessagesNotVisible == 0 + Visible > 0 (no active consumers)
// 3. NumberOfMessagesSent on DLQ > 0 (messages dead-lettered)

await getSQSMetrics(process.env.SQS_QUEUE_URL!);`,
    },
  ];

  readonly quiz: QuizQuestion[] = [
    { q: 'What is consumer lag in Kafka?', options: ['Messages per second', 'Latest produced offset minus last consumed offset', 'Number of partitions', 'Rebalance count'], answer: 1, explanation: 'Lag = latest offset - committed offset. High and growing lag means consumers are falling behind producers.' },
    { q: 'What should always trigger an immediate alert?', options: ['Lag above 0', 'DLQ depth above 0', 'Throughput above baseline', 'Consumer group size above 1'], answer: 1, explanation: 'Any message in a DLQ indicates a processing failure that needs investigation. DLQ depth > 0 should alert immediately.' },
    { q: 'What does ISR shrink indicate in Kafka?', options: ['Consumer rebalance', 'A partition losing in-sync replicas — broker or network issue', 'Schema mismatch', 'High consumer lag'], answer: 1, explanation: 'ISR shrink means a replica has fallen too far behind the leader, reducing fault tolerance and signalling broker or network problems.' },
    { q: 'Which tool provides trend-based Kafka consumer lag alerting?', options: ['Kafka Admin API', 'Burrow', 'Confluent Schema Registry', 'RabbitMQ Management Plugin'], answer: 1, explanation: 'Burrow analyses lag trends (growing vs stable) rather than static thresholds, reducing false positives from temporary lag spikes.' },
    { q: 'Why is under-replicated partition count an important Kafka health metric?', options: ['It measures consumer throughput', 'It signals that some replicas have fallen behind the leader, reducing fault tolerance if a broker fails', 'It tracks how many topics exist', 'It only matters for single-broker clusters'], answer: 1, explanation: 'An under-replicated partition has fewer in-sync replicas than configured. If the leader fails while replicas are behind, recent messages can be lost or the partition becomes unavailable — this metric should be alerted on immediately.' },
    { q: 'What does a rising RabbitMQ "unacknowledged messages" count typically indicate?', options: ['Consumers are processing too fast', 'Consumers are slow, stuck, or crashed while holding message locks without acking', 'The exchange is misconfigured', 'Producers are publishing too few messages'], answer: 1, explanation: 'Unacked messages are delivered but not yet confirmed. A persistently high or growing count means consumers are not keeping up or have died mid-processing, leaving messages redelivered or stuck until the connection times out.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'What is a good consumer lag alert threshold?', a: 'There is no single number — it depends on your message rate and SLA. Alerting on absolute lag (e.g., > 10,000) catches depth, but alerting on lag growth rate (lag increasing for > 5 minutes) is more actionable. Use Burrow for trend-based alerting.' },
    { q: 'How do I monitor end-to-end messaging latency?', a: 'Include a publishedAt timestamp in every message payload. The consumer calculates latency as processedAt - publishedAt. Emit this as a metric (Prometheus, CloudWatch, StatsD) and track P99 latency on a Grafana dashboard.' },
    { q: 'What key RabbitMQ metric indicates consumers are overloaded?', a: 'Consumer utilisation approaching 100% (from the management API) means consumers are always busy — no idle time. Pair with growing queue depth to confirm backpressure is needed. Also watch for high unacknowledged message count, which means slow in-flight processing.' },
    { q: 'What is the difference between monitoring broker health and monitoring pipeline health?', a: 'Broker health covers infrastructure metrics — CPU, disk, network, JVM heap (Kafka), under-replicated partitions, connection counts. Pipeline health covers business-level metrics — consumer lag, DLQ depth, end-to-end latency, message throughput per topic. Both are necessary: a healthy broker can still have a stuck or buggy consumer silently failing the pipeline.' },
    { q: 'Why should DLQ depth be monitored even if it stays low?', a: 'A DLQ that is consistently empty is expected and healthy. A DLQ that suddenly starts accumulating messages signals a regression — a schema change, a downstream outage, or a bug in a recent deploy. Because DLQ entries represent guaranteed processing failures (not just slowness), even a small non-zero count deserves immediate triage rather than being dismissed as noise.' },
    { q: 'What is the value of correlating messaging metrics with deployment events?', a: 'Overlaying deploy markers on lag, error rate, and DLQ dashboards (in Grafana or similar) makes it immediately visible when a new consumer or producer version introduced a regression — turning "lag started climbing at some point today" into "lag started climbing 4 minutes after the 2pm deploy," which collapses incident root-cause time from hours to minutes.' },
  ];
}
