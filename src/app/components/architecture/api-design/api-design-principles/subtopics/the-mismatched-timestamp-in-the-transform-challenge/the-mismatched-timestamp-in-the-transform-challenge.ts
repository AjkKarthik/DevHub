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
    heading: 'The Worked Example Claimed an Output Its Own Input Never Produces',
    points: [
      'The main page’s own Challenge states a specific worked example: input <code>date_joined: 1705312200</code> should transform to output <code>joinedAt: "2024-01-15T10:30:00Z"</code>. The Challenge’s <code>solution</code> code does exactly what the requirements describe — <code>new Date(timestamp * 1000).toISOString()</code> — but running that exact conversion on <code>1705312200</code> produces <code>"2024-01-15T09:50:00.000Z"</code>, forty minutes earlier than the claimed output.',
      'This is not a bug in the transformation LOGIC — <code>new Date(timestamp * 1000).toISOString()</code> is the correct, standard way to convert a Unix timestamp (seconds) to an ISO 8601 string. The bug is in the worked example’s own prose: the input number and the claimed output string do not describe the same instant in time.',
      'The corrected input is <code>1705314600</code> — verified by converting the CLAIMED output string back to a Unix timestamp and comparing: <code>new Date("2024-01-15T10:30:00Z").getTime() / 1000</code> gives exactly <code>1705314600</code>, a 2,400-second (40-minute) gap from the original, uncorrected <code>1705312200</code>.',
      'A mismatch like this is easy to miss precisely because both halves look individually plausible — the input is a realistic-looking 10-digit Unix timestamp, and the output is correctly-formatted ISO 8601. Only running the ACTUAL code against the ACTUAL input catches that the two don’t describe the same moment.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Reproducing the Discrepancy',
    language: 'typescript',
    code: `// The Challenge's own transformation logic (unmodified) --
function toIso(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}

// ── The ORIGINAL, uncorrected worked example ─────────────────────────────
const originalInput = 1705312200;
console.log(toIso(originalInput));
// "2024-01-15T09:50:00.000Z"  <-- NOT "2024-01-15T10:30:00Z" as claimed

// ── Working backwards from the CLAIMED output to find the real input ─────
const claimedOutput = '2024-01-15T10:30:00Z';
const correctInput = new Date(claimedOutput).getTime() / 1000;
console.log(correctInput);
// 1705314600

// ── Confirming the corrected input actually produces the claimed output ──
console.log(toIso(correctInput));
// "2024-01-15T10:30:00.000Z"  -- matches (toISOString() always appends
// milliseconds, so the exact claimed string needs ".000Z", not a bare "Z")

console.log(correctInput - originalInput, 'seconds off (40 minutes)');
// 2400 seconds off (40 minutes)`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page’s own <code>balanceCents</code> requirement — <code>Math.round(9.99 * 100)</code> — was NOT affected by this bug; it correctly produces <code>999</code>, matching the claimed output exactly. Why does a worked example need EVERY field independently checked against the actual code, rather than trusting the example once one field is confirmed correct?',
  hint: 'The timestamp bug and the money-rounding requirement are computed by two completely unrelated pieces of logic in the same <code>solution</code> function — does one field being internally consistent tell you anything about a DIFFERENT, unrelated field?',
  solution: `// balanceCents and joinedAt are computed by two entirely independent
// lines inside the same solution() function:
//
//   joinedAt: new Date(u.date_joined * 1000).toISOString(),
//   balanceCents: Math.round(u.balance * 100),
//
// Each line reads its own input field and applies its own, unrelated
// transformation. Confirming Math.round(9.99 * 100) === 999 says
// absolutely nothing about whether the SEPARATE date_joined -> joinedAt
// line is internally consistent -- the two fields don't share any
// computation, input, or intermediate value.

// This is exactly why the actual verification in this subtopic ran BOTH
// transformations independently (see the codeTab above) rather than
// checking one field and assuming the other was fine by association.
// A worked example with N independent output fields needs N independent
// checks -- "the example looks right overall" is not evidence for any
// SPECIFIC field until that field is checked on its own.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>new Date(timestamp * 1000).toISOString()</code> is the textbook-correct way to convert a Unix timestamp, the worked example using it must be correct.',
    reality: 'The CODE was always correct — <code>new Date(timestamp * 1000).toISOString()</code> is exactly the right pattern for this conversion. The bug was entirely in the worked example’s own PROSE: the specific input number (<code>1705312200</code>) and the specific claimed output string (<code>"2024-01-15T10:30:00Z"</code>) simply did not describe the same instant. Correct code applied to a mismatched pair of example numbers still produces a mismatched-looking result.',
  },
  {
    thought: '<code>.toISOString()</code> can return either a bare <code>"...Z"</code> string or a <code>"....000Z"</code> string with milliseconds, depending on the input.',
    reality: '<code>Date.prototype.toISOString()</code> ALWAYS includes exactly three millisecond digits before the trailing <code>Z</code> — <code>".000Z"</code> for a timestamp with no sub-second component, never a bare <code>"Z"</code>. A worked example claiming a bare <code>"...Z"</code> output from real <code>.toISOString()</code> code is a second, smaller inaccuracy independent of the 40-minute timestamp gap — this subtopic’s codeTab confirms the real, exact string <code>.toISOString()</code> produces.',
  },
  {
    thought: 'A 40-minute gap in a worked example is negligible — close enough for a documentation example to still make the point.',
    reality: 'A worked example that pairs a real, correct piece of code with a wrong claimed result actively teaches the WRONG mental model of what that code does — a reader who trusts the documented output over running the code themselves would conclude the conversion logic is broken, or misremember what <code>1705312200</code> actually represents. The severity of the time gap matters less than the fact that the input and output no longer correspond at all under the documented transformation.',
  },
];

@Component({
  selector: 'app-api-principles-timestamp-mismatch',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-mismatched-timestamp-in-the-transform-challenge.html',
  styleUrl: './the-mismatched-timestamp-in-the-transform-challenge.scss',
})
export class TheMismatchedTimestampInTheTransformChallengeSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
