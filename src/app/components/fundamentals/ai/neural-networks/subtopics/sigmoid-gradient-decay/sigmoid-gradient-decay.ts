import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-sigmoid-gradient-decay',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sigmoid-gradient-decay.html',
  styleUrl: './sigmoid-gradient-decay.scss'
})
export class SigmoidGradientDecaySubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Simulated with NumPy",
      "points": [
        "A 20-layer network of width 256 with Xavier initialisation and sigmoid activations, 1,024 random inputs. Gradients were backpropagated from the top layer.",
        "Weight-gradient norm at layer 20: 30.9. At layer 1: 1.5e-12. The ratio is about 4.9e-14 — the early layers effectively get no signal.",
        "Each sigmoid layer multiplies the gradient by its derivative, which is at most 0.25 and much less when saturated, so the product falls geometrically.",
        "The same network with ReLU and He initialisation kept the first layer's gradient at 0.14 of the last layer's — a modest drop, not 13 orders of magnitude."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Backprop norms (Python)",
      "language": "typescript",
      "code": "// for l in reversed(range(L)):\n//     g = g * dact(z[l])                      # through the activation\n//     norms.append(np.linalg.norm(h[l].T @ g)) # dL/dW for this layer\n//     g = g @ W[l].T                          # to the previous layer\n//\n// sigmoid + Xavier: layer 1 = 1.5e-12, layer 20 = 30.9\n// ReLU + He:        layer1 / layer20 = 0.14"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "If each layer multiplied the gradient by 0.25 (the sigmoid maximum), what would remain after 20 layers?",
    "hint": "0.25 to the power 20.",
    "solution": "About 9.1e-13. That is the best case; with saturated units the factors are smaller, which is why the measured ratio (about 5e-14) is even lower."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Vanishing gradients are a mild slowdown.",
      "reality": "Measured here, early layers got gradients about 14 orders of magnitude smaller than the top."
    },
    {
      "thought": "ReLU removes all gradient decay.",
      "reality": "It greatly reduces it (0.14 here), but initialisation and normalisation still matter."
    }
  ];
}
