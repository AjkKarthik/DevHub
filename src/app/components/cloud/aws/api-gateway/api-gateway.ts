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
  selector: 'app-aws-api-gateway',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './api-gateway.html',
  styleUrl: './api-gateway.scss'
})
export class AwsApiGateway {

  quickRef: QuickRefItem[] = [
    { name: 'REST API', type: 'keyword', desc: 'Full-featured API type: request/response transformation, caching, API keys, usage plans, custom authorisers.' },
    { name: 'HTTP API', type: 'keyword', desc: 'Lightweight, 70% cheaper than REST API — supports JWT authorisers and Lambda proxy; no request transformation.' },
    { name: 'WebSocket API', type: 'keyword', desc: 'Persistent bidirectional connections; routes on JSON message fields; backend via Lambda or HTTP integration.' },
    { name: 'Lambda Authoriser', type: 'keyword', desc: 'Lambda function that validates a token/request and returns an IAM policy; result cached by TTL.' },
    { name: 'JWT Authoriser', type: 'keyword', desc: 'HTTP API only — validates JWT against JWKS URI (Cognito, Auth0, Okta) without a custom Lambda.' },
    { name: 'Stage', type: 'keyword', desc: 'Deployment snapshot; each stage has its own URL, throttle limits, logging, and stage variables.' },
    { name: 'Usage Plan', type: 'keyword', desc: 'REST API only — associates API keys with throttle (req/s) and quota (req/day) limits per stage.' },
    { name: 'VPC Link', type: 'keyword', desc: 'Routes API Gateway traffic to private resources in a VPC via a Network Load Balancer.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'REST vs HTTP vs WebSocket API',
      points: [
        'REST API: launched 2010, full feature set — request/response mapping templates, caching, WAF integration, X-Ray, resource policies, usage plans.',
        'HTTP API: launched 2019, simpler and ~70% cheaper — JWT authorisers, Lambda proxy, auto-deploy, but no request transformation or caching.',
        'WebSocket API: maintains persistent connections; routes messages to different Lambdas based on JSON field (routeSelectionExpression).',
        'Choose HTTP API for new Lambda/HTTP backends unless you need caching, transformations, or API key quotas.',
        'REST API required for: VTL mapping templates, response caching, AWS WAF integration, usage plans with API keys.',
        'All types support: custom domain names, CloudWatch logging, throttling, IAM authentication.',
      ]
    },
    {
      heading: 'Routes & Integrations',
      points: [
        'Route = HTTP method + path (e.g. GET /users/{id}). Catch-all: ANY /{proxy+}.',
        'Lambda proxy integration: API Gateway passes full event object to Lambda and returns function response as HTTP response.',
        'HTTP integration: API Gateway forwards request to an HTTP backend URL (internal or external).',
        'AWS service integration: REST API can call SQS, DynamoDB, Kinesis directly without a Lambda intermediary.',
        'Mock integration: returns hardcoded response — useful for CORS preflight or prototype stubs.',
        'Private integration: routes to resources inside a VPC via VPC Link + NLB (REST) or ALB (HTTP API).',
      ]
    },
    {
      heading: 'Authorisation',
      points: [
        'IAM auth: request signed with SigV4; use for service-to-service calls where AWS credentials are available.',
        'Lambda authoriser (token type): extracts bearer token from header, calls Lambda, caches policy by token for configurable TTL.',
        'Lambda authoriser (request type): receives full request context; can authorize on query params, headers, stage variables.',
        'JWT authoriser (HTTP API only): validates JWT signature against JWKS endpoint; no Lambda needed — faster and cheaper.',
        'Cognito user pools: REST API has native Cognito authoriser; HTTP API uses JWT authoriser pointed at Cognito JWKS URI.',
        'Resource policy: REST API — IP whitelist/blacklist or cross-account access; evaluated before authoriser.',
      ]
    },
    {
      heading: 'Throttling, Caching & Stages',
      points: [
        'Account-level default: 10,000 req/s, burst 5,000 — shared across all APIs in the region.',
        'Stage-level throttle overrides per method (REST API); set lower limits to protect backends.',
        'Usage plans (REST API): API key + plan = throttle (req/s) + quota (req/day or month) per stage.',
        'Response caching (REST API only): cache at stage or method level; TTL 0-3600s; cache key includes query string and headers.',
        'Stage variables: key-value pairs injected at deploy time — use to point to different Lambda aliases per environment.',
        'Canary deployments: REST API — route X% traffic to canary stage version while stable serves the rest.',
      ]
    },
    {
      heading: 'Custom Domains, CORS & VPC Link',
      points: [
        'Custom domain: create ACM certificate in us-east-1 (edge-optimised) or the API region (regional); map to base path.',
        'Edge-optimised endpoint: traffic routes through CloudFront globally; lower latency for geographically distributed clients.',
        'Regional endpoint: deployed in one region; pair with Route 53 latency-based routing for multi-region active-active.',
        'CORS: for Lambda proxy, the Lambda must return Access-Control-Allow-* headers; API Gateway does not add them automatically in proxy mode.',
        'HTTP API CORS: configure at the API level — API Gateway injects headers automatically without Lambda involvement.',
        'VPC Link (REST): NLB in private subnet; API Gateway calls NLB DNS; NLB routes to EC2, ECS, or other targets.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Create & Deploy API',
      language: 'bash',
      code: `# Create an HTTP API with Lambda integration
aws apigatewayv2 create-api \\
  --name my-http-api \\
  --protocol-type HTTP \\
  --target arn:aws:lambda:us-east-1:123456789012:function:my-api

# List APIs
aws apigatewayv2 get-apis

# Create a route on an existing HTTP API
aws apigatewayv2 create-route \\
  --api-id abc123 \\
  --route-key "GET /users/{id}"

# Create a stage with auto-deploy
aws apigatewayv2 create-stage \\
  --api-id abc123 \\
  --stage-name prod \\
  --auto-deploy

# Get the invoke URL
aws apigatewayv2 get-api --api-id abc123 \\
  --query 'ApiEndpoint' --output text

# Deploy a REST API (manual deploy required for REST)
aws apigateway create-deployment \\
  --rest-api-id xyz789 \\
  --stage-name prod`,
    },
    {
      label: 'Authorisers',
      language: 'bash',
      code: `# JWT authoriser — HTTP API with Cognito
aws apigatewayv2 create-authorizer \\
  --api-id abc123 \\
  --name cognito-jwt \\
  --authorizer-type JWT \\
  --identity-source '$request.header.Authorization' \\
  --jwt-configuration \\
    Audience=4oj2abc123,Issuer=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ABC

# Attach JWT authoriser to a route
aws apigatewayv2 update-route \\
  --api-id abc123 \\
  --route-id route123 \\
  --authorization-type JWT \\
  --authorizer-id auth456

# Lambda authoriser — REST API (token type)
aws apigateway create-authorizer \\
  --rest-api-id xyz789 \\
  --name token-auth \\
  --type TOKEN \\
  --authorizer-uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123:function:my-auth/invocations \\
  --identity-source 'method.request.header.Authorization' \\
  --authorizer-result-ttl-in-seconds 300

# Grant API Gateway permission to invoke the authoriser Lambda
aws lambda add-permission \\
  --function-name my-auth \\
  --statement-id apigateway-auth \\
  --action lambda:InvokeFunction \\
  --principal apigateway.amazonaws.com`,
    },
    {
      label: 'Throttling & Caching',
      language: 'bash',
      code: `# Stage-level throttle (REST API)
aws apigateway update-stage \\
  --rest-api-id xyz789 \\
  --stage-name prod \\
  --patch-operations \\
    op=replace,path=/defaultRouteSettings/throttlingRateLimit,value=1000 \\
    op=replace,path=/defaultRouteSettings/throttlingBurstLimit,value=2000

# Per-method throttle override (REST API)
aws apigateway update-stage \\
  --rest-api-id xyz789 \\
  --stage-name prod \\
  --patch-operations \\
    op=replace,path=/~1users~1{id}/GET/throttling/rateLimit,value=100

# Enable response caching on a stage (REST API)
aws apigateway update-stage \\
  --rest-api-id xyz789 \\
  --stage-name prod \\
  --patch-operations \\
    op=replace,path=/cacheClusterEnabled,value=true \\
    op=replace,path=/cacheClusterSize,value=0.5

# Usage plan with API key (REST API)
aws apigateway create-usage-plan \\
  --name tier-basic \\
  --throttle "rateLimit=100,burstLimit=200" \\
  --quota "limit=10000,period=MONTH" \\
  --api-stages "apiId=xyz789,stage=prod"

aws apigateway create-api-key --name client-alpha --enabled
# Associate key with usage plan
aws apigateway create-usage-plan-key \\
  --usage-plan-id plan123 --key-id key456 --key-type API_KEY`,
    },
    {
      label: 'Custom Domain & CORS',
      language: 'bash',
      code: `# Create custom domain (regional — certificate in same region)
aws apigatewayv2 create-domain-name \\
  --domain-name api.example.com \\
  --domain-name-configurations \\
    CertificateArn=arn:aws:acm:us-east-1:123:certificate/abc,EndpointType=REGIONAL

# Map the domain to API stage
aws apigatewayv2 create-api-mapping \\
  --domain-name api.example.com \\
  --api-id abc123 \\
  --stage prod \\
  --api-mapping-key v1

# CORS for HTTP API (API Gateway injects headers automatically)
aws apigatewayv2 update-api \\
  --api-id abc123 \\
  --cors-configuration \\
    AllowOrigins=https://myapp.com,AllowMethods=GET,POST,PUT,DELETE,AllowHeaders=Authorization,Content-Type,MaxAge=86400

# For REST API Lambda proxy — Lambda must return headers:
# return {
#   statusCode: 200,
#   headers: {
#     'Access-Control-Allow-Origin': 'https://myapp.com',
#     'Access-Control-Allow-Headers': 'Authorization,Content-Type',
#   },
#   body: JSON.stringify(data),
# };

# Get APIGW endpoint for DNS CNAME
aws apigatewayv2 get-domain-name \\
  --domain-name api.example.com \\
  --query 'DomainNameConfigurations[0].ApiGatewayDomainName' --output text`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Choosing REST API when HTTP API is sufficient',
      wrong: `# REST API created for a simple Lambda proxy backend
# Costs $3.50/million requests vs $1.00/million for HTTP API
# Added complexity: manual deployments, no auto-deploy`,
      right: `# Use HTTP API for Lambda proxy, JWT auth, simple routing
aws apigatewayv2 create-api \\
  --name my-http-api \\
  --protocol-type HTTP \\
  --target arn:aws:lambda:us-east-1:123:function:my-api
# Only upgrade to REST API if you need: caching, WAF, VTL transforms, usage plans`,
      explanation: 'HTTP API is ~70% cheaper and simpler for Lambda proxy use cases. Reach for REST API only when you need its advanced features like response caching, VTL mapping templates, or API key usage plans.'
    },
    {
      title: 'Not handling CORS in Lambda proxy responses',
      wrong: `// Lambda handler — no CORS headers
exports.handler = async (event) => ({
  statusCode: 200,
  body: JSON.stringify({ data: 'hello' }),
});
// Browser: "No 'Access-Control-Allow-Origin' header is present"`,
      right: `exports.handler = async (event) => ({
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': 'https://myapp.com',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  },
  body: JSON.stringify({ data: 'hello' }),
});
// HTTP API: configure CORS at API level (no Lambda changes needed)`,
      explanation: 'With Lambda proxy integration (REST API), API Gateway passes headers through unchanged — the Lambda must return CORS headers. HTTP API has a CORS configuration at the API level that injects headers automatically.'
    },
    {
      title: 'Setting Lambda authoriser TTL to 0 under high traffic',
      wrong: `# Lambda authoriser with TTL=0 (no caching)
# Every request calls the authoriser Lambda
# At 1000 req/s: 86 million Lambda invocations/day
# Doubles Lambda cost, adds 50-200ms to every request`,
      right: `aws apigateway create-authorizer \\
  --rest-api-id xyz789 \\
  --name token-auth \\
  --type TOKEN \\
  --authorizer-result-ttl-in-seconds 300
# TTL=300s: same token reuses cached IAM policy for 5 minutes
# JWTs: validate exp claim in Lambda before caching`,
      explanation: 'A TTL of 0 disables caching — every request invokes the authoriser Lambda. Set TTL to 300s (5 minutes) for most token-based auth. Validate token expiry in the Lambda so stale tokens still fail.'
    },
    {
      title: 'Not configuring stage throttle limits',
      wrong: `# No throttle limits configured on the prod stage
# A DDoS or runaway client sends 50,000 req/s
# Downstream Lambda and RDS overwhelmed, service down`,
      right: `aws apigateway update-stage \\
  --rest-api-id xyz789 \\
  --stage-name prod \\
  --patch-operations \\
    op=replace,path=/defaultRouteSettings/throttlingRateLimit,value=2000 \\
    op=replace,path=/defaultRouteSettings/throttlingBurstLimit,value=5000
# Also set per-method overrides for expensive endpoints
# Add WAF to block abusive IPs at the edge`,
      explanation: 'Without stage throttle limits, one client can exhaust your backend. The account-level 10,000 req/s default applies only when no stage limits are set. Always configure explicit limits per stage and per expensive endpoint.'
    },
    {
      title: 'Forgetting to grant Lambda invoke permission to API Gateway',
      wrong: `# API created with Lambda integration
# Error: "Internal Server Error" or "Execution failed"
# CloudWatch shows: "User: ... is not authorized to perform: lambda:InvokeFunction"`,
      right: `aws lambda add-permission \\
  --function-name my-api-handler \\
  --statement-id apigw-invoke \\
  --action lambda:InvokeFunction \\
  --principal apigateway.amazonaws.com \\
  --source-arn "arn:aws:execute-api:us-east-1:123456789012:abc123/*/GET/users"
# source-arn restricts to specific API/stage/method
# Without source-arn: any APIGW in the account can invoke`,
      explanation: 'API Gateway needs explicit lambda:InvokeFunction permission on the function. The AWS Console adds this automatically; CLI/CDK/Terraform require it explicitly. Scope the source ARN to your specific API to follow least privilege.'
    },
  ];

  challenge: Challenge = {
    title: 'Build a Serverless CRUD API',
    language: 'typescript',
    description: `Design a serverless REST API using API Gateway + Lambda + DynamoDB:
1. HTTP API with routes: GET /items, POST /items, GET /items/{id}, DELETE /items/{id}
2. JWT authoriser using a Cognito User Pool (all routes protected)
3. Lambda proxy integration — single Lambda handler with routing logic
4. DynamoDB table "Items" with PK=itemId
5. Proper CORS configuration for https://myapp.com

Describe: the HTTP API configuration, the Lambda handler routing pattern, and the IAM execution role permissions.`,
    hints: [
      'HTTP API + Lambda proxy: set --target to Lambda ARN on creation for catch-all route',
      'JWT authoriser: --jwt-configuration Issuer=<cognito-pool-url> Audience=<client-id>',
      'Lambda handler: route on event.requestContext.http.method + event.rawPath',
      'Execution role needs: dynamodb:GetItem, PutItem, DeleteItem, Scan on the Items table',
      'HTTP API CORS: set at API level with aws apigatewayv2 update-api --cors-configuration',
    ],
    starterCode: `// Serverless CRUD API

// HTTP API routes:
// GET    /items       → list all items
// POST   /items       → create item
// GET    /items/{id}  → get single item
// DELETE /items/{id}  → delete item

// Lambda handler (TypeScript pseudocode)
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  const path = event.rawPath;
  const id = event.pathParameters?.id;

  // TODO: route GET /items
  // TODO: route POST /items
  // TODO: route GET /items/{id}
  // TODO: route DELETE /items/{id}

  return { statusCode: 404, body: JSON.stringify({ message: 'Not found' }) };
};

// TODO: define CORS configuration (allowed origins, methods, headers)
// TODO: define JWT authoriser (Cognito issuer URL + audience)
// TODO: define execution role IAM policy
`,
    solution: `import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

const ok = (body: unknown) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  const id = event.pathParameters?.id;

  if (method === 'GET' && !id) {
    const { Items } = await doc.send(new ScanCommand({ TableName: TABLE }));
    return ok({ items: Items ?? [] });
  }

  if (method === 'POST') {
    const item = { ...JSON.parse(event.body ?? '{}'), itemId: randomUUID() };
    await doc.send(new PutCommand({ TableName: TABLE, Item: item }));
    return { statusCode: 201, body: JSON.stringify(item) };
  }

  if (method === 'GET' && id) {
    const { Item } = await doc.send(new GetCommand({ TableName: TABLE, Key: { itemId: id } }));
    return Item ? ok(Item) : { statusCode: 404, body: JSON.stringify({ message: 'Not found' }) };
  }

  if (method === 'DELETE' && id) {
    await doc.send(new DeleteCommand({ TableName: TABLE, Key: { itemId: id } }));
    return { statusCode: 204, body: '' };
  }

  return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
};

// CORS configuration (HTTP API level):
// AllowOrigins: ["https://myapp.com"]
// AllowMethods: ["GET","POST","DELETE","OPTIONS"]
// AllowHeaders: ["Authorization","Content-Type"]
// MaxAge: 86400

// JWT authoriser:
// Issuer: https://cognito-idp.us-east-1.amazonaws.com/us-east-1_POOL_ID
// Audience: [COGNITO_CLIENT_ID]

// Execution role (minimum):
// dynamodb:Scan, GetItem, PutItem, DeleteItem
// Resource: arn:aws:dynamodb:us-east-1:123:table/Items`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'You need JWT authentication, Lambda proxy integration, and auto-deploy. Which API Gateway type should you choose?',
      options: ['REST API', 'HTTP API', 'WebSocket API', 'Private API'],
      answer: 1,
      explanation: 'HTTP API supports JWT authorisers natively, Lambda proxy integration, and auto-deploy stages. It is ~70% cheaper than REST API. REST API lacks auto-deploy and requires more manual setup for JWT auth.',
    },
    {
      q: 'A Lambda authoriser is being called on every request even though the token is valid for 5 minutes. What is misconfigured?',
      options: [
        'The Lambda function is not returning an IAM policy',
        'The authoriser TTL is set to 0',
        'The identity source is wrong',
        'The Lambda does not have invoke permission',
      ],
      answer: 1,
      explanation: 'A TTL of 0 disables authoriser caching. Every request invokes the Lambda. Set TTL to 300 seconds to cache the IAM policy for 5 minutes, drastically reducing authoriser invocations.',
    },
    {
      q: 'Your REST API returns "No Access-Control-Allow-Origin header" errors in the browser even though you configured CORS on the API. What is the likely cause?',
      options: [
        'CORS is only supported on HTTP API, not REST API',
        'The Lambda proxy integration requires the Lambda to return CORS headers itself',
        'The stage was not deployed after enabling CORS',
        'Custom domain names do not support CORS',
      ],
      answer: 1,
      explanation: 'With Lambda proxy integration on REST API, API Gateway passes responses through unchanged. The Lambda function must include Access-Control-Allow-Origin and other CORS headers in its response. API Gateway does not inject them automatically in proxy mode.',
    },
    {
      q: 'Which API Gateway type supports WebSocket (persistent bidirectional) connections?',
      options: ['REST API', 'HTTP API', 'WebSocket API', 'Both REST and HTTP API'],
      answer: 2,
      explanation: 'WebSocket API is a distinct API Gateway type designed for persistent bidirectional connections. REST and HTTP APIs are request-response only. WebSocket API routes messages to different backends based on a routeSelectionExpression field in the JSON message.',
    },
    {
      q: 'How do usage plans with API keys work in API Gateway?',
      options: [
        'Available on both REST API and HTTP API',
        'REST API only — throttle (req/s) + quota (req/month) per API key',
        'HTTP API only — JWT claims define the quota',
        'Quota is enforced at the Lambda level, not API Gateway',
      ],
      answer: 1,
      explanation: 'Usage plans are a REST API feature. A usage plan associates one or more API keys with throttle limits (requests per second) and quotas (requests per day/month) for specific API stages. HTTP API does not support usage plans.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I choose REST API over HTTP API?',
      a: 'Choose REST API when you need: (1) response caching to reduce Lambda invocations, (2) VTL mapping templates to transform request/response payloads without Lambda, (3) usage plans and API keys for monetisation or per-client rate limiting, (4) AWS WAF integration for DDoS protection at the API layer, (5) resource policies for IP whitelisting or cross-account access, or (6) canary deployments with traffic shifting. For everything else — Lambda proxy, JWT auth, simple routing — use HTTP API at ~70% lower cost.',
    },
    {
      q: 'How does API Gateway handle backend timeouts?',
      a: 'API Gateway has a maximum integration timeout of 29 seconds for REST and HTTP APIs (edge-optimised: 29s, regional: 29s). If your Lambda runs longer, API Gateway returns HTTP 504 to the client even though the Lambda continues running. For long-running operations (> 29s), use an async pattern: API Gateway → Lambda queues the task to SQS → returns 202 Accepted → client polls a status endpoint or receives a WebSocket/SNS notification when complete.',
    },
    {
      q: 'What is the difference between edge-optimised and regional endpoints?',
      a: 'Edge-optimised endpoints route traffic through AWS CloudFront points of presence globally — best for geographically distributed public clients as the TLS termination happens at the nearest edge location. Regional endpoints deploy the API in a single AWS region — better for clients in the same region (lower latency, no CloudFront hop) and for multi-region active-active setups with Route 53 latency-based routing. Private endpoints are only accessible within a VPC via an interface endpoint.',
    },
    {
      q: 'How do stage variables work and why are they useful?',
      a: 'Stage variables are key-value pairs defined per stage and injected into the integration URI, Lambda ARN, or authoriser. A common pattern: point the integration to arn:aws:lambda:us-east-1:123:function:my-api:${stageVariables.lambdaAlias}, then set lambdaAlias=dev on the dev stage and lambdaAlias=prod on the prod stage. This lets one API definition point to different Lambda versions/aliases per environment without duplicating routes.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'API Gateway is the front door for serverless APIs — choose HTTP API for simplicity and cost, REST API for caching/transformations, and WebSocket API for real-time bidirectional messaging.',
    mustKnow: [
      'REST vs HTTP API: HTTP is 70% cheaper; REST adds caching, VTL transforms, WAF, usage plans',
      'Lambda authoriser: validates tokens in Lambda, caches IAM policy by TTL; set TTL > 0 under load',
      'JWT authoriser: HTTP API only — validates against JWKS URI without a Lambda',
      'CORS with Lambda proxy (REST API): Lambda must return CORS headers — API Gateway does not add them',
      'Integration timeout: 29 seconds maximum — use async SQS pattern for long-running operations',
      'Usage plans + API keys: REST API only — throttle (req/s) and quota (req/month) per client',
    ],
    interviewFocus: [
      'REST vs HTTP API trade-offs: when does cost saving of HTTP API justify switching?',
      'CORS gotcha with Lambda proxy: explain why browser errors occur and how to fix',
      'Lambda authoriser caching: TTL impact on cost vs security (stale token window)',
      '29-second timeout limitation and the async pattern workaround for long operations',
    ],
  };
}
