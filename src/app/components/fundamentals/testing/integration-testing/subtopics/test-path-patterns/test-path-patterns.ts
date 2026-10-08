import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-test-path-patterns',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './test-path-patterns.html',
  styleUrl: './test-path-patterns.scss'
})
export class TestPathPatternsSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "What the old flag does now",
      "points": [
        "The page's mistake recommended <code>jest --testPathPattern=unit</code> and <code>jest --testPathPattern=integration</code> to keep the fast and slow suites apart.",
        "Run with Jest 30 (jest-cli 30), <code>--testPathPattern=unit</code> printed \"Option testPathPattern was replaced by --testPathPatterns\" and exited with code 1. No tests ran. <code>--testPathPatterns=unit</code> ran the matching suite.",
        "The <code>jest-config</code> source lists <code>testPathPattern</code> among replaced options and notes that <code>--testPathPatterns</code> is only available on the command line.",
        "A CI script still using the old flag fails in a confusing way: the job is red, but no test failed. The page's mistake now uses the new flag name."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measured (Jest 30)",
      "language": "bash",
      "code": "$ jest --testPathPattern=unit\n  Option \"testPathPattern\" was replaced by \"--testPathPatterns\".\n  \"--testPathPatterns\" is only available as a command-line option.\n$ echo $?\n1\n\n$ jest --testPathPatterns=unit\nTest Suites: 1 passed, 1 total"
    },
    {
      "label": "Projects instead of path flags",
      "language": "typescript",
      "code": "// jest.config.ts\nexport default {\n  projects: [\n    { displayName: 'unit',        testMatch: ['<rootDir>/src/**/*.unit.test.ts'] },\n    { displayName: 'integration', testMatch: ['<rootDir>/src/**/*.int.test.ts'],\n      testTimeout: 30_000 },\n  ],\n};\n\n// jest --selectProjects unit"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A package.json has <code>\"test:int\": \"jest --testPathPattern=integration\"</code>. After upgrading to Jest 30 the CI job fails, but the log shows no failing test. Explain and fix.",
    "hint": "Check the exit code and the first lines of output.",
    "solution": "Jest 30 rejects the old flag, prints the replacement notice and exits with code 1 before running anything, so the job fails with zero tests run. Change the script to jest --testPathPatterns=integration."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "A renamed flag is ignored with a warning, so tests still run.",
      "reality": "Jest 30 exits with an error for the old flag, so nothing runs."
    },
    {
      "thought": "Path patterns are the only way to split unit and integration tests.",
      "reality": "Jest projects give each suite its own match patterns and settings, selectable with --selectProjects."
    }
  ];
}
