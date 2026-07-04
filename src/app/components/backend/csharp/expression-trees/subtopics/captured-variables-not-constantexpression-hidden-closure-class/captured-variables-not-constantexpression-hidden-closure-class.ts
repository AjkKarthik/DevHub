import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-captured-variables-not-constantexpression-hidden-closure-class-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './captured-variables-not-constantexpression-hidden-closure-class.html',
  styleUrl: './captured-variables-not-constantexpression-hidden-closure-class.scss',
})
export class CapturedVariablesNotConstantexpressionHiddenClosureClassSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own factory API section treats Expression.Constant as "the" way literals appear — captured variables take a genuinely different shape',
      points: [
        'The main Expression Trees page\'s factory API section describes <code>Expression.Constant(value, type)</code> as how a literal appears in a tree. When you write an ordinary C# lambda that CAPTURES a local variable — <code>int threshold = 100; Expression&lt;Func&lt;Product,bool&gt;&gt; e = p =&gt; p.Price &gt; threshold;</code> — the compiler does NOT emit a simple <code>ConstantExpression</code> wrapping <code>100</code> for that captured <code>threshold</code>. It emits something structurally different: a <code>MemberExpression</code> reading a FIELD off a compiler-generated CLOSURE CLASS instance.',
      ],
    },
    {
      heading: 'Every captured variable becomes a field on a hidden, compiler-generated class — the tree reads that field, it does not embed the value directly',
      points: [
        'The C# compiler generates a hidden class (often named something like <code>&lt;&gt;c__DisplayClass0_0</code>) with a public field for EACH captured variable. <code>threshold</code> becomes a field on an INSTANCE of this class, and the tree\'s node for <code>threshold</code> is a <code>MemberExpression</code> whose <code>.Expression</code> property is a <code>ConstantExpression</code> WRAPPING THE CLOSURE INSTANCE ITSELF (not the int value), and whose <code>.Member</code> is the field <code>FieldInfo</code> for <code>threshold</code>.',
        'This means <code>e.Body</code> (the <code>&gt;</code> comparison) has a <code>MemberExpression</code> for <code>p.Price</code> on the left AND a DIFFERENT KIND of <code>MemberExpression</code> for <code>threshold</code> on the right — reading a field off a closure object — NOT a plain <code>ConstantExpression</code> the way <code>Expression.Constant(100)</code>, built by hand, would produce.',
      ],
    },
    {
      heading: 'This matters directly for ExpressionVisitor code that assumes literals are always plain ConstantExpression nodes',
      points: [
        'A hand-written <code>ExpressionVisitor</code> that looks specifically for <code>ConstantExpression</code> nodes to find "the literal values" in a tree will completely MISS a captured variable like <code>threshold</code> — it needs to ALSO handle <code>MemberExpression</code> nodes whose <code>.Expression</code> is a <code>ConstantExpression</code> (the closure instance), and read the field/property value off THAT object via reflection to get the actual captured value.',
        'This is exactly why the main page\'s own EF Core section can state that changing a captured local variable\'s value between calls to the SAME query method still works correctly without rebuilding the tree — EF Core specifically recognizes this closure-field pattern and treats it as a PARAMETERIZED query value (reading the field fresh each time), rather than treating the captured variable as if it were baked permanently into the tree as a literal.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Proving a captured variable is NOT a plain ConstantExpression',
      language: 'csharp',
      code: `int threshold = 100;
Expression<Func<Product, bool>> filter = p => p.Price > threshold;

var comparison = (BinaryExpression)filter.Body;

// The LEFT side (p.Price) is a plain member access on the parameter —
// exactly the shape you'd expect:
Console.WriteLine(comparison.Left.NodeType); // MemberAccess
Console.WriteLine(((MemberExpression)comparison.Left).Expression?.NodeType); // Parameter

// The RIGHT side (threshold) is ALSO technically a MemberAccess node —
// NOT a plain ConstantExpression, even though it visually "looks like"
// a captured int literal:
Console.WriteLine(comparison.Right.NodeType); // MemberAccess — surprising!

var thresholdMember = (MemberExpression)comparison.Right;
Console.WriteLine(thresholdMember.Member.Name); // "threshold" — the
                                                  // FIELD name on the
                                                  // hidden closure class

// And its OWN .Expression is a ConstantExpression — but the constant
// it wraps is the CLOSURE INSTANCE OBJECT, not the int 100 itself:
var closureConstant = (ConstantExpression)thresholdMember.Expression!;
Console.WriteLine(closureConstant.Value?.GetType().Name);
// Something like "<>c__DisplayClass0_0" — the compiler-generated
// closure class, NOT System.Int32`,
    },
    {
      label: 'Reading the actual captured value out of the closure field',
      language: 'csharp',
      code: `int threshold = 100;
Expression<Func<Product, bool>> filter = p => p.Price > threshold;

var comparison = (BinaryExpression)filter.Body;
var thresholdMember = (MemberExpression)comparison.Right;
var closureConstant = (ConstantExpression)thresholdMember.Expression!;

// To get the ACTUAL captured value (100), you must read the field
// off the closure instance via reflection — there is no shortcut,
// because the tree genuinely does not store "100" as a literal
// anywhere; it stores instructions for how to READ it later:
object closureInstance = closureConstant.Value!;
var fieldInfo = (System.Reflection.FieldInfo)thresholdMember.Member;
object actualValue = fieldInfo.GetValue(closureInstance)!;

Console.WriteLine(actualValue); // 100 — the genuinely captured value,
                                 // reached through the closure field,
                                 // not directly embedded in the tree`,
    },
    {
      label: 'Why an ExpressionVisitor that only checks for ConstantExpression misses captured variables',
      language: 'csharp',
      code: `// A NAIVE visitor looking for "literal values" — misses captured
// variables entirely, because they are NOT ConstantExpression nodes:
public class NaiveConstantFinder : ExpressionVisitor
{
    public List<object?> FoundConstants { get; } = new();

    protected override Expression VisitConstant(ConstantExpression node)
    {
        FoundConstants.Add(node.Value);   // only ever fires for TRUE
        return base.VisitConstant(node);   // literals like Expression.Constant(42)
    }
}

int threshold = 100;
Expression<Func<Product, bool>> filter = p => p.Price > threshold;
var naive = new NaiveConstantFinder();
naive.Visit(filter.Body);
Console.WriteLine(naive.FoundConstants.Count); // 0 — MISSED threshold
                                                 // entirely, because it
                                                 // is a MemberExpression,
                                                 // not a ConstantExpression

// The CORRECT visitor also handles the closure-field shape:
public class CompleteValueFinder : ExpressionVisitor
{
    public List<object?> FoundValues { get; } = new();

    protected override Expression VisitConstant(ConstantExpression node)
    {
        FoundValues.Add(node.Value);
        return base.VisitConstant(node);
    }

    protected override Expression VisitMember(MemberExpression node)
    {
        // Detect the closure-field pattern: a member access whose
        // owning expression is itself a constant (the closure instance):
        if (node.Expression is ConstantExpression closureConst)
        {
            var value = node.Member is System.Reflection.FieldInfo fi
                ? fi.GetValue(closureConst.Value)
                : null;
            FoundValues.Add(value);
        }
        return base.VisitMember(node);
    }
}

var complete = new CompleteValueFinder();
complete.Visit(filter.Body);
Console.WriteLine(complete.FoundValues.Count); // 1 — correctly found
                                                 // threshold's value, 100`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Explain why EF Core can efficiently reuse a compiled query (<code>EF.CompileQuery</code>, mentioned in the main topic page) across multiple calls where a captured local variable\'s value changes between calls, without needing to rebuild or re-translate the expression tree each time.',
    hint: 'Consider what the tree ACTUALLY stores for a captured variable — a fixed value, or instructions for reading a field off a closure object at the moment the query executes.',
    solution: `// A captured variable like "threshold" in:
//   Expression<Func<Product, bool>> filter = p => p.Price > threshold;
//
// does NOT bake the value 100 permanently into the tree as a literal.
// Instead, the tree stores a MemberExpression that says, structurally,
// "read the 'threshold' FIELD off THIS closure instance" — the actual
// VALUE is only resolved by reading that field, which can be done
// FRESH every time the query actually executes.
//
// This is EXACTLY why EF Core's query translation layer specifically
// recognizes the closure-field pattern and treats it as a
// PARAMETERIZED SQL value (e.g. compiling to "WHERE Price > @p0" with
// @p0 supplied at execution time) rather than baking a specific
// literal number into the generated SQL text itself.
//
// Practically, this means EF.CompileQuery can translate the TREE
// SHAPE once (the SQL structure: "WHERE Price > @p0") and reuse that
// compiled translation across MANY calls — each call just supplies a
// DIFFERENT value for @p0 by reading the (potentially different)
// current value of the closure field, without needing to re-analyze
// or re-translate the expression tree's structure at all. If captured
// variables WERE baked in as permanent ConstantExpression literals,
// a different threshold value would produce a genuinely DIFFERENT
// tree shape each time, defeating the entire point of a compiled,
// reusable query.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a captured local variable inside a lambda expression tree always compiles into a plain ConstantExpression node, just like Expression.Constant(value) would produce by hand.',
      reality: 'the compiler generates a hidden closure class with a field for the captured variable — the tree contains a MemberExpression reading that field off a ConstantExpression-wrapped closure INSTANCE, not a ConstantExpression wrapping the value directly.',
    },
    {
      thought: 'an ExpressionVisitor that overrides VisitConstant() to find "all the literal values" in a tree will find every captured variable and literal.',
      reality: 'it will completely MISS captured variables, since they appear as MemberExpression nodes, not ConstantExpression nodes — a complete value-finding visitor must also handle the specific closure-field MemberExpression shape.',
    },
    {
      thought: 'EF Core must re-translate and re-analyze an expression tree from scratch every time a captured variable\'s value changes between calls to the same query method.',
      reality: 'because captured variables are represented as closure-field reads rather than baked-in literals, EF Core can translate the tree SHAPE once and reuse it as a parameterized query, reading the current field value fresh on each execution.',
    },
  ];
}
