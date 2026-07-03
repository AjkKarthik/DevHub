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
  selector: 'app-aws-step-functions',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './step-functions.html',
  styleUrl: './step-functions.scss'
})
export class AwsStepFunctions {

  quickRef: QuickRefItem[] = [
    { name: 'State Machine', type: 'keyword', desc: 'JSON (Amazon States Language) definition of states and transitions; each execution follows the graph.' },
    { name: 'Task State', type: 'keyword', desc: 'Invokes a worker: Lambda, AWS SDK service integration (DynamoDB, SQS, ECS, Bedrock), HTTP endpoint, or Activity.' },
    { name: 'Choice State', type: 'keyword', desc: 'Branches execution based on input data conditions — equivalent to if/else or switch logic.' },
    { name: 'Parallel State', type: 'keyword', desc: 'Runs multiple branches concurrently; waits for ALL branches to complete before continuing.' },
    { name: 'Map State', type: 'keyword', desc: 'Iterates over an array, running states for each element — sequential or concurrent (up to 40 concurrency).' },
    { name: 'Wait State', type: 'keyword', desc: 'Pauses execution for a fixed duration or until a timestamp — useful for delays between retries.' },
    { name: 'Standard Workflow', type: 'keyword', desc: 'Long-running (up to 1 year), at-most-once execution, full audit history in CloudWatch. Priced per state transition.' },
    { name: 'Express Workflow', type: 'keyword', desc: 'High-throughput (>100k/s), at-least-once, max 5 minutes, priced per execution duration. No audit history by default.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Standard vs Express Workflows',
      points: [
        'Standard: max duration 1 year, at-most-once execution semantics, full execution history queryable via API.',
        'Standard: priced per state transition (~$0.025/1000 transitions); good for human approval flows, long-running sagas.',
        'Express: max 5 minutes, at-least-once (may re-execute states on failure), up to 100,000 executions per second.',
        'Express: priced per execution duration (GB-second) — cheaper for high-volume short workflows.',
        'Synchronous Express: caller waits for result; Asynchronous Express: fire-and-forget with CloudWatch Logs for tracing.',
        'Lambda Power Tuning uses Express workflows — high invocation rate, short duration, needs low cost.',
      ]
    },
    {
      heading: 'Amazon States Language (ASL)',
      points: [
        'State machine is a JSON object with States map; each state has Type, Next (or End: true), and type-specific fields.',
        'Task state: Resource is the Lambda ARN or SDK integration ARN (arn:aws:states:::dynamodb:putItem).',
        'SDK integrations: request/response (async Lambda), sync (wait for task completion), waitForTaskToken (human approval).',
        '.waitForTaskToken: Step Functions pauses until a task token is sent back via SendTaskSuccess/SendTaskFailure.',
        'InputPath, OutputPath, ResultPath, Parameters: JSON Path expressions to shape input/output at each state.',
        'Context object: $$. prefix gives access to execution metadata (execution name, start time, state name).',
      ]
    },
    {
      heading: 'Error Handling: Catch & Retry',
      points: [
        'Retry: per-state array of retrier objects with ErrorEquals, IntervalSeconds, MaxAttempts, BackoffRate.',
        'Default retry: Lambda.ServiceException, Lambda.TooManyRequests, Lambda.AWSLambdaException auto-retry recommended.',
        'Catch: fallback states when retries are exhausted; ErrorEquals can match specific error names or "States.ALL".',
        'Error names: custom (thrown by Lambda as error.name), built-in (States.Timeout, States.TaskFailed, States.HeartbeatTimeout).',
        'ResultPath in Catch: preserve original input and add error info at a path (e.g. "$.error") for downstream states.',
        'Compensation: on failure, Catch routes to a compensation branch that undoes completed steps (saga pattern).',
      ]
    },
    {
      heading: 'Parallel, Map & Wait States',
      points: [
        'Parallel: each branch receives the same input; output is an array of branch results in definition order.',
        'Parallel use case: run credit check + inventory check + fraud detection concurrently for an order.',
        'Map: iterates over event.items array; MaxConcurrency controls parallelism (0 = unlimited, 1 = sequential).',
        'Map use case: process each row in a CSV uploaded to S3 — fan out up to 40 concurrent Lambda invocations.',
        'Wait: seconds (fixed), timestamp (absolute), secondsPath/timestampPath (from input data).',
        'Wait use case: pause 24 hours after sending an email, then check if user confirmed — no polling Lambda needed.',
      ]
    },
    {
      heading: 'Observability & Common Patterns',
      points: [
        'Execution history: Standard workflows store event history queryable via API (GetExecutionHistory) for debugging.',
        'X-Ray: enable on the state machine to trace Lambda invocations within a workflow end-to-end.',
        'CloudWatch Metrics: ExecutionsStarted, ExecutionsFailed, ExecutionThrottled — set alarms on failures.',
        'Saga pattern: each successful step in a Parallel state has a corresponding compensation; Catch at top level triggers rollback.',
        'Human approval: Task state with .waitForTaskToken + API Gateway callback → Step Functions SendTaskSuccess.',
        'ETL pipeline: EventBridge schedule → Step Functions → Map over S3 objects → Lambda transform → DynamoDB write.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'State Machine Definition',
      language: 'bash',
      code: `# Create a state machine (Standard workflow)
aws stepfunctions create-state-machine \\
  --name order-processing \\
  --type STANDARD \\
  --role-arn arn:aws:iam::123:role/StepFunctionsRole \\
  --definition '{
    "Comment": "Order processing workflow",
    "StartAt": "ValidateOrder",
    "States": {
      "ValidateOrder": {
        "Type": "Task",
        "Resource": "arn:aws:lambda:us-east-1:123:function:validate-order",
        "Retry": [{"ErrorEquals": ["Lambda.ServiceException","Lambda.TooManyRequests"],
          "IntervalSeconds": 2, "MaxAttempts": 3, "BackoffRate": 2}],
        "Catch": [{"ErrorEquals": ["States.ALL"], "Next": "OrderFailed", "ResultPath": "$.error"}],
        "Next": "ProcessPayment"
      },
      "ProcessPayment": {
        "Type": "Task",
        "Resource": "arn:aws:lambda:us-east-1:123:function:process-payment",
        "Next": "FulfillOrder"
      },
      "FulfillOrder": {
        "Type": "Task",
        "Resource": "arn:aws:lambda:us-east-1:123:function:fulfill-order",
        "End": true
      },
      "OrderFailed": {
        "Type": "Task",
        "Resource": "arn:aws:lambda:us-east-1:123:function:notify-failure",
        "End": true
      }
    }
  }'

# Start an execution
aws stepfunctions start-execution \\
  --state-machine-arn arn:aws:states:us-east-1:123:stateMachine:order-processing \\
  --input '{"orderId":"abc123","amount":99.99,"customerId":"cust1"}'`,
    },
    {
      label: 'Choice, Parallel & Map',
      language: 'bash',
      code: `# Choice state example (route by order amount)
# "CheckAmount": {
#   "Type": "Choice",
#   "Choices": [
#     {"Variable": "$.amount", "NumericGreaterThan": 1000, "Next": "PremiumFlow"},
#     {"Variable": "$.status", "StringEquals": "priority", "Next": "PriorityFlow"}
#   ],
#   "Default": "StandardFlow"
# }

# Parallel state (run multiple checks at once)
# "RunChecks": {
#   "Type": "Parallel",
#   "Branches": [
#     {"StartAt": "CreditCheck", "States": {"CreditCheck": {"Type":"Task","Resource":"arn:...","End":true}}},
#     {"StartAt": "FraudCheck", "States": {"FraudCheck": {"Type":"Task","Resource":"arn:...","End":true}}},
#     {"StartAt": "InventoryCheck", "States": {"InventoryCheck": {"Type":"Task","Resource":"arn:...","End":true}}}
#   ],
#   "Next": "ProcessResults"
# }

# Map state (process each item in an array)
# "ProcessItems": {
#   "Type": "Map",
#   "ItemsPath": "$.items",
#   "MaxConcurrency": 10,
#   "Iterator": {
#     "StartAt": "ProcessItem",
#     "States": {
#       "ProcessItem": {"Type":"Task","Resource":"arn:...","End":true}
#     }
#   },
#   "Next": "Done"
# }

# Describe a running execution
aws stepfunctions describe-execution \\
  --execution-arn arn:aws:states:us-east-1:123:execution:order-processing:exec-id

# Get execution history for debugging
aws stepfunctions get-execution-history \\
  --execution-arn arn:aws:states:us-east-1:123:execution:order-processing:exec-id`,
    },
    {
      label: 'Error Handling & Retry',
      language: 'bash',
      code: `# State with full retry + catch configuration
# "ChargeCard": {
#   "Type": "Task",
#   "Resource": "arn:aws:lambda:us-east-1:123:function:charge-card",
#   "Retry": [
#     {
#       "ErrorEquals": ["PaymentTemporaryError"],
#       "IntervalSeconds": 5,
#       "MaxAttempts": 3,
#       "BackoffRate": 2,
#       "JitterStrategy": "FULL"
#     },
#     {
#       "ErrorEquals": ["Lambda.TooManyRequests","Lambda.ServiceException"],
#       "IntervalSeconds": 1,
#       "MaxAttempts": 5,
#       "BackoffRate": 1.5
#     }
#   ],
#   "Catch": [
#     {
#       "ErrorEquals": ["PaymentDeclinedError"],
#       "Next": "NotifyDeclined",
#       "ResultPath": "$.paymentError"
#     },
#     {
#       "ErrorEquals": ["States.ALL"],
#       "Next": "HandleUnexpectedError",
#       "ResultPath": "$.error"
#     }
#   ],
#   "Next": "SendConfirmation"
# }

# waitForTaskToken pattern (human approval)
# "AwaitApproval": {
#   "Type": "Task",
#   "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
#   "Parameters": {
#     "FunctionName": "send-approval-email",
#     "Payload": {"taskToken.$": "$$.Task.Token", "orderId.$": "$.orderId"}
#   },
#   "HeartbeatSeconds": 86400,
#   "Next": "ProcessApproved"
# }

# Resume paused execution (from approval Lambda or API)
aws stepfunctions send-task-success \\
  --task-token "TOKEN_FROM_EMAIL_LINK" \\
  --task-output '{"approved":true,"reviewerId":"mgr1"}'`,
    },
    {
      label: 'SDK Integrations & Express',
      language: 'bash',
      code: `# SDK integration: write to DynamoDB directly (no Lambda)
# "SaveOrder": {
#   "Type": "Task",
#   "Resource": "arn:aws:states:::dynamodb:putItem",
#   "Parameters": {
#     "TableName": "Orders",
#     "Item": {
#       "orderId": {"S.$": "$.orderId"},
#       "status": {"S": "processing"},
#       "amount": {"N.$": "States.Format('{}', $.amount)"}
#     }
#   },
#   "Next": "SendSQSMessage"
# }

# SDK integration: send to SQS
# "NotifyFulfillment": {
#   "Type": "Task",
#   "Resource": "arn:aws:states:::sqs:sendMessage",
#   "Parameters": {
#     "QueueUrl": "https://sqs.us-east-1.amazonaws.com/123/fulfillment",
#     "MessageBody.$": "States.JsonToString($.order)"
#   },
#   "End": true
# }

# Create Express workflow (high throughput)
aws stepfunctions create-state-machine \\
  --name data-transformer \\
  --type EXPRESS \\
  --role-arn arn:aws:iam::123:role/StepFunctionsRole \\
  --logging-configuration '{
    "level": "ERROR",
    "includeExecutionData": false,
    "destinations": [{"cloudWatchLogsLogGroup": {"logGroupArn": "arn:aws:logs:us-east-1:123:log-group:/aws/states/data-transformer"}}]
  }' \\
  --definition '{"StartAt":"Transform","States":{"Transform":{"Type":"Task","Resource":"arn:...","End":true}}}'

# Start sync Express execution (caller waits for result)
aws stepfunctions start-sync-execution \\
  --state-machine-arn arn:aws:states:us-east-1:123:stateMachine:data-transformer \\
  --input '{"record":"..."}'`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using Standard workflow for high-volume short tasks',
      wrong: `# Standard workflow for every API request
# 10,000 requests/min × 5 state transitions = 50,000 transitions/min
# Cost: 50,000 × $0.025/1000 = $1.25/min = $1,800/day
# Plus full execution history stored for every invocation`,
      right: `# Use Express workflow for high-volume, short-duration tasks
aws stepfunctions create-state-machine \\
  --name api-pipeline \\
  --type EXPRESS
# Express: $0.00001/execution + GB-second pricing
# Same 10,000/min = ~$14/day vs $1,800/day for Standard
# Reserve Standard for: long-running sagas, human approval, audit trails`,
      explanation: 'Standard workflows are priced per state transition and store full execution history — expensive at scale. Use Express for high-throughput short workflows (API orchestration, ETL, event processing). Use Standard for long-running business processes requiring audit history.'
    },
    {
      title: 'No Retry configuration on Task states',
      wrong: `# Task state with no Retry
# "ProcessPayment": {"Type":"Task","Resource":"arn:...","Next":"Done"}
# Lambda throttled once → execution fails immediately
# Customer sees payment error; operator manually re-runs execution`,
      right: `# Always add Retry for transient Lambda errors
# "ProcessPayment": {
#   "Type": "Task",
#   "Resource": "arn:...",
#   "Retry": [{
#     "ErrorEquals": ["Lambda.ServiceException","Lambda.TooManyRequests","Lambda.AWSLambdaException"],
#     "IntervalSeconds": 2,
#     "MaxAttempts": 3,
#     "BackoffRate": 2,
#     "JitterStrategy": "FULL"
#   }],
#   "Next": "Done"
# }`,
      explanation: 'Lambda can throttle or have transient errors. Without Retry, a single throttle fails the entire workflow. Always add retries for Lambda.TooManyRequests and Lambda.ServiceException at minimum. JitterStrategy: FULL prevents thundering herd.'
    },
    {
      title: 'Passing large payloads between states',
      wrong: `# State machine passes full 5MB image bytes between states
# Step Functions payload limit = 256 KB
# Execution fails: "State input/output is too large"`,
      right: `# Use S3 as intermediary for large payloads
# Step 1 Lambda: process image → save result to S3 → return {"s3Key": "results/abc.json"}
# Step 2 Lambda: receives {"s3Key":"..."} → reads from S3 → processes
# State machine only passes small references between states
# AWS SDK integration with S3 getObject can fetch inline if needed`,
      explanation: 'Step Functions has a 256 KB payload limit per state input/output. For large data (images, CSV, query results), store in S3 and pass only the S3 key between states. This is the standard pattern for ETL and ML pipelines.'
    },
    {
      title: 'Missing ResultPath in Catch — losing original input',
      wrong: `# Catch without ResultPath
# "Catch": [{"ErrorEquals": ["States.ALL"], "Next": "HandleError"}]
# Error state receives only: {"Error":"States.TaskFailed","Cause":"..."}
# Original order data (orderId, customerId) is gone
# Cannot log or compensate without the original context`,
      right: `# Use ResultPath to merge error info without replacing input
# "Catch": [{
#   "ErrorEquals": ["States.ALL"],
#   "Next": "HandleError",
#   "ResultPath": "$.error"
# }]
# Error state receives: {"orderId":"abc","customerId":"c1","error":{"Error":"...","Cause":"..."}}
# Original input is preserved alongside error details`,
      explanation: 'Without ResultPath, the Catch state receives only the error object, losing all input data. Set ResultPath to "$.error" to merge the error into the original input, so downstream states have both the context and the error details for logging and compensation.'
    },
    {
      title: 'Using Step Functions for simple Lambda chaining',
      wrong: `# State machine with 3 Task states that just chain Lambda calls
# Lambda A → Lambda B → Lambda C
# Each Lambda takes 100ms; overhead per transition: ~200ms
# State machine adds complexity with no value over direct invocation`,
      right: `# Option 1: Chain Lambdas directly (A invokes B, B invokes C)
# Option 2: Single Lambda that calls A logic, B logic, C logic in sequence
# Use Step Functions when you need:
# - Visual workflow / audit trail
# - Branching, error handling, retries across multiple services
# - Human approval steps
# - Long waits (hours/days) between steps
# - Parallel execution of independent branches`,
      explanation: 'Step Functions adds latency (~200ms per state transition) and cost. For simple sequential Lambda calls with no branching or error handling complexity, direct invocation or a single Lambda is simpler. Reserve Step Functions for workflows that genuinely need orchestration.'
    },
  ];

  challenge: Challenge = {
    title: 'Design an Order Saga with Compensation',
    language: 'typescript',
    description: `Design a Step Functions state machine implementing the Saga pattern for an order:
1. Reserve inventory (Lambda)
2. Charge payment (Lambda) — if fails, release inventory (compensation)
3. Schedule shipment (Lambda) — if fails, refund payment + release inventory

Use: Parallel state for concurrent pre-checks (stock + fraud), Choice state to route premium vs standard orders, Retry on all Lambda tasks, and Catch with compensation flow.`,
    hints: [
      'Run stock check + fraud check in Parallel first, then proceed to reserveInventory',
      'Use Choice after Parallel to branch on $.fraudScore > 0.8 → reject',
      'ResultPath: "$.error" in Catch preserves original input for compensation Lambdas',
      'Compensation states chain: RefundPayment → ReleaseInventory → NotifyFailure → End',
      'waitForTaskToken on ChargePayment enables 3DS verification before continuing',
    ],
    starterCode: `// Order Saga State Machine (Amazon States Language)
// Define the JSON state machine structure

const orderSaga = {
  Comment: "Order processing saga with compensation",
  StartAt: "PreChecks",
  States: {
    // TODO: Parallel state - run StockCheck and FraudCheck concurrently
    PreChecks: {
      Type: "Parallel",
      Branches: [
        // TODO: StockCheck branch
        // TODO: FraudCheck branch
      ],
      Next: "RouteByRisk"
    },

    // TODO: Choice state - reject if fraud score high, else proceed
    RouteByRisk: { Type: "Choice", Choices: [], Default: "ReserveInventory" },

    // TODO: Task - ReserveInventory with Retry + Catch → RefundPayment
    // TODO: Task - ChargePayment with Retry + Catch → ReleaseInventory
    // TODO: Task - ScheduleShipment with Retry + Catch → RefundAndRelease
    // TODO: Compensation states: RefundPayment, ReleaseInventory, NotifyFailure
  }
};
`,
    solution: `// Order Saga — Amazon States Language (ASL)
const orderSaga = {
  Comment: "Order processing saga with compensation",
  StartAt: "PreChecks",
  States: {
    PreChecks: {
      Type: "Parallel",
      Branches: [
        {
          StartAt: "StockCheck",
          States: { StockCheck: { Type: "Task", Resource: "arn:aws:lambda:us-east-1:123:function:check-stock", End: true } }
        },
        {
          StartAt: "FraudCheck",
          States: { FraudCheck: { Type: "Task", Resource: "arn:aws:lambda:us-east-1:123:function:check-fraud", End: true } }
        }
      ],
      ResultPath: "$.checks",
      Next: "RouteByRisk"
    },

    RouteByRisk: {
      Type: "Choice",
      Choices: [
        { Variable: "$.checks[1].fraudScore", NumericGreaterThan: 0.8, Next: "RejectOrder" }
      ],
      Default: "ReserveInventory"
    },

    RejectOrder: { Type: "Task", Resource: "arn:aws:lambda:us-east-1:123:function:reject-order", End: true },

    ReserveInventory: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123:function:reserve-inventory",
      Retry: [{ ErrorEquals: ["Lambda.TooManyRequests", "Lambda.ServiceException"], IntervalSeconds: 2, MaxAttempts: 3, BackoffRate: 2 }],
      Catch: [{ ErrorEquals: ["States.ALL"], Next: "NotifyFailure", ResultPath: "$.error" }],
      Next: "ChargePayment"
    },

    ChargePayment: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123:function:charge-payment",
      Retry: [{ ErrorEquals: ["PaymentTemporaryError"], IntervalSeconds: 5, MaxAttempts: 2, BackoffRate: 2 }],
      Catch: [{ ErrorEquals: ["States.ALL"], Next: "ReleaseInventory", ResultPath: "$.error" }],
      Next: "ScheduleShipment"
    },

    ScheduleShipment: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123:function:schedule-shipment",
      Retry: [{ ErrorEquals: ["Lambda.TooManyRequests"], IntervalSeconds: 1, MaxAttempts: 3, BackoffRate: 1.5 }],
      Catch: [{ ErrorEquals: ["States.ALL"], Next: "RefundPayment", ResultPath: "$.error" }],
      End: true
    },

    // Compensation states
    RefundPayment: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123:function:refund-payment",
      Next: "ReleaseInventory"
    },
    ReleaseInventory: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123:function:release-inventory",
      Next: "NotifyFailure"
    },
    NotifyFailure: {
      Type: "Task",
      Resource: "arn:aws:lambda:us-east-1:123:function:notify-failure",
      End: true
    }
  }
};`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the maximum execution duration for a Standard workflow in Step Functions?',
      options: ['15 minutes', '24 hours', '90 days', '1 year'],
      answer: 3,
      explanation: 'Standard workflows can run for up to 1 year (365 days). This makes them suitable for long-running business processes like human approval flows, order lifecycle management, and multi-step data pipelines with waiting periods.',
    },
    {
      q: 'A state machine passes a 500 KB payload between two Task states. What will happen?',
      options: [
        'Step Functions automatically compresses the payload',
        'The execution fails with a payload size error',
        'The payload is automatically stored in S3',
        'Only the first 256 KB is passed to the next state',
      ],
      answer: 1,
      explanation: 'Step Functions has a hard 256 KB limit per state input/output. Exceeding it causes an execution failure. The solution is to store large data in S3 and pass only the S3 key reference between states.',
    },
    {
      q: 'Which state type would you use to run a credit check, fraud check, and inventory check simultaneously?',
      options: ['Map State', 'Parallel State', 'Choice State', 'Task State with concurrency'],
      answer: 1,
      explanation: 'The Parallel state runs multiple branches concurrently, each with its own state graph. It waits for ALL branches to complete before moving to the next state. This is the correct choice for running independent checks simultaneously.',
    },
    {
      q: 'What does .waitForTaskToken on a Task state do?',
      options: [
        'Retries the task until it returns a token',
        'Pauses the execution until an external process calls SendTaskSuccess with the token',
        'Generates a JWT token for Lambda authorization',
        'Waits for the Lambda function to finish warming up',
      ],
      answer: 1,
      explanation: 'waitForTaskToken pauses the state machine indefinitely until an external process calls SendTaskSuccess or SendTaskFailure with the provided task token. This is the pattern for human approval flows — Step Functions passes the token in the Lambda event; the approval Lambda emails a link; clicking the link calls SendTaskSuccess.',
    },
    {
      q: 'When should you choose Express workflow over Standard workflow?',
      options: [
        'When you need execution history stored for audit purposes',
        'When workflows run longer than 5 minutes',
        'When you need high throughput (>1000 executions/second) with short duration',
        'When the workflow requires human approval steps',
      ],
      answer: 2,
      explanation: 'Express workflows support up to 100,000 executions per second and are priced per execution duration — far cheaper than Standard at high volume. Use Express for API orchestration, event processing, and ETL pipelines that complete in under 5 minutes. Standard is needed for long durations, audit history, and at-most-once semantics.',
    },
    {
      q: 'A team migrates a workflow from Standard to Express to cut costs at high volume, without changing any of the underlying Task states. A Task that charges a customer\'s credit card now occasionally charges them twice. What changed, and what should the team have done before migrating?',
      options: ['Express workflows have a billing bug unrelated to the migration', 'Express\'s at-least-once execution semantics mean a Task can be re-invoked after a transient failure even if it actually succeeded (e.g. the success response was lost in transit) — Standard\'s exactly-once semantics masked this risk, so any Task with a real-world side effect must be made idempotent before it is safe to run under Express', 'Express workflows require a different Lambda runtime that broke the payment code', 'The team needed to enable X-Ray tracing before migrating'], answer: 1,
      explanation: 'Standard\'s exactly-once guarantee meant teams could get away with Task code that was not idempotent — a charge-the-card Lambda that isn\'t safe to call twice never actually got called twice under Standard. Express workflows only guarantee at-least-once: if Step Functions cannot confirm a Task\'s outcome (a network blip, a timeout on the acknowledgment even though the Task itself succeeded), it may re-invoke the same Task. This is invisible during Standard-workflow testing and only surfaces once traffic runs under Express, which is why any migration to Express requires an idempotency audit of every Task with an external side effect (e.g. using an idempotency key so a repeated charge request is a no-op) — not just a cost/throughput evaluation.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does the Saga pattern work in Step Functions?',
      a: 'The Saga pattern manages distributed transactions without two-phase commit. In Step Functions: each forward step (Task state) has a corresponding Catch that routes to a compensation branch. If Step 3 fails, the Catch routes to Undo Step 2, then Undo Step 1 — in reverse order. Each compensation Lambda reverses its corresponding forward step (refund payment, release inventory, cancel reservation). The key is using ResultPath in Catch to preserve the original input so compensation Lambdas have the context needed to undo their operations.',
    },
    {
      q: 'What is the difference between SDK integrations and Lambda invocations in Step Functions?',
      a: 'Lambda invocations run custom code but add Lambda cold start latency, require Lambda permissions, and cost per GB-second. SDK integrations call AWS service APIs directly from Step Functions without a Lambda — for example, arn:aws:states:::dynamodb:putItem writes to DynamoDB, arn:aws:states:::sqs:sendMessage puts a message on a queue. SDK integrations are faster (no Lambda overhead), cheaper, and simpler. Use them for straightforward AWS API calls; use Lambda when you need custom business logic, conditional transformation, or multi-step processing within a single state.',
    },
    {
      q: 'How do I pass data between states and transform it along the way?',
      a: 'Step Functions has four JSON Path operators: InputPath (select which part of input to pass to the Resource), Parameters (construct a new object with literal values and JSON Path refs — use .$: suffix), ResultPath (where to put the task output — "$.result" merges it, null discards it), and OutputPath (select what to pass to the next state). A common pattern: Parameters shapes the Lambda event, ResultPath adds the response at "$.stepResult", OutputPath selects only "$.stepResult" so the next state starts fresh. Use States.Format(), States.JsonToString(), States.StringToJson() for string transformations.',
    },
    {
      q: 'How do I debug a failing Step Functions execution?',
      a: 'For Standard workflows, open the execution in the console — the visual workflow highlights the failed state in red, and clicking it shows the input, output, and error cause. Use GetExecutionHistory via CLI for programmatic access. Enable X-Ray tracing to see Lambda invocation traces within the workflow. For Express workflows (no built-in history), configure logging to CloudWatch Logs with level ERROR and includeExecutionData: true — query with CloudWatch Logs Insights. Common causes: payload > 256 KB, missing IAM permissions on the execution role, Lambda timeout shorter than state HeartbeatSeconds.',
    },
    {
      q: 'What is the benefit of using Step Functions over chaining multiple Lambda functions together with direct invocations?',
      a: 'Directly chaining Lambda invocations (one function calling another) couples the orchestration logic into application code, makes the overall workflow state and progress invisible without custom logging, and complicates error handling/retries across the chain. Step Functions externalizes the orchestration as a visual, declarative state machine — providing built-in retry/catch logic per step, a visual execution history showing exactly which step succeeded/failed and with what input/output, and the ability to run steps in parallel or wait for external callbacks, all without embedding that coordination logic inside the Lambda functions themselves.',
    },
    {
      q: 'What is a Step Functions "callback pattern" (waitForTaskToken), and when is it needed?',
      a: 'The callback pattern lets a Step Functions execution pause a task and wait for an external system to explicitly resume it by calling SendTaskSuccess or SendTaskFailure with a task token, rather than the state machine immediately continuing after invoking a service. This is essential for workflows requiring human approval steps, integration with third-party systems that process asynchronously, or any long-running external process where Step Functions needs to wait an indeterminate amount of time for a result that cannot be returned synchronously from the initial invocation.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Step Functions orchestrates serverless workflows with visual state machines — use Standard for long-running audited processes and Express for high-volume short pipelines.',
    mustKnow: [
      'Standard: 1-year max, at-most-once, full history, priced per transition — for sagas and human approval',
      'Express: 5-min max, at-least-once, high throughput, priced per duration — for API orchestration and ETL',
      'Retry: always add for Lambda.TooManyRequests and Lambda.ServiceException on every Task state',
      'Catch + ResultPath: preserve original input alongside error info for compensation and logging',
      'Payload limit: 256 KB per state — store large data in S3, pass only S3 key references',
      'waitForTaskToken: pauses execution until external process calls SendTaskSuccess — enables human approval',
    ],
    interviewFocus: [
      'Standard vs Express: cost and semantics trade-offs for different use cases',
      'Saga pattern implementation: how Catch + compensation states handle distributed rollback',
      'waitForTaskToken: explain the human approval flow end-to-end',
      'SDK integrations vs Lambda: when to call DynamoDB/SQS directly without a Lambda intermediary',
    ],
  };
}
