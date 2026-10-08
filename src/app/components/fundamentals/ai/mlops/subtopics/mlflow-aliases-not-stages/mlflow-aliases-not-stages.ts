import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-mlflow-aliases-not-stages',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './mlflow-aliases-not-stages.html',
  styleUrl: './mlflow-aliases-not-stages.scss'
})
export class MlflowAliasesNotStagesSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Checked in MLflow 3.17.0",
      "points": [
        "<code>MlflowClient.transition_model_version_stage</code> is decorated with <code>@deprecated(since=\"2.9.0\")</code>.",
        "<code>MlflowClient.set_registered_model_alias(name, alias, version)</code> is the replacement: you choose alias names such as champion and challenger.",
        "Loading by alias uses the URI <code>models:/FraudDetectionModel@champion</code>, so serving code does not change when you promote a new version.",
        "Rolling back means moving the alias to the previous version number; nothing is copied or re-registered."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Aliases",
      "language": "bash",
      "code": "# Python\n# from mlflow import MlflowClient\n# client = MlflowClient()\n# mv = mlflow.register_model(model_uri, \"FraudDetectionModel\")\n# client.set_registered_model_alias(\"FraudDetectionModel\", \"champion\", mv.version)\n#\n# model = mlflow.pyfunc.load_model(\"models:/FraudDetectionModel@champion\")\n#\n# # Roll back: point the alias at the previous version\n# client.set_registered_model_alias(\"FraudDetectionModel\", \"champion\", int(mv.version) - 1)"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "You want to shadow-test version 7 while version 6 keeps serving traffic. How would you set up aliases?",
    "hint": "Two aliases, two versions.",
    "solution": "Keep champion on version 6 for live traffic and set challenger on version 7 for the shadow path. When the test passes, move champion to version 7."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Production is a built-in registry stage you should use.",
      "reality": "Stages were deprecated in MLflow 2.9 in favour of aliases you name yourself."
    },
    {
      "thought": "Promoting a model means copying it.",
      "reality": "An alias is a pointer; promotion and rollback just move it."
    }
  ];
}
