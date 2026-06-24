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
      title: 'Trying to update or delete time series documents',
      wrong: `// Time series collections are APPEND-ONLY
await col.updateOne({ _id: id }, { $set: { temperature: 25.0 } });
// Error: update not supported for time series collections`,
      right: `// Time series data is immutable — append corrections as new documents
await col.insertOne({
  timestamp: new Date(),
  sensorId: 'sensor-001',
  temperature: 25.0,       // corrected reading
  isCorrected: true,
  correctionOf: originalTimestamp,
});
// Query: use the latest reading or filter by isCorrected flag`,
      explanation: 'Time series collections are append-only — updates and deletes are not supported. If a measurement was wrong, insert a correction document with a flag. For analysis, use the most recent or the corrected value. This is by design: time series data represents historical facts.',
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
      answer: 2,
      explanation: 'Time series collections are append-only by design — update and delete operations are not supported. This reflects the immutable nature of historical measurement data. Insert correction documents if a measurement was wrong.',
    },
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
