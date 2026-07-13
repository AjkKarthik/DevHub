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
  templateUrl: './renderfragment-t-compiles-to-a-delegate-the-framework-invokes-per-item.html',
  styleUrl: './renderfragment-t-compiles-to-a-delegate-the-framework-invokes-per-item.scss'
})
export class RenderfragmentTCompilesToADelegateTheFrameworkInvokesPerItemSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A RenderFragment is not markup — it is a compiled method that WRITES markup when called',
      points: [
        'The main page shows the syntax (ItemTemplate="p =&gt; @&lt;span&gt;@p.Name&lt;/span&gt;") without dwelling on what the Razor compiler actually turns it into: a RenderFragment is the type alias for a delegate, effectively Action&lt;RenderTreeBuilder&gt; — a method that, when invoked, writes a sequence of markup-building instructions into whatever render tree buffer it is given.',
        'RenderFragment&lt;T&gt; is the templated version — effectively Func&lt;T, RenderFragment&gt; — a function that takes a context VALUE and RETURNS a RenderFragment (the actual markup-writing delegate) closed over that specific value. This two-step shape is why the syntax reads like a lambda returning markup: the outer function captures the item, the inner delegate does the actual writing.',
      ]
    },
    {
      heading: 'What this means for WHEN and HOW OFTEN the template code actually runs',
      points: [
        'A component receiving RenderFragment&lt;TItem&gt; ItemTemplate does not receive pre-rendered HTML strings for each item — it receives ONE delegate, and is responsible for INVOKING that delegate once per item it wants rendered (typically inside a loop), passing each item as the context value.',
        'This means the parent\'s template markup genuinely re-executes for EVERY item the child component decides to render it for — if the child component renders the same list twice in one render pass (e.g. once in a summary view, once in a detail view), the parent\'s template code runs twice per item, not once with the result reused.',
        'This is also why RenderFragment&lt;T&gt; naturally supports conditional/dynamic item counts — the child fully controls how many times (zero, one, or many) it invokes the delegate, unlike a fixed pre-rendered markup blob the parent would hand over just once.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The compiled shape (conceptual)',
      language: 'csharp',
      code: `// What the main page's syntax roughly compiles down to conceptually:
//
//   ItemTemplate="p => @<span>@p.Name</span>"
//
// becomes approximately:
//
//   RenderFragment<Product> ItemTemplate = product => builder =>
//   {
//       builder.OpenElement(0, "span");
//       builder.AddContent(1, product.Name);
//       builder.CloseElement();
//   };
//
// The OUTER lambda (product =>) is the RenderFragment<T> itself —
// a function taking the context value and returning...
// The INNER lambda (builder =>) — the actual RenderFragment delegate
// that writes markup instructions when invoked by the framework.`,
    },
    {
      label: 'Rendering the same template twice re-runs it twice',
      language: 'csharp',
      code: `<!-- ProductGrid.razor -->
<div class="summary-row">
    @foreach (var p in Products)
    {
        @ItemTemplate(p)
        @* First invocation of the delegate for THIS item *@
    }
</div>

@if (showDetails)
{
    <div class="detail-list">
        @foreach (var p in Products)
        {
            @ItemTemplate(p)
            @* SECOND invocation for the SAME item, in the same render
               pass — the parent's template code genuinely runs again,
               not reused from the first invocation's output. *@
        }
    </div>
}

@code {
    [Parameter, EditorRequired] public IEnumerable<Product> Products { get; set; } = [];
    [Parameter, EditorRequired] public RenderFragment<Product> ItemTemplate { get; set; } = null!;
    [Parameter] public bool ShowDetails { get; set; }
    private bool showDetails => ShowDetails;
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer building a data grid component wants to log an analytics event exactly once every time the grid renders, regardless of how many rows it has. They put the logging call inside the ItemTemplate delegate\'s own lambda body, assuming it runs once per grid render. Is this the right place for a once-per-render log call?',
    hint: 'Think about HOW MANY TIMES the parent\'s ItemTemplate delegate actually gets invoked during one grid render, based on how RenderFragment&lt;T&gt; works.',
    solution: 'No — this is the wrong place. Based on how RenderFragment&lt;T&gt; actually works (a delegate the child component invokes once PER ITEM it renders), placing a "log once" call inside ItemTemplate\'s own body means it fires once per ROW, not once per grid render — for a 50-row grid, that is 50 log calls instead of 1. The correct place for a genuinely once-per-render log call is in the GRID component\'s own lifecycle (e.g. OnAfterRender), not inside a template delegate the grid itself calls once for every item it decides to display.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'RenderFragment&lt;T&gt; represents a chunk of pre-rendered HTML that the parent hands to the child once, which the child then displays for each item by reusing that same markup.',
      reality: 'RenderFragment&lt;T&gt; is a DELEGATE (effectively Func&lt;T, RenderFragment&gt;) that the child INVOKES once per item — confirmed in this subtopic\'s example where rendering the same list twice in one pass genuinely re-executes the parent\'s template code twice, not once with the output reused.'
    },
    {
      thought: 'Since RenderFragment&lt;T&gt; looks like a lambda expression in the calling markup, it behaves like a pure, side-effect-free value that gets computed once and cached.',
      reality: 'It behaves exactly like any other delegate invocation — every call executes the underlying code fresh, including any side effects. This subtopic\'s exercise shows a naive "log once" assumption breaking because the delegate genuinely runs once per item, not once total.'
    },
    {
      thought: 'A RenderFragment&lt;T&gt; parameter and a plain RenderFragment parameter (like ChildContent) work identically, just with an extra generic type argument for documentation purposes.',
      reality: 'They differ structurally, not just in type-parameter decoration — a plain RenderFragment is a single delegate the child invokes with no argument; RenderFragment&lt;T&gt; is a FUNCTION that takes a context value and RETURNS the actual rendering delegate, which is why RenderFragment&lt;T&gt; can be invoked differently (with a different item) on each call while a plain RenderFragment always produces the identical output every time it is invoked.'
    }
  ];
}
