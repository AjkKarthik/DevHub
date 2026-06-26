import { Component } from '@angular/core';
import { PageMetaComponent }      from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-aspnet-localization',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent],
  templateUrl: './localization.html',
  styleUrl: './localization.scss',
})
export class AspnetLocalization {

  quickRef: QuickRefItem[] = [
    { name: 'AddLocalization()',                     type: 'method',   desc: 'Registers IStringLocalizer, IHtmlLocalizer, and related services.' },
    { name: 'UseRequestLocalization()',              type: 'method',   desc: 'Middleware that negotiates culture from URL, cookie, or Accept-Language.' },
    { name: 'IStringLocalizer<T>',                  type: 'interface','desc': 'Inject to get translated strings; falls back to key if no resource found.' },
    { name: 'IStringLocalizer[key]',                type: 'accessor', desc: 'Returns a LocalizedString — check ResourceNotFound if fallback is used.' },
    { name: 'IHtmlLocalizer<T>',                    type: 'interface','desc': 'Like IStringLocalizer but HTML-encodes values, safe for Razor output.' },
    { name: 'RequestLocalizationOptions',           type: 'class',    desc: 'Configure supported cultures, default culture, and culture providers.' },
    { name: 'AcceptLanguageHeaderCultureProvider',  type: 'class',    desc: 'Reads culture from the Accept-Language HTTP request header.' },
    { name: 'QueryStringRequestCultureProvider',    type: 'class',    desc: 'Reads culture from ?culture=fr-FR&ui-culture=fr query string.' },
    { name: 'CookieRequestCultureProvider',         type: 'class',    desc: 'Reads culture from a persisted cookie (user language preference).' },
    { name: '.resx file',                           type: 'keyword',  desc: 'XML resource file containing key-value translation pairs per culture.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Localization vs Globalization',
      points: ['Globalization (g11n) is making code culture-aware — handling dates, numbers, and currencies correctly per locale. Localization (l10n) is providing translated text. ASP.NET Core handles both: CultureInfo.CurrentCulture controls formatting, CultureInfo.CurrentUICulture controls which .resx resource file is loaded.'],
    },
    {
      heading: '.resx Resource Files',
      points: ['Create Resources/SharedResources.resx for the default (English) strings and Resources/SharedResources.fr.resx for French translations. The file name must match the class name passed to IStringLocalizer<T>. At runtime, the framework picks the file whose culture code matches the current UI culture.'],
    },
    {
      heading: 'Culture Negotiation Pipeline',
      points: ['UseRequestLocalization() adds middleware that runs culture providers in order. By default: QueryStringRequestCultureProvider → CookieRequestCultureProvider → AcceptLanguageHeaderCultureProvider. The first provider that returns a supported culture wins. You can add custom providers or reorder them.'],
    },
    {
      heading: 'IStringLocalizer<T>',
      points: ['Inject IStringLocalizer<T> where T is a marker class (often the controller or a SharedResources class). Access strings with localizer["KeyName"] or localizer["KeyWithArg", value]. The indexer returns a LocalizedString — check .ResourceNotFound to detect missing translations.'],
    },
    {
      heading: 'Validating Translated Error Messages',
      points: ['FluentValidation and DataAnnotations both support localised messages. Pass localizer["ValidationKey"] as the error message to get culture-aware validation feedback. For DataAnnotations, set ErrorMessageResourceType and ErrorMessageResourceName to point to a resx file.'],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'csharp',
      code: `// Program.cs
builder.Services.AddLocalization(options =>
    options.ResourcesPath = "Resources");

builder.Services.AddControllersWithViews()
    .AddViewLocalization()
    .AddDataAnnotationsLocalization();

var app = builder.Build();

var supportedCultures = new[] { "en", "fr", "de", "ar" };
app.UseRequestLocalization(options =>
{
    options.SetDefaultCulture("en")
           .AddSupportedCultures(supportedCultures)
           .AddSupportedUICultures(supportedCultures);
    // Order: QueryString → Cookie → Accept-Language
});`,
    },
    {
      label: 'Resource Files',
      language: 'csharp',
      code: `// File: Resources/Controllers/HomeController.resx
// Key              | Value
// Greeting         | Hello, {0}!
// WelcomeMessage   | Welcome to our site.

// File: Resources/Controllers/HomeController.fr.resx
// Key              | Value
// Greeting         | Bonjour, {0} !
// WelcomeMessage   | Bienvenue sur notre site.

// Controller using the localizer
[ApiController, Route("api/[controller]")]
public class HomeController(IStringLocalizer<HomeController> localizer) : ControllerBase
{
    [HttpGet("greet")]
    public IActionResult Greet(string name)
    {
        var msg = localizer["Greeting", name];
        return Ok(new { message = msg.Value });
    }
}`,
    },
    {
      label: 'Shared Localizer',
      language: 'csharp',
      code: `// Marker class — no code, just used for the type parameter
public class SharedResources { }

// File: Resources/SharedResources.resx + SharedResources.fr.resx

// Inject wherever needed
public class OrderService(IStringLocalizer<SharedResources> localizer)
{
    public string GetOrderConfirmation(int orderId)
        => localizer["OrderConfirmed", orderId].Value;
}

// With FluentValidation
public class ProductValidator(IStringLocalizer<SharedResources> localizer)
    : AbstractValidator<CreateProductRequest>
{
    public ProductValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage(_ => localizer["NameRequired"].Value);
    }
}`,
    },
    {
      label: 'Culture Cookie',
      language: 'csharp',
      code: `// Set language preference via a cookie
app.MapPost("/api/language", (string culture, HttpContext ctx) =>
{
    if (!new[] { "en", "fr", "de" }.Contains(culture))
        return Results.BadRequest("Unsupported culture.");

    ctx.Response.Cookies.Append(
        CookieRequestCultureProvider.DefaultCookieName,
        CookieRequestCultureProvider.MakeCookieValue(
            new RequestCulture(culture, culture)),
        new CookieOptions { Expires = DateTimeOffset.UtcNow.AddYears(1) });

    return Results.Ok(new { culture });
});`,
    },
    {
      label: 'RTL / Arabic Support',
      language: 'csharp',
      code: `// API returns direction hint for the UI
app.MapGet("/api/culture-info", (IHttpContextAccessor ctx) =>
{
    var culture = CultureInfo.CurrentUICulture;
    return Results.Ok(new
    {
        Name      = culture.Name,
        Direction = culture.TextInfo.IsRightToLeft ? "rtl" : "ltr",
        DisplayName = culture.NativeName,
    });
});

// In Razor / Blazor set the dir attribute:
// <html lang="@CultureInfo.CurrentUICulture.Name"
//       dir="@(CultureInfo.CurrentUICulture.TextInfo.IsRightToLeft ? "rtl" : "ltr")">`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Wrong resource file location or naming',
      wrong: `// Resources/HomeController.resx — missing Controllers subfolder
// IStringLocalizer<HomeController> → cannot find resource`,
      right: `// Resources/Controllers/HomeController.resx
// Path mirrors the class namespace relative to ResourcesPath`,
      explanation: 'Resource file paths must mirror the class namespace. If HomeController is in MyApp.Controllers, the file goes in Resources/Controllers/HomeController.resx.',
    },
    {
      title: 'Calling UseRequestLocalization() too late',
      wrong: `app.UseRouting();
app.UseAuthentication();
app.UseRequestLocalization(); // culture set after auth — too late for localised error messages`,
      right: `app.UseRequestLocalization(); // must be early, before auth and routing
app.UseRouting();
app.UseAuthentication();`,
      explanation: 'UseRequestLocalization must run before other middleware that may produce localised output (auth error messages, model validation, etc.).',
    },
    {
      title: 'Not adding supported cultures to options',
      wrong: `app.UseRequestLocalization(); // no supported cultures configured`,
      right: `app.UseRequestLocalization(o =>
    o.SetDefaultCulture("en").AddSupportedCultures("en","fr","de")
     .AddSupportedUICultures("en","fr","de"));`,
      explanation: 'Without SupportedCultures, arbitrary values from Accept-Language are accepted including unsupported ones, leading to MissingManifestResourceException.',
    },
    {
      title: 'Using CurrentCulture for string lookup instead of CurrentUICulture',
      wrong: `Thread.CurrentThread.CurrentCulture.Name; // formatting culture`,
      right: `Thread.CurrentThread.CurrentUICulture.Name; // resource-file selection culture`,
      explanation: 'CurrentCulture controls date/number formatting. CurrentUICulture controls which .resx file is loaded for translated strings. They are separate and can differ.',
    },
  ];

  challenge: Challenge = {
    title: 'Localised Greeting Endpoint',
    language: 'csharp',
    description: `Set up a minimal API with:
1. Localization configured for "en" and "fr".
2. A Resources/GreetingResources.resx with key "Hello" = "Hello, {0}!" and Resources/GreetingResources.fr.resx with "Hello" = "Bonjour, {0} !".
3. GET /greet?name=Alice that returns the greeting in the requested language (via Accept-Language or ?culture=fr).`,
    hints: [
      'AddLocalization(options => options.ResourcesPath = "Resources")',
      'Use UseRequestLocalization with AddSupportedCultures("en","fr")',
      'Inject IStringLocalizer<GreetingResources>',
    ],
    starterCode: `public class GreetingResources { }

// TODO: configure localization
// TODO: add GET /greet?name=Alice endpoint`,
    solution: `builder.Services.AddLocalization(o => o.ResourcesPath = "Resources");
var app = builder.Build();
app.UseRequestLocalization(o =>
    o.SetDefaultCulture("en")
     .AddSupportedCultures("en", "fr")
     .AddSupportedUICultures("en", "fr"));

app.MapGet("/greet", (string name, IStringLocalizer<GreetingResources> localizer)
    => Results.Ok(new { message = localizer["Hello", name].Value }));`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which culture controls which .resx resource file is loaded?',
      options: ['CultureInfo.CurrentCulture', 'CultureInfo.CurrentUICulture', 'CultureInfo.InvariantCulture', 'CultureInfo.InstalledUICulture'],
      answer: 1,
      explanation: 'CurrentUICulture selects the resource file for translated strings. CurrentCulture controls date and number formatting.',
    },
    {
      q: 'In what order are culture providers checked by default?',
      options: [
        'Accept-Language → Cookie → QueryString',
        'Cookie → QueryString → Accept-Language',
        'QueryString → Cookie → Accept-Language',
        'Accept-Language → QueryString → Cookie',
      ],
      answer: 2,
      explanation: 'Default order: QueryStringRequestCultureProvider → CookieRequestCultureProvider → AcceptLanguageHeaderCultureProvider. The first matching supported culture wins.',
    },
    {
      q: 'What naming convention must .resx files follow for IStringLocalizer<HomeController>?',
      options: [
        'Any name in the Resources folder',
        'HomeController.resx (or HomeController.fr.resx) under a path mirroring the namespace',
        'Strings.resx in the root',
        'Resources.resx in the same folder as the controller',
      ],
      answer: 1,
      explanation: 'The file must be named after the class and placed in a folder structure that mirrors the class namespace relative to ResourcesPath.',
    },
    {
      q: 'What does localizer["MissingKey"].ResourceNotFound return?',
      options: ['null', 'false', 'true', 'It throws a KeyNotFoundException'],
      answer: 2,
      explanation: 'ResourceNotFound is true when the key was not found in any resource file. The .Value property still returns the key string as a fallback.',
    },
    {
      q: 'Where should UseRequestLocalization() be placed in the middleware pipeline?',
      options: [
        'After UseAuthentication()',
        'After UseRouting()',
        'Before UseRouting() and UseAuthentication()',
        'At the very end, after MapControllers()',
      ],
      answer: 2,
      explanation: 'UseRequestLocalization must run early so the culture is set before middleware that may produce localised content (error messages, model validation errors).',
    },
    {
      q: 'When a resource string key is missing in the requested culture but exists in the default culture, what does IStringLocalizer return?',
      options: [
        'null — the key is not found',
        'An empty string',
        'It throws a KeyNotFoundException',
        'The key string itself (the fallback) — ResourceNotFound is true but Value is the key name',
      ],
      answer: 3,
      explanation: 'IStringLocalizer falls back gracefully — if fr-FR.resx has no "WelcomeMessage" key, it tries the neutral "fr.resx", then the default resource, and finally returns the key name as the value. The LocalizedString.ResourceNotFound property is true to signal the miss. This prevents NullReferenceExceptions in localized UIs.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I store translations in a database instead of .resx files?',
      a: 'Yes. Implement a custom IStringLocalizerFactory and IStringLocalizer<T> that load translations from a database or external service. Register it with builder.Services.AddSingleton<IStringLocalizerFactory, DbStringLocalizerFactory>(). This is useful for user-managed translations without deployments.',
    },
    {
      q: 'How do I localise DataAnnotations validation messages?',
      a: 'Call .AddDataAnnotationsLocalization() on AddControllersWithViews(). Then set ErrorMessageResourceType = typeof(SharedResources) and ErrorMessageResourceName = "KeyName" on validation attributes to point to a resource file.',
    },
    {
      q: 'What is the difference between AddSupportedCultures and AddSupportedUICultures?',
      a: 'AddSupportedCultures sets the cultures for formatting (dates, numbers, currencies). AddSupportedUICultures sets the cultures for resource file selection (translated strings). You typically set them to the same list, but they can differ — e.g., use en-US formatting but fr-FR strings.',
    },
    {
      q: 'How do I handle right-to-left languages like Arabic or Hebrew?',
      a: 'Add the culture to supported cultures, create .ar.resx resource files, and in the HTML set dir="rtl" based on CultureInfo.CurrentUICulture.TextInfo.IsRightToLeft. CSS should also use logical properties (margin-inline-start instead of margin-left) for layout mirroring.',
    },
    {
      q: 'How do I test that my ASP.NET Core application returns correctly localised responses?',
      a: 'In integration tests using WebApplicationFactory, send requests with the Accept-Language header: client.DefaultRequestHeaders.AcceptLanguage.Add(new StringWithQualityHeaderValue("fr-FR")). Assert the response body contains the French strings. You can also override the culture provider in the test host by registering a custom IRequestCultureProvider that returns a fixed culture, making all tests deterministic regardless of test runner locale.',
    },
    {
      q: 'What is the PluralForms problem in localisation and how does .NET address it?',
      a: 'Many languages have complex plural rules — Russian has four plural forms, Arabic has six, English has two. .NET\'s built-in IStringLocalizer has no plural-aware API. The workaround is to create separate resource keys for each plural form (OrderCount_One, OrderCount_Few, OrderCount_Many) and select the key in code based on the count, using CultureInfo rules. Libraries like OrchardCore.Localization or NGettext provide proper plural-aware localisation on top of ASP.NET Core.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ASP.NET Core localization pairs .resx resource files with IStringLocalizer<T> and UseRequestLocalization middleware to negotiate and serve translated content.',
    mustKnow: [
      'AddLocalization(o => o.ResourcesPath = "Resources") + UseRequestLocalization() (place before UseRouting)',
      'Resource files: ClassName.resx + ClassName.fr.resx under a path matching the class namespace',
      'IStringLocalizer<T>[key] returns a LocalizedString; .ResourceNotFound is true for missing keys',
      'Three default providers: QueryString → Cookie → Accept-Language (first supported culture wins)',
      'CurrentCulture = formatting; CurrentUICulture = which .resx to load',
      'Persist user language preference with CookieRequestCultureProvider cookie',
    ],
    interviewFocus: [
      'Difference between localization and globalization in .NET',
      'How .resx file paths must mirror the class namespace',
      'Culture negotiation order and how to customise it',
      'CurrentCulture vs CurrentUICulture — what each controls',
    ],
  };
}
