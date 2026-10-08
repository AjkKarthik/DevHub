import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-fp32-memory-math',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './fp32-memory-math.html',
  styleUrl: './fp32-memory-math.scss'
})
export class Fp32MemoryMathSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Computed for Llama 3 8B",
      "points": [
        "Llama 3 8B has 8,030,261,248 parameters: 32.1 GB in float32, 16.1 GB in bfloat16.",
        "On a 40 GB A100, float32 weights leave about 7.9 GB. The weights fit; a 24 GB consumer GPU cannot hold them at all.",
        "KV cache per token is 2 (K and V) x 32 layers x 8 KV heads x 128 dims x bytes: 128 KiB in bfloat16 and 256 KiB in float32. An 8,192-token context needs 1 GiB or 2 GiB.",
        "So float32 on a 40 GB card leaves room for roughly 30,000 tokens of KV cache before any other overhead, which limits batch size. bfloat16 halves both numbers, which is why it is the usual choice."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Memory estimate",
      "language": "typescript",
      "code": "const params = 8_030_261_248;\nconst weightsGB = (bytesPer: number) => params * bytesPer / 1e9;\nconst kvBytesPerToken = (bytesPer: number) => 2 * 32 * 8 * 128 * bytesPer;\n\nweightsGB(4);                         // 32.1  (float32)\nweightsGB(2);                         // 16.1  (bfloat16)\nkvBytesPerToken(2) / 1024;           // 128 KiB per token\nMath.floor((40e9 - params * 4) / kvBytesPerToken(4)); // ~30,055 fp32 tokens"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "You serve the model in bfloat16 on the same 40 GB A100. Roughly how many tokens of KV cache fit, ignoring other overhead?",
    "hint": "Weights are 16.1 GB; KV is 128 KiB per token.",
    "solution": "About (40 - 16.1) GB / 131,072 bytes, roughly 182,000 tokens — about six times the float32 figure, enough for many concurrent requests."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "If the weights fit, the model can be served.",
      "reality": "Generation also needs KV cache and activation memory, which grows with context length and batch size."
    },
    {
      "thought": "The page's 32 GB example would not fit 40 GB.",
      "reality": "It fits; it just leaves little room for serving."
    }
  ];
}
