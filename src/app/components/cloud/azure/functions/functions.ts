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
  selector: 'app-azure-functions',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './functions.html',
  styleUrl: './functions.scss'
})
export class AzureFunctions {

  quickRef: QuickRefItem[] = [
    { name: 'Trigger', type: 'type', desc: 'Defines how a function is invoked: HTTP, Timer (cron), Queue, Service Bus, Event Hub, Blob, Event Grid, Cosmos DB change feed.' },
    { name: 'Input binding', type: 'type', desc: 'Declarative way to read data from an external source (Blob, Table, Cosmos DB) without writing SDK code — injected as a parameter.' },
    { name: 'Output binding', type: 'type', desc: 'Declarative way to write data to an external sink (Queue, Blob, Cosmos DB) — set the return value or a bound parameter.' },
    { name: 'Consumption plan', type: 'keyword', desc: 'True serverless: pay per execution (₹0 for the first 1M/month). Scales to zero, cold starts on first invocation after idle.' },
    { name: 'Flex Consumption plan', type: 'keyword', desc: 'New plan (2024): per-execution billing like Consumption but with VNet integration, larger instance sizes, and faster scale.' },
    { name: 'Premium plan', type: 'keyword', desc: 'Pre-warmed instances eliminate cold starts. Supports VNET integration and larger VMs. Billed per-second of instance runtime.' },
    { name: 'Durable Functions', type: 'type', desc: 'Extension for stateful workflows: orchestrators, activities, entity functions. Built on top of Azure Storage (or Netherite/MSSQL backend).' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Triggers & Bindings',
      points: [
        'Every Azure Function has exactly one trigger — the event source that invokes it. Common triggers: HttpTrigger (HTTP request), TimerTrigger (cron schedule), QueueTrigger (Storage Queue message), ServiceBusTrigger, EventHubTrigger, BlobTrigger, CosmosDBTrigger (change feed).',
        'Input bindings let you read from external sources (Blob Storage, Azure Table, Cosmos DB) declaratively in function.json or with C# attributes — without writing SDK client code. The runtime handles connection and retry.',
        'Output bindings let you write to external sinks (Queue, Blob, Cosmos DB, Service Bus) by assigning to a bound parameter or returning a value. Multiple output bindings can be on one function.',
        'Bindings reduce boilerplate dramatically: an HTTP trigger + Cosmos DB input + Queue output function can route HTTP data to a queue with no SDK code — just attributes and parameter types.',
        'The function.json file (or equivalent attributes) declares trigger/binding metadata: type, direction (in/out), connection (app setting name), and type-specific options (path, queueName, databaseName).',
      ]
    },
    {
      heading: 'Hosting Plans',
      points: [
        'Consumption plan: true pay-per-use serverless. You pay for executions (first 1M free) and GB-seconds of memory. Functions scale to zero when idle — cold starts occur on the first invocation after the idle timeout (default 20 min).',
        'Flex Consumption plan (2024): Same per-execution billing as Consumption but adds VNet integration, larger instance sizes (up to 4 GB RAM), and "always-ready instances" to pre-warm without full Premium pricing.',
        'Premium plan (EP1–EP3): Pre-warmed instances eliminate cold starts. Supports VNET integration, private endpoints, and larger VMs. Billed per-second of running instance time — more predictable for high-volume functions.',
        'Dedicated (App Service) plan: Functions run on your App Service Plan VMs. No scale-to-zero, no per-execution billing — suitable for long-running functions or when you already have an App Service Plan with spare capacity.',
        'Container Apps plan: Host functions as a container in an Azure Container Apps Environment. KEDA-based scaling, VNET integration, and Dapr support. Bridges serverless and Kubernetes worlds.',
      ]
    },
    {
      heading: 'Durable Functions',
      points: [
        'Durable Functions add stateful orchestration on top of Azure Functions using an orchestrator/activity pattern. Orchestrator functions coordinate activity functions, fan-out/fan-in, wait for external events, and implement long-running workflows.',
        'The orchestrator replays its history on each checkpoint — this means orchestrator code must be deterministic (no DateTime.Now, no random, no I/O directly). All I/O goes in activity functions.',
        'Sub-orchestrations, human approval patterns (waitForExternalEvent + raiseEvent), and Entity functions (virtual actors for distributed state) extend the basic orchestrator/activity model.',
        'The Durable Task Framework stores orchestration state in Azure Storage (tables + blobs) or alternative backends (Netherite for high throughput, MSSQL for SQL-compatible storage).',
        'Common patterns: chaining (sequential activities), fan-out/fan-in (parallel activities, await all), async HTTP (start long job, return 202 + status URL), monitor (poll until done), human approval.',
      ]
    },
    {
      heading: 'Cold Starts, Scaling & KEDA',
      points: [
        'A cold start happens when a new function instance must be initialised from scratch — JIT compilation, dependency injection setup, and connection pool warming. In .NET, cold starts can be 1–10 seconds on Consumption.',
        'Mitigation strategies: use Premium plan pre-warmed instances; enable "always-ready instances" on Flex Consumption; use .NET AOT (Isolated worker process + AOT compilation) to reduce cold start to ~200ms; keep the function assembly small.',
        'Functions on Consumption/Flex scale out by adding instances — one instance can handle one concurrent invocation (for queue/Service Bus triggers). Scale is driven by the Azure Functions scale controller, which monitors trigger backlogs.',
        'KEDA (Kubernetes Event-Driven Autoscaling) is the open-source scaler behind Azure Functions on Container Apps and AKS. It watches trigger sources (queue depth, event hub consumer lag) and scales deployments to zero or out.',
        'Concurrency: HTTP functions can handle multiple concurrent requests on one instance (configurable with FUNCTIONS_WORKER_PROCESS_COUNT and maxConcurrentRequests). Queue and Service Bus functions default to MANY concurrent messages per instance, not one — Storage Queue defaults to a batch size of 16 (up to 24 concurrent), and Service Bus defaults maxConcurrentCalls to 16 (multiplied by core count).',
      ]
    },
    {
      heading: 'Cold Start and Consumption Plan Tradeoffs',
      points: [
        'On the Consumption plan, Azure Functions scale to zero when idle, meaning the first request after a period of inactivity incurs a "cold start" — the time to provision and initialize a new instance before it can handle the request, which can be a noticeable latency spike for latency-sensitive scenarios.',
        'Premium and Dedicated (App Service) plans keep a minimum number of instances warm, eliminating cold start at the cost of paying for that baseline compute even when idle — a direct tradeoff between cost efficiency (Consumption) and consistent latency (Premium/Dedicated).',
        'Cold start duration varies significantly by language runtime and dependency footprint — a function with heavy dependencies or a slow-to-initialize runtime experiences a longer cold start than a lean function with minimal cold-path initialization work.',
        'Consumption plan billing (per-execution, per-GB-second) makes it extremely cost-effective for genuinely infrequent or bursty workloads, while a consistently high-traffic function may actually cost less on a Premium plan once cold-start-avoidance and per-execution costs are compared at scale.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'HTTP & Timer Triggers (.NET)',
      language: 'csharp',
      code: `// HTTP Trigger — isolated worker process (.NET 8)
[Function("HelloHttp")]
public IActionResult RunHttp(
    [HttpTrigger(AuthorizationLevel.Function, "get", "post")] HttpRequest req,
    FunctionContext context)
{
    var name = req.Query["name"].ToString() ?? "World";
    return new OkObjectResult($"Hello, {name}!");
}

// Timer Trigger — runs every 5 minutes
[Function("Cleanup")]
public void RunTimer(
    [TimerTrigger("0 */5 * * * *")] TimerInfo timer,
    FunctionContext context)
{
    var logger = context.GetLogger("Cleanup");
    logger.LogInformation($"Cleanup ran at: {DateTime.UtcNow}");
}

// Queue Trigger + Cosmos DB output binding
[Function("ProcessOrder")]
[CosmosDBOutput("orders", "processed",
    Connection = "CosmosDBConnection")]
public OrderDoc? RunQueue(
    [QueueTrigger("orders", Connection = "StorageConnection")] string message,
    FunctionContext context)
{
    var order = JsonSerializer.Deserialize<Order>(message);
    return new OrderDoc { Id = order!.Id, Status = "processed" };
}`
    },
    {
      label: 'Durable Orchestration',
      language: 'csharp',
      code: `// Activity function (does real I/O)
[Function(nameof(ProcessItem))]
public string ProcessItem([ActivityTrigger] string itemId, FunctionContext ctx) =>
    $"Processed {itemId} at {DateTime.UtcNow:s}";

// Orchestrator function (coordinates activities)
[Function(nameof(OrchestratorFanOut))]
public async Task<List<string>> OrchestratorFanOut(
    [OrchestrationTrigger] TaskOrchestrationContext context)
{
    // Fan-out: start all activities in parallel
    var itemIds = new[] { "item-1", "item-2", "item-3" };
    var tasks = itemIds.Select(id =>
        context.CallActivityAsync<string>(nameof(ProcessItem), id));

    // Fan-in: wait for all to complete
    var results = await Task.WhenAll(tasks);
    return results.ToList();
}

// HTTP starter — begins orchestration and returns status URL
[Function("StartOrchestration")]
public async Task<HttpResponseData> StartOrchestration(
    [HttpTrigger(AuthorizationLevel.Function, "post")] HttpRequestData req,
    [DurableClient] DurableTaskClient client,
    FunctionContext ctx)
{
    string instanceId = await client.ScheduleNewOrchestrationInstanceAsync(
        nameof(OrchestratorFanOut));
    return await client.CreateCheckStatusResponseAsync(req, instanceId);
}`
    },
    {
      label: 'Deploy via CLI',
      language: 'bash',
      code: `# Create a Function App on Consumption plan
az storage account create \\
  --name mystorageacc123 \\
  --resource-group my-rg \\
  --sku Standard_LRS

az functionapp create \\
  --name my-func-app \\
  --resource-group my-rg \\
  --storage-account mystorageacc123 \\
  --consumption-plan-location eastus \\
  --runtime dotnet-isolated \\
  --runtime-version 8 \\
  --functions-version 4

# Deploy from a publish folder
cd MyFunctionApp
dotnet publish -c Release -o ./publish
cd publish && zip -r ../app.zip .
az functionapp deployment source config-zip \\
  --name my-func-app \\
  --resource-group my-rg \\
  --src ../app.zip

# Set app settings
az functionapp config appsettings set \\
  --name my-func-app \\
  --resource-group my-rg \\
  --settings AzureWebJobsStorage=<conn> CosmosDBConnection=<conn>

# Stream live logs
az functionapp log stream --name my-func-app --resource-group my-rg`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Writing non-deterministic code inside an orchestrator function',
      wrong: `// In orchestrator: DateTime.Now, Guid.NewGuid(), random, HttpClient — all wrong`,
      right: `// Use context.CurrentUtcDateTime, context.NewGuid(); put I/O in activity functions`,
      explanation: 'Orchestrator functions replay their history on every checkpoint. Non-deterministic operations produce different values on replay and corrupt the orchestration state. All I/O, timestamps, and randomness must go inside activity functions.'
    },
    {
      title: 'Using Consumption plan for functions with >10 min execution time',
      wrong: `// Consumption plan hard-limits execution to 10 minutes (configurable to max 10)`,
      right: `// Use Premium or Dedicated plan for long-running functions; or use Durable Functions`,
      explanation: 'Consumption plan enforces a maximum execution timeout of 10 minutes (default 5). Premium and Dedicated plans allow up to 60 minutes (or unlimited on Dedicated). For workflows that take hours, use Durable Functions regardless of plan.'
    },
    {
      title: 'Storing secrets in host.json or local.settings.json and committing them',
      wrong: `// local.settings.json has AzureWebJobsStorage = "DefaultEndpointsProtocol=https;AccountKey=..."`,
      right: `// Reference app settings by name; use Key Vault references for production secrets`,
      explanation: 'local.settings.json is for local development only and should be in .gitignore. In production, use app settings in the Function App configuration (never commit connection strings). Reference Key Vault secrets via managed identity for zero-secret-in-config deployment.'
    },
    {
      title: 'Not handling poison messages on queue triggers',
      wrong: `// Queue trigger fails repeatedly — message retried until it disappears silently`,
      right: `// Configure maxDequeueCount (default 5); poison messages moved to <queue>-poison queue`,
      explanation: 'Azure Queue Storage automatically moves a message to a poison queue after maxDequeueCount failed attempts. Service Bus uses dead-letter queues. Monitor poison/dead-letter queues and set alerts — otherwise failed messages are silently lost.'
    },
  ];

  challenge: Challenge = {
    title: 'Implement a simple retry executor',
    language: 'typescript',
    description: 'Durable Functions have built-in retry policies, but write your own for activity-like tasks:\n\nImplement retry<T>(fn: () => Promise<T>, maxAttempts: number, delayMs: number): Promise<T>\n\nIt should try fn(), and on failure wait delayMs milliseconds before retrying. Throw the last error if all attempts fail.',
    hints: [
      'Use a for loop from 0 to maxAttempts - 1',
      'Catch errors and on the last attempt re-throw instead of sleeping',
      'Use a helper sleep = (ms: number) => new Promise(r => setTimeout(r, ms))',
    ],
    starterCode: `export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  delayMs: number
): Promise<T> {
  // try fn() up to maxAttempts times
  // wait delayMs between attempts
  // throw last error if all attempts fail
  throw new Error('not implemented');
}`,
    solution: `export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  delayMs: number
): Promise<T> {
  const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts - 1) await sleep(delayMs);
    }
  }
  throw lastError;
}

// Test
let calls = 0;
retry(() => {
  calls++;
  if (calls < 3) return Promise.reject(new Error('fail'));
  return Promise.resolve('success');
}, 3, 10).then(r => console.log(r, 'calls:', calls));
// 'success' calls: 3`
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which Azure Functions hosting plan scales to zero and charges per execution?',
      options: ['Premium plan', 'Dedicated (App Service) plan', 'Consumption plan', 'Container Apps plan'],
      answer: 2,
      explanation: 'Consumption plan is true serverless — functions scale to zero when idle and you pay only for executions (first 1M/month free) plus GB-seconds of memory. The trade-off is cold starts after the idle timeout. Premium plan has pre-warmed instances but is billed per-second of instance runtime.'
    },
    {
      q: 'What is the maximum execution timeout on the Consumption plan?',
      options: ['1 minute', '5 minutes (default, max 10)', '30 minutes', 'Unlimited'],
      answer: 1,
      explanation: 'Consumption plan defaults to a 5-minute timeout (functionTimeout in host.json) and the maximum is 10 minutes. For longer work, switch to Premium/Dedicated plan (up to 60 min, or unlimited on Dedicated) or use Durable Functions for orchestrated long-running workflows.'
    },
    {
      q: 'Why must orchestrator functions in Durable Functions be deterministic?',
      options: [
        'Azure enforces it with a compiler check',
        'Because orchestrators replay their history on every checkpoint — non-deterministic code produces different values on replay and corrupts state',
        'To reduce memory usage',
        'Orchestrators run in a sandbox without network access'
      ],
      answer: 1,
      explanation: 'The Durable Task Framework replays orchestrator history to reconstruct current state. If DateTime.Now or random values differ on replay vs original execution, the orchestration diverges and produces incorrect or corrupted results. Use context.CurrentUtcDateTime and put all I/O in activity functions.'
    },
    {
      q: 'What happens to a Storage Queue message after it fails maxDequeueCount times?',
      options: [
        'It is permanently deleted',
        'It is moved to a poison queue named <original-queue>-poison',
        'It is retried indefinitely',
        'It triggers an alert but stays in the queue'
      ],
      answer: 1,
      explanation: 'After maxDequeueCount failed attempts (default 5), Azure Storage Queue moves the message to a <queuename>-poison queue. The function stops seeing it. Monitor poison queues with alerts — messages there need manual investigation and reprocessing.'
    },
    {
      q: 'Which binding direction lets you read data from Cosmos DB into a function parameter without SDK code?',
      options: ['Trigger', 'Input binding', 'Output binding', 'Middleware'],
      answer: 1,
      explanation: 'Input bindings declaratively inject data from external sources (Cosmos DB, Blob, Table) as function parameters. The Functions runtime handles authentication, connection pooling, and retry — you just declare the binding attributes. Output bindings write to sinks; triggers invoke the function.'
    },
    {
      q: 'Which Durable Functions orchestration pattern splits work into parallel activities and waits for all to complete?',
      options: [
        'Function chaining',
        'Fan-out/fan-in',
        'Eternal orchestration',
        'Human interaction pattern',
      ],
      answer: 1,
      explanation: 'The fan-out/fan-in pattern fires multiple activity functions in parallel (fan-out), then waits for all results using Task.WhenAll before continuing (fan-in) ideal for batch processing.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Consumption, Flex Consumption, and Premium plans?',
      a: '<strong>Consumption</strong>: pay per execution, scales to zero, cold starts, max 10 min timeout, no VNet. <strong>Flex Consumption</strong> (2024): same per-execution billing but adds VNet integration, up to 4 GB RAM instances, "always-ready" instances to reduce cold starts, and faster scale-out. <strong>Premium (EP1+)</strong>: pre-warmed instances (no cold starts), VNet integration, larger VMs, billed per-second of instance runtime. Choose Consumption for low/unpredictable traffic; Flex for VNet + serverless pricing; Premium for consistent high-volume or latency-sensitive workloads.'
    },
    {
      q: 'When should you use Durable Functions vs a plain Azure Function?',
      a: 'Use <strong>Durable Functions</strong> for: (1) multi-step workflows where each step must succeed before the next (chaining), (2) fan-out/fan-in (parallel activity calls then aggregate), (3) long-running processes that exceed the 10-minute timeout, (4) human approval / wait-for-external-event patterns, (5) stateful entity actors. Use <strong>plain Functions</strong> for simple, stateless, single-operation tasks: HTTP endpoints, queue processors, scheduled jobs.'
    },
    {
      q: 'How do you eliminate cold starts on Azure Functions?',
      a: 'Options by cost: (1) <strong>Flex Consumption always-ready instances</strong> — pay for N pre-warmed instances at reduced rate; (2) <strong>Premium plan pre-warmed instances</strong> — guaranteed zero cold start, billed per-second; (3) <strong>.NET AOT compilation</strong> (isolated worker process) — reduces cold start to ~200ms even on Consumption; (4) <strong>Dedicated plan</strong> — always warm, but no scale-to-zero. Keeping assemblies small, using singleton patterns for heavy initialisation, and lazy-loading expensive resources also reduce effective cold start impact.'
    },
    {
      q: 'How do output bindings differ from input bindings?',
      a: '<strong>Input bindings</strong> read data from external sources into the function (direction: "in") — e.g. read a Blob by name, look up a Cosmos DB document by ID. <strong>Output bindings</strong> write data from the function to external sinks (direction: "out") — e.g. enqueue a message, write a Blob, insert a Cosmos DB document. Both eliminate SDK boilerplate — you declare the binding attributes and the runtime handles the connection, authentication, and I/O.'
    },
    {
      q: 'What storage does Durable Functions use and can you change it?',
      a: 'By default, Durable Functions stores orchestration state in <strong>Azure Storage</strong> (history table, instance table, work-item queue, large message blobs). For high-throughput scenarios, switch to the <strong>Netherite backend</strong> (EventHubs + Azure Storage, much higher throughput and lower latency). The <strong>MSSQL backend</strong> stores state in a SQL database — useful for SQL-native visibility and querying of orchestration state. Configure the backend in host.json under extensions.durableTask.storageProvider.'
    },
    {
      q: 'How does Durable Functions survive a host restart in the middle of a multi-day orchestration without losing progress?',
      a: 'Durable Functions uses "event sourcing": rather than keeping the orchestrator\'s progress in memory, every awaited step (an activity completing, a timer firing) is persisted as an event to Azure Storage (queues and tables by default). If the host restarts mid-orchestration, the orchestrator function is REPLAYED from the beginning against the persisted event history — completed steps return their already-recorded results instantly instead of re-executing, so the orchestrator "catches up" to exactly where it left off and continues from there, deterministically, with no lost state.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Azure Functions is event-driven serverless compute — one trigger per function, declarative input/output bindings to eliminate SDK code, and Durable Functions for stateful multi-step orchestration.',
    mustKnow: [
      'One trigger per function; input bindings read data in, output bindings write data out — all declared, no SDK client code',
      'Consumption: pay-per-execution, scales to zero, cold starts, max 10 min — Flex Consumption adds VNet + faster scale',
      'Premium: pre-warmed (no cold starts), VNet integration, billed per-second of instance time',
      'Durable Functions: orchestrator (deterministic, no I/O) + activity (real I/O) + patterns: fan-out/in, monitor, human approval',
      'Orchestrators must be deterministic — replay history on checkpoint; use context.CurrentUtcDateTime not DateTime.Now',
      'Poison queues: messages that fail maxDequeueCount times move to <queue>-poison — monitor with alerts',
    ],
    interviewFocus: [
      'Explain Consumption vs Premium plan trade-offs — when do cold starts matter?',
      'Why must orchestrator functions be deterministic and what breaks if they are not?',
      'When would you use Durable Functions vs a plain stateless function?',
      'What is the difference between an input binding and an output binding?',
    ],
  };
}
