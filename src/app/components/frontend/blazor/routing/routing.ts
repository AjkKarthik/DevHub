import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-blazor-routing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './routing.html',
  styleUrl: './routing.scss'
})
export class BlazorRouting {
  quickRef: QuickRefItem[] = [
    { name: '@page "/path"', type: 'syntax', desc: 'Defines the route template for a page component.' },
    { name: '[Parameter]', type: 'decorator', desc: 'Binds a route segment or query-string value to a property.' },
    { name: 'NavigationManager', type: 'class', desc: 'Programmatic navigation and URI utilities.' },
    { name: 'NavLink', type: 'keyword', desc: 'Link component that adds active CSS class automatically.' },
    { name: 'Router', type: 'keyword', desc: 'Core Blazor component that matches URLs to page components.' },
    { name: 'NotFound', type: 'keyword', desc: 'Rendered inside Router when no route matches.' },
    { name: 'AuthorizeRouteView', type: 'keyword', desc: 'Replaces RouteView and enforces [Authorize] attributes.' },
    { name: 'NavigationManager.NavigateTo()', type: 'method', desc: 'Programmatically navigate to a URL.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: '@page and route parameters',
      points: ['Adding `@page "/path"` turns a component into a routable page. Route parameters are defined with `{param}` and bound to a `[Parameter]` property of the same name. Use `{param?}` for optional segments and `{param:int}` for typed constraints (int, bool, datetime, guid). A component can have multiple `@page` directives to handle several URL patterns.',
      'Multiple @page directives register multiple routes for one component.', '{param:int} adds a route constraint — non-matching types return 404.', 'Optional params ({param?}) must match a nullable property type.', 'Route params bind to [Parameter] properties by name (case-insensitive).']
    },
    {
      heading: 'Query strings and NavigationManager',
      points: ['Query string values are read via `[SupplyParameterFromQuery]` (Blazor 7+), which binds `?key=value` to a [Parameter] property. NavigationManager provides the current URI, a NavigateTo() method for programmatic navigation, and a LocationChanged event for detecting navigation. Use `NavigateTo(uri, forceLoad: true)` to force a full page reload.',
      '[SupplyParameterFromQuery] binds query-string values automatically.', 'NavigationManager.Uri gives the current full URL.', 'NavigateTo() supports relative and absolute paths.', 'LocationChanged fires on every navigation — useful for analytics.']
    },
    {
      heading: 'NavLink and authentication guards',
      points: ['NavLink renders an anchor that adds the active CSS class when the current URL matches its href. Use Match="NavLinkMatch.All" to require an exact match. To protect routes, replace RouteView with AuthorizeRouteView and add the Microsoft.AspNetCore.Components.Authorization package. The [Authorize] attribute (or AuthorizeAttribute with roles/policies) on a page redirects unauthenticated users.',
      'NavLink.Match="NavLinkMatch.All" prevents "/" being active on every page.', 'AuthorizeRouteView enforces [Authorize] at the routing level.', 'CascadingAuthenticationState provides auth state to the component tree.', 'Use [Authorize(Roles="Admin")] for role-based page guards.']
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Route params',
      language: 'csharp',
      code: `@page "/products/{Id:int}"
@page "/products/{Id:int}/edit"

<h1>Product #@Id</h1>

@code {
    [Parameter] public int Id { get; set; }

    protected override async Task OnParametersSetAsync()
    {
        // re-runs when Id changes (same component, different route)
        product = await ProductService.GetAsync(Id);
    }
}`
    },
    {
      label: 'Query strings',
      language: 'csharp',
      code: `@page "/search"
@* URL: /search?q=blazor&page=2 *@

<p>Query: @Q, Page: @Page</p>

@code {
    [Parameter, SupplyParameterFromQuery(Name = "q")]
    public string Q { get; set; } = "";

    [Parameter, SupplyParameterFromQuery]
    public int Page { get; set; } = 1;
}`
    },
    {
      label: 'NavigationManager',
      language: 'csharp',
      code: `@inject NavigationManager Nav

<button @onclick="GoToHome">Home</button>
<button @onclick="GoToProduct">Product 42</button>

@code {
    private void GoToHome() => Nav.NavigateTo("/");
    private void GoToProduct()
        => Nav.NavigateTo("/products/42");

    protected override void OnInitialized()
    {
        Nav.LocationChanged += (_, e)
            => Console.WriteLine("Navigated to: " + e.Location);
    }
}`
    },
    {
      label: 'Auth route guard',
      language: 'csharp',
      code: `// Program.cs
builder.Services.AddCascadingAuthenticationState();

// App.razor
<CascadingAuthenticationState>
    <Router AppAssembly="typeof(App).Assembly">
        <Found Context="routeData">
            <AuthorizeRouteView RouteData="routeData"
                DefaultLayout="typeof(MainLayout)">
                <NotAuthorized>
                    <p>Please <a href="/login">log in</a>.</p>
                </NotAuthorized>
            </AuthorizeRouteView>
        </Found>
        <NotFound><p>Page not found.</p></NotFound>
    </Router>
</CascadingAuthenticationState>

// SecretPage.razor
@page "/admin"
@attribute [Authorize(Roles = "Admin")]
<h1>Admin Panel</h1>`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using NavLinkMatch.Prefix for the home route',
      wrong: '<NavLink href="/">Home</NavLink>  // active on every page',
      right: '<NavLink href="/" Match="NavLinkMatch.All">Home</NavLink>',
      explanation: 'The default match is Prefix. "/" is a prefix of every URL so the home link is always active. NavLinkMatch.All requires an exact match.'
    },
    {
      title: 'Omitting OnParametersSetAsync for route param changes',
      wrong: 'protected override async Task OnInitializedAsync() { product = await Get(Id); }',
      right: 'protected override async Task OnParametersSetAsync() { product = await Get(Id); }',
      explanation: 'When navigating from /products/1 to /products/2, Blazor reuses the component — OnInitialized does not re-run. OnParametersSet fires on every navigation to the same page.'
    },
    {
      title: 'Calling NavigateTo inside OnInitialized without forceLoad',
      wrong: 'Nav.NavigateTo("/login");  // may cause render loop',
      right: 'Nav.NavigateTo("/login", forceLoad: false);  // or use [Authorize] guard',
      explanation: 'Navigating programmatically in OnInitialized can trigger a render cycle before the first paint completes. Prefer AuthorizeRouteView for auth redirects.'
    },
    {
      title: 'Missing @page directive',
      wrong: '@code { [Parameter] public int Id { get; set; } }  // no @page',
      right: '@page "/products/{Id:int}"',
      explanation: 'Without @page, the component is not registered as a route. It can only be used as a child component, not navigated to directly.'
    },
    {
      title: 'Route constraint mismatch causing 404',
      wrong: '@page "/orders/{Id:int}"  // navigating to /orders/abc returns 404',
      right: '@page "/orders/{Id}"  // accept any string, validate in @code',
      explanation: 'A typed route constraint filters mismatched URLs to 404. If you want to show a validation error instead of 404, remove the constraint and validate in the component.'
    },
  ];

  challenge: Challenge = {
    title: 'Breadcrumb Navigation with Route Params',
    language: 'csharp',
    description: 'Create a product catalogue with three pages: /catalogue (list), /catalogue/{CategoryId:int} (category), /catalogue/{CategoryId:int}/{ProductId:int} (product). Each page shows a breadcrumb built from the route params. Clicking any breadcrumb segment navigates back using NavigationManager.',
    hints: [
      'Use multiple @page directives for the product detail page.',
      'Read CategoryId and ProductId as [Parameter] properties.',
      'Build the breadcrumb list in a computed property based on which params have values.',
    ],
    starterCode: `@page "/catalogue"
@page "/catalogue/{CategoryId:int}"
@page "/catalogue/{CategoryId:int}/{ProductId:int}"

@inject NavigationManager Nav

<!-- TODO: render breadcrumb and navigate on click -->

@code {
    [Parameter] public int? CategoryId { get; set; }
    [Parameter] public int? ProductId { get; set; }
}`,
    solution: `@page "/catalogue"
@page "/catalogue/{CategoryId:int}"
@page "/catalogue/{CategoryId:int}/{ProductId:int}"
@inject NavigationManager Nav

<nav>
    <a @onclick="() => Nav.NavigateTo(\"/catalogue\")" style="cursor:pointer">Catalogue</a>
    @if (CategoryId.HasValue)
    {
        <span> / </span>
        <a @onclick="() => Nav.NavigateTo(\$\"/catalogue/{CategoryId}\")" style="cursor:pointer">Category @CategoryId</a>
    }
    @if (ProductId.HasValue)
    {
        <span> / Product @ProductId</span>
    }
</nav>

@code {
    [Parameter] public int? CategoryId { get; set; }
    [Parameter] public int? ProductId { get; set; }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'Which directive makes a component routable?', options: ['@route', '@page', '@navigate', '@path'], answer: 1, explanation: '@page "/path" registers the component as a route in the Blazor Router.' },
    { q: 'What fires when the user navigates from /products/1 to /products/2 (same component)?', options: ['OnInitialized', 'OnAfterRender', 'OnParametersSet', 'Constructor'], answer: 2, explanation: 'Blazor reuses the same component instance for same-type routes. OnParametersSet fires with the new Id; OnInitialized does not re-fire.' },
    { q: 'How do you bind a query-string value to a component parameter?', options: ['[FromQuery]', '[SupplyParameterFromQuery]', '[QueryParam]', 'NavigationManager.QueryString'], answer: 1, explanation: '[SupplyParameterFromQuery] (Blazor 7+) automatically extracts ?key=value from the URL and binds it to a [Parameter] property.' },
    { q: 'Which NavLink Match setting prevents "/" from being active on every page?', options: ['NavLinkMatch.Prefix', 'NavLinkMatch.Exact', 'NavLinkMatch.All', 'NavLinkMatch.None'], answer: 2, explanation: 'NavLinkMatch.All requires the full URL (minus query string) to match the href exactly.' },
    { q: 'What replaces RouteView to add authentication guards?', options: ['SecureRouteView', 'AuthorizeRouteView', 'ProtectedRouteView', 'GuardedRouteView'], answer: 1, explanation: 'AuthorizeRouteView wraps RouteView and checks [Authorize] attributes. It shows a NotAuthorized template if the user is not authenticated.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can a single component have multiple @page directives?', a: 'Yes. Each @page registers a separate route that resolves to the same component. This is useful for canonical URLs and aliases (e.g., /product/{id} and /item/{id}).' },
    { q: 'How do I navigate and pass state that is too large for a query string?', a: 'Use a singleton or scoped service as a state bag — store the data there before navigating, then read it in OnInitialized on the destination page. An alternative is PersistentComponentState for SSR pre-rendering scenarios.' },
    { q: 'How do I handle 404s in Blazor?', a: 'Place a <NotFound> template inside the <Router> component. For SSR apps you also need app.UseStatusCodePagesWithRedirects("/404") in Program.cs so server-returned 404s land on your custom page.' },
    { q: 'What is the difference between NavigateTo with and without forceLoad?', a: 'forceLoad: false (default) uses Blazor\'s enhanced navigation — only the page content is swapped. forceLoad: true causes a full browser page load, re-running the entire .NET runtime (WASM) or creating a new circuit (Server). Only use forceLoad when you need server middleware (like cookie clearing) to run.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor routing maps @page URLs to components, binds route params via [Parameter], reads query strings with [SupplyParameterFromQuery], and uses NavigationManager for programmatic navigation.',
    mustKnow: [
      '@page "/path" registers a component as a routable page.',
      'Route constraints ({id:int}) filter mismatches to 404.',
      'OnParametersSet fires on re-navigation to the same route type — not OnInitialized.',
      '[SupplyParameterFromQuery] binds query-string values to parameters.',
      'NavLink.Match="NavLinkMatch.All" prevents "/" from being always active.',
      'AuthorizeRouteView enforces [Authorize] attributes at the routing level.',
    ],
    interviewFocus: [
      'Why use OnParametersSet instead of OnInitialized when navigating between routes of the same component?',
      'How does AuthorizeRouteView differ from wrapping content in AuthorizeView?',
      'How do you pass data between pages that is too large for a query string?',
    ]
  };
}
