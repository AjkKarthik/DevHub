import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';

@Component({
  selector: 'app-ai-responsible-ai',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent],
  templateUrl: './responsible-ai.html',
  styleUrl: './responsible-ai.scss',
})
export class AiResponsibleAi {
  quickRef: QuickRefItem[] = [
    { name: 'Hallucination',     type: 'keyword', desc: 'Model generates plausible but factually incorrect content. Ground responses in retrieved context.' },
    { name: 'Fairness',          type: 'keyword', desc: 'Equitable outcomes across demographic groups. Measure demographic parity, equalised odds.' },
    { name: 'Bias',              type: 'keyword', desc: 'Systematic error favouring or disfavouring groups — in data, labels, or model architecture.' },
    { name: 'Explainability',    type: 'keyword', desc: 'SHAP, LIME — explain why a model made a specific prediction. Required in regulated industries.' },
    { name: 'Privacy',           type: 'keyword', desc: 'Training data memorisation, PII leakage. Mitigated by differential privacy, data minimisation.' },
    { name: 'GDPR / AI Act',     type: 'keyword', desc: 'EU regulations: right to explanation, prohibited uses (social scoring), high-risk AI classification.' },
    { name: 'Constitutional AI', type: 'keyword', desc: 'Anthropic\'s technique: model critiques and revises its own outputs against a set of principles.' },
    { name: 'Red teaming',       type: 'keyword', desc: 'Adversarial testing: attempt to elicit harmful outputs, jailbreaks, biased responses before deployment.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Bias and Fairness',
      points: [
        'Sources of bias: (1) Historical bias — training data reflects past discrimination. (2) Representation bias — under-represented groups. (3) Label bias — annotators\' subjective judgement. (4) Measurement bias — proxy variables that correlate with protected attributes.',
        'Fairness metrics: Demographic Parity (equal positive rates across groups), Equalised Odds (equal TPR and FPR), Individual Fairness (similar individuals treated similarly).',
        'Fairness is context-dependent — no single metric applies everywhere. Equalised odds is preferred for high-stakes decisions (loan approval, hiring).',
        'Mitigation: pre-processing (resampling, reweighting), in-processing (adversarial debiasing), post-processing (threshold adjustment per group).',
        'Bias audit: before deployment, evaluate model performance per demographic group using disaggregated metrics — overall accuracy can hide disparity.',
      ],
    },
    {
      heading: 'Hallucination and Reliability',
      points: [
        'LLMs generate plausible-sounding text regardless of factual correctness — the model optimises for likely next tokens, not truth.',
        'Mitigation: RAG (ground in retrieved documents), citation forcing (require model to quote source), faithfulness scoring, temperature 0 for factual tasks.',
        'Calibration: a well-calibrated model says "I\'m 80% confident" and is right 80% of the time. Most LLMs are overconfident.',
        'Self-consistency: sample 5–10 completions, take the majority answer — reduces hallucination on reasoning tasks.',
        'Structured uncertainty: ask the model to rate its confidence and flag when it\'s unsure — then route to a human for those cases.',
      ],
    },
    {
      heading: 'Privacy and Data Governance',
      points: [
        'Memorisation: LLMs memorise training data. Rare or repeated sequences (emails, code, personal data) can be extracted via targeted prompts.',
        'Differential Privacy (DP): add calibrated Gaussian noise to gradients during training. Provides formal privacy guarantees (ε, δ). Used by Apple, Google for on-device models.',
        'PII in prompts: redact or tokenise PII before sending to third-party LLM APIs. Don\'t send names, emails, medical, or financial data to cloud APIs without explicit consent.',
        'Right to erasure (GDPR Art. 17): if a user\'s data was in training, "forgetting" it is an open research problem — machine unlearning is computationally expensive.',
        'Data minimisation: collect only what you need. For AI features: do you need the raw user message, or just the intent classification result?',
      ],
    },
    {
      heading: 'Regulation and Governance',
      points: [
        'EU AI Act (2025): risk-based framework. Prohibited: social scoring, real-time biometric surveillance. High-risk: recruitment, credit, law enforcement, medical. Requires transparency, human oversight, robustness testing.',
        'GDPR Art. 22: right not to be subject to fully automated decisions that significantly affect you. Must offer human review.',
        'Right to explanation: for automated decisions, individuals have the right to know the logic involved — pushes for explainability (SHAP, LIME).',
        'Watermarking: embed detectable signatures in AI-generated content. C2PA metadata standard for provenance.',
        'Model cards: standardised documentation of model purpose, training data, performance, limitations, and bias evaluation. Required for responsible deployment.',
      ],
    },
    {
      heading: 'Auditing for Bias Before and After Deployment',
      points: [
        'Pre-deployment bias audits evaluate model performance across demographic subgroups on held-out test data, surfacing disparate error rates before they affect real users — waiting until production to discover bias is both ethically and legally riskier.',
        'Bias can be introduced at multiple stages (skewed training data, proxy features correlated with protected attributes, evaluation metrics that mask subgroup disparities) — auditing only the final model output misses root causes upstream in the pipeline.',
        'Post-deployment monitoring should track outcome disparities across user segments over time, since bias can emerge or worsen after launch as the production population and usage patterns diverge from the original training and evaluation data.',
        'Fairness metrics (demographic parity, equalized odds) can conflict with each other mathematically — satisfying one can make another worse, meaning teams must make an explicit, documented choice about which fairness definition matters most for their specific application.',
      ],
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the most reliable way to reduce LLM hallucination in a production application?',
      options: [
        'Use a larger model',
        'Ground responses in retrieved context (RAG) and instruct the model to answer only from that context',
        'Increase the temperature',
        'Use chain-of-thought prompting',
      ],
      answer: 1,
      explanation: 'RAG grounds the model in verifiable documents. With a strong grounding prompt ("Answer only from the context below; say I don\'t know if absent"), the model has no need to fabricate. Faithfulness scoring can catch remaining hallucinations.',
    },
    {
      q: 'What does "demographic parity" mean as a fairness metric?',
      options: [
        'Equal sample sizes per demographic group in training data',
        'Equal positive prediction rates across demographic groups',
        'Equal model accuracy across groups',
        'Equal representation on the development team',
      ],
      answer: 1,
      explanation: 'Demographic parity requires that P(ŷ=1 | group=A) = P(ŷ=1 | group=B). A loan model satisfies demographic parity if it approves the same fraction of applicants regardless of group. It doesn\'t account for different base rates — for that, use equalised odds.',
    },
    {
      q: 'What is the EU AI Act\'s risk classification for AI used in recruitment?',
      options: [
        'Prohibited',
        'High-risk (requires transparency, human oversight, conformity assessment)',
        'Low-risk (only transparency obligation)',
        'Minimal-risk (no requirements)',
      ],
      answer: 1,
      explanation: 'The EU AI Act classifies AI used in recruitment, promotion, task allocation, and performance monitoring of workers as High-Risk. This requires: risk management, data governance, transparency documentation, human oversight, and accuracy & robustness testing.',
    },
  { q: 'What is the difference between fairness through unawareness and equality of opportunity?', options: ['They are identical fairness definitions', 'Unawareness: ignore sensitive attributes; equality of opportunity: equal true positive rates across groups', 'Unawareness is legally required; opportunity is optional', 'Opportunity means equal error rates across all groups'], answer: 1, explanation: 'Fairness through unawareness: remove protected attributes from features. Fails because correlated features proxy for them. Equality of opportunity: require equal TPR across groups (positive predictions are equally accessible). No single definition satisfies all fairness criteria simultaneously — choose based on context.' },
  { q: 'What is differential privacy and how is it used in ML?', options: ['Encrypting model weights', 'A mathematical guarantee that a model reveals no more about any individual than if they were excluded from training', 'Preventing API key leaks', 'Using synthetic data only'], answer: 1, explanation: 'Differential privacy (DP): add calibrated noise to training gradients (DP-SGD) so the model cannot memorize individual training examples. Epsilon (privacy budget) controls the tradeoff: lower epsilon = stronger privacy = more noise = lower accuracy. Used by Apple, Google, Meta for private ML on user data.' },
  { q: 'What is the EU AI Act and how does it classify AI risk?', options: ['A US regulation for AI safety', 'EU legislation classifying AI into risk tiers (unacceptable, high, limited, minimal) with requirements per tier', 'A voluntary code of conduct', 'A regulation for AI hardware only'], answer: 1, explanation: 'EU AI Act (2024): unacceptable risk (banned: social scoring, real-time biometric surveillance). High risk (regulated: recruitment, credit, law enforcement — requires transparency, human oversight, data governance). Limited risk: chatbots must disclose they are AI. Minimal: video games. Non-compliance: up to 7% global revenue fines.' }
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I audit an AI model for bias before deployment?',
      a: 'Disaggregated evaluation: compute performance metrics (accuracy, FPR, FNR) separately for each demographic group. Use a representative holdout set that reflects the deployment population. Red-team testing: deliberately craft inputs targeting edge cases for minority groups. Check for proxy discrimination: even if your model doesn\'t use race, correlated features (zip code, name) can encode it. Tools: Fairlearn (Microsoft), AI Fairness 360 (IBM), Aequitas. Bias audit report: document findings, acceptable thresholds, and mitigations. Review with domain experts and affected communities before shipping.',
    },
    {
      q: 'How should I handle PII when building AI features?',
      a: 'Before sending to LLM: (1) Identify PII in the request (name, email, phone, national ID, health data). (2) Redact or tokenise — replace "John Smith" with "[PERSON_1]". (3) Or use a local model for PII-sensitive workflows. At inference: disable LLM provider\'s data retention (OpenAI: set no storage header; Anthropic: similar). In your logs: store only the prompt hash and response hash, not content. For the EU: your LLM API provider is a data processor — you need a DPA (Data Processing Agreement) and must inform users. For healthcare (US): HIPAA-covered data may not be sent to third-party APIs without a BAA (Business Associate Agreement).',
    },
    {
      q: 'What is Constitutional AI (CAI) and how does it differ from RLHF?',
      a: 'Constitutional AI (Anthropic) is an alignment technique where the model learns to follow a set of principles (a "constitution") without needing human ratings for every response. Process: (1) Generate an initial response to a harmful prompt. (2) Ask the model to critique the response against each constitutional principle ("Is this response harmful?"). (3) Ask the model to revise the response. (4) Use these (prompt, revision) pairs as SFT data. (5) Use AI-generated preference data (model ranks its own outputs) instead of human raters for RLHF. Benefits: scales human oversight, reduces bias in labelling, more consistent principle application. RLHF relies on human raters — expensive, slow, and subject to annotator disagreement.',
    },
    {
      q: 'What are the practical steps for red-teaming an LLM product?',
      a: 'Red-teaming is adversarial testing before deployment: (1) Assemble a diverse red team including people from groups the model may harm. (2) Categories to probe: harmful content (violence, CSAM, weapons), misinformation, bias (racial, gender, religious stereotypes), privacy (PII extraction, memorisation), jailbreaks (prompt injection to bypass guardrails), off-topic use. (3) Document successful attacks and the outputs they produced. (4) Categorise by severity and likelihood. (5) Fix: add training examples, guard rails, or output classifiers for each attack type. (6) Re-test after fixes. Tools: Garak (LLM vulnerability scanner), PromptBench, Microsoft PyRIT. Red-team continuously — new jailbreaks emerge constantly.',
    },
  { q: 'How do you document AI model limitations and biases?', a: 'Model Cards (Mitchell et al., Google): structured documentation template covering: model purpose and intended uses, out-of-scope uses, training data and evaluation datasets, quantitative performance metrics broken down by subgroups, bias considerations, recommendations, and caveats. Datasheets for Datasets: similar documentation for training data. Required for responsible AI deployment — publish model cards for every production model.' },
  { q: 'What is explainability vs interpretability in AI?', a: 'Interpretability: the model itself is understandable (linear regression coefficients, decision tree rules). Explainability: using post-hoc methods to explain a black-box model\'s predictions (SHAP, LIME). SHAP: additive attribution — each feature\'s contribution to a prediction is computed game-theoretically. LIME: locally approximate black-box with an interpretable model around one prediction. For high-stakes decisions (credit, healthcare), explainability may be legally required.' },
  ];
}
