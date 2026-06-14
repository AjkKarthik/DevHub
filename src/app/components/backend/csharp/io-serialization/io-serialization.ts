import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  selector: 'app-csharp-io-serialization',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './io-serialization.html',
  styleUrl: './io-serialization.scss',
})
export class CsharpIoSerialization {

  prerequisites: Prerequisite[] = [
    { label: 'Async / Await', route: '/csharp/async' },
    { label: 'Strings & DateTime', route: '/csharp/strings-datetime' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'File.ReadAllText',           type: 'method',   desc: 'Reads an entire file into a string. Convenient for small files. Synchronous — blocks the thread.', since: '.NET 1' },
    { name: 'File.ReadAllTextAsync',      type: 'method',   desc: 'Async version of ReadAllText. Prefer in ASP.NET Core to free the thread pool while I/O completes.', since: '.NET Core 2' },
    { name: 'File.WriteAllText',          type: 'method',   desc: 'Creates or overwrites a file with the given string. Synchronous.', since: '.NET 1' },
    { name: 'StreamReader',               type: 'class',    desc: 'Reads characters from a byte stream. Supports line-by-line reading via ReadLine()/ReadLineAsync(). Must be disposed.', since: '.NET 1' },
    { name: 'StreamWriter',               type: 'class',    desc: 'Writes characters to a byte stream. Must be disposed (or used in a using block) to flush and close the stream.', since: '.NET 1' },
    { name: 'Path.Combine',               type: 'method',   desc: 'Combines path segments in a platform-safe way. Avoid string concatenation for paths.', since: '.NET 1' },
    { name: 'Directory',                  type: 'class',    desc: 'Static helpers: CreateDirectory, Delete, Exists, GetFiles, EnumerateFiles, Move.', since: '.NET 1' },
    { name: 'JsonSerializer.Serialize',   type: 'method',   desc: 'Serializes an object to a JSON string. Accepts JsonSerializerOptions for customisation.', since: '.NET Core 3' },
    { name: 'JsonSerializer.Deserialize', type: 'method',   desc: 'Deserializes a JSON string to a typed object. Returns null for JSON null.', since: '.NET Core 3' },
    { name: 'JsonSerializerOptions',      type: 'class',    desc: 'Configure camelCase naming, indented output, null handling, custom converters, and more. Create once and reuse.', since: '.NET Core 3' },
    { name: '[JsonPropertyName]',         type: 'decorator', desc: 'Maps a C# property to a different JSON key name.', since: '.NET Core 3' },
    { name: '[JsonSerializable]',         type: 'decorator', desc: 'Marks a type for JSON source generation — compile-time serialization, no runtime reflection.', since: '.NET 6' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'File vs Stream APIs',
      points: [
        'The static <code>File</code> class provides one-liner convenience methods — <code>ReadAllText</code>, <code>WriteAllText</code>, <code>ReadAllLines</code>, <code>AppendAllText</code> — that open, operate, and close in one call. They are ideal for small files in utility code and scripts.',
        'For large files, reading the entire content into memory at once wastes resources. Prefer streaming APIs (<code>StreamReader</code>, <code>FileStream</code>) that process data incrementally — line by line or in fixed-size chunks — so memory usage stays constant regardless of file size.',
        '<code>StreamReader</code> and <code>StreamWriter</code> wrap a <code>FileStream</code> and add character encoding support. Always wrap them in a <code>using</code> block — disposing the wrapper flushes buffered data and also disposes the underlying stream. Forgetting to dispose a <code>StreamWriter</code> is a silent data loss bug.',
        'The <code>Path</code> class provides cross-platform helpers: <code>Path.Combine</code>, <code>Path.GetFileName</code>, <code>Path.GetExtension</code>, <code>Path.GetDirectoryName</code>. Never concatenate path strings with <code>+</code> or <code>/</code> — the separator differs between Windows (<code>\\</code>) and Linux (<code>/</code>), and <code>Path.Combine</code> handles this correctly.',
        '<code>Directory.EnumerateFiles</code> is lazy — it streams matching file paths without loading the full directory listing into memory. Prefer it over <code>Directory.GetFiles</code> when working with directories that may contain thousands of files.',
      ],
    },
    {
      heading: 'Async I/O in ASP.NET Core',
      points: [
        'Synchronous file operations (<code>ReadAllText</code>, <code>StreamReader.ReadLine</code>) block the calling thread while the OS fetches data from disk. The thread sits idle, consuming stack memory and a thread pool slot, doing nothing useful.',
        'In ASP.NET Core, thread pool threads are finite. Blocking even a few threads for synchronous I/O reduces the number of concurrent requests the server can handle. Under load, this leads to thread pool exhaustion and request queuing.',
        'Prefer <code>File.ReadAllTextAsync</code>, <code>StreamReader.ReadLineAsync</code>, <code>Stream.ReadAsync</code> and always <code>await</code> them. The thread is returned to the pool while the OS performs the I/O, and a new (or the same) thread resumes when data is ready.',
        'Use <code>FileStream</code> with <code>FileOptions.Asynchronous</code> (or pass <code>useAsync: true</code>) to ensure the OS performs true async I/O instead of just wrapping a blocking call in a background thread. Without this flag, <code>ReadAsync</code> may use a thread under the hood on Windows.',
        'Pass <code>CancellationToken</code> to all async I/O operations. If the HTTP request is cancelled (client disconnects), the token signals the I/O to abort, freeing the file handle and any buffered data immediately rather than completing a now-pointless operation.',
      ],
    },
    {
      heading: 'System.Text.Json vs Newtonsoft.Json',
      points: [
        '<code>System.Text.Json</code> is the built-in, high-performance serialiser included in .NET since 3.0. It uses UTF-8 directly, is allocation-efficient via <code>Utf8JsonReader</code> and <code>Utf8JsonWriter</code>, and is the default in ASP.NET Core. Microsoft invests in its performance continuously.',
        'Newtonsoft.Json (Json.NET) is the longstanding open-source library. It offers more features: dynamic objects, LINQ to JSON, more type-converters, more lenient parsing of malformed JSON, and a richer attribute model. It has a vast ecosystem of third-party extensions.',
        'For most new .NET 6+ projects, use <code>System.Text.Json</code> — it is faster, built-in, and sufficient for the vast majority of use cases. Add Newtonsoft when you need its advanced features or are migrating an existing codebase.',
        'Key difference: <code>System.Text.Json</code> is case-sensitive by default — <code>firstName</code> in JSON does not match <code>FirstName</code> in C# unless you set <code>PropertyNameCaseInsensitive = true</code>. Newtonsoft ignores case by default. This is the most common migration pain point.',
        'For reading huge JSON files without loading them into memory, use <code>Utf8JsonReader</code> (low-level, forward-only) or <code>JsonDocument.ParseAsync</code> (DOM-based). Both avoid the intermediate string allocation that <code>JsonSerializer.Deserialize(string)</code> creates.',
      ],
    },
    {
      heading: 'JsonSerializerOptions patterns',
      points: [
        'Create a single <code>JsonSerializerOptions</code> instance and reuse it — construction triggers reflection and metadata caching for every involved type. Creating a new instance per serialization call rebuilds that cache every time, adding measurable overhead at scale.',
        '<code>PropertyNamingPolicy = JsonNamingPolicy.CamelCase</code> serialises <code>FirstName</code> as <code>firstName</code> — essential when talking to JavaScript clients that expect camelCase. The policy also applies during deserialization when reading JSON properties.',
        '<code>WriteIndented = true</code> produces pretty-printed JSON for logs and debugging. Disable it in production — compact JSON reduces payload size, network transfer time, and parse time. A typical API response can be 30% smaller without indentation.',
        '<code>DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull</code> omits null properties from the serialized output, reducing payload size. Use <code>JsonIgnoreCondition.WhenWritingDefault</code> to also omit zero/false/empty-string values.',
        'In ASP.NET Core, configure options globally via <code>builder.Services.ConfigureHttpJsonOptions</code> (Minimal APIs) or <code>builder.Services.AddControllers().AddJsonOptions</code> (controllers) — so all endpoints share a single configuration without repeating options on every call.',
      ],
    },
    {
      heading: 'JSON source generation',
      points: [
        'JSON source generation (<code>[JsonSerializable]</code> + <code>JsonSerializerContext</code>) generates serialization code at <em>compile time</em> instead of at runtime via reflection. The result is faster startup, lower steady-state allocations, and full Native AOT compatibility.',
        'Declare a partial context class with the <code>[JsonSerializable(typeof(T))]</code> attribute for each type you want to serialize. The source generator emits a <code>JsonTypeInfo&lt;T&gt;</code> for each, which you pass to <code>JsonSerializer.Serialize(obj, MyContext.Default.MyType)</code>.',
        'Source generation is the required path for Native AOT publishing — reflection-based serialization is incompatible with AOT because the type metadata is stripped at trim time. Any library sending/receiving JSON must use source-generated serializers in AOT scenarios.',
        'The generated code is fully visible in your project — open the generated files to understand exactly what the serializer does. This also makes it easy to add custom converters or attributes at the generated level without runtime overhead.',
        'For existing codebases, you can adopt source generation incrementally: generate contexts only for your hot-path types and continue using reflection for the rest. The two approaches are interoperable within the same application.',
      ],
    },
    {
      heading: 'Path safety and environment',
      points: [
        'Always use <code>AppContext.BaseDirectory</code> (the directory where the .dll lives) rather than <code>Directory.GetCurrentDirectory()</code> (the working directory of the process). The working directory can be changed by the user or the host (IIS, Docker), so config files relative to it may not be found.',
        'For user-specific data, use <code>Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData)</code> on Windows or <code>~/.config</code> via <code>Environment.GetFolderPath(Environment.SpecialFolder.UserProfile)</code> on Linux — never hard-code <code>C:\\Users\\Alice</code>.',
        'For temporary files: <code>Path.GetTempFileName()</code> creates a uniquely named zero-byte file and returns its path — always delete it when done. <code>Path.GetTempPath()</code> returns the OS temp directory without creating a file, letting you control the name yourself.',
        'Path injection: never construct a path directly from user input like <code>Path.Combine(baseDir, userInput)</code>. An attacker can supply <code>../../etc/passwd</code>. Always validate with <code>Path.GetFullPath(path).StartsWith(baseDir)</code> to ensure the resolved path is within the allowed directory.',
        'On case-insensitive file systems (Windows, macOS by default), <code>File.Exists("Config.json")</code> returns true for <code>config.JSON</code>. On Linux (case-sensitive), it does not. Normalise file names to a consistent case when the application must run cross-platform.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'File & Directory',
      language: 'csharp',
      code: `using System.IO;

// ── 1. Read entire file (sync — OK for small CLI tools, avoid in ASP.NET) ──
string text = File.ReadAllText("config.json");

// Async version — preferred in ASP.NET Core
string textAsync = await File.ReadAllTextAsync("config.json");

// ── 2. Write / append ──────────────────────────────────────────────────────
File.WriteAllText("output.txt", "Hello, world!");
await File.WriteAllTextAsync("output.txt", "Hello async!");

File.AppendAllText("log.txt", $"[{DateTime.UtcNow:O}] App started\\n");

// ── 3. Read all lines into an array ───────────────────────────────────────
string[] lines = File.ReadAllLines("data.csv");
foreach (string line in lines)
    Console.WriteLine(line);

// ── 4. Check existence and delete ─────────────────────────────────────────
if (File.Exists("temp.txt"))
    File.Delete("temp.txt");

// ── 5. Path helpers — never concatenate paths manually ───────────────────
string basePath  = AppContext.BaseDirectory;   // directory where the .exe/.dll lives
string configDir = Path.Combine(basePath, "config");
string filePath  = Path.Combine(configDir, "appsettings.json");

Console.WriteLine(Path.GetFileName(filePath));              // appsettings.json
Console.WriteLine(Path.GetExtension(filePath));             // .json
Console.WriteLine(Path.GetFileNameWithoutExtension(filePath)); // appsettings
Console.WriteLine(Path.GetDirectoryName(filePath));         // ...config

// ── 6. Directory operations ────────────────────────────────────────────────
string logsDir = Path.Combine(basePath, "logs");
Directory.CreateDirectory(logsDir);                         // no-op if already exists

// EnumerateFiles is lazy — streams file paths, no full listing in memory
foreach (string file in Directory.EnumerateFiles(logsDir, "*.log"))
    Console.WriteLine(file);

// Move (rename) and recursive delete
// Directory.Move("src", "dst");
// Directory.Delete(logsDir, recursive: true);

// ── 7. Temp file pattern ──────────────────────────────────────────────────
string tmpPath = Path.GetTempFileName();        // creates a 0-byte file, returns path
try   { /* use tmpPath */ }
finally { File.Delete(tmpPath); }               // always clean up`,
    },
    {
      label: 'StreamReader / Writer',
      language: 'csharp',
      code: `using System.IO;
using System.Text;

// ── 1. Reading line by line (memory-efficient for large files) ────────────
// 'using' disposes the StreamReader (and the underlying FileStream) automatically
using (var reader = new StreamReader("large.csv", Encoding.UTF8))
{
    string? line;
    int lineNumber = 0;
    while ((line = await reader.ReadLineAsync()) != null)
    {
        lineNumber++;
        Console.WriteLine($"{lineNumber}: {line}");   // C# interpolation, not JS backtick
    }
}

// C# 8+ using declaration — disposes at end of enclosing scope
using var writer = new StreamWriter("output.txt", append: false, Encoding.UTF8);
await writer.WriteLineAsync("Line 1");
await writer.WriteLineAsync("Line 2");
// writer disposed here, flushing ALL buffered data to disk

// ── 2. FileStream with async read ────────────────────────────────────────
// FileOptions.Asynchronous enables true OS-level async I/O on Windows
await using var fs = new FileStream(
    "binary.dat",
    FileMode.OpenOrCreate,
    FileAccess.ReadWrite,
    FileShare.None,
    bufferSize: 4096,
    FileOptions.Asynchronous);

byte[] buffer = new byte[1024];
int bytesRead = await fs.ReadAsync(buffer.AsMemory(0, buffer.Length));
Console.WriteLine($"Read {bytesRead} bytes");

// ── 3. StringReader / StringWriter (in-memory streams, great for testing) ─
using var sw = new StringWriter();
sw.WriteLine("Hello");
sw.WriteLine("World");
string result = sw.ToString(); // "Hello\r\nWorld\r\n"

using var sr = new StringReader(result);
string? first = sr.ReadLine(); // "Hello"

// ── 4. BinaryWriter / BinaryReader for structured binary data ─────────────
string binPath = Path.GetTempFileName();

using (var bw = new BinaryWriter(File.Open(binPath, FileMode.Create)))
{
    bw.Write(42);          // int  (4 bytes, little-endian)
    bw.Write(3.14f);       // float (4 bytes)
    bw.Write("hello");     // length-prefixed UTF-8 string
}

using (var br = new BinaryReader(File.OpenRead(binPath)))
{
    int    i = br.ReadInt32();
    float  f = br.ReadSingle();
    string s = br.ReadString();
    Console.WriteLine($"{i}, {f}, {s}");  // 42, 3.14, hello
}`,
    },
    {
      label: 'System.Text.Json',
      language: 'csharp',
      code: `using System.Text.Json;
using System.Text.Json.Serialization;

// ── Model ─────────────────────────────────────────────────────────────────
public record Product(
    int Id,
    string Name,
    decimal Price,
    [property: JsonPropertyName("in_stock")] bool InStock,
    [property: JsonIgnore] string? InternalCode  // never serialised/deserialised
);

// ── 1. Serialize ───────────────────────────────────────────────────────────
var product = new Product(1, "Keyboard", 79.99m, true, "KBD-001");

// Default: PascalCase keys, no indentation
string compact = JsonSerializer.Serialize(product);
// {"Id":1,"Name":"Keyboard","Price":79.99,"in_stock":true}

// With options — create ONCE and reuse (not per call)
var opts = new JsonSerializerOptions
{
    PropertyNamingPolicy   = JsonNamingPolicy.CamelCase,
    WriteIndented          = true,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    NumberHandling         = JsonNumberHandling.AllowReadingFromString,
};

string pretty = JsonSerializer.Serialize(product, opts);
// {
//   "id": 1,
//   "name": "Keyboard",
//   "price": 79.99,
//   "in_stock": true
// }

// ── 2. Deserialize ─────────────────────────────────────────────────────────
string json = """{"Id":2,"Name":"Mouse","Price":49.99,"in_stock":false}""";

Product? p = JsonSerializer.Deserialize<Product>(json);
Console.WriteLine(p?.Name); // Mouse

// Case-insensitive matching (for external APIs where casing varies)
var caseOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
Product? p2 = JsonSerializer.Deserialize<Product>(json, caseOpts);

// ── 3. Serialize to a Stream — avoids intermediate string allocation ────────
await using var fileStream = File.Create("product.json");
await JsonSerializer.SerializeAsync(fileStream, product, opts);

await using var readStream = File.OpenRead("product.json");
Product? fromFile = await JsonSerializer.DeserializeAsync<Product>(readStream, opts);

// ── 4. Collections ────────────────────────────────────────────────────────
var products = new List<Product>
{
    new(1, "Keyboard", 79.99m, true, null),
    new(2, "Mouse",    49.99m, true, null),
};

string listJson = JsonSerializer.Serialize(products, opts);
var restored    = JsonSerializer.Deserialize<List<Product>>(listJson, opts);

// ── 5. Reuse options — static singleton pattern ────────────────────────────
public static class JsonConfig
{
    public static readonly JsonSerializerOptions Default = new()
    {
        PropertyNamingPolicy   = JsonNamingPolicy.CamelCase,
        WriteIndented          = false,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };
}`,
    },
    {
      label: 'Source Generation',
      language: 'csharp',
      code: `using System.Text.Json;
using System.Text.Json.Serialization;

// ── Step 1: annotate your context with all types to serialize ─────────────
// The source generator emits JsonTypeInfo<T> for each [JsonSerializable] type
[JsonSerializable(typeof(Product))]
[JsonSerializable(typeof(List<Product>))]
[JsonSerializable(typeof(Order))]
[JsonSourceGenerationOptions(
    PropertyNamingPolicy       = JsonKnownNamingPolicy.CamelCase,
    WriteIndented              = false,
    DefaultIgnoreCondition     = JsonIgnoreCondition.WhenWritingNull)]
internal partial class AppJsonContext : JsonSerializerContext { }

// ── Step 2: use the generated context instead of reflection ───────────────
var product = new Product(1, "Keyboard", 79.99m, true);

// Type-safe — no reflection at runtime; errors caught at compile time
string json = JsonSerializer.Serialize(product, AppJsonContext.Default.Product);

Product? restored = JsonSerializer.Deserialize(json, AppJsonContext.Default.Product);

// ── Step 3: use with streams (most efficient path) ─────────────────────────
await using var fs = File.Create("out.json");
await JsonSerializer.SerializeAsync(fs, product, AppJsonContext.Default.Product);

// ── Register context in ASP.NET Core (configures the whole pipeline) ───────
// builder.Services.ConfigureHttpJsonOptions(opts =>
//     opts.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonContext.Default));

// ── Custom converter example ───────────────────────────────────────────────
public class DecimalConverter : JsonConverter<decimal>
{
    public override decimal Read(ref Utf8JsonReader r, Type t, JsonSerializerOptions o)
        => r.GetDecimal();

    public override void Write(Utf8JsonWriter w, decimal v, JsonSerializerOptions o)
        => w.WriteNumberValue(Math.Round(v, 2));   // always 2 d.p. in output
}

// Register:
var opts = new JsonSerializerOptions();
opts.Converters.Add(new DecimalConverter());

// ── Models ───────────────────────────────────────────────────────────────
record Product(int Id, string Name, decimal Price,
    [property: JsonPropertyName("in_stock")] bool InStock);
record Order(int OrderId, List<Product> Items, DateTime PlacedAt);`,
    },
    {
      label: 'Read/Write JSON Files',
      language: 'csharp',
      code: `using System.IO;
using System.Text.Json;

// ── Utility helpers (production pattern) ─────────────────────────────────
public static class JsonFile
{
    private static readonly JsonSerializerOptions _opts = new()
    {
        PropertyNamingPolicy   = JsonNamingPolicy.CamelCase,
        WriteIndented          = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static async Task<T?> ReadAsync<T>(string path, CancellationToken ct = default)
    {
        if (!File.Exists(path)) return default;
        await using var stream = File.OpenRead(path);
        return await JsonSerializer.DeserializeAsync<T>(stream, _opts, ct);
    }

    // Write to temp file then atomically rename — prevents corrupt files on crash
    public static async Task WriteAsync<T>(string path, T value, CancellationToken ct = default)
    {
        string tmp = path + ".tmp";
        await using (var stream = File.Create(tmp))
            await JsonSerializer.SerializeAsync(stream, value, _opts, ct);

        File.Move(tmp, path, overwrite: true);   // atomic on same volume
    }
}

// ── Usage ─────────────────────────────────────────────────────────────────
record AppSettings(string ApiUrl, int TimeoutSeconds, bool EnableCache);

string settingsPath = Path.Combine(AppContext.BaseDirectory, "settings.json");

var settings = new AppSettings("https://api.example.com", 30, true);
await JsonFile.WriteAsync(settingsPath, settings);

AppSettings? loaded = await JsonFile.ReadAsync<AppSettings>(settingsPath);
Console.WriteLine(loaded?.ApiUrl); // https://api.example.com

// ── Directory scan + async stream ────────────────────────────────────────
async IAsyncEnumerable<Product> LoadProductsAsync(string directory, CancellationToken ct)
{
    foreach (string file in Directory.EnumerateFiles(directory, "*.json"))
    {
        var product = await JsonFile.ReadAsync<Product>(file, ct);
        if (product is not null)
            yield return product;
    }
}

// ── Path injection defense ─────────────────────────────────────────────────
static string SafeFilePath(string baseDir, string userInput)
{
    // GetFullPath resolves ".." and symlinks
    string resolved = Path.GetFullPath(Path.Combine(baseDir, userInput));
    if (!resolved.StartsWith(baseDir, StringComparison.OrdinalIgnoreCase))
        throw new UnauthorizedAccessException("Path traversal attempt detected");
    return resolved;
}

record Product(int Id, string Name, decimal Price);`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Synchronous file I/O in ASP.NET Core — blocks the thread pool',
      wrong: `// In an ASP.NET Core controller or endpoint:
[HttpGet("/config")]
public IActionResult GetConfig()
{
    // BLOCKS the thread for the full duration of the disk read
    string json = File.ReadAllText("config.json");
    return Content(json, "application/json");
}

// Under load: 20 concurrent requests means 20 blocked threads
// Thread pool exhaustion = requests start queuing = latency spikes`,
      right: `[HttpGet("/config")]
public async Task<IActionResult> GetConfig()
{
    // Thread returned to pool while OS reads the file
    string json = await File.ReadAllTextAsync("config.json");
    return Content(json, "application/json");
}

// For production: cache the config in IMemoryCache after first load
// so you don't hit the file system on every request`,
      explanation: 'ASP.NET Core thread pool threads are limited (default: number of CPU cores, expanding slowly). A synchronous File.ReadAllText blocks the thread for the entire disk read duration. Under load, all threads can be blocked waiting for I/O, causing new requests to queue. Async I/O releases the thread back to the pool during the wait, so 20 concurrent file reads need far fewer threads.',
    },
    {
      title: 'Creating JsonSerializerOptions per call — rebuilds reflection cache',
      wrong: `// New options instance on every request or per call:
public string SerializeProduct(Product p)
{
    // BAD: builds reflection metadata for Product EVERY call
    var opts = new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented        = true,
    };
    return JsonSerializer.Serialize(p, opts);
}`,
      right: `// Static singleton — reflection metadata built ONCE
private static readonly JsonSerializerOptions _opts = new()
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    WriteIndented        = true,
};

public string SerializeProduct(Product p)
    => JsonSerializer.Serialize(p, _opts);

// In ASP.NET Core, configure globally so all endpoints share it:
// builder.Services.ConfigureHttpJsonOptions(o => {
//     o.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
// });`,
      explanation: 'The first time JsonSerializer uses a JsonSerializerOptions instance, it builds an internal cache of reflection metadata for every serialized type — property accessors, converter selection, naming policies. Creating a new instance per call discards this cache and rebuilds it from scratch. For a Product class with 10 properties, this means 10 PropertyInfo lookups on every call. Use a static readonly field or DI singleton.',
    },
    {
      title: 'Forgetting to dispose StreamWriter — data silently not written to disk',
      wrong: `// Missing dispose — data may never reach the file!
public void SaveConfig(string path, string json)
{
    var writer = new StreamWriter(path);
    writer.WriteLine(json);
    // writer never disposed — buffered data may not be flushed
    // File exists but may be empty or truncated
}

// Also wrong — exception prevents disposal:
var writer2 = new StreamWriter(path);
DoSomethingThatThrows();
writer2.Dispose();   // never reached!`,
      right: `// using statement: always disposes even if an exception is thrown
public void SaveConfig(string path, string json)
{
    using var writer = new StreamWriter(path);
    writer.WriteLine(json);
    // Dispose flushes the buffer and closes the file handle
}

// For async:
public async Task SaveConfigAsync(string path, string json)
{
    await using var writer = new StreamWriter(path);
    await writer.WriteLineAsync(json);
}`,
      explanation: 'StreamWriter buffers writes internally for performance — data may be queued in memory and not yet written to disk. Only Dispose() (or Flush()) forces the buffer to be written. If you forget to dispose, the file may be empty, partial, or contain old data — and the process can hold the file handle open, preventing other processes from accessing it.',
    },
    {
      title: 'Concatenating file paths with string + — breaks cross-platform',
      wrong: `// Works on Windows, breaks on Linux:
string path1 = baseDir + "\\config\\settings.json";  // hardcoded backslash
string path2 = baseDir + "/" + "config" + "/" + "file.json";  // forward slash

// Path traversal risk from user input:
string userFile = userInput;  // might be "../../secret.key"
string dangerous = Path.Combine(baseDir, userFile);  // no validation!`,
      right: `// Path.Combine handles OS separator automatically:
string path1 = Path.Combine(baseDir, "config", "settings.json");  // OS-aware

// Validate user-supplied paths to prevent traversal:
string resolved = Path.GetFullPath(Path.Combine(baseDir, userInput));
if (!resolved.StartsWith(baseDir, StringComparison.OrdinalIgnoreCase))
    throw new UnauthorizedAccessException("Path traversal attempt");
string safePath = resolved;

// Use AppContext.BaseDirectory for the app's root:
string configPath = Path.Combine(AppContext.BaseDirectory, "config.json");`,
      explanation: 'String concatenation for paths is a two-problem bug: (1) the separator character is \\ on Windows and / on Linux — hardcoding either breaks the other OS; (2) user-controlled path segments like "../../" can escape your intended directory (path traversal attack). Path.Combine handles the separator, and GetFullPath + StartsWith provides a traversal check.',
    },
    {
      title: 'Using File.Exists then File.ReadAllText — race condition TOCTOU',
      wrong: `// Time-of-check / time-of-use (TOCTOU) race condition:
if (File.Exists(path))
{
    // Another process/thread could DELETE the file between these two lines
    string content = File.ReadAllText(path);  // may throw FileNotFoundException!
}

// Common in loops:
foreach (string f in files)
    if (File.Exists(f))               // file could be deleted right after
        Process(File.ReadAllText(f)); // throws!`,
      right: `// Option 1: just try and handle the exception
try
{
    string content = await File.ReadAllTextAsync(path);
    Process(content);
}
catch (FileNotFoundException)
{
    // File did not exist or was deleted — handle gracefully
}

// Option 2: read into nullable result
static async Task<string?> TryReadAsync(string path)
{
    if (!File.Exists(path)) return null;
    try   { return await File.ReadAllTextAsync(path); }
    catch (FileNotFoundException) { return null; }
}`,
      explanation: 'File.Exists followed by File.ReadAllText is a TOCTOU (time-of-check / time-of-use) race condition: another process or thread can delete or rename the file between the two calls. The check only tells you the state at that moment. The safe approach is to attempt the operation directly and handle FileNotFoundException — this is also one fewer syscall.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Why should you prefer <code>File.ReadAllTextAsync</code> over <code>File.ReadAllText</code> in an ASP.NET Core controller?',
      options: [
        'ReadAllTextAsync returns a more accurate result',
        'ReadAllText is not available in .NET 6+',
        'ReadAllText blocks the thread pool thread while waiting for disk I/O, reducing server throughput under load',
        'ReadAllTextAsync automatically handles file encoding',
      ],
      answer: 2,
      explanation: 'In ASP.NET Core, each concurrent request occupies a thread pool thread. <code>ReadAllText</code> blocks that thread during the entire disk read. With <code>ReadAllTextAsync</code> and <code>await</code>, the thread is returned to the pool during I/O and resumed when data arrives — allowing the same number of threads to handle many more concurrent requests.',
    },
    {
      q: 'What does <code>[JsonIgnore]</code> do on a property?',
      options: [
        'Makes the property read-only during deserialization',
        'Excludes the property from both serialization and deserialization entirely',
        'Treats the property as optional — no error if missing in JSON',
        'Converts the property to a JSON null value',
      ],
      answer: 1,
      explanation: '<code>[JsonIgnore]</code> tells <code>System.Text.Json</code> to completely skip the property — it will not appear in serialized output and will not be populated during deserialization. Use it for internal/sensitive fields like password hashes, computed properties that should not round-trip, or to break circular references.',
    },
    {
      q: 'Which <code>JsonSerializerOptions</code> setting converts C# property names like <code>FirstName</code> to <code>firstName</code> in JSON output?',
      options: [
        'WriteIndented = true',
        'PropertyNameCaseInsensitive = true',
        'PropertyNamingPolicy = JsonNamingPolicy.CamelCase',
        'DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull',
      ],
      answer: 2,
      explanation: '<code>PropertyNamingPolicy = JsonNamingPolicy.CamelCase</code> transforms PascalCase property names to camelCase during serialization. <code>PropertyNameCaseInsensitive</code> only controls whether incoming JSON key matching is case-insensitive on deserialization — it does not change the output format.',
    },
    {
      q: 'Why should you create a single <code>JsonSerializerOptions</code> instance and reuse it rather than creating one per call?',
      options: [
        'JsonSerializerOptions instances are not thread-safe and must be shared',
        'Creating JsonSerializerOptions is expensive — it builds reflection metadata caches for all involved types that are lost when the instance is discarded',
        'Each new instance generates a different random seed affecting output ordering',
        'The default constructor throws if called more than once',
      ],
      answer: 1,
      explanation: 'The first time a <code>JsonSerializerOptions</code> instance is used for a type, it builds an internal cache: property accessors, converter selection, naming policy application. Creating a new instance per serialization call discards that cache and rebuilds it — adding significant overhead at scale. Use a <code>static readonly</code> field or DI singleton.',
    },
    {
      q: 'What is the purpose of <code>FileOptions.Asynchronous</code> when creating a <code>FileStream</code>?',
      options: [
        'It enables automatic retry on transient I/O failures',
        'It enables true OS-level async I/O — without it, ReadAsync may internally block a thread pool thread on Windows',
        'It makes the FileStream thread-safe for concurrent reads',
        'It enables append-only mode on the file',
      ],
      answer: 1,
      explanation: 'On Windows, the OS can perform file I/O in two modes: synchronous (blocks a thread) and asynchronous (uses an I/O completion port). Without <code>FileOptions.Asynchronous</code>, even calling <code>ReadAsync</code> may internally block a thread pool thread to simulate async behavior. With this flag, the OS uses completion ports — the thread is not involved at all during the wait, and <code>await</code> is truly non-blocking.',
    },
    {
      q: 'What is the main advantage of JSON source generation over reflection-based <code>System.Text.Json</code> serialization?',
      options: [
        'Source generation produces smaller JSON output with better compression',
        'Source generation generates serialization code at compile time — no reflection at runtime, enabling Native AOT and faster startup',
        'Source generation automatically handles circular references that reflection cannot',
        'Source generation only works with records, not classes',
      ],
      answer: 1,
      explanation: 'Reflection-based serialization discovers property names, types, and converters at runtime using <code>System.Reflection</code>. Source generation analyzes your types at compile time and emits the serialization code directly — zero runtime reflection. This is required for Native AOT (which trims reflection metadata) and also improves startup time since the metadata is already compiled in.',
    },
    {
      q: 'Why is checking <code>File.Exists(path)</code> before <code>File.ReadAllText(path)</code> not a safe pattern?',
      options: [
        'File.Exists always returns false on Linux',
        'It is a TOCTOU race condition — the file can be deleted between the two calls, causing ReadAllText to throw despite the Exists check passing',
        'File.Exists checks the wrong directory by default',
        'They are safe — File.ReadAllText internally calls File.Exists before reading',
      ],
      answer: 1,
      explanation: 'TOCTOU (time-of-check / time-of-use) is a race condition where the file system state changes between your check and your use. Another process or thread can delete the file after <code>File.Exists</code> returns true but before <code>ReadAllText</code> opens it — causing <code>FileNotFoundException</code> despite the guard. The correct pattern is to attempt the read directly and handle <code>FileNotFoundException</code>.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between StreamReader and File.ReadAllText?',
      a: '<code>File.ReadAllText</code> opens the file, reads the entire content into a single <code>string</code>, closes the file, and returns. It is convenient for small files but loads everything into memory at once.<br><br><code>StreamReader</code> wraps a <code>FileStream</code> and lets you read incrementally — line by line with <code>ReadLine()</code>, character by character, or in arbitrary chunks. This is memory-efficient for large files (logs, CSV exports, large JSON arrays) where you process data as you read rather than loading it all first.<br><br>Both must handle encoding correctly. <code>File.ReadAllText</code> detects the BOM automatically. <code>StreamReader</code> defaults to UTF-8; pass an <code>Encoding</code> argument if the file uses a different encoding.',
    },
    {
      q: 'How does System.Text.Json differ from Newtonsoft.Json?',
      a: '<strong>System.Text.Json</strong> is Microsoft\'s built-in serialiser (since .NET Core 3.0). It is faster and allocates less memory, is the default in ASP.NET Core, and is maintained as part of the .NET runtime. It is stricter by default — case-sensitive property matching, no support for some Newtonsoft-specific attributes.<br><br><strong>Newtonsoft.Json (Json.NET)</strong> is the mature open-source library. It supports more edge cases: dynamic objects, polymorphic deserialization without source generators, LINQ to JSON, more lenient parsing, and a large ecosystem of converters.<br><br>For new .NET 6+ projects, start with <code>System.Text.Json</code>. Switch to Newtonsoft only when you need a specific feature it does not support.',
    },
    {
      q: 'What is JSON source generation and when should I use it?',
      a: 'JSON source generation is a compile-time feature (<code>[JsonSerializable]</code> attribute + <code>JsonSerializerContext</code>) where the .NET toolchain generates serialization/deserialization code during the build instead of using reflection at runtime.<br><br><strong>Use it when:</strong> <ul><li>Publishing with Native AOT (required — reflection metadata is trimmed)</li><li>You need the fastest possible startup (reflection metadata is pre-computed)</li><li>You want a smaller app footprint (no reflection overhead)</li><li>Working with hot-path serialization where microseconds matter</li></ul><strong>You can skip it when:</strong> the types change dynamically, you\'re using Newtonsoft, or the serialization is infrequent enough that the 3-5% performance difference is irrelevant.',
    },
    {
      q: 'What is the safe way to write a JSON file so a crash mid-write does not corrupt it?',
      a: 'Write to a temporary file first, then atomically rename (move) it over the destination. On most file systems, a same-volume rename is an atomic operation — either the old file exists or the new one does, never a partial write:<br><br><code>string tmp = path + ".tmp";</code><br><code>await using (var stream = File.Create(tmp))</code><br><code>&nbsp;&nbsp;await JsonSerializer.SerializeAsync(stream, value, opts);</code><br><code>File.Move(tmp, path, overwrite: true); // atomic rename</code><br><br>If the process crashes before <code>File.Move</code>, the original file is untouched. The <code>.tmp</code> file is orphaned but harmless. This pattern is essential for any configuration or state file your application reads on startup.',
    },
    {
      q: 'When should I use BinaryWriter/BinaryReader instead of JSON?',
      a: 'Use binary serialization when you need compact, fixed-width storage or when reading performance is critical.<br><br><strong>Use binary when:</strong> storing millions of numeric records (game telemetry, sensor data, financial tick data), interoperating with C libraries or network protocols that define binary formats, or when file size matters significantly.<br><br><strong>Stick with JSON when:</strong> the data must be human-readable, you need cross-language compatibility, the schema evolves over time (JSON handles missing/extra fields gracefully), or you are building APIs.<br><br>For structured binary with schema evolution, consider Protocol Buffers (<code>Google.Protobuf</code>) or MessagePack — they provide the compactness of binary with the flexibility of a defined schema.',
    },
    {
      q: 'How do I efficiently read a huge JSON file without loading it all into memory?',
      a: 'There are two main approaches in <code>System.Text.Json</code>:<br><br><strong>1. Deserialize from a Stream</strong> — <code>JsonSerializer.DeserializeAsync&lt;T&gt;(stream)</code> reads the stream incrementally rather than loading it into a string first. For a 100 MB file, this avoids a 200 MB string + 100 MB object graph in memory simultaneously.<br><br><strong>2. Utf8JsonReader</strong> — a low-level, forward-only reader that processes one JSON token at a time with zero extra allocation. Use it when you need to cherry-pick specific fields from huge objects, or when you\'re writing a custom parser or converter.<br><br>For JSON Lines format (one JSON object per line), read line by line with <code>StreamReader.ReadLineAsync()</code> and deserialize each line independently — constant memory regardless of file size.',
    },
    {
      q: 'What is the difference between File.OpenRead and new FileStream(..., FileMode.Open)?',
      a: '<code>File.OpenRead(path)</code> is a shorthand for <code>new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read)</code>. It opens the file for reading with shared read access — multiple readers can access the file simultaneously. It is the simplest choice for read-only scenarios.<br><br><code>new FileStream(path, FileMode.Open, FileAccess.ReadWrite, FileShare.None, bufferSize, FileOptions.Asynchronous)</code> gives you full control over: access mode (Read/Write/ReadWrite), sharing (None/Read/Write/ReadWrite/Delete), buffer size, and async options. Use the full constructor when you need to write, when you want exclusive access, or when you need true async I/O (<code>FileOptions.Asynchronous</code>) on Windows.',
    },
  ];

  challenge: Challenge = {
    title: 'Async CSV Log Processor',
    description: `Implement a LogProcessor that reads a CSV log file line by line (async), parses each line, filters by severity, and writes matching lines to an output file.

Requirements:
1. Read the input file asynchronously line by line using StreamReader — do NOT read all lines into memory at once
2. Each CSV line has format: timestamp,severity,message (e.g. "2024-01-01T00:00:00,ERROR,Disk full")
3. Accept a minimum severity level: INFO &lt; WARNING &lt; ERROR
4. Write matching lines as JSON objects to the output file using System.Text.Json
5. Return the count of lines written`,
    language: 'csharp',
    hints: [
      'Use StreamReader with ReadLineAsync() in a while loop — check for null to detect end of file',
      'Split each line on \',\' with a limit of 3 parts: line.Split(\',\', 3)',
      'Define an enum for severity levels so comparison is easy',
      'Open the output StreamWriter before the loop; write one JSON line per matching entry',
    ],
    starterCode: `public enum Severity { INFO, WARNING, ERROR }

public record LogEntry(DateTime Timestamp, Severity Severity, string Message);

public class LogProcessor
{
    public async Task<int> ProcessAsync(
        string inputPath,
        string outputPath,
        Severity minSeverity,
        CancellationToken ct = default)
    {
        // TODO: open StreamReader on inputPath
        // TODO: open StreamWriter on outputPath
        // TODO: read lines asynchronously in a loop
        // TODO: parse each line into a LogEntry
        // TODO: skip entries below minSeverity
        // TODO: write matching entries as JSON to output
        // TODO: return count of written entries
        throw new NotImplementedException();
    }
}`,
    solution: `using System.Text.Json;
using System.Text.Json.Serialization;

public enum Severity { INFO, WARNING, ERROR }

public record LogEntry(DateTime Timestamp, Severity Severity, string Message);

public class LogProcessor
{
    private static readonly JsonSerializerOptions _opts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public async Task<int> ProcessAsync(
        string inputPath,
        string outputPath,
        Severity minSeverity,
        CancellationToken ct = default)
    {
        int count = 0;

        using  var reader = new StreamReader(inputPath);
        await using var writer = new StreamWriter(outputPath, append: false);

        string? line;
        while ((line = await reader.ReadLineAsync(ct)) != null)
        {
            ct.ThrowIfCancellationRequested();

            var parts = line.Split(',', 3);
            if (parts.Length < 3) continue;

            if (!DateTime.TryParse(parts[0], out var ts)) continue;
            if (!Enum.TryParse<Severity>(parts[1], out var sev)) continue;
            if (sev < minSeverity) continue;

            var entry = new LogEntry(ts, sev, parts[2]);
            string json = JsonSerializer.Serialize(entry, _opts);
            await writer.WriteLineAsync(json);
            count++;
        }

        return count;
    }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Use async file APIs in ASP.NET Core to avoid blocking thread pool threads. Create JsonSerializerOptions once and reuse — construction is expensive. Always dispose StreamWriter (buffers flush on dispose). Use Path.Combine for cross-platform paths, and the write-to-temp-then-rename pattern to prevent file corruption.',
    mustKnow: [
      'Always use <code>File.ReadAllTextAsync</code> / <code>StreamReader.ReadLineAsync</code> in ASP.NET Core — synchronous I/O blocks the thread pool and hurts throughput.',
      '<code>JsonSerializerOptions</code> must be created once and reused as a static singleton — first use builds expensive reflection metadata caches.',
      'Dispose <code>StreamWriter</code> — buffered data is NOT written to disk until <code>Flush()</code> or <code>Dispose()</code> is called. Use <code>using</code> or <code>await using</code>.',
      '<code>Path.Combine</code> over string concatenation — handles OS path separators correctly on Windows and Linux.',
      'Prefer trying the operation and catching <code>FileNotFoundException</code> over the TOCTOU-prone <code>File.Exists</code> + read pattern.',
      'JSON source generation (<code>[JsonSerializable]</code>) is required for Native AOT and eliminates all reflection overhead from serialization.',
      'Write JSON to a <code>.tmp</code> file first, then <code>File.Move</code> atomically — prevents corrupt config files if the process crashes mid-write.',
    ],
    interviewFocus: [
      'Why does async file I/O matter in ASP.NET Core? (Thread pool exhaustion under load — blocking threads reduces concurrency)',
      'What is a TOCTOU race condition in file I/O? How do you avoid it? (File.Exists + Read can race; catch FileNotFoundException instead)',
      'What happens if you don\'t dispose a StreamWriter? (Buffered data never reaches disk — silent data loss)',
      'What is JSON source generation and when do you need it? (Compile-time codegen; required for Native AOT; faster startup)',
      'What is the write-to-temp-then-rename pattern? Why does it prevent file corruption? (File.Move is atomic; old file is untouched if crash occurs before rename)',
    ],
  };
}
