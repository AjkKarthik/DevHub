import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-sort-shuffle-bias',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sort-shuffle-bias.html',
  styleUrl: './sort-shuffle-bias.scss'
})
export class SortShuffleBiasSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Measured in Node 22 (V8)",
      "points": [
        "Shuffling <code>[0, 1, 2, 3]</code> 600,000 times with the random comparator: all 24 orders appeared, but the rarest came up 1.5% of the time and the most common 18.7%. A fair shuffle gives each 4.2%.",
        "For a 10-element array, element 0 stayed in position 0 in 19.4% of runs instead of 10%. In a train/test split this means the first rows are more likely to land in the same set every time.",
        "Fisher-Yates walks from the end, swapping each position with a random earlier (or same) position. Its measured positions for element 0 were all 9.9-10.1%.",
        "The page's <code>trainTestSplit</code> now uses Fisher-Yates."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Biased vs fair",
      "language": "typescript",
      "code": "// Biased: comparator lies to the sort\nconst bad = [0, 1, 2, 3].sort(() => Math.random() - 0.5);\n\n// Fisher-Yates: every order equally likely\nfunction shuffle<T>(input: T[]): T[] {\n  const a = input.slice();\n  for (let i = a.length - 1; i > 0; i--) {\n    const j = Math.floor(Math.random() * (i + 1));\n    [a[i], a[j]] = [a[j], a[i]];\n  }\n  return a;\n}"
    },
    {
      "label": "Measure it",
      "language": "typescript",
      "code": "const counts: Record<string, number> = {};\nfor (let t = 0; t < 600_000; t++) {\n  const key = [0, 1, 2, 3].sort(() => Math.random() - 0.5).join('');\n  counts[key] = (counts[key] ?? 0) + 1;\n}\n// Node 22: min 1.5%, max 18.7% per order (fair = 4.2%)"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Why is the loop bound <code>j = Math.floor(Math.random() * (i + 1))</code> and not <code>Math.random() * a.length</code>?",
    "hint": "Count how many equally likely outcomes each version produces.",
    "solution": "Picking j from 0..i gives n * (n-1) * ... * 1 = n! equally likely paths, one per order. Picking from the whole array gives n^n paths, which is not a multiple of n! for n > 2, so some orders must be more likely than others."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "A random comparator shuffles the array.",
      "reality": "It produces a skewed order whose bias depends on the sort algorithm; measured, one order was 12 times more likely than another."
    },
    {
      "thought": "A small bias does not matter for a split.",
      "reality": "It makes the same rows end up in the test set more often, which skews the evaluation."
    }
  ];
}
