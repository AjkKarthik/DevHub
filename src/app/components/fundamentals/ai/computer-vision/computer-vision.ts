import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-ai-computer-vision',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './computer-vision.html',
  styleUrl: './computer-vision.scss',
})
export class AiComputerVision {
  quickRef: QuickRefItem[] = [
    { name: 'Convolution',       type: 'keyword', desc: 'Slide a kernel over input, compute dot product at each position — detects local patterns.' },
    { name: 'Kernel / filter',   type: 'keyword', desc: 'Small weight matrix (e.g. 3×3) that learns to detect edges, textures, etc.' },
    { name: 'Feature map',       type: 'keyword', desc: 'Output of applying a kernel to the input — a 2D activation map.' },
    { name: 'Max pooling',       type: 'keyword', desc: 'Take max value in each pool window — downsamples, adds translation invariance.' },
    { name: 'Transfer learning', type: 'keyword', desc: 'Use a pre-trained backbone (ResNet, EfficientNet) and fine-tune on your task.' },
    { name: 'ResNet skip',       type: 'keyword', desc: 'Skip connections: x + F(x). Enable very deep networks by preserving gradient flow.' },
    { name: 'Data augmentation', type: 'keyword', desc: 'Random flips, crops, colour jitter during training — reduces overfitting on small datasets.' },
    { name: 'Top-1 / Top-5',    type: 'keyword', desc: 'ImageNet accuracy metrics: correct label is the highest-prob (top-1) or in top-5 predictions.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Convolutional Layers',
      points: [
        'A conv layer slides a kernel (e.g. 3×3×C) over the input spatial dimensions, computing a dot product at each position.',
        'Each kernel detects one pattern (edge, colour, texture). Multiple kernels → multiple feature maps (channels).',
        'Parameters: kernel size, stride (step size), padding (add zeros at border to preserve spatial dims).',
        'Key property: weight sharing — the same kernel is applied at every position. Dramatically fewer parameters than a fully-connected layer for images.',
        'Translation equivariance: if the input shifts, the feature map shifts by the same amount. Pooling adds translation invariance.',
      ],
    },
    {
      heading: 'Pooling and Architecture',
      points: [
        'Max pooling: take the max in each 2×2 (or larger) window. Halves spatial dimensions. Retains the most activated signal.',
        'Average pooling: take the mean. Global average pooling (GAP) reduces each feature map to a single value — used before the classification head.',
        'Classic CNN pattern: CONV → ReLU → CONV → ReLU → Pool → repeat → Flatten → Dense → Softmax.',
        'As depth increases: spatial size decreases, number of channels increases. Early layers detect edges; later layers detect complex objects.',
      ],
    },
    {
      heading: 'ResNet and Skip Connections',
      points: [
        'Residual connection: output = F(x) + x. The layer learns residuals (what to add to identity) instead of full transformations.',
        'Key insight: even if F(x)=0, the network can pass through x unchanged — easy to initialise gradients and train very deep networks.',
        'ResNet-50 (50 layers) and ResNet-101 are standard baselines. Enabled training 100+ layer networks that previously failed due to vanishing gradients.',
        'EfficientNet: scales depth, width, and resolution together using compound scaling — achieves better accuracy per FLOP than ResNet.',
        'Vision Transformer (ViT): splits image into patches, treats them as tokens, applies a Transformer. Outperforms CNNs at very large scale.',
      ],
    },
    {
      heading: 'Transfer Learning',
      points: [
        'Pre-trained on ImageNet (1.2M images, 1000 classes): the model\'s early layers capture universal features (edges, textures) useful for any vision task.',
        'Fine-tuning strategy: freeze backbone, train classification head first. Then unfreeze last N layers and fine-tune with a small learning rate.',
        'Few-shot: even with 100 labelled examples, a pre-trained backbone outperforms a CNN trained from scratch on thousands.',
        'Data augmentation is critical with small datasets: random horizontal flip, random crop, colour jitter, mixup, cutmix.',
        'torchvision.models: resnet50(pretrained=True), efficientnet_b0(pretrained=True), vit_b_16(pretrained=True). One line to load a state-of-the-art model.',
      ],
    },
    {
      heading: 'Transfer Learning: Why CV Models Rarely Train From Scratch',
      points: [
        'Training a convolutional or vision transformer model from scratch requires enormous labeled datasets and compute — transfer learning (fine-tuning a model pre-trained on a large dataset like ImageNet) achieves strong results with a fraction of the data and compute.',
        'Early layers of a pre-trained CV model learn general-purpose features (edges, textures, shapes) that transfer well across tasks, while later layers learn task-specific features — freezing early layers and only fine-tuning later layers is a common and effective strategy.',
        'Data augmentation (random crops, flips, color jitter) artificially expands a limited training dataset by generating varied versions of existing images, reducing overfitting risk when labeled data is scarce, which is the common case for most real-world CV applications.',
        'Choosing an appropriate pre-trained backbone (ResNet, EfficientNet, a vision transformer) involves balancing accuracy against inference latency and model size — the largest, most accurate model is not always the right choice for a resource-constrained deployment target.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Convolution',
      language: 'typescript',
      code: `// 2D convolution (single channel, single kernel) — illustrative
function conv2d(
  input: number[][], kernel: number[][], stride = 1, padding = 0
): number[][] {
  const ih = input.length, iw = input[0].length;
  const kh = kernel.length, kw = kernel[0].length;
  const oh = Math.floor((ih + 2*padding - kh) / stride) + 1;
  const ow = Math.floor((iw + 2*padding - kw) / stride) + 1;

  // Apply padding
  const padded: number[][] = Array.from({length: ih + 2*padding},
    (_, i) => Array.from({length: iw + 2*padding}, (__, j) => {
      const ri = i - padding, rj = j - padding;
      return (ri >= 0 && ri < ih && rj >= 0 && rj < iw) ? input[ri][rj] : 0;
    })
  );

  // Convolve
  return Array.from({length: oh}, (_, oi) =>
    Array.from({length: ow}, (__, oj) => {
      let sum = 0;
      for (let ki = 0; ki < kh; ki++)
        for (let kj = 0; kj < kw; kj++)
          sum += padded[oi*stride + ki][oj*stride + kj] * kernel[ki][kj];
      return sum;
    })
  );
}

// 2×2 max pooling
function maxPool(input: number[][], size = 2, stride = 2): number[][] {
  const oh = Math.floor((input.length - size) / stride) + 1;
  const ow = Math.floor((input[0].length - size) / stride) + 1;
  return Array.from({length: oh}, (_, oi) =>
    Array.from({length: ow}, (__, oj) => {
      let max = -Infinity;
      for (let pi = 0; pi < size; pi++)
        for (let pj = 0; pj < size; pj++)
          max = Math.max(max, input[oi*stride+pi][oj*stride+pj]);
      return max;
    })
  );
}`,
    },
    {
      label: 'Transfer Learning (PyTorch)',
      language: 'typescript',
      code: `// Transfer learning with PyTorch (Python pseudocode)
// import torch
// import torchvision.models as models
// import torchvision.transforms as T
//
// # Load pre-trained ResNet-50
// model = models.resnet50(pretrained=True)
//
// # Replace classification head for our task (e.g. 5 classes)
// in_features = model.fc.in_features
// model.fc = torch.nn.Linear(in_features, 5)
//
// # Stage 1: freeze backbone, train head only
// for param in model.parameters(): param.requires_grad = False
// for param in model.fc.parameters(): param.requires_grad = True
//
// optimizer = torch.optim.Adam(model.fc.parameters(), lr=1e-3)
// train(model, optimizer, train_loader, epochs=5)
//
// # Stage 2: unfreeze last layer block, fine-tune with small LR
// for param in model.layer4.parameters(): param.requires_grad = True
// optimizer = torch.optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-4)
// train(model, optimizer, train_loader, epochs=10)
//
// # Data augmentation pipeline
// transform_train = T.Compose([
//   T.RandomResizedCrop(224), T.RandomHorizontalFlip(),
//   T.ColorJitter(brightness=0.2, contrast=0.2),
//   T.ToTensor(), T.Normalize(mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225])
// ])`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Training a CNN from scratch with a small dataset',
      wrong: `# 500 images, 10 classes — training from scratch
model = build_custom_cnn()
model.fit(X_train, y_train, epochs=50)  # poor accuracy, overfitting`,
      right: `# Use transfer learning — pre-trained features generalise
model = models.resnet50(pretrained=True)
model.fc = nn.Linear(2048, 10)
# Fine-tune just the head; use data augmentation`,
      explanation: 'CNNs need hundreds of thousands of images to learn good features from scratch. With small datasets, always start from a pre-trained backbone and fine-tune.',
    },
    {
      title: 'Forgetting to normalise input images',
      wrong: `# Raw pixel values [0-255] or [0-1] without ImageNet normalisation
transform = T.ToTensor()  # missing Normalize`,
      right: `transform = T.Compose([
  T.ToTensor(),
  T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])  # ImageNet mean/std — required when using pre-trained models`,
      explanation: 'Pre-trained models were trained on ImageNet-normalised images. Using un-normalised inputs produces activations in a completely different distribution — the pre-trained weights become useless.',
    },
    {
      title: 'Not using data augmentation for image training',
      wrong: `transform = T.ToTensor()  # no augmentation
# Model memorises exact training images — overfits badly`,
      right: `transform = T.Compose([
  T.RandomHorizontalFlip(), T.RandomRotation(15),
  T.ColorJitter(0.2, 0.2), T.RandomResizedCrop(224),
  T.ToTensor(), T.Normalize(...)
])`,
      explanation: 'Images have natural symmetries — flipped, rotated, and colour-shifted versions should predict the same label. Augmentation artificially increases dataset diversity and is critical for small datasets.',
    },
    {
      title: 'Fine-tuning with too large a learning rate',
      wrong: `# After unfreezing backbone, using the same LR as training head
optimizer = Adam(model.parameters(), lr=1e-3)  # destroys pre-trained features`,
      right: `# Use 10×–100× smaller LR for the backbone vs the head
optimizer = Adam([
  {'params': model.backbone.parameters(), 'lr': 1e-5},
  {'params': model.head.parameters(), 'lr': 1e-3},
])`,
      explanation: 'Pre-trained backbone weights encode valuable features. A large learning rate overwrites them rapidly. Use differential learning rates: small for backbone, larger for the classification head.',
    },
  ];

  challenge: Challenge = {
    title: 'Output Size of Convolution',
    language: 'typescript',
    description: 'Given input dimensions (height, width), kernel size, stride, and padding, compute the output spatial dimensions of a 2D convolution.',
    hints: [
      'Output height = floor((H + 2*P - K) / S) + 1',
      'Same formula for width',
    ],
    starterCode: `function convOutputSize(
  inputH: number, inputW: number,
  kernelSize: number, stride: number, padding: number
): { outH: number; outW: number } {
  // Return output spatial dimensions
}`,
    solution: `function convOutputSize(
  inputH: number, inputW: number,
  kernelSize: number, stride: number, padding: number
): { outH: number; outW: number } {
  const outH = Math.floor((inputH + 2 * padding - kernelSize) / stride) + 1;
  const outW = Math.floor((inputW + 2 * padding - kernelSize) / stride) + 1;
  return { outH, outW };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does "weight sharing" in a convolutional layer mean?',
      options: [
        'All neurons share the same bias',
        'The same kernel weights are applied at every spatial position',
        'Weights are shared between layers',
        'Weights are averaged across the batch',
      ],
      answer: 1,
      explanation: 'A conv kernel slides across the input and uses the same weights at every position. This dramatically reduces parameters vs fully-connected layers and makes the network translation-equivariant.',
    },
    {
      q: 'What problem do ResNet skip connections solve?',
      options: [
        'Slow inference time',
        'Vanishing gradients in very deep networks',
        'Overfitting on small datasets',
        'High memory usage',
      ],
      answer: 1,
      explanation: 'Skip connections (x + F(x)) provide a direct gradient path from the loss to early layers. Even if F(x)=0, gradients flow through the identity path — enabling 100+ layer networks to train.',
    },
    {
      q: 'Why does transfer learning work with only 100 labelled examples?',
      options: [
        'The pre-trained model has already seen similar images in training',
        'Fine-tuning uses a different loss function',
        'The backbone extracts universal features (edges, textures) reusable for any task',
        'Transfer learning reduces the learning rate automatically',
      ],
      answer: 2,
      explanation: 'Early CNN layers learn universal low-level features (edges, gradients, textures) present in any natural image. These features transfer across tasks, so only the classification head needs to be learned from scratch.',
    },
  { q: 'What is the purpose of convolutional layers in a CNN?', options: ['To flatten the image into a vector', 'To learn local spatial features by sliding a learnable filter across the input', 'To normalize pixel values', 'To resize the image'], answer: 1, explanation: 'Convolutional layers apply learned filters (kernels) across the input, producing feature maps that detect local patterns (edges, textures, shapes). Parameters are shared across positions (translation invariance) — far fewer parameters than fully-connected layers.' },
  { q: 'What is transfer learning in computer vision?', options: ['Training a new model from scratch on the target dataset', 'Using a pretrained model (ImageNet-trained) as a feature extractor or starting point for fine-tuning on a new task', 'Copying labels from one dataset to another', 'Training on synthetic data only'], answer: 1, explanation: 'Transfer learning: use weights from a large pretrained model (ResNet, EfficientNet trained on ImageNet 1.4M images). For small datasets: freeze all layers, train only the classification head. For larger datasets: unfreeze and fine-tune the last few layers. Dramatically reduces data and compute needs.' },
  { q: 'What is object detection and how does it differ from image classification?', options: ['They are identical tasks', 'Classification: one label per image. Detection: find and locate multiple objects (bounding box + class label) in the image', 'Detection only classifies; classification locates objects', 'Detection requires simpler models'], answer: 1, explanation: 'Classification assigns a single class to an entire image. Object detection finds all instances of objects, drawing bounding boxes (coordinates) and assigning class labels. Models: YOLO (real-time), Faster R-CNN (higher accuracy), DETR (transformer-based).' },
  ];

  qna: QnaItem[] = [
    {
      q: 'When would I use a Vision Transformer (ViT) over a ResNet?',
      a: 'ViT outperforms CNNs when: (1) you have very large datasets (>1M images) — ViT\'s attention mechanism benefits more from scale; (2) you want to model long-range dependencies across the image (CNNs only see local receptive fields). ResNet is still better with limited data and compute because CNNs have useful inductive biases (locality, translation equivariance) that ViT must learn from scratch. Hybrid models (CvT, Swin Transformer) combine both.',
    },
    {
      q: 'What is the difference between stride and dilation in convolution?',
      a: 'Stride controls how far the kernel moves between positions — stride 2 halves spatial dimensions and skips some locations. Dilation (atrous convolution) inserts gaps between kernel elements, increasing the receptive field without adding parameters or losing resolution — useful in semantic segmentation (DeepLab) where you want large context but full resolution output.',
    },
  { q: 'How does data augmentation help in computer vision?', a: 'Data augmentation applies random transforms during training to artificially increase dataset diversity: flips, rotations, crops, color jitter, noise. Prevents overfitting by exposing the model to variations it will see in production. Advanced: Mixup (blend two images/labels), CutOut (erase random patches), AutoAugment (learn optimal augmentation policies). Use torchvision.transforms or Albumentations library.' },
  { q: 'What is image segmentation and what are its types?', a: 'Segmentation assigns a class label to every pixel. Types: (1) Semantic segmentation: each pixel gets a class label (sky, car, person) — no distinction between instances; (2) Instance segmentation: detects individual objects and segments each separately (Mask R-CNN); (3) Panoptic segmentation: combines both — semantic for background (sky, road) + instance for foreground objects. Used in autonomous driving, medical imaging.' },
  { q: 'What evaluation metrics are used for object detection?', a: 'Mean Average Precision (mAP): for each class, compute precision-recall curve at multiple IoU thresholds; AP = area under the curve. mAP = mean AP across all classes. COCO uses mAP@[0.5:0.95] (averaged over IoU thresholds from 0.5 to 0.95). IoU (Intersection over Union) measures predicted vs ground-truth box overlap: IoU = intersection area / union area. Threshold typically 0.5 or 0.75.' },
  { q: 'What is the Vision Transformer (ViT) and how does it differ from CNNs?', a: 'ViT splits the image into fixed-size patches (e.g., 16x16), embeds each patch as a token, and processes them with a standard Transformer encoder (self-attention). Unlike CNNs that use local receptive fields and translation invariance, ViT uses global self-attention from the start. ViT outperforms CNNs on large datasets but requires more data than CNNs for comparable performance on small datasets.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'CNNs slide kernels over images for local feature detection. MaxPool downsamples. ResNet skip connections enable deep networks. Transfer learning from ImageNet pre-trained models works with few examples.',
    mustKnow: [
      'Conv: kernel slides over input, dot product at each position — weight sharing',
      'Output size: floor((H + 2P − K) / S) + 1',
      'MaxPool: downsamples spatial dims, adds translation invariance',
      'ResNet: x + F(x) skip connections → solve vanishing gradient in deep nets',
      'Transfer learning: freeze backbone, train head, then fine-tune with tiny LR',
      'Always normalise with ImageNet mean/std when using pre-trained models',
    ],
    interviewFocus: [
      'What does a convolutional layer compute and why use weight sharing?',
      'How do skip connections in ResNet enable training very deep networks?',
      'What is the fine-tuning strategy for transfer learning?',
    ],
  };
}
