import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-automated-bundle-budget-enforcement-in-ci-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './automated-bundle-budget-enforcement-in-ci.html',
  styleUrl: './automated-bundle-budget-enforcement-in-ci.scss',
})
export class AutomatedBundleBudgetEnforcementInCiSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A static budget catches a big jump — it misses slow, steady creep',
      points: [
        'The main topic\'s <code>angular.json</code> budgets (a fixed <code>maximumWarning</code>/<code>maximumError</code> threshold) genuinely catch a SINGLE large regression — someone accidentally imports a 200KB library and the build fails immediately. What a static threshold CANNOT catch: ten separate PRs, each adding a modest 8KB, none individually crossing the warning threshold, that cumulatively bloat the bundle by 80KB over a few months with no single commit ever triggering a budget failure. This is the classic "boiling frog" bundle-size problem.',
        'The fix is comparing EACH PR\'s bundle size against the PREVIOUS baseline (typically the target branch\'s current size), not just against a fixed absolute number — flagging any PR that grows the bundle by more than a small percentage (e.g. 2%), even if the ABSOLUTE size is still well under the static budget.',
      ],
    },
    {
      heading: 'A CI job that posts a size-diff comment on every PR',
      points: [
        'The workflow: build the PR branch, extract the initial chunk\'s size from the build output (esbuild prints this directly in the terminal, or parse it from a <code>--stats-json</code> artifact), then build (or fetch a cached build of) the TARGET branch and compare the two numbers — post the diff as a PR comment: "Initial bundle: 342KB (+3.2KB, +0.9%)". This makes size impact VISIBLE to every reviewer on every PR, not just something discovered after the fact via a budget failure or, worse, a user complaint about slow load times.',
        'A size-diff comment is fundamentally different feedback than a budget PASS/FAIL — it does not need to BLOCK the PR (a legitimate new feature genuinely needs SOME bytes), but it makes the TRADE-OFF explicit and reviewable, turning "did this PR add unnecessary bloat" from an invisible, unasked question into a visible, discussable one directly in the code review.',
      ],
    },
    {
      heading: 'Combining trend tracking with the static budget — belt and suspenders',
      points: [
        'These two mechanisms are complementary, not competing: keep the STATIC <code>angular.json</code> budget as a hard backstop against any SINGLE large regression (the main topic\'s existing coverage), and ADD the percentage-based trend check as a softer, review-visible signal against gradual creep. Neither alone catches both failure modes — the static budget misses gradual creep entirely; a trend-only check without a hard ceiling could theoretically let the bundle grow indefinitely if every individual PR stays under the small percentage threshold.',
        'Store the historical bundle-size numbers somewhere durable (a small JSON file committed to the repo, updated on merge to the target branch, or a lightweight external tracking service) so the "previous baseline" comparison is meaningful across many PRs over time, not just comparable to whatever the CURRENT open PR happens to be diffing against.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'scripts/check-bundle-size.js',
      content: `#!/usr/bin/env node
// A minimal, framework-agnostic bundle-size trend checker.
// Run after \`ng build --configuration=production\` in CI.
const fs = require('fs');
const path = require('path');

const BASELINE_FILE = path.join(__dirname, '..', 'bundle-size-baseline.json');
const DIST_DIR = path.join(__dirname, '..', 'dist', 'my-app', 'browser');
const GROWTH_THRESHOLD_PERCENT = 2; // flag any growth over 2%

function getInitialChunkSize() {
  const files = fs.readdirSync(DIST_DIR).filter(f => f.startsWith('main') && f.endsWith('.js'));
  return files.reduce((total, f) => total + fs.statSync(path.join(DIST_DIR, f)).size, 0);
}

function main() {
  const currentSize = getInitialChunkSize();
  const baseline = fs.existsSync(BASELINE_FILE)
    ? JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'))
    : { initialChunkBytes: currentSize };

  const diffBytes = currentSize - baseline.initialChunkBytes;
  const diffPercent = (diffBytes / baseline.initialChunkBytes) * 100;

  console.log(\`Initial chunk: \${(currentSize / 1024).toFixed(1)}KB\`);
  console.log(\`Baseline:      \${(baseline.initialChunkBytes / 1024).toFixed(1)}KB\`);
  console.log(\`Diff:          \${diffBytes >= 0 ? '+' : ''}\${(diffBytes / 1024).toFixed(1)}KB (\${diffPercent.toFixed(2)}%)\`);

  if (diffPercent > GROWTH_THRESHOLD_PERCENT) {
    console.warn(\`⚠️  Bundle grew by more than \${GROWTH_THRESHOLD_PERCENT}% — review this PR's bundle impact.\`);
    // Non-blocking by design — this is a REVIEW SIGNAL, not a hard failure.
    // The static angular.json budget remains the hard ceiling.
  }

  // Output for a CI step to post as a PR comment
  console.log(\`::set-output name=bundle-diff::Initial bundle: \${(currentSize / 1024).toFixed(1)}KB (\${diffBytes >= 0 ? '+' : ''}\${(diffBytes / 1024).toFixed(1)}KB, \${diffPercent >= 0 ? '+' : ''}\${diffPercent.toFixed(1)}%)\`);
}

main();
`,
    },
    {
      path: 'bundle-size-baseline.json',
      content: `{
  "initialChunkBytes": 350208,
  "lastUpdated": "on merge to main — this file is committed as part of the merge process"
}
`,
    },
    {
      path: '.github-workflow-snippet.yml',
      content: `# .github/workflows/bundle-size.yml (illustrative snippet)
name: Bundle size check
on: [pull_request]
jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx ng build --configuration=production
      - run: node scripts/check-bundle-size.js
        id: size_check
      # A real workflow would use a comment-posting action here,
      # feeding in steps.size_check.outputs.bundle-diff
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Automated bundle budget enforcement in CI</h3>
    <p>This is a build-tooling demo, not a running Angular UI — see
    scripts/check-bundle-size.js for a minimal, framework-agnostic trend checker that
    complements angular.json's static budget with a percentage-based growth signal
    posted as a review-visible PR comment, without blocking the merge.</p>
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
  <head><title>Automated bundle budget enforcement in CI</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a step to check-bundle-size.js that updates bundle-size-baseline.json with the current size, intended to run ONLY on merge to the target branch (not on every PR build).',
    hint: 'Add an updateBaseline() function that writes { initialChunkBytes: currentSize } to BASELINE_FILE, called conditionally based on a CI environment variable like process.env.IS_MERGE_TO_MAIN, so PR builds never overwrite the baseline themselves.',
    solution: `function updateBaseline(currentSize) {
  fs.writeFileSync(BASELINE_FILE, JSON.stringify({
    initialChunkBytes: currentSize,
    lastUpdated: new Date().toISOString(),
  }, null, 2));
  console.log('Baseline updated.');
}

function main() {
  const currentSize = getInitialChunkSize();
  // ... diff calculation as before ...

  // Only the merge-to-main CI job should update the baseline —
  // PR builds must never overwrite it, or every PR would compare
  // against itself and the trend check would become meaningless.
  if (process.env.IS_MERGE_TO_MAIN === 'true') {
    updateBaseline(currentSize);
  }
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a static angular.json budget is sufficient to catch all meaningful bundle-size regressions.',
      reality: 'it only catches a SINGLE large jump — many small increments across separate PRs, none individually crossing the threshold, can cumulatively bloat the bundle over months with no budget failure ever triggering ("boiling frog" growth).',
    },
    {
      thought: 'a bundle-size trend check should block the PR from merging, similar to a budget failure.',
      reality: 'a percentage-based growth signal is meant to be a REVIEW-VISIBLE comment, not a hard block — a legitimate new feature genuinely needs some bytes, and the goal is making the trade-off explicit and discussable, not preventing all growth.',
    },
    {
      thought: 'the trend-tracking baseline should update on every PR build to stay current.',
      reality: 'the baseline must only update on merge to the target branch — if every PR build updated it, each PR would effectively compare against itself, making the trend check meaningless.',
    },
  ];
}
