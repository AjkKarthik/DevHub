import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-aspnet-grpc',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './grpc.html',
  styleUrl: './grpc.scss',
})
export class AspnetGrpc {

  quickRef: QuickRefItem[] = [
    { name: '.proto file',           type: 'syntax',    desc: 'Contract-first schema: defines services, RPCs, and message types' },
    { name: 'Grpc.AspNetCore',       type: 'keyword',      desc: 'NuGet package — server-side gRPC for ASP.NET Core' },
    { name: 'Grpc.Net.Client',       type: 'keyword',      desc: 'NuGet — managed gRPC client (no native dependencies)' },
    { name: 'MapGrpcService<T>()',    type: 'method',    desc: 'Registers a gRPC service implementation with endpoint routing' },
    { name: 'ServerCallContext',      type: 'class',     desc: 'Access headers, deadlines, and cancellation inside an RPC' },
    { name: 'IServerStreamWriter<T>', type: 'interface', desc: 'Write items to a server-streaming or bidirectional stream' },
    { name: 'IAsyncStreamReader<T>',  type: 'interface', desc: 'Read items from a client-streaming or bidirectional stream' },
    { name: 'grpc-web',              type: 'keyword',      desc: 'Allows browsers to call gRPC services via a proxy' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'gRPC vs REST — When to Choose',
      points: [
        'gRPC uses <strong>HTTP/2</strong> with binary Protobuf serialization — typically 5–10× smaller payloads and lower latency than JSON/REST. Ideal for internal service-to-service calls where performance matters.',
        'REST is better for <strong>public APIs</strong> — broad tooling support, simple browser integration, and human-readable JSON. Browsers cannot call gRPC directly without gRPC-Web and a proxy.',
        'gRPC shines for: low-latency microservice calls, streaming (real-time feeds, progress updates, chat), polyglot environments (the <code>.proto</code> generates typed clients for Go, Python, TypeScript, etc.), and contract-first API design.',
      ],
    },
    {
      heading: 'Contract-First with .proto',
      points: [
        'Define the service in a <code>.proto</code> file: <code>service</code> declares the RPC methods; <code>message</code> defines the request and response types. Set <code>&lt;GrpcServices&gt;Server&lt;/GrpcServices&gt;</code> in the <code>.csproj</code> to generate the server base class.',
        'Protobuf fields use explicit numbers (<code>int32 id = 1</code>). Adding new fields is backwards-compatible as long as you never reuse a field number — removed fields should be <code>reserved</code>.',
        'The generator creates a <code>GreeterBase</code> abstract class. Your service extends it and overrides the RPC methods. The client stub is generated from the same <code>.proto</code> file — changing the contract breaks both simultaneously.',
      ],
    },
    {
      heading: 'Four Call Types',
      points: [
        '<strong>Unary</strong>: one request → one response. The closest equivalent to a REST call. Use for simple queries and commands.',
        '<strong>Server streaming</strong>: one request → stream of responses. Use for live feeds, progress events, or large result sets the server pushes incrementally.',
        '<strong>Client streaming</strong>: stream of requests → one response. Use for batch uploads where the client sends chunks and the server processes them all before replying.',
        '<strong>Bidirectional streaming</strong>: stream of requests ↔ stream of responses. Use for real-time bidirectional communication (chat, collaborative editing, telemetry). Both sides stream independently on the same HTTP/2 connection.',
      ],
    },
    {
      heading: 'gRPC-Web for Browser Clients',
      points: [
        'Browsers cannot use HTTP/2 trailers required by gRPC. <strong>gRPC-Web</strong> is a modified protocol that works over HTTP/1.1 and HTTP/2 without trailers. Add <code>app.UseGrpcWeb()</code> and <code>.EnableGrpcWeb()</code> per service.',
        'The <strong>Envoy proxy</strong> can translate standard gRPC to gRPC-Web for a frontend tier without touching the service code. Useful when you control the network boundary but not every service.',
        'For .NET clients (e.g., Blazor WASM or console apps), use <code>Grpc.Net.Client</code> with <code>GrpcWebHandler</code> — no Envoy needed.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: '.proto Contract',
      language: 'csharp',
      code: `// greet.proto  (placed in Protos/ folder)
syntax = "proto3";
option csharp_namespace = "MyApp.Grpc";
package greet;

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);                        // unary
  rpc StreamGreetings (HelloRequest) returns (stream HelloReply);          // server stream
  rpc CollectNames (stream HelloRequest) returns (HelloReply);             // client stream
  rpc Chat (stream HelloRequest) returns (stream HelloReply);              // bidirectional
}

message HelloRequest { string name = 1; }
message HelloReply   { string message = 1; }

// .csproj — generates GreeterBase server stubs
// <ItemGroup>
//   <Protobuf Include="Protos/greet.proto" GrpcServices="Server" />
// </ItemGroup>`,
    },
    {
      label: 'Server Implementation',
      language: 'csharp',
      code: `public class GreeterService : Greeter.GreeterBase
{
    private readonly ILogger<GreeterService> _logger;
    public GreeterService(ILogger<GreeterService> logger) => _logger = logger;

    // Unary
    public override Task<HelloReply> SayHello(
        HelloRequest request, ServerCallContext context)
        => Task.FromResult(new HelloReply
           { Message = \`Hello \${request.Name}\` });

    // Server streaming
    public override async Task StreamGreetings(
        HelloRequest request,
        IServerStreamWriter<HelloReply> responseStream,
        ServerCallContext context)
    {
        for (var i = 1; i <= 5; i++)
        {
            if (context.CancellationToken.IsCancellationRequested) break;
            await responseStream.WriteAsync(
                new HelloReply { Message = \`Hello \${request.Name} (\${i}/5)\` });
            await Task.Delay(500, context.CancellationToken);
        }
    }
}

// Registration
builder.Services.AddGrpc();
app.MapGrpcService<GreeterService>();`,
    },
    {
      label: 'Client (.NET)',
      language: 'csharp',
      code: `// NuGet: Grpc.Net.Client + Google.Protobuf + Grpc.Tools
// .csproj: <Protobuf Include="Protos/greet.proto" GrpcServices="Client" />

using var channel = GrpcChannel.ForAddress("https://localhost:7001");
var client = new Greeter.GreeterClient(channel);

// Unary
var reply = await client.SayHelloAsync(new HelloRequest { Name = "Alice" });
Console.WriteLine(reply.Message);   // Hello Alice

// Server streaming
using var stream = client.StreamGreetings(new HelloRequest { Name = "Alice" });
await foreach (var response in stream.ResponseStream.ReadAllAsync())
    Console.WriteLine(response.Message);    // Hello Alice (1/5) … (5/5)`,
    },
    {
      label: 'gRPC via IHttpClientFactory',
      language: 'csharp',
      code: `// Register the gRPC client using the factory (typed + resilience)
builder.Services.AddGrpcClient<Greeter.GreeterClient>(o =>
    o.Address = new Uri("https://grpc-service:443"))
.ConfigureChannel(o =>
    o.HttpHandler = new SocketsHttpHandler
    {
        PooledConnectionIdleTimeout    = TimeSpan.FromMinutes(5),
        KeepAlivePingDelay             = TimeSpan.FromSeconds(60),
        KeepAlivePingTimeout           = TimeSpan.FromSeconds(30),
        EnableMultipleHttp2Connections = true,
    })
.AddStandardResilienceHandler();    // retry + circuit breaker + timeout

// Inject like any service
public class ProductService(Greeter.GreeterClient grpcClient)
{
    public async Task<string> GreetAsync(string name)
    {
        var reply = await grpcClient.SayHelloAsync(new HelloRequest { Name = name });
        return reply.Message;
    }
}`,
    },
    {
      label: 'gRPC-Web',
      language: 'csharp',
      code: `// Server — enable gRPC-Web (NuGet: Grpc.AspNetCore.Web)
builder.Services.AddGrpc();
app.UseGrpcWeb(new GrpcWebOptions { DefaultEnabled = true });
app.MapGrpcService<GreeterService>().EnableGrpcWeb();

// Browser / Blazor WASM client (NuGet: Grpc.Net.Client.Web)
var channel = GrpcChannel.ForAddress("https://localhost:7001",
    new GrpcChannelOptions
    {
        HttpHandler = new GrpcWebHandler(new HttpClientHandler()),
    });
var client = new Greeter.GreeterClient(channel);
var reply  = await client.SayHelloAsync(new HelloRequest { Name = "Blazor" });`,
    },
  ];

  challenge: Challenge = {
    title: 'gRPC Product Service',
    language: 'csharp',
    description: 'Build a gRPC product service. Requirements: (1) Define a products.proto with a Products service having two RPCs: GetProduct(ProductRequest) returns (ProductReply) [unary] and ListProducts(Empty) returns (stream ProductReply) [server streaming]. (2) Implement the service — GetProduct returns a hardcoded product or throws RpcException with StatusCode.NotFound. (3) ListProducts streams 3 products with 200ms delay between each. (4) Register and map the service.',
    hints: [
      'Empty from google/protobuf/empty.proto or define your own empty message',
      'Throw new RpcException(new Status(StatusCode.NotFound, "Product not found")) for missing items',
      'await responseStream.WriteAsync(reply) inside a loop for streaming',
      'app.MapGrpcService<ProductsService>() registers the service',
    ],
    starterCode: `// products.proto
syntax = "proto3";
option csharp_namespace = "MyApp.Grpc";

service Products {
  // TODO: GetProduct (unary) — returns one product by id
  // TODO: ListProducts (server streaming) — streams all products
}

// TODO: define ProductRequest and ProductReply messages

// ProductsService.cs
public class ProductsService : Products.ProductsBase
{
    // TODO: override GetProduct
    // TODO: override ListProducts (streaming)
}

// Program.cs
// TODO: AddGrpc() + MapGrpcService<ProductsService>()`,
    solution: `// products.proto
syntax = "proto3";
option csharp_namespace = "MyApp.Grpc";
import "google/protobuf/empty.proto";

service Products {
  rpc GetProduct (ProductRequest) returns (ProductReply);
  rpc ListProducts (google.protobuf.Empty) returns (stream ProductReply);
}

message ProductRequest { int32 id = 1; }
message ProductReply   { int32 id = 1; string name = 2; double price = 3; }

// ProductsService.cs
public class ProductsService : Products.ProductsBase
{
    private static readonly List<ProductReply> _store =
    [
        new() { Id = 1, Name = "Laptop",     Price = 999.99 },
        new() { Id = 2, Name = "Keyboard",   Price = 79.99  },
        new() { Id = 3, Name = "Monitor",    Price = 349.99 },
    ];

    public override Task<ProductReply> GetProduct(
        ProductRequest request, ServerCallContext context)
    {
        var product = _store.FirstOrDefault(p => p.Id == request.Id)
            ?? throw new RpcException(new Status(StatusCode.NotFound,
               \`Product \${request.Id} not found\`));
        return Task.FromResult(product);
    }

    public override async Task ListProducts(
        Empty request,
        IServerStreamWriter<ProductReply> stream,
        ServerCallContext context)
    {
        foreach (var p in _store)
        {
            if (context.CancellationToken.IsCancellationRequested) break;
            await stream.WriteAsync(p);
            await Task.Delay(200, context.CancellationToken);
        }
    }
}

// Program.cs
builder.Services.AddGrpc();
app.MapGrpcService<ProductsService>();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What protocol does gRPC use for transport?',
      options: ['HTTP/1.1 with JSON', 'WebSockets', 'HTTP/2 with Protobuf', 'HTTP/3 with MessagePack'],
      answer: 2,
      explanation: 'gRPC uses HTTP/2 for multiplexed streams and Protobuf (Protocol Buffers) for binary serialization. This gives it lower latency and smaller payloads compared to JSON over HTTP/1.1.',
    },
    {
      q: 'Which call type should you use for a live feed of stock price updates?',
      options: ['Unary', 'Client streaming', 'Server streaming', 'Bidirectional streaming'],
      answer: 2,
      explanation: 'Server streaming: the client sends one request (subscribe) and the server pushes a stream of responses (price updates) indefinitely. The client reads until it cancels or the server closes the stream.',
    },
    {
      q: 'Why can browsers not call gRPC services directly?',
      options: [
        'Browsers do not support Protobuf',
        'Browsers cannot use HTTP/2 trailers required by the gRPC protocol',
        'gRPC requires TLS certificates browsers cannot validate',
        'gRPC uses UDP which browsers block',
      ],
      answer: 1,
      explanation: 'The gRPC protocol uses HTTP/2 trailers to deliver status codes after the response body. Browser fetch and XMLHttpRequest APIs cannot access HTTP/2 trailers, so gRPC-Web (which avoids trailers) is needed.',
    },
    {
      q: 'What is the correct way to return a "not found" error from a gRPC service?',
      options: [
        'return null',
        'return new ProductReply { Id = 0 }',
        'throw new RpcException(new Status(StatusCode.NotFound, "message"))',
        'Response.StatusCode = 404; return;',
      ],
      answer: 2,
      explanation: 'gRPC has its own status code system independent of HTTP. Throwing RpcException with a Status object communicates the error to the client through the gRPC trailer — the client receives a typed exception with the code and message.',
    },
    {
      q: 'When is gRPC a better choice than REST?',
      options: [
        'Public APIs consumed by browsers',
        'Internal service-to-service calls requiring low latency, typed contracts, or streaming',
        'APIs that need to be easily tested with curl',
        'Single-page applications fetching data',
      ],
      answer: 1,
      explanation: 'gRPC excels for internal microservice communication: smaller binary payloads, multiplexed streams, and generated typed clients in multiple languages. REST is better for public-facing APIs due to tooling, browser support, and human-readability.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use both gRPC and REST in the same ASP.NET Core app?',
      a: 'Yes. MapGrpcService<T>() and MapControllers() (or Map*() minimal API methods) coexist on the same WebApplication. They are both built on endpoint routing. The key difference is that gRPC requires HTTP/2 — you may need to configure Kestrel to support both HTTP/1.1 (for REST) and HTTP/2 (for gRPC) on different ports.',
    },
    {
      q: 'How do I handle deadlines and cancellation in a gRPC service?',
      a: 'Use ServerCallContext.CancellationToken inside your RPC method — it is cancelled when the client deadline expires or the client disconnects. Always pass it to async operations (ToListAsync(ct), Task.Delay(ms, ct)) so the server stops work immediately when the client is gone.',
    },
    {
      q: 'What happens when I change a .proto message field number?',
      a: 'Never reuse or change field numbers — they are the wire-format identity. Changing number 1 from string name to int32 id breaks any client that still sends the old field. To remove a field, mark it reserved: "reserved 1;". Adding new fields with new numbers is backwards-compatible — old clients ignore unknown fields.',
    },
    {
      q: 'How do I add authentication to a gRPC service?',
      a: 'gRPC uses the standard ASP.NET Core auth pipeline. Add [Authorize] to the service class or individual methods. Tokens arrive as HTTP headers — clients set them via CallCredentials or CallOptions.Headers. For JWT: configure AddAuthentication().AddJwtBearer() as usual; gRPC picks up the Authorization header automatically.',
    },
    {
      q: 'Is gRPC suitable for public APIs?',
      a: 'Generally no. gRPC lacks broad browser support (needs gRPC-Web + proxy), has limited tooling compared to REST/OpenAPI, and binary Protobuf is not human-readable. For public APIs, REST + OpenAPI is the standard. gRPC is ideal for the internal service mesh where you control all clients.',
    },
  ];
}
