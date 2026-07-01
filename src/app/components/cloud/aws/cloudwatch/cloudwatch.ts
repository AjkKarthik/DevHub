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
  selector: 'app-aws-cloudwatch',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './cloudwatch.html',
  styleUrl: './cloudwatch.scss'
})
export class AwsCloudwatch {

  quickRef: QuickRefItem[] = [
    { name: 'Metric', type: 'keyword', desc: 'Time-series data point with namespace, metric name, dimensions, value, and unit. Retained 15 months; granularity 1s–1d.' },
    { name: 'Alarm', type: 'keyword', desc: 'Monitors a metric or expression; transitions between OK / ALARM / INSUFFICIENT_DATA states; triggers SNS/auto-scaling actions.' },
    { name: 'Log Group', type: 'keyword', desc: 'Container for log streams sharing the same retention policy; Lambda auto-creates /aws/lambda/<name>.' },
    { name: 'Log Insights', type: 'keyword', desc: 'Interactive SQL-like query engine for CloudWatch Logs — filter, parse, stats, sort across log groups.' },
    { name: 'Metric Filter', type: 'keyword', desc: 'Extracts metric data from log entries using pattern matching — e.g. count ERROR occurrences per minute.' },
    { name: 'X-Ray Trace', type: 'keyword', desc: 'End-to-end request trace across services; composed of segments (per service) and subsegments (per operation).' },
    { name: 'X-Ray Service Map', type: 'keyword', desc: 'Visual graph of all services + average latency and error rate per edge — identifies bottlenecks at a glance.' },
    { name: 'EMF (Embedded Metric Format)', type: 'keyword', desc: 'Structured JSON written to stdout; CloudWatch Logs auto-extracts named metrics — no PutMetricData API call needed.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'CloudWatch Metrics & Alarms',
      points: [
        'Metrics have namespace (e.g. AWS/Lambda), metric name (Duration), and dimensions (FunctionName=my-api).',
        'Standard resolution: 1-minute granularity. High-resolution (custom metrics): 1-second granularity at 1x cost.',
        'Statistics: Average, Sum, Min, Max, SampleCount, Percentile (p90, p99) — always alarm on percentiles for latency.',
        'Alarm states: OK (metric within threshold), ALARM (threshold breached), INSUFFICIENT_DATA (not enough data points).',
        'Alarm evaluation: M out of N data points breach threshold. Use M=2, N=3 to avoid single-spike false alarms.',
        'Alarm actions: SNS notification, EC2 auto-scaling, Lambda invocation, Systems Manager OpsItem.',
        'Composite alarms: combine multiple alarms with AND/OR logic — reduce alert noise by grouping related conditions.',
        'Anomaly detection: ML model learns metric baseline; alarm when metric is outside the expected band.',
      ]
    },
    {
      heading: 'CloudWatch Logs & Log Insights',
      points: [
        'Log groups → log streams → log events. Each Lambda invocation writes to its own log stream.',
        'Retention: set per log group (1 day to 10 years or never expire). Lambda defaults to never expire — always set retention.',
        'Metric filters: define pattern (e.g. "[ERROR]") → extract numeric value → publish as CloudWatch Metric automatically.',
        'Log Insights query syntax: fields, filter, parse, stats, sort, limit — runs across multiple log groups.',
        'Common queries: error rate (stats count(*) by bin(5m) | filter @message like /ERROR/), p99 latency, cold starts.',
        'Log Insights saves query results for 7 days; schedule recurring queries via CloudWatch scheduled rules.',
        'Subscription filters: stream log events in real time to Lambda, Kinesis, Kinesis Firehose for processing/archiving.',
        'Cross-account log aggregation: use subscription filter + Kinesis Firehose → S3 in a central logging account.',
      ]
    },
    {
      heading: 'X-Ray Tracing',
      points: [
        'X-Ray traces end-to-end requests: API Gateway → Lambda → DynamoDB, capturing latency at each hop.',
        'Segment: one service\'s contribution to a trace. Subsegment: individual operation within a segment (DB query, HTTP call).',
        'X-Ray SDK: auto-instruments AWS SDK calls; manually instrument business logic with subsegments.',
        'Sampling: default 1 req/s + 5% beyond that — adjust sampling rules to capture more traces at higher cost.',
        'Service map: visual graph with nodes (services) and edges (calls); each edge shows avg latency + error rate.',
        'Groups: filter traces by attributes (user ID, route, error type) for targeted analysis.',
        'X-Ray Insights: ML-based anomaly detection that identifies unusual patterns in trace data automatically.',
        'Integration: enable X-Ray on Lambda config, API Gateway stage, ECS task, and EC2 X-Ray daemon.',
      ]
    },
    {
      heading: 'Dashboards & Custom Metrics',
      points: [
        'CloudWatch Dashboards: multi-region multi-account views; can mix metrics, alarms, and Log Insights widgets.',
        'PutMetricData API: publish custom metrics from application code (e.g. order processing time, queue depth).',
        'EMF (Embedded Metric Format): write structured JSON to stdout; CloudWatch Logs auto-extracts metrics. Zero extra API calls.',
        'EMF example: console.log(JSON.stringify({_aws:{...CloudWatchMetrics}, OrderValue: 99.99})) in Lambda.',
        'Metric Math: combine metrics with math expressions in dashboards and alarms (e.g. errors/requests = error rate).',
        'Container Insights: enhanced metrics for ECS/EKS (CPU, memory per task/pod) — install CloudWatch agent.',
        'Lambda Insights: init duration, cold start count, memory used — installed via Lambda Insights extension layer.',
      ]
    },
    {
      heading: 'Alerting Best Practices',
      points: [
        'Alarm on percentiles (p99 latency) not averages — averages hide tail latency that affects user experience.',
        'Set appropriate evaluation period: Lambda errors → 1 min; RDS storage → 5 min; capacity planning → 1 hour.',
        'SNS topic per severity (info, warning, critical) → different subscribers (email, PagerDuty, Slack).',
        'Alarm on DLQ depth (ApproximateNumberOfMessagesVisible > 0) for SQS and Lambda DLQ.',
        '4 Golden Signals: Latency, Traffic, Errors, Saturation — model all alarms around these for any service.',
        'Suppress maintenance noise with alarm actions: use EventBridge + Lambda to suppress SNS during known windows.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Metrics & Alarms',
      language: 'bash',
      code: `# Put a custom metric
aws cloudwatch put-metric-data \\
  --namespace MyApp/Orders \\
  --metric-name OrderValue \\
  --value 99.99 \\
  --unit None \\
  --dimensions Service=checkout,Environment=prod

# Create an alarm on Lambda error rate
aws cloudwatch put-metric-alarm \\
  --alarm-name lambda-errors-high \\
  --metric-name Errors \\
  --namespace AWS/Lambda \\
  --dimensions Name=FunctionName,Value=my-api \\
  --period 60 \\
  --evaluation-periods 3 \\
  --datapoints-to-alarm 2 \\
  --threshold 5 \\
  --comparison-operator GreaterThanOrEqualToThreshold \\
  --statistic Sum \\
  --alarm-actions arn:aws:sns:us-east-1:123:ops-alerts \\
  --ok-actions arn:aws:sns:us-east-1:123:ops-alerts

# Alarm on p99 Lambda latency
aws cloudwatch put-metric-alarm \\
  --alarm-name lambda-p99-latency \\
  --metric-name Duration \\
  --namespace AWS/Lambda \\
  --dimensions Name=FunctionName,Value=my-api \\
  --period 300 \\
  --evaluation-periods 2 \\
  --threshold 2000 \\
  --comparison-operator GreaterThanThreshold \\
  --extended-statistic p99 \\
  --alarm-actions arn:aws:sns:us-east-1:123:ops-alerts

# Check current alarm states
aws cloudwatch describe-alarms \\
  --alarm-name-prefix lambda \\
  --state-value ALARM`,
    },
    {
      label: 'Log Insights Queries',
      language: 'bash',
      code: `# Start a Log Insights query
aws logs start-query \\
  --log-group-name /aws/lambda/my-api \\
  --start-time $(date -d '1 hour ago' +%s) \\
  --end-time $(date +%s) \\
  --query-string 'fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20'

# Get query results (use queryId from start-query)
aws logs get-query-results --query-id abc123

# Useful Log Insights queries:

# Count errors per 5 minutes
# fields @timestamp
# | filter @message like /ERROR/
# | stats count(*) as errorCount by bin(5m)
# | sort bin asc

# Lambda cold start analysis
# filter @type = "REPORT"
# | stats avg(@initDuration), max(@initDuration), count(@initDuration) as coldStarts
#   by bin(30m)

# p99 duration per function
# filter @type = "REPORT"
# | stats pct(@duration, 99) as p99, avg(@duration) as avg, count(*) as invocations
#   by @logStream

# Set log group retention (always do this for Lambda!)
aws logs put-retention-policy \\
  --log-group-name /aws/lambda/my-api \\
  --retention-in-days 30

# Create metric filter: count ERRORs from logs
aws logs put-metric-filter \\
  --log-group-name /aws/lambda/my-api \\
  --filter-name error-count \\
  --filter-pattern "[ERROR]" \\
  --metric-transformations metricName=LambdaErrors,metricNamespace=MyApp,metricValue=1`,
    },
    {
      label: 'X-Ray Configuration',
      language: 'bash',
      code: `# Enable X-Ray on Lambda function
aws lambda update-function-configuration \\
  --function-name my-api \\
  --tracing-config Mode=Active

# Enable X-Ray on API Gateway stage
aws apigateway update-stage \\
  --rest-api-id xyz789 \\
  --stage-name prod \\
  --patch-operations op=replace,path=/tracingEnabled,value=true

# Get X-Ray trace summaries (last hour)
aws xray get-trace-summaries \\
  --start-time $(date -d '1 hour ago' +%s) \\
  --end-time $(date +%s) \\
  --filter-expression 'responsetime > 2'

# Get service map
aws xray get-service-graph \\
  --start-time $(date -d '1 hour ago' +%s) \\
  --end-time $(date +%s)

# Custom X-Ray subsegment in Lambda (Node.js pattern)
# const AWSXRay = require('aws-xray-sdk-core');
# const segment = AWSXRay.getSegment();
# const subsegment = segment.addNewSubsegment('database-query');
# try {
#   const result = await db.query(...);
#   subsegment.close();
#   return result;
# } catch (err) {
#   subsegment.addError(err);
#   subsegment.close();
#   throw err;
# }

# Create X-Ray sampling rule (capture all /health requests at 0%)
aws xray create-sampling-rule \\
  --sampling-rule '{
    "RuleName": "ignore-health",
    "Priority": 1,
    "ReservoirSize": 0,
    "FixedRate": 0,
    "URLPath": "/health",
    "Host": "*",
    "HTTPMethod": "*",
    "ServiceType": "*",
    "ServiceName": "*",
    "ResourceARN": "*",
    "Version": 1
  }'`,
    },
    {
      label: 'Dashboards & EMF',
      language: 'bash',
      code: `# Create a CloudWatch dashboard
aws cloudwatch put-dashboard \\
  --dashboard-name api-overview \\
  --dashboard-body '{
    "widgets": [
      {
        "type": "metric",
        "properties": {
          "title": "Lambda p99 Duration",
          "metrics": [["AWS/Lambda","Duration","FunctionName","my-api",{"stat":"p99","period":60}]],
          "period": 60, "view": "timeSeries"
        }
      },
      {
        "type": "metric",
        "properties": {
          "title": "Error Rate",
          "metrics": [
            ["AWS/Lambda","Errors","FunctionName","my-api",{"stat":"Sum"}],
            ["AWS/Lambda","Invocations","FunctionName","my-api",{"stat":"Sum"}]
          ]
        }
      }
    ]
  }'

# EMF in Lambda — publish custom metrics without PutMetricData
# Write this JSON object to stdout (console.log) in Lambda:
# {
#   "_aws": {
#     "Timestamp": 1704067200000,
#     "CloudWatchMetrics": [{
#       "Namespace": "MyApp",
#       "Dimensions": [["FunctionName","Environment"]],
#       "Metrics": [{"Name":"OrderValue","Unit":"None"},{"Name":"ProcessingTime","Unit":"Milliseconds"}]
#     }]
#   },
#   "FunctionName": "checkout",
#   "Environment": "prod",
#   "OrderValue": 99.99,
#   "ProcessingTime": 45
# }
# CloudWatch Logs auto-extracts OrderValue and ProcessingTime as metrics

# List dashboards
aws cloudwatch list-dashboards`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Alarming on average latency instead of percentiles',
      wrong: `# Alarm on average Lambda duration
aws cloudwatch put-metric-alarm \\
  --metric-name Duration --statistic Average --threshold 500
# Average = 200ms — alarm never fires
# But p99 = 3000ms — 1% of users experience 3s latency
# SLA breach invisible until user complaints arrive`,
      right: `aws cloudwatch put-metric-alarm \\
  --metric-name Duration \\
  --extended-statistic p99 \\
  --threshold 2000
# p99 captures the tail latency that impacts real users
# Also set p90 alarm at a lower threshold for early warning`,
      explanation: 'Averages mask tail latency. A p99 of 3s means 1% of users experience slow responses — at 1000 req/s that is 10 affected users per second. Always alarm on p99 (and p90 for warning) for latency-sensitive services.'
    },
    {
      title: 'Never setting log group retention on Lambda',
      wrong: `# Lambda log group created with default retention: never expire
# 3 years later: /aws/lambda/my-api has 50 GB of logs
# CloudWatch Logs charges $0.03/GB-month = $1.50/month just for old logs
# Some groups have PII in plaintext — compliance risk`,
      right: `# Set retention immediately after function creation (or via IaC)
aws logs put-retention-policy \\
  --log-group-name /aws/lambda/my-api \\
  --retention-in-days 30
# Use 7 days for high-volume debug logs
# Use 90 days for audit/compliance logs
# Automate via Lambda on CloudWatch Logs CreateLogGroup event`,
      explanation: 'Lambda auto-creates log groups with no expiry. Logs accumulate indefinitely, incurring storage costs and potential compliance risks. Always set retention — 30 days is a reasonable default; adjust per compliance requirements.'
    },
    {
      title: 'Insufficient data points in alarm evaluation',
      wrong: `# Single data point alarm (M=1, N=1)
aws cloudwatch put-metric-alarm \\
  --evaluation-periods 1 \\
  --datapoints-to-alarm 1 \\
  --threshold 10
# A single Lambda cold start spike fires the alarm
# On-call paged at 2am for a one-off blip
# False positive — alarm resolves itself 60 seconds later`,
      right: `aws cloudwatch put-metric-alarm \\
  --evaluation-periods 3 \\
  --datapoints-to-alarm 2 \\
  --threshold 10
# "2 out of 3 data points breach threshold" = sustained problem
# Eliminates single-point spikes while catching real issues
# Adjust based on how quickly you need to detect the problem`,
      explanation: 'M-of-N evaluation (datapoints-to-alarm of evaluation-periods) prevents false alarms from single spikes. For critical alarms, use 2/3 or 3/5. For SLA-critical services, 1/1 with a tight threshold may be appropriate if you need instant alerting.'
    },
    {
      title: 'Using X-Ray default sampling (misses high-traffic traces)',
      wrong: `# Default sampling: 1 req/s + 5% of additional requests
# At 10,000 req/s: captures 1 + 499 = 500 traces/s (5%)
# A latency spike lasting 30 seconds: 500 traces captured
# Most are normal — spike traces may not be captured at all`,
      right: `# Create custom sampling rules for critical paths
aws xray create-sampling-rule \\
  --sampling-rule '{
    "RuleName": "slow-requests",
    "Priority": 1,
    "ReservoirSize": 50,
    "FixedRate": 1.0,
    "URLPath": "/checkout/*",
    "HTTPMethod": "POST",
    "ServiceType": "AWS::Lambda::Function",
    ...
  }'
# FixedRate=1.0 = 100% sampling for checkout POST
# Set 0% on /health and /metrics to save cost`,
      explanation: 'Default sampling at 5% means 95% of traces are not captured. For debugging, increase sampling on critical or slow paths. Set 0% on health-check and metrics endpoints that would dominate trace counts without value.'
    },
    {
      title: 'Publishing custom metrics with PutMetricData inside Lambda hot path',
      wrong: `// In Lambda handler — called on every invocation
exports.handler = async (event) => {
  const result = await processOrder(event);
  // PutMetricData API call on every invocation
  await cloudwatch.putMetricData({ Namespace: 'MyApp', MetricData: [{ MetricName: 'OrderCount', Value: 1 }] }).promise();
  return result;
};
// At 1000 req/s: 1000 PutMetricData calls/s = extra Lambda duration + cost`,
      right: `// Use EMF — write JSON to stdout, no API call
exports.handler = async (event) => {
  const result = await processOrder(event);
  console.log(JSON.stringify({
    _aws: { Timestamp: Date.now(), CloudWatchMetrics: [{ Namespace: 'MyApp', Dimensions: [[]], Metrics: [{ Name: 'OrderCount', Unit: 'Count' }] }] },
    OrderCount: 1
  }));
  return result;
};
// CloudWatch Logs extracts the metric for free — zero API calls`,
      explanation: 'PutMetricData adds latency and cost to every Lambda invocation. EMF (Embedded Metric Format) writes structured JSON to stdout; CloudWatch Logs automatically extracts metrics from it at no extra API cost. Always prefer EMF for high-volume Lambda metrics.'
    },
  ];

  challenge: Challenge = {
    title: 'Build a Production Observability Stack',
    language: 'typescript',
    description: `Design a complete observability setup for a Lambda-based API:
1. CloudWatch alarm on p99 latency > 2000ms (2-of-3 evaluation)
2. CloudWatch alarm on error rate > 1% (errors/invocations metric math)
3. Log Insights query to find top 10 slowest requests in the last hour
4. X-Ray enabled with custom sampling rule: 100% for /checkout, 0% for /health
5. EMF in the Lambda handler to publish OrderValue metric

Provide the alarm, sampling rule, Log Insights query, and EMF code.`,
    hints: [
      'Error rate = METRICS_MATH: m1/m2 * 100 where m1=Errors, m2=Invocations',
      'Metric math alarms use --metrics array with Id, Expression fields',
      'Log Insights: filter @type = "REPORT" | stats max(@duration), avg(@duration) | sort max desc | limit 10',
      'X-Ray sampling rule: FixedRate=1.0 for checkout, separate rule priority=2 FixedRate=0 for health',
      'EMF: write to stdout with _aws.CloudWatchMetrics — no SDK import needed',
    ],
    starterCode: `// Production Observability Stack

// 1. p99 Latency Alarm
// aws cloudwatch put-metric-alarm \\
//   --alarm-name api-p99-latency \\
//   ... (fill in the parameters)

// 2. Error Rate Alarm (Metric Math)
// aws cloudwatch put-metric-alarm \\
//   --alarm-name api-error-rate \\
//   --metrics [...] \\
//   ... (error rate = errors/invocations * 100)

// 3. Log Insights Query for slowest requests
const slowestQuery = \`
  // TODO: filter REPORT lines, get max duration, sort descending
\`;

// 4. X-Ray Sampling Rules
// Rule A: 100% for POST /checkout
// Rule B: 0% for GET /health

// 5. Lambda EMF handler
export const handler = async (event: any) => {
  const start = Date.now();
  const result = await processOrder(event);
  const duration = Date.now() - start;

  // TODO: emit EMF with OrderValue and ProcessingTime metrics
  console.log(/* ... EMF JSON ... */);

  return result;
};

async function processOrder(event: any) { return {}; }
`,
    solution: `// 1. p99 Latency Alarm
// aws cloudwatch put-metric-alarm \\
//   --alarm-name api-p99-latency \\
//   --metric-name Duration \\
//   --namespace AWS/Lambda \\
//   --dimensions Name=FunctionName,Value=my-api \\
//   --period 60 --evaluation-periods 3 --datapoints-to-alarm 2 \\
//   --threshold 2000 --comparison-operator GreaterThanThreshold \\
//   --extended-statistic p99 \\
//   --alarm-actions arn:aws:sns:us-east-1:123:ops-critical

// 2. Error Rate Alarm (Metric Math: errors/invocations * 100)
// aws cloudwatch put-metric-alarm \\
//   --alarm-name api-error-rate \\
//   --evaluation-periods 3 --datapoints-to-alarm 2 \\
//   --threshold 1 --comparison-operator GreaterThanThreshold \\
//   --metrics '[
//     {"Id":"m1","MetricStat":{"Metric":{"Namespace":"AWS/Lambda","MetricName":"Errors","Dimensions":[{"Name":"FunctionName","Value":"my-api"}]},"Period":60,"Stat":"Sum"}},
//     {"Id":"m2","MetricStat":{"Metric":{"Namespace":"AWS/Lambda","MetricName":"Invocations","Dimensions":[{"Name":"FunctionName","Value":"my-api"}]},"Period":60,"Stat":"Sum"}},
//     {"Id":"e1","Expression":"(m1/m2)*100","Label":"ErrorRate%","ReturnData":true}
//   ]' \\
//   --alarm-actions arn:aws:sns:us-east-1:123:ops-critical

// 3. Log Insights: Top 10 Slowest Requests
const slowestQuery = \`
filter @type = "REPORT"
| fields @requestId, @duration, @billedDuration, @memorySize, @maxMemoryUsed, @initDuration
| sort @duration desc
| limit 10
\`;

// 4. X-Ray Sampling Rules
// Rule A (priority 1): 100% for POST /checkout
// aws xray create-sampling-rule --sampling-rule '{
//   "RuleName":"checkout-full","Priority":1,"ReservoirSize":100,
//   "FixedRate":1.0,"URLPath":"/checkout*","HTTPMethod":"POST",
//   "ServiceType":"*","ServiceName":"*","Host":"*","ResourceARN":"*","Version":1
// }'
// Rule B (priority 2): 0% for /health
// aws xray create-sampling-rule --sampling-rule '{
//   "RuleName":"ignore-health","Priority":2,"ReservoirSize":0,
//   "FixedRate":0,"URLPath":"/health","HTTPMethod":"*",
//   "ServiceType":"*","ServiceName":"*","Host":"*","ResourceARN":"*","Version":1
// }'

// 5. Lambda handler with EMF
export const handler = async (event: any): Promise<any> => {
  const start = Date.now();
  const result = await processOrder(event);
  const processingTime = Date.now() - start;
  const orderValue = event.amount ?? 0;

  console.log(JSON.stringify({
    _aws: {
      Timestamp: Date.now(),
      CloudWatchMetrics: [{
        Namespace: 'MyApp/Orders',
        Dimensions: [['FunctionName', 'Environment']],
        Metrics: [
          { Name: 'OrderValue', Unit: 'None' },
          { Name: 'ProcessingTime', Unit: 'Milliseconds' }
        ]
      }]
    },
    FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
    Environment: process.env.ENVIRONMENT ?? 'prod',
    OrderValue: orderValue,
    ProcessingTime: processingTime,
  }));

  return result;
};

async function processOrder(event: any) { return { success: true }; }`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'An alarm is configured with evaluation-periods=3 and datapoints-to-alarm=1. What does this mean?',
      options: [
        'The alarm triggers only when all 3 data points breach the threshold',
        'The alarm triggers when at least 1 of the last 3 data points breaches the threshold',
        'The alarm evaluates data once every 3 minutes',
        'The alarm requires 3 consecutive breaches before triggering',
      ],
      answer: 1,
      explanation: 'datapoints-to-alarm=1, evaluation-periods=3 means "1 of the last 3 data points must breach." This is sensitive — a single spike triggers the alarm. To reduce false positives for non-critical alarms, use 2/3 or 3/5.',
    },
    {
      q: 'What is the advantage of Embedded Metric Format (EMF) over PutMetricData for Lambda?',
      options: [
        'EMF supports higher metric resolution (1-second granularity)',
        'EMF writes metrics to stdout — no extra API call, no added latency or cost',
        'EMF allows metrics to be stored in S3 instead of CloudWatch',
        'EMF bypasses CloudWatch Logs and writes directly to CloudWatch Metrics',
      ],
      answer: 1,
      explanation: 'EMF writes a structured JSON object to stdout (console.log). CloudWatch Logs automatically extracts the metrics — no PutMetricData API call needed. This eliminates the SDK overhead, reduces Lambda duration, and avoids per-request API costs.',
    },
    {
      q: 'What does X-Ray active tracing capture automatically when enabled on a Lambda function?',
      options: [
        'Only the Lambda cold start duration',
        'The full trace including outgoing AWS SDK calls (DynamoDB, S3, SQS) as subsegments',
        'Only inbound HTTP requests from API Gateway',
        'CPU and memory utilisation per Lambda invocation',
      ],
      answer: 1,
      explanation: 'When X-Ray active tracing is enabled on Lambda and the AWS X-Ray SDK is included, it automatically instruments outgoing AWS SDK calls (DynamoDB queries, S3 operations, SQS sends) as subsegments in the trace. Custom subsegments can be added for business logic.',
    },
    {
      q: 'A Lambda log group has never had a retention policy set. What is the default retention?',
      options: ['7 days', '30 days', '1 year', 'Never expire (infinite)'],
      answer: 3,
      explanation: 'CloudWatch Logs groups default to never expire. Lambda auto-creates log groups with this default. Logs accumulate indefinitely, incurring storage costs at $0.03/GB-month. Always set a retention policy matching your compliance requirements.',
    },
    {
      q: 'Which CloudWatch Logs feature would you use to automatically create a metric from the count of ERROR log lines?',
      options: ['Log Insights', 'Metric Filter', 'Subscription Filter', 'Log Anomaly Detector'],
      answer: 1,
      explanation: 'Metric Filters parse log events using a pattern (e.g. "[ERROR]") and extract numeric values as CloudWatch Metrics automatically, without any additional code. Log Insights is for interactive queries. Subscription Filters stream logs to external destinations.',
    },
    {
      q: 'What is the difference between a CloudWatch Metric and a CloudWatch Log?',
      options: ['They are the same thing with different names', 'Metrics are numeric time-series data points (CPU%, request count); Logs are text-based event records emitted by applications and services', 'Metrics are for Lambda only; Logs are for EC2 only', 'Logs are always more expensive than Metrics'],
      answer: 1,
      explanation: 'Metrics are lightweight numeric data points used for dashboards and alarms (e.g., CPUUtilization). Logs are detailed text records (application output, access logs) stored in Log Groups, searchable via CloudWatch Logs Insights — useful for debugging specific events that a metric alone cannot explain.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What are the 4 Golden Signals and how do I implement them in CloudWatch?',
      a: 'The 4 Golden Signals (from Google SRE) are: (1) Latency — alarm on p99 Duration for Lambda, Target Response Time for ALB; (2) Traffic — Invocations for Lambda, RequestCount for ALB; (3) Errors — Errors metric with Sum stat for Lambda, HTTP 5xx for ALB; (4) Saturation — ConcurrentExecutions as % of reserved concurrency for Lambda, CPUUtilization for EC2. Model all alarms around these four for any service — they collectively tell you whether the service is healthy from a user perspective.',
    },
    {
      q: 'How does X-Ray sampling work and when should I change the default?',
      a: 'Default sampling: 1 request per second per host, plus 5% of additional requests. At 10,000 req/s, only ~501 traces are captured (5%). This is sufficient for normal operation but may miss specific error patterns. Change sampling when: (1) debugging a critical path — set 100% for that route temporarily; (2) a route generates expensive traces at high volume (e.g. health checks) — set 0%; (3) a low-traffic critical path is under-represented — increase ReservoirSize. Custom sampling rules are prioritized by their Priority number (lower = higher priority).',
    },
    {
      q: 'What is the difference between a CloudWatch Alarm and a Composite Alarm?',
      a: 'A regular CloudWatch Alarm monitors one metric or metric math expression and transitions between OK/ALARM/INSUFFICIENT_DATA based on threshold. A Composite Alarm combines multiple alarms with AND/OR logic — it only transitions to ALARM when the logical expression is true. Use Composite Alarms to: (1) reduce alert noise — "ALARM if error rate is high AND traffic is above normal (not a deployment)"; (2) create a single parent alarm per service that consolidates multiple child alarms; (3) avoid paging on a single metric spike by requiring correlated conditions.',
    },
    {
      q: 'How do I query logs across multiple Lambda functions simultaneously in Log Insights?',
      a: 'Log Insights supports querying multiple log groups in a single query. In the console, select multiple log groups from the dropdown. Via CLI, pass multiple --log-group-names arguments or use a log group prefix with --log-group-name-prefix. You can also use a CloudWatch Logs query with log group wildcards. A common pattern: query /aws/lambda/* to search all Lambda functions, then filter by @logStream or parse the function name from @logStream to find cross-function errors or correlate a request ID across service boundaries.',
    },
    {
      q: 'What is a CloudWatch composite alarm and why would you use one?',
      a: 'A composite alarm combines the state of multiple existing alarms using AND/OR logic (e.g., alert only if BOTH high CPU AND high error rate alarms are in ALARM state simultaneously). This reduces alert noise from individual metric blips by requiring a more meaningful, correlated combination of conditions before paging on-call engineers — useful for reducing false-positive incidents.',
    },
    {
      q: 'How does CloudWatch Logs Insights differ from simply searching raw log streams?',
      a: 'CloudWatch Logs Insights provides a purpose-built query language (similar to SQL) to filter, parse, aggregate, and visualize log data across one or many log groups — for example, computing p99 latency from structured JSON logs or counting errors by type over a time window. This is far more powerful than manually scrolling through or grep-style searching raw log streams, especially for high-volume production logs.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'CloudWatch provides metrics, alarms, and log analytics for AWS; X-Ray adds distributed tracing — together they implement the 4 Golden Signals across a serverless architecture.',
    mustKnow: [
      'Alarm on p99 latency (not average) — averages hide tail latency that impacts users',
      'M-of-N evaluation (e.g. 2/3) prevents false alarms from single spikes',
      'Log group retention defaults to never expire — always set a policy to control cost',
      'EMF over PutMetricData: write structured JSON to stdout, zero extra API calls',
      'X-Ray: segments per service, subsegments per operation; default 5% sampling — tune per path',
      '4 Golden Signals: Latency, Traffic, Errors, Saturation — model all alarms around these',
    ],
    interviewFocus: [
      'Why alarm on p99 not average: explain tail latency impact at scale with an example',
      'EMF vs PutMetricData: cost and latency trade-offs for high-volume Lambda metrics',
      'X-Ray sampling: default rate, when to increase/decrease, and how sampling rules work',
      'Log retention: default behavior and compliance/cost implications of not setting it',
    ],
  };
}
