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
  templateUrl: './a-cross-origin-redirect-after-enhanced-form-submission-hard-fails.html',
  styleUrl: './a-cross-origin-redirect-after-enhanced-form-submission-hard-fails.scss'
})
export class ACrossOriginRedirectAfterEnhancedFormSubmissionHardFailsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s "don\'t use data-enhance on login forms" rule is correct — the exact mechanism is more specific than a general cookie-setting problem',
      points: [
        'Enhanced form submission works by issuing a fetch() request in place of a native browser form submission. For a SAME-ORIGIN redirect response (a login handler on your own domain redirecting to a dashboard page, for instance), fetch actually follows the redirect and honors Set-Cookie headers correctly — cookies are not the part that breaks here. What DOES happen is the URL only updates via the JS History API rather than a genuine document reload, meaning the Blazor circuit and any server-side session state never get freshly re-initialized the way a real navigation would.',
        'The more severe, hard failure happens specifically for a redirect to an EXTERNAL origin — the common case for OAuth/OIDC login flows that redirect to a separate identity provider domain. A cross-origin redirect response received via fetch becomes an "opaque" response (a browser security restriction preventing JavaScript from inspecting cross-origin response details), and Blazor\'s enhanced form handling explicitly treats this as an error for non-GET requests rather than attempting to follow it — the form submission fails outright instead of silently misbehaving.',
      ]
    },
    {
      heading: 'Why "no full browser navigation" is the right fix, described precisely',
      points: [
        'Removing data-enhance from a login/logout form restores standard, unenhanced browser form submission — the browser\'s native form POST mechanism follows ANY redirect (same-origin or cross-origin) exactly as it always has, with no fetch-based opaque-response restriction involved at all, since this isn\'t JavaScript inspecting the response, it\'s the browser\'s own top-level navigation handling it.',
        'This also resolves the same-origin circuit-reinitialization concern from the other half of this mechanism — a genuine full-page load (not a JS History API URL update) means the circuit and any session-dependent state start completely fresh after login, rather than continuing to run against pre-login state that a History-API-only URL change would leave untouched.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — external OAuth redirect hard-fails with data-enhance',
      language: 'html',
      code: `<!-- Login.razor -->
@page "/login"

<form method="post" action="/auth/login" data-enhance>
    <!-- ...credentials fields... -->
    <button type="submit">Log In</button>
</form>

<!-- BUG: the /auth/login handler redirects to an external OAuth
     provider (accounts.example-idp.com) for actual authentication.
     Because data-enhance is present, this submission goes through
     fetch() instead of a native browser POST. The cross-origin
     redirect response becomes OPAQUE to JavaScript — Blazor's
     enhanced form handling treats this as an error for a non-GET
     request and the submission fails outright, rather than
     redirecting the user to the identity provider at all. -->`,
    },
    {
      label: 'The fix — remove data-enhance, let the browser handle the redirect natively',
      language: 'html',
      code: `<!-- Login.razor -->
@page "/login"

<form method="post" action="/auth/login">
    <!-- No data-enhance — this is a standard browser form POST.
         The browser's own native navigation handling follows the
         redirect to the external OAuth provider exactly as it
         always would, with no fetch-based opaque-response
         restriction involved — because it's the browser doing a
         genuine top-level navigation, not JavaScript inspecting a
         fetch() response. -->
    <button type="submit">Log In</button>
</form>`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer adds data-enhance to a login form whose handler redirects to an external OAuth identity provider. Instead of redirecting the user to the identity provider\'s login page, the form submission simply fails with no visible error message in the UI. A colleague suggests the problem must be a missing or misconfigured cookie on the redirect response. Is this the accurate explanation? Describe the actual failure mechanism.',
    hint: 'Enhanced form submission uses fetch() instead of a native browser POST. What does a fetch() response look like when the server redirects to a DIFFERENT origin than the current page, and how does Blazor\'s enhanced form handling react to that specific case?',
    solution: 'The colleague\'s cookie theory isn\'t accurate — the actual failure is more specific and more severe. Enhanced form submission (data-enhance) uses fetch() in place of a native browser POST. When the server redirects to an EXTERNAL origin (the OAuth identity provider\'s own domain), the fetch response becomes "opaque" — a browser security restriction that prevents JavaScript from inspecting details of a cross-origin response. Rather than attempting to follow this opaque redirect, Blazor\'s enhanced form handling explicitly treats it as an error for non-GET requests, causing the submission to fail outright instead of navigating the user anywhere. This has nothing to do with cookies — same-origin redirects actually DO get cookies set correctly via fetch; the real distinguishing factor is same-origin vs. cross-origin. The fix is removing data-enhance from this form, restoring native browser form submission, which follows any redirect (same-origin or cross-origin) exactly as browsers have always handled it, since no JavaScript fetch() call or opaque-response restriction is involved in a real, un-enhanced top-level navigation.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Login/logout forms shouldn\'t use data-enhance because the redirect response fails to set cookies correctly when intercepted by JavaScript.',
      reality: 'This subtopic\'s theory clarifies cookies actually ARE set correctly for same-origin redirects via fetch — the real, more severe failure is specifically a cross-origin redirect becoming an opaque response that Blazor\'s enhanced form handling treats as a hard error for non-GET requests.'
    },
    {
      thought: 'A same-origin redirect after an enhanced form submission (e.g. a login handler on the same domain redirecting to a dashboard) works exactly the same as a genuine full-page navigation, just faster.',
      reality: 'This subtopic\'s theory shows a same-origin redirect only updates the URL via the JS History API rather than triggering a real document reload — meaning the Blazor circuit and session-dependent state never get freshly re-initialized the way an actual navigation would, a subtler but real difference.'
    },
    {
      thought: 'A silently failing enhanced form submission with no error message is likely a bug in the developer\'s own server-side redirect logic, not something inherent to how enhanced form handling works.',
      reality: 'This subtopic\'s exercise shows this is expected, documented behavior for cross-origin redirects specifically — the fetch-based opaque-response restriction is a browser security mechanism outside the developer\'s server-side code entirely, and the fix is removing data-enhance, not debugging the redirect logic.'
    }
  ];
}
