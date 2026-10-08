import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-action-timeout-zero',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './action-timeout-zero.html',
  styleUrl: './action-timeout-zero.scss'
})
export class ActionTimeoutZeroSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Three different timeouts",
      "points": [
        "The Playwright 1.64 typings document the <code>timeout</code> config as \"Timeout for each test in milliseconds. Defaults to 30 seconds.\" That budget covers the test function, its fixtures and its hooks together.",
        "The <code>expect.timeout</code> is documented as \"Default timeout for async expect matchers in milliseconds, defaults to 5000ms.\"",
        "Actions are different: <code>actionTimeout</code> and <code>navigationTimeout</code> default to <code>0</code>, which the typings describe as \"no timeout\". A click() on a button that never becomes enabled keeps retrying until the 30-second test timeout stops the whole test.",
        "In a real Chromium run, <code>locator.click({ timeout: 1500 })</code> on a disabled button failed after 1501 ms with \"Timeout 1500ms exceeded\". Without that option or an actionTimeout, it would only stop at the test timeout."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Config",
      "language": "typescript",
      "code": "// playwright.config.ts\nexport default defineConfig({\n  timeout: 30_000,            // whole test (default)\n  expect: { timeout: 5_000 }, // each expect() assertion (default)\n  use: {\n    actionTimeout: 10_000,     // default is 0 = no per-action limit\n    navigationTimeout: 15_000, // default is 0 as well\n  },\n});"
    },
    {
      "label": "Per call",
      "language": "typescript",
      "code": "// Fails after 1.5 s with: locator.click: Timeout 1500ms exceeded.\nawait page.locator('#submit').click({ timeout: 1500 });"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A test clicks a button that stays <code>disabled</code> forever. With no <code>actionTimeout</code> set and default config, roughly when does it fail, and what is the error about?",
    "hint": "Which limit is actually in force when actionTimeout is 0?",
    "solution": "After about 30 seconds, when the test timeout expires. The click keeps waiting for the button to become enabled because it has no limit of its own, so the failure is reported as the test exceeding its 30-second timeout rather than as a short action timeout."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Every action gives up after 30 seconds.",
      "reality": "The 30 seconds is the test timeout. Actions have no limit unless you set <code>actionTimeout</code> or pass <code>timeout</code>."
    },
    {
      "thought": "The 5-second default applies to clicks too.",
      "reality": "It applies to web-first <code>expect()</code> assertions only."
    }
  ];
}
