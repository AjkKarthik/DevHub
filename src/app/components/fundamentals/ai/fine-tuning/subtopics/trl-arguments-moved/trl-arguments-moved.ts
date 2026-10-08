import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-trl-arguments-moved',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './trl-arguments-moved.html',
  styleUrl: './trl-arguments-moved.scss'
})
export class TrlArgumentsMovedSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Checked against TRL 1.14 with inspect.signature",
      "points": [
        "SFTTrainer accepts model, args, data_collator, train_dataset, eval_dataset, processing_class, peft_config, formatting_func and a few more. There is no <code>dataset_text_field</code> or <code>tokenizer</code> parameter.",
        "<code>dataset_text_field</code> is a field of <code>SFTConfig</code> (default <code>\"text\"</code>), along with <code>max_length</code> (default 1024), <code>packing</code> and <code>completion_only_loss</code>.",
        "DPOTrainer accepts model, ref_model, args, train_dataset, eval_dataset, processing_class, peft_config and others. The tokenizer goes in as <code>processing_class=tokenizer</code>.",
        "The page now builds <code>SFTConfig</code> instead of <code>TrainingArguments</code>, loads the tokenizer in the DPO tab, and passes it as <code>processing_class</code>."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Current TRL",
      "language": "bash",
      "code": "# from trl import SFTTrainer, SFTConfig, DPOTrainer, DPOConfig\n#\n# SFTTrainer(model=model, train_dataset=ds,\n#            args=SFTConfig(output_dir=\"out\", dataset_text_field=\"text\"))\n#\n# DPOTrainer(model=model, ref_model=ref, args=DPOConfig(output_dir=\"dpo\", beta=0.1),\n#            train_dataset=pairs, processing_class=tokenizer)"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Your old script passes max_seq_length=2048 to SFTConfig and fails on current TRL. What should it be?",
    "hint": "Check the SFTConfig field list.",
    "solution": "Use max_length=2048. Current SFTConfig has max_length (default 1024) and no max_seq_length field."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Trainer arguments are stable across TRL versions.",
      "reality": "Several moved to the Config classes, and <code>tokenizer</code> became <code>processing_class</code>."
    },
    {
      "thought": "TrainingArguments and SFTConfig are interchangeable.",
      "reality": "SFT-specific fields such as <code>dataset_text_field</code> and <code>packing</code> exist only on <code>SFTConfig</code>."
    }
  ];
}
