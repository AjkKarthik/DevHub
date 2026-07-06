import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-exception-filters-verifying-when-predicate-logic-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-exception-filters-verifying-when-predicate-logic.html',
  styleUrl: './testing-exception-filters-verifying-when-predicate-logic.scss',
})
export class TestingExceptionFiltersVerifyingWhenPredicateLogicSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows filters extensively — never how to test them',
      points: [
        'The main Exceptions page covers <code>when</code> filters in depth: retry logic, logging-without-catching, transient-error detection — but every example is demonstrated by RUNNING it, never by writing an automated test for it. Exception filters have a genuinely different testing shape than a normal catch block, because <code>Assert.Throws&lt;T&gt;</code> only tells you SOME catch clause matched — not WHICH one, and not whether a specific filter\'s predicate logic is correct.',
      ],
    },
    {
      heading: 'Two separate things need testing: the predicate, and the wiring',
      points: [
        'The cleanest approach is to extract the filter predicate into its own named, testable method or local function (exactly like the main page\'s <code>IsTransient(Exception ex)</code> retry example) — then unit test THAT function directly and exhaustively, with no exception machinery involved at all: call <code>IsTransient(new TimeoutException())</code> and assert <code>true</code>, no try/catch required.',
        'Separately, a SMALL number of integration-style tests should verify the filter is actually WIRED to the right catch clause — that throwing a transient exception really does trigger a retry, and throwing a non-transient one really does propagate immediately. This catches wiring bugs (e.g. the filter was attached to the wrong catch clause, or a copy-paste left the wrong predicate in place) that a pure predicate unit test cannot catch.',
      ],
    },
    {
      heading: 'A spy predicate proves a filter was evaluated even when it returns false',
      points: [
        'The main page\'s "logging without catching" pattern — <code>catch (Exception ex) when (Log(ex))</code> where <code>Log</code> always returns <code>false</code> — is specifically hard to test with <code>Assert.Throws</code> alone, because the exception still propagates whether or not <code>Log</code> ran. The test must instead assert on a SIDE EFFECT of the filter itself: wrap the logging call in a spy/counter and assert it was invoked exactly once, in addition to asserting the exception still propagated unchanged.',
        'This is a genuinely different testing shape from ordinary exception testing — you are not asserting on what was CAUGHT, you are asserting that a filter was EVALUATED, which requires observing a side effect of the predicate rather than the catch block\'s own behavior.',
      ],
    },
    {
      heading: 'Testing "does the filter run when it should NOT catch" is just as important',
      points: [
        'It is just as important to test the NEGATIVE case: given a non-transient exception, does the exception genuinely propagate all the way out, or does some overly broad filter accidentally swallow it? A common bug is a filter predicate that returns <code>true</code> too broadly (e.g. checking only the exception TYPE and ignoring the retry-count condition from the main page\'s retry example), silently retrying forever instead of eventually letting the exception through.',
        'A dedicated test asserting <code>await Assert.ThrowsAsync&lt;TimeoutException&gt;(...)</code> on the FINAL retry attempt (with the retry count exhausted) verifies the filter correctly stops catching once <code>attempt &gt;= maxRetries</code> — exactly the condition from the main page\'s retry challenge that is easy to get backwards.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Extract the predicate — test it directly, no exception machinery needed',
      language: 'csharp',
      code: `// The predicate from the main topic's retry example, extracted so it can
// be tested in complete isolation from any actual try/catch/when wiring:
public static class TransientErrorDetector
{
    public static bool IsTransient(Exception ex) =>
        ex is TimeoutException
        || (ex is HttpRequestException h && (int?)h.StatusCode >= 500);
}

public class TransientErrorDetectorTests
{
    [Fact]
    public void TimeoutException_IsTransient() =>
        Assert.True(TransientErrorDetector.IsTransient(new TimeoutException()));

    [Fact]
    public void HttpRequestException_With500_IsTransient() =>
        Assert.True(TransientErrorDetector.IsTransient(
            new HttpRequestException("fail", null, System.Net.HttpStatusCode.InternalServerError)));

    [Fact]
    public void HttpRequestException_With404_IsNotTransient() =>
        Assert.False(TransientErrorDetector.IsTransient(
            new HttpRequestException("fail", null, System.Net.HttpStatusCode.NotFound)));

    [Fact]
    public void ArgumentException_IsNotTransient() =>
        Assert.False(TransientErrorDetector.IsTransient(new ArgumentException()));
}
// No try/catch/when needed at all here — this exhaustively tests the LOGIC
// the filter depends on, at a fraction of the ceremony of an integration test.`,
    },
    {
      label: 'Testing the wiring — does the filter actually gate the right catch?',
      language: 'csharp',
      code: `public class RetryAsyncTests
{
    [Fact]
    public async Task TransientFailure_RetriesUntilSuccess()
    {
        var callCount = 0;

        var result = await RetryAsync(
            operation: async () =>
            {
                callCount++;
                if (callCount < 3) throw new TimeoutException("Simulated timeout");
                return await Task.FromResult("done");
            },
            maxRetries: 3,
            isTransient: TransientErrorDetector.IsTransient);

        Assert.Equal("done", result);
        Assert.Equal(3, callCount); // proves it actually retried, not just succeeded first try
    }

    [Fact]
    public async Task NonTransientFailure_PropagatesImmediately_NoRetry()
    {
        var callCount = 0;

        await Assert.ThrowsAsync<ArgumentException>(() => RetryAsync<string>(
            operation: () =>
            {
                callCount++;
                throw new ArgumentException("Not transient");
            },
            maxRetries: 3,
            isTransient: TransientErrorDetector.IsTransient));

        Assert.Equal(1, callCount); // proves the filter correctly did NOT retry —
        // a filter that returns true too broadly would make this fail with
        // callCount == 4 (one initial attempt + 3 unwanted retries)
    }

    [Fact]
    public async Task TransientFailure_ExhaustsRetries_ThenPropagates()
    {
        // Always throws — proves the filter correctly stops retrying once
        // attempt >= maxRetries, exactly the boundary condition that is
        // easy to get backwards in the "when" clause.
        await Assert.ThrowsAsync<TimeoutException>(() => RetryAsync<string>(
            operation: () => throw new TimeoutException("Always fails"),
            maxRetries: 2,
            isTransient: TransientErrorDetector.IsTransient));
    }
}`,
    },
    {
      label: 'Testing "logging without catching" — assert on the side effect',
      language: 'csharp',
      code: `// The main topic's logging-without-catching pattern:
static bool Log(Exception ex, List<string> log)
{
    log.Add($"Observed: {ex.GetType().Name}");
    return false; // never catch — just observe
}

public class LoggingWithoutCatchingTests
{
    [Fact]
    public void FilterRuns_EvenThoughItNeverCatches()
    {
        var log = new List<string>();

        // Assert.Throws confirms the exception still propagated —
        // but that alone does NOT prove the filter/Log ever ran.
        var thrown = Assert.Throws<InvalidOperationException>(() =>
        {
            try
            {
                throw new InvalidOperationException("boom");
            }
            catch (Exception ex) when (Log(ex, log))
            {
                // Never reached — Log always returns false
            }
        });

        // The SIDE EFFECT is the real assertion here — it proves the filter
        // was genuinely evaluated, which Assert.Throws alone cannot show:
        Assert.Single(log);
        Assert.Equal("Observed: InvalidOperationException", log[0]);
        Assert.Equal("boom", thrown.Message); // stack trace/message untouched
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate\'s <code>isTransient</code> predicate is <code>ex => ex is TimeoutException</code> — missing the <code>HttpRequestException</code> with 5xx status check entirely. Write a single xUnit test (using the extracted predicate directly, not the full retry method) that would fail against this buggy predicate but pass against the correct one from the code examples.',
    hint: 'Since the predicate is extracted as its own testable function, you do not need any retry/exception-filter machinery to catch this bug — just call the predicate directly with an HttpRequestException carrying a 500 status code and assert it returns true.',
    solution: `[Fact]
public void HttpRequestException_With503_IsTransient()
{
    var ex = new HttpRequestException(
        "Service unavailable", null, System.Net.HttpStatusCode.ServiceUnavailable);

    // Against the buggy predicate (ex => ex is TimeoutException), this
    // returns false and the test FAILS — HttpRequestException is never
    // matched at all, regardless of its status code.
    //
    // Against the correct predicate from the code examples, this returns
    // true and the test PASSES.
    Assert.True(TransientErrorDetector.IsTransient(ex));
}

// This is exactly the value of extracting the predicate: catching a real
// logic bug (an entire exception TYPE silently excluded from retry
// handling) with a one-line test and zero exception-throwing ceremony —
// far cheaper than an integration test that has to actually trigger a
// retry loop to prove the same thing.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>Assert.Throws&lt;T&gt;</code> is enough to verify that a specific exception filter\'s predicate logic is correct.',
      reality: '<code>Assert.Throws&lt;T&gt;</code> only proves that SOME catch clause let the exception through (or none did) — it cannot distinguish which filter evaluated, or whether the filter\'s condition was actually correct versus accidentally too broad or too narrow.',
    },
    {
      thought: 'testing the "logging without catching" pattern only requires asserting the exception still propagates, since the catch block itself never executes.',
      reality: 'the exception propagating proves the filter returned false, but says nothing about whether the filter\'s side effect (the logging call) actually ran — that requires asserting on a spy or captured side effect, not just the thrown exception.',
    },
    {
      thought: 'a retry-with-backoff method is only correctly tested by verifying the FINAL result — that it eventually returns success or eventually throws.',
      reality: 'the boundary condition (does the filter stop retrying at exactly attempt >= maxRetries, not one attempt more or less) is a distinct, easy-to-get-backwards piece of logic that needs its own dedicated test asserting the exact call count or that the exception propagates once retries are exhausted.',
    },
  ];
}
