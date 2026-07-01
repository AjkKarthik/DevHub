import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';

@Component({
  selector: 'app-ai-dotnet',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent, QnaBlockComponent],
  templateUrl: './ai-dotnet.html',
  styleUrl: './ai-dotnet.scss',
})
export class AiDotnet {
  quickRef: QuickRefItem[] = [
    { name: 'Semantic Kernel',   type: 'keyword', desc: 'Microsoft\'s open-source AI SDK for .NET/Python — orchestrates LLMs, plugins, planners, memory.' },
    { name: 'Microsoft.ML',      type: 'keyword', desc: 'ML.NET — train and deploy ML models in C# without Python. Regression, classification, clustering.' },
    { name: 'ONNX Runtime',      type: 'keyword', desc: 'Run ONNX models in C# — cross-platform, hardware-accelerated inference for any ONNX model.' },
    { name: 'Azure OpenAI',      type: 'keyword', desc: 'Azure-hosted OpenAI endpoints — same API as OpenAI but in your Azure tenant with RBAC and VNet.' },
    { name: 'SK Plugin',         type: 'keyword', desc: 'Semantic Kernel plugin = collection of native (C#) or semantic (prompt) functions.' },
    { name: 'Kernel Memory',     type: 'keyword', desc: 'Microsoft\'s RAG framework for .NET — ingests, embeds, stores, and retrieves documents.' },
    { name: 'Azure AI Search',   type: 'keyword', desc: 'Managed vector + keyword + hybrid search — integrates natively with Azure OpenAI for RAG.' },
    { name: 'ML.NET AutoML',     type: 'keyword', desc: 'Auto-select best ML algorithm + hyperparameters for your dataset in C#.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Semantic Kernel Overview',
      points: [
        'Semantic Kernel (SK) is Microsoft\'s open-source AI orchestration SDK for .NET, Python, and Java — the C# alternative to LangChain.',
        'Core concepts: Kernel (DI container for AI services), Plugin (collection of functions), Planner (LLM decides which functions to call), Memory (vector store for RAG).',
        'Native functions: regular C# methods decorated with [KernelFunction] — SK handles serialisation, docstring parsing, and LLM registration.',
        'Semantic functions: prompt templates stored as YAML — the LLM IS the function implementation.',
        'Connectors: plug in OpenAI, Azure OpenAI, HuggingFace, Anthropic, Mistral — same SK API regardless of provider.',
      ],
    },
    {
      heading: 'ML.NET and ONNX Runtime',
      points: [
        'ML.NET: train scikit-learn-style pipelines in C# — data loaders, feature transforms, trainers, evaluators. No Python required.',
        'Supported tasks: binary/multi-class classification, regression, clustering, anomaly detection, image classification (ResNet transfer learning), text classification.',
        'ONNX Runtime: load any ONNX model (exported from PyTorch, TensorFlow, sklearn) and run inference in C# — CPU or GPU, Windows/Linux/macOS/WASM.',
        'Use case: team trained a fraud detection model in Python/PyTorch; export to ONNX; integrate into .NET API via OnnxRuntime.InferenceSessions.',
        'ML.NET AutoML: give it a dataset and task type; it searches algorithms and hyperparameters automatically and returns the best model + evaluation.',
      ],
    },
    {
      heading: 'Azure AI Services',
      points: [
        'Azure OpenAI: deploy GPT-4o, GPT-4o-mini, text-embedding-3 models in your Azure subscription. Same OpenAI SDK — just change endpoint + API key.',
        'Azure AI Search: vector index + BM25 hybrid search + semantic reranking — the recommended vector store for Azure-based RAG.',
        'Azure AI Content Safety: built-in harm detection API — classify text/images for hate, violence, sexual, self-harm content. Returns scores per category.',
        'Azure AI Document Intelligence: extract structured data from PDFs, invoices, receipts — OCR + form recognition as a managed service.',
        'Azure Machine Learning: managed MLOps — training compute, experiment tracking, model registry, deployment endpoints, monitoring.',
      ],
    },
    {
      heading: 'Building RAG in .NET',
      points: [
        'Kernel Memory (Microsoft): ingest PDFs/text → chunk → embed (Azure OpenAI) → store in Azure AI Search or Qdrant → query with semantic search.',
        'Pattern: IKernelMemory.ImportDocumentAsync() for ingestion; IKernelMemory.AskAsync() for RAG query — one library call for the full pipeline.',
        'Alternative: LangChain.NET (community port) or build manually with Azure.AI.OpenAI SDK + Azure.Search.Documents.',
        'Streaming in ASP.NET: use IAsyncEnumerable<string> from SK chat streaming, yield return each token from a Controller action (or use SignalR for WebSocket).',
        'Authentication: use Azure Managed Identity — no API keys in config files. AzureCliCredential for local dev, DefaultAzureCredential for deployed services.',
      ],
    },
    {
      heading: 'Semantic Kernel vs. Direct SDK Calls in .NET',
      points: [
        'Semantic Kernel provides an abstraction layer over multiple LLM providers (OpenAI, Azure OpenAI, others), plugin/function-calling orchestration, and memory management — useful when an application needs to remain provider-agnostic or compose multiple AI capabilities.',
        'Calling the OpenAI or Azure OpenAI SDK directly is simpler and has less abstraction overhead for applications that only need straightforward completions against a single known provider, without the added complexity of an orchestration framework.',
        'Semantic Kernel\'s planner and plugin system enables more complex agentic workflows (multi-step reasoning, tool composition) that would require significantly more hand-rolled orchestration code if built directly against a raw SDK.',
        'The choice between these approaches should be driven by actual application complexity — adopting Semantic Kernel for a simple single-call use case adds unnecessary abstraction overhead without proportional benefit.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Semantic Kernel',
      language: 'typescript',
      code: `// Semantic Kernel in C# (.NET 8)
// dotnet add package Microsoft.SemanticKernel

// using Microsoft.SemanticKernel;
// using Microsoft.SemanticKernel.Connectors.OpenAI;

// // 1. Build Kernel with Azure OpenAI
// var kernel = Kernel.CreateBuilder()
//     .AddAzureOpenAIChatCompletion(
//         deploymentName: "gpt-4o",
//         endpoint: Environment.GetEnvironmentVariable("AZURE_OPENAI_ENDPOINT")!,
//         apiKey: Environment.GetEnvironmentVariable("AZURE_OPENAI_KEY")!)
//     .Build();

// // 2. Native plugin — C# method as an AI tool
// public class MathPlugin
// {
//     [KernelFunction("calculate")]
//     [Description("Evaluate a mathematical expression")]
//     public double Calculate([Description("Math expression e.g. 2+2")] string expression)
//         => new DataTable().Compute(expression, null).To<double>();
// }

// kernel.Plugins.AddFromType<MathPlugin>();

// // 3. Semantic function — prompt template
// var summarise = kernel.CreateFunctionFromPrompt("""
//     Summarise the following text in 3 bullet points:
//     {{$input}}
//     """, functionName: "Summarise");

// var result = await kernel.InvokeAsync(summarise, new() { ["input"] = longText });
// Console.WriteLine(result);

// // 4. Chat with function calling
// var chatHistory = new ChatHistory("You are a helpful assistant.");
// chatHistory.AddUserMessage("What is 15% of 340?");

// var chatService = kernel.GetRequiredService<IChatCompletionService>();
// var response = await chatService.GetChatMessageContentAsync(
//     chatHistory,
//     new OpenAIPromptExecutionSettings { ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions },
//     kernel);
// Console.WriteLine(response.Content);  // "15% of 340 is 51."`,
    },
    {
      label: 'Kernel Memory (RAG)',
      language: 'typescript',
      code: `// Kernel Memory — full RAG pipeline in .NET
// dotnet add package Microsoft.KernelMemory

// using Microsoft.KernelMemory;

// var memory = new KernelMemoryBuilder()
//     .WithAzureOpenAITextGeneration(new AzureOpenAIConfig
//     {
//         APIType = AzureOpenAIConfig.APITypes.ChatCompletion,
//         Endpoint = Environment.GetEnvironmentVariable("AZURE_OPENAI_ENDPOINT")!,
//         APIKey = Environment.GetEnvironmentVariable("AZURE_OPENAI_KEY")!,
//         Deployment = "gpt-4o"
//     })
//     .WithAzureOpenAITextEmbeddingGeneration(new AzureOpenAIConfig
//     {
//         APIType = AzureOpenAIConfig.APITypes.EmbeddingGeneration,
//         Endpoint = Environment.GetEnvironmentVariable("AZURE_OPENAI_ENDPOINT")!,
//         APIKey = Environment.GetEnvironmentVariable("AZURE_OPENAI_KEY")!,
//         Deployment = "text-embedding-3-small"
//     })
//     .WithAzureAISearchMemoryDb(new AzureAISearchConfig
//     {
//         Endpoint = Environment.GetEnvironmentVariable("AZURE_SEARCH_ENDPOINT")!,
//         APIKey = Environment.GetEnvironmentVariable("AZURE_SEARCH_KEY")!
//     })
//     .Build<MemoryServerless>();

// // Ingest documents
// await memory.ImportDocumentAsync("policies.pdf", documentId: "policies-v1");
// await memory.ImportWebPageAsync("https://example.com/faq", documentId: "faq");
// await memory.ImportTextAsync("Refund window: 30 days from purchase.", documentId: "refund-policy");

// // Wait for ingestion
// while (!await memory.IsDocumentReadyAsync("policies-v1")) await Task.Delay(1000);

// // RAG query
// var answer = await memory.AskAsync("What is the return policy?");
// Console.WriteLine(answer.Result);           // grounded answer
// foreach (var source in answer.RelevantSources)
//     Console.WriteLine($"  Source: {source.DocumentId}, Score: {source.Partitions[0].Relevance:P1}");

// // ONNX Runtime inference (from Python-trained model)
// // dotnet add package Microsoft.ML.OnnxRuntime
// using Microsoft.ML.OnnxRuntime;
// using Microsoft.ML.OnnxRuntime.Tensors;

// using var session = new InferenceSession("model.onnx");
// var inputTensor = new DenseTensor<float>(new float[] { 1.0f, 2.0f, 3.0f }, new[] { 1, 3 });
// var inputs = new List<NamedOnnxValue> { NamedOnnxValue.CreateFromTensor("input", inputTensor) };
// using var results = session.Run(inputs);
// var output = results[0].AsEnumerable<float>().ToArray();`,
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use Semantic Kernel vs calling the OpenAI SDK directly in .NET?',
      a: 'Use OpenAI SDK directly when: you have a single, simple LLM call (chat completion or embedding); you want minimal dependencies; you need maximum control over the request/response. Use Semantic Kernel when: you\'re building an agentic system with multiple tools; you want LLM provider portability (swap OpenAI → Azure → HuggingFace without code changes); you need built-in planning and orchestration; you\'re building a multi-step pipeline that benefits from SK\'s plugin/function abstraction. SK adds overhead — for simple chatbots, the raw SDK is cleaner. For complex agents or multi-provider applications, SK pays for itself.',
    },
    {
      q: 'How do I run ONNX models in a .NET API for low-latency inference?',
      a: 'Install Microsoft.ML.OnnxRuntime (CPU) or Microsoft.ML.OnnxRuntime.Gpu. Export your model to ONNX from PyTorch: torch.onnx.export(model, sample_input, "model.onnx", opset_version=17). Load once at startup as a singleton InferenceSession (thread-safe). For each request: build a DenseTensor<float> from your feature vector, wrap in NamedOnnxValue, call session.Run(). ONNX Runtime handles thread management — safe to call from multiple concurrent requests. For GPU: pass SessionOptions with CUDA execution provider. Typical p50 latency for a 100M-param classification model: 5–15ms on CPU, <1ms on GPU.',
    },
    {
      q: 'How do I implement streaming LLM responses in ASP.NET Core?',
      a: 'Three approaches: (1) SSE Controller: set Response.Headers["Content-Type"] = "text/event-stream"; Response.Headers["Cache-Control"] = "no-cache"; then await foreach (var chunk in chatService.GetStreamingChatMessageContentsAsync(...)) await Response.WriteAsync("data: " + chunk.Content + "\\n\\n"). (2) SignalR: hub method streams chunks via Clients.Caller.SendAsync("token", chunk). (3) Minimal API with IAsyncEnumerable: return Results.Stream(async (stream) => { await foreach (var chunk in llmStream) await stream.WriteAsync(Encoding.UTF8.GetBytes(chunk)); }). SSE is simplest for web clients. SignalR is better for real-time multi-user scenarios.',
    },
    {
      q: 'What is the recommended architecture for a .NET RAG application on Azure?',
      a: 'Architecture: (1) Document ingestion: Azure Function or background job → Kernel Memory or custom pipeline → chunk → embed with text-embedding-3 (Azure OpenAI) → index in Azure AI Search (vector + keyword). (2) Query API: ASP.NET Core → embed query → hybrid search (vector + BM25 + semantic reranker) in Azure AI Search → rerank top-5 → inject context into GPT-4o prompt → stream response to client. (3) Authentication: Managed Identity throughout — no keys in config, RBAC on all Azure resources. (4) Monitoring: Azure Application Insights for request traces + custom events for LLM cost/token tracking. (5) Content Safety: Azure AI Content Safety on both input and output to catch harmful content.',
    },
  { q: 'How do I add AI features to a Blazor application?', a: 'Install Semantic Kernel NuGet packages. Register services in Program.cs: builder.Services.AddKernel().AddOpenAIChatCompletion(modelId, apiKey). Inject IChatCompletionService in your Blazor component. For streaming: use GetStreamingChatMessageContentsAsync() in a loop, updating a string field that triggers re-renders via StateHasChanged(). For long operations, run in a background task and update the UI incrementally.' },
  { q: 'How do I use Azure AI Search with Semantic Kernel in .NET?', a: 'Install Microsoft.SemanticKernel.Connectors.AzureAISearch. Register: kernel.UseAzureAISearchVectorStore(endpoint, apiKey). Define a data model class with [VectorStoreRecordKey], [VectorStoreRecordData], and [VectorStoreRecordVector] attributes. Use IVectorStoreRecordCollection for CRUD. For RAG: embed a query with ITextEmbeddingGenerationService, call SearchAsync() with the embedding, inject results into the prompt. Full pipeline in ~50 lines of C#.' },
  ];
}
