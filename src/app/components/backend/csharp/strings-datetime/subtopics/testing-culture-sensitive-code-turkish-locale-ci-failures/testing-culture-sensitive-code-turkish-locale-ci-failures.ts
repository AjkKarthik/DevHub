import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-culture-sensitive-code-turkish-locale-ci-failures-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-culture-sensitive-code-turkish-locale-ci-failures.html',
  styleUrl: './testing-culture-sensitive-code-turkish-locale-ci-failures.scss',
})
export class TestingCultureSensitiveCodeTurkishLocaleCiFailuresSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions the Turkish "İ"/"ı" bug as a one-line example — this is the famous, real-world test failure it causes',
      points: [
        'The main Strings, DateTime & Math page notes, in passing, that <code>"I".ToLower()</code> returns <code>"ı"</code> (dotless i) in a Turkish locale. This is not just a curiosity — it is exactly what makes a <code>ToUpper()</code>/<code>ToLower()</code>-based comparison silently fail when the SAME test suite runs on a CI machine or container configured with <code>tr-TR</code> as its OS/default culture, even though the exact same test passes locally on an <code>en-US</code> developer machine.',
      ],
    },
    {
      heading: 'A test can pass 100% of the time locally and still be culture-dependent — the bug is invisible until the environment changes',
      points: [
        'Code like <code>Assert.True(input.ToUpper() == "ISTANBUL")</code> passes reliably on a developer\'s en-US machine, because <code>CultureInfo.CurrentCulture</code> there does not remap "i" specially. The SAME assertion, given the SAME input, silently produces a DIFFERENT uppercase result on a machine whose OS locale is Turkish — because <code>string.ToUpper()</code> (no arguments) uses <code>CultureInfo.CurrentCulture</code> by default, which is an AMBIENT, environment-dependent setting the test never controls or even references.',
        'This is exactly why this class of bug is famously called "the Turkey test" in the .NET community — it is a real, recurring category of CI failure, not a hypothetical edge case, and it specifically targets any code using culture-sensitive casing without an explicit <code>CultureInfo</code> or <code>StringComparison</code>.',
      ],
    },
    {
      heading: 'The fix is the same discipline the main page recommends for comparisons — applied specifically to unit tests',
      points: [
        'A robust test should either (a) call the culture-INVARIANT overloads explicitly — <code>ToUpperInvariant()</code>/<code>ToLowerInvariant()</code> — which never vary regardless of the running machine\'s locale, or (b) explicitly set <code>CultureInfo.CurrentCulture</code> to a KNOWN value (e.g. <code>tr-TR</code>) for the duration of the test, to deliberately PROVE the code is culture-safe under a hostile locale rather than merely hoping the CI runner happens to use en-US.',
        'The most robust CI setups deliberately run at least one test pass with <code>CurrentCulture</code> forced to <code>tr-TR</code> or <code>tr-CY</code> specifically BECAUSE this locale is the most aggressive, well-known trigger for casing bugs — passing under Turkish locale is treated as a strong signal that the code is genuinely culture-safe everywhere else too.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — passes locally, fails silently under a different OS locale',
      language: 'csharp',
      code: `// Code under test — looks completely reasonable:
static bool IsMatch(string input) => input.ToUpper() == "ISTANBUL";

// On an en-US machine:
Console.WriteLine(IsMatch("istanbul"));  // True — as expected

// On a machine (or CI container) whose OS default culture is tr-TR:
// "istanbul".ToUpper() produces "İSTANBUL" (capital dotted İ, U+0130) —
// NOT the ASCII "ISTANBUL" the code compares against — so the SAME
// call now returns False, with NO code change, NO test change, and
// NO exception. The only thing that changed is the environment.`,
    },
    {
      label: 'Reproducing the failure deterministically in a test — the fix that PROVES culture-safety',
      language: 'csharp',
      code: `using Xunit;
using System.Globalization;
using System.Threading;

public class IsMatchTests
{
    [Fact]
    public void IsMatch_WorksUnderTurkishLocale()
    {
        // Force the "hostile" locale deliberately — this is exactly
        // the environment condition that silently breaks the naive
        // ToUpper()-based comparison, reproduced on purpose instead of
        // hoping CI never runs under it:
        var original = CultureInfo.CurrentCulture;
        try
        {
            Thread.CurrentThread.CurrentCulture = new CultureInfo("tr-TR");

            // This ASSERTS on the CURRENT (buggy) implementation and
            // is EXPECTED to fail here, proving the bug exists:
            Assert.False(IsMatch("istanbul")); // fails under naive ToUpper()
        }
        finally
        {
            Thread.CurrentThread.CurrentCulture = original; // always restore
        }
    }

    static bool IsMatch(string input) => input.ToUpper() == "ISTANBUL";
}`,
    },
    {
      label: 'The fix — culture-invariant casing, verified under the hostile locale',
      language: 'csharp',
      code: `using System.Globalization;
using System.Threading;

// Fixed implementation — explicitly culture-invariant:
static bool IsMatchFixed(string input) =>
    input.ToUpperInvariant() == "ISTANBUL";
// ToUpperInvariant() NEVER varies by CurrentCulture — it always applies
// the same, locale-independent casing rules regardless of the machine
// it runs on.

public class IsMatchFixedTests
{
    [Fact]
    public void IsMatchFixed_WorksUnderTurkishLocale()
    {
        var original = CultureInfo.CurrentCulture;
        try
        {
            Thread.CurrentThread.CurrentCulture = new CultureInfo("tr-TR");

            // Now genuinely passes under the hostile locale — proving
            // the fix, not just hoping the CI runner's locale is en-US:
            Assert.True(IsMatchFixed("istanbul"));
        }
        finally
        {
            Thread.CurrentThread.CurrentCulture = original;
        }
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A method checks <code>if (fileExtension.ToLower() == "png")</code>. Write a test that would deterministically catch this being culture-unsafe, and explain what the correct fix looks like.',
    hint: 'Force CurrentCulture to tr-TR inside the test (in a try/finally that restores it), pass an input containing an "I" or similar letter affected by Turkish casing, and assert the CURRENT behavior fails — then fix using ToLowerInvariant() or an explicit StringComparison and show the test passes.',
    solution: `// Original (culture-unsafe) code:
static bool IsPng(string fileExtension) => fileExtension.ToLower() == "png";

// Note: "png" itself has no letters affected by Turkish casing, so a
// more revealing test input uses a letter that DOES change — e.g. "PNG"
// vs the Turkish-sensitive letter "I":
static bool IsMatchLetter(string s) => s.ToLower() == "istanbul";

[Fact]
public void IsMatchLetter_FailsUnderTurkishLocale_BeforeFix()
{
    var original = CultureInfo.CurrentCulture;
    try
    {
        Thread.CurrentThread.CurrentCulture = new CultureInfo("tr-TR");
        Assert.False(IsMatchLetter("ISTANBUL")); // proves the bug:
        // "ISTANBUL".ToLower() under tr-TR produces "ıstanbul" (dotless),
        // not "istanbul" — so the naive comparison fails here.
    }
    finally { Thread.CurrentThread.CurrentCulture = original; }
}

// Fix — always use the Invariant overload for non-user-facing comparisons:
static bool IsMatchLetterFixed(string s) => s.ToLowerInvariant() == "istanbul";

[Fact]
public void IsMatchLetterFixed_PassesUnderTurkishLocale()
{
    var original = CultureInfo.CurrentCulture;
    try
    {
        Thread.CurrentThread.CurrentCulture = new CultureInfo("tr-TR");
        Assert.True(IsMatchLetterFixed("ISTANBUL")); // now culture-safe
    }
    finally { Thread.CurrentThread.CurrentCulture = original; }
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a test passes reliably on every developer machine and in CI, the code it tests must be culture-safe.',
      reality: 'a culture bug is invisible until the code actually runs under a different CurrentCulture — a test suite that never forces a non-default locale can pass indefinitely while still containing a real, environment-dependent bug.',
    },
    {
      thought: 'ToUpper()/ToLower() with no arguments behave the same everywhere, since the input string itself doesn\'t change.',
      reality: 'the no-argument overloads use CultureInfo.CurrentCulture, an ambient setting from the running machine or container — the SAME input can produce a different result purely based on that environment\'s locale, independent of the code or the string itself.',
    },
    {
      thought: 'the Turkish İ/ı casing issue only matters for genuinely Turkish text or Turkish users.',
      reality: 'the bug fires for ANY string containing the letter "I" or "i" once CurrentCulture is set to a Turkish locale, regardless of the string\'s actual language or content — it is an environment property, not a content property.',
    },
  ];
}
