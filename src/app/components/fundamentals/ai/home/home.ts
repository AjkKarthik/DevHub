import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic { title: string; route: string; badge: string; description: string; keyPoints: string[]; available: boolean; }

const BADGE_CSS: Record<string, string> = {
  'Foundations': 'foundations', 'Machine Learning': 'ml', 'Deep Learning': 'dl',
  'LLMs': 'llms', 'Prompt Eng.': 'prompt', 'AI Agents': 'agents',
  'MLOps': 'mlops', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Foundations', 'Machine Learning', 'Deep Learning', 'LLMs', 'Prompt Eng.', 'AI Agents', 'MLOps', 'Reference'];

const ALL_TOPICS: Topic[] = [
  { title: 'AI & ML Fundamentals', route: '/ai', badge: 'Foundations', description: 'Supervised, unsupervised, and reinforcement learning — the types of ML problems and how models learn.', keyPoints: ['Supervised vs unsupervised', 'Training/validation/test split', 'Bias-variance trade-off', 'Loss functions and optimisation', 'Overfitting and regularisation'], available: false },
  { title: 'Mathematics for ML', route: '/ai', badge: 'Foundations', description: 'Linear algebra (vectors, matrices), calculus (gradients), and probability concepts underpinning ML.', keyPoints: ['Vector dot product', 'Matrix multiplication', 'Gradient: direction of steepest ascent', 'Chain rule for backprop', 'Probability and Bayes theorem'], available: false },
  { title: 'Linear & Logistic Regression', route: '/ai', badge: 'Machine Learning', description: 'Linear regression for continuous output and logistic regression for binary classification.', keyPoints: ['OLS linear regression', 'Gradient descent update rule', 'Sigmoid activation', 'Log loss (cross-entropy)', 'Decision boundary'], available: false },
  { title: 'Decision Trees & Random Forests', route: '/ai', badge: 'Machine Learning', description: 'Tree-based models — Gini impurity, information gain, ensembles, and feature importance.', keyPoints: ['Gini impurity split criterion', 'Information gain (entropy)', 'Overfitting in deep trees', 'Random Forest bagging', 'Feature importance ranking'], available: false },
  { title: 'Gradient Boosting (XGBoost)', route: '/ai', badge: 'Machine Learning', description: 'Boosting ensembles — AdaBoost, Gradient Boosting, XGBoost, and LightGBM for tabular data.', keyPoints: ['Sequential weak learner ensemble', 'XGBoost regularisation', 'Learning rate and n_estimators', 'LightGBM leaf-wise growth', 'SHAP feature importance'], available: false },
  { title: 'Clustering & Dimensionality Reduction', route: '/ai', badge: 'Machine Learning', description: 'K-means, DBSCAN, PCA, t-SNE, and UMAP for unsupervised learning.', keyPoints: ['K-means inertia and elbow', 'DBSCAN density-based', 'PCA principal components', 't-SNE 2D visualisation', 'UMAP vs t-SNE'], available: false },
  { title: 'Neural Networks', route: '/ai', badge: 'Deep Learning', description: 'Perceptrons, activation functions, forward and backpropagation, and training a basic neural net.', keyPoints: ['Input → hidden → output layers', 'ReLU, sigmoid, tanh activations', 'Forward pass computation', 'Backpropagation gradient flow', 'Batch and SGD optimisers'], available: false },
  { title: 'CNNs & Computer Vision', route: '/ai', badge: 'Deep Learning', description: 'Convolutional layers, pooling, transfer learning with ResNet/EfficientNet, and image classification.', keyPoints: ['Convolution kernel sliding', 'Max pooling downsampling', 'Transfer learning with ImageNet', 'ResNet skip connections', 'Data augmentation techniques'], available: false },
  { title: 'Transformers & Attention', route: '/ai', badge: 'Deep Learning', description: 'Self-attention mechanism, multi-head attention, positional encoding, and the Transformer architecture.', keyPoints: ['Query, Key, Value matrices', 'Scaled dot-product attention', 'Multi-head attention', 'Positional encoding', 'Encoder-decoder architecture'], available: false },
  { title: 'LLM Fundamentals', route: '/ai', badge: 'LLMs', description: 'How large language models are pre-trained, tokenisation, context windows, and inference.', keyPoints: ['Pre-training on next token prediction', 'BPE tokenisation', 'Context window tokens', 'Temperature and sampling', 'Model families (GPT, Claude, Llama)'], available: false },
  { title: 'Fine-tuning & RLHF', route: '/ai', badge: 'LLMs', description: 'Instruction fine-tuning, LoRA, QLoRA, RLHF, and DPO for aligning LLMs to tasks and preferences.', keyPoints: ['Instruction fine-tuning', 'LoRA: low-rank adaptation', 'QLoRA 4-bit quantisation', 'RLHF reward model', 'DPO direct preference optimisation'], available: false },
  { title: 'RAG (Retrieval Augmented Generation)', route: '/ai', badge: 'LLMs', description: 'Augment LLM responses with retrieved documents — vector search, embeddings, and RAG pipelines.', keyPoints: ['Embed documents into vectors', 'Vector search (cosine similarity)', 'Retrieve top-k chunks', 'Add context to prompt', 'LangChain / LlamaIndex RAG'], available: false },
  { title: 'Prompt Engineering', route: '/ai', badge: 'Prompt Eng.', description: 'System prompts, few-shot examples, chain-of-thought, and structured output prompting techniques.', keyPoints: ['System vs user vs assistant roles', 'Few-shot examples in prompt', 'Chain-of-thought "think step by step"', 'Output format constraints (JSON)', 'Prompt injection awareness'], available: false },
  { title: 'AI Agents & Tool Use', route: '/ai', badge: 'AI Agents', description: 'LLM-powered agents with tool calling — ReAct pattern, function calling, and multi-agent systems.', keyPoints: ['ReAct: Reason + Act loop', 'Function/tool calling API', 'Agent memory (short/long-term)', 'Multi-agent orchestration', 'LangGraph and Autogen'], available: false },
  { title: 'Vector Databases', route: '/ai', badge: 'AI Agents', description: 'Pinecone, Weaviate, Chroma, and pgvector for storing and querying embedding vectors at scale.', keyPoints: ['Embedding storage', 'ANN: approximate nearest neighbour', 'HNSW index structure', 'Filtering by metadata', 'Pgvector in PostgreSQL'], available: false },
  { title: 'MLOps & Model Deployment', route: '/ai', badge: 'MLOps', description: 'Model serving, FastAPI inference endpoints, model registry, monitoring, and CI/CD for ML models.', keyPoints: ['Model versioning (MLflow)', 'FastAPI prediction endpoint', 'Containerise model with Docker', 'Online vs batch inference', 'Model drift monitoring'], available: false },
  { title: 'Hugging Face & Model Hub', route: '/ai', badge: 'MLOps', description: 'Hugging Face ecosystem — model hub, datasets, Transformers library, and Spaces for demos.', keyPoints: ['pipeline() for zero-code inference', 'AutoModel and AutoTokenizer auto-select', 'Datasets library for efficient data loading', 'Model Hub: 500k+ pretrained models', 'Spaces: deploy Gradio/Streamlit demos'], available: false },
  { title: 'Evaluating LLM Outputs', route: '/ai', badge: 'LLMs', description: 'LLM evaluation metrics — BLEU, ROUGE, BERTScore, LLM-as-judge, and human evaluation frameworks.', keyPoints: ['BLEU/ROUGE: n-gram overlap for translation/summarisation', 'BERTScore: semantic similarity via embeddings', 'LLM-as-judge: use a strong LLM to rate outputs', 'RAGAS: evaluate RAG pipelines (faithfulness, relevance)', 'Evals in CI: catch regressions before deployment'], available: false },
  { title: 'AI Engineering Patterns', route: '/ai', badge: 'AI Agents', description: 'Prompt caching, context management, streaming, structured output, and cost optimisation patterns.', keyPoints: ['Structured output: JSON mode / response_format = {type: "json_object"}', 'Streaming: stream tokens as they generate for responsive UI', 'Prompt caching: Anthropic/OpenAI cache prefix to cut costs', 'Token counting: tiktoken / claude token counter for budget management', 'Fallback routing: fast cheap model → capable model on failure'], available: false },
  { title: 'AI Interview Prep', route: '/ai', badge: 'Reference', description: '35+ AI/ML interview questions — ML fundamentals, LLMs, RAG, agents, and production deployment.', keyPoints: ['Explain the attention mechanism in Transformers', 'What is the difference between fine-tuning and RAG?', 'How do you evaluate the quality of an LLM application?'], available: false },
  { title: 'Responsible AI & Ethics', route: '/ai', badge: 'Reference', description: 'Bias, fairness, explainability (SHAP/LIME), safety, and governance frameworks for AI systems.', keyPoints: ['Dataset bias sources', 'Fairness metrics (equalised odds)', 'SHAP local explanations', 'LIME model-agnostic explanations', 'AI safety and alignment'], available: false },
  { title: 'AI with .NET & C#', route: '/ai', badge: 'Reference', description: 'Semantic Kernel, Microsoft.Extensions.AI, and Azure OpenAI SDK for building AI apps in C#.', keyPoints: ['Semantic Kernel plugins', 'Microsoft.Extensions.AI abstraction', 'Azure OpenAI client', 'Chat completion and streaming', 'AI memory and vector store'], available: false },
];

@Component({ selector: 'app-ai-home', standalone: true, imports: [RouterLink], templateUrl: './home.html', styleUrl: './home.scss' })
export class AiHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'foundations'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
