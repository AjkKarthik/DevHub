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
  selector: 'app-ai-evaluating-llms',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './evaluating-llms.html',
  styleUrl: './evaluating-llms.scss',
})
export class AiEvaluatingLlms {
  quickRef: QuickRefItem[] = [
    { name: 'Faithfulness',    type: 'keyword', desc: 'Does the answer use only the retrieved context? Measures hallucination in RAG.' },
    { name: 'Answer relevance', type:'keyword', desc: 'Does the response actually address the user\'s question?' },
    { name: 'LLM-as-judge',    type: 'keyword', desc: 'Use a strong LLM (GPT-4, Claude) to score/compare model outputs on a rubric.' },
    { name: 'BLEU',            type: 'keyword', desc: 'Bilingual Evaluation Understudy — n-gram precision vs reference. Used for translation.' },
    { name: 'ROUGE',           type: 'keyword', desc: 'Recall-Oriented Understudy for Gisting Evaluation — n-gram recall. Used for summarisation.' },
    { name: 'BERTScore',       type: 'keyword', desc: 'Semantic similarity via contextual BERT embeddings. More robust than n-gram metrics.' },
    { name: 'RAGAS',           type: 'keyword', desc: 'Framework for automated RAG evaluation: faithfulness, answer relevance, context precision.' },
    { name: 'Golden dataset',  type: 'keyword', desc: 'Curated (question, ground-truth answer) pairs used as the evaluation benchmark.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Why LLM Evaluation is Hard',
      points: [
        'Traditional ML: F1, accuracy, MSE — compare predicted label to ground truth. But LLM output is open-ended text.',
        '"The capital of France is Paris." and "Paris is France\'s capital." are both correct — n-gram metrics penalise paraphrases.',
        'Human evaluation is the gold standard but expensive, slow, and inconsistent. Expert raters disagree 15–30% of the time.',
        'Benchmark gaming: models can be fine-tuned to score well on a specific benchmark without general improvement.',
        'You need multiple complementary metrics — no single metric captures all dimensions of quality.',
      ],
    },
    {
      heading: 'Automated Text Metrics',
      points: [
        'BLEU: computes modified n-gram precision + brevity penalty. Range [0,1]. <0.3 is poor; >0.6 is good (translation). Not reliable for open-ended generation.',
        'ROUGE-1/2/L: measures unigram/bigram recall (R) and precision (P), returns F1. Used for summarisation. ROUGE-L uses longest common subsequence.',
        'BERTScore: embed both hypothesis and reference with BERT; compute pairwise cosine similarity; aggregate. Much more robust to paraphrase than n-gram metrics.',
        'Perplexity: how surprised the model is by the target text — lower = better language model fit. Not a quality metric per se.',
        'Exact match (EM): for extraction tasks (Q&A with span answers). 1 if string matches exactly, 0 otherwise.',
      ],
    },
    {
      heading: 'LLM-as-Judge',
      points: [
        'Use a strong LLM (GPT-4, Claude Opus) to grade outputs: provide rubric, question, and response; ask for a score 1–5 with reasoning.',
        'Pairwise comparison: show judge two responses (A vs B), ask which is better. More reliable than absolute scoring.',
        'Positional bias: LLM judges prefer whichever response appears first. Mitigate by swapping order and averaging.',
        'Self-serving bias: a model tends to prefer its own outputs. Use a different model as judge, or use multi-model judging.',
        'Constitutional AI and Prometheus: fine-tuned judge models with rubric-following ability — cheaper and less biased than GPT-4.',
      ],
    },
    {
      heading: 'RAG-Specific Evaluation',
      points: [
        'Faithfulness: does every claim in the answer appear in the retrieved context? A hallucinating RAG system scores low.',
        'Context recall: does the retrieved context contain enough information to answer? Measures retrieval quality.',
        'Context precision: of the retrieved chunks, what fraction are actually relevant to the question?',
        'Answer relevance: does the answer address the question directly? Orthogonal to faithfulness.',
        'RAGAS: Python library that computes all four metrics using GPT-4 as a judge. No ground-truth labels needed for most metrics.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'LLM-as-Judge',
      language: 'typescript',
      code: `// LLM-as-judge evaluation using OpenAI
import OpenAI from 'openai';
import { z } from 'zod';

const client = new OpenAI();

const EvalResultSchema = z.object({
  score: z.number().min(1).max(5),
  reasoning: z.string(),
});

interface EvalInput {
  question: string;
  answer: string;
  context?: string;
}

async function evaluateAnswer(input: EvalInput): Promise<{ score: number; reasoning: string }> {
  const systemPrompt = \`You are an expert evaluator. Score the answer from 1 to 5 based on:
1 = Completely wrong or irrelevant
2 = Partially correct but missing key points
3 = Correct but incomplete or vague
4 = Correct, clear, and mostly complete
5 = Excellent: correct, complete, well-explained

Return JSON: { "score": number, "reasoning": string }\`;

  const userPrompt = \`Question: \${input.question}
\${input.context ? \`Context: \${input.context}\\n\` : ''}Answer to evaluate: \${input.answer}\`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const raw = JSON.parse(response.choices[0].message.content ?? '{}');
  return EvalResultSchema.parse(raw);
}

// Pairwise comparison (reduces positional bias by swapping order)
async function pairwiseCompare(question: string, answerA: string, answerB: string) {
  async function compare(first: string, second: string) {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0,
      messages: [{
        role: 'user',
        content: \`Question: \${question}\\nAnswer A: \${first}\\nAnswer B: \${second}\\nWhich answer is better? Reply with just "A" or "B" or "tie".\`,
      }],
    });
    return response.choices[0].message.content?.trim();
  }

  const [round1, round2] = await Promise.all([compare(answerA, answerB), compare(answerB, answerA)]);
  // round2 swaps order — if A→"A" and B→"B" both say A, then A wins
  const aWins = (round1 === 'A') && (round2 === 'B');
  const bWins = (round1 === 'B') && (round2 === 'A');
  return aWins ? 'A' : bWins ? 'B' : 'tie';
}`,
    },
    {
      label: 'ROUGE / BERTScore',
      language: 'typescript',
      code: `// Simple ROUGE-1 implementation (n-gram recall)
function tokenise(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\\s+/).filter(Boolean);
}

function rougeN(hypothesis: string, reference: string, n = 1): { precision: number; recall: number; f1: number } {
  function getNgrams(tokens: string[], n: number): Map<string, number> {
    const ngrams = new Map<string, number>();
    for (let i = 0; i <= tokens.length - n; i++) {
      const key = tokens.slice(i, i + n).join(' ');
      ngrams.set(key, (ngrams.get(key) ?? 0) + 1);
    }
    return ngrams;
  }

  const hypTokens = tokenise(hypothesis);
  const refTokens = tokenise(reference);
  const hypNgrams = getNgrams(hypTokens, n);
  const refNgrams = getNgrams(refTokens, n);

  let overlap = 0;
  for (const [ngram, count] of hypNgrams) {
    overlap += Math.min(count, refNgrams.get(ngram) ?? 0);
  }

  const hypTotal = Math.max(hypTokens.length - n + 1, 0);
  const refTotal = Math.max(refTokens.length - n + 1, 0);

  const precision = hypTotal > 0 ? overlap / hypTotal : 0;
  const recall    = refTotal > 0 ? overlap / refTotal : 0;
  const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;

  return { precision, recall, f1 };
}

// Usage
const result = rougeN(
  "The cat sat on the mat in the sun",
  "The cat is sitting on the mat",
);
console.log('ROUGE-1:', result);
// { precision: 0.625, recall: 0.714, f1: 0.667 }

// BERTScore (Python via bert_score library)
// from bert_score import score
// P, R, F1 = score([hypothesis], [reference], lang="en", model_type="bert-base-uncased")
// print(F1.item())  # ~0.92 for semantically similar text`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using only BLEU/ROUGE for evaluating LLM quality',
      wrong: `# n-gram overlap metrics miss paraphrase quality
hypothesis = "The Eiffel Tower is located in Paris, France"
reference  = "France's capital, Paris, is home to the Eiffel Tower"
# ROUGE-1 F1 ≈ 0.47 despite being equally correct!
# These metrics were designed for machine translation, not LLM evaluation`,
      right: `# Combine metrics:
# BLEU/ROUGE: good for translation/summarisation with short, constrained outputs
# BERTScore: semantic similarity for open-ended text
# LLM-as-judge: for nuanced quality (tone, safety, completeness)
# Human eval: ground truth for 50–100 representative examples`,
      explanation: 'BLEU and ROUGE measure surface-level n-gram overlap. Two equally correct answers phrased differently score low. For open-ended generation, combine BERTScore (semantic), LLM-as-judge (holistic), and task-specific metrics.',
    },
    {
      title: 'Not accounting for positional bias in LLM-as-judge',
      wrong: `# Always put new model as Answer A, baseline as Answer B
# LLM judges prefer whichever comes first ~65% of the time
result = judge(question, new_model_answer, baseline_answer)
# Result inflated in favour of the new model`,
      right: `# Run twice with swapped order, treat inconsistency as "tie"
r1 = judge(question, answerA=new, answerB=baseline)  # → "A"
r2 = judge(question, answerA=baseline, answerB=new)   # → "B" means A still wins
# Both say new wins → new wins. Disagreement → tie`,
      explanation: 'LLM judges have strong positional bias — the first answer wins ~65% of the time regardless of quality. Always run pairwise evaluation in both orders and aggregate. A consistent winner across both orderings is reliable.',
    },
    {
      title: 'Evaluating on a single metric for a multi-dimensional task',
      wrong: `# RAG system scored only on "does it answer the question?"
answer_relevance = evaluate(question, answer)  # 4.5/5 — looks great!
# Meanwhile: 40% of facts are hallucinated (faithfulness = 0.6)`,
      right: `# RAG needs at least 4 dimensions
metrics = {
  'faithfulness':      evaluate_faithfulness(answer, context),  # 0.6 — ❌
  'answer_relevance':  evaluate_relevance(question, answer),    # 4.5
  'context_recall':    evaluate_recall(question, context),      # 0.8
  'context_precision': evaluate_precision(question, context),   # 0.7
}`,
      explanation: 'A RAG system can score high on answer relevance while hallucinating — the answer sounds related but introduces facts not in the retrieved context. Always evaluate faithfulness and answer relevance independently.',
    },
    {
      title: 'Using the same model as both generator and judge',
      wrong: `# GPT-4 generated the answer, GPT-4 judges the answer
answer = gpt4.generate(question)
score = gpt4.judge(question, answer)  # self-serving bias: scores own outputs higher`,
      right: `# Use a different model as judge — or use human eval for calibration
answer = gpt4.generate(question)
score = claude.judge(question, answer)   # cross-model judging
# Or: human evaluation on 10% sample to calibrate the LLM judge`,
      explanation: 'LLMs exhibit self-serving bias — they rate their own outputs higher than equivalent outputs from other models. Use a different model family as the judge, or calibrate the judge against human ratings.',
    },
  ];

  challenge: Challenge = {
    title: 'ROUGE-1 F1',
    language: 'typescript',
    description: 'Implement ROUGE-1 F1 score: the harmonic mean of unigram precision (how many words in hypothesis are in reference) and recall (how many reference words appear in hypothesis).',
    hints: [
      'Precision = overlap / hypothesis_words; Recall = overlap / reference_words',
      'Overlap = count of words appearing in BOTH (use a bag/multiset intersection)',
    ],
    starterCode: `function rouge1F1(hypothesis: string, reference: string): number {
  // Return ROUGE-1 F1 score [0..1]
}`,
    solution: `function rouge1F1(hypothesis: string, reference: string): number {
  const tokenise = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\\s+/).filter(Boolean);
  const hypWords = tokenise(hypothesis);
  const refWords = tokenise(reference);

  const refCount = new Map<string, number>();
  for (const w of refWords) refCount.set(w, (refCount.get(w) ?? 0) + 1);

  let overlap = 0;
  for (const w of hypWords) {
    const c = refCount.get(w) ?? 0;
    if (c > 0) { overlap++; refCount.set(w, c - 1); }
  }

  const precision = hypWords.length > 0 ? overlap / hypWords.length : 0;
  const recall    = refWords.length > 0 ? overlap / refWords.length : 0;
  return precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why is BLEU unreliable for evaluating open-ended LLM responses?',
      options: [
        'BLEU requires labelled training data',
        'BLEU measures n-gram overlap — penalises correct paraphrases that use different words than the reference',
        'BLEU is too slow for large datasets',
        'BLEU only works for translation tasks via an API',
      ],
      answer: 1,
      explanation: 'BLEU counts matching n-grams between hypothesis and reference. "The Eiffel Tower is in Paris" vs "Paris is home to the Eiffel Tower" have low BLEU despite being equally correct. BLEU was designed for short, constrained machine translation outputs.',
    },
    {
      q: 'What is positional bias in LLM-as-judge evaluation?',
      options: [
        'The judge prefers shorter answers',
        'The judge assigns higher scores to the answer that appears first in the prompt, regardless of quality',
        'The judge prefers answers with more citations',
        'The judge ignores answers after the first paragraph',
      ],
      answer: 1,
      explanation: 'Research shows LLM judges prefer the first response ~65% of the time independently of quality. Mitigate by running pairwise comparisons in both A→B and B→A orderings and treating inconsistency as a tie.',
    },
    {
      q: 'In RAG evaluation, what does "faithfulness" measure?',
      options: [
        'Whether the retrieval step returns the correct documents',
        'Whether every claim in the generated answer is supported by the retrieved context (no hallucination)',
        'Whether the answer is grammatically correct',
        'Whether the model stays on topic',
      ],
      answer: 1,
      explanation: 'Faithfulness checks whether the model\'s answer introduces facts not present in the retrieved context. A low faithfulness score means the model is hallucinating — generating content beyond what the context supports.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I build a reliable evaluation pipeline for a production LLM application?',
      a: 'Three layers: (1) Offline golden dataset — 100–500 (question, ground-truth answer) pairs representative of real usage. Run this after every change to catch regressions. (2) LLM-as-judge in CI — automatic scoring on golden dataset using GPT-4 or Claude as judge. Set a minimum score threshold to block bad changes. (3) Production sampling — log 1–5% of live queries, route to human review or LLM judge weekly. Metrics drift over time even without code changes. Calibrate LLM judge against human ratings every quarter to detect judge bias.',
    },
    {
      q: 'What is the difference between BERTScore and ROUGE?',
      a: 'ROUGE counts exact n-gram overlap — "cat" and "feline" contribute 0 to the overlap even if they mean the same thing. BERTScore embeds both hypothesis and reference with BERT, then computes token-level cosine similarity — "cat" and "feline" have high similarity and both contribute positively. BERTScore correlates much better with human judgement on paraphrase-heavy tasks. ROUGE is still standard for summarisation benchmarks (CNN/DM, XSum) because those leaderboards were defined with ROUGE. Use BERTScore for evaluating your actual application.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'LLM eval: BLEU/ROUGE for translation/summarisation; BERTScore for semantic similarity; LLM-as-judge with pairwise swap for open-ended quality; RAGAS for RAG faithfulness + relevance.',
    mustKnow: [
      'BLEU = n-gram precision; ROUGE = n-gram recall; both miss paraphrase',
      'BERTScore: contextual embedding similarity — more robust than n-gram',
      'LLM-as-judge: strong model grades on rubric; mitigate positional bias by swapping order',
      'RAG dimensions: faithfulness, answer relevance, context recall, context precision',
      'Golden dataset: 100–500 (question, answer) pairs — run after every change',
      'Never use the same model as both generator and judge (self-serving bias)',
    ],
    interviewFocus: [
      'Why can\'t you use BLEU alone to evaluate an LLM chatbot?',
      'What is LLM-as-judge and what are its biases?',
      'Name the four RAGAS metrics for RAG evaluation',
    ],
  };
}
