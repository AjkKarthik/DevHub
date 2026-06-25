import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-gql-directives',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './directives.html',
  styleUrl: './directives.scss'
})
export class GqlDirectives {
  quickRef: QuickRefItem[] = [
    { type: 'keyword', name: '@skip(if:)', desc: 'Built-in — omits a field when condition is true' },
    { type: 'keyword', name: '@include(if:)', desc: 'Built-in — includes a field when condition is true' },
    { type: 'keyword', name: '@deprecated(reason:)', desc: 'Built-in schema directive — marks field as deprecated' },
    { type: 'keyword', name: '@specifiedBy(url:)', desc: 'Built-in — links a custom scalar to its specification' },
    { type: 'keyword', name: 'directive @name on LOCATION', desc: 'Declare a custom directive and where it can appear' },
    { type: 'syntax', name: 'FIELD_DEFINITION', desc: 'Directive location — applies to field definitions in schema' },
    { type: 'syntax', name: 'OBJECT', desc: 'Directive location — applies to object type definitions' },
    { type: 'syntax', name: 'ARGUMENT_DEFINITION', desc: 'Directive location — applies to argument definitions' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What Are Directives?',
      points: [
        'Directives annotate schema definitions or query fields with metadata that changes behavior.',
        'Two categories: execution directives (affect query execution — @skip, @include) and type system directives (@deprecated, custom auth directives).',
        'Directives start with `@` and can accept arguments: `@deprecated(reason: "Use newField instead")`.',
        'A directive declares which "locations" it can appear: FIELD, FRAGMENT_SPREAD, INLINE_FRAGMENT, FIELD_DEFINITION, OBJECT, etc.'
      ]
    },
    {
      heading: '@skip and @include',
      points: [
        '@skip(if: Boolean) and @include(if: Boolean) are the only two built-in execution directives.',
        '@skip(if: true) removes the field. @skip(if: false) keeps it. @include is the logical inverse.',
        'Both accept variable references: `@skip(if: $skipDetails)` — the variable must be Boolean.',
        'They apply to fields, fragment spreads, and inline fragments. They do not apply to operations or variables.'
      ]
    },
    {
      heading: 'Custom Schema Directives',
      points: [
        'Custom directives are declared in SDL with `directive @name(args) on LOCATIONS`.',
        'A directive transformer (schema transformer function) intercepts field resolution and adds behavior.',
        'Common use cases: auth (`@auth(requires: ADMIN)`), caching (`@cacheControl(maxAge: 300)`), rate limiting, input validation.',
        'Apollo Server v4 uses SchemaTransformer / mapSchema API. graphql-tools provides makeDirectiveTransformer.'
      ]
    },
    {
      heading: '@deprecated',
      points: [
        '@deprecated marks a field or enum value as deprecated without removing it from the schema.',
        'Clients see the deprecation in introspection and tools like GraphiQL display a warning.',
        'The `reason` argument is optional but strongly recommended: `@deprecated(reason: "Use \'newField\' instead")`.',
        'Deprecated fields still resolve normally — no runtime change, just a documentation signal.'
      ]
    },
    {
      heading: 'Directive Locations',
      points: [
        'Query directives apply at: FIELD, FRAGMENT_SPREAD, INLINE_FRAGMENT, QUERY, MUTATION, SUBSCRIPTION, VARIABLE_DEFINITION.',
        'Schema directives apply at: SCHEMA, SCALAR, OBJECT, FIELD_DEFINITION, ARGUMENT_DEFINITION, INTERFACE, UNION, ENUM, ENUM_VALUE, INPUT_OBJECT, INPUT_FIELD_DEFINITION.',
        'A directive can appear at multiple locations: `directive @auth on FIELD_DEFINITION | OBJECT`.',
        'Type system directive transformers run at schema build time, not at query execution time.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Built-in',
      language: 'typescript',
      code: `# @skip and @include with variables
query GetProfile($id: ID!, $showPrivate: Boolean!, $skipAvatar: Boolean!) {
  user(id: $id) {
    name
    email @include(if: $showPrivate)
    phone @include(if: $showPrivate)
    avatar @skip(if: $skipAvatar)
  }
}

# @deprecated in schema
type User {
  id: ID!
  username: String @deprecated(reason: "Use 'handle' field instead")
  handle: String!
  email: String!
}

# Query still works — deprecated field resolves normally
query { user(id: "1") { username handle } }`
    },
    {
      label: 'Custom @auth',
      language: 'typescript',
      code: `import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver } from 'graphql';

// 1. Declare directive in SDL
const typeDefs = \`
  directive @auth(requires: Role = USER) on FIELD_DEFINITION | OBJECT

  enum Role { ADMIN EDITOR USER }

  type Query {
    publicData: String
    adminSecret: String @auth(requires: ADMIN)
  }
\`;

// 2. Implement transformer
function authDirectiveTransformer(schema: any) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0];
      if (!authDirective) return fieldConfig;

      const { requires } = authDirective;
      const { resolve = defaultFieldResolver } = fieldConfig;

      return {
        ...fieldConfig,
        async resolve(source, args, context, info) {
          const userRole = context.user?.role;
          if (!hasRole(userRole, requires)) {
            throw new Error(\`Requires \${requires} role\`);
          }
          return resolve(source, args, context, info);
        }
      };
    }
  });
}

// 3. Apply transformer
let schema = makeExecutableSchema({ typeDefs, resolvers });
schema = authDirectiveTransformer(schema);`
    },
    {
      label: 'Custom @cacheControl',
      language: 'typescript',
      code: `// Cache-control directive example
const typeDefs = \`
  enum CacheScope { PUBLIC PRIVATE }

  directive @cacheControl(
    maxAge: Int
    scope: CacheScope
  ) on FIELD_DEFINITION | OBJECT

  type Query {
    publicPosts: [Post] @cacheControl(maxAge: 60, scope: PUBLIC)
    myProfile: User @cacheControl(maxAge: 0, scope: PRIVATE)
  }
\`;

// Apollo Server has built-in cache-control directive support
// It adds Cache-Control headers based on field directives:
// Cache-Control: max-age=60, public`
    }
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using @skip and @include on the same field',
      wrong: `name @skip(if: $s) @include(if: $i)  # confusing — which wins?`,
      right: `name @skip(if: $skipName)  # use one directive per field`,
      explanation: 'Both evaluate independently: field is included only when skip=false AND include=true. Using both on one field is legal but confusing — pick one.'
    },
    {
      title: 'Applying directive to wrong location',
      wrong: `directive @auth on QUERY  # QUERY location doesn't include field resolution`,
      right: `directive @auth on FIELD_DEFINITION | OBJECT`,
      explanation: 'Directives must be declared at the correct location. @auth on QUERY only applies to the operation, not to individual field definitions in the schema.'
    },
    {
      title: 'Forgetting to apply the directive transformer',
      wrong: `const schema = makeExecutableSchema({ typeDefs, resolvers });
// @auth declared but transformer never applied — has no effect`,
      right: `let schema = makeExecutableSchema({ typeDefs, resolvers });
schema = authDirectiveTransformer(schema);`,
      explanation: 'Declaring a custom directive in SDL does nothing on its own. You must implement and apply a schema transformer to add the runtime behavior.'
    },
    {
      title: 'Removing @deprecated fields immediately',
      wrong: `# Removed 'username' field on day 1 of deprecation — breaks existing clients`,
      right: `# Keep deprecated field for a migration window
username: String @deprecated(reason: "Use 'handle' instead")`,
      explanation: '@deprecated is a signal to clients, not a removal. Keep deprecated fields resolving for a migration period before deleting them.'
    },
    {
      title: 'Passing String instead of Boolean to @skip/@include',
      wrong: `avatar @skip(if: "true")  # "true" is a String, not Boolean`,
      right: `avatar @skip(if: $skipAvatar)  # variable: Boolean!`,
      explanation: '@skip and @include require a Boolean argument. String literals cause a type validation error at the query validation stage.'
    }
  ];

  challenge: Challenge = {
    title: 'Implement a @rateLimit Directive',
    language: 'typescript',
    description: 'Declare a custom `@rateLimit(max: Int!, window: String!)` directive that applies to FIELD_DEFINITION. Write a schema transformer that wraps the resolver to check a hypothetical `rateLimiter.check(context.ip, max, window)` function. If the check fails, throw an error with message "Rate limit exceeded".',
    hints: [
      'Use mapSchema with MapperKind.OBJECT_FIELD',
      'Use getDirective to retrieve @rateLimit config from fieldConfig',
      'Wrap the original resolver — check first, then call original',
      'Access context.ip for the client identifier'
    ],
    starterCode: `import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver } from 'graphql';

// Declare the directive in SDL
const directiveTypeDef = \`
  directive @rateLimit(max: Int!, window: String!) on FIELD_DEFINITION
\`;

// Implement the transformer
function rateLimitTransformer(schema: any) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      // TODO: get directive, wrap resolver
    }
  });
}`,
    solution: `import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver } from 'graphql';

function rateLimitTransformer(schema: any) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const directive = getDirective(schema, fieldConfig, 'rateLimit')?.[0];
      if (!directive) return fieldConfig;

      const { max, window } = directive;
      const { resolve = defaultFieldResolver } = fieldConfig;

      return {
        ...fieldConfig,
        async resolve(source, args, context, info) {
          const allowed = await context.rateLimiter.check(context.ip, max, window);
          if (!allowed) throw new Error('Rate limit exceeded');
          return resolve(source, args, context, info);
        }
      };
    }
  });
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What argument does @skip accept?', options: ['Boolean', 'String', 'Int', 'ID'], answer: 0, explanation: '@skip(if: Boolean) removes the field when the condition is true. The argument must be a Boolean, not a String.' },
    { q: 'What does @deprecated do at runtime?', options: ['Throws an error when the field is queried', 'Removes the field from the schema', 'Has no runtime effect — it is a documentation signal', 'Returns null for deprecated fields'], answer: 2, explanation: '@deprecated is a type system directive. It marks the field in introspection but does not change how the field resolves at runtime.' },
    { q: 'What is required after declaring a custom schema directive?', options: ['Nothing — declaration is enough', 'A schema transformer to implement the behavior', 'A resolver named after the directive', 'An HTTP middleware'], answer: 1, explanation: 'Declaring `directive @auth on FIELD_DEFINITION` in SDL does nothing alone. A schema transformer using mapSchema/getDirective must be applied to wrap resolvers with the actual behavior.' },
    { q: 'Which location allows a directive on a field in the schema?', options: ['FIELD', 'FIELD_DEFINITION', 'OBJECT_FIELD', 'ARGUMENT'], answer: 1, explanation: 'FIELD is a query document location (for selecting fields in queries). FIELD_DEFINITION is the schema location for field declarations in type definitions.' },
    { q: 'Can a directive appear at multiple locations?', options: ['No, only one', 'Yes, separated by |', 'Yes, separated by &', 'Yes, by listing the directive twice'], answer: 1, explanation: 'A directive can target multiple locations: `directive @auth on FIELD_DEFINITION | OBJECT`. The | operator separates location names.' },
    { q: 'What happens when @skip(if: false) is applied to a field?', options: ['The field is skipped', 'The field is included', 'An error is thrown', 'The field returns null'], answer: 1, explanation: '@skip skips when the condition is true and includes when it is false. So @skip(if: false) keeps the field in the response.' }
  ];

  qna: QnaItem[] = [
    { q: 'Can I use directives in variables?', a: 'Query directives can appear on VARIABLE_DEFINITION location (e.g., for @stream or custom deprecation). Most common directives appear on fields, fragment spreads, or inline fragments though.' },
    { q: 'What is the difference between @skip and @include?', a: '@skip(if: true) removes the field. @include(if: true) includes it. They are logical inverses. Using both on the same field is valid: the field is included only when skip=false AND include=true.' },
    { q: 'How do I create a directive that validates input?', a: 'Declare the directive on ARGUMENT_DEFINITION or INPUT_FIELD_DEFINITION. In the transformer, wrap the resolver to validate argument values before calling the original resolver. Throw a UserInputError for invalid values.' },
    { q: 'Are directives supported by all GraphQL clients?', a: '@skip and @include are part of the spec — all compliant clients support them. Custom schema directives are server-side and transparent to clients. Custom client directives (like Apollo\'s @client) are client-specific features.' },
    { q: 'What is @specifiedBy?', a: '@specifiedBy(url: String!) is a built-in schema directive for custom scalars. It links the scalar to its specification URL, improving documentation and tooling support.' },
    { q: 'Can a directive call another directive?', a: 'No — directives are independent annotations. A directive transformer wraps resolvers procedurally; you can combine transformers by applying them in sequence, but directives do not directly reference each other.' }
  ];

  revision: RevisionSummary = {
    oneLiner: 'Directives annotate schema definitions or query fields — built-ins handle conditional fields, custom directives add cross-cutting concerns like auth and caching.',
    mustKnow: [
      '@skip(if: Boolean) — removes field when true',
      '@include(if: Boolean) — includes field when true',
      '@deprecated marks fields in introspection but has no runtime effect',
      'Custom directives need a schema transformer to implement runtime behavior',
      'Directive locations distinguish query-time (FIELD) from schema-time (FIELD_DEFINITION)',
      'A directive can target multiple locations separated by |'
    ],
    interviewFocus: [
      'What is the difference between @skip and @include?',
      'How do you implement a custom @auth directive in Apollo Server?',
      'What does @deprecated do at runtime?'
    ]
  };
}
