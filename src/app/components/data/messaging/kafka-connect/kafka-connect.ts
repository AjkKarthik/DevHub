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
  ];

  readonly qna: QnaItem[] = [
    { q: 'Where does Kafka Connect store connector offsets?', a: 'In a Kafka topic (default: connect-offsets) in distributed mode. This is how connectors resume from where they left off after a restart without duplicating or missing records.' },
    { q: 'What is the ExtractNewRecordState SMT?', a: 'A Debezium-provided SMT that unwraps the Debezium envelope and returns just the after (new) state of the row. It also handles tombstones for delete propagation to sinks.' },
    { q: 'Can Kafka Connect handle schema evolution?', a: 'Yes, with Schema Registry and Avro/Protobuf serialization. When a schema changes, Kafka Connect checks compatibility (backward, forward, or full) and rejects incompatible changes, protecting downstream consumers.' },
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
