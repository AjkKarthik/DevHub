import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-default-interface-method-diamond-problem-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './default-interface-method-diamond-problem.html',
  styleUrl: './default-interface-method-diamond-problem.scss',
})
export class DefaultInterfaceMethodDiamondProblemSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows ONE interface with a default — never TWO colliding ones',
      points: [
        'The main Abstract Classes & Interfaces page\'s default-method example (<code>ILogger.LogInfo</code>) and its explicit-implementation example (<code>IEnglishGreeter</code>/<code>IFrenchGreeter</code>) are shown SEPARATELY — it never combines the two ideas: what happens when a class implements TWO interfaces that both provide a DEFAULT implementation for a member with the SAME name?',
      ],
    },
    {
      heading: 'The classic diamond — two unrelated interfaces, same default method name',
      points: [
        'If <code>IEnglishGreeter</code> and <code>IFrenchGreeter</code> (from the main page\'s explicit-implementation example) each declared their OWN default implementation of <code>Greet()</code> — rather than being abstract with no body — a class implementing BOTH interfaces WITHOUT providing its own <code>Greet()</code> produces a genuine COMPILE ERROR: <code>CS8705</code>, "interface members cannot inherit implementation from multiple base interfaces" — the compiler refuses to guess which default should win.',
        'This is different from the ordinary "explicit implementation resolves a naming collision" pattern the main page teaches for ABSTRACT (bodyless) interface members — that pattern lets you write two SEPARATE explicit implementations. For DEFAULT (has-a-body) members, the compiler will not automatically pick either default; it forces you to resolve the ambiguity explicitly.',
      ],
    },
    {
      heading: 'The fix — the implementing class must provide its OWN implementation',
      points: [
        'Unlike the explicit-implementation pattern (which lets you satisfy two DIFFERENT interface methods separately), resolving a genuine diamond conflict between two DEFAULTS for the SAME method requires the class to write its OWN <code>Greet()</code> — effectively overriding BOTH defaults at once, since there is only one member being satisfied for both interfaces (both interfaces declare a member of the exact same name and signature, so it is genuinely ONE conflict, not two separate members to disambiguate).',
        'Inside that class-provided implementation, you CAN still reach either interface\'s specific default explicitly if you genuinely want to call one of them — using the same interface-qualified call syntax the main page\'s explicit-implementation section demonstrates, but applied to invoking a DEFAULT body rather than satisfying an abstract one.',
      ],
    },
    {
      heading: 'A DIAMOND through a shared common interface is a different, non-conflicting case',
      points: [
        'If instead <code>IEnglishGreeter</code> and <code>IFrenchGreeter</code> BOTH extended a common base interface <code>IGreeter</code> that declared the default (rather than each declaring their own separate default), there would be NO conflict at all — there is only ONE default in existence, inherited by both, and by extension by any class implementing either or both. The diamond-conflict error only arises when there are multiple INDEPENDENT defaults for the same signature, not when a single default is shared through a common ancestor interface.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The conflict — two unrelated interfaces, each with their own default',
      language: 'csharp',
      code: `public interface IEnglishGreeter
{
    string Greet() => "Hello!";  // DEFAULT implementation, not abstract
}

public interface IFrenchGreeter
{
    string Greet() => "Bonjour!"; // a DIFFERENT default, same signature
}

// A class implementing BOTH, providing NO Greet() of its own:
public class BilingualGreeter : IEnglishGreeter, IFrenchGreeter
{
    // No Greet() implementation at all —
}
// COMPILE ERROR: CS8705 — 'BilingualGreeter' does not implement interface
// member 'IFrenchGreeter.Greet()'. 'IEnglishGreeter.Greet()' cannot
// implement 'IFrenchGreeter.Greet()' because it is not a default
// interface member implementation.
//
// (Exact wording varies by compiler version, but the core message is
// consistent: the compiler REFUSES to silently pick either default.)`,
    },
    {
      label: 'The fix — the class must provide its own Greet(), resolving the conflict',
      language: 'csharp',
      code: `public class BilingualGreeter : IEnglishGreeter, IFrenchGreeter
{
    // Providing the class's OWN implementation resolves the ambiguity —
    // this single method satisfies BOTH interfaces simultaneously,
    // since they declare a member of the identical name and signature:
    public string Greet() => "Hi there!";
}

var g = new BilingualGreeter();
Console.WriteLine(g.Greet());                       // "Hi there!"
Console.WriteLine(((IEnglishGreeter)g).Greet());    // "Hi there!" — same
Console.WriteLine(((IFrenchGreeter)g).Greet());     // "Hi there!" — same
// All three calls now resolve to the ONE class-provided implementation —
// neither interface's own default is ever reached once the class
// supplies its own.

// If you genuinely need to reach ONE specific interface's original
// default from inside your own implementation, explicit interface
// syntax still works for that purpose:
public class BilingualGreeterPreferringEnglish : IEnglishGreeter, IFrenchGreeter
{
    public string Greet() => ((IEnglishGreeter)this).DefaultGreetEnglish();
}
// (Illustrative — in practice you'd typically just inline the desired
// logic directly rather than reaching back into a specific interface's
// default this way, since the whole point of resolving the conflict is
// deciding what the CLASS's own behavior should be.)`,
    },
    {
      label: 'A shared common ancestor — genuinely NOT a conflict',
      language: 'csharp',
      code: `// Both greeters now share ONE common interface declaring the default —
// there is only a SINGLE default in existence, not two independent ones:
public interface IGreeter
{
    string Greet() => "Hello!"; // ONE default, inherited by both below
}

public interface IEnglishGreeter : IGreeter { }
public interface IFrenchGreeter  : IGreeter { }

// A class implementing BOTH — NO conflict, because there's only one
// default to inherit, reached through either interface identically:
public class SharedDefaultGreeter : IEnglishGreeter, IFrenchGreeter
{
    // No Greet() override needed at all — compiles cleanly:
}

var g = new SharedDefaultGreeter();
// g.Greet();  // Not directly accessible on the class (same rule as
//                ordinary default methods) — must go through an
//                interface-typed reference:
Console.WriteLine(((IGreeter)g).Greet());          // "Hello!"
Console.WriteLine(((IEnglishGreeter)g).Greet());   // "Hello!" — same default
Console.WriteLine(((IFrenchGreeter)g).Greet());    // "Hello!" — same default
// This is the KEY distinction from the earlier diamond conflict: a
// SHARED ancestor default is unambiguous by construction, while two
// INDEPENDENT defaults for the same signature are not.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'If <code>IEnglishGreeter</code> and <code>IFrenchGreeter</code> both extend the shared <code>IGreeter</code> from the third example, but <code>IEnglishGreeter</code> ALSO re-declares its own DIFFERENT default for <code>Greet()</code> (overriding IGreeter\'s default specifically for English), does implementing BOTH <code>IEnglishGreeter</code> and <code>IFrenchGreeter</code> on one class now produce a conflict again?',
    hint: 'Think about how many DISTINCT default implementations now exist for Greet() across the whole interface hierarchy — IGreeter\'s original default, PLUS IEnglishGreeter\'s own override of it. Consider whether IFrenchGreeter (which does NOT re-declare its own default, just inherits IGreeter\'s) creates a genuine ambiguity when combined with IEnglishGreeter\'s more specific override.',
    solution: `public interface IGreeter
{
    string Greet() => "Hello!"; // base default
}

public interface IEnglishGreeter : IGreeter
{
    string Greet() => "Hello, specifically in English!"; // ITS OWN override
    // of IGreeter's default — this is now a SECOND, independent default
    // more specific to IEnglishGreeter than the one it inherited.
}

public interface IFrenchGreeter : IGreeter { } // no override — just
                                                  // inherits IGreeter's default

// Now implementing BOTH:
public class BilingualGreeter : IEnglishGreeter, IFrenchGreeter { }
// This actually COMPILES FINE — no conflict here! Here's why: C#'s
// default interface method resolution follows a "most specific
// interface wins" rule. IEnglishGreeter's default is MORE SPECIFIC than
// IGreeter's (since IEnglishGreeter itself extends IGreeter and provides
// its own override), and IFrenchGreeter contributes NO default of its
// own — it only inherits IGreeter's. Since there is a clear "most
// derived" candidate (IEnglishGreeter's own override) and no OTHER
// independent default competing with it at the same level, the compiler
// can unambiguously pick IEnglishGreeter's default.

Console.WriteLine(((IEnglishGreeter)new BilingualGreeter()).Greet());
// "Hello, specifically in English!" — IEnglishGreeter's more specific
// default wins over IGreeter's original one, resolved automatically.

// The earlier CS8705 conflict specifically requires TWO independent,
// EQUALLY SPECIFIC defaults competing for the exact same signature with
// no clear "most derived" one to prefer — which is exactly the original
// IEnglishGreeter/IFrenchGreeter (both declaring their OWN unrelated
// default, no shared ancestor) example, not this one.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a class implementing two interfaces that both provide a default implementation for a member with the same name will silently pick one of the two defaults (e.g. the first interface listed).',
      reality: 'the compiler refuses to guess — it produces a genuine compile error (CS8705) when two independent interface defaults conflict for the same member signature, forcing the implementing class to explicitly resolve the ambiguity by providing its own implementation.',
    },
    {
      thought: 'any time a class implements two interfaces that share a common member name with a default implementation, a diamond conflict occurs.',
      reality: 'if both interfaces inherit the SAME single default from a common ancestor interface (rather than each declaring an independent one), there is no conflict at all — only one default exists in that case, unambiguously reached through either interface.',
    },
    {
      thought: 'resolving a default-method diamond conflict always requires the implementing class to write a brand-new implementation, since there is no way to prefer one interface\'s existing default over the other.',
      reality: 'when one interface\'s default is genuinely MORE SPECIFIC than another (e.g. it extends and overrides a shared ancestor\'s default) while the competing interface contributes no override of its own, the compiler CAN automatically resolve the conflict in favor of the more specific default — no class-level override is required in that case.',
    },
  ];
}
