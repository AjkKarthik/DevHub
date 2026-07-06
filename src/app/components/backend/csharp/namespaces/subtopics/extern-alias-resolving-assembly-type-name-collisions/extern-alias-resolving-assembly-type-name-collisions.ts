import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-extern-alias-resolving-assembly-type-name-collisions-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './extern-alias-resolving-assembly-type-name-collisions.html',
  styleUrl: './extern-alias-resolving-assembly-type-name-collisions.scss',
})
export class ExternAliasResolvingAssemblyTypeNameCollisionsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions extern alias in one Q&A answer — never shows it',
      points: [
        'The main Namespaces page\'s Q&A describes <code>extern alias</code> as being for "two referenced assemblies [that] define types with the exact same fully-qualified name," calling it "very rare" — accurate, but the page never demonstrates the syntax, which is genuinely unlike anything else in C#\'s namespace toolkit and worth understanding for the rare occasions it IS needed.',
      ],
    },
    {
      heading: 'Why a normal using alias cannot solve this specific problem',
      points: [
        'A regular <code>using Alias = Namespace.Type;</code> (covered extensively on the main page) works when two DIFFERENT namespaces have a type with the SAME SIMPLE NAME — you alias one of them to disambiguate. But <code>extern alias</code> solves a DIFFERENT, more extreme problem: two REFERENCED ASSEMBLIES that each define a type with the EXACT SAME FULLY-QUALIFIED NAME (same namespace AND same type name) — a scenario an ordinary <code>using</code> alias cannot even express, because there is no namespace-level distinction to alias in the first place; the ambiguity is at the ASSEMBLY level.',
        'This genuinely happens in practice with versioned/forked NuGet packages, or when two different libraries both vendor a copy of the same third-party type under an identical namespace (a known real-world scenario with certain COM interop and legacy library situations).',
      ],
    },
    {
      heading: 'The mechanism — assign each assembly its own alias at reference time',
      points: [
        'The fix requires TWO steps: first, assign each conflicting assembly reference its own alias in the project file (<code>&lt;Aliases&gt;LibA&lt;/Aliases&gt;</code> on the <code>&lt;Reference&gt;</code> element, or the equivalent <code>/reference:LibA=LibA.dll</code> compiler flag) — this is project-configuration, not C# source code. Second, in the C# source file that needs BOTH assemblies\' colliding types, declare <code>extern alias LibA;</code> and <code>extern alias LibB;</code> at the very top of the file (even before any <code>using</code> directives), then qualify each type with its assembly alias using the <code>::</code> operator: <code>LibA::Some.Namespace.MyType</code>.',
        'The <code>::</code> (double-colon) "alias qualifier" operator is otherwise essentially unused in ordinary C# — its ENTIRE purpose is disambiguating which ASSEMBLY a type comes from when an ordinary dotted name alone is ambiguous between two assembly aliases.',
      ],
    },
    {
      heading: 'This remains genuinely rare — know it exists, do not reach for it casually',
      points: [
        'The main page\'s own characterization ("very rare... usually only needed in large multi-assembly setups or when interoping with legacy COM libraries") is accurate — this is not a technique to reach for casually. If you ever encounter a build error mentioning that a type reference is ambiguous between two assemblies with identical fully-qualified names, knowing <code>extern alias</code> exists (and where to look it up) is more valuable than having memorized its exact syntax in advance.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The scenario — two assemblies, one identical fully-qualified type name',
      language: 'csharp',
      code: `// Imagine two referenced assemblies — GeometryV1.dll and GeometryV2.dll —
// BOTH define a type at the exact same fully-qualified name:
//
//   GeometryV1.dll: namespace Acme.Geometry { public class Point { ... } }
//   GeometryV2.dll: namespace Acme.Geometry { public class Point { ... } }
//
// A normal "using Acme.Geometry;" is hopelessly ambiguous here — there
// is no namespace-level distinction to alias, since BOTH types share the
// exact same namespace AND the exact same type name. An ordinary
// "using MyPoint = Acme.Geometry.Point;" alias cannot pick one, because
// the compiler cannot tell which assembly's "Acme.Geometry.Point" you mean:

// using Acme.Geometry; // COMPILE ERROR if both assemblies are
//                        // referenced — "Point" is ambiguous
// var p = new Point();  // CS0433: type exists in both GeometryV1 and
//                        // GeometryV2 — this is what extern alias solves`,
    },
    {
      label: 'Step 1 — assign each assembly its own alias (project configuration)',
      language: 'csharp',
      code: `<!-- In the .csproj — assign a distinct Aliases value to each reference: -->
<ItemGroup>
  <Reference Include="GeometryV1">
    <HintPath>libs\\GeometryV1.dll</HintPath>
    <Aliases>GeoV1</Aliases>
  </Reference>
  <Reference Include="GeometryV2">
    <HintPath>libs\\GeometryV2.dll</HintPath>
    <Aliases>GeoV2</Aliases>
  </Reference>
</ItemGroup>

<!-- Equivalent raw csc.exe / dotnet build flags, for reference: -->
<!-- csc /reference:GeoV1=GeometryV1.dll /reference:GeoV2=GeometryV2.dll ... -->

<!-- Without this Aliases configuration, extern alias in the .cs source
     file below has nothing to refer to — the assembly-level alias MUST
     be assigned at reference time, not just in C# source code. -->`,
    },
    {
      label: 'Step 2 — extern alias + the :: qualifier in C# source',
      language: 'csharp',
      code: `// extern alias declarations MUST appear before any "using" directives:
extern alias GeoV1;
extern alias GeoV2;

using System;

public class GeometryComparer
{
    public void Compare()
    {
        // The :: operator disambiguates which ASSEMBLY's "Point" type
        // you mean — this is the ONLY common use of :: in C#:
        GeoV1::Acme.Geometry.Point p1 = new GeoV1::Acme.Geometry.Point();
        GeoV2::Acme.Geometry.Point p2 = new GeoV2::Acme.Geometry.Point();

        Console.WriteLine($"V1 Point: {p1}");
        Console.WriteLine($"V2 Point: {p2}");

        // You can also combine extern alias with an ordinary using
        // directive, once qualified, to shorten subsequent references:
        // using GeoV1Point = GeoV1::Acme.Geometry.Point;
    }
}

// Without BOTH the .csproj Aliases configuration AND the "extern alias"
// declarations, this code simply would not compile — the two steps are
// both required, and neither alone is sufficient.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Would an ordinary <code>using Acme.Geometry;</code> directive (without any extern alias) work fine if the project referenced ONLY GeometryV1.dll, without GeometryV2.dll also being referenced? Explain why the ambiguity specifically requires BOTH assemblies to be referenced simultaneously.',
    hint: 'The ambiguity error (CS0433) only occurs when the COMPILER can see two candidate types with the identical fully-qualified name across the assemblies it has been given. Think about what happens to name resolution when only one of the two conflicting assemblies is actually referenced by the project at all.',
    solution: `// Yes — with ONLY GeometryV1.dll referenced (no GeometryV2.dll at all),
// "using Acme.Geometry;" and "new Point()" work completely normally,
// with zero ambiguity. There is exactly ONE "Acme.Geometry.Point" type
// visible to the compiler, so ordinary name resolution has nothing to
// disambiguate.

// The CS0433 ambiguity — and the entire need for extern alias — only
// arises specifically because BOTH assemblies are referenced by the SAME
// project SIMULTANEOUSLY. The compiler genuinely sees two distinct
// candidates for "Acme.Geometry.Point" (one from each assembly) and has
// no way to know which one an unqualified "Point" reference should mean.

// This is exactly why extern alias is described as "rare" — it is only
// needed in the specific, somewhat unusual situation where a project
// genuinely needs types from BOTH conflicting assemblies at once (e.g.
// migrating between two versions of a library where you need to convert
// data from the old shape to the new one, temporarily requiring both
// assemblies loaded side by side). If a project only ever needs ONE of
// the two assemblies, there is no ambiguity, and no extern alias needed
// at all — you would simply not reference the other assembly.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'an ordinary using alias (using MyPoint = Acme.Geometry.Point;) can resolve a conflict between two assemblies that both define a type with the exact same fully-qualified name.',
      reality: 'a regular using alias operates at the NAMESPACE level and cannot express "which ASSEMBLY" a type comes from — when two assemblies define the identical fully-qualified type name, only extern alias (paired with assembly-reference-level Aliases configuration) can disambiguate them.',
    },
    {
      thought: 'extern alias is purely a C# language feature — declaring "extern alias Foo;" in source code is sufficient on its own to use it.',
      reality: 'extern alias requires TWO coordinated steps: an assembly reference must first be assigned that alias name at the project/compiler level (via the .csproj Aliases property or an equivalent compiler flag), and only then does the "extern alias Foo;" declaration in C# source have something to refer to.',
    },
    {
      thought: 'the CS0433 ambiguous-type error between two assemblies can occur even if only one of the conflicting assemblies is actually referenced by the project.',
      reality: 'the ambiguity specifically requires BOTH assemblies with the identically-named type to be referenced by the SAME project simultaneously — referencing only one of them produces zero ambiguity, since the compiler sees exactly one candidate type.',
    },
  ];
}
