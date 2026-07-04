import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-dynamic-expression-trees-asserting-tree-shape-not-compiled-result-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-dynamic-expression-trees-tree-shape.html',
  styleUrl: './testing-dynamic-expression-trees-tree-shape.scss',
})
export class TestingDynamicExpressionTreesAssertingTreeShapeNotCompiledResultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Testing a dynamically-built tree by calling .Compile() and running it misses exactly the bug the main page warns about',
      points: [
        'The main Expression Trees page\'s own dynamic-query-building section warns "EF throws \'could not be translated\' when your lambda contains a node the SQL provider cannot map." A test that builds a dynamic tree, calls <code>.Compile()</code>, and runs it against an IN-MEMORY collection can pass PERFECTLY — <code>.Compile()</code> happily turns almost any valid tree into a runnable delegate — while the SAME tree, handed to an EF Core <code>IQueryable</code> provider, throws exactly that translation exception. Testing via <code>Compile()</code> alone never exercises the translatability concern at all.',
      ],
    },
    {
      heading: 'The fix: assert on the tree\'s STRUCTURE directly — NodeType, operator, and operand shape — before ever compiling or running it',
      points: [
        'A meaningful test for a dynamic query builder inspects the resulting <code>Expression&lt;Func&lt;T,bool&gt;&gt;</code>\'s own <code>.Body</code>, checking its <code>NodeType</code> (e.g. <code>ExpressionType.GreaterThan</code>), and drilling into its operands (a <code>MemberExpression</code> for the property, a <code>ConstantExpression</code> for the value) — this directly verifies the builder produced the EXACT tree shape intended, independent of whether that shape happens to also run correctly when compiled in-memory.',
        'This test-the-shape technique catches a genuinely different class of bug than a compiled-and-run test would: a builder that accidentally produces <code>GreaterThanOrEqual</code> instead of <code>GreaterThan</code> for a user-selected "greater than" filter might STILL pass a compiled/run test against certain test data (if the boundary value never appears), while a shape assertion catches the wrong operator immediately, deterministically, regardless of test data.',
      ],
    },
    {
      heading: 'This is the specific technique that catches the main page\'s own "EF throws could not be translated" failure mode BEFORE it ever reaches production',
      points: [
        'Beyond checking the operator is correct, a shape-based test can also assert the tree contains ONLY node types the target provider is known to support (e.g. no <code>MethodCallExpression</code> invoking an arbitrary C# method EF cannot translate) — effectively a lightweight, targeted "will this translate" check that runs in milliseconds, entirely separate from needing a real database connection to discover the failure.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The gap — Compile()-and-run passes, but the tree would fail EF translation',
      language: 'csharp',
      code: `// The main page's own dynamic-query-building pattern:
static Expression<Func<T, bool>> BuildFilter<T>(string propertyName, string op, object value)
{
    var param = Expression.Parameter(typeof(T), "x");
    var property = Expression.Property(param, propertyName);
    var constant = Expression.Constant(Convert.ChangeType(value, property.Type), property.Type);

    Expression body = op switch
    {
        ">"  => Expression.GreaterThan(property, constant),
        ">=" => Expression.GreaterThanOrEqual(property, constant), // BUG: wrong
                                                                     // case matched
                                                                     // for ">" by
                                                                     // mistake below
        _    => throw new NotSupportedException(op),
    };
    return Expression.Lambda<Func<T, bool>>(body, param);
}

// A test that only compiles and runs against in-memory data:
var filter = BuildFilter<Product>("Price", ">", 100m);
var compiled = filter.Compile();

Console.WriteLine(compiled(new Product { Price = 150m })); // True — PASSES
Console.WriteLine(compiled(new Product { Price = 100m })); // False — ALSO
                                                             // happens to
                                                             // pass, even
                                                             // if the
                                                             // operator
                                                             // were
                                                             // ACCIDENTALLY
                                                             // GreaterThanOrEqual
                                                             // for boundary
                                                             // values that
                                                             // never get
                                                             // tested`,
    },
    {
      label: 'Testing the tree SHAPE directly — catches the wrong operator deterministically',
      language: 'csharp',
      code: `using Xunit;
using System.Linq.Expressions;

public class BuildFilterShapeTests
{
    [Fact]
    public void BuildFilter_GreaterThanOperator_ProducesGreaterThanNode()
    {
        var filter = BuildFilter<Product>("Price", ">", 100m);

        // Directly assert on the TREE'S OWN STRUCTURE — not on any
        // compiled, run result. This catches the exact "wrong
        // operator" class of bug regardless of what test DATA happens
        // to be used:
        Assert.Equal(ExpressionType.GreaterThan, filter.Body.NodeType);

        var binary = (BinaryExpression)filter.Body;
        var member = Assert.IsType<MemberExpression>(binary.Left);
        Assert.Equal("Price", member.Member.Name);

        var constant = Assert.IsType<ConstantExpression>(binary.Right);
        Assert.Equal(100m, constant.Value);
    }

    [Fact]
    public void BuildFilter_UnsupportedOperator_ThrowsImmediately()
    {
        // Proves the builder itself rejects unknown operators eagerly,
        // rather than silently producing a malformed or wrong tree:
        Assert.Throws<NotSupportedException>(() =>
            BuildFilter<Product>("Price", "~=", 100m));
    }
}`,
    },
    {
      label: 'A lightweight "will this translate" check — no real database needed',
      language: 'csharp',
      code: `// A targeted check that catches the main page's own "EF throws
// 'could not be translated'" failure mode, without needing a real
// EF Core DbContext or database connection at all:
static bool ContainsUntranslatableNode(Expression expr)
{
    bool foundBad = false;
    new UntranslatableNodeFinder(() => foundBad = true).Visit(expr);
    return foundBad;
}

class UntranslatableNodeFinder : ExpressionVisitor
{
    private readonly Action _onFound;
    public UntranslatableNodeFinder(Action onFound) => _onFound = onFound;

    protected override Expression VisitMethodCall(MethodCallExpression node)
    {
        // A crude but genuinely useful check: flag any method call
        // that isn't one of the small set of methods known to
        // translate cleanly to SQL (Contains, StartsWith, etc.):
        var translatable = new[] { "Contains", "StartsWith", "EndsWith", "ToLower", "ToUpper" };
        if (!translatable.Contains(node.Method.Name))
            _onFound();
        return base.VisitMethodCall(node);
    }
}

[Fact]
public void BuildFilter_NeverProducesUntranslatableMethodCalls()
{
    var filter = BuildFilter<Product>("Price", ">", 100m);

    // Runs in milliseconds, no database needed — proactively catches
    // the "could not be translated" failure mode the main page warns
    // about, well before it would surface as a runtime EF exception:
    Assert.False(ContainsUntranslatableNode(filter.Body));
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a shape-based test proving that the main topic page\'s own <code>Expression.AndAlso</code> pattern for combining two filters produces a tree whose top-level <code>NodeType</code> is genuinely <code>ExpressionType.AndAlso</code>, with the two ORIGINAL sub-predicates preserved as its Left and Right operands.',
    hint: 'Build two simple predicates, combine them (assume parameter substitution is already handled correctly), then assert combined.Body.NodeType == ExpressionType.AndAlso and inspect .Left/.Right as BinaryExpression nodes matching each original predicate\'s own body shape.',
    solution: `[Fact]
public void CombinePredicates_ProducesAndAlsoNodeWithBothOriginalBodies()
{
    Expression<Func<Product, bool>> priceFilter = p => p.Price > 100m;
    Expression<Func<Product, bool>> stockFilter = p => p.InStock;

    // Assume CombineWithAndAlso correctly substitutes parameters
    // (covered in a related subtopic) and combines the two bodies:
    Expression<Func<Product, bool>> combined =
        CombineWithAndAlso(priceFilter, stockFilter);

    // Directly assert on the SHAPE of the combined tree:
    Assert.Equal(ExpressionType.AndAlso, combined.Body.NodeType);

    var andAlso = (BinaryExpression)combined.Body;

    // Left side should still be the "greater than" shape from priceFilter:
    Assert.Equal(ExpressionType.GreaterThan, andAlso.Left.NodeType);

    // Right side should still be the plain member-access shape from
    // stockFilter (a boolean property read, no operator needed):
    Assert.Equal(ExpressionType.MemberAccess, andAlso.Right.NodeType);
}

// (CombineWithAndAlso itself — parameter substitution via
// ExpressionVisitor — is exactly the subject of the next subtopic.)`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a dynamically-built expression tree compiles and runs correctly against in-memory test data, it is safe to hand to an EF Core IQueryable provider.',
      reality: '.Compile() happily turns almost any valid tree into a runnable delegate, completely independent of whether that same tree can be TRANSLATED by a SQL provider — testing via Compile() alone never exercises translatability at all.',
    },
    {
      thought: 'testing a query-builder method only requires checking it produces the correct FILTERED RESULTS for a set of sample inputs.',
      reality: 'asserting directly on the tree\'s NodeType and operand shape catches operator bugs (e.g. GreaterThanOrEqual instead of GreaterThan) deterministically, regardless of whether the specific test data happens to include the boundary values that would expose the bug through compiled output alone.',
    },
    {
      thought: 'the only way to verify an expression tree will translate correctly to SQL is to run it against a real EF Core DbContext and database.',
      reality: 'a lightweight ExpressionVisitor that flags method calls or node types known to be untranslatable can catch this failure mode in milliseconds, with no database connection needed at all — a targeted, fast pre-check rather than a full integration test.',
    },
  ];
}
