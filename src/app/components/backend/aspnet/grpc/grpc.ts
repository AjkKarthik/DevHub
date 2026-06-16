import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-aspnet-grpc',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './grpc.html',
  styleUrl: './grpc.scss',
})
export class AspnetGrpc {

  prerequisites: Prerequisite[] = [
    { label: 'Minimal APIs',   route: '/aspnet/minimal-apis' },
    { label: 'Authentication', route: '/aspnet/authentication' },
  ];

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
        'gRPC uses <strong>HTTP/2</strong> with binary Protobuf serialization — typically 5–10× smaller payloads and significantly lower latency than JSON/REST. The binary format avoids string parsing, reducing CPU overhead on both sides.',
        'REST is better for <strong>public APIs</strong>: broad tooling support (curl, Postman, browser fetch), human-readable JSON for debugging, and no code generation step. gRPC\'s binary format and generated stubs add friction for external consumers.',
        'gRPC shines for: low-latency internal microservice calls, streaming (real-time feeds, progress updates, log tailing, chat), and polyglot environments where the <code>.proto</code> file generates typed clients for Go, Python, TypeScript, Java, and more from a single source of truth.',
        'gRPC is <strong>contract-first</strong>: the <code>.proto</code> file is the single source of truth, and both server stub and client stub are generated from it. API drift is impossible — any contract change breaks compilation on both sides, forcing intentional versioning.',
        'HTTP/2 multiplexing means hundreds of concurrent RPC streams can share a single TCP connection. Compare this to REST over HTTP/1.1 where each request needs its own connection (or waits in the queue). This makes gRPC particularly efficient under high concurrency.',
        'Practical rule: use REST for anything external-facing or consumed by browsers without a proxy; use gRPC for internal service mesh, high-throughput pipelines, and any scenario requiring bidirectional or long-running streams.',
      ],
    },
    {
      heading: 'Contract-First with Protobuf (.proto)',
      points: [
        'Define the service in a <code>.proto</code> file (syntax = "proto3"): <code>service</code> declares RPC methods; <code>message</code> defines request/response types. Add <code>&lt;Protobuf Include="Protos/greet.proto" GrpcServices="Server" /&gt;</code> to the <code>.csproj</code> — the toolchain runs <code>protoc</code> at build time and generates C# classes.',
        'Protobuf field numbers (e.g., <code>int32 id = 1</code>) are the wire identity — not the field name. You can rename a field without breaking the wire format, but changing the number or type is a breaking change. Use <code>reserved 2, "old_field";</code> to prevent accidental reuse of retired field numbers.',
        'Adding new optional fields (proto3 has no required fields) is always backwards-compatible. Old clients ignore unknown fields; old servers return zero/empty for missing fields. This makes rolling deployments safe without a flag day.',
        'The build generates a <code>GreeterBase</code> abstract class (server) and a <code>Greeter.GreeterClient</code> class (client). Implement the base class on the server; use the generated client class to make calls. Both are strongly typed — no string literals or manual serialization.',
        'Use <code>well-known types</code> from Google\'s library for common patterns: <code>google.protobuf.Empty</code> for no-arg methods, <code>google.protobuf.Timestamp</code> for dates, <code>google.protobuf.StringValue</code> for nullable strings. Import with <code>import "google/protobuf/empty.proto"</code>.',
        'Protobuf 3 removed required fields and default values are zero/empty for all types. Optional fields added later are indistinguishable from zero — use <code>optional int32 value = 1;</code> (proto3 optional syntax) to explicitly represent "field was set to zero" vs "field was absent".',
      ],
    },
    {
      heading: 'Four RPC Call Types',
      points: [
        '<strong>Unary</strong>: one request → one response. Closest to a REST call. Use for simple queries, commands, and authentication. The client sends a message and awaits a single reply. This is the default — most RPCs are unary.',
        '<strong>Server streaming</strong>: one request → stream of responses. The client sends one message; the server pushes multiple replies until it closes the stream. Use for live price feeds, log streaming, progress reporting, and paginated large result sets.',
        '<strong>Client streaming</strong>: stream of requests → one response. The client sends a sequence of messages; the server processes them and replies once at the end. Use for batch uploads (file chunking, metric ingestion) where the server accumulates data before acting.',
        '<strong>Bidirectional streaming</strong>: both sides stream independently over the same HTTP/2 stream. Use for real-time bidirectional communication — chat, collaborative document editing, telemetry with acknowledgements. Either side can send at any time; both must close the stream to end the RPC.',
        'Streaming RPCs check <code>context.CancellationToken</code> in the loop — the token fires when the client cancels, disconnects, or the deadline expires. Always pass it to <code>WriteAsync(ct)</code> and <code>Task.Delay(ct)</code> to stop processing immediately rather than writing to a closed stream.',
        'For server streaming, use <code>await foreach (var item in stream.ResponseStream.ReadAllAsync(ct))</code> on the client for clean async enumeration. For bidirectional, manage read and write loops on separate tasks — one reading, one writing — and coordinate shutdown with a shared CancellationTokenSource.',
      ],
    },
    {
      heading: 'gRPC-Web for Browser Clients',
      points: [
        'Browsers cannot send gRPC directly: the Fetch API cannot access HTTP/2 trailers (where gRPC delivers its status code). <strong>gRPC-Web</strong> is a modified protocol that encodes the trailer inside the response body, making it compatible with browser HTTP stacks.',
        'Enable gRPC-Web on the ASP.NET Core server: install <code>Grpc.AspNetCore.Web</code>, call <code>app.UseGrpcWeb()</code> (before <code>app.MapGrpcService()</code>), and chain <code>.EnableGrpcWeb()</code> on each service. The server then handles both standard gRPC (HTTP/2) and gRPC-Web requests on the same port.',
        'For Blazor WASM clients: install <code>Grpc.Net.Client.Web</code> and create the channel with <code>GrpcWebHandler</code> as the HTTP handler. For Angular/React browser clients, use the <code>@grpc/grpc-js</code> + <code>grpc-web</code> npm packages with the generated TypeScript stubs.',
        'The <strong>Envoy proxy</strong> translates gRPC-Web at the network boundary — place it in front of your gRPC services and configure it to transcode the protocol. Your service code remains pure gRPC; Envoy handles the browser compatibility. Useful in a Kubernetes ingress setup.',
        'gRPC-Web does NOT support client streaming or bidirectional streaming — only unary and server streaming. For full streaming in the browser, fall back to WebSockets or SSE for those endpoints.',
        'CORS configuration for gRPC-Web: the <code>Content-Type: application/grpc-web</code> header must be allowed by your CORS policy. Add <code>WithExposedHeaders("grpc-status", "grpc-message")</code> to your CORS policy so the browser can read gRPC status information from the trailer-in-body.',
      ],
    },
    {
      heading: 'Interceptors, Auth, and Production Patterns',
      points: [
        'gRPC <strong>interceptors</strong> are middleware for RPC calls — implement <code>Interceptor</code> and override <code>UnaryServerHandler</code>, <code>ServerStreamingServerHandler</code>, etc. Register with <code>builder.Services.AddGrpc(o => o.Interceptors.Add&lt;LoggingInterceptor&gt;())</code>. Use for logging, tracing, exception translation, and auth.',
        'Authentication uses the standard ASP.NET Core pipeline. Apply <code>[Authorize]</code> to the service class or individual methods. JWT tokens arrive in the <code>Authorization</code> header — clients set them via <code>CallCredentials</code> or <code>CallOptions.Headers.Add("authorization", "Bearer " + token)</code>.',
        'Server-side error handling: throw <code>RpcException</code> with a <code>Status</code> containing a <code>StatusCode</code> (NOT HTTP status code) and a description. Clients receive typed exceptions. Use an interceptor to catch generic exceptions and translate them to <code>RpcException</code> so implementation details do not leak to callers.',
        'For client management, use <code>AddGrpcClient&lt;T&gt;()</code> with <code>IHttpClientFactory</code>. Chain <code>.AddStandardResilienceHandler()</code> for retry + circuit breaker. Configure <code>SocketsHttpHandler</code> with keep-alive pings to maintain long-lived HTTP/2 connections through load balancers and proxies.',
        'Testing gRPC services: in unit tests, pass a fake <code>ServerCallContext</code> (use <code>TestServerCallContext.Create()</code> from <code>Grpc.Core.Testing</code>) and call the service methods directly — no server needed. For integration tests, use <code>WebApplicationFactory</code> with a <code>GrpcChannel</code> pointed at the in-process server.',
        'Reflection service: add <code>builder.Services.AddGrpcReflection()</code> and <code>app.MapGrpcReflectionService()</code> in development. This allows <code>grpcurl</code> and Postman to discover and call your gRPC services without the <code>.proto</code> file — essential for ad-hoc testing and debugging.',
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
    {
      q: 'What does changing a Protobuf field number (e.g., from "= 1" to "= 2") cause?',
      options: [
        'Nothing — only the name is used on the wire',
        'A breaking change — the wire format changes and old clients/servers misread the field',
        'A build warning but no runtime impact',
        'The field becomes optional automatically',
      ],
      answer: 1,
      explanation: 'Protobuf field numbers ARE the wire identity — not the name. Changing a field number means old messages that sent field 1 are now read as a different field (or ignored) by services expecting field 2. Field names can be renamed freely; field numbers cannot. Reserved removes a number from future use.',
    },
    {
      q: 'Which gRPC streaming type does NOT work with gRPC-Web in browsers?',
      options: [
        'Unary',
        'Server streaming',
        'Client streaming and bidirectional streaming',
        'All streaming types work with gRPC-Web',
      ],
      answer: 2,
      explanation: 'gRPC-Web supports only unary and server streaming. Client streaming and bidirectional streaming require HTTP/2 flow control that gRPC-Web cannot support over a browser HTTP connection. Use WebSockets or SSE for these patterns in browser clients.',
    },
    {
      q: 'What is the purpose of a gRPC interceptor?',
      options: [
        'To translate Protobuf messages to JSON',
        'Middleware for RPC calls — adds cross-cutting concerns like logging, auth, and exception handling',
        'To validate .proto schema at startup',
        'To compress the gRPC response stream',
      ],
      answer: 1,
      explanation: 'gRPC interceptors are analogous to ASP.NET Core middleware but specifically for RPC calls. They wrap each call type (unary, streaming) and can inspect or modify requests and responses, catch exceptions, add metrics, enforce auth, and translate errors before they reach the caller.',
    },
    {
      q: 'How do you enable grpcurl/Postman discovery of your gRPC service without sharing the .proto file?',
      options: [
        'Enable Swagger for gRPC via AddSwaggerGen()',
        'Add MapGrpcService() without a type argument',
        'Register AddGrpcReflection() and MapGrpcReflectionService()',
        'gRPC services cannot be discovered dynamically',
      ],
      answer: 2,
      explanation: 'The gRPC server reflection protocol (AddGrpcReflection + MapGrpcReflectionService) exposes service descriptors at runtime. Tools like grpcurl, Postman, and BloomRPC query the reflection endpoint to get service and method definitions without needing the .proto file. Enable only in development to avoid exposing contracts in production.',
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
    {
      q: 'How do I test a gRPC service in a unit test without spinning up a server?',
      a: 'Call the service implementation methods directly, passing a <code>TestServerCallContext</code> from the <code>Grpc.Core.Testing</code> NuGet package: <code>var ctx = TestServerCallContext.Create(...);</code>. For server streaming tests, implement a fake <code>IServerStreamWriter&lt;T&gt;</code> that collects written items into a list. This tests business logic without HTTP infrastructure.',
    },
    {
      q: 'What are gRPC status codes and how do they differ from HTTP status codes?',
      a: 'gRPC has its own status code set (defined in <code>Grpc.Core.StatusCode</code>): <code>OK</code>, <code>NotFound</code>, <code>InvalidArgument</code>, <code>PermissionDenied</code>, <code>Unavailable</code>, etc. They are semantically similar to HTTP status codes but delivered via HTTP/2 trailers (or gRPC-Web body), not the HTTP status line. Throw <code>RpcException(new Status(StatusCode.NotFound, "Product not found"))</code> to return an error — the gRPC runtime maps it to the trailer and the client receives a typed exception.',
    },
    {
      q: 'How does gRPC handle versioning when the .proto contract needs to change?',
      a: 'Proto3 backwards compatibility rules: (1) Add new fields with new field numbers — old clients ignore them, new clients see them. (2) Remove fields by marking them <code>reserved</code> — prevents field number reuse. (3) For breaking changes (field type change, method signature change), create a new service version: <code>package myapp.v2;</code> and run both versions simultaneously during migration. Never change field numbers or types on a live service.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Reusing or changing Protobuf field numbers',
      wrong: `// Version 1
message ProductReply {
  int32 id   = 1;
  string name = 2;
}

// "Updated" version — reused field 2 with different type!
message ProductReply {
  int32 id    = 1;
  double price = 2;  // Old clients send string for field 2, new server reads it as double → corrupt data
}`,
      right: `// Correct: retire old field with reserved, add new field with new number
message ProductReply {
  int32  id    = 1;
  reserved 2;         // "name" was here — never reuse this number
  reserved "name";    // prevent reuse of the field name too
  double price = 3;   // new field gets a new number
}`,
      explanation: 'Protobuf field numbers are the wire identity. Reusing a number with a different type causes silent data corruption — old clients send bytes for one type that the new service reads as another. Always retire field numbers with "reserved" and assign new numbers to new fields.',
    },
    {
      title: 'Not checking CancellationToken in streaming RPCs',
      wrong: `public override async Task StreamPrices(
    Empty request, IServerStreamWriter<PriceReply> stream, ServerCallContext ctx)
{
    while (true)  // No cancellation check — runs forever even after client disconnects!
    {
        await stream.WriteAsync(GetLatestPrice());
        await Task.Delay(1000);  // No ct — ignores client disconnect
    }
}`,
      right: `public override async Task StreamPrices(
    Empty request, IServerStreamWriter<PriceReply> stream, ServerCallContext ctx)
{
    while (!ctx.CancellationToken.IsCancellationRequested)
    {
        await stream.WriteAsync(GetLatestPrice(), ctx.CancellationToken);
        await Task.Delay(1000, ctx.CancellationToken);
    }
}`,
      explanation: 'When a streaming client disconnects or a deadline expires, ServerCallContext.CancellationToken is cancelled. Without checking it, the server continues writing to a closed stream, wasting CPU and resources. Always pass ct to WriteAsync() and Task.Delay() — they throw OperationCanceledException cleanly on cancellation.',
    },
    {
      title: 'Not using gRPC server reflection in development',
      wrong: `// No reflection registered — testing requires sharing the .proto file
builder.Services.AddGrpc();
app.MapGrpcService<ProductsService>();
// Testing with grpcurl fails: "Failed to dial target host"`,
      right: `builder.Services.AddGrpc();
if (app.Environment.IsDevelopment())
{
    builder.Services.AddGrpcReflection();
}
app.MapGrpcService<ProductsService>();
if (app.Environment.IsDevelopment())
{
    app.MapGrpcReflectionService();
}
// Now: grpcurl -plaintext localhost:5001 list`,
      explanation: 'Without reflection, tools like grpcurl, Postman, and BloomRPC cannot discover your service methods. Reflection exposes the service schema dynamically. Restrict to development only — exposing reflection in production leaks your API surface to any caller.',
    },
    {
      title: 'Throwing generic exceptions instead of RpcException',
      wrong: `public override Task<ProductReply> GetProduct(
    ProductRequest request, ServerCallContext ctx)
{
    var product = _repo.Find(request.Id);
    if (product is null)
        throw new NotFoundException("Product not found");  // Maps to Internal (500) on the client!
    return Task.FromResult(MapToReply(product));
}`,
      right: `public override Task<ProductReply> GetProduct(
    ProductRequest request, ServerCallContext ctx)
{
    var product = _repo.Find(request.Id);
    if (product is null)
        throw new RpcException(new Status(StatusCode.NotFound,
            \`Product \${request.Id} not found\`));
    return Task.FromResult(MapToReply(product));
}`,
      explanation: 'Non-RpcException exceptions are caught by the gRPC runtime and translated to StatusCode.Internal with a generic message — the caller gets no useful error information. Use RpcException with the appropriate StatusCode (NotFound, InvalidArgument, PermissionDenied, etc.) so clients can handle errors meaningfully. Use an interceptor to catch domain exceptions and translate them.',
    },
    {
      title: 'Forgetting UseGrpcWeb() middleware order',
      wrong: `app.MapGrpcService<GreeterService>().EnableGrpcWeb();
app.UseGrpcWeb();  // Too late — MapGrpcService was already called!`,
      right: `app.UseRouting();
app.UseGrpcWeb(new GrpcWebOptions { DefaultEnabled = true });  // Before MapGrpcService
app.MapGrpcService<GreeterService>();  // gRPC-Web is active for this service`,
      explanation: 'UseGrpcWeb() must be called BEFORE MapGrpcService(). Middleware order is sequential in ASP.NET Core — the middleware registered first processes requests first. Placing UseGrpcWeb() after endpoint mapping means the middleware never runs for gRPC requests.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'gRPC is an HTTP/2 + Protobuf RPC framework with four call types (unary, server streaming, client streaming, bidirectional); the .proto file generates typed server and client code; use gRPC-Web for browser clients.',
    mustKnow: [
      'gRPC uses HTTP/2 (multiplexed) + Protobuf (binary) — faster and smaller than REST/JSON for internal calls',
      'Four call types: unary, server streaming, client streaming, bidirectional streaming',
      'Field numbers — NOT names — are the Protobuf wire identity; never reuse them',
      'Browsers need gRPC-Web; client streaming and bidirectional streaming are not supported in browsers via gRPC-Web',
      'Always check <code>context.CancellationToken</code> in streaming loops; pass it to <code>WriteAsync()</code>',
      'Throw <code>RpcException</code> with <code>StatusCode</code> for typed errors — generic exceptions map to <code>Internal</code>',
      'Use <code>AddGrpcReflection()</code> in development for grpcurl/Postman discovery',
    ],
    interviewFocus: [
      'When would you choose gRPC over REST and what are the trade-offs?',
      'How does Protobuf backwards compatibility work — what breaks and what is safe?',
      'Four streaming call types and when to use each',
      'Why browsers cannot call gRPC directly and how gRPC-Web solves it',
    ],
  };
}
