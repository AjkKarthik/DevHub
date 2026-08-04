import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './the-wrong-example-was-a-compile-error-not-a-design-smell.html',
  styleUrl: './the-wrong-example-was-a-compile-error-not-a-design-smell.scss'
})
export class TheWrongExampleWasACompileErrorNotADesignSmellSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "wrong" example that could not have compiled in the first place',
      points: [
        'The "Forgetting to return `this` in fluent methods" mistake originally showed this as its wrong example: <code>public HttpRequestBuilder WithTimeout(int s) { _timeout = s; }</code>, commented "// void — breaks chaining."',
        'Read the DECLARED return type carefully: it says <code>HttpRequestBuilder</code>, not <code>void</code>. A method declared to return <code>HttpRequestBuilder</code> with no <code>return</code> statement anywhere in its body is a straight compile error in C# — <code>CS0161: not all code paths return a value</code>.',
        'This means the original "wrong" example could never have reached the runtime behavior its own comment describes ("breaks chaining") — it would never compile at all, so there is no running program in which chaining could break. The comment and the code disagreed with each other about what mistake was actually being shown.',
      ]
    },
    {
      heading: 'What actually demonstrates "forgot to return this," correctly',
      points: [
        'The mistake the title names — forgetting to return <code>this</code> — is genuinely illustrated by a method whose return type is ACTUALLY <code>void</code>: <code>public void WithTimeout(int s) { _timeout = s; }</code>. This compiles cleanly and behaves exactly as the comment describes.',
        'Once <code>WithTimeout</code> returns <code>void</code>, calling it inside a chain like <code>builder.WithUrl(url).WithTimeout(30).WithMethod("POST")</code> genuinely fails to compile at the NEXT call in the chain — <code>.WithMethod(...)</code> would be called on whatever <code>WithTimeout</code> returned, which is nothing, producing <code>CS0117</code> or a similar "does not contain a definition" error at that specific call site.',
        'This is a subtly different failure mode from the original broken example: the corrected version fails to compile at the POINT OF USE (the chained call), which is exactly where a developer would actually encounter and diagnose "forgetting to return this" in real code — not at the definition of the setter method itself.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Three versions: the original broken example, the fix, and a correctly-illustrated mistake',
      language: 'csharp',
      code: `// ORIGINAL "wrong" EXAMPLE -- does not compile, for a reason
// unrelated to its own comment
public HttpRequestBuilder WithTimeout(int s) { _timeout = s; }
// CS0161: 'HttpRequestBuilder.WithTimeout(int)': not all code paths
// return a value -- this is a MISSING RETURN STATEMENT bug, not the
// "returns void" scenario the comment describes.

// CORRECTLY-ILLUSTRATED MISTAKE -- actually returns void, actually
// compiles, actually demonstrates what the mistake's title describes
public void WithTimeout(int s) { _timeout = s; }

// Using it in a chain shows EXACTLY where this breaks:
var request = new HttpRequestBuilder()
    .WithUrl("https://api.example.com/orders")
    .WithTimeout(30)          // <-- returns void
    .WithMethod("POST")       // <-- CS0117 or similar HERE, not above --
    .Build();                 //     void has no WithMethod() to call

// THE ACTUAL FIX -- unchanged from the main page, shown for contrast
public HttpRequestBuilder WithTimeout(int s) { _timeout = s; return this; }
// Compiles. Chains correctly. Every subsequent call in the chain works.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "The original broken example and the corrected void example both ultimately fail to build a working chain, so it doesn\'t really matter which one the mistakes block uses." Is there a meaningful difference between the two failures for a reader trying to learn from the example?',
    hint: 'Where does each version\'s compiler error actually point — at the method\'s own definition, or somewhere else entirely?',
    solution: 'There is a real difference, specifically for what a reader learns from seeing the error. The ORIGINAL broken example\'s compiler error (CS0161, missing return statement) points directly at the WithTimeout method\'s own definition -- but it teaches the wrong lesson, since the actual problem a reader would learn to fix is "add a return statement," which happens to also be the right fix, but for the wrong stated reason (the comment blamed "void", not a missing return). The CORRECTLY-VOID version\'s compiler error appears at the CALL SITE, one line later, in the chain itself -- which is a more realistic simulation of how a developer actually discovers this mistake in real code: not by reading the setter\'s own definition and noticing something is off, but by writing a chain, hitting a confusing compile error further down the chain, and tracing it back to a setter that quietly returns void. Showing the error in the right PLACE, not just eventually erroring at all, is part of what makes an example correctly illustrate the mistake it claims to.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A "wrong" code example in a mistakes block just needs to fail somehow — whether it fails to compile for the reason stated or a different reason is a minor detail.',
      reality: 'Per this subtopic\'s theory, the reason matters — the original example failed to compile for an UNRELATED reason (missing return statement) rather than demonstrating the actual named mistake (returning void), teaching a reader to fix the wrong thing for the right code.'
    },
    {
      thought: 'A method declared to return a specific type (like HttpRequestBuilder) but missing a return statement is the same kind of mistake as a method correctly declared to return void.',
      reality: 'Per this subtopic\'s theory, these are two completely different situations in C# — a declared non-void return type with no return path is a compile error (CS0161) at the method\'s own definition, while a genuinely void-returning method compiles fine and only causes a problem later, at any chained call site.'
    },
    {
      thought: 'Since both the original broken example and the corrected void example ultimately prevent a builder chain from compiling, they are interchangeable for teaching purposes.',
      reality: 'Per this subtopic\'s theory, WHERE the compiler error appears (the setter\'s own definition vs. a later chained call) changes what a reader actually learns from encountering it — the void version reproduces how this mistake is genuinely discovered in real code.'
    }
  ];
}
