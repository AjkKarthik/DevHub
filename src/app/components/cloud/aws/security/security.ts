import { Component } from '@angular/core';
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
  selector: 'app-aws-security',
  standalone: true,
  imports: [
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent,
  ],
  templateUrl: './security.html',
  styleUrl: './security.scss',
})
export class AwsSecurity {
  quickRef: QuickRefItem[] = [
    { name: 'GuardDuty', type: 'keyword', desc: 'ML-based threat detection from VPC Flow Logs, CloudTrail, DNS logs — detects, not blocks' },
    { name: 'Security Hub', type: 'keyword', desc: 'Aggregates ASFF findings from GuardDuty, Inspector, Macie + compliance scoring' },
    { name: 'Shield Standard', type: 'keyword', desc: 'Free Layer 3/4 DDoS protection — SYN floods, UDP amplification, reflection attacks' },
    { name: 'Shield Advanced', type: 'keyword', desc: '$3 000/month — L7 DDoS, DRT access, cost protection, WAF included' },
    { name: 'WAF Web ACL', type: 'syntax', desc: 'Rule types: managed groups (OWASP), rate-based (per-IP), geo-match, IP set, regex' },
    { name: 'Macie', type: 'keyword', desc: 'ML S3 data classification — PII, credentials, financial data; managed + custom identifiers' },
    { name: 'KMS CMK', type: 'keyword', desc: 'Customer managed key; key policy is root of trust — IAM alone cannot grant access' },
    { name: 'Envelope Encryption', type: 'syntax', desc: 'KMS generates data key → encrypt data → store encrypted data key; never store plaintext key' },
    { name: 'Inspector', type: 'keyword', desc: 'CVE scanning of EC2/ECR images/Lambda — software vulnerabilities, not runtime threats' },
    { name: 'Secrets Manager', type: 'keyword', desc: 'Stores and rotates secrets (DB passwords, API keys); RDS auto-rotation built-in' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'GuardDuty — Intelligent Threat Detection',
      points: [
        'Continuously analyses VPC Flow Logs, CloudTrail management events, DNS query logs, and S3 data events without agents to install.',
        'ML models and threat intelligence feeds detect: crypto-mining, credential theft, port scanning, unusual API call patterns, and C2 communication traffic.',
        'Finding severity: LOW (<4), MEDIUM (4–7), HIGH (7+). Example finding types: UnauthorizedAccess:EC2/SSHBruteForce, CryptoCurrency:EC2/BitcoinTool, Trojan:EC2/BlackholeTraffic.',
        'Findings publish to Security Hub (ASFF format) and emit EventBridge events — create EventBridge rules to trigger Lambda for automated isolation or remediation.',
        'Multi-account: designate a delegated admin; all member account findings appear in a single-pane Security Hub.',
      ],
    },
    {
      heading: 'Security Hub — Findings Aggregation and Compliance',
      points: [
        'Ingests findings in Amazon Security Finding Format (ASFF) from GuardDuty, Inspector, Macie, Firewall Manager, and third-party security integrations.',
        'Built-in security standards: CIS AWS Foundations Benchmark, AWS Foundational Security Best Practices, PCI DSS, NIST SP 800-53.',
        'Compliance score = percentage of controls passing; drill into specific controls to view failing resources and remediation guidance.',
        'Cross-account aggregation: member accounts send findings to a delegated administrator for Org-wide visibility in a single pane.',
        'Automated response: Security Hub finding → EventBridge rule → Lambda for auto-remediation, such as removing public S3 access or revoking overly permissive security groups.',
      ],
    },
    {
      heading: 'AWS Shield — DDoS Protection',
      points: [
        'Shield Standard: free, always-on protection for all AWS resources. Absorbs Layer 3/4 attacks — SYN floods, UDP amplification, NTP/DNS reflection attacks.',
        'Shield Advanced: $3 000/month per Organisation. Adds Layer 7 DDoS detection, DDoS Response Team (DRT) 24/7 support, and real-time attack dashboards.',
        'Shield Advanced cost protection: AWS credits EC2/ELB/CloudFront scaling charges incurred during a confirmed DDoS attack.',
        'Pair Shield Advanced with WAF for complete L3–L7 defence: Shield absorbs volumetric floods, WAF filters malicious application-layer requests.',
        'Deploy resources behind CloudFront + ALB to maximise Shield/WAF coverage and leverage AWS edge capacity for attack absorption.',
      ],
    },
    {
      heading: 'AWS WAF — Web Application Firewall',
      points: [
        'Web ACLs attach to CloudFront distributions, ALBs, API Gateways, AppSync APIs, and Cognito User Pools.',
        'Rule types: AWS Managed Rule Groups (OWASP Top 10, Known Bad Inputs, Bot Control), rate-based rules (per-IP cap over 5-min window), geo-match rules, IP set rules, and regex pattern sets.',
        'Rate-based rules: if a single IP exceeds the threshold within the 5-minute rolling window, subsequent requests are blocked. Not per-request — there is a window before blocking activates.',
        'Rule priority: lower priority number = evaluated first. The Web ACL default action (Allow or Block) applies when no rule matches.',
        'WAF logging: stream sampled or full request logs to CloudWatch Logs, S3, or Kinesis Data Firehose for analysis and alerting.',
      ],
    },
    {
      heading: 'Amazon Macie — S3 Data Classification',
      points: [
        'Uses ML to discover and classify sensitive data in S3: PII (SSNs, passport numbers, credit cards), financial data, and credentials (AWS keys, passwords).',
        'Managed data identifiers: 150+ pre-built detectors for common data types. Custom data identifiers: define regex + keywords for proprietary sensitive data.',
        'Discovery jobs run on-demand or on a schedule; automated sensitive data discovery continuously samples objects across all S3 buckets.',
        'Macie also assesses bucket posture: public access status, encryption configuration, replication, and cross-account sharing — flags violations as Policy findings.',
        'Findings flow to Security Hub (ASFF) and EventBridge; trigger Lambda to encrypt unencrypted objects or restrict public access automatically.',
      ],
    },
    {
      heading: 'AWS KMS — Key Management and Envelope Encryption',
      points: [
        'Key types: AWS managed keys (aws/s3, aws/rds — AWS controls), Customer Managed Keys or CMKs (you define key policy and rotation), and BYOK customer-provided keys.',
        'Envelope encryption: KMS generates a plaintext data key and its encrypted copy. Encrypt data in memory with the plaintext key, then store the encrypted data key alongside your ciphertext. Never persist the plaintext key.',
        'Key policy is the primary access control for CMKs — an IAM policy alone cannot grant KMS permissions unless the key policy explicitly trusts the account\'s IAM (usually via the account root principal).',
        'Automatic key rotation: annual rotation of key material; existing ciphertexts remain decryptable because KMS tracks all key versions. Enable with enable-key-rotation.',
        'Key deletion has a 7–30 day waiting period; use cancel-key-deletion within the window if deletion was accidental.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'GuardDuty & Security Hub',
      language: 'bash',
      code: `# Enable GuardDuty in a region
aws guardduty create-detector \\
  --enable \\
  --finding-publishing-frequency FIFTEEN_MINUTES \\
  --region us-east-1

# List detectors (note the detector ID for other commands)
aws guardduty list-detectors --region us-east-1

# List HIGH / CRITICAL severity findings
aws guardduty list-findings \\
  --detector-id <detector-id> \\
  --finding-criteria '{
    "Criterion": {
      "severity": { "Gte": 7 }
    }
  }'

# Get full finding details (can pass multiple IDs)
aws guardduty get-findings \\
  --detector-id <detector-id> \\
  --finding-ids <finding-id-1>

# ─────────────────────────────────────────
# Security Hub — enable and query findings
# ─────────────────────────────────────────
aws securityhub enable-security-hub \\
  --enable-default-standards

# Get CRITICAL and HIGH findings (NEW workflow only)
aws securityhub get-findings \\
  --filters '{
    "SeverityLabel": [
      { "Value": "CRITICAL", "Comparison": "EQUALS" },
      { "Value": "HIGH",     "Comparison": "EQUALS" }
    ],
    "WorkflowStatus": [
      { "Value": "NEW", "Comparison": "EQUALS" }
    ]
  }' \\
  --max-results 20

# Mark a finding as RESOLVED after remediation
aws securityhub batch-update-findings \\
  --finding-identifiers '[{
    "Id": "<finding-id>",
    "ProductArn": "<product-arn>"
  }]' \\
  --workflow '{ "Status": "RESOLVED" }'`,
    },
    {
      label: 'WAF Web ACL',
      language: 'bash',
      code: `# Create WAF Web ACL — REGIONAL scope (for ALB / API Gateway)
aws wafv2 create-web-acl \\
  --name "ProductionWebACL" \\
  --scope REGIONAL \\
  --default-action '{"Allow": {}}' \\
  --rules '[
    {
      "Name": "AWSCommonRules",
      "Priority": 1,
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesCommonRuleSet"
        }
      },
      "OverrideAction": { "None": {} },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "CommonRules"
      }
    },
    {
      "Name": "RateLimitPerIP",
      "Priority": 2,
      "Statement": {
        "RateBasedStatement": {
          "Limit": 100,
          "AggregateKeyType": "IP"
        }
      },
      "Action": { "Block": {} },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "RateLimitPerIP"
      }
    }
  ]' \\
  --visibility-config '{
    "SampledRequestsEnabled": true,
    "CloudWatchMetricsEnabled": true,
    "MetricName": "ProductionWebACL"
  }' \\
  --region us-east-1

# Associate Web ACL with an ALB
aws wafv2 associate-web-acl \\
  --web-acl-arn <web-acl-arn> \\
  --resource-arn <alb-arn> \\
  --region us-east-1

# View WAF sampled requests for debugging
aws wafv2 get-sampled-requests \\
  --web-acl-arn <web-acl-arn> \\
  --rule-metric-name RateLimitPerIP \\
  --scope REGIONAL \\
  --time-window StartTime=2024-01-01T00:00:00Z,EndTime=2024-01-01T01:00:00Z \\
  --max-items 100`,
    },
    {
      label: 'KMS & Envelope Encryption',
      language: 'bash',
      code: `# Create a Customer Managed Key (CMK)
KEY_ID=$(aws kms create-key \\
  --description "Production data encryption key" \\
  --key-usage ENCRYPT_DECRYPT \\
  --key-spec SYMMETRIC_DEFAULT \\
  --query 'KeyMetadata.KeyId' --output text)

# Create a human-friendly alias
aws kms create-alias \\
  --alias-name alias/prod-app-key \\
  --target-key-id "$KEY_ID"

# Enable automatic annual key rotation
aws kms enable-key-rotation --key-id alias/prod-app-key

# ─────────────────────────────────────────
# Envelope Encryption Pattern
# ─────────────────────────────────────────
# Step 1 — Generate a data key (returns Plaintext + CiphertextBlob)
aws kms generate-data-key \\
  --key-id alias/prod-app-key \\
  --key-spec AES_256
# Use Plaintext to encrypt your data in memory.
# Store CiphertextBlob alongside encrypted data.
# NEVER persist the Plaintext data key.

# Step 2 — Later: decrypt the stored encrypted data key
aws kms decrypt \\
  --key-id alias/prod-app-key \\
  --ciphertext-blob fileb://encrypted-data-key.bin \\
  --query 'Plaintext' --output text

# ─────────────────────────────────────────
# Key Policy — grant cross-account access
# ─────────────────────────────────────────
aws kms put-key-policy \\
  --key-id alias/prod-app-key \\
  --policy-name default \\
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "Enable IAM user permissions",
        "Effect": "Allow",
        "Principal": { "AWS": "arn:aws:iam::111122223333:root" },
        "Action": "kms:*",
        "Resource": "*"
      },
      {
        "Sid": "Allow cross-account decrypt only",
        "Effect": "Allow",
        "Principal": { "AWS": "arn:aws:iam::444455556666:role/AppRole" },
        "Action": ["kms:Decrypt", "kms:DescribeKey"],
        "Resource": "*"
      }
    ]
  }'

# Schedule key deletion — minimum 7-day waiting period
aws kms schedule-key-deletion \\
  --key-id "$KEY_ID" \\
  --pending-window-in-days 7

# Cancel accidental deletion within the waiting period
aws kms cancel-key-deletion --key-id "$KEY_ID"`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'IAM grants kms:Decrypt but access is still denied',
      wrong: `// IAM policy allows kms:Decrypt — still get AccessDeniedException
{ "Effect": "Allow", "Action": "kms:Decrypt", "Resource": "arn:aws:kms:..." }`,
      right: `// Key policy MUST also enable IAM (trust the account root):
{
  "Sid": "Enable IAM user permissions",
  "Principal": { "AWS": "arn:aws:iam::ACCOUNT_ID:root" },
  "Action": "kms:*", "Resource": "*"
}
// Then IAM policy refines access per principal.`,
      explanation: 'KMS uses a dual-control model: the key policy AND IAM must both allow the operation. Without a key policy statement that trusts the AWS account\'s IAM, no IAM policy — however permissive — can grant access to that CMK.',
    },
    {
      title: 'Expecting GuardDuty to block threats automatically',
      wrong: `// Enabled GuardDuty and waited for it to block attackers
// SSH brute-force continued unimpeded`,
      right: `// GuardDuty DETECTS — wire EventBridge for automated response:
aws events put-rule --name IsolateOnFinding \\
  --event-pattern '{"source":["aws.guardduty"],"detail":{"severity":[{"numeric":[">=",7]}]}}'
// Target: Lambda that revokes SG rules / adds WAF IP block`,
      explanation: 'GuardDuty emits findings; it does not block traffic or isolate resources itself. Connect EventBridge rules to Lambda functions (or SSM Automation documents) to perform actual remediation like revoking security group rules or blocking IPs via WAF.',
    },
    {
      title: 'WAF rate-based rule does not block the 101st request immediately',
      wrong: `// Set Limit: 100 — expected request 101 to be blocked instantly
// Client still gets through for several more seconds`,
      right: `// Rate-based rules use a 5-minute rolling window.
// Block activates only after the threshold is exceeded within that window.
// For faster response: combine with Bot Control managed rule group.`,
      explanation: 'AWS WAF rate-based rules aggregate request counts per IP over a 5-minute sliding window. A burst is not blocked per-request; the rule activates once the rolling count exceeds the limit within that window.',
    },
    {
      title: 'Assuming Macie protects S3 data after enabling it',
      wrong: `// Enabled Macie — thought sensitive S3 objects were now protected
// Publicly-readable PII was still accessible externally`,
      right: `// Macie CLASSIFIES — act on findings via EventBridge:
// Macie Finding → EventBridge Rule → Lambda
//   → put-public-access-block or move object to encrypted bucket`,
      explanation: 'Macie discovers and classifies sensitive data; it does not enforce access controls. Use its findings (sent to EventBridge and Security Hub) to trigger Lambda-based remediation that restricts access or enforces encryption.',
    },
    {
      title: 'Creating a new CMK and pointing alias at it breaks decryption',
      wrong: `// Created new CMK, reassigned alias — expected old data to still decrypt
aws kms create-alias --alias-name alias/prod-key --target-key-id NEW_KEY_ID
// All existing ciphertexts are now unreadable`,
      right: `// Use automatic rotation — same key ID, rotated material, old data still decrypts:
aws kms enable-key-rotation --key-id alias/prod-key
// Never replace a CMK that has encrypted data; rotate instead.`,
      explanation: 'Replacing a CMK (creating a new one and pointing the alias) does not migrate existing ciphertexts. KMS automatic key rotation generates new key material under the same CMK ID, so all existing ciphertexts remain decryptable transparently.',
    },
    {
      title: 'Using GuardDuty to find unpatched software vulnerabilities',
      wrong: `// Used GuardDuty to detect CVEs on EC2 instances — no findings appeared
// Assumed instances were safe`,
      right: `// GuardDuty = runtime threat detection (network, API behaviour)
// Inspector = CVE scanning (software packages, container images, Lambda layers)
aws inspector2 enable --resource-types EC2 ECR LAMBDA`,
      explanation: 'GuardDuty monitors runtime behaviour and threat intel feeds — it detects compromised credentials and anomalous network activity. Inspector scans deployed software for known CVEs and misconfigurations. Both are needed: GuardDuty for "am I being attacked?" and Inspector for "am I running vulnerable software?".',
    },
  ];

  challenge: Challenge = {
    title: 'WAF + KMS Security Stack (CDK)',
    language: 'typescript',
    description: `Write a CDK TypeScript stack that provisions:
1. A KMS CMK with automatic rotation enabled and alias \`alias/app-key\`
2. A WAF Web ACL (REGIONAL scope) with:
   - AWS Managed Rules Common Rule Set (override action: none — so rules evaluate but use their own actions)
   - A rate-based rule blocking IPs exceeding 200 requests per 5-minute window
   - Default action: Allow
3. CloudFormation Outputs for both the KMS key ARN and the WAF Web ACL ARN

Use \`aws-cdk-lib/aws-kms\` and \`aws-cdk-lib/aws-wafv2\`.`,
    hints: [
      'KMS: `new kms.Key(this, "AppKey", { enableKeyRotation: true })` then `key.addAlias("alias/app-key")`',
      'WAF uses L1 construct `wafv2.CfnWebACL` — there is no L2 for WAF yet',
      'Managed rule group: `managedRuleGroupStatement: { vendorName: "AWS", name: "AWSManagedRulesCommonRuleSet" }` with `overrideAction: { none: {} }` (NOT `action`)',
      'Rate-based rule: `rateBasedStatement: { limit: 200, aggregateKeyType: "IP" }` with `action: { block: {} }` (NOT overrideAction)',
      'Extract VisibilityConfig into a helper function to avoid repeating the shape for each rule',
    ],
    starterCode: `import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export class SecurityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // TODO 1: Create KMS CMK with rotation and alias 'alias/app-key'

    // TODO 2: Create WAF Web ACL (REGIONAL) with:
    //   - AWSManagedRulesCommonRuleSet (priority 1, overrideAction: none)
    //   - Rate limit 200/5min per IP (priority 2, action: block)
    //   - Default action: Allow

    // TODO 3: Output KMS key ARN and WAF Web ACL ARN
  }
}`,
    solution: `import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export class SecurityStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appKey = new kms.Key(this, 'AppKey', {
      description: 'Application data encryption key',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    appKey.addAlias('alias/app-key');

    const vis = (metricName: string): wafv2.CfnWebACL.VisibilityConfigProperty => ({
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName,
    });

    const webAcl = new wafv2.CfnWebACL(this, 'AppWebACL', {
      name: 'AppWebACL',
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: vis('AppWebACL'),
      rules: [
        {
          name: 'CommonRuleSet',
          priority: 1,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: vis('CommonRuleSet'),
        },
        {
          name: 'RateLimitPerIP',
          priority: 2,
          statement: {
            rateBasedStatement: { limit: 200, aggregateKeyType: 'IP' },
          },
          action: { block: {} },
          visibilityConfig: vis('RateLimitPerIP'),
        },
      ],
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', { value: appKey.keyArn });
    new cdk.CfnOutput(this, 'WebAclArn', { value: webAcl.attrArn });
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which data sources does GuardDuty analyse by default (without optional add-ons)?',
      options: [
        'VPC Flow Logs, CloudTrail management events, DNS query logs',
        'CloudWatch Logs, Config rules, S3 access logs',
        'Inspector findings, Macie findings, Security Hub aggregations',
        'EC2 instance memory dumps, OS system calls, network packets',
      ],
      answer: 0,
      explanation: 'GuardDuty analyses VPC Flow Logs, CloudTrail management events, and Route 53 DNS query logs by default. S3 data events and EKS audit logs are optional data sources that must be explicitly enabled.',
    },
    {
      q: 'In envelope encryption, what should you NEVER store persistently?',
      options: [
        'The encrypted ciphertext (output of encrypting your data)',
        'The encrypted data key (CiphertextBlob from KMS)',
        'The plaintext data key returned by generate-data-key',
        'The KMS key ID or alias',
      ],
      answer: 2,
      explanation: 'The plaintext data key is used in-memory to encrypt your data, then immediately discarded. You store the encrypted CiphertextBlob alongside your ciphertext. Persisting the plaintext key would defeat the purpose of envelope encryption.',
    },
    {
      q: 'What layer does AWS Shield Standard protect at?',
      options: [
        'Layer 7 (Application — HTTP/HTTPS)',
        'Layer 3 and 4 (Network/Transport — IP, TCP, UDP)',
        'Layer 2 (Data Link — MAC addresses)',
        'Layer 3/4 and Layer 7 simultaneously',
      ],
      answer: 1,
      explanation: 'Shield Standard provides always-on Layer 3/4 DDoS protection (SYN floods, UDP amplification, reflection attacks). Shield Advanced adds Layer 7 DDoS protection, but requires the $3,000/month plan and WAF integration.',
    },
    {
      q: 'A KMS CMK\'s IAM policy grants kms:Decrypt to an IAM role, but calls still return AccessDenied. What is the most likely cause?',
      options: [
        'The role needs the AdministratorAccess managed policy attached',
        'The key policy does not grant access — IAM alone is insufficient for CMKs',
        'KMS automatic rotation must be enabled before decryption is allowed',
        'The KMS API call is being made from a different region',
      ],
      answer: 1,
      explanation: 'KMS uses dual-control: both the key policy AND IAM must allow the operation. The key policy must include a statement enabling IAM (trusting the account root), otherwise no IAM policy can override the key policy\'s implicit deny.',
    },
    {
      q: 'After enabling Amazon Macie and it discovers credit card numbers in an S3 object, what happens automatically?',
      options: [
        'Macie encrypts the object with the default KMS key',
        'Macie removes the S3 bucket\'s public access settings',
        'A SensitiveData finding is generated and sent to Security Hub and EventBridge',
        'The object is quarantined to a Macie-managed S3 bucket',
      ],
      answer: 2,
      explanation: 'Macie generates a SensitiveData finding and sends it to Security Hub (ASFF) and EventBridge. Macie does NOT take any remediation action — you must build an EventBridge → Lambda pipeline to restrict access or enforce encryption.',
    },
    {
      q: 'What is the role of AWS Security Hub in a multi-account security posture?',
      options: ['It is a firewall service for VPCs', 'It aggregates and prioritizes security findings from GuardDuty, Inspector, IAM Access Analyzer, and other tools across accounts into a unified dashboard against compliance standards', 'It replaces IAM for access control', 'It only works within a single AWS account'],
      answer: 1,
      explanation: 'Security Hub acts as a central aggregation point for security findings from multiple AWS security services and third-party tools, scoring them against standards like CIS AWS Foundations Benchmark and PCI DSS, giving security teams a single dashboard instead of checking each service\'s console individually across every account in an organization.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use Shield Advanced instead of just WAF?',
      a: 'Use Shield Advanced when you face sophisticated volumetric DDoS threats (common in gaming, finance, and media), need 24/7 DDoS Response Team access, want cost protection against scaling charges during an attack, or require real-time attack dashboards. WAF alone handles application-layer filtering (L7) but cannot absorb volumetric L3/4 floods. The two work together: Shield Advanced handles the flood, WAF filters malicious application requests.',
    },
    {
      q: 'How does GuardDuty differ from Amazon Inspector?',
      a: 'GuardDuty is a runtime threat detection service — it analyses network behaviour, API call patterns, and DNS traffic to detect active attacks and anomalies (compromised credentials, crypto-mining, C2 traffic). Inspector is a vulnerability scanner — it examines EC2 instances, ECR container images, and Lambda functions for known CVEs in OS packages and software dependencies. Use both: GuardDuty answers "am I being attacked right now?" while Inspector answers "am I running vulnerable software?".',
    },
    {
      q: 'Can I use a KMS CMK across AWS regions?',
      a: 'Regular CMKs are regional and cannot be used to decrypt data in a different region. For cross-region use cases, AWS offers Multi-Region Keys: KMS creates key replicas with identical key material in multiple regions, allowing you to encrypt in us-east-1 and decrypt in eu-west-1. Alternatively, decrypt in the source region and re-encrypt with a key in the target region.',
    },
    {
      q: 'Does enabling Macie automatically protect my S3 data?',
      a: 'No. Macie is a discovery and classification service — it finds sensitive data and flags policy violations (public buckets, unencrypted objects), but it does not restrict access or encrypt data. Build a remediation pipeline: Macie finding → EventBridge rule → Lambda function that calls put-public-access-block, enforces KMS encryption, or moves the object to a restricted bucket.',
    },
    {
      q: 'How do WAF rate-based rules handle a sudden traffic spike?',
      a: 'WAF rate-based rules aggregate request counts per IP over a rolling 5-minute window. An IP is blocked only after its rolling count exceeds the configured threshold — there can be a window before blocking activates. For faster bot mitigation, combine rate-based rules with the Bot Control managed rule group, which uses device fingerprinting and behavioural signals that act more immediately than pure count-based rules.',
    },
    {
      q: 'What is the difference between GuardDuty and AWS WAF in terms of what each protects against?',
      a: 'GuardDuty is a threat DETECTION service that continuously analyzes account activity (CloudTrail logs, VPC flow logs, DNS logs) using machine learning to identify suspicious behavior — compromised credentials, cryptocurrency mining, reconnaissance activity — after it has already started happening. AWS WAF is a PREVENTIVE web application firewall that sits in front of CloudFront/ALB/API Gateway, blocking known attack patterns (SQL injection, XSS) in incoming HTTP requests before they reach your application. They serve complementary roles: WAF blocks known attack patterns proactively, GuardDuty detects anomalous activity that got through or originated internally.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'GuardDuty detects runtime threats, Security Hub aggregates findings, Shield + WAF block DDoS and application attacks, KMS encrypts data via envelope encryption, and Macie classifies sensitive S3 content.',
    mustKnow: [
      'GuardDuty analyses VPC Flow Logs, CloudTrail, and DNS logs — it detects anomalies, not blocks; use EventBridge + Lambda for remediation',
      'KMS key policy is the root of trust — IAM alone cannot grant CMK access without key policy enabling it',
      'Envelope encryption: generate data key → encrypt data in memory → store encrypted data key; never persist the plaintext key',
      'Shield Standard (free, L3/4 DDoS) vs Shield Advanced ($3k/month, L7 + DRT + cost protection)',
      'WAF rate-based rules aggregate over a 5-minute rolling window — not per-request blocking',
      'Macie classifies S3 data (PII, credentials) but does NOT enforce access controls; build EventBridge remediation pipelines',
      'CMK automatic rotation is transparent — existing ciphertexts remain decryptable after rotation',
    ],
    interviewFocus: [
      '"How does the KMS key policy interact with IAM — which takes precedence?"',
      '"Walk me through envelope encryption and why you never store the plaintext data key"',
      '"What is the difference between GuardDuty and Inspector — when do you use each?"',
      '"How would you design a DDoS-resilient architecture on AWS?"',
    ],
  };
}
