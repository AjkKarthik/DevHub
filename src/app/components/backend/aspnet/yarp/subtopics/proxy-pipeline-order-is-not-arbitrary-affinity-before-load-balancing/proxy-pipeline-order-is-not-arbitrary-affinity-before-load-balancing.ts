import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-yarp-pipeline-order-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './proxy-pipeline-order-is-not-arbitrary-affinity-before-load-balancing.html',
  styleUrl: './proxy-pipeline-order-is-not-arbitrary-affinity-before-load-balancing.scss',
})
export class ProxyPipelineOrderIsNotArbitraryAffinityBeforeLoadBalancingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Built-In Pipeline Middlewares Have a Required Relative Order',
      points: [
        'The main page\'s own "Middleware Pipeline" example registers a custom logging middleware FIRST, then UseSessionAffinity(), UseLoadBalancing(), and UsePassiveHealthChecks() in that exact sequence — this order is NOT arbitrary. Each built-in stage depends on state the PREVIOUS stage sets up: UseSessionAffinity() must run before UseLoadBalancing() so it can override destination selection for a "sticky" client BEFORE load balancing makes its own independent pick; UseLoadBalancing() must run before UsePassiveHealthChecks() so there is an actual selected destination whose outcome can be observed and recorded.',
        'The main page\'s own custom logging middleware is registered BEFORE all three built-ins — at that point in the pipeline, the request has been MATCHED to a route and cluster, but NO destination has been selected yet. This is exactly why the example only logs feature?.Route.Config.ClusterId (known at match time) rather than the specific destination address — logging the destination at this stage would show null, since load balancing hasn\'t run yet.',
      ],
    },
    {
      heading: 'What Breaks If You Reorder Them',
      points: [
        'Swapping UseSessionAffinity() and UseLoadBalancing() silently defeats session affinity entirely: if UseLoadBalancing() runs FIRST, it independently selects a destination using its own policy (RoundRobin, LeastRequests, etc.) before session affinity\'s own logic ever gets a chance to override that pick for a returning client — the "sticky" behavior is configured but has no effect, since the destination was already chosen by the time affinity\'s code runs.',
        'Moving custom middleware to AFTER UseLoadBalancing() instead of before it is exactly how you\'d fix a desire to log the actual selected destination — at that later point, the reverse proxy feature reflects a real, chosen destination, which it does not yet at the point the main page\'s own example runs its custom logging code.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The correct order — and why',
      language: 'csharp',
      code: `app.MapReverseProxy(proxyPipeline =>
{
    // Runs BEFORE any destination is selected — only the matched
    // ROUTE and CLUSTER are known here, never the specific destination.
    proxyPipeline.Use(async (ctx, next) =>
    {
        var feature = ctx.Features.Get<IReverseProxyFeature>();
        Console.WriteLine($"Proxying to cluster: {feature?.Route.Config.ClusterId}");
        await next();
    });

    proxyPipeline.UseSessionAffinity();     // MUST run before load balancing
    proxyPipeline.UseLoadBalancing();       // selects the actual destination
    proxyPipeline.UsePassiveHealthChecks(); // observes THAT destination's outcome
});`,
    },
    {
      label: 'The broken reorder — affinity silently loses effect',
      language: 'csharp',
      code: `app.MapReverseProxy(proxyPipeline =>
{
    proxyPipeline.UseLoadBalancing();       // BUG: picks a destination FIRST...
    proxyPipeline.UseSessionAffinity();     // ...too late to override it now
    proxyPipeline.UsePassiveHealthChecks();
});
// A client with an active affinity cookie/header is silently ignored —
// load balancing already assigned a fresh destination via its own
// policy before session affinity's logic ever runs.`,
    },
    {
      label: 'Fix for logging the ACTUAL selected destination',
      language: 'csharp',
      code: `app.MapReverseProxy(proxyPipeline =>
{
    proxyPipeline.UseSessionAffinity();
    proxyPipeline.UseLoadBalancing();

    // NOW a destination has actually been selected — safe to log it.
    proxyPipeline.Use(async (ctx, next) =>
    {
        var feature = ctx.Features.Get<IReverseProxyFeature>();
        Console.WriteLine($"Selected destination: {feature?.ProxiedDestination?.DestinationId}");
        await next();
    });

    proxyPipeline.UsePassiveHealthChecks();
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team enables session affinity for a shopping-cart service, tests it manually once, sees it appear to work, then later notices carts randomly "forget" items when a client is load-balanced to a different backend instance mid-session. Using the middleware-ordering rule above, what is a likely root cause worth checking FIRST, before assuming the affinity cookie itself is broken?',
    hint: 'The affinity mechanism (a cookie or header identifying the sticky destination) can be configured perfectly correctly and still have zero effect, depending on ONE thing about the proxy pipeline registration.',
    solution: `Before investigating the affinity cookie/header mechanism itself
(expiration, domain scoping, whether it's being sent correctly), check
whether UseSessionAffinity() is registered BEFORE UseLoadBalancing() in
the proxy pipeline. If the order is swapped — load balancing first,
affinity second — every request gets a FRESH destination assigned by
the load-balancing policy before session affinity's own logic ever
gets a chance to honor the sticky cookie, making affinity configuration
appear "present but silently ineffective."

This matches the symptom exactly: an initial manual test might
coincidentally land on the same destination a few times by chance
(especially with few backend instances), giving the false impression
affinity is working, before enough real traffic reveals it doesn't
actually pin sessions reliably. Checking the TWO LINES of pipeline
registration order takes seconds and rules out (or confirms) this
entire class of bug before any deeper investigation into cookies,
headers, or client behavior.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the order UseSessionAffinity(), UseLoadBalancing(), and UsePassiveHealthChecks() are registered inside MapReverseProxy()\'s pipeline builder doesn\'t matter, since they\'re independent features that can be toggled on or off.',
      reality: 'each stage depends on state the previous one sets up — UseSessionAffinity() must run before UseLoadBalancing() to override its destination pick, and UseLoadBalancing() must run before UsePassiveHealthChecks() so there\'s an actual destination whose outcome can be observed.',
    },
    {
      thought: 'custom middleware registered before the built-in proxy stages (as in the main page\'s own logging example) can log which specific destination was selected for the request.',
      reality: 'at that point in the pipeline, only the matched ROUTE and CLUSTER are known — no destination has been selected yet, since UseLoadBalancing() hasn\'t run. Logging the destination requires registering custom middleware AFTER UseLoadBalancing() instead.',
    },
    {
      thought: 'if session affinity appears to work in a quick manual test, its configuration is correct.',
      reality: 'with few backend destinations, a load-balancing policy can coincidentally pick the same destination across a few manual requests even with affinity completely non-functional (e.g. registered in the wrong order) — only sustained real traffic reliably reveals whether affinity is actually pinning sessions or not.',
    },
  ];
}
