import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-ioptionsmonitor-onchange-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './ioptionsmonitor-onchange-never-fires-for-env-vars-or-key-vault.html',
  styleUrl: './ioptionsmonitor-onchange-never-fires-for-env-vars-or-key-vault.scss',
})
export class IoptionsmonitorOnchangeNeverFiresForEnvVarsOrKeyVaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states "IOptionsMonitor<T>: Singleton with OnChange callback. Reflects live changes" as a blanket property of the type — but IOptionsMonitor only reflects changes that its underlying IConfiguration SOURCE actually surfaces via a change token; it does not poll or magically detect drift in the outside world for every provider equally',
      points: [
        'The JSON file configuration provider (<code>AddJsonFile("appsettings.json", reloadOnChange: true)</code>, the default when using <code>WebApplication.CreateBuilder()</code>) uses a <code>FileSystemWatcher</code> internally — editing the file on disk fires a change token, which <code>IOptionsMonitor&lt;T&gt;.OnChange()</code> observes. This is the ONE provider most tutorials demonstrate "live reload" with, which creates the impression that ALL configuration sources behave this way.',
        'The <strong>environment variables provider</strong> reads <code>Environment.GetEnvironmentVariable()</code> exactly ONCE, at application startup, and never again — there is no OS-level notification mechanism for environment variable changes, and .NET does not poll for them. Changing an environment variable on a running process (even where the OS technically allows it) has zero effect on <code>IConfiguration</code> until the process restarts. <code>IOptionsMonitor&lt;T&gt;.OnChange()</code> registered against options sourced purely from environment variables will simply <strong>never fire</strong> — not "fires slowly," never at all.',
      ],
    },
    {
      heading: 'AddAzureKeyVault() behaves the same way by default — a one-time load at startup, with no polling — UNLESS you explicitly opt into periodic reload via a ReloadInterval, which the main page\'s own Key Vault code tab does not configure',
      points: [
        'The Azure Key Vault configuration provider CAN be configured to poll for changes — <code>options.ReloadInterval = TimeSpan.FromMinutes(5)</code> passed to the <code>AzureKeyVaultConfigurationOptions</code> overload of <code>AddAzureKeyVault()</code> — but this is opt-in, not the default. Without it, secrets loaded from Key Vault are frozen at whatever value existed when the app started, for the ENTIRE process lifetime, identical to the environment-variable behavior described above.',
        'The practical consequence: rotating a secret in Key Vault (a common operational practice, e.g. quarterly credential rotation) does NOT propagate to already-running pods unless <code>ReloadInterval</code> is explicitly configured OR the pods are restarted/redeployed. A team relying on <code>IOptionsMonitor&lt;T&gt;.OnChange()</code> to "pick up the new secret automatically" for a Key-Vault-sourced value, without setting <code>ReloadInterval</code>, will find the callback simply never invokes — every running instance keeps using the stale secret until it restarts.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The pattern that looks correct but silently never fires for env-var/default-KeyVault sources',
      language: 'csharp',
      code: `public class FeatureFlagWorker(IOptionsMonitor<FeatureFlags> flags) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        // Looks correct — "IOptionsMonitor gives me live config" per
        // the main page's own guidance. Whether this EVER actually
        // fires depends entirely on where FeatureFlags is configured
        // FROM, which this code gives no hint about:
        flags.OnChange(newFlags =>
            Console.WriteLine($"Feature flags updated: {newFlags.NewCheckoutFlow}"));

        while (!ct.IsCancellationRequested)
            await Task.Delay(TimeSpan.FromMinutes(1), ct);
    }
}

// Case 1 — sourced from appsettings.json with reloadOnChange: true
// (the DEFAULT for WebApplication.CreateBuilder()):
//   Editing appsettings.json on disk → OnChange fires. Works as the
//   main page's guidance implies.

// Case 2 — sourced from an environment variable:
//   FeatureFlags__NewCheckoutFlow=true set at container start.
//   Changing this env var on a RUNNING container (e.g. via an
//   orchestrator's env-var-update mechanism, where supported) has
//   NO EFFECT on IConfiguration at all — the environment provider
//   read it once, at Load() time, during startup. OnChange NEVER
//   fires for this source, ever, for the life of the process.

// Case 3 — sourced from Azure Key Vault, default configuration:
builder.Configuration.AddAzureKeyVault(
    kvUri, new DefaultAzureCredential());
// One-time load at startup — identical behavior to Case 2. Rotating
// the secret in Key Vault does nothing until the process restarts.`,
    },
    {
      label: 'Proving it with a test, and the fix — explicit ReloadInterval for Key Vault',
      language: 'csharp',
      code: `[Fact]
public void OnChange_Never_Fires_For_EnvironmentVariable_Backed_Options()
{
    Environment.SetEnvironmentVariable("FeatureFlags__NewCheckoutFlow", "false");

    var config = new ConfigurationBuilder()
        .AddEnvironmentVariables()
        .Build();

    var services = new ServiceCollection();
    services.AddOptions<FeatureFlags>().Bind(config.GetSection("FeatureFlags"));
    var provider = services.BuildServiceProvider();

    var monitor = provider.GetRequiredService<IOptionsMonitor<FeatureFlags>>();
    var fired = false;
    monitor.OnChange(_ => fired = true);

    // Change the env var AFTER the configuration has already been
    // built and loaded — simulating an orchestrator updating it on a
    // running process:
    Environment.SetEnvironmentVariable("FeatureFlags__NewCheckoutFlow", "true");

    // No mechanism exists to re-read the environment or notify
    // IConfiguration of the change — 'fired' stays false forever,
    // regardless of how long you wait or how many times you check
    // monitor.CurrentValue (which also still returns the OLD value):
    Assert.False(fired);
    Assert.False(monitor.CurrentValue.NewCheckoutFlow); // stale
}

// THE FIX for Key Vault specifically — opt into periodic polling:
builder.Configuration.AddAzureKeyVault(
    kvUri,
    new DefaultAzureCredential(),
    new AzureKeyVaultConfigurationOptions
    {
        ReloadInterval = TimeSpan.FromMinutes(5),   // now DOES poll
    });
// IOptionsMonitor<T>.OnChange() now genuinely fires (within up to 5
// minutes of a Key Vault secret update) — but ONLY because of this
// explicit opt-in; the default AddAzureKeyVault() overload the main
// page's own code tab uses does not enable this.

// Environment variables have NO reload mechanism at all, opt-in or
// otherwise — for those, "picking up a change" always means
// restarting the process, full stop.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team configures Azure Key Vault with ReloadInterval = TimeSpan.FromMinutes(5) specifically so a rotated database password takes effect without restarting pods. Their code injects IOptionsMonitor<DbOptions> into a Singleton connection-pool manager and calls monitor.CurrentValue.ConnectionString each time it needs to open a new connection. Six months later, a security review asks: "if the Key Vault secret is compromised and rotated immediately, how long can an attacker\'s old credential still work?" What is the honest answer, and what does it depend on?',
    hint: 'ReloadInterval controls how often the CONFIGURATION PROVIDER polls Key Vault — but does that polling interval, by itself, fully describe the worst-case exposure window? What ELSE has to happen for the OLD credential to actually stop being usable at the database server itself?',
    solution: `The honest answer has two independent components, and conflating them
is the mistake a team makes if they only think about ReloadInterval.

Component 1 — the CONFIGURATION side (what this subtopic is about):
with ReloadInterval = 5 minutes, the WORST case for the application
picking up the NEW secret is just under 5 minutes after rotation (if
the poll happens to fire right after the secret changed, it could be
picked up almost immediately; if it just polled right before the
rotation, the app waits nearly the full interval). This is the piece
IOptionsMonitor.OnChange() and ReloadInterval actually control.

Component 2 — the DATABASE/CREDENTIAL side, which ReloadInterval has
ZERO influence over: rotating a secret in Key Vault only creates a NEW
version of the secret — it does not, by itself, invalidate the OLD
credential at the database server. If the old password is still a
valid, active credential on the database side until something
EXPLICITLY revokes it there (dropping the old SQL login, rotating the
underlying database password itself, not just the Key Vault copy of
it), an attacker who already has the old credential can continue using
it directly against the database, completely bypassing the
application and its Key Vault polling entirely — the app picking up
the new secret for ITS OWN future connections says nothing about
whether the old one still works for someone connecting directly.

The complete, honest answer to the security review: "the application's
OWN connections will use the new credential within ~5 minutes due to
ReloadInterval, but the OLD credential remains usable by anyone who has
it until the database-side credential itself is revoked or rotated —
which is a separate operational step from updating Key Vault, and must
be done (and ideally automated) as part of the SAME rotation runbook,
not assumed to happen automatically just because Key Vault has a new
value." This is exactly why credential rotation runbooks generally
treat "update the secret store" and "revoke the old credential at the
source system" as two distinct, both-required steps — ReloadInterval
only ever addresses the first one.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'IOptionsMonitor<T> uniformly "reflects live configuration changes" for any configuration source, since that is a property of the IOptionsMonitor type itself.',
      reality: 'IOptionsMonitor only reflects changes that its underlying configuration PROVIDER actually surfaces via a change token — the JSON file provider does this via a FileSystemWatcher when reloadOnChange is enabled, but the environment variables provider reads values exactly once at startup and never again, so OnChange() never fires for env-var-sourced options no matter how long the process runs.',
    },
    {
      thought: 'Azure Key Vault configuration, once loaded into IConfiguration, automatically stays in sync with the vault — rotating a secret in Key Vault is picked up by running instances without any special configuration.',
      reality: 'AddAzureKeyVault() performs a one-time load at startup by default, identical to environment variables — periodic polling requires explicitly setting ReloadInterval on AzureKeyVaultConfigurationOptions; without it, a secret rotation in Key Vault has no effect on already-running processes until they restart.',
    },
    {
      thought: 'configuring ReloadInterval for a Key Vault-backed secret is sufficient to guarantee that a compromised, rotated credential stops working promptly.',
      reality: 'ReloadInterval only controls how quickly the APPLICATION picks up the new secret value for its own future use — it has no bearing on whether the OLD credential is still independently valid and usable at the underlying system (database, API, etc.) until that system\'s credential is separately revoked or rotated at the source.',
    },
  ];
}
