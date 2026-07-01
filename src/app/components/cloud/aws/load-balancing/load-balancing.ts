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
  selector: 'app-aws-load-balancing',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './load-balancing.html',
  styleUrl: './load-balancing.scss'
})
export class AwsLoadBalancing {

  quickRef: QuickRefItem[] = [
    { name: 'ALB (Application LB)', type: 'class', desc: 'Layer 7 — routes HTTP/HTTPS by path, host header, query string, or source IP. Supports WebSocket and HTTP/2.' },
    { name: 'NLB (Network LB)', type: 'class', desc: 'Layer 4 — TCP/UDP/TLS at ultra-low latency; static IPs per AZ; handles millions of requests/second.' },
    { name: 'GLB (Gateway LB)', type: 'class', desc: 'Layer 3/4 — routes traffic through third-party virtual appliances (firewalls, IDS) transparently.' },
    { name: 'Listener', type: 'class', desc: 'Process that checks for connection requests on a protocol/port; forwards to target groups based on rules.' },
    { name: 'Target Group', type: 'class', desc: 'Collection of targets (EC2, ECS tasks, Lambda, IPs) with a health check — receives traffic from a listener rule.' },
    { name: 'Listener Rule', type: 'class', desc: 'Condition + action pair — IF path=/api/* AND host=api.example.com THEN forward to target-group-api.' },
    { name: 'Sticky Sessions', type: 'keyword', desc: 'Session affinity — ALB routes the same client to the same target using a cookie (AWSALB or application-based).' },
    { name: 'Slow Start', type: 'keyword', desc: 'Gradually ramp up traffic to a newly registered target over a configurable duration (30s–900s).' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'ALB — Application Load Balancer',
      points: [
        'ALB operates at Layer 7 (HTTP/HTTPS) — it terminates TLS, reads headers and paths, and routes requests based on content.',
        'Routing rules evaluate conditions in priority order. Conditions include: path-pattern (/api/*), host-header (api.example.com), HTTP method, query string parameters, source IP CIDR, and HTTP headers.',
        'Multiple target groups per ALB: /api/* → backend-tg, /* → frontend-tg, /static/* → Lambda@Edge (via CloudFront). One ALB can serve many microservices.',
        'ALB supports weighted target groups for canary deployments — send 5% of traffic to new-version-tg without changing DNS.',
        'ALB access logs: stored in S3, include request time, client IP, target IP, response code, processing time — invaluable for debugging and audit.',
      ]
    },
    {
      heading: 'NLB — Network Load Balancer',
      points: [
        'NLB operates at Layer 4 (TCP/UDP/TLS) — it does not inspect HTTP headers, making it faster and better suited for latency-sensitive protocols.',
        'Assigns one static Elastic IP per AZ — enables whitelisting a fixed IP at firewalls (not possible with ALB which rotates IPs).',
        'Supports TCP, UDP, TLS (pass-through or terminate), and TCP_UDP protocols. Ideal for: gaming, IoT, financial trading, SIP/VoIP, MQTT.',
        'Preserves source IP by default (unlike ALB which proxies and adds X-Forwarded-For). Target groups with EC2 need security group rules for the client IP range.',
        'NLB can be a target of ALB (chaining) — use case: NLB with static IPs in front, ALB behind for path-based routing to microservices.',
      ]
    },
    {
      heading: 'Target Groups & Health Checks',
      points: [
        'Target types: instance (EC2 by instance ID), ip (ECS tasks, on-prem via Direct Connect), lambda (single Lambda function), or alb (ALB as an NLB target).',
        'Health check settings: protocol (HTTP/HTTPS/TCP), path (for HTTP/S), interval (10–300 s), timeout, healthy threshold (2–10 consecutive successes), unhealthy threshold (2–10 failures).',
        'A target is deregistered from the LB when it fails health checks. Deregistration delay (default 300 s) allows in-flight requests to complete before the connection is closed.',
        'Slow start: gradually increase traffic to new targets over 30–900 s to allow JVM warm-up, connection pool initialisation, or cache warming.',
        'Sticky sessions: AWSALB cookie (duration-based) or application-based cookie — the ALB reads a specific cookie name you define and routes accordingly.',
      ]
    },
    {
      heading: 'HTTPS & TLS Termination',
      points: [
        'ALB terminates HTTPS — upload or select an ACM certificate on the listener. The ALB handles TLS handshake and forwards HTTP to targets (plain HTTP to private targets is fine within the VPC).',
        'ALB supports multiple certificates (SNI) — one listener can serve different certs for different hostnames. Upload additional certs via the certificate list on the listener.',
        'Security policy: AWS defines managed policies (e.g. ELBSecurityPolicy-TLS13-1-2-2021-06) that control TLS protocol versions and cipher suites. Use TLS 1.2+ policies.',
        'NLB TLS termination: NLB can terminate TLS and forward decrypted TCP to targets — useful when targets don\'t need to handle TLS themselves.',
        'End-to-end encryption: configure HTTPS targets in the target group if compliance requires encryption between ALB and EC2 — use a self-signed cert on EC2 (ALB won\'t verify it by default).',
      ]
    },
    {
      heading: 'Cross-Zone Load Balancing & Zonal Isolation',
      points: [
        'Cross-zone load balancing distributes requests evenly across all targets in all enabled AZs — enabled by default for ALB (no charge), disabled by default for NLB (inter-AZ data transfer charge).',
        'Without cross-zone: if AZ-A has 2 targets and AZ-B has 8, each AZ gets 50% of traffic — AZ-A targets receive 5× more load per target.',
        'Zonal isolation (Availability Zone affinity): NLB new feature — routes to targets in the same AZ as the client first, reducing latency and cross-AZ data costs.',
        'ALB is regional (DNS name resolves to IPs in multiple AZs). NLB has per-AZ static IPs — clients connecting to the static IP always hit that AZ\'s NLB node.',
        'ALB idle timeout: default 60 s — increase for long-running connections (WebSockets, server-sent events) up to 4000 s.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ALB Setup',
      language: 'bash',
      code: `# Create ALB (internet-facing)
ALB_ARN=$(aws elbv2 create-load-balancer \\
  --name prod-alb \\
  --type application \\
  --scheme internet-facing \\
  --subnets subnet-public-1a subnet-public-1b \\
  --security-groups sg-alb-0abc123 \\
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# Create target group (for ECS tasks using awsvpc — type ip)
TG_ARN=$(aws elbv2 create-target-group \\
  --name web-tg \\
  --protocol HTTP \\
  --port 8080 \\
  --vpc-id vpc-0abc12345 \\
  --target-type ip \\
  --health-check-protocol HTTP \\
  --health-check-path /health \\
  --health-check-interval-seconds 30 \\
  --healthy-threshold-count 2 \\
  --unhealthy-threshold-count 3 \\
  --query 'TargetGroups[0].TargetGroupArn' --output text)

# Add HTTPS listener with ACM certificate
LISTENER_ARN=$(aws elbv2 create-listener \\
  --load-balancer-arn $ALB_ARN \\
  --protocol HTTPS --port 443 \\
  --certificates CertificateArn=arn:aws:acm:eu-west-1:123:certificate/abc \\
  --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 \\
  --default-actions Type=forward,TargetGroupArn=$TG_ARN \\
  --query 'Listeners[0].ListenerArn' --output text)

# Redirect HTTP to HTTPS
aws elbv2 create-listener \\
  --load-balancer-arn $ALB_ARN \\
  --protocol HTTP --port 80 \\
  --default-actions Type=redirect,RedirectConfig='{
    Protocol=HTTPS,Port=443,StatusCode=HTTP_301
  }'`,
    },
    {
      label: 'ALB Routing Rules',
      language: 'bash',
      code: `# Create a second target group for API services
API_TG_ARN=$(aws elbv2 create-target-group \\
  --name api-tg \\
  --protocol HTTP --port 3000 \\
  --vpc-id vpc-0abc12345 \\
  --target-type ip \\
  --health-check-path /api/health \\
  --query 'TargetGroups[0].TargetGroupArn' --output text)

# Route /api/* to the API target group (priority 10)
aws elbv2 create-rule \\
  --listener-arn $LISTENER_ARN \\
  --priority 10 \\
  --conditions '[{
    "Field": "path-pattern",
    "Values": ["/api/*"]
  }]' \\
  --actions Type=forward,TargetGroupArn=$API_TG_ARN

# Route by host header (multi-tenant setup)
aws elbv2 create-rule \\
  --listener-arn $LISTENER_ARN \\
  --priority 20 \\
  --conditions '[{
    "Field": "host-header",
    "HostHeaderConfig": { "Values": ["admin.example.com"] }
  }]' \\
  --actions Type=forward,TargetGroupArn=$ADMIN_TG_ARN

# Canary deployment: 5% to new version target group
aws elbv2 create-rule \\
  --listener-arn $LISTENER_ARN \\
  --priority 100 \\
  --conditions '[]' \\
  --actions '[{
    "Type": "forward",
    "ForwardConfig": {
      "TargetGroups": [
        { "TargetGroupArn": "'$TG_ARN'", "Weight": 95 },
        { "TargetGroupArn": "'$NEW_TG_ARN'", "Weight": 5 }
      ],
      "TargetGroupStickinessConfig": { "Enabled": false }
    }
  }]'`,
    },
    {
      label: 'NLB Setup',
      language: 'bash',
      code: `# Create NLB with static IPs (one per AZ)
NLB_ARN=$(aws elbv2 create-load-balancer \\
  --name prod-nlb \\
  --type network \\
  --scheme internet-facing \\
  --subnet-mappings \\
    SubnetId=subnet-public-1a,AllocationId=eipalloc-0aaa \\
    SubnetId=subnet-public-1b,AllocationId=eipalloc-0bbb \\
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# Create TCP target group (for non-HTTP protocols)
NLB_TG=$(aws elbv2 create-target-group \\
  --name nlb-tg \\
  --protocol TCP \\
  --port 1883 \\
  --vpc-id vpc-0abc12345 \\
  --target-type ip \\
  --health-check-protocol TCP \\
  --query 'TargetGroups[0].TargetGroupArn' --output text)

# TLS listener — terminate TLS at NLB
aws elbv2 create-listener \\
  --load-balancer-arn $NLB_ARN \\
  --protocol TLS --port 8883 \\
  --certificates CertificateArn=arn:aws:acm:eu-west-1:123:certificate/abc \\
  --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 \\
  --default-actions Type=forward,TargetGroupArn=$NLB_TG

# Enable cross-zone load balancing on NLB (disabled by default)
aws elbv2 modify-load-balancer-attributes \\
  --load-balancer-arn $NLB_ARN \\
  --attributes Key=load_balancing.cross_zone.enabled,Value=true`,
    },
    {
      label: 'Access Logs & Monitoring',
      language: 'bash',
      code: `# Enable ALB access logs to S3
aws elbv2 modify-load-balancer-attributes \\
  --load-balancer-arn $ALB_ARN \\
  --attributes \\
    Key=access_logs.s3.enabled,Value=true \\
    Key=access_logs.s3.bucket,Value=my-alb-logs \\
    Key=access_logs.s3.prefix,Value=prod-alb \\
    Key=idle_timeout.timeout_seconds,Value=120

# Query ALB access logs with Athena (after setting up the table)
# SELECT time, client_ip, request_url, target_status_code, response_processing_time
# FROM alb_logs
# WHERE target_status_code = '500'
#   AND time > '2024-01-01'
# ORDER BY time DESC LIMIT 100;

# CloudWatch metrics for ALB
aws cloudwatch get-metric-statistics \\
  --namespace AWS/ApplicationELB \\
  --metric-name TargetResponseTime \\
  --dimensions Name=LoadBalancer,Value=app/prod-alb/abc123 \\
  --start-time 2024-01-01T00:00:00Z \\
  --end-time 2024-01-01T01:00:00Z \\
  --period 60 \\
  --statistics Average

# Set alarm for high 5xx error rate
aws cloudwatch put-metric-alarm \\
  --alarm-name alb-5xx-high \\
  --metric-name HTTPCode_Target_5XX_Count \\
  --namespace AWS/ApplicationELB \\
  --dimensions Name=LoadBalancer,Value=app/prod-alb/abc123 \\
  --period 60 \\
  --evaluation-periods 3 \\
  --threshold 10 \\
  --comparison-operator GreaterThanThreshold \\
  --statistic Sum \\
  --alarm-actions arn:aws:sns:eu-west-1:123:alert-topic`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'ALB security group allowing inbound from 0.0.0.0/0 but target SG not allowing ALB',
      wrong: `# ALB SG: allows 0.0.0.0/0:443 inbound ✓
# Target SG: allows 0.0.0.0/0:8080 (wrong — open to internet)
# OR: Target SG has no rule for port 8080 -> health checks fail`,
      right: `# Target SG: allow inbound port 8080 ONLY from the ALB SG
aws ec2 authorize-security-group-ingress \\
  --group-id sg-target \\
  --protocol tcp --port 8080 \\
  --source-group sg-alb
# Targets are unreachable from internet; ALB can reach them`,
      explanation: 'Target instances/tasks should never be directly internet-accessible. Reference the ALB security group as the source in the target security group rule — automatically adjusts as ALB nodes scale, and blocks all direct internet access to your app tier.'
    },
    {
      title: 'Health check path returning non-2xx causing constant target flapping',
      wrong: `# Health check path: /
# App returns 302 redirect on / -> ALB marks target unhealthy
# OR health check checks /health but app hasn't started yet
# Result: targets cycle healthy/unhealthy, disrupting traffic`,
      right: `# Use a dedicated /health endpoint that returns 200 immediately
# Set a generous health check grace period for slow-starting apps
aws elbv2 modify-target-group-attributes \\
  --target-group-arn $TG_ARN \\
  --attributes Key=slow_start.duration_seconds,Value=60`,
      explanation: 'The health check endpoint must return an HTTP 200-399 status code. Redirects (301/302), error pages, or slow startup responses cause targets to flap between healthy and unhealthy. Always create a dedicated /health or /ping endpoint that returns 200 with minimal processing.'
    },
    {
      title: 'NLB with cross-zone disabled and uneven target distribution',
      wrong: `# NLB cross-zone: disabled (default)
# AZ-1: 1 target, AZ-2: 9 targets
# Each AZ receives 50% of traffic
# The single target in AZ-1 handles 50% — 9× the load of each AZ-2 target`,
      right: `# Enable cross-zone load balancing for even distribution
aws elbv2 modify-load-balancer-attributes \\
  --load-balancer-arn $NLB_ARN \\
  --attributes Key=load_balancing.cross_zone.enabled,Value=true
# Note: enables inter-AZ data transfer charges (~$0.01/GB)`,
      explanation: 'NLB cross-zone is disabled by default, so each NLB node routes only to targets in its AZ. With uneven target distribution, some targets become overwhelmed. Enable cross-zone or ensure equal target count across AZs. ALB has cross-zone enabled by default at no charge.'
    },
    {
      title: 'Not increasing deregistration delay for long-running requests',
      wrong: `# Default deregistration delay: 300 seconds
# App processes uploads that take up to 600 seconds
# Target deregistered -> 300s later ALB sends RST to mid-upload clients`,
      right: `aws elbv2 modify-target-group-attributes \\
  --target-group-arn $TG_ARN \\
  --attributes Key=deregistration_delay.timeout_seconds,Value=600
# Match or exceed the longest expected request duration`,
      explanation: 'The deregistration delay controls how long the ALB waits (draining in-flight requests) before forcefully closing connections to a deregistered target. Set it to at least the maximum expected request duration — critical for file upload, export, or batch endpoints.'
    },
    {
      title: 'Using sticky sessions with stateful servers behind an ASG',
      wrong: `# Enabled duration-based sticky sessions (AWSALB cookie)
# ASG terminates an instance -> all sticky sessions lose state
# Clients hit new instances and find no session data`,
      right: `# Store session state externally: ElastiCache (Redis) or DynamoDB
# Then disable sticky sessions — any instance can handle any request
# If sticky sessions are required: use application-based cookies
# and design targets to replicate session to shared store on write`,
      explanation: 'Sticky sessions are a band-aid that breaks when instances are terminated by the ASG. True horizontal scalability requires externalising session state to ElastiCache or DynamoDB — then every instance can serve every request without affinity.'
    },
  ];

  challenge: Challenge = {
    title: 'Multi-Service ALB Routing',
    language: 'typescript',
    description: `Write the AWS CLI commands to configure an existing ALB listener (ARN: arn:aws:elasticloadbalancing:...:listener/LISTENER) with these routing rules: (1) /api/* → API target group; (2) /admin/* + host-header admin.example.com → admin target group with fixed response if not matching; (3) everything else → frontend target group. Use priorities 10, 20, and default action respectively.`,
    hints: [
      'Higher priority number = lower precedence. Priority 10 is evaluated before 20.',
      'The default action is set on the listener itself (not a rule), or use priority 50000.',
      'Multiple conditions in one rule use AND logic — both path AND host must match.',
      'Fixed response action: { Type: "fixed-response", FixedResponseConfig: { StatusCode: "403" } }.',
    ],
    starterCode: `const LISTENER = "arn:aws:elasticloadbalancing:eu-west-1:123:listener/app/prod-alb/abc/def";
const API_TG = "arn:aws:elasticloadbalancing:eu-west-1:123:targetgroup/api-tg/ghi";
const ADMIN_TG = "arn:aws:elasticloadbalancing:eu-west-1:123:targetgroup/admin-tg/jkl";
const FRONTEND_TG = "arn:aws:elasticloadbalancing:eu-west-1:123:targetgroup/frontend-tg/mno";

// Output the CLI commands as template strings
const rule1 = \`aws elbv2 create-rule \\
  --listener-arn \${LISTENER} \\
  --priority 10 \\
  // TODO: /api/* condition and forward action
\`;

const rule2 = \`aws elbv2 create-rule \\
  // TODO: priority 20, path /admin/* AND host admin.example.com
\`;

console.log(rule1, rule2);`,
    solution: `const LISTENER = "arn:aws:elasticloadbalancing:eu-west-1:123:listener/app/prod-alb/abc/def";
const API_TG = "arn:aws:elasticloadbalancing:eu-west-1:123:targetgroup/api-tg/ghi";
const ADMIN_TG = "arn:aws:elasticloadbalancing:eu-west-1:123:targetgroup/admin-tg/jkl";
const FRONTEND_TG = "arn:aws:elasticloadbalancing:eu-west-1:123:targetgroup/frontend-tg/mno";

const rule1 = \`
aws elbv2 create-rule \\
  --listener-arn \${LISTENER} \\
  --priority 10 \\
  --conditions '[{"Field":"path-pattern","Values":["/api/*"]}]' \\
  --actions 'Type=forward,TargetGroupArn=\${API_TG}'
\`;

const rule2 = \`
aws elbv2 create-rule \\
  --listener-arn \${LISTENER} \\
  --priority 20 \\
  --conditions '[
    {"Field":"path-pattern","Values":["/admin/*"]},
    {"Field":"host-header","HostHeaderConfig":{"Values":["admin.example.com"]}}
  ]' \\
  --actions 'Type=forward,TargetGroupArn=\${ADMIN_TG}'
\`;

// Default action: set on the listener (done at listener creation)
// or add a low-priority rule:
const defaultRule = \`
aws elbv2 modify-listener \\
  --listener-arn \${LISTENER} \\
  --default-actions 'Type=forward,TargetGroupArn=\${FRONTEND_TG}'
\`;

console.log(rule1, rule2, defaultRule);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which load balancer type gives you a static Elastic IP per Availability Zone?',
      options: ['ALB', 'NLB', 'GLB', 'Classic LB'],
      answer: 1,
      explanation: 'NLB allocates a static Elastic IP per AZ, enabling firewall whitelisting with a known fixed IP. ALB uses dynamic IPs that can change — you must whitelist the ALB DNS name, not specific IPs.'
    },
    {
      q: 'What is the purpose of the ALB deregistration delay?',
      options: [
        'Time the ALB waits before routing to a newly registered target',
        'Time the ALB waits for in-flight requests to complete before closing connections to a deregistered target',
        'Cooldown period after an auto-scaling event',
        'Timeout before the ALB marks a target as unhealthy'
      ],
      answer: 1,
      explanation: 'Deregistration delay (default 300 s) allows in-flight requests to complete gracefully after a target is removed from the target group. The ALB stops sending new requests immediately but keeps existing connections open until the delay expires.'
    },
    {
      q: 'An ALB listener rule has conditions for path-pattern /admin/* AND host-header admin.example.com. When does the rule match?',
      options: [
        'When either condition matches (OR logic)',
        'When both conditions match (AND logic)',
        'When only path-pattern matches',
        'When the host-header matches, regardless of path'
      ],
      answer: 1,
      explanation: 'Multiple conditions in a single ALB listener rule use AND logic — all conditions must be true for the rule to match. To implement OR logic, create separate rules with the same action.'
    },
    {
      q: 'Cross-zone load balancing is enabled by default (at no charge) on which load balancer type?',
      options: ['NLB only', 'GLB only', 'ALB only', 'All load balancer types'],
      answer: 2,
      explanation: 'ALB has cross-zone load balancing enabled by default at no additional charge, distributing traffic evenly across all targets in all AZs. NLB has it disabled by default; enabling it incurs inter-AZ data transfer charges.'
    },
    {
      q: 'You need to route MQTT (port 1883, TCP) traffic. Which AWS load balancer should you use?',
      options: ['ALB', 'NLB', 'GLB', 'CloudFront'],
      answer: 1,
      explanation: 'MQTT is a TCP-based protocol. NLB handles TCP/UDP/TLS at Layer 4 — perfect for non-HTTP protocols like MQTT, AMQP, gRPC, gaming, and IoT. ALB only understands HTTP/HTTPS/WebSocket (Layer 7).'
    },
    {
      q: 'What is the key difference between an Application Load Balancer (ALB) and a Network Load Balancer (NLB)?',
      options: ['ALB and NLB are functionally identical', 'ALB operates at Layer 7 (HTTP/HTTPS, supports path-based routing); NLB operates at Layer 4 (TCP/UDP, ultra-low latency, static IP support)', 'NLB only supports HTTPS traffic', 'ALB cannot perform health checks'],
      answer: 1,
      explanation: 'ALB understands HTTP/HTTPS content, enabling path/host-based routing, WebSocket support, and integration with services like ECS/Lambda targets. NLB operates at the transport layer, handling millions of requests per second with ultra-low latency and supporting static IP addresses — used for extreme performance needs or non-HTTP protocols (raw TCP, gaming, IoT).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use ALB vs NLB?',
      a: 'ALB: HTTP/HTTPS workloads, microservices with path/host-based routing, WebSocket, gRPC (over HTTP/2), WAF integration, user authentication (Cognito/OIDC). NLB: non-HTTP protocols (TCP, UDP, TLS pass-through), ultra-low latency (<1 ms vs ALB ~2-5 ms), need for static Elastic IPs, extreme throughput (millions of req/s), preserving source IP without headers. For most web applications, ALB is the right choice. Use NLB when ALB\'s HTTP understanding is a limitation.'
    },
    {
      q: 'How does ALB weighted target group routing work for canary deployments?',
      a: 'In the listener rule action, instead of forwarding to a single target group, you define a ForwardConfig with multiple target groups and weights. ALB distributes requests proportionally — e.g. 95 weight on v1-tg and 5 weight on v2-tg means 5% of requests go to v2 targets. You can gradually shift weights (5%→25%→50%→100%) as confidence grows. Enable target group stickiness to avoid A/B session splits for a single user. This is a pure infrastructure-layer canary requiring no code changes.'
    },
    {
      q: 'What are ALB access logs and how do you use them for debugging?',
      a: 'ALB access logs are delivered to S3 every 5 minutes (or per-minute in high traffic) and contain: timestamp, client IP, ELB status code, target status code, request URL, user-agent, TLS cipher, and processing time breakdown. Enable with access_logs.s3.* attributes. Query with Athena using the AWS-provided partition projection DDL. Useful queries: all 5xx requests in the last hour; slowest requests by response_processing_time; which target IP returned errors; client IPs with repeated 403s (potential attack).'
    },
    {
      q: 'How does ALB authenticate users with Cognito or OIDC?',
      a: 'ALB has built-in authenticate-cognito and authenticate-oidc listener rule actions. When a request hits a protected rule, ALB redirects the user to the IdP login page, receives the OAuth2/OIDC callback, validates the token, and then forwards the request to the target with identity claims in X-Amzn-Oidc-* headers. Your application gets the user\'s email, groups, and claims without writing authentication code. Sessions are managed by ALB using an encrypted cookie (AWSALB_AUTH).'
    },
    {
      q: 'What is connection draining (deregistration delay) and why does it matter during deployments?',
      a: 'When a target is deregistered from a load balancer (e.g., during a rolling deployment or instance termination), connection draining keeps the load balancer routing IN-FLIGHT requests to that target for a configurable period (default 300 seconds) before stopping new requests entirely — preventing abrupt connection drops for users mid-request. Without sufficient drain time, a deployment can cause visible errors for users whose requests were in progress on a target being removed.',
    },
    {
      q: 'How do ALB target group health checks determine whether traffic is routed to an instance?',
      a: 'A target group periodically sends a configured health check request (typically an HTTP GET to a specific path like /health) to each registered target. After a configurable number of consecutive failures (unhealthy threshold), the target is marked unhealthy and removed from active rotation — traffic stops routing to it until it passes enough consecutive successful checks (healthy threshold) to be re-added. This automatic detection prevents routing user traffic to instances that are running but not actually able to serve requests correctly.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ALB routes HTTP/HTTPS by content (L7); NLB routes TCP/UDP by connection (L4) with static IPs — both support target groups with health checks and integrate with ASGs and ECS.',
    mustKnow: [
      'ALB: Layer 7, path/host/header routing, WAF, Cognito auth, weighted canary — default for HTTP',
      'NLB: Layer 4, TCP/UDP/TLS, static Elastic IPs, ultra-low latency, source IP preserved',
      'Target group types: instance, ip (ECS/on-prem), lambda, alb (NLB→ALB chaining)',
      'Health check: dedicated /health endpoint returning 2xx; grace period for slow starters',
      'ALB cross-zone: on by default (free); NLB: off by default (cross-AZ data charges if enabled)',
      'Deregistration delay: keeps connections open for in-flight requests (default 300 s)',
      'Sticky sessions: short-term fix; externalise session state (Redis) for true HA',
    ],
    interviewFocus: [
      'ALB vs NLB decision criteria — HTTP vs TCP, static IP need, latency requirements',
      'ALB listener rule conditions and AND/OR logic for multi-service routing',
      'Canary deployment with weighted target groups — no DNS change needed',
      'Deregistration delay and its relationship to graceful shutdown',
      'NLB cross-zone load balancing cost implications',
    ],
  };
}
