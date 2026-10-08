import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-integration-test-testcontainers',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './integration-test-testcontainers.html',
  styleUrl: './integration-test-testcontainers.scss'
})
export class IntegrationTestTestcontainersSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "What was missing",
      "points": [
        "The comment said \"service + real database via Testcontainers\", but the code had no Testcontainers import and no container. <code>new PrismaClient()</code> connects to whatever <code>DATABASE_URL</code> already points at, which is usually a shared developer database.",
        "With <code>@testcontainers/postgresql</code> (12.2 checked), <code>new PostgreSqlContainer(\"postgres:16\").start()</code> returns a started container whose <code>getConnectionUri()</code> gives a URL for a database nobody else uses. The image name is a required constructor argument in current versions.",
        "The example also never reset data between tests. The same page lists \"Shared mutable state between tests\" as a mistake; with a real database that means a <code>beforeEach</code> that clears the tables (or wraps each test in a rolled-back transaction).",
        "It never disconnected or stopped anything either, which leaves open handles and makes Jest report \"did not exit one second after the test run\". The fixed example disconnects Prisma and stops the container in <code>afterAll</code>."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Before (from the main page)",
      "language": "typescript",
      "code": "// Integration test: service + real database via Testcontainers\nlet prisma: PrismaClient;\n\nbeforeAll(async () => {\n  prisma = new PrismaClient(); // connected to test DB\n  service = new UserService(prisma);\n});\n// no container, no reset between tests, no teardown"
    },
    {
      "label": "After",
      "language": "typescript",
      "code": "import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';\nimport { execSync } from 'node:child_process';\n\nlet container: StartedPostgreSqlContainer;\nlet prisma: PrismaClient;\n\nbeforeAll(async () => {\n  container = await new PostgreSqlContainer('postgres:16').start();\n  process.env.DATABASE_URL = container.getConnectionUri();\n  execSync('npx prisma migrate deploy');\n  prisma = new PrismaClient();\n}, 60_000);\n\nbeforeEach(async () => {\n  await prisma.user.deleteMany();\n});\n\nafterAll(async () => {\n  await prisma.$disconnect();\n  await container.stop();\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Two tests in the fixed suite both create a user with email <code>alice@example.com</code>, and the column has a unique constraint. Remove the <code>beforeEach</code>. What happens, and does the result depend on test order?",
    "hint": "The container is shared by every test in the file.",
    "solution": "The second test to run fails with a unique-constraint violation because the first test's row is still there. Whichever test runs first passes, so the failure follows run order rather than either test being wrong. That order dependence is exactly what the beforeEach reset removes."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Naming Testcontainers in a comment is enough to make a test isolated.",
      "reality": "Isolation comes from actually starting a throwaway database and pointing the client at its connection URI. Otherwise the test uses whatever <code>DATABASE_URL</code> already contains."
    },
    {
      "thought": "A fresh container per file means tests in that file are independent.",
      "reality": "Tests in the same file still share the container. Reset data in <code>beforeEach</code> or use per-test transactions."
    }
  ];
}
