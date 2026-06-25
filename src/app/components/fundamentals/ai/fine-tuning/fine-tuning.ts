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
  selector: 'app-ai-fine-tuning',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './fine-tuning.html',
  styleUrl: './fine-tuning.scss',
})
export class AiFineTuning {
  quickRef: QuickRefItem[] = [
    { name: 'SFT',       type: 'keyword', desc: 'Supervised Fine-Tuning — train on (instruction, response) pairs to teach the model to follow directions.' },
    { name: 'LoRA',      type: 'keyword', desc: 'Low-Rank Adaptation — freeze base weights, train low-rank matrices A·B injected at attention layers. 100× fewer trainable params.' },
    { name: 'QLoRA',     type: 'keyword', desc: 'Quantised LoRA — load base model in 4-bit NF4, train LoRA adapters in fp16. Fine-tune 70B models on consumer GPUs.' },
    { name: 'RLHF',      type: 'keyword', desc: 'Reinforcement Learning from Human Feedback — rank completions, train reward model, fine-tune with PPO to maximise reward.' },
    { name: 'DPO',       type: 'keyword', desc: 'Direct Preference Optimisation — learn preferences directly from (chosen, rejected) pairs without a reward model.' },
    { name: 'PEFT',      type: 'keyword', desc: 'Parameter-Efficient Fine-Tuning — umbrella for LoRA, prefix tuning, prompt tuning. Only a fraction of params are trained.' },
    { name: 'Catastrophic forgetting', type: 'keyword', desc: 'Fine-tuning on narrow data causes the model to "forget" general capabilities. LoRA and small datasets mitigate this.' },
    { name: 'Alpaca format', type: 'keyword', desc: 'Standard (instruction, input, output) JSON format for SFT datasets. Used by most HuggingFace fine-tuning recipes.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Supervised Fine-Tuning (SFT)',
      points: [
        'Start from a pre-trained base model; train on a dataset of (instruction, response) pairs using standard cross-entropy loss.',
        'Dataset format: Alpaca — {instruction, input, output}; or ChatML — alternating human/assistant turns.',
        'Typical dataset size: 1K–100K examples. Quality matters more than quantity — 1K curated examples often beats 100K noisy ones.',
        'Full fine-tuning: update all parameters. Expensive (70B model needs 8×A100 for weeks). Risk of catastrophic forgetting.',
        'Learning rate: 1e-5 to 5e-5. Use a cosine schedule with warmup. Smaller than pre-training (base LR: 3e-4).',
      ],
    },
    {
      heading: 'LoRA: Low-Rank Adaptation',
      points: [
        'Key insight: weight updates during fine-tuning have low intrinsic dimensionality — a small matrix captures most of the update.',
        'For each target weight matrix W (d×k), inject: W\' = W + α/r · A·B where A is d×r, B is r×k, rank r << min(d,k).',
        'Freeze W entirely. Train only A (initialised random) and B (initialised zero). At inference: merge A·B into W (no latency overhead).',
        'Typical r=8–64. With r=16, a 7B model has ~10M trainable params instead of 7B — 700× reduction.',
        'QLoRA: load W in 4-bit NF4 quantisation, train LoRA in bf16. Enables 70B fine-tuning on 2× A100 40GB.',
      ],
    },
    {
      heading: 'RLHF',
      points: [
        'Step 1 — SFT: get a decent assistant model that follows instructions.',
        'Step 2 — Reward model: collect human rankings of (prompt, response_A, response_B) pairs. Train a separate model to predict which response humans prefer.',
        'Step 3 — PPO: use the reward model as an environment. Run PPO to update the SFT policy to maximise expected reward. Include a KL penalty against the SFT policy to prevent reward hacking.',
        'Weakness: RLHF is complex, unstable, reward hacking common, requires millions of preference labels. PPO is notoriously hard to tune.',
        'ChatGPT, Claude, and Gemini all use RLHF. Constitutional AI (Claude) adds AI self-critique to reduce human labelling.',
      ],
    },
    {
      heading: 'DPO: Direct Preference Optimisation',
      points: [
        'Observation: the optimal RLHF policy has a closed-form relationship to the preference data. DPO optimises this directly.',
        'Loss: L_DPO = -E[log σ(β·(log π(y_w|x)/π_ref(y_w|x) - log π(y_l|x)/π_ref(y_l|x)))]',
        'Train on (prompt, chosen, rejected) triples. No reward model needed. Simpler and more stable than PPO.',
        'DPO is increasingly preferred over RLHF for alignment. LLaMA-3-Instruct, Mistral-Instruct, and Qwen use DPO.',
        'β (beta) controls the KL penalty strength — how far the model can deviate from the reference model. Typical: 0.1–0.5.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'LoRA with HuggingFace',
      language: 'typescript',
      code: `// LoRA fine-tuning with HuggingFace PEFT (Python pseudocode)
// pip install transformers peft accelerate datasets bitsandbytes

// from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
// from peft import LoraConfig, get_peft_model, TaskType
// from trl import SFTTrainer

// # Load base model (4-bit quantised for QLoRA)
// model = AutoModelForCausalLM.from_pretrained(
//   "meta-llama/Meta-Llama-3-8B",
//   quantization_config=BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4"),
//   device_map="auto"
// )

// # LoRA config: inject into q_proj and v_proj of every attention layer
// lora_config = LoraConfig(
//   task_type=TaskType.CAUSAL_LM,
//   r=16,                         # rank
//   lora_alpha=32,                # scaling = alpha/r = 2
//   target_modules=["q_proj", "v_proj"],
//   lora_dropout=0.1,
//   bias="none",
// )
// model = get_peft_model(model, lora_config)
// model.print_trainable_parameters()
// # trainable params: 10,485,760 || all params: 8,030,261,248 || trainable%: 0.13%

// # Dataset in Alpaca format
// dataset = load_dataset("json", data_files="train.jsonl")
// # {"instruction": "...", "input": "...", "output": "..."}

// trainer = SFTTrainer(
//   model=model,
//   train_dataset=dataset["train"],
//   args=TrainingArguments(output_dir="./output", num_train_epochs=3,
//     per_device_train_batch_size=4, gradient_accumulation_steps=4,
//     learning_rate=2e-4, lr_scheduler_type="cosine", warmup_ratio=0.03),
//   dataset_text_field="output",
// )
// trainer.train()
// model.save_pretrained("./lora-adapter")  # only saves the LoRA weights!`,
    },
    {
      label: 'DPO Training',
      language: 'typescript',
      code: `// DPO training with TRL (Python pseudocode)
// from trl import DPOTrainer, DPOConfig
// from datasets import Dataset

// # Dataset format for DPO
// dataset = Dataset.from_list([
//   {
//     "prompt": "What is the capital of France?",
//     "chosen": "The capital of France is Paris.",
//     "rejected": "France's capital is London."
//   },
//   {
//     "prompt": "Write a function to add two numbers",
//     "chosen": "def add(a, b):\\n    return a + b",
//     "rejected": "def add(a, b):\\n    return a - b  # wrong"
//   },
//   # ...thousands more pairs
// ])

// # DPO config
// dpo_config = DPOConfig(
//   beta=0.1,             # KL penalty strength
//   learning_rate=5e-7,   # much smaller than SFT
//   num_train_epochs=1,
//   per_device_train_batch_size=2,
//   output_dir="./dpo-output",
// )

// # Load reference model (SFT checkpoint) and policy model
// ref_model = AutoModelForCausalLM.from_pretrained("./sft-checkpoint")
// model     = AutoModelForCausalLM.from_pretrained("./sft-checkpoint")

// trainer = DPOTrainer(
//   model=model,
//   ref_model=ref_model,  # frozen reference policy
//   args=dpo_config,
//   train_dataset=dataset,
//   tokenizer=tokenizer,
// )
// trainer.train()`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Full fine-tuning when LoRA would suffice',
      wrong: `# Fine-tuning all 7B parameters on 1000 examples
trainer = Trainer(model=model, ...)  # needs 6× A100 80GB, days of training
# Also risks catastrophic forgetting of general capabilities`,
      right: `# LoRA: train only ~10M params (0.13% of 7B)
lora_config = LoraConfig(r=16, lora_alpha=32, ...)
model = get_peft_model(model, lora_config)
# Runs on 1× A100 40GB in hours, preserves general capabilities`,
      explanation: 'For most downstream tasks, LoRA matches or exceeds full fine-tuning quality at a fraction of the compute. Full fine-tuning is only worth it when you have large datasets and need to fundamentally change the model\'s knowledge.',
    },
    {
      title: 'Using too high a learning rate for fine-tuning',
      wrong: `# SFT with same learning rate as pre-training
optimizer = Adam(model.parameters(), lr=3e-4)  # destroys pre-trained weights`,
      right: `# SFT: 1e-5 to 5e-5 (10× smaller than pre-training)
# LoRA/DPO: 1e-4 to 2e-4 for LoRA; 5e-7 for DPO
optimizer = Adam(trainable_params, lr=2e-4)  # for LoRA adapters`,
      explanation: 'Pre-trained weights encode valuable capabilities. A large learning rate overwrites them. Fine-tuning uses a much smaller LR than pre-training. DPO is especially sensitive — typical LR is 5e-7.',
    },
    {
      title: 'Not including a KL penalty in RLHF/DPO',
      wrong: `# PPO without KL penalty
# Model quickly learns to generate text that tricks the reward model
# "Reward hacking": high reward but incoherent or unsafe outputs`,
      right: `# PPO with KL penalty: loss = -reward + beta * KL(policy || ref_policy)
# DPO includes KL implicitly via beta parameter
dpo_config = DPOConfig(beta=0.1)  # β=0.1 is a reasonable default`,
      explanation: 'Without a KL penalty against the reference policy, the model collapses into reward hacking — generating text that exploits weaknesses in the reward model rather than being genuinely helpful.',
    },
    {
      title: 'Training with noisy or poorly formatted SFT data',
      wrong: `# 100K examples scraped from the web with poor quality control
# Contradictory answers, wrong facts, inconsistent formatting
# Fine-tuned model: lower quality than before fine-tuning`,
      right: `# 1K–10K carefully curated, consistent examples beat 100K noisy ones
# Use consistent formatting: "### Instruction:\\n{...}\\n### Response:\\n{...}"
# Check for: duplicates, contradictions, harmful content, length distribution`,
      explanation: 'SFT data quality dominates quantity. Noisy data trains the model to produce noisy outputs. 1K carefully reviewed examples of the correct style will outperform 100K scraped examples.',
    },
  ];

  challenge: Challenge = {
    title: 'LoRA Parameter Count',
    language: 'typescript',
    description: 'Given a weight matrix of shape (d_in × d_out) and LoRA rank r, compute how many trainable parameters LoRA adds (matrices A and B combined).',
    hints: [
      'A has shape (d_in × r), B has shape (r × d_out)',
      'Total LoRA params = d_in * r + r * d_out',
    ],
    starterCode: `function loraParamCount(dIn: number, dOut: number, rank: number): number {
  // Return total trainable parameters added by LoRA (A + B)
}

function paramReduction(dIn: number, dOut: number, rank: number): string {
  // Return percentage of original params that LoRA trains
}`,
    solution: `function loraParamCount(dIn: number, dOut: number, rank: number): number {
  return dIn * rank + rank * dOut;
}

function paramReduction(dIn: number, dOut: number, rank: number): string {
  const original = dIn * dOut;
  const lora = loraParamCount(dIn, dOut, rank);
  return (lora / original * 100).toFixed(2) + '%';
}
// Example: d_in=4096, d_out=4096, r=16
// LoRA: 4096*16 + 16*4096 = 131,072 params
// Original: 4096*4096 = 16,777,216 params
// Reduction: 0.78% of original`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'In LoRA, what does "rank r" control?',
      options: [
        'The learning rate for the adapter',
        'The number of layers to fine-tune',
        'The dimensionality of the low-rank update matrices — higher rank = more capacity but more params',
        'The number of training epochs',
      ],
      answer: 2,
      explanation: 'LoRA decomposes the weight update ΔW = A·B where A is d×r and B is r×k. Higher rank r gives the adapters more capacity to represent the update, at the cost of more trainable parameters. r=16 is a common default.',
    },
    {
      q: 'What problem does the KL penalty solve in RLHF?',
      options: [
        'It speeds up training',
        'It prevents reward hacking by keeping the model close to the reference policy',
        'It improves tokenisation',
        'It reduces memory usage',
      ],
      answer: 1,
      explanation: 'Without the KL penalty (KL(policy || ref_policy)), the model learns to generate text that exploits weaknesses in the reward model — producing high reward scores for outputs that are gibberish or unsafe (reward hacking).',
    },
    {
      q: 'What is the main advantage of DPO over RLHF?',
      options: [
        'DPO requires less training data',
        'DPO eliminates the need for a reward model and PPO, making alignment simpler and more stable',
        'DPO improves model accuracy on benchmarks',
        'DPO uses larger batch sizes',
      ],
      answer: 1,
      explanation: 'DPO shows that RLHF implicitly solves an equivalent optimisation problem. By solving it directly on (chosen, rejected) pairs, DPO avoids training a reward model and the instability of PPO.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'When should I use fine-tuning vs RAG?',
      a: 'RAG (Retrieval-Augmented Generation) is better when: you need up-to-date information, you have a large and changing knowledge base, or you need to cite sources. Fine-tuning is better when: you need to change the model\'s style/format/tone, you need new skills not achievable by prompting, or latency is critical (no retrieval step). The most common mistake is fine-tuning to "memorise" facts — LLMs are poor at reliable fact recall from weights. Use RAG for knowledge, fine-tuning for behaviour.',
    },
    {
      q: 'How much data do I need for LoRA fine-tuning?',
      a: 'For style/format changes: 500–2,000 high-quality examples. For new task types: 2,000–10,000. For domain adaptation: 10,000–100,000. Quality beats quantity — each example should be exactly the format and quality you want the model to output. Use a train/eval split (90/10), monitor eval loss, and stop when it plateaus or starts rising (overfitting). With LoRA on a 7B model, a single A100 can process ~50K examples in a few hours.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'SFT teaches instruction-following; LoRA/QLoRA trains tiny adapter matrices instead of all weights; RLHF aligns to human preferences; DPO does it without a reward model.',
    mustKnow: [
      'SFT: fine-tune on (instruction, response) pairs with cross-entropy loss',
      'LoRA: ΔW = A·B with rank r, freeze base weights, 100–700× fewer trainable params',
      'QLoRA: 4-bit quantised base + LoRA adapters in bf16 — 70B on 2×A100',
      'RLHF: rank completions → reward model → PPO with KL penalty',
      'DPO: (chosen, rejected) pairs, no reward model, simpler than PPO',
      'Fine-tuning for behaviour/style; RAG for knowledge/up-to-date info',
    ],
    interviewFocus: [
      'Explain how LoRA works and why it reduces trainable parameters',
      'What is the difference between RLHF and DPO?',
      'When would you fine-tune vs use RAG?',
    ],
  };
}
