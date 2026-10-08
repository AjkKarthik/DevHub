import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-vllm-command-and-throughput',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './vllm-command-and-throughput.html',
  styleUrl: './vllm-command-and-throughput.scss'
})
export class VllmCommandAndThroughputSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run in bash and checked against the vLLM blog",
      "points": [
        "In the line <code>--tensor-parallel-size 2  \\  # use 2 GPUs</code>, the backslash escapes the space after it, so the line ends normally and the command stops there.",
        "Running the same lines through bash printed the command without <code>--port 8000</code>, then failed with <code>--port: command not found</code>.",
        "The vLLM launch blog (June 2023) reports 14 to 24 times higher throughput than Hugging Face Transformers for single-completion requests, measured on LLaMA-7B (A10G) and LLaMA-13B (A100 40GB) with ShareGPT lengths.",
        "The page now puts the comment on its own line and quotes the 14 to 24 times figure in place of 20 to 100 times."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Working command",
      "language": "bash",
      "code": "# --tensor-parallel-size 2 splits the model across 2 GPUs\npython -m vllm.entrypoints.openai.api_server \\\n  --model meta-llama/Meta-Llama-3-8B-Instruct \\\n  --max-model-len 8192 \\\n  --tensor-parallel-size 2 \\\n  --port 8000"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A script line ends with \"\\\" followed by one trailing space you cannot see. What happens?",
    "hint": "What does the backslash escape?",
    "solution": "The backslash escapes the space, not the newline, so the command ends on that line and the next line runs as a separate command. Trailing whitespace after a continuation backslash breaks it just like a comment does."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Comments can go anywhere on a shell line.",
      "reality": "After a continuation backslash, anything but the newline stops the continuation."
    },
    {
      "thought": "vLLM is 20 to 100 times faster than Hugging Face.",
      "reality": "Its own benchmark reports up to 24 times, under specific models, GPUs and request lengths."
    }
  ];
}
