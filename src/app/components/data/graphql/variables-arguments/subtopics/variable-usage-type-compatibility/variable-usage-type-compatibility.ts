import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-variable-usage-type-compatibility',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './variable-usage-type-compatibility.html',
  styleUrl: './variable-usage-type-compatibility.scss',
})
export class VariableUsageTypeCompatibilitySubtopic {
  theory: TheoryPoint[] = [
    {
      heading: '"Match exactly" is too strict',
      points: [
        'The main page used to say a variable’s type "must match the argument type in the schema exactly". The spec’s actual rule — <em>All Variable Usages Are Allowed</em> (<code>IsVariableUsageAllowed</code>) — is about compatibility, not identity.',
        'The two types must share the same <strong>named</strong> type (<code>ID</code> vs <code>ID</code>, not <code>String</code> vs <code>ID</code>). Given that, the nullability wrappers are checked with a direction.',
        'A <strong>non-null variable at a nullable location</strong> is always fine: <code>$id: ID!</code> passed where the schema declares <code>id: ID</code> works, because a value that is never null trivially satisfies "may be null".',
        'A <strong>nullable variable at a non-null location</strong> (<code>$q: String</code> passed where <code>query: String!</code> is declared) is normally a validation error — <em>unless</em> the variable has a default value, or the argument location itself has a default value. Either default closes the gap, because the position can never actually receive null.',
      ],
    },
    {
      heading: 'Why the default-value carve-out exists',
      points: [
        'If <code>$q: String = "*"</code> and the client omits <code>$q</code>, the coerced value is <code>"*"</code> — never null. If the client passes <code>$q</code> explicitly, it must pass a string (the variable is nullable, but an explicit null would then flow to a non-null position and error at execution). So in practice the non-null location is safe, and validation allows it.',
        'Same logic when the <em>argument</em> has a default: <code>results(query: String! = "*")</code>. Omitting the variable lets the argument default apply; the non-null position is satisfied without the variable ever supplying null.',
        'This is a genuine spec special-case, not an implementation quirk — it lets you keep a variable optional to the caller while still targeting a non-null argument.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The rule, modelled',
      language: 'typescript',
      code: `type GqlType = { name: string; nonNull: boolean };

// Mirrors the spec's IsVariableUsageAllowed for a single scalar position.
function isVariableUsageAllowed(
  varType: GqlType, varHasDefault: boolean,
  locType: GqlType, locHasDefault: boolean,
): { ok: boolean; why: string } {
  if (varType.name !== locType.name)
    return { ok: false, why: \`different named types: \${varType.name} vs \${locType.name}\` };

  if (!locType.nonNull) {
    // nullable location accepts a variable of the same type, null or non-null
    return { ok: true, why: varType.nonNull
      ? 'non-null variable at a nullable location'
      : 'same nullable type' };
  }
  // non-null location:
  if (varType.nonNull) return { ok: true, why: 'both non-null' };
  if (varHasDefault)   return { ok: true, why: 'nullable variable, but it has a default value' };
  if (locHasDefault)   return { ok: true, why: 'nullable variable, but the argument has a default value' };
  return { ok: false, why: 'nullable variable at a non-null location, no default anywhere' };
}`,
    },
    {
      label: 'Every combination',
      language: 'typescript',
      code: `const t  = (name: string) => ({ name, nonNull: false });
const tb = (name: string) => ({ name, nonNull: true });

// $id: ID!  used where the schema wants  id: ID
console.log(isVariableUsageAllowed(tb('ID'), false, t('ID'), false));
// { ok: true, why: 'non-null variable at a nullable location' }

// $q: String  used where the schema wants  query: String!   -- no defaults
console.log(isVariableUsageAllowed(t('String'), false, tb('String'), false));
// { ok: false, why: 'nullable variable at a non-null location, no default anywhere' }

// same, but the VARIABLE has a default:  query Search($q: String = "*")
console.log(isVariableUsageAllowed(t('String'), true, tb('String'), false));
// { ok: true, why: 'nullable variable, but it has a default value' }

// same, but the ARGUMENT has a default:  results(query: String! = "*")
console.log(isVariableUsageAllowed(t('String'), false, tb('String'), true));
// { ok: true, why: 'nullable variable, but the argument has a default value' }

// $id: String!  used where the schema wants  id: ID!   -- different named type
console.log(isVariableUsageAllowed(tb('String'), false, tb('ID'), false));
// { ok: false, why: 'different named types: String vs ID' }`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You write <code>query Search($q: String) { results(query: $q) { id } }</code>, but the schema declares <code>results(query: String!): [Result!]!</code>. Validation fails: <code>Variable "$q" of type "String" used in position expecting type "String!"</code>. Give two fixes that do not touch the schema, and say which keeps <code>$q</code> optional for the caller.',
    hint: 'The non-null location needs a guarantee the position never receives null. What two things provide that guarantee?',
    solution: `Fix 1 -- make the variable non-null: query Search($q: String!). Now the variable can never be null, so it satisfies the non-null argument directly. But the caller MUST now always pass $q.

Fix 2 -- give the variable a default: query Search($q: String = ""). The variable is still nullable in its declaration, but IsVariableUsageAllowed permits a nullable variable at a non-null location when the variable has a default value. If the caller omits $q, the default "" is coerced in; the non-null position never sees null.

Fix 2 is the one that keeps $q optional for the caller. (A third option is to change the schema so the argument itself has a default -- results(query: String! = "") -- but that touches the schema.)`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"A variable’s type must be identical to the argument type it is passed to."',
      reality: 'It must share the same named type, but the nullability wrappers only need to be compatible. A non-null variable works at a nullable location, and a nullable variable works at a non-null location when the variable or the argument has a default value.',
    },
    {
      thought: '"<code>$id: ID!</code> cannot be passed where the schema declares a plain nullable <code>ID</code>."',
      reality: 'It can. A value that is guaranteed non-null trivially satisfies a position that merely permits null. The restriction runs the other way — nullable variable into a non-null position.',
    },
    {
      thought: '"If the variable and argument types disagree, the query still runs and just behaves oddly."',
      reality: 'It is a validation error. The operation is rejected before any resolver runs — the query never executes at all.',
    },
  ];

  topicLabel = 'Variables & Arguments';
  topicRoute = '/graphql/variables-arguments';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'Enum Values: Bare in the Query, String in the Variables JSON',
    route: '/graphql/variables-arguments/enum-inline-vs-variables',
  };
}
