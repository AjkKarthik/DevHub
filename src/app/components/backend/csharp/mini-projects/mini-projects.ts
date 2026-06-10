import { Component, signal } from '@angular/core';
import { CodeBlockComponent } from '../../../shared/code-block/code-block';

interface ProjectStep {
  title: string;
  description: string;
  code: string;
  language: 'csharp' | 'bash';
}

interface MiniProject {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  time: string;
  tags: string[];
  learn: string[];
  steps: ProjectStep[];
  stretch: string[];
}

@Component({
  selector: 'app-csharp-mini-projects',
  standalone: true,
  imports: [CodeBlockComponent],
  templateUrl: './mini-projects.html',
  styleUrl: './mini-projects.scss',
})
export class CsharpMiniProjects {
  active = signal<string>('tasks');

  projects: MiniProject[] = [
    {
      id: 'tasks',
      title: 'Task Manager CLI',
      description: 'A console todo manager with OOP modelling, LINQ filtering, enum status, and JSON persistence.',
      icon: '✅',
      difficulty: 'Beginner',
      time: '~3–4 hours',
      tags: ['OOP', 'Collections', 'LINQ', 'Enums', 'System.Text.Json'],
      learn: [
        'Modelling domain objects with classes and enums',
        'Storing and querying items with List<T> and LINQ',
        'Reading and writing JSON files with System.Text.Json',
        'Building a simple command loop for a CLI app',
      ],
      steps: [
        {
          title: 'Model the domain',
          language: 'csharp',
          description: 'Define a TaskItem class and a TaskStatus enum. The enum gives type-safe states instead of magic strings.',
          code: `public enum TaskStatus
{
    Todo,
    InProgress,
    Done
}

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public TaskStatus Status { get; set; } = TaskStatus.Todo;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? CompletedAt { get; set; }

    public override string ToString() =>
        $"[{Id}] {Title,-30} {Status}";
}`,
        },
        {
          title: 'TaskRepository with JSON persistence',
          language: 'csharp',
          description: 'Encapsulate storage in a repository class. System.Text.Json serializes the whole list in one call.',
          code: `using System.Text.Json;

public class TaskRepository
{
    private const string FilePath = "tasks.json";
    private static readonly JsonSerializerOptions Options =
        new() { WriteIndented = true };

    public List<TaskItem> Load()
    {
        if (!File.Exists(FilePath)) return new List<TaskItem>();
        var json = File.ReadAllText(FilePath);
        return JsonSerializer.Deserialize<List<TaskItem>>(json)
               ?? new List<TaskItem>();
    }

    public void Save(List<TaskItem> tasks)
    {
        var json = JsonSerializer.Serialize(tasks, Options);
        File.WriteAllText(FilePath, json);
    }
}`,
        },
        {
          title: 'TaskService — add, complete, delete',
          language: 'csharp',
          description: 'Business logic lives in a service. Ids are assigned by finding the current max with LINQ.',
          code: `public class TaskService
{
    private readonly TaskRepository _repo = new();
    private readonly List<TaskItem> _tasks;

    public TaskService() => _tasks = _repo.Load();

    public TaskItem Add(string title)
    {
        var task = new TaskItem
        {
            Id = _tasks.Count == 0 ? 1 : _tasks.Max(t => t.Id) + 1,
            Title = title
        };
        _tasks.Add(task);
        _repo.Save(_tasks);
        return task;
    }

    public bool Complete(int id)
    {
        var task = _tasks.FirstOrDefault(t => t.Id == id);
        if (task is null) return false;
        task.Status = TaskStatus.Done;
        task.CompletedAt = DateTime.Now;
        _repo.Save(_tasks);
        return true;
    }

    public bool Delete(int id)
    {
        var removed = _tasks.RemoveAll(t => t.Id == id) > 0;
        if (removed) _repo.Save(_tasks);
        return removed;
    }

    public IEnumerable<TaskItem> All() => _tasks;
}`,
        },
        {
          title: 'LINQ filtering and sorting',
          language: 'csharp',
          description: 'Expose query methods that filter by status and sort — pure LINQ, no manual loops.',
          code: `public IEnumerable<TaskItem> ByStatus(TaskStatus status) =>
    _tasks.Where(t => t.Status == status)
          .OrderBy(t => t.CreatedAt);

public IEnumerable<TaskItem> Search(string term) =>
    _tasks.Where(t => t.Title.Contains(term,
                      StringComparison.OrdinalIgnoreCase));

public IEnumerable<TaskItem> Pending() =>
    _tasks.Where(t => t.Status != TaskStatus.Done)
          .OrderByDescending(t => t.CreatedAt);

// Summary counts grouped by status
public string Summary() =>
    string.Join(" | ",
        _tasks.GroupBy(t => t.Status)
              .Select(g => $"{g.Key}: {g.Count()}"));`,
        },
        {
          title: 'Command loop in Program.cs',
          language: 'csharp',
          description: 'Tie it together with a top-level command loop. A switch expression routes commands.',
          code: `var service = new TaskService();
Console.WriteLine("Task Manager — commands: add, list, done, del, find, quit");

while (true)
{
    Console.Write("> ");
    var input = Console.ReadLine()?.Trim() ?? "";
    var parts = input.Split(' ', 2);
    var (cmd, arg) = (parts[0].ToLower(),
                      parts.Length > 1 ? parts[1] : "");

    switch (cmd)
    {
        case "add":
            Console.WriteLine($"Added: {service.Add(arg)}");
            break;
        case "list":
            foreach (var t in service.All())
                Console.WriteLine(t);
            Console.WriteLine(service.Summary());
            break;
        case "done" when int.TryParse(arg, out var id):
            Console.WriteLine(service.Complete(id)
                ? "Completed." : "Not found.");
            break;
        case "del" when int.TryParse(arg, out var id):
            Console.WriteLine(service.Delete(id)
                ? "Deleted." : "Not found.");
            break;
        case "find":
            foreach (var t in service.Search(arg))
                Console.WriteLine(t);
            break;
        case "quit":
            return;
        default:
            Console.WriteLine("Unknown command.");
            break;
    }
}`,
        },
      ],
      stretch: [
        'Add due dates and a "list overdue" command',
        'Add priorities (enum) and sort pending tasks by priority',
        'Support editing a task title with an "edit <id> <title>" command',
        'Write unit tests for TaskService with an in-memory repository',
      ],
    },
    {
      id: 'expenses',
      title: 'Expense Tracker',
      description: 'Track expenses with records, categorize them with pattern matching, and build LINQ GroupBy reports.',
      icon: '💰',
      difficulty: 'Intermediate',
      time: '~4–5 hours',
      tags: ['Records', 'Pattern Matching', 'File I/O', 'LINQ GroupBy'],
      learn: [
        'Using immutable records for data that never mutates',
        'switch expressions and property patterns for categorisation',
        'Reading/writing CSV-style data with file I/O',
        'Aggregation reports with GroupBy, Sum, and ordering',
      ],
      steps: [
        {
          title: 'Define the Expense record',
          language: 'csharp',
          description: 'A positional record gives value equality, immutability, and a free ToString — perfect for a ledger entry.',
          code: `public enum Category
{
    Food, Transport, Housing, Entertainment, Health, Other
}

public record Expense(
    DateOnly Date,
    string Description,
    decimal Amount,
    Category Category)
{
    // "with" expressions let you create modified copies
    public Expense Discounted(decimal pct) =>
        this with { Amount = Amount * (1 - pct) };
}`,
        },
        {
          title: 'Auto-categorize with pattern matching',
          language: 'csharp',
          description: 'A switch expression on the description guesses the category. Property/relational patterns refine by amount.',
          code: `public static class Categorizer
{
    public static Category Guess(string description, decimal amount) =>
        description.ToLower() switch
        {
            var d when d.Contains("uber") || d.Contains("bus")
                || d.Contains("fuel")      => Category.Transport,
            var d when d.Contains("rent") || d.Contains("electric")
                                           => Category.Housing,
            var d when d.Contains("grocery") || d.Contains("restaurant")
                || d.Contains("coffee")    => Category.Food,
            var d when d.Contains("movie") || d.Contains("game")
                                           => Category.Entertainment,
            var d when d.Contains("pharmacy") || d.Contains("doctor")
                                           => Category.Health,
            _ => amount switch
            {
                > 500m => Category.Housing,   // big bills default to housing
                _      => Category.Other
            }
        };
}`,
        },
        {
          title: 'CSV persistence with file I/O',
          language: 'csharp',
          description: 'Store the ledger as plain CSV lines. Parsing splits each line and converts the fields.',
          code: `public class ExpenseStore
{
    private const string Path = "expenses.csv";

    public void Append(Expense e) =>
        File.AppendAllText(Path,
            $"{e.Date:yyyy-MM-dd},{e.Description},{e.Amount},{e.Category}\\n");

    public List<Expense> LoadAll()
    {
        if (!File.Exists(Path)) return new();
        return File.ReadAllLines(Path)
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .Select(line =>
            {
                var p = line.Split(',');
                return new Expense(
                    DateOnly.Parse(p[0]),
                    p[1],
                    decimal.Parse(p[2]),
                    Enum.Parse<Category>(p[3]));
            })
            .ToList();
    }
}`,
        },
        {
          title: 'Reports with LINQ GroupBy',
          language: 'csharp',
          description: 'Aggregate by category and by month. GroupBy + Sum + OrderByDescending does the heavy lifting.',
          code: `public static class Reports
{
    public static void ByCategory(List<Expense> expenses)
    {
        var total = expenses.Sum(e => e.Amount);
        var rows = expenses
            .GroupBy(e => e.Category)
            .Select(g => new
            {
                Cat = g.Key,
                Total = g.Sum(e => e.Amount),
                Count = g.Count()
            })
            .OrderByDescending(r => r.Total);

        foreach (var r in rows)
            Console.WriteLine(
                $"{r.Cat,-15} {r.Total,10:C}  ({r.Count} items, " +
                $"{r.Total / total:P0} of spend)");
    }

    public static void ByMonth(List<Expense> expenses)
    {
        var rows = expenses
            .GroupBy(e => new { e.Date.Year, e.Date.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new
            {
                Label = $"{g.Key.Year}-{g.Key.Month:D2}",
                Total = g.Sum(e => e.Amount)
            });

        foreach (var r in rows)
            Console.WriteLine($"{r.Label}  {r.Total,10:C}");
    }
}`,
        },
        {
          title: 'Wire up the CLI',
          language: 'csharp',
          description: 'A compact loop: "add <amount> <description>" auto-categorizes; "report" and "monthly" print summaries.',
          code: `var store = new ExpenseStore();
Console.WriteLine("Expense Tracker — add <amount> <desc> | report | monthly | quit");

while (true)
{
    Console.Write("> ");
    var input = Console.ReadLine()?.Trim() ?? "";
    if (input == "quit") break;

    if (input.StartsWith("add "))
    {
        var parts = input[4..].Split(' ', 2);
        if (parts.Length < 2 ||
            !decimal.TryParse(parts[0], out var amount))
        {
            Console.WriteLine("Usage: add 12.50 coffee at cafe");
            continue;
        }
        var desc = parts[1];
        var cat = Categorizer.Guess(desc, amount);
        var expense = new Expense(
            DateOnly.FromDateTime(DateTime.Now), desc, amount, cat);
        store.Append(expense);
        Console.WriteLine($"Saved under {cat}: {expense}");
    }
    else if (input == "report")  Reports.ByCategory(store.LoadAll());
    else if (input == "monthly") Reports.ByMonth(store.LoadAll());
    else Console.WriteLine("Unknown command.");
}`,
        },
      ],
      stretch: [
        'Add a budget per category and warn when a new expense exceeds it',
        'Export a monthly report to a formatted text file',
        'Switch persistence from CSV to JSON and compare the code',
        'Add a "top 5 expenses" report using OrderByDescending + Take',
      ],
    },
    {
      id: 'weather',
      title: 'Weather API Client',
      description: 'Call a real REST API with HttpClient, async/await, JSON deserialization, robust error handling, and cancellation.',
      icon: '🌤',
      difficulty: 'Intermediate',
      time: '~4–5 hours',
      tags: ['HttpClient', 'async/await', 'JSON', 'CancellationToken', 'Error Handling'],
      learn: [
        'Making async HTTP calls with a shared HttpClient',
        'Deserializing JSON responses into typed records',
        'Handling timeouts, HTTP errors, and bad JSON gracefully',
        'Cancelling in-flight requests with CancellationToken',
      ],
      steps: [
        {
          title: 'Response models as records',
          language: 'csharp',
          description: 'Model only the JSON fields you need. JsonPropertyName maps snake_case API fields to C# names. (Open-Meteo is free, no API key.)',
          code: `using System.Text.Json.Serialization;

public record WeatherResponse(
    [property: JsonPropertyName("latitude")]  double Latitude,
    [property: JsonPropertyName("longitude")] double Longitude,
    [property: JsonPropertyName("current_weather")]
    CurrentWeather Current);

public record CurrentWeather(
    [property: JsonPropertyName("temperature")]   double Temperature,
    [property: JsonPropertyName("windspeed")]     double WindSpeed,
    [property: JsonPropertyName("weathercode")]   int WeatherCode,
    [property: JsonPropertyName("time")]          string Time);`,
        },
        {
          title: 'WeatherClient with HttpClient',
          language: 'csharp',
          description: 'One static HttpClient for the app. GetFromJsonAsync fetches and deserializes in a single call.',
          code: `using System.Net.Http.Json;

public class WeatherClient
{
    private static readonly HttpClient Http = new()
    {
        BaseAddress = new Uri("https://api.open-meteo.com"),
        Timeout = TimeSpan.FromSeconds(10)
    };

    public async Task<WeatherResponse?> GetCurrentAsync(
        double lat, double lon, CancellationToken ct = default)
    {
        var url = $"/v1/forecast?latitude={lat}&longitude={lon}" +
                  "&current_weather=true";
        return await Http.GetFromJsonAsync<WeatherResponse>(url, ct);
    }
}`,
        },
        {
          title: 'Error handling layers',
          language: 'csharp',
          description: 'Wrap the call: each exception type means something different. Return a result object instead of throwing to the UI.',
          code: `public record WeatherResult(
    WeatherResponse? Data, string? Error)
{
    public bool Success => Data is not null;
}

public async Task<WeatherResult> GetSafeAsync(
    double lat, double lon, CancellationToken ct = default)
{
    try
    {
        var data = await GetCurrentAsync(lat, lon, ct);
        return data is null
            ? new WeatherResult(null, "Empty response from API.")
            : new WeatherResult(data, null);
    }
    catch (OperationCanceledException) when (ct.IsCancellationRequested)
    {
        return new WeatherResult(null, "Request was cancelled.");
    }
    catch (TaskCanceledException)
    {
        return new WeatherResult(null, "Request timed out (10s).");
    }
    catch (HttpRequestException ex)
    {
        return new WeatherResult(null,
            $"Network/HTTP error: {ex.StatusCode?.ToString() ?? ex.Message}");
    }
    catch (System.Text.Json.JsonException)
    {
        return new WeatherResult(null, "API returned unexpected JSON.");
    }
}`,
        },
        {
          title: 'Cancellation with CancellationToken',
          language: 'csharp',
          description: 'Let the user press Esc to abort a slow request. CancellationTokenSource links the keypress to the HTTP call.',
          code: `public static async Task<WeatherResult> FetchWithEscAsync(
    WeatherClient client, double lat, double lon)
{
    using var cts = new CancellationTokenSource();

    // Watch for Esc on a background task
    var keyWatcher = Task.Run(() =>
    {
        while (!cts.IsCancellationRequested)
        {
            if (Console.KeyAvailable &&
                Console.ReadKey(true).Key == ConsoleKey.Escape)
            {
                cts.Cancel();
                return;
            }
            Thread.Sleep(50);
        }
    });

    Console.WriteLine("Fetching… (press Esc to cancel)");
    var result = await client.GetSafeAsync(lat, lon, cts.Token);
    cts.Cancel();          // stop the key watcher
    await keyWatcher;
    return result;
}`,
        },
        {
          title: 'Main program with city lookup',
          language: 'csharp',
          description: 'A small dictionary of cities and a loop that prints temperature, wind, and a friendly description from the weather code.',
          code: `var cities = new Dictionary<string, (double Lat, double Lon)>(
    StringComparer.OrdinalIgnoreCase)
{
    ["london"]    = (51.51, -0.13),
    ["new york"]  = (40.71, -74.01),
    ["tokyo"]     = (35.68, 139.69),
    ["chennai"]   = (13.08, 80.27),
    ["sydney"]    = (-33.87, 151.21),
};

static string Describe(int code) => code switch
{
    0           => "Clear sky",
    1 or 2 or 3 => "Partly cloudy",
    45 or 48    => "Foggy",
    >= 51 and <= 67 => "Rainy",
    >= 71 and <= 77 => "Snowy",
    >= 95       => "Thunderstorm",
    _           => "Unknown"
};

var client = new WeatherClient();
Console.WriteLine($"Cities: {string.Join(", ", cities.Keys)}");

while (true)
{
    Console.Write("city> ");
    var name = Console.ReadLine()?.Trim() ?? "";
    if (name == "quit") break;
    if (!cities.TryGetValue(name, out var coords))
    {
        Console.WriteLine("Unknown city.");
        continue;
    }

    var result = await client.GetSafeAsync(coords.Lat, coords.Lon);
    if (!result.Success)
    {
        Console.WriteLine($"⚠ {result.Error}");
        continue;
    }

    var w = result.Data!.Current;
    Console.WriteLine(
        $"{name}: {w.Temperature}°C, wind {w.WindSpeed} km/h — " +
        Describe(w.WeatherCode));
}`,
        },
      ],
      stretch: [
        'Add a geocoding call so users can type any city name',
        'Cache responses for 10 minutes in a Dictionary to avoid repeat calls',
        'Fetch a 7-day forecast and render a simple ASCII chart',
        'Add Polly-style retry: retry transient failures up to 3 times with backoff',
      ],
    },
    {
      id: 'parallel',
      title: 'Parallel File Processor',
      description: 'Process many files concurrently with Task.WhenAll, throttle with SemaphoreSlim, report progress with IProgress, and optionally stream with Channels.',
      icon: '⚡',
      difficulty: 'Advanced',
      time: '~5–6 hours',
      tags: ['Task.WhenAll', 'SemaphoreSlim', 'IProgress', 'Channels'],
      learn: [
        'Fanning out async work and awaiting it all with Task.WhenAll',
        'Limiting concurrency with SemaphoreSlim throttling',
        'Reporting progress from background work via IProgress<T>',
        'Producer/consumer pipelines with System.Threading.Channels',
      ],
      steps: [
        {
          title: 'The work item — count words in a file',
          language: 'csharp',
          description: 'A single async unit of work: read a file, count its words, return a result record.',
          code: `public record FileStats(string Path, int Words, long Bytes, TimeSpan Took);

public static class FileAnalyzer
{
    public static async Task<FileStats> AnalyzeAsync(
        string path, CancellationToken ct = default)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var text = await File.ReadAllTextAsync(path, ct);
        var words = text.Split(
            new[] { ' ', '\\n', '\\r', '\\t' },
            StringSplitOptions.RemoveEmptyEntries).Length;
        var bytes = new FileInfo(path).Length;
        return new FileStats(path, words, bytes, sw.Elapsed);
    }
}`,
        },
        {
          title: 'Naive fan-out with Task.WhenAll',
          language: 'csharp',
          description: 'Start every file at once and await them together. Fast, but unbounded — 10,000 files means 10,000 concurrent reads.',
          code: `public static async Task<FileStats[]> ProcessAllAsync(
    IEnumerable<string> paths)
{
    // Kick off ALL tasks immediately
    var tasks = paths
        .Select(p => FileAnalyzer.AnalyzeAsync(p))
        .ToList();

    // Await them as one unit — throws AggregateException
    // semantics: first faulted task's exception surfaces
    return await Task.WhenAll(tasks);
}

// Usage
var files = Directory.GetFiles("./docs", "*.txt",
    SearchOption.AllDirectories);
var results = await ProcessAllAsync(files);
Console.WriteLine($"Total words: {results.Sum(r => r.Words):N0}");`,
        },
        {
          title: 'Throttle with SemaphoreSlim',
          language: 'csharp',
          description: 'Wrap each task in WaitAsync/Release so only N run at a time. The try/finally guarantees release even on failure.',
          code: `public static async Task<FileStats[]> ProcessThrottledAsync(
    IEnumerable<string> paths,
    int maxConcurrency = 4,
    CancellationToken ct = default)
{
    using var gate = new SemaphoreSlim(maxConcurrency);

    var tasks = paths.Select(async path =>
    {
        await gate.WaitAsync(ct);       // acquire a slot
        try
        {
            return await FileAnalyzer.AnalyzeAsync(path, ct);
        }
        finally
        {
            gate.Release();              // always free the slot
        }
    });

    return await Task.WhenAll(tasks);
}`,
        },
        {
          title: 'Progress reporting with IProgress<T>',
          language: 'csharp',
          description: 'Progress<T> captures the creating context and marshals callbacks there — the standard pattern for UI/console progress.',
          code: `public record ProgressInfo(int Done, int Total, string Current);

public static async Task<FileStats[]> ProcessWithProgressAsync(
    IReadOnlyList<string> paths,
    IProgress<ProgressInfo> progress,
    int maxConcurrency = 4,
    CancellationToken ct = default)
{
    using var gate = new SemaphoreSlim(maxConcurrency);
    var done = 0;

    var tasks = paths.Select(async path =>
    {
        await gate.WaitAsync(ct);
        try
        {
            var stats = await FileAnalyzer.AnalyzeAsync(path, ct);
            var count = Interlocked.Increment(ref done);
            progress.Report(new ProgressInfo(count, paths.Count, path));
            return stats;
        }
        finally { gate.Release(); }
    });

    return await Task.WhenAll(tasks);
}

// Usage — render a console progress bar
var progress = new Progress<ProgressInfo>(p =>
{
    var pct = p.Done * 100 / p.Total;
    Console.Write($"\\r[{new string('#', pct / 5),-20}] " +
                  $"{p.Done}/{p.Total} {Path.GetFileName(p.Current)}   ");
});
var results = await ProcessWithProgressAsync(files, progress);
Console.WriteLine();`,
        },
        {
          title: 'Optional: producer/consumer with Channels',
          language: 'csharp',
          description: 'A bounded Channel decouples discovery from processing — files stream through as they are found, with natural backpressure.',
          code: `using System.Threading.Channels;

public static async Task<List<FileStats>> ProcessWithChannelAsync(
    string root, int workers = 4, CancellationToken ct = default)
{
    var channel = Channel.CreateBounded<string>(
        new BoundedChannelOptions(100)
        { FullMode = BoundedChannelFullMode.Wait });

    // Producer: enumerate files lazily into the channel
    var producer = Task.Run(async () =>
    {
        foreach (var path in Directory.EnumerateFiles(
                     root, "*.txt", SearchOption.AllDirectories))
        {
            await channel.Writer.WriteAsync(path, ct);
        }
        channel.Writer.Complete();
    }, ct);

    // Consumers: N workers drain the channel
    var results = new System.Collections.Concurrent
        .ConcurrentBag<FileStats>();

    var consumers = Enumerable.Range(0, workers).Select(_ =>
        Task.Run(async () =>
        {
            await foreach (var path in
                channel.Reader.ReadAllAsync(ct))
            {
                results.Add(await FileAnalyzer.AnalyzeAsync(path, ct));
            }
        }, ct));

    await Task.WhenAll(consumers.Append(producer));
    return results.ToList();
}`,
        },
        {
          title: 'Final report',
          language: 'csharp',
          description: 'Summarize with LINQ: totals, slowest files, and biggest files — proof every pipeline produced the same data.',
          code: `static void PrintReport(IReadOnlyCollection<FileStats> results)
{
    Console.WriteLine($"Files processed : {results.Count:N0}");
    Console.WriteLine($"Total words     : {results.Sum(r => r.Words):N0}");
    Console.WriteLine($"Total size      : {results.Sum(r => r.Bytes) / 1024.0:N1} KB");

    Console.WriteLine("\\nSlowest 3:");
    foreach (var r in results.OrderByDescending(x => x.Took).Take(3))
        Console.WriteLine($"  {Path.GetFileName(r.Path),-30} {r.Took.TotalMilliseconds,8:N0} ms");

    Console.WriteLine("\\nLargest 3:");
    foreach (var r in results.OrderByDescending(x => x.Bytes).Take(3))
        Console.WriteLine($"  {Path.GetFileName(r.Path),-30} {r.Bytes,10:N0} bytes");
}`,
        },
      ],
      stretch: [
        'Compare wall-clock time: sequential vs WhenAll vs throttled vs Channels',
        'Add cancellation: press Esc to stop mid-run and report partial results',
        'Replace word counting with SHA-256 hashing to find duplicate files',
        'Use Parallel.ForEachAsync (.NET 6+) and compare with your SemaphoreSlim version',
      ],
    },
  ];

  get activeProject() {
    return this.projects.find(p => p.id === this.active()) ?? this.projects[0];
  }
}
