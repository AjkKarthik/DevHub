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
  templateUrl: './read-qps-comment-didnt-match-its-own-formula.html',
  styleUrl: './read-qps-comment-didnt-match-its-own-formula.scss'
})
export class ReadQpsCommentDidntMatchItsOwnFormulaSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A formula on one line, a different number on the very next line',
      points: [
        'The Challenge solution wrote: const totalClicksPerDay = URLS_PER_DAY * CLICKS_PER_URL / RETENTION_YEARS / 365; — a formula that explicitly divides by RETENTION_YEARS. The comment immediately below it, meant to show the worked arithmetic, computed "50M × 100 / 365 = 13.7M clicks/day" — silently DROPPING the "/ RETENTION_YEARS" term the formula above it actually includes. The subsequent readQps calculation then used that mismatched 13.7M figure. The page has been corrected so the comment and the code agree.',
        'This is catchable with pure arithmetic, no external research: does "50,000,000 × 100 / 5 / 365" (the formula as written) equal "50,000,000 × 100 / 365" (the comment\'s claimed working)? It does not — the two expressions differ by a factor of exactly 5 (RETENTION_YEARS).',
      ]
    },
    {
      heading: 'What the formula actually evaluates to',
      points: [
        'One day\'s cohort of URLs (50 million of them) each get an average of 100 clicks over their full lifetime — 5,000,000,000 (5 billion) total lifetime clicks for that cohort. The formula spreads those 5 billion clicks evenly across the cohort\'s 5-year, 1,825-day retention period: 5,000,000,000 ÷ 1,825 ≈ 2,739,726 clicks per day from that one cohort — not the 13.7M the comment stated (which only divided by 365, skipping the 5-year spread entirely).',
        'Carrying the corrected 2.74M figure through: readQps = 2,739,726 / 86,400 ≈ 32 reads/second (not the ~158 the original mismatched figure produced) — and the downstream DB-read-replica estimate later in the same solution, which multiplied off that number, needed updating too.',
      ]
    },
    {
      heading: 'Why catching this kind of mismatch matters for a capacity-estimation interview answer',
      points: [
        'A capacity estimate is only as trustworthy as its arithmetic — an interviewer (or a real capacity-planning decision) relying on a comment that silently drops a term from the formula above it would carry a wrong intermediate number through every subsequent calculation that builds on it (Redis sizing, read-replica count), the same failure mode that made this specific mismatch worth catching before it propagated further.',
        'The general habit worth building: when a worked-example comment sits directly under a formula, verify the comment\'s arithmetic actually matches every term in that formula — not just that the final number "looks plausible" in isolation.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The formula vs. the comment, checked side by side',
      language: 'typescript',
      code: `const URLS_PER_DAY = 50_000_000;
const CLICKS_PER_URL = 100;
const RETENTION_YEARS = 5;
const SECONDS_PER_DAY = 86_400;

// The formula, as actually written on the page:
const totalClicksPerDay = URLS_PER_DAY * CLICKS_PER_URL / RETENTION_YEARS / 365;
console.log(totalClicksPerDay);
// ~= 2,739,726  <-- what the formula ACTUALLY evaluates to

// The comment's claimed working (dropped "/ RETENTION_YEARS"):
const commentsClaimedValue = URLS_PER_DAY * CLICKS_PER_URL / 365;
console.log(commentsClaimedValue);
// = 13,698,630  <-- a DIFFERENT number, off by a factor of RETENTION_YEARS (5)

// The downstream calculation used the comment's (wrong-relative-to-the-
// formula) 13.7M figure, not what totalClicksPerDay actually equals:
const readQpsCorrected = totalClicksPerDay / SECONDS_PER_DAY;
console.log(readQpsCorrected);
// ~= 32 reads/s -- not the ~158 the mismatched figure produced`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A reviewer checks the Challenge solution and sees the line `const totalClicksPerDay = URLS_PER_DAY * CLICKS_PER_URL / RETENTION_YEARS / 365;` followed by a comment claiming the result is "13.7M clicks/day." Without running any code, how can the reviewer tell something is off, using just the formula and the comment?',
    hint: 'Does the formula\'s own list of divisions (RETENTION_YEARS, then 365) match the divisions the comment\'s worked arithmetic actually shows?',
    solution: 'The formula divides URLS_PER_DAY * CLICKS_PER_URL by TWO terms in sequence: RETENTION_YEARS, then 365. The comment\'s worked arithmetic ("50M × 100 / 365 = 13.7M") only shows ONE division, by 365 — it never divides by RETENTION_YEARS (5) at all. Since the formula and the comment are supposed to describe the same calculation, and one includes an extra division the other omits, they cannot both be correct — evaluating the actual formula gives roughly 2.74M (dividing by both 5 and 365), not the 13.7M the comment claims (dividing by only 365). The reviewer can catch this by simply counting the division terms in the formula and checking each one appears in the comment\'s own worked arithmetic.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A comment showing "worked arithmetic" directly under a formula can be trusted to accurately reflect what that formula computes, since it is presented as an explanation of it.',
      reality: 'Per this subtopic\'s theory, the comment silently dropped a division term (RETENTION_YEARS) that the formula above it explicitly includes — the comment and the formula it was meant to explain described two different calculations.'
    },
    {
      thought: 'Since the final readQps number "looks plausible" on its own (a double-digit or low-triple-digit reads/second figure is a reasonable-sounding capacity estimate either way), the exact intermediate arithmetic doesn\'t matter much.',
      reality: 'Per this subtopic\'s theory, the mismatch is a real ~5x error (158 vs. the corrected ~32 reads/s) that would meaningfully affect downstream capacity decisions like read-replica sizing — "looks plausible in isolation" is not the same as "matches the stated formula."'
    },
    {
      thought: 'Catching this kind of error requires actually running the code or having deep system design expertise.',
      reality: 'Per this subtopic\'s theory, this is a pure arithmetic check — counting the division terms in the formula and confirming each one appears in the comment\'s claimed working is enough to catch the mismatch, no code execution or domain expertise required.'
    }
  ];
}
