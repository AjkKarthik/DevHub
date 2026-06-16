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
    { name: 'JSON_VALUE()',        type: 'function', desc: 'MSSQL: extract a scalar value from JSON at a given lax path (returns NULL if missing, not an error)', since: 'SQL Server 2016' },
    { name: 'JSON_QUERY()',        type: 'function', desc: 'MSSQL: extract an object or array from JSON (returns a JSON fragment, not a scalar)', since: 'SQL Server 2016' },
    { name: 'JSON_MODIFY()',       type: 'function', desc: 'MSSQL: returns a new JSON string with a value changed/added/deleted at the given path', since: 'SQL Server 2016' },
    { name: 'ISJSON()',            type: 'function', desc: 'MSSQL: returns 1 if the string is valid JSON — use in CHECK constraints', since: 'SQL Server 2016' },
    { name: 'OPENJSON()',          type: 'function', desc: 'MSSQL: TVF that shreds a JSON array into rows; WITH clause defines column types', since: 'SQL Server 2016' },
    { name: 'FOR JSON PATH',       type: 'keyword',  desc: 'MSSQL: converts a SELECT result to JSON; dot-notation aliases create nesting', since: 'SQL Server 2016' },
    { name: 'FOR JSON AUTO',       type: 'keyword',  desc: 'MSSQL: auto-nests child rows based on JOIN structure and column order', since: 'SQL Server 2016' },
    { name: 'jsonb',               type: 'type',     desc: 'PostgreSQL binary JSON — supports GIN indexing, key existence check, containment, path ops', since: 'PostgreSQL 9.4' },
    { name: '-> / ->>',           type: 'operator', desc: 'PostgreSQL: -> returns JSON/jsonb, ->> returns text. Use ->> for comparisons.', since: 'PostgreSQL 9.3' },
    { name: '@>',                  type: 'operator', desc: 'PostgreSQL containment: left jsonb contains right jsonb; GIN-indexable', since: 'PostgreSQL 9.4' },
    { name: '? / ?| / ?&',        type: 'operator', desc: 'PostgreSQL key existence: ? single key, ?| any of keys, ?& all of keys; GIN-indexable', since: 'PostgreSQL 9.4' },
    { name: 'jsonb_set()',         type: 'function', desc: 'PostgreSQL: update a value at a specific path in a jsonb column', since: 'PostgreSQL 9.5' },
    { name: '|| (concat)',         type: 'operator', desc: 'PostgreSQL: merge two jsonb values — right-side keys override left-side keys', since: 'PostgreSQL 9.5' },
    { name: '#- (delete path)',    type: 'operator', desc: 'PostgreSQL: remove a key/array element at the specified path from jsonb', since: 'PostgreSQL 9.5' },
    { name: 'GIN index',           type: 'keyword',  desc: 'Generalised Inverted Index — supports @>, ?, ?|, ?& on jsonb columns', since: 'PostgreSQL 9.4' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'JSON in SQL Server — storage, validation, and scalar extraction',
      points: [
        'SQL Server has <strong>no native JSON data type</strong>. JSON is stored as <code>NVARCHAR(MAX)</code> (or <code>VARCHAR(MAX)</code> for ASCII-only payloads). The database treats it as an opaque string unless you call JSON functions explicitly. Enforce valid JSON at write time with a CHECK constraint: <code>CHECK (ISJSON(Payload) = 1)</code>.',
        '<code>JSON_VALUE(col, \'$.key.subkey\')</code> extracts a single scalar value (string, number, boolean, null). It uses "lax" path mode by default — if the path does not exist it returns NULL instead of raising an error. Add <code>STRICT</code> for an error on missing paths: <code>JSON_VALUE(col, \'strict $.required\')</code>.',
        '<code>JSON_QUERY(col, \'$.arrayKey\')</code> extracts an object or array as a JSON fragment (not a scalar). Returns NULL if the path returns a scalar; use <code>JSON_VALUE</code> for scalars. Both functions return NVARCHAR — cast explicitly: <code>CAST(JSON_VALUE(col, \'$.price\') AS DECIMAL(10,2))</code>.',
        '<code>ISJSON(value, OBJECT)</code> (SQL Server 2022+) validates the string is a JSON object specifically. <code>ISJSON(value, ARRAY)</code> validates it is a JSON array. Earlier versions have only <code>ISJSON(value)</code> which validates any valid JSON.',
        'SQL Server 2022 adds <code>JSON_PATH_EXISTS(col, path)</code> (returns 1/0) and <code>JSON_OBJECT(key:value, …)</code> / <code>JSON_ARRAY(value, …)</code> constructors — a much cleaner API than assembling JSON strings with concatenation or FOR JSON PATH.',
      ],
    },
    {
      heading: 'OPENJSON and FOR JSON — shredding arrays and serialising result sets',
      points: [
        '<code>OPENJSON(jsonExpression)</code> is a table-valued function that shreds a JSON array into rows. Without a <code>WITH</code> clause, it returns three columns: <code>key</code> (array index or object key), <code>value</code> (as NVARCHAR), and <code>type</code> (0=null, 1=string, 2=number, 3=object, 4=array, 5=boolean). Use <code>CROSS APPLY</code> to shred a JSON column into related rows.',
        'Add a <code>WITH</code> clause to <code>OPENJSON</code> to define output columns and types: <code>OPENJSON(@json, \'$.items\') WITH (id INT, qty INT, name NVARCHAR(100))</code>. This is strongly typed and the result is directly joinable to other tables. It is the preferred pattern for importing JSON payloads from external APIs into a staging table.',
        '<code>FOR JSON PATH</code> converts a SELECT result to a JSON array. Use dot-notation column aliases to create nesting: <code>SELECT o.ID AS \'order.id\', c.Name AS \'order.customer\' FOR JSON PATH</code> produces <code>[{"order":{"id":1,"customer":"ACME"}}]</code>. Add <code>ROOT(\'orders\')</code> to wrap the array in an object: <code>{"orders":[…]}</code>.',
        '<code>FOR JSON AUTO</code> automatically infers nesting based on JOIN structure and column order — columns from the rightmost joined table are nested inside their parent row. It is convenient for simple hierarchical output but gives less control than PATH mode. For APIs and data contracts, use PATH mode with explicit aliases.',
        'Combining OPENJSON and FOR JSON PATH enables a complete JSON processing pipeline in T-SQL: shred an incoming JSON payload with OPENJSON, insert/update rows, then return results as JSON with FOR JSON PATH — all in a single stored procedure, useful for REST-style stored procedures called from application code.',
      ],
    },
    {
      heading: 'JSON modification in SQL Server — JSON_MODIFY',
      points: [
        '<code>JSON_MODIFY(col, path, newValue)</code> returns a <strong>new</strong> JSON string with the value at <code>path</code> replaced. It does not modify in place — it returns an NVARCHAR that you assign back: <code>SET Payload = JSON_MODIFY(Payload, \'$.status\', \'shipped\')</code>.',
        'Set a value to <code>NULL</code> (SQL NULL) to <strong>delete the key</strong>: <code>JSON_MODIFY(col, \'$.tempKey\', NULL)</code> removes <code>tempKey</code> from the JSON. To set a key to the JSON <code>null</code> literal instead, use <code>JSON_MODIFY(col, \'$.key\', CAST(\'null\' AS NVARCHAR(4)))</code>.',
        'To <strong>insert without overwriting</strong> (create-if-not-exists), prefix the path with <code>append</code> or use lax semantics. To <strong>append to an array</strong>: <code>JSON_MODIFY(col, \'append $.items\', @newItem)</code> — the <code>append</code> keyword pushes the value to the end of the specified JSON array.',
        'Chain multiple <code>JSON_MODIFY</code> calls to update several paths in one statement: <code>JSON_MODIFY(JSON_MODIFY(col, \'$.a\', @a), \'$.b\', @b)</code>. Each call returns a new string, and the next call modifies it further. Equivalent to a functional update pipeline.',
        '<code>JSON_MODIFY</code> with a JSON object or array as the new value requires you to pass it unescaped using <code>JSON_QUERY</code> as the value argument: <code>JSON_MODIFY(col, \'$.address\', JSON_QUERY(\'{"city":"London"}\'))</code>. Without <code>JSON_QUERY</code>, the object string would be double-encoded as a JSON string literal.',
      ],
    },
    {
      heading: 'PostgreSQL jsonb — operators, functions, and update patterns',
      points: [
        'PostgreSQL offers two JSON types: <code>json</code> (raw text, preserved order, re-parsed on access) and <code>jsonb</code> (binary, supports indexing, deduplicates keys, loses key order). <strong>Always use jsonb</strong> for queryable data — json is only useful when exact byte-for-byte preservation of the original string is required.',
        'Access operators: <code>col->\'key\'</code> returns the value as jsonb; <code>col->>\'key\'</code> returns text (castable, usable in WHERE). Use <code>->></code> for comparisons: <code>WHERE col->>\'status\' = \'active\'</code>. Navigate deeper: <code>col->\'address\'->>\'city\'</code> or the equivalent path operator <code>col#>>\'{address,city}\'</code>.',
        'Update a jsonb column with <code>jsonb_set(target, path_array, new_value)</code>: <code>UPDATE t SET data = jsonb_set(data, \'{status}\', \'"shipped"\') WHERE id = 1</code>. The path is a text array: <code>\'{address,city}\'</code>. Use the <strong>merge operator</strong> <code>||</code> to overlay a partial document: <code>SET data = data || \'{"status":"shipped","shipped_at":"2024-01-15"}\'</code> — right-side keys overwrite left-side.',
        'Delete a key with the <strong>subtraction/delete operator</strong>: <code>SET data = data - \'temp_field\'</code> (removes key). Delete by path: <code>SET data = data #- \'{address,zip}\'</code>. These operators return a new jsonb value — standard SQL UPDATE assigns it back to the column.',
        'Unnest a JSON array to rows with <code>jsonb_array_elements(col->\'items\')</code> — returns one row per array element as jsonb. <code>jsonb_array_elements_text()</code> returns text. <code>jsonb_each(col)</code> / <code>jsonb_each_text(col)</code> expand an object into key-value pairs — useful for dynamic column pivoting. Use these with LATERAL for per-row array unnesting.',
      ],
    },
    {
      heading: 'Indexing JSON — computed columns, GIN, and functional indexes',
      points: [
        '<strong>SQL Server</strong>: JSON path expressions cannot be indexed directly. The solution is a <em>persisted computed column</em>: <code>ALTER TABLE t ADD EmailExt AS JSON_VALUE(Payload, \'$.email\') PERSISTED</code>, then <code>CREATE INDEX ON t(EmailExt)</code>. PERSISTED stores the computed value physically — the index seek uses the materialised value instead of re-parsing JSON per row.',
        '<strong>PostgreSQL GIN index on full jsonb column</strong>: <code>CREATE INDEX ON t USING GIN (data)</code>. This single index supports <code>@></code> (containment), <code>?</code> (key existence), <code>?|</code> (any key), and <code>?&</code> (all keys) operators. GIN indexes can be large — only create them if you query the jsonb column with these operators frequently.',
        '<strong>PostgreSQL functional index on a specific path</strong>: <code>CREATE INDEX ON t ((data->>\'email\'))</code>. This is a B-tree index on the extracted text value — faster and smaller than a GIN index for single-path lookups. The query\'s WHERE clause must use the exact same expression: <code>WHERE data->>\'email\' = \'x@y.com\'</code>. Requires no GIN operator — any standard comparison works.',
        '<code>jsonb_path_ops</code> is an alternative GIN operator class for PostgreSQL that only supports <code>@></code> but produces a smaller index with faster lookups: <code>CREATE INDEX ON t USING GIN (data jsonb_path_ops)</code>. Choose <code>jsonb_ops</code> (default) when you need <code>?</code>/<code>?|</code>/<code>?&</code>; choose <code>jsonb_path_ops</code> when <code>@></code> is the only operator you use.',
        'Be cautious about GIN index size: a GIN index on a jsonb column containing deeply nested documents or large arrays can be 2–5× the size of the data. Partial GIN indexes (<code>WHERE col IS NOT NULL AND jsonb_typeof(col) = \'object\'</code>) can reduce index size. Benchmark with realistic data volumes before committing to a GIN index on a large table.',
      ],
    },
    {
      heading: 'JSON vs relational — design tradeoffs and hybrid schemas',
      points: [
        'Use <strong>relational columns</strong> for data you will query, filter, join, aggregate, or enforce constraints on. The SQL optimiser works best with typed, indexed columns. FK constraints, NOT NULL, UNIQUE, and CHECK cannot span into JSON. Statistics are only collected on regular columns — the optimiser is blind to JSON internals.',
        'Use <strong>JSON columns</strong> for: schema-flexible extension attributes (user preferences, feature flags per entity, configuration blobs); semi-structured data from external APIs where the schema varies by provider; event payloads that are stored but rarely queried deeply; EAV (entity-attribute-value) patterns where the attribute set varies per entity type.',
        'A <strong>hybrid schema</strong> is the most practical approach: core business attributes as typed columns (customerID, orderDate, status, total), with a JSON column (metadata JSONB) for extensible properties. This gives the optimiser columns to work with for common queries while preserving flexibility for variable attributes.',
        'Avoid using JSON as a substitute for proper normalisation when the schema is actually known and stable. Storing first_name and last_name inside a JSON column instead of real columns means no NULL constraints, no direct indexing, no FK relationships, and slower queries — all costs with no benefit if the schema is fixed.',
        'Interview context: "JSON in SQL" questions often test schema design judgment. The right answer is almost always the hybrid — not "never use JSON" (inflexible) and not "always use JSON" (loses relational guarantees). Know the tradeoffs: JSON is good for variability and flexibility; relational columns are good for integrity and performance.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SQL Server — JSON_VALUE / OPENJSON',
      language: 'sql',
      code: `-- ── Table with JSON column ────────────────────────────────────────────
CREATE TABLE Events (
    EventID  INT           NOT NULL IDENTITY PRIMARY KEY,
    Payload  NVARCHAR(MAX) NOT NULL CHECK (ISJSON(Payload) = 1)
);

INSERT INTO Events (Payload) VALUES
(N'{"type":"order","customerID":42,"items":[{"id":1,"qty":3},{"id":5,"qty":1}]}');

-- ── JSON_VALUE: extract scalar ─────────────────────────────────────────
SELECT
    EventID,
    JSON_VALUE(Payload, '$.type')                            AS EventType,
    CAST(JSON_VALUE(Payload, '$.customerID') AS INT)         AS CustomerID
FROM Events
WHERE JSON_VALUE(Payload, '$.type') = 'order';

-- ── JSON_QUERY: extract object/array fragment ─────────────────────────
SELECT
    EventID,
    JSON_QUERY(Payload, '$.items') AS ItemsJson   -- returns JSON array, not scalar
FROM Events;

-- ── OPENJSON: shred items array to rows ───────────────────────────────
SELECT e.EventID, j.id AS ProductID, j.qty AS Quantity
FROM Events e
CROSS APPLY OPENJSON(e.Payload, '$.items')
    WITH (id INT '$.id', qty INT '$.qty') AS j;  -- typed output columns

-- ── OPENJSON without schema — generic key/value/type ──────────────────
SELECT [key], value, type
FROM OPENJSON('{"name":"Alice","age":30,"active":true}');
-- key: name, value: Alice, type: 1 (string)
-- key: age,  value: 30,    type: 2 (number)
-- key: active, value: true, type: 5 (boolean)`,
    },
    {
      label: 'SQL Server — JSON_MODIFY & FOR JSON',
      language: 'sql',
      code: `-- ── JSON_MODIFY: update a scalar value ───────────────────────────────
UPDATE Events
SET Payload = JSON_MODIFY(Payload, '$.status', 'shipped')
WHERE EventID = 1;

-- ── JSON_MODIFY: delete a key (set to SQL NULL) ───────────────────────
UPDATE Events
SET Payload = JSON_MODIFY(Payload, '$.tempKey', NULL)   -- removes tempKey
WHERE EventID = 1;

-- ── JSON_MODIFY: append to array ──────────────────────────────────────
UPDATE Events
SET Payload = JSON_MODIFY(Payload, 'append $.items', JSON_QUERY('{"id":99,"qty":2}'))
WHERE EventID = 1;

-- ── JSON_MODIFY: chain multiple updates ───────────────────────────────
UPDATE Events
SET Payload = JSON_MODIFY(
                  JSON_MODIFY(Payload, '$.status', 'completed'),
                  '$.completedAt', CONVERT(NVARCHAR, GETDATE(), 127)
              )
WHERE EventID = 1;

-- ── FOR JSON PATH: rows to JSON with nesting ─────────────────────────
SELECT
    o.OrderID       AS 'order.id',
    o.OrderDate     AS 'order.date',
    c.CompanyName   AS 'order.customer.name',
    c.Country       AS 'order.customer.country'
FROM Orders o
JOIN Customers c ON o.CustomerID = c.CustomerID
FOR JSON PATH, ROOT('orders');
-- {"orders":[{"order":{"id":1,"date":"...","customer":{"name":"...","country":"..."}}}]}

-- ── FOR JSON AUTO: nesting inferred from JOINs ────────────────────────
SELECT c.CustomerID, c.CompanyName, o.OrderID, o.OrderDate
FROM Customers c
LEFT JOIN Orders o ON c.CustomerID = o.CustomerID
FOR JSON AUTO;`,
    },
    {
      label: 'PostgreSQL — jsonb operators',
      language: 'sql',
      code: `-- ── Create table ──────────────────────────────────────────────────────
CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    payload  JSONB NOT NULL
);

INSERT INTO events (payload) VALUES
('{"type":"order","customer_id":42,"items":[{"id":1,"qty":3}],"address":{"city":"London"}}');

-- ── -> / ->> access ───────────────────────────────────────────────────
SELECT
    event_id,
    payload->>'type'                    AS event_type,    -- text
    (payload->>'customer_id')::INT       AS customer_id,  -- cast to INT
    payload->'address'->>  'city'        AS city          -- nested path
FROM events;

-- ── Path operator: #> / #>> ────────────────────────────────────────────
SELECT payload#>>'{address,city}' AS city FROM events;  -- equivalent to ->>'city'

-- ── Containment @> (GIN-indexable) ────────────────────────────────────
SELECT * FROM events WHERE payload @> '{"type":"order"}';
SELECT * FROM events WHERE payload @> '{"address":{"city":"London"}}'; -- nested

-- ── Key existence ? / ?| / ?& ─────────────────────────────────────────
SELECT * FROM events WHERE payload ? 'items';              -- has 'items' key
SELECT * FROM events WHERE payload ?| ARRAY['type','kind'];-- has either key
SELECT * FROM events WHERE payload ?& ARRAY['type','items'];-- has both keys

-- ── Unnest array elements ──────────────────────────────────────────────
SELECT event_id, item->>'id' AS product_id, (item->>'qty')::INT AS qty
FROM events,
LATERAL jsonb_array_elements(payload->'items') AS item;`,
    },
    {
      label: 'PostgreSQL — jsonb update',
      language: 'sql',
      code: `-- ── jsonb_set: update a specific path ─────────────────────────────────
-- jsonb_set(target, path_text_array, new_value_jsonb, create_missing?)
UPDATE events
SET payload = jsonb_set(payload, '{status}', '"shipped"')
WHERE event_id = 1;
-- Note: the new value must be a jsonb literal — strings need extra quotes inside

-- ── Update nested path ─────────────────────────────────────────────────
UPDATE events
SET payload = jsonb_set(payload, '{address,city}', '"Paris"')
WHERE event_id = 1;

-- ── || merge operator: overlay / add keys (right overwrites left) ──────
UPDATE events
SET payload = payload || '{"status":"completed","completed_at":"2024-06-16"}'
WHERE event_id = 1;
-- Adds status and completed_at; existing keys not mentioned are preserved

-- ── - delete key ──────────────────────────────────────────────────────
UPDATE events
SET payload = payload - 'temp_field'      -- removes 'temp_field' key
WHERE event_id = 1;

-- ── #- delete at path ─────────────────────────────────────────────────
UPDATE events
SET payload = payload #- '{address,zip}'  -- removes nested zip key
WHERE event_id = 1;

-- ── jsonb_each: expand object keys to rows ────────────────────────────
SELECT event_id, key, value
FROM events,
LATERAL jsonb_each(payload)
WHERE event_id = 1;
-- Returns each top-level key as a row: type, customer_id, items, address`,
    },
    {
      label: 'Indexes on JSON',
      language: 'sql',
      code: `-- ══ SQL Server ════════════════════════════════════════════════════════

-- Persisted computed column: materialise the extracted value, then index it
ALTER TABLE Events
    ADD EventType AS JSON_VALUE(Payload, '$.type') PERSISTED;   -- stored on disk

CREATE INDEX IX_Events_EventType ON Events (EventType);

-- Now this seek uses the index:
SELECT EventID FROM Events WHERE EventType = 'order';

-- Multi-column computed index for common queries:
ALTER TABLE Events
    ADD CustomerID_ext AS CAST(JSON_VALUE(Payload, '$.customerID') AS INT) PERSISTED;

CREATE INDEX IX_Events_Customer_Type ON Events (CustomerID_ext, EventType);

-- ══ PostgreSQL ════════════════════════════════════════════════════════

-- GIN index on full jsonb column (supports @>, ?, ?|, ?&)
CREATE INDEX IX_events_payload ON events USING GIN (payload);
SELECT * FROM events WHERE payload @> '{"type":"order"}';   -- uses GIN index

-- jsonb_path_ops GIN: smaller index, only @> supported
CREATE INDEX IX_events_payload_path ON events USING GIN (payload jsonb_path_ops);

-- Functional B-tree index on specific path (single key, any comparison operator)
CREATE INDEX IX_events_type ON events ((payload->>'type'));
SELECT * FROM events WHERE payload->>'type' = 'order';  -- uses B-tree index

-- Partial index: only index active events (smaller, faster)
CREATE INDEX IX_events_active ON events USING GIN (payload)
WHERE payload->>'status' != 'archived';`,
    },
    {
      label: 'Hybrid schema pattern',
      language: 'sql',
      code: `-- ── Hybrid: typed core columns + jsonb extension ─────────────────────
-- Core attributes are relational; variable attributes go in jsonb
CREATE TABLE orders (
    order_id    SERIAL    PRIMARY KEY,
    customer_id INT       NOT NULL REFERENCES customers(customer_id),
    order_date  DATE      NOT NULL DEFAULT CURRENT_DATE,
    status      TEXT      NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','shipped','completed','cancelled')),
    total       NUMERIC(12,2) NOT NULL,
    -- Variable, rarely queried attributes:
    metadata    JSONB     DEFAULT '{}'::jsonb
);

-- Indexes on typed columns — full optimiser support:
CREATE INDEX IX_orders_customer ON orders (customer_id);
CREATE INDEX IX_orders_status   ON orders (status, order_date DESC);

-- Optional GIN index if metadata is queried for containment:
CREATE INDEX IX_orders_metadata ON orders USING GIN (metadata);

-- Query using relational columns (fast, indexed):
SELECT order_id, total, status
FROM orders
WHERE customer_id = 42 AND status = 'pending'
ORDER BY order_date DESC;

-- Query using jsonb metadata (less common, GIN-indexed if needed):
SELECT order_id, metadata->>'promo_code' AS PromoCode
FROM orders
WHERE metadata @> '{"channel":"mobile"}';

-- Update core column (relational — FK/CHECK enforced):
UPDATE orders SET status = 'shipped' WHERE order_id = 1;

-- Update jsonb metadata (flexible, no schema enforcement):
UPDATE orders
SET metadata = metadata || '{"tracking_id":"TRK123","shipped_at":"2024-06-16"}'
WHERE order_id = 1;`,
    },
  ];

  challenge: Challenge = {
    title: 'Query and Update a JSON Event Log',
    language: 'sql',
    description: `Given an Events table (<code>EventID INT, CreatedAt DATETIME2, Payload NVARCHAR(MAX)</code>) with JSON payloads:
<pre><code>{"type":"purchase","userID":123,"total":49.99,"currency":"USD","tags":["web","promo"]}</code></pre>
<ol>
<li>Return EventID, userID (as INT), and total (as DECIMAL) for all purchase events where total &gt; 100</li>
<li>Update all USD purchase events: set currency to "EUR" and append "converted" to the tags array</li>
<li>Add a persisted computed column <code>EventType</code> extracting <code>$.type</code>, and create an index on it</li>
</ol>`,
    hints: [
      'JSON_VALUE returns NVARCHAR — CAST to INT/DECIMAL for numeric operations',
      'JSON_MODIFY with \'$.currency\' to change currency; use \'append $.tags\' to push to array',
      'Chain two JSON_MODIFY calls for the update: JSON_MODIFY(JSON_MODIFY(...), ...)',
      'ALTER TABLE … ADD col AS JSON_VALUE(Payload, \'$.type\') PERSISTED; then CREATE INDEX',
    ],
    starterCode: `-- 1. Query: purchase events with total > 100
SELECT EventID, -- userID, total
FROM Events
WHERE -- type = purchase AND total > 100
;

-- 2. Update: change currency USD→EUR, append 'converted' to tags
UPDATE Events
SET Payload = -- chained JSON_MODIFY
WHERE -- currency = USD AND type = purchase
;

-- 3. Persisted computed column + index
ALTER TABLE Events ADD EventType AS -- ... PERSISTED;
CREATE INDEX -- on EventType;`,
    solution: `-- 1. Query
SELECT
    EventID,
    CAST(JSON_VALUE(Payload, '$.userID') AS INT)          AS UserID,
    CAST(JSON_VALUE(Payload, '$.total')  AS DECIMAL(10,2)) AS Total
FROM Events
WHERE JSON_VALUE(Payload, '$.type')  = 'purchase'
  AND CAST(JSON_VALUE(Payload, '$.total') AS DECIMAL(10,2)) > 100;

-- 2. Update (chained JSON_MODIFY)
UPDATE Events
SET Payload = JSON_MODIFY(
                  JSON_MODIFY(Payload, '$.currency', 'EUR'),
                  'append $.tags', 'converted'
              )
WHERE JSON_VALUE(Payload, '$.type')     = 'purchase'
  AND JSON_VALUE(Payload, '$.currency') = 'USD';

-- 3. Computed column + index
ALTER TABLE Events
    ADD EventType AS JSON_VALUE(Payload, '$.type') PERSISTED;

CREATE INDEX IX_Events_EventType ON Events (EventType);
-- Now: SELECT * FROM Events WHERE EventType = 'purchase' uses an index seek.`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In SQL Server, which data type is used to store JSON?',
      options: [
        'JSON — a native type added in SQL Server 2016',
        'JSONB — binary JSON',
        'NVARCHAR — SQL Server has no native JSON type; JSON is stored as strings',
        'XML — JSON is automatically converted to XML',
      ],
      answer: 2,
      explanation: 'SQL Server has no native JSON data type. JSON is stored as NVARCHAR(MAX) (or VARCHAR(MAX)). The JSON functions (JSON_VALUE, JSON_QUERY, OPENJSON, etc.) operate on NVARCHAR strings. Use CHECK (ISJSON(col) = 1) to validate format at write time.',
    },
    {
      q: 'In PostgreSQL, what is the key advantage of jsonb over json?',
      options: [
        'jsonb preserves key insertion order; json does not',
        'jsonb is stored in binary form, supports GIN indexing, and is faster to query; json re-parses the text on every access',
        'jsonb enforces a schema; json is schema-free',
        'jsonb supports arrays; json does not',
      ],
      answer: 1,
      explanation: 'json stores the raw text string and re-parses it on every access. jsonb stores a binary representation — faster to read, supports GIN indexes, deduplicates keys (last value wins), and loses key order. Always use jsonb for queryable data; json only when exact byte-for-byte string preservation is required.',
    },
    {
      q: 'Which PostgreSQL operator is GIN-indexable for JSON containment queries?',
      options: [
        '-> (arrow operator)',
        '->> (double-arrow operator)',
        '@> (containment operator)',
        '#>> (path text operator)',
      ],
      answer: 2,
      explanation: '@> is the containment operator: left_jsonb @> right_jsonb returns TRUE if the left value contains all key-value pairs of the right value. It is supported by GIN indexes on jsonb columns, enabling efficient containment searches across millions of rows.',
    },
    {
      q: 'How do you make a JSON path expression indexable in SQL Server?',
      options: [
        'Create a GIN index on the NVARCHAR column',
        'Add a persisted computed column using JSON_VALUE, then create a standard index on that column',
        'Use OPENJSON in a filtered index WHERE clause',
        'JSON paths are automatically indexed when the CHECK (ISJSON()) constraint is present',
      ],
      answer: 1,
      explanation: 'SQL Server cannot directly index a JSON expression. The solution: ALTER TABLE … ADD col AS JSON_VALUE(json_col, \'$.path\') PERSISTED — this stores the extracted value physically. Then CREATE INDEX ON t(col) creates a standard B-tree index on the extracted value, enabling seeks on JSON path predicates.',
    },
    {
      q: 'What does JSON_MODIFY(col, \'$.key\', NULL) do in SQL Server?',
      options: [
        'Sets the JSON value of key to the JSON null literal',
        'Removes the key from the JSON object entirely',
        'Sets the key to an empty string ""',
        'Raises an error — NULL is not valid in JSON_MODIFY',
      ],
      answer: 1,
      explanation: 'Passing SQL NULL as the new value to JSON_MODIFY removes the specified key from the JSON object. To set a key to the JSON null literal (not delete it), pass CAST(\'null\' AS NVARCHAR(4)) as the value instead.',
    },
    {
      q: 'What is the difference between the -> and ->> operators in PostgreSQL?',
      options: [
        '-> accesses arrays; ->> accesses objects',
        '-> returns the value as jsonb (for further JSON operations); ->> returns the value as text (for comparisons and output)',
        '-> is lax (returns NULL on missing key); ->> raises an error on missing key',
        '-> is for jsonb columns; ->> is for json columns',
      ],
      answer: 1,
      explanation: 'col->\'key\' returns the value as jsonb — you can chain further JSON operators on it. col->>\'key\' returns the value as a text string — useful for comparisons (WHERE col->>\'status\' = \'active\') and for passing to functions that expect text. Use ->> when you need to compare or cast the value.',
    },
    {
      q: 'When should you use a JSON column instead of a normalised relational column?',
      options: [
        'Always — JSON columns are more flexible and do not require schema changes',
        'Never — JSON defeats the purpose of a relational database',
        'For schema-flexible, variable-per-entity, or rarely-queried attributes; use relational columns for queryable, constrained, joinable data',
        'Only for string data — JSON cannot store numbers or booleans reliably',
      ],
      answer: 2,
      explanation: 'JSON columns are best for variable, schema-flexible data — user preferences, event metadata, extension attributes, API payloads — where the set of attributes differs per row and deep querying is rare. Relational columns are essential for data you filter, join, aggregate, or enforce constraints on. The practical pattern is a hybrid: core business columns relational, extension data in JSON.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use a JSON column or a relational table for structured data?',
      a: 'Use relational tables for data you query, filter, join, aggregate, or enforce constraints on. The optimiser works best with typed, indexed columns — FK, NOT NULL, UNIQUE, and CHECK constraints cannot span into JSON, and statistics are never collected on JSON internals. Use JSON for schema-flexible extras: event metadata, user preferences, EAV-style extension attributes, or external API payloads you store but rarely query deeply. The practical answer is almost always a hybrid schema: core columns relational, variable attributes in a JSON column.',
    },
    {
      q: 'Can I use OPENJSON result in a JOIN?',
      a: 'Yes. OPENJSON is a table-valued function — its result is a virtual table that can be joined like any table. Use CROSS APPLY to shred a JSON column per row and join the result to other tables: <code>FROM Orders o CROSS APPLY OPENJSON(o.ItemsJson) WITH (ProductID INT, Qty INT) AS items JOIN Products p ON items.ProductID = p.ProductID</code>. This pattern is used to normalise JSON-embedded arrays into relational rows for querying.',
    },
    {
      q: 'What is the performance impact of JSON_VALUE / ->> in a WHERE clause on millions of rows?',
      a: 'It causes a full table scan — the engine must parse every JSON string and evaluate the expression for every row. JSON path expressions on plain NVARCHAR (MSSQL) or jsonb columns (PostgreSQL) without an index are non-sargable. Fix: in MSSQL, add a persisted computed column + index; in PostgreSQL, create a functional index on <code>(col->>\'key\')</code> or a GIN index on the jsonb column for containment queries.',
    },
    {
      q: 'How do I validate that a required key exists in a PostgreSQL jsonb column?',
      a: 'Use the key-existence operator <code>?</code> in a CHECK constraint: <code>ALTER TABLE events ADD CONSTRAINT chk_has_type CHECK (payload ? \'type\')</code>. This enforces that the <code>type</code> key must be present in every jsonb payload. For deeper validation (required values, type constraints, enum validation) consider a trigger or application-layer validation — CHECK constraints cannot easily enforce JSON value semantics beyond key existence.',
    },
    {
      q: 'How does FOR JSON PATH differ from FOR JSON AUTO in SQL Server?',
      a: '<strong>FOR JSON PATH</strong>: you explicitly control nesting structure using dot-notation column aliases (<code>SELECT id AS \'order.id\', name AS \'order.customer.name\'</code>). Gives full control over the output shape — the recommended approach for API responses and data contracts. <strong>FOR JSON AUTO</strong>: nesting is inferred automatically from the JOIN structure and column order — child table columns are nested inside the parent\'s row. Convenient for simple hierarchical queries, but the output shape can change unexpectedly if you modify the JOIN or column order.',
    },
    {
      q: 'What is the difference between the jsonb || merge operator and jsonb_set() in PostgreSQL?',
      a: '<strong>|| (merge/concat)</strong>: merges two jsonb values. Right-side keys overwrite left-side keys; keys present only in the left are preserved. Best for adding/updating multiple top-level keys at once: <code>data || \'{"status":"shipped","shipped_at":"..."}\'</code>. Cannot target a nested path — only works at the top level of the document. <strong>jsonb_set()</strong>: updates a value at any path, including nested: <code>jsonb_set(data, \'{address,city}\', \'"Paris"\')</code>. Required for updating keys at depth, or when you want to control create-missing behaviour (the fourth parameter).',
    },
    {
      q: 'When should I choose a GIN index vs a functional B-tree index for jsonb in PostgreSQL?',
      a: '<strong>GIN index</strong>: one index supports multiple operators — <code>@></code>, <code>?</code>, <code>?|</code>, <code>?&</code>. Right for queries that use containment or key-existence checks on unpredictable paths, or when you query many different keys in the same jsonb document. Can be large. <strong>Functional B-tree index</strong>: <code>CREATE INDEX ON t ((data->>\'email\'))</code> — fast and small for a single known path with equality/range comparisons. Only supports queries using that exact path expression. Choose functional B-tree for high-frequency single-key lookups; choose GIN for multi-key containment or flexible path queries.',
    },
  ];
}
