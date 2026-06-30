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
  selector: 'app-aws-dynamodb',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './dynamodb.html',
  styleUrl: './dynamodb.scss'
})
export class AwsDynamodb {

  quickRef: QuickRefItem[] = [
    { name: 'Partition Key', type: 'keyword', desc: 'Primary key attribute used to distribute items across partitions. High cardinality is essential for even distribution.' },
    { name: 'Sort Key', type: 'keyword', desc: 'Optional second key dimension — enables range queries (begins_with, between) within a partition.' },
    { name: 'GSI', type: 'class', desc: 'Global Secondary Index — alternate partition+sort key pair; its own provisioned throughput; can be added post-creation.' },
    { name: 'LSI', type: 'class', desc: 'Local Secondary Index — same partition key, alternate sort key; must be defined at table creation; shares table RCU/WCU.' },
    { name: 'DynamoDB Streams', type: 'class', desc: 'Ordered log of item-level changes (INSERT/MODIFY/REMOVE) — 24-hour retention, triggers Lambda for CDC patterns.' },
    { name: 'DAX', type: 'class', desc: 'DynamoDB Accelerator — in-memory write-through cache; microsecond latency for reads; API-compatible with DynamoDB SDK.' },
    { name: 'On-Demand Mode', type: 'keyword', desc: 'Pay per request (RRU/WRU) with automatic scaling — no capacity planning, higher per-unit cost than provisioned.' },
    { name: 'Condition Expression', type: 'keyword', desc: 'Optimistic locking: PutItem/UpdateItem fail unless the condition is met — prevents lost updates in concurrent writes.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Data Modelling — Keys & Partitions',
      points: [
        'DynamoDB stores items in partitions based on the partition key hash. A hot partition (most traffic on one PK value) is the most common scaling problem — choose high-cardinality partition keys.',
        'Composite primary key (PK + SK) enables rich query patterns within a partition: get all orders for a user, get orders between dates, get the latest N items.',
        'Single-table design: store multiple entity types in one table, distinguish them with a type attribute or GSI. Reduces costs and simplifies access patterns for known queries.',
        'Item size limit: 400 KB per item. Attribute names count toward the size — use short attribute names in large-scale tables.',
        'DynamoDB does not support joins or server-side aggregations — model data for your access patterns, not normalised relational schemas.',
      ]
    },
    {
      heading: 'Secondary Indexes',
      points: [
        'GSI (Global Secondary Index): can have a completely different partition key and sort key than the table. Has its own RCU/WCU (or shares on-demand). Can be added or deleted after table creation.',
        'LSI (Local Secondary Index): same partition key as the table, different sort key. Must be defined at table creation — cannot be added later. Shares the table\'s RCU/WCU. Limits the partition to 10 GiB.',
        'Projected attributes: ALL (all item attributes in the index), KEYS_ONLY (PK + SK only, cheaper), or INCLUDE (specific attributes). Only projected attributes are available in index queries.',
        'Up to 5 GSIs and 5 LSIs per table. Writes to the main table are replicated to all indexes — more indexes means higher write cost.',
        'Query on a GSI uses the index\'s partition key as the required equality condition; sort key is optional for range operations.',
      ]
    },
    {
      heading: 'Read Consistency & Capacity',
      points: [
        'Eventually consistent reads (default): cheapest (0.5 RCU per 4 KB), data may lag up to 1 s after a write.',
        'Strongly consistent reads: 1 RCU per 4 KB, always returns the latest data, not available on GSIs.',
        'Transactional reads (TransactGetItems): 2 RCUs per 4 KB — provides ACID atomicity across up to 100 items in one request.',
        'Write units: 1 WCU per 1 KB. TransactWriteItems costs 2 WCUs per 1 KB. Conditional writes consume WCUs even on failure.',
        'Provisioned mode: set RCU/WCU; add Auto Scaling policies to adjust based on CloudWatch alarms. On-demand: no planning, pay per request — best for unpredictable traffic spikes.',
      ]
    },
    {
      heading: 'DynamoDB Streams & Lambda',
      points: [
        'DynamoDB Streams capture a time-ordered sequence of item changes. Each record contains the item before and/or after the change (configurable: KEYS_ONLY, NEW_IMAGE, OLD_IMAGE, NEW_AND_OLD_IMAGES).',
        'Streams have a 24-hour retention window. Records can be consumed by Lambda (event source mapping), Kinesis Data Streams (enhanced fan-out), or custom polling with GetShardIterator.',
        'Lambda event source mapping: Lambda polls the stream, batches records (up to 10,000), and invokes your function. Failures retry the entire batch by default — implement dead-letter handling.',
        'Common stream patterns: replicate changes to Elasticsearch/OpenSearch for search; send events to EventBridge for downstream services; maintain audit trail; warm up caches; cross-region replication.',
        'DynamoDB global tables use Streams internally for multi-region active-active replication — each region can accept writes and replicates to all others.',
      ]
    },
    {
      heading: 'DAX, TTL & Advanced Features',
      points: [
        'DAX (DynamoDB Accelerator): in-memory cluster, microsecond read latency (vs single-digit millisecond for DynamoDB). API-compatible — replace the DynamoDB client with the DAX client. Write-through cache.',
        'DAX does not support strongly consistent reads or transactions — use the standard DynamoDB client for those operations.',
        'TTL (Time To Live): set a numeric attribute (Unix timestamp) on items; DynamoDB automatically deletes expired items within 48 hours at no cost. Commonly used for sessions, OTP codes, and temp data.',
        'PartiQL: SQL-compatible query language for DynamoDB — SELECT, INSERT, UPDATE, DELETE with familiar syntax. Good for ad-hoc queries but not recommended for production application code (use SDK operations).',
        'Point-in-time recovery (PITR): continuous backup, restore to any second within the last 35 days. Enabled per table; no performance impact. Restores create a new table.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Table & Item Operations',
      language: 'bash',
      code: `# Create a table with composite key
aws dynamodb create-table \\
  --table-name Orders \\
  --attribute-definitions \\
    AttributeName=userId,AttributeType=S \\
    AttributeName=orderId,AttributeType=S \\
    AttributeName=createdAt,AttributeType=S \\
  --key-schema \\
    AttributeName=userId,KeyType=HASH \\
    AttributeName=orderId,KeyType=RANGE \\
  --billing-mode PAY_PER_REQUEST \\
  --global-secondary-indexes '[{
    "IndexName": "createdAt-index",
    "KeySchema": [
      {"AttributeName": "userId", "KeyType": "HASH"},
      {"AttributeName": "createdAt", "KeyType": "RANGE"}
    ],
    "Projection": {"ProjectionType": "ALL"}
  }]'

# Put item with condition (prevent overwrite)
aws dynamodb put-item \\
  --table-name Orders \\
  --item '{
    "userId":    {"S": "user-123"},
    "orderId":   {"S": "order-456"},
    "createdAt": {"S": "2024-01-15T10:00:00Z"},
    "status":    {"S": "pending"},
    "total":     {"N": "99.99"},
    "items":     {"L": [{"M": {"sku": {"S": "ITEM-1"}, "qty": {"N": "2"}}}]}
  }' \\
  --condition-expression "attribute_not_exists(orderId)"

# Update item with optimistic locking
aws dynamodb update-item \\
  --table-name Orders \\
  --key '{"userId":{"S":"user-123"},"orderId":{"S":"order-456"}}' \\
  --update-expression "SET #s = :new_status, updatedAt = :ts" \\
  --condition-expression "#s = :expected_status" \\
  --expression-attribute-names '{"#s": "status"}' \\
  --expression-attribute-values '{
    ":new_status":      {"S": "shipped"},
    ":expected_status": {"S": "pending"},
    ":ts":              {"S": "2024-01-15T12:00:00Z"}
  }'`,
    },
    {
      label: 'Query & Scan',
      language: 'bash',
      code: `# Query: get all orders for a user (efficient — uses PK)
aws dynamodb query \\
  --table-name Orders \\
  --key-condition-expression "userId = :uid" \\
  --expression-attribute-values '{":uid": {"S": "user-123"}}' \\
  --scan-index-forward false \\
  --limit 20

# Query with sort key range: orders in date range
aws dynamodb query \\
  --table-name Orders \\
  --index-name createdAt-index \\
  --key-condition-expression "userId = :uid AND createdAt BETWEEN :start AND :end" \\
  --expression-attribute-values '{
    ":uid":   {"S": "user-123"},
    ":start": {"S": "2024-01-01"},
    ":end":   {"S": "2024-01-31"}
  }' \\
  --filter-expression "#s = :status" \\
  --expression-attribute-names '{"#s": "status"}' \\
  --expression-attribute-values '{":status": {"S": "shipped"}}'

# Scan (expensive — reads entire table — avoid in production hot paths)
aws dynamodb scan \\
  --table-name Orders \\
  --filter-expression "#s = :status" \\
  --expression-attribute-names '{"#s": "status"}' \\
  --expression-attribute-values '{":status": {"S": "pending"}}' \\
  --select COUNT

# Transact write (atomic multi-item update)
aws dynamodb transact-write-items \\
  --transact-items '[
    {
      "Put": {
        "TableName": "Orders",
        "Item": {"userId":{"S":"user-123"},"orderId":{"S":"order-789"},"status":{"S":"pending"}},
        "ConditionExpression": "attribute_not_exists(orderId)"
      }
    },
    {
      "Update": {
        "TableName": "Inventory",
        "Key": {"sku":{"S":"ITEM-1"}},
        "UpdateExpression": "ADD quantity :delta",
        "ConditionExpression": "quantity >= :min",
        "ExpressionAttributeValues": {":delta":{"N":"-1"},":min":{"N":"1"}}
      }
    }
  ]'`,
    },
    {
      label: 'Streams & TTL',
      language: 'bash',
      code: `# Enable DynamoDB Streams (NEW_AND_OLD_IMAGES for CDC)
aws dynamodb update-table \\
  --table-name Orders \\
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES

# Get the stream ARN
aws dynamodb describe-table --table-name Orders \\
  --query 'Table.LatestStreamArn'

# Create Lambda event source mapping from the stream
aws lambda create-event-source-mapping \\
  --event-source-arn arn:aws:dynamodb:eu-west-1:123:table/Orders/stream/2024-01-01 \\
  --function-name OrderStreamProcessor \\
  --starting-position TRIM_HORIZON \\
  --batch-size 100 \\
  --bisect-batch-on-function-error \\
  --destination-config '{"OnFailure":{"Destination":"arn:aws:sqs:eu-west-1:123:dlq"}}'

# Enable TTL (items expire when 'expiresAt' Unix timestamp is in the past)
aws dynamodb update-time-to-live \\
  --table-name Sessions \\
  --time-to-live-specification AttributeName=expiresAt,Enabled=true

# Enable Point-In-Time Recovery
aws dynamodb update-continuous-backups \\
  --table-name Orders \\
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

# Restore to a specific time (creates a new table)
aws dynamodb restore-table-to-point-in-time \\
  --source-table-name Orders \\
  --target-table-name Orders-restored-2024-01-15 \\
  --restore-date-time "2024-01-15T09:00:00Z"`,
    },
    {
      label: 'DAX Cluster',
      language: 'bash',
      code: `# Create IAM role for DAX
aws iam create-role \\
  --role-name DAXRole \\
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{"Effect":"Allow","Principal":{"Service":"dax.amazonaws.com"},"Action":"sts:AssumeRole"}]
  }'

aws iam attach-role-policy \\
  --role-name DAXRole \\
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

# Create DAX subnet group
aws dax create-subnet-group \\
  --subnet-group-name prod-dax-subnets \\
  --subnet-ids subnet-private-1a subnet-private-1b

# Create DAX cluster (3-node for HA)
aws dax create-cluster \\
  --cluster-name prod-dax \\
  --node-type dax.r6g.large \\
  --replication-factor 3 \\
  --iam-role-arn arn:aws:iam::123:role/DAXRole \\
  --subnet-group-name prod-dax-subnets \\
  --security-group-ids sg-dax-0abc123

# Get DAX cluster endpoint
aws dax describe-clusters --cluster-names prod-dax \\
  --query 'Clusters[0].ClusterDiscoveryEndpoint'

# In your code: switch DynamoDB client to DAX client
# import { DaxClient } from "amazon-dax-client";
# const dax = new DaxClient({ endpoints: ["daxEndpoint:8111"] });
# // API calls are identical to DynamoDB SDK
# const result = await dax.get({ TableName: "Orders", Key: { userId: "123" } }).promise();`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Hot partition key causing throttling',
      wrong: `// PK = "status" with values "pending"|"shipped"|"delivered"
// All pending orders hit the "pending" partition
// That partition gets throttled; "shipped" partition sits idle
// ProvisionedThroughputExceededException under load`,
      right: `// Use high-cardinality PK: userId, orderId, customerId
// PK = userId -> orders spread evenly across all users
// Or add a random suffix (write sharding):
// PK = \`status#\${Math.floor(Math.random() * 10)}\`  // 0-9 shards`,
      explanation: 'DynamoDB partitions are bounded by the partition key hash. Low-cardinality keys (status, type, boolean) concentrate traffic on a few partitions, causing throttling even when the table has enough total capacity. Use high-cardinality keys — IDs, UUIDs, userIds — to distribute load evenly.'
    },
    {
      title: 'Using Scan instead of Query for production data access',
      wrong: `// Scan reads EVERY item in the table looking for matching orders
aws dynamodb scan \\
  --table-name Orders \\
  --filter-expression "userId = :uid"
// Reads all items, filters in memory — O(N) cost and latency`,
      right: `// Query uses the partition key index — O(1) partition lookup
aws dynamodb query \\
  --table-name Orders \\
  --key-condition-expression "userId = :uid"
// Only reads the items in that user's partition`,
      explanation: 'Scan reads every item in the table and is charged per item read (regardless of filter results). Query uses the partition key to directly access the relevant partition. Never use Scan on a hot path — design your access patterns first and create GSIs to support all Query-based access.'
    },
    {
      title: 'Adding a GSI with insufficient write capacity',
      wrong: `// Table: PAY_PER_REQUEST
// GSI: PROVISIONED with 5 WCU
// Table gets 1000 writes/s -> GSI gets 1000 writes/s
// GSI throttled at 5 WCU -> table writes start backing up`,
      right: `// Set GSI billing mode to match the table, OR
// For provisioned: GSI WCU >= table peak WCU
// For PAY_PER_REQUEST tables: GSI defaults to on-demand too
// Don't mix billing modes on table vs GSI without understanding the implications`,
      explanation: 'Every write to the table is replicated to all GSIs. If a GSI is provisioned with insufficient WCU, it throttles — and GSI write throttling can back-pressure and throttle the main table writes. Match the GSI capacity to the table, or use on-demand for both.'
    },
    {
      title: 'Storing large blobs in DynamoDB items',
      wrong: `// Storing base64-encoded images or PDFs directly in items
{
  "userId": {"S": "user-123"},
  "avatar": {"S": "data:image/png;base64,iVBORw0KGgo..."}  // 200 KB
}
// Item size limit: 400 KB; item is slow to read even for small attributes`,
      right: `// Store blob in S3, reference the key in DynamoDB
{
  "userId":    {"S": "user-123"},
  "avatarKey": {"S": "avatars/user-123/profile.png"}
}
// Generate presigned URL at read time: S3.getSignedUrl(avatarKey)`,
      explanation: 'DynamoDB items have a 400 KB limit and are billed by item size — a 200 KB item costs 200× more per read/write than a 1 KB item. Store binary data in S3 and keep only the S3 key reference in DynamoDB. Generate presigned URLs at read time for secure access.'
    },
    {
      title: 'Not handling DynamoDB throttling with exponential backoff',
      wrong: `// Retry immediately on ProvisionedThroughputExceededException
try {
  await dynamodb.put(params);
} catch (e) {
  if (e.code === 'ProvisionedThroughputExceededException') {
    await dynamodb.put(params);  // immediate retry — makes it worse
  }
}`,
      right: `// AWS SDK v3 has built-in retry with exponential backoff
// Configure the retry strategy:
const client = new DynamoDBClient({
  maxAttempts: 10,
  retryStrategy: new StandardRetryStrategy(10)
});
// Or use SQS + Lambda for resilient async writes`,
      explanation: 'Immediately retrying on throttle adds to the burst and worsens the problem. The AWS SDK has built-in exponential backoff with jitter — configure maxAttempts. For write-heavy scenarios, queue writes through SQS to smooth burst traffic and avoid exhausting retries.'
    },
  ];

  challenge: Challenge = {
    title: 'Design a Single-Table Schema for a Blog',
    language: 'typescript',
    description: `Design a DynamoDB single-table schema for a blog with these access patterns: (1) Get a user by userId; (2) Get all posts by a user; (3) Get a specific post by postId; (4) Get all comments for a post. Use PK/SK patterns and define any needed GSIs. Output the item shapes as TypeScript objects.`,
    hints: [
      'Use PK=USER#userId, SK=METADATA for user items.',
      'Use PK=USER#userId, SK=POST#postId for post items (access pattern 1 and 2).',
      'Use a GSI with PK=POST#postId to get a specific post (access pattern 3).',
      'Use PK=POST#postId, SK=COMMENT#commentId for comments (access pattern 4).',
      'All entity types live in the same table — use a "type" attribute to distinguish them.',
    ],
    starterCode: `interface DynamoItem { [key: string]: unknown }

// Access patterns:
// 1. GetUser(userId)
// 2. GetUserPosts(userId)
// 3. GetPost(postId)
// 4. GetPostComments(postId)

const userItem: DynamoItem = {
  PK: "USER#user-123",
  SK: "TODO",
  type: "USER",
  // TODO: user attributes
};

const postItem: DynamoItem = {
  PK: "TODO",  // supports GetUserPosts
  SK: "TODO",
  type: "POST",
  // TODO: post attributes
};

const commentItem: DynamoItem = {
  PK: "TODO",  // supports GetPostComments
  SK: "TODO",
  type: "COMMENT",
};

// TODO: define GSI for GetPost(postId)
const gsi = { name: "TODO", PK: "TODO", SK: "TODO" };

console.log({ userItem, postItem, commentItem, gsi });`,
    solution: `interface DynamoItem { [key: string]: unknown }

// PK = USER#userId, SK = METADATA -> GetUser (Query PK = USER#userId, SK begins_with METADATA)
const userItem: DynamoItem = {
  PK: "USER#user-123",
  SK: "METADATA",
  type: "USER",
  username: "jane_doe",
  email: "jane@example.com",
  createdAt: "2024-01-01T00:00:00Z"
};

// PK = USER#userId, SK = POST#postId -> GetUserPosts (Query PK = USER#userId, SK begins_with POST#)
// GSI1PK = POST#postId -> GetPost (Query GSI PK = POST#postId)
const postItem: DynamoItem = {
  PK: "USER#user-123",
  SK: "POST#post-456",
  type: "POST",
  GSI1PK: "POST#post-456",   // GSI partition key for GetPost
  GSI1SK: "METADATA",
  title: "My DynamoDB Post",
  content: "Single-table design...",
  createdAt: "2024-01-15T10:00:00Z"
};

// PK = POST#postId, SK = COMMENT#timestamp#commentId -> GetPostComments (Query PK = POST#postId)
const commentItem: DynamoItem = {
  PK: "POST#post-456",
  SK: "COMMENT#2024-01-15T10:30:00Z#comment-789",
  type: "COMMENT",
  authorId: "user-123",
  content: "Great post!",
  createdAt: "2024-01-15T10:30:00Z"
};

// GSI1: alternate access for GetPost
const gsi = {
  name: "GSI1",
  PK: "GSI1PK",   // POST#postId
  SK: "GSI1SK"    // METADATA (or createdAt for sorting)
};

console.log({ userItem, postItem, commentItem, gsi });`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary difference between a GSI and an LSI in DynamoDB?',
      options: [
        'GSI can have a different partition key; LSI must use the same partition key as the table',
        'LSI can have a different partition key; GSI must use the same partition key',
        'GSI requires strongly consistent reads; LSI does not',
        'GSI must be defined at table creation; LSI can be added later'
      ],
      answer: 0,
      explanation: 'GSI (Global Secondary Index) can have a completely different partition key and sort key — useful for alternate access patterns across different attributes. LSI (Local Secondary Index) must use the same partition key as the table but a different sort key — it provides alternate sort orders within the same partition.'
    },
    {
      q: 'How many RCUs does a strongly consistent read of a 6 KB item consume?',
      options: ['1 RCU', '2 RCUs', '3 RCUs', '0.5 RCU'],
      answer: 1,
      explanation: 'Strongly consistent reads consume 1 RCU per 4 KB (rounded up). A 6 KB item rounds up to 8 KB (2 × 4 KB blocks) = 2 RCUs. Eventually consistent reads would cost 0.5 RCU per 4 KB = 1 RCU for the same 6 KB item.'
    },
    {
      q: 'DynamoDB Streams retain records for how long?',
      options: ['1 hour', '24 hours', '7 days', '35 days'],
      answer: 1,
      explanation: 'DynamoDB Streams retain records for 24 hours. After 24 hours, records expire and are no longer available. For longer retention or fan-out to multiple consumers, enable Kinesis Data Streams integration which retains records for up to 1 year.'
    },
    {
      q: 'What is the item size limit in DynamoDB?',
      options: ['64 KB', '256 KB', '400 KB', '1 MB'],
      answer: 2,
      explanation: 'DynamoDB has a 400 KB item size limit, including attribute names and values. Attribute names count toward this limit — use short names for large-scale tables. For binary data (images, files), store in S3 and keep only the S3 key reference in DynamoDB.'
    },
    {
      q: 'Which DynamoDB feature automatically deletes expired items at no cost?',
      options: ['DynamoDB Streams', 'PITR (Point-in-Time Recovery)', 'TTL (Time To Live)', 'Conditional expressions'],
      answer: 2,
      explanation: 'TTL (Time To Live) allows you to define a numeric Unix timestamp attribute on items. DynamoDB automatically deletes items once the timestamp is in the past, typically within 48 hours, at no charge. Commonly used for session tokens, OTP codes, and temporary data.'
    },
    {
      q: 'What is a DynamoDB Global Secondary Index (GSI) used for?',
      options: ['Replicating a table to another AWS region', 'Querying a table using a different partition/sort key than the table\'s primary key', 'Encrypting table data at rest', 'Backing up a table automatically'],
      answer: 1,
      explanation: 'A GSI lets you query a DynamoDB table efficiently using an attribute other than the primary key — since DynamoDB only supports efficient lookups by primary key or index key, GSIs are essential for supporting multiple access patterns on the same table without expensive full table scans.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is single-table design and when should you use it?',
      a: 'Single-table design stores all entity types in one DynamoDB table, using a combination of PK/SK patterns (e.g. USER#id, POST#id, COMMENT#id) to support multiple access patterns efficiently. Benefits: lower cost (one table\'s provisioned capacity serves all entities), fewer API calls for related entities in the same partition, simpler operations. When to use: when you have well-defined access patterns upfront, and the trade-off of more complex schema design is acceptable. Avoid single-table for teams unfamiliar with DynamoDB or when access patterns are still evolving.'
    },
    {
      q: 'When should I choose DynamoDB over RDS/Aurora?',
      a: 'Choose DynamoDB when: (1) you need millisecond latency at any scale — DynamoDB throughput scales horizontally with no joins or complex queries; (2) you have a high write throughput requirement (10,000+ writes/s); (3) your data model is key-value or document-oriented with known access patterns; (4) you need automatic serverless scaling (on-demand mode); (5) you want zero database administration. Choose RDS/Aurora when: you need SQL, joins, complex aggregations, or full ACID transactions across many tables; your schema is relational; or your team is more comfortable with SQL.'
    },
    {
      q: 'How does DynamoDB DAX differ from ElastiCache?',
      a: 'DAX is DynamoDB-specific: it is API-compatible with the DynamoDB SDK (just swap the client), handles caching logic automatically (write-through, item-level invalidation), and integrates natively with DynamoDB security (VPC, IAM). ElastiCache is a general-purpose cache (Redis or Memcached) requiring you to manage cache keys, invalidation, and serialisation manually. DAX is simpler for pure DynamoDB caching. ElastiCache is more flexible for caching across multiple data sources, storing computed results, Pub/Sub, or leaderboard use cases.'
    },
    {
      q: 'What is write sharding and when do you need it?',
      a: 'Write sharding distributes writes across multiple logical partitions by appending a random suffix to the partition key: PK = status#0 through status#9 instead of just status. When reading, you query all 10 shards in parallel and merge results. Use write sharding when: your partition key has low cardinality (status, type, date) and you expect high write throughput on specific values. Symptoms requiring sharding: ProvisionedThroughputExceededException on specific partition keys even when overall table capacity is not exhausted.'
    },
    {
      q: 'What is the difference between DynamoDB on-demand and provisioned capacity modes?',
      a: 'Provisioned capacity requires you to specify read/write capacity units (RCU/WCU) upfront — cost-efficient for predictable, steady traffic, but requires capacity planning and can throttle on unexpected spikes unless auto-scaling is configured. On-demand mode automatically scales to handle any traffic level with no capacity planning, charging per request — simpler to operate and better for unpredictable or spiky traffic, at a higher per-request cost than well-utilized provisioned capacity.',
    },
    {
      q: 'Why does DynamoDB table design emphasize single-table design rather than normalized relational schemas?',
      a: 'DynamoDB has no native JOIN operation, so spreading related data across multiple tables (as a relational database would) forces the application to make multiple round-trip queries and join data client-side, which is slow and does not scale. Single-table design stores multiple entity types in one table, using composite partition/sort keys and GSIs to support all required access patterns with a single query — this requires designing the table around your application\'s known query patterns upfront, a significant mindset shift from relational normalization.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'DynamoDB is a serverless key-value/document database — design access patterns first, choose high-cardinality partition keys, use GSIs for alternate access, and Streams for CDC.',
    mustKnow: [
      'PK must be high cardinality — low-cardinality keys create hot partitions and throttling',
      'GSI: different PK+SK, add post-creation; LSI: same PK, different SK, must define at creation',
      'Query uses PK index (O(1) partition lookup); Scan reads everything (O(N)) — avoid Scan on hot paths',
      'Strongly consistent: 1 RCU/4 KB; Eventually consistent: 0.5 RCU/4 KB; Transact: 2 RCU/4 KB',
      'DynamoDB Streams: 24-hour retention, ordered CDC — triggers Lambda for replication/search/audit',
      'TTL: set Unix timestamp attribute; DynamoDB deletes expired items automatically (within 48 h, free)',
      'Item size limit: 400 KB — store binary data in S3, reference the key in DynamoDB',
    ],
    interviewFocus: [
      'Hot partition problem — how to identify and fix with write sharding or key redesign',
      'GSI vs LSI trade-offs — when to create each, cost implications',
      'Single-table design — PK/SK patterns for multiple entity types',
      'DynamoDB vs RDS decision criteria — access patterns, scale, query complexity',
      'DynamoDB Streams use cases — CDC, search indexing, cross-region replication',
    ],
  };
}
