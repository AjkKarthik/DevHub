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
  selector: 'app-ai-llm-fundamentals',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './llm-fundamentals.html',
  styleUrl: './llm-fundamentals.scss',
})
export class AiLlmFundamentals {
  quickRef: QuickRefItem[] = [
    { name: 'Token',           type: 'keyword', desc: 'Atomic unit of text (word piece, punctuation). LLMs process and generate tokens, not characters.' },
    { name: 'Context window',  type: 'keyword', desc: 'Maximum tokens the model can process at once. GPT-4: 128K; Claude 3: 200K; Gemini 1.5: 1M.' },
    { name: 'Next-token prediction', type: 'keyword', desc: 'Core LLM training task: predict the next token given all previous tokens. Loss = cross-entropy.' },
    { name: 'Temperature',     type: 'keyword', desc: 'Sampling randomness. 0 = greedy (deterministic); 1 = standard; >1 = more random/creative.' },
    { name: 'Top-p (nucleus)', type: 'keyword', desc: 'Keep tokens whose cumulative probability ≥ p. Filters low-probability tail. Typical: 0.9–0.95.' },
    { name: 'Tokenizer',       type: 'keyword', desc: 'Converts text to token IDs (BPE, WordPiece, SentencePiece). Vocab size typically 32K–100K.' },
    { name: 'Perplexity',      type: 'keyword', desc: 'Exponentiated average cross-entropy loss — measures how surprised the model is by the text.' },
    { name: 'Emergent ability', type:'keyword', desc: 'Capabilities that appear suddenly at scale (chain-of-thought, arithmetic) — not present in smaller models.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is an LLM',
      points: [
        'A Large Language Model (LLM) is a decoder-only Transformer trained on vast text corpora using next-token prediction.',
        'The model learns a distribution P(token_n | token_1, ..., token_{n-1}) — the probability of the next token given all prior context.',
        'Training: self-supervised — no labels needed. Loss = cross-entropy between predicted and actual next tokens across billions of tokens.',
        'Scale matters: GPT-3 (175B params), GPT-4 (~1T), LLaMA 3 (8B–70B), Claude 3 Opus (~unknown). More params + more data = better capabilities.',
        'Emergent abilities: complex reasoning, code generation, and instruction following appear at sufficient scale — not predictable from smaller models.',
      ],
    },
    {
      heading: 'Tokenisation',
      points: [
        'Byte Pair Encoding (BPE): start with character vocabulary, iteratively merge the most frequent adjacent pair. Used by GPT-2/3/4.',
        'WordPiece (BERT): similar to BPE but merges based on maximising training likelihood rather than frequency.',
        'SentencePiece: language-agnostic, treats text as a sequence of Unicode characters — good for multilingual models (LLaMA, T5).',
        'Token count: English ~1.3 tokens/word. Code is denser. Chinese/Japanese characters can map 1:1 with tokens.',
        'Vocabulary size: GPT-2: 50K, GPT-4: ~100K, LLaMA: 32K (BPE + SentencePiece). Larger vocab = fewer tokens per text but larger embedding table.',
      ],
    },
    {
      heading: 'Sampling and Decoding',
      points: [
        'Greedy decoding: always pick the highest-probability token. Fast, deterministic, but repetitive and suboptimal for creative tasks.',
        'Temperature scaling: divide logits by T before softmax. T<1 sharpens the distribution (more confident); T>1 flattens it (more random).',
        'Top-k: keep only the k highest probability tokens, renormalise, sample. Prevents very low-probability tokens but k is hard to tune per step.',
        'Top-p (nucleus sampling): keep the smallest set of tokens whose cumulative probability ≥ p. Adapts to the distribution shape each step — more robust.',
        'Beam search: maintain b candidate sequences, expand each by one token, keep top-b by probability. Better quality than greedy but no diversity.',
      ],
    },
    {
      heading: 'Pre-training, SFT, and RLHF',
      points: [
        'Pre-training: predict next token on trillions of tokens. Produces a base model that completes text but doesn\'t follow instructions.',
        'Supervised Fine-tuning (SFT): fine-tune on (instruction, response) pairs. Teaches the model to answer questions and follow directions.',
        'RLHF (Reinforcement Learning from Human Feedback): rank multiple model responses, train a reward model, use PPO to maximise expected reward. Aligns model to human preferences.',
        'DPO (Direct Preference Optimisation): more stable alternative to RLHF — directly optimise on preference pairs without training a reward model.',
        'Instruction-tuned models (ChatGPT, Claude, LLaMA-Chat) undergo SFT+RLHF/DPO on top of the pre-trained base model.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tokenisation',
      language: 'typescript',
      code: `// Using tiktoken (OpenAI's tokeniser) via JavaScript port
// npm install js-tiktoken

// import { encoding_for_model } from 'js-tiktoken';
// const enc = encoding_for_model('gpt-4');
// const tokens = enc.encode("Hello, how are you?");
// console.log(tokens);       // Uint32Array [9906, 11, 1268, 527, 499, 30]
// console.log(tokens.length); // 6 tokens for 4 words
// enc.free();

// Simple BPE merge illustration (conceptual)
function simpleBpeStep(vocab: Map<string, number>): [string, string] | null {
  let bestPair: [string, string] | null = null;
  let bestCount = 0;
  // In real BPE: count all adjacent pairs in the corpus
  // Merge the most frequent pair into a new token
  vocab.forEach((count, pair) => {
    if (count > bestCount) { bestCount = count; bestPair = pair.split(' ') as [string,string]; }
  });
  return bestPair;
}

// Token counting (approximate for GPT-4: ~1.3 tokens per English word)
function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\\s+/).length * 1.3);
}`,
    },
    {
      label: 'Sampling',
      language: 'typescript',
      code: `// Temperature sampling and top-p nucleus sampling

function softmax(logits: number[], temperature: number): number[] {
  const scaled = logits.map(l => l / temperature);
  const max = Math.max(...scaled);
  const exps = scaled.map(v => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sum);
}

function sample(probs: number[]): number {
  let r = Math.random(), cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r < cumulative) return i;
  }
  return probs.length - 1;
}

// Top-p nucleus sampling
function topPSample(logits: number[], temperature: number, p: number): number {
  const probs = softmax(logits, temperature);
  // Sort by descending probability, track original indices
  const indexed = probs.map((prob, i) => ({prob, i})).sort((a,b) => b.prob - a.prob);
  let cumulative = 0, nucleus: typeof indexed = [];
  for (const item of indexed) {
    nucleus.push(item);
    cumulative += item.prob;
    if (cumulative >= p) break;
  }
  // Renormalise and sample within nucleus
  const total = nucleus.reduce((s, x) => s + x.prob, 0);
  let r = Math.random() * total, acc = 0;
  for (const item of nucleus) {
    acc += item.prob;
    if (r < acc) return item.i;
  }
  return nucleus[nucleus.length - 1].i;
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Confusing tokens with words',
      wrong: `// Assuming 1 word = 1 token
const wordCount = prompt.split(' ').length;
if (wordCount > 4096) throw new Error('Too long'); // wrong limit check`,
      right: `// Use a tokeniser library for accurate counts
// English: ~1.3 tokens/word; code: ~2 tokens/word; CJK: ~1 char/token
// Estimate: tokens ≈ word_count * 1.3 for English prose
// For API calls, use tiktoken or the model's count_tokens endpoint`,
      explanation: 'A "word" in English is ~1.3 tokens on average, but code, punctuation, and non-English text can be 2–4x denser. Always use a tokeniser to count accurately before hitting context limits.',
    },
    {
      title: 'Using temperature 0 for all tasks',
      wrong: `// temperature=0 (greedy) everywhere
const response = await openai.chat.completions.create({
  model: 'gpt-4', temperature: 0, messages: [...]
}); // good for factual Q&A, bad for creative tasks`,
      right: `// Match temperature to task:
// Factual Q&A, code generation:   temperature: 0–0.2
// Summarisation, classification:  temperature: 0.3–0.5
// Creative writing, brainstorming: temperature: 0.7–1.0`,
      explanation: 'Temperature 0 gives deterministic but sometimes repetitive output. For creative tasks or diverse brainstorming, higher temperature explores more of the model\'s distribution.',
    },
    {
      title: 'Not handling context window limits',
      wrong: `// Concatenating all conversation history forever
messages.push({ role: 'user', content: newMessage });
// After 50+ turns: context overflow → API error`,
      right: `// Sliding window: keep system prompt + last N turns
function trimHistory(messages: Message[], maxTokens = 4000): Message[] {
  const system = messages.filter(m => m.role === 'system');
  let rest = messages.filter(m => m.role !== 'system');
  while (estimateTokens(rest) > maxTokens && rest.length > 2) rest = rest.slice(2);
  return [...system, ...rest];
}`,
      explanation: 'LLMs have a fixed context window. Long conversations that exceed it cause API errors or silent truncation (model forgets early context). Implement explicit history management.',
    },
    {
      title: 'Assuming LLMs always return valid JSON',
      wrong: `const result = JSON.parse(response.content); // throws 50% of the time`,
      right: `// Use structured output / function calling with JSON schema
// OpenAI: response_format: { type: 'json_object' }
// Or use zod + instructor library for schema-validated responses
// Always wrap JSON.parse in try/catch + retry logic`,
      explanation: 'Even when asked to return JSON, LLMs sometimes include markdown code fences, explanatory text, or invalid JSON. Use structured output APIs or schema-enforced libraries, and always validate.',
    },
  ];

  challenge: Challenge = {
    title: 'Perplexity',
    language: 'typescript',
    description: 'Compute perplexity from a list of token probabilities. Perplexity = exp(-(1/N) * sum(log(p_i))) where p_i is the model\'s probability for the actual token at position i.',
    hints: [
      'Average cross-entropy = -(1/N) * sum(log(p_i))',
      'Perplexity = Math.exp(average cross-entropy)',
    ],
    starterCode: `function perplexity(tokenProbs: number[]): number {
  // tokenProbs[i] = model's assigned probability to the actual token at position i
  // Return perplexity (lower is better)
}`,
    solution: `function perplexity(tokenProbs: number[]): number {
  const N = tokenProbs.length;
  const avgCrossEntropy = -tokenProbs.reduce((sum, p) => sum + Math.log(p + 1e-15), 0) / N;
  return Math.exp(avgCrossEntropy);
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does an LLM learn during pre-training?',
      options: [
        'To classify text into categories',
        'To predict the next token given all previous tokens',
        'To rank responses by quality',
        'To translate between languages explicitly',
      ],
      answer: 1,
      explanation: 'Pre-training is self-supervised next-token prediction. The model learns P(token_n | token_1..n-1) across trillions of tokens. This objective is how emergent abilities like reasoning and coding arise.',
    },
    {
      q: 'What does lower perplexity mean for a language model?',
      options: [
        'The model uses fewer parameters',
        'The model is more surprised by the text',
        'The model assigns higher probabilities to the actual tokens — better at predicting the text',
        'The model runs faster',
      ],
      answer: 2,
      explanation: 'Perplexity = exp(average cross-entropy loss). Lower perplexity means lower loss means higher probabilities on the actual tokens. GPT-2: ~35 on Wikitext-103; GPT-4: ~8–10.',
    },
    {
      q: 'What is the purpose of RLHF after SFT?',
      options: [
        'Reduce the model size',
        'Align the model to human preferences using feedback on response quality',
        'Improve tokenisation efficiency',
        'Enable the model to use tools',
      ],
      answer: 1,
      explanation: 'SFT teaches the model to follow instructions. RLHF then aligns the model to human preferences — ranking responses, training a reward model, and using PPO to maximise reward. Result: more helpful, harmless, honest responses.',
    },
  { q: 'What is the context window of an LLM and why does it matter?', options: ['The training dataset size', 'The maximum number of tokens the model can process in a single input+output', 'The model\'s RAM usage', 'The number of attention heads'], answer: 1, explanation: 'Context window = maximum tokens in the attention computation (input + output). GPT-4: 128k tokens; Claude 3: 200k tokens; Gemini 1.5: 1M tokens. Larger context = handle longer documents, but attention is quadratic in sequence length — computing longer contexts is much more expensive.' },
  { q: 'What is temperature in LLM sampling and how does it affect output?', options: ['Model training stability', 'A sampling parameter that controls output randomness — temperature=0 is deterministic, high temperature is more random', 'Inference speed', 'Token probability normalization'], answer: 1, explanation: 'Temperature scales logits before softmax: low temperature (0.1-0.5) makes the distribution sharper (picks high-probability tokens — deterministic, conservative). High temperature (1.0-2.0) makes it flatter (more random and creative). Temperature=0 is greedy sampling (always pick the top token).' },
  { q: 'What is few-shot prompting and why is it effective?', options: ['Training the model on a few examples', 'Providing input-output examples in the prompt that the model uses as a pattern to follow', 'Quantizing the model for fewer parameters', 'Using a smaller model'], answer: 1, explanation: 'Few-shot prompting: include 2-8 examples of desired input-output format in the prompt. The model infers the task pattern and follows it without any training. Effective because large LLMs are strong in-context learners — examples help specify format, style, and task better than instructions alone.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a base model and an instruction-tuned model?',
      a: 'A base model (e.g. LLaMA-3-70B) is trained only on next-token prediction. It completes text in whatever style matches its context — it\'s a text-completion engine, not an assistant. An instruction-tuned model (LLaMA-3-70B-Instruct, GPT-4, Claude) has undergone SFT on (instruction, response) pairs and RLHF/DPO to align with human preferences. It answers questions, follows directions, and refuses harmful requests. Base models are useful for fine-tuning on your data; instruction-tuned models are what you deploy for users.',
    },
    {
      q: 'Why does scaling LLMs produce emergent abilities?',
      a: 'Emergent abilities are capabilities absent in smaller models that appear suddenly above a compute/parameter threshold — arithmetic, chain-of-thought reasoning, few-shot learning. The "why" is debated: one theory is that tasks have a threshold of world-model complexity that only large models can represent. Another is that emergence is a measurement artefact — accuracy on a threshold-based metric looks sudden even when underlying capabilities grow smoothly. Either way, emergent abilities make predicting large-model behaviour from small-model benchmarks difficult.',
    },
  { q: 'How does tokenization affect LLM performance on numbers and code?', a: 'LLMs tokenize text into subword units. Numbers are often split into individual digits or small groups (123456 -> 1, 23, 456 depending on tokenizer). This makes arithmetic hard — the model must reason across multiple tokens. Code: tokenizers preserve syntax keywords but may split identifiers unexpectedly. For math/numeric tasks: provide numbers as text or use code interpreters (tool use). GPT-4 tokenizer (tiktoken) is available to inspect tokenization.' },
  { q: 'What is the difference between base models and instruction-tuned models?', a: 'Base model: trained on next-token prediction on raw text — completes text but does not follow instructions. Instruction-tuned (chat) model: further trained with supervised fine-tuning on instruction-response pairs + RLHF — follows directions, is helpful and safe. For most applications, use instruction-tuned models. Base models are used for further fine-tuning on domain text or research on model capabilities. Examples: GPT-4 (instruction-tuned), Llama-3 base vs Llama-3-Instruct.' },
  { q: 'What are top-p (nucleus) sampling and top-k sampling?', a: 'Top-k sampling: keep only the k highest-probability tokens at each step, renormalize, and sample. Top-p (nucleus) sampling: keep the smallest set of tokens whose cumulative probability >= p (e.g., 0.9), renormalize, and sample. Top-p is more adaptive — if the model is confident (one token at 0.95), only that token is sampled; if uncertain, many tokens are included. Typical settings: temperature=0.7, top_p=0.9, or temperature=0 for deterministic output.' },
  { q: 'What causes LLM hallucinations and how do you reduce them?', a: 'Causes: LLMs generate plausible-sounding tokens based on patterns, not factual lookup. They hallucinate facts especially for: obscure topics, specific numbers/dates, citations, and questions at the edge of their knowledge. Reduction: (1) RAG: ground answers in retrieved documents; (2) Chain-of-thought prompting reduces reasoning errors; (3) Self-consistency: sample multiple outputs, take majority; (4) Ask model to say when uncertain; (5) Structured fact-checking with external tools (search, code execution).' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'LLMs are decoder Transformers trained to predict the next token. Tokenisation, sampling (temperature/top-p), and the pre-train → SFT → RLHF pipeline are the core concepts.',
    mustKnow: [
      'LLM training objective: cross-entropy loss on next-token prediction',
      'Tokens ≠ words — English ≈1.3 tokens/word; use a tokeniser to count',
      'Temperature: 0=greedy, 1=standard, >1=random. Top-p keeps cumulative prob ≥ p',
      'Pre-train → SFT (instruction pairs) → RLHF/DPO (preference alignment)',
      'Perplexity = exp(avg cross-entropy): lower is better',
      'Context window = max tokens at once; manage conversation history explicitly',
    ],
    interviewFocus: [
      'What training objective do LLMs use and why is it self-supervised?',
      'What is the difference between a base model and an instruction-tuned model?',
      'Explain temperature and top-p sampling in your own words',
    ],
  };
}
