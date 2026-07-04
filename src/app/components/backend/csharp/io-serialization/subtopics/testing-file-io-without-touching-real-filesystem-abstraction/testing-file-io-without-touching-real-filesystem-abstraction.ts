import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-file-io-without-touching-real-filesystem-abstraction-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-file-io-without-touching-real-filesystem-abstraction.html',
  styleUrl: './testing-file-io-without-touching-real-filesystem-abstraction.scss',
})
export class TestingFileIoWithoutTouchingRealFilesystemAbstractionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own LogProcessor challenge is never tested — testing it directly reveals a real design problem',
      points: [
        'The main I/O & Serialization page\'s <code>LogProcessor.ProcessAsync</code> challenge takes literal file PATHS as parameters and opens <code>StreamReader</code>/<code>StreamWriter</code> directly inside the method. Testing this AS WRITTEN means every test must create real temp files on disk, run the method, then read the real output file back — slow, flaky (leftover files, path collisions between parallel test runs), and it exercises the real OS file system on every single test run.',
      ],
    },
    {
      heading: 'The fix is to depend on an abstraction over the file system, not File/StreamReader/StreamWriter directly',
      points: [
        'Introducing a small seam — an interface like <code>IFileSystem</code> with methods such as <code>OpenRead(path)</code> / <code>OpenWrite(path)</code> returning <code>Stream</code> — lets production code use a REAL implementation backed by <code>System.IO.File</code>, while tests use an in-memory fake backed by <code>MemoryStream</code>. The business logic (parsing, filtering, serializing) never changes; only WHERE the bytes come from and go to changes.',
        'This is exactly the same "depend on an abstraction, not a concrete implementation" principle used elsewhere in the codebase for databases and HTTP clients — file I/O is just as testable once it goes through an interface instead of being called directly against <code>System.IO</code> types.',
      ],
    },
    {
      heading: 'A widely-used production library exists for this instead of hand-rolling the interface: System.IO.Abstractions',
      points: [
        'The <code>System.IO.Abstractions</code> NuGet package provides <code>IFileSystem</code>, <code>IFile</code>, <code>IDirectory</code>, etc., mirroring the real <code>System.IO</code> API almost 1:1 — production code injects <code>IFileSystem</code> (backed by the real <code>FileSystem</code> class) via DI, and tests inject <code>MockFileSystem</code> from the companion <code>System.IO.Abstractions.TestingHelpers</code> package, which simulates an entire in-memory directory tree without touching disk at all.',
        'This is the standard, well-known answer to "how do I unit test file I/O code" in the .NET ecosystem — reaching for a real temp-file-based integration test is reserved for a SMALL number of true end-to-end tests, not the default for every unit test covering file-handling logic.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The untestable version — paths and File/StreamReader baked directly into the method',
      language: 'csharp',
      code: `// The main page's own challenge, as originally written:
public class LogProcessor
{
    public async Task<int> ProcessAsync(string inputPath, string outputPath,
        Severity minSeverity, CancellationToken ct = default)
    {
        int count = 0;
        using var reader = new StreamReader(inputPath);       // real disk I/O
        await using var writer = new StreamWriter(outputPath); // real disk I/O
        // ... parsing/filtering logic ...
        return count;
    }
}

// Testing this directly means EVERY test must:
//  1. Write a real temp input file to disk
//  2. Run ProcessAsync against real paths
//  3. Read the real output file back to assert on it
//  4. Clean up both temp files afterward (or leak them on a failed test)`,
    },
    {
      label: 'Introducing an IFileSystem seam — production code barely changes',
      language: 'csharp',
      code: `public interface IFileSystem
{
    Stream OpenRead(string path);
    Stream OpenWrite(string path);
}

public class RealFileSystem : IFileSystem
{
    public Stream OpenRead(string path) => File.OpenRead(path);
    public Stream OpenWrite(string path) => File.Create(path);
}

public class LogProcessor
{
    private readonly IFileSystem _fs;
    public LogProcessor(IFileSystem fs) => _fs = fs; // injected — real or fake

    public async Task<int> ProcessAsync(string inputPath, string outputPath,
        Severity minSeverity, CancellationToken ct = default)
    {
        int count = 0;
        using var reader = new StreamReader(_fs.OpenRead(inputPath));
        await using var writer = new StreamWriter(_fs.OpenWrite(outputPath));
        // ... SAME parsing/filtering logic as before, unchanged ...
        return count;
    }
}`,
    },
    {
      label: 'Testing against an in-memory fake — no disk touched at all',
      language: 'csharp',
      code: `using Xunit;

public class FakeFileSystem : IFileSystem
{
    private readonly Dictionary<string, MemoryStream> _files = new();

    public void Seed(string path, string content) =>
        _files[path] = new MemoryStream(Encoding.UTF8.GetBytes(content));

    public Stream OpenRead(string path) => _files[path];

    public Stream OpenWrite(string path)
    {
        var ms = new MemoryStream();
        _files[path] = ms;
        return ms;
    }

    public string ReadWrittenContent(string path) =>
        Encoding.UTF8.GetString(_files[path].ToArray());
}

public class LogProcessorTests
{
    [Fact]
    public async Task ProcessAsync_FiltersLowSeverityEntries()
    {
        var fs = new FakeFileSystem();
        fs.Seed("in.csv",
            "2024-01-01T00:00:00,INFO,starting up\\n" +
            "2024-01-01T00:00:01,ERROR,disk full\\n");

        var processor = new LogProcessor(fs);
        int count = await processor.ProcessAsync("in.csv", "out.json", Severity.ERROR);

        Assert.Equal(1, count); // only the ERROR line matched — no real
                                 // files were created or cleaned up anywhere
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A method <code>bool ConfigExists(string path) => File.Exists(path);</code> is called from business logic you want to unit test without touching disk. Sketch the IFileSystem-based fix.',
    hint: 'Add an Exists(string path) method to the IFileSystem interface, implement it in RealFileSystem via File.Exists, and have the fake track a set of "existing" paths that tests can seed directly.',
    solution: `public interface IFileSystem
{
    Stream OpenRead(string path);
    Stream OpenWrite(string path);
    bool Exists(string path);
}

public class RealFileSystem : IFileSystem
{
    public Stream OpenRead(string path) => File.OpenRead(path);
    public Stream OpenWrite(string path) => File.Create(path);
    public bool Exists(string path) => File.Exists(path);
}

public class FakeFileSystem : IFileSystem
{
    private readonly HashSet<string> _existingPaths = new();
    public void SeedExists(string path) => _existingPaths.Add(path);
    public bool Exists(string path) => _existingPaths.Contains(path);
    // OpenRead/OpenWrite as before ...
}

// Business logic — unchanged except for the injected dependency:
public class ConfigChecker
{
    private readonly IFileSystem _fs;
    public ConfigChecker(IFileSystem fs) => _fs = fs;
    public bool ConfigExists(string path) => _fs.Exists(path);
}

// Test — no real file ever created:
[Fact]
public void ConfigExists_ReturnsTrue_WhenSeeded()
{
    var fs = new FakeFileSystem();
    fs.SeedExists("settings.json");
    var checker = new ConfigChecker(fs);
    Assert.True(checker.ConfigExists("settings.json"));
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing file-handling code always requires creating real temporary files and cleaning them up afterward.',
      reality: 'introducing a small IFileSystem abstraction (or using the System.IO.Abstractions NuGet package) lets tests run entirely in memory, with no real files created, no cleanup needed, and no risk of path collisions between parallel test runs.',
    },
    {
      thought: 'abstracting file access behind an interface is over-engineering for something as simple as reading/writing a file.',
      reality: 'the same "depend on an abstraction" principle already applied to databases and HTTP clients applies just as directly to file I/O — the payoff is fast, reliable, disk-free unit tests instead of slow, flaky, temp-file-based ones.',
    },
    {
      thought: 'you have to hand-roll a custom IFileSystem interface and fake implementation from scratch for every project.',
      reality: 'the System.IO.Abstractions NuGet package already provides a full IFileSystem abstraction mirroring System.IO almost 1:1, plus a companion MockFileSystem for tests — this is the standard, widely-used answer in the .NET ecosystem rather than something to reinvent.',
    },
  ];
}
