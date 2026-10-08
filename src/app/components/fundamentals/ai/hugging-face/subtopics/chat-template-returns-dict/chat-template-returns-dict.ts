import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-chat-template-returns-dict',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './chat-template-returns-dict.html',
  styleUrl: './chat-template-returns-dict.scss'
})
export class ChatTemplateReturnsDictSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run with transformers 5.19.0",
      "points": [
        "With a small local tokenizer and chat template, <code>apply_chat_template(messages, return_tensors=\"pt\")</code> returned a <code>BatchEncoding</code>, and <code>hasattr(result, \"shape\")</code> was False.",
        "Passing that object positionally to <code>generate</code> on a tiny random Llama model raised <code>AttributeError</code>.",
        "With <code>return_dict=True</code> and <code>generate(**inputs, ...)</code> the same model generated normally; <code>inputs[\"input_ids\"].shape[1]</code> gave the prompt length (4 tokens) for slicing off the prompt.",
        "The page now also passes <code>add_generation_prompt=True</code> and moves inputs to <code>model.device</code> instead of hard-coding \"cuda\"."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Version-safe generation",
      "language": "bash",
      "code": "# Python\n# inputs = tokenizer.apply_chat_template(\n#     messages, add_generation_prompt=True,\n#     return_dict=True, return_tensors=\"pt\").to(model.device)\n# outputs = model.generate(**inputs, max_new_tokens=512)\n# prompt_len = inputs[\"input_ids\"].shape[1]\n# print(tokenizer.decode(outputs[0][prompt_len:], skip_special_tokens=True))"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Why pass **inputs to generate rather than just inputs[\"input_ids\"]?",
    "hint": "What else is in the dict?",
    "solution": "The dict also holds attention_mask. Passing **inputs gives generate the mask, which matters for padded batches; passing only input_ids makes it guess, usually with a warning."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "return_tensors=\"pt\" always gives a tensor.",
      "reality": "In transformers 5 apply_chat_template returns a BatchEncoding of tensors by default."
    },
    {
      "thought": "Hard-coding .to(\"cuda\") is fine with device_map=\"auto\".",
      "reality": "With device_map the first layer may be on another device; model.device is the reliable target."
    }
  ];
}
