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
  selector: 'app-ai-hugging-face',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './hugging-face.html',
  styleUrl: './hugging-face.scss',
})
export class AiHuggingFace {
  quickRef: QuickRefItem[] = [
    { name: 'Hub',              type: 'keyword', desc: 'huggingface.co — repository hosting 800K+ models, 200K+ datasets, Spaces apps. Git-LFS backed.' },
    { name: 'pipeline()',       type: 'function', desc: 'One-line inference: pipeline("task", model="..."). Downloads, caches, runs model locally.' },
    { name: 'AutoModel',        type: 'class',    desc: 'AutoModelForCausalLM, AutoModelForSequenceClassification — auto-selects the right architecture.' },
    { name: 'AutoTokenizer',    type: 'class',    desc: 'Loads the tokeniser matching the model. Always use the same tokeniser as training.' },
    { name: 'Spaces',           type: 'keyword',  desc: 'Hosted Gradio/Streamlit apps on HuggingFace — zero-deploy ML demos with free GPU tiers.' },
    { name: 'Inference API',    type: 'keyword',  desc: 'Serverless model inference via HTTP. No GPU needed. Free tier available. npm: @huggingface/inference.' },
    { name: 'Datasets library', type: 'keyword',  desc: 'load_dataset("name") — streaming, Apache Arrow backed, works with 200K+ datasets on Hub.' },
    { name: 'GGUF',             type: 'keyword',  desc: 'Quantised model format for llama.cpp — run 7B–70B models on CPU/Mac with 4-bit quantisation.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Hugging Face Ecosystem',
      points: [
        'The Hub hosts models, datasets, and Spaces (demos). Every model is a git repo with model weights, config.json, tokenizer files, and a model card.',
        'Transformers library: from transformers import pipeline, AutoModel, AutoTokenizer. Supports PyTorch, TensorFlow, JAX backends.',
        'Hub integration: every model auto-downloads on first use (cached in ~/.cache/huggingface). Push your own with push_to_hub().',
        'Licence matters: check the model card. Some models (LLaMA 3, Gemma) require accepting a licence. Commercial use restrictions vary.',
        'PEFT, TRL, Accelerate, Diffusers — the HF ecosystem covers fine-tuning, alignment, multi-GPU training, and image generation.',
      ],
    },
    {
      heading: 'Loading Models and Tokenisers',
      points: [
        'pipeline(): highest-level API. Handles tokenisation, inference, and post-processing. task= selects the right defaults.',
        'AutoModel + AutoTokenizer: more control. Load the model, run forward pass manually, interpret logits yourself.',
        'Device placement: model.to("cuda") or use device_map="auto" for multi-GPU with accelerate. dtype=torch.float16 halves memory.',
        'Quantisation: load_in_4bit=True (bitsandbytes QLoRA) or use a GGUF file with llama-cpp-python for CPU inference.',
        'Tokeniser alignment: always load the tokeniser from the same model name as the weights. Mismatched tokenisers produce garbage.',
      ],
    },
    {
      heading: 'HuggingFace Inference API',
      points: [
        'Serverless: send a POST to api-inference.huggingface.co/models/{model_id}. No GPU setup, no Python — just HTTP.',
        'TypeScript: npm install @huggingface/inference. client.textGeneration(), client.featureExtraction() (embeddings), client.textClassification().',
        'Free tier: rate-limited, cold starts for large models. Pro tier ($9/month) for dedicated endpoints and higher rate limits.',
        'Dedicated Endpoints: deploy any model to a persistent GPU endpoint at inference.endpoints.huggingface.co — pay per hour.',
        'Spaces + Gradio: one Python file deploys a model demo with UI to a free CPU/GPU Space. Best for sharing with non-technical stakeholders.',
      ],
    },
    {
      heading: 'Model Cards and Choosing Models',
      points: [
        'Model card: every Hub model has a README.md with task, languages, training data, limitations, bias analysis, and evaluation results.',
        'Choosing a model: start with task filter on Hub. Sort by downloads (popularity) or likes. Check: licence, model card quality, recency.',
        'Leaderboards: Open LLM Leaderboard (language models), MTEB Leaderboard (embeddings), Papers With Code for task-specific SotA.',
        'Parameter count vs capability: 7B instruction-tuned models (Llama 3, Mistral 7B, Phi-3) are often sufficient for most tasks at far lower cost.',
        'GGUF models: quantised for llama.cpp. Q4_K_M: good quality/size balance. Q5_K_M: higher quality. Q8_0: near-lossless. Run on CPU/Mac.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'HF Inference API (TS)',
      language: 'typescript',
      code: `// HuggingFace Inference API — TypeScript
// npm install @huggingface/inference

import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env['HF_TOKEN']);

// Text generation
async function generate(prompt: string): Promise<string> {
  const result = await hf.textGeneration({
    model: 'mistralai/Mistral-7B-Instruct-v0.3',
    inputs: \`<s>[INST] \${prompt} [/INST]\`,
    parameters: { max_new_tokens: 256, temperature: 0.7, return_full_text: false },
  });
  return result.generated_text;
}

// Text embeddings
async function embed(text: string): Promise<number[]> {
  const result = await hf.featureExtraction({
    model: 'BAAI/bge-small-en-v1.5',
    inputs: text,
  });
  return result as number[];
}

// Sentiment classification
async function classify(text: string) {
  return hf.textClassification({
    model: 'distilbert/distilbert-base-uncased-finetuned-sst-2-english',
    inputs: text,
  });
}

// Zero-shot classification (no training needed for new labels)
async function zeroShot(text: string, labels: string[]) {
  return hf.zeroShotClassification({
    model: 'facebook/bart-large-mnli',
    inputs: text,
    parameters: { candidate_labels: labels },
  });
}`,
    },
    {
      label: 'Transformers (Python)',
      language: 'typescript',
      code: `// HuggingFace Transformers — Python (pseudocode)
// pip install transformers torch accelerate

// # 1. Highest level: pipeline() — one line inference
// from transformers import pipeline

// # NLP tasks
// classifier = pipeline("sentiment-analysis")
// print(classifier("I love this product!"))  # [{'label': 'POSITIVE', 'score': 0.99}]

// summariser = pipeline("summarization", model="facebook/bart-large-cnn")
// print(summariser(long_article, max_length=150, min_length=50))

// # LLM text generation
// generator = pipeline("text-generation",
//   model="mistralai/Mistral-7B-Instruct-v0.3",
//   device_map="auto", torch_dtype="bfloat16")
// result = generator("<s>[INST] Explain RAG in one paragraph [/INST]",
//   max_new_tokens=300, do_sample=True, temperature=0.7)

// # 2. Manual: AutoModel + AutoTokenizer
// from transformers import AutoModelForCausalLM, AutoTokenizer
// import torch

// model_id = "meta-llama/Meta-Llama-3-8B-Instruct"
// tokenizer = AutoTokenizer.from_pretrained(model_id)
// model = AutoModelForCausalLM.from_pretrained(
//   model_id, device_map="auto", torch_dtype=torch.bfloat16)

// messages = [{"role": "user", "content": "What is RLHF?"}]
// inputs = tokenizer.apply_chat_template(messages, return_tensors="pt").to("cuda")
// with torch.no_grad():
//     outputs = model.generate(inputs, max_new_tokens=512)
// print(tokenizer.decode(outputs[0][inputs.shape[1]:], skip_special_tokens=True))

// # 3. Push your fine-tuned model to Hub
// model.push_to_hub("your-username/my-custom-model")
// tokenizer.push_to_hub("your-username/my-custom-model")`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using the wrong tokeniser for a model',
      wrong: `# Loading tokeniser from a different model family
tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
model = AutoModelForCausalLM.from_pretrained("meta-llama/Meta-Llama-3-8B")
# BERT's WordPiece tokeniser ≠ LLaMA's BPE tokeniser → garbage output`,
      right: `# Always load tokeniser FROM the same model ID as the weights
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3-8B")
model = AutoModelForCausalLM.from_pretrained("meta-llama/Meta-Llama-3-8B")`,
      explanation: 'Every model is trained with a specific tokeniser. The model\'s embedding table maps token IDs to vectors — if token ID 1234 means "love" in BERT\'s vocabulary but "Ġtree" in LLaMA\'s, the model receives completely wrong inputs.',
    },
    {
      title: 'Loading large models in full float32 precision',
      wrong: `# Default: float32 — 4 bytes per param
model = AutoModelForCausalLM.from_pretrained("meta-llama/Meta-Llama-3-8B")
# 8B × 4 bytes = 32GB VRAM — won't fit on a single A100 40GB`,
      right: `# bfloat16: 2 bytes per param (same numeric range as float32)
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Meta-Llama-3-8B",
    torch_dtype=torch.bfloat16,     # halves memory to ~16GB
    device_map="auto"               # auto-shards across available GPUs
)`,
      explanation: 'float32 needs 4 bytes/parameter. An 8B model requires 32GB VRAM. bfloat16 halves this to 16GB with negligible quality loss. For CPU or consumer GPU: use 4-bit GGUF via llama-cpp-python (~4.5GB for 8B Q4_K_M).',
    },
    {
      title: 'Not setting pad_token for generative models',
      wrong: `tokenizer = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3-8B")
inputs = tokenizer(texts, return_tensors="pt", padding=True)
# RuntimeError: No padding token set — batch inference fails`,
      right: `tokenizer = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3-8B")
tokenizer.pad_token = tokenizer.eos_token  # use EOS as padding token
tokenizer.padding_side = "left"             # left-pad for generation
inputs = tokenizer(texts, return_tensors="pt", padding=True)`,
      explanation: 'Causal LMs like LLaMA are trained without a pad token. For batched inference, you must set one. EOS is the standard choice. Left-padding matters for generation — the model generates from the rightmost token.',
    },
    {
      title: 'Applying chat template manually instead of using apply_chat_template',
      wrong: `# Manual prompt formatting — gets special tokens wrong
prompt = f"[INST] {user_message} [/INST]"  # Mistral format
# But LLaMA-3 uses a completely different format with <|begin_of_text|> etc.`,
      right: `# Use apply_chat_template — handles all model-specific formats
messages = [{"role": "user", "content": user_message}]
prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
# Automatically uses the correct format for any model family`,
      explanation: 'Each model family has unique chat templates with different special tokens. apply_chat_template reads the template from tokenizer_config.json and formats messages correctly. Manual formatting almost always gets some detail wrong.',
    },
  ];

  challenge: Challenge = {
    title: 'Cosine Similarity of Embeddings',
    language: 'typescript',
    description: 'Given two text embedding vectors from a model like bge-small-en, compute their cosine similarity and classify the relationship as "very similar" (>0.9), "related" (0.7–0.9), or "unrelated" (<0.7).',
    hints: [
      'cosine = dot(a, b) / (|a| * |b|)',
      'Pre-normalised embeddings from HuggingFace models have |v| = 1, so cosine = dot(a, b)',
    ],
    starterCode: `function classifyEmbeddingSimilarity(a: number[], b: number[]): { score: number; label: string } {
  // Return cosine similarity score and label
}`,
    solution: `function classifyEmbeddingSimilarity(a: number[], b: number[]): { score: number; label: string } {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  const score = dot / (na * nb + 1e-10);
  const label = score > 0.9 ? 'very similar' : score > 0.7 ? 'related' : 'unrelated';
  return { score: Math.round(score * 1000) / 1000, label };
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Why must you always load the tokeniser from the same model ID as the weights?',
      options: [
        'To reduce download size',
        'Each model has a unique vocabulary — token IDs map to different subwords; mismatching produces wrong inputs to the model',
        'For licensing compliance',
        'To enable GPU acceleration',
      ],
      answer: 1,
      explanation: 'Models learn to map token ID → embedding during training. BERT token ID 1234 ≠ LLaMA token ID 1234. Using BERT\'s tokeniser with LLaMA\'s weights means every token ID is wrong — the model receives completely different inputs than it was trained on.',
    },
    {
      q: 'What does apply_chat_template() do?',
      options: [
        'Creates a Gradio chat interface',
        'Formats messages into the model-specific prompt structure with correct special tokens',
        'Applies a chat history length limit',
        'Converts text to speech',
      ],
      answer: 1,
      explanation: 'Each model has a unique chat template (LLaMA-3 uses <|begin_of_text|><|start_header_id|>..., Mistral uses [INST]...). apply_chat_template reads the template from the model\'s tokenizer_config.json and formats messages correctly.',
    },
    {
      q: 'What is the advantage of loading a model in bfloat16 vs float32?',
      options: [
        'bfloat16 increases model accuracy',
        'bfloat16 halves memory usage (2 bytes vs 4 bytes per parameter) with negligible quality loss',
        'bfloat16 enables quantisation',
        'bfloat16 is required for multi-GPU training',
      ],
      answer: 1,
      explanation: 'bfloat16 uses 2 bytes per parameter vs 4 for float32 — cutting VRAM requirement in half. It has the same dynamic range as float32 (8 exponent bits) so numerical overflow/underflow issues are rare, unlike float16.',
    },
  { q: 'What is the AutoModel class in Hugging Face Transformers?', options: ['A class that automatically trains models', 'A factory class that loads the correct model architecture from a checkpoint name or config', 'A wrapper for model deployment', 'A data preprocessing pipeline'], answer: 1, explanation: 'AutoModel (AutoModelForSequenceClassification, AutoModelForCausalLM, etc.) infers the model architecture from the model name or config.json and loads the correct class. Eliminates hardcoding model class names — load any supported model with the same code.' },
  { q: 'What is the Hugging Face Pipeline API?', options: ['A CI/CD pipeline', 'A high-level API that wraps tokenization, model inference, and postprocessing for common NLP tasks', 'A data preprocessing library', 'A framework for multi-GPU training'], answer: 1, explanation: 'pipeline(task, model=...) returns a ready-to-use inference pipeline. Tasks: text-generation, text-classification, ner, question-answering, summarization, translation, fill-mask. One line handles tokenization, inference, and decoding. Good for prototyping; for production, use the underlying model/tokenizer for efficiency.' },
  { q: 'What is the Hugging Face Hub and what can you do with it?', options: ['A cloud training platform only', 'A model/dataset/space repository for sharing, versioning, and deploying ML artifacts', 'A GPU cluster service', 'An annotation tool'], answer: 1, explanation: 'Hugging Face Hub: public/private repository for models, datasets, and Spaces (demo apps). Features: version control (Git-LFS for large files), model cards, dataset cards, inference API. from_pretrained(hub_name) downloads automatically. push_to_hub() uploads your model.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I run a 7B model locally without a GPU?',
      a: 'Use llama.cpp + a GGUF-quantised model. Install llama-cpp-python (Python bindings) or use the Ollama app. Download a Q4_K_M GGUF file from Hugging Face (search "llama-3-8b-instruct GGUF") — ~4.5GB. Q4_K_M gives 95%+ quality vs full precision at 25% the size. On an M2 MacBook Pro, 7B Q4_K_M runs at ~40 tokens/second — perfectly usable for prototyping. Ollama wraps this into one command: ollama run llama3.',
    },
    {
      q: 'When should I use the Inference API vs self-hosting?',
      a: 'Inference API: prototyping, demos, <10K requests/day, no GPU budget. Instant start, no ops. Use @huggingface/inference in TypeScript. Self-hosting (vLLM on cloud GPU or local): high throughput, data privacy, latency SLA, or using a model not available via the API. Rule of thumb: if your monthly Inference API bill exceeds what a $2/hour GPU VM would cost running the same load, self-host. Dedicated Endpoints (HF cloud) bridge the two: managed infra, your model, per-hour billing.',
    },
  { q: 'How do you fine-tune a Hugging Face model with the Trainer API?', a: 'Steps: (1) Load tokenizer and model with AutoTokenizer/AutoModelForTask; (2) Tokenize dataset with tokenizer(batch, truncation=True, padding=True); (3) Define TrainingArguments (output_dir, num_epochs, batch_size, eval_strategy); (4) Create Trainer(model, args, train_dataset, eval_dataset, compute_metrics); (5) trainer.train(). The Trainer handles gradient accumulation, mixed precision, distributed training, and checkpointing. Use Callbacks for custom logic.' },
  { q: 'How do you run inference efficiently with a Hugging Face model?', a: 'Optimizations: (1) Move to GPU: model.to(device); use model.half() for FP16 (2x speedup); (2) Batch inputs — avoid one-by-one inference; (3) @torch.no_grad() context (disable gradient computation); (4) torchscript or ONNX export for production; (5) BitsAndBytes 4-bit/8-bit quantization (load_in_4bit=True) for LLM inference on smaller GPUs; (6) Text Generation Inference (TGI) server for high-throughput LLM serving.' },
  { q: 'What is the difference between a tokenizer\'s encode() and __call__() methods?', a: 'encode(text): returns a list of token IDs only. __call__(text) or tokenize(text) with return_tensors=pt: returns a dict with input_ids, attention_mask, and optionally token_type_ids. Use __call__() for model input — it pads and truncates correctly and returns tensors. encode() is useful when you just need IDs for analysis. batch_encode_plus() and __call__() on lists handle batches.' },
  { q: 'How do you handle long documents that exceed the model token limit?', a: 'Strategies: (1) Truncation: simply cut to max_length — loses information. (2) Sliding window: process overlapping chunks and aggregate predictions (useful for token classification, QA). (3) Hierarchical models: chunk into segments, encode each, pool segment representations. (4) Long-context models: Longformer, BigBird, or newer 128k+ context models. (5) Summarize first: use a summarization model to compress before classification/extraction.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'HuggingFace Hub: 800K+ models. pipeline() for one-line inference; AutoModel+AutoTokenizer for control. Use bfloat16 to halve VRAM. apply_chat_template for correct prompt formatting.',
    mustKnow: [
      'Always load tokeniser from same model ID as weights — vocabulary must match',
      'pipeline(task, model=...) — auto tokenise → infer → post-process',
      'bfloat16: 2 bytes/param vs 4 for float32 — half VRAM, same range',
      'device_map="auto": shards model across available GPUs with accelerate',
      'apply_chat_template(): model-specific formatting with correct special tokens',
      'GGUF + llama.cpp: run quantised 7B models on CPU/Mac at ~40 tok/s',
    ],
    interviewFocus: [
      'What happens if you use the wrong tokeniser for a model?',
      'How would you run a 7B model on a machine with no GPU?',
      'When would you use the HF Inference API vs self-hosting?',
    ],
  };
}
