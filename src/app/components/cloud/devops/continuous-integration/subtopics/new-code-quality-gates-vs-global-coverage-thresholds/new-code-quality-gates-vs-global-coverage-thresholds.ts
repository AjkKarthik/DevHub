import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './new-code-quality-gates-vs-global-coverage-thresholds.html',
  styleUrl: './new-code-quality-gates-vs-global-coverage-thresholds.scss'
})
export class NewCodeQualityGatesVsGlobalCoverageThresholdsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows two coverage-gate mechanisms side by side, but never explains they enforce coverage in fundamentally different ways',
      points: [
        'The main page\'s own SonarQube code tab lists a Quality Gate rule: "New code coverage >= 80%." The main page\'s own "No coverage threshold enforcement" mistake entry, right below it in the same page, shows Jest\'s `coverageThreshold: { global: { lines: 80 } } }` as the fix for a different, un-gated project. Both use the number 80%, and the page never contrasts what "new code" versus "global" actually means for a real, imperfect codebase.',
        'SonarQube\'s own documentation names this design choice directly: its default Quality Gate is built around "Clean as You Code" — "When your quality gate is set to focus on new code metrics... new features can be delivered with high code quality and security," and explicitly: "When your quality gate is focused on new code, we do not recommend adding conditions for overall code."',
      ]
    },
    {
      heading: 'Why this distinction matters the moment a codebase already has legacy, imperfectly-tested code',
      points: [
        'A `global: { lines: 80 }` Jest threshold, exactly as shown in the main page\'s own mistake-entry fix, is checked against the ENTIRE codebase\'s coverage percentage, old and new code combined. A team adding this to a five-year-old codebase sitting at 45% overall coverage cannot merge ANYTHING — even a perfectly-tested new feature — until the whole codebase\'s number crosses 80%, an all-or-nothing wall that can take months to clear.',
        'SonarQube\'s own "New code coverage >= 80%" rule, by contrast, only measures coverage on the LINES CHANGED IN THIS PATCH — a team at 45% overall coverage can adopt this gate immediately: today\'s well-tested change passes even though the codebase average is nowhere near 80%, and the average organically rises over time as each new change meets the bar. SonarQube\'s own docs frame the reasoning explicitly: "By focusing on new code, you aren\'t responsible for anyone else\'s code. You own the quality and security of the code you are working on today."',
        'SonarQube\'s own docs go further, actively discouraging teams from bolting a global condition onto an already-adopted new-code gate: "Adding more conditions may lead to bottlenecks in the pace of development with minimal benefit. You also run the risk of an ignored quality gate because frequent failures may cause a debate on which conditions to prioritize" — a direct warning against turning a workable new-code gate back into the same all-or-nothing wall a global Jest threshold already is.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Jest\'s global threshold -- blocks EVERY merge until the whole codebase clears the bar',
      language: 'bash',
      code: `# jest.config.js -- exactly the main page's own mistake-entry fix
# coverageThreshold: {
#   global: {
#     lines: 80,
#     branches: 75,
#     functions: 80,
#   }
# }

# A five-year-old codebase currently sits at 45% overall line
# coverage. A developer writes a small, perfectly-tested new
# feature -- 100% covered, exactly as it should be.
#
# CI still FAILS: the "global" threshold checks the codebase's
# TOTAL line coverage percentage, old code included -- one
# perfectly-tested new feature cannot move a 45% overall average
# to 80% by itself. Nothing can merge until months of dedicated
# legacy-test-writing work first closes that gap codebase-wide.`,
    },
    {
      label: 'SonarQube\'s new-code gate -- checks only what THIS change touched',
      language: 'bash',
      code: `# Quality Gate rule (SonarQube UI, "New code" scope):
# New code coverage >= 80%

# Same five-year-old codebase, same 45% overall coverage, same
# perfectly-tested new feature.
#
# CI PASSES: per SonarQube's own docs, this rule only evaluates
# "new code" -- the lines actually added or changed by THIS patch.
# The developer's 100%-covered new feature clears 80% on the code
# THEY wrote, regardless of what the other 4.5 years of legacy
# code look like.

# Per SonarQube's own stated reasoning: "By focusing on new code,
# you aren't responsible for anyone else's code. You own the
# quality and security of the code you are working on today."
# The 45% legacy average is still visible on the dashboard, but it
# doesn't block this PR -- and every future well-tested change
# nudges the overall average upward organically, without ever
# needing a one-time, all-at-once fix.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team with a legacy codebase at 45% overall test coverage wants to start enforcing a coverage gate without blocking all development for months. One engineer proposes Jest\'s `coverageThreshold: { global: { lines: 80 } } }`, citing the main page\'s own mistake-entry fix as precedent. Using this subtopic\'s theory, explain why this specific proposal would backfire for THIS codebase, and what to propose instead.',
    hint: 'Per this subtopic\'s theory, does a "global" coverage threshold measure the coverage of the CHANGE being merged, or the coverage of the ENTIRE codebase?',
    solution: 'The proposal would backfire because a `global` Jest threshold, exactly as the main page\'s own mistake-entry fix shows it, measures the coverage of the WHOLE codebase, old and new code combined — not just the lines a given PR actually touches. Setting it to 80% on a codebase currently at 45% overall coverage would immediately block every single merge, including perfectly-tested new features, until months of dedicated legacy-test-writing work first closes the codebase-wide gap — the opposite of the team\'s stated goal of NOT blocking development for months. The better fit, per this subtopic\'s theory, is SonarQube\'s new-code-scoped Quality Gate approach ("Clean as You Code") — a rule like "new code coverage >= 80%" only evaluates the lines changed by each individual patch, so well-tested new work can merge immediately regardless of the legacy average, and the overall codebase coverage organically improves over time as each new change clears the bar on its own code, exactly as SonarQube\'s own docs describe: "You own the quality and security of the code you are working on today."'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A coverage threshold is a coverage threshold — whether it\'s SonarQube\'s Quality Gate or Jest\'s coverageThreshold, an "80%" rule means roughly the same enforcement either way.',
      reality: 'Per this subtopic\'s theory, they can mean genuinely different things depending on scope — SonarQube\'s default "new code" gate only measures the lines a specific patch changed, while a Jest `global` threshold measures the entire codebase\'s coverage at once. The exact same 80% number enforces two very different things.'
    },
    {
      thought: 'A codebase with low overall coverage should fix that by setting a strict global coverage threshold, forcing the team to bring the whole codebase up before anything new can merge.',
      reality: 'This subtopic\'s first code example shows why this backfires — a global threshold blocks even perfectly-tested NEW code because it\'s judged against the OLD code\'s average too. SonarQube\'s own "Clean as You Code" approach, gating only new code, lets good new work merge immediately while the overall average improves gradually rather than requiring an all-at-once fix first.'
    },
    {
      thought: 'A new-code-only quality gate is a weaker, more lenient standard than a global threshold, since it lets a codebase with poor overall coverage keep merging.',
      reality: 'Per this subtopic\'s theory, SonarQube\'s own docs frame it as the opposite of lenient — it makes each individual contributor fully accountable for the quality of the code they personally write ("you aren\'t responsible for anyone else\'s code"), while a global threshold that blocks everyone equally, regardless of what they actually touched, is what SonarQube\'s own docs warn creates "bottlenecks... with minimal benefit" and a real risk teams start ignoring the gate entirely.'
    }
  ];
}
