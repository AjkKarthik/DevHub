import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-findby-one-second',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './findby-one-second.html',
  styleUrl: './findby-one-second.scss'
})
export class FindByOneSecondSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Measured with @testing-library/dom 10.4",
      "points": [
        "<code>getConfig().asyncUtilTimeout</code> is 1000 by default. findBy queries are <code>waitFor</code> plus a getBy query, so they share that limit.",
        "With an element added after 1500 ms, <code>findByText(\"Late\")</code> rejected after about 1001 ms with \"Unable to find an element with the text: Late\". The same query with <code>{ timeout: 3000 }</code> found it.",
        "The page's mistake \"Using getBy* for async elements\" is correct, but its explanation \"polls until the element appears\" leaves out the limit. Slow mocked APIs, debounced inputs and animations are where the default bites.",
        "Raising the timeout everywhere hides slow tests. Prefer fixing slow mocks or using fake timers, and raise it per query where a delay is genuinely expected."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measured",
      "language": "typescript",
      "code": "import { screen, getConfig } from '@testing-library/dom';\n\ngetConfig().asyncUtilTimeout;   // 1000\n\nsetTimeout(() => { document.body.innerHTML = '<p>Late</p>'; }, 1500);\n\nawait screen.findByText('Late');\n// rejects after ~1001 ms: Unable to find an element with the text: Late\n\nawait screen.findByText('Late', {}, { timeout: 3000 });   // found"
    },
    {
      "label": "Suite-wide setting",
      "language": "typescript",
      "code": "// test/setup.ts\nimport { configure } from '@testing-library/react';\n\nconfigure({ asyncUtilTimeout: 2000 });"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A search box debounces input by 300 ms and the mocked API answers after 900 ms. Will <code>await screen.findByRole(\"listitem\")</code> right after typing succeed with the default settings?",
    "hint": "Add the delays and compare with the default timeout.",
    "solution": "No. The results appear about 1200 ms after typing, beyond the 1000 ms default, so the query rejects. Pass { timeout: 2000 }, shorten the mocked delay, or use fake timers and advance them past the debounce."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "findBy waits as long as it takes.",
      "reality": "It waits up to asyncUtilTimeout, 1000 ms by default, then fails."
    },
    {
      "thought": "A timeout failure means the element never renders.",
      "reality": "It may render later than the limit; the error looks the same either way."
    }
  ];
}
