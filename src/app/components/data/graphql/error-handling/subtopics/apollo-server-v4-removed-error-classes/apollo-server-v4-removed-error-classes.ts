import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-apollo-server-v4-removed-error-classes',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './apollo-server-v4-removed-error-classes.html',
  styleUrl: './apollo-server-v4-removed-error-classes.scss',
})
export class ApolloServerV4RemovedErrorClassesSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What actually shipped in Apollo Server 4',
      points: [
        'The main page\'s own Quick Reference listed <code>ApolloError</code>, <code>AuthenticationError</code>, <code>ForbiddenError</code>, and <code>UserInputError</code> as if they were still importable. They are not — Apollo Server 4 (released September 2022) removed all four, along with the <code>toApolloError</code> helper.',
        'This was not a deprecation with a grace period. The <code>@apollo/server</code> package that Apollo Server 4 ships as simply never exports those names. Code that did <code>import { AuthenticationError } from \'apollo-server-errors\'</code> under v3 has nothing equivalent to import under v4.',
        'The replacement is not a new class hierarchy — it is "throw <code>GraphQLError</code> from the <code>graphql</code> package directly, and put a <code>code</code> string in <code>extensions</code> yourself." There is no shorthand for "this is a 401-equivalent" anymore; you write the extensions object by hand every time.',
      ],
    },
    {
      heading: 'Why this matters for a v3-to-v4 migration',
      points: [
        'A codebase upgrading from <code>apollo-server</code> (v3) to <code>@apollo/server</code> (v4) that still imports these classes fails at BUILD time (TypeScript: the module has no exported member) or at RUNTIME if the import is untyped — not a subtle behavioral change, a hard stop.',
        'Because the four classes each hardcoded a specific <code>extensions.code</code> value (<code>UNAUTHENTICATED</code>, <code>FORBIDDEN</code>, <code>BAD_USER_INPUT</code>, and <code>ApolloError</code>\'s caller-supplied code), migrating means finding every call site and rewriting it to a <code>new GraphQLError(message, { extensions: { code: \'...\' } })</code> call with that same string typed out explicitly.',
        'A team that wants the old convenience back can still write their own tiny wrapper functions (<code>unauthenticated(msg)</code>, <code>forbidden(msg)</code>) that do exactly what the removed classes did — Apollo just does not ship one anymore.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Apollo Server 3 (no longer works on v4)',
      language: 'typescript',
      code: `import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-errors';

const resolvers = {
  Query: {
    post: async (_, { id }, { user, db }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      const post = await db.posts.findById(id);
      if (!post) throw new UserInputError(\`Post \${id} not found\`);

      if (!user.canRead(post)) throw new ForbiddenError('Access denied');

      return post;
    }
  }
};

// Under Apollo Server 4's @apollo/server package, this import
// statement itself fails -- there is no "apollo-server-errors"
// export with these names anymore.`,
    },
    {
      label: 'Apollo Server 4 (the only supported form)',
      language: 'typescript',
      code: `import { GraphQLError } from 'graphql';

const resolvers = {
  Query: {
    post: async (_, { id }, { user, db }) => {
      if (!user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const post = await db.posts.findById(id);
      if (!post) {
        throw new GraphQLError(\`Post \${id} not found\`, {
          // NOT_FOUND, not BAD_USER_INPUT -- UserInputError's hardcoded
          // code doesn't fit "the id was fine, the row just isn't there"
          extensions: { code: 'NOT_FOUND', id },
        });
      }

      if (!user.canRead(post)) {
        throw new GraphQLError('Access denied', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      return post;
    }
  }
};`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes writing a small local helper — <code>function unauthorized(msg: string) { return new GraphQLError(msg, { extensions: { code: \'UNAUTHENTICATED\' } }); }</code> — to replace the removed <code>AuthenticationError</code> class across the codebase. Is this a reasonable fix, or does it reintroduce the exact problem Apollo removed the class to solve?',
    hint: 'What did the removed classes actually DO under the hood, once you strip away the class name?',
    solution: `Reasonable, and it does not reintroduce anything Apollo was trying to avoid. AuthenticationError never did anything magical -- it was always just a thin wrapper that called the equivalent of new GraphQLError(msg, { extensions: { code: 'UNAUTHENTICATED' } }) internally. Apollo did not remove it because the convenience was dangerous; they removed the whole family of Apollo-specific error subclasses because Apollo Server 4 stopped shipping its own error-class hierarchy at all, standardizing everything on the plain GraphQLError from the graphql package (which every GraphQL server implementation already depends on, Apollo or not).

A local helper function that wraps new GraphQLError(...) is exactly the "roll your own thin wrapper" pattern the main page's theory already recommends, and it is functionally identical to what AuthenticationError used to do -- just without importing a class from an Apollo-specific package that no longer exports it. The only real difference: a function isn't checkable with instanceof the way a class was, so any code that did if (err instanceof AuthenticationError) would need to switch to checking err.extensions?.code === 'UNAUTHENTICATED' instead -- which is what a resolver-side check should have been doing anyway, since that's the value that actually reaches the client.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"AuthenticationError, ForbiddenError, and UserInputError were deprecated but still work in Apollo Server 4."',
      reality: 'They were removed, not deprecated. Apollo Server 4\'s <code>@apollo/server</code> package does not export them at all — importing them fails outright, it does not just print a deprecation warning.',
    },
    {
      thought: '"ApolloError was renamed to GraphQLError in v4."',
      reality: 'They are not the same class under a new name. <code>GraphQLError</code> comes from the <code>graphql</code> package itself and predates Apollo Server entirely — Apollo Server 4 simply stopped adding its own error subclass on top of it.',
    },
    {
      thought: '"Since the classes are gone, extensions.code categorization is gone too."',
      reality: 'The convention survives — only the shorthand classes that pre-filled a specific code value were removed. You still put a semantic string in <code>extensions.code</code>; you just write <code>{ code: \'UNAUTHENTICATED\' }</code> by hand instead of getting it for free from a class name.',
    },
  ];

  topicLabel = 'Mutation Error Handling';
  topicRoute = '/graphql/error-handling';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'The Payload UserErrors Pattern, Built Out',
    route: '/graphql/error-handling/payload-user-errors-pattern',
  };
}
