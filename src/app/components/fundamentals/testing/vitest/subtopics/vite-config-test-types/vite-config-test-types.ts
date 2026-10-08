import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-vite-config-test-types',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './vite-config-test-types.html',
  styleUrl: './vite-config-test-types.scss'
})
export class ViteConfigTestTypesSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Where the test key comes from",
      "points": [
        "Vite's <code>UserConfig</code> type knows about plugins, server, build and so on, but not about tests. In the installed Vitest 5 package, <code>dist/config.d.ts</code> contains <code>declare module \"vite\" { interface UserConfig { test?: VitestInlineConfig } }</code>.",
        "That module augmentation only applies when those types are loaded. Importing <code>defineConfig</code> from <code>vite</code> alone does not load them, so TypeScript reports that <code>test</code> does not exist in the config type.",
        "The fix the Vitest docs give is a triple-slash reference, <code>/// &lt;reference types=\"vitest/config\" /&gt;</code>, at the top of <code>vite.config.ts</code>. Importing <code>defineConfig</code> from <code>vitest/config</code> loads the same types.",
        "The page's example labelled \"Option 1: extend from vite.config.ts\" now includes the reference and a comment explaining why."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Option 1: vite.config.ts",
      "language": "typescript",
      "code": "/// <reference types=\"vitest/config\" />\nimport { defineConfig } from 'vite';\n\nexport default defineConfig({\n  test: { environment: 'jsdom', globals: true },\n});"
    },
    {
      "label": "Option 2: vitest.config.ts",
      "language": "typescript",
      "code": "import { defineConfig, mergeConfig } from 'vitest/config';\nimport viteConfig from './vite.config';\n\nexport default mergeConfig(viteConfig, defineConfig({\n  test: { environment: 'jsdom', globals: true },\n}));"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A project has both <code>vite.config.ts</code> and <code>vitest.config.ts</code>. Which one does Vitest read, and what happens to the plugins in vite.config.ts if vitest.config.ts does not merge it?",
    "hint": "Vitest gives one file priority.",
    "solution": "Vitest reads vitest.config.ts and ignores vite.config.ts. Without mergeConfig, plugins such as the React or Angular plugin are not applied during tests, which can break JSX or decorator transforms. Merge the Vite config or repeat the plugins."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "A TypeScript error on <code>test</code> means Vitest will ignore the block.",
      "reality": "Vitest reads the block either way; the error only means the Vitest types were not loaded."
    },
    {
      "thought": "You must keep a separate vitest.config.ts.",
      "reality": "A test block in vite.config.ts with the type reference is enough for most projects."
    }
  ];
}
