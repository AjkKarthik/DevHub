import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-ai-conv-is-cross-correlation',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './conv-is-cross-correlation.html',
  styleUrl: './conv-is-cross-correlation.scss'
})
export class ConvIsCrossCorrelationSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Run on the page's function",
      "points": [
        "Input: a 3x3 image that is 0 everywhere except a 1 in the centre (an impulse). Kernel: [[1,2,3],[4,5,6],[7,8,9]], padding 1.",
        "Output: <code>[[9,8,7],[6,5,4],[3,2,1]]</code> — the kernel rotated by 180 degrees.",
        "True convolution flips the kernel before sliding it, so an impulse returns the kernel unchanged. The page's loop (like PyTorch's Conv2d) slides the kernel without flipping: cross-correlation.",
        "For training it makes no difference, because the weights are learned. The theory bullet now names it."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Impulse test",
      "language": "typescript",
      "code": "const impulse = [[0, 0, 0], [0, 1, 0], [0, 0, 0]];\nconst k = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];\nconsole.log(conv2d(impulse, k, 1, 1));\n// [[9,8,7],[6,5,4],[3,2,1]]  - flipped: cross-correlation\n\n// True convolution = cross-correlation with the flipped kernel\nconst flip = (m: number[][]) => m.slice().reverse().map(r => r.slice().reverse());\nconsole.log(conv2d(impulse, flip(k), 1, 1)); // [[1,2,3],[4,5,6],[7,8,9]]"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "You copy a horizontal Sobel kernel from an image-processing book (which uses true convolution) into the page's conv2d. What changes in the output edges?",
    "hint": "The Sobel kernel is antisymmetric.",
    "solution": "The kernel is effectively rotated 180 degrees, which for an antisymmetric kernel like Sobel flips the sign: edges that should be positive come out negative. Flip the kernel (or the output sign) to match the book."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "CNNs compute convolutions in the textbook sense.",
      "reality": "They compute cross-correlation; the name stuck because the weights are learned."
    },
    {
      "thought": "The flip matters for trained networks.",
      "reality": "It only matters when you hand-copy a kernel defined for true convolution."
    }
  ];
}
