import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-extra-fields-pass',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './extra-fields-pass.html',
  styleUrl: './extra-fields-pass.scss'
})
export class ExtraFieldsPassSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Verified with @pact-foundation/pact 17.1.4",
      "points": [
        "Two consumer tests wrote pacts for <code>GET /users/1</code>: one with <code>{ id: integer(1), name: string('Alice') }</code>, one with literal values <code>{ id: 1, name: 'Alice', createdAt: '2024-01-01T00:00:00Z' }</code>.",
        "A provider then returned <code>{ id: 7, name: 'Bob', createdAt: ..., email: ..., tier: 'gold' }</code> — two fields the pacts never mentioned.",
        "The matcher pact <strong>passed</strong>. The literal pact <strong>failed</strong> with \"$.name -> Expected 'Bob' to be equal to 'Alice'\", plus the same for <code>id</code> and <code>createdAt</code>. Neither complained about <code>email</code> or <code>tier</code>.",
        "The pact file stores the example body plus <code>matchingRules</code> such as <code>{\"$.id\": {\"matchers\": [{\"match\": \"integer\"}]}}</code>; without a rule, a value is compared by equality."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Brittle vs robust",
      "language": "typescript",
      "code": "// Brittle: every literal must match exactly\nbody: { id: 1, name: 'Alice', createdAt: '2024-01-01T00:00:00Z' }\n\n// Robust: types only, and only fields the client reads\nconst { integer, string } = MatchersV3;\nbody: { id: integer(1), name: string('Alice') }\n\n// Provider adding email or tier later passes both styles."
    }
  ];

  exercise: TryItExercise = {
    "prompt": "The provider renames <code>name</code> to <code>fullName</code> and keeps everything else. Does the matcher-based pact above still pass?",
    "hint": "Is name still in the response?",
    "solution": "No. The pact requires a string at $.name, and it is now missing, so verification fails. That is a real breaking change for this consumer, which is what contract tests are for."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Adding a field to a response breaks every pact.",
      "reality": "Pact ignores unexpected keys in a response body; only missing or mismatched listed fields fail."
    },
    {
      "thought": "Matchers make a pact accept anything.",
      "reality": "They still require each listed field to be present with the right type."
    }
  ];
}
