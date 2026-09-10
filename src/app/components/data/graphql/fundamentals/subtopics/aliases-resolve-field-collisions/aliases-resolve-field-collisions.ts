import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-aliases-resolve-field-collisions',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './aliases-resolve-field-collisions.html',
  styleUrl: './aliases-resolve-field-collisions.scss',
})
export class AliasesResolveFieldCollisionsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The main page names aliases in one line',
      points: [
        'The "Operations and Selection Sets" section says: "Aliases allow requesting the same field twice with different arguments." It gives the syntax and moves on — no code, no explanation of what breaks without them.',
        'A GraphQL response object is keyed by field (or alias) name. If you select <code>users(status: ACTIVE)</code> and <code>users(status: INACTIVE)</code> in the same operation with no aliases, both want to write to a key literally called <code>users</code>. The two selections collide.',
        'In practice the server rejects this at validation with a "fields conflict" error — you cannot select the same field name twice with different arguments and no alias. An alias renames each selection\'s output key (<code>active: users(...)</code>, <code>inactive: users(...)</code>), so each result lands in its own slot.',
        'Aliases are purely a client-side, response-shaping tool. They never touch the schema, never reach a resolver as anything other than the real field name, and cost nothing at execution.',
      ],
    },
    {
      heading: 'Where you actually reach for an alias',
      points: [
        'Same field, different arguments, one round trip: a dashboard that needs both this month\'s and last month\'s revenue calls <code>thisMonth: revenue(period: CURRENT)</code> and <code>lastMonth: revenue(period: PREVIOUS)</code>.',
        'Fetching one entity multiple ways: <code>me: user(id: $myId)</code> alongside <code>author: user(id: $authorId)</code> in a single query.',
        'Reshaping a field name the client dislikes: <code>displayName: name</code> if the client code expects <code>displayName</code>. No arguments involved — just a rename in the response.',
        'Merging incompatible fragments: two fragments on the same type that each select <code>node { ... }</code> with different arguments can only coexist if at least one is aliased.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The collision, and the alias that fixes it',
      language: 'typescript',
      code: `// A response object is keyed by field name. Two selections of the same
// field with no alias both target the same key.
function resolveNoAlias(query: { name: string; args: any }[], resolver: (n: string, a: any) => any) {
  const out: Record<string, any> = {};
  for (const f of query) out[f.name] = resolver(f.name, f.args);  // second write wins
  return out;
}
function resolveWithAlias(query: { name: string; alias?: string; args: any }[], resolver: (n: string, a: any) => any) {
  const out: Record<string, any> = {};
  for (const f of query) out[f.alias ?? f.name] = resolver(f.name, f.args);
  return out;
}

const users = (_name: string, args: { status: string }) =>
  args.status === 'ACTIVE' ? [{ id: 1 }, { id: 2 }] : [{ id: 9 }];

// {
//   users(status: ACTIVE) { id }
//   users(status: INACTIVE) { id }
// }
console.log(JSON.stringify(resolveNoAlias([
  { name: 'users', args: { status: 'ACTIVE' } },
  { name: 'users', args: { status: 'INACTIVE' } },
], users)));
// {"users":[{"id":9}]}   <- the ACTIVE result is gone; INACTIVE overwrote it
// (a real server rejects this at validation as a field conflict)

// {
//   active: users(status: ACTIVE) { id }
//   inactive: users(status: INACTIVE) { id }
// }
console.log(JSON.stringify(resolveWithAlias([
  { name: 'users', alias: 'active',   args: { status: 'ACTIVE' } },
  { name: 'users', alias: 'inactive', args: { status: 'INACTIVE' } },
], users)));
// {"active":[{"id":1},{"id":2}],"inactive":[{"id":9}]}   <- both preserved`,
    },
    {
      label: 'Alias vs. argument vs. fragment — three different tools',
      language: 'typescript',
      code: `// ALIAS: rename the output key. Does not change what is fetched.
//   query { screenName: name }
//   -> { "data": { "screenName": "Alice" } }

// ARGUMENT: change what is fetched. Does not change the output key.
//   query { user(id: "1") { name } }
//   -> { "data": { "user": { "name": "Alice" } } }

// FRAGMENT: reuse a selection set. Does not change keys or arguments.
//   fragment UserCore on User { id name email }
//   query { a: user(id: "1") { ...UserCore }
//           b: user(id: "2") { ...UserCore } }
//   -> { "data": { "a": {...}, "b": {...} } }

// The three compose: aliases let the two user(...) calls above coexist,
// arguments make them fetch different rows, the fragment keeps the
// selection set from being written out twice.

// Only aliases can rescue a same-field-different-args conflict. A server
// query planner does NOT auto-disambiguate; it errors unless YOU alias.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A client sends <code>{ post(id: "1") { title } post(id: "2") { title } }</code> and gets a validation error about conflicting fields. A teammate suggests wrapping each in its own separate query document and firing two HTTP requests. What does an alias buy over that?',
    hint: 'Count the round trips, and think about what GraphQL\'s single-request model is for.',
    solution: `Two documents means two HTTP round trips -- exactly the under-fetching problem GraphQL exists to eliminate. Aliasing keeps it one request: { first: post(id: "1") { title } second: post(id: "2") { title } } returns { "first": {...}, "second": {...} } in a single response.

The validation error is not telling you the query is impossible; it is telling you the response shape is ambiguous. An alias resolves the ambiguity by giving each selection its own key, and the whole thing still executes in one pass.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Aliases are a server feature — the resolver sees the alias and behaves differently."',
      reality: 'The resolver only ever sees the real field name and its arguments. An alias renames the key in the response the executor builds; it is invisible to schema and resolvers. Nothing about execution changes.',
    },
    {
      thought: '"If I select the same field twice with different arguments, GraphQL will just figure out how to return both."',
      reality: 'It will not. The server rejects the operation as a field conflict at validation. You must give at least one of the two selections an alias so each result has a distinct output key.',
    },
    {
      thought: '"An alias and a fragment do the same job — reducing repetition."',
      reality: 'A fragment reuses a <em>selection set</em> (the list of sub-fields). An alias renames a single field\'s <em>output key</em> so two otherwise-colliding selections can coexist. They solve different problems and are often used together.',
    },
  ];

  topicLabel = 'GraphQL Fundamentals';
  topicRoute = '/graphql/fundamentals';
  prev: SubtopicLink | null = {
    label: 'Non-Null Field Errors Bubble Up',
    route: '/graphql/fundamentals/non-null-error-propagation',
  };
  next: SubtopicLink | null = null;
}
