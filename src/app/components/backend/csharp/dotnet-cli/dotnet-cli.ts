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

@Component({
  selector: 'app-csharp-dotnet-cli',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent,
  ],
  templateUrl: './dotnet-cli.html',
  styleUrl: './dotnet-cli.scss',
})
export class CsharpDotnetCli {

  quickRef: QuickRefItem[] = [
    { name: 'dotnet new',          type: 'keyword', desc: 'Scaffold a project: dotnet new webapi -n MyApi --use-minimal-apis', since: '.NET Core 1.0' },
    { name: 'dotnet build',        type: 'keyword', desc: 'Compile the project; --configuration Release for optimised output', since: '.NET Core 1.0' },
    { name: 'dotnet run',          type: 'keyword', desc: 'Build and run; --project path/to.csproj; pass args after --', since: '.NET Core 1.0' },
    { name: 'dotnet publish',      type: 'keyword', desc: 'Publish for deployment: -c Release -r linux-x64 --self-contained', since: '.NET Core 1.0' },
    { name: 'dotnet test',         type: 'keyword', desc: 'Run tests; --filter "Category=Unit"; --logger "trx;LogFileName=out.trx"', since: '.NET Core 1.0' },
    { name: 'dotnet add package',  type: 'keyword', desc: 'Add NuGet package: dotnet add package Dapper --version 2.*', since: '.NET Core 1.0' },
    { name: 'dotnet tool install', type: 'keyword', desc: 'Install a .NET global/local tool: dotnet tool install -g dotnet-ef', since: '.NET Core 2.1' },
    { name: 'dotnet-trace',        type: 'keyword', desc: 'Capture runtime performance trace: dotnet-trace collect --process-id <pid>', since: '.NET Core 3.0' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The dotnet CLI — one tool for everything',
      points: [
        'The <code>dotnet</code> CLI is the cross-platform command-line entry point for all .NET operations: creating projects, building, running, testing, publishing, managing packages, installing tools, and diagnostics. Understanding it deeply removes dependency on IDE magic — everything the IDE does goes through the CLI.',
        'The CLI is structured as: <code>dotnet &lt;command&gt; [arguments] [options]</code>. Global options (--verbosity, --nologo) apply to all commands. Each command has its own options — <code>dotnet build --help</code> lists them.',
        'Project types are selected via templates. <code>dotnet new list</code> shows all installed templates. Third-party templates are installed with <code>dotnet new install &lt;package&gt;</code>. Templates can be filtered by language: <code>dotnet new list --language F#</code>.',
        '<code>global.json</code> in the repo root pins the SDK version: <code>{ "sdk": { "version": "9.0.100", "rollForward": "latestMinor" } }</code>. This ensures all team members and CI use the same SDK regardless of what is installed on the machine — critical for reproducible builds.',
      ],
    },
    {
      heading: 'Build & publish — configuration, RID, and self-contained',
      points: [
        'Two build configurations matter: <code>Debug</code> (default — includes debug symbols, no optimisation, DEBUG constant defined) and <code>Release</code> (-c Release — full JIT/AOT optimisations, smaller output, RELEASE constant). Always publish in Release. CI should also build in Release for performance tests.',
        'Runtime Identifier (RID) specifies the target OS+arch: <code>win-x64</code>, <code>linux-x64</code>, <code>linux-arm64</code>, <code>osx-arm64</code>. Required for <code>--self-contained</code> (bundles the runtime) and <code>--no-self-contained</code> (requires runtime installed on target). <code>dotnet publish -r linux-x64 --self-contained</code> is the typical containerisation command.',
        '<code>PublishSingleFile</code> bundles everything into one executable — convenient for CLI tools. <code>PublishAot</code> compiles to native code (see Native AOT page). <code>PublishTrimmed</code> removes unreachable code — reduces size but requires trim-safe code (same constraints as AOT).',
        'The <code>dotnet publish</code> output goes to <code>bin/Release/&lt;tfm&gt;/&lt;rid&gt;/publish/</code> by default. Override with <code>-o ./out</code>. For Docker: use multi-stage builds — a build stage runs <code>dotnet publish</code>, a runtime stage copies only the <code>publish/</code> output into a minimal base image.',
      ],
    },
    {
      heading: 'NuGet — packages and feeds',
      points: [
        '<code>dotnet add package &lt;name&gt;</code> installs the latest compatible version. Pin versions: <code>--version 8.*</code> (latest 8.x), <code>--version 8.0.1</code> (exact). Versions are stored in the .csproj as <code>&lt;PackageReference Include="Dapper" Version="2.1.35" /&gt;</code>.',
        '<code>dotnet restore</code> downloads all packages declared in the project. It runs automatically before build. Use <code>--locked-mode</code> with a committed <code>packages.lock.json</code> to enforce exact version reproducibility in CI.',
        'Package feeds: NuGet.org is the public feed. Private feeds (Azure Artifacts, GitHub Packages, MyGet) are configured in <code>nuget.config</code>. Authenticate with <code>dotnet nuget add source</code> or environment variables (<code>NUGET_AUTH_TOKEN</code>).',
        '<code>dotnet list package --outdated</code> shows packages with newer versions. <code>dotnet list package --vulnerable</code> shows packages with known CVEs (checks the NuGet vulnerability database). The latter is worth adding to CI as a security gate.',
      ],
    },
    {
      heading: '.NET global tools — the dotnet tool ecosystem',
      points: [
        '.NET tools are NuGet-packaged CLI applications. Install globally: <code>dotnet tool install -g &lt;package&gt;</code>. Install locally (project-scoped): <code>dotnet tool install &lt;package&gt;</code> + <code>dotnet-tools.json</code> manifest. Local tools are installed on demand with <code>dotnet tool restore</code>.',
        'Essential tools: <code>dotnet-ef</code> (EF Core migrations), <code>dotnet-trace</code> (performance tracing), <code>dotnet-counters</code> (live metrics), <code>dotnet-dump</code> (memory dump analysis), <code>dotnet-format</code> (code formatting), <code>dotnet-outdated</code> (dependency updates), <code>csharpier</code> (opinionated formatter).',
        'Update tools: <code>dotnet tool update -g &lt;package&gt;</code>. List installed tools: <code>dotnet tool list -g</code>. The local tool manifest (<code>.config/dotnet-tools.json</code>) should be committed to the repo so all team members get the same tool versions via <code>dotnet tool restore</code>.',
        'Create your own .NET tool: set <code>&lt;PackAsTool&gt;true&lt;/PackAsTool&gt;</code> in the .csproj and publish to NuGet. The entry point is <code>Main()</code>. The package installs as a CLI command with the name specified in <code>&lt;ToolCommandName&gt;</code>.',
      ],
    },
    {
      heading: 'Diagnostics tools — trace, counters, dump',
      points: [
        '<code>dotnet-trace</code> captures a runtime performance trace: <code>dotnet-trace collect --process-id &lt;pid&gt; --duration 00:00:30</code>. Produces a <code>.nettrace</code> file analysable in PerfView, Visual Studio, or Speedscope. Use <code>--profile cpu-sampling</code> for CPU profiles or <code>--profile gc-verbose</code> for GC analysis.',
        '<code>dotnet-counters</code> monitors live process metrics: <code>dotnet-counters monitor --process-id &lt;pid&gt;</code>. Shows CPU%, GC heap size, thread count, request rate, and custom EventCounters in real time — invaluable for diagnosing production issues without a profiler.',
        '<code>dotnet-dump</code> collects and analyses memory dumps: <code>dotnet-dump collect -p &lt;pid&gt;</code>. Analyse offline with <code>dotnet-dump analyze dump.dmp</code>. Commands: <code>gcheap</code> (heap stats), <code>dumpobj &lt;addr&gt;</code>, <code>gcroot &lt;addr&gt;</code> (why is this object alive?), <code>threadpool</code> (thread state).',
        '<code>dotnet-gcdump</code> captures a GC heap snapshot without a full process dump — much smaller and faster. Analysable in Visual Studio or PerfView. Run <code>dotnet-gcdump collect -p &lt;pid&gt;</code>. Use regularly in staging to detect memory growth trends before they become production incidents.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Project lifecycle',
      language: 'csharp',
      code: `# ── Create ──────────────────────────────────────────────────────────────
dotnet new webapi -n MyApi --use-minimal-apis --no-https
dotnet new classlib -n MyApi.Core
dotnet new xunit -n MyApi.Tests

# Create a solution and link projects
dotnet new sln -n MyApp
dotnet sln add MyApi/MyApi.csproj
dotnet sln add MyApi.Core/MyApi.Core.csproj
dotnet sln add MyApi.Tests/MyApi.Tests.csproj

# Add project references
dotnet add MyApi/MyApi.csproj reference MyApi.Core/MyApi.Core.csproj
dotnet add MyApi.Tests/MyApi.Tests.csproj reference MyApi/MyApi.csproj

# ── Build ────────────────────────────────────────────────────────────────
dotnet build                          # Debug, all projects in solution
dotnet build -c Release               # Release mode
dotnet build MyApi/MyApi.csproj       # specific project only
dotnet build --no-restore             # skip restore (CI: restore separately)

# ── Run ──────────────────────────────────────────────────────────────────
dotnet run --project MyApi
dotnet run --project MyApi -c Release -- --port 5001  # args after --
dotnet watch --project MyApi          # hot reload on file save

# ── Test ─────────────────────────────────────────────────────────────────
dotnet test                           # all test projects
dotnet test --filter "Category=Unit"  # filter by trait
dotnet test --collect:"XPlat Code Coverage"  # coverage report
dotnet test --logger "trx;LogFileName=results.trx"  # TRX for CI

# ── Publish ───────────────────────────────────────────────────────────────
dotnet publish -c Release -r linux-x64 --self-contained -o ./publish
dotnet publish -c Release -r linux-x64 -p:PublishSingleFile=true -o ./publish
dotnet publish -c Release -r linux-x64 -p:PublishAot=true -o ./publish`,
    },
    {
      label: 'global.json & SDK pinning',
      language: 'csharp',
      code: `// global.json — place in the solution root directory
// Pins SDK version for everyone who works on the repo
{
  "sdk": {
    "version": "9.0.100",
    "rollForward": "latestMinor",
    "allowPrerelease": false
  }
}

// rollForward options:
// "patch"        — only same major.minor, latest patch
// "feature"      — same major, latest minor.patch
// "latestMinor"  — same major, latest minor and patch (recommended)
// "latestMajor"  — any latest version installed (risky)
// "disable"      — exactly this version or fail

// Check currently used SDK:
// dotnet --version
// dotnet --list-sdks   ← all installed

// .editorconfig — style rules enforced by dotnet format
// [*.cs]
// dotnet_sort_system_directives_first = true
// csharp_style_expression_bodied_methods = when_on_single_line

// Apply formatting:
// dotnet format                      -- fix all issues
// dotnet format --verify-no-changes  -- CI check (fails if any changes needed)

// Directory.Build.props — apply MSBuild properties to all projects in subtree
/*
<Project>
  <PropertyGroup>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <WarningsAsErrors>nullable</WarningsAsErrors>
    <TreatWarningsAsErrors>false</TreatWarningsAsErrors>
    <LangVersion>latest</LangVersion>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
  </PropertyGroup>
</Project>
*/`,
    },
    {
      label: 'NuGet & packages',
      language: 'csharp',
      code: `# ── Add/remove packages ──────────────────────────────────────────────────
dotnet add package Dapper                       # latest stable
dotnet add package Microsoft.EntityFrameworkCore --version 8.*   # latest 8.x
dotnet add package Serilog --version 3.1.1      # exact version
dotnet remove package OldPackage

# ── Inspect packages ─────────────────────────────────────────────────────
dotnet list package                             # all packages in project
dotnet list package --outdated                  # packages with newer versions
dotnet list package --vulnerable                # packages with known CVEs
dotnet list package --include-transitive        # include indirect dependencies

# ── Restore with lock file (reproducible CI builds) ──────────────────────
# First time: generate the lock file
dotnet restore --use-lock-file
# Commit packages.lock.json to source control

# CI: enforce exact versions from lock file
dotnet restore --locked-mode

# ── nuget.config — private feeds ─────────────────────────────────────────
# <?xml version="1.0" encoding="utf-8"?>
# <configuration>
#   <packageSources>
#     <add key="NuGet" value="https://api.nuget.org/v3/index.json" />
#     <add key="MyFeed" value="https://pkgs.dev.azure.com/myorg/_packaging/myfeed/nuget/v3/index.json" />
#   </packageSources>
#   <packageSourceCredentials>
#     <MyFeed>
#       <add key="Username" value="__token__" />
#       <add key="ClearTextPassword" value="%NUGET_AUTH_TOKEN%" />
#     </MyFeed>
#   </packageSourceCredentials>
# </configuration>

# ── Publish a NuGet package ───────────────────────────────────────────────
dotnet pack -c Release -o ./nupkg
dotnet nuget push ./nupkg/*.nupkg -k $NUGET_API_KEY -s https://api.nuget.org/v3/index.json`,
    },
    {
      label: 'Tools & dotnet-tools.json',
      language: 'csharp',
      code: `# ── Global tools ─────────────────────────────────────────────────────────
dotnet tool install -g dotnet-ef           # EF Core CLI (migrations)
dotnet tool install -g dotnet-trace        # performance tracing
dotnet tool install -g dotnet-counters     # live metrics
dotnet tool install -g dotnet-dump         # memory dumps
dotnet tool install -g dotnet-gcdump       # GC heap snapshots
dotnet tool install -g dotnet-format       # code formatting
dotnet tool install -g csharpier           # opinionated formatter

dotnet tool update -g dotnet-ef            # update to latest
dotnet tool list -g                        # list all global tools

# ── Local tools (project-scoped, recommended for teams) ──────────────────
# Create the manifest first (once per repo):
dotnet new tool-manifest                   # creates .config/dotnet-tools.json

# Install locally:
dotnet tool install dotnet-ef
dotnet tool install csharpier

# Restore on a new machine / CI:
dotnet tool restore                        # installs all tools from dotnet-tools.json

# Use local tool:
dotnet ef migrations add InitialCreate
dotnet csharpier .

# .config/dotnet-tools.json (commit this to source control):
# {
#   "version": 1,
#   "isRoot": true,
#   "tools": {
#     "dotnet-ef": { "version": "8.0.0", "commands": ["dotnet-ef"] },
#     "csharpier":  { "version": "0.29.0", "commands": ["dotnet-csharpier"] }
#   }
# }

# EF Core migrations workflow:
dotnet ef migrations add AddUsersTable --project src/MyApp.Data
dotnet ef database update                  # apply pending migrations
dotnet ef migrations list                  # see all migrations
dotnet ef database drop --force            # drop (dev only!)
dotnet ef dbcontext scaffold "..." Microsoft.EntityFrameworkCore.SqlServer  # scaffold from DB`,
    },
    {
      label: 'Diagnostics & profiling',
      language: 'csharp',
      code: `# ── dotnet-counters: live process metrics ─────────────────────────────────
# Get process ID:
dotnet-counters ps

# Monitor live:
dotnet-counters monitor --process-id 12345
dotnet-counters monitor -p 12345 --counters System.Runtime,Microsoft.AspNetCore.Hosting

# Key counters to watch:
# cpu-usage              — CPU%
# gc-heap-size           — GC managed heap in MB
# gen-0/1/2-gc-count     — GC collection frequency
# exception-count        — thrown exceptions per second
# active-timer-count     — timer proliferation
# threadpool-queue-length — backlog in thread pool queue

# ── dotnet-trace: performance profiling ──────────────────────────────────
# Collect 30 seconds of CPU sampling:
dotnet-trace collect -p 12345 --duration 00:00:30 --profile cpu-sampling

# Collect GC events:
dotnet-trace collect -p 12345 --duration 00:00:60 --profile gc-verbose

# View in browser (converts to Chromium trace format):
dotnet-trace convert ./trace.nettrace --format Chromium
# Open chrome://tracing and load the .chromium file

# ── dotnet-dump: memory analysis ─────────────────────────────────────────
# Collect a dump:
dotnet-dump collect -p 12345

# Analyze:
dotnet-dump analyze ./core_20240601_120000

# Inside the dump analyzer:
# gcheap                 — heap statistics (types + sizes)
# dumpheap -type System.String -min 1000  — large string objects
# dumpobj 0x7f1234567890 — inspect object at address
# gcroot 0x7f1234567890 — why is this object alive?
# threadpool             — thread states
# threads                — all managed threads

# ── dotnet-gcdump: GC heap snapshot (lightweight) ────────────────────────
dotnet-gcdump collect -p 12345
# Open in Visual Studio > Debug > Windows > Heap Snapshot
# or in PerfView > Diff heap snapshots to find memory growth`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Publishing without specifying Release configuration',
      wrong: `# WRONG: publishes Debug build — unoptimised, with debug symbols
dotnet publish -o ./out

# Output includes .pdb files, disabled optimisations,
# DEBUG compiler constant active — significantly slower and larger`,
      right: `# CORRECT: always publish in Release
dotnet publish -c Release -o ./out

# For containerised deployment (self-contained Linux binary):
dotnet publish -c Release -r linux-x64 --self-contained -o ./out

# Verify configuration in output:
# bin/Release/ not bin/Debug/`,
      explanation: 'dotnet publish defaults to Debug configuration when --configuration is not specified. Debug builds disable JIT optimisations, include debug symbols, and can be 2–5× slower. Always specify -c Release for any published artifact — CI pipelines and Dockerfiles should always include this flag.',
    },
    {
      title: 'Not pinning SDK version with global.json',
      wrong: `# No global.json — team members use whatever SDK is installed
# Developer A: SDK 8.0.100 → builds fine
# Developer B: SDK 9.0.200 → different language features available
# CI: SDK 8.0.400 → different default warnings treated as errors
# Result: "works on my machine" syndrome, flaky CI`,
      right: `// global.json in solution root — commit to source control
{
  "sdk": {
    "version": "9.0.100",
    "rollForward": "latestMinor"
  }
}

// Now everyone gets the same SDK:
// dotnet --version  → 9.0.100 (or latest 9.0.x patch)
// dotnet build behaves identically on all machines`,
      explanation: 'Different SDK versions can produce different compiler warnings, language features, and default behaviors. Without global.json, each developer uses whichever SDK is installed, causing subtle inconsistencies. Commit global.json to pin the major.minor SDK version for reproducible builds.',
    },
    {
      title: 'Installing tools globally instead of locally in team projects',
      wrong: `# WRONG: each developer installs independently — different versions
# Developer A: dotnet tool install -g dotnet-ef  → v8.0.0
# Developer B: dotnet tool install -g dotnet-ef  → v8.0.10 (latest at install time)
# CI: dotnet tool install -g dotnet-ef  → depends on what's cached
# Migrations generated by different EF versions can differ!`,
      right: `# CORRECT: local tool manifest — same version for everyone
dotnet new tool-manifest              # once per repo
dotnet tool install dotnet-ef --version 8.0.10  # pinned version
git add .config/dotnet-tools.json    # commit the manifest

# On any machine / CI:
dotnet tool restore                   # installs exact versions from manifest
dotnet ef migrations add ...          # uses the project-pinned version`,
      explanation: 'Global tools are installed per-user at whatever version is current at install time. Team members and CI may have different versions, causing different output for code generation tools (EF migrations, OpenAPI clients). Local tools pinned in .config/dotnet-tools.json give everyone the exact same version via dotnet tool restore.',
    },
    {
      title: 'Checking packages for vulnerabilities only manually',
      wrong: `# Only checked when someone thinks to run it
# Vulnerable packages go unnoticed for months
dotnet list package --vulnerable    # run manually, sometimes, maybe`,
      right: `# Add to CI pipeline (GitHub Actions example):
# - name: Check for vulnerable packages
#   run: dotnet list package --vulnerable --include-transitive 2>&1 | tee vuln.txt
#         && ! grep -q "has known vulnerabilities" vuln.txt

# Or use NuGet audit in .csproj (NET 8+):
# <PropertyGroup>
#   <NuGetAudit>true</NuGetAudit>
#   <NuGetAuditLevel>moderate</NuGetAuditLevel>
#   <NuGetAuditMode>all</NuGetAuditMode>
# </PropertyGroup>
# This automatically fails the build if vulnerable packages are detected`,
      explanation: 'Vulnerabilities in dependencies go unnoticed when checking is manual. Add --vulnerable checks to CI so every PR fails if it introduces or keeps a vulnerable package. .NET 8+ NuGetAudit in the .csproj is even cleaner — it makes dotnet restore/build fail automatically without a separate CI step.',
    },
  ];

  challenge: Challenge = {
    title: 'CI-ready build script',
    language: 'csharp',
    description: `Write a shell script (or PowerShell) that runs a complete CI pipeline for a .NET solution:
1. Restore packages in locked mode (fail if packages.lock.json is out of date)
2. Check for vulnerable packages and fail if any found
3. Build in Release mode with warnings-as-errors
4. Run tests with code coverage collection
5. Publish the main web project self-contained for linux-x64
6. Print a summary of what passed/failed

Hint: exit code non-zero on any failure should propagate`,
    hints: [
      'dotnet restore --locked-mode → fails if packages.lock.json is stale',
      'dotnet list package --vulnerable 2>&1 | grep "has known vulnerabilities"',
      'dotnet build -c Release -warnaserror → or set in Directory.Build.props',
      'dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage',
      'dotnet publish -c Release -r linux-x64 --self-contained -o ./publish',
      'In PowerShell: $LASTEXITCODE after each command; exit 1 on failure',
    ],
    starterCode: `# ci-build.ps1 (PowerShell — works on Windows/Linux/macOS with pwsh)
param(
    [string]$Project = "src/MyApp/MyApp.csproj",
    [string]$TestProject = "src/MyApp.Tests/MyApp.Tests.csproj"
)

$ErrorActionPreference = "Stop"
$failed = $false

function Step([string]$name, [scriptblock]$action) {
    Write-Host "▶ $name..." -ForegroundColor Cyan
    try {
        & $action
        if ($LASTEXITCODE -ne 0) { throw "Exit code $LASTEXITCODE" }
        Write-Host "  ✓ $name" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ $name: $_" -ForegroundColor Red
        $script:failed = $true
    }
}

# TODO: add steps for restore, vulnerability check, build, test, publish
# At the end: if ($failed) { exit 1 }`,
    solution: `# ci-build.ps1
param(
    [string]$Project     = "src/MyApp/MyApp.csproj",
    [string]$TestProject = "src/MyApp.Tests/MyApp.Tests.csproj",
    [string]$Rid         = "linux-x64"
)

$ErrorActionPreference = "Continue"
$failed = $false

function Step([string]$name, [scriptblock]$action) {
    Write-Host ""
    Write-Host "▶ $name" -ForegroundColor Cyan
    & $action
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ FAILED: $name" -ForegroundColor Red
        $script:failed = $true
    } else {
        Write-Host "  ✓ $name" -ForegroundColor Green
    }
}

Step "Restore (locked mode)" {
    dotnet restore --locked-mode
}

Step "Vulnerability check" {
    $output = dotnet list package --vulnerable --include-transitive 2>&1
    Write-Host $output
    if ($output -match "has known vulnerabilities") {
        Write-Host "Vulnerable packages detected!" -ForegroundColor Red
        $LASTEXITCODE = 1
    }
}

Step "Build (Release)" {
    dotnet build -c Release --no-restore /p:TreatWarningsAsErrors=true
}

Step "Tests with coverage" {
    dotnet test $TestProject -c Release --no-build \`
        --collect:"XPlat Code Coverage" \`
        --results-directory ./coverage \`
        --logger "trx;LogFileName=results.trx"
}

Step "Publish ($Rid)" {
    dotnet publish $Project -c Release -r $Rid \`
        --self-contained -o ./publish
}

Write-Host ""
if ($failed) {
    Write-Host "CI FAILED — one or more steps failed." -ForegroundColor Red
    exit 1
} else {
    Write-Host "CI PASSED" -ForegroundColor Green
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the purpose of global.json in a .NET repository?',
      options: [
        'It defines global NuGet package versions shared across all projects',
        'It pins the .NET SDK version so all developers and CI use the same SDK regardless of what is installed',
        'It configures global MSBuild properties that apply to all projects in the solution',
        'It specifies the global namespace imported into all C# files via implicit usings',
      ],
      answer: 1,
      explanation: 'global.json pins the .NET SDK version (major.minor.patch) for the directory tree. When you run any dotnet command, the SDK selector reads global.json and uses that version. Without it, each developer uses whichever SDK is installed — causing subtle differences in compiler behaviour, warnings, and language feature availability.',
    },
    {
      q: 'What does dotnet publish -c Release -r linux-x64 --self-contained produce?',
      options: [
        'A Release-mode DLL that requires .NET installed on the target Linux machine',
        'A self-contained native binary for Linux x64 — includes the .NET runtime; no runtime installation needed on the target',
        'A Docker image built for Linux x64',
        'A Release build that publishes to a Linux NuGet feed',
      ],
      answer: 1,
      explanation: '--self-contained bundles the .NET runtime alongside the application. The resulting ./publish/ folder contains everything needed to run on the target OS+architecture without .NET installed. The -r linux-x64 (RID) specifies which platform to target. Combined with -c Release, the output is optimised for production.',
    },
    {
      q: 'What is the difference between dotnet tool install -g and dotnet tool install?',
      options: [
        '-g installs for the current project only; without -g installs for all users',
        '-g installs globally for the current user; without -g installs as a local tool scoped to the project via dotnet-tools.json',
        '-g installs the latest version; without -g requires a version to be specified',
        '-g installs into PATH automatically; without -g must be called with dotnet run tool',
      ],
      answer: 1,
      explanation: '-g (global) installs into the user\'s global tool directory (~/.dotnet/tools) and is available everywhere. Without -g, it installs as a local tool scoped to the nearest .config/dotnet-tools.json manifest. Local tools are recommended for team projects — versions are pinned in the manifest and restored consistently via dotnet tool restore.',
    },
    {
      q: 'What does dotnet restore --locked-mode do and why use it in CI?',
      options: [
        'It prevents packages from being updated during restore — equivalent to npm ci',
        'It restores packages and then locks the global NuGet cache to prevent corruption',
        'It fails if packages.lock.json is missing or if restored packages differ from the lock file — ensuring reproducible builds',
        'It disables parallel package downloads for more deterministic restore ordering',
      ],
      answer: 2,
      explanation: '--locked-mode requires a committed packages.lock.json and fails if the actual resolved packages differ from what the lock file specifies. This prevents "works here but fails in prod" scenarios caused by NuGet resolving a different (possibly newer) compatible version in CI. Generate the lock file with --use-lock-file and commit it.',
    },
    {
      q: 'Which dotnet diagnostic tool provides live CPU%, GC heap, and request rate metrics for a running process?',
      options: [
        'dotnet-trace — captures detailed runtime events for offline analysis',
        'dotnet-counters — monitors live EventCounter metrics from a running process in real time',
        'dotnet-dump — collects memory dumps for offline heap analysis',
        'dotnet-gcdump — captures GC heap snapshots for memory profiling',
      ],
      answer: 1,
      explanation: 'dotnet-counters monitor --process-id <pid> shows live metrics: CPU%, GC heap size, GC collection counts, exception rate, thread pool queue length, and custom EventCounters. It is the first tool to reach for when diagnosing a misbehaving production process — it gives an instant picture without stopping the process or requiring a profiler.',
    },
    {
      q: 'What does dotnet watch do and how does it differ from dotnet run?',
      options: [
        'dotnet watch monitors NuGet feeds for updates and auto-installs new package versions',
        'dotnet watch rebuilds and restarts the app when source files change — and in .NET 6+ applies hot reload for many changes without a full restart',
        'dotnet watch is a diagnostic tool that tracks all file system changes made by the running process',
        'dotnet watch is identical to dotnet run but outputs a progress bar',
      ],
      answer: 1,
      explanation: 'dotnet watch monitors source files and rebuilds/restarts the app on changes — the inner development loop equivalent of npm run dev. With .NET 6+ hot reload, many code changes (method bodies, static readonly fields) are applied in-place without restarting. Larger structural changes (new types, attribute changes) still trigger a full restart. Use dotnet watch instead of dotnet run during development.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I pass environment-specific configuration to a published app?',
      a: 'Set the ASPNETCORE_ENVIRONMENT (or DOTNET_ENVIRONMENT) environment variable on the target machine. The app loads appsettings.json first, then appsettings.{Environment}.json, with the latter overriding. For secrets: use environment variables (never commit secrets), Azure Key Vault, AWS Secrets Manager, or dotnet user-secrets (dev only). The Options pattern with IConfiguration binds these sources to typed classes.',
    },
    {
      q: 'What is Directory.Build.props and when should I use it?',
      a: 'Directory.Build.props is an MSBuild props file placed at the root of a repo. MSBuild automatically imports it into every project under that directory — allowing you to set properties once (Nullable enable, LangVersion, EnforceCodeStyleInBuild, WarningsAsErrors) without repeating them in every .csproj. A companion Directory.Build.targets applies targets. Together they eliminate duplication in multi-project solutions.',
    },
    {
      q: 'How do I debug a .NET app running in Docker?',
      a: 'Option 1: vsdbg — install the .NET debugger in the container (dotnet-debugger Docker image) and attach via VS Code\'s "Remote: Containers" or Visual Studio\'s "Attach to Process". Option 2: expose a debug port and use the VS/VS Code remote debugger. Option 3: dotnet-trace/dotnet-dump from inside the container (install the tools in the image). For production-like debugging, dotnet-counters + dotnet-gcdump via kubectl exec is the safest approach.',
    },
    {
      q: 'What is the dotnet workload command and when do I need it?',
      a: 'Workloads are optional SDK components for specific platforms — MAUI (mobile/desktop), Blazor WebAssembly, Tizen, watchOS. Install with dotnet workload install maui or dotnet workload install wasm-tools. List installed: dotnet workload list. Update: dotnet workload update. They are not needed for standard web/console/class library projects — only when targeting platform-specific capabilities.',
    },
    {
      q: 'What is the difference between dotnet build and dotnet publish?',
      a: 'dotnet build compiles the code into the output directory (bin/) suitable for local development — it does not bundle dependencies or produce a deployable artefact. dotnet publish (-c Release) builds, trims unused assets, copies all dependencies (DLLs, config, native libs), and produces a self-contained output in a publish/ folder ready to deploy. Always use dotnet publish for CI/CD; never deploy from bin/ directly.',
    },
    {
      q: 'How do I add a NuGet package from a local directory or private feed rather than nuget.org?',
      a: 'For a local directory: add a NuGet.Config file with <add key="Local" value="/path/to/local/packages" /> under <packageSources>. For a private feed (Azure Artifacts, GitHub Packages, Nexus): add the feed URL with credentials in NuGet.Config or via environment variables (NUGET_AUTH_TOKEN). Run dotnet nuget add source <url> --name <name> to register a feed. dotnet add package will then search all registered sources in priority order.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'The <code>dotnet</code> CLI is the single tool for creating, building, testing, publishing, and diagnosing .NET apps. Pin the SDK with <code>global.json</code>, use local tools via <code>dotnet-tools.json</code>, always publish with <code>-c Release</code>, and use <code>dotnet-counters</code>/<code>dotnet-trace</code>/<code>dotnet-dump</code> for production diagnostics.',
    mustKnow: [
      '<code>dotnet new / build / run / test / publish</code> — the core lifecycle commands',
      '<code>global.json</code> — pins SDK version for all team members and CI (commit it)',
      '<code>dotnet publish -c Release -r linux-x64 --self-contained</code> — production container publish',
      '<code>dotnet tool restore</code> — installs local tools from <code>.config/dotnet-tools.json</code> (commit the manifest)',
      '<code>dotnet list package --vulnerable</code> → add to CI; <code>&lt;NuGetAudit&gt;true&lt;/NuGetAudit&gt;</code> in .csproj',
      '<code>dotnet-counters</code> (live metrics) → <code>dotnet-trace</code> (CPU profile) → <code>dotnet-dump</code> (memory) — diagnostic escalation path',
    ],
    interviewFocus: [
      '<strong>global.json purpose?</strong> — pins SDK version; reproducible builds across machines',
      '<strong>self-contained publish?</strong> — bundles .NET runtime; no runtime needed on target; -r <rid> required',
      '<strong>local vs global tools?</strong> — local = version-pinned in dotnet-tools.json, shared across team; global = per-user install',
      '<strong>dotnet-counters vs dotnet-trace?</strong> — counters = live real-time metrics; trace = detailed event capture for offline analysis',
    ],
  };
}
