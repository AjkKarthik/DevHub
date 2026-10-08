import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-train-on-prompt-and-completion',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './train-on-prompt-and-completion.html',
  styleUrl: './train-on-prompt-and-completion.scss'
})
export class TrainOnPromptAndCompletionSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "What the model actually sees",
      "points": [
        "With <code>dataset_text_field=\"output\"</code>, each training example is just the output column. The instruction and input columns are never tokenised, so the model learns to produce answers with no question in front of them.",
        "Instruction tuning needs the model to learn <em>given this instruction, produce this answer</em>, so the instruction must be part of the sequence.",
        "TRL supports a prompt-completion dataset format: each row has <code>prompt</code> and <code>completion</code>. <code>SFTConfig.completion_only_loss</code> defaults to <code>None</code>, which means the loss is computed on the completion only when the dataset is in that format.",
        "The fixed tab converts Alpaca rows into prompt and completion and drops <code>dataset_text_field</code>."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Convert Alpaca rows",
      "language": "typescript",
      "code": "interface Alpaca { instruction: string; input: string; output: string }\n\nfunction toPromptCompletion(row: Alpaca) {\n  const prompt = row.input\n    ? row.instruction + '\\n\\nInput:\\n' + row.input + '\\n\\nResponse:\\n'\n    : row.instruction + '\\n\\nResponse:\\n';\n  return { prompt, completion: row.output };\n}\n\ntoPromptCompletion({ instruction: 'Translate to French', input: 'Good morning', output: 'Bonjour' });\n// { prompt: 'Translate to French\\n\\nInput:\\nGood morning\\n\\nResponse:\\n', completion: 'Bonjour' }"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "If you instead join instruction and output into one \"text\" column and use dataset_text_field=\"text\", what changes compared with prompt-completion?",
    "hint": "Which tokens does the loss cover?",
    "solution": "The model sees the instruction, which fixes the main bug, but the loss now covers the instruction tokens too, so it also learns to generate instructions. Prompt-completion format computes the loss on the completion only."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Training on the outputs is enough because the outputs are what you want the model to say.",
      "reality": "Without the instruction in the sequence, the model never learns which output goes with which request."
    },
    {
      "thought": "Loss masking needs a custom data collator.",
      "reality": "With a prompt-completion dataset, current TRL masks the prompt by default."
    }
  ];
}
