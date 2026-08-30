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
  templateUrl: './spa-refresh-tokens-cap-at-24-hours-not-90-days-and-never-reset.html',
  styleUrl: './spa-refresh-tokens-cap-at-24-hours-not-90-days-and-never-reset.scss'
})
export class SpaRefreshTokensCapAt24HoursNot90DaysAndNeverResetSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states one refresh token lifetime figure that doesn\'t hold for every client type',
      points: [
        'The main page\'s own theory states: "Refresh tokens are opaque, longer-lived (up to 90 days for confidential clients) and used to get new access tokens without re-authentication." The "for confidential clients" qualifier is there, but nothing on the main page states what the figure is for the OTHER major client type it discusses at length elsewhere — single-page applications (SPAs), which it separately covers via PKCE and the Authorization Code flow.',
        'A reader building a SPA with MSAL.js (the library the main page itself recommends) could reasonably assume their refresh tokens also last "up to 90 days," since the main page never contradicts that assumption for this specific, extremely common client type.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own refresh token reference: SPAs get a hard, non-negotiable 24-hour cap',
      points: [
        'Per Microsoft\'s own documentation, the default refresh token lifetimes are: "24 hours for single-page applications. 24 hours for apps that use email one-time passcode authentication flow. 90 days for all other scenarios." SPA is explicitly its own category, separate from and far shorter than the 90-day figure the main page states.',
        'Critically, this 24-hour cap doesn\'t reset each time the token is used — it\'s inherited by every subsequent refresh: "Refresh tokens sent to a redirect URI registered as spa expire after 24 hours. Additional refresh tokens acquired using the initial refresh token carry over that expiration time, so apps must be prepared to rerun the authorization code flow using an interactive authentication to get a new refresh token every 24 hours."',
        'This is a deliberate security tradeoff specific to the browser environment, not an oversight: "Cross-site scripting (XSS) attacks or compromised JS packages can steal the refresh token and use it remotely until it expires or is revoked... In order to minimize the risk of stolen refresh tokens, SPAs are issued tokens valid for 24 hours only." A SPA\'s refresh token lives in browser JS-accessible storage, a fundamentally weaker security boundary than a confidential client\'s server-side storage — the shorter lifetime compensates for that.',
      ]
    },
    {
      heading: 'A second gap in the main page\'s coverage: old refresh tokens aren\'t automatically revoked',
      points: [
        'The main page never mentions what happens to a refresh token after it\'s used to get a new one. Per Microsoft\'s own docs: "Refresh tokens replace themselves with a fresh token upon every use. The Microsoft identity platform doesn\'t revoke old refresh tokens when used to fetch new access tokens. Securely delete the old refresh token after acquiring a new one."',
        'This means an app that fails to delete a superseded refresh token leaves BOTH the old and new tokens simultaneously valid — a real, silent attack-surface expansion if the old token was ever exposed (e.g. logged, cached, or leaked before rotation), since simply issuing a new one does not invalidate it.',
        'Because this rotation-without-automatic-revocation behavior is identical for SPAs and confidential clients alike, "securely delete the old refresh token after acquiring a new one" is a responsibility every client type shares — MSAL libraries handle this automatically in their own token cache, which is itself a reason to prefer MSAL over hand-rolled token storage, beyond the silent-refresh and conditional-access-claims handling the main page already credits it for.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SPA vs. confidential client refresh token lifetimes',
      language: 'bash',
      code: `# A SPA registered with a redirect URI of type "spa" gets a
# refresh token that expires in 24 hours -- NOT the 90 days the
# main page states for "confidential clients":
az ad app create \\
  --display-name my-spa \\
  --spa-redirect-uris "https://myapp.contoso.com/auth-callback"

# Compare to a confidential client (server-side web app / daemon):
az ad app create \\
  --display-name my-server-app \\
  --web-redirect-uris "https://myserverapp.contoso.com/auth-callback"
# This client type's refresh tokens follow the 90-day default the
# main page describes -- because the token is stored server-side,
# outside browser JS reach.

# Per Microsoft's own docs, the SPA's 24-hour cap does NOT reset on
# each refresh -- every subsequent refresh token acquired from the
# original one carries over the SAME 24-hour expiry window:
# "Additional refresh tokens acquired using the initial refresh
#  token carry over that expiration time."`,
    },
    {
      label: 'What a SPA must handle because of the 24-hour cap',
      language: 'bash',
      code: `# Because the SPA's refresh token silently stops working every
# 24 hours (not on a fixed daily clock -- 24 hours from the
# ORIGINAL authorization code exchange), MSAL.js needs to re-run
# an interactive top-level-frame sign-in to get a fresh one:
#
# 1. User signs in once via a full-page redirect to the login page
#    -> auth code -> access token + refresh token (24h window starts)
# 2. Silent token refresh works normally for the next 24 hours
# 3. At the 24-hour mark, the refresh token is no longer valid
# 4. MSAL.js must redirect the top-level window back to the login
#    page for a fresh interactive sign-in -- usually invisible to
#    the user (existing session cookie means no credential re-entry)
#    but it IS a real navigation, not a silent background call
#
# This is why third-party-cookie-blocking browsers (Safari ITP,
# Chrome Privacy Sandbox) specifically call out that a SPA "must
# visit the sign-in page in a top-level frame" -- an iframe-based
# silent refresh can't work once cookies are blocked, and the
# 24-hour cap means this isn't a rare edge case for a SPA.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You\'re designing a single-page application (SPA) using MSAL.js and, based on the main page\'s own theory bullet ("Refresh tokens are opaque, longer-lived — up to 90 days"), you plan the UX around users staying silently signed in for up to 90 days between visits. A teammate flags this as wrong for a SPA specifically. Are they right, and if so, what should you actually design around?',
    hint: 'Check whether the main page\'s "up to 90 days" figure applies uniformly to every client type, or whether SPAs specifically have their own, much shorter default.',
    solution: 'The teammate is right. Per Microsoft\'s own refresh token documentation, the 90-day figure applies to confidential clients and "all other scenarios" — but SPAs are their own explicit category with a 24-hour refresh token lifetime, and that 24-hour window carries over to every subsequently-refreshed token rather than resetting. A user who last visited the SPA more than 24 hours ago will need to go through an interactive (usually invisible, cookie-based) re-authentication redirect, not a purely silent token refresh. The UX should be designed around "silently re-authenticated at least once a day," not "silently signed in for up to 90 days" — that longer figure only applies to non-SPA client types.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s "up to 90 days" refresh token lifetime applies to every client type, including single-page applications built with MSAL.js.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation lists SPAs as their own explicit category with a 24-hour default lifetime — sharply shorter than the 90-day figure that applies to confidential clients and other scenarios.'
    },
    {
      thought: 'A SPA\'s refresh token lifetime resets to a fresh 24-hour window every time it\'s used to get a new refresh token, similar to a rolling session.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the opposite: "Additional refresh tokens acquired using the initial refresh token carry over that expiration time" — the 24-hour clock is anchored to the original authorization, not reset on each use.'
    },
    {
      thought: 'When an app acquires a new refresh token, the old one is automatically invalidated by the Microsoft identity platform, so there\'s no need to manage cleanup on the client side.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states plainly: "The Microsoft identity platform doesn\'t revoke old refresh tokens when used to fetch new access tokens. Securely delete the old refresh token after acquiring a new one" — this is the application\'s own responsibility (which MSAL\'s token cache handles automatically).'
    }
  ];
}
