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
  templateUrl: './streamrendering-is-redundant-on-interactive-modes-not-blocked.html',
  styleUrl: './streamrendering-is-redundant-on-interactive-modes-not-blocked.scss'
})
export class StreamrenderingIsRedundantOnInteractiveModesNotBlockedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the rule — [StreamRendering] only has an effect on Static SSR — the actual reason is worth separating from a plausible-but-wrong guess',
      points: [
        'It would be reasonable to assume interactive render modes are technically INCAPABLE of streaming — that a SignalR circuit or a WASM runtime needs a complete initial HTML response before it can attach and take over, the same way a plain HTTP response needs to finish before a browser can fully parse it. That is NOT the documented reason, and is worth explicitly ruling out rather than repeating as fact.',
        'Microsoft\'s own documentation gives a different, more specific reason: interactive render modes ALREADY produce the exact same incremental-UI-update behavior through their normal, unrelated render pipeline — a data-loading pattern that shows a placeholder then the real content, driven by a SignalR-pushed re-render (Server) or a WASM re-render (WebAssembly), delivers the same progressive-reveal user experience streaming rendering delivers via HTTP chunking. The [StreamRendering] attribute\'s specific mechanism (chunked HTTP transfer of a Static SSR response) is REDUNDANT there, not blocked.',
      ]
    },
    {
      heading: 'Why this distinction matters beyond just getting the trivia right',
      points: [
        'Since the SAME component code (a nullable field, an @if guard, an async OnInitializedAsync that populates it) produces a correctly-working placeholder-then-content pattern in EITHER Static SSR with [StreamRendering] OR an interactive render mode without it, a component doesn\'t need two different implementations depending on which render mode it might end up running under — the placeholder-guard pattern itself is render-mode-agnostic, only the underlying delivery mechanism (HTTP chunk vs. circuit/WASM re-render) differs.',
        'This also explains why adding [StreamRendering] to an already-interactive component isn\'t just a no-op that happens to be harmless — it\'s specifically redundant with a mechanism the render mode already provides through a completely different code path, which is a more precise mental model than simply memorizing "don\'t use it on interactive components."',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The SAME placeholder pattern works under Static SSR streaming...',
      language: 'csharp',
      code: `@page "/product/{id:int}"
@attribute [StreamRendering]
@inject IProductService Products

@if (product is null)
{
    <p>Loading product...</p>
}
else
{
    <ProductDetails Data="product" />
}

@code {
    [Parameter] public int Id { get; set; }
    private Product? product;

    protected override async Task OnInitializedAsync()
    {
        // Static SSR: initial HTML flushes with the placeholder,
        // then an HTTP-streamed chunk patches in ProductDetails
        // once this completes.
        product = await Products.GetAsync(Id);
    }
}`,
    },
    {
      label: '...and under InteractiveServer, with no [StreamRendering] at all',
      language: 'csharp',
      code: `@page "/product/{id:int}"
@rendermode InteractiveServer
@inject IProductService Products

@if (product is null)
{
    <p>Loading product...</p>
}
else
{
    <ProductDetails Data="product" />
}

@code {
    [Parameter] public int Id { get; set; }
    private Product? product;

    protected override async Task OnInitializedAsync()
    {
        // InteractiveServer: the SAME placeholder-then-content code
        // works correctly here too — but the mechanism delivering
        // the update is a SignalR-pushed re-render over the already-
        // established circuit, not an HTTP chunk. [StreamRendering]
        // would have no additional effect if added here — this
        // render mode already produces the same progressive reveal.
        product = await Products.GetAsync(Id);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer adds @attribute [StreamRendering] to a component that already uses @rendermode InteractiveServer, reasoning: "the SignalR circuit needs the full page to load before it can even connect, so without StreamRendering the user will just stare at a blank page longer than they need to." After testing, they notice the placeholder-then-content behavior looks identical whether the attribute is present or removed. Explain why, using the actual documented reason rather than a guess about circuit connection requirements.',
    hint: 'Is [StreamRendering]\'s absence on interactive modes because the circuit genuinely CAN\'T handle a partial response — or because the interactive render mode is already providing an equivalent progressive-update experience through some other, unrelated mechanism?',
    solution: 'The developer\'s reasoning about circuit connection requirements isn\'t the documented explanation, and their own test result confirms why: the placeholder-then-content behavior looks identical with or without the attribute because InteractiveServer ALREADY produces that same incremental UI update through its own normal mechanism — a SignalR-pushed re-render once OnInitializedAsync completes, driven by the render mode\'s regular render pipeline, completely independent of [StreamRendering]. The attribute\'s actual job is enabling HTTP-chunked streaming for a Static SSR response — a mechanism interactive render modes never use in the first place, since they deliver updates over an already-established circuit or WASM runtime instead of a one-shot HTTP response. Adding [StreamRendering] here isn\'t fixing a real limitation; it\'s attaching a mechanism to a render mode that already solves the same problem a different way, which is exactly why removing it changed nothing observable.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '[StreamRendering] has no effect on interactive render modes because a SignalR circuit or WASM runtime technically cannot start until it receives a complete, non-chunked initial HTML response.',
      reality: 'This subtopic\'s theory explicitly rules this out as the documented reason — Microsoft\'s actual explanation is that interactive modes already deliver the same incremental-update user experience through their own normal render pipeline, making [StreamRendering]\'s specific HTTP-chunking mechanism redundant there, not technically blocked.'
    },
    {
      thought: 'A placeholder-then-content component needs different code depending on whether it will run under Static SSR streaming or an interactive render mode.',
      reality: 'This subtopic\'s code examples show the exact same nullable-field-plus-@if-guard pattern works correctly under both — only the underlying delivery mechanism differs (HTTP chunk vs. circuit/WASM-driven re-render), not the component code itself.'
    },
    {
      thought: 'Adding [StreamRendering] to an interactive component is a harmless no-op with zero conceptual downside, since the main page\'s mistake entry just calls it "redundant."',
      reality: 'This subtopic\'s theory reframes "redundant" more precisely — it is specifically redundant with a real mechanism (the render mode\'s own incremental update pipeline) that already solves the identical problem through a different code path, which is a more useful mental model for reasoning about render-mode behavior than treating it as an arbitrary rule to memorize.'
    }
  ];
}
