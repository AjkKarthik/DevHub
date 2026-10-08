import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-publish-needs-version',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './publish-needs-version.html',
  styleUrl: './publish-needs-version.scss'
})
export class PublishNeedsVersionSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Checked with @pact-foundation/pact-cli",
      "points": [
        "Running <code>npx pact-broker publish ./pacts --broker-base-url ...</code> with no version failed immediately: \"error: the following required arguments were not provided: --consumer-app-version\".",
        "The help text lists <code>--branch</code> (repository branch of the consumer version) and <code>--auto-detect-version-properties</code>, which reads commit and branch from known CI variables or git.",
        "The <code>can-i-deploy</code> usage line also requires <code>--broker-base-url</code>; the page's provider step was missing it.",
        "The CI tab now passes <code>--consumer-app-version</code>, <code>--branch</code> and a broker URL to every command, and is marked as bash/YAML rather than TypeScript."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Publish",
      "language": "bash",
      "code": "npx pact-broker publish ./pacts \\\n  --consumer-app-version \"$(git rev-parse HEAD)\" \\\n  --branch \"$(git rev-parse --abbrev-ref HEAD)\" \\\n  --broker-base-url \"$PACT_BROKER_BASE_URL\"\n\n# Without --consumer-app-version:\n# error: the following required arguments were not provided:\n#   --consumer-app-version <consumer-app-version>"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A pipeline publishes pacts with version <code>build-123</code> but runs can-i-deploy with <code>--version $(git rev-parse HEAD)</code>. What happens?",
    "hint": "How does the broker find the row to check?",
    "solution": "The broker has no results for that git SHA because the pacts were stored under build-123, so can-i-deploy cannot confirm compatibility and fails. Use the same version identifier in publish, verification and can-i-deploy."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "The broker can work out the version itself.",
      "reality": "The CLI requires an explicit version (or auto-detection from CI); without one it will not publish."
    },
    {
      "thought": "Publishing is enough to deploy safely.",
      "reality": "Only can-i-deploy, after the provider verifies that version, says it is safe."
    }
  ];
}
