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
  selector: 'app-aws-route53-cloudfront',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './route53-cloudfront.html',
  styleUrl: './route53-cloudfront.scss'
})
export class AwsRoute53Cloudfront {

  quickRef: QuickRefItem[] = [
    { name: 'Hosted Zone', type: 'class', desc: 'Container for DNS records for a domain. Public hosted zones are internet-facing; private hosted zones resolve within a VPC.' },
    { name: 'Alias Record', type: 'keyword', desc: 'Route 53-specific record that points to AWS resources (ALB, CloudFront, S3) — free queries, supports apex domain.' },
    { name: 'Health Check', type: 'class', desc: 'Route 53 monitors endpoints (HTTP/HTTPS/TCP) and removes unhealthy targets from DNS responses.' },
    { name: 'Routing Policy', type: 'keyword', desc: 'Simple, Weighted, Latency-based, Failover, Geolocation, Geoproximity, or Multi-value — controls how Route 53 responds.' },
    { name: 'CloudFront Distribution', type: 'class', desc: 'CDN config: origin, cache behaviours, TTL, geo restrictions, WAF association, and HTTPS certificates.' },
    { name: 'Origin Access Control (OAC)', type: 'keyword', desc: 'Allows CloudFront to read a private S3 bucket using SigV4 — replaces the older OAI mechanism.' },
    { name: 'Cache Behaviour', type: 'class', desc: 'Path-pattern rule in a CloudFront distribution — defines TTL, allowed methods, origin, and cache policy per URL pattern.' },
    { name: 'ACM', type: 'class', desc: 'AWS Certificate Manager — free TLS certificates for ALB, CloudFront, and API Gateway; auto-renews.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Route 53 Record Types',
      points: [
        'A: maps hostname to IPv4 address. AAAA: maps hostname to IPv6. CNAME: maps hostname to another hostname — cannot be used at the zone apex (naked domain).',
        'Alias: Route 53-specific, maps hostname to an AWS resource (ALB, CloudFront distribution, S3 website endpoint, another Route 53 record). Works at the apex. Free queries. Cannot be used for EC2 DNS names.',
        'MX: mail exchange servers with priority. TXT: arbitrary text — used for SPF, DKIM, domain ownership verification. NS: name servers for the hosted zone.',
        'SOA: start of authority — one per hosted zone, contains administrative info. CAA: specifies which certificate authorities can issue certs for the domain.',
        'TTL controls how long resolvers cache the record. Low TTL (60 s) enables fast failover but increases Route 53 query costs. Reduce TTL before planned DNS changes.',
      ]
    },
    {
      heading: 'Routing Policies',
      points: [
        'Simple: single record, no health checks — use for non-critical single-resource setups.',
        'Weighted: distribute traffic by percentage (weight 70/30). Useful for A/B testing or gradual migration to a new version. Weight 0 disables without removing the record.',
        'Latency-based: routes to the AWS region with the lowest measured latency for the client — ideal for global applications.',
        'Failover: active-passive — Route 53 serves the primary record unless its health check fails, then switches to standby. Used for disaster recovery.',
        'Geolocation: routes based on the user\'s continent, country, or US state. Use for compliance (EU data in EU region) or language-specific content.',
        'Geoproximity (Traffic Flow only): routes based on geographic proximity to resources with configurable bias — can shift traffic from one region to another.',
      ]
    },
    {
      heading: 'CloudFront Distributions',
      points: [
        'A distribution defines: one or more origins (S3, ALB, custom HTTP), cache behaviours (path-pattern → origin mapping), price class (which edge locations to use), and SSL certificate.',
        'Edge locations cache responses close to users. Cache key: by default URL path + selected headers/query strings. Objects are served from cache until TTL expires or a CloudFront invalidation is issued.',
        'Cache behaviours use path patterns (e.g. /api/* → ALB with no caching, /* → S3 with long TTL). Earlier paths take precedence — order matters.',
        'Managed Cache Policies: CachingOptimized (default for S3), CachingDisabled (for APIs), UseOriginCacheControlHeaders — use these before crafting custom policies.',
        'Functions at the edge: CloudFront Functions (lightweight, ~1 ms, viewer request/response only) and Lambda@Edge (full Lambda, ~50 ms, all four event types: viewer request/response, origin request/response).',
      ]
    },
    {
      heading: 'Origin Access Control & S3 Static Sites',
      points: [
        'OAC replaces Origin Access Identity (OAI) — it uses SigV4 request signing and supports SSE-KMS encrypted S3 buckets.',
        'Setup: create CloudFront OAC, configure distribution to use OAC for the S3 origin, update S3 bucket policy to allow cloudfront.amazonaws.com principal with the distribution ARN as a condition.',
        'With OAC, the S3 bucket stays private — users cannot access objects directly from S3 URLs, only via CloudFront.',
        'For S3 static website hosting with CloudFront: use the bucket\'s website endpoint as origin (not REST endpoint) if you need redirect rules or index documents — but OAC requires the REST endpoint.',
        'Invalidations clear cached content: aws cloudfront create-invalidation --paths "/*". You get 1,000 free path invalidations per month; after that $0.005 per path.',
      ]
    },
    {
      heading: 'HTTPS & ACM Certificates',
      points: [
        'ACM issues free TLS certificates — request via console or CLI, validate via DNS (recommended: ACM adds a CNAME to your hosted zone) or email.',
        'For CloudFront, the ACM certificate must be in us-east-1 (N. Virginia) — regardless of where your distribution\'s origin is.',
        'For ALB and API Gateway, request the certificate in the same region as the resource.',
        'ACM auto-renews certificates before expiry as long as DNS validation records remain in place. Email-validated certificates require manual renewal.',
        'SNI (Server Name Indication) allows CloudFront to serve multiple domains from one distribution. Dedicated IP SSL ($600/month) is only needed for very old clients that don\'t support SNI.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Route 53 Records',
      language: 'bash',
      code: `# Create a public hosted zone
aws route53 create-hosted-zone \\
  --name example.com \\
  --caller-reference "$(date +%s)"

# List hosted zones
aws route53 list-hosted-zones --query 'HostedZones[].{Name:Name,Id:Id}'

# Create an Alias record pointing to an ALB (at zone apex)
aws route53 change-resource-record-sets \\
  --hosted-zone-id Z1234567890ABC \\
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "example.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z32O12XQLNTSW2",
          "DNSName": "my-alb-123456.eu-west-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'

# Weighted routing: 70% to new version, 30% to old
aws route53 change-resource-record-sets \\
  --hosted-zone-id Z1234567890ABC \\
  --change-batch '{
    "Changes": [
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "api.example.com",
          "Type": "A",
          "SetIdentifier": "new-version",
          "Weight": 70,
          "AliasTarget": {
            "HostedZoneId": "Z32O12XQLNTSW2",
            "DNSName": "new-alb.eu-west-1.elb.amazonaws.com",
            "EvaluateTargetHealth": true
          }
        }
      },
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "api.example.com",
          "Type": "A",
          "SetIdentifier": "old-version",
          "Weight": 30,
          "AliasTarget": {
            "HostedZoneId": "Z32O12XQLNTSW2",
            "DNSName": "old-alb.eu-west-1.elb.amazonaws.com",
            "EvaluateTargetHealth": true
          }
        }
      }
    ]
  }'`,
    },
    {
      label: 'CloudFront + S3 OAC',
      language: 'bash',
      code: `# 1. Create S3 bucket (keep it private)
aws s3 mb s3://my-static-site --region eu-west-1

# 2. Request ACM certificate in us-east-1 (required for CloudFront)
CERT_ARN=$(aws acm request-certificate \\
  --domain-name example.com \\
  --subject-alternative-names "*.example.com" \\
  --validation-method DNS \\
  --region us-east-1 \\
  --query 'CertificateArn' --output text)

# 3. Create Origin Access Control
OAC_ID=$(aws cloudfront create-origin-access-control \\
  --origin-access-control-config '{
    "Name": "my-s3-oac",
    "OriginAccessControlOriginType": "s3",
    "SigningBehavior": "always",
    "SigningProtocol": "sigv4"
  }' \\
  --query 'OriginAccessControl.Id' --output text)

# 4. Create CloudFront distribution
aws cloudfront create-distribution \\
  --distribution-config '{
    "Origins": {
      "Quantity": 1,
      "Items": [{
        "Id": "s3-origin",
        "DomainName": "my-static-site.s3.amazonaws.com",
        "S3OriginConfig": { "OriginAccessIdentity": "" },
        "OriginAccessControlId": "'"$OAC_ID"'"
      }]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "s3-origin",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
      "AllowedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] }
    },
    "ViewerCertificate": {
      "ACMCertificateArn": "'"$CERT_ARN"'",
      "SSLSupportMethod": "sni-only",
      "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "Aliases": { "Quantity": 1, "Items": ["example.com"] },
    "DefaultRootObject": "index.html",
    "Enabled": true,
    "Comment": "Static site distribution"
  }'`,
    },
    {
      label: 'CloudFront Invalidation & Headers',
      language: 'bash',
      code: `# Invalidate the entire cache after a deploy
aws cloudfront create-invalidation \\
  --distribution-id EDFDVBD6EXAMPLE \\
  --paths "/*"

# Invalidate specific paths
aws cloudfront create-invalidation \\
  --distribution-id EDFDVBD6EXAMPLE \\
  --paths "/index.html" "/assets/app.js" "/assets/style.css"

# Check invalidation status
aws cloudfront list-invalidations \\
  --distribution-id EDFDVBD6EXAMPLE \\
  --query 'InvalidationList.Items[0].{Id:Id,Status:Status}'

# Add security headers via CloudFront Response Headers Policy
aws cloudfront create-response-headers-policy \\
  --response-headers-policy-config '{
    "Name": "security-headers",
    "SecurityHeadersConfig": {
      "StrictTransportSecurity": {
        "Override": true,
        "AccessControlMaxAgeSec": 31536000,
        "IncludeSubdomains": true,
        "Preload": true
      },
      "ContentTypeOptions": { "Override": true },
      "FrameOptions": { "FrameOption": "DENY", "Override": true },
      "XSSProtection": { "Protection": true, "Override": true, "ModeBlock": true }
    }
  }'`,
    },
    {
      label: 'Health Checks & Failover',
      language: 'bash',
      code: `# Create Route 53 health check for primary endpoint
PRIMARY_HC=$(aws route53 create-health-check \\
  --caller-reference "$(date +%s)" \\
  --health-check-config '{
    "Type": "HTTPS",
    "FullyQualifiedDomainName": "api.example.com",
    "Port": 443,
    "ResourcePath": "/health",
    "RequestInterval": 30,
    "FailureThreshold": 3
  }' \\
  --query 'HealthCheck.Id' --output text)

# Failover routing: primary + secondary
aws route53 change-resource-record-sets \\
  --hosted-zone-id Z1234567890ABC \\
  --change-batch '{
    "Changes": [
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "api.example.com",
          "Type": "A",
          "SetIdentifier": "primary",
          "Failover": "PRIMARY",
          "HealthCheckId": "'"$PRIMARY_HC"'",
          "TTL": 60,
          "ResourceRecords": [{ "Value": "1.2.3.4" }]
        }
      },
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "api.example.com",
          "Type": "A",
          "SetIdentifier": "secondary",
          "Failover": "SECONDARY",
          "TTL": 60,
          "ResourceRecords": [{ "Value": "5.6.7.8" }]
        }
      }
    ]
  }'

# Check health check status
aws route53 get-health-check-status --health-check-id $PRIMARY_HC`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using CNAME at the zone apex (naked domain)',
      wrong: `# Trying to point example.com (apex) to ALB with CNAME
example.com CNAME my-alb.eu-west-1.elb.amazonaws.com
# Error: CNAMEs cannot coexist with other records at the zone apex`,
      right: `# Use an Alias record instead — it works at the apex and is free
example.com A (Alias) -> my-alb.eu-west-1.elb.amazonaws.com
# Route 53 resolves the ALB's IPs automatically`,
      explanation: 'DNS spec prohibits CNAMEs at the zone apex because a CNAME cannot coexist with SOA and NS records. Route 53 Alias records solve this — they look like A/AAAA records externally but resolve to AWS resource IPs and do not incur per-query charges.'
    },
    {
      title: 'ACM certificate requested in the wrong region for CloudFront',
      wrong: `# Requesting the cert in eu-west-1 for a CloudFront distribution
aws acm request-certificate --domain-name example.com --region eu-west-1
# CloudFront console: "No certificates found" or the cert is not selectable`,
      right: `# CloudFront requires the ACM certificate in us-east-1
aws acm request-certificate --domain-name example.com --region us-east-1`,
      explanation: 'CloudFront is a global service managed from us-east-1. Its certificate integration only looks in us-east-1 — a certificate in any other region will not appear in the CloudFront distribution config, even if the origin is in eu-west-1.'
    },
    {
      title: 'Leaving the S3 bucket public when using CloudFront',
      wrong: `# Bucket has public-read ACL so CloudFront can access it
aws s3api put-bucket-acl --bucket my-site --acl public-read
# Anyone can bypass CloudFront and access S3 directly`,
      right: `# Keep bucket private; use OAC so only CloudFront can read it
# Bucket policy:
{
  "Effect": "Allow",
  "Principal": { "Service": "cloudfront.amazonaws.com" },
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::my-site/*",
  "Condition": {
    "StringEquals": {
      "AWS:SourceArn": "arn:aws:cloudfront::123:distribution/DIST_ID"
    }
  }
}`,
      explanation: 'A public S3 bucket lets users bypass CloudFront entirely — circumventing WAF, geo-restrictions, signed URL enforcement, and caching. With OAC, the bucket stays private and only CloudFront can access objects using SigV4-signed requests.'
    },
    {
      title: 'Forgetting to lower TTL before a DNS migration',
      wrong: `# Current TTL: 86400 (24 hours)
# Changed the A record to point to new server
# Users still hitting old server for up to 24 hours`,
      right: `# Step 1: Lower TTL to 60 seconds at least 24 hours before migration
# Step 2: Perform the DNS change
# Step 3: After propagation confirmed, raise TTL back to 3600+`,
      explanation: 'DNS resolvers cache records for the duration of their TTL. If you change an A record with a 24-hour TTL, some users will keep hitting the old IP for up to 24 hours. Lower the TTL 24+ hours before the migration window, then change the record, then restore the TTL.'
    },
    {
      title: 'Using CloudFront invalidations as a cache management strategy',
      wrong: `# After every deploy, invalidating /* to clear all cached objects
# 1,000 free paths/month — after that $0.005/path
# Invalidations take 1-3 minutes to propagate globally`,
      right: `# Better: use versioned file names (app.abc123.js)
# Only invalidate /index.html which references the new bundle
aws cloudfront create-invalidation --paths "/index.html"
# Static assets with content-hash names are cached indefinitely`,
      explanation: 'Wholesale invalidations (/*) are slow (1-3 min), cost money beyond the free tier, and negate the performance benefit of caching. Instead, name your static assets with content hashes — cache them indefinitely and only invalidate the entry HTML file.'
    },
  ];

  challenge: Challenge = {
    title: 'Static Site with CloudFront + OAC',
    language: 'typescript',
    description: `Write the S3 bucket policy JSON that allows a CloudFront distribution (ID: EDFDVBD6EXAMPLE, account: 123456789012) to read objects from bucket 'my-static-site' using Origin Access Control. The policy should: allow only s3:GetObject, grant it only to cloudfront.amazonaws.com service, and restrict it to the specific distribution using AWS:SourceArn.`,
    hints: [
      'Principal should be the cloudfront.amazonaws.com service, not an IAM ARN.',
      'Resource is the bucket ARN with /* suffix for all objects.',
      'Condition uses StringEquals with AWS:SourceArn pointing to the distribution ARN.',
      'The distribution ARN format is arn:aws:cloudfront::ACCOUNT_ID:distribution/DIST_ID.',
    ],
    starterCode: `const bucketPolicy = {
  Version: "2012-10-17",
  Statement: [{
    Sid: "AllowCloudFrontOAC",
    Effect: "Allow",
    Principal: {
      // TODO: CloudFront service principal
    },
    Action: "TODO",
    Resource: "TODO",  // all objects in the bucket
    Condition: {
      StringEquals: {
        // TODO: restrict to specific CloudFront distribution
      }
    }
  }]
};

console.log(JSON.stringify(bucketPolicy, null, 2));`,
    solution: `const ACCOUNT_ID = "123456789012";
const DIST_ID = "EDFDVBD6EXAMPLE";
const BUCKET = "my-static-site";

const bucketPolicy = {
  Version: "2012-10-17",
  Statement: [{
    Sid: "AllowCloudFrontOAC",
    Effect: "Allow",
    Principal: {
      Service: "cloudfront.amazonaws.com"
    },
    Action: "s3:GetObject",
    Resource: \`arn:aws:s3:::\${BUCKET}/*\`,
    Condition: {
      StringEquals: {
        "AWS:SourceArn": \`arn:aws:cloudfront::\${ACCOUNT_ID}:distribution/\${DIST_ID}\`
      }
    }
  }]
};

console.log(JSON.stringify(bucketPolicy, null, 2));

// Apply the policy:
// aws s3api put-bucket-policy --bucket my-static-site --policy "$(echo policy | jq .)"`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which Route 53 record type can be used at the zone apex (naked domain) to point to an ALB?',
      options: ['CNAME', 'A with a static IP', 'Alias A record', 'MX'],
      answer: 2,
      explanation: 'An Alias A record is Route 53-specific and can be used at the zone apex — unlike CNAME which cannot coexist with SOA/NS records. Alias records auto-resolve to the current IPs of the AWS resource and are queried for free.'
    },
    {
      q: 'In which AWS region must an ACM certificate be requested for use with CloudFront?',
      options: ['The region where the CloudFront origin is', 'Any region', 'us-east-1', 'eu-west-1'],
      answer: 2,
      explanation: 'CloudFront is a global service managed from us-east-1. It only looks for ACM certificates in us-east-1 regardless of where your origin or users are. Certificates in other regions cannot be selected in CloudFront distribution config.'
    },
    {
      q: 'What does Origin Access Control (OAC) replace in CloudFront?',
      options: ['CloudFront Functions', 'Origin Access Identity (OAI)', 'Cache Policy', 'Lambda@Edge'],
      answer: 1,
      explanation: 'OAC is the successor to Origin Access Identity (OAI). OAC uses SigV4 request signing, supports SSE-KMS encrypted S3 buckets, and works with newer AWS features that OAI does not support. AWS recommends migrating from OAI to OAC.'
    },
    {
      q: 'Which Route 53 routing policy should you use for an active-passive disaster recovery setup?',
      options: ['Weighted', 'Latency-based', 'Failover', 'Geolocation'],
      answer: 2,
      explanation: 'Failover routing policy maintains a primary record (served while its health check passes) and a secondary (standby). When the health check fails, Route 53 automatically switches DNS responses to the secondary endpoint — enabling active-passive DR.'
    },
    {
      q: 'What is the most cost-efficient way to cache static assets (JS, CSS) in CloudFront?',
      options: [
        'Set TTL to 60 seconds and use /* invalidations on each deploy',
        'Use content-hash filenames with max TTL; only invalidate the entry HTML',
        'Disable caching so the origin always serves the latest version',
        'Use a short TTL of 300 seconds on all assets'
      ],
      answer: 1,
      explanation: 'Content-hash filenames (e.g. app.abc123.js) are unique per build — safe to cache indefinitely. On deploy, only /index.html changes (it references the new hash). Invalidating only /index.html is fast, cheap (1 path), and the new assets are fetched on the first user request.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between CloudFront Functions and Lambda@Edge?',
      a: 'CloudFront Functions: lightweight, sub-millisecond execution at all 450+ edge locations, triggered only at viewer request/response. Limited to URL rewrites, header manipulation, and simple redirects. Max 2 MB memory, no network access. Cost: ~$0.10 per million invocations. Lambda@Edge: full Lambda runtime (Node.js or Python), up to 128 MB memory (viewer) or 10 GB (origin), can make network calls, triggered at all four event types (viewer/origin request/response). 3-10× slower cold starts, ~$0.60 per million. Choose CloudFront Functions for simple header/URL logic; Lambda@Edge for A/B testing, authentication, or complex request transformation.'
    },
    {
      q: 'How does Route 53 latency-based routing determine which region to use?',
      a: 'Route 53 measures latency between the user\'s DNS resolver and each AWS region where you have latency records. It responds with the record for the region with the lowest measured latency — not the geographically closest region, since network topology often means the nearest region is not the fastest. The latency data is updated regularly based on AWS measurements. You create one latency record per region, each pointing to the resource in that region.'
    },
    {
      q: 'Can CloudFront be used as an API accelerator (not just for static files)?',
      a: 'Yes. CloudFront works well in front of ALBs and API Gateway. For dynamic APIs: set Cache-Control: no-store on API responses to disable caching, or use CachingDisabled managed policy. Benefits: edge TLS termination (reduced RTT to origin), HTTP/2 and HTTP/3 support, built-in DDoS protection via Shield Standard, and WAF integration. CloudFront also compresses responses (gzip/brotli) and supports origin failover for multi-region APIs.'
    },
    {
      q: 'What happens during a CloudFront cache invalidation, and how long does it take?',
      a: 'An invalidation instructs all CloudFront edge locations worldwide to remove the specified objects from cache on the next request. It typically takes 1-3 minutes for the invalidation to propagate to all edge locations (~450 globally). During propagation, some edge locations may still serve the old cached version. You receive 1,000 free invalidation paths per month; additional paths cost $0.005 each. The /* wildcard counts as one path in the free tier but invalidates everything.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Route 53 manages DNS with flexible routing policies; CloudFront accelerates delivery via edge caches with OAC-protected S3 origins and ACM HTTPS certificates.',
    mustKnow: [
      'Alias record works at zone apex; CNAME does not — always use Alias for AWS resources',
      'ACM certificates for CloudFront must be in us-east-1 regardless of origin region',
      'OAC keeps S3 bucket private — only CloudFront reads objects via SigV4 signing',
      'Route 53 routing policies: Simple, Weighted (A/B), Latency, Failover (DR), Geolocation',
      'Cache behaviours: path pattern → origin + TTL + methods; ordered by specificity',
      'CloudFront Functions: sub-ms, viewer events only; Lambda@Edge: full runtime, all events',
      'Lower TTL before DNS migration; content-hash filenames avoid bulk cache invalidations',
    ],
    interviewFocus: [
      'Alias vs CNAME at zone apex — why and when to use Alias',
      'OAC vs OAI — what changed and why OAC is preferred',
      'CloudFront Functions vs Lambda@Edge — when to use each',
      'ACM certificate region requirement for CloudFront (us-east-1)',
      'Route 53 failover routing with health checks for active-passive DR',
    ],
  };
}
