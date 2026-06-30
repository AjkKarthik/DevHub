import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-azure-api-management',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './api-management.html',
  styleUrl: './api-management.scss'
})
export class AzureApiManagement {

  quickRef: QuickRefItem[] = [
    { name: 'Policy Pipeline', type: 'type', desc: 'Four sections evaluated for every request: inbound (before backend), backend (forward request), outbound (transform response), on-error. Written in XML.' },
    { name: 'rate-limit-by-key', type: 'type', desc: 'Policy that throttles calls per subscription key (or IP, custom key) to a defined rate (calls per period). Returns 429 when exceeded.' },
    { name: 'validate-jwt', type: 'type', desc: 'Policy that validates a JWT Bearer token — checks signature, issuer, audience, and claims. Rejects unauthorised requests before they reach the backend.' },
    { name: 'cache-lookup', type: 'type', desc: 'Policy pair (cache-lookup + cache-store) that caches GET responses in APIM\'s built-in cache. Reduces backend load for stable responses.' },
    { name: 'Backend', type: 'type', desc: 'The upstream service APIM forwards requests to. Can be HTTP/HTTPS URL, Azure Function, Logic App, or Service Fabric. Supports load balancing across multiple backends.' },
    { name: 'Developer Portal', type: 'type', desc: 'Auto-generated, customisable API documentation portal where developers discover APIs, read docs, test calls, and obtain subscription keys.' },
    { name: 'Subscription Key', type: 'type', desc: 'A key (header Ocp-Apim-Subscription-Key or query ?subscription-key=) that identifies the calling application. Used for rate limiting and billing attribution.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'APIM Architecture & Policy Pipeline',
      points: [
        'Azure API Management (APIM) sits between clients and backend APIs. All traffic flows through APIM, which applies policies, enforces security, and routes to backends. Key concepts: APIs (definitions), Operations (endpoints), Products (bundles of APIs for subscription), and Subscriptions (keys).',
        'The policy pipeline has four sections: Inbound (client → APIM, before backend call — authenticate, rate limit, transform request), Backend (APIM → backend — set URL, load balance, retry), Outbound (APIM → client, after backend response — transform response, add headers), On-Error (executed if any section throws — return error responses).',
        'Policies are XML fragments applied at four scopes (widest to narrowest): Global (all APIs), Product, API, Operation. A request executes policies at all applicable scopes in order — global first, operation last. The <base /> element controls where parent scope policies are applied within a child scope.',
        'Policy expressions use C# syntax inside @(...) for single expressions or @{...} for multi-line blocks: set-header name="X-Forwarded-For" exists-action="override" → @(context.Request.IpAddress). Access request, response, subscription, user, and product context through the context object.',
        'APIM tiers: Consumption (serverless, per-call billing, no VNet, limited features), Developer (low-cost dev/test, no SLA, VNet support), Basic (99.9% SLA), Standard (99.9%, VNet integration), Premium (multi-region, 99.99%, VNet, self-hosted gateway).',
      ]
    },
    {
      heading: 'Authentication & Rate Limiting Policies',
      points: [
        'validate-jwt: validates a JWT token in the Authorization header (or any header/query param). Configures issuer, audience, required-claims, and where to find signing keys (openid-config-url or certificate). Rejects invalid tokens with 401 before the request reaches the backend.',
        'rate-limit-by-key: throttles requests per subscription key (or custom expression). Set calls-per-period and renewal-period (in seconds). Returns HTTP 429 with a Retry-After header when exceeded. Different from quota-by-key (limit total calls per period, not rate).',
        'ip-filter: allow or deny requests from specific IP ranges. Use for: allow only corporate IPs, deny known abuse IPs. Apply at API or Product scope for selective blocking.',
        'Mutual TLS (mTLS) with backends: APIM can present a client certificate to the backend to authenticate itself — configure the backend certificate in APIM and use authentication-certificate policy in the backend section.',
        'OAuth 2.0 with Entra ID: configure APIM with an Entra ID app registration. Use validate-jwt policy with the Entra ID OIDC metadata endpoint as the issuer config URL — APIM automatically fetches and caches signing keys. Claims-based authorisation: check specific roles or groups in the token claims.',
      ]
    },
    {
      heading: 'Transformation & Caching Policies',
      points: [
        'set-header: add, remove, or override request/response headers. Use to: add correlation IDs (set-header name="X-Correlation-Id" @(context.RequestId)), remove internal headers before forwarding to clients (set-header name="X-Internal-Host" exists-action="delete").',
        'rewrite-uri: change the URL path before forwarding to the backend. Useful for versioning: map /v1/users → /api/users on the backend without changing the backend URL.',
        'json-to-xml and xml-to-json: transform payload format between client and backend. APIM can serve JSON to modern clients while proxying to a legacy SOAP/XML backend.',
        'cache-lookup + cache-store: cache GET responses in APIM\'s built-in cache (internal) or an external Azure Cache for Redis (external cache provider). Set vary-by-header or vary-by-query-parameter to cache different responses per header/parameter value. Cached responses bypass the backend entirely.',
        'send-request: make an outbound HTTP call from within a policy — useful for: looking up claims from an identity service, checking a blocklist, calling an enrichment API before passing the request to the backend. Results can be stored in context variables and used in subsequent policy expressions.',
      ]
    },
    {
      heading: 'Developer Portal & Products',
      points: [
        'Products group one or more APIs and define access: Open (no subscription required) or Protected (subscription key required). Developers subscribe to a Product to get a key. Products can have usage quotas and rate limits applied at the product scope.',
        'The Developer Portal is an automatically generated API documentation site. Customise it with custom HTML/CSS, add custom pages, embed interactive API consoles (try-it-out). Available at https://{apim-name}.developer.azure-api.net.',
        'API versioning in APIM: header-based (api-version header), query-based (?api-version=), or path-based (/v1/, /v2/). Each version maps to the same or different backend. Version sets group API versions for clean presentation in the Developer Portal.',
        'API revisions: test non-breaking changes to an API in a staging revision before making it the current revision. Revisions share the same subscription keys — callers are not impacted. Use ?api-version=;rev=2 to test a specific revision.',
        'Self-hosted gateway: deploy the APIM gateway component as a container in on-premises environments, other clouds, or Kubernetes clusters. Manages to the cloud APIM control plane. Use for: hybrid cloud APIs, latency-sensitive on-premises backends, edge deployments.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Policy XML Examples',
      language: 'bash',
      code: `<!-- Inbound: validate JWT + rate limit + add correlation header -->
<policies>
  <inbound>
    <base />
    <!-- Validate Entra ID token -->
    <validate-jwt header-name="Authorization" failed-validation-httpcode="401"
                  failed-validation-error-message="Unauthorized">
      <openid-config url="https://login.microsoftonline.com/{tenant-id}/v2.0/.well-known/openid-configuration" />
      <audiences>
        <audience>api://{client-id}</audience>
      </audiences>
      <issuers>
        <issuer>https://sts.windows.net/{tenant-id}/</issuer>
      </issuers>
      <required-claims>
        <claim name="roles" match="any">
          <value>API.Read</value>
          <value>API.Write</value>
        </claim>
      </required-claims>
    </validate-jwt>

    <!-- Rate limit: 100 calls per 60 seconds per subscription key -->
    <rate-limit-by-key calls="100" renewal-period="60"
                       counter-key="@(context.Subscription.Id)" />

    <!-- Add correlation ID for distributed tracing -->
    <set-header name="X-Correlation-Id" exists-action="skip">
      <value>@(context.RequestId.ToString())</value>
    </set-header>
  </inbound>

  <backend>
    <base />
  </backend>

  <outbound>
    <base />
    <!-- Remove internal headers from response -->
    <set-header name="X-Powered-By" exists-action="delete" />
    <set-header name="Server" exists-action="delete" />
  </outbound>

  <on-error>
    <base />
    <return-response>
      <set-status code="@(context.Response.StatusCode)" />
      <set-body>@{
        return new JObject(
          new JProperty("error", context.LastError.Message),
          new JProperty("correlationId", context.RequestId)
        ).ToString();
      }</set-body>
    </return-response>
  </on-error>
</policies>`
    },
    {
      label: 'Create APIM & Import API',
      language: 'bash',
      code: `# Create APIM instance (Standard tier)
az apim create \\
  --name my-apim --resource-group my-rg \\
  --location eastus \\
  --publisher-email admin@example.com \\
  --publisher-name "My Company" \\
  --sku-name Standard \\
  --sku-capacity 1

# Import an OpenAPI spec as an API
az apim api import \\
  --service-name my-apim --resource-group my-rg \\
  --path /orders \\
  --specification-format OpenApi \\
  --specification-url https://mybackend.azurewebsites.net/swagger/v1/swagger.json \\
  --display-name "Orders API" \\
  --api-id orders-api \\
  --service-url https://mybackend.azurewebsites.net

# Create a Product and link the API
az apim product create \\
  --service-name my-apim --resource-group my-rg \\
  --product-id standard-plan \\
  --product-name "Standard Plan" \\
  --subscription-required true \\
  --approval-required false \\
  --state published

az apim product api add \\
  --service-name my-apim --resource-group my-rg \\
  --product-id standard-plan \\
  --api-id orders-api

# Apply a policy to the API (from file)
az apim api policy create \\
  --service-name my-apim --resource-group my-rg \\
  --api-id orders-api \\
  --policy-format xml \\
  --value @policy.xml`
    },
    {
      label: 'Caching & Transformation',
      language: 'bash',
      code: `<!-- Cache GET responses for 5 minutes, vary by query string -->
<policies>
  <inbound>
    <base />
    <cache-lookup vary-by-developer="false" vary-by-developer-groups="false">
      <vary-by-query-parameter>category</vary-by-query-parameter>
      <vary-by-query-parameter>page</vary-by-query-parameter>
    </cache-lookup>
  </inbound>
  <backend>
    <base />
  </backend>
  <outbound>
    <base />
    <cache-store duration="300" />
  </outbound>
</policies>

<!-- Transform: rewrite path + add backend auth header -->
<inbound>
  <base />
  <rewrite-uri template="/api/v2/{*path}" />
  <!-- Use Managed Identity to get token for backend -->
  <authentication-managed-identity resource="https://mybackend.azurewebsites.net" />
</inbound>

<!-- Mock response for unimplemented operations -->
<inbound>
  <base />
  <mock-response status-code="200" content-type="application/json" />
</inbound>
<!-- Returns the example response from the OpenAPI spec — no backend call -->`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Applying the validate-jwt policy in the outbound section instead of inbound',
      wrong: `<outbound><validate-jwt .../></outbound>  <!-- Backend already called — too late to reject -->`,
      right: `<inbound><validate-jwt .../></inbound>  <!-- Reject unauthenticated requests before backend -->`,
      explanation: 'The inbound section runs before the request is forwarded to the backend. Placing validate-jwt in outbound means APIM already called the backend before checking authentication — wasting a backend call and potentially leaking data. Always put authentication policies (validate-jwt, check-header, ip-filter) in the inbound section.'
    },
    {
      title: 'Forgetting <base /> in a child scope policy — parent policies are skipped',
      wrong: `<inbound>
  <rate-limit-by-key calls="10" renewal-period="60" counter-key="@(context.Subscription.Id)" />
  <!-- No <base /> — global and product-level policies are bypassed -->
</inbound>`,
      right: `<inbound>
  <base />  <!-- Apply parent scope policies first -->
  <rate-limit-by-key calls="10" renewal-period="60" counter-key="@(context.Subscription.Id)" />
</inbound>`,
      explanation: '<base /> instructs APIM to execute the parent scope\'s policies at that point in the child policy. Without <base />, all parent-scope policies (global, product) are completely skipped for this API or operation — including authentication, logging, and other security policies defined globally. Always include <base /> unless you explicitly intend to override all parent policies.'
    },
    {
      title: 'Using rate-limit instead of rate-limit-by-key for per-subscriber throttling',
      wrong: `<rate-limit calls="100" renewal-period="60" />  <!-- Total across ALL callers — one busy caller exhausts everyone -->`,
      right: `<rate-limit-by-key calls="100" renewal-period="60" counter-key="@(context.Subscription.Id)" />`,
      explanation: 'rate-limit sets a total limit across all callers combined. If one subscriber makes 100 calls, everyone else is throttled — unfair to other subscribers. rate-limit-by-key maintains separate counters per key (subscription ID, IP, custom expression) — each subscriber gets their own independent quota. Always use rate-limit-by-key for per-consumer throttling.'
    },
    {
      title: 'Not configuring mock-response for operations during parallel development',
      wrong: `# Backend not ready — frontend team blocked waiting for API`,
      right: `<inbound><base /><mock-response status-code="200" content-type="application/json" /></inbound>`,
      explanation: 'mock-response returns the example response from the OpenAPI specification without calling the backend. Frontend teams can develop against APIM immediately, even before the backend is ready. Define good examples in your OpenAPI spec (including error responses) and add mock-response policies during parallel development. Remove them once the backend is live.'
    },
  ];

  challenge: Challenge = {
    title: 'API rate limiter (sliding window)',
    language: 'typescript',
    description: 'Implement a sliding window rate limiter (like APIM\'s rate-limit-by-key).\n\nWrite RateLimiter class:\n- constructor(limit: number, windowMs: number)\n- isAllowed(clientId: string): boolean — returns true if the client is within limit; false if exceeded\n\nUse a sliding window: count requests in the last windowMs milliseconds.',
    hints: [
      'Store per-client timestamps in a Map<string, number[]>',
      'On each call, filter out timestamps older than Date.now() - windowMs',
      'If remaining timestamps < limit, add current timestamp and return true',
      'Otherwise return false',
    ],
    starterCode: `export class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(private limit: number, private windowMs: number) {}

  isAllowed(clientId: string): boolean {
    return true;
  }
}`,
    solution: `export class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(private limit: number, private windowMs: number) {}

  isAllowed(clientId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = (this.requests.get(clientId) ?? []).filter(t => t > windowStart);
    if (timestamps.length >= this.limit) return false;
    timestamps.push(now);
    this.requests.set(clientId, timestamps);
    return true;
  }
}

const limiter = new RateLimiter(3, 1000); // 3 requests per second
console.log(limiter.isAllowed('sub-123')); // true
console.log(limiter.isAllowed('sub-123')); // true
console.log(limiter.isAllowed('sub-123')); // true
console.log(limiter.isAllowed('sub-123')); // false (limit reached)
console.log(limiter.isAllowed('sub-456')); // true (different client)`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In what order does APIM execute policy sections for a request?',
      options: [
        'Backend → Inbound → Outbound → On-Error',
        'Inbound → Backend → Outbound (On-Error if any section throws)',
        'Outbound → Inbound → Backend → On-Error',
        'All sections execute simultaneously'
      ],
      answer: 1,
      explanation: 'APIM executes: Inbound (transform/authenticate request before forwarding) → Backend (forward to upstream service) → Outbound (transform response before returning to client) → On-Error (if any section throws an exception). If authentication fails in Inbound, the pipeline short-circuits to On-Error and the Backend section is never reached.'
    },
    {
      q: 'What is the difference between rate-limit-by-key and quota-by-key?',
      options: [
        'rate-limit-by-key is for subscriptions; quota-by-key is for users',
        'rate-limit-by-key throttles per unit of time (calls/second); quota-by-key limits total calls over a longer period (calls/month)',
        'quota-by-key is deprecated; rate-limit-by-key is the modern replacement',
        'They are identical — different names for the same policy'
      ],
      answer: 1,
      explanation: 'rate-limit-by-key enforces a rate (e.g., 100 calls per 60 seconds) — it is a burst throttle. quota-by-key enforces a total count over a longer period (e.g., 10,000 calls per month) — it is a usage cap. Use both together: rate-limit-by-key to prevent burst abuse, quota-by-key to enforce monthly usage tiers for billing/plans.'
    },
    {
      q: 'What does the <base /> element do in an APIM policy?',
      options: [
        'Resets the request to its original state before any policy ran',
        'Instructs APIM to execute parent-scope policies at that point in the child policy',
        'Forwards the request to the base URL of the backend',
        'Sets the base URL for all policy expressions in that scope'
      ],
      answer: 1,
      explanation: '<base /> is a policy placeholder that, at runtime, is replaced by the policies defined in the parent scope (global → product → API → operation). Without <base /> in a child policy, all parent-scope policies are bypassed entirely. Place <base /> to control where parent policies execute relative to the child\'s own policies.'
    },
    {
      q: 'What is an API Revision in APIM?',
      options: [
        'A versioned snapshot of the API definition (v1, v2) with different base paths',
        'A non-breaking change to an API that can be tested without impacting current callers; promoted to current when ready',
        'A backup of the APIM configuration for disaster recovery',
        'A rollback mechanism that reverts the API to a previous state'
      ],
      answer: 1,
      explanation: 'Revisions let you make and test changes to an existing API without affecting current callers. All revisions share the same subscription keys. Callers can access a specific revision with ?api-version=;rev=2 for testing. When the revision is ready, mark it as the current revision — no URL or key changes needed for callers. Use revisions for non-breaking changes; use API Versions for breaking changes.'
    },
    {
      q: 'How does the validate-jwt policy protect backend APIs?',
      options: [
        'It encrypts the JWT payload before forwarding to the backend',
        'It validates the JWT signature, issuer, audience, and claims — rejecting invalid tokens with 401 before the backend is called',
        'It issues new JWT tokens on behalf of the client',
        'It stores JWT tokens in APIM\'s cache to reduce Entra ID calls'
      ],
      answer: 1,
      explanation: 'validate-jwt runs in the inbound section and verifies: JWT signature (against signing keys fetched from the OIDC well-known endpoint), expiry (exp claim), issuer (iss must match), audience (aud must match), and any required-claims. If validation fails, APIM returns 401 immediately — the backend is never called. This offloads authentication from every individual backend service to a single APIM policy.'
    },
    {
      q: 'What is the purpose of an APIM policy and where in the request pipeline can they be applied?',
      options: [
        'Policies only apply to responses, not requests',
        'Policies are XML rules applied in inbound, backend, outbound, and on-error scopes to transform, validate, throttle, or augment API traffic',
        'Policies replace the backend API entirely',
        'Policies only apply at the product level, not per-operation',
      ],
      answer: 1,
      explanation: 'APIM policies are XML-based transformation rules applied at four pipeline stages: inbound (before the backend — add headers, validate JWT, rate-limit), backend (control backend call — retry, circuit break), outbound (transform response — strip headers, set-body, mock-response), and on-error (handle pipeline failures). Apply at global, product, API, or operation scope — narrower scope overrides broader. Use policies for cross-cutting concerns without touching the backend code.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use APIM vs Azure Front Door as an API gateway?',
      a: '<strong>Azure API Management</strong>: full-featured API gateway — policy engine, developer portal, subscription keys, API versioning/revisions, OpenAPI import, request/response transformation, and backend load balancing. The right choice when you need to expose, document, and manage multiple APIs for internal or external developers. <strong>Azure Front Door</strong>: global CDN + WAF + L7 routing. Primarily for web applications and static assets. No subscription management, no developer portal, no policy pipeline. For REST APIs needing WAF, rate limiting, and global routing with low latency, Front Door + APIM is a common combination: Front Door handles DDoS/WAF/CDN at the edge, APIM handles per-API security and transformation.'
    },
    {
      q: 'How does APIM connect to backends in a private VNet?',
      a: 'For backends in a VNet: (1) <strong>External VNet mode</strong> (Standard/Premium): APIM gateway is accessible from the internet, but can reach VNet-internal backends. (2) <strong>Internal VNet mode</strong> (Premium): APIM gateway is only accessible from within the VNet — fully private. (3) <strong>Private Endpoint for APIM</strong>: connect to APIM via Private Endpoint from within a VNet without exposing APIM to the internet. (4) <strong>Self-hosted gateway</strong>: deploy a containerised APIM gateway inside the VNet — it proxies to backends and reports to the cloud APIM management plane. Use self-hosted for on-premises backend connectivity.'
    },
    {
      q: 'What is the send-request policy and what are its use cases?',
      a: 'The <strong>send-request</strong> policy makes an outbound HTTP call from within an APIM policy and stores the response in a context variable. Use cases: (1) <strong>Lookup enrichment</strong>: fetch user permissions from an identity service before forwarding the main request. (2) <strong>Blocklist check</strong>: query a fraud detection API and reject if flagged. (3) <strong>OAuth token exchange</strong>: fetch a backend access token using client credentials and add it as a header. (4) <strong>Aggregation</strong>: combine responses from multiple backends before returning to the client (requires careful use with return-response). The additional HTTP call adds latency — cache results where possible using the cache-store-value and cache-lookup-value policies.'
    },
    {
      q: 'How do you handle API versioning in APIM?',
      a: 'APIM supports three versioning schemes: (1) <strong>Path-based</strong>: /v1/orders, /v2/orders — clear, widely used, requires backend URL mapping. (2) <strong>Header-based</strong>: api-version: 2024-01-01 header — clean URL but less discoverable. (3) <strong>Query-based</strong>: ?api-version=2024-01-01 — easy for testing with browsers. Configure a Version Set in APIM to group versions of the same API for clean Developer Portal presentation. Each version can point to a different backend URL or the same backend with the version forwarded as a header/path. Use Revisions for non-breaking changes within a version; use new API versions for breaking changes.'
    },
    {
      q: 'How do you implement backend circuit breaking in APIM?',
      a: 'APIM (2023+) has a native <strong>circuit-breaker policy</strong> on backend entities: configure trip conditions (e.g., 5xx responses or latency > threshold) and a break duration (e.g., 30 seconds). When the circuit trips, APIM returns 503 immediately without calling the backend — giving it time to recover. Before the native circuit breaker, teams used: (1) <strong>retry policy</strong> with exponential back-off for transient errors. (2) <strong>Multiple backends</strong> with APIM\'s load balancer: route to a secondary backend when the primary fails. (3) <strong>send-request</strong> + conditional forwarding: check a health endpoint before routing. The native circuit-breaker policy is the simplest modern approach.'
    },
    {
      q: 'How do you secure an API in APIM so only authorised clients can call it?',
      a: 'Options include: (1) subscription keys via Ocp-Apim-Subscription-Key header; (2) OAuth 2.0 via the validate-jwt policy; (3) mutual TLS client certificate validation; (4) IP filtering in inbound policy. For internal APIs, also restrict to VNet or Private Link to prevent public internet access.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure API Management is a full-featured API gateway — policy pipeline (validate-jwt, rate-limit-by-key, cache), Developer Portal, Products/Subscriptions, API versioning, and transformations between clients and backends.',
    mustKnow: [
      'Policy pipeline order: Inbound → Backend → Outbound → On-Error. Always put auth (validate-jwt) in Inbound',
      '<base /> inherits parent scope policies — omitting it bypasses global/product policies entirely',
      'rate-limit-by-key: per-client burst throttle (calls/period); quota-by-key: total calls over longer period',
      'Revisions: test non-breaking changes without impacting callers; Versions: new API contract (breaking changes)',
      'Developer Portal: auto-generated API docs, try-it-out console, subscription key management',
      'validate-jwt: validates signature, issuer, audience, claims in Inbound — backend never called if invalid',
    ],
    interviewFocus: [
      'Explain the APIM policy pipeline and the four sections',
      'What is the difference between rate-limit-by-key and quota-by-key?',
      'How does validate-jwt protect backend APIs and where should it be placed?',
      'What is the difference between API Revisions and API Versions in APIM?',
    ],
  };
}
