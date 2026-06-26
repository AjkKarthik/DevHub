import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';
import { BeforeAfterComponent, BeforeAfterExample } from '../../../shared/before-after/before-after';

@Component({
  selector: 'app-csharp-native-aot',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, PrerequisitesComponent, BeforeAfterComponent,
  ],
  templateUrl: './native-aot.html',
  styleUrl: './native-aot.scss',
})
export class CsharpNativeAot {

  prerequisites: Prerequisite[] = [
    { label: 'System.Text.Json Advanced', route: '/csharp/json-advanced' },
    { label: 'Reflection',               route: '/csharp/reflection' },
  ];

  quickRef: QuickRefItem[] = [
    { name: '<PublishAot>true</PublishAot>',          type: 'keyword',  desc: 'Enables Native AOT compilation in the .csproj; produces a self-contained native binary', since: '.NET 7' },
    { name: 'PublishSingleFile',                      type: 'keyword',  desc: 'Bundles the runtime + app into one file (JIT); different from AOT — does NOT improve startup time', since: '.NET 6' },
    { name: '[RequiresUnreferencedCode]',              type: 'accessor', desc: 'Marks a method as using reflection — trimmer warning; helps identify trim-incompatible code', since: '.NET 5' },
    { name: '[DynamicallyAccessedMembers]',           type: 'accessor', desc: 'Annotates which members will be accessed via reflection — tells trimmer what to keep', since: '.NET 5' },
    { name: '[LibraryImport]',                        type: 'accessor', desc: 'AOT-safe P/Invoke — source-generated marshalling; replaces [DllImport] for AOT scenarios', since: '.NET 7' },
    { name: 'JsonSerializerContext',                  type: 'class',    desc: 'Source-generated JSON serialization context — AOT-safe replacement for reflection-based STJ', since: '.NET 6' },
    { name: 'IlcInstructionSet',                      type: 'keyword',  desc: 'Target CPU instruction set for AOT (e.g., native, avx2) — set in .csproj for optimal codegen', since: '.NET 7' },
    { name: 'rd.xml / TrimmerRootDescriptor',         type: 'keyword',  desc: 'XML descriptor to keep specific types/members from being trimmed', since: '.NET 5' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Native AOT and why it matters',
      points: [
        'Normally, .NET compiles C# to IL (intermediate language) which the JIT (Just-In-Time) compiler translates to native code at runtime. Native AOT (Ahead-Of-Time) skips the JIT entirely — it compiles directly to a self-contained native binary at publish time. No .NET runtime is required on the target machine.',
        'The benefits are dramatic for certain workloads: startup time measured in milliseconds instead of seconds, ~10× smaller memory footprint, significantly smaller deployment size (no runtime to ship), and no JIT warmup latency. A "Hello World" Native AOT binary starts in ~2ms vs ~60ms for a JIT app.',
        'Ideal targets: CLI tools that must start instantly, AWS Lambda / Azure Functions where cold-start billing matters, containerised microservices (smaller images, faster scale-up), and embedded/IoT applications where the runtime overhead is prohibitive.',
        'Native AOT was production-ready in .NET 8 for console apps and ASP.NET Core minimal APIs. Full ASP.NET Core (controllers, Razor, EF Core) does not support Native AOT as of .NET 8 — these rely heavily on runtime reflection that the trimmer cannot analyse statically.',
      ],
    },
    {
      heading: 'IL Trimming — the foundation of AOT',
      points: [
        'Before AOT compilation, the trimmer performs whole-program analysis — starting from entry points, it follows all reachable code paths and removes everything unreachable. The result is a minimal IL tree that the AOT compiler then compiles to native code.',
        'Reflection is the trimmer\'s nemesis. When code does <code>Type.GetType("MyClass")</code> or <code>Assembly.GetTypes()</code>, the trimmer cannot statically determine which types are needed — so by default it has to keep everything, negating trimming benefits, or it trims aggressively and breaks runtime reflection calls.',
        'The solution is annotation: <code>[RequiresUnreferencedCode]</code> marks methods that use reflection (warns callers), <code>[DynamicallyAccessedMembers]</code> tells the trimmer exactly which members of a type will be accessed via reflection (so it keeps only those).',
        'ASP.NET Core minimal APIs are trimmer-friendly because they use source generators (e.g., for request binding and response serialisation) to generate static code at compile time, replacing the runtime reflection those operations normally use.',
      ],
    },
    {
      heading: 'Source generators as the AOT enabler',
      points: [
        'The pattern across the .NET ecosystem is consistent: any feature that previously used runtime reflection gets a source-generated equivalent that is AOT-safe. JSON: <code>JsonSerializerContext</code>. Logging: <code>[LoggerMessage]</code>. P/Invoke: <code>[LibraryImport]</code>. Request mapping: minimal API source generators.',
        'Source generators run at compile time as part of the Roslyn compilation pipeline. They analyse your code, discover types/methods/attributes, and emit additional C# source files. The generated code contains the same logic that used to be performed at runtime via reflection, but is now baked into your binary.',
        'When migrating an existing app to Native AOT, the most common source of trimmer warnings is NuGet packages that have not yet been annotated or updated for trimming. Check <code>IsAotCompatible=true</code> metadata on packages in NuGet.org before adding them.',
        '<code>[RequiresUnreferencedCode]</code> warnings during build are actionable: each one identifies a call site where you need to either replace the reflection call with a source-generated equivalent, annotate with <code>[DynamicallyAccessedMembers]</code>, or exclude that code path from the AOT build.',
      ],
    },
    {
      heading: 'P/Invoke — [LibraryImport] vs [DllImport]',
      points: [
        '<code>[DllImport]</code> uses runtime reflection to generate the interop marshalling code. The marshalling logic is built at JIT time using IL generation — not compatible with AOT. For Native AOT, use <code>[LibraryImport]</code> which triggers a source generator to emit the marshalling code at compile time.',
        '<code>[LibraryImport]</code> supports the same signatures as <code>[DllImport]</code> for primitive types. For complex types, you may need to add <code>MarshalAs</code> attributes or write a custom <code>IMarshaller</code>. String marshalling uses <code>StringMarshalling.Utf8</code> or <code>StringMarshalling.Utf16</code> instead of the CharSet property.',
        'SafeHandle is fully AOT-compatible and is the recommended way to manage native handle lifetimes — it ensures handles are released even when exceptions occur or finalisation order is non-deterministic.',
        'For Windows-specific APIs, the Windows Community Toolkit or CsWin32 source generator auto-generates AOT-safe P/Invoke signatures for Win32 APIs — you annotate desired APIs in a NativeMethods.txt file and the generator emits the correct [LibraryImport] calls.',
      ],
    },
    {
      heading: 'Native AOT limitations and tradeoffs',
      points: [
        '<code>Assembly.Load()</code>, <code>Type.GetType()</code>, <code>Activator.CreateInstance()</code>, and <code>Emit</code> (IL generation) are not supported in AOT — they require runtime knowledge of types that do not exist after trimming. Code that uses these patterns must be replaced or have trim-safe alternatives.',
        'Third-party ORMs and serialisers that rely on runtime reflection (EF Core with navigation property proxies, Newtonsoft.Json, AutoMapper with convention-based mapping) do not work out of the box. Each has an AOT migration path — EF Core 8 added partial AOT support, STJ has <code>JsonSerializerContext</code>, AutoMapper added a source generator.',
        'Longer build times: Native AOT compilation is significantly slower than JIT builds (minutes vs seconds for large projects). Keep AOT publishing as a CI step rather than a local dev flow. The <code>dotnet run</code> workflow continues to use JIT; only <code>dotnet publish</code> triggers AOT.',
        'Cross-compilation is limited: publishing a Linux/ARM64 Native AOT binary from a Windows/x64 machine requires a cross-compilation toolchain or a CI matrix. The easiest approach is to publish on the target platform or use Docker multi-stage builds.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Enable & publish Native AOT',
      language: 'csharp',
      code: `<!-- MyApp.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>

    <!-- Enable Native AOT -->
    <PublishAot>true</PublishAot>

    <!-- Optional: target CPU features for better codegen -->
    <IlcInstructionSet>native</IlcInstructionSet>

    <!-- Trim warnings as errors — catch issues at build time -->
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <WarningsAsErrors>IL2026;IL2067;IL2072</WarningsAsErrors>
  </PropertyGroup>
</Project>

// Publish command:
// dotnet publish -c Release -r linux-x64 -o ./publish

// Result in ./publish/
//   MyApp          ← single native binary, no .NET runtime needed
//   MyApp.dbg      ← debug symbols (strip in production)

// Startup comparison (Hello World):
//   JIT:        ~60ms   first launch
//   Native AOT: ~2ms    every launch (no JIT warmup)

// Binary size comparison (minimal web API):
//   Self-contained JIT:  ~85 MB
//   Native AOT:          ~12 MB`,
    },
    {
      label: 'ASP.NET Core minimal API + AOT',
      language: 'csharp',
      code: `// Program.cs — ASP.NET Core minimal API, AOT-compatible
using System.Text.Json.Serialization;

var builder = WebApplication.CreateSlimBuilder(args);  // SlimBuilder = AOT-optimised

// Configure JSON with source generation context (NOT reflection-based)
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.TypeInfoResolverChain.Add(AppJsonContext.Default));

var app = builder.Build();

// Minimal API routes — AOT-safe; no controller reflection
app.MapGet("/products",     () => Results.Ok(ProductStore.All));
app.MapGet("/products/{id}", (int id) =>
{
    var product = ProductStore.All.FirstOrDefault(p => p.Id == id);
    return product is null ? Results.NotFound() : Results.Ok(product);
});
app.MapPost("/products", (Product product) =>
{
    ProductStore.All.Add(product);
    return Results.Created(\$"/products/{product.Id}", product);
});

app.Run();

// Models
public record Product(int Id, string Name, decimal Price, bool InStock);

public static class ProductStore
{
    public static List<Product> All { get; } =
    [
        new(1, "Widget",  9.99m,  true),
        new(2, "Gadget", 24.99m, false),
    ];
}

// AOT-safe JSON context — REQUIRED for source generation
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
[JsonSerializable(typeof(Product))]
[JsonSerializable(typeof(List<Product>))]
[JsonSerializable(typeof(IEnumerable<Product>))]
internal partial class AppJsonContext : JsonSerializerContext { }`,
    },
    {
      label: 'Trim-safe patterns',
      language: 'csharp',
      code: `using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

// PATTERN 1: Annotate reflection usage so trimmer knows what to keep
public static class ServiceFactory
{
    // Tell trimmer: this method accesses the public constructor of T
    [RequiresDynamicCode("Uses Activator.CreateInstance")]
    [RequiresUnreferencedCode("T must be preserved for reflection")]
    public static T Create<[DynamicallyAccessedMembers(
        DynamicallyAccessedMemberTypes.PublicConstructors)] T>()
        where T : class
        => Activator.CreateInstance<T>();
}

// PATTERN 2: Replace reflection with source generation (preferred)
// INSTEAD of: var service = Activator.CreateInstance(serviceType);
// USE: registered factory in DI with explicit registration:
builder.Services.AddSingleton<IMyService, MyServiceImpl>();

// PATTERN 3: AOT-safe logging with [LoggerMessage] source generator
public static partial class Log
{
    [LoggerMessage(Level = LogLevel.Information,
                   Message = "Processing order {OrderId} for customer {CustomerId}")]
    public static partial void ProcessingOrder(
        ILogger logger, string orderId, string customerId);

    [LoggerMessage(Level = LogLevel.Error,
                   Message = "Order {OrderId} failed: {Error}")]
    public static partial void OrderFailed(
        ILogger logger, string orderId, string error);
}

// Usage — zero reflection, AOT-safe
Log.ProcessingOrder(logger, "ORD-001", "CUST-42");

// PATTERN 4: AOT-safe serialization check
// This warns at build time that the type needs to be in a JsonSerializerContext:
// var json = JsonSerializer.Serialize(myObject);  // IL2026 warning

// This is AOT-safe:
var json = JsonSerializer.Serialize(myObject, AppJsonContext.Default.MyType);`,
    },
    {
      label: '[LibraryImport] for AOT P/Invoke',
      language: 'csharp',
      code: `using System.Runtime.InteropServices;

// OLD: [DllImport] — uses runtime IL generation, NOT AOT compatible
[DllImport("libz", EntryPoint = "compress")]
private static extern int Compress_Old(
    byte[] dest, ref ulong destLen,
    byte[] source, ulong sourceLen);

// NEW: [LibraryImport] — source-generated marshalling, AOT-safe
[LibraryImport("libz", EntryPoint = "compress")]
private static partial int Compress(
    byte[] dest, ref ulong destLen,
    byte[] source, ulong sourceLen);

// String interop — explicit marshalling strategy required in LibraryImport
[LibraryImport("libc",
    EntryPoint = "puts",
    StringMarshalling = StringMarshalling.Utf8)]
private static partial int Puts(string s);

// Boolean interop — explicit MarshalAs for non-default booleans
[LibraryImport("native_lib")]
[return: MarshalAs(UnmanagedType.I4)]
private static partial int GetStatus(
    [MarshalAs(UnmanagedType.Bool)] bool flag);

// Usage
Puts("Hello from native libc!");

ulong destLen = 1024;
byte[] compressed = new byte[1024];
byte[] data = System.Text.Encoding.UTF8.GetBytes("Hello, World! Hello, World!");
int result  = Compress(compressed, ref destLen, data, (ulong)data.Length);
Console.WriteLine(\$"Compressed {data.Length} → {destLen} bytes, result: {result}");`,
    },
    {
      label: 'rd.xml — preserve types from trimming',
      language: 'csharp',
      code: `<!-- rd.xml — Runtime Directives (Trimmer Root Descriptor) -->
<!-- Place in project root and reference in .csproj: -->
<!-- <TrimmerRootDescriptor Include="rd.xml" /> -->

<!--
<linker>
  <assembly fullname="MyApp">
    <!-- Keep entire type including all members -->
    <type fullname="MyApp.Models.DynamicModel" preserve="all" />

    <!-- Keep specific members only -->
    <type fullname="MyApp.Services.PluginLoader">
      <method name="LoadPlugin" />
      <property name="IsEnabled" />
    </type>
  </assembly>

  <!-- Keep entire assembly (for problematic NuGet packages) -->
  <assembly fullname="SomeReflectionHeavyLib" preserve="all" />
</linker>
-->

// Alternative: use attributes in code (preferred over rd.xml)
using System.Diagnostics.CodeAnalysis;

// Keep all public members of this type visible to reflection
[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.All)]
public class PluginBase
{
    public virtual string Name => "Base";
    public virtual void Execute() { }
}

// Tell the trimmer: CreatePlugin uses reflection on T's public constructors
public static T CreatePlugin<
    [DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicConstructors)] T>()
    where T : PluginBase, new()
    => new T();`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'JSON serialization: reflection vs source generation (AOT)',
      before: `// Reflection-based — NOT AOT compatible (IL2026 trimmer warning)
var options = new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
};
string json = JsonSerializer.Serialize(product, options);
Product? result = JsonSerializer.Deserialize<Product>(json, options);`,
      after: `// Source generation — AOT-safe, 3-5x faster, zero runtime reflection
[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
[JsonSerializable(typeof(Product))]
[JsonSerializable(typeof(List<Product>))]
internal partial class AppJsonContext : JsonSerializerContext { }

// Usage — context provides compile-time type info
string json    = JsonSerializer.Serialize(product, AppJsonContext.Default.Product);
Product result = JsonSerializer.Deserialize(json,  AppJsonContext.Default.Product)!;`,
      note: 'With PublishAot=true, any call to JsonSerializer.Serialize<T>() without a JsonTypeInfo will produce an IL2026 trimmer warning and may fail at runtime.',
      language: 'csharp',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using Assembly.GetTypes() or Type.GetType() in AOT',
      wrong: `// This works with JIT but fails silently or throws in Native AOT
// — the types are trimmed away since they're only reached via reflection
var handlerTypes = Assembly.GetExecutingAssembly()
    .GetTypes()
    .Where(t => t.IsAssignableTo(typeof(IHandler)))
    .ToList();

foreach (var type in handlerTypes)
{
    var handler = Activator.CreateInstance(type) as IHandler;
    handler?.Handle();
}`,
      right: `// Explicit registration — trimmer can statically see all types
var handlers = new List<IHandler>
{
    new EmailHandler(),
    new SmsHandler(),
    new PushHandler(),
};

foreach (var handler in handlers)
    handler.Handle();

// Or use DI with explicit registrations:
services.AddScoped<IHandler, EmailHandler>();
services.AddScoped<IHandler, SmsHandler>();`,
      explanation: 'Assembly.GetTypes() relies on reflection metadata that the trimmer removes in AOT builds. All types not reachable through static code paths are eliminated. Replace convention-based discovery with explicit registration or source-generated alternatives.',
    },
    {
      title: 'Using [DllImport] instead of [LibraryImport] in AOT',
      wrong: `// [DllImport] generates marshalling code at runtime via IL Emit
// This is NOT supported in Native AOT
[DllImport("kernel32.dll", SetLastError = true)]
private static extern bool CreateDirectory(
    string lpPathName,
    IntPtr lpSecurityAttributes);`,
      right: `// [LibraryImport] generates marshalling code at compile time via source generator
// Requires: partial method + appropriate StringMarshalling
[LibraryImport("kernel32.dll",
    EntryPoint = "CreateDirectoryW",
    SetLastError = true,
    StringMarshalling = StringMarshalling.Utf16)]
[return: MarshalAs(UnmanagedType.Bool)]
private static partial bool CreateDirectory(
    string lpPathName,
    nint lpSecurityAttributes);`,
      explanation: '[DllImport] uses runtime IL generation for marshalling — a feature that requires JIT and is not available in Native AOT. [LibraryImport] triggers a Roslyn source generator to emit the marshalling code at compile time, making it fully AOT-compatible.',
    },
    {
      title: 'Confusing PublishSingleFile with Native AOT',
      wrong: `<!-- This is NOT Native AOT — it still uses the JIT runtime -->
<!-- Startup time and memory usage are the same as normal .NET -->
<PublishSingleFile>true</PublishSingleFile>
<SelfContained>true</SelfContained>
<!-- Just bundles everything into one .exe — does not compile to native code -->`,
      right: `<!-- This IS Native AOT — compiles to native machine code, no runtime needed -->
<PublishAot>true</PublishAot>
<!-- Results in: true native binary, ~2ms startup, ~10x less memory, smaller size -->
<!-- Limitations: no runtime reflection, longer build time, AOT-compatible deps only -->`,
      explanation: 'PublishSingleFile simply bundles the .NET runtime, app assemblies, and dependencies into a single executable. It still uses the JIT compiler and has the same startup characteristics. PublishAot actually compiles IL to native machine code — completely different technology with different tradeoffs.',
    },
    {
      title: 'Ignoring trimmer warnings during development',
      wrong: `// Suppressing all trim warnings without understanding them
// hides real problems that will manifest as runtime exceptions in AOT
#pragma warning disable IL2026, IL2067, IL2072
var obj = Activator.CreateInstance(someType);  // WILL FAIL in AOT
#pragma warning restore IL2026, IL2067, IL2072`,
      right: `// Address each warning — either annotate or replace with trim-safe code
// Set TreatWarningsAsErrors to force resolution during development:

// In .csproj:
// <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
// <WarningsAsErrors>IL2026;IL2067;IL2072</WarningsAsErrors>

// Then fix each: replace reflection with source gen, explicit registration, or DynamicallyAccessedMembers`,
      explanation: 'Trimmer warnings are not style warnings — each one identifies a code path that will either break at runtime in AOT or silently do nothing because the reflected type was trimmed. Treat them as errors during development so every one is addressed before publishing.',
    },
  ];

  challenge: Challenge = {
    title: 'AOT-safe minimal API',
    language: 'csharp',
    description: `Set up an AOT-compatible ASP.NET Core minimal API:
1. Create a .csproj with PublishAot=true and net9.0 target
2. Use WebApplication.CreateSlimBuilder (AOT-optimised builder)
3. Define a TodoItem record with Id, Title, IsComplete
4. Create a JsonSerializerContext for TodoItem and List<TodoItem>
5. Wire up CRUD endpoints: GET /todos, GET /todos/{id}, POST /todos, PUT /todos/{id}/complete
6. Register the JSON context with ConfigureHttpJsonOptions
7. Add a [LoggerMessage] source-generated log for "Todo {Id} completed"`,
    hints: [
      'WebApplication.CreateSlimBuilder reduces startup overhead vs CreateBuilder',
      '[JsonSerializable(typeof(TodoItem))] on the partial JsonSerializerContext class',
      'options.SerializerOptions.TypeInfoResolverChain.Add(MyContext.Default)',
      '[LoggerMessage(Level = LogLevel.Information, Message = "...")] on a static partial method',
      'Results.Ok(), Results.NotFound(), Results.Created() — all AOT-safe in minimal APIs',
    ],
    starterCode: `// MyApp.csproj:
// <PublishAot>true</PublishAot>
// <TargetFramework>net9.0</TargetFramework>

using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

// TODO: define TodoItem record
// TODO: define AppJsonContext : JsonSerializerContext
// TODO: define static Log class with [LoggerMessage]

var builder = WebApplication.CreateSlimBuilder(args);

// TODO: register JSON context with ConfigureHttpJsonOptions

var app = builder.Build();

// TODO: Map CRUD endpoints for TodoItem

app.Run();`,
    solution: `using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

public record TodoItem(int Id, string Title, bool IsComplete = false);

[JsonSourceGenerationOptions(PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase)]
[JsonSerializable(typeof(TodoItem))]
[JsonSerializable(typeof(List<TodoItem>))]
internal partial class AppJsonContext : JsonSerializerContext { }

public static partial class Log
{
    [LoggerMessage(Level = LogLevel.Information, Message = "Todo {TodoId} marked complete")]
    public static partial void TodoCompleted(ILogger logger, int todoId);
}

var builder = WebApplication.CreateSlimBuilder(args);
builder.Services.ConfigureHttpJsonOptions(opt =>
    opt.SerializerOptions.TypeInfoResolverChain.Add(AppJsonContext.Default));

var app = builder.Build();
var logger = app.Logger;

var todos = new List<TodoItem>
{
    new(1, "Learn Native AOT"),
    new(2, "Build AOT-safe API"),
};
int nextId = 3;

app.MapGet("/todos", () => Results.Ok(todos));

app.MapGet("/todos/{id:int}", (int id) =>
{
    var todo = todos.FirstOrDefault(t => t.Id == id);
    return todo is null ? Results.NotFound() : Results.Ok(todo);
});

app.MapPost("/todos", (TodoItem item) =>
{
    var created = item with { Id = nextId++ };
    todos.Add(created);
    return Results.Created(\$"/todos/{created.Id}", created);
});

app.MapPut("/todos/{id:int}/complete", (int id) =>
{
    var idx = todos.FindIndex(t => t.Id == id);
    if (idx < 0) return Results.NotFound();
    todos[idx] = todos[idx] with { IsComplete = true };
    Log.TodoCompleted(logger, id);
    return Results.Ok(todos[idx]);
});

app.Run();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between PublishSingleFile and PublishAot?',
      options: [
        'PublishSingleFile is faster to compile; PublishAot produces a larger binary',
        'PublishSingleFile bundles files into one archive but still uses JIT; PublishAot compiles to native machine code with no runtime needed',
        'PublishAot is only for Linux; PublishSingleFile works cross-platform',
        'They are equivalent — PublishAot is just a newer name for PublishSingleFile',
      ],
      answer: 1,
      explanation: 'PublishSingleFile simply packages the .NET runtime + app into one ZIP-like file — the app still uses JIT and has identical startup/memory characteristics. PublishAot actually compiles your C# to native machine code at publish time. No .NET runtime is shipped or needed; startup is 10–30× faster.',
    },
    {
      q: 'Why does Assembly.GetTypes() fail or behave unexpectedly in Native AOT?',
      options: [
        'The Assembly class is not available in .NET 8+',
        'Types not reachable via static code paths are removed by the trimmer — GetTypes() returns only surviving types, which may be incomplete',
        'GetTypes() requires administrator privileges in AOT mode',
        'AOT does not support generic types, which GetTypes() depends on',
      ],
      answer: 1,
      explanation: 'The trimmer removes all types and members not reachable through static analysis. Assembly.GetTypes() depends on reflection metadata that may have been trimmed. In AOT, the call may return only the types that survived trimming (an incomplete set), or the metadata table itself may be absent — causing runtime failures or silent empty results.',
    },
    {
      q: 'Which attribute makes a method\'s reflection usage visible to the trimmer so it can keep the right types?',
      options: [
        '[Preserve]',
        '[DynamicallyAccessedMembers] — tells the trimmer which member kinds will be accessed via reflection on a given type parameter',
        '[KeepForReflection]',
        '[ReflectionSafe]',
      ],
      answer: 1,
      explanation: '[DynamicallyAccessedMembers(DynamicallyAccessedMemberTypes.PublicConstructors)] on a type parameter tells the trimmer "whatever T is at the call site, keep its public constructors." This allows the trimmer to statically resolve which members to preserve without removing needed reflection metadata.',
    },
    {
      q: 'Why should you use [LibraryImport] instead of [DllImport] in Native AOT?',
      options: [
        '[LibraryImport] is more secure because it validates pointer types',
        '[DllImport] uses runtime IL generation for marshalling — not supported in AOT; [LibraryImport] generates marshalling code at compile time via a source generator',
        '[LibraryImport] automatically handles Unicode vs ANSI string conversion',
        '[DllImport] only works on Windows; [LibraryImport] is cross-platform',
      ],
      answer: 1,
      explanation: '[DllImport] generates marshalling code at JIT time using IL Emit — a feature that requires the JIT compiler, which is absent in Native AOT. [LibraryImport] triggers a Roslyn source generator that emits the marshalling C# code at compile time. The result is included in the native binary without any runtime code generation.',
    },
    {
      q: 'What is the recommended JSON serialization approach for a Native AOT ASP.NET Core app?',
      options: [
        'Use Newtonsoft.Json — it has built-in AOT support',
        'Use JsonSerializer with a shared JsonSerializerOptions instance — reusing options makes it AOT-compatible',
        'Define a partial class inheriting JsonSerializerContext with [JsonSerializable] for each type — source generation, no runtime reflection',
        'Use XmlSerializer as a fallback — it is natively AOT-compatible',
      ],
      answer: 2,
      explanation: 'A JsonSerializerContext (partial class with [JsonSerializable] attributes) triggers the STJ source generator to emit TypeInfo<T> for each annotated type at compile time. This replaces runtime reflection entirely. Pass the context to ConfigureHttpJsonOptions so ASP.NET Core uses it for all request/response serialisation.',
    },
    {
      q: 'What is the difference between PublishReadyToRun and PublishAot?',
      options: [
        'They are identical — ReadyToRun is the old name for AOT',
        'ReadyToRun pre-JITs assemblies into R2R images but still ships the JIT for fallback; AOT compiles everything to native code and ships no JIT at all',
        'ReadyToRun is for Linux; AOT is for Windows and macOS',
        'ReadyToRun reduces binary size; AOT reduces startup time only',
      ],
      answer: 1,
      explanation: 'ReadyToRun (R2R) produces MSIL assemblies with pre-compiled native code embedded. At startup, the pre-compiled paths run without JIT; uncompiled paths still JIT. The .NET runtime is still required. Native AOT goes further: all code is compiled to machine code at publish; no JIT, no runtime required. AOT startup is 10–30× faster than JIT and 2–3× faster than R2R.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use EF Core with Native AOT?',
      a: 'EF Core 8 added partial support — specifically for compiled models and pre-compiled queries. You can use EF Core in an AOT app if you generate a compiled model (dotnet ef dbcontext optimize) and use DbSet<T> with pre-compiled queries. Dynamic LINQ, lazy loading proxies, and scaffolding are not AOT-compatible. Full AOT support is a multi-release goal for EF Core; check the current release notes for the exact feature set.',
    },
    {
      q: 'How do I test my app for AOT compatibility before publishing?',
      a: 'Add <PublishAot>true</PublishAot> to your project and run dotnet publish -c Release. Fix all IL2026/IL2067 trimmer warnings — set TreatWarningsAsErrors to catch them at build time. You can also use <IsAotCompatible>true</IsAotCompatible> to run trimmer analysis without actually doing the native compilation — useful in CI to check compatibility without the long AOT build time.',
    },
    {
      q: 'Does Native AOT work with dependency injection and the generic host?',
      a: 'Yes — Microsoft.Extensions.DependencyInjection and the generic host are AOT-compatible. Use explicit service registration (not assembly-scanning with AddFromAssembly), and configure JSON options with a JsonSerializerContext. Third-party DI containers may not be AOT-compatible — check each container\'s documentation.',
    },
    {
      q: 'What are the cold-start improvements in AWS Lambda and Azure Functions?',
      a: 'AWS Lambda with Native AOT has cold-start times of 10–50ms vs 500ms–2s for a JIT .NET Lambda. Azure Functions Isolated worker with Native AOT similarly reduces cold starts from seconds to tens of milliseconds. Both platforms officially support .NET Native AOT as of .NET 8. The improvement is most impactful for sporadic/bursty workloads where cold starts happen frequently.',
    },
    {
      q: 'How do I suppress a specific trimmer warning that I know is safe to ignore?',
      a: 'Use [UnconditionalSuppressMessage("TrimAnalysis", "IL2026", Justification = "Types registered manually")]. This is the correct way to silence specific IL2026 warnings when you have manually ensured the referenced types survive trimming. Alternatively, add <TrimmerRootDescriptor Include="linker.xml" /> in the .csproj to keep specific types. Never use <TrimmerRootAssembly> or SuppressAllWarnings — they mask real issues.',
    },
    {
      q: 'What limitations exist for third-party libraries in a Native AOT application?',
      a: 'Many popular libraries are not yet AOT-compatible: runtime code generation (Roslyn scripting, Expression.Compile at runtime, IL.Emit), dynamic proxies (Castle Windsor, Moq, older Autofac), conventional EF Core (use compiled models), and libraries that do heavy reflection-based registration (some MediatR versions). Check the library\'s GitHub for an AOT compatibility issue or PR. The .NET team maintains a compatibility list. Run your app with trimmer analysis (<IsAotCompatible>true</IsAotCompatible>) to surface issues early.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Native AOT compiles C# to native machine code at publish time — no JIT, no runtime, ~2ms startup. The price: no runtime reflection; replace it with source generators, <code>[LibraryImport]</code>, <code>JsonSerializerContext</code>, and <code>[LoggerMessage]</code>.',
    mustKnow: [
      '<code>&lt;PublishAot&gt;true&lt;/PublishAot&gt;</code> in .csproj; publish with <code>dotnet publish -c Release -r &lt;rid&gt;</code>',
      'Trimmer removes unreachable types — reflection on trimmed types fails silently or throws',
      '<code>[DynamicallyAccessedMembers]</code> tells trimmer what to keep; <code>[RequiresUnreferencedCode]</code> warns callers',
      '<code>[LibraryImport]</code> replaces <code>[DllImport]</code> for AOT-safe P/Invoke (source-generated marshalling)',
      '<code>JsonSerializerContext</code> replaces reflection-based STJ; <code>[LoggerMessage]</code> replaces LoggerExtensions.Log',
      'Treat IL2026/IL2067 trimmer warnings as errors — each one is a potential runtime failure in AOT',
    ],
    interviewFocus: [
      '<strong>AOT vs JIT?</strong> — AOT = compile-time native code, instant startup, no reflection; JIT = runtime compile, warm-up cost',
      '<strong>PublishSingleFile vs PublishAot?</strong> — SingleFile just bundles, still JIT; AOT compiles to native',
      '<strong>How to handle JSON in AOT?</strong> — JsonSerializerContext with [JsonSerializable] source generation',
      '<strong>P/Invoke in AOT?</strong> — [LibraryImport] with source-generated marshalling; [DllImport] fails',
    ],
  };
}
