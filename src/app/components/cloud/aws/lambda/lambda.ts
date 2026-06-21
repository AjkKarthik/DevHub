import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  selector: 'app-aws-lambda',
  standalone: true,
  imports: [CommonModule, RouterLink, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './lambda.html',
  styleUrl: './lambda.scss'
})
export class AwsLambda {

  quickRef: QuickRefItem[] = [
    { name: 'Event Source Mapping', type: 'keyword', desc: 'Connects Lambda to SQS, Kinesis, DynamoDB Streams — polling managed by Lambda service.' },
    { name: 'Concurrency', type: 'keyword', desc: 'Reserved concurrency caps a function; provisioned concurrency pre-warms instances to eliminate cold starts.' },
    { name: 'Execution Role', type: 'keyword', desc: 'IAM role assumed by Lambda during invocation — grants permissions to CloudWatch Logs, S3, DynamoDB etc.' },
    { name: 'Lambda Layer', type: 'keyword', desc: 'ZIP archive with shared libraries/binaries attached to multiple functions; counts toward 250 MB deployment limit.' },
    { name: 'Invocation Types', type: 'keyword', desc: 'RequestResponse (sync), Event (async/fire-and-forget), DryRun (permission check).' },
    { name: 'Dead Letter Queue', type: 'keyword', desc: 'SQS or SNS target for failed async invocations after 2 built-in retries.' },
    { name: 'SnapStart', type: 'keyword', desc: 'Java 11/21 only — snapshot JVM after init phase, restore from snapshot on cold start (sub-second latency).' },
    { name: 'Lambda Power Tuning', type: 'keyword', desc: 'Open-source Step Functions state machine that tests memory sizes (128-10240 MB) to find cost/perf sweet spot.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Execution Model & Cold Starts',
      points: [
        'Lambda executes code in firecracker MicroVMs; each execution environment handles one concurrent request.',
        'Cold start = init phase (download code, start runtime, run static initializer) + function invocation. Warm = no init.',
        'Cold starts typically add 100-1000 ms depending on runtime (Node.js/Python < Java/C#) and deployment package size.',
        'Provisioned concurrency pre-initializes environments — eliminates cold start but costs money even when idle.',
        'SnapStart (Java) snapshots the initialized environment; restore takes ~10 ms regardless of package size.',
        'Keep deployment packages small: use layers for large dependencies, avoid unnecessary imports at module level.',
      ]
    },
    {
      heading: 'Triggers & Event Source Mappings',
      points: [
        'Synchronous triggers: API Gateway, ALB, CloudFront@Edge, Cognito, Lex — caller waits for response.',
        'Asynchronous triggers: S3, SNS, EventBridge, IoT — Lambda queues internally, retries 2x on failure, then DLQ.',
        'Polling triggers (event source mappings): SQS, Kinesis, DynamoDB Streams, MSK — Lambda polls and batches.',
        'SQS mapping: Lambda scales up to 60 instances for standard queues; FIFO queues scale per message group.',
        'Kinesis/DynamoDB Streams: one shard = one concurrent Lambda; bisect-on-error splits batch to isolate poison pills.',
        'Event filtering on event source mappings lets Lambda skip irrelevant records (e.g. DynamoDB INSERT only).',
      ]
    },
    {
      heading: 'Concurrency & Scaling',
      points: [
        'Account default: 1000 concurrent executions per region (soft limit; can raise to tens of thousands).',
        'Reserved concurrency: hard cap for a function — prevents it starving others; set to 0 to throttle completely.',
        'Unreserved pool: all functions without reserved concurrency share the regional pool.',
        'Burst limits vary by region (3000/500/1000 initial burst); after burst, scales by 500 per minute.',
        'Throttled requests return HTTP 429 (sync) or queue in async and retry; excess fails if DLQ is not set.',
        'Monitor ConcurrentExecutions and Throttles CloudWatch metrics; set alarms at 80% of reserved cap.',
      ]
    },
    {
      heading: 'Configuration, Layers & Deployment',
      points: [
        'Memory: 128 MB - 10,240 MB. CPU is proportional to memory (1 vCPU at ~1769 MB); I/O and network scale too.',
        'Timeout: max 15 minutes. Default is 3 seconds — always raise for IO-heavy functions.',
        'Environment variables encrypted at rest with Lambda-managed KMS key (or customer CMK).',
        'Layers: attach up to 5 layers per function; total unzipped size (code + layers) 250 MB max.',
        'Container image deployments: up to 10 GB, must implement Lambda Runtime API — good for large ML models.',
        'Aliases + weighted routing: deploy v2 with 10% weight on alias "live" for canary; rollback in seconds.',
        'Function URLs: built-in HTTPS endpoint without API Gateway; supports IAM auth or unauthenticated (public).',
      ]
    },
    {
      heading: 'Observability & Cost',
      points: [
        'Lambda automatically ships invocation logs to CloudWatch Logs (/aws/lambda/<name>) via execution role.',
        'X-Ray active tracing: add AWSXRayDaemonWriteAccess policy, enable tracing in config; SDK auto-instruments AWS SDK calls.',
        'Embedded Metric Format (EMF): write structured JSON to stdout; CloudWatch Logs auto-extracts custom metrics.',
        'Cost = GB-seconds (duration x memory) + $0.20 per 1M requests. Free tier: 400,000 GB-s/month.',
        'Power Tuning: test 7-10 memory settings in parallel; most Node.js functions peak at 512-1024 MB.',
        'Lambda Insights: enhanced CloudWatch metrics (cold starts, init duration, memory used) from Insights layer.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Handler Patterns',
      language: 'bash',
      code: `# Set memory + timeout
aws lambda update-function-configuration \\
  --function-name my-api \\
  --memory-size 512 \\
  --timeout 30

# Set environment variables
aws lambda update-function-configuration \\
  --function-name my-api \\
  --environment "Variables={DB_HOST=rds.example.com,LOG_LEVEL=info}"

# Invoke synchronously
aws lambda invoke \\
  --function-name my-api \\
  --payload '{"path":"/users","method":"GET"}' \\
  --cli-binary-format raw-in-base64-out \\
  response.json && cat response.json

# Invoke asynchronously (fire and forget)
aws lambda invoke \\
  --function-name my-processor \\
  --invocation-type Event \\
  --payload '{"key":"val"}' \\
  --cli-binary-format raw-in-base64-out \\
  /dev/null`,
    },
    {
      label: 'Concurrency & Aliases',
      language: 'bash',
      code: `# Reserve 100 concurrent executions for a critical function
aws lambda put-function-concurrency \\
  --function-name payments-processor \\
  --reserved-concurrent-executions 100

# Provision 10 warm environments (eliminates cold starts)
aws lambda put-provisioned-concurrency-config \\
  --function-name my-api \\
  --qualifier LIVE \\
  --provisioned-concurrent-executions 10

# Publish a version (immutable snapshot)
aws lambda publish-version \\
  --function-name my-api \\
  --description "Release 2.1.0"

# Create alias pointing to version 5
aws lambda create-alias \\
  --function-name my-api \\
  --name LIVE \\
  --function-version 5

# Canary: route 10% to v6, 90% stays on v5
aws lambda update-alias \\
  --function-name my-api \\
  --name LIVE \\
  --function-version 5 \\
  --routing-config "AdditionalVersionWeights={6=0.1}"`,
    },
    {
      label: 'Event Source Mappings',
      language: 'bash',
      code: `# SQS trigger with partial batch failure support
aws lambda create-event-source-mapping \\
  --function-name order-processor \\
  --event-source-arn arn:aws:sqs:us-east-1:123:orders.fifo \\
  --batch-size 10 \\
  --function-response-types ReportBatchItemFailures

# DynamoDB Streams — INSERT events only (event filter)
aws lambda create-event-source-mapping \\
  --function-name stream-handler \\
  --event-source-arn arn:aws:dynamodb:us-east-1:123:table/Orders/stream/2024-01-01 \\
  --batch-size 100 \\
  --starting-position LATEST \\
  --bisect-batch-on-function-error \\
  --filter-criteria 'Filters=[{Pattern="{\"eventName\":[\"INSERT\"]}"}]'

# Kinesis — tumbling window aggregation
aws lambda create-event-source-mapping \\
  --function-name kinesis-aggregator \\
  --event-source-arn arn:aws:kinesis:us-east-1:123:stream/clicks \\
  --batch-size 500 \\
  --starting-position LATEST \\
  --tumbling-window-in-seconds 60

# Dead-letter queue for async invocations
aws lambda update-function-configuration \\
  --function-name my-async-fn \\
  --dead-letter-config "TargetArn=arn:aws:sqs:us-east-1:123:failures"`,
    },
    {
      label: 'Layers & Observability',
      language: 'bash',
      code: `# Publish a Lambda layer (shared dependencies)
zip -r layer.zip nodejs/
aws lambda publish-layer-version \\
  --layer-name shared-utils \\
  --zip-file fileb://layer.zip \\
  --compatible-runtimes nodejs20.x nodejs22.x

# Attach layer to function
aws lambda update-function-configuration \\
  --function-name my-api \\
  --layers arn:aws:lambda:us-east-1:123:layer:shared-utils:3

# Enable X-Ray active tracing
aws lambda update-function-configuration \\
  --function-name my-api \\
  --tracing-config Mode=Active

# Attach Lambda Insights layer (enhanced metrics)
aws lambda update-function-configuration \\
  --function-name my-api \\
  --layers arn:aws:lambda:us-east-1:580247275435:layer:LambdaInsightsExtension:38

# Function URL (no API Gateway needed)
aws lambda create-function-url-config \\
  --function-name my-public-api \\
  --auth-type NONE \\
  --cors '{"AllowOrigins":["https://myapp.com"],"AllowMethods":["GET","POST"]}'

# Query recent errors with Log Insights
aws logs start-query \\
  --log-group-name /aws/lambda/my-api \\
  --start-time 1704067200 \\
  --end-time 1704070800 \\
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | limit 20'`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Ignoring cold start impact on latency SLAs',
      wrong: `# 200 MB Node.js function, no provisioned concurrency
# P99 latency spikes to 1.5s during scale-out
# SLA violations at midnight during traffic bursts`,
      right: `# Use provisioned concurrency for latency-sensitive APIs
aws lambda put-provisioned-concurrency-config \\
  --function-name my-api --qualifier LIVE \\
  --provisioned-concurrent-executions 10
# Java: enable SnapStart instead (cheaper)
# All runtimes: minimize package size with bundlers`,
      explanation: 'Cold starts are unpredictable — baseline 50 ms but can spike to 1 s on scale-out. For APIs with sub-200 ms SLAs, use provisioned concurrency or SnapStart (Java).'
    },
    {
      title: 'No reserved concurrency on critical functions',
      wrong: `# No reserved concurrency configured
# A burst of S3 events floods the regional concurrency pool
# Payments processor throttled — 429s to customers`,
      right: `aws lambda put-function-concurrency \\
  --function-name payments-processor \\
  --reserved-concurrent-executions 200
# Also cap non-critical background workers
aws lambda put-function-concurrency \\
  --function-name batch-resizer \\
  --reserved-concurrent-executions 50`,
      explanation: 'Without reserved concurrency a noisy-neighbour Lambda exhausts the shared regional pool. Reserve for both high-priority functions (floor) and low-priority workers (ceiling).'
    },
    {
      title: 'Opening database connections per invocation',
      wrong: `// Inside handler — new connection every call
exports.handler = async (event) => {
  const pool = new Pool({ host: process.env.DB_HOST });
  const result = await pool.query('SELECT * FROM users');
  await pool.end();
};`,
      right: `// Outside handler — reused across warm invocations
const { Pool } = require('pg');
const pool = new Pool({ host: process.env.DB_HOST });

exports.handler = async (event) => {
  const result = await pool.query('SELECT * FROM users');
  return result.rows;
};
// Under high concurrency: add RDS Proxy`,
      explanation: 'Module-level code runs once per execution environment and is reused on warm invocations. Per-invocation pool creation wastes TCP handshake time and exhausts DB connection limits.'
    },
    {
      title: 'Leaving timeout at the 3-second default',
      wrong: `# Default 3-second timeout on function calling external API
# External API occasionally takes 5 seconds
# Task timed out after 3.00 seconds — silent failure`,
      right: `aws lambda update-function-configuration \\
  --function-name data-fetcher \\
  --timeout 30
# Rule: set timeout = p99 duration x 2 (buffer for retries)
# Add CloudWatch alarm on Duration metric approaching timeout`,
      explanation: 'The 3-second default is too short for anything involving I/O. Measure actual p99 duration in CloudWatch and set timeout to 2x that value.'
    },
    {
      title: 'Storing secrets as plaintext environment variables',
      wrong: `aws lambda update-function-configuration \\
  --function-name my-api \\
  --environment "Variables={DB_PASSWORD=mysecretpassword}"
# Visible in console, CLI output, and CloudTrail`,
      right: `# Store in Secrets Manager, fetch at module scope (cached)
# const secret = await secretsClient.send(
#   new GetSecretValueCommand({ SecretId: "prod/db/password" })
# );
# Cache the value — avoid fetching on every warm invocation
# Grant secretsmanager:GetSecretValue in execution role`,
      explanation: 'Environment variables are visible in CloudTrail and the Lambda console to anyone with lambda:GetFunctionConfiguration. Store secrets in Secrets Manager or SSM Parameter Store and cache in module scope.'
    },
  ];

  challenge: Challenge = {
    title: 'Build an S3-Triggered Image Resizer',
    language: 'typescript',
    description: `Design a Lambda function that:
1. Triggers on S3 PUT events for objects in the "uploads/" prefix
2. Reads the uploaded image and resizes it to 300x300
3. Writes the thumbnail to "thumbnails/" prefix in a separate bucket
4. Emits custom CloudWatch metrics (originalBytes, resizedBytes) using EMF
5. Routes failed events to an SQS dead-letter queue

Specify: the execution role minimum permissions, memory setting, and timeout value.`,
    hints: [
      'Sharp (image library) is a native module — must be in a Layer built for Amazon Linux 2023',
      'S3 event provides bucket + key in Records[0].s3.bucket.name and .object.key',
      'EMF: write a JSON object with _aws.CloudWatchMetrics to stdout — no SDK call needed',
      'Execution role needs s3:GetObject on uploads/* and s3:PutObject on thumbnails/*',
      '512 MB memory is a good starting point for image processing; timeout 30s',
    ],
    starterCode: `// S3-Triggered Image Resizer Lambda

// Event shape: S3Event from @types/aws-lambda
// import sharp from 'sharp'; // via Lambda Layer

export const handler = async (event: any): Promise<void> => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));

    // TODO: skip keys not starting with 'uploads/'
    // TODO: get the object from S3
    // TODO: resize with sharp to 300x300, JPEG output
    // TODO: put the thumbnail to processed-images/thumbnails/<filename>
    // TODO: emit EMF metrics to stdout
  }
};

// TODO: define execution role IAM policy
// TODO: specify memory (MB) and timeout (seconds)
`,
    solution: `import { S3Event } from 'aws-lambda';
import sharp from 'sharp';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3 = new S3Client({});

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function emitEMF(originalBytes: number, resizedBytes: number) {
  console.log(JSON.stringify({
    _aws: {
      Timestamp: Date.now(),
      CloudWatchMetrics: [{
        Namespace: 'ImageResizer',
        Dimensions: [['FunctionName']],
        Metrics: [
          { Name: 'OriginalBytes', Unit: 'Bytes' },
          { Name: 'ResizedBytes', Unit: 'Bytes' }
        ]
      }]
    },
    FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
    OriginalBytes: originalBytes,
    ResizedBytes: resizedBytes,
  }));
}

export const handler = async (event: S3Event): Promise<void> => {
  for (const record of event.Records) {
    const srcBucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));
    if (!key.startsWith('uploads/')) continue;

    const filename = key.replace('uploads/', '');
    const destKey = \`thumbnails/\${filename}\`;

    const { Body, ContentLength } = await s3.send(
      new GetObjectCommand({ Bucket: srcBucket, Key: key })
    );
    const input = await streamToBuffer(Body as Readable);
    const resized = await sharp(input)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();

    await s3.send(new PutObjectCommand({
      Bucket: 'processed-images',
      Key: destKey,
      Body: resized,
      ContentType: 'image/jpeg',
    }));

    emitEMF(ContentLength ?? input.length, resized.length);
  }
};

// Execution role permissions:
// s3:GetObject  — arn:aws:s3:::raw-images/uploads/*
// s3:PutObject  — arn:aws:s3:::processed-images/thumbnails/*
// AWSLambdaBasicExecutionRole — CloudWatch Logs (automatic)

// Memory: 512 MB  |  Timeout: 30 s
// Sharp layer: build on Amazon Linux 2023 (x86_64 or arm64)`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the maximum execution timeout for a Lambda function?',
      options: ['5 minutes', '10 minutes', '15 minutes', '30 minutes'],
      answer: 2,
      explanation: 'Lambda functions can run for up to 15 minutes (900 seconds). For longer-running tasks, use Step Functions to orchestrate multiple Lambda calls, or switch to ECS/Fargate.',
    },
    {
      q: 'Which feature eliminates Lambda cold starts for Java functions?',
      options: ['Provisioned Concurrency', 'Reserved Concurrency', 'Lambda SnapStart', 'Lambda Layers'],
      answer: 2,
      explanation: 'SnapStart (Java 11/21+) snapshots the execution environment after the init phase. The snapshot is restored in ~10 ms on cold start, regardless of JVM startup time.',
    },
    {
      q: 'An SQS event source mapping keeps retrying a poison-pill message that always fails. What configuration prevents it from blocking the queue indefinitely?',
      options: [
        'Increase the visibility timeout',
        'Enable bisect-on-function-error or use ReportBatchItemFailures',
        'Set reserved concurrency to 1',
        'Enable DLQ on the Lambda function (not the SQS queue)',
      ],
      answer: 1,
      explanation: 'bisect-on-function-error splits a failing batch in half to isolate the bad message. ReportBatchItemFailures lets the function return which specific message IDs failed so only those are retried, not the whole batch.',
    },
    {
      q: 'Where should database connection pools be initialized in a Lambda function?',
      options: [
        'Inside the handler function, every invocation',
        'Inside an async init() called by the handler',
        'Outside the handler, at module scope',
        'In a Lambda Layer initialization file',
      ],
      answer: 2,
      explanation: 'Module-level code runs once per execution environment and is reused across warm invocations. Creating a pool in the handler recreates it every call, wasting time and exhausting DB connections.',
    },
    {
      q: 'What happens to asynchronous Lambda invocations when the function is throttled?',
      options: [
        'They are dropped immediately with no retry',
        'They are returned to the caller with HTTP 429',
        'They queue internally and retry for up to 6 hours',
        'They are sent directly to the DLQ',
      ],
      answer: 2,
      explanation: 'Lambda queues async invocations internally and retries them for up to 6 hours with exponential backoff. Only after exhausting retries are events sent to the DLQ (if configured).',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use Lambda Function URLs instead of API Gateway?',
      a: 'Function URLs are ideal for simple single-function HTTP endpoints: webhooks, health checks, or internal microservices where you do not need API Gateway features like request validation, custom authorisers, usage plans, or WebSocket support. Function URLs are cheaper (no per-request API Gateway charge) and simpler to set up. Use API Gateway when you need rate limiting, API keys, JWT authorisers, request/response transformations, or a unified stage/deployment model across many Lambda functions.',
    },
    {
      q: 'How does Lambda pricing compare to always-on EC2 for variable workloads?',
      a: 'Lambda charges only for actual execution time (GB-seconds) plus $0.20 per million requests. For spiky or low-volume workloads, Lambda is nearly free. EC2 bills hourly regardless of utilisation. The break-even is roughly 2-3 vCPUs of constant usage (~$50-100/month); above that, EC2 Reserved Instances or Fargate Spot become cheaper. Lambda also eliminates OS patching, scaling configuration, and idle capacity costs.',
    },
    {
      q: 'What is the difference between reserved and provisioned concurrency?',
      a: 'Reserved concurrency is a hard cap that limits how many concurrent executions a function can have, protecting other functions in the account from being starved. It has no effect on cold starts and is free. Provisioned concurrency pre-initialises a set number of execution environments so they are ready to handle requests immediately, eliminating cold starts — but costs money even when idle.',
    },
    {
      q: 'How do Lambda Layers work and when should I use them?',
      a: 'Layers are immutable ZIP archives extracted to /opt in the execution environment before the handler runs. Use layers for: large shared libraries (AWS SDK, Sharp, Pandas) to avoid bloating each deployment package; custom runtimes; Lambda extensions (monitoring agents). Layers count toward the 250 MB total unzipped size limit. Build native modules (Sharp, bcrypt) for Amazon Linux 2023 matching the function architecture (x86_64 or arm64).',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Lambda runs stateless functions triggered by events; concurrency, cold starts, and connection reuse are the three knobs that determine cost and latency.',
    mustKnow: [
      'Cold starts: init phase adds 100-1000 ms; mitigated by SnapStart (Java) or provisioned concurrency',
      'Execution model: one concurrent request per environment; module-level code reused on warm invocations',
      'Concurrency: reserved (hard cap, free), provisioned (pre-warm, costs money), burst limits per region',
      'Event source mappings: SQS/Kinesis/DynamoDB Streams — Lambda polls; bisect-on-error isolates poison pills',
      'Layers: shared code ZIP extracted to /opt; total unzipped size (code + layers) max 250 MB',
      'Timeout max 15 minutes; memory 128 MB - 10 GB; CPU scales proportionally with memory',
    ],
    interviewFocus: [
      'Cold start vs warm start: explain init phase and how to eliminate cold starts per runtime',
      'Reserved vs provisioned concurrency: when to use each and their cost implications',
      'Connection pooling anti-pattern: why module scope matters vs per-invocation creation',
      'SQS event source mapping + ReportBatchItemFailures for partial batch success patterns',
    ],
  };
}
