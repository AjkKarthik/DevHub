import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';

@Component({
  selector: 'app-messaging-security',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, QuizBlockComponent, QnaBlockComponent],
  templateUrl: './messaging-security.html',
  styleUrl: './messaging-security.scss'
})
export class MessagingSecurity {
  readonly quickRef: QuickRefItem[] = [
    { name: 'TLS/SSL', type: 'keyword', desc: 'Encrypts data in transit between clients and broker' },
    { name: 'SASL', type: 'keyword', desc: 'Authentication framework; mechanisms: PLAIN, SCRAM, GSSAPI (Kerberos), OAUTHBEARER' },
    { name: 'ACL', type: 'keyword', desc: 'Access Control List; grants/denies produce/consume per topic per principal' },
    { name: 'mTLS', type: 'keyword', desc: 'Mutual TLS: both client and server verify each other\'s certificates' },
    { name: 'RBAC', type: 'keyword', desc: 'Role-Based Access Control; Confluent/MSK feature for topic/cluster permissions' },
    { name: 'Encryption at rest', type: 'keyword', desc: 'Broker disk encryption; protects stored messages from physical access' },
    { name: 'Audit log', type: 'keyword', desc: 'Record of who produced/consumed/admin-accessed which resources and when' },
    { name: 'Message-level encryption', type: 'keyword', desc: 'Encrypt payload before publishing; broker never sees plaintext' },
  ];

  readonly theory: TheoryPoint[] = [
    {
      heading: 'Authentication: Verifying Identity',
      points: [
        'SASL/PLAIN: username + password over TLS. Simple but credentials in config — avoid in production without secret management.',
        'SASL/SCRAM-SHA-256/512: hashed credentials stored in ZooKeeper/KRaft. Safer than PLAIN; credentials not in plaintext on wire.',
        'SASL/OAUTHBEARER: integrates with external OAuth2/OIDC provider (Okta, Azure AD). Best for enterprise SSO.',
        'mTLS (mutual TLS): client certificates authenticate both parties. Strongest authentication; used in zero-trust networks.',
      ]
    },
    {
      heading: 'Authorization: Access Control',
      points: [
        'Kafka ACLs: grant/deny specific operations (Read, Write, Create, Delete, Describe) per topic per principal.',
        'Confluent RBAC / MSK IAM: role-based permissions assigned to groups, easier to manage than per-topic ACLs.',
        'RabbitMQ: virtual hosts provide isolation; users have configure, write, read permissions per vhost and resource.',
        'Principle of least privilege: producers get Write on their topic only; consumers get Read; admins are separate principals.',
      ]
    },
    {
      heading: 'Encryption and Data Protection',
      points: [
        'TLS in transit: mandatory in production. Use TLS 1.2+ with strong cipher suites.',
        'Encryption at rest: enable broker-level disk encryption (AWS KMS on MSK, Azure managed disks).',
        'Message-level encryption: encrypt the payload before publishing using AES-256-GCM. Broker never sees plaintext — useful for PII and regulated data.',
        'Audit logging: log every produce, consume, and admin API call with principal, IP, and timestamp for compliance.',
      ]
    },
    {
      heading: 'Encryption in Transit and at Rest for Message Brokers',
      points: [
        'TLS encryption in transit protects messages from interception as they travel between producers, brokers, and consumers — many managed messaging services enable TLS by default, but self-hosted brokers often require explicit configuration to enforce it.',
        'Encryption at rest protects stored message data (broker disk, retained logs) from unauthorized access if the underlying storage is compromised — particularly important for brokers retaining messages for extended periods, like Kafka\'s default retention.',
        'Field-level (payload) encryption, where sensitive fields within a message are encrypted by the producer before sending, protects against exposure even to the broker operator itself — a stronger guarantee than transport/storage encryption alone for highly sensitive data.',
        'Key management for message encryption must account for key rotation — messages encrypted with an old key must remain decryptable by consumers even after keys rotate, requiring either key versioning or a transition period supporting both old and new keys.',
      ],
    },
    {
      heading: 'Authentication and Authorization for Message Brokers',
      points: [
        'SASL and mTLS (mutual TLS) are the common authentication mechanisms for verifying a producer or consumer\'s identity before allowing it to connect to a broker — an unauthenticated broker connection is a significant security gap in any production messaging system.',
        'ACLs (access control lists) restrict WHICH topics/queues a given authenticated identity can produce to or consume from — without them, any authenticated client could read or write to any topic, violating the principle of least privilege.',
        'Service-to-service messaging in a microservices architecture still needs per-service authorization, not just perimeter network security — a compromised service should not automatically gain access to every topic simply because it is inside the network perimeter.',
        'Audit logging of who accessed which topics and when is essential for detecting unauthorized access after the fact, particularly in regulated industries where message content may include sensitive personal or financial data.',
      ],
    },
  ];

  readonly codeTabs: CodeTab[] = [
    {
      label: 'Kafka TLS + SASL/SCRAM',
      language: 'typescript',
      code: `import { Kafka } from 'kafkajs';
import fs from 'fs';

const kafka = new Kafka({
  clientId: 'secure-producer',
  brokers:  ['kafka-broker:9093'],  // TLS port

  ssl: {
    rejectUnauthorized: true,
    ca:   [fs.readFileSync('/certs/ca.crt')],
    cert: fs.readFileSync('/certs/client.crt'),   // for mTLS
    key:  fs.readFileSync('/certs/client.key'),   // for mTLS
  },

  sasl: {
    mechanism: 'scram-sha-256',
    username:  process.env.KAFKA_USERNAME!,
    password:  process.env.KAFKA_PASSWORD!,
  },
});

// ACL setup (run as admin principal):
// kafka-acls.sh --bootstrap-server localhost:9093 \\
//   --add --allow-principal User:order-producer \\
//   --operation Write --topic orders

const producer = kafka.producer();
await producer.connect();
await producer.send({
  topic: 'orders',
  messages: [{ value: JSON.stringify({ orderId: 'ORD-001' }) }],
  acks: -1,
});
await producer.disconnect();
console.log('Secure message sent');`,
    },
    {
      label: 'Message-Level Encryption (AES-GCM)',
      language: 'typescript',
      code: `import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Kafka } from 'kafkajs';

const ALGORITHM  = 'aes-256-gcm';
const SECRET_KEY = Buffer.from(process.env.MSG_ENCRYPT_KEY!, 'hex'); // 32 bytes

function encrypt(plaintext: string): Buffer {
  const iv         = randomBytes(12);            // 96-bit IV for GCM
  const cipher     = createCipheriv(ALGORITHM, SECRET_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag        = cipher.getAuthTag();        // 16-byte authentication tag
  // Layout: [IV (12)] [TAG (16)] [ciphertext]
  return Buffer.concat([iv, tag, ciphertext]);
}

function decrypt(data: Buffer): string {
  const iv         = data.subarray(0, 12);
  const tag        = data.subarray(12, 28);
  const ciphertext = data.subarray(28);
  const decipher   = createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}

// Producer encrypts before publishing
const kafka    = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();
await producer.connect();

const payload = JSON.stringify({ userId: 'u123', ssn: '123-45-6789' }); // PII
const encrypted = encrypt(payload);

await producer.send({
  topic: 'pii-events',
  messages: [{ value: encrypted }],   // broker never sees plaintext
  acks: -1,
});
await producer.disconnect();

// Consumer decrypts after consuming
const consumer = kafka.consumer({ groupId: 'pii-processor' });
await consumer.connect();
await consumer.subscribe({ topic: 'pii-events' });
await consumer.run({
  eachMessage: async ({ message }) => {
    const plaintext = decrypt(message.value!);
    const data      = JSON.parse(plaintext);
    console.log('Decrypted PII:', data.userId); // SSN stays in memory only
  },
});`,
    },
    {
      label: 'RabbitMQ TLS + Vhost ACL',
      language: 'typescript',
      code: `import amqplib from 'amqplib';
import fs from 'fs';

// Connect with TLS and vhost isolation
const connection = await amqplib.connect({
  hostname: 'rabbit-host',
  port:     5671,     // AMQPS port
  vhost:    'production',          // vhost isolation
  username: process.env.RABBIT_USER!,
  password: process.env.RABBIT_PASS!,
  tls: {
    cert:               fs.readFileSync('/certs/client.crt'),
    key:                fs.readFileSync('/certs/client.key'),
    ca:                 [fs.readFileSync('/certs/ca.crt')],
    rejectUnauthorized: true,
  },
});

const channel = await connection.createChannel();

// RabbitMQ ACL commands (run as admin):
// rabbitmqctl add_user order-producer <password>
// rabbitmqctl set_permissions -p production order-producer "" "^orders\\..*" ""
// ↑ configure="", write="orders.*", read="" — producer only

// rabbitmqctl add_user order-consumer <password>
// rabbitmqctl set_permissions -p production order-consumer "" "" "^orders\\..*"
// ↑ configure="", write="", read="orders.*" — consumer only

await channel.assertQueue('orders.placed', { durable: true });
channel.sendToQueue('orders.placed',
  Buffer.from(JSON.stringify({ orderId: 'ORD-001' })),
  { persistent: true }
);
console.log('Secure message published to RabbitMQ');`,
    },
  ];

  readonly quiz: QuizQuestion[] = [
    { q: 'Which Kafka authentication mechanism integrates with enterprise SSO (Okta, Azure AD)?', options: ['SASL/PLAIN', 'SASL/SCRAM', 'SASL/OAUTHBEARER', 'mTLS'], answer: 2, explanation: 'SASL/OAUTHBEARER accepts OAuth2 bearer tokens from external IdPs, enabling integration with enterprise SSO providers.' },
    { q: 'What is the advantage of message-level encryption over TLS?', options: ['Faster throughput', 'Broker never sees plaintext; protects against broker compromise', 'Simpler key management', 'Lower CPU usage'], answer: 1, explanation: 'TLS encrypts data in transit but the broker decrypts it. Message-level encryption means the broker stores and forwards ciphertext — broker admins cannot read the payload.' },
    { q: 'What does the principle of least privilege mean for Kafka producers?', options: ['Producers have admin access', 'Producers have Write ACL on their specific topic only', 'Producers can read all topics', 'Producers share credentials with consumers'], answer: 1, explanation: 'Least privilege: grant only what is needed. A producer needs Write on its own topic. Giving it Read or admin access is unnecessary exposure.' },
    { q: 'What does RabbitMQ vhost isolation provide?', options: ['TLS encryption', 'Logical separation of resources; users in one vhost cannot access another', 'Message deduplication', 'Automatic failover'], answer: 1, explanation: 'Virtual hosts are isolated namespaces — queues, exchanges, and bindings in one vhost are invisible to users in another, enabling multi-tenancy.' },
    { q: 'Why should mutual TLS (mTLS) be preferred over one-way TLS for broker-to-client authentication?', options: ['mTLS is faster than one-way TLS', 'mTLS requires the client to present a certificate too, so the broker authenticates the client identity, not just encrypting transport', 'mTLS removes the need for ACLs entirely', 'mTLS only works with Kafka, not RabbitMQ or Service Bus'], answer: 1, explanation: 'One-way TLS only lets the client verify the broker. mTLS additionally has the client present its own certificate so the broker can cryptographically verify which client is connecting — replacing or strengthening username/password auth.' },
    { q: 'What risk does granting a consumer wildcard topic ACLs (e.g., orders.*) introduce?', options: ['No risk — wildcards are always scoped safely', 'The consumer gains read access to any current or future topic matching the pattern, including ones added later without review', 'Wildcard ACLs are rejected by all brokers', 'Wildcard ACLs only apply to producers, not consumers'], answer: 1, explanation: 'A wildcard ACL silently grants access to future topics matching the pattern. A new sensitive topic named orders.payroll would be readable by that consumer without anyone explicitly granting it — violating least privilege.' },
  ];

  readonly qna: QnaItem[] = [
    { q: 'Should I rotate Kafka SSL certificates, and how often?', a: 'Yes. Rotate CA and client certificates before expiry (typically annually or per your security policy). Use short-lived certificates (e.g., 90 days) with automated rotation via cert-manager or Vault PKI. Kafka supports online certificate rotation without downtime using the ssl.client.auth=requested setting.' },
    { q: 'How do I manage Kafka credentials securely in Kubernetes?', a: 'Use Kubernetes Secrets (base64-encoded, not plain text) mounted as environment variables or files. Better: use an external secrets manager (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault) with a Kubernetes Secrets Store CSI driver — credentials never land in etcd.' },
    { q: 'What is the difference between ACLs and RBAC in Kafka?', a: 'ACLs are low-level (per principal, per topic, per operation) and require Zookeeper/KRaft storage. RBAC (Confluent Platform, MSK IAM) assigns roles to groups and is easier to manage at scale. MSK IAM uses AWS IAM policies directly, eliminating separate credential management for AWS-based deployments.' },
    { q: 'Should message payloads be encrypted even when the transport is already TLS-encrypted?', a: 'Yes, for sensitive data. TLS only protects data in transit between client and broker — the broker itself, its disk, and its operators can see plaintext. Message-level (end-to-end) encryption, where the producer encrypts the payload and only authorized consumers hold the decryption key, protects against a compromised or curious broker and satisfies stricter compliance requirements (PCI-DSS, HIPAA).' },
    { q: 'How do you prevent a compromised producer credential from causing widespread damage?', a: 'Apply least privilege ACLs scoped to exactly the topics/queues that producer needs to write to — never grant cluster-wide or wildcard access. Use short-lived credentials or certificates with automated rotation so a leaked credential has a small window of exposure. Monitor for anomalous publish patterns (volume spikes, new topics) and have a fast credential-revocation runbook ready.' },
    { q: 'What is the security risk of disabling broker authentication for "internal-only" messaging traffic?', a: 'Internal network boundaries are not a substitute for authentication — lateral movement from any compromised internal host (a misconfigured service, a compromised container) gives an attacker unrestricted broker access. Defense-in-depth requires authenticating and authorizing every connection, internal or external, since perimeter security alone is an increasingly weak assumption in containerized and cloud environments.' },
  ];
}
