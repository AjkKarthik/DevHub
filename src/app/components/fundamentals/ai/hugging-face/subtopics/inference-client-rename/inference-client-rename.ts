import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-inference-client-rename',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './inference-client-rename.html',
  styleUrl: './inference-client-rename.scss'
})
export class InferenceClientRenameSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Checked against @huggingface/inference 4.13.31",
      "points": [
        "The package exports <code>InferenceClient</code>; <code>HfInference</code> is declared as <code>class HfInference extends InferenceClient</code> with <code>@deprecated replace with InferenceClient</code>.",
        "Searching the package's compiled code for Hugging Face URLs found only <code>https://router.huggingface.co</code>, including <code>/v1/chat/completions</code>. There is no <code>api-inference</code> host in it.",
        "So requests now go through Inference Providers, a router in front of several hosting providers, rather than the old serverless Inference API URL.",
        "The page now imports <code>InferenceClient</code> and describes the router endpoint."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Current client",
      "language": "typescript",
      "code": "import { InferenceClient } from '@huggingface/inference';\n\nconst hf = new InferenceClient(process.env['HF_TOKEN']);\n\nconst out = await hf.chatCompletion({\n  model: 'mistralai/Mistral-7B-Instruct-v0.3',\n  messages: [{ role: 'user', content: 'Explain RAG in one sentence.' }],\n  max_tokens: 100,\n});\nconsole.log(out.choices[0].message.content);"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Old code calls fetch(\"https://api-inference.huggingface.co/models/...\") directly. What should you change?",
    "hint": "What does the SDK use now?",
    "solution": "Switch to the SDK InferenceClient, or call the router directly (for chat, the OpenAI-compatible https://router.huggingface.co/v1/chat/completions) with your HF token. The SDK no longer uses the old host."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "HfInference and InferenceClient are different products.",
      "reality": "HfInference is just a deprecated subclass of InferenceClient."
    },
    {
      "thought": "Any Hub model can be called serverlessly.",
      "reality": "Only models a connected provider serves are available through the router."
    }
  ];
}
