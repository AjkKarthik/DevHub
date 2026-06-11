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
  selector: 'app-csharp-expression-trees',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent,
  ],
  templateUrl: './expression-trees.html',
  styleUrl: './expression-trees.scss',
})
export class CsharpExpressionTrees {

  quickRef: QuickRefItem[] = [
    { name: 'Expression<Func<T,bool>>', type: 'type',     desc: 'A lambda stored as a data tree instead of compiled code', since: 'C# 3' },
    { name: 'Func<T,bool>',             type: 'type',     desc: 'The compiled-delegate counterpart — runnable, not inspectable', since: 'C# 3' },
    { name: 'expr.Compile()',           type: 'method',   desc: 'Turns a tree back into a runnable delegate (JIT work — cache it!)', since: 'C# 3' },
    { name: 'Expression.Parameter()',   type: 'method',   desc: 'Creates the parameter node (the "x" in x => …) for manual trees', since: 'C# 3' },
    { name: 'Expression.Property()',    type: 'method',   desc: 'Node that reads a property: Expression.Property(param, "Name")', since: 'C# 3' },
    { name: 'Expression.Lambda<T>()',   type: 'method',   desc: 'Wraps a body + parameters into a typed lambda tree', since: 'C# 3' },
    { name: 'ExpressionVisitor',        type: 'class',    desc: 'Base class for walking/rewriting trees (rename params, swap nodes)', since: '.NET 4' },
    { name: 'IQueryable<T>',            type: 'interface', desc: 'LINQ over expression trees — providers translate them (e.g. to SQL)', since: 'C# 3' },
    { name: 'expr.Body / .Parameters',  type: 'method',   desc: 'Inspect the tree: body node, parameter list, NodeType', since: 'C# 3' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Code as data — Expression<Func<T>> vs Func<T>',
      points: [
        'The same lambda text compiles to two completely different things depending on the declared type. <code>Func&lt;int,bool&gt; f = x =&gt; x &gt; 5;</code> produces IL — runnable, opaque. <code>Expression&lt;Func&lt;int,bool&gt;&gt; e = x =&gt; x &gt; 5;</code> produces an object graph describing the code: a BinaryExpression(GreaterThan) over a ParameterExpression and a ConstantExpression.',
        'Because a tree is data, a library can <em>read your intent</em>: which property you compared, with what operator, against what value. That is impossible with a compiled delegate.',
        'Only expression lambdas convert to trees — statement bodies (<code>x =&gt; { … }</code>), and assignments inside lambdas do not compile to <code>Expression&lt;T&gt;</code>. async lambdas never do.',
      ],
    },
    {
      heading: 'Why IQueryable needs trees — the EF Core story',
      points: [
        '<code>IEnumerable.Where(Func)</code> pulls every row into memory and runs your delegate. <code>IQueryable.Where(Expression)</code> hands the <em>tree</em> to the provider, which translates it: <code>u =&gt; u.Age &gt;= 18</code> becomes <code>WHERE age &gt;= 18</code> in SQL.',
        'This is why dropping to <code>.AsEnumerable()</code> too early is a performance bug: everything after it runs client-side on materialised rows.',
        'It is also why EF throws "could not be translated": your lambda contains a node the provider has no SQL for (a custom C# method, say). Fix by rewriting in translatable terms or moving that step after materialisation deliberately.',
        'Same mechanism powers LINQ-to-anything: MongoDB drivers, OData, GraphQL layers — all of them are expression-tree translators.',
      ],
    },
    {
      heading: 'Building trees by hand — dynamic queries done safely',
      points: [
        'The factory API mirrors the syntax tree: <code>Expression.Parameter</code> (the x), <code>Expression.Property</code> (x.Name), <code>Expression.Constant</code>, <code>Expression.Equal/GreaterThan/AndAlso</code>, then <code>Expression.Lambda&lt;Func&lt;T,bool&gt;&gt;(body, param)</code>.',
        'This is THE answer to "the user picks the filter column and operator at runtime" — you compose a tree from their choices and hand it to EF. Strongly typed all the way; no SQL string concatenation, no injection.',
        '<code>.Compile()</code> converts a tree to a delegate when you need to run it in memory. It costs real JIT work — compile once and cache, never per call.',
        'Combining two predicate trees requires unifying their parameters — you cannot just AND two lambdas with different x nodes. An <code>ExpressionVisitor</code> that substitutes parameters is the standard trick (or the well-known PredicateBuilder pattern).',
      ],
    },
    {
      heading: 'Inspecting and rewriting — ExpressionVisitor',
      points: [
        '<code>ExpressionVisitor</code> walks a tree with one Visit method per node kind; override the ones you care about and return modified nodes to <em>rewrite</em> — trees are immutable, so visitors build new ones.',
        'Practical visitors: substitute a parameter (predicate composition), translate property names (DTO → entity), strip a node a provider cannot handle, or log what a query actually asks for.',
        'Trees also make great strongly-typed selectors in APIs: <code>RuleFor(x =&gt; x.Email)</code> in FluentValidation reads the MemberExpression to learn the property name — refactor-safe where a string would silently break.',
        'Limits to remember: trees describe <em>expressions</em>, not statements — no loops, no try/catch, no await in the lambda-conversion syntax (the factory API can build Block/Loop nodes, but that is interpreter-building territory).',
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

Console.WriteLine(compiled(7));        // True — just runs

// The tree can be EXAMINED:
var body = (BinaryExpression)tree.Body;
Console.WriteLine(tree.Parameters[0].Name);  // "x"
Console.WriteLine(body.NodeType);            // GreaterThan
Console.WriteLine(body.Left);                // x
Console.WriteLine(body.Right);               // 5

// …and turned back into code:
Func<int, bool> runnable = tree.Compile();   // JIT cost — cache this!
Console.WriteLine(runnable(7));              // True

// Why it matters — the IQueryable difference:
// dbUsers.Where(u => u.Age >= 18)
//   IQueryable  → tree → provider emits: WHERE age >= 18   (DB filters)
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
    var param = Expression.Parameter(typeof(T), "x");        // x
    var prop  = Expression.Property(param, propertyName);    // x.Price
    var constant = Expression.Constant(
        Convert.ChangeType(value, prop.Type), prop.Type);    // 100m

    Expression body = op switch                              // x.Price > 100
    {
        "eq"  => Expression.Equal(prop, constant),
        "gt"  => Expression.GreaterThan(prop, constant),
        "lt"  => Expression.LessThan(prop, constant),
        "gte" => Expression.GreaterThanOrEqual(prop, constant),
        _     => throw new NotSupportedException(op),
    };

    return Expression.Lambda<Func<T, bool>>(body, param);
}

// Usage — fully translatable by EF Core, zero SQL strings:
var filter = BuildFilter<Product>("Price", "gt", 100m);
var expensive = db.Products.Where(filter).ToList();
// SQL: SELECT … FROM Products WHERE Price > 100

// In-memory? Compile once, reuse:
var predicate = filter.Compile();
products.Where(predicate);`,
    },
    {
      label: 'Composing predicates',
      language: 'csharp',
      code: `using System.Linq.Expressions;

// Two trees have two DIFFERENT "x" parameter nodes — to AND them,
// rewrite one tree to use the other's parameter. ExpressionVisitor:
class ReplaceParameter(ParameterExpression from, ParameterExpression to)
    : ExpressionVisitor
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
        var rightBody = new ReplaceParameter(right.Parameters[0], param)
            .Visit(right.Body);

        return Expression.Lambda<Func<T, bool>>(
            Expression.AndAlso(left.Body, rightBody), param);
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
// read the MemberExpression to get a refactor-safe property name.
public static string PropertyName<T, TProp>(
    Expression<Func<T, TProp>> selector)
{
    // Handles x => x.Email and (because of boxing) x => x.Age
    var member = selector.Body switch
    {
        MemberExpression m => m,
        UnaryExpression { Operand: MemberExpression m } => m,
        _ => throw new ArgumentException("Expected x => x.Property"),
    };
    return member.Member.Name;
}

PropertyName<User, string>(x => x.Email);   // "Email" — rename-safe!

// Same idea, used to build a typed OrderBy from user input:
public static IQueryable<T> OrderByProperty<T>(
    this IQueryable<T> source, string propertyName)
{
    var param = Expression.Parameter(typeof(T), "x");
    var prop  = Expression.Property(param, propertyName);
    var lambda = Expression.Lambda(prop, param);

    var call = Expression.Call(
        typeof(Queryable), "OrderBy",
        [typeof(T), prop.Type],
        source.Expression, Expression.Quote(lambda));

    return source.Provider.CreateQuery<T>(call);
}

db.Products.OrderByProperty("Price");   // translated to ORDER BY Price`,
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

        // Constants converted to the property's real type:
        // decimal property → decimal constants, int property → int…
        var minConst = Expression.Constant(
            Convert.ChangeType(min, prop.Type), prop.Type);
        var maxConst = Expression.Constant(
            Convert.ChangeType(max, prop.Type), prop.Type);

        // x.Price >= min   &&   x.Price <= max
        var lower = Expression.GreaterThanOrEqual(prop, minConst);
        var upper = Expression.LessThanOrEqual(prop, maxConst);
        var body  = Expression.AndAlso(lower, upper);

        // x => x.Price >= min && x.Price <= max
        return Expression.Lambda<Func<T, bool>>(body, param);
    }
}`,
  };

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
      explanation: 'Compile() invokes the runtime lambda compiler (JIT work and allocations). The produced delegate runs at normal speed, but creating it is expensive — a per-call Compile() inside a loop is a classic performance bug.',
    },
    {
      q: 'Why can\'t you simply Expression.AndAlso two predicate lambdas\' bodies together?',
      options: [
        'AndAlso only accepts constants',
        'Each lambda has its own ParameterExpression instance — one body must be rewritten to share the other\'s parameter',
        'Trees are mutable so the originals would change',
        'You can — Expression.AndAlso handles parameters automatically',
      ],
      answer: 1,
      explanation: 'Parameter nodes are matched by reference, not by name. Two x parameters from two lambdas are different nodes, and a provider walking the combined tree would find an unbound parameter. An ExpressionVisitor substituting one parameter for the other fixes it.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does EF Core turn my lambda into SQL?',
      a: 'Your <code>Where(u =&gt; u.Age &gt;= 18)</code> hands EF an expression tree. The provider walks it node by node — MemberExpression <code>u.Age</code> maps to a column, GreaterThanOrEqual to <code>&gt;=</code>, the constant to a parameter — and emits SQL. Nodes it cannot map (your own C# methods) raise the "could not be translated" exception.',
    },
    {
      q: 'When would I build expression trees manually instead of writing lambdas?',
      a: 'When the shape of the query is only known at runtime: user-configurable grid filters, search builders with optional criteria, sorting by a column name from the querystring, rule engines stored in a database. The factory API composes those choices into a typed tree EF can still translate — no string-built SQL, no injection.',
    },
    {
      q: 'What is an ExpressionVisitor and when do I need one?',
      a: 'A base class implementing a full tree walk with overridable Visit methods per node type. Since trees are immutable, returning different nodes from a Visit override produces a rewritten copy. You need one for predicate composition (parameter substitution), translating member names, or stripping/transforming nodes a provider chokes on.',
    },
    {
      q: 'Why do statement lambdas not convert to expression trees?',
      a: 'The C# lambda-to-tree conversion is defined only for expression bodies — a single expression maps cleanly to nodes. Statement bodies (blocks, loops, try/catch, assignments) and async lambdas have no such conversion. The factory API does expose Block/Loop/TryCatch nodes, but the compiler will not generate them from lambda syntax for you.',
    },
    {
      q: 'Are expression trees related to source generators or reflection?',
      a: 'They solve neighbouring problems. Reflection inspects <em>types</em> at runtime; trees describe <em>code</em> at runtime; source generators do codegen at <em>compile time</em>. A strongly-typed selector like <code>x =&gt; x.Email</code> is usually better than a reflection string because rename refactorings update it — and a generator beats both when the work can be done before the program runs.',
    },
    {
      q: 'What is the PredicateBuilder pattern?',
      a: 'A tiny utility (popularised by LINQKit) exposing <code>And</code>/<code>Or</code> extension methods on <code>Expression&lt;Func&lt;T,bool&gt;&gt;</code> that handle the parameter-substitution dance for you, so optional search filters compose cleanly: start with <code>x =&gt; true</code> and chain conditions. The visitor in this page\'s examples is the core of it.',
    },
  ];
}
