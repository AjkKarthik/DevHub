import { Component } from '@angular/core';
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
  selector: 'app-mongo-time-series',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './time-series.html',
  styleUrl: './time-series.scss',
})
export class MongoTimeSeries {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'Time Series Collection', desc: 'Purpose-built collection type (MongoDB 5.0+) for time-stamped measurements with automatic bucketing.' },
    { type: 'keyword', name: 'timeField',          desc: 'Required: the Date field that timestamps each measurement.' },
    { type: 'keyword', name: 'metaField',          desc: 'Optional: field identifying the data source (sensor ID, server hostname).' },
    { type: 'keyword', name: 'granularity',        desc: '"seconds" | "minutes" | "hours" — hint for optimal bucket sizing. Default: seconds.' },
    { type: 'keyword', name: 'expireAfterSeconds', desc: 'Auto-delete old documents. Works like TTL but more efficiently on time series collections.' },
    { type: 'keyword', name: 'Bucket Pattern',     desc: 'MongoDB internally groups measurements into bucket documents for storage efficiency.' },
    { type: 'keyword', name: '$setWindowFields',   desc: 'Window functions (running totals, moving averages) over ordered partitions — MongoDB 5.0+.' },
    { type: 'keyword', name: '$densify',           desc: 'Fill in missing time points in a series with null/interpolated values.' },
    { type: 'keyword', name: '$fill',              desc: 'Fill null/missing values using previous value (locf) or linear interpolation.' },
    { type: 'keyword', name: 'Columnar Storage',   desc: 'Time series collections use columnar compression internally — much smaller than row storage.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Time Series Collections',
      points: [
        'MongoDB 5.0 introduced <strong>time series collections</strong> — a purpose-built storage type for sequential time-stamped data. Internally, MongoDB automatically groups measurements into compressed bucket documents, providing 50–90% storage reduction compared to storing each measurement as a separate document.',
        'Create a time series collection with <code>db.createCollection("name", { timeseries: { timeField, metaField, granularity } })</code>. The <code>timeField</code> must be a Date field present in every document. The <code>metaField</code> identifies the data source (sensor ID, device name, stock ticker).',
        '<code>granularity</code> controls the bucket size: <code>"seconds"</code> (default — buckets ~1 hour), <code>"minutes"</code> (buckets ~24 hours), <code>"hours"</code> (buckets ~30 days). Choose based on your typical time between measurements — it affects compression efficiency.',
        'Measurements are inserted with <code>insertOne()</code> or <code>insertMany()</code> just like regular documents. The time series collection transparently handles bucketing. Query with standard find(), aggregation, and $match — MongoDB converts range queries to efficient bucket lookups.',
        'Time series collections support: <code>expireAfterSeconds</code> for automatic data retention, read-only views, and compound indexes on the metaField + timeField. They do NOT support: transactions, update/delete operations (data is append-only by design), unique indexes, or GridFS.',
      ],
    },
    {
      heading: 'Window Functions ($setWindowFields)',
      points: [
        '<code>$setWindowFields</code> (MongoDB 5.0+) enables <strong>window functions</strong> — computations over a sliding or expanding window of documents ordered by a field. Similar to SQL\'s <code>OVER (PARTITION BY ... ORDER BY ... ROWS ...)</code> clause.',
        'Common window function operations: <code>$sum</code> (running total), <code>$avg</code> (moving average), <code>$rank</code>/<code>$denseRank</code> (ranking), <code>$first</code>/<code>$last</code> (value at window boundary), <code>$shift</code> (look forward/backward N rows), <code>$derivative</code>/<code>$integral</code> (rate of change).',
        'Window types: <strong>document-based</strong> window <code>{ documents: [-5, 0] }</code> (current doc + 5 preceding docs), <strong>range-based</strong> window <code>{ range: [-3600000, 0], unit: "millisecond" }</code> (past 1 hour by time value).',
        'Use case: 7-day moving average temperature: partition by sensor, order by timestamp, window of last 7 days, apply $avg. Without $setWindowFields, this requires complex $group + $unwind chains.',
        '<code>partitionBy</code> divides documents into groups (like GROUP BY); each partition has its own independent window. <code>sortBy</code> orders documents within each partition for the window to slide over.',
      ],
    },
    {
      heading: '$densify and $fill',
      points: [
        '<code>$densify</code> fills in missing time points in a sparse time series. If you have readings at 9:00, 9:05, and 9:15 (missing 9:10), $densify inserts a document for 9:10 with null values for the measurement fields.',
        'Syntax: <code>{ $densify: { field: "timestamp", range: { step: 5, unit: "minute", bounds: "full" } } }</code>. The <code>bounds: "partition"</code> limits densification within each partition\'s min/max; <code>"full"</code> densifies across the entire date range.',
        '<code>$fill</code> replaces null values introduced by $densify (or naturally missing). Two methods: <code>locf</code> (Last Observation Carried Forward — use the previous non-null value) or <code>linear</code> (interpolate between surrounding values).',
        'Combined pipeline: $densify to create missing time points → $fill to interpolate missing values → $setWindowFields for moving averages → $group for hourly/daily rollups. This pattern produces clean, continuous time series suitable for charting.',
        'Use <code>$densify</code> before plotting time series data to avoid gaps in charts that would otherwise show jumps. Use $fill to make sensor readings look continuous during brief outages.',
      ],
    },
    {
      heading: 'Time Series Collection Design',
      points: [
        'MongoDB time series collections use a specialized internal storage format that automatically buckets related measurements together by time and metadata — dramatically improving both storage efficiency (via compression across similar values) and query performance for time-range queries compared to a regular collection.',
        'The metaField (identifying which entity a measurement belongs to, like a specific sensor or device) should be chosen carefully — grouping measurements by this field is what enables MongoDB\'s internal bucketing optimization to work effectively, so a good metaField choice groups genuinely related, similarly-timed measurements together.',
        'Granularity (seconds, minutes, or hours) tells MongoDB the expected time interval between consecutive measurements for the same metaField value, letting it optimize the internal bucket size accordingly — mismatched granularity (declaring "hours" for data actually arriving every second) reduces the effectiveness of the optimization.',
        'Time series collections integrate with standard aggregation pipeline operators for downsampling and analysis ($group by time bucket, moving averages via window functions) — making them suitable for both raw high-frequency data ingestion and the analytical queries typically run against that data afterward.',
      ],
    },
    {
      heading: 'Time Series Data Lifecycle Management',
      points: [
        'Time series data often needs automatic expiration — configuring a TTL (time-to-live) index or the built-in expireAfterSeconds option on a time series collection automatically removes data older than a retention window, essential for high-volume sensor/metrics data that would otherwise grow unboundedly.',
        'Downsampling (aggregating high-resolution recent data into lower-resolution historical summaries, like reducing per-second readings to per-hour averages after 30 days) balances storage cost against query needs — recent data typically needs full resolution, while older data is more often queried in aggregate.',
        'Time series collections have some operational restrictions compared to regular collections (limited update/delete flexibility for individual measurements, no support for certain index types) — worth understanding upfront since they are optimized specifically for high-volume append-only time-stamped data, not general-purpose flexible document storage.',
        'For genuinely massive time series workloads exceeding what a single MongoDB deployment can handle efficiently, sharding a time series collection by the metaField (distributing different entities\' data across shards) is the standard scaling approach, keeping each entity\'s time-ordered data together on one shard.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Create & Insert',
      language: 'typescript',
      code: `// Create a time series collection for IoT temperature sensors
await db.createCollection('temperatures', {
  timeseries: {
    timeField:   'timestamp',     // required: Date field
    metaField:   'sensorId',      // identifies data source (indexed automatically)
    granularity: 'seconds',       // seconds|minutes|hours — bucket size hint
  },
  expireAfterSeconds: 30 * 24 * 60 * 60, // delete after 30 days
});

// Insert a measurement (works like regular insertOne)
await db.collection('temperatures').insertOne({
  timestamp: new Date(),           // timeField — must be Date
  sensorId:  'sensor-001',         // metaField
  temperature: 22.5,               // measurement
  humidity:    65.2,
  location:    { lat: 51.5, lng: -0.1 },
});

// Bulk insert measurements
const readings = Array.from({ length: 1000 }, (_, i) => ({
  timestamp:   new Date(Date.now() - i * 60_000), // 1 reading per minute
  sensorId:    'sensor-001',
  temperature: 20 + Math.random() * 10,
  humidity:    60 + Math.random() * 20,
}));
await db.collection('temperatures').insertMany(readings);

// Query — same as regular find()
const lastHour = await db.collection('temperatures').find({
  sensorId:  'sensor-001',
  timestamp: { $gte: new Date(Date.now() - 3_600_000) },
}).sort({ timestamp: 1 }).toArray();`,
    },
    {
      label: 'Window Functions',
      language: 'typescript',
      code: `// 7-day moving average temperature per sensor
const movingAvg = await db.collection('temperatures').aggregate([
  { $match: {
    timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60_000) },
  }},
  { $setWindowFields: {
    partitionBy: '$sensorId',           // one window per sensor
    sortBy:      { timestamp: 1 },
    output: {
      movingAvgTemp: {
        $avg: '$temperature',
        window: { range: [-7, 0], unit: 'day' }, // last 7 days
      },
      runningMax: {
        $max: '$temperature',
        window: { documents: ['unbounded', 'current'] }, // from start to current
      },
      prevReading: {
        $shift: { output: '$temperature', by: -1 }, // previous document
      },
    },
  }},
  { $project: {
    timestamp:      1,
    sensorId:       1,
    temperature:    1,
    movingAvgTemp:  { $round: ['$movingAvgTemp', 1] },
    runningMax:     1,
    prevReading:    1,
  }},
]).toArray();

// Daily min/max/avg per sensor (regular aggregation)
const dailyStats = await db.collection('temperatures').aggregate([
  { $group: {
    _id: {
      sensorId: '$sensorId',
      date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
    },
    minTemp: { $min: '$temperature' },
    maxTemp: { $max: '$temperature' },
    avgTemp: { $avg: '$temperature' },
    count:   { $sum: 1 },
  }},
  { $sort: { '_id.date': -1 } },
]).toArray();`,
    },
    {
      label: '$densify & $fill',
      language: 'typescript',
      code: `// Densify + fill gaps in sparse time series for smooth chart display
const smoothedSeries = await db.collection('temperatures').aggregate([
  { $match: { sensorId: 'sensor-001', timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60_000) } } },

  // Step 1: densify — add missing 5-minute intervals
  { $densify: {
    field: 'timestamp',
    partitionByFields: ['sensorId'],
    range: {
      step:   5,
      unit:   'minute',
      bounds: 'partition', // use min/max of each partition as bounds
    },
  }},

  // Step 2: fill nulls using last-observation-carried-forward
  { $fill: {
    partitionBy: '$sensorId',
    sortBy:      { timestamp: 1 },
    output: {
      temperature: { method: 'locf' },    // carry forward last known temp
      humidity:    { method: 'linear' },  // interpolate humidity linearly
    },
  }},

  { $sort: { timestamp: 1 } },
]).toArray();

// Result: continuous 5-minute intervals with no gaps — ready for charting`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using a string timestamp instead of a Date object',
      wrong: `await col.insertOne({
  timestamp: '2024-01-15T10:00:00Z',  // string!
  sensorId: 'sensor-001',
  value: 22.5,
});
// Time series optimizations don't apply; range queries don't work correctly`,
      right: `await col.insertOne({
  timestamp: new Date('2024-01-15T10:00:00Z'), // Date object
  sensorId: 'sensor-001',
  value: 22.5,
});`,
      explanation: 'The timeField must be a BSON Date type. String dates are not optimised by the time series storage engine and don\'t enable efficient range queries, bucketing, or expiry. Always use new Date() or parse strings to Date before inserting.',
    },
    {
      title: 'Trying to update a measurement field in a time series document',
      wrong: `// Measurement fields (anything other than metaField) stay APPEND-ONLY
await col.updateOne({ _id: id }, { $set: { temperature: 25.0 } });
// Error: only the metaField can be updated, and only with multi:true`,
      right: `// Time series measurement data is immutable — append corrections as new documents
await col.insertOne({
  timestamp: new Date(),
  sensorId: 'sensor-001',
  temperature: 25.0,       // corrected reading
  isCorrected: true,
  correctionOf: originalTimestamp,
});
// Query: use the latest reading or filter by isCorrected flag`,
      explanation: 'Since MongoDB 5.1+, updates on time series collections are allowed ONLY on the metaField (matching and modifying it, with multi:true required, upsert forbidden) — measurement fields like temperature stay append-only, so the wrong example above still fails. Deletes ARE supported (since 5.1+, with most restrictions removed in 7.0+), just less efficient than on a regular collection, since a bucket may need to be decompressed and re-compressed. If a measurement was wrong, insert a correction document with a flag rather than trying to edit the original value in place.',
    },
    {
      title: 'Not specifying granularity matching the measurement interval',
      wrong: `// Writing once per hour but using default "seconds" granularity
await db.createCollection('metrics', {
  timeseries: { timeField: 'timestamp', granularity: 'seconds' }, // buckets too small
});
// Results in poorly filled buckets — less compression, more overhead`,
      right: `// Match granularity to measurement interval
await db.createCollection('metrics', {
  timeseries: {
    timeField:   'timestamp',
    granularity: 'hours',   // 1 reading/hour → hours granularity
  },
});`,
      explanation: 'The granularity parameter hints to MongoDB how to size internal buckets. If you write once per hour but use "seconds" granularity, each bucket holds very few measurements (poor compression). Match granularity to your actual measurement interval for optimal storage efficiency.',
    },
    {
      title: 'Forgetting that time series collections require a metaField index for filtering',
      wrong: `// Querying by sensorId on a large time series collection
// No index on sensorId other than what time series auto-creates...
col.find({ sensorId: 'sensor-999', timestamp: { $gte: yesterday } })
// Scans all buckets if sensorId is not the metaField`,
      right: `// Set sensorId as the metaField when creating the collection
await db.createCollection('temps', {
  timeseries: {
    timeField: 'timestamp',
    metaField: 'sensorId', // auto-indexed; used efficiently in queries
  },
});
// Queries on sensorId + timestamp range use the metaField index automatically`,
      explanation: 'The metaField is automatically indexed and used to route queries to the correct buckets. If you frequently filter by a "device ID" or "sensor ID" field, it should be the metaField. Filtering on a non-metaField requires scanning all buckets within the time range.',
    },
  ];

  challenge: Challenge = {
    title: 'Server Metrics Collector',
    language: 'typescript',
    description: 'Create a time series collection for server CPU metrics (hostname as metaField, timestamp, cpuPercent, memPercent). Write: (1) recordMetric(hostname, cpuPercent, memPercent), (2) getHourlyStats(hostname, hours=24) that returns hourly min/max/avg CPU over the period, (3) getMovingAvg(hostname, windowMinutes=5) using $setWindowFields.',
    hints: [
      'Create the collection once at startup with timeseries config and expireAfterSeconds.',
      'getHourlyStats: $match → $group by hour ($dateToString with format "%Y-%m-%dT%H") → $sort.',
      'getMovingAvg: $setWindowFields with range: [-windowMinutes, 0] unit: "minute" for $avg.',
    ],
    starterCode: `import { MongoClient } from 'mongodb';
const db = (new MongoClient('mongodb://localhost:27017')).db('monitoring');

async function setupCollection() {
  // TODO: create time series collection
}

async function recordMetric(hostname: string, cpuPercent: number, memPercent: number) {
  // TODO: insert measurement
}

async function getHourlyStats(hostname: string, hours = 24) {
  // TODO: hourly min/max/avg
}

async function getMovingAvg(hostname: string, windowMinutes = 5) {
  // TODO: $setWindowFields moving average
}`,
    solution: `import { MongoClient } from 'mongodb';
const db = (new MongoClient('mongodb://localhost:27017')).db('monitoring');

async function setupCollection() {
  try {
    await db.createCollection('server_metrics', {
      timeseries: {
        timeField:   'timestamp',
        metaField:   'hostname',
        granularity: 'seconds',
      },
      expireAfterSeconds: 7 * 24 * 60 * 60, // keep 7 days
    });
  } catch (e: any) {
    if (e.codeName !== 'NamespaceExists') throw e;
  }
}

async function recordMetric(hostname: string, cpuPercent: number, memPercent: number) {
  await db.collection('server_metrics').insertOne({
    timestamp: new Date(),
    hostname,
    cpuPercent,
    memPercent,
  });
}

async function getHourlyStats(hostname: string, hours = 24) {
  return db.collection('server_metrics').aggregate([
    { $match: { hostname, timestamp: { $gte: new Date(Date.now() - hours * 3600_000) } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%dT%H', date: '$timestamp' } },
      minCpu: { $min: '$cpuPercent' },
      maxCpu: { $max: '$cpuPercent' },
      avgCpu: { $avg: '$cpuPercent' },
      count:  { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ]).toArray();
}

async function getMovingAvg(hostname: string, windowMinutes = 5) {
  return db.collection('server_metrics').aggregate([
    { $match: { hostname, timestamp: { $gte: new Date(Date.now() - 60 * 60_000) } } },
    { $setWindowFields: {
      partitionBy: '$hostname',
      sortBy:      { timestamp: 1 },
      output: {
        movingAvgCpu: { $avg: '$cpuPercent', window: { range: [-windowMinutes, 0], unit: 'minute' } },
        movingAvgMem: { $avg: '$memPercent', window: { range: [-windowMinutes, 0], unit: 'minute' } },
      },
    }},
  ]).toArray();
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main storage advantage of time series collections?',
      options: [
        'They store data in JSON format instead of BSON',
        'They use columnar bucketing with compression — 50-90% smaller than regular documents',
        'They compress only the timestamp field',
        'They automatically shard across multiple nodes',
      ],
      answer: 1,
      explanation: 'Time series collections automatically group measurements into internally compressed bucket documents using columnar storage. Measurements from the same source in the same time window share a bucket, achieving 50–90% storage reduction compared to one document per measurement.',
    },
    {
      q: 'What does the metaField in a time series collection do?',
      options: [
        'It stores metadata about the collection schema',
        'It identifies the data source (e.g., sensor ID) and is automatically indexed',
        'It encrypts sensitive measurement data',
        'It defines the schema validation rules',
      ],
      answer: 1,
      explanation: 'The metaField identifies the data source for each measurement (e.g., device ID, server hostname, stock ticker). It is automatically indexed and used to route queries efficiently to the correct buckets, avoiding full scans of buckets from unrelated sources.',
    },
    {
      q: 'Which MongoDB version introduced Time Series collections?',
      options: ['MongoDB 4.4', 'MongoDB 5.0', 'MongoDB 6.0', 'MongoDB 7.0'],
      answer: 1,
      explanation: 'Time series collections were introduced in MongoDB 5.0 (2021). Window functions ($setWindowFields), $densify, and $fill were also introduced in MongoDB 5.0.',
    },
    {
      q: 'What does $setWindowFields enable in aggregation?',
      options: [
        'Setting fields in multiple documents at once',
        'Running computations over a sliding window of ordered documents (like SQL window functions)',
        'Windowed database views',
        'Configuring WiredTiger cache windows',
      ],
      answer: 1,
      explanation: '$setWindowFields (MongoDB 5.0+) enables window functions — computations over a subset (window) of documents ordered by a field. Examples: moving averages, running totals, rank, and look-back/look-forward operations. Equivalent to SQL\'s OVER (PARTITION BY ... ORDER BY ...) clause.',
    },
    {
      q: 'Can you update a document in a time series collection?',
      options: [
        'Yes, with updateOne()',
        'Only with replaceOne()',
        'No — time series collections are append-only',
        'Yes, but only the metaField',
      ],
      answer: 3,
      explanation: 'Since MongoDB 5.1+, updates are allowed on time series collections, but strictly limited to the metaField — you can only match on and modify the metaField value, multi:true is required, and upsert is forbidden. Measurement fields (like temperature) remain immutable by design. Insert correction documents if a measurement value was wrong.',
    },
    { q: 'What are time series collections in MongoDB and what advantages do they provide over regular collections?', options: ['Time series collections are regular collections with a mandatory createdAt index that MongoDB manages automatically for TTL expiration', 'Time series collections are a specialized collection type optimized for storing time-stamped data — MongoDB internally clusters documents by time and metadata, compresses data automatically, and provides efficient time-range queries', 'Time series collections replace the Bucket Pattern by storing all measurements in a single document that grows indefinitely until a new collection is started each day', 'Time series collections are Atlas-only features that enable real-time streaming inserts without write latency'], answer: 1, explanation: 'Time series collections (MongoDB 5.0+): created with db.createCollection("sensorData", { timeseries: { timeField: "timestamp", metaField: "metadata", granularity: "seconds" } }). Automatic bucketing: MongoDB internally implements the Bucket Pattern — groups measurements by time window and metadata. Storage compression: time-stamped values often have similar patterns. MongoDB uses delta encoding and dictionary compression on the column-oriented internal storage. Result: significantly smaller storage compared to regular collections (often 50-90% smaller for repetitive sensor data). Query efficiency: range queries on the timeField use internal bucket metadata to skip irrelevant buckets without scanning individual measurements. metaField indexing: queries on metadata (device ID, sensor type) are automatically supported via the internal bucket structure. Limitations: documents in time series collections are immutable once written (no updates). Deletes are supported but inefficient. No unique indexes other than the time + meta compound. No transactions within time series collections. Automatic deletion: set expireAfterSeconds on creation for automatic TTL-based data expiration.' },
    { q: 'How does the TTL (Time-To-Live) index work in MongoDB for automatic document expiration?', options: ['A TTL index is a special type of unique index that rejects documents with duplicate timestamp values after the specified expiry window', 'A TTL index on a Date field causes MongoDB to automatically delete documents where the indexed date field value plus the expireAfterSeconds setting is in the past', 'TTL indexes work by compressing documents older than the specified time and moving them to a cold storage collection automatically', 'A TTL index is applied per-shard and each shard independently manages expiration without coordination from the mongos router'], answer: 1, explanation: 'TTL index creation: db.logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }). This deletes documents where createdAt + 86400 seconds (24 hours) < current time. How expiration works: MongoDB runs a background thread (TTLMonitor) that checks TTL indexes every 60 seconds. Documents where (dateFieldValue + expireAfterSeconds) < now are deleted in batches. Expiration is not exact to the second — there can be up to 60 seconds of delay plus the time needed to delete the batch. Single-field Date only: TTL indexes must be on a single Date field. Compound indexes cannot be TTL indexes. Cannot use on embedded sub-fields. Array of dates: if the indexed field is an array of Dates, the document expires when the earliest date in the array is past the TTL threshold. Adjusting expiry: db.runCommand({ collMod: "logs", index: { keyPattern: { createdAt: 1 }, expireAfterSeconds: 3600 } }). Time series TTL: set expireAfterSeconds directly on collection creation — more efficient than a TTL index on a time series collection since it uses bucket metadata.' },
    { q: 'What are window functions in MongoDB aggregation and when are they useful?', options: ['Window functions in MongoDB are $filter expressions that restrict aggregation to a moving window of array elements', 'Window functions compute values across a range of documents related to the current document (a sliding window), enabling calculations like moving averages, running totals, and rank without self-joins or multiple pipeline passes', 'Window functions are a UI feature in MongoDB Compass that creates visual time windows for query filtering without writing aggregation pipeline stages', 'Window functions aggregate data into fixed-size tumbling windows (e.g., 5-minute buckets) and store the results in a new collection automatically'], answer: 1, explanation: 'Window functions (MongoDB 5.0+): available via $setWindowFields stage. Compute a value for each document based on a window (range of related documents). Syntax: { $setWindowFields: { partitionBy: "", sortBy: { timestamp: 1 }, output: { movingAvg: { $avg: "", window: { range: [-5, 0], unit: "minute" } }, runningTotal: { $sum: "", window: { documents: ["unbounded", "current"] } }, rank: { $rank: {} } } } }. Window types: documents window: { documents: [N, M] } — N and M are relative document offsets. range window: { range: [N, M], unit: time_unit } — time-based range. Common window functions: $avg, $sum, $min, $max: aggregation functions applied over the window. $rank, $denseRank: ranking within the partition. $documentNumber: sequential row number. $shift: access the value of a field N documents before or after. $derivative: rate of change per unit time. $integral: area under the curve. Use cases: IoT sensor smoothing (moving average removes noise). Financial time series (rolling 7-day revenue). Leaderboards with ranking.' },
    { q: 'What granularity options exist for MongoDB time series collections and how does granularity affect storage?', options: ['Granularity is an optional hint only — MongoDB automatically determines the optimal granularity based on observed insert patterns and changes it dynamically', 'Granularity (seconds, minutes, or hours) tells MongoDB the expected time between measurements — setting it correctly aligns the internal bucket boundaries with actual data patterns, maximizing compression and bucket reuse', 'Granularity controls the resolution of stored timestamps — seconds granularity stores full timestamps, minutes rounds to the minute, hours rounds to the hour', 'Granularity only affects TTL expiration precision — finer granularity means TTL expires documents closer to the exact expireAfterSeconds boundary'], answer: 1, explanation: 'Granularity options: seconds: bucket spans 1 hour (up to 3600 measurements per bucket). Use when data arrives every few seconds. minutes: bucket spans 24 hours (up to 1440 minutes per bucket). Use when data arrives every few minutes. hours: bucket spans 30 days. Use for hourly or less frequent data. How granularity affects storage: MongoDB creates a new bucket when the time since the bucket start exceeds the bucket span OR when the metaField changes. Correct granularity = fewer, fuller buckets = better compression. Mismatched granularity: if you use hours granularity for per-second data, each measurement starts a new bucket (time since last bucket start > hours threshold). You get millions of single-measurement buckets with no compression benefit. Changing granularity: db.runCommand({ collMod: "col", timeseries: { granularity: "minutes" } }). Can only increase granularity (seconds → minutes → hours), not decrease. Existing buckets are not re-bucketed. Custom buckets (MongoDB 6.3+): bucketMaxSpanSeconds and bucketRoundingSeconds for precise control beyond the three preset options.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use a time series collection vs a regular collection?',
      a: 'Use a <strong>time series collection</strong> when: you\'re storing sequential measurements over time (IoT sensor data, metrics, financial tick data, event logs), each document has a timestamp that\'s the primary ordering axis, data is append-only, and you need efficient range queries by time. Use a <strong>regular collection</strong> when: documents are updated frequently, you need transactions across documents, or the data isn\'t fundamentally time-ordered measurements.',
    },
    {
      q: 'What is the Bucket Pattern and how is it different from time series collections?',
      a: 'The <strong>Bucket Pattern</strong> is a manual schema design technique where you group related data points into bucket documents (e.g., 60 readings per hour in one document). You manage the bucketing logic yourself. <strong>Time series collections</strong> are MongoDB\'s built-in implementation of this pattern — MongoDB handles bucketing, compression, and indexing automatically. For new workloads, always prefer time series collections over manually implementing the bucket pattern. Manual bucketing is only needed if you require MongoDB versions < 5.0.',
    },
    {
      q: 'How do I downsample time series data (e.g., minute data → hourly rollups)?',
      a: 'Use aggregation with <code>$group</code> by time unit: <code>{ $group: { _id: { $dateToString: { format: "%Y-%m-%dT%H", date: "$timestamp" } }, avgTemp: { $avg: "$temperature" }, count: { $sum: 1 } } }</code>. Combine with <code>$out</code> or <code>$merge</code> to persist the rollup to a separate collection. Run this as a scheduled job (e.g., every hour) to maintain pre-computed rollup collections at different granularities. MongoDB Atlas also offers automated data rollups via Atlas Data Federation or Scheduled Triggers.',
    },
    {
      q: 'What is the difference between $densify "partition" bounds and "full" bounds?',
      a: '<code>bounds: "partition"</code> densifies time points between the minimum and maximum timestamps within each partition. If sensor A has readings from 9:00–10:00 and sensor B from 8:00–9:00, each gets densified within its own range. <code>bounds: "full"</code> densifies across the global minimum and maximum timestamp in the entire dataset — every partition gets densified for the full date range, even if it had no readings during part of that range. Use "partition" when each source has its own natural time range; use "full" when you want all sources aligned to the same time grid.',
    },
    {
      q: 'How does expireAfterSeconds work on time series collections?',
      a: 'It works like a TTL index but is implemented more efficiently. When you specify <code>expireAfterSeconds: N</code> on a time series collection, MongoDB automatically deletes entire <em>buckets</em> when all their measurements are older than N seconds. This is more efficient than document-level TTL (which deletes one document at a time) because entire compressed buckets are dropped at once. The expiry is checked periodically (approximately every 60 seconds).',
    },
    { q: 'How do you efficiently query time series data in MongoDB?', a: 'Efficient time series queries: always filter on the timeField (or metaField) to take advantage of bucket-level pruning. MongoDB stores bucket min/max time metadata, so time range queries skip entire buckets that do not overlap the query range. Efficient: db.sensorData.find({ timestamp: { $gte: startDate, $lte: endDate }, "metadata.deviceId": "sensor-01" }). Inefficient: db.sensorData.find({ temperature: { $gt: 100 } }) — no time filter means scanning all buckets. Indexes on time series: the timeField and metaField have automatic indexes. Additional indexes on other metadata fields can be created: db.sensorData.createIndex({ "metadata.location": 1 }). Aggregation on time series: use $dateTrunc to bucket timestamps before grouping: { $group: { _id: { $dateTrunc: { date: "", unit: "hour" } }, avgTemp: { $avg: "" } } }. Time series with $setWindowFields: use partitionBy on deviceId and sortBy on timestamp for per-device moving averages. avoid $unwind: time series collections store compressed internal documents — avoid stages that need to materialize all documents before filtering. Apply $match with time and metadata filters as early as possible.' },
    { q: 'What happens to bucketing efficiency if you accidentally include a rapidly-changing field (like the exact sensor reading value itself) inside the metaField object instead of leaving it in the main document body?', a: 'Since MongoDB creates a SEPARATE bucket for every distinct metaField value, including a field that changes on nearly every document (like the actual measurement value) inside metaField makes each document\'s metaField effectively unique — collapsing the pattern to nearly one document per bucket, which defeats the entire point of time series collections (compression and reduced index overhead come from grouping MANY readings from the same source into one bucket). The metaField should contain only STABLE identifying attributes of the source (deviceId, location, ticker symbol) — the actual time-varying measurement values belong in the regular document fields outside metaField, which is what allows many readings from the same source to share a bucket.' },
    { q: 'Why is $merge generally preferred over $out when running a downsampling aggregation on a SCHEDULE (e.g. nightly), rather than as a one-time operation?', a: '$out completely REPLACES the entire target collection with the aggregation\'s current output — running a nightly downsampling job with $out would wipe out all previously-computed historical summary buckets each time, leaving only whatever the latest run\'s $match window covered. $merge instead upserts into the existing target collection, updating or inserting only the specific summary documents produced by that run (e.g. just today\'s hourly buckets) while leaving all previously-written historical summaries untouched — this incremental-merge behavior is essential for a recurring scheduled job that needs to keep accumulating summary history over time rather than overwriting it on every run.' },
    { q: 'What are the limitations and restrictions of MongoDB time series collections?', a: 'Immutability: measurements cannot be updated (no $set, $inc, etc. on individual documents). Time series data is assumed to be write-once by design. Workaround: if correction is needed, delete and re-insert (inefficient), or keep a corrections collection. Deletes: supported but less efficient than regular collections (requires decompressing the bucket, removing the document, and potentially re-compressing). Batch deletes by time range are more efficient than individual deletes. No transactions: time series collection writes cannot participate in multi-document transactions. Schema: all documents must have the timeField. The metaField (if set) must be present. Other fields are flexible. No unique indexes: only the default time + meta compound index. Cannot enforce uniqueness on other fields. Index restrictions: no partial indexes. No text indexes. No sparse indexes. Secondary indexes are supported but more limited than regular collections. $lookup from time series: time series collections can be the source of a $lookup pipeline but have some restrictions on the from side. No capped collections: time series collections handle retention via expireAfterSeconds — capped collection semantics do not apply. Not supported in transactions: cannot use time series collections inside multi-document transactions.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'MongoDB 5.0+ time series collections auto-bucket measurements for 50-90% storage savings; append-only; query like regular collections.',
    mustKnow: [
      'Create with timeseries: { timeField: "timestamp", metaField: "deviceId", granularity: "seconds" }',
      'timeField must be a Date object (not string)',
      'metaField = data source identifier, auto-indexed for efficient partitioned queries',
      'Append-only — no updates or deletes; insert correction documents instead',
      '$setWindowFields: window functions (moving avg, running total, rank) — MongoDB 5.0+',
      '$densify: fill missing time points; $fill: interpolate null values (locf or linear)',
      'expireAfterSeconds deletes entire buckets — more efficient than document-level TTL',
    ],
    interviewFocus: [
      'Why time series collections vs regular collections (bucketing, compression, append-only)',
      'metaField purpose and auto-indexing',
      '$setWindowFields for moving averages (range-based window)',
      '$densify + $fill for gap filling in charts',
      'Downsampling pattern: $group by hour/day + $out to rollup collection',
    ],
  };
}
