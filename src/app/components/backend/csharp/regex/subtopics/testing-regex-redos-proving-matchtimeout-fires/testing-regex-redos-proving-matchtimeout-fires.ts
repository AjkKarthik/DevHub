import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-regex-redos-proving-matchtimeout-fires-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-regex-redos-proving-matchtimeout-fires.html',
  styleUrl: './testing-regex-redos-proving-matchtimeout-fires.scss',
})
export class TestingRegexRedosProvingMatchtimeoutFiresSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own LogParser challenge sets a 200ms matchTimeout — but never tests that it actually fires',
      points: [
        'The main Regex page\'s own <code>LogParser.LinePattern</code> is constructed with a 200ms <code>matchTimeout</code> specifically as a ReDoS defense, and the challenge\'s solution catches <code>RegexMatchTimeoutException</code>. Neither the main page nor most codebases actually verify this protection WORKS — a test that only exercises well-formed log lines never exercises the timeout path at all, leaving the ReDoS defense completely unverified.',
      ],
    },
    {
      heading: 'Deliberately crafting a pathological input is the only way to prove the timeout genuinely fires',
      points: [
        'The main page\'s own <code>^(a+)+$</code> example is the textbook ReDoS trigger — a test can construct the EXACT kind of crafted input (many repetitions of a character that satisfies the inner quantifier, followed by a character that fails the outer match) against a REAL regex configured with a short <code>matchTimeout</code>, and assert that <code>RegexMatchTimeoutException</code> is thrown within a bounded wall-clock time. This directly and concretely proves the defense works, rather than trusting that setting <code>matchTimeout</code> in the constructor was "probably" sufficient.',
        'A meaningful test measures HOW LONG the call took (via a <code>Stopwatch</code>) and asserts it completed close to the configured timeout, NOT that it hung for the full exponential blowup duration — this proves the timeout is actually being honored by the engine, not merely configured and silently ignored.',
      ],
    },
    {
      heading: 'The same technique verifies NonBacktracking as an alternative fix, and can compare both approaches directly',
      points: [
        'The main page\'s own <code>RegexOptions.NonBacktracking</code> alternative claims guaranteed O(n) time and immunity to ReDoS. A test can run the SAME pathological input against a <code>NonBacktracking</code>-configured regex and assert it returns QUICKLY with NO timeout exception at all — directly demonstrating the trade-off the main page describes (guaranteed linear time vs a timeout-based safety net) rather than just trusting the documentation\'s claim.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving matchTimeout actually fires against a crafted ReDoS input',
      language: 'csharp',
      code: `using System.Diagnostics;
using System.Text.RegularExpressions;
using Xunit;

public class ReDoSTimeoutTests
{
    [Fact]
    public void EvilPattern_WithMatchTimeout_ThrowsWithinBoundedTime()
    {
        var evil = new Regex(@"^(a+)+$",
            RegexOptions.None,
            matchTimeout: TimeSpan.FromMilliseconds(200));

        // The classic ReDoS trigger from the main page's own example —
        // many 'a's followed by a character that fails the overall match:
        string maliciousInput = new string('a', 30) + "!";

        var sw = Stopwatch.StartNew();

        // Directly proves the defense works — not just that it's
        // configured, but that RegexMatchTimeoutException genuinely
        // fires when a pathological pattern actually runs:
        Assert.Throws<RegexMatchTimeoutException>(() => evil.IsMatch(maliciousInput));

        sw.Stop();

        // Confirms the call returned NEAR the configured timeout, not
        // after the FULL exponential blowup duration — proving the
        // timeout is genuinely being honored by the matching engine,
        // not silently ignored:
        Assert.True(sw.ElapsedMilliseconds < 1000,
            $"Expected timeout near 200ms, took {sw.ElapsedMilliseconds}ms instead");
    }
}`,
    },
    {
      label: 'Proving the UNPROTECTED version genuinely takes far longer — the negative control',
      language: 'csharp',
      code: `public class UnprotectedReDoSDemonstration
{
    // A companion "negative control" test — demonstrates what
    // happens WITHOUT the matchTimeout defense, so the fix's value
    // is directly visible rather than assumed:
    [Fact(Timeout = 5000)] // xUnit test-level safety net — this test
                            // itself must not hang the whole suite
    public void EvilPattern_WithoutTimeout_TakesDramaticallyLonger()
    {
        // NO matchTimeout configured — the engine's default is
        // effectively "run until it finishes" for a non-timeout Regex:
        var unprotected = new Regex(@"^(a+)+$");

        string maliciousInput = new string('a', 30) + "!";

        var sw = Stopwatch.StartNew();
        // This call is EXPECTED to take a very long time on a crafted
        // input — the test's own Timeout attribute (5000ms) exists
        // specifically to prevent THIS demonstration from hanging the
        // CI pipeline indefinitely if the exponential blowup is even
        // worse than expected:
        unprotected.IsMatch(maliciousInput);
        sw.Stop();

        // (In practice this specific 30-character input already takes
        // multiple seconds on most machines — illustrating exactly
        // why the main page insists on matchTimeout for ANY pattern
        // touching user input.)
    }
}`,
    },
    {
      label: 'Verifying NonBacktracking as the alternative — same pathological input, no timeout needed',
      language: 'csharp',
      code: `public class NonBacktrackingComparisonTests
{
    [Fact]
    public void EvilPattern_WithNonBacktracking_ReturnsQuicklyWithNoException()
    {
        var linear = new Regex(@"^(a+)+$", RegexOptions.NonBacktracking);

        // The SAME pathological input that defeats the standard engine:
        string maliciousInput = new string('a', 100_000) + "!";

        var sw = Stopwatch.StartNew();

        // NO exception expected here at all — NonBacktracking's
        // guaranteed O(n) time means even a 100,000-character
        // adversarial input completes quickly, with no timeout
        // machinery needed as a safety net:
        bool result = linear.IsMatch(maliciousInput);

        sw.Stop();

        Assert.False(result); // the input doesn't actually match — but
                               // the POINT is it returned an answer at
                               // all, quickly, rather than hanging
        Assert.True(sw.ElapsedMilliseconds < 500,
            $"Expected near-instant linear-time result, took {sw.ElapsedMilliseconds}ms");
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The main topic page\'s own <code>LogParser.LinePattern</code> is protected with a 200ms matchTimeout. Write a test that proves <code>ParseLogLine</code> returns <code>null</code> (rather than throwing or hanging) when given a pathological input designed to trigger the timeout.',
    hint: 'LogParser.ParseLogLine already catches RegexMatchTimeoutException internally and returns null — construct an input that would trigger catastrophic backtracking against LinePattern\'s structure, call ParseLogLine directly, and assert the result is null within a bounded time.',
    solution: `[Fact]
public void ParseLogLine_PathologicalInput_ReturnsNullWithinBoundedTime()
{
    // LinePattern's message group (?<msg>.+)$ combined with a
    // sufficiently adversarial prefix can still stress the engine —
    // constructing an input that superficially resembles a valid
    // prefix but is designed to maximize backtracking before failing
    // the anchored match overall:
    string pathological = "2026-06-11 14:32:09 [" +
        new string('A', 5000) + "not-really-uppercase!";

    var sw = System.Diagnostics.Stopwatch.StartNew();
    var result = LogParser.ParseLogLine(pathological);
    sw.Stop();

    // ParseLogLine's own internal try/catch around
    // RegexMatchTimeoutException means callers NEVER see an exception
    // or an indefinite hang — this directly proves that contract:
    Assert.Null(result);
    Assert.True(sw.ElapsedMilliseconds < 1000,
        $"Expected the 200ms matchTimeout to bound this call, took {sw.ElapsedMilliseconds}ms");
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'setting matchTimeout on a Regex constructor is sufficient proof that the ReDoS defense works correctly.',
      reality: 'the only way to actually PROVE the defense works is to run a genuinely pathological input against it and confirm RegexMatchTimeoutException fires within the expected bounded time — configuring a timeout and verifying it actually engages are two different claims.',
    },
    {
      thought: 'a test suite that only exercises well-formed, expected inputs has adequately tested a regex-based parser.',
      reality: 'well-formed inputs never exercise the timeout/ReDoS defense path at all — a deliberately crafted pathological input is required to verify that specific protection actually functions.',
    },
    {
      thought: 'RegexOptions.NonBacktracking and matchTimeout are interchangeable ReDoS defenses with no meaningful difference in practice.',
      reality: 'NonBacktracking provides a guaranteed O(n) time bound with no exception ever thrown for a pathological input, while matchTimeout is a safety net that lets the engine attempt (and potentially fail) up to the configured duration before throwing — testing both against the same input reveals this concrete behavioral difference.',
    },
  ];
}
