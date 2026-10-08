import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-testcontainers-image-and-stop',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './testcontainers-image-and-stop.html',
  styleUrl: './testcontainers-image-and-stop.scss'
})
export class TestcontainersImageAndStopSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Three problems in one beforeAll",
      "points": [
        "In the installed <code>@testcontainers/postgresql</code> 12.2, the constructor is declared <code>constructor(image: string)</code>. Calling it with no argument is a TypeScript error, and pinning the image is also what keeps the database version stable.",
        "The started container was a local variable inside <code>beforeAll</code> and <code>afterAll</code> only disconnected Prisma. Nothing called <code>container.stop()</code>, so cleanup depended entirely on Ryuk.",
        "<code>$executeRawUnsafe(\"-- run migrations here\")</code> runs an SQL comment and creates no tables, so <code>prisma.user.create</code> would fail. Running <code>prisma migrate deploy</code> against the new URL applies the real schema.",
        "The page's Testcontainers tab now has all three fixes. The Testing Fundamentals page's integration example follows the same pattern."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Fixed setup",
      "language": "typescript",
      "code": "let container: StartedPostgreSqlContainer;\nlet prisma: PrismaClient;\n\nbeforeAll(async () => {\n  container = await new PostgreSqlContainer('postgres:16').start();\n  process.env.DATABASE_URL = container.getConnectionUri();\n  execSync('npx prisma migrate deploy');\n  prisma = new PrismaClient();\n}, 60_000);\n\nafterAll(async () => {\n  await prisma.$disconnect();\n  await container.stop();\n});"
    },
    {
      "label": "One container for the whole run",
      "language": "typescript",
      "code": "// jest.globalSetup.ts — runs once before all test files\nexport default async function () {\n  const container = await new PostgreSqlContainer('postgres:16').start();\n  process.env.DATABASE_URL = container.getConnectionUri();\n  (globalThis as any).__PG__ = container;\n}\n\n// jest.globalTeardown.ts\nexport default async function () {\n  await (globalThis as any).__PG__.stop();\n}"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Why is the 60_000 passed as the second argument to <code>beforeAll</code>?",
    "hint": "Jest has a default timeout for hooks as well as tests.",
    "solution": "It raises the hook timeout to 60 seconds. Pulling the image and starting PostgreSQL can easily exceed Jest's default 5-second timeout on a cold CI runner, which would fail the hook before the container is ready."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Testcontainers always cleans up, so stop() is optional.",
      "reality": "Ryuk usually removes containers when the process exits, but it can be disabled. Stopping explicitly makes cleanup deterministic."
    },
    {
      "thought": "Any SQL statement is enough to initialise the schema.",
      "reality": "The tests need the real tables, so run your migration tool against the container."
    }
  ];
}
