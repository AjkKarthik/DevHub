import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-setapplicationname-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './why-setapplicationname-matters-shared-dataprotection-keys.html',
  styleUrl: './why-setapplicationname-matters-shared-dataprotection-keys.scss',
})
export class WhySetapplicationnameMattersSharedDataprotectionKeysSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s multi-pod fix contains TWO lines — PersistKeysToStackExchangeRedis AND SetApplicationName — but only explains the first; the second is silently load-bearing, and dropping it reproduces the exact bug the fix was for',
      points: [
        'The main Authentication page\'s "Not sharing Data Protection keys" mistake shows the fix: <code>AddDataProtection().PersistKeysToStackExchangeRedis(redis, "DataProtection-Keys").SetApplicationName("MyApp")</code>. The explanation covers only key sharing. But Data Protection payloads are not protected by the raw key-ring key directly — every <code>IDataProtector</code> derives a SUBKEY from the master key material plus a chain of <strong>purpose strings</strong>, and the FIRST element of that chain is the <strong>application discriminator</strong>. Two apps can read the SAME key ring from the SAME Redis instance and STILL be unable to decrypt each other\'s cookies, because their discriminators differ — different purposes, different derived subkeys.',
      ],
    },
    {
      heading: 'The default discriminator is derived from the app\'s CONTENT ROOT PATH — which differs across deployment slots, container image layouts, and even upgraded hosting plans — so "same code, shared keys, still cannot decrypt" is a real production failure mode, and SetApplicationName is what pins the discriminator to a stable value',
      points: [
        'When <code>SetApplicationName</code> is not called, ASP.NET Core auto-generates the discriminator from the content root path (e.g., <code>C:\\home\\site\\wwwroot</code> or <code>/app</code>). Two pods running the SAME container image share a path and happen to work — which is why the omission often survives testing. The failure appears when paths diverge: a blue/green deployment slot with a different site path, a migration from one hosting layout to another, or two SEPARATE apps (an API and an admin portal) that intentionally share a cookie. In each case the symptom is identical to the unshared-key-ring bug the main page describes — cookies from one side fail silently on the other, every affected user is logged out — but the key ring IS shared, which makes it bewildering to debug unless you know the discriminator is part of the key derivation.',
        'The purpose-chain design is not an accident — it is Data Protection\'s isolation model. The cookie handler protects tickets with purposes like <code>("Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationMiddleware", schemeName, "v2")</code>, layered UNDER the application discriminator. This is what stops app A\'s protector from unprotecting app B\'s payloads even on a shared key ring — cryptographic isolation WITHOUT separate key stores. <code>SetApplicationName</code> is therefore doing the opposite of its isolation default: it deliberately OPTS TWO DEPLOYMENTS INTO the same identity, and that only makes sense when they genuinely must read each other\'s payloads.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing "shared key ring, still cannot decrypt" — two protectors, same keys, different app names',
      language: 'csharp',
      code: `[Fact]
public void SharedKeyRing_DifferentApplicationNames_CannotDecryptEachOther()
{
    // ONE shared key directory — the equivalent of the main page's
    // shared Redis key ring, in file form so the test is hermetic:
    var sharedKeys = new DirectoryInfo(Path.Combine(Path.GetTempPath(), "dp-test-keys"));

    // "Pod A" — application name MyApp:
    var servicesA = new ServiceCollection();
    servicesA.AddDataProtection()
        .PersistKeysToFileSystem(sharedKeys)
        .SetApplicationName("MyApp");
    var protectorA = servicesA.BuildServiceProvider()
        .GetRequiredService<IDataProtectionProvider>()
        .CreateProtector("auth-ticket");

    // "Pod B" — SAME key ring, but the SetApplicationName line was
    // dropped (or the content-root-derived default differs):
    var servicesB = new ServiceCollection();
    servicesB.AddDataProtection()
        .PersistKeysToFileSystem(sharedKeys)
        .SetApplicationName("OtherApp");     // <- the ONLY difference
    var protectorB = servicesB.BuildServiceProvider()
        .GetRequiredService<IDataProtectionProvider>()
        .CreateProtector("auth-ticket");

    var payload = protectorA.Protect("user=alice");

    // THE KEY ASSERTION: B reads the SAME master keys A used — and
    // still cannot unprotect A's payload, because the application
    // discriminator is part of the subkey derivation, not just a
    // label:
    Assert.Throws<CryptographicException>(() => protectorB.Unprotect(payload));

    // Sanity check — a THIRD provider with the SAME app name as A
    // decrypts fine, proving the key ring itself was never the problem:
    var servicesC = new ServiceCollection();
    servicesC.AddDataProtection()
        .PersistKeysToFileSystem(sharedKeys)
        .SetApplicationName("MyApp");
    var protectorC = servicesC.BuildServiceProvider()
        .GetRequiredService<IDataProtectionProvider>()
        .CreateProtector("auth-ticket");

    Assert.Equal("user=alice", protectorC.Unprotect(payload));
}

// In production, protectorB's CryptographicException surfaces as a
// silently rejected auth cookie: the cookie handler treats an
// unprotect failure as "no valid cookie," the user appears logged out,
// and NOTHING in the logs says "key ring mismatch" — because the key
// ring genuinely matches. Only the discriminator differs.`,
    },
    {
      label: 'What the derivation chain looks like — and the deployment scenarios where the default discriminator diverges',
      language: 'csharp',
      code: `// CONCEPTUALLY, a protected payload's subkey is derived as:
//
//   subkey = Derive(masterKey,
//       applicationDiscriminator,        // <- SetApplicationName, or
//                                         //    content-root-path default
//       "Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationMiddleware",
//       schemeName,                       // e.g. "Cookies"
//       "v2");
//
// Every element of the chain must match at unprotect time. The main
// page's fix shares the masterKey (Redis); SetApplicationName pins the
// FIRST purpose element. Both are required.

// SCENARIOS where the DEFAULT (content-root-derived) discriminator
// diverges even though "it's the same app":
//
// 1. Azure App Service deployment slots — production at
//    C:\\home\\site\\wwwroot, staging slot at a DIFFERENT path. Swap
//    the slots: every user's cookie was protected under the old
//    discriminator → mass logout on deploy.
//
// 2. Container image rework — the app moves from /app to
//    /usr/share/myapp in a Dockerfile cleanup. Same code, same Redis
//    key ring, different derived discriminator → every cookie issued
//    before the rollout dies.
//
// 3. Two intentionally-cooperating apps — an API and an admin portal
//    that share a single sign-on cookie. Different content roots BY
//    DEFINITION, so without an explicit shared SetApplicationName they
//    can never read each other's tickets no matter what key store
//    they share.
//
// THE RULE THE MAIN PAGE'S FIX ENCODES, now with its reason: any time
// you share a key ring so that multiple processes can read each
// other's Data Protection payloads, you must ALSO pin the application
// name — the shared key store is necessary but not sufficient.
builder.Services.AddDataProtection()
    .PersistKeysToStackExchangeRedis(redis, "DataProtection-Keys")
    .SetApplicationName("MyApp");   // stable, deployment-independent —
                                     // never derived from a path

// And the inverse rule: two apps sharing a key store for OPERATIONAL
// convenience (one Redis to manage) that must NOT read each other's
// payloads should set DIFFERENT application names deliberately — the
// discriminator is the isolation boundary, so make it explicit rather
// than an accident of directory layout either way.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs the main page\'s exact fix in production. During a framework upgrade they also rename the auth cookie\'s SCHEME from "Cookies" to "AppCookies" for clarity, keeping the key ring and application name unchanged. Predict what happens to existing users\' sessions on deploy, and explain it using the purpose chain from this subtopic.',
    hint: 'Look at the conceptual derivation chain in the second code tab — the scheme name is one of its elements. What happens at unprotect time when any element of the chain differs from the one used at protect time?',
    solution: `Every existing user is logged out on deploy — a mass session
invalidation — even though the key ring AND the application name are
both unchanged.

The purpose chain explains it directly: the cookie handler derives its
protector with the SCHEME NAME as one of the chain's elements —
conceptually ("...CookieAuthenticationMiddleware", "Cookies", "v2")
before the rename, ("...CookieAuthenticationMiddleware", "AppCookies",
"v2") after. Cookies issued before the deploy were protected under the
old chain; the renamed handler derives a DIFFERENT subkey and its
Unprotect fails with the same CryptographicException the test in this
subtopic demonstrated for a mismatched application name. The handler
treats the failure as "no valid cookie" and challenges the user to log
in again. Symptomatically it is identical to the discriminator
mismatch: shared keys, same app name, and still nothing decrypts.

Three practical takeaways:

1. EVERY element of the purpose chain is part of the cryptographic
   identity — application name, component purpose, scheme name,
   version. Renaming any of them is a breaking change for all
   outstanding protected payloads, not a cosmetic refactor.

2. If a scheme rename is genuinely wanted, plan it as a session-reset
   event (deploy during low traffic, communicate the forced re-login)
   — or keep the scheme name stable and change only the DISPLAY name,
   since the scheme string's job is exactly this kind of stability.

3. The same logic answers a related question teams hit later: you
   cannot "migrate" old payloads to a new purpose chain offline
   without the old chain's parameters — the durable fix for any
   at-rest protected data (not cookies, which naturally re-issue) is
   to unprotect with the OLD protector and re-protect with the NEW one
   while both configurations are still available, before removing the
   old one.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'sharing the Data Protection key ring (via Redis, Azure Blob, or a shared directory) is sufficient for multiple pods or apps to decrypt each other\'s auth cookies.',
      reality: 'payloads are protected with a SUBKEY derived from the master key plus a purpose chain whose first element is the application discriminator — two apps on the same key ring with different discriminators still cannot decrypt each other\'s payloads, which is exactly why the main page\'s fix pairs PersistKeys with SetApplicationName.',
    },
    {
      thought: 'omitting SetApplicationName is safe because identical pods running the same container image work fine without it in testing.',
      reality: 'the default discriminator is derived from the content root path — identical pods share it by coincidence, and the failure surfaces precisely when paths diverge: deployment slot swaps, container layout changes, or two cooperating apps that were always going to have different roots; each produces a bewildering mass logout with a genuinely shared key ring.',
    },
    {
      thought: 'the application discriminator is just a label for diagnostics — a mismatch would produce a clear "wrong application" error at decrypt time.',
      reality: 'the discriminator participates in key derivation itself, so a mismatch produces a bare CryptographicException that the cookie handler swallows as "no valid cookie" — the user is silently treated as logged out, and no log entry mentions applications or key rings, which is what makes this failure mode so hard to diagnose without knowing the mechanism.',
    },
  ];
}
