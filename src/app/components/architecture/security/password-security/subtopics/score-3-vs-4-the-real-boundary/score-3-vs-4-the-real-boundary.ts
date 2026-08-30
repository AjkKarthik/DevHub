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
    heading: 'A Comment That Hedged on a Deterministic Result',
    points: [
      'The main page\'s own Challenge solution demonstrates <code>checkPasswordStrength(\'P@ssw0rd123!\')</code> with the comment <code>// { score: 3 or 4, feedback: [] }</code> — but the function has no randomness anywhere in it. Given the exact same input string every time, it always returns the exact same score. Running it directly confirms the result is always <code>3</code>, never <code>4</code> — the "or 4" was simply imprecise, not a genuine ambiguity in the algorithm\'s behaviour.',
      'The actual reason the comment reads as plausible either way is that <code>\'P@ssw0rd123!\'</code> satisfies ALL FOUR character classes (lower, upper, digit, special) — the same requirement score 4 needs — which makes it easy to assume the password "should" score the maximum. What the comment misses is the SEPARATE length requirement: score 4 needs both <code>count === 4</code> AND <code>length >= 16</code>, and this example is only 12 characters long.',
    ],
  },
  {
    heading: 'Score 3 and Score 4 Check Completely Different Things',
    points: [
      'Score 3 requires <code>length >= 12 && count >= 3</code> — at least 3 of the 4 character classes, and at least 12 characters. Score 4 requires <code>length >= 16 && count === 4</code> — ALL FOUR classes, and at least 16 characters. These are two independent, ADDITIVE thresholds on two different dimensions (character variety, and length) — satisfying one does nothing to satisfy the other.',
      'A password can have every character class present (count = 4, the score-4 variety requirement) and still cap at score 3 forever if it never reaches 16 characters — which is exactly the situation the main page\'s own example demonstrates, without ever saying so explicitly.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Main Page\'s Own Example, Traced',
    language: 'typescript',
    code: `function checkPasswordStrength(password: string): { score: number; feedback: string[] } {
  const feedback: string[] = [];
  if (password.length < 8) return { score: 0, feedback: ['Too short'] };

  const classes = {
    lower:   /[a-z]/.test(password),
    upper:   /[A-Z]/.test(password),
    digit:   /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };
  const count = Object.values(classes).filter(Boolean).length;

  let score = Math.min(count, 2);
  if (password.length >= 12 && count >= 3) score = 3;
  if (password.length >= 16 && count === 4) score = 4;

  return { score, feedback };
}

const pw = 'P@ssw0rd123!';
console.log(pw.length);                       // -> 12
console.log(checkPasswordStrength(pw).score);  // -> 3, deterministically, every single time

// count === 4 (all four classes ARE present) -- but length is 12, not
// >= 16, so the score-4 branch's condition never evaluates true. The
// count===4 half of the score-4 requirement is satisfied; the
// length>=16 half never is.`,
  },
  {
    label: 'What It Actually Takes to Reach Score 4',
    language: 'typescript',
    code: `// Extending the SAME password to meet the length requirement,
// keeping every character class intact.
const extended = 'P@ssw0rd123!ABCD';   // same prefix + 4 more chars
console.log(extended.length);                          // -> 16
console.log(checkPasswordStrength(extended));
// -> { score: 4, feedback: [] }
// length >= 16 now holds, count is still 4 -- BOTH score-4 conditions
// are satisfied simultaneously, and only now does the score-4 branch
// actually fire.

// A near-miss, one character short:
const nearMiss = 'P@ssw0rd123!ABC';    // 15 characters
console.log(nearMiss.length);                           // -> 15
console.log(checkPasswordStrength(nearMiss).score);      // -> 3, NOT 4
// count is still 4 -- the ONLY thing that changed is length, by
// exactly one character -- and that alone is enough to keep this
// password capped at score 3.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A password is <code>Ab1!Ab1!Ab1!Ab1!</code> — 16 characters, repeating the same 4-character block four times. What score does <code>checkPasswordStrength</code> give it, and does that feel like the RIGHT score for how strong this password actually is?',
  hint: 'Trace <code>classes</code> and <code>count</code> for this exact string first, independent of whether it "looks" strong to you.',
  solution: `// checkPasswordStrength('Ab1!Ab1!Ab1!Ab1!') returns { score: 4, feedback: [] }.

// Tracing it: length is 16 (meets length >= 16). Character classes:
// lower ('b') true, upper ('A') true, digit ('1') true, special ('!')
// true -- count is 4 (meets count === 4). Both score-4 conditions are
// satisfied, so the function correctly returns its maximum score.

// Whether that FEELS right is a separate, important question: this
// password is a repeating 4-character block, making it dramatically
// easier to guess than a genuinely random 16-character string with
// the same character-class variety -- a real password cracker would
// find this pattern quickly by testing short repeating units, not by
// brute-forcing the full 16-character keyspace. This is a genuine
// LIMITATION of the checkPasswordStrength algorithm as specified on
// the main page: it measures character-class variety and length, but
// has no way to detect repetition or predictable patterns -- exactly
// the kind of pattern the main page's own QnA warns "Password1!"-style
// complexity-rule-satisfying passwords fall into. A length-and-class
// scorer is a reasonable FIRST filter, not a complete strength
// measure -- the main page's own recommendation to check against
// HaveIBeenPwned and breach databases exists precisely to catch what
// a class-and-length count alone cannot.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The Challenge solution\'s own comment ("score: 3 or 4") reflects a genuine ambiguity in how the algorithm scores that password.',
    reality: 'The algorithm is fully deterministic — there is no randomness, no environment dependency, nothing that could make the same input string produce different scores on different runs. The comment was simply imprecise; running the function confirms the result is always exactly <code>3</code>. It is worth treating any "or" in a worked example\'s comment as a signal to actually run the code and check, rather than assuming the ambiguity is real.',
  },
  {
    thought: 'Since <code>P@ssw0rd123!</code> has all 4 character classes (the same requirement score 4 needs), it "should" score close to the maximum.',
    reality: 'Score 4 needs BOTH conditions at once — <code>count === 4</code> AND <code>length >= 16</code> — and this password only satisfies the first one. Having every character class present says nothing about whether the length threshold is also met; the two requirements are independent, and a password can satisfy one completely while never approaching the other.',
  },
];

@Component({
  selector: 'app-sec-ps-score34',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './score-3-vs-4-the-real-boundary.html',
  styleUrl: './score-3-vs-4-the-real-boundary.scss',
})
export class Score3Vs4TheRealBoundarySubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
