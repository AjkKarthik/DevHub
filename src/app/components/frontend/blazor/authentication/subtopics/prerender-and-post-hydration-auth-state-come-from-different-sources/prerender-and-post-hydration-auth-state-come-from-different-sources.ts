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
  templateUrl: './prerender-and-post-hydration-auth-state-come-from-different-sources.html',
  styleUrl: './prerender-and-post-hydration-auth-state-come-from-different-sources.scss'
})
export class PrerenderAndPostHydrationAuthStateComeFromDifferentSourcesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s "reading auth state during Static SSR pre-render" mistake has a root cause worth naming: TWO genuinely different auth sources exist, one per rendering phase',
      points: [
        'During the STATIC SSR pre-render pass (before any interactivity boundary activates), a component\'s AuthenticationStateProvider is typically a server-side implementation reading from HttpContext.User — the ClaimsPrincipal ASP.NET Core\'s own authentication middleware already populated from the incoming HTTP request\'s cookie or bearer token, entirely independent of Blazor.',
        'Once the page hydrates into an INTERACTIVE render mode (Server or WebAssembly), a DIFFERENT AuthenticationStateProvider takes over — for Interactive Server, one backed by the SignalR circuit\'s own persisted authentication state; for Interactive WebAssembly, one that re-derives auth client-side (commonly from a token in browser storage). These are separate code paths, not the same object continuing to run.',
      ]
    },
    {
      heading: 'Why the two sources can genuinely disagree, not just theoretically',
      points: [
        'HttpContext is available only for the lifetime of the original HTTP request — it does not exist anymore once a SignalR circuit takes over post-hydration, which is exactly why Blazor needs a SEPARATE mechanism (persisting authentication state across the pre-render/hydration boundary) rather than simply keeping HttpContext.User alive. If that persistence step is missing or misconfigured, the interactive AuthenticationStateProvider can come up as authenticated with an EMPTY or default ClaimsPrincipal, even though the pre-rendered HTML briefly showed authenticated content.',
        'This produces a specific, recognizable symptom the main page\'s mistake entry only names abstractly: a "flash" where AuthorizeView-protected content renders correctly (or incorrectly) during pre-render, then visibly CHANGES right after hydration completes — because the interactive AuthenticationStateProvider re-evaluates from its own, potentially different, source and raises its own AuthenticationStateChanged transition.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Persisting auth state across the pre-render boundary (Program.cs)',
      language: 'csharp',
      code: `var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()
    .AddInteractiveWebAssemblyComponents();

// This is what carries the SERVER-derived auth state (from
// HttpContext.User during pre-render) across the hydration boundary
// into the interactive AuthenticationStateProvider, instead of the
// interactive side having to re-derive it from scratch.
builder.Services.AddAuthenticationStateSerialization();

var app = builder.Build();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode()
    .AddInteractiveWebAssemblyRenderMode();`,
    },
    {
      label: 'Symptom: content flashes between pre-render and hydration',
      language: 'html',
      code: `@* Without AddAuthenticationStateSerialization() wired correctly,
   this can render authenticated content during Static SSR
   pre-render (HttpContext.User genuinely has the claims), then
   flip to the NotAuthorized branch the instant the interactive
   circuit starts, because the interactive AuthenticationStateProvider
   never received that pre-render-derived state. *@

<AuthorizeView>
    <Authorized>
        <p>Welcome, @context.User.Identity?.Name!</p>
    </Authorized>
    <NotAuthorized>
        <p>Please log in.</p>
    </NotAuthorized>
</AuthorizeView>`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An app shows a logged-in user\'s name correctly for a brief instant when a page first loads, then the name disappears and the page shows "Please log in" a moment later — even though the user genuinely IS logged in and refreshing the page repeats the exact same flash-then-disappear pattern every time. Explain what is actually happening across the two rendering phases, and name the specific fix.',
    hint: 'Two DIFFERENT AuthenticationStateProvider implementations run for the same page load — one during the Static SSR pre-render pass, one after the page hydrates into an interactive render mode. What has to happen for the SECOND one to agree with the FIRST?',
    solution: 'The brief correct flash is the Static SSR pre-render pass, whose AuthenticationStateProvider reads from HttpContext.User — genuinely authenticated, since the request carried a valid auth cookie/token. The "Please log in" that follows is the INTERACTIVE AuthenticationStateProvider taking over after hydration, using a separate implementation that has NOT received the pre-render\'s auth result — because HttpContext no longer exists once the SignalR circuit (or WebAssembly runtime) takes over, the interactive side needs that state explicitly PERSISTED across the boundary, and without it defaults to an unauthenticated ClaimsPrincipal. The fix is wiring builder.Services.AddAuthenticationStateSerialization() (paired with the corresponding client-side persistent AuthenticationStateProvider in a WebAssembly or Auto project) so the interactive side picks up the SAME auth result the pre-render pass already established, instead of re-deriving (and, in this broken case, failing to derive) it from scratch.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'AuthenticationStateProvider is a single object/service instance that continues running unchanged from pre-render through hydration into full interactivity.',
      reality: 'This subtopic\'s theory clarifies pre-render and interactive rendering use SEPARATE AuthenticationStateProvider implementations, reading from different underlying sources (HttpContext.User vs. a persisted or client-derived circuit-based state) — they are two different code paths that happen to run for the same page, not one continuous object.'
    },
    {
      thought: 'If AuthorizeView shows the correct authenticated content during the very first render, auth is "working" for that page — any later change must be a separate, unrelated bug.',
      reality: 'This subtopic\'s exercise shows a CORRECT pre-render flash followed by an INCORRECT post-hydration state is the single most common symptom of this exact problem — the initial correctness doesn\'t rule out a hydration-boundary auth-persistence gap, it\'s actually the tell-tale sign of one.'
    },
    {
      thought: 'Persisting authentication state across the pre-render/hydration boundary is an optional performance optimization, not something that affects correctness.',
      reality: 'This subtopic\'s theory shows omitting AddAuthenticationStateSerialization() in an Interactive Server/WebAssembly/Auto app doesn\'t just cost performance — it can produce a genuinely WRONG (unauthenticated) result on the interactive side even when the underlying user really is authenticated, since there is no HttpContext left for the interactive AuthenticationStateProvider to fall back on.'
    }
  ];
}
