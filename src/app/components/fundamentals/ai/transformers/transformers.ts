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
  selector: 'app-ai-transformers',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './transformers.html',
  styleUrl: './transformers.scss',
})
export class AiTransformers {
  quickRef: QuickRefItem[] = [
    { name: 'Self-attention',    type: 'keyword', desc: 'Each token attends to all other tokens — captures long-range dependencies.' },
    { name: 'Q, K, V',          type: 'keyword', desc: 'Query, Key, Value — linearly projected from input. Score = QK^T/√d_k; output = score · V.' },
    { name: 'Scaled dot-product',type:'function', desc: 'Attention(Q,K,V) = softmax(QK^T/√d_k)·V. Scaling prevents gradient saturation.' },
    { name: 'Multi-head attention',type:'keyword',desc: 'Run h attention heads in parallel with different projections — captures diverse relationships.' },
    { name: 'Positional encoding',type:'keyword', desc: 'Adds sequence position info to token embeddings — Transformer has no inherent order.' },
    { name: 'FFN',               type: 'keyword', desc: 'Feed-forward network after attention in each encoder/decoder block: two linear layers + ReLU.' },
    { name: 'Encoder',           type: 'keyword', desc: 'Bidirectional: attends to full sequence. Used in BERT for understanding tasks.' },
    { name: 'Decoder',           type: 'keyword', desc: 'Causal (masked): attends only to past tokens. Used in GPT for generation.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Self-Attention Mechanism',
      points: [
        'For each token, compute Query (Q), Key (K), Value (V) via learned linear projections: Q=XW_Q, K=XW_K, V=XW_V.',
        'Attention score: A = softmax(QK^T / √d_k). The score matrix A[i,j] represents how much token i should attend to token j.',
        'Output: weighted sum of values — O = A·V. Each output token is a mixture of all value vectors weighted by attention scores.',
        'Scaling by √d_k: without scaling, dot products grow with dimension and push softmax into near-zero gradient regions.',
        'Self-attention is O(n²) in sequence length — quadratic cost is the core scaling challenge of Transformers.',
      ],
    },
    {
      heading: 'Multi-Head Attention',
      points: [
        'Run h attention heads in parallel, each with its own Q, K, V projection matrices.',
        'Each head can specialise in a different relationship: one head for syntactic dependencies, another for coreference, etc.',
        'Concatenate all head outputs, project back to model dimension: MHA(Q,K,V) = Concat(head₁,...,headₕ)·W_O.',
        'Parameter count: h heads with d_k = d_model/h — same total params as single-head, but richer representations.',
      ],
    },
    {
      heading: 'Positional Encoding and Architecture',
      points: [
        'Attention is permutation-invariant — reordering tokens gives the same output. Positional encoding injects order.',
        'Sinusoidal encoding (original Transformer): PE[pos,2i] = sin(pos/10000^{2i/d}); PE[pos,2i+1] = cos(...).',
        'Learned positional embeddings (BERT, GPT): train a separate embedding table for positions — simpler and often better.',
        'Rotary Position Embedding (RoPE): encodes relative position in the QK dot product — used in LLaMA, GPT-NeoX.',
        'Transformer block: LayerNorm → Multi-Head Attention → residual; LayerNorm → FFN → residual. Residuals stabilise training.',
      ],
    },
    {
      heading: 'Encoder vs Decoder',
      points: [
        'Encoder (BERT-style): each token attends to all tokens bidirectionally. Good for understanding — classification, NER, Q&A.',
        'Decoder (GPT-style): causal masking — token i can only attend to tokens 1..i. Good for generation (next-token prediction).',
        'Encoder-decoder (T5, BART): encoder processes the input, decoder generates output cross-attending to encoder outputs. Good for seq2seq: translation, summarisation.',
        'Modern LLMs (GPT-4, Claude, Llama) are decoder-only — simpler, scales better with more data and compute.',
      ],
    },
    {
      heading: 'Why Self-Attention Replaced Recurrent Architectures',
      points: [
        'Recurrent networks (RNNs, LSTMs) process sequences step by step, meaning computation for position N cannot start until position N-1 finishes — this sequential dependency prevents parallelization across the sequence length during training, a major performance bottleneck.',
        'Self-attention computes relationships between all positions in a sequence simultaneously via matrix operations, allowing full parallelization across the sequence during training — a major reason transformers train dramatically faster than RNNs on modern parallel hardware (GPUs/TPUs).',
        'RNNs struggle to retain information from far earlier in a long sequence (the vanishing gradient problem compounds over many sequential steps) — self-attention directly connects every position to every other position regardless of distance, avoiding this long-range dependency degradation.',
        'The tradeoff for this parallelism and long-range modeling is quadratic computational cost in sequence length (every position attends to every other position) — this is why handling very long contexts efficiently remains an active area of transformer architecture research.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Scaled Dot-Product Attention',
      language: 'typescript',
      code: `// Scaled dot-product attention: Attention(Q,K,V) = softmax(QK^T/√d_k) · V
function matmul(A: number[][], B: number[][]): number[][] {
  const m = A.length, k = A[0].length, n = B[0].length;
  return Array.from({length: m}, (_, i) =>
    Array.from({length: n}, (__, j) =>
      Array.from({length: k}, (___, p) => A[i][p] * B[p][j]).reduce((a,b)=>a+b,0)
    )
  );
}

function transpose(A: number[][]): number[][] {
  return A[0].map((_, j) => A.map(row => row[j]));
}

function softmax2d(A: number[][]): number[][] {
  return A.map(row => {
    const max = Math.max(...row);
    const exps = row.map(v => Math.exp(v - max));
    const sum = exps.reduce((a,b) => a+b, 0);
    return exps.map(e => e / sum);
  });
}

function scaledDotProductAttention(
  Q: number[][], K: number[][], V: number[][], mask?: boolean[][]
): number[][] {
  const dk = Q[0].length;
  // Score: Q · K^T / sqrt(d_k)
  let scores = matmul(Q, transpose(K)).map(row => row.map(v => v / Math.sqrt(dk)));
  // Optional causal mask: set future positions to -infinity
  if (mask) {
    for (let i = 0; i < scores.length; i++)
      for (let j = 0; j < scores[0].length; j++)
        if (mask[i][j]) scores[i][j] = -Infinity;
  }
  // Attention weights: softmax of scores
  const attnWeights = softmax2d(scores);
  // Output: weights · V
  return matmul(attnWeights, V);
}`,
    },
    {
      label: 'Causal Mask',
      language: 'typescript',
      code: `// Causal (decoder) mask — token i can only see tokens 0..i
function causalMask(seqLen: number): boolean[][] {
  return Array.from({length: seqLen}, (_, i) =>
    Array.from({length: seqLen}, (__, j) => j > i)  // true = masked (future)
  );
}

// Example: 4-token sequence
// causalMask(4):
// [[false, true,  true,  true ],   // token 0 sees only itself
//  [false, false, true,  true ],   // token 1 sees 0,1
//  [false, false, false, true ],   // token 2 sees 0,1,2
//  [false, false, false, false]]   // token 3 sees all

// Positional encoding (sinusoidal)
function positionalEncoding(seqLen: number, dModel: number): number[][] {
  return Array.from({length: seqLen}, (_, pos) =>
    Array.from({length: dModel}, (__, i) =>
      i % 2 === 0
        ? Math.sin(pos / Math.pow(10000, i / dModel))
        : Math.cos(pos / Math.pow(10000, (i - 1) / dModel))
    )
  );
}

// Multi-head attention (conceptual — single head shown)
// In PyTorch: nn.MultiheadAttention(embed_dim, num_heads)
// output, attn_weights = mha(query, key, value, attn_mask=causal_mask)`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting to scale attention scores by √d_k',
      wrong: `// scores = Q @ K.T  — no scaling
// For d_k=64: dot products have std ≈ 8 → softmax saturates → gradients vanish`,
      right: `// scores = Q @ K.T / sqrt(d_k)  — scaled
// Keeps std ≈ 1 → softmax operates in a healthy gradient range`,
      explanation: 'Without scaling, dot products grow with d_k, pushing softmax into near-saturation regions with near-zero gradients. Dividing by √d_k keeps the variance of scores at ~1.',
    },
    {
      title: 'Confusing encoder (BERT) and decoder (GPT) attention',
      wrong: `// Using bidirectional (full) attention for text generation
// Token 2 can see token 5 — cheating on next-token prediction!`,
      right: `// Decoder uses CAUSAL mask: token i only attends to tokens 0..i
// Encoder uses full attention (no mask) — appropriate for classification`,
      explanation: 'GPT-style decoders must mask future tokens to enforce causality — the model must only use past context to predict the next token. BERT-style encoders use full bidirectional attention because they\'re not generating.',
    },
    {
      title: 'Not using positional encoding',
      wrong: `// Input: just token embeddings
// Transformer is permutation-invariant — "dog bites man" = "man bites dog"!`,
      right: `// Add positional encoding to token embeddings
// input = token_embedding + positional_embedding`,
      explanation: 'Self-attention has no inherent sense of token order. Without positional encoding, "cat sat on the mat" and "mat the on sat cat" would produce identical representations.',
    },
    {
      title: 'Confusing pre-norm and post-norm Transformers',
      wrong: `// Original "post-norm": residual → LayerNorm
// x = LayerNorm(x + Attention(x))  — unstable training for very deep models`,
      right: `// Modern "pre-norm": LayerNorm → sub-layer → residual
// x = x + Attention(LayerNorm(x))  — more stable, used by GPT-2, LLaMA, etc.`,
      explanation: 'Pre-norm (apply LayerNorm before each sub-layer, not after) produces more stable gradients in very deep Transformers. Most modern LLMs use pre-norm. The original "Attention Is All You Need" paper used post-norm.',
    },
  ];

  challenge: Challenge = {
    title: 'Attention Weights',
    language: 'typescript',
    description: 'Given a single query vector (length d_k), a list of key vectors (n×d_k), compute the attention weights using scaled dot-product attention (without V multiplication).',
    hints: [
      'Score for each key: dot(query, key) / sqrt(d_k)',
      'Apply softmax to the n scores to get weights',
    ],
    starterCode: `function attentionWeights(query: number[], keys: number[][]): number[] {
  // Return softmax attention weights (length n)
}`,
    solution: `function attentionWeights(query: number[], keys: number[][]): number[] {
  const dk = query.length;
  const scores = keys.map(k =>
    k.reduce((s, v, i) => s + v * query[i], 0) / Math.sqrt(dk)
  );
  const max = Math.max(...scores);
  const exps = scores.map(s => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why is the attention score divided by √d_k?',
      options: [
        'To normalise the output to [0,1]',
        'To prevent large dot products that push softmax into saturation and cause vanishing gradients',
        'To reduce computation cost',
        'To enforce causality',
      ],
      answer: 1,
      explanation: 'For d_k-dimensional Q and K with unit-normal elements, the dot product has std = √d_k. Dividing by √d_k normalises variance to ~1, keeping softmax in a regime with good gradients.',
    },
    {
      q: 'What is the role of the causal mask in a decoder Transformer?',
      options: [
        'To ignore padding tokens',
        'To prevent tokens from attending to future positions during training',
        'To reduce memory usage',
        'To apply dropout to the attention matrix',
      ],
      answer: 1,
      explanation: 'During training, the decoder sees the entire target sequence. The causal mask sets attention scores to −∞ for future positions (j>i), so softmax gives them 0 weight — enforcing autoregressive causality.',
    },
    {
      q: 'What is the key benefit of multi-head attention over single-head?',
      options: [
        'Fewer parameters per head',
        'Each head can learn different types of relationships in the data in parallel',
        'Multi-head is always faster',
        'It removes the need for positional encoding',
      ],
      answer: 1,
      explanation: 'Different attention heads specialise in different relationships (e.g. syntactic vs semantic). Concatenating their outputs gives richer representations than a single attention head could capture.',
    },
  { q: 'What is self-attention and what does it compute?', options: ['Attention to previous token only', 'For each token, a weighted sum of all other token representations based on query-key dot product similarities', 'A convolutional operation over tokens', 'A recurrent computation over sequence positions'], answer: 1, explanation: 'Self-attention: each token computes a query, key, and value. Attention weights = softmax(Q*K^T / sqrt(d_k)). Output = weighted sum of values. Each token attends to all others simultaneously — captures long-range dependencies in O(1) layers but O(n^2) compute.' },
  { q: 'What is the purpose of positional encoding in transformers?', options: ['To normalize input embeddings', 'To inject sequence position information since self-attention has no inherent order', 'To reduce the number of attention heads', 'To add regularization'], answer: 1, explanation: 'Self-attention is permutation-equivariant — it does not know which token comes first. Positional encoding adds position information to token embeddings. Original: sine/cosine waves of different frequencies. Modern: Rotary Position Encoding (RoPE) or ALiBi for length generalization.' },
  { q: 'What is the difference between encoder-only, decoder-only, and encoder-decoder transformer architectures?', options: ['They differ only in number of layers', 'Encoder-only: bidirectional (BERT, classification); decoder-only: autoregressive (GPT, generation); encoder-decoder: sequence-to-sequence (T5, translation)', 'Decoder-only cannot generate text', 'Encoder-only is for generation tasks'], answer: 1, explanation: 'Encoder-only (BERT): bidirectional self-attention, good for understanding tasks (classification, NER, semantic similarity). Decoder-only (GPT family): causal (left-to-right) self-attention, autoregressive generation. Encoder-decoder (T5, BART): encoder processes input bidirectionally, decoder generates output.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why is self-attention O(n²) and what are the solutions?',
      a: 'Computing the n×n attention score matrix requires n² dot products — quadratic in sequence length. For 128K tokens, that\'s 16 billion operations. Solutions: (1) Sparse attention (Longformer): attend to a window + global tokens. (2) Flash Attention: IO-aware implementation that tiles computation in SRAM — same complexity but 2-4× faster in practice. (3) Linear attention approximations (Mamba, RWKV): reformulate as recurrence — O(n) but weaker expressiveness.',
    },
    {
      q: 'What is the difference between BERT and GPT architecturally?',
      a: 'BERT: encoder-only, bidirectional attention (every token sees all others), pre-trained with masked language modelling (predict masked tokens). Best for understanding tasks: classification, NER, Q&A. GPT: decoder-only, causal attention (each token sees only past), pre-trained with next-token prediction. Best for generation. The architectural choice drives everything downstream — BERT-style models cannot generate autoregressively without modification.',
    },
  { q: 'Does splitting attention into more heads increase the total number of parameters compared to a single-head attention layer of the same model dimension?', a: 'No — multi-head attention is designed so the total parameter count stays roughly the same as a single-head layer of the same overall d_model: instead of one head computing Q/K/V at the full d_model dimension, h heads each compute Q/K/V at the smaller dimension d_model/h, so the combined Q/K/V projection matrices across all heads are the same total size as one large single-head projection would be. The benefit isn\'t more parameters — it\'s that splitting the same capacity into multiple smaller subspaces lets different heads specialize in different types of relationships (syntax, coreference, position) that a single attention computation over the full dimension could not represent simultaneously.' },
  { q: 'What is KV cache and how does it speed up transformer inference?', a: 'During autoregressive generation, at each step the model recomputes all previous token K and V values — O(n^2) total work for n tokens. KV cache: store the K and V matrices from previous steps; on each new token, only compute K/V for the new token and append to the cache. Reduces generation from O(n^2) to O(n) per new token. Tradeoff: large memory footprint (grows with context length and batch size).' },
  { q: 'What is Flash Attention and why is it important?', a: 'Flash Attention (Dao et al.): a hardware-efficient implementation of self-attention that avoids materializing the full n*n attention matrix in GPU HBM. Uses tiling to compute attention in SRAM blocks, reducing memory from O(n^2) to O(n). 2-4x faster than standard attention on GPUs, enables longer context windows. Flash Attention 2 and 3 further improve throughput. It is now the default attention implementation in most LLM training frameworks.' },
  { q: 'What is instruction tuning and how does it differ from pretraining?', a: 'Pretraining: train on massive text corpora with next-token prediction — learns language structure and world knowledge but produces a text completer (base model). Instruction tuning (SFT): fine-tune on curated instruction-response pairs — teaches the model to follow directions, answer questions, be helpful. RLHF/DPO further aligns the model with human preferences. The progression: base model -> SFT -> RLHF produces a chat model like ChatGPT or Claude.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Attention(Q,K,V) = softmax(QK^T/√d_k)·V — each token gathers from all others. Multi-head learns diverse relations. Encoder = bidirectional; decoder = causal. Positional encoding adds order.',
    mustKnow: [
      'Q, K, V = linear projections of input. Score = QK^T/√d_k',
      'Softmax of scores = attention weights; output = weights·V',
      'Scaling by √d_k prevents softmax saturation and vanishing gradients',
      'Multi-head: h parallel heads, concatenate outputs, project',
      'Causal mask: set future positions to −∞ before softmax',
      'Encoder = full attention (BERT); decoder = causal (GPT)',
    ],
    interviewFocus: [
      'Walk through scaled dot-product attention step by step',
      'Why do we need positional encoding in Transformers?',
      'Encoder vs decoder — when to use each?',
    ],
  };
}
