import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-cot-prompt-skips-reasoning',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './cot-prompt-skips-reasoning.html',
  styleUrl: './cot-prompt-skips-reasoning.scss'
})
export class CotPromptSkipsReasoningSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "What the old prompt asked for",
      "points": [
        "The returned string contained the literal text <code>[Work through the reasoning here]</code>. Nothing replaced it, so the model received a placeholder instead of an instruction.",
        "The string then ended with <code>Final answer (number only):</code>. For a model continuing the text, the natural next token is the number, so the reasoning step can be skipped entirely.",
        "The fixed prompt says: work through it step by step, then on the last line write <code>Final answer: &lt;number&gt;</code>. The reasoning comes first and the answer format is fixed.",
        "A small <code>extractFinalAnswer</code> function reads that last line. On a reply ending in <code>Final answer: 55</code> it returned 55; on <code>1,200</code> it returned 1200; with no such line it returned null."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Fixed prompt and parser",
      "language": "typescript",
      "code": "function buildCotPrompt(problem: string): string {\n  return 'Solve the following math problem.\\n\\n' +\n    'Problem: ' + problem + '\\n\\n' +\n    'Work through it step by step, showing each calculation.\\n' +\n    'On the last line, write only: Final answer: <number>';\n}\n\nfunction extractFinalAnswer(reply: string): number | null {\n  const m = reply.match(/Final answer:\\s*(-?[\\d.,]+)\\s*$/i);\n  return m ? Number(m[1].replace(/,/g, '')) : null;\n}\n\nextractFinalAnswer('45-12=33\\n33+30=63\\n63-8=55\\nFinal answer: 55'); // 55"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "The model ends its reply with \"Final answer: 55.\" (with a full stop). What does extractFinalAnswer return?",
    "hint": "Which characters does the number group allow, and what is Number(\"55.\")?",
    "solution": "55. The group [\\d.,]+ captures \"55.\", and Number(\"55.\") is 55. A reply ending in \"55 apples\" would return null, because the line must end right after the number."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Brackets in a prompt are filled in by the model as a template.",
      "reality": "They are just text; the model sees <code>[Work through the reasoning here]</code> literally."
    },
    {
      "thought": "Asking for step-by-step reasoning anywhere in the prompt guarantees it.",
      "reality": "Ending the prompt with an answer label pulls the model toward answering immediately."
    }
  ];
}
