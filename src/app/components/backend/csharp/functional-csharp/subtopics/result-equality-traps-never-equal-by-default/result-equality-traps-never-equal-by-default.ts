import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-result-equality-traps-never-equal-by-default-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './result-equality-traps-never-equal-by-default.html',
  styleUrl: './result-equality-traps-never-equal-by-default.scss',
})
export class ResultEqualityTrapsNeverEqualByDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s hand-rolled Result<T> is declared "sealed class" — that word choice has a quiet consequence for testing',
      points: [
        'The main Functional C# page\'s hand-rolled <code>Result&lt;T&gt;</code> is declared as <code>public sealed class Result&lt;T&gt;</code> — an ORDINARY class, not a <code>record</code>. Ordinary classes get REFERENCE equality from <code>object.Equals</code> and <code>==</code> by default: two DIFFERENT <code>Result&lt;T&gt;</code> instances are never <code>Equal</code>, even if they represent the identical logical outcome (both successful, both holding the same value).',
      ],
    },
    {
      heading: 'This silently breaks the most natural way to test Result-returning code: Assert.Equal on the whole Result',
      points: [
        'A test written as <code>Assert.Equal(Result&lt;int&gt;.Success(10), GetSomeResult())</code> LOOKS like it should pass when both sides represent "success with value 10" — but with the main page\'s hand-rolled <code>Result&lt;T&gt;</code>, this assertion FAILS every time, because xUnit\'s <code>Assert.Equal</code> falls back to <code>object.Equals</code> for a type with no equality override, which is REFERENCE equality — two separately constructed instances are never the same reference, regardless of their logical content.',
        'This is a genuinely easy trap to fall into specifically because it looks so natural: comparing two Results for "the same outcome" feels like exactly the kind of thing <code>Assert.Equal</code> should handle, and the failure message (showing two seemingly identical-looking Result objects as "not equal") is confusing rather than obviously pointing at the real cause.',
      ],
    },
    {
      heading: 'The fix: assert on the unwrapped fields, or convert Result<T> to a record',
      points: [
        'The immediately practical fix, with NO changes to <code>Result&lt;T&gt;</code> itself, is to assert on the UNWRAPPED fields instead of the whole Result object: <code>Assert.True(result.IsSuccess); Assert.Equal(10, result.Value);</code> — this compares the actual data, sidestepping the whole-object reference-equality problem entirely.',
        'The more structural fix is to change <code>Result&lt;T&gt;</code>\'s declaration from <code>sealed class</code> to <code>sealed record</code> — records get COMPILER-GENERATED value equality automatically (comparing every field), which would make <code>Assert.Equal(Result&lt;int&gt;.Success(10), otherResult)</code> work exactly as naturally expected. This is a real, low-risk enhancement worth considering for any hand-rolled Result type used across a codebase with many tests comparing Results directly.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trap — Assert.Equal on two logically-identical Results fails',
      language: 'csharp',
      code: `using Xunit;

// The main page's own hand-rolled Result<T> — declared as a plain
// sealed CLASS, not a record:
public sealed class Result<T>
{
    public bool IsSuccess { get; }
    // ... Value, Error, Map, Bind, Match as in the main page ...
    private Result(T value) { IsSuccess = true; /* ... */ }
    public static Result<T> Success(T value) => new(value);
}

public class ResultEqualityTrapTests
{
    [Fact]
    public void TwoSuccessfulResults_WithSameValue_AreNotEqual()
    {
        var a = Result<int>.Success(10);
        var b = Result<int>.Success(10);

        // This FAILS — surprisingly, given both represent "success
        // with value 10". Without an equality override, == and
        // .Equals() fall back to REFERENCE equality — a and b are
        // two entirely different objects:
        Assert.False(a.Equals(b));           // confirms the trap exists
        Assert.False(ReferenceEquals(a, b)); // confirms WHY — different instances

        // Assert.Equal(a, b) would ALSO fail here for the exact same
        // reason, which is the surprising, easy-to-hit trap in tests.
    }
}`,
    },
    {
      label: 'The immediate fix — assert on unwrapped fields instead of the whole object',
      language: 'csharp',
      code: `public class UnwrappedFieldTests
{
    [Fact]
    public void GetUser_ReturnsSuccessWithExpectedValue()
    {
        var result = GetUser(42); // returns Result<User>

        // DON'T do this — will fail even on a genuinely correct result:
        // Assert.Equal(Result<User>.Success(expectedUser), result);

        // DO this instead — compares the actual DATA, sidestepping
        // Result<T>'s lack of value equality entirely:
        Assert.True(result.IsSuccess);
        Assert.Equal("Alice", result.Value.Name);
        Assert.Equal(42, result.Value.Id);
    }

    [Fact]
    public void GetUser_NotFound_ReturnsExpectedFailureMessage()
    {
        var result = GetUser(999);

        Assert.True(result.IsFailed);
        Assert.Equal("User 999 not found", result.Error);
    }

    static Result<User> GetUser(int id) =>
        id == 42
            ? Result<User>.Success(new User(42, "Alice"))
            : Result<User>.Failure($"User {id} not found");
}

public record User(int Id, string Name);`,
    },
    {
      label: 'The structural fix — sealed record gives value equality automatically',
      language: 'csharp',
      code: `// Changing "sealed class" to "sealed record" — the constructors and
// factory methods stay identical; only the equality behavior changes:
public sealed record Result<T>
{
    public bool IsSuccess { get; }
    public T?      Value  { get; }
    public string? Error  { get; }

    private Result(bool isSuccess, T? value, string? error)
        { IsSuccess = isSuccess; Value = value; Error = error; }

    public static Result<T> Success(T value)    => new(true,  value, null);
    public static Result<T> Failure(string err) => new(false, default, err);
}

public class RecordEqualityTests
{
    [Fact]
    public void TwoSuccessfulResults_WithSameValue_AreNowEqual()
    {
        var a = Result<int>.Success(10);
        var b = Result<int>.Success(10);

        // Records get COMPILER-GENERATED value equality — comparing
        // every field automatically. This now works exactly as
        // naturally expected:
        Assert.Equal(a, b);          // PASSES now
        Assert.True(a == b);         // records override == too
        Assert.False(ReferenceEquals(a, b)); // still different instances,
                                              // but that no longer matters
                                              // for equality comparison
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A test asserts <code>Assert.Equal(Result&lt;int&gt;.Failure("not found"), GetItem(999))</code> and unexpectedly fails, even though printing both sides shows what looks like the same failure message. Explain why, and give the two possible fixes.',
    hint: 'Consider whether Result<T> as declared in the main topic page overrides Equals()/== — and if not, what kind of equality Assert.Equal falls back to for an ordinary class.',
    solution: `// The main page's Result<T> is a plain "sealed class" with NO
// Equals()/== override — so Assert.Equal falls back to reference
// equality via object.Equals(). Two separately-constructed
// Result<int>.Failure("not found") instances are NEVER the same
// reference, so the assertion fails regardless of how identical
// their Error messages look when printed.

// Fix 1 — assert on the unwrapped field instead of the whole object:
var result = GetItem(999);
Assert.True(result.IsFailed);
Assert.Equal("not found", result.Error);
// This compares the ACTUAL error message string, which DOES have
// proper value equality (string overrides Equals()) — sidestepping
// Result<T>'s lack of equality entirely.

// Fix 2 — change Result<T>'s declaration from "sealed class" to
// "sealed record" (a structural, one-time change to the type itself):
public sealed record Result<T> { /* same members, same factory methods */ }
// After this change, Assert.Equal(Result<int>.Failure("not found"),
// GetItem(999)) WOULD pass, because records compare every field for
// value equality automatically — no changes needed at any of the many
// call sites that construct or consume Result<T> throughout the
// codebase, only at its single declaration.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Assert.Equal(expectedResult, actualResult) is always a safe, natural way to test any Result<T>-returning method.',
      reality: 'if Result<T> is an ordinary class with no equality override (as in the main page\'s own hand-rolled version), Assert.Equal falls back to reference equality — two logically identical Results (same success/failure state, same value) will never be considered equal, and the assertion fails misleadingly.',
    },
    {
      thought: 'two Result<T> instances printing the same value in a test failure message must be logically equal.',
      reality: 'the printed representation reflects the OBJECT\'s content, but equality comparison (via Equals()/==) is a SEPARATE mechanism — without an override, it compares object identity, not content, regardless of how similar the printed values look.',
    },
    {
      thought: 'the only way to fix Result<T> equality issues in tests is to always unwrap and compare individual fields manually.',
      reality: 'changing the type\'s declaration from "sealed class" to "sealed record" gives it compiler-generated value equality automatically — a one-time, low-risk structural fix that makes whole-object Assert.Equal comparisons work naturally everywhere in the codebase.',
    },
  ];
}
