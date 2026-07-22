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
  templateUrl: './authorizer-cache-applies-to-every-resource-not-just-one.html',
  styleUrl: './authorizer-cache-applies-to-every-resource-not-just-one.scss'
})
export class AuthorizerCacheAppliesToEveryResourceNotJustOneSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own caching mistake entry frames "one token → one cached policy" — never what the cached policy actually covers',
      points: [
        'The main page\'s own quickRef states: "Lambda Authoriser: Lambda function that validates a token/request and returns an IAM policy; result cached by TTL." The main page\'s own mistake entry ("Setting Lambda authoriser TTL to 0 under high traffic") reinforces this framing: "TTL=300s: same token reuses cached IAM policy for 5 minutes" — describing caching purely in terms of the TOKEN, never mentioning what the policy\'s own Resource scope covers.',
        'Every authoriser example on the main page — the code tab, the mistake entry, the challenge — uses `--type TOKEN` exclusively. The word "REQUEST" appears once in the theory ("Lambda authoriser (request type): receives full request context...") but is never used in a runnable example, and AWS\'s own current recommendation for which type to use is never mentioned at all.',
      ]
    },
    {
      heading: 'A cached policy is reused for ANY request matching the cache key, regardless of which resource/method generated it — and AWS explicitly warns about this',
      points: [
        'Per AWS\'s own documentation on the authorization workflow: "If you enable authorization caching, API Gateway caches the policy so that the Lambda authorizer function isn\'t invoked again. Ensure that your policy is applicable to all resources and methods across your API." This is a direct warning that a policy scoped too narrowly (e.g. to just the one method/resource ARN that triggered the original invocation) can be incorrectly reused — and misapplied — against a DIFFERENT route called with the same cache key inside the TTL window.',
        'For a TOKEN authoriser, AWS confirms this reuse is keyed on a single identity source (the token itself) — the SAME token calling two completely different routes within the TTL window can receive the SAME cached policy, whatever Resource scope it happened to be generated with.',
        'A REQUEST authoriser behaves differently: "When multiple identity sources are defined, they are all used to derive the authorizer\'s cache key, with the order preserved. You can define a fine-grained cache key by using multiple identity sources." AWS also documents a fail-safe REQUEST authorisers get for free: "API Gateway verifies that all specified identity sources are present in the request. If a specified identity source is missing, null, or empty, API Gateway returns a 401 Unauthorized HTTP response without calling the Lambda authorizer function."',
        'AWS states its own current recommendation directly, contradicting the main page\'s TOKEN-only examples: "We recommend that you use a REQUEST authorizer to control access to your API. You can control access to your API based on multiple identity sources when using a REQUEST authorizer, compared to a single identity source when using a TOKEN authorizer. In addition, you can separate cache keys using multiple identity sources for a REQUEST authorizer."',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing cross-route policy reuse on the main page\'s own TOKEN example',
      language: 'bash',
      code: `# The main page's own CLI example, unchanged -- a TOKEN authoriser
# on a REST API with a 300-second cache:
aws apigateway create-authorizer \\
  --rest-api-id xyz789 \\
  --name token-auth \\
  --type TOKEN \\
  --authorizer-uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123:function:my-auth/invocations \\
  --identity-source 'method.request.header.Authorization' \\
  --authorizer-result-ttl-in-seconds 300

# Say the Lambda authoriser returns a policy scoped ONLY to the
# method it was first invoked for -- a reasonable-looking
# least-privilege choice:
# {
#   "Effect": "Allow",
#   "Action": "execute-api:Invoke",
#   "Resource": "arn:aws:execute-api:us-east-1:123:xyz789/prod/GET/users/*"
# }

# Call 1: GET /users/42 with token "abc" -- authoriser invoked,
# returns the policy above, cached against token "abc" for 300s.
curl -H "Authorization: abc" https://xyz789.execute-api.us-east-1.amazonaws.com/prod/users/42
# 200 OK

# Call 2, seconds later: POST /orders with the SAME token "abc" --
# per AWS's own docs, the CACHED policy is reused -- no new
# authoriser invocation. But that cached policy's Resource only
# covers GET /users/*, not POST /orders:
curl -X POST -H "Authorization: abc" https://xyz789.execute-api.us-east-1.amazonaws.com/prod/orders
# 403 Forbidden -- even though "abc" is a perfectly valid token
# that SHOULD be allowed to POST /orders, per whatever the
# authoriser Lambda's own logic actually intends.`,
    },
    {
      label: 'The fix — AWS\'s own two documented options',
      language: 'bash',
      code: `# Option 1: keep TOKEN, but return a wildcarded Resource that
# genuinely covers "all resources and methods across your API",
# per AWS's own explicit recommendation for cached policies:
# {
#   "Effect": "Allow",
#   "Action": "execute-api:Invoke",
#   "Resource": "arn:aws:execute-api:us-east-1:123:xyz789/prod/*/*"
# }
# -- now the SAME cached policy correctly authorizes every route,
# since fine-grained per-route authorization logic lives inside the
# authoriser Lambda's OWN code, not in the IAM policy Resource scope.

# Option 2 -- AWS's own recommended type: switch to REQUEST, using
# multiple identity sources for a properly fine-grained cache key --
# a stale/mismatched policy for a DIFFERENT route+method combination
# is far less likely, since the route itself contributes to the key:
aws apigateway create-authorizer \\
  --rest-api-id xyz789 \\
  --name request-auth \\
  --type REQUEST \\
  --authorizer-uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123:function:my-auth/invocations \\
  --identity-source 'method.request.header.Authorization, context.httpMethod, context.resourcePath' \\
  --authorizer-result-ttl-in-seconds 300
# -- per AWS's own docs, these three identity sources ("with the
# order preserved") together derive the cache key -- the SAME token
# calling a DIFFERENT method+resourcePath combination now produces a
# DIFFERENT cache key, correctly triggering a fresh authoriser
# invocation instead of reusing a mismatched cached policy.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following security best practice, a team\'s Lambda authoriser (TOKEN type, matching the main page\'s own examples) returns an IAM policy scoped to exactly the single method it was invoked for — reasoning that a narrowly-scoped policy is more secure than a broad wildcard. Under normal traffic this works fine. But under load, with the 300-second cache the main page\'s own mistake entry recommends, the team starts seeing intermittent 403 errors on routes that should clearly be authorized for a given valid token. Using this subtopic\'s theory, explain the cause and the two ways to fix it.',
    hint: 'The 403s appear on DIFFERENT routes than whichever one first triggered the authoriser for that token. What does AWS\'s own documentation say a cached policy needs to cover?',
    solution: 'Per this subtopic\'s theory, this is exactly the risk AWS\'s own documentation warns about: "Ensure that your policy is applicable to all resources and methods across your API." Because the authoriser is TOKEN type, its cache key is derived from the token alone — the first route a given token happens to hit gets its narrowly-scoped policy cached, and every OTHER route called with that same token within the 300-second TTL window reuses that same cached policy, even though its Resource ARN only ever covered the first route. Requests to routes not covered by that narrow policy get denied, producing exactly the intermittent 403s described, correlated with cache hits rather than any actual authorization logic failure. Per this subtopic\'s theory, there are two fixes: (1) keep the TOKEN authoriser but return a wildcarded Resource ARN covering the whole API, moving fine-grained per-route logic into the authoriser Lambda\'s own code instead of the cached IAM policy\'s scope; or (2) switch to a REQUEST authoriser with multiple identity sources (including the HTTP method and resource path) so the cache key itself changes per route, matching AWS\'s own stated recommendation to prefer REQUEST authorisers for exactly this kind of fine-grained caching control.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A cached Lambda authoriser policy only ever gets reused for the exact same route/method that originally triggered the Lambda invocation.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states the cache key for a TOKEN authoriser is derived from the token alone — the SAME cached policy is reused for ANY route called with that token inside the TTL window, regardless of which route originally generated it.'
    },
    {
      thought: 'TOKEN and REQUEST Lambda authorisers cache in the same way, just with different names for the same underlying mechanism.',
      reality: 'Per this subtopic\'s theory, they differ meaningfully: TOKEN caches on a single identity source (the token), while REQUEST can combine MULTIPLE identity sources (in order) into one fine-grained cache key — and gets a free 401 short-circuit if any specified identity source is missing.'
    },
    {
      thought: 'Since the main page\'s own examples all use TOKEN-type authorisers, that must be the current AWS-recommended default for new APIs.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states the opposite directly: "We recommend that you use a REQUEST authorizer to control access to your API" — specifically citing multi-source cache keys and finer-grained access control as the reasons.'
    }
  ];
}
