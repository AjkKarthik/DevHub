import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-dsa-bigo-master-theorem',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './master-theorem-epsilon-and-regularity.html',
  styleUrl: './master-theorem-epsilon-and-regularity.scss'
})
export class MasterTheoremEpsilonAndRegularitySubtopic {
  topicLabel = 'Big-O Notation';
  topicRoute = '/dsa/big-o';

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s QnA Is a Simplification',
      points: [
        'The main page\'s own QnA states the three cases as plain comparisons: "f(n) < n^log_b(a)", "f(n) = n^log_b(a)", "f(n) > n^log_b(a)." This is the common informal version taught for a quick first pass, but the real theorem (as stated in CLRS and standard algorithms references) requires two extra conditions the plain comparison skips.',
        'Case 1 needs POLYNOMIAL separation, not just "smaller": f(n) must be O(n^(log_b(a) - epsilon)) for some constant epsilon > 0 -- being asymptotically smaller by any amount is not enough; it has to be smaller by a whole polynomial factor.',
        'Case 3 needs the same polynomial separation in the other direction (f(n) = Omega(n^(log_b(a) + epsilon))) PLUS a regularity condition: a*f(n/b) <= c*f(n) for some constant c < 1 and all sufficiently large n. Without regularity, case 3 does not apply even when the growth-rate comparison looks right.',
        'Case 2, generalised, actually covers an entire family: f(n) = Theta(n^log_b(a) * log^k(n)) for any k >= 0 gives T(n) = Theta(n^log_b(a) * log^(k+1)(n)) -- not just the k=0 case of f(n) being exactly Theta(n^log_b(a)).'
      ]
    },
    {
      heading: 'The Classic Counterexample: Regularity Can Fail Even When Growth Looks Fine',
      points: [
        'The standard textbook counterexample (CLRS Exercise 4.5-5) is T(n) = T(n/2) + f(n) with f(n) = n(2 - cos n), so a=1, b=2, log_b(a) = 0.',
        'f(n) grows like n (since 2-cos(n) is always between 1 and 3), which comfortably satisfies the Omega(n^(0+epsilon)) growth requirement for case 3 with epsilon=1 -- by the simplified comparison alone, you would call this case 3 and conclude T(n) = Theta(f(n)).',
        'But regularity -- f(n/2) <= c*f(n) for a constant c < 1 -- genuinely fails: measured directly below, the ratio f(n/2)/f(n) holds at exactly 1.5 for infinitely many n (not close to it, not approaching it -- exactly 1.5), so no c < 1 can ever work. The Master Theorem simply does not apply to this recurrence at all, despite the growth condition checking out.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Regularity check, measured',
      language: 'typescript',
      code: `// T(n) = T(n/2) + f(n),  f(n) = n * (2 - cos(n))   -- a=1, b=2
function f(n: number): number {
  return n * (2 - Math.cos(n));
}

// Regularity condition requires f(n/2) <= c * f(n) for SOME constant c < 1,
// for all sufficiently large n. Check it at n = 2*pi*k for odd k:
for (const k of [1, 3, 5, 101, 1001, 100001]) {
  const n = 2 * Math.PI * k;
  const ratio = f(n / 2) / f(n);
  console.log(\`k=\${k}  ratio f(n/2)/f(n) = \${ratio.toFixed(4)}\`);
}

// Actual measured output -- the ratio is EXACTLY 1.5 every single time,
// for k up to 100,001 (arbitrarily large n):
//   k=1       ratio = 1.5000
//   k=3       ratio = 1.5000
//   k=5       ratio = 1.5000
//   k=101     ratio = 1.5000
//   k=1001    ratio = 1.5000
//   k=100001  ratio = 1.5000
// No constant c < 1 can bound a ratio that is always 1.5 -- regularity
// fails, so case 3 (and the Master Theorem entirely) does not apply here.

// For comparison, a well-behaved f(n) = n satisfies regularity trivially,
// with f(n/2)/f(n) = 0.5 for every n -- comfortably under any c < 1.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'Classify T(n) = 4T(n/2) + n² log(n) using the Master Theorem\'s precise conditions. What are a, b, log_b(a), and which case applies?',
    hint: 'First compute n^log_b(a) and compare it to f(n) = n² log(n). Is f(n) polynomially larger, polynomially smaller, or the SAME polynomial order (possibly with an extra log factor)?',
    solution: 'a=4, b=2, so log_b(a) = log_2(4) = 2, giving n^log_b(a) = n². f(n) = n² * log(n) = n² * log¹(n) -- exactly the generalised case 2 shape, Theta(n^log_b(a) * log^k(n)) with k=1 (not k=0, since there is a log factor, and not case 1 or 3 since the polynomial order n² matches exactly rather than being polynomially smaller or larger). Generalised case 2 gives T(n) = Theta(n^log_b(a) * log^(k+1)(n)) = Theta(n² * log²(n)). A reader using only the simplified "f(n) = n^log_b(a)" comparison from the main page\'s QnA would likely answer the plain Theta(n² log n) case-2 formula and get the extra log factor wrong, since n² log(n) is not EXACTLY Theta(n²) -- the generalised case-2 family (for any k >= 0) is what actually covers it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If f(n) grows strictly faster than n^log_b(a), case 3 always applies and T(n) = Theta(f(n)).',
      reality: 'Growing faster is necessary but not sufficient -- the regularity condition a*f(n/b) &lt;= c*f(n) must ALSO hold for some constant c &lt; 1. The classic counterexample f(n) = n(2-cos n) grows at exactly the right rate for case 3 but fails regularity (measured ratio stays at a fixed 1.5, never below 1), so the theorem gives no answer at all for that recurrence.'
    },
    {
      thought: 'Case 2 only covers f(n) being exactly equal to n^log_b(a), with no log factor.',
      reality: 'The generalised case 2 (used by many courses, including the Try It above) covers f(n) = Theta(n^log_b(a) * log^k(n)) for ANY k >= 0, giving T(n) = Theta(n^log_b(a) * log^(k+1)(n)). The bare k=0 version is just the simplest member of this family.'
    },
    {
      thought: 'The regularity condition is a minor technicality that almost never matters in practice.',
      reality: 'For the polynomial-bounded f(n) that shows up in nearly every real divide-and-conquer algorithm (merge sort, most recursive tree algorithms), regularity holds automatically and can be safely ignored. It is worth knowing about specifically because it is the thing that fails for the oscillating counterexamples CLRS and similar texts use to show the Master Theorem has real limits, not infinite reach.'
    }
  ];
}
