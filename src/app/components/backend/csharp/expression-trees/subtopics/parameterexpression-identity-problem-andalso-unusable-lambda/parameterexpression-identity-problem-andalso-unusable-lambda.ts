import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-parameterexpression-identity-problem-andalso-unusable-lambda-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './parameterexpression-identity-problem-andalso-unusable-lambda.html',
  styleUrl: './parameterexpression-identity-problem-andalso-unusable-lambda.scss',
})
export class ParameterexpressionIdentityProblemAndalsoUnusableLambdaSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page notes this in passing under ExpressionVisitor — this is exactly why it breaks',
      points: [
        'The main Expression Trees page states, under its ExpressionVisitor section, that "each has its own independent <code>ParameterExpression</code> instance for \'x\'" when composing two predicates, and that you must rewrite one body\'s parameter to match the other\'s before combining them. Understanding EXACTLY why the naive combination fails — not just that it does — makes the fix\'s necessity obvious rather than a rule to memorize.',
      ],
    },
    {
      heading: 'Parameter binding inside a lambda tree is by REFERENCE, not by name or type',
      points: [
        'Two separately-written lambdas <code>Expression&lt;Func&lt;Product,bool&gt;&gt; a = x =&gt; x.Price &gt; 100;</code> and <code>Expression&lt;Func&lt;Product,bool&gt;&gt; b = x =&gt; x.InStock;</code> BOTH have a parameter visually named "x" and typed <code>Product</code> — but the compiler generates a genuinely DIFFERENT, distinct <code>ParameterExpression</code> OBJECT for each lambda. <code>a.Parameters[0]</code> and <code>b.Parameters[0]</code> are NOT the same object — <code>ReferenceEquals(a.Parameters[0], b.Parameters[0])</code> is <code>false</code>, despite matching name and type.',
        'Every <code>MemberExpression</code> inside <code>a.Body</code> (like <code>x.Price</code>) refers to <code>a</code>\'s OWN specific <code>ParameterExpression</code> instance by REFERENCE, not by the string "x" — the tree structure has no concept of "the parameter named x," only "THIS SPECIFIC parameter object."',
      ],
    },
    {
      heading: 'Naively combining the two bodies with AndAlso produces a tree containing TWO different, unbound parameters — genuinely unusable',
      points: [
        'Writing <code>Expression.AndAlso(a.Body, b.Body)</code> and wrapping the result in <code>Expression.Lambda&lt;Func&lt;Product,bool&gt;&gt;(combinedBody, a.Parameters[0])</code> produces a lambda that DECLARES only <code>a</code>\'s parameter — but <code>b.Body</code>\'s internal <code>MemberExpression</code> nodes still reference <code>b</code>\'s OWN, DIFFERENT parameter object, which is never declared anywhere in the new lambda\'s parameter list. Calling <code>.Compile()</code> on this malformed tree throws <code>InvalidOperationException</code> ("variable \'x\' of type \'Product\' referenced from scope \'\', but it is not defined") — the tree LOOKS plausible but is structurally broken.',
        'The fix, exactly as the main page describes, is a <code>ParameterReplacerVisitor</code> — an <code>ExpressionVisitor</code> that walks <code>b.Body</code> and rewrites every occurrence of <code>b</code>\'s parameter object to be <code>a</code>\'s parameter object instead, producing a body whose member accesses are now consistently bound to the SAME single parameter the final lambda actually declares.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving the two "x" parameters are genuinely different objects',
      language: 'csharp',
      code: `Expression<Func<Product, bool>> priceFilter = x => x.Price > 100m;
Expression<Func<Product, bool>> stockFilter  = x => x.InStock;

var paramA = priceFilter.Parameters[0];
var paramB = stockFilter.Parameters[0];

Console.WriteLine(paramA.Name); // "x"
Console.WriteLine(paramB.Name); // "x" — SAME visual name

Console.WriteLine(paramA.Type); // Product
Console.WriteLine(paramB.Type); // Product — SAME type

// But they are NOT the same object — this is the entire root cause:
Console.WriteLine(ReferenceEquals(paramA, paramB)); // False

// Every MemberExpression inside priceFilter.Body ("x.Price") refers
// to paramA SPECIFICALLY, by reference. Every MemberExpression inside
// stockFilter.Body ("x.InStock") refers to paramB SPECIFICALLY —
// a completely different object, despite the identical name/type.`,
    },
    {
      label: 'The naive combination — produces a genuinely broken, uncompilable tree',
      language: 'csharp',
      code: `Expression<Func<Product, bool>> priceFilter = x => x.Price > 100m;
Expression<Func<Product, bool>> stockFilter  = x => x.InStock;

// NAIVE — just AndAlso the two bodies together and declare ONE of
// the two parameters:
var combinedBody = Expression.AndAlso(priceFilter.Body, stockFilter.Body);
var broken = Expression.Lambda<Func<Product, bool>>(
    combinedBody,
    priceFilter.Parameters[0]); // declares ONLY priceFilter's "x"

// This LOOKS fine — no compile error, the tree is constructed:
Console.WriteLine(broken.Body.NodeType); // AndAlso

// But calling Compile() reveals the tree is genuinely broken —
// stockFilter.Body's "x.InStock" still references stockFilter's OWN
// parameter object, which this lambda never declared:
var compiled = broken.Compile();
// InvalidOperationException: variable 'x' of type 'Product' referenced
// from scope '', but it is not defined`,
    },
    {
      label: 'The fix — ParameterReplacerVisitor rewrites the second body onto the first\'s parameter',
      language: 'csharp',
      code: `using System.Linq.Expressions;

public class ParameterReplacerVisitor : ExpressionVisitor
{
    private readonly ParameterExpression _target;
    private readonly ParameterExpression _replacement;

    public ParameterReplacerVisitor(ParameterExpression target, ParameterExpression replacement)
        => (_target, _replacement) = (target, replacement);

    protected override Expression VisitParameter(ParameterExpression node)
        // Whenever the visitor encounters the OLD parameter object,
        // it substitutes the NEW one instead — rewriting every
        // reference throughout the tree:
        => node == _target ? _replacement : base.VisitParameter(node);
}

static Expression<Func<T, bool>> CombineWithAndAlso<T>(
    Expression<Func<T, bool>> first,
    Expression<Func<T, bool>> second)
{
    // Rewrite second's body so every reference to ITS parameter
    // object now points at first's parameter object instead:
    var replacer = new ParameterReplacerVisitor(second.Parameters[0], first.Parameters[0]);
    var rewrittenSecondBody = replacer.Visit(second.Body);

    var combinedBody = Expression.AndAlso(first.Body, rewrittenSecondBody);

    // NOW safe to declare only first's parameter — every node in the
    // combined body genuinely references THIS SAME parameter object:
    return Expression.Lambda<Func<T, bool>>(combinedBody, first.Parameters[0]);
}

Expression<Func<Product, bool>> priceFilter = x => x.Price > 100m;
Expression<Func<Product, bool>> stockFilter  = x => x.InStock;

var combined = CombineWithAndAlso(priceFilter, stockFilter);
var compiled = combined.Compile(); // works correctly now
Console.WriteLine(compiled(new Product { Price = 150m, InStock = true })); // True`,
  },
  ];

  exercise: TryItExercise = {
    prompt: 'Explain what specifically goes wrong (in terms of ParameterExpression identity) if you accidentally pass <code>second.Parameters[0]</code> instead of <code>first.Parameters[0]</code> as the FINAL lambda\'s declared parameter, even after correctly rewriting second\'s body with the ParameterReplacerVisitor shown above.',
    hint: 'The ParameterReplacerVisitor rewrites second\'s body to reference first\'s parameter object. Consider what the FINAL Expression.Lambda call needs to declare in order for that rewritten body (and first\'s own untouched body) to both resolve correctly.',
    solution: `// After correctly rewriting: rewrittenSecondBody now references
// first.Parameters[0] throughout (every "x" inside it points at
// FIRST's parameter object, thanks to the visitor).
//
// first.Body (UNCHANGED) also references first.Parameters[0]
// throughout, since it was never rewritten — it never needed to be,
// it already uses that parameter object.
//
// So BOTH halves of the combined AndAlso body now consistently
// reference FIRST's parameter object. The final lambda MUST declare
// exactly that SAME object as its parameter:

var combinedBody = Expression.AndAlso(first.Body, rewrittenSecondBody);

// CORRECT:
var lambda = Expression.Lambda<Func<T, bool>>(combinedBody, first.Parameters[0]);

// BROKEN — if you instead declare second.Parameters[0]:
var brokenLambda = Expression.Lambda<Func<T, bool>>(combinedBody, second.Parameters[0]);
// Now NEITHER half of combinedBody references the DECLARED parameter
// at all — both first.Body and the rewritten second body reference
// first.Parameters[0], but the lambda declares second.Parameters[0]
// instead. Calling .Compile() throws the SAME "variable 'x' ...
// referenced from scope, but it is not defined" exception — just from
// the OPPOSITE mismatch: the declared parameter and the referenced
// parameter are, once again, two different objects.
//
// The general rule: whichever parameter object the REWRITTEN,
// COMBINED body actually references throughout is the ONE AND ONLY
// object that must be declared in the final Expression.Lambda call.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'two lambda parameters with the same name ("x") and the same type are the same ParameterExpression object, or are at least interchangeable.',
      reality: 'each separately-written lambda gets its OWN distinct ParameterExpression instance from the compiler — ReferenceEquals on two "x" parameters from different lambdas is false, even with matching name and type.',
    },
    {
      thought: 'combining two predicate bodies with Expression.AndAlso and declaring one of the two original parameters produces a tree that compiles correctly, since both parameters represent "the same conceptual x".',
      reality: 'the resulting tree still contains member-access nodes referencing the OTHER predicate\'s parameter object, which was never declared — Compile() throws InvalidOperationException because that parameter is genuinely undefined in the new lambda\'s scope.',
    },
    {
      thought: 'the ParameterReplacerVisitor fix works by renaming the parameter from "x" to match the other one.',
      reality: 'the visitor does not touch names at all — it substitutes the actual PARAMETEREXPRESSION OBJECT throughout the tree, since binding is by object reference, not by the parameter\'s display name.',
    },
  ];
}
