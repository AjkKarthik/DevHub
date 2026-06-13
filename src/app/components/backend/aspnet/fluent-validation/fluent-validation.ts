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
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-aspnet-fluent-validation',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './fluent-validation.html',
  styleUrl: './fluent-validation.scss',
})
export class AspnetFluentValidation {

  prerequisites: Prerequisite[] = [
    { label: 'Model Binding & Validation', route: '/aspnet/model-binding' },
    { label: 'Dependency Injection',        route: '/aspnet/dependency-injection' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'AbstractValidator<T>',         type: 'class',    desc: 'Base class for validators. Override constructor to define rules.' },
    { name: 'RuleFor(x => x.Prop)',         type: 'method',   desc: 'Starts a rule chain for a property. Returns IRuleBuilderInitial.' },
    { name: '.NotEmpty()',                   type: 'method',   desc: 'Fails if the value is null, empty string, or default(T).' },
    { name: '.Length(min, max)',             type: 'method',   desc: 'Validates string or collection length within a range.' },
    { name: '.Must(predicate)',              type: 'method',   desc: 'Custom synchronous rule. Return true to pass, false to fail.' },
    { name: '.MustAsync(asyncPredicate)',    type: 'method',   desc: 'Async custom rule — use for DB or HTTP calls during validation.' },
    { name: '.WithMessage(msg)',             type: 'method',   desc: 'Overrides the default error message for the preceding rule.' },
    { name: '.When(condition)',              type: 'method',   desc: 'Applies the preceding rules only when the condition is true.' },
    { name: 'ValidationResult',             type: 'class',    desc: 'Returned by Validate(). Has IsValid and Errors properties.' },
    { name: 'AddFluentValidation()',         type: 'method',   desc: 'Extension to wire FluentValidation into ASP.NET model validation.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why FluentValidation over Data Annotations',
      points: ['Data annotations clutter model classes with attributes and are hard to unit-test in isolation. FluentValidation separates validation logic into its own class, supports complex cross-property rules, async lookups, and can be tested like any C# class without an HTTP context.'],
    },
    {
      heading: 'AbstractValidator<T> Pattern',
      points: ['Create a class that extends AbstractValidator<T>. In the constructor, call RuleFor(x => x.Property) to start a rule chain. Multiple rules chain fluently: RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200). Each rule generates an error message when it fails.'],
    },
    {
      heading: 'Custom Rules with Must and MustAsync',
      points: ['Must(x => condition) adds an inline custom rule. MustAsync((value, cancellationToken) => Task<bool>) is used when you need to check a database or call an external service. Always use MustAsync instead of .Must with async lambdas — calling async code synchronously causes deadlocks.'],
    },
    {
      heading: 'Conditional Validation',
      points: ['Append .When(x => condition) after a rule to apply it only when a condition is met. Use .Unless() for the inverse. For entire rule sets, wrap them in When(x => ..., () => { RuleFor(...); }). This avoids null reference errors on optional nested objects.'],
    },
    {
      heading: 'Integration with ASP.NET Core',
      points: ['Install FluentValidation.AspNetCore, then call builder.Services.AddFluentValidationAutoValidation() and register validators. Validators can be registered manually or via AddValidatorsFromAssembly(). When a validator is registered, ASP.NET Core automatically runs it during model binding — invalid models return 400 with the same ModelState errors API.'],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Validator',
      language: 'csharp',
      code: `public class CreateUserRequest
{
    public string Name    { get; set; } = "";
    public string Email   { get; set; } = "";
    public int    Age     { get; set; }
}

public class CreateUserValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .Length(2, 100).WithMessage("Name must be 2–100 characters.");

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress().WithMessage("A valid email is required.");

        RuleFor(x => x.Age)
            .InclusiveBetween(18, 120).WithMessage("Age must be 18–120.");
    }
}`,
    },
    {
      label: 'Async Validator',
      language: 'csharp',
      code: `public class RegisterValidator : AbstractValidator<RegisterRequest>
{
    private readonly IUserRepository _users;

    public RegisterValidator(IUserRepository users)
    {
        _users = users;

        RuleFor(x => x.Username)
            .NotEmpty()
            .MustAsync(BeUniqueUsernameAsync)
            .WithMessage("Username is already taken.");

        RuleFor(x => x.Password)
            .MinimumLength(8)
            .Matches("[A-Z]").WithMessage("Must contain an uppercase letter.")
            .Matches("[0-9]").WithMessage("Must contain a digit.");
    }

    private async Task<bool> BeUniqueUsernameAsync(
        string username, CancellationToken ct)
        => !await _users.ExistsAsync(username, ct);
}`,
    },
    {
      label: 'Conditional Rules',
      language: 'csharp',
      code: `public class OrderValidator : AbstractValidator<Order>
{
    public OrderValidator()
    {
        RuleFor(x => x.ShippingAddress)
            .NotEmpty()
            .When(x => x.ShipToCustomer, ApplyConditionTo.CurrentValidator)
            .WithMessage("Shipping address required when shipping to customer.");

        // Nested object — only validate if present
        When(x => x.Discount != null, () =>
        {
            RuleFor(x => x.Discount!.Code)
                .NotEmpty().WithMessage("Discount code is required.");

            RuleFor(x => x.Discount!.Amount)
                .GreaterThan(0).WithMessage("Discount must be positive.");
        });
    }
}`,
    },
    {
      label: 'ASP.NET Integration',
      language: 'csharp',
      code: `// Program.cs
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

// Or register individually:
builder.Services.AddScoped<IValidator<CreateUserRequest>, CreateUserValidator>();

// Controller — validation runs automatically via model binding
[HttpPost]
public IActionResult Create([FromBody] CreateUserRequest req)
{
    // If we reach here, model is already valid
    return Ok();
}

// Manual validation in a service or minimal API handler
app.MapPost("/users", async (
    CreateUserRequest req,
    IValidator<CreateUserRequest> validator) =>
{
    var result = await validator.ValidateAsync(req);
    if (!result.IsValid)
        return Results.ValidationProblem(result.ToDictionary());

    // proceed...
    return Results.Ok();
});`,
    },
    {
      label: 'Custom Extensions',
      language: 'csharp',
      code: `// Reusable rule set
public static class CommonRules
{
    public static IRuleBuilderOptions<T, string> IsValidPostcode<T>(
        this IRuleBuilder<T, string> rule)
        => rule
            .NotEmpty()
            .Matches(@"^[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}$")
            .WithMessage("Invalid UK postcode.");
}

// Usage
public class AddressValidator : AbstractValidator<Address>
{
    public AddressValidator()
    {
        RuleFor(x => x.Postcode).IsValidPostcode();
        RuleFor(x => x.Street).NotEmpty().MaximumLength(200);
    }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling async code inside Must()',
      wrong: `RuleFor(x => x.Email).Must(email => _repo.ExistsAsync(email).Result);`,
      right: `RuleFor(x => x.Email).MustAsync((email, ct) => _repo.ExistsAsync(email, ct));`,
      explanation: 'Using .Result inside Must() blocks the thread and can deadlock in ASP.NET. Always use MustAsync for async validation.',
    },
    {
      title: 'Forgetting to register validators',
      wrong: `builder.Services.AddFluentValidationAutoValidation(); // validators not registered`,
      right: `builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);`,
      explanation: 'Auto-validation only works when the validator is registered in the DI container. Use AddValidatorsFromAssembly for bulk registration.',
    },
    {
      title: 'Mutating the model inside Must()',
      wrong: `RuleFor(x => x.Name).Must(n => { x.Name = n.Trim(); return true; });`,
      right: `RuleFor(x => x.Name).Must(n => n == n.Trim()).WithMessage("No leading/trailing whitespace.");`,
      explanation: 'Validators should not mutate the model. Apply transformations before validation or in middleware.',
    },
    {
      title: 'Missing WithMessage on custom Must()',
      wrong: `RuleFor(x => x.Code).Must(IsValid);`,
      right: `RuleFor(x => x.Code).Must(IsValid).WithMessage("Code is not in a recognized format.");`,
      explanation: 'Without WithMessage the default "The specified condition was not met for Code" is shown — always provide a user-friendly message.',
    },
    {
      title: 'Mixing DataAnnotations and FluentValidation',
      wrong: `public class Req { [Required] public string Name { get; set; } = ""; }
// Also: RuleFor(x => x.Name).NotEmpty();`,
      right: `public class Req { public string Name { get; set; } = ""; }
// Only: RuleFor(x => x.Name).NotEmpty().WithMessage("Name required.");`,
      explanation: 'Having both DataAnnotations and FluentValidation rules for the same property causes duplicate errors and unclear behaviour. Pick one approach consistently.',
    },
  ];

  challenge: Challenge = {
    title: 'Validate a Product Creation Request',
    language: 'csharp',
    description: `Create a ProductValidator for the following class. Rules:
- Name: required, 3–150 chars.
- Price: greater than 0.
- CategoryId: required (> 0).
- Sku: optional, but when provided must match pattern ^[A-Z]{2}-\\d{4}$.`,
    hints: [
      'Use .When() for the optional SKU rule',
      '.Matches() takes a regex pattern string',
      'Price should use .GreaterThan(0)',
    ],
    starterCode: `public class CreateProductRequest
{
    public string Name       { get; set; } = "";
    public decimal Price     { get; set; }
    public int CategoryId    { get; set; }
    public string? Sku       { get; set; }
}

public class ProductValidator : AbstractValidator<CreateProductRequest>
{
    public ProductValidator()
    {
        // TODO: add rules
    }
}`,
    solution: `public class ProductValidator : AbstractValidator<CreateProductRequest>
{
    public ProductValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .Length(3, 150).WithMessage("Name must be 3–150 characters.");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be positive.");

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("A valid category must be selected.");

        RuleFor(x => x.Sku)
            .Matches(@"^[A-Z]{2}-\\d{4}$")
            .WithMessage("SKU must follow the pattern XX-1234.")
            .When(x => !string.IsNullOrEmpty(x.Sku));
    }
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which method should you use to perform an async database check inside a validator?',
      options: ['Must()', 'MustAsync()', 'Custom()', 'ValidateAsync()'],
      answer: 1,
      explanation: 'MustAsync() accepts an async delegate and is the correct way to perform async operations inside a validator without blocking.',
    },
    {
      q: 'What does .When(condition) do on a validation rule?',
      options: [
        'Makes the field conditionally optional',
        'Applies the preceding rule only when the condition is true',
        'Short-circuits the rest of the validator',
        'Throws an exception when condition is false',
      ],
      answer: 1,
      explanation: '.When() makes the preceding rule conditional — the rule is only evaluated when the condition is true.',
    },
    {
      q: 'What is returned by validator.Validate(model)?',
      options: ['bool', 'string[]', 'ValidationResult', 'IActionResult'],
      answer: 2,
      explanation: 'Validate() returns a ValidationResult object. Check IsValid (bool) and Errors (list of ValidationFailure).',
    },
    {
      q: 'Which NuGet package adds FluentValidation DI integration with ASP.NET Core?',
      options: ['FluentValidation', 'FluentValidation.DependencyInjectionExtensions', 'FluentValidation.AspNetCore', 'Microsoft.AspNetCore.Validation'],
      answer: 2,
      explanation: 'FluentValidation.AspNetCore adds the AddFluentValidationAutoValidation() extension and ASP.NET Core model binding hooks.',
    },
    {
      q: 'What happens if you forget AddValidatorsFromAssembly() but call AddFluentValidationAutoValidation()?',
      options: [
        'Build fails',
        'Validation is skipped and models are always valid',
        'An InvalidOperationException is thrown at startup',
        'The default Data Annotations validation runs instead',
      ],
      answer: 1,
      explanation: 'Without registered validators, FluentValidation has no rules to run so all models appear valid. No error is thrown — it silently passes.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I inject services into a validator?',
      a: 'Yes. Register the validator as Scoped (not Singleton) and inject dependencies via the constructor — just like any other service. The DI container resolves the validator per request so scoped services like DbContext are safe.',
    },
    {
      q: 'How do I validate nested objects?',
      a: 'Use RuleFor(x => x.Address).SetValidator(new AddressValidator()) to delegate to a child validator. You can also use RuleForEach(x => x.Items).SetValidator(new ItemValidator()) for collections.',
    },
    {
      q: 'Does FluentValidation work with Minimal APIs?',
      a: 'Yes. Inject IValidator<T> and call await validator.ValidateAsync(request). Return Results.ValidationProblem(result.ToDictionary()) on failure. There is no auto-validation hook for minimal API endpoints — you must call it manually.',
    },
    {
      q: 'How do I return custom HTTP status codes on validation failure?',
      a: 'When using auto-validation with controllers, FluentValidation returns 400 with ModelState errors by default. To customize this, implement IActionFilter or use the FluentValidation.AspNetCore options to set a custom handler.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'FluentValidation separates validation logic into testable classes using a fluent API, integrating cleanly with ASP.NET model binding.',
    mustKnow: [
      'Extend AbstractValidator<T> and define rules in the constructor with RuleFor()',
      'Chain rule methods: .NotEmpty(), .Length(), .EmailAddress(), .Matches(), .GreaterThan()',
      'Use .MustAsync() (not .Must()) for async database or API checks',
      'Use .When() to apply rules conditionally; .Unless() is the inverse',
      'Register with AddFluentValidationAutoValidation() + AddValidatorsFromAssembly()',
      'Manual validation: inject IValidator<T>, call ValidateAsync(), return ValidationProblem()',
    ],
    interviewFocus: [
      'Why prefer FluentValidation over DataAnnotations? (testability, complex cross-property rules, async support)',
      'Difference between Must() and MustAsync() — why async in Must() causes deadlocks',
      'How FluentValidation integrates with ASP.NET Core model binding pipeline',
      'How to validate nested objects and collections (SetValidator, RuleForEach)',
    ],
  };
}
