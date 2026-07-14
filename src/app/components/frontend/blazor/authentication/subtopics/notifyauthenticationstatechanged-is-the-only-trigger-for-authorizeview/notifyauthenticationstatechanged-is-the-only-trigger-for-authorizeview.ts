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
  templateUrl: './notifyauthenticationstatechanged-is-the-only-trigger-for-authorizeview.html',
  styleUrl: './notifyauthenticationstatechanged-is-the-only-trigger-for-authorizeview.scss'
})
export class NotifyauthenticationstatechangedIsTheOnlyTriggerForAuthorizeviewSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'AuthorizeView and [Authorize] do not poll AuthenticationStateProvider on every render — they subscribe to ONE specific event',
      points: [
        'The main page\'s mistake entry states the rule (call NotifyAuthenticationStateChanged after login), worth explaining the actual mechanism: AuthenticationStateProvider exposes an AuthenticationStateChanged event internally, and every AuthorizeView/[Authorize]-driven component in the app subscribes to that SAME event when it initializes — this is structurally the same publish/subscribe pattern covered elsewhere in this hub for shared-state services, just built into Blazor\'s own auth system specifically.',
        'Mutating a custom AuthenticationStateProvider\'s own internal state directly (setting a private field after a successful login) has NO EFFECT on any already-rendered AuthorizeView or [Authorize] component — none of them are re-checking the provider\'s state on their own initiative; they are all waiting, passively, for that ONE specific event to fire.',
      ]
    },
    {
      heading: 'Why the login "appears to work" while the UI stays stuck on the logged-out state',
      points: [
        'A custom login method typically DOES succeed at the actual authentication work — validating credentials, obtaining a token, storing it — and GetAuthenticationStateAsync() (called fresh, e.g. on a full page reload) would correctly reflect the NEW logged-in state if invoked again from scratch. The bug is specifically that already-rendered components never learn a change happened, since NotifyAuthenticationStateChanged() is the ONLY thing that raises the event they are all listening for.',
        'This produces a specific, recognizable symptom: the login call itself does not throw or fail, storage genuinely contains the new token, but every AuthorizeView still shows &lt;NotAuthorized&gt; content and every [Authorize] page still redirects — until the user manually reloads the page, at which point GetAuthenticationStateAsync() is called FRESH by the newly-initializing components and correctly picks up the already-stored, already-valid token.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — login succeeds, but the UI never learns',
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
        return new AuthenticationState(new ClaimsPrincipal(new ClaimsIdentity(claims, "jwt")));
    }

    public async Task LoginAsync(string token)
    {
        // The token genuinely gets stored — this part works correctly.
        await storage.SetItemAsync("token", token);

        // BUG: nothing here tells any already-rendered AuthorizeView
        // or [Authorize] component that anything changed. Every one
        // of them is still passively waiting for the
        // AuthenticationStateChanged event, which was never raised.
    }
}`,
    },
    {
      label: 'The fix — explicitly raising the event',
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
        return new AuthenticationState(new ClaimsPrincipal(new ClaimsIdentity(claims, "jwt")));
    }

    public async Task LoginAsync(string token)
    {
        await storage.SetItemAsync("token", token);

        var claims = ParseClaimsFromJwt(token);
        var newState = new AuthenticationState(new ClaimsPrincipal(new ClaimsIdentity(claims, "jwt")));

        // THIS is what actually raises AuthenticationStateChanged —
        // every subscribed AuthorizeView/[Authorize] component now
        // re-evaluates against the new state and re-renders
        // accordingly, without needing a page reload.
        NotifyAuthenticationStateChanged(Task.FromResult(newState));
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer debugging the "login succeeds but UI stays logged out" symptom adds a Console.WriteLine inside GetAuthenticationStateAsync() to check what it returns right after calling their (buggy, missing NotifyAuthenticationStateChanged) LoginAsync method. The log shows GetAuthenticationStateAsync() correctly returning the NEW authenticated state. The developer is now confused — "if it\'s returning the right state, why does the UI still show logged out?" What is the resolution to this apparent contradiction?',
    hint: 'Think about WHEN GetAuthenticationStateAsync() actually gets CALLED by an AuthorizeView component — is it called continuously/repeatedly on its own, or only at specific moments (like a component\'s own initialization, or when the AuthenticationStateChanged event fires)?',
    solution: 'There is no real contradiction — this confirms exactly where the bug is. GetAuthenticationStateAsync() correctly returning the new state when manually called (e.g. by the developer\'s own debug code, or if a NEW component were to initialize right then) proves the underlying auth logic and storage are working correctly. The actual problem is that already-rendered AuthorizeView/[Authorize] components do not automatically CALL GetAuthenticationStateAsync() again just because time passed or storage changed — they only ever call it once at their own initialization, and afterward rely EXCLUSIVELY on the AuthenticationStateChanged event to know when to check again. Since LoginAsync never raised that event (the original bug), every already-rendered component is sitting on its ORIGINAL (pre-login) state snapshot, with no trigger telling it to re-check, even though a fresh call to GetAuthenticationStateAsync() would genuinely return the correct new state if only something prompted a component to make that call again.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'AuthorizeView and [Authorize] components periodically re-check AuthenticationStateProvider on their own (e.g. on every render, or on a timer), so a login\'s effects should eventually show up even without an explicit notification.',
      reality: 'This subtopic\'s theory clarifies these components are purely event-driven — they call GetAuthenticationStateAsync() once at initialization and then wait passively for the AuthenticationStateChanged event, with no polling or periodic re-checking mechanism at all; without NotifyAuthenticationStateChanged(), they never learn anything changed, no matter how much time passes.'
    },
    {
      thought: 'If GetAuthenticationStateAsync() is confirmed (via manual testing or logging) to return the correct new state after a login, that proves the login flow and the UI update are both working correctly.',
      reality: 'This subtopic\'s exercise shows GetAuthenticationStateAsync() returning the correct state when manually invoked says nothing about whether already-rendered UI components will ever call it again — the missing piece is NotifyAuthenticationStateChanged() actually raising the event those components are waiting for, a completely separate concern from whether the method itself returns correct data.'
    },
    {
      thought: 'A full page reload after login is a reasonable, intentional design choice some apps make, unrelated to whether NotifyAuthenticationStateChanged() was called correctly.',
      reality: 'This subtopic\'s theory shows a full page reload "accidentally" works around a MISSING NotifyAuthenticationStateChanged() call specifically because a reload forces every component to re-initialize from scratch, calling GetAuthenticationStateAsync() fresh — this is a symptom of the underlying bug being papered over by an unrelated forced action, not a legitimate alternative to calling the notification method correctly.'
    }
  ];
}
