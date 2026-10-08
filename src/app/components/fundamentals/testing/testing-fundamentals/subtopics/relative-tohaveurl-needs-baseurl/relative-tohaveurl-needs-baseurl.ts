import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-relative-tohaveurl-needs-baseurl',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './relative-tohaveurl-needs-baseurl.html',
  styleUrl: './relative-tohaveurl-needs-baseurl.scss'
})
export class RelativeToHaveUrlNeedsBaseUrlSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "How toHaveURL compares a string",
      "points": [
        "In Playwright 1.64 (installed for this check), <code>toHaveURL</code> reads <code>baseURL</code> from the browser context and passes it with the expected value to an internal <code>urlMatches(baseURL, url, expected)</code>. A string is turned into a pattern resolved against <code>baseURL</code>.",
        "Called directly against the current page URL <code>https://myapp.com/dashboard</code>: with no baseURL, the expected string <code>/dashboard</code> did not match; with baseURL <code>https://myapp.com</code> it matched; a RegExp <code>/\\/dashboard$/</code> matched either way.",
        "The main page's test called <code>page.goto(\"https://myapp.com/login\")</code> with a full URL, which suggests no baseURL was configured, and then asserted <code>toHaveURL(\"/dashboard\")</code>. Those two lines only work together if a baseURL exists. The page now uses <code>page.goto(\"/login\")</code> and says baseURL is set in the config.",
        "Using one baseURL also lets the same suite run against localhost, staging, and production by changing only the config or an environment variable."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "playwright.config.ts",
      "language": "typescript",
      "code": "import { defineConfig } from '@playwright/test';\n\nexport default defineConfig({\n  use: {\n    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',\n  },\n});"
    },
    {
      "label": "Test with relative URLs",
      "language": "typescript",
      "code": "test('login lands on the dashboard', async ({ page }) => {\n  await page.goto('/login');                       // resolved against baseURL\n  await page.getByLabel('Email').fill('alice@example.com');\n  await page.getByLabel('Password').fill('secret');\n  await page.getByRole('button', { name: 'Sign in' }).click();\n  await expect(page).toHaveURL('/dashboard');       // also resolved against baseURL\n});"
    },
    {
      "label": "Without a baseURL",
      "language": "typescript",
      "code": "// Measured with Playwright's own urlMatches(baseURL, currentUrl, expected):\n// current URL: https://myapp.com/dashboard\n// expected '/dashboard', baseURL undefined          -> false\n// expected '/dashboard', baseURL https://myapp.com  -> true\n// expected /\\/dashboard$/, baseURL undefined        -> true\n\nawait expect(page).toHaveURL(/\\/dashboard$/);  // safe with or without baseURL"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A suite has <code>baseURL: \"http://localhost:3000\"</code>. A test asserts <code>await expect(page).toHaveURL(\"/dashboard\")</code>, but the app redirects to <code>/dashboard?tab=overview</code>. Does the assertion pass? How would you write it to ignore the query string?",
    "hint": "A string expected URL is compared as a whole URL after being resolved against baseURL.",
    "solution": "It fails: the resolved expected URL is http://localhost:3000/dashboard, and the actual URL has ?tab=overview on the end, so the whole-URL comparison does not match. Use a RegExp such as /\\/dashboard(\\?.*)?$/ or a predicate: toHaveURL(url => url.pathname === \"/dashboard\")."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "<code>toHaveURL(\"/dashboard\")</code> checks that the path ends with /dashboard.",
      "reality": "A string is a whole-URL match (resolved against baseURL), not a suffix or substring check. Use a RegExp or a predicate for partial matches."
    },
    {
      "thought": "baseURL only affects <code>page.goto</code>.",
      "reality": "Playwright also resolves relative URLs in <code>toHaveURL</code>, <code>waitForURL</code>, and route patterns against baseURL."
    }
  ];
}
