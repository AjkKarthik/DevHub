import { Component, inject } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

const ROUTE_LABELS: Record<string, string> = {
  '':                   'Home',
  'counter':            'Signals & State',
  'templates':          'Template Syntax',
  'directives':         'Directives',
  'lifecycle':          'Lifecycle Hooks',
  'pipes':              'Pipes',
  'di':                 'Dependency Injection',
  'parent-child':       'Input / Output',
  'content-projection': 'Content Projection',
  'change-detection':   'Change Detection',
  'animations':         'Animations',
  'forms':              'Forms',
  'form-array':         'FormArray',
  'todo':               'Todo (guarded)',
  'zod-forms':          'Zod Validation',
  'custom-validators':  'Custom Validators',
  'cva':                'Control Value Accessor',
  'dynamic-forms':      'Dynamic Forms',
  'wizard-form':        'Wizard Form',
  'http':               'HTTP Client',
  'routing':            'Routing',
  'defer':              '@defer Blocks',
  'store':              'Signal Store',
  'rxjs':               'RxJS Operators',
  'testing':            'Testing',
  'route-resolvers':    'Route Resolvers',
  'preloading':         'Preloading',
  'route-guards':       'Route Guards',
  'http-interceptors':  'HTTP Interceptors',
  'signal-effects':     'Signal Effects',
  'typed-forms':        'Typed Reactive Forms',
  'host-directives':    'Host Directives',
  'let-template-vars':       '@let Template Variables',
  'standalone-migration':    'Standalone Migration',
  'error-handling-patterns': 'Error Handling Patterns',
  'msw':                     'Mock Service Worker',
  'accessibility':           'Accessibility (a11y)',
  'micro-frontends':         'Micro-Frontends',
  'angular-devtools':        'Angular DevTools',
  'bundle-optimization':     'Bundle Optimization',
  'material':           'Angular Material',
  'charts':             'Charts',
  'cdk':                'Angular CDK',
  'ag-grid':            'AG Grid',
  'tanstack-query':     'TanStack Query',
  'date-fns':           'date-fns',
  'tailwind':           'Tailwind CSS',
  'resource-api':       'resource() API',
  'ngrx-signals':       'NgRx Signals',
  'destroy-ref':        'DestroyRef',
  'linked-signal':      'linkedSignal()',
  'zoneless':           'Zoneless Angular',
  'e2e':                'E2E (Playwright)',
  'harnesses':          'Harnesses',
  'ng-image':           'NgOptimizedImage',
  'web-workers':        'Web Workers',
  'pwa':                'PWA / Service Worker',
  'i18n':               'i18n',
  'ssr':                'SSR + Hydration',
  'cheatsheet':         'Cheat Sheet',
  'errors':             'Common Errors',
  'whats-new':          "What's New",
  'mini-projects':      'Mini Projects',
  'learning-paths':     'Learning Paths',
  'interview-prep':     'Interview Prep',
  'quiz-practice':      'Quiz Practice',
  'design-patterns':    'Design Patterns',
  'decision-guides':    'Decision Guides',
  'glossary':           'Glossary',
};

const CSHARP_LABELS: Record<string, string> = {
  'basics':               'Variables & Types',
  'fields':               'Fields & Constants',
  'methods':              'Methods',
  'type-conversion':      'Type Conversion',
  'constructors':         'Constructors',
  'properties-indexers':  'Properties & Indexers',
  'namespaces':           'Namespaces & Usings',
  'oop':                  'Classes & OOP',
  'inheritance':          'Inheritance & Overriding',
  'abstract-interfaces':  'Abstract & Interfaces',
  'static-enums':         'Static, Partial & Enums',
  'structures':           'Structures',
  'system-object':        'System.Object',
  'records':              'Records & Structs',
  'generics':             'Generics',
  'null-safety':          'Null Safety',
  'pattern-matching':     'Pattern Matching',
  'extension-methods':    'Extension Methods',
  'tuples':               'Tuples & Anonymous Types',
  'arrays':               'Arrays',
  'collections':          'Collections',
  'linq':                 'LINQ',
  'strings-datetime':     'Strings, DateTime & Math',
  'io-serialization':     'I/O & Serialization',
  'gc-disposable':        'GC & IDisposable',
  'threading':            'Threading',
  'tasks':                'Tasks & Parallel',
  'async':                'async / await',
  'delegates':            'Delegates & Events',
  'exceptions':           'Exceptions',
  'reflection':           'Reflection & Attributes',
  'iterators':            'Iterators & yield',
  'functional-csharp':   'Functional C# & Result Pattern',
  'regex':                'Regular Expressions',
  'channels':             'Channels & Producer/Consumer',
  'unit-testing':         'Unit Testing (xUnit & Moq)',
  'expression-trees':     'Expression Trees',
  'dynamic':              'dynamic & the DLR',
  'source-generators':    'Source Generators',
  'span-memory':          'Span<T> & Memory<T>',
  'di-dotnet':            'Dependency Injection in .NET',
  'json-advanced':        'System.Text.Json Advanced',
  'unsafe-pointers':      'Unsafe Code & Pointers',
  'native-aot':           'Native AOT',
  'benchmarkdotnet':      'BenchmarkDotNet',
  'pinvoke':              'P/Invoke & Native Interop',
  'dotnet-cli':           '.NET CLI & Tooling',
  'whats-new-9-10':       "What's New in C# 9 & 10",
  'whats-new-11-12':      "What's New in C# 11 & 12",
  'whats-new-latest':     "What's New in C# 13+",
  'cheatsheet':           'C# Cheat Sheet',
  'errors':               'Common C# Errors',
  'mini-projects':        'Mini Projects',
  'learning-paths':       'Learning Paths',
  'interview-prep':       'Interview Prep',
  'quiz-practice':        'Quiz Practice',
  'design-patterns':      'Design Patterns',
  'decision-guides':      'Decision Guides',
  'glossary':             'Glossary',
};

const ASPNET_LABELS: Record<string, string> = {
  'hosting-startup':       'Hosting & Startup',
  'middleware':            'Middleware Pipeline',
  'routing':               'Routing',
  'configuration':         'Configuration & Options',
  'dependency-injection':  'Dependency Injection',
  'logging':               'Logging & Diagnostics',
  'controllers':           'Controllers & Actions',
  'minimal-apis':          'Minimal APIs',
  'model-binding':         'Model Binding & Validation',
  'filters':               'Filters',
  'error-handling':        'Error Handling',
  'ef-core-basics':        'EF Core Basics',
  'ef-relationships':      'EF Relationships & Migrations',
  'caching':               'Caching',
  'authentication':        'Authentication',
  'authorization':         'Authorization',
  'cors':                  'CORS & Security Headers',
  'testing':               'Testing',
  'background-services':   'Background Services',
  'signalr':               'SignalR',
  'health-checks':         'Health Checks & Observability',
  'deployment':            'Deployment',
  'static-files':          'Static Files & Uploads',
  'openapi-swagger':       'OpenAPI & Swagger',
  'api-versioning':        'API Versioning',
  'http-clients':          'HttpClient & Resilience',
  'grpc':                  'gRPC Services',
  'rate-limiting':         'Rate Limiting',
  'aspire':                '.NET Aspire',
  'fluent-validation':     'FluentValidation',
  'minimal-api-advanced':  'Minimal API Advanced',
  'output-caching-advanced': 'Output Caching Advanced',
  'dapper':                'Dapper & Raw SQL',
  'csrf':                  'Anti-forgery & CSRF',
  'feature-flags':         'Feature Flags',
  'localization':          'Localization & Globalization',
  'masstransit':           'MassTransit',
  'response-compression':  'Response Compression',
  'websockets':            'WebSockets',
  'yarp':                  'YARP Reverse Proxy',
  'opentelemetry':         'OpenTelemetry',
  'ef-performance':        'EF Core Performance & Concurrency',
  'web-security':          'Web Security Essentials',
  'secrets':               'Secrets & Data Protection',
  'performance':           'Performance & Diagnostics',
  'cheatsheet':            'Cheat Sheet',
  'errors':               'Common Errors',
  'quiz-practice':         'Quiz Practice',
  'interview-prep':        'Interview Prep',
  'design-patterns':       'Design Patterns',
  'decision-guides':       'Decision Guides',
  'glossary':              'Glossary',
  'mini-projects':         'Mini Projects',
  'learning-paths':        'Learning Paths',
};

const SQL_LABELS: Record<string, string> = {
  'rdbms-concepts':    'RDBMS Concepts',
  'data-modeling':     'Data Modeling',
  'normalization':     'Normalization',
  'db-architecture':   'DB Architecture',
  'data-types':        'Data Types',
  'basics':            'SQL Basics',
  'joins':             'Joins',
  'aggregations':      'Aggregations',
  'subqueries':        'Subqueries',
  'ctes':              'CTEs',
  'window-functions':  'Window Functions',
  'indexes':           'Indexes',
  'transactions':      'Transactions',
  'schema-design':     'Schema Design',
  'stored-procedures': 'Stored Procedures',
  'performance':       'Performance',
  'json-features':             'JSON Features',
  'set-operations':            'Set Operations',
  'null-handling':             'NULL Handling',
  'merge':                     'MERGE / Upsert',
  'string-functions':          'String Functions',
  'date-functions':            'Date & Time Functions',
  'conditional-expressions':   'Conditional Expressions',
  'math-functions':            'Math & Numeric Functions',
  'pivoting':                  'Pivoting & Cross-Tab',
  'constraints':               'Constraints',
  'views':                     'Views',
  'sequences':                 'Sequences & Identity',
  'temp-tables':               'Temp Tables & Table Variables',
  'computed-columns':          'Computed & Generated Columns',
  'stored-functions':          'Stored Functions',
  'cursors':                   'Cursors & Row-by-Row Processing',
  'triggers':                  'Triggers',
  'dynamic-sql':               'Dynamic SQL',
  'isolation-levels':          'Isolation Levels',
  'locking':                   'Locking & Deadlocks',
  'execution-plans':           'Execution Plans',
  'partitioning':              'Partitioning',
  'bulk-operations':           'Bulk Operations',
  'query-store':               'Query Store',
  'statistics':                'Statistics & Optimizer',
  'full-text-search':          'Full-Text Search',
  'security':                  'SQL Security',
  'connection-pooling':        'Connection Pooling',
  'cheatsheet':                'Cheat Sheet',
  'errors':            'Common Errors',
  'quiz-practice':     'Quiz Practice',
  'interview-prep':    'Interview Prep',
  'design-patterns':   'Design Patterns',
  'decision-guides':   'Decision Guides',
  'glossary':          'Glossary',
  'mini-projects':     'Mini Projects',
  'learning-paths':    'Learning Paths',
};

const TYPESCRIPT_LABELS: Record<string, string> = {
  'basics':                   'TS Fundamentals',
  'primitive-types':          'Primitive & Literal Types',
  'interfaces-types':         'Interfaces & Type Aliases',
  'unions':                   'Union & Intersection Types',
  'narrowing':                'Type Guards & Narrowing',
  'enums-tuples':             'Enums & Tuples',
  'generics':                 'Generics Fundamentals',
  'generic-patterns':         'Generic Patterns',
  'utility-types':            'Utility Types',
  'mapped-types':             'Mapped Types',
  'conditional-types':        'Conditional Types',
  'template-literal-types':   'Template Literal Types',
  'classes':                  'Classes & Visibility',
  'decorators':               'Decorators',
  'tsconfig':                 'tsconfig Deep Dive',
  'modules':                  'Module System & Namespaces',
  'declarations':             'Declaration Files (d.ts)',
  'frameworks':               'TypeScript with Frameworks',
  'strict-migration':         'Strict Mode & Migration',
  'ts-performance':           'TypeScript Performance',
  'cheatsheet':               'Cheat Sheet',
  'interview-prep':           'Interview Prep',
};

const REACT_LABELS: Record<string, string> = {
  'basics':            'React Fundamentals',
  'hooks-core':        'Core Hooks',
  'hooks-advanced':    'Advanced Hooks',
  'forms':             'Forms & Validation',
  'router':            'React Router',
  'context':           'Context API',
  'state-management':  'State Management',
  'tanstack-query':    'TanStack Query',
  'performance':       'Performance',
  'patterns':          'React Patterns',
  'typescript':        'TypeScript & React',
  'testing':           'Testing React',
  'nextjs':            'Next.js App Router',
  'native':            'React Native',
  'hook-form':         'React Hook Form',
  'animations':        'Animations',
  'security':          'Security',
  'cheatsheet':        'Cheat Sheet',
  'interview-prep':    'Interview Prep',
};

const JAVASCRIPT_LABELS: Record<string, string> = {
  'fundamentals':   'JavaScript Fundamentals',
  'closures':       'Scope & Closures',
  'hoisting':       'Hoisting & TDZ',
  'symbols':        'Symbols & Iterators',
  'functions':      'Functions Deep Dive',
  'prototypes':     'Prototypes & Classes',
  'objects':        'Object Fundamentals',
  'destructuring':  'Destructuring & Spread',
  'arrays':         'Arrays & Iteration',
  'promises':       'Promises & Async/Await',
  'event-loop':     'Event Loop & Concurrency',
  'error-handling': 'Error Handling',
  'generators':     'Generators',
  'dom':            'DOM Manipulation',
  'events':         'Events & Custom Events',
  'browser-apis':   'Browser APIs',
  'modules':        'ES Modules',
  'bundlers':       'Bundlers & Build Tools',
  'patterns':       'Design Patterns in JS',
  'functional':     'Functional JS',
  'proxy':          'Proxy & Reflect API',
  'weakrefs':       'WeakMap, WeakSet & WeakRef',
  'cheatsheet':     'Cheat Sheet',
  'interview-prep': 'Interview Prep',
};

const HTML_LABELS: Record<string, string> = {
  'document-structure': 'Document Structure',
  'semantic-elements':  'Semantic Elements',
  'forms':              'Forms & Input',
  'media':              'Media Elements',
  'tables':             'Tables',
  'links-navigation':   'Links & Navigation',
  'accessibility':      'Accessibility & ARIA',
  'head-metadata':      'Head & Metadata',
  'custom-elements':    'Web Components',
  'iframes-embeds':     'iFrames & Embeds',
  'canvas-svg':         'Canvas & SVG',
};

const TECH_SECTIONS: Record<string, { label: string; path: string }> = {
  'angular':         { label: 'Angular',               path: '/angular'         },
  'csharp':          { label: 'C#',                    path: '/csharp'          },
  'aspnet':          { label: 'ASP.NET Core',           path: '/aspnet'          },
  'sql':             { label: 'SQL',                   path: '/sql'             },
  'html':            { label: 'HTML',                  path: '/html'            },
  'css':             { label: 'CSS',                   path: '/css'             },
  'javascript':      { label: 'JavaScript',            path: '/javascript'      },
  'typescript':      { label: 'TypeScript',            path: '/typescript'      },
  'react':           { label: 'React',                 path: '/react'           },
  'blazor':          { label: 'Blazor',                path: '/blazor'          },
  'performance':     { label: 'Web Performance',       path: '/performance'     },
  'node':            { label: 'Node.js',               path: '/node'            },
  'python':          { label: 'Python',                path: '/python'          },
  'go':              { label: 'Go',                    path: '/go'              },
  'mongodb':         { label: 'MongoDB / NoSQL',       path: '/mongodb'         },
  'redis':           { label: 'Redis',                 path: '/redis'           },
  'graphql':         { label: 'GraphQL',               path: '/graphql'         },
  'messaging':       { label: 'Messaging & Events',    path: '/messaging'       },
  'design-patterns': { label: 'Design Patterns',       path: '/design-patterns' },
  'arch-patterns':   { label: 'Architecture Patterns', path: '/arch-patterns'   },
  'api-design':      { label: 'API Design',            path: '/api-design'      },
  'system-design':   { label: 'System Design',         path: '/system-design'   },
  'security':        { label: 'Security & Auth',       path: '/security'        },
  'observability':   { label: 'Observability & SRE',   path: '/observability'   },
  'devops':          { label: 'Git & DevOps',          path: '/devops'          },
  'linux':           { label: 'Linux & Bash',          path: '/linux'           },
  'containers':      { label: 'Docker & Kubernetes',   path: '/containers'      },
  'terraform':       { label: 'Terraform / IaC',       path: '/terraform'       },
  'azure':           { label: 'Azure',                 path: '/azure'           },
  'aws':             { label: 'AWS',                   path: '/aws'             },
  'service-mesh':    { label: 'Service Mesh & Istio',  path: '/service-mesh'    },
  'dsa':             { label: 'DSA',                   path: '/dsa'             },
  'testing-hub':     { label: 'Testing',               path: '/testing-hub'     },
  'ai':              { label: 'AI & LLMs',             path: '/ai'              },
};

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (segments().length > 0) {
      <nav class="breadcrumb" aria-label="breadcrumb">
        <a routerLink="/" class="bc-home" title="Home">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
          </svg>
        </a>
        @if (techSection()) {
          <span class="bc-sep">›</span>
          @if (segments().length > 1) {
            <a [routerLink]="techSection()!.path" class="bc-section-link">{{ techSection()!.label }}</a>
          } @else {
            <span class="bc-current">{{ techSection()!.label }}</span>
          }
        }
        @if (segments().length > 1) {
          <span class="bc-sep">›</span>
          <span class="bc-current">{{ pageLabel() }}</span>
        }
      </nav>
    }`,
  styles: [`
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: .3rem;
      padding: .7rem 1.25rem .3rem;
      font-size: .82rem;
      color: #9ca3af;
    }
    .bc-home {
      display: flex;
      align-items: center;
      color: #6366f1;
      text-decoration: none;
      padding: 2px 4px;
      border-radius: 4px;
      transition: background .12s;
      &:hover { background: #f0f0ff; color: #4338ca; }
    }
    .bc-sep { color: #d1d5db; font-size: .9rem; }
    .bc-section-link {
      color: #6366f1;
      font-size: .82rem;
      font-weight: 600;
      text-decoration: none;
      padding: 2px 4px;
      border-radius: 4px;
      transition: background .12s;
      &:hover { background: #f0f0ff; color: #4338ca; }
    }
    .bc-current {
      color: #374151;
      font-weight: 600;
      font-size: .82rem;
    }
  `],
})
export class BreadcrumbComponent {
  private router = inject(Router);

  segments = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.url.replace(/\?.*/, '').split('/').filter(Boolean)),
    ),
    { initialValue: [] as string[] },
  );

  techSection = () => {
    const segs = this.segments();
    return segs.length > 0 ? (TECH_SECTIONS[segs[0]] ?? null) : null;
  };

  pageLabel = () => {
    const segs = this.segments();
    if (segs.length < 2) return '';
    const key = segs[segs.length - 1];
    const labels = segs[0] === 'csharp'      ? CSHARP_LABELS
                 : segs[0] === 'aspnet'      ? ASPNET_LABELS
                 : segs[0] === 'sql'         ? SQL_LABELS
                 : segs[0] === 'typescript'  ? TYPESCRIPT_LABELS
                 : segs[0] === 'react'       ? REACT_LABELS
                 : segs[0] === 'javascript'  ? JAVASCRIPT_LABELS
                 : segs[0] === 'html'        ? HTML_LABELS
                 : ROUTE_LABELS;
    return labels[key] ?? key;
  };
}
