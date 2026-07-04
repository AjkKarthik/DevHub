import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-di-container-configuration-every-registration-resolves-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-di-container-configuration-every-registration-resolves.html',
  styleUrl: './testing-di-container-configuration-every-registration-resolves.scss',
})
export class TestingDiContainerConfigurationEveryRegistrationResolvesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "validated at startup" claim is only true if the application actually STARTS during your test run',
      points: [
        'The main Dependency Injection page states "the container is validated at startup by default in development... misconfigured registrations are caught immediately, not at first use in production." This validation only happens when you actually BUILD and RUN the host — a fast, isolated unit test suite typically never does that. A missing registration or a captive-dependency mistake can sit undetected through an entire green CI run, only surfacing when someone actually starts the full application (or worse, only in production if <code>ValidateOnBuild</code> was disabled there for startup-speed reasons).',
      ],
    },
    {
      heading: 'Building a real ServiceProvider from your ACTUAL registration code, in a test, catches this without running the whole application',
      points: [
        'A dedicated test can call the SAME service-registration method your <code>Program.cs</code> calls (assuming registration is extracted into a reusable method, e.g. <code>services.AddApplicationServices(configuration)</code>), then call <code>.BuildServiceProvider(validateScopes: true)</code> on the resulting <code>IServiceCollection</code> — this performs the EXACT SAME validation ASP.NET Core does at real startup, but inside a fast, isolated unit test that runs in milliseconds and needs no web server, no database, no real configuration file.',
      ],
    },
    {
      heading: 'Going further: attempt to resolve EVERY registered service type, not just build the provider',
      points: [
        'Merely calling <code>BuildServiceProvider</code> catches SOME structural issues (like circular dependencies) but does not necessarily attempt to CONSTRUCT every registered type — a service with a genuinely missing dependency might not surface until something actually tries to <code>GetRequiredService&lt;T&gt;()</code> it. A thorough test iterates every registered <code>ServiceDescriptor</code> in the <code>IServiceCollection</code> and calls <code>GetService(descriptor.ServiceType)</code> for each one, directly proving every SINGLE registration can actually be constructed — catching a missing dependency for ANY service, not just the ones a specific integration test happens to touch.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Extracting registration into a reusable, testable method — the main page\'s own Program.cs pattern, refactored',
      language: 'csharp',
      code: `// Program.cs and the test project BOTH call this SAME method —
// so testing it directly tests exactly what real startup would do:
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services, IConfiguration configuration)
    {
        services.AddScoped<IOrderRepository, SqlOrderRepository>();
        services.AddSingleton<ICache, InMemoryCache>();
        services.Configure<SmtpOptions>(configuration.GetSection("Smtp"));
        // ... every other registration ...
        return services;
    }
}

// Program.cs:
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddApplicationServices(builder.Configuration);`,
    },
    {
      label: 'Testing that the container builds and validates cleanly — no real host needed',
      language: 'csharp',
      code: `using Xunit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

public class DiContainerValidationTests
{
    [Fact]
    public void AddApplicationServices_BuildsWithoutValidationErrors()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Smtp:Host"] = "smtp.example.com",
            })
            .Build();

        services.AddApplicationServices(configuration);

        // validateScopes: true performs the EXACT SAME captive-
        // dependency and structural checks the main page's own
        // "ValidateOnBuild" startup behavior does — but here, inside
        // a fast unit test, with no web server or real config file:
        using var provider = services.BuildServiceProvider(
            new ServiceProviderOptions { ValidateScopes = true, ValidateOnBuild = true });

        // If this line is reached without throwing, the container's
        // basic structural validation passed.
        Assert.NotNull(provider);
    }
}`,
    },
    {
      label: 'Going further — attempting to resolve EVERY registered service, not just building the provider',
      language: 'csharp',
      code: `public class DiContainerResolutionTests
{
    [Fact]
    public void AllRegisteredServices_CanBeResolvedSuccessfully()
    {
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Smtp:Host"] = "smtp.example.com",
            })
            .Build();

        services.AddApplicationServices(configuration);

        using var provider = services.BuildServiceProvider(
            new ServiceProviderOptions { ValidateScopes = true });
        using var scope = provider.CreateScope();

        var errors = new List<string>();

        // Attempt to resolve EVERY SINGLE registered service type —
        // not just the ones a specific integration test happens to
        // exercise. This directly proves every registration is
        // genuinely constructible, catching a missing dependency
        // ANYWHERE in the registration list:
        foreach (var descriptor in services)
        {
            try
            {
                var instance = scope.ServiceProvider.GetService(descriptor.ServiceType);
            }
            catch (Exception ex)
            {
                errors.Add($"{descriptor.ServiceType.Name}: {ex.Message}");
            }
        }

        Assert.Empty(errors); // if any registration failed to resolve,
                               // the failure message names EXACTLY
                               // which service and why
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A registration accidentally references a service interface (<code>INotificationSender</code>) that was never actually registered anywhere. Write a test that would catch this specific mistake, and explain at which point it would fail.',
    hint: 'The "resolve every registered service" test iterates the ServiceCollection\'s OWN registrations — but a MISSING registration means the dependent service\'s constructor requires a type that has no ServiceDescriptor at all. Consider what happens when GetService() tries to resolve a constructor parameter with no matching registration.',
    solution: `// The registration with the mistake — OrderService depends on
// INotificationSender, but NOTHING ever registers an implementation
// for it:
public static IServiceCollection AddApplicationServices(
    this IServiceCollection services, IConfiguration configuration)
{
    services.AddScoped<OrderService>(); // depends on INotificationSender
                                        // in its constructor
    // services.AddScoped<INotificationSender, EmailNotificationSender>();
    // ^ this registration line is MISSING entirely
    return services;
}

[Fact]
public void AllRegisteredServices_CanBeResolvedSuccessfully()
{
    var services = new ServiceCollection();
    services.AddApplicationServices(new ConfigurationBuilder().Build());

    using var provider = services.BuildServiceProvider(
        new ServiceProviderOptions { ValidateScopes = true });
    using var scope = provider.CreateScope();

    var errors = new List<string>();
    foreach (var descriptor in services)
    {
        try { scope.ServiceProvider.GetService(descriptor.ServiceType); }
        catch (Exception ex) { errors.Add($"{descriptor.ServiceType.Name}: {ex.Message}"); }
    }

    // This test FAILS specifically when it reaches OrderService's own
    // ServiceDescriptor — GetService(typeof(OrderService)) triggers
    // the container to try constructing OrderService, which requires
    // an INotificationSender that has NO registration at all, so the
    // container throws InvalidOperationException ("Unable to resolve
    // service for type 'INotificationSender' while attempting to
    // activate 'OrderService'"). The test's error list captures this
    // EXACT message, naming precisely which service and dependency
    // is missing — caught in a fast unit test, long before this
    // mistake would otherwise surface at real application startup.
    Assert.Empty(errors);
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the .NET DI container\'s "validated at startup" behavior means a broken registration will always be caught automatically before it reaches production.',
      reality: 'that validation only runs when the application actually STARTS via the real host — a fast unit test suite that never builds and runs the full application never exercises it, and ValidateOnBuild is sometimes disabled in production for startup-speed reasons.',
    },
    {
      thought: 'building a ServiceProvider successfully (services.BuildServiceProvider()) proves every registered service can actually be constructed.',
      reality: 'building the provider only performs structural checks — it does not necessarily attempt to construct every registered type; a service with a genuinely missing dependency may only fail when something actually calls GetService/GetRequiredService for that specific type.',
    },
    {
      thought: 'testing DI registration correctness requires spinning up the full ASP.NET Core host (WebApplicationFactory) in an integration test.',
      reality: 'a plain ServiceCollection, populated by calling the SAME registration method Program.cs uses, and resolved directly in a unit test, catches the same class of mistakes in milliseconds — no web server or real host needed.',
    },
  ];
}
