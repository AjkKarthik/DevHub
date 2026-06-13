import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic { title: string; route: string; badge: string; description: string; keyPoints: string[]; available: boolean; }

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'CRUD': 'crud', 'Querying': 'querying',
  'Aggregation': 'aggregation', 'Schema Design': 'schema', 'Performance': 'performance',
  'Transactions': 'transactions', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'CRUD', 'Querying', 'Aggregation', 'Schema Design', 'Performance', 'Transactions', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'MongoDB Fundamentals', route: '/mongodb', badge: 'Foundations', description: 'Document model, collections, BSON data types, and how MongoDB differs from relational databases.', keyPoints: ['Document vs relational model', 'BSON types and ObjectId', 'Collections and databases', 'Atlas vs self-hosted', 'Compass GUI overview'], available: false },
  { title: 'Installation & Setup', route: '/mongodb', badge: 'Foundations', description: 'Install MongoDB locally and via Atlas, configure mongod, and connect with mongosh and drivers.', keyPoints: ['MongoDB Atlas free tier', 'Local mongod setup', 'mongosh REPL', 'Connection strings', 'Driver selection (Node/Python)'], available: false },
  { title: 'CRUD Operations', route: '/mongodb', badge: 'CRUD', description: 'insertOne/Many, find, updateOne/Many, deleteOne/Many — the core document manipulation API.', keyPoints: ['Insert documents with _id', 'find() and findOne()', 'Update operators ($set, $push)', 'deleteOne vs deleteMany', 'Upsert with {upsert:true}'], available: false },
  { title: 'Update Operators', route: '/mongodb', badge: 'CRUD', description: 'Field, array, and bitwise update operators: $set, $inc, $push, $pull, $addToSet, and more.', keyPoints: ['$set and $unset fields', '$inc for counters', '$push, $pull, $addToSet', '$rename fields', 'Array positional $ operator'], available: false },
  { title: 'Query Operators', route: '/mongodb', badge: 'Querying', description: 'Comparison, logical, element, and regex query operators for precise document matching.', keyPoints: ['$eq, $gt, $lt, $in, $nin', '$and, $or, $not, $nor', '$exists and $type', '$regex pattern matching', 'Querying nested documents'], available: false },
  { title: 'Array Queries', route: '/mongodb', badge: 'Querying', description: 'Query documents by array fields: $elemMatch, $all, $size, and positional operators.', keyPoints: ['$elemMatch for sub-documents', '$all matches all values', '$size exact array length', 'Dot notation array access', 'Nested array queries'], available: false },
  { title: 'Projections & Sorting', route: '/mongodb', badge: 'Querying', description: 'Include or exclude fields in results, sort documents, and paginate with skip and limit.', keyPoints: ['Inclusion vs exclusion projections', 'sort() on one or more fields', 'limit() and skip() pagination', 'Cursor iteration', '$slice for arrays'], available: false },
  { title: 'Aggregation Pipeline', route: '/mongodb', badge: 'Aggregation', description: 'Chain stages like $match, $group, $project, $sort, $lookup to transform and summarize data.', keyPoints: ['Pipeline stage ordering', '$match early for performance', '$group with $sum/$avg', '$project reshape documents', '$unwind arrays'], available: false },
  { title: '$lookup & Joins', route: '/mongodb', badge: 'Aggregation', description: 'Join documents across collections using $lookup for left outer join style queries.', keyPoints: ['Basic $lookup syntax', 'Pipeline $lookup (sub-pipeline)', 'Multiple join conditions', 'Performance considerations', 'Denormalization alternative'], available: false },
  { title: 'Aggregation Expressions', route: '/mongodb', badge: 'Aggregation', description: 'Arithmetic, string, date, array, and conditional expressions in $project and $addFields.', keyPoints: ['$add, $multiply, $divide', '$concat, $substr, $toLower', '$dateToString expressions', '$cond and $switch', '$map and $filter arrays'], available: false },
  { title: 'Schema Design Patterns', route: '/mongodb', badge: 'Schema Design', description: 'Embed vs reference patterns, bucket, polymorphic, extended reference, and outlier patterns.', keyPoints: ['Embed for 1:1 and 1:few', 'Reference for 1:many unbounded', 'Bucket pattern for time series', 'Polymorphic schema', 'Schema versioning pattern'], available: false },
  { title: 'Data Modelling', route: '/mongodb', badge: 'Schema Design', description: 'Model one-to-one, one-to-many, and many-to-many relationships in a document database.', keyPoints: ['One-to-one embedding', 'One-to-many with arrays', 'Many-to-many with references', 'Cardinality and growth patterns', 'Avoiding large documents'], available: false },
  { title: 'Indexes', route: '/mongodb', badge: 'Performance', description: 'Single-field, compound, multikey, text, geospatial, and TTL indexes — when and how to create them.', keyPoints: ['Default _id index', 'Compound index field order', 'Multikey for array fields', 'Text search indexes', 'TTL for expiring documents'], available: false },
  { title: 'Query Performance & explain()', route: '/mongodb', badge: 'Performance', description: 'Use explain() to analyse query plans, detect collection scans, and optimise indexes.', keyPoints: ['COLLSCAN vs IXSCAN', 'explain("executionStats")', 'Index hint forcing', 'Covered queries', 'Identifying slow queries'], available: false },
  { title: 'Transactions', route: '/mongodb', badge: 'Transactions', description: 'Multi-document ACID transactions with sessions, commit, and abort in replica set deployments.', keyPoints: ['Session-based transactions', 'startTransaction / commitTransaction', 'Rollback on abort', 'Performance overhead', 'Best practices to minimise scope'], available: false },
  { title: 'Change Streams', route: '/mongodb', badge: 'Transactions', description: 'Subscribe to real-time data changes on collections, databases, or a deployment using change streams.', keyPoints: ['watch() on collections', 'fullDocument option', 'Resume token for reliability', 'Use cases: event-driven apps', 'Requires replica set'], available: false },
  { title: 'Replication & Sharding', route: '/mongodb', badge: 'Reference', description: 'Replica sets for high availability and sharding for horizontal scaling — architecture and trade-offs.', keyPoints: ['Primary + secondary + arbiter', 'Read preferences', 'Shard key selection', 'Hashed vs ranged sharding', 'Zoned sharding'], available: false },
  { title: 'Security & Authentication', route: '/mongodb', badge: 'Reference', description: 'Authentication mechanisms, role-based access control, field-level encryption, and TLS.', keyPoints: ['SCRAM and X.509 auth', 'Built-in and custom roles', 'Field-level encryption', 'TLS for in-transit', 'Auditing access'], available: false },
  { title: 'MongoDB with Node.js', route: '/mongodb', badge: 'Reference', description: 'Official Node.js driver and Mongoose ODM — connecting, querying, and modelling documents.', keyPoints: ['MongoClient connection pooling', 'Mongoose schema + model', 'Mongoose middleware hooks', 'Lean queries for performance', 'Aggregation with driver'], available: false },
  { title: 'Atlas Search & Vector Search', route: '/mongodb', badge: 'Reference', description: 'Full-text search, autocomplete, faceted search, and vector similarity using Atlas Search.', keyPoints: ['Lucene-backed Atlas Search', '$search aggregation stage', 'Autocomplete operator', 'Vector search ($vectorSearch)', 'Hybrid search patterns'], available: false },
];

@Component({ selector: 'app-mongodb-home', standalone: true, imports: [RouterLink], templateUrl: './home.html', styleUrl: './home.scss' })
export class MongodbHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
