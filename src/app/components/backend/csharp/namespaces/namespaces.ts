import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-csharp-namespaces',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './namespaces.html',
  styleUrl: './namespaces.scss',
})
export class CsharpNamespaces {

  quickRef: QuickRefItem[] = [
    { name: 'namespace',        type: 'keyword', desc: 'Declares a namespace scope. Types inside are accessed as Namespace.TypeName.', since: 'C# 1' },
    { name: 'file-scoped ns',   type: 'syntax',  desc: 'C# 10. namespace MyApp; at the top of a file — no braces needed. Entire file is in that namespace.', since: 'C# 10' },
    { name: 'using',            type: 'keyword', desc: 'Imports a namespace so its types can be used without the full qualified name.', since: 'C# 1' },
    { name: 'global using',     type: 'keyword', desc: 'C# 10. Applies a using directive to every file in the project.', since: 'C# 10' },
    { name: 'using static',     type: 'keyword', desc: 'Imports static members of a type so they can be used without the type name prefix.', since: 'C# 6' },
    { name: 'using alias',      type: 'syntax',  desc: 'Creates a short name for a type or namespace: using Env = System.Environment;', since: 'C# 1' },
    { name: 'extern alias',     type: 'keyword', desc: 'Resolves name conflicts between assemblies that define types with the same fully-qualified name.', since: 'C# 2' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What namespaces are for',
      points: [
        'A namespace is a logical container that groups related types and prevents name collisions between libraries. <code>System.IO.File</code> and a hypothetical <code>MyApp.IO.File</code> coexist without conflict.',
        'Namespaces are purely a compile-time concept — at runtime, the CLR only knows about fully-qualified type names baked into the IL. There is no performance cost to deep or shallow namespaces.',
        'Convention in .NET: namespaces mirror folder structure. <code>MyCompany.MyProduct.Domain.Orders</code> would live in <code>src/Domain/Orders/</code>. This is a convention, not a language requirement.',
        'A single namespace can span multiple files, and a single file can contain types from multiple namespaces — though both practices should be used sparingly to avoid confusion.',
      ],
    },
    {
      heading: 'Block-scoped vs file-scoped namespaces',
      points: [
        'Traditional namespaces use curly braces and indent everything inside one level. For files with many types this adds visual noise.',
        'C# 10 introduced <strong>file-scoped namespaces</strong>: <code>namespace MyApp.Services;</code> — a single line, no braces, and the entire file is in that namespace. This is now the recommended style in modern .NET projects.',
        'File-scoped namespaces cannot coexist with block-scoped namespaces in the same file, and you can only have one file-scoped namespace per file.',
        'The .NET SDK template and <code>dotnet new</code> generate file-scoped namespaces by default since .NET 6.',
      ],
    },
    {
      heading: 'using directives and global usings',
      points: [
        '<code>using System.Collections.Generic;</code> lets you write <code>List&lt;T&gt;</code> instead of <code>System.Collections.Generic.List&lt;T&gt;</code>. It is purely a compile-time convenience.',
        '<code>global using</code> (C# 10) applies the directive project-wide. Centralizing common imports in a <code>GlobalUsings.cs</code> file eliminates repetitive using blocks at the top of every file.',
        '.NET 6+ SDK projects with <code>&lt;ImplicitUsings&gt;enable&lt;/ImplicitUsings&gt;</code> automatically add global usings for common namespaces (System, System.Linq, System.Collections.Generic, etc.).',
        'Avoid <code>global using</code> for namespaces with generic type names that could cause ambiguity — keep those local to the files that need them.',
      ],
    },
    {
      heading: 'using static and using aliases',
      points: [
        '<code>using static System.Math;</code> lets you write <code>Sqrt(16)</code> instead of <code>Math.Sqrt(16)</code>. Perfect for files heavy in mathematical expressions.',
        '<code>using static System.Console;</code> is popular in tutorial code but use it sparingly in production — unqualified <code>WriteLine</code> makes it harder to see at a glance what type is being called.',
        'A <strong>using alias</strong> creates a short name for any type or namespace: <code>using Json = System.Text.Json.JsonSerializer;</code>. Useful when two namespaces both export a type with the same simple name.',
        'Aliases are file-scoped by default. In C# 12, you can use <code>global using Alias = ...</code> for project-wide aliases.',
      ],
    },
    {
      heading: 'Nested namespaces and .NET conventions',
      points: [
        'You can nest namespaces: <code>namespace Outer { namespace Inner { ... } }</code>. The equivalent shorthand is <code>namespace Outer.Inner;</code> (file-scoped) or <code>namespace Outer.Inner { ... }</code> (block-scoped).',
        '.NET convention: <code>CompanyName.ProductName.Layer.Feature</code>. Layers might be <em>Domain</em>, <em>Application</em>, <em>Infrastructure</em>, <em>API</em>.',
        'Keep namespace depth proportional to actual project size. A 5-file CLI tool does not need 4-level namespaces.',
        'Resist putting unrelated types in the same namespace just because they happen to be in the same folder — namespace alignment with folder structure is a guideline, not a rule.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Block vs file-scoped',
      language: 'csharp',
      code: `// ── Old style (block-scoped) ──────────────────────────────────
// Every type is indented one level inside the braces.
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
}`,
    },
    {
      label: 'global using & implicit usings',
      language: 'csharp',
      code: `// ── GlobalUsings.cs ──────────────────────────────────────────
// Put all global using directives in one dedicated file.
// These apply to every .cs file in the project.

global using System.Text.Json;
global using Microsoft.Extensions.Logging;
global using MyApp.Domain;          // your own domain layer
global using MyApp.Application;

// Alias also works globally
global using JsonSer = System.Text.Json.JsonSerializer;

// ── Any other file in the project ─────────────────────────────
// No using directives needed — they come from GlobalUsings.cs
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
// Automatically adds global usings for:
//   System, System.Linq, System.Collections.Generic,
//   System.Threading.Tasks, System.IO, and a few more.`,
    },
    {
      label: 'using static & aliases',
      language: 'csharp',
      code: `using static System.Math;
using static System.Console;

// Now we can call Math members and Console members without prefix
double Hypotenuse(double a, double b) => Sqrt(a * a + b * b);

WriteLine(\`Hypotenuse(3, 4) = \${Hypotenuse(3, 4)}\`); // 5

// ── using aliases ──────────────────────────────────────────────

// Resolve ambiguity: both System.Threading.Tasks and a hypothetical
// custom library export a "Task" type.
using SysTask  = System.Threading.Tasks.Task;
using MyTask   = MyCompany.Workflow.Task;

SysTask RunAsync() => SysTask.CompletedTask;
MyTask  CreateWorkflow() => new MyTask { Name = "Deploy" };

// Alias for a long generic type (C# 12 allows aliases for generic types)
using IntMap = System.Collections.Generic.Dictionary<int, string>;

IntMap lookup = new()
{
    [1] = "One",
    [2] = "Two",
};

// using static for Enum flags
using static System.DayOfWeek;
var weekend = new[] { Saturday, Sunday };`,
    },
    {
      label: 'Namespace organisation pattern',
      language: 'csharp',
      code: `// Typical Clean Architecture namespace layout
// Each layer lives in its own namespace (and folder)

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

// Explicit using — Application depends on Domain
using MyApp.Domain;

public class PlaceOrderCommand
{
    public required int CustomerId { get; init; }
    public required int ProductId  { get; init; }
    public required int Quantity   { get; init; }
}

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

using MyApp.Domain;

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

  challenge: Challenge = {
    title: 'Refactor a cluttered file using modern namespace features',
    language: 'csharp',
    description: `You are given a single bloated file using old-style namespaces and no organization. Your task is to refactor it using modern C# conventions.

**Given code (old style):**
\`\`\`csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace MyShop.Domain
{
    public class Product { public int Id { get; set; } public string Name { get; set; } }
}

namespace MyShop.Application
{
    using MyShop.Domain;
    public class ProductService
    {
        private readonly ILogger<ProductService> _logger;
        public ProductService(ILogger<ProductService> logger) { _logger = logger; }
        public string Serialize(IEnumerable<Product> products) =>
            JsonSerializer.Serialize(products);
    }
}
\`\`\`

**Tasks:**
1. Split into two files: \`Product.cs\` (Domain) and \`ProductService.cs\` (Application), each using file-scoped namespaces.
2. Create a \`GlobalUsings.cs\` that eliminates the per-file using repetition (System, System.Collections.Generic, System.Linq, Microsoft.Extensions.Logging).
3. Add a \`using static System.Console;\` in \`ProductService.cs\` and add a \`LogAndPrint\` method that calls \`WriteLine\` without prefix.
4. Add a using alias in \`ProductService.cs\`: \`using JsonSer = System.Text.Json.JsonSerializer;\` and use it in the Serialize method.

Write out all three files with full content.`,
    starterCode: `// GlobalUsings.cs
// TODO: add global usings

// Product.cs
// TODO: file-scoped namespace + Product class

// ProductService.cs
// TODO: file-scoped namespace + using static + alias + ProductService class`,
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
      explanation: 'File-scoped namespaces (namespace Foo;) eliminate the curly-brace wrapper, reducing indentation by one level across the entire file. The whole file belongs to that namespace.',
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
      explanation: 'using static imports the static members of a type directly into scope. After using static System.Math, you can write Sqrt(4) instead of Math.Sqrt(4).',
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
      explanation: 'Aliases (using MyTask = MyCompany.Task;) are most valuable when two referenced namespaces both contain a type with the same name, causing ambiguity. They also help shorten very long type names.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Does a namespace have to match the folder structure?',
      a: 'No — it is a convention, not a language requirement. However, following the convention (namespace mirrors folder path) makes code much easier to navigate, especially in large projects. Tools like Resharper and VS will warn you when they diverge. Breaking the convention intentionally is fine in small projects or for intentional domain grouping.',
    },
    {
      q: 'Can I have more than one namespace in a single file?',
      a: 'Yes, with block-scoped namespaces you can declare multiple namespace blocks in one file. With file-scoped namespaces you can only have one. In practice, having multiple namespaces in a file is uncommon and usually a sign that the file should be split. Each namespace block can contain multiple types.',
    },
    {
      q: 'What are implicit usings and how do I control them?',
      a: 'Implicit usings are a .NET 6+ SDK feature enabled by <code>&lt;ImplicitUsings&gt;enable&lt;/ImplicitUsings&gt;</code> in the .csproj. The SDK auto-generates a file adding global usings for the most common namespaces (System, System.Linq, System.Collections.Generic, System.IO, etc.) so you do not have to repeat them. You can disable the feature or add your own in a <code>GlobalUsings.cs</code> file.',
    },
    {
      q: 'Is there a performance difference between deep and shallow namespaces?',
      a: 'No — namespaces are purely a compile-time concept for name resolution. The compiled IL contains only fully-qualified type names. The runtime never "navigates" namespaces. You can have <code>A.B.C.D.E.Foo</code> with absolutely no runtime overhead compared to <code>Foo</code> at the global level.',
    },
  ];
}
