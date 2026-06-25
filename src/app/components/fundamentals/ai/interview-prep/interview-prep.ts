import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';

@Component({
  selector: 'app-ai-interview-prep',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class AiInterviewPrep {
  quickRef: QuickRefItem[] = [
    { name: 'Bias-variance',     type: 'keyword', desc: 'Underfitting = high bias; overfitting = high variance. Sweet spot in the middle.' },
    { name: 'Gradient descent',  type: 'keyword', desc: 'w ← w − η·∂L/∂w. Update weights in direction that reduces loss.' },
    { name: 'Attention formula', type: 'function',desc: 'softmax(QK^T/√d_k)·V — the core of every Transformer.' },
    { name: 'LoRA rank r',       type: 'keyword', desc: 'ΔW = A·B, r << d. Trains 0.1–1% of params while preserving base model.' },
    { name: 'RAG pipeline',      type: 'keyword', desc: 'Chunk → embed → store → retrieve → inject context → generate.' },
    { name: 'PSI > 0.25',        type: 'keyword', desc: 'Population Stability Index threshold for significant data drift → retrain.' },
    { name: 'Perplexity',        type: 'keyword', desc: 'exp(avg cross-entropy). Lower = model is less surprised = better fit.' },
    { name: 'RLHF vs DPO',       type: 'keyword', desc: 'RLHF: reward model + PPO. DPO: (chosen, rejected) pairs, no RM needed.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Tier 1: Concepts Every AI Engineer Must Know',
      points: [
        'What is the difference between supervised, unsupervised, and reinforcement learning?',
        'Explain bias-variance tradeoff. How do regularisation (L1/L2), dropout, and early stopping address it?',
        'What is gradient descent? What is the difference between SGD, Adam, and RMSProp?',
        'What is cross-entropy loss? Why use it for classification instead of MSE?',
        'Explain backpropagation using the chain rule step by step.',
      ],
    },
    {
      heading: 'Tier 2: Deep Learning & Transformers',
      points: [
        'Walk through scaled dot-product attention: Q, K, V projections; QK^T/√d_k; softmax; multiply by V.',
        'Why divide by √d_k in attention? (Prevents saturation, keeps softmax gradients healthy.)',
        'What is multi-head attention and what does each head learn independently?',
        'Encoder vs decoder Transformer — when to use each. BERT = encoder, GPT = decoder.',
        'What problem do ResNet skip connections solve? (Vanishing gradient in very deep networks.)',
      ],
    },
    {
      heading: 'Tier 3: LLMs & Alignment',
      points: [
        'What training objective do LLMs use and why is it self-supervised? (Next-token prediction, no labels needed.)',
        'Explain temperature, top-p, and top-k sampling. When do you use temperature 0?',
        'What is the difference between a base model and an instruction-tuned model?',
        'Explain LoRA: why train A·B matrices instead of all weights? What is rank r?',
        'RLHF vs DPO: what problem does each solve and what are the tradeoffs?',
      ],
    },
    {
      heading: 'Tier 4: Applied AI Engineering',
      points: [
        'Describe the full RAG pipeline: chunking strategy, embedding, retrieval, reranking, generation.',
        'What is training-serving skew and how do you prevent it?',
        'How would you evaluate a RAG system? Name the RAGAS metrics.',
        'How do you protect an LLM application from prompt injection?',
        'Describe your model deployment strategy: canary, shadow testing, rollback.',
      ],
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the attention formula?',
      options: [
        'softmax(QK^T/√d_k)·V',
        'softmax(QV^T/√d_k)·K',
        'sigmoid(QK^T)·V',
        'relu(QK^T/d_k)·V',
      ],
      answer: 0,
      explanation: 'Attention(Q,K,V) = softmax(QK^T/√d_k)·V. Scaling by √d_k prevents the dot products from growing too large and pushing softmax into saturation.',
    },
    {
      q: 'What is the key difference between RLHF and DPO?',
      options: [
        'RLHF is faster to train than DPO',
        'RLHF trains a separate reward model + PPO; DPO directly optimises on (chosen, rejected) pairs without a reward model',
        'DPO requires more labelled data than RLHF',
        'RLHF uses cross-entropy; DPO uses MSE',
      ],
      answer: 1,
      explanation: 'RLHF is a two-phase process: (1) train a reward model from preference data; (2) fine-tune the policy with PPO. DPO shows these are equivalent and collapses it to one loss on (chosen, rejected) pairs — simpler, no RM needed.',
    },
    {
      q: 'In RAG, what does "faithfulness" measure?',
      options: [
        'Whether the retrieval step returns correct documents',
        'Whether every claim in the answer is supported by the retrieved context (no hallucination)',
        'Whether the LLM stays on-topic',
        'Whether the embedding model is accurate',
      ],
      answer: 1,
      explanation: 'Faithfulness checks that the generated answer only makes claims that appear in the retrieved context. Low faithfulness = the model is hallucinating facts not in the documents.',
    },
    {
      q: 'What does PSI > 0.25 indicate?',
      options: [
        'Model accuracy has improved',
        'Feature distribution has shifted significantly — likely time to retrain',
        'The model is overfitting',
        'Retrieval recall has dropped',
      ],
      answer: 1,
      explanation: 'Population Stability Index (PSI) measures the shift in a feature\'s distribution between training and production data. PSI > 0.25 indicates significant drift — the model is seeing inputs different from what it was trained on, likely causing performance degradation.',
    },
    {
      q: 'Why use bfloat16 instead of float32 when loading an LLM?',
      options: [
        'bfloat16 improves model accuracy',
        'bfloat16 uses 2 bytes per parameter vs 4 — halves VRAM with negligible quality loss',
        'bfloat16 enables LoRA training',
        'bfloat16 is required for multi-GPU training',
      ],
      answer: 1,
      explanation: 'bfloat16 (Brain Floating Point) uses 2 bytes per parameter vs float32\'s 4 bytes, cutting GPU memory in half. It has the same 8-bit exponent as float32 so doesn\'t suffer overflow/underflow issues that plague float16.',
    },
    {
      q: 'What is the "lost in the middle" effect in LLM prompting?',
      options: [
        'The model stops generating after hitting the context limit',
        'LLMs attend more to content at the beginning and end of their context — information in the middle gets lower attention',
        'RAG chunks in the middle of a document are harder to retrieve',
        'Tokens in the middle of a sequence have higher perplexity',
      ],
      answer: 1,
      explanation: 'Research shows LLMs attend strongly to the start and end of their context but weakly to the middle. Place critical instructions at the start (system prompt) or end of the user message. For RAG, put the most important context last.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Walk me through how a Transformer processes a sentence.',
      a: 'The sentence is tokenised into a sequence of token IDs. Each token ID is looked up in an embedding table to get a vector. Positional encodings are added to inject sequence order (Transformer is permutation-invariant without them). The sequence then passes through N Transformer blocks, each containing: (1) LayerNorm → Multi-Head Self-Attention → residual; (2) LayerNorm → Feed-Forward Network (two linear layers + activation) → residual. In self-attention, each token computes Q, K, V projections, scores all other tokens via QK^T/√d_k, applies softmax to get attention weights, and produces a weighted sum of V vectors. The final hidden states are either projected to vocabulary logits (for generation) or pooled (for classification).',
    },
    {
      q: 'How would you reduce hallucination in a RAG system?',
      a: 'Hallucination in RAG usually means the model generated content not present in the retrieved context. Fixes: (1) Grounding prompt: "Answer ONLY from the context below. Say I don\'t know if the answer is absent." (2) Improve retrieval: better embedding model, hybrid search, reranker — if the right context isn\'t retrieved, the model falls back to parametric knowledge. (3) Faithfulness evaluation: score every response with RAGAS faithfulness; alert when it drops. (4) Cite sources: ask the model to quote the relevant sentence; if it can\'t quote, it probably doesn\'t have the information. (5) Reduce temperature: 0 gives deterministic, less creative answers — lower hallucination risk. (6) Use a model with strong instruction following — smaller models hallucinate more.',
    },
    {
      q: 'How do you decide between fine-tuning and RAG for a new AI feature?',
      a: 'Start with RAG by default. RAG is better when: knowledge changes frequently (product updates, news), knowledge base is large (thousands of docs), you need to cite sources, or you want to add knowledge without compute. Fine-tuning is better when: you need to change model behaviour/style/tone, the task requires skills not achievable via prompting (e.g. specific output format the model resists), or latency is critical and you can\'t afford retrieval. The most common mistake: fine-tuning to "memorise" facts. LLMs are unreliable at recalling injected facts — use RAG for knowledge retrieval.',
    },
    {
      q: 'Explain the LoRA parameter reduction calculation.',
      a: 'For a weight matrix W of shape (d_in × d_out), full fine-tuning requires d_in × d_out trainable parameters. LoRA replaces the update ΔW with A·B where A is (d_in × r) and B is (r × d_out), with rank r << min(d_in, d_out). Total LoRA params = d_in·r + r·d_out = r(d_in + d_out). Example: d_in = d_out = 4096, r = 16 → 4096×16 + 16×4096 = 131,072 params vs 4096×4096 = 16.7M. Reduction: 0.78%. For a 7B model with 32 attention layers, LoRA on q_proj + v_proj gives ~10M trainable params out of 7B — a 700× reduction. B is initialised to zero so the initial LoRA output is identical to the base model.',
    },
    {
      q: 'What are the four RAGAS metrics and what does each measure?',
      a: 'RAGAS evaluates RAG systems on: (1) Faithfulness — does every claim in the answer appear in the retrieved context? Scores 0–1; low = hallucination. (2) Answer Relevance — does the answer actually address the question? The LLM judge generates several questions from the answer and measures if they match the original. (3) Context Recall — does the retrieved context contain enough information to fully answer the question? Compares context to a ground-truth answer. (4) Context Precision — of the retrieved chunks, what fraction are actually relevant to the question? Filters irrelevant noise in retrieval. All four can be computed without human labels using GPT-4 as an LLM judge.',
    },
    {
      q: 'How do you handle the context window limit in a long-running chat application?',
      a: 'Several strategies: (1) Sliding window — keep system prompt + last N turns. Simple, works for conversational apps. Risk: loses important context from early in the conversation. (2) Summarisation — when history exceeds a threshold, ask the LLM to summarise the conversation so far. Store the summary + recent turns. (3) Long-context models — GPT-4o (128K), Claude 3 (200K), Gemini 1.5 (1M). May not be cost-effective for all apps. (4) External memory — extract facts from conversation, store in a vector DB, retrieve relevant facts per turn. Best for persistent memory across sessions. Track actual token counts with tiktoken, not word estimates.',
    },
  ];
}
