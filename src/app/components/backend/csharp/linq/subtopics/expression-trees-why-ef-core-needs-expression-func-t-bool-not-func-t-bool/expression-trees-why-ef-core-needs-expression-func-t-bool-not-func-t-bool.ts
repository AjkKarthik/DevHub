import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-expression-trees-why-ef-core-needs-expression-func-t-bool-not-func-t-bool-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './expression-trees-why-ef-core-needs-expression-func-t-bool-not-func-t-bool.html',
  styleUrl: './expression-trees-why-ef-core-needs-expression-func-t-bool-not-func-t-bool.scss',
})
export class ExpressionTreesWhyEfCoreNeedsExpressionFuncTBoolNotFuncTBoolSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A phrase the main topic uses without ever showing what it means',
      points: [
        'The main LINQ page says <code>IQueryable&lt;T&gt;</code> "builds an expression tree that is translated to SQL" — this is stated as a fact to accept, never actually SHOWN. This subtopic opens up what an expression tree literally IS, and why it is what makes the entire <code>IQueryable&lt;T&gt;</code>/EF Core translation mechanism possible in the first place.',
      ],
    },
    {
      heading: 'A delegate (Func<T,bool>) vs an expression tree (Expression<Func<T,bool>>) — genuinely different things',
      points: [
        '<code>Func&lt;Order, bool&gt; predicate = o =&gt; o.Amount &gt; 100;</code> compiles the lambda into ORDINARY COMPILED IL — a callable method. You can invoke it (<code>predicate(order)</code>) but you cannot INSPECT its logic at runtime; it is opaque machine-executable code, just like any other method.',
        '<code>Expression&lt;Func&lt;Order, bool&gt;&gt; expr = o =&gt; o.Amount &gt; 100;</code> compiles the SAME-LOOKING lambda into DATA instead — a tree of objects (<code>BinaryExpression</code>, <code>MemberExpression</code>, <code>ConstantExpression</code>) describing the STRUCTURE of the comparison: "access property Amount on parameter o, compare it with the constant 100 using greater-than." This tree can be inspected, walked, and — critically — TRANSLATED into a different language (SQL) by something that understands its shape.',
        'This is the entire mechanism behind EF Core: <code>IQueryable&lt;T&gt;</code>\'s LINQ methods are declared to accept <code>Expression&lt;Func&lt;T,bool&gt;&gt;</code> (not plain <code>Func&lt;T,bool&gt;</code>) SPECIFICALLY so the compiler builds the inspectable tree form instead of opaque IL — EF Core\'s query provider then walks that tree and generates the equivalent <code>WHERE</code> clause. <code>IEnumerable&lt;T&gt;</code>\'s methods, by contrast, accept plain <code>Func&lt;T,bool&gt;</code> because in-memory LINQ just needs to CALL the delegate directly — there is nothing to translate.',
      ],
    },
    {
      heading: 'Inspecting a tree yourself — proving it is real, walkable data',
      points: [
        'An <code>Expression&lt;Func&lt;Order, bool&gt;&gt;</code> exposes a <code>.Body</code> property (the root expression node) — for <code>o =&gt; o.Amount &gt; 100</code>, <code>.Body</code> is a <code>BinaryExpression</code> with a <code>NodeType</code> of <code>ExpressionType.GreaterThan</code>, a <code>.Left</code> that is a <code>MemberExpression</code> (representing <code>o.Amount</code>), and a <code>.Right</code> that is a <code>ConstantExpression</code> (representing <code>100</code>) — you can walk this structure in ordinary C# code, printing or transforming it, exactly as EF Core\'s query provider does internally (at a vastly more sophisticated level).',
        'This is WHY the main topic\'s "operators that EF cannot translate" Common Mistake exists at all: EF Core\'s tree-walker can only translate expression NODE TYPES it explicitly knows how to convert to SQL. A custom C# method call embedded in the lambda (<code>o =&gt; MyCustomHelper(o.Amount)</code>) produces a <code>MethodCallExpression</code> node EF Core has no SQL equivalent for — hence the <code>InvalidOperationException</code> the main topic mentions, now explained at the mechanism level rather than as a rule to memorize.',
      ],
    },
    {
      heading: 'Why you would ever write your own Expression-accepting method',
      points: [
        'Writing a method that accepts <code>Expression&lt;Func&lt;T,bool&gt;&gt;</code> instead of <code>Func&lt;T,bool&gt;</code> is the right call SPECIFICALLY when you need to pass a predicate through to an <code>IQueryable</code>-based data source — a repository method like <code>IQueryable&lt;T&gt; Find(Expression&lt;Func&lt;T,bool&gt;&gt; predicate)</code> preserves the tree form all the way down to EF Core, letting the filter still translate to SQL. Accepting <code>Func&lt;T,bool&gt;</code> instead would force the caller\'s predicate to be a compiled delegate, which EF Core CANNOT translate — you would be forced to materialize the whole table into memory first.',
        'For PURELY in-memory code with no query-translation need, <code>Func&lt;T,bool&gt;</code> remains the simpler, correct choice — <code>Expression&lt;Func&lt;T,bool&gt;&gt;</code> parameters require an extra <code>.Compile()</code> call before they can be invoked directly (<code>expr.Compile()(order)</code>), adding real overhead if you were only ever going to call the delegate in-memory anyway.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Func<T,bool> vs Expression<Func<T,bool>> — the same lambda, two different things',
      language: 'csharp',
      code: `public record Order(int Id, decimal Amount);

// Func<T,bool> — compiled to ordinary IL, callable, but OPAQUE.
Func<Order, bool> compiledPredicate = o => o.Amount > 100;
var order = new Order(1, 250m);
Console.WriteLine(compiledPredicate(order)); // True — you can CALL it

// You CANNOT inspect compiledPredicate's logic at runtime — it's just
// a pointer to compiled machine code, indistinguishable from any other method.

// Expression<Func<T,bool>> — the SAME-LOOKING lambda, compiled to DATA
// describing its structure instead of executable code.
Expression<Func<Order, bool>> treePredicate = o => o.Amount > 100;

// You CANNOT call treePredicate directly — it's not a delegate:
// treePredicate(order); // COMPILE ERROR — Expression<T> is not invocable

// You must .Compile() it first to get a real delegate back:
Func<Order, bool> compiled = treePredicate.Compile();
Console.WriteLine(compiled(order)); // True — now callable, same result

// But treePredicate itself is INSPECTABLE — this is the whole point:
Console.WriteLine(treePredicate.Body.NodeType); // GreaterThan
Console.WriteLine(treePredicate.Body.GetType().Name); // BinaryExpression`,
    },
    {
      label: 'Walking the tree structure by hand',
      language: 'csharp',
      code: `using System.Linq.Expressions;

public record Order(int Id, decimal Amount);

Expression<Func<Order, bool>> expr = o => o.Amount > 100;

// The root of the tree — a BinaryExpression for "greater than"
var binary = (BinaryExpression)expr.Body;
Console.WriteLine(binary.NodeType); // GreaterThan

// The LEFT side — accessing the Amount property on the parameter
var left = (MemberExpression)binary.Left;
Console.WriteLine(left.Member.Name); // "Amount"

// The RIGHT side — the constant value 100
var right = (ConstantExpression)binary.Right;
Console.WriteLine(right.Value); // 100

// This walk is EXACTLY the same category of work EF Core's query
// provider does internally (at a vastly more sophisticated level) to
// translate "o.Amount > 100" into a SQL "WHERE Amount > 100" clause —
// it's inspecting the SAME kind of tree structure shown here.

// A method call EF Core CANNOT translate produces a different node type:
Expression<Func<Order, bool>> untranslatable = o => MyCustomHelper(o.Amount);
var call = (MethodCallExpression)untranslatable.Body;
Console.WriteLine(call.Method.Name); // "MyCustomHelper"
// EF Core's tree-walker has no SQL equivalent for an arbitrary C# method
// call — this is the exact InvalidOperationException scenario the main
// topic's "LINQ to EF" section warns about, now visible at the tree level.

static bool MyCustomHelper(decimal amount) => amount > 100;`,
    },
    {
      label: 'Writing your own Expression-accepting repository method',
      language: 'csharp',
      code: `public record Order(int Id, decimal Amount, bool IsActive);

// Accepts Expression<Func<T,bool>> specifically so the predicate can be
// passed through to IQueryable and still translate to SQL.
public class OrderRepository(IQueryable<Order> source)
{
    public IQueryable<Order> Find(Expression<Func<Order, bool>> predicate)
        => source.Where(predicate); // the tree form is preserved all the way through

    // WRONG alternative — accepting Func<T,bool> forces early materialisation:
    public IEnumerable<Order> FindEager(Func<Order, bool> predicate)
        => source.AsEnumerable().Where(predicate);
        // AsEnumerable() pulls EVERYTHING into memory first — EF Core
        // cannot translate a plain Func<T,bool>, so this loses server-side
        // filtering entirely, exactly like the main topic's
        // "materialising in the middle of an EF Core chain" mistake.
}

// Caller — the predicate stays as an expression tree all the way to EF Core:
var repo = new OrderRepository(dbContext.Orders);
var results = await repo.Find(o => o.Amount > 100 && o.IsActive)
                         .ToListAsync(); // SQL WHERE clause generated correctly

// For a PURELY in-memory scenario with no translation need,
// Func<T,bool> remains the simpler, correct choice:
public static class InMemoryFilters
{
    public static List<T> FilterInMemory<T>(List<T> items, Func<T, bool> predicate)
        => items.Where(predicate).ToList(); // no translation needed — plain delegate is fine
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a small method <code>string DescribeComparison(Expression&lt;Func&lt;Order, bool&gt;&gt; expr)</code> that inspects a simple <code>o =&gt; o.Amount &gt; N</code>-shaped expression and returns a human-readable string like <code>"Amount GreaterThan 100"</code> — by walking <code>.Body</code> as a <code>BinaryExpression</code> the same way the second code tab does.',
    hint: 'Cast expr.Body to BinaryExpression, cast .Left to MemberExpression to get the property name via .Member.Name, cast .Right to ConstantExpression to get the value via .Value, and combine them with binary.NodeType into a formatted string.',
    solution: `string DescribeComparison(Expression<Func<Order, bool>> expr)
{
    var binary = (BinaryExpression)expr.Body;
    var left = (MemberExpression)binary.Left;
    var right = (ConstantExpression)binary.Right;

    return $"{left.Member.Name} {binary.NodeType} {right.Value}";
}

Expression<Func<Order, bool>> expr = o => o.Amount > 100;
Console.WriteLine(DescribeComparison(expr)); // "Amount GreaterThan 100"`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>Func&lt;T,bool&gt;</code> and <code>Expression&lt;Func&lt;T,bool&gt;&gt;</code> are just two different type-annotation styles for the same underlying compiled delegate.',
      reality: 'they compile to fundamentally different things — Func&lt;T,bool&gt; becomes ordinary opaque IL you can call but not inspect; Expression&lt;Func&lt;T,bool&gt;&gt; becomes an inspectable TREE OF OBJECTS describing the lambda\'s structure, which is not directly callable without first calling .Compile().',
    },
    {
      thought: '"EF Core translates LINQ to SQL" is essentially magic — there is no way to see what it is actually doing under the hood.',
      reality: 'the SAME expression-tree-walking technique shown in this subtopic (casting .Body to BinaryExpression, reading .Left/.Right) is the same CATEGORY of work EF Core\'s query provider does internally, just far more sophisticated — it is inspectable, ordinary C# data, not a black box.',
    },
    {
      thought: 'you should always accept <code>Expression&lt;Func&lt;T,bool&gt;&gt;</code> in a repository/service method\'s predicate parameter, since it is strictly more powerful than <code>Func&lt;T,bool&gt;</code>.',
      reality: 'for purely in-memory code with no query-translation need, Func&lt;T,bool&gt; is simpler and avoids the overhead of an extra .Compile() call — reach for Expression&lt;Func&lt;T,bool&gt;&gt; specifically when the predicate needs to reach an IQueryable-based data source and still translate to SQL.',
    },
  ];
}
