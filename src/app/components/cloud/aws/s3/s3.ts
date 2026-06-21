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
  selector: 'app-aws-s3',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './s3.html',
  styleUrl: './s3.scss'
})
export class AwsS3 {

  quickRef: QuickRefItem[] = [
    { name: 'Bucket', type: 'class', desc: 'Global-namespace container for objects; name must be globally unique across all AWS accounts.' },
    { name: 'Object Key', type: 'keyword', desc: 'Full path within the bucket (e.g. images/2024/photo.jpg). S3 is flat; "folders" are key prefixes.' },
    { name: 'Versioning', type: 'keyword', desc: 'Keeps all versions of an object including deletions (as delete markers). Cannot be disabled once enabled — only suspended.' },
    { name: 'Presigned URL', type: 'keyword', desc: 'Time-limited signed URL allowing temporary GET or PUT access to a private object without AWS credentials.' },
    { name: 'Lifecycle Rule', type: 'class', desc: 'Automates transitions between storage classes and expiration of objects/versions based on age or prefix.' },
    { name: 'Replication', type: 'keyword', desc: 'CRR (Cross-Region) or SRR (Same-Region) — asynchronously copies objects to a destination bucket. Requires versioning.' },
    { name: 'S3 Transfer Acceleration', type: 'keyword', desc: 'Routes uploads through CloudFront edge locations for faster global uploads to a single bucket.' },
    { name: 'Multipart Upload', type: 'keyword', desc: 'Upload objects >100 MB in parallel parts (5 MB–5 GB each) — required for objects >5 GB.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'S3 Storage Classes',
      points: [
        'S3 Standard: 99.99% availability, replicated across ≥3 AZs, immediate retrieval. Default for frequently accessed data. ~$0.023/GB/month.',
        'S3 Standard-IA (Infrequent Access): lower storage cost (~$0.0125/GB) but $0.01/GB retrieval fee + 30-day minimum storage duration. Use for backups accessed monthly.',
        'S3 One Zone-IA: single AZ (23% cheaper than Standard-IA) — data lost if AZ is destroyed. Use for re-creatable data only.',
        'S3 Glacier Instant Retrieval: millisecond retrieval, 90-day minimum. Ideal for quarterly archives still needing fast access.',
        'S3 Glacier Flexible Retrieval: minutes to hours retrieval (3 tiers: Expedited 1-5 min, Standard 3-5 h, Bulk 5-12 h). Good for disaster recovery archives.',
        'S3 Glacier Deep Archive: lowest cost ($0.00099/GB), 12–48 h retrieval, 180-day minimum. For compliance and long-term data retention.',
        'S3 Intelligent-Tiering: monitors access patterns and automatically moves objects between frequent/infrequent/archive tiers. Small monitoring fee ($0.0025/1000 objects); no retrieval charges.',
      ]
    },
    {
      heading: 'Versioning & Delete Markers',
      points: [
        'Once versioning is enabled on a bucket, every PUT creates a new version with a unique version ID. All versions are retained and billed.',
        'Deleting a versioned object (without specifying a version ID) places a delete marker — the object appears deleted but all versions remain. Specify the version ID to permanently delete a version.',
        'MFA Delete: requires MFA to permanently delete a version or change versioning state. Add to prevent accidental or malicious deletions.',
        'Object Lock: WORM (Write Once Read Many) compliance. Governance mode allows privileged users to override; Compliance mode prohibits deletion/modification by anyone including root.',
        'Versioning cannot be disabled — only suspended. New writes stop creating versions; existing versions are retained.',
      ]
    },
    {
      heading: 'Lifecycle Rules',
      points: [
        'Lifecycle rules apply to a prefix (e.g. logs/) or the entire bucket. Each rule can have transitions and/or expiration actions.',
        'Transition: move objects to a cheaper class after N days. Example: Standard → Standard-IA after 30 days → Glacier Flexible after 90 days → expire after 365 days.',
        'Minimum storage duration charges: Standard-IA (30 days), Glacier Instant (90 days), Glacier Flexible (90 days), Deep Archive (180 days). Deleting early still incurs the minimum charge.',
        'Expire non-current versions: with versioning enabled, add a rule to expire non-current object versions after N days to control storage costs.',
        'Lifecycle rules are eventually consistent — they run on a background schedule, not in real-time. Objects may persist a day or two beyond the expiry date.',
      ]
    },
    {
      heading: 'Replication',
      points: [
        'Cross-Region Replication (CRR): copy objects to a bucket in a different region — for compliance, DR, or reducing latency for global users.',
        'Same-Region Replication (SRR): replicate within a region — for log aggregation, test/prod sync, or data sovereignty with multiple accounts.',
        'Both require versioning on source and destination buckets. An IAM role grants S3 permission to read source and write destination.',
        'Replication is asynchronous — typically completes within minutes. Replication Time Control (RTC) guarantees 99.99% of objects are replicated within 15 minutes (additional cost).',
        'Only new objects are replicated by default. To replicate existing objects, use S3 Batch Operations with a Replicate action.',
      ]
    },
    {
      heading: 'Access Control & Presigned URLs',
      points: [
        'Bucket policies: JSON, applied at the bucket level. Block Public Access settings override policies — all 4 should be ON for private buckets.',
        'ACLs are legacy — AWS recommends disabling ACLs (Object Ownership = Bucket owner enforced) and using bucket policies instead.',
        'Presigned URLs: generated by the SDK/CLI using caller credentials. The URL includes the signature — any holder can access the object until expiry. Max expiry: 7 days (SigV4), 12 hours (temporary credentials).',
        'Presigned PUT URLs allow external upload directly to S3 without proxy — the client uploads directly from browser/mobile, reducing server load.',
        'S3 Access Points: named endpoints with their own access policies — simplify managing access across many prefixes and IAM principals in a large shared bucket.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Bucket Operations',
      language: 'bash',
      code: `# Create a bucket (bucket name must be globally unique)
aws s3api create-bucket \\
  --bucket my-company-data-prod \\
  --region eu-west-1 \\
  --create-bucket-configuration LocationConstraint=eu-west-1

# Enable versioning
aws s3api put-bucket-versioning \\
  --bucket my-company-data-prod \\
  --versioning-configuration Status=Enabled

# Block all public access (always do this for private buckets)
aws s3api put-public-access-block \\
  --bucket my-company-data-prod \\
  --public-access-block-configuration \\
    BlockPublicAcls=true,IgnorePublicAcls=true,\\
    BlockPublicPolicy=true,RestrictPublicBuckets=true

# Enable server-side encryption with KMS
aws s3api put-bucket-encryption \\
  --bucket my-company-data-prod \\
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "aws:kms",
        "KMSMasterKeyID": "arn:aws:kms:eu-west-1:123:key/abc"
      },
      "BucketKeyEnabled": true
    }]
  }'

# Upload, download, sync
aws s3 cp localfile.csv s3://my-company-data-prod/reports/
aws s3 sync ./output/ s3://my-company-data-prod/output/ --delete
aws s3 cp s3://my-company-data-prod/reports/localfile.csv ./

# List objects with versions
aws s3api list-object-versions --bucket my-company-data-prod --prefix reports/`,
    },
    {
      label: 'Lifecycle Rules',
      language: 'bash',
      code: `# Add lifecycle rule: Standard -> IA after 30d -> Glacier after 90d -> expire after 365d
aws s3api put-bucket-lifecycle-configuration \\
  --bucket my-company-data-prod \\
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "archive-logs",
        "Status": "Enabled",
        "Filter": { "Prefix": "logs/" },
        "Transitions": [
          { "Days": 30,  "StorageClass": "STANDARD_IA" },
          { "Days": 90,  "StorageClass": "GLACIER" },
          { "Days": 180, "StorageClass": "DEEP_ARCHIVE" }
        ],
        "Expiration": { "Days": 365 }
      },
      {
        "ID": "cleanup-old-versions",
        "Status": "Enabled",
        "Filter": { "Prefix": "" },
        "NoncurrentVersionExpiration": { "NoncurrentDays": 90 },
        "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
      }
    ]
  }'

# Get current lifecycle configuration
aws s3api get-bucket-lifecycle-configuration --bucket my-company-data-prod`,
    },
    {
      label: 'Presigned URLs',
      language: 'bash',
      code: `# Generate a presigned GET URL (valid 1 hour)
aws s3 presign s3://my-company-data-prod/reports/q4-results.csv \\
  --expires-in 3600

# Generate a presigned PUT URL using the API (for browser uploads)
aws s3api get-presigned-url \\
  --bucket my-company-data-prod \\
  --key uploads/user-avatar.jpg \\
  --http-method PUT \\
  --expires-in 900

# TypeScript SDK example (Node.js)
# import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
# import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
#
# const client = new S3Client({ region: "eu-west-1" });
#
# // Presigned GET
# const getUrl = await getSignedUrl(client,
#   new GetObjectCommand({ Bucket: "my-company-data-prod", Key: "reports/q4.csv" }),
#   { expiresIn: 3600 }
# );
#
# // Presigned PUT (for direct browser upload)
# const putUrl = await getSignedUrl(client,
#   new PutObjectCommand({ Bucket: "my-company-data-prod", Key: \`uploads/\${userId}/file.jpg\` }),
#   { expiresIn: 900 }
# );

# Restore an archived Glacier object
aws s3api restore-object \\
  --bucket my-company-data-prod \\
  --key archive/report-2020.csv \\
  --restore-request '{ "Days": 7, "GlacierJobParameters": { "Tier": "Standard" } }'`,
    },
    {
      label: 'Replication',
      language: 'bash',
      code: `# Enable replication: source -> destination (both need versioning)
aws s3api put-bucket-replication \\
  --bucket source-bucket \\
  --replication-configuration '{
    "Role": "arn:aws:iam::123:role/S3ReplicationRole",
    "Rules": [
      {
        "ID": "replicate-all",
        "Status": "Enabled",
        "Filter": { "Prefix": "" },
        "Destination": {
          "Bucket": "arn:aws:s3:::destination-bucket",
          "ReplicationTime": {
            "Status": "Enabled",
            "Time": { "Minutes": 15 }
          },
          "Metrics": {
            "Status": "Enabled",
            "EventThreshold": { "Minutes": 15 }
          },
          "StorageClass": "STANDARD_IA"
        },
        "DeleteMarkerReplication": { "Status": "Enabled" }
      }
    ]
  }'

# Replicate existing objects (S3 Batch Operations)
aws s3control create-job \\
  --account-id 123456789012 \\
  --operation '{ "S3ReplicateObject": {} }' \\
  --manifest-generator '{
    "S3JobManifestGenerator": {
      "SourceBucket": "arn:aws:s3:::source-bucket",
      "EnableManifestOutput": false
    }
  }' \\
  --report '{ "Enabled": false }' \\
  --role-arn arn:aws:iam::123:role/BatchReplicationRole \\
  --no-confirmation-required`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Bucket with public access for CloudFront origin',
      wrong: `# Made bucket public so CloudFront can read it
aws s3api put-bucket-acl --bucket my-site --acl public-read
# Anyone can bypass CloudFront and read objects directly via S3 URL`,
      right: `# Keep bucket private; use OAC (Origin Access Control)
# Only CloudFront can read objects via SigV4-signed requests
# Set Block Public Access ON for all 4 settings`,
      explanation: 'A public bucket means users can bypass CloudFront (and its WAF, geo-restrictions, signed URLs). Use OAC — the bucket stays private and CloudFront uses SigV4 to authenticate. This is the security-correct pattern for all CloudFront + S3 setups.'
    },
    {
      title: 'Not setting an AbortIncompleteMultipartUpload lifecycle rule',
      wrong: `# No lifecycle rule for incomplete multipart uploads
# Initiated multipart uploads that fail leave orphaned parts
# Each part is billed at Standard storage rates indefinitely`,
      right: `{
  "ID": "abort-incomplete-mpu",
  "Status": "Enabled",
  "Filter": { "Prefix": "" },
  "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
}`,
      explanation: 'Incomplete multipart uploads (from failed or abandoned uploads) accumulate silently and are billed at Standard storage rates. An AbortIncompleteMultipartUpload lifecycle rule automatically cleans them up after N days — add this to every bucket.'
    },
    {
      title: 'Deleting versioned objects without specifying version IDs',
      wrong: `# Delete an object from a versioned bucket without specifying version ID
aws s3 rm s3://my-bucket/important-file.csv
# Places a delete marker — object appears gone but all versions still stored and billed`,
      right: `# List versions, then delete each version and delete markers
aws s3api list-object-versions --bucket my-bucket --prefix important-file.csv
# Delete a specific version:
aws s3api delete-object --bucket my-bucket --key important-file.csv --version-id VERSION_ID
# Or delete all versions + markers with S3 Batch Operations for many objects`,
      explanation: 'In a versioned bucket, aws s3 rm places a delete marker instead of removing data. All previous versions remain stored and billed. To truly delete, you must list and delete each version ID and delete marker explicitly, or use a lifecycle rule to expire non-current versions.'
    },
    {
      title: 'Using S3 Standard for archival data that is rarely accessed',
      wrong: `# Storing 10 TB of 5-year-old log archives in S3 Standard
# Cost: 10,000 GB × $0.023 = $230/month
# Accessed once a year for compliance audit`,
      right: `# Use Glacier Deep Archive for true long-term archival
# Cost: 10,000 GB × $0.00099 = $9.90/month
# Add a lifecycle rule to transition after 180 days if starting fresh`,
      explanation: 'S3 Standard costs 23× more per GB than Glacier Deep Archive. For data accessed less than once per year, Glacier Deep Archive ($0.00099/GB) saves over 95% on storage. Use lifecycle rules to automatically transition old objects rather than keeping them in Standard indefinitely.'
    },
    {
      title: 'Presigned URL generated with root credentials expiring after 7 days max',
      wrong: `# Generated presigned URL using an IAM role (temporary credentials)
# Temporary credential session expires in 1 hour
# Presigned URL expiry set to 7 days
# URL stops working after 1 hour — session token expiry takes precedence`,
      right: `# For long-lived presigned URLs, use long-lived IAM user credentials
# OR use a Lambda that generates fresh presigned URLs on-demand
# Presigned URL expiry is capped by credential lifetime`,
      explanation: 'A presigned URL is only valid as long as both the expiry time AND the underlying credential are valid. Temporary role credentials expire when the session does — even if the URL was generated with a 7-day expiry. Use long-lived IAM user credentials or regenerate URLs close to when they are needed.'
    },
  ];

  challenge: Challenge = {
    title: 'S3 Lifecycle Policy for Log Archive',
    language: 'typescript',
    description: `Write the S3 lifecycle configuration JSON for a log bucket. Requirements: (1) Transition objects under the prefix 'logs/' from Standard to Standard-IA after 30 days; (2) Transition to Glacier Flexible Retrieval after 90 days; (3) Expire objects after 365 days; (4) Expire non-current object versions after 30 days; (5) Abort incomplete multipart uploads after 7 days.`,
    hints: [
      'All these can be in one rule or separate rules — one rule is simpler.',
      'Transitions array: each object needs Days and StorageClass.',
      'GLACIER is the StorageClass value for Glacier Flexible Retrieval.',
      'NoncurrentVersionExpiration uses NoncurrentDays.',
      'AbortIncompleteMultipartUpload uses DaysAfterInitiation.',
    ],
    starterCode: `const lifecycleConfig = {
  Rules: [
    {
      ID: "log-archive-policy",
      Status: "Enabled",
      Filter: { Prefix: "logs/" },
      Transitions: [
        // TODO: Standard -> Standard-IA after 30 days
        // TODO: Standard-IA -> Glacier after 90 days
      ],
      Expiration: {
        // TODO: expire after 365 days
      },
      NoncurrentVersionExpiration: {
        // TODO: expire non-current versions after 30 days
      },
      AbortIncompleteMultipartUpload: {
        // TODO: abort after 7 days
      }
    }
  ]
};

console.log(JSON.stringify(lifecycleConfig, null, 2));`,
    solution: `const lifecycleConfig = {
  Rules: [
    {
      ID: "log-archive-policy",
      Status: "Enabled",
      Filter: { Prefix: "logs/" },
      Transitions: [
        { Days: 30,  StorageClass: "STANDARD_IA" },
        { Days: 90,  StorageClass: "GLACIER" }
      ],
      Expiration: {
        Days: 365
      },
      NoncurrentVersionExpiration: {
        NoncurrentDays: 30
      },
      AbortIncompleteMultipartUpload: {
        DaysAfterInitiation: 7
      }
    }
  ]
};

console.log(JSON.stringify(lifecycleConfig, null, 2));

// Apply:
// aws s3api put-bucket-lifecycle-configuration \\
//   --bucket my-log-bucket \\
//   --lifecycle-configuration "$(echo lifecycleConfig | jq .)"`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which S3 storage class automatically moves objects between tiers based on access patterns?',
      options: ['S3 Standard', 'S3 Standard-IA', 'S3 Intelligent-Tiering', 'S3 Glacier Instant Retrieval'],
      answer: 2,
      explanation: 'S3 Intelligent-Tiering monitors access frequency and automatically moves objects between frequent access, infrequent access, and archive tiers. A small monitoring fee per object is charged, but there are no retrieval fees — ideal when access patterns are unknown or unpredictable.'
    },
    {
      q: 'What happens when you delete an object in a versioned S3 bucket without specifying a version ID?',
      options: [
        'The object and all versions are permanently deleted',
        'A delete marker is placed and all versions are retained',
        'The latest version is permanently deleted; previous versions remain',
        'The deletion fails with an error'
      ],
      answer: 1,
      explanation: 'In a versioned bucket, deleting without a version ID places a delete marker. The object appears to be deleted (ls/GET returns 404) but all previous versions remain stored and billed. Specify the version ID to permanently delete a version.'
    },
    {
      q: 'What is the maximum duration for a presigned URL generated with temporary IAM role credentials?',
      options: ['7 days', '12 hours or session duration — whichever is shorter', '24 hours', '1 hour'],
      answer: 1,
      explanation: 'Presigned URL validity is bounded by the lifetime of the credentials used to generate it. Temporary role credentials expire when the session expires (typically 1-12 hours). Even if you set expiry to 7 days, the URL becomes invalid when the session token expires.'
    },
    {
      q: 'Which S3 storage class has the lowest retrieval cost but a 12-48 hour retrieval time?',
      options: ['S3 Glacier Flexible Retrieval', 'S3 Glacier Deep Archive', 'S3 Standard-IA', 'S3 Glacier Instant Retrieval'],
      answer: 1,
      explanation: 'S3 Glacier Deep Archive has the lowest storage cost ($0.00099/GB) and a 12-48 hour retrieval time. It is designed for data that must be retained for 7-10+ years for compliance and is accessed once or twice a year at most.'
    },
    {
      q: 'S3 Cross-Region Replication requires which feature to be enabled on both source and destination buckets?',
      options: ['Block Public Access', 'Versioning', 'Server-side encryption', 'Transfer Acceleration'],
      answer: 1,
      explanation: 'Both source and destination buckets must have versioning enabled for CRR or SRR to work. Replication operates on a per-version basis — without versioning, S3 cannot track which objects need replication.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do multipart uploads work and when should you use them?',
      a: 'Multipart upload splits a large object into parts (5 MB to 5 GB each, minimum 5 MB except last part) that are uploaded in parallel, then S3 assembles them. Benefits: parallelism speeds up upload (especially from fast connections), individual part failures can be retried without re-uploading the entire file, and objects larger than 5 GB REQUIRE multipart upload. Best practice: use multipart for any object over 100 MB. Always add an AbortIncompleteMultipartUpload lifecycle rule to clean up orphaned parts from failed uploads.'
    },
    {
      q: 'What is the difference between S3 replication and S3 versioning?',
      a: 'Versioning maintains all historical versions of an object within the same bucket — it is about history and recovery within one location. Replication copies objects to a different bucket (same or different region/account) — it is about redundancy, compliance, and proximity to users. They are complementary: replication requires versioning, and having both gives you cross-location history (replicated objects also have version histories in the destination bucket).'
    },
    {
      q: 'How does S3 Intelligent-Tiering decide when to move an object?',
      a: 'Intelligent-Tiering monitors each object\'s access frequency independently. Objects not accessed for 30 days move to the Infrequent Access tier. Objects not accessed for 90 days move to Archive Instant Access. For 180 days, objects move to Archive Access (Glacier-compatible). For 730 days, to Deep Archive Access. Any access immediately moves the object back to the Frequent Access tier. A per-object monitoring fee ($0.0025/1000 objects/month) applies; there are no retrieval fees between tiers.'
    },
    {
      q: 'How do S3 bucket policies differ from IAM policies for access control?',
      a: 'IAM policies are identity-based — attached to IAM users/roles and define what S3 actions that identity can perform across any bucket. Bucket policies are resource-based — attached to the bucket and define who (any principal, including cross-account and anonymous) can access that bucket. For cross-account access, bucket policies are required (IAM alone cannot grant cross-account S3 access). For anonymous public access (website hosting), bucket policies grant s3:GetObject to Principal: "*". For same-account controlled access, either works but bucket policies are simpler for S3-specific access patterns.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'S3 is infinitely scalable object storage — storage classes + lifecycle rules manage cost; versioning + replication enable durability; presigned URLs and bucket policies control access.',
    mustKnow: [
      'Storage class ladder: Standard → Standard-IA → Glacier Instant → Glacier Flexible → Deep Archive',
      'Intelligent-Tiering auto-tiers by access frequency; no retrieval fees between tiers',
      'Versioning: delete without version ID = delete marker; specify ID = permanent delete',
      'Lifecycle rules: transition transitions, NoncurrentVersionExpiration for version cleanup, AbortIncompleteMultipartUpload for orphaned parts',
      'CRR/SRR: versioning required on both buckets; only new objects by default (Batch Ops for existing)',
      'Presigned URL lifespan bounded by the session duration of the credentials used',
      'OAC keeps S3 private for CloudFront; Block Public Access = ON for private buckets',
    ],
    interviewFocus: [
      'Storage class selection criteria — access frequency, retrieval time, minimum duration',
      'Versioning delete markers vs permanent deletion — when each happens',
      'Presigned URL expiry and the session credential caveat',
      'Why multipart upload is required for >5 GB objects and best practice for >100 MB',
      'CRR vs SRR use cases — compliance, DR, latency reduction, log aggregation',
    ],
  };
}
