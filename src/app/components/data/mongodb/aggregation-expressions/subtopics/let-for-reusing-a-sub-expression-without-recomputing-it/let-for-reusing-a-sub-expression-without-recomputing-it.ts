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
    heading: '$let Binds a Local Variable Scoped to One Expression',
    points: [
      'One of the main page\'s own quiz questions explains <code>$let</code> in real detail — "declares local variables within an expression scope, binding values to named variables for reuse in a complex sub-expression to avoid redundant computation" — but no codeTab on the page ever builds one.',
      'Syntax: <code>{ $let: { vars: { name: expr }, in: expressionUsing$$name } }</code>. The variables declared in <code>vars</code> are scoped ONLY to the <code>in</code> expression — they do not leak out to sibling fields, and they cannot see each other unless declared together in the SAME <code>vars</code> object.',
      'This is unrelated to the "can a sibling field in $addFields reference another sibling field" limitation this hub\'s own sibling subtopic covers — <code>$let</code> is specifically for reusing a sub-expression WITHIN one single field\'s own expression, not for sharing a value across multiple top-level output fields.',
      'Verified directly against MongoDB\'s own $let documentation: variables declared INSIDE the same <code>vars</code> block genuinely CANNOT reference one another — the documented example, <code>{ low: 1, high: "$$low" }</code>, explicitly states that <code>$$low</code> inside <code>high</code>\'s own expression refers to an OUTER variable named <code>low</code>, not the sibling being defined right next to it, and the expression is INVALID if no such outer variable exists. This is the same underlying constraint the sibling $addFields subtopic covers (a sibling being defined "nearby" is not visible to another sibling\'s own expression), just enforced differently — as an invalid reference rather than a silent missing/null.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: '$let vs. Repeating the Same Sub-Expression',
    language: 'typescript',
    code: `const products = db.collection('products');

// WITHOUT $let -- the identical (price - cost) / price sub-expression
// is written out twice, once for the raw ratio, once for the formatted
// percentage string.
const withoutLet = await products.aggregate([
  { \$addFields: {
    marginRatio:   { \$round: [{ \$divide: [{ \$subtract: ['\$price', '\$cost'] }, '\$price'] }, 4] },
    marginPercent: {
      \$concat: [
        { \$toString: { \$round: [{ \$multiply: [{ \$divide: [{ \$subtract: ['\$price', '\$cost'] }, '\$price'] }, 100] }, 1] } },
        '%',
      ],
    },
  }},
]).toArray();

// WITH $let -- the sub-expression is computed ONCE, bound to \$\$margin,
// then referenced twice inside the SAME field's own expression.
const withLet = await products.aggregate([
  { \$addFields: {
    marginSummary: {
      \$let: {
        vars: { margin: { \$divide: [{ \$subtract: ['\$price', '\$cost'] }, '\$price'] } },
        in: {
          marginRatio:   { \$round: ['\$\$margin', 4] },
          marginPercent: { \$concat: [{ \$toString: { \$round: [{ \$multiply: ['\$\$margin', 100] }, 1] } }, '%'] },
        },
      },
    },
  }},
]).toArray();

// Pure-JS equivalent, verified across 3 price/cost pairs that both
// versions produce IDENTICAL output -- \$let changes how many times the
// sub-expression is WRITTEN and (per MongoDB's own documented benefit)
// how many times it is EVALUATED server-side, not what it computes:
function computeWithLet(price, cost) {
  const margin = (price - cost) / price; // computed once, matching \$let's vars
  return {
    marginRatio: Math.round(margin * 10000) / 10000,
    marginPercent: \`\${Math.round(margin * 1000) / 10}%\`,
  };
}
function computeWithoutLet(price, cost) {
  return {
    marginRatio: Math.round(((price - cost) / price) * 10000) / 10000,
    marginPercent: \`\${Math.round(((price - cost) / price) * 1000) / 10}%\`,
  };
}

for (const [price, cost] of [[100, 60], [49.99, 32.5], [10, 10]]) {
  console.log(price, cost, '->', computeWithLet(price, cost),
    JSON.stringify(computeWithLet(price, cost)) === JSON.stringify(computeWithoutLet(price, cost)) ? '(matches)' : 'MISMATCH');
}
// -> 100 60 -> { marginRatio: 0.4, marginPercent: '40%' } (matches)
// -> 49.99 32.5 -> { marginRatio: 0.3499, marginPercent: '35%' } (matches)
// -> 10 10 -> { marginRatio: 0, marginPercent: '0%' } (matches)`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A colleague writes <code>{ $let: { vars: { a: "$x", b: { $multiply: ["$$a", 2] } }, in: "$$b" } }</code>, declaring BOTH <code>a</code> and <code>b</code> in the same <code>vars</code> object, with <code>b</code>\'s own expression referencing <code>$$a</code>, hoping <code>b</code> ends up as double <code>a</code>. Per MongoDB\'s own documented rule, does this work — and if not, how would you actually get one $let-bound variable to build on another?',
  hint: 'MongoDB\'s own documented example ({ low: 1, high: "$$low" }) states $$low inside the vars block refers to an OUTER variable of that name, not a sibling being defined right next to it.',
  solution: `// This does NOT work as hoped. Per MongoDB's own documented rule,
// $$a inside b's own expression (both declared in the SAME vars
// block) refers to an OUTER variable named "a" -- not the sibling
// "a" being defined right next to it in the same block. Since there
// is no outer $$a in scope here, the expression is INVALID -- this
// is the exact same shape of mistake as the sibling $addFields
// subtopic's bug, just enforced differently (an invalid reference,
// rather than a silent missing/null).
//
// To actually build one bound variable on top of another, NEST a
// second $let inside the first one's own "in" expression:
//   { $let: {
//       vars: { a: '$x' },
//       in: { $let: {
//         vars: { b: { $multiply: ['$$a', 2] } }, // $$a IS visible
//         in: '$$b',                              // here -- it's now
//       }},                                       // the OUTER variable
//   }}
// The nested $let's own "vars" block can reference $$a, because from
// its point of view $$a is genuinely an OUTER variable -- defined by
// the enclosing $let, not a sibling in its own vars block.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '$let is purely a readability/style choice — using it or not produces identical performance, so it is only worth using when a sub-expression genuinely needs to be referenced from multiple, unrelated top-level fields.',
    reality: 'The main page\'s own quiz explanation states $let exists specifically "to avoid redundant computation" — verified that without it, an expensive sub-expression genuinely gets WRITTEN OUT (and, per MongoDB\'s documented intent, evaluated) once per repetition; with $let, it is computed once and referenced by name. For a cheap arithmetic expression like a margin ratio the difference is negligible, but for something more expensive (a $regexMatch, a $reduce over a large array) repeating it several times in one field\'s expression is a real, avoidable cost.',
  },
  {
    thought: 'A variable declared in $let\'s vars object is visible to every field in the surrounding $addFields/$project stage, the same way a regular field would be.',
    reality: 'A $let-bound variable ($$name) is scoped ONLY to that specific $let\'s own "in" expression — it is not a document field and never appears in the output or becomes visible to sibling fields in the same stage. This is a genuinely different, narrower scope than a document field added via $addFields, which is exactly why $let cannot be used as a workaround for the sibling subtopic\'s stage-level self-reference limitation.',
  },
];

@Component({
  selector: 'app-mongo-agg-expr-let',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './let-for-reusing-a-sub-expression-without-recomputing-it.html',
  styleUrl: './let-for-reusing-a-sub-expression-without-recomputing-it.scss',
})
export class LetForReusingASubExpressionWithoutRecomputingItSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
