import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-ci-refuses-new-snapshots',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './ci-refuses-new-snapshots.html',
  styleUrl: './ci-refuses-new-snapshots.scss'
})
export class CiRefusesNewSnapshotsSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Three update modes",
      "points": [
        "In Jest 30's <code>jest-config</code>, the default for <code>ci</code> comes from the ci-info package, so it is true on common CI services. The same file sets <code>updateSnapshot</code> to <code>\"none\"</code> when <code>ci</code> is true and <code>-u</code> was not passed, <code>\"all\"</code> with <code>-u</code>, and <code>\"new\"</code> otherwise.",
        "In <code>jest-snapshot</code>, a missing snapshot is only written when the mode is <code>\"new\"</code> or <code>\"all\"</code>. Its own comment lists \"no snapshot file ... on a CI environment\" as a case where nothing is written. The test then fails with \"New snapshot was not written\".",
        "So a gitignored <code>__snapshots__</code> folder does not make CI pass; it makes every snapshot test fail on CI while passing on every developer's machine. The page's mistake said the opposite and now describes the real failure.",
        "A snapshot that exists but no longer matches fails in every mode except <code>\"all\"</code>, with or without <code>--ci</code>. The QnA described <code>--ci</code> as failing on outdated snapshots; it now says <code>--ci</code> is about new ones."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "From jest-config (Jest 30)",
      "language": "typescript",
      "code": "// defaults\nci: _ciInfo().isCI,\n\n// normalize\nnewOptions.updateSnapshot =\n  newOptions.ci && !argv.updateSnapshot ? 'none'\n  : argv.updateSnapshot ? 'all'\n  : 'new';"
    },
    {
      "label": "What each run does",
      "language": "bash",
      "code": "# Laptop, no snapshot committed:\njest                 # writes the snapshot, test passes\n\n# CI (CI=true), no snapshot committed:\njest                 # does not write it, test fails:\n                     # 'New snapshot was not written ... in CI'\n\n# Anywhere, snapshot exists but differs:\njest                 # fails\njest -u              # overwrites it with the new output"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A developer adds a new component test with <code>toMatchSnapshot()</code> but forgets to commit the generated .snap file. Their local run passes. What does CI report, and what is the fix?",
    "hint": "Which update mode does CI use when -u is not passed?",
    "solution": "CI runs with updateSnapshot none, so the missing snapshot is not written and the test fails with \"New snapshot was not written\". The fix is to commit the generated .snap file (after reviewing it), not to add -u to the CI command."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Snapshot tests always pass the first time they run.",
      "reality": "Only when Jest is allowed to write new snapshots. On CI it is not, so a missing snapshot is a failure."
    },
    {
      "thought": "<code>--ci</code> is what makes outdated snapshots fail.",
      "reality": "A mismatched snapshot fails without any flag. <code>--ci</code> changes how missing snapshots are handled."
    }
  ];
}
