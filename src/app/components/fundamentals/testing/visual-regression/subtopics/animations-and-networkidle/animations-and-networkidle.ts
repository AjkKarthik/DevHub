import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-animations-and-networkidle',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './animations-and-networkidle.html',
  styleUrl: './animations-and-networkidle.scss'
})
export class AnimationsAndNetworkidleSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "From the Playwright 1.64 typings",
      "points": [
        "The <code>animations</code> option of <code>toHaveScreenshot</code> \"defaults to disabled\", which stops CSS animations, CSS transitions and Web Animations before the capture. The page's injected stylesheet does the same job and is only needed for <code>page.screenshot()</code>.",
        "The <code>--force-prefers-reduced-motion</code> launch flag in the Freeze Animations tab only affects CSS written inside <code>@media (prefers-reduced-motion)</code>; it does not freeze anything on its own. The tab now says so.",
        "The <code>waitForLoadState</code> docs list <code>\"networkidle\"</code> as \"DISCOURAGED\", recommending web-first assertions instead. The page now waits for the content it compares, such as the main region or a heading.",
        "<code>toHaveScreenshot</code> also retries: it takes screenshots until two consecutive ones match before comparing with the baseline, which absorbs late layout shifts."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Before",
      "language": "typescript",
      "code": "await page.goto('/');\nawait page.waitForLoadState('networkidle');          // discouraged\nawait page.addStyleTag({ content: '* { animation-duration: 0s !important; }' });\nawait expect(page).toHaveScreenshot('home.png');"
    },
    {
      "label": "After",
      "language": "typescript",
      "code": "await page.goto('/');\nawait expect(page.getByRole('main')).toBeVisible();  // wait for real content\nawait expect(page).toHaveScreenshot('home.png');       // animations: 'disabled' by default"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A dashboard polls an API every 2 seconds. Why might <code>waitForLoadState(\"networkidle\")</code> make its visual test slow or flaky, and what would you wait for instead?",
    "hint": "networkidle needs a quiet period with no requests.",
    "solution": "networkidle waits for at least 500 ms with no network connections, which a 2-second poll may only reach briefly or by chance, so timing varies. Wait for the specific widget being compared, for example await expect(page.getByTestId(\"revenue-chart\")).toBeVisible(), and mock or pause the polling for the test."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Screenshots need injected CSS to stop animations.",
      "reality": "toHaveScreenshot disables them by default; the CSS trick is for page.screenshot()."
    },
    {
      "thought": "networkidle is the safest wait.",
      "reality": "Playwright discourages it; waiting for visible content is faster and more reliable."
    }
  ];
}
