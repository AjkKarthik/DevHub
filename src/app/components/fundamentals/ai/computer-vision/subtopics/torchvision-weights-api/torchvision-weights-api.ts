import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-torchvision-weights-api',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './torchvision-weights-api.html',
  styleUrl: './torchvision-weights-api.scss'
})
export class TorchvisionWeightsApiSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Read from the torchvision 0.29.1 source",
      "points": [
        "<code>resnet50</code> is wrapped in <code>@handle_legacy_interface(weights=(\"pretrained\", ResNet50_Weights.IMAGENET1K_V1))</code>. Passing <code>pretrained=True</code> is translated to <code>weights=IMAGENET1K_V1</code>.",
        "It warns: \"The parameter 'pretrained' is deprecated since 0.13 and may be removed in the future, please use 'weights' instead\", and suggests <code>ResNet50_Weights.DEFAULT</code> for the most up-to-date weights.",
        "In the same file, <code>ResNet50_Weights.DEFAULT = IMAGENET1K_V2</code>, listed at 80.858% ImageNet top-1, against 76.130% for V1.",
        "Strings work too: <code>weights=\"DEFAULT\"</code> or <code>\"IMAGENET1K_V2\"</code>. The page now uses the weights API throughout."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Modern loading (Python)",
      "language": "typescript",
      "code": "// from torchvision.models import resnet50, ResNet50_Weights\n// weights = ResNet50_Weights.DEFAULT        # IMAGENET1K_V2, 80.858% top-1\n// model = resnet50(weights=weights)\n// preprocess = weights.transforms()          # matching resize/crop/normalise\n//\n// # Legacy: works with a warning, but gives IMAGENET1K_V1 (76.130%)\n// model = resnet50(pretrained=True)"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A notebook upgraded from pretrained=True to weights=ResNet50_Weights.DEFAULT but kept its own transforms (Resize(256), CenterCrop(224)). Is that a problem?",
    "hint": "Different weights, different training recipe.",
    "solution": "Possibly. The V2 weights were trained with a different recipe, and weights.transforms() describes the preprocessing they expect. Using weights.transforms() (or checking what it contains) avoids a silent accuracy loss from mismatched preprocessing."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "pretrained=True gives you the best available ImageNet weights.",
      "reality": "It maps to the legacy V1 weights; DEFAULT is V2, about 4.7 points higher top-1 for ResNet-50."
    },
    {
      "thought": "A deprecation warning means the code is about to break.",
      "reality": "It still runs in 0.29.1, but the behaviour differs from the recommended API."
    }
  ];
}
