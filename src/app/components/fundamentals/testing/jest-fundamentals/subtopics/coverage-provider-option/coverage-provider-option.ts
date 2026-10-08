import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-coverage-provider-option',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './coverage-provider-option.html',
  styleUrl: './coverage-provider-option.scss'
})
export class CoverageProviderOptionSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "What each tool expects",
      "points": [
        "The Jest Configuration theory said <code>coverage.provider: \"babel\" or \"v8\"</code>. In Jest 30's <code>jest-config</code> package the defaults object has a top-level <code>coverageProvider: \"babel\"</code> entry, and there is no nested <code>coverage</code> object.",
        "Vitest nests coverage settings: <code>test: { coverage: { provider: \"v8\" } }</code>. That is where the dotted name comes from.",
        "With <code>\"babel\"</code>, Jest instruments files through Babel using Istanbul. With <code>\"v8\"</code>, it reads the coverage V8 collects while running, so files are not instrumented first.",
        "The old text also said Babel \"gives branch coverage for non-ESM\", which is not a documented distinction. Both providers report branch coverage; the page now describes the real difference."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Jest",
      "language": "typescript",
      "code": "// jest.config.ts\nimport type { Config } from 'jest';\n\nconst config: Config = {\n  collectCoverage: true,\n  coverageProvider: 'v8',            // default is 'babel'\n  coverageThreshold: { global: { branches: 70, lines: 80 } },\n};\n\nexport default config;"
    },
    {
      "label": "Vitest",
      "language": "typescript",
      "code": "// vitest.config.ts\nimport { defineConfig } from 'vitest/config';\n\nexport default defineConfig({\n  test: {\n    coverage: {\n      provider: 'v8',               // or 'istanbul'\n      thresholds: { branches: 70, lines: 80 },\n    },\n  },\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A team moving from Vitest to Jest copies <code>coverage: { provider: \"v8\" }</code> into jest.config.ts. Which provider does Jest actually use, and how would they notice?",
    "hint": "Jest only reads the key it knows about.",
    "solution": "Jest ignores the unknown coverage key and uses its default, babel. Jest prints an unknown-option validation warning when it starts, and the coverage numbers come from Istanbul instrumentation rather than V8. Rename it to coverageProvider: \"v8\"."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Jest and Vitest share the same configuration shape.",
      "reality": "Vitest's API is Jest-compatible for tests, not for configuration. Coverage, environment and setup options are named differently."
    },
    {
      "thought": "Only the v8 provider reports branch coverage.",
      "reality": "Both providers report statements, branches, functions and lines."
    }
  ];
}
