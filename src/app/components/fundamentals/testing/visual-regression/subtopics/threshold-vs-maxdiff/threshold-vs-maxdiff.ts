import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-threshold-vs-maxdiff',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './threshold-vs-maxdiff.html',
  styleUrl: './threshold-vs-maxdiff.scss'
})
export class ThresholdVsMaxDiffSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "From the Playwright 1.64 typings",
      "points": [
        "The <code>threshold</code> option is documented as \"an acceptable perceived color difference between the same pixel in compared images, ranging from 0 (strict) and 1 (lax)\", computed in YIQ colour space by the pixelmatch comparator, with a default of 0.2.",
        "So it answers \"how different must one pixel be to count as different?\", not \"how many pixels may differ?\". The page's comment \"10% pixel difference tolerance\" and the mistake \"threshold: 0.9 // 90% diff allowed\" mixed the two up.",
        "The area limits are <code>maxDiffPixels</code> (a count) and <code>maxDiffPixelRatio</code> (0 to 1). A pixel counts towards them only after it passes the <code>threshold</code> test.",
        "The page now uses <code>maxDiffPixelRatio: 0.01</code> in its example and Challenge, and the mistake explains both options."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Two different knobs",
      "language": "typescript",
      "code": "await expect(page).toHaveScreenshot('home.png', {\n  threshold: 0.2,            // per pixel: how big a colour change counts (default)\n  maxDiffPixelRatio: 0.01,   // whole image: at most 1% of pixels may differ\n});\n\n// threshold: 0.9 does NOT mean '90% of pixels may differ' -\n// it means nearly every colour change is ignored, on every pixel."
    },
    {
      "label": "Global defaults",
      "language": "typescript",
      "code": "// playwright.config.ts\nexport default defineConfig({\n  expect: {\n    toHaveScreenshot: { maxDiffPixels: 50 },\n  },\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A button's background changes from #3b82f6 to a slightly darker #3778e8 by mistake. Which setting decides whether Playwright notices: threshold or maxDiffPixelRatio?",
    "hint": "First a pixel has to count as different at all.",
    "solution": "threshold. If the colour change is below the threshold, none of the button's pixels count as different and maxDiffPixelRatio never comes into play. A lax threshold (like 0.9) would hide it; the default 0.2 or lower is more likely to flag it."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "threshold: 0.1 allows 10% of the screenshot to change.",
      "reality": "It sets per-pixel colour sensitivity. Use maxDiffPixelRatio: 0.1 for \"10% of pixels\"."
    },
    {
      "thought": "A stricter threshold always means a better test.",
      "reality": "Too strict and anti-aliasing differences between machines fail the test; the default 0.2 exists for that."
    }
  ];
}
