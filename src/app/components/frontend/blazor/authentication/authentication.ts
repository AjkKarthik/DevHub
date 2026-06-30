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
import { PrerequisitesComponent, Prerequisite } from '../../../../components/shared/prerequisites/prerequisites';

@Component({
  selector: 'app-blazor-authentication',
  standalone: true,
  imports: [PageMetaComponent, PrerequisitesComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './authentication.html',
  styleUrl: './authentication.scss'
})
export class BlazorAuthentication {
  prerequisites: Prerequisite[] = [
    { label: 'Dependency Injection', route: '/blazor/dependency-injection' },
    { label: 'Blazor Routing', route: '/blazor/routing' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'AuthenticationStateProvider', type: 'class', desc: 'Base class — provides ClaimsPrincipal to the auth system.' },
    { name: 'AuthorizeView', type: 'keyword', desc: 'Shows/hides UI based on authentication or authorization.' },
    { name: '[Authorize]', type: 'decorator', desc: 'Guards a page — redirects unauthenticated users.' },
    { name: 'AuthorizeRouteView', type: 'keyword', desc: 'Replaces RouteView to enforce [Authorize] at the router.' },
    { name: 'CascadingAuthenticationState', type: 'keyword', desc: 'Provides auth state as a cascading value to all descendants.' },
    { name: 'IAuthorizationService', type: 'interface', desc: 'Programmatic policy evaluation from @code.' },
    { name: 'IdentityRevalidatingAuthenticationStateProvider', type: 'class', desc: '.NET 8 — revalidates user identity on every render.' },
    { name: '@attribute [Authorize(Roles="Admin")]', type: 'syntax', desc: 'Role-based page guard.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Authentication model in Blazor',
      points: ['Blazor\'s auth system is built on `AuthenticationStateProvider`, which returns a `Task<AuthenticationState>` containing a `ClaimsPrincipal`. All auth components (AuthorizeView, [Authorize]) consume this provider via the CascadingAuthenticationState wrapper. In .NET 8 with Blazor Web App, the server-side Identity scaffolding provides `IdentityRevalidatingAuthenticationStateProvider` which re-checks the user\'s database record on each render to catch revoked accounts.',
      'All auth flows through AuthenticationStateProvider.', 'CascadingAuthenticationState makes auth state available to all components.', 'ClaimsPrincipal.Identity.IsAuthenticated drives auth decisions.', 'IdentityRevalidatingAuthenticationStateProvider in .NET 8 server catches revoked tokens.']
    },
    {
      heading: 'AuthorizeView and [Authorize]',
      points: ['`AuthorizeView` shows/hides UI blocks: `<Authorized>` content renders for authenticated users, `<NotAuthorized>` for unauthenticated. Add `Roles="Admin,Manager"` or `Policy="CanEdit"` attributes to restrict by role or policy. For page-level protection, use `@attribute [Authorize]` in the .razor file and `AuthorizeRouteView` in App.razor — this prevents even loading the page component for unauthorized users.',
      'AuthorizeView wraps UI blocks — <Authorized> and <NotAuthorized>.', '[Authorize] on a page redirects unauthenticated users at route level.', 'Roles and Policy attributes add fine-grained access control.', 'AuthorizeView.context.User gives the ClaimsPrincipal.']
    },
    {
      heading: '.NET 8 unified auth and OIDC',
      points: ['In .NET 8, `dotnet new blazorweb --auth Individual` scaffolds Identity with cookie authentication ready to use. For OIDC (Microsoft, Google, Entra ID), add `builder.Services.AddAuthentication().AddOpenIdConnect(...)` and configure the tenant ID and client secrets. OIDC works identically to standard ASP.NET Core — Blazor components just read the resulting ClaimsPrincipal.',
      'Individual accounts auth uses ASP.NET Core Identity with cookies.', 'OIDC is configured identically to ASP.NET Core MVC.', 'Roles from OIDC tokens appear as ClaimTypes.Role claims.', 'Logout requires a round-trip to the OIDC provider\'s end_session endpoint.']
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'AuthorizeView',
      language: 'csharp',
      code: `<!-- Show different content based on auth state -->
<AuthorizeView>
    <Authorized>
        <p>Welcome, @context.User.Identity!.Name!</p>
        <a href="/logout">Logout</a>
    </Authorized>
    <NotAuthorized>
        <a href="/login">Login</a>
    </NotAuthorized>
</AuthorizeView>

<!-- Role-restricted block -->
<AuthorizeView Roles="Admin">
    <Authorized>
        <a href="/admin">Admin Panel</a>
    </Authorized>
</AuthorizeView>

<!-- Policy-based -->
<AuthorizeView Policy="CanPublish">
    <Authorized><button>Publish</button></Authorized>
</AuthorizeView>`
    },
    {
      label: 'Page guard',
      language: 'csharp',
      code: `@page "/profile"
@attribute [Authorize]

<h1>My Profile</h1>
<p>Only authenticated users see this.</p>

---

@page "/admin"
@attribute [Authorize(Roles = "Admin")]

<h1>Admin Panel</h1>

---
<!-- App.razor — wire up auth routing -->
<CascadingAuthenticationState>
    <Router AppAssembly="typeof(App).Assembly">
        <Found Context="routeData">
            <AuthorizeRouteView RouteData="routeData"
                DefaultLayout="typeof(MainLayout)">
                <NotAuthorized>
                    <RedirectToLogin />
                </NotAuthorized>
                <Authorizing>
                    <p>Checking auth...</p>
                </Authorizing>
            </AuthorizeRouteView>
        </Found>
    </Router>
</CascadingAuthenticationState>`
    },
    {
      label: 'Programmatic auth check',
      language: 'csharp',
      code: `@inject IAuthorizationService AuthService
@inject AuthenticationStateProvider AuthProvider

<button @onclick="TryDelete" disabled="@(!canDelete)">Delete</button>

@code {
    private bool canDelete;

    protected override async Task OnInitializedAsync()
    {
        var state = await AuthProvider.GetAuthenticationStateAsync();
        var result = await AuthService.AuthorizeAsync(
            state.User, null, "CanDelete");
        canDelete = result.Succeeded;
    }

    private async Task TryDelete()
    {
        if (!canDelete) return;
        // perform delete...
    }
}`
    },
    {
      label: 'Custom AuthStateProvider',
      language: 'csharp',
      code: `public class TokenAuthStateProvider(ILocalStorageService storage)
    : AuthenticationStateProvider
{
    public override async Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        var token = await storage.GetItemAsync<string>("token");
        if (string.IsNullOrWhiteSpace(token))
            return new AuthenticationState(new ClaimsPrincipal());

        var claims = ParseClaimsFromJwt(token);
        var identity = new ClaimsIdentity(claims, "jwt");
        return new AuthenticationState(new ClaimsPrincipal(identity));
    }

    public void NotifyLogin(string token)
    {
        var claims = ParseClaimsFromJwt(token);
        var identity = new ClaimsIdentity(claims, "jwt");
        NotifyAuthenticationStateChanged(
            Task.FromResult(new AuthenticationState(new ClaimsPrincipal(identity))));
    }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting CascadingAuthenticationState in App.razor',
      wrong: '<Router ...><Found><RouteView ... /></Found></Router>',
      right: '<CascadingAuthenticationState>\n    <Router ...><Found><AuthorizeRouteView ... /></Found></Router>\n</CascadingAuthenticationState>',
      explanation: 'Without CascadingAuthenticationState, AuthorizeView and [Authorize] cannot access the current user. They will always show the NotAuthorized state.'
    },
    {
      title: 'Using AuthorizeView as the only security layer',
      wrong: '// Only hiding UI — no server-side check on the API endpoint',
      right: '// Always validate authorization on the server API endpoint too',
      explanation: 'AuthorizeView only hides or shows UI. A determined user can still call your API directly. Always enforce authorization on the server with [Authorize] on API controllers or minimal API handlers.'
    },
    {
      title: 'Not calling NotifyAuthenticationStateChanged in a custom provider',
      wrong: '// Logging in but auth state not updated',
      right: 'NotifyAuthenticationStateChanged(Task.FromResult(new AuthenticationState(principal)));',
      explanation: 'Without calling NotifyAuthenticationStateChanged, the UI never receives the new auth state and [Authorize] pages remain inaccessible even after login.'
    },
    {
      title: 'Trying to read auth state during Static SSR pre-rendering',
      wrong: 'var state = await AuthProvider.GetAuthenticationStateAsync();\n// May return anonymous state during pre-render',
      right: '// Use HttpContext.User directly in SSR, or use [Authorize] attribute',
      explanation: 'During pre-rendering, the auth state comes from the HTTP request. After hydration, it comes from the SignalR circuit. Prefer declarative [Authorize] over programmatic checks for page protection.'
    },
    {
      title: 'Using Roles with OIDC without mapping claims',
      wrong: '[Authorize(Roles = "Admin")]  // OIDC sends roles in a different claim type',
      right: 'options.TokenValidationParameters.RoleClaimType = "roles";\n// or map in AddOpenIdConnect options.ClaimActions',
      explanation: 'OIDC providers often send roles in a non-standard claim (e.g., "roles" vs ClaimTypes.Role). Without claim mapping, role checks always fail.'
    },
  ];

  challenge: Challenge = {
    title: 'Conditional Navigation Menu',
    language: 'csharp',
    description: 'Build a navigation menu component that shows Home and Profile links for authenticated users, and shows a Login link for unauthenticated users. Admin users additionally see an Admin link. Use AuthorizeView with nested role checks. No authentication provider setup needed — just use the AuthorizeView components with mock content.',
    hints: [
      'Nest an <AuthorizeView Roles="Admin"> inside the outer <Authorized> block.',
      'Use context.User.Identity?.Name in the greeting.',
      'The outer AuthorizeView handles authenticated vs not; inner handles role.',
    ],
    starterCode: `<!-- NavMenu.razor -->
<nav>
    <!-- TODO: show different links based on auth state -->
</nav>`,
    solution: `<!-- NavMenu.razor -->
<nav>
    <a href="/">Home</a>

    <AuthorizeView>
        <Authorized>
            <a href="/profile">Profile (@context.User.Identity!.Name)</a>

            <AuthorizeView Roles="Admin">
                <Authorized>
                    <a href="/admin">Admin</a>
                </Authorized>
            </AuthorizeView>

            <a href="/logout">Logout</a>
        </Authorized>
        <NotAuthorized>
            <a href="/login">Login</a>
        </NotAuthorized>
    </AuthorizeView>
</nav>`
  };

  quiz: QuizQuestion[] = [
    { q: 'What provides the current user to all Blazor auth components?', options: ['IAuthorizationService', 'AuthenticationStateProvider', 'ClaimsPrincipal', 'UserManager<T>'], answer: 1, explanation: 'AuthenticationStateProvider is the source of truth — all auth components (AuthorizeView, [Authorize]) call GetAuthenticationStateAsync() on it.' },
    { q: 'What replaces RouteView to enforce page-level [Authorize] attributes?', options: ['SecureRouteView', 'AuthRouteView', 'AuthorizeRouteView', 'ProtectedRouteView'], answer: 2, explanation: 'AuthorizeRouteView wraps RouteView and checks [Authorize] before rendering the page component, showing the NotAuthorized template if access is denied.' },
    { q: 'Which attribute guards a page by role?', options: ['[Auth(Role)]', '[Authorize(Roles="Admin")]', '[RoleGuard("Admin")]', '[Restricted("Admin")]'], answer: 1, explanation: '[Authorize(Roles="Admin")] restricts a page to users with the "Admin" role claim. Multiple roles can be comma-separated.' },
    { q: 'What must you call after a login succeeds in a custom AuthenticationStateProvider?', options: ['StateHasChanged()', 'RefreshAuthAsync()', 'NotifyAuthenticationStateChanged()', 'UpdateUserState()'], answer: 2, explanation: 'NotifyAuthenticationStateChanged signals all subscribers (AuthorizeView, [Authorize]) that the auth state changed. Without it, the UI won\'t react to login or logout.' },
    { q: 'Is hiding a button with AuthorizeView sufficient security?', options: ['Yes, if also using HTTPS', 'No — server-side checks are always required too', 'Yes, Blazor enforces it server-side', 'Only if using InteractiveServer'], answer: 1, explanation: 'AuthorizeView is a UI hint — it hides elements from the user. Nothing prevents a direct API call. Always enforce authorization on the server endpoint.' },
    { q: 'What is the difference between [Authorize] and [AllowAnonymous] in Blazor?', options: ['They are the same', '[Authorize] requires authentication on a page; [AllowAnonymous] overrides it to allow unauthenticated access', '[AllowAnonymous] is deprecated in Blazor', '[Authorize] only works on controllers'], answer: 1, explanation: '[Authorize] on a @page requires the user to be authenticated (and optionally in a role/policy). [AllowAnonymous] overrides any parent [Authorize] — useful for making specific pages public when AuthorizeRouteView applies a global auth requirement.' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between AuthorizeView and [Authorize]?', a: 'AuthorizeView is a component that conditionally renders UI inside a page — it does not prevent the page from loading. [Authorize] is an attribute on a page component that prevents the entire page from rendering for unauthorized users, enforced by AuthorizeRouteView.' },
    { q: 'How do I get the current user in @code?', a: 'Inject AuthenticationStateProvider and call GetAuthenticationStateAsync(). The resulting AuthenticationState.User is the ClaimsPrincipal. Alternatively, declare a [CascadingParameter] Task<AuthenticationState> which is provided by CascadingAuthenticationState.' },
    { q: 'Does [Authorize] work on Blazor WASM?', a: 'Yes, but it is only client-side enforcement. WASM runs in the browser — a user can modify the code or call your API directly. Always validate on the API/server side. Use [Authorize] on WASM for UX only, never as a security boundary.' },
    { q: 'How do I implement logout in Blazor with cookie authentication?', a: 'Navigate to the Identity logout endpoint: Nav.NavigateTo("/Account/Logout", forceLoad: true). The forceLoad causes a full HTTP request which lets ASP.NET Core clear the authentication cookie server-side. Client-side Blazor navigation does not trigger cookie deletion middleware.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor auth is built on AuthenticationStateProvider — AuthorizeView controls UI visibility, [Authorize] guards pages at the route level, and all auth flows through CascadingAuthenticationState.',
    mustKnow: [
      'AuthenticationStateProvider is the source of the current ClaimsPrincipal.',
      'CascadingAuthenticationState makes auth available to the whole component tree.',
      'AuthorizeView shows/hides UI; it does not protect APIs.',
      '[Authorize] + AuthorizeRouteView protects entire pages at the routing level.',
      'Call NotifyAuthenticationStateChanged after login/logout in custom providers.',
      'Always enforce authorization server-side — client-side checks are UI-only.',
    ],
    interviewFocus: [
      'What is the difference between AuthorizeView and [Authorize]?',
      'Why is client-side [Authorize] on WASM not a security boundary?',
      'How do you implement a custom AuthenticationStateProvider?',
    ]
  };
}
