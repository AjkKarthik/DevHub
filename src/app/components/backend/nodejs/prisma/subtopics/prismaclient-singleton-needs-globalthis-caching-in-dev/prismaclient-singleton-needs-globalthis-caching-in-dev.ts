import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './prismaclient-singleton-needs-globalthis-caching-in-dev.html',
  styleUrl: './prismaclient-singleton-needs-globalthis-caching-in-dev.scss'
})
export class PrismaclientSingletonNeedsGlobalthisCachingInDevSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mistake entry fixes "new PrismaClient() per request" with a plain module-level singleton (export const prisma = new PrismaClient()) — that fix is correct for a normal long-running server process, but Prisma\'s own documentation describes a SEPARATE problem this simple pattern does not solve',
      points: [
        'A plain module-level singleton relies on the JS module cache — a module is only evaluated once per process, so export const prisma = new PrismaClient() genuinely does create just one instance, for a normal server process that starts once and keeps running.',
        'Prisma\'s own official Next.js documentation identifies a specific scenario where this breaks down: development-mode HOT MODULE RELOADING. Every time a file is edited and hot-reloaded, the module can be RE-EVALUATED — re-running export const prisma = new PrismaClient() and creating a brand new PrismaClient instance (and its own connection pool) each time, without the OLD instance ever being cleaned up.',
        'The documented fix is caching the instance on globalThis instead of relying purely on module scope: check globalForPrisma.prisma first and reuse it if already present; only create a new PrismaClient() if one doesn\'t already exist on the global object. Critically, Prisma\'s own pattern only WRITES the instance back onto global when NODE_ENV !== "production" — in production, where hot-reloading doesn\'t happen, the plain module-singleton behavior is fine as-is.',
      ]
    },
    {
      heading: 'Why globalThis specifically, and what this pattern is (and isn\'t) documented to fix',
      points: [
        'globalThis persists across hot-module-reload cycles in a way a freshly re-evaluated module\'s local scope does not — each reload re-runs the module\'s top-level code, but globalThis itself is not reset by that reload, making it the correct place to stash an instance that needs to survive across reloads within the same running dev-server process.',
        'This exact globalThis pattern is documented by Prisma specifically in the context of Next.js development hot-reloading exhausting database connections — that is the scenario their official docs describe and solve. Applying the same underlying idea (cache the instance somewhere that survives across repeated cold-start-like re-initialization) to other environments with a similar repeated-instantiation risk, like certain serverless function invocation patterns, is a reasonable extension of the same principle, but it is worth being precise that Prisma\'s own cited documentation is specifically about the Next.js dev hot-reload case, not a general serverless guarantee.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own fix — correct for production, incomplete for dev hot-reload',
      language: 'typescript',
      code: `// db.ts — the main page's own recommended singleton fix
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();

// In a normal, long-running server process, this module is
// evaluated exactly once — genuinely one PrismaClient instance,
// one connection pool, for the lifetime of the process.
//
// In a dev server with hot-module-reloading enabled, editing ANY
// file that (transitively) imports this module can cause it to be
// RE-EVALUATED — silently creating a NEW PrismaClient instance (and
// a new connection pool) on top of the old one, which is never
// explicitly disposed of. Repeated edits during a dev session can
// exhaust the database's available connections.`,
    },
    {
      label: 'Prisma\'s own documented fix: cache on globalThis',
      language: 'typescript',
      code: `// db.ts — Prisma's own recommended pattern for Next.js dev mode
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Only cache on globalThis OUTSIDE production — in production there
// is no hot-reloading, so the plain module-singleton behavior from
// the version above is already correct and sufficient there.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Now, across a hot-reload cycle: the module re-evaluates, but
// globalForPrisma.prisma ?? new PrismaClient() finds the EXISTING
// instance already sitting on globalThis (which the reload does NOT
// reset) and reuses it, instead of creating a new one every time.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer, following the main page\'s own singleton fix exactly (export const prisma = new PrismaClient() in a db.ts module), notices that during a long local development session — editing and saving files repeatedly, with hot-module-reloading enabled — their database\'s connection count in a monitoring dashboard steadily climbs, eventually hitting the database\'s max-connections limit. In production (a normal long-running deployed process, no hot-reloading), the exact same code has never shown this problem. Explain why the same singleton code behaves differently in these two environments, and what Prisma\'s own documented fix is.',
    hint: 'Does a JS module get re-evaluated more than once during a normal, long-running production process? Does hot-module-reloading in a dev server cause modules to be re-evaluated repeatedly as files change?',
    solution: 'In a normal, long-running production process, the db.ts module is evaluated exactly once when the server starts — export const prisma = new PrismaClient() genuinely creates a single instance for the entire process lifetime, which is why the code has never shown a problem there. In local development with hot-module-reloading enabled, editing and saving files can cause modules to be RE-EVALUATED repeatedly without the process itself restarting — each re-evaluation of db.ts runs export const prisma = new PrismaClient() again, creating a brand new PrismaClient instance (and a new underlying connection pool) on top of whichever ones were already created by previous reloads, with no automatic cleanup of the old ones. Over a long editing session with many saves, this steadily accumulates connections until the database\'s connection limit is hit — exactly the symptom described. Prisma\'s own documented fix, specific to this Next.js development hot-reloading scenario, is caching the PrismaClient instance on globalThis (which survives module re-evaluation, unlike the module\'s own local scope) and reusing it on every re-evaluation instead of constructing a fresh one — only writing to globalThis when NODE_ENV is not "production," since production\'s single-evaluation behavior never had this problem to begin with.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own module-level singleton pattern (export const prisma = new PrismaClient()) is a complete, universally-safe fix for the "new PrismaClient() per request" mistake, in every environment.',
      reality: 'This subtopic\'s theory and code example both show this pattern is correct for a normal long-running server process but incomplete for development environments with hot-module-reloading, where Prisma\'s own documentation identifies module re-evaluation as a separate source of repeated PrismaClient instantiation.'
    },
    {
      thought: 'Since a JavaScript module is only evaluated once per process by the module cache, a module-level singleton can never accidentally create multiple instances, regardless of the surrounding tooling or environment.',
      reality: 'This subtopic\'s exercise shows the opposite in a real, documented scenario — hot-module-reloading in a dev server can cause a module to be RE-EVALUATED multiple times within the same running process, each re-evaluation re-running the module-level singleton code and creating a new instance.'
    },
    {
      thought: 'Prisma\'s documented globalThis-caching pattern should always write the PrismaClient instance to globalThis, in every environment, to be safe.',
      reality: 'This subtopic\'s code example shows the opposite — Prisma\'s own recommended pattern explicitly writes to globalThis only when NODE_ENV is not "production," since production\'s normal single-module-evaluation behavior doesn\'t have the hot-reload problem this pattern exists to solve.'
    }
  ];
}
