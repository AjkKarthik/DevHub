import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-csharp-namespaces',
  standalone: true,
  imports: [
    CommonModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './namespaces.html',
  styleUrl: './namespaces.scss',
})
export class CsharpNamespaces {

  quickRef: QuickRefItem[] = [
    { name: 'namespace',          type: 'keyword', desc: 'Declares a namespace scope. Types inside are accessed as Namespace.TypeName.', since: 'C# 1' },
    { name: 'file-scoped ns',     type: 'syntax',  desc: 'C# 10. namespace MyApp; at top of file — no braces. Entire file is in that namespace.', since: 'C# 10' },
    { name: 'using',              type: 'keyword', desc: 'Imports a namespace so its types can be used without the full qualified name.', since: 'C# 1' },
    { name: 'global using',       type: 'keyword', desc: 'C# 10. Applies a using directive to every file in the project.', since: 'C# 10' },
    { name: 'using static',       type: 'keyword', desc: 'Imports static members of a type: using static System.Math → Sqrt(4) instead of Math.Sqrt(4).', since: 'C# 6' },
    { name: 'using alias',        type: 'syntax',  desc: 'Creates a short name for a type or namespace: using Env = System.Environment;', since: 'C# 1' },
    { name: 'global using alias', type: 'syntax',  desc: 'C# 12. Project-wide type alias: global using Point = (int X, int Y);', since: 'C# 12' },
    { name: 'extern alias',       type: 'keyword', desc: 'Resolves name conflicts between assemblies that define types with the same fully-qualified name.', since: 'C# 2' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What namespaces are for',
      points: [
        'A namespace is a logical container that groups related types and prevents name collisions between libraries. <code>System.IO.File</code> and a hypothetical <code>MyApp.IO.File</code> coexist without conflict.',
        'Namespaces are purely a compile-time concept — at runtime, the CLR only knows about fully-qualified type names baked into the IL. There is no performance cost to deep or shallow namespaces.',
        'Convention in .NET: namespaces mirror folder structure. <code>MyCompany.MyProduct.Domain.Orders</code> would live in <code>src/Domain/Orders/</code>. This is a convention, not a language requirement.',
        'A single namespace can span multiple files, and a single file can contain types from multiple namespaces — though both practices should be used sparingly to avoid confusion.',
        'The global namespace (no namespace declaration) is the root. Types there are accessible everywhere but pollute the global scope — avoid it in libraries and application code.',
      ],
    },
    {
      heading: 'Block-scoped vs file-scoped namespaces',
      points: [
        'Traditional namespaces use curly braces and indent everything inside one level. For files with many types this adds visual noise with no semantic benefit.',
        'C# 10 introduced <strong>file-scoped namespaces</strong>: <code>namespace MyApp.Services;</code> — a single semicolon-terminated line, no braces, and the entire file is in that namespace. This is now the recommended style in modern .NET projects.',
        'File-scoped namespaces cannot coexist with block-scoped namespaces in the same file, and you can only have one file-scoped namespace per file.',
        'The .NET SDK template and <code>dotnet new</code> generate file-scoped namespaces by default since .NET 6. New projects should adopt them consistently.',
        'You can configure VS/Rider to enforce file-scoped namespaces project-wide via an <code>.editorconfig</code> rule: <code>csharp_style_namespace_declarations = file_scoped</code>.',
      ],
    },
    {
      heading: 'using directives and global usings',
      points: [
        '<code>using System.Collections.Generic;</code> lets you write <code>List&lt;T&gt;</code> instead of <code>System.Collections.Generic.List&lt;T&gt;</code>. It is purely a compile-time convenience — zero runtime overhead.',
        '<code>global using</code> (C# 10) applies the directive project-wide. Centralizing common imports in a single <code>GlobalUsings.cs</code> file eliminates repetitive using blocks at the top of every file.',
        '.NET 6+ SDK projects with <code>&lt;ImplicitUsings&gt;enable&lt;/ImplicitUsings&gt;</code> automatically add global usings for common namespaces (System, System.Linq, System.Collections.Generic, etc.).',
        'Avoid <code>global using</code> for namespaces with common type names that could cause ambiguity across the project — keep those local to the files that need them.',
        'Using directives are resolved in this order: file-local usings first, then global usings, then the containing namespace scope. Aliases always win over unaliased imports when both match.',
      ],
    },
    {
      heading: 'using static and using aliases',
      points: [
        '<code>using static System.Math;</code> lets you write <code>Sqrt(16)</code> instead of <code>Math.Sqrt(16)</code>. Perfect for files heavy in mathematical expressions.',
        '<code>using static System.Console;</code> is popular in tutorial code but use it sparingly in production — unqualified <code>WriteLine</code> makes it harder to see what type is being called.',
        'A <strong>using alias</strong> creates a short name for any type or namespace: <code>using Json = System.Text.Json.JsonSerializer;</code>. Essential when two namespaces both export a type with the same simple name.',
        'C# 12 allows aliases for generic types, tuples, and pointer types: <code>using Point = (int X, int Y);</code> — a powerful way to introduce domain-friendly names for compound types.',
        'Aliases are file-scoped by default. Use <code>global using Alias = ...</code> for aliases you want across the entire project, such as a canonical short name for a frequently used tuple type.',
      ],
    },
    {
      heading: 'Nested namespaces and .NET conventions',
      points: [
        'You can nest namespaces: <code>namespace Outer { namespace Inner { ... } }</code>. The shorthand is <code>namespace Outer.Inner { ... }</code> (block-scoped) or <code>namespace Outer.Inner;</code> (file-scoped).',
        '.NET convention: <code>CompanyName.ProductName.Layer.Feature</code>. Layers might be <em>Domain</em>, <em>Application</em>, <em>Infrastructure</em>, <em>API</em>.',
        'Keep namespace depth proportional to actual project size. A 5-file CLI tool does not need 4-level namespaces; a 200-file microservice does.',
        'Resist putting unrelated types in the same namespace just because they happen to be in the same folder — namespace alignment with folder structure is a guideline, not a rule.',
        'In Clean Architecture, namespace conventions signal layer boundaries: types in <code>MyApp.Infrastructure</code> may depend on <code>MyApp.Domain</code> but never the reverse — the namespace itself documents the dependency direction.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Block vs file-scoped',
      language: 'csharp',
      code: `// ── Old style (block-scoped) ──────────────────────────────────
// Every type indented one level inside the braces.
namespace MyApp.Services
{
    public class EmailService
    {
        public void Send(string to, string subject) { /* ... */ }
    }

    public class SmsService
    {
        public void Send(string to, string message) { /* ... */ }
    }
}

// ── Modern style (file-scoped, C# 10) ─────────────────────────
// One semicolon-terminated declaration, no indentation overhead.
// Recommended for all new .NET 6+ code.
namespace MyApp.Services;

public class EmailService
{
    public void Send(string to, string subject) { /* ... */ }
}

public class SmsService
{
    public void Send(string to, string message) { /* ... */ }
}

// ── .editorconfig enforcement ──────────────────────────────────
// csharp_style_namespace_declarations = file_scoped:warning
// This turns mismatched namespace style into a compiler warning.`,
    },
    {
      label: 'global using & implicit usings',
      language: 'csharp',
      code: `// ── GlobalUsings.cs ──────────────────────────────────────────
// Centralise all global using directives in one file.
// These apply to every .cs file in the project.

global using System.Text.Json;
global using Microsoft.Extensions.Logging;
global using MyApp.Domain;          // your own domain layer
global using MyApp.Application;

// Alias also works globally (C# 12: any type including generics and tuples)
global using OrderId = int;
global using Coordinate = (double Lat, double Lng);

// ── Any other file — no using directives needed ───────────────
namespace MyApp.Services;

public class OrderService(ILogger<OrderService> logger)
{
    public string Serialize(Order order)
    {
        // JsonSerializer available without a local using directive
        return JsonSerializer.Serialize(order);
    }
}

// ── .csproj — enable SDK implicit usings ─────────────────────
// <PropertyGroup>
//   <ImplicitUsings>enable</ImplicitUsings>
// </PropertyGroup>
// Adds global usings for System, System.Linq,
// System.Collections.Generic, System.Threading.Tasks, System.IO, etc.`,
    },
    {
      label: 'using static & aliases',
      language: 'csharp',
      code: `using static System.Math;
using static System.Console;

// Math and Console members usable without prefix
double Hypotenuse(double a, double b) => Sqrt(a * a + b * b);

WriteLine($"Hypotenuse(3, 4) = {Hypotenuse(3, 4)}"); // 5

// ── using aliases — resolve naming conflicts ──────────────────
// Both System.Threading.Tasks and a hypothetical custom library
// export a type named "Task".
using SysTask = System.Threading.Tasks.Task;
using MyTask  = MyCompany.Workflow.Task;

SysTask RunAsync()        => SysTask.CompletedTask;
MyTask  CreateWorkflow()  => new MyTask { Name = "Deploy" };

// ── C# 12 type aliases for complex types ─────────────────────
using Point    = (double X, double Y);
using IntRange = (int Min, int Max);

Point origin = (0.0, 0.0);
IntRange ages = (Min: 18, Max: 65);
Console.WriteLine($"Origin: ({origin.X}, {origin.Y})");
Console.WriteLine($"Age range: {ages.Min}–{ages.Max}");

// ── using static on an enum ──────────────────────────────────
using static System.DayOfWeek;

var weekdays = new[] { Monday, Tuesday, Wednesday, Thursday, Friday };
var weekend  = new[] { Saturday, Sunday };`,
    },
    {
      label: 'Namespace organisation pattern',
      language: 'csharp',
      code: `// Typical Clean Architecture namespace layout

// ── MyApp.Domain ──────────────────────────────────────────────
namespace MyApp.Domain;

public class Order
{
    public int      Id         { get; init; }
    public int      CustomerId { get; init; }
    public DateTime CreatedAt  { get; init; } = DateTime.UtcNow;
}

public interface IOrderRepository
{
    Task<Order?> FindByIdAsync(int id);
    Task AddAsync(Order order);
}

// ── MyApp.Application ─────────────────────────────────────────
namespace MyApp.Application;

using MyApp.Domain;  // Application depends on Domain — explicit, visible

public record PlaceOrderCommand(int CustomerId, int ProductId, int Quantity = 1);

public class PlaceOrderHandler(IOrderRepository repo)
{
    public async Task HandleAsync(PlaceOrderCommand cmd)
    {
        var order = new Order { CustomerId = cmd.CustomerId };
        await repo.AddAsync(order);
    }
}

// ── MyApp.Infrastructure ──────────────────────────────────────
namespace MyApp.Infrastructure;

using MyApp.Domain;  // Infrastructure depends on Domain — not on Application

public class EfOrderRepository(AppDbContext db) : IOrderRepository
{
    public Task<Order?> FindByIdAsync(int id) =>
        db.Orders.FindAsync(id).AsTask();

    public async Task AddAsync(Order order)
    {
        db.Orders.Add(order);
        await db.SaveChangesAsync();
    }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Repeating the same using directives in every file instead of using global usings',
      wrong: `// OrderService.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;
// ... same 6 lines in every file`,
      right: `// GlobalUsings.cs — write once, applies everywhere
global using System;
global using System.Collections.Generic;
global using System.Linq;
global using Microsoft.Extensions.Logging;

// OrderService.cs — no using block needed
namespace MyApp.Application;

public class OrderService { }`,
      explanation: 'Repeating identical using directives in every file is boilerplate with no benefit. global using (C# 10) or ImplicitUsings in the csproj centralises common imports. This also means a namespace rename only needs updating in one place.',
    },
    {
      title: 'Mixing file-scoped and block-scoped namespaces across the project',
      wrong: `// File A — block-scoped
namespace MyApp.Services
{
    public class OrderService { }
}

// File B — file-scoped
namespace MyApp.Services;
public class ProductService { }`,
      right: `// All files use file-scoped (modern default)
// File A
namespace MyApp.Services;
public class OrderService { }

// File B
namespace MyApp.Services;
public class ProductService { }`,
      explanation: 'Mixing styles in a project is inconsistent and distracting during code review. Pick one style and enforce it with .editorconfig: csharp_style_namespace_declarations = file_scoped:warning. New .NET projects default to file-scoped — stick with it.',
    },
    {
      title: 'Using "using static System.Console" in production services',
      wrong: `using static System.Console;

public class ReportService
{
    public void Generate()
    {
        WriteLine("Generating...");   // Is this Console? File? Logger? Not obvious.
        ReadLine();
    }
}`,
      right: `public class ReportService(ILogger<ReportService> logger)
{
    public void Generate()
    {
        logger.LogInformation("Generating...");  // intent is clear
    }
}`,
      explanation: 'using static System.Console in production code makes method calls ambiguous — readers cannot tell at a glance whether WriteLine comes from Console, a custom logger, or something else. Reserve using static for mathematical helpers (System.Math) or tests. In services, use proper logging via ILogger.',
    },
    {
      title: 'Declaring types in the global namespace (no namespace)',
      wrong: `// No namespace — this is in the global namespace
public class UserHelper { }  // accessible everywhere, pollutes global scope

// In another project that references this one:
var h = new UserHelper();    // works, but no namespace context`,
      right: `namespace MyApp.Helpers;

public class UserHelper { }

// Other projects:
using MyApp.Helpers;
var h = new UserHelper();`,
      explanation: 'Types in the global namespace can conflict with types from other libraries (or future .NET versions). They also have no organizational context — UserHelper tells you nothing about which domain or layer it belongs to. Always declare a namespace, even for small utilities.',
    },
    {
      title: 'Namespace not matching folder structure, breaking tooling expectations',
      wrong: `// File location: src/Services/Payments/PaymentProcessor.cs
namespace MyApp.Core;  // mismatch — tooling expects MyApp.Services.Payments

public class PaymentProcessor { }`,
      right: `// File location: src/Services/Payments/PaymentProcessor.cs
namespace MyApp.Services.Payments;

public class PaymentProcessor { }`,
      explanation: 'Most C# tools (VS, Rider, dotnet analyzers) expect namespace to match the folder path relative to the project root. Mismatches confuse "Move to file" refactors, cause IDE warnings, and make folder-based code navigation misleading. Enforce this with the IDE0130 analyzer rule.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the main advantage of file-scoped namespaces (C# 10)?',
      options: [
        'They allow multiple namespaces per file.',
        'They reduce indentation by one level and remove the wrapping braces.',
        'They improve runtime performance.',
        'They automatically import nested namespaces.',
      ],
      answer: 1,
      explanation: 'File-scoped namespaces (namespace Foo;) eliminate the curly-brace wrapper, reducing indentation by one level across the entire file. The whole file belongs to that namespace. Semantics are identical to the block-scoped form.',
    },
    {
      q: 'What does "global using System.Linq;" do?',
      options: [
        'Imports System.Linq only in the file where it is declared.',
        'Imports System.Linq into every file in the project automatically.',
        'Makes all LINQ methods available without any qualification.',
        'Replaces the need for using static.',
      ],
      answer: 1,
      explanation: 'A global using directive applies to every source file in the same compilation unit (project). It is equivalent to placing that using directive at the top of every file.',
    },
    {
      q: 'What does "using static System.Math;" allow you to do?',
      options: [
        'Create static methods on Math without extension methods.',
        'Call Math static members (Sqrt, Abs, etc.) without the Math. prefix.',
        'Import all types inside the System.Math namespace.',
        'Override Math methods with your own implementations.',
      ],
      answer: 1,
      explanation: 'using static imports the static members of a type directly into scope. After "using static System.Math", you can write Sqrt(4) instead of Math.Sqrt(4).',
    },
    {
      q: 'When are using alias directives most useful?',
      options: [
        'To make all imports global across the project.',
        'To resolve name collisions when two namespaces export a type with the same simple name.',
        'To improve performance by reducing namespace lookup time.',
        'To replace the need for file-scoped namespaces.',
      ],
      answer: 1,
      explanation: 'Aliases (using MyTask = MyCompany.Task;) are most valuable when two referenced namespaces both contain a type with the same name, causing ambiguity. They also help shorten very long type names and, in C# 12, can introduce domain-friendly names for tuple and generic types.',
    },
    {
      q: 'Is there a runtime performance difference between a deeply nested namespace and the global namespace?',
      options: [
        'Yes — every dot in the namespace adds an indirection at runtime.',
        'No — namespaces are purely a compile-time concept; the runtime only knows fully-qualified type names.',
        'Yes — global namespace types are JIT-compiled faster.',
        'It depends on whether the namespace is sealed.',
      ],
      answer: 1,
      explanation: 'Namespaces are entirely a compile-time construct for name resolution. The compiled IL contains only fully-qualified type names and the runtime never navigates namespace hierarchies. A 5-segment namespace costs exactly the same as no namespace at runtime.',
    },
    {
      q: 'Which .csproj setting automatically adds global usings for System, System.Linq, System.Collections.Generic, etc.?',
      options: [
        '<UseGlobalUsings>true</UseGlobalUsings>',
        '<ImplicitUsings>enable</ImplicitUsings>',
        '<AutoUsings>true</AutoUsings>',
        '<Nullable>enable</Nullable>',
      ],
      answer: 1,
      explanation: '<ImplicitUsings>enable</ImplicitUsings> in the .csproj tells the .NET 6+ SDK to generate a set of global using directives covering the most commonly needed namespaces, so you don\'t have to repeat them in every file.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does a namespace have to match the folder structure?',
      a: 'No — it is a convention, not a language requirement. However, following the convention (namespace mirrors folder path) makes code much easier to navigate, especially in large projects. Tools like Resharper and VS will warn you when they diverge via the IDE0130 analyzer. Breaking the convention intentionally is fine in small projects or for intentional domain grouping.',
    },
    {
      q: 'Can I have more than one namespace in a single file?',
      a: 'Yes, with block-scoped namespaces you can declare multiple namespace blocks in one file. With file-scoped namespaces you can only have one per file. In practice, having multiple namespaces in a file is uncommon and usually a sign that the file should be split — one type per file is a strong convention in modern C# projects.',
    },
    {
      q: 'What are implicit usings and how do I control them?',
      a: 'Implicit usings are a .NET 6+ SDK feature enabled by <code>&lt;ImplicitUsings&gt;enable&lt;/ImplicitUsings&gt;</code> in the .csproj. The SDK auto-generates a file adding global usings for the most common namespaces (System, System.Linq, System.Collections.Generic, System.IO, etc.). You can add extras or override them in your own <code>GlobalUsings.cs</code> file. Disable the feature by setting it to <code>disable</code> if you prefer full control.',
    },
    {
      q: 'If namespaces add zero runtime overhead, why do teams still avoid overly deep namespace hierarchies (e.g. Company.Product.Module.SubModule.Feature.Handlers.Foo) in practice?',
      a: 'The cost of deep namespaces is entirely a HUMAN one, not a runtime one: longer fully-qualified names make error messages, stack traces, and IntelliSense suggestions harder to scan quickly; deep folder-mirrored hierarchies (a common convention) create more directory navigation friction in an IDE; and namespace depth can end up encoding organizational structure that changes more often than the code itself, forcing renames across many files when a team reorganizes. None of this is a JIT or IL-level cost — it is entirely about the namespace acting as a naming/organization aid for humans reading and navigating the codebase, which is exactly why the depth question is a design/readability tradeoff, not a performance one.',
    },
    {
      q: 'What is the difference between a using alias and extern alias?',
      a: '<code>using Alias = SomeType;</code> creates a short name for a type or namespace within the current file (or project if global). <code>extern alias</code> is for a more extreme case: two referenced assemblies define types with the exact same fully-qualified name. <code>extern alias</code> lets you assign a prefix to each assembly at the project level and disambiguate which one you mean. It is very rare and usually only needed in large multi-assembly setups or when interoping with legacy COM libraries.',
    },
    {
      q: 'Should I put all global usings in one file or spread them across files?',
      a: 'One dedicated file — conventionally named <code>GlobalUsings.cs</code> at the project root. Spreading global usings across multiple files makes it hard to audit what is imported project-wide, and duplicate global usings produce compiler warnings. A single file is easy to review, diff, and maintain. Keep it focused: only namespaces used in 3+ files belong there; rare imports stay local.',
    },
  ];

  challenge: Challenge = {
    title: 'Refactor a cluttered file using modern namespace features',
    language: 'csharp',
    description: `You are given a single bloated file using old-style namespaces and no organization. Refactor it using modern C# conventions.

Tasks:
1. Split into two files: Product.cs (Domain) and ProductService.cs (Application), each using file-scoped namespaces.
2. Create a GlobalUsings.cs that eliminates per-file repetition (System, System.Collections.Generic, System.Linq, Microsoft.Extensions.Logging).
3. Add "using static System.Console;" in ProductService.cs and add a LogAndPrint method that calls WriteLine without prefix.
4. Add a using alias in ProductService.cs: "using JsonSer = System.Text.Json.JsonSerializer;" and use it in the Serialize method.

Write out all three files with full content.`,
    starterCode: `// Original bloated file (old style):
// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Text.Json;
// using Microsoft.Extensions.Logging;
//
// namespace MyShop.Domain
// {
//     public class Product { public int Id { get; set; } public string Name { get; set; } }
// }
//
// namespace MyShop.Application
// {
//     using MyShop.Domain;
//     public class ProductService
//     {
//         private readonly ILogger<ProductService> _logger;
//         public ProductService(ILogger<ProductService> logger) { _logger = logger; }
//         public string Serialize(IEnumerable<Product> products) =>
//             JsonSerializer.Serialize(products);
//     }
// }

// TODO — write GlobalUsings.cs, Product.cs, and ProductService.cs below:`,
    solution: `// ── GlobalUsings.cs ──────────────────────────────────────────
global using System;
global using System.Collections.Generic;
global using System.Linq;
global using Microsoft.Extensions.Logging;

// ── Product.cs ────────────────────────────────────────────────
namespace MyShop.Domain;

public class Product
{
    public int    Id   { get; set; }
    public string Name { get; set; } = string.Empty;
}

// ── ProductService.cs ─────────────────────────────────────────
namespace MyShop.Application;

using MyShop.Domain;
using static System.Console;
using JsonSer = System.Text.Json.JsonSerializer;

public class ProductService(ILogger<ProductService> logger)
{
    public string Serialize(IEnumerable<Product> products) =>
        JsonSer.Serialize(products);

    public void LogAndPrint(string message)
    {
        logger.LogInformation(message);
        WriteLine(message);   // using static System.Console
    }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Namespaces organise types and prevent name collisions. They are compile-time only — zero runtime cost. Modern C# uses file-scoped namespaces and global usings to remove boilerplate.',
    mustKnow: [
      'Namespaces are a compile-time concept only — no runtime cost, no matter how deeply nested.',
      'File-scoped namespace (<code>namespace Foo;</code>, C# 10) eliminates braces and reduces indentation by one level. Recommended for all new .NET 6+ code.',
      '<code>global using</code> (C# 10) applies a using directive to every file in the project. Centralise them in <code>GlobalUsings.cs</code>.',
      '<code>ImplicitUsings = enable</code> in .csproj auto-adds global usings for System, System.Linq, System.Collections.Generic, etc.',
      '<code>using static TypeName</code> brings static members into scope without prefix — great for Math, but avoid it for Console in production code.',
      'Using aliases (<code>using Short = Long.Type;</code>) resolve naming conflicts. C# 12 extends them to generic types, tuples, and pointers.',
      'Convention: namespace should mirror folder path. Violations confuse tooling (IDE0130 analyzer).',
    ],
    interviewFocus: [
      'What is the difference between file-scoped and block-scoped namespaces? (syntax only; same semantics)',
      'What does global using do and where should global usings be declared? (applies project-wide; one GlobalUsings.cs)',
      'Does namespace depth affect runtime performance? (no — purely compile-time)',
      'When would you use a using alias? (name collision; shortening long types; C# 12 tuple aliases)',
      'What is ImplicitUsings and what does enabling it add? (SDK-generated global usings for common namespaces)',
    ],
  };
}
