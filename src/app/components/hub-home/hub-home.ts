import { Component, signal, computed, effect, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';

export type TechGroup  = 'frontend' | 'backend' | 'data' | 'architecture' | 'cloud' | 'fundamentals' | 'ai';
export type RoleFilter = 'all' | 'frontend' | 'backend' | 'devops' | 'architect';

interface TechCard {
  name: string;
  tagline: string;
  icon: string;
  gradient: string;
  textDark: boolean;
  route: string;
  available: boolean;
  topics?: number;
  sub?: string;
  highlights: string[];
  group: TechGroup;
  time: string;
  roles?: string[];
}

interface GroupMeta {
  key: TechGroup;
  icon: string;
  title: string;
  sub: string;
}

interface LearningPath {
  name: string;
  icon: string;
  description: string;
  steps: string[];
  gradient: string;
}

interface RoleChip {
  id: RoleFilter;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-hub-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hub-home.html',
  styleUrl: './hub-home.scss',
})
export class HubHome implements AfterViewInit, OnDestroy {

  // ── Carousel drag/scroll ────────────────────────────────────────────────────
  @ViewChild('carouselWrap') private carouselRef!: ElementRef<HTMLDivElement>;
  private rafId = 0;
  private carouselPaused = false;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartScroll = 0;
  private readonly SCROLL_SPEED = 0.5;
  private readonly onTouchMoveBound = this.onTouchMove.bind(this);

  ngAfterViewInit(): void {
    if (this.liveCards().length >= 3) this.startCarouselScroll();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.rafId);
    this.carouselRef?.nativeElement?.removeEventListener('touchmove', this.onTouchMoveBound);
  }

  private startCarouselScroll(): void {
    const el = this.carouselRef?.nativeElement;
    if (!el) return;
    el.addEventListener('touchmove', this.onTouchMoveBound, { passive: false });
    const tick = () => {
      if (!this.carouselPaused && !this.isDragging) {
        el.scrollLeft += this.SCROLL_SPEED;
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  onCarouselMouseEnter(): void { this.carouselPaused = true; }
  onCarouselMouseLeave(): void { this.carouselPaused = false; }

  onCarouselMouseDown(e: MouseEvent): void {
    if (this.liveCards().length < 3) return;
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartScroll = this.carouselRef.nativeElement.scrollLeft;
    this.carouselRef.nativeElement.classList.add('is-dragging');
  }

  onCarouselMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    const el = this.carouselRef.nativeElement;
    const half = el.scrollWidth / 2;
    el.scrollLeft = this.dragStartScroll - (e.clientX - this.dragStartX);
    if (half > 0) {
      if (el.scrollLeft >= half) el.scrollLeft -= half;
      if (el.scrollLeft < 0) el.scrollLeft += half;
    }
  }

  onCarouselMouseUp(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.carouselRef?.nativeElement?.classList.remove('is-dragging');
  }

  onTouchStart(e: TouchEvent): void {
    if (this.liveCards().length < 3) return;
    this.isDragging = true;
    this.dragStartX = e.touches[0].clientX;
    this.dragStartScroll = this.carouselRef.nativeElement.scrollLeft;
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.isDragging) return;
    e.preventDefault();
    const el = this.carouselRef.nativeElement;
    const half = el.scrollWidth / 2;
    el.scrollLeft = this.dragStartScroll - (e.touches[0].clientX - this.dragStartX);
    if (half > 0) {
      if (el.scrollLeft >= half) el.scrollLeft -= half;
      if (el.scrollLeft < 0) el.scrollLeft += half;
    }
  }

  onTouchEnd(): void { this.isDragging = false; }

  readonly searchTerm = signal('');
  readonly activeRole = signal<RoleFilter>('all');

  // ── Progress tracker (localStorage) ────────────────────────────────────────
  private readonly STORAGE_KEY = 'devhub-completed';
  readonly completed = signal<Set<string>>(this.loadCompleted());

  private loadCompleted(): Set<string> {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  }

  readonly completedCount  = computed(() => this.completed().size);
  readonly progressPercent = computed(() =>
    Math.round((this.completedCount() / this.allTechs.length) * 100)
  );

  toggleCompleted(name: string): void {
    const next = new Set(this.completed());
    next.has(name) ? next.delete(name) : next.add(name);
    this.completed.set(next);
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...next])); } catch {}
  }

  isCompleted(name: string): boolean {
    return this.completed().has(name);
  }

  // ── What's New (last 3 available topics by array order) ────────────────────
  readonly whatsNew = [
    { name: 'TypeScript · 22 pages',   route: '/typescript',               label: 'New · 20 topics + 2 reference' },
    { name: 'SQL · 53 pages',          route: '/sql',                      label: '44 topics + 9 reference' },
    { name: 'ASP.NET Core · 54 pages', route: '/aspnet',                   label: '45 topics + 9 reference' },
    { name: 'C# · 59 pages',           route: '/csharp',                   label: 'Full language coverage' },
    { name: 'Angular · 68 pages',      route: '/angular',                  label: '58 topics + 10 reference' },
  ];

  readonly roleChips: RoleChip[] = [
    { id: 'all',       label: 'All Topics', icon: '🌐' },
    { id: 'frontend',  label: 'Frontend',   icon: '🖥️' },
    { id: 'backend',   label: 'Backend',    icon: '⚙️' },
    { id: 'devops',    label: 'DevOps',     icon: '☁️' },
    { id: 'architect', label: 'Architect',  icon: '🏗️' },
  ];

  readonly groupMeta: GroupMeta[] = [
    { key: 'architecture', icon: '🏗️', title: 'Architecture & Design',   sub: 'System design, patterns, API contracts — the architect\'s decision toolkit' },
    { key: 'frontend',     icon: '🖥️', title: 'Frontend',                sub: 'Languages, frameworks and styling for the browser' },
    { key: 'backend',      icon: '⚙️', title: 'Backend & APIs',           sub: 'Server-side languages, frameworks and API design' },
    { key: 'data',         icon: '🗄️', title: 'Data & Messaging',         sub: 'Databases, caching, queues and event streaming' },
    { key: 'cloud',        icon: '☁️', title: 'Cloud, DevOps & Infra',    sub: 'Cloud platforms, containers, CI/CD and deployment' },
    { key: 'fundamentals', icon: '🔢', title: 'Engineering Fundamentals', sub: 'DSA, testing, Linux — the skills that don\'t expire' },
    { key: 'ai',           icon: '🤖', title: 'AI & Machine Learning',    sub: 'LLMs, RAG, embeddings and AI-powered application patterns' },
  ];

  readonly learningPaths: LearningPath[] = [
    {
      name: 'Web Frontend Developer',
      icon: '🖥️',
      description: 'From HTML basics to a complete Angular or React application.',
      steps: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'Angular', 'Testing'],
      gradient: 'linear-gradient(135deg, #e44d26 0%, #264de4 100%)',
    },
    {
      name: 'Backend with .NET',
      icon: '⚙️',
      description: 'Build production APIs with C#, ASP.NET Core and SQL databases.',
      steps: ['C#', 'ASP.NET Core', 'SQL', 'MongoDB / NoSQL', 'Security & Auth', 'Testing'],
      gradient: 'linear-gradient(135deg, #512bd4 0%, #e05c00 100%)',
    },
    {
      name: 'Full Stack Developer',
      icon: '⚡',
      description: 'End-to-end — browser UI to backend API, database and deployment.',
      steps: ['HTML', 'CSS', 'TypeScript', 'Angular', 'Node.js', 'SQL', 'Docker & Kubernetes'],
      gradient: 'linear-gradient(135deg, #d4a800 0%, #339933 100%)',
    },
    {
      name: 'Cloud & DevOps Engineer',
      icon: '☁️',
      description: 'Ship and operate reliably — containers, pipelines, IaC and cloud platforms.',
      steps: ['Git & DevOps', 'Linux & Bash', 'Docker & Kubernetes', 'Terraform / IaC', 'Azure', 'Observability & SRE'],
      gradient: 'linear-gradient(135deg, #f05032 0%, #0078d4 100%)',
    },
    {
      name: 'System Architect',
      icon: '🏗️',
      description: 'Design scalable systems — patterns, trade-offs and distributed architecture.',
      steps: ['Design Patterns', 'Architecture Patterns', 'API Design', 'System Design', 'Messaging & Events', 'Observability & SRE'],
      gradient: 'linear-gradient(135deg, #6b21a8 0%, #0f172a 100%)',
    },
  ];

  private readonly allTechs: TechCard[] = [

    // ── Frontend: HTML → CSS → JS → TS → frameworks ──────────────────────────
    {
      group: 'frontend', name: 'HTML', time: '~3 hrs',
      tagline: 'The skeleton of the web — semantic markup, accessibility & forms.',
      icon: '🌐', gradient: 'linear-gradient(135deg, #e44d26 0%, #b83219 100%)',
      textDark: false, route: '/html', available: true, topics: 25,

      highlights: [
        'Semantic elements: article, section, nav',
        'Forms, inputs, validation attributes',
        'Accessibility — ARIA, roles, labels',
        'Meta tags, Open Graph, SEO basics',
      ],
    },
    {
      group: 'frontend', name: 'CSS', time: '~5 hrs',
      tagline: 'Style the web — Flexbox, Grid, animations, custom properties.',
      icon: '🎨', gradient: 'linear-gradient(135deg, #264de4 0%, #142b9c 100%)',
      textDark: false, route: '/css', available: true, topics: 24,

      highlights: [
        'Flexbox and CSS Grid layout',
        'Custom properties (CSS variables)',
        'Animations, transitions, transforms',
        'Responsive design, media queries',
      ],
    },
    {
      group: 'frontend', name: 'JavaScript', time: '~10 hrs',
      tagline: 'The language of the web — ES2025, async/await, closures, modules, DOM.',
      icon: '𝐉𝐒', gradient: 'linear-gradient(135deg, #f7df1e 0%, #d4b800 100%)',
      textDark: true, route: '/javascript', available: true, topics: 24,

      highlights: [
        'ES2025 features, Promises, async/await',
        'Closures, prototypes, event loop',
        'Modules, destructuring, spread/rest',
        'DOM APIs, Fetch, Web APIs',
      ],
    },
    {
      group: 'frontend', name: 'TypeScript', time: '~6 hrs',
      tagline: 'Typed superset of JavaScript — generics, decorators, utility types.',
      icon: '𝐓𝐒', gradient: 'linear-gradient(135deg, #3178c6 0%, #1a5490 100%)',
      textDark: false, route: '/typescript', available: true, topics: 22,
      roles: ['frontend', 'backend', 'architect'],
      highlights: [
        'Types, interfaces, enums, generics',
        'Utility types: Partial, Pick, Omit, Record',
        'Decorators and metadata',
        'tsconfig, strict mode, path aliases',
      ],
    },
    {
      group: 'frontend', name: 'Angular', time: '~20 hrs',
      tagline: 'Modern component framework with signals, routing & reactive forms.',
      icon: '🅰️', gradient: 'linear-gradient(135deg, #c3002f 0%, #7a0019 100%)',
      textDark: false, route: '/angular', available: true, topics: 63,

      highlights: [
        '58 hands-on pages with live demos',
        'Signals, computed, effect, model()',
        'Reactive forms, HTTP, routing guards',
        'Testing, SSR, PWA, i18n, CDK',
      ],
    },
    {
      group: 'frontend', name: 'React', time: '~12 hrs',
      tagline: 'Declarative UI library — hooks, context, server components & more.',
      icon: '⚛️', gradient: 'linear-gradient(135deg, #149eca 0%, #0c6a8c 100%)',
      textDark: false, route: '/react', available: true, topics: 19,

      highlights: [
        'JSX, functional components, hooks',
        'useState, useEffect, useContext, useMemo',
        'React Router, React Query, Zustand',
        'Server components, Next.js, Vite',
      ],
    },
    {
      group: 'frontend', name: 'Blazor', time: '~14 hrs',
      tagline: 'Full-stack web UI in C# — components, render modes, no JavaScript required.',
      icon: '🔥', gradient: 'linear-gradient(135deg, #5c2d91 0%, #3a1c5c 100%)',
      textDark: false, route: '/blazor', available: true, topics: 23,
      sub: 'Server · WebAssembly · SSR',
      roles: ['frontend', 'backend'],
      highlights: [
        'Components, parameters, data binding',
        'Render modes: SSR, Server, WASM, Auto',
        'Forms & validation, routing, layouts',
        'JS interop, auth, state, bUnit testing',
      ],
    },
    {
      group: 'frontend', name: 'Web Performance', time: '~3 hrs',
      tagline: 'Ship fast pages — Core Web Vitals, bundle size, lazy loading & Lighthouse.',
      icon: '⚡', gradient: 'linear-gradient(135deg, #854d0e 0%, #431a03 100%)',
      textDark: false, route: '/performance', available: true, topics: 22,
      sub: 'LCP · CLS · INP · Lighthouse',
      roles: ['frontend', 'architect'],
      highlights: [
        'LCP, CLS, INP — what they measure and how to fix',
        'Lazy loading, code splitting, tree shaking',
        'Image optimisation: formats, srcset, lazy',
        'Network: HTTP/2, compression, resource hints',
      ],
    },

    // ── Backend: Node → Python → C# → ASP.NET → Go ───────────────────────────
    {
      group: 'backend', name: 'Node.js', time: '~8 hrs',
      tagline: 'Server-side JavaScript — Express, REST APIs, streams, npm.',
      icon: '⬡', gradient: 'linear-gradient(135deg, #339933 0%, #1a5c1a 100%)',
      textDark: false, route: '/node', available: true, topics: 25,
      roles: ['backend'],
      highlights: [
        'HTTP server, Express, Fastify',
        'File system, streams, buffers',
        'npm packages, package.json, scripts',
        'REST APIs, middleware, authentication',
      ],
    },
    {
      group: 'backend', name: 'Python', time: '~10 hrs',
      tagline: 'Versatile language for backends, scripting, automation & data.',
      icon: '🐍', gradient: 'linear-gradient(135deg, #3572a5 0%, #1f4c77 100%)',
      textDark: false, route: '/python', available: true, topics: 23,
      roles: ['backend'],
      highlights: [
        'FastAPI, Flask, Django REST Framework',
        'async/await, type hints, dataclasses',
        'List comprehensions, generators, decorators',
        'pandas, requests, SQLAlchemy',
      ],
    },
    {
      group: 'backend', name: 'C#', time: '~20 hrs',
      tagline: 'Microsoft\'s powerful OOP language — 59 topics from basics to .NET 11.',
      icon: 'C#', gradient: 'linear-gradient(135deg, #512bd4 0%, #311a8a 100%)',
      textDark: false, route: '/csharp', available: true, topics: 59,
      roles: ['backend', 'architect'],
      highlights: [
        '50 language topics + 9 practice & reference pages',
        'Reflection, source generators, channels, unit testing',
        'Quiz practice + 55-question interview prep',
        'C# 9–13 & .NET 8–11 coverage',
      ],
    },
    {
      group: 'backend', name: 'ASP.NET Core', time: '~17 hrs',
      tagline: 'Build production-grade REST APIs with C# and .NET — 54 pages of full coverage.',
      icon: '⚙️', gradient: 'linear-gradient(135deg, #0e7490 0%, #155e75 100%)',
      textDark: false, route: '/aspnet', available: true, topics: 54,
      sub: 'Web API · Minimal API · EF Core',
      roles: ['backend', 'architect'],
      highlights: [
        'Middleware, routing, DI lifetimes, configuration',
        'Minimal APIs, OpenAPI/Swagger, versioning, gRPC',
        'EF Core, caching, auth, rate limiting, resilience',
        'Testing, SignalR, health checks, .NET Aspire',
      ],
    },
    {
      group: 'backend', name: 'Go', time: '~8 hrs',
      tagline: 'Fast, simple, concurrent — the language behind Docker, K8s and cloud tooling.',
      icon: '🐹', gradient: 'linear-gradient(135deg, #00acd7 0%, #006b87 100%)',
      textDark: false, route: '/go', available: true, topics: 23,
      sub: 'Go · Goroutines · gRPC · CLI tools',
      roles: ['backend', 'devops', 'architect'],
      highlights: [
        'Goroutines and channels — concurrency without threads',
        'Interfaces, structs, embedding — composition over inheritance',
        'HTTP server, REST & gRPC with net/http and gRPC-Go',
        'CLI tools, cross-compilation, single binary deploys',
      ],
    },

    // ── Data: SQL → NoSQL → Redis → GraphQL → Messaging ──────────────────────
    {
      group: 'data', name: 'SQL', time: '~7 hrs',
      tagline: 'Query relational databases — SQL Server & PostgreSQL with real examples.',
      icon: '🗄️', gradient: 'linear-gradient(135deg, #e05c00 0%, #9a3e00 100%)',
      textDark: false, route: '/sql', available: true, topics: 53,
      sub: 'MSSQL · PostgreSQL',
      roles: ['backend', 'architect'],
      highlights: [
        'SELECT, JOIN, GROUP BY, subqueries',
        'Window functions, CTEs, indexes',
        'Stored procedures, transactions',
        'MSSQL vs PostgreSQL syntax differences',
      ],
    },
    {
      group: 'data', name: 'MongoDB / NoSQL', time: '~5 hrs',
      tagline: 'Document databases — flexible schemas, aggregation & multi-model storage.',
      icon: '🍃', gradient: 'linear-gradient(135deg, #13aa52 0%, #0a6b34 100%)',
      textDark: false, route: '/mongodb', available: true,
      sub: 'MongoDB · CosmosDB · DynamoDB',
      roles: ['backend', 'architect'],
      highlights: [
        'Collections, documents, BSON schema',
        'CRUD, find(), aggregation pipeline',
        'Indexing, Atlas, change streams',
        'SQL vs NoSQL — when to choose each',
      ],
    },
    {
      group: 'data', name: 'Redis', time: '~4 hrs',
      tagline: 'In-memory store — caching, sessions, pub/sub, rate limiting & queues.',
      icon: '🔴', gradient: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
      textDark: false, route: '/redis', available: true,
      sub: 'Cache · Pub/Sub · Sorted Sets',
      roles: ['backend', 'devops', 'architect'],
      highlights: [
        'Strings, hashes, lists, sets, sorted sets',
        'Cache-aside, write-through, TTL strategy',
        'Pub/Sub for real-time messaging',
        'Rate limiting, session storage, distributed locks',
      ],
    },
    {
      group: 'data', name: 'GraphQL', time: '~5 hrs',
      tagline: 'Query language for APIs — type-safe, flexible, self-documenting.',
      icon: '◈', gradient: 'linear-gradient(135deg, #e535ab 0%, #9c1f73 100%)',
      textDark: false, route: '/graphql', available: true,
      sub: 'GraphQL · Apollo · Hot Chocolate',
      roles: ['frontend', 'backend', 'architect'],
      highlights: [
        'Schema definition language (SDL)',
        'Queries, mutations, subscriptions',
        'Resolvers, dataloaders, N+1 problem',
        'Apollo Client, Hot Chocolate (.NET)',
      ],
    },
    {
      group: 'data', name: 'Messaging & Events', time: '~6 hrs',
      tagline: 'Event-driven architecture — Kafka, RabbitMQ, Service Bus & patterns.',
      icon: '📨', gradient: 'linear-gradient(135deg, #7c2d12 0%, #431407 100%)',
      textDark: false, route: '/messaging', available: true,
      sub: 'Kafka · RabbitMQ · Azure Service Bus',
      roles: ['backend', 'architect'],
      highlights: [
        'Queue vs topic vs pub/sub — when to use which',
        'Kafka: partitions, consumer groups, exactly-once',
        'Saga pattern — distributed transactions without 2PC',
        'Outbox pattern, idempotency, dead-letter queues',
      ],
    },

    // ── Architecture: code patterns → service patterns → system → ops ─────────
    {
      group: 'architecture', name: 'Design Patterns', time: '~7 hrs',
      tagline: 'GoF, SOLID, GRASP, DRY — implementation patterns every developer references.',
      icon: '🧩', gradient: 'linear-gradient(135deg, #6b21a8 0%, #3b0764 100%)',
      textDark: false, route: '/design-patterns', available: true,
      sub: 'GoF · SOLID · Enterprise Patterns',
      roles: ['backend', 'architect'],
      highlights: [
        'Creational: Factory, Builder, Singleton — when NOT to use Singleton',
        'Structural: Adapter, Decorator, Facade, Proxy',
        'Behavioural: Observer, Strategy, Command, Mediator',
        'Enterprise: Repository, Unit of Work, Specification, CQRS',
      ],
    },
    {
      group: 'architecture', name: 'Architecture Patterns', time: '~8 hrs',
      tagline: 'When to use Microservices, Event-Driven, CQRS, DDD, or a Monolith.',
      icon: '◉', gradient: 'linear-gradient(135deg, #1a1a2e 0%, #4a1d8c 100%)',
      textDark: false, route: '/arch-patterns', available: true,
      sub: 'Microservices · DDD · CQRS · Hexagonal',
      roles: ['architect'],
      highlights: [
        'Monolith → Modular Monolith → Microservices — when to split',
        'Domain-Driven Design: bounded contexts, aggregates, events',
        'CQRS + Event Sourcing — read/write separation, audit trail',
        'Hexagonal (Ports & Adapters), Clean, Onion architecture',
      ],
    },
    {
      group: 'architecture', name: 'API Design', time: '~5 hrs',
      tagline: 'REST vs GraphQL vs gRPC vs WebSockets — pick the right protocol.',
      icon: '📡', gradient: 'linear-gradient(135deg, #065f46 0%, #022c22 100%)',
      textDark: false, route: '/api-design', available: true,
      sub: 'REST · gRPC · WebSockets · OpenAPI',
      roles: ['backend', 'architect'],
      highlights: [
        'REST constraints, resource naming, status codes, HATEOAS',
        'gRPC — when low latency & typed contracts matter',
        'WebSockets & SSE — real-time: push vs poll trade-offs',
        'API versioning, OpenAPI contracts, breaking change strategy',
      ],
    },
    {
      group: 'architecture', name: 'System Design', time: '~10 hrs',
      tagline: 'Architect scalable systems — trade-offs, capacity planning & distributed patterns.',
      icon: '🏗️', gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
      textDark: false, route: '/system-design', available: true,
      sub: 'Scalability · Reliability · Trade-offs',
      roles: ['architect'],
      highlights: [
        'CAP theorem, BASE vs ACID, consistency models',
        'Horizontal vs vertical scaling, sharding, replication',
        'Caching layers — CDN → API → DB, what & when to cache',
        'Load balancing, API gateway, rate limiting, circuit breaker',
      ],
    },
    {
      group: 'architecture', name: 'Security & Auth', time: '~6 hrs',
      tagline: 'OAuth 2.0, JWT, OpenID Connect, HTTPS and OWASP best practices.',
      icon: '🔐', gradient: 'linear-gradient(135deg, #374151 0%, #111827 100%)',
      textDark: false, route: '/security', available: true,
      sub: 'JWT · OAuth 2.0 · OpenID Connect',
      roles: ['frontend', 'backend', 'devops', 'architect'],
      highlights: [
        'OAuth 2.0 flows: auth code, PKCE, client credentials',
        'JWT structure, signing, validation, refresh tokens',
        'HTTPS, CORS, CSP, HSTS headers',
        'OWASP Top 10: XSS, SQLi, CSRF, IDOR, broken auth',
      ],
    },
    {
      group: 'architecture', name: 'Observability & SRE', time: '~5 hrs',
      tagline: 'Design for production — logging, metrics, tracing, SLOs & alerting.',
      icon: '📊', gradient: 'linear-gradient(135deg, #166534 0%, #052e16 100%)',
      textDark: false, route: '/observability', available: true,
      sub: 'Logs · Metrics · Traces · SLO/SLI',
      roles: ['devops', 'architect'],
      highlights: [
        'Pillars of observability: logs, metrics, distributed traces',
        'SLI / SLO / SLA — define error budgets, not uptime %',
        'OpenTelemetry, Prometheus, Grafana, Jaeger, Datadog',
        'Alerting strategy, runbooks, on-call, post-mortems',
      ],
    },

    // ── Cloud: Git → Docker → Terraform → Cloud platforms → Service Mesh ─────
    {
      group: 'cloud', name: 'Git & DevOps', time: '~6 hrs',
      tagline: 'Version control, CI/CD pipelines and deployment workflows.',
      icon: '🔧', gradient: 'linear-gradient(135deg, #f05032 0%, #9c2f1a 100%)',
      textDark: false, route: '/devops', available: true,
      sub: 'Git · GitHub Actions · Pipelines',
      roles: ['frontend', 'backend', 'devops', 'architect'],
      highlights: [
        'Git branching, merging, rebasing, tags',
        'GitHub Actions, Azure Pipelines, YAML',
        'Environments, secrets, approval gates',
        'Deploy strategies: blue/green, canary, rolling',
      ],
    },
    {
      group: 'cloud', name: 'Linux & Bash', time: '~5 hrs',
      tagline: 'Command the server — shell scripting, process management & automation.',
      icon: '🐧', gradient: 'linear-gradient(135deg, #44403c 0%, #1c1917 100%)',
      textDark: false, route: '/linux', available: true,
      sub: 'Bash · Shell · Cron · SSH',
      roles: ['backend', 'devops'],
      highlights: [
        'File system, permissions (chmod/chown), processes, signals',
        'grep, awk, sed, find, xargs — text processing pipelines',
        'Bash scripting: loops, functions, conditionals, exit codes',
        'SSH, SCP, cron jobs, systemd services, env vars',
      ],
    },
    {
      group: 'cloud', name: 'Docker & Kubernetes', time: '~8 hrs',
      tagline: 'Containerize apps and orchestrate them at scale with K8s.',
      icon: '🐳', gradient: 'linear-gradient(135deg, #0db7ed 0%, #0868a8 100%)',
      textDark: false, route: '/containers', available: true, topics: 23,
      sub: 'Docker · Kubernetes · Helm',
      roles: ['backend', 'devops', 'architect'],
      highlights: [
        'Dockerfile, images, multi-stage builds',
        'docker-compose for local dev stacks',
        'K8s: pods, deployments, services, ingress',
        'Helm charts, namespaces, rolling updates',
      ],
    },
    {
      group: 'cloud', name: 'Terraform / IaC', time: '~6 hrs',
      tagline: 'Define infrastructure as code — provision and manage cloud resources declaratively.',
      icon: '🔩', gradient: 'linear-gradient(135deg, #5c4ee5 0%, #3a2eb5 100%)',
      textDark: false, route: '/terraform', available: true,
      sub: 'Terraform · Bicep · Pulumi',
      roles: ['devops', 'architect'],
      highlights: [
        'Providers, resources, state — Terraform core concepts',
        'Modules, workspaces, remote state in Azure/S3',
        'Bicep — Azure-native IaC, vs ARM templates',
        'Drift detection, plan/apply lifecycle, secrets management',
      ],
    },
    {
      group: 'cloud', name: 'Azure', time: '~12 hrs',
      tagline: 'Microsoft\'s cloud platform — App Service, Functions, Storage & DevOps.',
      icon: '☁️', gradient: 'linear-gradient(135deg, #0078d4 0%, #004578 100%)',
      textDark: false, route: '/azure', available: true,
      sub: 'Microsoft Cloud',
      roles: ['devops', 'architect'],
      highlights: [
        'App Service, Azure Functions, AKS',
        'Azure SQL, Blob Storage, Cosmos DB',
        'Azure DevOps, Pipelines, Repos',
        'Active Directory, Key Vault, Monitor',
      ],
    },
    {
      group: 'cloud', name: 'AWS', time: '~14 hrs', topics: 22,
      tagline: 'Amazon Web Services — EC2, Lambda, S3, RDS & cloud-native patterns.',
      icon: '🟧', gradient: 'linear-gradient(135deg, #ff9900 0%, #c47000 100%)',
      textDark: false, route: '/aws', available: true,
      sub: 'Amazon Cloud',
      roles: ['devops', 'architect'],
      highlights: [
        'EC2, Lambda, ECS, EKS',
        'S3, RDS, DynamoDB, Aurora',
        'IAM, VPC, CloudWatch, CloudFormation',
        'API Gateway, SQS, SNS, EventBridge',
      ],
    },
    {
      group: 'cloud', name: 'Service Mesh & Istio', time: '~4 hrs',
      tagline: 'Manage microservice-to-microservice traffic — mTLS, observability & circuit breaking.',
      icon: '🕸️', gradient: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
      textDark: false, route: '/service-mesh', available: true,
      sub: 'Istio · Linkerd · Envoy · Consul',
      roles: ['devops', 'architect'],
      highlights: [
        'Sidecar proxy pattern — why it works without code changes',
        'mTLS between services — zero-trust network',
        'Traffic management: retries, timeouts, canary, mirroring',
        'Distributed tracing, metrics without instrumentation',
      ],
    },

    // ── Fundamentals: DSA → Testing ───────────────────────────────────────────
    {
      group: 'fundamentals', name: 'DSA', time: '~15 hrs',
      tagline: 'Data Structures & Algorithms — complexity, trade-offs & interview patterns.',
      icon: '🔢', gradient: 'linear-gradient(135deg, #92400e 0%, #451a03 100%)',
      textDark: false, route: '/dsa', available: true,
      sub: 'Arrays · Trees · Graphs · DP',
      roles: ['backend', 'architect'],
      highlights: [
        'Big-O time & space — what matters in real systems',
        'Arrays, hash maps, linked lists, stacks, queues, heaps',
        'Trees: BST, trie; Graphs: BFS, DFS, Dijkstra',
        'Sorting, binary search, sliding window, two pointers, DP',
      ],
    },
    {
      group: 'fundamentals', name: 'Testing', time: '~7 hrs',
      tagline: 'Unit, integration, E2E & contract testing — TDD, BDD and test strategy.',
      icon: '🧪', gradient: 'linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)',
      textDark: false, route: '/testing-hub', available: true,
      sub: 'Jest · Cypress · Playwright · Pact',
      roles: ['frontend', 'backend', 'architect'],
      highlights: [
        'Testing pyramid: unit → integration → E2E — where to invest',
        'Jest, Vitest — unit & snapshot testing, mocking strategies',
        'Playwright, Cypress — E2E, page object model',
        'Contract testing (Pact), mutation testing, coverage trade-offs',
      ],
    },

    // ── AI ────────────────────────────────────────────────────────────────────
    {
      group: 'ai', name: 'AI & LLMs', time: '~8 hrs',
      tagline: 'Build AI-powered apps — prompt engineering, RAG, embeddings & agents.',
      icon: '🤖', gradient: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
      textDark: false, route: '/ai', available: true,
      sub: 'OpenAI · Copilot · LangChain',
      roles: ['backend', 'architect'],
      highlights: [
        'Prompt engineering, few-shot, chain-of-thought',
        'RAG — retrieval-augmented generation',
        'Embeddings, vector databases (Pinecone, pgvector)',
        'AI SDK, LangChain, Semantic Kernel (.NET)',
      ],
    },
  ];

  private readonly allTechsFiltered = computed(() => {
    const q    = this.searchTerm().toLowerCase().trim();
    const role = this.activeRole();

    return this.allTechs.filter(t => {
      const matchesRole = role === 'all' || !t.roles || t.roles.includes(role);
      if (!q) return matchesRole;
      const matchesSearch =
        t.name.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q) ||
        (t.sub ?? '').toLowerCase().includes(q) ||
        t.highlights.some(h => h.toLowerCase().includes(q));
      return matchesRole && matchesSearch;
    });
  });

  readonly filteredGroups = computed<Record<TechGroup, TechCard[]>>(() => {
    const cards    = this.allTechsFiltered();
    const byGroup  = (g: TechGroup) => cards.filter(t => t.group === g);
    return {
      frontend:     byGroup('frontend'),
      backend:      byGroup('backend'),
      data:         byGroup('data'),
      architecture: byGroup('architecture'),
      cloud:        byGroup('cloud'),
      fundamentals: byGroup('fundamentals'),
      ai:           byGroup('ai'),
    };
  });

  readonly liveCards   = computed(() => this.allTechsFiltered().filter(t => t.available && t.topics));

  // One half of the seamless loop — repeat the live set until it's wide enough
  // (≥6 cards ≈ 2000px) so the track half always exceeds the viewport.
  readonly carouselCards = computed(() => {
    const base = this.liveCards();
    if (base.length === 0) return base;
    const out = [...base];
    while (out.length < 6) out.push(...base);
    return out;
  });
  readonly hasResults  = computed(() => this.allTechsFiltered().length > 0);
  readonly totalCount  = computed(() => this.allTechs.length);
  readonly matchCount  = computed(() => this.allTechsFiltered().length);
  readonly isFiltered = computed(() => this.searchTerm().trim().length > 0 || this.activeRole() !== 'all');

  scrollToSection(cls: string): void {
    document.querySelector('.' + cls)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.activeRole.set('all');
  }

  cardId(name: string): string {
    return 'card-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  stepRoute(name: string): string | null {
    const card = this.allTechs.find(t => t.name === name);
    return card?.available ? card.route : null;
  }

  scrollToCard(name: string): void {
    // Clear any active filter so the card is guaranteed to be rendered
    this.searchTerm.set('');
    this.activeRole.set('all');
    // Wait one tick for Angular to re-render, then scroll
    setTimeout(() => {
      const el = document.getElementById(this.cardId(name));
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('card-ping');
      setTimeout(() => el.classList.remove('card-ping'), 1400);
    }, 50);
  }
}
