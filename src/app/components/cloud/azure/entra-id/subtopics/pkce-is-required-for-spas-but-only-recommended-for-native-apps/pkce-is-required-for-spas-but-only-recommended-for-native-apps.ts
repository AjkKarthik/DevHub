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
  templateUrl: './pkce-is-required-for-spas-but-only-recommended-for-native-apps.html',
  styleUrl: './pkce-is-required-for-spas-but-only-recommended-for-native-apps.scss'
})
export class PkceIsRequiredForSpasButOnlyRecommendedForNativeAppsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats PKCE as one uniform recommendation for two client types that are actually enforced differently',
      points: [
        'The main page\'s own theory states: "Use PKCE (Proof Key for Code Exchange) for SPAs and mobile apps to prevent code interception." Grouping SPAs and mobile (native) apps together under one "use PKCE" recommendation implies the same level of obligation applies to both.',
        'It doesn\'t — one of these is a platform-enforced hard requirement with no way to opt out, and the other is best-practice guidance the platform does not currently enforce at the protocol level.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own protocol guidance: required for SPAs, merely recommended for native and confidential clients',
      points: [
        'Per Microsoft\'s own documentation on browser-based auth: "For the Microsoft identity platform, SPAs and native clients follow similar protocol guidance: Use of a PKCE code challenge — PKCE is required for SPAs on the Microsoft identity platform. PKCE is recommended for native and confidential clients." The two client types are explicitly called out with two different enforcement words in the same sentence.',
        'For a SPA (an app registration whose redirect URI is registered with type spa), the Microsoft identity platform itself enforces the PKCE code challenge/verifier exchange as part of the Authorization Code flow — there is no configuration or code path that lets a SPA-registered client skip it and still successfully authenticate.',
        'For a native (mobile/desktop) or confidential (server-side web) client, PKCE remains genuinely valuable protection against authorization code interception — but the Microsoft identity platform does not reject an Authorization Code flow request from these client types purely for omitting it. The protection is real; the enforcement is not automatic.',
      ]
    },
    {
      heading: 'Why the distinction exists, and what it means in practice',
      points: [
        'SPAs are uniquely exposed: their entire authorization code exchange happens in JavaScript running in the user\'s browser, where a malicious script, a compromised dependency, or a browser extension has a direct path to intercept the code before the legitimate app exchanges it. PKCE closes that specific window by requiring proof of possession of a secret (the code verifier) that only the originating app instance has, generated fresh per authorization request.',
        'Native and confidential clients have other protections available that reduce (though don\'t eliminate) the same risk — a native app\'s code exchange can happen outside a shared browser process via a system browser tab or app-to-app handoff, and a confidential client\'s code exchange happens entirely server-side, never touching untrusted code at all. This is likely why the platform treats enforcement differently: the baseline risk without PKCE is objectively higher for a SPA.',
        'In practice: if you\'re building a SPA, PKCE isn\'t a checklist item you could accidentally skip — MSAL.js implements it by default and the platform would reject a flow that omitted it. If you\'re building a native or confidential app, implementing PKCE is still worth doing (and MSAL libraries for those platforms support it too) — but it depends on you actually enabling and testing it, since nothing on the platform side will catch its absence.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SPA: PKCE is baked into the flow, not a flag you set',
      language: 'bash',
      code: `# MSAL.js (for SPAs) generates the PKCE code_verifier and
# code_challenge automatically as part of every authorization
# request -- there's no separate "enable PKCE" setting because
# the platform requires it unconditionally for spa-type redirect URIs.

# The authorization request MSAL.js sends includes:
# GET https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize?
#   client_id=<spa-client-id>
#   &response_type=code
#   &redirect_uri=https://myapp.contoso.com/callback
#   &code_challenge=<generated-per-request>
#   &code_challenge_method=S256
#   &scope=...

# Omitting code_challenge/code_challenge_method for a redirect URI
# registered as type "spa" is rejected by the Microsoft identity
# platform itself -- there is no successful non-PKCE path for
# this client type.`,
    },
    {
      label: 'Native/confidential clients: PKCE is available, but not enforced',
      language: 'bash',
      code: `# For a native app (mobile/desktop) or a confidential client
# (server-side web app), MSAL libraries also support PKCE and it
# is genuinely recommended -- but the platform does not reject a
# request that omits it the way it does for a "spa" redirect URI.

# Per Microsoft's own guidance: "PKCE is recommended for native
# and confidential clients." -- worth implementing deliberately,
# since nothing about the protocol enforcement will surface its
# absence during development or testing the way a SPA's hard
# requirement would.

# Practical takeaway: use the platform's own MSAL library for your
# client type (MSAL.js, MSAL for iOS/Android, MSAL.NET, etc.) rather
# than hand-rolling the Authorization Code flow -- they implement
# PKCE by default across all client types, closing the gap between
# "required" and "recommended but easy to accidentally skip."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Your team is building both a SPA and a companion native mobile app that both use the Authorization Code flow against the same Entra ID app registrations. A teammate says "we should add PKCE to the SPA since the docs say it\'s required there, but we can skip it for the mobile app to ship faster since the main page only lists it as one combined recommendation for both." Is skipping PKCE for the mobile app actually safe, and does the SPA even have a choice about it?',
    hint: 'Check the exact enforcement wording Microsoft uses for each client type, and consider what protection PKCE provides regardless of whether it\'s enforced by the platform.',
    solution: 'The SPA doesn\'t have a choice — PKCE is a hard, platform-enforced requirement for SPA-registered redirect URIs, and MSAL.js implements it automatically regardless of any team decision. Skipping it for the mobile app is a real risk, though: PKCE is only "recommended," not platform-enforced, for native clients — the Authorization Code flow will still succeed without it. But the protection PKCE provides (defeating authorization code interception) is still genuinely relevant for a native app, which the platform\'s weaker enforcement doesn\'t change. The safer approach is using the platform\'s own MSAL library for the mobile app (MSAL for iOS/Android), which implements PKCE by default — "recommended but not enforced" should be treated as "still do it," not as an invitation to skip it for speed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the main page recommends PKCE for both SPAs and mobile apps in the same sentence, both client types are held to the same level of enforcement by the Microsoft identity platform.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation uses two different words for a reason: "PKCE is required for SPAs on the Microsoft identity platform. PKCE is recommended for native and confidential clients." Only SPAs are platform-enforced.'
    },
    {
      thought: 'A native or confidential client can safely skip PKCE without much real risk, since the Microsoft identity platform doesn\'t consider it important enough to enforce for those client types.',
      reality: 'Per this subtopic\'s theory, "recommended" reflects a difference in enforcement mechanism, not a difference in the actual value of the protection — authorization code interception risk is still real for native and confidential clients, just not automatically blocked by the platform the way it is for SPAs.'
    },
    {
      thought: 'Implementing PKCE requires meaningful custom code and configuration effort for each client type.',
      reality: 'Per this subtopic\'s theory, the platform\'s own MSAL libraries (MSAL.js, MSAL for iOS/Android, MSAL.NET, etc.) implement PKCE by default across all client types — using MSAL instead of a hand-rolled Authorization Code flow implementation closes the gap between "required" and "recommended but easy to accidentally skip" with essentially no extra effort.'
    }
  ];
}
