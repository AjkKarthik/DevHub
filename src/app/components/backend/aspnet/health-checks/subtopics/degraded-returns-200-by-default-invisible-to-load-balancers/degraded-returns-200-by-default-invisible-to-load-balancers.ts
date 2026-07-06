import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-degraded-status-code-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './degraded-returns-200-by-default-invisible-to-load-balancers.html',
  styleUrl: './degraded-returns-200-by-default-invisible-to-load-balancers.scss',
})
export class DegradedReturns200ByDefaultInvisibleToLoadBalancersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states three true facts in three separate places — Degraded is "a warning state" for early alerting, Degraded maps to HTTP 200 by default, and most load balancers make routing decisions purely on HTTP status code — without ever connecting them into their combined, and rather deflating, consequence: infrastructure cannot see Degraded at all unless something explicitly parses the response BODY',
      points: [
        'A load balancer, Kubernetes readiness probe, or reverse proxy deciding whether to route traffic to a pod almost universally makes that decision from the HTTP STATUS CODE alone — typically "2xx = healthy, keep routing" versus "non-2xx = remove from rotation." Since <code>Degraded</code> returns <strong>200 by default</strong> (identical to <code>Healthy</code>), a Degraded pod is treated by the load balancer EXACTLY as if it reported full health — it continues receiving its normal, undiminished share of traffic.',
        'This directly undermines the main page\'s own stated PURPOSE for Degraded — "enables early alerting" for a service that is "not at full capacity." Early alerting to WHOM? Not to the load balancer, which never distinguishes the two statuses at the transport layer. The distinction is only visible to something that reads the JSON response BODY specifically (a custom monitoring dashboard, the HealthChecks UI package, an alerting rule configured to parse the <code>status</code> field) — infrastructure making routing decisions purely on status code is structurally blind to it.',
      ],
    },
    {
      heading: 'This is not necessarily a design flaw to "fix" by changing the status code mapping — a Degraded pod is usually still capable of serving SOME traffic, and Kubernetes/most load balancers have no notion of "route reduced traffic" as a first-class outcome, only "route" or "don\'t route" — the real fix is ensuring Degraded reaches a HUMAN or an alerting SYSTEM through a channel that does inspect the body',
      points: [
        'Overriding <code>HealthCheckOptions.ResultStatusCodes</code> to map <code>Degraded</code> to something non-2xx (e.g. 207 or even 503) SOLVES the visibility problem for infrastructure but reintroduces a worse one: the load balancer now stops routing to a pod that is still perfectly capable of handling most traffic — potentially removing a large fraction of your fleet during a widespread, mild degradation (a secondary cache offline, a license nearing expiry) that was never meant to reduce capacity at all. This is usually the WRONG fix, trading a visibility gap for an availability gap.',
        'The correct pattern is a SEPARATE consumption path for the Degraded signal: alerting rules (Prometheus/Grafana, an Azure Monitor alert, a HealthChecks UI notification webhook) configured to fire on the <code>status</code> field inside the JSON body, independent of the HTTP status code the load balancer sees. The load balancer keeps routing traffic normally (correct, since the pod IS still serving traffic); a human or on-call system gets paged (also correct, since something genuinely needs attention) — the two concerns are handled by two DIFFERENT consumers of the SAME health check data, exactly as the main page\'s "structured JSON... invaluable for on-call engineers" framing already implies, just without spelling out that the STATUS CODE alone reaches infrastructure while the BODY is what reaches people.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The invisible-to-infrastructure problem, demonstrated',
      language: 'csharp',
      code: `builder.Services.AddHealthChecks()
    .AddCheck<LicenseExpiryCheck>("license", tags: ["ready"])   // from the main page
    .AddDbContextCheck<AppDbContext>("database", tags: ["ready"]);

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate      = c => c.Tags.Contains("ready"),
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
    // ResultStatusCodes NOT overridden — uses the framework default:
    //   Healthy → 200, Degraded → 200, Unhealthy → 503
});

// Scenario: the license is 5 days from expiry. LicenseExpiryCheck
// (from the main page's own code) correctly returns:
//   HealthCheckResult.Degraded("Expires in 5 days — act now!", data)
// Aggregate HealthReport.Status becomes Degraded (the WORST individual
// status determines the aggregate, and Degraded outranks Healthy).

// The HTTP RESPONSE the load balancer actually sees:
//   HTTP/1.1 200 OK
//   { "status": "Degraded", "checks": { "license": { "status": "Degraded", ... } } }

// From the load balancer's perspective: status code 200 → healthy →
// keep sending 100% of normal traffic to this pod. The "act now!"
// urgency embedded in the Degraded result never reaches the layer
// making the routing decision — only the JSON BODY carries it, and
// the load balancer never reads response bodies for routing logic.`,
    },
    {
      label: 'The correct fix — a monitoring consumer that parses the body, independent of routing',
      language: 'csharp',
      code: `// DO NOT do this — "fixing" visibility by making Degraded non-2xx
// removes capacity for a condition that was never meant to reduce it:
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = c => c.Tags.Contains("ready"),
    ResultStatusCodes =
    {
        [HealthStatus.Degraded] = StatusCodes.Status503ServiceUnavailable
        // Now EVERY pod with a license nearing expiry (likely ALL of
        // them, since they share one license) gets pulled from
        // rotation simultaneously — a mild warning just took down
        // the whole fleet's capacity.
    },
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
});

// THE CORRECT PATTERN — keep infrastructure routing on status code
// (200 for both Healthy and Degraded, since the pod really can still
// serve traffic), and configure a SEPARATE alerting consumer that
// reads the JSON body's "status" field:

// Example: a Prometheus alerting rule (conceptual, via a metrics
// exporter that surfaces health status as a gauge) —
//   ALERT LicenseNearingExpiry
//     IF health_check_status{name="license"} == 1   # 1 = Degraded
//     FOR 1h
//     ANNOTATIONS { summary = "License check reports Degraded" }

// Or the HealthChecks UI package's own webhook notifications, which
// specifically watch for Degraded/Unhealthy transitions IN THE BODY
// and fire independent of what status code was returned:
builder.Services.AddHealthChecksUI(opts =>
{
    opts.AddHealthCheckEndpoint("API", "/health/ready");
    opts.AddWebhookNotification("slack-webhook",
        uri: builder.Configuration["Alerting:SlackWebhookUrl"]!,
        payload: "{ \\"text\\": \\"[[LIVENESS]] is [[FAILURE]]\\" }",
        restorePayload: "{ \\"text\\": \\"[[LIVENESS]] has recovered\\" }");
}).AddInMemoryStorage();
// This consumer inspects EVERY check's status from the response body,
// independent of HTTP status code — it is the "early alerting" the
// main page describes, running in parallel with, not instead of,
// normal 200-based load-balancer routing.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants SOME infrastructure-level signal for Degraded without fully removing capacity like a 503 would. They consider mapping Degraded to HTTP 299 (a technically-valid-but-unused 2xx code) so their load balancer\'s health check logic, which they can configure to treat 299 specially, keeps routing traffic but logs a warning. Evaluate this approach — does it solve the core problem this subtopic describes, and what does it depend on that a generic "keep it simple" recommendation might not?',
    hint: 'The core problem was "most load balancers make routing decisions purely on 2xx vs non-2xx status code, with no notion of a THIRD category." Does mapping Degraded to a specific, unused 2xx code change that binary categorization for a GENERIC load balancer, or does it only work if the SPECIFIC load balancer in use has been deliberately configured to recognize that specific code as meaningful?',
    solution: `This approach can work, but ONLY as a deliberate, load-balancer-
specific configuration — it is not a generic solution, and assuming it
"just works" the way plain 200-vs-503 routing does out of the box
would be a mistake. Using HTTP 299 as a distinct signal depends
entirely on the SPECIFIC infrastructure component reading that status
code having been explicitly configured to treat 299 differently from
other 2xx codes. Most load balancers, by default, treat ALL 2xx codes
identically ("healthy, keep routing") — a generic AWS ALB target group
health check, a default Kubernetes readiness probe, or an nginx
upstream health check configured with the common "check for 2xx"
pattern would treat 299 exactly the same as 200, providing NO
additional signal at all unless someone specifically reconfigures that
component's health-check success criteria to special-case 299.

This reveals the actual generalizable lesson: whether "a custom status
code carries meaning to infrastructure" is true or false depends
entirely on whether every layer between the health check response and
the routing decision has been explicitly taught to recognize that
code — it is not a property of the status code itself. If the team
controls their ENTIRE infrastructure stack (their own load balancer
configuration, their own Kubernetes readiness probe success codes) and
deliberately configures ALL of it to recognize 299 as "route
normally, but flag," this can be a legitimate, working solution —
essentially building a THIRD infrastructure-visible category that
doesn't exist by default. But it requires auditing every consumer of
that health endpoint (the primary load balancer, any secondary
monitoring probes, any CDN or edge health checks) to confirm each one
either explicitly handles 299 correctly or, at minimum, doesn't choke
on an unfamiliar 2xx code. The separate-alerting-consumer pattern this
subtopic recommends as the default answer is safer specifically
because it makes NO assumptions about how other infrastructure
components interpret status codes at all — it reads the body directly,
sidestepping the whole "does every layer agree on what this status
code means" question entirely.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'HealthCheckResult.Degraded, being described by the main page as enabling "early alerting," is automatically visible to load balancers and orchestrators as a distinct signal from Healthy.',
      reality: 'Degraded returns HTTP 200 by default — identical to Healthy — and since load balancers almost universally route based on 2xx-vs-non-2xx status code alone, a Degraded pod receives its normal, undiminished share of traffic; the distinction is only visible to something that specifically parses the JSON response body.',
    },
    {
      thought: 'the fix for Degraded being invisible to infrastructure is overriding HealthCheckOptions.ResultStatusCodes to map Degraded to a non-2xx code like 503.',
      reality: 'that fix trades a visibility problem for an availability problem — a pod that is still capable of serving most traffic gets fully removed from rotation for a condition (like a license nearing expiry, likely affecting the whole fleet simultaneously) that was never meant to reduce serving capacity at all.',
    },
    {
      thought: 'mapping Degraded to an unused, technically-valid status code (like 299) is a universal way to give infrastructure a third routing category beyond healthy/unhealthy.',
      reality: 'whether a specific status code carries special meaning depends entirely on every layer between the health endpoint and the routing decision having been explicitly configured to recognize it — most load balancers treat all 2xx codes identically by default, so this only works as a deliberate, audited configuration across the ENTIRE infrastructure stack, not as a drop-in universal fix.',
    },
  ];
}
