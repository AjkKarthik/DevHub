import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-node-prisma',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './prisma.html',
  styleUrl: './prisma.scss'
})
export class NodePrisma {
  quickRef: QuickRefItem[] = [
    { name: 'prisma.model.findUnique()', type: 'method', desc: 'Fetch one record by unique field. Returns null if not found (not an error).' },
    { name: 'prisma.model.findMany()', type: 'method', desc: 'Fetch multiple records with optional where, orderBy, take, skip, include.' },
    { name: 'prisma.model.create()', type: 'method', desc: 'Insert one record. Use createMany() for bulk inserts.' },
    { name: 'prisma.model.update()', type: 'method', desc: 'Update matching record by unique field. Throws if record does not exist.' },
    { name: 'prisma.model.upsert()', type: 'method', desc: 'Insert or update — create if not found, update if exists.' },
    { name: 'prisma.$transaction()', type: 'method', desc: 'Run multiple operations atomically. Interactive or batch transaction modes.' },
    { name: 'prisma.$extends()', type: 'method', desc: 'Add custom model methods or result transformers via Prisma extensions.' },
    { name: 'schema.prisma', type: 'keyword', desc: 'Source of truth: model definitions, relations, DB provider, generators.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Schema-First Development with Prisma',
      points: [
        'Prisma is schema-first: you define models in schema.prisma, run prisma migrate dev to generate SQL migrations, and Prisma generates a fully-typed PrismaClient from your schema. The TypeScript types for every query are automatically derived.',
        'The schema defines models (tables), fields (columns), relations (@relation), and DB constraints (unique, default, @id). Relations in Prisma are defined on both sides — a one-to-many relation has fields on both the parent and child models.',
        'prisma generate produces the client in node_modules/.prisma/client. Run it after every schema change. In CI: generate before building — check generated files into source control only if you need offline type generation.',
        'Prisma Migrate creates versioned .sql migration files in prisma/migrations. These are checked into git. prisma migrate deploy (production) applies pending migrations. Never edit migration files manually — create a new migration instead.',
      ]
    },
    {
      heading: 'Querying — Relations, Filtering, Pagination',
      points: [
        'include loads related records in the same query (single SQL JOIN): prisma.user.findMany({ include: { posts: true } }). select chooses specific fields to reduce payload. Combine: include: { posts: { select: { title: true } } }.',
        'where supports complex filters: { AND, OR, NOT }, field comparisons ({ gt, gte, lt, lte, contains, startsWith, in, notIn }). Nested filters on relations: { posts: { some: { published: true } } }.',
        'Cursor-based pagination is more efficient than offset for large tables. Use take, skip for offset. For cursor: findMany({ take: 10, skip: 1, cursor: { id: lastId } }) — skip: 1 excludes the cursor record itself.',
        'Raw queries for complex SQL: prisma.$queryRaw`SELECT ...` (safe, parameterized) or prisma.$executeRaw for write operations. Use Prisma.sql template tag for safe interpolation — never string-concatenate user input.',
      ]
    },
    {
      heading: 'Transactions, Middleware, and Extensions',
      points: [
        'Batch transactions: prisma.$transaction([op1, op2, op3]) — all or nothing, executed in a single DB transaction. Order matters. Use for operations that must be atomic (debit + credit).',
        'Interactive transactions: prisma.$transaction(async (tx) => { ... }) — the tx argument is a PrismaClient scoped to the transaction. Use it for conditional logic inside the transaction, or when one operation result determines the next.',
        'Prisma middleware (deprecated in v5 — use Extensions): prisma.$use(async (params, next) => { ... }) — intercept every query. Use for audit logging, soft-delete implementation, row-level security checks.',
        'Prisma Extensions (v4.7+): prisma.$extends({ model: { user: { async findActiveUsers() { ... } } } }) — add custom methods to models. Type-safe, composable, replaces middleware for most use cases.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CRUD and relations',
      language: 'typescript',
      code: `import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Create with nested relation
const user = await prisma.user.create({
  data: {
    email: 'alice@example.com',
    name: 'Alice',
    posts: {
      create: [
        { title: 'Hello World', published: true },
      ],
    },
  },
  include: { posts: true },
});

// Query with filter and pagination
const publishedPosts = await prisma.post.findMany({
  where: {
    published: true,
    author: { name: { contains: 'Ali' } },   // filter on relation
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
  skip: 20, // page 3 (0-indexed, 10 per page)
  select: { id: true, title: true, author: { select: { name: true } } },
});

// Upsert — create if not exists, update if exists
const tag = await prisma.tag.upsert({
  where: { name: 'nodejs' },
  create: { name: 'nodejs', color: '#339933' },
  update: { color: '#339933' },        // update color if tag already exists
});

// Delete
await prisma.post.delete({ where: { id: 42 } });
// Delete all drafts for a user
await prisma.post.deleteMany({ where: { authorId: user.id, published: false } });`
    },
    {
      label: 'Transactions and Extensions',
      language: 'typescript',
      code: `// Batch transaction — atomic, order matters
const [debit, credit] = await prisma.$transaction([
  prisma.account.update({ where: { id: fromId }, data: { balance: { decrement: amount } } }),
  prisma.account.update({ where: { id: toId },   data: { balance: { increment: amount } } }),
]);

// Interactive transaction — conditional logic inside
await prisma.$transaction(async (tx) => {
  const from = await tx.account.findUniqueOrThrow({ where: { id: fromId } });
  if (from.balance < amount) throw new Error('Insufficient funds');
  await tx.account.update({ where: { id: fromId }, data: { balance: { decrement: amount } } });
  await tx.account.update({ where: { id: toId },   data: { balance: { increment: amount } } });
  await tx.ledger.create({ data: { fromId, toId, amount } });
});

// Prisma Extension — soft delete
const prismaWithSoftDelete = prisma.$extends({
  model: {
    $allModels: {
      async softDelete<T>(this: T, where: { id: number }) {
        const ctx = Prisma.getExtensionContext(this);
        return (ctx as any).update({ where, data: { deletedAt: new Date() } });
      },
    },
  },
});

// Raw query for complex SQL
const results = await prisma.$queryRaw\`
  SELECT u.id, u.name, COUNT(p.id) AS post_count
  FROM "User" u
  LEFT JOIN "Post" p ON p."authorId" = u.id
  GROUP BY u.id
  HAVING COUNT(p.id) > \${minPosts}
\`;`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Creating a new PrismaClient per request',
      wrong: `app.get('/users', async (req, res) => {
  const prisma = new PrismaClient(); // creates new connection pool every request!
  const users = await prisma.user.findMany();
  res.json(users);
});`,
      right: `// db.ts — singleton
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();

// In routes — import the singleton
import { prisma } from '../db';`,
      explanation: 'PrismaClient manages a connection pool. Creating a new instance per request creates a new pool each time, exhausting database connections rapidly. Create one instance at startup and share it.'
    },
    {
      title: 'Not using findUniqueOrThrow when record must exist',
      wrong: `const user = await prisma.user.findUnique({ where: { id } });
user.name; // TypeError if user is null`,
      right: `const user = await prisma.user.findUniqueOrThrow({ where: { id } });
// Throws PrismaClientKnownRequestError if not found — safe to access .name`,
      explanation: 'findUnique returns null when not found. Accessing properties on null throws a TypeError. findUniqueOrThrow throws a Prisma error that can be caught and converted to a 404 response.'
    },
    {
      title: 'N+1 queries from missing include',
      wrong: `const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({ where: { authorId: user.id } }); // N queries!
}`,
      right: `const users = await prisma.user.findMany({ include: { posts: true } }); // 1 query with JOIN`,
      explanation: 'Querying related records inside a loop causes N+1 database queries — one per user. Use include to load relations in a single JOIN query. For very large datasets, consider select over include to limit fields.'
    },
    {
      title: 'String interpolation in raw queries',
      wrong: `const name = req.query.name;
await prisma.$queryRawUnsafe(\`SELECT * FROM "User" WHERE name = '\${name}'\`); // SQL injection!`,
      right: `await prisma.$queryRaw\`SELECT * FROM "User" WHERE name = \${name}\`; // safe parameterised`,
      explanation: 'String interpolation in SQL is SQL injection. Use the Prisma.sql template tag (prisma.$queryRaw with template literals) for safe parameterized queries. Never use $queryRawUnsafe with user input.'
    },
  ];

  challenge: Challenge = {
    title: 'Repository Pattern with Prisma',
    language: 'typescript',
    description: 'Implement a PostRepository class that wraps Prisma for post operations. It should have: findById(id), findPublished(page, pageSize) using cursor pagination, create(data), publish(id) that atomically sets published=true and publishedAt=now. All methods must use the shared PrismaClient singleton and handle not-found cases with proper errors.',
    hints: [
      'cursor pagination: findMany({ take, skip: 1, cursor: { id: lastId } })',
      'publish() should use prisma.post.update with data: { published: true, publishedAt: new Date() }',
      'Throw a custom NotFoundError or use findUniqueOrThrow for findById',
    ],
    starterCode: `import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class PostRepository {
  async findById(id: number) { /* ... */ }
  async findPublished(cursor?: number, pageSize = 10) { /* ... */ }
  async create(data: { title: string; content: string; authorId: number }) { /* ... */ }
  async publish(id: number) { /* ... */ }
}`,
    solution: `import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

class PostRepository {
  async findById(id: number) {
    return prisma.post.findUniqueOrThrow({ where: { id } });
  }

  async findPublished(cursor?: number, pageSize = 10) {
    const posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: pageSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: { id: true, title: true, publishedAt: true, author: { select: { name: true } } },
    });
    const nextCursor = posts.length === pageSize ? posts[posts.length - 1].id : null;
    return { posts, nextCursor };
  }

  async create(data: { title: string; content: string; authorId: number }) {
    return prisma.post.create({ data });
  }

  async publish(id: number) {
    return prisma.post.update({
      where: { id },
      data: { published: true, publishedAt: new Date() },
    });
  }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the difference between findUnique and findUniqueOrThrow?', options: ['findUnique is faster', 'findUnique returns null if not found; findUniqueOrThrow throws a Prisma error', 'findUniqueOrThrow requires an index', 'There is no difference — both throw on not found'], answer: 1, explanation: 'findUnique returns null when no record matches. Accessing properties on null causes a runtime TypeError. findUniqueOrThrow throws a PrismaClientKnownRequestError (P2025) which you can catch and convert to a 404 response.' },
    { q: 'What is the N+1 problem in Prisma?', options: ['Using N tables in a single query', 'Querying related records inside a loop, causing 1 query per parent record', 'Prisma generating N migration files', 'Running N parallel transactions'], answer: 1, explanation: 'N+1: 1 query for the list of parents, then N individual queries for each parent\'s related records. Use include or select with nested relations to fetch related data in a single query (JOIN).' },
    { q: 'When should you use an interactive transaction vs a batch transaction?', options: ['Interactive for simple writes; batch for reads', 'Interactive when you need conditional logic or use one result to inform the next; batch for independent atomic operations', 'Batch is always better for performance', 'There is no practical difference'], answer: 1, explanation: 'Batch transactions (array form) execute all operations atomically but cannot use results of earlier operations. Interactive transactions (function form) receive a tx client and allow conditional logic — use when operation B depends on operation A\'s result.' },
    { q: 'How does Prisma protect against SQL injection in raw queries?', options: ['It sanitizes string inputs automatically', 'It uses parameterized queries via template literals with the Prisma.sql tag', 'It prevents raw queries entirely', 'It wraps values in single quotes'], answer: 1, explanation: 'Using prisma.$queryRaw with template literals sends values as SQL parameters, not string interpolation. The database driver handles escaping. Never use $queryRawUnsafe with user input — it disables parameterization.' },
    { q: 'What does prisma generate do and when must you run it?', options: ['Runs schema migrations', 'Generates the Prisma Client TypeScript types from your schema — must run after any schema change', 'Validates schema syntax only', 'Generates mock data for testing'], answer: 1, explanation: 'prisma generate reads schema.prisma and generates a type-safe client in node_modules/@prisma/client. The generated types match your models exactly — field names, nullable/optional status, relations. Run it after every schema change, in CI pipelines, and in Docker builds. Without it, the client has stale types that do not match the schema.' },
    { q: 'What is the difference between prisma db push and prisma migrate dev?', options: ['They are identical', 'db push syncs schema directly to DB without migration files — for prototyping; migrate dev generates versioned SQL migration files for production', 'migrate dev is faster than db push', 'db push only works on SQLite'], answer: 1, explanation: 'prisma db push applies schema changes directly without creating migration files — great for rapid prototyping. prisma migrate dev creates a versioned .sql migration file in prisma/migrations/ and applies it. For production, use migrate deploy (applies pending migrations without creating new ones). Never use db push on production — it can drop and recreate data.' },
  ];

  qna: QnaItem[] = [
    { q: 'Should I check in Prisma migrations to source control?', a: 'Yes — always. The prisma/migrations directory contains versioned SQL migration files that represent your database schema history. Checking them in ensures every developer and environment applies the same migrations in the same order. In production, run prisma migrate deploy (not dev) — it applies pending migrations without generating new ones. Never delete or modify migration files after applying them.' },
    { q: 'How do I handle optimistic locking (concurrent updates) with Prisma?', a: 'Add a version field to your model (version Int @default(1)). When updating, include version in the where clause and increment it: prisma.entity.update({ where: { id, version }, data: { ...changes, version: { increment: 1 } } }). If another request updated the record first, the version won\'t match and Prisma throws P2025 (record not found). Catch this and return a 409 Conflict response.' },
    { q: 'How do I implement soft delete with Prisma?', a: 'Add deletedAt DateTime? to your model. Use a Prisma Extension to add softDelete() to all models that sets deletedAt = new Date(). Then add a global query middleware (also via Extension) that automatically appends { deletedAt: null } to all findMany/findFirst queries. This way, soft-deleted records are filtered from all queries without changing every call site.' },
    { q: 'How does Prisma generate type-safe database queries, and what triggers regeneration of the client?', a: 'Prisma reads your schema.prisma file (defining models, fields, and relations) and runs prisma generate to produce a fully typed TypeScript client tailored to your exact schema — every field, relation, and query method is statically typed, so referencing a non-existent field is a compile-time TypeScript error, not a runtime surprise. Any change to schema.prisma (new field, new model, changed relation) requires re-running prisma generate to regenerate the client types, which most teams automate as a postinstall script or pre-build step.' },
    { q: 'What is the difference between Prisma Migrate and directly editing the database schema?', a: 'Prisma Migrate generates versioned, ordered SQL migration files from changes to schema.prisma (via prisma migrate dev), tracking applied migrations in a dedicated table so the same sequence of changes can be reliably reapplied across development, staging, and production environments. Directly editing the database schema (manual ALTER TABLE statements) bypasses this versioning entirely, creating drift between your Prisma schema and the actual database structure that prisma migrate cannot detect or reconcile automatically, risking confusing errors later.' },
    { q: 'Why might you choose Prisma over a lower-level query builder like Knex, and what is the tradeoff?', a: 'Prisma trades some query flexibility for strong end-to-end type safety, an intuitive declarative schema, and built-in migration tooling — ideal for teams that want compile-time guarantees and faster CRUD development. The tradeoff: highly complex, dynamic, or deeply optimized raw SQL queries can be more awkward to express through Prisma\'s query API compared to a query builder like Knex, which gives more direct, flexible SQL construction at the cost of less automatic type safety — Prisma does support $queryRaw for escaping to raw SQL when genuinely needed.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Prisma is a type-safe ORM with schema-first migrations. One PrismaClient singleton per app, use include for relations, transactions for atomicity.',
    mustKnow: [
      'schema.prisma defines models; prisma migrate dev generates SQL migrations.',
      'One PrismaClient instance per application — share it as a singleton.',
      'include loads relations in a single JOIN; separate queries = N+1.',
      'findUniqueOrThrow throws on missing; findUnique returns null.',
      '$transaction([]) for atomic batch; $transaction(async tx => {}) for conditional logic.',
      'Raw queries use template literals (prisma.$queryRaw) for parameterization.',
      'Prisma Extensions replace middleware for custom model methods.',
    ],
    interviewFocus: [
      'What is the N+1 problem and how does Prisma solve it?',
      'When would you use an interactive transaction vs a batch transaction?',
      'How do you implement soft delete in Prisma?',
    ]
  };
}
