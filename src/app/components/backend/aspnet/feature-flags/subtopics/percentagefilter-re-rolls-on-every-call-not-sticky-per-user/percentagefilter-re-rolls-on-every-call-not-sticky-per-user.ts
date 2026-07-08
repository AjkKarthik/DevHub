import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-percentagefilter-mechanics-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './percentagefilter-re-rolls-on-every-call-not-sticky-per-user.html',
  styleUrl: './percentagefilter-re-rolls-on-every-call-not-sticky-per-user.scss',
})
export class PercentagefilterReRollsOnEveryCallNotStickyPerUserSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'PercentageFilter Has No Memory Between Calls',
      points: [
        'The main page describes PercentageFilter as enabling "the flag for a random X% of requests" — accurate, but easy to misread as "roughly X% of USERS see the new experience consistently." PercentageFilter re-evaluates its random check on EVERY SINGLE call to IsEnabledAsync (or every [FeatureGate] evaluation) — it has no concept of session, user identity, or prior result. The same user, on their very next request a moment later, has an entirely independent X% chance of getting a different answer than they got the request before.',
        'This matters most for a flag checked on EVERY request of a multi-step flow (e.g. IsEnabledAsync("NewCheckout") checked separately on the cart page, the payment page, and the confirmation page) — a user could be routed into the NEW checkout UI on step one and the OLD checkout UI on step two, since each check is an independent coin flip, not a decision made once and remembered.',
      ],
    },
    {
      heading: 'TargetingFilter Is Sticky Precisely Because It Isn\'t Random',
      points: [
        'TargetingFilter, by contrast, IS consistent per user across calls — because its decision comes from stable inputs (the user\'s identity or claimed groups via ITargetingContextAccessor), not a fresh random roll. The same user, checked twice, gets the same answer, because the underlying inputs haven\'t changed between the two checks. This is precisely why the main page\'s own advice to combine PercentageFilter with TargetingFilter for "graduated rollouts to known users first, then general population" works: TargetingFilter\'s explicit user/group list gives deterministic, sticky access to the beta cohort, while PercentageFilter\'s randomness is reserved for the broader population where per-request consistency matters less.',
        'If per-request consistency for a percentage rollout IS required (e.g. don\'t flip a user between checkout UIs mid-session), the fix is to check the flag ONCE per session or request context and pass the RESULT through, rather than calling IsEnabledAsync repeatedly at each step and trusting it to agree with itself.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving there is no per-call memory',
      language: 'csharp',
      code: `[Fact]
public async Task PercentageFilter_Produces_Different_Results_Across_Repeated_Calls()
{
    var services = new ServiceCollection();
    services.AddSingleton<IConfiguration>(BuildConfig(percentage: 50));
    services.AddFeatureManagement().AddFeatureFilter<PercentageFilter>();
    var provider = services.BuildServiceProvider();
    var featureManager = provider.GetRequiredService<IFeatureManager>();

    var results = new List<bool>();
    for (var i = 0; i < 200; i++)
    {
        // Same flag, no user parameter at all — called 200 times in a row.
        results.Add(await featureManager.IsEnabledAsync("GradualRollout"));
    }

    // With a 50% rollout, 200 independent calls should show BOTH true
    // and false results — proving there is no per-call memory linking
    // one evaluation's outcome to the next.
    Assert.Contains(true, results);
    Assert.Contains(false, results);
}`,
    },
    {
      label: 'The fix — decide once per session, not once per step',
      language: 'csharp',
      code: `// PROBLEM: checking on every step re-rolls independently
app.MapGet("/checkout/cart", async (IFeatureManager fm) =>
    (await fm.IsEnabledAsync("NewCheckout")) ? Results.Ok("new-cart-ui") : Results.Ok("old-cart-ui"));

app.MapGet("/checkout/payment", async (IFeatureManager fm) =>
    (await fm.IsEnabledAsync("NewCheckout")) ? Results.Ok("new-payment-ui") : Results.Ok("old-payment-ui"));
// A single user can land on "new-cart-ui" then "old-payment-ui" moments later.

// FIX: decide once, store the result, reuse it for the whole flow
app.MapGet("/checkout/start", async (IFeatureManager fm, HttpContext ctx) =>
{
    var useNewCheckout = await fm.IsEnabledAsync("NewCheckout");
    ctx.Session.SetString("UseNewCheckout", useNewCheckout.ToString());
    return Results.Redirect(useNewCheckout ? "/checkout/cart-new" : "/checkout/cart-old");
});
// Every subsequent step in the flow reads ctx.Session["UseNewCheckout"]
// instead of calling IsEnabledAsync("NewCheckout") again.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate "fixes" the flip-flopping checkout bug by changing PercentageFilter\'s Value from 50 to either 0 or 100 in different environments, reasoning that a fixed 0/100 percentage removes the randomness entirely. Does this actually fix the underlying inconsistency risk, or does it just make the bug currently invisible?',
    hint: 'Think about what happens the moment someone changes the Value back to a real gradual-rollout percentage like 25 for the next actual rollout — does the checkout flow\'s per-step IsEnabledAsync calls magically become session-consistent at that point?',
    solution: `It makes the bug currently INVISIBLE, not fixed. At Value: 0 or
Value: 100, every single call to IsEnabledAsync deterministically
returns the same answer (always false, or always true) — so the
flip-flopping symptom disappears, purely because there is no longer any
randomness to reveal the underlying re-evaluation problem. The
multi-step checkout flow is STILL calling IsEnabledAsync independently
at every step; it just happens that a 0%/100% split cannot produce
inconsistent results by coincidence.

The moment this flag (or any other percentage-rolled flag reused the
same way) is set back to a real gradual-rollout value like 25 or 50 for
an actual staged release, the exact same per-step re-evaluation returns
to producing genuinely inconsistent UI within a single user's session —
the underlying design flaw (checking the flag independently at each
step instead of once per session) was never fixed, only masked by a
percentage value that couldn't currently expose it. The real fix is the
one from the code tab: decide once per session or request and pass the
result through, regardless of what percentage value is configured.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'PercentageFilter rolling out a flag to 25% of requests means roughly 25% of USERS consistently see the new experience across their whole session.',
      reality: 'PercentageFilter re-evaluates independently on EVERY call to IsEnabledAsync — the same user can get a different answer on their very next request, since there is no session or identity concept involved at all.',
    },
    {
      thought: 'a flag checked at multiple steps of the same user flow (cart, payment, confirmation) will naturally agree with itself, since it is "the same flag."',
      reality: 'each IsEnabledAsync call for a PercentageFilter-gated flag is an independent random check — a user can genuinely see the new UI on one step and the old UI on the next unless the result is captured once and reused, not re-checked at each step.',
    },
    {
      thought: 'TargetingFilter and PercentageFilter behave the same way regarding per-user consistency, since both are "gradual rollout" filters.',
      reality: 'TargetingFilter is deterministic per user (driven by stable identity/group inputs via ITargetingContextAccessor) — the same user always gets the same answer. PercentageFilter is a fresh random roll on every call, with no per-user memory at all.',
    },
  ];
}
