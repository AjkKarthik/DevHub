import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-skip-include-run-on-the-server',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './skip-include-run-on-the-server.html',
  styleUrl: './skip-include-run-on-the-server.scss',
})
export class SkipIncludeRunOnTheServerSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'Where the directives actually run',
      points: [
        'The main page previously said "Directives take effect on the client side — the server only receives the final included/excluded selection." That is backwards. @skip and @include are evaluated on the server.',
        'The client sends the query string exactly as written — directives and all — plus the variables JSON. Nothing is stripped before the request goes out.',
        'On the server, during the <em>field collection</em> step (before any resolver is called), the execution engine reads each @skip / @include, plugs in the variable values, and drops the fields that resolve to "not included". Only the surviving fields get resolvers.',
        'So a field behind <code>@include(if: $x)</code> with <code>$x = false</code> is genuinely never executed — its resolver does not run, and no work (DB call, downstream fetch) happens for it. That is a real performance lever, not just response shaping.',
      ],
    },
    {
      heading: 'The combined @skip + @include rule',
      points: [
        'You may put both on one field. The spec defines the outcome precisely: the field is queried <strong>only if @skip is false and @include is true</strong>. Equivalently, it is dropped if @skip is true <em>or</em> @include is false.',
        'So <code>x @skip(if: false) @include(if: true)</code> is the only combination of the four that keeps <code>x</code>. It is well-defined, not "undefined behaviour" — though it is still confusing to read, which is why one directive per field is the norm.',
        'Neither directive has precedence over the other; they are two independent gates and the field must pass both.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Field collection, modelled',
      language: 'typescript',
      code: `type Directive = { name: 'skip' | 'include'; ifVar: string };
type Field = { key: string; directives: Directive[] };

// Mirrors the server's field-collection step: @skip/@include are applied
// here, using the request's variable values, before any resolver runs.
function collectFields(selection: Field[], variables: Record<string, boolean>): string[] {
  const out: string[] = [];
  for (const f of selection) {
    let skip = false;
    let include = true;
    for (const d of f.directives) {
      const cond = !!variables[d.ifVar];
      if (d.name === 'skip') skip = cond;
      if (d.name === 'include') include = cond;
    }
    // spec: keep the field only if skip === false AND include === true
    if (!skip && include) out.push(f.key);
  }
  return out;
}`,
    },
    {
      label: 'What runs, what does not',
      language: 'typescript',
      code: `const selection = [
  { key: 'id',    directives: [] },
  { key: 'name',  directives: [] },
  { key: 'email', directives: [{ name: 'include', ifVar: 'showEmail' }] },
  { key: 'bio',   directives: [{ name: 'skip',    ifVar: 'skipBio' }] },
];

// The client sent the whole query. The server evaluates the directives here.
console.log(collectFields(selection, { showEmail: false, skipBio: true }));
// [ 'id', 'name' ]        <- email + bio resolvers never run

console.log(collectFields(selection, { showEmail: true, skipBio: false }));
// [ 'id', 'name', 'email', 'bio' ]

// Combined on one field: queried iff skip=false AND include=true
const both = [{ key: 'x', directives: [
  { name: 'skip', ifVar: 's' }, { name: 'include', ifVar: 'i' } ] }];
for (const s of [false, true])
  for (const i of [true, false])
    console.log('x @skip(' + s + ') @include(' + i + ') ->',
      collectFields(both as any, { s, i }).length ? 'kept' : 'dropped');
// kept only for @skip(false) @include(true)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer adds <code>ssn @include(if: $isAdmin)</code> to the <code>User</code> type and passes <code>$isAdmin</code> from the front-end, reasoning "non-admins will not request it, so their SSN stays hidden." Is the SSN protected? If not, where does that check belong?',
    hint: 'Who supplies the value of $isAdmin on each request?',
    solution: `The SSN is NOT protected. $isAdmin is a request variable, and the client supplies it. A non-admin simply sends { "isAdmin": true } and the server dutifully includes ssn -- @include only gates response shape, it has no idea whether the caller is actually an admin.

@skip and @include are for the CLIENT to say "I do not need this field right now", not for the server to enforce who may see it. Access control belongs in the resolver (check the authenticated user in context and return null or throw for a non-admin), or in a real schema directive like @auth(requires: ADMIN) whose implementation reads the server-side session -- never in a client-controlled @include condition.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"The client evaluates <code>@skip</code>/<code>@include</code> and only sends the fields that survive."',
      reality: 'The client sends the full query text unchanged. The server applies the directives during field collection, using the request’s variables, before calling any resolver. A skipped field’s resolver genuinely never runs.',
    },
    {
      thought: '"Putting both <code>@skip</code> and <code>@include</code> on one field is undefined behaviour."',
      reality: 'It is spec-defined: the field is kept only if <code>@skip</code> is false <em>and</em> <code>@include</code> is true. It is legal and deterministic — just harder to read than a single directive, which is why one per field is the convention.',
    },
    {
      thought: '"<code>@include(if: $canSee)</code> is a lightweight way to hide sensitive fields from certain users."',
      reality: 'It is not access control. The client controls the variable, so any caller can flip it to <code>true</code> and get the field. Enforce visibility in the resolver or a server-backed schema directive instead.',
    },
  ];

  topicLabel = 'GraphQL Queries';
  topicRoute = '/graphql/queries';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'Field Merging: Two Selections of the Same Field Must Be Compatible',
    route: '/graphql/queries/field-merging-conflicts',
  };
}
