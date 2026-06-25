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
  selector: 'app-ai-math-for-ml',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './math-for-ml.html',
  styleUrl: './math-for-ml.scss',
})
export class AiMathForMl {
  quickRef: QuickRefItem[] = [
    { name: 'Dot product',       type: 'operator', desc: 'a·b = Σaᵢbᵢ = |a||b|cos(θ). Measures similarity; used in attention scores.' },
    { name: 'Matrix multiply',   type: 'operator', desc: 'C[i,j] = Σₖ A[i,k]·B[k,j]. Core of every layer in a neural network.' },
    { name: 'Transpose',         type: 'operator', desc: 'A^T flips rows/cols. (AB)^T = B^T A^T.' },
    { name: 'Gradient',          type: 'keyword',  desc: 'Vector of partial derivatives — points in the direction of steepest ascent of a function.' },
    { name: 'Chain rule',        type: 'syntax',   desc: 'd/dx[f(g(x))] = f\'(g(x))·g\'(x). Foundation of backpropagation.' },
    { name: 'Softmax',           type: 'function', desc: 'Maps logit vector to probabilities: σ(z)ᵢ = e^zᵢ / Σe^zⱼ.' },
    { name: 'Bayes theorem',     type: 'syntax',   desc: 'P(A|B) = P(B|A)·P(A)/P(B). Update prior beliefs with evidence.' },
    { name: 'Eigenvalue',        type: 'keyword',  desc: 'Av = λv — a vector v unchanged in direction by matrix A, scaled by λ. Core to PCA.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Linear Algebra Essentials',
      points: [
        'Vectors: ordered list of numbers. A data point with n features is a vector in R^n. Two vectors are similar if their dot product is high.',
        'Matrices: 2D arrays of numbers. A fully-connected layer is just a matrix multiplication: output = W·input + b.',
        'Matrix multiplication: (m×k) · (k×n) = (m×n). Inner dimensions must match. Order matters: AB ≠ BA in general.',
        'Transpose: A^T swaps rows and columns. Used constantly in attention: QK^T computes all query-key dot products in one operation.',
        'Eigendecomposition: A = QΛQ^T. PCA finds the eigenvectors of the covariance matrix — the directions of maximum variance.',
      ],
    },
    {
      heading: 'Calculus for ML',
      points: [
        'Derivative: rate of change of f at a point. ∂L/∂w tells us how much the loss L changes when we nudge weight w.',
        'Partial derivative: hold all other variables constant. For a function of many weights, compute one partial per weight.',
        'Gradient: vector of all partial derivatives ∇L. Points uphill — we go in the negative gradient direction to descend.',
        'Chain rule: d/dx[f(g(x))] = f\'(g(x))·g\'(x). Backpropagation applies the chain rule recursively from output to input.',
        'Jacobian: matrix of partial derivatives for vector-valued functions. Used in deep learning for layer-by-layer gradient flow.',
      ],
    },
    {
      heading: 'Probability and Statistics',
      points: [
        'Probability: P(A) ∈ [0,1]. P(A∪B) = P(A)+P(B)−P(A∩B). Conditional probability: P(A|B) = P(A∩B)/P(B).',
        'Bayes theorem: P(hypothesis|evidence) = P(evidence|hypothesis)·P(hypothesis)/P(evidence). Used in Naive Bayes and Bayesian deep learning.',
        'Expectation E[X] = Σxᵢ·p(xᵢ). Variance Var(X) = E[(X−μ)²]. Standard deviation σ = √Var.',
        'Gaussian/Normal distribution: bell curve parameterised by μ (mean) and σ². Many natural phenomena and loss functions assume normality.',
        'KL divergence: D_KL(P||Q) = Σ P(x)·log(P(x)/Q(x)). Measures how different distribution Q is from the true distribution P. Used in RLHF and VAEs.',
      ],
    },
    {
      heading: 'Key Functions in ML',
      points: [
        'Sigmoid: σ(z) = 1/(1+e^{-z}). Maps reals to [0,1]. Saturates (gradient ≈ 0) for large |z| — vanishing gradient problem.',
        'ReLU: max(0,z). No saturation for positive inputs. Simple, fast. Dead neurons if input always negative.',
        'Softmax: σ(z)ᵢ = e^{zᵢ}/Σe^{zⱼ}. Turns logits into a probability distribution summing to 1. Used in classification output layers.',
        'Log-sum-exp trick: compute log(Σe^{zᵢ}) = max + log(Σe^{zᵢ-max}) for numerical stability — prevents overflow.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Linear Algebra',
      language: 'typescript',
      code: `// Matrix multiply (m×k) · (k×n) = (m×n)
function matmul(A: number[][], B: number[][]): number[][] {
  const m = A.length, k = A[0].length, n = B[0].length;
  const C = Array.from({length: m}, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      for (let p = 0; p < k; p++)
        C[i][j] += A[i][p] * B[p][j];
  return C;
}

// Dot product (cosine similarity used in vector search)
function dot(a: number[], b: number[]): number {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}
function cosineSimilarity(a: number[], b: number[]): number {
  const normA = Math.sqrt(dot(a, a));
  const normB = Math.sqrt(dot(b, b));
  return dot(a, b) / (normA * normB);
}

// Transpose
function transpose(A: number[][]): number[][] {
  return A[0].map((_, j) => A.map(row => row[j]));
}

// Usage — attention score: Q · K^T
const Q = [[1, 0, 1], [0, 1, 0]];   // 2×3 query matrix
const K = [[1, 0, 1], [1, 1, 0]];   // 2×3 key matrix
const scores = matmul(Q, transpose(K));  // 2×2 attention scores`,
    },
    {
      label: 'Calculus & Gradient',
      language: 'typescript',
      code: `// Numerical gradient (finite difference approximation)
function numericalGradient(f: (x: number[]) => number, x: number[], eps = 1e-5): number[] {
  return x.map((_, i) => {
    const xPlus  = [...x]; xPlus[i]  += eps;
    const xMinus = [...x]; xMinus[i] -= eps;
    return (f(xPlus) - f(xMinus)) / (2 * eps);
  });
}

// Example: gradient of MSE loss w.r.t. weight w
// MSE(w) = mean((w*X - y)^2)
const X = [1, 2, 3, 4, 5];
const y = [2, 4, 6, 8, 10];
const mse = (params: number[]) => {
  const [w] = params;
  return X.reduce((s, x, i) => s + (w*x - y[i])**2, 0) / X.length;
};
const grad = numericalGradient(mse, [1.0]);
console.log('Gradient at w=1:', grad);  // Should be near 0 (minimum)

// Chain rule visualisation
// L = (y_pred - y)^2; y_pred = w*x
// dL/dw = dL/dy_pred * dy_pred/dw = 2*(y_pred-y) * x
function analyticalGradientW(w: number): number {
  return X.reduce((s, x, i) => s + 2*(w*x - y[i])*x, 0) / X.length;
}`,
    },
    {
      label: 'Probability',
      language: 'typescript',
      code: `// Softmax — turns logits into probabilities
function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);  // log-sum-exp trick for stability
  const exps = logits.map(z => Math.exp(z - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

// Bayes theorem: P(spam|word) = P(word|spam) * P(spam) / P(word)
function bayesUpdate(priorSpam: number, pWordGivenSpam: number, pWordGivenHam: number): number {
  const priorHam = 1 - priorSpam;
  const pWord = pWordGivenSpam * priorSpam + pWordGivenHam * priorHam;
  return (pWordGivenSpam * priorSpam) / pWord;
}

// KL divergence D(P||Q) — measures divergence of Q from P
function klDivergence(P: number[], Q: number[]): number {
  return P.reduce((sum, p, i) => {
    if (p === 0) return sum;
    return sum + p * Math.log(p / Q[i]);
  }, 0);
}

// Gaussian PDF
function gaussianPDF(x: number, mu: number, sigma: number): number {
  return Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Confusing matrix multiplication order',
      wrong: `// (3×2) · (3×2) — inner dims don't match, will error
const A = [[1,2],[3,4],[5,6]];  // 3×2
const B = [[7,8],[9,10],[11,12]];  // 3×2
const C = matmul(A, B);  // WRONG — need B to be 2×n`,
      right: `const A = [[1,2],[3,4],[5,6]];   // 3×2
const B = [[7,8,9],[10,11,12]];  // 2×3
const C = matmul(A, B);  // (3×2)·(2×3) = (3×3) ✓`,
      explanation: 'Matrix multiply requires inner dimensions to match: (m×k)·(k×n). Always check shapes before multiplying. The result has shape (m×n).',
    },
    {
      title: 'Not subtracting max in softmax (numerical instability)',
      wrong: `function softmax(z: number[]) {
  const exps = z.map(v => Math.exp(v));  // e^1000 = Infinity!
  const sum = exps.reduce((a,b) => a+b, 0);
  return exps.map(e => e / sum);
}`,
      right: `function softmax(z: number[]) {
  const max = Math.max(...z);  // subtract max for stability
  const exps = z.map(v => Math.exp(v - max));
  const sum = exps.reduce((a,b) => a+b, 0);
  return exps.map(e => e / sum);  // same result, no overflow
}`,
      explanation: 'e^1000 overflows to Infinity. Subtracting max before exponentiation keeps exponents in a safe range without changing the softmax result (numerator and denominator both scaled the same way).',
    },
    {
      title: 'Confusing gradient direction with descent direction',
      wrong: `// Gradient points uphill — we go uphill toward maximum?
w += learningRate * gradient;  // gradient ASCENT — wrong for minimisation`,
      right: `w -= learningRate * gradient;  // gradient DESCENT — step downhill`,
      explanation: 'The gradient points in the direction of steepest ASCENT. To minimise a loss function we subtract the gradient (go downhill).',
    },
    {
      title: 'Using raw probabilities in log-loss instead of log-probabilities',
      wrong: `const loss = -(y * prob + (1-y) * (1-prob));  // no log — not cross-entropy`,
      right: `const eps = 1e-15;  // avoid log(0)
const loss = -(y * Math.log(prob + eps) + (1-y) * Math.log(1-prob + eps));`,
      explanation: 'Binary cross-entropy uses logarithms: −[y·log(p) + (1−y)·log(1−p)]. The raw probability version doesn\'t provide the correct gradient signal for classification.',
    },
  ];

  challenge: Challenge = {
    title: 'Scaled Dot-Product Attention Score',
    language: 'typescript',
    description: 'Implement the scaled dot-product attention score: softmax(QK^T / √d_k). Given query Q (1×d) and keys K (n×d), return the attention weight vector (length n).',
    hints: [
      'Compute dot product of Q with each row of K',
      'Scale by 1/sqrt(d_k) to prevent large dot products',
      'Apply softmax to get attention weights',
    ],
    starterCode: `function scaledDotProductAttention(
  query: number[],    // shape: [d_k]
  keys: number[][],   // shape: [n, d_k]
): number[] {
  // Return attention weights (length n)
}`,
    solution: `function scaledDotProductAttention(
  query: number[],
  keys: number[][],
): number[] {
  const dk = query.length;
  const scale = Math.sqrt(dk);
  // Dot product of query with each key, scaled
  const scores = keys.map(k =>
    k.reduce((s, v, i) => s + v * query[i], 0) / scale
  );
  // Softmax
  const max = Math.max(...scores);
  const exps = scores.map(s => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the result shape of multiplying a (3×4) matrix by a (4×2) matrix?',
      options: ['3×2', '4×4', '3×4', '2×3'],
      answer: 0,
      explanation: '(m×k)·(k×n) = (m×n). Here m=3, k=4, n=2, so the result is 3×2.',
    },
    {
      q: 'Why is the gradient subtracted (not added) in gradient descent?',
      options: [
        'Convention only',
        'The gradient points uphill; we subtract to go downhill and minimise loss',
        'Gradient descent minimises the gradient, not the loss',
        'Addition would be too slow',
      ],
      answer: 1,
      explanation: 'The gradient ∇L points in the direction of steepest increase. Subtracting it moves us toward lower loss — hence "descent".',
    },
    {
      q: 'What does the chain rule enable in neural networks?',
      options: [
        'Initialising weights randomly',
        'Computing gradients of the loss with respect to all weights via backpropagation',
        'Selecting the learning rate automatically',
        'Parallelising matrix multiplications',
      ],
      answer: 1,
      explanation: 'Backpropagation applies the chain rule recursively from the output layer backwards, computing ∂L/∂w for every weight without re-deriving from scratch.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How much maths do I actually need to know to use ML in practice?',
      a: 'For applied ML/LLM engineering, you need intuition more than derivations: understand what a gradient is (slope), what a matrix multiply does (linear transformation), what softmax produces (probability distribution), and what KL divergence measures (distribution difference). You rarely derive backprop by hand. But knowing the maths helps when debugging — if loss is NaN, understanding overflow is essential.',
    },
    {
      q: 'Why does the attention mechanism divide by √d_k?',
      a: 'Without scaling, dot products grow with d_k: if each element is ~N(0,1), the dot product has variance d_k, so std dev is √d_k. Large dot products push softmax into regions with near-zero gradients (saturation). Dividing by √d_k keeps variance ≈ 1 and gradients healthy during training.',
    },
    {
      q: 'What is the difference between L1 and L2 regularisation?',
      a: 'L2 (Ridge) adds λ·||w||² to the loss — it penalises large weights, pushing them toward zero but rarely exactly to zero. L1 (Lasso) adds λ·||w||₁ — it produces sparse weights (many exactly zero) because the L1 penalty has a sharp corner at zero that creates a zero-gradient region. Use L1 for feature selection, L2 when you want all features but smaller coefficients.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'ML maths: matrix multiply = neural network layer; gradient = slope of loss; chain rule = backprop; softmax = probabilities; Bayes = prior × likelihood / evidence.',
    mustKnow: [
      'Matrix multiply: (m×k)·(k×n) = (m×n). Inner dims must match.',
      'Dot product measures similarity; cosine similarity = dot / (|a|·|b|)',
      'Gradient points uphill — subtract it to descend',
      'Chain rule enables backprop: compose partial derivatives layer by layer',
      'Softmax: subtract max before exp for numerical stability',
      'Bayes theorem: posterior ∝ likelihood × prior',
    ],
    interviewFocus: [
      'Why divide attention scores by √d_k?',
      'Explain backpropagation using the chain rule',
      'L1 vs L2 regularisation — when to use each',
    ],
  };
}
