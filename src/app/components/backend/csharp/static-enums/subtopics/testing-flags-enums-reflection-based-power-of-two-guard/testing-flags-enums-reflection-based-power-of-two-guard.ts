import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-flags-enums-reflection-based-power-of-two-guard-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-flags-enums-reflection-based-power-of-two-guard.html',
  styleUrl: './testing-flags-enums-reflection-based-power-of-two-guard.scss',
})
export class TestingFlagsEnumsReflectionBasedPowerOfTwoGuardSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows the bug once — never a test that catches it automatically',
      points: [
        'The main Static, Partial & Enums page\'s Common Mistake shows <code>Admin = 3</code> silently overlapping with <code>Read | Write</code> in a <code>[Flags]</code> enum — a real, easy-to-introduce bug. It demonstrates the WRONG and RIGHT versions once, but never shows a test that would catch a FUTURE regression — e.g. a teammate adding a new flag member later and accidentally reusing a value or forgetting to double the previous one.',
      ],
    },
    {
      heading: 'A single reflection-based test can validate an ENTIRE [Flags] enum at once',
      points: [
        'Rather than manually eyeballing each member\'s value, <code>Enum.GetValues&lt;T&gt;()</code> combined with reflection can enumerate every member of a <code>[Flags]</code> enum and assert that each PRIMITIVE (non-composite, non-zero) value is genuinely a power of two — using the same bit trick the main page\'s own "filtering composite members" Common Mistake demonstrates: <code>(value & (value - 1)) == 0</code> is true if and only if <code>value</code> has exactly one bit set.',
        'This test needs to explicitly EXCLUDE known composite members (like <code>All</code>) and the zero member (<code>None</code>) from the power-of-two check — since those are INTENTIONALLY not powers of two (they are unions of other flags, or the empty value) — the main page\'s own filtering logic from its "iterating Flags enums" Common Mistake is directly reusable here.',
      ],
    },
    {
      heading: 'This test genuinely generalizes — write it once, apply it to every [Flags] enum in the codebase',
      points: [
        'Because the check is entirely reflection-driven (it takes a <code>Type</code> and works generically), a SINGLE test method parameterized over every <code>[Flags]</code> enum type in the assembly (discovered via reflection too — scanning for types decorated with <code>[Flags]</code>) can validate the ENTIRE codebase\'s flags enums in one test run, rather than writing one bespoke test per enum.',
        'This is a genuinely strong ROI test: cheap to write once, and it protects against the exact bug class the main page\'s Common Mistake describes for EVERY current and FUTURE <code>[Flags]</code> enum in the project, without requiring a developer to remember to write a new test every time a new flags enum is added.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug the main topic shows — now as a failing test',
      language: 'csharp',
      code: `using Xunit;

[Flags]
public enum BrokenPermission
{
    None  = 0,
    Read  = 1,   // 001
    Write = 2,   // 010
    Admin = 3,   // WRONG — 011, overlaps with Read | Write
    All   = 4,
}

public class FlagsEnumTests
{
    [Fact]
    public void BrokenPermission_HasNonPowerOfTwoMember()
    {
        // Every named, non-zero, non-composite member should be a power
        // of two — this test FAILS against BrokenPermission, exactly
        // proving the main topic's Common Mistake with an assertion
        // rather than prose:
        var nonPowerOfTwoMembers = Enum.GetValues<BrokenPermission>()
            .Cast<int>()
            .Where(v => v != 0)                    // skip None
            .Where(v => (v & (v - 1)) != 0)         // NOT a power of two
            .ToList();

        // "Admin = 3" shows up here — 3 & 2 = 2, not 0, so it fails the
        // power-of-two check. This assertion is EXPECTED to fail against
        // the broken enum, demonstrating the bug is genuinely detectable:
        Assert.NotEmpty(nonPowerOfTwoMembers); // proves the bug exists
    }
}`,
    },
    {
      label: 'A genuinely useful GUARD test — passes on correct enums, fails on broken ones',
      language: 'csharp',
      code: `[Flags]
public enum FilePermission
{
    None    = 0,
    Read    = 1,
    Write   = 2,
    Execute = 4,
    All     = Read | Write | Execute, // intentionally composite — excluded below
}

public static class FlagsEnumValidator
{
    // Reusable, generic guard — works for ANY [Flags] enum type:
    public static IEnumerable<T> FindNonPowerOfTwoMembers<T>(T[] knownComposites)
        where T : struct, Enum
    {
        return Enum.GetValues<T>()
            .Where(v => Convert.ToInt64(v) != 0)              // skip the zero/None member
            .Where(v => !knownComposites.Contains(v))          // skip declared composites
            .Where(v =>
            {
                long raw = Convert.ToInt64(v);
                return (raw & (raw - 1)) != 0;                 // not a power of two
            });
    }
}

public class FilePermissionFlagsTests
{
    [Fact]
    public void FilePermission_AllPrimitiveMembersArePowersOfTwo()
    {
        var badMembers = FlagsEnumValidator.FindNonPowerOfTwoMembers(
            knownComposites: new[] { FilePermission.All });

        // This PASSES for the correct FilePermission enum — Read=1,
        // Write=2, Execute=4 are all genuine powers of two, and All is
        // explicitly excluded as a known composite:
        Assert.Empty(badMembers);
    }
}`,
    },
    {
      label: 'Generalizing further — scan the whole assembly for [Flags] enums automatically',
      language: 'csharp',
      code: `using System.Reflection;

public class AllFlagsEnumsTests
{
    public static IEnumerable<object[]> AllFlagsEnumTypes() =>
        typeof(FilePermission).Assembly.GetTypes()
            .Where(t => t.IsEnum && t.GetCustomAttribute<FlagsAttribute>() is not null)
            .Select(t => new object[] { t });

    [Theory]
    [MemberData(nameof(AllFlagsEnumTypes))]
    public void EveryFlagsEnum_HasOnlyPowerOfTwoOrZeroOrKnownCompositeMembers(Type enumType)
    {
        var values = Enum.GetValues(enumType).Cast<object>()
            .Select(v => Convert.ToInt64(v))
            .ToList();

        // A "known composite" heuristic: a value whose bits are exactly
        // the union of one or more OTHER values already in the set —
        // this generic check doesn't need to know each enum's specific
        // composite member names in advance:
        var primitivesOnly = values.Where(v => v != 0)
            .Where(v => !values.Any(other =>
                other != v && other != 0 && (v & other) == other && v != other))
            .ToList();

        var badMembers = primitivesOnly.Where(v => (v & (v - 1)) != 0).ToList();

        Assert.True(badMembers.Count == 0,
            $"{enumType.Name} has non-power-of-two primitive flag member(s): " +
            string.Join(", ", badMembers));
    }
}

// This ONE test method now automatically covers EVERY [Flags] enum in
// the assembly — including ones added in the future — without anyone
// needing to remember to write a new bespoke test each time.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The generalized test\'s "known composite" heuristic checks whether a value\'s bits are the union of OTHER values already in the enum. Would this heuristic correctly classify <code>Admin = 3</code> (from the broken enum) as a composite (and thus wrongly skip it), given that Read=1 and Write=2 are also present in the same enum?',
    hint: 'Trace through the heuristic\'s condition precisely: does Admin (3) get flagged as composite because its bits equal Read | Write (1 | 2 = 3)? Consider whether this is actually the CORRECT classification for a value that overlaps with existing flags, versus what the developer INTENDED (a distinct, unique permission level) — think about whether the heuristic\'s "it looks like a composite" reasoning is a feature or a blind spot here.',
    solution: `// Yes — and this is a genuinely important limitation to understand.
// Admin = 3 has bits equal to Read (1) | Write (2) = 3, so the generic
// "is this the union of other values already present" heuristic WOULD
// classify Admin as a composite and skip the power-of-two check for it
// — even though the developer's INTENT was for Admin to be its own
// distinct, unique flag, not a deliberate union of Read and Write.

// This reveals the heuristic's real limitation: it cannot distinguish
// "intentionally composite" from "accidentally overlapping" — both look
// structurally identical (a value whose bits equal the union of other
// present values). The heuristic is a best-effort HEURISTIC, not a
// perfect detector, and this exact scenario is its blind spot.

// The MORE RELIABLE fix, for cases where automatic composite-detection
// isn't trustworthy, is the EXPLICIT approach from the second code
// example — require the test author to explicitly list which members
// are KNOWN, INTENTIONAL composites (via the knownComposites parameter),
// rather than relying on the assembly-wide scan's structural guess:

[Theory]
[MemberData(nameof(AllFlagsEnumTypes))]
public void EveryFlagsEnum_ExplicitlyDeclaredComposites(Type enumType)
{
    // In practice, pair the assembly-wide scan with a small, manually
    // maintained lookup of {enumType -> known composite member names},
    // rather than trusting automatic structural detection alone —
    // exactly because a value like "Admin = 3" is structurally
    // indistinguishable from a genuine composite, even though it is a
    // real bug in this specific case.
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'manually reviewing a [Flags] enum\'s member values once, at the time it is written, is sufficient to guarantee no non-power-of-two overlaps ever get introduced.',
      reality: 'a reflection-based test that programmatically checks every member\'s bit pattern protects against FUTURE regressions too — e.g. a teammate adding a new flag later and reusing or miscalculating a value — which a one-time manual review cannot guard against.',
    },
    {
      thought: 'a generic "is this value the union of other present values" heuristic can always correctly distinguish an intentional composite member (like All) from an accidental bit overlap (like the buggy Admin = 3).',
      reality: 'the heuristic is structurally blind to this distinction — a value like Admin = 3 that accidentally overlaps with Read | Write is indistinguishable, by bit pattern alone, from a genuinely intentional composite — an explicit, manually maintained list of known composite members is more reliable than automatic detection alone.',
    },
    {
      thought: 'testing [Flags] enum correctness requires writing a separate, bespoke test for each individual enum in the codebase.',
      reality: 'a single, generic, reflection-driven test parameterized over every type in the assembly decorated with [Flags] can validate ALL flags enums — current and future — in one test method, without needing a new test written for each one.',
    },
  ];
}
