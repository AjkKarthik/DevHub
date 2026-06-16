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
  selector: 'app-aspnet-secrets',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './secrets.html',
  styleUrl: './secrets.scss',
})
export class AspnetSecrets {

  prerequisites: Prerequisite[] = [
    { label: 'Configuration',   route: '/aspnet/configuration' },
    { label: 'Web Security',    route: '/aspnet/web-security' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'dotnet user-secrets',       type: 'keyword', desc: 'CLI tool: store dev secrets outside the project tree, never committed' },
    { name: 'AddUserSecrets<T>()',        type: 'method',  desc: 'Add user secrets source to IConfiguration in development' },
    { name: 'AddEnvironmentVariables()',  type: 'method',  desc: 'Read secrets from env vars — standard in containers/CI' },
    { name: 'AddAzureKeyVault()',         type: 'method',  desc: 'Pull secrets from Azure Key Vault into IConfiguration at startup' },
    { name: 'IDataProtector',            type: 'interface', desc: 'ASP.NET Core Data Protection — encrypt/decrypt your own payloads' },
    { name: 'AddDataProtection()',        type: 'method',  desc: 'Register Data Protection and configure key ring storage' },
    { name: 'PersistKeysToStackExchangeRedis()', type: 'method', desc: 'Share Data Protection keys across pods via Redis' },
    { name: 'ProtectCookies()',           type: 'method',  desc: 'Encrypt cookies using Data Protection (default for cookie auth)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Never Commit Secrets',
      points: [
        'The cardinal rule: secrets — database connection strings, API keys, JWT signing keys, OAuth client secrets — must never appear in source-controlled files. A committed secret leaks to everyone with repo access and is permanent in git history even after removal.',
        'The layered configuration system provides the solution: <code>appsettings.json</code> contains non-sensitive defaults; <code>appsettings.Development.json</code> contains dev overrides (committed); secrets come from the environment (env vars, user secrets, key vault) — not from files.',
        'In production, secrets are injected via environment variables or a vault. The app reads them through <code>IConfiguration</code> without knowing the source. You can rotate a secret by updating the env var and restarting — no code change required.',
        'Add <code>appsettings.*.json</code> and <code>*.env</code> files to <code>.gitignore</code>. Add <code>secrets.json</code> to the global gitignore. Use pre-commit hooks (e.g., git-secrets, truffleHog) to scan for common secret patterns before each commit.',
        'Secret detection in CI: GitHub Advanced Security, GitGuardian, and Semgrep SAST can scan every push and pull request for secrets in code and commit history. Enable these in your repository settings — they catch secrets that slip through local hooks.',
        '<strong>Rotate on exposure</strong>: if a secret is committed, even briefly, assume it is compromised. Rotate immediately, then clean history. History rewriting (git filter-branch / BFG) does not guarantee removal from forks or any clone made before the rewrite.',
      ],
    },
    {
      heading: 'Development: User Secrets',
      points: [
        'User secrets store per-developer secrets in the OS user profile (<code>%APPDATA%\\Microsoft\\UserSecrets\\{userSecretsId}\\secrets.json</code> on Windows) — outside the project directory. They are never committed.',
        'Enable with <code>dotnet user-secrets init</code> (adds <code>UserSecretsId</code> to the .csproj). Set with <code>dotnet user-secrets set "Jwt:Key" "dev-key-value"</code>. Access via <code>IConfiguration["Jwt:Key"]</code> — no code change needed.',
        'In ASP.NET Core, <code>WebApplication.CreateBuilder()</code> adds user secrets automatically in the Development environment. For other host types, call <code>config.AddUserSecrets&lt;Program&gt;()</code>.',
        'User secrets support the same hierarchical key format as appsettings.json: <code>dotnet user-secrets set "Jwt:Key" "value"</code> creates the nested structure. List all secrets with <code>dotnet user-secrets list</code>; remove one with <code>dotnet user-secrets remove "Jwt:Key"</code>.',
        'Each developer has their own isolated secrets file keyed by the project\'s <code>UserSecretsId</code>. Team members can set different values — useful for different local database names or dev API keys. The secrets file is also useful in CI if injected from a secret store.',
        'Never use production secrets in user secrets. Dev secrets should be low-risk values (local DB, sandbox API keys). Production credentials only live in the production vault — shared by CI/CD pipelines, not individual developers.',
      ],
    },
    {
      heading: 'Production: Environment Variables & Key Vault',
      points: [
        'Environment variables are the standard secret mechanism for containers and CI/CD. Set in Docker Compose (<code>environment:</code>), Kubernetes Secrets (<code>envFrom</code>), or GitHub Actions (<code>env:</code>). ASP.NET Core maps <code>JWT__KEY</code> (double underscore for nesting) to <code>IConfiguration["Jwt:Key"]</code>.',
        'For sensitive secrets at scale, use a vault: <strong>Azure Key Vault</strong> with <code>AddAzureKeyVault()</code> + Managed Identity (no credentials needed), <strong>AWS Secrets Manager</strong> with the AWS provider, or HashiCorp Vault. Secrets are loaded into IConfiguration at startup.',
        'Managed Identity (Azure) means the app authenticates to Key Vault with its Azure identity — no client ID or secret needed in the app. This closes the "secret to retrieve secrets" bootstrap problem.',
        'Key Vault secrets use dashes in names (Key Vault does not allow colons): <code>Jwt--Key</code> maps to <code>IConfiguration["Jwt:Key"]</code>. The <code>AddAzureKeyVault()</code> provider handles this mapping automatically.',
        '<strong>Fail fast on missing config</strong>: validate required values at startup rather than failing later with cryptic NullReferenceException. Use <code>builder.Configuration["Key"] ?? throw new InvalidOperationException("Key is missing")</code> or Options validation with <code>.ValidateOnStart()</code>.',
        'Secret rotation: plan for regular rotation without downtime. Azure Key Vault supports versioned secrets — the app always reads the current version. For zero-downtime rotation, support two valid signing keys simultaneously (old + new) during the transition window.',
      ],
    },
    {
      heading: 'ASP.NET Core Data Protection',
      points: [
        'Data Protection is the cryptographic subsystem behind cookie encryption, antiforgery tokens, and <code>IDataProtector</code>. It manages a key ring — a rotating set of encryption keys with expiry dates.',
        'By default, keys are stored in the user profile on the local machine — they do not survive pod restarts or multi-server deployments. In production, persist the key ring to a shared store: <code>PersistKeysToStackExchangeRedis()</code>, <code>PersistKeysToAzureBlobStorage()</code>, or a database.',
        'Protect your own payloads with <code>IDataProtector</code>: <code>var token = protector.Protect("user:42")</code> encrypts and authenticates the string. <code>protector.Unprotect(token)</code> verifies and decrypts. Tokens are tied to the purpose string — a token from one purpose cannot be decrypted with another.',
        'Keys are protected at rest using the platform default (Windows DPAPI, Linux file permissions) unless you add an explicit key encryption provider. In production, encrypt keys at rest using <code>ProtectKeysWithAzureKeyVault()</code> or <code>ProtectKeysWithCertificate()</code>.',
        '<code>SetApplicationName("myapp")</code> must match across all pods and deployments. Without it, ASP.NET Core uses the application path as the discriminator — different deployment paths produce different names and incompatible keys between pods.',
        '<code>ITimeLimitedDataProtector</code> creates tokens with built-in expiry: <code>protector.ToTimeLimitedDataProtector().Protect(payload, TimeSpan.FromHours(24))</code>. Perfect for email confirmation and password reset links. Unprotect() throws <code>SecurityTokenExpiredException</code> if the token is past its lifetime.',
      ],
    },
    {
      heading: 'Options Validation & Typed Configuration',
      points: [
        'Bind configuration sections to strongly-typed classes with <code>builder.Services.Configure&lt;JwtOptions&gt;(builder.Configuration.GetSection("Jwt"))</code>. Inject <code>IOptions&lt;JwtOptions&gt;</code>, <code>IOptionsSnapshot&lt;T&gt;</code> (per-request, supports live reload), or <code>IOptionsMonitor&lt;T&gt;</code> (singleton with change notification).',
        'Add startup validation with <code>.AddOptions&lt;JwtOptions&gt;().BindConfiguration("Jwt").ValidateDataAnnotations().ValidateOnStart()</code>. Data annotations on the options class (<code>[Required]</code>, <code>[MinLength(32)]</code>) are evaluated before the app starts, producing clear error messages.',
        'Implement <code>IValidateOptions&lt;T&gt;</code> for complex cross-property validation that annotations cannot express — e.g., "if Auth scheme is Cookie, CookieOptions must be set; if JWT, JwtOptions must be set." Return <code>ValidateOptionsResult.Fail("reason")</code> to block startup.',
        'Keep options classes minimal and focused on configuration shapes — no methods, no DI. Computed properties derived from config values (e.g., <code>SigningKey</code> computed from <code>KeyBytes</code>) are acceptable but must be read-only.',
        'Use <code>IOptionsMonitor&lt;T&gt;.OnChange()</code> to react to configuration changes without restarting. This works with file-based providers (appsettings.json) and environment variable providers that support reload. Useful for feature flags and non-secret config.',
        'Never inject <code>IConfiguration</code> deep into services — bind at the composition root (<code>Program.cs</code>), expose typed options via DI, and inject <code>IOptions&lt;T&gt;</code>. This makes configuration dependencies explicit and testable.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'User Secrets (Dev)',
      language: 'csharp',
      code: `// 1. Initialize user secrets (one time per project)
// dotnet user-secrets init

// 2. Set a secret
// dotnet user-secrets set "Jwt:Key" "my-super-secret-dev-key"
// dotnet user-secrets set "ConnectionStrings:Default" "Server=localhost;..."

// 3. List secrets
// dotnet user-secrets list

// 4. Remove a secret
// dotnet user-secrets remove "Jwt:Key"

// In code — read exactly the same as appsettings.json
var jwtKey = builder.Configuration["Jwt:Key"];    // from user secrets in dev
var connStr = builder.Configuration.GetConnectionString("Default");

// WebApplication.CreateBuilder() adds user secrets automatically in Development.
// For non-web hosts:
builder.Configuration.AddUserSecrets<Program>();`,
    },
    {
      label: 'Environment Variables',
      language: 'csharp',
      code: `// Environment variable naming: use __ (double underscore) for hierarchy
// Jwt__Key=my-key  →  IConfiguration["Jwt:Key"]
// ConnectionStrings__Default=...  →  GetConnectionString("Default")

// ASP.NET Core adds env vars automatically. For explicit control:
builder.Configuration
    .AddJsonFile("appsettings.json", optional: false)
    .AddJsonFile(\`appsettings.\${builder.Environment.EnvironmentName}.json\`, optional: true)
    .AddEnvironmentVariables()    // overrides appsettings with env vars
    .AddUserSecrets<Program>(optional: true);   // dev only

// Docker Compose:
// environment:
//   - Jwt__Key=\${JWT_KEY}
//   - ConnectionStrings__Default=\${DB_CONN}

// Kubernetes Secret:
// envFrom:
//   - secretRef:
//       name: myapp-secrets`,
    },
    {
      label: 'Azure Key Vault',
      language: 'csharp',
      code: `// NuGet: Azure.Extensions.AspNetCore.Configuration.Secrets
//        Azure.Identity

// Configuration source (loads all secrets into IConfiguration)
if (!builder.Environment.IsDevelopment())
{
    var kvUri = new Uri(builder.Configuration["KeyVault:Uri"]!);
    builder.Configuration.AddAzureKeyVault(
        kvUri,
        new DefaultAzureCredential());   // uses Managed Identity in Azure
}

// Secrets in Key Vault are named with dashes: "Jwt--Key" → "Jwt:Key"
// (Key Vault doesn't support : in names; the provider maps -- → :)
var jwtKey = builder.Configuration["Jwt:Key"];   // loaded from vault

// Access typed options as usual — no special handling needed
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));

record JwtOptions(string Key, string Issuer, string Audience);`,
    },
    {
      label: 'Data Protection Setup',
      language: 'csharp',
      code: `// NuGet: Microsoft.AspNetCore.DataProtection.StackExchangeRedis

// Configure Data Protection for multi-pod deployments
builder.Services
    .AddDataProtection()
    .SetApplicationName("myapp")            // must match across all pods
    .PersistKeysToStackExchangeRedis(       // share key ring via Redis
        ConnectionMultiplexer.Connect(builder.Configuration["Redis:Connection"]!),
        "DataProtection-Keys")
    .ProtectKeysWithAzureKeyVault(          // encrypt keys at rest
        new Uri(builder.Configuration["KeyVault:DataProtectionKeyUri"]!),
        new DefaultAzureCredential())
    .SetDefaultKeyLifetime(TimeSpan.FromDays(90));

// Azure Blob Storage alternative (no Redis needed):
// .PersistKeysToAzureBlobStorage(blobUri, new DefaultAzureCredential())`,
    },
    {
      label: 'IDataProtector (Custom Tokens)',
      language: 'csharp',
      code: `// Use IDataProtector to encrypt your own payloads
builder.Services.AddDataProtection().SetApplicationName("myapp");

// In a service — inject IDataProtectionProvider
public class TokenService(IDataProtectionProvider dpProvider)
{
    // Purpose string isolates tokens — tokens from one purpose cannot be
    // decrypted by a protector with a different purpose
    private readonly IDataProtector _protector =
        dpProvider.CreateProtector("email-confirmation");

    public string CreateToken(string userId)
        => _protector.Protect(userId);

    public string? ValidateToken(string token)
    {
        try   { return _protector.Unprotect(token); }
        catch { return null; }   // invalid or expired
    }
}

// Time-limited tokens — expire after 24 hours
public class TimedTokenService(IDataProtectionProvider dpProvider)
{
    private readonly ITimeLimitedDataProtector _protector =
        dpProvider.CreateProtector("password-reset")
                  .ToTimeLimitedDataProtector();

    public string CreateToken(string userId)
        => _protector.Protect(userId, lifetime: TimeSpan.FromHours(24));

    public string? Validate(string token)
    {
        try   { return _protector.Unprotect(token); }
        catch { return null; }
    }
}`,
    },
  ];

  challenge: Challenge = {
    title: 'Secure Configuration Setup',
    language: 'csharp',
    description: 'Wire up secure configuration for a JWT API. Requirements: (1) Use user secrets in Development for "Jwt:Key", "Jwt:Issuer", "Jwt:Audience". (2) In non-Development, fall back to environment variables (JWT__KEY, JWT__ISSUER, JWT__AUDIENCE). (3) Validate that all three values are present at startup — throw if any are missing. (4) Add Data Protection with SetApplicationName("my-api"). (5) Create a minimal POST /email-confirm/generate endpoint that uses IDataProtector with purpose "email-confirm" to protect a userId and returns the token. Add GET /email-confirm/validate/{token} that unprotects and returns the userId.',
    hints: [
      'dotnet user-secrets set "Jwt:Key" "dev-secret" in dev',
      'builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key missing")',
      'IDataProtectionProvider.CreateProtector("email-confirm") for the protector',
      'try/catch around Unprotect() — invalid token throws CryptographicException',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);

// TODO: AddUserSecrets in dev; env vars in prod
// TODO: validate Jwt:Key, Jwt:Issuer, Jwt:Audience exist at startup
// TODO: AddDataProtection with application name "my-api"

var app = builder.Build();

// TODO: POST /email-confirm/generate — accepts { userId }, returns { token }
// TODO: GET /email-confirm/validate/{token} — returns { userId } or 400

app.Run();`,
    solution: `var builder = WebApplication.CreateBuilder(args);

// Configuration layering
builder.Configuration
    .AddJsonFile("appsettings.json", optional: false)
    .AddEnvironmentVariables()
    .AddUserSecrets<Program>(optional: !builder.Environment.IsDevelopment());

// Validate required secrets at startup (fail fast)
var jwtKey     = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not configured.");
var jwtIssuer  = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Jwt:Audience is not configured.");

// Data Protection
builder.Services
    .AddDataProtection()
    .SetApplicationName("my-api");

var app = builder.Build();

app.MapPost("/email-confirm/generate", (
    UserIdRequest req, IDataProtectionProvider dpProvider) =>
{
    var token = dpProvider.CreateProtector("email-confirm").Protect(req.UserId);
    return Results.Ok(new { Token = token });
});

app.MapGet("/email-confirm/validate/{token}", (
    string token, IDataProtectionProvider dpProvider) =>
{
    try
    {
        var userId = dpProvider.CreateProtector("email-confirm").Unprotect(token);
        return Results.Ok(new { UserId = userId });
    }
    catch
    {
        return Results.BadRequest(new { Error = "Invalid or expired token." });
    }
});

app.Run();
record UserIdRequest(string UserId);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Where are user secrets stored?',
      options: [
        'In the project directory as secrets.json',
        'In the OS user profile directory, outside the project',
        'In the .git directory',
        'In appsettings.Development.json',
      ],
      answer: 1,
      explanation: 'User secrets are stored in %APPDATA%\\Microsoft\\UserSecrets\\{id}\\secrets.json (Windows) or ~/.microsoft/usersecrets/{id}/secrets.json (Linux/macOS) — completely outside the project folder. This prevents accidental commits.',
    },
    {
      q: 'How do you map environment variable JWT__KEY to IConfiguration["Jwt:Key"]?',
      options: [
        'It does not work — you must use Jwt:Key as the env var name',
        'Double underscore (__) in the env var name maps to a colon (:) in IConfiguration',
        'Single underscore (_) is the separator',
        'Use ASPNETCORE_ prefix: ASPNETCORE_JWT_KEY',
      ],
      answer: 1,
      explanation: 'ASP.NET Core maps __ (double underscore) to : in the configuration key hierarchy. JWT__KEY maps to Jwt:Key. This allows hierarchical configuration sections in environments where colons are illegal in variable names (most shells).',
    },
    {
      q: 'What does Data Protection do in ASP.NET Core?',
      options: [
        'It encrypts database connections',
        'It manages a key ring used for encrypting cookies, antiforgery tokens, and custom payloads',
        'It validates JWT tokens',
        'It hashes user passwords',
      ],
      answer: 1,
      explanation: 'Data Protection is the cryptographic subsystem behind cookie auth encryption, antiforgery token validation, and the IDataProtector API. It manages rotating encryption keys. In multi-server deployments, keys must be shared or cookies issued by one pod cannot be decrypted by another.',
    },
    {
      q: 'What is the "secret to retrieve secrets" problem, and how does Managed Identity solve it?',
      options: [
        'You need to know the vault URI before startup — Managed Identity provides it',
        'To call a vault you need a credential, but that credential is itself a secret. Managed Identity lets the app authenticate with its Azure identity — no credential needed',
        'Managed Identity generates a one-time key on each startup',
        'The problem is solved by storing the key in appsettings.json',
      ],
      answer: 1,
      explanation: 'If you store the vault client secret in a config file to access the vault, you have a circular problem. Managed Identity gives the Azure VM/App Service/AKS pod an identity that Azure AD recognises — the app authenticates to Key Vault with that identity. No secret needed in the app itself.',
    },
    {
      q: 'What happens if ASP.NET Core Data Protection keys are not shared across pods?',
      options: [
        'Performance degrades slightly',
        'Pods cannot decrypt cookies or antiforgery tokens issued by other pods — users see random logouts and 400 errors',
        'The app falls back to unsigned cookies',
        'Nothing — ASP.NET Core syncs keys automatically',
      ],
      answer: 1,
      explanation: 'Each pod generates its own key ring. Cookie auth tokens and antiforgery tokens are encrypted with the issuing pod\'s key. If a different pod handles the next request, it cannot decrypt the cookie — the user appears unauthenticated. This manifests as random logouts in multi-pod deployments.',
    },
    {
      q: 'What does the purpose string in IDataProtector.CreateProtector() do?',
      options: [
        'It sets the encryption algorithm',
        'It scopes the protector — tokens from one purpose cannot be unprotected by a protector with a different purpose',
        'It sets the token expiry duration',
        'It names the key in the key ring',
      ],
      answer: 1,
      explanation: 'The purpose string is an isolation mechanism. A token encrypted by CreateProtector("email-confirm") cannot be decrypted by CreateProtector("password-reset") — even though both use the same underlying key ring. This prevents token reuse across different features.',
    },
    {
      q: 'Which IOptions<T> variant should you use in a Singleton service when configuration must stay current between requests?',
      options: [
        'IOptions<T> — it is always fresh',
        'IOptionsMonitor<T> — it reflects live configuration changes and is safe for Singleton',
        'IOptionsSnapshot<T> — it is scoped per-request',
        'All three are equivalent in Singleton services',
      ],
      answer: 1,
      explanation: 'IOptions<T> is a Singleton cached at startup — config changes after startup are not reflected. IOptionsSnapshot<T> is Scoped and cannot be injected into Singleton services (scope violation). IOptionsMonitor<T> is Singleton-safe and reflects live configuration changes via its OnChange callback.',
    },
    {
      q: 'How should you validate that required configuration values exist in ASP.NET Core?',
      options: [
        'Read the value at the endpoint that first uses it and return 500 if null',
        'Use ValidateOnStart() with Options validation to fail at startup with a clear error before any requests are handled',
        'Add a health check that verifies config values',
        'Trust that IConfiguration always returns a value for registered keys',
      ],
      answer: 1,
      explanation: 'Fail fast: validate at startup before handling any requests. Use .AddOptions<MyOptions>().BindConfiguration("Section").ValidateDataAnnotations().ValidateOnStart(). This produces a clear InvalidOperationException at startup listing which values are missing, rather than a cryptic NullReferenceException mid-request in production.',
    },
    {
      q: 'Where should you store a production API key in a Kubernetes deployment?',
      options: [
        'In the Docker image as an environment variable set during build',
        'In a Kubernetes Secret, injected as an environment variable or volume mount at runtime',
        'In appsettings.Production.json committed to the repo',
        'In the container\'s command arguments',
      ],
      answer: 1,
      explanation: 'Kubernetes Secrets are base64-encoded (not encrypted by default, but separate from the image) and can be injected as env vars (envFrom: secretRef) or files. Never bake secrets into the Docker image — the image is often pushed to a registry accessible to many people. Enable Kubernetes secret encryption at rest in the cluster for full security.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'I accidentally committed a secret — what should I do?',
      a: 'Assume the secret is compromised immediately, even if the repo is private. (1) Rotate the secret — regenerate the API key, change the password, or issue a new certificate. (2) Revoke the old secret in the service that issued it. (3) Remove the secret from the commit history (git filter-branch or BFG Repo Cleaner), but note this rewrites history and does not guarantee removal from anyone who already cloned. Rotation is the critical step; history rewriting is cleanup.',
    },
    {
      q: 'Can I use user secrets in a Docker container?',
      a: 'User secrets are for local development only. In Docker, use environment variables (set via docker run -e or docker-compose environment:) or Docker Secrets (for Swarm). In Kubernetes, use Kubernetes Secrets with envFrom. Never bake secrets into the Docker image.',
    },
    {
      q: 'Should I validate that required configuration values exist at startup?',
      a: 'Yes — fail fast is better than a cryptic NullReferenceException at runtime. Use builder.Configuration["Key"] ?? throw new InvalidOperationException("...") or the Options validation pattern: builder.Services.AddOptions<JwtOptions>().BindConfiguration("Jwt").ValidateDataAnnotations().ValidateOnStart(). The latter validates all required properties on startup with clear error messages.',
    },
    {
      q: 'How do I rotate Data Protection keys without breaking existing sessions?',
      a: 'Data Protection has built-in key rotation. When a key expires (default 90 days), a new key is created. Old keys are retained and marked as "expired but still usable for decryption" — existing encrypted cookies/tokens can still be decrypted. Only new tokens use the new key. Sessions encrypted with expired keys are eventually dropped naturally (when the session itself expires).',
    },
    {
      q: 'What is the difference between IDataProtector and IDataProtectionProvider?',
      a: 'IDataProtectionProvider is the factory — inject it and call CreateProtector("purpose") to get an IDataProtector bound to that purpose. IDataProtector exposes Protect()/Unprotect() and ToTimeLimitedDataProtector() for expiring tokens. The purpose string is an isolation mechanism — a token from protector("email") cannot be unprotected by protector("password-reset"). Inject IDataProtectionProvider in services, not IDataProtector directly (providers are singleton-safe; protectors are derived).',
    },
    {
      q: 'How do I load secrets from Azure Key Vault without storing the client secret anywhere?',
      a: 'Use DefaultAzureCredential from the Azure.Identity package. In Azure (App Service, AKS, Azure Functions), DefaultAzureCredential automatically uses the resource\'s Managed Identity — no client ID or secret needed. In local development, it falls back to the Azure CLI credentials (run "az login" once). Call builder.Configuration.AddAzureKeyVault(new Uri(kvUri), new DefaultAzureCredential()) — the same code works in dev and production.',
    },
    {
      q: 'What is the difference between IOptions, IOptionsSnapshot, and IOptionsMonitor?',
      a: 'IOptions<T>: Singleton, registered once at startup, does not reflect changes. Use for stable config that never changes at runtime. IOptionsSnapshot<T>: Scoped (per-request), re-reads config on each request scope. Cannot inject into Singleton services. Use in controllers and Scoped services that benefit from live config changes. IOptionsMonitor<T>: Singleton with OnChange callback. Reflects live changes and is injectable anywhere. Use in Singleton services (background workers, caches) that need to react to configuration changes.',
    },
    {
      q: 'How do I share Data Protection keys across multiple app instances without Redis?',
      a: 'Options beyond Redis: (1) PersistKeysToAzureBlobStorage — store keys in an Azure Blob, ideal for Azure deployments without a Redis cache. (2) PersistKeysToDbContext<T> (via Microsoft.AspNetCore.DataProtection.EntityFrameworkCore) — store keys in a SQL database. (3) PersistKeysToFileSystem with a shared network path — suitable for on-premises multi-server setups but requires file share infrastructure. All options should be combined with ProtectKeysWithAzureKeyVault() or a certificate for keys-at-rest encryption.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Storing connection strings in appsettings.json committed to the repo',
      wrong: `// appsettings.json — committed to git
{
  "ConnectionStrings": {
    "Default": "Server=prod.db.example.com;Password=Prod@secret123!"
  }
}`,
      right: `// appsettings.json — safe to commit (no secrets)
{
  "ConnectionStrings": {
    "Default": "" // set via user secrets (dev) or env var (prod)
  }
}
// Set in dev: dotnet user-secrets set "ConnectionStrings:Default" "..."
// Set in prod: ConnectionStrings__Default environment variable`,
      explanation: 'Connection strings with credentials committed to source control are visible to every team member and permanent in git history. Store placeholder values in appsettings.json and supply real values through user secrets (dev) or environment variables / Key Vault (prod).',
    },
    {
      title: 'Not setting SetApplicationName() for Data Protection',
      wrong: `builder.Services
    .AddDataProtection()
    .PersistKeysToStackExchangeRedis(redis, "Keys");
// SetApplicationName() omitted — ASP.NET Core uses the app content root path
// Deploy to a different path or rename the project → different app name → incompatible keys`,
      right: `builder.Services
    .AddDataProtection()
    .SetApplicationName("my-api")  // stable, explicit name shared across all pods
    .PersistKeysToStackExchangeRedis(redis, "Keys");`,
      explanation: 'Without SetApplicationName(), ASP.NET Core derives the name from the application base path. If you rename the project, change the deployment folder, or run tests from a different path, the name changes — existing cookies and tokens become undecryptable.',
    },
    {
      title: 'Injecting IOptions<T> in a background service that needs live config',
      wrong: `public class NotificationWorker(IOptions<EmailOptions> opts) : BackgroundService
{
    // opts.Value is fixed at startup — config changes ignored at runtime
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        var host = opts.Value.SmtpHost; // stale if config changes
    }
}`,
      right: `public class NotificationWorker(IOptionsMonitor<EmailOptions> opts) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        var host = opts.CurrentValue.SmtpHost; // always current
        opts.OnChange(o => Console.WriteLine(\`SMTP host changed to \${o.SmtpHost}\`));
    }
}`,
      explanation: 'IOptions<T> caches the value at startup and never updates. In long-running background services, IOptionsMonitor<T> provides CurrentValue that reflects live configuration changes (e.g., from a reloaded appsettings.json or feature flag service).',
    },
    {
      title: 'Using user secrets outside of Development environment',
      wrong: `// Always adds user secrets — even in Staging and Production
builder.Configuration.AddUserSecrets<Program>();`,
      right: `// Only in Development — user secrets are a dev tool, not a production mechanism
if (builder.Environment.IsDevelopment())
    builder.Configuration.AddUserSecrets<Program>();
// Or: AddUserSecrets<Program>(optional: true) — won't fail if UserSecretsId not set
// Production uses environment variables or Key Vault`,
      explanation: 'User secrets are stored as plain JSON in the user profile. They are not encrypted, not audited, and not suitable for production. Restrict them to Development. In production, always use environment variables, Key Vault, or another secret manager.',
    },
    {
      title: 'Hardcoding the application name in Data Protection inconsistently',
      wrong: `// Service A:
.SetApplicationName("MyApp-Service-A")

// Service B (same app, different file):
.SetApplicationName("myapp-service-a") // different capitalisation!
// Both share Redis but can't decrypt each other's tokens`,
      right: `// Use a shared constant across all pods and services
public static class AppConstants { public const string AppName = "myapp"; }

// In Program.cs:
.SetApplicationName(AppConstants.AppName)`,
      explanation: 'The application name is case-sensitive. "MyApp" and "myapp" produce different key derivations — pods with different names cannot decrypt each other\'s Data Protection payloads even if they share the same Redis key store. Use a constant or config value to ensure consistency.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Secrets belong outside source control — in user secrets for dev, environment variables or Key Vault for prod; ASP.NET Core reads all sources uniformly via IConfiguration, and Data Protection encrypts cookies and custom tokens with a shared key ring.',
    mustKnow: [
      'Never commit secrets — user secrets (dev), env vars / Key Vault (prod)',
      'JWT__KEY → IConfiguration["Jwt:Key"] via double-underscore convention',
      'Managed Identity: app authenticates to Key Vault with its Azure identity — no credentials needed',
      'Data Protection key ring must be shared across pods — PersistKeysToRedis/Blob/DB',
      'SetApplicationName() must match across all pods — case-sensitive',
      'IOptions: startup-cached; IOptionsSnapshot: per-request; IOptionsMonitor: Singleton-safe, live',
      'ValidateOnStart(): fail fast at startup if required config values are missing',
    ],
    interviewFocus: [
      'What is the "secret to retrieve secrets" problem and how does Managed Identity solve it?',
      'Why do random logouts occur in multi-pod deployments with cookie auth, and how do you fix it?',
      'What is the purpose string in IDataProtector.CreateProtector() for?',
      'What is the difference between IOptions, IOptionsSnapshot, and IOptionsMonitor?',
      'How does the double-underscore convention let you configure hierarchical settings via environment variables?',
    ],
  };
}
