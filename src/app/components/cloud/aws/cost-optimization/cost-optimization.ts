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
  selector: 'app-aws-cost-optimization',
  standalone: true,
  imports: [
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent,
  ],
  templateUrl: './cost-optimization.html',
  styleUrl: './cost-optimization.scss',
})
export class AwsCostOptimization {
  quickRef: QuickRefItem[] = [
    { name: 'Compute Savings Plans', type: 'keyword', desc: 'Commit $/hr to any EC2/Fargate/Lambda; up to 66% off; most flexible savings plan' },
    { name: 'EC2 Instance SP', type: 'keyword', desc: 'Commit to a specific instance family+region; up to 72% off; less flexible than Compute SP' },
    { name: 'Reserved Instances', type: 'keyword', desc: 'Standard (72% off) or Convertible (66% off); 1 or 3-year term; applies to specific instance type' },
    { name: 'Spot Instances', type: 'keyword', desc: 'Up to 90% off for fault-tolerant workloads; 2-minute interruption warning before reclaim' },
    { name: 'Cost Explorer', type: 'keyword', desc: '13-month cost history, forecast, Savings Plans/RI recommendations, filtering by tag/service/account' },
    { name: 'AWS Budgets', type: 'keyword', desc: 'Alert when actual or forecasted cost/usage exceeds a threshold (% or absolute); can trigger SNS/actions' },
    { name: 'Compute Optimizer', type: 'keyword', desc: 'ML-based rightsizing recs for EC2, EBS, Lambda, ASG, ECS on Fargate — finds over- and under-provisioned resources' },
    { name: 'Cost Allocation Tags', type: 'keyword', desc: 'Tag resources (Project, Env, Team) → activate in Billing → filter Cost Explorer by tag' },
    { name: 'S3 Intelligent-Tiering', type: 'keyword', desc: 'Auto-moves objects between access tiers; no retrieval fee; monitoring fee per object >128 KB' },
    { name: 'Data Transfer Cost', type: 'keyword', desc: 'Inter-AZ = $0.01/GB each way; cross-region varies; use VPC endpoints + same-AZ to minimise egress' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Savings Plans vs Reserved Instances',
      points: [
        'Savings Plans are commitment-based discounts on AWS compute usage expressed as $/hour spend over 1 or 3 years — more flexible than Reserved Instances.',
        'Compute Savings Plans: cover any EC2 instance (any family, size, region, OS), Fargate tasks, and Lambda invocations. Up to 66% discount. Best for dynamic or changing workloads.',
        'EC2 Instance Savings Plans: commit to a specific instance family and region (e.g. m5 in us-east-1). Up to 72% discount — the deepest discount available with Savings Plans.',
        'Reserved Instances (Standard RIs): specific instance type+size+region. Up to 72% off. Can be sold on the RI Marketplace if unused. Convertible RIs allow attribute changes but offer only 66% off.',
        'Payment options: No Upfront (no capital outlay, lower discount), Partial Upfront, or All Upfront (maximum discount). Use Cost Explorer\'s recommendation tab to see the right commitment level based on your trailing usage.',
      ],
    },
    {
      heading: 'Spot Instances — Variable Cost Compute',
      points: [
        'Spot Instances use spare EC2 capacity at up to 90% off On-Demand pricing. AWS can reclaim them with a 2-minute interruption notice when capacity is needed.',
        'Best for: batch processing, CI/CD workers, stateless web tier, EMR/data pipelines, HPC jobs — workloads that can checkpoint state and resume elsewhere.',
        'Spot interruption handling: poll the instance metadata endpoint every 5 seconds; on interruption notice, drain, checkpoint, and terminate gracefully.',
        'Use Spot with Auto Scaling Groups and the capacity-optimized allocation strategy: ASG picks the Spot pool with the most available capacity, minimising interruptions.',
        'Maintain a baseline of On-Demand or Reserved capacity (e.g. 2 On-Demand + N Spot) so the service continues if Spot capacity dries up in your target pools.',
      ],
    },
    {
      heading: 'Cost Explorer and AWS Budgets',
      points: [
        'Cost Explorer provides 13 months of cost history, forecasting up to 12 months, and filters by service, region, account, usage type, and cost allocation tag.',
        'Use the Savings Plans and Reserved Instance recommendation pages in Cost Explorer: they calculate the optimal commitment level based on your trailing 30, 60, or 90-day usage.',
        'AWS Budgets: create cost, usage, RI utilisation, or Savings Plan coverage budgets. Alert when actual or forecasted spend crosses a threshold (absolute $ or % of budget).',
        'Budget Actions: automatically apply an IAM policy or target group, or stop an EC2/RDS instance when a threshold is exceeded — useful for sandbox accounts.',
        'Cost Anomaly Detection: ML-based; send alerts when spend deviates unexpectedly from historical patterns; helps catch misconfigured resources before costs snowball.',
      ],
    },
    {
      heading: 'Rightsizing with AWS Compute Optimizer',
      points: [
        'Compute Optimizer uses 14 days of CloudWatch metrics to recommend instance types, EBS volume sizes, Lambda memory settings, and ECS task CPU/memory.',
        'Findings: OVER_PROVISIONED (reduce size/cost), UNDER_PROVISIONED (increase to avoid performance issues), OPTIMIZED (current size is right), NOT_OPTIMIZED.',
        'For EC2, it analyses CPU, memory (with CloudWatch agent), network I/O, and EBS throughput; for Lambda it analyses duration, memory, and timeout rates.',
        'Rightsizing saves 30–50% on average for over-provisioned fleets. Enable Enhanced Infrastructure Metrics (paid) for 3-month lookback for a more accurate picture.',
        'Export recommendations to S3 and integrate with your FinOps toolchain; schedule regular reviews since workloads change over time.',
      ],
    },
    {
      heading: 'Cost Allocation Tags and FinOps Culture',
      points: [
        'Tag every resource with at minimum: Environment (prod/staging/dev), Project/Application, Team/CostCentre, and Owner. Activate user-defined tags in the Billing console.',
        'Untagged resources are invisible in Cost Explorer tag filters — enforce tagging via Service Control Policies (SCPs) that deny resource creation without required tags.',
        'AWS Cost Categories: group costs into logical categories (e.g. "Data Platform", "Auth Service") using tag values, account IDs, or service names — useful for cross-team chargebacks.',
        'FinOps practices: weekly cost review in Cost Explorer, per-team budget alerts, monthly rightsizing pass with Compute Optimizer, and quarterly Savings Plan commitment review.',
        'Shared costs (NAT Gateways, load balancers, data transfer) are hard to attribute; use a proportional or even-split allocation method and document the approach for stakeholders.',
      ],
    },
    {
      heading: 'Hidden Costs: Data Transfer and Storage Classes',
      points: [
        'Data transfer is often the biggest surprise in AWS bills. Inter-AZ transfer costs $0.01/GB in each direction; cross-region transfer varies by region pair (typically $0.02–$0.09/GB).',
        'Minimise inter-AZ costs: co-locate tightly coupled services in the same AZ; use VPC endpoints for S3/DynamoDB to avoid NAT Gateway data processing charges.',
        'S3 storage classes: Standard ($0.023/GB) → Infrequent Access (30-day min) → Glacier Instant → Glacier Flexible → Deep Archive ($0.00099/GB). Use Lifecycle rules to move objects automatically.',
        'S3 Intelligent-Tiering auto-moves objects based on access patterns with no retrieval fee. Best when access patterns are unknown; monitoring fee applies per object >128 KB.',
        'NAT Gateway costs: $0.045/hr + $0.045/GB processed. For heavy S3 or DynamoDB traffic from private subnets, Gateway VPC endpoints are free and eliminate NAT processing costs.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Cost Explorer & Budgets',
      language: 'bash',
      code: `# Monthly cost breakdown by service (last month)
aws ce get-cost-and-usage \\
  --time-period Start=2024-12-01,End=2024-12-31 \\
  --granularity MONTHLY \\
  --metrics "BlendedCost" "UnblendedCost" \\
  --group-by Type=DIMENSION,Key=SERVICE \\
  --query 'ResultsByTime[0].Groups[*].{Service:Keys[0],Cost:Metrics.BlendedCost.Amount}' \\
  --output table

# Get Savings Plans purchase recommendations (1-year, no-upfront)
aws ce get-savings-plans-purchase-recommendation \\
  --savings-plans-type COMPUTE_SP \\
  --term-in-years ONE_YEAR \\
  --payment-option NO_UPFRONT \\
  --lookback-period-in-days THIRTY_DAYS

# Get Reserved Instance recommendations
aws ce get-reservation-purchase-recommendation \\
  --service "Amazon EC2" \\
  --lookback-period-in-days THIRTY_DAYS \\
  --term-in-years ONE_YEAR \\
  --payment-option NO_UPFRONT

# Create a monthly cost budget with 80% alert
aws budgets create-budget \\
  --account-id 123456789012 \\
  --budget '{
    "BudgetName": "MonthlyOpsLimit",
    "BudgetLimit": { "Amount": "1000", "Unit": "USD" },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }' \\
  --notifications-with-subscribers '[{
    "Notification": {
      "NotificationType": "FORECASTED",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [{
      "SubscriptionType": "EMAIL",
      "Address": "ops-team@example.com"
    }]
  }]'

# List current budget and actual spend
aws budgets describe-budgets --account-id 123456789012`,
    },
    {
      label: 'Spot Instances',
      language: 'bash',
      code: `# Check current Spot price history for a type
aws ec2 describe-spot-price-history \\
  --instance-types m5.xlarge \\
  --product-descriptions "Linux/UNIX" \\
  --start-time 2024-01-01T00:00:00 \\
  --query 'SpotPriceHistory[*].{AZ:AvailabilityZone,Price:SpotPrice}' \\
  --output table

# Create Auto Scaling Group with mixed On-Demand + Spot fleet
aws autoscaling create-auto-scaling-group \\
  --auto-scaling-group-name "mixed-fleet" \\
  --min-size 2 --max-size 20 --desired-capacity 6 \\
  --mixed-instances-policy '{
    "LaunchTemplate": {
      "LaunchTemplateSpecification": {
        "LaunchTemplateName": "app-server",
        "Version": "$Default"
      },
      "Overrides": [
        {"InstanceType": "m5.xlarge"},
        {"InstanceType": "m5a.xlarge"},
        {"InstanceType": "m4.xlarge"},
        {"InstanceType": "m5d.xlarge"}
      ]
    },
    "InstancesDistribution": {
      "OnDemandBaseCapacity": 2,
      "OnDemandPercentageAboveBaseCapacity": 20,
      "SpotAllocationStrategy": "capacity-optimized"
    }
  }' \\
  --vpc-zone-identifier "subnet-aaa111,subnet-bbb222,subnet-ccc333"

# Spot interruption notice — poll from instance metadata (run on the instance)
# TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
# curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \\
#   http://169.254.169.254/latest/meta-data/spot/termination-time
# Returns 404 normally; returns a timestamp when interruption is imminent`,
    },
    {
      label: 'Compute Optimizer',
      language: 'bash',
      code: `# Enroll account in Compute Optimizer
aws compute-optimizer update-enrollment-status --status Active

# Get EC2 instance rightsizing recommendations
aws compute-optimizer get-ec2-instance-recommendations \\
  --query 'instanceRecommendations[*].{
    Instance:instanceArn,
    Finding:finding,
    CurrentType:currentInstanceType,
    RecommendedType:recommendationOptions[0].instanceType,
    EstimatedSavings:recommendationOptions[0].estimatedMonthlySavings.value
  }' \\
  --output table

# Get Lambda memory recommendations
aws compute-optimizer get-lambda-function-recommendations \\
  --query 'lambdaFunctionRecommendations[*].{
    Function:functionArn,
    Finding:finding,
    CurrentMemory:currentMemorySize,
    RecommendedMemory:memorySizeRecommendationOptions[0].memorySize
  }' \\
  --output table

# Export EC2 recommendations to S3 for deeper analysis
aws compute-optimizer export-ec2-instance-recommendations \\
  --s3-destination-config '{
    "bucket": "my-cost-reports-bucket",
    "keyPrefix": "compute-optimizer/ec2/"
  }'

# View S3 Intelligent-Tiering configuration
aws s3api get-bucket-intelligent-tiering-configuration \\
  --bucket my-data-bucket \\
  --id AllObjects

# Add S3 lifecycle rule to transition to Intelligent-Tiering
aws s3api put-bucket-lifecycle-configuration \\
  --bucket my-data-bucket \\
  --lifecycle-configuration '{
    "Rules": [{
      "ID": "MoveToIntelligentTiering",
      "Status": "Enabled",
      "Filter": { "Prefix": "" },
      "Transitions": [{
        "Days": 30,
        "StorageClass": "INTELLIGENT_TIERING"
      }]
    }]
  }'`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Buying Reserved Instances without checking Savings Plans first',
      wrong: `// Bought 50 m5.xlarge RIs for us-east-1
// Team then migrated half the fleet to m6i and Fargate
// RI coverage dropped — paying for idle reservations`,
      right: `// Use Compute Savings Plans instead:
// Covers m5, m6i, Fargate, Lambda automatically
// Commitment is in $/hr spend, not a specific instance type
aws ce get-savings-plans-purchase-recommendation \\
  --savings-plans-type COMPUTE_SP`,
      explanation: 'Compute Savings Plans cover any EC2 family, size, region, OS, Fargate, and Lambda under a single $/hr commitment. Standard RIs are locked to a specific instance type, making them risky when instance families change. Use Savings Plans for flexibility and RIs only when you have stable, predictable specific instance usage.',
    },
    {
      title: 'Running Spot Instances for stateful databases or queues',
      wrong: `// Ran Redis/RabbitMQ on Spot to save cost
// Spot was reclaimed mid-session — lost all in-memory data
// 15 minutes of downtime and data loss`,
      right: `// Spot is for stateless/fault-tolerant workloads ONLY:
// CI/CD workers, batch jobs, stateless web tier, ML training
// Stateful services need On-Demand or Reserved: RDS, Redis, Kafka`,
      explanation: 'Spot Instances can be reclaimed with only a 2-minute warning. Stateful services (databases, message queues, caches with persistent state) cannot checkpoint and resume gracefully, making them completely unsuitable for Spot. Use Spot only for workloads that can tolerate interruption without data loss.',
    },
    {
      title: 'Overlooking NAT Gateway data processing costs',
      wrong: `// ECS tasks in private subnets fetch data from S3 — bill was huge
// $420/month in NAT Gateway charges for S3 traffic`,
      right: `// S3 Gateway VPC Endpoint is FREE and eliminates NAT processing:
aws ec2 create-vpc-endpoint \\
  --vpc-id vpc-abc123 \\
  --service-name com.amazonaws.us-east-1.s3 \\
  --route-table-ids rtb-abc123`,
      explanation: 'Gateway VPC Endpoints for S3 and DynamoDB are free and route traffic directly from your VPC to the service without traversing the NAT Gateway. At $0.045/GB, S3 traffic through NAT is extremely expensive. Always use Gateway VPC Endpoints for S3 and DynamoDB from private subnets.',
    },
    {
      title: 'Committing too aggressively to Savings Plans before understanding usage',
      wrong: `// Bought 3-year All-Upfront Compute SP based on peak usage
// Company downsized 30% — stuck with 30% unused commitment
// $45 000 committed capital earning no return`,
      right: `// Use 1-year No-Upfront first; buy to cover MINIMUM baseline only.
// Cost Explorer recommendations use trailing 30-day usage — don't round up.
// Add coverage incrementally as usage is proven stable.`,
      explanation: 'Savings Plans commitment should cover your minimum predictable baseline, not peak or expected usage. Start with 1-year No-Upfront to preserve capital and commit only what you are certain will be consumed. Buy more after confirming stable usage over several months.',
    },
    {
      title: 'Tagging resources but never activating tags in Billing',
      wrong: `// Tagged all resources with Project and CostCentre tags
// Cost Explorer tag filter shows nothing — tags not visible`,
      right: `// User-defined tags must be activated in Billing console:
// Billing → Cost Allocation Tags → User-Defined Tags → Activate
// It takes up to 24 hours for tagged cost data to appear.`,
      explanation: 'AWS does not automatically include user-defined tags in cost data. Each tag key must be explicitly activated in the Billing console under Cost Allocation Tags. Activation can take up to 24 hours, and historical cost data before activation will not be retroactively tagged.',
    },
    {
      title: 'Ignoring inter-AZ data transfer costs in microservices',
      wrong: `// Deployed 10 microservices across 3 AZs for HA
// Each service calls 3 others per request — 30+ inter-AZ calls/request
// Unexpected $600/month data transfer bill`,
      right: `// Co-locate latency-sensitive services in the same AZ where possible.
// Use ALB with AZ-affinity for internal traffic.
// Cache responses (ElastiCache) to reduce cross-AZ call volume.
// Measure: tag NAT/ENI traffic with flow logs to identify top talkers.`,
      explanation: 'Inter-AZ data transfer costs $0.01/GB in each direction. For microservices with many inter-service calls, this adds up quickly. Use AZ-aware load balancing, caching, and response aggregation to minimise cross-AZ traffic while still maintaining resilience.',
    },
  ];

  challenge: Challenge = {
    title: 'Savings Plans Coverage Calculator',
    language: 'typescript',
    description: `Write a TypeScript function that analyses EC2 On-Demand spend data and produces Savings Plans recommendations.

Given an array of monthly usage records (service, hours used, on-demand $/hr), the function should:
1. Calculate total monthly On-Demand spend
2. Identify the minimum stable hourly commitment (the lowest usage hour across all months)
3. Calculate projected annual savings at 33% Savings Plans discount
4. Return a recommendation with commitment level, estimated savings, and payback period

Assume: Compute Savings Plans at 33% discount, 1-year No-Upfront term.`,
    hints: [
      'The "minimum stable commitment" is the minimum hourly spend across all time periods — this is the safest commitment level',
      'Annual savings = (onDemand rate - savingsPlan rate) × hours/year × instances',
      'Payback period for No-Upfront is immediate (no upfront cost); show break-even vs On-Demand in months',
      'Sort recommendations by annual savings descending to prioritise the biggest wins',
      'Edge case: if minimum hourly spend is 0 (resource sometimes off), recommendation should be 0 commitment for that resource',
    ],
    starterCode: `interface UsageRecord {
  resourceId: string;
  instanceType: string;
  region: string;
  monthlyHours: number[];    // hours used each month (12 months)
  onDemandHourlyRate: number; // USD/hr On-Demand price
}

interface SavingsPlanRecommendation {
  resourceId: string;
  instanceType: string;
  currentMonthlySpend: number;    // avg On-Demand spend/month
  recommendedHourlyCommitment: number; // safe $/hr commitment
  estimatedAnnualSavings: number;
  coveragePercentage: number;     // % of usage covered by commitment
}

function analyseSavingsPlansOpportunity(
  usages: UsageRecord[],
  discountRate: number = 0.33,
): SavingsPlanRecommendation[] {
  // TODO: For each resource:
  // 1. Find min monthly hours (stable baseline)
  // 2. Calculate recommended hourly commitment = (minHours / 730) * onDemandHourlyRate * (1 - discountRate)
  // 3. Calculate current monthly spend = avg(monthlyHours) * onDemandHourlyRate
  // 4. Calculate annual savings = commitment * 12 * discountRate / (1 - discountRate)
  // 5. Return sorted by estimatedAnnualSavings desc

  return [];
}`,
    solution: `interface UsageRecord {
  resourceId: string;
  instanceType: string;
  region: string;
  monthlyHours: number[];
  onDemandHourlyRate: number;
}

interface SavingsPlanRecommendation {
  resourceId: string;
  instanceType: string;
  currentMonthlySpend: number;
  recommendedHourlyCommitment: number;
  estimatedAnnualSavings: number;
  coveragePercentage: number;
}

function analyseSavingsPlansOpportunity(
  usages: UsageRecord[],
  discountRate: number = 0.33,
): SavingsPlanRecommendation[] {
  const recs: SavingsPlanRecommendation[] = usages
    .map(u => {
      const minHours = Math.min(...u.monthlyHours);
      const avgHours = u.monthlyHours.reduce((s, h) => s + h, 0) / u.monthlyHours.length;

      if (minHours === 0) {
        return null; // resource sometimes off — no safe commitment
      }

      const currentMonthlySpend = avgHours * u.onDemandHourlyRate;

      // Stable hourly spend at commitment rate
      const stableHourlyOnDemand = (minHours / 730) * u.onDemandHourlyRate;
      const recommendedHourlyCommitment = stableHourlyOnDemand * (1 - discountRate);

      // Annual savings = discount captured on committed spend per year
      const annualCommitment = recommendedHourlyCommitment * 8760;
      const annualOnDemandEquivalent = stableHourlyOnDemand * 8760;
      const estimatedAnnualSavings = annualOnDemandEquivalent - annualCommitment;

      const coveragePercentage = avgHours > 0 ? (minHours / avgHours) * 100 : 0;

      return {
        resourceId: u.resourceId,
        instanceType: u.instanceType,
        currentMonthlySpend: Math.round(currentMonthlySpend * 100) / 100,
        recommendedHourlyCommitment: Math.round(recommendedHourlyCommitment * 10000) / 10000,
        estimatedAnnualSavings: Math.round(estimatedAnnualSavings * 100) / 100,
        coveragePercentage: Math.round(coveragePercentage * 10) / 10,
      };
    })
    .filter((r): r is SavingsPlanRecommendation => r !== null)
    .sort((a, b) => b.estimatedAnnualSavings - a.estimatedAnnualSavings);

  return recs;
}

// Example usage
const usage: UsageRecord[] = [
  {
    resourceId: 'i-0abc123',
    instanceType: 'm5.xlarge',
    region: 'us-east-1',
    monthlyHours: [720, 720, 720, 700, 720, 720, 720, 720, 720, 720, 720, 720],
    onDemandHourlyRate: 0.192,
  },
  {
    resourceId: 'i-0def456',
    instanceType: 'c5.2xlarge',
    region: 'us-east-1',
    monthlyHours: [200, 300, 150, 400, 200, 250, 0, 180, 300, 200, 150, 220],
    onDemandHourlyRate: 0.34,
  },
];

console.log(analyseSavingsPlansOpportunity(usage));
/* i-0abc123: $455/yr savings — stable 24/7 instance, great SP candidate
   i-0def456: filtered out (has 0-hour month — no safe commitment) */`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key advantage of Compute Savings Plans over EC2 Instance Savings Plans?',
      options: [
        'Compute Savings Plans offer a higher discount (up to 72% vs 66%)',
        'Compute Savings Plans cover any EC2 family, size, region, OS, plus Fargate and Lambda',
        'Compute Savings Plans have no minimum commitment term',
        'Compute Savings Plans automatically adjust to usage without a committed rate',
      ],
      answer: 1,
      explanation: 'Compute Savings Plans are the most flexible — they apply automatically to any EC2 instance regardless of family, size, region, or OS, plus Fargate tasks and Lambda. The trade-off is a slightly lower discount (up to 66%) vs EC2 Instance Savings Plans (up to 72%).',
    },
    {
      q: 'A Spot Instance receives an interruption notice. How long does the instance have before termination?',
      options: [
        '30 seconds',
        '2 minutes',
        '5 minutes',
        '15 minutes',
      ],
      answer: 1,
      explanation: 'AWS provides a 2-minute interruption warning via the instance metadata service (and EventBridge) before reclaiming a Spot Instance. Use this window to checkpoint state, drain connections, and terminate gracefully.',
    },
    {
      q: 'Which VPC Endpoint type for S3 eliminates NAT Gateway data processing charges and is FREE?',
      options: [
        'Interface VPC Endpoint (PrivateLink)',
        'Gateway VPC Endpoint',
        'Transit Gateway Endpoint',
        'CloudFront Origin Endpoint',
      ],
      answer: 1,
      explanation: 'Gateway VPC Endpoints for S3 and DynamoDB are free and route traffic directly within the AWS network, bypassing the NAT Gateway entirely. Interface VPC Endpoints (PrivateLink) cost $0.01/hr + $0.01/GB and are used for other services like SSM, ECR, and Secrets Manager.',
    },
    {
      q: 'You tag all EC2 instances with "Project" and "Team" tags but the tags do not appear in Cost Explorer filters. What is missing?',
      options: [
        'Tags must use the aws: prefix to appear in Cost Explorer',
        'User-defined tags must be activated in the Billing console under Cost Allocation Tags',
        'Cost Explorer requires at least 7 days of tag history before displaying filters',
        'EC2 tags are not supported in Cost Explorer — only S3 and RDS tags are',
      ],
      answer: 1,
      explanation: 'User-defined tags are not automatically included in cost data. Each tag key must be explicitly activated in the Billing console under Cost Allocation Tags > User-Defined Tags. Activation can take up to 24 hours; historical cost data before activation is not retroactively tagged.',
    },
    {
      q: 'What does AWS Compute Optimizer analyse to generate rightsizing recommendations?',
      options: [
        '30 days of AWS Config compliance history',
        '14 days of CloudWatch metrics (CPU, memory with agent, network, EBS I/O)',
        'Cost Explorer billing data from the trailing 3 months',
        'Manual performance baseline reports submitted to Trusted Advisor',
      ],
      answer: 1,
      explanation: 'Compute Optimizer uses 14 days of CloudWatch metrics by default — CPU utilisation, memory (requires CloudWatch agent), network throughput, and EBS I/O. Enhanced Infrastructure Metrics (paid add-on) extends the lookback to 3 months for more accurate recommendations.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I buy Reserved Instances or Savings Plans?',
      a: 'In most cases, Compute Savings Plans are the better choice: they cover any EC2 instance (any family, size, region, OS), Fargate, and Lambda under a single $/hr commitment, making them resilient to workload changes. Standard RIs make sense only when you have very stable, specific instance usage (e.g. always running exactly 20 m5.xlarge in us-east-1) and want the maximum 72% discount. Use Cost Explorer recommendations to see which option yields higher estimated savings for your actual usage pattern.',
    },
    {
      q: 'How do I know what hourly commitment to choose for a Savings Plan?',
      a: 'Use Cost Explorer\'s Savings Plans recommendation page: it analyses your trailing 30, 60, or 90-day usage and suggests an optimal hourly commitment. A conservative starting point is to commit to your minimum hourly spend over the past few months — this is the amount you are certain to spend regardless of workload variation. You can always buy additional Savings Plans later as your baseline grows, but you cannot reduce an existing commitment.',
    },
    {
      q: 'When is S3 Intelligent-Tiering NOT the right choice?',
      a: 'S3 Intelligent-Tiering adds a per-object monitoring fee (approximately $0.0025 per 1,000 objects). For objects smaller than 128 KB, the monitoring fee can exceed storage savings — AWS automatically excludes objects below 128 KB from tiering. Also, if you have predictable access patterns (e.g. logs accessed for 30 days then archived), an explicit Lifecycle rule from Standard → Glacier is cheaper and simpler than Intelligent-Tiering monitoring overhead.',
    },
    {
      q: 'What is the safest Spot allocation strategy for an Auto Scaling Group?',
      a: 'Use capacity-optimized allocation strategy: ASG picks Spot pools with the most available capacity, reducing the probability of interruption. Pair it with multiple instance types in the launch template Overrides (4–5 similar-sized instance types from different families, e.g. m5.xlarge, m5a.xlarge, m4.xlarge, m5d.xlarge). This diversification reduces the chance that all pools are reclaimed simultaneously. Set OnDemandBaseCapacity to maintain a stable On-Demand floor for critical baseline capacity.',
    },
    {
      q: 'How do I identify what is driving unexpected AWS costs?',
      a: 'Start with Cost Explorer: filter by service, region, and linked account to isolate the spike. Enable Cost Anomaly Detection (a free ML-based service) to receive alerts when spend deviates from historical patterns. Check the specific service console (e.g. EC2 for data transfer, S3 for request counts) for usage metrics. Enable Cost Allocation Tags to break costs down by project or team. For NAT Gateway spikes, use VPC Flow Logs to identify the top talkers by source IP and destination service.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Commit spend with Compute Savings Plans for flexibility or RIs for maximum discount, use Spot for fault-tolerant workloads, track costs with Cost Explorer + Budgets, and rightsize with Compute Optimizer.',
    mustKnow: [
      'Compute Savings Plans (up to 66%, any EC2/Fargate/Lambda) vs EC2 Instance SP (up to 72%, specific family/region)',
      'Spot Instances: up to 90% off; 2-minute termination warning; use capacity-optimized strategy + multiple instance types',
      'Cost Explorer: 13-month history, forecasting, SP/RI recommendations — buy to minimum baseline, not peak usage',
      'AWS Budgets: alert on actual or forecasted cost/usage exceeding a threshold; Budget Actions can stop instances',
      'Compute Optimizer: 14-day CloudWatch analysis; finds over/under-provisioned EC2, Lambda, EBS, ECS Fargate',
      'User-defined tags must be activated in Billing console before they appear as Cost Explorer filters',
      'Gateway VPC Endpoints for S3/DynamoDB are FREE and eliminate NAT Gateway data processing charges',
    ],
    interviewFocus: [
      '"Walk me through how you would reduce AWS costs for an over-provisioned EC2 fleet"',
      '"What is the difference between Compute Savings Plans and Reserved Instances?"',
      '"When would you NOT use Spot Instances — and why?"',
      '"We have a $20 000/month AWS bill and don\'t know where it\'s going. How do you investigate?"',
    ],
  };
}
