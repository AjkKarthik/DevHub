import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-why-symbols-defeat-incremental-caching-leak-compilation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './why-symbols-defeat-incremental-caching-leak-compilation.html',
  styleUrl: './why-symbols-defeat-incremental-caching-leak-compilation.scss',
})
export class WhySymbolsDefeatIncrementalCachingLeakCompilationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the rule — this is exactly the mechanism that makes it true',
      points: [
        'The main Source Generators page states that <code>INamedTypeSymbol</code>/<code>IPropertySymbol</code> and syntax nodes "hold references to the entire compilation — dragging them past a pipeline stage leaks the compilation object, defeats caching, and causes memory pressure." Understanding EXACTLY how a single symbol reference chains back to the whole compilation makes this a concrete mechanism to reason about, not a rule to simply memorize.',
      ],
    },
    {
      heading: 'An ISymbol is not a lightweight, standalone description — it is a live handle into the Compilation object graph',
      points: [
        'An <code>INamedTypeSymbol</code> internally holds a reference to the <code>Compilation</code> it came from (needed to resolve base types, implemented interfaces, containing namespaces, and other symbols on demand). That <code>Compilation</code> object, in turn, holds references to every <code>SyntaxTree</code> in the project, which hold references to every syntax node, which hold references to the FULL SOURCE TEXT of every file. Retaining ONE symbol object therefore transitively retains the ENTIRE compilation\'s object graph — potentially megabytes of syntax trees and semantic data — for as long as that symbol reference is alive anywhere.',
      ],
    },
    {
      heading: 'The incremental pipeline\'s caching relies on comparing pipeline VALUES by equality — a leaked compilation makes that comparison meaningless',
      points: [
        'The main page states the pipeline is "cached and recomputed only when relevant inputs change," using value equality on each stage\'s output. If a <code>.Select()</code> stage\'s output is (or contains) a raw <code>INamedTypeSymbol</code>, the incremental engine must compare TWO SYMBOL OBJECTS for equality on every recompilation to decide whether to skip the next stage — but symbols from two DIFFERENT compilation snapshots (even representing the "same" logical type before and after an unrelated edit elsewhere in the project) are typically NOT considered equal by the comparison the incremental engine performs, because a NEW <code>Compilation</code> object is created on every edit, and symbols are tied to their OWNING compilation.',
        'The practical consequence: a pipeline that carries a raw symbol past the first <code>.Select()</code> effectively NEVER gets a cache hit — the "same" logical input produces a "different" object on every keystroke, so every downstream stage re-runs on every edit, exactly the "regenerates everything on every keystroke" behavior the main page says incremental generators exist to AVOID.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trap — carrying a raw symbol past the first pipeline stage',
      language: 'csharp',
      code: `// BAD — the .Select() output is (or contains) the raw symbol itself:
var pipeline = context.SyntaxProvider
    .ForAttributeWithMetadataName(
        "MyNamespace.MyToStringAttribute",
        predicate: (node, _) => node is ClassDeclarationSyntax,
        transform: (ctx, _) => (INamedTypeSymbol)ctx.TargetSymbol) // <-- LEAK:
                                                                    // this symbol
                                                                    // transitively
                                                                    // holds the
                                                                    // ENTIRE
                                                                    // Compilation

context.RegisterSourceOutput(pipeline, (spc, symbol) =>
{
    // Using the symbol here directly means EVERY downstream
    // recomputation depends on comparing symbol objects from
    // potentially different Compilation snapshots — which rarely
    // compare as equal, so this stage effectively NEVER gets a cache
    // hit, regardless of how unrelated an edit elsewhere was:
    string name = symbol.Name;
    // ... emit source using "name" ...
});`,
    },
    {
      label: 'The fix — extract a small, equatable model immediately, discard the symbol',
      language: 'csharp',
      code: `// A small, plain record — holds ONLY the specific strings/flags
// actually needed, with NO reference back to any symbol, syntax
// node, or Compilation object at all:
record ToStringModel(string ClassName, string Namespace, EquatableArray<string> PropertyNames);

var pipeline = context.SyntaxProvider
    .ForAttributeWithMetadataName(
        "MyNamespace.MyToStringAttribute",
        predicate: (node, _) => node is ClassDeclarationSyntax,
        transform: (ctx, _) =>
        {
            // Extract everything needed HERE, immediately — the
            // symbol itself is a LOCAL variable that goes out of
            // scope at the end of this transform function, never
            // stored anywhere the pipeline retains:
            var symbol = (INamedTypeSymbol)ctx.TargetSymbol;
            var propertyNames = symbol.GetMembers()
                .OfType<IPropertySymbol>()
                .Select(p => p.Name)
                .ToArray();

            return new ToStringModel(
                symbol.Name,
                symbol.ContainingNamespace.ToDisplayString(),
                propertyNames.ToImmutableArray());
        });

context.RegisterSourceOutput(pipeline, (spc, model) =>
{
    // "model" is a plain record — comparing two ToStringModel
    // instances by VALUE equality is meaningful and cheap, so THIS
    // stage genuinely gets cache hits when unrelated code changes:
    // ... emit source using model.ClassName, model.PropertyNames ...
});`,
    },
    {
      label: 'Why value equality on the model actually works where symbol equality does not',
      language: 'csharp',
      code: `// A "ToStringModel" record compares by VALUE — two instances with
// the SAME ClassName, Namespace, and PropertyNames are Equal,
// REGARDLESS of which Compilation snapshot they were extracted from:
var modelFromEditA = new ToStringModel("Product", "MyApp", new[] { "Name", "Price" }.ToImmutableArray());
var modelFromEditB = new ToStringModel("Product", "MyApp", new[] { "Name", "Price" }.ToImmutableArray());

Console.WriteLine(modelFromEditA.Equals(modelFromEditB)); // True —
    // even though these came from two SEPARATE, independently-created
    // Compilation objects (representing the project before and after
    // an unrelated edit), the EXTRACTED DATA is identical, so the
    // incremental engine correctly recognizes "nothing relevant
    // changed" and skips re-running RegisterSourceOutput for this
    // specific model.

// Contrast: two INamedTypeSymbol instances representing the "same"
// logical Product class, but from two DIFFERENT Compilation objects,
// are generally NOT considered equal by SymbolEqualityComparer.Default
// across compilation boundaries — defeating the exact comparison the
// incremental pipeline relies on.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A generator\'s <code>.Select()</code> stage extracts a model containing a <code>ClassDeclarationSyntax</code> field (instead of just the class NAME as a string) "to keep things flexible for later." Explain why this still defeats incremental caching, even though the model itself is a plain record.',
    hint: 'A record\'s value equality compares ALL its fields — consider what a ClassDeclarationSyntax field actually holds a reference to, and whether two syntax nodes representing "the same" class from two different edits would ever compare as equal.',
    solution: `// The record is STRUCTURALLY a plain record, but one of its FIELDS
// is still a live syntax node — and record equality compares EVERY
// field, including that one:
record BadModel(string ClassName, ClassDeclarationSyntax Syntax); // <-- LEAK
                                                                    // hiding
                                                                    // inside
                                                                    // an
                                                                    // otherwise
                                                                    // reasonable-
                                                                    // looking
                                                                    // record

// A ClassDeclarationSyntax node belongs to a SPECIFIC SyntaxTree,
// which belongs to a SPECIFIC Compilation snapshot — just like
// INamedTypeSymbol, it transitively holds the entire source text and
// tree structure it came from.
//
// Two BadModel instances extracted from two DIFFERENT edits — even
// representing the EXACT SAME logical class, unchanged — will have
// syntax node fields that are NOT equal to each other (different
// SyntaxTree instances, even if the TEXT is identical), because
// syntax nodes generally don't implement the kind of cross-snapshot
// value equality a plain string or ImmutableArray<string> does.
//
// Record equality is only as good as the WEAKEST field it contains —
// including even ONE field that holds a symbol or syntax node
// reference defeats the whole model's usefulness for caching,
// regardless of how many OTHER fields are genuinely simple, equatable
// values. The fix: extract only strings, primitives, and equatable
// collections — never store a syntax node or symbol reference in the
// model at all, only VALUES already read out of them.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a symbol like INamedTypeSymbol is a lightweight, standalone description of a type that can be safely carried through a pipeline stage.',
      reality: 'a symbol internally holds a reference to its owning Compilation, which transitively holds every SyntaxTree and the full source text of every file in the project — retaining one symbol retains the entire compilation object graph.',
    },
    {
      thought: 'making a pipeline model a plain record automatically guarantees it caches correctly, regardless of what fields it contains.',
      reality: 'record equality compares EVERY field — a model containing even one syntax node or symbol field still defeats caching, since two instances from different compilation snapshots representing the "same" logical data will not compare as equal on that specific field.',
    },
    {
      thought: 'a generator that recomputes on every keystroke, even for unrelated edits, is just an inherent limitation of source generators in general.',
      reality: 'this is specifically the consequence of carrying non-equatable symbol/syntax references past the first pipeline stage — a properly extracted, purely-value-based model lets the incremental engine correctly skip recomputation for genuinely unrelated changes.',
    },
  ];
}
