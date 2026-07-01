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
  selector: 'app-ai-neural-networks',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './neural-networks.html',
  styleUrl: './neural-networks.scss',
})
export class AiNeuralNetworks {
  quickRef: QuickRefItem[] = [
    { name: 'Perceptron',      type: 'keyword', desc: 'Single neuron: output = activation(w·x + b). Building block of all NNs.' },
    { name: 'ReLU',            type: 'function',desc: 'max(0, z). Default activation — no vanishing gradient for positive inputs.' },
    { name: 'Sigmoid',         type: 'function',desc: '1/(1+e^{-z}). Squashes to [0,1]. Vanishing gradient for large |z|.' },
    { name: 'Softmax',         type: 'function',desc: 'e^{zᵢ}/Σe^{zⱼ}. Multi-class output layer — probabilities sum to 1.' },
    { name: 'Backpropagation', type: 'keyword', desc: 'Chain rule applied backwards through the network to compute ∂L/∂w for all weights.' },
    { name: 'Adam',            type: 'keyword', desc: 'Adaptive moment estimation — adaptive learning rate per parameter. Default optimiser.' },
    { name: 'Dropout',         type: 'keyword', desc: 'Randomly zero out fraction of neurons during training — reduces co-adaptation, regularises.' },
    { name: 'Batch norm',      type: 'keyword', desc: 'Normalise activations per mini-batch — stabilises training, allows higher learning rates.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Network Architecture',
      points: [
        'A neural network is a stack of layers: input layer → hidden layers → output layer.',
        'Each neuron: z = w·x + b; output = activation(z). All neurons in a layer do this in parallel — it\'s a matrix multiply.',
        'Universal approximation theorem: a single hidden layer with enough neurons can approximate any continuous function. More layers = more efficient representation.',
        'Depth vs width: deeper networks learn hierarchical features (edges → shapes → objects). Width increases capacity at each level.',
        'Output layer activation depends on task: sigmoid (binary), softmax (multi-class), linear (regression).',
      ],
    },
    {
      heading: 'Activation Functions',
      points: [
        'ReLU (Rectified Linear Unit): f(z) = max(0,z). Solves vanishing gradient for positive z. Fast to compute. Default for hidden layers.',
        'Leaky ReLU: f(z) = z if z>0, else 0.01z. Prevents "dead ReLU" problem (neurons stuck at zero forever).',
        'Sigmoid: σ(z)=1/(1+e^{-z}). Only for binary output layer — saturates (gradient≈0) for |z|>4, causing vanishing gradients in deep nets.',
        'Tanh: (e^z−e^{-z})/(e^z+e^{-z}). Range (−1,1). Zero-centred unlike sigmoid — better gradient flow. Still saturates.',
        'GELU (Gaussian Error Linear Unit): used in Transformers. Smooth approximation of ReLU with slightly better empirical performance.',
      ],
    },
    {
      heading: 'Backpropagation',
      points: [
        'Forward pass: compute predictions layer by layer. Cache all intermediate values (activations, pre-activations).',
        'Compute loss: e.g. cross-entropy between predictions and true labels.',
        'Backward pass: starting from the loss, apply chain rule backwards through each layer to get ∂L/∂w for every weight.',
        'Key insight: ∂L/∂w_L = ∂L/∂a_L · ∂a_L/∂z_L · ∂z_L/∂w_L. Each term is just the local derivative of that layer.',
        'Vanishing gradient: if activation gradients are < 1 (sigmoid/tanh saturated), gradients shrink exponentially with depth. ReLU + ResNet skip connections solve this.',
      ],
    },
    {
      heading: 'Regularisation and Training Tricks',
      points: [
        'Dropout: randomly set fraction p of neurons to 0 during each forward pass. At inference, multiply by (1−p) or use inverted dropout. Forces neurons to not co-adapt.',
        'Batch Normalisation: normalise activations to zero mean, unit variance per mini-batch, then apply learnable scale and shift. Stabilises training, allows high learning rates, acts as regularisation.',
        'Weight initialisation: Xavier (sigmoid/tanh) or He (ReLU) initialisation avoids vanishing/exploding gradients at the start.',
        'Learning rate schedules: warm-up then cosine decay is standard for deep learning. Cyclical LR can escape local minima.',
        'Gradient clipping: cap gradient norm to a threshold (e.g. 1.0) — prevents exploding gradients in RNNs and Transformers.',
      ],
    },
    {
      heading: 'Vanishing and Exploding Gradients in Deep Networks',
      points: [
        'As gradients propagate backward through many layers during backpropagation, repeated multiplication by small weight values can shrink gradients toward zero (vanishing gradients), effectively preventing early layers of a deep network from learning at all.',
        'The opposite failure mode (exploding gradients) occurs when repeated multiplication by large weight values causes gradients to grow uncontrollably, leading to unstable training and numerical overflow — both failure modes stem from the same underlying repeated-multiplication mechanism.',
        'ReLU activation functions largely replaced sigmoid/tanh in hidden layers specifically because they do not saturate for positive inputs, meaningfully mitigating (though not eliminating) the vanishing gradient problem compared to activations that flatten out at extreme input values.',
        'Techniques like batch normalization, residual connections (skip connections), and careful weight initialization (Xavier/He initialization) were each developed specifically to combat these gradient pathologies, enabling the training of much deeper networks than were previously practical.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Forward Pass',
      language: 'typescript',
      code: `// Simple 2-layer neural network forward pass
function relu(z: number[]): number[] { return z.map(v => Math.max(0, v)); }

function softmax(z: number[]): number[] {
  const max = Math.max(...z);
  const exps = z.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

function matVec(W: number[][], x: number[], b: number[]): number[] {
  return W.map((row, i) => row.reduce((s, w, j) => s + w * x[j], b[i]));
}

// Network: input(d) → hidden(h, ReLU) → output(c, Softmax)
interface Layer { W: number[][]; b: number[]; }

function forwardPass(x: number[], layers: Layer[]): number[][] {
  const activations: number[][] = [x];
  let current = x;
  for (let i = 0; i < layers.length; i++) {
    const z = matVec(layers[i].W, current, layers[i].b);
    current = i < layers.length - 1 ? relu(z) : softmax(z);
    activations.push(current);
  }
  return activations;
}

// Cross-entropy loss
function crossEntropy(probs: number[], label: number): number {
  return -Math.log(probs[label] + 1e-15);
}`,
    },
    {
      label: 'PyTorch / Keras',
      language: 'typescript',
      code: `// PyTorch MLP for classification (Python pseudocode)
// import torch
// import torch.nn as nn
//
// class MLP(nn.Module):
//   def __init__(self, input_dim, hidden_dim, output_dim):
//     super().__init__()
//     self.net = nn.Sequential(
//       nn.Linear(input_dim, hidden_dim),
//       nn.ReLU(),
//       nn.Dropout(0.3),
//       nn.BatchNorm1d(hidden_dim),
//       nn.Linear(hidden_dim, hidden_dim),
//       nn.ReLU(),
//       nn.Linear(hidden_dim, output_dim)
//     )
//   def forward(self, x): return self.net(x)
//
// model = MLP(784, 256, 10)
// optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
// criterion = nn.CrossEntropyLoss()
//
// for epoch in range(20):
//   model.train()
//   for X_batch, y_batch in train_loader:
//     optimizer.zero_grad()
//     loss = criterion(model(X_batch), y_batch)
//     loss.backward()    # backpropagation
//     optimizer.step()   # gradient descent step

// Keras equivalent:
// model = tf.keras.Sequential([
//   tf.keras.layers.Dense(256, activation='relu', input_shape=(784,)),
//   tf.keras.layers.Dropout(0.3),
//   tf.keras.layers.Dense(256, activation='relu'),
//   tf.keras.layers.Dense(10, activation='softmax')
// ])
// model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
// model.fit(X_train, y_train, validation_split=0.1, epochs=20, batch_size=64)`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using sigmoid activation in hidden layers of deep networks',
      wrong: `# Sigmoid saturates: gradient ≈ 0 for |z| > 4
# In a 10-layer network, gradient shrinks exponentially → nothing learns`,
      right: `# Use ReLU (or Leaky ReLU, GELU) in all hidden layers
# Only use sigmoid in the BINARY OUTPUT layer`,
      explanation: 'Sigmoid\'s gradient approaches 0 for large |z|. In deep networks, multiplying many near-zero gradients (chain rule) makes early layers learn extremely slowly — the vanishing gradient problem.',
    },
    {
      title: 'Forgetting to call optimizer.zero_grad() in PyTorch',
      wrong: `for X_batch, y_batch in loader:
    loss = criterion(model(X_batch), y_batch)
    loss.backward()
    optimizer.step()  # gradients ACCUMULATE across batches!`,
      right: `for X_batch, y_batch in loader:
    optimizer.zero_grad()  # clear gradients from last step
    loss = criterion(model(X_batch), y_batch)
    loss.backward()
    optimizer.step()`,
      explanation: 'PyTorch accumulates gradients by default. Without zero_grad(), gradients from previous batches add to the current batch\'s gradients, producing incorrect updates.',
    },
    {
      title: 'Not applying Dropout differently during train vs inference',
      wrong: `# Dropout active during inference → predictions are non-deterministic, incorrect
model.train()   # leaves dropout ON
preds = model(X_test)  # wrong`,
      right: `model.eval()   # disables dropout and batch norm training behaviour
with torch.no_grad():
    preds = model(X_test)  # deterministic, correct`,
      explanation: 'Dropout randomly zeroes neurons — great for training, wrong for inference. model.eval() switches to inference mode. torch.no_grad() additionally saves memory by not tracking gradients.',
    },
    {
      title: 'Using a too-large learning rate with Adam',
      wrong: `optimizer = Adam(lr=0.1)  # too large — loss oscillates or diverges`,
      right: `optimizer = Adam(lr=1e-3)  # standard default for Adam
# Or use a schedule: warm up for 100 steps then cosine decay`,
      explanation: 'Adam\'s default learning rate is 1e-3 (0.001). Unlike SGD, Adam adapts per-parameter rates — a global rate of 0.1 typically diverges. Start with 1e-3 and tune from there.',
    },
  ];

  challenge: Challenge = {
    title: 'ReLU Forward & Backward',
    language: 'typescript',
    description: 'Implement ReLU activation and its gradient for backpropagation. Given pre-activation values z[], return the forward output and the gradient of the loss w.r.t. z given upstream gradient dOut[].',
    hints: [
      'ReLU forward: max(0, z)',
      'ReLU backward: gradient flows only where z > 0 (indicator function)',
      'dZ[i] = dOut[i] * (z[i] > 0 ? 1 : 0)',
    ],
    starterCode: `function reluForward(z: number[]): number[] {
  // Return ReLU activation
}

function reluBackward(z: number[], dOut: number[]): number[] {
  // Return gradient w.r.t. z given upstream gradient dOut
}`,
    solution: `function reluForward(z: number[]): number[] {
  return z.map(v => Math.max(0, v));
}

function reluBackward(z: number[], dOut: number[]): number[] {
  return z.map((v, i) => v > 0 ? dOut[i] : 0);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why is ReLU preferred over sigmoid for hidden layers in deep networks?',
      options: [
        'ReLU is easier to compute',
        'ReLU doesn\'t saturate for positive inputs, avoiding the vanishing gradient problem',
        'ReLU outputs probabilities',
        'ReLU has no hyperparameters',
      ],
      answer: 1,
      explanation: 'ReLU\'s gradient is 1 for positive z and 0 otherwise. No saturation for positive inputs means gradients don\'t shrink to zero as they flow backwards — enabling deep networks to train effectively.',
    },
    {
      q: 'What does Dropout do during training?',
      options: [
        'Removes layers with the lowest weights',
        'Randomly sets a fraction of neuron outputs to zero each forward pass',
        'Reduces the learning rate randomly',
        'Clips gradient norms',
      ],
      answer: 1,
      explanation: 'Dropout randomly zeroes a fraction p of neurons during each training forward pass. This prevents neurons from co-adapting and acts as an ensemble of many different sub-networks.',
    },
    {
      q: 'What is the purpose of Batch Normalisation?',
      options: [
        'Reduce the number of parameters',
        'Normalise layer inputs to zero mean/unit variance — stabilises training and allows higher learning rates',
        'Replace dropout',
        'Convert batch training to online training',
      ],
      answer: 1,
      explanation: 'Batch norm normalises activations per mini-batch, then applies learnable scale (γ) and shift (β). This reduces internal covariate shift, stabilises gradients, and allows larger learning rates.',
    },
  { q: 'What is vanishing gradient and how do ResNet skip connections solve it?', options: ['Gradients explode in deep networks', 'Gradients become very small in deep networks; skip connections add the input directly to the output, providing gradient highways', 'Batch norm prevents vanishing gradients completely', 'Skip connections increase model depth'], answer: 1, explanation: 'In deep networks, chained gradients through many sigmoid/tanh layers become very small (vanish). ResNet skip connections: output = F(x) + x. During backprop, the gradient flows directly through the skip (identity path) without multiplication — enabling 100+ layer networks.' },
  { q: 'What is the purpose of the Adam optimizer?', options: ['Replaces backpropagation', 'Adapts learning rates per parameter using estimates of first and second moments of gradients', 'Reduces overfitting through regularization', 'Normalizes batch inputs'], answer: 1, explanation: 'Adam: adaptive moment estimation. Maintains moving average of gradients (m) and squared gradients (v) per parameter. Update: w -= lr * m / (sqrt(v) + eps). Combines momentum (accelerates convergence) and RMSprop (adaptive LR). Default for most deep learning tasks.' },
  { q: 'What happens if the learning rate is too high or too low?', options: ['Too high converges faster; too low diverges', 'Too high: diverges (loss explodes); too low: slow convergence, may get stuck in local minima', 'Too high always reaches the global minimum', 'Too low: causes overfitting'], answer: 1, explanation: 'Too high LR: parameters jump around or diverge (loss = NaN). Too low LR: very slow training, may require more epochs than feasible, can get stuck in saddle points. Use learning rate warmup + cosine decay. Tools: learning rate finder (fast.ai range test).' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How does backpropagation actually compute gradients?',
      a: 'Backprop applies the chain rule starting from the loss and working backwards. For each layer l: (1) Receive gradient ∂L/∂a_l from the layer above. (2) Compute ∂L/∂z_l = ∂L/∂a_l · σ\'(z_l) (element-wise). (3) Compute ∂L/∂W_l = ∂L/∂z_l · a_{l-1}^T (weight gradient). (4) Pass ∂L/∂a_{l-1} = W_l^T · ∂L/∂z_l to the previous layer. Frameworks (PyTorch/JAX) build a computation graph and do this automatically.',
    },
    {
      q: 'When should I use a neural network vs a gradient-boosted tree?',
      a: 'Use gradient-boosted trees (XGBoost/LightGBM) for tabular/structured data — they typically win with less data and less tuning. Use neural networks for unstructured data (images, text, audio), when you need to learn representations, or when data is very large (>1M rows where GBMs slow down). Neural networks also shine when transfer learning is available (pretrained models fine-tuned on your task).',
    },
  { q: 'Why does backpropagation require storing intermediate activations from the forward pass, and what happens if you try to save memory by not storing them?', a: 'The backward pass computes each layer\'s gradient using the LOCAL Jacobian at that layer, which depends on that layer\'s specific input/output values from the forward pass (e.g. a ReLU\'s gradient is 0 or 1 depending on whether its specific input was negative or positive) — without those stored activations, the backward pass has no way to recompute the correct local gradient. This is exactly why training uses far more memory than inference: gradient checkpointing trades this off by deliberately NOT storing some activations and recomputing them on-demand during the backward pass, saving memory at the cost of extra forward-pass computation.' },
  { q: 'What is weight initialization and why does it matter?', a: 'Bad initialization (all zeros: all neurons compute same gradients, symmetry not broken; large random values: vanishing or exploding gradients). Good initialization: Xavier/Glorot (tanh/sigmoid layers): weights drawn from N(0, 2/(fan_in + fan_out)). He initialization (ReLU layers): N(0, 2/fan_in). PyTorch applies He init for linear/conv layers by default. Goal: keep activation and gradient variances roughly equal across layers.' },
  { q: 'What is the difference between overfitting and underfitting?', a: 'Underfitting: model is too simple to capture the pattern — high training AND validation loss. Signals: training accuracy is low. Fix: increase model capacity (more layers, wider layers), reduce regularization, train longer. Overfitting: model memorizes training data — low training loss but high validation loss. Signals: training accuracy >> validation accuracy. Fix: more data, data augmentation, dropout, L1/L2 regularization, early stopping.' },
  { q: 'How do you implement transfer learning with a pretrained CNN?', a: 'Step 1: Load pretrained model (ResNet, EfficientNet). Step 2: Replace the final classification head with new layers matching your number of classes. Step 3a (feature extraction): freeze all base layers (requires_grad=False), train only the head — fast, good for small datasets. Step 3b (fine-tuning): unfreeze the last few layers and train with a small learning rate — better for larger datasets. Use a smaller learning rate for pretrained layers vs new head to avoid destroying learned features.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'NNs stack layers of neurons (weight·input + bias → activation). ReLU for hidden, softmax for output. Train via backprop + Adam. Regularise with dropout and batch norm.',
    mustKnow: [
      'Neuron: z = w·x + b; output = activation(z)',
      'ReLU in hidden layers; sigmoid/softmax at output',
      'Forward pass: compute activations; backward pass: chain rule for gradients',
      'Vanishing gradient: solved by ReLU + ResNet skip connections',
      'Dropout randomly zeroes neurons during training → regularisation',
      'Batch norm normalises activations → stable training, higher LR possible',
    ],
    interviewFocus: [
      'Explain backpropagation using the chain rule',
      'Why use ReLU over sigmoid in hidden layers?',
      'What does dropout do and when is it applied?',
    ],
  };
}
