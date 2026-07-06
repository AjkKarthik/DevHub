import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-proving-result-genuine-monad-three-monad-laws-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './proving-result-genuine-monad-three-monad-laws.html',
  styleUrl: './proving-result-genuine-monad-three-monad-laws.scss',
})
export class ProvingResultGenuineMonadThreeMonadLawsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own quiz asserts Result<T> is a monad "satisfying the monad laws" — this is what those laws actually say',
      points: [
        'The main Functional C# page\'s quiz states that <code>Result&lt;T&gt;</code> is a monad because "Map makes it a Functor... and Bind is the monadic flatMap... The three monad laws hold." It never shows what those laws actually require or demonstrates them holding — this subtopic makes that claim concrete with the exact hand-rolled <code>Result&lt;T&gt;</code> from the main page.',
      ],
    },
    {
      heading: 'Left identity: wrapping a value then binding it is the same as just calling the function directly',
      points: [
        'Formally: <code>Result.Success(x).Bind(f)</code> must equal <code>f(x)</code>, for any value <code>x</code> and function <code>f</code>. In plain terms: taking a plain value, putting it into a successful Result, then Bind-ing a function onto it, produces EXACTLY the same outcome as just calling that function on the value directly — wrapping-then-binding adds no extra behavior of its own.',
      ],
    },
    {
      heading: 'Right identity: binding "just wrap this value" onto a Result gives back the same Result',
      points: [
        'Formally: <code>m.Bind(x =&gt; Result.Success(x))</code> must equal <code>m</code>, for any Result <code>m</code>. In plain terms: if the function you Bind does NOTHING except re-wrap its input as a successful Result, the overall chain produces the exact same Result you started with — Binding a "no-op" function is truly a no-op on the Result itself.',
      ],
    },
    {
      heading: 'Associativity: it doesn\'t matter how you group a chain of Binds — the end result is identical',
      points: [
        'Formally: <code>m.Bind(f).Bind(g)</code> must equal <code>m.Bind(x =&gt; f(x).Bind(g))</code>, for any Result <code>m</code> and functions <code>f</code>, <code>g</code>. In plain terms: chaining <code>Bind(f).Bind(g)</code> step by step gives the SAME final Result as combining <code>f</code> and <code>g</code> into one function first and Binding that combined function once — this is exactly WHY the main page\'s own <code>Validate(dto).Bind(CheckInventory).Bind(Charge).Map(Confirm)</code> chain behaves predictably regardless of how you mentally group its steps.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Left identity — verified against the main page\'s own Result<T>',
      language: 'csharp',
      code: `// Left identity: Result<T>.Success(x).Bind(f) === f(x)

Result<int> f(int x) => Result<int>.Success(x * 2);

int x = 5;

Result<int> left  = Result<int>.Success(x).Bind(f);
Result<int> right = f(x);

Console.WriteLine(left.Value  == right.Value);   // True — both are 10
Console.WriteLine(left.IsSuccess == right.IsSuccess); // True — both succeed

// Why this holds for the main page's hand-rolled Result<T>:
// Success(x).Bind(f) evaluates IsSuccess (always true here), then
// calls "f(Value)" — which is exactly f(x). There is no additional
// wrapping behavior introduced by the Success/Bind combination.`,
    },
    {
      label: 'Right identity — Binding a "just re-wrap" function changes nothing',
      language: 'csharp',
      code: `// Right identity: m.Bind(x => Result<T>.Success(x)) === m

Result<int> m = Result<int>.Success(42);
Result<int> failedM = Result<int>.Failure("boom");

Result<int> rightIdentitySuccess = m.Bind(v => Result<int>.Success(v));
Result<int> rightIdentityFailure = failedM.Bind(v => Result<int>.Success(v));

Console.WriteLine(rightIdentitySuccess.Value == m.Value);          // True — still 42
Console.WriteLine(rightIdentityFailure.IsFailed);                  // True — Bind
                                                                     // short-circuits
                                                                     // on a failed
                                                                     // Result, so
                                                                     // the "re-wrap"
                                                                     // function is
                                                                     // never even
                                                                     // called for
                                                                     // failedM —
                                                                     // it stays a
                                                                     // failure,
                                                                     // exactly as
                                                                     // "m" itself was`,
    },
    {
      label: 'Associativity — grouping Binds differently produces the identical result',
      language: 'csharp',
      code: `// Associativity: m.Bind(f).Bind(g) === m.Bind(x => f(x).Bind(g))

Result<int> f(int x) => Result<int>.Success(x + 1);
Result<int> g(int x) => x > 0 ? Result<int>.Success(x * 10) : Result<int>.Failure("non-positive");

Result<int> m = Result<int>.Success(4);

// Grouped LEFT — step by step, one Bind at a time:
Result<int> groupedLeft = m.Bind(f).Bind(g);

// Grouped RIGHT — f and g combined into a single function, bound once:
Result<int> groupedRight = m.Bind(x => f(x).Bind(g));

Console.WriteLine(groupedLeft.Value  == groupedRight.Value);   // True — both are 50
Console.WriteLine(groupedLeft.IsSuccess == groupedRight.IsSuccess); // True

// This is EXACTLY why the main page's own
//   Validate(dto).Bind(CheckInventory).Bind(Charge).Map(Confirm)
// chain is safe to reason about one Bind at a time — associativity
// guarantees that grouping the steps differently would never change
// the final outcome, so there is no hidden ordering subtlety to worry
// about beyond the OBVIOUS left-to-right execution order.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Using the main topic page\'s own hand-rolled <code>Result&lt;T&gt;</code>, write a small program that verifies the LEFT IDENTITY law with a function that can FAIL (not just one that always succeeds), and explain why the law still holds.',
    hint: 'Pick an f that returns Result<int>.Failure for some inputs. Left identity says Success(x).Bind(f) must equal f(x) regardless of whether f itself succeeds or fails for that particular x — verify both a passing and failing case.',
    solution: `Result<int> f(int x) => x >= 0
    ? Result<int>.Success(x * 2)
    : Result<int>.Failure("negative input");

// Case 1 — f succeeds for this input:
int x1 = 5;
Result<int> left1  = Result<int>.Success(x1).Bind(f);
Result<int> right1 = f(x1);
Console.WriteLine(left1.IsSuccess == right1.IsSuccess); // True
Console.WriteLine(left1.Value == right1.Value);         // True — both 10

// Case 2 — f FAILS for this input — the law must STILL hold here:
int x2 = -3;
Result<int> left2  = Result<int>.Success(x2).Bind(f);
Result<int> right2 = f(x2);
Console.WriteLine(left2.IsFailed == right2.IsFailed);   // True — both failed
Console.WriteLine(left2.Error == right2.Error);         // True — same error message

// Why the law holds even when f fails: Success(x).Bind(f) is defined
// (in the main page's own hand-rolled implementation) as simply
// "IsSuccess ? f(Value) : Failure(Error)" — and since Success(x) is
// ALWAYS a success by construction, this reduces to exactly "f(x)"
// every time, with NO special casing based on whether f itself
// happens to succeed or fail for that particular value. The identity
// holds unconditionally, not just for the "happy path" case.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'saying Result<T> "satisfies the monad laws" is just an abstract theoretical label with no concrete, checkable meaning.',
      reality: 'each law is a concrete, verifiable equality between two Result<T> values built two different ways — left identity, right identity, and associativity can all be demonstrated directly with the main page\'s own hand-rolled Result<T> code.',
    },
    {
      thought: 'the monad laws only need to hold for the "happy path" — cases where every function involved succeeds.',
      reality: 'the laws must hold unconditionally, including when intermediate functions fail — left identity, for example, holds identically whether f(x) succeeds or fails, because Success(x).Bind(f) always reduces to exactly f(x) regardless of outcome.',
    },
    {
      thought: 'associativity means the ORDER you execute Bind calls in doesn\'t matter — you could run g before f and get the same result.',
      reality: 'associativity is about GROUPING, not ORDER — m.Bind(f).Bind(g) and m.Bind(x => f(x).Bind(g)) both still run f before g; the law says regrouping the SAME left-to-right sequence produces an identical result, not that the sequence itself can be reordered.',
    },
  ];
}
