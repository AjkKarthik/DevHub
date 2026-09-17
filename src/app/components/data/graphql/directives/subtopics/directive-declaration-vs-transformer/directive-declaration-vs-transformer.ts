import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-directive-declaration-vs-transformer',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './directive-declaration-vs-transformer.html',
  styleUrl: './directive-declaration-vs-transformer.scss',
})
export class DirectiveDeclarationVsTransformerSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The declaration is just metadata',
      points: [
        'The mistakes block and a quiz question both say it: <code>directive @auth on FIELD_DEFINITION</code> in your SDL does nothing on its own. It adds a name and a set of allowed locations to the schema, and that is all.',
        'The behaviour comes from a <strong>schema transformer</strong> — a function (typically built with <code>mapSchema</code> + <code>getDirective</code> from <code>@graphql-tools</code>) that walks the schema, finds each field carrying <code>@auth</code>, reads its arguments, and replaces the field’s resolver with a wrapped version that runs the check first.',
        'You then have to <em>apply</em> that transformer: <code>schema = authDirectiveTransformer(schema)</code> after <code>makeExecutableSchema</code>. Skip this line and the directive is inert — the guarded field resolves for everyone.',
        'This runs once, at schema build time. It is not re-evaluated per request; it just installs the wrapped resolvers that then run on every query.',
      ],
    },
    {
      heading: 'When you apply more than one, order matters',
      points: [
        'Each transformer wraps whatever resolver it finds — including a wrapper a previous transformer already installed. So transformers compose like nested function calls.',
        'The <strong>last</strong> transformer you apply ends up <strong>outermost</strong>, so its check runs <strong>first</strong>. Apply <code>[authTransformer, rateLimitTransformer]</code> and a request hits the rate-limit check before the auth check; swap the order and auth runs first.',
        'This usually matters for correctness: you generally want authentication/authorization to run before rate limiting (do not spend rate-limit budget on requests you will reject anyway), which means applying the auth transformer <em>last</em>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Declared vs applied',
      language: 'typescript',
      code: `// A tiny stand-in for the field guarded by @auth(requires: ADMIN).
function buildAdminSecretResolver(applyTransformer: boolean) {
  let resolve = (_ctx: { role: string }) => 'TOP SECRET';

  if (applyTransformer) {
    const inner = resolve;
    resolve = (ctx) => {
      if (ctx.role !== 'ADMIN') throw new Error('Requires ADMIN role');
      return inner(ctx);
    };
  }
  return resolve;
}

// Directive DECLARED in SDL but no transformer applied:
const declaredOnly = buildAdminSecretResolver(false);
console.log(declaredOnly({ role: 'anonymous' }));
// 'TOP SECRET'   <- the @auth directive did nothing

// Transformer APPLIED:
const guarded = buildAdminSecretResolver(true);
try { guarded({ role: 'anonymous' }); }
catch (e) { console.log((e as Error).message); }   // 'Requires ADMIN role'
console.log(guarded({ role: 'ADMIN' }));            // 'TOP SECRET'`,
    },
    {
      label: 'Transformer order',
      language: 'typescript',
      code: `// Each transformer wraps the resolver the previous one produced.
function apply(order: string[]) {
  let resolve = (_ctx: unknown) => 'data';
  const ran: string[] = [];
  for (const name of order) {
    const inner = resolve;
    resolve = (ctx) => { ran.push(name); return inner(ctx); };
  }
  resolve({});
  return ran; // the order the checks actually executed
}

console.log(apply(['auth', 'rateLimit']));
// [ 'rateLimit', 'auth' ]   <- rateLimit applied last -> runs first

console.log(apply(['rateLimit', 'auth']));
// [ 'auth', 'rateLimit' ]   <- auth applied last -> runs first
//                              (usually what you want: reject before spending budget)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Your <code>@auth</code> directive "is not working" — <code>adminSecret</code> returns data for anonymous users. The SDL has <code>directive @auth(requires: Role) on FIELD_DEFINITION</code> and <code>adminSecret: String @auth(requires: ADMIN)</code>. The resolver map is correct. What one thing is missing, and where does it go?',
    hint: 'What turns the @auth annotation into an actual resolver wrapper?',
    solution: `A schema transformer for @auth is declared somewhere but never applied to the schema. The SDL line only registers the directive name and its locations -- it installs no behaviour.

The fix is one line, right after building the schema:

  let schema = makeExecutableSchema({ typeDefs, resolvers });
  schema = authDirectiveTransformer(schema);   // <- this was missing

authDirectiveTransformer walks the schema with mapSchema, finds every field with @auth via getDirective, and swaps in a resolver that checks the role before delegating to the original. Without that call, @auth(requires: ADMIN) is just a label the runtime never reads.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Declaring <code>directive @auth on FIELD_DEFINITION</code> and annotating a field with it is enough to enforce auth."',
      reality: 'The declaration only registers the directive’s name and allowed locations. You must write a schema transformer that reads the annotation and wraps the resolver, and then apply it to the schema. Miss the apply step and the field is unguarded.',
    },
    {
      thought: '"The directive transformer runs on every request."',
      reality: 'It runs once, at schema build time. It installs wrapped resolvers; those wrapped resolvers are what run per request. The transformer itself is not re-invoked.',
    },
    {
      thought: '"When I apply two transformers, the order does not matter as long as both are applied."',
      reality: 'They compose like nested wrappers. The last-applied transformer is outermost, so its check runs first. Applying auth last means auth runs before rate limiting — usually the order you want.',
    },
  ];

  topicLabel = 'Directives';
  topicRoute = '/graphql/directives';
  prev: SubtopicLink | null = {
    label: 'Where @deprecated Can Actually Go',
    route: '/graphql/directives/where-deprecated-can-go',
  };
  next: SubtopicLink | null = {
    label: 'FIELD vs FIELD_DEFINITION: Two Different Location Namespaces',
    route: '/graphql/directives/field-vs-field-definition-locations',
  };
}
