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
  selector: 'app-mongo-installation-setup',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './installation-setup.html',
  styleUrl: './installation-setup.scss',
})
export class MongoInstallationSetup {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: 'mongod',         desc: 'MongoDB server daemon. Default port 27017. Data directory: /data/db (Linux/Mac) or C:\\data\\db (Windows).' },
    { type: 'keyword', name: 'mongosh',         desc: 'Modern MongoDB Shell (Node.js-based). Run mongosh to connect to localhost:27017.' },
    { type: 'keyword', name: 'mongodump',       desc: 'Binary export of a database/collection. Pairs with mongorestore.' },
    { type: 'keyword', name: 'mongorestore',    desc: 'Import BSON dumps created by mongodump.' },
    { type: 'keyword', name: 'mongoexport',     desc: 'Export documents as JSON or CSV. Pairs with mongoimport.' },
    { type: 'keyword', name: 'mongoimport',     desc: 'Import JSON/CSV data. Use --jsonArray for arrays.' },
    { type: 'keyword', name: 'Connection String', desc: 'mongodb://[user:pass@]host[:port]/db or mongodb+srv://... for Atlas SRV connections.' },
    { type: 'keyword', name: 'Docker Image',    desc: 'mongo:7 official image. Use -e MONGO_INITDB_ROOT_USERNAME for auth setup.' },
    { type: 'keyword', name: 'Mongoose',        desc: 'Node.js ODM that adds schema, validation, and middleware on top of the MongoDB driver.' },
    { type: 'keyword', name: '.env',            desc: 'Store connection string in MONGODB_URI env var; never hardcode credentials in source.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Installation Options',
      points: [
        '<strong>MongoDB Atlas (Recommended for cloud)</strong> — fully managed cloud service. Create a free M0 cluster at cloud.mongodb.com in under 5 minutes. No server to manage. Ideal for production and for learners who don\'t want to install anything locally.',
        '<strong>Docker (Recommended for local dev)</strong> — <code>docker run -d -p 27017:27017 --name mongo mongo:7</code> gives you a clean MongoDB 7 instance instantly. Data is ephemeral by default (add <code>-v</code> to persist). Easy to version-lock and tear down.',
        '<strong>MongoDB Community Edition</strong> — install on Linux (apt/yum), macOS (Homebrew: <code>brew tap mongodb/brew && brew install mongodb-community</code>), or Windows (MSI installer from mongodb.com). Runs as a system service. Best when you need direct filesystem access.',
        '<strong>MongoDB Enterprise</strong> — adds encrypted storage engine, LDAP auth, auditing, and Ops Manager. Requires a license. For enterprise compliance requirements.',
        'For development, prefer Docker or Atlas. It avoids "works on my machine" configuration drift and gives you a consistent, version-pinned environment across the team.',
      ],
    },
    {
      heading: 'Connection Strings',
      points: [
        '<strong>Standard format</strong>: <code>mongodb://[username:password@]host1[:port1][,...hostN[:portN]][/defaultauthdb][?options]</code>. Example: <code>mongodb://alice:password@localhost:27017/myapp</code>.',
        '<strong>SRV format (Atlas/replica sets)</strong>: <code>mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority</code>. The +srv scheme uses DNS SRV and TXT records to discover all replica set members automatically — no need to list each host.',
        'Key options in the connection string: <code>retryWrites=true</code> (auto-retry transient write failures — enabled by default in Atlas); <code>w=majority</code> (write concern — wait until majority of replica set confirms write); <code>authSource=admin</code> (auth against the admin database); <code>tls=true</code> (enable TLS).',
        'Always store the connection string in an environment variable (<code>MONGODB_URI</code>). Use <code>dotenv</code> in Node.js. Never commit credentials to version control. Atlas connection strings include username/password in the URL — treat them like API keys.',
        'To mask credentials in logs, parse the URI and redact the password: <code>new URL(uri).password = "****"</code>. The MongoDB driver does NOT redact passwords from error logs automatically.',
      ],
    },
    {
      heading: 'Driver Setup (Node.js)',
      points: [
        '<strong>Official driver</strong>: <code>npm install mongodb</code>. Import <code>MongoClient</code>. The driver is TypeScript-ready — pass a generic type to <code>db.collection\<MyType\>()</code> for typed queries.',
        '<strong>Mongoose ODM</strong>: <code>npm install mongoose</code>. Adds schemas, model classes, validation hooks (pre/post save), and virtuals. Best for applications where data consistency is enforced at the application layer. Adds ~30 KB to bundle.',
        'Connection pattern for Express/Fastify: connect once at startup, pass <code>db</code> reference to route handlers via middleware or dependency injection. Use <code>MongoClient.connect()</code> (or Mongoose <code>connect()</code>) before <code>app.listen()</code>.',
        'The Node.js driver maintains a connection pool (default max 100 connections). Configure with <code>maxPoolSize</code> option. Each request reuses an existing connection from the pool rather than opening a new TCP connection.',
        '<strong>TypeScript</strong>: define interfaces for your documents, pass them to <code>Collection\<T\></code>. The driver will type <code>findOne()</code> results as <code>T | null</code>, catching shape mismatches at compile time.',
      ],
    },
    {
      heading: 'Docker Quick-start',
      points: [
        'Pull and run: <code>docker run -d -p 27017:27017 --name mongodb -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=secret mongo:7</code>. The <code>MONGO_INITDB_ROOT_*</code> variables create an admin user in the admin database.',
        'Persist data with a volume: add <code>-v mongodb_data:/data/db</code>. Without this, data is lost when the container is removed. Named volumes survive <code>docker stop/rm</code>.',
        'Use Docker Compose for multi-service setups (MongoDB + your API + Redis): define a <code>mongo</code> service in <code>docker-compose.yml</code> and all services share the same Docker network, referencing each other by service name.',
        'Connect from another container: use the service name as hostname — <code>mongodb://admin:secret@mongo:27017/myapp</code> where <code>mongo</code> is the Docker Compose service name, not localhost.',
        'For CI pipelines (GitHub Actions, GitLab CI): use the <code>mongo:7</code> Docker service/container in your CI YAML. It starts a fresh MongoDB instance for each pipeline run, eliminating shared state between test runs.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Node.js Driver',
      language: 'typescript',
      code: `// npm install mongodb
// npm install -D @types/node

import { MongoClient, Db, Collection } from 'mongodb';

// Type your documents
interface User {
  _id?: import('mongodb').ObjectId;
  name: string;
  email: string;
  createdAt: Date;
}

const uri = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017';
const client = new MongoClient(uri, {
  maxPoolSize: 10,           // connection pool limit
  serverSelectionTimeoutMS: 5000, // fail fast if server unreachable
});

let db: Db;
let users: Collection<User>;

export async function connectDb(): Promise<void> {
  await client.connect();
  db = client.db('devhub');
  users = db.collection<User>('users');
  console.log('Connected to MongoDB');
}

export async function getUsers(): Promise<User[]> {
  return users.find({}).toArray();
}

// In your app entry point:
// await connectDb();
// app.listen(3000);`,
    },
    {
      label: 'Mongoose ODM',
      language: 'typescript',
      code: `// npm install mongoose
import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. Define schema
const userSchema = new Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
});

// 2. Define TypeScript interface
interface IUser extends Document {
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

// 3. Create model
const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

// 4. Connect
async function connect() {
  await mongoose.connect(process.env['MONGODB_URI']!, {
    dbName: 'devhub',
  });
  console.log('Mongoose connected');
}

// 5. Use
async function example() {
  await connect();

  const user = new User({ name: 'Alice', email: 'alice@example.com' });
  await user.save(); // runs pre-save hooks + validation

  const found = await User.findOne({ email: 'alice@example.com' });
  console.log(found?.name); // 'Alice'

  await mongoose.disconnect();
}`,
    },
    {
      label: 'Docker Compose',
      language: 'typescript',
      code: `// docker-compose.yml (save as docker-compose.yml in project root)
// Run: docker compose up -d

/*
version: '3.8'
services:
  mongo:
    image: mongo:7
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secret
      MONGO_INITDB_DATABASE: devhub
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/init.js:ro

  app:
    build: .
    environment:
      MONGODB_URI: mongodb://admin:secret@mongo:27017/devhub?authSource=admin
    ports:
      - "3000:3000"
    depends_on:
      - mongo

volumes:
  mongodb_data:
*/

// mongo-init.js (runs once on first container start)
/*
db.createUser({
  user: 'appuser',
  pwd: 'apppassword',
  roles: [{ role: 'readWrite', db: 'devhub' }]
});

db.users.insertOne({
  name: 'Seed User',
  email: 'seed@example.com',
  createdAt: new Date()
});
*/`,
    },
    {
      label: '.env Setup',
      language: 'typescript',
      code: `// .env (never commit to git!)
// MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mydb?retryWrites=true&w=majority

// .gitignore — must include:
// .env
// .env.local
// .env.production

// npm install dotenv
// Then in your app entry (app.ts or index.ts) — FIRST LINE:
import 'dotenv/config';

// Now process.env.MONGODB_URI is available
import { MongoClient } from 'mongodb';

const uri = process.env['MONGODB_URI'];
if (!uri) throw new Error('MONGODB_URI environment variable is not set');

const client = new MongoClient(uri);

// For Next.js — use .env.local, values auto-loaded by Next
// For Docker/Kubernetes — inject via environment vars in compose/pod spec
// For GitHub Actions — add MONGODB_URI as a secret in repository settings

// Validate connection string on startup:
async function validateConnection() {
  try {
    await client.connect();
    await client.db().command({ ping: 1 });
    console.log('MongoDB connection validated');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1); // fail fast on startup
  }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Hardcoding connection credentials in source code',
      wrong: `const client = new MongoClient('mongodb://admin:mypassword@prod.server.com:27017');`,
      right: `const client = new MongoClient(process.env['MONGODB_URI']!);
// MONGODB_URI=mongodb://admin:mypassword@prod.server.com:27017 in .env`,
      explanation: 'Credentials in source code get committed to git, exposed in CI logs, and shared with everyone who clones the repo. Always use environment variables. Even "dev-only" passwords leak through shared repos.',
    },
    {
      title: 'Connecting inside request handlers (creating pool per request)',
      wrong: `app.get('/users', async (req, res) => {
  const client = new MongoClient(uri);
  await client.connect(); // new TCP connection pool per request!
  const users = await client.db('app').collection('users').find().toArray();
  await client.close();
  res.json(users);
});`,
      right: `const client = new MongoClient(uri);
await client.connect();      // once at startup
const db = client.db('app');

app.get('/users', async (req, res) => {
  const users = await db.collection('users').find().toArray();
  res.json(users);
});`,
      explanation: 'Each new MongoClient creates a connection pool of up to 100 TCP connections. Creating one per request quickly exhausts server resources and introduces 100–300 ms latency per request just for connection setup.',
    },
    {
      title: 'Not handling the case where MONGODB_URI is undefined',
      wrong: `const client = new MongoClient(process.env.MONGODB_URI);
// If undefined → connects to "mongodb://undefined"`,
      right: `const uri = process.env['MONGODB_URI'];
if (!uri) throw new Error('MONGODB_URI is not set');
const client = new MongoClient(uri);`,
      explanation: 'If MONGODB_URI is not set, process.env.MONGODB_URI is undefined. MongoClient stringifies it to "mongodb://undefined" and fails with a cryptic ENOTFOUND error. Fail fast with a clear message on startup.',
    },
    {
      title: 'Using the wrong database name in development',
      wrong: `// Dev connects to "test" (default), prod connects to "myapp"
const db = client.db(); // uses default "test" database`,
      right: `// Always specify the database name explicitly
const db = client.db('myapp');
// or in the connection string: mongodb://localhost:27017/myapp`,
      explanation: 'If you omit the database name, the driver uses "test" by default. You end up inserting dev data into "test" and wondering why your queries return nothing against "myapp". Always name the database explicitly.',
    },
    {
      title: 'Missing error handling on connection failure',
      wrong: `await client.connect();
// If MongoDB is down, the promise rejects and crashes the process`,
      right: `try {
  await client.connect();
  await client.db().command({ ping: 1 });
} catch (err) {
  console.error('Could not connect to MongoDB:', err);
  process.exit(1); // crash fast, let the orchestrator restart
}`,
      explanation: 'Unhandled promise rejections silently crash the Node.js process in newer versions (or produce a warning in older ones). Always catch connection errors and either retry or exit with a clear error message.',
    },
  ];

  challenge: Challenge = {
    title: 'Health Check Endpoint',
    language: 'typescript',
    description: 'Write an Express GET /health endpoint that checks MongoDB connectivity using db.command({ ping: 1 }) and returns { status: "ok", db: "connected" } or { status: "error", db: "disconnected", message: "..." } with appropriate HTTP status codes. The MongoClient should be created once at startup.',
    hints: [
      'Use db.command({ ping: 1 }) to check connectivity — it returns { ok: 1 } if the server is reachable.',
      'Return HTTP 200 for healthy, 503 for unhealthy (503 Service Unavailable is the standard for dependency failures).',
      'Wrap the ping in try/catch — if MongoDB is down, the ping throws.',
      'The client should be created and connected before app.listen().',
    ],
    starterCode: `import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();
const uri = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017';
const client = new MongoClient(uri);

// TODO: GET /health endpoint
// - ping MongoDB with db.command({ ping: 1 })
// - return { status: 'ok', db: 'connected' } with 200
// - return { status: 'error', db: 'disconnected', message } with 503

async function start() {
  // TODO: connect client before listening
  app.listen(3000, () => console.log('Server on :3000'));
}

start();`,
    solution: `import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();
const uri = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017';
const client = new MongoClient(uri);

app.get('/health', async (req, res) => {
  try {
    await client.db().command({ ping: 1 });
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      db: 'disconnected',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

async function start() {
  try {
    await client.connect();
    await client.db().command({ ping: 1 }); // validate on startup
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  }
  app.listen(3000, () => console.log('Server on :3000'));
}

start();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the default port MongoDB listens on?',
      options: ['5432', '3306', '27017', '6379'],
      answer: 2,
      explanation: '27017 is MongoDB\'s default port. PostgreSQL uses 5432, MySQL uses 3306, Redis uses 6379. Remember these when configuring firewalls and Docker port mappings.',
    },
    {
      q: 'Which connection string scheme automatically discovers all replica set members via DNS?',
      options: ['mongodb://', 'mongodb+srv://', 'mongoatlas://', 'mongodb+tls://'],
      answer: 1,
      explanation: 'mongodb+srv:// uses DNS SRV records to discover all replica set hosts dynamically. This means if Atlas rotates or scales your cluster, the connection string doesn\'t need to change.',
    },
    {
      q: 'You set MONGO_INITDB_ROOT_USERNAME and MONGO_INITDB_ROOT_PASSWORD in Docker. In which database is this user created?',
      options: ['myapp', 'test', 'admin', 'root'],
      answer: 2,
      explanation: 'The MONGO_INITDB_ROOT_* environment variables create a root user in the admin database. To connect with this user, add ?authSource=admin to your connection string.',
    },
    {
      q: 'What is the default maxPoolSize for a MongoClient connection pool?',
      options: ['10', '50', '100', '500'],
      answer: 2,
      explanation: 'The default maxPoolSize is 100 connections. This is why creating a new MongoClient per request is catastrophic — each one opens its own pool of up to 100 connections.',
    },
    {
      q: 'Which command verifies a MongoDB connection is alive without side effects?',
      options: [
        'db.ping()',
        'db.command({ ping: 1 })',
        'db.test.findOne()',
        'client.isConnected()',
      ],
      answer: 1,
      explanation: 'db.command({ ping: 1 }) is the standard lightweight health check — it returns { ok: 1 } if the server is reachable and doesn\'t touch any collection data.',
    },
    {
      q: 'What does the retryWrites=true option in a connection string do?',
      options: [
        'Retries failed reads',
        'Automatically retries transient write failures once',
        'Enables write-ahead logging',
        'Retries failed connections indefinitely',
      ],
      answer: 1,
      explanation: 'retryWrites=true automatically retries write operations that fail due to transient network errors or primary elections. It\'s enabled by default in Atlas connection strings. It does NOT retry reads or business logic errors.',
    },
    {
      q: 'Which tool do you use to import a JSON file into a MongoDB collection?',
      options: ['mongodump', 'mongorestore', 'mongoexport', 'mongoimport'],
      answer: 3,
      explanation: 'mongoimport ingests JSON, CSV, or TSV files into a collection. mongodump/mongorestore work with BSON binary format. mongoexport exports documents to JSON/CSV. mongoimport is the right tool for JSON → MongoDB.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I use the native MongoDB driver or Mongoose?',
      a: '<strong>Use the native driver</strong> when: you want minimal overhead, you\'re already enforcing schemas at the DB level (JSON Schema validation), or you\'re building a service that needs maximum flexibility in document shapes. <strong>Use Mongoose</strong> when: you want schema validation at the application layer, pre/post hooks (e.g., hash passwords before save), model-level methods and virtuals, or you\'re working with a team that benefits from a structured ODM. Mongoose adds a ~30ms overhead per connection and ~30 KB bundle size, which is negligible for most apps.',
    },
    {
      q: 'How do I connect to MongoDB Atlas from a local Node.js app?',
      a: '1. Create a free M0 cluster at cloud.mongodb.com. 2. Go to Database Access → Add new database user. 3. Go to Network Access → Add IP → Add your current IP (or 0.0.0.0/0 for dev). 4. Click Connect → Drivers → Node.js → copy the SRV connection string. 5. Replace &lt;password&gt; with your user\'s password. 6. Set it as MONGODB_URI in .env. The connection string looks like: <code>mongodb+srv://user:pass@cluster0.abc123.mongodb.net/mydb?retryWrites=true&w=majority</code>.',
    },
    {
      q: 'What happens when MongoDB is unavailable and I try to run a query?',
      a: 'The driver waits for <code>serverSelectionTimeoutMS</code> (default 30 seconds) trying to find a suitable server, then throws a <code>MongoServerSelectionError</code>. In production, set <code>serverSelectionTimeoutMS: 5000</code> to fail fast. Wrap queries in try/catch and return 503 to callers. The driver will automatically reconnect and resume queries when MongoDB becomes available again — you don\'t need to re-call connect().',
    },
    {
      q: 'How do I secure a local MongoDB instance?',
      a: 'By default, MongoDB Community Edition runs without authentication enabled (bind_ip: localhost only). For any non-localhost access: 1. Enable authentication in mongod.conf: <code>security.authorization: enabled</code>. 2. Create an admin user in mongosh: <code>db.createUser({ user:"admin", pwd:"...", roles:["root"] })</code>. 3. Use TLS: <code>net.tls.mode: requireTLS</code> with a certificate. 4. Restrict bind_ip to specific interfaces. MongoDB Atlas handles all of this automatically.',
    },
    {
      q: 'What is the difference between mongodump and mongoexport?',
      a: '<strong>mongodump</strong>: exports data as BSON binary files (one .bson per collection + .json metadata). Preserves all BSON types exactly (ObjectId, Date, Decimal128). Fast. Use for full backups and mongorestore. <strong>mongoexport</strong>: exports as JSON or CSV (human-readable). Lossy — BSON types like Date are serialised as strings. Use for sharing data with non-MongoDB tools, CSV reports, or seeding test data. For backup/restore use mongodump; for data exchange use mongoexport.',
    },
    {
      q: 'How do I seed a MongoDB database with initial data in Docker?',
      a: 'Place a JavaScript file in <code>/docker-entrypoint-initdb.d/</code> inside the container. The official mongo Docker image runs all .js and .sh files in that directory on first startup (when data volume is empty). Example: mount <code>./mongo-init.js:/docker-entrypoint-initdb.d/init.js:ro</code> in docker-compose.yml. The script runs in mongosh context — you can call <code>db.collection.insertMany([...])</code> to seed data.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'MongoDB installs via Docker, Atlas, or Community Edition; one MongoClient per process, connection string in .env.',
    mustKnow: [
      'Default port: 27017; mongod is the server daemon; mongosh is the modern shell',
      'mongodb+srv:// uses DNS SRV — required for Atlas; auto-discovers replica set members',
      'Create ONE MongoClient at startup; reuse via connection pool (maxPoolSize: 100 default)',
      'Always store MONGODB_URI in env vars; never hardcode in source',
      'Docker: -v for persistent data; MONGO_INITDB_ROOT_* creates admin user in admin db',
      'Health check: db.command({ ping: 1 }) — returns { ok: 1 } if server reachable',
      'retryWrites=true auto-retries transient write failures (default in Atlas connection strings)',
    ],
    interviewFocus: [
      'Why create MongoClient only once? (connection pool — 100 TCP connections per client)',
      'mongodb:// vs mongodb+srv:// (DNS SRV discovery, TLS by default)',
      'How to validate MongoDB is healthy at startup? (ping command + process.exit(1) on failure)',
      'mongodump vs mongoexport (BSON binary backup vs JSON/CSV export)',
      'How to seed data in Docker? (docker-entrypoint-initdb.d scripts)',
    ],
  };
}
