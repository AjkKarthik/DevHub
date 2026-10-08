import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-pd-cut-out-of-range',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './pd-cut-out-of-range.html',
  styleUrl: './pd-cut-out-of-range.scss'
})
export class PdCutOutOfRangeSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run with pandas",
      "points": [
        "For ages [0, 18, 19, 40, 70, 101], <code>pd.cut(age, bins=[0, 18, 35, 65, 100]).cat.codes</code> returned [-1, 0, 1, 2, 3, -1].",
        "Age 0 is outside the first interval (0, 18] because bins are right-closed; age 101 is above the last edge. Both become NaN, and <code>.cat.codes</code> turns NaN into -1.",
        "The model then receives -1 as an ordinary numeric feature. No error is raised, so the problem only shows up as odd predictions for those users.",
        "Using bins of <code>[-inf, 18, 35, 65, inf]</code> covers every age; an assertion on the codes catches anything unexpected."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Cover every value",
      "language": "bash",
      "code": "# Python\n# import numpy as np, pandas as pd\n# def compute_features(df):\n#     df[\"age_bucket\"] = pd.cut(df[\"age\"], bins=[-np.inf, 18, 35, 65, np.inf]).cat.codes\n#     assert (df[\"age_bucket\"] >= 0).all(), \"age outside known buckets\"\n#     return df\n#\n# ages [0, 18, 19, 40, 70, 101] -> [0, 0, 1, 2, 3, 3]"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Would passing include_lowest=True to the original bins fix both bad values?",
    "hint": "Which edge does include_lowest change?",
    "solution": "No. It only makes the first interval [0, 18], so age 0 gets code 0. Age 101 is still above 100 and still becomes -1. Open-ended outer edges fix both."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "A shared feature function guarantees correct features.",
      "reality": "It guarantees the same features in both places, including the same silent -1."
    },
    {
      "thought": "pd.cut raises an error for values outside the bins.",
      "reality": "It returns NaN, and .cat.codes turns that into -1."
    }
  ];
}
