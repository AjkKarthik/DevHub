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
  selector: 'app-schema-registry',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './schema-registry.html',
  styleUrl: './schema-registry.scss'
})
export class SchemaRegistry {
  readonly quickRef: QuickRefItem[] = [
    { name: 'Avro', type: 'keyword', desc: 'Compact binary format with schema; default choice for Schema Registry' },
    { name: 'Protobuf', type: 'keyword', desc: 'Google Protocol Buffers; language-neutral, efficient binary encoding' },
    { name: 'JSON Schema', type: 'keyword', desc: 'Schema validation for JSON messages; readable but verbose' },
    { name: 'Subject', type: 'keyword', desc: 'Named slot in Schema Registry; <topic>-key or <topic>-value' },
    { name: 'Backward compat', type: 'keyword', desc: 'New schema can read old data; safe to upgrade consumers first' },
    { name: 'Forward compat', type: 'keyword', desc: 'Old schema can read new data; safe to upgrade producers first' },
    { name: 'Full compat', type: 'keyword', desc: 'Both backward AND forward compatible; strictest constraint' },
    { name: 'Magic byte', type: 'keyword', desc: 'Prefix byte (0x00) + 4-byte schema ID in every Avro message' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Why Schema Registry?',
      points: [
        'Kafka topics are schema-less by default — producers and consumers must agree on message format out-of-band.',
        'Schema Registry centralises schema storage and enforces compatibility rules between schema versions.',
        'Producers register a schema and receive a schema ID. They prefix every message with the ID (magic byte + 4 bytes).',
        'Consumers read the ID prefix, fetch the schema from the registry, and deserialise. Old consumers can still read new messages if schemas are compatible.',
      ]
    },
    {
      heading: 'Compatibility Modes',
      points: [
        'BACKWARD: consumers using new schema can read messages written with old schema. New fields must have defaults.',
        'FORWARD: consumers using old schema can read messages written with new schema. Old fields must not be removed.',
        'FULL: both backward and forward — the safest mode but most restrictive. Required in regulated environments.',
        'NONE: no compatibility checking — useful during development, dangerous in production.',
      ]
    },
    {
      heading: 'Schema Evolution Best Practices',
      points: [
        'Always provide default values for new optional fields — this is required for backward compatibility in Avro.',
        'Never rename or remove a field that existing consumers depend on without a migration plan.',
        'Use field aliases (Avro) or reserved field numbers (Protobuf) when retiring old fields.',
        'Prefer adding new optional fields over breaking changes; version the subject name if a breaking change is unavoidable.',
      ]
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Register Schema (REST)',
      language: 'typescript',
      code: `// Register an Avro schema for the 'orders-value' subject

const schema = JSON.stringify({
  type: 'record',
  name: 'Order',
  namespace: 'com.example',
  fields: [
    { name: 'orderId', type: 'string' },
    { name: 'userId',  type: 'string' },
    { name: 'total',   type: 'double' },
    { name: 'status',  type: 'string', default: 'pending' },
  ],
});

const response = await fetch(
  'http://schema-registry:8081/subjects/orders-value/versions',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/vnd.schemaregistry.v1+json' },
    body: JSON.stringify({ schema }),
  }
);

const { id } = await response.json();
console.log('Registered schema ID:', id);  // e.g., 1

// Check compatibility before registering a new version
const compatResult = await fetch(
  'http://schema-registry:8081/compatibility/subjects/orders-value/versions/latest',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/vnd.schemaregistry.v1+json' },
    body: JSON.stringify({ schema: newSchema }),
  }
).then(r => r.json());

console.log('Compatible:', compatResult.is_compatible);`,
    },
    {
      label: 'Avro Produce & Consume (Node.js)',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';
import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';

const kafka    = new Kafka({ brokers: ['localhost:9092'] });
const registry = new SchemaRegistry({ host: 'http://localhost:8081' });

// --- Producer ---
async function produce() {
  const producer = kafka.producer();
  await producer.connect();

  // Encode using the registered schema
  const schemaId = 1;
  const encoded  = await registry.encode(schemaId, {
    orderId: 'ORD-001',
    userId:  'u123',
    total:   149.99,
    status:  'pending',
  });

  await producer.send({
    topic: 'orders',
    messages: [{ key: 'ORD-001', value: encoded }],
    acks: -1,
  });
  await producer.disconnect();
}

// --- Consumer ---
async function consume() {
  const consumer = kafka.consumer({ groupId: 'order-reader' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'orders' });

  await consumer.run({
    eachMessage: async ({ message }) => {
      // Decode: registry reads magic byte + schema ID, fetches schema, deserialises
      const order = await registry.decode(message.value!);
      console.log('Order:', order);
    },
  });
}`,
    },
    {
      label: 'Schema Evolution (Add Field)',
      language: 'typescript',
      code: `// v1 schema — original
const v1 = JSON.stringify({
  type: 'record', name: 'Order',
  fields: [
    { name: 'orderId', type: 'string' },
    { name: 'total',   type: 'double' },
  ],
});

// v2 schema — add optional 'currency' field with default
// BACKWARD compatible: v2 consumers can read v1 messages (currency defaults to 'USD')
const v2 = JSON.stringify({
  type: 'record', name: 'Order',
  fields: [
    { name: 'orderId',  type: 'string' },
    { name: 'total',    type: 'double' },
    { name: 'currency', type: 'string', default: 'USD' }, // ← new field, has default
  ],
});

// Register v2 — succeeds because BACKWARD compatible
const resp = await fetch(
  'http://schema-registry:8081/subjects/orders-value/versions',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/vnd.schemaregistry.v1+json' },
    body: JSON.stringify({ schema: v2 }),
  }
);
const { id } = await resp.json();
console.log('v2 schema ID:', id);`,
    },
  ];

  readonly mistakes: CommonMistake[] = [
    {
      title: 'Adding a new required field without a default (breaks backward compat)',
      wrong: `// v2: added 'currency' without default — NOT backward compatible
{
  "name": "currency",
  "type": "string"   // no default — old messages have no currency → deserialization fails
}`,
      right: `// v2: 'currency' with default — backward compatible
{
  "name": "currency",
  "type": "string",
  "default": "USD"   // old messages fall back to USD
}`,
      explanation: 'For BACKWARD compatibility, new fields must have defaults. Consumers using v2 schema reading v1 messages will use the default for missing fields.'
    },
    {
      title: 'Removing a field without checking forward compatibility',
      wrong: `// v2: removed 'legacyCode' field
// Old consumers reading v2 messages fail — field they expect is gone`,
      right: `// Mark as deprecated, keep with a default for a transition period
{ "name": "legacyCode", "type": ["null", "string"], "default": null }
// Remove only after all consumers are upgraded`,
      explanation: 'Removing a field breaks forward compatibility. Old consumers cannot read new messages that lack a field they depend on. Use a nullable type with default null during migration.'
    },
    {
      title: 'Using NONE compatibility in production',
      wrong: `// Schema Registry subject with compatibility=NONE
// Any schema change accepted — old consumers silently fail`,
      right: `// Set BACKWARD or FULL on all production subjects
curl -X PUT http://schema-registry:8081/config/orders-value \\
  -H 'Content-Type: application/vnd.schemaregistry.v1+json' \\
  -d '{"compatibility": "BACKWARD"}'`,
      explanation: 'NONE skips compatibility checks. A producer can push a breaking schema and crash all consumers silently. Always set explicit compatibility for production subjects.'
    },
    {
      title: 'Hardcoding schema IDs in producer code',
      wrong: `// Schema ID 42 hardcoded — breaks when schema is re-registered
const encoded = await registry.encode(42, payload);`,
      right: `// Look up the latest version by subject name
const { id } = await registry.getLatestSchemaId('orders-value');
const encoded = await registry.encode(id, payload);`,
      explanation: 'Schema IDs are assigned by the registry at registration time and vary between environments. Always resolve by subject name rather than hardcoding.'
    },
  ];

  readonly challenge: Challenge = {
    title: 'Schema Compatibility Checker',
    language: 'typescript',
    description: 'Write a TypeScript function that, given a topic name and a new Avro schema string, checks compatibility with the latest registered schema using the Schema Registry REST API. Return {compatible: boolean, message: string}.',
    hints: [
      'POST to /compatibility/subjects/{topic}-value/versions/latest',
      'Body: { schema: "<avro JSON string>" }',
      'Content-Type: application/vnd.schemaregistry.v1+json',
    ],
    starterCode: `async function checkCompatibility(
  registryUrl: string,
  topic: string,
  newSchema: string
): Promise<{ compatible: boolean; message: string }> {
  // TODO
}`,
    solution: `async function checkCompatibility(
  registryUrl: string,
  topic: string,
  newSchema: string
): Promise<{ compatible: boolean; message: string }> {
  const subject = \`\${topic}-value\`;
  const url     = \`\${registryUrl}/compatibility/subjects/\${subject}/versions/latest\`;

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/vnd.schemaregistry.v1+json' },
      body: JSON.stringify({ schema: newSchema }),
    });
  } catch (err: any) {
    return { compatible: false, message: \`Network error: \${err.message}\` };
  }

  if (resp.status === 404) {
    // No existing schema — first registration, always compatible
    return { compatible: true, message: 'No existing schema; first registration.' };
  }

  const data = await resp.json();
  if (data.error_code) {
    return { compatible: false, message: data.message };
  }

  return {
    compatible: data.is_compatible,
    message: data.is_compatible ? 'Schema is compatible.' : 'Schema is NOT compatible with latest version.',
  };
}`,
  };

  readonly quiz: QuizQuestion[] = [
    { q: 'What is the "magic byte" in a Kafka Avro message?', options: ['A checksum byte', 'A 0x00 byte prefix followed by a 4-byte schema ID', 'The Avro null type marker', 'A Kafka protocol version marker'], answer: 1, explanation: 'Every message serialized with the Confluent Avro serializer is prefixed with 0x00 + 4-byte schema ID so the consumer can look up the schema.' },
    { q: 'Which compatibility mode allows consumers using the new schema to read old messages?', options: ['FORWARD', 'BACKWARD', 'FULL', 'NONE'], answer: 1, explanation: 'BACKWARD compatibility means the new schema can deserialize messages written with the old schema — upgrade consumers first.' },
    { q: 'What must a new optional Avro field have for BACKWARD compatibility?', options: ['A unique field ID', 'A default value', 'A namespace prefix', 'An alias'], answer: 1, explanation: 'Without a default, consumers using the new schema cannot deserialize old messages that lack the field.' },
    { q: 'How should schema IDs be resolved in producer code?', options: ['Hardcoded per environment', 'Looked up by subject name from the registry', 'Passed as environment variables', 'Read from the Kafka topic header'], answer: 1, explanation: 'Schema IDs vary per environment and registration order. Always resolve by subject name (e.g., orders-value) to get the current latest ID.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'Can I use JSON Schema with Kafka instead of Avro?', a: 'Yes. Confluent Schema Registry supports JSON Schema and Protobuf in addition to Avro. JSON Schema is human-readable but verbose and slower. Avro is compact and best for high-throughput; Protobuf is compact and language-neutral with strong typing.' },
    { q: 'What happens if a consumer receives a message with an unknown schema ID?', a: 'The consumer fetches the schema from the registry using the ID embedded in the message. If the registry is unavailable or the ID is not found, deserialization fails. Schema Registry should be highly available in production (multi-instance deployment).' },
    { q: 'What is a "subject" in Schema Registry?', a: 'A subject is a named slot that stores schema versions. By default, Kafka uses <topic>-key and <topic>-value subjects. All versions of a schema for a topic are stored under the same subject, enabling compatibility checks between versions.' },
  ];

  readonly revision: RevisionSummary = {
    oneLiner: 'Schema Registry enforces schema contracts between producers and consumers; Avro + BACKWARD compat is the production standard.',
    mustKnow: [
      'Every Avro message prefixed with magic byte (0x00) + 4-byte schema ID',
      'BACKWARD: new schema reads old data (upgrade consumers first); FORWARD: old reads new (upgrade producers first)',
      'New optional fields MUST have defaults for BACKWARD compatibility',
      'Never hardcode schema IDs — resolve by subject name at runtime',
      'NONE compatibility mode is dangerous in production; set BACKWARD or FULL',
      'Subject names: <topic>-key and <topic>-value by convention',
    ],
    interviewFocus: [
      'Why Schema Registry matters: prevents schema mismatch crashes in production',
      'Compatibility modes: BACKWARD vs FORWARD vs FULL with upgrade order',
      'Avro schema evolution rules: add with default, do not remove without migration',
      'Magic byte protocol: how consumers auto-detect schema at runtime',
    ],
  };
}
