import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-rouge1-ignores-order',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './rouge1-ignores-order.html',
  styleUrl: './rouge1-ignores-order.scss'
})
export class Rouge1IgnoresOrderSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run with the page's rougeN",
      "points": [
        "Reference: \"Paris is the capital of France\". Hypothesis: \"France is the capital of Paris\". ROUGE-1 F1 is 1.000 — the same six words in a different order.",
        "ROUGE-2 on the same pair is 0.600, because bigrams such as \"paris is\" and \"of france\" no longer match.",
        "The negation \"Paris is not the capital of France\" still scores ROUGE-1 0.923 and ROUGE-2 0.727, even though it says the opposite.",
        "The page already warns that n-gram metrics miss paraphrases; these cases show the other direction: they also reward wrong answers that reuse the right words."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Order and negation",
      "language": "typescript",
      "code": "const ref = 'Paris is the capital of France';\n\nrougeN('France is the capital of Paris', ref, 1).f1;    // 1.000\nrougeN('France is the capital of Paris', ref, 2).f1;    // 0.600\n\nrougeN('Paris is not the capital of France', ref, 1).f1; // 0.923\nrougeN('Paris is not the capital of France', ref, 2).f1; // 0.727"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "For a factual Q&A system, which check would catch \"France is the capital of Paris\" when ROUGE does not?",
    "hint": "Think about what the answer claims, not which words it uses.",
    "solution": "An LLM-as-judge or human check against the reference on correctness, or exact match on the extracted answer entity (Paris). Both look at what is claimed, which bag-of-words overlap cannot."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "A ROUGE-1 of 1.0 means the answer matches the reference.",
      "reality": "It means the same words appear the same number of times, in any order."
    },
    {
      "thought": "Higher-order n-grams fix the problem.",
      "reality": "ROUGE-2 lowered the scores, but the negated sentence still scored 0.727."
    }
  ];
}
