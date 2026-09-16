import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-skip-include-crashes-subscription-validation',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './skip-include-crashes-subscription-validation.html',
  styleUrl: './skip-include-crashes-subscription-validation.scss',
})
export class SkipIncludeCrashesSubscriptionValidationSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The single-root-field rule the main page never explains',
      points: [
        'Neither the theory nor the QnA on the main page explains HOW GraphQL enforces "a subscription operation can only have one root field" — it just states the rule. Verified directly against graphql-js (the reference implementation): a dedicated validation rule, <code>SingleFieldSubscriptionsRule</code>, walks every subscription operation and collects its top-level fields, erroring with <code>"must select only one top level field"</code> if there is more than one.',
        'That collection step expands fragment spreads first — confirmed by direct execution: a subscription selecting one literal field PLUS a fragment that spreads a second subscription field is rejected with the identical error, even though the top-level selection set in the query TEXT only shows one field written directly.',
        'So far this matches the main page\'s own framing exactly — a structural rule, checked once, before execution. The surprising part is what happens once <code>@skip</code>/<code>@include</code> enters the picture.',
      ],
    },
    {
      heading: 'A single top-level field, guarded by a variable, can crash validation entirely',
      points: [
        'Confirmed via direct execution against graphql-js\'s own <code>validate()</code> function: a subscription with a LITERAL <code>@skip(if: true)</code> or <code>@skip(if: false)</code> on its field validates cleanly with zero errors — the rule correctly evaluates the literal and counts (or doesn\'t count) the field accordingly.',
        'But <code>validate(schema, documentAST, rules, options, typeInfo)</code> — graphql-js\'s actual, current public signature, confirmed by inspecting the function directly — has NO parameter for variable runtime values at all. It only ever sees the document\'s structure and type information.',
        'The moment that same field\'s <code>@skip</code>/<code>@include</code> argument is a VARIABLE instead of a literal (<code>@skip(if: $flag)</code>), <code>SingleFieldSubscriptionsRule</code> still tries to evaluate it to decide whether to count the field — and since no runtime value for <code>$flag</code> was ever supplied to <code>validate()</code>, the attempt throws a genuine, UNCAUGHT <code>GraphQLError</code> exception straight out of the validate call. It does not get returned as one of the normal errors in the returned array; it propagates like an unhandled exception.',
        'This happens for a SINGLE top-level field, with no second field anywhere in the document — the crash has nothing to do with the "more than one field" case at all. It is triggered purely by a variable-driven <code>@skip</code>/<code>@include</code> on a subscription\'s own top-level field.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Verifying against real graphql-js (all 6 cases)',
      language: 'typescript',
      code: `import { buildSchema, parse, validate } from 'graphql';

const schema = buildSchema(\`
  type Query { placeholder: String }
  type Post { id: ID! }
  type Comment { id: ID! }
  type Subscription {
    postCreated: Post!
    commentAdded: Comment!
  }
\`);

function check(label: string, source: string) {
  try {
    const doc = parse(source);
    const errors = validate(schema, doc);
    console.log(label, '->', errors.map(e => e.message));
  } catch (e: any) {
    console.log(label, '-> THREW:', e.message);
  }
}

check('two literal fields', \`
  subscription { postCreated { id } commentAdded { id } }
\`);
// -> ["...must select only one top level field."]

check('field + fragment spreading a second field', \`
  subscription { postCreated { id } ...Extra }
  fragment Extra on Subscription { commentAdded { id } }
\`);
// -> ["...must select only one top level field."]  (fragments expand first)

check('single field, @skip(if: false) literal', \`
  subscription { postCreated @skip(if: false) { id } }
\`);
// -> []  (evaluated cleanly: field is kept)

check('single field, @skip(if: true) literal', \`
  subscription { postCreated @skip(if: true) { id } }
\`);
// -> []  (evaluated cleanly: field is dropped, zero fields -- still "valid")

check('single field, @skip(if: $flag) VARIABLE -- no second field at all', \`
  subscription (\$flag: Boolean!) { postCreated @skip(if: \$flag) { id } }
\`);
// -> THREW: Argument "if" of required type "Boolean!" was provided the
//    variable "$flag" which was not provided a runtime value.`,
    },
    {
      label: 'Why this is not "you called it wrong"',
      language: 'typescript',
      code: `// graphql-js's own current public signature -- confirmed by inspecting
// the function directly (Function.prototype.toString()):
function validate(
  schema,
  documentAST,
  rules = specifiedRules,
  options,
  typeInfo = new TypeInfo(schema), // deprecated, removed in v17
) { /* ... */ }

// There is NO parameter anywhere in this signature for variable
// runtime values. A server calling the standard validate() step --
// which every GraphQL server implementation built on graphql-js does,
// usually before it has coerced any variables at all -- structurally
// cannot supply what SingleFieldSubscriptionsRule needs to safely
// evaluate a variable-driven @skip/@include on a subscription field.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A client sends this subscription with no <code>flag</code> variable value attached to the request at all: <code>subscription($flag: Boolean!) { postCreated @skip(if: $flag) { id } }</code>. Predict what the server\'s standard validate() step does with it: returns a clean validation error, returns zero errors, or something else?',
    hint: 'Does graphql-js\'s validate() function have any way to know what $flag actually is at the point it runs?',
    solution: `Something else: it throws an uncaught GraphQLError exception out of validate() itself, rather than returning a clean array of validation errors the way every OTHER validation failure does.

The reasoning: validate()'s own signature has no variableValues parameter at all -- it only ever receives the schema and the parsed document. SingleFieldSubscriptionsRule still needs a concrete true/false to decide whether the @skip-guarded field should count toward the "exactly one top-level field" check, so it tries to resolve $flag's value anyway. With no runtime value available, that resolution attempt itself throws -- and validate() does not catch errors thrown from inside a rule's visitor, so the exception escapes all the way out to whatever called validate().

A server needs to guard for this explicitly (wrapping the validate() call in try/catch) if it ever validates a subscription document before variable values are known -- which is the normal order of operations for most GraphQL request pipelines.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Using @skip/@include with a variable on a subscription\'s only field is always safe, since there\'s only one field."',
      reality: 'Confirmed via direct execution: this crashes graphql-js\'s <code>validate()</code> function with an uncaught exception. The crash is triggered by the VARIABLE-driven directive itself, not by having a second field — a single-field subscription with a literal <code>@skip(if: true/false)</code> is completely safe; the variable form is what breaks.',
    },
    {
      thought: '"A GraphQL validation failure always comes back as a clean array of errors I can inspect."',
      reality: 'Not always. This specific rule (<code>SingleFieldSubscriptionsRule</code>) needs runtime variable values that graphql-js\'s own <code>validate()</code> signature has no way to supply — when that need collides with a variable-driven directive, the failure mode is an uncaught thrown exception, not a returned error array.',
    },
    {
      thought: '"A fragment spread hides a second field from the single-root-field rule, since the query text only shows one field directly."',
      reality: 'No — confirmed via direct execution, the rule collects fields AFTER expanding fragment spreads, so a fragment introducing a second subscription field is rejected exactly like writing that field inline.',
    },
  ];

  topicLabel = 'Subscriptions';
  topicRoute = '/graphql/subscriptions';
  prev: SubtopicLink | null = {
    label: 'Federated Subscriptions Need More Than Federation v2+',
    route: '/graphql/subscriptions/federated-subscriptions-need-enterprise-graphos',
  };
  next: SubtopicLink | null = {
    label: 'resolve Runs Once Per Subscriber, With Their Own Context',
    route: '/graphql/subscriptions/resolve-runs-per-subscriber-with-their-context',
  };
}
