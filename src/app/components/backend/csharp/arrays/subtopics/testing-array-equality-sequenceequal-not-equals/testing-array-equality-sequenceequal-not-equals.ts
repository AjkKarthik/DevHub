import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-array-equality-sequenceequal-not-equals-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-array-equality-sequenceequal-not-equals.html',
  styleUrl: './testing-array-equality-sequenceequal-not-equals.scss',
})
export class TestingArrayEqualitySequenceequalNotEqualsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own challenge never gets tested — writing that test surfaces a real trap',
      points: [
        'The main Arrays page\'s own <code>ArrayStats.Rotate</code>/<code>Flatten</code> challenge is verified only by printing output. A natural first instinct when actually WRITING a test is <code>Assert.Equal(expected, actual)</code> on two arrays — this looks reasonable and, in xUnit specifically, HAPPENS TO WORK, but not for the reason most people assume.',
      ],
    },
    {
      heading: 'Arrays never override Equals() or == — the default is reference identity',
      points: [
        'Unlike <code>ValueTuple</code> (which the Tuples topic covers as having genuine structural equality), <code>System.Array</code> does NOT override <code>Equals()</code> or <code>==</code> — both fall back to <code>object.ReferenceEquals</code>. <code>new[] {1,2,3} == new[] {1,2,3}</code> is <code>false</code>, and <code>new[] {1,2,3}.Equals(new[] {1,2,3})</code> is also <code>false</code> — two distinct array instances with identical CONTENTS are never "equal" through these operators.',
        'xUnit\'s <code>Assert.Equal(expected, actual)</code> APPEARS to work correctly on arrays anyway — but only because xUnit special-cases <code>IEnumerable</code> and internally performs element-by-element comparison, NOT because arrays themselves gained structural equality. This is an xUnit-specific behavior, not a C# language guarantee.',
      ],
    },
    {
      heading: 'The trap: raw C# code (not an xUnit assertion) that compares arrays with == or .Equals() silently does the wrong thing',
      points: [
        'Outside of xUnit\'s special-cased assertion, writing <code>if (result == expected)</code> as validation logic anywhere in production code compares REFERENCES, not content — this quietly always returns <code>false</code> for two content-identical but distinct array instances, a bug that produces no compiler warning and no runtime exception, just silently wrong behavior.',
        'The correct, explicit, and unambiguous tool for content comparison — both inside a test AND in production logic — is LINQ\'s <code>SequenceEqual</code>: <code>result.SequenceEqual(expected)</code> compares element-by-element regardless of whether you\'re inside a test framework\'s assertion machinery or plain code.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trap — == and .Equals() on arrays compare references, not content',
      language: 'csharp',
      code: `int[] a = { 1, 2, 3 };
int[] b = { 1, 2, 3 };

Console.WriteLine(a == b);          // False — reference comparison!
Console.WriteLine(a.Equals(b));     // False — same reason
Console.WriteLine(ReferenceEquals(a, b)); // False — confirms it's identity, not content

// Even though the CONTENTS are identical, arrays never override
// Equals()/==  — System.Array inherits the default object identity
// behavior, unlike ValueTuple, which genuinely IS structural.`,
    },
    {
      label: 'Why Assert.Equal on arrays "just works" in xUnit — and why that\'s misleading',
      language: 'csharp',
      code: `using Xunit;

public class RotateTests
{
    [Fact]
    public void Rotate_ShiftsElementsLeft()
    {
        int[] nums = { 1, 2, 3, 4, 5 };
        ArrayStats.Rotate(nums, 2);

        // This PASSES — but not because int[] gained structural equality.
        // xUnit's Assert.Equal special-cases IEnumerable<T> and walks
        // both sequences element-by-element internally:
        Assert.Equal(new[] { 3, 4, 5, 1, 2 }, nums);
    }
}

// PROOF this is an xUnit-specific behavior, not a C# language guarantee —
// the plain C# equivalent of what the test is "really" checking is NOT
// "==" or ".Equals()", it's SequenceEqual:
bool actuallyEqual = new[] { 3, 4, 5, 1, 2 }.SequenceEqual(nums); // true`,
    },
    {
      label: 'The silent production bug — and the fix',
      language: 'csharp',
      code: `// A caching layer that only recomputes if the input array actually changed:
int[]? lastInput = null;
int[]? lastResult = null;

int[] ComputeCached(int[] input)
{
    if (input == lastInput)          // BUG: reference comparison!
        return lastResult!;           // cache "hit" almost never actually fires —
                                       // even the SAME logical array passed twice
                                       // as two separate instances never matches

    lastResult = ExpensiveCompute(input);
    lastInput = input;
    return lastResult;
}

// Fixed — explicit content comparison:
int[] ComputeCachedFixed(int[] input)
{
    if (lastInput != null && input.SequenceEqual(lastInput))
        return lastResult!;

    lastResult = ExpensiveCompute(input);
    lastInput = input;
    return lastResult;
}

int[] ExpensiveCompute(int[] input) => input.Select(x => x * 2).ToArray();`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a plain (non-test-framework) C# expression that correctly checks whether two <code>int[]</code> arrays, <code>a</code> and <code>b</code>, have identical contents — one that would work the same whether or not you\'re inside an xUnit assertion.',
    hint: 'Neither == nor .Equals() will work correctly for content comparison on arrays outside of xUnit\'s special-cased Assert.Equal. LINQ provides the explicit tool for this.',
    solution: `int[] a = { 1, 2, 3 };
int[] b = { 1, 2, 3 };

bool contentsMatch = a.SequenceEqual(b); // true — explicit, unambiguous,
                                          // works identically everywhere,
                                          // not tied to any test framework's
                                          // special-cased assertion behavior

// This is the SAME tool you'd reach for in a test:
Assert.True(a.SequenceEqual(b));
// ...or the framework-native form which happens to behave the same way
// for arrays specifically, because xUnit does this exact comparison
// internally:
Assert.Equal(a, b);`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'since Assert.Equal(expected, actualArray) works correctly in xUnit, arrays must have structural equality (== or .Equals() comparing content) in C#.',
      reality: 'arrays never override Equals()/== — both fall back to reference identity. Assert.Equal only appears to work because xUnit specifically special-cases IEnumerable and does element-by-element comparison internally.',
    },
    {
      thought: 'if a test using Assert.Equal on two arrays passes, then == would have also returned true for the same two arrays in plain code.',
      reality: '== on two distinct array instances with identical content always returns false (reference comparison) — the test passing tells you nothing about how == would behave; use SequenceEqual explicitly outside test assertions.',
    },
    {
      thought: 'ReferenceEquals and == behave differently on arrays, so testing with == would at least sometimes still capture more than plain reference identity.',
      reality: '== on arrays (with no custom operator overload) compiles down to exactly the same reference comparison as ReferenceEquals — there is no partial or fuzzy content awareness at all.',
    },
  ];
}
