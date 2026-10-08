import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-workspace-became-projects',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './workspace-became-projects.html',
  styleUrl: './workspace-became-projects.scss'
})
export class WorkspaceBecameProjectsSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Same idea, new home",
      "points": [
        "The idea in the quiz is still right: one Vitest run can apply different settings (environment, setup files) to different parts of a repository and produce one report.",
        "The Vitest migration guide says the <code>workspace</code> option was renamed to <code>projects</code> in 3.2, with the difference that you can no longer point to a separate file. Migration guides for 4.0 list the <code>vitest.workspace.ts</code> file and <code>defineWorkspace</code> as removed.",
        "In the installed Vitest 5.0.3 package, the config types declare <code>projects?: TestProjectConfiguration[]</code>, and a search of its <code>dist</code> folder finds no mention of <code>vitest.workspace</code> or <code>defineWorkspace</code>.",
        "The quiz now asks about <code>test.projects</code> and notes the old file name, so readers following older tutorials know what to look for."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Before (Vitest 3.1 and older)",
      "language": "typescript",
      "code": "// vitest.workspace.ts\nimport { defineWorkspace } from 'vitest/config';\n\nexport default defineWorkspace([\n  'packages/*',\n  { test: { name: 'web', environment: 'jsdom', include: ['apps/web/**/*.test.ts'] } },\n]);"
    },
    {
      "label": "Now",
      "language": "typescript",
      "code": "// vitest.config.ts (repository root)\nimport { defineConfig } from 'vitest/config';\n\nexport default defineConfig({\n  test: {\n    projects: [\n      'packages/*',\n      { test: { name: 'web', environment: 'jsdom', include: ['apps/web/**/*.test.ts'] } },\n      { test: { name: 'api', environment: 'node',  include: ['apps/api/**/*.test.ts'] } },\n    ],\n  },\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "After upgrading, a monorepo with a <code>vitest.workspace.ts</code> runs every test with the root config's default <code>node</code> environment, so the DOM tests fail. Why, and what is the fix?",
    "hint": "Think about which file the new version actually reads.",
    "solution": "The new version no longer reads vitest.workspace.ts, so the per-project environments in it are ignored and every file runs under the root config. Move the list into test.projects in vitest.config.ts (or vite.config.ts) and delete the old file."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Projects are a new feature that replaces workspaces with different behaviour.",
      "reality": "They are the same feature under a new name, configured inline in the root config instead of in a separate file."
    },
    {
      "thought": "Each project needs its own Vitest process and report.",
      "reality": "One run executes every project and merges the results into one report and one watch session."
    }
  ];
}
