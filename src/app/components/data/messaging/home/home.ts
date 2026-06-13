import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic { title: string; route: string; badge: string; description: string; keyPoints: string[]; available: boolean; }

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'RabbitMQ': 'rabbitmq', 'Kafka': 'kafka',
  'Patterns': 'patterns', 'Azure SB': 'azure', 'AWS SQS/SNS': 'aws',
  'Reliability': 'reliability', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'RabbitMQ', 'Kafka', 'Patterns', 'Azure SB', 'AWS SQS/SNS', 'Reliability', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'Messaging Fundamentals', route: '/messaging', badge: 'Foundations', description: 'Why asynchronous messaging — decoupling, buffering, fan-out, and the producer-consumer model.', keyPoints: ['Synchronous vs async communication', 'Producer-consumer model', 'Message brokers vs direct HTTP', 'Durability and replay', 'At-least-once vs exactly-once'], available: false },
  { title: 'Message Queues vs Event Streams', route: '/messaging', badge: 'Foundations', description: 'Key differences between message queues (work queues) and event streaming platforms like Kafka.', keyPoints: ['Queue: destructive read', 'Stream: log-based replay', 'Consumer group semantics', 'Retention policy differences', 'Choosing queue vs stream'], available: false },
  { title: 'RabbitMQ Core Concepts', route: '/messaging', badge: 'RabbitMQ', description: 'Exchanges, queues, bindings, and the AMQP protocol — how messages flow through RabbitMQ.', keyPoints: ['Producer → Exchange → Queue → Consumer', 'AMQP protocol', 'Connection and channels', 'Exchange types overview', 'Queue properties (durable, exclusive)'], available: false },
  { title: 'RabbitMQ Exchanges', route: '/messaging', badge: 'RabbitMQ', description: 'Direct, fanout, topic, and headers exchanges — routing keys, bindings, and wildcard patterns.', keyPoints: ['Direct: exact routing key match', 'Fanout: broadcast to all queues', 'Topic: wildcard routing (*, #)', 'Headers exchange', 'Default (nameless) exchange'], available: false },
  { title: 'RabbitMQ Patterns', route: '/messaging', badge: 'RabbitMQ', description: 'Work queues, publish/subscribe, RPC, dead-letter exchanges, and priority queues.', keyPoints: ['Work queue round-robin', 'Publish/subscribe fan-out', 'RPC with reply_to', 'Dead-letter exchange (DLX)', 'Message TTL and priority'], available: false },
  { title: 'Kafka Architecture', route: '/messaging', badge: 'Kafka', description: 'Topics, partitions, offsets, brokers, and the ZooKeeper/KRaft metadata layer in Apache Kafka.', keyPoints: ['Topics are append-only logs', 'Partitions for parallelism', 'Offset = position in partition', 'Broker cluster', 'KRaft vs ZooKeeper'], available: false },
  { title: 'Kafka Producers & Consumers', route: '/messaging', badge: 'Kafka', description: 'Producing messages with keys and partitioners, consumer groups, and offset commit strategies.', keyPoints: ['Producer key → partition mapping', 'acks=0/1/all durability', 'Consumer group coordination', 'Auto vs manual offset commit', 'Seek and replay'], available: false },
  { title: 'Kafka Streams & KSQL', route: '/messaging', badge: 'Kafka', description: 'Stream processing with Kafka Streams DSL and interactive queries, plus KSQL for SQL-style stream processing.', keyPoints: ['Kafka Streams DSL', 'map, filter, groupByKey', 'KTable for changelog streams', 'Interactive queries', 'KSQL CREATE STREAM'], available: false },
  { title: 'Messaging Patterns', route: '/messaging', badge: 'Patterns', description: 'Enterprise Integration Patterns — message routing, transformation, aggregation, and scatter-gather.', keyPoints: ['Content-based routing', 'Message transformation/enricher', 'Aggregator pattern', 'Scatter-gather', 'Competing consumers'], available: false },
  { title: 'Saga Pattern', route: '/messaging', badge: 'Patterns', description: 'Manage distributed transactions without two-phase commit — choreography vs orchestration sagas.', keyPoints: ['Saga = sequence of local transactions', 'Choreography: event-driven', 'Orchestration: central coordinator', 'Compensating transactions', 'Idempotency requirements'], available: false },
  { title: 'Outbox Pattern', route: '/messaging', badge: 'Patterns', description: 'Reliably publish events alongside database writes using the transactional outbox pattern.', keyPoints: ['Write to outbox table in same tx', 'Polling publisher or CDC', 'At-least-once delivery guarantee', 'Idempotent consumers', 'Debezium CDC approach'], available: false },
  { title: 'Azure Service Bus', route: '/messaging', badge: 'Azure SB', description: 'Managed messaging with queues, topics, subscriptions, sessions, and dead-letter queues on Azure.', keyPoints: ['Queue vs topic/subscription', 'Sessions for ordered delivery', 'Auto-forwarding', 'Dead-letter queue', 'Message lock and abandon'], available: false },
  { title: 'Azure Event Grid & Event Hubs', route: '/messaging', badge: 'Azure SB', description: 'Event Grid for reactive pub/sub and Event Hubs for high-throughput event streaming on Azure.', keyPoints: ['Event Grid: serverless events', 'Event Hubs: Kafka-compatible', 'Capture to Blob/Data Lake', 'Partition key for ordering', 'Consumer groups'], available: false },
  { title: 'AWS SQS', route: '/messaging', badge: 'AWS SQS/SNS', description: 'Standard and FIFO queues, visibility timeout, dead-letter queues, and long polling on SQS.', keyPoints: ['Standard vs FIFO queue', 'Visibility timeout', 'Long polling (WaitTimeSeconds)', 'Dead-letter queue (DLQ)', 'Message attributes'], available: false },
  { title: 'AWS SNS & EventBridge', route: '/messaging', badge: 'AWS SQS/SNS', description: 'Fan-out with SNS, filter policies, and event-driven routing with EventBridge rules.', keyPoints: ['SNS topic to multiple subscribers', 'SQS fan-out pattern', 'SNS filter policies', 'EventBridge event bus', 'Event routing rules'], available: false },
  { title: 'Idempotency & Exactly-Once', route: '/messaging', badge: 'Reliability', description: 'Design idempotent consumers to handle duplicate messages and achieve exactly-once processing.', keyPoints: ['At-least-once is the default', 'Idempotency key in message', 'Deduplication table pattern', 'Kafka transactional API', 'Consumer idempotency checks'], available: false },
  { title: 'Message Ordering & Sequencing', route: '/messaging', badge: 'Reliability', description: 'Ensure ordered processing with partition keys, FIFO queues, and sequence number tracking.', keyPoints: ['Kafka: ordered per partition', 'SQS FIFO: group IDs', 'RabbitMQ single consumer', 'Out-of-order handling', 'Sequence number gaps'], available: false },
  { title: 'Backpressure & Flow Control', route: '/messaging', badge: 'Reliability', description: 'Handle slow consumers and overload — prefetch limits, consumer throttling, and circuit breakers.', keyPoints: ['Prefetch count in RabbitMQ', 'Consumer max poll records', 'Circuit breaker on failure', 'Throttle with token bucket', 'Dead-letter on repeated failure'], available: false },
  { title: 'Monitoring Messaging Systems', route: '/messaging', badge: 'Reference', description: 'Track consumer lag, queue depth, throughput, and error rates — dashboards and alerting.', keyPoints: ['Kafka consumer group lag', 'RabbitMQ management plugin', 'CloudWatch metrics for SQS/SNS', 'Alert on DLQ message count', 'Tracing with OpenTelemetry'], available: false },
  { title: 'Messaging Security', route: '/messaging', badge: 'Reference', description: 'TLS for in-transit, SASL/RBAC for auth, and message-level encryption.', keyPoints: ['TLS/mTLS for transport', 'Kafka SASL_SSL', 'RabbitMQ TLS and vhosts', 'IAM policies for SQS/SNS', 'Message payload encryption'], available: false },
];

@Component({ selector: 'app-messaging-home', standalone: true, imports: [RouterLink], templateUrl: './home.html', styleUrl: './home.scss' })
export class MessagingHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
