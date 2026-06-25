import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-visual-regression',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './visual-regression.html',
  styleUrl: './visual-regression.scss',
})
export class VisualRegression {
  quickRef: QuickRefItem[] = [
    { name: 'toHaveScreenshot()',  type: 'method',  desc: 'Playwright: captures a screenshot and diffs against the stored baseline.' },
    { name: 'Chromatic',           type: 'keyword', desc: 'Cloud visual testing for Storybook — per-story pixel diffs in CI.' },
    { name: 'Percy',               type: 'keyword', desc: 'Cloud visual testing service with intelligent diffs and responsive snapshots.' },
    { name: 'Baseline',            type: 'keyword', desc: 'The approved "golden" screenshot all future runs are compared against.' },
    { name: 'Threshold',           type: 'keyword', desc: 'Allowed pixel difference percentage before a test fails.' },
    { name: 'Mask',                type: 'keyword', desc: 'Exclude dynamic regions (ads, timestamps) from the diff comparison.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'What Visual Regression Testing Catches', points: [
      'Unintended CSS changes — a class rename that shifts layout without breaking functionality.',
      'Font, colour, and spacing regressions invisible to DOM-based tests.',
      'Cross-browser rendering differences (Chromium vs WebKit vs Firefox).',
      'Responsive layout breakages at specific viewport widths.',
    ]},
    { heading: 'Playwright Visual Comparisons', points: [
      'await expect(page).toHaveScreenshot() captures a PNG and diffs pixel-by-pixel.',
      'First run: creates a baseline in __screenshots__/ directory.',
      'Subsequent runs: diff against baseline — fails if pixels differ beyond the threshold.',
      'Update baselines with npx playwright test --update-snapshots.',
    ]},
    { heading: 'Chromatic (Storybook)', points: [
      'Chromatic tests every Storybook story in a cloud browser and diffs against the last accepted run.',
      'Each story is a visual test — no additional test code needed.',
      'Diffs are reviewed in the Chromatic UI — accept or reject changes per story.',
      'Integrates with GitHub PRs — blocks merge until visual changes are approved.',
    ]},
    { heading: 'Handling Dynamic Content', points: [
      'Mask dynamic regions: await expect(page).toHaveScreenshot({ mask: [page.locator(".timestamp")] })',
      'Freeze animations: page.addStyleTag({ content: "* { animation: none !important; transition: none !important; }" })',
      'Use deterministic data — seed the same data before every visual test.',
      'Wait for fonts and images to load before capturing: await page.waitForLoadState("networkidle").',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Playwright Screenshots', language: 'typescript', code:
`import { test, expect } from '@playwright/test';

test('homepage looks correct', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Full-page screenshot comparison
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    threshold: 0.1,  // 10% pixel difference tolerance
  });
});

test('button hover state', async ({ page }) => {
  await page.goto('/components/button');
  const btn = page.getByRole('button', { name: 'Submit' });
  await btn.hover();

  // Element-level screenshot
  await expect(btn).toHaveScreenshot('button-hover.png');
});

test('masks dynamic timestamp', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard.png', {
    mask: [page.locator('.last-updated')],  // exclude timestamp from diff
  });
});` },
    { label: 'Chromatic (Storybook)', language: 'typescript', code:
`// Button.stories.tsx — each story is automatically a visual test
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
};
export default meta;

export const Primary: StoryObj = {
  args: { label: 'Submit', variant: 'primary' },
};

export const Disabled: StoryObj = {
  args: { label: 'Submit', variant: 'primary', disabled: true },
};

// In CI: npx chromatic --project-token=\${CHROMATIC_TOKEN}
// Chromatic captures each story in Chrome and diffs against last approved run.` },
    { label: 'Freeze Animations', language: 'typescript', code:
`// playwright.config.ts — disable animations globally
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    // Freeze all CSS animations and transitions for stable screenshots
    launchOptions: {
      args: ['--force-prefers-reduced-motion'],
    },
  },
});

// Or per test — inject a style tag:
test('component without animations', async ({ page }) => {
  await page.goto('/my-component');

  await page.addStyleTag({
    content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
  });

  await expect(page.locator('.component')).toHaveScreenshot('stable.png');
});` },
    { label: 'Update Baselines', language: 'typescript', code:
`# First time — creates baseline screenshots
npx playwright test --update-snapshots

# View diff report after failures
npx playwright show-report

# CI-safe: only update locally, commit the PNG files
# Baselines are committed to git alongside test files:
# tests/
#   homepage.spec.ts
#   homepage.spec.ts-snapshots/
#     homepage-chromium.png  ← committed baseline
#     homepage-firefox.png
#     homepage-webkit.png

# Update only a specific test
npx playwright test homepage.spec.ts --update-snapshots` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Not waiting for page to settle before screenshotting', wrong: 'await page.goto("/"); await expect(page).toHaveScreenshot()', right: 'await page.goto("/"); await page.waitForLoadState("networkidle"); await expect(page).toHaveScreenshot()', explanation: 'Screenshots taken before fonts, images, or animations finish produce flaky diffs. Always wait for the page to be fully loaded and settled.' },
    { title: 'Not masking dynamic content', wrong: 'screenshot includes timestamps, ads, or user-specific data', right: 'mask: [page.locator(".timestamp"), page.locator(".ad-banner")]', explanation: 'Dynamic content changes every run, causing the baseline to differ even when nothing visual has changed intentionally.' },
    { title: 'Not committing baseline screenshots', wrong: '.gitignore: **-snapshots/', right: 'commit __screenshots__/ and *-snapshots/ directories to git', explanation: 'Baselines that are not committed means CI always creates a new baseline — every run passes vacuously without any comparison.' },
    { title: 'Setting threshold too high', wrong: 'threshold: 0.9 // 90% diff allowed', right: 'threshold: 0.01 to 0.05 for strict pixel matching, up to 0.1 for animation-heavy UIs', explanation: 'A 90% threshold lets major regressions pass. Start strict (1–5%) and increase only for specific known-flaky areas.' },
    { title: 'Running visual tests on every unit test run', wrong: 'visual tests in the same jest suite as unit tests', right: 'run visual tests separately in CI — after unit tests pass', explanation: 'Visual tests are slow (browser launch, screenshot, upload). Run them in a dedicated CI step after fast tests pass.' },
  ];

  challenge: Challenge = {
    title: 'Add Playwright visual tests with masking',
    language: 'typescript',
    description: 'Write a Playwright visual regression test for a /profile page. Take a full-page screenshot, mask the ".avatar-upload-date" and ".user-id" elements, and freeze CSS animations before capturing.',
    hints: [
      'Use page.addStyleTag to disable animations before screenshotting.',
      'Pass mask: [page.locator(".avatar-upload-date"), page.locator(".user-id")] to toHaveScreenshot.',
    ],
    starterCode:
`import { test, expect } from '@playwright/test';

test('profile page visual regression', async ({ page }) => {
  await page.goto('/profile');
  // 1. Wait for network to settle
  // 2. Freeze animations
  // 3. Take screenshot with dynamic areas masked
});`,
    solution:
`import { test, expect } from '@playwright/test';

test('profile page visual regression', async ({ page }) => {
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');

  // Freeze animations for stable screenshots
  await page.addStyleTag({
    content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }',
  });

  await expect(page).toHaveScreenshot('profile.png', {
    fullPage: true,
    threshold: 0.05,
    mask: [
      page.locator('.avatar-upload-date'),
      page.locator('.user-id'),
    ],
  });
});`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What does Playwright\'s toHaveScreenshot() do on the first run?', options: ['It fails — no baseline exists', 'It creates a baseline screenshot and passes', 'It uploads to a cloud service', 'It prompts you to approve the screenshot'], answer: 1, explanation: 'The first run creates the baseline PNG file in the snapshots directory and passes. Subsequent runs diff against this baseline and fail if the difference exceeds the threshold.' },
    { q: 'Why should you mask dynamic elements in visual tests?', options: ['To make tests run faster', 'Dynamic content (timestamps, user IDs) changes every run, causing false failures when nothing visual changed', 'Masking is required by Playwright', 'It reduces the screenshot file size'], answer: 1, explanation: 'A timestamp or ad banner changes on every page load. Without masking, the diff always shows a change even when the layout is identical — creating a constant false failure.' },
    { q: 'What is the main advantage of Chromatic over Playwright screenshots for component testing?', options: ['Chromatic is faster', 'Chromatic integrates directly with Storybook — every story is a visual test without extra code', 'Chromatic works without a browser', 'Playwright does not support visual testing'], answer: 1, explanation: 'Chromatic uses Storybook stories as visual test cases automatically. No additional test code is needed — just write stories and Chromatic diffs them in CI.' },
  ];

  qna: QnaItem[] = [
    { q: 'Should I use Playwright screenshots or Chromatic for visual testing?', a: 'Chromatic (or Percy) for component-level visual testing when you already use Storybook — zero extra test code. Playwright screenshots for page-level and flow-level visual tests (e.g. dashboard after login). Use both: Chromatic for components, Playwright for full-page scenarios.' },
    { q: 'How do I handle visual test failures in CI?', a: 'Playwright generates an HTML report with side-by-side diffs. Review it, fix the regression or update the baseline with --update-snapshots if the change was intentional, commit the new PNG, and re-run CI. Chromatic shows diffs in its own UI and blocks the PR until changes are accepted.' },
    { q: 'How do I make visual tests less flaky?', a: '1. Freeze all CSS animations. 2. Wait for networkidle before screenshotting. 3. Mask all dynamic content. 4. Use a fixed viewport size. 5. Use a fixed font (system fonts render differently across OS). 6. Seed deterministic data. Most flakiness comes from timing or dynamic content.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Visual regression tests capture pixel-perfect screenshots and fail when they change — Playwright for pages, Chromatic for Storybook stories.',
    mustKnow: [
      'toHaveScreenshot(): creates baseline on first run; diffs on subsequent runs',
      'Always waitForLoadState("networkidle") before capturing',
      'Freeze animations with CSS overrides or --force-prefers-reduced-motion',
      'mask: [] to exclude dynamic elements from diff',
      'Commit baseline PNGs to git — without them CI never compares',
      'Chromatic: Storybook-based visual testing with zero extra test code',
    ],
    interviewFocus: [
      'What visual regression tests catch that DOM-based tests miss',
      'How to handle flaky visual tests (animations, dynamic content)',
      'Playwright screenshots vs Chromatic — when to use each',
    ],
  };
}
