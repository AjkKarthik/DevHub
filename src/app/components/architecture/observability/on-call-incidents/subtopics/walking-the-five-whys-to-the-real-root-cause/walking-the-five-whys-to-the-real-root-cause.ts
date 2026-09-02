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
    heading: 'The Technique the Page Names but Never Runs',
    points: [
      'The page’s own theory names Five Whys directly: "ask \'why did this happen?\' five times. Each answer becomes the next \'why?\'. The fifth answer is usually a systemic or process failure, not a human error." The Postmortem Template code tab has a real "Root Cause" and three "Contributing Factors" — but presents them as a flat list, never as the sequential chain of five questions the theory describes.',
      'Chaining the postmortem’s own listed facts INTO an actual Five Whys sequence surfaces something the flat list leaves implicit: the postmortem’s three "contributing factors" aren’t three independent, equally-weighted causes sitting alongside the root cause — they’re successive answers on the SAME causal chain, each one answering "why did the previous answer happen?"',
      'Landing on the fifth why matters specifically because of where the chain stops: a Five Whys analysis that stops at "the retry loop had a bug" (why #1 or #2) blames the specific code, while one that reaches "there was no staging load test exercising failure-mode retry behavior for payment code paths" (why #5) points at a fixable process gap — exactly the systemic-vs-individual distinction the page’s own blameless-postmortem theory insists on.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Postmortem\'s Own Facts, Chained Into Five Whys',
    language: 'typescript',
    code: `interface WhyStep {
  question: string;
  answer: string;
  sourceFromPostmortem: string; // which section of the real postmortem this maps to
}

const fiveWhys: WhyStep[] = [
  {
    question: 'Why did the payment error rate spike?',
    answer: 'Stripe API calls started failing with HTTP 429 (rate-limit) responses at a high rate.',
    sourceFromPostmortem: 'Summary: "error rate exceeded 5%"',
  },
  {
    question: 'Why did Stripe respond with 429s at a high rate?',
    answer: 'The v2.31.0 retry loop retried failed calls immediately, without honouring the Retry-After header — amplifying request volume at exactly the moment Stripe was already rate-limiting.',
    sourceFromPostmortem: 'Root Cause',
  },
  {
    question: 'Why did the retry loop not honour Retry-After?',
    answer: 'The original design treated HTTP 429 as a generic retriable error, not as a rate-limit signal requiring backoff — a well-intentioned error-handling choice that missed this specific case.',
    sourceFromPostmortem: 'Contributing Factor #3',
  },
  {
    question: 'Why wasn\\'t this caught before it reached production?',
    answer: 'Unit tests for the Stripe client only covered the success path — retry behaviour under a 429 response was never exercised by any test.',
    sourceFromPostmortem: 'Contributing Factor #2',
  },
  {
    question: 'Why was retry-under-failure behaviour never tested for this code path?',
    answer: 'There was no staging load test exercising the new Stripe client under realistic failure/rate-limit conditions — a gap in the testing PROCESS for payment code paths generally, not a one-off oversight in this one PR.',
    sourceFromPostmortem: 'Contributing Factor #1',
  },
];

fiveWhys.forEach((step, i) => {
  console.log(\`Why #\${i + 1}: \${step.question}\`);
  console.log(\`  -> \${step.answer}\`);
});
console.log('Landed on (systemic, fixable):', fiveWhys[fiveWhys.length - 1].answer);
// -> Why #1: Why did the payment error rate spike?
//    -> Stripe API calls started failing with HTTP 429...
//    ... (continues through all 5) ...
// -> Landed on (systemic, fixable): There was no staging load test...`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The postmortem’s own action items table lists a fix targeted at Contributing Factor #1 ("Add Stripe rate limit test in staging load suite") and a SEPARATE fix targeted at Contributing Factor #2 ("Add retry-with-backoff unit test for all payment clients"). Given that the Five Whys chain above treats these as two DIFFERENT points on the SAME causal chain (why #5 and why #4 respectively), does that mean only one of the two action items is actually necessary?',
  hint: 'Consider what each fix, on its own, would and wouldn’t have caught — imagine the OTHER factor was fixed but this one wasn’t.',
  solution: `// No -- both are genuinely necessary, and the Five Whys chain actually
// explains why: they defend against the SAME root cause at two
// different layers, not two unrelated causes.
//
// The unit test (why #4's fix) would catch THIS specific bug -- a
// retry loop mishandling a 429 response -- the next time someone
// writes similar code, by directly testing the failure path that was
// never exercised before. But it wouldn't catch a DIFFERENT bug in a
// different payment code path that also mishandles retries under
// real load, since a unit test doesn't reproduce realistic concurrent
// traffic hitting a real rate limit.
//
// The staging load test (why #5's fix) catches the BROADER systemic
// gap -- any payment code path that behaves badly under sustained,
// realistic failure conditions, not just this one retry loop -- but
// it's a coarser, slower signal than a fast unit test running on every
// PR.
//
// Fixing only the deeper, more systemic cause (why #5) without also
// fixing the more specific, faster-feedback cause (why #4) leaves a
// real gap: a load test run occasionally in staging is a much weaker
// safety net for THIS exact bug than a unit test that runs on every
// single commit.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A Five Whys analysis always needs exactly five questions — stopping at four or continuing to six would be doing it wrong.',
    reality: 'Five is a practical convention, not a hard rule — the technique’s actual goal is "keep asking why until you reach something the team can actually fix," and that sometimes takes fewer or more than five steps depending on how deep the causal chain runs. In this postmortem’s case, the five real facts the page already provides (spike → retry amplification → missing backoff → missing unit test → missing load test) happen to map cleanly onto five whys, which is what made it a good worked example — not evidence that every incident’s chain is exactly five deep.',
  },
  {
    thought: 'Since the postmortem template already lists "Root Cause" and three "Contributing Factors" separately, it has effectively already done a Five Whys analysis — just formatted as bullet points instead of numbered questions.',
    reality: 'The CONTENT is genuinely the same underlying facts, but the flat-list format loses the causal ORDERING a real Five Whys analysis makes explicit — nothing in "Root Cause" plus three bulleted "Contributing Factors" tells a reader which contributing factor caused which other one, or which is closest to the visible symptom versus closest to the fixable systemic root. Chaining them into an ordered sequence (as this subtopic does) is what actually surfaces that Contributing Factor #1 (the missing load test) is the DEEPEST, most systemic answer — a fact the flat bulleted list leaves the reader to infer on their own, if they notice it at all.',
  },
];

@Component({
  selector: 'app-obs-oncall-five-whys',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './walking-the-five-whys-to-the-real-root-cause.html',
  styleUrl: './walking-the-five-whys-to-the-real-root-cause.scss',
})
export class WalkingTheFiveWhysToTheRealRootCauseSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
