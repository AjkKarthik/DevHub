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
  selector: 'app-ai-mlops',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            CommonMistakesComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './mlops.html',
  styleUrl: './mlops.scss',
})
export class AiMlops {
  quickRef: QuickRefItem[] = [
    { name: 'MLOps',          type: 'keyword', desc: 'DevOps practices for ML: CI/CD for models, data versioning, experiment tracking, monitoring.' },
    { name: 'Model registry',  type: 'keyword', desc: 'Versioned store of trained models with metadata — MLflow, Weights & Biases, Hugging Face Hub.' },
    { name: 'Experiment tracking', type:'keyword',desc: 'Log hyperparameters, metrics, and artifacts per training run — MLflow, W&B, Comet.' },
    { name: 'Feature store',   type: 'keyword', desc: 'Centralised feature computation and storage — prevents train/serve skew. Feast, Tecton.' },
    { name: 'Data drift',      type: 'keyword', desc: 'Input distribution shifts over time → model performance degrades. Monitor feature statistics.' },
    { name: 'Model serving',   type: 'keyword', desc: 'Deploy models as REST endpoints. Options: TorchServe, BentoML, vLLM (LLMs), Triton Inference Server.' },
    { name: 'Shadow deployment', type:'keyword', desc: 'Route traffic to both old and new model; compare outputs without affecting users.' },
    { name: 'A/B testing',     type: 'keyword', desc: 'Split traffic between model versions, compare metrics. Gradual rollout with automated rollback.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'The ML Lifecycle',
      points: [
        'MLOps extends DevOps to cover the full ML lifecycle: data → features → training → evaluation → serving → monitoring → retraining.',
        'Key difference from software: models are parameterised by both code AND data. Changing either can change model behaviour.',
        'Three axes of versioning: code (git), data (DVC, Delta Lake), models (MLflow, W&B). All three must be reproducible.',
        'CI/CD for ML: on new data or code, automatically retrain, evaluate against a baseline, and promote to production only if metrics improve.',
        'The training-serving skew problem: if feature computation differs between training and serving, the model performs worse in production than offline.',
      ],
    },
    {
      heading: 'Experiment Tracking and Model Registry',
      points: [
        'Experiment tracker: log every training run — hyperparameters, metrics (loss, accuracy, F1), training time, hardware, dataset version.',
        'MLflow: open-source, can self-host. mlflow.log_param(), mlflow.log_metric(), mlflow.sklearn.log_model(). UI shows comparison across runs.',
        'Weights & Biases (W&B): cloud-based, richer UI, automatic system metrics, sweep for hyperparameter optimisation. Industry standard.',
        'Model registry: semantic versioning for models (stage: Staging, Production, Archived). Track who promoted what, when, and why.',
        'Never train a model you can\'t reproduce: log the git commit hash, dataset version, and random seed alongside every run.',
      ],
    },
    {
      heading: 'Model Serving',
      points: [
        'REST API serving: wrap model in a FastAPI/Flask endpoint. Simple, language-agnostic. Not optimal for batch or streaming.',
        'BentoML: Python-native serving framework. Handles batching, versioning, multi-model pipelines, Docker packaging.',
        'vLLM: high-throughput LLM serving. PagedAttention for efficient KV cache management. 20–100× higher throughput than naive HuggingFace serving.',
        'Triton Inference Server (NVIDIA): multi-framework (PyTorch, TensorFlow, ONNX), dynamic batching, GPU scheduling. Enterprise standard.',
        'Batch inference: run model on large datasets offline (Spark + MLlib, Ray). Cost-efficient, no latency requirement.',
      ],
    },
    {
      heading: 'Monitoring and Retraining',
      points: [
        'Data drift: input feature distributions shift (e.g. customers\' purchase patterns change post-holiday). Detect via PSI, KL divergence, or Kolmogorov-Smirnov test.',
        'Concept drift: the relationship between inputs and targets changes (e.g. fraud patterns evolve). Harder to detect — requires labelled production data.',
        'Model performance monitoring: track predictions + actual outcomes. For LLMs: latency, token usage, error rate, user feedback.',
        'Retraining triggers: scheduled (weekly), performance threshold (accuracy < 90%), or data drift threshold (PSI > 0.2).',
        'Canary deployment: route 5% of traffic to new model, monitor for regressions, gradually increase to 100% — or roll back.',
      ],
    },
    {
      heading: 'Model Drift and Why Deployed Models Need Ongoing Monitoring',
      points: [
        'Data drift occurs when the statistical properties of production input data diverge from the training data distribution over time (user behavior changes, seasonal patterns, market shifts) — a model that was accurate at deployment can silently degrade without any code changes.',
        'Concept drift occurs when the actual relationship between inputs and the target outcome changes over time (what constitutes "fraud" evolves as fraudsters adapt) — this is a fundamentally different problem than data drift, since even a perfectly representative input distribution no longer predicts the correct outcome.',
        'Without monitoring prediction distributions and downstream business metrics (not just uptime and latency), a model can silently degrade in production for weeks before anyone notices, since a model serving predictions does not fail loudly the way a crashing service does.',
        'Automated retraining pipelines (triggered by detected drift or on a fixed schedule) address the reality that ML models are not "finished" at deployment the way traditional software often is — they require ongoing maintenance as the world they were trained to model keeps changing.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MLflow Tracking',
      language: 'typescript',
      code: `// MLflow experiment tracking (Python pseudocode)
// pip install mlflow scikit-learn

// import mlflow
// import mlflow.sklearn
// from sklearn.ensemble import RandomForestClassifier
// from sklearn.metrics import accuracy_score, f1_score
// from sklearn.model_selection import train_test_split

// mlflow.set_tracking_uri("http://localhost:5000")  # or "sqlite:///mlflow.db"
// mlflow.set_experiment("fraud-detection-v2")

// with mlflow.start_run(run_name="rf-hyperparam-sweep-001"):
//   # Log parameters
//   params = {"n_estimators": 200, "max_depth": 12, "min_samples_leaf": 5}
//   mlflow.log_params(params)
//   mlflow.log_param("dataset_version", "2025-06-01-v3")
//   mlflow.log_param("git_commit", subprocess.getoutput("git rev-parse HEAD"))

//   # Train
//   model = RandomForestClassifier(**params, random_state=42)
//   model.fit(X_train, y_train)

//   # Log metrics
//   preds = model.predict(X_test)
//   mlflow.log_metric("accuracy", accuracy_score(y_test, preds))
//   mlflow.log_metric("f1", f1_score(y_test, preds))

//   # Log model + signature
//   signature = mlflow.models.infer_signature(X_train, preds)
//   mlflow.sklearn.log_model(model, "model", signature=signature)

//   # Log artifacts (confusion matrix, feature importance plot)
//   mlflow.log_artifact("confusion_matrix.png")

// # Register best run to Model Registry
// best_run = mlflow.search_runs(order_by=["metrics.f1 DESC"]).iloc[0]
// model_uri = f"runs:/{best_run.run_id}/model"
// mlflow.register_model(model_uri, "FraudDetectionModel")`,
    },
    {
      label: 'vLLM Serving',
      language: 'typescript',
      code: `// vLLM: high-throughput LLM serving
// pip install vllm

// Serve a local model via OpenAI-compatible API:
// python -m vllm.entrypoints.openai.api_server \\
//   --model meta-llama/Meta-Llama-3-8B-Instruct \\
//   --max-model-len 8192 \\
//   --tensor-parallel-size 2  \\  # use 2 GPUs
//   --port 8000

// Then use it like OpenAI API (TypeScript):
import OpenAI from 'openai';

const localClient = new OpenAI({
  baseURL: 'http://localhost:8000/v1',
  apiKey: 'dummy',  // vLLM doesn't require auth by default
});

async function generateWithVllm(prompt: string): Promise<string> {
  const response = await localClient.chat.completions.create({
    model: 'meta-llama/Meta-Llama-3-8B-Instruct',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 512,
    temperature: 0.7,
  });
  return response.choices[0].message.content ?? '';
}

// BentoML serving (Python)
// import bentoml
// from bentoml.io import JSON

// runner = bentoml.sklearn.get("fraud_model:latest").to_runner()
// svc = bentoml.Service("fraud_classifier", runners=[runner])

// @svc.api(input=JSON(), output=JSON())
// async def predict(input_data: dict) -> dict:
//   features = preprocess(input_data)
//   proba = await runner.predict_proba.async_run([features])
//   return {"fraud_probability": float(proba[0][1])}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not tracking the dataset version alongside model training',
      wrong: `# Training a model with no record of what data was used
model.fit(load_latest_data(), labels)
mlflow.log_param("n_estimators", 200)
# A month later: results don't reproduce because data has changed`,
      right: `# Version your data alongside your code
import hashlib, json
data_hash = hashlib.md5(open("train.csv", "rb").read()).hexdigest()[:8]
mlflow.log_param("data_hash", data_hash)
mlflow.log_param("data_version", "2025-06-01-v3")
mlflow.log_param("git_commit", git_rev_parse_head())`,
      explanation: 'ML reproducibility requires versioning all three: code, data, and model. Without a data version or hash, you can\'t recreate the exact training run that produced a production model — making debugging and rollback impossible.',
    },
    {
      title: 'Training-serving skew',
      wrong: `# Training: compute feature inline
X_train["age_bucket"] = pd.cut(df["age"], bins=[0,18,35,65,100]).cat.codes
model.fit(X_train, y_train)

# Serving (different code path):
age_bucket = age // 25  # different bucketing logic!
model.predict([[age_bucket, ...]])  # inputs differ from training`,
      right: `# Single feature pipeline used at both train and serve time
def compute_features(df: pd.DataFrame) -> pd.DataFrame:
    df["age_bucket"] = pd.cut(df["age"], bins=[0,18,35,65,100]).cat.codes
    return df

# Training: compute_features(train_df) → model.fit(...)
# Serving:  compute_features(serving_df) → model.predict(...)`,
      explanation: 'Training-serving skew is when features are computed differently between training and production — the most common silent killer of model performance. Use a single feature function / feature store for both.',
    },
    {
      title: 'Serving LLMs with plain HuggingFace pipeline in production',
      wrong: `# Naive HuggingFace serving
from transformers import pipeline
pipe = pipeline("text-generation", model="meta-llama/Meta-Llama-3-8B-Instruct")

@app.post("/generate")
def generate(prompt: str):
    return pipe(prompt, max_new_tokens=512)[0]["generated_text"]
    # Throughput: ~5 req/s, no batching, no KV cache management`,
      right: `# Use vLLM for production LLM serving
# vllm.entrypoints.openai.api_server
# PagedAttention: 20–100× higher throughput via efficient KV cache
# Continuous batching: multiple requests share GPU time
# Typical: 50–500 req/s depending on model and GPU`,
      explanation: 'HuggingFace pipeline processes one request at a time and has poor KV cache management. vLLM\'s PagedAttention and continuous batching deliver 20–100× higher throughput for production LLM workloads.',
    },
    {
      title: 'Deploying a new model without a canary or shadow test',
      wrong: `# Straight swap in production
deploy(new_model, replace=True)  # 100% traffic immediately
# If accuracy drops: all users affected before you notice`,
      right: `# Canary: 5% → 20% → 50% → 100% with automated rollback
# Shadow: duplicate 100% of traffic, compare offline
# Feature flag: route to new model by user segment first
deploy(new_model, traffic_percent=5, rollback_if=lambda m: m.error_rate > 0.01)`,
      explanation: 'Even well-tested models can regress on production traffic distributions. Always canary deploy — route a small percentage to the new model, monitor error rate and latency, and automate rollback before increasing traffic.',
    },
  ];

  challenge: Challenge = {
    title: 'Data Drift Detection',
    language: 'typescript',
    description: 'Implement a simple Population Stability Index (PSI) calculation for a single feature. PSI < 0.1 = stable, 0.1–0.25 = moderate drift, > 0.25 = significant drift.',
    hints: [
      'PSI = sum((actual_pct - expected_pct) * ln(actual_pct / expected_pct)) for each bin',
      'Handle zero bins by replacing 0 with a small epsilon',
    ],
    starterCode: `function psi(expected: number[], actual: number[]): number {
  // expected and actual are arrays of bin proportions (should sum to 1)
  // Return PSI value
}`,
    solution: `function psi(expected: number[], actual: number[]): number {
  const eps = 1e-6;
  return expected.reduce((sum, e, i) => {
    const a = actual[i] ?? eps;
    const safeE = Math.max(e, eps);
    const safeA = Math.max(a, eps);
    return sum + (safeA - safeE) * Math.log(safeA / safeE);
  }, 0);
}
// PSI < 0.1: no significant drift
// PSI 0.1–0.25: moderate drift — investigate
// PSI > 0.25: significant drift — retrain`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is training-serving skew?',
      options: [
        'The model trains faster than it serves',
        'Feature computation differs between training and production, causing the model to see different inputs than it was trained on',
        'The model is deployed before training completes',
        'GPU skew between training and inference hardware',
      ],
      answer: 1,
      explanation: 'Training-serving skew occurs when features are computed differently at training time vs serving time. The model was optimised for one distribution but receives inputs from a different distribution — leading to silent accuracy degradation.',
    },
    {
      q: 'Why does vLLM outperform naive HuggingFace pipeline serving for LLMs?',
      options: [
        'vLLM uses a larger model',
        'vLLM implements PagedAttention for efficient KV cache management and continuous batching across concurrent requests',
        'vLLM automatically reduces the model precision',
        'vLLM runs on CPU instead of GPU',
      ],
      answer: 1,
      explanation: 'LLM serving bottleneck is GPU memory for KV caches. vLLM\'s PagedAttention allocates KV cache in non-contiguous pages (like OS virtual memory), enabling much higher batch sizes and 20–100× throughput vs sequential request processing.',
    },
    {
      q: 'What triggers a model retraining in a well-designed MLOps system?',
      options: [
        'A new developer joins the team',
        'Scheduled retrain, data drift exceeding a threshold (e.g. PSI > 0.25), or performance metric degradation',
        'Only when the user manually requests it',
        'When the model file exceeds 1GB',
      ],
      answer: 1,
      explanation: 'Production models degrade as data distributions change. Well-designed MLOps systems trigger retraining automatically: on a schedule, when drift metrics (PSI, KL divergence) cross a threshold, or when tracked production accuracy drops below baseline.',
    },
  { q: 'What is model drift and how do you detect it?', options: ['A decrease in model file size', 'Degradation in model performance caused by changes in data distribution over time', 'A hardware failure in model serving', 'A version control conflict'], answer: 1, explanation: 'Data drift: input distribution changes (covariate shift). Concept drift: the relationship between inputs and outputs changes. Detection: monitor statistical distribution of input features (KL divergence, PSI) and output predictions. Alert when metrics drop below threshold in production.' },
  { q: 'What is a feature store and what problem does it solve?', options: ['A model registry', 'A centralized repository for computed features — ensures consistency between training and serving feature pipelines', 'A data annotation tool', 'A GPU cluster for feature engineering'], answer: 1, explanation: 'Feature store solves training-serving skew: the same feature logic runs offline (batch) for training and online (real-time) for serving. Without a feature store, teams reimplement features in two places, causing subtle differences. Examples: Feast, Tecton, Vertex AI Feature Store.' },
  { q: 'What does a model registry store and why is it needed?', options: ['Raw training data', 'Versioned model artifacts with metadata, lineage, and deployment history', 'Feature engineering code only', 'User prediction logs'], answer: 1, explanation: 'Model registry (MLflow, SageMaker Model Registry): stores trained model artifacts, hyperparameters, metrics, training data version, and deployment status. Enables rollback (deploy previous version on failure), A/B testing, approval workflows, and audit trails for production models.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between data drift and concept drift?',
      a: 'Data drift (covariate shift): the input feature distribution P(X) changes — e.g. average transaction amount increases post-inflation. The model hasn\'t seen this range. Detectable with PSI or KS test on features, no labels needed. Concept drift: the relationship between inputs and target P(Y|X) changes — e.g. fraud patterns evolve to evade the model. The model\'s features look similar but the labels for similar inputs change. Requires labelled production data to detect. Both cause performance degradation but need different detection methods.',
    },
    {
      q: 'How do I version ML models and roll back if needed?',
      a: 'Use a model registry (MLflow, W&B, HuggingFace Hub) with semantic versioning and stage transitions: Staging → Production → Archived. Tag every model with: git commit hash, dataset version, evaluation metrics, training date. For rollback: keep the previous Production model in Staging or Archived stage. Canary deployments make rollback instant — just re-route traffic. Never delete old model versions until you\'re confident the new one is stable in production for at least 2 weeks.',
    },
  { q: 'How do you implement A/B testing for ML models in production?', a: 'A/B test: route a percentage of traffic (shadow mode: 5-10%; or live split: 50/50) to the new model. Track business metrics (CTR, revenue, retention) and model metrics (latency, error rate, accuracy) for each variant. Run for sufficient time to achieve statistical significance (typically 1-2 weeks). Use a feature flag system for easy rollback. Shadow mode: new model runs in parallel, results logged but not shown to users (zero risk A/B testing).' },
  { q: 'What is the ML training pipeline and what does it include?', a: 'ML training pipeline: (1) Data ingestion and validation (Great Expectations, TFDV for schema/statistics checks); (2) Feature engineering; (3) Train/val/test split; (4) Model training with hyperparameter tuning (Optuna, Ray Tune); (5) Model evaluation against held-out test set; (6) Model registry push if metrics pass threshold; (7) Deployment approval. Orchestrated by Kubeflow, Airflow, or cloud-native services (SageMaker Pipelines, Vertex AI Pipelines). Triggered on new data or on schedule.' },
  { q: 'How do you monitor an ML model in production?', a: 'Monitoring layers: (1) Infrastructure metrics: latency, throughput, GPU/CPU usage, error rate (standard observability); (2) Data drift: statistical tests on input feature distributions vs training distribution (PSI, KS test, Jensen-Shannon divergence); (3) Prediction drift: distribution of model outputs has shifted; (4) Business metric: downstream impact (sales, engagement) — the ultimate judge. Alert thresholds: set on validation performance, retrain automatically when drift exceeds threshold.' },
  { q: 'What is the difference between online and batch model serving?', a: 'Batch serving: run predictions periodically on a large dataset, store results. Latency is not critical; throughput matters. Example: daily churn prediction, nightly recommendation refresh. Online serving: real-time predictions via REST/gRPC API, sub-100ms latency. Requires model server (TorchServe, TF Serving, Triton), load balancing, and autoscaling. Hybrid: feature computation in batch (stored in feature store), fast online lookup + model inference for real-time prediction.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'MLOps = CI/CD for models. Version code+data+model. Track experiments with MLflow/W&B. Serve LLMs with vLLM. Monitor drift, retrain on threshold, canary-deploy to production.',
    mustKnow: [
      'Version all three: code (git), data (hash/DVC), model (registry)',
      'Training-serving skew: use one feature pipeline for both train and serve',
      'Experiment tracking: log params, metrics, artifacts, data version per run',
      'vLLM: PagedAttention + continuous batching = 20–100× throughput vs naive serving',
      'Monitoring: data drift (PSI > 0.25 = retrain), concept drift needs labels',
      'Canary: 5% → 20% → 100% with automated rollback on error rate',
    ],
    interviewFocus: [
      'What is training-serving skew and how do you prevent it?',
      'How does vLLM achieve higher throughput than naive HuggingFace serving?',
      'Describe a complete CI/CD pipeline for an ML model',
    ],
  };
}
