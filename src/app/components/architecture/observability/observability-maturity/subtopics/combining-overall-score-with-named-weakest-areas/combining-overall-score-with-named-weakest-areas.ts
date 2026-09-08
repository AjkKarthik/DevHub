import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Two Functions on the Same Page, Never Combined',
    points: [
      'The page’s own Challenge, <code>getMaturityLevel(scores)</code>, takes a plain array of numbers and returns only an overall average and a level label — it has no idea WHICH area each score belongs to, so it can’t tell a reader anything about where to focus next.',
      'The page’s own "Maturity Assessment" code tab, separately, defines a richer <code>MaturityArea</code> shape (with <code>area</code>, <code>evidence</code>, and <code>nextStep</code> fields) and its own <code>computeMaturityScore()</code> function that identifies the weakest areas BY NAME — but that function never computes an overall level label the way the Challenge does.',
      'Combined and verified directly: a single <code>assessMaturity()</code> function reuses the Challenge’s own <code>getMaturityLevel()</code> unmodified for the overall score, while also surfacing the weakest areas WITH their own <code>nextStep</code> guidance attached — giving a reader both "where are we overall" and "what should we do next" from one function call.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'assessMaturity(), Combining Both of the Page\'s Own Functions',
    language: 'typescript',
    code: `interface MaturityArea {
  area: string;
  level: 0 | 1 | 2 | 3 | 4;
  nextStep: string;
}

// The page's own Challenge function, reused unmodified
function getMaturityLevel(scores: number[]): { average: number; level: string } {
  const LEVELS = ['Level 0', 'Level 1', 'Level 2', 'Level 3', 'Level 4'];
  const avg = scores.reduce((s, n) => s + n, 0) / scores.length;
  const average = Math.round(avg * 10) / 10;
  const levelIndex = Math.min(Math.floor(average), 4);
  return { average, level: LEVELS[levelIndex] };
}

// Combined: overall level (from the Challenge) + named weakest areas
// with next steps (matching the "Maturity Assessment" code tab's own shape)
function assessMaturity(areas: MaturityArea[]) {
  const overall = getMaturityLevel(areas.map((a) => a.level));
  const sorted = [...areas].sort((a, b) => a.level - b.level);
  const weakest = sorted.slice(0, 3).map((a) => ({
    area: a.area,
    level: a.level,
    nextStep: a.nextStep,
  }));
  return { ...overall, weakest };
}

const assessment: MaturityArea[] = [
  { area: 'Metrics',            level: 2, nextStep: 'Define SLOs for all user-facing services' },
  { area: 'Logging',            level: 2, nextStep: 'Add correlation IDs to all log lines' },
  { area: 'Tracing',            level: 1, nextStep: 'Instrument all services' },
  { area: 'Alerting',           level: 1, nextStep: 'Migrate to symptom-based SLI alerts' },
  { area: 'SLOs',                level: 0, nextStep: 'Define SLIs for top 3 user-facing services' },
  { area: 'Incident Response',  level: 2, nextStep: 'Add MTTR/MTTD tracking' },
  { area: 'Profiling',          level: 0, nextStep: 'Deploy Pyroscope for continuous profiling' },
  { area: 'Chaos Engineering',  level: 0, nextStep: 'Run first GameDay' },
];

const result = assessMaturity(assessment);
console.log('Overall:', result.average, '/', result.level);
console.log('Weakest areas with next steps:');
result.weakest.forEach((w) => console.log(\`  - \${w.area} (level \${w.level}): \${w.nextStep}\`));
// -> Overall: 1 / Level 1
// -> Weakest areas with next steps:
// ->   - SLOs (level 0): Define SLIs for top 3 user-facing services
// ->   - Profiling (level 0): Deploy Pyroscope for continuous profiling
// ->   - Chaos Engineering (level 0): Run first GameDay`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The Challenge’s own <code>getMaturityLevel()</code> is called INSIDE <code>assessMaturity()</code> with <code>areas.map((a) => a.level)</code> — converting the richer <code>MaturityArea[]</code> down to a plain <code>number[]</code> before passing it in. Why not just modify <code>getMaturityLevel()</code> itself to accept <code>MaturityArea[]</code> directly, skipping the conversion?',
  hint: 'Consider what ELSE in the page might already be calling <code>getMaturityLevel()</code> with a plain array of numbers, and what would happen to that code if the function’s own parameter type changed.',
  solution: `// Changing getMaturityLevel()'s own parameter type would be a
// BREAKING change to every existing caller -- specifically, the page's
// own Challenge starter code and solution both call it directly as
// getMaturityLevel([1, 2, 1, 0, 1]), a plain number array, with no
// area names attached at all. If the function's signature changed to
// require MaturityArea[] objects, that existing, already-published
// code would stop compiling.
//
// Converting at the CALL SITE inside assessMaturity() (map down to
// just the level numbers) keeps getMaturityLevel() completely
// unchanged and reusable exactly as the Challenge already uses it --
// assessMaturity() adapts to the existing function's own expected
// input shape, rather than asking the existing function to adapt to
// a new caller's richer data. This is the same principle behind
// keeping a small, focused function stable and building a more
// specific wrapper around it, rather than continuously widening the
// original function's own responsibilities.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>assessMaturity()</code> produces strictly more information than either of the page’s own two original functions individually, it should simply REPLACE both of them on the page.',
    reality: 'The two original functions still serve their own, narrower purposes well: the Challenge’s <code>getMaturityLevel()</code> is a focused exercise specifically about summing and bucketing a plain number array — exactly the kind of self-contained problem a coding exercise should isolate, without also requiring the reader to reason about area names or next-step strings. Combining them is genuinely more USEFUL for actually running a real assessment, but that doesn’t make the simpler, narrower exercise version wrong for what IT is testing.',
  },
  {
    thought: '<code>sorted.slice(0, 3)</code> picking the three lowest-scoring areas means the function is doing something meaningfully different from — or more sophisticated than — the page’s own original <code>computeMaturityScore()</code>.',
    reality: 'This line is copied directly from the page’s own "Maturity Assessment" code tab, unchanged — <code>assessMaturity()</code> doesn’t introduce any new sorting or prioritization LOGIC at all. The only genuinely new part is combining that existing weakest-areas logic with the Challenge’s own existing overall-score logic in one function, and preserving the <code>nextStep</code> field alongside each weakest area so the output stays directly actionable.',
  },
];

@Component({
  selector: 'app-obs-maturity-combined-assessment',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './combining-overall-score-with-named-weakest-areas.html',
  styleUrl: './combining-overall-score-with-named-weakest-areas.scss',
})
export class CombiningOverallScoreWithNamedWeakestAreasSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
