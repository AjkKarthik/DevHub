import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-tokens-per-word-measured',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './tokens-per-word-measured.html',
  styleUrl: './tokens-per-word-measured.scss'
})
export class TokensPerWordMeasuredSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Counted with js-tiktoken (gpt-4 encoding)",
      "points": [
        "English: \"The quick brown fox jumps over the lazy dog while the cat sleeps peacefully on the warm windowsill.\" — 18 words, 20 tokens (1.11 per word).",
        "Code: a one-line filter/map arrow function — 16 whitespace-separated words, 32 tokens (2.0 per word).",
        "German: \"Die Bundesregierung hat heute neue Maßnahmen zur Förderung erneuerbarer Energien beschlossen.\" — 11 words, 25 tokens (2.27 per word).",
        "So 1.3 is a reasonable average for English prose, but non-English text and code can be about twice as expensive, as the mistake block says."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Count it",
      "language": "typescript",
      "code": "import { encodingForModel } from 'js-tiktoken';\nconst enc = encodingForModel('gpt-4');\n\nfor (const text of [english, code, german]) {\n  const words = text.split(/\\s+/).length;\n  const tokens = enc.encode(text).length;\n  console.log((tokens / words).toFixed(2));\n}\n// 1.11, 2.00, 2.27"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A support bot gets German messages averaging 200 words. Roughly how many tokens should you budget per message, and how wrong would the 1.3 rule be?",
    "hint": "Use the measured German ratio.",
    "solution": "About 450 tokens (200 x 2.27). The 1.3 rule would give 260, under-budgeting by about 40%."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "1.3 tokens per word holds for any text.",
      "reality": "Code and German were about 2 to 2.3 tokens per word here."
    },
    {
      "thought": "A word count is a safe proxy for a context limit.",
      "reality": "Use the tokeniser; ratios vary by language and content."
    }
  ];
}
