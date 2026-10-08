import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-networkidle-discouraged',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './networkidle-discouraged.html',
  styleUrl: './networkidle-discouraged.scss'
})
export class NetworkidleDiscouragedSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "From the typings and a real run",
      "points": [
        "The Playwright 1.64 typings describe <code>'networkidle'</code> as \"DISCOURAGED - consider operation to be finished when there are no network connections for at least 500 ms. Don't use this method for testing, rely on web assertions to assess readiness instead.\"",
        "The \"at most 2 connections\" rule comes from Puppeteer, where it is called <code>networkidle2</code>. Playwright has no such option.",
        "In a real Chromium run, a page that fetched <code>/poll</code> every 300 ms made <code>page.goto(url, { waitUntil: 'networkidle', timeout: 3000 })</code> fail after 3002 ms, while waiting for its heading took 44 ms.",
        "The page's QnA now describes the real rule and recommends web-first assertions or <code>waitForResponse()</code>."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Before",
      "language": "typescript",
      "code": "// Never settles if the page polls every 300 ms\nawait page.goto('/dashboard', { waitUntil: 'networkidle' });"
    },
    {
      "label": "After",
      "language": "typescript",
      "code": "await page.goto('/dashboard');\nawait expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();\n\n// Or wait for one request you care about\nconst res = page.waitForResponse(r => r.url().endsWith('/api/orders') && r.ok());\nawait page.getByRole('button', { name: 'Refresh' }).click();\nawait res;"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Why should <code>page.waitForResponse()</code> be called before the click that triggers the request, not after it?",
    "hint": "What happens if the response arrives first?",
    "solution": "waitForResponse only sees responses that arrive after it starts listening. If you call it after the click and the response is fast, it has already arrived and the wait hangs until the timeout. Start the wait first, then click, then await the promise."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "networkidle allows up to two open connections.",
      "reality": "That is Puppeteer networkidle2. Playwright requires no connections for 500 ms."
    },
    {
      "thought": "networkidle is the safest way to know a page is ready.",
      "reality": "Playwright discourages it; assert on the content the test needs."
    }
  ];
}
