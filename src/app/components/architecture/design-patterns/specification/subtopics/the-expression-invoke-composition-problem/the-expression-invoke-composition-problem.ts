import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'The QnA Describes the Fix, the Code Never Uses It',
    points: [
      'The main page\'s own QnA explains exactly why <code>&&</code>/<code>||</code> can\'t combine two <code>Expression&lt;Func&lt;T,bool&gt;&gt;</code> objects, and names the correct fix: "the ExpressionVisitor pattern to rewrite one expression\'s parameter to match the other\'s (a Parameter Replacer), then wrap both bodies in an <code>Expression.AndAlso</code> or <code>Expression.OrElse</code> node manually."',
      'But the main page\'s OWN <code>AndSpec</code>/<code>OrSpec</code>/<code>NotSpec</code> classes never do a Parameter Replacer at all — they use <code>Expression.Invoke(l, param)</code>, wrapping each sub-expression as an INVOCATION of a separately-stored lambda rather than rewriting it into the SAME tree.',
      '<code>Expression.Invoke()</code> works fine once the whole tree is <code>.Compile()</code>\'d and run in memory (which is exactly what <code>IsSatisfiedBy()</code> does) — the CLR happily invokes the inner delegate. The problem only shows up on the OTHER path the main page also demonstrates: <code>db.Customers.Where(eligibleForDiscount.ToExpression())</code>. LINQ providers, including EF Core, have long-documented trouble translating an <code>InvocationExpression</code> over an expression tree that was built and stored as a runtime VARIABLE (as opposed to an inline lambda literal) — this is precisely the class of problem libraries like LinqKit\'s <code>PredicateBuilder</code>/<code>AsExpandable()</code> exist to paper over.',
    ],
  },
  {
    heading: 'What a Parameter Replacer Actually Does',
    points: [
      'Instead of invoking one expression FROM INSIDE another (which is what <code>Invoke</code> does), a Parameter Replacer walks an existing expression tree and swaps out every reference to ITS OWN parameter for a shared, newly-created one.',
      'Once both sub-expressions have been rewritten to use the SAME parameter object, their (already-rewritten) BODIES can be combined directly with <code>Expression.AndAlso</code>/<code>Expression.OrElse</code> — producing ONE flat expression tree with no <code>Invoke</code> node anywhere in it, which every mainstream LINQ provider can translate to SQL without special-casing.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before — Invoke-Based Composition',
    language: 'csharp',
    code: `internal class AndSpec<T>(Specification<T> left, Specification<T> right) : Specification<T>
{
    public override Expression<Func<T, bool>> ToExpression()
    {
        var l = left.ToExpression();
        var r = right.ToExpression();
        var param = Expression.Parameter(typeof(T));
        // Invoke wraps l/r as separate, still-independent sub-trees —
        // fine for .Compile(), risky for EF Core's SQL translator.
        var body = Expression.AndAlso(Expression.Invoke(l, param), Expression.Invoke(r, param));
        return Expression.Lambda<Func<T, bool>>(body, param);
    }
}`,
  },
  {
    label: 'After — Parameter Replacer',
    language: 'csharp',
    code: `// Rewrites every reference to an expression's OWN parameter to a
// shared one — no Invoke node needed afterward.
internal class ParameterReplacer(ParameterExpression target) : ExpressionVisitor
{
    protected override Expression VisitParameter(ParameterExpression node) => target;
}

internal class AndSpec<T>(Specification<T> left, Specification<T> right) : Specification<T>
{
    public override Expression<Func<T, bool>> ToExpression()
    {
        var param = Expression.Parameter(typeof(T));
        // Rewrite EACH body to use the SAME param, then combine the
        // (already-rewritten) bodies directly — one flat tree, no Invoke.
        var l = new ParameterReplacer(param).Visit(left.ToExpression().Body);
        var r = new ParameterReplacer(param).Visit(right.ToExpression().Body);
        var body = Expression.AndAlso(l, r);
        return Expression.Lambda<Func<T, bool>>(body, param);
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Both versions above produce a correct result when you call <code>eligibleForDiscount.IsSatisfiedBy(customer)</code> (which calls <code>.Compile()</code> and runs in memory). Why does the difference between them only matter for the OTHER usage the main page shows — <code>db.Customers.Where(eligibleForDiscount.ToExpression())</code>?',
  hint: 'Think about what actually EXECUTES each version of the tree, and whether that executor needs to understand the tree\'s SHAPE or just needs to be able to RUN it.',
  solution: `// .Compile() turns the WHOLE expression tree -- Invoke nodes and
// all -- into an actual runnable delegate. The CLR doesn't need to
// "understand" the Invoke node's meaning in any special way; it just
// executes it like any other method call, so both the Invoke-based
// and Parameter-Replacer-based trees run correctly in memory.

// db.Customers.Where(...) is completely different: EF Core doesn't
// EXECUTE the expression tree directly at all -- it TRANSLATES the
// tree's own shape into a SQL WHERE clause. That translation step
// has to recognize and handle every node type in the tree. A flat
// tree built by a Parameter Replacer (just AndAlso/OrElse/comparison
// nodes) translates the same way any hand-written LINQ predicate
// would. An Invoke node wrapping a separately-stored expression
// variable is a much less commonly-supported shape for a provider's
// translator to recognize -- which is exactly the risk the fix
// removes.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '<code>Expression.Invoke()</code> is simply wrong and should never be used to combine expressions.',
    reality: 'It is a completely valid, standard part of the <code>Expression</code> API — the issue here is narrower: it interacts poorly with SQL-translating LINQ providers specifically, not with expression trees in general. Code that only ever calls <code>.Compile()</code> and runs expressions in memory (never passing them to an ORM\'s <code>Where()</code>) has no reason to avoid <code>Invoke</code> at all. The Specification pattern\'s OWN promise — "the same specification works for both in-memory validation AND SQL querying" — is specifically what makes the Parameter Replacer worth the extra code here.',
  },
  {
    thought: 'Since the main page\'s own IsSatisfiedBy() tests would still pass with the original Invoke-based version, the bug would never actually be caught by testing.',
    reality: 'It would be caught by any test that exercises the SQL path specifically — e.g. an integration test running <code>db.Customers.Where(spec.ToExpression()).ToListAsync()</code> against a real (or in-memory-provider) EF Core context, rather than only unit-testing <code>IsSatisfiedBy()</code> in isolation. This is a useful general lesson for a pattern explicitly designed to work in TWO modes: a test suite covering only one of those modes can leave the other one\'s failure mode completely uncaught.',
  },
];

@Component({
  selector: 'app-dp-spec-invoke-fix',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-expression-invoke-composition-problem.html',
  styleUrl: './the-expression-invoke-composition-problem.scss',
})
export class TheExpressionInvokeCompositionProblemSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
