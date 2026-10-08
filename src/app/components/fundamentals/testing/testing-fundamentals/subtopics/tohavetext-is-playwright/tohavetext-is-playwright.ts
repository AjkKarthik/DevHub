import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-tohavetext-is-playwright',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './tohavetext-is-playwright.html',
  styleUrl: './tohavetext-is-playwright.scss'
})
export class ToHaveTextIsPlaywrightSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Two libraries, two matcher names",
      "points": [
        "The main page's \"Asserting implementation details\" mistake used <code>expect(screen.getByRole(\"status\")).toHaveText(\"Loading…\")</code> as the right answer. <code>screen.getByRole</code> is React Testing Library, so the assertion runs under Jest with the jest-dom matchers.",
        "The current jest-dom package exports <code>toHaveTextContent</code>. It has no <code>toHaveText</code>. Calling it fails with \"expect(...).toHaveText is not a function\", so the \"right\" example could never pass.",
        "<code>toHaveText</code> is a Playwright web-first assertion: <code>await expect(page.getByRole(\"status\")).toHaveText(\"Loading…\")</code>. It takes a Locator, is async, and retries until the text appears or the timeout expires.",
        "The underlying advice is still correct: assert on what the user sees (an accessible role and its text), not on component state. Only the matcher name was wrong; the page now uses <code>toHaveTextContent</code>."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "React Testing Library (jest-dom)",
      "language": "typescript",
      "code": "import { render, screen } from '@testing-library/react';\nimport '@testing-library/jest-dom';\nimport { Orders } from './Orders';\n\ntest('shows a loading status first', () => {\n  render(<Orders />);\n  // jest-dom matcher: synchronous, works on a DOM element\n  expect(screen.getByRole('status')).toHaveTextContent('Loading…');\n});\n\n// expect(screen.getByRole('status')).toHaveText('Loading…');\n// -> TypeError: expect(...).toHaveText is not a function"
    },
    {
      "label": "Playwright",
      "language": "typescript",
      "code": "import { test, expect } from '@playwright/test';\n\ntest('shows a loading status first', async ({ page }) => {\n  await page.goto('/orders');\n  // Playwright matcher: async, works on a Locator, auto-retries\n  await expect(page.getByRole('status')).toHaveText('Loading…');\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A teammate copies a Playwright assertion into a Jest + React Testing Library test: <code>await expect(screen.getByText(\"Saved\")).toHaveText(\"Saved\")</code>. Name both reasons it will not work, and write the jest-dom version.",
    "hint": "Think about which library provides the matcher, and what kind of object each matcher expects to receive.",
    "solution": "First, jest-dom has no toHaveText matcher, so the call throws \"toHaveText is not a function\". Second, Playwright matchers receive a Locator and are awaited; screen.getByText returns a plain DOM element synchronously. The jest-dom version is: expect(screen.getByText(\"Saved\")).toHaveTextContent(\"Saved\") with no await."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "<code>toHaveText</code> and <code>toHaveTextContent</code> are aliases, so either works anywhere.",
      "reality": "Each exists in exactly one library. jest-dom ships <code>toHaveTextContent</code>; Playwright ships <code>toHaveText</code> (and also <code>toContainText</code>)."
    },
    {
      "thought": "An unknown matcher just makes the assertion pass silently.",
      "reality": "Jest throws a TypeError for an unknown matcher, so the test fails. It never passed, which is how this kind of copy-paste slip gets noticed."
    }
  ];
}
