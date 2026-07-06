import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-dynamicobject-wrappers-trygetmember-fallback-fail-paths-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-dynamicobject-wrappers-trygetmember-fallback-fail-paths.html',
  styleUrl: './testing-dynamicobject-wrappers-trygetmember-fallback-fail-paths.scss',
})
export class TestingDynamicobjectWrappersTrygetmemberFallbackFailPathsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own DynamicObject fluent-wrapper example is never tested for its two distinct failure contracts',
      points: [
        'The main dynamic & the DLR page\'s own <code>config.Database.ConnectionString</code>-style fluent wrapper example relies on <code>TryGetMember</code> returning <code>true</code> for known members and <code>false</code> (letting the DLR binder throw <code>RuntimeBinderException</code>) for unknown ones. Two genuinely separate, testable claims hide in that one method: "known members resolve to the correct value" and "unknown members correctly trigger the DLR\'s own exception, not a different one your code accidentally throws instead."',
      ],
    },
    {
      heading: 'Testing dynamic member access directly — via the dynamic keyword, not reflection',
      points: [
        'Because the whole point of a <code>DynamicObject</code> is to be accessed through the <code>dynamic</code> keyword, tests should exercise it the SAME way production code does — <code>dynamic wrapper = new ConfigWrapper(data); string value = wrapper.Database.ConnectionString;</code> — rather than reaching for reflection to invoke <code>TryGetMember</code> directly. Testing through the real <code>dynamic</code> call site is what actually exercises the DLR binder\'s behavior, confirming the whole pipeline (binder → your override → DLR\'s handling of true/false) works end to end.',
      ],
    },
    {
      heading: 'Testing the FAIL path requires asserting specifically on RuntimeBinderException, not a generic exception type',
      points: [
        'A test for the main page\'s own "return false and the binder throws" contract must specifically assert <code>Assert.Throws&lt;Microsoft.CSharp.RuntimeBinder.RuntimeBinderException&gt;(...)</code> — asserting merely <code>Assert.ThrowsAny&lt;Exception&gt;</code> would ALSO pass if your own <code>TryGetMember</code> override accidentally threw a DIFFERENT exception type instead of correctly returning <code>false</code> and letting the DLR handle it, silently hiding a real implementation bug.',
        'A genuinely thorough test suite for a <code>DynamicObject</code> subclass also verifies <code>GetDynamicMemberNames()</code> directly (a plain, ordinary method call, no <code>dynamic</code> needed) — confirming the exposed member list the main page says matters "for debuggers, serializers, and tooling" is actually complete and accurate, since nothing about the dynamic access path itself would catch a member missing from that list.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s fluent config wrapper, testable through the real dynamic keyword',
      language: 'csharp',
      code: `using System.Dynamic;

public class ConfigWrapper : DynamicObject
{
    private readonly Dictionary<string, object> _data;
    public ConfigWrapper(Dictionary<string, object> data) => _data = data;

    public override bool TryGetMember(GetMemberBinder binder, out object? result)
    {
        if (_data.TryGetValue(binder.Name, out var value))
        {
            // Nested dictionaries become nested ConfigWrappers —
            // enabling config.Database.ConnectionString-style chaining:
            result = value is Dictionary<string, object> nested
                ? new ConfigWrapper(nested)
                : value;
            return true;
        }
        result = null;
        return false; // let the DLR binder throw RuntimeBinderException
    }

    public override IEnumerable<string> GetDynamicMemberNames() => _data.Keys;
}`,
    },
    {
      label: 'Testing the success path through the REAL dynamic call site',
      language: 'csharp',
      code: `using Xunit;
using Microsoft.CSharp.RuntimeBinder;

public class ConfigWrapperTests
{
    [Fact]
    public void KnownMember_ResolvesToCorrectValue()
    {
        var data = new Dictionary<string, object>
        {
            ["Database"] = new Dictionary<string, object>
            {
                ["ConnectionString"] = "Server=.;Database=App"
            }
        };

        dynamic config = new ConfigWrapper(data);

        // Exercised through the REAL dynamic keyword — this is what
        // actually tests the DLR binder pipeline end to end, not just
        // TryGetMember in isolation:
        string connectionString = config.Database.ConnectionString;

        Assert.Equal("Server=.;Database=App", connectionString);
    }
}`,
    },
    {
      label: 'Testing the fail path — specifically RuntimeBinderException, not "any exception"',
      language: 'csharp',
      code: `public class ConfigWrapperFailPathTests
{
    [Fact]
    public void UnknownMember_ThrowsRuntimeBinderException_NotSomeOtherException()
    {
        var data = new Dictionary<string, object> { ["Database"] = "value" };
        dynamic config = new ConfigWrapper(data);

        // Asserting the SPECIFIC exception type matters — a weaker
        // Assert.ThrowsAny<Exception>() would also pass if TryGetMember
        // accidentally threw a NullReferenceException or KeyNotFoundException
        // itself instead of correctly returning false and letting the
        // DLR binder do its own thing:
        Assert.Throws<RuntimeBinderException>(() =>
        {
            var missing = config.NonExistentSetting;
        });
    }

    [Fact]
    public void GetDynamicMemberNames_ReflectsActualDataKeys()
    {
        var data = new Dictionary<string, object>
        {
            ["Database"] = "value",
            ["Logging"]  = "value",
        };
        var wrapper = new ConfigWrapper(data);

        // Plain, ordinary method call — no "dynamic" needed here at
        // all, since GetDynamicMemberNames() is a real, statically-
        // typed override. Nothing about the success/fail dynamic
        // access paths above would catch this list being incomplete:
        var names = wrapper.GetDynamicMemberNames().ToList();

        Assert.Contains("Database", names);
        Assert.Contains("Logging", names);
        Assert.Equal(2, names.Count);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A <code>DynamicObject</code> subclass\'s <code>TryGetMember</code> has a bug: it catches an internal <code>KeyNotFoundException</code> for missing keys and re-throws it directly instead of returning <code>false</code>. Write a test that would catch this bug specifically (a weaker test would not).',
    hint: 'Assert.Throws<RuntimeBinderException> is the specific check that fails if the wrapper throws KeyNotFoundException instead — a test using Assert.ThrowsAny<Exception>() would pass either way and miss the bug.',
    solution: `// The BUGGY implementation:
public class BuggyConfigWrapper : DynamicObject
{
    private readonly Dictionary<string, object> _data;
    public BuggyConfigWrapper(Dictionary<string, object> data) => _data = data;

    public override bool TryGetMember(GetMemberBinder binder, out object? result)
    {
        try
        {
            result = _data[binder.Name]; // throws KeyNotFoundException
                                          // for a missing key, instead
                                          // of using TryGetValue
            return true;
        }
        catch (KeyNotFoundException)
        {
            throw; // BUG: re-throws instead of returning false —
                   // callers get KeyNotFoundException, NOT the
                   // expected RuntimeBinderException
        }
    }
}

[Fact]
public void UnknownMember_ShouldThrowRuntimeBinderException_CatchesTheBug()
{
    dynamic wrapper = new BuggyConfigWrapper(new Dictionary<string, object>());

    // This SPECIFIC assertion FAILS against the buggy implementation —
    // it actually throws KeyNotFoundException, not RuntimeBinderException,
    // so xUnit reports a clear mismatch rather than a false pass:
    Assert.Throws<RuntimeBinderException>(() =>
    {
        var missing = wrapper.AnythingAtAll;
    });

    // A WEAKER test using Assert.ThrowsAny<Exception>() would have
    // PASSED against this exact buggy implementation, since
    // KeyNotFoundException IS "any exception" — completely missing
    // the fact that the wrong exception type is escaping.
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a DynamicObject subclass should call its TryGetMember/TrySetMember overrides directly, using reflection, rather than through the actual dynamic keyword.',
      reality: 'exercising the wrapper through a real dynamic-typed variable tests the ENTIRE pipeline — the DLR binder\'s handling of your true/false return value included — rather than just your override method in isolation.',
    },
    {
      thought: 'a test asserting that accessing an unknown member "throws an exception" (any exception) adequately verifies the DynamicObject\'s fail-path contract.',
      reality: 'asserting specifically on RuntimeBinderException catches a real bug class — an override that accidentally throws a different exception type (like KeyNotFoundException) instead of correctly returning false — that a generic "throws any exception" assertion would completely miss.',
    },
    {
      thought: 'GetDynamicMemberNames() is automatically kept in sync with whatever TryGetMember actually resolves, so testing one implicitly verifies the other.',
      reality: 'they are two entirely separate, independently-overridable methods with no automatic connection — a member that TryGetMember correctly resolves can still be missing from GetDynamicMemberNames(), and only a direct test of that method\'s return value catches the gap.',
    },
  ];
}
