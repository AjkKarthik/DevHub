import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-local-verify-states',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './local-verify-states.html',
  styleUrl: './local-verify-states.scss'
})
export class LocalVerifyStatesSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "From pact-core typings and a real run",
      "points": [
        "The verifier options type in <code>@pact-foundation/pact-core</code> has <code>pactUrls?: string[]</code> (file paths or URLs) and broker options; there is no <code>pactFile</code>. The QnA now says so.",
        "In the run from the first subtopic, the interaction was declared with <code>given('user 1 exists')</code> but the Verifier had no <code>stateHandlers</code>. The matcher pact still passed, because the test provider returned a user anyway.",
        "So the page's \"missing state handlers cause false failures\" is the common case on an empty database, not a rule: the verifier simply skips the setup and checks the response it gets.",
        "That makes missing handlers dangerous in both directions: false failures on a clean database and false passes on a database with leftover data."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Local verification",
      "language": "typescript",
      "code": "import { Verifier } from '@pact-foundation/pact';\n\nawait new Verifier({\n  provider: 'UserService',\n  providerBaseUrl: 'http://127.0.0.1:3001',\n  pactUrls: ['./pacts/UserFrontend-UserService.json'], // not pactFile\n  stateHandlers: {\n    'user 1 exists': async () => {\n      await db.users.deleteMany();\n      await db.users.insert({ id: 1, name: 'Alice' });\n    },\n  },\n}).verifyProvider();"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A provider verification passes on a developer laptop but fails in CI with \"Expected 200 but was 404\" for an interaction given \"user 1 exists\". What is the likely cause?",
    "hint": "Where did user 1 come from on the laptop?",
    "solution": "There is no state handler (or it does nothing). The laptop database already had user 1, so the check passed by luck; the CI database is empty, so the provider returns 404. Add a stateHandlers entry that creates user 1."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Pact refuses to run an interaction whose state has no handler.",
      "reality": "It runs it anyway; the result depends on whatever data the provider already has."
    },
    {
      "thought": "A Broker is required to verify a provider.",
      "reality": "pactUrls can point at local pact files; the Broker is for sharing, results and can-i-deploy."
    }
  ];
}
