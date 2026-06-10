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
  selector: 'app-csharp-io-serialization',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './io-serialization.html',
  styleUrl: './io-serialization.scss',
})
export class CsharpIoSerialization {

  quickRef: QuickRefItem[] = [
    { name: 'File.ReadAllText',        type: 'method',  desc: 'Reads an entire file into a string. Convenient for small files. Synchronous — blocks the thread.' },
    { name: 'File.ReadAllTextAsync',   type: 'method',  desc: 'Async version of ReadAllText. Prefer in ASP.NET Core to free the thread pool while I/O completes.' },
    { name: 'File.WriteAllText',       type: 'method',  desc: 'Creates or overwrites a file with the given string. Synchronous.' },
    { name: 'StreamReader',            type: 'class',   desc: 'Reads characters from a byte stream. Supports line-by-line reading via ReadLine()/ReadLineAsync(). Must be disposed.' },
    { name: 'StreamWriter',            type: 'class',   desc: 'Writes characters to a byte stream. Must be disposed (or used in a using block) to flush and close the stream.' },
    { name: 'Path.Combine',            type: 'method',  desc: 'Combines path segments in a platform-safe way. Avoid string concatenation for paths.' },
    { name: 'Directory',               type: 'class',   desc: 'Static helpers: CreateDirectory, Delete, Exists, GetFiles, EnumerateFiles, Move.' },
    { name: 'JsonSerializer.Serialize',   type: 'method', desc: 'Serializes an object to a JSON string. Accepts JsonSerializerOptions for customisation.' },
    { name: 'JsonSerializer.Deserialize', type: 'method', desc: 'Deserializes a JSON string to a typed object. Returns null for JSON null.' },
    { name: 'JsonSerializerOptions',   type: 'class',   desc: 'Configure camelCase naming, indented output, null handling, custom converters, and more.' },
    { name: '[JsonPropertyName]',      type: 'decorator', desc: 'Maps a C# property to a different JSON key name.' },
    { name: '[JsonIgnore]',            type: 'decorator', desc: 'Excludes a property from serialization and deserialization entirely.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'File vs Stream APIs',
      points: [
        'The static <code>File</code> class provides convenience methods — <code>ReadAllText</code>, <code>WriteAllText</code>, <code>ReadAllLines</code>, <code>AppendAllText</code> — that open, operate, and close in one call.',
        'For large files, reading the entire content into memory wastes resources. Prefer streaming APIs (<code>StreamReader</code>, <code>FileStream</code>) that process data incrementally.',
        '<code>StreamReader</code> and <code>StreamWriter</code> wrap a <code>FileStream</code> and add character encoding support. Always wrap them in a <code>using</code> block — disposing the wrapper also disposes the underlying stream.',
        'The <code>Path</code> class provides cross-platform helpers: <code>Path.Combine</code>, <code>Path.GetFileName</code>, <code>Path.GetExtension</code>, <code>Path.GetDirectoryName</code>. Never concatenate path strings manually.',
      ],
    },
    {
      heading: 'Async I/O in ASP.NET Core',
      points: [
        'Synchronous file operations (<code>ReadAllText</code>, <code>StreamReader.ReadLine</code>) block the calling thread until the OS returns data from disk.',
        'In ASP.NET Core, thread pool threads are scarce. Blocking one reduces the server\'s ability to handle concurrent requests.',
        'Prefer <code>File.ReadAllTextAsync</code>, <code>StreamReader.ReadLineAsync</code>, <code>Stream.ReadAsync</code> and always <code>await</code> them. The thread is returned to the pool while I/O completes.',
        'Use <code>FileStream</code> with <code>FileOptions.Asynchronous</code> (or pass <code>useAsync: true</code>) to ensure the OS performs true async I/O instead of blocking in a thread pool thread.',
      ],
    },
    {
      heading: 'System.Text.Json vs Newtonsoft.Json',
      points: [
        '<code>System.Text.Json</code> is the built-in, high-performance serialiser included in .NET since 3.0. It is allocation-efficient and the default in ASP.NET Core.',
        'Newtonsoft.Json (Json.NET) is the longstanding open-source library. It offers more features (dynamic objects, more converters, LINQ to JSON) and is more lenient with malformed JSON.',
        'For most new projects use <code>System.Text.Json</code>. Add Newtonsoft when you need its advanced features or are migrating an existing codebase.',
        'Key difference: <code>System.Text.Json</code> is case-sensitive by default and does not support all Newtonsoft attributes. Use <code>JsonSerializerOptions</code> with <code>PropertyNameCaseInsensitive = true</code> when consuming external APIs.',
      ],
    },
    {
      heading: 'JsonSerializerOptions patterns',
      points: [
        'Create a single <code>JsonSerializerOptions</code> instance and reuse it — constructing one is expensive. In ASP.NET Core, configure options globally via <code>builder.Services.ConfigureHttpJsonOptions</code>.',
        '<code>PropertyNamingPolicy = JsonNamingPolicy.CamelCase</code> serialises <code>FirstName</code> as <code>firstName</code> — essential when talking to JavaScript clients.',
        '<code>WriteIndented = true</code> produces pretty-printed JSON for logs and debugging. Disable it in production for smaller payloads.',
        '<code>DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull</code> omits null properties from the output, reducing payload size.',
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
string basePath  = AppContext.BaseDirectory;
string configDir = Path.Combine(basePath, "config");
string filePath  = Path.Combine(configDir, "appsettings.json");

Console.WriteLine(Path.GetFileName(filePath));       // appsettings.json
Console.WriteLine(Path.GetExtension(filePath));      // .json
Console.WriteLine(Path.GetFileNameWithoutExtension(filePath)); // appsettings

// ── 6. Directory operations ────────────────────────────────────────────────
string logsDir = Path.Combine(basePath, "logs");

Directory.CreateDirectory(logsDir);       // no-op if already exists

foreach (string file in Directory.EnumerateFiles(logsDir, "*.log"))
    Console.WriteLine(file);

// Move and delete
// Directory.Move("src", "dst");
// Directory.Delete(logsDir, recursive: true);`,
    },
    {
      label: 'StreamReader / StreamWriter',
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
        Console.WriteLine(\`\${lineNumber}: \${line}\`);
    }
}

// C# 8+ using declaration — disposes at end of enclosing scope
using var writer = new StreamWriter("output.txt", append: false, Encoding.UTF8);
await writer.WriteLineAsync("Line 1");
await writer.WriteLineAsync("Line 2");
// writer disposed here, flushing all buffered data

// ── 2. FileStream with async read ────────────────────────────────────────
// FileOptions.Asynchronous enables true OS-level async I/O
await using var fs = new FileStream(
    "binary.dat",
    FileMode.OpenOrCreate,
    FileAccess.ReadWrite,
    FileShare.None,
    bufferSize: 4096,
    FileOptions.Asynchronous);

byte[] buffer = new byte[1024];
int bytesRead = await fs.ReadAsync(buffer.AsMemory(0, buffer.Length));
Console.WriteLine(\`Read \${bytesRead} bytes\`);

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
    bw.Write(42);          // int  (4 bytes)
    bw.Write(3.14f);       // float (4 bytes)
    bw.Write("hello");     // length-prefixed UTF-8 string
}

using (var br = new BinaryReader(File.OpenRead(binPath)))
{
    int i      = br.ReadInt32();
    float f    = br.ReadSingle();
    string s   = br.ReadString();
    Console.WriteLine(\`\${i}, \${f}, \${s}\`);  // 42, 3.14, hello
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
    [property: JsonIgnore] string? InternalCode  // never serialised
);

// ── 1. Serialize ───────────────────────────────────────────────────────────
var product = new Product(1, "Keyboard", 79.99m, true, "KBD-001");

// Default: PascalCase keys, no indentation
string compact = JsonSerializer.Serialize(product);
// {"Id":1,"Name":"Keyboard","Price":79.99,"in_stock":true}

// With options
var opts = new JsonSerializerOptions
{
    PropertyNamingPolicy         = JsonNamingPolicy.CamelCase,
    WriteIndented                = true,
    DefaultIgnoreCondition       = JsonIgnoreCondition.WhenWritingNull,
    NumberHandling               = JsonNumberHandling.AllowReadingFromString,
};

string pretty = JsonSerializer.Serialize(product, opts);
Console.WriteLine(pretty);
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

// Case-insensitive matching (for external APIs)
var caseOpts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
Product? p2 = JsonSerializer.Deserialize<Product>(json, caseOpts);

// ── 3. Serialize / deserialize from a stream ──────────────────────────────
// More efficient than string — avoids intermediate string allocation
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

string listJson  = JsonSerializer.Serialize(products, opts);
var restored     = JsonSerializer.Deserialize<List<Product>>(listJson, opts);

// ── 5. Reuse options — creating JsonSerializerOptions is expensive ─────────
// Best practice: create once as a static field or register via DI
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

    /// <summary>Reads and deserialises a JSON file. Returns null if file does not exist.</summary>
    public static async Task<T?> ReadAsync<T>(string path, CancellationToken ct = default)
    {
        if (!File.Exists(path)) return default;

        await using var stream = File.OpenRead(path);
        return await JsonSerializer.DeserializeAsync<T>(stream, _opts, ct);
    }

    /// <summary>Serialises an object and writes it to a file (overwrites).</summary>
    public static async Task WriteAsync<T>(string path, T value, CancellationToken ct = default)
    {
        // Write to a temp file first, then swap — prevents corrupt files on crash
        string tmp = path + ".tmp";
        await using (var stream = File.Create(tmp))
            await JsonSerializer.SerializeAsync(stream, value, _opts, ct);

        File.Move(tmp, path, overwrite: true);
    }
}

// ── Usage ─────────────────────────────────────────────────────────────────
record AppSettings(string ApiUrl, int TimeoutSeconds, bool EnableCache);

string settingsPath = Path.Combine(AppContext.BaseDirectory, "settings.json");

// Write
var settings = new AppSettings("https://api.example.com", 30, true);
await JsonFile.WriteAsync(settingsPath, settings);

// Read back
AppSettings? loaded = await JsonFile.ReadAsync<AppSettings>(settingsPath);
Console.WriteLine(loaded?.ApiUrl); // https://api.example.com

// ── Directory scan + deserialize pattern ─────────────────────────────────
async IAsyncEnumerable<Product> LoadProductsAsync(string directory)
{
    foreach (string file in Directory.EnumerateFiles(directory, "*.json"))
    {
        var product = await JsonFile.ReadAsync<Product>(file);
        if (product is not null)
            yield return product;
    }
}

record Product(int Id, string Name, decimal Price);`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Why should you prefer File.ReadAllTextAsync over File.ReadAllText in an ASP.NET Core controller?',
      options: [
        'ReadAllTextAsync returns a more accurate result',
        'ReadAllText is not available in .NET 6+',
        'ReadAllText blocks the thread pool thread while waiting for disk I/O, reducing server throughput under load',
        'ReadAllTextAsync automatically handles file encoding',
      ],
      answer: 2,
      explanation: 'In ASP.NET Core, each concurrent request consumes a thread pool thread while it is active. Synchronous I/O operations like <code>ReadAllText</code> block that thread during disk wait time. With <code>ReadAllTextAsync</code> and <code>await</code>, the thread is returned to the pool while the OS performs the I/O — allowing the server to handle more concurrent requests with the same number of threads.',
    },
    {
      q: 'What does [JsonIgnore] do on a property?',
      options: [
        'Makes the property read-only during deserialization',
        'Excludes the property from both serialization and deserialization entirely',
        'Treats the property as optional — no error if missing in JSON',
        'Converts the property to a JSON null value',
      ],
      answer: 1,
      explanation: '<code>[JsonIgnore]</code> tells <code>System.Text.Json</code> to completely skip the property — it will not appear in serialized output and will not be populated during deserialization. Use it for internal/sensitive fields like password hashes, computed properties that should not round-trip, or circular references.',
    },
    {
      q: 'Which JsonSerializerOptions setting converts C# property names like FirstName to firstName in JSON output?',
      options: [
        'WriteIndented = true',
        'PropertyNameCaseInsensitive = true',
        'PropertyNamingPolicy = JsonNamingPolicy.CamelCase',
        'DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull',
      ],
      answer: 2,
      explanation: '<code>PropertyNamingPolicy = JsonNamingPolicy.CamelCase</code> transforms PascalCase property names to camelCase in the JSON output and is case-insensitive for deserialization when set. <code>PropertyNameCaseInsensitive</code> only controls whether incoming JSON key matching is case-insensitive — it does not change the output format.',
    },
    {
      q: 'Why should you create a single JsonSerializerOptions instance and reuse it rather than creating one per call?',
      options: [
        'JsonSerializerOptions instances are not thread-safe and must be shared',
        'Creating JsonSerializerOptions is expensive — it builds internal caches and reflection metadata that are lost if the instance is discarded',
        'Each new instance generates a different random seed affecting output order',
        'The default constructor throws if called more than once',
      ],
      answer: 1,
      explanation: 'The first time a <code>JsonSerializerOptions</code> instance is used, it builds reflection metadata and internal serialization caches for all involved types. Creating a new instance per serialization call discards that cache and rebuilds it repeatedly, adding significant overhead. Best practice is a static field or a singleton registered in the DI container.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between StreamReader and File.ReadAllText?',
      a: `<code>File.ReadAllText</code> opens the file, reads the entire content into a single <code>string</code>, closes the file, and returns. It is convenient for small files but loads everything into memory at once.<br><br>
<code>StreamReader</code> wraps a <code>FileStream</code> and lets you read incrementally — line by line with <code>ReadLine()</code>, character by character, or in arbitrary chunks. This is memory-efficient for large files (logs, CSV exports, large JSON arrays) where you process data as you read rather than loading all of it first.<br><br>
Both must handle encoding correctly. <code>File.ReadAllText</code> detects the BOM automatically. <code>StreamReader</code> defaults to UTF-8; pass an <code>Encoding</code> argument if the file uses a different encoding.`,
    },
    {
      q: 'How does System.Text.Json differ from Newtonsoft.Json?',
      a: `<strong>System.Text.Json</strong> is Microsoft's built-in serialiser (since .NET Core 3.0). It is faster and allocates less memory, is the default in ASP.NET Core, and is maintained as part of the .NET runtime. It is stricter by default — case-sensitive property matching, no support for some Newtonsoft-specific attributes.<br><br>
<strong>Newtonsoft.Json (Json.NET)</strong> is the mature open-source library. It supports more edge cases: dynamic objects, polymorphic deserialization without source generators, LINQ to JSON, more lenient parsing, and a large ecosystem of converters.<br><br>
For new .NET 6+ projects, start with <code>System.Text.Json</code>. Switch to Newtonsoft only when you need a specific feature it does not support, or when migrating a large codebase that already uses Newtonsoft conventions.`,
    },
    {
      q: 'What is the safe way to write a JSON file so a crash mid-write does not corrupt it?',
      a: `Write to a temporary file first, then atomically rename it over the destination. On most file systems, a same-volume rename is an atomic operation — either the old file exists or the new one does, never a partial write:<br><br>
<code>string tmp = path + ".tmp";</code><br>
<code>await using (var stream = File.Create(tmp))</code><br>
<code>&nbsp;&nbsp;await JsonSerializer.SerializeAsync(stream, value, opts);</code><br>
<code>File.Move(tmp, path, overwrite: true);</code><br><br>
If the process crashes before <code>File.Move</code>, the original file is untouched. The <code>.tmp</code> file is orphaned but harmless. This pattern is essential for any configuration or state file that your application reads on startup.`,
    },
    {
      q: 'When should I use BinaryWriter/BinaryReader instead of JSON?',
      a: `Use binary serialization when you need compact, fixed-width storage or when reading performance is critical:<br><br>
<strong>Use binary when:</strong> storing millions of numeric records (game telemetry, sensor data, financial tick data), interoperating with C libraries or network protocols that define binary formats, or when file size matters significantly.<br><br>
<strong>Stick with JSON when:</strong> the data must be human-readable, you need cross-language compatibility, the schema evolves over time (JSON handles missing/extra fields gracefully), or you are building APIs.<br><br>
For structured binary with schema evolution, consider Protocol Buffers (<code>Google.Protobuf</code>) or MessagePack — they provide the compactness of binary with some of the flexibility of text formats.`,
    },
  ];

  challenge: Challenge = {
    title: 'Async CSV Log Processor',
    description: `Implement a LogProcessor that reads a CSV log file line by line (async), parses each line, filters by severity, and writes matching lines to an output file.

Requirements:
1. Read the input file asynchronously line by line using StreamReader — do NOT read all lines into memory at once
2. Each CSV line has format: timestamp,severity,message (e.g. "2024-01-01T00:00:00,ERROR,Disk full")
3. Accept a minimum severity level: INFO < WARNING < ERROR
4. Write matching lines as JSON objects to the output file using System.Text.Json
5. Return the count of lines written`,
    language: 'csharp',
    hints: [
      'Use StreamReader with ReadLineAsync() in a while loop — check for null to detect end of file',
      'Split each line on \',\' with a limit of 3 parts: line.Split(\',\', 3)',
      'Define an enum for severity levels so comparison is easy',
      'Open the output StreamWriter before the loop; write one JSON line per matching entry inside the loop',
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
    solution: `public enum Severity { INFO, WARNING, ERROR }

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

        using var reader = new StreamReader(inputPath);
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
}
