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
  templateUrl: './alb-reserved-cookie-names-and-4k-cookie-sharding.html',
  styleUrl: './alb-reserved-cookie-names-and-4k-cookie-sharding.scss'
})
export class AlbReservedCookieNamesAnd4kCookieShardingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions "the AWSALB cookie" and "application-based cookies" twice, but never names the full reserved-cookie family or what happens to a large application cookie',
      points: [
        'The main page\'s own quickRef defines Sticky Sessions only as: "Session affinity — ALB routes the same client to the same target using a cookie (AWSALB or application-based)." — naming exactly one reserved cookie (AWSALB) and one general category (application-based), with no further detail.',
        'The main page\'s own sticky-sessions mistake entry shows a real failure mode (ASG termination losing session state) but its own code comments and explanation only ever say "AWSALB cookie" and "application-based cookies" in passing — never listing the OTHER reserved names, and never mentioning what happens if an application\'s own custom cookie is large.',
      ]
    },
    {
      heading: 'AWS reserves three exact cookie name prefixes, and application cookies over 4K are silently split into numbered fragments',
      points: [
        'Per AWS\'s own target-group attribute documentation, the reserved names are explicit: when naming a custom application cookie, "Do not use AWSALB, AWSALBAPP, or AWSALBTG for the cookie name; they\'re reserved for use by the load balancer." Accidentally choosing one of these three exact names for an application\'s own session cookie collides with the load balancer\'s own cookie namespace.',
        'For duration-based stickiness the ALB sets a single cookie named exactly AWSALB, with a fixed, non-configurable expiry: "The load balancer generated cookie has its own expiry of 7 days which is non-configurable." — the stickiness DURATION you configure controls how long the ALB honors the cookie for routing, but the cookie\'s own browser-side expiry is always 7 days regardless of that setting.',
        'For application-based stickiness, AWS documents a genuinely surprising sharding behavior driven by a browser limit: "Because most browsers limit cookies to 4K in size, the load balancer shards application cookies greater than 4K into multiple cookies. Application Load Balancers support cookies up to 16K in size and can therefore create up to 4 shards that it sends to the client. The application cookie name that the client sees begins with \\"AWSALBAPP-\\" and includes a fragment number." A 10K application cookie is therefore NOT sent to the client as one AWSALBAPP-0 cookie — it arrives as AWSALBAPP-0, AWSALBAPP-1, and AWSALBAPP-2, each under the browser\'s own 4K ceiling.',
        'A fourth cookie, AWSALBCORS, exists purely to support cross-origin requests and has a documented precedence rule over the plain AWSALB cookie: "For cross-origin resource sharing (CORS) requests, some browsers require SameSite=None; Secure to enable stickiness. To support these browsers the load balancer always generates a second stickiness cookie, AWSALBCORS... Clients receive both cookies, including non CORS requests." AWS states directly: "If the Application Load Balancer receives both an AWSALBCORS and an AWSALB duration-based stickiness cookie, the value in AWSALBCORS will take precedence" — meaning a client legitimately holding both cookies is routed according to whichever target AWSALBCORS points to, even if AWSALB (sent in the very same request) disagrees.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reserved name collision — a custom cookie named AWSALBAPP',
      language: 'bash',
      code: `# Application-based stickiness config attempt
aws elbv2 modify-target-group-attributes \\
  --target-group-arn $TG_ARN \\
  --attributes \\
    "Key=stickiness.enabled,Value=true" \\
    "Key=stickiness.type,Value=app_cookie" \\
    "Key=stickiness.app_cookie.cookie_name,Value=AWSALBAPP" \\
    "Key=stickiness.app_cookie.duration_seconds,Value=86400"
# The cookie name AWSALBAPP is reserved for the ALB's own generated
# application cookie. Per AWS's own docs: "Do not use AWSALB,
# AWSALBAPP, or AWSALBTG for the cookie name; they're reserved for
# use by the load balancer." Choosing this exact name collides with
# the load balancer's own cookie namespace and produces undefined,
# unsupported stickiness behavior -- pick a distinct application
# cookie name instead, e.g. "my-app-session".`,
    },
    {
      label: 'Cookie sharding for a large application session cookie',
      language: 'bash',
      code: `# Target sets its own session cookie carrying ~10K of session data,
# with application-based stickiness configured to match its name:
aws elbv2 modify-target-group-attributes \\
  --target-group-arn $TG_ARN \\
  --attributes \\
    "Key=stickiness.enabled,Value=true" \\
    "Key=stickiness.type,Value=app_cookie" \\
    "Key=stickiness.app_cookie.cookie_name,Value=my-app-session" \\
    "Key=stickiness.app_cookie.duration_seconds,Value=3600"

# Per AWS's own docs: application cookies over 4K are sharded into
# up to 4 numbered fragments (max 16K total). The client's cookie
# jar for a 10K session actually contains:
#   my-app-session          (the target's own original cookie, proxied as-is)
#   AWSALBAPP-0              (0-4K of the LB-generated stickiness data)
#   AWSALBAPP-1              (4-8K)
#   AWSALBAPP-2              (8-10K, the remainder)
# All fragments must round-trip back to the ALB on every subsequent
# request for stickiness to keep working -- a client or proxy that
# only forwards "AWSALBAPP-0" and drops the rest silently breaks
# stickiness for large sessions.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A client sends a request to an ALB carrying both an AWSALB cookie (pointing at target-A) and an AWSALBCORS cookie (pointing at target-B) — perhaps because the AWSALBCORS cookie was refreshed more recently by a cross-origin request while AWSALB is stale. Using this subtopic\'s theory, which target receives the request?',
    hint: 'Per AWS\'s own documentation, when both duration-based stickiness cookies are present in the same request, which one wins?',
    solution: 'Per this subtopic\'s theory, target-B wins. AWS\'s own documentation states directly: "If the Application Load Balancer receives both an AWSALBCORS and an AWSALB duration-based stickiness cookie, the value in AWSALBCORS will take precedence." This precedence rule exists precisely because AWSALBCORS is the cookie some browsers actually honor and resend on cross-origin requests (via its SameSite=None; Secure attributes), so the ALB trusts it over the plain AWSALB cookie whenever both are present in the same request, regardless of which one was set or refreshed more recently.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'AWSALB is the only cookie name reserved by the ALB — an application is free to name its own session cookie AWSALBAPP or AWSALBTG as long as it avoids AWSALB specifically.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation reserves THREE exact names — AWSALB, AWSALBAPP, and AWSALBTG — for the load balancer\'s own use, not just the one most commonly mentioned.'
    },
    {
      thought: 'A large application session cookie is sent to the client as a single oversized AWSALBAPP cookie, since Application Load Balancers support cookies up to 16K.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation describes automatic sharding into numbered fragments (AWSALBAPP-0, AWSALBAPP-1, etc.) once the cookie exceeds 4K, because most BROWSERS — not the ALB itself — cap an individual cookie at 4K; the 16K ALB-side limit is the ceiling on the total across all shards, not a single cookie\'s size.'
    },
    {
      thought: 'AWSALBCORS is only sent to clients that are actually making a cross-origin request.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states clients receive both the AWSALB and AWSALBCORS cookies unconditionally, "including non CORS requests" — AWSALBCORS is not selectively withheld from same-origin clients.'
    }
  ];
}
