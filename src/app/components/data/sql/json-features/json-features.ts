import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-sql-json-features',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './json-features.html',
  styleUrl: './json-features.scss',
})
export class SqlJsonFeatures {

  quickRef: QuickRefItem[] = [
    { name: 'JSON_VALUE()',     type: 'function', desc: 'MSSQL: extract a scalar value from a JSON string at a given path', since: 'SQL Server 2016' },
    { name: 'JSON_QUERY()',     type: 'function', desc: 'MSSQL: extract an object or array from a JSON string (returns JSON fragment)', since: 'SQL Server 2016' },
    { name: 'JSON_MODIFY()',    type: 'function', desc: 'MSSQL: returns a new JSON string with a value changed at the given path', since: 'SQL Server 2016' },
    { name: 'ISJSON()',         type: 'function', desc: 'MSSQL: returns 1 if the string is valid JSON', since: 'SQL Server 2016' },
    { name: 'OPENJSON()',       type: 'function', desc: 'MSSQL: table-valued function that shreds a JSON array into rows', since: 'SQL Server 2016' },
    { name: 'FOR JSON PATH',    type: 'keyword',  desc: 'MSSQL: converts a result set to JSON; PATH uses dot-notation column aliases', since: 'SQL Server 2016' },
    { name: 'FOR JSON AUTO',    type: 'keyword',  desc: 'MSSQL: automatically nests child rows based on JOIN structure', since: 'SQL Server 2016' },
    { name: 'jsonb',            type: 'type',     desc: 'PostgreSQL binary JSON type — supports GIN indexing, faster for querying', since: 'PostgreSQL 9.4' },
    { name: '-> operator',      type: 'operator', desc: 'PostgreSQL: access a JSON key (returns JSON type)', since: 'PostgreSQL 9.3' },
    { name: '->> operator',     type: 'operator', desc: 'PostgreSQL: access a JSON key (returns text)', since: 'PostgreSQL 9.3' },
    { name: '@> operator',      type: 'operator', desc: 'PostgreSQL: containment — left jsonb contains right jsonb; GIN-indexable', since: 'PostgreSQL 9.4' },
    { name: 'GIN index',        type: 'keyword',  desc: 'PostgreSQL: generalised inverted index for jsonb — supports @>, ?, @@', since: 'PostgreSQL 9.4' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'JSON in SQL Server — storage and functions',
      points: [
        'SQL Server stores JSON as plain <code>NVARCHAR</code> — there is no native JSON data type. The string is valid JSON, but the database does not enforce schema at storage time. Use a <code>CHECK (ISJSON(col) = 1)</code> constraint to validate on write.',
        '<code>JSON_VALUE(col, \'$.key.subkey\')</code> extracts a single scalar (string, number, boolean). <code>JSON_QUERY(col, \'$.arrayKey\')</code> extracts an object or array fragment. Neither can be used in a standard index — use a computed column.',
        '<code>OPENJSON(jsonCol)</code> shreds a JSON array into a relational result set. With a <code>WITH</code> clause you can specify column names and types: <code>OPENJSON(@json) WITH (id INT, name NVARCHAR(100))</code>.',
        '<code>FOR JSON PATH</code> converts a SELECT result to JSON. Use dot notation in column aliases to nest properties: <code>SELECT o.ID AS \'order.id\', c.Name AS \'order.customer.name\' FOR JSON PATH</code>.',
      ],
    },
    {
      heading: 'PostgreSQL jsonb — operators and indexing',
      points: [
        'PostgreSQL offers two JSON types: <code>json</code> (stored as text, re-parsed on every access) and <code>jsonb</code> (binary, supports indexing, faster for queries). Always use <code>jsonb</code> unless you need to preserve key order or exact whitespace.',
        '<code>col->\'key\'</code> returns the value as jsonb; <code>col->>\'key\'</code> returns it as text. Use <code>-></code> for nested paths: <code>col->\'address\'->>\'city\'</code>.',
        'The <strong>containment operator</strong> <code>@></code> checks if the left JSON contains the right: <code>col @> \'{"status":"active"}\'</code>. This is indexable with a GIN index: <code>CREATE INDEX ON t USING GIN (col)</code>.',
        'The <strong>existence operator</strong> <code>?</code> checks if a key exists: <code>col ? \'tags\'</code>. The path operator <code>#></code> navigates nested structures: <code>col #>> \'{address,city}\'</code>.',
      ],
    },
    {
      heading: 'Indexing JSON columns',
      points: [
        'SQL Server: create a computed column that extracts the JSON value, then index the computed column. Make it persisted for better performance: <code>ALTER TABLE t ADD EmailExtracted AS JSON_VALUE(Data, \'$.email\') PERSISTED; CREATE INDEX ON t(EmailExtracted);</code>',
        'PostgreSQL: create a GIN index on a jsonb column: <code>CREATE INDEX ON t USING GIN (data)</code>. This supports <code>@></code>, <code>?</code>, <code>?|</code>, <code>?&</code> operators. For specific path queries, a functional index is faster: <code>CREATE INDEX ON t ((data->>\'email\'))</code>.',
        'Be careful with large JSON columns — GIN indexes can be large. Only index what you actually query.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SQL Server JSON',
      language: 'sql',
      code: `-- Sample table with JSON column
CREATE TABLE Events (
    EventID  INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    Payload  NVARCHAR(MAX) NOT NULL CHECK (ISJSON(Payload) = 1)
);

INSERT INTO Events (Payload) VALUES
(N'{"type":"order","customerID":42,"items":[{"id":1,"qty":3},{"id":5,"qty":1}]}');

-- JSON_VALUE: extract scalar
SELECT
    EventID,
    JSON_VALUE(Payload, '$.type')       AS EventType,
    JSON_VALUE(Payload, '$.customerID') AS CustomerID
FROM Events;

-- OPENJSON: shred items array to rows
SELECT e.EventID, j.id AS ProductID, j.qty AS Quantity
FROM Events e
CROSS APPLY OPENJSON(e.Payload, '$.items')
    WITH (id INT, qty INT) AS j;

-- FOR JSON: rows to JSON
SELECT OrderID, CustomerID, OrderDate
FROM Orders
WHERE CustomerID = 42
FOR JSON PATH, ROOT('orders');`,
    },
    {
      label: 'PostgreSQL jsonb',
      language: 'sql',
      code: `-- Create table with jsonb column
CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    payload  JSONB NOT NULL
);

INSERT INTO events (payload) VALUES
('{"type":"order","customer_id":42,"items":[{"id":1,"qty":3}]}');

-- -> returns jsonb, ->> returns text
SELECT
    event_id,
    payload->>'type'        AS event_type,
    payload->>'customer_id' AS customer_id
FROM events;

-- Containment operator (GIN-indexable)
SELECT * FROM events
WHERE payload @> '{"type":"order"}';

-- Exists operator
SELECT * FROM events WHERE payload ? 'items';

-- Navigate nested path
SELECT payload#>>'{items,0,id}' AS first_item_id
FROM events;

-- jsonb_array_elements: unnest JSON array to rows
SELECT event_id, item->>'id' AS product_id, item->>'qty' AS qty
FROM events,
LATERAL jsonb_array_elements(payload->'items') AS item;`,
    },
    {
      label: 'Indexes on JSON',
      language: 'sql',
      code: `-- SQL Server: computed column index
ALTER TABLE Events
    ADD EventType AS JSON_VALUE(Payload, '$.type') PERSISTED;

CREATE INDEX IX_Events_Type ON Events (EventType);

-- Now this seek can use the index:
SELECT * FROM Events WHERE EventType = 'order';

-- PostgreSQL: GIN index on full jsonb column
CREATE INDEX IX_Events_Payload ON events USING GIN (payload);

-- Path-specific functional index (more selective)
CREATE INDEX IX_Events_Type ON events
    ((payload->>'type'));

-- Query that uses the functional index:
SELECT * FROM events WHERE payload->>'type' = 'order';`,
    },
  ];

  challenge: Challenge = {
    title: 'Query a JSON Event Log',
    language: 'sql',
    description: `Given an Events table (EventID INT, CreatedAt DATETIME2, Payload NVARCHAR(MAX)) with JSON payloads of the form:
\`{"type":"purchase","userID":123,"total":49.99,"currency":"USD"}\`

Write queries to:
1. Return EventID, userID, and total for all purchase events where total > 100
2. Update the currency to "EUR" for all events where currency = "USD" (SQL Server JSON_MODIFY)`,
    hints: [
      'JSON_VALUE(Payload, \'$.type\') = \'purchase\' filters by event type',
      'CAST(JSON_VALUE(Payload, \'$.total\') AS DECIMAL(10,2)) for numeric comparison',
      'JSON_MODIFY(Payload, \'$.currency\', \'EUR\') returns a modified JSON string',
    ],
    starterCode: `-- Query 1: purchases over $100
SELECT
    EventID,
    -- extract userID and total
FROM Events
WHERE
    -- type = purchase AND total > 100
;

-- Query 2: update USD → EUR
UPDATE Events
SET Payload = -- JSON_MODIFY
WHERE
    -- currency = USD
;`,
    solution: `-- Query 1
SELECT
    EventID,
    JSON_VALUE(Payload, '$.userID')                       AS UserID,
    CAST(JSON_VALUE(Payload, '$.total') AS DECIMAL(10,2)) AS Total
FROM Events
WHERE JSON_VALUE(Payload, '$.type')     = 'purchase'
  AND CAST(JSON_VALUE(Payload, '$.total') AS DECIMAL(10,2)) > 100;

-- Query 2
UPDATE Events
SET Payload = JSON_MODIFY(Payload, '$.currency', 'EUR')
WHERE JSON_VALUE(Payload, '$.currency') = 'USD';`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In SQL Server, which data type stores JSON?',
      options: ['JSON', 'JSONB', 'NVARCHAR', 'XML'],
      answer: 2,
      explanation: 'SQL Server has no native JSON data type. JSON is stored as NVARCHAR (or VARCHAR). Use a CHECK (ISJSON(col) = 1) constraint to validate the format.',
    },
    {
      q: 'In PostgreSQL, what is the difference between json and jsonb?',
      options: [
        'jsonb is text; json is binary',
        'json stores text as-is; jsonb stores binary and supports GIN indexing',
        'jsonb requires a JSON schema; json does not',
        'They are identical',
      ],
      answer: 1,
      explanation: 'json stores the raw text and re-parses on every access. jsonb stores a binary representation that is faster to query and supports GIN indexes. Always use jsonb for queryable data.',
    },
    {
      q: 'Which PostgreSQL operator is GIN-indexable for JSON containment queries?',
      options: ['->', '->>', '@>', '#>>'],
      answer: 2,
      explanation: '@> is the containment operator: left_jsonb @> right_jsonb means "left contains right". It is supported by GIN indexes and enables efficient searches across jsonb columns.',
    },
    {
      q: 'How do you make a JSON path query indexable in SQL Server?',
      options: [
        'Create a GIN index on the NVARCHAR column',
        'Create a persisted computed column using JSON_VALUE, then index that column',
        'Use OPENJSON in a filtered index WHERE clause',
        'JSON paths are automatically indexed',
      ],
      answer: 1,
      explanation: 'SQL Server cannot directly index a JSON path. The solution is to add a persisted computed column (ALTER TABLE … ADD col AS JSON_VALUE(json_col, \'$.path\') PERSISTED) and create a regular index on that computed column.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use a JSON column or a relational table for structured data?',
      a: 'Relational tables for data you need to query, filter, join, or aggregate — the optimizer works best with typed columns. JSON columns are useful for schema-flexible extras: event metadata, user preferences, EAV-style attributes, or external API payloads you store but rarely query deeply. Hybrid schemas (core columns relational + extension in JSON) are common and practical.',
    },
    {
      q: 'Can I use OPENJSON result in a JOIN?',
      a: 'Yes. OPENJSON is a table-valued function and its result can be joined like any table. Use CROSS APPLY to shred a JSON column and join its rows to other tables: FROM Orders o CROSS APPLY OPENJSON(o.ItemsJson) WITH (ProductID INT, Qty INT) AS items JOIN Products p ON items.ProductID = p.ProductID.',
    },
    {
      q: 'What is the performance impact of JSON_VALUE in a WHERE clause on millions of rows?',
      a: 'JSON_VALUE in WHERE is non-sargable on a plain NVARCHAR column — the engine must parse every JSON string and extract the value for every row. On large tables, this is a full scan. Fix: add a persisted computed column with an index (SQL Server) or a functional index on the jsonb path (PostgreSQL).',
    },
    {
      q: 'How do I validate that a JSON column contains a required key in PostgreSQL?',
      a: 'Use the existence operator ? in a CHECK constraint: ALTER TABLE events ADD CONSTRAINT chk_has_type CHECK (payload ? \'type\'). This ensures the key exists in the stored jsonb. For deeper validation (required nested keys, type checks) consider a trigger or application-layer validation.',
    },
  ];
}
