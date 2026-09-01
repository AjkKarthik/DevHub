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
    heading: '"Centralized but Requires a Custom Directive Implementation" — What That Looks Like',
    points: [
      'The main page’s own QnA on authorization names schema-level directives in one line: "<code>@auth(requires: ADMIN)</code> on field or type definitions. Centralized but requires a custom directive implementation." No codeTab on the page shows what that custom directive implementation actually does, or contrasts it against the resolver-level checks the SAME QnA also names.',
      'A real GraphQL schema directive needs a full GraphQL execution engine (schema transformation, directive visitors) to implement properly — genuinely more machinery than fits in an illustrative code sample. This subtopic instead builds the EQUIVALENT effect using a plain higher-order function: <code>withAuth(requiredRole, resolver)</code> wraps any resolver with the identical authorization check a directive would apply, without needing the full schema-transformation machinery.',
      'The main page’s own resolver-level approach (checking permissions inline inside each resolver body) and this wrapper achieve the SAME security outcome through different mechanics: resolver-level checks are written by hand, once per resolver, mixed into that resolver’s own logic; the wrapper (or a real directive) centralizes the check into ONE reusable function applied declaratively to whichever resolvers need it.',
      'The main page’s own "What to avoid" guidance applies identically to both approaches: never rely on simply OMITTING a field from a role’s visible schema as the actual security boundary — the authorization check itself has to run inside the resolver (or the wrapper/directive protecting it), not merely be implied by what a client’s tooling happens to show them.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'withAuth() Wrapper vs. Inline Checks',
    language: 'typescript',
    code: `interface Context {
  user?: { id: string; role: string };
}

type Resolver<TArgs, TResult> = (parent: unknown, args: TArgs, ctx: Context) => TResult;

// Achieves the same centralizing effect as a real @auth(requires: ROLE)
// schema directive, without needing a full directive implementation.
function withAuth<TArgs, TResult>(
  requiredRole: string,
  resolver: Resolver<TArgs, TResult>
): Resolver<TArgs, TResult> {
  return (parent, args, ctx) => {
    if (!ctx.user) {
      throw new Error('UNAUTHENTICATED');
    }
    if (ctx.user.role !== requiredRole) {
      throw new Error('FORBIDDEN');
    }
    return resolver(parent, args, ctx);
  };
}

// The resolver's OWN logic stays completely free of auth concerns --
// exactly the "centralized" benefit the main page's QnA attributes to
// schema directives.
const deleteUserResolver: Resolver<{ id: string }, string> = (_, { id }) =>
  \`deleted-\${id}\`;

const guardedDeleteUser = withAuth('ADMIN', deleteUserResolver);

function run<TArgs, TResult>(resolver: Resolver<TArgs, TResult>, args: TArgs, ctx: Context) {
  try {
    return { ok: true, result: resolver(null, args, ctx) };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

console.log(run(guardedDeleteUser, { id: '42' }, { user: { id: 'u1', role: 'ADMIN' } }));
// { ok: true, result: 'deleted-42' }

console.log(run(guardedDeleteUser, { id: '42' }, { user: { id: 'u2', role: 'USER' } }));
// { ok: false, error: 'FORBIDDEN' }

console.log(run(guardedDeleteUser, { id: '42' }, {}));
// { ok: false, error: 'UNAUTHENTICATED' }

// Contrast: the SAME check written inline, resolver-level style --
// works identically, but the auth logic is now mixed into every
// resolver that needs it, instead of applied once, declaratively.
const deleteUserInline: Resolver<{ id: string }, string> = (_, { id }, ctx) => {
  if (!ctx.user) throw new Error('UNAUTHENTICATED');
  if (ctx.user.role !== 'ADMIN') throw new Error('FORBIDDEN');
  return \`deleted-\${id}\`;
};`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate suggests skipping <code>withAuth()</code> entirely and instead just NOT exposing the <code>deleteUser</code> mutation in the schema returned to non-admin clients (filtering it out of the introspection response based on the requester’s role). Would this be a safe alternative to the resolver/wrapper-level check?',
  hint: 'Introspection controls what a client’s TOOLING shows them as available operations. Does a GraphQL server actually validate that an incoming request only uses operations that were "shown" to that specific client, or does it just execute whatever valid query text arrives?',
  solution: `// This would NOT be a safe alternative -- it's exactly the mistake
// the main page's own QnA explicitly warns against: "do not rely on
// hiding fields from the schema for authorization (clients can still
// guess field names)."

// Filtering what introspection SHOWS a client only affects what their
// IDE/tooling displays as autocomplete suggestions. It does nothing to
// stop a client (or an attacker who already knows or guesses the
// mutation's name) from simply sending a raw GraphQL request string
// containing "mutation { deleteUser(id: \\"42\\") }" directly to the
// /graphql endpoint -- the server will parse and attempt to execute
// ANY syntactically valid query against the full schema, completely
// independent of what introspection happened to reveal to that client
// earlier.

// The ONLY thing that actually stops the mutation from running for a
// non-admin user is a REAL check that executes at request time --
// exactly what withAuth() (or a real @auth directive, or an inline
// resolver check) provides. Hiding something from a menu is not the
// same as making it inaccessible.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A schema-level <code>@auth</code> directive and a resolver-level inline check achieve fundamentally different levels of security — the directive is inherently "more secure."',
    reality: 'The codeTab above demonstrates both approaches producing IDENTICAL security outcomes (the same UNAUTHENTICATED/FORBIDDEN/success results) for the same inputs — the difference is purely about WHERE the check is written and how many times its logic gets duplicated, not about how secure the end result is. A directive-style wrapper and a correctly-written inline check enforce the exact same boundary.',
  },
  {
    thought: 'Once <code>withAuth()</code> (or a real directive) is applied to a resolver, the resolver’s own body no longer needs to worry about authorization at all, for anything.',
    reality: '<code>withAuth()</code> only ever checks ONE thing: does the current user have the required ROLE. It says nothing about resource-level ownership checks a resolver might still need — e.g. a hypothetical <code>updateOwnProfile</code> resolver still needs its OWN logic to verify the target profile actually belongs to the requesting user, even after a role-level <code>withAuth(\'USER\')</code> check has already passed.',
  },
  {
    thought: 'Restricting what a role can see via introspection filtering is a reasonable FIRST layer of defense, even if it isn’t sufficient on its own.',
    reality: 'The Try It above demonstrates it provides essentially ZERO defense on its own — a request doesn’t need to have been "discovered" through introspection to be executed; the server parses and attempts to run any syntactically valid GraphQL text sent to the endpoint. Introspection filtering is purely a tooling/UX concern (what shows up in autocomplete), not a meaningful security layer at all.',
  },
];

@Component({
  selector: 'app-api-graphql-directive-auth',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-directive-style-auth-wrapper.html',
  styleUrl: './a-directive-style-auth-wrapper.scss',
})
export class ADirectiveStyleAuthWrapperSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
