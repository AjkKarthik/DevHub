import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-lora-count-with-gqa',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './lora-count-with-gqa.html',
  styleUrl: './lora-count-with-gqa.scss'
})
export class LoraCountWithGqaSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Measured with peft on the Llama 3 8B config",
      "points": [
        "Llama 3 8B has hidden size 4096, 32 layers, 32 query heads and 8 key/value heads (head_dim 128). So q_proj is 4096x4096 but v_proj is 4096x1024.",
        "With r=16: q_proj adds 4096x16 + 16x4096 = 131,072 per layer, v_proj adds 4096x16 + 16x1024 = 81,920 per layer. Total 212,992 x 32 layers = 6,815,744.",
        "Building the model on the meta device and calling <code>get_peft_model</code> printed exactly <code>trainable params: 6,815,744 || all params: 8,037,076,992 || trainable%: 0.0848</code>.",
        "Assuming v_proj were 4096x4096 would give 8,388,608, which is the right count for Llama 2 7B (no grouped-query attention). The page's 10,485,760 matched neither model."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Count per layer",
      "language": "typescript",
      "code": "const lora = (dIn: number, dOut: number, r: number) => dIn * r + r * dOut;\n\n// Llama 3 8B: 32 layers, hidden 4096, 8 KV heads x 128 = 1024\nconst perLayer = lora(4096, 4096, 16) + lora(4096, 1024, 16); // q_proj + v_proj\nconsole.log(perLayer * 32);                                  // 6815744\n\n// Llama 2 7B: no GQA, v_proj is 4096x4096\nconsole.log(32 * 2 * lora(4096, 4096, 16));                  // 8388608"
    },
    {
      "label": "Check with peft",
      "language": "bash",
      "code": "# Python, using the config only (no weights downloaded)\n# with torch.device(\"meta\"):\n#     model = LlamaForCausalLM(LlamaConfig(hidden_size=4096, intermediate_size=14336,\n#         num_hidden_layers=32, num_attention_heads=32, num_key_value_heads=8,\n#         vocab_size=128256, tie_word_embeddings=False))\n# get_peft_model(model, LoraConfig(r=16, lora_alpha=32,\n#     target_modules=[\"q_proj\", \"v_proj\"], task_type=\"CAUSAL_LM\")).print_trainable_parameters()\n# trainable params: 6,815,744 || all params: 8,037,076,992 || trainable%: 0.0848"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "You lower the rank from 16 to 8 on the same Llama 3 8B setup. How many trainable parameters does LoRA add now?",
    "hint": "Every term in the formula is linear in r.",
    "solution": "3,407,872 — exactly half of 6,815,744, because each module adds d_in x r + r x d_out and both terms scale with r."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Every attention projection in a modern LLM is hidden_size x hidden_size.",
      "reality": "With grouped-query attention, <code>k_proj</code> and <code>v_proj</code> output only <code>num_key_value_heads x head_dim</code>."
    },
    {
      "thought": "A rough parameter count is fine for an example output.",
      "reality": "Readers compare the printed line with their own run; the real peft output is 6,815,744."
    }
  ];
}
