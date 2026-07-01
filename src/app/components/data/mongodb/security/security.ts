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
  selector: 'app-mongo-security',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './security.html',
  styleUrl: './security.scss',
})
export class MongoSecurity {
  quickRef: QuickRefItem[] = [
    { type: 'method',  name: 'db.createUser()',          desc: 'Create a user with roles. Always specify a specific database, not admin for app users.' },
    { type: 'method',  name: 'db.updateUser()',          desc: 'Update user password or roles. Use to rotate credentials.' },
    { type: 'method',  name: 'db.dropUser()',            desc: 'Remove a user. Use when revoking access.' },
    { type: 'keyword', name: 'RBAC',                    desc: 'Role-Based Access Control — every user has roles that grant specific privileges.' },
    { type: 'keyword', name: 'readWrite',               desc: 'Built-in role: read + write on one database. Use for app service accounts.' },
    { type: 'keyword', name: 'read',                    desc: 'Built-in role: read-only on one database. Use for analytics or reporting users.' },
    { type: 'keyword', name: 'dbAdmin',                 desc: 'Schema management, index creation. NOT for application service accounts.' },
    { type: 'keyword', name: 'TLS/SSL',                 desc: 'Encrypt data in transit — mandatory for production. Use TLS certificates.' },
    { type: 'keyword', name: 'Encryption at Rest',      desc: 'WiredTiger encrypted storage engine (MongoDB Enterprise) or volume encryption.' },
    { type: 'keyword', name: 'Field-Level Encryption',  desc: 'Client-side field-level encryption (CSFLE) — encrypt individual fields before sending to MongoDB.' },
    { type: 'keyword', name: '$jsonSchema',             desc: 'Validator that enforces document structure and field types at the collection level.' },
    { type: 'keyword', name: 'IP Allowlist',            desc: 'Restrict connections to known IP ranges — defense-in-depth alongside authentication.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Authentication & RBAC',
      points: [
        'MongoDB uses <strong>Role-Based Access Control (RBAC)</strong>. Every database user has one or more roles; roles grant privileges (actions on resources). Enable authentication with <code>--auth</code> (mongod flag) or <code>security.authorization: enabled</code> in mongod.conf.',
        'Built-in roles: <code>read</code> (read-only), <code>readWrite</code> (read + write), <code>dbAdmin</code> (schema management, indexes), <code>userAdmin</code> (create/manage users — NOT for app accounts), <code>clusterAdmin</code> (sharding, replication — ops only), <code>root</code> (superuser — avoid for regular use).',
        'Application service accounts should have the <strong>minimum required privilege</strong>: typically <code>readWrite</code> on the specific database. Never give app accounts <code>root</code> or <code>dbAdmin</code>. Create a separate read-only user for analytics.',
        'Custom roles let you define fine-grained privileges: e.g., allow <code>find</code> on a collection but not <code>update</code> or <code>delete</code>. Use custom roles when built-in roles are too broad.',
        'Authentication mechanisms: <code>SCRAM-SHA-256</code> (default — username/password), <code>x.509</code> (client certificate auth — preferred for internal service communication), <code>LDAP</code> (enterprise — integrate with Active Directory), <code>AWS IAM</code> (Atlas — authenticate with IAM roles, no stored passwords).',
      ],
    },
    {
      heading: 'Network Security & TLS',
      points: [
        '<strong>Never expose MongoDB to the public internet.</strong> MongoDB should only be accessible from within your VPC/private network. Use IP allowlists (Atlas) or firewall rules to restrict access to known application server IPs only.',
        '<strong>TLS encryption</strong> for all connections in transit. Configure with <code>net.tls.mode: requireTLS</code> and provide server certificates. Clients must connect with <code>tls=true</code> in the connection string. All MongoDB Atlas connections use TLS by default.',
        'Disable <code>--bind_ip 0.0.0.0</code> (listening on all interfaces) in production. Bind MongoDB to a specific internal IP: <code>net.bindIp: 127.0.0.1,10.0.1.5</code>. For Atlas, this is managed for you.',
        'For replica set and sharded cluster internal communication, use <strong>keyfiles</strong> (or x.509 certificates) for intra-cluster authentication. Keyfiles prevent rogue mongod instances from joining the replica set.',
      ],
    },
    {
      heading: 'Data Encryption & Validation',
      points: [
        '<strong>Encryption at rest</strong>: MongoDB Enterprise provides native WiredTiger encrypted storage engine. Community edition users rely on OS-level or volume encryption (AWS EBS encrypted volumes, Azure Disk Encryption, LUKS on Linux). Atlas encrypts all data at rest by default.',
        '<strong>Client-Side Field-Level Encryption (CSFLE)</strong>: encrypts sensitive fields (SSNs, credit card numbers) in the driver before sending to MongoDB. The server never sees plaintext — even database administrators cannot read encrypted fields. Available in MongoDB 4.2+ with official drivers. Requires a Key Management System (KMS) like AWS KMS, Azure Key Vault, or a local master key.',
        '<strong>Queryable Encryption</strong> (MongoDB 7.0+): an evolution of CSFLE that allows equality queries on encrypted fields without decrypting on the server.',
        '<strong>Schema validation</strong> with <code>$jsonSchema</code> enforces data integrity at the collection level. Validate field types, required fields, and value ranges. Set <code>validationAction: "error"</code> (reject invalid docs) or <code>"warn"</code> (log but accept). Use as a defense-in-depth measure alongside application-level validation.',
        '<strong>Audit logging</strong> (MongoDB Enterprise): logs all authentication attempts, CRUD operations, and administrative actions. Essential for compliance (HIPAA, PCI-DSS, SOC 2). Atlas provides audit logs with configurable filters.',
      ],
    },
    {
      heading: 'Role-Based Access Control in MongoDB',
      points: [
        'MongoDB\'s built-in roles (read, readWrite, dbAdmin, etc.) provide common permission bundles scoped to a specific database, while custom roles let you define precisely which actions (find, insert, update, specific commands) are permitted on which resources for genuinely fine-grained access control.',
        'Applying the principle of least privilege means application service accounts should use a role granting only what that specific service actually needs (readWrite on its own database) rather than a broad administrative role — limiting the damage if that service\'s credentials are ever compromised.',
        'Field-level redaction (via $redact in aggregation pipelines, or Client-Side Field Level Encryption for genuinely sensitive fields) provides an additional layer of protection beyond collection-level access control, ensuring specific sensitive fields remain protected even for principals with broader read access to the collection.',
        'Auditing (available in MongoDB Enterprise/Atlas) logs authentication attempts, authorization checks, and CRUD operations for compliance and security investigation — essential for regulated industries needing to demonstrate who accessed what data and when.',
      ],
    },
    {
      heading: 'Network-Level Security Hardening',
      points: [
        'Never bind a production MongoDB instance to 0.0.0.0 without a properly configured firewall — the historical wave of publicly-exposed, unauthenticated MongoDB instances being discovered and ransomed by attackers scanning the internet is a well-documented cautionary example of this exact misconfiguration.',
        'IP allowlisting (restricting which source IP addresses or ranges can even attempt to connect) provides a network-level defense layer before authentication is ever evaluated — MongoDB Atlas requires explicit IP allowlist configuration by default, a deliberately secure-by-default design choice.',
        'TLS/SSL should be enabled for all MongoDB connections, encrypting data in transit between the application and the database — without it, credentials and query data traverse the network in plaintext, vulnerable to interception on any untrusted network path.',
        'VPC peering or private network connectivity (rather than exposing the database over the public internet at all, even with IP allowlisting and TLS) is the strongest network security posture for production deployments, eliminating public internet exposure of the database entirely.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'User Management & RBAC',
      language: 'typescript',
      code: `// In mongosh — set up authentication
// 1. First create the admin user (before enabling --auth)
use admin
db.createUser({
  user: 'adminUser',
  pwd: passwordPrompt(),  // prompts securely — never hardcode!
  roles: [{ role: 'userAdminAnyDatabase', db: 'admin' }]
});

// 2. Create app service account — minimum privilege
use shop
db.createUser({
  user: 'shopService',
  pwd: passwordPrompt(),
  roles: [{ role: 'readWrite', db: 'shop' }],
  mechanisms: ['SCRAM-SHA-256'],
  authenticationRestrictions: [{
    clientSource: ['10.0.1.0/24'],  // only allow from app server subnet
  }]
});

// 3. Create read-only analytics user
db.createUser({
  user: 'analyticsReader',
  pwd: passwordPrompt(),
  roles: [{ role: 'read', db: 'shop' }]
});

// 4. Custom role — allow only find on orders, no write
use admin
db.createRole({
  role: 'ordersViewer',
  privileges: [{
    resource: { db: 'shop', collection: 'orders' },
    actions: ['find']
  }],
  roles: []  // no inherited roles
});
db.grantRolesToUser('analyticsReader', [{ role: 'ordersViewer', db: 'admin' }]);

// 5. Rotate a password
db.updateUser('shopService', { pwd: passwordPrompt() });`,
    },
    {
      label: 'Secure Connection String',
      language: 'typescript',
      code: `import { MongoClient } from 'mongodb';

// NEVER hardcode credentials in source code!
// Load from environment variables or a secrets manager:
const username = process.env['MONGO_USER'];
const password = process.env['MONGO_PASS'];
const host     = process.env['MONGO_HOST'];

// Connection string with TLS and auth
const uri = \`mongodb+srv://\${username}:\${password}@\${host}/shop?authSource=admin&tls=true\`;

const client = new MongoClient(uri, {
  tls: true,
  // For self-signed certs in dev — remove in production!
  // tlsAllowInvalidCertificates: true,

  // In production with custom CA:
  // tlsCAFile: '/path/to/ca.pem',
  // tlsCertificateKeyFile: '/path/to/client.pem',

  // Connection pool limits
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,

  // Read/write concern defaults
  writeConcern: { w: 'majority', journal: true },
  readConcern:  { level: 'majority' },
});

// Always validate that credentials are present at startup
if (!username || !password || !host) {
  throw new Error('Missing required MongoDB credentials in environment');
}`,
    },
    {
      label: 'Schema Validation & Field Encryption',
      language: 'typescript',
      code: `// Schema validation with $jsonSchema
await db.createCollection('orders', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['customerId', 'items', 'total', 'status'],
      properties: {
        customerId: { bsonType: 'string', description: 'Required string' },
        items: {
          bsonType: 'array',
          minItems: 1,
          items: {
            bsonType: 'object',
            required: ['productId', 'qty', 'price'],
            properties: {
              qty:   { bsonType: 'int', minimum: 1 },
              price: { bsonType: 'double', minimum: 0 },
            }
          }
        },
        total:  { bsonType: 'double', minimum: 0 },
        status: { enum: ['pending', 'confirmed', 'shipped', 'cancelled'] },
      }
    }
  },
  validationAction: 'error',   // reject documents that fail validation
  validationLevel:  'strict',  // validate all inserts and updates
});

// Add validation to an existing collection
await db.command({
  collMod: 'users',
  validator: { $jsonSchema: {
    bsonType: 'object',
    required: ['email'],
    properties: {
      email: { bsonType: 'string', pattern: '^.+@.+\\..+$' },
      age:   { bsonType: 'int', minimum: 0, maximum: 150 },
    }
  }},
  validationAction: 'error',
});`,
    },
    {
      label: 'NoSQL Injection Prevention',
      language: 'typescript',
      code: `import { MongoClient } from 'mongodb';

// VULNERABLE: user input directly in query operator position
app.get('/users', async (req, res) => {
  const { role } = req.query;
  // If role = { $gt: "" } → finds ALL users!
  const users = await db.collection('users').find({ role }).toArray();
  // req.query.role could be { $ne: null } → auth bypass!
});

// SAFE: validate and sanitize input before using in queries
import Joi from 'joi';

app.get('/users', async (req, res) => {
  const schema = Joi.object({ role: Joi.string().valid('admin', 'user', 'viewer') });
  const { error, value } = schema.validate(req.query);
  if (error) return res.status(400).json({ error: error.message });

  // value.role is now a validated string literal — safe to use
  const users = await db.collection('users').find({ role: value.role }).toArray();
  res.json(users);
});

// SAFE: use allowDiskUse only when needed (with admin checks)
// SAFE: parameterize aggregation inputs
const dangerousInput = req.body.fieldName as string;
// Whitelist valid field names
const allowedFields = ['name', 'email', 'createdAt'];
if (!allowedFields.includes(dangerousInput)) {
  throw new Error('Invalid field name');
}
// Now safe to use as a field reference in aggregation`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Running MongoDB without authentication enabled',
      wrong: `// mongod.conf — default configuration (NO security)
net:
  port: 27017
  bindIp: 0.0.0.0    # listening on ALL interfaces!
# No security section — anyone on the network can connect!`,
      right: `# mongod.conf — production configuration
net:
  port: 27017
  bindIp: 127.0.0.1,10.0.1.5  # internal IPs only
  tls:
    mode: requireTLS
    certificateKeyFile: /etc/ssl/mongo.pem
    CAFile: /etc/ssl/ca.pem
security:
  authorization: enabled
  keyFile: /etc/mongodb/keyfile  # intra-cluster auth`,
      explanation: 'MongoDB Community has no authentication by default. Starting without --auth means ANY client that can reach the port has full read/write access. Always enable authentication and TLS, and bind to private IPs only. The "MongoDB Ransomware" attacks in 2017 exploited thousands of unsecured instances.',
    },
    {
      title: 'Hardcoding credentials in source code',
      wrong: `const client = new MongoClient(
  'mongodb://adminUser:SuperSecret123@prod.example.com/shop'
  //           ^^^^^^^^^^^^^^^^^^^^^^^^ hardcoded in code → leaked in git!
);`,
      right: `const client = new MongoClient(
  \`mongodb://\${process.env['MONGO_USER']}:\${process.env['MONGO_PASS']}@prod.example.com/shop\`
);
// Store secrets in: AWS Secrets Manager, Azure Key Vault, HashiCorp Vault, or .env (not committed)`,
      explanation: 'Credentials in source code are inevitably committed to git and exposed in build artifacts, logs, and stack traces. Use environment variables or a secrets manager. In CI/CD, inject secrets at runtime. Rotate credentials immediately if they are ever committed — assume they are compromised.',
    },
    {
      title: 'Giving app service accounts the root or dbAdmin role',
      wrong: `db.createUser({
  user: 'myApp',
  pwd: 'appPass',
  roles: [{ role: 'root', db: 'admin' }]  // superuser — app can do anything!
});`,
      right: `db.createUser({
  user: 'myApp',
  pwd: 'appPass',
  roles: [{ role: 'readWrite', db: 'myAppDb' }]  // minimum privilege
});`,
      explanation: 'If your app is compromised, the attacker gets the same database access as the app. With root, they can read all databases, drop everything, or create new admin users. With readWrite on one database, blast radius is limited. Follow principle of least privilege — app accounts should only access what they need.',
    },
    {
      title: 'Passing user input directly into MongoDB query operators',
      wrong: `// NoSQL injection — user controls the operator
const filter = { username: req.body.username, password: req.body.password };
const user = await users.findOne(filter);
// If password = { $gt: "" } → matches ANY user → auth bypass!`,
      right: `// Validate that inputs are strings before using in queries
const username = String(req.body.username ?? '');
const password = String(req.body.password ?? '');
// Or use a validation library (Joi, Zod) to enforce types
const user = await users.findOne({ username, password: hashPassword(password) });`,
      explanation: 'MongoDB query operators ($gt, $ne, $where, etc.) can be injected if user input is placed directly into query objects without type checking. If req.body.password is { $ne: null }, the query matches any user with that username. Always cast or validate input types before using in queries.',
    },
  ];

  challenge: Challenge = {
    title: 'Secure User System Setup',
    language: 'typescript',
    description: 'Set up a secure MongoDB database for a healthcare application. Requirements: (1) Create a service account with readWrite on the "patients" database only, (2) Create a read-only analytics account for the "patients" database, (3) Add a $jsonSchema validator to the patients collection requiring: patientId (string), name (string), dob (date), and status must be one of ["active", "inactive", "archived"], (4) Write a safe login function that prevents NoSQL injection.',
    hints: [
      'Use passwordPrompt() in mongosh or load passwords from environment variables.',
      'The $jsonSchema validator goes in db.createCollection() or db.command({ collMod: ... }).',
      'Cast input to string before using in the query to prevent operator injection.',
      'validationAction: "error" rejects invalid documents at the database level.',
    ],
    starterCode: `// Setup script (run in Node.js with admin credentials)
import { MongoClient } from 'mongodb';
const adminClient = new MongoClient(process.env['MONGO_ADMIN_URI']!);

async function setupSecureDatabase() {
  // TODO: 1. Create service account (readWrite on patients db)
  // TODO: 2. Create analytics account (read on patients db)
  // TODO: 3. Add schema validator to patients collection
}

async function secureLogin(username: string, password: string) {
  // TODO: prevent NoSQL injection, hash password before querying
}`,
    solution: `import { MongoClient } from 'mongodb';
import { createHash } from 'crypto';

const adminClient = new MongoClient(process.env['MONGO_ADMIN_URI']!);

async function setupSecureDatabase() {
  const admin = adminClient.db('patients');

  // 1. Service account — readWrite on patients db only
  await adminClient.db('admin').command({
    createUser: 'patientsService',
    pwd: process.env['PATIENTS_SERVICE_PASS'],
    roles: [{ role: 'readWrite', db: 'patients' }],
    mechanisms: ['SCRAM-SHA-256'],
  });

  // 2. Analytics account — read only
  await adminClient.db('admin').command({
    createUser: 'patientsAnalytics',
    pwd: process.env['PATIENTS_ANALYTICS_PASS'],
    roles: [{ role: 'read', db: 'patients' }],
  });

  // 3. Schema validation
  try {
    await admin.createCollection('patients');
  } catch { /* already exists */ }

  await adminClient.db('patients').command({
    collMod: 'patients',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['patientId', 'name', 'dob', 'status'],
        properties: {
          patientId: { bsonType: 'string' },
          name:      { bsonType: 'string', minLength: 1 },
          dob:       { bsonType: 'date' },
          status:    { enum: ['active', 'inactive', 'archived'] },
        }
      }
    },
    validationAction: 'error',
    validationLevel: 'strict',
  });
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function secureLogin(username: string, password: string) {
  // Cast to string — prevents { $gt: "" } operator injection
  const safeUsername = String(username);
  const safePassword = String(password);

  if (!safeUsername || !safePassword) throw new Error('Invalid credentials');

  const appClient = new MongoClient(process.env['PATIENTS_URI']!);
  const user = await appClient.db('patients').collection('users').findOne({
    username: safeUsername,
    passwordHash: hashPassword(safePassword),
  });

  await appClient.close();
  return user;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which built-in role should an application service account typically have?',
      options: ['root', 'dbAdmin', 'readWrite (on the specific database)', 'clusterAdmin'],
      answer: 2,
      explanation: 'Application service accounts should follow the principle of least privilege: readWrite on only the specific database the application uses. root and clusterAdmin are for operations/admin use only. dbAdmin allows schema changes — not needed for application code.',
    },
    {
      q: 'What is Client-Side Field-Level Encryption (CSFLE)?',
      options: [
        'Encrypts the entire MongoDB database at rest using WiredTiger',
        'Encrypts specific document fields in the driver before sending to MongoDB — server never sees plaintext',
        'Enables TLS encryption for all client connections',
        'Encrypts the oplog on replica set members',
      ],
      answer: 1,
      explanation: 'CSFLE encrypts individual sensitive fields (SSNs, card numbers) in the MongoDB driver before sending data to the server. The MongoDB server stores and returns only ciphertext — even DBAs cannot read the sensitive data. Decryption happens in the client using keys stored in a KMS (AWS KMS, Azure Key Vault, etc.).',
    },
    {
      q: 'How do you prevent NoSQL injection in a MongoDB application?',
      options: [
        'Use $sanitize operator in all queries',
        'Enable MongoDB\'s built-in injection filter',
        'Validate and cast user input types before using in query objects',
        'Use only aggregation pipelines — they are immune to injection',
      ],
      answer: 2,
      explanation: 'NoSQL injection occurs when user input (e.g., { $gt: "" }) is placed in operator position in a MongoDB query object. Prevent it by validating and casting inputs to the expected type (String(), Number()) or using a validation library (Joi, Zod). The MongoDB driver does NOT sanitize inputs automatically.',
    },
    {
      q: 'What does validationAction: "error" do in a $jsonSchema validator?',
      options: [
        'Logs a warning when a document fails validation but still inserts it',
        'Rejects the insert/update operation if the document fails schema validation',
        'Sends an error email to the database administrator',
        'Marks the document as invalid but stores it in a separate error collection',
      ],
      answer: 1,
      explanation: 'validationAction: "error" (the default when set) causes MongoDB to reject any insert or update that violates the schema validator with a WriteError. validationAction: "warn" would accept the document but log a warning. Use "error" for strict enforcement of data integrity requirements.',
    },
    {
      q: 'Why should MongoDB never be exposed to the public internet without authentication?',
      options: [
        'MongoDB\'s protocol is too slow for internet traffic',
        'Unauthenticated MongoDB instances have been mass-exploited by ransomware attacks',
        'TLS is required for internet connections but MongoDB doesn\'t support TLS',
        'MongoDB cannot handle concurrent connections from the internet',
      ],
      answer: 1,
      explanation: 'In 2017, attackers scanned the internet for unauthenticated MongoDB instances (default: no auth, binds to 0.0.0.0) and wiped or ransomed tens of thousands of databases. Always enable authentication, bind to internal IPs, use TLS, and use IP allowlists. The attack is trivially scriptable.',
    },
    { q: 'What authentication mechanisms does MongoDB support and which is recommended for production?', options: ['MongoDB supports only username/password authentication stored in plaintext in the admin database for maximum compatibility', 'MongoDB supports SCRAM (the default for local users), x.509 certificate authentication, LDAP integration, and Kerberos (Enterprise) — SCRAM-SHA-256 is recommended for production local users, while x.509 or LDAP is preferred for large organizations', 'MongoDB does not support authentication natively — authentication must be implemented by a reverse proxy sitting in front of mongod', 'MongoDB supports only SCRAM-MD5 authentication, which stores passwords as MD5 hashes in the system.users collection'], answer: 1, explanation: 'MongoDB authentication mechanisms: SCRAM-SHA-1 and SCRAM-SHA-256: Salted Challenge Response Authentication Mechanism. Default for user/password auth. SHA-256 is more secure and should be preferred. x.509 certificate authentication: clients authenticate using TLS client certificates. Recommended for inter-node authentication within a replica set. Also supported for client authentication. LDAP (Enterprise): delegates authentication to an LDAP server like Active Directory. Users are managed centrally. Kerberos (Enterprise): Single Sign-On integration for enterprise environments. Enabling auth: start mongod with --auth or set security.authorization: enabled in mongod.conf. Create the first admin user before enabling auth. User creation: db.createUser({ user: "admin", pwd: "strongpassword", roles: [{ role: "userAdminAnyDatabase", db: "admin" }] }). Connection: mongodb://admin:password@host:27017/admin.' },
    { q: 'How does MongoDB role-based access control (RBAC) work?', options: ['MongoDB RBAC assigns permissions per-database connection string, not per user — each connection string can have different access levels', 'MongoDB RBAC assigns roles to users, where each role is a named set of privileges (actions on resources). Users can have multiple roles across multiple databases', 'MongoDB RBAC is only available for Atlas clusters — self-hosted MongoDB has only two access levels: read-only and read-write', 'MongoDB RBAC operates at the collection level only; database-level permissions are not supported'], answer: 1, explanation: 'RBAC components: Role: a named set of (action, resource) privilege pairs. Resource: a database, collection, or cluster. Action: what the user can do (find, insert, update, delete, createIndex, etc.). Built-in roles: read: read all non-system collections in a database. readWrite: read and write non-system collections. dbAdmin: administrative tasks but no user management. userAdmin: manage users and roles in a database. dbOwner: combines all three above. readAnyDatabase: read across all databases (admin db only). root: unrestricted access to everything. Custom roles: db.createRole({ role: "reportReader", privileges: [{ resource: { db: "analytics", collection: "reports" }, actions: ["find"] }], roles: [] }). Principle of least privilege: create application users with only the minimum roles required. Read-only reporting user: role "read" on the reporting database. ETL user: "readWrite" on source DB, "insert" on target DB. Admin user: only admin users should have userAdmin or root.' },
    { q: 'Why can Deterministic CSFLE encryption reveal information about data patterns even though an attacker cannot decrypt the actual values?', options: ['Deterministic encryption has no weaknesses compared to Randomized encryption', 'Because the same plaintext always produces the same ciphertext, an attacker who cannot decrypt values can still see WHICH documents share the same encrypted value — revealing patterns like how many customers share the same SSN-derived ciphertext, or correlating repeated values across records, even without ever learning the actual plaintext', 'Deterministic encryption stores the encryption key alongside the ciphertext', 'Deterministic encryption only affects numeric fields, not strings'], answer: 1, explanation: 'Deterministic encryption trades some confidentiality for queryability: since identical plaintext always maps to identical ciphertext, an observer with database access (but without the encryption key) can still detect EQUALITY between encrypted values — two documents sharing the same encrypted SSN field reveal that those two people have the same SSN value, even though the actual SSN remains hidden. This "pattern leakage" is why Randomized encryption (which produces different ciphertext for the same plaintext every time) is preferred for fields where even this limited pattern visibility is unacceptable, at the cost of losing the ability to query those fields for equality.' },
    { q: 'How do you configure TLS/SSL for MongoDB connections and inter-node communication?', options: ['TLS in MongoDB is configured by adding --ssl to the mongod command; no certificates are required since MongoDB generates self-signed certificates automatically', 'TLS requires configuring tls.mode, tls.certificateKeyFile (server certificate + private key), and tls.CAFile (CA certificate) in mongod.conf; clients must present certificates signed by the same CA for mutual TLS', 'TLS is automatically enabled for all Atlas clusters; self-hosted MongoDB does not support TLS without an Enterprise license', 'TLS in MongoDB only encrypts inter-node traffic within a replica set; client-to-server connections always use PLAINTEXT for performance'], answer: 1, explanation: 'TLS configuration in mongod.conf: net.tls.mode: requireTLS (enforce TLS on all connections). net.tls.certificateKeyFile: /etc/ssl/mongodb.pem (server cert + private key in PEM format). net.tls.CAFile: /etc/ssl/ca.pem (Certificate Authority cert to validate clients). TLS modes: disabled: no TLS. allowTLS: accept both TLS and non-TLS connections. preferTLS: prefer TLS but allow non-TLS. requireTLS: reject non-TLS connections. Mutual TLS (mTLS): the server validates the client certificate (signed by the trusted CA). Used for inter-node replica set auth. Also can be used for application auth (x.509). Client configuration: connection string: mongodb://host:27017/db?tls=true&tlsCAFile=/path/ca.pem. Replica set internal auth: keyFile (shared secret — simpler) or x.509 certificates (recommended for production). Certificate management: use short-lived certificates with automation (cert-manager, Vault PKI) to avoid expired certificate outages. Test: mongosh --tls --tlsCertificateKeyFile=client.pem --tlsCAFile=ca.pem.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I rotate MongoDB credentials without downtime?',
      a: 'Use MongoDB\'s <strong>multiple passwords per user</strong> (MongoDB 7.2+): <code>db.updateUser("appUser", { pwd: "newPass", mechanisms: ["SCRAM-SHA-256"] })</code>. For older versions: (1) Create a new user with the new credentials and readWrite role; (2) Deploy the new connection string (blue/green or rolling restart); (3) Wait until all connections use the new credentials; (4) Drop the old user. Never rotate credentials in a single step — it causes a brief outage.',
    },
    {
      q: 'What is the difference between TLS and encryption at rest?',
      a: '<strong>TLS</strong> (in-transit encryption) protects data as it travels over the network between your application and MongoDB, or between replica set members. <strong>Encryption at rest</strong> protects data on disk — even if someone steals the hard drive or has raw filesystem access, the data is unreadable without the encryption key. Both are needed: TLS alone doesn\'t protect data sitting on disk, and encryption at rest alone doesn\'t protect data traveling over the network.',
    },
    {
      q: 'How does MongoDB Atlas handle security compared to a self-hosted deployment?',
      a: 'Atlas provides managed security out of the box: TLS required on all connections, IP allowlisting enforced, encryption at rest (AWS/Azure/GCP KMS) enabled by default, Network Peering (VPC peering to keep traffic off the internet), AWS PrivateLink/Azure Private Link, built-in audit logging, and automated security advisories. Self-hosted deployments require you to configure all of these manually. For most teams, Atlas\'s security baseline is harder to misconfigure than a self-managed cluster.',
    },
    {
      q: 'What is the $where operator and why is it dangerous?',
      a: '<code>$where</code> allows you to run JavaScript expressions inside a query: <code>db.users.find({ $where: "this.credits > 100" })</code>. It is dangerous because: (1) if user input is interpolated into the JavaScript string, it enables <strong>server-side JavaScript injection</strong>; (2) it disables index usage — MongoDB must evaluate the JS for every document (full collection scan); (3) MongoDB 4.4+ disables JavaScript engine in mongod by default. Never use $where in production — replace with native query operators (<code>{ credits: { $gt: 100 } }</code>) which are faster and safe.',
    },
    {
      q: 'Should I use $jsonSchema validation or application-level validation?',
      a: 'Use <strong>both</strong>. Application-level validation (Joi, Zod, class-validator) gives better error messages to API clients and can enforce business rules that MongoDB can\'t express. $jsonSchema validation is a defense-in-depth backstop — it catches writes that bypass the application layer (direct database access, migrations, admin scripts). Neither alone is sufficient: application validation can be bypassed, and $jsonSchema has limited expressiveness for complex business rules.',
    },
    { q: 'What is MongoDB auditing and how do you enable it?', a: 'Auditing: records who did what and when — authentication events, CRUD operations, administrative commands, user management. Availability: MongoDB Enterprise only for full auditing. Atlas: built-in audit log available in M10+ clusters (not M0/M2/M5). Enabling in Enterprise: mongod.conf: auditLog: destination: file, format: JSON, path: /var/log/mongodb/auditLog.json. OR destination: syslog for sending to a SYSLOG daemon. Filter: audit only specific operations to reduce log volume. auditLog: filter: "{ atype: { $in: ["authenticate", "createCollection", "dropCollection"] } }". Events captured (examples): authenticate (login attempts, success and failure). createUser, dropUser (user management). createCollection, dropCollection, dropDatabase. find, insert, update, delete (data operations — high volume, filter carefully). grantRolesToUser, revokeRolesFromUser (privilege changes). Using audit logs: ship to a SIEM (Splunk, Elastic) for alerting and analysis. Monitor for failed authentication attempts (brute force). Detect privilege escalation (unexpected grantRoles events). Track schema changes (createIndex, dropIndex). Compliance: SOC 2, HIPAA, PCI-DSS requirements often mandate database audit logs. Store audit logs in a separate, append-only, tamper-resistant store.' },
    { q: 'How do you implement the principle of least privilege in MongoDB?', a: 'Principle of least privilege: every user and application gets only the minimum permissions required for its function. Application users: create one user per application (not one shared admin user). Read-only reporting app: db.createUser({ user: "reporter", pwd: "..", roles: [{ role: "read", db: "analytics" }] }). API backend that only reads/writes orders: { role: "readWrite", db: "orders" }. No user should have root or dbOwner unless absolutely necessary. Collection-level restrictions: custom roles can restrict to specific collections: db.createRole({ role: "orderWriter", privileges: [{ resource: { db: "shop", collection: "orders" }, actions: ["find", "insert", "update"] }], roles: [] }). No admin access from application tier: application users should not have createUser, dbAdmin, or dropCollection. Reserve those for DBA accounts. Authentication isolation: application database users authenticate to the application database, not the admin database. Separate admin credentials from application credentials. Regular audits: periodically review all users and their roles: db.system.users.find(). Remove unused accounts. Rotate passwords on schedule. Connection strings: do not store credentials in source code — use environment variables or a secrets manager (AWS Secrets Manager, HashiCorp Vault).' },
    { q: 'What is network isolation for MongoDB and how do you achieve it?', a: 'Network isolation: restricting which network clients can reach the MongoDB server at the network level, independent of authentication. Strategies: Bind IP restriction: mongod.conf net.bindIp: 127.0.0.1,10.0.1.5 — mongod only listens on the specified IP addresses. Default in MongoDB 3.6+: binds to localhost only (not all interfaces). Firewall rules: allow inbound TCP on port 27017 only from application server IPs. Block all other inbound connections. Cloud security groups (AWS, Azure, GCP): inbound rules that restrict by security group membership rather than IP. VPC / Private network: deploy MongoDB inside a private VPC. Application servers in the same VPC can reach it. Public internet cannot. MongoDB Atlas: no public endpoint by default. Use VPC peering or private endpoints (AWS PrivateLink, Azure Private Link) to connect from your application VPC. Atlas IP Access List: even with VPC peering, Atlas enforces an IP Access List — only listed CIDRs can connect. Disable direct internet access: do not expose port 27017 to the public internet under any circumstances. Use a bastion host or VPN for DBA access. Defense in depth: network isolation + authentication + TLS + auditing = layered security. No single control should be relied upon alone.' },
    { q: 'How does MongoDB handle encryption at rest?', a: 'Encryption at rest: encrypting data on disk so physical media theft does not expose data. MongoDB Enterprise: WiredTiger Encrypted Storage Engine. Encryption applied at the storage layer. AES-256-CBC encryption. Key management: integration with KMIP-compatible KMS (Thales, Vormetric, AWS KMS). Local key management (dev only — not recommended for production). Configuration: mongod.conf security.enableEncryption: true, security.encryptionKeyIdentifier: (KMS key reference). Keys: master key (in KMS) encrypts the database key. Database key encrypts data pages. Key rotation: rotate the database key without re-encrypting all data (only the database key wrapper changes). MongoDB Atlas: encryption at rest is enabled automatically for all paid tiers. Managed keys (Atlas-owned) or customer-managed keys (CMK via AWS KMS, Azure Key Vault, GCP KMS — available on M10+). Limitations: encryption at rest does not protect data in transit (TLS handles that). Does not protect against a privileged OS user who can read the MongoDB process memory. Use CSFLE for maximum data protection (data encrypted before reaching the server). Encryption at rest + TLS + CSFLE for fields with the highest sensitivity = defense in depth.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Secure MongoDB with authentication (RBAC, least privilege), TLS in transit, encryption at rest, schema validation, and input sanitization against NoSQL injection.',
    mustKnow: [
      'Enable --auth and bind to private IPs — never expose to public internet',
      'App service accounts: readWrite on specific DB only (principle of least privilege)',
      'TLS required for all production connections (net.tls.mode: requireTLS)',
      'Never hardcode credentials — use environment variables or secrets manager',
      'Cast/validate user input types to prevent NoSQL injection ({ $gt: "" })',
      '$jsonSchema validator as database-level schema enforcement',
      'CSFLE — encrypt sensitive fields client-side, server never sees plaintext',
    ],
    interviewFocus: [
      'RBAC roles — which roles for app accounts vs ops accounts',
      'NoSQL injection — how it works and how to prevent it',
      'TLS vs encryption at rest — difference and when each is needed',
      'CSFLE — what it protects and how it differs from encryption at rest',
      'Why MongoDB should never be exposed without authentication',
    ],
  };
}
