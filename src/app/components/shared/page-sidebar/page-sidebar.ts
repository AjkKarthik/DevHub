import { Component, computed, inject } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export interface DocLink    { label: string; url: string; }
export interface Resource   { label: string; url: string; badge: 'docs' | 'video' | 'blog' | 'tool' | 'code'; }
export interface SidebarData {
  apis:      string[];
  related:   { label: string; route: string }[];
  tip:       string;
  docs:      DocLink[];
  resources: Resource[];
  gotchas:   string[];
}

const DEFAULT: SidebarData = {
  apis: ['signal()', 'computed()', 'inject()', 'input()'],
  related: [
    { label: 'Signals & State',  route: '/angular/counter' },
    { label: 'HTTP Client',      route: '/angular/http' },
    { label: 'Testing',          route: '/angular/testing' },
  ],
  tip: 'Every Angular concept here is standalone — no NgModules needed. Explore freely.',
  docs: [
    { label: 'Angular Docs Home',   url: 'https://angular.dev' },
    { label: 'angular.dev Guides',  url: 'https://angular.dev/overview' },
    { label: 'API Reference',       url: 'https://angular.dev/api' },
  ],
  resources: [
    { label: 'Angular Blog',         url: 'https://blog.angular.dev',         badge: 'blog'  },
    { label: 'Angular YouTube',      url: 'https://www.youtube.com/@Angular',  badge: 'video' },
  ],
  gotchas: [
    'Standalone components need every import declared in their imports[] array — no shared NgModule to inherit from.',
    'signal() reads must happen inside a reactive context (template, computed, effect) for Angular to track dependencies.',
  ],
};

const SQL_DEFAULT: SidebarData = {
  apis: ['SELECT', 'JOIN', 'WHERE', 'GROUP BY', 'ORDER BY', 'WITH (CTE)'],
  related: [
    { label: 'SQL Basics',    route: '/sql/basics'       },
    { label: 'Joins',         route: '/sql/joins'        },
    { label: 'Aggregations',  route: '/sql/aggregations' },
  ],
  tip: 'Write the SELECT last mentally — start with FROM, then JOIN, WHERE, GROUP BY, HAVING, then SELECT. This matches the engine\'s execution order.',
  docs: [
    { label: 'SQL Server T-SQL Reference',  url: 'https://learn.microsoft.com/en-us/sql/t-sql/language-reference' },
    { label: 'PostgreSQL Documentation',    url: 'https://www.postgresql.org/docs/current/' },
    { label: 'DB Fiddle (run SQL online)',  url: 'https://dbfiddle.uk/' },
  ],
  resources: [
    { label: 'SQL Server Samples', url: 'https://github.com/microsoft/sql-server-samples', badge: 'code' },
  ],
  gotchas: [
    'NULL is not equal to anything — NULL = NULL is false. Use IS NULL / IS NOT NULL.',
    'DISTINCT applies to the entire row, not just one column — can kill index usage on large tables.',
  ],
};

const TS_DEFAULT: SidebarData = {
  apis: ['type', 'interface', 'generic <T>', 'keyof', 'typeof', 'infer', 'satisfies'],
  related: [
    { label: 'TS Fundamentals',      route: '/typescript/basics'         },
    { label: 'Utility Types',        route: '/typescript/utility-types'  },
    { label: 'Type Guards',          route: '/typescript/narrowing'      },
  ],
  tip: 'Read the TypeScript Handbook sequentially at least once — it\'s short and every section builds on the last.',
  docs: [
    { label: 'TypeScript Handbook',    url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
    { label: 'TSConfig Reference',     url: 'https://www.typescriptlang.org/tsconfig'                 },
    { label: 'TypeScript Playground',  url: 'https://www.typescriptlang.org/play'                     },
  ],
  resources: [
    { label: 'microsoft/TypeScript',   url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
  ],
  gotchas: [
    'TypeScript is structural, not nominal — two unrelated classes with the same shape are assignable to each other.',
    'any silently disables all type checking — prefer unknown and narrow it before use.',
  ],
};

const REACT_DEFAULT: SidebarData = {
  apis: ['useState()', 'useEffect()', 'useRef()', 'useMemo()', 'useCallback()', 'createContext()'],
  related: [
    { label: 'React Fundamentals',  route: '/react/basics'         },
    { label: 'Core Hooks',          route: '/react/hooks-core'     },
    { label: 'State Management',    route: '/react/state-management'},
  ],
  tip: 'React re-renders are cheap — profile before optimising. Most performance issues are caused by missing keys, unnecessary context updates, or large unmemoised lists.',
  docs: [
    { label: 'React.dev Docs',       url: 'https://react.dev/learn'                                  },
    { label: 'React API Reference',  url: 'https://react.dev/reference/react'                        },
    { label: 'React Blog',           url: 'https://react.dev/blog'                                   },
  ],
  resources: [
    { label: 'facebook/react',       url: 'https://github.com/facebook/react',   badge: 'code' },
    { label: 'React YouTube',        url: 'https://www.youtube.com/@reactjs',     badge: 'video' },
  ],
  gotchas: [
    'Never mutate state directly — always return a new object/array from setState or a reducer.',
    'Keys must be stable IDs — using array index causes wrong reconciliation on reorder.',
  ],
};

const JS_DEFAULT: SidebarData = {
  apis: ['Promise', 'async/await', 'Array.prototype', 'Object.*', 'Proxy', 'WeakMap'],
  related: [
    { label: 'JS Fundamentals',  route: '/javascript/fundamentals' },
    { label: 'Closures',         route: '/javascript/closures'     },
    { label: 'Promises',         route: '/javascript/promises'     },
  ],
  tip: 'JavaScript\'s single thread is never blocked — async/await and Promises schedule work around the event loop without freezing the UI.',
  docs: [
    { label: 'MDN JavaScript Docs',  url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
    { label: 'ECMAScript Spec',      url: 'https://tc39.es/ecma262/' },
    { label: 'Node.js Docs',         url: 'https://nodejs.org/en/docs/' },
  ],
  resources: [
    { label: 'tc39/proposals', url: 'https://github.com/tc39/proposals', badge: 'code' },
    { label: 'You Don\'t Know JS', url: 'https://github.com/getify/You-Dont-Know-JS', badge: 'blog' },
  ],
  gotchas: [
    'typeof null === "object" is a historical bug — always check for null explicitly with === null.',
    'Closures capture variable references, not values — use let in loops or IIFE to capture the value.',
  ],
};

const HTML_DEFAULT: SidebarData = {
  apis: ['<a href>', '<img srcset>', '<form>', '<table>', '<video>', '<picture>'],
  related: [
    { label: 'Document Structure',  route: '/html/document-structure' },
    { label: 'Semantic Elements',   route: '/html/semantic-elements'  },
    { label: 'HTML Forms',          route: '/html/forms'              },
  ],
  tip: 'Always validate your HTML at validator.w3.org — invalid markup causes subtle rendering and accessibility bugs that browsers silently paper over.',
  docs: [
    { label: 'MDN HTML Reference',     url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
    { label: 'HTML Living Standard',   url: 'https://html.spec.whatwg.org/'                     },
    { label: 'W3C Markup Validator',   url: 'https://validator.w3.org/'                         },
  ],
  resources: [
    { label: 'Can I Use',  url: 'https://caniuse.com/', badge: 'tool' },
    { label: 'MDN HTML Guides', url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML', badge: 'docs' },
  ],
  gotchas: [
    'Placeholder is not a label — it disappears on input and fails contrast requirements. Always use <label>.',
    'loading="lazy" on the LCP hero image delays the largest contentful paint — use it only below the fold.',
  ],
};

const CSS_DEFAULT: SidebarData = {
  apis: ['box-sizing', 'margin', 'padding', 'border', 'display', 'overflow', 'width/height'],
  related: [
    { label: 'Box Model',    route: '/css/box-model' },
    { label: 'Flexbox',      route: '/css/flexbox'   },
    { label: 'CSS Grid',     route: '/css/grid'      },
  ],
  tip: 'Always set * { box-sizing: border-box } as your first rule — it makes width predictable and eliminates the most common CSS sizing bugs.',
  docs: [
    { label: 'MDN CSS Reference',     url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
    { label: 'CSS Tricks Guides',     url: 'https://css-tricks.com/guides/'                   },
    { label: 'web.dev — Learn CSS',   url: 'https://web.dev/learn/css'                        },
  ],
  resources: [
    { label: 'CSS Tricks — Flexbox Guide', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', badge: 'blog' },
    { label: 'Can I Use',                  url: 'https://caniuse.com/',                                     badge: 'tool' },
  ],
  gotchas: [
    'Without border-box, adding padding or border increases an element\'s total size — breaking pixel-perfect layouts.',
    'Margin collapse only happens vertically between block elements in normal flow — it does not apply in flex or grid containers.',
  ],
};

const ASPNET_DEFAULT: SidebarData = {
  apis: ['WebApplication', 'IServiceCollection', 'IApplicationBuilder', 'IConfiguration', 'ILogger<T>'],
  related: [
    { label: 'Hosting & Startup',    route: '/aspnet/hosting-startup' },
    { label: 'Middleware Pipeline',  route: '/aspnet/middleware' },
    { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
  ],
  tip: 'ASP.NET Core is modular — every feature is middleware or a service. Understand the request pipeline and DI container first.',
  docs: [
    { label: 'ASP.NET Core Docs',    url: 'https://learn.microsoft.com/en-us/aspnet/core/' },
    { label: 'ASP.NET Core API Ref', url: 'https://learn.microsoft.com/en-us/dotnet/api/?view=aspnetcore-9.0' },
    { label: '.NET Release schedule',url: 'https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core' },
  ],
  resources: [
    { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',   badge: 'code' },
  ],
  gotchas: [
    'Middleware order matters — UseAuthentication must precede UseAuthorization, and both must precede endpoint middleware.',
    'Scoped services cannot be consumed by Singleton services — captive dependency causes incorrect shared state across requests.',
  ],
};

const API_DESIGN_DEFAULT: SidebarData = {
  apis: ['REST', 'GraphQL', 'gRPC', 'WebSockets', 'OpenAPI 3.1', 'Webhooks'],
  gotchas: ['Never 200 OK with an error body', 'POST is not idempotent — use Idempotency-Key', 'CORS wildcard + credentials is rejected by browsers'],
  related: [
    { label: 'API Design Home',  route: '/api-design' },
    { label: 'OpenAPI & Contracts', route: '/api-design/openapi-contracts' },
    { label: 'API Design Cheat Sheet', route: '/api-design/cheatsheet' },
  ],
  tip: 'Design APIs for your consumers, not your database. Plural nouns for collections, HTTP verbs for actions, ISO 8601 dates, integer cents for money.',
  docs: [
    { label: 'OpenAPI Specification',  url: 'https://spec.openapis.org/oas/latest.html' },
    { label: 'HTTP Status Codes — MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status' },
    { label: 'RFC 9110 — HTTP Semantics', url: 'https://www.rfc-editor.org/rfc/rfc9110' },
  ],
  resources: [
    { label: 'Stoplight — API Design', url: 'https://stoplight.io/api-design-guide/', badge: 'docs' },
    { label: 'Swagger Editor',         url: 'https://editor.swagger.io/', badge: 'tool' },
    { label: 'Postman API Platform',   url: 'https://www.postman.com/', badge: 'tool' },
  ],
};

const OBS_DEFAULT: SidebarData = {
  apis: ['Prometheus', 'OpenTelemetry', 'Grafana', 'Loki', 'Jaeger/Tempo', 'Alertmanager'],
  gotchas: [
    'Alert on symptoms (error rate), not causes (CPU) — cause alerts produce false positives.',
    'Never use high-cardinality fields (userId, traceId) as Prometheus metric label values.',
    'Dead man\'s switch: always configure a watchdog heartbeat to detect Alertmanager failures.',
  ],
  related: [
    { label: 'Observability Home',   route: '/observability' },
    { label: 'OpenTelemetry',        route: '/observability/opentelemetry' },
    { label: 'SLIs, SLOs & SLAs',   route: '/observability/sli-slo-sla' },
    { label: 'Alerting Design',      route: '/observability/alerting-design' },
    { label: 'Cheatsheet',           route: '/observability/cheatsheet' },
  ],
  tip: 'Start with RED metrics (Rate, Errors, Duration) on every service. Add SLOs only after measuring for 30+ days — you cannot set a meaningful target without real data.',
  docs: [
    { label: 'OpenTelemetry Docs',         url: 'https://opentelemetry.io/docs/' },
    { label: 'Prometheus Docs',            url: 'https://prometheus.io/docs/introduction/overview/' },
    { label: 'Grafana Docs',              url: 'https://grafana.com/docs/' },
  ],
  resources: [
    { label: 'Google SRE Book',    url: 'https://sre.google/sre-book/table-of-contents/', badge: 'docs' },
    { label: 'Grafana Play',       url: 'https://play.grafana.org/', badge: 'tool' },
    { label: 'Awesome Prometheus', url: 'https://github.com/roaldnefs/awesome-prometheus', badge: 'code' },
  ],
};

const REDIS_DEFAULT: SidebarData = {
  apis: ['SET key value [EX seconds]', 'GET key', 'INCR / INCRBY key', 'EXPIRE key seconds', 'TTL key', 'SCAN cursor MATCH pattern'],
  gotchas: [
    'Never use KEYS in production — use SCAN with cursor',
    'Pub/Sub messages are lost if no subscriber is connected at publish time',
    'MULTI/EXEC does not roll back on command errors — check each result',
    'Redis is single-threaded per core; expensive Lua blocks all other commands',
  ],
  related: [
    { label: 'Redis Home',          route: '/redis' },
    { label: 'Caching Patterns',    route: '/redis/caching-patterns' },
    { label: 'Sorted Sets',         route: '/redis/sorted-sets' },
    { label: 'Pub/Sub Messaging',   route: '/redis/pub-sub' },
    { label: 'Redis Streams',       route: '/redis/streams' },
  ],
  tip: 'Design your key schema first: use colons as separators (user:123:profile), set TTLs aggressively, and always benchmark with realistic data sizes before choosing a data structure.',
  docs: [
    { label: 'Redis Docs',          url: 'https://redis.io/docs/' },
    { label: 'Redis Commands',      url: 'https://redis.io/commands/' },
    { label: 'ioredis GitHub',      url: 'https://github.com/redis/ioredis' },
  ],
  resources: [
    { label: 'Redis University (Free)', url: 'https://university.redis.com/', badge: 'docs' },
    { label: 'Redis Explained (blog)',  url: 'https://architecturenotes.co/redis/', badge: 'blog' },
    { label: 'node-redis GitHub',       url: 'https://github.com/redis/node-redis', badge: 'code' },
  ],
};

const GQL_DEFAULT: SidebarData = {
  apis: ['query { field }', 'mutation { op(input: {}) { ... } }', 'subscription { event { ... } }', 'fragment F on Type { ... }', 'DataLoader.load(id)', 'context.user'],
  gotchas: [
    'N+1 problem: one query per field in a list — always use DataLoader for nested entity lookups',
    'MULTI/EXEC is not a GraphQL concept — errors[] in the response are partial, not all-or-nothing',
    'Subscription connections are long-lived WebSockets — handle reconnection and auth token refresh',
    'Disable introspection in production to prevent schema leakage to attackers',
  ],
  related: [
    { label: 'GraphQL Home',        route: '/graphql' },
    { label: 'Resolvers',           route: '/graphql/resolvers' },
    { label: 'DataLoader & N+1',    route: '/graphql/dataloader' },
    { label: 'Pagination Patterns', route: '/graphql/pagination' },
    { label: 'Federation',          route: '/graphql/federation' },
  ],
  tip: 'Keep resolvers thin — push all data-fetching logic into DataLoaders or service classes injected via context. This makes resolvers testable and prevents N+1 queries.',
  docs: [
    { label: 'GraphQL Spec',        url: 'https://spec.graphql.org/' },
    { label: 'Apollo Server Docs',  url: 'https://www.apollographql.com/docs/apollo-server/' },
    { label: 'graphql-js GitHub',   url: 'https://github.com/graphql/graphql-js' },
  ],
  resources: [
    { label: 'How to GraphQL (tutorial)', url: 'https://www.howtographql.com/', badge: 'docs' },
    { label: 'Apollo GraphQL Blog',        url: 'https://www.apollographql.com/blog/', badge: 'blog' },
    { label: 'DataLoader GitHub',          url: 'https://github.com/graphql/dataloader', badge: 'code' },
  ],
};

const KAFKA_DEFAULT: SidebarData = {
  apis: ['producer.send({ topic, messages })', 'consumer.subscribe({ topic })', 'channel.sendToQueue(q, msg)', 'channel.consume(q, handler)', 'bus.CreatePublishEndpoint()', 'connection.publish(exchange, key, content)'],
  gotchas: [
    'At-least-once delivery is the default — always design consumers to be idempotent',
    'Kafka consumer group: only one consumer per partition — add partitions to scale consumers',
    'RabbitMQ ack is per-message, not per-batch — nack + requeue can cause infinite loops on poison messages',
    'Schema changes without backward compatibility will break consumers that are not redeployed first',
  ],
  related: [
    { label: 'Messaging Home',        route: '/messaging' },
    { label: 'Kafka Architecture',    route: '/messaging/kafka-architecture' },
    { label: 'Saga Pattern',          route: '/messaging/saga-pattern' },
    { label: 'Outbox Pattern',        route: '/messaging/outbox-pattern' },
    { label: 'Idempotency',           route: '/messaging/idempotency' },
  ],
  tip: 'Design consumers to be idempotent first, then worry about delivery semantics. Exactly-once is complex to implement correctly — at-least-once with idempotent consumers is usually the right default.',
  docs: [
    { label: 'Apache Kafka Docs',       url: 'https://kafka.apache.org/documentation/' },
    { label: 'RabbitMQ Documentation',  url: 'https://www.rabbitmq.com/documentation.html' },
    { label: 'Azure Service Bus Docs',  url: 'https://learn.microsoft.com/en-us/azure/service-bus-messaging/' },
  ],
  resources: [
    { label: 'Confluent Learning',      url: 'https://developer.confluent.io/learn/', badge: 'docs' },
    { label: 'Enterprise Integration Patterns', url: 'https://www.enterpriseintegrationpatterns.com/', badge: 'blog' },
    { label: 'confluentinc/kafka-dotnet-getting-started', url: 'https://github.com/confluentinc/kafka-dotnet-getting-started', badge: 'code' },
  ],
};

const DSA_DEFAULT: SidebarData = {
  apis: ['Array / HashMap', 'Two Pointers', 'Sliding Window', 'BFS / DFS', 'Dynamic Programming', 'Binary Search'],
  gotchas: [
    'Two-pointer only works on sorted or monotonic arrays — sort first if needed.',
    'BFS uses a queue (FIFO); DFS uses a stack or recursion. Confusing them gives wrong shortest-path results.',
    'DP: define the state clearly before writing the recurrence — most bugs come from a fuzzy state definition.',
    'Off-by-one in binary search: prefer left <= right with mid = left + (right - left) / 2 to avoid overflow.',
  ],
  related: [
    { label: 'DSA Home',               route: '/dsa' },
    { label: 'Big-O Notation',         route: '/dsa/big-o' },
    { label: 'Arrays',                 route: '/dsa/arrays' },
    { label: 'Dynamic Programming',    route: '/dsa/dynamic-programming' },
    { label: 'Graph Algorithms',       route: '/dsa/graph-algorithms' },
  ],
  tip: 'Recognise the pattern first, then code. Most interview problems map to one of: two pointers, sliding window, BFS/DFS, DP, or binary search. Naming the pattern unlocks the template.',
  docs: [
    { label: 'LeetCode Explore',       url: 'https://leetcode.com/explore/' },
    { label: 'NeetCode Roadmap',       url: 'https://neetcode.io/roadmap' },
    { label: 'Big-O Cheat Sheet',      url: 'https://www.bigocheatsheet.com/' },
  ],
  resources: [
    { label: 'TheAlgorithms/JavaScript', url: 'https://github.com/TheAlgorithms/JavaScript', badge: 'code' },
    { label: 'Visualgo (algorithm viz)', url: 'https://visualgo.net/', badge: 'tool' },
  ],
};

const AI_DEFAULT: SidebarData = {
  apis: ['sklearn.Pipeline', 'transformers.pipeline()', 'LangChain', 'OpenAI / Anthropic SDK', 'Hugging Face Hub', 'FAISS / Chroma'],
  gotchas: [
    'Fine-tuning vs RAG: RAG is faster to iterate and keeps knowledge current; fine-tuning is better for tone/style, not facts.',
    'Temperature 0 is not deterministic with all providers — some add top-p or beam search at inference.',
    'Embeddings from different models are NOT interchangeable — always embed queries with the same model used to embed documents.',
    'LLM-as-judge bias: models tend to prefer longer answers and their own outputs — use diverse judges and rubrics.',
  ],
  related: [
    { label: 'AI/ML Home',           route: '/ai' },
    { label: 'LLM Fundamentals',     route: '/ai/llm-fundamentals' },
    { label: 'RAG',                  route: '/ai/rag' },
    { label: 'AI Agents & Tool Use', route: '/ai/ai-agents' },
    { label: 'MLOps & Deployment',   route: '/ai/mlops' },
  ],
  tip: 'Start with prompting, then RAG, then fine-tuning — each step is more costly. Most LLM apps never need fine-tuning if the prompt and retrieval are done well.',
  docs: [
    { label: 'Anthropic Docs',       url: 'https://docs.anthropic.com' },
    { label: 'OpenAI Cookbook',      url: 'https://cookbook.openai.com' },
    { label: 'Hugging Face Docs',    url: 'https://huggingface.co/docs' },
  ],
  resources: [
    { label: 'LangChain Docs',       url: 'https://python.langchain.com/docs', badge: 'docs' },
    { label: 'Semantic Kernel',      url: 'https://github.com/microsoft/semantic-kernel', badge: 'code' },
  ],
};

const TESTING_DEFAULT: SidebarData = {
  apis: ['describe()/it()', 'expect().toBe()', 'jest.fn()/jest.spyOn()', 'beforeEach/afterEach', 'render()/getByRole()', 'page.locator()'],
  gotchas: [
    'Test behaviour, not implementation — testing internal state breaks refactors without real bugs',
    'Never share mutable state between tests — always reset mocks in beforeEach or afterEach',
    'Flaky E2E tests usually mean missing awaits — Playwright auto-waits, Cypress chains are async',
    'Snapshot tests become noise when auto-updated too eagerly — review diffs carefully',
  ],
  related: [
    { label: 'Testing Home',          route: '/testing-hub' },
    { label: 'Jest Fundamentals',     route: '/testing-hub/jest-fundamentals' },
    { label: 'Mocking & Spies',       route: '/testing-hub/mocking-spies' },
    { label: 'Integration Testing',   route: '/testing-hub/integration-testing' },
    { label: 'Playwright',            route: '/testing-hub/playwright' },
  ],
  tip: 'Follow the testing pyramid: write many fast unit tests, fewer integration tests, and just enough E2E tests to cover critical user flows. Unit tests run in milliseconds; protect that speed.',
  docs: [
    { label: 'Jest Docs',             url: 'https://jestjs.io/docs/getting-started' },
    { label: 'Playwright Docs',       url: 'https://playwright.dev/docs/intro' },
    { label: 'Testing Library Docs',  url: 'https://testing-library.com/docs/' },
  ],
  resources: [
    { label: 'Vitest',                url: 'https://vitest.dev/', badge: 'docs' },
    { label: 'Kent C. Dodds Blog',    url: 'https://kentcdodds.com/blog', badge: 'blog' },
    { label: 'Pact (Contract Testing)', url: 'https://docs.pact.io/', badge: 'docs' },
  ],
};

const MONGO_DEFAULT: SidebarData = {
  apis: ['insertOne/Many', 'find/findOne', 'updateOne/Many', 'deleteOne/Many', 'aggregate()', 'watch()'],
  gotchas: [
    'Never use $where or server-side JavaScript — it bypasses indexes and is a security risk.',
    'Avoid high-cardinality fields in indexes on arrays (multikey indexes fan out — one array doc = N index entries).',
    'Transactions in MongoDB require a replica set — they do NOT work on standalone mongod instances.',
    '_id is immutable: you cannot update it with $set. Replace the document instead.',
  ],
  related: [
    { label: 'MongoDB Home',         route: '/mongodb' },
    { label: 'CRUD Operations',      route: '/mongodb/crud-operations' },
    { label: 'Aggregation Pipeline', route: '/mongodb/aggregation-pipeline' },
    { label: 'Indexes',              route: '/mongodb/indexes' },
    { label: 'Schema Design Patterns', route: '/mongodb/schema-design-patterns' },
  ],
  tip: 'Design your schema around your most common query patterns, not your data relationships. Embed what you read together; reference what you update independently.',
  docs: [
    { label: 'MongoDB Docs',            url: 'https://www.mongodb.com/docs/manual/' },
    { label: 'Aggregation Reference',   url: 'https://www.mongodb.com/docs/manual/reference/aggregation/' },
    { label: 'Mongoose ODM Docs',       url: 'https://mongoosejs.com/docs/' },
  ],
  resources: [
    { label: 'MongoDB University (Free)', url: 'https://learn.mongodb.com/', badge: 'docs' },
    { label: 'Schema Design Patterns',    url: 'https://www.mongodb.com/blog/post/building-with-patterns-a-summary', badge: 'blog' },
    { label: 'mongosh GitHub',            url: 'https://github.com/mongodb-js/mongosh', badge: 'code' },
  ],
};

const SEC_DEFAULT: SidebarData = {
  apis: ['bcrypt/argon2', 'JWT (RS256)', 'OAuth PKCE', 'AES-256-GCM', 'HMAC-SHA256', 'CSP nonces'],
  related: [
    { label: 'Security Home',      route: '/security' },
    { label: 'OWASP Top 10',       route: '/security/owasp-top-10' },
    { label: 'Security Cheatsheet', route: '/security/cheatsheet' },
  ],
  tip: 'Hash passwords with Argon2id (memory ≥ 64 MB, iterations ≥ 3). Never SHA-256 — it\'s too fast for passwords.',
  docs: [
    { label: 'OWASP Cheat Sheet Series', url: 'https://cheatsheetseries.owasp.org/' },
    { label: 'MDN — Web Security',       url: 'https://developer.mozilla.org/en-US/docs/Web/Security' },
    { label: 'Security Headers',         url: 'https://securityheaders.com/' },
  ],
  resources: [
    { label: 'HackTricks',      url: 'https://book.hacktricks.xyz/', badge: 'docs' },
    { label: 'PortSwigger Web Security Academy', url: 'https://portswigger.net/web-security', badge: 'blog' },
  ],
  gotchas: [
    'SameSite=Strict prevents CSRF for cookies but has no effect on Authorization header tokens.',
    'JWT "alg:none" attack: always allowlist acceptable algorithms server-side and never trust the header alone.',
  ],
};

const PYTHON_DEFAULT: SidebarData = {
  apis: ['def / lambda', 'async def / await', 'list/dict/set comprehension', '@dataclass', 'with open() as f', 'try/except/finally'],
  related: [
    { label: 'Python Home',     route: '/python' },
    { label: 'Fundamentals',    route: '/python/fundamentals' },
    { label: 'Asyncio',         route: '/python/asyncio' },
    { label: 'Type Hints',      route: '/python/type-hints' },
  ],
  tip: 'Never use a mutable default argument (def fn(items=[])) — it is created once at function definition time and shared across every call. Use None and initialize inside the function instead.',
  docs: [
    { label: 'Python Docs Home',      url: 'https://docs.python.org/3/' },
    { label: 'Python Standard Library', url: 'https://docs.python.org/3/library/' },
    { label: 'PEP 8 Style Guide',      url: 'https://peps.python.org/pep-0008/' },
  ],
  resources: [
    { label: 'Real Python',           url: 'https://realpython.com/', badge: 'blog' },
    { label: 'python/cpython',        url: 'https://github.com/python/cpython', badge: 'code' },
  ],
  gotchas: [
    'Late-binding closures in a loop all capture the SAME final loop variable, not the value at each iteration — use a default argument to snapshot it.',
    'Type hints are not enforced at runtime — use Pydantic or a static checker (mypy) to actually validate types.',
  ],
};

const NODE_DEFAULT: SidebarData = {
  apis: ['require()/import', 'async/await', 'EventEmitter', 'fs.promises', 'process.env', 'Buffer'],
  related: [
    { label: 'Node.js Home',    route: '/node' },
    { label: 'Core Modules',    route: '/node/core-modules' },
    { label: 'Streams',         route: '/node/streams' },
    { label: 'Security',        route: '/node/security' },
  ],
  tip: 'The event loop is single-threaded — a synchronous CPU-bound operation blocks every concurrent request. Offload heavy computation to a worker thread or a separate process.',
  docs: [
    { label: 'Node.js Docs Home',     url: 'https://nodejs.org/en/docs' },
    { label: 'Node.js API Reference', url: 'https://nodejs.org/api/' },
    { label: 'npm Docs',              url: 'https://docs.npmjs.com/' },
  ],
  resources: [
    { label: 'Node.js Best Practices', url: 'https://github.com/goldbergyoni/nodebestpractices', badge: 'code' },
    { label: 'Node.js YouTube',        url: 'https://www.youtube.com/@nodejs', badge: 'video' },
  ],
  gotchas: [
    'Unhandled promise rejections crash the process in modern Node — always attach a .catch() or use try/catch with async/await.',
    'require() caches modules by resolved file path — mutating a required module\'s exports affects every other file that requires it.',
  ],
};

const GO_DEFAULT: SidebarData = {
  apis: ['go func()', 'chan / select', 'defer', 'error interface', 'context.Context', 'sync.WaitGroup'],
  related: [
    { label: 'Go Home',         route: '/go' },
    { label: 'Concurrency',     route: '/go/goroutines-channels' },
    { label: 'Error Handling',  route: '/go/error-handling' },
  ],
  tip: 'A goroutine leak (one that blocks forever on a channel with no reader) is silent — it never panics, it just quietly consumes memory forever. Always give long-running goroutines a context for cancellation.',
  docs: [
    { label: 'Go Documentation',   url: 'https://go.dev/doc/' },
    { label: 'Go Standard Library', url: 'https://pkg.go.dev/std' },
    { label: 'Effective Go',       url: 'https://go.dev/doc/effective_go' },
  ],
  resources: [
    { label: 'Go by Example',    url: 'https://gobyexample.com/', badge: 'docs' },
    { label: 'golang/go',        url: 'https://github.com/golang/go', badge: 'code' },
  ],
  gotchas: [
    'A nil interface holding a typed nil pointer is not itself nil — err != nil can be true even when the underlying pointer is nil.',
    'Loop variable capture in a goroutine closure (pre-Go 1.22) reused the same variable across iterations — always pass it as a parameter or rely on Go 1.22+\'s per-iteration semantics.',
  ],
};

const BLAZOR_DEFAULT: SidebarData = {
  apis: ['@code {}', '[Parameter]', 'StateHasChanged()', 'IJSRuntime', 'EditForm', 'CascadingValue'],
  related: [
    { label: 'Blazor Home',       route: '/blazor' },
    { label: 'Render Modes',      route: '/blazor/render-modes' },
    { label: 'State Management',  route: '/blazor/state-management' },
  ],
  tip: 'In Blazor Server, a Scoped service lives for the entire SignalR circuit (the whole user session), not just one request — a long-lived DbContext registered as Scoped can silently accumulate tracked entities over a long session.',
  docs: [
    { label: 'Blazor Docs Home',       url: 'https://learn.microsoft.com/en-us/aspnet/core/blazor/' },
    { label: 'ASP.NET Core Blazor API', url: 'https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.components' },
  ],
  resources: [
    { label: 'dotnet/aspnetcore',   url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    { label: '.NET YouTube',        url: 'https://www.youtube.com/@dotnet', badge: 'video' },
  ],
  gotchas: [
    'Forgetting StateHasChanged() after updating state from outside Blazor\'s normal event pipeline (a timer callback, a background task) leaves the UI silently stale.',
    'Components with InteractiveServer/WebAssembly render modes still prerender on the server first by default — code can run twice unless prerendering is explicitly disabled.',
  ],
};

const DEVOPS_DEFAULT: SidebarData = {
  apis: ['docker build/run', 'kubectl apply', 'terraform plan/apply', 'git rebase/merge', 'CI/CD pipeline stages', 'helm install'],
  related: [
    { label: 'DevOps Home',    route: '/devops' },
    { label: 'CI/CD',          route: '/devops/cicd-fundamentals' },
    { label: 'Containers',     route: '/devops/docker-fundamentals' },
  ],
  tip: 'Treat pipeline configuration as code, checked into the same repository as the application — this gives pipeline changes the same review and version history as any other code change.',
  docs: [
    { label: 'GitHub Actions Docs',   url: 'https://docs.github.com/en/actions' },
    { label: 'Docker Docs',           url: 'https://docs.docker.com/' },
    { label: 'Terraform Docs',        url: 'https://developer.hashicorp.com/terraform/docs' },
  ],
  resources: [
    { label: 'The DevOps Handbook (summary)', url: 'https://itrevolution.com/product/the-devops-handbook-second-edition/', badge: 'blog' },
    { label: 'CNCF Landscape',                url: 'https://landscape.cncf.io/', badge: 'tool' },
  ],
  gotchas: [
    'A pipeline that passes locally but fails in CI is usually an environment difference (a missing env var, a different tool version) — pin exact tool versions in the pipeline config.',
    'Secrets committed to a pipeline YAML file are visible in git history forever, even after being "removed" in a later commit — use a secrets manager, never inline values.',
  ],
};

const AWS_DEFAULT: SidebarData = {
  apis: ['aws s3 cp', 'aws lambda invoke', 'IAM policy JSON', 'CloudFormation template', 'aws ec2 describe-instances', 'DynamoDB PutItem/Query'],
  related: [
    { label: 'AWS Home',        route: '/aws' },
    { label: 'IAM',             route: '/aws/iam' },
    { label: 'Lambda',          route: '/aws/lambda' },
  ],
  tip: 'Follow least-privilege from the start — an IAM policy scoped to exactly the actions and resources needed is far easier to audit than starting broad ("*") and trying to narrow it down later.',
  docs: [
    { label: 'AWS Documentation',    url: 'https://docs.aws.amazon.com/' },
    { label: 'AWS Well-Architected',  url: 'https://aws.amazon.com/architecture/well-architected/' },
  ],
  resources: [
    { label: 'AWS Skill Builder',   url: 'https://skillbuilder.aws/', badge: 'docs' },
    { label: 'aws/aws-cli',         url: 'https://github.com/aws/aws-cli', badge: 'code' },
  ],
  gotchas: [
    'S3 bucket policies and IAM policies are evaluated together — an explicit Deny in either one always wins, regardless of any Allow elsewhere.',
    'Lambda cold starts on the Consumption-style pricing model can add noticeable latency to the first request after a period of inactivity — Provisioned Concurrency avoids this at a fixed cost.',
  ],
};

const AZURE_DEFAULT: SidebarData = {
  apis: ['az group create', 'ARM/Bicep template', 'az functionapp deploy', 'RBAC role assignment', 'az aks get-credentials', 'Key Vault secret reference'],
  related: [
    { label: 'Azure Home',       route: '/azure' },
    { label: 'Fundamentals',     route: '/azure/fundamentals' },
    { label: 'RBAC',             route: '/azure/rbac' },
  ],
  tip: 'Assign RBAC roles at the narrowest scope that satisfies the actual need (a resource group, not the whole subscription) — this limits the blast radius if that identity is ever compromised.',
  docs: [
    { label: 'Azure Documentation',   url: 'https://learn.microsoft.com/en-us/azure/' },
    { label: 'Azure Architecture Center', url: 'https://learn.microsoft.com/en-us/azure/architecture/' },
  ],
  resources: [
    { label: 'Microsoft Learn',      url: 'https://learn.microsoft.com/en-us/training/azure/', badge: 'docs' },
    { label: 'Azure/azure-quickstart-templates', url: 'https://github.com/Azure/azure-quickstart-templates', badge: 'code' },
  ],
  gotchas: [
    'Deploying an ARM/Bicep template in Complete mode deletes any resource in the resource group NOT described in the template — Incremental (the default) only adds/modifies.',
    'A Standard SKU load balancer or public IP has different default behavior (traffic denied by default) than Basic SKU — check SKU-specific defaults before assuming behavior transfers.',
  ],
};

const LINUX_DEFAULT: SidebarData = {
  apis: ['grep/sed/awk', 'systemctl', 'chmod/chown', 'ps/top/htop', 'journalctl', 'ssh/scp'],
  related: [
    { label: 'Linux Home',       route: '/linux' },
    { label: 'File System',      route: '/linux/filesystem-hierarchy' },
    { label: 'Processes',        route: '/linux/process-management' },
  ],
  tip: 'chmod 777 is almost never the right answer — it grants read/write/execute to everyone, including any other user or process on the system. Grant the narrowest permission that actually works.',
  docs: [
    { label: 'Linux man pages',       url: 'https://man7.org/linux/man-pages/' },
    { label: 'Arch Wiki (excellent general reference)', url: 'https://wiki.archlinux.org/' },
  ],
  resources: [
    { label: 'explainshell.com',   url: 'https://explainshell.com/', badge: 'tool' },
    { label: 'Linux Journey',      url: 'https://linuxjourney.com/', badge: 'blog' },
  ],
  gotchas: [
    'rm -rf on the wrong path is irreversible with no trash/recycle bin by default — double-check the path, especially in a script with a variable that could be empty.',
    'A background process started in an interactive shell is killed when that shell session ends unless launched with nohup, disown, or a proper service unit.',
  ],
};

const TERRAFORM_DEFAULT: SidebarData = {
  apis: ['terraform init/plan/apply', 'resource "..." "..." {}', 'variable/output blocks', 'terraform state', 'module source', 'terraform import'],
  related: [
    { label: 'Terraform Home',   route: '/terraform' },
    { label: 'Remote State',     route: '/terraform/remote-state' },
    { label: 'Modules',          route: '/terraform/modules' },
  ],
  tip: 'Always run terraform plan and read the diff before apply, especially in a shared environment — a plan showing an unexpected "destroy" for a resource you didn\'t intend to touch is the single most common way teams lose production infrastructure.',
  docs: [
    { label: 'Terraform Documentation', url: 'https://developer.hashicorp.com/terraform/docs' },
    { label: 'Terraform Registry',      url: 'https://registry.terraform.io/' },
  ],
  resources: [
    { label: 'hashicorp/terraform',   url: 'https://github.com/hashicorp/terraform', badge: 'code' },
    { label: 'HashiCorp Learn',       url: 'https://developer.hashicorp.com/terraform/tutorials', badge: 'docs' },
  ],
  gotchas: [
    'Remote state without locking (no DynamoDB table or equivalent) risks two concurrent applies corrupting the state file — always enable state locking for any shared/team state.',
    'A resource removed from a .tf file is DESTROYED on the next apply, not just "forgotten" — use terraform state rm if you want Terraform to stop managing it without deleting the real resource.',
  ],
};

const K8S_DEFAULT: SidebarData = {
  apis: ['kubectl apply/get/describe', 'Deployment/Pod/Service', 'ConfigMap/Secret', 'HPA', 'docker build', 'Helm chart'],
  related: [
    { label: 'Containers/K8s Home', route: '/containers' },
    { label: 'Pods & Deployments',  route: '/containers/pods-deployments' },
    { label: 'Services & Ingress',  route: '/containers/services-ingress' },
  ],
  tip: 'kubectl describe pod surfaces the EVENTS for a pod (scheduling failures, image pull errors) — check this before diving into logs, since a pod that never started has no application logs to read.',
  docs: [
    { label: 'Kubernetes Documentation', url: 'https://kubernetes.io/docs/home/' },
    { label: 'Docker Documentation',     url: 'https://docs.docker.com/' },
  ],
  resources: [
    { label: 'kubernetes/kubernetes',   url: 'https://github.com/kubernetes/kubernetes', badge: 'code' },
    { label: 'Kubernetes YouTube',      url: 'https://www.youtube.com/@kubernetesio', badge: 'video' },
  ],
  gotchas: [
    'A ConfigMap mounted as an environment variable requires a pod restart to pick up changes — mounted as a volume, it updates in-place (with some propagation delay) without a restart.',
    'Without any NetworkPolicy, Kubernetes allows unrestricted pod-to-pod traffic across the entire cluster by default — a flat, fully open network unless explicitly locked down.',
  ],
};

const MESH_DEFAULT: SidebarData = {
  apis: ['istioctl install', 'VirtualService/DestinationRule', 'Envoy sidecar', 'mTLS PeerAuthentication', 'Gateway resource'],
  related: [
    { label: 'Service Mesh Home',  route: '/service-mesh' },
    { label: 'Istio',              route: '/service-mesh/istio-architecture' },
    { label: 'Security',           route: '/service-mesh/mtls' },
  ],
  tip: 'A service mesh moves cross-cutting communication concerns (retries, mTLS, observability) out of application code and into infrastructure — but the sidecar proxies add real per-pod resource overhead that should be measured before assuming the mesh is "free."',
  docs: [
    { label: 'Istio Documentation',   url: 'https://istio.io/latest/docs/' },
    { label: 'Envoy Proxy Docs',      url: 'https://www.envoyproxy.io/docs' },
  ],
  resources: [
    { label: 'istio/istio',         url: 'https://github.com/istio/istio', badge: 'code' },
    { label: 'Istio Blog',          url: 'https://istio.io/latest/blog/', badge: 'blog' },
  ],
  gotchas: [
    'Enabling mTLS mesh-wide without a migration period can break traffic from services not yet part of the mesh — use PERMISSIVE mode during rollout, then switch to STRICT.',
    'A misconfigured VirtualService route can silently blackhole traffic to a service — always verify with a canary/shadow request before rolling a routing change to 100% of traffic.',
  ],
};

const SYSDESIGN_DEFAULT: SidebarData = {
  apis: ['Load Balancer', 'Cache-aside pattern', 'Consistent Hashing', 'CAP theorem', 'Message Queue', 'Rate Limiter'],
  related: [
    { label: 'System Design Home',  route: '/system-design' },
    { label: 'Scalability',         route: '/system-design/horizontal-vertical-scaling' },
    { label: 'Caching',             route: '/system-design/caching-strategies' },
  ],
  tip: 'Start every system design answer with clarifying questions about scale (requests/sec, data size, read/write ratio) — the right architecture for 100 users looks nothing like the right architecture for 100 million.',
  docs: [
    { label: 'AWS Architecture Center',   url: 'https://aws.amazon.com/architecture/' },
    { label: 'Google SRE Book (free)',    url: 'https://sre.google/books/' },
  ],
  resources: [
    { label: 'donnemartin/system-design-primer', url: 'https://github.com/donnemartin/system-design-primer', badge: 'code' },
    { label: 'High Scalability blog',            url: 'http://highscalability.com/', badge: 'blog' },
  ],
  gotchas: [
    'CAP theorem is about behavior during a network PARTITION specifically — a system is not simply "CP" or "AP" all the time; the tradeoff only manifests when a partition actually occurs.',
    'Adding a cache does not just add speed — it adds a new failure mode (cache invalidation, stale data) and a new question to answer for every write path: how does the cache stay consistent with the source of truth.',
  ],
};

const ARCH_DEFAULT: SidebarData = {
  apis: ['Bounded Context', 'Aggregate Root', 'Circuit Breaker', 'CQRS Command/Query', 'Outbox Pattern', 'Anti-Corruption Layer'],
  related: [
    { label: 'Architecture Patterns Home', route: '/arch-patterns' },
    { label: 'DDD Core',                   route: '/arch-patterns/ddd-core' },
    { label: 'Microservices Principles',   route: '/arch-patterns/microservices-principles' },
  ],
  tip: 'An aggregate defines a transactional consistency boundary — invariants are enforced WITHIN one aggregate\'s transaction, never spanning multiple aggregates in a single atomic operation. Cross-aggregate consistency needs eventual consistency via domain events instead.',
  docs: [
    { label: 'Martin Fowler — Architecture', url: 'https://martinfowler.com/architecture/' },
    { label: 'Microsoft — Cloud Design Patterns', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/' },
  ],
  resources: [
    { label: 'microservices.io',   url: 'https://microservices.io/patterns/index.html', badge: 'docs' },
    { label: 'Martin Fowler Blog', url: 'https://martinfowler.com/', badge: 'blog' },
  ],
  gotchas: [
    'Splitting into microservices without a genuine driving need (independent scaling, independent deployment cadence) usually adds operational complexity without a corresponding benefit — a modular monolith is often the better starting point.',
    'A choreographed saga (services reacting to each other\'s events with no central coordinator) becomes genuinely hard to debug as step count grows — orchestration trades some coupling for a single, traceable definition of the overall flow.',
  ],
};

const DP_DEFAULT: SidebarData = {
  apis: ['Factory Method', 'Strategy', 'Observer', 'Decorator', 'Repository', 'Dependency Inversion'],
  related: [
    { label: 'Design Patterns Home', route: '/design-patterns' },
    { label: 'SOLID',                route: '/design-patterns/solid' },
    { label: 'Singleton',            route: '/design-patterns/singleton' },
  ],
  tip: 'Learn the INTENT behind a pattern, not just its structure — Adapter and Facade look structurally similar (both wrap other code behind a simpler interface) but solve different problems: Adapter fixes incompatibility, Facade simplifies complexity.',
  docs: [
    { label: 'Refactoring.Guru — Design Patterns', url: 'https://refactoring.guru/design-patterns' },
    { label: 'Source Making — Design Patterns',    url: 'https://sourcemaking.com/design_patterns' },
  ],
  resources: [
    { label: 'Refactoring.Guru',   url: 'https://refactoring.guru/', badge: 'docs' },
    { label: 'Martin Fowler Blog', url: 'https://martinfowler.com/', badge: 'blog' },
  ],
  gotchas: [
    'Applying a pattern before the need for its flexibility actually exists (premature abstraction) usually adds indirection without benefit — the "rule of three" (wait for a pattern to repeat) is a useful guard against this.',
    'Singleton\'s global static access point makes code depending on it hard to unit test — a DI container\'s singleton-scoped registration gives the same "one shared instance" behavior without the global accessor.',
  ],
};

export const SIDEBAR_MAP: Record<string, SidebarData> = {

  // ── Signals & State ────────────────────────────────────────────────────────
  counter: {
    apis: ['signal()', 'computed()', 'effect()', '@if', '@for'],
    related: [
      { label: 'linkedSignal()',   route: '/angular/linked-signal' },
      { label: 'resource() API',  route: '/angular/resource-api'  },
      { label: 'Signal Store',    route: '/angular/store'         },
    ],
    tip: 'Convert a BehaviorSubject to signal() in a real project — computed() will replace most of your subscriptions.',
    docs: [
      { label: 'Signals Overview',      url: 'https://angular.dev/guide/signals'         },
      { label: 'signal() API',          url: 'https://angular.dev/api/core/signal'       },
      { label: 'computed() API',        url: 'https://angular.dev/api/core/computed'     },
      { label: 'effect() API',          url: 'https://angular.dev/api/core/effect'       },
    ],
    resources: [
      { label: 'RxJS Interop Guide',    url: 'https://angular.dev/guide/rxjs-interop',   badge: 'docs'  },
      { label: 'Angular — YouTube',     url: 'https://www.youtube.com/@Angular',          badge: 'video' },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',             badge: 'blog'  },
    ],
    gotchas: [
      'Writing to signals inside effect() causes an infinite loop — pass { allowSignalWrites: true } only as a last resort.',
      'computed() is lazy — it runs only when first read, not immediately when dependencies change.',
      'effect() must be created in an injection context (constructor / field initialiser) — not inside a method.',
    ],
  },

  // ── Signals & State › subtopics (Phase 10) ─────────────────────────────────
  'counter/what-is-a-signal': {
    apis: ['signal()', '.set()', '.update()'],
    related: [
      { label: 'Signals & State (overview)', route: '/angular/counter' },
      { label: 'computed() — next subtopic',  route: '/angular/counter/computed' },
    ],
    tip: 'Forgot the parentheses? {{ count }} without () is the single most common first-week signals bug — the template just silently never updates.',
    docs: [
      { label: 'Signals Overview',      url: 'https://angular.dev/guide/signals'         },
      { label: 'signal() API',          url: 'https://angular.dev/api/core/signal'       },
    ],
    resources: [
      { label: 'Angular — YouTube',     url: 'https://www.youtube.com/@Angular',          badge: 'video' },
    ],
    gotchas: [
      'count() called inside a template, computed(), or effect() registers a dependency — called anywhere else it is just a normal read.',
      'set() replaces the value outright; update() derives it from the current value — reach for update() whenever the new value depends on the old one.',
      'Mutating an object or array in place (e.g. .push()) without replacing the reference is a silent no-op — signals compare by reference/equality, not deep content.',
    ],
  },

  'counter/computed': {
    apis: ['computed()'],
    related: [
      { label: 'What Is a Signal? — previous', route: '/angular/counter/what-is-a-signal' },
      { label: 'Signals & State (overview)',   route: '/angular/counter' },
      { label: 'effect() — next subtopic',     route: '/angular/counter/effects' },
    ],
    tip: 'computed() is lazy AND memoised — an unread one costs nothing, and a repeatedly-read one only recalculates when a dependency actually changes.',
    docs: [
      { label: 'Signals Overview', url: 'https://angular.dev/guide/signals'     },
      { label: 'computed() API',   url: 'https://angular.dev/api/core/computed' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'computed() has no .set() or .update() — TypeScript blocks it at compile time. Need a writable-but-defaulted signal instead? That is what linkedSignal() is for.',
      'Only signals actually read during the callback are tracked as dependencies — an unread branch of an if/else does not count, even if it contains a signal call.',
      'A computed() that never gets read never runs its callback at all — defining one "just in case" costs nothing until something actually calls it.',
    ],
  },

  'counter/effects': {
    apis: ['effect()', 'allowSignalWrites'],
    related: [
      { label: 'computed() — previous',        route: '/angular/counter/computed' },
      { label: 'Signals & State (overview)',   route: '/angular/counter' },
      { label: '@if/@for — next subtopic',     route: '/angular/counter/control-flow' },
    ],
    tip: 'effect() must be created in an injection context — a field initialiser or constructor. Calling it later from a method throws at runtime.',
    docs: [
      { label: 'Signals Overview', url: 'https://angular.dev/guide/signals'    },
      { label: 'effect() API',     url: 'https://angular.dev/api/core/effect' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Reading and writing the SAME signal inside one effect() causes an infinite loop — writing to a different signal is fine and common.',
      'effect() re-runs are scheduled/batched, not synchronous — do not rely on it for a value other code needs immediately (use computed() for that).',
      'Return a cleanup function from the callback to tear down timers/listeners — Angular calls it before every re-run and on destroy.',
    ],
  },

  'counter/control-flow': {
    apis: ['@if', '@for', '@empty', '@else', 'track'],
    related: [
      { label: 'effect() — previous',           route: '/angular/counter/effects' },
      { label: 'Signals & State (overview)',    route: '/angular/counter' },
      { label: 'Signals in Services — next',    route: '/angular/counter/readonly-and-services' },
    ],
    tip: '@for will not compile without a track expression — there is no implicit default, unlike *ngFor\'s optional trackBy.',
    docs: [
      { label: 'Control Flow Guide', url: 'https://angular.dev/guide/templates/control-flow' },
      { label: '@for API',           url: 'https://angular.dev/api/core/@for' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'track $index works but reuses the wrong DOM node when a list reorders/inserts/removes — prefer a stable id field whenever one exists.',
      '@empty only fires for @for on an empty collection — it has no equivalent meaning inside @if (use @else there instead).',
      'Signals read in @if/@for need no pipe — call them directly, e.g. @if (count() > 0). The | async pipe is for Observables, not signals.',
    ],
  },

  'counter/readonly-and-services': {
    apis: ['@Injectable', 'providedIn', '.asReadonly()', 'inject()'],
    related: [
      { label: '@if/@for — previous',       route: '/angular/counter/control-flow' },
      { label: 'Signals & State (overview)', route: '/angular/counter' },
      { label: 'RxJS Interop — next',        route: '/angular/counter/rxjs-interop' },
    ],
    tip: '.asReadonly() is a live linked view, not a copy — it always reflects the private signal\'s current value, with no risk of drifting out of sync.',
    docs: [
      { label: 'Signals Overview', url: 'https://angular.dev/guide/signals'    },
      { label: 'Dependency Injection Guide', url: 'https://angular.dev/guide/di' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'A service needs providedIn: \'root\' (or root-level registration) to be a true app-wide singleton — providing it in a component\'s own providers array creates a new instance per component instead.',
      'Exposing a public writable signal instead of readonly + methods removes all validation/control over what values are ever set — any injecting component could set anything.',
      'computed() defined on the service is shared and memoised across every consumer — it does not recompute separately per component.',
    ],
  },

  'counter/rxjs-interop': {
    apis: ['toSignal()', 'toObservable()', 'initialValue'],
    related: [
      { label: 'Signals in Services — previous', route: '/angular/counter/readonly-and-services' },
      { label: 'Signals & State (overview)',     route: '/angular/counter' },
    ],
    tip: 'toObservable(signal) emits the current value immediately on subscribe, then every future change — it behaves like a BehaviorSubject, not a one-time snapshot.',
    docs: [
      { label: 'RxJS Interop Guide', url: 'https://angular.dev/guide/signals/rxjs-interop' },
      { label: 'toSignal() API',     url: 'https://angular.dev/api/core/rxjs-interop/toSignal' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'toSignal() must be called in an injection context — same rule as effect(). Its subscription auto-unsubscribes when that context is destroyed, no manual cleanup needed.',
      'Without { initialValue: ... }, a toSignal() signal reads as undefined until the Observable\'s first emission — pass an initial value to avoid null-checking it everywhere.',
      'Reach for interop only at the boundary where your code meets an Observable-based API (HTTP, forms, router) — plain signal()/computed() stays the default for ordinary state.',
    ],
  },

  // ── Reactive Forms & Signal Services › subtopics (Phase 10) ─────────────────
  'todo/inject-di': {
    apis: ['inject()', 'runInInjectionContext()'],
    related: [
      { label: 'Reactive Forms & Signal Services (overview)', route: '/angular/todo' },
      { label: 'Reactive Forms Basics — next',                route: '/angular/todo/reactive-forms-basics' },
    ],
    tip: 'inject() only works in an injection context — field initialisers, constructors, and functional guards/interceptors. Calling it from a regular method throws NG0203.',
    docs: [
      { label: 'Dependency Injection Guide', url: 'https://angular.dev/guide/di' },
      { label: 'inject() API',               url: 'https://angular.dev/api/core/inject' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'inject() is not a mandate — constructor injection still works and compiles to the same DI resolution. inject() is required for functional guards/interceptors, which have no constructor at all.',
      'A large constructor parameter list and equivalent inject() field initialisers are functionally identical — pick whichever reads clearer for the class.',
      'runInInjectionContext() is an escape hatch for genuine edge cases (a setTimeout callback, a manual RxJS operator) — it is not a general substitute for calling inject() in the right place to begin with.',
    ],
  },

  'todo/reactive-forms-basics': {
    apis: ['FormBuilder', 'Validators', '.getRawValue()', 'nonNullable'],
    related: [
      { label: 'inject() — previous',            route: '/angular/todo/inject-di' },
      { label: 'Reactive Forms & Signal Services (overview)', route: '/angular/todo' },
      { label: 'Route Guards — next',             route: '/angular/todo/route-guards' },
    ],
    tip: 'form.value silently omits disabled controls — always use form.getRawValue() for submit payloads when any control might be disabled.',
    docs: [
      { label: 'Reactive Forms Guide', url: 'https://angular.dev/guide/forms/reactive-forms' },
      { label: 'FormBuilder API',      url: 'https://angular.dev/api/forms/FormBuilder' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'control.errors is null when valid, not an empty object — do not assume it is always safe to call Object.keys() on it unconditionally.',
      'fb.nonNullable.group() removes null from a control\'s value type after reset — plain fb.group() keeps `| null` in the type.',
      'FormsModule (ngModel) and ReactiveFormsModule (formControlName) are not interchangeable — importing the wrong one throws NG8002 at runtime.',
    ],
  },

  'todo/route-guards': {
    apis: ['CanActivateFn', 'CanDeactivateFn', 'router.parseUrl()'],
    related: [
      { label: 'Reactive Forms Basics — previous', route: '/angular/todo/reactive-forms-basics' },
      { label: 'Reactive Forms & Signal Services (overview)', route: '/angular/todo' },
      { label: 'Signal-Based Services — next',      route: '/angular/todo/signal-based-services' },
    ],
    tip: 'Return a UrlTree (router.parseUrl(...)) to redirect from a guard — never call router.navigate() manually inside one, it can trigger a competing navigation.',
    docs: [
      { label: 'Route Guards Guide', url: 'https://angular.dev/guide/routing/common-router-tasks#preventing-unauthorized-access' },
      { label: 'CanActivateFn API',  url: 'https://angular.dev/api/router/CanActivateFn' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'CanDeactivateFn runs on the route you are LEAVING, not the one you are navigating to — it receives that outgoing component instance as its first argument.',
      'A guard returning an Observable that never emits/completes leaves navigation hanging indefinitely with no error — pipe with take(1) to guarantee resolution.',
      'canActivate takes an array — every guard in it must return true (or none redirect) for navigation to proceed.',
    ],
  },

  'todo/signal-based-services': {
    apis: ['@Injectable', 'providedIn', 'effect()'],
    related: [
      { label: 'Route Guards — previous',          route: '/angular/todo/route-guards' },
      { label: 'Reactive Forms & Signal Services (overview)', route: '/angular/todo' },
      { label: 'Custom & Async Validators — next',  route: '/angular/todo/custom-validators' },
    ],
    tip: 'providedIn: \'root\' vs a component\'s own providers array is a real design decision, not two names for the same thing — root is one shared instance app-wide, component-scoped is a fresh instance per component.',
    docs: [
      { label: 'Dependency Injection Guide', url: 'https://angular.dev/guide/di' },
      { label: 'Signals Overview',           url: 'https://angular.dev/guide/signals' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'An effect() in a providedIn: \'root\' service constructor lives for the whole app session — there is nothing to clean up, unlike a component-scoped effect.',
      'Getting root-vs-component-scoped wrong causes real bugs: shared state that unexpectedly resets, or state that should reset but leaks stale data instead.',
      'A plain signal()-based service covers most small/medium apps\' shared-state needs — a store library like NgRx is not a default starting point.',
    ],
  },

  'todo/custom-validators': {
    apis: ['ValidationErrors', 'AsyncValidatorFn', 'updateOn'],
    related: [
      { label: 'Signal-Based Services — previous', route: '/angular/todo/signal-based-services' },
      { label: 'Reactive Forms & Signal Services (overview)', route: '/angular/todo' },
      { label: 'Form State — next',                route: '/angular/todo/form-state' },
    ],
    tip: 'control.status is \'PENDING\' (not \'VALID\') while an async validator is running — form.valid is false during that window, which naturally blocks premature submit.',
    docs: [
      { label: 'Form Validation Guide', url: 'https://angular.dev/guide/forms/form-validation' },
      { label: 'AsyncValidatorFn API',  url: 'https://angular.dev/api/forms/AsyncValidatorFn' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'A sync validator returns ValidationErrors | null directly — only ASYNC validators return an Observable/Promise.',
      'Always debounce + switchMap an async validator that hits an API — firing on every keystroke wastes requests and switchMap cancels a stale in-flight one when a newer request starts.',
      'updateOn: \'blur\'/\'submit\' delays not just error display but also when an async validator\'s HTTP check fires.',
    ],
  },

  'todo/form-state': {
    apis: ['.touched', '.dirty', '.markAllAsTouched()', '.patchValue()', '.setValue()'],
    related: [
      { label: 'Custom & Async Validators — previous', route: '/angular/todo/custom-validators' },
      { label: 'Reactive Forms & Signal Services (overview)', route: '/angular/todo' },
    ],
    tip: 'form.reset() clears value AND resets touched/dirty/errors on every control — it is a full reset, not just a value clear.',
    docs: [
      { label: 'Reactive Forms Guide', url: 'https://angular.dev/guide/forms/reactive-forms' },
      { label: 'FormGroup API',        url: 'https://angular.dev/api/forms/FormGroup' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'touched tracks focus+blur; dirty tracks whether the value changed — they are independent, not the same flag under two names.',
      'patchValue() accepts a partial object and ignores missing keys; setValue() requires every key and THROWS if any is missing.',
      'A disabled control is excluded from form.value (but included in getRawValue()) and skips its own validators — a disabled required field reads as VALID.',
    ],
  },

  // ── Template-Driven vs Reactive Forms › subtopics (Phase 10) ────────────────
  'forms/template-driven-vs-reactive': {
    apis: ['ngModel', 'formControlName', 'NgForm'],
    related: [
      { label: 'Template-Driven vs Reactive Forms (overview)', route: '/angular/forms' },
      { label: 'FormGroup, FormControl & FormArray — next',    route: '/angular/forms/formgroup-formcontrol-formarray' },
    ],
    tip: 'Never mix ngModel and formControlName on the same form — both APIs try to own the control\'s value and Angular logs a real console error.',
    docs: [
      { label: 'Reactive Forms Guide',       url: 'https://angular.dev/guide/forms/reactive-forms' },
      { label: 'Template-Driven Forms Guide', url: 'https://angular.dev/guide/forms/template-driven-forms' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Reactive forms are not universally "better" — template-driven remains genuinely simpler for small, static forms like a login or search box.',
      'Template-driven validation is declared as HTML attributes (required, minlength); reactive validation lives in a validators array in the class.',
      'Different forms in the same app CAN use different approaches — the rule is only never mix both APIs on the SAME form.',
    ],
  },

  'forms/formgroup-formcontrol-formarray': {
    apis: ['FormControl', 'FormGroup', 'FormArray', 'AbstractControl'],
    related: [
      { label: 'Template-Driven vs Reactive — previous', route: '/angular/forms/template-driven-vs-reactive' },
      { label: 'Template-Driven vs Reactive Forms (overview)', route: '/angular/forms' },
      { label: 'Cross-Field Validators — next',            route: '/angular/forms/cross-field-validators' },
    ],
    tip: 'A FormArray is accessed by numeric index (.at(i)), not by name — it has no field names, only an ordered position.',
    docs: [
      { label: 'Reactive Forms Guide', url: 'https://angular.dev/guide/forms/reactive-forms' },
      { label: 'FormArray API',        url: 'https://angular.dev/api/forms/FormArray' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'A FormArray item can be a whole nested FormGroup, not just a plain FormControl — a list of address objects is a normal FormArray of FormGroups.',
      'Invalidity propagates up through the entire control tree — a top-level form.invalid reflects every descendant, no matter how deeply nested.',
      'All three (FormControl/FormGroup/FormArray) extend AbstractControl — the same touched/invalid/errors patterns work identically on any of them.',
    ],
  },

  'forms/cross-field-validators': {
    apis: ['AbstractControl', 'ValidationErrors', 'form.errors'],
    related: [
      { label: 'FormGroup, FormControl & FormArray — previous', route: '/angular/forms/formgroup-formcontrol-formarray' },
      { label: 'Template-Driven vs Reactive Forms (overview)',  route: '/angular/forms' },
      { label: 'Typed Forms — next',                             route: '/angular/forms/typed-forms' },
    ],
    tip: 'A cross-field validator\'s error lives on form.errors (the GROUP), not on any individual control\'s own .errors — checking the wrong one is the most common mistake here.',
    docs: [
      { label: 'Form Validation Guide', url: 'https://angular.dev/guide/forms/form-validation' },
      { label: 'AbstractControl API',   url: 'https://angular.dev/api/forms/AbstractControl' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'A cross-field validator is attached to the FormGroup via its OPTIONS object (fb.group()\'s second argument), not to any single control\'s validators array.',
      'Since no one control "owns" a group-level error, the convention is to gate its display on the LAST relevant field\'s touched state.',
      'The validator function signature is identical to a normal validator — only what it is attached to and what it receives differs.',
    ],
  },

  'forms/typed-forms': {
    apis: ['FormControl<T>', 'FormGroup<T>', 'UntypedFormGroup'],
    related: [
      { label: 'Cross-Field Validators — previous', route: '/angular/forms/cross-field-validators' },
      { label: 'Template-Driven vs Reactive Forms (overview)', route: '/angular/forms' },
    ],
    tip: 'form.controls.emal (a typo) is a compile-time TypeScript error since Angular 14 — not a silent runtime undefined.',
    docs: [
      { label: 'Typed Forms Guide', url: 'https://angular.dev/guide/forms/typed-forms' },
      { label: 'FormBuilder API',   url: 'https://angular.dev/api/forms/FormBuilder' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'FormBuilder infers the full generic type automatically from initial values — you almost never write FormGroup<{...}> by hand.',
      'Typed forms are the default since Angular 14, not an opt-in — UntypedFormGroup/UntypedFormBuilder are the explicit opt-OUT for migrating old code.',
      'form.value is typed as Partial (every field optional); form.getRawValue() is typed as the complete, non-partial shape.',
    ],
  },

  // ── HTTP Client › subtopics (Phase 10) ───────────────────────────────────────
  'http/httpclient-setup': {
    apis: ['provideHttpClient()', 'HttpClient', 'HttpParams'],
    related: [
      { label: 'HTTP Client (overview)', route: '/angular/http' },
      { label: 'GET Requests — next',    route: '/angular/http/get-requests' },
    ],
    tip: 'Every HttpClient method returns a cold Observable — nothing hits the network until something subscribes to it.',
    docs: [
      { label: 'HttpClient Guide', url: 'https://angular.dev/guide/http' },
      { label: 'HttpClient API',   url: 'https://angular.dev/api/common/http/HttpClient' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Skipping provideHttpClient() in app.config.ts makes injecting HttpClient throw NullInjectorError.',
      'Without a type parameter, http.get() returns Observable<Object> — always pass http.get<T>(url).',
      'Use HttpParams for query strings — never manually concatenate, it is error-prone with encoding and user-supplied values.',
    ],
  },

  'http/get-requests': {
    apis: ['toSignal()', 'httpResource()', 'catchError()'],
    related: [
      { label: 'HttpClient Setup — previous', route: '/angular/http/httpclient-setup' },
      { label: 'HTTP Client (overview)',      route: '/angular/http' },
      { label: 'Mutation Requests — next',    route: '/angular/http/mutation-requests' },
    ],
    tip: 'Always pipe catchError() before toSignal() — an unhandled HTTP error terminates the Observable and leaves the signal stuck permanently.',
    docs: [
      { label: 'RxJS Interop Guide', url: 'https://angular.dev/guide/signals/rxjs-interop' },
      { label: 'httpResource() API', url: 'https://angular.dev/api/common/http/httpResource' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'toSignal() fetches once — httpResource() auto-refetches and cancels in-flight requests when its URL factory\'s signal dependencies change.',
      'httpResource() exposes value()/isLoading()/error()/status() signals out of the box — no manual loading-state boilerplate needed.',
      'Prefer toSignal() for a genuine one-time fetch; prefer httpResource() when the request depends on a reactive input like a selected id or search query.',
    ],
  },

  'http/mutation-requests': {
    apis: ['.subscribe()', 'HttpHeaders', 'takeUntilDestroyed()'],
    related: [
      { label: 'GET Requests — previous',    route: '/angular/http/get-requests' },
      { label: 'HTTP Client (overview)',     route: '/angular/http' },
      { label: 'Error Handling & Retry — next', route: '/angular/http/error-handling-retry' },
    ],
    tip: 'Mutations are one-shot user actions — subscribe({ next, error }) is the idiomatic pattern, not toSignal()/httpResource().',
    docs: [
      { label: 'HttpClient Guide', url: 'https://angular.dev/guide/http' },
      { label: 'HttpHeaders API',  url: 'https://angular.dev/api/common/http/HttpHeaders' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Always provide both next AND error in the observer object — an unhandled error in a subscribe call propagates to the global error handler.',
      'Optimistic updates are just manual state management: update the signal immediately, revert it yourself in the error callback if the request fails.',
      'Pipe takeUntilDestroyed() on a mutation that might still be in flight when the component is destroyed, to avoid calling .set() on a gone component.',
    ],
  },

  'http/error-handling-retry': {
    apis: ['catchError()', 'retry()', 'HttpErrorResponse'],
    related: [
      { label: 'Mutation Requests — previous', route: '/angular/http/mutation-requests' },
      { label: 'HTTP Client (overview)',       route: '/angular/http' },
    ],
    tip: 'err.status === 0 means a network/CORS failure with no response at all — a fundamentally different case from a genuine 4xx/5xx server response.',
    docs: [
      { label: 'HttpClient Guide',        url: 'https://angular.dev/guide/http' },
      { label: 'HttpErrorResponse API',   url: 'https://angular.dev/api/common/http/HttpErrorResponse' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'retry(3) attempts a FIXED number of retries, not infinite — the error still propagates after all attempts are exhausted.',
      'Put catchError inside the inner Observable (before switchMap flattens it) to recover a single failed request without killing the whole outer stream.',
      'catchError does not have to hide the failure from the UI — set an error signal inside the callback before returning the fallback value.',
    ],
  },

  // ── HTTP Interceptors › subtopics (Phase 10) ─────────────────────────────────
  'http-interceptors/what-are-interceptors': {
    apis: ['HttpInterceptorFn', 'withInterceptors()', 'req.clone()'],
    related: [
      { label: 'HTTP Interceptors (overview)', route: '/angular/http-interceptors' },
      { label: 'Auth Interceptor — next',      route: '/angular/http-interceptors/auth-interceptor-token-refresh' },
    ],
    tip: 'Requests run through interceptors in registration order; responses run in REVERSE order — like nested function calls.',
    docs: [
      { label: 'HTTP Interceptors Guide', url: 'https://angular.dev/guide/http/interceptors' },
      { label: 'HttpInterceptorFn API',   url: 'https://angular.dev/api/common/http/HttpInterceptorFn' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'HttpRequest and HttpHeaders are immutable — always req.clone({...}) to produce a modified copy, never mutate req directly.',
      'Since Angular 15, interceptors are plain functions registered via withInterceptors([...]) — no class, no @Injectable.',
      'Calling next(req) unmodified is a valid pass-through, common in conditional interceptors.',
    ],
  },

  'http-interceptors/auth-interceptor-token-refresh': {
    apis: ['inject()', 'shareReplay(1)', 'switchMap()', 'HttpContext'],
    related: [
      { label: 'What Are Interceptors? — previous', route: '/angular/http-interceptors/what-are-interceptors' },
      { label: 'HTTP Interceptors (overview)',      route: '/angular/http-interceptors' },
      { label: 'Global Error Interceptor — next',   route: '/angular/http-interceptors/global-error-interceptor' },
    ],
    tip: 'If several requests 401 at once, share a single refresh Observable via shareReplay(1) — do not call the refresh endpoint once per failing request.',
    docs: [
      { label: 'HTTP Interceptors Guide', url: 'https://angular.dev/guide/http/interceptors' },
      { label: 'HttpContext API',         url: 'https://angular.dev/api/common/http/HttpContext' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Never attach "Bearer null" when there is no token — call next(req) unmodified instead.',
      'The interceptor retries the original request itself via switchMap after a successful refresh — the caller never sees the 401.',
      'HttpContext (e.g. SKIP_AUTH) lets a specific public-endpoint request opt out of token attachment entirely.',
    ],
  },

  'http-interceptors/global-error-interceptor': {
    apis: ['catchError()', 'HttpContextToken', 'throwError()'],
    related: [
      { label: 'Auth Interceptor — previous',        route: '/angular/http-interceptors/auth-interceptor-token-refresh' },
      { label: 'HTTP Interceptors (overview)',        route: '/angular/http-interceptors' },
      { label: 'Loading Spinner & HttpContext — next', route: '/angular/http-interceptors/loading-spinner-httpcontext' },
    ],
    tip: 'Global and local error handling coexist — the interceptor covers cross-cutting cases (403, offline, 5xx); a component still handles its own contextual errors (a 404 on one specific resource).',
    docs: [
      { label: 'HTTP Interceptors Guide',  url: 'https://angular.dev/guide/http/interceptors' },
      { label: 'HttpErrorResponse API',    url: 'https://angular.dev/api/common/http/HttpErrorResponse' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Re-throw the error (throwError(() => err)) after handling the global concern — the caller\'s own subscribe error callback can still fire afterward.',
      'A per-request HttpContext token (e.g. SKIP_ERROR_TOAST) lets a specific call opt out of the global handling entirely.',
      '403 (authenticated, not authorized) and 401 (not authenticated) deserve genuinely different handling — do not treat them the same.',
    ],
  },

  'http-interceptors/loading-spinner-httpcontext': {
    apis: ['finalize()', 'HttpContextToken', 'signal()'],
    related: [
      { label: 'Global Error Interceptor — previous', route: '/angular/http-interceptors/global-error-interceptor' },
      { label: 'HTTP Interceptors (overview)',        route: '/angular/http-interceptors' },
    ],
    tip: 'finalize() runs on success, error, AND early unsubscription — using it (not separate next/error callbacks) is what keeps a pending-request counter from getting stuck.',
    docs: [
      { label: 'HTTP Interceptors Guide', url: 'https://angular.dev/guide/http/interceptors' },
      { label: 'HttpContext API',         url: 'https://angular.dev/api/common/http/HttpContext' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Background polling, silent token refresh, and analytics pings should set SKIP_LOADING: true — not every request should trigger a visible spinner.',
      'HttpContext data is scoped to exactly ONE request — it is not a shared global, each call site sets it explicitly.',
      'A signal-based pending counter (not a per-component boolean) is what lets one interceptor drive a truly global spinner.',
    ],
  },

  // ── Parent-Child Communication › subtopics (Phase 10) ────────────────────────
  'parent-child/input-signals': {
    apis: ['input()', 'input.required()', 'numberAttribute'],
    related: [
      { label: 'Parent-Child Communication (overview)', route: '/angular/parent-child' },
      { label: 'output() — next',                        route: '/angular/parent-child/output-signals' },
    ],
    tip: 'Read a signal input by CALLING it — this.title(), not this.title. Forgetting the parentheses is the most common first mistake.',
    docs: [
      { label: 'Signal Inputs Guide', url: 'https://angular.dev/guide/signals/inputs' },
      { label: 'input() API',         url: 'https://angular.dev/api/core/input' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'InputSignal has no .set()/.update() — it is read-only from the child\'s side. Only the parent can change it.',
      'input.required<T>() gives a compile error if the parent forgets to bind it — a real, useful safety net.',
      'transform: numberAttribute/booleanAttribute converts incoming attribute strings automatically.',
    ],
  },

  'parent-child/output-signals': {
    apis: ['output()', 'outputFromObservable()'],
    related: [
      { label: 'input() — previous',                     route: '/angular/parent-child/input-signals' },
      { label: 'Parent-Child Communication (overview)',  route: '/angular/parent-child' },
      { label: 'model() — next',                          route: '/angular/parent-child/model-two-way-binding' },
    ],
    tip: 'The parent-side (eventName)="handler($event)" binding syntax is completely unchanged when migrating from @Output() to output().',
    docs: [
      { label: 'Component Outputs Guide', url: 'https://angular.dev/guide/components/outputs' },
      { label: 'output() API',            url: 'https://angular.dev/api/core/output' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'output() has no EventEmitter/Subject underneath — it is a plain function call, less boilerplate not just hidden boilerplate.',
      'emit() is called the exact same way as the old EventEmitter API — migration on the child side is nearly mechanical.',
      'outputFromObservable() bridges an existing RxJS stream into an output() with no manual subscribe/emit loop.',
    ],
  },

  'parent-child/model-two-way-binding': {
    apis: ['model()', 'model.required()', 'ModelSignal'],
    related: [
      { label: 'output() — previous',                    route: '/angular/parent-child/output-signals' },
      { label: 'Parent-Child Communication (overview)',  route: '/angular/parent-child' },
      { label: 'viewChild() — next',                      route: '/angular/parent-child/viewchild-viewchildren' },
    ],
    tip: '[(count)]="qty" desugars to [count]="qty()" (countChange)="qty.set($event)" — model() generates both the input and the output automatically.',
    docs: [
      { label: 'Two-Way Binding Guide', url: 'https://angular.dev/guide/signals/model' },
      { label: 'model() API',           url: 'https://angular.dev/api/core/model' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'model() is genuinely writable from the child, unlike input() — that is the entire distinction between the two.',
      'Multiple sibling components can bind to the SAME parent signal via model() — changing one updates all of them automatically.',
      'model.required<T>() mirrors input.required() — the parent must provide a [(prop)] binding or it is a compile error.',
    ],
  },

  'parent-child/viewchild-viewchildren': {
    apis: ['viewChild()', 'viewChild.required()', 'viewChildren()'],
    related: [
      { label: 'model() — previous',                     route: '/angular/parent-child/model-two-way-binding' },
      { label: 'Parent-Child Communication (overview)',  route: '/angular/parent-child' },
      { label: 'contentChild() — next',                   route: '/angular/parent-child/contentchild-migration' },
    ],
    tip: 'viewChild() is a signal — read it anywhere, no ngAfterViewInit lifecycle hook needed to know when it becomes available.',
    docs: [
      { label: 'Signal Queries Guide', url: 'https://angular.dev/guide/signals/queries' },
      { label: 'viewChild() API',      url: 'https://angular.dev/api/core/viewChild' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Query by component/directive TYPE or injection token, not only by a string template reference variable.',
      'The read option (e.g. { read: ElementRef }) returns the underlying element instead of the component instance.',
      'viewChild.required() removes the undefined case from the type entirely — use it only for elements structurally guaranteed to exist.',
    ],
  },

  'parent-child/contentchild-migration': {
    apis: ['contentChild()', 'contentChildren()', 'effect()'],
    related: [
      { label: 'viewChild() — previous',                 route: '/angular/parent-child/viewchild-viewchildren' },
      { label: 'Parent-Child Communication (overview)',  route: '/angular/parent-child' },
    ],
    tip: 'contentChild() reads content the PARENT projected in via ng-content — genuinely different from viewChild(), which reads the component\'s own template.',
    docs: [
      { label: 'Signal Queries Guide',  url: 'https://angular.dev/guide/signals/queries' },
      { label: 'contentChild() API',    url: 'https://angular.dev/api/core/contentChild' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Never mix input()/@Input() (or output()/@Output()) on the same property — Angular applies both bindings, producing confusing behavior.',
      'Signal inputs do not trigger ngOnChanges — use effect() to react to changes instead.',
      'More than two levels of prop-drilling through inputs/outputs is a real signal to refactor toward a shared service instead.',
    ],
  },

  // ── FormArray — Dynamic Fields › subtopics (Phase 10) ────────────────────────
  'form-array/dynamic-formarray-of-groups': {
    apis: ['FormArray', 'formArrayName', 'formGroupName'],
    related: [
      { label: 'FormArray — Dynamic Fields (overview)', route: '/angular/form-array' },
      { label: 'Typed FormArray — next',                 route: '/angular/form-array/typed-formarray' },
    ],
    tip: 'A FormArray of FormGroups needs one extra wrapping level per row — [formGroupName]="$index" — that a FormArray of plain controls does not need.',
    docs: [
      { label: 'Reactive Forms Guide', url: 'https://angular.dev/guide/forms/reactive-forms' },
      { label: 'FormArray API',        url: 'https://angular.dev/api/forms/FormArray' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'A factory method for creating rows keeps every new row\'s shape and validators consistent — inlining the definition at every call site risks drift.',
      'A FormArray only accepts AbstractControl instances — always wrap a new row with fb.group()/fb.control() before pushing.',
      'track $index (or a stable id) is required on the @for loop over array controls.',
    ],
  },

  'form-array/typed-formarray': {
    apis: ['FormArray<T>', 'fb.array<T>()', 'UntypedFormArray'],
    related: [
      { label: 'FormArray of FormGroups — previous', route: '/angular/form-array/dynamic-formarray-of-groups' },
      { label: 'FormArray — Dynamic Fields (overview)', route: '/angular/form-array' },
      { label: 'Add, Remove & Reorder — next',        route: '/angular/form-array/formarray-crud-patterns' },
    ],
    tip: 'FormBuilder infers the FormArray<T> generic automatically when there is something to infer from — an explicit generic is only needed starting from a genuinely empty array.',
    docs: [
      { label: 'Typed Forms Guide', url: 'https://angular.dev/guide/forms/typed-forms' },
      { label: 'FormArray API',     url: 'https://angular.dev/api/forms/FormArray' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'FormArray is typed by default since Angular 14, same as FormGroup — it is not a special untyped exception.',
      'formArray.value reflects only enabled controls; formArray.getRawValue() always includes every control.',
      'UntypedFormArray exists purely as a migration bridge for old, loosely-typed code — not a recommended choice for new code.',
    ],
  },

  'form-array/formarray-crud-patterns': {
    apis: ['push()', 'removeAt()', 'moveAt()', 'setControl()'],
    related: [
      { label: 'Typed FormArray — previous',            route: '/angular/form-array/typed-formarray' },
      { label: 'FormArray — Dynamic Fields (overview)',  route: '/angular/form-array' },
      { label: 'Validating the Array Itself — next',     route: '/angular/form-array/formarray-level-validation' },
    ],
    tip: 'form.reset() resets VALUES, not the number of controls — trim a grown FormArray manually with a while (arr.length > n) arr.removeAt(n) loop.',
    docs: [
      { label: 'Reactive Forms Guide', url: 'https://angular.dev/guide/forms/reactive-forms' },
      { label: 'FormArray API',        url: 'https://angular.dev/api/forms/FormArray' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'removeAt() shifts remaining indices to close the gap — there is never a hole left in a FormArray.',
      'moveAt(from, to) (Angular 18+) reorders without manually reading/rewriting each control\'s value.',
      'setControl() atomically replaces the whole array — simpler than a manual removeAt/push loop when bulk-loading from an API.',
    ],
  },

  'form-array/formarray-level-validation': {
    apis: ['AbstractControl', 'ValidationErrors', 'myArray.errors'],
    related: [
      { label: 'Add, Remove & Reorder — previous',      route: '/angular/form-array/formarray-crud-patterns' },
      { label: 'FormArray — Dynamic Fields (overview)',  route: '/angular/form-array' },
    ],
    tip: 'An array-level error lives on myArray.errors — not on any individual item\'s own .errors.',
    docs: [
      { label: 'Form Validation Guide', url: 'https://angular.dev/guide/forms/form-validation' },
      { label: 'AbstractControl API',   url: 'https://angular.dev/api/forms/AbstractControl' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Item-level and array-level validators are two separate layers — neither substitutes for the other.',
      'The array can be invalid due to ITS OWN validator (e.g. min length) even when every item is independently valid.',
      'Array-level validators are passed as fb.array()\'s SECOND argument, alongside (not mixed into) the initial controls array.',
    ],
  },

  // ── @defer — Deferred Loading › subtopics (Phase 10) ─────────────────────────
  'defer/defer-basics': {
    apis: ['@defer', '@placeholder', 'on idle'],
    related: [
      { label: '@defer — Deferred Loading (overview)', route: '/angular/defer' },
      { label: 'Trigger Conditions — next',              route: '/angular/defer/defer-triggers' },
    ],
    tip: '@defer complements route-level loadComponent() lazy loading, it does not replace it — one splits pages, the other splits heavy widgets within a page.',
    docs: [
      { label: 'Deferred Loading Guide', url: 'https://angular.dev/guide/templates/defer' },
      { label: '@defer API',             url: 'https://angular.dev/api/core/@defer' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'No manual dynamic import() needed — the compiler code-splits automatically for standalone components inside @defer.',
      'With no explicit trigger, @defer defaults to on idle, not "never load".',
      '@defer only works with standalone components — NgModule-declared ones must be migrated first.',
    ],
  },

  'defer/defer-triggers': {
    apis: ['on viewport', 'on interaction', 'on hover', 'when'],
    related: [
      { label: 'What Is @defer? — previous',            route: '/angular/defer/defer-basics' },
      { label: '@defer — Deferred Loading (overview)',  route: '/angular/defer' },
      { label: 'Placeholder, Loading & Error — next',    route: '/angular/defer/placeholder-loading-error' },
    ],
    tip: 'on hover gives a head-start on the download before the click; on interaction only starts downloading once the user actually clicks/focuses.',
    docs: [
      { label: 'Deferred Loading Guide', url: 'https://angular.dev/guide/templates/defer' },
      { label: '@defer API',             url: 'https://angular.dev/api/core/@defer' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'when expr reads a signal directly — it fires the moment that signal becomes truthy.',
      'Multiple triggers can combine with a semicolon — whichever fires first wins.',
      'on timer(Xms) counts from page stability (or another combined trigger), not from component creation.',
    ],
  },

  'defer/placeholder-loading-error': {
    apis: ['@placeholder', '@loading', '@error', 'minimum', 'after'],
    related: [
      { label: 'Trigger Conditions — previous',          route: '/angular/defer/defer-triggers' },
      { label: '@defer — Deferred Loading (overview)',   route: '/angular/defer' },
      { label: 'Requirements & Nesting — next',           route: '/angular/defer/defer-requirements-nesting' },
    ],
    tip: '@loading (minimum Xms) prevents a jarring one-frame flash of the spinner on fast connections — always pair it with a sensible minimum.',
    docs: [
      { label: 'Deferred Loading Guide', url: 'https://angular.dev/guide/templates/defer' },
      { label: '@defer API',             url: 'https://angular.dev/api/core/@defer' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'All three companion blocks are optional — a bare @defer {} is valid syntax.',
      '@placeholder (after Xms) avoids showing a skeleton for content that loads near-instantly.',
      '@error is specifically for chunk DOWNLOAD failures, not runtime errors inside the loaded component.',
    ],
  },

  'defer/defer-requirements-nesting': {
    apis: ['imports[]', 'nested @defer', 'SSR hydration'],
    related: [
      { label: 'Placeholder, Loading & Error — previous', route: '/angular/defer/placeholder-loading-error' },
      { label: '@defer — Deferred Loading (overview)',    route: '/angular/defer' },
      { label: 'Performance & Prefetching — next',         route: '/angular/defer/defer-performance-prefetch' },
    ],
    tip: 'The deferred component must still be listed in imports[] — the compiler needs that declaration to identify which chunk to split, even though it is lazy-loaded.',
    docs: [
      { label: 'Deferred Loading Guide', url: 'https://angular.dev/guide/templates/defer' },
      { label: '@defer API',             url: 'https://angular.dev/api/core/@defer' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Nested @defer blocks are fully independent — a parent does not have to resolve before a child\'s trigger can fire.',
      'Once loaded, a deferred component behaves completely normally — only WHEN the JS arrives changes, not HOW it runs.',
      'SSR support (stable since Angular 19) renders @placeholder on the server; the real component hydrates client-side.',
    ],
  },

  'defer/defer-performance-prefetch': {
    apis: ['prefetch', 'networkIdle()'],
    related: [
      { label: 'Requirements & Nesting — previous',      route: '/angular/defer/defer-requirements-nesting' },
      { label: '@defer — Deferred Loading (overview)',   route: '/angular/defer' },
    ],
    tip: 'prefetch controls only WHEN the chunk downloads — the component still only RENDERS once its own separate primary trigger fires.',
    docs: [
      { label: 'Deferred Loading Guide', url: 'https://angular.dev/guide/templates/defer' },
      { label: '@defer API',             url: 'https://angular.dev/api/core/@defer' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Do not defer small/simple components — the extra HTTP request overhead can exceed whatever was saved.',
      'The primary metric improved is Time to Interactive, not necessarily perceived visual load speed.',
      'Check the Network tab — a deferred component with heavy static imports can still produce an unexpectedly large chunk.',
    ],
  },

  // ── Angular Material › subtopics (Phase 10) ──────────────────────────────────
  'material/material-setup-theming': {
    apis: ['ng add', 'provideAnimationsAsync()', 'MatButtonModule'],
    related: [
      { label: 'Angular Material (overview)', route: '/angular/material' },
      { label: 'Form Fields — next',           route: '/angular/material/material-form-fields' },
    ],
    tip: 'provideAnimationsAsync() is required — skipping it can throw ExpressionChangedAfterChecked errors on dialogs/snackbars/panels, not just lose animations.',
    docs: [
      { label: 'Getting Started Guide', url: 'https://material.angular.dev/guide/getting-started' },
      { label: 'Theming Guide',         url: 'https://material.angular.dev/guide/theming' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Every Material component is standalone-compatible — import individual modules directly, no NgModule wrapper needed.',
      'Material is built on the CDK — CDK primitives are usable independently of Material\'s visual layer.',
      'Pre-built themes are the fastest start; mat.define-theme() gives full custom control.',
    ],
  },

  'material/material-form-fields': {
    apis: ['MatFormField', 'mat-error', 'MatSelect', 'MatAutocomplete'],
    related: [
      { label: 'Setup & Theming — previous',   route: '/angular/material/material-setup-theming' },
      { label: 'Angular Material (overview)',  route: '/angular/material' },
      { label: 'Buttons & Dialogs — next',      route: '/angular/material/material-common-components' },
    ],
    tip: 'mat-error shows automatically once a control is both invalid and touched — no manual @if guard needed.',
    docs: [
      { label: 'Form Field Guide', url: 'https://material.angular.dev/components/form-field/overview' },
      { label: 'Select Guide',     url: 'https://material.angular.dev/components/select/overview' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'MAT_FORM_FIELD_DEFAULT_OPTIONS sets appearance globally instead of repeating it per field.',
      'MatSelect is a full overlay panel, not a styled <select> — it supports grouping and multi-select natively.',
      'MatAutocomplete needs its results filtered yourself (computed() or switchMap) — it does not filter automatically.',
    ],
  },

  'material/material-common-components': {
    apis: ['MatSnackBar', 'MatDialog', 'MAT_DIALOG_DATA', 'MatDialogRef'],
    related: [
      { label: 'Form Fields — previous',        route: '/angular/material/material-form-fields' },
      { label: 'Angular Material (overview)',   route: '/angular/material' },
      { label: 'MatTable — next',                route: '/angular/material/mattable-sorting-pagination' },
    ],
    tip: 'MatDialog.open() returns immediately — the result only arrives asynchronously via .afterClosed().subscribe(), once MatDialogRef.close(result) is called inside the dialog.',
    docs: [
      { label: 'Dialog Guide',    url: 'https://material.angular.dev/components/dialog/overview' },
      { label: 'Snack Bar Guide', url: 'https://material.angular.dev/components/snack-bar/overview' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'All six button variants share the same color="primary|accent|warn" attribute.',
      'MatSnackBar.open() is asynchronous — it does not block execution while the toast is visible.',
      'MAT_DIALOG_DATA reads data passed into open(); MatDialogRef closes and returns a result to the caller.',
    ],
  },

  'material/mattable-sorting-pagination': {
    apis: ['MatTableDataSource', 'MatSort', 'MatPaginator', 'DataSource<T>'],
    related: [
      { label: 'Buttons & Dialogs — previous',  route: '/angular/material/material-common-components' },
      { label: 'Angular Material (overview)',   route: '/angular/material' },
      { label: 'Testing & Accessibility — next', route: '/angular/material/material-testing-accessibility' },
    ],
    tip: 'Assign dataSource.sort/dataSource.paginator in ngAfterViewInit, never the constructor — @ViewChild is not populated yet when the constructor runs.',
    docs: [
      { label: 'Table Guide',    url: 'https://material.angular.dev/components/table/overview' },
      { label: 'Sort Guide',     url: 'https://material.angular.dev/components/sort/overview' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'MatTableDataSource holds the full dataset in memory — use a custom DataSource<T> for genuinely large, server-paginated data.',
      'mat-sort-header sorts by the column\'s matColumnDef name by default — override sortingDataAccessor when they differ.',
      'displayedColumns controls row/header ORDER — matColumnDef only defines what a column renders, not its position.',
    ],
  },

  'material/material-testing-accessibility': {
    apis: ['provideNoopAnimations()', 'aria-label', 'MatIconRegistry'],
    related: [
      { label: 'MatTable — previous',           route: '/angular/material/mattable-sorting-pagination' },
      { label: 'Angular Material (overview)',   route: '/angular/material' },
    ],
    tip: 'Icon-only buttons are the one case Material never auto-labels — always add aria-label yourself since there is no visible text to announce.',
    docs: [
      { label: 'Accessibility Guide', url: 'https://material.angular.dev/guide/accessibility' },
      { label: 'Testing Guide',       url: 'https://material.angular.dev/guide/testing' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Real animations make component tests flaky — provideNoopAnimations() in the test bed fixes this.',
      'Never import a barrel MaterialModule — always import individual modules for tree-shaking to work.',
      'Avoid combining Material with another global CSS reset (e.g. normalize.css) — they conflict on baseline styles.',
    ],
  },

  // ── Signal Store Pattern › subtopics (Phase 10) ──────────────────────────────
  'store/async-store-operations': {
    apis: ['async/await', 'finally', 'firstValueFrom()', 'rxMethod()'],
    related: [
      { label: 'Signal Store Pattern (overview)', route: '/angular/store' },
      { label: 'Signal Store vs NgRx — next',      route: '/angular/store/signal-store-vs-ngrx' },
    ],
    tip: 'The finally block is not optional — without it, an error path can leave loading stuck at true forever.',
    docs: [
      { label: 'Signals Overview', url: 'https://angular.dev/guide/signals' },
      { label: '@ngrx/signals Guide', url: 'https://ngrx.io/guide/signals' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'No actions or effects needed — a store\'s async method is just a plain async method.',
      'firstValueFrom() bridges HttpClient\'s Observable to a single awaited value inside a store method.',
      'rxMethod() earns its complexity for polling/retry/cancellation flows — not a default for every async method.',
    ],
  },

  'store/signal-store-vs-ngrx': {
    apis: ['signalStore()', 'withEntities()', 'patchState()'],
    related: [
      { label: 'Async Store Operations — previous', route: '/angular/store/async-store-operations' },
      { label: 'Signal Store Pattern (overview)',    route: '/angular/store' },
      { label: 'Testing & Composing — next',          route: '/angular/store/testing-composing-stores' },
    ],
    tip: 'Plain signal stores and NgRx are not mutually exclusive — a single app can use both for different slices of state.',
    docs: [
      { label: '@ngrx/signals Guide', url: 'https://ngrx.io/guide/signals' },
      { label: '@ngrx/store Guide',   url: 'https://ngrx.io/guide/store' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Plain signal stores have NO built-in DevTools support — that missing tooling is the real tradeoff for less boilerplate.',
      '@ngrx/signals\' withEntities() gives structured entity-collection CRUD with less hand-written code than a plain array/Map.',
      'Classic @ngrx/store earns its cost specifically for DevTools time-travel debugging and enforced unidirectional flow at scale.',
    ],
  },

  'store/testing-composing-stores': {
    apis: ['TestBed.inject()', 'fakeAsync/tick', 'inject()'],
    related: [
      { label: 'Signal Store vs NgRx — previous', route: '/angular/store/signal-store-vs-ngrx' },
      { label: 'Signal Store Pattern (overview)', route: '/angular/store' },
    ],
    tip: 'Signal state reads synchronously in tests — expect(store.total()).toBe(30) needs no async ceremony or detectChanges().',
    docs: [
      { label: 'Testing Guide', url: 'https://angular.dev/guide/testing' },
      { label: 'Dependency Injection Guide', url: 'https://angular.dev/guide/di' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'A store is just a plain class — TestBed.inject() or new MyStore() both work depending on its DI dependencies.',
      'Stores compose by plain injection (constructor/inject()) — the opposite of prop-drilling through components.',
      'A true circular dependency between two stores cannot be resolved by DI — extract shared state to a third store instead.',
    ],
  },

  // ── Template Syntax › subtopics (Phase 10) ───────────────────────────────────
  'templates/interpolation-expressions': {
    apis: ['{{ }}', 'computed()'],
    related: [
      { label: 'Template Syntax (overview)', route: '/angular/templates' },
      { label: 'Property & Event Binding — next', route: '/angular/templates/property-event-two-way-binding' },
    ],
    tip: 'A method returning a new array/object on every call, bound directly in a template, makes an OnPush child see a "changed" input every cycle — wrap it in computed() to memoize.',
    docs: [
      { label: 'Template Syntax Guide', url: 'https://angular.dev/guide/templates' },
      { label: 'Interpolation Guide',   url: 'https://angular.dev/guide/templates/interpolation' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      '{{ count }} without () on a signal silently shows "[object Object]" — no compile error, just a wrong display value.',
      'Template expressions can be evaluated multiple times per change-detection cycle — side effects inside them run unpredictably.',
      'Expressions run in the component INSTANCE\'s context — no this. prefix needed.',
    ],
  },

  'templates/property-event-two-way-binding': {
    apis: ['[property]', '[attr.x]', '(event)', '[(model)]'],
    related: [
      { label: 'Interpolation — previous',      route: '/angular/templates/interpolation-expressions' },
      { label: 'Template Syntax (overview)',    route: '/angular/templates' },
      { label: 'Template Refs & @let — next',    route: '/angular/templates/template-refs-and-let' },
    ],
    tip: '[aria-label] silently fails at runtime (no matching DOM property) — use [attr.aria-label] for attributes with no DOM property equivalent.',
    docs: [
      { label: 'Property Binding Guide', url: 'https://angular.dev/guide/templates/property-binding' },
      { label: 'Event Binding Guide',    url: 'https://angular.dev/guide/templates/event-binding' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Key-combo event shortcuts like (keyup.enter)/(keydown.escape) avoid manual event.key checks.',
      '[(ngModel)] requires FormsModule — skip it and Angular throws a clear compile-time error, unlike the silent attr/property mismatch.',
      'model() signals support [(prop)] on YOUR OWN components with zero ngModel/FormsModule involvement.',
    ],
  },

  'templates/template-refs-and-let': {
    apis: ['#ref', '@let', 'viewChild()'],
    related: [
      { label: 'Property & Event Binding — previous', route: '/angular/templates/property-event-two-way-binding' },
      { label: 'Template Syntax (overview)',           route: '/angular/templates' },
      { label: 'Pipes — next',                          route: '/angular/templates/pipes-built-in-custom' },
    ],
    tip: '@let follows the same block-scoping as #ref — a @let declared inside @if is not accessible outside that block.',
    docs: [
      { label: 'Template Reference Variables', url: 'https://angular.dev/guide/templates/reference-variables' },
      { label: '@let Guide',                    url: 'https://angular.dev/guide/templates/let-template-variables' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'A template reference\'s TYPE depends on what it is placed on — element, component instance, directive instance, or TemplateRef.',
      '#f="ngForm" disambiguates to the NgForm directive instance instead of the raw HTMLFormElement.',
      '@let avoids re-evaluating the same expression (a signal call, an async-piped value) multiple times in one block.',
    ],
  },

  'templates/pipes-built-in-custom': {
    apis: ['| pipeName', 'async', 'PipeTransform'],
    related: [
      { label: 'Template Refs & @let — previous', route: '/angular/templates/template-refs-and-let' },
      { label: 'Template Syntax (overview)',       route: '/angular/templates' },
    ],
    tip: 'The async pipe auto-unsubscribes on component destroy — the single biggest reason to prefer it over a manual .subscribe() call.',
    docs: [
      { label: 'Pipes Guide',       url: 'https://angular.dev/guide/pipes' },
      { label: 'Custom Pipes Guide', url: 'https://angular.dev/guide/pipes/custom-pipes' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Every pipe (built-in or custom) must be imported individually into each standalone component\'s imports array.',
      'Pure pipes (the default) only re-run when the input REFERENCE changes — in-place mutation with the same reference is invisible to them.',
      'Pipes chain left to right — {{ data$ | async | json }} is a genuinely useful debugging pattern.',
    ],
  },

  // ── Custom Directives › subtopics (Phase 10) ─────────────────────────────────
  'directives/attribute-directive-anatomy': {
    apis: ['ElementRef', 'Renderer2', '@HostListener', 'host: {}'],
    related: [
      { label: 'Custom Directives (overview)', route: '/angular/directives' },
      { label: 'Custom Structural Directives — next', route: '/angular/directives/custom-structural-directives' },
    ],
    tip: 'Never mutate el.nativeElement.style directly — Renderer2 exists specifically because direct DOM mutation breaks SSR and web-worker rendering.',
    docs: [
      { label: 'Attribute Directives Guide', url: 'https://angular.dev/guide/directives/attribute-directives' },
      { label: 'Renderer2 API',              url: 'https://angular.dev/api/core/Renderer2' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Directives are standalone by default since Angular 14 — import the class directly, no NgModule.',
      'host: {...} in the decorator is the modern alternative to per-property @HostBinding decorators.',
      'Prefer signal input() over @Input() for directive inputs — reactive, works with OnPush, composes with computed().',
    ],
  },

  'directives/custom-structural-directives': {
    apis: ['TemplateRef', 'ViewContainerRef', 'createEmbeddedView()'],
    related: [
      { label: 'Attribute Directive Anatomy — previous', route: '/angular/directives/attribute-directive-anatomy' },
      { label: 'Custom Directives (overview)',            route: '/angular/directives' },
      { label: 'Directive Composition API — next',         route: '/angular/directives/directive-composition-api' },
    ],
    tip: 'Signal inputs do not trigger ngOnChanges — use effect() inside the directive to react to the input and re-render the embedded views.',
    docs: [
      { label: 'Structural Directives Guide', url: 'https://angular.dev/guide/directives/structural-directives' },
      { label: 'ViewContainerRef API',        url: 'https://angular.dev/api/core/ViewContainerRef' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      '*attr="value" is sugar for <ng-template [attr]="value"> — the same desugaring for built-in and custom structural directives alike.',
      'Only $implicit binds without a name — every other context property needs an explicit let-x="propName" binding.',
      'Prefer @if/@for for ordinary conditions/loops — build a custom structural directive only for reusable logic with richer inputs.',
    ],
  },

  'directives/directive-composition-api': {
    apis: ['hostDirectives', 'inputs: []', 'outputs: []'],
    related: [
      { label: 'Custom Structural Directives — previous', route: '/angular/directives/custom-structural-directives' },
      { label: 'Custom Directives (overview)',             route: '/angular/directives' },
    ],
    tip: 'Nothing is exposed by default — only inputs/outputs explicitly listed in a hostDirectives entry become accessible on the composed component.',
    docs: [
      { label: 'Directive Composition Guide', url: 'https://angular.dev/guide/directives/directive-composition-api' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'hostDirectives eliminates manual input/output forwarding entirely — not just a syntax convenience over a wrapper component.',
      'A composed component can itself be composed further — hostDirectives supports multi-level composition trees.',
      '{ directive: X, inputs: [\'a: b\'] } re-exposes X\'s input "a" under the new name "b" on the host.',
    ],
  },

  // ── Lifecycle Hooks › subtopics (Phase 10) ───────────────────────────────────
  'lifecycle/lifecycle-hook-sequence': {
    apis: ['ngOnInit', 'ngDoCheck', 'ngOnDestroy'],
    related: [
      { label: 'Lifecycle Hooks (overview)', route: '/angular/lifecycle' },
      { label: 'ngOnChanges & ngOnInit — next', route: '/angular/lifecycle/init-hooks-ngonchanges-ngoninit' },
    ],
    tip: 'The constructor is not a lifecycle hook — it runs before Angular has set up inputs or the view. Only DI and effect()/afterNextRender() registration belong there.',
    docs: [
      { label: 'Lifecycle Hooks Guide', url: 'https://angular.dev/guide/components/lifecycle' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      '"Init" hooks fire exactly once; "Checked" hooks fire on every change detection cycle.',
      'In zoneless Angular (18+), ngDoCheck runs far less often — only when a signal change triggers re-evaluation.',
      'A component with no @Input() properties never calls ngOnChanges at all, not even once.',
    ],
  },

  'lifecycle/init-hooks-ngonchanges-ngoninit': {
    apis: ['SimpleChanges', 'ngOnInit', 'input.required()'],
    related: [
      { label: 'The Hook Sequence — previous',  route: '/angular/lifecycle/lifecycle-hook-sequence' },
      { label: 'Lifecycle Hooks (overview)',    route: '/angular/lifecycle' },
      { label: 'View & Content Hooks — next',    route: '/angular/lifecycle/view-content-hooks-afternextrender' },
    ],
    tip: 'Signal inputs do NOT trigger ngOnChanges at all — effect() is the reactive replacement, and this is the single biggest surprise during migration.',
    docs: [
      { label: 'Lifecycle Hooks Guide', url: 'https://angular.dev/guide/components/lifecycle' },
      { label: 'Signal Inputs Guide',   url: 'https://angular.dev/guide/signals/inputs' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'A component with BOTH @Input() and input() properties gets ngOnChanges only for the decorator-based ones.',
      'ngOnInit fires once, after the first ngOnChanges — avoid DOM access here, the view is not rendered yet.',
      'input.required<T>() (like @Input({ required: true })) is a compile-time error if the parent forgets to bind it.',
    ],
  },

  'lifecycle/view-content-hooks-afternextrender': {
    apis: ['ngAfterViewInit', 'ngAfterContentInit', 'afterNextRender()'],
    related: [
      { label: 'ngOnChanges & ngOnInit — previous', route: '/angular/lifecycle/init-hooks-ngonchanges-ngoninit' },
      { label: 'Lifecycle Hooks (overview)',         route: '/angular/lifecycle' },
      { label: 'Cleanup — next',                      route: '/angular/lifecycle/cleanup-destroyref-takeuntildestroyed' },
    ],
    tip: 'ngAfterContentInit fires BEFORE ngAfterViewInit — projected content initializes before the component\'s own view finishes, the opposite of what the names might suggest.',
    docs: [
      { label: 'Lifecycle Hooks Guide',  url: 'https://angular.dev/guide/components/lifecycle' },
      { label: 'afterNextRender() API',  url: 'https://angular.dev/api/core/afterNextRender' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Writing to a signal inside a "Checked" hook risks ExpressionChangedAfterCheckedError — keep them side-effect free.',
      'afterNextRender() runs exactly once; afterRender() runs after EVERY paint — do not confuse the two.',
      'afterNextRender() is the SSR-safe replacement for DOM access that used to live in ngAfterViewInit.',
    ],
  },

  'lifecycle/cleanup-destroyref-takeuntildestroyed': {
    apis: ['DestroyRef', 'takeUntilDestroyed()', 'ngOnDestroy'],
    related: [
      { label: 'View & Content Hooks — previous', route: '/angular/lifecycle/view-content-hooks-afternextrender' },
      { label: 'Lifecycle Hooks (overview)',       route: '/angular/lifecycle' },
    ],
    tip: 'DestroyRef is injectable anywhere with an injection context — a plain service, a composable function — not just component classes implementing OnDestroy.',
    docs: [
      { label: 'DestroyRef API',           url: 'https://angular.dev/api/core/DestroyRef' },
      { label: 'RxJS Interop Guide',        url: 'https://angular.dev/guide/signals/rxjs-interop' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'takeUntilDestroyed() called outside the constructor needs an explicit destroyRef argument.',
      'All three cleanup mechanisms (ngOnDestroy, DestroyRef, takeUntilDestroyed) can coexist for different kinds of cleanup in the same component.',
      'takeUntilDestroyed() for RxJS subscriptions; DestroyRef.onDestroy() for native APIs (ResizeObserver, setInterval); ngOnDestroy only when a class interface is specifically required.',
    ],
  },

  // ── Pipes › subtopics (Phase 10) ─────────────────────────────────────────────
  'pipes/formatting-pipes-locale': {
    apis: ['DatePipe', 'CurrencyPipe', 'DecimalPipe', 'PercentPipe'],
    related: [
      { label: 'Pipes (overview)', route: '/angular/pipes' },
      { label: 'Collection & String Pipes — next', route: '/angular/pipes/collection-string-pipes' },
    ],
    tip: 'Date/Currency/Decimal/Percent all share the same digit-info string format ({minInt}.{minFrac}-{maxFrac}) — learn it once for any of them.',
    docs: [
      { label: 'Pipes Guide', url: 'https://angular.dev/guide/pipes' },
      { label: 'i18n Guide',  url: 'https://angular.dev/guide/i18n' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'LOCALE_ID defaults to en-US regardless of the browser\'s language — set it explicitly for other locales.',
      'registerLocaleData() alone has no visible effect — you must also set LOCALE_ID in providers.',
      'DatePipe format strings follow Unicode Date Format patterns, not a custom Angular-only syntax.',
    ],
  },

  'pipes/collection-string-pipes': {
    apis: ['SlicePipe', 'JsonPipe', 'TitleCasePipe'],
    related: [
      { label: 'Formatting Pipes & Locale — previous', route: '/angular/pipes/formatting-pipes-locale' },
      { label: 'Pipes (overview)',                      route: '/angular/pipes' },
      { label: 'AsyncPipe & @let — next',                route: '/angular/pipes/async-pipe-let-performance' },
    ],
    tip: 'Remove JsonPipe before shipping to production — it exposes the FULL object structure in the DOM, which can leak data you never intended to display.',
    docs: [
      { label: 'Pipes Guide',   url: 'https://angular.dev/guide/pipes' },
      { label: 'SlicePipe API', url: 'https://angular.dev/api/common/SlicePipe' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'SlicePipe works on both arrays and strings, with the same start/end/negative-index semantics as JS\'s native .slice().',
      'TitleCasePipe capitalizes each word\'s first letter — genuinely different output from UpperCasePipe.',
      'SlicePipe always returns a new array reference — safe to chain with a downstream pure pipe.',
    ],
  },

  'pipes/async-pipe-let-performance': {
    apis: ['async', '@let', 'computed()'],
    related: [
      { label: 'Collection & String Pipes — previous', route: '/angular/pipes/collection-string-pipes' },
      { label: 'Pipes (overview)',                       route: '/angular/pipes' },
    ],
    tip: 'Each | async expression is its OWN separate subscription — placing it twice on the same Observable creates two subscriptions, not one shared value.',
    docs: [
      { label: 'Pipes Guide', url: 'https://angular.dev/guide/pipes' },
      { label: '@let Guide',   url: 'https://angular.dev/guide/templates/let-template-variables' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      '@let resolves an | async expression once and lets you reuse the value, avoiding duplicate subscriptions.',
      'An impure pipe (pure: false) re-runs on EVERY change detection cycle — computed() memoizes and only recalculates on genuine dependency changes.',
      'The resolved value is null until the first emission — guard with @if before reading properties on it.',
    ],
  },

  // ── Dependency Injection › subtopics (Phase 10) ──────────────────────────────
  'di/injection-context-deep-dive': {
    apis: ['inject()', 'runInInjectionContext()', 'assertInInjectionContext()'],
    related: [
      { label: 'Dependency Injection (overview)',            route: '/angular/di' },
      { label: 'Multi-Providers & Extension Points — next',  route: '/angular/di/multi-providers-extension-points' },
    ],
    tip: 'inject() only works during class construction (field init / constructor body) — call it before the first await in a functional guard or resolver, not after.',
    docs: [
      { label: 'DI Guide',      url: 'https://angular.dev/guide/di' },
      { label: 'inject() API',  url: 'https://angular.dev/api/core/inject' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Functional guards/resolvers get an injection context only for their synchronous portion — inject() after an await throws NG0203.',
      'Composable "inject function" helpers are plain functions, not a registered Angular API — they just need to be called synchronously in a valid context.',
      'runInInjectionContext() requires a live Injector captured BEFORE the deferred callback runs — it cannot create context out of nothing.',
    ],
  },

  'di/multi-providers-extension-points': {
    apis: ['multi: true', 'InjectionToken', 'provideAppInitializer()'],
    related: [
      { label: 'Injection Context Deep Dive — previous',                route: '/angular/di/injection-context-deep-dive' },
      { label: 'Dependency Injection (overview)',                       route: '/angular/di' },
      { label: 'Environment Injectors & Standalone Bootstrap — next',   route: '/angular/di/environment-injectors-standalone-bootstrap' },
    ],
    tip: 'Always give a multi: true token a default factory returning [] — without one, inject() throws NullInjectorError when nothing has registered, not an empty array.',
    docs: [
      { label: 'DI Guide',              url: 'https://angular.dev/guide/di' },
      { label: 'HTTP_INTERCEPTORS API', url: 'https://angular.dev/api/common/http/HTTP_INTERCEPTORS' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'multi: true providers for the same token ACCUMULATE into an array — the second registration does not overwrite the first.',
      'Order is generally registration order across the effective providers array — do not rely on a specific cross-feature order unless you control the whole list.',
      'provideAppInitializer() runs before bootstrap completes and waits for a returned Promise/Observable — it is not a post-render lifecycle hook.',
    ],
  },

  'di/environment-injectors-standalone-bootstrap': {
    apis: ['EnvironmentInjector', 'createEnvironmentInjector()', 'bootstrapApplication()'],
    related: [
      { label: 'Multi-Providers & Extension Points — previous', route: '/angular/di/multi-providers-extension-points' },
      { label: 'Dependency Injection (overview)',                route: '/angular/di' },
    ],
    tip: 'inject() searches the ElementInjector hierarchy (component/directive providers) FIRST, and only falls back to the EnvironmentInjector hierarchy if nothing is found there.',
    docs: [
      { label: 'DI Guide',                     url: 'https://angular.dev/guide/di' },
      { label: 'createEnvironmentInjector API', url: 'https://angular.dev/api/core/createEnvironmentInjector' },
    ],
    resources: [
      { label: 'Angular — YouTube', url: 'https://www.youtube.com/@Angular', badge: 'video' },
    ],
    gotchas: [
      'Route-level providers:[] creates a child EnvironmentInjector, NOT an ElementInjector — a different mechanism from a component\'s own providers despite similar syntax.',
      'A manually created environment injector (createEnvironmentInjector) is not destroyed automatically — call .destroy() explicitly or its providers leak for the app\'s lifetime.',
      'bootstrapApplication({ providers }) sets up the root EnvironmentInjector — the standalone-app replacement for the old root NgModule.providers array.',
    ],
  },

  // ── Template Syntax ────────────────────────────────────────────────────────
  templates: {
    apis: ['[property]', '(event)', '@if', '@for', 'async |', '?.'],
    related: [
      { label: 'Directives',  route: '/angular/directives' },
      { label: 'Pipes',       route: '/angular/pipes'      },
      { label: 'Lifecycle',   route: '/angular/lifecycle'  },
    ],
    tip: 'Prefer @if / @for over *ngIf / *ngFor for all new code — no CommonModule import needed.',
    docs: [
      { label: 'Template Overview',    url: 'https://angular.dev/guide/templates'           },
      { label: 'Control Flow (@if)',   url: 'https://angular.dev/guide/templates/control-flow' },
      { label: 'Property Binding',     url: 'https://angular.dev/guide/templates/property-binding' },
      { label: 'Event Binding',        url: 'https://angular.dev/guide/templates/event-binding'    },
    ],
    resources: [
      { label: 'Template Reference',   url: 'https://angular.dev/guide/templates',          badge: 'docs'  },
      { label: 'angular.dev Tutorials',url: 'https://angular.dev/tutorials',                badge: 'blog'  },
    ],
    gotchas: [
      '@for requires a track expression — without it Angular re-creates the entire DOM list on every change.',
      'Safe navigation ?. only short-circuits in templates — it does not guard inside TypeScript expressions.',
      'Two-way [(ngModel)] requires FormsModule imported in the component — it is not available globally.',
    ],
  },

  // ── Directives ─────────────────────────────────────────────────────────────
  directives: {
    apis: ['@Directive', 'HostBinding', 'HostListener', 'Renderer2', 'inject()'],
    related: [
      { label: 'Template Syntax',      route: '/angular/templates'           },
      { label: 'Content Projection',   route: '/angular/content-projection'  },
      { label: 'Angular CDK',          route: '/angular/cdk'                 },
    ],
    tip: 'Use Renderer2 instead of direct DOM access — keeps directives SSR-safe and platform-agnostic.',
    docs: [
      { label: 'Attribute Directives',   url: 'https://angular.dev/guide/directives/attribute-directives' },
      { label: 'Structural Directives',  url: 'https://angular.dev/guide/directives/structural-directives'},
      { label: 'Directive Composition',  url: 'https://angular.dev/guide/directives/directive-composition-api' },
    ],
    resources: [
      { label: 'Renderer2 API',          url: 'https://angular.dev/api/core/Renderer2',     badge: 'docs'  },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',              badge: 'blog'  },
    ],
    gotchas: [
      'Structural directives cannot be on the same element as another structural directive — use <ng-container> to nest them.',
      'HostListener events fire on the host element, not the component inside it — be specific with event targets.',
    ],
  },

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────
  lifecycle: {
    apis: ['ngOnInit', 'ngOnDestroy', 'afterNextRender()', 'DestroyRef', 'viewChild()'],
    related: [
      { label: 'DestroyRef',        route: '/angular/destroy-ref'   },
      { label: 'Signals & State',   route: '/angular/counter'       },
      { label: 'Input / Output',    route: '/angular/parent-child'  },
    ],
    tip: 'Replace ngOnDestroy + Subject takeUntil with takeUntilDestroyed() — less code and never forgets cleanup.',
    docs: [
      { label: 'Lifecycle Hooks Guide',  url: 'https://angular.dev/guide/components/lifecycle'              },
      { label: 'afterNextRender API',    url: 'https://angular.dev/api/core/afterNextRender'                },
      { label: 'DestroyRef API',         url: 'https://angular.dev/api/core/DestroyRef'                     },
    ],
    resources: [
      { label: 'takeUntilDestroyed',     url: 'https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed', badge: 'docs' },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                              badge: 'blog' },
    ],
    gotchas: [
      'viewChild() signal is undefined during ngOnInit — read it inside effect() or afterViewInit, never in ngOnInit.',
      'ngAfterViewInit is NOT SSR-safe — use afterNextRender() for DOM operations that need the browser.',
      'ngOnChanges fires BEFORE ngOnInit on the first render — both receive the initial input values.',
    ],
  },

  // ── Pipes ──────────────────────────────────────────────────────────────────
  pipes: {
    apis: ['DatePipe', 'CurrencyPipe', 'AsyncPipe', 'PipeTransform', 'pure: false'],
    related: [
      { label: 'Template Syntax',  route: '/angular/templates' },
      { label: 'RxJS Operators',   route: '/angular/rxjs'      },
      { label: 'i18n',             route: '/angular/i18n'      },
    ],
    tip: 'Keep custom pipes pure (default) — Angular memoises the result and only re-runs when the input reference changes.',
    docs: [
      { label: 'Pipes Overview',        url: 'https://angular.dev/guide/pipes'                       },
      { label: 'Custom Pipes',          url: 'https://angular.dev/guide/pipes/custom-pipes'          },
      { label: 'Async Pipe',            url: 'https://angular.dev/api/common/AsyncPipe'              },
      { label: 'DatePipe API',          url: 'https://angular.dev/api/common/DatePipe'               },
    ],
    resources: [
      { label: 'CurrencyPipe API',      url: 'https://angular.dev/api/common/CurrencyPipe',          badge: 'docs'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                        badge: 'blog'  },
    ],
    gotchas: [
      'Impure pipes (pure: false) run on every change detection cycle — use them only when the output depends on mutable state.',
      'The async pipe auto-unsubscribes but only when the component is destroyed — if the template re-renders the subscription resets.',
    ],
  },

  // ── Input / Output ─────────────────────────────────────────────────────────
  'parent-child': {
    apis: ['input()', 'output()', 'model()', 'viewChild()', 'withComponentInputBinding()'],
    related: [
      { label: 'Content Projection',  route: '/angular/content-projection' },
      { label: 'Dependency Injection',route: '/angular/di'                 },
      { label: 'Routing',             route: '/angular/routing'            },
    ],
    tip: 'Use model() for two-way bindings — one line instead of @Input + @Output(\'xChange\').',
    docs: [
      { label: 'Component Inputs',         url: 'https://angular.dev/guide/components/inputs'              },
      { label: 'Component Outputs',        url: 'https://angular.dev/guide/components/outputs'             },
      { label: 'model() Signal',           url: 'https://angular.dev/api/core/model'                       },
      { label: 'input() API',              url: 'https://angular.dev/api/core/input'                       },
    ],
    resources: [
      { label: 'viewChild() API',          url: 'https://angular.dev/api/core/viewChild',                  badge: 'docs'  },
      { label: 'angular.dev Tutorials',    url: 'https://angular.dev/tutorials',                           badge: 'blog'  },
    ],
    gotchas: [
      'input.required() has no default — if the parent forgets to bind it, you get a compile error, not a runtime one.',
      'output() events do not cross router boundaries — use a shared service or signal store for sibling communication.',
      'viewChild() returns undefined until the view initialises — always read inside effect() or afterViewInit.',
    ],
  },

  // ── Content Projection ─────────────────────────────────────────────────────
  'content-projection': {
    apis: ['ng-content', 'select=""', 'contentChild()', 'NgTemplateOutlet', 'ngProjectAs'],
    related: [
      { label: 'Input / Output',    route: '/angular/parent-child' },
      { label: 'Angular CDK',       route: '/angular/cdk'          },
      { label: 'Angular Material',  route: '/angular/material'     },
    ],
    tip: 'Projected content belongs to the host change detection — OnPush on the child does not skip it.',
    docs: [
      { label: 'Content Projection Guide', url: 'https://angular.dev/guide/components/content-projection' },
      { label: 'ng-content Reference',     url: 'https://angular.dev/guide/components/content-projection' },
      { label: 'NgTemplateOutlet API',     url: 'https://angular.dev/api/common/NgTemplateOutlet'         },
    ],
    resources: [
      { label: 'contentChild() API',       url: 'https://angular.dev/api/core/contentChild',               badge: 'docs'  },
      { label: 'angular.dev Tutorials',    url: 'https://angular.dev/tutorials',                           badge: 'blog'  },
    ],
    gotchas: [
      'You cannot project content conditionally with @if inside ng-content itself — gate it in the parent.',
      'contentChild() is undefined until ngAfterContentInit — read it in effect() to be safe.',
    ],
  },

  // ── Dependency Injection ───────────────────────────────────────────────────
  di: {
    apis: ['inject()', 'providedIn: root', 'InjectionToken', 'useFactory', 'useValue'],
    related: [
      { label: 'Signal Store',  route: '/angular/store'   },
      { label: 'HTTP Client',   route: '/angular/http'    },
      { label: 'Lifecycle',     route: '/angular/lifecycle'},
    ],
    tip: 'Prefer inject() over constructor injection — works in field initialisers, guards, and standalone functions.',
    docs: [
      { label: 'DI Overview',             url: 'https://angular.dev/guide/di'                               },
      { label: 'DI in Practice',          url: 'https://angular.dev/guide/di/dependency-injection-in-action'},
      { label: 'InjectionToken API',      url: 'https://angular.dev/api/core/InjectionToken'               },
      { label: 'inject() API',            url: 'https://angular.dev/api/core/inject'                       },
    ],
    resources: [
      { label: 'angular.dev Tutorials',   url: 'https://angular.dev/tutorials',                            badge: 'blog'  },
      { label: 'Angular YouTube',         url: 'https://www.youtube.com/@Angular',                         badge: 'video' },
    ],
    gotchas: [
      'NullInjectorError means the service is not provided anywhere — check providedIn, providers array, or the feature module.',
      'Services with providedIn: root are tree-shaken if never injected — they do not increase bundle size if unused.',
    ],
  },

  // ── Signal Store ───────────────────────────────────────────────────────────
  store: {
    apis: ['signal()', 'computed()', 'asReadonly()', 'Injectable', 'providedIn'],
    related: [
      { label: 'Signals & State',  route: '/angular/counter'       },
      { label: 'NgRx Signals',     route: '/angular/ngrx-signals'  },
      { label: 'RxJS Operators',   route: '/angular/rxjs'          },
    ],
    tip: 'Expose state only via asReadonly() — force mutation through store methods to keep state changes predictable.',
    docs: [
      { label: 'Signals Guide',          url: 'https://angular.dev/guide/signals'         },
      { label: 'Injectable API',         url: 'https://angular.dev/api/core/Injectable'   },
      { label: 'DI Overview',            url: 'https://angular.dev/guide/di'              },
    ],
    resources: [
      { label: 'NgRx Official Docs',     url: 'https://ngrx.io/docs',                     badge: 'docs'  },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',             badge: 'blog'  },
    ],
    gotchas: [
      'A root-scoped service stores state for the entire app lifetime — reset state on logout to avoid data leaks between users.',
      'Multiple components reading the same signal re-render independently — each component subscribes to only what it reads.',
    ],
  },

  // ── Routing ────────────────────────────────────────────────────────────────
  routing: {
    apis: ['RouterLink', 'ActivatedRoute', 'CanActivateFn', 'loadComponent()', 'withComponentInputBinding()'],
    related: [
      { label: 'Route Resolvers',  route: '/angular/route-resolvers' },
      { label: 'Preloading',       route: '/angular/preloading'      },
      { label: 'Todo (guarded)',   route: '/angular/todo'            },
    ],
    tip: 'withComponentInputBinding() lets route params and resolved data flow directly into input() signals — no ActivatedRoute injection.',
    docs: [
      { label: 'Routing Overview',          url: 'https://angular.dev/guide/routing'                           },
      { label: 'Route Guards',              url: 'https://angular.dev/guide/routing/route-guards'              },
      { label: 'Lazy Loading',              url: 'https://angular.dev/guide/routing/lazy-loading'              },
      { label: 'Router API',                url: 'https://angular.dev/api/router/Router'                       },
    ],
    resources: [
      { label: 'CanActivateFn API',         url: 'https://angular.dev/api/router/CanActivateFn',               badge: 'docs'  },
      { label: 'angular.dev Tutorials',     url: 'https://angular.dev/tutorials',                              badge: 'blog'  },
    ],
    gotchas: [
      'loadComponent() requires a default export or .then(m => m.MyComponent) — forgetting the property name causes a blank page.',
      'CanActivateFn returning false blocks navigation but leaves the URL unchanged — return a UrlTree to redirect instead.',
    ],
  },

  // ── Forms ──────────────────────────────────────────────────────────────────
  forms: {
    apis: ['FormControl', 'FormGroup', 'Validators', 'form.value', 'markAllAsTouched()'],
    related: [
      { label: 'FormArray',            route: '/angular/form-array'         },
      { label: 'Custom Validators',    route: '/angular/custom-validators'  },
      { label: 'Control Value Accessor', route: '/angular/cva'             },
    ],
    tip: 'Call form.markAllAsTouched() on submit to reveal all validation errors at once.',
    docs: [
      { label: 'Reactive Forms',         url: 'https://angular.dev/guide/forms/reactive-forms'      },
      { label: 'Template-driven Forms',  url: 'https://angular.dev/guide/forms/template-driven-forms'},
      { label: 'Form Validation',        url: 'https://angular.dev/guide/forms/form-validation'     },
      { label: 'FormBuilder API',        url: 'https://angular.dev/api/forms/FormBuilder'           },
    ],
    resources: [
      { label: 'ReactiveFormsModule',    url: 'https://angular.dev/api/forms/ReactiveFormsModule',   badge: 'docs'  },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                      badge: 'blog'  },
    ],
    gotchas: [
      'form.value omits disabled controls — use form.getRawValue() when you need all field values including disabled ones.',
      'Template-driven forms are async — values are not available synchronously in ngOnInit.',
    ],
  },

  // ── FormArray ──────────────────────────────────────────────────────────────
  'form-array': {
    apis: ['FormArray', 'fb.array()', 'push()', 'removeAt()', 'getRawValue()'],
    related: [
      { label: 'Template vs Reactive', route: '/angular/forms'         },
      { label: 'Wizard Form',          route: '/angular/wizard-form'   },
      { label: 'Dynamic Forms',        route: '/angular/dynamic-forms' },
    ],
    tip: 'Always use getRawValue() when submitting if any field might be disabled — form.value silently drops them.',
    docs: [
      { label: 'FormArray Guide',       url: 'https://angular.dev/guide/forms/reactive-forms'       },
      { label: 'FormArray API',         url: 'https://angular.dev/api/forms/FormArray'              },
      { label: 'Form Validation',       url: 'https://angular.dev/guide/forms/form-validation'      },
    ],
    resources: [
      { label: 'FormBuilder API',       url: 'https://angular.dev/api/forms/FormBuilder',            badge: 'docs'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                        badge: 'blog'  },
    ],
    gotchas: [
      'Removing items shifts all subsequent indices — avoid caching the index in event handlers; read from the event directly.',
      'FormArray validation requires a custom validator on the array itself, not on the group controls.',
    ],
  },

  // ── Todo (guarded) ─────────────────────────────────────────────────────────
  todo: {
    apis: ['inject()', 'CanActivateFn', 'CanDeactivateFn', 'Router', 'FormGroup'],
    related: [
      { label: 'Routing',              route: '/angular/routing' },
      { label: 'Template vs Reactive', route: '/angular/forms'   },
      { label: 'Dependency Injection', route: '/angular/di'      },
    ],
    tip: 'Implement CanDeactivateFn to warn users before leaving with unsaved changes.',
    docs: [
      { label: 'Route Guards',          url: 'https://angular.dev/guide/routing/route-guards'   },
      { label: 'CanActivateFn API',     url: 'https://angular.dev/api/router/CanActivateFn'     },
      { label: 'CanDeactivateFn API',   url: 'https://angular.dev/api/router/CanDeactivateFn'   },
    ],
    resources: [
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                   badge: 'blog'  },
      { label: 'Angular YouTube',        url: 'https://www.youtube.com/@Angular',               badge: 'video' },
    ],
    gotchas: [
      'Guards returning false block navigation silently — always redirect to a meaningful route with a UrlTree.',
      'CanDeactivate is not called on browser back/forward — handle popstate separately if you need full coverage.',
    ],
  },

  // ── Zod Validation ─────────────────────────────────────────────────────────
  'zod-forms': {
    apis: ['z.object()', 'z.infer<>', 'safeParse()', 'z.refine()', '.superRefine()'],
    related: [
      { label: 'Custom Validators',  route: '/angular/custom-validators' },
      { label: 'HTTP Client',        route: '/angular/http'              },
      { label: 'Template vs Reactive', route: '/angular/forms'          },
    ],
    tip: 'z.infer<typeof schema> derives the TypeScript type automatically — one source of truth for both compile and runtime.',
    docs: [
      { label: 'Zod Official Docs',    url: 'https://zod.dev'                              },
      { label: 'Zod — Objects',        url: 'https://zod.dev/?id=objects'                  },
      { label: 'Zod — Validation',     url: 'https://zod.dev/?id=refine'                   },
      { label: 'Form Validation Guide',url: 'https://angular.dev/guide/forms/form-validation'},
    ],
    resources: [
      { label: 'TypeScript Handbook',  url: 'https://www.typescriptlang.org/docs',          badge: 'docs'  },
      { label: 'angular.dev Tutorials',url: 'https://angular.dev/tutorials',                badge: 'blog'  },
    ],
    gotchas: [
      'Always use safeParse() for user input — parse() throws and will crash unhandled in an event handler.',
      'Zod errors nest when schemas are nested — call flatten() on ZodError to get a flat error map for forms.',
    ],
  },

  // ── Custom Validators ──────────────────────────────────────────────────────
  'custom-validators': {
    apis: ['ValidatorFn', 'AsyncValidatorFn', 'ValidationErrors', 'AbstractControl', 'updateOn'],
    related: [
      { label: 'Zod Validation',        route: '/angular/zod-forms' },
      { label: 'Control Value Accessor',route: '/angular/cva'        },
      { label: 'Template vs Reactive',  route: '/angular/forms'      },
    ],
    tip: 'Apply cross-field validators to the FormGroup — the validator receives the group and can access all controls.',
    docs: [
      { label: 'Custom Validators Guide', url: 'https://angular.dev/guide/forms/form-validation#custom-validators' },
      { label: 'Async Validators',        url: 'https://angular.dev/guide/forms/form-validation#async-validation'  },
      { label: 'AbstractControl API',     url: 'https://angular.dev/api/forms/AbstractControl'                     },
      { label: 'ValidatorFn API',         url: 'https://angular.dev/api/forms/ValidatorFn'                         },
    ],
    resources: [
      { label: 'angular.dev Tutorials',   url: 'https://angular.dev/tutorials',                                    badge: 'blog'  },
    ],
    gotchas: [
      'Return null (not undefined) for valid — Angular checks for null specifically.',
      'Async validators show PENDING status while running — always show a spinner to avoid confusing users.',
    ],
  },

  // ── Control Value Accessor ─────────────────────────────────────────────────
  cva: {
    apis: ['ControlValueAccessor', 'NG_VALUE_ACCESSOR', 'writeValue()', 'registerOnChange()', 'registerOnTouched()'],
    related: [
      { label: 'Custom Validators',  route: '/angular/custom-validators' },
      { label: 'Angular Material',   route: '/angular/material'          },
      { label: 'Template vs Reactive', route: '/angular/forms'          },
    ],
    tip: 'Never call onChange() inside writeValue() — Angular sets the value programmatically there and looping it back causes an infinite cycle.',
    docs: [
      { label: 'CVA Guide',              url: 'https://angular.dev/guide/forms/control-status-styling'                },
      { label: 'ControlValueAccessor',   url: 'https://angular.dev/api/forms/ControlValueAccessor'                   },
      { label: 'NG_VALUE_ACCESSOR',      url: 'https://angular.dev/api/forms/NG_VALUE_ACCESSOR'                      },
    ],
    resources: [
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                                       badge: 'blog'  },
      { label: 'Angular Blog',           url: 'https://blog.angular.dev',                                            badge: 'blog'  },
    ],
    gotchas: [
      'forwardRef() is needed in NG_VALUE_ACCESSOR because the class is referenced before it is fully defined.',
      'setDisabledState() is optional in the interface but Angular WILL call it — implement it to avoid errors.',
    ],
  },

  // ── HTTP Client ────────────────────────────────────────────────────────────
  http: {
    apis: ['HttpClient', 'provideHttpClient()', 'withInterceptors()', 'catchError()', 'toSignal()'],
    related: [
      { label: 'RxJS Operators',   route: '/angular/rxjs'          },
      { label: 'resource() API',   route: '/angular/resource-api'  },
      { label: 'TanStack Query',   route: '/angular/tanstack-query' },
    ],
    tip: 'httpResource() is the modern alternative — signals, auto-cancellation, and no manual subscription.',
    docs: [
      { label: 'HTTP Client Guide',    url: 'https://angular.dev/guide/http'                      },
      { label: 'HTTP Interceptors',    url: 'https://angular.dev/guide/http/interceptors'         },
      { label: 'provideHttpClient()',  url: 'https://angular.dev/api/common/http/provideHttpClient'},
      { label: 'HttpClient API',       url: 'https://angular.dev/api/common/http/HttpClient'      },
    ],
    resources: [
      { label: 'httpResource() API',   url: 'https://angular.dev/api/common/http/httpResource',   badge: 'docs'  },
      { label: 'angular.dev Tutorials',url: 'https://angular.dev/tutorials',                      badge: 'blog'  },
    ],
    gotchas: [
      'HttpClient returns cold Observables — nothing happens until you subscribe (or use async pipe / toSignal).',
      'Interceptors added with withInterceptors([fn]) run in order — auth interceptor should be first to attach the token.',
    ],
  },

  // ── RxJS Operators ─────────────────────────────────────────────────────────
  rxjs: {
    apis: ['switchMap', 'combineLatest', 'BehaviorSubject', 'toSignal()', 'debounceTime'],
    related: [
      { label: 'HTTP Client',    route: '/angular/http'         },
      { label: 'DestroyRef',     route: '/angular/destroy-ref'  },
      { label: 'Signal Store',   route: '/angular/store'        },
    ],
    tip: 'switchMap cancels the previous inner Observable — perfect for search where only the latest query matters.',
    docs: [
      { label: 'RxJS Official Docs',     url: 'https://rxjs.dev'                              },
      { label: 'RxJS Operators A–Z',     url: 'https://rxjs.dev/api'                          },
      { label: 'toSignal() API',         url: 'https://angular.dev/api/core/rxjs-interop/toSignal' },
      { label: 'RxJS Interop Guide',     url: 'https://angular.dev/guide/rxjs-interop'        },
    ],
    resources: [
      { label: 'learnrxjs.io',           url: 'https://www.learnrxjs.io',                     badge: 'docs'  },
      { label: 'RxJS Marbles (Visual)',  url: 'https://rxmarbles.com',                         badge: 'tool'  },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                badge: 'blog'  },
    ],
    gotchas: [
      'mergeMap starts all inner Observables concurrently — use concatMap if order matters and switchMap if only the latest matters.',
      'BehaviorSubject requires an initial value — use ReplaySubject(1) if you cannot provide one at construction time.',
    ],
  },

  // ── @defer Blocks ──────────────────────────────────────────────────────────
  defer: {
    apis: ['@defer', '@placeholder', '@loading', '@error', 'on viewport', 'when'],
    related: [
      { label: 'Change Detection',  route: '/angular/change-detection' },
      { label: 'Preloading',        route: '/angular/preloading'       },
      { label: 'NgOptimizedImage',  route: '/angular/ng-image'         },
    ],
    tip: '@defer only works with standalone components — migrate NgModule-based components before deferring.',
    docs: [
      { label: '@defer Overview',       url: 'https://angular.dev/guide/defer'                  },
      { label: 'Deferred Loading API',  url: 'https://angular.dev/guide/defer'                  },
    ],
    resources: [
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                   badge: 'blog'  },
      { label: 'Angular Blog',          url: 'https://blog.angular.dev',                        badge: 'blog'  },
      { label: 'Angular YouTube',       url: 'https://www.youtube.com/@Angular',               badge: 'video' },
    ],
    gotchas: [
      '@defer does not work with NgModule-based components — the component must be standalone.',
      'The @placeholder block stays visible until the chunk loads — keep it lightweight to avoid layout shift.',
    ],
  },

  // ── Change Detection ───────────────────────────────────────────────────────
  'change-detection': {
    apis: ['OnPush', 'ChangeDetectorRef', 'markForCheck()', 'detach()', 'signal()'],
    related: [
      { label: 'Zoneless Angular',  route: '/angular/zoneless' },
      { label: '@defer Blocks',     route: '/angular/defer'    },
      { label: 'Signals & State',   route: '/angular/counter'  },
    ],
    tip: 'Signals + OnPush is the sweet spot — signals notify only the components that read them; OnPush skips everything else.',
    docs: [
      { label: 'Change Detection Guide',  url: 'https://angular.dev/guide/change-detection'                    },
      { label: 'Zoneless Guide',          url: 'https://angular.dev/guide/experimental/zoneless'               },
      { label: 'ChangeDetectorRef API',   url: 'https://angular.dev/api/core/ChangeDetectorRef'                },
    ],
    resources: [
      { label: 'angular.dev Tutorials',   url: 'https://angular.dev/tutorials',                                badge: 'blog'  },
      { label: 'Angular Blog',            url: 'https://blog.angular.dev',                                     badge: 'blog'  },
    ],
    gotchas: [
      'Mutating an array/object does not trigger OnPush — always replace the reference: items = [...items, newItem].',
      'markForCheck() schedules a check for the next cycle — changes are not applied synchronously.',
    ],
  },

  // ── Angular Material ───────────────────────────────────────────────────────
  material: {
    apis: ['MatDialog', 'MatSnackBar', 'MAT_DIALOG_DATA', 'MatTableDataSource', 'provideAnimationsAsync()'],
    related: [
      { label: 'Angular CDK',   route: '/angular/cdk'        },
      { label: 'Animations',    route: '/angular/animations' },
      { label: 'Template vs Reactive', route: '/angular/forms' },
    ],
    tip: 'Use NoopAnimationsModule in unit tests to prevent async animation timing from breaking assertions.',
    docs: [
      { label: 'Angular Material Docs',   url: 'https://material.angular.io'                                },
      { label: 'Material Components',     url: 'https://material.angular.io/components/categories'          },
      { label: 'Theming Guide',           url: 'https://material.angular.io/guide/theming'                  },
      { label: 'provideAnimationsAsync',  url: 'https://angular.dev/api/platform-browser/animations/provideAnimationsAsync' },
    ],
    resources: [
      { label: 'Material Icons',          url: 'https://fonts.google.com/icons',                            badge: 'tool'  },
      { label: 'angular.dev Tutorials',   url: 'https://angular.dev/tutorials',                             badge: 'blog'  },
    ],
    gotchas: [
      'Material components require provideAnimationsAsync() in app.config.ts — forgetting it causes them to render incorrectly.',
      'MatDialog.open() returns a MatDialogRef — always subscribe to afterClosed() to receive the result.',
    ],
  },

  // ── Angular CDK ────────────────────────────────────────────────────────────
  cdk: {
    apis: ['DragDropModule', 'CdkVirtualScrollViewport', 'BreakpointObserver', 'Clipboard', 'Overlay'],
    related: [
      { label: 'Angular Material',  route: '/angular/material'   },
      { label: 'Animations',        route: '/angular/animations' },
      { label: 'Web Workers',       route: '/angular/web-workers'},
    ],
    tip: 'CdkVirtualScrollViewport renders only visible rows — use it for lists with 500+ items to avoid DOM bloat.',
    docs: [
      { label: 'Angular CDK Docs',       url: 'https://material.angular.io/cdk/categories'                },
      { label: 'Drag & Drop',            url: 'https://material.angular.io/cdk/drag-drop/overview'        },
      { label: 'Virtual Scrolling',      url: 'https://material.angular.io/cdk/scrolling/overview'        },
      { label: 'BreakpointObserver',     url: 'https://material.angular.io/cdk/layout/overview'           },
    ],
    resources: [
      { label: 'Clipboard API (CDK)',    url: 'https://material.angular.io/cdk/clipboard/overview',        badge: 'docs'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                             badge: 'blog'  },
    ],
    gotchas: [
      'moveItemInArray mutates the original array — if the component is OnPush, manually call markForCheck() or spread the array after.',
      'CdkVirtualScrollViewport requires a fixed itemSize — dynamic row heights need a custom size function.',
    ],
  },

  // ── Animations ─────────────────────────────────────────────────────────────
  animations: {
    apis: ['trigger()', 'state()', 'transition()', 'animate()', 'stagger()', ':enter / :leave'],
    related: [
      { label: 'Angular Material',  route: '/angular/material'  },
      { label: 'Angular CDK',       route: '/angular/cdk'       },
      { label: '@defer Blocks',     route: '/angular/defer'     },
    ],
    tip: 'Bind triggers to signals: [@anim]="isOpen() ? \'open\' : \'closed\'" — reactive animations with no extra code.',
    docs: [
      { label: 'Animations Overview',    url: 'https://angular.dev/guide/animations'                       },
      { label: 'Transition & Triggers',  url: 'https://angular.dev/guide/animations/transition-and-triggers'},
      { label: 'Reusable Animations',    url: 'https://angular.dev/guide/animations/reusable-animations'   },
    ],
    resources: [
      { label: 'Web Animations API',     url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API', badge: 'docs' },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                             badge: 'blog'  },
    ],
    gotchas: [
      ':leave holds the element in the DOM during the animation — account for this if other components detect its absence.',
      'Animations require provideAnimations() or provideAnimationsAsync() — they silently no-op without it.',
    ],
  },

  // ── Charts ─────────────────────────────────────────────────────────────────
  charts: {
    apis: ['afterNextRender()', 'viewChild()', 'ElementRef', 'chart.update()', 'chart.destroy()'],
    related: [
      { label: 'Web Workers',       route: '/angular/web-workers' },
      { label: 'NgOptimizedImage',  route: '/angular/ng-image'   },
      { label: 'Angular Material',  route: '/angular/material'   },
    ],
    tip: 'Always call chart.destroy() via DestroyRef.onDestroy() — browsers warn about too many active Chart.js contexts.',
    docs: [
      { label: 'Chart.js Official Docs',  url: 'https://www.chartjs.org/docs/latest'                      },
      { label: 'Chart.js — Chart Types',  url: 'https://www.chartjs.org/docs/latest/charts'               },
      { label: 'afterNextRender() API',   url: 'https://angular.dev/api/core/afterNextRender'              },
    ],
    resources: [
      { label: 'ng2-charts Library',      url: 'https://valor-software.com/ng2-charts',                    badge: 'tool'  },
      { label: 'D3.js Docs',              url: 'https://d3js.org',                                         badge: 'docs'  },
      { label: 'angular.dev Tutorials',   url: 'https://angular.dev/tutorials',                            badge: 'blog'  },
    ],
    gotchas: [
      'Initialise Chart.js only inside afterNextRender() — the canvas element does not exist in SSR or before first paint.',
      'chart.update() is incremental — call it after data changes; never destroy + recreate as it causes a visible flash.',
    ],
  },

  // ── AG Grid ────────────────────────────────────────────────────────────────
  'ag-grid': {
    apis: ['AgGridAngular', 'ColDef', 'GridReadyEvent', 'GridApi', 'themeQuartz'],
    related: [
      { label: 'TanStack Query',    route: '/angular/tanstack-query' },
      { label: 'HTTP Client',       route: '/angular/http'           },
      { label: 'Angular Material',  route: '/angular/material'       },
    ],
    tip: 'Always replace the rowData array reference to trigger a re-render — pushing to the same array does nothing.',
    docs: [
      { label: 'AG Grid Angular Docs',  url: 'https://www.ag-grid.com/angular-data-grid'              },
      { label: 'AG Grid Theming',       url: 'https://www.ag-grid.com/angular-data-grid/theming'      },
      { label: 'Column Definitions',    url: 'https://www.ag-grid.com/angular-data-grid/column-defs'  },
    ],
    resources: [
      { label: 'AG Grid Examples',      url: 'https://www.ag-grid.com/example',                       badge: 'tool'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                         badge: 'blog'  },
    ],
    gotchas: [
      'Store the GridApi from the GridReady event — calling grid methods before GridReady fires will throw.',
      'themeQuartz is the new CSS-in-JS theme (AG Grid 31+) — the old CSS class themes still work but are deprecated.',
    ],
  },

  // ── TanStack Query ─────────────────────────────────────────────────────────
  'tanstack-query': {
    apis: ['injectQuery()', 'queryKey', 'injectMutation()', 'invalidateQueries()', 'enabled'],
    related: [
      { label: 'HTTP Client',      route: '/angular/http'         },
      { label: 'RxJS Operators',   route: '/angular/rxjs'         },
      { label: 'resource() API',   route: '/angular/resource-api' },
    ],
    tip: 'Set enabled: !!id() to pause a query until a value is ready — no empty fetch, no conditional workaround.',
    docs: [
      { label: 'TanStack Query Angular', url: 'https://tanstack.com/query/latest/docs/angular/overview'   },
      { label: 'Query Keys',             url: 'https://tanstack.com/query/latest/docs/angular/guides/query-keys' },
      { label: 'Mutations',              url: 'https://tanstack.com/query/latest/docs/angular/guides/mutations'  },
    ],
    resources: [
      { label: 'TanStack Query Devtools',url: 'https://tanstack.com/query/latest/docs/angular/devtools',   badge: 'tool'  },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                             badge: 'blog'  },
    ],
    gotchas: [
      'queryKey changes trigger a new fetch — include every variable the queryFn uses inside the key array.',
      'invalidateQueries marks data stale but does not immediately refetch — refetch happens when a consumer mounts.',
    ],
  },

  // ── date-fns ───────────────────────────────────────────────────────────────
  'date-fns': {
    apis: ['format()', 'parseISO()', 'formatDistance()', 'addDays()', 'isValid()'],
    related: [
      { label: 'Pipes',  route: '/angular/pipes' },
      { label: 'i18n',   route: '/angular/i18n'  },
      { label: 'Template Syntax', route: '/angular/templates' },
    ],
    tip: 'Always check isValid(parsed) after parse() — it returns Invalid Date silently for bad strings.',
    docs: [
      { label: 'date-fns Official Docs',  url: 'https://date-fns.org'                                      },
      { label: 'date-fns API Reference',  url: 'https://date-fns.org/docs/Getting-Started'                 },
      { label: 'date-fns-tz (timezones)', url: 'https://www.npmjs.com/package/date-fns-tz'                 },
    ],
    resources: [
      { label: 'MDN — Date Reference',   url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date', badge: 'docs' },
      { label: 'Intl API (MDN)',          url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl', badge: 'docs' },
    ],
    gotchas: [
      'new Date("2024-01-01") is UTC midnight but new Date("01/01/2024") is local time — always use parseISO() for ISO strings.',
      'date-fns functions are immutable — they never modify the Date you pass in, always returning a new instance.',
    ],
  },

  // ── Tailwind CSS ───────────────────────────────────────────────────────────
  tailwind: {
    apis: ['@apply', 'dark:', 'sm: md: lg:', 'arbitrary values []', 'clamp()'],
    related: [
      { label: 'Angular Material',  route: '/angular/material'   },
      { label: 'Angular CDK',       route: '/angular/cdk'        },
      { label: 'Animations',        route: '/angular/animations' },
    ],
    tip: 'Never build class names dynamically ("text-" + color) — Tailwind cannot detect incomplete strings at build time.',
    docs: [
      { label: 'Tailwind CSS Docs',      url: 'https://tailwindcss.com/docs'                             },
      { label: 'Tailwind with Angular',  url: 'https://tailwindcss.com/docs/installation/framework-guides/angular' },
      { label: 'Responsive Design',      url: 'https://tailwindcss.com/docs/responsive-design'           },
      { label: 'Dark Mode',              url: 'https://tailwindcss.com/docs/dark-mode'                   },
    ],
    resources: [
      { label: 'Tailwind UI (Components)',url: 'https://tailwindui.com',                                  badge: 'tool'  },
      { label: 'Headless UI',             url: 'https://headlessui.com',                                  badge: 'tool'  },
    ],
    gotchas: [
      'Tailwind scans files as plain text — class names must appear as complete strings, not built with concatenation.',
      'The dark: variant requires the .dark class on <html> by default — configure darkMode: "media" for OS-level preference.',
    ],
  },

  // ── Testing ────────────────────────────────────────────────────────────────
  testing: {
    apis: ['TestBed', 'ComponentFixture', 'HttpTestingController', 'getByRole()', 'signal()'],
    related: [
      { label: 'E2E (Playwright)',  route: '/angular/e2e'       },
      { label: 'Harnesses',        route: '/angular/harnesses' },
      { label: 'HTTP Client',      route: '/angular/http'      },
    ],
    tip: 'Query by accessible role (getByRole) — these queries survive DOM refactors and double as accessibility checks.',
    docs: [
      { label: 'Angular Testing Guide',     url: 'https://angular.dev/guide/testing'                             },
      { label: 'Component Testing',         url: 'https://angular.dev/guide/testing/components-basics'           },
      { label: 'Http Testing',              url: 'https://angular.dev/guide/http/testing'                        },
    ],
    resources: [
      { label: '@testing-library/angular',  url: 'https://testing-library.com/docs/angular-testing-library/intro', badge: 'docs' },
      { label: 'Jest Docs',                 url: 'https://jestjs.io/docs/getting-started',                        badge: 'docs' },
      { label: 'angular.dev Tutorials',     url: 'https://angular.dev/tutorials',                                 badge: 'blog' },
    ],
    gotchas: [
      'fixture.detectChanges() must be called after component creation and after every state change in tests.',
      'Async operations in tests need fakeAsync + tick() or async + waitForAsync to avoid flaky assertions.',
    ],
  },

  // ── Route Resolvers ────────────────────────────────────────────────────────
  'route-resolvers': {
    apis: ['ResolveFn<T>', 'ActivatedRoute.data', 'withComponentInputBinding()', 'router-outlet name'],
    related: [
      { label: 'Routing',     route: '/angular/routing'    },
      { label: 'HTTP Client', route: '/angular/http'       },
      { label: 'Preloading',  route: '/angular/preloading' },
    ],
    tip: 'All resolvers on a route run in parallel — combine results in one resolver if you need cross-dependencies.',
    docs: [
      { label: 'Route Resolvers Guide',  url: 'https://angular.dev/guide/routing/resolve'                       },
      { label: 'Named Outlets',          url: 'https://angular.dev/guide/routing/router-outlet'                  },
      { label: 'ResolveFn API',          url: 'https://angular.dev/api/router/ResolveFn'                         },
    ],
    resources: [
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                                   badge: 'blog'  },
      { label: 'Angular YouTube',        url: 'https://www.youtube.com/@Angular',                               badge: 'video' },
    ],
    gotchas: [
      'Angular only takes the first emission from a resolver Observable — if it never completes, navigation is blocked forever.',
      'Resolver errors block navigation — catch errors inside the resolver and return a fallback value or redirect.',
    ],
  },

  // ── Preloading ─────────────────────────────────────────────────────────────
  preloading: {
    apis: ['PreloadAllModules', 'PreloadingStrategy', 'QuicklinkStrategy', 'loadComponent()'],
    related: [
      { label: 'Routing',       route: '/angular/routing'  },
      { label: '@defer Blocks', route: '/angular/defer'    },
      { label: 'SSR + Hydration', route: '/angular/ssr'   },
    ],
    tip: 'QuicklinkStrategy (ngx-quicklink) only preloads routes whose links are visible in the viewport — best balance.',
    docs: [
      { label: 'Preloading Guide',      url: 'https://angular.dev/guide/routing/lazy-loading'                   },
      { label: 'Lazy Loading Routes',   url: 'https://angular.dev/guide/routing/lazy-loading'                   },
    ],
    resources: [
      { label: 'ngx-quicklink (npm)',   url: 'https://www.npmjs.com/package/ngx-quicklink',                     badge: 'tool'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                                   badge: 'blog'  },
    ],
    gotchas: [
      'PreloadAllModules downloads all lazy chunks in the background — can waste mobile data for routes users never visit.',
      'Preloading only affects the initial page load; subsequent navigations still use already-downloaded cached chunks.',
    ],
  },

  // ── resource() API ─────────────────────────────────────────────────────────
  'resource-api': {
    apis: ['resource()', 'httpResource()', 'params()', 'loader()', 'abortSignal'],
    related: [
      { label: 'HTTP Client',    route: '/angular/http'          },
      { label: 'RxJS Operators', route: '/angular/rxjs'          },
      { label: 'TanStack Query', route: '/angular/tanstack-query' },
    ],
    tip: 'resource() has no cache layer — for shared caching across components, combine with TanStack Query or a signal store.',
    docs: [
      { label: 'resource() Guide',       url: 'https://angular.dev/guide/signals/resource'        },
      { label: 'resource() API',         url: 'https://angular.dev/api/core/resource'             },
      { label: 'httpResource() API',     url: 'https://angular.dev/api/common/http/httpResource'  },
    ],
    resources: [
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                    badge: 'blog'  },
      { label: 'Angular Blog',           url: 'https://blog.angular.dev',                         badge: 'blog'  },
    ],
    gotchas: [
      'params() must be synchronous — never call async operations inside it; put async work in loader().',
      'Changing params always cancels the in-flight request — pass the abortSignal to fetch() to clean up network requests.',
    ],
  },

  // ── NgRx Signals ───────────────────────────────────────────────────────────
  'ngrx-signals': {
    apis: ['signalStore()', 'withState()', 'withComputed()', 'withMethods()', 'patchState()', 'withEntities()'],
    related: [
      { label: 'Signal Store',    route: '/angular/store'        },
      { label: 'RxJS Operators',  route: '/angular/rxjs'         },
      { label: 'DestroyRef',      route: '/angular/destroy-ref'  },
    ],
    tip: 'Use rxMethod() for HTTP inside NgRx signal stores — it handles Observable lifecycle and integrates automatically.',
    docs: [
      { label: 'NgRx Signals Docs',     url: 'https://ngrx.io/guide/signals'                           },
      { label: 'signalStore() API',     url: 'https://ngrx.io/guide/signals/signal-store'              },
      { label: 'withEntities()',        url: 'https://ngrx.io/guide/signals/signal-store-entities'     },
      { label: 'NgRx DevTools',         url: 'https://ngrx.io/guide/store-devtools'                    },
    ],
    resources: [
      { label: 'NgRx Official Docs',    url: 'https://ngrx.io/docs',                                  badge: 'docs'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                         badge: 'blog'  },
    ],
    gotchas: [
      'patchState() does a shallow merge — nested objects must be spread manually: patchState(store, { nested: { ...store.nested(), key: val } }).',
      'withEntities() uses the entity id field — specify { idKey: "uuid" } if your entity does not have an "id" property.',
    ],
  },

  // ── DestroyRef ─────────────────────────────────────────────────────────────
  'destroy-ref': {
    apis: ['DestroyRef', 'takeUntilDestroyed()', 'onDestroy()', 'inject(DestroyRef)'],
    related: [
      { label: 'Lifecycle Hooks',   route: '/angular/lifecycle' },
      { label: 'RxJS Operators',    route: '/angular/rxjs'      },
      { label: 'Signals & State',   route: '/angular/counter'   },
    ],
    tip: 'DestroyRef.onDestroy() returns a cancel function — call it if you need to remove the cleanup callback early.',
    docs: [
      { label: 'DestroyRef API',              url: 'https://angular.dev/api/core/DestroyRef'                              },
      { label: 'takeUntilDestroyed() API',    url: 'https://angular.dev/api/core/rxjs-interop/takeUntilDestroyed'         },
      { label: 'Component Lifecycle',         url: 'https://angular.dev/guide/components/lifecycle'                       },
    ],
    resources: [
      { label: 'angular.dev Tutorials',       url: 'https://angular.dev/tutorials',                                       badge: 'blog'  },
      { label: 'Angular Blog',                url: 'https://blog.angular.dev',                                            badge: 'blog'  },
    ],
    gotchas: [
      'takeUntilDestroyed() called outside injection context needs the destroyRef argument — store inject(DestroyRef) in a field first.',
      'DestroyRef fires even if the component errors during init — make your cleanup callbacks error-safe.',
    ],
  },

  // ── linkedSignal() ─────────────────────────────────────────────────────────
  'linked-signal': {
    apis: ['linkedSignal()', 'WritableSignal', 'source', 'computation', 'previous?.value'],
    related: [
      { label: 'Signals & State',  route: '/angular/counter'       },
      { label: 'resource() API',   route: '/angular/resource-api'  },
      { label: 'Dynamic Forms',    route: '/angular/dynamic-forms' },
    ],
    tip: 'linkedSignal resets only when the source changes — manual .set() calls persist until the next source emission.',
    docs: [
      { label: 'linkedSignal() Guide',   url: 'https://angular.dev/guide/signals#linked-signals'  },
      { label: 'linkedSignal() API',     url: 'https://angular.dev/api/core/linkedSignal'         },
      { label: 'Signals Overview',       url: 'https://angular.dev/guide/signals'                 },
    ],
    resources: [
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                    badge: 'blog'  },
      { label: 'Angular Blog',           url: 'https://blog.angular.dev',                         badge: 'blog'  },
    ],
    gotchas: [
      'linkedSignal is available from Angular 19+ — verify your version before using it in older projects.',
      'The short form linkedSignal(() => src()) is equivalent to computed() but writable — use computed() if you never need to override.',
    ],
  },

  // ── Zoneless Angular ───────────────────────────────────────────────────────
  zoneless: {
    apis: ['provideExperimentalZonelessChangeDetection()', 'signal()', 'NgZone', 'markForCheck()'],
    related: [
      { label: 'Change Detection',  route: '/angular/change-detection' },
      { label: 'Signals & State',   route: '/angular/counter'          },
      { label: 'SSR + Hydration',   route: '/angular/ssr'              },
    ],
    tip: 'Remove zone.js from polyfills in angular.json after enabling zoneless — do not leave both active.',
    docs: [
      { label: 'Zoneless Guide',         url: 'https://angular.dev/guide/experimental/zoneless'                  },
      { label: 'Change Detection Guide', url: 'https://angular.dev/guide/change-detection'                       },
    ],
    resources: [
      { label: 'Angular Blog',           url: 'https://blog.angular.dev',                                        badge: 'blog'  },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                                   badge: 'blog'  },
    ],
    gotchas: [
      'Third-party libraries that rely on Zone.js patching will not trigger change detection in zoneless mode — wrap their callbacks with NgZone.run().',
      'setTimeout / setInterval mutations need signal() to notify Angular — plain variable updates are invisible to the scheduler.',
    ],
  },

  // ── Dynamic Forms ──────────────────────────────────────────────────────────
  'dynamic-forms': {
    apis: ['FormBuilder', 'FieldConfig', 'Validators.compose()', '@switch', 'form.get(key)'],
    related: [
      { label: 'Template vs Reactive', route: '/angular/forms'         },
      { label: 'FormArray',            route: '/angular/form-array'    },
      { label: 'Wizard Form',          route: '/angular/wizard-form'   },
    ],
    tip: 'For production schema-driven forms, evaluate @ngx-formly/core — conditional fields, wrappers, and nested groups out of the box.',
    docs: [
      { label: 'Reactive Forms Guide',  url: 'https://angular.dev/guide/forms/reactive-forms'     },
      { label: 'FormBuilder API',       url: 'https://angular.dev/api/forms/FormBuilder'          },
      { label: 'Form Validation',       url: 'https://angular.dev/guide/forms/form-validation'    },
    ],
    resources: [
      { label: 'ngx-formly Library',    url: 'https://formly.dev',                                badge: 'tool'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                     badge: 'blog'  },
    ],
    gotchas: [
      'Generate the FormGroup from the schema before rendering — trying to bind to a non-existent control throws an error.',
      'form.get(key)?.errors is null when valid — always check hasError() instead of comparing errors directly.',
    ],
  },

  // ── Wizard Form ────────────────────────────────────────────────────────────
  'wizard-form': {
    apis: ['FormGroup', 'markAllAsTouched()', 'patchValue()', 'step signal', 'fb.group()'],
    related: [
      { label: 'Template vs Reactive', route: '/angular/forms'         },
      { label: 'Dynamic Forms',        route: '/angular/dynamic-forms' },
      { label: 'Routing',              route: '/angular/routing'       },
    ],
    tip: 'Only validate on Next / Submit — back navigation should always succeed so users can freely correct earlier steps.',
    docs: [
      { label: 'Reactive Forms Guide',  url: 'https://angular.dev/guide/forms/reactive-forms'   },
      { label: 'Form Validation',       url: 'https://angular.dev/guide/forms/form-validation'  },
      { label: 'FormGroup API',         url: 'https://angular.dev/api/forms/FormGroup'          },
    ],
    resources: [
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                   badge: 'blog'  },
      { label: 'Angular Blog',          url: 'https://blog.angular.dev',                        badge: 'blog'  },
    ],
    gotchas: [
      'Each step FormGroup is independent — the final payload is the spread of all step values, not one root form.',
      'Saving wizard progress to localStorage on valueChanges requires debounceTime(300) to avoid flooding storage writes.',
    ],
  },

  // ── E2E (Playwright) ───────────────────────────────────────────────────────
  e2e: {
    apis: ['getByRole()', 'page.route()', 'expect(locator)', 'page.fill()', 'trace: on'],
    related: [
      { label: 'Testing',     route: '/angular/testing'   },
      { label: 'Harnesses',   route: '/angular/harnesses' },
      { label: 'HTTP Client', route: '/angular/http'      },
    ],
    tip: 'Run Playwright in --ui mode during development — step through tests frame-by-frame with full DOM inspection.',
    docs: [
      { label: 'Playwright Docs',         url: 'https://playwright.dev/docs/intro'                          },
      { label: 'Playwright Locators',     url: 'https://playwright.dev/docs/locators'                       },
      { label: 'Network Interception',    url: 'https://playwright.dev/docs/network'                        },
      { label: 'Trace Viewer',            url: 'https://playwright.dev/docs/trace-viewer-intro'             },
    ],
    resources: [
      { label: 'Angular Testing Guide',   url: 'https://angular.dev/guide/testing',                         badge: 'docs'  },
      { label: 'testing-library/angular', url: 'https://testing-library.com/docs/angular-testing-library/intro', badge: 'docs' },
    ],
    gotchas: [
      'Playwright auto-waits — never add manual sleeps; if you find yourself adding them, the selector is likely wrong.',
      'page.route() interceptions persist across tests — call page.unroute() or use it inside a beforeEach/afterEach.',
    ],
  },

  // ── Component Harnesses ────────────────────────────────────────────────────
  harnesses: {
    apis: ['ComponentHarness', 'TestbedHarnessEnvironment', 'locatorFor()', 'MatButtonHarness', '.with()'],
    related: [
      { label: 'Testing',           route: '/angular/testing'  },
      { label: 'Angular Material',  route: '/angular/material' },
      { label: 'Angular CDK',       route: '/angular/cdk'      },
    ],
    tip: 'Write harnesses for shared/library components — application-specific components rarely need them.',
    docs: [
      { label: 'Component Harnesses Guide',  url: 'https://material.angular.io/cdk/test-harnesses/overview'         },
      { label: 'ComponentHarness API',       url: 'https://material.angular.io/cdk/test-harnesses/api'              },
      { label: 'Angular Testing Guide',      url: 'https://angular.dev/guide/testing'                               },
    ],
    resources: [
      { label: 'testing-library/angular',    url: 'https://testing-library.com/docs/angular-testing-library/intro',  badge: 'docs'  },
      { label: 'angular.dev Tutorials',      url: 'https://angular.dev/tutorials',                                   badge: 'blog'  },
    ],
    gotchas: [
      'Harness queries are async — always await locator() calls even if they look synchronous.',
      'Playwright harness environment requires @angular/cdk/testing/playwright — a separate install from the test harness package.',
    ],
  },

  // ── NgOptimizedImage ───────────────────────────────────────────────────────
  'ng-image': {
    apis: ['NgOptimizedImage', 'ngSrc', 'priority', 'fill', 'ngSrcset', 'loaderParams'],
    related: [
      { label: 'PWA / Service Worker', route: '/angular/pwa' },
      { label: 'SSR + Hydration',      route: '/angular/ssr' },
      { label: '@defer Blocks',        route: '/angular/defer'},
    ],
    tip: 'Only add priority to the LCP image — adding it to everything defeats the purpose and wastes fetch priority budget.',
    docs: [
      { label: 'Image Optimization Guide', url: 'https://angular.dev/guide/image-optimization'          },
      { label: 'NgOptimizedImage API',     url: 'https://angular.dev/api/common/NgOptimizedImage'       },
      { label: 'LCP Explained (web.dev)',  url: 'https://web.dev/articles/lcp'                          },
    ],
    resources: [
      { label: 'web.dev Image Guide',      url: 'https://web.dev/learn/images',                         badge: 'blog'  },
      { label: 'PageSpeed Insights',        url: 'https://pagespeed.web.dev',                            badge: 'tool'  },
    ],
    gotchas: [
      'NgOptimizedImage requires explicit width and height attributes — missing them causes a runtime error.',
      'fill mode needs position: relative on the containing element with a defined height — without it the image collapses.',
    ],
  },

  // ── Web Workers ────────────────────────────────────────────────────────────
  'web-workers': {
    apis: ['Worker', 'postMessage()', 'onmessage', 'Transferable', 'Comlink'],
    related: [
      { label: 'PWA / Service Worker',  route: '/angular/pwa'              },
      { label: 'NgOptimizedImage',      route: '/angular/ng-image'         },
      { label: 'Change Detection',      route: '/angular/change-detection' },
    ],
    tip: 'Always call worker.terminate() after getting the result — leaving workers running wastes CPU even after the component is destroyed.',
    docs: [
      { label: 'Web Workers Guide (Angular)', url: 'https://angular.dev/guide/web-worker'                           },
      { label: 'MDN — Web Workers',           url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API'},
      { label: 'Transferable Objects (MDN)',   url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects' },
    ],
    resources: [
      { label: 'Comlink (npm)',          url: 'https://www.npmjs.com/package/comlink',                              badge: 'tool'  },
      { label: 'angular.dev Tutorials', url: 'https://angular.dev/tutorials',                                      badge: 'blog'  },
    ],
    gotchas: [
      'Workers cannot access the DOM or window — any data they need must be passed via postMessage().',
      'Structured clone (postMessage default) copies data — for large ArrayBuffers use transfer to avoid the copy cost.',
    ],
  },

  // ── PWA / Service Worker ───────────────────────────────────────────────────
  pwa: {
    apis: ['SwUpdate', 'versionUpdates', 'ngsw-config.json', 'provideServiceWorker()', 'navigator.serviceWorker'],
    related: [
      { label: 'SSR + Hydration',  route: '/angular/ssr'         },
      { label: 'Web Workers',      route: '/angular/web-workers' },
      { label: 'NgOptimizedImage', route: '/angular/ng-image'    },
    ],
    tip: 'Service workers only activate on HTTPS — use --ssl flag locally or deploy to Netlify/Vercel for PWA testing.',
    docs: [
      { label: 'Service Worker Guide',     url: 'https://angular.dev/ecosystem/service-workers'            },
      { label: 'SwUpdate API',             url: 'https://angular.dev/api/service-worker/SwUpdate'          },
      { label: 'ngsw-config Reference',    url: 'https://angular.dev/ecosystem/service-workers/config'     },
    ],
    resources: [
      { label: 'web.dev — PWA Guide',      url: 'https://web.dev/progressive-web-apps',                    badge: 'blog'  },
      { label: 'Lighthouse (DevTools)',     url: 'https://developer.chrome.com/docs/lighthouse',             badge: 'tool'  },
    ],
    gotchas: [
      'Cached resources are served even after deployment until the user reloads twice — prompt users to refresh via SwUpdate.versionUpdates.',
      'ngsw-config.json caching rules are merged with the service worker binary on build — always rebuild after changing the config.',
    ],
  },

  // ── i18n ───────────────────────────────────────────────────────────────────
  i18n: {
    apis: ['Transloco', 'LOCALE_ID', 'Intl.NumberFormat', 'Intl.DateTimeFormat', 'ng extract-i18n'],
    related: [
      { label: 'Pipes',            route: '/angular/pipes'     },
      { label: 'Template Syntax',  route: '/angular/templates' },
      { label: 'HTTP Client',      route: '/angular/http'      },
    ],
    tip: 'Use Intl.NumberFormat / Intl.DateTimeFormat for numbers and dates — native APIs, zero bundle cost.',
    docs: [
      { label: 'Angular i18n Guide',   url: 'https://angular.dev/guide/i18n'                                      },
      { label: 'Transloco Docs',       url: 'https://jsverse.github.io/transloco'                                 },
      { label: 'MDN — Intl API',       url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl' },
    ],
    resources: [
      { label: 'angular.dev Tutorials',url: 'https://angular.dev/tutorials',                                      badge: 'blog'  },
      { label: 'i18next (alternative)',  url: 'https://www.i18next.com',                                           badge: 'tool'  },
    ],
    gotchas: [
      'Built-in Angular i18n (--localize) produces one build per locale — runtime language switching requires a library like Transloco.',
      'Extracted message IDs change when the surrounding text changes — always re-extract after template edits.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // C# PAGES
  // ════════════════════════════════════════════════════════════════════════════

  basics: {
    apis: ['int', 'string', 'var', 'const', 'switch', 'for/foreach'],
    related: [
      { label: 'OOP & Classes',    route: '/csharp/oop'       },
      { label: 'Collections',      route: '/csharp/collections'},
      { label: 'Pattern Matching', route: '/csharp/pattern-matching' },
    ],
    tip: 'Prefer var for local variables when the type is obvious from the right-hand side — it reduces noise without losing clarity.',
    docs: [
      { label: 'C# Types & Variables',   url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/built-in-types' },
      { label: 'C# Control Flow',        url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/selection-statements' },
      { label: 'String Interpolation',   url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/tokens/interpolated' },
    ],
    resources: [
      { label: 'C# Language Reference', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/', badge: 'docs' },
      { label: 'C# Tour (MS Docs)',     url: 'https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/',        badge: 'blog' },
    ],
    gotchas: [
      'string is an alias for System.String — they are identical, but lowercase string is preferred by convention.',
      'Integer division truncates: 7/2 = 3, not 3.5 — cast to double first if you need a decimal result.',
    ],
  },

  oop: {
    apis: ['class', 'interface', 'abstract', 'sealed', 'override', 'virtual'],
    related: [
      { label: 'Records & Structs', route: '/csharp/records'   },
      { label: 'Generics',          route: '/csharp/generics'  },
      { label: 'Delegates & Events',route: '/csharp/delegates' },
    ],
    tip: 'Favour composition over inheritance — interfaces + small focused classes are easier to test and extend.',
    docs: [
      { label: 'Classes (MS Docs)',        url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/classes' },
      { label: 'Interfaces',               url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/interfaces' },
      { label: 'Abstract & Virtual',       url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/abstract' },
    ],
    resources: [
      { label: 'C# OOP Fundamentals', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/', badge: 'docs' },
    ],
    gotchas: [
      'Calling a virtual method in a constructor uses the derived override — the object may not be fully initialised yet.',
      'sealed prevents inheritance but does not prevent the class from being used as a field type.',
    ],
  },

  records: {
    apis: ['record', 'record struct', 'with', 'init', 'EqualityContract'],
    related: [
      { label: 'OOP & Classes',    route: '/csharp/oop'         },
      { label: 'Pattern Matching', route: '/csharp/pattern-matching' },
      { label: 'Collections',      route: '/csharp/collections' },
    ],
    tip: 'Use record for DTOs and value objects — you get value equality, ToString, and deconstruction for free.',
    docs: [
      { label: 'Records (MS Docs)',       url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record' },
      { label: 'with expressions',        url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/with-expression' },
      { label: 'init-only setters',       url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/init' },
    ],
    resources: [
      { label: 'C# 9 Records Blog', url: 'https://devblogs.microsoft.com/dotnet/c-9-0-on-the-record/', badge: 'blog' },
    ],
    gotchas: [
      'record class uses reference identity for ==, but value equality for Equals() — they are not the same.',
      'with creates a shallow copy — nested mutable objects are still shared between the original and the copy.',
    ],
  },

  generics: {
    apis: ['where T :', 'IComparable<T>', 'in/out', 'default(T)', 'typeof(T)'],
    related: [
      { label: 'Collections', route: '/csharp/collections' },
      { label: 'LINQ',        route: '/csharp/linq'        },
      { label: 'OOP',         route: '/csharp/oop'         },
    ],
    tip: 'Constrain generics with where T : IInterface rather than reflecting at runtime — you get compile-time safety and better performance.',
    docs: [
      { label: 'Generics (MS Docs)',    url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/generics' },
      { label: 'Type Constraints',      url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/generics/constraints-on-type-parameters' },
      { label: 'Covariance (in/out)',   url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/covariance-contravariance/' },
    ],
    resources: [
      { label: 'Generic Collections',  url: 'https://learn.microsoft.com/en-us/dotnet/standard/generics/collections', badge: 'docs' },
    ],
    gotchas: [
      'You cannot use arithmetic operators on generic T unless you constrain to INumber<T> (.NET 7+).',
      'default(T) returns null for reference types and zero-equivalent for value types — always check before use.',
    ],
  },

  collections: {
    apis: ['List<T>', 'Dictionary<K,V>', 'HashSet<T>', 'IEnumerable<T>', 'Span<T>'],
    related: [
      { label: 'LINQ',     route: '/csharp/linq'     },
      { label: 'Generics', route: '/csharp/generics' },
      { label: 'async/await', route: '/csharp/async' },
    ],
    tip: 'Return IEnumerable<T> from methods — callers can materialise to List/Array when they need indexing or multiple passes.',
    docs: [
      { label: 'Collections (MS Docs)',   url: 'https://learn.microsoft.com/en-us/dotnet/standard/collections/' },
      { label: 'Span<T> Guide',           url: 'https://learn.microsoft.com/en-us/dotnet/standard/memory-and-spans/' },
      { label: 'ImmutableCollections',    url: 'https://learn.microsoft.com/en-us/dotnet/standard/collections/thread-safe/' },
    ],
    resources: [
      { label: 'Collection Guidelines', url: 'https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/guidelines-for-collections', badge: 'docs' },
    ],
    gotchas: [
      'List<T>.Remove() removes only the first matching element — use RemoveAll() to remove all occurrences.',
      'Iterating a Dictionary does not guarantee insertion order — use SortedDictionary or a List of tuples if order matters.',
    ],
  },

  linq: {
    apis: ['Where()', 'Select()', 'GroupBy()', 'OrderBy()', 'FirstOrDefault()', 'ToList()'],
    related: [
      { label: 'Collections', route: '/csharp/collections' },
      { label: 'Generics',    route: '/csharp/generics'   },
      { label: 'async/await', route: '/csharp/async'      },
    ],
    tip: 'LINQ is lazy — chain Where/Select without materialising; only call ToList()/ToArray() once at the end when you need the results.',
    docs: [
      { label: 'LINQ Overview',         url: 'https://learn.microsoft.com/en-us/dotnet/csharp/linq/' },
      { label: 'Standard Operators',    url: 'https://learn.microsoft.com/en-us/dotnet/csharp/linq/standard-query-operators/' },
      { label: 'Query vs Method Syntax',url: 'https://learn.microsoft.com/en-us/dotnet/csharp/linq/get-started/write-linq-queries' },
    ],
    resources: [
      { label: '101 LINQ Samples',        url: 'https://learn.microsoft.com/en-us/samples/dotnet/try-samples/101-linq-samples/', badge: 'tool'  },
      { label: 'LINQ source (dotnet/runtime)', url: 'https://github.com/dotnet/runtime/tree/main/src/libraries/System.Linq/src/System/Linq', badge: 'code' },
      { label: 'LINQ & IEnumerable — .NET channel', url: 'https://www.youtube.com/watch?v=4ro5UCqU0P4', badge: 'video' },
    ],
    gotchas: [
      'First() throws if the sequence is empty — use FirstOrDefault() and check for null unless you are certain an element exists.',
      'Calling Count() on an IEnumerable iterates the whole sequence — use the Count property on a List instead.',
    ],
  },

  async: {
    apis: ['async', 'await', 'Task<T>', 'CancellationToken', 'ConfigureAwait(false)'],
    related: [
      { label: 'Collections',  route: '/csharp/collections' },
      { label: 'Exceptions',   route: '/csharp/exceptions'  },
      { label: 'Null Safety',  route: '/csharp/null-safety' },
    ],
    tip: 'Use ConfigureAwait(false) in library code to avoid deadlocks in synchronisation-context-bound environments like ASP.NET Framework.',
    docs: [
      { label: 'Async / Await Guide',  url: 'https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/' },
      { label: 'Task Parallel Library',url: 'https://learn.microsoft.com/en-us/dotnet/standard/parallel-programming/task-parallel-library-tpl' },
      { label: 'CancellationToken',    url: 'https://learn.microsoft.com/en-us/dotnet/standard/threading/cancellation-in-managed-threads' },
    ],
    resources: [
      { label: 'Async Best Practices', url: 'https://learn.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming', badge: 'blog' },
    ],
    gotchas: [
      'async void is a fire-and-forget trap — exceptions are unobserved. Only use it for event handlers, never for library methods.',
      'await inside a lock throws — use SemaphoreSlim.WaitAsync() as an async-safe mutex instead.',
    ],
  },

  'null-safety': {
    apis: ['?.', '??', '??=', '!', 'ArgumentNullException.ThrowIfNull', '#nullable enable'],
    related: [
      { label: 'Pattern Matching', route: '/csharp/pattern-matching' },
      { label: 'Exceptions',       route: '/csharp/exceptions'       },
      { label: 'OOP & Classes',    route: '/csharp/oop'              },
    ],
    tip: 'Enable nullable reference types project-wide in .csproj — fix the warnings top-to-bottom to build a null-safe codebase incrementally.',
    docs: [
      { label: 'Nullable Reference Types', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references' },
      { label: '?? and ??= Operators',     url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/null-coalescing-operator' },
      { label: 'Null-Conditional ?.',      url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/member-access-operators#null-conditional-operators--and-' },
    ],
    resources: [
      { label: 'Null Safety Migration',   url: 'https://learn.microsoft.com/en-us/dotnet/csharp/nullable-migration-strategies', badge: 'docs' },
    ],
    gotchas: [
      'The null-forgiving operator ! suppresses warnings but does not prevent NullReferenceException at runtime — only use it when you have proven the value is not null.',
      'Nullable value types (int?) and nullable reference types (#nullable enable) are completely different mechanisms.',
    ],
  },

  'pattern-matching': {
    apis: ['is', 'switch', 'when', 'and/or/not', 'property pattern', 'list pattern'],
    related: [
      { label: 'OOP & Classes',  route: '/csharp/oop'         },
      { label: 'Records',        route: '/csharp/records'     },
      { label: 'Null Safety',    route: '/csharp/null-safety' },
    ],
    tip: 'Use exhaustive switch expressions on sealed hierarchies or enums — the compiler warns when a case is missing.',
    docs: [
      { label: 'Pattern Matching',     url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/functional/pattern-matching' },
      { label: 'Switch Expression',    url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/switch-expression' },
      { label: 'All Patterns',         url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/patterns' },
    ],
    resources: [
      { label: 'C# Pattern Blog', url: 'https://devblogs.microsoft.com/dotnet/pattern-matching-updates-in-c-9/', badge: 'blog' },
    ],
    gotchas: [
      'Property patterns only match the listed properties — unlisted ones are ignored; they cannot verify the object has no other state.',
      'The _ discard pattern in a switch expression matches everything — place it last or all subsequent arms are unreachable.',
    ],
  },

  exceptions: {
    apis: ['try/catch/finally', 'when', 'throw', 'Exception', 'AggregateException'],
    related: [
      { label: 'async/await',  route: '/csharp/async'       },
      { label: 'Null Safety',  route: '/csharp/null-safety' },
      { label: 'OOP & Classes',route: '/csharp/oop'         },
    ],
    tip: 'Catch the most specific exception type first — catching Exception at the top swallows every error including OutOfMemoryException.',
    docs: [
      { label: 'Exception Handling',     url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/' },
      { label: 'Creating Custom Exceptions', url: 'https://learn.microsoft.com/en-us/dotnet/standard/exceptions/how-to-create-user-defined-exceptions' },
      { label: 'Exception Filters (when)',   url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/when' },
    ],
    resources: [
      { label: 'Exception Design Guidelines', url: 'https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/exceptions', badge: 'docs' },
    ],
    gotchas: [
      'throw; (bare) preserves the stack trace; throw ex; resets it — always use bare throw when re-throwing.',
      'finally runs even when an exception is thrown — but not when Environment.FailFast() is called.',
    ],
  },

  delegates: {
    apis: ['delegate', 'Action<>', 'Func<>', 'Predicate<>', 'event', 'EventHandler<T>'],
    related: [
      { label: 'OOP & Classes', route: '/csharp/oop'      },
      { label: 'LINQ',          route: '/csharp/linq'     },
      { label: 'async/await',   route: '/csharp/async'    },
    ],
    tip: 'Prefer Func<> and Action<> over custom delegate types — they are already defined in the framework and are universally understood.',
    docs: [
      { label: 'Delegates (MS Docs)',  url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/delegates/' },
      { label: 'Events Guide',         url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/events/' },
      { label: 'Lambda Expressions',   url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/operators/lambda-expressions' },
    ],
    resources: [
      { label: 'Func vs Action vs Predicate', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.func-2', badge: 'docs' },
    ],
    gotchas: [
      'Multicast delegates invoke all subscribers — if one throws, the rest are not called. Invoke each subscriber inside a try/catch.',
      'Capturing a loop variable in a lambda closes over the variable, not its value — copy to a local variable inside the loop first.',
    ],
  },

  // ── C# New Topics ──────────────────────────────────────────────────────────

  fields: {
    apis: ['readonly', 'const', 'static', 'volatile', 'field keyword (C#14)'],
    related: [{ label: 'Variables & Types', route: '/csharp/basics' }, { label: 'Properties & Indexers', route: '/csharp/properties-indexers' }, { label: 'OOP & Classes', route: '/csharp/oop' }],
    tip: 'Prefer properties over public fields — they allow validation, computed values, and future changes without breaking callers.',
    docs: [{ label: 'Fields (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/fields' }, { label: 'Constants', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/constants' }],
    resources: [{ label: 'C# Language Reference', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/', badge: 'docs' }],
    gotchas: ['const is a compile-time constant; readonly is set at construction time — use readonly for dependency-injected values.', 'static fields are shared across all instances — mutations are visible everywhere.'],
  },

  methods: {
    apis: ['params', 'ref', 'out', 'in', 'default params', 'expression-bodied'],
    related: [{ label: 'Fields & Constants', route: '/csharp/fields' }, { label: 'Constructors', route: '/csharp/constructors' }, { label: 'Delegates & Events', route: '/csharp/delegates' }],
    tip: 'Use expression-bodied members (=>) for single-expression methods and properties — they reduce boilerplate without sacrificing readability.',
    docs: [{ label: 'Methods (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/methods' }, { label: 'Named/Optional Args', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/named-and-optional-arguments' }],
    resources: [{ label: 'C# Language Reference', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/', badge: 'docs' }],
    gotchas: ['ref and out parameters pass by reference — changes inside the method affect the caller\'s variable.', 'params must be the last parameter and only one params parameter is allowed per method.'],
  },

  'type-conversion': {
    apis: ['(T)cast', 'as', 'is', 'Convert', 'TryParse', 'implicit/explicit operator'],
    related: [{ label: 'Variables & Types', route: '/csharp/basics' }, { label: 'OOP & Classes', route: '/csharp/oop' }, { label: 'Pattern Matching', route: '/csharp/pattern-matching' }],
    tip: 'Prefer TryParse over Parse — Parse throws on invalid input while TryParse returns false, making error handling explicit.',
    docs: [{ label: 'Type Conversion (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/types/casting-and-type-conversions' }, { label: 'Convert Class', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.convert' }],
    resources: [{ label: 'C# Type System', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/', badge: 'docs' }],
    gotchas: ['(T)cast throws InvalidCastException on failure; as returns null — choose based on whether failure is exceptional.', 'Numeric conversions can silently lose data (double→int truncates); use checked{} to catch overflow.'],
  },

  constructors: {
    apis: ['this()', 'base()', 'static ctor', 'primary ctor (C#12)', 'required'],
    related: [{ label: 'OOP & Classes', route: '/csharp/oop' }, { label: 'Fields & Constants', route: '/csharp/fields' }, { label: 'Records & Structs', route: '/csharp/records' }],
    tip: 'Chain constructors with this() to avoid duplicating initialisation logic — keep one "main" constructor that does all the work.',
    docs: [{ label: 'Constructors (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/constructors' }, { label: 'Primary Constructors', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-12#primary-constructors' }],
    resources: [{ label: 'C# 12 Features', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-12', badge: 'docs' }],
    gotchas: ['Static constructors run once per type, not per instance — exceptions in static constructors make the type permanently unavailable.', 'Primary constructor parameters are in scope for the entire class body — capture to a field if you need them stored.'],
  },

  'properties-indexers': {
    apis: ['get; set;', 'get; init;', 'auto-prop', 'expression-bodied', 'this[T]'],
    related: [{ label: 'Fields & Constants', route: '/csharp/fields' }, { label: 'Records & Structs', route: '/csharp/records' }, { label: 'OOP & Classes', route: '/csharp/oop' }],
    tip: 'Use init-only setters for properties that should only be set at construction time — cleaner than private set with an object initializer.',
    docs: [{ label: 'Properties (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/properties' }, { label: 'Indexers', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/indexers/' }],
    resources: [{ label: 'Auto-Implemented Properties', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/auto-implemented-properties', badge: 'docs' }],
    gotchas: ['Auto-properties with private set can still be mutated inside the class — use init or readonly field if you want true immutability.', 'Indexers can be overloaded by parameter type — useful for DSL-style APIs.'],
  },

  namespaces: {
    apis: ['namespace', 'using', 'global using', 'file-scoped namespace', 'alias'],
    related: [{ label: 'Variables & Types', route: '/csharp/basics' }, { label: 'OOP & Classes', route: '/csharp/oop' }, { label: 'Static, Partial & Enums', route: '/csharp/static-enums' }],
    tip: 'Use file-scoped namespace declarations (C# 10+) to reduce indentation by one level across every file.',
    docs: [{ label: 'Namespaces (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/namespaces' }, { label: 'Global Usings', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-10#global-using-directives' }],
    resources: [{ label: 'C# 10 Features', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-10', badge: 'docs' }],
    gotchas: ['Global usings affect all files in the project — only use them for universally needed namespaces (System, System.Collections.Generic).', 'Aliasing a namespace (using Alias = Long.Namespace) only applies to the current file.'],
  },

  inheritance: {
    apis: [':', 'base', 'virtual', 'override', 'new (hiding)', 'sealed override'],
    related: [{ label: 'OOP & Classes', route: '/csharp/oop' }, { label: 'Abstract & Interfaces', route: '/csharp/abstract-interfaces' }, { label: 'System.Object', route: '/csharp/system-object' }],
    tip: 'Use new keyword to hide (not override) a base member — but always ask if hiding is really what you want; it breaks polymorphism.',
    docs: [{ label: 'Inheritance (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/inheritance' }, { label: 'Polymorphism', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/polymorphism' }],
    resources: [{ label: 'OOP Fundamentals', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/', badge: 'docs' }],
    gotchas: ['new hides the base method but does not participate in polymorphism — a base reference still calls the base version.', 'Calling virtual methods in a constructor uses the most-derived override — dangerous when the derived class is not yet initialized.'],
  },

  'abstract-interfaces': {
    apis: ['abstract', 'interface', 'default interface method', 'explicit impl', 'IComparable<T>'],
    related: [{ label: 'OOP & Classes', route: '/csharp/oop' }, { label: 'Inheritance & Overriding', route: '/csharp/inheritance' }, { label: 'Generics', route: '/csharp/generics' }],
    tip: 'Interfaces define contracts; abstract classes share implementation. If you find yourself duplicating logic across implementations, reach for an abstract class.',
    docs: [{ label: 'Interfaces (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/interfaces' }, { label: 'Abstract Classes', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/abstract-and-sealed-classes-and-class-members' }],
    resources: [{ label: 'Default Interface Methods', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-8#default-interface-methods', badge: 'docs' }],
    gotchas: ['A class can implement multiple interfaces but inherit only one class — design for this constraint early.', 'Default interface methods are not inherited by implementing classes — they are only callable through the interface type.'],
  },

  'static-enums': {
    apis: ['static class', 'partial class', 'enum', 'Flags', '[EnumMember]', 'Enum.Parse'],
    related: [{ label: 'OOP & Classes', route: '/csharp/oop' }, { label: 'Extension Methods', route: '/csharp/extension-methods' }, { label: 'Pattern Matching', route: '/csharp/pattern-matching' }],
    tip: 'Use [Flags] enums with powers of two for bitmask combinations — and always include a None = 0 member.',
    docs: [{ label: 'Enumerations (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/enum' }, { label: 'Static Classes', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/static-classes-and-static-class-members' }, { label: 'Partial Classes', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/partial-classes-and-methods' }],
    resources: [{ label: 'Flags Attribute', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.flagsattribute', badge: 'docs' }],
    gotchas: ['Enum.Parse throws on unknown values — use Enum.TryParse for user input.', 'Partial classes must be in the same assembly — they are merged at compile time, not at runtime.'],
  },

  structures: {
    apis: ['struct', 'ref struct', 'readonly struct', 'record struct', 'Span<T>'],
    related: [{ label: 'Records & Structs', route: '/csharp/records' }, { label: 'GC & IDisposable', route: '/csharp/gc-disposable' }, { label: 'Collections', route: '/csharp/collections' }],
    tip: 'Keep structs small (< 16 bytes) — large structs copied frequently can be slower than classes despite avoiding GC pressure.',
    docs: [{ label: 'Structure Types (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/struct' }, { label: 'ref struct', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/ref-struct' }],
    resources: [{ label: 'Choosing Struct vs Class', url: 'https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/choosing-between-class-and-struct', badge: 'docs' }],
    gotchas: ['Structs are copied on assignment — mutating a local copy does not affect the original.', 'ref struct cannot be boxed, stored in arrays, or used as generic type arguments.'],
  },

  'system-object': {
    apis: ['ToString()', 'Equals()', 'GetHashCode()', 'GetType()', 'MemberwiseClone()'],
    related: [{ label: 'OOP & Classes', route: '/csharp/oop' }, { label: 'Records & Structs', route: '/csharp/records' }, { label: 'Collections', route: '/csharp/collections' }],
    tip: 'When overriding Equals(), always override GetHashCode() — objects that are Equal must have the same hash code.',
    docs: [{ label: 'Object Class (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.object' }, { label: 'Object.Equals', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.object.equals' }],
    resources: [{ label: 'Equality Guidelines', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/statements-expressions-operators/how-to-define-value-equality-for-a-type', badge: 'docs' }],
    gotchas: ['Boxing a value type wraps it in a heap object — frequent boxing causes GC pressure.', 'object.ReferenceEquals() always checks reference identity — override Equals() for value equality.'],
  },

  'extension-methods': {
    apis: ['this T param', 'static class', 'LINQ extensions', 'fluent API', 'IEnumerable<T>'],
    related: [{ label: 'LINQ', route: '/csharp/linq' }, { label: 'Static, Partial & Enums', route: '/csharp/static-enums' }, { label: 'Delegates & Events', route: '/csharp/delegates' }],
    tip: 'Extension methods are perfect for adding functionality to types you don\'t own (BCL types, third-party types) — but don\'t abuse them on your own types.',
    docs: [{ label: 'Extension Methods (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/extension-methods' }],
    resources: [{ label: 'Fluent API Pattern', url: 'https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/extension-methods', badge: 'docs' }],
    gotchas: ['Extension methods cannot access private members — they are syntactic sugar for static method calls.', 'If a type gains an instance method with the same name, it takes precedence over the extension method.'],
  },

  tuples: {
    apis: ['(T1, T2)', 'ValueTuple', 'anonymous type', 'named fields', 'deconstruction'],
    related: [{ label: 'Pattern Matching', route: '/csharp/pattern-matching' }, { label: 'Records & Structs', route: '/csharp/records' }, { label: 'LINQ', route: '/csharp/linq' }],
    tip: 'Use named tuple fields for clarity — (string Name, int Age) instead of (string, int) makes code self-documenting.',
    docs: [{ label: 'Tuple Types (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/value-tuples' }, { label: 'Anonymous Types', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/anonymous-types' }],
    resources: [{ label: 'ValueTuple vs Tuple', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.valuetuple', badge: 'docs' }],
    gotchas: ['Tuple field names are compile-time only — at runtime they are Item1, Item2, etc.', 'Anonymous types are reference types limited to their declaring scope — use records for cross-method data transfer.'],
  },

  arrays: {
    apis: ['T[]', 'T[,]', 'T[][]', 'Array.Sort', 'ArraySegment<T>', 'array expressions []'],
    related: [{ label: 'Collections', route: '/csharp/collections' }, { label: 'Span & Memory', route: '/csharp/collections' }, { label: 'LINQ', route: '/csharp/linq' }],
    tip: 'Arrays have fixed size — if you need to add/remove elements, use List<T> instead. Use arrays only when size is known upfront.',
    docs: [{ label: 'Arrays (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/arrays/' }, { label: 'Multi-dimensional Arrays', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/arrays/multidimensional-arrays' }],
    resources: [{ label: 'Array Class API', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.array', badge: 'docs' }],
    gotchas: ['Array covariance lets string[] be assigned to object[] — but writing an int to that reference throws at runtime.', 'Jagged arrays (T[][]) have different syntax and behavior than multi-dimensional arrays (T[,]).'],
  },

  'strings-datetime': {
    apis: ['string.Format', 'StringBuilder', 'DateOnly', 'TimeOnly', 'TimeSpan', 'Math'],
    related: [{ label: 'Variables & Types', route: '/csharp/basics' }, { label: 'LINQ', route: '/csharp/linq' }, { label: 'I/O & Serialization', route: '/csharp/io-serialization' }],
    tip: 'Use DateOnly and TimeOnly (.NET 6+) instead of DateTime when you only need the date or time part — avoids timezone confusion.',
    docs: [{ label: 'String Class (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.string' }, { label: 'DateTime', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.datetime' }, { label: 'Math Class', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.math' }],
    resources: [{ label: 'DateOnly/TimeOnly', url: 'https://learn.microsoft.com/en-us/dotnet/standard/datetime/how-to-use-dateonly-timeonly', badge: 'docs' }],
    gotchas: ['string concatenation in a loop creates O(n²) allocations — use StringBuilder for building strings iteratively.', 'DateTime.Now is local time; DateTime.UtcNow is UTC — always store and compare in UTC.'],
  },

  'io-serialization': {
    apis: ['File', 'StreamReader', 'JsonSerializer', 'BinaryWriter', 'Encoding.UTF8'],
    related: [{ label: 'async / await', route: '/csharp/async' }, { label: 'Exceptions', route: '/csharp/exceptions' }, { label: 'GC & IDisposable', route: '/csharp/gc-disposable' }],
    tip: 'Always use async file I/O (File.ReadAllTextAsync) in ASP.NET apps — blocking I/O on a thread-pool thread reduces server throughput.',
    docs: [{ label: 'File I/O (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/standard/io/' }, { label: 'System.Text.Json', url: 'https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/overview' }],
    resources: [{ label: 'JSON Serialization Guide', url: 'https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/', badge: 'docs' }],
    gotchas: ['JsonSerializer is case-insensitive by default for deserialization but case-sensitive for serialization — use JsonSerializerOptions to control.', 'Streams must be disposed — always wrap in using or use File.ReadAllText for simple reads.'],
  },

  'gc-disposable': {
    apis: ['IDisposable', 'Dispose()', '~Finalizer', 'using', 'GC.SuppressFinalize', 'WeakReference'],
    related: [{ label: 'async / await', route: '/csharp/async' }, { label: 'I/O & Serialization', route: '/csharp/io-serialization' }, { label: 'Threading', route: '/csharp/threading' }],
    tip: 'Call GC.SuppressFinalize(this) inside Dispose() — once you\'ve cleaned up manually, there\'s no need for the finalizer to run.',
    docs: [{ label: 'Dispose Pattern (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/implementing-dispose' }, { label: 'Garbage Collection', url: 'https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/' }],
    resources: [{ label: 'IAsyncDisposable', url: 'https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/implementing-disposeasync', badge: 'docs' }],
    gotchas: ['Finalizers run on the GC thread — never acquire locks or throw exceptions inside them.', 'using() calls Dispose on exit even if an exception is thrown — prefer using declarations over explicit try/finally.'],
  },

  threading: {
    apis: ['Thread', 'ThreadPool', 'lock', 'Monitor', 'Interlocked', 'volatile'],
    related: [{ label: 'Tasks', route: '/csharp/tasks' }, { label: 'async / await', route: '/csharp/async' }, { label: 'Delegates & Events', route: '/csharp/delegates' }],
    tip: 'Prefer higher-level abstractions (Task, async/await, Parallel) over raw Thread — Thread is rarely the right tool in modern .NET.',
    docs: [{ label: 'Threading (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/standard/threading/' }, { label: 'Synchronization Primitives', url: 'https://learn.microsoft.com/en-us/dotnet/standard/threading/overview-of-synchronization-primitives' }],
    resources: [{ label: 'Thread Safety Guidelines', url: 'https://learn.microsoft.com/en-us/dotnet/standard/threading/managed-threading-best-practices', badge: 'docs' }],
    gotchas: ['lock() prevents concurrent access but can cause deadlocks if two threads lock in different orders.', 'volatile ensures visibility across threads but does not prevent race conditions on compound operations (read-modify-write).'],
  },

  tasks: {
    apis: ['Task.Run()', 'Task.WhenAll()', 'Parallel.ForEach()', 'TaskCompletionSource', 'ContinueWith()'],
    related: [{ label: 'async / await', route: '/csharp/async' }, { label: 'Threading', route: '/csharp/threading' }, { label: 'Exceptions', route: '/csharp/exceptions' }],
    tip: 'Use Task.Run only for CPU-bound work that would block the thread pool — I/O-bound work should use async/await without Task.Run.',
    docs: [{ label: 'Task Parallel Library (MS Docs)', url: 'https://learn.microsoft.com/en-us/dotnet/standard/parallel-programming/task-parallel-library-tpl' }, { label: 'Parallel Class', url: 'https://learn.microsoft.com/en-us/dotnet/standard/parallel-programming/data-parallelism-task-parallel-library' }],
    resources: [{ label: 'Async/Await Best Practices', url: 'https://learn.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming', badge: 'blog' }],
    gotchas: ['ContinueWith captures the current synchronization context by default — use TaskScheduler.Default to avoid UI thread marshaling.', 'Parallel.ForEach uses thread-pool threads — don\'t use it for I/O-bound work; use async LINQ or PLINQ instead.'],
  },

  'whats-new-9-10': {
    apis: ['record', 'init', 'with', 'global using', 'file-scoped namespace', 'record struct'],
    related: [{ label: 'Records & Structs', route: '/csharp/records' }, { label: 'Pattern Matching', route: '/csharp/pattern-matching' }, { label: 'What\'s New 11 & 12', route: '/csharp/whats-new-11-12' }],
    tip: 'Enable C# 10 file-scoped namespaces project-wide via Editorconfig to eliminate one level of indentation across your entire codebase.',
    docs: [{ label: 'C# 9 What\'s New', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-9' }, { label: 'C# 10 What\'s New', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-10' }],
    resources: [{ label: '.NET 6 Release Notes', url: 'https://devblogs.microsoft.com/dotnet/announcing-net-6/', badge: 'blog' }],
    gotchas: ['Top-level programs (C# 9) only work in one file per project — the entry point file.', 'Pattern matching improvements in C# 9 (and, or, not) are only available with the C# 9 or higher language version.'],
  },

  'whats-new-11-12': {
    apis: ['required', 'raw strings', 'INumber<T>', 'primary ctor', 'collection expressions []', 'default lambda'],
    related: [{ label: 'What\'s New 9 & 10', route: '/csharp/whats-new-9-10' }, { label: 'What\'s New Latest', route: '/csharp/whats-new-latest' }, { label: 'Generics', route: '/csharp/generics' }],
    tip: 'C# 12 primary constructors capture parameters as fields — if you reference them in multiple methods, they are stored automatically.',
    docs: [{ label: 'C# 11 What\'s New', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-11' }, { label: 'C# 12 What\'s New', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-12' }],
    resources: [{ label: '.NET 8 Release Notes', url: 'https://devblogs.microsoft.com/dotnet/announcing-dotnet-8/', badge: 'blog' }],
    gotchas: ['required members must be set in an object initializer — they cannot be set after construction.', 'Raw string literals (""") must start and end with the same number of quotes (minimum 3).'],
  },

  'whats-new-latest': {
    apis: ['params span', 'lock object', 'field keyword', 'partial property', 'extensions (C#14)', 'LINQ CountBy'],
    related: [{ label: 'What\'s New 11 & 12', route: '/csharp/whats-new-11-12' }, { label: 'async / await', route: '/csharp/async' }, { label: 'Collections', route: '/csharp/collections' }],
    tip: 'Track the official C# Language Design repo (github.com/dotnet/csharplang) to see what features are planned before they ship.',
    docs: [{ label: 'C# 13 What\'s New', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-13' }, { label: '.NET 10 Blog', url: 'https://devblogs.microsoft.com/dotnet/announcing-dotnet-10/' }, { label: 'C# Language Design', url: 'https://github.com/dotnet/csharplang' }],
    resources: [{ label: '.NET Release Notes', url: 'https://github.com/dotnet/core/tree/main/release-notes', badge: 'docs' }],
    gotchas: ['New language features require updating <LangVersion> in .csproj — they don\'t activate automatically.', 'Some .NET 10/11 APIs are marked [Experimental] — check the docs before using in production.'],
  },

  // ── C# Cheat Sheet ─────────────────────────────────────────────────────────
  'csharp/cheatsheet': {
    apis: ['var', 'record', 'LINQ', 'async/await', 'pattern matching', 'generics'],
    related: [
      { label: 'LINQ',             route: '/csharp/linq'            },
      { label: 'async / await',    route: '/csharp/async'           },
      { label: 'Pattern Matching', route: '/csharp/pattern-matching'},
      { label: 'Generics',         route: '/csharp/generics'        },
    ],
    tip: 'Use the search bar to filter entries across all sections at once — great for looking up a specific keyword quickly.',
    docs: [
      { label: 'C# Language Reference',  url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/' },
      { label: 'C# Programming Guide',   url: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/' },
      { label: 'LINQ Overview',          url: 'https://learn.microsoft.com/en-us/dotnet/csharp/linq/'              },
      { label: 'Async / Await Guide',    url: 'https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/' },
    ],
    resources: [
      { label: '.NET API Browser',       url: 'https://learn.microsoft.com/en-us/dotnet/api/',                      badge: 'docs'  },
      { label: 'C# Interactive (Try)',   url: 'https://dotnetfiddle.net',                                            badge: 'tool'  },
      { label: 'dotnet/runtime',         url: 'https://github.com/dotnet/runtime',                                   badge: 'code'  },
      { label: 'dotnet/csharplang (specs)', url: 'https://github.com/dotnet/csharplang',                             badge: 'code'  },
    ],
    gotchas: [
      'LINQ is lazy by default — always call ToList() or ToArray() when you need the results more than once.',
      'async void swallows exceptions — only use it for event handlers and always use async Task everywhere else.',
    ],
  },

  // ── C# Common Errors ───────────────────────────────────────────────────────
  'csharp/errors': {
    apis: ['NullReferenceException', 'InvalidCastException', 'ArgumentNullException', 'FormatException'],
    related: [
      { label: 'Null Safety',    route: '/csharp/null-safety' },
      { label: 'Exceptions',     route: '/csharp/exceptions'  },
      { label: 'async / await',  route: '/csharp/async'       },
      { label: 'LINQ',           route: '/csharp/linq'        },
    ],
    tip: 'Enable #nullable in your .csproj (<Nullable>enable</Nullable>) to catch NullReferenceExceptions at compile time.',
    docs: [
      { label: 'Exception Handling',        url: 'https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/exceptions/'             },
      { label: 'Nullable Reference Types',  url: 'https://learn.microsoft.com/en-us/dotnet/csharp/nullable-references'                  },
      { label: 'C# Compiler Errors',        url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-messages/'},
      { label: 'Async Best Practices',      url: 'https://learn.microsoft.com/en-us/archive/msdn-magazine/2013/march/async-await-best-practices-in-asynchronous-programming' },
    ],
    resources: [
      { label: '.NET API Browser',          url: 'https://learn.microsoft.com/en-us/dotnet/api/',          badge: 'docs'  },
      { label: 'Exception Design Guidelines', url: 'https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/exceptions', badge: 'docs' },
    ],
    gotchas: [
      'throw; (bare) preserves the original stack trace; throw ex; resets it — always use bare throw when re-throwing.',
      'Blocking on async with .Result or .Wait() can deadlock in sync-context environments — async all the way is the safest rule.',
    ],
  },

  // ── C# Practice & Reference pages ───────────────────────────────────────────
  'csharp/mini-projects': {
    apis: ['List<T>', 'JsonSerializer', 'HttpClient', 'Task.WhenAll', 'SemaphoreSlim'],
    related: [
      { label: 'Collections',       route: '/csharp/collections'      },
      { label: 'I/O & Serialization', route: '/csharp/io-serialization' },
      { label: 'async / await',     route: '/csharp/async'            },
      { label: 'Tasks & Parallel',  route: '/csharp/tasks'            },
    ],
    tip: 'Build the projects in order — each one layers new concepts on top of the previous one.',
    docs: [
      { label: '.NET Console Apps',     url: 'https://learn.microsoft.com/en-us/dotnet/core/tutorials/with-visual-studio-code' },
      { label: 'System.Text.Json',      url: 'https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/overview' },
      { label: 'HttpClient Guidelines', url: 'https://learn.microsoft.com/en-us/dotnet/fundamentals/networking/http/httpclient-guidelines' },
    ],
    resources: [
      { label: '.NET Fiddle',           url: 'https://dotnetfiddle.net', badge: 'tool' },
      { label: 'dotnet CLI docs',       url: 'https://learn.microsoft.com/en-us/dotnet/core/tools/', badge: 'docs' },
    ],
    gotchas: [
      'Create one HttpClient and reuse it — instantiating per request exhausts sockets.',
      'Always pass CancellationToken through async call chains so the whole pipeline can be cancelled.',
    ],
  },

  'csharp/learning-paths': {
    apis: ['Foundations', 'OOP', 'LINQ', 'async/await', 'Threading'],
    related: [
      { label: 'Variables & Types', route: '/csharp/basics'        },
      { label: 'Classes & OOP',     route: '/csharp/oop'           },
      { label: 'Quiz Practice',     route: '/csharp/quiz-practice' },
      { label: 'Interview Prep',    route: '/csharp/interview-prep'},
    ],
    tip: 'Stick to one path at a time — finishing a track beats sampling all of them.',
    docs: [
      { label: 'C# Documentation',  url: 'https://learn.microsoft.com/en-us/dotnet/csharp/' },
      { label: 'C# for Beginners',  url: 'https://dotnet.microsoft.com/en-us/learn/csharp'  },
    ],
    resources: [
      { label: 'Microsoft Learn paths', url: 'https://learn.microsoft.com/en-us/training/browse/?languages=csharp', badge: 'docs' },
    ],
    gotchas: [
      'Skipping fundamentals to reach async/LINQ faster usually costs more time than it saves.',
    ],
  },

  'csharp/interview-prep': {
    apis: ['boxing', 'variance', 'ConfigureAwait', 'GC generations', 'Span<T>'],
    related: [
      { label: 'Quiz Practice',     route: '/csharp/quiz-practice'   },
      { label: 'System.Object',     route: '/csharp/system-object'   },
      { label: 'async / await',     route: '/csharp/async'           },
      { label: 'GC & IDisposable',  route: '/csharp/gc-disposable'   },
    ],
    tip: 'Answer out loud before expanding — interviews test recall under pressure, not recognition.',
    docs: [
      { label: 'C# Language Reference', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/' },
      { label: '.NET Memory & GC',      url: 'https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/' },
    ],
    resources: [
      { label: 'SharpLab (inspect IL)', url: 'https://sharplab.io', badge: 'tool' },
    ],
    gotchas: [
      'Senior questions probe trade-offs ("when would you NOT use X") — memorised definitions are not enough.',
    ],
  },

  'csharp/quiz-practice': {
    apis: ['Types', 'OOP', 'Generics', 'LINQ', 'Async', 'Memory'],
    related: [
      { label: 'Interview Prep',  route: '/csharp/interview-prep' },
      { label: 'C# Cheat Sheet',  route: '/csharp/cheatsheet'     },
      { label: 'Common C# Errors', route: '/csharp/errors'        },
    ],
    tip: 'Re-run the topics you score lowest on — the per-topic breakdown at the end shows exactly where to focus.',
    docs: [
      { label: 'C# Documentation', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/' },
    ],
    resources: [
      { label: '.NET Fiddle',      url: 'https://dotnetfiddle.net', badge: 'tool' },
    ],
    gotchas: [
      'Read the explanation even when you answer correctly — guessing right teaches nothing.',
    ],
  },

  'csharp/design-patterns': {
    apis: ['Singleton', 'Factory', 'Builder', 'Repository', 'Strategy', 'Mediator'],
    related: [
      { label: 'Abstract & Interfaces', route: '/csharp/abstract-interfaces' },
      { label: 'Delegates & Events',    route: '/csharp/delegates'           },
      { label: 'Generics',              route: '/csharp/generics'            },
      { label: 'Decision Guides',       route: '/csharp/decision-guides'     },
    ],
    tip: 'In modern .NET the DI container replaces most hand-rolled Singletons and Factories — check "when NOT to use" first.',
    docs: [
      { label: 'DI in .NET',            url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection' },
      { label: 'Architecture guides',   url: 'https://learn.microsoft.com/en-us/dotnet/architecture/' },
    ],
    resources: [
      { label: 'Refactoring.Guru patterns', url: 'https://refactoring.guru/design-patterns/csharp', badge: 'blog' },
      { label: 'dotnet/aspnetcore',         url: 'https://github.com/dotnet/aspnetcore',            badge: 'code' },
      { label: 'eShop reference app',       url: 'https://github.com/dotnet/eShop',                 badge: 'code' },
    ],
    gotchas: [
      'Patterns are vocabulary, not goals — forcing a pattern onto simple code is the most common misuse.',
    ],
  },

  'csharp/decision-guides': {
    apis: ['List vs Span', 'class vs record', 'Task vs ValueTask', 'lock vs Interlocked'],
    related: [
      { label: 'Structures',       route: '/csharp/structures'      },
      { label: 'Records & Structs', route: '/csharp/records'        },
      { label: 'Collections',      route: '/csharp/collections'     },
      { label: 'Design Patterns',  route: '/csharp/design-patterns' },
    ],
    tip: 'When two options tie on the table, pick the simpler one — you can upgrade later when a real constraint appears.',
    docs: [
      { label: 'Choosing collections', url: 'https://learn.microsoft.com/en-us/dotnet/standard/collections/selecting-a-collection-class' },
      { label: 'Performance best practices', url: 'https://learn.microsoft.com/en-us/dotnet/framework/performance/performance-tips' },
    ],
    resources: [
      { label: 'SharpLab (inspect IL)', url: 'https://sharplab.io', badge: 'tool' },
    ],
    gotchas: [
      'Micro-benchmarks lie without BenchmarkDotNet — never decide struct-vs-class on a Stopwatch loop.',
    ],
  },

  'csharp/glossary': {
    apis: ['CLR', 'JIT', 'boxing', 'covariance', 'closure', 'GC'],
    related: [
      { label: 'C# Cheat Sheet',  route: '/csharp/cheatsheet'    },
      { label: 'System.Object',   route: '/csharp/system-object' },
      { label: 'GC & IDisposable', route: '/csharp/gc-disposable'},
    ],
    tip: 'Use the letter quick-nav or search — every term links onward to the full topic page where one exists.',
    docs: [
      { label: '.NET Glossary',   url: 'https://learn.microsoft.com/en-us/dotnet/standard/glossary' },
    ],
    resources: [
      { label: '.NET API Browser', url: 'https://learn.microsoft.com/en-us/dotnet/api/', badge: 'docs' },
    ],
    gotchas: [
      'Terms like "managed" and "boxed" have precise CLR meanings — interviewers notice loose usage.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // TYPESCRIPT PAGES
  // ════════════════════════════════════════════════════════════════════════════

  'typescript/basics': {
    apis: ['tsc', 'tsconfig.json', '--noEmit', 'strict', 'any', 'unknown', 'never'],
    related: [
      { label: 'Primitive & Literal Types', route: '/typescript/primitive-types'  },
      { label: 'Strict Mode & Migration',   route: '/typescript/strict-migration' },
      { label: 'tsconfig Deep Dive',        route: '/typescript/tsconfig'         },
    ],
    tip: 'Run tsc --noEmit in CI to type-check without generating output files — faster and keeps your build pipeline clean.',
    docs: [
      { label: 'TypeScript Handbook',    url: 'https://www.typescriptlang.org/docs/handbook/intro.html'      },
      { label: 'TSConfig Reference',     url: 'https://www.typescriptlang.org/tsconfig'                      },
      { label: 'TypeScript Playground',  url: 'https://www.typescriptlang.org/play'                          },
      { label: 'tsc CLI Reference',      url: 'https://www.typescriptlang.org/docs/handbook/compiler-options.html' },
    ],
    resources: [
      { label: 'microsoft/TypeScript',   url: 'https://github.com/microsoft/TypeScript',       badge: 'code' },
      { label: 'TypeScript Deep Dive',   url: 'https://basarat.gitbook.io/typescript',          badge: 'blog' },
    ],
    gotchas: [
      'any disables type checking silently — a single any in a call chain can erase types across the whole expression.',
      'unknown requires narrowing before use — it is the type-safe alternative to any for external/untyped data.',
      'TypeScript is erased at runtime — there are no types in the JavaScript output; runtime checks must use typeof/instanceof.',
    ],
  },

  'typescript/primitive-types': {
    apis: ['string', 'number', 'boolean', 'null', 'undefined', 'void', 'never', 'unknown', 'any', 'bigint', 'symbol'],
    related: [
      { label: 'TS Fundamentals',           route: '/typescript/basics'           },
      { label: 'Interfaces & Type Aliases', route: '/typescript/interfaces-types' },
      { label: 'Type Guards & Narrowing',   route: '/typescript/narrowing'        },
    ],
    tip: 'Prefer unknown over any for values from external sources — it forces you to narrow before use, preserving type safety.',
    docs: [
      { label: 'Everyday Types',        url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html'   },
      { label: 'Narrowing',             url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html'        },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                                  },
    ],
    resources: [
      { label: 'microsoft/TypeScript',  url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'void and undefined are subtly different — void means "I don\'t care about the return value"; undefined means it literally returns undefined.',
      'never is the bottom type — functions that always throw or loop infinitely have return type never; a union with never collapses.',
      'Literal types are inferred from const: const x = "admin" has type "admin", not string; let x = "admin" has type string.',
    ],
  },

  'typescript/interfaces-types': {
    apis: ['interface', 'type', 'extends', 'implements', 'readonly', '[key: string]: T', 'declaration merging', '&'],
    related: [
      { label: 'Primitive & Literal Types', route: '/typescript/primitive-types' },
      { label: 'Union & Intersection',       route: '/typescript/unions'          },
      { label: 'Mapped Types',               route: '/typescript/mapped-types'    },
    ],
    tip: 'Use interface for object shapes that may be extended or merged; use type for unions, intersections, and computed types.',
    docs: [
      { label: 'Object Types (Handbook)',   url: 'https://www.typescriptlang.org/docs/handbook/2/objects.html'           },
      { label: 'Type Aliases (Handbook)',   url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases' },
      { label: 'TypeScript Playground',    url: 'https://www.typescriptlang.org/play'                                     },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'Declaration merging only works with interface — two type aliases for the same name is a compile error.',
      'Index signatures ([key: string]: T) require all named properties to be assignable to T — common source of unexpected errors.',
      'type aliases cannot be reopened after definition; interface can always be extended by another interface declaration.',
    ],
  },

  'typescript/unions': {
    apis: ['|', '&', 'discriminated union', 'in operator', 'typeof', 'instanceof', 'satisfies'],
    related: [
      { label: 'Type Guards & Narrowing', route: '/typescript/narrowing'          },
      { label: 'Enums & Tuples',          route: '/typescript/enums-tuples'       },
      { label: 'Conditional Types',       route: '/typescript/conditional-types'  },
    ],
    tip: 'Add a literal discriminant property (kind: "circle" | "square") to union members — exhaustive narrowing becomes trivial.',
    docs: [
      { label: 'Union Types (Handbook)',        url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types' },
      { label: 'Narrowing (Handbook)',          url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html'                  },
      { label: 'TypeScript Playground',        url: 'https://www.typescriptlang.org/play'                                             },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'Intersection (&) on primitive types gives never — string & number = never; it is only meaningful on object types.',
      'Spreading a union into a function: fn(...args: A | B) does not work — you need overloads or a conditional type.',
      'The exhaustiveness check (default: const _: never = x) fails silently if the variable is unused and noUnusedLocals is off.',
    ],
  },

  'typescript/narrowing': {
    apis: ['typeof', 'instanceof', 'in', 'x is T (type predicate)', 'asserts x is T', 'satisfies never', 'Array.isArray()'],
    related: [
      { label: 'Union & Intersection',       route: '/typescript/unions'         },
      { label: 'Conditional Types',          route: '/typescript/conditional-types' },
      { label: 'Enums & Tuples',             route: '/typescript/enums-tuples'   },
    ],
    tip: 'Use asserts x is T for assertion functions — TypeScript narrows the type after the call site without requiring a conditional.',
    docs: [
      { label: 'Narrowing (Handbook)',    url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html' },
      { label: 'TypeScript Playground',  url: 'https://www.typescriptlang.org/play'                          },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'Type predicates (x is T) are unsafe — TypeScript trusts your return value; returning true on the wrong branch corrupts the type.',
      'typeof null === "object" — always check null separately before checking for an object type.',
      'The in operator narrows to the intersection that contains the key — not just the branch that definitely has it.',
    ],
  },

  'typescript/enums-tuples': {
    apis: ['enum', 'const enum', 'string enum', 'numeric enum', 'tuple', 'labeled tuple', 'rest in tuple'],
    related: [
      { label: 'Union & Intersection', route: '/typescript/unions'           },
      { label: 'Primitive & Literal',  route: '/typescript/primitive-types'  },
      { label: 'Conditional Types',    route: '/typescript/conditional-types' },
    ],
    tip: 'Prefer const enum (for inlining) or a string literal union over numeric enums in new code — unions are tree-shakable and readable in logs.',
    docs: [
      { label: 'Enums (Handbook)',      url: 'https://www.typescriptlang.org/docs/handbook/enums.html'                                     },
      { label: 'Tuple Types',           url: 'https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types'                     },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                                                          },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'const enum are erased at compile time — they cannot be used from outside the module with isolatedModules: true (required by esbuild/Babel).',
      'Numeric enums generate a reverse-mapping object — Direction[0] === "Up" — which can be surprising and increases bundle size.',
      'Tuples are assignable to arrays but not vice versa — [string, number] is stricter than (string | number)[].',
    ],
  },

  'typescript/generics': {
    apis: ['<T>', '<T extends U>', 'default type parameter', 'keyof T', 'T[K]', 'generic function', 'generic interface'],
    related: [
      { label: 'Generic Patterns',     route: '/typescript/generic-patterns' },
      { label: 'Utility Types',        route: '/typescript/utility-types'    },
      { label: 'Conditional Types',    route: '/typescript/conditional-types' },
    ],
    tip: 'Name type parameters by role in non-trivial generics — <TInput, TOutput> is clearer than <T, U> when both parameters matter.',
    docs: [
      { label: 'Generics (Handbook)',   url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html' },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                         },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
      { label: 'TypeScript Deep Dive', url: 'https://basarat.gitbook.io/typescript',   badge: 'blog' },
    ],
    gotchas: [
      'T extends string means T could be a string literal subtype, not just string — be careful in conditional types.',
      'Generic defaults (T = unknown) kick in only when T cannot be inferred — explicit default does not prevent inference.',
      'Using typeof param inside a generic function gives the generic type T, not the concrete type at the call site.',
    ],
  },

  'typescript/generic-patterns': {
    apis: ['Result<T,E>', 'Option<T>', 'generic factory (new() => T)', 'fluent builder', 'phantom type', 'branded type'],
    related: [
      { label: 'Generics Fundamentals', route: '/typescript/generics'          },
      { label: 'Utility Types',         route: '/typescript/utility-types'     },
      { label: 'Conditional Types',     route: '/typescript/conditional-types' },
    ],
    tip: 'Model fallible operations as Result<T, E> = { ok: true; value: T } | { ok: false; error: E } — explicit errors, no unexpected throws.',
    docs: [
      { label: 'Generics (Handbook)',   url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html'    },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                             },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
      { label: 'ts-results (npm)',      url: 'https://www.npmjs.com/package/ts-results', badge: 'tool' },
    ],
    gotchas: [
      'Phantom types exist only at compile time — a branded { _brand: "UserId" } adds zero runtime overhead.',
      'TypeScript does not support true higher-kinded types (HKT) — workarounds exist via interface merging but are verbose.',
      'Generic factories (new() => T) only work for classes with public constructors — abstract classes are excluded.',
    ],
  },

  'typescript/utility-types': {
    apis: ['Partial<T>', 'Required<T>', 'Readonly<T>', 'Pick<T,K>', 'Omit<T,K>', 'Record<K,V>', 'Extract<T,U>', 'Exclude<T,U>', 'NonNullable<T>', 'ReturnType<F>', 'Parameters<F>'],
    related: [
      { label: 'Mapped Types',      route: '/typescript/mapped-types'      },
      { label: 'Conditional Types', route: '/typescript/conditional-types'  },
      { label: 'Generics',          route: '/typescript/generics'           },
    ],
    tip: 'Chain utility types for precise shapes: Pick<Readonly<User>, "id" | "name"> produces a readonly subset in one expression.',
    docs: [
      { label: 'Utility Types Reference', url: 'https://www.typescriptlang.org/docs/handbook/utility-types.html' },
      { label: 'TypeScript Playground',   url: 'https://www.typescriptlang.org/play'                             },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
      { label: 'type-fest (npm)',       url: 'https://www.npmjs.com/package/type-fest', badge: 'tool' },
    ],
    gotchas: [
      'Partial and Required are shallow — nested objects are unaffected; write a DeepPartial recursive type for full depth.',
      'Omit<T, K> on a union type may not work as expected — each union member is processed independently.',
      'Record<K, V> with a union K creates a required entry for every member — use Partial<Record<K, V>> for optional entries.',
    ],
  },

  'typescript/mapped-types': {
    apis: ['{ [K in keyof T]: T[K] }', '-?', '-readonly', 'as (key remap)', 'PropertyKey', 'template literal key'],
    related: [
      { label: 'Utility Types',          route: '/typescript/utility-types'         },
      { label: 'Conditional Types',      route: '/typescript/conditional-types'     },
      { label: 'Template Literal Types', route: '/typescript/template-literal-types'},
    ],
    tip: 'Use the as clause for key remapping: { [K in keyof T as Capitalize<string & K>]: T[K] } to rename keys at the type level.',
    docs: [
      { label: 'Mapped Types (Handbook)',   url: 'https://www.typescriptlang.org/docs/handbook/2/mapped-types.html' },
      { label: 'TypeScript Playground',    url: 'https://www.typescriptlang.org/play'                              },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'Mapped types on union types distribute over the union — each member is mapped independently, which may not be what you want.',
      'Add -readonly and -? to actively remove modifiers; just omitting them keeps the original modifier.',
      'Key remapping with as never filters out that key — useful for removing keys conditionally: as K extends "id" ? never : K.',
    ],
  },

  'typescript/conditional-types': {
    apis: ['T extends U ? X : Y', 'infer P', 'distributive conditional', 'NonNullable<T>', 'Awaited<T>', 'ReturnType<F>'],
    related: [
      { label: 'Mapped Types',           route: '/typescript/mapped-types'          },
      { label: 'Utility Types',          route: '/typescript/utility-types'         },
      { label: 'Template Literal Types', route: '/typescript/template-literal-types'},
    ],
    tip: 'Wrap T in a tuple ([T] extends [U]) to prevent distributive behaviour when you need the whole union evaluated together.',
    docs: [
      { label: 'Conditional Types (Handbook)', url: 'https://www.typescriptlang.org/docs/handbook/2/conditional-types.html' },
      { label: 'TypeScript Playground',       url: 'https://www.typescriptlang.org/play'                                    },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'Conditional types with a still-generic T are deferred — the type stays unevaluated until T is resolved at the call site.',
      'Distributive types apply to each union member independently — T extends U ? X : Y with T = A | B gives (A extends U ? X : Y) | (B extends U ? X : Y).',
      'infer can only appear in the extends clause of a conditional type — not in the true/false branches.',
    ],
  },

  'typescript/template-literal-types': {
    apis: ['`${T}${U}`', 'Uppercase<S>', 'Lowercase<S>', 'Capitalize<S>', 'Uncapitalize<S>', 'infer in template'],
    related: [
      { label: 'Conditional Types', route: '/typescript/conditional-types' },
      { label: 'Mapped Types',      route: '/typescript/mapped-types'      },
      { label: 'Utility Types',     route: '/typescript/utility-types'     },
    ],
    tip: 'Combine with mapped types to derive event handler names: { [K in EventName as `on${Capitalize<K>}`]: Handler<K> }',
    docs: [
      { label: 'Template Literal Types (Handbook)', url: 'https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html' },
      { label: 'TypeScript Playground',            url: 'https://www.typescriptlang.org/play'                                       },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'Large string unions in template literals create exponentially large union types — can significantly slow compilation.',
      'infer in template literal types cannot match across arbitrary word boundaries — use a chained conditional to extract parts.',
      'Intrinsic string manipulation (Uppercase, Capitalize) only works on string literal types, not runtime strings.',
    ],
  },

  'typescript/classes': {
    apis: ['class', 'private / protected / public', '#private (ECMAScript)', 'readonly', 'abstract class', 'override', 'parameter property'],
    related: [
      { label: 'Decorators',              route: '/typescript/decorators'        },
      { label: 'Interfaces & Type Aliases', route: '/typescript/interfaces-types'},
      { label: 'Generics',                route: '/typescript/generics'          },
    ],
    tip: 'Use ECMAScript #private for genuine runtime privacy — TypeScript private is compile-time only and is accessible in emitted JS.',
    docs: [
      { label: 'Classes (Handbook)',    url: 'https://www.typescriptlang.org/docs/handbook/2/classes.html' },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                        },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'abstract class cannot be instantiated — trying to new it is a compile error; always create a concrete subclass.',
      'override keyword (TS 4.3+) enforces the method exists in the superclass — but it is NOT required by default; enable noImplicitOverride.',
      'Parameter properties (constructor(private x: T)) only work in TypeScript classes, not in plain ES class declarations.',
    ],
  },

  'typescript/decorators': {
    apis: ['@decorator', 'ClassDecorator', 'MethodDecorator', 'PropertyDecorator', 'ParameterDecorator', 'DecoratorContext (TS 5)', 'experimentalDecorators'],
    related: [
      { label: 'Classes & Visibility', route: '/typescript/classes'   },
      { label: 'tsconfig Deep Dive',   route: '/typescript/tsconfig'  },
      { label: 'TypeScript with Frameworks', route: '/typescript/frameworks' },
    ],
    tip: 'TS 5.0 decorators (TC39 Stage 3) are the standard — use experimentalDecorators: true only for legacy code or frameworks that require it.',
    docs: [
      { label: 'Decorators (Handbook)', url: 'https://www.typescriptlang.org/docs/handbook/decorators.html'                  },
      { label: 'TC39 Decorators Proposal', url: 'https://github.com/tc39/proposal-decorators'                               },
      { label: 'TypeScript 5.0 Blog',   url: 'https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/'        },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                                          },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'TS 5.0 decorators and experimentalDecorators are INCOMPATIBLE — you cannot mix them in the same file.',
      'Angular still uses experimental decorators internally — enable experimentalDecorators in Angular projects.',
      'Class decorators receive the class constructor; method decorators receive the method and its descriptor — the APIs differ between experimental and TC39 Stage 3.',
    ],
  },

  'typescript/tsconfig': {
    apis: ['target', 'lib', 'module', 'moduleResolution', 'strict', 'paths', 'baseUrl', 'composite', 'references', 'skipLibCheck'],
    related: [
      { label: 'Module System',       route: '/typescript/modules'      },
      { label: 'Declaration Files',   route: '/typescript/declarations' },
      { label: 'TS Performance',      route: '/typescript/ts-performance'},
    ],
    tip: 'Use extends in tsconfig to share a base: tsconfig.base.json sets strict + target, per-package configs extend it and add paths.',
    docs: [
      { label: 'TSConfig Reference',    url: 'https://www.typescriptlang.org/tsconfig'                                          },
      { label: 'Project References',    url: 'https://www.typescriptlang.org/docs/handbook/project-references.html'              },
      { label: 'tsc CLI Reference',     url: 'https://www.typescriptlang.org/docs/handbook/compiler-options.html'                },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                                               },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'target (JS output version) and lib (available types) are independent — you can target ES5 while using Promise types from lib ES2017.',
      'moduleResolution: bundler (TS 5.0+) is required for Vite/esbuild — do not use node16/nodenext with plain bundlers.',
      'paths aliases must also be configured in the bundler (Vite/Webpack) — tsc resolves them for type-checking but bundlers do their own resolution.',
    ],
  },

  'typescript/modules': {
    apis: ['import', 'export', 'export default', 'import type', 'require()', 'namespace', 'declare module', 'module resolution'],
    related: [
      { label: 'tsconfig Deep Dive',    route: '/typescript/tsconfig'    },
      { label: 'Declaration Files',     route: '/typescript/declarations'},
      { label: 'TypeScript Frameworks', route: '/typescript/frameworks'  },
    ],
    tip: 'Use import type for type-only imports — it is erased at compile time and prevents accidental circular dependencies at runtime.',
    docs: [
      { label: 'Modules (Handbook)',    url: 'https://www.typescriptlang.org/docs/handbook/2/modules.html'   },
      { label: 'Module Resolution',    url: 'https://www.typescriptlang.org/docs/handbook/module-resolution.html' },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                          },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'A file with no import/export is a script — its declarations are global; add export {} to make it a module.',
      'namespace (internal modules) is legacy — use ES modules and import/export in all new code.',
      'esModuleInterop: true allows default imports from CommonJS modules — without it you need import * as React from "react".',
    ],
  },

  'typescript/declarations': {
    apis: ['declare', '.d.ts', 'declare module', 'declare global', '@types/xxx', 'DefinitelyTyped', 'module augmentation'],
    related: [
      { label: 'Module System',     route: '/typescript/modules'    },
      { label: 'TypeScript Frameworks', route: '/typescript/frameworks'},
      { label: 'tsconfig Deep Dive', route: '/typescript/tsconfig'   },
    ],
    tip: 'Use module augmentation to extend third-party types: declare module "express" { interface Request { user?: User } }',
    docs: [
      { label: 'Declaration Files (Handbook)', url: 'https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html' },
      { label: 'Publishing (Handbook)',        url: 'https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html'   },
      { label: 'TypeScript Playground',       url: 'https://www.typescriptlang.org/play'                                              },
    ],
    resources: [
      { label: 'DefinitelyTyped',      url: 'https://github.com/DefinitelyTyped/DefinitelyTyped', badge: 'code' },
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript',            badge: 'code' },
    ],
    gotchas: [
      'A .d.ts without any exports is an ambient global declaration — add export {} if you only want to augment an existing module.',
      '@types packages belong in devDependencies — they are erased at runtime and should not appear in your production bundle.',
      'declare module "lib" {} creates a completely new shape — use import type and interface merging to augment without clobbering existing types.',
    ],
  },

  'typescript/frameworks': {
    apis: ['React.FC<Props>', 'JSX.Element', 'z.infer<T>', 'Zod', 'Request augmentation', 'Next.js types', '@types/node'],
    related: [
      { label: 'Declaration Files', route: '/typescript/declarations' },
      { label: 'Generics',          route: '/typescript/generics'     },
      { label: 'Modules',           route: '/typescript/modules'      },
    ],
    tip: 'Prefer (props: Props) => JSX.Element over React.FC<Props> — no implicit children, better generic components, and simpler types.',
    docs: [
      { label: 'React TypeScript Cheatsheet', url: 'https://react-typescript-cheatsheet.netlify.app'                    },
      { label: 'Zod Documentation',           url: 'https://zod.dev'                                                    },
      { label: 'TypeScript Handbook',         url: 'https://www.typescriptlang.org/docs/handbook/intro.html'            },
      { label: 'TypeScript Playground',       url: 'https://www.typescriptlang.org/play'                                },
    ],
    resources: [
      { label: '@types/react',         url: 'https://www.npmjs.com/package/@types/react',  badge: 'tool' },
      { label: '@types/node',          url: 'https://www.npmjs.com/package/@types/node',   badge: 'tool' },
      { label: 'DefinitelyTyped',      url: 'https://github.com/DefinitelyTyped/DefinitelyTyped', badge: 'code' },
    ],
    gotchas: [
      'React.FC removed implicit children in React 18 — old tutorials showing children without explicit typing are incorrect.',
      'Zod z.infer<typeof schema> gives the TypeScript type from a runtime schema — one source of truth for validation + types.',
      'Augmenting Express Request types requires the exact module path: "express-serve-static-core" not "express".',
    ],
  },

  'typescript/strict-migration': {
    apis: ['strict', 'noImplicitAny', 'strictNullChecks', 'allowJs', 'checkJs', '--noEmit', 'ts-migrate'],
    related: [
      { label: 'TS Fundamentals',  route: '/typescript/basics'    },
      { label: 'tsconfig',         route: '/typescript/tsconfig'  },
      { label: 'Declarations',     route: '/typescript/declarations'},
    ],
    tip: 'Add // @ts-check to JS files for incremental type-checking before full migration — zero-cost first step for large codebases.',
    docs: [
      { label: 'Migrating from JS (Handbook)', url: 'https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html' },
      { label: 'Strict mode flags',            url: 'https://www.typescriptlang.org/tsconfig#strict'                              },
      { label: 'TypeScript Playground',        url: 'https://www.typescriptlang.org/play'                                         },
    ],
    resources: [
      { label: 'microsoft/TypeScript',  url: 'https://github.com/microsoft/TypeScript',              badge: 'code' },
      { label: 'ts-migrate (npm)',       url: 'https://www.npmjs.com/package/ts-migrate',             badge: 'tool' },
    ],
    gotchas: [
      'noImplicitAny errors flood first in a large JS migration — suppress with // @ts-expect-error and fix gradually by file.',
      'strictNullChecks reveals the most bugs but is the hardest flag to retrofit — enable it last, after noImplicitAny is clean.',
      'allowJs + checkJs type-check JS files as-is; allowJs without checkJs compiles them but does not type-check.',
    ],
  },

  'typescript/ts-performance': {
    apis: ['composite: true', 'incremental: true', 'isolatedModules: true', 'skipLibCheck: true', '--listFiles', '--diagnostics', 'project references'],
    related: [
      { label: 'tsconfig Deep Dive',  route: '/typescript/tsconfig'    },
      { label: 'Modules',             route: '/typescript/modules'     },
      { label: 'Declaration Files',   route: '/typescript/declarations'},
    ],
    tip: 'Run tsc --diagnostics to see which files consume the most type-checking time — target those for simplification or project-reference isolation.',
    docs: [
      { label: 'Performance Wiki',      url: 'https://github.com/microsoft/TypeScript/wiki/Performance'           },
      { label: 'Project References',    url: 'https://www.typescriptlang.org/docs/handbook/project-references.html'},
      { label: 'TSConfig Reference',    url: 'https://www.typescriptlang.org/tsconfig'                            },
    ],
    resources: [
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', badge: 'code' },
    ],
    gotchas: [
      'isolatedModules: true requires each file to be transpilable in isolation — const enum and ambient type-only re-exports fail.',
      'skipLibCheck skips type errors in .d.ts files — it speeds up compilation but may hide real errors from dependencies.',
      'Deeply recursive conditional types and mapped types on large unions are the most common causes of slow compilation.',
    ],
  },

  'typescript/cheatsheet': {
    apis: ['Partial<T>', 'Record<K,V>', 'ReturnType<F>', 'keyof', 'typeof', 'infer', 'satisfies', 'as const'],
    related: [
      { label: 'Utility Types',    route: '/typescript/utility-types'  },
      { label: 'Mapped Types',     route: '/typescript/mapped-types'   },
      { label: 'Conditional Types',route: '/typescript/conditional-types'},
    ],
    tip: 'Use as const on object literals for narrow literal types on all values — { role: "admin" } as const narrows to "admin", not string.',
    docs: [
      { label: 'Utility Types Reference', url: 'https://www.typescriptlang.org/docs/handbook/utility-types.html' },
      { label: 'TypeScript Handbook',     url: 'https://www.typescriptlang.org/docs/handbook/intro.html'         },
      { label: 'TypeScript Playground',   url: 'https://www.typescriptlang.org/play'                             },
    ],
    resources: [
      { label: 'microsoft/TypeScript',  url: 'https://github.com/microsoft/TypeScript',   badge: 'code' },
      { label: 'type-challenges (GitHub)', url: 'https://github.com/type-challenges/type-challenges', badge: 'code' },
    ],
    gotchas: [
      'keyof on a class type includes all public property and method names — including inherited ones from the prototype chain.',
      'as const on an array creates a readonly tuple — useful but means you cannot push() or sort() without casting.',
      'satisfies operator checks a value against a type without widening the variable\'s inferred type — different from a type annotation.',
    ],
  },

  'typescript/interview-prep': {
    apis: ['type vs interface', 'generic constraints', 'conditional types', 'infer', 'discriminated union', 'structural typing'],
    related: [
      { label: 'TS Fundamentals',    route: '/typescript/basics'        },
      { label: 'Utility Types',      route: '/typescript/utility-types' },
      { label: 'Type Guards',        route: '/typescript/narrowing'     },
    ],
    tip: 'Answer with examples — explaining infer by writing T extends Promise<infer U> ? U : never beats any definition-only answer in an interview.',
    docs: [
      { label: 'TypeScript Handbook',   url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play'                     },
    ],
    resources: [
      { label: 'microsoft/TypeScript',  url: 'https://github.com/microsoft/TypeScript',              badge: 'code' },
      { label: 'type-challenges',       url: 'https://github.com/type-challenges/type-challenges',   badge: 'code' },
    ],
    gotchas: [
      'Senior questions probe trade-offs ("when would you use type over interface") — one-line definitions are not enough.',
      'Structural typing questions trip up candidates from Java/C# backgrounds — two unrelated classes with the same shape are assignable to each other.',
    ],
  },

  // ── Angular Practice & Reference pages ──────────────────────────────────────
  'interview-prep': {
    apis: ['signals', 'change detection', 'DI', 'zoneless', 'hydration'],
    related: [
      { label: 'Quiz Practice',    route: '/angular/quiz-practice'    },
      { label: 'Change Detection', route: '/angular/change-detection' },
      { label: 'Signals & State',  route: '/angular/counter'          },
      { label: 'Dependency Injection', route: '/angular/di'           },
    ],
    tip: 'Answer out loud before expanding — interviews test recall under pressure, not recognition.',
    docs: [
      { label: 'angular.dev Guides', url: 'https://angular.dev/overview' },
      { label: 'Signals Overview',   url: 'https://angular.dev/guide/signals' },
    ],
    resources: [
      { label: 'Angular Blog', url: 'https://blog.angular.dev', badge: 'blog' },
    ],
    gotchas: [
      'Senior questions probe trade-offs ("when would you NOT use X") — memorised definitions are not enough.',
    ],
  },

  'quiz-practice': {
    apis: ['Signals', 'DI', 'Router', 'Forms', 'RxJS', 'Testing'],
    related: [
      { label: 'Interview Prep',   route: '/angular/interview-prep' },
      { label: 'Cheat Sheet',      route: '/angular/cheatsheet'     },
      { label: 'Common Errors',    route: '/angular/errors'         },
    ],
    tip: 'Re-run the topics you score lowest on — the per-topic breakdown at the end shows exactly where to focus.',
    docs: [
      { label: 'angular.dev Guides', url: 'https://angular.dev/overview' },
    ],
    resources: [
      { label: 'Angular Tutorials', url: 'https://angular.dev/tutorials', badge: 'docs' },
    ],
    gotchas: [
      'Read the explanation even when you answer correctly — guessing right teaches nothing.',
    ],
  },

  'design-patterns': {
    apis: ['Signal Store', 'Facade', 'InjectionToken', 'host directives', 'OnPush'],
    related: [
      { label: 'Signal Store',       route: '/angular/store'           },
      { label: 'Dependency Injection', route: '/angular/di'            },
      { label: 'Content Projection', route: '/angular/content-projection' },
      { label: 'Decision Guides',    route: '/angular/decision-guides' },
    ],
    tip: 'Most Angular patterns are DI + signals combinations — master those two primitives first.',
    docs: [
      { label: 'DI Guide',          url: 'https://angular.dev/guide/di' },
      { label: 'Signals Overview',  url: 'https://angular.dev/guide/signals' },
    ],
    resources: [
      { label: 'Angular Blog',      url: 'https://blog.angular.dev',                badge: 'blog' },
      { label: 'angular/angular',   url: 'https://github.com/angular/angular',      badge: 'code' },
      { label: 'angular/components', url: 'https://github.com/angular/components',  badge: 'code' },
    ],
    gotchas: [
      'Patterns are vocabulary, not goals — forcing a pattern onto simple code is the most common misuse.',
    ],
  },

  'decision-guides': {
    apis: ['signal vs observable', 'reactive vs template', '@defer vs lazy route'],
    related: [
      { label: 'Signals & State',  route: '/angular/counter'         },
      { label: 'RxJS Operators',   route: '/angular/rxjs'            },
      { label: '@defer Blocks',    route: '/angular/defer'           },
      { label: 'Design Patterns',  route: '/angular/design-patterns' },
    ],
    tip: 'When two options tie on the table, pick the simpler one — you can upgrade later when a real constraint appears.',
    docs: [
      { label: 'Signals vs RxJS interop', url: 'https://angular.dev/guide/rxjs-interop' },
      { label: 'Deferred loading',        url: 'https://angular.dev/guide/templates/defer' },
    ],
    resources: [
      { label: 'Angular Blog', url: 'https://blog.angular.dev', badge: 'blog' },
    ],
    gotchas: [
      'Defaults shifted in the signals era — advice older than v17 often recommends RxJS where a signal now suffices.',
    ],
  },

  'glossary': {
    apis: ['hydration', 'zoneless', 'injector', 'linkedSignal', 'CVA'],
    related: [
      { label: 'Cheat Sheet',      route: '/angular/cheatsheet'       },
      { label: 'Change Detection', route: '/angular/change-detection' },
      { label: 'SSR + Hydration',  route: '/angular/ssr'              },
    ],
    tip: 'Use the letter quick-nav or search — every term links onward to the full topic page where one exists.',
    docs: [
      { label: 'angular.dev Glossary-ish API docs', url: 'https://angular.dev/api' },
    ],
    resources: [
      { label: 'angular.dev Guides', url: 'https://angular.dev/overview', badge: 'docs' },
    ],
    gotchas: [
      'Terms like "hydration" and "zoneless" have precise meanings in Angular — loose usage causes confusion in reviews.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // REACT PAGES
  // ════════════════════════════════════════════════════════════════════════════

  'react/basics': {
    apis: ['JSX', 'createElement()', 'Fragment', 'key', 'ReactDOM.createRoot()'],
    related: [
      { label: 'Core Hooks',       route: '/react/hooks-core'     },
      { label: 'TypeScript & React', route: '/react/typescript'   },
      { label: 'React Patterns',   route: '/react/patterns'       },
    ],
    tip: 'JSX is syntactic sugar — every <Tag> compiles to React.createElement(). Understanding this makes the virtual DOM click.',
    docs: [
      { label: 'React Docs — Describing the UI',   url: 'https://react.dev/learn/describing-the-ui'         },
      { label: 'React.dev Quick Start',            url: 'https://react.dev/learn'                           },
      { label: 'Reconciliation (legacy docs)',     url: 'https://legacy.reactjs.org/docs/reconciliation.html'},
    ],
    resources: [
      { label: 'facebook/react',   url: 'https://github.com/facebook/react', badge: 'code' },
      { label: 'React Blog',       url: 'https://react.dev/blog',             badge: 'blog' },
    ],
    gotchas: [
      'Keys must be stable data IDs — using array index causes incorrect reconciliation on reorder or filter.',
      'JSX expressions must return a single root — wrap siblings in a Fragment <> </> or a div.',
      'Component names must start with uppercase — lowercase tags are treated as HTML elements.',
    ],
  },

  'react/hooks-core': {
    apis: ['useState()', 'useEffect()', 'useRef()', 'useContext()', 'Rules of Hooks'],
    related: [
      { label: 'Advanced Hooks',    route: '/react/hooks-advanced' },
      { label: 'Context API',       route: '/react/context'        },
      { label: 'React Patterns',    route: '/react/patterns'       },
    ],
    tip: 'useEffect cleanup is mandatory for subscriptions, timers, and fetch abort controllers — a missing cleanup causes memory leaks.',
    docs: [
      { label: 'useState Reference',  url: 'https://react.dev/reference/react/useState'  },
      { label: 'useEffect Reference', url: 'https://react.dev/reference/react/useEffect' },
      { label: 'useRef Reference',    url: 'https://react.dev/reference/react/useRef'    },
      { label: 'Rules of Hooks',      url: 'https://react.dev/reference/rules/rules-of-hooks' },
    ],
    resources: [
      { label: 'A Complete Guide to useEffect', url: 'https://overreacted.io/a-complete-guide-to-useeffect/', badge: 'blog' },
      { label: 'facebook/react',               url: 'https://github.com/facebook/react',                      badge: 'code' },
    ],
    gotchas: [
      'Never call hooks conditionally or inside loops — hooks must run in the same order on every render.',
      'Stale closure: useEffect captures props/state at the time it ran. Use the functional updater setState(prev => ...) to avoid staleness.',
      'useEffect with an empty [] dep array runs once — but its cleanup still runs on unmount.',
    ],
  },

  'react/hooks-advanced': {
    apis: ['useReducer()', 'useMemo()', 'useCallback()', 'useTransition()', 'useDeferredValue()', 'useId()'],
    related: [
      { label: 'Core Hooks',        route: '/react/hooks-core'      },
      { label: 'React Performance', route: '/react/performance'     },
      { label: 'State Management',  route: '/react/state-management'},
    ],
    tip: 'useReducer shines when the next state depends on the previous state across multiple sub-values — prefer it over multiple useState.',
    docs: [
      { label: 'useReducer Reference',       url: 'https://react.dev/reference/react/useReducer'       },
      { label: 'useMemo Reference',          url: 'https://react.dev/reference/react/useMemo'          },
      { label: 'useCallback Reference',      url: 'https://react.dev/reference/react/useCallback'      },
      { label: 'useTransition Reference',    url: 'https://react.dev/reference/react/useTransition'    },
    ],
    resources: [
      { label: 'React Blog — React 18',  url: 'https://react.dev/blog/2022/03/29/react-v18',  badge: 'blog' },
      { label: 'facebook/react',         url: 'https://github.com/facebook/react',             badge: 'code' },
    ],
    gotchas: [
      'useMemo and useCallback have their own overhead — only add them after profiling shows a real performance problem.',
      'useId() generates a stable ID per component instance — safe for SSR. Never use Math.random() for element IDs.',
    ],
  },

  'react/forms': {
    apis: ['controlled input', 'useRef for uncontrolled', 'React Hook Form', 'zodResolver', 'useFieldArray'],
    related: [
      { label: 'Core Hooks',        route: '/react/hooks-core'  },
      { label: 'TypeScript & React', route: '/react/typescript' },
      { label: 'Testing React',     route: '/react/testing'     },
    ],
    tip: 'React Hook Form uses uncontrolled inputs by default — the form only re-renders on submission and on validation errors, not on every keystroke.',
    docs: [
      { label: 'RHF Docs',          url: 'https://react-hook-form.com/docs'                              },
      { label: 'Zod Docs',          url: 'https://zod.dev'                                               },
      { label: 'React Forms Guide',  url: 'https://react.dev/reference/react-dom/components/input'       },
    ],
    resources: [
      { label: 'react-hook-form/react-hook-form', url: 'https://github.com/react-hook-form/react-hook-form', badge: 'code' },
      { label: 'colinhacks/zod',                  url: 'https://github.com/colinhacks/zod',                   badge: 'code' },
    ],
    gotchas: [
      'Controller wraps controlled third-party inputs (Radix, MUI) — register() only works on native HTML inputs.',
      'Zod refinements run after field validation — put cross-field checks (password confirm) in .superRefine() not per-field.',
    ],
  },

  'react/context': {
    apis: ['createContext()', 'useContext()', 'Context.Provider', 'useReducer + Context'],
    related: [
      { label: 'State Management',  route: '/react/state-management' },
      { label: 'React Patterns',    route: '/react/patterns'         },
      { label: 'Advanced Hooks',    route: '/react/hooks-advanced'   },
    ],
    tip: 'Split context into a StateContext and a DispatchContext — consumers that only dispatch never re-render when state changes.',
    docs: [
      { label: 'createContext Reference',  url: 'https://react.dev/reference/react/createContext'  },
      { label: 'useContext Reference',     url: 'https://react.dev/reference/react/useContext'     },
      { label: 'Scaling with Reducer + Context', url: 'https://react.dev/learn/scaling-up-with-reducer-and-context' },
    ],
    resources: [
      { label: 'facebook/react', url: 'https://github.com/facebook/react', badge: 'code' },
    ],
    gotchas: [
      'Every context consumer re-renders when the Provider\'s value reference changes — memoize the value object.',
      'Context is not a state manager — it is a dependency injector. Pair with useReducer for complex state.',
    ],
  },

  'react/state-management': {
    apis: ['useState', 'useReducer', 'Zustand create()', 'Jotai atom()', 'RTK createSlice'],
    related: [
      { label: 'Context API',        route: '/react/context'        },
      { label: 'Advanced Hooks',     route: '/react/hooks-advanced' },
      { label: 'TanStack Query',     route: '/react/tanstack-query' },
    ],
    tip: 'TanStack Query for server state + Zustand for client state covers 90% of React apps — RTK is rarely needed.',
    docs: [
      { label: 'Zustand Docs',        url: 'https://zustand-demo.pmnd.rs/'         },
      { label: 'Jotai Docs',          url: 'https://jotai.org/docs/introduction'   },
      { label: 'Redux Toolkit Docs',  url: 'https://redux-toolkit.js.org/'         },
      { label: 'React — State Guide', url: 'https://react.dev/learn/managing-state'},
    ],
    resources: [
      { label: 'pmndrs/zustand', url: 'https://github.com/pmndrs/zustand', badge: 'code' },
      { label: 'pmndrs/jotai',   url: 'https://github.com/pmndrs/jotai',   badge: 'code' },
    ],
    gotchas: [
      'Zustand subscriptions are fine-grained — use selector functions to avoid re-renders from unrelated state slices.',
      'Redux DevTools work with Zustand via devtools middleware — add it in development for time-travel debugging.',
    ],
  },

  'react/router': {
    apis: ['createBrowserRouter()', 'loader', 'action', '<Outlet />', 'useFetcher()', 'useNavigate()'],
    related: [
      { label: 'TanStack Query',    route: '/react/tanstack-query' },
      { label: 'Next.js App Router', route: '/react/nextjs'       },
      { label: 'React Forms',       route: '/react/forms'         },
    ],
    tip: 'loader() runs before the component renders — no loading state, no useEffect. Use it for all route-level data fetching.',
    docs: [
      { label: 'React Router v6 Docs',    url: 'https://reactrouter.com/en/main'                        },
      { label: 'loader Reference',        url: 'https://reactrouter.com/en/main/route/loader'           },
      { label: 'action Reference',        url: 'https://reactrouter.com/en/main/route/action'           },
      { label: 'useFetcher Reference',    url: 'https://reactrouter.com/en/main/hooks/use-fetcher'      },
    ],
    resources: [
      { label: 'remix-run/react-router', url: 'https://github.com/remix-run/react-router', badge: 'code' },
    ],
    gotchas: [
      'loader errors bubble to the nearest errorElement — always add one to prevent blank screens.',
      'navigate() in a loader/action is not the same as redirect() — use redirect() from react-router-dom for server-like redirects.',
    ],
  },

  'react/tanstack-query': {
    apis: ['useQuery()', 'useMutation()', 'queryClient.invalidateQueries()', 'useInfiniteQuery()', 'QueryClient'],
    related: [
      { label: 'State Management',   route: '/react/state-management' },
      { label: 'React Router',       route: '/react/router'           },
      { label: 'Core Hooks',         route: '/react/hooks-core'       },
    ],
    tip: 'stale-while-revalidate is on by default — data is shown immediately from cache while a background fetch updates it. Use staleTime to control how long data stays fresh.',
    docs: [
      { label: 'TanStack Query Docs',        url: 'https://tanstack.com/query/latest/docs/framework/react/overview' },
      { label: 'Query Keys Guide',           url: 'https://tanstack.com/query/latest/docs/framework/react/guides/query-keys'      },
      { label: 'Mutations Guide',            url: 'https://tanstack.com/query/latest/docs/framework/react/guides/mutations'       },
      { label: 'Optimistic Updates Guide',   url: 'https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates' },
    ],
    resources: [
      { label: 'TanStack/query', url: 'https://github.com/TanStack/query', badge: 'code' },
      { label: 'TanStack Blog',  url: 'https://tanstack.com/blog',          badge: 'blog' },
    ],
    gotchas: [
      'Query keys are serialised — objects with the same properties in different orders are the same key.',
      'onSuccess/onError callbacks in useMutation run once; use queryClient.invalidateQueries in onSuccess for cache consistency.',
    ],
  },

  'react/performance': {
    apis: ['React.memo()', 'useMemo()', 'useCallback()', 'lazy()', '<Suspense>', 'FixedSizeList', 'useTransition()'],
    related: [
      { label: 'Advanced Hooks',    route: '/react/hooks-advanced' },
      { label: 'React Patterns',    route: '/react/patterns'       },
      { label: 'Testing React',     route: '/react/testing'        },
    ],
    tip: 'Profile in React DevTools first — the "Why did this render?" panel pinpoints the prop or hook that triggered a re-render.',
    docs: [
      { label: 'React.memo Reference',    url: 'https://react.dev/reference/react/memo'                        },
      { label: 'useMemo Reference',       url: 'https://react.dev/reference/react/useMemo'                     },
      { label: 'lazy Reference',          url: 'https://react.dev/reference/react/lazy'                        },
      { label: 'useTransition Reference', url: 'https://react.dev/reference/react/useTransition'               },
    ],
    resources: [
      { label: 'react-window Docs',    url: 'https://react-window.vercel.app/',                         badge: 'docs' },
      { label: 'bvaughn/react-window', url: 'https://github.com/bvaughn/react-window',                  badge: 'code' },
      { label: 'web-vitals Library',   url: 'https://github.com/GoogleChrome/web-vitals',               badge: 'code' },
    ],
    gotchas: [
      'React.memo with unstable prop references (inline objects/functions) never skips re-renders — memoising is pointless without stable refs.',
      'Virtualisation only helps when the list is long enough to fill more than the viewport — short lists need no windowing.',
    ],
  },

  'react/patterns': {
    apis: ['createContext()', 'React.memo()', 'forwardRef()', 'React.Children', 'render prop', 'HOC'],
    related: [
      { label: 'Core Hooks',         route: '/react/hooks-core'     },
      { label: 'React Performance',  route: '/react/performance'    },
      { label: 'Context API',        route: '/react/context'        },
    ],
    tip: 'Custom hooks replaced render props for most cases — only reach for render props when a library needs to inject both behavior and rendering context.',
    docs: [
      { label: 'Reusing Logic with Custom Hooks', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks' },
      { label: 'Passing Data with Context',       url: 'https://react.dev/learn/passing-data-deeply-with-context'},
      { label: 'forwardRef Reference',            url: 'https://react.dev/reference/react/forwardRef'            },
    ],
    resources: [
      { label: 'Radix UI Primitives (headless)',  url: 'https://www.radix-ui.com/',                         badge: 'docs' },
      { label: 'radix-ui/primitives',             url: 'https://github.com/radix-ui/primitives',            badge: 'code' },
    ],
    gotchas: [
      'Compound components via cloneElement only work for direct children — Context-based compound components work at any depth.',
      'HOC display names must be set manually — omitting them makes DevTools show "Unknown" or the wrong name.',
    ],
  },

  'react/typescript': {
    apis: ['React.ReactNode', 'React.FC', 'React.ChangeEvent<T>', 'forwardRef<RefType,Props>', 'ComponentPropsWithoutRef<T>'],
    related: [
      { label: 'React Patterns',     route: '/react/patterns'       },
      { label: 'React Forms',        route: '/react/forms'          },
      { label: 'Testing React',      route: '/react/testing'        },
    ],
    tip: 'Prefer (props: Props) => JSX.Element over React.FC<Props> — no implicit children, better inference, and simpler generic components.',
    docs: [
      { label: 'React TypeScript Cheatsheet', url: 'https://react-typescript-cheatsheet.netlify.app'      },
      { label: 'TypeScript Handbook',         url: 'https://www.typescriptlang.org/docs/handbook/intro.html'},
      { label: 'forwardRef Reference',        url: 'https://react.dev/reference/react/forwardRef'          },
    ],
    resources: [
      { label: '@types/react',        url: 'https://www.npmjs.com/package/@types/react',  badge: 'tool' },
      { label: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript',    badge: 'code' },
    ],
    gotchas: [
      'forwardRef<RefType, PropsType> — RefType comes first. Swapping them silently assigns wrong types.',
      'Generic arrow functions in TSX need a trailing comma <T,> to avoid JSX-tag ambiguity.',
      'ComponentPropsWithoutRef<"button"> is equivalent to React.ButtonHTMLAttributes<HTMLButtonElement> — use either consistently.',
    ],
  },

  'react/testing': {
    apis: ['render()', 'screen.getByRole()', 'userEvent.setup()', 'renderHook()', 'act()', 'setupServer()'],
    related: [
      { label: 'React Forms',        route: '/react/forms'          },
      { label: 'Core Hooks',         route: '/react/hooks-core'     },
      { label: 'TypeScript & React', route: '/react/typescript'     },
    ],
    tip: 'getByRole is the default query — it tests accessible behaviour and doubles as an a11y audit. Only fall back to getByTestId when no role exists.',
    docs: [
      { label: 'RTL Docs',           url: 'https://testing-library.com/docs/react-testing-library/intro/' },
      { label: 'MSW Docs',           url: 'https://mswjs.io/docs/'                                        },
      { label: 'Vitest Docs',        url: 'https://vitest.dev/'                                           },
      { label: 'userEvent Docs',     url: 'https://testing-library.com/docs/user-event/intro'             },
    ],
    resources: [
      { label: 'testing-library/react',   url: 'https://github.com/testing-library/react-testing-library', badge: 'code' },
      { label: 'mswjs/msw',               url: 'https://github.com/mswjs/msw',                              badge: 'code' },
      { label: 'vitest-dev/vitest',        url: 'https://github.com/vitest-dev/vitest',                      badge: 'code' },
    ],
    gotchas: [
      'userEvent methods return Promises — always await them or assertions run on stale DOM.',
      'getBy throws on missing element (good for asserting presence); queryBy returns null (use for absence assertions).',
      'server.resetHandlers() in afterEach prevents per-test MSW overrides from bleeding into subsequent tests.',
    ],
  },

  'react/nextjs': {
    apis: ['"use client"', '"use server"', 'layout.tsx', 'loading.tsx', 'revalidatePath()', 'generateStaticParams()'],
    related: [
      { label: 'TanStack Query',    route: '/react/tanstack-query' },
      { label: 'React Patterns',    route: '/react/patterns'       },
      { label: 'React Performance', route: '/react/performance'    },
    ],
    tip: 'Start every component as a Server Component — only add "use client" when you need interactivity, hooks, or browser APIs.',
    docs: [
      { label: 'Next.js App Router Docs',    url: 'https://nextjs.org/docs/app'                            },
      { label: 'Server Components',          url: 'https://nextjs.org/docs/app/building-your-application/rendering/server-components' },
      { label: 'Server Actions',             url: 'https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations' },
      { label: 'Data Fetching',              url: 'https://nextjs.org/docs/app/building-your-application/data-fetching' },
    ],
    resources: [
      { label: 'vercel/next.js',   url: 'https://github.com/vercel/next.js',       badge: 'code' },
      { label: 'Next.js Blog',     url: 'https://nextjs.org/blog',                  badge: 'blog' },
    ],
    gotchas: [
      '"use client" propagates — all imports from a "use client" file are also client code.',
      'Cannot import a Server Component into a Client Component — pass it as children from a Server parent.',
      'useSearchParams() requires a Suspense boundary wrapper — omitting it causes a build warning.',
    ],
  },

  'react/native': {
    apis: ['<View>', '<Text>', '<FlatList>', 'StyleSheet.create()', 'useNavigation()', 'Platform.OS'],
    related: [
      { label: 'React Patterns',   route: '/react/patterns'    },
      { label: 'TypeScript & React', route: '/react/typescript' },
      { label: 'React Testing',    route: '/react/testing'     },
    ],
    tip: 'flexDirection defaults to "column" in React Native (opposite of CSS). All text must be inside <Text> — raw strings in <View> crash in production builds.',
    docs: [
      { label: 'React Native Docs',      url: 'https://reactnative.dev/docs/getting-started'                },
      { label: 'Expo Documentation',     url: 'https://docs.expo.dev/'                                      },
      { label: 'React Navigation Docs',  url: 'https://reactnavigation.org/docs/getting-started'            },
      { label: 'New Architecture',       url: 'https://reactnative.dev/docs/the-new-architecture/landing-page' },
    ],
    resources: [
      { label: 'facebook/react-native',        url: 'https://github.com/facebook/react-native',  badge: 'code' },
      { label: 'expo/expo',                    url: 'https://github.com/expo/expo',               badge: 'code' },
      { label: 'react-navigation/navigation',  url: 'https://github.com/react-navigation/react-navigation', badge: 'code' },
      { label: 'Expo Snack (playground)',      url: 'https://snack.expo.dev/',                   badge: 'tool' },
    ],
    gotchas: [
      'All text strings must be wrapped in <Text> — placing raw text in <View> crashes production builds.',
      'AsyncStorage is plain text on disk — always use expo-secure-store for tokens and passwords.',
      'FlatList needs keyExtractor returning a stable unique string — index keys cause incorrect reconciliation.',
    ],
  },

  'react/interview-prep': {
    apis: ['useState', 'useEffect', 'useReducer', 'React.memo', 'Suspense', 'Fiber', 'Server Components'],
    related: [
      { label: 'React Cheat Sheet',  route: '/react/cheatsheet'   },
      { label: 'React Patterns',     route: '/react/patterns'     },
      { label: 'React Performance',  route: '/react/performance'  },
    ],
    tip: 'Filter by topic to focus your prep session. For each question, form your own answer first — then expand to compare. Cover all 3 difficulty levels before an interview.',
    docs: [
      { label: 'React Docs',               url: 'https://react.dev/'                             },
      { label: 'React 19 Changelog',       url: 'https://react.dev/blog/2024/04/25/react-19'     },
      { label: 'Reconciliation & Fiber',   url: 'https://react.dev/learn/preserving-and-resetting-state' },
    ],
    resources: [
      { label: 'React Docs — Reference',  url: 'https://react.dev/reference/react',  badge: 'docs' },
    ],
    gotchas: [
      'Interviewers often ask follow-up: "how would you prove it?" — always mention DevTools Profiler.',
      'Virtual DOM ≠ Shadow DOM — they are completely different concepts; be precise.',
      'React.memo skips re-renders but adds a comparison cost — profile before adding it everywhere.',
    ],
  },

  'react/cheatsheet': {
    apis: ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer'],
    related: [
      { label: 'Core Hooks',         route: '/react/hooks-core'     },
      { label: 'Advanced Hooks',     route: '/react/hooks-advanced' },
      { label: 'React Patterns',     route: '/react/patterns'       },
    ],
    tip: 'The cheat sheet is filterable by tab and tag. Use it to quickly cross-reference hooks, event types, or TypeScript patterns while coding.',
    docs: [
      { label: 'React API Reference',       url: 'https://react.dev/reference/react'     },
      { label: 'Hooks Reference',           url: 'https://react.dev/reference/react/hooks' },
      { label: 'React Router v6 API',       url: 'https://reactrouter.com/en/main/route/route' },
    ],
    resources: [
      { label: 'React Docs',         url: 'https://react.dev/',                    badge: 'docs' },
      { label: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/', badge: 'docs' },
    ],
    gotchas: [
      'useCallback and useMemo only help when consumers are memoised with React.memo or also use those hooks.',
      'Empty dep array [] runs once; omitting deps runs after every render.',
      'Number inputs always return strings — use valueAsNumber or coerce manually.',
    ],
  },

  'react/security': {
    apis: ['dangerouslySetInnerHTML', 'DOMPurify.sanitize()', 'SameSite=Strict', 'httpOnly', 'Content-Security-Policy'],
    related: [
      { label: 'Next.js App Router',  route: '/react/nextjs'    },
      { label: 'React Hook Form',     route: '/react/hook-form' },
      { label: 'Testing React',       route: '/react/testing'   },
    ],
    tip: 'React escapes JSX by default — {userInput} is always safe. The three common mistakes: dangerouslySetInnerHTML without DOMPurify, tokens in localStorage, and open redirects from query params.',
    docs: [
      { label: 'React Security Docs',       url: 'https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html' },
      { label: 'OWASP Top 10',              url: 'https://owasp.org/www-project-top-ten/'                                                      },
      { label: 'MDN CSP Guide',             url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP'                                       },
      { label: 'Next.js Security Headers',  url: 'https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy'    },
    ],
    resources: [
      { label: 'cure53/DOMPurify',  url: 'https://github.com/cure53/DOMPurify',  badge: 'code' },
      { label: 'OWASP XSS Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html', badge: 'docs' },
    ],
    gotchas: [
      'dangerouslySetInnerHTML with unsanitized HTML = XSS. Always DOMPurify.sanitize() first.',
      'localStorage tokens are readable by XSS. Use httpOnly; SameSite=Strict cookies instead.',
      'rel="noopener noreferrer" is required on every target="_blank" link to prevent tab-napping.',
    ],
  },

  'react/animations': {
    apis: ['motion.div', 'animate', 'variants', '<AnimatePresence>', 'layout', 'layoutId', 'useMotionValue()'],
    related: [
      { label: 'React Performance',  route: '/react/performance'   },
      { label: 'React Patterns',     route: '/react/patterns'      },
      { label: 'React Native',       route: '/react/native'        },
    ],
    tip: 'Animate transform and opacity — not layout properties (width, height, margin). Transform/opacity run on the GPU compositor at 60fps. Layout properties trigger recalculation on every frame.',
    docs: [
      { label: 'Framer Motion Docs',       url: 'https://www.framer.com/motion/'                           },
      { label: 'Animation Guide',          url: 'https://www.framer.com/motion/animation/'                  },
      { label: 'Gestures',                 url: 'https://www.framer.com/motion/gestures/'                   },
      { label: 'Layout Animations',        url: 'https://www.framer.com/motion/layout-animations/'          },
    ],
    resources: [
      { label: 'framer/motion',             url: 'https://github.com/framer/motion',        badge: 'code' },
      { label: 'Framer Motion Examples',    url: 'https://www.framer.com/motion/examples/',  badge: 'blog' },
    ],
    gotchas: [
      'exit prop requires AnimatePresence parent — without it, components are removed from DOM instantly.',
      'AnimatePresence list children need unique stable keys — not array index.',
      'initial={false} on motion.div or AnimatePresence prevents flash-of-invisible-content in SSR apps.',
    ],
  },

  'react/hook-form': {
    apis: ['useForm()', 'register()', 'handleSubmit()', '<Controller>', 'useFieldArray()', 'zodResolver()'],
    related: [
      { label: 'Forms & Validation',  route: '/react/forms'            },
      { label: 'TypeScript & React',  route: '/react/typescript'       },
      { label: 'Testing React',       route: '/react/testing'          },
    ],
    tip: 'register() uses refs — no re-renders while typing. Only add watch() when you need to display a live computed value. For one-shot reads, use getValues() inside event handlers.',
    docs: [
      { label: 'React Hook Form Docs',  url: 'https://react-hook-form.com/get-started'    },
      { label: 'API Reference',         url: 'https://react-hook-form.com/docs/useform'   },
      { label: 'Zod Documentation',     url: 'https://zod.dev'                             },
      { label: '@hookform/resolvers',   url: 'https://github.com/react-hook-form/resolvers' },
    ],
    resources: [
      { label: 'react-hook-form/react-hook-form', url: 'https://github.com/react-hook-form/react-hook-form', badge: 'code' },
      { label: 'colinhacks/zod',                  url: 'https://github.com/colinhacks/zod',                  badge: 'code' },
    ],
    gotchas: [
      'Add noValidate to <form> — without it, browser native validation fires before RHF and shows unstyled popups.',
      'Number inputs return strings — add { valueAsNumber: true } to register() or use z.coerce.number() in Zod.',
      'In useFieldArray, use field.id as the React key — never the array index.',
    ],
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ASP.NET CORE PAGES
  // ════════════════════════════════════════════════════════════════════════════

  'aspnet/hosting-startup': {
    apis: ['WebApplication.CreateBuilder()', 'IWebHostEnvironment', 'IHostApplicationLifetime', 'ConfigureServices', 'WebApplicationBuilder'],
    related: [
      { label: 'Middleware Pipeline',  route: '/aspnet/middleware' },
      { label: 'Configuration',        route: '/aspnet/configuration' },
      { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
    ],
    tip: 'Use IHostApplicationLifetime for graceful shutdown — the Stopping event lets you drain in-flight requests before the process exits.',
    docs: [
      { label: 'WebApplication & Minimal Hosting', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/webapplication' },
      { label: 'Host and Deploy',                  url: 'https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'All AddX() calls must come before builder.Build() — services registered after Build() are not in the container.',
      'ASPNETCORE_ENVIRONMENT defaults to "Production" when unset — never rely on dev behaviour unless you set it explicitly.',
    ],
  },

  'aspnet/middleware': {
    apis: ['IMiddleware', 'RequestDelegate', 'Use()', 'Run()', 'Map()', 'IApplicationBuilder'],
    related: [
      { label: 'Hosting & Startup', route: '/aspnet/hosting-startup' },
      { label: 'Routing',           route: '/aspnet/routing' },
      { label: 'Error Handling',    route: '/aspnet/error-handling' },
    ],
    tip: 'Prefer middleware classes over inline delegates for anything you reuse — they are DI-friendly and independently testable.',
    docs: [
      { label: 'Middleware Overview',     url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/' },
      { label: 'Write Custom Middleware', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/write' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'Middleware runs in registration order — reversing UseAuthentication and UseAuthorization silently breaks auth.',
      'app.Run() is terminal — no middleware registered after it will ever execute.',
    ],
  },

  'aspnet/routing': {
    apis: ['MapGet()', 'MapControllers()', '[Route]', 'IRouteConstraint', 'LinkGenerator'],
    related: [
      { label: 'Controllers & Actions', route: '/aspnet/controllers' },
      { label: 'Minimal APIs',          route: '/aspnet/minimal-apis' },
      { label: 'Middleware Pipeline',   route: '/aspnet/middleware' },
    ],
    tip: 'Use route constraints (:int, :guid, :alpha, :length) to reject bad values at routing — before model binding runs.',
    docs: [
      { label: 'Routing in ASP.NET Core', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/routing' },
      { label: 'Route Constraints',       url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/routing#route-constraints' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'Conflicting routes throw AmbiguousMatchException at runtime — more specific templates do NOT automatically win.',
      'Route templates are case-insensitive but URL generation preserves the case of supplied route values.',
    ],
  },

  'aspnet/configuration': {
    apis: ['IConfiguration', 'IOptions<T>', 'IOptionsSnapshot<T>', 'IOptionsMonitor<T>', 'ValidateOnStart()'],
    related: [
      { label: 'Hosting & Startup',    route: '/aspnet/hosting-startup' },
      { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
      { label: 'Logging & Diagnostics',route: '/aspnet/logging' },
    ],
    tip: 'Always use typed options over IConfiguration["key"] — you get compile-time safety, validation support, and change notifications.',
    docs: [
      { label: 'Configuration in .NET', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/' },
      { label: 'Options Pattern',        url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/options' },
      { label: 'Safe storage of secrets',url: 'https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',   badge: 'code' },
    ],
    gotchas: [
      'IOptions<T> is a singleton — it does not see config changes after startup. Use IOptionsSnapshot<T> for per-request fresh values.',
      'User secrets are unencrypted on disk — they just stay out of source control. Use Key Vault in production.',
    ],
  },

  'aspnet/dependency-injection': {
    apis: ['AddSingleton()', 'AddScoped()', 'AddTransient()', 'IServiceProvider', 'ActivatorUtilities'],
    related: [
      { label: 'Hosting & Startup',  route: '/aspnet/hosting-startup' },
      { label: 'Middleware Pipeline',route: '/aspnet/middleware' },
      { label: 'Configuration',      route: '/aspnet/configuration' },
    ],
    tip: 'Default to scoped for services that touch EF Core or HTTP — this matches request lifetime and avoids thread-safety bugs.',
    docs: [
      { label: 'DI in ASP.NET Core', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection' },
      { label: 'Service lifetimes',  url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection#service-lifetimes' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',   badge: 'code' },
    ],
    gotchas: [
      'Injecting a Scoped service into a Singleton creates a captive dependency — the scoped service lives as long as the singleton.',
      'IServiceProvider.GetService<T>() returns null for unregistered types — use GetRequiredService<T>() to throw instead.',
    ],
  },

  'aspnet/logging': {
    apis: ['ILogger<T>', 'ILoggerFactory', 'LogLevel', '[LoggerMessage]', 'BeginScope()'],
    related: [
      { label: 'Hosting & Startup', route: '/aspnet/hosting-startup' },
      { label: 'Configuration',     route: '/aspnet/configuration' },
      { label: 'Error Handling',    route: '/aspnet/error-handling' },
    ],
    tip: 'Use the [LoggerMessage] source generator or LoggerMessage.Define() for high-frequency log calls — avoids boxing and string allocations.',
    docs: [
      { label: 'Logging in .NET',          url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/logging/' },
      { label: 'High-performance logging', url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/high-performance-logging' },
    ],
    resources: [
      { label: 'Serilog',           url: 'https://serilog.net',                      badge: 'tool' },
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore',    badge: 'code' },
    ],
    gotchas: [
      'String interpolation in log messages defeats structured logging — use message templates: Log.Information("User {Id}", userId).',
      'The console provider is synchronous by default — in high-throughput scenarios it can become a bottleneck.',
    ],
  },

  'aspnet/static-files': {
    apis: ['UseStaticFiles()', 'StaticFileOptions', 'IFormFile', 'IWebHostEnvironment', 'FileStreamResult'],
    related: [
      { label: 'Middleware Pipeline',  route: '/aspnet/middleware' },
      { label: 'Routing',             route: '/aspnet/routing' },
      { label: 'Controllers & Actions',route: '/aspnet/controllers' },
    ],
    tip: 'Stream large file uploads via Request.Body directly — IFormFile buffers to disk/memory and is unsuitable for files over ~50 MB.',
    docs: [
      { label: 'Static Files',  url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/static-files' },
      { label: 'Upload files',  url: 'https://learn.microsoft.com/en-us/aspnet/core/mvc/models/file-uploads' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'UseStaticFiles() must be called before UseRouting() — otherwise the router claims the path first.',
      'IFormFile.FileName is untrusted user input — never use it as a filesystem path without sanitization.',
    ],
  },

  'aspnet/controllers': {
    apis: ['ControllerBase', '[ApiController]', 'ActionResult<T>', 'IActionResult', '[Route]', 'Problem()'],
    related: [
      { label: 'Minimal APIs',             route: '/aspnet/minimal-apis' },
      { label: 'Model Binding & Validation',route: '/aspnet/model-binding' },
      { label: 'Filters & Endpoint Filters',route: '/aspnet/filters' },
    ],
    tip: 'Prefer ActionResult<T> over IActionResult — the compiler and OpenAPI generators infer the response shape without [ProducesResponseType] attributes.',
    docs: [
      { label: 'Controller actions',           url: 'https://learn.microsoft.com/en-us/aspnet/core/mvc/controllers/actions' },
      { label: 'Routing to controller actions',url: 'https://learn.microsoft.com/en-us/aspnet/core/mvc/controllers/routing' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',   badge: 'code' },
    ],
    gotchas: [
      '[ApiController] changes binding defaults (complex types from body) — remove it if you need explicit [FromQuery] on complex parameters.',
      'Ok(null) returns 200 with a null body, not 204 — use NoContent() explicitly for empty success responses.',
    ],
  },

  'aspnet/minimal-apis': {
    apis: ['app.MapGet()', 'TypedResults', 'Results<T1,T2>', 'IEndpointFilter', 'RouteGroupBuilder'],
    related: [
      { label: 'Controllers & Actions',     route: '/aspnet/controllers' },
      { label: 'Model Binding & Validation',route: '/aspnet/model-binding' },
      { label: 'Filters & Endpoint Filters',route: '/aspnet/filters' },
    ],
    tip: 'Use TypedResults over Results — the compiler enforces all code paths return a declared type, and OpenAPI generators see the response schema.',
    docs: [
      { label: 'Minimal APIs overview',       url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/overview' },
      { label: 'Minimal APIs quick reference',url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',   badge: 'code' },
    ],
    gotchas: [
      'DataAnnotations on DTOs are NOT validated automatically — add an IEndpointFilter or use .NET 9 AddValidation().',
      'Lambda handlers prevent Native AOT — use static method groups or named delegates for AOT-compatible apps.',
    ],
  },

  'aspnet/model-binding': {
    apis: ['[FromBody]', '[FromQuery]', '[FromRoute]', '[FromHeader]', '[AsParameters]', 'IParsable<T>'],
    related: [
      { label: 'Controllers & Actions',      route: '/aspnet/controllers' },
      { label: 'Minimal APIs',               route: '/aspnet/minimal-apis' },
      { label: 'Filters & Endpoint Filters', route: '/aspnet/filters' },
    ],
    tip: 'Implement IParsable<T> on custom value types for automatic query/route binding in .NET 7+ — no custom IModelBinder needed.',
    docs: [
      { label: 'Model Binding',  url: 'https://learn.microsoft.com/en-us/aspnet/core/mvc/models/model-binding' },
      { label: 'Model Validation',url: 'https://learn.microsoft.com/en-us/aspnet/core/mvc/models/validation' },
      { label: 'FluentValidation',url: 'https://docs.fluentvalidation.net/en/latest/aspnet.html' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore',  url: 'https://github.com/dotnet/aspnetcore',             badge: 'code' },
      { label: 'FluentValidation',   url: 'https://github.com/FluentValidation/FluentValidation', badge: 'code' },
    ],
    gotchas: [
      'The request body is a non-seekable stream — only one [FromBody] parameter per action is allowed.',
      '[ApiController] auto-400 runs before your action — override via ApiBehaviorOptions.InvalidModelStateResponseFactory.',
    ],
  },

  'aspnet/filters': {
    apis: ['IActionFilter', 'IAsyncActionFilter', 'IExceptionFilter', 'IEndpointFilter', 'ServiceFilterAttribute'],
    related: [
      { label: 'Controllers & Actions', route: '/aspnet/controllers' },
      { label: 'Minimal APIs',          route: '/aspnet/minimal-apis' },
      { label: 'Error Handling',        route: '/aspnet/error-handling' },
    ],
    tip: 'Use IExceptionHandler middleware (.NET 8+) for app-wide exception mapping. Reserve exception filters for controller-specific handling.',
    docs: [
      { label: 'Filters in ASP.NET Core', url: 'https://learn.microsoft.com/en-us/aspnet/core/mvc/controllers/filters' },
      { label: 'Endpoint filters',        url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/min-api-filters' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',   badge: 'code' },
    ],
    gotchas: [
      'Exception filters only catch exceptions from actions and MVC filters — NOT from middleware. Use UseExceptionHandler() for full coverage.',
      '[ServiceFilter] filters must be registered in DI — forgetting causes InvalidOperationException at runtime.',
    ],
  },

  'aspnet/error-handling': {
    apis: ['UseExceptionHandler()', 'IExceptionHandler', 'ProblemDetails', 'AddProblemDetails()', 'IProblemDetailsService'],
    related: [
      { label: 'Middleware Pipeline',  route: '/aspnet/middleware' },
      { label: 'Filters & Endpoint Filters', route: '/aspnet/filters' },
      { label: 'Logging & Diagnostics',route: '/aspnet/logging' },
    ],
    tip: 'Call AddProblemDetails() before builder.Build() — this makes UseExceptionHandler() automatically format all 500s as RFC 9457 JSON.',
    docs: [
      { label: 'Error handling',    url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling' },
      { label: 'Problem details',   url: 'https://learn.microsoft.com/en-us/aspnet/core/web-api/handle-errors#problem-details-service' },
      { label: 'RFC 9457',          url: 'https://www.rfc-editor.org/rfc/rfc9457' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',   badge: 'code' },
    ],
    gotchas: [
      'UseExceptionHandler() must be the FIRST middleware — exceptions from any later middleware are caught. Register it before UseHttpsRedirection.',
      'UseDeveloperExceptionPage() exposes the full stack trace — never use it in production. Guard strictly with IsDevelopment().',
    ],
  },

  'aspnet/openapi-swagger': {
    apis: ['AddOpenApi()', 'MapOpenApi()', '.WithSummary()', '.WithDescription()', 'TypedResults', 'IOpenApiOperationTransformer'],
    related: [
      { label: 'Controllers & Actions', route: '/aspnet/controllers' },
      { label: 'Minimal APIs',          route: '/aspnet/minimal-apis' },
      { label: 'API Versioning',        route: '/aspnet/api-versioning' },
    ],
    tip: 'Use TypedResults (not IResult) in minimal APIs — the built-in OpenAPI generator reads the return type at build time to populate response schemas automatically.',
    docs: [
      { label: 'OpenAPI in ASP.NET Core (.NET 9)', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/overview' },
      { label: 'Swashbuckle getting started',      url: 'https://github.com/domaindrivendev/Swashbuckle.AspNetCore' },
      { label: 'NSwag documentation',             url: 'https://github.com/RicoSuter/NSwag' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore',  url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'scalar/scalar',      url: 'https://github.com/scalar/scalar',     badge: 'code' },
    ],
    gotchas: [
      'Built-in AddOpenApi() (≥ .NET 9) and Swashbuckle are separate packages — do not install both unless intentional; they generate competing /openapi/*.json endpoints.',
      'Controller XML doc comments require <GenerateDocumentationFile>true</GenerateDocumentationFile> in the .csproj and IncludeXmlComments() in the Swashbuckle config.',
    ],
  },

  'aspnet/api-versioning': {
    apis: ['AddApiVersioning()', '[ApiVersion]', '[MapToApiVersion]', '[Deprecated]', 'ApiVersioningOptions', 'ReportApiVersions'],
    related: [
      { label: 'Controllers & Actions', route: '/aspnet/controllers' },
      { label: 'Minimal APIs',          route: '/aspnet/minimal-apis' },
      { label: 'OpenAPI & Swagger',     route: '/aspnet/openapi-swagger' },
    ],
    tip: 'URL-segment versioning (/v1/products) is the most discoverable strategy — clients can see the version in logs, network traces, and browser URLs without reading docs.',
    docs: [
      { label: 'Asp.Versioning NuGet',         url: 'https://www.nuget.org/packages/Asp.Versioning.Mvc' },
      { label: 'API versioning wiki',          url: 'https://github.com/dotnet/aspnet-api-versioning/wiki' },
      { label: 'Versioning with minimal APIs', url: 'https://github.com/dotnet/aspnet-api-versioning/wiki/Minimal-APIs' },
    ],
    resources: [
      { label: 'dotnet/aspnet-api-versioning', url: 'https://github.com/dotnet/aspnet-api-versioning', badge: 'code' },
      { label: 'dotnet/aspnetcore',            url: 'https://github.com/dotnet/aspnetcore',            badge: 'code' },
    ],
    gotchas: [
      'Mark old versions [Deprecated] for at least one release cycle before removal — clients need time to migrate. Deprecated versions still respond; sunset date goes in headers.',
      'Route prefix (/v{version:apiVersion}/) must match all versioned groups exactly — a mismatch returns 404, not a 400 Bad ApiVersion.',
    ],
  },

  'aspnet/http-clients': {
    apis: ['IHttpClientFactory', 'AddHttpClient<T>()', 'AddStandardResilienceHandler()', 'DelegatingHandler', 'ResiliencePipeline', 'HttpClientHandler'],
    related: [
      { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
      { label: 'gRPC Services',        route: '/aspnet/grpc' },
      { label: 'Configuration',        route: '/aspnet/configuration' },
    ],
    tip: 'Pair each typed client with exactly one downstream API — the client class owns base address, headers, serialization, and error handling so callers see a clean domain method.',
    docs: [
      { label: 'IHttpClientFactory in .NET',      url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/httpclient-factory' },
      { label: 'Resilience in .NET',              url: 'https://learn.microsoft.com/en-us/dotnet/core/resilience/' },
      { label: 'Make HTTP requests with HttpClient', url: 'https://learn.microsoft.com/en-us/dotnet/fundamentals/networking/http/httpclient' },
    ],
    resources: [
      { label: 'dotnet/extensions',  url: 'https://github.com/dotnet/extensions', badge: 'code' },
      { label: 'App-vNext/Polly',    url: 'https://github.com/App-vNext/Polly',   badge: 'code' },
    ],
    gotchas: [
      'Never inject a typed client (Transient) into a Singleton service — the handler pool is fine, but any per-request state on the typed client will be shared. Use IServiceScopeFactory for background services.',
      'HttpClient.BaseAddress must end with "/" — relative paths without a trailing slash on the base are silently dropped, resulting in 404s.',
    ],
  },

  'aspnet/grpc': {
    apis: ['MapGrpcService<T>()', 'ServerCallContext', 'IServerStreamWriter<T>', 'IAsyncStreamReader<T>', 'RpcException', 'GrpcChannel'],
    related: [
      { label: 'HttpClient & Resilience', route: '/aspnet/http-clients' },
      { label: 'Dependency Injection',    route: '/aspnet/dependency-injection' },
      { label: 'Error Handling',          route: '/aspnet/error-handling' },
    ],
    tip: 'Always pass ServerCallContext.CancellationToken to every async call — gRPC cancels the token when the client deadline expires or disconnects, so unchecked tokens waste server resources.',
    docs: [
      { label: 'gRPC for .NET overview', url: 'https://learn.microsoft.com/en-us/aspnet/core/grpc/' },
      { label: 'gRPC services with C#',  url: 'https://learn.microsoft.com/en-us/aspnet/core/grpc/basics' },
      { label: 'gRPC-Web in ASP.NET',   url: 'https://learn.microsoft.com/en-us/aspnet/core/grpc/grpcweb' },
    ],
    resources: [
      { label: 'grpc/grpc-dotnet', url: 'https://github.com/grpc/grpc-dotnet', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop',  badge: 'code' },
    ],
    gotchas: [
      'Never reuse or change Protobuf field numbers — they are the binary wire identity. Removed fields must be marked reserved to prevent accidental reuse in future schema versions.',
      'gRPC requires HTTP/2. If hosting behind a reverse proxy (nginx, IIS), ensure HTTP/2 pass-through is configured — HTTP/1.1 proxies silently break the connection.',
    ],
  },

  'aspnet/ef-core-basics': {
    apis: ['DbContext', 'DbSet<T>', 'SaveChangesAsync()', 'FindAsync()', 'AsNoTracking()', 'OnModelCreating()'],
    related: [
      { label: 'EF Relationships',  route: '/aspnet/ef-relationships' },
      { label: 'EF Performance',    route: '/aspnet/ef-performance' },
      { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
    ],
    tip: 'Always call async EF Core methods (ToListAsync, SaveChangesAsync) and pass the CancellationToken — this lets ASP.NET Core cancel the DB query when the client disconnects.',
    docs: [
      { label: 'EF Core overview',       url: 'https://learn.microsoft.com/en-us/ef/core/' },
      { label: 'Getting started',        url: 'https://learn.microsoft.com/en-us/ef/core/get-started/overview/first-app' },
      { label: 'Migrations overview',    url: 'https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/' },
    ],
    resources: [
      { label: 'dotnet/efcore', url: 'https://github.com/dotnet/efcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop', badge: 'code' },
    ],
    gotchas: [
      'Never register DbContext as Singleton — it is not thread-safe and tracks entity state per instance. Use Scoped (default) or AddDbContextPool for high throughput.',
      'Running Database.MigrateAsync() at startup can cause table locks on large tables in production. Use dotnet ef migrations script --idempotent and run migrations out-of-band.',
    ],
  },

  'aspnet/ef-relationships': {
    apis: ['HasMany()', 'HasOne()', 'WithMany()', 'WithOne()', 'Include()', 'ThenInclude()', 'OwnsOne()', 'OnDelete()'],
    related: [
      { label: 'EF Core Basics',    route: '/aspnet/ef-core-basics' },
      { label: 'EF Performance',    route: '/aspnet/ef-performance' },
    ],
    tip: 'Always initialize collection navigations to an empty list: public List<T> Items { get; set; } = []. Un-initialized collections throw NullReferenceException when accessed before Include() loads them.',
    docs: [
      { label: 'Relationships',          url: 'https://learn.microsoft.com/en-us/ef/core/modeling/relationships' },
      { label: 'Loading related data',   url: 'https://learn.microsoft.com/en-us/ef/core/querying/related-data/' },
      { label: 'Owned entity types',     url: 'https://learn.microsoft.com/en-us/ef/core/modeling/owned-entities' },
    ],
    resources: [
      { label: 'dotnet/efcore', url: 'https://github.com/dotnet/efcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop', badge: 'code' },
    ],
    gotchas: [
      'context.Update(entity) marks ALL properties Modified — it overwrites every column including ones you did not change. Load-then-mutate is safer for partial updates.',
      'Cascade delete is the default for required relationships — deleting a parent silently deletes all children. Set OnDelete(DeleteBehavior.Restrict) explicitly for important data.',
    ],
  },

  'aspnet/ef-performance': {
    apis: ['AsNoTracking()', 'AsSplitQuery()', 'EF.CompileQuery()', 'ExecuteDeleteAsync()', 'ExecuteUpdateAsync()', 'FromSqlRaw()'],
    related: [
      { label: 'EF Core Basics',    route: '/aspnet/ef-core-basics' },
      { label: 'EF Relationships',  route: '/aspnet/ef-relationships' },
      { label: 'Caching',           route: '/aspnet/caching' },
    ],
    tip: 'Use Select() to project only the columns you need — EF Core generates SELECT col1, col2 instead of SELECT *. This reduces network I/O, memory, and deserialization cost in one change.',
    docs: [
      { label: 'Performance overview',   url: 'https://learn.microsoft.com/en-us/ef/core/performance/' },
      { label: 'Bulk operations',        url: 'https://learn.microsoft.com/en-us/ef/core/saving/execute-insert-update-delete' },
      { label: 'Compiled queries',       url: 'https://learn.microsoft.com/en-us/ef/core/performance/advanced-performance-topics#compiled-queries' },
    ],
    resources: [
      { label: 'dotnet/efcore', url: 'https://github.com/dotnet/efcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop', badge: 'code' },
    ],
    gotchas: [
      'ExecuteDeleteAsync/ExecuteUpdateAsync bypass the change tracker — entity events, interceptors, and audit hooks tied to SaveChanges do NOT fire. Handle side-effects manually.',
      'FromSqlRaw() with user input without parameterisation is a SQL injection vulnerability. Always use FromSqlInterpolated() or explicit SqlParameter objects.',
    ],
  },

  'aspnet/caching': {
    apis: ['IMemoryCache', 'GetOrCreateAsync()', 'IDistributedCache', 'AddOutputCache()', 'IOutputCacheStore', 'EvictByTagAsync()'],
    related: [
      { label: 'EF Performance',        route: '/aspnet/ef-performance' },
      { label: 'Configuration & Options', route: '/aspnet/configuration' },
      { label: 'Dependency Injection',  route: '/aspnet/dependency-injection' },
    ],
    tip: 'Use GetOrCreateAsync() rather than a get-then-set pattern — it prevents cache stampede by serializing factory execution for the same key under concurrent cache misses.',
    docs: [
      { label: 'Caching in .NET',             url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/caching/overview' },
      { label: 'Output caching middleware',    url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/caching/output' },
      { label: 'Distributed caching',         url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/caching/distributed' },
    ],
    resources: [
      { label: 'StackExchange.Redis', url: 'https://github.com/StackExchange/StackExchange.Redis', badge: 'code' },
      { label: 'dotnet/aspnetcore',   url: 'https://github.com/dotnet/aspnetcore',                 badge: 'code' },
    ],
    gotchas: [
      'IMemoryCache is per-process — in a multi-server deployment each pod has its own cache, so a write on server A is invisible to server B until TTL expires. Use IDistributedCache (Redis) for shared state.',
      'Never cache user-specific data without including the user ID in the cache key — omitting it means one user sees another user\'s data.',
    ],
  },

  // ── ASP.NET Security ────────────────────────────────────────────────────────
  'aspnet/authentication': {
    apis: ['AddAuthentication()', 'AddJwtBearer()', 'AddCookie()', 'UseAuthentication()', 'UseAuthorization()', 'ClaimsPrincipal', 'AddIdentity<T>()', 'AddOpenIdConnect()'],
    related: [
      { label: 'Authorization',         route: '/aspnet/authorization' },
      { label: 'Secrets & Data Prot.',  route: '/aspnet/secrets' },
      { label: 'Web Security',          route: '/aspnet/web-security' },
    ],
    tip: 'Always call UseAuthentication() before UseAuthorization() in middleware order — swapping them means authorization runs without a populated HttpContext.User.',
    docs: [
      { label: 'Authentication overview', url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authentication/' },
      { label: 'JWT bearer auth',         url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authentication/jwt-authn' },
      { label: 'ASP.NET Core Identity',   url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'eShop reference app', url: 'https://github.com/dotnet/eShop', badge: 'code' },
    ],
    gotchas: [
      'JWT tokens cannot be revoked before expiry unless you maintain a token blocklist. Keep access token lifetimes short (5–15 min) and use refresh tokens for long sessions.',
      'Cookie auth SameSite=Strict blocks the cookie on cross-origin navigations including OAuth redirects. Use SameSite=Lax for OIDC callback flows.',
    ],
  },

  'aspnet/authorization': {
    apis: ['[Authorize]', '[AllowAnonymous]', 'AddAuthorization()', 'RequireAuthenticatedUser()', 'RequireRole()', 'RequireClaim()', 'IAuthorizationRequirement', 'IAuthorizationService'],
    related: [
      { label: 'Authentication',    route: '/aspnet/authentication' },
      { label: 'Web Security',      route: '/aspnet/web-security' },
      { label: 'Secrets & Data Prot.', route: '/aspnet/secrets' },
    ],
    tip: 'Prefer policy-based authorization over role checks — policies are testable, composable, and decouple claim names from business rules.',
    docs: [
      { label: 'Authorization overview',     url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authorization/introduction' },
      { label: 'Policy-based authorization', url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies' },
      { label: 'Resource-based auth',        url: 'https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resourcebased' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'IAuthorizationHandler is registered as a service — inject your handler in AddScoped/AddTransient, not AddSingleton, if it needs per-request state.',
      'FallbackPolicy applies to ALL endpoints. If you have public health-check endpoints, mark them with [AllowAnonymous] or MapHealthChecks().AllowAnonymous() explicitly.',
    ],
  },

  'aspnet/cors': {
    apis: ['AddCors()', 'UseCors()', 'WithOrigins()', 'AllowAnyOrigin()', 'AllowCredentials()', 'UseHsts()', 'UseHttpsRedirection()', 'RequireCors()'],
    related: [
      { label: 'Authentication',       route: '/aspnet/authentication' },
      { label: 'Web Security',         route: '/aspnet/web-security' },
      { label: 'Middleware',           route: '/aspnet/middleware' },
    ],
    tip: 'AllowAnyOrigin() and AllowCredentials() cannot be combined — the browser blocks credentialed cross-origin requests to wildcard origins. Use WithOrigins() with specific domains.',
    docs: [
      { label: 'Enable CORS in ASP.NET', url: 'https://learn.microsoft.com/en-us/aspnet/core/security/cors' },
      { label: 'HTTPS & HSTS',           url: 'https://learn.microsoft.com/en-us/aspnet/core/security/enforcing-ssl' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'CORS is a browser security feature — server-to-server calls are not restricted by CORS. A malicious server can still call your API without a browser.',
      'UseCors() must come after UseRouting() but before UseAuthentication() and UseAuthorization() to apply correctly.',
    ],
  },

  'aspnet/rate-limiting': {
    apis: ['AddRateLimiter()', 'UseRateLimiter()', 'AddFixedWindowLimiter()', 'AddSlidingWindowLimiter()', 'AddTokenBucketLimiter()', 'AddConcurrencyLimiter()', 'RequireRateLimiting()', 'OnRejected'],
    related: [
      { label: 'Authentication',    route: '/aspnet/authentication' },
      { label: 'Web Security',      route: '/aspnet/web-security' },
      { label: 'Middleware',        route: '/aspnet/middleware' },
    ],
    tip: 'Partition limiters by user ID or API key rather than globally — a global limit lets one heavy user exhaust the quota for everyone else.',
    docs: [
      { label: 'Rate limiting middleware', url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit' },
      { label: 'System.Threading.RateLimiting', url: 'https://learn.microsoft.com/en-us/dotnet/api/system.threading.ratelimiting' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'Rate limiting state is in-memory and per-process. In a multi-replica deployment each pod has independent counters — use a distributed store (Redis) for global limits.',
      'OnRejected fires synchronously on the limiter thread. Keep it lightweight — just set StatusCode 429 and write a short response; avoid slow I/O there.',
    ],
  },

  'aspnet/web-security': {
    apis: ['FromSqlInterpolated()', 'HtmlEncoder.Encode()', 'AddAntiforgery()', '[ValidateAntiForgeryToken]', 'IAntiforgery', 'LocalRedirect()', 'Content-Security-Policy', 'Path.GetFullPath()'],
    related: [
      { label: 'Authentication',    route: '/aspnet/authentication' },
      { label: 'Authorization',     route: '/aspnet/authorization' },
      { label: 'CORS & Security Headers', route: '/aspnet/cors' },
    ],
    tip: 'The single highest-value habit: never build SQL strings by concatenation. EF Core parameterises LINQ queries automatically; use FromSqlInterpolated() for raw SQL to keep the same safety guarantee.',
    docs: [
      { label: 'Prevent XSS in ASP.NET',   url: 'https://learn.microsoft.com/en-us/aspnet/core/security/cross-site-scripting' },
      { label: 'Antiforgery in ASP.NET',    url: 'https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery' },
      { label: 'OWASP Top 10',              url: 'https://owasp.org/www-project-top-ten/' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore', url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'Razor pages auto-generate antiforgery tokens. Minimal API endpoints do NOT — call ValidateAntiforgeryToken() explicitly or use the IAntiforgery service middleware.',
      'Path.Combine(root, userInput) does NOT prevent traversal if userInput starts with / or \\ — it just replaces root. Always call Path.GetFullPath and verify the result starts with root.',
    ],
  },

  'aspnet/secrets': {
    apis: ['dotnet user-secrets', 'AddUserSecrets<T>()', 'AddEnvironmentVariables()', 'AddAzureKeyVault()', 'IDataProtector', 'AddDataProtection()', 'PersistKeysToStackExchangeRedis()', 'ProtectCookies()'],
    related: [
      { label: 'Authentication',       route: '/aspnet/authentication' },
      { label: 'Configuration',        route: '/aspnet/configuration' },
      { label: 'Web Security',         route: '/aspnet/web-security' },
    ],
    tip: 'Use `__` (double underscore) as the hierarchy separator in environment variable names — it maps to `:` in configuration keys across all platforms including Linux containers.',
    docs: [
      { label: 'Safe storage of app secrets', url: 'https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets' },
      { label: 'Azure Key Vault provider',     url: 'https://learn.microsoft.com/en-us/aspnet/core/security/key-vault-configuration' },
      { label: 'Data Protection API',          url: 'https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/introduction' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore',   url: 'https://github.com/dotnet/aspnetcore',   badge: 'code' },
      { label: 'Azure/azure-sdk-for-net', url: 'https://github.com/Azure/azure-sdk-for-net', badge: 'code' },
    ],
    gotchas: [
      'Data Protection keys are ephemeral by default — on restart all protected data (cookies, tokens, antiforgery) becomes invalid. Always configure persistent key storage in production.',
      'User secrets are tied to the project by UserSecretsId in the .csproj. Changing that GUID silently breaks secret lookups without any error at startup.',
    ],
  },

  // ── ASP.NET Quality ─────────────────────────────────────────────────────────
  'aspnet/testing': {
    apis: ['WebApplicationFactory<T>', 'CreateClient()', '[Fact]', '[Theory]', 'Substitute.For<T>()', 'ConfigureTestServices()', 'UseInMemoryDatabase()', 'UseSqlite(":memory:")'],
    related: [
      { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
      { label: 'EF Core Basics',       route: '/aspnet/ef-core-basics' },
      { label: 'Authentication',       route: '/aspnet/authentication' },
    ],
    tip: 'Use IClassFixture<WebApplicationFactory<T>> to share the in-memory server across all tests in a class — starting it once per class is much faster than once per test method.',
    docs: [
      { label: 'Integration tests in ASP.NET', url: 'https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests' },
      { label: 'Unit testing in .NET',         url: 'https://learn.microsoft.com/en-us/dotnet/core/testing/' },
    ],
    resources: [
      { label: 'xunit/xunit',        url: 'https://github.com/xunit/xunit',        badge: 'code' },
      { label: 'nsubstitute/NSubstitute', url: 'https://github.com/nsubstitute/NSubstitute', badge: 'code' },
    ],
    gotchas: [
      'SQLite :memory: databases are connection-scoped — close the connection and the data is gone. Keep SqliteConnection open for the test lifetime and pass it to DbContextOptions.',
      'ConfigureTestServices runs AFTER the real DI registrations. Use services.RemoveAll<T>() before re-registering to avoid duplicate registration exceptions.',
    ],
  },

  'aspnet/background-services': {
    apis: ['IHostedService', 'BackgroundService', 'ExecuteAsync()', 'IServiceScopeFactory', 'PeriodicTimer', 'Channel<T>', 'AddHostedService<T>()', 'stoppingToken'],
    related: [
      { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
      { label: 'Caching',              route: '/aspnet/caching' },
      { label: 'SignalR',              route: '/aspnet/signalr' },
    ],
    tip: 'Use PeriodicTimer instead of Task.Delay in a loop — it ticks on schedule without drifting when the work takes variable time, and cleans up without a try/catch on OperationCanceledException.',
    docs: [
      { label: 'Background tasks in ASP.NET', url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services' },
      { label: 'System.Threading.Channels',   url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/channels' },
    ],
    resources: [
      { label: 'dotnet/runtime (Channels)',  url: 'https://github.com/dotnet/runtime', badge: 'code' },
    ],
    gotchas: [
      'Never inject a scoped service (DbContext, your repositories) directly into BackgroundService — it is a singleton. Always create a scope via IServiceScopeFactory.CreateAsyncScope().',
      'If ExecuteAsync throws an unhandled exception, the hosted service stops silently. Wrap the main loop in try/catch and log — or use IHostApplicationLifetime.StopApplication() to bring the whole process down on fatal errors.',
    ],
  },

  'aspnet/signalr': {
    apis: ['AddSignalR()', 'MapHub<T>()', 'Hub', 'IHubContext<T>', 'Clients.All', 'Clients.Caller', 'Groups.AddToGroupAsync()', 'AddStackExchangeRedis()'],
    related: [
      { label: 'Background Services', route: '/aspnet/background-services' },
      { label: 'Authentication',      route: '/aspnet/authentication' },
      { label: 'Rate Limiting',       route: '/aspnet/rate-limiting' },
    ],
    tip: 'Group membership is in-memory per server instance and lost on reconnect. Always have clients re-join their groups in the connection.onreconnected() callback on the client side.',
    docs: [
      { label: 'ASP.NET Core SignalR',     url: 'https://learn.microsoft.com/en-us/aspnet/core/signalr/introduction' },
      { label: 'JavaScript client',        url: 'https://learn.microsoft.com/en-us/aspnet/core/signalr/javascript-client' },
      { label: 'Scale out with Redis',     url: 'https://learn.microsoft.com/en-us/aspnet/core/signalr/redis-backplane' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore',       url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
      { label: 'SignalR samples',         url: 'https://github.com/dotnet/AspNetCore.Docs.Samples', badge: 'code' },
    ],
    gotchas: [
      'Hub instances are transient — created per invocation. Do not store client state in Hub fields. Use an external store (IMemoryCache, Redis, database) for connection-level state.',
      'Hub methods invoked from JavaScript are matched by string name (case-insensitive by default). A rename on the server without updating the client silently breaks the call.',
    ],
  },

  'aspnet/health-checks': {
    apis: ['AddHealthChecks()', 'MapHealthChecks()', 'IHealthCheck', 'HealthCheckResult', 'AddDbContextCheck<T>()', 'AddUrlGroup()', 'UIResponseWriter', 'AddOpenTelemetry()'],
    related: [
      { label: 'Deployment',           route: '/aspnet/deployment' },
      { label: 'Performance',          route: '/aspnet/performance' },
      { label: 'Configuration',        route: '/aspnet/configuration' },
    ],
    tip: 'Split liveness and readiness into separate endpoints. Liveness (/health/live) should never check external dependencies — if your DB is down, liveness should still pass (don\'t let k8s restart your pod over a DB outage).',
    docs: [
      { label: 'Health checks in ASP.NET',  url: 'https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks' },
      { label: 'OpenTelemetry .NET',        url: 'https://learn.microsoft.com/en-us/dotnet/core/diagnostics/observability-with-otel' },
    ],
    resources: [
      { label: 'Xabaril/AspNetCore.Diagnostics.HealthChecks', url: 'https://github.com/Xabaril/AspNetCore.Diagnostics.HealthChecks', badge: 'code' },
      { label: 'open-telemetry/opentelemetry-dotnet',         url: 'https://github.com/open-telemetry/opentelemetry-dotnet',         badge: 'code' },
    ],
    gotchas: [
      'The default HealthCheckOptions.ResponseWriter returns a plain "Healthy"/"Unhealthy" string. Production monitoring tools expect JSON — always provide a custom ResponseWriter or use UIResponseWriter.',
      'Health check evaluation is sequential by default. Slow external checks (URL group, DNS) block the response. Set a per-check timeout via AddUrlGroup(..., timeout: TimeSpan.FromSeconds(3)).',
    ],
  },

  'aspnet/deployment': {
    apis: ['dotnet publish', '--self-contained', 'Dockerfile', 'ForwardedHeaders', 'UseForwardedHeaders()', 'ASPNETCORE_ENVIRONMENT', 'appsettings.{Env}.json', 'PublishAot'],
    related: [
      { label: 'Configuration',    route: '/aspnet/configuration' },
      { label: 'Health Checks',    route: '/aspnet/health-checks' },
      { label: 'Secrets',          route: '/aspnet/secrets' },
    ],
    tip: 'Copy only the *.csproj files before dotnet restore in your Dockerfile — this creates a separate layer for restored packages that is cached unless dependencies change, making rebuilds much faster.',
    docs: [
      { label: 'Host and deploy ASP.NET',   url: 'https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/' },
      { label: 'Docker with .NET',          url: 'https://learn.microsoft.com/en-us/dotnet/core/docker/build-container' },
      { label: 'Native AOT overview',       url: 'https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot/' },
    ],
    resources: [
      { label: 'dotnet/dotnet-docker',  url: 'https://github.com/dotnet/dotnet-docker', badge: 'code' },
      { label: 'eShop reference app',   url: 'https://github.com/dotnet/eShop',         badge: 'code' },
    ],
    gotchas: [
      'UseForwardedHeaders() must come before UseAuthentication(). If reversed, auth redirects use the wrong scheme (http instead of https) and OAuth/OIDC flows break.',
      'Never set KnownNetworks.Clear() + KnownProxies.Clear() without trusting only your internal network. Without restriction, any caller can spoof X-Forwarded-For to impersonate any IP.',
    ],
  },

  'aspnet/performance': {
    apis: ['AddResponseCompression()', 'UseResponseCompression()', 'dotnet-counters', 'dotnet-trace', 'dotnet-dump', '[Benchmark]', 'ObjectPool<T>', 'ArrayPool<T>'],
    related: [
      { label: 'Caching',          route: '/aspnet/caching' },
      { label: 'EF Performance',   route: '/aspnet/ef-performance' },
      { label: 'Health Checks',    route: '/aspnet/health-checks' },
    ],
    tip: 'Run BenchmarkDotNet in Release mode (dotnet run -c Release) — Debug mode disables JIT optimisations that are active in production and makes results meaningless.',
    docs: [
      { label: 'Performance best practices',   url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/performance-best-practices' },
      { label: 'Response compression',         url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/response-compression' },
      { label: '.NET diagnostic tools',        url: 'https://learn.microsoft.com/en-us/dotnet/core/diagnostics/' },
    ],
    resources: [
      { label: 'dotnet/BenchmarkDotNet', url: 'https://github.com/dotnet/BenchmarkDotNet', badge: 'code' },
      { label: 'dotnet/aspnetcore',      url: 'https://github.com/dotnet/aspnetcore',      badge: 'code' },
    ],
    gotchas: [
      'Response compression over HTTPS can be vulnerable to BREACH attacks when responses contain secrets that reflect user-controlled input. EnableForHttps = true is safe for pure API JSON payloads but dangerous for HTML pages with CSRF tokens.',
      'ObjectPool<StringBuilder> calls sb.Clear() on Return — it does NOT reset the capacity. A StringBuilder that grew to 10 MB stays at 10 MB in the pool. Set a maximum capacity check before returning.',
    ],
  },

  'aspnet/aspire': {
    apis: ['AddProject<T>()', 'AddRedis()', 'AddPostgres()', 'WithReference()', 'AddServiceDefaults()', 'WithExternalHttpEndpoints()', 'ServiceDiscovery', 'azd up'],
    related: [
      { label: 'Health Checks',        route: '/aspnet/health-checks' },
      { label: 'Background Services',  route: '/aspnet/background-services' },
      { label: 'Deployment',           route: '/aspnet/deployment' },
    ],
    tip: 'The service name in AddProject("name") is your service discovery key. Use "https+http://name" as the HttpClient base address — Aspire resolves it to the actual port, so you never hardcode port numbers.',
    docs: [
      { label: '.NET Aspire overview',         url: 'https://learn.microsoft.com/en-us/dotnet/aspire/get-started/aspire-overview' },
      { label: 'Service discovery in Aspire',  url: 'https://learn.microsoft.com/en-us/dotnet/aspire/service-discovery/overview' },
      { label: 'Deploy with azd',              url: 'https://learn.microsoft.com/en-us/dotnet/aspire/deployment/azure/aca-deployment' },
    ],
    resources: [
      { label: 'dotnet/aspire',        url: 'https://github.com/dotnet/aspire',        badge: 'code' },
      { label: 'dotnet/aspire-samples', url: 'https://github.com/dotnet/aspire-samples', badge: 'code' },
    ],
    gotchas: [
      'AddServiceDefaults() must be called in each service project — not just the AppHost. Forgetting it in a service means that service has no OTel, health checks, or resilience handlers.',
      'Aspire containers (Redis, Postgres) use random host ports each run. Never hardcode ports in your service config — always rely on service discovery or the injected connection strings.',
    ],
  },

  // ── ASP.NET Core Reference ───────────────────────────────────────────────────
  'aspnet/cheatsheet': {
    apis: ['app.Use()', 'app.MapGet()', 'builder.Services.Add*()', 'AddAuthentication()', 'DbContextOptions', 'IHttpClientFactory'],
    related: [
      { label: 'Middleware Pipeline',  route: '/aspnet/middleware' },
      { label: 'Minimal APIs',         route: '/aspnet/minimal-apis' },
      { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
    ],
    tip: 'Use the search bar to filter entries across all sections at once — great for looking up a specific method or CLI command quickly.',
    docs: [
      { label: 'ASP.NET Core fundamentals',  url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/' },
      { label: 'dotnet CLI reference',       url: 'https://learn.microsoft.com/en-us/dotnet/core/tools/' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore',  url: 'https://github.com/dotnet/aspnetcore', badge: 'code' },
    ],
    gotchas: [
      'The CLI section covers the most common commands — check the official dotnet CLI docs for the full flag reference.',
    ],
  },

  'aspnet/errors': {
    apis: ['IExceptionHandler', 'UseExceptionHandler()', 'ProblemDetails', 'ModelStateDictionary'],
    related: [
      { label: 'Error Handling',  route: '/aspnet/error-handling' },
      { label: 'Middleware',      route: '/aspnet/middleware'      },
      { label: 'Authentication',  route: '/aspnet/authentication'  },
    ],
    tip: 'Most startup errors have a root cause in the console output — check the inner exception before searching Stack Overflow.',
    docs: [
      { label: 'Handle errors in ASP.NET Core',  url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling' },
      { label: 'Troubleshoot ASP.NET Core',      url: 'https://learn.microsoft.com/en-us/aspnet/core/test/troubleshoot' },
    ],
    resources: [],
    gotchas: [
      'Always read the full stack trace — the innermost exception is almost always the real cause, not the outer wrapper.',
    ],
  },

  'aspnet/quiz-practice': {
    apis: ['Middleware', 'DI', 'Routing', 'Auth', 'EF Core', 'Performance', 'SignalR'],
    related: [
      { label: 'Interview Prep',  route: '/aspnet/interview-prep' },
      { label: 'Cheat Sheet',     route: '/aspnet/cheatsheet'     },
      { label: 'Common Errors',   route: '/aspnet/errors'         },
    ],
    tip: 'Re-run the topics you score lowest on — focus beats breadth when preparing for an interview.',
    docs: [
      { label: 'ASP.NET Core docs',  url: 'https://learn.microsoft.com/en-us/aspnet/core/' },
    ],
    resources: [],
    gotchas: [
      'Read the explanation even for questions you got right — the why matters more than the what.',
    ],
  },

  'aspnet/interview-prep': {
    apis: ['IMiddleware', 'IServiceCollection', 'IEndpointRouteBuilder', 'DbContext', 'IAuthorizationHandler'],
    related: [
      { label: 'Quiz Practice',   route: '/aspnet/quiz-practice' },
      { label: 'Design Patterns', route: '/aspnet/design-patterns' },
      { label: 'Cheat Sheet',     route: '/aspnet/cheatsheet' },
    ],
    tip: 'Senior questions probe trade-offs ("when would you NOT use minimal APIs") — practised answers beat memorised definitions.',
    docs: [
      { label: 'ASP.NET Core fundamentals',  url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/' },
      { label: 'Performance best practices', url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/performance-best-practices' },
    ],
    resources: [],
    gotchas: [
      'Interviewers at senior level expect you to name trade-offs, not just features — practise the "it depends" framing.',
    ],
  },

  'aspnet/design-patterns': {
    apis: ['IRepository<T>', 'IMediator', 'IPipelineBehavior', 'ISpecification<T>', 'IResultPattern', 'IOutboxMessage'],
    related: [
      { label: 'Dependency Injection',  route: '/aspnet/dependency-injection' },
      { label: 'EF Core Basics',        route: '/aspnet/ef-core-basics'       },
      { label: 'Testing',               route: '/aspnet/testing'               },
    ],
    tip: 'Start with Repository + Options — they give most of the benefit with minimal complexity. Add CQRS/MediatR only when your command handlers grow past ~5.',
    docs: [
      { label: 'Architecture patterns (.NET)',  url: 'https://learn.microsoft.com/en-us/dotnet/architecture/' },
      { label: 'MediatR docs',                 url: 'https://github.com/jbogard/MediatR/wiki' },
    ],
    resources: [
      { label: 'dotnet/eShop (reference app)',  url: 'https://github.com/dotnet/eShop', badge: 'code' },
    ],
    gotchas: [
      'Patterns add indirection — only adopt one when the problem it solves is actually present in your codebase.',
    ],
  },

  'aspnet/decision-guides': {
    apis: ['MapControllers()', 'MapGet()', 'AddJwtBearer()', 'AddCookie()', 'IMemoryCache', 'IDistributedCache'],
    related: [
      { label: 'Minimal APIs',    route: '/aspnet/minimal-apis'    },
      { label: 'Authentication',  route: '/aspnet/authentication'  },
      { label: 'Caching',         route: '/aspnet/caching'         },
    ],
    tip: 'Use the comparison tables as a starting checklist — the "rule of thumb" row gives the 80% answer; check the detail rows for your edge case.',
    docs: [
      { label: 'Choose between controller-based and minimal APIs',  url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/apis' },
      { label: 'Caching overview',  url: 'https://learn.microsoft.com/en-us/aspnet/core/performance/caching/overview' },
    ],
    resources: [],
    gotchas: [
      'These guides cover the common 80% — always validate the recommendation against your team\'s skills and existing stack.',
    ],
  },

  'aspnet/glossary': {
    apis: ['Middleware', 'Kestrel', 'DI/IoC', 'DbContext', 'IActionResult', 'ClaimsPrincipal'],
    related: [
      { label: 'Cheat Sheet',     route: '/aspnet/cheatsheet'   },
      { label: 'Learning Paths',  route: '/aspnet/learning-paths' },
    ],
    tip: 'Use the letter quick-nav or search — every term that has a matching topic page includes a direct link.',
    docs: [
      { label: 'ASP.NET Core fundamentals glossary',  url: 'https://learn.microsoft.com/en-us/aspnet/core/fundamentals/' },
      { label: '.NET glossary',                       url: 'https://learn.microsoft.com/en-us/dotnet/standard/glossary' },
    ],
    resources: [],
    gotchas: [
      'Terms like "middleware" and "pipeline" have precise ASP.NET Core meanings — don\'t conflate them with general HTTP proxy concepts.',
    ],
  },

  'aspnet/mini-projects': {
    apis: ['MapGet/Post/Put/Delete()', 'AddAuthentication()', 'MapHub<T>()', 'IHostedService', 'Channel<T>'],
    related: [
      { label: 'Minimal APIs',        route: '/aspnet/minimal-apis'        },
      { label: 'Authentication',      route: '/aspnet/authentication'       },
      { label: 'SignalR',             route: '/aspnet/signalr'              },
      { label: 'Background Services', route: '/aspnet/background-services'  },
    ],
    tip: 'Build projects 1 → 2 → 3 in order — each adds a layer on top of the previous, so the progression is natural.',
    docs: [
      { label: 'Tutorial: Create a minimal API',  url: 'https://learn.microsoft.com/en-us/aspnet/core/tutorials/min-web-api' },
      { label: 'Use SignalR with ASP.NET Core',   url: 'https://learn.microsoft.com/en-us/aspnet/core/signalr/introduction' },
    ],
    resources: [
      { label: 'dotnet/aspnetcore samples',  url: 'https://github.com/dotnet/aspnetcore/tree/main/src/Samples', badge: 'code' },
    ],
    gotchas: [
      'These walkthroughs are intentionally minimal — real projects will need validation, logging, and error handling on top.',
    ],
  },

  'aspnet/learning-paths': {
    apis: ['Hosting & Startup', 'Middleware', 'DI', 'EF Core', 'Auth', 'Minimal APIs', 'Deployment'],
    related: [
      { label: 'Quiz Practice',   route: '/aspnet/quiz-practice'  },
      { label: 'Interview Prep',  route: '/aspnet/interview-prep' },
      { label: 'Mini Projects',   route: '/aspnet/mini-projects'  },
    ],
    tip: 'Stick to one path at a time — finishing a track beats sampling all four.',
    docs: [
      { label: 'ASP.NET Core docs',       url: 'https://learn.microsoft.com/en-us/aspnet/core/' },
      { label: '.NET learning resources', url: 'https://dotnet.microsoft.com/en-us/learn'       },
    ],
    resources: [
      { label: 'dotnet/eShop (reference app)',  url: 'https://github.com/dotnet/eShop', badge: 'code' },
    ],
    gotchas: [
      'The Senior/Architect path assumes you\'ve already shipped a few APIs — don\'t skip the Backend Developer path unless you have solid fundamentals.',
    ],
  },

  // ── SQL ─────────────────────────────────────────────────────────────────────
  'sql/rdbms-concepts': {
    apis: ['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'NOT NULL', 'CHECK', 'REFERENCES', 'ON DELETE CASCADE'],
    related: [{ label: 'Data Modeling', route: '/sql/data-modeling' }, { label: 'Normalization', route: '/sql/normalization' }, { label: 'SQL Basics', route: '/sql/basics' }],
    tip: 'Every table should have a surrogate primary key (IDENTITY / SERIAL). Natural keys are fragile — emails and phone numbers change.',
    docs: [{ label: 'T-SQL Constraints', url: 'https://learn.microsoft.com/en-us/sql/relational-databases/tables/unique-constraints-and-check-constraints' }, { label: 'PostgreSQL Constraints', url: 'https://www.postgresql.org/docs/current/ddl-constraints.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Circular FK references require deferrable constraints in PostgreSQL or careful insert ordering in MSSQL.', 'ON DELETE CASCADE can silently wipe child rows — prefer explicit deletes in application code for critical data.'],
  },
  'sql/data-modeling': {
    apis: ['CREATE TABLE', 'FOREIGN KEY', 'REFERENCES', 'JOIN TABLE', 'ER Diagram'],
    related: [{ label: 'RDBMS Concepts', route: '/sql/rdbms-concepts' }, { label: 'Normalization', route: '/sql/normalization' }, { label: 'Schema Design', route: '/sql/schema-design' }],
    tip: 'Model for queries first. A perfectly normalised schema that requires 8 joins for every read is often the wrong design.',
    docs: [{ label: 'PostgreSQL DDL', url: 'https://www.postgresql.org/docs/current/ddl.html' }, { label: 'T-SQL DDL', url: 'https://learn.microsoft.com/en-us/sql/t-sql/statements/create-table-transact-sql' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['A Many-to-Many relationship always needs a junction table — you cannot store it in two columns.', 'Avoid storing comma-separated values in a single column — that breaks 1NF and makes queries painful.'],
  },
  'sql/normalization': {
    apis: ['1NF', '2NF', '3NF', 'BCNF', 'Functional Dependency', 'Partial Dependency', 'Transitive Dependency'],
    related: [{ label: 'Data Modeling', route: '/sql/data-modeling' }, { label: 'RDBMS Concepts', route: '/sql/rdbms-concepts' }, { label: 'Schema Design', route: '/sql/schema-design' }],
    tip: 'Normalise to 3NF by default, then denormalise only where profiling shows a measurable performance gain.',
    docs: [{ label: 'PostgreSQL DDL Best Practices', url: 'https://www.postgresql.org/docs/current/ddl.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['2NF only matters for composite primary keys — a single-column PK table is automatically in 2NF.', 'Denormalisation with triggers adds write overhead and complexity — document it and own it.'],
  },
  'sql/db-architecture': {
    apis: ['Buffer Pool', 'WAL / Transaction Log', 'MVCC', 'VACUUM', 'ANALYZE', 'sys.dm_os_buffer_descriptors', 'pg_stat_bgwriter'],
    related: [{ label: 'Transactions', route: '/sql/transactions' }, { label: 'Indexes', route: '/sql/indexes' }, { label: 'Performance', route: '/sql/performance' }],
    tip: 'PostgreSQL MVCC never blocks readers with writers. MSSQL achieves the same with RCSI — enable it for OLTP databases.',
    docs: [{ label: 'MSSQL Buffer Pool', url: 'https://learn.microsoft.com/en-us/sql/relational-databases/memory-management-architecture-guide' }, { label: 'PostgreSQL MVCC', url: 'https://www.postgresql.org/docs/current/mvcc.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['PostgreSQL VACUUM does not reclaim disk space to the OS — use VACUUM FULL for that (takes an exclusive lock).', 'Stale statistics cause the planner to choose bad plans — run ANALYZE after large bulk loads.'],
  },
  'sql/data-types': {
    apis: ['INT', 'BIGINT', 'DECIMAL', 'VARCHAR', 'NVARCHAR', 'DATETIME2', 'TIMESTAMPTZ', 'UUID', 'BOOLEAN', 'CAST', 'CONVERT', 'TRY_CAST'],
    related: [{ label: 'SQL Basics', route: '/sql/basics' }, { label: 'RDBMS Concepts', route: '/sql/rdbms-concepts' }, { label: 'Schema Design', route: '/sql/schema-design' }],
    tip: 'Always store timestamps as UTC. Use DATETIME2 (MSSQL) or TIMESTAMPTZ (PostgreSQL) — never DATETIME or TIMESTAMP WITHOUT TIME ZONE.',
    docs: [{ label: 'T-SQL Data Types', url: 'https://learn.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql' }, { label: 'PostgreSQL Data Types', url: 'https://www.postgresql.org/docs/current/datatype.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Never use FLOAT for money — floating-point rounding causes penny errors. Use DECIMAL(19,4).', 'MSSQL VARCHAR is single-byte; use NVARCHAR for Unicode. PostgreSQL VARCHAR is always UTF-8 — the N prefix makes no difference.'],
  },
  'sql/basics': {
    apis: ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'DISTINCT', 'LIMIT / TOP', 'IS NULL', 'LIKE', 'BETWEEN', 'IN'],
    related: [{ label: 'Joins', route: '/sql/joins' }, { label: 'Aggregations', route: '/sql/aggregations' }, { label: 'Subqueries', route: '/sql/subqueries' }],
    tip: 'NULL comparisons always use IS NULL / IS NOT NULL — never = NULL. Any comparison with NULL returns UNKNOWN, not FALSE.',
    docs: [{ label: 'T-SQL SELECT', url: 'https://learn.microsoft.com/en-us/sql/t-sql/queries/select-transact-sql' }, { label: 'PostgreSQL SELECT', url: 'https://www.postgresql.org/docs/current/sql-select.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['SELECT * in production kills index coverage — always name your columns.', 'LIMIT without ORDER BY returns non-deterministic rows — always pair them.'],
  },
  'sql/joins': {
    apis: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN', 'ON', 'USING', 'self-join'],
    related: [{ label: 'SQL Basics', route: '/sql/basics' }, { label: 'Subqueries', route: '/sql/subqueries' }, { label: 'Aggregations', route: '/sql/aggregations' }],
    tip: 'LEFT JOIN is right 80% of the time — use INNER JOIN only when you are certain every row has a match on both sides.',
    docs: [{ label: 'T-SQL JOIN', url: 'https://learn.microsoft.com/en-us/sql/t-sql/queries/from-transact-sql' }, { label: 'PostgreSQL JOIN', url: 'https://www.postgresql.org/docs/current/queries-table-expressions.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Joining on nullable columns: NULL != NULL so rows where the key is NULL are always excluded from INNER JOIN.', 'CROSS JOIN on large tables is O(n×m) — easy to accidentally produce millions of rows.'],
  },
  'sql/aggregations': {
    apis: ['GROUP BY', 'HAVING', 'COUNT()', 'SUM()', 'AVG()', 'MIN()', 'MAX()', 'COUNT(*)', 'ROLLUP', 'GROUPING SETS'],
    related: [{ label: 'SQL Basics', route: '/sql/basics' }, { label: 'Window Functions', route: '/sql/window-functions' }, { label: 'CTEs', route: '/sql/ctes' }],
    tip: 'Every column in SELECT that is not inside an aggregate function must appear in GROUP BY — this is the fundamental rule of aggregation.',
    docs: [{ label: 'T-SQL GROUP BY', url: 'https://learn.microsoft.com/en-us/sql/t-sql/queries/select-group-by-transact-sql' }, { label: 'PostgreSQL Aggregates', url: 'https://www.postgresql.org/docs/current/functions-aggregate.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['HAVING filters after aggregation; WHERE filters before — you cannot use aggregate aliases in WHERE.', 'COUNT(*) counts rows including NULLs; COUNT(column) counts non-NULL values only.'],
  },
  'sql/subqueries': {
    apis: ['IN (subquery)', 'EXISTS', 'NOT EXISTS', 'ANY / ALL', 'scalar subquery', 'derived table', 'correlated subquery'],
    related: [{ label: 'CTEs', route: '/sql/ctes' }, { label: 'Joins', route: '/sql/joins' }, { label: 'Window Functions', route: '/sql/window-functions' }],
    tip: 'Prefer EXISTS over IN for subqueries against large tables — EXISTS short-circuits on first match; IN materialises the full result set.',
    docs: [{ label: 'T-SQL Subqueries', url: 'https://learn.microsoft.com/en-us/sql/relational-databases/performance/subqueries' }, { label: 'PostgreSQL Subqueries', url: 'https://www.postgresql.org/docs/current/functions-subquery.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['A correlated subquery re-runs for every outer row — if it is slow, rewrite as a JOIN or CTE.', 'NOT IN with a NULL in the subquery returns no rows at all — use NOT EXISTS instead.'],
  },
  'sql/ctes': {
    apis: ['WITH name AS (...)', 'multiple CTEs', 'RECURSIVE', 'anchor member', 'recursive member', 'UNION ALL'],
    related: [{ label: 'Subqueries', route: '/sql/subqueries' }, { label: 'Window Functions', route: '/sql/window-functions' }, { label: 'Stored Procedures', route: '/sql/stored-procedures' }],
    tip: 'Recursive CTEs are the cleanest way to walk a parent-child hierarchy — but always include a depth/cycle guard to prevent infinite loops.',
    docs: [{ label: 'T-SQL WITH / CTE', url: 'https://learn.microsoft.com/en-us/sql/t-sql/queries/with-common-table-expression-transact-sql' }, { label: 'PostgreSQL WITH', url: 'https://www.postgresql.org/docs/current/queries-with.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['CTEs in SQL Server are not always materialised — the optimiser can inline them and run the CTE body multiple times.', 'In PostgreSQL, CTEs are materialised by default (fence) — add NOT MATERIALIZED for optimiser visibility.'],
  },
  'sql/window-functions': {
    apis: ['ROW_NUMBER()', 'RANK()', 'DENSE_RANK()', 'NTILE()', 'LAG()', 'LEAD()', 'FIRST_VALUE()', 'LAST_VALUE()', 'OVER()', 'PARTITION BY', 'ROWS BETWEEN'],
    related: [{ label: 'Aggregations', route: '/sql/aggregations' }, { label: 'CTEs', route: '/sql/ctes' }, { label: 'Performance', route: '/sql/performance' }],
    tip: 'Window functions never reduce row count — unlike GROUP BY, every input row has a corresponding output row, so you can mix detail and summary in the same query.',
    docs: [{ label: 'T-SQL Window Functions', url: 'https://learn.microsoft.com/en-us/sql/t-sql/functions/ranking-functions-transact-sql' }, { label: 'PostgreSQL Window Functions', url: 'https://www.postgresql.org/docs/current/tutorial-window.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['LAST_VALUE needs ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING — the default frame stops at the current row.', 'Window functions run after WHERE and GROUP BY — you cannot filter on them in the same query; wrap in a CTE.'],
  },
  'sql/indexes': {
    apis: ['CREATE INDEX', 'CREATE CLUSTERED INDEX', 'INCLUDE', 'CREATE UNIQUE INDEX', 'DROP INDEX', 'sys.dm_db_missing_index_details', 'EXPLAIN', 'EXPLAIN ANALYZE'],
    related: [{ label: 'Performance', route: '/sql/performance' }, { label: 'Transactions', route: '/sql/transactions' }, { label: 'Schema Design', route: '/sql/schema-design' }],
    tip: 'The most impactful index is often a covering index — add the SELECT columns to INCLUDE so the engine never touches the base table.',
    docs: [{ label: 'SQL Server Indexes', url: 'https://learn.microsoft.com/en-us/sql/relational-databases/indexes/indexes' }, { label: 'PostgreSQL Indexes', url: 'https://www.postgresql.org/docs/current/indexes.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Too many indexes slow down INSERT/UPDATE/DELETE — every write must update all indexes on the table.', 'SQL Server only uses one clustered index per table — choose the column most used in range queries (usually a sequential key).'],
  },
  'sql/transactions': {
    apis: ['BEGIN TRANSACTION', 'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'SET TRANSACTION ISOLATION LEVEL', 'READ COMMITTED', 'SERIALIZABLE', 'SNAPSHOT', 'SELECT ... FOR UPDATE', 'WITH (NOLOCK)'],
    related: [{ label: 'Performance', route: '/sql/performance' }, { label: 'Stored Procedures', route: '/sql/stored-procedures' }, { label: 'Indexes', route: '/sql/indexes' }],
    tip: 'Keep transactions as short as possible — a long-running transaction holds locks and causes blocking for every other query that needs those rows.',
    docs: [{ label: 'T-SQL Transactions', url: 'https://learn.microsoft.com/en-us/sql/t-sql/language-elements/transactions-transact-sql' }, { label: 'PostgreSQL Transactions', url: 'https://www.postgresql.org/docs/current/tutorial-transactions.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['WITH (NOLOCK) / READ UNCOMMITTED reads dirty data — it avoids locks by reading uncommitted, potentially rolled-back rows.', 'Deadlocks are circular lock waits — SQL Server picks one transaction as the victim; always retry on deadlock error 1205.'],
  },
  'sql/schema-design': {
    apis: ['CREATE TABLE', 'PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK', 'NOT NULL', 'DEFAULT', 'IDENTITY / SERIAL', 'ON DELETE CASCADE', 'ALTER TABLE'],
    related: [{ label: 'Indexes', route: '/sql/indexes' }, { label: 'Transactions', route: '/sql/transactions' }, { label: 'JSON Features', route: '/sql/json-features' }],
    tip: 'Normalise to 3NF by default; only denormalise for a measured performance problem. Premature denormalisation creates data anomalies that are hard to fix later.',
    docs: [{ label: 'T-SQL CREATE TABLE', url: 'https://learn.microsoft.com/en-us/sql/t-sql/statements/create-table-transact-sql' }, { label: 'PostgreSQL CREATE TABLE', url: 'https://www.postgresql.org/docs/current/sql-createtable.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Using VARCHAR(MAX) / TEXT for every string column hurts performance — choose appropriate lengths and use indexes.', 'Cascading deletes can surprise you in production — prefer explicit application-level deletes for critical data.'],
  },
  'sql/stored-procedures': {
    apis: ['CREATE PROCEDURE', 'EXEC / CALL', '@param IN/OUT', 'RETURN', 'TRY/CATCH', 'RAISERROR / RAISE', 'CREATE FUNCTION', 'TABLE-VALUED FUNCTION', 'DECLARE', 'SET'],
    related: [{ label: 'Transactions', route: '/sql/transactions' }, { label: 'Performance', route: '/sql/performance' }, { label: 'Schema Design', route: '/sql/schema-design' }],
    tip: 'Wrap multi-step procedures in TRY/CATCH with explicit ROLLBACK in the CATCH — otherwise a partially-committed proc leaves data in an inconsistent state.',
    docs: [{ label: 'T-SQL Stored Procedures', url: 'https://learn.microsoft.com/en-us/sql/relational-databases/stored-procedures/stored-procedures-database-engine' }, { label: 'PostgreSQL PL/pgSQL', url: 'https://www.postgresql.org/docs/current/plpgsql.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Scalar UDFs in SQL Server are row-by-row — they kill query parallelism. Use inline TVFs or rewrite as set-based logic.', 'Procedure plan caching can cause parameter sniffing — OPTION (RECOMPILE) forces a fresh plan per execution.'],
  },
  'sql/performance': {
    apis: ['EXPLAIN ANALYZE', 'SET STATISTICS IO ON', 'sys.dm_exec_query_stats', 'Index Seek vs Scan', 'Hash Join vs Nested Loop', 'OPTION (RECOMPILE)', 'Query Store'],
    related: [{ label: 'Indexes', route: '/sql/indexes' }, { label: 'Transactions', route: '/sql/transactions' }, { label: 'Window Functions', route: '/sql/window-functions' }],
    tip: 'Read the execution plan right-to-left — the rightmost operations run first. The fattest arrow or the highest cost node is where to focus.',
    docs: [{ label: 'SQL Server Query Tuning', url: 'https://learn.microsoft.com/en-us/sql/relational-databases/performance/performance-center-for-sql-server-database-engine-and-azure-sql-database' }, { label: 'PostgreSQL EXPLAIN', url: 'https://www.postgresql.org/docs/current/sql-explain.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Functions on indexed columns prevent index seeks: WHERE YEAR(created_at)=2024 scans everything; WHERE created_at >= … uses the index.', 'Implicit type conversions in WHERE (comparing INT column to a VARCHAR parameter) cause full scans.'],
  },
  'sql/json-features': {
    apis: ['JSON_VALUE()', 'JSON_QUERY()', 'OPENJSON()', 'FOR JSON PATH', 'FOR JSON AUTO', 'jsonb', 'jsonb_extract_path()', '->', '->>', '@>', '?'],
    related: [{ label: 'Schema Design', route: '/sql/schema-design' }, { label: 'Performance', route: '/sql/performance' }, { label: 'Stored Procedures', route: '/sql/stored-procedures' }],
    tip: 'In PostgreSQL, use jsonb (binary) not json (text) for stored JSON — jsonb supports indexing with GIN and all operators; json just stores the text.',
    docs: [{ label: 'T-SQL JSON Functions', url: 'https://learn.microsoft.com/en-us/sql/t-sql/functions/json-functions-transact-sql' }, { label: 'PostgreSQL JSON', url: 'https://www.postgresql.org/docs/current/functions-json.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['JSON columns cannot be indexed like normal columns without computed columns (SQL Server) or GIN indexes (PostgreSQL).', 'SQL Server stores JSON as NVARCHAR — there is no native JSON type, so validation is at function-call time, not insert time.'],
  },
  'sql/cheatsheet': {
    apis: ['SELECT', 'JOIN', 'GROUP BY', 'WINDOW', 'CTE', 'DDL', 'DML', 'DCL'],
    related: [{ label: 'SQL Basics', route: '/sql/basics' }, { label: 'Joins', route: '/sql/joins' }, { label: 'Window Functions', route: '/sql/window-functions' }],
    tip: 'Use the tab filters to jump to a section and the search box to find a specific function or keyword across all sections.',
    docs: [{ label: 'T-SQL Reference', url: 'https://learn.microsoft.com/en-us/sql/t-sql/language-reference' }, { label: 'PostgreSQL Reference', url: 'https://www.postgresql.org/docs/current/sql-commands.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['Syntax differences between SQL Server and PostgreSQL are noted in the tabs — check both dialects for client-facing queries.'],
  },
  'sql/errors': {
    apis: ['TRY/CATCH', 'RAISERROR', 'THROW', 'ERROR_MESSAGE()', 'ERROR_NUMBER()', 'RAISE', '@@ERROR'],
    related: [{ label: 'Transactions', route: '/sql/transactions' }, { label: 'Stored Procedures', route: '/sql/stored-procedures' }, { label: 'Performance', route: '/sql/performance' }],
    tip: 'Most SQL errors have a root cause in the error message itself — read the full error including the state/severity before searching.',
    docs: [{ label: 'T-SQL Error Handling', url: 'https://learn.microsoft.com/en-us/sql/t-sql/language-elements/try-catch-transact-sql' }, { label: 'PostgreSQL Error Codes', url: 'https://www.postgresql.org/docs/current/errcodes-appendix.html' }],
    resources: [],
    gotchas: ['Division by zero raises an error in SQL Server and PostgreSQL — use NULLIF(denominator, 0) to return NULL instead.'],
  },
  'sql/quiz-practice': {
    apis: ['SELECT', 'JOIN', 'GROUP BY', 'WINDOW', 'INDEX', 'TRANSACTION'],
    related: [{ label: 'Interview Prep', route: '/sql/interview-prep' }, { label: 'Cheat Sheet', route: '/sql/cheatsheet' }, { label: 'Common Errors', route: '/sql/errors' }],
    tip: 'Re-run the topics where you scored lowest — targeted practice beats breadth.',
    docs: [{ label: 'T-SQL Reference', url: 'https://learn.microsoft.com/en-us/sql/t-sql/language-reference' }],
    resources: [],
    gotchas: ['Read the explanation for every question, even correct ones — the reasoning matters more than the answer.'],
  },
  'sql/interview-prep': {
    apis: ['JOIN types', 'GROUP BY / HAVING', 'Window Functions', 'Indexes', 'Transactions', 'Normalisation'],
    related: [{ label: 'Quiz Practice', route: '/sql/quiz-practice' }, { label: 'Design Patterns', route: '/sql/design-patterns' }, { label: 'Cheat Sheet', route: '/sql/cheatsheet' }],
    tip: 'Senior SQL questions probe "why" — be ready to explain when NOT to use a subquery, why an index might not be used, and what isolation level trade-offs exist.',
    docs: [{ label: 'T-SQL Reference', url: 'https://learn.microsoft.com/en-us/sql/t-sql/language-reference' }, { label: 'PostgreSQL Docs', url: 'https://www.postgresql.org/docs/current/' }],
    resources: [],
    gotchas: ['Interviewers at senior level expect execution-plan reasoning, not just syntax recall — practise reading query plans.'],
  },
  'sql/design-patterns': {
    apis: ['soft delete', 'audit log', 'temporal tables', 'lookup/reference tables', 'adjacency list', 'nested sets', 'many-to-many junction'],
    related: [{ label: 'Schema Design', route: '/sql/schema-design' }, { label: 'Transactions', route: '/sql/transactions' }, { label: 'JSON Features', route: '/sql/json-features' }],
    tip: 'Start with the simplest pattern (adjacency list for trees, junction table for M:N) — only add complexity when you have a measured query problem.',
    docs: [{ label: 'T-SQL Temporal Tables', url: 'https://learn.microsoft.com/en-us/sql/relational-databases/tables/temporal-tables' }, { label: 'PostgreSQL Inheritance', url: 'https://www.postgresql.org/docs/current/ddl-inherit.html' }],
    resources: [],
    gotchas: ['Soft delete adds a filter to every query — use row-level security or a view to avoid accidentally including deleted rows.'],
  },
  'sql/decision-guides': {
    apis: ['clustered vs non-clustered', 'stored proc vs view', 'CTE vs subquery', 'ORM vs raw SQL', 'MSSQL vs PostgreSQL'],
    related: [{ label: 'Indexes', route: '/sql/indexes' }, { label: 'Performance', route: '/sql/performance' }, { label: 'Schema Design', route: '/sql/schema-design' }],
    tip: 'Decision tables give the 80% answer — always validate against your specific data distribution and query patterns.',
    docs: [{ label: 'SQL Server vs PostgreSQL comparison', url: 'https://learn.microsoft.com/en-us/sql/sql-server/' }],
    resources: [],
    gotchas: ['Platform choice (MSSQL vs PostgreSQL) is often driven by team skill and cloud cost, not raw features — both are excellent for most workloads.'],
  },
  'sql/glossary': {
    apis: ['DDL', 'DML', 'DCL', 'ACID', 'Normalisation', 'Cardinality', 'Index', 'Cursor'],
    related: [{ label: 'Cheat Sheet', route: '/sql/cheatsheet' }, { label: 'Learning Paths', route: '/sql/learning-paths' }],
    tip: 'Use the letter filter or search box — every term with a matching topic page links directly to it.',
    docs: [{ label: 'SQL Server Glossary', url: 'https://learn.microsoft.com/en-us/sql/sql-server/' }, { label: 'PostgreSQL Glossary', url: 'https://www.postgresql.org/docs/current/glossary.html' }],
    resources: [],
    gotchas: ['SQL terminology overlaps with relational algebra terms — "relation" = table, "tuple" = row, "attribute" = column in academic writing.'],
  },
  'sql/mini-projects': {
    apis: ['CREATE TABLE', 'INSERT', 'SELECT', 'JOIN', 'GROUP BY', 'INDEX', 'PROCEDURE'],
    related: [{ label: 'Schema Design', route: '/sql/schema-design' }, { label: 'Stored Procedures', route: '/sql/stored-procedures' }, { label: 'Performance', route: '/sql/performance' }],
    tip: 'Build all 4 schemas in the same database so you can practice cross-schema joins.',
    docs: [{ label: 'T-SQL Reference', url: 'https://learn.microsoft.com/en-us/sql/t-sql/language-reference' }, { label: 'PostgreSQL Reference', url: 'https://www.postgresql.org/docs/current/sql-commands.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['These schemas are intentionally simplified — production schemas will need audit columns, soft-delete, and partitioning for large tables.'],
  },
  'sql/learning-paths': {
    apis: ['SELECT', 'JOIN', 'GROUP BY', 'Window Functions', 'Indexes', 'Transactions'],
    related: [{ label: 'Quiz Practice', route: '/sql/quiz-practice' }, { label: 'Interview Prep', route: '/sql/interview-prep' }, { label: 'Mini Projects', route: '/sql/mini-projects' }],
    tip: 'Follow one path at a time — the beginner path is prerequisite for all others.',
    docs: [{ label: 'SQL Server Learning', url: 'https://learn.microsoft.com/en-us/sql/sql-server/' }, { label: 'PostgreSQL Tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html' }],
    resources: [{ label: 'DB Fiddle', url: 'https://dbfiddle.uk/', badge: 'tool' }],
    gotchas: ['The DBA path requires understanding execution plans — read the Indexes and Performance pages before tackling it.'],
  },

  // ── CSS: Box Model ────────────────────────────────────────────────────────
  'css/box-model': {
    apis: ['box-sizing', 'margin', 'padding', 'border', 'width', 'height', 'overflow', 'display'],
    related: [
      { label: 'Flexbox',               route: '/css/flexbox'    },
      { label: 'CSS Grid',              route: '/css/grid'       },
      { label: 'Positioning & Stacking', route: '/css/positioning' },
    ],
    tip: '* { box-sizing: border-box } should be line 1 of every stylesheet — it makes width mean what you expect and eliminates 80% of sizing bugs.',
    docs: [
      { label: 'MDN — box-sizing',    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing'    },
      { label: 'MDN — margin collapse', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Mastering_margin_collapsing' },
      { label: 'web.dev — Box Model', url: 'https://web.dev/learn/css/box-model'                            },
    ],
    resources: [
      { label: 'CSS Tricks — Box Model', url: 'https://css-tricks.com/the-css-box-model/', badge: 'blog' },
    ],
    gotchas: [
      'Margin collapse only happens in normal block flow — margins do not collapse inside flex or grid containers.',
      'overflow: hidden on a parent creates a BFC, which is a common trick to contain floats and prevent margin collapse.',
    ],
  },

  // ── CSS: Backgrounds & Borders ────────────────────────────────────────────
  'css/backgrounds-borders': {
    apis: ['background-size', 'background-image', 'linear-gradient()', 'radial-gradient()', 'border-radius', 'box-shadow', 'object-fit', 'aspect-ratio', 'outline'],
    related: [
      { label: 'Colors & Theming',  route: '/css/colors-theming' },
      { label: 'Responsive Design', route: '/css/responsive'     },
      { label: 'CSS Transitions',   route: '/css/transitions'    },
    ],
    tip: 'Layer 3 box-shadows (small/medium/large blur with low opacity) for realistic depth — a single large shadow looks flat.',
    docs: [
      { label: 'MDN — background',      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/background'     },
      { label: 'MDN — box-shadow',      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow'     },
      { label: 'MDN — aspect-ratio',    url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio'   },
    ],
    resources: [
      { label: 'CSS Gradient Generator', url: 'https://www.css-gradient.com/', badge: 'tool' },
      { label: 'Shadow Palette Generator', url: 'https://www.joshwcomeau.com/shadow-palette/', badge: 'tool' },
    ],
    gotchas: [
      'background shorthand resets all sub-properties — use slash notation (position / size) inside it to set background-size.',
      'object-fit has no effect without explicit width and height on the img/video element.',
    ],
  },

  'css/cheatsheet': {
    apis: ['Selectors', 'Box Model', 'Flexbox', 'Grid', 'Typography', 'Colors & Variables', 'Animations', 'Modern CSS'],
    related: [
      { label: 'CSS Interview Prep',  route: '/css/interview-prep'  },
      { label: 'CSS Fundamentals',    route: '/css/fundamentals'    },
      { label: 'Selectors Deep Dive', route: '/css/selectors'       },
    ],
    tip: 'Use Ctrl+K to search the site — or use the filter box in the cheat sheet to jump to specific properties.',
    docs: [
      { label: 'MDN CSS Reference',  url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference' },
      { label: 'CSS Tricks Almanac', url: 'https://css-tricks.com/almanac/'                            },
    ],
    resources: [],
    gotchas: [],
  },

  'css/interview-prep': {
    apis: ['Cascade', 'Specificity', 'Flexbox', 'Grid', 'Positioning', 'Performance', 'Modern CSS'],
    related: [
      { label: 'CSS Cheat Sheet',   route: '/css/cheatsheet'     },
      { label: 'CSS Fundamentals',  route: '/css/fundamentals'   },
      { label: 'CSS Architecture',  route: '/css/css-architecture' },
    ],
    tip: 'Study the cascade algorithm, specificity calculation, and stacking context — these come up in almost every CSS interview.',
    docs: [
      { label: 'MDN: Cascade & Specificity', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade' },
    ],
    resources: [],
    gotchas: [],
  },

  'css/fundamentals': {
    apis: ['cascade', 'specificity', 'inheritance', 'box-sizing', 'display', ':is()', ':where()', 'all: unset', 'inherit / initial / unset / revert'],
    related: [
      { label: 'CSS Selectors Deep Dive', route: '/css/selectors'         },
      { label: 'Box Model',               route: '/css/box-model'         },
      { label: 'CSS Custom Properties',   route: '/css/custom-properties' },
    ],
    tip: 'Use :where() for resets and defaults — its zero specificity means any class selector will override it without specificity battles.',
    docs: [
      { label: 'MDN: Cascade & Specificity', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade'     },
      { label: 'MDN: Inheritance',           url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Inheritance' },
      { label: 'MDN: box-sizing',            url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing'  },
    ],
    resources: [],
    gotchas: [
      'Specificity is a tuple, not a decimal — 10 classes never beat 1 ID.',
      'Vertical margins collapse between adjacent block siblings — horizontal margins never do.',
    ],
  },

  'css/css-filters': {
    apis: ['filter: blur/brightness/contrast/grayscale/hue-rotate/saturate/sepia/drop-shadow/invert', 'backdrop-filter', 'mix-blend-mode', 'background-blend-mode', 'isolation: isolate'],
    related: [
      { label: 'CSS Transforms',  route: '/css/css-transforms' },
      { label: 'CSS Animations',  route: '/css/animations'     },
      { label: 'Colors & Theming', route: '/css/colors-theming' },
    ],
    tip: 'For frosted glass: background must be semi-transparent + -webkit-backdrop-filter for Safari. Keep backdrop-filter on small areas for performance.',
    docs: [
      { label: 'MDN: filter',          url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/filter'          },
      { label: 'MDN: backdrop-filter', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter' },
      { label: 'MDN: mix-blend-mode',  url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode'  },
    ],
    resources: [],
    gotchas: [
      'drop-shadow has no spread radius — only x, y, blur, color. box-shadow has the 4th spread value.',
      'backdrop-filter always needs -webkit-backdrop-filter for Safari (even Safari 17).',
    ],
  },

  'css/css-transforms': {
    apis: ['translate()', 'rotate()', 'scale()', 'skew()', 'perspective()', 'transform-origin', 'transform-style: preserve-3d', 'backface-visibility', 'translate / rotate / scale (individual properties)'],
    related: [
      { label: 'CSS Animations',   route: '/css/animations'  },
      { label: 'CSS Transitions',  route: '/css/transitions' },
      { label: 'CSS Filters',      route: '/css/css-filters' },
    ],
    tip: 'Use individual transform properties (translate, rotate, scale) over the shorthand — they compose independently and each can have its own transition-duration.',
    docs: [
      { label: 'MDN: transform',       url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/transform'       },
      { label: 'MDN: perspective',     url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/perspective'     },
      { label: 'MDN: transform-style', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/transform-style' },
    ],
    resources: [],
    gotchas: [
      'Transform order matters — rotate(45deg) translateX(100px) moves in the ROTATED X direction, not screen X.',
      'transform creates a stacking context — children\'s z-index is relative to the transformed element, not the page.',
    ],
  },

  'css/scroll-driven-animations': {
    apis: ['animation-timeline: scroll()', 'animation-timeline: view()', 'animation-range', 'scroll-timeline-name', 'view-timeline-name', 'timeline-scope'],
    related: [
      { label: 'CSS Animations',   route: '/css/animations'   },
      { label: 'CSS Transitions',  route: '/css/transitions'  },
      { label: 'Container Queries', route: '/css/container-queries' },
    ],
    tip: 'Always add @supports not (animation-timeline: view()) when starting with opacity:0 — unsupported browsers leave content permanently invisible.',
    docs: [
      { label: 'MDN: animation-timeline',  url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline'  },
      { label: 'MDN: animation-range',     url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/animation-range'     },
      { label: 'Chrome Developers Guide',  url: 'https://developer.chrome.com/docs/css-ui/scroll-driven-animations'   },
    ],
    resources: [
      { label: 'Scroll-driven demos', url: 'https://scroll-driven-animations.style/', badge: 'tool' },
    ],
    gotchas: [
      'animation-duration is ignored for scroll timelines — progress is positional. Omit it or set "auto".',
      'Siblings cannot share a named timeline without timeline-scope on a common ancestor.',
    ],
  },

  'css/tailwind': {
    apis: ['flex', 'grid', 'p-4', 'bg-{color}-500', 'hover:', 'md:', 'dark:', '@apply', 'group-hover:', 'peer-checked:', 'arbitrary values []'],
    related: [
      { label: 'CSS Architecture',     route: '/css/css-architecture' },
      { label: 'CSS Custom Properties', route: '/css/custom-properties' },
      { label: 'Responsive Design',    route: '/css/responsive'       },
    ],
    tip: 'Never build class names dynamically: `bg-${color}-500` is never scanned by JIT. Use a lookup object with full class name strings.',
    docs: [
      { label: 'Tailwind CSS Docs',    url: 'https://tailwindcss.com/docs'                          },
      { label: 'Tailwind v4 Guide',    url: 'https://tailwindcss.com/docs/v4-beta'                  },
      { label: 'Headless UI',          url: 'https://headlessui.com/'                               },
    ],
    resources: [
      { label: 'Tailwind UI components', url: 'https://tailwindui.com/',           badge: 'tool' },
      { label: 'shadcn/ui',              url: 'https://ui.shadcn.com/',             badge: 'code' },
    ],
    gotchas: [
      'Files missing from the content array = classes not generated. Always include both .html and .ts for Angular.',
      'Dynamic class strings (template literals) are never generated by JIT — use a full-string lookup object instead.',
    ],
  },

  'css/css-architecture': {
    apis: ['BEM', 'ITCSS', 'CSS Modules', '@layer + ITCSS'],
    related: [
      { label: 'CSS Layers (@layer)',  route: '/css/css-layers'   },
      { label: 'CSS Custom Properties', route: '/css/custom-properties' },
      { label: 'Tailwind CSS',         route: '/css/tailwind'     },
    ],
    tip: 'Modern stack: ITCSS conceptual layers + CSS @layer enforcement + BEM naming for components = zero specificity wars.',
    docs: [
      { label: 'BEM Official Docs',    url: 'https://getbem.com/'                                                    },
      { label: 'ITCSS — Harry Roberts', url: 'https://www.xfive.co/blog/itcss-scalable-maintainable-css-architecture/' },
      { label: 'CSS Modules Docs',     url: 'https://github.com/css-modules/css-modules'                            },
    ],
    resources: [
      { label: 'CUBE CSS (modern take)', url: 'https://cube.fyi/', badge: 'docs' },
    ],
    gotchas: [
      'BEM elements are flat siblings in CSS — never nest .card__title inside .card { } or you get a descendant selector.',
      'ITCSS Objects layer is structure-only — no colors, shadows, or fonts. Those go in Components.',
    ],
  },

  'css/logical-properties': {
    apis: ['margin-inline', 'padding-block', 'inset-inline-start', 'inline-size', 'block-size', 'border-inline-start', 'border-start-start-radius'],
    related: [
      { label: 'CSS Nesting',      route: '/css/css-nesting'    },
      { label: 'Responsive Design', route: '/css/responsive'    },
      { label: 'Flexbox',          route: '/css/flexbox'        },
    ],
    tip: 'Start migration with margin-inline: auto (centering) and padding-block/inline — these are the highest ROI logical properties.',
    docs: [
      { label: 'MDN — Logical Properties', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values' },
      { label: 'MDN — inset',              url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/inset'                            },
      { label: 'Can I Use — Logical Props', url: 'https://caniuse.com/css-logical-props'                                           },
    ],
    resources: [
      { label: 'CSS Logical Properties Guide', url: 'https://web.dev/learn/css/logical-properties', badge: 'docs' },
    ],
    gotchas: [
      'In vertical-rl writing mode, inline-size maps to height and block-size maps to width — opposite of horizontal-tb.',
      'inset is physical (top/right/bottom/left) — use inset-inline-start/end for direction-aware positioning.',
    ],
  },

  'css/css-nesting': {
    apis: ['& (parent selector)', 'nested @media', 'nested @container', 'nested @supports'],
    related: [
      { label: 'CSS Layers (@layer)', route: '/css/css-layers'        },
      { label: 'Selectors Deep Dive', route: '/css/selectors'         },
      { label: 'Logical Properties',  route: '/css/logical-properties' },
    ],
    tip: 'Always use & before pseudo-classes (&:hover) and pseudo-elements (&::before). Without &, the rule is a descendant selector.',
    docs: [
      { label: 'MDN — CSS Nesting',     url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting'        },
      { label: 'MDN — & selector',      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Nesting_selector'   },
      { label: 'Can I Use — Nesting',   url: 'https://caniuse.com/css-nesting'                                     },
    ],
    resources: [
      { label: 'CSS Nesting Playground', url: 'https://codepen.io/web-dot-dev/pen/OJoKJeK', badge: 'tool' },
    ],
    gotchas: [
      '.card { :hover { } } targets any hovered descendant — use &:hover to target .card itself.',
      'Native nesting does NOT concatenate strings — .block { &__element { } } is NOT .block__element.',
    ],
  },

  'css/css-layers': {
    apis: ['@layer', 'revert-layer', 'layer() in @import'],
    related: [
      { label: 'CSS Custom Properties', route: '/css/custom-properties' },
      { label: 'Selectors Deep Dive',   route: '/css/selectors'         },
      { label: 'CSS Nesting',           route: '/css/css-nesting'       },
    ],
    tip: 'Declare @layer order as the very first line in your stylesheet — the first @layer the browser sees establishes priority.',
    docs: [
      { label: 'MDN — @layer',        url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@layer'       },
      { label: 'MDN — revert-layer',  url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/revert-layer' },
      { label: 'Can I Use — @layer',  url: 'https://caniuse.com/css-cascade-5'                             },
    ],
    resources: [
      { label: 'CSS Cascade Layers Explainer', url: 'https://css.oddbird.net/layers/', badge: 'docs' },
    ],
    gotchas: [
      'Unlayered styles always beat layered ones — existing code outside @layer continues to win.',
      '!important reverses layer priority — !important in a lower-priority layer wins over !important in a higher one.',
    ],
  },

  'css/container-queries': {
    apis: ['container-type', 'container-name', 'container', '@container', 'cqw', 'cqh', 'cqi', 'cqb'],
    related: [
      { label: 'Responsive Design', route: '/css/responsive'          },
      { label: 'CSS Grid',          route: '/css/grid'                },
      { label: 'Flexbox',           route: '/css/flexbox'             },
    ],
    tip: 'Use container-type: inline-size (not size) for most cases — size containment can collapse element height.',
    docs: [
      { label: 'MDN — container-type',  url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/container-type'  },
      { label: 'MDN — @container',      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@container'      },
      { label: 'Can I Use — Container Queries', url: 'https://caniuse.com/css-container-queries'               },
    ],
    resources: [
      { label: 'Container Query Playground', url: 'https://codepen.io/una/pen/LYbvKpK', badge: 'tool' },
    ],
    gotchas: [
      'A container cannot query itself — only descendants respond to @container rules on that container.',
      'cqw / cqh only work when there is a container-type ancestor in scope — without one, they resolve to 0.',
    ],
  },

  // ── CSS: Colors & Theming ─────────────────────────────────────────────────
  'css/colors-theming': {
    apis: ['oklch()', 'color-mix()', 'prefers-color-scheme', 'forced-colors', 'color-scheme', 'var(--token)', 'contrast-color()'],
    related: [
      { label: 'Custom Properties', route: '/css/custom-properties' },
      { label: 'Responsive Design', route: '/css/responsive'        },
      { label: 'Typography',        route: '/css/typography'        },
    ],
    tip: 'Define 6 tokens: --bg, --surface, --border, --text, --muted, --accent. Every component reads these — dark mode is a single :root override.',
    docs: [
      { label: 'MDN — oklch',           url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch'   },
      { label: 'MDN — color-mix()',     url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix' },
      { label: 'oklch.com — color tool', url: 'https://oklch.com/' },
    ],
    resources: [
      { label: 'oklch.com palette tool', url: 'https://oklch.com/',     badge: 'tool' },
      { label: 'Radix Colors',           url: 'https://www.radix-ui.com/colors', badge: 'tool' },
    ],
    gotchas: [
      'Never use color alone to convey meaning (error/success) — pair with an icon or text label (WCAG 1.4.1).',
      'color-scheme: light dark must be on :root so native form controls adopt the correct mode.',
    ],
  },

  // ── CSS: Transitions ──────────────────────────────────────────────────────
  'css/transitions': {
    apis: ['transition', 'transition-duration', 'transition-timing-function', 'transition-delay', 'cubic-bezier()', 'prefers-reduced-motion'],
    related: [
      { label: 'CSS Animations', route: '/css/animations'      },
      { label: 'Flexbox',        route: '/css/flexbox'         },
      { label: 'Custom Properties', route: '/css/custom-properties' },
    ],
    tip: 'Define transition on the base state, not on :hover — otherwise the reverse transition snaps instead of animating.',
    docs: [
      { label: 'MDN — CSS Transitions', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions/Using_CSS_transitions' },
      { label: 'cubic-bezier.com',      url: 'https://cubic-bezier.com/' },
      { label: 'Easing functions reference', url: 'https://easings.net/' },
    ],
    resources: [
      { label: 'Easing Cheat Sheet', url: 'https://easings.net/', badge: 'tool' },
    ],
    gotchas: [
      'transition: all watches every property — always list specific properties to avoid wasted recalculations.',
      'transition on :hover only = one-way animation. Put it on the base element for both-way transitions.',
    ],
  },

  // ── CSS: Animations ───────────────────────────────────────────────────────
  'css/animations': {
    apis: ['@keyframes', 'animation-duration', 'animation-timing-function', 'animation-fill-mode', 'animation-delay', 'will-change', 'animation-play-state'],
    related: [
      { label: 'CSS Transitions',  route: '/css/transitions'  },
      { label: 'Responsive Design', route: '/css/responsive'  },
      { label: 'Custom Properties', route: '/css/custom-properties' },
    ],
    tip: 'Only animate transform and opacity for 60fps — everything else triggers layout or paint and will cause jank.',
    docs: [
      { label: 'MDN — CSS Animations', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations' },
      { label: 'cubic-bezier visualiser', url: 'https://cubic-bezier.com/' },
      { label: 'web.dev — Animations guide', url: 'https://web.dev/articles/animations-guide' },
    ],
    resources: [
      { label: 'Animate.css', url: 'https://animate.style/', badge: 'tool' },
    ],
    gotchas: [
      'will-change creates a GPU layer per element — applying it to everything wastes memory. Remove after animation ends.',
      'animation-fill-mode: none (default) resets element to original state on completion — usually set to "both".',
    ],
  },

  // ── CSS: Responsive Design ────────────────────────────────────────────────
  'css/responsive': {
    apis: ['@media (min-width)', '@container', 'container-type', 'clamp()', 'min()', 'max()', 'auto-fit', 'minmax()', 'prefers-reduced-motion'],
    related: [
      { label: 'CSS Grid',        route: '/css/grid'             },
      { label: 'Flexbox',         route: '/css/flexbox'          },
      { label: 'Custom Properties', route: '/css/custom-properties' },
    ],
    tip: 'Replace max-width + width: 100% with min(100%, 600px) — one property, zero override needed.',
    docs: [
      { label: 'MDN — @media',              url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media'            },
      { label: 'MDN — Container queries',   url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries' },
      { label: 'web.dev — Responsive design', url: 'https://web.dev/learn/design'                                     },
    ],
    resources: [
      { label: 'Utopia fluid type & space', url: 'https://utopia.fyi/', badge: 'tool' },
    ],
    gotchas: [
      'Without <meta name="viewport" content="width=device-width, initial-scale=1">, media queries won\'t behave on mobile.',
      'prefers-reduced-motion: reduce must disable or simplify animations — WCAG requires this for accessibility.',
    ],
  },

  // ── CSS: Typography ───────────────────────────────────────────────────────
  'css/typography': {
    apis: ['@font-face', 'font-display', 'clamp()', 'line-height', 'text-wrap', 'font-variation-settings', 'font-optical-sizing'],
    related: [
      { label: 'Custom Properties', route: '/css/custom-properties' },
      { label: 'Responsive Design', route: '/css/responsive'        },
      { label: 'Colors & Theming',  route: '/css/colors-theming'    },
    ],
    tip: 'Start every project with clamp() type tokens on :root and max-width: 65ch on .prose — these two rules eliminate most typography media queries.',
    docs: [
      { label: 'MDN — @font-face',      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face'    },
      { label: 'web.dev — Font best practices', url: 'https://web.dev/articles/font-best-practices'           },
      { label: 'Variable Fonts Guide',  url: 'https://web.dev/articles/variable-fonts'                        },
    ],
    resources: [
      { label: 'Fluid Type Scale', url: 'https://www.fluid-type-scale.com/', badge: 'tool' },
      { label: 'Font Squirrel',    url: 'https://www.fontsquirrel.com/',     badge: 'tool' },
    ],
    gotchas: [
      'Font preloads need crossorigin even for same-origin fonts — missing it causes a double download.',
      'em compounds in nested elements for font-size. Use rem to always be relative to the root.',
    ],
  },

  // ── CSS: Selectors ────────────────────────────────────────────────────────
  'css/selectors': {
    apis: [':is()', ':where()', ':has()', ':not()', ':nth-child()', '::before', '::after', '[attr^=]'],
    related: [
      { label: 'Custom Properties', route: '/css/custom-properties' },
      { label: 'Box Model',         route: '/css/box-model'         },
      { label: 'Flexbox',           route: '/css/flexbox'           },
    ],
    tip: 'Use :where() for base/reset styles so components can override without specificity fights. Use :is() when you need the selector\'s specificity to apply.',
    docs: [
      { label: 'MDN — :is()',  url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:is'   },
      { label: 'MDN — :has()', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:has'  },
      { label: 'MDN — Specificity', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity' },
    ],
    resources: [
      { label: 'CSS Specificity Calculator', url: 'https://specificity.keegan.st/', badge: 'tool' },
    ],
    gotchas: [
      ':is() takes the specificity of its most specific argument — :is(#id, .class) has ID-level specificity.',
      '::before/::after require content: "" even when empty — without it they don\'t render.',
    ],
  },

  // ── CSS: Custom Properties ────────────────────────────────────────────────
  'css/custom-properties': {
    apis: ['var()', '--custom-prop', ':root', '@property', 'color-mix()', 'calc() with var()'],
    related: [
      { label: 'Colors & Theming', route: '/css/colors-theming' },
      { label: 'CSS Animations',   route: '/css/animations'     },
      { label: 'Box Model',        route: '/css/box-model'      },
    ],
    tip: 'Name your tokens semantically (--color-surface, not --white) so they stay meaningful when the color changes in dark mode.',
    docs: [
      { label: 'MDN — CSS Custom Properties', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties' },
      { label: 'MDN — @property',             url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@property'                   },
      { label: 'web.dev — CSS Variables',     url: 'https://web.dev/learn/css/custom-properties'                                  },
    ],
    resources: [
      { label: 'Open Props (token library)', url: 'https://open-props.style/', badge: 'tool' },
    ],
    gotchas: [
      'var() fallback fires on undefined variables, not on invalid values — invalid triggers inherited/initial value instead.',
      'Sass variables are compile-time; CSS custom properties are runtime. Use CSS variables for anything that needs to change dynamically.',
    ],
  },

  // ── CSS: Positioning ──────────────────────────────────────────────────────
  'css/positioning': {
    apis: ['position: relative', 'position: absolute', 'position: fixed', 'position: sticky', 'z-index', 'inset', 'isolation: isolate'],
    related: [
      { label: 'CSS Grid',    route: '/css/grid'    },
      { label: 'Flexbox',     route: '/css/flexbox' },
      { label: 'Box Model',   route: '/css/box-model' },
    ],
    tip: 'Debugging z-index? Open DevTools, select the element, and look at the Layers panel — it shows every stacking context and lets you see what\'s layering on top.',
    docs: [
      { label: 'MDN — position',           url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/position'         },
      { label: 'MDN — z-index',            url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/z-index'          },
      { label: 'MDN — Stacking context',   url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context' },
    ],
    resources: [
      { label: 'CSS Tricks — z-index', url: 'https://css-tricks.com/almanac/properties/z/z-index/', badge: 'blog' },
    ],
    gotchas: [
      'z-index has no effect on position: static elements — add position: relative.',
      'overflow: hidden on a parent breaks sticky — the parent becomes the scroll container.',
    ],
  },

  // ── CSS: Grid ─────────────────────────────────────────────────────────────
  'css/grid': {
    apis: ['display: grid', 'grid-template-columns', 'grid-template-areas', 'repeat()', 'minmax()', 'fr', 'gap', 'grid-area'],
    related: [
      { label: 'Flexbox',               route: '/css/flexbox'    },
      { label: 'Box Model',             route: '/css/box-model'  },
      { label: 'Positioning & Stacking', route: '/css/positioning' },
    ],
    tip: 'repeat(auto-fit, minmax(200px, 1fr)) is the single most useful CSS Grid pattern — responsive columns with zero media queries.',
    docs: [
      { label: 'MDN — CSS Grid Layout', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout' },
      { label: 'MDN — grid-template-areas', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-areas' },
      { label: 'web.dev — Learn CSS Grid', url: 'https://web.dev/learn/css/grid' },
    ],
    resources: [
      { label: 'CSS Tricks — Grid Guide', url: 'https://css-tricks.com/snippets/css/complete-guide-grid/', badge: 'blog' },
      { label: 'Grid Garden (game)',      url: 'https://cssgridgarden.com/',                                  badge: 'tool' },
    ],
    gotchas: [
      'Grid items have min-width: auto — add min-width: 0 to allow them to shrink below content size.',
      'auto-fit collapses empty tracks; auto-fill keeps them — use auto-fit for card grids.',
    ],
  },

  // ── CSS: Flexbox ──────────────────────────────────────────────────────────
  'css/flexbox': {
    apis: ['display: flex', 'justify-content', 'align-items', 'flex-wrap', 'gap', 'flex', 'align-self', 'order'],
    related: [
      { label: 'Box Model',              route: '/css/box-model'    },
      { label: 'CSS Grid',               route: '/css/grid'         },
      { label: 'Positioning & Stacking', route: '/css/positioning'  },
    ],
    tip: 'Remember: justify-content = main axis (row → horizontal), align-items = cross axis (row → vertical). They swap when flex-direction is column.',
    docs: [
      { label: 'MDN — Flexbox',          url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox' },
      { label: 'MDN — flex shorthand',   url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/flex' },
      { label: 'web.dev — Learn CSS Flexbox', url: 'https://web.dev/learn/css/flexbox' },
    ],
    resources: [
      { label: 'CSS Tricks — Flexbox Guide', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', badge: 'blog' },
      { label: 'Flexbox Froggy (game)',      url: 'https://flexboxfroggy.com/',                              badge: 'tool' },
    ],
    gotchas: [
      'flex items have min-width: auto by default — add min-width: 0 to allow shrinking below content size.',
      'align-content only takes effect when flex-wrap: wrap is set and there are multiple rows.',
    ],
  },

  // ── HTML: Head & Metadata ──────────────────────────────────────────────────
  'html/head-metadata': {
    apis: ['<meta charset>', '<meta name="viewport">', 'og:image', '<link rel="preload">', '<link rel="canonical">'],
    related: [
      { label: 'Document Structure', route: '/html/document-structure' },
      { label: 'SEO & Meta Tags',    route: '/html/seo'                },
      { label: 'Performance',        route: '/html/performance'        },
    ],
    tip: 'Order matters in <head>: charset first, viewport second, then title and meta — any stylesheet or script before charset can cause encoding bugs.',
    docs: [
      { label: 'MDN — <head> element',     url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head' },
      { label: 'Open Graph Protocol',      url: 'https://ogp.me/' },
      { label: 'Google — Resource Hints',  url: 'https://web.dev/articles/preload-critical-assets' },
    ],
    resources: [
      { label: 'Metatags.io preview tool', url: 'https://metatags.io/',         badge: 'tool' },
      { label: 'Open Graph Debugger',      url: 'https://developers.facebook.com/tools/debug/', badge: 'tool' },
    ],
    gotchas: [
      'Font preloads need crossorigin even for same-origin fonts — omitting it causes the font to download twice.',
      'rel="canonical" must use an absolute URL; a relative path resolves differently across mirrors and defeats the duplicate-content fix.',
    ],
  },

  // ── HTML: iFrames & Embeds ─────────────────────────────────────────────────
  'html/iframes-embeds': {
    apis: ['sandbox', 'allow', 'srcdoc', 'loading="lazy"', 'X-Frame-Options', 'frame-ancestors'],
    related: [
      { label: 'Head & Metadata',    route: '/html/head-metadata'    },
      { label: 'HTML Performance',   route: '/html/performance'      },
      { label: 'Web Components',     route: '/html/custom-elements'  },
    ],
    tip: 'Always set an explicit width and height on iframes to prevent CLS, and always add a title attribute for screen reader accessibility.',
    docs: [
      { label: 'MDN — <iframe>',           url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe'   },
      { label: 'CSP frame-ancestors',      url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors' },
      { label: 'Permissions Policy',       url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Permissions_Policy' },
    ],
    resources: [
      { label: 'OWASP Clickjacking Guide', url: 'https://owasp.org/www-community/attacks/Clickjacking',  badge: 'docs' },
      { label: 'web.dev — Permissions Policy', url: 'https://web.dev/articles/permissions-policy',        badge: 'blog' },
    ],
    gotchas: [
      'sandbox allow attribute uses semicolons as separators — commas silently break the entire attribute.',
      'Combining allow-scripts + allow-same-origin in sandbox defeats it — a script can remove its own sandbox attribute.',
    ],
  },

  'html/cheatsheet': {
    apis: ['<!DOCTYPE html>', '<meta charset>', '<link rel>', 'defer/async', 'aria-*', 'data-*', 'loading="lazy"', 'fetchpriority'],
    related: [
      { label: 'HTML Interview Prep',   route: '/html/interview-prep'   },
      { label: 'Accessibility & ARIA',  route: '/html/accessibility'    },
      { label: 'HTML Performance',      route: '/html/performance'      },
    ],
    tip: 'Use the category filter to focus on one area at a time — Forms and A11y are the most common gaps in HTML interviews.',
    docs: [
      { label: 'MDN — HTML elements reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element'            },
      { label: 'MDN — Global attributes',       url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes'  },
      { label: 'HTML spec (WHATWG)',             url: 'https://html.spec.whatwg.org/multipage/'                             },
    ],
    resources: [
      { label: 'web.dev — Learn HTML',  url: 'https://web.dev/learn/html',  badge: 'blog' },
    ],
    gotchas: [],
  },

  'html/interview-prep': {
    apis: ['defer/async', 'ARIA', 'Critical Rendering Path', 'service worker', 'Shadow DOM', 'canonical', 'hreflang', 'JSON-LD'],
    related: [
      { label: 'HTML Cheat Sheet',      route: '/html/cheatsheet'       },
      { label: 'Accessibility & ARIA',  route: '/html/accessibility'    },
      { label: 'HTML SEO',              route: '/html/seo'              },
    ],
    tip: 'Interviewers love "why" answers — for every HTML feature, know the fallback, the performance impact, and the accessibility consequence.',
    docs: [
      { label: 'MDN — HTML',                   url: 'https://developer.mozilla.org/en-US/docs/Web/HTML'        },
      { label: 'web.dev — Core Web Vitals',    url: 'https://web.dev/articles/vitals'                         },
      { label: 'WHATWG HTML Living Standard',  url: 'https://html.spec.whatwg.org/multipage/'                 },
    ],
    resources: [
      { label: 'web.dev — Learn HTML', url: 'https://web.dev/learn/html',  badge: 'blog' },
    ],
    gotchas: [],
  },

  'html/apis': {
    apis: ['navigator.geolocation.getCurrentPosition()', 'navigator.geolocation.watchPosition()', 'Notification.requestPermission()', 'new Notification()', 'FileReader', 'DataTransfer', 'navigator.clipboard.writeText()', 'navigator.clipboard.readText()', 'navigator.share()', 'event.dataTransfer'],
    related: [
      { label: 'PWA & Service Workers', route: '/html/pwa-service-workers' },
      { label: 'HTML Performance',      route: '/html/performance'         },
      { label: 'Canvas & SVG',          route: '/html/canvas-svg'          },
    ],
    tip: 'Always feature-detect browser APIs before calling them — wrap calls in if ("share" in navigator) or if ("geolocation" in navigator) to avoid runtime errors on unsupported browsers.',
    docs: [
      { label: 'MDN — Geolocation API',  url: 'https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API'  },
      { label: 'MDN — Notifications API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API' },
      { label: 'MDN — File API',         url: 'https://developer.mozilla.org/en-US/docs/Web/API/File_API'          },
      { label: 'MDN — Clipboard API',    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API'     },
    ],
    resources: [
      { label: 'MDN — Web Share API',    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API',    badge: 'docs' },
      { label: 'web.dev — Capabilities', url: 'https://web.dev/explore/capabilities',                              badge: 'blog' },
    ],
    gotchas: [
      'Geolocation, Notifications, and Clipboard readText() all require HTTPS — they silently fail or throw on HTTP origins.',
      'dragover must call event.preventDefault() — without it the drop event never fires.',
      'Notification permission once set to "denied" cannot be re-requested from JavaScript — the user must change it in browser settings.',
    ],
  },

  'html/seo': {
    apis: ['<title>', '<meta name="description">', '<link rel="canonical">', '<meta name="robots">', 'JSON-LD <script>', 'og:title / og:image', 'twitter:card', 'hreflang', 'sitemap.xml', 'Core Web Vitals'],
    related: [
      { label: 'Head & Metadata',       route: '/html/head-metadata'        },
      { label: 'HTML Performance',      route: '/html/performance'          },
      { label: 'PWA & Service Workers', route: '/html/pwa-service-workers'  },
    ],
    tip: 'Test structured data with Google\'s Rich Results Test before deploying — invalid JSON-LD silently fails to produce rich snippets.',
    docs: [
      { label: 'Google — Search Central',       url: 'https://developers.google.com/search/docs'                              },
      { label: 'Schema.org',                    url: 'https://schema.org'                                                      },
      { label: 'Google — Core Web Vitals',      url: 'https://web.dev/articles/vitals'                                        },
    ],
    resources: [
      { label: 'Open Graph Protocol',           url: 'https://ogp.me/',                                          badge: 'docs' },
      { label: 'Google Rich Results Test',      url: 'https://search.google.com/test/rich-results',              badge: 'tool' },
    ],
    gotchas: [
      'Canonical and noindex together: if a page has both, Google will likely drop it from the index — pick one signal.',
      'og:image must be an absolute URL, not a relative path — social crawlers do not resolve relative paths.',
      'hreflang must be reciprocal — every page in the set must link back to all others, or Google ignores the tags.',
    ],
  },

  'html/pwa-service-workers': {
    apis: ['navigator.serviceWorker.register()', 'self.addEventListener("install")', 'self.addEventListener("fetch")', 'caches.open()', 'cache.put()', 'cache.match()', 'skipWaiting()', 'clients.claim()', 'PushManager', 'BackgroundSync'],
    related: [
      { label: 'HTML Performance',  route: '/html/performance'     },
      { label: 'HTML APIs',         route: '/html/apis'            },
      { label: 'HTML SEO',          route: '/html/seo'             },
    ],
    tip: 'Version your cache name (e.g. "app-shell-v2") so the activate event can cleanly delete old caches — unversioned caches grow forever and serve stale assets.',
    docs: [
      { label: 'MDN — Service Worker API',  url: 'https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API'    },
      { label: 'MDN — Cache API',           url: 'https://developer.mozilla.org/en-US/docs/Web/API/Cache'                 },
      { label: 'web.dev — PWA',             url: 'https://web.dev/progressive-web-apps/'                                  },
    ],
    resources: [
      { label: 'Workbox (Google)',          url: 'https://developer.chrome.com/docs/workbox/',                badge: 'tool' },
      { label: 'web.dev — Offline cookbook', url: 'https://web.dev/articles/offline-cookbook',               badge: 'blog' },
    ],
    gotchas: [
      'Service workers only work on HTTPS (or localhost) — HTTP origins will silently fail to register.',
      'The service worker scope is limited to its file location — a SW in /js/ cannot intercept requests from /.',
      'skipWaiting() alone does not take control of open clients — pair it with clients.claim() in the activate event.',
    ],
  },

  'html/performance': {
    apis: ['loading="lazy"', 'fetchpriority="high"', 'rel="preload"', 'rel="prefetch"', 'rel="preconnect"', 'rel="dns-prefetch"', 'defer', 'async', 'rel="modulepreload"', 'content-visibility'],
    related: [
      { label: 'Head & Metadata',  route: '/html/head-metadata'   },
      { label: 'Canvas & SVG',     route: '/html/canvas-svg'      },
      { label: 'PWA & Service Workers', route: '/html/pwa-service-workers' },
    ],
    tip: 'Always add fetchpriority="high" to your above-the-fold hero/LCP image — it is a one-line change that can move LCP by hundreds of milliseconds.',
    docs: [
      { label: 'MDN — Resource hints',      url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload'   },
      { label: 'web.dev — Optimize LCP',    url: 'https://web.dev/articles/optimize-lcp'                                       },
      { label: 'web.dev — fetchpriority',   url: 'https://web.dev/articles/fetch-priority'                                     },
    ],
    resources: [
      { label: 'web.dev — Critical Rendering Path', url: 'https://web.dev/articles/critical-rendering-path', badge: 'blog' },
      { label: 'MDN — content-visibility',          url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility', badge: 'docs' },
    ],
    gotchas: [
      'Preloading too many resources defeats the purpose — only preload the 1-3 resources the browser would not discover early enough on its own.',
      'Font preloads need both as="font" and crossorigin attributes — missing crossorigin causes a double fetch.',
      'async on a script that depends on another async script causes race conditions — use defer or modules instead.',
    ],
  },

  'html/canvas-svg': {
    apis: ['getContext("2d")', 'fillRect()', 'beginPath()', 'arc()', 'fillText()', 'drawImage()', 'requestAnimationFrame()', 'save()/restore()', 'SVG viewBox', '<path d="">'],
    related: [
      { label: 'iFrames & Embeds',   route: '/html/iframes-embeds'  },
      { label: 'HTML Performance',   route: '/html/performance'     },
      { label: 'HTML APIs',          route: '/html/apis'            },
    ],
    tip: 'Set canvas width/height via HTML attributes for pixel resolution — CSS only scales the existing buffer and will cause blur on HiDPI screens.',
    docs: [
      { label: 'MDN — Canvas API',           url: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API'        },
      { label: 'MDN — SVG',                  url: 'https://developer.mozilla.org/en-US/docs/Web/SVG'                   },
      { label: 'MDN — requestAnimationFrame', url: 'https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame' },
    ],
    resources: [
      { label: 'web.dev — Canvas tutorial',  url: 'https://web.dev/articles/canvas-performance', badge: 'blog' },
      { label: 'SVG Tutorial — MDN',         url: 'https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial',        badge: 'docs' },
    ],
    gotchas: [
      'Missing beginPath() causes shapes to share state — the second shape inherits the first\'s path and styles.',
      'Canvas pixel density: multiply canvas.width/height by devicePixelRatio and scale the context to avoid blur on retina screens.',
      'SVG elements created with document.createElement (not createElementNS) will render as unknown HTML, not SVG shapes.',
    ],
  },

  // ── HTML: Web Components ───────────────────────────────────────────────────
  'html/custom-elements': {
    apis: ['customElements.define()', 'attachShadow()', '<template>', '<slot>', 'connectedCallback()', 'observedAttributes'],
    related: [
      { label: 'Document Structure', route: '/html/document-structure' },
      { label: 'HTML APIs',          route: '/html/apis'               },
      { label: 'JavaScript DOM',     route: '/javascript/dom'          },
    ],
    tip: 'Start with autonomous custom elements (extend HTMLElement) — customized built-ins (extend HTMLButtonElement) have poor Safari support and rarely worth the complexity.',
    docs: [
      { label: 'MDN — Web Components',       url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_components' },
      { label: 'Custom Elements Spec',        url: 'https://html.spec.whatwg.org/multipage/custom-elements.html'    },
      { label: 'Shadow DOM Spec',             url: 'https://www.w3.org/TR/shadow-dom/'                             },
    ],
    resources: [
      { label: 'webcomponents.org',   url: 'https://www.webcomponents.org/',                       badge: 'blog' },
      { label: 'Open Web Components', url: 'https://open-wc.org/',                                 badge: 'tool' },
    ],
    gotchas: [
      'super() must be the very first statement in the constructor — any this access before it throws ReferenceError.',
      'template.content.cloneNode(true) is required — appending template.content directly moves the nodes and leaves the template empty for all future instances.',
    ],
  },

  // ── HTML: Accessibility & ARIA ─────────────────────────────────────────────
  'html/accessibility': {
    apis: ['role', 'aria-label', 'aria-labelledby', 'aria-live', 'aria-hidden', 'tabindex'],
    related: [
      { label: 'Semantic Elements',  route: '/html/semantic-elements'  },
      { label: 'HTML Forms',         route: '/html/forms'              },
      { label: 'Document Structure', route: '/html/document-structure' },
    ],
    tip: 'Rule 1 of ARIA: if you can use a native HTML element or attribute with the right semantics, do that instead of adding an ARIA role.',
    docs: [
      { label: 'MDN ARIA Reference',        url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA' },
      { label: 'WCAG 2.1 Guidelines',       url: 'https://www.w3.org/WAI/WCAG21/quickref/' },
      { label: 'WebAIM Contrast Checker',   url: 'https://webaim.org/resources/contrastchecker/' },
    ],
    resources: [
      { label: 'web.dev — Accessibility',   url: 'https://web.dev/accessibility/',                           badge: 'blog' },
      { label: 'a11yproject.com',           url: 'https://www.a11yproject.com/',                             badge: 'blog' },
      { label: 'Axe DevTools (extension)',  url: 'https://www.deque.com/axe/devtools/',                     badge: 'tool' },
    ],
    gotchas: [
      'aria-hidden="true" on a focusable element creates an invisible keyboard trap — screen reader skips it but keyboard does not.',
      'Live regions (aria-live) must already exist in the DOM before content is injected — injecting the region and content simultaneously does not announce.',
    ],
  },

  // ── HTML: New topic pages ─────────────────────────────────────────────────
  'html/fundamentals': {
    apis: ['<!DOCTYPE html>', '<html lang>', '<head>', '<body>', 'void elements', 'block vs inline', 'data-*', 'id', 'class', 'charset'],
    related: [
      { label: 'Document Structure', route: '/html/document-structure' },
      { label: 'Semantic HTML',      route: '/html/semantic-elements'  },
      { label: 'HTML Forms',         route: '/html/forms'              },
    ],
    tip: 'Always declare <!DOCTYPE html> as the very first line — it switches the browser into standards mode and avoids quirks-mode rendering bugs.',
    docs: [
      { label: 'MDN — HTML Basics',         url: 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics' },
      { label: 'MDN — HTML Elements',       url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element'                               },
      { label: 'WHATWG HTML Living Standard', url: 'https://html.spec.whatwg.org/multipage/'                                               },
    ],
    resources: [
      { label: 'web.dev — Learn HTML', url: 'https://web.dev/learn/html', badge: 'blog' },
    ],
    gotchas: [
      'Void elements (img, input, br, hr, meta, link) must NOT have a closing tag — </img> is a parse error in HTML5.',
      'id values must be unique per page — duplicate IDs break querySelector, aria-labelledby, and fragment navigation.',
      'Nesting block elements inside inline elements is invalid — <a><div> will be auto-corrected by the browser in unexpected ways.',
    ],
  },

  'html/headings-paragraphs': {
    apis: ['<h1>–<h6>', '<p>', '<br>', '<strong>', '<em>', '<b>', '<i>', '<small>', '<mark>', '<abbr>', '<blockquote>', '<cite>'],
    related: [
      { label: 'Semantic HTML',        route: '/html/semantic-elements'  },
      { label: 'HTML SEO',             route: '/html/seo'                },
      { label: 'Accessibility & ARIA', route: '/html/accessibility'      },
    ],
    tip: 'Use exactly one <h1> per page for SEO and accessibility — subsequent headings should form a logical outline without skipping levels.',
    docs: [
      { label: 'MDN — Heading elements', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements' },
      { label: 'MDN — <p>',             url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/p'                },
      { label: 'MDN — <strong>',        url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strong'           },
    ],
    resources: [
      { label: 'web.dev — Document and website structure', url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Document_and_website_structure', badge: 'blog' },
    ],
    gotchas: [
      'Never use headings for visual sizing — use CSS. Skipping from h1 to h4 breaks the document outline for screen readers.',
      '<br> should never be used for spacing — use CSS margin-bottom on paragraphs instead.',
      '<b> and <i> are presentational; <strong> and <em> carry semantic weight that affects screen reader tone.',
    ],
  },

  'html/input-types': {
    apis: ['type="email"', 'type="tel"', 'type="url"', 'type="number"', 'type="date"', 'type="range"', 'type="color"', 'type="search"', 'type="file"', 'type="checkbox"', 'autocomplete', 'inputmode'],
    related: [
      { label: 'HTML Forms',           route: '/html/forms'        },
      { label: 'Accessibility & ARIA', route: '/html/accessibility' },
    ],
    tip: 'Use type="email" and type="tel" to get the right mobile keyboard automatically — it costs nothing and significantly improves UX on touch devices.',
    docs: [
      { label: 'MDN — <input> types',    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input' },
      { label: 'MDN — autocomplete',     url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete' },
      { label: 'MDN — inputmode',        url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode' },
    ],
    resources: [
      { label: 'web.dev — Forms best practices', url: 'https://web.dev/articles/payment-and-address-form-best-practices', badge: 'blog' },
    ],
    gotchas: [
      'type="number" with step="any" still rejects non-numeric input — for phone numbers, use type="tel" with pattern validation instead.',
      'type="date" returns the value in ISO 8601 (YYYY-MM-DD) regardless of the locale displayed in the picker.',
      'Browsers may ignore autocomplete="off" for password fields — use a unique field name instead if you need to suppress autofill.',
    ],
  },

  'html/landmark-elements': {
    apis: ['<header>', '<nav>', '<main>', '<aside>', '<footer>', '<section>', '<article>', '<form>', 'role="search"', 'aria-label', 'aria-labelledby'],
    related: [
      { label: 'Semantic HTML',        route: '/html/semantic-elements'  },
      { label: 'Accessibility & ARIA', route: '/html/accessibility'      },
      { label: 'ARIA Roles',           route: '/html/aria-roles'         },
    ],
    tip: 'Add aria-label to every <nav> element when you have more than one on the page — "Primary navigation" vs "Breadcrumb" lets screen reader users quickly identify which is which.',
    docs: [
      { label: 'MDN — ARIA landmark roles', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles#landmark_roles' },
      { label: 'MDN — <main>',              url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/main'                       },
      { label: 'MDN — <nav>',               url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nav'                        },
    ],
    resources: [
      { label: 'W3C — Using ARIA landmarks', url: 'https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/', badge: 'docs' },
      { label: 'a11yproject — Landmark regions', url: 'https://www.a11yproject.com/posts/aria-landmark-roles/', badge: 'blog' },
    ],
    gotchas: [
      'Multiple <main> elements on a page are invalid — there can only be one visible <main> at a time.',
      'Nesting <main> inside <aside> or <header> is invalid — <main> must be a direct child of <body> (or a direct child of a landmark that is a direct child of <body>).',
      '<footer> inside an <article> refers to the article footer, not the page footer — context matters for screen readers.',
    ],
  },

  'html/aria-roles': {
    apis: ['role="button"', 'role="dialog"', 'role="alertdialog"', 'role="alert"', 'role="status"', 'role="tooltip"', 'role="tab"', 'role="tabpanel"', 'aria-expanded', 'aria-controls', 'aria-selected', 'aria-live'],
    related: [
      { label: 'Accessibility & ARIA', route: '/html/accessibility'     },
      { label: 'Landmark Elements',    route: '/html/landmark-elements' },
      { label: 'Focus Management',     route: '/html/focus-management'  },
    ],
    tip: 'The first rule of ARIA: use the native HTML element before adding a role — a <button> beats a <div role="button"> every time (no extra JS needed for keyboard support).',
    docs: [
      { label: 'MDN — ARIA roles',      url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles' },
      { label: 'ARIA in HTML (spec)',    url: 'https://www.w3.org/TR/html-aria/'                                      },
      { label: 'WAI-ARIA 1.2',          url: 'https://www.w3.org/TR/wai-aria-1.2/'                                   },
    ],
    resources: [
      { label: 'W3C ARIA Authoring Practices', url: 'https://www.w3.org/WAI/ARIA/apg/', badge: 'docs' },
      { label: 'Deque — ARIA roles reference', url: 'https://dequeuniversity.com/library/', badge: 'blog' },
    ],
    gotchas: [
      'role="presentation" removes semantics but not focusability — pair it with tabindex="-1" when removing a table used for layout.',
      'aria-live="assertive" interrupts the current screen reader announcement — use it only for time-sensitive alerts, not status messages.',
      'Dynamic ARIA state (aria-expanded, aria-checked) must be updated via JavaScript — the attribute does not self-update on click.',
    ],
  },

  'html/focus-management': {
    apis: ['tabindex', 'focus()', 'blur()', ':focus-visible', ':focus-within', 'focusTrap', 'inert', 'autofocus', 'dialog.showModal()', 'skip link'],
    related: [
      { label: 'ARIA Roles',           route: '/html/aria-roles'        },
      { label: 'Accessibility & ARIA', route: '/html/accessibility'     },
      { label: 'HTML Forms',           route: '/html/forms'             },
    ],
    tip: 'Use <dialog> for modals — the browser natively traps focus and restores it on close, avoiding hundreds of lines of custom focus-trap code.',
    docs: [
      { label: 'MDN — :focus-visible',  url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible' },
      { label: 'MDN — tabindex',        url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex' },
      { label: 'MDN — inert attribute', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert' },
    ],
    resources: [
      { label: 'web.dev — Focus management', url: 'https://web.dev/articles/focus', badge: 'blog' },
      { label: 'a11yproject — Skip navigation', url: 'https://www.a11yproject.com/posts/skip-nav-links/', badge: 'blog' },
    ],
    gotchas: [
      'Never use outline: none without a visible :focus-visible replacement — keyboard users lose their location indicator entirely.',
      'tabindex > 0 creates a separate focus order before the natural DOM order — this almost always creates a confusing tab sequence.',
      'autofocus inside a dialog causes a screen reader to jump to the focused element without context — prefer focusing the dialog heading instead.',
    ],
  },

  'html/storage-apis': {
    apis: ['localStorage.setItem()', 'localStorage.getItem()', 'sessionStorage', 'indexedDB.open()', 'IDBObjectStore', 'document.cookie', 'CookieStore API', 'cache.put()', 'navigator.storage.estimate()'],
    related: [
      { label: 'PWA & Service Workers', route: '/html/pwa-service-workers' },
      { label: 'HTML5 Browser APIs',    route: '/html/apis'                },
      { label: 'HTML Performance',      route: '/html/performance'         },
    ],
    tip: 'Wrap localStorage calls in try/catch — Safari in private mode and storage-full scenarios throw QuotaExceededError that would otherwise crash your app.',
    docs: [
      { label: 'MDN — Web Storage API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API' },
      { label: 'MDN — IndexedDB API',   url: 'https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API'   },
      { label: 'MDN — Cookie API',      url: 'https://developer.mozilla.org/en-US/docs/Web/API/Cookie_Store_API' },
    ],
    resources: [
      { label: 'web.dev — Storage for the web', url: 'https://web.dev/articles/storage-for-the-web', badge: 'blog' },
      { label: 'Dexie.js — IndexedDB wrapper',  url: 'https://dexie.org/',                           badge: 'tool' },
    ],
    gotchas: [
      'localStorage is synchronous and blocks the main thread — for large data, use IndexedDB with an async wrapper like Dexie.',
      'sessionStorage is per-tab, not per-window — opening the same URL in a new tab starts a fresh sessionStorage.',
      'Cookies set without SameSite are treated as SameSite=Lax by modern browsers — cross-site POST requests will not include them.',
    ],
  },

  'html/drag-drop': {
    apis: ['draggable="true"', 'dragstart', 'dragover', 'drop', 'dragend', 'dataTransfer.setData()', 'dataTransfer.getData()', 'dataTransfer.effectAllowed', 'dataTransfer.dropEffect', 'event.preventDefault()'],
    related: [
      { label: 'HTML5 Browser APIs',   route: '/html/apis'    },
      { label: 'HTML5 Storage APIs',   route: '/html/storage-apis' },
      { label: 'Canvas & SVG',         route: '/html/canvas-svg'   },
    ],
    tip: 'Call event.preventDefault() in the dragover handler — without it, the browser handles the drop itself and your drop event never fires.',
    docs: [
      { label: 'MDN — HTML Drag and Drop API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API' },
      { label: 'MDN — DataTransfer',           url: 'https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer'           },
      { label: 'MDN — draggable attribute',    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/draggable' },
    ],
    resources: [
      { label: 'web.dev — Drag and Drop', url: 'https://web.dev/articles/drag-and-drop',             badge: 'blog' },
      { label: 'MDN — Pointer Events (accessible alternative)', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events', badge: 'docs' },
    ],
    gotchas: [
      'The HTML5 DnD API is not keyboard accessible — provide a keyboard-operable alternative (cut/paste, up/down buttons) alongside drag-and-drop.',
      'dataTransfer.setData() must be called in the dragstart handler, not in drop — the data is write-only during dragstart and read-only during drop.',
      'draggable="true" on a link or image conflicts with the browser\'s default drag behaviour — call preventDefault() in dragstart to override it.',
    ],
  },

  // ── SSR + Hydration ─────────────────────────────────────────────────────────
  ssr: {
    apis: ['provideClientHydration()', 'withEventReplay()', 'isPlatformBrowser()', 'PLATFORM_ID', 'TransferState'],
    related: [
      { label: 'PWA / Service Worker', route: '/angular/pwa'        },
      { label: 'Preloading',           route: '/angular/preloading' },
      { label: 'NgOptimizedImage',     route: '/angular/ng-image'   },
    ],
    tip: 'Guard every browser-only API (window, localStorage, navigator) with isPlatformBrowser() — SSR runs in Node.js.',
    docs: [
      { label: 'SSR Guide',              url: 'https://angular.dev/guide/ssr'                             },
      { label: 'Client-side Hydration',  url: 'https://angular.dev/guide/hydration'                      },
      { label: 'TransferState API',      url: 'https://angular.dev/api/core/TransferState'               },
      { label: 'isPlatformBrowser API',  url: 'https://angular.dev/api/common/isPlatformBrowser'         },
    ],
    resources: [
      { label: 'web.dev — SSR Guide',    url: 'https://web.dev/articles/rendering-on-the-web',            badge: 'blog'  },
      { label: 'angular.dev Tutorials',  url: 'https://angular.dev/tutorials',                            badge: 'blog'  },
    ],
    gotchas: [
      'Without hydration, Angular destroys server HTML on bootstrap — causing a flash of unstyled/blank content.',
      'TransferState keys must match exactly on server and client — a mismatch causes a second HTTP request on the client.',
    ],
  },

  // ── Design Patterns: per-page entries ──────────────────────────────────────
  'design-patterns/abstract-factory': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Factory Method',  route: '/design-patterns/factory-method' },
      { label: 'Builder',         route: '/design-patterns/builder' },
      { label: 'Bridge',          route: '/design-patterns/bridge' },
    ],
    tip: 'Abstract Factory guarantees the PRODUCTS created together are compatible with each other — that cross-product compatibility guarantee is the whole point, not just "creating multiple things."',
    gotchas: [
      'Adding a new product TYPE requires touching the factory interface and every concrete factory — adding a new FAMILY only requires one new concrete factory class.',
      'Reach for Abstract Factory only when there are genuinely multiple interchangeable families — for one family, plain Factory Method or direct construction is simpler.',
    ],
  },
  'design-patterns/adapter': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Facade',   route: '/design-patterns/facade' },
      { label: 'Bridge',   route: '/design-patterns/bridge' },
      { label: 'Decorator', route: '/design-patterns/decorator' },
    ],
    tip: 'Object adapter (composition) is almost always the right choice over class adapter (inheritance) — it can wrap ANY implementation of the target interface, not just one known at compile time.',
    gotchas: [
      'An adapter should stay a thin translation layer — business logic creeping into an adapter blurs its purpose.',
      'Adapter vs Facade confusion: Adapter fixes an incompatible interface; Facade simplifies a complex one. They can look similar but solve different problems.',
    ],
  },
  'design-patterns/bridge': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Adapter',   route: '/design-patterns/adapter' },
      { label: 'Abstract Factory', route: '/design-patterns/abstract-factory' },
      { label: 'Strategy',  route: '/design-patterns/strategy' },
    ],
    tip: 'Bridge avoids an N×M class explosion by decoupling abstraction from implementation up front — Adapter is applied AFTER the fact to two already-existing incompatible interfaces.',
    gotchas: [
      'Bridge is only worth its indirection when BOTH abstraction and implementation are genuinely expected to vary independently.',
      'Applying Bridge to a stable, unlikely-to-change hierarchy adds complexity with no payoff.',
    ],
  },
  'design-patterns/builder': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Abstract Factory', route: '/design-patterns/abstract-factory' },
      { label: 'Prototype',        route: '/design-patterns/prototype' },
    ],
    tip: 'Builder exists to replace telescoping constructors — once a class has more than a few optional parameters, especially several of the same type, a fluent builder API is far less error-prone than positional arguments.',
    gotchas: [
      'Builder is the standard way to construct genuinely IMMUTABLE objects with many optional fields.',
      'Named/default parameters in modern languages reduce the need for Builder on simpler cases — reserve it for genuinely complex, validated construction.',
    ],
  },
  'design-patterns/chain-of-responsibility': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Command',   route: '/design-patterns/command' },
      { label: 'Mediator',  route: '/design-patterns/mediator' },
      { label: 'Decorator', route: '/design-patterns/decorator' },
    ],
    tip: 'HTTP middleware pipelines are the canonical real-world Chain of Responsibility — each handler decides independently whether to process, pass along, or short-circuit the chain.',
    gotchas: [
      'A chain with no handler willing to process a request needs an explicit strategy (default terminal handler or an unhandled signal) — silently dropping requests is a common bug.',
      'Reordering handlers only requires changing the chain\'s wiring, not the handler classes themselves.',
    ],
  },
  'design-patterns/clean-architecture': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Dependency Inversion', route: '/design-patterns/dependency-inversion' },
      { label: 'Repository',           route: '/design-patterns/repository' },
      { label: 'CQRS',                 route: '/design-patterns/cqrs' },
    ],
    tip: 'Treat each use case (PlaceOrder, CancelSubscription) as an explicit, named class — this makes the application\'s actual capabilities discoverable by scanning a folder, without reading implementation details.',
    gotchas: [
      'Clean Architecture\'s ceremony (more files, more interfaces) only pays off for applications with genuinely complex business logic expected to outlive any framework choice.',
      'The testability benefit only materializes if the team actually keeps business logic out of the outer layers — the structure alone does not enforce it.',
    ],
  },
  'design-patterns/command': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Chain of Responsibility', route: '/design-patterns/chain-of-responsibility' },
      { label: 'Memento',                 route: '/design-patterns/memento' },
      { label: 'Composite',               route: '/design-patterns/composite' },
    ],
    tip: 'Encapsulating a request as an object is what enables undo/redo and task queues — the request becomes a first-class value that can be stored, logged, and executed later, not just an immediate method call.',
    gotchas: [
      'Undo requires each Command to know its own inverse — not every operation (like sending an email) has a clean, safe undo.',
      'Macro commands combine Command with Composite so a multi-step operation can be undone as one atomic unit.',
    ],
  },
  'design-patterns/composite': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Iterator',  route: '/design-patterns/iterator' },
      { label: 'Decorator', route: '/design-patterns/decorator' },
      { label: 'Visitor',   route: '/design-patterns/visitor' },
    ],
    tip: 'Composite\'s value is treating a single leaf and a whole group through the SAME interface — client code calling render() never needs to check "is this a leaf or a group."',
    gotchas: [
      'Whether add/remove methods live on the shared Component interface (uniform, less safe) or only on Composite (safer, breaks uniformity) is a recurring design tension.',
      'Composite fits genuinely tree-shaped data — applying it to flat data adds structure with no benefit.',
    ],
  },
  'design-patterns/cqrs': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Event Sourcing', route: '/design-patterns/event-sourcing' },
      { label: 'Repository',     route: '/design-patterns/repository' },
      { label: 'Saga',           route: '/design-patterns/saga' },
    ],
    tip: 'CQRS can be applied at different granularities — a lightweight version (separate command/query classes, same database) captures most of the organizational benefit without the operational cost of fully separate read/write stores.',
    gotchas: [
      'Full CQRS with separate stores introduces eventual consistency — a write may not be immediately visible in the read model.',
      'Applying full CQRS to simple CRUD screens with no real read/write divergence adds overhead without benefit.',
    ],
  },
  'design-patterns/decorator': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Proxy',    route: '/design-patterns/proxy' },
      { label: 'Composite', route: '/design-patterns/composite' },
      { label: 'Strategy', route: '/design-patterns/strategy' },
    ],
    tip: 'Decorator avoids the subclass explosion of adding every optional-behavior combination as its own class — behaviors compose dynamically at runtime instead of being fixed at compile time.',
    gotchas: [
      'A decorator must implement the SAME interface as what it wraps — callers should not be able to tell how many layers of decoration are present.',
      'Decorating behaviors that are actually always needed together adds unneeded indirection — the pattern earns its keep when behaviors are genuinely independently optional.',
    ],
  },
  'design-patterns/dependency-inversion': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'SOLID',            route: '/design-patterns/solid' },
      { label: 'Clean Architecture', route: '/design-patterns/clean-architecture' },
      { label: 'Repository',       route: '/design-patterns/repository' },
    ],
    tip: 'DIP inverts the DEFAULT dependency direction — instead of high-level business logic depending on low-level infrastructure, both depend on a shared abstraction that infrastructure implements.',
    gotchas: [
      'DIP is a design principle about dependency DIRECTION — dependency injection is just one common technique for wiring dependencies that follow it.',
      'Depending directly on a concrete class (SqlDatabase) instead of an interface locks business logic to that specific infrastructure choice.',
    ],
  },
  'design-patterns/dry-kiss-yagni': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'SOLID', route: '/design-patterns/solid' },
      { label: 'GRASP', route: '/design-patterns/grasp' },
    ],
    tip: 'The "rule of three" — wait until a pattern repeats three times before extracting a shared abstraction — guards against premature DRY on code that looks similar today but represents genuinely different concepts that will diverge.',
    gotchas: [
      'DRY applies to KNOWLEDGE and business rules, not merely to code that happens to look textually similar.',
      'A shared abstraction created too early tends to accumulate special-case branches as new requirements reveal it wasn\'t as universal as assumed.',
    ],
  },
  'design-patterns/event-sourcing': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'CQRS',    route: '/design-patterns/cqrs' },
      { label: 'Outbox',  route: '/design-patterns/outbox' },
      { label: 'Saga',    route: '/design-patterns/saga' },
    ],
    tip: 'Event sourcing stores every state-changing event as the system of record — current state is derived by replaying events, giving a complete audit trail as a natural byproduct.',
    gotchas: [
      'Because events are permanent, their schema effectively becomes immutable once written — plan for upcasting or versioned event types upfront.',
      'GDPR right-to-erasure conflicts with immutable events — techniques like crypto-shredding address this tension.',
    ],
  },
  'design-patterns/facade': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Adapter', route: '/design-patterns/adapter' },
      { label: 'Mediator', route: '/design-patterns/mediator' },
    ],
    tip: 'A Facade does not need to expose every capability of the underlying subsystem — it deliberately exposes a simplified subset covering common use cases while still allowing direct access for callers that need more.',
    gotchas: [
      'Facade vs Adapter: Facade simplifies a complex subsystem; Adapter fixes an incompatible interface. Similar shape, different intent.',
      'A Facade accumulating real business logic of its own has effectively become a service, not just a coordination layer.',
    ],
  },
  'design-patterns/factory-method': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Abstract Factory', route: '/design-patterns/abstract-factory' },
      { label: 'Prototype',        route: '/design-patterns/prototype' },
    ],
    tip: 'Factory Method lets new product types be added via a new subclass, with zero changes to existing creation code — a direct application of the Open/Closed Principle.',
    gotchas: [
      'Without it, adding a new type usually means modifying a shared if/else or switch statement, risking regression in existing types.',
      'For a fixed, unlikely-to-grow set of types, a simple factory function is often sufficient without subclass-based extension.',
    ],
  },
  'design-patterns/flyweight': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Composite',  route: '/design-patterns/composite' },
      { label: 'Object Pool', route: '/design-patterns/object-pool' },
    ],
    tip: 'Flyweight splits state into intrinsic (shared, stored once) and extrinsic (context-specific, supplied by the caller) — only intrinsic state is actually shared between instances.',
    gotchas: [
      'A Flyweight factory must deduplicate identical intrinsic state via caching — without it there is no actual memory benefit.',
      'Only worth the added API complexity when a system creates a genuinely large number of similar objects.',
    ],
  },
  'design-patterns/grasp': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'SOLID',  route: '/design-patterns/solid' },
      { label: 'DRY/KISS/YAGNI', route: '/design-patterns/dry-kiss-yagni' },
    ],
    tip: 'Information Expert answers "which class should own this method?" by favoring the class that already holds the relevant data — many GoF patterns implicitly follow this even though GRASP predates and generalizes beyond them.',
    gotchas: [
      'Low Coupling and High Cohesion are the underlying justification for WHY patterns like Facade and Observer are considered good design.',
      'GRASP principles help evaluate whether a named pattern genuinely fits a situation, or would actually increase coupling.',
    ],
  },
  'design-patterns/iterator': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Composite', route: '/design-patterns/composite' },
      { label: 'Visitor',   route: '/design-patterns/visitor' },
    ],
    tip: 'Iterator decouples traversal from the collection\'s implementation — client code depends only on the Iterator interface, so the underlying data structure can change without breaking any traversal code.',
    gotchas: [
      'Most modern languages bake iterator protocols directly into the language (for...of, IEnumerable) — the pattern has largely become invisible infrastructure.',
      'External iterators give the caller pacing control; internal iterators (forEach) are simpler but offer less control.',
    ],
  },
  'design-patterns/mediator': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Observer', route: '/design-patterns/observer' },
      { label: 'Facade',   route: '/design-patterns/facade' },
    ],
    tip: 'Mediator centralizes many-to-many communication into one coordinator — colleague objects only know about the Mediator, reducing N-squared direct relationships down to N.',
    gotchas: [
      'A Mediator can become a large, complex class itself if it accumulates too much coordination logic — this is the concentrated-complexity tradeoff.',
      'Mediator vs Observer: Mediator coordinates a fixed, known set of colleagues with specific rules; Observer supports an open-ended number of generic subscribers.',
    ],
  },
  'design-patterns/memento': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Command', route: '/design-patterns/command' },
      { label: 'Prototype', route: '/design-patterns/prototype' },
    ],
    tip: 'Memento preserves encapsulation while enabling undo — the Originator creates an opaque snapshot that the Caretaker stores without ever inspecting or modifying its contents.',
    gotchas: [
      'Deep-copying large object graphs for every undo step can have real memory implications — production undo often stores diffs instead of full snapshots.',
      'The Caretaker never interprets the Memento\'s contents — that boundary is what preserves the Originator\'s encapsulation.',
    ],
  },
  'design-patterns/null-object': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Strategy',  route: '/design-patterns/strategy' },
      { label: 'Decorator', route: '/design-patterns/decorator' },
    ],
    tip: 'Null Object replaces "might return null" with a real no-op object implementing the same interface — this shifts defensive null-checking to ONE place instead of scattering it across every call site.',
    gotchas: [
      'When the ABSENCE of a value is itself meaningful information a caller must react to, an explicit Optional/null check communicates that more honestly than a silent no-op.',
      'Overusing Null Object can hide genuine errors that a caller should have been alerted to.',
    ],
  },
  'design-patterns/object-pool': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Flyweight', route: '/design-patterns/flyweight' },
      { label: 'Singleton', route: '/design-patterns/singleton' },
    ],
    tip: 'Object Pool is only worth its bookkeeping when object creation is GENUINELY expensive relative to how often objects are needed — database connections, not simple value objects.',
    gotchas: [
      'Pooled objects must be properly reset before reuse — leftover state from a previous user is a common and serious bug source.',
      'Modern generational garbage collectors have reduced how broadly necessary this pattern is for ordinary allocation.',
    ],
  },
  'design-patterns/observer': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Mediator', route: '/design-patterns/mediator' },
      { label: 'State',    route: '/design-patterns/state' },
    ],
    tip: 'Choosing push (subject sends full data) vs pull (subject just signals "something changed," observer queries for details) is a real tradeoff between simplicity and flexibility for varied observer needs.',
    gotchas: [
      'Subscribers that forget to unsubscribe are a classic memory leak source — the subject holds a reference preventing garbage collection.',
      'Many subscribers with frequent notifications can create real performance concerns at scale.',
    ],
  },
  'design-patterns/outbox': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Event Sourcing', route: '/design-patterns/event-sourcing' },
      { label: 'Saga',           route: '/design-patterns/saga' },
      { label: 'CQRS',           route: '/design-patterns/cqrs' },
    ],
    tip: 'Outbox solves the dual-write problem by writing the intended external notification within the SAME local transaction as the business data change — both commit together or neither does.',
    gotchas: [
      'A separate relay process is still needed to actually publish outbox rows — the pattern guarantees atomicity locally, not end-to-end delivery by itself.',
      'This "record intent atomically, execute asynchronously" structure generalizes beyond messaging to any local-plus-external-side-effect scenario.',
    ],
  },
  'design-patterns/prototype': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Builder',        route: '/design-patterns/builder' },
      { label: 'Abstract Factory', route: '/design-patterns/abstract-factory' },
    ],
    tip: 'Prototype creates objects by CLONING an existing configured instance rather than constructing from scratch — valuable when construction is expensive and a similar instance already exists.',
    gotchas: [
      'Shallow vs deep clone is the critical detail — a shallow clone shares references to nested mutable objects, causing surprising cross-clone mutation.',
      'Less needed in languages/frameworks with efficient construction and DI — remains valuable when construction is genuinely expensive.',
    ],
  },
  'design-patterns/proxy': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Decorator', route: '/design-patterns/decorator' },
      { label: 'Facade',    route: '/design-patterns/facade' },
    ],
    tip: 'Virtual, protection, and remote proxies all share the same structural idea (implement the same interface, control access) but differ in WHY that control is needed — lazy init, authorization, or network transparency.',
    gotchas: [
      'A virtual proxy defers expensive object creation until first actual use — do not confuse this with caching, which is a different concern.',
      'Choose the specific proxy variant based on the actual reason access needs controlling, not as a generic wrapper habit.',
    ],
  },
  'design-patterns/repository': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Unit of Work',     route: '/design-patterns/unit-of-work' },
      { label: 'Specification',    route: '/design-patterns/specification' },
      { label: 'Dependency Inversion', route: '/design-patterns/dependency-inversion' },
    ],
    tip: 'Repository presents a collection-like interface over persistence, hiding the actual storage technology — this is what makes business logic testable with an in-memory fake instead of a real database.',
    gotchas: [
      'A "leaky" Repository exposing IQueryable directly defeats the abstraction, coupling callers to the specific query engine.',
      'Repository should generally operate at the AGGREGATE level, not per individual entity or table.',
    ],
  },
  'design-patterns/saga': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Outbox',        route: '/design-patterns/outbox' },
      { label: 'Event Sourcing', route: '/design-patterns/event-sourcing' },
      { label: 'CQRS',          route: '/design-patterns/cqrs' },
    ],
    tip: 'A Saga coordinates a sequence of local transactions with COMPENSATING transactions for rollback — replacing atomicity a single distributed transaction would provide with an explicit, application-level recovery mechanism.',
    gotchas: [
      'Not every operation has a clean compensating action — sending an email cannot be truly "unsent."',
      'Orchestration (central coordinator) vs choreography (event reactions, no coordinator) trades debuggability against decoupling.',
    ],
  },
  'design-patterns/singleton': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Object Pool', route: '/design-patterns/object-pool' },
      { label: 'Dependency Inversion', route: '/design-patterns/dependency-inversion' },
    ],
    tip: 'A DI container\'s singleton-scoped registration achieves the same "one shared instance" behavior WITHOUT the global static access point — this is why Singleton is often considered an anti-pattern today.',
    gotchas: [
      'Global static access makes code depending on it hard to unit test — you cannot easily substitute a test double for getInstance().',
      'Global mutable state on a Singleton creates hidden coupling between otherwise unrelated parts of a codebase.',
    ],
  },
  'design-patterns/solid': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Dependency Inversion', route: '/design-patterns/dependency-inversion' },
      { label: 'GRASP',                route: '/design-patterns/grasp' },
      { label: 'Clean Architecture',   route: '/design-patterns/clean-architecture' },
    ],
    tip: 'The five SOLID principles reinforce each other — a class violating Single Responsibility typically also becomes harder to extend without modification, since its entangled responsibilities resist clean extension.',
    gotchas: [
      'Dependency Inversion is often what makes the other four practically achievable at scale.',
      'SOLID principles are heuristics for managing growing complexity, not rules to dogmatically apply to every small, stable class.',
    ],
  },
  'design-patterns/specification': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Repository', route: '/design-patterns/repository' },
      { label: 'Strategy',   route: '/design-patterns/strategy' },
    ],
    tip: 'Specification encapsulates a business rule as a reusable, composable object — And/Or/Not combinators let complex rules be built from simpler, individually-testable pieces.',
    gotchas: [
      'The same Specification can filter an in-memory collection and (with more effort) translate into a database query — a powerful reuse benefit with real implementation cost on the query side.',
      'New rule combinations should ideally be expressed by combining EXISTING specifications rather than writing new bespoke conditionals.',
    ],
  },
  'design-patterns/state': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Strategy',  route: '/design-patterns/strategy' },
      { label: 'Observer',  route: '/design-patterns/observer' },
    ],
    tip: 'State pattern extracts each behavioral mode into its own class — eliminating the sprawling switch-statement-per-method pattern that otherwise scatters one state\'s logic across many methods.',
    gotchas: [
      'State transitions become explicit and traceable when centralized in state classes, rather than implicit in scattered conditional checks.',
      'State vs Strategy: State represents an object\'s self-managed behavioral mode over its lifecycle; Strategy represents an externally-selected algorithm variant.',
    ],
  },
  'design-patterns/strategy': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'State',          route: '/design-patterns/state' },
      { label: 'Template Method', route: '/design-patterns/template-method' },
    ],
    tip: 'Strategy lets an algorithm be swapped at RUNTIME rather than hardcoded — adding a new variant only requires a new class, with zero changes to code that already uses strategies (Open/Closed in action).',
    gotchas: [
      'In languages with first-class functions, simple strategies can be plain functions/lambdas — no full class hierarchy required.',
      'Strategy avoids large conditional blocks that select behavior based on a type flag.',
    ],
  },
  'design-patterns/template-method': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Strategy', route: '/design-patterns/strategy' },
      { label: 'Factory Method', route: '/design-patterns/factory-method' },
    ],
    tip: 'Template Method fixes the algorithm\'s SKELETON in a base class while subclasses override specific steps — the inverse of Strategy, which swaps the whole algorithm via composition instead.',
    gotchas: [
      'The "Hollywood Principle" — the base class calls INTO subclass hooks, not the other way around — is Template Method\'s inversion of control.',
      'Every subclass overriding hooks is implicitly coupled to the base class\'s exact algorithm sequence, a real cost if that skeleton needs to evolve.',
    ],
  },
  'design-patterns/unit-of-work': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Repository', route: '/design-patterns/repository' },
      { label: 'CQRS',       route: '/design-patterns/cqrs' },
    ],
    tip: 'Unit of Work tracks all changes across potentially multiple Repositories and commits them together as one atomic transaction — many ORMs (like Entity Framework\'s DbContext) implement this pattern implicitly.',
    gotchas: [
      'Without Unit of Work, independent repository commits risk a partially-applied change set if one operation fails partway.',
      'Repository abstracts HOW objects persist; Unit of Work coordinates WHEN a batch of changes commits together.',
    ],
  },
  'design-patterns/visitor': {
    apis: DP_DEFAULT.apis, docs: DP_DEFAULT.docs, resources: DP_DEFAULT.resources,
    related: [
      { label: 'Iterator',  route: '/design-patterns/iterator' },
      { label: 'Composite', route: '/design-patterns/composite' },
    ],
    tip: 'Visitor lets you add a new OPERATION over a class hierarchy without modifying those classes — the tradeoff is the inverse of Strategy: new operations are easy, new element types are hard (every visitor needs a new visit method).',
    gotchas: [
      'Double dispatch (element.accept(visitor) calling visitor.visit(this)) is what selects the right type-specific method based on BOTH types at once.',
      'Best for a stable set of element types needing many operations added over time — not for element hierarchies expected to grow frequently.',
    ],
  },

  // ── Architecture Patterns: per-page entries ────────────────────────────────
  'arch-patterns/ddd-core': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Bounded Contexts',            route: '/arch-patterns/bounded-contexts' },
      { label: 'Aggregates & Domain Events',  route: '/arch-patterns/aggregates-domain-events' },
      { label: 'Anti-Corruption Layer',       route: '/arch-patterns/anti-corruption-layer' },
    ],
    tip: 'Ubiquitous language means using the SAME precise terminology in code and in conversations with domain experts — scoped to a single bounded context, since the same word can mean something different in another context.',
    gotchas: [
      'Entities have identity that persists across changes; Value Objects are defined entirely by their values and should be immutable.',
      'Modeling something that should be a Value Object (like an Address) as an Entity adds unnecessary identity-tracking complexity.',
    ],
  },
  'arch-patterns/bounded-contexts': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'DDD Core',              route: '/arch-patterns/ddd-core' },
      { label: 'Anti-Corruption Layer', route: '/arch-patterns/anti-corruption-layer' },
      { label: 'Microservices Principles', route: '/arch-patterns/microservices-principles' },
    ],
    tip: 'A single term like "Customer" often means genuinely different things in different parts of a system — a bounded context boundary is where a model and its ubiquitous language apply consistently, not beyond.',
    gotchas: [
      'Context boundaries should align with actual team boundaries (Conway\'s Law) — a boundary cutting across one team\'s work creates unnecessary coordination overhead.',
      'Getting context boundaries wrong is expensive to fix later, since data and behavior entangle across the incorrect boundary over time.',
    ],
  },
  'arch-patterns/anti-corruption-layer': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Bounded Contexts',   route: '/arch-patterns/bounded-contexts' },
      { label: 'Strangler Fig',      route: '/arch-patterns/strangler-fig' },
    ],
    tip: 'An ACL translates between an external system\'s model and your own at the boundary, preventing the external system\'s naming and quirks from polluting a carefully designed domain model.',
    gotchas: [
      'Reserve an ACL for boundaries with genuinely different, non-negotiable external models — not every internal integration needs one.',
      'ACLs are especially valuable during a strangler-fig migration, isolating the new codebase from legacy quirks.',
    ],
  },
  'arch-patterns/api-gateway-pattern': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Backend for Frontend', route: '/arch-patterns/backend-for-frontend' },
      { label: 'Service Communication', route: '/arch-patterns/service-communication' },
    ],
    tip: 'Centralizing cross-cutting concerns (auth, rate limiting, TLS termination) at the gateway avoids duplicating that logic across every microservice — but the gateway becomes a single point of failure that must be designed for resilience.',
    gotchas: [
      'Business logic creeping into the gateway beyond routing/cross-cutting concerns recreates the tight coupling microservices were meant to avoid.',
      'Gateway aggregation introduces a new failure mode — decide explicitly whether a failed partial call fails the whole request or degrades gracefully.',
    ],
  },
  'arch-patterns/backend-for-frontend': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'API Gateway',    route: '/arch-patterns/api-gateway-pattern' },
      { label: 'Service Communication', route: '/arch-patterns/service-communication' },
    ],
    tip: 'A BFF is a dedicated backend tailored to ONE client type\'s needs — avoiding the "lowest common denominator" API design a single shared gateway tends toward when serving very different client types.',
    gotchas: [
      'BFFs are typically owned by the SAME team as the corresponding frontend, not a separate backend team.',
      'Overusing BFFs for client types that don\'t actually diverge significantly adds operational overhead without benefit.',
    ],
  },
  'arch-patterns/circuit-breaker': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Sidecar & Service Mesh', route: '/arch-patterns/sidecar-service-mesh' },
      { label: 'Service Communication',  route: '/arch-patterns/service-communication' },
    ],
    tip: 'The three states — Closed, Open, Half-Open — let a circuit breaker fast-fail once a failure threshold is hit, preventing requests from piling up against an already-struggling service.',
    gotchas: [
      'Aggressive retries combined with a circuit breaker can overwhelm a struggling service further if applied without care — wrap retries INSIDE the circuit breaker, not the other way around.',
      'An open circuit needs a graceful fallback (cached/default data) to actually improve user experience, not just protect the system.',
    ],
  },
  'arch-patterns/clean-architecture': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Hexagonal Architecture', route: '/arch-patterns/hexagonal-architecture' },
      { label: 'DDD Core',               route: '/arch-patterns/ddd-core' },
    ],
    tip: 'The Dependency Rule — dependencies point INWARD only — is what keeps core business logic independent of framework and database choices, tested without any infrastructure at all.',
    gotchas: [
      'The ceremony (more files, more interfaces) only pays off for applications with genuinely complex business logic expected to outlive framework choices.',
      'A simple CRUD app with minimal business logic often does not need the full layering.',
    ],
  },
  'arch-patterns/cqrs-event-sourcing': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Inbox/Outbox',    route: '/arch-patterns/inbox-outbox' },
      { label: 'Saga Choreography', route: '/arch-patterns/saga-choreography' },
    ],
    tip: 'CQRS and event sourcing are often discussed together but are independently adoptable — CQRS addresses model separation, event sourcing addresses how state changes are stored and replayed.',
    gotchas: [
      'Event sourcing adds genuine complexity (schema evolution, eventual consistency between log and read models) — appropriate where the audit trail and temporal queries are genuinely valuable.',
      'Snapshotting avoids replaying an aggregate\'s entire history every time current state is needed.',
    ],
  },
  'arch-patterns/event-driven': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Saga Choreography', route: '/arch-patterns/saga-choreography' },
      { label: 'Inbox/Outbox',      route: '/arch-patterns/inbox-outbox' },
    ],
    tip: 'Event notification (thin, requires callback) vs event-carried state transfer (fat, self-sufficient) is a real design tradeoff — many production systems use a hybrid of the two.',
    gotchas: [
      'Tracing a business process across async event handlers requires distributed tracing with correlation IDs — there is no single call stack to follow.',
      'Event ordering and timing at scale is expected to be inconsistent — application logic must explicitly account for this, not treat it as an edge case.',
    ],
  },
  'arch-patterns/hexagonal-architecture': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Clean Architecture',    route: '/arch-patterns/clean-architecture' },
      { label: 'Dependency Inversion',  route: '/arch-patterns/dependency-inversion' },
    ],
    tip: 'Ports (interfaces the core defines) and adapters (implementations connecting to specific tech) let you swap infrastructure — like a payment provider — with zero changes to the application core.',
    gotchas: [
      'Hexagonal Architecture and Clean Architecture share the same fundamental goal — largely equivalent in practice, differing mainly in terminology.',
      'Adapters still need their own integration tests — hexagonal architecture isolates WHERE integration testing happens, it does not eliminate the need for it.',
    ],
  },
  'arch-patterns/inbox-outbox': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Event-Driven',      route: '/arch-patterns/event-driven' },
      { label: 'Saga Choreography', route: '/arch-patterns/saga-choreography' },
    ],
    tip: 'Outbox (producer side) and inbox (consumer side) together achieve effectively-once processing across an async flow, even though the underlying broker only guarantees at-least-once delivery.',
    gotchas: [
      'The inbox table needs a retention/cleanup policy just like idempotency keys — retaining every processed message ID forever is unnecessary.',
      'Both patterns rely on the same core mechanism: atomically combining a DB state change with a messaging operation within one local transaction.',
    ],
  },
  'arch-patterns/layered-architecture': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Clean Architecture', route: '/arch-patterns/clean-architecture' },
      { label: 'Vertical Slice',     route: '/arch-patterns/vertical-slice' },
    ],
    tip: 'Classic layered architecture enforces that each layer only calls the layer directly below it — presentation should never directly query the database, bypassing business logic\'s validation.',
    gotchas: [
      '"Layer skipping" (a presentation component directly hitting data access for a "quick" read) erodes the guarantee that business rules are consistently applied.',
      'Layering constrains the VERTICAL dependency direction but does nothing to organize horizontal structure within a layer, which is where real complexity accumulates at scale.',
    ],
  },
  'arch-patterns/microservices-principles': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Monolith vs Modular', route: '/arch-patterns/monolith-vs-modular' },
      { label: 'Service Discovery',   route: '/arch-patterns/service-discovery' },
    ],
    tip: 'The single defining property of a genuine microservice is INDEPENDENT DEPLOYABILITY — a system split into many small services that must all deploy together isn\'t actually achieving microservices\' core benefit.',
    gotchas: [
      'Database-per-service is a strict consequence of independent deployability — a shared database silently reintroduces deployment coupling.',
      'Conway\'s Law means microservices work best when service boundaries align with actual team boundaries.',
    ],
  },
  'arch-patterns/monolith-vs-modular': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Microservices Principles', route: '/arch-patterns/microservices-principles' },
      { label: 'Vertical Slice',           route: '/arch-patterns/vertical-slice' },
    ],
    tip: 'A modular monolith enforces clear module boundaries within ONE deployable unit — capturing much of microservices\' organizational clarity without distributed-systems operational complexity.',
    gotchas: [
      'Splitting into microservices without one of the genuine driving needs (scaling divergence, deployment cadence, tech diversity) usually adds complexity without benefit.',
      'Module boundaries in a monolith are far cheaper to refactor than service boundaries once real network contracts exist between separate services.',
    ],
  },
  'arch-patterns/saga-choreography': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Inbox/Outbox',   route: '/arch-patterns/inbox-outbox' },
      { label: 'Event-Driven',   route: '/arch-patterns/event-driven' },
    ],
    tip: 'In choreography, each service reacts to events with no central coordinator — the overall business process emerges from the sum of local reactions rather than being explicitly defined anywhere.',
    gotchas: [
      'Choreography works best for simple, linear sagas — as step count grows, the implicit distributed flow becomes genuinely harder to trace and debug than orchestration.',
      'A saga failing partway through can be hard to detect without a lightweight observability projection, since no single component tracks the full expected sequence.',
    ],
  },
  'arch-patterns/service-communication': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Sidecar & Service Mesh', route: '/arch-patterns/sidecar-service-mesh' },
      { label: 'Circuit Breaker',        route: '/arch-patterns/circuit-breaker' },
    ],
    tip: 'Choosing sync vs async communication per interaction should be driven by whether an immediate response is genuinely required — most real systems use BOTH styles for different interactions.',
    gotchas: [
      'Synchronous calls couple the caller\'s availability directly to the callee\'s — a slow downstream service degrades the caller too.',
      'A service mesh moves resilience/observability into infrastructure but adds real per-call latency and operational overhead.',
    ],
  },
  'arch-patterns/service-discovery': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Microservices Principles', route: '/arch-patterns/microservices-principles' },
      { label: 'Sidecar & Service Mesh',   route: '/arch-patterns/sidecar-service-mesh' },
    ],
    tip: 'Client-side discovery gives the caller full load-balancing control; server-side discovery (like Kubernetes Services) is simpler for the client at the cost of an extra network hop.',
    gotchas: [
      'A registry is only as useful as the accuracy of its health information — routing to a registered-but-unhealthy instance defeats the purpose.',
      'Liveness and readiness checks answer different questions — a service can be alive but not yet ready to accept traffic.',
    ],
  },
  'arch-patterns/service-oriented': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Microservices Principles', route: '/arch-patterns/microservices-principles' },
      { label: 'API Gateway',              route: '/arch-patterns/api-gateway-pattern' },
    ],
    tip: 'Classic SOA\'s Enterprise Service Bus tended to accumulate business logic over time, becoming a bottleneck — microservices deliberately reacted against this with "smart endpoints, dumb pipes."',
    gotchas: [
      'Contract-first design (WSDL then, OpenAPI/protobuf now) is a shared practice across both eras — the discipline matters more than the specific technology.',
      'An ESB-heavy SOA and a microservices system can look superficially similar while having very different maintainability characteristics.',
    ],
  },
  'arch-patterns/sidecar-service-mesh': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Circuit Breaker',       route: '/arch-patterns/circuit-breaker' },
      { label: 'Service Communication', route: '/arch-patterns/service-communication' },
    ],
    tip: 'A sidecar shares its Pod\'s network namespace, letting it transparently intercept all traffic — cross-cutting concerns (mTLS, retries, observability) can be upgraded via the sidecar without touching application code.',
    gotchas: [
      'The sidecar pattern trades resource overhead (an extra container per Pod) for this separation of concerns — measurable at scale.',
      'Automatic mTLS enforcement underlies a zero-trust model where no service is implicitly trusted just for being inside the perimeter.',
    ],
  },
  'arch-patterns/strangler-fig': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Anti-Corruption Layer', route: '/arch-patterns/anti-corruption-layer' },
      { label: 'Monolith vs Modular',   route: '/arch-patterns/monolith-vs-modular' },
    ],
    tip: 'A routing facade lets traffic migrate incrementally — feature by feature — to a new system instead of requiring the new system to reach full parity before a risky one-shot cutover.',
    gotchas: [
      'The facade itself becomes critical infrastructure during migration — a routing mistake can send traffic to the wrong system or neither.',
      'The pattern has a natural completion state — once every route is migrated, the legacy system and facade can be decommissioned.',
    ],
  },
  'arch-patterns/vertical-slice': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'Layered Architecture', route: '/arch-patterns/layered-architecture' },
      { label: 'CQRS/Event Sourcing',  route: '/arch-patterns/cqrs-event-sourcing' },
    ],
    tip: 'Vertical slices group all the code for one feature together — understanding or modifying a feature touches ONE location instead of navigating across horizontal layers full of unrelated features.',
    gotchas: [
      'Some duplication across slices is an accepted tradeoff — the pattern favors feature independence over eliminating every instance of code similarity.',
      'Pairs naturally with CQRS/mediator — each feature becomes a single Command or Query handler with a consistent, predictable shape.',
    ],
  },
  'arch-patterns/aggregates-domain-events': {
    apis: ARCH_DEFAULT.apis, docs: ARCH_DEFAULT.docs, resources: ARCH_DEFAULT.resources,
    related: [
      { label: 'DDD Core',        route: '/arch-patterns/ddd-core' },
      { label: 'CQRS/Event Sourcing', route: '/arch-patterns/cqrs-event-sourcing' },
      { label: 'Inbox/Outbox',    route: '/arch-patterns/inbox-outbox' },
    ],
    tip: 'An aggregate defines a transactional consistency boundary — invariants are enforced WITHIN one aggregate\'s transaction, never spanning multiple aggregates in a single atomic operation.',
    gotchas: [
      'Reference other aggregates by ID, not direct object reference — this keeps aggregates small and independently persistable.',
      'When a rule spans multiple aggregates, a domain event published AFTER the originating transaction commits achieves eventual consistency without violating the boundary.',
    ],
  },

  // ── Containers/K8s: per-page entries ───────────────────────────────────────
  'containers/fundamentals': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Dockerfile',     route: '/containers/dockerfile' },
      { label: 'Docker Images',  route: '/containers/docker-images' },
      { label: 'Docker CLI',     route: '/containers/docker-cli' },
    ],
    tip: 'Each Dockerfile instruction that modifies the filesystem produces a new read-only layer, stacked via a union filesystem — this is why ordering instructions least-to-most frequently changing matters for build cache reuse.',
    gotchas: [
      'A container\'s writable layer (copy-on-write) is destroyed on docker rm — volumes are the only way to persist data across container recreation.',
      'Deleting files in a later layer does not reclaim space from an earlier layer — bloat persists in the image regardless.',
    ],
  },
  'containers/dockerfile': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Multi-Stage Builds', route: '/containers/multi-stage' },
      { label: 'Docker Images',      route: '/containers/docker-images' },
    ],
    tip: 'Docker caches each instruction\'s resulting layer — a single change anywhere in a layer invalidates the cache for that layer AND every layer after it, which is why frequently-changing COPY . . should come late, not early.',
    gotchas: [
      'CI build caching (--cache-from, BuildKit remote cache) extends this same layer-caching benefit across separate ephemeral CI runs.',
      'Combining related RUN commands into a single layer (using && chains) avoids leaving unreachable bloat in earlier layers.',
    ],
  },
  'containers/multi-stage': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Dockerfile',          route: '/containers/dockerfile' },
      { label: 'Container Security',  route: '/containers/container-security' },
    ],
    tip: 'Multi-stage builds reduce attack surface, not just size — excluding build-time tooling (compilers, package managers) from the final image means fewer installed tools an attacker who compromises the container could exploit.',
    gotchas: [
      'Build secrets used only in an early stage never appear in the final image\'s layers when multi-stage builds are structured correctly.',
      'A minimal final-stage base image (distroless, Alpine) combined with multi-stage builds compounds the security benefit.',
    ],
  },
  'containers/docker-images': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Fundamentals',   route: '/containers/fundamentals' },
      { label: 'Docker CLI',     route: '/containers/docker-cli' },
    ],
    tip: '"latest" is just a mutable convention, not a guarantee of freshness — production deployments should pin to a specific version tag or, more robustly, an image digest.',
    gotchas: [
      'Retagging an image does not create new content — it creates an additional pointer to the same underlying layers.',
      'Digest-pinned deployment references guarantee you are always pulling the exact same image bytes, eliminating silent tag-reassignment risk.',
    ],
  },
  'containers/docker-cli': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Docker Images',   route: '/containers/docker-images' },
      { label: 'Troubleshooting', route: '/containers/troubleshooting' },
    ],
    tip: 'docker exec starts a new process INSIDE an already-running container, sharing its filesystem and network namespace — unlike docker run, which always creates a brand-new container.',
    gotchas: [
      'Commands run via docker exec are purely transient debugging — they never persist to the image and vanish once the container stops.',
      'docker exec fails against a stopped container — it requires an existing running container to attach to.',
    ],
  },
  'containers/compose': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Compose Profiles', route: '/containers/compose-profiles' },
      { label: 'Fundamentals',     route: '/containers/fundamentals' },
    ],
    tip: 'Compose automatically creates a dedicated bridge network per project, and every service can reach every other by its service NAME as a DNS hostname — no manual network config needed for basic inter-service communication.',
    gotchas: [
      'depends_on controls startup ORDER but does not by itself wait for a dependent service to be READY — combine with a healthcheck and condition: service_healthy.',
      'Custom networks let you segment services for defense-in-depth rather than relying solely on the single default shared network.',
    ],
  },
  'containers/compose-profiles': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Compose',        route: '/containers/compose' },
    ],
    tip: 'Profiles let ONE compose file describe multiple deployment configurations (dev, test, debug tooling) — a service with no profile assigned always starts by default; profile-tagged services are opt-in.',
    gotchas: [
      'COMPOSE_PROFILES lets CI and local dev activate different service subsets without changing the invocation command.',
      'Cramming every environment variation into one compose file via profiles can become harder to read than a small number of purpose-specific files.',
    ],
  },
  'containers/configmaps-secrets': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Pods & Deployments', route: '/containers/pods-deployments' },
      { label: 'RBAC',               route: '/containers/rbac' },
    ],
    tip: 'A ConfigMap mounted as a VOLUME updates automatically in a running container (with propagation delay) — mounted as an environment variable, updates require a pod restart, since env vars are read only once at startup.',
    gotchas: [
      'Kubernetes does not automatically restart pods on a ConfigMap change — tools like Reloader or content-hash-suffixed names force a rolling deployment when needed.',
      'immutable: true prevents accidental updates and improves kubelet performance, at the cost of requiring a new object name for any config change.',
    ],
  },
  'containers/container-security': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Multi-Stage Builds', route: '/containers/multi-stage' },
      { label: 'RBAC',               route: '/containers/rbac' },
      { label: 'Network Policies',   route: '/containers/network-policies' },
    ],
    tip: 'Vulnerability scanning (Trivy, Grype) integrated into CI blocks known-vulnerable images from ever reaching production — a minimal distroless/Alpine base further reduces attack surface by carrying far fewer installed packages.',
    gotchas: [
      'New CVEs are discovered continuously — periodic re-scanning of already-deployed images is necessary, not just a build-time check.',
      'Image signing (Cosign/Sigstore) addresses supply-chain tampering risks that vulnerability scanning alone does not cover.',
    ],
  },
  'containers/helm': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Operators & CRDs',  route: '/containers/operators-crds' },
      { label: 'Kubectl',           route: '/containers/kubectl' },
    ],
    tip: 'Values files layer in order of specificity — a base values.yaml plus an environment-specific override file lets one chart serve dev, staging, and production with different config, later flags overriding earlier ones.',
    gotchas: [
      'helm rollback only reverts Kubernetes objects Helm manages — it does not undo external side effects like data migrations.',
      'helm template renders manifests locally without touching the cluster, useful for reviewing exact output before install.',
    ],
  },
  'containers/hpa': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Resource Limits', route: '/containers/resource-limits' },
      { label: 'K8s Architecture', route: '/containers/k8s-architecture' },
    ],
    tip: 'Without stabilization, an HPA can "flap" — rapidly scaling up and down for short-lived metric spikes. Scale-up is typically configured to react faster than scale-down, since under-provisioning during a real spike is usually costlier.',
    gotchas: [
      'HPA decisions are only as good as the chosen metric — average CPU when the real bottleneck is memory or queue depth scales confidently in the wrong direction.',
      'behavior.scaleDown.stabilizationWindowSeconds prevents premature scale-down from a brief dip that doesn\'t represent sustained reduced load.',
    ],
  },
  'containers/k8s-architecture': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Pods & Deployments', route: '/containers/pods-deployments' },
      { label: 'Kubectl',            route: '/containers/kubectl' },
    ],
    tip: 'The control plane (API server, etcd, scheduler) makes decisions and stores state — it does NOT run application workloads itself, keeping cluster management logically separate from what it manages.',
    gotchas: [
      'etcd is the single source of truth for all cluster state — losing it without backups means losing the entire cluster\'s configuration.',
      'A control plane outage does not immediately stop already-running pods, since kubelet continues managing existing pods independently for a period.',
    ],
  },
  'containers/kubectl': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Troubleshooting',  route: '/containers/troubleshooting' },
      { label: 'K8s Architecture', route: '/containers/k8s-architecture' },
    ],
    tip: 'kubectl apply reconciles a manifest declaratively, computing and applying only the diff — the standard for GitOps workflows, unlike imperative commands (kubectl run/create) that modify a specific object right now with no source-controlled record.',
    gotchas: [
      'Mixing imperative changes with declarative manifests causes drift — a manually kubectl edit-ed object no longer matches its source-controlled file.',
      'kubectl diff (comparing a local manifest against live state before applying) is a useful safety check against unexpected drift.',
    ],
  },
  'containers/network-policies': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'RBAC',              route: '/containers/rbac' },
      { label: 'Container Security', route: '/containers/container-security' },
    ],
    tip: 'Without any NetworkPolicy, Kubernetes allows unrestricted pod-to-pod communication cluster-wide by default — a default-deny-all policy establishes a secure baseline before adding specific allow rules incrementally.',
    gotchas: [
      'NetworkPolicies are enforced by the CNI plugin, not Kubernetes core — some CNI plugins don\'t enforce them at all, meaning a policy can exist with zero actual effect.',
      'Egress policies (restricting what a compromised pod can reach outbound) are just as important as ingress and are more commonly overlooked.',
    ],
  },
  'containers/operators-crds': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Helm',              route: '/containers/helm' },
      { label: 'StatefulSets',      route: '/containers/statefulsets' },
    ],
    tip: 'A CRD alone just defines a new object schema — without a controller watching and reconciling it, creating a custom resource does nothing. An Operator pairs a CRD with a controller encoding real operational knowledge.',
    gotchas: [
      'Operators are most valuable for stateful, operationally-complex applications (databases, message brokers) — a plain Deployment is usually sufficient for simple stateless apps.',
      'The reconciliation loop (observe, compare, act, repeat) is the same core mechanism underlying both built-in controllers and custom Operators.',
    ],
  },
  'containers/pods-deployments': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'StatefulSets',       route: '/containers/statefulsets' },
      { label: 'Services & Ingress', route: '/containers/services-ingress' },
    ],
    tip: 'A Deployment does not manage Pods directly — it manages a ReplicaSet, which manages the actual Pods, adding the layer that enables rollout history and rollback.',
    gotchas: [
      'All containers in a Pod are scheduled to the SAME node and share the Pod\'s IP — this co-location is what makes sidecar patterns practical.',
      'Pods are inherently ephemeral — applications must tolerate restarts rather than assuming long-lived process identity.',
    ],
  },
  'containers/rbac': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Network Policies',    route: '/containers/network-policies' },
      { label: 'Container Security',  route: '/containers/container-security' },
    ],
    tip: 'A Role grants permissions scoped to a single namespace; a ClusterRole can be bound cluster-wide OR namespace-scoped, giving it dual-use flexibility.',
    gotchas: [
      'RBAC is purely additive — there is no explicit "deny" rule, meaning effective permissions are the union of every applicable binding.',
      'Granting cluster-admin to a service account that only ever needs read access to one namespace is unnecessary risk if that account is ever compromised.',
    ],
  },
  'containers/resource-limits': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'HPA',              route: '/containers/hpa' },
      { label: 'Troubleshooting',  route: '/containers/troubleshooting' },
    ],
    tip: 'Requests are used by the SCHEDULER to decide placement; limits cap actual runtime usage. Exceeding a CPU limit throttles the container — exceeding a memory limit gets it OOMKilled, a far more severe failure mode.',
    gotchas: [
      'QoS class (Guaranteed/Burstable/BestEffort) is derived from how requests/limits are set and directly determines eviction priority under node pressure.',
      'A pod with no request but a limit gets unpredictable scheduling behavior depending on configuration defaults.',
    ],
  },
  'containers/services-ingress': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Pods & Deployments', route: '/containers/pods-deployments' },
      { label: 'K8s Architecture',   route: '/containers/k8s-architecture' },
    ],
    tip: 'A single Ingress (backed by one load balancer) can route HTTP/HTTPS traffic to MANY Services based on hostname or path — generally preferred over provisioning a separate LoadBalancer Service per application.',
    gotchas: [
      'ClusterIP (the default) only exposes a Service internally — LoadBalancer provisions an actual cloud load balancer per Service, which can become costly at scale.',
      'NodePort exposes a static port on every node\'s IP directly — simple but rarely used directly in production.',
    ],
  },
  'containers/statefulsets': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Storage',              route: '/containers/storage' },
      { label: 'Pods & Deployments',   route: '/containers/pods-deployments' },
    ],
    tip: 'StatefulSet pods get stable, predictable names (web-0, web-1) that persist across restarts, and each gets its own PVC that follows it across rescheduling — a Deployment\'s interchangeable pods cannot support workloads where specific identity matters.',
    gotchas: [
      'Pods are created and terminated in strict ORDER by default — later replicas may depend on earlier ones already being initialized.',
      'Using a StatefulSet for a stateless application adds unnecessary operational complexity with no corresponding benefit.',
    ],
  },
  'containers/storage': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'StatefulSets',       route: '/containers/statefulsets' },
      { label: 'ConfigMaps & Secrets', route: '/containers/configmaps-secrets' },
    ],
    tip: 'A PersistentVolume represents actual provisioned storage; a PersistentVolumeClaim is a request matching criteria (size, access mode) — this separation lets manifests request storage generically without knowing infrastructure details.',
    gotchas: [
      'Many cloud block storage types only support ReadWriteOnce — a volume can only attach to Pods on one node at a time, a common surprise when scaling stateful workloads.',
      'The reclaim policy (Retain vs Delete) determines whether underlying storage survives after its PVC is deleted — get this wrong and data disappears permanently.',
    ],
  },
  'containers/troubleshooting': {
    apis: K8S_DEFAULT.apis, docs: K8S_DEFAULT.docs, resources: K8S_DEFAULT.resources,
    related: [
      { label: 'Kubectl',          route: '/containers/kubectl' },
      { label: 'Resource Limits',  route: '/containers/resource-limits' },
    ],
    tip: 'kubectl describe pod surfaces EVENTS (scheduling failures, image pull errors) — often the fastest first step, before diving into logs which are useless if the container never actually started.',
    gotchas: [
      'kubectl logs --previous is required to see logs from a crashed container\'s PREVIOUS instance — without it, the crash-causing logs are lost.',
      'CrashLoopBackOff\'s exponential backoff is normal, expected behavior — the actual root cause is virtually always in the previous container\'s logs or exit code.',
    ],
  },

  // ── Azure: per-page entries ─────────────────────────────────────────────────
  'azure/fundamentals': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'ARM Templates',   route: '/azure/arm' },
      { label: 'RBAC',            route: '/azure/rbac' },
    ],
    tip: 'Availability Zones are physically separate datacenters WITHIN one region — spreading resources across zones protects against a datacenter failure without the latency/data-residency complexity of a full multi-region deployment.',
    gotchas: [
      'Not every Azure service or region supports Availability Zones — check support before architecting for zone-redundancy.',
      'Zone redundancy handles datacenter failures cheaply; true regional-outage protection requires an actual multi-region deployment.',
    ],
  },
  'azure/arm': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'Bicep',       route: '/azure/bicep' },
      { label: 'Fundamentals', route: '/azure/fundamentals' },
    ],
    tip: 'ARM deployments are idempotent by default — Incremental mode (the default) only adds/modifies resources described in the template; Complete mode DELETES any resource in the group not in the template, a much more destructive behavior.',
    gotchas: [
      'A what-if deployment lets you preview exactly what a deployment would change before applying it — critical before running Complete-mode deployments.',
      'Resource dependencies can be inferred automatically from references, or declared explicitly via dependsOn.',
    ],
  },
  'azure/bicep': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'ARM Templates', route: '/azure/arm' },
    ],
    tip: 'Bicep transpiles directly to ARM JSON — every Bicep file has an exact ARM equivalent, meaning it gains no new deployment capabilities beyond ARM itself, only a cleaner authoring syntax with type-safety and IntelliSense.',
    gotchas: [
      'Modules in Bicep compile down to nested ARM deployments — the same modularity ARM has always supported, with far less boilerplate.',
      'Bicep benefits automatically from any new ARM feature without needing a separate tooling update.',
    ],
  },
  'azure/aks': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'Container Apps', route: '/azure/container-apps' },
      { label: 'RBAC',           route: '/azure/rbac' },
    ],
    tip: 'Azure manages and pays for AKS\'s control plane at no extra cost on the base tier — you only pay for worker node VMs, unlike self-managed Kubernetes where control plane infrastructure is also your responsibility.',
    gotchas: [
      'Node pool VMs still count toward your subscription\'s compute quota and cost the same as standalone VMs of the same size.',
      'Different node pools let you run different VM types (general-purpose, GPU) within the same cluster.',
    ],
  },
  'azure/container-apps': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'AKS',       route: '/azure/aks' },
      { label: 'Functions', route: '/azure/functions' },
    ],
    tip: 'Container Apps is built on Kubernetes under the hood but abstracts cluster management entirely away — a meaningful middle ground between App Service and full AKS for teams wanting Kubernetes-style scaling without the operational complexity.',
    gotchas: [
      'Unlike standard AKS deployments, Container Apps supports scale-to-zero, making it cost-effective for intermittent or event-driven workloads.',
      'The tradeoff for the abstraction is reduced control — no direct Kubernetes API access or arbitrary CRD/Operator installation.',
    ],
  },
  'azure/functions': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'Container Apps', route: '/azure/container-apps' },
      { label: 'App Service',    route: '/azure/app-service' },
    ],
    tip: 'On the Consumption plan, Functions scale to zero when idle — the first request after inactivity incurs a "cold start." Premium/Dedicated plans keep instances warm at a fixed baseline cost, trading cost efficiency for consistent latency.',
    gotchas: [
      'Cold start duration varies significantly by language runtime and dependency footprint.',
      'A consistently high-traffic function may actually cost LESS on Premium once cold-start-avoidance is factored against per-execution Consumption costs.',
    ],
  },
  'azure/app-service': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'Functions',        route: '/azure/functions' },
      { label: 'Load Balancer',    route: '/azure/load-balancer' },
    ],
    tip: 'Deployment slots (staging, production) enable zero-downtime deployments via slot swapping — the new version warms up in staging before traffic switches, avoiding the cold-start delay a direct production deployment would cause.',
    gotchas: [
      'Multiple apps sharing a single App Service Plan share its compute — one app\'s heavy load can affect others on the same plan.',
      'Free/Shared tiers run on shared infrastructure with no SLA — production workloads need Standard tier or above.',
    ],
  },
  'azure/virtual-machines': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'Virtual Network', route: '/azure/virtual-network' },
      { label: 'Load Balancer',   route: '/azure/load-balancer' },
    ],
    tip: 'A VM Scale Set manages a group of identical, load-balanced VMs as a single logical unit, auto-scaling based on rules and integrating with a load balancer to distribute traffic and replace unhealthy instances automatically.',
    gotchas: [
      'Scale sets are best suited for STATELESS workloads that can be freely created and destroyed.',
      'Rolling upgrades update a batch of instances at a time, reducing the risk that a bad image update takes down the whole fleet simultaneously.',
    ],
  },
  'azure/virtual-network': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'Load Balancer',      route: '/azure/load-balancer' },
      { label: 'Virtual Machines',   route: '/azure/virtual-machines' },
    ],
    tip: 'NSG rules are evaluated by PRIORITY (lower numbers first) and the first matching rule wins — a common misconfiguration is placing a broad allow rule at a lower priority number than a more specific intended deny.',
    gotchas: [
      'VNet peering does NOT automatically transit through a peered network\'s own peering connections — this non-transitive property causes "why can\'t A reach C through B" confusion.',
      'Both subnet-level AND NIC-level NSGs must allow traffic if both are configured — the effective rule set is the intersection, not the union.',
    ],
  },
  'azure/load-balancer': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'Virtual Network', route: '/azure/virtual-network' },
      { label: 'API Management',  route: '/azure/api-management' },
    ],
    tip: 'Azure Load Balancer operates at Layer 4 (fast, protocol-agnostic, no HTTP inspection); Application Gateway operates at Layer 7 (content-based routing, SSL termination, integrated WAF) — many architectures layer both together.',
    gotchas: [
      'Layer 4 load balancing has lower latency overhead since it never parses HTTP content.',
      'Application Gateway is required specifically when routing decisions need to be based on URL path or hostname.',
    ],
  },
  'azure/api-management': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'Load Balancer',   route: '/azure/load-balancer' },
      { label: 'Functions',       route: '/azure/functions' },
    ],
    tip: 'APIM applies cross-cutting policies (rate limiting, auth, transformation) centrally in front of backend APIs — without modifying the backend services themselves, valuable when backends are owned by different teams or written in different languages.',
    gotchas: [
      'The developer portal automatically generates interactive documentation and lets consumers self-service API key provisioning.',
      'Policies execute at request/response time and add a small amount of latency per request compared to calling a backend directly.',
    ],
  },
  'azure/service-bus': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'Functions',      route: '/azure/functions' },
    ],
    tip: 'A Service Bus QUEUE delivers each message to exactly ONE receiver (work distribution); a TOPIC delivers to EVERY subscription (pub/sub) — choosing a topic when a queue would suffice adds unnecessary subscription/filter overhead.',
    gotchas: [
      'Sessions guarantee ordered delivery to a single consumer per session, at the cost of meaningful added latency and complexity — use only when true per-entity ordering matters.',
      'Subscriptions can apply SQL-like filters to receive only a matching subset of messages from a topic.',
    ],
  },
  'azure/sql-cosmos': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'Storage',    route: '/azure/storage' },
    ],
    tip: 'Azure SQL suits relational data with strong consistency and ACID transactions; Cosmos DB suits massive scale, flexible schema, and low-latency global reads/writes with tunable consistency — the partition key choice in Cosmos is largely irreversible, so get it right upfront.',
    gotchas: [
      'A poorly chosen Cosmos partition key creates hot partitions that bottleneck throughput regardless of provisioned RU/s.',
      'Cost models differ significantly — Azure SQL is priced by compute tier, Cosmos DB by provisioned/consumed Request Units.',
    ],
  },
  'azure/storage': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'SQL & Cosmos DB',  route: '/azure/sql-cosmos' },
    ],
    tip: 'LRS replicates within one datacenter (cheapest, no datacenter-outage protection); ZRS spreads across zones in one region; GRS replicates to a paired region hundreds of miles away — higher tiers cost more and, for GRS, introduce eventual consistency between copies.',
    gotchas: [
      'GRS\'s secondary copy is not readable by default (unless RA-GRS is used) and failover is a manual process for standard GRS.',
      'The appropriate redundancy tier should reflect the actual business impact of data loss or unavailability, not a blanket default.',
    ],
  },
  'azure/redis': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'SQL & Cosmos DB', route: '/azure/sql-cosmos' },
    ],
    tip: 'Basic tier is a single node with no SLA (dev/test only); Standard adds a replicated secondary with automatic failover; Premium adds clustering, persistence, and VNet isolation for large-scale or security-sensitive production use.',
    gotchas: [
      'Even with Premium persistence enabled, cached data should still be treated as ephemeral and reconstructible from the source of truth.',
      'Basic tier node failure or maintenance causes a complete cache outage with data loss.',
    ],
  },
  'azure/entra-id': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'RBAC',        route: '/azure/rbac' },
      { label: 'Key Vault',   route: '/azure/key-vault' },
    ],
    tip: 'Conditional Access evaluates signals (location, device compliance, sign-in risk) at authentication time and applies controls accordingly — a fundamentally more adaptive model than a static "always require MFA" rule.',
    gotchas: [
      'A misconfigured Conditional Access policy (an overly broad exclusion, one that locks out all admins) can cause serious availability incidents.',
      'Test new policies in report-only mode before enforcing them broadly.',
    ],
  },
  'azure/rbac': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'Entra ID',    route: '/azure/entra-id' },
      { label: 'Key Vault',   route: '/azure/key-vault' },
    ],
    tip: 'Role assignments inherit DOWNWARD across four scope levels (management group, subscription, resource group, resource) — assign at the NARROWEST scope that satisfies the actual need to limit blast radius if that identity is ever compromised.',
    gotchas: [
      'Azure RBAC is purely additive — auditing effective access requires checking role assignments at every applicable scope level.',
      'Built-in roles cover most needs — custom roles add ongoing governance overhead and should be reserved for genuinely unique combinations.',
    ],
  },
  'azure/key-vault': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'RBAC',     route: '/azure/rbac' },
      { label: 'Entra ID', route: '/azure/entra-id' },
    ],
    tip: 'A Managed Identity authenticating to Key Vault eliminates the "secret needed to access secrets" bootstrapping problem — the identity is tied to the Azure resource itself, requiring no stored credential.',
    gotchas: [
      'Soft-delete and purge protection prevent accidental or malicious permanent deletion — without them, a deleted secret is immediately and irrecoverably gone.',
      'System-assigned identities are tied to one resource\'s lifecycle; user-assigned identities can be shared across resources and managed independently.',
    ],
  },
  'azure/security-defender': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'Key Vault', route: '/azure/key-vault' },
      { label: 'RBAC',      route: '/azure/rbac' },
    ],
    tip: 'Secure Score aggregates many security recommendations into one trackable percentage — but it is a POINT-IN-TIME snapshot that changes as resources are deployed or configurations drift, so treat it as continuously monitored, not a one-time check.',
    gotchas: [
      'A high Secure Score reduces but does not eliminate risk — it measures adherence to known best-practice configurations, not protection against zero-days or logic flaws.',
      'Each recommendation carries relative risk weighting, not equal importance — prioritize accordingly.',
    ],
  },
  'azure/monitor': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'Cost Management', route: '/azure/cost-management' },
    ],
    tip: 'Metrics are lightweight numerical time-series optimized for near-real-time alerting; Logs (Log Analytics/KQL) store rich structured event data for complex correlation — sending the same signal to both unnecessarily doubles cost.',
    gotchas: [
      'Metrics-based alerts fire faster (often within a minute) than log-based alerts, which depend on ingestion latency and query schedule.',
      'Choose based on whether the data is a simple numeric metric for fast alerting, or rich structured data benefiting from KQL flexibility.',
    ],
  },
  'azure/cost-management': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'Monitor', route: '/azure/monitor' },
    ],
    tip: 'Consistent resource tagging (team, project, environment, cost center) is what makes Cost Analysis actually useful for chargeback reporting — without tags, costs can only be broken down by resource type or group.',
    gotchas: [
      'Budgets with action-group-triggered alerts turn cost monitoring from reactive reporting into proactive control.',
      'Azure Advisor surfaces savings opportunities (underutilized VMs, orphaned disks) manual review would likely miss.',
    ],
  },
  'azure/devops-pipelines': {
    apis: AZURE_DEFAULT.apis, docs: AZURE_DEFAULT.docs, resources: AZURE_DEFAULT.resources,
    related: [
      { label: 'ARM Templates', route: '/azure/arm' },
    ],
    tip: 'YAML pipelines are defined as code, checked into the same repo as the application — pipeline changes go through the same review and version history as any other code change, unlike the Classic GUI editor.',
    gotchas: [
      'Templates in YAML pipelines let common stages be defined once and reused across many pipelines, reducing duplication.',
      'YAML has a steeper initial learning curve than the Classic editor, but the long-term maintainability benefit of pipeline-as-code is usually worth it.',
    ],
  },

  // ── Messaging: per-page entries ─────────────────────────────────────────────
  'messaging/messaging-fundamentals': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Message Queues vs Streams', route: '/messaging/message-queues-vs-streams' },
      { label: 'Messaging Patterns',        route: '/messaging/messaging-patterns' },
    ],
    tip: 'Asynchronous messaging inserts a durable broker between producer and consumer — the producer continues even if the consumer is temporarily slow or unavailable, at the cost of eventual (not immediate) consistency.',
    gotchas: [
      'Not every interaction benefits from async messaging — synchronous calls remain appropriate when an immediate response is genuinely required.',
      'Deployment and scaling independence is a real benefit — producer and consumer can be redeployed or rewritten independently as long as the message contract stays stable.',
    ],
  },
  'messaging/message-queues-vs-streams': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Kafka Architecture',        route: '/messaging/kafka-architecture' },
      { label: 'RabbitMQ Core',             route: '/messaging/rabbitmq-core' },
    ],
    tip: 'Traditional queues typically delete a message once consumed; streaming platforms (Kafka) retain messages for a configured retention period regardless of consumption — this is why streams support replaying historical data and queues generally cannot.',
    gotchas: [
      'Streaming platforms support BOTH competing-consumers AND broadcast consumption simultaneously, via consumer groups — a more flexible model than a queue\'s single consumption pattern.',
      'Choose based on whether the use case needs a transient work-distribution buffer or a durable, replayable event log.',
    ],
  },
  'messaging/kafka-architecture': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Kafka Producers & Consumers', route: '/messaging/kafka-producers-consumers' },
      { label: 'Kafka Streams',               route: '/messaging/kafka-streams' },
    ],
    tip: 'Kafka writes sequentially (append-only log) rather than performing random-access writes — combined with page cache and zero-copy transfer, this is why it achieves throughput closer to sequential disk I/O than typical random-access databases.',
    gotchas: [
      'Log compaction (retain only the latest value per key) is different from standard time/size-based retention — pick the strategy matching the topic\'s actual use case, or silently lose needed data.',
      'Partitioning distributes load across brokers — throughput scales roughly linearly with partition count up to cluster limits.',
    ],
  },
  'messaging/kafka-producers-consumers': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Kafka Architecture', route: '/messaging/kafka-architecture' },
      { label: 'Idempotency',        route: '/messaging/idempotency' },
    ],
    tip: 'acks=0 (fire-and-forget), acks=1 (leader only), and acks=all (all in-sync replicas) trade throughput against durability — choose per-topic based on the actual cost of losing a message for that use case.',
    gotchas: [
      'Auto-commit can commit an offset before a message is fully processed — a crash mid-processing causes silent data loss unless manual commit-after-processing is used.',
      'Committing too frequently adds broker load; committing too infrequently increases reprocessing after a restart.',
    ],
  },
  'messaging/kafka-streams': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Kafka Architecture', route: '/messaging/kafka-architecture' },
    ],
    tip: 'A KTable is essentially a compacted, continuously-updated view built from a KStream\'s changes — this stream-table duality is why aggregating a stream naturally produces a table, while joining two streams naturally produces another stream.',
    gotchas: [
      'State stores are backed by compacted changelog topics — if an instance fails, state can be fully rebuilt by replaying the changelog, providing fault tolerance without manual backup.',
      'Standby replicas reduce failover time by having a warm state-store copy ready on another instance.',
    ],
  },
  'messaging/kafka-connect': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Kafka Architecture', route: '/messaging/kafka-architecture' },
      { label: 'Schema Registry',    route: '/messaging/schema-registry' },
    ],
    tip: 'Source connectors pull data FROM an external system INTO Kafka; sink connectors push data FROM Kafka INTO an external system — using pre-built connectors (Debezium for CDC, JDBC sink) avoids reinventing already-hardened integration logic.',
    gotchas: [
      'Exactly-once through a connector requires BOTH Kafka\'s offset tracking AND the target system\'s idempotent/transactional writes to cooperate.',
      'Distributed mode runs connectors across a worker cluster with automatic task rebalancing for fault tolerance.',
    ],
  },
  'messaging/schema-registry': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Kafka Connect', route: '/messaging/kafka-connect' },
    ],
    tip: 'Backward compatibility means new schemas can read old data; forward compatibility means old readers can read new data; full compatibility requires both — choosing too permissive a mode silently breaks consumers that haven\'t yet updated.',
    gotchas: [
      'Without a registry, producers and consumers must agree on message format out-of-band (docs, tribal knowledge) — a fragile mechanism that breaks down as service count grows.',
      'Avro/Protobuf with a registry encode a compact schema ID per message rather than the full schema, reducing message size vs. embedding a full JSON Schema.',
    ],
  },
  'messaging/rabbitmq-core': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'RabbitMQ Exchanges', route: '/messaging/rabbitmq-exchanges' },
      { label: 'RabbitMQ Patterns',  route: '/messaging/rabbitmq-patterns' },
    ],
    tip: 'A queue must be declared durable AND messages marked persistent (delivery_mode=2) for messages to actually survive a broker restart — missing either half of this pairing still loses messages despite appearing "durable."',
    gotchas: [
      'Manual consumer acknowledgment (not auto-ack) is required to avoid losing a message if the consumer crashes mid-processing.',
      'Prefetch count (QoS) limits outstanding unacknowledged messages per consumer, preventing one slow consumer from being overwhelmed.',
    ],
  },
  'messaging/rabbitmq-exchanges': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'RabbitMQ Core', route: '/messaging/rabbitmq-core' },
    ],
    tip: 'Direct exchanges match an exact routing key; topic exchanges match wildcard patterns; fanout ignores the routing key entirely and broadcasts to all bound queues — choose the type matching the actual routing need, not by default.',
    gotchas: [
      'Exchange-to-exchange bindings enable multi-stage routing but can make the topology hard to reason about if overused.',
      'Headers exchanges route on message attributes rather than the routing key — less common but useful for multi-attribute routing decisions.',
    ],
  },
  'messaging/rabbitmq-patterns': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'RabbitMQ Core',      route: '/messaging/rabbitmq-core' },
      { label: 'Messaging Patterns', route: '/messaging/messaging-patterns' },
    ],
    tip: 'RPC-over-messaging (correlation ID + reply-to queue) trades HTTP\'s simplicity for the resilience benefits of going through a broker — reserve it for cases where that resilience genuinely outweighs the added complexity.',
    gotchas: [
      'An RPC caller needs an explicit timeout — the responder might never reply if it crashed or the message was lost.',
      'The TTL-plus-dead-letter-exchange trick for delayed delivery works by expiring a message on a holding queue with no consumer.',
    ],
  },
  'messaging/messaging-patterns': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Messaging Fundamentals', route: '/messaging/messaging-fundamentals' },
      { label: 'Message Ordering',       route: '/messaging/message-ordering' },
    ],
    tip: 'The claim check pattern stores a large payload in external storage (blob/S3) and sends only a reference through the broker — avoiding message-size limits (SQS 256KB, Kafka default 1MB) that would otherwise reject large payloads.',
    gotchas: [
      'Competing consumers naturally load-balance work — a faster consumer processes proportionally more messages than a slower one.',
      'The claim-check pattern requires managing the externally stored payload\'s lifecycle separately from the message\'s own lifecycle.',
    ],
  },
  'messaging/message-ordering': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Messaging Patterns', route: '/messaging/messaging-patterns' },
      { label: 'Idempotency',        route: '/messaging/idempotency' },
    ],
    tip: 'Total ordering (a single global sequence) is expensive at scale since it eliminates parallelism — partial ordering (within a partition/shard/key) is the practical compromise most systems adopt.',
    gotchas: [
      'Producer retries can reorder messages relative to a subsequent send unless max.in.flight.requests.per.connection=1 is set (at a throughput cost).',
      'A system claiming global ordering but actually only partition-ordered can produce subtle bugs if consumers assume stronger guarantees than actually provided.',
    ],
  },
  'messaging/idempotency': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Outbox Pattern',    route: '/messaging/outbox-pattern' },
      { label: 'Message Ordering',  route: '/messaging/message-ordering' },
    ],
    tip: 'An idempotency key should identify the logical OPERATION, not just the message — storing the result of a processed operation alongside its key lets a duplicate request get the original correct response, not just a generic ack.',
    gotchas: [
      'Naturally idempotent operations (setting a value) need no tracking; naturally non-idempotent operations (increment, send email) require explicit key-based enforcement.',
      'The idempotency check and the operation must happen atomically in the same transaction — checking and acting as two separate steps reintroduces a race condition.',
    ],
  },
  'messaging/outbox-pattern': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Idempotency',       route: '/messaging/idempotency' },
      { label: 'Saga Pattern',      route: '/messaging/saga-pattern' },
    ],
    tip: 'The outbox pattern writes the outgoing message within the SAME database transaction as the business data change — solving the dual-write problem where a separate publish call could otherwise succeed or fail independently of the DB commit.',
    gotchas: [
      'A separate relay process (polling or CDC-based) is still needed to actually publish outbox rows to the broker.',
      'CDC-based relays (Debezium) have lower latency and database load than polling-based relays.',
    ],
  },
  'messaging/saga-pattern': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Outbox Pattern',   route: '/messaging/outbox-pattern' },
      { label: 'Backpressure',     route: '/messaging/backpressure' },
    ],
    tip: 'Orchestration (central coordinator) vs choreography (services reacting to events, no coordinator) trades debuggability against decoupling — orchestration scales better for complex, many-step sagas.',
    gotchas: [
      'Not every operation has a clean compensating action — a sent email cannot be truly "unsent."',
      'Compensating transactions must themselves be idempotent and retry-safe, since the coordinator might crash and need to retry a compensation.',
    ],
  },
  'messaging/backpressure': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Saga Pattern',  route: '/messaging/saga-pattern' },
      { label: 'Monitoring',    route: '/messaging/monitoring' },
    ],
    tip: 'Pull-based (consumer-driven) systems naturally implement backpressure — a consumer only requests more work when ready, unlike push-based systems that need an explicit backpressure signal to avoid overwhelming a slow consumer.',
    gotchas: [
      'Load shedding (dropping lower-priority messages under sustained overload) is a last resort, not a first response to every capacity problem.',
      'Silently dropping messages under load without observability makes it impossible to distinguish "healthy shedding" from "broken and losing data."',
    ],
  },
  'messaging/messaging-security': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Monitoring', route: '/messaging/monitoring' },
    ],
    tip: 'SASL/mTLS authenticate a producer or consumer\'s identity before allowing a broker connection — ACLs then restrict WHICH topics/queues that authenticated identity can actually produce to or consume from.',
    gotchas: [
      'Field-level payload encryption protects sensitive data even from the broker operator itself, a stronger guarantee than transport/storage encryption alone.',
      'Being inside the network perimeter should not automatically grant a service access to every topic — per-service authorization still matters.',
    ],
  },
  'messaging/monitoring': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Messaging Security', route: '/messaging/messaging-security' },
      { label: 'Backpressure',       route: '/messaging/backpressure' },
    ],
    tip: 'Consumer lag (gap between latest produced offset and consumer\'s committed offset) is the single most important health signal — a continuously growing lag indicates insufficient capacity or a stalled consumer.',
    gotchas: [
      'Alerting on absolute lag thresholds without considering normal traffic patterns produces noisy false alarms during expected spikes — alert on the RATE of lag growth instead.',
      'Trace context must be explicitly propagated through message headers — async boundaries break the direct call chain distributed tracing relies on.',
    ],
  },
  'messaging/aws-sqs': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'AWS SNS/EventBridge', route: '/messaging/aws-sns-eventbridge' },
    ],
    tip: 'SQS visibility timeout hides a message from other consumers during processing — expiring before deletion causes redelivery, which is why consumers must be idempotent regardless of standard vs FIFO queue choice.',
    gotchas: [
      'FIFO queues guarantee strict order and exactly-once (within a dedup window) at the cost of significantly lower throughput than standard queues.',
      'Extending visibility timeout mid-processing is the correct approach for variable/unpredictable processing time rather than guessing a fixed value.',
    ],
  },
  'messaging/aws-sns-eventbridge': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'AWS SQS',   route: '/messaging/aws-sqs' },
    ],
    tip: 'SNS fans out unconditionally to every subscriber; EventBridge routes based on content-matching rules BEFORE delivery — EventBridge is the better fit for complex, multi-source routing, SNS remains simpler for straightforward fixed fan-out.',
    gotchas: [
      'EventBridge natively supports scheduling and API destinations that would require additional custom infrastructure on SNS+SQS.',
      'SNS filter policies reduce unnecessary delivery but are configured per-subscription, not centrally like EventBridge rules.',
    ],
  },
  'messaging/azure-service-bus': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Azure Event Grid', route: '/messaging/azure-event-grid' },
    ],
    tip: 'Service Bus sessions guarantee ordered delivery to a single consumer per session — required specifically when true per-entity ordering matters, since it adds meaningful latency and complexity versus non-session queues.',
    gotchas: [
      'Topics with SQL-like filtered subscriptions enable pub/sub without every subscriber needing to filter irrelevant messages itself.',
      'Duplicate detection windows complement but do not replace consumer-side idempotency for messages arriving outside that window.',
    ],
  },
  'messaging/azure-event-grid': {
    apis: KAFKA_DEFAULT.apis, docs: KAFKA_DEFAULT.docs, resources: KAFKA_DEFAULT.resources,
    related: [
      { label: 'Azure Service Bus', route: '/messaging/azure-service-bus' },
    ],
    tip: 'Event Grid pushes events immediately to subscribers rather than requiring polling — achieving near-real-time latency, but requiring subscriber endpoints to be reachable and handle a validation handshake on subscription creation.',
    gotchas: [
      'Event Grid is optimized for discrete, reactive notifications, not high-throughput streaming — Event Hubs is the right choice for continuous data streams.',
      'Dead-lettering to a storage account is essential for auditability — without it, undeliverable events are silently dropped after retries.',
    ],
  },

  // ── AI/ML: per-page entries ─────────────────────────────────────────────────
  'ai/ml-fundamentals': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'Math for ML',        route: '/ai/math-for-ml' },
      { label: 'Linear/Logistic Regression', route: '/ai/linear-logistic-regression' },
    ],
    tip: 'Feature engineering often matters more than algorithm choice for classical ML — domain knowledge translated into features frequently improves performance more than switching between comparable algorithms.',
    gotchas: [
      'Feature scaling is required for distance-based algorithms (k-NN, SVM) and gradient-based optimization — skipping it lets larger-range features dominate unfairly.',
      'A mutable default argument bug is a classic Python trap that also silently corrupts ML pipeline code reusing config objects across calls.',
    ],
  },
  'ai/math-for-ml': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'ML Fundamentals',   route: '/ai/ml-fundamentals' },
      { label: 'Neural Networks',   route: '/ai/neural-networks' },
    ],
    tip: 'Matrix multiplication\'s parallelizability across many data points at once is precisely why GPUs — built for parallel matrix operations — dramatically accelerate ML training and inference.',
    gotchas: [
      'Gradients (partial derivatives) are the mathematical foundation of how neural networks learn via backpropagation and the chain rule.',
      'Eigenvalues/eigenvectors underlie PCA, revealing directions of greatest variance for dimensionality reduction.',
    ],
  },
  'ai/linear-logistic-regression': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'ML Fundamentals',    route: '/ai/ml-fundamentals' },
      { label: 'Decision Trees',     route: '/ai/decision-trees' },
    ],
    tip: 'L1 (lasso) regularization can shrink some weights to EXACTLY zero, performing automatic feature selection; L2 (ridge) shrinks all weights toward zero without eliminating any — pick based on whether feature selection is actually desired.',
    gotchas: [
      'Without regularization, a model with many correlated features can develop wildly large coefficients that fit training noise rather than genuine signal.',
      'Regularization strength requires tuning via cross-validation — too much underfits, too little fails to prevent overfitting.',
    ],
  },
  'ai/decision-trees': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'Gradient Boosting', route: '/ai/gradient-boosting' },
      { label: 'Clustering',        route: '/ai/clustering' },
    ],
    tip: 'An unconstrained tree can split until every leaf has one training example — perfect training accuracy while memorizing noise. Pruning (pre or post) trades some training accuracy for better generalization.',
    gotchas: [
      'Ensembles (random forests, gradient boosting) largely superseded single trees precisely because they address overfitting more robustly.',
      'Post-pruning can find a better bias-variance tradeoff than pre-pruning since it evaluates actual branch usefulness rather than guessing limits upfront.',
    ],
  },
  'ai/gradient-boosting': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'Decision Trees', route: '/ai/decision-trees' },
    ],
    tip: 'Random forests build trees independently and average (reducing variance); gradient boosting builds trees SEQUENTIALLY, each correcting the previous ensemble\'s residual errors (reducing bias) — this is why it often wins tabular-data competitions.',
    gotchas: [
      'Gradient boosting is more prone to overfitting than random forests without careful regularization (learning rate, depth, early stopping).',
      'Sequential training cannot be parallelized across trees the way random forest trees can, meaning generally longer training time.',
    ],
  },
  'ai/clustering': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'Decision Trees',  route: '/ai/decision-trees' },
    ],
    tip: 'K-means requires specifying K in advance — the elbow method and silhouette score are two common heuristics for estimating a reasonable value when the "correct" number of clusters is not known ahead of time.',
    gotchas: [
      'DBSCAN and hierarchical clustering don\'t require specifying K, but introduce their own hyperparameters (epsilon, linkage) requiring similar tuning judgment.',
      'The real test of a clustering result is whether the discovered groups are meaningful for the actual business question, not just the metric score.',
    ],
  },
  'ai/neural-networks': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'Math for ML',        route: '/ai/math-for-ml' },
      { label: 'Transformers',       route: '/ai/transformers' },
    ],
    tip: 'Vanishing gradients (shrinking toward zero across many layers) and exploding gradients (growing uncontrollably) are both failure modes from repeated multiplication during backpropagation — ReLU, batch norm, and residual connections were each developed to combat this.',
    gotchas: [
      'ReLU largely replaced sigmoid/tanh in hidden layers specifically because it doesn\'t saturate for positive inputs, mitigating vanishing gradients.',
      'Residual (skip) connections enable training much deeper networks than were previously practical.',
    ],
  },
  'ai/transformers': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'Neural Networks', route: '/ai/neural-networks' },
      { label: 'LLM Fundamentals', route: '/ai/llm-fundamentals' },
    ],
    tip: 'Self-attention computes relationships between all sequence positions simultaneously via matrix operations, allowing full parallelization during training — RNNs process step-by-step, preventing this parallelism, which is why transformers train dramatically faster.',
    gotchas: [
      'The tradeoff for parallelism and long-range modeling is quadratic computational cost in sequence length — a driver of ongoing research into efficient long-context transformers.',
      'RNNs struggle to retain far-earlier information in long sequences; self-attention directly connects every position to every other regardless of distance.',
    ],
  },
  'ai/llm-fundamentals': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'Transformers',        route: '/ai/transformers' },
      { label: 'Prompt Engineering',  route: '/ai/prompt-engineering' },
    ],
    tip: 'LLMs process text as TOKENS (subword units), not characters or whole words — this is why they historically struggled at tasks like counting letters, since a word may split into tokens that don\'t align with its individual characters.',
    gotchas: [
      'Different tokenizers produce different token counts for the same text, directly affecting API cost (billed per token) and context-window usage.',
      'Rare words or non-English text often tokenize into MORE tokens than common English, a real cost consideration for non-English applications.',
    ],
  },
  'ai/prompt-engineering': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'LLM Fundamentals', route: '/ai/llm-fundamentals' },
      { label: 'RAG',              route: '/ai/rag' },
    ],
    tip: 'Chain-of-thought prompting (asking the model to reason step-by-step before answering) measurably improves accuracy on multi-step reasoning tasks by giving the model computational "space" to work through intermediate steps.',
    gotchas: [
      'Prompt engineering is empirical, not purely theoretical — the same prompt can behave differently across model versions and providers.',
      'Few-shot examples often improve consistency far more than lengthy prose instructions alone.',
    ],
  },
  'ai/rag': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'Vector Databases',   route: '/ai/vector-databases' },
      { label: 'Prompt Engineering', route: '/ai/prompt-engineering' },
    ],
    tip: 'Chunk size trades precision against context — very small chunks retrieve precisely but may lack surrounding context; overlapping chunks reduce the risk that relevant information falls exactly at a chunk boundary.',
    gotchas: [
      'Naive fixed-length chunking can split a sentence mid-thought — semantic/structure-aware chunking retrieves more coherent context.',
      'Chunking strategy is genuinely dataset-specific — what works for short FAQ entries may perform poorly on long technical documents.',
    ],
  },
  'ai/vector-databases': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'RAG', route: '/ai/rag' },
    ],
    tip: 'Approximate nearest-neighbor algorithms (HNSW, IVF) trade a small amount of retrieval accuracy for dramatically faster query times at scale — exact search scales linearly and becomes impractical for millions of vectors.',
    gotchas: [
      'HNSW\'s ef_construction and M parameters directly control the speed-accuracy-memory tradeoff — tune to the application\'s actual recall requirements.',
      'HNSW has become a popular default across many vector database implementations due to its favorable speed-accuracy balance.',
    ],
  },
  'ai/fine-tuning': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'Evaluating LLMs',  route: '/ai/evaluating-llms' },
      { label: 'Prompt Engineering', route: '/ai/prompt-engineering' },
    ],
    tip: 'Fine-tuning is appropriate for teaching a model a specific STYLE or FORMAT — it is a poor tool for injecting new factual knowledge, which RAG handles far more reliably.',
    gotchas: [
      'Prompt engineering and RAG should typically be exhausted before reaching for fine-tuning, given its curation, compute, and maintenance cost.',
      'A fine-tuned model must be re-evaluated whenever the underlying base model is upgraded — a maintenance cost easy to underestimate.',
    ],
  },
  'ai/evaluating-llms': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'Fine-Tuning', route: '/ai/fine-tuning' },
      { label: 'MLOps',       route: '/ai/mlops' },
    ],
    tip: 'LLM-as-judge scales better than human evaluation, but introduces its own biases — pair it with periodic human calibration rather than trusting scores blindly, since open-ended outputs rarely have a single correct answer.',
    gotchas: [
      'No single automated metric (BLEU/ROUGE, exact-match, RAGAS) captures overall usefulness — production pipelines typically combine several.',
      'Evaluation must be re-run whenever the model, prompt, or retrieval pipeline changes, not treated as a one-time check.',
    ],
  },
  'ai/mlops': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'Evaluating LLMs', route: '/ai/evaluating-llms' },
      { label: 'Responsible AI',  route: '/ai/responsible-ai' },
    ],
    tip: 'Data drift (input distribution changes) and concept drift (the relationship between input and outcome itself changes) are distinct problems — both cause a deployed model to silently degrade without any code changes.',
    gotchas: [
      'A model serving predictions doesn\'t fail loudly like a crashing service — without monitoring prediction distributions, degradation can go unnoticed for weeks.',
      'Automated retraining triggered by detected drift addresses the reality that models require ongoing maintenance, unlike "finished" traditional software.',
    ],
  },
  'ai/responsible-ai': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'MLOps',           route: '/ai/mlops' },
      { label: 'Evaluating LLMs', route: '/ai/evaluating-llms' },
    ],
    tip: 'Bias audits should evaluate performance across demographic subgroups on held-out data BEFORE deployment — bias introduced at multiple stages (training data, proxy features, evaluation metrics) means auditing only final output misses root causes upstream.',
    gotchas: [
      'Fairness metrics (demographic parity, equalized odds) can mathematically conflict — satisfying one can worsen another, requiring an explicit, documented choice.',
      'Post-deployment monitoring should track outcome disparities over time, since bias can emerge or worsen as the production population diverges from training data.',
    ],
  },
  'ai/computer-vision': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'Neural Networks', route: '/ai/neural-networks' },
    ],
    tip: 'Transfer learning (fine-tuning a model pre-trained on a large dataset) achieves strong results with a fraction of the data and compute a from-scratch model would need — a standard default rather than an optimization.',
    gotchas: [
      'Data augmentation (crops, flips, color jitter) reduces overfitting risk when labeled image data is scarce, the common case in most real applications.',
      'Choosing an appropriate pre-trained backbone balances accuracy against inference latency and model size — the largest model isn\'t always right for constrained deployment.',
    ],
  },
  'ai/hugging-face': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'Transformers',      route: '/ai/transformers' },
      { label: 'Fine-Tuning',       route: '/ai/fine-tuning' },
    ],
    tip: 'The transformers library abstracts architecture-specific details behind a consistent API (AutoModel, AutoTokenizer), letting you swap between fundamentally different architectures (BERT, GPT, T5) with minimal code changes.',
    gotchas: [
      'Model cards document training data and known limitations — critical for responsibly choosing a model, not optional metadata.',
      'The Hub\'s standardized conventions turned "find and load a pre-trained model" from research-paper-code-hunting into a few lines of standard code.',
    ],
  },
  'ai/ai-engineering': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'AI Agents',           route: '/ai/ai-agents' },
      { label: 'Prompt Engineering',  route: '/ai/prompt-engineering' },
    ],
    tip: 'AI engineering focuses on integrating existing foundation models (prompt design, retrieval, evaluation, deployment) rather than training new models from scratch — a meaningfully different skill set from traditional ML research.',
    gotchas: [
      'Evaluation is a first-class engineering concern, not an afterthought, since LLM outputs are non-deterministic and quality is often subjective.',
      'Design for model-swappability — hardcoding assumptions about a specific model\'s quirks creates technical debt as newer models become available.',
    ],
  },
  'ai/ai-agents': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'AI Engineering',    route: '/ai/ai-engineering' },
      { label: 'Prompt Engineering', route: '/ai/prompt-engineering' },
    ],
    tip: 'An agent with tool access can take real, irreversible actions — a hallucinated plan can cause actual damage, not just a wrong text response, which is why human-in-the-loop checkpoints matter for high-stakes actions.',
    gotchas: [
      'Scoped, least-privilege tool access limits the blast radius of a bad agent decision, following the same principle as least-privilege in traditional security.',
      'Agent loops without a clear termination condition (max steps, max cost) can run indefinitely on a stuck plan, silently consuming cost.',
    ],
  },
  'ai/ai-dotnet': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'AI Engineering', route: '/ai/ai-engineering' },
    ],
    tip: 'Semantic Kernel provides a provider-agnostic abstraction over multiple LLM providers plus plugin/function-calling orchestration — useful when an app needs to remain provider-agnostic; calling the SDK directly is simpler for single-provider needs.',
    gotchas: [
      'Adopting Semantic Kernel for a simple single-call use case adds unnecessary abstraction overhead without proportional benefit.',
      'The planner/plugin system enables complex agentic workflows that would need significantly more hand-rolled orchestration otherwise.',
    ],
  },
  'ai/interview-prep': {
    apis: AI_DEFAULT.apis, docs: AI_DEFAULT.docs, resources: AI_DEFAULT.resources,
    related: [
      { label: 'Evaluating LLMs',  route: '/ai/evaluating-llms' },
      { label: 'Responsible AI',   route: '/ai/responsible-ai' },
    ],
    tip: 'Interviewers commonly probe GIL implications for concurrency, mutable defaults, and shallow-vs-deep copying — being able to explain WHY unexpected behavior happens demonstrates deeper fluency than just writing correct code.',
    gotchas: [
      'System design questions increasingly weight practical judgment (how to structure a RAG pipeline, how to avoid N+1 queries) alongside pure algorithmic questions.',
      'Complexity analysis of common data structure operations is frequently tested since choosing the wrong one is a common source of accidental performance bugs.',
    ],
  },

  // ── Testing: per-page entries ───────────────────────────────────────────────
  'testing-hub/testing-fundamentals': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'TDD',            route: '/testing-hub/tdd' },
      { label: 'Test Doubles',   route: '/testing-hub/test-doubles' },
    ],
    tip: 'A trustworthy test suite fails ONLY when there is a real bug — flaky tests that fail intermittently for unrelated reasons erode trust and lead developers to re-run rather than investigate, defeating automated testing\'s whole purpose.',
    gotchas: [
      'The Arrange-Act-Assert structure keeps each test focused on a single action, making it clear which action caused a subsequent failure.',
      'Independent tests (no shared mutable state) can run in parallel and be safely reordered without hidden coupling.',
    ],
  },
  'testing-hub/tdd': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Testing Fundamentals', route: '/testing-hub/testing-fundamentals' },
      { label: 'Mocking & Spies',      route: '/testing-hub/mocking-spies' },
    ],
    tip: 'Writing the test first forces thinking about the desired API shape before implementation exists — watching a new test actually fail (red) before making it pass confirms the test genuinely exercises the intended code path.',
    gotchas: [
      'The refactor step is not optional — skipping it accumulates technical debt as surely as skipping tests entirely.',
      'TDD\'s tight feedback loop catches mistakes immediately; writing tests after the fact often just confirms existing behavior rather than driving design.',
    ],
  },
  'testing-hub/test-doubles': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Mocking & Spies',       route: '/testing-hub/mocking-spies' },
      { label: 'Testing Fundamentals',  route: '/testing-hub/testing-fundamentals' },
    ],
    tip: 'Dummy, stub, spy, mock, and fake are precise, distinct terms — a mock is a stub PLUS built-in call verification, while a fake is a working but simplified implementation, not just canned responses.',
    gotchas: [
      'Overusing mocks (verifying HOW a collaborator was called) couples tests to implementation details — preferring stubs/fakes produces tests that survive refactoring better.',
      'Matching the double\'s complexity to what the test actually needs to verify keeps suites maintainable.',
    ],
  },
  'testing-hub/mocking-spies': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Test Doubles', route: '/testing-hub/test-doubles' },
      { label: 'MSW',          route: '/testing-hub/msw' },
    ],
    tip: 'Overmocking every dependency can produce tests that pass even when the real integration between components is broken — a useful rule of thumb is mocking at architectural boundaries (network, DB, time) while letting real internal logic run.',
    gotchas: [
      'A test suite with excessive mocking often needs rewriting whenever internal implementation details change, even if externally observable behavior stayed the same.',
      'Spies preserve real behavior while adding observability, preferable to full mocks when real logic is cheap and deterministic to run.',
    ],
  },
  'testing-hub/jest-fundamentals': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Vitest',            route: '/testing-hub/vitest' },
      { label: 'Snapshot Testing',  route: '/testing-hub/snapshot-testing' },
    ],
    tip: 'Snapshot tests capture serialized output for comparison — convenient for catching unintended changes, but risk becoming rubber-stamped if developers blindly run --updateSnapshot without reviewing the diff.',
    gotchas: [
      'Large, unfocused snapshots make it hard to tell WHAT changed and WHY — targeted assertions are often more maintainable than one giant snapshot.',
      'Snapshots work best for stable, rarely-changing output, not frequently-evolving UI.',
    ],
  },
  'testing-hub/vitest': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Jest Fundamentals', route: '/testing-hub/jest-fundamentals' },
    ],
    tip: 'Vitest reuses the same Vite transform pipeline already powering the dev server, avoiding the separate Babel/ts-jest transformation step Jest requires — a major source of Vitest\'s faster cold-start and watch-mode performance.',
    gotchas: [
      'Native ESM support avoids an entire class of module-resolution edge cases Jest\'s CJS-first architecture has historically struggled with.',
      'Vitest\'s Jest-compatible API means most Jest suites port over with minimal changes.',
    ],
  },
  'testing-hub/react-testing-library': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Jest Fundamentals', route: '/testing-hub/jest-fundamentals' },
    ],
    tip: 'RTL deliberately makes it awkward to query by internal state and easy to query by what a user sees (text, role, label) — a design choice that discourages implementation-coupled, brittle tests.',
    gotchas: [
      'Tests written against internal state or prop names break on refactors even when user-facing behavior is unchanged.',
      'userEvent more accurately simulates real user interaction sequences than fireEvent, which dispatches a single synthetic event.',
    ],
  },
  'testing-hub/angular-testing': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Jest Fundamentals', route: '/testing-hub/jest-fundamentals' },
    ],
    tip: 'TestBed compilation is relatively expensive per test — Zone.js-based change detection means fakeAsync/tick() are needed to flush microtasks and timers deterministically, or tests assert on stale DOM state.',
    gotchas: [
      'Shallow testing (stubbing child components) trades full-render fidelity for faster, more focused unit tests.',
      'Standalone components simplify TestBed setup since there is no NgModule to declare.',
    ],
  },
  'testing-hub/cypress': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Playwright', route: '/testing-hub/playwright' },
    ],
    tip: 'Cypress commands automatically retry against the DOM until an assertion passes or times out — eliminating most explicit waits that plague less integrated E2E tools.',
    gotchas: [
      'This retry-ability only applies to Cypress-native commands — wrapping arbitrary async logic bypasses it and can reintroduce flakiness.',
      'cy.intercept() decouples frontend test reliability from real backend availability and response times.',
    ],
  },
  'testing-hub/playwright': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Cypress',            route: '/testing-hub/cypress' },
      { label: 'Visual Regression',  route: '/testing-hub/visual-regression' },
    ],
    tip: 'Playwright auto-waits for actionability (visible, stable, enabled) before every interaction, eliminating explicit sleep() calls — and drives Chromium, Firefox, and WebKit with the same code, catching browser-specific bugs a Chromium-only suite would miss.',
    gotchas: [
      'Trace viewer turns debugging a flaky CI test from guesswork into replaying an exact timeline of what happened.',
      'The same actionability checks apply across all three engines, but rendering differences between them can still surface real bugs.',
    ],
  },
  'testing-hub/api-testing': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Contract Testing', route: '/testing-hub/contract-testing' },
      { label: 'MSW',              route: '/testing-hub/msw' },
    ],
    tip: 'Contract-first API testing validates conformance to a pre-agreed schema BEFORE testing implementation details, catching breaking changes to the public interface independent of internal logic correctness.',
    gotchas: [
      'Testing error responses (4xx/5xx shape) is as important as the happy path, since consumers build error handling that depends on a stable error contract.',
      'Schema validation libraries can be layered onto existing API tests to add contract verification without a full rewrite.',
    ],
  },
  'testing-hub/contract-testing': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'API Testing',       route: '/testing-hub/api-testing' },
      { label: 'Integration Testing', route: '/testing-hub/integration-testing' },
    ],
    tip: 'Consumer-driven contracts let the consuming service define its expectations, and the provider verifies it satisfies them — catching breaking changes before deployment without requiring both services running together like full E2E tests do.',
    gotchas: [
      'Pact generates an executable, versioned agreement from consumer tests that the provider replays against its own implementation.',
      'Contract testing scales better than full integration testing across many microservices, since each pairwise relationship is verified independently.',
    ],
  },
  'testing-hub/integration-testing': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Contract Testing', route: '/testing-hub/contract-testing' },
      { label: 'Testing Databases', route: '/testing-hub/testing-databases' },
    ],
    tip: 'Integration tests deliberately use REAL collaborators (real database, real internal service) instead of mocks, since the whole point is verifying components actually work together correctly, not in isolation.',
    gotchas: [
      'Testcontainers gives integration tests a real database engine without the shared-state risks of a persistent test database.',
      'External third-party services are usually still stubbed even in integration tests, since real calls introduce flakiness, cost, and rate limits.',
    ],
  },
  'testing-hub/testing-databases': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Integration Testing', route: '/testing-hub/integration-testing' },
    ],
    tip: 'Wrapping each test in a transaction and rolling it back at the end guarantees the next test starts from a clean state, without the overhead of recreating the entire schema per test.',
    gotchas: [
      'A shared test database accessed by parallel test runs risks tests interfering with each other\'s data — a unique schema/database per worker avoids this class of flaky failure.',
      'Seeding minimal, purpose-built test data makes each test\'s assumptions explicit, reducing the chance an unrelated data change breaks a seemingly unrelated test.',
    ],
  },
  'testing-hub/msw': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Mocking & Spies', route: '/testing-hub/mocking-spies' },
      { label: 'API Testing',     route: '/testing-hub/api-testing' },
    ],
    tip: 'MSW intercepts requests at the actual NETWORK layer, meaning application code makes real fetch/axios calls with no awareness it is mocked — this is why the same handlers work identically across browser, Node, and Storybook.',
    gotchas: [
      'Because app code is unaware, MSW exercises real request-building and response-parsing logic that a higher-level "mock the fetch function" approach would miss.',
      'MSW handlers simulate error responses and edge-case payloads just as easily as happy-path responses.',
    ],
  },
  'testing-hub/property-based-testing': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Mutation Testing', route: '/testing-hub/mutation-testing' },
    ],
    tip: 'Property-based testing generates hundreds of random inputs automatically to check an invariant holds for ALL valid inputs — exploring edge cases a human would never think to hand-write as an example test.',
    gotchas: [
      'Most frameworks automatically "shrink" a failing case to the smallest input that still reproduces it, turning an obscure random failure into a minimal reproduction.',
      'Property-based testing complements rather than replaces example-based tests for specific known edge cases.',
    ],
  },
  'testing-hub/mutation-testing': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Property-Based Testing', route: '/testing-hub/property-based-testing' },
    ],
    tip: 'A mutation score reports what percentage of introduced bugs (mutants) the test suite actually caught — unlike line coverage, a high mutation score is direct evidence tests would catch real regressions, not just that the code ran.',
    gotchas: [
      'Mutation testing is computationally expensive since the whole suite reruns per mutant — typically run less frequently (nightly) rather than every commit.',
      'A team chasing 100% line coverage while skipping mutation testing can have a false sense of security.',
    ],
  },
  'testing-hub/performance-testing': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Visual Regression', route: '/testing-hub/visual-regression' },
    ],
    tip: 'Load testing verifies expected traffic is handled correctly; stress testing deliberately finds the breaking point; soak testing runs sustained load over time to surface memory leaks or connection exhaustion — choosing the wrong test type for the question produces misleading conclusions.',
    gotchas: [
      'A brief load test cannot find a breaking point, and a stress test cannot validate steady-state capacity — pick the type matching the actual question.',
      'Soak tests surface issues (leaks, resource exhaustion) that only appear over hours or days of sustained load.',
    ],
  },
  'testing-hub/visual-regression': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Playwright',          route: '/testing-hub/playwright' },
      { label: 'Performance Testing', route: '/testing-hub/performance-testing' },
    ],
    tip: 'Font rendering and GPU differences between local machines and CI commonly produce pixel-level diffs that are not genuine regressions — running visual tests in a consistent, containerized environment minimizes this noise.',
    gotchas: [
      'Dynamic content (timestamps, ads) must be masked before capturing a screenshot, since unmasked content guarantees every run "differs."',
      'A pixel-perfect match says nothing about whether a button actually works when clicked — visual regression complements, not replaces, functional testing.',
    ],
  },
  'testing-hub/snapshot-testing': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Jest Fundamentals', route: '/testing-hub/jest-fundamentals' },
    ],
    tip: 'A snapshot test failing does not by itself indicate a bug — it indicates output changed, and a human must judge whether that change was intentional, which is fundamentally different from a traditional pass/fail assertion.',
    gotchas: [
      'Inline snapshots improve review visibility since a reviewer sees the expected output change directly in the code review diff.',
      'Best suited to stable, structurally complex output — poorly suited to frequently-evolving UI where snapshots become rubber-stamped noise.',
    ],
  },
  'testing-hub/xunit': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Jest Fundamentals', route: '/testing-hub/jest-fundamentals' },
    ],
    tip: 'xUnit creates a NEW instance of the test class for every test method — this structurally prevents shared-mutable-state-between-tests bugs that plague frameworks reusing one instance across a suite.',
    gotchas: [
      'IClassFixture/ICollectionFixture provide explicit, opt-in mechanisms for sharing expensive setup, making shared state a deliberate choice rather than an accident.',
      'Theory-based tests with InlineData/MemberData reduce duplication versus writing a near-identical Fact test per input.',
    ],
  },
  'testing-hub/cheatsheet': {
    apis: TESTING_DEFAULT.apis, docs: TESTING_DEFAULT.docs, resources: TESTING_DEFAULT.resources,
    related: [
      { label: 'Testing Fundamentals', route: '/testing-hub/testing-fundamentals' },
    ],
    tip: 'Consistent test naming (Given-When-Then, or "should" style) makes a failing test\'s intent clear from its name alone, without reading the test body first.',
    gotchas: [
      'Avoid vague names like "test1" — a failing test with an uninformative name forces reading the full implementation just to understand what broke.',
      'Picking one naming convention and applying it consistently across a suite speeds up scanning test output during debugging.',
    ],
  },

  // ── Python: per-page entries ────────────────────────────────────────────────
  'python/fundamentals': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Functions & Closures', route: '/python/functions-closures' },
      { label: 'Type Hints',           route: '/python/type-hints' },
    ],
    tip: 'A mutable default argument (def fn(items=[])) is created ONCE at function definition time and shared across every call that doesn\'t pass its own — one of Python\'s most common and surprising bugs.',
    gotchas: [
      'Only immutable types can be dict keys or set members, since hashability requires a value that never changes during its lifetime.',
      'Python passes references by value — a mutable argument can be modified in place with the change visible to the caller, but reassigning the parameter name is not.',
    ],
  },
  'python/functions-closures': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Fundamentals',                    route: '/python/fundamentals' },
      { label: 'Decorators & Context Managers',   route: '/python/decorators-context-managers' },
    ],
    tip: 'A closure captures a REFERENCE to a variable, not its value — a loop creating multiple closures over the loop variable all reference its FINAL value once the loop completes, unless captured via a default argument snapshot.',
    gotchas: [
      'nonlocal/global are required to explicitly permit a nested function to reassign an outer-scope variable — without them, assignment creates a new local variable instead.',
      'This late-binding trap is a frequent source of bugs creating callback lists in a loop.',
    ],
  },
  'python/decorators-context-managers': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Functions & Closures', route: '/python/functions-closures' },
      { label: 'File I/O',             route: '/python/file-io' },
    ],
    tip: 'A decorator without functools.wraps replaces the wrapped function\'s __name__ and __doc__ with the wrapper\'s own — silently breaking introspection, debuggers, and documentation generators.',
    gotchas: [
      'A context manager\'s __exit__ is guaranteed to run even if an exception occurs — the correct mechanism for guaranteed cleanup, unlike scattered try/finally.',
      'contextlib.contextmanager lets a single generator function implement a full context manager without a class.',
    ],
  },
  'python/type-hints': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Dataclasses & Pydantic', route: '/python/dataclasses-pydantic' },
      { label: 'Fundamentals',           route: '/python/fundamentals' },
    ],
    tip: 'Type hints are purely informational by default — the interpreter does NOT enforce them at runtime, meaning a function annotated with int params will happily accept strings unless a static checker (mypy) or Pydantic actually validates.',
    gotchas: [
      'Pydantic bridges this gap by enforcing types at runtime — a fundamentally different guarantee than static hints alone.',
      'Gradual typing (mixing typed/untyped code) is what has driven type hints\' widespread incremental adoption across the ecosystem.',
    ],
  },
  'python/oop': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Dataclasses & Pydantic', route: '/python/dataclasses-pydantic' },
    ],
    tip: 'Deep inheritance hierarchies tightly couple subclasses to a parent\'s implementation details — favoring composition achieves reuse without that coupling, and duck typing often means Python doesn\'t need formal inheritance for polymorphism at all.',
    gotchas: [
      'Python\'s multiple inheritance and Method Resolution Order make deep/wide hierarchies especially prone to the "diamond problem."',
      'Two unrelated classes implementing the same method signature can be used interchangeably without sharing a common base class.',
    ],
  },
  'python/dataclasses-pydantic': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Type Hints', route: '/python/type-hints' },
      { label: 'FastAPI',    route: '/python/fastapi' },
    ],
    tip: '@dataclass generates boilerplate but performs NO runtime validation — Pydantic validates and coerces data at construction time, raising ValidationError immediately, which is why Pydantic is standard for validating untrusted external input.',
    gotchas: [
      'Pydantic\'s validation overhead makes it a poor fit for extremely hot internal paths where data is already known correct — plain dataclasses are more appropriate there.',
      'FastAPI\'s deep Pydantic integration (auto OpenAPI schema, request/response validation) is a major reason for Pydantic\'s dominance in modern Python APIs.',
    ],
  },
  'python/comprehensions-generators': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Collections & Itertools', route: '/python/collections-itertools' },
    ],
    tip: 'A list comprehension eagerly builds the entire list in memory; a generator expression produces values lazily one at a time — for large or unbounded sequences, this determines whether code runs at all or crashes with a memory error.',
    gotchas: [
      'A generator can only be iterated once — passing it to code expecting multiple passes is a common source of "why is my second loop empty" bugs.',
      'Nested comprehensions past two levels usually hurt readability more than an explicit loop would.',
    ],
  },
  'python/collections-itertools': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Comprehensions & Generators', route: '/python/comprehensions-generators' },
    ],
    tip: 'deque provides O(1) append/pop from BOTH ends, unlike a plain list where inserting/removing from the front is O(n) — making it the correct choice for queue-like or sliding-window algorithms.',
    gotchas: [
      'groupby only groups CONSECUTIVE matching elements — data must be sorted by the grouping key first, or it silently under-groups.',
      'itertools functions operate lazily, avoiding materializing large intermediate lists for large or infinite iterables.',
    ],
  },
  'python/file-io': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Decorators & Context Managers', route: '/python/decorators-context-managers' },
    ],
    tip: 'with open(path) as f guarantees the file handle closes even if an exception occurs — manual open()/close() risks leaking the handle if an exception happens between the two calls with no try/finally.',
    gotchas: [
      'Reading a very large file entirely with .read() can exhaust memory — iterate line-by-line or in fixed chunks to keep usage bounded.',
      'File handle leaks accumulate silently until the OS descriptor limit is hit, often invisible in dev but a production surprise.',
    ],
  },
  'python/asyncio': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Threading & Multiprocessing', route: '/python/threading-multiprocessing' },
      { label: 'Concurrency Patterns',        route: '/python/concurrency-patterns' },
    ],
    tip: 'asyncio.TaskGroup (3.11+) provides structured concurrency — all tasks are guaranteed to complete or be cancelled before the block exits, and a failure automatically cancels siblings, unlike plain gather() which needs careful exception handling.',
    gotchas: [
      'Cancellation is cooperative, not preemptive — a task must hit an await point to notice it was cancelled; CPU-bound code with no awaits cannot be cancelled promptly.',
      'A fire-and-forget async void-style event handler can silently crash a whole async application if its exception is never awaited.',
    ],
  },
  'python/threading-multiprocessing': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Asyncio',              route: '/python/asyncio' },
      { label: 'Concurrency Patterns', route: '/python/concurrency-patterns' },
    ],
    tip: 'The GIL prevents multiple threads from executing Python bytecode simultaneously, so threading does NOT achieve CPU-bound parallelism — multiprocessing (separate processes, separate GILs) is required for genuine CPU-bound parallel work.',
    gotchas: [
      'A race condition can still occur even with the GIL, since bytecode-level operations can interleave in ways that corrupt compound "read, modify, write" operations.',
      'Deadlock from acquiring multiple locks in inconsistent order across code paths is a common bug — always acquire in a consistent, globally-agreed order.',
    ],
  },
  'python/concurrency-patterns': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Asyncio',                     route: '/python/asyncio' },
      { label: 'Threading & Multiprocessing', route: '/python/threading-multiprocessing' },
    ],
    tip: 'asyncio suits I/O-bound work with many concurrent waits; threading suits I/O-bound work with blocking libraries; multiprocessing is required for genuine CPU-bound parallelism — profile first to know which category a workload actually falls into.',
    gotchas: [
      'Using threading for CPU-bound work expecting it to parallelize is one of the most common Python performance misconceptions.',
      'Mixing these models incorrectly is a frequent source of "why isn\'t this faster" surprises.',
    ],
  },
  'python/django': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'FastAPI',      route: '/python/fastapi' },
      { label: 'SQLAlchemy',   route: '/python/sqlalchemy' },
    ],
    tip: 'The N+1 query problem happens when iterating a queryset and accessing a related object per item — select_related (JOIN, single-valued relations) and prefetch_related (separate optimized query, many-valued relations) fix it via different mechanisms.',
    gotchas: [
      'Django Debug Toolbar makes N+1 problems visible during development — without it, they often go unnoticed until production load.',
      'select_related and prefetch_related solve structurally different relationship types — using the wrong one still leaves N+1 queries.',
    ],
  },
  'python/fastapi': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Dataclasses & Pydantic', route: '/python/dataclasses-pydantic' },
      { label: 'Django',                 route: '/python/django' },
    ],
    tip: 'FastAPI\'s Depends() system resolves dependencies (DB sessions, auth, config) as parameters — this dependency graph is what makes testing dramatically easier via dependency_overrides, substituting a mock without touching endpoint code.',
    gotchas: [
      'Dependencies re-evaluate per request by default; yield-based dependencies handle setup/teardown even if an exception occurs.',
      'Overusing dependencies for stateless utility functions adds unnecessary indirection — reserve them for genuinely request-scoped concerns.',
    ],
  },
  'python/sqlalchemy': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Django',   route: '/python/django' },
    ],
    tip: 'SQLAlchemy\'s Session implements the unit-of-work pattern — changes accumulate in memory and only become SQL on commit/flush, not immediately on each change, which is why session scope should match one logical unit of work, not linger indefinitely.',
    gotchas: [
      'Lazy loading (the default for relationships) can cause the same N+1 problem as Django\'s ORM — joinedload()/selectinload() are the equivalent fix.',
      'Detached instance errors (accessing a relationship after the session closes) are a common pitfall.',
    ],
  },
  'python/numpy-pandas': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Scikit-Learn', route: '/python/scikit-learn' },
    ],
    tip: 'NumPy operations run in compiled C code on contiguous memory, avoiding per-element Python interpreter overhead — a Python for-loop over a NumPy array actually defeats the entire purpose, since each access re-enters the interpreter.',
    gotchas: [
      'Broadcasting lets operations between differently-shaped arrays happen without explicit loops or duplicated memory.',
      'Pandas is built on NumPy arrays, so using vectorized operations over .iterrows() is essential for acceptable performance on non-trivial datasets.',
    ],
  },
  'python/scikit-learn': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'NumPy & Pandas', route: '/python/numpy-pandas' },
    ],
    tip: 'Splitting into train/test BEFORE any preprocessing is essential — fitting a scaler on the full dataset (including test data) leaks information, producing an artificially optimistic evaluation.',
    gotchas: [
      'Pipeline ensures fit() only runs on training data and transform() applies consistently — a structural safeguard against accidental leakage.',
      'A model performing far better on training than test data has memorized noise rather than learned generalizable patterns.',
    ],
  },
  'python/pytest': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Debugging & Profiling', route: '/python/debugging-profiling' },
    ],
    tip: 'Fixture scope (function/class/module/session) controls how often setup re-runs — function-scoped guarantees complete isolation at the cost of re-running expensive setup; session-scoped trades some isolation for speed on costly resources.',
    gotchas: [
      'Tests sharing mutable state via an improperly-scoped fixture can produce order-dependent failures that only surface when run after another specific test.',
      'Parametrized tests reduce boilerplate for testing the same logic against many input/output pairs.',
    ],
  },
  'python/debugging-profiling': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Pytest', route: '/python/pytest' },
    ],
    tip: 'cProfile reveals where a program actually spends time — optimizing based on intuition alone frequently targets the wrong bottleneck, since the actual slow path is often surprising and only findable through measurement.',
    gotchas: [
      'Memory profiling (tracemalloc) answers a different question than time profiling — a function can be fast but leak memory across many calls.',
      'A debugger is best for understanding WHY logic produces an unexpected value; a profiler is best for WHERE time/memory is spent — conflating the two wastes debugging effort.',
    ],
  },
  'python/packaging': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Fundamentals', route: '/python/fundamentals' },
    ],
    tip: 'A lock file records the EXACT resolved version of every dependency (including transitive) — guaranteeing "works on my machine" translates to production, unlike a loose requirements.txt range that can silently pull a newer breaking version.',
    gotchas: [
      'Virtual environments isolate a project\'s dependencies from the system Python and from other projects needing different versions of the same library.',
      'pyproject.toml has become the modern standard, replacing the older setup.py-based approach.',
    ],
  },
  'python/celery': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'FastAPI',    route: '/python/fastapi' },
      { label: 'Asyncio',    route: '/python/asyncio' },
    ],
    tip: 'Celery\'s default delivery guarantee is at-LEAST-once, not exactly-once — task logic must be idempotent (safely re-runnable) to avoid duplicate side effects when a redelivered task executes after a worker crash.',
    gotchas: [
      'acks_late=True reduces the window where a crashed worker silently loses a task, but increases the chance of duplicate execution — a deliberate tradeoff.',
      'Retries with exponential backoff avoid overwhelming an already-struggling downstream service with near-simultaneous retry attempts.',
    ],
  },
  'python/interview-prep': {
    apis: PYTHON_DEFAULT.apis, docs: PYTHON_DEFAULT.docs, resources: PYTHON_DEFAULT.resources,
    related: [
      { label: 'Type Hints',           route: '/python/type-hints' },
      { label: 'Functions & Closures', route: '/python/functions-closures' },
    ],
    tip: 'Beyond syntax, interviews commonly probe GIL implications, mutable default argument pitfalls, and shallow-vs-deep copying — these separate surface familiarity from genuine Python fluency.',
    gotchas: [
      'Complexity analysis of built-in operations (list.append O(1) amortized, "in" O(n) on a list but O(1) on a set/dict) is frequently tested.',
      'Being able to explain WHY unexpected behavior happens demonstrates a stronger grasp than just writing correct code.',
    ],
  },

  // ── DSA: per-page entries ───────────────────────────────────────────────────
  'dsa/big-o': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Arrays',        route: '/dsa/arrays' },
      { label: 'Binary Search', route: '/dsa/binary-search' },
    ],
    tip: 'Nested loops don\'t always mean O(n²) — if the inner loop\'s range shrinks with progress, actual complexity may be lower and must be derived carefully, not assumed from loop structure alone.',
    gotchas: [
      'A method call like .includes() inside a loop silently adds hidden O(n) work per iteration, turning an apparent O(n) algorithm into O(n²).',
      'Recursive functions need analyzing both call count AND work per call — naive Fibonacci looks O(1)-per-call but is actually O(2ⁿ) due to branching.',
    ],
  },
  'dsa/arrays': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Big-O Notation',  route: '/dsa/big-o' },
      { label: 'Strings',         route: '/dsa/strings' },
    ],
    tip: 'Dynamic array resizing (doubling capacity, not fixed-amount growth) is what makes amortized append cost O(1) — a single resize costs O(n), but this cost is amortized across many appends.',
    gotchas: [
      'The correct answer to "what is push\'s time complexity" is O(1) AMORTIZED, not O(n), even though any individual call could trigger a resize.',
      'Pre-allocating to the expected final size avoids repeated resize overhead when the size is known in advance.',
    ],
  },
  'dsa/strings': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Arrays',  route: '/dsa/arrays' },
      { label: 'Trie',    route: '/dsa/trie' },
    ],
    tip: 'Strings are immutable — repeated concatenation in a loop is a classic O(n²) anti-pattern, since each concatenation allocates a new string; the sliding window technique is the dominant O(n) pattern for substring problems.',
    gotchas: [
      'String equality comparison is O(n) in length, not O(1) — easy to overlook when reasoning about algorithms that repeatedly compare or hash strings.',
      'Building up a large string one small piece at a time should use a mutable buffer (StringBuilder-equivalent), not repeated concatenation.',
    ],
  },
  'dsa/linked-lists': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Doubly Linked Lists', route: '/dsa/doubly-linked-lists' },
      { label: 'Stacks & Queues',     route: '/dsa/stacks-queues' },
    ],
    tip: 'The fast-and-slow (tortoise and hare) pointer technique detects cycles in O(n)/O(1) space — if a cycle exists, the pointers are mathematically guaranteed to meet, since the fast pointer gains one step per iteration once both are inside the cycle.',
    gotchas: [
      'Resetting one pointer to the head after detecting a cycle finds the exact cycle-start node — a common interview follow-up.',
      'The same technique finds the middle of a list in one pass, showing how one pattern solves multiple seemingly-different problems.',
    ],
  },
  'dsa/doubly-linked-lists': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Linked Lists', route: '/dsa/linked-lists' },
    ],
    tip: 'The extra "previous" pointer enables O(1) removal given only a node reference, and O(1) insertion/removal from BOTH ends — this is why deque implementations and LRU caches are built on doubly linked lists.',
    gotchas: [
      'Sentinel head/tail nodes eliminate special-case null checks for boundary insertion/removal, unifying every case into the same code path.',
      'The extra pointer per node roughly doubles pointer storage overhead versus a singly linked list — a real cost in memory-constrained environments.',
    ],
  },
  'dsa/stacks-queues': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Linked Lists', route: '/dsa/linked-lists' },
      { label: 'Heaps',        route: '/dsa/heaps' },
    ],
    tip: 'A queue can be implemented with two stacks (amortized O(1) per operation) — each element moves between stacks at most twice total across its lifetime, keeping amortized cost constant despite an occasional O(n) transfer.',
    gotchas: [
      'The monotonic stack pattern (keeping elements in strictly increasing/decreasing order) solves an entire family of "next greater element" problems in O(n).',
      'This two-stack simulation is a classic interview question specifically testing understanding of amortized analysis.',
    ],
  },
  'dsa/hash-tables': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Arrays', route: '/dsa/arrays' },
    ],
    tip: 'A poor hash function that clusters keys into the same bucket destroys the O(1) average-case guarantee entirely — separate chaining and open addressing are the two dominant collision-resolution strategies, each with different cache-locality tradeoffs.',
    gotchas: [
      'Load factor crossing a threshold (commonly 0.75) triggers automatic rehashing to maintain amortized O(1) operations.',
      'Open addressing requires careful tombstone handling on deletion to avoid breaking probe sequences.',
    ],
  },
  'dsa/trie': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Strings',      route: '/dsa/strings' },
      { label: 'Hash Tables',  route: '/dsa/hash-tables' },
    ],
    tip: 'A trie supports prefix queries (find all words starting with a prefix) in time proportional to the prefix length — a hash set cannot answer these at all without a full scan of every stored string.',
    gotchas: [
      'A trie\'s memory usage can exceed a hash set\'s when stored strings share few common prefixes — its space efficiency depends on prefix-sharing in the actual dataset.',
      'Compressed tries (radix trees) merge single-child chains into one edge, addressing naive-trie memory overhead while preserving query performance.',
    ],
  },
  'dsa/binary-search': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Big-O Notation', route: '/dsa/big-o' },
      { label: 'BST',            route: '/dsa/bst' },
    ],
    tip: 'Binary search generalizes to any monotonic predicate, not just sorted-array lookup — "binary search on the answer" searches over a range of possible answers using a feasibility check, common for optimization problems.',
    gotchas: [
      'Binary search requires O(1) random access to achieve O(log n) — applying it to a linked list degrades to O(n log n) overall.',
      'Off-by-one errors (inclusive vs exclusive range bounds) are the most common bug — reason deliberately, don\'t pattern-match from memory.',
    ],
  },
  'dsa/bst': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Binary Trees',   route: '/dsa/binary-trees' },
      { label: 'Binary Search',  route: '/dsa/binary-search' },
    ],
    tip: 'A plain BST built from sorted input degenerates into a linked list — O(n) worst-case instead of O(log n) — which is why self-balancing variants (AVL, red-black trees) maintain a height invariant via rotations regardless of insertion order.',
    gotchas: [
      'Red-black trees favor faster insertion/deletion (fewer rotations) over AVL\'s stricter balance — why most standard library ordered maps use red-black trees.',
      '"What happens if you insert 1,2,3,4,5 in order" is the classic follow-up testing whether a candidate knows plain BSTs can degenerate.',
    ],
  },
  'dsa/binary-trees': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'BST',              route: '/dsa/bst' },
      { label: 'Graphs (BFS/DFS)', route: '/dsa/graphs-bfs-dfs' },
    ],
    tip: 'Recursive traversals map naturally to a tree\'s recursive structure but risk stack overflow on very deep/unbalanced trees — iterative traversals with an explicit stack avoid this at the cost of code complexity.',
    gotchas: [
      'Level-order traversal fundamentally requires a QUEUE, not a stack, since it must process each depth level before moving to the next.',
      'Morris traversal achieves O(1)-space inorder traversal by temporarily modifying tree structure — an advanced space-optimization technique.',
    ],
  },
  'dsa/heaps': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Stacks & Queues', route: '/dsa/stacks-queues' },
    ],
    tip: 'A min-heap of size K is the standard technique for finding the K largest elements in a stream, achieving O(n log K) — meaningfully better than sorting the entire stream at O(n log n).',
    gotchas: [
      'Building a heap from an unsorted array via heapify runs in O(n), not O(n log n) — most nodes sit near the bottom and require little sift-down work.',
      'A heap only guarantees the root is min/max — it does NOT provide fully sorted order for the rest, unlike a balanced BST.',
    ],
  },
  'dsa/graphs-bfs-dfs': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Graph Algorithms', route: '/dsa/graph-algorithms' },
      { label: 'Binary Trees',     route: '/dsa/binary-trees' },
    ],
    tip: 'BFS guarantees the shortest path in edge count for unweighted graphs; DFS gives no such guarantee since it dives deep before backtracking — but both run in O(V+E), so the choice is driven by which traversal order the problem actually needs.',
    gotchas: [
      'DFS uses less memory in the worst case for wide graphs, since its stack only holds one root-to-current path.',
      'BFS is the natural choice for "minimum number of steps" problems; DFS for exhaustive path exploration or cycle detection.',
    ],
  },
  'dsa/graph-algorithms': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Graphs (BFS/DFS)', route: '/dsa/graphs-bfs-dfs' },
      { label: 'Greedy',           route: '/dsa/greedy' },
    ],
    tip: 'Dijkstra finds single-source shortest paths in O((V+E)logV) but requires NON-NEGATIVE edge weights — Bellman-Ford handles negative weights (and detects negative cycles) at higher O(V·E) cost.',
    gotchas: [
      'Dijkstra produces incorrect results with any negative edge, since it greedily finalizes distances without revisiting them.',
      'Floyd-Warshall computes all-pairs shortest paths in O(V³), more efficient than running Dijkstra from every vertex when all-pairs distances are actually needed.',
    ],
  },
  'dsa/bit-manipulation': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Arrays', route: '/dsa/arrays' },
    ],
    tip: 'Bitmasks provide O(1) set operations (union, intersection via bitwise AND/OR) for compactly representing small sets of flags — genuinely faster in practice than hash-set alternatives, not just theoretically equivalent.',
    gotchas: [
      'Bitmask DP (representing visited state as a bitmask, as in TSP) is standard for problems with a small number of discrete elements (typically under ~20-25).',
      'Understanding two\'s complement is essential for correctly reasoning about right-shift behavior on negative numbers.',
    ],
  },
  'dsa/recursion-backtracking': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Dynamic Programming', route: '/dsa/dynamic-programming' },
    ],
    tip: 'Backtracking adds PRUNING over pure brute-force recursion — abandoning a branch as soon as it\'s known invalid, avoiding wasted exploration, even though both share the same worst-case complexity bound.',
    gotchas: [
      'A common bug is forgetting to undo a state change (remove from a "current path" array, reset a visited flag) on the way back up the recursion.',
      'Trying the most constrained choice first prunes the search tree faster than an arbitrary ordering, even with otherwise-identical pruning logic.',
    ],
  },
  'dsa/dynamic-programming': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'DP Patterns',              route: '/dsa/dp-patterns' },
      { label: 'Recursion & Backtracking', route: '/dsa/recursion-backtracking' },
    ],
    tip: 'Top-down memoization mirrors the natural recursive definition (easier to derive correctly); bottom-up tabulation avoids recursion overhead and more easily enables space optimization (reducing O(n²) to O(n) or O(1)).',
    gotchas: [
      'Starting with a correct top-down solution then converting to bottom-up is a common, effective strategy once dependencies are well understood.',
      'Bottom-up often runs faster in practice due to eliminated function-call overhead versus top-down recursion.',
    ],
  },
  'dsa/dp-patterns': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Dynamic Programming', route: '/dsa/dynamic-programming' },
      { label: 'Greedy',              route: '/dsa/greedy' },
    ],
    tip: 'Recognizing which recurring PATTERN a problem matches (0/1 knapsack, LCS, interval DP) is often more valuable in an interview than deriving the recurrence from scratch each time.',
    gotchas: [
      'The 0/1 knapsack pattern applies whenever each item is usable at most once under a capacity constraint — often disguised as "partition into equal-sum subsets."',
      'Interval DP (state = a range [i,j]) applies when the optimal solution requires deciding how to split or combine a contiguous range.',
    ],
  },
  'dsa/greedy': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'DP Patterns', route: '/dsa/dp-patterns' },
    ],
    tip: 'A greedy algorithm is only correct if the problem exhibits the greedy-choice property — verify this via an exchange argument or induction before trusting a greedy solution, since a locally-sensible strategy isn\'t automatically globally optimal.',
    gotchas: [
      '0/1 knapsack is the canonical counterexample — greedily picking by value-to-weight ratio does NOT guarantee optimality, unlike the fractional knapsack variant.',
      'When greedy fails to provably work, dynamic programming is the typical fallback, exploring the full solution space instead of committing irrevocably.',
    ],
  },
  'dsa/advanced-sorts': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Basic Sorts', route: '/dsa/basic-sorts' },
    ],
    tip: 'Merge sort guarantees O(n log n) worst-case and is stable; quicksort is typically faster in practice due to cache locality but has O(n²) worst-case on adversarial input unless randomized pivots or introsort fallbacks are used.',
    gotchas: [
      'Heapsort guarantees O(n log n) with O(1) extra space but has poor cache locality, usually making it slower than quicksort despite the same asymptotic complexity.',
      'Most production standard libraries use hybrid algorithms (Timsort, introsort) that switch strategies based on input characteristics.',
    ],
  },
  'dsa/basic-sorts': {
    apis: DSA_DEFAULT.apis, docs: DSA_DEFAULT.docs, resources: DSA_DEFAULT.resources,
    related: [
      { label: 'Advanced Sorts', route: '/dsa/advanced-sorts' },
      { label: 'Big-O Notation', route: '/dsa/big-o' },
    ],
    tip: 'Insertion sort outperforms O(n log n) algorithms on small arrays due to lower constant-factor overhead — many production sorts switch to it as a base case for small subarrays, and it\'s adaptive (near-O(n) on nearly-sorted data).',
    gotchas: [
      'Bubble sort and selection sort are rarely used in production due to consistent O(n²) even on nearly-sorted data, but remain useful for building intuition.',
      'Understanding basic sorts builds the invariant-reasoning skill needed to analyze and debug more advanced algorithms.',
    ],
  },

  // ── MongoDB: per-page entries ────────────────────────────────────────────────
  'mongodb/fundamentals': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'CRUD Operations',  route: '/mongodb/crud-operations' },
      { label: 'Data Modelling',   route: '/mongodb/data-modelling' },
    ],
    tip: 'MongoDB stores documents as BSON (a binary superset of JSON) — this is why it natively supports types JSON lacks (dates, binary data, precise decimals) that a plain JSON document store would need to encode as strings.',
    gotchas: [
      'A collection has no enforced schema by default — schema validation rules must be explicitly added if consistency across documents matters.',
      'Documents are limited to 16MB — a document approaching this limit is usually a modeling smell (embedding too much unbounded data).',
    ],
  },
  'mongodb/installation-setup': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Fundamentals', route: '/mongodb/fundamentals' },
      { label: 'Security',     route: '/mongodb/security' },
    ],
    tip: 'A fresh MongoDB install binds to localhost by default with no authentication configured out of the box in many setups — enabling auth and binding only to needed interfaces before exposing a deployment is a critical first step, not an afterthought.',
    gotchas: [
      'MongoDB Atlas (managed) handles patching, backups, and scaling automatically — self-hosting takes on that operational burden directly.',
      'Connection string format differences (srv vs standard) trip up many developers moving between Atlas and self-hosted setups.',
    ],
  },
  'mongodb/crud-operations': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Query Operators',      route: '/mongodb/query-operators' },
      { label: 'Update Operators',     route: '/mongodb/update-operators' },
    ],
    tip: 'updateOne/updateMany with $set only modify the specified fields — replacing a document entirely with a plain object (no operators) silently DROPS every field not included, a common accidental-data-loss bug.',
    gotchas: [
      'insertMany is not atomic across documents by default — a failure partway through leaves earlier documents inserted unless ordered:false semantics are understood.',
      'deleteMany with an empty filter {} deletes EVERY document in the collection — a classic production incident waiting to happen.',
    ],
  },
  'mongodb/query-operators': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'CRUD Operations',  route: '/mongodb/crud-operations' },
      { label: 'Indexes',          route: '/mongodb/indexes' },
    ],
    tip: '$in with a large array of values still benefits from an index on that field — but $regex with a leading wildcard (/^.*foo/) cannot use an index efficiently and forces a full collection scan.',
    gotchas: [
      'Comparison operators ($gt, $lt) on a missing field behave differently than expected — a document without the field is excluded, not treated as null/0.',
      '$or queries generally cannot use a single compound index as efficiently as an equivalent $and — check explain() output before assuming an index is used.',
    ],
  },
  'mongodb/update-operators': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'CRUD Operations', route: '/mongodb/crud-operations' },
    ],
    tip: '$inc is atomic at the document level — safe for concurrent counter updates without a separate read-modify-write cycle, unlike reading a value in application code, incrementing it, and writing it back.',
    gotchas: [
      '$push without $each appends a single element; forgetting $each when trying to append multiple elements silently pushes an array as one nested element instead.',
      'upsert:true creates a new document if no match is found — a typo in the filter can silently create unwanted duplicate documents instead of updating the intended one.',
    ],
  },
  'mongodb/array-queries': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Query Operators',  route: '/mongodb/query-operators' },
      { label: 'Projections & Sorting', route: '/mongodb/projections-sorting' },
    ],
    tip: '$elemMatch is required to match multiple conditions against the SAME array element — without it, MongoDB matches conditions independently across ANY elements, a subtle and common bug when querying arrays of objects.',
    gotchas: [
      'A multikey index (on an array field) has different performance characteristics and limitations (only one array field per compound index) versus a single-value index.',
      '$size only matches an exact array length — it cannot be combined with range comparisons in the same operator.',
    ],
  },
  'mongodb/projections-sorting': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Query Operators', route: '/mongodb/query-operators' },
      { label: 'Indexes',         route: '/mongodb/indexes' },
    ],
    tip: 'A sort without a supporting index requires an in-memory sort with a 32MB working-set limit by default — sorting large result sets without the right index can silently fail or fall back to disk with a real performance cliff.',
    gotchas: [
      'Projections reduce network transfer but do NOT reduce the work MongoDB does to find matching documents — an inefficient query stays inefficient regardless of the projection.',
      'Excluding _id explicitly (_id: 0) is required, since it is included by default even when other fields are excluded.',
    ],
  },
  'mongodb/aggregation-pipeline': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Aggregation Expressions', route: '/mongodb/aggregation-expressions' },
      { label: 'Lookup & Joins',          route: '/mongodb/lookup-joins' },
    ],
    tip: 'Placing a $match stage as EARLY as possible in the pipeline lets MongoDB use an index and reduce the document count before expensive downstream stages ($group, $sort) — reordering stages for this reason is one of the most impactful pipeline optimizations.',
    gotchas: [
      '$group with _id: null aggregates ALL documents into one result — a very common way to accidentally lose the intended per-key grouping.',
      'Each pipeline stage receives the OUTPUT of the previous stage, not the original collection — field names from an early $project affect what later stages can reference.',
    ],
  },
  'mongodb/aggregation-expressions': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Aggregation Pipeline', route: '/mongodb/aggregation-pipeline' },
    ],
    tip: '$$ROOT captures the entire current document within an expression — useful for preserving original fields through a $group stage that would otherwise only retain explicitly listed fields.',
    gotchas: [
      'Expression operators ($cond, $switch) evaluate at the document level within a stage — they cannot reference fields introduced by a LATER stage.',
      '$dateToString and similar date operators require the field to actually be a BSON Date type, not a string that merely looks like a date.',
    ],
  },
  'mongodb/lookup-joins': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Aggregation Pipeline', route: '/mongodb/aggregation-pipeline' },
      { label: 'Data Modelling',       route: '/mongodb/data-modelling' },
    ],
    tip: '$lookup performs a left outer join, but without a supporting index on the foreign field, it degrades to a full collection scan PER document in the local collection — a major, easy-to-miss performance trap at scale.',
    gotchas: [
      'Overusing $lookup where embedding would be more appropriate reintroduces relational-style joins that MongoDB\'s document model was meant to reduce the need for.',
      'The pipeline variant of $lookup (with a nested pipeline) enables more complex join conditions than the simple localField/foreignField form.',
    ],
  },
  'mongodb/data-modelling': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Schema Design Patterns', route: '/mongodb/schema-design-patterns' },
      { label: 'Lookup & Joins',         route: '/mongodb/lookup-joins' },
    ],
    tip: 'Embedding data that is read together and rarely changes independently avoids a $lookup at read time; referencing data that grows unboundedly or is shared across many parents avoids hitting the 16MB document limit — the choice should follow actual access patterns, not habit.',
    gotchas: [
      'An unbounded array (like comments on a wildly popular post) embedded in a parent document risks eventually exceeding the document size limit.',
      'Denormalizing for read performance means writes must update multiple copies of the same data — a real consistency tradeoff to weigh deliberately.',
    ],
  },
  'mongodb/schema-design-patterns': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Data Modelling', route: '/mongodb/data-modelling' },
    ],
    tip: 'The bucket pattern groups many small, frequently-inserted documents (like time-series sensor readings) into larger documents by time window, reducing index overhead and improving write throughput versus one document per reading.',
    gotchas: [
      'The polymorphic pattern (documents in one collection with varying shapes, distinguished by a type field) trades schema flexibility for more complex application-level validation.',
      'Applying a design pattern without matching the actual read/write access pattern of the application often makes performance worse, not better.',
    ],
  },
  'mongodb/indexes': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Query Performance', route: '/mongodb/query-performance' },
      { label: 'Query Operators',   route: '/mongodb/query-operators' },
    ],
    tip: 'Compound index field ORDER matters — a query filtering on fields (A, B) can use an index defined as {A:1, B:1} but generally cannot efficiently use one defined as {B:1, A:1} for the same filter, following the ESR (Equality, Sort, Range) rule.',
    gotchas: [
      'Every index speeds up reads but slows down writes (each write must update every index) — indexing every field "just in case" has a real cost.',
      'A covered query (index contains every field the query needs) avoids touching the actual documents at all, a significant performance win.',
    ],
  },
  'mongodb/query-performance': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Indexes', route: '/mongodb/indexes' },
    ],
    tip: 'explain("executionStats") reveals whether a query used an index scan or a full COLLSCAN, and how many documents were examined versus returned — a query examining far more documents than it returns is a strong signal a better index is needed.',
    gotchas: [
      'A high "totalDocsExamined" relative to "nReturned" indicates the index (or lack of one) is not effectively filtering — a classic performance red flag.',
      'The profiler (db.setProfilingLevel) captures slow queries in production without requiring explain() to be run manually on every suspect query.',
    ],
  },
  'mongodb/transactions': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Replication & Sharding', route: '/mongodb/replication-sharding' },
    ],
    tip: 'Multi-document transactions require a replica set (even a single-node one) — they are not available on a truly standalone MongoDB instance, since the transaction mechanism relies on the oplog used for replication.',
    gotchas: [
      'Transactions add real overhead — reach for good document design (embedding related data) FIRST, using multi-document transactions only when genuinely needed.',
      'A transaction held open too long can hit the default timeout and abort — keep transactional operations short and focused.',
    ],
  },
  'mongodb/change-streams': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Transactions', route: '/mongodb/transactions' },
    ],
    tip: 'Change streams let an application react to data changes in real time without polling — built on the same oplog mechanism that powers replication, meaning they also require a replica set (or sharded cluster) to function.',
    gotchas: [
      'A resume token must be persisted to correctly resume a change stream after an application restart without missing or duplicating events.',
      'Change streams only capture changes AFTER they start — they are not a substitute for an initial full data sync when bootstrapping a new consumer.',
    ],
  },
  'mongodb/replication-sharding': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Transactions',    route: '/mongodb/transactions' },
      { label: 'Change Streams',  route: '/mongodb/change-streams' },
    ],
    tip: 'A replica set provides high availability (automatic failover if the primary fails); sharding provides horizontal scale by distributing data across multiple shards — these solve DIFFERENT problems and are often combined, not interchangeable.',
    gotchas: [
      'A poorly chosen shard key creates unbalanced chunks (hot shards) that bottleneck throughput regardless of how many shards exist — much like a poor partition key in other distributed databases.',
      'Read preference settings (primary, secondary, nearest) trade consistency for read scalability and latency — choose deliberately per use case.',
    ],
  },
  'mongodb/time-series': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Schema Design Patterns', route: '/mongodb/schema-design-patterns' },
    ],
    tip: 'Native time-series collections automatically apply the bucket pattern internally, storing measurements more compactly and with better compression than a naive one-document-per-reading approach.',
    gotchas: [
      'Time-series collections have restrictions on updates and index types compared to regular collections — check compatibility before migrating existing time-based data.',
      'Choosing the right granularity (seconds, minutes, hours) setting affects both storage efficiency and query performance for a given workload.',
    ],
  },
  'mongodb/atlas-search': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Query Performance', route: '/mongodb/query-performance' },
    ],
    tip: 'Atlas Search (built on Lucene) provides full-text search capabilities MongoDB\'s standard query language cannot express efficiently — relevance scoring, fuzzy matching, and faceted search, at the cost of requiring Atlas (not available on self-hosted deployments).',
    gotchas: [
      'A $search aggregation stage must typically be the FIRST stage in a pipeline — placing it elsewhere often fails or behaves unexpectedly.',
      'Atlas Search indexes are managed separately from regular MongoDB indexes and have their own dedicated syntax for defining analyzers and mappings.',
    ],
  },
  'mongodb/security': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'Installation & Setup', route: '/mongodb/installation-setup' },
    ],
    tip: 'Role-based access control should grant the narrowest role a given application or user genuinely needs — a read-only reporting service with readWrite or dbAdmin access is unnecessary risk if that credential is ever compromised.',
    gotchas: [
      'Field-level encryption (client-side field level encryption) protects sensitive data even from a database administrator with full server access.',
      'Network exposure (binding to 0.0.0.0 without a firewall) combined with weak or no authentication is one of the most common causes of publicly exposed, unsecured MongoDB instances found by security researchers.',
    ],
  },
  'mongodb/mongodb-nodejs': {
    apis: MONGO_DEFAULT.apis, docs: MONGO_DEFAULT.docs, resources: MONGO_DEFAULT.resources,
    related: [
      { label: 'CRUD Operations', route: '/mongodb/crud-operations' },
    ],
    tip: 'Mongoose (a popular Node.js ODM) adds schema validation, middleware hooks, and query builders on top of the native driver — the native MongoDB Node.js driver alone provides no schema enforcement at all, by design matching MongoDB\'s own flexible-schema philosophy.',
    gotchas: [
      'Reusing a single MongoClient instance (connection pooling) across the application lifetime is the correct pattern — creating a new client per request exhausts connections under load.',
      'Mongoose\'s automatic type casting can silently coerce unexpected input types — understand its casting behavior before trusting it for validation.',
    ],
  },

  // ── Security: per-page entries ──────────────────────────────────────────────
  'security/fundamentals': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'OWASP Top 10',    route: '/security/owasp-top-10' },
      { label: 'Threat Modelling', route: '/security/threat-modelling' },
    ],
    tip: 'Security is a property of the WHOLE system, not a single control — defense in depth (multiple overlapping layers) means a single control failing does not immediately compromise the entire application.',
    gotchas: [
      'The CIA triad (Confidentiality, Integrity, Availability) is a useful framework, but real incidents often fail in ways that span all three simultaneously.',
      'Security added as an afterthought is consistently more expensive and less effective than security designed in from the start.',
    ],
  },
  'security/threat-modelling': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'Fundamentals',   route: '/security/fundamentals' },
      { label: 'OWASP Top 10',   route: '/security/owasp-top-10' },
    ],
    tip: 'STRIDE (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege) gives a structured way to systematically ask "what could go wrong here" for each system component rather than relying on ad-hoc intuition.',
    gotchas: [
      'Threat modelling is most valuable done EARLY in design, when changing the architecture is still cheap — retrofitting it after implementation limits what can realistically be fixed.',
      'A threat model is a living document — it should be revisited when the system\'s architecture or trust boundaries change.',
    ],
  },
  'security/owasp-top-10': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'Injection', route: '/security/injection' },
      { label: 'XSS',       route: '/security/xss' },
    ],
    tip: 'The OWASP Top 10 is a list of the most IMPACTFUL and common web application risks, not an exhaustive checklist — passing every item on the list does not mean an application is secure, only that it avoids the most common categories of failure.',
    gotchas: [
      'The list is periodically revised (categories merge, split, or reorder) as the threat landscape changes — always check which version a resource references.',
      'Broken Access Control has topped the list in recent revisions, reflecting how commonly authorization checks are missed or implemented incorrectly.',
    ],
  },
  'security/injection': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'OWASP Top 10',  route: '/security/owasp-top-10' },
      { label: 'XSS',           route: '/security/xss' },
    ],
    tip: 'Parameterized queries (prepared statements) prevent SQL injection by sending user input as DATA, never as part of the query structure — string-concatenating user input into a query is the root cause of virtually every injection vulnerability.',
    gotchas: [
      'ORM usage does not automatically prevent injection — raw query methods or string-built filters within an ORM can still be vulnerable.',
      'Injection isn\'t limited to SQL — command injection, LDAP injection, and NoSQL injection follow the same root cause of untrusted input treated as executable structure.',
    ],
  },
  'security/xss': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'CSRF & Clickjacking', route: '/security/csrf-clickjacking' },
      { label: 'Security Headers',    route: '/security/security-headers' },
    ],
    tip: 'Modern frameworks (React, Angular) auto-escape interpolated content by default, closing most reflected/stored XSS vectors — but bypassing the escaping mechanism (innerHTML, dangerouslySetInnerHTML, bypassSecurityTrust) reopens the exact vulnerability the framework was protecting against.',
    gotchas: [
      'A Content-Security-Policy header is a critical defense-in-depth layer — even a missed escaping bug can be mitigated if the CSP blocks inline script execution.',
      'DOM-based XSS (client-side JS reading and unsafely writing untrusted data) is not caught by server-side output encoding alone.',
    ],
  },
  'security/csrf-clickjacking': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'XSS',              route: '/security/xss' },
      { label: 'Security Headers', route: '/security/security-headers' },
    ],
    tip: 'SameSite=Strict/Lax on cookies prevents CSRF for cookie-based auth by not sending the cookie on cross-site requests — but has NO effect on Authorization header-based tokens, which need a separate CSRF-token mechanism if genuinely at risk.',
    gotchas: [
      'X-Frame-Options / frame-ancestors CSP directive prevents clickjacking by blocking the page from being embedded in a hostile iframe.',
      'CSRF only matters for state-changing requests using ambient credentials (cookies) — a pure token-in-header API is inherently less exposed to classic CSRF.',
    ],
  },
  'security/tls-https': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'Security Headers', route: '/security/security-headers' },
      { label: 'Asymmetric Cryptography', route: '/security/asymmetric-cryptography' },
    ],
    tip: 'HSTS (Strict-Transport-Security header) instructs browsers to NEVER connect over plain HTTP again for that domain, closing the window an attacker could exploit on a user\'s first visit before a redirect to HTTPS happens.',
    gotchas: [
      'TLS termination at a load balancer means traffic between the load balancer and backend may be unencrypted — verify whether internal traffic also needs TLS.',
      'Certificate expiry is one of the most common self-inflicted outages — automated renewal (like Let\'s Encrypt with ACME) avoids manual tracking failures.',
    ],
  },
  'security/security-headers': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'XSS',        route: '/security/xss' },
      { label: 'TLS/HTTPS',  route: '/security/tls-https' },
    ],
    tip: 'Content-Security-Policy is the single most impactful security header for mitigating XSS impact — a well-scoped CSP can prevent injected scripts from executing even if an XSS vulnerability exists elsewhere in the application.',
    gotchas: [
      'X-Content-Type-Options: nosniff prevents browsers from MIME-sniffing a response into an executable type it wasn\'t served as.',
      'securityheaders.com gives a quick external check of which headers are actually being sent in production.',
    ],
  },
  'security/password-security': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'Hashing',  route: '/security/hashing' },
      { label: 'MFA',      route: '/security/mfa' },
    ],
    tip: 'Argon2id (memory ≥ 64MB, iterations ≥ 3) is the current recommended password hashing algorithm — SHA-256 and similar general-purpose hashes are too FAST for passwords, making brute-force attacks against leaked hashes far cheaper.',
    gotchas: [
      'Password complexity RULES (requiring special characters) matter less than length — NIST guidance now favors long passphrases over forced complexity.',
      'Rate limiting and account lockout policies protect against online brute-force even with a strong hashing algorithm protecting the stored hash.',
    ],
  },
  'security/hashing': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'Password Security',  route: '/security/password-security' },
      { label: 'Symmetric Encryption', route: '/security/symmetric-encryption' },
    ],
    tip: 'A cryptographic hash function is one-way and collision-resistant — but plain hashing (even SHA-256) is inappropriate for passwords specifically, since it is deliberately FAST, exactly the wrong property for something that must resist brute force.',
    gotchas: [
      'HMAC (keyed hashing) provides message authentication that plain hashing alone does not — verifying integrity AND authenticity, not just integrity.',
      'Salting prevents precomputed rainbow-table attacks — a unique salt per password is required, not a single shared salt across all users.',
    ],
  },
  'security/symmetric-encryption': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'Asymmetric Cryptography', route: '/security/asymmetric-cryptography' },
      { label: 'Hashing',                 route: '/security/hashing' },
    ],
    tip: 'AES-256-GCM provides both confidentiality AND integrity (authenticated encryption) in one operation — using an encryption mode without authentication (like plain CBC) leaves data vulnerable to tampering even though it remains confidential.',
    gotchas: [
      'Reusing a nonce/IV with the same key in GCM mode catastrophically breaks its security guarantees — nonces must be unique per encryption operation.',
      'Symmetric encryption requires securely sharing the same key between parties — key distribution is the hard problem asymmetric cryptography solves differently.',
    ],
  },
  'security/asymmetric-cryptography': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'Symmetric Encryption', route: '/security/symmetric-encryption' },
      { label: 'JWT',                  route: '/security/jwt' },
    ],
    tip: 'Public-key cryptography solves the key-distribution problem symmetric encryption has — a public key can be shared openly, while only the corresponding private key can decrypt or sign, enabling both encryption and digital signatures.',
    gotchas: [
      'Asymmetric operations are computationally much more expensive than symmetric ones — TLS uses asymmetric crypto only to establish a session, then switches to symmetric encryption for the bulk of data transfer.',
      'RS256 (RSA) vs ES256 (elliptic curve) JWT signing algorithms trade key size and performance differently — ES256 keys are much smaller for equivalent security.',
    ],
  },
  'security/jwt': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'OAuth & OIDC',   route: '/security/oauth-oidc' },
      { label: 'Claims & Identity', route: '/security/claims-identity' },
    ],
    tip: 'A JWT\'s payload is Base64-encoded, NOT encrypted — anyone can decode and read it, meaning sensitive data should never be placed in a JWT payload unless the token itself is also encrypted (JWE), not just signed (JWS).',
    gotchas: [
      'The "alg: none" attack exploits servers that trust the algorithm specified in the token header — always allowlist acceptable algorithms server-side and never trust the header alone.',
      'JWTs are typically stateless and cannot be revoked before expiry without an additional server-side revocation list, unlike traditional session tokens.',
    ],
  },
  'security/oauth-oidc': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'JWT',    route: '/security/jwt' },
      { label: 'SSO',    route: '/security/sso' },
    ],
    tip: 'OAuth 2.0 is an AUTHORIZATION framework (granting scoped access to resources); OIDC is an AUTHENTICATION layer built on top of OAuth 2.0 (verifying user identity) — conflating the two is a common source of design mistakes.',
    gotchas: [
      'PKCE (Proof Key for Code Exchange) is required for public clients (mobile/SPA apps) that cannot securely store a client secret, preventing authorization code interception attacks.',
      'An access token proves what the bearer can DO; an ID token proves WHO the user is — using one where the other is needed is a common integration bug.',
    ],
  },
  'security/sso': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'OAuth & OIDC',       route: '/security/oauth-oidc' },
      { label: 'Claims & Identity',  route: '/security/claims-identity' },
    ],
    tip: 'SSO centralizes authentication at one identity provider — this concentrates risk (a compromised IdP compromises every connected application) but also concentrates SECURITY INVESTMENT (MFA, conditional access) at one well-defended point rather than spreading auth logic across every app.',
    gotchas: [
      'SAML and OIDC are the two dominant SSO protocols — they are not interchangeable and require different integration code.',
      'Single logout (ensuring a logout at the IdP actually terminates sessions at every connected application) is notoriously difficult to implement reliably.',
    ],
  },
  'security/claims-identity': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'RBAC & ABAC', route: '/security/rbac-abac' },
      { label: 'JWT',         route: '/security/jwt' },
    ],
    tip: 'A claims-based identity model represents a user as a SET of claims (statements about the user — role, department, email) rather than a single fixed identity — authorization decisions can then be based on any combination of claims, not just a single role field.',
    gotchas: [
      'Claims should be validated against a trusted issuer — accepting claims from an unverified or self-issued token defeats the purpose of claims-based trust.',
      'Overloading claims with excessive personal data increases the token\'s exposure surface, since claims are typically readable without decryption.',
    ],
  },
  'security/rbac-abac': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'Claims & Identity', route: '/security/claims-identity' },
    ],
    tip: 'RBAC (role-based) grants permissions based on a fixed role assignment — simple to reason about but coarse-grained; ABAC (attribute-based) evaluates permissions dynamically against attributes (user, resource, environment) — more flexible but harder to audit and reason about upfront.',
    gotchas: [
      'RBAC role explosion (creating a new role for every slightly different permission combination) is a common anti-pattern as systems grow.',
      'ABAC policies can become difficult to test exhaustively, since the number of possible attribute combinations grows combinatorially.',
    ],
  },
  'security/mfa': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'Password Security', route: '/security/password-security' },
    ],
    tip: 'SMS-based MFA is vulnerable to SIM-swapping attacks — TOTP apps (Google Authenticator) or hardware keys (FIDO2/WebAuthn) provide meaningfully stronger protection than SMS, which should be considered a fallback, not a primary factor.',
    gotchas: [
      'MFA fatigue attacks (bombarding a user with push-approval requests until they accidentally approve one) are a real modern bypass technique against push-based MFA.',
      'FIDO2/WebAuthn is phishing-resistant by design, since the authentication is cryptographically bound to the specific origin — a major advantage over OTP codes that can be phished.',
    ],
  },
  'security/secrets-management': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'Supply Chain',        route: '/security/supply-chain' },
      { label: 'Secure Coding',       route: '/security/secure-coding' },
    ],
    tip: 'A secret committed to git is compromised FOREVER, even after being "removed" in a later commit — it remains in git history indefinitely unless the history itself is rewritten, which is why prevention (pre-commit hooks, secret scanning) matters more than cleanup.',
    gotchas: [
      'A dedicated secrets manager (Vault, Key Vault) with automatic rotation reduces the blast radius of a leaked secret versus a long-lived static credential in an env file.',
      'Environment variables are safer than hardcoded values but still visible to anyone with process/container inspection access — a genuine secrets manager provides stronger access control.',
    ],
  },
  'security/secure-coding': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'Injection',            route: '/security/injection' },
      { label: 'Secrets Management',   route: '/security/secrets-management' },
    ],
    tip: 'Input validation should happen at trust boundaries (where data enters the system), not scattered defensively throughout internal code — validating the same input repeatedly at every internal function adds noise without adding real protection.',
    gotchas: [
      'Allowlisting (accepting only known-good patterns) is generally safer than denylisting (blocking known-bad patterns), since denylists are inherently incomplete against novel attack variants.',
      'Error messages shown to users should never leak internal implementation details (stack traces, database schema) that could aid an attacker.',
    ],
  },
  'security/api-security': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'OAuth & OIDC',   route: '/security/oauth-oidc' },
      { label: 'RBAC & ABAC',    route: '/security/rbac-abac' },
    ],
    tip: 'Broken Object Level Authorization (BOLA) — checking that a user is authenticated but not that they are authorized for the SPECIFIC object being requested (like /orders/{id}) — is consistently one of the most common and impactful API vulnerabilities found in practice.',
    gotchas: [
      'Rate limiting protects against abuse and brute force, but must be applied per-user/per-key, not just per-IP, since IPs are trivially rotated.',
      'API versioning and deprecation need a security lens too — an old, unmaintained API version left reachable is a common overlooked attack surface.',
    ],
  },
  'security/container-security': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'Supply Chain', route: '/security/supply-chain' },
    ],
    tip: 'Running a container as root (the default in many base images) gives an attacker who escapes the application a much bigger blast radius — explicitly setting a non-root USER in the Dockerfile is a simple, high-value hardening step.',
    gotchas: [
      'A minimal base image (distroless, Alpine) reduces the attack surface by carrying far fewer installed tools an attacker could exploit after compromise.',
      'Vulnerability scanning at build time catches known CVEs at that point, but new CVEs are disclosed continuously — already-deployed images need periodic re-scanning.',
    ],
  },
  'security/supply-chain': {
    apis: SEC_DEFAULT.apis, docs: SEC_DEFAULT.docs, resources: SEC_DEFAULT.resources,
    related: [
      { label: 'Container Security',    route: '/security/container-security' },
      { label: 'Secrets Management',    route: '/security/secrets-management' },
    ],
    tip: 'A dependency lock file pins EXACT versions across the whole dependency graph — without it, a compromised transitive dependency\'s malicious update can be pulled in automatically on the next install with no code change on your end.',
    gotchas: [
      'Software Bill of Materials (SBOM) generation gives visibility into exactly what is running in production, essential for quickly assessing exposure when a new CVE is disclosed.',
      'Signing and verifying artifacts (Cosign/Sigstore) addresses tampering risk that dependency scanning alone does not cover.',
    ],
  },

  // ── API Design: per-page entries ────────────────────────────────────────────
  'api-design/api-design-principles': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'REST Fundamentals',   route: '/api-design/rest-fundamentals' },
      { label: 'Resource/URL Design', route: '/api-design/resource-url-design' },
    ],
    tip: 'A good API design principle is designing for the CONSUMER\'s mental model, not the server\'s internal data structure — an API that mirrors database tables directly tends to leak implementation details and churn as the schema evolves.',
    gotchas: [
      'Consistency across endpoints (naming, pagination, error shape) matters more than any single endpoint being individually clever.',
      'API design decisions are far more expensive to change after external consumers depend on them — get the shape right before wide adoption, not after.',
    ],
  },
  'api-design/rest-fundamentals': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'HTTP Methods & Status Codes', route: '/api-design/http-methods-status-codes' },
      { label: 'Resource/URL Design',         route: '/api-design/resource-url-design' },
    ],
    tip: 'REST is a set of architectural CONSTRAINTS (statelessness, uniform interface, cacheability), not just "an API that uses JSON over HTTP" — many APIs calling themselves RESTful violate statelessness or the uniform interface constraint without realizing it.',
    gotchas: [
      'True REST HATEOAS (hypermedia-driven navigation) is rarely fully implemented in practice — most "RESTful" APIs are really pragmatic HTTP+JSON APIs.',
      'Statelessness means each request must contain all information needed to process it — server-side session state stored between requests violates this constraint.',
    ],
  },
  'api-design/http-methods-status-codes': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'REST Fundamentals',      route: '/api-design/rest-fundamentals' },
      { label: 'Error Response Design',  route: '/api-design/error-response-design' },
    ],
    tip: 'PUT is defined as idempotent (repeating it produces the same result) while POST is not — using PUT for an operation that isn\'t genuinely idempotent (like "increment a counter") violates the HTTP spec\'s semantic contract, even if it happens to "work."',
    gotchas: [
      '409 Conflict is frequently misused for validation errors that should be 400 Bad Request — 409 specifically means the request conflicts with the current state of the resource.',
      'GET requests should never have side effects — a GET that changes state breaks caching, prefetching, and retry-safety assumptions clients rely on.',
    ],
  },
  'api-design/resource-url-design': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'REST Fundamentals',  route: '/api-design/rest-fundamentals' },
      { label: 'Pagination Patterns', route: '/api-design/pagination-patterns' },
    ],
    tip: 'URLs should identify RESOURCES (nouns), not actions (verbs) — /orders/123/cancel breaks this convention; a more RESTful design uses a PATCH or POST to /orders/123 with a status change, keeping the URL resource-centric.',
    gotchas: [
      'Deeply nested URLs (/users/1/orders/2/items/3/reviews/4) become unwieldy — consider whether a flatter, filterable structure serves consumers better.',
      'Consistent pluralization and casing conventions across every endpoint reduce cognitive load for API consumers integrating multiple endpoints.',
    ],
  },
  'api-design/pagination-patterns': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'Resource/URL Design', route: '/api-design/resource-url-design' },
    ],
    tip: 'Offset-based pagination (page=3&size=20) is simple but breaks under concurrent inserts/deletes — a record can shift pages between requests, causing skipped or duplicated items; cursor-based pagination avoids this by anchoring to a stable position.',
    gotchas: [
      'Cursor-based pagination requires a stable sort order (usually including a unique tiebreaker field) to avoid subtly inconsistent ordering across pages.',
      'Returning the TOTAL count alongside paginated results can be expensive on large tables — consider whether consumers genuinely need it.',
    ],
  },
  'api-design/error-response-design': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'HTTP Methods & Status Codes', route: '/api-design/http-methods-status-codes' },
    ],
    tip: 'A consistent error response SHAPE across every endpoint (a stable structure for code, message, and details) lets client-side error handling be written once generically — inconsistent error shapes force every integration to special-case each endpoint.',
    gotchas: [
      'Error messages returned to clients should never leak internal details (stack traces, SQL, file paths) that could aid an attacker.',
      'A machine-readable error CODE (not just a human-readable message) lets clients branch programmatically without fragile string matching.',
    ],
  },
  'api-design/api-versioning': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'Breaking Changes', route: '/api-design/breaking-changes' },
    ],
    tip: 'URL-path versioning (/v1/, /v2/) is the most explicit and cache-friendly approach; header-based versioning is "cleaner" URL-wise but harder to test manually in a browser and less visible in logs — the tradeoff is discoverability versus URL purity.',
    gotchas: [
      'A version that never gets deprecated accumulates indefinitely — a clear deprecation policy and timeline should exist from the FIRST version, not be an afterthought.',
      'Additive, backward-compatible changes (new optional fields) generally don\'t require a version bump — only breaking changes do.',
    ],
  },
  'api-design/breaking-changes': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'API Versioning',   route: '/api-design/api-versioning' },
      { label: 'OpenAPI & Contracts', route: '/api-design/openapi-contracts' },
    ],
    tip: 'Removing a field, changing a field\'s type, or making an optional field required are all breaking changes — even changes that "should be fine" (tightening validation on an existing field) can break a consumer who was relying on the previous looser behavior.',
    gotchas: [
      'A breaking change to a widely-consumed API can be effectively impossible to roll out without a proper deprecation window, regardless of how "small" it seems internally.',
      'Contract testing against consumer expectations catches breaking changes before they reach production, rather than discovering them from support tickets.',
    ],
  },
  'api-design/openapi-contracts': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'Breaking Changes',   route: '/api-design/breaking-changes' },
      { label: 'REST Fundamentals',  route: '/api-design/rest-fundamentals' },
    ],
    tip: 'OpenAPI (formerly Swagger) is a MACHINE-READABLE contract for a REST API — beyond documentation, it enables generating client SDKs, mock servers, and validation middleware automatically from a single source of truth.',
    gotchas: [
      'A hand-written OpenAPI spec can drift from the actual implementation over time — generating it FROM code annotations (or validating it against real traffic) keeps it accurate.',
      'The spec describing an endpoint does not guarantee the implementation actually conforms — contract testing closes this verification gap.',
    ],
  },
  'api-design/rate-limiting': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'Webhook Design', route: '/api-design/webhook-design' },
    ],
    tip: 'Rate limiting should key on the AUTHENTICATED IDENTITY (API key/user), not just source IP — IPs are trivially rotated (via proxies, mobile networks with shared IPs) making IP-only limiting easy to bypass and prone to false-positive blocking of legitimate shared-IP users.',
    gotchas: [
      'Returning a 429 with a Retry-After header lets well-behaved clients back off correctly instead of hammering the API immediately after being limited.',
      'Token bucket and sliding window are the two dominant rate-limiting algorithms, with different burst-tolerance characteristics worth choosing deliberately.',
    ],
  },
  'api-design/webhook-design': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'Rate Limiting', route: '/api-design/rate-limiting' },
    ],
    tip: 'Webhooks are inherently at-least-once delivery from the sender\'s side — the RECEIVING endpoint must be idempotent, since network issues or receiver downtime cause the sender to retry the same event, potentially multiple times.',
    gotchas: [
      'Signing webhook payloads (HMAC signature in a header) lets receivers verify the request genuinely came from the claimed sender, not a spoofed request.',
      'A receiver that takes too long to respond can cause the sender to time out and retry, potentially causing duplicate processing if the original request eventually also succeeds.',
    ],
  },
  'api-design/hateoas-hypermedia': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'REST Fundamentals', route: '/api-design/rest-fundamentals' },
    ],
    tip: 'HATEOAS (Hypermedia as the Engine of Application State) embeds NAVIGABLE LINKS in API responses, letting clients discover available actions dynamically rather than hardcoding URL construction — the strictest REST constraint, and the least commonly fully implemented in practice.',
    gotchas: [
      'Most "RESTful" APIs skip HATEOAS entirely, since it adds real client-side complexity for a benefit (dynamic discoverability) many API consumers don\'t actually need.',
      'When implemented, hypermedia links can reduce coupling between client and server URL structure, since clients follow links rather than constructing URLs from templates.',
    ],
  },
  'api-design/graphql-fundamentals': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'GraphQL vs REST', route: '/api-design/graphql-vs-rest' },
    ],
    tip: 'GraphQL lets a client specify EXACTLY which fields it needs in a single request — solving the over-fetching (too much data) and under-fetching (needing multiple round-trips) problems that plague fixed-shape REST endpoints.',
    gotchas: [
      'A naive GraphQL resolver implementation is prone to the N+1 query problem — DataLoader-style batching is required to avoid one database query per resolved field.',
      'GraphQL\'s single endpoint makes traditional HTTP-level caching (which relies on distinct URLs per resource) much harder than with REST.',
    ],
  },
  'api-design/graphql-vs-rest': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'GraphQL Fundamentals', route: '/api-design/graphql-fundamentals' },
      { label: 'REST Fundamentals',    route: '/api-design/rest-fundamentals' },
    ],
    tip: 'REST\'s resource-oriented, cacheable design suits public APIs and CDN-friendly caching well; GraphQL\'s flexible querying suits complex, evolving client needs (especially mobile apps needing precise data shaping) — the choice should follow actual client diversity, not trend-following.',
    gotchas: [
      'GraphQL does not automatically make an API "better" — it trades REST\'s simplicity and cacheability for query flexibility, a real tradeoff, not a strict upgrade.',
      'Many production systems use both — REST for simple CRUD and public APIs, GraphQL for complex, client-driven aggregation needs.',
    ],
  },
  'api-design/grpc-service-patterns': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'Protocol Buffers',        route: '/api-design/protocol-buffers' },
      { label: 'gRPC-Web & Transcoding',  route: '/api-design/grpc-web-transcoding' },
    ],
    tip: 'gRPC uses HTTP/2 and Protocol Buffers for binary, strongly-typed, high-performance service-to-service communication — a strong fit for internal microservice communication where both client and server are under your control, less suited to public-facing browser-consumed APIs.',
    gotchas: [
      'Streaming RPCs (client, server, and bidirectional streaming) are a first-class gRPC feature with no clean REST equivalent.',
      'gRPC\'s strict typed contracts (via .proto files) catch integration mismatches at compile time that a loosely-typed REST/JSON contract would only surface at runtime.',
    ],
  },
  'api-design/protocol-buffers': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'gRPC Service Patterns', route: '/api-design/grpc-service-patterns' },
    ],
    tip: 'Protocol Buffers serialize to a compact BINARY format (versus JSON\'s human-readable text), reducing payload size and parse time significantly — the tradeoff is losing JSON\'s human-readability for debugging without dedicated tooling.',
    gotchas: [
      'Field NUMBERS in a .proto file, not field names, determine wire compatibility — renaming a field is safe, but reusing or changing a field number breaks compatibility.',
      'Adding a new optional field is backward-compatible; removing or renumbering an existing field is not.',
    ],
  },
  'api-design/grpc-web-transcoding': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'gRPC Service Patterns', route: '/api-design/grpc-service-patterns' },
    ],
    tip: 'Browsers cannot speak native gRPC (which requires low-level HTTP/2 trailer support browsers don\'t expose) — gRPC-Web requires a proxy to translate between browser-compatible requests and native gRPC, or JSON transcoding to expose a gRPC service as a REST-like JSON API.',
    gotchas: [
      'gRPC-Web does not support full bidirectional streaming the way native gRPC does — only a subset of streaming patterns work through the browser proxy.',
      'JSON transcoding (via a gateway like grpc-gateway) lets REST-only consumers use a gRPC-first backend without them needing any gRPC awareness at all.',
    ],
  },
  'api-design/websockets-sse-polling': {
    apis: API_DESIGN_DEFAULT.apis, docs: API_DESIGN_DEFAULT.docs, resources: API_DESIGN_DEFAULT.resources,
    related: [
      { label: 'REST Fundamentals', route: '/api-design/rest-fundamentals' },
    ],
    tip: 'Polling is simple but wastes requests on "nothing changed" responses; Server-Sent Events (SSE) provide efficient one-way server-to-client streaming over plain HTTP; WebSockets provide full bidirectional communication — choose based on whether the client genuinely needs to send data back over the same connection.',
    gotchas: [
      'SSE automatically reconnects on connection drop with built-in browser support — WebSockets require hand-rolled reconnection logic.',
      'WebSockets don\'t work transparently through all corporate proxies/firewalls the way plain HTTP-based SSE does, a real deployment consideration.',
    ],
  },

  // ── Observability: per-page entries ─────────────────────────────────────────
  'observability/observability-fundamentals': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'SLI/SLO/SLA',        route: '/observability/sli-slo-sla' },
      { label: 'Observability Maturity', route: '/observability/observability-maturity' },
    ],
    tip: 'The three pillars — metrics, logs, traces — answer DIFFERENT questions: metrics show WHAT is happening in aggregate, logs show WHAT HAPPENED for a specific event, traces show WHERE time was spent across a distributed request — no single pillar substitutes for the others.',
    gotchas: [
      'Observability is about being able to ask NEW questions of a system without shipping new code — monitoring alone (pre-defined dashboards) can\'t answer questions nobody thought to instrument in advance.',
      'Collecting all three pillars without CORRELATION (shared trace/request IDs across them) leaves you with three separate haystacks instead of one connected picture.',
    ],
  },
  'observability/observability-maturity': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'Observability Fundamentals', route: '/observability/observability-fundamentals' },
      { label: 'Error Budgets & Toil',       route: '/observability/error-budgets-toil' },
    ],
    tip: 'Maturity progresses from reactive (checking dashboards after a complaint) to proactive (alerting before users notice) to predictive (catching anomalies before they become incidents) — jumping straight to advanced tooling without the earlier stages\' discipline rarely sticks.',
    gotchas: [
      'Buying an expensive observability platform doesn\'t automatically raise maturity — the team\'s incident response habits and instrumentation discipline matter more than the tool.',
      'A maturity model is a roadmap, not a checklist to rush through — each stage builds genuine organizational habits the next stage depends on.',
    ],
  },
  'observability/infrastructure-metrics': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'Prometheus Metrics', route: '/observability/prometheus-metrics' },
      { label: 'Custom App Metrics', route: '/observability/custom-app-metrics' },
    ],
    tip: 'CPU, memory, disk, and network metrics tell you the HOST\'s health, not necessarily the APPLICATION\'s — a server can look perfectly healthy on infrastructure metrics while the application itself is serving errors or timing out.',
    gotchas: [
      'High CPU is not always bad (it can mean efficient utilization) and low CPU is not always good (it can mean the app is blocked on I/O) — context matters more than the raw number.',
      'Container-level metrics can be misleading in a shared/oversubscribed environment — check what the underlying node is actually experiencing too.',
    ],
  },
  'observability/custom-app-metrics': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'Infrastructure Metrics', route: '/observability/infrastructure-metrics' },
      { label: 'Prometheus Metrics',     route: '/observability/prometheus-metrics' },
    ],
    tip: 'Business/application metrics (checkout completion rate, queue depth, cache hit ratio) reveal problems infrastructure metrics never will — a server with perfect CPU/memory can still be silently failing to process orders correctly.',
    gotchas: [
      'Counters, gauges, and histograms are DIFFERENT metric types with different aggregation semantics — using a counter where a gauge is needed (or vice versa) produces misleading dashboards.',
      'High-cardinality labels (like a raw user ID) on a metric can explode storage cost and query time in most time-series databases.',
    ],
  },
  'observability/prometheus-metrics': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'Custom App Metrics',     route: '/observability/custom-app-metrics' },
      { label: 'Grafana Dashboards',     route: '/observability/grafana-dashboards' },
    ],
    tip: 'Prometheus PULLS (scrapes) metrics from targets on an interval, rather than applications pushing metrics to it — this pull model makes service discovery and target health visibility a first-class concern, unlike push-based systems.',
    gotchas: [
      'A short-lived batch job that finishes before the next scrape interval never gets scraped — the Pushgateway exists specifically to bridge this gap.',
      'PromQL rate() requires a counter metric type — applying it to a gauge produces meaningless results.',
    ],
  },
  'observability/grafana-dashboards': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'Prometheus Metrics', route: '/observability/prometheus-metrics' },
    ],
    tip: 'A dashboard with dozens of panels is often LESS useful during an incident than a few well-chosen ones — the goal during an outage is fast triage, not exhaustive data, so design dashboards around "what question does this answer" not "what data do we have."',
    gotchas: [
      'Dashboards drift out of sync with what the system actually looks like over time — periodic review catches panels referencing metrics that no longer exist or mean something different.',
      'A dashboard is not a substitute for alerting — nobody is watching a dashboard 24/7, which is why alerting design matters independently.',
    ],
  },
  'observability/log-aggregation': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'Structured Logging',    route: '/observability/structured-logging' },
      { label: 'Log Best Practices',    route: '/observability/log-best-practices' },
    ],
    tip: 'Centralized log aggregation (shipping logs from every instance to one searchable store) is essential once an application runs across multiple instances — grepping individual server log files does not scale past a handful of instances.',
    gotchas: [
      'Log volume at scale has real storage and query-cost implications — sampling or tiered retention (hot/warm/cold) is often necessary, not optional.',
      'A log shipper falling behind or crashing can silently drop logs — monitor the shipping pipeline\'s own health, not just the application.',
    ],
  },
  'observability/structured-logging': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'Log Aggregation',   route: '/observability/log-aggregation' },
      { label: 'Log Best Practices', route: '/observability/log-best-practices' },
    ],
    tip: 'Structured logs (JSON with consistent fields) are QUERYABLE by field, unlike free-text log lines that require fragile regex parsing to extract the same information — this is what makes correlating logs across services at scale actually practical.',
    gotchas: [
      'Consistent field naming ACROSS services (userId, not user_id in one service and userID in another) is required for structured logs to be genuinely queryable together.',
      'Including a correlation/trace ID in every log line is what connects structured logs back to distributed traces for full request reconstruction.',
    ],
  },
  'observability/log-best-practices': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'Structured Logging', route: '/observability/structured-logging' },
    ],
    tip: 'Logging every request at INFO level in a high-throughput service generates enormous, mostly-useless volume — log what is ACTIONABLE (errors, state transitions, key business events), and rely on tracing/metrics for the high-volume "everything happened" signal.',
    gotchas: [
      'Sensitive data (passwords, tokens, full credit card numbers) must never be logged — a common compliance and security failure mode.',
      'Log levels (DEBUG/INFO/WARN/ERROR) should be used consistently — logging routine events at ERROR trains responders to ignore alerts.',
    ],
  },
  'observability/distributed-tracing': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'OpenTelemetry Tracing', route: '/observability/opentelemetry-tracing' },
      { label: 'OpenTelemetry',         route: '/observability/opentelemetry' },
    ],
    tip: 'A trace is a tree of SPANS representing the full path of one request across multiple services — without propagating a trace context (trace ID + parent span ID) through every service boundary, a request appears as disconnected, unrelated traces instead of one coherent picture.',
    gotchas: [
      'Async message boundaries (a queue between services) break automatic trace propagation unless the trace context is explicitly carried in message headers.',
      'Sampling (recording only a percentage of traces) is often necessary at scale — but sampling out the rare, slow, or erroring requests defeats the purpose of tracing them at all.',
    ],
  },
  'observability/opentelemetry': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'OpenTelemetry Tracing', route: '/observability/opentelemetry-tracing' },
      { label: 'Distributed Tracing',   route: '/observability/distributed-tracing' },
    ],
    tip: 'OpenTelemetry provides a VENDOR-NEUTRAL standard for instrumentation (metrics, logs, traces) — instrumenting against OTel instead of a specific vendor\'s SDK means the observability BACKEND can be swapped later without re-instrumenting application code.',
    gotchas: [
      'Auto-instrumentation covers common frameworks/libraries out of the box, but genuinely meaningful custom spans for business logic still require manual instrumentation.',
      'The OTel Collector (a separate process for receiving, processing, and exporting telemetry) decouples applications from any specific backend\'s ingestion format.',
    ],
  },
  'observability/opentelemetry-tracing': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'OpenTelemetry',        route: '/observability/opentelemetry' },
      { label: 'Distributed Tracing',  route: '/observability/distributed-tracing' },
    ],
    tip: 'A span represents one unit of work (an HTTP call, a DB query) with a start/end time and attributes — nesting spans within a trace reconstructs the exact timing waterfall of where a slow request actually spent its time across service boundaries.',
    gotchas: [
      'Adding too many low-value spans (wrapping every trivial function call) adds overhead and noise without proportional debugging value — instrument at meaningful boundaries.',
      'Context propagation must be correctly wired through async/await boundaries and thread pools, or child spans silently detach from their parent trace.',
    ],
  },
  'observability/sli-slo-sla': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'Error Budgets & Toil',    route: '/observability/error-budgets-toil' },
      { label: 'Alerting Design',          route: '/observability/alerting-design' },
    ],
    tip: 'An SLI is a MEASURED indicator (99.95% of requests succeeded); an SLO is the INTERNAL target for that indicator (99.9% success); an SLA is the EXTERNAL, often contractual commitment with consequences for breach — conflating these three is a common and costly mistake.',
    gotchas: [
      'An SLO should be set slightly stricter than the SLA, so an SLO breach gives warning time to react BEFORE an SLA (and its financial/contractual consequences) is actually breached.',
      'Choosing the wrong SLI (measuring server-side success when users experience client-side failures) can show green dashboards during a real user-facing outage.',
    ],
  },
  'observability/error-budgets-toil': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'SLI/SLO/SLA',    route: '/observability/sli-slo-sla' },
      { label: 'On-Call & Incidents', route: '/observability/on-call-incidents' },
    ],
    tip: 'An error budget (100% minus the SLO target) is the amount of acceptable failure BEFORE it becomes a problem — a team with budget remaining can ship features and take risks; a team that has exhausted its budget should freeze releases and focus on reliability instead.',
    gotchas: [
      'Toil (manual, repetitive, automatable operational work) directly competes with a team\'s capacity to improve reliability — an SRE team spending all its time on toil has no time left to reduce future toil.',
      'An error budget policy only works if it has real teeth — a budget that gets "overridden" every time it\'s exhausted provides no actual behavioral incentive.',
    ],
  },
  'observability/alerting-design': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'SLI/SLO/SLA',        route: '/observability/sli-slo-sla' },
      { label: 'On-Call & Incidents', route: '/observability/on-call-incidents' },
    ],
    tip: 'Alert on SYMPTOMS the user actually experiences (elevated error rate, slow responses), not on every possible CAUSE (CPU spike, one pod restarting) — cause-based alerting produces alert fatigue from noisy, often self-resolving conditions that don\'t actually affect users.',
    gotchas: [
      'An alert with no clear, actionable runbook trains on-call engineers to acknowledge and ignore it — every alert should have a defined response action.',
      'Alert thresholds copied from another team\'s system without adjusting for actual traffic patterns often produce constant false positives or miss real issues entirely.',
    ],
  },
  'observability/on-call-incidents': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'Alerting Design',     route: '/observability/alerting-design' },
      { label: 'Error Budgets & Toil', route: '/observability/error-budgets-toil' },
    ],
    tip: 'A blameless postmortem focuses on WHAT in the system and process allowed the incident to happen, not WHO made a mistake — blame-focused postmortems teach people to hide information in future incidents, making the organization less safe over time, not more.',
    gotchas: [
      'A postmortem without concrete, assigned, tracked follow-up action items is just a well-written story — it doesn\'t actually prevent recurrence.',
      'Declaring an incident resolved as soon as symptoms disappear (without confirming the root cause) risks a recurrence from the same underlying issue shortly after.',
    ],
  },
  'observability/cloud-native-monitoring': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'Prometheus Metrics', route: '/observability/prometheus-metrics' },
    ],
    tip: 'In a Kubernetes environment, ephemeral pods make host-based monitoring assumptions break down — monitoring needs to be POD/label-aware (via service discovery) rather than assuming a fixed, long-lived set of hosts to watch.',
    gotchas: [
      'A pod restarting resets its in-memory metrics unless a persistent metrics backend (like Prometheus scraping, not just local counters) is used.',
      'Cardinality explosion from per-pod labels (a new pod name on every restart/scale event) can overwhelm a metrics backend not designed for Kubernetes\'s churn.',
    ],
  },
  'observability/ebpf-observability': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'Performance Profiling', route: '/observability/performance-profiling' },
    ],
    tip: 'eBPF lets you attach observability probes directly into the Linux kernel at runtime, WITHOUT modifying or restarting the application — capturing network, syscall, and performance data that traditional application-level instrumentation cannot see at all.',
    gotchas: [
      'eBPF-based tools (Cilium, Pixie) can observe traffic and performance without requiring any code changes to the monitored application — a major advantage for observing legacy or third-party services.',
      'eBPF requires a sufficiently modern kernel version — not every production environment can adopt it immediately.',
    ],
  },
  'observability/performance-profiling': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'eBPF Observability', route: '/observability/ebpf-observability' },
      { label: 'Distributed Tracing', route: '/observability/distributed-tracing' },
    ],
    tip: 'Continuous profiling (always-on, low-overhead sampling of CPU/memory in production) catches performance regressions that only manifest under real production load and traffic patterns — a local profiler run in development often can\'t reproduce production-scale bottlenecks.',
    gotchas: [
      'Flame graphs visualize where time is actually spent across the call stack — reading them correctly (width = time, not depth) is a common source of misinterpretation.',
      'Profiling overhead, even when described as "low," is not zero — validate it doesn\'t materially affect the exact latency numbers you\'re trying to measure.',
    ],
  },
  'observability/chaos-engineering': {
    apis: OBS_DEFAULT.apis, docs: OBS_DEFAULT.docs, resources: OBS_DEFAULT.resources,
    related: [
      { label: 'On-Call & Incidents', route: '/observability/on-call-incidents' },
    ],
    tip: 'Chaos engineering deliberately injects failure (killing instances, adding latency, dropping network packets) in a CONTROLLED way to verify a system actually behaves as resiliently as assumed — untested resilience assumptions are frequently wrong, and chaos experiments surface this before a real, uncontrolled outage does.',
    gotchas: [
      'Chaos experiments should start small and in non-production (or a carefully scoped production blast radius) before scaling up — an uncontrolled chaos experiment IS an incident.',
      'The value of chaos engineering is in the LEARNING and subsequent fixes, not in the experiment itself — a chaos day that finds no issues and prompts no follow-up work has produced little value.',
    ],
  },

  // ── Redis: per-page entries ─────────────────────────────────────────────────
  'redis/fundamentals': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Key Commands',    route: '/redis/key-commands' },
      { label: 'Strings',         route: '/redis/strings' },
    ],
    tip: 'Redis is fundamentally single-threaded for command execution — this is precisely WHY individual commands are so fast (no locking overhead), but also why a single slow command (a huge KEYS * or unbounded SORT) blocks every other client until it completes.',
    gotchas: [
      'Redis keeps the entire dataset in memory by default — data size is bounded by available RAM, not disk, unlike a traditional database.',
      'TTL (time-to-live) on keys is Redis\'s built-in expiration mechanism — forgetting to set one on cache entries can silently turn Redis into an ever-growing memory leak.',
    ],
  },
  'redis/installation-setup': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Fundamentals', route: '/redis/fundamentals' },
      { label: 'Security',     route: '/redis/security' },
    ],
    tip: 'A default Redis install has NO authentication and binds to all interfaces in some configurations — this combination has led to countless publicly exposed, unsecured Redis instances found by security scanners; requirepass and bind should be set explicitly before any real deployment.',
    gotchas: [
      'Redis persistence (RDB/AOF) must be explicitly configured — a default install may lose all data on a restart if persistence isn\'t enabled.',
      'maxmemory and an eviction policy should be set explicitly — an unbounded Redis instance can consume all available host memory and crash.',
    ],
  },
  'redis/key-commands': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Fundamentals', route: '/redis/fundamentals' },
      { label: 'Strings',      route: '/redis/strings' },
    ],
    tip: 'KEYS * blocks the single-threaded server while scanning the ENTIRE keyspace — SCAN provides the same enumeration capability with a cursor-based, non-blocking iteration, making it the production-safe alternative.',
    gotchas: [
      'EXPIRE resets a key\'s TTL — calling it repeatedly on the same key with different values can create subtle bugs if the intended behavior was "set once."',
      'DEL on a very large collection value (a huge list/set) can also block briefly — UNLINK performs the deallocation asynchronously instead.',
    ],
  },
  'redis/strings': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Key Commands', route: '/redis/key-commands' },
      { label: 'Hashes',       route: '/redis/hashes' },
    ],
    tip: 'INCR/DECR are ATOMIC at the server level — safe for concurrent counter updates without a separate read-modify-write cycle in application code, which would otherwise race under concurrent access.',
    gotchas: [
      'A Redis string can hold up to 512MB — using it to store a large serialized blob works but loses the ability to operate on individual fields the way a Hash would allow.',
      'SETNX (or SET with NX) is the building block for a simple distributed lock — but a naive implementation without an expiry risks a permanently stuck lock if the lock holder crashes.',
    ],
  },
  'redis/lists': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Sets',   route: '/redis/sets' },
      { label: 'Streams', route: '/redis/streams' },
    ],
    tip: 'LPUSH/RPUSH plus BLPOP/BRPOP turn a Redis List into a simple, effective work queue — BLPOP blocks until an item is available, avoiding the wasted polling overhead of repeatedly calling LPOP on an empty list.',
    gotchas: [
      'Lists are ordered but operations at arbitrary positions (LINDEX, LINSERT) are O(n) — Lists are efficient at the ends, not for random access in the middle.',
      'For genuinely reliable queue semantics (avoiding message loss on consumer crash), Streams with consumer groups are usually a better fit than a plain List.',
    ],
  },
  'redis/hashes': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Strings', route: '/redis/strings' },
    ],
    tip: 'A Hash lets you store and update individual FIELDS of an object (HSET user:1 name "Alice") without re-serializing and rewriting the entire object — meaningfully more efficient than storing a JSON blob as a String when only one field changes.',
    gotchas: [
      'HGETALL on a very large hash transfers the entire hash in one response — HSCAN provides cursor-based iteration for large hashes.',
      'There is no native TTL per individual hash field — expiration applies to the whole key (the entire hash), not individual fields within it (in most Redis versions).',
    ],
  },
  'redis/sets': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Sorted Sets', route: '/redis/sorted-sets' },
      { label: 'Lists',       route: '/redis/lists' },
    ],
    tip: 'SINTER, SUNION, and SDIFF perform set operations (intersection, union, difference) SERVER-SIDE in one round trip — computing the same operations by pulling data client-side and comparing in application code is both slower and more network-chatty.',
    gotchas: [
      'A Set has no ordering — if insertion or ranking order matters, a Sorted Set (not a plain Set) is the correct structure.',
      'SPOP removes and returns a RANDOM member — useful for random sampling, but easy to misuse if deterministic ordering was actually needed.',
    ],
  },
  'redis/sorted-sets': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Sets', route: '/redis/sets' },
    ],
    tip: 'A Sorted Set maintains members ordered by a SCORE with O(log n) insertion and range queries — the standard structure for leaderboards, priority queues, and time-windowed rate limiting where ranked or ranged access matters.',
    gotchas: [
      'ZRANGEBYSCORE with a very wide range on a large sorted set can still return a huge result — always paginate with LIMIT for user-facing leaderboard queries.',
      'Updating a member\'s score with ZADD (without NX/XX flags) implicitly re-sorts it — repeated updates to the same key at high frequency have real overhead.',
    ],
  },
  'redis/streams': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Pub/Sub', route: '/redis/pub-sub' },
      { label: 'Lists',   route: '/redis/lists' },
    ],
    tip: 'Redis Streams provide PERSISTENT, replayable message logs with consumer groups — unlike Pub/Sub, a consumer that was offline when a message was published can still read it later, since Streams retain messages rather than firing-and-forgetting.',
    gotchas: [
      'XACK is required to acknowledge processed messages in a consumer group — unacknowledged messages remain in the Pending Entries List and can be reclaimed by another consumer.',
      'Streams need explicit trimming (XTRIM or MAXLEN) or they grow unbounded, unlike Pub/Sub which has no persistence to manage at all.',
    ],
  },
  'redis/pub-sub': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Streams', route: '/redis/streams' },
    ],
    tip: 'Redis Pub/Sub is fire-and-forget with NO persistence — a subscriber that is offline or slow simply misses messages published during that time, with no way to catch up, unlike Streams which retain a replayable log.',
    gotchas: [
      'Pub/Sub is appropriate for ephemeral, real-time-only signals (like invalidation notifications) where missing a message occasionally is acceptable — not for anything requiring delivery guarantees.',
      'A slow subscriber can be disconnected by Redis (client-output-buffer-limit) if it can\'t keep up with the message rate.',
    ],
  },
  'redis/transactions': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Lua Scripting', route: '/redis/lua-scripting' },
    ],
    tip: 'MULTI/EXEC queues commands and executes them as one atomic block — but Redis transactions do NOT support rollback on a runtime error within a queued command; a syntax error is caught at queue time, but a logic error only surfaces during EXEC.',
    gotchas: [
      'WATCH provides optimistic locking (abort the transaction if a watched key changed) — without it, MULTI/EXEC alone doesn\'t prevent race conditions on values read before the transaction started.',
      'For genuinely complex conditional logic, a Lua script (atomic by nature, since Redis is single-threaded) is often a cleaner fit than MULTI/EXEC with WATCH.',
    ],
  },
  'redis/lua-scripting': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Transactions', route: '/redis/transactions' },
    ],
    tip: 'A Lua script executed via EVAL runs ATOMICALLY — no other client\'s commands can interleave during its execution, making it the standard way to implement complex conditional logic (check-then-act patterns) that MULTI/EXEC alone cannot express as cleanly.',
    gotchas: [
      'A long-running Lua script blocks the entire single-threaded server for its duration — scripts should be kept fast and simple, not used for heavy computation.',
      'Script caching (EVALSHA after the first EVAL) avoids re-transmitting the full script body on every subsequent invocation.',
    ],
  },
  'redis/eviction-policies': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Caching Patterns', route: '/redis/caching-patterns' },
    ],
    tip: 'When maxmemory is reached, the eviction policy (allkeys-lru, volatile-lru, noeviction, etc.) determines what happens next — noeviction (the default) simply REJECTS new writes with an error once memory is full, which is rarely what a cache deployment actually wants.',
    gotchas: [
      'volatile-* policies only evict keys that HAVE a TTL set — keys without a TTL are never evicted under these policies, potentially leaving a cache full of permanent keys with no room for new entries.',
      'LRU (least recently used) is approximated, not exact, in Redis for performance reasons — don\'t assume perfectly precise LRU ordering.',
    ],
  },
  'redis/caching-patterns': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Eviction Policies', route: '/redis/eviction-policies' },
      { label: 'Rate Limiting',     route: '/redis/rate-limiting' },
    ],
    tip: 'Cache-aside (application checks cache, falls back to DB and populates cache on miss) is the most common pattern — but a cache stampede (many concurrent misses for the same expired key hitting the DB simultaneously) requires an explicit mitigation like locking or early refresh.',
    gotchas: [
      'Cache invalidation on writes must be deliberate — a cache-aside pattern that forgets to invalidate on update serves stale data indefinitely until the TTL naturally expires.',
      'Setting a random JITTER on TTLs prevents many keys expiring simultaneously (a "thundering herd" against the backing database).',
    ],
  },
  'redis/rate-limiting': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Caching Patterns', route: '/redis/caching-patterns' },
    ],
    tip: 'A sliding-window rate limiter implemented with a Sorted Set (scored by timestamp) gives more accurate limiting than a simple fixed-window counter, which allows a burst of 2x the limit right at a window boundary.',
    gotchas: [
      'Redis\'s atomicity (via Lua scripting or MULTI/EXEC) is essential for a correct rate limiter — a naive read-then-write in application code races under concurrent requests.',
      'A fixed-window counter is simpler to implement and reason about, and often "good enough" — reach for sliding-window only when the boundary-burst behavior genuinely matters.',
    ],
  },
  'redis/replication-sentinel': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Redis Cluster',  route: '/redis/redis-cluster' },
      { label: 'Persistence',    route: '/redis/persistence' },
    ],
    tip: 'Redis replication is ASYNCHRONOUS by default — a write acknowledged by the primary may not yet have reached the replica, meaning a failover to that replica can lose the most recent writes (a real consistency tradeoff, not a bug).',
    gotchas: [
      'Sentinel provides automatic failover detection and promotion, but requires a QUORUM of Sentinel instances (typically 3+) to reliably distinguish a real primary failure from a network partition.',
      'Replicas are read-only by default — writing directly to a replica requires explicitly enabling it, which usually indicates a design that should instead write to the primary.',
    ],
  },
  'redis/redis-cluster': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Replication & Sentinel', route: '/redis/replication-sentinel' },
    ],
    tip: 'Redis Cluster shards data across multiple nodes using hash slots (16384 total) — multi-key operations (like MGET across keys on different slots) fail unless all involved keys hash to the SAME slot, typically enforced via hash tags ({user123}.profile).',
    gotchas: [
      'A poorly distributed hash-tag scheme can create hot shards, just like a poor partition key in any sharded system.',
      'Cluster mode changes client behavior significantly (MOVED/ASK redirections) — most client libraries handle this, but it is a meaningfully different operational model than a single-node or replicated setup.',
    ],
  },
  'redis/persistence': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Replication & Sentinel', route: '/redis/replication-sentinel' },
    ],
    tip: 'RDB (periodic point-in-time snapshots) is compact and fast to load but can lose data since the last snapshot; AOF (append-only log of every write) offers stronger durability at the cost of larger files and slower restarts — many production setups use both together.',
    gotchas: [
      'RDB snapshotting forks the process to write in the background — on a host with limited free memory, this fork can fail or cause memory pressure at exactly the wrong moment.',
      'AOF rewrite (compacting the log) still requires enough disk space for both the old and new file during the rewrite process.',
    ],
  },
  'redis/redis-nodejs': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Key Commands', route: '/redis/key-commands' },
    ],
    tip: 'Reusing a single Redis client connection (or a small connection pool) across the application lifetime is the correct pattern — creating a new connection per request adds significant per-request overhead and can exhaust the server\'s max client connections under load.',
    gotchas: [
      'Node.js Redis clients queue commands during a reconnect by default — understand this buffering behavior before assuming a command either succeeds immediately or fails immediately.',
      'Pipelining multiple commands (sending them without waiting for each response) meaningfully reduces round-trip overhead for batch operations.',
    ],
  },
  'redis/redis-stack': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Fundamentals', route: '/redis/fundamentals' },
    ],
    tip: 'Redis Stack bundles additional modules (RedisJSON, RediSearch, RedisGraph, RedisTimeSeries) on top of core Redis — enabling native JSON document storage and full-text search capabilities that plain Redis data structures cannot express directly.',
    gotchas: [
      'These modules are not automatically available in a plain open-source Redis install — Redis Stack (or specific module loading) is required to use JSON/Search commands.',
      'RediSearch\'s vector similarity search capability has made Redis Stack a viable, lower-latency alternative to a dedicated vector database for some RAG use cases.',
    ],
  },
  'redis/security': {
    apis: REDIS_DEFAULT.apis, docs: REDIS_DEFAULT.docs, resources: REDIS_DEFAULT.resources,
    related: [
      { label: 'Installation & Setup', route: '/redis/installation-setup' },
    ],
    tip: 'ACLs (Redis 6+) let you restrict a user to specific commands and key patterns — before ACLs, requirepass provided only a single shared password with full access, meaning any authenticated client could run any command including FLUSHALL.',
    gotchas: [
      'Renaming or disabling genuinely dangerous commands (FLUSHALL, CONFIG, KEYS) in production reduces the blast radius of a compromised or misused client.',
      'TLS support must be explicitly enabled and configured — Redis connections are unencrypted by default, a real risk for traffic crossing untrusted networks.',
    ],
  },

  // ── GraphQL: per-page entries ────────────────────────────────────────────────
  'graphql/fundamentals': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Type System',   route: '/graphql/type-system' },
      { label: 'Queries',       route: '/graphql/queries' },
    ],
    tip: 'GraphQL exposes a SINGLE endpoint that accepts a query describing exactly which fields a client needs — this directly solves REST\'s over-fetching (too much data) and under-fetching (needing multiple round-trips for related data) problems.',
    gotchas: [
      'A single GraphQL endpoint makes traditional HTTP-level URL-based caching far harder than REST\'s distinct-URL-per-resource model.',
      'GraphQL is a QUERY LANGUAGE and execution model, not a database or storage technology — it sits in front of whatever data sources already exist.',
    ],
  },
  'graphql/type-system': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Schema Definition Language', route: '/graphql/schema-definition-language' },
      { label: 'Fundamentals',               route: '/graphql/fundamentals' },
    ],
    tip: 'GraphQL\'s type system is STRICT and self-describing — every field\'s type is known ahead of time, which is what enables tooling like auto-generated documentation, client code generation, and compile-time query validation that a loosely-typed REST/JSON contract cannot provide.',
    gotchas: [
      'Non-null (!) fields are a real contract — a resolver that can legitimately return null for a field marked non-null causes a runtime error for the entire query, not just that field.',
      'Interfaces and unions let a field return one of several possible types, requiring clients to use fragments to access type-specific fields.',
    ],
  },
  'graphql/schema-definition-language': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Type System', route: '/graphql/type-system' },
    ],
    tip: 'SDL (Schema Definition Language) is the human-readable contract describing every type, query, and mutation an API supports — schema-first design (writing the SDL before implementation) forces API shape decisions upfront, similar to contract-first REST design with OpenAPI.',
    gotchas: [
      'A schema is a living contract — removing or changing a field\'s type is a breaking change for any client that queries it, same as a breaking change in a REST API.',
      'Comments and descriptions in SDL become part of the auto-generated documentation exposed via introspection — worth keeping meaningful, not just placeholder text.',
    ],
  },
  'graphql/queries': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Variables & Arguments', route: '/graphql/variables-arguments' },
      { label: 'Mutations',             route: '/graphql/mutations' },
    ],
    tip: 'A GraphQL query\'s SHAPE mirrors the shape of its expected response exactly — this predictability is what lets client tooling (like Apollo\'s generated TypeScript types) statically verify a query against the schema before it ever runs.',
    gotchas: [
      'Deeply nested queries can accidentally request enormous amounts of data (or trigger expensive nested resolvers) — query depth/complexity limiting protects against this.',
      'Aliases let the same field be queried multiple times with different arguments in one request — without them, field name collisions in the response would be unavoidable.',
    ],
  },
  'graphql/mutations': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Queries',         route: '/graphql/queries' },
      { label: 'Client Caching',  route: '/graphql/client-caching' },
    ],
    tip: 'Unlike queries, mutations execute SEQUENTIALLY (not in parallel) when multiple mutations appear in one request — this ordering guarantee matters when one mutation\'s effect depends on a previous one in the same request.',
    gotchas: [
      'A mutation should return enough data for the client to update its local cache without needing a separate follow-up query — an underspecified mutation response forces extra round-trips.',
      'GraphQL has no built-in transactional guarantee across multiple mutations in one request — that must be handled at the resolver/business-logic layer if needed.',
    ],
  },
  'graphql/subscriptions': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Mutations',   route: '/graphql/mutations' },
    ],
    tip: 'Subscriptions typically run over WebSockets (not plain HTTP like queries/mutations) — this transport difference means subscription support requires additional server and infrastructure configuration beyond a standard HTTP GraphQL endpoint.',
    gotchas: [
      'A subscription resolver runs once per PUBLISHED event, not once per client request — understanding this execution model is essential for correct subscription implementation.',
      'Scaling subscriptions across multiple server instances requires a shared pub/sub backend (Redis, for example) so an event published on one instance reaches subscribers connected to another.',
    ],
  },
  'graphql/variables-arguments': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Queries', route: '/graphql/queries' },
    ],
    tip: 'Variables let a query\'s STRUCTURE stay static while its values change per request — this is what allows query strings to be safely cached, parsed once, and reused across many calls, unlike string-interpolating values directly into the query.',
    gotchas: [
      'Interpolating raw values directly into a query string (instead of using variables) reintroduces injection-style risk and defeats query caching benefits.',
      'Default values on variables let a query be called with fewer explicit arguments while still having sensible fallback behavior.',
    ],
  },
  'graphql/directives': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Type System', route: '/graphql/type-system' },
    ],
    tip: '@include and @skip let a client conditionally include or exclude fields based on a variable, avoiding the need to maintain multiple near-duplicate query strings for slightly different data needs.',
    gotchas: [
      'Custom directives require server-side implementation to actually do anything — declaring one in SDL without implementing its logic is a no-op.',
      '@deprecated on a schema field surfaces a warning in tooling/introspection without breaking existing clients still using that field.',
    ],
  },
  'graphql/resolvers': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'DataLoader',  route: '/graphql/dataloader' },
      { label: 'Federation',  route: '/graphql/federation' },
    ],
    tip: 'Each field in a GraphQL schema can have its own resolver function — a naive implementation resolving nested/related fields independently triggers the classic N+1 query problem, one database query per resolved field per parent object.',
    gotchas: [
      'Resolvers execute in a specific order (parent before children) but sibling field resolvers can run concurrently — don\'t assume sequential execution across unrelated fields.',
      'A resolver throwing an error partially fails the response (that field becomes null with an error) rather than failing the entire query, unless the field is non-null.',
    ],
  },
  'graphql/dataloader': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Resolvers', route: '/graphql/resolvers' },
      { label: 'Performance', route: '/graphql/performance' },
    ],
    tip: 'DataLoader BATCHES individual load() calls made within the same event-loop tick into a single underlying query, and CACHES results per-request — this is the standard fix for the N+1 problem, transparent to the resolver code that calls it.',
    gotchas: [
      'DataLoader\'s cache is scoped to a SINGLE request by default — reusing one DataLoader instance across multiple requests risks serving stale cached data to a different request.',
      'Batching only works if the underlying data-fetching function accepts an ARRAY of keys and returns results in the SAME order — mismatched ordering silently returns wrong data to the wrong resolver.',
    ],
  },
  'graphql/error-handling': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Resolvers', route: '/graphql/resolvers' },
    ],
    tip: 'GraphQL responses can return BOTH data and errors simultaneously in the same response — unlike REST\'s all-or-nothing HTTP status code, a partial success (some fields resolved, others errored) is a normal, expected GraphQL response shape.',
    gotchas: [
      'A generic "Internal server error" for every failure hides genuinely useful information from legitimate clients — structured error codes/extensions let clients distinguish error types programmatically.',
      'Leaking internal error details (stack traces, database errors) in the errors array is the same security risk as leaking them in a REST error response.',
    ],
  },
  'graphql/auth': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Error Handling', route: '/graphql/error-handling' },
    ],
    tip: 'Authorization in GraphQL typically happens at the RESOLVER level (per-field), not just at the endpoint level — a single query can touch many resolvers, each of which may need its own authorization check for the specific data it exposes.',
    gotchas: [
      'Field-level authorization is easy to forget on newly added fields — a new sensitive field added to an existing type without its own auth check silently becomes accessible to anyone who could already query that type.',
      'Returning null vs throwing an authorization error for an unauthorized field are different UX/security tradeoffs — decide deliberately, not by default.',
    ],
  },
  'graphql/pagination': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Queries', route: '/graphql/queries' },
    ],
    tip: 'Relay-style cursor pagination (edges/node/pageInfo with cursor-based before/after) is the GraphQL community\'s de facto standard — it avoids the same concurrent-insert/delete instability that plain offset-based pagination suffers from in any API style.',
    gotchas: [
      'Implementing the full Relay connection spec (edges, cursor, pageInfo.hasNextPage) is more ceremony than a simple limit/offset — worth it specifically for the stability guarantee, not just convention.',
      'A cursor should be OPAQUE to the client (an encoded token, not a raw offset) so the server can change its underlying pagination mechanism without breaking client cursors.',
    ],
  },
  'graphql/testing': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Error Handling', route: '/graphql/error-handling' },
    ],
    tip: 'Testing a GraphQL API benefits from testing at THREE levels — schema validation (does the schema itself compile correctly), resolver unit tests (business logic in isolation), and full query integration tests (the actual request/response shape) — each catches different classes of bugs.',
    gotchas: [
      'Snapshot testing entire query responses can become brittle as the schema evolves — targeted assertions on specific fields are often more maintainable.',
      'Mocking resolvers for testing requires understanding the resolver execution order, since mocked parent resolvers affect what arguments child resolvers receive.',
    ],
  },
  'graphql/performance': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'DataLoader', route: '/graphql/dataloader' },
    ],
    tip: 'Query complexity/depth limiting is essential in production GraphQL — without it, a client (malicious or just naive) can construct a deeply nested query that fans out into an enormous number of resolver calls, effectively a self-inflicted denial of service.',
    gotchas: [
      'Persisted queries (pre-registering allowed query strings server-side) both improve performance (smaller request payloads) and reduce attack surface by rejecting arbitrary ad-hoc queries.',
      'Resolver-level caching and DataLoader batching solve different performance problems — caching avoids redundant work, batching avoids the N+1 problem, and most production APIs need both.',
    ],
  },
  'graphql/client-caching': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Apollo Client', route: '/graphql/apollo-client' },
    ],
    tip: 'Apollo Client\'s normalized cache stores objects by a computed cache ID (typically __typename + id) — this is what lets a mutation updating one object automatically refresh EVERY query on the page that references that same object, without manual cache-busting.',
    gotchas: [
      'Objects without a stable, unique identifier (or a custom cache-key configuration) cannot be normalized correctly, leading to duplicate cache entries for what should be the same object.',
      'Cache updates after a mutation sometimes require explicit cache.modify() or refetchQueries when the automatic normalization doesn\'t cover a specific update pattern.',
    ],
  },
  'graphql/apollo-client': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Client Caching', route: '/graphql/client-caching' },
      { label: 'Apollo Server',  route: '/graphql/apollo-server' },
    ],
    tip: 'Apollo Client\'s useQuery hook automatically manages loading/error/data state AND deduplicates identical in-flight requests — calling the same query from multiple components simultaneously triggers only one actual network request.',
    gotchas: [
      'The fetchPolicy setting (cache-first, network-only, cache-and-network) meaningfully changes whether stale cached data is shown before a network request completes.',
      'Optimistic responses let the UI update immediately before a mutation completes, but require careful rollback handling if the mutation ultimately fails.',
    ],
  },
  'graphql/apollo-server': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Apollo Client', route: '/graphql/apollo-client' },
      { label: 'Federation',    route: '/graphql/federation' },
    ],
    tip: 'Apollo Server\'s context function runs once PER REQUEST, making it the standard place to instantiate per-request resources (a DataLoader instance, an authenticated user object) that resolvers can then access without global state.',
    gotchas: [
      'Sharing a single DataLoader instance across requests (instead of creating one per request in context) reintroduces the cross-request cache-leak risk DataLoader is meant to avoid.',
      'Apollo Server plugins hook into the request lifecycle for cross-cutting concerns (logging, tracing) similar to middleware in a REST framework.',
    ],
  },
  'graphql/federation': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Apollo Server', route: '/graphql/apollo-server' },
    ],
    tip: 'Federation lets multiple independently-deployed GraphQL services (subgraphs) compose into ONE unified graph exposed through a gateway — each team owns their subgraph\'s schema and resolvers independently, similar to microservices\' independent-deployability goal applied to GraphQL specifically.',
    gotchas: [
      'A type extended across multiple subgraphs (via @key directives) requires careful coordination — a mismatched key definition between subgraphs breaks entity resolution.',
      'The gateway adds a query-planning step to fan out a client query across the right subgraphs — this adds latency compared to a single monolithic GraphQL server.',
    ],
  },
  'graphql/code-generation': {
    apis: GQL_DEFAULT.apis, docs: GQL_DEFAULT.docs, resources: GQL_DEFAULT.resources,
    related: [
      { label: 'Type System', route: '/graphql/type-system' },
    ],
    tip: 'GraphQL Code Generator produces strongly-typed client code (TypeScript types, React hooks) directly FROM the schema and query documents — catching a mismatch between a query\'s requested fields and the schema at BUILD time rather than at runtime.',
    gotchas: [
      'Generated types go stale if code generation isn\'t re-run after a schema change — wiring it into the build/CI pipeline avoids silently outdated generated types.',
      'Overly generic generated types (falling back to any/unknown for complex union/interface cases) can reduce the actual type-safety benefit if not configured carefully.',
    ],
  },

  // ── Node.js: per-page entries ───────────────────────────────────────────────
  'node/core-modules': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Architecture',  route: '/node/architecture' },
      { label: 'Modules',       route: '/node/modules' },
    ],
    tip: 'The fs, path, and http core modules require no npm install — understanding them well reduces unnecessary third-party dependencies for tasks Node already solves natively.',
    gotchas: [
      'fs synchronous methods (readFileSync) block the entire event loop — appropriate only at startup/config-load time, never inside a request handler.',
      'path.join correctly handles OS-specific separators — string-concatenating paths manually breaks cross-platform compatibility.',
    ],
  },
  'node/architecture': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Core Modules',       route: '/node/core-modules' },
      { label: 'Promises & Async',   route: '/node/promises-async' },
    ],
    tip: 'The event loop is single-threaded — a synchronous CPU-bound operation blocks EVERY concurrent request being handled, not just the one that triggered it, which is why offloading heavy computation to a worker thread matters for a Node server\'s overall responsiveness.',
    gotchas: [
      'libuv\'s thread pool (default size 4) handles some async I/O under the hood — exhausting it with many concurrent fs/crypto operations can cause unexpected queuing.',
      'Understanding the phases of the event loop (timers, I/O callbacks, setImmediate) explains subtle ordering bugs between setTimeout(fn, 0) and process.nextTick.',
    ],
  },
  'node/modules': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Core Modules', route: '/node/core-modules' },
    ],
    tip: 'require() caches modules by resolved file path — mutating a required module\'s exports affects EVERY other file that requires it, a subtle source of shared-state bugs across seemingly unrelated files.',
    gotchas: [
      'ESM (import/export) and CommonJS (require) have different module resolution and top-level-await semantics — mixing them in one project requires understanding the interop rules.',
      'Circular requires between two modules can silently produce a partially-initialized export depending on load order.',
    ],
  },
  'node/promises-async': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Architecture',       route: '/node/architecture' },
      { label: 'Error Handling',     route: '/node/error-handling' },
    ],
    tip: 'An unhandled promise rejection crashes the process in modern Node by default — every async operation needs either a .catch() or a try/catch around its await, unlike older Node versions that merely logged a warning.',
    gotchas: [
      'Promise.all rejects as soon as ANY promise rejects, potentially leaving other in-flight operations dangling — Promise.allSettled is often more appropriate when partial failures should be handled individually.',
      'Forgetting await before an async function call means the calling code continues without waiting for it — a subtle and common source of race conditions.',
    ],
  },
  'node/error-handling': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Promises & Async', route: '/node/promises-async' },
      { label: 'Logging',          route: '/node/logging' },
    ],
    tip: 'Operational errors (a failed network call, invalid user input) should be handled gracefully; programmer errors (a null reference bug) generally SHOULD crash the process — restart via a process manager rather than trying to keep running in a corrupted state.',
    gotchas: [
      'A try/catch around synchronous code does NOT catch errors from an async callback executed later — the async boundary breaks the normal exception-propagation path.',
      'Global uncaughtException/unhandledRejection handlers are a last-resort safety net for logging, not a substitute for proper error handling at the source.',
    ],
  },
  'node/streams': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Core Modules',   route: '/node/core-modules' },
      { label: 'Performance',    route: '/node/performance' },
    ],
    tip: 'Streams process data in CHUNKS rather than loading an entire file/response into memory at once — essential for handling large files or long-lived connections without exhausting memory, at the cost of more complex backpressure-aware code.',
    gotchas: [
      'Piping without handling backpressure (writing faster than a destination can consume) can cause unbounded memory growth — .pipe() handles this automatically, manual write() calls do not.',
      'Forgetting to handle the "error" event on a stream lets stream errors go completely unhandled, unlike a promise rejection which at least crashes visibly.',
    ],
  },
  'node/worker-threads': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Architecture',  route: '/node/architecture' },
      { label: 'Performance',   route: '/node/performance' },
    ],
    tip: 'Worker threads run genuinely parallel JavaScript execution on separate threads — the correct tool for CPU-bound work (image processing, heavy computation) that would otherwise block the single-threaded event loop for every concurrent request.',
    gotchas: [
      'Data passed between the main thread and a worker is COPIED by default (structured clone), not shared — SharedArrayBuffer is required for genuine shared memory, with its own synchronization concerns.',
      'Spawning a new worker thread has real startup overhead — a worker pool reused across requests is usually more appropriate than spawning one per request.',
    ],
  },
  'node/express': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'REST API',    route: '/node/rest-api' },
      { label: 'Fastify',     route: '/node/fastify' },
    ],
    tip: 'Express middleware executes in the ORDER it is registered — a middleware that forgets to call next() silently halts the request pipeline, one of the most common Express debugging headaches for newcomers.',
    gotchas: [
      'An error-handling middleware must have exactly FOUR parameters (err, req, res, next) — Express uses the function\'s arity to distinguish it from regular middleware.',
      'Unhandled errors in an async route handler are NOT automatically caught by Express\'s error middleware in versions before Express 5 — a try/catch or wrapper utility is needed.',
    ],
  },
  'node/fastify': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Express',  route: '/node/express' },
    ],
    tip: 'Fastify\'s schema-based request/response validation (using JSON Schema) both validates input AND serializes output faster than a generic JSON.stringify, since Fastify pre-compiles a serializer from the declared schema.',
    gotchas: [
      'Fastify\'s plugin encapsulation model means a plugin\'s decorators/hooks are scoped to that plugin\'s context by default — a common surprise for developers used to Express\'s global middleware model.',
      'The performance advantage over Express is most pronounced under high request volume with JSON-heavy payloads — for low-traffic services, the difference is rarely the deciding factor.',
    ],
  },
  'node/nestjs': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Express',  route: '/node/express' },
    ],
    tip: 'NestJS layers a structured, dependency-injection-based architecture (modules, controllers, providers) on top of Express or Fastify — bringing Angular-like organizational patterns to backend Node development, at the cost of more upfront structure than a minimal Express app.',
    gotchas: [
      'NestJS\'s DI container requires understanding provider scopes (singleton, request, transient) — using the wrong scope for stateful providers can leak data across requests.',
      'The framework\'s opinionated structure pays off most for larger, longer-lived services — a tiny microservice may not need its full ceremony.',
    ],
  },
  'node/rest-api': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Express',   route: '/node/express' },
      { label: 'Security',  route: '/node/security' },
    ],
    tip: 'Input validation should happen at the API boundary BEFORE business logic runs — a request body trusted without validation is one of the most common sources of both bugs and security vulnerabilities in Node REST APIs.',
    gotchas: [
      'Returning inconsistent error response shapes across endpoints forces every client integration to special-case each endpoint\'s error format.',
      'Not setting explicit request body size limits can let a single oversized request exhaust server memory.',
    ],
  },
  'node/graphql': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'REST API', route: '/node/rest-api' },
    ],
    tip: 'A naive GraphQL resolver implementation in Node is prone to the N+1 query problem exactly like in any other language — DataLoader-style request-scoped batching and caching is the standard Node-ecosystem fix.',
    gotchas: [
      'Apollo Server\'s context function runs once per request — the correct place to instantiate a fresh DataLoader instance, avoiding cross-request cache leaks.',
      'GraphQL\'s single endpoint bypasses traditional URL-based HTTP caching that a REST API in the same Express app would benefit from.',
    ],
  },
  'node/jwt-auth': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Security',   route: '/node/security' },
      { label: 'REST API',   route: '/node/rest-api' },
    ],
    tip: 'A JWT\'s payload is Base64-encoded, NOT encrypted — verify the signature server-side on EVERY request; trusting a decoded payload without signature verification lets a client forge arbitrary claims.',
    gotchas: [
      'Storing a JWT in localStorage exposes it to XSS; an httpOnly cookie protects against XSS but reopens CSRF concerns — the right storage choice depends on the app\'s actual threat model.',
      'JWTs are stateless and cannot be revoked before expiry without an additional server-side revocation mechanism.',
    ],
  },
  'node/security': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'JWT Auth',   route: '/node/jwt-auth' },
      { label: 'REST API',   route: '/node/rest-api' },
    ],
    tip: 'helmet.js sets a collection of security-related HTTP headers with sensible defaults in one line — a quick, high-value hardening step for any Express app that is trivially easy to skip if not deliberately added.',
    gotchas: [
      'npm audit surfaces known vulnerabilities in dependencies, but does not catch vulnerabilities in your OWN application logic — it complements, not replaces, secure coding practices.',
      'Environment variables holding secrets should never be logged or included in error responses — a surprisingly common accidental leak.',
    ],
  },
  'node/env-config': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Deployment',  route: '/node/deployment' },
      { label: 'Security',    route: '/node/security' },
    ],
    tip: 'Environment-based configuration (via process.env) lets the SAME build artifact run across dev/staging/production with different config — baking environment-specific values into the build instead requires a separate build per environment, undermining "build once, deploy everywhere."',
    gotchas: [
      'A .env file should never be committed to git — it belongs in .gitignore, with a .env.example template committed instead showing expected keys.',
      'Missing required environment variables should fail LOUDLY at startup, not silently default to undefined and fail mysteriously later at runtime.',
    ],
  },
  'node/logging': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Error Handling', route: '/node/error-handling' },
    ],
    tip: 'Structured logging (JSON with consistent fields) is queryable at scale, unlike free-text console.log lines which require fragile regex parsing to extract information from a centralized log aggregator.',
    gotchas: [
      'console.log is synchronous and can become a real bottleneck under high request volume — a proper logging library (pino, winston) handles this more efficiently.',
      'Logging sensitive data (passwords, tokens, full request bodies) is a common compliance and security failure mode worth explicitly guarding against.',
    ],
  },
  'node/testing': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Express',   route: '/node/express' },
    ],
    tip: 'Testing an Express/Fastify app with supertest lets you make real HTTP requests against the app in-process, without actually binding to a network port — fast, reliable integration-style tests of routing and middleware behavior.',
    gotchas: [
      'Mocking a database call versus using a real test database (via Testcontainers) is the same integration-vs-unit tradeoff that applies to testing any backend — both have their place.',
      'Async test code that forgets to await a promise can report false passes, since the test completes before the assertion actually runs.',
    ],
  },
  'node/performance': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Worker Threads', route: '/node/worker-threads' },
      { label: 'Caching',        route: '/node/caching' },
    ],
    tip: 'Profiling BEFORE optimizing avoids wasted effort — the Node.js built-in profiler (--prof) or clinic.js reveal actual bottlenecks, since intuition about "what\'s slow" is frequently wrong.',
    gotchas: [
      'A memory leak in a long-running Node process (event listeners never removed, a growing cache with no eviction) often only surfaces after hours or days of uptime, not in quick local testing.',
      'Clustering (running multiple Node processes) is required to use more than one CPU core, since a single Node process is fundamentally single-threaded for JS execution.',
    ],
  },
  'node/caching': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Performance', route: '/node/performance' },
    ],
    tip: 'An in-memory cache (a plain Map or LRU cache) is fast but not shared across multiple Node instances — a distributed cache (Redis) is required once an application scales horizontally across more than one process.',
    gotchas: [
      'Cache invalidation on writes must be deliberate — forgetting to invalidate on update serves stale data indefinitely until a TTL naturally expires.',
      'An unbounded in-memory cache (no max size, no eviction) is a memory leak waiting to happen in a long-running process.',
    ],
  },
  'node/mongoose': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Prisma', route: '/node/prisma' },
    ],
    tip: 'Mongoose adds schema validation, middleware hooks, and query builders on top of the native MongoDB driver — the native driver alone provides no schema enforcement at all, by design matching MongoDB\'s flexible-schema philosophy.',
    gotchas: [
      'Mongoose\'s automatic type casting can silently coerce unexpected input types — understand its casting behavior before relying on it as validation.',
      'Reusing a single connection (not creating one per request) is essential — Mongoose manages connection pooling internally when used correctly.',
    ],
  },
  'node/prisma': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Mongoose', route: '/node/mongoose' },
    ],
    tip: 'Prisma generates a fully-typed client FROM the schema file — catching a mistyped field name or wrong type at COMPILE time, unlike a raw SQL query string where the same mistake only surfaces at runtime.',
    gotchas: [
      'Prisma migrations should be reviewed before applying in production — an auto-generated migration can occasionally include a destructive operation (a column drop) that needs manual confirmation.',
      'The Prisma Client instance should be a SINGLETON reused across the app, not instantiated per request, to avoid exhausting database connections.',
    ],
  },
  'node/deployment': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Env Config',   route: '/node/env-config' },
      { label: 'Performance',  route: '/node/performance' },
    ],
    tip: 'Graceful shutdown (handling SIGTERM to finish in-flight requests and close DB connections before exiting) is essential for zero-downtime deployments — an abrupt process kill can drop active requests and leave connections in an inconsistent state.',
    gotchas: [
      'A process manager (PM2, or a container orchestrator\'s own restart policy) that immediately restarts a crashing process can mask an underlying bug that should actually be fixed, not just auto-recovered from.',
      'Health check endpoints should verify genuine readiness (DB connectivity, dependent service availability), not just "the process is running."',
    ],
  },
  'node/websockets': {
    apis: NODE_DEFAULT.apis, docs: NODE_DEFAULT.docs, resources: NODE_DEFAULT.resources,
    related: [
      { label: 'Streams', route: '/node/streams' },
    ],
    tip: 'A WebSocket connection is inherently stateful — scaling across multiple Node instances requires either sticky sessions (routing a client to the same instance) or a shared pub/sub backend (Redis) so a message published on one instance reaches clients connected to another.',
    gotchas: [
      'Each open WebSocket connection consumes server memory for as long as it stays open — capacity planning for WebSocket-heavy services is about CONCURRENT CONNECTION count, not request rate.',
      'Forgetting to handle the "close" event to clean up associated resources (subscriptions, timers) per connection is a common memory-leak source.',
    ],
  },

  // ── Go: per-page entries ────────────────────────────────────────────────────
  'go/fundamentals': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Structs & Interfaces', route: '/go/structs-interfaces' },
      { label: 'Error Handling',       route: '/go/error-handling' },
    ],
    tip: 'Go has no exceptions — errors are ordinary return values, checked explicitly with if err != nil — this is a deliberate design choice forcing error handling to be visible in the code path, not hidden in an invisible try/catch control flow.',
    gotchas: [
      'Unused imports and unused local variables are COMPILE ERRORS in Go, not warnings — this is deliberate, catching dead code before it ships.',
      'Go has no generics-style function overloading — a function name can only have one signature per package scope.',
    ],
  },
  'go/structs-interfaces': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Fundamentals', route: '/go/fundamentals' },
      { label: 'Generics',     route: '/go/generics' },
    ],
    tip: 'Go interfaces are satisfied IMPLICITLY — a type never declares "implements InterfaceX"; it simply satisfies the interface by having the right methods, enabling loose coupling without inheritance-style explicit declarations.',
    gotchas: [
      'A nil interface holding a typed nil pointer is NOT itself nil — err != nil can be true even when the underlying concrete value is nil, a classic Go gotcha.',
      'Embedding a struct promotes its fields/methods to the outer struct, but this is composition, not inheritance — there is no polymorphic dispatch to the embedded type.',
    ],
  },
  'go/slices-maps': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Structs & Interfaces', route: '/go/structs-interfaces' },
    ],
    tip: 'A Go slice is a view (pointer, length, capacity) over an underlying array — appending beyond capacity allocates a NEW underlying array, meaning two slices that once shared memory can silently diverge after an append on one of them.',
    gotchas: [
      'Map iteration order is intentionally RANDOMIZED in Go — code that depends on a specific iteration order is relying on undefined behavior.',
      'A nil map can be READ from safely (returns zero value) but WRITING to a nil map panics — a common source of confusion for newcomers.',
    ],
  },
  'go/generics': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Structs & Interfaces', route: '/go/structs-interfaces' },
    ],
    tip: 'Go generics (since 1.18) use TYPE PARAMETERS with constraints — a constraint is itself an interface describing what operations a type parameter must support, letting a single function work across multiple types while preserving compile-time type safety.',
    gotchas: [
      'Generics do not eliminate the need for interfaces — they solve a DIFFERENT problem (type-safe reuse across concrete types) than interfaces (behavioral abstraction).',
      'Overusing generics where a plain interface or duplication would be clearer can hurt readability — Go\'s culture leans toward simplicity over generic-everything.',
    ],
  },
  'go/goroutines': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Channels', route: '/go/channels' },
      { label: 'Sync',     route: '/go/sync' },
    ],
    tip: 'A goroutine leak (one blocked forever on a channel with no reader) is silent — it never panics, it just quietly consumes memory forever; always give long-running goroutines a way to be cancelled, typically via context.',
    gotchas: [
      'A loop variable captured in a goroutine closure (pre-Go 1.22) reused the SAME variable across iterations — Go 1.22+ changed this to per-iteration semantics, but older code and tutorials still show the old pattern.',
      'Spawning goroutines without any bound (one per incoming request with no limit) can exhaust memory under high load — a worker pool or semaphore pattern caps concurrency deliberately.',
    ],
  },
  'go/channels': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Goroutines', route: '/go/goroutines' },
      { label: 'Context',    route: '/go/context' },
    ],
    tip: 'Sending on a closed channel PANICS; receiving from a closed channel returns the zero value immediately without blocking — this asymmetry is a frequent source of bugs when multiple goroutines share responsibility for closing a channel.',
    gotchas: [
      'Only the SENDER should close a channel, never the receiver — closing from the receiver side (or closing twice) causes a panic.',
      'An unbuffered channel send blocks until a receiver is ready — this can deadlock if no other goroutine is set up to receive.',
    ],
  },
  'go/sync': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Goroutines', route: '/go/goroutines' },
      { label: 'Channels',   route: '/go/channels' },
    ],
    tip: 'sync.WaitGroup coordinates waiting for a group of goroutines to finish — Add() must happen BEFORE the goroutine starts (not inside it), or a race condition can let Wait() return before all goroutines have actually been counted.',
    gotchas: [
      'sync.Mutex is not reentrant — a goroutine that locks a mutex it already holds deadlocks itself, unlike some other languages\' reentrant locks.',
      'sync.RWMutex allows multiple concurrent readers OR one writer — using it for write-heavy workloads provides no benefit over a plain Mutex and adds overhead.',
    ],
  },
  'go/context': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Channels', route: '/go/channels' },
      { label: 'Net/HTTP', route: '/go/net-http' },
    ],
    tip: 'context.Context propagates cancellation, deadlines, and request-scoped values across API boundaries and goroutines — a function performing I/O should accept and respect a context, checking ctx.Done() to stop work promptly when the caller cancels or times out.',
    gotchas: [
      'context.Value should be reserved for request-scoped metadata (a trace ID), not for passing optional function parameters — overusing it for general data passing is considered an anti-pattern.',
      'Forgetting to call the cancel function returned by context.WithCancel/WithTimeout leaks resources, even if the context itself is never explicitly cancelled.',
    ],
  },
  'go/error-handling': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Fundamentals', route: '/go/fundamentals' },
    ],
    tip: 'errors.Is and errors.As let you check for and unwrap WRAPPED errors (created with fmt.Errorf("...: %w", err)) — essential for checking a specific underlying error type through several layers of wrapping without losing the original error\'s identity.',
    gotchas: [
      'Ignoring an error with the blank identifier (_, err := ...) is a deliberate choice that should be rare and commented — silently swallowing errors is a common source of hard-to-diagnose bugs.',
      'panic/recover should be reserved for genuinely unrecoverable programmer errors, not as a general error-handling mechanism — idiomatic Go prefers explicit error returns.',
    ],
  },
  'go/net-http': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Context', route: '/go/context' },
      { label: 'Gin',      route: '/go/gin' },
    ],
    tip: 'The standard library net/http package is genuinely production-capable on its own — many Go services need no third-party web framework at all, unlike ecosystems where a framework is nearly always required for basic HTTP serving.',
    gotchas: [
      'http.Client without an explicit Timeout can hang indefinitely on a slow or unresponsive server — always set one explicitly in production code.',
      'The default http.Client reuses connections via a shared Transport — creating a new client per request defeats connection pooling and hurts performance under load.',
    ],
  },
  'go/gin': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Net/HTTP', route: '/go/net-http' },
    ],
    tip: 'Gin\'s middleware chain and routing conveniences sit on top of net/http — understanding the underlying standard library first makes it easier to reason about what Gin\'s abstractions are actually doing under the hood.',
    gotchas: [
      'Gin panics inside a handler are recovered by the default Recovery middleware — but relying on this as your ONLY error handling strategy hides bugs that should be fixed at the source.',
      'Binding request bodies (c.ShouldBindJSON) validates structure but not business rules — additional validation is still needed for domain-specific constraints.',
    ],
  },
  'go/grpc': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Net/HTTP', route: '/go/net-http' },
    ],
    tip: 'Go is one of the most common languages for implementing gRPC services, given Protocol Buffers\' code-generation tooling and Go\'s strong standard library support for HTTP/2 — a natural fit for internal service-to-service communication.',
    gotchas: [
      'Streaming RPCs require careful context handling — a client disconnecting mid-stream needs the server-side handler to detect ctx.Done() and stop processing promptly.',
      'Generated gRPC code from .proto files should be regenerated and committed whenever the schema changes — a stale generated file silently drifts from the actual contract.',
    ],
  },
  'go/json-encoding': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Structs & Interfaces', route: '/go/structs-interfaces' },
    ],
    tip: 'Struct field tags (`json:"fieldName"`) control JSON marshaling — an unexported (lowercase) struct field is NEVER included in JSON output regardless of tags, a common source of "why is this field missing" confusion.',
    gotchas: [
      'omitempty on a field omits it from JSON output when the field holds its zero value — but this means a genuinely-set false or 0 is indistinguishable from "not set" without using a pointer type instead.',
      'json.Unmarshal silently ignores unknown fields in the input by default unless a DisallowUnknownFields decoder option is explicitly set.',
    ],
  },
  'go/modules': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Fundamentals', route: '/go/fundamentals' },
    ],
    tip: 'go.mod and go.sum together pin exact dependency versions AND their cryptographic checksums — go.sum specifically protects against a dependency being silently swapped for different content at the same version number.',
    gotchas: [
      'Semantic import versioning means a v2+ module must include the major version in its import path (/v2) — a detail that surprises developers moving past a module\'s first major version.',
      'go mod tidy removes unused dependencies from go.mod — running it periodically keeps the dependency graph accurate as code changes.',
    ],
  },
  'go/testing': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Fundamentals', route: '/go/fundamentals' },
    ],
    tip: 'Table-driven tests (a slice of input/expected-output structs looped over in one test function) are the idiomatic Go pattern for testing many cases without duplicating test function boilerplate for each one.',
    gotchas: [
      't.Parallel() marks a test safe to run concurrently with other parallel tests — calling it on a test with shared mutable state can introduce race conditions the test suite itself creates.',
      'go test -race enables the race detector — running the full suite with it periodically catches data races that would otherwise only manifest intermittently in production.',
    ],
  },
  'go/profiling': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Testing', route: '/go/testing' },
    ],
    tip: 'pprof (Go\'s built-in profiler) can be exposed via an HTTP endpoint (net/http/pprof) even in a running production service — profiling a live production workload often reveals bottlenecks a synthetic local benchmark never would.',
    gotchas: [
      'CPU profiling and memory profiling answer DIFFERENT questions — a function can be fast but leak memory, a distinct problem CPU profiling alone would miss entirely.',
      'Benchmark functions (BenchmarkXxx) should avoid unintentionally including setup cost in the timed portion — use b.ResetTimer() after expensive setup.',
    ],
  },
  'go/gorm': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'PGX', route: '/go/pgx' },
    ],
    tip: 'GORM is a full-featured ORM providing struct-to-table mapping, migrations, and hooks — trading some of Go\'s "explicit over implicit" philosophy for developer convenience, a real tradeoff versus writing raw SQL with a lighter query builder.',
    gotchas: [
      'GORM\'s automatic preloading of associations can trigger the N+1 query problem exactly like ORMs in other languages if not configured carefully.',
      'Silent failures (GORM\'s default error handling in some chained calls) can mask a failed operation — always check the returned error explicitly.',
    ],
  },
  'go/pgx': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'GORM', route: '/go/gorm' },
    ],
    tip: 'pgx is a lower-level, PostgreSQL-specific driver offering better performance and more direct control than database/sql\'s generic interface — the tradeoff for GORM\'s convenience is exactly the control and performance pgx provides instead.',
    gotchas: [
      'Connection pooling (pgxpool) must be configured explicitly — a default pool size that doesn\'t match actual concurrency needs can bottleneck or waste database connections.',
      'Using pgx-specific types (like pgtype.Text) instead of standard library types requires understanding pgx\'s specific null-handling conventions.',
    ],
  },
  'go/patterns': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Structs & Interfaces', route: '/go/structs-interfaces' },
      { label: 'Goroutines',           route: '/go/goroutines' },
    ],
    tip: 'The functional options pattern (variadic functions setting struct fields) is Go\'s idiomatic answer to optional constructor parameters, since Go has no function overloading or default parameter values like some other languages.',
    gotchas: [
      'The worker pool pattern (a fixed number of goroutines consuming from a shared channel) is the standard way to bound concurrency for CPU or I/O-bound batch work in Go.',
      'Overusing interfaces for "future flexibility" that never materializes adds indirection Go\'s culture generally discourages — define interfaces at the CONSUMER, not preemptively at the producer.',
    ],
  },
  'go/cli': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'Modules', route: '/go/modules' },
    ],
    tip: 'Go compiles to a SINGLE static binary with no runtime dependency — this is a major reason Go is popular for CLI tools, since distribution is just "copy the binary," unlike languages requiring an installed runtime on the target machine.',
    gotchas: [
      'Cross-compiling for a different OS/architecture (GOOS/GOARCH) is built into the toolchain with no extra tooling required — a genuine advantage for distributing CLI tools across platforms.',
      'CGO-dependent code breaks the "single static binary, cross-compile trivially" advantage, since it links against a C library — pure-Go dependencies preserve this benefit.',
    ],
  },
  'go/build': {
    apis: GO_DEFAULT.apis, docs: GO_DEFAULT.docs, resources: GO_DEFAULT.resources,
    related: [
      { label: 'CLI',      route: '/go/cli' },
      { label: 'Modules',  route: '/go/modules' },
    ],
    tip: 'Build tags and constraint comments let a single codebase compile differently per platform or feature flag — a common pattern for isolating OS-specific code paths without runtime branching.',
    gotchas: [
      'The Go build cache speeds up repeated builds significantly — a CI pipeline not preserving the cache across runs pays the full compile cost every single time.',
      'Stripping debug symbols (-ldflags="-s -w") reduces binary size for distribution but also removes information useful for later debugging a shipped binary.',
    ],
  },

  // ── Blazor: per-page entries ─────────────────────────────────────────────────
  'blazor/fundamentals': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Razor Components', route: '/blazor/razor-components' },
      { label: 'Render Modes',     route: '/blazor/render-modes' },
    ],
    tip: 'Blazor lets you write interactive web UI in C# instead of JavaScript — Blazor Server runs component logic on the server with UI updates streamed over SignalR, while Blazor WebAssembly runs a full .NET runtime in the browser, a fundamentally different execution model with different tradeoffs.',
    gotchas: [
      'Blazor Server requires a persistent SignalR connection — a network interruption can disconnect the circuit and require reconnection, unlike a stateless request-response web app.',
      'Blazor WebAssembly\'s initial download (the .NET runtime plus your app) is larger than a typical JS bundle, affecting first-load time.',
    ],
  },
  'blazor/razor-components': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Fundamentals',              route: '/blazor/fundamentals' },
      { label: 'Component Communication',   route: '/blazor/component-communication' },
    ],
    tip: '@code {} blocks and [Parameter] properties define a component\'s interface — Razor syntax compiles down to plain C# classes, meaning the mental model for reasoning about a Blazor component is much closer to a C# class than to a templating language.',
    gotchas: [
      'A component re-renders on ANY parameter change or StateHasChanged() call by default — ShouldRender() can be overridden to skip unnecessary re-renders for performance-sensitive components.',
      '@key on list items prevents Blazor from misattributing state (like input focus) to the wrong element when a list is reordered.',
    ],
  },
  'blazor/component-communication': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Razor Components',    route: '/blazor/razor-components' },
      { label: 'State Management',    route: '/blazor/state-management' },
    ],
    tip: 'Parent-to-child communication uses [Parameter] properties; child-to-parent uses EventCallback — for communication between UNRELATED components, a shared injected service with an OnChange event is the standard pattern, since Blazor has no built-in global event bus.',
    gotchas: [
      'Forgetting to call StateHasChanged() after a shared service raises its change event means subscribing components won\'t actually re-render.',
      'CascadingValue provides implicit parent-to-descendant data flow without threading parameters through every intermediate component — useful for deeply nested trees.',
    ],
  },
  'blazor/data-binding': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Forms',                  route: '/blazor/forms' },
      { label: 'Component Communication', route: '/blazor/component-communication' },
    ],
    tip: '@bind:event="oninput" for live filtering fires on EVERY keystroke — for expensive downstream operations, debouncing is not built into Blazor\'s binding system and requires a small amount of custom Timer/Task.Delay-based logic.',
    gotchas: [
      'In Blazor Server specifically, un-debounced binding on a fast typist sends a SignalR message per keystroke — debouncing has a doubly important benefit there, cutting both re-render work AND network round-trips.',
      '@bind without an explicit event defaults to onchange (fires on blur), not oninput — a common source of "why doesn\'t this update live" confusion.',
    ],
  },
  'blazor/forms': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Data Binding', route: '/blazor/data-binding' },
    ],
    tip: 'EditForm binds to a Model representing the entire form\'s backing object — DataAnnotationsValidator only catches validation errors on properties that themselves carry validation attributes, including nested complex properties requiring their own attributes.',
    gotchas: [
      'EditForm has no built-in "reset" method — resetting a form requires either a fresh model instance with a new @key, or manually resetting each field.',
      'InputSelect requires the bound property type to correctly implement equality comparison for a pre-selected value to display correctly.',
    ],
  },
  'blazor/dependency-injection': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Component Communication', route: '/blazor/component-communication' },
    ],
    tip: 'A Scoped service in Blazor Server lives for the ENTIRE SignalR circuit (the whole user session), not just one request — a meaningfully different scope than the per-HTTP-request scoping developers coming from traditional ASP.NET Core MVC are used to.',
    gotchas: [
      'A DbContext registered as Scoped in Blazor Server persists for the entire circuit — this can accumulate tracked entities over a long session if not handled carefully.',
      'In Blazor WebAssembly, there is only one user per tab, so Scoped and Singleton effectively behave the same, unlike the meaningful distinction in Blazor Server.',
    ],
  },
  'blazor/state-management': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Dependency Injection',      route: '/blazor/dependency-injection' },
      { label: 'Component Communication',   route: '/blazor/component-communication' },
    ],
    tip: 'For smaller apps, a simple injected service with an OnChange event is usually sufficient — a formal Flux/Redux-style state management library (like Fluxor) is worth the added structure specifically once cross-cutting shared state grows genuinely complex.',
    gotchas: [
      'Introducing a heavy state management framework prematurely adds complexity without proportional benefit for a small app with limited shared state.',
      'Untraceable state mutations scattered across a codebase are one of the hardest bug categories to track down in any stateful UI, Blazor included.',
    ],
  },
  'blazor/routing': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Sections & Layouts', route: '/blazor/sections-layouts' },
    ],
    tip: 'AuthorizeRouteView handles both "not authenticated" and "not authorized" cases for a route automatically — without it, every protected page would need to manually implement the same authentication/authorization check.',
    gotchas: [
      'Deep-linking to a protected route requires preserving the originally requested URL and redirecting back to it after login — easy to overlook, significant UX impact if missed.',
      'The NotFound render fragment on <Router> defines the 404 experience — a bare "not found" message with no path forward is a common, avoidable UX gap.',
    ],
  },
  'blazor/sections-layouts': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Routing', route: '/blazor/routing' },
    ],
    tip: 'MainLayout commonly injects cross-cutting UI elements (nav, header, notifications) that should appear on nearly every page — a CascadingValue declared in a layout automatically becomes available to every page rendered within its @Body.',
    gotchas: [
      'A layout can itself check authorization (via AuthorizeView) to conditionally render admin-specific chrome, without duplicating that check across every admin page.',
      'Testing a layout with bUnit requires particular attention to @Body placement and surrounding chrome rendering correctly.',
    ],
  },
  'blazor/render-modes': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Fundamentals',           route: '/blazor/fundamentals' },
      { label: 'Streaming Rendering',    route: '/blazor/streaming-rendering' },
    ],
    tip: 'Interactive render modes still PRERENDER on the server by default before the interactive runtime takes over — components can run initialization logic TWICE (once during prerender, once at actual interactive startup), a common source of "why did OnInitializedAsync run twice" confusion.',
    gotchas: [
      'Prerendering can be explicitly disabled per component when double-execution would cause problems, like a non-idempotent API call in initialization.',
      'Components using browser-only APIs must guard against running during server-side prerender, where no real browser exists.',
    ],
  },
  'blazor/error-handling': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Fundamentals', route: '/blazor/fundamentals' },
    ],
    tip: 'Unhandled exceptions in fire-and-forget async void event handlers do NOT propagate to an ErrorBoundary — they surface as unhandled task exceptions that can crash a Blazor Server circuit entirely, making async Task (not async void) the required pattern for event handlers that might throw.',
    gotchas: [
      'ErrorBoundary catches exceptions from its child content\'s rendering — it does not catch every kind of async error unless the error surfaces during rendering.',
      'Distinguishing operational errors (an expected API timeout, handled gracefully) from programmer errors (a null reference bug, should crash visibly) shapes where to add try/catch versus letting an ErrorBoundary catch it.',
    ],
  },
  'blazor/js-interop': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Error Handling', route: '/blazor/error-handling' },
    ],
    tip: 'DotNetObjectReference.Create(this) lets JavaScript call back into specific [JSInvokable]-marked .NET methods — but the reference must be explicitly Dispose()d, since JavaScript holding it prevents the .NET object from being garbage collected.',
    gotchas: [
      'Forgetting to dispose a DotNetObjectReference is a common, easy-to-overlook memory leak source in interop-heavy components.',
      'Testing JS-to-.NET interop with bUnit requires directly invoking the [JSInvokable] method, since no real JavaScript runtime exists in the test environment.',
    ],
  },
  'blazor/authentication': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Routing', route: '/blazor/routing' },
    ],
    tip: 'Blazor WASM apps typically hold access tokens in memory (via AuthenticationStateProvider) rather than persistent storage — a full page reload requires re-authentication or silent token refresh, a deliberate tradeoff favoring XSS resistance over persistence convenience.',
    gotchas: [
      'Token expiration should be checked proactively before an API call, not only reactively on a 401 response — a well-designed provider refreshes an about-to-expire token transparently.',
      'Testing authentication edge cases (expired tokens, revoked sessions) is often under-invested compared to testing the happy-path login flow.',
    ],
  },
  'blazor/server-signalr': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Fundamentals', route: '/blazor/fundamentals' },
    ],
    tip: 'Horizontally scaling Blazor Server requires sticky sessions, since a circuit lives entirely on the instance that created it — Azure SignalR Service (or similar) offloads the actual persistent connections from application servers, decoupling connection count from server capacity.',
    gotchas: [
      'Capacity planning for Blazor Server is about CONCURRENT USER count, not request rate — a fundamentally different scaling model than typical stateless APIs.',
      'For very large concurrent user counts where per-user server memory becomes prohibitive, Blazor WebAssembly (shifting state to the client) may scale more cost-effectively.',
    ],
  },
  'blazor/streaming-rendering': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Render Modes',     route: '/blazor/render-modes' },
      { label: 'Performance',      route: '/blazor/performance' },
    ],
    tip: '[StreamRendering] lets a component with slow initial data loading show placeholder content immediately, then patches the real content into the page as it becomes available — it works alongside enhanced navigation for SPA-like transitions even during a streamed page load.',
    gotchas: [
      'Streaming rendering is specifically a Static SSR feature — it has no meaning for components already running in a fully interactive render mode.',
      'Testing streaming behavior in bUnit is limited, since bUnit doesn\'t simulate actual HTTP streaming mechanics — real browser-based E2E testing is usually needed.',
    ],
  },
  'blazor/performance': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Virtualization',        route: '/blazor/virtualization' },
      { label: 'Streaming Rendering',   route: '/blazor/streaming-rendering' },
    ],
    tip: 'For Blazor Server, remember much of the "real work" happens SERVER-SIDE — a client-side browser profile misses it entirely; dotnet-trace and dotnet-counters profile the server-side portion where Blazor Server\'s actual bottlenecks often live.',
    gotchas: [
      'Guessing at bottlenecks without profiling frequently targets the wrong thing — an unrelated expensive API call or inefficient LINQ query is a common actual culprit.',
      'Performance should be measured against actual user-facing metrics (perceived responsiveness), not just internal metrics like render count.',
    ],
  },
  'blazor/virtualization': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Performance', route: '/blazor/performance' },
    ],
    tip: 'The Virtualize component only renders DOM elements for currently visible items in a long list — but it has no built-in filtering/sorting logic; the consuming component must supply an already-filtered/sorted collection or ItemsProvider.',
    gotchas: [
      'Forcing a fresh render via a changed @key is often needed when the underlying item source changes significantly, since Virtualize doesn\'t automatically detect "same list, different dataset."',
      'Combining virtualization with animated list transitions is genuinely difficult, since Virtualize aggressively creates/destroys DOM elements outside the visible range.',
    ],
  },
  'blazor/progressive-enhancement': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Render Modes', route: '/blazor/render-modes' },
    ],
    tip: 'A standard HTML form (correct method/action) submits and works even with JavaScript disabled — the Blazor enhancement script upgrades this to an SPA-like background fetch with DOM patching when JS is available, without needing a separate implementation for the no-JS fallback.',
    gotchas: [
      'A client-side-only validation check with no server-side equivalent breaks the progressive-enhancement promise if JS is disabled — the form should still function correctly.',
      'Testing both the enhanced and baseline (no-JS) submission paths ensures the progressive enhancement genuinely works, not just the happy path.',
    ],
  },
  'blazor/seo-metadata': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Routing', route: '/blazor/routing' },
    ],
    tip: 'A generated sitemap.xml helps search engines discover routes that might not be reachable through normal internal link crawling — particularly valuable for a large Blazor app with dynamically-generated or deeply-nested content routes.',
    gotchas: [
      'Core Web Vitals matter for Blazor apps just as for any web app and are factored into search ranking — a slow InteractiveWebAssembly page can hurt SEO independently of otherwise correct metadata.',
      'Canonical URLs (via HeadContent) prevent duplicate-content penalties for content reachable through multiple URL variations.',
    ],
  },
  'blazor/maui-hybrid': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'JS Interop', route: '/blazor/js-interop' },
    ],
    tip: 'A MAUI Blazor Hybrid app spans two distinct debugging layers — native .NET/MAUI code (standard .NET debugging) and Blazor component code inside an embedded WebView, which may need browser-style DevTools access for full visibility.',
    gotchas: [
      'Platform-specific WebView quirks (older Android WebView versions, WKWebView\'s stricter security policies) can cause behavior differences even with identical Blazor code.',
      'Performance profiling a Hybrid app requires considering both native startup overhead AND web-layer rendering performance separately.',
    ],
  },
  'blazor/bunit': {
    apis: BLAZOR_DEFAULT.apis, docs: BLAZOR_DEFAULT.docs, resources: BLAZOR_DEFAULT.resources,
    related: [
      { label: 'Error Handling', route: '/blazor/error-handling' },
    ],
    tip: 'cut.MarkupMatches() performs SEMANTIC HTML comparison, not exact string matching — attribute order and insignificant whitespace differences are normalized, making tests resilient to cosmetic rendering changes that aren\'t real behavioral regressions.',
    gotchas: [
      'WaitForState()/WaitForAssertion() poll until a condition becomes true — essential for testing components with async behavior, where an immediate synchronous assertion would run before the async operation completes.',
      'Overusing full-markup snapshot assertions for every component becomes brittle — reserve them for components where exact rendered structure genuinely matters.',
    ],
  },

  // ── DevOps: per-page entries ─────────────────────────────────────────────────
  'devops/sdlc-agile': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'Culture',                   route: '/devops/culture' },
      { label: 'Continuous Integration',    route: '/devops/continuous-integration' },
    ],
    tip: 'DevOps grew out of applying Agile\'s iterative, feedback-driven philosophy to OPERATIONS, not just development — the goal is shortening the feedback loop from "code written" to "value delivered and validated in production," not merely shipping code faster.',
    gotchas: [
      'Agile ceremonies (standups, retros) without the underlying feedback-loop mindset become empty ritual — the practices only pay off when paired with genuine iterative learning.',
      'DevOps is as much an organizational/cultural shift as a toolchain — adopting the tools without the collaboration model behind them rarely delivers the expected benefit.',
    ],
  },
  'devops/culture': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'SDLC & Agile',       route: '/devops/sdlc-agile' },
      { label: 'Incident Response',  route: '/devops/incident-response' },
    ],
    tip: 'Breaking down the traditional wall between Dev and Ops means shared ownership of production outcomes — a team that only writes code and hands it off has no direct feedback loop from what actually happens when that code runs in production.',
    gotchas: [
      'Blameless postmortems are a cultural practice, not just a document template — blame-focused incident reviews teach people to hide information, making future incidents harder to learn from.',
      '"You build it, you run it" only works with genuine on-call support and tooling investment — without them, it just shifts operational burden onto developers without the means to handle it well.',
    ],
  },
  'devops/git-workflows': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'Continuous Integration', route: '/devops/continuous-integration' },
    ],
    tip: 'Trunk-based development (short-lived branches, frequent merges to main) enables more frequent, lower-risk integration than long-lived feature branches — the longer a branch diverges from main, the more painful its eventual merge becomes.',
    gotchas: [
      'Long-lived feature branches accumulate merge conflict risk proportional to how long they diverge — this is a direct argument for trunk-based development at scale.',
      'A branching strategy should match team size and release cadence — GitFlow\'s heavier ceremony fits some release schedules better than others, not universally.',
    ],
  },
  'devops/continuous-integration': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'Git Workflows',           route: '/devops/git-workflows' },
      { label: 'Continuous Delivery',     route: '/devops/continuous-delivery' },
    ],
    tip: 'CI\'s core value is catching integration problems EARLY and FREQUENTLY — a build that only runs nightly or weekly defeats the purpose, since the whole point is surfacing a broken integration within minutes of the change that caused it, while context is still fresh.',
    gotchas: [
      'A flaky test suite that developers learn to ignore or re-run blindly defeats CI\'s trust model entirely — flaky tests need fixing, not routine dismissal.',
      'CI pipeline speed matters — a 45-minute pipeline gets run less often locally and delays feedback, undermining the fast-feedback goal CI exists to serve.',
    ],
  },
  'devops/continuous-delivery': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'Continuous Integration', route: '/devops/continuous-integration' },
      { label: 'Release Management',     route: '/devops/release-management' },
    ],
    tip: 'Continuous Delivery means every change that passes the pipeline is DEPLOYABLE at any time — this is distinct from Continuous Deployment, where every passing change is AUTOMATICALLY deployed with no manual gate; conflating the two is a common terminology mistake.',
    gotchas: [
      'A pipeline that "could" deploy but requires manual approval at every stage isn\'t genuinely continuous — the discipline is in removing unnecessary manual gates, not just having automation exist.',
      'Feature flags let code be deployed without being immediately user-visible, decoupling deployment from release — a key enabler of safe continuous delivery.',
    ],
  },
  'devops/environment-strategy': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'Continuous Delivery', route: '/devops/continuous-delivery' },
    ],
    tip: 'Environment PARITY (staging closely mirroring production\'s configuration and scale) is what makes staging tests actually predictive of production behavior — a staging environment that diverges significantly from production gives false confidence.',
    gotchas: [
      'Configuration drift between environments (a manually-applied hotfix in production never backported to staging) silently erodes parity over time.',
      'Ephemeral environments (spun up per PR, torn down after) avoid drift entirely by always starting from a known-clean baseline, at the cost of provisioning overhead per environment.',
    ],
  },
  'devops/release-management': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'Continuous Delivery', route: '/devops/continuous-delivery' },
    ],
    tip: 'Blue-green and canary deployments both reduce release risk but differently — blue-green switches ALL traffic to a new version atomically (fast rollback, doubled infrastructure cost); canary gradually shifts a SMALL percentage of traffic first (slower, but catches issues before full exposure).',
    gotchas: [
      'A rollback plan that has never actually been tested is not a real rollback plan — practicing the rollback path is as important as practicing the deploy path.',
      'Feature flags decouple deployment from release, letting a "released" feature be toggled off instantly without a full redeploy if something goes wrong.',
    ],
  },
  'devops/iac': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'GitOps', route: '/devops/gitops' },
    ],
    tip: 'Infrastructure as Code treats infrastructure provisioning as a versioned, reviewable, repeatable artifact — the alternative (manual console clicks) produces infrastructure that can\'t be reliably reproduced, audited, or rolled back the way code can.',
    gotchas: [
      'IaC configuration drift (a manual change made directly in the cloud console, bypassing the IaC tool) silently diverges from what the code describes until the next apply forcibly reconciles it.',
      'Always reviewing a plan/diff before applying is essential — an unexpected "destroy" in a plan output is the single most common way teams accidentally lose production infrastructure.',
    ],
  },
  'devops/gitops': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'IaC',                     route: '/devops/iac' },
      { label: 'Kubernetes Deployments',   route: '/devops/kubernetes-deployments' },
    ],
    tip: 'GitOps uses Git as the SINGLE SOURCE OF TRUTH for desired system state — a reconciliation controller (Argo CD, Flux) continuously compares actual cluster state to the Git-declared state and automatically corrects any drift, rather than a human running imperative deploy commands.',
    gotchas: [
      'GitOps\'s automatic reconciliation means a manual kubectl edit against a GitOps-managed resource gets silently reverted on the next reconciliation cycle — changes must go through Git.',
      'Secrets in a GitOps repo need special handling (sealed secrets, external secret operators) since the repo itself shouldn\'t contain plaintext credentials.',
    ],
  },
  'devops/kubernetes-deployments': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'GitOps',           route: '/devops/gitops' },
      { label: 'Docker & CI/CD',   route: '/devops/docker-cicd' },
    ],
    tip: 'A rolling update deployment strategy replaces pods gradually (a batch at a time) rather than all at once — reducing the risk that a bad image takes down the entire application simultaneously, at the cost of briefly running mixed old/new versions during rollout.',
    gotchas: [
      'Readiness probes must accurately reflect genuine readiness — a rolling update routing traffic to a not-yet-ready pod causes real request failures during the deploy.',
      'A deployment with no resource limits set can starve other workloads on a shared node during a rollout that temporarily runs both old and new pod versions.',
    ],
  },
  'devops/docker-cicd': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'Kubernetes Deployments', route: '/devops/kubernetes-deployments' },
      { label: 'Artifact Management',    route: '/devops/artifact-management' },
    ],
    tip: 'Building a Docker image once in CI and promoting the SAME immutable image artifact through staging then production (rather than rebuilding per environment) guarantees what was actually tested is exactly what ships — rebuilding per environment risks subtle differences slipping in.',
    gotchas: [
      'CI layer caching speeds up repeated builds significantly — a pipeline not preserving the Docker build cache across runs pays the full build cost every time.',
      'Tagging images by content digest (not just a mutable version tag) in the deployment manifest guarantees exactly which image bytes are actually running.',
    ],
  },
  'devops/artifact-management': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'Docker & CI/CD', route: '/devops/docker-cicd' },
    ],
    tip: 'A private artifact registry (for container images, packages, binaries) provides a controlled, audited source of truth for what CAN be deployed — pulling directly from public registries in production bypasses vulnerability scanning and provenance checks the private registry enforces.',
    gotchas: [
      'Retention policies need explicit configuration — an unbounded artifact registry accumulates storage cost indefinitely without cleanup of old, unused versions.',
      'Artifact signing and provenance attestation address supply-chain tampering risks that storage alone does not cover.',
    ],
  },
  'devops/github-actions': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'Jenkins',           route: '/devops/jenkins' },
      { label: 'Azure Pipelines',   route: '/devops/azure-pipelines' },
    ],
    tip: 'GitHub Actions workflows are defined as YAML checked into the SAME repository as the code — pipeline changes go through the same code review and version history as any other change, unlike a pipeline configured purely through an external CI tool\'s UI.',
    gotchas: [
      'Reusable workflows and composite actions reduce duplication across multiple pipelines that share common stages — copy-pasting the same steps everywhere becomes a maintenance burden.',
      'Secrets referenced in a workflow are masked in logs by default, but a poorly-written step can still accidentally echo a secret value into output.',
    ],
  },
  'devops/jenkins': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'GitHub Actions',   route: '/devops/github-actions' },
    ],
    tip: 'Jenkins\'s plugin ecosystem gives it enormous flexibility but also a real maintenance burden — plugin version incompatibilities and abandoned plugins are a common source of Jenkins upgrade pain that newer, more opinionated CI platforms deliberately avoid.',
    gotchas: [
      'Declarative Jenkinsfile pipelines (checked into source control) are strongly preferred over configuring jobs purely through the Jenkins UI, for the same code-review/versioning reasons as any pipeline-as-code approach.',
      'A Jenkins master that also runs build agents directly can be starved of resources by heavy builds — dedicated agent nodes isolate this.',
    ],
  },
  'devops/azure-pipelines': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'GitHub Actions', route: '/devops/github-actions' },
    ],
    tip: 'YAML pipelines in Azure DevOps are defined as code, checked into the repo — replacing the older Classic (GUI-based) editor, whose configuration lived outside source control and couldn\'t vary per branch the way pipeline-as-code naturally can.',
    gotchas: [
      'Templates let common stages be defined once and reused across many pipelines, reducing duplication versus copy-pasting the same steps into every pipeline.',
      'YAML pipelines have a steeper initial learning curve than the Classic editor\'s drag-and-drop interface, but pay off in long-term maintainability.',
    ],
  },
  'devops/incident-response': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'Monitoring',   route: '/devops/monitoring' },
      { label: 'SRE',          route: '/devops/sre' },
    ],
    tip: 'A blameless postmortem asks WHAT in the system and process allowed an incident to happen, not WHO made a mistake — this isn\'t just a nicety, it directly affects whether future incidents get reported honestly and quickly or hidden out of fear.',
    gotchas: [
      'A postmortem without concrete, assigned, TRACKED follow-up action items is a well-written story that prevents nothing.',
      'Declaring an incident resolved once symptoms disappear, without confirming root cause, risks the same issue recurring shortly after.',
    ],
  },
  'devops/monitoring': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'Incident Response', route: '/devops/incident-response' },
      { label: 'Logging',           route: '/devops/logging' },
    ],
    tip: 'Alert on SYMPTOMS users actually experience (elevated error rate, slow responses), not every possible internal CAUSE (a CPU spike, one pod restarting) — cause-based alerting produces fatigue from noisy, often self-resolving conditions that never actually reach the user.',
    gotchas: [
      'An alert with no clear, actionable runbook trains on-call to acknowledge and ignore it — every alert needs a defined response action.',
      'Dashboards are not a substitute for alerting — nobody watches a dashboard 24/7, which is why alerting design matters as its own discipline.',
    ],
  },
  'devops/logging': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'Monitoring', route: '/devops/monitoring' },
    ],
    tip: 'Centralized log aggregation (shipping logs from every instance to one searchable store) becomes essential once an application runs across multiple instances — grepping individual server log files stops scaling past a handful of hosts.',
    gotchas: [
      'Structured logs (JSON with consistent fields) are queryable at scale; free-text logs require fragile regex parsing to extract the same information.',
      'Sensitive data (passwords, tokens) must never be logged — a common compliance and security failure mode across CI/CD pipelines too, not just application code.',
    ],
  },
  'devops/devsecops': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'CI/CD',            route: '/devops/continuous-integration' },
      { label: 'Artifact Management', route: '/devops/artifact-management' },
    ],
    tip: 'DevSecOps means security scanning (dependency vulnerabilities, container image scanning, SAST) runs AS PART of the CI/CD pipeline itself — catching issues before they merge or deploy, rather than as a separate, later security review that discovers problems after the fact.',
    gotchas: [
      'Security gates that block every merge on any finding (even low-severity) train developers to seek workarounds — a graduated severity policy keeps the gate meaningful without becoming an obstacle developers route around.',
      'Shifting security "left" (earlier in the pipeline) doesn\'t eliminate the need for runtime/production security monitoring — both are needed, not one instead of the other.',
    ],
  },
  'devops/platform-engineering': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'GitOps', route: '/devops/gitops' },
    ],
    tip: 'Platform engineering builds INTERNAL DEVELOPER PLATFORMS (self-service tooling, golden paths) so product teams can provision infrastructure and deploy without needing deep infrastructure expertise themselves — treating the platform itself as a product with its own users (the internal dev teams).',
    gotchas: [
      'A platform team building tooling nobody asked for (or that ignores actual developer pain points) produces shelf-ware — platform engineering succeeds specifically by treating internal developers as real customers with real feedback loops.',
      'Too rigid a "golden path" without escape hatches for genuinely unusual needs frustrates teams with legitimate edge cases.',
    ],
  },
  'devops/sre': {
    apis: DEVOPS_DEFAULT.apis, docs: DEVOPS_DEFAULT.docs, resources: DEVOPS_DEFAULT.resources,
    related: [
      { label: 'Incident Response', route: '/devops/incident-response' },
      { label: 'Monitoring',        route: '/devops/monitoring' },
    ],
    tip: 'SRE treats reliability as a QUANTIFIED, engineered property (via SLOs and error budgets) rather than an aspiration — an error budget (100% minus the SLO target) gives a team a concrete, agreed-upon amount of acceptable failure to spend on shipping features versus reliability work.',
    gotchas: [
      'An error budget policy only works if it has real teeth — a budget that gets overridden every time it\'s exhausted provides no actual behavioral incentive.',
      'Toil (manual, repetitive, automatable operational work) directly competes with an SRE team\'s capacity to improve reliability — time spent on toil is time not spent reducing future toil.',
    ],
  },

  // ── AWS: per-page entries ────────────────────────────────────────────────────
  'aws/fundamentals': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'IAM',   route: '/aws/iam' },
      { label: 'VPC',   route: '/aws/vpc' },
    ],
    tip: 'AWS regions and Availability Zones give two different levels of fault isolation — spreading resources across AZs within a region protects against a datacenter failure cheaply, while true regional-outage protection requires an actual multi-region architecture.',
    gotchas: [
      'Not every AWS service is available in every region — check availability before architecting around a specific service in a specific region.',
      'The Well-Architected Framework\'s five pillars (operational excellence, security, reliability, performance, cost) provide a structured way to review an architecture, not just a checklist to skim.',
    ],
  },
  'aws/iam': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'IAM Roles', route: '/aws/iam-roles' },
      { label: 'Security',  route: '/aws/security' },
    ],
    tip: 'IAM policies follow LEAST PRIVILEGE by design intent — scoping a policy to exactly the actions and resources actually needed is far easier to audit than starting broad ("*") and trying to narrow it down after the fact.',
    gotchas: [
      'An explicit Deny in ANY applicable policy always wins over an Allow, regardless of how many other policies grant access — a common source of "why can\'t this identity do X" confusion.',
      'S3 bucket policies and IAM policies are evaluated together for S3 access — both must allow the action, not just one.',
    ],
  },
  'aws/iam-roles': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'IAM',  route: '/aws/iam' },
      { label: 'EC2',  route: '/aws/ec2' },
    ],
    tip: 'An IAM role attached to an EC2 instance or Lambda function provides TEMPORARY, automatically-rotated credentials — eliminating the need to embed a long-lived access key in code or configuration, a major security improvement over static credentials.',
    gotchas: [
      'A role\'s trust policy (who CAN assume it) is separate from its permissions policy (what it CAN do once assumed) — misconfiguring either half breaks the intended access model differently.',
      'Cross-account role assumption requires both the trusting account\'s role trust policy AND the assuming principal\'s own permission to call sts:AssumeRole.',
    ],
  },
  'aws/vpc': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'Load Balancing', route: '/aws/load-balancing' },
      { label: 'Security',       route: '/aws/security' },
    ],
    tip: 'Security groups are STATEFUL (a return response to an allowed inbound request is automatically allowed back out) while NACLs are STATELESS (both directions must be explicitly allowed) — conflating the two models is a common source of "why is this connection being blocked" confusion.',
    gotchas: [
      'A public subnet is defined by having a route to an Internet Gateway — simply naming a subnet "public" does nothing without the actual route table entry.',
      'VPC peering is non-transitive — VPC A peered with B and B peered with C does NOT let A reach C through B.',
    ],
  },
  'aws/ec2': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'Load Balancing', route: '/aws/load-balancing' },
      { label: 'ECS & EKS',      route: '/aws/ecs-eks' },
    ],
    tip: 'An Auto Scaling Group with a Launch Template lets EC2 capacity scale based on demand rather than a fixed, manually-provisioned fleet — over-provisioning wastes money, under-provisioning risks an outage under real load spikes.',
    gotchas: [
      'Instance metadata (IMDSv2) should be enforced over IMDSv1 — the older version is more vulnerable to SSRF-based credential theft from a compromised application.',
      'Spot instances offer significant cost savings but can be reclaimed with only a short warning — appropriate for fault-tolerant, interruptible workloads, not stateful primary capacity.',
    ],
  },
  'aws/ecs-eks': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'EC2',    route: '/aws/ec2' },
      { label: 'Lambda', route: '/aws/lambda' },
    ],
    tip: 'ECS is AWS\'s own simpler, proprietary container orchestrator; EKS is managed Kubernetes — ECS has a gentler learning curve and tighter native AWS integration, while EKS gives portability and access to the broader Kubernetes ecosystem at the cost of more operational complexity.',
    gotchas: [
      'Fargate (usable with both ECS and EKS) removes node management entirely — you pay per task/pod resource usage instead of managing underlying EC2 instances.',
      'Choosing ECS over EKS is a real lock-in tradeoff — migrating away from ECS later requires re-platforming to Kubernetes manifests, unlike EKS which is already standard Kubernetes.',
    ],
  },
  'aws/lambda': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'API Gateway',     route: '/aws/api-gateway' },
      { label: 'Step Functions',  route: '/aws/step-functions' },
    ],
    tip: 'Lambda scales to zero when idle, meaning the first request after inactivity incurs a "cold start" — Provisioned Concurrency eliminates this at the cost of paying for warm capacity even when idle, a direct latency-vs-cost tradeoff.',
    gotchas: [
      'Cold start duration varies significantly by runtime and package size — a function with heavy dependencies has a meaningfully longer cold start than a lean one.',
      'Lambda\'s default execution timeout and memory settings often need explicit tuning for anything beyond a trivial function — memory allocation also proportionally affects CPU allocation.',
    ],
  },
  'aws/api-gateway': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'Lambda',        route: '/aws/lambda' },
      { label: 'Load Balancing', route: '/aws/load-balancing' },
    ],
    tip: 'API Gateway centralizes cross-cutting concerns (throttling, auth, request validation) in front of Lambda or other backends — avoiding the need to reimplement the same concerns in every individual function, at the cost of an added network hop and its own configuration surface.',
    gotchas: [
      'Request/response transformation (mapping templates) adds real complexity — keep transformations simple, or push complex logic into the Lambda function itself instead.',
      'Throttling limits are configured per API and per usage plan — a default limit too low for legitimate traffic silently causes 429s under normal load spikes.',
    ],
  },
  'aws/s3': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'Security',   route: '/aws/security' },
      { label: 'CloudFront', route: '/aws/route53-cloudfront' },
    ],
    tip: 'S3 offers 11 nines of durability through automatic replication across multiple facilities within a region — but durability is NOT the same as availability or protection against accidental deletion; versioning and MFA-delete address the latter, which durability alone doesn\'t cover.',
    gotchas: [
      'A publicly-writable or publicly-readable S3 bucket from a misconfigured bucket policy is one of the most common, high-profile cloud security misconfigurations found by researchers.',
      'S3 event notifications (triggering Lambda on object creation) are eventually consistent and can occasionally deliver duplicate events — consumers should be idempotent.',
    ],
  },
  'aws/dynamodb': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'RDS/Aurora', route: '/aws/rds-aurora' },
    ],
    tip: 'DynamoDB\'s partition key choice is a largely IRREVERSIBLE design decision — a poorly chosen key creates hot partitions that throttle throughput regardless of provisioned capacity, the same fundamental problem as a poor shard key in any distributed database.',
    gotchas: [
      'DynamoDB has no native JOIN — data modeling relies on denormalization and single-table design patterns unfamiliar to developers coming from relational databases.',
      'On-demand capacity mode avoids manual capacity planning but costs more per request than well-tuned provisioned capacity at steady, predictable load.',
    ],
  },
  'aws/rds-aurora': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'DynamoDB', route: '/aws/dynamodb' },
    ],
    tip: 'Aurora separates compute from a distributed, self-healing storage layer shared across replicas — this architecture is why Aurora Replicas can be added with near-zero replication lag compared to traditional RDS read replica setups using standard binlog-based replication.',
    gotchas: [
      'Aurora Serverless v2 scales capacity based on load automatically, but cold-scaling from zero (if configured) still incurs a real startup delay for the first connection.',
      'Multi-AZ RDS provides failover for availability, not read scaling — a separate read replica is needed specifically to offload read traffic.',
    ],
  },
  'aws/sqs-sns': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'EventBridge', route: '/aws/eventbridge' },
    ],
    tip: 'SQS delivers to exactly ONE consumer per message (point-to-point queue); SNS fans out to EVERY subscriber (pub/sub) — combining SNS fanning out to multiple SQS queues is the classic pattern for reliable, durable multi-consumer delivery.',
    gotchas: [
      'SQS visibility timeout hides a message during processing — expiring before deletion causes redelivery, meaning consumers must be idempotent regardless of standard vs FIFO queue choice.',
      'FIFO queues guarantee order and exactly-once (within a dedup window) at a real throughput cost compared to standard queues.',
    ],
  },
  'aws/eventbridge': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'SQS & SNS', route: '/aws/sqs-sns' },
    ],
    tip: 'EventBridge routes based on content-matching rules BEFORE delivery, unlike SNS which fans out unconditionally — making EventBridge the better fit for complex, multi-source event routing, including native support for scheduling and third-party SaaS integrations.',
    gotchas: [
      'A poorly-scoped event pattern can silently miss events it was intended to match — testing rule patterns against real sample events catches this before production.',
      'EventBridge adds rule-evaluation routing overhead compared to SNS\'s simpler unconditional fan-out, usually negligible but worth knowing.',
    ],
  },
  'aws/step-functions': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'Lambda', route: '/aws/lambda' },
    ],
    tip: 'Step Functions provide visual, stateful orchestration of multi-step workflows (including retries, error handling, and parallel branches) — replacing what would otherwise be custom orchestration logic hand-written and hidden inside a single Lambda function.',
    gotchas: [
      'Standard workflows bill per state transition and can run up to a year; Express workflows are cheaper for high-volume, short-duration workloads but have a 5-minute max duration.',
      'Step Functions state machines are defined in Amazon States Language (JSON) — a real learning curve distinct from writing plain application code.',
    ],
  },
  'aws/load-balancing': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'EC2',  route: '/aws/ec2' },
      { label: 'VPC',  route: '/aws/vpc' },
    ],
    tip: 'An Application Load Balancer operates at Layer 7 (HTTP-aware routing by path/host, SSL termination); a Network Load Balancer operates at Layer 4 (ultra-low latency, protocol-agnostic) — choosing the wrong one either loses needed HTTP routing capability or pays unnecessary Layer-7 overhead.',
    gotchas: [
      'Health check configuration (path, interval, thresholds) directly determines how quickly an unhealthy target is removed from rotation — too lenient delays failure detection, too strict causes false-positive removal.',
      'Cross-zone load balancing (whether traffic is distributed evenly across ALL AZ targets or only within the receiving AZ) affects both cost and traffic distribution evenness.',
    ],
  },
  'aws/route53-cloudfront': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'S3',              route: '/aws/s3' },
      { label: 'Load Balancing',  route: '/aws/load-balancing' },
    ],
    tip: 'CloudFront (CDN) caches content at edge locations close to users, reducing both latency AND load on the origin — but cache invalidation must be deliberate; a stale cached response served past its intended freshness is a common, easy-to-overlook CDN gotcha.',
    gotchas: [
      'Route 53 health checks combined with failover routing enable automatic DNS-level failover, but DNS TTL means clients may still cache the old resolution briefly during a cutover.',
      'CloudFront origin access control (restricting direct access to an S3 origin bucket, forcing traffic through CloudFront) prevents bypassing the CDN\'s caching and security layer entirely.',
    ],
  },
  'aws/cloudwatch': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'Cost Optimization', route: '/aws/cost-optimization' },
    ],
    tip: 'CloudWatch metrics are collected at a default 5-minute resolution unless "detailed monitoring" (1-minute) is explicitly enabled — a critical alert relying on default-resolution metrics can take several minutes longer to trigger than expected.',
    gotchas: [
      'CloudWatch Logs Insights lets you query log data without shipping it to a separate system, but at scale, cost and query performance still need to be considered.',
      'Alarms based on a single data point are prone to false positives from transient spikes — evaluating over multiple consecutive periods reduces noisy, self-resolving alerts.',
    ],
  },
  'aws/cloudformation-cdk': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'Fundamentals', route: '/aws/fundamentals' },
    ],
    tip: 'CDK compiles down to CloudFormation templates — every CDK construct has an underlying CloudFormation equivalent, meaning CDK gains no new deployment capability beyond CloudFormation itself, only a more expressive, type-safe authoring experience in a real programming language.',
    gotchas: [
      'A CloudFormation stack update that requires REPLACING a resource (not just modifying it) can cause unexpected downtime or data loss if the resource holds state — always review the change set before applying.',
      'CDK\'s higher-level constructs bundle sensible defaults, but understanding the underlying CloudFormation resources they generate matters for genuinely custom requirements.',
    ],
  },
  'aws/cost-optimization': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'CloudWatch', route: '/aws/cloudwatch' },
      { label: 'EC2',        route: '/aws/ec2' },
    ],
    tip: 'Consistent resource tagging (team, project, environment) is what makes Cost Explorer actually useful for chargeback reporting — without tags, costs can only be broken down by service type, not the organizational dimensions that actually matter for accountability.',
    gotchas: [
      'Reserved Instances and Savings Plans require upfront commitment for a discount — appropriate for steady-state baseline capacity, not for genuinely variable or short-lived workloads.',
      'Orphaned resources (unattached EBS volumes, idle load balancers) are a common, easy-to-overlook source of ongoing unnecessary cost that periodic review catches.',
    ],
  },
  'aws/security': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'IAM',   route: '/aws/iam' },
      { label: 'VPC',   route: '/aws/vpc' },
    ],
    tip: 'The AWS Shared Responsibility Model splits security "OF the cloud" (AWS\'s job — physical security, hypervisor) from security "IN the cloud" (your job — IAM policies, data encryption, network configuration) — misunderstanding this boundary is a common root cause of AWS security incidents.',
    gotchas: [
      'GuardDuty and Security Hub provide continuous threat detection and compliance posture scoring, but only surface what they\'re configured to monitor — they don\'t replace deliberate security architecture.',
      'AWS Config tracks resource configuration changes over time, essential for auditing "when did this security group rule actually change" after an incident.',
    ],
  },
  'aws/ebs-efs': {
    apis: AWS_DEFAULT.apis, docs: AWS_DEFAULT.docs, resources: AWS_DEFAULT.resources,
    related: [
      { label: 'EC2', route: '/aws/ec2' },
    ],
    tip: 'EBS volumes are tied to a SINGLE Availability Zone and can only attach to instances within that same AZ — EFS provides a network file system accessible concurrently from multiple instances across AZs, a fundamentally different sharing model for a fundamentally different use case.',
    gotchas: [
      'An EBS volume\'s performance (IOPS, throughput) depends on the volume TYPE chosen (gp3, io2, etc.) — the wrong type for a workload\'s actual I/O pattern silently bottlenecks application performance.',
      'EFS is generally more expensive per GB than EBS — appropriate specifically when genuine multi-instance concurrent file access is needed, not as a default storage choice.',
    ],
  },

  // ── Linux: per-page entries ──────────────────────────────────────────────────
  'linux/fundamentals': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Essential Commands', route: '/linux/essential-commands' },
      { label: 'File System',        route: '/linux/file-system' },
    ],
    tip: '"Everything is a file" in Linux — devices, processes, sockets, and directories are all represented through the same filesystem interface, which is why so many Linux tools operate uniformly on paths regardless of what they actually represent underneath.',
    gotchas: [
      'The Filesystem Hierarchy Standard (/etc, /var, /usr) has specific conventions per directory — placing files outside these conventions confuses tooling and other administrators.',
      'Case sensitivity in Linux paths (unlike Windows) means File.txt and file.txt are different files — a common cross-platform gotcha.',
    ],
  },
  'linux/essential-commands': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Fundamentals',      route: '/linux/fundamentals' },
      { label: 'Bash Scripting',    route: '/linux/bash-scripting' },
    ],
    tip: 'Piping commands together (ls | grep | sort) composes small, single-purpose tools into a larger pipeline — this Unix philosophy of composable tools is why learning individual commands well pays off far beyond any single use case.',
    gotchas: [
      'rm has no trash/recycle bin by default — rm -rf on the wrong path is irreversible, especially dangerous in a script with a variable that could unexpectedly be empty.',
      'Command exit codes (0 = success, non-zero = failure) are what && and || chain on — a command that "looks like" it worked but returns non-zero breaks conditional chaining.',
    ],
  },
  'linux/file-system': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Fundamentals',       route: '/linux/fundamentals' },
      { label: 'Disk & Storage',     route: '/linux/disk-storage' },
    ],
    tip: 'A hard link and a symbolic link behave very differently — deleting the ORIGINAL file a hard link points to leaves the hard link fully functional (it points to the same inode), while a symlink pointing to a deleted file becomes a dangling, broken reference.',
    gotchas: [
      'Hard links cannot span filesystems/partitions and cannot point to directories — symlinks have neither restriction.',
      'Inodes (not filenames) are the actual filesystem-level identity of a file — a file can have multiple names (hard links) pointing to one inode.',
    ],
  },
  'linux/file-permissions': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Users & Groups', route: '/linux/users-groups' },
      { label: 'Security Hardening', route: '/linux/security-hardening' },
    ],
    tip: 'chmod 777 is almost never the right answer — it grants read/write/execute to owner, group, AND everyone else, including any other user or process on the system; grant the narrowest permission that actually works for the use case.',
    gotchas: [
      'The setuid bit lets a program run with the FILE OWNER\'s privileges rather than the invoking user\'s — a powerful and dangerous mechanism if misapplied to an untrusted binary.',
      'Directory execute permission (not just read) is required to actually access files WITHIN that directory, a common confusion for people new to the permission model.',
    ],
  },
  'linux/users-groups': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'File Permissions',    route: '/linux/file-permissions' },
      { label: 'Security Hardening',  route: '/linux/security-hardening' },
    ],
    tip: 'sudo grants TEMPORARY elevated privilege for a specific command, logged and auditable — running as root permanently (or disabling sudo password prompts broadly) removes both the audit trail and the friction that catches accidental destructive commands.',
    gotchas: [
      'A user\'s PRIMARY group (in /etc/passwd) differs from any SECONDARY groups they belong to (in /etc/group) — permission checks consider both.',
      'UID 0 is always root, regardless of the username assigned to it — renaming the root account doesn\'t change its actual privilege level.',
    ],
  },
  'linux/process-management': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'System Monitoring', route: '/linux/system-monitoring' },
      { label: 'Systemd',           route: '/linux/systemd' },
    ],
    tip: 'SIGTERM (kill -15, the default) asks a process to terminate gracefully, giving it a chance to clean up; SIGKILL (kill -9) terminates it immediately with NO chance to clean up — reaching for -9 first, without trying SIGTERM, risks corrupted state or leaked resources.',
    gotchas: [
      'A background process started in an interactive shell dies when that shell session ends unless launched with nohup, disown, or run as a proper service.',
      'Zombie processes (a terminated child whose exit status hasn\'t been reaped by its parent) accumulate PIDs but consume no real resources beyond a process table entry.',
    ],
  },
  'linux/system-monitoring': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Process Management',   route: '/linux/process-management' },
      { label: 'Performance Tuning',   route: '/linux/performance-tuning' },
    ],
    tip: 'top/htop show a live snapshot, but load average (a 1/5/15-minute rolling number) tells a different story — a high load average with low CPU usage often means processes are blocked on I/O, not CPU-bound at all.',
    gotchas: [
      'A load average of 4 means something different on a 2-core machine (heavily overloaded) versus a 16-core machine (barely utilized) — always interpret it relative to CPU core count.',
      'Memory reported as "used" by free often includes disk cache, which the kernel will happily reclaim under pressure — it is not the same as memory unavailable to applications.',
    ],
  },
  'linux/performance-tuning': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'System Monitoring', route: '/linux/system-monitoring' },
    ],
    tip: 'Profiling BEFORE tuning avoids wasted effort — intuition about "what\'s slow" on a Linux system is frequently wrong; tools like strace, perf, and iostat reveal actual bottlenecks rather than guessed ones.',
    gotchas: [
      'ulimit settings (max open files, max processes) that are too low for a workload cause mysterious "too many open files" errors under load that never appear in light testing.',
      'Swap being used doesn\'t automatically mean a problem — a small amount of swapped-out, rarely-accessed memory can be entirely healthy; heavy, ongoing swap activity (thrashing) is the actual red flag.',
    ],
  },
  'linux/disk-storage': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'File System', route: '/linux/file-system' },
    ],
    tip: 'df shows disk space at the FILESYSTEM level; du shows it at the FILE/DIRECTORY level — a full filesystem despite du showing little used space usually means deleted-but-still-open files (a process still holding a file descriptor to a "deleted" file).',
    gotchas: [
      'LVM (Logical Volume Manager) adds a flexible abstraction layer over physical disks, enabling resizing volumes without the rigid constraints of raw partitions — but adds a layer of indirection to reason about during recovery.',
      'inode exhaustion (running out of inodes despite having free disk SPACE) is a distinct failure mode from running out of actual bytes — df -i checks this separately from df.',
    ],
  },
  'linux/networking': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Firewall', route: '/linux/firewall' },
      { label: 'SSH',      route: '/linux/ssh' },
    ],
    tip: 'ss (the modern replacement for netstat) shows exactly which process is listening on which port — essential for diagnosing "why can\'t I connect" or "what is actually using this port" without guessing.',
    gotchas: [
      'A service binding to 127.0.0.1 is only reachable locally, while binding to 0.0.0.0 exposes it on every network interface — a common source of "why can\'t I reach this from another machine" or, worse, unintended public exposure.',
      'DNS resolution order (files, then DNS, or vice versa) is controlled by /etc/nsswitch.conf — a misconfigured order causes confusing, inconsistent name resolution behavior.',
    ],
  },
  'linux/firewall': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Networking',           route: '/linux/networking' },
      { label: 'Security Hardening',   route: '/linux/security-hardening' },
    ],
    tip: 'iptables/nftables rules are evaluated in ORDER, and the first matching rule typically wins — placing a broad ALLOW rule before a more specific intended DENY silently defeats the deny, a very common firewall misconfiguration.',
    gotchas: [
      'A default-deny policy (block everything, then explicitly allow needed traffic) is significantly more secure than default-allow with denial rules bolted on afterward.',
      'ufw (Uncomplicated Firewall) is a friendlier frontend over iptables/nftables — rules configured through one tool may not be visible or obvious when inspecting through the other.',
    ],
  },
  'linux/ssh': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Networking',          route: '/linux/networking' },
      { label: 'Security Hardening',  route: '/linux/security-hardening' },
    ],
    tip: 'Public-key authentication is meaningfully more secure than password authentication for SSH — disabling password auth entirely (PasswordAuthentication no) closes off the entire category of brute-force password-guessing attacks against the SSH port.',
    gotchas: [
      'A private key with overly permissive file permissions (world-readable) is REJECTED by ssh itself as a security precaution — chmod 600 is required.',
      'SSH agent forwarding, while convenient, exposes your local key to whatever you SSH into next — a real risk if that intermediate host is compromised.',
    ],
  },
  'linux/systemd': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Process Management', route: '/linux/process-management' },
      { label: 'Log Analysis',       route: '/linux/log-analysis' },
    ],
    tip: 'A systemd unit file\'s Restart= directive controls automatic restart behavior on failure — without it, a crashed service simply stays down until manually restarted, which is rarely the desired production behavior for a long-running daemon.',
    gotchas: [
      'systemctl daemon-reload is required after editing a unit file — forgetting it means systemd keeps using the OLD in-memory configuration despite the file on disk being updated.',
      'Unit dependency ordering (After=, Requires=) does not automatically mean a dependency is fully READY, only that it has started — a service depending on a database should still handle a not-yet-accepting-connections database gracefully.',
    ],
  },
  'linux/log-analysis': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Systemd', route: '/linux/systemd' },
    ],
    tip: 'journalctl -u <service> -f follows a specific service\'s logs live — far more targeted than tailing a shared syslog file where a busy system\'s log volume from unrelated services buries the signal you actually need.',
    gotchas: [
      'journald logs are binary and rotated based on configurable size/time limits — logs can be lost if retention is shorter than the window needed to investigate a delayed-discovery incident.',
      'grep/awk/sed pipelines remain powerful for ad-hoc log analysis, but a centralized log aggregator becomes necessary once logs span more than a handful of hosts.',
    ],
  },
  'linux/security-hardening': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'SSH',                route: '/linux/ssh' },
      { label: 'Firewall',           route: '/linux/firewall' },
      { label: 'File Permissions',   route: '/linux/file-permissions' },
    ],
    tip: 'Reducing attack surface (disabling unused services, closing unneeded ports, removing unnecessary packages) is a foundational hardening step that pays off regardless of what specific vulnerabilities are later discovered — fewer running things means fewer things that can be exploited.',
    gotchas: [
      'SELinux/AppArmor provide mandatory access control beyond standard Unix permissions — disabling them entirely (rather than fixing a specific policy denial) removes a real defense-in-depth layer.',
      'Automatic security updates reduce the window of exposure to known CVEs, but should be tested in non-production first for anything beyond a small, low-risk system.',
    ],
  },
  'linux/package-management': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Systemd', route: '/linux/systemd' },
    ],
    tip: 'apt/yum/dnf resolve DEPENDENCY graphs automatically — manually installing a .deb/.rpm without its dependencies satisfied leaves a broken, half-installed package that the package manager itself can\'t easily repair without the proper commands.',
    gotchas: [
      'Mixing package managers (installing the same software via apt AND manually via a downloaded binary) creates version confusion about which one is actually active.',
      'A pinned/held package version prevents accidental upgrades but also prevents automatic security patches for that specific package — a deliberate tradeoff, not a default.',
    ],
  },
  'linux/environment-variables': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Bash Scripting', route: '/linux/bash-scripting' },
    ],
    tip: 'export makes a variable available to CHILD PROCESSES, not just the current shell — a variable set without export is only visible in the current shell session, a very common source of "why doesn\'t my script see this variable" confusion.',
    gotchas: [
      'PATH order matters — a malicious or unexpected binary earlier in PATH than the intended one silently gets executed instead when a bare command name is run.',
      'Environment variables set in one shell session do not persist to a new session unless added to a shell startup file (.bashrc, .profile).',
    ],
  },
  'linux/bash-scripting': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Environment Variables', route: '/linux/environment-variables' },
      { label: 'Bash Advanced',          route: '/linux/bash-advanced' },
    ],
    tip: 'set -euo pipefail at the top of a script is a common, high-value defensive default — it stops execution on the first error (-e), treats unset variables as errors (-u), and catches failures anywhere in a pipeline (-o pipefail), instead of silently continuing after a failure.',
    gotchas: [
      'Unquoted variable expansion ($VAR instead of "$VAR") breaks on filenames containing spaces — a classic, very common scripting bug.',
      'A shebang line (#!/bin/bash) determines which interpreter runs the script — a missing or wrong shebang causes confusing "command not found" or unexpected syntax errors.',
    ],
  },
  'linux/bash-advanced': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Bash Scripting', route: '/linux/bash-scripting' },
    ],
    tip: 'Process substitution (<(command)) lets a command\'s output be treated as a file for another command that expects a file path — a powerful technique for avoiding temporary files in more complex pipelines.',
    gotchas: [
      'Arrays in bash have subtly different syntax for expansion ("${arr[@]}" vs "${arr[*]}") that changes word-splitting behavior — a common source of "why did this only process one element" bugs.',
      'trap lets a script run cleanup code on exit (or specific signals) — essential for scripts that create temporary resources needing guaranteed cleanup even on failure.',
    ],
  },
  'linux/cron': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Systemd',        route: '/linux/systemd' },
      { label: 'Bash Scripting', route: '/linux/bash-scripting' },
    ],
    tip: 'A cron job runs with a MINIMAL environment (no interactive shell PATH, no user-specific env vars) — a script that works fine run manually can fail mysteriously under cron specifically because of this environment difference, a very common gotcha.',
    gotchas: [
      'Cron job output isn\'t displayed anywhere by default — redirecting output to a log file (or mailing it) is necessary to actually see failures, or they go unnoticed indefinitely.',
      'systemd timers are a modern alternative to cron with better logging integration (via journald) and more expressive scheduling — worth considering for new scheduled tasks.',
    ],
  },
  'linux/vim': {
    apis: LINUX_DEFAULT.apis, docs: LINUX_DEFAULT.docs, resources: LINUX_DEFAULT.resources,
    related: [
      { label: 'Essential Commands', route: '/linux/essential-commands' },
    ],
    tip: 'Vim\'s modal editing (separate Normal, Insert, Visual modes) is what enables its efficient keyboard-only editing — the same key means different things in different modes, which is the initial learning-curve hurdle but also the source of its long-term efficiency once internalized.',
    gotchas: [
      'Editing a file with sudo requires either sudo vim directly or the :w !sudo tee % trick — opening as a normal user then trying to save a root-owned file fails otherwise.',
      ':wq vs :q! — accidentally discarding intended changes (or the reverse, saving unintended ones) is a very common beginner mistake before muscle memory develops.',
    ],
  },

  // ── Terraform: per-page entries ─────────────────────────────────────────────
  'terraform/fundamentals': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'Resources',   route: '/terraform/resources' },
      { label: 'Providers',   route: '/terraform/providers' },
    ],
    tip: 'Terraform\'s DECLARATIVE model means you describe the desired end state, not the steps to get there — Terraform itself computes the diff between current and desired state and figures out the necessary create/update/destroy operations.',
    gotchas: [
      'terraform plan should ALWAYS be reviewed before apply, especially in shared environments — an unexpected "destroy" in the plan output is the most common way teams lose infrastructure.',
      'Terraform is idempotent by design — running apply repeatedly with no config changes should produce no changes, not repeated resource recreation.',
    ],
  },
  'terraform/resources': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'Fundamentals', route: '/terraform/fundamentals' },
      { label: 'Data Sources', route: '/terraform/data-sources' },
    ],
    tip: 'A resource block is Terraform\'s core building unit describing something it MANAGES and can create/modify/destroy — a data source (a related but distinct concept) instead READS existing information without managing its lifecycle.',
    gotchas: [
      'Changing certain resource arguments forces REPLACEMENT (destroy then recreate) rather than an in-place update — always check whether an argument change will trigger this before applying in production.',
      'Resource dependencies can be inferred automatically from references, or declared explicitly via depends_on when the relationship isn\'t visible through a direct attribute reference.',
    ],
  },
  'terraform/data-sources': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'Resources', route: '/terraform/resources' },
    ],
    tip: 'A data source reads information about infrastructure NOT managed by the current Terraform configuration (an existing VPC, an AMI lookup) — Terraform re-reads it on every plan/apply, meaning its value can change between runs if the underlying external resource changes.',
    gotchas: [
      'A data source failing to find a match (like an AMI filter matching zero results) causes an error at plan time, not a silently empty result.',
      'Overusing data sources to reference resources that COULD be managed directly by Terraform (instead of importing them) creates unnecessary cross-configuration coupling.',
    ],
  },
  'terraform/variables': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'Outputs',       route: '/terraform/outputs' },
      { label: 'Expressions',   route: '/terraform/expressions' },
    ],
    tip: 'Variable validation blocks catch invalid input at PLAN time with a clear error message — without them, an invalid value silently propagates into resource configuration and only surfaces as a confusing provider-level error much later during apply.',
    gotchas: [
      'Sensitive variables (marked sensitive = true) are redacted from plan/apply CLI output, but still exist in plaintext in the state file unless additional encryption is configured.',
      'A variable with no default and no value supplied prompts interactively during apply — fine for local development, a blocking problem for unattended CI/CD pipelines.',
    ],
  },
  'terraform/outputs': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'Variables', route: '/terraform/variables' },
      { label: 'Modules',   route: '/terraform/modules' },
    ],
    tip: 'Outputs are how a Terraform configuration exposes values to the OPERATOR (via terraform output) and to OTHER configurations (via remote state data sources or module outputs) — without them, values computed inside a module are entirely invisible from outside it.',
    gotchas: [
      'Marking an output sensitive = true hides it from standard CLI output, but the value is still retrievable via terraform output -json or by reading the state file directly.',
      'Module outputs must be explicitly re-exposed by the calling configuration if the ROOT module itself needs to surface them further.',
    ],
  },
  'terraform/expressions': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'Functions',  route: '/terraform/functions' },
      { label: 'Variables',  route: '/terraform/variables' },
    ],
    tip: 'for_each creates one resource instance PER KEY in a map/set, tracked by that key — count creates instances tracked by NUMERIC INDEX; removing an item from the middle of a count-based list shifts every subsequent index, causing Terraform to destroy and recreate resources unnecessarily, which for_each avoids.',
    gotchas: [
      'Dynamic blocks generate repeated nested configuration blocks from a collection — genuinely useful for optional or variable-count nested blocks, but can hurt readability if overused for simple cases.',
      'Conditional expressions (cond ? true_val : false_val) are common for toggling resource configuration based on a variable, but deeply nested conditionals hurt readability fast.',
    ],
  },
  'terraform/functions': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'Expressions', route: '/terraform/expressions' },
    ],
    tip: 'Terraform\'s built-in functions (unlike most languages) cannot be user-defined — the built-in library (string manipulation, collection operations, type conversion) is fixed, and any logic beyond it must be composed from existing functions or handled outside Terraform entirely.',
    gotchas: [
      'The console command (terraform console) lets you test expressions and function calls interactively without needing a full plan/apply cycle — a fast way to verify function behavior.',
      'Some functions (like timestamp()) return a different value on every evaluation, which can cause unexpected "changes" reported on every plan if used in a resource argument.',
    ],
  },
  'terraform/state': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'Remote Backends', route: '/terraform/remote-backends' },
      { label: 'Drift',           route: '/terraform/drift' },
    ],
    tip: 'Terraform state is the SOURCE OF TRUTH mapping configuration to real infrastructure — losing it means Terraform no longer knows what it manages, and manually editing state directly (rather than through terraform state commands) risks corrupting that mapping.',
    gotchas: [
      'State can contain sensitive values in PLAINTEXT (like a generated database password) — state files need the same access control rigor as secrets themselves.',
      'terraform state mv is the correct way to rename/move a resource in configuration without Terraform destroying and recreating the underlying real infrastructure.',
    ],
  },
  'terraform/remote-backends': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'State',       route: '/terraform/state' },
      { label: 'Workspaces',  route: '/terraform/workspaces' },
    ],
    tip: 'A remote backend (S3+DynamoDB, Terraform Cloud) stores state centrally and enables LOCKING — without locking, two team members running apply simultaneously can corrupt the state file, since local state files have no built-in concurrency protection.',
    gotchas: [
      'Remote state without locking (missing the DynamoDB table or equivalent) risks concurrent applies corrupting state — always enable locking for any shared/team state.',
      'Backend configuration itself cannot use variables — it must be static or use partial configuration with a separate backend config file.',
    ],
  },
  'terraform/workspaces': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'Remote Backends', route: '/terraform/remote-backends' },
    ],
    tip: 'Terraform workspaces provide separate STATE FILES for the same configuration (useful for dev/staging/prod with identical resource definitions) — but they share the SAME backend and configuration code, unlike fully separate directories/configurations per environment.',
    gotchas: [
      'Workspaces are not a substitute for genuinely different configurations — if dev and prod need meaningfully different resource definitions (not just different variable values), separate configurations are more appropriate than workspaces.',
      'terraform.workspace can be referenced in configuration to vary behavior per workspace, but overusing it for complex per-environment logic makes configuration harder to follow.',
    ],
  },
  'terraform/modules': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'Module Patterns', route: '/terraform/module-patterns' },
    ],
    tip: 'A module is a reusable, parametrized collection of resources — the SAME module can be instantiated multiple times with different inputs, avoiding copy-pasted resource blocks across environments or similar infrastructure components.',
    gotchas: [
      'A module\'s internal resource addresses become PREFIXED by the module call name in state — renaming a module call in configuration causes Terraform to see it as an entirely different set of resources unless state is explicitly moved.',
      'Deeply nested module hierarchies (modules calling modules calling modules) can make understanding the actual resulting infrastructure harder to trace.',
    ],
  },
  'terraform/module-patterns': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'Modules',   route: '/terraform/modules' },
      { label: 'Providers', route: '/terraform/providers' },
    ],
    tip: 'A well-designed module exposes a MINIMAL, intentional interface (specific variables and outputs) rather than passing through every possible underlying resource argument — an overly permissive module interface makes the module harder to reason about and easier to misuse.',
    gotchas: [
      'Versioning modules (via a git tag or registry version) lets consumers pin to a known-good version, avoiding a breaking module change silently affecting every configuration using it at once.',
      'Composing several small, focused modules is generally more maintainable than one large, all-purpose module trying to handle every possible use case.',
    ],
  },
  'terraform/providers': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'Resources',  route: '/terraform/resources' },
    ],
    tip: 'A provider is a plugin that translates Terraform\'s resource blocks into actual API calls against a specific platform (AWS, Azure, Kubernetes) — Terraform\'s core engine knows nothing about any specific cloud; all platform-specific logic lives in providers.',
    gotchas: [
      'Provider version constraints should be pinned (not left unbounded) — an unpinned provider can silently introduce breaking changes on the next apply after a new provider version is released.',
      'Multiple provider configurations (aliases) let a single configuration manage resources across multiple regions or accounts within one apply.',
    ],
  },
  'terraform/provisioners': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'Resources', route: '/terraform/resources' },
    ],
    tip: 'Provisioners (remote-exec, local-exec) are explicitly a LAST RESORT per Terraform\'s own documentation — they run imperative scripts outside Terraform\'s declarative model, breaking the guarantee that terraform plan accurately predicts what will happen.',
    gotchas: [
      'A failed provisioner during resource creation, by default, marks the ENTIRE resource as tainted, forcing recreation on the next apply — a real operational cost for a flaky provisioner script.',
      'Configuration management tools (Ansible, cloud-init) or baked-in machine images are generally preferred over provisioners for actual instance configuration.',
    ],
  },
  'terraform/import': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'State',   route: '/terraform/state' },
      { label: 'Drift',   route: '/terraform/drift' },
    ],
    tip: 'terraform import brings EXISTING, manually-created infrastructure under Terraform management — but it only imports the resource into STATE; the corresponding resource BLOCK in configuration must be written manually to match, or the next plan shows a confusing diff.',
    gotchas: [
      'Import is a one-time bridging operation for adopting Terraform on pre-existing infrastructure — it does not generate the configuration code automatically (in older Terraform versions), only the state entry.',
      'Terraform 1.5+\'s import blocks (declarative, in-configuration import) improve on the imperative import CLI command by making the import itself reviewable in a plan.',
    ],
  },
  'terraform/drift': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'State',   route: '/terraform/state' },
      { label: 'Import',  route: '/terraform/import' },
    ],
    tip: 'Configuration drift happens when real infrastructure is changed OUTSIDE Terraform (a manual console click, an emergency fix) — the next plan detects the difference between actual and expected state, but resolving it requires a deliberate decision: update config to match reality, or let Terraform revert the manual change.',
    gotchas: [
      'terraform plan -refresh-only surfaces drift without proposing any changes, useful for detecting drift before deciding how to reconcile it.',
      'Manual "emergency fixes" that bypass Terraform are a common, recurring source of ongoing drift — the emergency fix should be backported into configuration promptly, not left as a permanent exception.',
    ],
  },
  'terraform/testing': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'CI/CD', route: '/terraform/cicd' },
    ],
    tip: 'Terraform\'s native test framework (.tftest.hcl files) can assert on plan output WITHOUT actually applying real infrastructure — catching logic errors in a module before it ever provisions anything, at the cost of not verifying actual provider-level behavior.',
    gotchas: [
      'Testing modules that manage genuinely stateful resources often still needs an actual apply-and-destroy cycle against a real (throwaway) environment for full confidence.',
      'Static analysis tools (tflint, checkov) catch style and security-policy issues before a plan even runs, complementing (not replacing) plan-based testing.',
    ],
  },
  'terraform/security': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'State', route: '/terraform/state' },
    ],
    tip: 'A secret hardcoded directly in a .tf file is committed to git history forever, even after being "removed" in a later commit — secrets should come from a secrets manager or environment variables, never a literal value in configuration.',
    gotchas: [
      'State files can contain plaintext sensitive values even when the corresponding variable is marked sensitive — state access itself needs the same rigor as protecting secrets directly.',
      'checkov/tfsec-style static analysis catches common misconfigurations (an S3 bucket without encryption, an overly permissive security group) before they are ever applied.',
    ],
  },
  'terraform/cicd': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'Testing',  route: '/terraform/testing' },
      { label: 'Security', route: '/terraform/security' },
    ],
    tip: 'A CI/CD pipeline running terraform plan on every pull request (posting the plan as a PR comment) lets reviewers see EXACTLY what infrastructure change is proposed before it merges — a critical review step that catching an unexpected destroy only in local terminal output would miss.',
    gotchas: [
      'apply should typically require a separate, explicit approval step (not auto-apply on merge) for anything touching production infrastructure, given how consequential an unreviewed apply can be.',
      'CI runners need the same remote state locking guarantees as local runs — concurrent pipeline runs against the same state without locking risk the same corruption as concurrent local applies.',
    ],
  },
  'terraform/refactoring': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'State',   route: '/terraform/state' },
      { label: 'Modules', route: '/terraform/modules' },
    ],
    tip: 'moved blocks (Terraform 1.1+) let you declaratively record that a resource was renamed or moved between modules — WITHOUT Terraform destroying and recreating the underlying real infrastructure, replacing the older, more error-prone manual terraform state mv workflow.',
    gotchas: [
      'Refactoring configuration WITHOUT a corresponding moved block (or manual state mv) causes Terraform to see the old resource address as deleted and the new one as newly created — a destroy-and-recreate that may be entirely unintended.',
      'Refactoring a widely-used shared module requires coordinating with every consumer, since a breaking interface change affects all of them simultaneously.',
    ],
  },
  'terraform/opentofu': {
    apis: TERRAFORM_DEFAULT.apis, docs: TERRAFORM_DEFAULT.docs, resources: TERRAFORM_DEFAULT.resources,
    related: [
      { label: 'Fundamentals', route: '/terraform/fundamentals' },
    ],
    tip: 'OpenTofu is a community-driven, open-source fork of Terraform created after HashiCorp changed Terraform\'s license away from MPL — it maintains compatibility with existing Terraform configurations and providers while remaining under a truly open-source license.',
    gotchas: [
      'OpenTofu and Terraform have begun to diverge in newer features over time — a configuration relying on a Terraform-only feature added after the fork may not work identically in OpenTofu.',
      'Most existing modules and providers work with both tools due to their shared HCL-based configuration language and provider protocol compatibility, but this compatibility isn\'t an absolute guarantee going forward.',
    ],
  },

  // ── Service Mesh: per-page entries ──────────────────────────────────────────
  'service-mesh/fundamentals': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Envoy',              route: '/service-mesh/envoy' },
      { label: 'Istio Architecture', route: '/service-mesh/istio-architecture' },
    ],
    tip: 'A service mesh moves cross-cutting communication concerns (retries, mTLS, observability) out of application code and into infrastructure via sidecar proxies — this is genuinely valuable at microservices scale, but adds real per-pod resource overhead that should be measured before assuming the mesh is "free."',
    gotchas: [
      'The mesh\'s data plane (proxies handling actual traffic) and control plane (configuring those proxies) are distinct — a control plane outage doesn\'t immediately break already-configured traffic routing.',
      'Adopting a service mesh for a small number of services often adds more operational complexity than the cross-cutting benefits justify.',
    ],
  },
  'service-mesh/envoy': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Fundamentals',      route: '/service-mesh/fundamentals' },
      { label: 'Istio Architecture', route: '/service-mesh/istio-architecture' },
    ],
    tip: 'Envoy is the underlying proxy that most modern service meshes (Istio, Consul) build on top of — understanding Envoy\'s own configuration model (listeners, clusters, routes) makes it much easier to reason about what a higher-level mesh abstraction like Istio\'s VirtualService is actually generating underneath.',
    gotchas: [
      'Envoy\'s xDS APIs (how the control plane pushes configuration to proxies dynamically) are what enable configuration changes without restarting proxies — a key operational advantage over static config reloads.',
      'A misconfigured Envoy filter chain can silently drop or mis-route traffic — Envoy\'s admin interface (/config_dump) is essential for debugging what configuration is actually active.',
    ],
  },
  'service-mesh/istio-architecture': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Istio Install',   route: '/service-mesh/istio-install' },
      { label: 'Envoy',           route: '/service-mesh/envoy' },
    ],
    tip: 'Istio\'s control plane (istiod) handles service discovery, configuration, and certificate issuance — it configures the Envoy sidecars injected into each pod\'s data plane, letting cross-cutting policy changes propagate without touching application code or redeploying workloads.',
    gotchas: [
      'Sidecar injection can be automatic (namespace-labeled) or manual — forgetting to label a namespace means pods deploy WITHOUT the mesh\'s benefits entirely, silently.',
      'Istio adds meaningful operational complexity — running and correctly configuring it is itself a significant undertaking, appropriate at genuine microservices scale.',
    ],
  },
  'service-mesh/istio-install': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Istio Architecture', route: '/service-mesh/istio-architecture' },
    ],
    tip: 'Istio\'s installation profiles (default, demo, minimal) trade off feature completeness against resource footprint — starting with a minimal profile and adding components incrementally is generally safer than the "demo" profile, which enables many features not appropriate for production by default.',
    gotchas: [
      'Upgrading Istio requires careful version compatibility checking between istiod and already-injected sidecars — a mismatch can cause subtle traffic routing issues.',
      'Canary upgrades of the control plane itself (running two istiod revisions side by side) reduce the risk of a mesh-wide outage during an Istio version upgrade.',
    ],
  },
  'service-mesh/traffic-management': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Load Balancing',   route: '/service-mesh/load-balancing' },
      { label: 'Resilience',       route: '/service-mesh/resilience' },
    ],
    tip: 'VirtualService and DestinationRule together define HOW traffic is routed (which subset, what weighting for canary/blue-green) — a misconfigured VirtualService route can silently blackhole traffic to a service, which is why verifying with a canary/shadow request before rolling out to 100% matters.',
    gotchas: [
      'Traffic splitting (90/10 canary weighting) requires DestinationRule subsets to already be correctly defined — a VirtualService referencing an undefined subset fails routing entirely.',
      'Mirroring (shadow traffic) sends a COPY of production traffic to a new version without affecting the real response — useful for validating a new version\'s behavior under real load before it serves any actual users.',
    ],
  },
  'service-mesh/load-balancing': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Traffic Management', route: '/service-mesh/traffic-management' },
    ],
    tip: 'A service mesh\'s client-side load balancing (least-connection, round-robin, or locality-aware) operates at the APPLICATION layer, distinct from a Kubernetes Service\'s own basic load balancing — the mesh\'s richer algorithms (like outlier detection, ejecting unhealthy endpoints) go beyond what kube-proxy alone provides.',
    gotchas: [
      'Locality-aware load balancing (preferring same-zone endpoints) reduces cross-zone data transfer cost and latency, but requires zone labels to be correctly propagated.',
      'Outlier detection (automatically ejecting a consistently failing endpoint from the load balancing pool) needs tuned thresholds — too aggressive ejects healthy-but-momentarily-slow endpoints unnecessarily.',
    ],
  },
  'service-mesh/resilience': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Traffic Management', route: '/service-mesh/traffic-management' },
    ],
    tip: 'A mesh-level circuit breaker and retry policy applies UNIFORMLY across services without each service needing to implement its own resilience library — but aggressive retries applied mesh-wide, without care, can amplify load on an already-struggling downstream service, worsening the very problem retries are meant to mitigate.',
    gotchas: [
      'Retry budgets (capping total retry volume as a percentage of original request volume) prevent retry storms from overwhelming a struggling service further.',
      'Circuit breaker thresholds configured mesh-wide as a blanket default may not fit every individual service\'s actual failure/recovery characteristics.',
    ],
  },
  'service-mesh/mtls': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Authorization', route: '/service-mesh/authorization' },
    ],
    tip: 'A service mesh automatically enforces mutual TLS between every service-to-service call — encrypting traffic AND verifying both parties\' identity, achieving this consistently without every service needing to implement it individually in application code.',
    gotchas: [
      'Enabling mTLS mesh-wide without a migration period (PERMISSIVE mode first, then STRICT) can break traffic from services not yet part of the mesh.',
      'Certificate issuance and rotation is handled automatically by the mesh\'s control plane, removing a significant manual operational burden — but also meaning certificate-related outages trace back to the control plane, not individual services.',
    ],
  },
  'service-mesh/authorization': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'mTLS', route: '/service-mesh/mtls' },
    ],
    tip: 'AuthorizationPolicy resources let you define fine-grained, mesh-enforced access rules (which service can call which other service, on which paths) — a zero-trust model where being inside the mesh network perimeter does NOT automatically grant access, unlike a traditional flat internal network.',
    gotchas: [
      'A default-deny AuthorizationPolicy establishes a secure baseline before adding specific allow rules — starting permissive and trying to restrict later is a common, riskier pattern.',
      'Authorization policies are evaluated per-namespace by default — a policy intended mesh-wide needs to be applied at the correct scope, or it silently only applies to one namespace.',
    ],
  },
  'service-mesh/gateway-api': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Ingress Gateway', route: '/service-mesh/ingress-gateway' },
    ],
    tip: 'The Kubernetes Gateway API is a newer, more expressive, role-oriented standard superseding the older Ingress resource — separating cluster-operator-owned Gateway configuration from developer-owned HTTPRoute configuration, addressing Ingress\'s lack of a standard way to express advanced routing.',
    gotchas: [
      'Gateway API adoption varies by mesh/ingress implementation — not every feature in the spec is necessarily supported by every implementation yet.',
      'Migrating from Ingress to Gateway API is a real migration effort, not a drop-in replacement, despite solving overlapping problems.',
    ],
  },
  'service-mesh/ingress-gateway': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Gateway API',        route: '/service-mesh/gateway-api' },
      { label: 'Traffic Management', route: '/service-mesh/traffic-management' },
    ],
    tip: 'An Istio Gateway resource configures the mesh\'s EDGE (what traffic enters the mesh at all, on which ports/protocols) — this is distinct from a VirtualService, which configures routing for traffic ALREADY inside the mesh; conflating the two is a common source of "why isn\'t external traffic reaching my service" confusion.',
    gotchas: [
      'A Gateway resource alone does nothing without an associated VirtualService actually routing the incoming traffic to a backend service.',
      'TLS termination at the ingress gateway versus passthrough to the backend service are meaningfully different configurations with different certificate-management implications.',
    ],
  },
  'service-mesh/multi-cluster': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Istio Architecture', route: '/service-mesh/istio-architecture' },
    ],
    tip: 'Multi-cluster mesh topologies (primary-remote, multi-primary) let services in DIFFERENT Kubernetes clusters discover and call each other as if they were in one logical mesh — enabling both multi-region resilience and gradual migration between clusters, at the cost of significantly more complex network and certificate configuration.',
    gotchas: [
      'Cross-cluster service discovery requires network connectivity between clusters (often via a dedicated gateway) — clusters that cannot route to each other cannot form a multi-cluster mesh regardless of configuration.',
      'Certificate trust must be shared across clusters (a common root CA) for cross-cluster mTLS to work — mismatched trust domains break cross-cluster communication silently.',
    ],
  },
  'service-mesh/ambient-mesh': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Istio Architecture', route: '/service-mesh/istio-architecture' },
    ],
    tip: 'Ambient mesh removes the per-pod sidecar entirely, moving Layer 4 mesh functionality to a shared per-node proxy (ztunnel) — significantly reducing the resource overhead of the traditional sidecar-per-pod model, at the cost of some Layer 7 features requiring an additional optional waypoint proxy.',
    gotchas: [
      'Ambient mesh is a genuinely different architecture, not just a configuration toggle — migrating from sidecar mode requires understanding what functionality moves where.',
      'Not every mesh feature available in sidecar mode has full parity in ambient mode yet, given how recently ambient mesh was introduced relative to the sidecar model.',
    ],
  },
  'service-mesh/consul': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Linkerd',           route: '/service-mesh/linkerd' },
      { label: 'Istio Architecture', route: '/service-mesh/istio-architecture' },
    ],
    tip: 'Consul Connect works across BOTH Kubernetes and non-Kubernetes (VM-based) workloads — a meaningful differentiator from meshes designed Kubernetes-first, useful for organizations with a genuine mix of containerized and traditional VM-based services needing to be part of the same mesh.',
    gotchas: [
      'Consul\'s service mesh capability is one part of a broader service networking platform (also service discovery, KV store) — adopting it for mesh alone may bring more surface area than a Kubernetes-native-only mesh.',
      'Multi-datacenter Consul federation has its own operational model distinct from Istio\'s multi-cluster approach.',
    ],
  },
  'service-mesh/linkerd': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Consul', route: '/service-mesh/consul' },
      { label: 'Envoy',  route: '/service-mesh/envoy' },
    ],
    tip: 'Linkerd deliberately favors SIMPLICITY over Istio\'s feature breadth — using a purpose-built lightweight proxy (rather than Envoy) and a narrower feature set, trading some flexibility for a meaningfully lower operational and resource footprint, appropriate for teams wanting core mesh benefits without Istio\'s full complexity.',
    gotchas: [
      'Linkerd\'s narrower feature set means certain advanced Istio capabilities (like some traffic-splitting patterns) may not have a direct equivalent.',
      'The lower resource footprint versus Istio is a real, measurable difference at scale, not just a marketing claim — worth benchmarking for genuinely resource-constrained clusters.',
    ],
  },
  'service-mesh/kiali': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Metrics',   route: '/service-mesh/metrics' },
      { label: 'Tracing',   route: '/service-mesh/tracing' },
    ],
    tip: 'Kiali visualizes the mesh\'s actual service topology and traffic flow in real time — invaluable for understanding "what actually talks to what" in a system that has grown organically, since a mesh\'s true dependency graph is often surprising compared to what documentation claims.',
    gotchas: [
      'Kiali\'s visualization depends on metrics/tracing data actually being collected — a mesh without proper telemetry configured shows an incomplete or empty graph.',
      'The visual graph is a useful diagnostic tool, not a substitute for actual metrics-based alerting — nobody watches a topology graph 24/7 the way an alert fires.',
    ],
  },
  'service-mesh/metrics': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Kiali',   route: '/service-mesh/kiali' },
      { label: 'Tracing', route: '/service-mesh/tracing' },
    ],
    tip: 'A service mesh automatically emits golden-signal metrics (request rate, error rate, latency) for EVERY service-to-service call, without any application code changes — a significant observability benefit that application-level instrumentation alone would require adding to every service individually.',
    gotchas: [
      'Mesh-level metrics show NETWORK-layer success/failure (did the HTTP call succeed) — they cannot see application-level logical errors returned with a 200 status code, a genuine blind spot to be aware of.',
      'High-cardinality labels on mesh metrics (like per-request unique IDs) can overwhelm a metrics backend not designed for that cardinality.',
    ],
  },
  'service-mesh/tracing': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Metrics', route: '/service-mesh/metrics' },
      { label: 'Kiali',   route: '/service-mesh/kiali' },
    ],
    tip: 'A mesh can automatically generate SPANS for each service-to-service hop, but trace CONTEXT propagation across those hops still requires application code to forward the relevant trace headers — the mesh alone cannot stitch a full end-to-end trace without this cooperation from the application.',
    gotchas: [
      'Sampling (recording only a percentage of traces) is often necessary at scale — sampling out the rare, slow, or erroring requests defeats the purpose of tracing them at all.',
      'A trace missing a hop usually means that specific service forgot to propagate the trace context headers, not that the mesh itself failed to instrument it.',
    ],
  },
  'service-mesh/performance': {
    apis: MESH_DEFAULT.apis, docs: MESH_DEFAULT.docs, resources: MESH_DEFAULT.resources,
    related: [
      { label: 'Ambient Mesh', route: '/service-mesh/ambient-mesh' },
    ],
    tip: 'The sidecar proxy adds real latency and resource overhead to EVERY service call — measuring this overhead against actual production traffic (not just synthetic benchmarks) is essential before assuming mesh adoption is "free" from a performance perspective.',
    gotchas: [
      'Proxy resource requests/limits need explicit tuning per workload — a default sidecar resource allocation that\'s too small throttles the proxy itself under high traffic.',
      'Ambient mesh\'s per-node proxy architecture specifically targets this overhead concern by eliminating the per-pod sidecar, a real architectural response to a genuine performance criticism of the sidecar model.',
    ],
  },

  // ── System Design: per-page entries ─────────────────────────────────────────
  'system-design/framework': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Capacity Estimation', route: '/system-design/capacity-estimation' },
      { label: 'CAP Theorem',         route: '/system-design/cap-theorem' },
    ],
    tip: 'Start every system design answer with clarifying questions about SCALE (requests/sec, data size, read/write ratio) before proposing any architecture — the right design for 100 users looks nothing like the right design for 100 million, and jumping to a solution before scoping the problem is the most common interview mistake.',
    gotchas: [
      'A structured framework (requirements → estimation → high-level design → deep dive → tradeoffs) demonstrates methodical thinking even under time pressure, more valuable than arriving at a "correct" answer via lucky guessing.',
      'Explicitly stating assumptions and tradeoffs out loud shows the interviewer your reasoning, not just your conclusion.',
    ],
  },
  'system-design/capacity-estimation': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Framework', route: '/system-design/framework' },
    ],
    tip: 'Back-of-envelope estimation (requests/sec, storage growth per year, bandwidth) grounds an architecture decision in actual numbers rather than vague intuition — a design that "feels" scalable can still be wildly over- or under-provisioned without doing this math.',
    gotchas: [
      'Rough order-of-magnitude estimates are usually sufficient — obsessing over precise numbers in an interview setting wastes time better spent on the actual architecture discussion.',
      'Peak traffic (not average) is usually the number that matters for capacity planning — average load can look comfortably low while peak load reveals a real bottleneck.',
    ],
  },
  'system-design/cap-theorem': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Replication',    route: '/system-design/replication' },
      { label: 'Sharding',       route: '/system-design/sharding' },
    ],
    tip: 'CAP theorem is specifically about behavior during a network PARTITION — a system is not simply "CP" or "AP" all the time; the consistency/availability tradeoff only manifests when a partition actually occurs, a frequently misunderstood nuance.',
    gotchas: [
      'Most real distributed systems are not purely CP or AP — they make different tradeoffs for different operations, or use tunable consistency (like Cosmos DB or Cassandra) rather than a single fixed choice.',
      'PACELC extends CAP by also addressing the tradeoff when there is NO partition (latency vs. consistency), a distinction CAP alone doesn\'t cover.',
    ],
  },
  'system-design/sql-vs-nosql': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'CAP Theorem',  route: '/system-design/cap-theorem' },
      { label: 'Sharding',     route: '/system-design/sharding' },
    ],
    tip: 'The choice isn\'t "SQL is old, NoSQL is scalable" — it\'s about actual access patterns: SQL suits relational data with complex queries and strong consistency needs; NoSQL suits flexible schema, horizontal scale, and specific access-pattern-optimized data models (key-value, document, wide-column).',
    gotchas: [
      'Many production systems use BOTH — a relational database for transactional core data and a NoSQL store for a specific high-scale, access-pattern-optimized use case, rather than treating it as an all-or-nothing choice.',
      'NoSQL\'s "schema flexibility" shifts data consistency responsibility to the APPLICATION layer — a real tradeoff, not a free lunch.',
    ],
  },
  'system-design/scaling': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Load Balancing',  route: '/system-design/load-balancing' },
      { label: 'Caching',         route: '/system-design/caching' },
    ],
    tip: 'Vertical scaling (bigger machine) is simpler but hits a hard ceiling and creates a single point of failure; horizontal scaling (more machines) has no hard ceiling but requires the application to be designed for it (stateless, or with explicit state coordination) — most large-scale systems eventually need horizontal scaling.',
    gotchas: [
      'A stateful application (in-memory sessions, local file storage) cannot simply be horizontally scaled without first externalizing that state — a common architectural retrofit pain point.',
      'Scaling reads and scaling writes are DIFFERENT problems requiring different solutions (read replicas vs. sharding) — conflating them leads to the wrong architecture.',
    ],
  },
  'system-design/load-balancing': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Scaling',        route: '/system-design/scaling' },
      { label: 'High Availability', route: '/system-design/high-availability' },
    ],
    tip: 'A load balancer is itself a potential single point of failure — production architectures typically run redundant load balancers (active-passive or active-active) rather than trusting a single instance, the same resilience principle applied one layer up from the backend servers it protects.',
    gotchas: [
      'Health checks determine which backends receive traffic — a health check that doesn\'t reflect genuine readiness (just "is the process running") can route traffic to a technically-alive-but-actually-broken instance.',
      'Sticky sessions (routing a client to the same backend) reintroduce a form of statefulness that complicates horizontal scaling and failover — avoid them when possible by externalizing session state instead.',
    ],
  },
  'system-design/caching': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Scaling',    route: '/system-design/scaling' },
      { label: 'CDN',        route: '/system-design/cdn' },
    ],
    tip: 'Adding a cache doesn\'t just add speed — it adds a NEW failure mode (cache invalidation, stale data) and a new question for every write path: how does the cache stay consistent with the source of truth — a genuinely two-sided tradeoff, not a free performance win.',
    gotchas: [
      'Cache stampede (many concurrent misses for the same expired key hitting the database simultaneously) requires explicit mitigation like locking or early refresh.',
      'Cache-aside is the most common pattern, but write-through and write-behind exist for different consistency/latency tradeoffs worth knowing for interview depth.',
    ],
  },
  'system-design/cdn': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Caching',   route: '/system-design/caching' },
    ],
    tip: 'A CDN caches content at edge locations physically close to users, reducing both latency AND load on the origin server — but cache invalidation across a globally distributed CDN is genuinely harder than invalidating a single centralized cache, since propagation isn\'t instantaneous everywhere.',
    gotchas: [
      'Dynamic, personalized content is generally a poor fit for CDN caching — CDNs excel at static or infrequently-changing content shared across many users.',
      'A CDN doesn\'t eliminate the need for origin capacity planning — a cache miss (or an uncacheable request) still hits the origin, which must handle that residual load.',
    ],
  },
  'system-design/replication': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Sharding',      route: '/system-design/sharding' },
      { label: 'CAP Theorem',   route: '/system-design/cap-theorem' },
    ],
    tip: 'Replication solves AVAILABILITY (surviving a node failure) and read scaling — it does NOT solve write scaling or storage scaling, which is what sharding addresses; these are genuinely different problems often conflated in interview answers.',
    gotchas: [
      'Asynchronous replication (the common default) means a write acknowledged by the primary may not yet be on a replica — a failover to that replica can lose the most recent writes, a real consistency tradeoff.',
      'Replication lag (the delay between a write on the primary and its appearance on a replica) means reading from a replica right after writing to the primary can return stale data — a common source of confusing "why don\'t I see my own write" bugs.',
    ],
  },
  'system-design/sharding': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Replication',   route: '/system-design/replication' },
    ],
    tip: 'The SHARD KEY choice is largely IRREVERSIBLE once a system is in production — a poorly chosen key creates hot shards that bottleneck throughput regardless of how many shards exist, the single most consequential decision in a sharded architecture.',
    gotchas: [
      'Cross-shard queries (joining data that lives on different shards) are expensive or impossible without application-level orchestration — sharding trades this capability away for write/storage scalability.',
      'Resharding (changing the shard key or count after the fact) is a genuinely difficult, high-risk operation on a live production system — getting the initial design right matters enormously.',
    ],
  },
  'system-design/distributed-transactions': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Sharding',            route: '/system-design/sharding' },
      { label: 'Fault Tolerance',     route: '/system-design/fault-tolerance' },
    ],
    tip: 'Two-phase commit provides strong consistency across services but blocks all participants if the coordinator fails mid-commit — the Saga pattern (a sequence of local transactions with compensating actions) trades strict atomicity for availability, the standard choice in most modern distributed systems.',
    gotchas: [
      'Not every operation has a clean compensating action for a Saga — sending an email cannot be truly "unsent," a real constraint on which pattern actually fits a given workflow.',
      'Distributed transactions are expensive enough that good service boundary design (minimizing cross-service transactional needs in the first place) is often a better solution than solving the distributed transaction problem well.',
    ],
  },
  'system-design/fault-tolerance': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'High Availability',   route: '/system-design/high-availability' },
      { label: 'Disaster Recovery',   route: '/system-design/disaster-recovery' },
    ],
    tip: 'Assume EVERY component will eventually fail — fault tolerance is designing so that a single component\'s failure degrades the system gracefully (or not at all) rather than causing a total outage, a fundamentally different mindset than trying to prevent failure entirely.',
    gotchas: [
      'A circuit breaker prevents a struggling downstream service from being overwhelmed further by continued requests, fast-failing instead of piling up load against an already-failing dependency.',
      'Redundancy (multiple instances of a critical component) only provides fault tolerance if those instances are genuinely independent — sharing a single point of failure (like one power supply or one AZ) defeats the purpose.',
    ],
  },
  'system-design/high-availability': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Fault Tolerance',      route: '/system-design/fault-tolerance' },
      { label: 'Disaster Recovery',    route: '/system-design/disaster-recovery' },
    ],
    tip: '"Five nines" (99.999% uptime) allows only about 5 minutes of downtime PER YEAR — the cost and complexity of each additional nine grows non-linearly, which is why the right availability target should be driven by actual business impact of downtime, not an arbitrarily impressive-sounding number.',
    gotchas: [
      'High availability within one region/datacenter does not protect against a full regional outage — that requires genuine multi-region architecture, a much bigger undertaking.',
      'Availability and durability are DIFFERENT guarantees — a highly available system can still lose data if it isn\'t also designed for durability (proper replication, backups).',
    ],
  },
  'system-design/disaster-recovery': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'High Availability', route: '/system-design/high-availability' },
    ],
    tip: 'RTO (how quickly you must recover) and RPO (how much data loss is acceptable) are the two numbers that actually define a disaster recovery strategy — a DR plan that has never been ACTUALLY TESTED (a real failover drill, not just a document) is not a real DR plan, since untested recovery procedures frequently fail when actually needed.',
    gotchas: [
      'A backup that has never been restored from is not a verified backup — the only way to know a backup actually works is to test the restore process, not just confirm the backup job "succeeded."',
      'Multi-region active-active provides the best RTO/RPO but is significantly more complex and costly than active-passive — the right choice depends on how costly actual downtime genuinely is for the business.',
    ],
  },
  'system-design/networking': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Load Balancing', route: '/system-design/load-balancing' },
      { label: 'CDN',            route: '/system-design/cdn' },
    ],
    tip: 'Understanding the request path (DNS resolution → TCP/TLS handshake → load balancer → application server → database) and where latency accumulates at each hop is foundational for reasoning about where a system\'s actual bottleneck lives, rather than guessing.',
    gotchas: [
      'DNS TTL affects how quickly a DNS-level change (like a failover) actually propagates to clients — a low TTL enables faster failover at the cost of more DNS query volume.',
      'TCP connection setup (and TLS handshake on top of it) has real latency cost — connection pooling and keep-alive avoid paying this cost on every single request.',
    ],
  },
  'system-design/indexes': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'SQL vs NoSQL', route: '/system-design/sql-vs-nosql' },
    ],
    tip: 'An index speeds up READS but slows down WRITES (every write must update every index on the table) — indexing every column "just in case" has a real, often underestimated cost, and the right index strategy should follow actual query patterns, not blanket coverage.',
    gotchas: [
      'A compound index\'s column ORDER matters — an index on (A, B) generally cannot efficiently serve a query filtering only on B.',
      'A covered query (the index alone contains every field the query needs) avoids touching the actual table data at all, a significant performance win worth designing for on hot query paths.',
    ],
  },
  'system-design/distributed-tracing': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Fault Tolerance', route: '/system-design/fault-tolerance' },
    ],
    tip: 'In a microservices architecture, a single user request can touch dozens of services — without distributed tracing (propagating a trace/correlation ID through every hop), debugging "why was this request slow" becomes a matter of guesswork across scattered, disconnected logs.',
    gotchas: [
      'Async message boundaries (a queue between services) break automatic trace propagation unless the trace context is explicitly carried in message headers.',
      'Sampling (recording only a percentage of traces) is often necessary at scale, but sampling out the rare slow/erroring requests defeats the entire purpose of tracing them.',
    ],
  },
  'system-design/url-shortener': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Framework',        route: '/system-design/framework' },
      { label: 'Caching',          route: '/system-design/caching' },
    ],
    tip: 'A classic system design interview question specifically because it touches SO many core concepts (encoding scheme, database choice, caching, rate limiting, analytics) in a deceptively simple-sounding problem — the depth comes from the follow-up questions, not the basic requirement.',
    gotchas: [
      'Base62 encoding of an auto-incrementing ID is simple but leaks information (sequential IDs reveal creation order/volume) — a randomized or hashed scheme avoids this at the cost of needing collision handling.',
      'Read-heavy access pattern (far more redirects than URL creations) argues strongly for aggressive caching of the short-code-to-URL mapping.',
    ],
  },
  'system-design/chat-application': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Framework',   route: '/system-design/framework' },
    ],
    tip: 'A chat application\'s core challenge is maintaining PERSISTENT, STATEFUL connections (WebSockets) at scale — this is architecturally very different from typical stateless REST APIs, requiring connection state to be tracked and potentially routed to the specific server holding a given user\'s connection.',
    gotchas: [
      'Message ordering and delivery guarantees (at-least-once vs. exactly-once) need explicit design decisions — a naive implementation can deliver duplicate or out-of-order messages under real network conditions.',
      'Presence (online/offline status) at scale requires its own design consideration — a naive "ping every user" approach doesn\'t scale to millions of concurrent connections.',
    ],
  },
  'system-design/social-feed': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Framework',   route: '/system-design/framework' },
      { label: 'Caching',     route: '/system-design/caching' },
    ],
    tip: 'Fan-out-on-write (pre-computing each follower\'s feed when a post is created) versus fan-out-on-read (computing the feed at read time from followed accounts) is THE central design decision — fan-out-on-write is fast to read but expensive for accounts with millions of followers ("celebrity problem"), which most real systems handle with a hybrid approach.',
    gotchas: [
      'The celebrity problem (a single post from a hugely popular account triggering fan-out to millions of followers) is the classic follow-up that breaks a naive pure fan-out-on-write design.',
      'Feed ranking (not just chronological order) adds significant complexity beyond the basic fan-out mechanism, often intentionally out of scope for a first-pass interview answer.',
    ],
  },
  'system-design/search-engine': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Framework',   route: '/system-design/framework' },
      { label: 'Indexes',     route: '/system-design/indexes' },
    ],
    tip: 'An inverted index (mapping each term to the documents containing it) is the foundational data structure behind virtually every text search system — understanding this structure explains why full-text search doesn\'t use a traditional B-tree index the way typical database queries do.',
    gotchas: [
      'Relevance ranking (not just matching) is a genuinely hard, often ML-driven problem distinct from the indexing/retrieval mechanics — most interview answers can reasonably scope this out as "a ranking service" without full design.',
      'Index updates for frequently-changing content require a strategy (near-real-time indexing vs. batch reindexing) with real tradeoffs in freshness versus system load.',
    ],
  },
  'system-design/payment-system': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Distributed Transactions', route: '/system-design/distributed-transactions' },
    ],
    tip: 'IDEMPOTENCY is the single most critical property in a payment system\'s design — a payment request retried due to a network timeout must NOT result in double-charging, which is why idempotency keys are essentially non-negotiable for any payment API design.',
    gotchas: [
      'Payment systems favor STRONG consistency over availability for the actual money-moving operation — this is one of the clearest real-world cases where CAP\'s consistency side is the correct choice, not eventual consistency.',
      'A payment system needs a reliable audit trail (every state transition logged immutably) for both debugging and regulatory/compliance requirements — this is a hard requirement, not an optional nicety.',
    ],
  },
  'system-design/video-streaming': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'CDN',   route: '/system-design/cdn' },
    ],
    tip: 'Adaptive bitrate streaming (encoding the same video at multiple quality levels, switching dynamically based on the client\'s current network conditions) is the core technique that makes video streaming resilient to varying network quality — a fixed single-quality stream would either buffer constantly on slow connections or waste bandwidth on fast ones.',
    gotchas: [
      'Video content is heavily CDN-dependent given its bandwidth demands — origin-only serving would be prohibitively expensive and slow at any real scale.',
      'Video encoding/transcoding (converting an uploaded video into multiple quality/format variants) is a genuinely CPU-intensive asynchronous pipeline, distinct from the actual streaming/delivery path.',
    ],
  },
  'system-design/ai-ml-system-design': {
    apis: SYSDESIGN_DEFAULT.apis, docs: SYSDESIGN_DEFAULT.docs, resources: SYSDESIGN_DEFAULT.resources,
    related: [
      { label: 'Framework',   route: '/system-design/framework' },
    ],
    tip: 'AI/ML system design adds a THIRD dimension beyond typical system design (scale, consistency) — model versioning, feature stores, training/serving pipeline separation, and A/B testing new models against production traffic, none of which apply to a typical CRUD-style system.',
    gotchas: [
      'Training and serving typically run on fundamentally different infrastructure with different scaling characteristics — batch training jobs versus low-latency real-time inference are genuinely separate design problems.',
      'A model that performs well in offline evaluation can still fail in production due to training-serving skew (subtle differences between training data and live production data) — a design must account for monitoring this gap.',
    ],
  },
};

@Component({
  selector: 'app-page-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page-sidebar.html',
  styleUrl: './page-sidebar.scss',
  host: {
    '[class.section-angular]':     'section() === "angular"',
    '[class.section-csharp]':      'section() === "csharp"',
    '[class.section-aspnet]':      'section() === "aspnet"',
    '[class.section-sql]':         'section() === "sql"',
    '[class.section-typescript]':  'section() === "typescript"',
    '[class.section-react]':       'section() === "react"',
    '[class.section-javascript]':  'section() === "javascript"',
    '[class.section-html]':        'section() === "html"',
    '[class.section-css]':         'section() === "css"',
  },
})
export class PageSidebarComponent {
  private router = inject(Router);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  private routeKey = computed(() =>
    this.currentUrl().replace(/^\//, '').split('?')[0]
  );

  section = computed<'angular' | 'csharp' | 'aspnet' | 'sql' | 'typescript' | 'react' | 'javascript' | 'html' | 'css' | 'security' | 'api-design' | 'observability' | 'mongodb' | 'redis' | 'graphql' | 'messaging' | 'testing-hub' | 'dsa' | 'ai' | 'python' | 'node' | 'go' | 'blazor' | 'devops' | 'aws' | 'azure' | 'linux' | 'terraform' | 'containers' | 'service-mesh' | 'system-design' | 'arch-patterns' | 'design-patterns'>(() =>
    this.currentUrl().startsWith('/csharp')         ? 'csharp'
    : this.currentUrl().startsWith('/aspnet')       ? 'aspnet'
    : this.currentUrl().startsWith('/sql')          ? 'sql'
    : this.currentUrl().startsWith('/typescript')   ? 'typescript'
    : this.currentUrl().startsWith('/react')        ? 'react'
    : this.currentUrl().startsWith('/javascript')   ? 'javascript'
    : this.currentUrl().startsWith('/html')         ? 'html'
    : this.currentUrl().startsWith('/css')          ? 'css'
    : this.currentUrl().startsWith('/security')     ? 'security'
    : this.currentUrl().startsWith('/api-design')   ? 'api-design'
    : this.currentUrl().startsWith('/observability') ? 'observability'
    : this.currentUrl().startsWith('/mongodb')       ? 'mongodb'
    : this.currentUrl().startsWith('/redis')         ? 'redis'
    : this.currentUrl().startsWith('/graphql')       ? 'graphql'
    : this.currentUrl().startsWith('/messaging')     ? 'messaging'
    : this.currentUrl().startsWith('/testing-hub')   ? 'testing-hub'
    : this.currentUrl().startsWith('/dsa')           ? 'dsa'
    : this.currentUrl().startsWith('/ai')            ? 'ai'
    : this.currentUrl().startsWith('/python')        ? 'python'
    : this.currentUrl().startsWith('/node')          ? 'node'
    : this.currentUrl().startsWith('/go')            ? 'go'
    : this.currentUrl().startsWith('/blazor')        ? 'blazor'
    : this.currentUrl().startsWith('/devops')        ? 'devops'
    : this.currentUrl().startsWith('/aws')           ? 'aws'
    : this.currentUrl().startsWith('/azure')         ? 'azure'
    : this.currentUrl().startsWith('/linux')         ? 'linux'
    : this.currentUrl().startsWith('/terraform')     ? 'terraform'
    : this.currentUrl().startsWith('/containers')    ? 'containers'
    : this.currentUrl().startsWith('/service-mesh')  ? 'service-mesh'
    : this.currentUrl().startsWith('/system-design') ? 'system-design'
    : this.currentUrl().startsWith('/arch-patterns') ? 'arch-patterns'
    : this.currentUrl().startsWith('/design-patterns') ? 'design-patterns'
    : 'angular'
  );

  data = computed<SidebarData>(() => {
    const key = this.routeKey();
    return SIDEBAR_MAP[key] ??
           SIDEBAR_MAP[key.replace(/^(angular|csharp)\//, '')] ??
           (this.section() === 'aspnet'      ? ASPNET_DEFAULT
           : this.section() === 'sql'        ? SQL_DEFAULT
           : this.section() === 'typescript' ? TS_DEFAULT
           : this.section() === 'react'      ? REACT_DEFAULT
           : this.section() === 'javascript' ? JS_DEFAULT
           : this.section() === 'html'       ? HTML_DEFAULT
           : this.section() === 'css'        ? CSS_DEFAULT
           : this.section() === 'security'   ? SEC_DEFAULT
           : this.section() === 'api-design'     ? API_DESIGN_DEFAULT
           : this.section() === 'observability'   ? OBS_DEFAULT
           : this.section() === 'mongodb'        ? MONGO_DEFAULT
           : this.section() === 'redis'          ? REDIS_DEFAULT
           : this.section() === 'graphql'        ? GQL_DEFAULT
           : this.section() === 'messaging'      ? KAFKA_DEFAULT
           : this.section() === 'testing-hub'   ? TESTING_DEFAULT
           : this.section() === 'dsa'           ? DSA_DEFAULT
           : this.section() === 'ai'            ? AI_DEFAULT
           : this.section() === 'python'        ? PYTHON_DEFAULT
           : this.section() === 'node'          ? NODE_DEFAULT
           : this.section() === 'go'            ? GO_DEFAULT
           : this.section() === 'blazor'        ? BLAZOR_DEFAULT
           : this.section() === 'devops'        ? DEVOPS_DEFAULT
           : this.section() === 'aws'           ? AWS_DEFAULT
           : this.section() === 'azure'         ? AZURE_DEFAULT
           : this.section() === 'linux'         ? LINUX_DEFAULT
           : this.section() === 'terraform'     ? TERRAFORM_DEFAULT
           : this.section() === 'containers'    ? K8S_DEFAULT
           : this.section() === 'service-mesh'  ? MESH_DEFAULT
           : this.section() === 'system-design' ? SYSDESIGN_DEFAULT
           : this.section() === 'arch-patterns' ? ARCH_DEFAULT
           : this.section() === 'design-patterns' ? DP_DEFAULT
           : DEFAULT);
  });

  docsHeading = computed(() => {
    switch (this.section()) {
      case 'csharp':          return '📖 C# Docs';
      case 'aspnet':          return '📖 ASP.NET Core Docs';
      case 'sql':             return '📖 SQL Docs';
      case 'typescript':      return '📖 TypeScript Docs';
      case 'react':           return '📖 React Docs';
      case 'javascript':      return '📖 MDN JS Docs';
      case 'html':            return '📖 MDN HTML Docs';
      case 'css':             return '📖 MDN CSS Docs';
      case 'security':        return '📖 Security Docs';
      case 'api-design':      return '📖 API Design Docs';
      case 'observability':   return '📖 Observability Docs';
      case 'mongodb':         return '📖 MongoDB Docs';
      case 'redis':           return '📖 Redis Docs';
      case 'graphql':         return '📖 GraphQL Docs';
      case 'messaging':       return '📖 Messaging Docs';
      case 'testing-hub':     return '📖 Testing Docs';
      case 'dsa':             return '📖 DSA Resources';
      case 'ai':              return '📖 AI/ML Docs';
      case 'python':          return '📖 Python Docs';
      case 'node':            return '📖 Node.js Docs';
      case 'go':              return '📖 Go Docs';
      case 'blazor':          return '📖 Blazor Docs';
      case 'devops':          return '📖 DevOps Docs';
      case 'aws':             return '📖 AWS Docs';
      case 'azure':           return '📖 Azure Docs';
      case 'linux':           return '📖 Linux Docs';
      case 'terraform':       return '📖 Terraform Docs';
      case 'containers':      return '📖 Kubernetes/Docker Docs';
      case 'service-mesh':    return '📖 Service Mesh Docs';
      case 'system-design':   return '📖 System Design Resources';
      case 'arch-patterns':   return '📖 Architecture Patterns Docs';
      case 'design-patterns': return '📖 Design Patterns Docs';
      default:                return '📖 Angular Docs';
    }
  });

  badgeLabel: Record<string, string> = {
    docs: 'docs', video: 'video', blog: 'blog', tool: 'tool', code: 'code',
  };
}
