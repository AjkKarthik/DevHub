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
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-csharp-expression-trees',
  standalone: true,
  imports: [
    CommonModule,
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './expression-trees.html',
  styleUrl: './expression-trees.scss',
})
export class CsharpExpressionTrees {

  prerequisites: Prerequisite[] = [
    { label: 'Generics',   route: '/csharp/generics' },
    { label: 'Delegates',  route: '/csharp/delegates' },
    { label: 'LINQ',       route: '/csharp/linq' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'Expression<Func<T,bool>>', type: 'type',      desc: 'A lambda stored as a data tree instead of compiled code — inspectable and translatable', since: 'C# 3' },
    { name: 'Func<T,bool>',             type: 'type',      desc: 'The compiled-delegate counterpart — runnable, but opaque to providers', since: 'C# 2' },
    { name: 'expr.Compile()',           type: 'method',    desc: 'Turns a tree back into a runnable delegate (JIT work — compile once and cache)', since: 'C# 3' },
    { name: 'Expression.Parameter()',   type: 'method',    desc: 'Creates the parameter node (the "x" in x => …) for manually built trees', since: 'C# 3' },
    { name: 'Expression.Property()',    type: 'method',    desc: 'Member-access node: Expression.Property(param, "Name") → x.Name', since: 'C# 3' },
    { name: 'Expression.Constant()',    type: 'method',    desc: 'A boxed literal node: Expression.Constant(42, typeof(int))', since: 'C# 3' },
    { name: 'Expression.Lambda<T>()',   type: 'method',    desc: 'Wraps body + parameters into a typed lambda tree ready for Compile() or a provider', since: 'C# 3' },
    { name: 'Expression.AndAlso()',     type: 'method',    desc: 'Short-circuit && node (use OrElse for ||, Equal for ==, GreaterThan for >…)', since: 'C# 3' },
    { name: 'ExpressionVisitor',        type: 'class',     desc: 'Base class for walking/rewriting trees (parameter substitution, node translation)', since: '.NET 4' },
    { name: 'IQueryable<T>',            type: 'interface', desc: 'LINQ interface that holds an expression tree — providers translate it to SQL, BSON, etc.', since: 'C# 3' },
    { name: 'expr.Body / .Parameters', type: 'method',    desc: 'Inspect the tree: body node, parameter list, NodeType on any node', since: 'C# 3' },
    { name: 'Expression.Quote()',       type: 'method',    desc: 'Wraps a lambda tree in a UnaryExpression for use as an argument in method-call nodes', since: 'C# 3' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Code as data — Expression<Func<T>> vs Func<T>',
      points: [
        'The same lambda text compiles to two completely different things depending on the declared type. <code>Func&lt;int,bool&gt; f = x =&gt; x &gt; 5;</code> produces IL — runnable and opaque. <code>Expression&lt;Func&lt;int,bool&gt;&gt; e = x =&gt; x &gt; 5;</code> produces an object graph: a <code>BinaryExpression(GreaterThan)</code> over a <code>ParameterExpression</code> and a <code>ConstantExpression</code>.',
        'Because a tree is data, a library can <em>read your intent</em> — which property you compared, with what operator, against what value. That inspection is impossible with a compiled delegate; the delegate is already machine code.',
        'Only expression lambdas convert to trees — statement bodies (<code>x =&gt; { … }</code>), assignments inside lambdas, and <code>async</code> lambdas never compile to <code>Expression&lt;T&gt;</code>. The compiler rejects them with a clear error.',
        'A tree node\'s <code>NodeType</code> (an <code>ExpressionType</code> enum) identifies its role: <code>Lambda</code>, <code>Parameter</code>, <code>MemberAccess</code>, <code>Constant</code>, <code>GreaterThan</code>, <code>AndAlso</code>, etc. Any tree can be fully described by walking these nodes recursively.',
        'Calling <code>.Compile()</code> on a tree invokes the runtime lambda compiler, producing a delegate that runs at full JIT speed — but the compilation itself has real cost (similar to emitting a dynamic method). Always cache compiled delegates.',
      ],
    },
    {
      heading: 'Why IQueryable needs trees — the EF Core story',
      points: [
        '<code>IEnumerable.Where(Func)</code> pulls every row into memory and runs your delegate in C#. <code>IQueryable.Where(Expression)</code> hands the <em>tree</em> to the provider, which translates it: <code>u =&gt; u.Age &gt;= 18</code> becomes <code>WHERE age &gt;= 18</code> in SQL — the database does the filtering.',
        'This translation is the primary reason LINQ providers (EF Core, MongoDB, OData, ElasticSearch) exist. The tree is a language-neutral representation of your filter logic that any provider can read.',
        '<strong>The classic bug:</strong> calling <code>.AsEnumerable()</code> or <code>.ToList()</code> mid-query drops back to <code>IEnumerable</code>. Everything after that point runs client-side — you load the entire table, then filter in C#. This is a silent performance disaster that does not appear as an error.',
        'EF throws "could not be translated" when your lambda contains a node the SQL provider cannot map — a custom C# method, a conditional the query engine doesn\'t understand. Fix by rewriting in translatable terms or moving that step after explicit materialisation.',
        'The same mechanism powers any LINQ-to-X: MongoDB drivers, OData middleware, custom in-memory rule engines — all of them are expression-tree visitors that emit their own query language from the same C# lambda you write.',
      ],
    },
    {
      heading: 'Building trees by hand — dynamic queries done safely',
      points: [
        'The factory API mirrors the syntax tree: <code>Expression.Parameter</code> (the x), <code>Expression.Property</code> (x.Name), <code>Expression.Constant</code>, binary operators (<code>Expression.Equal</code>, <code>Expression.GreaterThan</code>, <code>Expression.AndAlso</code>…), then wrap in <code>Expression.Lambda&lt;Func&lt;T,bool&gt;&gt;(body, param)</code>.',
        'This is the answer to "the user picks the filter column and operator at runtime" — you compose a tree from their choices and hand it to EF. Strongly typed all the way; no SQL string concatenation, no injection risk.',
        '<code>Convert.ChangeType(value, prop.Type)</code> is essential when accepting values as <code>object</code> — the constant node must carry the exact <code>Type</code> that matches the property, or EF will throw a type-mismatch translation error.',
        '<code>Expression.Quote(lambda)</code> is needed when passing a lambda tree as an argument to a method-call node (e.g., building an <code>OrderBy</code> call). It wraps the lambda in a <code>UnaryExpression</code> so the tree is treated as data rather than being evaluated.',
        'For method calls on a type, use <code>Expression.Call(typeof(Queryable), "OrderBy", typeArgs, source.Expression, quotedLambda)</code>. The method name is a string, which is one of the few places where runtime reflection knowledge is still needed.',
      ],
    },
    {
      heading: 'Inspecting and rewriting — ExpressionVisitor',
      points: [
        '<code>ExpressionVisitor</code> walks a tree with a <code>Visit</code> method per node kind. Override the ones you care about and return modified nodes to <em>rewrite</em> the tree. Trees are immutable, so returning a different node from <code>VisitMember</code> produces a new tree; the original is unchanged.',
        '<strong>Parameter substitution</strong> is the most important use: when composing two predicates, each has its own independent <code>ParameterExpression</code> instance for "x". Before combining their bodies with <code>AndAlso</code>, rewrite one body\'s parameter to match the other using a simple visitor.',
        'Other practical visitors: translate property names between DTOs and entities, strip a <code>Convert</code> node a provider cannot handle, log what columns and operators a query actually requests, or add a global "IsDeleted = false" soft-delete filter to every query.',
        'Strongly-typed selectors rely on tree inspection: <code>RuleFor(x =&gt; x.Email)</code> in FluentValidation extracts the <code>MemberExpression</code> to read the property name — refactor-safe where a magic string would silently become stale.',
        'The visitor pattern here is the same Gang-of-Four pattern applied to an immutable object graph. It separates the tree structure from the operations you perform on it, making it easy to add new tree-walking behaviours without modifying the node classes.',
      ],
    },
    {
      heading: 'The Expression factory API — key node types',
      points: [
        '<strong>Leaf nodes:</strong> <code>Expression.Parameter(type, "x")</code> — represents a variable; <code>Expression.Constant(value, type)</code> — a literal. These form the ends of every tree.',
        '<strong>Unary nodes:</strong> <code>Expression.Not</code>, <code>Expression.Negate</code>, <code>Expression.Convert(node, targetType)</code> — boxing and type coercion. The <code>Convert</code> node is what the compiler inserts when you compare an <code>int</code> property to a <code>long</code> constant.',
        '<strong>Binary nodes:</strong> <code>Expression.Equal</code>, <code>Expression.GreaterThan</code>, <code>Expression.Add</code>, <code>Expression.AndAlso</code>, <code>Expression.OrElse</code> — the workhorses of filter construction.',
        '<strong>Member nodes:</strong> <code>Expression.Property(expr, "Name")</code> or <code>Expression.Field</code> — reads a property or field off an expression. <code>Expression.MakeMemberAccess(expr, MemberInfo)</code> accepts a <code>MemberInfo</code> directly for type-safe access.',
        '<strong>Method-call nodes:</strong> <code>Expression.Call(instanceExpr, method, args)</code> — used to call instance methods; <code>Expression.Call(null, staticMethod, args)</code> for static. The <code>Expression.Block</code>, <code>Expression.Loop</code>, and <code>Expression.TryCatch</code> nodes support interpreter-building scenarios (DLR, scripting engines) beyond simple filter trees.',
      ],
    },
    {
      heading: 'Limitations and modern alternatives',
      points: [
        'Expression trees only cover <em>expression</em> syntax — no loops, no try/catch, no assignment, no <code>await</code>. The compiler\'s conversion from lambda text exists only for expression bodies. The factory API can build blocks and loops, but only the DLR (dynamic language runtime) and scripting engines typically go there.',
        'AOT publishing (NativeAOT, Blazor WASM AOT) trims the runtime lambda compiler. <code>expr.Compile()</code> may not be available or may produce incorrect code. Prefer source generators or pre-compiled delegates when targeting AOT.',
        'Source generators are the modern alternative for code-at-build-time: they generate C# source that the compiler compiles normally, avoiding runtime IL emit and AOT incompatibility. EF\'s compiled queries and the JSON source generator use this approach.',
        'For simple ORM scenarios, EF Core\'s compiled queries (<code>EF.CompileQuery</code>) pre-translate the expression tree to SQL once at startup, eliminating the translation cost on every request — preferable to building the same tree repeatedly.',
        'Reflection-emit (<code>TypeBuilder</code>, <code>ILGenerator</code>) is the lower-level sibling — you emit raw IL instructions rather than expression nodes. It is required for dynamic proxy generation (DispatchProxy, Castle DynamicProxy) but more complex than expression trees for the filter-building use case.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tree vs delegate',
      language: 'csharp',
      code: `using System.Linq.Expressions;

// Same lambda text — two different worlds:
Func<int, bool>             compiled = x => x > 5;   // IL. Runnable.
Expression<Func<int, bool>> tree     = x => x > 5;   // Data. Inspectable.

Console.WriteLine(compiled(7));          // True — just runs

// The tree can be EXAMINED:
var body = (BinaryExpression)tree.Body;
Console.WriteLine(tree.Parameters[0].Name);  // "x"
Console.WriteLine(body.NodeType);            // GreaterThan
Console.WriteLine(body.Left);               // x
Console.WriteLine(body.Right);              // 5

// …and turned back into code:
Func<int, bool> runnable = tree.Compile(); // JIT cost — cache this!
Console.WriteLine(runnable(7));            // True

// Statement body cannot become a tree — compile error:
// Expression<Func<int, bool>> bad = x => { return x > 5; };

// Why it matters — the IQueryable difference:
// dbUsers.Where(u => u.Age >= 18)
//   IQueryable  → tree → provider emits: WHERE age >= 18 (DB filters)
// dbUsers.AsEnumerable().Where(u => u.Age >= 18)
//   IEnumerable → delegate → EVERY row fetched, filtered in C#`,
    },
    {
      label: 'Dynamic filter builder',
      language: 'csharp',
      code: `using System.Linq.Expressions;

// User picks column + operator + value at runtime (e.g. from a grid UI)
public static Expression<Func<T, bool>> BuildFilter<T>(
    string propertyName, string op, object value)
{
    var param = Expression.Parameter(typeof(T), "x");         // x
    var prop  = Expression.Property(param, propertyName);     // x.Price

    // Convert the value to the property's exact type
    var converted = Convert.ChangeType(value, prop.Type);
    var constant  = Expression.Constant(converted, prop.Type); // 100m

    Expression body = op switch                               // x.Price > 100
    {
        "eq"  => Expression.Equal(prop, constant),
        "gt"  => Expression.GreaterThan(prop, constant),
        "lt"  => Expression.LessThan(prop, constant),
        "gte" => Expression.GreaterThanOrEqual(prop, constant),
        "lte" => Expression.LessThanOrEqual(prop, constant),
        _     => throw new NotSupportedException(op),
    };

    return Expression.Lambda<Func<T, bool>>(body, param);
}

// Usage — fully translatable by EF Core, zero SQL strings:
var filter = BuildFilter<Product>("Price", "gt", 100m);
var expensive = db.Products.Where(filter).ToList();
// SQL: SELECT … FROM Products WHERE Price > 100

// In-memory? Compile once, reuse:
var predicate = filter.Compile();           // cache this!
products.Where(predicate);`,
    },
    {
      label: 'Composing predicates',
      language: 'csharp',
      code: `using System.Linq.Expressions;

// Two trees have two DIFFERENT "x" parameter nodes — to AND them,
// rewrite one tree to use the other's parameter. ExpressionVisitor:
sealed class ReplaceParameter(
    ParameterExpression from, ParameterExpression to) : ExpressionVisitor
{
    protected override Expression VisitParameter(ParameterExpression node)
        => node == from ? to : base.VisitParameter(node);
}

public static class PredicateBuilder
{
    public static Expression<Func<T, bool>> AndAlso<T>(
        this Expression<Func<T, bool>> left,
        Expression<Func<T, bool>> right)
    {
        var param = left.Parameters[0];

        // Rewrite right's "x" to be left's "x":
        var rightBody = new ReplaceParameter(right.Parameters[0], param)
            .Visit(right.Body);

        return Expression.Lambda<Func<T, bool>>(
            Expression.AndAlso(left.Body, rightBody), param);
    }

    public static Expression<Func<T, bool>> OrElse<T>(
        this Expression<Func<T, bool>> left,
        Expression<Func<T, bool>> right)
    {
        var param = left.Parameters[0];
        var rightBody = new ReplaceParameter(right.Parameters[0], param)
            .Visit(right.Body);
        return Expression.Lambda<Func<T, bool>>(
            Expression.OrElse(left.Body, rightBody), param);
    }
}

// Build a search from optional filters:
Expression<Func<Order, bool>> query = o => !o.Cancelled;

if (minTotal is decimal min)
    query = query.AndAlso(o => o.Total >= min);
if (since is DateTime dt)
    query = query.AndAlso(o => o.Placed >= dt);

var results = db.Orders.Where(query).ToList();  // one combined WHERE`,
    },
    {
      label: 'Property selectors',
      language: 'csharp',
      code: `using System.Linq.Expressions;
using System.Reflection;

// The pattern behind FluentValidation's RuleFor(x => x.Email):
// read the MemberExpression for a refactor-safe property name.
public static string PropertyName<T, TProp>(
    Expression<Func<T, TProp>> selector)
{
    // Handles value-type properties (x => x.Age) wrapped in Convert:
    var member = selector.Body switch
    {
        MemberExpression m => m,
        UnaryExpression { Operand: MemberExpression m } => m,
        _ => throw new ArgumentException("Expected x => x.Property"),
    };
    return member.Member.Name;
}

Console.WriteLine(PropertyName<User, string>(x => x.Email));  // "Email"
Console.WriteLine(PropertyName<User, int>(x => x.Age));       // "Age"
// Rename User.Email in the IDE → the lambda updates automatically

// Typed OrderBy from a runtime column name:
public static IQueryable<T> OrderByProperty<T>(
    this IQueryable<T> source, string propertyName, bool descending = false)
{
    var param  = Expression.Parameter(typeof(T), "x");
    var prop   = Expression.Property(param, propertyName);
    var lambda = Expression.Lambda(prop, param);
    var method = descending ? "OrderByDescending" : "OrderBy";

    var call = Expression.Call(
        typeof(Queryable), method,
        [typeof(T), prop.Type],
        source.Expression,
        Expression.Quote(lambda));     // Quote wraps the tree as data

    return source.Provider.CreateQuery<T>(call);
}

// Fully EF-translatable:
var sorted = db.Products.OrderByProperty("Price", descending: true);
// SQL: ORDER BY Price DESC`,
    },
    {
      label: 'ExpressionVisitor rewrite',
      language: 'csharp',
      code: `using System.Linq.Expressions;

// ── Real-world visitor: rename a member to its column name ────────────
// Useful when your query DTO and entity have different property names.
sealed class RenameProperty(
    string fromName, string toName, Type onType) : ExpressionVisitor
{
    protected override Expression VisitMember(MemberExpression node)
    {
        if (node.Member.DeclaringType == onType
            && node.Member.Name == fromName)
        {
            // Build a new MemberAccess using the renamed property
            var newMember = onType.GetProperty(toName)!;
            return Expression.MakeMemberAccess(
                Visit(node.Expression)!, newMember);
        }
        return base.VisitMember(node);
    }
}

// ── Inspect a tree without changing it ───────────────────────────────
sealed class CollectMembers : ExpressionVisitor
{
    public List<string> Names { get; } = [];
    protected override Expression VisitMember(MemberExpression node)
    {
        Names.Add(node.Member.Name);
        return base.VisitMember(node);   // keep walking, don't replace
    }
}

Expression<Func<Order, bool>> pred = o => o.Total > 100 && o.Placed > DateTime.Now;

var collector = new CollectMembers();
collector.Visit(pred);
Console.WriteLine(string.Join(", ", collector.Names));  // Total, Placed

// ── Global soft-delete filter (add to every query) ─────────────────
// EF Core has query filters, but the visitor pattern shows how:
sealed class SoftDeleteFilter<T>(ParameterExpression p) : ExpressionVisitor
{
    protected override Expression VisitLambda<TLambda>(Expression<TLambda> node)
    {
        // Prepend "IsDeleted == false" to any predicate
        if (typeof(T).GetProperty("IsDeleted") is null) return node;
        var isDeleted = Expression.Property(node.Parameters[0], "IsDeleted");
        var notDeleted = Expression.Not(isDeleted);
        var combined = Expression.AndAlso(notDeleted, node.Body);
        return Expression.Lambda<TLambda>(combined, node.Parameters);
    }
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling .Compile() on every invocation instead of caching',
      wrong: `// Called per request — compiles the tree every time
public bool Matches(Product p)
{
    Expression<Func<Product, bool>> expr = x => x.Price > 50;
    return expr.Compile()(p);   // JIT cost per call!
}`,
      right: `// Compile once, reuse the delegate:
private static readonly Func<Product, bool> _isExpensive =
    ((Expression<Func<Product, bool>>)(x => x.Price > 50)).Compile();

public bool Matches(Product p) => _isExpensive(p);`,
      explanation: '.Compile() invokes the runtime lambda compiler — it emits IL, allocates, and JIT-compiles the result. The produced delegate runs at normal speed, but creating it per call is as expensive as emitting a dynamic method on every request. Always compile once and cache.',
    },
    {
      title: 'Calling AsEnumerable() / ToList() too early and killing server-side filtering',
      wrong: `// Loads EVERY order into memory, then filters in C#
var recentLarge = db.Orders
    .ToList()                         // ← entire table in RAM
    .Where(o => o.Total > 1000 && o.Placed > cutoff)
    .ToList();`,
      right: `// EF translates the whole query — database does the work
var recentLarge = db.Orders
    .Where(o => o.Total > 1000 && o.Placed > cutoff)  // still IQueryable
    .ToList();                         // materialise only the results`,
      explanation: 'AsEnumerable() and ToList() switch from IQueryable (tree-based) to IEnumerable (delegate-based). Any LINQ operator after that point runs client-side against all rows already loaded. Keep the query IQueryable until you have applied all filters and projections.',
    },
    {
      title: 'ANDing two predicate lambdas without parameter substitution',
      wrong: `Expression<Func<Order, bool>> p1 = o => o.Total > 100;
Expression<Func<Order, bool>> p2 = o => o.Placed > DateTime.Now;

// "o" in p1 and "o" in p2 are DIFFERENT ParameterExpression objects
var combined = Expression.Lambda<Func<Order, bool>>(
    Expression.AndAlso(p1.Body, p2.Body),
    p1.Parameters[0]);   // p2.Body still references p2's "o" — unbound!

db.Orders.Where(combined);  // provider throws or produces wrong SQL`,
      right: `// Use a visitor to substitute p2's parameter with p1's:
var param = p1.Parameters[0];
var p2Body = new ReplaceParameter(p2.Parameters[0], param).Visit(p2.Body);
var combined = Expression.Lambda<Func<Order, bool>>(
    Expression.AndAlso(p1.Body, p2Body!), param);

db.Orders.Where(combined);  // correct, single "o" parameter`,
      explanation: 'Parameter nodes are matched by reference, not by name. Two lambda parameters both named "o" are still different objects. Combining their bodies into one lambda leaves p2\'s body referencing an unbound parameter node. An ExpressionVisitor that replaces one parameter with the other fixes it.',
    },
    {
      title: 'Using a statement lambda or async lambda where an expression tree is expected',
      wrong: `// Statement body — compile error!
Expression<Func<int, bool>> bad1 = x => { return x > 5; };

// Method body — compile error!
Expression<Func<User, bool>> bad2 = async u => await IsActiveAsync(u);

// Custom method in the body — compiles, but EF cannot translate it:
Expression<Func<User, bool>> bad3 = u => MyCustomCheck(u.Name);
// EF throws "could not be translated" at runtime`,
      right: `// Expression body only:
Expression<Func<int, bool>> ok1 = x => x > 5;

// Custom logic: run it after materialisation
var users = db.Users
    .Where(u => u.IsActive)   // translatable — goes to DB
    .AsEnumerable()           // deliberately switch to in-memory
    .Where(u => MyCustomCheck(u.Name));  // C# runs here`,
      explanation: 'The compiler can only convert expression-body lambdas to trees. Statement bodies, async lambdas, and calls to arbitrary C# methods have no tree representation the compiler emits — the first two are errors; the last compiles but fails at the provider. Translatable LINQ operations must use only expressions the provider understands.',
    },
    {
      title: 'Using expression trees for simple filters that a plain lambda handles fine',
      wrong: `// 10 lines of factory API for what one line does:
var param = Expression.Parameter(typeof(User), "u");
var prop  = Expression.Property(param, "IsActive");
var body  = Expression.Equal(prop, Expression.Constant(true));
var filter = Expression.Lambda<Func<User, bool>>(body, param);
db.Users.Where(filter);`,
      right: `// The compiler generates the same tree from this:
db.Users.Where(u => u.IsActive);`,
      explanation: 'When the predicate shape is known at compile time, write it as a lambda — the compiler generates the identical expression tree. Use the factory API only when the shape itself is not known until runtime (dynamic column/operator/value from user input). Unnecessary factory code is verbose and error-prone.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between Func<T,bool> and Expression<Func<T,bool>>?',
      options: [
        'Expression<> is faster to invoke',
        'Func is compiled IL you can run; Expression is a data tree you can inspect and translate',
        'Expression<> supports async lambdas, Func does not',
        'They are aliases for the same type',
      ],
      answer: 1,
      explanation: 'The declared type tells the compiler what to emit from the same lambda text: a delegate (runnable, opaque) or an expression tree (an object graph describing the code — inspectable, translatable, compilable later via .Compile()).',
    },
    {
      q: 'Why does IQueryable.Where take Expression<Func<T,bool>> instead of Func<T,bool>?',
      options: [
        'Expression trees allocate less memory',
        'So the query provider can read the tree and translate it (e.g. into SQL) instead of fetching all rows',
        'Because IQueryable predates delegates',
        'To prevent multiple enumeration',
      ],
      answer: 1,
      explanation: 'A delegate could only be executed against in-memory objects, forcing every row to be loaded. A tree carries intent the provider can rewrite into its native query language — the entire point of LINQ providers like EF Core.',
    },
    {
      q: 'What should you watch out for with expr.Compile()?',
      options: [
        'It mutates the original tree',
        'It only works on parameterless lambdas',
        'It performs costly runtime code generation — compile once and cache, never per call',
        'The resulting delegate runs 10× slower than a normal lambda',
      ],
      answer: 2,
      explanation: 'Compile() invokes the runtime lambda compiler (JIT work and allocations). The produced delegate runs at normal speed, but creating it per call is expensive. A per-call Compile() inside a hot path is a classic performance bug.',
    },
    {
      q: 'Why can\'t you simply Expression.AndAlso two predicate lambdas\' bodies without a visitor?',
      options: [
        'AndAlso only accepts constants',
        'Each lambda has its own ParameterExpression instance — one body must be rewritten to share the other\'s parameter',
        'Trees are mutable so the originals would change',
        'You can — Expression.AndAlso handles parameters automatically',
      ],
      answer: 1,
      explanation: 'Parameter nodes are matched by reference, not by name. Two "x" parameters from two lambdas are different objects; a provider walking the combined tree finds an unbound parameter node. An ExpressionVisitor that substitutes one for the other fixes it.',
    },
    {
      q: 'What does ExpressionVisitor do and why are trees immutable?',
      options: [
        'It modifies tree nodes in-place for efficiency',
        'It walks the tree and produces NEW nodes when overriding Visit methods — trees are immutable so rewrites return new trees rather than mutating existing ones',
        'It compiles the tree to a delegate incrementally',
        'It is an interface that expression nodes implement',
      ],
      answer: 1,
      explanation: 'Expression tree nodes are read-only. ExpressionVisitor uses the visitor pattern: overriding a Visit method and returning a different node causes the parent reconstruction to use the new node, producing a rewritten copy. The original tree is always intact.',
    },
    {
      q: 'What does calling .AsEnumerable() mid-query do to LINQ-to-EF performance?',
      options: [
        'Nothing — EF still translates everything to SQL',
        'It materialises results up to that point, then all subsequent operators run in C# on loaded rows',
        'It prevents multiple enumeration',
        'It switches to a faster in-memory index',
      ],
      answer: 1,
      explanation: 'AsEnumerable() downcasts the IQueryable to IEnumerable. The query up to that point runs as SQL; everything after it runs as C# delegate logic against the materialised rows. Calling it before filtering loads the entire table into memory.',
    },
    {
      q: 'Which node type represents reading a property (e.g. x.Name) in an expression tree?',
      options: [
        'ConstantExpression',
        'ParameterExpression',
        'MemberExpression',
        'UnaryExpression',
      ],
      answer: 2,
      explanation: 'A <code>MemberExpression</code> (NodeType = MemberAccess) holds the target expression and the <code>MemberInfo</code> (PropertyInfo or FieldInfo). This is what FluentValidation reads from <code>x => x.Email</code> to get the property name without reflection string lookups.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does EF Core turn my lambda into SQL?',
      a: 'Your <code>Where(u =&gt; u.Age &gt;= 18)</code> hands EF an expression tree. The provider walks it node by node — a <code>MemberExpression</code> for <code>u.Age</code> maps to a column, <code>GreaterThanOrEqual</code> to <code>&gt;=</code>, the constant to a parameter — and emits parameterised SQL. Nodes it cannot map (your own C# methods) raise the "could not be translated" exception.',
    },
    {
      q: 'When would I build expression trees manually instead of writing lambdas?',
      a: 'When the shape of the query is only known at runtime: user-configurable grid filters, search builders with optional criteria, sorting by a column name from the querystring, rule engines stored in a database. The factory API composes those choices into a typed tree EF can still translate — no string-built SQL, no injection risk.',
    },
    {
      q: 'What is an ExpressionVisitor and when do I need one?',
      a: 'A base class that walks a tree calling a typed Visit method per node. Since trees are immutable, returning a different node from an override produces a rewritten copy. You need one for: predicate composition (parameter substitution), translating member names between DTOs and entities, stripping nodes a provider cannot translate, or collecting diagnostics about what a query accesses.',
    },
    {
      q: 'Why do statement lambdas not convert to expression trees?',
      a: 'The C# lambda-to-tree conversion is defined only for expression bodies — a single expression maps cleanly to a node graph. Statement bodies (blocks, loops, try/catch, assignments) and async lambdas have no such conversion. The compiler rejects them with a clear error. The factory API does expose <code>Expression.Block</code> and <code>Expression.TryCatch</code>, but you must build them manually — the compiler does not emit them from lambda syntax.',
    },
    {
      q: 'Are expression trees related to source generators or reflection?',
      a: 'They solve neighbouring problems. Reflection inspects <em>types</em> at runtime; expression trees describe <em>code</em> at runtime; source generators do code generation at <em>compile time</em>. A typed selector like <code>x =&gt; x.Email</code> is usually better than a reflection string because rename refactorings update it. A source generator beats both when the work can be pre-computed before the program runs — and it is AOT-safe, which .Compile() is not.',
    },
    {
      q: 'What is the PredicateBuilder pattern?',
      a: 'A tiny utility (popularised by LINQKit, now easy to write yourself) providing <code>And</code>/<code>Or</code> extension methods on <code>Expression&lt;Func&lt;T,bool&gt;&gt;</code>. They handle the parameter-substitution visitor internally so you can compose optional search filters cleanly: start with <code>x =&gt; true</code> and chain conditions. The same technique is shown in this page\'s "Composing predicates" code tab.',
    },
    {
      q: 'What are the AOT / trimming limitations of expression trees?',
      a: '<code>expr.Compile()</code> emits IL at runtime using the reflection-emit APIs. NativeAOT and trimming remove those APIs, so Compile() either fails or produces wrong results in AOT-published apps. Mitigations: use source generators instead of runtime tree compilation; use EF\'s compiled queries (<code>EF.CompileQuery</code>) which pre-bake the SQL; or avoid Compile() entirely and let the provider translate the tree (which only involves node traversal, not IL emit).',
    },
  ];

  challenge: Challenge = {
    title: 'Build a Typed "Between" Filter',
    language: 'csharp',
    description: 'Implement Between<T>(string propertyName, decimal min, decimal max) that returns Expression<Func<T, bool>> equivalent to x => x.Prop >= min && x.Prop <= max, built entirely with the Expression factory API. It must produce a single lambda with one parameter, use AndAlso (short-circuit), and convert min/max constants to the property\'s actual type so it works for decimal, int or double properties.',
    hints: [
      'One Expression.Parameter(typeof(T), "x") shared by both comparisons',
      'Expression.Property(param, propertyName) gives the member access; its .Type tells you what to convert constants to',
      'Convert.ChangeType(min, prop.Type) then Expression.Constant(value, prop.Type)',
      'Expression.AndAlso(GreaterThanOrEqual, LessThanOrEqual) then Expression.Lambda<Func<T,bool>>(body, param)',
    ],
    starterCode: `using System.Linq.Expressions;

public static class Filters
{
    public static Expression<Func<T, bool>> Between<T>(
        string propertyName, decimal min, decimal max)
    {
        // TODO: x => x.Prop >= min && x.Prop <= max
        throw new NotImplementedException();
    }
}

// var f = Filters.Between<Product>("Price", 10m, 50m);
// db.Products.Where(f)  → WHERE Price >= 10 AND Price <= 50`,
    solution: `using System.Linq.Expressions;

public static class Filters
{
    public static Expression<Func<T, bool>> Between<T>(
        string propertyName, decimal min, decimal max)
    {
        // x
        var param = Expression.Parameter(typeof(T), "x");

        // x.Price  (works for any numeric property)
        var prop = Expression.Property(param, propertyName);

        // Constants converted to the property's real type
        var minConst = Expression.Constant(
            Convert.ChangeType(min, prop.Type), prop.Type);
        var maxConst = Expression.Constant(
            Convert.ChangeType(max, prop.Type), prop.Type);

        // x.Price >= min  &&  x.Price <= max
        var lower = Expression.GreaterThanOrEqual(prop, minConst);
        var upper = Expression.LessThanOrEqual(prop, maxConst);
        var body  = Expression.AndAlso(lower, upper);

        // x => x.Price >= min && x.Price <= max
        return Expression.Lambda<Func<T, bool>>(body, param);
    }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Expression<Func<T>> is a lambda stored as an inspectable data tree instead of compiled IL; IQueryable uses this so providers like EF Core can translate your C# predicates to SQL; the factory API builds trees at runtime for dynamic queries; ExpressionVisitor rewrites trees for predicate composition and member translation.',
    mustKnow: [
      '<code>Expression&lt;Func&lt;T,bool&gt;&gt;</code> stores the lambda as an inspectable tree; <code>Func&lt;T,bool&gt;</code> stores it as compiled IL — the declaration type is the only difference',
      '<code>IQueryable.Where</code> passes the tree to the provider for translation (SQL, BSON, OData); <code>AsEnumerable()</code> kills that — all subsequent operators run client-side',
      '<code>expr.Compile()</code> has real JIT cost — compile once, cache the delegate; never call per-request',
      'Build trees manually with the factory API only when the filter shape is unknown at compile time (user-driven column/operator/value)',
      'Two lambda parameters named "x" are different objects — combine predicate bodies only after substituting one parameter with the other via <code>ExpressionVisitor</code>',
      '<code>MemberExpression</code> (NodeType = MemberAccess) represents <code>x.Name</code> — the basis of refactor-safe property selectors like <code>RuleFor(x =&gt; x.Email)</code>',
      '<code>expr.Compile()</code> is AOT-incompatible — use source generators or pre-compiled EF queries when targeting NativeAOT',
    ],
    interviewFocus: [
      'What is the difference between Func<T,bool> and Expression<Func<T,bool>>, and why does EF use the latter?',
      'What happens if you call AsEnumerable() before Where() on a DbSet?',
      'Why is calling .Compile() in a hot loop a performance bug?',
      'How do you combine two predicate expression trees into one AND clause?',
      'What is ExpressionVisitor used for? Give a real example.',
    ],
  };
}
