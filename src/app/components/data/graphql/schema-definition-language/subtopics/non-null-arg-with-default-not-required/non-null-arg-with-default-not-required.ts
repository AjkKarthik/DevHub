import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-non-null-arg-with-default-not-required',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './non-null-arg-with-default-not-required.html',
  styleUrl: './non-null-arg-with-default-not-required.scss',
})
export class NonNullArgWithDefaultNotRequiredSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The rule has two parts, not one',
      points: [
        'It is easy to compress the rule to "a non-null argument is required". The main page’s Nullability &amp; Lists section now spells out the second half — this subtopic is the executable version of why that half matters.',
        'Per the GraphQL spec’s <em>Required Arguments</em> and <em>Input Object Required Fields</em> sections: an argument (or input field) is required only if it is a Non-Null type <strong>and does not have a default value</strong>. Add a default and the same <code>!</code> argument becomes optional to supply.',
        'So <code>limit: Int!</code> is required, but <code>limit: Int! = 10</code> is not — a caller may omit it entirely and the server substitutes <code>10</code>. The <code>!</code> here is still meaningful: it guarantees the resolver never sees <code>null</code> for <code>limit</code>.',
        'The two properties are independent: <code>!</code> controls whether <code>null</code> is an allowed <em>value</em>; the presence of a default controls whether the caller must <em>mention</em> the argument at all.',
      ],
    },
    {
      heading: 'Absence is not the same as an explicit null',
      points: [
        'A default value only fills in for a <strong>missing</strong> argument. Passing an explicit <code>null</code> to a Non-Null argument is always a validation error, default or not — the default never gets a chance to apply.',
        'This matters when a client builds a query dynamically: sending <code>{ limit: someVar }</code> where <code>someVar</code> is <code>null</code> is rejected, even though omitting <code>limit</code> from the object entirely would have succeeded.',
        'For a nullable argument with a default (<code>limit: Int = 10</code>), the two cases genuinely differ: omitting it yields <code>10</code>; passing explicit <code>null</code> yields <code>null</code>. The default is for absence only.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The rule, as code',
      language: 'typescript',
      code: `// Models the spec's Required-Arguments check plus Non-Null value coercion.
type ArgDef = { nonNull: boolean; hasDefault: boolean };
type CallSite = { omitted: boolean; explicitNull?: boolean };

function checkArg(def: ArgDef, call: CallSite): { valid: boolean; why: string } {
  // Non-Null rejects an explicit null value regardless of any default.
  if (def.nonNull && call.explicitNull)
    return { valid: false, why: 'explicit null passed to a Non-Null argument' };

  if (call.omitted) {
    // "required" = Non-Null AND no default value.
    if (def.nonNull && !def.hasDefault)
      return { valid: false, why: 'required (Non-Null, no default) but omitted' };
    return {
      valid: true,
      why: def.hasDefault ? 'omitted -> default value substituted' : 'omitted -> null',
    };
  }
  return { valid: true, why: 'concrete value provided' };
}`,
    },
    {
      label: 'Applied to real SDL',
      language: 'typescript',
      code: `// posts(limit: Int! = 10)      -> Non-Null WITH a default
// user(userId: ID!)            -> Non-Null, no default (the main page's example)

const withDefault  = { nonNull: true,  hasDefault: true };
const noDefault    = { nonNull: true,  hasDefault: false };

console.log(checkArg(withDefault, { omitted: true }));
// { valid: true,  why: 'omitted -> default value substituted' }   <- posts() is fine

console.log(checkArg(withDefault, { omitted: false, explicitNull: true }));
// { valid: false, why: 'explicit null passed to a Non-Null argument' }  <- posts(limit: null) still rejected

console.log(checkArg(withDefault, { omitted: false }));
// { valid: true,  why: 'concrete value provided' }                 <- posts(limit: 5) is fine

console.log(checkArg(noDefault, { omitted: true }));
// { valid: false, why: 'required (Non-Null, no default) but omitted' }  <- user() is an error

console.log(checkArg(noDefault, { omitted: false }));
// { valid: true,  why: 'concrete value provided' }                 <- user(userId: "7") is fine`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A schema declares <code>feed(first: Int! = 20): [Post!]!</code>. A client sends the query <code>{ feed(first: $count) { id } }</code> with the variable <code>$count</code> set to <code>null</code>. Is the operation valid? Would omitting <code>first</code> from the query entirely have worked?',
    hint: 'The default value covers a missing argument. Ask whether an explicit null counts as "missing".',
    solution: `The operation is INVALID. first is Non-Null (Int!), and the client is passing an explicit null value for it via $count. A Non-Null argument rejects an explicit null no matter what its default is -- the default only substitutes for a completely absent argument, and $count = null is a present argument whose value happens to be null.

Omitting first entirely -- writing { feed { id } } -- WOULD have worked: the argument is then missing, the default 20 is substituted, and the resolver receives first = 20. The fix for the dynamic-query case is to leave the argument out of the selection when the value is null, rather than passing null and relying on the default.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Putting <code>!</code> on an argument always forces the caller to pass it."',
      reality: 'Only if there is no default value. <code>limit: Int!</code> is required; <code>limit: Int! = 10</code> is optional to supply. The <code>!</code> still bans <code>null</code> as a value — it just no longer forces the argument to appear.',
    },
    {
      thought: '"If an argument has a default, I can pass <code>null</code> and get the default behaviour."',
      reality: 'For a Non-Null argument, passing explicit <code>null</code> is a validation error — the default is never consulted. Defaults fill in for a <em>missing</em> argument only. To get the default, leave the argument out.',
    },
    {
      thought: '"A nullable argument with a default behaves the same whether I omit it or pass <code>null</code>."',
      reality: 'They differ. <code>limit: Int = 10</code> omitted yields <code>10</code>; passed as explicit <code>null</code> yields <code>null</code>. The default only applies to absence, so the resolver can genuinely tell "not asked" from "asked for null".',
    },
  ];

  topicLabel = 'Schema Definition Language';
  topicRoute = '/graphql/schema-definition-language';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'Only Fragments and __typename Can Select From a Union',
    route: '/graphql/schema-definition-language/union-selection-sets',
  };
}
