import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-environment-branching-without-real-env-var-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-environment-branching-without-real-environment-variable.html',
  styleUrl: './testing-environment-branching-without-real-environment-variable.scss',
})
export class TestingEnvironmentBranchingWithoutRealEnvironmentVariableSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own gotcha — ASPNETCORE_ENVIRONMENT must be a real OS env var — is exactly why testing environment-branching logic directly in Program.cs is awkward',
      points: [
        'The main Hosting &amp; Startup page correctly warns that <code>ASPNETCORE_ENVIRONMENT</code> "must be an actual operating system environment variable" — the host reads it before loading any config. This is great production guidance, but it raises a real testing question: if you want to verify your <code>if (app.Environment.IsDevelopment()) { ... }</code> branches actually register the RIGHT services/middleware for each environment, you do NOT want a unit test that has to set a real process environment variable and restart a host to check.',
      ],
    },
    {
      heading: 'The fix: extract environment-dependent decisions into a plain method taking IHostEnvironment (or IWebHostEnvironment) as a parameter — testable with a fake implementation, no environment variable involved at all',
      points: [
        '<code>IHostEnvironment</code> (and its ASP.NET Core-specific subtype <code>IWebHostEnvironment</code>) is an ordinary interface with an <code>EnvironmentName</code> string property — <code>IsDevelopment()</code>/<code>IsProduction()</code>/<code>IsStaging()</code> are just extension methods comparing that string against the standard constants. This means a TEST can construct a minimal fake object implementing <code>IHostEnvironment</code> with whatever <code>EnvironmentName</code> it wants, and pass it directly to your OWN extracted method — no real environment variable, no host construction, no <code>WebApplicationFactory</code> needed at all.',
        'The main page\'s own <code>builder.Services.AddDbContext&lt;AppDbContext&gt;(...)</code> environment branching example is exactly the kind of decision worth extracting: instead of inline <code>if</code> statements directly in <code>Program.cs</code>\'s top-level code (which is genuinely hard to unit test, since it is not a class or method you can call from a test), move the DECISION LOGIC into a small, named, testable method that Program.cs simply calls.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s environment branching, inline in Program.cs — untestable as written',
      language: 'csharp',
      code: `// Directly from the main page's own example — this WORKS, but as
// top-level Program.cs statements, there is no method here a unit
// test could call directly to verify the branching decision:
var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddDbContext<AppDbContext>(o =>
        o.UseInMemoryDatabase("DevDb"));
}
else
{
    builder.Services.AddDbContext<AppDbContext>(o =>
        o.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
}

// A test wanting to verify "Development gets InMemory, everything
// else gets SqlServer" would need to actually SET ASPNETCORE_ENVIRONMENT,
// build a REAL WebApplicationBuilder, and inspect the registered
// services — slow, heavyweight, and exactly the kind of test that
// should not be needed for what is really just a branching DECISION.`,
    },
    {
      label: 'Extracted into a testable method taking IHostEnvironment as a parameter',
      language: 'csharp',
      code: `// A small, named, TESTABLE method — the decision logic lives here,
// completely independent of any real environment variable or host:
public static class DatabaseRegistration
{
    public static void AddAppDatabase(
        IServiceCollection services,
        IHostEnvironment environment,
        IConfiguration configuration)
    {
        if (environment.IsDevelopment())
        {
            services.AddDbContext<AppDbContext>(o =>
                o.UseInMemoryDatabase("DevDb"));
        }
        else
        {
            services.AddDbContext<AppDbContext>(o =>
                o.UseSqlServer(configuration.GetConnectionString("Default")));
        }
    }
}

// Program.cs now just CALLS the testable method:
var builder = WebApplication.CreateBuilder(args);
DatabaseRegistration.AddAppDatabase(builder.Services, builder.Environment, builder.Configuration);`,
    },
    {
      label: 'The actual test — a fake IHostEnvironment, no real environment variable at all',
      language: 'csharp',
      code: `using Xunit;

// A minimal fake — implements ONLY what IHostEnvironment requires,
// with EnvironmentName set to whatever the test wants:
public class FakeHostEnvironment : IHostEnvironment
{
    public string EnvironmentName { get; set; } = "Production";
    public string ApplicationName { get; set; } = "TestApp";
    public string ContentRootPath { get; set; } = "";
    public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = null!;
}

public class DatabaseRegistrationTests
{
    [Fact]
    public void AddAppDatabase_InDevelopment_RegistersInMemoryProvider()
    {
        var services = new ServiceCollection();
        var env = new FakeHostEnvironment { EnvironmentName = Environments.Development };
        var config = new ConfigurationBuilder().Build();

        DatabaseRegistration.AddAppDatabase(services, env, config);

        // Build a temporary provider JUST to inspect what got registered —
        // no real environment variable, no WebApplicationFactory, no
        // actual database connection anywhere in this test:
        using var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<DbContextOptions<AppDbContext>>();

        Assert.Contains(options.Extensions, e => e.GetType().Name.Contains("InMemory"));
    }

    [Fact]
    public void AddAppDatabase_InProduction_RegistersSqlServerProvider()
    {
        var services = new ServiceCollection();
        var env = new FakeHostEnvironment { EnvironmentName = Environments.Production };
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = "Server=fake;Database=fake;",
            })
            .Build();

        DatabaseRegistration.AddAppDatabase(services, env, config);

        using var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<DbContextOptions<AppDbContext>>();

        Assert.Contains(options.Extensions, e => e.GetType().Name.Contains("SqlServer"));
    }
}
// Both tests run in milliseconds — no real host, no real environment
// variable, no real database connection.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues the <code>FakeHostEnvironment</code> approach is unnecessary — they propose instead setting <code>Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development")</code> at the START of each test method, then calling <code>WebApplication.CreateBuilder()</code> for real. Explain a concrete way this approach can produce flaky or order-dependent test results that the FakeHostEnvironment approach cannot.',
    hint: 'Consider that Environment.SetEnvironmentVariable mutates PROCESS-WIDE state — and that most test frameworks (including xUnit by default) can run multiple test methods within the SAME test process, potentially concurrently or in an unpredictable order.',
    solution: `[Fact]
public void Test_A_SetsDevelopmentEnvironment()
{
    Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");
    var builder = WebApplication.CreateBuilder();
    // ... assertions expecting Development behavior ...
}

[Fact]
public void Test_B_SetsProductionEnvironment()
{
    Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Production");
    var builder = WebApplication.CreateBuilder();
    // ... assertions expecting Production behavior ...
}

// THE CONCRETE FLAKINESS RISK: Environment.SetEnvironmentVariable
// mutates PROCESS-WIDE state — it is not scoped to the individual test
// method, the test CLASS, or even a single thread. xUnit, BY DEFAULT,
// can run multiple [Fact] test methods from the SAME test class (and
// across DIFFERENT test classes within the same collection) IN
// PARALLEL, on different threads, within the SAME test process.
//
// If Test_A and Test_B happen to run concurrently:
//   Thread 1 (Test_A): sets ASPNETCORE_ENVIRONMENT = "Development"
//   Thread 2 (Test_B): sets ASPNETCORE_ENVIRONMENT = "Production"
//     (RACE: whichever thread's SetEnvironmentVariable call happens
//      LAST wins for BOTH threads, since it is the SAME process-wide
//      variable)
//   Thread 1: calls WebApplication.CreateBuilder() — may now read
//      "Production" instead of the "Development" it JUST set,
//      depending on exact timing
//
// This produces INTERMITTENT, TIMING-DEPENDENT test failures that are
// notoriously hard to reproduce and debug — the test might pass 99
// times out of 100 depending on scheduling, then fail once with no
// obvious code change to blame.
//
// THE FakeHostEnvironment APPROACH HAS NO SUCH RISK: each test creates
// its OWN LOCAL FakeHostEnvironment instance with its OWN
// EnvironmentName value — there is no shared, mutable, process-wide
// state involved AT ALL. Two tests can run fully in parallel, on
// different threads, with zero interaction between them, because each
// test's "environment" is just a local object, not a global variable.
// This is exactly why extracting environment-dependent logic into a
// method taking IHostEnvironment as a PARAMETER (rather than reading
// process environment variables directly) is the more test-safe
// design, independent of the FakeHostEnvironment technique itself.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing environment-specific startup branching (Development vs Production) requires actually setting the ASPNETCORE_ENVIRONMENT environment variable and building a real host.',
      reality: 'extracting the branching decision into a method that accepts IHostEnvironment as a parameter lets a test construct a minimal fake implementation with any EnvironmentName it wants — no real environment variable, host construction, or WebApplicationFactory needed.',
    },
    {
      thought: 'calling Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", ...) at the start of each test method is a safe, standard way to test environment-dependent code.',
      reality: 'this mutates process-wide state that can race across parallel test execution (which xUnit and most test frameworks do by default), producing intermittent, timing-dependent test failures that have nothing to do with the actual code under test.',
    },
    {
      thought: 'Program.cs top-level statements containing environment branching logic cannot be meaningfully unit tested at all, since top-level code is not a callable method.',
      reality: 'the branching DECISION can be extracted into a small, named, testable method (or static class) that Program.cs simply calls — the top-level code becomes a thin caller, and the actual logic worth testing lives somewhere a test can invoke directly.',
    },
  ];
}
