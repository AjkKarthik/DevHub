import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-aspnet-configuration',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    BeforeAfterComponent, CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './configuration.html',
  styleUrl: './configuration.scss',
})
export class AspnetConfiguration {

  prerequisites: Prerequisite[] = [
    { label: 'Hosting & Startup', route: '/aspnet/hosting-startup' },
    { label: 'Dependency Injection', route: '/aspnet/dependency-injection' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'builder.Configuration',          type: 'accessor',  desc: 'IConfiguration built from layered providers; read values with ["Key"] or GetValue<T>()', since: '.NET 6+' },
    { name: 'IOptions<T>',                    type: 'interface', desc: 'Snapshot of a config section; value never changes after startup', since: 'Core 1+' },
    { name: 'IOptionsSnapshot<T>',            type: 'interface', desc: 'Re-read per request (Scoped); picks up reloads within a request lifecycle', since: 'Core 1+' },
    { name: 'IOptionsMonitor<T>',             type: 'interface', desc: 'Singleton; notifies via OnChange() whenever the underlying config file reloads', since: 'Core 1+' },
    { name: 'services.Configure<T>(section)', type: 'method',   desc: 'Binds a config section to a strongly-typed options class and registers all IOptions<T> variants', since: 'Core 1+' },
    { name: 'ValidateDataAnnotations()',       type: 'method',   desc: 'Validates options properties decorated with [Required], [Range] etc at startup', since: 'Core 2.2+' },
    { name: 'ValidateOnStart()',               type: 'method',   desc: '.NET 6+: triggers validation eagerly at startup, not lazily on first access', since: '.NET 6+' },
    { name: 'User secrets (dotnet user-secrets)', type: 'keyword', desc: 'Dev-only local overrides stored outside the project directory, not committed to source control', since: 'Core 1+' },
    { name: 'GetConnectionString("name")',     type: 'method',   desc: 'Shorthand for Configuration["ConnectionStrings:name"]', since: 'Core 1+' },
    { name: 'GetRequiredSection("key")',       type: 'method',   desc: 'Throws if the section is absent; safe alternative to GetSection() + null check', since: '.NET 6+' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Provider layering — who wins?',
      points: [
        'ASP.NET Core stacks configuration providers. The default order from lowest to highest priority: <code>appsettings.json</code> → <code>appsettings.{Env}.json</code> → <strong>user secrets</strong> (Development only) → <strong>environment variables</strong> → <strong>command-line arguments</strong>.',
        'Later providers <em>win</em>: an environment variable <code>Database__Host=prod-db</code> overrides the same key in <code>appsettings.json</code>. This layering lets you keep defaults in the JSON file and override only what differs per environment.',
        'Nested keys use <code>:</code> (colon) as separator in code and JSON, and <code>__</code> (double underscore) in environment variables — because colons are not valid in shell variable names on many platforms.',
        'You can add custom providers: Azure Key Vault, AWS Parameter Store, Consul, etcd, encrypted files. They plug into the same <code>IConfiguration</code> abstraction, so consuming code never changes.',
      ],
    },
    {
      heading: 'Strongly-typed options with IOptions<T>',
      points: [
        'Reading raw strings from <code>IConfiguration</code> everywhere is fragile. The <strong>Options pattern</strong> binds a config section to a C# class: <code>services.Configure&lt;SmtpOptions&gt;(builder.Configuration.GetSection("Smtp"))</code>.',
        'Inject <code>IOptions&lt;SmtpOptions&gt;</code> and read via <code>options.Value</code>. The value is a snapshot taken at startup — it never updates even if the JSON file changes while the app runs.',
        'For settings that must reload at runtime (feature flags, rate limits), use <code>IOptionsSnapshot&lt;T&gt;</code> (Scoped — re-reads per request) or <code>IOptionsMonitor&lt;T&gt;</code> (Singleton with an <code>OnChange</code> callback).',
        'Name your options class after the config section (e.g., <code>SmtpOptions</code> for the <code>"Smtp"</code> section) and keep it a plain POCO — no logic, no dependencies.',
      ],
    },
    {
      heading: 'IOptions vs IOptionsSnapshot vs IOptionsMonitor',
      points: [
        '<code>IOptions&lt;T&gt;</code> is <strong>Singleton</strong>. Value is computed once at startup. Use for settings that never change: database connection strings, API keys, feature flags frozen at deploy time.',
        '<code>IOptionsSnapshot&lt;T&gt;</code> is <strong>Scoped</strong>. Value is re-computed once per request from the current config. Use when you want hot-reload within a request but consistent values across all services in that request.',
        '<code>IOptionsMonitor&lt;T&gt;</code> is <strong>Singleton</strong> with change notifications. <code>.CurrentValue</code> is always fresh; <code>.OnChange(callback)</code> fires when config reloads. Use in background services and singletons that need live updates.',
        'Never inject <code>IOptionsSnapshot&lt;T&gt;</code> into a Singleton — it creates a captive dependency. The DI container enforces this with an exception if you have scope validation enabled (it is on by default in Development).',
      ],
    },
    {
      heading: 'Validation — catch bad config at startup',
      points: [
        'Decorate options properties with <code>[Required]</code>, <code>[Range(1, 3600)]</code>, <code>[Url]</code>, etc. Then call <code>.ValidateDataAnnotations()</code> on the options builder.',
        'By default, validation runs lazily — the first time <code>IOptions&lt;T&gt;.Value</code> is accessed. Prefer <code>.ValidateOnStart()</code> (.NET 6+) to catch missing or invalid config immediately at process launch rather than on the first request.',
        'For complex validation logic, implement <code>IValidateOptions&lt;T&gt;</code> and register it with DI. Its <code>Validate</code> method can check cross-property invariants that DataAnnotations cannot express.',
        'Good practice: make all required settings non-nullable and default-value-free in the POCO. A missing required field then causes a compile-time warning or a validation error — either is better than silently reading an empty string.',
      ],
    },
    {
      heading: 'User secrets and environment variables',
      points: [
        '<strong>User secrets</strong> store sensitive development settings (API keys, connection strings) outside the project directory in a per-machine secrets store — they are never committed to source control. Run <code>dotnet user-secrets init</code> then <code>dotnet user-secrets set "Key" "Value"</code>.',
        'User secrets are active only in the Development environment. In Production use environment variables, Azure Key Vault, or a secrets manager — never appsettings.json for secrets.',
        '<strong>Environment variables</strong> are the standard way to inject secrets in containers and cloud platforms. They override appsettings.json by default. Nested keys: <code>Database__Host=db.internal</code> maps to <code>Database:Host</code> in code.',
        'Prefix environment variables to avoid collisions: <code>builder.Configuration.AddEnvironmentVariables("MYAPP_")</code> — only variables starting with <code>MYAPP_</code> are loaded, and the prefix is stripped.',
        'In Docker/Kubernetes pass secrets via environment variables injected at runtime — never bake them into image layers. Use Kubernetes Secrets or Docker secrets, then map them to container environment variables in the deployment manifest.',
        'The <code>ISecretManager</code> abstraction (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault) integrates as a configuration provider — values appear in <code>IConfiguration</code> just like appsettings values, so consuming code never needs to know the source.',
      ],
    },
    {
      heading: 'PostConfigure, chaining, and advanced patterns',
      points: [
        '<code>PostConfigure&lt;T&gt;()</code> runs after all <code>Configure&lt;T&gt;</code> calls — useful for computed defaults: set a computed <code>DisplayName</code> from <code>FirstName</code> + <code>LastName</code> after the raw values are bound.',
        '<code>ConfigureAll&lt;T&gt;()</code> and <code>PostConfigureAll&lt;T&gt;()</code> apply to every named instance of an options type — useful for cross-cutting defaults (e.g., set a default timeout on every <code>HttpClientOptions</code> instance).',
        'The <code>IConfigureOptions&lt;T&gt;</code> interface lets you inject dependencies into the configuration step: register a class implementing it and the DI container will call its <code>Configure</code> method when options are first resolved.',
        'Use <code>AddOptions&lt;T&gt;().Configure&lt;IDep&gt;((opts, dep) => { ... })</code> as a shorthand for resolving one dependency during configuration — avoids writing a full <code>IConfigureOptions</code> class for simple cases.',
        'Never call <code>builder.Configuration.GetSection()</code> inside a handler at request time. Read configuration at startup into a strongly-typed class via <code>IOptions&lt;T&gt;</code>. Per-request config reads bypass caching and add overhead every time.',
        'For large apps, partition options by domain: <code>SmtpOptions</code>, <code>JwtOptions</code>, <code>DatabaseOptions</code> — one class per config section. Avoid a single mega-settings class; it becomes a god object and makes validation impossible.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'appsettings + IOptions',
      language: 'csharp',
      code: `// ── appsettings.json ─────────────────────────────────────────────────
// {
//   "Smtp": {
//     "Host": "smtp.example.com",
//     "Port": 587,
//     "UseSsl": true,
//     "FromAddress": "no-reply@example.com"
//   }
// }

// ── Options class ─────────────────────────────────────────────────────
public class SmtpOptions
{
    public string Host        { get; set; } = "";
    public int    Port        { get; set; } = 587;
    public bool   UseSsl      { get; set; } = true;
    public string FromAddress { get; set; } = "";
}

// ── Register in Program.cs ────────────────────────────────────────────
builder.Services.Configure<SmtpOptions>(
    builder.Configuration.GetSection("Smtp"));

// Or with validation:
builder.Services
    .AddOptions<SmtpOptions>()
    .BindConfiguration("Smtp")
    .ValidateDataAnnotations()
    .ValidateOnStart();

// ── Inject and use ────────────────────────────────────────────────────
public class EmailService
{
    private readonly SmtpOptions _smtp;

    public EmailService(IOptions<SmtpOptions> opts)
        => _smtp = opts.Value;          // snapshot: never changes

    public Task SendAsync(string to, string subject, string body)
    {
        Console.WriteLine(\$"SMTP {_smtp.Host}:{_smtp.Port} → {to}");
        // real SmtpClient code here
        return Task.CompletedTask;
    }
}`,
    },
    {
      label: 'Reading Config Directly',
      language: 'csharp',
      code: `// ── Reading raw values from IConfiguration ───────────────────────────
var builder = WebApplication.CreateBuilder(args);

// Flat key
string? title = builder.Configuration["AppTitle"];

// Nested key (colon separator)
string? host = builder.Configuration["Database:Host"];

// Generic typed value with default
int maxRetries = builder.Configuration.GetValue<int>("Http:MaxRetries", 3);

// Required section (throws if absent)
var smtpSection = builder.Configuration.GetRequiredSection("Smtp");

// Connection string shorthand
string connStr = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default is required");

// ── appsettings.Development.json overrides ────────────────────────────
// appsettings.json:            "Api": { "Url": "https://api.example.com" }
// appsettings.Development.json: "Api": { "Url": "https://localhost:7001" }
// In Development, GetValue returns "https://localhost:7001"
string apiUrl = builder.Configuration["Api:Url"]!;

// ── Environment variable override ────────────────────────────────────
// Shell: export Database__Host=prod-db.internal
// Code:  builder.Configuration["Database:Host"] → "prod-db.internal"
// (double underscore __ maps to colon separator)`,
    },
    {
      label: 'Validation',
      language: 'csharp',
      code: `using System.ComponentModel.DataAnnotations;

// ── Options with DataAnnotations ─────────────────────────────────────
public class JwtOptions
{
    [Required, MinLength(32)]
    public string Secret { get; set; } = "";

    [Required]
    public string Issuer { get; set; } = "";

    [Range(1, 1440)]
    public int ExpiryMinutes { get; set; } = 60;
}

// ── Register with eager validation ───────────────────────────────────
builder.Services
    .AddOptions<JwtOptions>()
    .BindConfiguration("Jwt")
    .ValidateDataAnnotations()   // honours [Required], [Range] etc.
    .ValidateOnStart();           // throws at startup, not on first access

// ── Custom validator for cross-property rules ─────────────────────────
public class JwtOptionsValidator : IValidateOptions<JwtOptions>
{
    public ValidateOptionsResult Validate(string? name, JwtOptions options)
    {
        if (options.ExpiryMinutes > 60 && string.IsNullOrEmpty(options.Issuer))
            return ValidateOptionsResult.Fail(
                "Long-lived tokens must specify an Issuer.");

        return ValidateOptionsResult.Success;
    }
}

builder.Services.AddSingleton<IValidateOptions<JwtOptions>, JwtOptionsValidator>();`,
    },
    {
      label: 'IOptionsMonitor',
      language: 'csharp',
      code: `// ── IOptionsMonitor for live reload ─────────────────────────────────
// appsettings.json is watched; changes reload automatically (Development)

public class FeatureFlagService
{
    private readonly IOptionsMonitor<FeatureFlags> _monitor;
    private IDisposable? _listener;

    public FeatureFlagService(IOptionsMonitor<FeatureFlags> monitor)
    {
        _monitor = monitor;

        // React to config changes at runtime
        _listener = monitor.OnChange(flags =>
            Console.WriteLine(\$"Feature flags reloaded: NewCheckout={flags.NewCheckout}"));
    }

    public bool IsNewCheckoutEnabled => _monitor.CurrentValue.NewCheckout;
}

public class FeatureFlags
{
    public bool NewCheckout { get; set; }
    public bool BetaDashboard { get; set; }
}

// ── Comparison table ──────────────────────────────────────────────────
// IOptions<T>         → Singleton, snapshot at startup, never reloads
// IOptionsSnapshot<T> → Scoped,    re-reads per request (inject only in Scoped/Transient)
// IOptionsMonitor<T>  → Singleton, CurrentValue always current, OnChange() callback`,
    },
  ];

  challenge: Challenge = {
    title: 'Validated database options with hot-reload feature flags',
    language: 'csharp',
    description: `Build a Program.cs that:
1. Defines a <code>DatabaseOptions</code> class with <code>[Required]</code> <code>Host</code> and <code>[Range(1,65535)]</code> <code>Port</code> properties; bind it from <code>"Database"</code> section with eager validation.
2. Defines a <code>FeatureFlags</code> class with <code>bool EnableNewDashboard</code>; bind from <code>"Features"</code> section.
3. Exposes <code>GET /db-info</code> that returns the database host and port using <code>IOptions&lt;DatabaseOptions&gt;</code>.
4. Exposes <code>GET /features</code> that returns the current flag values using <code>IOptionsMonitor&lt;FeatureFlags&gt;</code> so changes to appsettings reload immediately.`,
    hints: [
      'Use .AddOptions<DatabaseOptions>().BindConfiguration("Database").ValidateDataAnnotations().ValidateOnStart()',
      'Use services.Configure<FeatureFlags>(config.GetSection("Features")) for the monitor variant',
      'IOptionsMonitor<T>.CurrentValue is always fresh — suitable for the /features endpoint',
      'IOptions<T>.Value is a startup snapshot — suitable for stable infrastructure settings',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);

// TODO: register DatabaseOptions with validation
// TODO: register FeatureFlags

var app = builder.Build();

// TODO: GET /db-info
// TODO: GET /features

app.Run();

public class DatabaseOptions
{
    // TODO: add [Required] Host and [Range] Port
}

public class FeatureFlags
{
    public bool EnableNewDashboard { get; set; }
}`,
    solution: `using System.ComponentModel.DataAnnotations;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddOptions<DatabaseOptions>()
    .BindConfiguration("Database")
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.Configure<FeatureFlags>(
    builder.Configuration.GetSection("Features"));

var app = builder.Build();

app.MapGet("/db-info", (IOptions<DatabaseOptions> opts) =>
    Results.Ok(new { opts.Value.Host, opts.Value.Port }));

app.MapGet("/features", (IOptionsMonitor<FeatureFlags> monitor) =>
    Results.Ok(monitor.CurrentValue));

app.Run();

public class DatabaseOptions
{
    [Required]
    public string Host { get; set; } = "";

    [Range(1, 65535)]
    public int Port { get; set; } = 5432;
}

public class FeatureFlags
{
    public bool EnableNewDashboard { get; set; }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In what order do ASP.NET Core configuration providers apply, and which wins?',
      options: [
        'Environment variables override everything; appsettings.json is ignored if env vars exist',
        'appsettings.json is base → appsettings.{Env}.json → user secrets → env vars → CLI args; later sources win',
        'CLI args are lowest priority; env vars override everything else',
        'All providers merge; conflicts cause a startup exception',
      ],
      answer: 1,
      explanation: 'Providers are stacked: <code>appsettings.json</code> (lowest) → <code>appsettings.{Env}.json</code> → user secrets (Dev) → environment variables → command-line arguments (highest). A key present in a later provider shadows the same key from earlier providers.',
    },
    {
      q: 'Which IOptions variant should you use in a background service (Singleton) that needs to react to configuration file changes?',
      options: [
        'IOptions<T> — it is singleton and safe',
        'IOptionsSnapshot<T> — it re-reads per call',
        'IOptionsMonitor<T> — singleton with OnChange() and always-current CurrentValue',
        'IConfiguration directly — bypasses the options pattern',
      ],
      answer: 2,
      explanation: '<code>IOptionsMonitor&lt;T&gt;</code> is designed for singletons and background services. <code>CurrentValue</code> always reflects the latest loaded config, and <code>OnChange()</code> lets you react to reloads. Never inject <code>IOptionsSnapshot&lt;T&gt;</code> into a singleton — it is Scoped and creates a captive dependency.',
    },
    {
      q: 'How do you represent the nested key "Database:Host" as an environment variable?',
      options: [
        'Database.Host',
        'DATABASE_HOST',
        'Database__Host  (double underscore)',
        'Database-Host',
      ],
      answer: 2,
      explanation: 'Colons are not valid in environment variable names on most platforms. ASP.NET Core maps <code>__</code> (double underscore) to <code>:</code> in the configuration key hierarchy. So <code>Database__Host=prod-db</code> is read as <code>Database:Host</code>.',
    },
    {
      q: 'What does ValidateOnStart() add compared to ValidateDataAnnotations() alone?',
      options: [
        'It adds more annotation types beyond [Required] and [Range]',
        'It triggers validation eagerly at startup; without it, validation runs lazily on first IOptions<T>.Value access',
        'It makes the app crash-safe by logging errors instead of throwing',
        'It is required to register the validator — without it annotations are ignored',
      ],
      answer: 1,
      explanation: '<code>ValidateDataAnnotations()</code> registers the validation logic. Without <code>ValidateOnStart()</code>, it runs the first time <code>IOptions&lt;T&gt;.Value</code> is accessed — which could be on the first HTTP request in Production. <code>ValidateOnStart()</code> forces the check during the startup phase, making a misconfigured app fail fast before accepting any traffic.',
    },
    {
      q: 'Why should secrets never be stored in appsettings.json?',
      options: [
        'appsettings.json does not support string values long enough for secrets',
        'appsettings.json is committed to source control; secrets stored there are exposed to anyone with repo access',
        'ASP.NET Core cannot read secrets from appsettings.json due to encryption requirements',
        'Secrets in appsettings.json are overridden by environment variables and never read',
      ],
      answer: 1,
      explanation: '<code>appsettings.json</code> is part of your source tree. Storing secrets there means they end up in Git history and are visible to every developer, CI system, and anyone who can read the repo. Use user-secrets locally and environment variables or a secrets manager (Key Vault, AWS Secrets Manager) in deployed environments.',
    },
    {
      q: 'What is the effect of calling PostConfigure<T>() after Configure<T>()?',
      options: [
        'It replaces the Configure<T> call entirely',
        'It runs after all Configure<T> callbacks, allowing computed defaults or overrides to be applied last',
        'It disables hot-reload for that options type',
        'It only runs in the Development environment',
      ],
      answer: 1,
      explanation: '<code>PostConfigure&lt;T&gt;()</code> is guaranteed to run after all <code>Configure&lt;T&gt;</code> registrations for that type. This makes it ideal for computing derived values (e.g., a full connection string assembled from host + port + database name) or applying cross-cutting defaults that should not be overridable by earlier registrations.',
    },
    {
      q: 'What does IOptionsSnapshot<T> do that IOptions<T> does not?',
      options: [
        'IOptionsSnapshot<T> is singleton and never reloads; IOptions<T> reloads per request',
        'IOptionsSnapshot<T> is scoped and re-reads config once per request, picking up hot-reloaded values',
        'IOptionsSnapshot<T> validates options at startup; IOptions<T> validates on first access',
        'IOptionsSnapshot<T> supports named options; IOptions<T> does not',
      ],
      answer: 1,
      explanation: '<code>IOptionsSnapshot&lt;T&gt;</code> is registered as Scoped — it reads the current configuration once per request. If a file-based provider has reloaded (e.g., appsettings.json changed), the new values are picked up at the next request boundary. <code>IOptions&lt;T&gt;</code> is Singleton and takes a snapshot at startup that never updates.',
    },
    {
      q: 'Why is it wrong to inject IOptionsSnapshot<T> into a Singleton service?',
      options: [
        'Singletons cannot use generic types',
        'A Scoped service injected into a Singleton is captured for the Singleton\'s lifetime — the Scoped service never re-resolves, creating a captive dependency',
        'IOptionsSnapshot<T> throws an exception when resolved inside a Singleton',
        'Singleton services cannot read configuration in ASP.NET Core',
      ],
      answer: 1,
      explanation: 'A Singleton service is created once and held for the application lifetime. If it captures a Scoped dependency at construction, that dependency also lives forever — it is never re-resolved, defeating the purpose of Scoped lifetime. In Development, ASP.NET Core\'s scope validation throws <code>InvalidOperationException</code> to catch this mistake. Use <code>IOptionsMonitor&lt;T&gt;</code> (Singleton-safe) instead.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between Configure<T>() and AddOptions<T>().BindConfiguration()?',
      a: '<code>services.Configure&lt;T&gt;(section)</code> is the short form — it binds the section and registers all three <code>IOptions</code> variants. <code>services.AddOptions&lt;T&gt;().BindConfiguration("key")</code> returns an <code>OptionsBuilder&lt;T&gt;</code> that lets you chain <code>.ValidateDataAnnotations()</code>, <code>.ValidateOnStart()</code>, and <code>.PostConfigure()</code> for more control. Use the chain form whenever you need validation.',
    },
    {
      q: 'Can I bind a config section to a record instead of a class?',
      a: 'Yes. <code>services.Configure&lt;SmtpOptions&gt;(section)</code> uses <code>IConfiguration.Bind()</code> under the hood, which supports records with init-only properties or primary constructors (.NET 8+). The properties must be writable (init or set). Fully immutable records work if your record uses a constructor with parameters that match the JSON keys by name (case-insensitive).',
    },
    {
      q: 'How do I read configuration values during service registration before Build() is called?',
      a: 'Use <code>builder.Configuration</code> in the builder phase. For example: <code>string url = builder.Configuration["ExternalApi:Url"]!;</code> then pass it to a factory: <code>builder.Services.AddHttpClient("api", c => c.BaseAddress = new Uri(url));</code>. The configuration is fully built at this point (all providers are loaded), so all values are available.',
    },
    {
      q: 'What happens when a required option property is missing from all config sources?',
      a: 'With <code>ValidateDataAnnotations()</code> alone, nothing happens until <code>IOptions&lt;T&gt;.Value</code> is first accessed — at that point an <code>OptionsValidationException</code> is thrown. With <code>ValidateOnStart()</code> the exception is thrown during startup before the host begins accepting requests, which is the preferred behaviour — fail fast on misconfiguration.',
    },
    {
      q: 'How do named options work?',
      a: '<code>services.Configure&lt;SmtpOptions&gt;("primary", section1)</code> and <code>services.Configure&lt;SmtpOptions&gt;("backup", section2)</code> register two named instances. Inject <code>IOptionsMonitor&lt;SmtpOptions&gt;</code> and access them by name: <code>monitor.Get("primary")</code>. This is useful when one service type has multiple instances — e.g., multiple SMTP servers or multiple database connections sharing one options class.',
    },
    {
      q: 'When are environment-variable config values refreshed?',
      a: 'Environment variables are read once at startup when the configuration providers are built. They do not hot-reload — if you change an environment variable while the app is running, you must restart the process. Only file-based providers (appsettings.json) support hot-reload via the file watcher. For runtime-changing values, use a database, a distributed cache, or a Key Vault provider configured with a polling interval.',
    },
    {
      q: 'How do you supply a configuration value that differs between two instances of the same options class?',
      a: 'Use <strong>named options</strong>. <code>services.Configure&lt;SmtpOptions&gt;("primary", section1)</code> and <code>services.Configure&lt;SmtpOptions&gt;("backup", section2)</code> register two named instances. Inject <code>IOptionsMonitor&lt;SmtpOptions&gt;</code> and retrieve by name: <code>monitor.Get("primary")</code> or <code>monitor.Get("backup")</code>. Named options let you reuse one strongly-typed class for multiple config blocks — common for multi-tenant databases or multiple external service endpoints.',
    },
    {
      q: 'Can configuration providers be ordered or replaced after the app starts?',
      a: 'No — providers are built once when <code>WebApplication.CreateBuilder()</code> calls <code>builder.Configuration.Build()</code> internally. The order is fixed at startup. If you need runtime-updateable values you must either use a provider that supports hot-reload (file-based, Azure App Configuration), poll an external store (Key Vault), or push updates via a message bus into your own in-memory cache accessible through a singleton service.',
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Raw IConfiguration access vs strongly-typed options',
      before: `// Fragile: typo in key name compiles; null not handled
public class EmailService(IConfiguration config)
{
    public Task SendAsync(string to)
    {
        var host = config["Smpt:Host"];           // typo — compiles, null at runtime
        var port = int.Parse(config["Smtp:Port"]!); // throws if key missing
        Console.WriteLine(\$"Sending via {host}:{port}");
        return Task.CompletedTask;
    }
}`,
      after: `// Strongly-typed: one registration, compile-time safety, no string keys
public class SmtpOptions { public string Host { get; set; } = ""; public int Port { get; set; } = 587; }

// Program.cs — register once:
builder.Services.AddOptions<SmtpOptions>().BindConfiguration("Smtp").ValidateOnStart();

// Service — typed POCO, no null risk:
public class EmailService(IOptions<SmtpOptions> opts)
{
    public Task SendAsync(string to)
    {
        Console.WriteLine(\$"Sending via {opts.Value.Host}:{opts.Value.Port}");
        return Task.CompletedTask;
    }
}`,
      note: 'The options pattern moves config coupling to one registration point. Typos become compile errors (or validation errors at startup), and consuming classes depend on a typed POCO rather than magic strings.',
    },
    {
      title: 'Lazy validation vs ValidateOnStart',
      before: `// Validation runs on first access — error surfaces in production
builder.Services
    .AddOptions<JwtOptions>()
    .BindConfiguration("Jwt")
    .ValidateDataAnnotations(); // no ValidateOnStart

// App starts fine even with missing Jwt:Secret
// First POST /login → OptionsValidationException → 500 in production`,
      after: `// ValidateOnStart fails the process before accepting any requests
builder.Services
    .AddOptions<JwtOptions>()
    .BindConfiguration("Jwt")
    .ValidateDataAnnotations()
    .ValidateOnStart();  // throws at startup: "Jwt:Secret is required"

// App startup fails with a clear message — fix config, redeploy, no 500s`,
      note: 'ValidateOnStart makes a misconfigured app fail immediately with a descriptive message rather than surfacing as a cryptic 500 on the first production request. Always use it alongside ValidateDataAnnotations().',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Injecting IOptionsSnapshot<T> into a Singleton service',
      wrong: `// BUG: IOptionsSnapshot is Scoped — captures once and never reloads in a Singleton
public class TokenService(IOptionsSnapshot<JwtOptions> opts) { ... }
builder.Services.AddSingleton<TokenService>(); // scope validation throws in Dev`,
      right: `// IOptionsMonitor is Singleton-safe and always has current values
public class TokenService(IOptionsMonitor<JwtOptions> opts)
{
    public string Issuer => opts.CurrentValue.Issuer;
}
builder.Services.AddSingleton<TokenService>();`,
      explanation: 'IOptionsSnapshot<T> is Scoped — injecting it into a Singleton creates a captive dependency that never re-resolves. ASP.NET Core throws InvalidOperationException in Development when scope validation is enabled. Use IOptionsMonitor<T> in Singletons and background services.',
    },
    {
      title: 'Skipping ValidateOnStart() — discovering bad config on the first request',
      wrong: `builder.Services
    .AddOptions<DatabaseOptions>()
    .BindConfiguration("Database")
    .ValidateDataAnnotations();   // lazy — validates on first IOptions<T>.Value access
// If "Database:Host" is missing, Production gets a 500 on the first user request`,
      right: `builder.Services
    .AddOptions<DatabaseOptions>()
    .BindConfiguration("Database")
    .ValidateDataAnnotations()
    .ValidateOnStart();   // throws during startup before accepting any traffic`,
      explanation: 'Without ValidateOnStart(), DataAnnotations validation is lazy — it fires on the first IOptions<T>.Value access, which is typically on the first HTTP request in Production. ValidateOnStart() makes the app refuse to start with a clear error message, preventing bad config from reaching users.',
    },
    {
      title: 'Using ":" in environment variable names on Linux/Docker',
      wrong: `# Linux shell: colon in variable names is invalid / ignored
export Database:Host=prod-db   # syntax error on bash
# Or in docker-compose:
  environment:
    - Database:Host=prod-db     # silently ignored on Linux`,
      right: `# Use double underscore — ASP.NET Core maps __ to :
export Database__Host=prod-db   # correctly maps to Database:Host in code
# docker-compose:
  environment:
    - Database__Host=prod-db`,
      explanation: 'Colons are not valid characters in environment variable names on Linux and macOS. ASP.NET Core\'s environment variable provider maps double underscores (__) to colons (:) in configuration keys. Using : in Docker or Kubernetes config files silently fails — the variable is never set, and the configuration falls back to the default or missing value.',
    },
    {
      title: 'Storing secrets in appsettings.json and committing to source control',
      wrong: `// appsettings.json (COMMITTED TO GIT)
{
  "Jwt": {
    "Secret": "my-super-secret-signing-key-12345"  // ← exposed to every dev and CI system
  }
}`,
      right: `// Development: use user-secrets (stored outside the repo)
// dotnet user-secrets set "Jwt:Secret" "my-super-secret-signing-key-12345"

// Production: inject via environment variable or Key Vault
// ASPNETCORE_Jwt__Secret=... (env var in Docker/Kubernetes)`,
      explanation: 'appsettings.json is tracked by Git. Any secret stored there is immediately exposed to anyone with repo access, appears in pull request diffs, and persists in Git history even after deletion. Use dotnet user-secrets for local development and environment variables or a secrets manager for every deployed environment.',
    },
    {
      title: 'Reading IConfiguration directly in handlers instead of using IOptions<T>',
      wrong: `// BUG: reads config string on every request — no type safety, no caching
app.MapGet("/timeout", (IConfiguration config) =>
    int.Parse(config["Http:TimeoutSeconds"]!));   // throws if missing; not validated at startup`,
      right: `// Register at startup
builder.Services.AddOptions<HttpOptions>()
    .BindConfiguration("Http")
    .ValidateDataAnnotations()
    .ValidateOnStart();

// Inject typed, validated, cached options
app.MapGet("/timeout", (IOptions<HttpOptions> opts) => opts.Value.TimeoutSeconds);`,
      explanation: 'Injecting IConfiguration into handlers bypasses the Options pattern: no type safety, no startup validation, no caching. Every request parses a raw string. IOptions<T> binds the section once, validates at startup, and provides a strongly-typed POCO — the right tool for all non-trivial configuration.',
    },
    {
      title: 'Forgetting that environment-specific appsettings files must match the ASPNETCORE_ENVIRONMENT value exactly',
      wrong: `// File: appsettings.production.json   ← lowercase 'p'
// Environment variable: ASPNETCORE_ENVIRONMENT=Production  ← capital 'P'
// Result: file is never loaded — ASP.NET Core does a case-sensitive match on the file name`,
      right: `// File: appsettings.Production.json   ← matches ASPNETCORE_ENVIRONMENT exactly
// The match is case-sensitive on Linux — use exact casing in the filename`,
      explanation: 'On Linux (and in Docker) the file system is case-sensitive. appsettings.Production.json and appsettings.production.json are different files. ASPNETCORE_ENVIRONMENT=Production will only load appsettings.Production.json. On Windows this bug hides because the file system is case-insensitive — it surfaces only in production Linux containers.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ASP.NET Core configuration layers providers (JSON → env vars → CLI args) into a unified IConfiguration; the Options pattern binds sections to typed classes with three lifetime variants — IOptions (startup snapshot), IOptionsSnapshot (per-request reload), IOptionsMonitor (singleton with live updates).',
    mustKnow: [
      'Provider order: appsettings.json → appsettings.{Env}.json → user secrets → env vars → CLI args — later wins',
      'Nested keys use <code>:</code> in code and JSON; use <code>__</code> (double underscore) in environment variables',
      '<code>IOptions&lt;T&gt;</code> Singleton/snapshot; <code>IOptionsSnapshot&lt;T&gt;</code> Scoped/per-request; <code>IOptionsMonitor&lt;T&gt;</code> Singleton/live',
      'Never inject <code>IOptionsSnapshot&lt;T&gt;</code> into a Singleton — captive dependency, throws in Dev',
      '<code>ValidateOnStart()</code> enforces eager validation at startup; without it, bad config surfaces on the first request',
      'Secrets: user secrets in Dev (outside repo), environment variables or Key Vault in Production — never appsettings.json',
      '<code>PostConfigure&lt;T&gt;</code> runs after all Configure registrations — use for computed defaults or cross-cutting overrides',
    ],
    interviewFocus: [
      'What is the difference between IOptions, IOptionsSnapshot, and IOptionsMonitor?',
      'Why is injecting IOptionsSnapshot into a Singleton a bug? What should you use instead?',
      'How do you represent the nested key "Database:Host" as an environment variable?',
      'Why should ValidateOnStart() be used in production apps?',
      'How do named options work, and when would you use them?',
    ],
  };
}
