import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-apollo-server-introspection-nodeenv',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './introspection-still-nodeenv-gated.html',
  styleUrl: './introspection-still-nodeenv-gated.scss'
})
export class IntrospectionStillNodeenvGatedSubtopic {
  topicLabel = 'Apollo Server';
  topicRoute = '/graphql/apollo-server';

  theory: TheoryPoint[] = [
    {
      heading: 'The real default, verified against Apollo\'s own docs',
      points: [
        'Apollo Server\'s `introspection` constructor option defaults to `true` UNLESS `NODE_ENV` is set to `\'production\'` — at which point it defaults to `false` instead.',
        'This is NOT something Apollo Server 4 changed from Apollo Server 3. Both major versions share the identical NODE_ENV-based default — the main page\'s own theory bullet listing this as a v3-to-v4 change was simply wrong.',
        'Because the default already disables introspection in production, a team that never sets `NODE_ENV=production` (a surprisingly common oversight — some deploy platforms only set it if you configure it yourself) is running WITH introspection enabled in what they believe is production.',
        'The fix is the same regardless of which version you\'re on: pass `introspection: false` explicitly rather than relying on `NODE_ENV` being set correctly by your deployment platform.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Explicit is safer than implicit',
      language: 'typescript',
      code: `import { ApolloServer } from '@apollo/server';

// Relying on the default means introspection's on/off state
// is only as reliable as whoever configured NODE_ENV for this
// specific deployment -- a silent, easy-to-miss dependency.
const relyingOnDefault = new ApolloServer({ typeDefs, resolvers });

// Explicit: correct regardless of whether NODE_ENV is set,
// misspelled, or absent entirely on this particular host.
const explicit = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
});`
    },
    {
      label: 'Confirming the default with a direct check',
      language: 'typescript',
      code: `// Apollo Server's own constructor resolves this internally --
// there's no public API to read the resolved value back out before
// a request runs, but the practical test is simple: send an
// introspection query and see whether it succeeds.
const INTROSPECTION_QUERY = '{ __schema { queryType { name } } }';

const res = await server.executeOperation({ query: INTROSPECTION_QUERY });

if (res.body.kind === 'single') {
  const blocked = res.body.singleResult.errors?.some(
    e => e.message.includes('introspection')
  );
  console.log(blocked ? 'Introspection is disabled' : 'Introspection is enabled');
}`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team deploys their Apollo Server 4 app to a platform-as-a-service host. They never explicitly set the <code>NODE_ENV</code> environment variable anywhere in their deployment config, assuming "it\'s production, so it\'ll just know." Is introspection enabled or disabled on their live server, and why does this matter?',
    hint: 'The introspection default reads the literal string value of `process.env.NODE_ENV` — it has no way to infer "this is a production deployment" from anything else.',
    solution: 'Introspection is ENABLED. Apollo Server\'s default only checks whether NODE_ENV is literally set to the string \'production\' -- it has no other signal for "this is a live, public deployment." If the hosting platform doesn\'t set NODE_ENV itself and the team never sets it in their own config, process.env.NODE_ENV is undefined, which is not equal to \'production\', so the default resolves to introspection: true. This matters because introspection exposes the entire schema -- every type, field, argument, and deprecation note -- to anyone who sends one query, which is a real information-disclosure risk for a public API. The fix is the same one shown in this subtopic\'s own codeTab: never rely on the implicit NODE_ENV check, pass introspection explicitly based on a condition the team actually controls and can verify (an explicit config flag, not an environment variable someone might forget to set).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Apollo Server 4 made introspection always-on by default, matching this page\'s own theory bullet before the fix.',
      reality: 'Verified directly against Apollo\'s own current documentation: the default is <code>true</code> UNLESS <code>NODE_ENV === \'production\'</code>, exactly matching Apollo Server 3\'s own behavior. Nothing changed between the two major versions on this specific point.'
    },
    {
      thought: 'Setting <code>NODE_ENV=production</code> is a reliable way to guarantee introspection is off.',
      reality: 'It IS reliable as long as it\'s actually set — but that\'s exactly the failure mode this subtopic demonstrates. A missing, misspelled, or platform-dependent <code>NODE_ENV</code> value silently falls back to the enabled default. Passing <code>introspection: false</code> explicitly removes the dependency on getting an environment variable right.'
    },
    {
      thought: 'This NODE_ENV-based default is unique to the `introspection` option.',
      reality: 'It\'s a common pattern across many Node.js libraries (Express\'s own view caching and error-detail verbosity behave similarly), but each library defines its own specific condition and default independently — always check the specific option\'s own documented default rather than assuming a shared convention applies.'
    }
  ];

  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = { label: 'executeOperation’s ‘incremental’ Response Kind, and Why You Probably Won’t See It', route: '/graphql/apollo-server/executeoperation-incremental-response-kind' };
}
