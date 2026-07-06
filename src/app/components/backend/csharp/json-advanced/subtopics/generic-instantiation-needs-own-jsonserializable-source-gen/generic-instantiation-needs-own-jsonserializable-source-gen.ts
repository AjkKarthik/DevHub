import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-generic-instantiation-needs-own-jsonserializable-source-gen-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './generic-instantiation-needs-own-jsonserializable-source-gen.html',
  styleUrl: './generic-instantiation-needs-own-jsonserializable-source-gen.scss',
})
export class GenericInstantiationNeedsOwnJsonserializableSourceGenSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own example registers PagedResult&lt;Product&gt; explicitly — this is not optional boilerplate, it is a hard requirement',
      points: [
        'The main System.Text.Json Advanced page\'s source generation example includes <code>[JsonSerializable(typeof(PagedResult&lt;Product&gt;))]</code> alongside <code>[JsonSerializable(typeof(Product))]</code>. It would be easy to assume this is just being thorough — that once <code>Product</code> and the OPEN generic <code>PagedResult&lt;T&gt;</code> are "known" to the generator, any CLOSED instantiation of it (like <code>PagedResult&lt;Order&gt;</code>) would work automatically. It does not.',
      ],
    },
    {
      heading: 'Reflection-based serialization works on ANY generic instantiation at runtime — source generation only knows about the EXACT closed types listed at compile time',
      points: [
        'Reflection-based <code>JsonSerializer.Serialize(obj)</code> (no context) inspects the object\'s ACTUAL runtime type via reflection at the moment it runs — it can serialize <code>PagedResult&lt;Order&gt;</code> just fine even if nobody ever wrote that exact type name anywhere, because reflection discovers the type\'s properties dynamically, at runtime, for whatever type happens to be passed in.',
        'The source generator, by contrast, runs ONCE at COMPILE TIME, and only emits <code>JsonTypeInfo&lt;T&gt;</code> metadata for the EXACT closed generic types explicitly listed via <code>[JsonSerializable(typeof(...))]</code>. <code>PagedResult&lt;Product&gt;</code> and <code>PagedResult&lt;Order&gt;</code> are, to the source generator, two COMPLETELY UNRELATED types — registering one tells it NOTHING about the other, even though both share the exact same open generic definition <code>PagedResult&lt;T&gt;</code> in your C# source.',
      ],
    },
    {
      heading: 'Attempting to use the generated context for an unregistered closed generic type fails at RUNTIME, not compile time',
      points: [
        'Calling <code>MyContext.Default.GetTypeInfo(typeof(PagedResult&lt;Order&gt;))</code> for a type that was never explicitly listed returns <code>null</code> — this is NOT a compile error, since <code>GetTypeInfo</code> is a normal runtime method call that compiles fine for ANY <code>Type</code> argument. The failure only surfaces when code actually tries to serialize a <code>PagedResult&lt;Order&gt;</code> using the context and gets a <code>NotSupportedException</code> (or a null <code>JsonTypeInfo</code>, depending on the call site) — precisely the kind of "works in dev with the types you tested, breaks in production with a type you forgot" bug that AOT builds are especially unforgiving about, since there is no reflection fallback available at all in a trimmed AOT binary.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The trap — registering PagedResult<Product> does NOT cover PagedResult<Order>',
      language: 'csharp',
      code: `public class Product { public int Id { get; set; } public string Name { get; set; } = ""; }
public class Order   { public int Id { get; set; } public decimal Total { get; set; } }

public class PagedResult<T>
{
    public IList<T> Items      { get; set; } = [];
    public int      TotalCount { get; set; }
}

[JsonSerializable(typeof(Product))]
[JsonSerializable(typeof(Order))]
[JsonSerializable(typeof(PagedResult<Product>))]
// PagedResult<Order> was NEVER listed — an easy omission, since
// PagedResult<Product> "looks like" it should cover the general case
public partial class AppJsonContext : JsonSerializerContext { }

var products = new PagedResult<Product> { Items = [new Product { Id = 1, Name = "Widget" }] };
var orders   = new PagedResult<Order>   { Items = [new Order   { Id = 1, Total = 49.99m }] };

// Works fine:
string productsJson = JsonSerializer.Serialize(products, AppJsonContext.Default.PagedResultProduct);

// Compiles fine, but FAILS AT RUNTIME — AppJsonContext.Default has no
// "PagedResultOrder" property at all, because it was never registered:
// string ordersJson = JsonSerializer.Serialize(orders, AppJsonContext.Default.PagedResultOrder);
//                                                                              ^ compile error: no such member

// The MORE DANGEROUS variant — going through the generic overload,
// which DOES compile, but throws at runtime:
string ordersJson = JsonSerializer.Serialize(orders, typeof(PagedResult<Order>), AppJsonContext.Default);
// System.NotSupportedException: JsonTypeInfo metadata for type
// 'PagedResult\`1[Order]' was not provided by TypeInfoResolver.`,
    },
    {
      label: 'The fix — every closed generic instantiation gets its own explicit registration',
      language: 'csharp',
      code: `[JsonSerializable(typeof(Product))]
[JsonSerializable(typeof(Order))]
[JsonSerializable(typeof(PagedResult<Product>))]
[JsonSerializable(typeof(PagedResult<Order>))]   // now explicitly registered
public partial class AppJsonContext : JsonSerializerContext { }

var orders = new PagedResult<Order> { Items = [new Order { Id = 1, Total = 49.99m }] };

// Now works — the generator emitted a dedicated PagedResultOrder
// property on AppJsonContext.Default for this exact closed type:
string ordersJson = JsonSerializer.Serialize(orders, AppJsonContext.Default.PagedResultOrder);

// Every NEW generic result type used anywhere in the app (PagedResult<Customer>,
// PagedResult<Invoice>, etc.) needs its OWN [JsonSerializable] line — there
// is no way to say "cover every T that PagedResult<T> could ever be used with"
// in one single attribute.`,
    },
    {
      label: 'Why reflection-based serialization never hits this problem at all',
      language: 'csharp',
      code: `// No JsonSerializerContext involved — plain reflection-based serialization:
var orders = new PagedResult<Order> { Items = [new Order { Id = 1, Total = 49.99m }] };

// This works with ZERO prior registration of PagedResult<Order> anywhere —
// reflection inspects the OBJECT'S ACTUAL RUNTIME TYPE the moment this line
// executes, discovering its properties dynamically:
string json = JsonSerializer.Serialize(orders);

// This is exactly why the trap is so easy to fall into when MIGRATING an
// existing reflection-based codebase to source generation for AOT: code
// that worked perfectly for months under reflection can compile cleanly
// but throw NotSupportedException at runtime the FIRST time it touches a
// generic instantiation nobody thought to explicitly list.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team migrates an ASP.NET Core minimal API from reflection-based JSON to a <code>JsonSerializerContext</code> for AOT deployment. All existing endpoints pass their tests. Three months later, a NEW endpoint returning <code>PagedResult&lt;Invoice&gt;</code> throws <code>NotSupportedException</code> in production, but never in local development. Explain why local development did not catch it.',
    hint: 'Consider whether the local development environment was actually running as a trimmed Native AOT binary, or whether it was running the normal (non-AOT) build — and what fallback behavior that difference implies for JsonSerializerContext-based code.',
    solution: `// The context, missing the new PagedResult<Invoice> registration:
[JsonSerializable(typeof(Product))]
[JsonSerializable(typeof(Order))]
[JsonSerializable(typeof(PagedResult<Product>))]
[JsonSerializable(typeof(PagedResult<Order>))]
// PagedResult<Invoice> was never added when the new endpoint was written
public partial class AppJsonContext : JsonSerializerContext { }

// The new endpoint:
app.MapGet("/invoices", () => new PagedResult<Invoice> { Items = [...] });

// WHY LOCAL DEV DIDN'T CATCH IT:
// If the ASP.NET Core minimal API's JSON options chain a REFLECTION-BASED
// resolver AFTER the source-generated context (a common, often-default
// configuration: builder.Services.ConfigureHttpJsonOptions(o =>
// o.SerializerOptions.TypeInfoResolverChain.Add(AppJsonContext.Default))
// — note ".Add", not replacing the chain entirely), then when
// AppJsonContext has no PagedResult<Invoice> entry, STJ silently FALLS
// BACK to the next resolver in the chain — reflection — which works
// fine in a NORMAL (non-trimmed, non-AOT) local dev build, since
// reflection metadata is still fully present there.
//
// In PRODUCTION, if the app is published as Native AOT (dotnet publish
// -r <rid> with PublishAot=true), the trimmer REMOVES the reflection
// metadata the fallback resolver depends on — there is no reflection
// resolver left to silently catch the miss. The exact same code path
// that quietly "worked" via a hidden reflection fallback in dev now has
// NOTHING left to fall back to, and throws NotSupportedException the
// first time a request actually needs PagedResult<Invoice>.
//
// The fix is prevention, not detection after the fact: add a build or
// test step that explicitly attempts to resolve JsonTypeInfo for every
// public API response type through AppJsonContext.Default ALONE (with
// no reflection fallback registered), catching a missing registration
// long before it reaches an AOT-published environment.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'registering PagedResult&lt;Product&gt; with [JsonSerializable] also covers other closed instantiations of PagedResult&lt;T&gt;, like PagedResult&lt;Order&gt;.',
      reality: 'each closed generic instantiation is a completely separate, unrelated type to the source generator — registering one tells it nothing about any other; every T used with PagedResult&lt;T&gt; anywhere in the app needs its own explicit [JsonSerializable] entry.',
    },
    {
      thought: 'a missing [JsonSerializable] registration for a generic type will be caught at compile time.',
      reality: 'it compiles fine — the failure only surfaces at RUNTIME when code actually tries to serialize that specific unregistered type, and often only in a Native AOT build where there is no reflection fallback left to silently mask the gap.',
    },
    {
      thought: 'if source-generated serialization "worked in local dev testing", it will work identically in a Native AOT production deployment.',
      reality: 'a common JSON options configuration chains a reflection-based resolver AFTER the source-generated context as a fallback — this fallback works in a normal dev build but is unavailable in a trimmed AOT binary, so a missing registration can pass silently in dev and only fail in production.',
    },
  ];
}
