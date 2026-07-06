import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-the-hiding-trap-new-vs-override-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-the-hiding-trap-new-vs-override.html',
  styleUrl: './testing-the-hiding-trap-new-vs-override.scss',
})
export class TestingTheHidingTrapNewVsOverrideSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s hiding trap is demonstrated once — never regression-tested',
      points: [
        'The main Inheritance page\'s Common Mistake shows the exact bug: <code>new</code>-hidden methods called through a base-type reference silently run the BASE version, not the derived one. It demonstrates this once with console output, but never shows a test that would catch a REGRESSION — e.g. someone later changing <code>override</code> back to <code>new</code> by mistake during a refactor.',
      ],
    },
    {
      heading: 'A test must call through BOTH reference types to be meaningful',
      points: [
        'A test that only constructs the derived type and calls the method through a DERIVED-typed variable (<code>var d = new Derived(); d.Method();</code>) can never distinguish <code>new</code> from <code>override</code> — both produce the SAME result when called through the derived reference. The distinguishing test MUST call through a BASE-typed reference (<code>Base b = new Derived(); b.Method();</code>) — this is the only call shape where hiding and overriding genuinely diverge.',
        'This mirrors exactly how the bug manifests in real code: a method that accepts a collection of the BASE type (<code>IEnumerable&lt;Animal&gt;</code>) and calls a member on each element THROUGH that base-typed reference — precisely the polymorphism scenario the main page\'s own <code>animals</code> array example demonstrates.',
      ],
    },
    {
      heading: 'A single assertion that would catch the exact "accidentally changed override to new" regression',
      points: [
        'The strongest test asserts BOTH reference shapes return the SAME (derived) value — if a method is genuinely virtual+override, calling it via the derived reference AND via a base reference must produce IDENTICAL results. If someone accidentally reverts <code>override</code> to <code>new</code>, the base-reference call\'s result changes while the derived-reference call\'s result does not — the assertion comparing the two would immediately fail, exactly pinpointing the regression.',
      ],
    },
    {
      heading: 'Testing that a compiler warning exists is a DIFFERENT, complementary check',
      points: [
        'Separately from runtime behavior tests, the main page notes the compiler emits CS0108 (a warning, not an error) when a member shadows a base member WITHOUT the <code>new</code> keyword at all — this is a BUILD-time signal, not something xUnit tests observe directly. Treating CS0108 as a build ERROR (via <code>.editorconfig</code> or <code>TreatWarningsAsErrors</code>) is the complementary, earlier-catching half of guarding against accidental hiding — it flags EVEN UNINTENTIONAL hiding (forgetting <code>virtual</code>/<code>override</code> entirely) before a runtime test would ever run.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A test that FAILS to distinguish new from override — the wrong shape',
      language: 'csharp',
      code: `using Xunit;

public class Renderer
{
    public virtual string Render() => "<base>";
}

public class HtmlRenderer : Renderer
{
    public override string Render() => "<html>";
}

public class WeakTests
{
    [Fact]
    public void Render_ThroughDerivedReference_ReturnsHtml()
    {
        var renderer = new HtmlRenderer(); // DERIVED-typed variable
        Assert.Equal("<html>", renderer.Render());
        // This test PASSES whether Render() uses "override" OR "new" —
        // it cannot distinguish the two at all, because calling through
        // a derived-typed reference always sees the derived member
        // either way. A regression from override to new would NOT be
        // caught by this test.
    }
}`,
    },
    {
      label: 'The test shape that ACTUALLY distinguishes them — call through base reference',
      language: 'csharp',
      code: `public class HidingTrapTests
{
    [Fact]
    public void Render_ThroughBaseReference_UsesPolymorphicDispatch()
    {
        Renderer renderer = new HtmlRenderer(); // BASE-typed variable —
                                                  // this is the shape that
                                                  // actually distinguishes
                                                  // override from new
        Assert.Equal("<html>", renderer.Render());
        // With "override": passes — polymorphic dispatch runs the
        // derived version regardless of reference type.
        //
        // If someone later changes "override" to "new" by mistake:
        // this test FAILS — renderer.Render() would return "<base>"
        // instead, immediately catching the exact regression the main
        // topic's own Common Mistake describes.
    }

    [Fact]
    public void Render_BothReferenceTypes_ReturnIdenticalResults()
    {
        var derived = new HtmlRenderer();
        Renderer viaBase = derived;

        // The strongest single assertion — genuinely polymorphic members
        // MUST return the same result regardless of reference type:
        Assert.Equal(derived.Render(), viaBase.Render());
        // If Render() were hidden with "new" instead of overridden, this
        // assertion would fail: derived.Render() == "<html>" but
        // viaBase.Render() == "<base>" — a direct, unambiguous signal.
    }
}`,
    },
    {
      label: 'Complementary build-time check — CS0108 as an error, not a warning',
      language: 'csharp',
      code: `// .editorconfig — promote the "member hides inherited member" warning
// to a build error, catching UNINTENTIONAL hiding even before any test runs:
[*.cs]
dotnet_diagnostic.CS0108.severity = error

// Without this, accidentally shadowing a base member (forgetting BOTH
// "override" and "new") compiles with only a warning:
public class Base { public string Greet() => "Hello from Base"; }
public class Accidental : Base
{
    public string Greet() => "Hello from Accidental";
    // CS0108 warning by default: "'Accidental.Greet()' hides inherited
    // member 'Base.Greet()'. Use the new keyword if hiding was intended."
    //
    // With CS0108 promoted to an error, this fails the BUILD immediately
    // — forcing the developer to make an explicit choice (add "new" to
    // confirm intentional hiding, or "virtual"/"override" for
    // polymorphism) rather than silently shipping ambiguous code that
    // LOOKS like it might be polymorphic but genuinely is not.
}

// This is the earliest possible catch — before a unit test even needs
// to run, the build itself refuses to compile ambiguous shadowing.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate writes a test <code>Assert.Equal("<html>", new HtmlRenderer().Render());</code> and argues it is sufficient coverage for the Render() override. Using the reasoning above, explain precisely why this specific test would NOT catch a regression from override to new.',
    hint: 'Focus on the DECLARED TYPE of the variable "new HtmlRenderer()" is assigned to (implicitly, via var) — it is HtmlRenderer itself, not Renderer. Think about whether the compiler picks the base or derived method based on the declared/static type of the reference at the CALL SITE, not the object\'s actual runtime type, for a "new"-hidden member specifically.',
    solution: `// The test "new HtmlRenderer().Render()" calls Render() through a
// reference whose DECLARED (static) type is HtmlRenderer — the SAME
// type that declares the method, whether it's "override" or "new".

// For a "new"-hidden member specifically, the compiler resolves WHICH
// method to call based on the STATIC (compile-time) type of the
// reference — not runtime polymorphism. Since the reference here IS
// statically typed as HtmlRenderer, it will ALWAYS see HtmlRenderer's
// own Render() (whether declared with "new" or "override") — there is
// no base-typed reference in this test AT ALL to expose the difference.

// Concretely, if Render() used "new" instead of "override":
public class HtmlRenderer : Renderer
{
    public new string Render() => "<html>"; // hiding instead of overriding
}

// The teammate's test STILL passes:
Assert.Equal("<html>", new HtmlRenderer().Render()); // PASSES either way —
// proves nothing about whether polymorphic dispatch actually works.

// The only way to expose the difference is a reference DECLARED as the
// BASE type, exactly as the second code example shows:
Renderer viaBase = new HtmlRenderer();
Assert.Equal("<html>", viaBase.Render()); // FAILS if "new" is used instead
// of "override" — THIS is the test shape that actually verifies
// polymorphic dispatch, which the teammate's original test cannot do.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test that constructs a derived object and calls a method on a variable declared as the derived type is sufficient to verify the method is genuinely polymorphic (uses override, not new).',
      reality: 'calling through a DERIVED-typed reference always returns the derived member\'s result regardless of whether it uses override or new — the test can only distinguish the two if it calls through a BASE-typed reference, which is the one call shape where hiding and overriding genuinely diverge.',
    },
    {
      thought: 'CS0108 (member hides inherited member) is just a stylistic warning with no real correctness implications, safe to leave at its default severity.',
      reality: 'CS0108 flags a genuine correctness risk — a member that silently shadows a base member without either the new or override keyword being an intentional choice — promoting it to a build error catches unintentional hiding before any test even needs to run.',
    },
    {
      thought: 'the strongest way to test polymorphic dispatch is to assert the derived method returns the expected derived-specific value.',
      reality: 'the strongest test asserts that calling the SAME object through BOTH a derived-typed reference and a base-typed reference produces IDENTICAL results — this single comparison directly catches a regression from override to new, which a value-only assertion cannot.',
    },
  ];
}
