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
    heading: 'Two Different Models, Same Level Numbers',
    points: [
      'Every OTHER section on the main page — the quickRef (six entries literally named "Maturity Level 0" through "Maturity Level 4"), the theory’s own five headings ("Level 0 → Level 1", "Level 1 → Level 2", and so on), the Challenge’s own <code>LEVELS</code> array, and the revision summary — consistently describe the SAME five-level (0–4) model: Level 0 is no observability at all, Level 1 is basic infrastructure monitoring, Level 2 is application/service observability, Level 3 is SLO-driven reliability, Level 4 is proactive observability.',
      'One quiz question introduced a completely DIFFERENT four-level model — "Level 1 reactive... Level 2 proactive (all three pillars, SLOs)... Level 3 predictive (anomaly detection... chaos engineering)... Level 4 optimized" — using the same level numbers to mean different things. The page’s own Level 2 never includes SLOs (that’s reserved for Level 3); the quiz’s own "Level 2" does. The page’s own Level 3 never includes chaos engineering (that’s reserved for Level 4); the quiz’s own "Level 3" does.',
      'Caught purely by comparing the page’s own sections against each other — no external research needed. A reader who took the quiz FIRST, before reading the rest of the page carefully, would walk away with a "Level 2" and "Level 3" definition that directly conflicts with what every other section of the same page consistently teaches.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Two Models, Side by Side',
    language: 'typescript',
    code: `// The model used EVERYWHERE else on the page --
// quickRef, theory headings, the Challenge's own LEVELS array, revision
const pageModel: Record<number, string> = {
  0: 'No observability (stdout logs, no metrics/tracing/dashboards)',
  1: 'Basic monitoring (system metrics, uptime checks, simple alerting)',
  2: 'Application observability (RED metrics, structured logging, basic tracing)',
  3: 'SLO-driven observability (SLIs, SLOs, error budgets, burn rate alerting)',
  4: 'Proactive observability (continuous profiling, chaos engineering, anomaly detection)',
};

// The DIFFERENT model the quiz question introduced, before the fix
const quizModelBeforeFix: Record<number, string> = {
  1: 'Reactive (basic metrics/alerts, NO SLOs, NO tracing)',
  2: 'Proactive (all 3 pillars, SLOs WITH error budgets, runbooks)',
  3: 'Predictive (anomaly detection, capacity forecasting, chaos engineering)',
  4: 'Optimized (observability as code, automated remediation)',
};

console.log('=== Where "Level 2" and "Level 3" meant DIFFERENT things ===');
console.log("Page's own Level 2:", pageModel[2]);
console.log("Quiz's own  Level 2:", quizModelBeforeFix[2]);
console.log('  -> includes SLOs, which the page reserves for Level 3');
console.log();
console.log("Page's own Level 3:", pageModel[3]);
console.log("Quiz's own  Level 3:", quizModelBeforeFix[3]);
console.log('  -> includes chaos engineering, which the page reserves for Level 4');`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The quiz’s own explanation for the (now-fixed) question described its Level 4 as "observability as code (dashboards and alerts in git)... automated remediation for known failure patterns." Is "observability as code" mentioned ANYWHERE in the page’s own established 0–4 theory, quickRef, or revision sections for ANY level?',
  hint: 'Search the page’s own Level 4 theory bullet ("continuous profiling, chaos engineering (regularly validated), anomaly detection... pillars correlated") for this specific concept.',
  solution: `// No -- "observability as code" (storing dashboards/alerts/SLOs as
// version-controlled config) doesn't appear in the page's own
// established Level 0-4 model at ALL, for any level. It's a real,
// legitimate observability practice (the page's own separate QnA
// on "observability as code" describes it accurately), but it was
// never part of what this page calls "Level 4" anywhere outside the
// one contradicting quiz question.
//
// This is worth noticing specifically because it shows the quiz
// question wasn't just using slightly different WORDING for the same
// underlying ideas -- it introduced genuinely different CRITERIA
// (a practice that has its own separate, unrelated QnA discussion
// elsewhere on the page) as if it were the definition of a level the
// rest of the page defines completely differently.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the quiz’s original four-level model (Reactive/Proactive/Predictive/Optimized) is a coherent, well-written description on its own, it must be describing a genuinely different, equally valid maturity framework — not a mistake.',
    reality: 'A framework being internally coherent doesn’t mean it belongs on THIS page, describing THIS model’s level numbers. The quiz’s four-level naming scheme is a real pattern used by some organizations — but this page had already committed to its own five-level (0–4) numbering everywhere else, and reusing the SAME numbers (1, 2, 3, 4) for a DIFFERENT scheme in one isolated question creates exactly the kind of contradiction a reader has no way to resolve without noticing the rest of the page disagrees.',
  },
  {
    thought: 'This kind of internal contradiction is unusual and hard to catch — it would take deep expertise in observability maturity models to notice two sections disagree.',
    reality: 'The catch here required no outside expertise or research at all — just directly comparing what the page itself says about "Level 2" in one section against what it says about "Level 2" in another. Cross-referencing a page’s own sections against each other, especially numbered/leveled content repeated in a quickRef, a theory section, a Challenge, and a quiz, is a mechanical check anyone can do — the hard part is remembering to do it, not the domain knowledge.',
  },
];

@Component({
  selector: 'app-obs-maturity-quiz-model',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-quizs-own-rival-maturity-model.html',
  styleUrl: './the-quizs-own-rival-maturity-model.scss',
})
export class TheQuizsOwnRivalMaturityModelSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
