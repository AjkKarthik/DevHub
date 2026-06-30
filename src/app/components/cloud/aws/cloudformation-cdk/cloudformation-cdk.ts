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
  selector: 'app-aws-cloudformation-cdk',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './cloudformation-cdk.html',
  styleUrl: './cloudformation-cdk.scss'
})
export class AwsCloudformationCdk {

  quickRef: QuickRefItem[] = [
    { name: 'Stack', type: 'keyword', desc: 'CloudFormation unit of deployment — a collection of AWS resources managed as one. Create/update/delete together.' },
    { name: 'Change Set', type: 'keyword', desc: 'Preview of what CloudFormation will change before executing — shows Add/Modify/Remove per resource.' },
    { name: 'Stack Policy', type: 'keyword', desc: 'JSON policy that prevents accidental replacement or deletion of specific stack resources during updates.' },
    { name: 'CDK Construct', type: 'keyword', desc: 'Reusable IaC component: L1 (raw CFN resource), L2 (AWS-curated with defaults), L3 (opinionated patterns).' },
    { name: 'cdk synth', type: 'keyword', desc: 'Synthesizes CDK app to CloudFormation templates — no deployment; validates code and shows generated YAML/JSON.' },
    { name: 'cdk diff', type: 'keyword', desc: 'Compares synthesized template against deployed stack — equivalent to a CloudFormation change set preview.' },
    { name: 'cdk bootstrap', type: 'keyword', desc: 'One-time setup per account/region: creates CDKToolkit stack with S3 bucket and IAM roles for deployments.' },
    { name: 'CloudFormation Drift', type: 'keyword', desc: 'Detects when actual resource configuration differs from the stack template — catches manual console changes.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'CloudFormation Core Concepts',
      points: [
        'Templates are YAML or JSON files describing resources; stacks are deployed instances of templates.',
        'Resource lifecycle: CREATE (new), UPDATE (change in place or replace), DELETE (tear down). Replace = delete + recreate.',
        'Replacement: some property changes require resource replacement (e.g. RDS DB engine, Lambda runtime in some cases).',
        'DependsOn: explicitly order resource creation; AWS infers most dependencies from Ref/GetAtt automatically.',
        'Outputs: exported values (stack name + export name) consumable by other stacks via Fn::ImportValue.',
        'Parameters: user-supplied inputs at deploy time — use for environment-specific values (instance size, DB name).',
        'Conditions: create resources conditionally based on parameter values (e.g. only create a WAF in prod).',
        'Stack sets: deploy one template to multiple accounts and regions simultaneously via AWS Organizations.',
      ]
    },
    {
      heading: 'Update Strategies & Change Sets',
      points: [
        'Always use Change Sets for production updates — preview impact before committing.',
        'RETAIN deletion policy: keeps the resource when the stack is deleted (e.g. S3 bucket, RDS instance).',
        'SNAPSHOT deletion policy: takes a snapshot before deletion (RDS, EBS volume) — recoverable.',
        'Stack rollback: on failure, CloudFormation rolls back to the previous known-good state automatically.',
        'Rollback triggers: set CloudWatch alarms; if alarm fires during update, rollback is triggered automatically.',
        'Nested stacks: modularize large templates by referencing child stacks via AWS::CloudFormation::Stack.',
        'Drift detection: detects when actual configuration differs from template — run after manual console changes.',
      ]
    },
    {
      heading: 'CDK Fundamentals',
      points: [
        'CDK app → one or more Stacks → Constructs (L1/L2/L3) → CloudFormation resources after synthesis.',
        'L1 constructs (Cfn*): direct 1-to-1 mapping to CloudFormation resources; all properties explicit.',
        'L2 constructs: AWS-curated with sensible defaults and higher-level methods (e.g. bucket.grantRead(role)).',
        'L3 constructs (Patterns): opinionated multi-resource patterns (e.g. aws-ecs-patterns.ApplicationLoadBalancedFargateService).',
        'CDK context: key-value pairs stored in cdk.context.json after lookups (VPC ID, AZ list); commit to version control.',
        'CDK Aspects: traverse the entire construct tree and apply changes/validations (e.g. enforce encryption on all buckets).',
      ]
    },
    {
      heading: 'CDK Workflow & Bootstrap',
      points: [
        'cdk bootstrap: creates CDKToolkit stack with S3 bucket (assets), ECR repo, and IAM roles. Run once per account/region.',
        'cdk synth: compiles TypeScript, synthesizes CloudFormation templates into cdk.out/ directory.',
        'cdk diff: compares cdk.out/ against deployed stack — equivalent to CloudFormation change set.',
        'cdk deploy: synth + upload assets + create/execute change set + monitor events until complete.',
        'cdk destroy: deletes all stack resources. Resources with RETAIN policy are not deleted.',
        'CDK pipelines: self-mutating CodePipeline that deploys CDK apps — pipeline updates itself if pipeline code changes.',
        'Hotswap: cdk deploy --hotswap skips CloudFormation for Lambda/ECS updates — faster but not for production.',
      ]
    },
    {
      heading: 'Best Practices',
      points: [
        'One stack per logical unit (VPC stack, database stack, app stack) — not one giant stack.',
        'Use L2/L3 constructs over L1 — they enforce security defaults (encryption, least privilege IAM).',
        'Separate infra from app code — CDK in /infra directory, application code in /src.',
        'Use CDK context lookups for existing VPCs/subnets — avoids hardcoding IDs that differ per environment.',
        'Tag all resources: use cdk.Tags.of(app).add("Environment", "prod") to propagate tags to every resource.',
        'Removal policy: set RETAIN on stateful resources (S3, RDS) explicitly — default DESTROY can cause data loss.',
        'Run cdk diff in CI before merge — catch infrastructure regressions like accidental resource replacements.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CloudFormation CLI',
      language: 'bash',
      code: `# Validate a template
aws cloudformation validate-template \\
  --template-body file://template.yaml

# Create a stack
aws cloudformation create-stack \\
  --stack-name my-api \\
  --template-body file://template.yaml \\
  --parameters ParameterKey=Environment,ParameterValue=prod \\
  --capabilities CAPABILITY_IAM

# Create a change set (preview changes before applying)
aws cloudformation create-change-set \\
  --stack-name my-api \\
  --change-set-name update-2024-01 \\
  --template-body file://template.yaml \\
  --parameters ParameterKey=Environment,ParameterValue=prod \\
  --capabilities CAPABILITY_IAM

# Describe and review the change set
aws cloudformation describe-change-set \\
  --stack-name my-api \\
  --change-set-name update-2024-01

# Execute the change set
aws cloudformation execute-change-set \\
  --stack-name my-api \\
  --change-set-name update-2024-01

# Monitor stack events in real time
aws cloudformation describe-stack-events \\
  --stack-name my-api \\
  --query 'StackEvents[?ResourceStatus!=\`UPDATE_COMPLETE\`]' \\
  | head -20

# Detect drift
aws cloudformation detect-stack-drift --stack-name my-api
aws cloudformation describe-stack-drift-detection-status \\
  --stack-drift-detection-id drift-id-from-above`,
    },
    {
      label: 'CFN Template Patterns',
      language: 'bash',
      code: `# Example CloudFormation template (YAML)
# AWSTemplateFormatVersion: "2010-09-09"
# Description: Serverless API stack
#
# Parameters:
#   Environment:
#     Type: String
#     AllowedValues: [dev, staging, prod]
#     Default: dev
#
# Conditions:
#   IsProd: !Equals [!Ref Environment, prod]
#
# Resources:
#   OrdersTable:
#     Type: AWS::DynamoDB::Table
#     DeletionPolicy: Retain        # Never delete data
#     UpdateReplacePolicy: Retain
#     Properties:
#       TableName: !Sub "orders-\${Environment}"
#       BillingMode: PAY_PER_REQUEST
#       AttributeDefinitions:
#         - AttributeName: orderId
#           AttributeType: S
#       KeySchema:
#         - AttributeName: orderId
#           KeyType: HASH
#
#   ApiFunction:
#     Type: AWS::Lambda::Function
#     Properties:
#       FunctionName: !Sub "api-\${Environment}"
#       Runtime: nodejs20.x
#       Handler: index.handler
#       Role: !GetAtt LambdaRole.Arn
#       Environment:
#         Variables:
#           TABLE_NAME: !Ref OrdersTable
#
#   WafWebAcl:
#     Type: AWS::WAFv2::WebACL
#     Condition: IsProd            # Only create in prod
#     Properties: ...
#
# Outputs:
#   TableName:
#     Value: !Ref OrdersTable
#     Export:
#       Name: !Sub "\${AWS::StackName}-TableName"

echo "See template structure in comments above"`,
    },
    {
      label: 'CDK TypeScript',
      language: 'bash',
      code: `# Bootstrap CDK for account/region (one-time)
cdk bootstrap aws://123456789012/us-east-1

# Synthesize to CloudFormation
cdk synth

# Preview changes
cdk diff

# Deploy (synth + change set + execute)
cdk deploy --require-approval never

# Deploy specific stack
cdk deploy MyApiStack

# Destroy all stacks
cdk destroy --all

# CDK TypeScript stack example (shown as comments):
# import * as cdk from 'aws-cdk-lib';
# import * as lambda from 'aws-cdk-lib/aws-lambda';
# import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
# import * as apigateway from 'aws-cdk-lib/aws-apigateway';
#
# export class ApiStack extends cdk.Stack {
#   constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
#     super(scope, id, props);
#
#     const table = new dynamodb.Table(this, 'Orders', {
#       partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
#       billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
#       removalPolicy: cdk.RemovalPolicy.RETAIN,
#     });
#
#     const fn = new lambda.Function(this, 'ApiHandler', {
#       runtime: lambda.Runtime.NODEJS_20_X,
#       handler: 'index.handler',
#       code: lambda.Code.fromAsset('src'),
#       environment: { TABLE_NAME: table.tableName },
#     });
#
#     table.grantReadWriteData(fn);  // L2: auto-generates IAM policy
#
#     new apigateway.LambdaRestApi(this, 'Api', { handler: fn });
#   }
# }`,
    },
    {
      label: 'CDK Patterns & Aspects',
      language: 'bash',
      code: `# CDK context lookup (existing VPC)
# const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { vpcName: 'my-vpc' });
# Writes VPC ID to cdk.context.json after first synth

# CDK Aspects — enforce encryption on all S3 buckets
# class EnforceEncryption implements cdk.IAspect {
#   visit(node: IConstruct) {
#     if (node instanceof s3.CfnBucket) {
#       node.bucketEncryption = {
#         serverSideEncryptionConfiguration: [{
#           serverSideEncryptionByDefault: { sseAlgorithm: 'AES256' }
#         }]
#       };
#     }
#   }
# }
# cdk.Aspects.of(app).add(new EnforceEncryption());

# Tag every resource in the app
# cdk.Tags.of(app).add('Environment', 'prod');
# cdk.Tags.of(app).add('Team', 'platform');

# CDK Pipelines (self-mutating pipeline)
# const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
#   synth: new pipelines.ShellStep('Synth', {
#     input: pipelines.CodePipelineSource.connection('owner/repo', 'main', {
#       connectionArn: 'arn:aws:codestar-connections:...'
#     }),
#     commands: ['npm ci', 'npm run build', 'npx cdk synth'],
#   }),
# });
# pipeline.addStage(new MyAppStage(this, 'Prod', { env: { account: '123', region: 'us-east-1' } }));

# Useful CDK commands
cdk list                          # List all stacks
cdk deploy --hotswap              # Fast Lambda/ECS updates (skip CloudFormation)
cdk deploy --watch                # Re-deploy on file changes (dev only)
npx cdk doctor                    # Diagnose CDK setup issues`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not using Change Sets for production stack updates',
      wrong: `# Direct update — no preview
aws cloudformation update-stack \\
  --stack-name prod-api \\
  --template-body file://template.yaml
# CloudFormation starts updating immediately
# RDS instance gets replaced (property change) → 20 minutes downtime
# No chance to review before execution`,
      right: `# Always use Change Sets for prod
aws cloudformation create-change-set \\
  --stack-name prod-api \\
  --change-set-name preview-$(date +%Y%m%d) \\
  --template-body file://template.yaml
aws cloudformation describe-change-set \\
  --stack-name prod-api --change-set-name preview-$(date +%Y%m%d)
# Review: check Action=Replace before executing!
aws cloudformation execute-change-set ...`,
      explanation: 'Direct stack updates execute immediately without review. Change Sets show Add/Modify/Remove per resource — critically, they show when a resource will be REPLACED (delete + recreate). Always review Change Sets for stateful resources before executing in production.'
    },
    {
      title: 'Missing DeletionPolicy: Retain on stateful resources',
      wrong: `# RDS and S3 with no DeletionPolicy
# Resources:
#   OrdersDB:
#     Type: AWS::RDS::DBInstance
#     Properties: ...
# Default DeletionPolicy is DELETE
# cdk destroy (or accidental stack delete) → RDS instance deleted → data gone`,
      right: `# Always set Retain (or Snapshot) on stateful resources
# OrdersDB:
#   Type: AWS::RDS::DBInstance
#   DeletionPolicy: Snapshot        # Takes snapshot before deletion
#   UpdateReplacePolicy: Snapshot   # Takes snapshot before replacement
#
# OrdersBucket:
#   Type: AWS::S3::Bucket
#   DeletionPolicy: Retain          # S3 buckets can't snapshot

# In CDK:
# new dynamodb.Table(this, 'Orders', {
#   removalPolicy: cdk.RemovalPolicy.RETAIN,
# });`,
      explanation: 'The default DeletionPolicy is DELETE — a cdk destroy or accidental stack delete removes your database and its data. Always set DeletionPolicy: Retain (or Snapshot for RDS/EBS) on stateful resources. In CDK, removalPolicy: RETAIN is explicit.'
    },
    {
      title: 'Putting everything in one giant CloudFormation stack',
      wrong: `# Single stack with VPC, RDS, Lambda, API GW, CloudFront, WAF, S3
# 200+ resources in one template
# Update to Lambda config → CloudFormation evaluates all 200 resources
# Stack takes 30 minutes to update; rollback on failure takes another 30 minutes
# One error blocks ALL infrastructure changes`,
      right: `# Separate stacks by lifecycle and ownership
# NetworkStack: VPC, subnets, security groups (changes rarely)
# DataStack: RDS, DynamoDB, ElastiCache (stateful — protect carefully)
# ApiStack: Lambda, API Gateway (changes frequently)
# FrontendStack: CloudFront, S3, WAF

# DataStack imports from NetworkStack:
# VpcId: !ImportValue NetworkStack-VpcId`,
      explanation: 'Large monolithic stacks are slow to update, risky to change, and hard to understand. Separate by lifecycle: network (stable) → data (stateful) → app (frequent). Each stack can be updated independently and failures are isolated.'
    },
    {
      title: 'Using cdk deploy --hotswap in production',
      wrong: `# Engineer runs hotswap in production for "faster deploy"
cdk deploy MyApiStack --hotswap
# Lambda code updated directly via UpdateFunctionCode API
# CloudFormation state NOT updated
# Next regular cdk deploy may overwrite or conflict with hotswap changes
# No audit trail — CloudTrail shows UpdateFunctionCode, not CloudFormation`,
      right: `# hotswap is for development only
cdk deploy MyApiStack --hotswap   # Dev: fast iteration OK

# Production: always go through CloudFormation
cdk deploy MyApiStack             # Creates change set, monitors events
# Or use CDK Pipelines for automated production deployments`,
      explanation: 'hotswap bypasses CloudFormation and directly calls service APIs (Lambda UpdateFunctionCode, ECS UpdateService). This means CloudFormation state is stale, rollbacks do not work, and there is no change set audit trail. Hotswap is a development-only tool.'
    },
    {
      title: 'Hardcoding account IDs and region in CDK stacks',
      wrong: `// Hardcoded environment — breaks in other accounts
new s3.Bucket(this, 'Assets', {
  bucketName: 'my-app-assets-us-east-1-123456789012'
});
// Cannot deploy to eu-west-1 or a different account without code changes`,
      right: `// Use CDK environment-aware tokens
new s3.Bucket(this, 'Assets', {
  bucketName: \`my-app-assets-\${this.region}-\${this.account}\`
});
// Or pass env via stack props:
// new MyStack(app, 'ProdStack', { env: { account: '123', region: 'us-east-1' } });
// CDK resolves this.account and this.region at synth/deploy time`,
      explanation: 'Hardcoded account IDs and regions break multi-environment deployments. Use this.account and this.region tokens (resolved at deploy time) or pass environment via Stack props. This enables the same CDK code to deploy to dev, staging, and prod accounts.'
    },
  ];

  challenge: Challenge = {
    title: 'Build a Serverless API Stack with CDK',
    language: 'typescript',
    description: `Write a CDK TypeScript stack that provisions:
1. DynamoDB table "Products" (PK=productId, on-demand billing, RETAIN on destroy)
2. Lambda function reading TABLE_NAME env var, granted read/write on the table
3. HTTP API Gateway (v2) with Lambda proxy integration
4. CloudWatch alarm on Lambda p99 Duration > 1000ms (2-of-3 evaluation)
5. All resources tagged with Environment=prod

Use L2 constructs. Do NOT hardcode account ID or region.`,
    hints: [
      'dynamodb.Table L2 automatically enables encryption and point-in-time recovery by default',
      'table.grantReadWriteData(fn) creates the IAM policy automatically — no manual policy needed',
      'apigatewayv2-integrations.HttpLambdaIntegration connects HTTP API to Lambda',
      'new cloudwatch.Alarm with metric=fn.metricDuration({ statistic: "p99" })',
      'cdk.Tags.of(this).add("Environment", "prod") tags all resources in the stack',
    ],
    starterCode: `import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';

export class ProductApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // TODO: DynamoDB table - Products (PK: productId, on-demand, RETAIN)

    // TODO: Lambda function (nodejs20.x, env: TABLE_NAME, 512MB, 30s timeout)

    // TODO: Grant Lambda read/write on the table

    // TODO: HTTP API with Lambda integration

    // TODO: CloudWatch alarm on p99 Duration > 1000ms (2-of-3)

    // TODO: Tag everything with Environment=prod
  }
}
`,
    solution: `import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';

export class ProductApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. DynamoDB Table
    const table = new dynamodb.Table(this, 'Products', {
      tableName: \`products-\${this.stackName}\`,
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 2. Lambda Function
    const fn = new lambda.Function(this, 'ApiHandler', {
      functionName: \`product-api-\${this.stackName}\`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: { TABLE_NAME: table.tableName },
    });

    // 3. Grant read/write (generates IAM policy automatically)
    table.grantReadWriteData(fn);

    // 4. HTTP API v2 with Lambda integration
    const integration = new HttpLambdaIntegration('LambdaIntegration', fn);
    const api = new apigatewayv2.HttpApi(this, 'ProductApi', {
      defaultIntegration: integration,
      corsPreflight: {
        allowOrigins: ['https://myapp.com'],
        allowMethods: [apigatewayv2.CorsHttpMethod.ANY],
        allowHeaders: ['Authorization', 'Content-Type'],
      },
    });

    // 5. CloudWatch Alarm: p99 latency > 1000ms, 2-of-3
    new cloudwatch.Alarm(this, 'P99LatencyAlarm', {
      alarmName: \`\${this.stackName}-p99-latency\`,
      metric: fn.metricDuration({ statistic: 'p99', period: cdk.Duration.minutes(1) }),
      threshold: 1000,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // 6. Tag all resources
    cdk.Tags.of(this).add('Environment', 'prod');

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.apiEndpoint });
    new cdk.CfnOutput(this, 'TableName', { value: table.tableName });
  }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the default DeletionPolicy for CloudFormation resources if none is specified?',
      options: ['Retain', 'Snapshot', 'Delete', 'Archive'],
      answer: 2,
      explanation: 'The default DeletionPolicy is Delete — when a stack is deleted or a resource is removed from the template, CloudFormation deletes the resource. Always override this to Retain or Snapshot for stateful resources like RDS instances and S3 buckets.',
    },
    {
      q: 'What does cdk bootstrap do and when must it be run?',
      options: [
        'Installs the CDK CLI globally — run once per developer machine',
        'Creates the CDKToolkit stack with S3 bucket and IAM roles — run once per AWS account/region',
        'Generates the initial CDK project structure',
        'Compiles TypeScript CDK code to CloudFormation templates',
      ],
      answer: 1,
      explanation: 'cdk bootstrap creates the CDKToolkit stack in the target account/region containing an S3 bucket (for Lambda assets and large templates) and IAM roles for deployments. It must be run once per account/region combination before the first cdk deploy.',
    },
    {
      q: 'Which CDK construct level provides the most opinionated, multi-resource patterns?',
      options: ['L1 (Cfn* constructs)', 'L2 (AWS constructs)', 'L3 (Pattern constructs)', 'L4 (Application constructs)'],
      answer: 2,
      explanation: 'L3 constructs (Patterns) combine multiple L2 constructs to implement complete, opinionated architectures — for example, ApplicationLoadBalancedFargateService creates a Fargate service, ALB, target group, security groups, and CloudWatch alarms together. L1 maps 1-to-1 with CloudFormation resources; L2 adds AWS-curated defaults.',
    },
    {
      q: 'You run cdk deploy --hotswap to update a Lambda function in production. What is the risk?',
      options: [
        'The Lambda function will restart with a cold start',
        'CloudFormation state becomes stale and rollback does not work',
        'The Lambda function will briefly have no code during the update',
        'hotswap requires manual approval before executing',
      ],
      answer: 1,
      explanation: 'hotswap bypasses CloudFormation and calls Lambda UpdateFunctionCode directly. CloudFormation state is not updated, so rollbacks will not work and the next regular cdk deploy may conflict. hotswap is for development iteration only — never use in production.',
    },
    {
      q: 'How do you share outputs from one CloudFormation stack with another?',
      options: [
        'Use AWS Systems Manager Parameter Store',
        'Export outputs with Export.Name and import with Fn::ImportValue',
        'Copy values manually into the consuming stack template',
        'Use cross-stack references via CDK only — not possible with raw CloudFormation',
      ],
      answer: 1,
      explanation: 'CloudFormation stack outputs can be exported with a unique name using Export.Name. Other stacks in the same account/region consume them with Fn::ImportValue. This creates a dependency — the exporting stack cannot be deleted while a consuming stack references its export.',
    },
    {
      q: 'What is a CloudFormation drift, and how do you detect it?',
      options: ['A pricing fluctuation in your stack resources', 'When a resource\'s actual configuration differs from what the CloudFormation template declares (due to manual console changes)', 'A delay in stack creation', 'A region failover event'],
      answer: 1,
      explanation: 'Drift occurs when someone manually modifies a resource outside of CloudFormation (e.g., changing a security group rule in the console). Use "Detect Drift" in the console or aws cloudformation detect-stack-drift to find resources that no longer match the template — drifted resources can cause unexpected behavior on the next stack update.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use CDK over raw CloudFormation?',
      a: 'Use CDK when: (1) you want type-safe infrastructure with IDE autocompletion and compile-time error checking; (2) you need loops, conditions, and abstractions (L3 constructs) that are verbose or impossible in YAML; (3) you are generating repetitive resources (e.g. 20 Lambda functions with the same config) — CDK loops handle this cleanly; (4) your team is already in TypeScript/Python and wants to colocate infra with application code. Use raw CloudFormation when: you are working with existing CFN templates, collaborating with teams unfamiliar with CDK, or for simple single-file stacks where the overhead is not justified.',
    },
    {
      q: 'What is the difference between DeletionPolicy and UpdateReplacePolicy?',
      a: 'DeletionPolicy controls what happens to a resource when it is removed from the stack or the stack itself is deleted. UpdateReplacePolicy controls what happens to the OLD resource when a stack update requires its replacement (e.g. changing an RDS engine version). Set both: DeletionPolicy: Retain prevents data loss on stack delete; UpdateReplacePolicy: Snapshot takes a snapshot before the old RDS instance is replaced during an update, giving you a recovery point. If you only set DeletionPolicy, a replacement during an update still deletes the old resource.',
    },
    {
      q: 'How does CDK handle cross-stack references?',
      a: 'In CDK, referencing a construct from one stack in another automatically creates a CloudFormation cross-stack reference — CDK exports the value from the producing stack and imports it in the consuming stack using Fn::ImportValue. This is convenient but creates a tight coupling: you cannot update or delete the producing stack while the consuming stack references its exports. For looser coupling, use SSM Parameter Store (produce writes the ARN to SSM; consume reads it at deploy time) or hardcode known values like S3 bucket names in shared constants.',
    },
    {
      q: 'How do I safely update a CloudFormation stack that has stateful resources?',
      a: 'Safe update process: (1) run cdk diff or create a change set — look for any resource with Action=Replace, which means delete + recreate; (2) for database updates, take a manual snapshot first outside of CloudFormation; (3) enable rollback triggers (CloudWatch alarms) so CloudFormation automatically rolls back if an alarm fires during the update; (4) use maintenance windows or deployment windows with traffic drained from the affected services; (5) for zero-downtime database schema changes, separate the schema migration from the CloudFormation update — deploy code that handles both old and new schema, then apply the migration, then update CloudFormation.',
    },
    {
      q: 'What is the difference between CloudFormation and AWS CDK?',
      a: 'CloudFormation uses declarative JSON/YAML templates directly. AWS CDK (Cloud Development Kit) lets you define infrastructure using real programming languages (TypeScript, Python, Java, C#) with loops, conditionals, and reusable constructs — CDK code is compiled ("synthesized") down to a CloudFormation template under the hood. CDK is generally preferred for complex infrastructure where you want type safety, IDE autocomplete, and the ability to share infrastructure as versioned npm/PyPI packages.',
    },
    {
      q: 'What is a CloudFormation stack set, and when would you use one?',
      a: 'A StackSet lets you deploy the same CloudFormation stack across multiple AWS accounts and regions from a single operation — essential for organization-wide guardrails (e.g., deploying a mandatory CloudTrail or GuardDuty configuration to every account) without manually deploying to each account individually. StackSets integrate with AWS Organizations for automatic deployment to new accounts as they are created.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'CloudFormation and CDK are Infrastructure as Code tools — CloudFormation uses declarative YAML/JSON, CDK uses TypeScript/Python that synthesizes to CloudFormation, adding type safety and reusable constructs.',
    mustKnow: [
      'Change Sets: always preview production updates before executing — shows Add/Modify/Replace per resource',
      'DeletionPolicy: Retain/Snapshot for stateful resources — default DELETE can destroy data',
      'CDK levels: L1 (raw CFN), L2 (curated defaults + grant methods), L3 (opinionated patterns)',
      'cdk bootstrap: one-time per account/region — creates S3 bucket and IAM roles for deployments',
      'hotswap: development only — bypasses CloudFormation, breaks rollback, no audit trail',
      'Stack separation: network / data / app stacks by lifecycle — avoid monolithic stacks',
    ],
    interviewFocus: [
      'DeletionPolicy vs UpdateReplacePolicy: explain both and when each fires',
      'CDK L1 vs L2 vs L3: give examples and explain why L2 is preferred for most use cases',
      'Change Sets: explain the workflow and why they are critical for production safety',
      'Cross-stack references: how they work in CFN and the coupling trade-offs vs SSM Parameter Store',
    ],
  };
}
