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
  selector: 'app-kafka-connect',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './kafka-connect.html',
  styleUrl: './kafka-connect.scss'
})
export class KafkaConnect {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Source Connector', type: 'keyword', desc: 'Pulls data from external system into Kafka topic' },
    { name: 'Sink Connector', type: 'keyword', desc: 'Pushes data from Kafka topic into external system' },
    { name: 'Worker', type: 'keyword', desc: 'JVM process running connector instances; distributed or standalone' },
    { name: 'Task', type: 'keyword', desc: 'Unit of parallelism within a connector; each worker runs tasks' },
    { name: 'Offset Storage', type: 'keyword', desc: 'Kafka topic storing connector offsets (position in source data)' },
    { name: 'SMT', type: 'keyword', desc: 'Single Message Transform — lightweight record transformation in pipeline' },
    { name: 'Debezium', type: 'keyword', desc: 'CDC connector that reads database transaction logs as Kafka events' },
    { name: 'CDC', type: 'keyword', desc: 'Change Data Capture — stream DB changes (insert/update/delete) to Kafka' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Kafka Connect: No-Code Data Integration',
      points: [
        'Kafka Connect is a framework for streaming data between Kafka and external systems without writing producer/consumer code.',
        'Source connectors ingest data from databases, files, APIs, and cloud services into Kafka topics.',
        'Sink connectors write Kafka topic data to databases, search engines, data warehouses, and object storage.',
        'Connector plugins are JARs; hundreds of pre-built connectors exist in Confluent Hub.',
      ]
    },
    {
      heading: 'CDC with Debezium',
      points: [
        'Debezium reads the database transaction log (WAL for Postgres, binlog for MySQL) and emits every row change as a Kafka event.',
        'CDC events include the before and after state, the operation type (insert/update/delete), and metadata.',
        'This enables real-time data synchronisation between services without polling or dual-writes.',
        'Debezium is the most popular Kafka Connect source connector and supports PostgreSQL, MySQL, MongoDB, SQL Server, and more.',
      ]
    },
    {
      heading: 'Single Message Transforms (SMTs)',
      points: [
        'SMTs are lightweight transformations applied to records as they pass through a connector, before reaching the topic or sink.',
        'Common SMTs: ReplaceField (rename/mask columns), InsertField (add metadata), TimestampConverter (normalise dates), Router (change destination topic).',
        'SMTs are stateless — for complex transformations, use Kafka Streams or ksqlDB downstream.',
        'Chain multiple SMTs in order; they are applied sequentially to each record.',
      ]
    },
    {
      heading: 'Source Connectors vs. Sink Connectors',
      points: [
        'Source connectors pull data FROM an external system (a database, a file, a SaaS API) INTO Kafka topics, converting the external system\'s data model into Kafka records — commonly used for CDC (change data capture) from a relational database.',
        'Sink connectors push data FROM Kafka topics INTO an external system (a data warehouse, a search index, a file store), letting downstream systems consume Kafka data without each needing custom Kafka consumer code.',
        'Kafka Connect\'s distributed mode runs connectors across a cluster of worker nodes with automatic task rebalancing, providing fault tolerance and horizontal scalability that a hand-rolled point-to-point integration script would not have.',
        'Using pre-built, well-tested connectors (from Confluent Hub or similar) for common integrations (Debezium for CDC, JDBC sink for databases) avoids reinventing integration logic that has already been solved and hardened by the broader ecosystem.',
      ],
    },
    {
      heading: 'Exactly-Once Semantics in Kafka Connect',
      points: [
        'Achieving exactly-once delivery through a connector requires both the connector\'s offset-tracking mechanism and the target system\'s write semantics to cooperate — a sink connector writing to a system without idempotent or transactional writes cannot guarantee exactly-once end-to-end regardless of Kafka\'s own guarantees.',
        'Source connectors achieving exactly-once typically rely on the source system providing a reliable position/offset mechanism (a database\'s transaction log position) that can be atomically committed alongside the produced Kafka records.',
        'Kafka Connect\'s framework-level exactly-once support (available for source connectors since Kafka 3.3) still depends on individual connector implementations correctly participating in the transactional protocol — not every connector automatically gains this guarantee.',
        'For sink connectors, idempotent writes at the target system (upserts keyed by a unique field, rather than blind appends) are often a more practical path to effectively-once processing than relying purely on Kafka-side delivery guarantees.',
      ],
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Debezium Postgres Source (REST)',
      language: 'typescript',
      code: `// Deploy a Debezium PostgreSQL CDC source connector via Kafka Connect REST API

const connectorConfig = {
  name: 'postgres-cdc',
  config: {
    'connector.class':              'io.debezium.connector.postgresql.PostgresConnector',
    'plugin.name':                  'pgoutput',
    'database.hostname':            'postgres',
    'database.port':                '5432',
    'database.user':                'debezium',
    'database.password':            'debezium',
    'database.dbname':              'shop',
    'database.server.name':         'shop',
    'table.include.list':           'public.orders,public.users',
    'topic.prefix':                 'shop',
    // SMT: mask sensitive columns
    'transforms':                        'maskSensitive',
    'transforms.maskSensitive.type':     'org.apache.kafka.connect.transforms.ReplaceField\$Value',
    'transforms.maskSensitive.blacklist':'credit_card_number',
  },
};

const response = await fetch('http://connect:8083/connectors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(connectorConfig),
});

const result = await response.json();
console.log('Connector created:', result.name);
// Events flow to topics: shop.public.orders, shop.public.users`,
    },
    {
      label: 'Elasticsearch Sink (REST)',
      language: 'typescript',
      code: `// Deploy an Elasticsearch sink connector

const sinkConfig = {
  name: 'elasticsearch-sink',
  config: {
    'connector.class':         'io.confluent.connect.elasticsearch.ElasticsearchSinkConnector',
    'tasks.max':               '2',
    'topics':                  'shop.public.orders',
    'connection.url':          'http://elasticsearch:9200',
    'type.name':               '_doc',
    'key.ignore':              'false',
    'schema.ignore':           'true',
    // SMT: flatten Debezium envelope to get just the "after" state
    'transforms':              'unwrap',
    'transforms.unwrap.type':  'io.debezium.transforms.ExtractNewRecordState',
    'transforms.unwrap.drop.tombstones': 'false',
    // Delete Elasticsearch doc when Kafka message is a tombstone (delete event)
    'behavior.on.null.values': 'delete',
  },
};

const response = await fetch('http://connect:8083/connectors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(sinkConfig),
});

console.log('Sink connector:', await response.json());`,
    },
    {
      label: 'Connector Status & Management',
      language: 'typescript',
      code: `const BASE = 'http://connect:8083';

// List all connectors
const connectors = await fetch(\`\${BASE}/connectors\`).then(r => r.json());
console.log('Connectors:', connectors);

// Get connector status
const status = await fetch(\`\${BASE}/connectors/postgres-cdc/status\`).then(r => r.json());
console.log('State:', status.connector.state);     // RUNNING, PAUSED, FAILED
for (const task of status.tasks) {
  console.log(\`Task \${task.id}: \${task.state}\`, task.trace ?? '');
}

// Restart a failed connector
await fetch(\`\${BASE}/connectors/postgres-cdc/restart\`, { method: 'POST' });

// Pause (stops task processing without losing state)
await fetch(\`\${BASE}/connectors/postgres-cdc/pause\`, { method: 'PUT' });

// Resume
await fetch(\`\${BASE}/connectors/postgres-cdc/resume\`, { method: 'PUT' });

// Delete (removes connector, NOT the topics or data)
await fetch(\`\${BASE}/connectors/postgres-cdc\`, { method: 'DELETE' });`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Running Kafka Connect in standalone mode in production',
      wrong: `# Standalone mode: no fault tolerance, no distributed task assignment
connect-standalone.sh connect-standalone.properties connector.properties`,
      right: `# Distributed mode: HA, auto task redistribution on worker failure
connect-distributed.sh connect-distributed.properties
# Then deploy connector via REST API`,
      explanation: 'Standalone mode is for development and testing. Distributed mode is required in production for fault tolerance and horizontal scaling.'
    },
    {
      title: 'Not enabling WAL replication slots for Debezium Postgres',
      wrong: `-- Default Postgres config
-- wal_level = minimal → Debezium cannot read the WAL`,
      right: `-- postgresql.conf
wal_level = logical
-- Create replication slot for Debezium
SELECT pg_create_logical_replication_slot('debezium', 'pgoutput');`,
      explanation: 'Debezium requires wal_level=logical to read the WAL. Without it, the connector fails to capture change events.'
    },
    {
      title: 'Using stateful SMTs instead of Kafka Streams',
      wrong: `// SMTs are stateless — attempting stateful join in SMT is wrong
// Cannot join with another topic or maintain aggregation state`,
      right: `// Use SMTs for simple, stateless transforms (field rename, routing)
// Use Kafka Streams or ksqlDB for stateful transforms (joins, aggregations)`,
      explanation: 'SMTs are intentionally stateless for performance. Complex transforms (enrichment from another table, aggregation) must be done downstream with Kafka Streams.'
    },
    {
      title: 'Forgetting the Debezium envelope when writing sink connectors',
      wrong: `// Topic value is a Debezium envelope: { before, after, op, ts_ms }
// Elasticsearch sink writing the entire envelope — wrong schema in ES`,
      right: `// Add ExtractNewRecordState SMT to unwrap 'after' payload
'transforms':             'unwrap',
'transforms.unwrap.type': 'io.debezium.transforms.ExtractNewRecordState'`,
      explanation: 'Debezium wraps events in an envelope. Sink connectors usually want just the payload — use ExtractNewRecordState SMT to unwrap it.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Connect Connector Health Monitor',
    language: 'typescript',
    description: 'Write a TypeScript function that polls the Kafka Connect REST API every 30 seconds, checks all connectors for FAILED state (connector or any task), and logs an alert with the connector name and error trace.',
    hints: [
      'GET /connectors lists all connector names',
      'GET /connectors/{name}/status returns state and task states',
      'task.trace contains the Java stack trace on failure',
    ],
    starterCode: `async function monitorConnectors(connectUrl: string) {
  // TODO: poll every 30s, alert on FAILED connectors/tasks
}

monitorConnectors('http://connect:8083');`,
    solution: `async function monitorConnectors(connectUrl: string) {
  async function check() {
    const names: string[] = await fetch(\`\${connectUrl}/connectors\`).then(r => r.json());
    for (const name of names) {
      const status = await fetch(\`\${connectUrl}/connectors/\${name}/status\`).then(r => r.json());
      if (status.connector.state === 'FAILED') {
        console.error(\`[ALERT] Connector \${name} FAILED\`);
      }
      for (const task of status.tasks) {
        if (task.state === 'FAILED') {
          console.error(\`[ALERT] Connector \${name} task \${task.id} FAILED:\`, task.trace?.split('\\n')[0]);
        }
      }
    }
  }

  await check();
  setInterval(check, 30_000);
}

monitorConnectors('http://connect:8083');`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'What is the difference between a source and a sink connector?', options: ['Source writes to Kafka; sink reads from Kafka', 'Source reads from external system into Kafka; sink writes from Kafka to external system', 'Both read from Kafka', 'Both write to Kafka'], answer: 1, explanation: 'Source connectors pull data into Kafka; sink connectors push Kafka data out to external systems.' },
    { q: 'What does Debezium capture from a relational database?', options: ['Aggregated reports', 'Schema changes only', 'Every row-level change from the transaction log', 'Read queries'], answer: 2, explanation: 'Debezium reads the WAL/binlog and captures every insert, update, and delete as a Kafka event.' },
    { q: 'When should you use an SMT instead of Kafka Streams?', options: ['Stateful joins', 'Windowed aggregations', 'Simple stateless field rename or masking', 'Cross-topic enrichment'], answer: 2, explanation: 'SMTs are for stateless per-record transforms in the connector pipeline. Complex logic belongs in Kafka Streams.' },
    { q: 'Which Connect mode should be used in production?', options: ['Standalone', 'Distributed', 'Embedded', 'REST-only'], answer: 1, explanation: 'Distributed mode provides fault tolerance and horizontal scalability; standalone is for local development only.' },
    { q: 'What is a Kafka Connect "task", and how does it relate to a connector?', options: ['A task and a connector are the same thing', 'A connector defines the overall configuration; it splits the actual work into one or more parallel tasks that each handle a subset of the data (e.g. one task per database table, or a partition range for a topic)', 'Tasks only exist for sink connectors, never source connectors', 'A task is a scheduled cron job for running the connector'], answer: 1, explanation: 'A connector is the logical configuration (which system to connect to, credentials, transforms). At runtime, Connect splits the connector\'s workload into tasks — the unit that actually gets distributed across worker processes in distributed mode. A JDBC source connector reading 10 tables might create 10 tasks, one per table, allowing them to run in parallel across different workers for higher throughput.' },
    { q: 'What is Kafka Connect distributed mode?', options: ['Running one connector per broker', 'A cluster of Connect workers load-balancing connector tasks for fault tolerance and scalability', 'A mode for cloud-only deployments', 'A mode that disables offset tracking'], answer: 1, explanation: 'Distributed mode runs multiple Connect workers as a cluster. Tasks are distributed across workers, providing fault tolerance (task restart on worker failure) and horizontal scaling without restarts.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'Where does Kafka Connect store connector offsets?', a: 'In a Kafka topic (default: connect-offsets) in distributed mode. This is how connectors resume from where they left off after a restart without duplicating or missing records.' },
    { q: 'What is the ExtractNewRecordState SMT?', a: 'A Debezium-provided SMT that unwraps the Debezium envelope and returns just the after (new) state of the row. It also handles tombstones for delete propagation to sinks.' },
    { q: 'Can Kafka Connect handle schema evolution?', a: 'Yes, with Schema Registry and Avro/Protobuf serialization. When a schema changes, Kafka Connect checks compatibility (backward, forward, or full) and rejects incompatible changes, protecting downstream consumers.' },
    { q: 'What happens to a Kafka Connect sink connector if it receives a record with a schema that violates the registry\'s compatibility mode?', a: 'The sink connector\'s task fails and stops processing — Schema Registry rejects the incompatible schema registration attempt at the producer/source side, but if an incompatible schema somehow reaches a topic (e.g. compatibility checking was disabled or bypassed), the sink task consuming it throws a serialization/deserialization exception and dies rather than silently corrupting the downstream system. Operators typically monitor Connect task status (RUNNING vs FAILED) and configure errors.tolerance to control whether such records are skipped and logged (errors.tolerance=all) or halt the connector entirely (errors.tolerance=none, the default).' },
    { q: 'What are Single Message Transforms (SMTs) in Kafka Connect?', a: 'SMTs are lightweight transformations applied to messages in the Connect pipeline (source or sink). Examples: ReplaceField (rename/drop fields), ExtractField (promote a field), InsertField (add static value), MaskField (obfuscate PII), TimestampConverter (convert date formats). SMTs avoid needing a separate stream processor for simple transformations.' },
    { q: 'What happens to in-flight offset tracking if a Kafka Connect worker crashes mid-task in distributed mode?', a: 'Because offsets are committed to the shared connect-offsets Kafka topic (not stored locally on the worker), a crashed worker\'s tasks are simply reassigned to a surviving worker in the cluster, which reads the last committed offset from that shared topic and resumes from there — no offset data is lost with the crashed process, since the offset state was never tied to that specific worker\'s local disk. This is why distributed mode\'s fault tolerance depends on the offsets topic itself being properly replicated (a common misconfiguration is leaving connect-offsets at replication factor 1 in production).' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'Kafka Connect: source connectors ingest data, sink connectors export it — no producer/consumer code needed.',
    mustKnow: [
      'Source: external → Kafka; Sink: Kafka → external; both configured via JSON over REST',
      'Debezium reads WAL/binlog for CDC; requires wal_level=logical on Postgres',
      'SMTs are stateless per-record transforms; use Kafka Streams for stateful logic',
      'Distributed mode for production (fault tolerance); standalone for development',
      'Connector offsets stored in a Kafka topic (connect-offsets)',
      'ExtractNewRecordState SMT unwraps Debezium envelope for sink connectors',
    ],
    interviewFocus: [
      'CDC vs polling: why Debezium WAL approach is superior to SELECT polling',
      'Source vs sink; naming real connectors (Debezium, JDBC, Elasticsearch, S3)',
      'SMTs: use cases and stateless constraint',
      'Distributed vs standalone: production implications',
    ],
  };
}
