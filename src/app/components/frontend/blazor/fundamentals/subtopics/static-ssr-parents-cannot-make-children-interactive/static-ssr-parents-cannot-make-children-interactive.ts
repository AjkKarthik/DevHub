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
  templateUrl: './static-ssr-parents-cannot-make-children-interactive.html',
  styleUrl: './static-ssr-parents-cannot-make-children-interactive.scss'
})
export class StaticSsrParentsCannotMakeChildrenInteractiveSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Interactivity is an "island" boundary in .NET 8\'s unified model — it only starts where you explicitly declare it',
      points: [
        'The main page\'s mistake entry states the rule ("apply @rendermode at the interactive component\'s level") but the underlying reason is about how .NET 8 physically renders the page: a Static SSR page is rendered ENTIRELY server-side into plain HTML, sent to the browser, and NOTHING about it is wired up to any client-side runtime — no SignalR circuit, no WASM, nothing listening for events.',
        'When a page/component IS marked with @rendermode (InteractiveServer, InteractiveWebAssembly, or InteractiveAuto), Blazor renders an "interactive island" — a specific boundary in the HTML that gets wired up to a live circuit or WASM runtime. Everything OUTSIDE that boundary stays static HTML, permanently.',
      ]
    },
    {
      heading: 'Why a Static SSR parent genuinely cannot "pass down" interactivity to a child, even if the child looks like it should support it',
      points: [
        'A component doesn\'t become interactive by virtue of having event handlers like @onclick written in its markup — @rendermode is what determines whether ANY client-side runtime is listening for that click at all. A Static SSR page with an @onclick handler in its markup will render a button that looks normal but does absolutely nothing when clicked, because no runtime is wired up to intercept the click event.',
        '.NET 8\'s render mode boundary is set at the point where a component is FIRST rendered with an explicit @rendermode — from there downward, all descendant components inherit that same interactive boundary automatically. But render mode cannot flow UPWARD or sideways: a Static SSR page cannot "borrow" interactivity from a child, and a child cannot unilaterally become interactive while its ancestor chain, up to the nearest @rendermode boundary, remains Static SSR.',
        'This is why the correct fix (per the main page) is applying @rendermode at the component that NEEDS interactivity, not at some ancestor "just to be safe," and not by wrapping only the innermost element — the render mode boundary must start at or above the component whose event handlers need to actually fire.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The broken version — interactivity missing',
      language: 'csharp',
      code: `@* ProductPage.razor — Static SSR (no @rendermode anywhere on this page) *@
@page "/products/{id}"

<h1>@product.Name</h1>
<p>@product.Description</p>

<AddToCartButton ProductId="@product.Id" />
@* ↑ This child component has its OWN @onclick handler inside it,
   but since the PARENT page has no @rendermode, NOTHING on this
   page is wired to any live runtime. Clicking "Add to Cart" does
   nothing — no error, no console message, it just silently fails. *@

@code {
    [Parameter] public string Id { get; set; } = "";
    private Product product = default!;
    protected override void OnInitialized() => product = ProductService.Get(Id);
}`,
    },
    {
      label: 'The fix — @rendermode on the component that needs it',
      language: 'csharp',
      code: `@* AddToCartButton.razor — apply @rendermode HERE, on the component
   whose click handler actually needs to work *@
@rendermode InteractiveServer

<button @onclick="AddToCart">Add to Cart</button>

@code {
    [Parameter] public int ProductId { get; set; }

    private async Task AddToCart()
    {
        await CartService.AddAsync(ProductId);
    }
}

@* ProductPage.razor — the PARENT stays Static SSR, unchanged —
   the product name/description never needed interactivity, so
   leaving it static keeps that part of the page fast and JS-free.
   Only the AddToCartButton "island" becomes interactive. *@
@page "/products/{id}"

<h1>@product.Name</h1>
<p>@product.Description</p>
<AddToCartButton ProductId="@product.Id" />
@* This now works — the button component establishes its OWN
   interactive boundary, independent of its static parent. *@`,
    },
    {
      label: 'Boundary inheritance — children of an interactive component',
      language: 'csharp',
      code: `@* Once a component establishes an interactive boundary, its OWN
   children automatically inherit that same render mode — no need
   to repeat @rendermode on every descendant. *@

@* CartPanel.razor *@
@rendermode InteractiveServer

<CartItemList Items="@cartItems" />
@* CartItemList does NOT need its own @rendermode — it is a CHILD
   of an already-interactive component, so it inherits
   InteractiveServer automatically and its own @onclick handlers
   (e.g. a per-item "Remove" button) work correctly without any
   further declaration. *@

@code {
    private List<CartItem> cartItems = CartService.GetItems();
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer has a Static SSR dashboard page with a live-updating "notifications" widget component nested deep inside several layers of layout components. They add @rendermode InteractiveServer directly to the innermost notifications widget component, expecting only that widget to become interactive while everything else on the page stays fast, static HTML. Does this work?',
    hint: 'Think about where the render mode boundary actually needs to be declared — does @rendermode on a deeply nested child component establish its own independent island, or does something about its ANCESTOR chain matter?',
    solution: 'This does work, and matches the intended .NET 8 pattern — confirmed by this subtopic\'s "boundary inheritance" example working the OPPOSITE direction (interactivity flowing DOWN from an ancestor to children). Applying @rendermode InteractiveServer directly to the innermost notifications widget establishes ITS OWN interactive island starting exactly at that component, regardless of how many static layers of layout wrap around it above. The ancestor layout components remain Static SSR and are rendered once as plain HTML; only the notifications widget (and any of ITS OWN children, which would inherit the render mode) gets wired up to a live SignalR circuit. This is precisely the scenario .NET 8\'s per-component @rendermode model is designed for — a small, targeted interactive island deep within an otherwise fast, static page — as long as the developer applies @rendermode AT the component that needs it, exactly as they did here, rather than assuming it needs to be declared higher up the ancestor chain.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '@rendermode needs to be applied at the top-level page component to "enable interactivity for the page," and individual child components will then work correctly if they have their own @onclick handlers.',
      reality: 'This subtopic\'s broken-version example shows the opposite failure mode is just as real: applying NO @rendermode anywhere means nothing on the page is interactive, no matter how many event handlers individual child components declare in their own markup — and the fix is to apply @rendermode at whichever SPECIFIC component actually needs interactivity, which can be a small child deep in the tree, not necessarily the top-level page.'
    },
    {
      thought: 'A component with @onclick or @onchange event bindings written in its Razor markup is "interactive" by definition — the presence of these directives is what makes Blazor treat it as needing a live runtime connection.',
      reality: 'Event binding directives in markup are just declarations of intent — whether ANY runtime is actually listening for that event depends entirely on @rendermode somewhere in that component\'s own declaration or its ancestor chain. A Static SSR component can have an @onclick handler written in its code and it will render a normal-looking button that silently does nothing when clicked, confirmed in this subtopic\'s first code example.'
    },
    {
      thought: 'Once one component in a page establishes an interactive boundary, EVERYTHING else on the page — siblings, ancestors, unrelated components elsewhere on the page — also becomes interactive, since the page as a whole is now "live."',
      reality: 'Interactivity only flows DOWNWARD from the component where @rendermode is declared to ITS OWN descendants — confirmed in this subtopic\'s boundary-inheritance example. Sibling components, ancestor components above the boundary, and unrelated components elsewhere on the same page remain in whatever render mode they were already in (typically Static SSR) unless they establish their own separate interactive boundary.'
    }
  ];
}
