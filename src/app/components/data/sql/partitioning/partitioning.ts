import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-sql-partitioning',
  standalone: true,
  imports: [
    CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, PageCompleteComponent
  ],
  templateUrl: './partitioning.html',
  styleUrls: ['./partitioning.scss']
})
export class SqlPartitioning {

  quickRef: QuickRefItem[] = [
    { name: 'PARTITION BY RANGE',   type: 'keyword', desc: 'Split table rows by a range of values (date, ID)' },
    { name: 'PARTITION BY LIST',    type: 'keyword', desc: 'Split rows by discrete values (region, status)' },
    { name: 'PARTITION BY HASH',    type: 'keyword', desc: 'Distribute rows evenly across N partitions' },
    { name: 'Partition pruning',    type: 'keyword', desc: 'Optimizer skips irrelevant partitions when WHERE matches partition key' },
    { name: 'Partition function (MSSQL)', type: 'keyword', desc: 'Defines the boundary values for partitions' },
    { name: 'Partition scheme (MSSQL)',   type: 'keyword', desc: 'Maps partition ranges to filegroups' },
    { name: 'ATTACH / DETACH partition', type: 'keyword', desc: 'PostgreSQL: swap child tables in/out without locking parent' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is table partitioning?',
      points: [
        'Partitioning divides a large table into smaller, independently managed chunks called partitions, based on a partition key column.',
        'To queries, a partitioned table looks like a single table — the database transparently routes reads and writes to the correct partition.',
        'Benefits: partition pruning (skip irrelevant partitions in WHERE), faster archival (drop/detach old partition instead of DELETE), parallel operations per partition.',
      ]
    },
    {
      heading: 'Partition strategies',
      points: [
        'RANGE: rows go to a partition based on a value range — most common, ideal for date-based data (monthly/yearly partitions).',
        'LIST: rows go to a partition based on a discrete set of values — good for region, status, or tenant-ID.',
        'HASH: rows are distributed by hash(key) % N — balances data evenly when no natural range or list applies.',
        'Composite (MSSQL): only RANGE is natively supported; simulate others via computed partition key + range.',
      ]
    },
    {
      heading: 'MSSQL partitioning mechanics',
      points: [
        'Step 1: CREATE PARTITION FUNCTION — defines boundary values.',
        'Step 2: CREATE PARTITION SCHEME — maps partition ranges to filegroups.',
        'Step 3: CREATE TABLE … ON partition_scheme(column) — creates the partitioned table.',
        'Switch partition: ALTER TABLE orders SWITCH PARTITION N TO archive.orders PARTITION M — instant metadata-only operation.',
      ]
    },
    {
      heading: 'PostgreSQL declarative partitioning',
      points: [
        'CREATE TABLE parent PARTITION BY RANGE (order_date); then CREATE TABLE child PARTITION OF parent FOR VALUES FROM (…) TO (…).',
        'Each partition is a full table — can have its own indexes, tablespace, storage parameters.',
        'ATTACH PARTITION / DETACH PARTITION: add or remove child tables without locking the parent. DETACH CONCURRENTLY is non-blocking.',
        'PostgreSQL 13+: logical replication works on individual partitions. 14+: partition-wise joins and aggregations.',
      ]
    },
    {
      heading: 'Partition pruning and pitfalls',
      points: [
        'For pruning to work, the WHERE clause must include the partition key — otherwise all partitions are scanned.',
        'Implicit conversions on the partition key disable pruning — always compare the key to the correct type.',
        'Too many partitions degrade plan compilation time and metadata overhead — thousands of partitions is usually too many.',
        'Global indexes (non-partitioned) defeat partition switch/drop operations in MSSQL; local indexes are preferred.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MSSQL partitioned table',
      language: 'sql',
      code: `-- Step 1: partition function (monthly boundaries for 2024)
CREATE PARTITION FUNCTION pf_orders_monthly (DATE)
AS RANGE RIGHT FOR VALUES (
    '2024-02-01','2024-03-01','2024-04-01',
    '2024-05-01','2024-06-01','2024-07-01',
    '2024-08-01','2024-09-01','2024-10-01',
    '2024-11-01','2024-12-01','2025-01-01'
);

-- Step 2: partition scheme (all partitions on PRIMARY for simplicity)
CREATE PARTITION SCHEME ps_orders_monthly
AS PARTITION pf_orders_monthly ALL TO ([PRIMARY]);

-- Step 3: create partitioned table
CREATE TABLE orders_partitioned (
    order_id   INT NOT NULL,
    order_date DATE NOT NULL,
    customer_id INT NOT NULL,
    amount     DECIMAL(10,2) NOT NULL
) ON ps_orders_monthly(order_date);

-- Clustered index must include the partition key
CREATE CLUSTERED INDEX cx_orders_partitioned
ON orders_partitioned (order_date, order_id);

-- Check which partition a date falls in
SELECT $PARTITION.pf_orders_monthly('2024-06-15');  -- returns partition number`
    },
    {
      label: 'MSSQL partition switch (archival)',
      language: 'sql',
      code: `-- Archive pattern: switch old partition to archive table
-- Archive table must have identical structure and be on same filegroup

CREATE TABLE orders_archive (
    order_id   INT NOT NULL,
    order_date DATE NOT NULL,
    customer_id INT NOT NULL,
    amount     DECIMAL(10,2) NOT NULL
) ON [PRIMARY];   -- matches target filegroup

CREATE CLUSTERED INDEX cx_archive ON orders_archive (order_date, order_id);

-- Switch partition 1 (Jan 2024) to archive — instant, metadata only
ALTER TABLE orders_partitioned
SWITCH PARTITION 1
TO orders_archive PARTITION 1;

-- The partition is now empty in orders_partitioned
-- Archive table holds January data — can be dropped, moved, or backed up
TRUNCATE TABLE orders_archive;  -- clear after archiving

-- Add a new partition for the next month
ALTER PARTITION FUNCTION pf_orders_monthly()
SPLIT RANGE ('2025-02-01');`
    },
    {
      label: 'PostgreSQL RANGE partitioning',
      language: 'sql',
      code: `-- Parent table (no data stored here)
CREATE TABLE orders (
    order_id   INT NOT NULL,
    order_date DATE NOT NULL,
    customer_id INT NOT NULL,
    amount     NUMERIC(10,2) NOT NULL
) PARTITION BY RANGE (order_date);

-- Child partitions (one per quarter)
CREATE TABLE orders_2024_q1
PARTITION OF orders
FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_2024_q2
PARTITION OF orders
FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Each child can have its own index
CREATE INDEX ON orders_2024_q1 (customer_id);
CREATE INDEX ON orders_2024_q2 (customer_id);

-- Insert routes automatically to correct partition
INSERT INTO orders VALUES (1, '2024-02-15', 42, 99.99);

-- Partition pruning: only orders_2024_q1 scanned
SELECT * FROM orders WHERE order_date = '2024-03-01';`
    },
    {
      label: 'PostgreSQL LIST & HASH + ATTACH/DETACH',
      language: 'sql',
      code: `-- LIST partitioning by region
CREATE TABLE customers (
    id     INT,
    region TEXT NOT NULL
) PARTITION BY LIST (region);

CREATE TABLE customers_emea PARTITION OF customers FOR VALUES IN ('EU', 'UK', 'ME');
CREATE TABLE customers_apac PARTITION OF customers FOR VALUES IN ('AU', 'IN', 'JP');
CREATE TABLE customers_amer PARTITION OF customers FOR VALUES IN ('US', 'CA', 'BR');

-- HASH partitioning (even distribution, no natural key)
CREATE TABLE events (
    event_id BIGINT,
    payload  JSONB
) PARTITION BY HASH (event_id);

CREATE TABLE events_0 PARTITION OF events FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE events_1 PARTITION OF events FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE events_2 PARTITION OF events FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE events_3 PARTITION OF events FOR VALUES WITH (MODULUS 4, REMAINDER 3);

-- Detach a partition non-blocking (PG 14+), archive/drop old data
ALTER TABLE orders DETACH PARTITION orders_2024_q1 CONCURRENTLY;
-- orders_2024_q1 is now a standalone table — back it up or drop it
DROP TABLE orders_2024_q1;`
    },
  ];

  challenge: Challenge = {
    title: 'Design a time-series partitioning strategy',
    language: 'sql',
    description: 'You have a sensor_readings table (sensor_id INT, recorded_at TIMESTAMPTZ, value NUMERIC) that grows by ~5M rows per month. Design a PostgreSQL RANGE partition by recorded_at (monthly). Create the parent table and three child partitions for Jan–Mar 2025. Add a local index on (sensor_id, recorded_at) to each partition. Finally, write the DETACH statement to archive January once February data is flowing in.',
    hints: [
      'PARTITION BY RANGE (recorded_at) on the parent. Each child: FOR VALUES FROM (\'2025-01-01\') TO (\'2025-02-01\').',
      'Create the index on each child table individually after creating the partition.',
      'DETACH PARTITION … CONCURRENTLY is non-blocking in PostgreSQL 14+.',
    ],
    starterCode: `-- Parent table
CREATE TABLE sensor_readings (
    sensor_id   INT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    value       NUMERIC NOT NULL
) PARTITION BY RANGE (recorded_at);

-- Jan 2025 partition

-- Feb 2025 partition

-- Mar 2025 partition

-- Index each partition

-- Archive (detach) January when done`,
    solution: `CREATE TABLE sensor_readings (
    sensor_id   INT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    value       NUMERIC NOT NULL
) PARTITION BY RANGE (recorded_at);

CREATE TABLE sensor_readings_2025_01
PARTITION OF sensor_readings
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE sensor_readings_2025_02
PARTITION OF sensor_readings
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE sensor_readings_2025_03
PARTITION OF sensor_readings
FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

CREATE INDEX ON sensor_readings_2025_01 (sensor_id, recorded_at);
CREATE INDEX ON sensor_readings_2025_02 (sensor_id, recorded_at);
CREATE INDEX ON sensor_readings_2025_03 (sensor_id, recorded_at);

-- Archive January non-blocking once February is live
ALTER TABLE sensor_readings
DETACH PARTITION sensor_readings_2025_01 CONCURRENTLY;

-- sensor_readings_2025_01 is now a standalone table — back it up
-- DROP TABLE sensor_readings_2025_01;  -- when no longer needed`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is partition pruning?',
      options: [
        'Automatically deleting rows from old partitions',
        'The optimizer skipping partitions whose range cannot contain rows matching the WHERE clause',
        'Merging small partitions into larger ones',
        'Removing duplicate rows across partitions'
      ],
      answer: 1,
      explanation: 'Partition pruning is when the query optimizer determines that certain partitions cannot contain qualifying rows (based on the partition key in WHERE) and excludes them from the query plan entirely — dramatically reducing I/O.'
    },
    {
      q: 'In MSSQL, what does a partition SWITCH operation do?',
      options: [
        'Copies data from one partition to another — takes proportional time to data size',
        'Moves data to a different filegroup by rewriting all rows',
        'Transfers a partition to another table as an instantaneous metadata-only operation',
        'Splits one partition into two at a new boundary value'
      ],
      answer: 2,
      explanation: 'SWITCH is a metadata-only operation — it reassigns the partition pointer to a different table instantaneously, regardless of data size. The target table must have the same schema and be on the same filegroup.'
    },
    {
      q: 'Which partition strategy distributes rows evenly with no natural ordering?',
      options: ['RANGE', 'LIST', 'HASH', 'COMPOSITE'],
      answer: 2,
      explanation: 'HASH partitioning assigns rows to partitions based on hash(key) % N, producing an even distribution without any natural range or discrete list. Useful for load balancing when there is no date or category to partition on.'
    },
    {
      q: 'For partition pruning to work in a WHERE clause, what must be true?',
      options: [
        'The WHERE clause must use BETWEEN syntax',
        'The partition key column must appear in the WHERE clause with a compatible type and no function applied to it',
        'The table must have a clustered index on the partition key',
        'The query must be run as a stored procedure'
      ],
      answer: 1,
      explanation: 'Pruning requires the optimizer to compare the partition boundaries against the WHERE predicate. If the partition key is wrapped in a function (YEAR(order_date)) or an implicit type conversion occurs, the optimizer cannot prune partitions and scans them all.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How many partitions is too many?',
      a: 'There is no hard limit, but in practice: MSSQL degrades query compilation time with thousands of partitions (the optimizer checks each boundary). PostgreSQL handles more partitions gracefully since PG 11 but still incurs planning overhead at thousands. A common sweet spot is monthly partitions for 2–5 years of data (24–60 partitions). If you need finer granularity, consider rolling up old partitions.',
    },
    {
      q: 'Can I add a partition to a live production table without downtime?',
      a: 'PostgreSQL: CREATE TABLE child PARTITION OF parent FOR VALUES … — the parent stays available. DETACH PARTITION … CONCURRENTLY (PG 14+) also avoids lock. MSSQL: ALTER PARTITION FUNCTION … SPLIT RANGE — instant, but the new (empty) partition must already have a corresponding filegroup in the scheme. Existing data is not moved during a split of a boundary where all data is on one side.',
    },
    {
      q: 'Does partitioning replace indexing?',
      a: 'No — partitioning complements indexing. Pruning eliminates whole partitions; indexes speed up lookups within a partition. The combination is powerful: a date-range query prunes to one monthly partition then seeks within it via an index. Without indexes, a query still scans the entire retained partition row by row.',
    },
  ];
}
