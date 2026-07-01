import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'RAG',            type: 'keyword', desc: 'Retrieval-Augmented Generation — retrieve relevant docs, inject into LLM context.' },
  { name: 'Vector DB',      type: 'keyword', desc: 'Stores dense embeddings; ANN search finds semantically similar vectors. Pinecone, Weaviate, pgvector.' },
  { name: 'Embedding',      type: 'keyword', desc: 'Dense vector representation of text/image. Similar meaning → close vectors in embedding space.' },
  { name: 'ANN',            type: 'keyword', desc: 'Approximate Nearest Neighbour search (HNSW, IVF). Fast similarity search in high-dim space.' },
  { name: 'vLLM',           type: 'keyword', desc: 'High-throughput LLM serving with PagedAttention — 24× throughput vs naive serving.' },
  { name: 'KV cache',       type: 'keyword', desc: 'Cached attention key/values for prefix tokens — avoids recomputing shared system prompt.' },
  { name: 'Feature store',  type: 'keyword', desc: 'Centralised store of precomputed ML features. Online (low-latency) and offline (batch) views.' },
  { name: 'Model registry', type: 'keyword', desc: 'Versioned store of trained model artefacts with metadata (accuracy, training data, owner).' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'RAG architecture',
    points: [
      'Problem: LLMs have a knowledge cutoff and limited context window — cannot answer questions about your private data.',
      'RAG: at query time, retrieve relevant documents → inject into LLM prompt → LLM generates grounded answer.',
      'Pipeline: user query → embed query → ANN search in vector DB → retrieve top-K chunks → LLM prompt with chunks → response.',
      'Quality depends on: chunk size, embedding model quality, retrieval top-K, and prompt template.',
    ],
  },
  {
    heading: 'Vector databases and embeddings',
    points: [
      'Embedding model converts text → 768–3072 dimensional dense vector (e.g. text-embedding-3-large).',
      'Vector DB indexes embeddings using HNSW or IVF for fast ANN search (milliseconds at millions of vectors).',
      'HNSW (Hierarchical Navigable Small World): graph-based, high recall, fast insert. Default in Weaviate/Pinecone.',
      'Metadata filtering: filter by date, author, category before vector search — reduces search space.',
    ],
  },
  {
    heading: 'LLM serving at scale',
    points: [
      'Naïve serving: one GPU per request. Throughput: ~1 request/sec on a single A100.',
      'Continuous batching: multiple requests share GPU in parallel, even mid-generation. 10-20× throughput.',
      'vLLM PagedAttention: KV cache managed in non-contiguous pages — eliminates memory waste from fragmentation.',
      'KV cache prefill: shared system prompt KV cache is pre-computed once, reused across all requests.',
    ],
  },
  {
    heading: 'ML platform components',
    points: [
      'Feature store: Feast, Tecton. Serves precomputed features at < 1ms (online store, Redis-backed).',
      'Model registry: MLflow, SageMaker Model Registry. Tracks versions, metrics, and deployment state.',
      'Training pipeline: data ingestion → preprocessing → training → evaluation → registration. Orchestrated by Kubeflow or Airflow.',
      'Experiment tracking: MLflow/W&B logs hyperparameters, metrics, and artefacts per run.',
    ],
  },
  {
    heading: 'Feature Stores and Training-Serving Skew',
    points: [
      'A feature store centralizes the computation and storage of ML features, ensuring the exact same feature computation logic is used both during model training and at inference time — inconsistency between these two paths (training-serving skew) is one of the most common causes of models performing worse in production than in offline evaluation.',
      'Online feature stores serve low-latency feature lookups for real-time inference (a recommendation model needing a user\'s recent activity in milliseconds), while offline feature stores serve batch feature computation for training — both must derive from the same underlying feature definitions to avoid skew.',
      'Model serving infrastructure must handle versioning carefully — deploying a new model version alongside the old one (shadow deployment or canary rollout) lets you validate the new model\'s real-world performance against production traffic before fully cutting over, catching regressions that offline evaluation metrics might miss.',
      'Monitoring for ML systems extends beyond typical infrastructure metrics to include model-specific signals — prediction distribution drift, feature distribution drift, and label delay (the time between a prediction and knowing whether it was correct) all require dedicated monitoring beyond standard latency/error-rate dashboards.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'RAG Pipeline',
    language: 'typescript',
    code: `// RAG pipeline: document ingestion + query

// INGESTION: index documents into vector DB
async function ingestDocument(doc: Document): Promise<void> {
  // 1. Chunk document (512 tokens, 50-token overlap)
  const chunks = chunkText(doc.content, { size: 512, overlap: 50 });

  // 2. Embed each chunk
  const embeddings = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: chunks.map(c => c.text),
  });

  // 3. Upsert into vector DB (Pinecone)
  await pinecone.index('docs').upsert(
    chunks.map((chunk, i) => ({
      id: \`\${doc.id}-chunk-\${i}\`,
      values: embeddings.data[i].embedding,
      metadata: {
        docId: doc.id,
        text: chunk.text,
        source: doc.url,
        createdAt: doc.createdAt,
      },
    }))
  );
}

// QUERY: retrieve + generate
async function ragQuery(question: string, userId: string): Promise<string> {
  // 1. Embed the question
  const queryEmbedding = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: question,
  });

  // 2. ANN search — retrieve top 5 most relevant chunks
  const results = await pinecone.index('docs').query({
    vector: queryEmbedding.data[0].embedding,
    topK: 5,
    includeMetadata: true,
    filter: { userId: { $eq: userId } },  // metadata filter
  });

  const context = results.matches
    .map(m => m.metadata?.text ?? '')
    .join('\n\n---\n\n');

  // 3. Generate answer with retrieved context
  const response = await openai.chat.completions.create({
    model: 'claude-sonnet-4-6',
    messages: [
      { role: 'system', content: 'Answer based only on the provided context. If unsure, say so.' },
      { role: 'user',   content: \`Context:\n\${context}\n\nQuestion: \${question}\` },
    ],
    max_tokens: 1024,
  });

  return response.choices[0].message.content ?? '';
}`,
  },
  {
    label: 'LLM Serving (vLLM)',
    language: 'bash',
    code: `# vLLM — high-throughput LLM serving

# Install and serve a model
pip install vllm
python -m vllm.entrypoints.openai.api_server \\
  --model meta-llama/Llama-3-8B-Instruct \\
  --tensor-parallel-size 2 \\   # split model across 2 GPUs
  --max-model-len 8192 \\
  --gpu-memory-utilization 0.9 \\
  --enable-prefix-caching \\     # cache shared system prompt KV
  --port 8000

# vLLM exposes OpenAI-compatible API:
curl http://localhost:8000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "meta-llama/Llama-3-8B-Instruct",
    "messages": [{"role": "user", "content": "Explain HNSW"}],
    "max_tokens": 512
  }'

# Throughput comparison (A100 GPU, Llama-3-8B):
# Naive (one request at a time):   ~15 tokens/sec
# vLLM continuous batching:        ~350 tokens/sec (23x)
# vLLM + prefix caching:           ~500 tokens/sec (same prompt prefix)

# Kubernetes deployment:
# resources:
#   limits:
#     nvidia.com/gpu: 2     # 2× A100 for tensor parallelism
#     memory: 80Gi
# HPA: scale on GPU utilisation > 70%`,
  },
  {
    label: 'Feature Store Pattern',
    language: 'typescript',
    code: `// ML feature store — online serving + offline training

// Online store: Redis-backed, < 1ms latency
// Used by inference service to fetch features at prediction time
async function getUserFeatures(userId: string): Promise<UserFeatures> {
  const cacheKey = \`features:user:\${userId}\`;

  // Try online store first (Redis)
  const cached = await redis.hGetAll(cacheKey);
  if (cached && Object.keys(cached).length > 0) {
    return {
      avgOrderValue: parseFloat(cached.avg_order_value),
      purchaseCount30d: parseInt(cached.purchase_count_30d),
      lastActiveHours: parseInt(cached.last_active_hours),
      churnRiskScore: parseFloat(cached.churn_risk_score),
    };
  }

  // Fallback to offline store (BigQuery/Snowflake) — slower
  const features = await bigquery.query(\`
    SELECT avg_order_value, purchase_count_30d,
           TIMESTAMP_DIFF(NOW(), last_active, HOUR) AS last_active_hours,
           churn_risk_score
    FROM ml_features.user_features
    WHERE user_id = ? AND feature_date = CURRENT_DATE
  \`, [userId]);

  // Backfill online store
  await redis.hSet(cacheKey, {
    avg_order_value: features[0].avg_order_value,
    purchase_count_30d: features[0].purchase_count_30d,
    last_active_hours: features[0].last_active_hours,
    churn_risk_score: features[0].churn_risk_score,
  });
  await redis.expire(cacheKey, 3600);  // 1 hour TTL

  return features[0];
}

// Batch pipeline: compute features → write to both offline + online stores
// Runs every hour via Airflow:
// BigQuery SQL → aggregate → write to BQ (offline) + Redis (online)`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Chunks too large — RAG retrieval misses specifics',
    wrong: `// Chunk entire sections (2000+ tokens)
// Query: "What is the refund policy for digital goods?"
// Retrieves: entire 2000-token "Policies" section
// LLM context window: 10% used for actual answer, 90% noise`,
    right: `// Chunk at paragraph level (128-512 tokens) with overlap
// Query matches specific paragraph about digital goods refunds
// LLM receives focused context → higher accuracy
// Overlap (50 tokens) prevents splitting sentences across chunks`,
    explanation: 'Large chunks reduce recall precision — the relevant sentence is buried in 2000 tokens of noise. Smaller chunks (128-512 tokens) with overlap improve retrieval accuracy. The overlap ensures no sentence is split at a boundary.',
  },
  {
    title: 'No KV cache for shared system prompts',
    wrong: `// Every request recomputes system prompt attention
// System prompt: 2000 tokens
// 1000 requests/min × 2000 tokens × compute = enormous waste
// Latency: first-token latency dominated by system prompt prefill`,
    right: `// Enable prefix caching in vLLM (--enable-prefix-caching)
// System prompt KV computed once → cached → reused for all requests
// First-token latency: 200ms → 20ms for cached prefix
// Throughput: 2× improvement when 50% of tokens are shared prefix`,
    explanation: 'Most LLM applications share a long system prompt across all requests. Without prefix caching, every request recomputes those tokens. vLLM prefix caching stores the KV tensors once and reuses them — significant throughput and latency improvement.',
  },
  {
    title: 'Serving predictions without feature parity',
    wrong: `// Training: avg_order_value computed over all-time history
// Serving: avg_order_value from last 30 days only (different query)
// Model trained on one distribution, serving a different one
// Silent accuracy degradation — hard to detect`,
    right: `// Feature store ensures same feature logic for training + serving
// Offline store (BigQuery): same SQL for training data
// Online store (Redis): same features, refreshed hourly
// Train/serve skew = zero — same feature computation`,
    explanation: 'Training-serving skew is one of the most common ML production bugs. When training features differ from serving features, model accuracy silently degrades. A feature store uses the same feature definitions for both training pipelines and online inference.',
  },
  {
    title: 'No model versioning or rollback',
    wrong: `// Deploy new model → overwrite production endpoint
// New model has a regression on a customer segment
// Rollback: retrain previous model (takes hours)`,
    right: `// Model registry: tag versions with metadata
// Blue-green model deployment: both versions serve traffic
// Canary: route 5% to new model, compare metrics
// Instant rollback: switch traffic back to old version in seconds`,
    explanation: 'Model deployments are riskier than code deployments — accuracy regressions are subtle and may only appear on specific data slices. Always version models, deploy via canary, and keep the previous version hot for instant rollback.',
  },
];

const challenge: Challenge = {
  title: 'Design a RAG-based enterprise knowledge assistant',
  language: 'typescript',
  description: `Design an AI assistant for enterprise internal knowledge (Confluence/Notion).

Scale:
- 500k documents, 50M tokens of content
- 10,000 daily active employees asking questions
- Documents updated ~5% per day (new pages, edits)

Requirements:
1. Answers grounded in company docs (not hallucinated)
2. Citations: which documents was this answer based on?
3. Access control: user only retrieves docs they can access
4. Freshness: updated docs reflected in answers within 1 hour
5. P99 response latency < 5 seconds

Design:
- Document ingestion pipeline
- Query pipeline with access control
- Embedding model choice
- Vector DB setup
- LLM inference setup`,
  hints: [
    'Access control: store user_groups in vector metadata, filter on query',
    'Freshness: CDC from Confluence API → embedding job → upsert to vector DB',
    'Citations: return source URL + chunk text alongside generated answer',
    'Latency budget: embedding 100ms + ANN 50ms + LLM 2-4s = under 5s',
  ],
  starterCode: `interface RAGSystem {
  ingestionPipeline: string;
  queryPipeline: string;
  accessControl: string;
  freshness: string;
  latencyBudget: string;
}`,
  solution: `const system: RAGSystem = {
  ingestionPipeline: \`
    1. Confluence webhook → Kafka "doc-updates" topic on every page create/edit/delete
    2. Embedding worker (K8s Deployment, 4 replicas):
       - Consume from Kafka
       - Fetch full page content from Confluence API
       - Chunk: 512 tokens, 50-token overlap (roughly paragraph-level)
       - Embed: text-embedding-3-large (3072-dim) — best recall
       - Upsert into Pinecone with metadata: { docId, url, title, spaceKey, allowedGroups }
    3. Delete events: delete all chunk vectors for that docId
    Freshness: webhook → embedded within 5-15 minutes (Kafka lag + embedding time)
  \`,

  queryPipeline: \`
    1. Embed user question: text-embedding-3-large (~100ms)
    2. Fetch user's group membership from LDAP/Okta cache (Redis, 5m TTL)
    3. Pinecone ANN query with metadata filter:
       { allowedGroups: { $in: userGroups } }  — ACL enforced at retrieval
    4. Retrieve top 5 chunks with scores > 0.75 (cosine threshold)
    5. Build prompt: system + retrieved chunks + question
    6. LLM call: vLLM serving Llama-3-70B or Claude API (streaming)
    7. Return: answer + citations (url, title, excerpt per chunk)
  \`,

  accessControl: \`
    Metadata field: allowedGroups: string[]
    On ingest: fetch page permissions from Confluence API
    → map to internal group IDs → store in vector metadata
    On query: Pinecone metadata filter ensures only accessible chunks retrieved
    Re-index on permission change: Confluence ACL webhook triggers re-upsert
    Zero trust: even if user guesses a docId, vector filter blocks retrieval
  \`,

  freshness: \`
    Webhook-based (preferred): immediate notification of changes
    Polling fallback: crawl Confluence /rest/api/content?lastModified=... every 15 min
    Delta indexing: only re-chunk changed pages (track content hash)
    Full re-index: weekly (catches any missed webhooks)
    Target: > 95% of edits reflected within 1 hour
  \`,

  latencyBudget: \`
    Embedding question:   100ms  (OpenAI embedding API)
    Group lookup (Redis):   5ms
    Pinecone ANN search:   50ms  (top-5, 500k vectors)
    LLM inference (P50): 1500ms  (vLLM, streaming, ~400 output tokens)
    LLM inference (P99): 3500ms  (tail latency from token generation)
    Total P99:           ~3.7s   ← within 5s budget
    Streaming: first token in ~500ms — user sees output start quickly
  \`,
};`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What problem does RAG (Retrieval-Augmented Generation) solve?',
    options: [
      'Reduces LLM inference cost',
      'Allows LLMs to answer questions about private/recent data not in training',
      'Makes LLMs run faster on CPU',
      'Eliminates the need for fine-tuning',
    ],
    answer: 1,
    explanation: 'LLMs have a knowledge cutoff and cannot access private data. RAG retrieves relevant documents at query time and injects them into the LLM context — grounding answers in your specific data without retraining the model.',
  },
  {
    q: 'A vector database is best suited for?',
    options: [
      'Transactional updates with ACID guarantees',
      'Storing time-series metrics',
      'Approximate nearest neighbour search on dense embeddings for semantic similarity',
      'Full-text keyword search',
    ],
    answer: 2,
    explanation: 'Vector databases index high-dimensional embeddings using HNSW or IVF algorithms for fast ANN search. They find semantically similar items — "documents about machine learning" even if the query says "AI papers." Traditional DBs and Elasticsearch serve different use cases.',
  },
  {
    q: 'vLLM\'s continuous batching improves throughput by?',
    options: [
      'Quantising the model to INT4',
      'Processing multiple requests in parallel on the same GPU, even mid-generation',
      'Distributing inference across multiple data centers',
      'Caching the model weights in CPU RAM',
    ],
    answer: 1,
    explanation: 'Naïve serving waits for a request to finish before starting the next. Continuous batching inserts new requests into the batch at each token generation step, keeping GPU utilisation high. vLLM achieves 10-24× throughput improvement over naïve serving.',
  },
  { q: 'What is a feature store in ML system design?', options: ['A database for storing trained model weights', 'A centralized repository for storing, sharing, and serving ML features for training and inference', 'A cache for storing model predictions', 'A version control system for ML experiments'], answer: 1, explanation: 'A feature store is a data management layer that stores computed features for reuse across ML models and teams. It provides offline storage for training using historical data and online storage for low-latency serving during inference. Examples include Feast, Tecton, and Vertex AI Feature Store. Without a feature store, teams recompute the same features redundantly and face training-serving skew when offline and online pipelines diverge.' },
  { q: 'What is training-serving skew and how do you prevent it?', options: ['When training data is larger than serving data', 'When the feature computation logic differs between training and inference, causing prediction quality to degrade in production', 'When the model version in serving is older than the latest trained version', 'When training takes longer than the serving SLA requires'], answer: 1, explanation: 'Training-serving skew occurs when features computed during training differ from those computed at inference time due to different code paths, data preprocessing steps, or data sources. Prevent it by sharing the same feature computation code between training pipelines and serving infrastructure, using a feature store that serves identical features for both, and monitoring feature distributions between training and production to detect drift.' },
  { q: 'What is the role of a model registry in an ML platform?', options: ['It trains models automatically on new data', 'It stores versioned trained models with metadata like metrics and lineage, enabling promotion across environments', 'It deploys models directly to production without human review', 'It generates model architectures via AutoML'], answer: 1, explanation: 'A model registry is a central catalog for versioned ML models, storing artifacts alongside metadata such as training metrics, dataset version, hyperparameters, and approval status. It supports the model lifecycle from experiment to staging to production promotion. Examples include MLflow Model Registry and Vertex AI Model Registry. Teams use it to track which model version is deployed where, roll back to previous versions, and enforce governance gates before production deployment.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should I fine-tune a model vs use RAG?',
    a: 'Use RAG when: your knowledge updates frequently (docs, policies, news); the data is too large for context; you need citations. Use fine-tuning when: you need to teach the model a specific tone, style, or format; you have stable domain knowledge that rarely changes; you need the model to follow very specific output structures. In practice: use RAG first (faster, cheaper, updatable) and only fine-tune if RAG quality is insufficient.',
  },
  {
    q: 'How do you evaluate RAG pipeline quality?',
    a: 'Three key metrics: (1) Retrieval recall: does the correct document appear in the top-K results? Measure with a golden dataset of (question, relevant_doc) pairs. (2) Answer faithfulness: is the answer grounded in the retrieved context (no hallucinations)? Use an LLM judge to score each answer vs its context. (3) Answer relevance: does the answer actually address the question? Human evaluation or LLM judge. Tools: RAGAS, LangSmith, TruEra.',
  },
  { q: 'How do you design an ML prediction pipeline for low-latency inference?', a: 'Low-latency inference requires several design decisions: pre-compute and cache features in an online feature store backed by Redis or Bigtable rather than computing them at request time. Serve models via optimized serving infrastructure like TensorFlow Serving, TorchServe, or Triton Inference Server that handles batching and GPU memory management. Use model quantization and pruning to reduce model size and computation. Deploy models close to users via regional serving endpoints. Use async pre-fetching for predictable user sessions. For very tight latency budgets, use lightweight models like gradient boosted trees instead of deep neural networks.' },
  { q: 'How do you detect and handle data drift in a deployed ML model?', a: 'Data drift occurs when the distribution of input features in production shifts away from the training distribution. Detect it by continuously comparing production feature distributions to training baseline distributions using statistical tests like KL divergence, PSI (Population Stability Index), or Kolmogorov-Smirnov tests. Monitor prediction confidence scores and business metrics as lagging drift indicators. When drift is detected: retrain the model on recent data if labeled data is available, or trigger human review if labels are scarce. Automate retraining pipelines triggered by drift thresholds rather than waiting for scheduled retraining intervals.' },
  { q: 'What is shadow mode deployment for ML models and when is it useful?', a: 'Shadow mode (also called shadow testing) runs a new model candidate in parallel with the production model. The production model serves actual user responses while the shadow model processes the same requests but its predictions are only logged, not shown to users. This lets you compare prediction quality, latency, and resource usage of the new model against production without any user impact. Use shadow mode when replacing a model serving high-traffic endpoints where even a small quality regression would have large business impact, or when the new model uses a significantly different architecture that needs validation at scale before cutover.' },
  { q: 'How do you design an online learning system that updates a model with real-time data?', a: 'Online learning systems update model weights continuously using a stream of incoming labeled examples rather than batch retraining. Architecture: a stream processing layer like Kafka consumes events and extracts features, a mini-batch training service updates model parameters using SGD or similar optimizers, and the updated model is pushed to serving infrastructure. Challenges: concept drift can cause models to overfit to recent data and forget older patterns, requiring careful learning rate scheduling. Feature pipeline must produce identical features for online training and inference to prevent skew. Model quality must be monitored continuously because bugs in the training stream can corrupt the model rapidly without the safety checkpoint of a batch review step.' },
];

const revision: RevisionSummary = {
  oneLiner: 'RAG: embed query → ANN search vector DB → inject top-K chunks into LLM prompt. vLLM continuous batching for serving. Feature store for training-serving parity.',
  mustKnow: [
    'RAG pipeline: embed query → vector DB ANN search → LLM with retrieved context',
    'Embedding: dense vector; ANN (HNSW) finds semantic neighbours in milliseconds',
    'Chunk size matters: 128-512 tokens with 50-token overlap for best recall',
    'vLLM continuous batching: 10-24× throughput vs naïve single-request serving',
    'KV prefix cache: shared system prompt computed once, reused across requests',
    'Feature store: same feature definitions for training and serving (eliminates skew)',
  ],
  interviewFocus: [
    'Walk through RAG: query embedding → Pinecone search → LLM prompt construction',
    'Access control in RAG: metadata filter on vector query (not post-filtering)',
    'vLLM vs naïve serving: what continuous batching does and why it matters',
    'RAG vs fine-tuning: when to choose each approach',
  ],
};

@Component({
  selector: 'app-sysdesign-ai-ml',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './ai-ml-system-design.html',
  styleUrl: './ai-ml-system-design.scss',
})
export class SysdesignAiMl {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
