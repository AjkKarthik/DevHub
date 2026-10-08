import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-xavier-vs-he-relu',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './xavier-vs-he-relu.html',
  styleUrl: './xavier-vs-he-relu.scss'
})
export class XavierVsHeReluSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Why the factor of 2",
      "points": [
        "Xavier sets weight variance to 1/fan_in, which keeps the variance of a linear layer's output the same as its input.",
        "ReLU zeroes about half of its inputs, so it roughly halves the second moment of what passes through. He initialisation uses 2/fan_in to cancel that.",
        "Measured with width 256: Xavier + ReLU gave activation std 0.585 at layer 1, 0.026 at layer 10 and 0.00075 at layer 20. He + ReLU gave 0.821, 0.781 and 0.745.",
        "Shrinking activations mean shrinking gradients too, so a Xavier-initialised deep ReLU network starts out barely trainable."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Compare (Python)",
      "language": "typescript",
      "code": "// for l in range(20):\n//     W = rng.normal(size=(256, 256)) * scale   # Xavier: sqrt(1/256), He: sqrt(2/256)\n//     h = np.maximum(h @ W, 0)\n//\n// Xavier: std 0.585 -> 0.026 -> 0.00075   (layers 1, 10, 20)\n// He:     std 0.821 -> 0.781 -> 0.745"
    },
    {
      "label": "PyTorch",
      "language": "typescript",
      "code": "// for m in model.modules():\n//     if isinstance(m, nn.Linear):\n//         nn.init.kaiming_normal_(m.weight, nonlinearity='relu')\n//         nn.init.zeros_(m.bias)"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Using the measured numbers, by roughly what factor does Xavier shrink the ReLU activation std per layer?",
    "hint": "Compare layer 10 with layer 20.",
    "solution": "From 0.026 to 0.00075 over 10 layers is a factor of about 35, so about 1.43 per layer — close to the square root of 2, which is exactly what He initialisation cancels."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Any reasonable random initialisation works for deep ReLU nets.",
      "reality": "With Xavier the activations shrank by about 780 times over 20 layers."
    },
    {
      "thought": "He and Xavier differ only slightly, so it rarely matters.",
      "reality": "The factor of 2 compounds with depth."
    }
  ];
}
