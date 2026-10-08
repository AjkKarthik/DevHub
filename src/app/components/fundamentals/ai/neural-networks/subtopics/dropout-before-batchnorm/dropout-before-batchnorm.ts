import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-dropout-before-batchnorm',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './dropout-before-batchnorm.html',
  styleUrl: './dropout-before-batchnorm.scss'
})
export class DropoutBeforeBatchnormSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Simulated with NumPy",
      "points": [
        "PyTorch uses inverted dropout: in training it zeroes a fraction p and scales the survivors by 1/(1-p), so the mean is unchanged.",
        "The variance is not unchanged. For ReLU activations of N(1,1) inputs and p = 0.3, the variance was 1.572 with dropout on and 0.751 with dropout off — a ratio of 0.478.",
        "BatchNorm after Dropout stores the training variance (1.572). At eval, dropout is off, so its normalised outputs had standard deviation 0.691 instead of 1.000. Every following layer sees differently scaled inputs than it was trained on.",
        "Putting BatchNorm before Dropout (as the page now does) means BatchNorm only ever sees the same distribution in training and eval."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Measure the shift (Python)",
      "language": "typescript",
      "code": "// a = np.maximum(rng.normal(1, 1, 200_000), 0)          # ReLU outputs\n// p = 0.3\n// train = a * (rng.random(a.shape) > p) / (1 - p)       # inverted dropout\n// train.var(), a.var()                                   # 1.572, 0.751\n// mu, var = train.mean(), train.var()                    # BN running stats\n// ((a - mu) / np.sqrt(var)).std()                        # 0.691 at eval (not 1.0)"
    },
    {
      "label": "Safer order (PyTorch)",
      "language": "typescript",
      "code": "// nn.Sequential(\n//   nn.Linear(784, 256),\n//   nn.BatchNorm1d(256),\n//   nn.ReLU(),\n//   nn.Dropout(0.3),\n//   nn.Linear(256, 10),\n// )"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "Your model has good validation loss during training, but after <code>model.eval()</code> its accuracy drops noticeably. The architecture has Dropout then BatchNorm. What would you try first?",
    "hint": "Where do BatchNorm's running statistics come from?",
    "solution": "Move BatchNorm before Dropout (or remove Dropout) and retrain. The running variance was learned with dropout active, so eval-mode BatchNorm mis-scales its inputs. Checking the post-BatchNorm activation std in train and eval mode confirms it."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Inverted dropout makes train and eval activations statistically identical.",
      "reality": "It preserves the mean but roughly doubles the variance here (1.57 vs 0.75)."
    },
    {
      "thought": "Layer order inside a block does not matter much.",
      "reality": "Dropout before BatchNorm makes eval outputs about 30% smaller in spread than in training."
    }
  ];
}
