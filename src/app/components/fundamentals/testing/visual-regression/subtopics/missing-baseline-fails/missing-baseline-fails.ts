import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-missing-baseline-fails',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './missing-baseline-fails.html',
  styleUrl: './missing-baseline-fails.scss'
})
export class MissingBaselineFailsSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "updateSnapshots modes in Playwright 1.64",
      "points": [
        "The typings list the modes: <code>\"all\"</code> (update every snapshot that differs), <code>\"changed\"</code>, <code>\"missing\"</code> (\"missing snapshots are created ... Tests that only create missing snapshots pass\") and <code>\"none\"</code>.",
        "The default is <code>\"default\"</code>: \"Missing snapshots are created, but the tests that create them fail, so that the run does not silently pass in CI.\"",
        "The matcher source prints \"A snapshot doesn't exist at ..., writing actual.\" in that case. So the first run fails, and a CI run without committed baselines fails every time instead of passing vacuously.",
        "The quiz now answers \"writes the screenshot as the new baseline but fails the test\", and the mistake describes CI going red rather than green."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Modes",
      "language": "bash",
      "code": "npx playwright test                             # default: write missing, but fail\nnpx playwright test --update-snapshots=missing  # write missing, pass\nnpx playwright test --update-snapshots          # 'changed': update differing ones\n\n# Output on a missing baseline (default mode):\n# Error: A snapshot doesn't exist at .../homepage-chromium-linux.png, writing actual."
    },
    {
      "label": "Config",
      "language": "typescript",
      "code": "export default defineConfig({\n  // keep the safe default in CI; developers pass --update-snapshots locally\n  updateSnapshots: process.env.CI ? 'none' : 'missing',\n});"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A developer adds a new visual test, runs it once locally (it fails), runs it again (it passes) and pushes without committing the PNG. What happens in CI with the default settings?",
    "hint": "Where did the second local run find its baseline?",
    "solution": "Locally the first run wrote the baseline, so the second run compared against it and passed. CI has no PNG, so it writes one and fails the test. The fix is to commit the generated -snapshots file (ideally generated on the same OS as CI)."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "A brand-new screenshot test passes the first time.",
      "reality": "Under the default mode it fails while writing the baseline, on purpose."
    },
    {
      "thought": "Uncommitted baselines make CI pass without comparing anything.",
      "reality": "They make CI fail on every run, because each run is a first run."
    }
  ];
}
