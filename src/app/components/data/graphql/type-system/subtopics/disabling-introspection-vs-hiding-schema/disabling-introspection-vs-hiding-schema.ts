import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-disabling-introspection-vs-hiding-schema',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './disabling-introspection-vs-hiding-schema.html',
  styleUrl: './disabling-introspection-vs-hiding-schema.scss',
})
export class DisablingIntrospectionVsHidingSchemaSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The claim, and its gap',
      points: [
        'The theory, a mistakes entry, and a QnA all say the same thing: disable introspection in production so attackers cannot discover your schema. Disabling introspection is worth doing — but on its own it does not hide the schema.',
        'When a query names a field that does not exist, graphql-js builds a helpful validation error: <code>Cannot query field "usernam" on type "User". Did you mean "username"?</code> Those "Did you mean" suggestions are computed from the real schema and are returned even when introspection is off.',
        'An attacker feeds a wordlist of likely field names against those errors and reads the suggestions back. Real field names, argument names, and nested type shapes fall out one request at a time. The open-source tool <em>clairvoyance</em> (Nikita Stupin / Escape) automates exactly this and reconstructs a large fraction of a schema with introspection fully disabled.',
        'So "introspection off" raises the effort a little; it does not make the schema private. Treat it as one thin layer, not the control.',
      ],
    },
    {
      heading: 'What actually reduces schema disclosure',
      points: [
        'Turn off field suggestions too. graphql-armor’s <code>blockFieldSuggestions</code> plugin strips the "Did you mean" text from validation errors; Apollo Server v4+ has <code>hideSchemaDetailsFromClientErrors: true</code> for the same effect. This closes the clairvoyance-style leak.',
        'Move to an operation allowlist (persisted queries): the server only executes a fixed set of hashed, pre-registered operations and rejects everything else before validation runs. An attacker cannot probe field names that will never be executed.',
        'Neither of these is really about secrecy as a security boundary — a determined attacker with a client app can still learn your schema. They raise the cost of automated, blind enumeration, which is the realistic threat.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The suggestion leak, modelled',
      language: 'typescript',
      code: `// Introspection is OFF. A bad field name still comes back with a suggestion
// built from the real schema.
const schema: Record<string, string[]> = {
  User: ['id', 'name', 'email', 'username', 'lastLoginAt'],
};

function validateField(typeName: string, fieldName: string): string {
  const fields = schema[typeName];
  if (fields.includes(fieldName)) return 'ok';
  // graphql-js suggests names that are lexically close to what was asked
  const close = fields.filter(f =>
    f.toLowerCase().startsWith(fieldName.toLowerCase().slice(0, 3)) ||
    editDistance(f, fieldName) <= 2);
  const hint = close.length
    ? ' Did you mean ' + close.map(c => '"' + c + '"').join(' or ') + '?'
    : '';
  return 'Cannot query field "' + fieldName + '" on type "' + typeName + '".' + hint;
}

function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}`,
    },
    {
      label: 'Enumerating with a wordlist',
      language: 'typescript',
      code: `// The attacker never calls __schema. They just probe.
console.log(validateField('User', 'usernam'));
// Cannot query field "usernam" on type "User". Did you mean "username"?

console.log(validateField('User', 'nam'));
// Cannot query field "nam" on type "User". Did you mean "name"?

console.log(validateField('User', 'lastLogin'));
// Cannot query field "lastLogin" on type "User". Did you mean "lastLoginAt"?

console.log(validateField('User', 'zzz'));
// Cannot query field "zzz" on type "User".          <- no close match, nothing leaked THIS round

// Run a few hundred common names -> every real field surfaces.
// That loop is what clairvoyance ships.

// With graphql-armor's blockFieldSuggestions (or Apollo's
// hideSchemaDetailsFromClientErrors), the error becomes just:
// Cannot query field "usernam" on type "User".
// -- and the enumeration stalls.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Your GraphQL API runs with <code>introspection: false</code> in production. A penetration tester sends <code>{ user(id: "1") { xyz } }</code> and the response contains <code>Cannot query field "xyz" on type "User". Did you mean "name" or "email"?</code>. What have they learned, and what two changes would actually shut this down?',
    hint: 'Introspection being off did not stop the error message from naming real fields.',
    solution: `They have learned two real, previously-unknown field names on the User type -- "name" and "email" -- without ever touching __schema. Repeating this with a wordlist recovers most of the type, including argument names and nested object fields, which is precisely what the clairvoyance tool automates.

Two changes that actually shut it down:
1. Disable field suggestions. graphql-armor's blockFieldSuggestions plugin, or Apollo Server v4+ hideSchemaDetailsFromClientErrors: true, removes the "Did you mean" text so the error is just "Cannot query field xyz on type User." -- no names leaked.
2. Add an operation allowlist / persisted queries. The server only runs pre-registered hashed operations and rejects anything else before validation, so a probe for an unknown field never reaches the code that would generate a suggestion.

Turning introspection off is still worth keeping as one thin layer, but by itself it does not make the schema private.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"With introspection disabled, my schema is private."',
      reality: 'It is not. Validation error messages still name real fields via "Did you mean" suggestions, computed from the live schema. An attacker rebuilds the schema incrementally from those messages — no <code>__schema</code> query needed.',
    },
    {
      thought: '"An attacker needs introspection to map my API."',
      reality: 'A wordlist of likely field names run against suggestion-enabled errors reconstructs most types. The <em>clairvoyance</em> tool does this automatically against APIs with introspection fully off.',
    },
    {
      thought: '"This is a niche, theoretical concern."',
      reality: 'Field-suggestion disclosure is a documented, tooled attack. graphql-armor and Apollo Server both ship a dedicated option to suppress it precisely because "introspection off" is not enough on its own.',
    },
  ];

  topicLabel = 'Type System Deep Dive';
  topicRoute = '/graphql/type-system';
  prev: SubtopicLink | null = {
    label: 'Unwrapping Introspection Types: Following ofType',
    route: '/graphql/type-system/unwrapping-oftype',
  };
  next: SubtopicLink | null = null;
}
