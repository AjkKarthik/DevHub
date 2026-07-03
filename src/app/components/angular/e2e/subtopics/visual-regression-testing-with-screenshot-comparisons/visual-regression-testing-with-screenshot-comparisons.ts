import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-visual-regression-testing-with-screenshot-comparisons-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './visual-regression-testing-with-screenshot-comparisons.html',
  styleUrl: './visual-regression-testing-with-screenshot-comparisons.scss',
})
export class VisualRegressionTestingWithScreenshotComparisonsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A whole assertion category the main topic never touches',
      points: [
        'Every assertion in the main E2E page checks STRUCTURE and TEXT — <code>toBeVisible()</code>, <code>toHaveText()</code>, <code>toHaveURL()</code> — none of it catches a PURELY VISUAL regression: a CSS change that breaks alignment, a color that silently reverts, a layout that overflows on a specific viewport, or a font that fails to load. All of those can leave the DOM structure and text content completely unchanged while the page looks visibly broken.',
        '<code>await expect(page).toHaveScreenshot()</code> is Playwright\'s built-in visual regression assertion — it captures a screenshot, compares it pixel-by-pixel against a previously-committed BASELINE image, and fails the test if the difference exceeds a configurable threshold.',
      ],
    },
    {
      heading: 'Baselines, thresholds, and updating expected images',
      points: [
        'The first run of <code>toHaveScreenshot()</code> for a given test has no baseline yet — Playwright generates one automatically and the test PASSES (nothing to compare against). Commit that generated baseline image (found under <code>test-name-snapshots/</code>) to version control — it becomes the reference every future run compares against.',
        'When a change is INTENTIONAL (a deliberate redesign), regenerate baselines with <code>npx playwright test --update-snapshots</code> — this overwrites the committed baseline images with the current render, which you then review and commit like any other code change.',
        '<code>maxDiffPixelRatio</code> (or <code>maxDiffPixels</code>) in the assertion options sets an ACCEPTABLE tolerance — anti-aliasing differences and minor font-rendering variance between machines can produce a handful of differing pixels even with zero real change; set a small non-zero tolerance rather than demanding byte-for-byte pixel identity, which is rarely achievable across different OS/GPU rendering.',
      ],
    },
    {
      heading: 'The cross-platform rendering trap',
      points: [
        'Font rendering, anti-aliasing, and even color subpixel handling differ between operating systems — a baseline captured on a developer\'s macOS laptop will near-certainly FAIL when compared against a screenshot taken in a Linux-based CI runner, even with zero actual visual change. This is the single most common real-world visual-testing failure mode, and it looks exactly like a false positive bug report.',
        'The standard fix: generate and update baselines FROM WITHIN THE SAME ENVIRONMENT that CI uses to run the comparison — typically a Docker container matching Playwright\'s official image, or by running <code>--update-snapshots</code> as a CI job itself and committing the resulting artifact back, rather than ever generating baselines on a developer\'s local machine.',
      ],
    },
    {
      heading: 'Scoping screenshots — full page vs specific elements, and masking dynamic content',
      points: [
        '<code>await expect(page).toHaveScreenshot()</code> captures the current viewport by default; pass <code>&#123; fullPage: true &#125;</code> to capture the ENTIRE scrollable page. For a single component under test, prefer <code>await expect(locator).toHaveScreenshot()</code> on a specific element — a smaller, more focused image is faster to compare, less likely to be polluted by unrelated page content, and produces a much smaller diff image when it DOES fail.',
        'Dynamic content (a live timestamp, a randomly-generated avatar, an ever-changing ad banner) breaks pixel comparison by design — every run produces a different pixel. Use the <code>mask</code> option: <code>&#123; mask: [page.getByTestId(\'live-clock\')] &#125;</code> draws a solid box over the specified locator(s) before comparing, excluding that region from the diff entirely while still verifying everything else on the page.',
        'For components with CSS animations or transitions, either wait for the animation to settle before capturing, or set <code>animations: \'disabled\'</code> in the screenshot options — Playwright then finishes all CSS transitions and freezes animations at their end state before capturing, producing a deterministic image regardless of animation timing.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'e2e/dashboard-visual.spec.ts',
      content: `import { test, expect } from '@playwright/test';

test.describe('Dashboard visual regression', () => {
  test('full page matches the committed baseline', async ({ page }) => {
    await page.goto('/dashboard');

    // First run with no baseline generates one automatically and PASSES.
    // Commit the generated PNG under dashboard-visual.spec.ts-snapshots/
    // to version control — every future run compares against it.
    await expect(page).toHaveScreenshot('dashboard-full.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01, // small tolerance for anti-aliasing variance
    });
  });

  test('the stats card matches, ignoring the live-updating timestamp', async ({ page }) => {
    await page.goto('/dashboard');

    const statsCard = page.getByTestId('stats-card');

    await expect(statsCard).toHaveScreenshot('stats-card.png', {
      // Masks out the region so a changing timestamp never fails the diff —
      // everything else in the card is still compared pixel-by-pixel.
      mask: [page.getByTestId('last-updated-time')],
    });
  });

  test('the animated notification banner matches at its settled end state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Show notification' }).click();

    const banner = page.getByRole('alert');

    await expect(banner).toHaveScreenshot('notification-banner.png', {
      // Finishes CSS transitions and freezes animations before capturing —
      // without this, the slide-in animation's timing makes every run differ.
      animations: 'disabled',
    });
  });
});
`,
    },
    {
      path: 'playwright.config.ts',
      content: `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  // Applies to every toHaveScreenshot() call unless overridden per-assertion.
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    },
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'ng serve',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
  },
});

// Regenerate baselines after an intentional visual change — run this from
// WITHIN the same environment CI uses (e.g. a matching Docker container),
// never from a developer's local OS, to avoid cross-platform font-rendering
// false positives:
//   npx playwright test --update-snapshots
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Visual regression testing with screenshot comparisons</h3>
    <p>
      This demo shows Playwright's toHaveScreenshot() config side —
      dashboard-visual.spec.ts and playwright.config.ts. Open those files to see
      full-page, element-scoped, masked, and animation-settled screenshot assertions.
    </p>
  \`,
})
export class App {}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Visual Regression Testing with Screenshot Comparisons</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a visual regression test for a dark-mode toggle — after clicking a "Toggle dark mode" button, assert the full page matches a SEPARATE baseline named <code>dashboard-dark.png</code>, so light and dark mode each get their own independently-tracked baseline image.',
    hint: 'Add a new test that navigates to /dashboard, clicks the dark-mode toggle button, waits for the class/attribute change to apply, then calls await expect(page).toHaveScreenshot(\'dashboard-dark.png\', { fullPage: true }) — a different filename argument creates a completely separate baseline from the light-mode one.',
    solution: `test('dark mode matches its own separate baseline', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Toggle dark mode' }).click();

  // Give the theme class change a moment to apply (or wait for a specific
  // attribute/class if the toggle isn't instantaneous).
  await expect(page.locator('body')).toHaveClass(/dark/);

  await expect(page).toHaveScreenshot('dashboard-dark.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.01,
  });
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a Playwright test suite asserts on visible text and DOM structure (toBeVisible, toHaveText), it has full coverage of what a user actually sees.',
      reality: 'a CSS regression — broken alignment, a wrong color, an overflow on a specific viewport — can leave text content and DOM structure completely unchanged while the page looks visibly broken. Only a pixel-level screenshot comparison (toHaveScreenshot) catches this class of bug.',
    },
    {
      thought: 'a visual regression test failing in CI always means a real, unintended visual bug was introduced.',
      reality: 'the single most common real-world failure is a baseline generated on one OS (e.g. a developer\'s macOS laptop) being compared against a CI run on a different OS (e.g. Linux) — font rendering and anti-aliasing differ across platforms, producing false failures with zero actual visual change.',
    },
    {
      thought: 'a page with a live-updating value (a timestamp, a random avatar) or a CSS animation cannot be reliably visual-regression tested at all.',
      reality: 'the mask option excludes specific dynamic regions from the pixel comparison while still checking everything else on the page, and animations: \'disabled\' freezes CSS transitions at their settled end state before capturing — both make otherwise-nondeterministic content testable.',
    },
  ];
}
